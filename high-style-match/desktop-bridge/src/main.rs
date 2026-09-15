use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    sync::mpsc::channel,
    thread,
    time::{Duration, SystemTime},
};
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
struct FileEventPayload {
    name: String,
    path: String,
    bytes: u64,
    extension: String,
}

fn supported(path: &Path, output: bool) -> bool {
    let ext = path
        .extension()
        .and_then(|x| x.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();

    let image = [
        "cr3", "cr2", "nef", "nrw", "arw", "raf", "orf", "rw2", "dng", "jpg",
        "jpeg", "tif", "tiff", "png", "webp", "heic", "heif",
    ];

    image.contains(&ext.as_str()) || (output && ["psd", "psb", "zip"].contains(&ext.as_str()))
}

fn stable_metadata(path: &Path) -> Option<(u64, SystemTime)> {
    let first = fs::metadata(path).ok()?;
    let size = first.len();
    let modified = first.modified().unwrap_or(SystemTime::UNIX_EPOCH);

    // Capture One can notify while a RAW is still being written. Wait briefly and
    // only emit once the size is unchanged.
    thread::sleep(Duration::from_millis(650));
    let second = fs::metadata(path).ok()?;
    if second.len() != size {
        return None;
    }

    Some((
        second.len(),
        second.modified().unwrap_or(modified),
    ))
}

fn spawn_watch(
    app: AppHandle,
    path: PathBuf,
    event_name: &'static str,
    output: bool,
) -> Result<(), String> {
    if !path.exists() || !path.is_dir() {
        return Err(format!("Folder does not exist: {}", path.display()));
    }

    thread::spawn(move || {
        let (tx, rx) = channel::<notify::Result<Event>>();
        let mut watcher = match RecommendedWatcher::new(tx, Config::default()) {
            Ok(watcher) => watcher,
            Err(_) => return,
        };

        if watcher.watch(&path, RecursiveMode::Recursive).is_err() {
            return;
        }

        let mut emitted: HashMap<PathBuf, (u64, SystemTime)> = HashMap::new();

        while let Ok(result) = rx.recv() {
            let Ok(event) = result else { continue };

            for file_path in event.paths {
                if !file_path.is_file() || !supported(&file_path, output) {
                    continue;
                }

                let Some(signature) = stable_metadata(&file_path) else {
                    continue;
                };

                if emitted.get(&file_path) == Some(&signature) {
                    continue;
                }
                emitted.insert(file_path.clone(), signature);

                let name = file_path
                    .file_name()
                    .and_then(|x| x.to_str())
                    .unwrap_or("file")
                    .to_string();
                let extension = file_path
                    .extension()
                    .and_then(|x| x.to_str())
                    .unwrap_or("")
                    .to_ascii_lowercase();

                let payload = FileEventPayload {
                    name,
                    path: file_path.to_string_lossy().to_string(),
                    bytes: signature.0,
                    extension,
                };
                let _ = app.emit(event_name, payload);
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn watch_capture_one(
    app: AppHandle,
    capture_path: String,
    output_path: String,
) -> Result<(), String> {
    let capture_path = capture_path.trim();
    if capture_path.is_empty() {
        return Err("Choose the Capture One Capture folder first.".to_string());
    }

    spawn_watch(
        app.clone(),
        PathBuf::from(capture_path),
        "hsm://capture-file",
        false,
    )?;

    let output_path = output_path.trim();
    if !output_path.is_empty() {
        spawn_watch(
            app,
            PathBuf::from(output_path),
            "hsm://export-file",
            true,
        )?;
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![watch_capture_one])
        .run(tauri::generate_context!())
        .expect("error running High Style Match desktop bridge");
}
