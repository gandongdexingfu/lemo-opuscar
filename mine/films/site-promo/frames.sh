#!/bin/sh
# 幕上播放的兩段片：從作品網站的網頁版影片（540×960）截出 24 fps 的 JPEG 序列
# 雲端瀏覽器播不了 H.264，所以幕上的影片是一張一張圖，render(t) 依時間換圖（確定性）
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$HERE/frames/src"
get() { [ -f "$HERE/frames/src/$1.mp4" ] || curl -sL -o "$HERE/frames/src/$1.mp4" "https://gandongdexingfu.github.io/media/$1.mp4"; }
cut() { # id 起點 長度
  rm -rf "$HERE/frames/$1"; mkdir -p "$HERE/frames/$1"
  ffmpeg -v error -y -ss "$2" -t "$3" -i "$HERE/frames/src/$1.mp4" -vf fps=24 -q:v 3 "$HERE/frames/$1/%03d.jpg"
  echo "$1: $(ls "$HERE/frames/$1" | wc -l) frames"
}
get taiwan-sparrow; get light-evolution
cut taiwan-sparrow 21.5 5.6
cut light-evolution 76.4 6.2
