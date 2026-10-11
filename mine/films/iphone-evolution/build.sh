#!/bin/sh
# 一鍵重建樣片：sh build.sh（在 lemo-opuscar 倉庫的 mine/films/iphone-evolution/）
# 需要：Node、ffmpeg；opuscar 的 npm 依賴（playwright-core）；改字幕後先跑 python3 fonts.py 重抓字體子集
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}
cd "$HERE"
node geo/build.mjs               # 零件幾何 → parts.json
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1920x1080 --out "$HERE/out/video.mp4"
ffmpeg -v error -y -i "$HERE/out/video.mp4" -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart "$HERE/out/iphone2007_sample.mp4"
