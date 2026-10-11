# mine/ · 我的影片製作底座（基於 lemo-opuscar fork）

2026-10-10 起底座從 huashu-art-motion 換到 lemo-opuscar（畫面品質、導演方法、聲音與渲染工具更成熟）。
原作者內容（styles/、core/、DIRECTOR.md、TECHNIQUE.md 等）保持不動，方便合併上游更新；我的東西全部放在 `mine/`。

- `通用規範.md`：所有影片共用的規則（每次開工先讀；與 opuscar 衝突時以它為準）。
- `routes/`：每種影片類型一份做法（路線）。新類型做完一支就補一份。
- `films/`：每支成片的代碼與提示詞，下次同類型直接複製改。
- `tools/breakdown.py`：拆解參考片（取自 huashu-art-motion，MIT）。
- `vendor/huashu-art-motion/`：舊片用到的兩個小工具庫與授權。

| 路線 | 文件 | 範例 | 素材與成片 |
|---|---|---|---|
| 寫實照片演變片 | routes/寫實照片演變片.md | films/light-evolution | [Release light-evolution-v1](https://github.com/gandongdexingfu/lemo-opuscar/releases/tag/light-evolution-v1) |
| 照片塗鴉片 | routes/照片塗鴉片.md | films/taiwan-sparrow | [Release taiwan-sparrow-v1](https://github.com/gandongdexingfu/lemo-opuscar/releases/tag/taiwan-sparrow-v1) |
| 網站宣傳片 | routes/網站宣傳片.md | films/site-promo | 成片可放 Release site-promo-v1 |

選風格時可看 opuscar 的 43 種風格（`styles/README.md`）與 98 種風格提示詞：https://lemomo-ai.github.io/lemo-opuscar/opuscar98/#styles
