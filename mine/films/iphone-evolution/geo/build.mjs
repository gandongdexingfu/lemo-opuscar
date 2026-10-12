// 產生 parts.json（橫屏版）：鍵盤手機、變形、FIG.01 正面、FIG.02 背面九組（精確版，經 Anatomy audit 驗證）
// node geo/build.mjs          → ../parts.json（含 audit 算出的前後順序，三段爆炸各一套）
// node geo/build.mjs --audit  → 另外跑完整驗證（三段各一份報告），有問題就以非零碼結束
// FAST=1                      → 只算靜止與全開兩個狀態（迭代用）
import { writeFileSync } from "node:fs";
import { k } from "./lib.mjs";
import * as ip from "./iphone2007.mjs";
import * as f2 from "./fig2.mjs";
import * as A from "../../../vendor/anatomy/kit/audit.mjs";

const SCALE = 4.6, AZ = 60;
const P = { origin: [0, 0], scale: SCALE, azimuth: AZ };
const rise = k.screenRise(1, P);
const { W, H, T } = ip.DIM;
const iso = (p) => k.iso(p, P);
const FAST = process.env.FAST === "1";
const AUDIT = process.argv.includes("--audit");

// 爆炸時間表（相對 T.ex，秒）：頁面讀同一份，audit 逐幀重放
const TL = { lift: [0, 1.2], slide0: 1.3, slideDur: 1.6, stagger: 0.12, subs: [3.6, 4.4] };
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const ids = f2.GROUPS.map((g) => g.id);
const slideShare = (i, t) => ease((t - TL.slide0 - Math.abs(i - 4) * TL.stagger) / TL.slideDur);
const frames = [];
for (let f = 0; f <= Math.ceil((TL.slideDur + 4 * TL.stagger) * 24); f++) {
  const t = TL.slide0 + f / 24, shares = {};
  ids.forEach((id, i) => (shares[id] = slideShare(i, t)));
  frames.push({ label: `slide+${(f / 24).toFixed(2)}s`, shares });
}
const PH = f2.phases(P);
const plan = {
  A: { states: FAST ? [0, 1] : [0, 1, 0.25, 0.5, 0.75], frames: FAST ? [] : [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] },
  B: { states: FAST ? [0, 1] : [0, 1, ...frames.filter((_, i) => i % 2 === 0)], frames: FAST ? [] : frames },
  C: { states: FAST ? [0, 1] : [0, 1, 0.5], frames: FAST ? [] : [0.25, 0.5, 0.75] },
};
const V = A.cameraBasis(P).V;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
let items = null, failed = 0;
for (const ph of ["A", "B", "C"]) {
  // B、C 段的起點已經是拆開的狀態：各組由爆炸動作托著（全部算接地），線端本來就該是自由端（A 段已驗過端點）
  const R = A.recorder(P, { ground: ph === "A" ? (s) => s.ground === true || (s.name || "").startsWith("g4.frame") : () => true });
  f2.fig2(P, R, PH[ph]);
  const t0 = Date.now();
  A.settle(R, P, { states: plan[ph].states });
  console.log(`phase ${ph} settle: ${R.items.length} items, ${R.settled.overlaps.pairs.length} overlaps, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (!items) items = R.items.map((it) => ({ g: ids.indexOf(it.g), sub: it.sub, tag: it.tag || "", name: it.name, svg: it.svg, keys: {}, lifts: {} }));
  R.items.forEach((it, i) => { if (items[i].name !== it.name) throw new Error("item order differs between phases"); items[i].keys[ph] = +it.key.toFixed(3); items[i].lifts[ph] = +dot(it.move, V).toFixed(3); });
  if (AUDIT) {
    const t1 = Date.now();
    const r = A.audit(R, P, { frames: plan[ph].frames, apart: true, crowd: [["g6.coax-wifi", "g6.fence#5"]] });   // J4 插頭緊貼圍框（S26 照片如此），已目視確認
    if (ph !== "A") { r.terminals = []; r.cover = []; }   // 畫面標記是靜止位置畫的，只在 A 段比對
    const n = A.failures(r);
    console.log(`\n===== audit · phase ${ph} =====\n${A.report(r)}\nphase ${ph}: ${n ? n + " problems" : "passed"} · ${plan[ph].states.length} depth states · ${plan[ph].frames.length} replayed frames · ${((Date.now() - t1) / 1000).toFixed(1)} s`);
    if (n) failed++;
  }
}
const sc = (v) => { const o = iso([0, 0, 0]), p = iso(v); return [+(p[0] - o[0]).toFixed(2), +(p[1] - o[1]).toFixed(2)]; };
const groups = f2.GROUPS.map((g, i) => ({ ...g, index: i, off: [(i - 4) * f2.STEP[0], (i - 4) * f2.STEP[1]], ztop: f2.ZTOP[g.id], liftS: sc(PH.lift(g.id)), slideS: sc(PH.slide(g.id)), extra: Math.max(...items.filter((it) => it.g === i).map((it) => it.sub)) }));

const box = (z0, z1) => { const pts = k.boxCorners({ x: 0, y: 0, w: W, d: H }, z0, z1).map(iso); const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const out = {
  scale: SCALE, az: AZ, rise, subz: f2.SUBZ, step: f2.STEP, tl: TL,
  morph: Array.from({ length: 25 }, (_, i) => ip.morphFrame(i / 24, P)),
  bb: ip.bbKeys(P), ratio: ip.RATIO,
  fig1: { items: ip.fig1(P), box: box(0, T), dims: ip.fig1dims(P) },
  fig2: { groups, items, box: box(0, T) },
  pts: { glassC: iso([W / 2, 57.5, 11.3]), simDir: k.iso([0, -16, 0], { ...P, origin: [0, 0] }) },
};
writeFileSync(new URL("../parts.json", import.meta.url), JSON.stringify(out));
console.log("parts.json", (JSON.stringify(out).length / 1024).toFixed(0), "KB;", items.length, "items");
if (AUDIT) { console.log(failed ? `AUDIT FAILED in ${failed} phase(s)` : "ALL PHASES PASSED"); if (failed) process.exitCode = 1; }
