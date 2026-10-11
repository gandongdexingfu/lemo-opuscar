// 產生 parts.json（橫屏版）：鍵盤手機、變形、FIG.01 正面、FIG.02 背面九組（含組內分層、屏蔽蓋、SIM 卡托）
// node geo/build.mjs → ../parts.json
import { writeFileSync } from "node:fs";
import { k } from "./lib.mjs";
import * as ip from "./iphone2007.mjs";

const SCALE = 4.6, AZ = 60;
const P = { origin: [0, 0], scale: SCALE, azimuth: AZ };       // 組合狀態的機身原點在世界 (0,0)
const rise = k.screenRise(1, P);                                // 每 mm 高度的螢幕長度
const { W, H, T } = ip.DIM;
const iso = (p) => k.iso(p, P);
// 階梯式爆炸：每組沿機身 x 方向平移 1.12 個機身寬（互不重疊），同時抬高 LZ mm（越靠背面越高、越靠右）
const LZ = 25.7, SUBZ = 6;
// 步距在「機身平行四邊形」座標裡 α≥1.05 才不重疊：290·sx + 335·sy ≥ 124 787（見樣片紀錄）
const step = [420, 10];
const items2 = ip.fig2(P);
const groups = ip.GROUPS.map((g, i) => {
  const layers = {};
  for (const it of items2[g.id]) { const key = it.sub + "|" + it.tag; (layers[key] ||= { sub: it.sub, tag: it.tag, svg: "" }).svg += it.svg; }
  return { ...g, index: i, off: [(i - 4) * step[0], (i - 4) * step[1]], layers: Object.values(layers) };
});
const box = (z0, z1) => { const pts = k.boxCorners({ x: 0, y: 0, w: W, d: H }, z0, z1).map(iso); const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const out = {
  scale: SCALE, az: AZ, rise, subz: SUBZ, step,
  morph: Array.from({ length: 25 }, (_, i) => ip.morphFrame(i / 24, P)),
  bb: ip.bbKeys(P), ratio: ip.RATIO,
  fig1: { items: ip.fig1(P), box: box(0, T), dims: ip.fig1dims(P) },
  fig2: { groups, box: box(0, T) },
  pts: { glassC: iso([W / 2, 57.5, 11.3]), simDir: k.iso([0, -16, 0], { ...P, origin: [0, 0] }) },
};
writeFileSync(new URL("../parts.json", import.meta.url), JSON.stringify(out));
console.log("parts.json", (JSON.stringify(out).length / 1024).toFixed(0), "KB; box", out.fig1.box.map(Math.round), "step", step.map(Math.round));
groups.forEach((g) => console.log(g.id, g.layers.map((l) => `${l.sub}${l.tag}:${(l.svg.length / 1024).toFixed(0)}K`).join(" ")));
