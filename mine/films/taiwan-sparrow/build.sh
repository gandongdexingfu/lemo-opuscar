#!/bin/sh
# 一鍵重建：sh build.sh（在 lemo-opuscar 倉庫內 films/taiwan-sparrow/ 或 mine/films/taiwan-sparrow/）
# 需要：img/ 裡的 *_m.png 與 fan_*.png（從 GitHub Release taiwan-sparrow-v1 下載）、sampler 樂器庫 vcsl 與 freepats
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}; [ -f "$LIB/core/render/video.mjs" ] || LIB=$(cd "$HERE/../../.." && pwd)
cd "$LIB"
[ -d core/audio/instruments/vcsl ] || sh tools/fetch.sh instruments vcsl
[ -d core/audio/instruments/freepats ] || sh tools/fetch.sh instruments freepats
python3 "$HERE/score.py"
node core/render/events.mjs "$HERE" --size 1080x1920
python3 "$HERE/mix.py"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --size 1080x1920 --out "$HERE/out/video.mp4"
# mux.sh 在本機會誤報音檔不完整，改用手動兩步：量響度 → 調整到 −14 LUFS → 限幅；顆粒在 ffmpeg 加
I=$(ffmpeg -hide_banner -i "$HERE/out/mix.wav" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14-($I),2))")
ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -filter_complex "[0:v]noise=alls=3:allf=t,format=yuv420p[v];[1:a]volume=${G}dB,alimiter=limit=0.84:attack=1:release=50:level=disabled[a]" -map "[v]" -map "[a]" -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 192k -shortest "$HERE/taiwan_sparrow.mp4"
ffmpeg -v error -y -ss 31 -i "$HERE/taiwan_sparrow.mp4" -frames:v 1 "$HERE/poster.jpg"
echo "→ $HERE/taiwan_sparrow.mp4"
