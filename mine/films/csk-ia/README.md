# CSK-IA 標準試塊（等角說明片）

用 Anatomy 技能畫的互動等角圖，逐幀錄成 66 秒的教學片：斜探頭入射點、前沿長度、K 值，直探頭時基線 1:4。
作品頁：https://gandongdexingfu.github.io/works/csk-ia/ ・ 成片與互動網頁：分支 [`assets/csk-ia`](https://github.com/gandongdexingfu/lemo-opuscar/tree/assets/csk-ia)

## 檔案
| 檔案 | 做什麼 |
|---|---|
| `build.mjs` | 用 Anatomy 的 kit 建模並輸出：互動網頁（簡中 `csk-ia.html`、英文 `--en`）、Artifact 版、錄影用的 1920×1080 頁面（`video-zh.html`／`video.html`） |
| `en.mjs` | 英文版的字串對照表 |
| `record.mjs` | 用 Playwright 逐幀截圖（30 fps），字幕、章節標題、鏡頭推拉、標註線與右上角算式都在這裡排時間軸；`--zh` 出中文版 |
| `music.py` | numpy 合成的原創氛圍配樂（和弦長音＋鐘聲琶音＋輕節拍＋段落上揚），對齊各章節 |

## 怎麼跑
1. `build.mjs` 開頭的 `SK` 指向 Anatomy 技能資料夾（kit 與 scripts 在那裡），換環境要改。
2. `node build.mjs` → 中文互動頁與 `video-zh.html`；`node build.mjs --en` → 英文。
3. `node record.mjs --zh`（約 3 分鐘，1995 幀 jpg 到 `frames-zh/`）；`--preview` 只出幾張靜幀。
4. `python3 music.py` → `music.wav`。
5. 合成：`ffmpeg -framerate 30 -i frames-zh/%05d.jpg -i music.wav -filter_complex "[1:a]loudnorm=I=-14:TP=-1.5[a]" -map 0:v -map "[a]" -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out.mp4`

## 資料來源
- 試塊尺寸：NB/T 47013.3-2023 圖 13（使用者拍照提供），與《超聲檢測》第二版圖 4-30 交叉核對。
- 方法：《超聲檢測》第二版 4.5.2（入射點、前沿、K 值，式 4-16）、6.4.1（直探頭時基線，B2→50、B4→100）。
- 示意假設：斜探頭 2.5P 13×13 K2、前沿 12 mm；直探頭零偏 2.6 mm；波高按「晶片下方面積／偏離聲束軸」示意，不是聲場計算。

## 做法與踩過的坑
- **試塊是兩層稜柱**：後層 20 mm 到 R100，前層 5 mm 只到 R50（R10 圓角接徑向直邊）。kit 只能沿 z 擠出，所以自寫 `prismY` 沿厚度方向擠出、側面按深度排序、前蓋最後畫。弧面每一小面各自填色會出現細條紋 → 整組加 `data-seamless`（同色描邊蓋縫）。
- **聲束畫在正面**：R50 以內畫在前層 y=35，扇形區畫在後層 y=30，跨台階時沿 R50 弧面「下一階」，看起來像畫在表面上的一條線。
- **四個視角**是同一套程式換相機（方位角／仰角）各出一份 SVG；頂層物件（探傷儀、試塊、瓶子）要按每個視角的深度重新排序。
- **錄影是確定性的**：頁面提供 `__csk.manual(true)`＋`advance(dt)`，錄影腳本每幀推進 1/30 秒再截圖；CSS 過場（淡入淡出）是實時的，錄影版要關掉。
- **標註線**用試塊真實座標（mm）投影，鏡頭推近時跟著放大；文字要加同底色描邊，壓在零件上才讀得到。
- **沒走影片技能就開工的代價**：這支一開始被當成「把圖導出成影片」，跳過了 video-base，結果漏了三張靜幀審構圖、上架網站、寫回技能，配樂也用了課堂響度 −18 LUFS（平台應 −14）。以後「把 Anatomy 圖／互動網頁錄成影片」一律先走 video-base。
