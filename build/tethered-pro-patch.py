from pathlib import Path
import re

ROOT = Path("high-style-match")

def read(rel):
    return (ROOT / rel).read_text()

def write(rel, text):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)

cargo = read("src-tauri/Cargo.toml")
if re.search(r"(?m)^notify\s*=", cargo) is None:
    marker = "\n[dev-dependencies]"
    if marker not in cargo:
        raise SystemExit("Could not find [dev-dependencies] in Cargo.toml")
    cargo = cargo.replace(marker, '\nnotify = "8"\n' + marker, 1)
    write("src-tauri/Cargo.toml", cargo)

tether_rs = r'''use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
    sync::{
        mpsc::{self, RecvTimeoutError},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::{db, file_manager, models::PhotoRecord, thumbnails};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TetherStatus {
    pub active: bool,
    pub shoot_id: Option<i64>,
    pub folder: Option<String>,
    pub shot_list_item_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TetherCaptureEvent {
    photo: PhotoRecord,
    shot_list_item_id: Option<i64>,
    folder: String,
    captured_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TetherErrorEvent {
    message: String,
    path: Option<String>,
}

struct TetherControl {
    shoot_id: i64,
    folder: String,
    target: Arc<Mutex<Option<i64>>>,
    stop_tx: mpsc::Sender<()>,
}

#[derive(Default)]
pub struct TetherManager {
    inner: Mutex<Option<TetherControl>>,
}

fn status_for(control: Option<&TetherControl>) -> TetherStatus {
    match control {
        Some(control) => TetherStatus {
            active: true,
            shoot_id: Some(control.shoot_id),
            folder: Some(control.folder.clone()),
            shot_list_item_id: control.target.lock().ok().and_then(|x| *x),
        },
        None => TetherStatus {
            active: false,
            shoot_id: None,
            folder: None,
            shot_list_item_id: None,
        },
    }
}

fn stop_current(manager: &TetherManager) -> Result<(), String> {
    let mut guard = manager.inner.lock().map_err(|_| "Tether manager lock failed.".to_string())?;
    if let Some(control) = guard.take() {
        let _ = control.stop_tx.send(());
    }
    Ok(())
}

fn validate_target(app: &AppHandle, shoot_id: i64, shot_list_item_id: Option<i64>) -> Result<(), String> {
    let Some(item_id) = shot_list_item_id else { return Ok(()); };
    let conn = db::open(app)?;
    let owner: Option<i64> = conn
        .query_row("SELECT shoot_id FROM shot_list_items WHERE id=?1", [item_id], |row| row.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    if owner != Some(shoot_id) {
        return Err("The selected tether target belongs to a different shoot.".into());
    }
    Ok(())
}

#[tauri::command]
pub fn start_tether_watch(
    app: AppHandle,
    manager: State<'_, TetherManager>,
    shoot_id: i64,
    folder: String,
    shot_list_item_id: Option<i64>,
) -> Result<TetherStatus, String> {
    let folder_path = PathBuf::from(&folder);
    if !folder_path.exists() || !folder_path.is_dir() {
        return Err("Choose an existing Capture One Capture folder.".into());
    }
    validate_target(&app, shoot_id, shot_list_item_id)?;
    stop_current(&manager)?;

    let target = Arc::new(Mutex::new(shot_list_item_id));
    let target_for_thread = Arc::clone(&target);
    let folder_for_thread = folder_path.clone();
    let folder_label = folder_path.to_string_lossy().to_string();
    let folder_label_for_thread = folder_label.clone();
    let (stop_tx, stop_rx) = mpsc::channel::<()>();

    thread::Builder::new()
        .name("high-style-match-tether".into())
        .spawn(move || {
            if let Err(error) = run_watcher(
                app.clone(),
                shoot_id,
                folder_for_thread,
                folder_label_for_thread,
                target_for_thread,
                stop_rx,
            ) {
                let _ = app.emit(
                    "tether-error",
                    TetherErrorEvent { message: error, path: None },
                );
            }
        })
        .map_err(|e| format!("Could not start Capture One watcher: {e}"))?;

    let mut guard = manager.inner.lock().map_err(|_| "Tether manager lock failed.".to_string())?;
    *guard = Some(TetherControl {
        shoot_id,
        folder: folder_label,
        target,
        stop_tx,
    });
    Ok(status_for(guard.as_ref()))
}

#[tauri::command]
pub fn stop_tether_watch(manager: State<'_, TetherManager>) -> Result<TetherStatus, String> {
    stop_current(&manager)?;
    Ok(TetherStatus { active: false, shoot_id: None, folder: None, shot_list_item_id: None })
}

#[tauri::command]
pub fn set_tether_target(
    app: AppHandle,
    manager: State<'_, TetherManager>,
    shot_list_item_id: Option<i64>,
) -> Result<TetherStatus, String> {
    let guard = manager.inner.lock().map_err(|_| "Tether manager lock failed.".to_string())?;
    let control = guard.as_ref().ok_or("Tethered Shoot is not currently watching a folder.")?;
    validate_target(&app, control.shoot_id, shot_list_item_id)?;
    *control.target.lock().map_err(|_| "Tether target lock failed.".to_string())? = shot_list_item_id;
    Ok(status_for(Some(control)))
}

#[tauri::command]
pub fn get_tether_status(manager: State<'_, TetherManager>) -> Result<TetherStatus, String> {
    let guard = manager.inner.lock().map_err(|_| "Tether manager lock failed.".to_string())?;
    Ok(status_for(guard.as_ref()))
}

fn run_watcher(
    app: AppHandle,
    shoot_id: i64,
    folder: PathBuf,
    folder_label: String,
    target: Arc<Mutex<Option<i64>>>,
    stop_rx: mpsc::Receiver<()>,
) -> Result<(), String> {
    let mut seen: HashSet<PathBuf> = file_manager::collect_photo_paths(&[folder.to_string_lossy().to_string()])?
        .into_iter()
        .collect();

    let (event_tx, event_rx) = mpsc::channel::<notify::Result<Event>>();
    let mut watcher = RecommendedWatcher::new(
        move |result: notify::Result<Event>| {
            let _ = event_tx.send(result);
        },
        Config::default(),
    )
    .map_err(|e| format!("Could not create filesystem watcher: {e}"))?;

    watcher
        .watch(&folder, RecursiveMode::Recursive)
        .map_err(|e| format!("Could not watch {}: {e}", folder.display()))?;

    loop {
        if stop_rx.try_recv().is_ok() {
            break;
        }

        match event_rx.recv_timeout(Duration::from_millis(250)) {
            Ok(Ok(event)) => {
                for path in event.paths {
                    if seen.contains(&path) || !path.is_file() || !file_manager::is_supported_photo(&path) {
                        continue;
                    }
                    if !wait_until_stable(&path) {
                        continue;
                    }

                    let current_target = target.lock().ok().and_then(|x| *x);
                    match import_tether_photo(&app, shoot_id, &path, current_target) {
                        Ok(photo) => {
                            seen.insert(path.clone());
                            let captured_at = chrono::Utc::now().to_rfc3339();
                            let _ = app.emit(
                                "tether-capture",
                                TetherCaptureEvent {
                                    photo,
                                    shot_list_item_id: current_target,
                                    folder: folder_label.clone(),
                                    captured_at,
                                },
                            );
                        }
                        Err(message) => {
                            let _ = app.emit(
                                "tether-error",
                                TetherErrorEvent {
                                    message,
                                    path: Some(path.to_string_lossy().to_string()),
                                },
                            );
                        }
                    }
                }
            }
            Ok(Err(error)) => {
                let _ = app.emit(
                    "tether-error",
                    TetherErrorEvent {
                        message: format!("Capture folder watcher error: {error}"),
                        path: None,
                    },
                );
            }
            Err(RecvTimeoutError::Timeout) => {}
            Err(RecvTimeoutError::Disconnected) => break,
        }
    }

    Ok(())
}

fn wait_until_stable(path: &Path) -> bool {
    let mut last_size = None;
    let mut stable_checks = 0_u8;

    for _ in 0..60 {
        match fs::metadata(path) {
            Ok(metadata) if metadata.is_file() && metadata.len() > 0 => {
                let size = metadata.len();
                if last_size == Some(size) {
                    stable_checks += 1;
                    if stable_checks >= 2 {
                        return true;
                    }
                } else {
                    last_size = Some(size);
                    stable_checks = 0;
                }
            }
            _ => {
                stable_checks = 0;
                last_size = None;
            }
        }
        thread::sleep(Duration::from_millis(200));
    }
    false
}

fn import_tether_photo(
    app: &AppHandle,
    shoot_id: i64,
    path: &Path,
    shot_list_item_id: Option<i64>,
) -> Result<PhotoRecord, String> {
    if !file_manager::is_supported_photo(path) {
        return Err(format!("Unsupported photograph: {}", path.display()));
    }

    validate_target(app, shoot_id, shot_list_item_id)?;
    let metadata = fs::metadata(path).map_err(|e| format!("Could not inspect {}: {e}", path.display()))?;
    let file_size = metadata.len() as i64;
    let modified_ns = metadata
        .modified()
        .ok()
        .and_then(|x| x.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_nanos().min(i64::MAX as u128) as i64);

    let (thumb, technical_note) = match thumbnails::generate(app, path) {
        Ok(info) => (info, None),
        Err(error) => (
            thumbnails::fallback(app, path, "PREVIEW")?,
            Some(format!("Preview unavailable: {error}")),
        ),
    };

    let filename = path
        .file_name()
        .and_then(|x| x.to_str())
        .ok_or_else(|| format!("Filename is not valid Unicode: {}", path.display()))?
        .to_string();
    let extension = path.extension().and_then(|x| x.to_str()).unwrap_or("").to_string();
    let source_path = path.to_string_lossy().to_string();
    let thumbnail_path = thumb.thumbnail_path.to_string_lossy().to_string();
    let width = thumb.width.map(i64::from);
    let height = thumb.height.map(i64::from);
    let now = chrono::Utc::now().to_rfc3339();

    let conn = db::open(app)?;
    conn.execute(
        r#"INSERT INTO images (shoot_id, source_path, original_filename, extension, orientation, width, height, thumbnail_path, file_size, modified_ns, technical_note, imported_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
           ON CONFLICT(shoot_id, source_path) DO UPDATE SET original_filename=excluded.original_filename, extension=excluded.extension, orientation=excluded.orientation,
             width=excluded.width, height=excluded.height, thumbnail_path=excluded.thumbnail_path, file_size=excluded.file_size, modified_ns=excluded.modified_ns, technical_note=excluded.technical_note"#,
        params![shoot_id, source_path, filename, extension, thumb.orientation, width, height, thumbnail_path, file_size, modified_ns, technical_note, now],
    )
    .map_err(|e| format!("Could not record tethered photo {}: {e}", path.display()))?;

    let image_id: i64 = conn
        .query_row(
            "SELECT id FROM images WHERE shoot_id=?1 AND source_path=?2",
            params![shoot_id, source_path],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if let Some(item_id) = shot_list_item_id {
        conn.execute(
            "INSERT INTO matches (image_id, shot_list_item_id, confidence, method, updated_at) VALUES (?1, ?2, 1.0, 'tether', ?3) ON CONFLICT(image_id) DO UPDATE SET shot_list_item_id=excluded.shot_list_item_id, confidence=1.0, method='tether', updated_at=excluded.updated_at",
            params![image_id, item_id, chrono::Utc::now().to_rfc3339()],
        )
        .map_err(|e| format!("Could not attach incoming photo to the current requirement: {e}"))?;
    }

    recompute_status(&conn, shoot_id)?;
    photo_by_id(&conn, image_id)
}

fn recompute_status(conn: &rusqlite::Connection, shoot_id: i64) -> Result<(), String> {
    let photos: i64 = conn
        .query_row("SELECT COUNT(*) FROM images WHERE shoot_id=?1", [shoot_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let requirements: i64 = conn
        .query_row("SELECT COUNT(*) FROM shot_list_items WHERE shoot_id=?1 AND ignored=0 AND intentionally_not_photographed=0", [shoot_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let matched: i64 = conn
        .query_row("SELECT COUNT(DISTINCT m.shot_list_item_id) FROM matches m JOIN images i ON i.id=m.image_id WHERE i.shoot_id=?1 AND m.shot_list_item_id IS NOT NULL", [shoot_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let status = if photos == 0 {
        "Draft"
    } else if requirements > 0 && matched >= requirements {
        "Ready to Rename"
    } else {
        "Needs Review"
    };
    conn.execute(
        "UPDATE shoots SET status=?2, updated_at=?3 WHERE id=?1 AND status <> 'Renamed'",
        params![shoot_id, status, chrono::Utc::now().to_rfc3339()],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn photo_by_id(conn: &rusqlite::Connection, image_id: i64) -> Result<PhotoRecord, String> {
    conn.query_row(
        r#"SELECT i.id, i.shoot_id, i.source_path, i.original_filename, i.extension, i.orientation, i.width, i.height, i.thumbnail_path,
                  m.shot_list_item_id, i.favourite, i.review_state, i.technical_note, i.imported_at
           FROM images i LEFT JOIN matches m ON m.image_id=i.id WHERE i.id=?1"#,
        [image_id],
        |row| {
            Ok(PhotoRecord {
                id: row.get(0)?,
                shoot_id: row.get(1)?,
                source_path: row.get(2)?,
                original_filename: row.get(3)?,
                extension: row.get(4)?,
                orientation: row.get(5)?,
                width: row.get(6)?,
                height: row.get(7)?,
                thumbnail_path: row.get(8)?,
                assigned_shot_list_item_id: row.get(9)?,
                favourite: row.get::<_, i64>(10)? != 0,
                review_state: row.get(11)?,
                technical_note: row.get(12)?,
                imported_at: row.get(13)?,
            })
        },
    )
    .map_err(|e| format!("Could not load tethered photograph: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn inactive_status_is_clear() {
        let status = status_for(None);
        assert!(!status.active);
        assert!(status.folder.is_none());
        assert!(status.shot_list_item_id.is_none());
    }
}
'''
write("src-tauri/src/tether.rs", tether_rs)

