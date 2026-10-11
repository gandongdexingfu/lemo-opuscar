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

// =====================================================================================
// FIG. 02 背面爆炸圖（背面朝上：前面板在下 z=0，背板在上 z=11.6；x 由左到右＝從背面看）
// 九組，依 iFixit 拆機的反向順序堆疊
export const GROUPS = [
  { id: "g1", name: "不锈钢边框", sub: [] },
  { id: "g2", name: "玻璃盖板 + 触摸层", sub: ["Balda 电容触摸屏", "Home 键键帽"] },
  { id: "g3", name: "LCD 显示模组", sub: ["3.5 英寸 · 480×320 · 163 ppi"] },
  { id: "g4", name: "中框 + 显示排线", sub: ["S 形排线连接屏幕与主板", "振动马达 · Home 键弹片"] },
  { id: "g5", name: "扬声器腔体 + 底部接口", sub: ["腔体背面贴着天线软板", "30 针 Dock 接口"] },
  { id: "g6", name: "主板（双层叠板）", sub: ["处理器 Samsung S5L8900", "基带 Infineon S-Gold 2", "Wi-Fi Marvell W8686", "蓝牙 CSR BlueCore4", "200 万像素摄像头"] },
  { id: "g7", name: "锂聚合物电池", sub: ["3.7 V · 1400 mAh", "直接焊在主板上，不可拆换"] },
  { id: "g8", name: "铝合金后盖", sub: ["耳机孔 · SIM 卡托支架", "机身型号 A1203"] },
  { id: "g9", name: "天线盖", sub: ["塑料材质，让信号穿透"] },
];

