#!/bin/sh
# 混音後處理：量響度 → 補到 −14 LUFS → 限幅；顆粒在 ffmpeg 加（淺色畫面用很輕的顆粒）
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
I=$(ffmpeg -hide_banner -i "$HERE/out/mix.wav" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(round(-14-($I),2))")
ffmpeg -v error -y -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -filter_complex "[0:v]noise=alls=2:allf=t,format=yuv420p[v];[1:a]volume=${G}dB,alimiter=limit=0.84:attack=1:release=50:level=disabled[a]" -map "[v]" -map "[a]" -c:v libx264 -crf 20 -preset slow -c:a aac -b:a 192k -shortest -movflags +faststart "$HERE/site_promo.mp4"
echo "→ $HERE/site_promo.mp4 (gain ${G} dB)"