lib = read("src-tauri/src/lib.rs")
if "mod tether;" not in lib:
    lib = lib.replace("mod thumbnails;", "mod thumbnails;\nmod tether;", 1)
if ".manage(tether::TetherManager::default())" not in lib:
    lib = lib.replace(
        ".plugin(tauri_plugin_dialog::init())",
        ".plugin(tauri_plugin_dialog::init())\n        .manage(tether::TetherManager::default())",
        1,
    )
if "tether::start_tether_watch" not in lib:
    lib = lib.replace(
        "commands::save_settings,\n",
        "commands::save_settings,\n            tether::start_tether_watch,\n            tether::stop_tether_watch,\n            tether::set_tether_target,\n            tether::get_tether_status,\n",
        1,
    )
write("src-tauri/src/lib.rs", lib)

types = read("src/types.ts")
if "export interface TetherStatus" not in types:
    types += r'''

export interface TetherStatus {
  active: boolean;
  shootId: number | null;
  folder: string | null;
  shotListItemId: number | null;
}

export interface TetherCaptureEvent {
  photo: PhotoRecord;
  shotListItemId: number | null;
  folder: string;
  capturedAt: string;
}

export interface TetherErrorEvent {
  message: string;
  path: string | null;
}
'''
    write("src/types.ts", types)

