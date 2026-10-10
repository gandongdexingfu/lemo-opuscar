# 取自 huashu-art-motion（MIT）

來源：https://github.com/alchaincyf/huashu-art-motion （Copyright (c) 2026 alchaincyf），授權見同目錄 LICENSE。

| 檔案 | 原路徑 | 用途 |
|---|---|---|
| util.js | scripts/engine/lib/util.js | U：clamp、lerp、rng（種子亂數）、ss 等 |
| motion.js | scripts/engine/lib/motion.js | MO：緩動函數、step、settle、spring 等 |
| ../../tools/breakdown.py | scripts/analyze/breakdown.py | 拆解參考片：接觸表、切點、節拍網格、運動熱圖 |

`light-evolution` 的 scene/index.html 以 `lib/util.js`、`lib/motion.js` 載入，工程資料夾裡把 `lib` 連結到本目錄即可。
