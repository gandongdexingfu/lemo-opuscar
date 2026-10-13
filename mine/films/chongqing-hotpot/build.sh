#!/bin/sh
# 一鍵重建《重慶火鍋》：sh build.sh <ASSETS>
# ASSETS = 素材分支的本機路徑：
#   git clone --depth 1 -b assets/chongqing-hotpot https://github.com/gandongdexingfu/lemo-opuscar hotpot-assets
# 需要 ffmpeg、python3（numpy、scipy、Pillow）、Noto CJK 字體（封面用）。
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
A=$(cd "${1:-$HERE/assets}" && pwd)
cd "$HERE"
python3 cut.py "$A"                                   # 畫面 → out/picture.mp4
mkdir -p out/wav
for f in "$A"/sfx/*.mp3; do b=$(basename "$f" .mp3); ffmpeg -v error -y -i "$f" -ar 48000 -ac 2 "out/wav/${b%%_fs*}.wav"; done
(cd out && python3 ../audio.py)                       # 配樂＋音效 → out/mix_raw.wav
# 母帶：壓縮 → loudnorm 兩遍 → 限幅（目標 −14 LUFS、真峰值 < −1.5 dBTP）
J=$(ffmpeg -hide_banner -i out/mix_raw.wav -af "acompressor=threshold=-22dB:ratio=3:attack=5:release=120:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json" -f null - 2>&1 | sed -n '/{/,/}/p')
v(){ echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i out/mix_raw.wav -af "acompressor=threshold=-22dB:ratio=3:attack=5:release=120:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=7:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true,alimiter=limit=0.70:attack=2:release=50:level=false,aresample=48000" -ar 48000 out/mix.wav
ffmpeg -v error -y -i out/picture.mp4 -i out/mix.wav -map 0:v -map 1:a -t 22 -c:v libx264 -b:v 8M -maxrate 10M -bufsize 16M -preset slow -profile:v high -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart chongqing_hotpot.mp4
# 封面：空白招牌底圖 ＋ 代碼寫金字
python3 cover/plaque.py "$A/covers/base_3x4_signboard.png" cover_3x4.jpg
python3 cover/plaque_9x16.py "$A/covers/base_9x16_signboard.png" cover_9x16.jpg
ffmpeg -hide_banner -i chongqing_hotpot.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
echo "→ $HERE/chongqing_hotpot.mp4"
