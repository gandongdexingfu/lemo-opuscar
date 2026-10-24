#!/bin/sh
# 風與光 OF WIND AND LIGHT — one-command build (Time-lapse Symphony, nature cut).
# clips (crop, de-watermark, retime, frame-blend, slow motion) → score → picture → reading check → subtitles → master → poster.
# Needs: the library venv (numpy, scipy, Pillow, soundfile, soxr), ffmpeg, node; the vsco2ce + vcsl sample packs; the 11 source clips in footage/ (or set FOOTAGE).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}          # <repo>/mine/films/wind-and-light
export LIB
[ -f "$LIB/core/render/mux.sh" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
SLUG=wind-and-light
cd "$HERE"
mkdir -p work/clips out audio stills fonts
[ -f fonts/Michroma-Regular.ttf ] || curl -sSL -o fonts/Michroma-Regular.ttf https://github.com/google/fonts/raw/main/ofl/michroma/Michroma-Regular.ttf
[ -f fonts/NotoSansTC-VF.ttf ] || curl -sSL -o fonts/NotoSansTC-VF.ttf "https://github.com/google/fonts/raw/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf"
for l in vsco2ce vcsl; do [ -d "$LIB/core/audio/instruments/$l" ] || (cd "$LIB" && sh tools/fetch.sh instruments $l); done
"$PY" tools/prep.py -j 6                       # 1 clips
"$PY" tools/music.py audio/music.wav           # 2 score (cuts and music share tools/timeline.py)
"$PY" tools/render.py out/picture.mp4          # 3 picture; also writes texts.json
node "$LIB/core/render/readcheck.mjs" "$HERE"  # 4 every on-screen text stays long enough to read
"$PY" "$LIB/core/render/srt.py" cues.json "$SLUG.srt"
sh "$LIB/core/render/mux.sh" out/picture.mp4 audio/music.wav "$SLUG.mp4" 24 0   # 5 master to -14 LUFS (grain is in the picture)
ffmpeg -v error -y -ss 48.0 -i "$SLUG.mp4" -frames:v 1 -q:v 2 poster.jpg      # 6 poster: the geese over the sun
echo "done: $HERE/$SLUG.mp4"