export function fig2(P) {
  const items = {};
  const put = (g, svg) => (items[g] ||= []).push(svg);
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

  // ---- g3 LCD 模組（金屬背板朝上）----
  pat("g3");
  put("g3", halo(plan((W - AW) / 2 - 1.0, WIN_Y - 2.4, AW + 2.0, AH + 5.0, 1.2), 1.6, P));
  const lz = 1.6, lh = 2.6, lt = lz + lh;
  const LCD = plan(xw - 1.0, WIN_Y - 2.4, AW + 2.0, AH + 5.0, 1.2);
  const lcd = k.slabOf(LCD, lz, lh, P, 3);
  const stiff = k.planOutline(k.insetPlan(LCD, 3.2), lt, P, 3);
  const lbl = plan(xw + 8, WIN_Y + 18, 26, 14, 0.6);
  const lblLines = [0, 1, 2, 3].map((i) => k.lineOnTop([lbl.x + 3, lbl.y + 3 + i * 2.6], [lbl.x + (i === 3 ? 13 : 21), lbl.y + 3 + i * 2.6], lt, P)).join("");
  // 背光 LED 條在下緣【估】、LCD 排線從下緣伸出
  const ledEdge = k.lineOnTop([LCD.x + 2, LCD.y + LCD.d - 3.2], [LCD.x + LCD.w - 2, LCD.y + LCD.d - 3.2], lt, P);
  put("g3", solid(lcd, { inner: ln(stiff, 3) + ln(k.planOutline(lbl, lt, P, 2), 3) + ln(lblLines, 4) + ln(ledEdge, 4) + ln(k.sideSeam(LCD, lz + 1.0, P, 3), 4) }));
  const tab = ribbon([[W / 2, LCD.y + LCD.d - 1], [W / 2, LCD.y + LCD.d + 4.5]], 14, lt - 0.05, P, 2);
  put("g3", `<g class="s">${fillP(tab.fill)}${flat(tab.fill)}${ln(tab.edges, 2)}</g>`);

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
  // 天線同軸線兩條：從天線軟板出發，沿腔體頂面到邊緣的同軸接頭（另一端的插座在主板上）【拆：兩條天線線】
  const coax = (x, y1) => G.fillet([[x, 97, ez + eh], [x, 95, ez + eh + 0.8], [x, y1, ez + eh + 0.8]], 1.6, 6);
  put("g5", ln(pathOf(coax(9, 89.5).map((p) => k.iso(p, P))), 2) + ln(pathOf(coax(12.2, 90.5).map((p) => k.iso(p, P))), 3));
  const plugF = (x, y) => G.frameOf([x, y, ez + eh + 0.8], [0, -1, 0], [1, 0, 0], [0, 0, 1]);
  put("g5", solid(G.solidOf([[0, 0.9], [2.4, 0.9]], plugF(9, 89.5), P), { w: 3 }) + solid(G.solidOf([[0, 0.9], [2.4, 0.9]], plugF(12.2, 90.5), P), { w: 3 }));

  // ---- g6 主板疊層（通訊板在下、應用板在上）＋相機 ----
  pat("g6");
  put("g6", halo(plan(3.4, 3.4, W - 6.8, 47.6, 1.6), 5.0, P));
  const bz0 = 5.0;
  const CB = plan(3.4, 3.4, W - 6.8, 47.6, 1.6);              // 通訊板【估：照片比例】
  put("g6", solid(k.slabOf(CB, bz0, 1.0, P, 3), { w: 1, inner: ln(k.sideSeam(CB, bz0 + 0.5, P, 3), 4) }));
  const cbShield = plan(4.4, 22, 13.2, 27, 0.8);              // 通訊板外露部分的屏蔽罩
  put("g6", solid(k.slabOf(cbShield, bz0 + 1.0, 1.4, P, 2), { w: 2, inner: ln(k.planOutline(k.insetPlan(cbShield, 1.2), bz0 + 2.4, P, 2), 4) }) + dots(k.dotGrid(cbShield.x + 2.6, cbShield.y + 3, 4, 8, 2.8, bz0 + 2.4, P), 0.55));
  // 板對板連接器（兩層板之間）
  put("g6", solid(k.slabOf(plan(22, 40, 14, 4, 0.5), bz0 + 1.0, 1.6, P, 2), { w: 2 }));
  // 應用板（含 SIM 卡座）
  const AB = plan(18.6, 3.4, W - 22, 44.6, 1.6);
  const az = bz0 + 2.6;
  put("g6", solid(k.slabOf(AB, az, 1.0, P, 3), { w: 1, inner: ln(k.sideSeam(AB, az + 0.5, P, 3), 4) }));
  const sim = plan(34.6, 4.4, 15, 22, 0.6);                    // SIM 卡座【拆：在板上，靠近頂端】
  put("g6", solid(k.slabOf(sim, az + 1.0, 1.6, P, 2), { w: 2, inner: ln(k.planOutline(k.insetPlan(sim, 1.8), az + 2.6, P, 2), 4) + ln([0, 1, 2, 3, 4, 5].map((i) => k.lineOnTop([sim.x + 4 + (i % 3) * 3.4, sim.y + 6 + Math.floor(i / 3) * 9], [sim.x + 4 + (i % 3) * 3.4, sim.y + 9 + Math.floor(i / 3) * 9], az + 2.6, P)).join(""), 3) }));
  const big = plan(19.6, 27, 36, 19.6, 0.8);                   // 大屏蔽罩（下有 SoC＋SDRAM 堆疊、NAND）
  put("g6", solid(k.slabOf(big, az + 1.0, 1.5, P, 2), { w: 2, inner: ln(k.planOutline(k.insetPlan(big, 1.4), az + 2.5, P, 2), 4) }) + dots(k.dotGrid(big.x + 3, big.y + 3.2, 11, 5, 3.0, az + 2.5, P), 0.55));
  const small = plan(51, 5.4, 6, 18, 0.6);
  put("g6", solid(k.slabOf(small, az + 1.0, 1.2, P, 2), { w: 2 }));
  // 隱藏線：屏蔽罩下的晶片（藍圖慣例：虛線）；位置示意
  put("g6", hid(k.planOutline(plan(24, 30, 12, 12, 0.4), az + 2.5, P, 2) + k.planOutline(plan(39, 30, 13, 13, 0.4), az + 2.5, P, 2) + k.planOutline(plan(6.2, 25, 9.6, 9.6, 0.3), bz0 + 2.4, P, 2)));
  // 主板固定螺絲（3 顆【拆】）、天線同軸接頭（2 個【拆】）、電池焊點
  put("g6", ln([[21.2, 6.8], [55.4, 44.6]].map(([x, y]) => k.ring(x, y, 1.1, az + 1.0, P, 14)).join("") + k.ring(6.4, 46, 1.1, bz0 + 1.0, P, 14), 3) + dots([[21.2, 6.8, az + 1.0], [55.4, 44.6, az + 1.0], [6.4, 46, bz0 + 1.0]].map((p) => k.iso(p, P)), 0.7));
  put("g6", solid(k.cylinder(9, 18, 1.3, bz0 + 1.0, 1.2, P, 18), { w: 3 }) + solid(k.cylinder(11.6, 14.4, 1.3, bz0 + 1.0, 1.2, P, 18), { w: 3 }));
  put("g6", solid(k.slabOf(plan(21, 48.6, 7, 2.6, 0.3), az, 0.6, P, 2), { w: 3 }));   // 電池焊點
  // 2 MP 相機模組（背面看左上）＋鏡頭
  const CAM = plan(5.0, 4.6, 8.4, 8.4, 0.8);
  put("g6", solid(k.slabOf(CAM, bz0 + 1.0, 3.8, P, 2), { w: 1 }));
  put("g6", solid(k.cylinder(9.2, 8.8, 2.7, bz0 + 4.8, 1.1, P, 32), { w: 1, inner: ln(k.ring(9.2, 8.8, 1.5, bz0 + 5.9, P, 28), 3) + ln(k.ring(9.2, 8.8, 0.7, bz0 + 5.9, P, 20), 4) }));

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
  const wire = (x) => G.fillet([[x, 53.8, btt - 1.2], [x, 52.2, btt - 0.2], [x - 1, 49.6, az + 0.6]], 1.2, 6);
  put("g7", ln(pathOf(wire(23).map((p) => k.iso(p, P))), 2) + ln(pathOf(wire(26).map((p) => k.iso(p, P))), 2) + dots([k.iso([22, 49.6, az + 0.6], P), k.iso([25, 49.6, az + 0.6], P)], 1.0));

  // ---- g8 鋁背板（弧面兩階、相機孔、刻字）＋耳機孔、SIM 支架、按鍵 ----
  pat("g8");
  put("g8", halo(plan(0, 0, W, 92.6, R), 6.5, P));
  const rz = 9.6, seam = 92.6;
  // 背板內側掛著的零件先畫（在背板下方）
  const jackF = G.frameOf([52.4, -0.4, rz - 2.6], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  put("g8", solid(G.solidOf([[0, 2.6], [1.2, 2.6], [1.2, 2.9], [13.5, 2.9]], jackF, P), { w: 2 }));       // 3.5 mm 耳機孔（內凹）
  put("g8", solid(k.slabOf(plan(33.6, 1.0, 17, 22, 0.6), rz - 0.7, 0.7, P, 2), { w: 3 }));              // SIM 支架
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
