// FIG. 02 背面爆炸圖（精確版）。所有尺寸 mm。背面朝上：前面板 z=0，背板頂 z=11.6；x 由左到右＝從背面看，y=0 是頂端。
// 每個零件畫的同時把真實形狀登記進 Anatomy 的 recorder，build 時由 audit 驗證：穿插、懸空、端點、前後順序。
// 依據：拆解/005b（零件清單第二版）、005c（座標換算）。【官】官方｜【拆】iFixit 拆機照片 S1–S27｜【FCC】FCC 內部照片（工程樣機，只佐證）｜【估】照片比例估算
import { k, G, plan, pathOf, frameSolid, onSide, roundRect2, ringCustom } from "./lib.mjs";
import * as A from "../../../vendor/anatomy/kit/audit.mjs";
import { tubePieces } from "../../../vendor/anatomy/kit/tube.mjs";

const W = 61, H = 115, T = 11.6, R0 = 9.5;          // 外形【官】；圓角【估】
const AW = 49.3, AH = 74.0, WIN_Y = 20.5;              // 可視區（3.5" 3:2，由對角線算）
const HOME_Y = 104.6, HOME_R = 5.6, EAR_Y = 10.2;
const SEAM = 92.6;                                     // 鋁背板與黑色天線蓋接縫（約 1/5）【拆】
export const SUBZ = 6;                                 // 組內分層：爆炸時每層多升 6 mm

// ---- z 方向疊層（全部【估】，只有總厚 11.6【官】）----
const Z = {
  glass0: 0.3, glass1: 1.3, lcd1: 3.4, plate1: 3.8, frame0: 1.6, frame1: 6.0, bezel1: 2.2,
  flex1: 3.95,                     // S 形排線薄片頂
  holder1: 5.0, ab1: 5.8,          // SIM 卡座頂＝應用板底；應用板頂
  part1: 7.0,                      // 處理器面零件頂＝通訊板底
  cb1: 7.7, fence1: 8.9, lid1: 9.2,
  back: 9.6,                       // 背殼內頂
  encl1: 8.6,
};

