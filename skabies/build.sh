#!/bin/sh
# One command: picture → score → foley/mix → master. Needs the Lemo-Opuscar library (sh <skill>/scripts/setup.sh deps).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
[ -s "$HERE/fonts/ArchitectsDaughter-Regular.ttf" ] || sh "$HERE/tools/fonts.sh"
cd "$LIB"
"$LIB/.venv/bin/python" core/audio/sampler.py --need "$HERE/music.py"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/music.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"
"$LIB/.venv/bin/python" "$HERE/tools/srt.py"
sh "$HERE/tools/master.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/skabies.mp4"   # mux.sh needs ffmpeg 7; with 7+ use: sh core/render/mux.sh … 24 0
