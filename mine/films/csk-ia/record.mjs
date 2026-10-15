// Deterministic frame capture of video.html -> frames/*.jpg
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("/opt/node22/lib/node_modules/playwright");
import { mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const ONLY = process.argv.includes("--preview"); // a few stills only
const ZH = process.argv.includes("--zh");
const OUT = join(HERE, ZH ? "frames-zh" : "frames");
if (!ONLY) { rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true }); }

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;

// ---- script ----
const SUBS_EN = [
  [3.6, 8.0, "Two arcs share one centre: the front 5 mm layer stops at <b>R50</b>, the 20 mm layer runs on to <b>R100</b>."],
  [8.3, 12.4, "Slide the angle probe toward the <b>R100 arc</b> and watch the echo."],
  [12.4, 16.4, "Peak echo = the beam passes through the arc's centre. That spot on the probe is its <b>index point</b>."],
  [16.7, 23.4, "Measure <b>M</b> from the probe's front edge to the arc edge:  l₀ = 100 − M = 100 − 88 = <b>12 mm</b>."],
  [23.7, 29.2, "Turn the probe round and aim at the <b>Ø50 hole</b>, its centre 30 mm below the surface."],
  [29.2, 35.0, "Peak at L = 83 mm:  K = (83 + 12 − 35) / 30 = <b>2.0</b>,  β = 63.4°. The index point sits on the K2.0 scribe."],
  [35.3, 38.2, "Straight probe on the 100 mm section: back-wall echoes B1, B2, B3, B4…"],
  [38.2, 41.7, "Never zero on the initial pulse. <b>Delay</b> shifts every echo together…"],
  [41.7, 47.0, "…<b>Range</b> stretches the spacing.  B2 → 50, B4 → 100:  a <b>1:4</b> time base."],
  [47.3, 52.5, "Straddle the step: echoes at <b>85, 91 and 100 mm</b> at once — the idea behind resolution testing."],
  [53.0, 59.0, "Over the Ø50 hole the back-wall echo disappears: the hole shadows it."],
];
const SECS_EN = [
  [3.4, 8.0, "CSK-IA block"],
  [8.0, 16.6, "① Probe index point"],
  [16.6, 23.6, "② Probe front length"],
  [23.6, 35.2, "③ K value (refraction angle)"],
  [35.2, 60, "④ Straight probe · time base"],
];
const CARDS_EN = [
  [0, 3.2, `<small>Ultrasonic testing</small><h1>CSK-IA Calibration Block</h1><p>How one steel block calibrates a flaw detector: index point, front length, K value and time base.</p>`],
  [59.6, 66.5, `<small>Interactive version</small><h1>Try it yourself</h1><p>Drag the probes, switch views and tune range and delay — link in the post.</p><small>Block modelled to NB/T 47013.3 · echo heights illustrative</small>`],
];
const SUBS_ZH = [
  [3.6, 8.0, "两段圆弧同一个圆心：前面 5 mm 那层只到 <b>R50</b>，后面 20 mm 那层伸到 <b>R100</b>。"],
  [8.3, 12.4, "斜探头放在顶面，声束朝向 <b>R100 圆弧</b>，前后移动，盯着回波。"],
  [12.4, 16.4, "回波最高时，声束正好穿过圆心——探头上对着圆心的那一点，就是<b>入射点</b>。"],
  [16.7, 23.4, "量出探头前端到圆弧边缘的距离 <b>M</b>：l₀ = 100 − M = 100 − 88 = <b>12 mm</b>。"],
  [23.7, 29.2, "探头调头，声束对准 <b>φ50 孔</b>，孔心距顶面 30 mm。"],
  [29.2, 35.0, "最高回波时 L = 83 mm：K = (83 + 12 − 35) / 30 = <b>2.0</b>，β = 63.4°，入射点正落在 K2.0 刻线上。"],
  [35.3, 38.2, "直探头放在 100 mm 厚处：底面回波 B1、B2、B3、B4…… 等距排开。"],
  [38.2, 41.7, "不能用始波定零。先调<b>延迟</b>：所有回波一起平移……"],
  [41.7, 47.0, "……再调<b>范围</b>：回波间距伸缩。B2 → 50、B4 → 100，就是 <b>1:4</b> 时基线。"],
  [47.3, 52.5, "跨在台阶上：<b>85、91、100 mm</b> 三个回波同时出现——这就是测分辨力的原理。"],
  [53.0, 59.0, "移到 φ50 孔上方：底波消失了，被孔挡住。"],
];
const SECS_ZH = [
  [3.4, 8.0, "CSK-IA 试块"],
  [8.0, 16.6, "① 测入射点"],
  [16.6, 23.6, "② 测前沿长度"],
  [23.6, 35.2, "③ 测 K 值（折射角）"],
  [35.2, 60, "④ 直探头 · 调时基线"],
];
const CARDS_ZH = [
  [0, 3.2, `<small>超声检测</small><h1>CSK-IA 标准试块</h1><p>一块钢，怎样校准超声探伤仪：入射点、前沿长度、K 值与时基线。</p>`],
  [59.6, 66.5, `<small>互动版本</small><h1>自己动手试试</h1><p>拖动探头、切换视角、调节范围与延迟。</p><small>试块按 NB/T 47013.3 建模 · 波高为示意</small>`],
];
const SUBS = ZH ? SUBS_ZH : SUBS_EN, SECS = ZH ? SECS_ZH : SECS_EN, CARDS = ZH ? CARDS_ZH : CARDS_EN;
const TOTAL = 66.5;
// ---- annotations (zh only) ----
const pr = (t, t0, d = 0.7) => Math.max(0, Math.min(1, (t - t0) / d));
const SIN = Math.sin(Math.atan(2)), COS = Math.cos(Math.atan(2));
function annoAt(t) {
  if (!ZH) return [];
  const A = [];
  if (t >= 13.4 && t < 16.6) {
    A.push({ k: "dot", at: [200, 35, 100], p: pr(t, 13.4, 0.3) });
    A.push({ k: "line", pts: [[200, 35, 100], [200, 35, 140]], dash: 1, p: pr(t, 13.4), label: "R100 圆心 = 入射点", at: [200, 35, 140], lo: [0, -3], size: 8.5 });
    A.push({ k: "line", pts: [[200, 35, 100], [200 + 100 * SIN, 30, 100 - 100 * COS]], thin: 1, p: pr(t, 14.2), label: "R = 100", at: [200 + 70 * SIN, 30, 100 - 70 * COS], lo: [8, 2], anchor: "start", size: 8.5 });
  }
  if (t >= 16.9 && t < 23.6) {
    const y = 30;
    A.push({ k: "line", pts: [[200, y, 100], [200, y, 146]], thin: 1, p: pr(t, 17.0, 0.4) });
    A.push({ k: "line", pts: [[212, y, 100], [212, y, 132]], thin: 1, p: pr(t, 17.0, 0.4) });
    A.push({ k: "line", pts: [[300, y, 100], [300, y, 146]], thin: 1, p: pr(t, 17.0, 0.4) });
    A.push({ k: "dim", a: [212, y, 128], b: [300, y, 128], p: pr(t, 17.4), label: "M = 88" });
    A.push({ k: "dim", a: [200, y, 142], b: [300, y, 142], p: pr(t, 18.6), label: "R = 100" });
    A.push({ k: "dim", a: [200, y, 128], b: [212, y, 128], p: pr(t, 19.8), label: t < 21.2 ? "l₀ = ?" : "l₀ = 12", lo: [-4, -3], anchor: "end" });
  }
  if (t >= 30.0 && t < 35.2) {
    const y = 35;
    A.push({ k: "line", pts: [[0, y, 100], [0, y, 126]], thin: 1, p: pr(t, 30.0, 0.4) });
    A.push({ k: "line", pts: [[83, y, 100], [83, y, 126]], thin: 1, p: pr(t, 30.0, 0.4) });
    A.push({ k: "dim", a: [0, y, 122], b: [83, y, 122], p: pr(t, 30.3), label: "L = 83" });
    A.push({ k: "line", pts: [[35, y, 100], [95, y, 100]], p: pr(t, 31.2), label: "a = 60", at: [65, y, 100], lo: [0, -3] });
    A.push({ k: "line", pts: [[35, y, 100], [35, y, 70]], p: pr(t, 31.6), label: "30", at: [35, y, 85], lo: [-3, 1.5], anchor: "end" });
    A.push({ k: "line", pts: [[95, y, 100], [35, y, 70]], dash: 1, thin: 1, p: pr(t, 32.0) });
    A.push({ k: "dot", at: [35, y, 70], p: pr(t, 31.6, 0.3) });
  }
  if (t >= 35.5 && t < 38.6) {
    A.push({ k: "dim", a: [178, 35, 0], b: [178, 35, 100], p: pr(t, 35.6), label: "T = 100", lo: [4, 1], anchor: "start" });
  }
  if (t >= 55.2 && t < 59.0) {
    A.push({ k: "dim", a: [60, 35, 100], b: [60, 35, 95], p: pr(t, 55.3, 0.4) });
    A.push({ k: "dot", at: [35, 35, 95], p: pr(t, 55.3, 0.3), label: "孔顶 5 mm 深", lo: [3, 7], anchor: "start", size: 8.5 });
  }
  return A;
}
const CALC = ZH ? [
  [13.4, 16.6, [[13.6, "回波最高 ⇔ 声束穿过圆心"], [14.4, "圆心正上方 = <em>入射点</em>", "res"]]],
  [17.4, 23.6, [[17.4, "M = <em>88</em>（钢尺实测）"], [18.6, "R = <em>100</em>（圆心到边缘）"], [19.8, "l₀ = R − M"], [21.2, "l₀ = 100 − 88 = 12 mm", "res"]]],
  [30.3, 35.2, [[30.3, "L = <em>83</em>（实测），l₀ = <em>12</em>"], [31.2, "a = L + l₀ − 35 = <em>60</em>"], [32.2, "K = a ÷ 30 = <em>2.0</em>"], [33.2, "β = arctan 2.0 = 63.4°", "res"]]],
  [35.6, 47.2, [[35.6, "1:4 → 每格 = <em>4 mm</em>"], [38.5, "延迟 2.6 mm → 抵消零偏"], [42.0, "B1 = 100 ÷ 4 = <em>25 格</em>"], [42.8, "B2 = 200 ÷ 4 = <em>50 格</em>"], [43.6, "B4 = 400 ÷ 4 = 100 格", "res"]]],
  [49.6, 52.6, [[49.6, "台阶处同时出现"], [50.2, "85 / 91 / 100 mm", "res"]]],
  [55.3, 59.2, [[55.3, "孔顶深度 = 30 − 25"], [56.0, "= 5 mm → 底波被挡", "res"]]],
] : [];
function calcAt(t) {
  const blk = CALC.find(([a, b]) => t >= a && t < b);
  if (!blk) return "";
  const fadeOut = Math.min(1, (blk[1] - t) / 0.3);
  return blk[2].filter(([r]) => t >= r).map(([r, html, cls]) => `<div class="${cls || ""}" style="opacity:${(Math.min(1, (t - r) / 0.3) * fadeOut).toFixed(2)};transform:scale(${cls ? (1 + 0.08 * Math.max(0, 1 - (t - r) / 0.4)).toFixed(3) : 1})">${html}</div>`).join("");
}
// camera keyframes: [t, scale, focusName or [fx, fy]]
const CAM = [
  [0, 1.0, [0.5, 0.52]], [7.6, 1.0, [0.5, 0.52]],
  [8.6, 1.08, [0.5, 0.5]], [16.4, 1.08, [0.5, 0.5]],
  [17.4, 1.65, "probe"], [23.0, 1.65, "probe"],
  [24.2, 1.3, "mid"], [34.6, 1.3, "mid"],
  ...(ZH ? [[35.8, 1.3, "mid"], [38.2, 1.3, "mid"], [39.0, 1.75, "screen"]] : [[35.8, 1.75, "screen"]]), [46.2, 1.75, "screen"],
  [47.4, 1.12, [0.5, 0.5]], [66.5, 1.12, [0.5, 0.5]],
];
// actions at a time (fired once)
const ACTIONS = [
  [0, "c.setView(0); c.setMode(0, false); c.set({ touring: false, x: 184, target: 184 });"],
  [3.5, "c.setView(1);"],
  [8.0, "c.setView(0); c.set({ target: 184 });"],
  [16.6, "c.setMode(1, false); c.set({ touring: false, x: 200, target: 200 });"],
  [23.6, "c.setMode(2, false); c.set({ touring: false, x: 84, target: 84 });"],
  [35.2, "c.setMode(3, false); c.set({ touring: false, x: 150, target: 150, rangeT: 300, delayT: 0 });"],
  [38.4, "c.set({ delayT: 2.6 });"],
  [41.9, "c.set({ rangeT: 400 });"],
];
// probe target sweeps: [t0, t1, from, to]
const SWEEPS = [
  [8.6, 10.8, 184, 216], [11.0, 13.0, 216, 196], [13.2, 14.4, 196, 200],
  [24.4, 26.6, 84, 106], [26.8, 28.6, 106, 93], [28.8, 29.6, 93, 95],
  [47.5, 50.0, 150, 201], [52.6, 55.0, 201, 35], [59.0, 60.4, 35, 150],
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("pageerror", e.message));
await page.goto(pathToFileURL(join(HERE, ZH ? "video-zh.html" : "video.html")).href);
await page.waitForFunction(() => window.__csk);
await page.evaluate(() => window.__csk.manual(true));