desktop = read("src/services/desktop.ts")
if "TetherCaptureEvent" not in desktop.split("} from '../types';", 1)[0]:
    desktop = desktop.replace(
        "  ShotListItem\n} from '../types';",
        "  ShotListItem,\n  TetherCaptureEvent,\n  TetherErrorEvent,\n  TetherStatus\n} from '../types';",
        1,
    )

if "export async function selectCaptureFolder" not in desktop:
    anchor = "export async function selectPhotoFolder(): Promise<string | null> {\n  if (!isDesktop) return null;\n  const result = await open({ directory: true, multiple: false, title: 'Select shoot folder' });\n  return typeof result === 'string' ? result : null;\n}\n"
    addition = anchor + r'''

export async function selectCaptureFolder(): Promise<string | null> {
  if (!isDesktop) return null;
  const result = await open({
    directory: true,
    multiple: false,
    title: 'Select Capture One Capture folder'
  });
  return typeof result === 'string' ? result : null;
}
'''
    if anchor not in desktop:
        raise SystemExit("selectPhotoFolder anchor not found")
    desktop = desktop.replace(anchor, addition, 1)

if "export async function startTetherWatch" not in desktop:
    anchor = "export async function ask(question: string, title = 'High Style Match'): Promise<boolean> {"
    tether_api = r'''
export async function startTetherWatch(shootId: number, folder: string, shotListItemId: number | null): Promise<TetherStatus> {
  if (!isDesktop) return { active: false, shootId: null, folder: null, shotListItemId: null };
  return call('start_tether_watch', { shootId, folder, shotListItemId });
}

export async function stopTetherWatch(): Promise<TetherStatus> {
  if (!isDesktop) return { active: false, shootId: null, folder: null, shotListItemId: null };
  return call('stop_tether_watch');
}

export async function setTetherTarget(shotListItemId: number | null): Promise<TetherStatus> {
  if (!isDesktop) return { active: false, shootId: null, folder: null, shotListItemId };
  return call('set_tether_target', { shotListItemId });
}

export async function getTetherStatus(): Promise<TetherStatus> {
  if (!isDesktop) return { active: false, shootId: null, folder: null, shotListItemId: null };
  return call('get_tether_status');
}

export async function onTetherCapture(handler: (capture: TetherCaptureEvent) => void): Promise<UnlistenFn> {
  if (!isDesktop) return () => undefined;
  return listen<TetherCaptureEvent>('tether-capture', (event) => handler(event.payload));
}

export async function onTetherError(handler: (error: TetherErrorEvent) => void): Promise<UnlistenFn> {
  if (!isDesktop) return () => undefined;
  return listen<TetherErrorEvent>('tether-error', (event) => handler(event.payload));
}

'''
    if anchor not in desktop:
        raise SystemExit("ask() anchor not found")
    desktop = desktop.replace(anchor, tether_api + anchor, 1)
