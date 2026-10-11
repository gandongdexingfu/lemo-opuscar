// 初代 iPhone（2007，A1203）幾何。所有尺寸 mm。依據：拆解/005_iPhone演變_考證_初代.md
// 【官】外形 115 × 61 × 11.6；螢幕 3.5"、480×320（可視區 49.3 × 74.0 由對角線與比例算出）
// 【拆】層次、零件位置（iFixit 拆機照片判讀）；【估】內部零件尺寸（照片比例）
import { k, G, plan, pathOf, frameSolid, onSide, roundRect2, circle2, ringCustom, ribbon, dimension } from "./lib.mjs";

const W = 61, H = 115, T = 11.6, R = 9.5;            // 外形【官】；圓角半徑【估】
const AW = 49.3, AH = 74.0;                           // 可視區（3.5" 3:2）
const WIN_Y = 20.5;                                    // 可視區上緣到頂端【估】
const HOME_Y = 104.6, HOME_R = 5.6, EAR_Y = 10.2;      // Home 鍵、聽筒【估】

// ---- 標記輸出 ----
let PAT = "paper";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const ln = (d, w = 2, extra = "") => (d ? `<path class="ln w${w}"${extra} pathLength="1" d="${d}"/>` : "");
export const hid = (d) => (d ? `<path class="hid" d="${d}"/>` : "");
const fillP = (d) => `<path class="f" d="${d}"/>`;
const halo = (pl, z, P) => `<path class="halo" d="${k.slabOf(pl, z, 0.1, P, 10).fill}"/>`;   // 零件下方的柔和陰影
export function solid(p, { w = 1, crease = 3, cls = "", wall = "", inner = "" } = {}) {
  const sh = p.shades.map((d, i) => (d ? `<path class="sh" data-s="${i}" d="${d}"/>` : "")).join("");
  return `<g class="s ${cls}">${fillP(p.fill)}${sh}${wall ? `<path class="sh" data-s="0" d="${wall}"/>` : ""}<path class="tp" d="${p.top}"/>${ln(p.crease, crease)}${inner}${ln(p.outline, w)}</g>`;
}
const dots = (pts, r = 0.9) => `<g class="dt">${pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`).join("")}</g>`;
const text = (P, at, z, s, size = 2.2, along = "x", cls = "et") => `<g transform="${k.topMatrix(at, z, P, along)}"><text class="${cls}" font-size="${size}">${esc(s)}</text></g>`;
const flat = (d) => `<path class="tp" d="${d}"/>`;           // 只填亮面（平貼在面上的東西）
const shadeFill = (d, s = 1) => `<path class="sh" data-s="${s}" d="${d}"/>`;

// 平面上的格柵孔（側面）
function grille(face, at, u0, u1, v, P, n, r = 0.45) {
  const pts = []; for (let i = 0; i < n; i++) { const u = u0 + (u1 - u0) * (i + 0.5) / n; pts.push(k.iso(face === "y" ? [u, at, v] : [at, u, v], P)); }
  return dots(pts, r * 1.6);
}

// =====================================================================================
// FIG. 01 正面組合圖（正面朝上；x 由左到右＝從正面看；y=0 頂端在遠處）
export function fig1(P) {
  PAT = "pp-f1";
  const out = [];
  const full = plan(0, 0, W, H, R);
  // 鋁背殼的弧面：最底下一層內縮【拆：弧形鋁背】
  out.push({ id: "shell", svg: solid(k.slabOf(plan(1.4, 1.4, W - 2.8, H - 2.8, R - 1.4), 0, 1.6, P, 12), { w: 2 }) });
  // 機身（鋁＋底部黑色塑膠）
  const body = k.slabOf(full, 1.6, 8.6, P, 12);
  const seamY = 92.6;   // 鋁與天線蓋的接縫（背面約 1/5）【拆】
  out.push({ id: "body", svg: solid(body, { inner: ln(onSide("x", W, [[seamY, 1.6], [seamY, 10.2]], P), 3) + ln(k.sideSeam(full, 4.0, P, 12), 4) }) });
  // 不鏽鋼邊框（亮面）＋玻璃
  const bz = frameSolid(full, plan(1.5, 1.5, W - 3, H - 3, R - 1.5), 10.2, 1.4, P, 12);
  out.push({ id: "bezel", svg: solid(bz, { wall: bz.wall, inner: ln(bz.lowEdge, 3) }) });
  const gl = k.slabOf(plan(1.5, 1.5, W - 3, H - 3, R - 1.5), 10.2, 1.1, P, 12);
  // 玻璃頂面：黑色印刷邊、可視區、聽筒、Home 鍵、玻璃反光（藍圖慣例：兩道斜線）
  const zt = 11.3, x0 = (W - AW) / 2;
  const win = k.planOutline(plan(x0, WIN_Y, AW, AH, 0.6), zt, P, 2);
  const ear = k.planOutline(plan(W / 2 - 5.2, EAR_Y - 0.8, 10.4, 1.6, 0.8), zt, P, 4);
  const home = k.ring(W / 2, HOME_Y, HOME_R, zt, P, 40) + k.ring(W / 2, HOME_Y, HOME_R - 0.6, zt, P, 40);
  const icon = k.planOutline(plan(W / 2 - 1.9, HOME_Y - 1.9, 3.8, 3.8, 0.7), zt, P, 4);
  const glare = k.lineOnTop([x0 + 8, WIN_Y + AH - 6], [x0 + AW - 4, WIN_Y + 22], zt, P) + k.lineOnTop([x0 + 16, WIN_Y + AH - 4], [x0 + AW - 2, WIN_Y + 34], zt, P);
  out.push({ id: "glass", svg: `<g class="s">${fillP(gl.fill)}<path class="tp" d="${gl.top}"/>${shadeFill(k.onTop(k.ringOf(plan(x0, WIN_Y, AW, AH, 0.6), 2), zt, P, true), 0)}${ln(win, 2)}${ln(ear, 2)}${ln(home, 2)}${ln(icon, 3)}${ln(glare, 4)}${ln(gl.outline, 3)}</g>` });
  // 底面：Dock 接口、揚聲器與麥克風格柵【官／拆】
  const dock = onSide("y", H, roundRect2(W / 2 - 10.5, 4.2, 21, 3.4, 1.4), P, true);
  out.push({ id: "bottom", svg: ln(dock, 2) + grille("y", H, 6, 17, 5.9, P, 8) + grille("y", H, 44, 55, 5.9, P, 8) });
  // 右側（正面看的右側）：沒有按鍵；頂部遠處：睡眠鍵（被機身擋住，畫出可見的一小截）
  out.push({ id: "sleep", svg: solid(k.slabOf(plan(W - 21, -0.7, 10, 0.8, 0.3), 7.2, 2.0, P, 2), { w: 2 }) });
  return out;
}

// 正面圖尺寸線（官方數據）
export function fig1dims(P) {
  const d115 = dimension([W, 0, 0], [W, H, 0], [10, 0, 0], P);
  const d61 = dimension([0, H, 0], [W, H, 0], [0, 10, 0], P);
  const d116 = dimension([0, H, 0], [0, H, T], [-7, 7, 0], P);
  return { d115, d61, d116 };
}


// #00 十字螺絲（頭部）：爆炸時浮在所屬零件上方【拆：全機約 16 顆 Phillips #00】
const screwSvg = (x, y, z, P) => solid(k.cylinder(x, y, 1.15, z, 0.55, P, 18), { w: 2, inner: ln(k.lineOnTop([x - 0.6, y], [x + 0.6, y], z + 0.55, P) + k.lineOnTop([x, y - 0.6], [x, y + 0.6], z + 0.55, P), 3) });
// =====================================================================================
// 【已停用：精確版改用 geo/fig2.mjs】FIG. 02 背面爆炸圖（背面朝上：前面板在下 z=0，背板在上 z=11.6；x 由左到右＝從背面看）
// 九組，依 iFixit 拆機的反向順序堆疊
export const GROUPS = [
  { id: "g1", name: "金属边框", sub: ["包住玻璃边缘的亮面一圈"] },
  { id: "g2", name: "玻璃盖板 + 触摸层", sub: ["电容式多点触控（Balda 供应）", "Home 键键帽"] },
  { id: "g3", name: "LCD 显示模组", sub: ["3.5 英寸 · 480×320 · 163 ppi", "液晶面板 · LED 背光 · 金属背框"] },
  { id: "g4", name: "中框 + 显示排线", sub: ["S 形排线连接屏幕与主板", "振动马达 · Home 键弹片", "#00 十字螺丝（全机约 16 颗）"] },
  { id: "g5", name: "扬声器腔体 + 底部接口", sub: ["腔体背面贴着天线软板", "30 针 Dock 接口"] },
  { id: "g6", name: "主板（两层叠在一起）", sub: ["通讯板：基带 S-Gold 2 · 功放 Skyworks", "Wi-Fi Marvell W8686 · 蓝牙 CSR", "应用板：处理器 Samsung S5L8900", "SIM 卡座 · 200 万像素摄像头"] },
  { id: "g7", name: "锂聚合物电池", sub: ["3.7 V · 1400 mAh", "直接焊在主板上，不可拆换"] },
  { id: "g8", name: "铝合金后盖", sub: ["耳机孔 · SIM 卡托（回形针顶出）", "机身型号 A1203"] },
  { id: "g9", name: "天线盖", sub: ["塑料材质，让信号穿透"] },
];

export function fig2(P) {
  const items = {};
  const put = (g, svg, sub = 0, tag = '') => (items[g] ||= []).push({ svg, sub, tag });   // sub：組內再分開的層級（爆炸時多升 sub×6mm）
  const pat = (g) => (PAT = "pp-" + g);
  const full = plan(0, 0, W, H, R);

  // ---- g1 不鏽鋼邊框 ----
  pat("g1");
  const bz = frameSolid(full, plan(1.5, 1.5, W - 3, H - 3, R - 1.5), 0, 2.2, P, 12);
  put("g1", solid(bz, { wall: bz.wall, inner: ln(bz.lowEdge, 3) + ln(k.sideSeam(full, 1.1, P, 12), 4) }));

  // ---- g2 玻璃＋觸控層（從背面看到玻璃內側）----
  pat("g2");
  put("g2", halo(plan(1.5, 1.5, W - 3, H - 3, R - 1.5), 0.3, P));
  const xw = (W - AW) / 2;                         // 背面看左右鏡像，可視區置中所以不變
  const gz = 0.3, gh = 1.2, gt = gz + gh;
  const glass = k.slabOf(plan(1.5, 1.5, W - 3, H - 3, R - 1.5), gz, gh, P, 12);
  const mask = k.planOutline(plan(xw - 1.2, WIN_Y - 1.2, AW + 2.4, AH + 2.4, 1.2), gt, P, 3);
  const grid = [];
  for (let i = 1; i < 10; i++) grid.push(k.lineOnTop([xw + AW * i / 10, WIN_Y], [xw + AW * i / 10, WIN_Y + AH], gt, P));
  for (let i = 1; i < 15; i++) grid.push(k.lineOnTop([xw, WIN_Y + AH * i / 15], [xw + AW, WIN_Y + AH * i / 15], gt, P));
  const earG = k.planOutline(plan(W / 2 - 5.2, EAR_Y - 0.8, 10.4, 1.6, 0.8), gt, P, 4);
  const homeHole = k.ring(W / 2, HOME_Y, HOME_R, gt, P, 40);
  put("g2", `<g class="s">${fillP(glass.fill)}${glass.shades.map((d, i) => (d ? shadeFill(d, i) : "")).join("")}<path class="tp" d="${glass.top}"/>${ln(mask, 2)}${ln(grid.join(""), 4)}${ln(earG, 3)}${ln(homeHole, 2)}${ln(glass.crease, 3)}${ln(glass.outline, 1)}</g>`);
  // Home 鍵鍵帽（嵌在玻璃孔裡）
  put("g2", solid(k.cylinder(W / 2, HOME_Y, HOME_R - 0.4, gz - 0.3, 1.9, P, 40), { w: 2, inner: ln(k.ring(W / 2, HOME_Y, HOME_R - 1.6, gz + 1.6, P, 32), 4) }));

  // ---- g3 LCD 顯示模組：液晶面板（含玻璃上的驅動 IC）→ 側入式 LED 背光 → 金屬背框（一般 LCD 結構；位置【估】）----
  pat("g3");
  const lz = 1.6;
  const LCD = plan(xw - 1.0, WIN_Y - 2.4, AW + 2.0, AH + 5.0, 1.2);
  put("g3", halo(LCD, lz, P));
  // 液晶面板：兩片玻璃夾液晶，下緣突出一段「台階」放驅動 IC
  const cell = plan(LCD.x + 0.4, LCD.y + 0.4, LCD.w - 0.8, LCD.d - 0.8, 0.6);
  put("g3", solid(k.slabOf(cell, lz, 0.8, P, 2), { w: 2, inner: ln(k.planOutline(plan(xw, WIN_Y, AW, AH, 0.4), lz + 0.8, P, 2), 3) + ln(k.lineOnTop([cell.x + 1, cell.y + cell.d - 4.2], [cell.x + cell.w - 1, cell.y + cell.d - 4.2], lz + 0.8, P), 4) }));
  put("g3", solid(k.slabOf(plan(W / 2 - 9, cell.y + cell.d - 3.6, 18, 1.8, 0.2), lz + 0.8, 0.5, P, 2), { w: 2 }));       // 驅動 IC（COG）
  // 背光：導光板＋下緣 LED 燈條
  const lgp = plan(LCD.x + 0.6, LCD.y + 0.6, LCD.w - 1.2, LCD.d - 5.4, 0.6);
  const lgpLines = Array.from({ length: 9 }, (_, i) => k.lineOnTop([lgp.x + 3, lgp.y + 6 + i * 8], [lgp.x + lgp.w - 3, lgp.y + 6 + i * 8], lz + 2.2, P)).join("");
  put("g3", solid(k.slabOf(lgp, lz + 1.0, 1.2, P, 2), { w: 2, inner: ln(lgpLines, 4) }), 1);
  put("g3", solid(k.slabOf(plan(lgp.x + 3, lgp.y + lgp.d + 0.3, lgp.w - 6, 2.4, 0.3), lz + 1.0, 1.2, P, 2), { w: 3 }) + dots(Array.from({ length: 6 }, (_, i) => k.iso([lgp.x + 6 + i * 8.2, lgp.y + lgp.d + 1.5, lz + 2.2], P)), 1.1), 1);
  // 金屬背框：加強筋、標籤、排線
  const lt = lz + 2.7;
  const stiff = k.planOutline(k.insetPlan(LCD, 3.2), lt, P, 3);
  const lbl = plan(xw + 8, WIN_Y + 18, 26, 14, 0.6);
  const lblLines = [0, 1, 2, 3].map((i) => k.lineOnTop([lbl.x + 3, lbl.y + 3 + i * 2.6], [lbl.x + (i === 3 ? 13 : 21), lbl.y + 3 + i * 2.6], lt, P)).join("");
  put("g3", solid(k.slabOf(LCD, lz + 2.3, 0.4, P, 3), { inner: ln(stiff, 3) + ln(k.planOutline(lbl, lt, P, 2), 3) + ln(lblLines, 4) }), 2);
  const tab = ribbon([[W / 2, LCD.y + LCD.d - 1], [W / 2, LCD.y + LCD.d + 4.5]], 14, lt + 0.02, P, 2);
  put("g3", `<g class="s">${fillP(tab.fill)}${flat(tab.fill)}${ln(tab.edges, 2)}</g>`, 2);

  // ---- g4 前框＋顯示屏托板＋S 形排線、震動馬達、Home 彈片 ----
  pat("g4");
  put("g4", halo(plan(1.5, 1.5, W - 3, H - 3, R - 1.5), 1.6, P));
  const fz = 1.6, fh = 4.4;
  const FR = plan(1.5, 1.5, W - 3, H - 3, R - 1.5);
  const fr = frameSolid(FR, k.insetPlan(FR, 1.8), fz, fh, P, 12);
  put("g4", solid(fr, { wall: fr.wall, inner: ln(fr.lowEdge, 3) }));
  const PL = k.insetPlan(FR, 1.8);
  const pz = 4.2;
  const plate = k.slabOf(PL, pz, 0.5, P, 12);
  // 托板上的固定孔（10 顆周邊螺絲【拆】＋3 顆主板螺絲）
  const screws = [[4.6, 12], [4.6, 40], [4.6, 70], [4.6, 100], [W - 4.6, 12], [W - 4.6, 40], [W - 4.6, 70], [W - 4.6, 100], [20, 4.4], [41, 110.6]];
  const scr = screws.map(([x, y]) => k.ring(x, y, 1.0, fz + fh, P, 14)).join("");
  put("g4", solid(plate, { w: 2, inner: ln(k.planOutline(k.insetPlan(PL, 3.5), pz + 0.5, P, 10), 4) }) + ln(scr, 3));
  // S 形顯示排線（照片：托板中下部的蛇形橙色排線）
  const S = ribbon([[W / 2, 96.5], [W / 2 + 10, 90], [W / 2 + 10, 80], [W / 2 - 10, 72], [W / 2 - 10, 62], [W / 2 + 6, 56], [W / 2 + 6, 49]], 7, pz + 0.55, P, 5);
  put("g4", `<g class="s">${fillP(S.fill)}${flat(S.fill)}${ln(S.edges, 2)}${ln(S.mid, 4)}</g>`);
  put("g4", screws.map(([x, y]) => screwSvg(x, y, fz + fh, P)).join(""), 3);
  put("g4", solid(k.slabOf(plan(W / 2 + 1.5, 46.6, 9, 3.4, 0.5), pz + 0.5, 1.0, P, 2), { w: 2 }));   // 板對板接頭
  put("g4", solid(k.cylinder(50.5, 104.5, 4.6, pz + 0.5, 2.4, P, 40), { w: 2, inner: ln(k.ring(50.5, 104.5, 2.2, pz + 2.9, P, 24), 4) }));   // 震動馬達（圓餅形）
  put("g4", solid(k.cylinder(W / 2, HOME_Y, 3.0, pz + 0.5, 0.6, P, 28), { w: 3 }));   // Home 鍵彈片

  // ---- g5 揚聲器腔（黑色塑膠空心件）＋天線軟板＋Dock ----
  pat("g5");
  put("g5", halo(plan(3.4, 92.8, W - 6.8, 18.8, 3), 5.0, P));
  const EN = plan(3.4, 92.8, W - 6.8, 18.8, 3);
  const ez = 5.0, eh = 4.6;
  const en = k.slabOf(EN, ez, eh, P, 6);
  const meander = [];
  for (let i = 0; i < 7; i++) { const x = EN.x + 5 + i * 6.6; meander.push(k.onTop([[x, EN.y + 3], [x, EN.y + EN.d - 4], [x + 3.3, EN.y + EN.d - 4], [x + 3.3, EN.y + 3]], ez + eh, P)); }
  const flexEdge = k.planOutline(k.insetPlan(EN, 1.6), ez + eh, P, 4);
  put("g5", solid(en, { inner: ln(flexEdge, 2) + ln(meander.join(""), 4) + ln(k.sideSeam(EN, ez + 2.2, P, 6), 4) }));
  put("g5", solid(k.slabOf(plan(W / 2 - 11, 105.5, 22, 7.6, 0.8), ez - 0.2, 3.4, P, 2), { w: 2, inner: ln(onSide("y", 113.1, roundRect2(W / 2 - 9.5, ez + 0.6, 19, 2.0, 0.9), P, true), 3) }));   // 30 針 Dock 接口

  // ---- g6 主板：應用處理器板（下、靠屏幕）＋通訊板（上、靠背面，隔間屏蔽罩）＋相機 ----
  // 晶片位置由 iFixit 拆機照片換算：通訊板照片旋轉 180°（電池焊線朝下、同軸接頭在左，與機內照片吻合）；
  // 應用板旋轉 90°（SIM 卡座朝頂端，對上背板的 SIM 支架）。比例 0.0725 mm/像素【估】
  pat("g6");
  const az0 = 5.0, czb = 7.0;
  const chip = (x0, y0, x1, y1, z, h, mark, sub, size = 1.5) => solid(k.slabOf(plan(x0, y0, x1 - x0, y1 - y0, 0.3), z, h, P, 2), { w: 2, inner: mark ? text(P, [x0 + 0.8, (y0 + y1) / 2 + 0.5], z + h, mark, size) : "" });
  // 應用處理器板
  const AB = plan(21, 3.4, 34.4, 29, 1.2);
  put("g6", halo(AB, az0, P));
  put("g6", solid(k.slabOf(AB, az0, 0.9, P, 3), { w: 1, inner: ln(k.sideSeam(AB, az0 + 0.45, P, 3), 4) }));
  const at = az0 + 0.9;
  const simS = plan(32.6, 4.85, 15.2, 10.2, 0.4);           // SIM 卡座
  put("g6", solid(k.slabOf(simS, at, 1.2, P, 2), { w: 2, inner: ln(k.planOutline(k.insetPlan(simS, 1.4), at + 1.2, P, 2), 4) + ln([0, 1, 2].map((i) => k.lineOnTop([simS.x + 4 + i * 3.4, simS.y + 3], [simS.x + 4 + i * 3.4, simS.y + 6.6], at + 1.2, P)).join(""), 3) }));
  put("g6", chip(33.0, 20.1, 43.1, 31.7, at, 1.4, "339S0030 ARM", 0, 1.3));     // Samsung S5L8900 處理器（疊 SDRAM）
  put("g6", chip(48.5, 22.6, 52.5, 27.0, at, 0.8, "", 0));                       // Wolfson WM8758 音訊
  put("g6", chip(29.7, 21.5, 31.9, 25.9, at, 0.7, "", 0));                       // Linear 4066 充電
  put("g6", chip(23.2, 14.6, 29.3, 20.4, at, 0.9, "", 0));
  put("g6", chip(44.2, 27.7, 54.0, 31.7, at, 1.3, "", 0));                       // 板對板連接器
  // 2 MP 相機（背面看左上）
  const CAM = plan(5.0, 4.6, 8.4, 8.4, 0.8);
  put("g6", solid(k.slabOf(CAM, az0, 4.6, P, 2), { w: 1 }));
  put("g6", solid(k.cylinder(9.2, 8.8, 2.7, az0 + 4.6, 1.1, P, 32), { w: 1, inner: ln(k.ring(9.2, 8.8, 1.5, az0 + 5.7, P, 28), 3) + ln(k.ring(9.2, 8.8, 0.7, az0 + 5.7, P, 20), 4) }));
  // 通訊板（階梯形外框，照片換算）
  const CBring = [[3.5, 20.7], [20.2, 20.7], [20.2, 25.8], [45.9, 25.8], [45.9, 27.95], [57.5, 27.95], [57.5, 50.4], [3.5, 50.4]];
  put("g6", halo({ x: 3.5, y: 20.7, w: 54, d: 29.7, r: 1 }, czb, P), 1);
  put("g6", solid(k.extrude(CBring, czb, 0.9, P, { convex: false }), { w: 1 }), 1);
  const ct = czb + 0.9;
  // 隔間屏蔽框（圍牆）
  const wall = (x0, y0, x1, y1) => solid(k.slabOf(plan(Math.min(x0, x1), Math.min(y0, y1), Math.max(0.45, Math.abs(x1 - x0)), Math.max(0.45, Math.abs(y1 - y0)), 0.1), ct, 1.3, P, 1), { w: 3, crease: 4 });
  const walls = [[4.2, 21.3, 4.2, 49.8], [4.2, 49.8, 56.9, 49.8], [56.9, 28.5, 56.9, 49.8], [40.7, 26.4, 40.7, 49.8], [16.6, 21.3, 16.6, 49.8], [4.2, 37.4, 16.6, 37.4], [22.7, 26.9, 39.0, 26.9], [22.7, 37.4, 39.0, 37.4], [22.7, 26.9, 22.7, 37.4], [39.0, 26.9, 39.0, 37.4], [4.2, 21.3, 19.6, 21.3], [40.7, 39.8, 56.9, 39.8]];
  // 晶片（照片換算位置，標上晶片打印）
  put("g6", chip(41.9, 41.0, 53.2, 49.3, ct, 1.1, "1030W0YTQ2", 1, 1.25)    // Intel NOR+SRAM 快閃
    + chip(41.9, 29.0, 53.2, 39.2, ct, 1.2, "337S3235", 1, 1.3)                 // Infineon PMB8876 S-Gold 2
    + chip(25.6, 42.8, 32.9, 49.0, ct, 0.9, "338S0289", 1, 1.0)                 // Infineon 收發器（白貼紙）
    + chip(17.3, 36.3, 22.0, 40.6, ct, 0.6, "", 1)                              // CSR BlueCore4 藍牙
    + chip(6.4, 38.2, 16.0, 45.4, ct, 1.0, "SKY77340", 1, 1.2)                  // Skyworks 功放
    + chip(6.4, 26.5, 15.1, 36.6, ct, 1.1, "338S0297", 1, 1.2)                  // 338S0297
    + chip(30.0, 28.0, 35.8, 33.0, ct, 0.8, "W8686", 1, 1.1), 1);              // Marvell Wi-Fi
  put("g6", walls.map((w) => wall(...w)).join(""), 1);
  put("g6", solid(k.cylinder(8.9, 48.4, 1.0, ct, 1.0, P, 16), { w: 3 }) + solid(k.cylinder(18.7, 23.6, 1.0, ct, 1.0, P, 16), { w: 3 }), 1);   // 天線同軸接頭
  put("g6", solid(k.slabOf(plan(12.4, 49.2, 9.6, 1.2, 0.2), ct, 0.4, P, 2), { w: 3 }), 1);                                                    // 電池焊盤
  // 兩條天線同軸線（白色）：從接頭沿左側往下到底部天線【拆：機內照片】
  const coax = (x, y, ox) => G.fillet([[x, y, ct + 1.0], [ox, y, ct + 1.0], [ox, 93, ct + 1.0]], 2.4, 7);
  put("g6", ln(pathOf(coax(18.7, 23.6, 2.4).map((p) => k.iso(p, P))), 2) + ln(pathOf(coax(8.9, 48.4, 3.4).map((p) => k.iso(p, P))), 2), 1);
  const plugF = (x) => G.frameOf([x, 93, ct + 1.0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  put("g6", solid(G.solidOf([[0, 0.9], [2.6, 0.9]], plugF(2.4), P), { w: 3 }) + solid(G.solidOf([[0, 0.9], [2.6, 0.9]], plugF(3.4), P), { w: 3 }), 1);
  put("g6", [[5.6, 15.4, az0 + 0.9], [11.0, 49.4, czb + 0.9], [55.6, 52.0, czb + 0.9]].map(([x, y, z]) => screwSvg(x, y, z, P)).join(""), 3);   // 主板螺絲 3 顆【拆】
  // 屏蔽罩上蓋（巡覽時掀開）
  const lid = k.extrude(CBring.map(([x, y]) => [x + (x < 10 ? 0.6 : x > 50 ? -0.6 : 0), y + (y < 30 ? 0.6 : -0.6)]), ct + 1.3, 0.35, P, { convex: false });
  const tabs = [[12, 30], [30, 44], [48, 34], [26, 31]].map(([x, y]) => k.planOutline(plan(x, y, 4, 2.4, 0.6), ct + 1.65, P, 2)).join("");
  put("g6", solid(lid, { w: 2, inner: ln(tabs, 4) }), 2, "lid");

  // ---- g7 電池（鋁塑膜、橙色膠帶包邊、標籤、焊線）----
  pat("g7");
  put("g7", halo(plan(5.0, 53.6, W - 10, 37.6, 2.4), 5.0, P));
  const BAT = plan(5.0, 53.6, W - 10, 37.6, 2.4);
  const btz = 5.0, bth = 4.4, btt = btz + bth;
  const tape = k.lineOnTop([BAT.x + 3.2, BAT.y + 1.5], [BAT.x + 3.2, BAT.y + BAT.d - 1.5], btt, P) + k.lineOnTop([BAT.x + BAT.w - 3.2, BAT.y + 1.5], [BAT.x + BAT.w - 3.2, BAT.y + BAT.d - 1.5], btt, P) + k.lineOnTop([BAT.x + 1.5, BAT.y + 3.0], [BAT.x + BAT.w - 1.5, BAT.y + 3.0], btt, P);
  const L = plan(BAT.x + 6, BAT.y + 6, 34, 26, 0.5);
  const rules = [0, 1, 2, 3, 4, 5].map((i) => k.lineOnTop([L.x + 3, L.y + 10 + i * 2.4], [L.x + (i % 2 ? 18 : 25), L.y + 10 + i * 2.4], btt, P)).join("");
  const barcode = Array.from({ length: 22 }, (_, i) => k.lineOnTop([L.x + 3 + i * 0.9 + (i % 3) * 0.2, L.y + L.d - 4.6], [L.x + 3 + i * 0.9 + (i % 3) * 0.2, L.y + L.d - 2.2], btt, P)).join("");
  put("g7", solid(k.slabOf(BAT, btz, bth, P, 6), { inner: ln(tape, 4) + ln(k.planOutline(L, btt, P, 2), 3) + ln(rules, 4) + ln(barcode, 4) + text(P, [L.x + 3, L.y + 6.4], btt, "616-0290  3.7V", 2.6) + ln(k.sideSeam(BAT, btz + 2.2, P, 6), 4) }));
  // 兩條焊線（紅黑）：電池上緣 → 主板焊點
  const wire = (x) => G.fillet([[x, 53.8, btt - 1.2], [x, 52.4, btt - 0.2], [x - 1, 49.8, btt - 0.6]], 1.2, 6);
  put("g7", ln(pathOf(wire(16).map((p) => k.iso(p, P))), 2) + ln(pathOf(wire(19).map((p) => k.iso(p, P))), 2) + dots([k.iso([15, 49.8, btt - 0.6], P), k.iso([18, 49.8, btt - 0.6], P)], 1.0));

  // ---- g8 鋁背板（弧面兩階、相機孔、刻字）＋耳機孔、SIM 支架、按鍵 ----
  pat("g8");
  put("g8", halo(plan(0, 0, W, 92.6, R), 6.5, P));
  const rz = 9.6, seam = 92.6;
  // 背板內側掛著的零件先畫（在背板下方）
  const jackF = G.frameOf([52.4, -0.4, rz - 2.6], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  put("g8", solid(G.solidOf([[0, 2.6], [1.2, 2.6], [1.2, 2.9], [13.5, 2.9]], jackF, P), { w: 2 }));       // 3.5 mm 耳機孔（內凹）
  put("g8", solid(k.slabOf(plan(33.6, 1.0, 17, 22, 0.6), rz - 0.7, 0.7, P, 2), { w: 3 }));              // SIM 支架
  // SIM 卡托＋SIM 卡：用迴紋針從頂部頂出（爆炸前先退出來）【拆】
  const tray = plan(35.2, -0.6, 12.2, 17.4, 0.6);
  put("g8", solid(k.slabOf(tray, rz - 2.0, 0.6, P, 2), { w: 2 }) + solid(k.slabOf(plan(36.4, 1.6, 9.8, 13.6, 0.4), rz - 1.4, 0.35, P, 2), { w: 2, inner: ln(k.planOutline(plan(38.2, 4.2, 6.2, 5.2, 0.6), rz - 1.05, P, 3), 3) }) + solid(k.slabOf(plan(36.2, -1.2, 10.2, 0.6, 0.2), rz - 2.0, 1.6, P, 2), { w: 2 }), 0, "sim");
  const shellRing = ringCustom(0, 0, W, seam, R, 0, 10);
  const shell = k.extrude(shellRing, rz, 1.0, P);
  const curve = ringCustom(1.4, 1.4, W - 1.4, seam, R - 1.4, 0, 10);
  const top2 = k.extrude(curve, rz + 1.0, 1.0, P, { bevel: 0.8 });
  put("g8", solid(shell, { w: 1 }));
  put("g8", solid(top2, { w: 2, inner: ln(k.ring(9.2, 8.8, 3.2, rz + 2.0, P, 32), 2) + ln(k.ring(9.2, 8.8, 2.4, rz + 2.0, P, 28), 4) + text(P, [W / 2 - 6.2, seam - 12], rz + 2.0, "A1203", 3.2) + ln(k.lineOnTop([W / 2 - 9, seam - 8.5], [W / 2 + 9, seam - 8.5], rz + 2.0, P), 4) }));
  // 側鍵（背面看右側＝正面左側）：響鈴開關、音量＋、音量−；頂部：睡眠鍵（背面看左側）【拆：照片】
  put("g8", solid(k.slabOf(plan(W, 21, 0.9, 5.4, 0.3), rz - 3.6, 2.2, P, 2), { w: 2 }) + solid(k.slabOf(plan(W, 31, 0.9, 6.4, 0.3), rz - 3.6, 2.2, P, 2), { w: 2 }) + solid(k.slabOf(plan(W, 39.4, 0.9, 6.4, 0.3), rz - 3.6, 2.2, P, 2), { w: 2 }));
  put("g8", solid(k.slabOf(plan(11, -0.9, 10, 0.9, 0.3), rz - 3.2, 2.2, P, 2), { w: 2 }));

  // ---- g9 天線蓋（黑色塑膠，細密剖面線表示深色材質）----
  pat("g9");
  put("g9", halo(plan(0, 92.6, W, H - 92.6, 6), 9.6, P));
  const capRing = ringCustom(0, seam, W, H, 0, R, 10);
  const cap = k.extrude(capRing, rz, 1.0, P);
  const capTop = ringCustom(1.4, seam, W - 1.4, H - 1.4, 0, R - 1.4, 10);
  const cap2 = k.extrude(capTop, rz + 1.0, 1.0, P, { bevel: 0.8 });
  const hatch = [];
  for (let i = -24; i < 64; i += 2.2) {
    const a = [i, seam], b = [i + 22, H];             // 45° 線，裁到頂面輪廓內（簡單的矩形裁切）
    const t0 = Math.max(0, (1.4 - a[0]) / 22), t1 = Math.min(1, (W - 1.4 - a[0]) / 22);
    if (t1 <= t0) continue;
    const p0 = [a[0] + 22 * t0, a[1] + (H - seam) * t0], p1 = [a[0] + 22 * t1, a[1] + (H - seam) * t1];
    if (p1[1] > H - 1.4 - 0.1 && (p1[0] < R || p1[0] > W - R)) continue;   // 圓角處略過
    hatch.push(k.lineOnTop(p0, [p1[0], Math.min(p1[1], H - 1.4 - 0.2)], rz + 2.0, P));
  }
  put("g9", solid(cap, { w: 1 }));
  put("g9", solid(cap2, { w: 2, inner: ln(hatch.join(""), 4) }));

  return items;
}

// 標註錨點（世界座標，組合狀態）：引線落點
export const ANCHORS = {
  g1: [W, 70, 1.1], g2: [W - 3, 60, 1.5], g3: [W - 5, 60, 4.2], g4: [W - 3.3, 70, 6.0], g5: [W - 3.4, 102, 9.6],
  g6: [W - 3.4, 30, 9.0], g7: [W - 5, 72, 9.4], g8: [W, 60, 11.6], g9: [W - 3, 104, 11.6],
};
export const DIM = { W, H, T };

// =====================================================================================
// 招牌時刻：2007 年的實體鍵盤手機（BlackBerry Curve 8300，2007-05）→ 初代 iPhone
// 【官／GSMArena、bbref】107 × 60 × 15.5 mm；2.5"、320×240（160 ppi → 2.0″ × 1.5″ = 50.8 × 38.1 mm）；QWERTY＋軌跡球
// 鍵盤排列、螢幕位置為示意【估】；不畫品牌標誌
const BB = { W: 60, H: 107, T: 15.5, R: 7, scr: [4.6, 9.5, 50.8, 38.1] };
const IP = { W, H, T, R, scr: [(W - AW) / 2, WIN_Y, AW, AH] };
export const RATIO = { bb: 50.8 * 38.1 / (60 * 107), ip: AW * AH / (W * H) };
const mix = (a, b, u) => a + (b - a) * u;
// 機身＋螢幕的變形：u = 0（鍵盤機）→ 1（iPhone）；FIG.01 的 shell/body/glass 在 u=1 時接手
export function morphFrame(u, P) {
  PAT = "pp-f1";
  const w = mix(BB.W, IP.W, u), h = mix(BB.H, IP.H, u), t = mix(BB.T, IP.T, u), r = mix(BB.R, IP.R, u);
  const ox = (IP.W - w) / 2;                      // 置中變形
  const s = BB.scr.map((v, i) => mix(v, IP.scr[i], u));
  const sh = solid(k.slabOf(plan(ox + 1.4, 1.4, w - 2.8, h - 2.8, r - 1.4), 0, 1.6, P, 12), { w: 2 });
  const body = solid(k.slabOf(plan(ox, 0, w, h, r), 1.6, t - 1.6, P, 12));
  const scr = k.onTop(k.ringOf(plan(ox + s[0], s[1], s[2], s[3], 0.6), 2), t, P, true);
  return sh + body + shadeFill(scr, 0) + ln(scr, 2);
}
// 鍵盤、導航列（軌跡球＋四個功能鍵）：各自一個零件，飛走用
export function bbKeys(P) {
  const z = BB.T, keys = [];
  const rows = [10, 10, 9, 7];
  rows.forEach((n, ri) => {
    const pitch = 5.2, w = 4.4, y = 64 + ri * 9.4, x0 = (BB.W - n * pitch) / 2 + 0.4;
    for (let c = 0; c < n; c++) {
      const wide = ri === 3 && c === 3;           // 空白鍵
      if (ri === 3 && c > 3 && c < 5) continue;
      const kw = wide ? w + pitch * 1 : w;
      keys.push({ row: ri, col: c, svg: solid(k.slabOf(plan(x0 + c * pitch, y, kw, 7.6, 1.6), z, 1.2, P, 3), { w: 2, inner: ln(k.planOutline(plan(x0 + c * pitch + 1.1, y + 1.4, kw - 2.2, 4.6, 1), z + 1.2, P, 3), 4) }) });
    }
  });
  const nav = [solid(k.cylinder(BB.W / 2, 55.5, 3.0, z, 1.6, P, 32), { w: 1, inner: ln(k.ring(BB.W / 2, 55.5, 1.6, z + 1.6, P, 24), 4) })];
  [[5, 51.5], [15, 51.5], [38, 51.5], [48, 51.5]].forEach(([x, y]) => nav.push(solid(k.slabOf(plan(x, y, 8, 7, 2.2), z, 0.8, P, 3), { w: 2 })));
  return { keys, nav };
}
export const BBDIM = BB;