// ---- 標記 ----
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ln = (d, w = 2, free = false) => (d ? `<path class="ln w${w}"${free ? ' data-free=""' : ""} pathLength="1" d="${d}"/>` : "");   // free：代表印刷文字的線，允許停在面中間
const fillP = (d) => `<path class="f" d="${d}"/>`;
const flat = (d) => `<path class="tp" d="${d}"/>`;
let P;
const halo = (pl, z) => `<path class="iso-halo halo" d="${k.slabOf(pl, z, 0.1, P, 10).fill}"/>`;
function solid(p, { w = 1, crease = 3, cls = "", wall = "", inner = "" } = {}) {
  const sh = p.shades.map((d, i) => (d ? `<path class="sh" data-s="${i}" d="${d}"/>` : "")).join("");
  return `<g class="s ${cls}">${fillP(p.fill)}${sh}${wall ? `<path class="sh" data-s="0" d="${wall}"/>` : ""}<path class="tp" d="${p.top}"/>${ln(p.crease, crease)}${inner}${ln(p.outline, w)}</g>`;
}
const dots = (pts, r = 0.9) => `<g class="dt">${pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`).join("")}</g>`;
const text = (at, z, s, size = 1.5) => `<g transform="${k.topMatrix(at, z, P, "x")}"><text class="et" font-size="${size}">${esc(s)}</text></g>`;

// ---- 組與爆炸位移 ----
export const GROUPS = [
  { id: "g1", name: "金属边框", sub: ["包住玻璃边缘的亮面一圈"] },
  { id: "g2", name: "玻璃盖板 + 触摸层", sub: ["电容式多点触控（Balda 供应）", "Home 键键帽"] },
  { id: "g3", name: "LCD 显示模组", sub: ["3.5 英寸 · 480×320 · 163 ppi", "拆机未拆开屏幕，内部不画"] },
  { id: "g4", name: "前框 + 中板", sub: ["S 形显示排线 · 扬声器 · 振动马达", "#00 十字螺丝（周边 10 颗）"] },
  { id: "g5", name: "扬声器腔体 + Dock 接口", sub: ["空心塑料件，外面包着天线软板", "30 针 Dock 接口"] },
  { id: "g6", name: "主板（两层叠在一起）", sub: ["通讯板：基带 S-Gold 2 · 功放 Skyworks", "Wi-Fi Marvell W8686 · 蓝牙 CSR", "应用板：处理器 339S0030 ARM", "SIM 卡座 · 200 万像素摄像头"] },
  { id: "g7", name: "锂聚合物电池", sub: ["3.7 V · 1400 mAh · 616-0290", "红、白、黑三条线焊在通讯板上"] },
  { id: "g8", name: "铝合金后盖", sub: ["耳机孔与排线 · SIM 卡压板", "接地片 · 机身型号 A1203"] },
  { id: "g9", name: "天线盖", sub: ["塑料材质，让信号穿透"] },
];
// 階梯式爆炸：每組在螢幕上平移 STEP（機身平行四邊形座標 α≥1.05 才不重疊，見 v3 紀錄）
export const STEP = [420, 10];
// 螢幕位移 → 地面上的世界位移（同一個 iso 投影的反解）
function floorMove([sx, sy]) {
  const o = k.iso([0, 0, 0], P), ex = k.iso([1, 0, 0], P), ey = k.iso([0, 1, 0], P);
  const a = ex[0] - o[0], b = ey[0] - o[0], c = ex[1] - o[1], d = ey[1] - o[1], det = a * d - b * c;
  return [(d * sx - b * sy) / det, (-c * sx + a * sy) / det, 0];
}

// 爆炸分三段（每段都是直線平移，audit 能逐段驗證）：
//  A 抬升：各組垂直升起疊成塔（第 i 組升 i·LIFT），先把套在框裡的零件拔出來
//  B 發牌：各組在各自高度上水平滑到階梯位置（螢幕上的終點與 v3 相同）
//  C 分層：組內分層（屏蔽蓋、螺絲等）再升起
export const LIFT = 12;
let REC, PH;   // PH = { base(g, sub) → 本段開始時的位移, move(g, sub) → 本段的位移 }
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export function phases(P0) {
  P = P0;
  const lift = (g) => [0, 0, GROUPS.findIndex((x) => x.id === g) * LIFT];
  const slide = (g) => { const i = GROUPS.findIndex((x) => x.id === g), o = k.iso([0, 0, 0], P), z = k.iso(lift(g), P); return floorMove([(i - 4) * STEP[0] - (z[0] - o[0]), (i - 4) * STEP[1] - (z[1] - o[1])]); };
  const subz = (sub) => [0, 0, sub * SUBZ];
  return {
    A: { base: () => [0, 0, 0], move: (g) => lift(g) },
    B: { base: (g) => lift(g), move: (g) => slide(g) },
    C: { base: (g) => add3(lift(g), slide(g)), move: (g, sub) => subz(sub) },
    lift, slide,
  };
}
function item(g, sub, tag, id, svg, shapes, { record = true, bias = 0, route, chunk, at: at0 } = {}) {
  const base = PH.base(g, sub), moved = shapes.map((sh) => A.moved(sh, base));
  const bs = moved.map(A.boundsOf);
  const at = at0 ? add3(at0, base) : [0, 1, 2].map((i) => (Math.min(...bs.map((b) => b.min[i])) + Math.max(...bs.map((b) => b.max[i]))) / 2);
  REC.put({ piece: g, ride: g, at, bias, move: PH.move(g, sub), shapes: record ? moved.map(REC.solid) : moved, name: id, svg, sub, tag, g, route, chunk });
}
const nm = (g, name) => REC.nameFor(`${g}.${name}`);
// 圓角方塊零件
function block(g, sub, name, pl, z, h, o = {}) {
  const steps = o.steps ?? 2, id = nm(g, name);
  const shape = A.slab(pl, z, h, { name: id, ...(o.meta || {}) }, steps);
  item(g, sub, o.tag || "", id, (o.halo ? halo(pl, z) : "") + solid(k.slabOf(pl, z, h, P, steps), o) + (o.extra || ""), [shape]);
  return shape;
}
// 任意多邊形板件
function prism(g, sub, name, ring, z, h, o = {}) {
  const id = nm(g, name);
  const shape = A.extruded(ring, z, h, { name: id, ...(o.meta || {}) });
  item(g, sub, o.tag || "", id, (o.halo ? `<path class="iso-halo halo" d="${k.extrude(ring, z, 0.1, P, { convex: false }).fill}"/>` : "") + solid(k.extrude(ring, z, h, P, { convex: false }), o) + (o.extra || ""), [shape]);
  return shape;
}
function cyl(g, sub, name, cx, cy, r, z, h, o = {}) {
  const id = nm(g, name);
  const shape = A.cylinder(cx, cy, r, z, h, { name: id, ...(o.meta || {}) });
  item(g, sub, o.tag || "", id, solid(k.cylinder(cx, cy, r, z, h, P, o.seg ?? 28), o) + (o.extra || ""), [shape]);
  return shape;
}
// 晶片：上面印字（照片可讀的打印）
const chip = (g, sub, name, x0, y0, x1, y1, z, h, mark = "", size = 1.2) =>
  block(g, sub, name, plan(x0, y0, x1 - x0, y1 - y0, 0.25), z, h, { w: 2, inner: mark ? text([x0 + 0.6, (y0 + y1) / 2 + size * 0.35], z + h, mark, size) : "" });
// #00 十字螺絲頭
function screw(g, sub, name, x, y, z, r = 0.95, down = false) {
  const h = 0.5, z0 = down ? z - h : z, zt = down ? z - h : z + h;
  const cross = k.lineOnTop([x - r * 0.55, y], [x + r * 0.55, y], zt, P) + k.lineOnTop([x, y - r * 0.55], [x, y + r * 0.55], zt, P);
  return cyl(g, sub, name, x, y, r, z0, h, { w: 2, seg: 18, inner: down ? "" : ln(cross, 3) });
}
// 管線（同軸線、電池焊線）：分段畫，每段登記；端點落在真實的座上
function cable(g, sub, name, pts, r, { bend = 1.6, cls = "wire-w", free = [false, false], bundle, touch } = {}) {
  const id = nm(g, name);
  const route = G.fillet(pts, bend, 9, { P, tube: r }), base = PH.base(g, sub);
  REC.route(id, route.map((p) => add3(p, base)), r, { piece: g, ride: g, move: PH.move(g, sub), limp: true, free, bundle, touch });
  tubePieces(route, r, P, { maxLength: 8, spacing: 1 }).forEach((pc, i) => {
    const svg = `<g class="s tb ${cls}"><path class="tbb" d="${pc.body}"/>${pc.wide ? `<path class="tbs" d="${pc.shine}"/><path class="tbd" d="${pc.shade}"/>` : ""}${ln(pc.edges, 2)}</g>`;
    item(g, sub, "", `${id}:${i}`, svg, [A.tube(pc.points, pc.radii)], { record: false, route: id, chunk: i });
  });
  return route;
}
// 圍成一圈的零件（邊框、前框、背殼側壁）要拆成「遠半圈」與「近半圈」，裡面的零件才排得出前後（Anatomy 畫家順序規則）
// outer、inner 同方向；沿著右上角—左下角的對角線切開：遠半圈＝頂邊＋左邊，近半圈＝底邊＋右邊
function splitRing(outer, inner, f) {
  const lerp = (a, b, va, vb) => { const t = va / (va - vb); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
  const half = (ring, sign) => {
    const n = ring.length, v = ring.map((p) => sign * f(p));
    let s = 0; while (!(v[(s - 1 + n) % n] < 0 && v[s] >= 0)) s++;
    const out = [lerp(ring[(s - 1 + n) % n], ring[s], v[(s - 1 + n) % n], v[s])];
    let i = s; while (v[i % n] >= 0) { out.push(ring[i % n]); i++; }
    out.push(lerp(ring[(i - 1) % n], ring[i % n], v[(i - 1) % n], v[i % n]));
    return out;
  };
  return [-1, 1].map((sign) => half(outer, sign).concat(half(inner, sign).reverse()));
}
// 一端開口的 U 形側壁（背殼、天線蓋）：整個是一個簡單多邊形，用半平面裁切成遠／近兩塊
function splitPoly(poly, g) {
  return [-1, 1].map((sign) => {
    const out = [];
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length], va = sign * g(a), vb = sign * g(b);
      if (va >= 0) out.push(a);
      if ((va >= 0) !== (vb >= 0)) { const t = va / (va - vb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    });
    return out;
  });
}
// 遠／近的分界：牆的外法線與水平視線方向垂直之處。cen＝四個圓角圓心圍成的矩形（直牆段沒有圓角就延伸到端點）
function facing([cx0, cy0, cx1, cy1]) {
  const V = A.cameraBasis(P).V, l = Math.hypot(V[0], V[1]), n = [V[0] / l, V[1] / l];
  return (p) => { const qx = Math.min(cx1, Math.max(cx0, p[0])), qy = Math.min(cy1, Math.max(cy0, p[1])); return (p[0] - qx) * n[0] + (p[1] - qy) * n[1]; };
}
function ringWalls(g, sub, name, outer, inner, z, h, cen, o = {}) {
  const f = facing(cen);
  const halves = o.open ? splitPoly(o.open, f) : splitRing(outer, inner, f);
  if (o.slot) {   // 牆上有一個穿過零件的槽（SIM 卡托）：遠半圈再切成「槽左、槽右、槽上的楣、槽下的檻」，各自排得出前後
    const { x0, x1, z0, z1 } = o.slot, far = halves[0];
    const left = splitPoly(far, (p) => p[0] - x0)[0], right = splitPoly(far, (p) => p[0] - x1)[1];
    const mid = splitPoly(splitPoly(far, (p) => p[0] - x0)[1], (p) => p[0] - x1)[0];
    [["far", left, z, h], ["far-right", right, z, h], ["sill", mid, z, z0 - z], ["lintel", mid, z1, z + h - z1]].forEach(([part, ring, zz, hh]) => {
      const id = nm(g, `${name}-${part}`);
      item(g, sub, "", id, (o.halo && part === "far" ? o.halo : "") + solid(k.extrude(ring, zz, hh, P, { convex: false }), { w: o.w ?? 1, inner: part === "far" ? o.innerFar || "" : "" }), [A.extruded(ring, zz, hh, { name: id, ...(o.meta || {}), cut: o.cuts })]);
    });
    const near = halves[1]; halves.length = 0; halves.push(null, near);
  }
  halves.forEach((ring, i) => {
    if (!ring) return;
    const id = nm(g, `${name}-${i ? "near" : "far"}`);
    item(g, sub, "", id, (o.halo && !i ? o.halo : "") + solid(k.extrude(ring, z, h, P, { convex: false }), { w: o.w ?? 1, inner: i ? o.innerNear || "" : o.innerFar || "" }), [A.extruded(ring, z, h, { name: id, ...(o.meta || {}), cut: o.cuts })]);
  });
}
// 照片座標換算（005c）
const S = 0.0725;
const SOLDER_R = 0.6, SOLDER_Z = 7.9 + 0.6, SOLDER_D = Math.sqrt(SOLDER_R * SOLDER_R - 0.35 * 0.35);   // 焊錫球（半埋在焊盤裡）
const cb = (gx, gy) => { const px = 20 + gx / 2, py = 40 + gy / 2; return [3.5 + (775 - px) * S, 20.7 + (470 - py) * S]; };   // S26 放大圖 → 通訊板（旋轉 180°）
const AB_X0 = 10.8;                                                                                                       // 應用板 x 起點：由 S13 相機接頭位置定（x 18–21.7）
const ab = (px, py) => [AB_X0 + (530 - py) * S, 3.4 + (px - 20) * S];                                                      // S25 左 → 應用板（旋轉 90°）
const rectOf = (p0, p1) => { const x0 = Math.min(p0[0], p1[0]), x1 = Math.max(p0[0], p1[0]), y0 = Math.min(p0[1], p1[1]), y1 = Math.max(p0[1], p1[1]); return [x0, y0, x1, y1]; };

export function fig2(proj, rec, phase) {
  P = proj; REC = rec; PH = phase;
  const full = plan(0, 0, W, H, R0);
  const xw = (W - AW) / 2;

  // ================= g1 金屬邊框 =================
  {
    const inner = plan(1.5, 1.5, W - 3, H - 3, R0 - 1.5);
    ringWalls("g1", 0, "bezel", k.ringOf(full, 12), k.ringOf(inner, 12), 0, Z.bezel1, [R0, R0, W - R0, H - R0], { innerNear: ln(k.sideSeam(full, 1.1, P, 12), 4) });
  }

  // ================= g2 玻璃＋觸控層（從背面看到內側）＋ Home 鍵帽 =================
  {
    const GL = plan(1.5, 1.5, W - 3, H - 3, R0 - 1.5), id = nm("g2", "glass");
    const gl = k.slabOf(GL, Z.glass0, Z.glass1 - Z.glass0, P, 12), gt = Z.glass1;
    const mask = k.planOutline(plan(xw - 1.2, WIN_Y - 1.2, AW + 2.4, AH + 2.4, 1.2), gt, P, 3);
    const grid = [];   // 觸控電極網格：原理示意（拆機看不到電極），標註時說明
    for (let i = 1; i < 10; i++) grid.push(k.lineOnTop([xw + AW * i / 10, WIN_Y], [xw + AW * i / 10, WIN_Y + AH], gt, P));
    for (let i = 1; i < 15; i++) grid.push(k.lineOnTop([xw, WIN_Y + AH * i / 15], [xw + AW, WIN_Y + AH * i / 15], gt, P));
    const ear = plan(W / 2 - 5.2, EAR_Y - 0.8, 10.4, 1.6, 0.8);
    const shape = A.slab(GL, Z.glass0, Z.glass1 - Z.glass0, { name: id, cut: [A.cylinder(W / 2, HOME_Y, HOME_R, -1, 4), A.slab(ear, -1, 4, {}, 4)] }, 12);
    item("g2", 0, "", id, halo(GL, Z.glass0) + `<g class="s">${fillP(gl.fill)}${gl.shades.map((d, i) => (d ? `<path class="sh" data-s="${i}" d="${d}"/>` : "")).join("")}<path class="tp" d="${gl.top}"/>${ln(mask, 2)}${ln(k.planOutline(plan(xw, WIN_Y, AW, AH, 0), gt, P, 1), 3)}${ln(grid.join(""), 4)}${ln(k.planOutline(ear, gt, P, 4), 3)}${ln(k.ring(W / 2, HOME_Y, HOME_R, gt, P, 40), 2)}${ln(gl.crease, 3)}${ln(gl.outline, 1)}</g>`, [shape]);
    // Home 鍵帽：從背面看到的是它壓在玻璃內側的凸緣（按鍵本體在玻璃孔裡，看不到）【拆 S5】
    cyl("g2", 0, "home-cap", W / 2, HOME_Y, HOME_R + 0.6, Z.glass1, 0.4, { w: 2, seg: 40, inner: ln(k.ring(W / 2, HOME_Y, HOME_R - 1.4, Z.glass1 + 0.4, P, 32), 4) });
  }

  // ================= g3 LCD 顯示模組（拆機沒拆開，按一整塊畫）=================
  {
    const LCD = plan(xw - 1.0, WIN_Y - 2.4, AW + 2.0, AH + 5.0, 1.2);
    block("g3", 0, "lcd", LCD, Z.glass1, Z.lcd1 - Z.glass1, { steps: 3, halo: true, inner: ln(k.sideSeam(LCD, Z.glass1 + 1.0, P, 3), 4) });
  }

  // ================= g4 前框＋中板（S 形排線、接頭、揚聲器、馬達、周邊螺絲）=================
  {
    const FR = plan(1.5, 1.5, W - 3, H - 3, R0 - 1.5), IN = k.insetPlan(FR, 1.8);
    // 前框的開口：SIM 卡托通道、耳機孔、Dock 開口（零件必須穿過它們）
    const cuts = [A.box([21.8, -1, 3.85], [39.3, 5, 7.5]), A.box([48.8, -1, 3.75], [55.2, 6, 7.5]), A.box([19.4, 108, 3.85], [41.6, 116, 7.5])];   // 前框在卡托、耳機孔、Dock 處開槽（形狀【估】）
    ringWalls("g4", 0, "frame", k.ringOf(FR, 12), k.ringOf(IN, 12), Z.frame0, Z.frame1 - Z.frame0, [R0, R0, W - R0, H - R0], { halo: halo(FR, Z.frame0), cuts, meta: { ground: true } });
    // 中板：兩大塊平面金屬區（S20 換算）【拆】
    const panels = k.planOutline(plan(4.5, 62, 25.5, 29, 1.2), Z.plate1, P, 3) + k.planOutline(plan(21, 15.5, 34, 26, 1.2), Z.plate1, P, 3);
    block("g4", 0, "plate", IN, Z.lcd1, Z.plate1 - Z.lcd1, { steps: 12, w: 2, inner: ln(panels, 3) });
    // S 形顯示排線：一整片軟板，上面印著蛇形走線（輪廓與走線由 S20 透視校正換算）【拆 S20、S22、S23】
    const sheet = [[38.0, 44.0], [55.0, 44.0], [55.0, 49.6], [51.0, 53.6], [56.8, 62.0], [56.8, 92.2], [33.0, 92.2], [31.5, 57.0], [39.0, 53.4], [38.0, 49.6]];
    const mid = G.fillet([[46.5, 46.6], [46.5, 48.6], [52.4, 57], [52.4, 85.5], [44.4, 85.5], [44.4, 61.5], [36.4, 61.5], [36.4, 92.2]].map(([x, y]) => [x, y, Z.flex1]), 3.6, 10);
    const traces = [];
    for (let j = -2; j <= 2; j++) {
      const off = mid.map((p, i) => { const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * j * 0.75, p[1] + dx / l * j * 0.75]; });
      traces.push(k.onTop(off, Z.flex1, P));
    }
    prism("g4", 0, "s-flex", sheet, Z.plate1, Z.flex1 - Z.plate1, { w: 2, inner: ln(traces.join(""), 3) });
    // 排線頭：顯示（插通訊板底面）＋另兩個排線接頭（喇叭、觸控，iFixit step 16 說主板下有三個接頭）【拆 S20】
    block("g4", 0, "flex-conn", plan(39.2, 44.4, 15.4, 4.8, 0.4), Z.flex1, 6.0 - Z.flex1, { w: 2, inner: ln(k.lineOnTop([40.4, 46.8], [53.4, 46.8], 6.0, P), 4) });
    block("g4", 0, "conn-a", plan(10.6, 43.6, 5.4, 3.6, 0.3), Z.plate1, 1.1, { w: 2 });
    block("g4", 0, "conn-b", plan(45.0, 34.6, 5.2, 3.4, 0.3), Z.plate1, 1.1, { w: 2 });
    // 揚聲器（黑色方塊）與圓形震動馬達：都藏在空心塑料件下面【拆 S23】
    block("g4", 0, "speaker", plan(7.2, 100.2, 11.6, 7.2, 1.0), Z.plate1, 2.8, { w: 2, inner: ln(k.ring(13, 103.8, 2.4, Z.plate1 + 2.8, P, 28), 3) + ln(k.ring(13, 103.8, 1.1, Z.plate1 + 2.8, P, 20), 4) });
    cyl("g4", 0, "vibrator", 51.0, 103.2, 4.0, Z.plate1, 2.2, { w: 2, seg: 40, inner: ln(k.ring(51.0, 103.2, 2.0, Z.plate1 + 2.2, P, 24), 4) });
    // 周邊 10 顆 #00 螺絲：落在前框上（iFixit step 14）
    [[2.4, 12], [2.4, 40], [2.4, 70], [2.4, 100], [W - 2.4, 12], [W - 2.4, 40], [W - 2.4, 70], [W - 2.4, 100], [16, 2.4], [45, 112.6]].forEach(([x, y]) => screw("g4", 3, "screw", x, y, Z.frame1, 0.85));
  }

  // ================= g5 揚聲器腔（空心）＋天線軟板（素面）＋ Dock =================
  {
    const EN = plan(3.4, 92.8, W - 6.8, 15.8, 3), id = nm("g5", "enclosure");   // 空心件止於 Dock 之前
    const en = k.slabOf(EN, Z.plate1, Z.encl1 - Z.plate1, P, 6);
    const shape = A.slab(EN, Z.plate1, Z.encl1 - Z.plate1, { name: id, cut: A.slab(k.insetPlan(EN, 1.0), Z.plate1 - 1, Z.encl1 - Z.plate1, {}, 6) }, 6);
    item("g5", 0, "", id, halo(EN, Z.plate1) + solid(en, { inner: ln(k.planOutline(k.insetPlan(EN, 1.4), Z.encl1, P, 4), 3) + ln(k.sideSeam(EN, Z.plate1 + 2.4, P, 6), 4) }), [shape]);
    // 30 針 Dock 接口：底面開口裡 30 根針腳【官】
    const DK = plan(19.6, 108.8, 21.8, 2.8, 0.6);   // 插座本體在前框內；插頭從底面開口伸進來（針腳約在表面內 3 mm）
    const pins = Array.from({ length: 30 }, (_, i) => { const u = 21.2 + i * (18.6 / 29); return onSide("y", 111.6, [[u, 5.1], [u, 6.0]], P); }).join("");
    block("g5", 0, "dock", DK, 3.95, 3.4, { w: 2, inner: ln(onSide("y", 111.6, roundRect2(20.6, 4.6, 19.8, 2.0, 0.9), P, true), 2) + ln(pins, 4) });
  }

  // ================= g6 主板：應用板（下，處理器面朝背面）＋通訊板（上）＋相機 =================
  {
    // ---- 應用板（820-2219-A）----
    const board = [[10.8, 13.9], [18.1, 13.9], [18.1, 3.4], [22.4, 3.4], [22.4, 13.9], [45.2, 13.9], [45.2, 32.4], [10.8, 32.4]];
    const abShape = prism("g6", 0, "app-board", board, Z.holder1, Z.ab1 - Z.holder1, { halo: true, inner: text([30, 31.6], Z.ab1, "820-2219-A", 0.9) });
    // 朝螢幕那面（從背面看不到）：SIM 卡座與兩塊顆粒屏蔽罩【拆 S19】
    block("g6", 0, "gran-shield", plan(11.4, 15.0, 10.4, 9.0, 0.3), Z.plate1, Z.holder1 - Z.plate1, { w: 2 });
    block("g6", 0, "gran-shield", plan(39.4, 14.4, 5.4, 8.8, 0.3), Z.plate1, Z.holder1 - Z.plate1, { w: 2 });
    // SIM 卡座：伸出板緣，從背面看得到它的底板——10 個圓孔＋2 個小方窗（S25 左逐個換算）
    const zq = (zx, zy) => ab(20 + zx / 3, 140 + zy / 3);
    const holes = [[185, 195, 28], [330, 195, 28], [262, 240, 28], [185, 285, 28], [340, 285, 28], [180, 460, 28], [338, 460, 28], [262, 505, 28], [180, 548, 28], [340, 548, 40]]
      .map(([zx, zy, zr]) => { const [x, y] = zq(zx, zy); return { x, y, r: zr / 3 * S }; }).filter((h) => h.y + h.r < 13.8);
    const wins = [[258, 175], [250, 572]].map(([zx, zy]) => zq(zx, zy)).filter(([, y]) => y < 13.4);
    const holeSvg = holes.map((h) => k.ring(h.x, h.y, h.r, Z.holder1, P, 16)).join("") + wins.map(([x, y]) => k.planOutline(plan(x - 0.5, y - 0.75, 1.0, 1.5, 0.1), Z.holder1, P, 1)).join("");
    block("g6", 0, "sim-holder", plan(22.3, 3.3, 16.5, 23.7, 0.3), Z.plate1, Z.holder1 - Z.plate1, { w: 2, inner: ln(holeSvg, 3), meta: { cut: A.box([22.5, 2.0, 3.95], [38.6, 26.4, 4.85]) } });   // 卡托空腔
    // SIM 卡托＋SIM 卡（ISO 25 × 15 mm）：從頂端用迴紋針頂出【官／拆 S8】
    const trayShape = A.slab(plan(22.6, -16.0, 15.9, 16.0, 0.4), 4.0, 0.8, { name: "g6.sim-tray" }, 2);   // 卡托在拆解前已退出 16 mm、之後一直留在外面：登記機身外的那段（牆槽裡的一截被遮住）
    const TY = -16;   // 畫在退出後的位置；頁面在退出動畫裡從 +16 滑到這裡
    // 退出後分三段畫：機身外（登記）、牆槽裡（被牆完全遮住，不登記）、機身內（登記）
    const card = plan(23.05, TY + 0.6, 15.0, 25.0, 0.8);
    const trayPart = (name, y0, y1, shape) => {
      const pl = plan(22.6, y0, 15.9, y1 - y0, 0.4), id = REC.nameFor(`g6.${name}`);
      const c0 = Math.max(y0, card.y), c1 = Math.min(y1, card.y + card.d), cx0 = card.x, cx1 = card.x + card.w;
      let inner = k.lineOnTop([cx0, c0], [cx0, c1], 4.8, P) + k.lineOnTop([cx1, c0], [cx1, c1], 4.8, P);
      if (c0 === card.y) inner += k.lineOnTop([cx0, c0], [cx1, c0], 4.8, P);
      if (c1 === card.y + card.d) inner += k.lineOnTop([cx0, c1], [cx1, c1], 4.8, P);
      inner = ln(inner, 3) + (y0 < TY + 1 ? ln(k.ring(30.55, TY + 0.3, 0.25, 4.8, P, 12), 4) : "");
      item("g6", 0, "sim", id, solid(k.slabOf(pl, 4.0, 0.8, P, 1), { w: 2, inner }), shape ? [shape] : [], { record: !!shape, at: [30.55, (y0 + y1) / 2, 4.4] });
    };
    trayPart("sim-tray", TY, 0, trayShape);
    trayPart("sim-tray-slot", 0, 1.5, A.slab(plan(22.6, 0, 15.9, 1.5, 0.4), 4.0, 0.8, { name: "g6.sim-tray-slot" }, 1));
    trayPart("sim-tray-in", 1.5, TY + 26.2, A.slab(plan(22.6, 1.5, 15.9, TY + 26.2 - 1.5, 0.4), 4.0, 0.8, { name: "g6.sim-tray-in" }, 2));
    void card;
    // 處理器面（朝背面）：晶片位置全部由 S25 左逐個換算
    const [a0, a1] = [ab(248, 365), ab(360, 228)];
    chip("g6", 0, "arm", ...rectOf(a0, a1), Z.ab1, Z.part1 - Z.ab1, "339S0030 ARM", 1.15);           // Samsung S5L8900（疊 SDRAM）
    chip("g6", 0, "wolfson", ...rectOf(ab(290, 145), ab(335, 100)), Z.ab1, 0.8, "WM8758", 0.7);        // 音訊（step 25：ARM 上方）
    chip("g6", 0, "lt4066", ...rectOf(ab(285, 405), ab(325, 380)), Z.ab1, 0.7);                        // Linear 4066 充電（step 25：ARM 下方）
    chip("g6", 0, "apple-338s", ...rectOf(ab(175, 505), ab(260, 420)), Z.ab1, 0.9, "338S", 1.0);      // Apple 338S 晶片（左下）
    chip("g6", 0, "b2b", ...rectOf(ab(360, 205), ab(410, 75)), Z.ab1, Z.part1 - Z.ab1);                 // 板對板連接器（接通訊板）
    block("g6", 0, "tantalum", plan(...(([x0, y0, x1, y1]) => [x0, y0, x1 - x0, y1 - y0, 0.2])(rectOf(ab(318, 505), ab(350, 478)))), Z.ab1, 0.9, { w: 2 });
    cyl("g6", 0, "inductor", ...ab(388, 462), 1.2, Z.ab1, 1.0, { w: 2, inner: text(add3(ab(388, 462), [-0.7, 0.3, 0]), Z.ab1 + 1.0, "100", 0.7) });
    block("g6", 0, "cam-conn", plan(18.8, 4.1, 2.5, 7.3, 0.2), Z.ab1, 0.8, { w: 2 });                  // 相機排線接頭（S13、S25 左下）
    // 處理器面的圍框（屏蔽框）與上方的屏蔽蓋（兩個 U 形卡扣、兩個方形凸點）【拆 S12、S13；FCC #3】
    const wallB = (x0, y0, x1, y1) => block("g6", 0, "ab-fence", plan(x0, y0, x1 - x0, y1 - y0, 0.05), Z.ab1, Z.part1 - Z.ab1, { steps: 1, w: 3, crease: 4 });
    wallB(11.2, 14.0, 21.8, 14.4); wallB(43.0, 14.0, 45.0, 14.4); wallB(11.2, 31.8, 45.0, 32.2); wallB(11.2, 14.4, 11.6, 31.8); wallB(44.6, 14.4, 45.0, 31.8);
    {
      const LD = plan(21.8, 4.4, 21.2, 15.4, 0.6), id = nm("g6", "app-lid");
      const can = k.slabOf(LD, Z.ab1, Z.part1 + 0.3 - Z.ab1, P, 3);
      const zt = Z.part1 + 0.3;
      const marks = [[27.1, 18.9], [36.9, 18.9]].map(([x, y]) => k.onTop([[x - 1.1, y + 0.9], [x - 1.1, y - 0.5], [x + 1.1, y - 0.5], [x + 1.1, y + 0.9]], zt, P)).join("") + [[23.7, 13.5], [38.0, 11.2]].map(([x, y]) => k.planOutline(plan(x - 0.6, y - 0.6, 1.2, 1.2, 0.2), zt, P, 2)).join("");
      item("g6", 2, "lid", id, solid(can, { w: 2, inner: ln(marks, 3) }), [A.slab(LD, Z.ab1, Z.part1 + 0.3 - Z.ab1, { name: id, cut: A.slab(k.insetPlan(LD, 0.3), Z.ab1 - 1, Z.part1 - Z.ab1 + 1, {}, 3) }, 3)]);
    }
    // ---- 2 MP 相機（背面看左上）＋排線【拆 S12、S13】----
    block("g6", 0, "camera", plan(5.0, 4.6, 8.4, 8.4, 0.8), Z.plate1, 8.5 - Z.plate1, { halo: true });
    cyl("g6", 0, "lens", 9.2, 8.8, 2.7, 8.5, Z.back - 8.5, { seg: 32, inner: ln(k.ring(9.2, 8.8, 1.5, Z.back, P, 28), 3) + ln(k.ring(9.2, 8.8, 0.7, Z.back, P, 20), 4) });
    block("g6", 0, "cam-flex", plan(13.4, 5.2, 7.6, 6.0, 0.2), Z.ab1 + 0.8, 0.15, { steps: 1, w: 2 });

    // ---- 通訊板（820-2021-A）：輪廓、晶片、隔間圍框都由 S26 換算 ----
    const C = (gx, gy) => cb(gx, gy);
    const CB = [C(20, 35), C(1505, 35), C(1505, 860), C(1045, 860), C(1045, 720), C(410, 720), C(410, 735), C(330, 735), C(330, 665), C(20, 665)];
    prism("g6", 1, "comm-board", CB, Z.part1, Z.cb1 - Z.part1, { halo: true, inner: text(add3(C(400, 690), [0, 0, 0]), Z.cb1, "820-2021-A", 0.9) });
    block("g6", 1, "flex-mate", plan(39.2, 42.8, 16.6, 6.6, 0.3), 6.0, Z.part1 - 6.0, { w: 2 });          // 底面：顯示排線的板端接頭（對上 S20 的排線頭）
    const ct = Z.cb1;
    const chipC = (name, g0, g1, h, mark, size) => chip("g6", 1, name, ...rectOf(C(...g0), C(...g1)), ct, h, mark, size);
    chipC("intel-flash", [125, 50], [455, 295], 1.1, "1030W0YTQ2", 1.0);       // Intel NOR+SRAM
    chipC("s-gold2", [130, 300], [455, 625], 1.1, "337S3235", 1.1);            // Infineon PMB8876 S-Gold 2
    chipC("338s0289", [700, 60], [905, 290], 0.9, "338S0289", 0.9);           // Infineon 收發器（白色貼紙）
    chipC("w8686", [620, 525], [780, 655], 0.8, "W8686", 0.9);                // Marvell Wi-Fi
    chipC("csr", [1015, 270], [1125, 420], 0.6, "", 1);                       // CSR BlueCore4
    chipC("sky77340", [1165, 190], [1430, 385], 1.0, "SKY77340", 1.0);        // Skyworks 功放
    chipC("338s0297", [1190, 420], [1440, 695], 1.1, "338S0297", 1.0);        // Apple 338S0297
    chipC("crystal", [665, 430], [745, 490], 0.7, "", 1);
    cyl("g6", 1, "inductor-c", ...C(808, 335), 1.15, ct, 0.9, { w: 2 });
    // 隔間圍框：外圈＋內牆（S26 放大圖描邊）
    const fenceH = Z.fence1 - ct;
    const outer = [[70, 45], [935, 45], [995, 100], [1290, 100], [1330, 135], [1470, 135], [1470, 815], [1330, 815], [1205, 705], [420, 705], [365, 640], [70, 640]].map(([gx, gy]) => C(gx, gy));
    const inner = [[[540, 705], [540, 415]], [[540, 415], [1000, 415]], [[1000, 225], [1000, 705]], [[1000, 225], [1145, 225]], [[1145, 100], [1145, 705]], [[1145, 400], [1470, 400]]];
    const wallSeg = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), nx = -dy / l * 0.2, ny = dx / l * 0.2; return [[p[0] + nx, p[1] + ny], [q[0] + nx, q[1] + ny], [q[0] - nx, q[1] - ny], [p[0] - nx, p[1] - ny]]; };
    outer.forEach((p, i) => prism("g6", 1, "fence", wallSeg(p, outer[(i + 1) % outer.length]), ct, fenceH, { w: 3, crease: 4 }));
    inner.forEach(([p, q]) => prism("g6", 1, "fence", wallSeg(C(...p), C(...q)), ct, fenceH, { w: 3, crease: 4 }));
    prism("g6", 1, "fence-bridge", [C(790, 415), C(1000, 415), C(1000, 540), C(790, 540)], ct, fenceH, { w: 3, crease: 4 });
    // 同軸接頭 J2（GSM）、J4（Wi-Fi/藍牙）與電池焊盤（三個）
    const J2 = C(1090, 790), J4 = C(1355, 75);
    cyl("g6", 1, "j2", ...J2, 1.0, ct, 0.8, { w: 2, seg: 20, inner: ln(k.ring(...J2, 0.45, ct + 0.8, P, 12), 4) });
    cyl("g6", 1, "j4", ...J4, 1.0, ct, 0.8, { w: 2, seg: 20, inner: ln(k.ring(...J4, 0.45, ct + 0.8, P, 12), 4) });
    const PADX = [16.0, 18.6, 20.9];
    PADX.forEach((x) => {
      block("g6", 1, "batt-pad", plan(x - 0.8, 49.25, 1.6, 1.0, 0.15), ct, 0.2, { steps: 1, w: 3 });
      const id = nm("g6", "solder"), c = [x, 49.75, SOLDER_Z], sc = k.iso(c, P), rr = SOLDER_R * k.screenRise(1, P) / Math.cos(Math.PI / 6);
      item("g6", 1, "", id, `<g class="s"><circle class="f" cx="${sc[0].toFixed(2)}" cy="${sc[1].toFixed(2)}" r="${rr.toFixed(2)}"/><circle class="tp" cx="${(sc[0] - rr * 0.25).toFixed(2)}" cy="${(sc[1] - rr * 0.25).toFixed(2)}" r="${(rr * 0.45).toFixed(2)}"/><circle class="ln w2" pathLength="1" cx="${sc[0].toFixed(2)}" cy="${sc[1].toFixed(2)}" r="${rr.toFixed(2)}"/></g>`, [A.ball(c, SOLDER_R, { name: id })]);
    });
    // 通訊板屏蔽蓋（巡覽時掀開）：U 形卡扣與方孔位置由 S12 換算
    {
      const lidRing = outer.map(([x, y]) => [x, y]);
      const id = nm("g6", "comm-lid"), zt = Z.lid1;
      const U = (x, y, up) => k.onTop(up ? [[x - 0.9, y + 1.4], [x - 0.9, y - 0.4], [x + 0.9, y - 0.4], [x + 0.9, y + 1.4]] : [[x - 0.9, y - 1.4], [x - 0.9, y + 0.4], [x + 0.9, y + 0.4], [x + 0.9, y - 1.4]], zt, P);
      const marks = U(19.4, 30.2, true) + U(22.9, 44.0, false) + U(42.9, 42.0, false) + k.planOutline(plan(10.0, 38.7, 1.8, 1.8, 0.1), zt, P, 1);
      item("g6", 2, "lid", id, solid(k.extrude(lidRing, Z.fence1, Z.lid1 - Z.fence1, P, { convex: false }), { w: 2, inner: ln(marks, 3) }), [A.extruded(lidRing, Z.fence1, Z.lid1 - Z.fence1, { name: id })]);
    }
    // 主板螺絲 3 顆：S12 螺絲刀處（板角孔）、電池線左側（板角孔）、相機下方【拆 step 12；後者位置估】
    screw("g6", 3, "screw", 56.65, 29.8, ct, 0.75);   // S26 板角孔 G(60,605)
    screw("g6", 3, "screw", ...C(1460, 80), ct, 0.75); // S26 板角孔 G(1460,80)
    // 第三顆（「相機下方」）在照片裡找不到孔位 → 存疑不畫
    // 兩條白色天線同軸線：從 J2、J4 沿左側到底部天線（S12、S20 換算；端點 FCC #1 佐證）
    const zc = Z.encl1 + 0.5;   // 線心高度：貼著腔體頂、頂到背殼（touch 允許貼合）
    const TOUCH = ["g5.enclosure*", "g8.shell*", "g9.cap*"];
    cable("g6", 1, "coax-gsm", [[J2[0] - 0.71, J2[1] - 0.71, zc], [J2[0] - 2.9, 20.3, zc], [2.4, 20.3, zc], [2.4, 101.8, zc], [13.2, 101.8, zc]], 0.5, { bend: 2.0, free: [false, true], bundle: "coax", touch: TOUCH });
    cable("g6", 1, "coax-wifi", [[J4[0], J4[1] + 1.0, zc], [J4[0], 51.6, zc], [3.8, 51.6, zc], [3.8, 99.6, zc], [28.5, 99.6, zc]], 0.5, { bend: 2.0, free: [false, true], bundle: "coax", touch: TOUCH });
    // 同軸線插頭：一端插在 J2／J4 上，一端插在天線軟板上（都屬於線）
    cyl("g6", 1, "plug-j2", ...J2, 1.0, ct + 0.8, 1.0, { w: 2, seg: 20 });
    cyl("g6", 1, "plug-j4", ...J4, 1.0, ct + 0.8, 1.0, { w: 2, seg: 20 });
    cyl("g6", 1, "plug-gsm", 14.2, 101.8, 1.0, Z.encl1, 1.0, { w: 2, seg: 20 });
    cyl("g6", 1, "plug-wifi", 29.5, 99.6, 1.0, Z.encl1, 1.0, { w: 2, seg: 20 });
  }

  // ================= g7 電池（616-0290）＋三條焊線 =================
  {
    const BAT = plan(5.0, 53.6, W - 10, 37.0, 2.4);
    const bz = Z.flex1, bh = 9.3 - bz, bt = bz + bh;
    const tape = k.lineOnTop([BAT.x + 3.2, BAT.y], [BAT.x + 3.2, BAT.y + BAT.d], bt, P) + k.lineOnTop([BAT.x + BAT.w - 3.2, BAT.y], [BAT.x + BAT.w - 3.2, BAT.y + BAT.d], bt, P) + k.lineOnTop([BAT.x, BAT.y + 3.0], [BAT.x + BAT.w, BAT.y + 3.0], bt, P);   // 膠帶邊：從邊到邊
    const L = plan(BAT.x + 6, BAT.y + 6, 34, 25, 0.5);
    const rules = [0, 1, 2, 3, 4, 5].map((i) => k.lineOnTop([L.x + 3, L.y + 10 + i * 2.4], [L.x + (i % 2 ? 18 : 25), L.y + 10 + i * 2.4], bt, P)).join("");
    const barcode = Array.from({ length: 22 }, (_, i) => k.lineOnTop([L.x + 3 + i * 0.9 + (i % 3) * 0.2, L.y + L.d - 4.6], [L.x + 3 + i * 0.9 + (i % 3) * 0.2, L.y + L.d - 2.2], bt, P)).join("");
    block("g7", 0, "battery", BAT, bz, bh, { steps: 6, halo: true, inner: ln(tape, 4) + ln(k.planOutline(L, bt, P, 2), 3) + ln(rules, 4, true) + ln(barcode, 4, true) + text([L.x + 3, L.y + 6.4], bt, "616-0290  3.7V", 2.6) + ln(k.sideSeam(BAT, bz + 2.6, P, 6), 4) });
    // 紅、白、黑三條線：從電池上緣接到通訊板的三個焊盤（S12、S25 右、FCC J7）
    ["wire-r", "wire-w", "wire-k"].forEach((cls, i) => {
      const x = [16.0, 18.6, 20.9][i];
      // 線端落在焊點（焊錫球）上：線心高度＝球心高度，端面圓剛好貼在球面上
      cable("g7", 0, "batt-wire", [[x, BAT.y, 8.6], [x, 52.2, 8.6], [x, 51.0, SOLDER_Z], [x, 49.75 + SOLDER_D, SOLDER_Z]], 0.35, { bend: 1.0, cls, free: [false, true] });
    });
  }

  // ================= g8 鋁背殼（含側壁）＋耳機孔與排線、SIM 壓板、接地片、按鍵 =================
  {
    const shellRing = ringCustom(0, 0, W, SEAM, R0, 0, 10), innerRing = ringCustom(1.5, 1.5, W - 1.5, SEAM, R0 - 1.5, 0, 10);
    // 側壁（鋁殼包到側面，按鍵裝在上面）：拆成遠／近半圈；SIM 卡托槽與耳機孔是開口
    const cuts = [A.box([22.0, -1, 3.85], [39.1, 2, 4.95]), A.disc(G.frameOf([52.0, -1, 6.7], [0, 1, 0], [1, 0, 0], [0, 0, 1]), 0, 3, 2.95)];
    const shellU = [shellRing[shellRing.length - 1], ...shellRing.slice(0, -1)].concat([innerRing[innerRing.length - 1], ...innerRing.slice(0, -1)].reverse());
    ringWalls("g8", 0, "shell-wall", null, null, Z.bezel1, Z.back - Z.bezel1, [R0, R0, W - R0, SEAM], { open: shellU, slot: { x0: 22.0, x1: 39.1, z0: 3.85, z1: 4.95 }, halo: halo({ x: 0, y: 0, w: W, d: SEAM, r: R0 }, Z.bezel1), cuts, innerNear: ln(onSide("x", W, [[21, 6.3], [45.8, 6.3]], P), 4) });
    const id = nm("g8", "shell");
    item("g8", 0, "", id, solid(k.extrude(shellRing, Z.back, 1.0, P), { w: 1 }), [A.extruded(shellRing, Z.back, 1.0, { name: id })]);
    const curve = ringCustom(1.4, 1.4, W - 1.4, SEAM, R0 - 1.4, 0, 10), id2 = nm("g8", "shell-top");
    item("g8", 0, "", id2, solid(k.extrude(curve, Z.back + 1.0, 1.0, P, { bevel: 0.8 }), { w: 2, inner: ln(k.ring(9.2, 8.8, 3.2, T, P, 32), 2) + ln(k.ring(9.2, 8.8, 2.4, T, P, 28), 4) + text([W / 2 - 6.2, SEAM - 12], T, "A1203", 3.2) + ln(k.lineOnTop([W / 2 - 9, SEAM - 8.5], [W / 2 + 9, SEAM - 8.5], T, P), 4, true) }), [A.extruded(curve, Z.back + 1.0, 1.0, { name: id2 })]);
    // 3.5 mm 耳機孔（內凹）：掛在背殼內側【拆 S8、S9】
    const jackF = G.frameOf([52.0, 0.05, 6.7], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    const prof = [[0, 2.6], [1.2, 2.6], [1.2, 2.9], [13.5, 2.9]], idj = nm("g8", "jack");
    item("g8", 0, "", idj, solid(G.solidOf(prof, jackF, P), { w: 2 }), [A.solid(jackF, [[2.0, 2.9], [13.5, 2.9]], { name: idj })]);   // 登記牆內側的本體；孔口在牆裡被遮住
    // 耳機孔排線：沿背殼內側往下，末端是排線插頭（插到哪裡證據不足，只畫到插頭）【拆 S9、step 8】
    block("g8", 0, "jack-flex", plan(50.2, 13.55, 3.6, 7.0, 0.3), 9.35, 0.15, { steps: 1, w: 2 });
    block("g8", 0, "jack-plug", plan(49.0, 20.4, 6.0, 3.6, 0.3), 8.75, 0.6, { w: 2 });
    // SIM 卡壓板（背殼內側的金屬板，iFixit step 9 稱 SIM card bracket；藍色貼紙不畫）
    block("g8", 0, "sim-bracket", plan(22.3, 3.0, 16.5, 24.0, 0.6), 9.2, 0.4, { w: 2 });
    // 接地片＋接地螺絲（固定天線線、連接前後殼，step 7）：位置由 S9 背殼內側換算【估】
    block("g8", 0, "ground-plate", plan(9.5, 85.6, 34.5, 6.8, 0.6), 9.35, 0.25, { w: 2 });
    screw("g8", 0, "ground-screw", 22.3, 92.0, 9.35, 0.95, true);
    // 側鍵（背面看右側＝正面左側）：響鈴開關、音量＋、音量−；頂部睡眠鍵（背面看左側）【拆 照片】
    [[21, 5.4], [31, 6.4], [39.4, 6.4]].forEach(([y, d]) => block("g8", 0, "side-key", plan(W, y, 0.9, d, 0.3), 5.2, 2.2, { w: 2 }));
    block("g8", 0, "sleep-key", plan(11, -0.9, 10, 0.9, 0.3), 5.2, 2.2, { w: 2 });
  }

  // ================= g9 天線蓋（黑色塑料，含側壁）=================
  {
    const capRing = ringCustom(0, SEAM, W, H, 0, R0, 10), innerRing = ringCustom(1.5, SEAM, W - 1.5, H - 1.5, 0, R0 - 1.5, 10);
    const id = nm("g9", "cap");
    const grille = (u0, u1) => { const pts = []; for (let i = 0; i < 8; i++) pts.push(k.iso([u0 + (u1 - u0) * (i + 0.5) / 8, H, 5.9], P)); return dots(pts, 0.75); };
    const opening = onSide("y", H, roundRect2(20.4, 4.4, 20.2, 2.4, 1.0), P, true);
    const capU = [...capRing.slice(1), capRing[0]].concat([...innerRing.slice(1), innerRing[0]].reverse());
    ringWalls("g9", 0, "cap-wall", null, null, Z.bezel1, Z.back - Z.bezel1, [R0, SEAM, W - R0, H - R0], { open: capU, halo: halo({ x: 0, y: SEAM, w: W, d: H - SEAM, r: 6 }, Z.bezel1), cuts: [A.box([19.4, 112, 3.85], [41.6, 116, 7.4])], innerNear: ln(opening, 2) + grille(6, 17) + grille(44, 55) });
    item("g9", 0, "", id, solid(k.extrude(capRing, Z.back, 1.0, P), { w: 1 }), [A.extruded(capRing, Z.back, 1.0, { name: id })]);
    const capTop = ringCustom(1.4, SEAM, W - 1.4, H - 1.4, 0, R0 - 1.4, 10), id2 = nm("g9", "cap-top");
    const hatch = [];
    for (let i = -24; i < 64; i += 2.2) {
      const a = [i, SEAM], t0 = Math.max(0, (1.4 - a[0]) / 22), t1 = Math.min(1, (W - 1.4 - a[0]) / 22);
      if (t1 <= t0) continue;
      const p0 = [a[0] + 22 * t0, SEAM + (H - SEAM) * t0], p1 = [a[0] + 22 * t1, SEAM + (H - SEAM) * t1];
      if (p1[1] > H - 1.4 - 0.1 && (p1[0] < R0 || p1[0] > W - R0)) continue;
      if ((p0[0] < 1.5 && p0[1] > H - R0) || (p1[0] > W - 1.5 && p1[1] > H - R0)) continue;   // 端點落在圓角裡的線不畫
      hatch.push(k.lineOnTop(p0, [p1[0], Math.min(p1[1], H - 1.4)], T, P));
    }
    item("g9", 0, "", id2, solid(k.extrude(capTop, Z.back + 1.0, 1.0, P, { bevel: 0.8 }), { w: 2, inner: ln(hatch.join(""), 4) }), [A.extruded(capTop, Z.back + 1.0, 1.0, { name: id2 })]);
  }
}

// 標註錨點、各組最高點（頁面用）
export const ZTOP = { g1: 2.2, g2: 1.9, g3: 3.4, g4: 6.5, g5: 8.6, g6: 9.6, g7: 9.55, g8: 11.6, g9: 11.6 };
export const DIM2 = { W, H, T };
