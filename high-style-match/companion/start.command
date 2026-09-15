#!/bin/zsh
set -e
cd "$(dirname "$0")"

echo ""
echo "HIGH STYLE MATCH COMPANION"
echo "Capture One live bridge"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18 or newer is required."
  echo "Install Node.js, then run this file again."
  read -k 1 "?Press any key to close..."
  exit 1
fi

printf "Drag your Capture One CAPTURE folder into this window, then press Return:\n> "
read CAPTURE_FOLDER
CAPTURE_FOLDER=${CAPTURE_FOLDER//\\ / }
CAPTURE_FOLDER=${CAPTURE_FOLDER#\'}
CAPTURE_FOLDER=${CAPTURE_FOLDER%\'}
CAPTURE_FOLDER=${CAPTURE_FOLDER#\"}
CAPTURE_FOLDER=${CAPTURE_FOLDER%\"}

if [[ ! -d "$CAPTURE_FOLDER" ]]; then
  echo "That Capture folder could not be found."
  read -k 1 "?Press any key to close..."
  exit 1
fi

printf "Optional: drag the Capture One OUTPUT folder here, or just press Return to skip:\n> "
read OUTPUT_FOLDER
OUTPUT_FOLDER=${OUTPUT_FOLDER//\\ / }
OUTPUT_FOLDER=${OUTPUT_FOLDER#\'}
OUTPUT_FOLDER=${OUTPUT_FOLDER%\'}
OUTPUT_FOLDER=${OUTPUT_FOLDER#\"}
OUTPUT_FOLDER=${OUTPUT_FOLDER%\"}

ARGS=(--folder "$CAPTURE_FOLDER")
if [[ -n "$OUTPUT_FOLDER" && -d "$OUTPUT_FOLDER" ]]; then
  ARGS+=(--output "$OUTPUT_FOLDER")
fi

echo ""
echo "Starting live bridge..."
node companion.js "${ARGS[@]}"
