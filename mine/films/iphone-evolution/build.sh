#!/bin/sh
# 一鍵重建樣片：sh build.sh（在 lemo-opuscar 倉庫的 mine/films/iphone-evolution/）
# 需要：Node、Python（numpy、Pillow）、ffmpeg；opuscar 的 npm 依賴（playwright-core）
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
cd "$HERE"
python3 paper.py                 # 曬圖紙材質 → paper.jpg
node geo/build.mjs               # 零件幾何 → parts.json
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/out/video.mp4" -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart "$HERE/out/iphone2007_sample.mp4"