write("src/services/desktop.ts", desktop)

panel = r'''import { useEffect, useMemo, useState } from 'react';
import {
  getTetherStatus,
  inform,
  onTetherCapture,
  onTetherError,
  runningInDesktop,
  selectCaptureFolder,
  setTetherTarget,
  startTetherWatch,
  stopTetherWatch,
  thumbnailUrl
} from '../services/desktop';
import type { PhotoRecord, ShotListItem, TetherCaptureEvent, TetherStatus } from '../types';

interface Props {
  shootId: number;
  shotItems: ShotListItem[];
  photos: PhotoRecord[];
  onPhotoArrived: (photo: PhotoRecord) => void;
}

const inactive: TetherStatus = { active: false, shootId: null, folder: null, shotListItemId: null };

export function TetheredShootPanel({ shootId, shotItems, photos, onPhotoArrived }: Props) {
  const activeItems = useMemo(
    () => shotItems.filter((item) => item.id && !item.ignored && !item.intentionallyNotPhotographed),
    [shotItems]
  );
  const [status, setStatus] = useState<TetherStatus>(inactive);
  const [folder, setFolder] = useState('');
  const [targetId, setTargetId] = useState<number | null>(activeItems[0]?.id ?? null);
  const [latest, setLatest] = useState<TetherCaptureEvent | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (targetId == null && activeItems[0]?.id) setTargetId(activeItems[0].id);
  }, [activeItems, targetId]);

  useEffect(() => {
    let stopCapture: (() => void) | undefined;
    let stopError: (() => void) | undefined;

    getTetherStatus().then((current) => {
      setStatus(current);
      if (current.active && current.shootId === shootId) {
        setFolder(current.folder ?? '');
        if (current.shotListItemId != null) setTargetId(current.shotListItemId);
      }
    }).catch((err) => setError(String(err)));

    onTetherCapture((capture) => {
      if (capture.photo.shootId !== shootId) return;
      setLatest(capture);
      setStatus((current) => ({ ...current, active: true, shootId, folder: capture.folder, shotListItemId: capture.shotListItemId }));
      onPhotoArrived(capture.photo);
    }).then((stop) => { stopCapture = stop; }).catch((err) => setError(String(err)));

    onTetherError((event) => {
      setError(`${event.message}${event.path ? ` · ${event.path}` : ''}`);
    }).then((stop) => { stopError = stop; }).catch((err) => setError(String(err)));

    return () => { stopCapture?.(); stopError?.(); };
  }, [shootId]);

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    for (const photo of photos) {
      if (photo.assignedShotListItemId) {
        map.set(photo.assignedShotListItemId, (map.get(photo.assignedShotListItemId) ?? 0) + 1);
      }
    }
    return map;
  }, [photos]);

  const covered = activeItems.filter((item) => item.id && (counts.get(item.id) ?? 0) > 0).length;
  const missing = activeItems.filter((item) => item.id && !(counts.get(item.id) ?? 0));
  const currentIndex = Math.max(0, activeItems.findIndex((item) => item.id === targetId));
  const current = activeItems[currentIndex] ?? null;
  const watchingThisShoot = status.active && status.shootId === shootId;

  async function chooseFolder() {
    const selected = await selectCaptureFolder();
    if (selected) {
      setFolder(selected);
      setError('');
    }
  }

  async function start() {
    if (!runningInDesktop()) {
      await inform('Real-time Capture One folder watching runs in the High Style Match desktop app.');
      return;
    }
    if (!folder) {
      const selected = await selectCaptureFolder();
      if (!selected) return;
      setFolder(selected);
      await startWith(selected);
      return;
    }
    await startWith(folder);
  }

  async function startWith(selectedFolder: string) {
    setBusy('Starting Capture One watcher…');
    setError('');
    try {
      const next = await startTetherWatch(shootId, selectedFolder, targetId);
      setStatus(next);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy('');
    }
  }

  async function stop() {
    setBusy('Stopping tether…');
    try {
      setStatus(await stopTetherWatch());
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy('');
    }
  }

  async function changeTarget(id: number | null) {
    setTargetId(id);
    if (!watchingThisShoot) return;
    try {
      setStatus(await setTetherTarget(id));
    } catch (err) {
      setError(String(err));
    }
  }

  async function nextTarget() {
    if (!activeItems.length) return;
    const next = activeItems[(currentIndex + 1) % activeItems.length];
    await changeTarget(next.id ?? null);
  }

  async function checkBeforeLeaving() {
    if (!activeItems.length) {
      await inform('This shoot has no active shot-list requirements.');
      return;
    }
    if (!missing.length) {
      await inform(`Shoot coverage complete. All ${activeItems.length} active requirements have at least one tethered or assigned photograph.`, 'Tethered Shoot Pro');
      return;
    }
    const details = missing.slice(0, 18).map((item) => `• ${item.subject} — ${item.variant}`).join('\n');
    const extra = missing.length > 18 ? `\n…and ${missing.length - 18} more.` : '';
    await inform(`${missing.length} requirement${missing.length === 1 ? '' : 's'} still need a photograph:\n\n${details}${extra}`, 'Check Before Leaving');
  }

  const latestUrl = thumbnailUrl(latest?.photo.thumbnailPath);

  return <div className="workspace-content tether-tab">
    <div className="tether-hero">
      <div>
        <span className="eyebrow">Tethered Shoot Pro</span>
        <h2>Capture One → High Style Match, in near real time.</h2>
        <p>Point Match at the same Capture folder Capture One is using. New files are detected after they finish writing, imported automatically and assigned to the requirement you are currently shooting.</p>
      </div>
      <div className={watchingThisShoot ? 'tether-live-badge active' : 'tether-live-badge'}>
        <span className="status-dot" />
        {watchingThisShoot ? 'Watching Capture One' : status.active ? 'Watcher active on another shoot' : 'Not watching'}
      </div>
    </div>

    {error && <div className="error-banner">{error}</div>}
    {busy && <div className="busy-banner"><div className="spinner small" /><span>{busy}</span></div>}

    <div className="tether-connect panel">
      <div>
        <span className="eyebrow">Capture folder</span>
        <strong>{folder || 'Choose the folder set as Capture One’s Next Capture Location'}</strong>
        <small>Existing files are ignored when watching starts. Only new captures arriving afterwards are brought into Match automatically.</small>
      </div>
      <div className="inline-actions">
        <button className="button secondary" onClick={chooseFolder}>Choose Capture Folder</button>
        {watchingThisShoot
          ? <button className="button secondary" onClick={stop}>Stop Watching</button>
          : <button className="button primary" onClick={start} disabled={!activeItems.length}>Start Watching</button>}
      </div>
    </div>

    <div className="tether-grid">
      <div className="tether-frame panel">
        <div className="tether-frame-head">
          <div><span className="eyebrow">Latest incoming frame</span><h2>{latest?.photo.originalFilename ?? 'Waiting for the next capture…'}</h2></div>
          {latest && <span className="valid-chip">{latest.photo.orientation}</span>}
        </div>
        <div className="tether-preview">
          {latestUrl
            ? <img src={latestUrl} alt={latest?.photo.originalFilename ?? 'Latest tethered capture'} />
            : <div className="tether-waiting"><span>◉</span><strong>{watchingThisShoot ? 'Camera ready' : 'Start the Capture One watcher'}</strong><small>{watchingThisShoot ? 'Take a photograph in Capture One. It will appear here automatically.' : 'Select the Capture folder, then start watching.'}</small></div>}
        </div>
        {latest && <div className="tether-frame-meta">
          <span>Assigned automatically to</span>
          <strong>{activeItems.find((item) => item.id === latest.shotListItemId)?.subject ?? 'Unassigned'}{activeItems.find((item) => item.id === latest.shotListItemId)?.variant ? ` — ${activeItems.find((item) => item.id === latest.shotListItemId)?.variant}` : ''}</strong>
          <small>{new Date(latest.capturedAt).toLocaleTimeString()} · {latest.photo.sourcePath}</small>
        </div>}
      </div>

      <div className="tether-side">
        <div className="panel tether-current">
          <span className="eyebrow">Now shooting</span>
          <h2>{current?.subject ?? 'No active requirement'}</h2>
          <p>{current?.variant ?? 'Add a shot list before tethering.'}</p>
          <label className="tether-target-field">
            <span>Incoming files go to</span>
            <select value={targetId ?? ''} onChange={(e) => changeTarget(e.target.value ? Number(e.target.value) : null)}>
              {activeItems.map((item) => <option key={item.id} value={item.id}>{item.subject} — {item.variant}</option>)}
            </select>
          </label>
          <div className="tether-current-count"><strong>{current?.id ? counts.get(current.id) ?? 0 : 0}</strong><span>frames for this requirement</span></div>
          <button className="button primary large" onClick={nextTarget} disabled={!activeItems.length}>Next Requirement →</button>
        </div>

        <div className="panel tether-coverage">
          <div className="section-heading compact"><div><span className="eyebrow">Live coverage</span><h2>{covered} / {activeItems.length} covered</h2></div><strong>{activeItems.length ? Math.round((covered / activeItems.length) * 100) : 0}%</strong></div>
          <div className="match-meter"><span style={{ width: `${activeItems.length ? (covered / activeItems.length) * 100 : 0}%` }} /></div>
          <button className="button secondary tether-check" onClick={checkBeforeLeaving}>Check Before Leaving</button>
        </div>
      </div>
    </div>

    <div className="panel tether-queue-panel">
      <div className="section-heading compact"><div><span className="eyebrow">Shot list</span><h2>Tether queue</h2><p>Select a requirement to make it the destination for the next Capture One photographs.</p></div><span className="status-pill">{photos.length} project photos</span></div>
      <div className="tether-queue">
        {activeItems.map((item, index) => {
          const count = item.id ? counts.get(item.id) ?? 0 : 0;
          const selected = item.id === targetId;
          return <button key={item.id} className={selected ? 'tether-queue-row active' : 'tether-queue-row'} onClick={() => changeTarget(item.id ?? null)}>
            <span className={count ? 'requirement-state tether-covered' : 'requirement-state tether-missing'}>{count ? '✓' : index + 1}</span>
            <span><strong>{item.subject}</strong><small>{item.variant}</small></span>
            <span className="count-block"><strong>{count}</strong><small>frame{count === 1 ? '' : 's'}</small></span>
          </button>;
        })}
      </div>
    </div>

    <div className="tether-note">
      <strong>Capture One stays in control of the camera.</strong>
      <span>Set Capture One’s Next Capture Location to the folder selected above. High Style Match watches that folder; it does not change your Capture One session or camera settings.</span>
    </div>
  </div>;
}
'''
write("src/components/TetheredShootPanel.tsx", panel)

