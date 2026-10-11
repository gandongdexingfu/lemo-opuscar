#!/bin/sh
# 一鍵重建：sh build.sh（在 lemo-opuscar 倉庫的 mine/films/site-promo/）
# 需要：Node、ffmpeg、Python（numpy、scipy、soundfile）；sampler 樂器庫 vcsl 與 freepats；網路（第一次下載作品網站上的兩支片）
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../../.." && pwd)}; [ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the lemo-opuscar folder"; exit 1; }
cd "$LIB"
[ -d core/audio/instruments/vcsl ] || sh tools/fetch.sh instruments vcsl
[ -d core/audio/instruments/freepats ] || sh tools/fetch.sh instruments freepats
sh "$HERE/frames.sh"                                   # 幕上播放的兩段片 → frames/
python3 "$HERE/score.py"                               # 配樂 → music/score.wav
node core/render/events.mjs "$HERE" --size 1080x1920   # 畫面的時間表 → events.json
python3 "$HERE/mix.py"                                 # 音效＋環境＋配樂 → out/mix.wav
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1080x1920 --out "$HERE/out/video.mp4"
sh "$HERE/build_mux.sh"                                # −14 LUFS、限幅、輕顆粒 → site_promo.mp4
ffmpeg -v error -y -ss 12.4 -i "$HERE/site_promo.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