const N = Math.round(TOTAL * FPS);
const fired = new Set();
const frames = ONLY ? [15, 19.4, 22.5, 31.0, 34.0, 37.0, 44.5, 51, 57].map((s) => Math.round(s * FPS)) : null;
const lastNeeded = ONLY ? Math.max(...frames) : N - 1;
for (let f = 0; f <= lastNeeded; f++) {
  const t = f / FPS;
  const acts = ACTIONS.map((a, i) => [a, i]).filter(([a, i]) => a[0] <= t && !fired.has(i));
  acts.forEach(([, i]) => fired.add(i));
  let target = null;
  for (const [t0, t1, a, b] of SWEEPS) if (t >= t0 && t <= t1) target = lerp(a, b, ease((t - t0) / (t1 - t0)));
  // camera
  let i = 0; while (i < CAM.length - 2 && CAM[i + 1][0] <= t) i++;
  const [ta, sa, fa] = CAM[i], [tb, sb, fb] = CAM[i + 1];
  const u = ease((t - ta) / Math.max(1e-6, tb - ta));
  const sub = SUBS.find(([a, b]) => t >= a && t < b);
  const subAlpha = sub ? Math.min(1, (t - sub[0]) / 0.3, (sub[1] - t) / 0.3) : 0;
  const sec = SECS.find(([a, b]) => t >= a && t < b);
  const card = CARDS.find(([a, b]) => t >= a && t < b);
  const cardAlpha = card ? Math.min(1, (t - card[0]) / 0.4 + (card[0] === 0 ? 1 : 0), (card[1] - t) / 0.4 + (card[1] >= TOTAL ? 1 : 0)) : 0;
  const anno = annoAt(t), calc = calcAt(t);
  await page.evaluate(({ anno, calc, acts, target, cam, sub, subAlpha, sec, card, cardAlpha }) => {
    const c = window.__csk;
    for (const code of acts) new Function("c", code)(c);
    if (target !== null) c.set({ target });
    c.advance(1 / 30);
    c.anno(anno);
    const vk = document.getElementById("vcalc"); if (vk) vk.innerHTML = calc;
    const F = window.__FOCUS;
    const pick = (f) => (typeof f === "string" ? F[f] : f);
    const fa = pick(cam.fa), fb = pick(cam.fb);
    const s = cam.sa + (cam.sb - cam.sa) * cam.u;
    const fx = fa[0] + (fb[0] - fa[0]) * cam.u, fy = fa[1] + (fb[1] - fa[1]) * cam.u;
    const el = document.getElementById("vcam");
    const W = 1720, H = W * 430 / 680;
    const tx = 960 - s * fx * W, ty = 560 - s * fy * H;
    el.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    const vs = document.getElementById("vsub");
    if (sub && vs.dataset.k !== sub) { vs.innerHTML = sub; vs.dataset.k = sub; }
    vs.style.opacity = subAlpha;
    const vsec = document.getElementById("vsec");
    vsec.textContent = sec || "";
    const vc = document.getElementById("vcard");
    if (card && vc.dataset.k !== card) { vc.innerHTML = card; vc.dataset.k = card; }
    vc.style.opacity = cardAlpha;
  }, { anno, calc, acts: acts.map(([a]) => a[1]), target, cam: { sa, sb, fa, fb, u }, sub: sub ? sub[2] : null, subAlpha, sec: sec ? sec[2] : null, card: card ? card[2] : null, cardAlpha });
  if (!ONLY || frames.includes(f)) {
    await page.screenshot({ path: join(ONLY ? join(HERE, "shots") : OUT, (ONLY ? "pv-" : "") + String(f).padStart(5, "0") + ".jpg"), type: "jpeg", quality: 92 });
  }
  if (f === 0) await page.evaluate(() => {});
}
await browser.close();
console.log("frames", lastNeeded + 1);