workspace = read("src/screens/ShootWorkspaceScreen.tsx")
if "TetheredShootPanel" not in workspace:
    workspace = workspace.replace(
        "import { ProgressBar } from '../components/ProgressBar';",
        "import { ProgressBar } from '../components/ProgressBar';\nimport { TetheredShootPanel } from '../components/TetheredShootPanel';",
        1,
    )
workspace = workspace.replace(
    "type WorkspaceTab = 'summary' | 'shot-list' | 'photos' | 'rename' | 'history';",
    "type WorkspaceTab = 'summary' | 'shot-list' | 'tether' | 'photos' | 'rename' | 'history';",
    1,
)
workspace = workspace.replace(
    "{([['summary','Summary'],['shot-list','Shot List'],['photos','Photographs'],['rename','Rename Preview'],['history','History']] as [WorkspaceTab,string][]).map",
    "{([['summary','Summary'],['shot-list','Shot List'],['tether','Tethered Shoot Pro'],['photos','Photographs'],['rename','Rename Preview'],['history','History']] as [WorkspaceTab,string][]).map",
    1,
)
if "{tab === 'tether'" not in workspace:
    anchor = "    {tab === 'photos' && <div className=\"workspace-content photos-tab\">"
    block = r'''    {tab === 'tether' && <TetheredShootPanel
      shootId={shootId}
      shotItems={shotItems}
      photos={photos}
      onPhotoArrived={(photo) => {
        setPhotos((current) => {
          const existing = current.findIndex((item) => item.id === photo.id);
          if (existing < 0) return [...current, photo];
          return current.map((item) => item.id === photo.id ? photo : item);
        });
        setRenamePreview([]);
        setRenameApproved(false);
      }}
    />}

'''
    if anchor not in workspace:
        raise SystemExit("Photos tab anchor not found")
    workspace = workspace.replace(anchor, block + anchor, 1)
