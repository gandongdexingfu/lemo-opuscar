# 生圖提示詞（ChatGPT，透過 qiaomu-codex-imagegen，1536×1024）

共同句：Photorealistic studio product photograph … centered, occupying about 35–50% of the frame width, generous empty margins all around. Absolutely no logos, no text. Background: one seamless flat warm cream paper colour (#F2EBDD), no gradient, no props, no texture. Soft diffused daylight from upper left, a soft natural contact shadow. Sharp focus, high detail, realistic materials.

| 檔名 | 物件描述（放在共同句前面） |
|---|---|
| o01_plate | classic round stainless-steel breakfast plate (Taiwanese breakfast shop) with one sunny-side-up fried egg; camera ~40° above |
| o02_cooker | classic Taiwanese electric rice cooker steamer, glossy crimson-red, chrome knob; ~20° above; no steam |
| o03_steamer | stack of three round bamboo steamer baskets with woven lid; ~15° above; no steam, no food |
| o04_bubbletea | bubble milk tea, clear cup, heat-sealed film lid, thick straw, dark tapioca pearls; ~15° above |
| o05_coil | dark green spiral mosquito coil (unlit) on a tin stand; ~55° above so the spiral reads |
| o06_stools | vertical stack of four red round plastic stools (night-market type) with a hole in the seat |
| o07_slippers | pair of Taiwanese blue-and-white rubber slide slippers; ~45° above |
| o08_fan | vintage mint-green desk fan, chrome cage, four pale blades, three-quarter view |
| o08_fan_noblades | **編輯 o08_fan**：remove only the four fan blades, keep EVERYTHING else identical（對位檢查 0 px） |
| o09_pinball | old wooden marble pinball board (night-market stall), brass pins, coloured pockets, launch lane; no numbers or letters |
| o10_bag | thin translucent red-and-white striped plastic shopping bag, two loop handles, gently puffed up |

前處理：每張除以背景色變成 multiply 圖（`img/*_m.png`），背景變成純白，疊在紙上只留物件和陰影。電扇另外用「原圖－無扇葉圖」的差值分出扇葉層（`fan_blades.png`），輪轂蓋和鋼絲分成前景層（`fan_front.png`）。
