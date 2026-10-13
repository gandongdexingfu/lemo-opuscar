# 重慶火鍋 · 素材與成片（assets/chongqing-hotpot）

這個分支只放素材，跟 main 的代碼分開（這個環境不能建 GitHub Release）。
做法、提示詞、代碼在 main 的 `mine/films/chongqing-hotpot/`。

| 資料夾 | 內容 |
|---|---|
| `final/` | 成片：`chongqing_hotpot_v2_final.mp4`（定稿，22 秒循環，1080×1920）、`chongqing_hotpot_v1.mp4`（初版） |
| `clips/` | 10 段 MiniMax 圖生視頻原始檔（s01–s10，各約 6.6 秒、1440×2560） |
| `frames/` | 10 張實際使用的首幀圖＋提示詞 JSON（ChatGPT 圖像生成） |
| `frames_drafts/` | 被淘汰的首幀草稿、角色參考截圖 |
| `covers/` | 封面成品（小紅書 3:4、抖音 9:16）、空白招牌底圖、草稿（失敗的立體字版、v1） |
| `sfx/` | Freesound CC0 音效（檔名尾碼 `fs<編號>` 是 Freesound 編號） |
| `post_copy_zh-CN.txt` | 小紅書／抖音發文文案（簡體） |

重建：`git clone --depth 1 -b assets/chongqing-hotpot https://github.com/gandongdexingfu/lemo-opuscar hotpot-assets`，再到 main 跑 `sh mine/films/chongqing-hotpot/build.sh hotpot-assets`。

授權：畫面與圖片由用戶以 MiniMax、ChatGPT 生成，用戶擁有使用權；音效 CC0；配樂與合成音效為代碼原創。詳見 main 的 `mine/films/chongqing-hotpot/CREDITS`。
