# High Style Match Companion

High Style Match Companion is the local bridge between a Capture One Session and High Style Match Live.

## What it does

- Watches the Capture folder used by Capture One.
- Detects new RAW and JPEG files while the shoot is running.
- Leaves original files untouched.
- Creates lightweight previews on macOS when possible.
- Sends live capture events to the High Style Match browser interface through a localhost-only bridge.
- Optionally watches the Capture One Output folder for finished exports.
- Provides a handoff point for Hugo/High Style AI analysis.

## Mac setup

1. Install Node.js 18 or newer.
2. Double-click `start.command`.
3. Drag the current Capture One Session `Capture` folder into Terminal and press Return.
4. Optionally drag the Session `Output` folder in as well.
5. Keep Companion running while shooting.
6. Open `https://crossmatthew40-coder.github.io/high-style-match/capture-one/` and press **Connect Capture One**.

The bridge runs only on `127.0.0.1:4177` by default. Capture One remains responsible for tethering to the camera.

## Command-line setup

```bash
node companion.js --folder "/path/to/Session/Capture" --output "/path/to/Session/Output"
```

The Output folder is optional.

## Hugo connection

The local bridge already emits a lightweight analysis event. To connect a production Hugo service, set:

```bash
HSM_REMOTE_URL="https://your-secure-endpoint.example/analyse" \
HSM_REMOTE_TOKEN="your-token" \
node companion.js --folder "/path/to/Capture"
```

The remote endpoint should return JSON containing an `analysis` object. Do not put long-lived private API keys in the High Style Match browser code.

## Local API

- `GET /api/state` — bridge status and recent frames.
- `GET /api/events` — Server-Sent Events stream (`state`, `capture`, `analysis`, `export`).
- `POST /api/rescan` — requests an immediate rescan.
- `GET /media/:id` — serves supported source previews locally.
- `GET /preview/:id` — serves generated RAW previews.

## Safety

The Companion is designed to read the Capture One folders. It does not rename, move or delete the source photographs during a live shoot.
