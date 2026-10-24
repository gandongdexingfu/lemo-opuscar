# 風與光 · OF WIND AND LIGHT（2026-10-25 定稿）

85 秒，1920×1080（1.85:1 遮幅），24fps，−14 LUFS。11 段自備實拍短片，用 opuscar 的**延時交響 Time-lapse Symphony**（剪輯與紀實）剪成自然版：一天由黎明走到夜。無旁白，原創配樂（VSCO 2 CE／VCSL 取樣，CC0），畫面文字只有片名、梭羅一句引文和片尾字卡。

成片 `wind-and-light.mp4` 在 Release **wild-and-light-v1**：https://github.com/gandongdexingfu/lemo-opuscar/releases/tag/wild-and-light-v1

## 檔案
| 路徑 | 內容 |
|---|---|
| TREATMENT.md | 三種結構與選擇、鏡頭表、beat sheet、cue 表、聲音設計、文字設計 |
| tools/timeline.py | 96 BPM 拍點表，所有剪輯點與配樂的唯一時間來源（`beat(n)`） |
| tools/shots.py | 素材對照、每個鏡頭的入點／速度／幀混合／運鏡、九宮格、倒序閃回清單 |
| tools/prep.py | 剪接引擎：裁成 1.85:1、去水印、速度曲線、幀混合、慢放（minterpolate） → `work/clips/` |
| tools/music.py | 配樂：豎琴／管風琴／弦樂／木管／圓號，煞停與硬停的乾聲切斷 → `audio/music.wav` |
| tools/render.py | 逐幀合成：調色（S 曲線、暖高光、bloom）、九宮格、閃回、文字、日環、顆粒、遮幅；`--still 秒 檔名` 出靜幀 |
| tools/stills.sh | 出一組靜幀並拼成接觸表：`bash tools/stills.sh 名稱 4 16 48 …` |
| cues.json → wind-and-light.srt | 字幕（只收畫面文字） |
| index.html | 讓 opuscar 的 `readcheck.mjs` 讀 `texts.json`，檢查文字停留時間 |
| build.sh | 一鍵重建 |
| CREDITS | 素材、取樣庫、字體、引文的來源與授權 |

## 重建步驟
1. 倉庫根目錄跑 `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps`（核心工具與 `.venv`）。取樣庫 vsco2ce、vcsl 由 `build.sh` 自動下載。
2. 11 段原始素材不進倉庫：放到 `mine/films/wind-and-light/footage/`（或設 `FOOTAGE=<資料夾>`），檔名與 `tools/shots.py` 的 `V` 一致。
3. `sh build.sh`（字體會自動下載到 `fonts/`；整片渲染約 15 分鐘）。

## 調整重點
- 改節奏：改 `timeline.py` 的 BPM 與段落拍點，`shots.py` 全用拍數，不寫秒數。
- 水印處理在 `prep.py` 的 `PRE`：雨夜、粉色暮空、星空靠裁切出畫；懸崖用 delogo。公路、花樹各剩一個很淡的半透明水印，太靠中間，裁不掉。
- 豎屏火燒雲的下搖在 `prep.py` 的 `TILT`（起點 y=300，終點 y=1540）。
