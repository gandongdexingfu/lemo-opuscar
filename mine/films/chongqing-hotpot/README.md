# 重慶火鍋 · 飲食擬人系列 第 1 集

22 秒直式循環片：冷凍庫裡發抖的肥牛卷，跟牛油大叔、辣椒花椒、毛肚、鴨血豆腐、蒜蔥一起泡進重慶紅湯，最後全員比讚，蒸氣變回冷凍庫的霜。

- 做法與取捨：`TREATMENT.md`；路線：`../../routes/AI視頻擬人片.md`
- 提示詞：`prompts/first_frames.md`（首幀圖）、`prompts/minimax_prompts.md`（MiniMax 動作）
- 代碼：`cut.py`（剪接）、`audio.py`（配樂＋音效）、`cover/`（封面金字）、`build.sh`（一鍵重建）
- 素材與成片：分支 [`assets/chongqing-hotpot`](https://github.com/gandongdexingfu/lemo-opuscar/tree/assets/chongqing-hotpot)
  （成片 v1/v2、10 段 MiniMax 原始影片、所有首幀圖與草稿、封面、音效）

重建：
```sh
git clone --depth 1 -b assets/chongqing-hotpot https://github.com/gandongdexingfu/lemo-opuscar hotpot-assets
sh mine/films/chongqing-hotpot/build.sh hotpot-assets
```
