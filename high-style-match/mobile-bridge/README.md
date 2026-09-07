# High Style Match Mobile Live bridge

This folder defines the native iPad/iPhone bridge used by `/high-style-match/mobile-live/`.

The web UI already supports three modes:

1. **Native Mobile Live** — preferred on iPad/iPhone. The installed High Style Match mobile shell grants access to a Capture One Session/Capture folder, watches it while the app is active, and emits completed file events into the web UI.
2. **Browser directory watching** — used where the browser exposes `showDirectoryPicker()`.
3. **Manual file import** — fallback when the platform does not expose continuous directory access.

## JavaScript contract

The mobile shell must expose the following commands through Tauri `invoke` or an equivalent `window.HSM_MOBILE_LIVE.invoke` adapter:

- `mobile_pick_capture_folder` → returns `{ name: string }`
- `mobile_start_watch` → starts watching the previously selected folder
- `mobile_stop_watch` → stops the watcher
- `mobile_read_capture_file({ path })` → returns `{ name, base64, contentType, modified }`

The shell emits:

- `hsm://mobile-capture-file`

Payload:

```json
{
  "path": "/security-scoped/path/to/IMG_0001.CR3",
  "name": "IMG_0001.CR3",
  "size": 41234567,
  "modified": 1788812345678
}
```

The page imports the returned file into the same IndexedDB store used by High Style Match (`hsm-files-v1/files`) and attaches it to the current `Now Shooting` requirement. Smart Cull can then analyse it from the main app.

## iPad behaviour

The native implementation should persist the chosen directory using a security-scoped bookmark. Monitoring is intended for the foreground/active app state. If iPadOS suspends the app, the bridge should rescan the selected folder on resume and emit files that were created while suspended.

`ios/MobileLiveBridge.swift` contains the native watcher core and bookmark handling scaffold. It still needs wiring into the final Tauri iOS shell and a signed iOS build before the native mode can be called production-ready.
