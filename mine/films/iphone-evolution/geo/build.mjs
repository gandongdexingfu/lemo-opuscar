// 產生 parts.json：兩張圖（FIG.01 正面、FIG.02 背面爆炸）所有零件的 SVG 片段與版面
// node geo/build.mjs  → ../parts.json
import { writeFileSync } from "node:fs";
import { k } from "./lib.mjs";
import * as ip from "./iphone2007.mjs";

const SHEET = { w: 2000, h: 4000 };
const SCALE = 4.6, AZ = 60;                       // 每 mm 的比例、相機方位角
const GAP = 72;                                   // 爆炸後每組之間的 z 間距（mm）
const BASE = [880, 3380];                         // FIG.02 機身原點（遠角 x=0,y=0,z=0）在圖紙上的位置
const P2 = { origin: BASE, scale: SCALE, azimuth: AZ };
const P1 = { origin: [BASE[0], BASE[1]], scale: SCALE, azimuth: AZ };

const rise = k.screenRise(1, P2);                 // 每 mm 高度在圖紙上的長度
const fig1 = ip.fig1(P1);
const dims = ip.fig1dims(P1);
const items2 = ip.fig2(P2);
const groups = ip.GROUPS.map((g, i) => {
  const a = k.iso(ip.ANCHORS[g.id], P2);
  return { ...g, index: i, lift: i * GAP * rise, svg: items2[g.id].join(""), anchor: a };
});

// 外形包圍框（版面計算用）
const { W, H, T } = ip.DIM;
const box = (P, z0, z1) => { const pts = k.boxCorners({ x: 0, y: 0, w: W, d: H }, z0, z1).map((p) => k.iso(p, P)); const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const out = {
  sheet: SHEET, scale: SCALE, az: AZ, gap: GAP, rise,
  fig1: { items: fig1, box: box(P1, 0, T), dims },
  fig2: { groups, box: box(P2, 0, T), top: box(P2, 0, T + 8 * GAP) },
};
writeFileSync(new URL("../parts.json", import.meta.url), JSON.stringify(out));
const kb = (s) => (s.length / 1024).toFixed(0);
console.log("parts.json", kb(JSON.stringify(out)), "KB; fig1 box", out.fig1.box.map(Math.round), "column", out.fig2.top.map(Math.round));
groups.forEach((g) => console.log(g.id, kb(g.svg), "KB", "lift", Math.round(g.lift)));