write("src/screens/ShootWorkspaceScreen.tsx", workspace)

styles = read("src/styles.css")
if ".tether-hero" not in styles:
    styles += r'''

/* Tethered Shoot Pro */
.tether-tab { padding-bottom: 35px; }
.tether-hero {
  min-height: 142px; padding: 22px 25px; margin-bottom: 12px; border: 1px solid var(--line-soft); border-radius: var(--radius);
  background: radial-gradient(circle at 82% 12%, var(--accent-soft), transparent 30%), var(--bg-card);
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
}
.tether-hero h2 { font-size: 25px; margin-bottom: 7px; }
.tether-hero p { max-width: 780px; margin: 0; font-size: 11px; }
.tether-live-badge { border: 1px solid var(--line); background: var(--bg-elevated); border-radius: 999px; padding: 8px 11px; font-size: 10px; font-weight: 750; white-space: nowrap; display: flex; align-items: center; gap: 7px; }
.tether-live-badge .status-dot { background: var(--muted); box-shadow: none; }
.tether-live-badge.active { color: var(--good); border-color: color-mix(in srgb, var(--good) 35%, var(--line)); }
.tether-live-badge.active .status-dot { background: var(--good); box-shadow: 0 0 0 4px color-mix(in srgb, var(--good) 16%, transparent); animation: tetherPulse 1.8s ease-in-out infinite; }
@keyframes tetherPulse { 50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--good) 2%, transparent); } }
.tether-connect { min-height: 88px; display: flex; align-items: center; justify-content: space-between; gap: 22px; margin-bottom: 12px; }
.tether-connect > div:first-child { min-width: 0; }
.tether-connect strong, .tether-connect small { display: block; }
.tether-connect strong { font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 760px; }
.tether-connect small { margin-top: 6px; font-size: 9px; }
.tether-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, .65fr); gap: 12px; }
.tether-frame { min-height: 570px; display: flex; flex-direction: column; padding: 15px; }
.tether-frame-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 11px; }
.tether-frame-head h2 { margin: 0; font-size: 16px; }
.tether-preview { flex: 1; min-height: 390px; border-radius: 10px; overflow: hidden; background: #09090b; border: 1px solid #25252b; display: grid; place-items: center; }
.tether-preview img { width: 100%; height: 100%; max-height: 470px; object-fit: contain; display: block; }
.tether-waiting { display: grid; place-items: center; text-align: center; gap: 8px; padding: 35px; color: var(--muted); }
.tether-waiting > span { width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-strong); font-size: 25px; }
.tether-waiting strong { color: var(--text); font-size: 14px; }
.tether-waiting small { font-size: 10px; max-width: 420px; }
.tether-frame-meta { padding-top: 12px; display: grid; gap: 3px; }
.tether-frame-meta span, .tether-frame-meta small { color: var(--muted); font-size: 9px; }
.tether-frame-meta strong { font-size: 12px; }
.tether-frame-meta small { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.tether-side { display: grid; gap: 12px; align-content: start; }
.tether-current { min-height: 360px; }
.tether-current h2 { font-size: 24px; margin-bottom: 3px; }
.tether-current > p { font-size: 13px; color: var(--accent-strong); font-weight: 650; }
.tether-target-field { display: grid; gap: 6px; margin-top: 22px; color: var(--muted); font-size: 9px; text-transform: uppercase; letter-spacing: .07em; font-weight: 700; }
.tether-target-field select { text-transform: none; letter-spacing: 0; font-size: 10px; }
.tether-current-count { padding: 18px 0; display: flex; align-items: baseline; gap: 9px; }
.tether-current-count strong { font-size: 42px; letter-spacing: -1px; }
.tether-current-count span { color: var(--muted); font-size: 10px; }
.tether-current .button { width: 100%; }
.tether-coverage { min-height: 190px; }
.tether-coverage .section-heading > strong { font-size: 20px; color: var(--accent-strong); }
.tether-check { width: 100%; margin-top: 18px; }
.tether-queue-panel { margin-top: 12px; min-height: 170px; }
.tether-queue { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
.tether-queue-row { border: 1px solid var(--line-soft); background: var(--bg-elevated); border-radius: 10px; padding: 10px; display: grid; grid-template-columns: 25px 1fr auto; gap: 9px; align-items: center; text-align: left; }
.tether-queue-row:hover { border-color: color-mix(in srgb, var(--accent) 45%, var(--line)); }
.tether-queue-row.active { border-color: var(--accent); background: var(--accent-soft); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 10%, transparent); }
.tether-queue-row > span:nth-child(2) strong, .tether-queue-row > span:nth-child(2) small { display: block; }
.tether-queue-row > span:nth-child(2) strong { font-size: 10px; }
.tether-queue-row > span:nth-child(2) small { margin-top: 2px; font-size: 8px; }
.requirement-state.tether-covered { background: color-mix(in srgb, var(--good) 18%, transparent); color: var(--good); }
.requirement-state.tether-missing { background: color-mix(in srgb, var(--muted) 12%, transparent); color: var(--muted); }
.tether-note { margin-top: 12px; border: 1px solid color-mix(in srgb, var(--accent) 24%, var(--line)); background: color-mix(in srgb, var(--accent) 7%, var(--bg-card)); border-radius: 10px; padding: 12px 14px; display: flex; gap: 8px; font-size: 10px; }
.tether-note span { color: var(--muted); }
@media (max-width: 1200px) {
  .tether-grid { grid-template-columns: minmax(0,1.3fr) minmax(280px,.7fr); }
  .tether-queue { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
'''
    write("src/styles.css", styles)

for rel in ["package.json", "src-tauri/tauri.conf.json", "src-tauri/Cargo.toml"]:
    text = read(rel)
    if rel == "package.json":
        text = text.replace('"version": "0.1.0"', '"version": "0.2.0"', 1)
    elif rel == "src-tauri/tauri.conf.json":
        text = text.replace('"version": "0.1.0"', '"version": "0.2.0"', 1)
    else:
        text = text.replace('version = "0.1.0"', 'version = "0.2.0"', 1)
    write(rel, text)

print("Tethered Shoot Pro patch applied")