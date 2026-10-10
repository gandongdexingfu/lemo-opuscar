# 光的演變（2026-10-09 定稿）

91.6 秒，1080×1920，30fps。寫實照片（ChatGPT 生成）＋代碼動畫。配樂：Gemini「Above the Sleeping World」延後 2.0s 進場。

## 檔案
| 路徑 | 內容 |
|---|---|
| scene/index.html, scene/scene.js | 整片動畫（11 代＋1826 火柴彩蛋＋序幕火柴＋地球結局） |
| tools/render.py | 逐幀渲染（舊工具，單執行緒 PNG；新片改用 opuscar 的 `core/render/video.mjs --workers 3`）：`uv run --with playwright python tools/render.py <工程資料夾> 成片.mp4 --audio 音軌.wav`；`--stills 1.5,6.0 --events ev.json` 出靜幀與事件表 |
| audio/synth_sfx_music.py | 讀事件表合成音效＋臨時和弦，輸出 faudio.wav 與 sfx_only.wav |
| tools/mix_music.py | 換上 Gemini 配樂（影片不重渲染） |
| prompts/image_prompts.md | 每張圖的實際提示詞 |

## 重建步驟
1. 工程資料夾放 `scene/` 兩個檔，建 `lib` → `mine/vendor/huashu-art-motion` 的連結，`assets/` 放圖片（命名：f01_fire_lit/off … f11_smart_lit/off、earth、match_lit、match_off）。
2. 圖片不進倉庫：從 Release **light-evolution-v1** 下載 `light-evolution_photos_1.zip` 和 `light-evolution_photos_2.zip`（共 25 張最終照片，檔名與代碼一致），一起解壓到 `assets/`。
   https://github.com/gandongdexingfu/lemo-opuscar/releases/tag/light-evolution-v1
   同一個 Release 還有成片 `light-evolution.mp4` 與 Gemini 配樂 `light-evolution_music.mp3`（原名 Above the Sleeping World）。
3. 先出靜幀檢查 → 合成音效 → 整片渲染（~22 分鐘，nohup 背景跑）→ 換配樂 → >30MB 用 `-crf 24` 壓縮。

## 時間參數（scene.js 頂部）
`P=6.5` 每代秒數，`IG=.8` 點燈時刻，`OFF=5.5` 熄燈時刻，`EGG=3.2` 彩蛋長度，`OPEN=3.0` 序幕；結局 `OUT0=最後一代+5.9`、拉遠 4.5s、停留 10s。
