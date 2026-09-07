use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::{path::PathBuf, sync::mpsc::channel, thread};
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
struct FileEventPayload { name: String, path: String }

fn spawn_watch(app: AppHandle, path: PathBuf, event_name: &'static str) -> Result<(), String> {
    if !path.exists() { return Err(format!("Folder does not exist: {}", path.display())); }
    thread::spawn(move || {
        let (tx, rx) = channel::<notify::Result<Event>>();
        let mut watcher = RecommendedWatcher::new(tx, Config::default()).expect("watcher");
        watcher.watch(&path, RecursiveMode::Recursive).expect("watch path");
        while let Ok(result) = rx.recv() {
            if let Ok(event) = result {
                for p in event.paths {
                    if p.is_file() {
                        let name = p.file_name().and_then(|x| x.to_str()).unwrap_or("file").to_string();
                        let ext = p.extension().and_then(|x| x.to_str()).unwrap_or("").to_ascii_lowercase();
                        if ["cr3","cr2","nef","arw","raf","dng","jpg","jpeg","tif","tiff","png","psd","zip"].contains(&ext.as_str()) {
                            let payload = FileEventPayload { name, path: p.to_string_lossy().to_string() };
                            let _ = app.emit(event_name, payload);
                        }
                    }
                }
            }
        }
    });
    Ok(())
}

#[tauri::command]
fn watch_capture_one(app: AppHandle, capture_path: String, output_path: String) -> Result<(), String> {
    spawn_watch(app.clone(), PathBuf::from(capture_path), "hsm://capture-file")?;
    spawn_watch(app, PathBuf::from(output_path), "hsm://export-file")?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![watch_capture_one])
        .run(tauri::generate_context!())
        .expect("error running High Style Match desktop bridge");
}
