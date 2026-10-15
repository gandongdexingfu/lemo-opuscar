// CSK-IA 试块 · Anatomy figure
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { toEn } from "./en.mjs";
const LANG_EN = process.argv.includes("--en");
const SK = "/root/.claude/skills/synced/3311a816-988c-4158-958c-2682b409c730_71e2d1a3-d28e-4bae-b2ff-181658875c3a/anatomy";
const k = await import(SK + "/kit/iso-kit.mjs");
const G = await import(SK + "/kit/lathe.mjs");
const { kitScript } = await import(SK + "/scripts/inline-kit.mjs");

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--dark") ? "dark" : "light";

const WIDTH = 680;
const HEIGHT = 430;
const DEG = Math.PI / 180;

// ---------- world (mm) ----------
const BASE = { x: -248, y: -138, w: 572, d: 212, r: 10 };
const BASE_H = 12;
const FOOT_H = 5;

const BY0 = 10, BY1 = 30, BY2 = 35;          // block thickness: 20 mm layer to R100, 5 mm layer to R50
const PY = (BY0 + BY2) / 2;                  // probe centre line
const C = [200, 100];                        // R100 / R50 centre on the top surface
const TH0 = Math.atan2(-91, Math.sqrt(100 * 100 - 91 * 91)); // -65.5°
const HOLE = [35, 70];                       // φ50
const PIN = [35, 15];                        // φ1.5

const DET = { x: -236, y: -126, w: 212, d: 62, r: 7 };
const DX = (v) => DET.x + v;
const DET_Z0 = 3, DET_Z1 = 150;
const DET_FRONT = DET.y + DET.d;             // -30
const DET_SIDE = DET.x + DET.w;              // -54
const SCR = { x0: DX(16), x1: DX(150), z0: 42, z1: 136 };     // glass window
const BEZ = { x0: DX(9), x1: DX(157), z0: 34, z1: 144 };      // bezel recess
const GRID = { x0: DX(25), x1: DX(141), z0: 56, z1: 124 };    // A-scan grid inside the glass
const KNOBS = [[DX(185), 124], [DX(185), 98]];
const SOCKET = [DX(184), DET.y + 26, DET_Z1];
const BOTTLE = [-30, 50];
const RULE = { x: 0, y: 47, w: 300, d: 8, r: 1 };

const VIEWS = [
  { name: "标准", az: 56, el: 30 },
  { name: "圆弧端", az: 20, el: 24 },
  { name: "俯视", az: 56, el: 62 },
  { name: "正面", az: 84, el: 12 },
];
const FIT_PTS = [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [DET.x, DET.y, DET_Z1 + 34], [DET.x, DET.y + DET.d, DET_Z1 + 34], [DET.x + DET.w, DET.y, DET_Z1 + 40], [DET.x + DET.w, DET.y + DET.d, DET_Z1 + 40], [300, BY0, 150], [300, BY2, 150]];
let P, V, Lgt;
function setView(v) {
  P = k.fitProjection(FIT_PTS, WIDTH, HEIGHT, { pad: 18, azimuth: v.az, elevation: v.el });
  V = G.viewOf(P);
  Lgt = G.lightOf(P);
  return P;
}
setView(VIEWS[0]);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const pth = (pts, closed) => k.pathOf(pts.map(at), closed);
const shadeOf = (n) => Math.max(0, Math.min(3, G.bandOf(dot(G.unit3(n), Lgt)) - 1));
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const planeY = (y) => k.sideMatrix([0, y], 0, P, "left");   // local (x, -z) on the face y = const
const planeX = (x) => k.sideMatrix([x, 0], 0, P, "right");  // local (-y?, -z) on the face x = const

// ---------- profiles of the two layers (x, z, smooth) ----------
const arcPts = (cx, cz, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / n;
  return [cx + r * Math.cos(a), cz + r * Math.sin(a), i > 0 && i < n ? 1 : 0];
});
const FOOT_LINE = [[0, 0, 0], [200, 0, 0], [200, 15, 0], [202, 15, 0], [202, 9, 0]];
const R100_END = [C[0] + 100 * Math.cos(TH0), C[1] + 100 * Math.sin(TH0)];
const PROF_A = [...FOOT_LINE, ...arcPts(C[0], C[1], 100, TH0, 0, 60), [0, 100, 0]];
// 5 mm layer: radial edge, R10 fillet, R50 arc
const PHI = TH0 + Math.asin(10 / 60);
const ux = Math.cos(TH0), uz = Math.sin(TH0);
const T_LINE = [C[0] + 60 * Math.cos(PHI - TH0) * ux, C[1] + 60 * Math.cos(PHI - TH0) * uz];
const FC = [C[0] + 60 * Math.cos(PHI), C[1] + 60 * Math.sin(PHI)];
const aLine = Math.atan2(T_LINE[1] - FC[1], T_LINE[0] - FC[0]);
let aArc = Math.atan2(C[1] - FC[1], C[0] - FC[0]);
while (aArc - aLine > Math.PI) aArc -= 2 * Math.PI;
while (aArc - aLine < -Math.PI) aArc += 2 * Math.PI;
const PROF_B = [
  ...FOOT_LINE,
  [R100_END[0], R100_END[1], 0],
  [T_LINE[0], T_LINE[1], 0],
  ...arcPts(FC[0], FC[1], 10, aLine, aArc, 10).slice(1, -1),
  ...arcPts(C[0], C[1], 50, PHI, 0, 34).map((p, i) => (i === 0 ? [p[0], p[1], 1] : p)),
  [0, 100, 0],
];
PROF_A.splice(5, 0); // (R100_END is first arc point)

// ---------- prism along y ----------
function prismY(prof, y0, y1, { tone = "hi", backEdge = () => true, capClass = "", capInner = "" } = {}) {
  const n = prof.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const a = prof[i], b = prof[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const ccw = area > 0;
  const faces = [];
  for (let i = 0; i < n; i++) {
    const a = prof[i], b = prof[(i + 1) % n];
    const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz) || 1;
    const nrm = ccw ? [dz / len, 0, -dx / len] : [-dz / len, 0, dx / len];
    faces.push({ i, a, b, nrm, vis: dot(nrm, V) > 1e-6 });
  }
  const P3 = (p, y) => [p[0], y, p[1]];
  const fills = [];
  // merge runs of visible smooth faces with the same tone into one polygon
  const order = faces.filter((f) => f.vis).map((f) => ({ ...f, depth: dot([(f.a[0] + f.b[0]) / 2, (y0 + y1) / 2, (f.a[1] + f.b[1]) / 2], V) }));
  order.sort((p, q) => p.depth - q.depth);
  for (const f of order) {
    const quad = [P3(f.a, y0), P3(f.b, y0), P3(f.b, y1), P3(f.a, y1)];
    const isTop = f.nrm[2] > 0.98;
    const cls = isTop ? `<path class="iso-top" d="${pth(quad, true)}"/>` : `<path class="iso-shade" data-shade="${shadeOf(f.nrm)}" d="${pth(quad, true)}"/>`;
    const fill = `<path class="iso-fill" d="${pth(quad, true)}"/>`;
    const lines = [];
    if (backEdge(f.i, f)) lines.push(Ln(pth([P3(f.a, y0), P3(f.b, y0)]), { tone, className: "iso-edge" }));
    for (const [vi, other] of [[f.i, faces[(f.i - 1 + n) % n]], [(f.i + 1) % n, faces[(f.i + 1) % n]]]) {
      const v = prof[vi];
      if (!other.vis) lines.push(Ln(pth([P3(v, y0), P3(v, y1)]), { tone, className: "iso-edge" }));
      else if (!v[2] && vi === f.i) lines.push(Ln(pth([P3(v, y0), P3(v, y1)]), { tone: "lo" }));
    }
    fills.push(fill + cls + lines.join(""));
  }
  const cap = prof.map((p) => P3(p, y1));
  const capFill = `<path class="iso-fill" d="${pth(cap, true)}"/><path class="iso-shade ${capClass}" data-shade="${shadeOf([0, 1, 0])}" d="${pth(cap, true)}"/>`;
  const capEdges = [], capCrease = [];
  faces.forEach((f) => {
    const seg = pth([P3(f.a, y1), P3(f.b, y1)]);
    (f.vis ? capCrease : capEdges).push(seg);
  });
  return `<g class="iso-solid" data-seamless="">${fills.join("")}${capFill}${capInner}${Ln(capCrease.join(""), { tone: "lo", className: "iso-crease" })}${Ln(capEdges.join(""), { tone, className: "iso-edge" })}</g>`;
}

// ---------- bench ----------
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 24))) {
    out.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6.2, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(Ln(k.planOutline(k.insetPlan(BASE, 6), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 11);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  // rubber mat under the block
  const mat = { x: -8, y: 2, w: 318, d: 40, r: 3 };
  out.push(S(k.slabOf(mat, 0, 1.2, P, 4), { tone: "lo", crease: "none" }));
  out.push(Ln(k.planOutline(k.insetPlan(mat, 3), 1.2, P, 4), { tone: "faint" }));
  // steel ruler strip, zero at the block's left end
  out.push(S(k.slabOf(RULE, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(0, 300, 5, 2, RULE.y + 0.01, 0.8, [2.2, 3.8], P);
  out.push(Ln(t.minor, { tone: "lo" }), Ln(t.major, { tone: "mid" }));
  const big = Array.from({ length: 7 }, (_, i) => k.lineOnTop([i * 50, RULE.y + 0.01], [i * 50, RULE.y + 5.6], 0.8, P)).join("");
  out.push(Ln(big, { tone: "hi" }));
  out.push(D([at([RULE.x + RULE.w + 4, RULE.y + 4, 0])], { size: 0.45 }));
  // label plate on the bench
  const lab = { x: 240, y: 59, w: 54, d: 10, r: 1.4 };
  out.push(S(k.slabOf(lab, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(Ln(k.planOutline(k.insetPlan(lab, 1.6), 0.8, P, 3), { tone: "faint" }));
  out.push(Ln([40, 30, 22].map((w, i) => k.lineOnTop([lab.x + 5, lab.y + 3.4 + i * 2.6], [lab.x + 5 + w, lab.y + 3.4 + i * 2.6], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([lab.x + 3, lab.y + 3, 0.8]), at([lab.x + lab.w - 3, lab.y + lab.d - 3, 0.8])], { size: 0.4 }));
  return out.join("");
}

// ---------- flaw detector ----------
let clipN = 0;
const flat = (x0, z0, x1, z1, r, steps = 6) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
function recess({ x0, x1, z0, z1, r }, y, depth, back = "", backClass = "csk-well", inside = "") {
  const id = `csk-clip-${clipN++}`;
  const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [], sides = [[], [], [], []];
  ring.forEach(([ax, az], index) => {
    const [bx, bz] = ring[(index + 1) % ring.length];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / length, -(bx - ax) / length];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - depth, bz]), at([ax, y - depth, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(x0, z0, x1, z1, r);
  return [
    `<clipPath id="${id}"><path transform="${planeY(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, s) => (d.length ? `<path class="iso-shade" data-shade="${s}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeY(y - depth)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
    inside,
    `</g>`,
    `<g transform="${planeY(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}
function screenArt() {
  const g = [];
  const { x0, x1, z0, z1 } = GRID;
  const lines = [];
  for (let i = 0; i <= 10; i++) { const u = x0 + ((x1 - x0) * i) / 10; lines.push(`M${u.toFixed(2)} ${-z0}V${-z1}`); }
  for (let j = 0; j <= 5; j++) { const z = z0 + ((z1 - z0) * j) / 5; lines.push(`M${x0} ${(-z).toFixed(2)}H${x1}`); }
  g.push(`<path class="csk-grid" d="${lines.join("")}"/>`);
  const minor = [];
  for (let i = 0; i <= 50; i++) { const u = x0 + ((x1 - x0) * i) / 50; minor.push(`M${u.toFixed(2)} ${-z0}v${i % 5 ? -0.9 : -1.6}`); }
  g.push(`<path class="csk-grid" data-major="" d="${minor.join("")}"/>`);
  for (let i = 0; i <= 10; i += 2) g.push(`<text class="csk-scr-text" x="${(x0 + ((x1 - x0) * i) / 10).toFixed(2)}" y="${-(z0 - 5.2)}" font-size="4" text-anchor="middle">${i * 10}</text>`);
  g.push(`<text class="csk-scr-text" data-part="scr-mode" x="${SCR.x0 + 4}" y="${-(SCR.z1 - 7)}" font-size="4.6">横波 · 声程</text>`);
  g.push(`<text class="csk-scr-text" data-part="scr-val" x="${SCR.x1 - 4}" y="${-(SCR.z1 - 7)}" font-size="4.6" text-anchor="end">S 100.0  H 92%</text>`);
  g.push(`<path class="csk-gate" data-part="gate" d=""/>`);
  g.push(`<path class="csk-trace" data-part="trace" d=""/>`);
  return g.join("");
}
function detector() {
  const out = [`<path class="iso-halo" d="${k.haloOf(DET, 0, 16, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(DET, 12))) out.push(S(k.cylinder(x, y, 5, 0, DET_Z0, P, 20), { tone: "lo" }));
  // rubber bumper bands, case, top bumper
  out.push(S(k.slabOf(k.insetPlan(DET, -1.4), DET_Z0, 12, P, 6, 0.6), { tone: "lo" }));
  out.push(S(k.slabOf(DET, DET_Z0 + 12, DET_Z1 - DET_Z0 - 24, P, 6, 0.8), {
    tone: "mid",
    inner: Ln(k.sideSeam(DET, DET_Z0 + 64, P, 6), { tone: "faint" }),
  }));
  out.push(S(k.slabOf(k.insetPlan(DET, -1.4), DET_Z1 - 12, 12, P, 6, 0.8), { tone: "lo" }));
  // front: bezel + glass + screen
  out.push(recess({ ...BEZ, r: 5 }, DET_FRONT, 1.4, "", "csk-bezel", recess({ ...SCR, r: 3 }, DET_FRONT - 1.4, 3.2, screenArt(), "csk-glass")));
  // engraved panel line round the control column
  out.push(`<g transform="${planeY(DET_FRONT)}">${Ln(flat(DX(165), 34, DX(205), 144, 3), { tone: "faint" })}</g>`);
  // keypad: 2 x 3 keys and a power key
  const keyF = (x, z) => G.frameOf([x, DET_FRONT, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const keyPoly = (w, h) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  for (const z of [76, 66, 56]) for (const x of [DX(176), DX(194)]) {
    out.push(S(G.prismOf(keyF(x, z), keyPoly(12, 5.2), 0, 1.6, P), { tone: "mid" }));
  }
  out.push(S(G.prismOf(keyF(DX(176), 44), keyPoly(12, 5.2), 0, 1.6, P), { tone: "mid" }));
  out.push(`<g transform="${planeY(DET_FRONT + 1.6)}">${Ln(`M${DX(173)} -44h6`, { tone: "lo" })}</g>`);
  out.push(D([at([DX(194), DET_FRONT, 44])], { size: 1.1, tone: "hi" }));
  // knobs
  for (const [x, z] of KNOBS) {
    const F = G.frameAlong([x, DET_FRONT, z], [0, 1, 0]);
    out.push(S(G.disc(0, 2.2, 9.5, F, P), { tone: "lo" }));
    out.push(S(G.disc(2.2, 9, 7.6, F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 2.2, 9, 7.6, 44, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
    out.push(Ln(G.circleOf(F, 9, 5.4, P), { tone: "faint" }));
  }
  // vents on the right side face
  const vents = [];
  for (let i = 0; i < 10; i++) {
    const y0 = DET.y + 12 + i * 4.2;
    vents.push(k.pathOf(k.roundedPlan({ x: y0, y: 84, w: 1.8, d: 40, r: 0.9 }, 4).map(([yy, zz]) => at([DET_SIDE, yy, zz])), true));
  }
  out.push(Ln(vents.join(""), { tone: "lo" }));
  // handle on top: lugs + bar
  for (const x of [DX(22), DX(128)]) out.push(S(k.slabOf({ x: x - 5, y: DET.y + 22, w: 10, d: 14, r: 2 }, DET_Z1, 16, P, 4, 0.5), { tone: "mid" }));
  const bar = G.frameAlong([DX(17), DET.y + 29, DET_Z1 + 11], [1, 0, 0]);
  out.push(S(G.disc(0, 116, 4.2, bar, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(bar, 30, 86, 4.2, 22, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
  // label plate on top
  const lab = { x: DX(40), y: DET.y + 5, w: 56, d: 12, r: 1.5 };
  out.push(S(k.slabOf(lab, DET_Z1, 0.7, P, 3), { tone: "lo", crease: "none" }));
  out.push(Ln([34, 26].map((w, i) => k.lineOnTop([lab.x + 5, lab.y + 4 + i * 3.4], [lab.x + 5 + w, lab.y + 4 + i * 3.4], DET_Z1 + 0.7, P)).join(""), { tone: "lo", free: true }));
  // sockets: one free, one with the probe plug
  const sockF = (x, y) => G.frameOf([x, y, DET_Z1], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const free = sockF(DX(164), SOCKET[1]);
  out.push(S(G.disc(0, 2, 6.4, free, P), { tone: "lo" }));
  out.push(S(G.solidOf([[2, 4.6], [9, 4.6], [9, 3.4], [11, 3.4]], free, P), { tone: "mid" }));
  out.push(Ln(G.circleOf(free, 11, 1.4, P), { tone: "lo" }));
  const used = sockF(SOCKET[0], SOCKET[1]);
  out.push(S(G.disc(0, 2, 6.4, used, P), { tone: "lo" }));
  out.push(S(G.solidOf([[2, 4.6], [9, 4.6]], used, P), { tone: "mid" }));
  out.push(S(G.disc(9, 16, 5.4, used, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(used, 9, 16, 5.4, 26, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
  out.push(S(G.solidOf([[16, 4], [20, 3.2, 1], [25, 2.2, 1], [28, 1.9]], used, P), { tone: "mid" }));
  return out.join("");
}
const SOCKET_TIP = [SOCKET[0], SOCKET[1], DET_Z1 + 28];

// ---------- couplant bottle ----------
function bottle() {
  const [x, y] = BOTTLE;
  const F = G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 10, y: y - 10, w: 20, d: 20, r: 10 }, 0, 4, P)}"/>`];
  const body = [[0, 11], [36, 11, 1], [40, 10.4, 1], [43, 8.6, 1], [45.5, 6.2, 1], [47, 5.2]];
  out.push(S(G.solidOf(body, F, P), { tone: "mid", inner: Ln(G.arcOf(F, 8, 11, P) + G.arcOf(F, 30, 11, P), { tone: "faint" }) }));
  out.push(S(G.disc(47, 55, 5.8, F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 47, 55, 5.8, 28, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
  out.push(S(G.solidOf([[55, 3], [62, 1.6, 1], [67, 0.9]], F, P), { tone: "mid" }));
  return out.join("");
}

// ---------- CSK-IA block ----------
function block() {
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: 0, y: BY0, w: 300, d: BY2 - BY0, r: 2 }, 0, 6, P)}"/>`];
  // 20 mm layer reaching R100
  out.push(prismY(PROF_A, BY0, BY1, { tone: "hi" }));
  // 5 mm layer stopping at R50; its back edge along the top is coplanar with layer A
  const capInner = blockFace();
  out.push(prismY(PROF_B, BY1, BY2, { tone: "hi", backEdge: (i, f) => !(f.nrm[2] > 0.98), capInner }));
  // K marks on the top surface (scribed across the full top, front edge)
  const ticks = [95, 110, 125].map((x) => k.lineOnTop([x, BY2 - 4], [x, BY2], 100, P)).join("") + k.lineOnTop([C[0], BY0], [C[0], BY2], 100, P);
  out.push(Ln(ticks, { tone: "mid" }));
  return out.join("");
}
function blockFace() {
  // everything drawn on the front face (y = BY2), in local (x, -z)
  const f = [];
  const tr = planeY(BY2);
  f.push(`<g transform="${tr}">`);
  // φ50 hole filled with perspex
  f.push(`<circle class="csk-perspex" cx="${HOLE[0]}" cy="${-HOLE[1]}" r="25"/>`);
  f.push(`</g>`);
  // stepped bore seen through the perspex: φ44 at 13 mm, φ40 at 15 mm, floor at 23 mm
  const id = `csk-clip-${clipN++}`;
  f.push(`<clipPath id="${id}"><circle transform="${tr}" cx="${HOLE[0]}" cy="${-HOLE[1]}" r="25"/></clipPath><g clip-path="url(#${id})">`);
  for (const [r, dpt, tone] of [[25, 13, "faint"], [22, 13, "faint"], [22, 15, "faint"], [20, 15, "faint"], [20, 23, "lo"]]) {
    f.push(`<g transform="${planeY(BY2 - dpt)}"><circle class="iso-line" data-tone="${tone}" cx="${HOLE[0]}" cy="${-HOLE[1]}" r="${r}"/></g>`);
  }
  f.push(`</g>`);
  f.push(`<g transform="${tr}">`);
  f.push(`<circle class="iso-line" data-tone="mid" cx="${HOLE[0]}" cy="${-HOLE[1]}" r="25"/>`);
  f.push(`<path class="csk-glint" d="M${HOLE[0] - 15} ${-HOLE[1] - 12}A19 19 0 0 1 ${HOLE[0] + 2} ${-HOLE[1] - 19}"/>`);
  // φ1.5 through hole
  f.push(`<circle class="csk-bore" cx="${PIN[0]}" cy="${-PIN[1]}" r="0.75"/><circle class="iso-line" data-tone="mid" cx="${PIN[0]}" cy="${-PIN[1]}" r="0.75"/>`);
  // K scale marks on the face: K2.0/2.5/3.0 from the top edge, K1.0/1.5 from the bottom edge, centre mark at 200
  const marks = [95, 110, 125].map((x) => `M${x} -100v4`).join("") + [105, 140].map((x) => `M${x} 0v-4`).join("") + `M200 -100v6`;
  f.push(Ln(marks, { tone: "mid" }));
  const txt = (x, y, s, a = "middle") => `<text class="iso-face-text csk-engrave" x="${x}" y="${y}" font-size="3" text-anchor="${a}">${s}</text>`;
  f.push(txt(95, -92.6, "K2.0"), txt(110, -92.6, "K2.5"), txt(125, -92.6, "K3.0"), txt(105, -5.4, "K1.0"), txt(140, -5.4, "K1.5"));
  f.push(`<text class="iso-face-text csk-engrave" x="120" y="-40" font-size="7" text-anchor="middle" letter-spacing="0.8">CSK-IA</text>`);
  // stamped serial and chamfer highlight along the top edge
  f.push(Ln([16, 11].map((w, i) => `M${8} ${-(12 - i * 3.2)}h${w}`).join(""), { tone: "lo", free: true }));
  f.push(`<path class="csk-chamfer" d="M0.6 -99.2H249.4"/>`);
  f.push(`</g>`);
  return f.join("");
}

// ---------- probes ----------
const ANGLE = { l0: 12, rear: 14, w: 16, h: 18, z: 100 };
function angleProbe(xi, dir) {
  // dir = +1: beam toward +x ; -1: toward -x. Incident point at xi.
  const front = xi + dir * ANGLE.l0, back = xi - dir * ANGLE.rear;
  const x0 = Math.min(front, back), x1 = Math.max(front, back);
  const plan = { x: x0, y: PY - ANGLE.w / 2, w: x1 - x0, d: ANGLE.w, r: 1.2 };
  const z = ANGLE.z;
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, z, 3, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(plan, z, 2.2, P, 3), { tone: "lo" }));                              // wear shoe
  const body = k.insetPlan(plan, 0.3);
  const yF = plan.y + plan.d;
  // incident-point notch and arrow on the near side face, label rules
  const side = [];
  side.push(Ln(pth([[xi, yF - 0.3, z + 2.2], [xi, yF - 0.3, z + 9]]), { tone: "hi" }));
  side.push(Ln(pth([[xi - 1.2, yF - 0.3, z + 2.2], [xi, yF - 0.3, z + 4], [xi + 1.2, yF - 0.3, z + 2.2]]), { tone: "hi" }));
  const lx = Math.min(xi + dir * 3, xi + dir * 10), lx1 = Math.max(xi + dir * 3, xi + dir * 10);
  side.push(Ln([0, 1].map((r) => pth([[lx, yF - 0.3, z + 13 - r * 2.4], [lx + (lx1 - lx) * (r ? 0.6 : 1), yF - 0.3, z + 13 - r * 2.4]])).join(""), { tone: "lo", free: true }));
  out.push(S(k.slabOf(body, z + 2.2, ANGLE.h - 2.2, P, 3, 0.5), { tone: "hi", inner: Ln(k.sideSeam(body, z + 6.5, P, 3), { tone: "faint" }) + side.join("") }));
  const cap = k.insetPlan(plan, 1.6);
  out.push(S(k.slabOf(cap, z + ANGLE.h, 1.2, P, 3), { tone: "mid" }));
  out.push(D(k.corners(cap, 2.2).map(([x, y]) => at([x, y, z + ANGLE.h + 1.2])), { size: 0.45 }));
  // beam arrow engraved on the cap
  out.push(Ln(k.onTop([[xi - dir * 4, PY - 0.5], [xi + dir * 3, PY - 0.5], [xi + dir * 3, PY - 2], [xi + dir * 6.4, PY], [xi + dir * 3, PY + 2], [xi + dir * 3, PY + 0.5], [xi - dir * 4, PY + 0.5]], z + ANGLE.h + 1.2, P, true), { tone: "lo" }));
  // connector at the back
  const F = G.frameAlong([back, PY, z + 11], [-dir, 0, 0]);
  out.push(S(G.disc(0, 2.6, 5.2, F, P), { tone: "mid" }));
  out.push(S(G.disc(2.6, 8.6, 4.2, F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 2.6, 8.6, 4.2, 26, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
  out.push(S(G.solidOf([[8.6, 3], [12, 2.4, 1], [15, 1.9]], F, P), { tone: "mid" }));
  return { svg: out.join(""), plug: [back - dir * 15, PY, z + 11], axis: [-dir, 0, 0] };
}
function straightProbe(xs) {
  const F = G.frameOf([xs, PY, 100], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: xs - 11, y: PY - 11, w: 22, d: 22, r: 11 }, 100, 3, P)}" style="filter:blur(3px)"/>`];
  out.push(S(G.disc(0, 2, 10.6, F, P), { tone: "lo" }));
  out.push(S(G.disc(2, 27, 10.6, F, P), { tone: "hi", inner: k.fadedSvg(G.ribsOf(F, 9, 21, 10.6, 60, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
  out.push(S(G.solidOf([[27, 10.6], [29, 9.4, 1], [31, 8]], F, P), { tone: "hi" }));
  out.push(S(G.disc(31, 36, 3.6, F, P), { tone: "mid" }));
  out.push(S(G.disc(36, 42, 4.4, F, P), { tone: "mid", inner: k.fadedSvg(G.ribsOf(F, 36, 42, 4.4, 26, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) }));
  out.push(S(G.solidOf([[42, 3.1], [46, 2.5, 1], [49, 1.9]], F, P), { tone: "mid" }));
  return { svg: out.join(""), plug: [xs, PY, 149], axis: [0, 0, 1] };
}

// steel rule laid on the top for measuring M (tab 2)
function steelRule() {
  const plan = { x: 186, y: BY0 + 0.2, w: 114, d: 4, r: 0.4 };
  const out = [S(k.slabOf(plan, 100, 0.6, P, 2), { tone: "hi", crease: "lo" })];
  const t = k.topTicks(186, 300, 2, 5, plan.y + 0.01, 100.6, [1.2, 2.4], P);
  out.push(Ln(t.minor, { tone: "lo" }), Ln(t.major, { tone: "mid" }));
  return out.join("");
}

// ---------- assemble ----------
const XI_INC = 200, XI_K = 95, XS = 150;
const pA = angleProbe(XI_INC, +1);
const pK = angleProbe(XI_K, -1);
const pS = straightProbe(XS);

function buildSvg(vi) {
  setView(VIEWS[vi]);
  const a = angleProbe(XI_INC, +1), kk = angleProbe(XI_K, -1), st = straightProbe(XS);
  const groups = [
    { d: k.depthOf([DET.x + DET.w / 2, DET.y + DET.d / 2, 70], P), svg: detector() + `<g data-part="knobs"></g>` },
    { d: k.depthOf([150, PY, 50], P), svg: [
      block(),
      `<g data-part="beam" class="csk-beam"></g>`,
      `<g data-part="rule" class="csk-swap" style="opacity:0">${steelRule()}</g>`,
      `<g data-part="probeA" class="csk-swap">${a.svg}</g>`,
      `<g data-part="probeK" class="csk-swap" style="opacity:0">${kk.svg}</g>`,
      `<g data-part="probeS" class="csk-swap" style="opacity:0">${st.svg}</g>`,
    ].join("") },
    { d: k.depthOf([BOTTLE[0], BOTTLE[1], 30], P), svg: bottle() },
  ].sort((p, q) => p.d - q.d);
  return k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  className: "csk-view",
  label: "等轴测图：工作台上立着一块 CSK-IA 标准试块，左后方是一台数字超声探伤仪。探头在试块顶面移动，声束画在试块正面，探伤仪屏幕实时显示 A 型扫描回波。",
  body: [
    bench(),
    ...groups.map((g) => g.svg),
    `<g data-part="cable"><path class="csk-cable-o" d=""/><path class="csk-cable-i" d=""/><path class="csk-cable-s" d=""/></g>`,
    `<g data-part="anno" class="csk-anno"></g>`,
  ],
  });
}
const VIEW_SVGS = VIEWS.map((_, i) => buildSvg(i));
const VIEW_PS = VIEWS.map((v) => setView(v));
setView(VIEWS[0]);
const svg = VIEW_SVGS.map((x, i) => (i ? x.replace("<svg ", '<svg style="display:none" ') : x)).join("");

const CSK_LIGHT = "--csk-glass:#26302e;--csk-glass-2:#1d2523;--csk-trace:#d9f2e6;--csk-grid:#4d5c58;--csk-scr-text:#a9c9bc;--csk-perspex:#e9efef;--csk-perspex-o:.85;--csk-beam:#000;--csk-gate:#e2b45a";
const CSK_DARK = "--csk-glass:#0f1614;--csk-glass-2:#0b100f;--csk-trace:#c8f0dc;--csk-grid:#2b3835;--csk-scr-text:#86a99b;--csk-perspex:#1f2526;--csk-perspex-o:.9;--csk-beam:#fff;--csk-gate:#c99a44";
const CSS = `
.iso{${CSK_LIGHT}}
.iso[data-theme="dark"]{${CSK_DARK}}
.csk-well,.csk-bezel{fill:var(--anatomy-shade-0)}
.csk-glass{fill:var(--csk-glass)}
.csk-grid{fill:none;stroke:var(--csk-grid);stroke-width:.35;vector-effect:none!important}
.csk-grid[data-major]{stroke-width:.3}
.csk-scr-text{fill:var(--csk-scr-text);font-family:var(--anatomy-mono);letter-spacing:.02em}
.csk-trace{fill:none;stroke:var(--csk-trace);stroke-width:.55;stroke-linejoin:round;vector-effect:none!important}
.csk-gate{fill:none;stroke:var(--csk-gate);stroke-width:.6;vector-effect:none!important}
.csk-chamfer{fill:none;stroke:var(--anatomy-face);stroke-width:.8;vector-effect:none!important;opacity:.9}
.csk-perspex{fill:var(--csk-perspex);opacity:var(--csk-perspex-o)}
.csk-glint{fill:none;stroke:var(--anatomy-face);stroke-width:1.2;opacity:.9;vector-effect:none!important;stroke-linecap:round}
.csk-bore{fill:var(--anatomy-hi)}
.csk-engrave{fill:var(--anatomy-mid)}
.csk-swap{transition:opacity .5s var(--anatomy-ease)}
.csk-cable-o{fill:none;stroke:var(--anatomy-hi);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;vector-effect:none!important}
.csk-cable-i{fill:none;stroke:var(--anatomy-shade-1);stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;vector-effect:none!important}
.csk-cable-s{fill:none;stroke:var(--anatomy-top);stroke-width:.6;stroke-linecap:round;vector-effect:none!important;transform:translate(-.35px,-.45px)}
.csk-beam-fan{fill:var(--csk-beam);opacity:.07;stroke:none}
.csk-beam-axis{fill:none;stroke:var(--csk-beam);stroke-width:.9;stroke-linecap:round}
.csk-beam-axis[data-weak]{opacity:.35}
.csk-pulse{fill:var(--csk-beam)}
.csk-anno .anno-l{fill:none;stroke:#D97757;stroke-width:2.4px;stroke-linecap:round;stroke-linejoin:round}
.csk-anno .anno-thin{stroke-width:1.4px}
.csk-anno .anno-dash{stroke-dasharray:5 4}
.csk-anno .anno-dot{fill:#D97757}
.csk-anno .anno-t{fill:#C15F3C;font-family:Inter,"Noto Sans CJK SC",sans-serif;font-weight:700;paint-order:stroke;stroke:var(--anatomy-card);stroke-width:3px;stroke-linejoin:round;vector-effect:none}
.csk-views{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:10px 0 0;font:11px/1 var(--anatomy-mono);color:var(--anatomy-muted)}
.csk-viewbtn{font:11px/1 var(--anatomy-mono);letter-spacing:.06em;padding:6px 10px;border:0;border-radius:4px;background:transparent;color:var(--anatomy-muted);cursor:pointer}
.csk-viewbtn[aria-pressed="true"]{color:var(--anatomy-strong);background:var(--anatomy-face);box-shadow:0 0 0 1px var(--anatomy-lo)}
.csk-viewbtn:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:2px}
.iso-stage{touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}
.iso-stage[data-drag]{cursor:grabbing}
.csk-in{animation:csk-in .45s var(--anatomy-ease)}
@keyframes csk-in{from{opacity:.25}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.csk-in{animation:none}}
.csk-tabs{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0 0}
.csk-tab{font:12px/1 var(--anatomy-mono);letter-spacing:.04em;padding:8px 12px;border:0;border-radius:999px;background:transparent;color:var(--anatomy-muted);box-shadow:0 0 0 1px var(--anatomy-lo);cursor:pointer}
.csk-tab[aria-selected="true"]{color:var(--anatomy-strong);box-shadow:0 0 0 1px var(--anatomy-hi);background:var(--anatomy-face)}
.csk-knobs{display:none;gap:18px;justify-content:center;margin:12px 0 0;font:12px/1.4 var(--anatomy-mono);color:var(--anatomy-muted)}
.csk-knobs[data-on]{display:flex;flex-wrap:wrap}
.csk-knobs label{display:flex;align-items:center;gap:8px}
.csk-knobs input{accent-color:var(--anatomy-hi);width:150px}
.csk-steps{margin:10px 0 0;font-size:13px;line-height:1.6;color:var(--anatomy-text);min-height:3.2em;text-align:center}
.csk-steps b{color:var(--anatomy-strong);font-weight:600}
.iso-plate-corner[data-corner="readout"]{white-space:normal;text-align:right;max-width:62%}
.iso-stage{overflow:hidden}
@media (max-width:560px){.iso-stage svg{width:114%;margin:-3% 0 -4% -9%}.iso-plate-corner[data-corner="readout"]{max-width:100%;bottom:0}.csk-knobs input{width:110px}}
`;

const DATA = {
  views: VIEW_PS, WIDTH, PY, BY1, BY2, C, HOLE, TH0, GRID, SCR, KNOBS, DET_FRONT,
  XI_INC, XI_K, XS, SOCKET_TIP,
  plugA: pA.plug, axisA: pA.axis, plugK: pK.plug, axisK: pK.axis, plugS: pS.plug, axisS: pS.axis,
  K_NOM: 2.0, L0: ANGLE.l0, ZERO: 2.6,
};

const live = `
const DATA = ${JSON.stringify(DATA)};
${LIVE()}
`;

function LIVE() {
  return String.raw`
const { PY, BY1, BY2, C, HOLE, GRID, SCR, KNOBS, DET_FRONT, XI_INC, XI_K, XS, SOCKET_TIP, L0, ZERO, WIDTH } = DATA;
let P = DATA.views[0];
const stage = document.querySelector(".iso-stage");
const svgs = [...stage.querySelectorAll("svg")];
let svg = svgs[0];
const $ = (name) => svg.querySelector('[data-part="' + name + '"]');
const readout = document.querySelector("[data-readout]");
const steps = document.querySelector(".csk-steps");
const knobBox = document.querySelector(".csk-knobs");
const rangeIn = document.querySelector("#csk-range"), delayIn = document.querySelector("#csk-delay");
const rangeOut = document.querySelector("#csk-range-v"), delayOut = document.querySelector("#csk-delay-v");
const tabs = [...document.querySelectorAll(".csk-tab")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const at = (p) => iso(p, P);
const pathOf2 = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const beta = Math.atan(DATA.K_NOM);
const SIN = Math.sin(beta), COS = Math.cos(beta);

// ---- echo model ----
const SIGMA = 2.6;             // beam half-width at the reflector (mm), for the amplitude fall-off
const gauss = (d, s) => Math.exp(-(d * d) / (2 * s * s));
function echoesFor(mode, x) {
  if (mode === 0 || mode === 1) {
    const e = x - C[0];
    const off = Math.abs(e) * COS;
    const a = gauss(off, SIGMA);
    const s = 100 - Math.abs(e) * 0.12;
    return { list: [{ s: 50 - Math.abs(e) * 0.06, a: 0.62 * a, w: 1.0 }, { s, a: 0.94 * a, w: 1.1 }], main: { s, a } };
  }
  if (mode === 2) {
    const dx = x - HOLE[0], dz = 100 - HOLE[1];
    const d = Math.abs(dx * COS - dz * SIN);
    const a = gauss(d, SIGMA * 1.15);
    const s = Math.hypot(dx, dz) - 25;
    return { list: [{ s, a: 0.9 * a, w: 1.0 }], main: { s, a } };
  }
  // straight probe: split the φ20 crystal into strips and see what each strip's vertical line hits first
  const R = 10, N = 41, groups = new Map();
  let total = 0;
  for (let i = 0; i < N; i++) {
    const u = -R + (2 * R * (i + 0.5)) / N;
    const wgt = Math.sqrt(Math.max(0, 1 - (u / R) * (u / R)));
    total += wgt;
    const xs = x + u;
    let depth = null, gain = 1;
    const dh = xs - HOLE[0];
    if (Math.abs(dh) < 25) {                     // φ50 hole (perspex): its curved top reflects, and shadows the bottom
      depth = 30 - Math.sqrt(25 * 25 - dh * dh);
      gain = Math.pow(Math.sqrt(1 - (dh / 25) * (dh / 25)), 10) * 0.8;
    } else if (xs < 200) depth = 100;
    else if (xs <= 202) depth = 85;
    else if (xs < 241.5) depth = 91;
    else { depth = null; }                       // under the R100 arc: inclined, nothing comes straight back
    if (depth === null) continue;
    const key = Math.abs(dh) < 25 ? "h" : String(depth);
    const g = groups.get(key) || { d: depth, w: 0 };
    g.d = Math.min(g.d, depth); g.w += wgt * gain;
    groups.set(key, g);
  }
  const list = [];
  for (const { d, w: wsum } of groups.values()) {
    const a0 = (0.96 * wsum) / total;
    if (a0 < 0.015) continue;
    const reps = d < 20 ? 3 : 6;
    for (let n = 1; n <= reps; n++) list.push({ s: n * d, a: a0 * Math.pow(d < 20 ? 0.55 : 0.72, n - 1), w: 1.3, d });
  }
  list.sort((p, q) => p.s - q.s);
  const firsts = list.filter((e) => Math.abs(e.s - e.d) < 1e-6);
  const main = firsts.reduce((b, e) => (!b || e.a > b.a ? e : b), null) || { s: 0, a: 0 };
  return { list, main, firsts };
}

// ---- screen: A-scan in the detector's face plane, local (x, -z) ----
let noiseT = 0;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function drawTrace(mode, ech, range, delay) {
  const { x0, x1, z0, z1 } = GRID;
  const H = z1 - z0;
  const N = 900;
  const pts = [];
  const zero = mode === 3 ? ZERO : 9;
  for (let i = 0; i <= N; i++) {
    const f = i / N;
    const s = delay + f * range;                    // sound path at this column
    let y = 0;
    // initial pulse tail (the bang happens at s = -zero, i.e. before the material surface)
    const tb = s + zero;
    if (tb > -3) y += 1.15 * Math.exp(-Math.max(0, tb) / 2.2) * (0.6 + 0.4 * Math.abs(Math.cos(tb * 3.1)));
    for (const e of ech.list) {
      const d = s - (e.s + (mode === 3 ? zero : 0));
      const w = Math.max(e.w, range / 260);
      const env = Math.exp(-(d * d) / (2 * w * w));
      y += e.a * env * (0.6 + 0.4 * Math.abs(Math.cos((d / w) * 2.4)));
    }
    y += 0.022 * hash(i * 7.13 + Math.floor(noiseT * 9)) + 0.01 * hash(i * 3.7);
    y = Math.min(1.08, y);
    pts.push([x0 + f * (x1 - x0), -(z0 + y * H * 0.92)]);
  }
  $("trace").setAttribute("d", pathOf2(pts));
}

// ---- beam drawn on the block's front faces ----
let fan, axisEl, pulseEl;
function bindBeam() {
  const beamG = $("beam");
  if (!beamG.firstChild) beamG.innerHTML = '<path class="csk-beam-fan" data-b="fan"/><path class="csk-beam-axis" data-b="axis"/><circle class="csk-pulse" data-b="pulse" r="1.3"/>';
  fan = beamG.querySelector('[data-b="fan"]'); axisEl = beamG.querySelector('[data-b="axis"]'); pulseEl = beamG.querySelector('[data-b="pulse"]');
}
bindBeam();
// a point in the x-z plane mapped onto the visible front surface: 5 mm layer at y = BY2 inside R50,
// 20 mm layer at y = BY1 in the fan between R50 and R100
const R50 = 50;
function onFace(x, z) {
  const r = Math.hypot(x - C[0], z - C[1]);
  const ang = Math.atan2(z - C[1], x - C[0]);
  const inFan = r > R50 - 0.01 && ang > DATA.TH0 && ang < 0.001 && !(z > 99.9 && x < 250);
  return at([x, inFan ? BY1 : BY2, z]);
}
function beamPath(x0, z0, x1, z1, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(onFace(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)); }
  return pts;
}
function drawBeam(mode, x, a, phase) {
  let A, B, spread;
  if (mode === 0 || mode === 1) { A = [x, 100]; B = [x + 100 * SIN, 100 - 100 * COS]; spread = 4.2 * DEG(1); }
  else if (mode === 2) { const s = Math.hypot(x - HOLE[0], 100 - HOLE[1]) - 25; const L = s + 0.5; A = [x, 100]; B = [x - (L) * SIN, 100 - (L) * COS]; spread = 4.2 * DEG(1); }
  else {
    const dh = x - HOLE[0];
    const zb = Math.abs(dh) < 25 ? HOLE[1] + Math.sqrt(625 - dh * dh) : x < 200 ? 0 : x <= 202 ? 15 : x < 241.5 ? 9 : 100 - Math.sqrt(Math.max(0, 10000 - (x - 200) * (x - 200)));
    A = [x, 100]; B = [x, zb]; spread = 0;
  }
  // stop the axis on the reflector (R100 arc or the hole surface)
  if (mode === 0 || mode === 1) {
    // intersect the ray with the R100 circle
    const dx = SIN, dz = -COS; const fx = A[0] - C[0], fz = A[1] - C[1];
    const b = fx * dx + fz * dz, cc = fx * fx + fz * fz - 100 * 100; const t = -b + Math.sqrt(b * b - cc);
    B = [A[0] + dx * t, A[1] + dz * t];
  } else if (mode === 2) {
    const dx = -SIN, dz = -COS; const fx = A[0] - HOLE[0], fz = A[1] - HOLE[1];
    const b = fx * dx + fz * dz, cc = fx * fx + fz * fz - 25 * 25; const disc = b * b - cc;
    const t = disc > 0 ? -b - Math.sqrt(disc) : Math.hypot(fx, fz);
    B = [A[0] + dx * t, A[1] + dz * t];
  }
  const axis = beamPath(A[0], A[1], B[0], B[1]);
  axisEl.setAttribute("d", pathOf2(axis));
  axisEl.toggleAttribute("data-weak", a < 0.55);
  axisEl.style.display = mode === 3 ? "none" : "";
  // fan: two edges at ±spread
  if (mode < 3) {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const dirA = Math.atan2(B[1] - A[1], B[0] - A[0]);
    const e1 = [A[0] + L * Math.cos(dirA + spread), A[1] + L * Math.sin(dirA + spread)];
    const e2 = [A[0] + L * Math.cos(dirA - spread), A[1] + L * Math.sin(dirA - spread)];
    const p = [...beamPath(A[0], A[1], e1[0], e1[1], 20), ...beamPath(e2[0], e2[1], A[0], A[1], 20)];
    fan.setAttribute("d", pathOf2(p) + "Z");
  } else {
    const w = 9;
    const zb = B[1], g = 1 + 0.3 * (100 - zb) / 100;
    const p = [...beamPath(A[0] - w, A[1], A[0] - w * g, zb, 10), ...beamPath(A[0] + w * g, zb, A[0] + w, A[1], 10)];
    fan.setAttribute("d", pathOf2(p) + "Z");
  }
  // a pulse runs out and back along the axis
  const u = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const q = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u];
  const pp = onFace(q[0], q[1]);
  pulseEl.setAttribute("cx", pp[0].toFixed(1)); pulseEl.setAttribute("cy", pp[1].toFixed(1));
  pulseEl.style.opacity = (mode < 3 ? 0.25 + 0.75 * a : 0.9).toFixed(2);
}
function DEG(n) { return (n * Math.PI) / 180; }

// ---- cable from the plug to the detector socket ----
let cableEls = [...$("cable").children];
function drawCable(plug, axis) {
  const p0 = plug, p3 = SOCKET_TIP;
  const p1 = [p0[0] + axis[0] * 40, p0[1] + axis[1] * 40, p0[2] + axis[2] * 40 + 14];
  const p2 = [p3[0] + 30, p3[1] + 6, p3[2] + 70];
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, m = 1 - t;
    const b = [0, 1, 2].map((j) => m * m * m * p0[j] + 3 * m * m * t * p1[j] + 3 * m * t * t * p2[j] + t * t * t * p3[j]);
    pts.push(at(b));
  }
  const d = pathOf2(pts);
  cableEls.forEach((el) => el.setAttribute("d", d));
}

// ---- knob pointers ----
let knobEls;
function bindKnobs() {
  const box = $("knobs");
  if (!box.firstChild) KNOBS.forEach(() => { const el = document.createElementNS("http://www.w3.org/2000/svg", "path"); el.setAttribute("class", "iso-line"); el.setAttribute("data-tone", "hi"); el.setAttribute("data-free", "end"); box.appendChild(el); });
  knobEls = [...box.children];
}
bindKnobs();
function drawKnob(i, turn) {
  const [x, z] = KNOBS[i];
  const a = -Math.PI / 2 + turn * Math.PI * 1.5;
  const y = DET_FRONT + 9;
  const p0 = at([x, y, z]), p1 = at([x + Math.cos(a) * 5.6, y, z + Math.sin(-a) * -5.6]);
  knobEls[i].setAttribute("d", "M" + p0[0].toFixed(2) + " " + p0[1].toFixed(2) + "L" + p1[0].toFixed(2) + " " + p1[1].toFixed(2));
}

// ---- tabs and state ----
const MODES = [
  { name: "入射点", probe: "probeA", plug: DATA.plugA, axis: DATA.axisA, home: XI_INC, reach: [150, 262], tour: [184, 216, 200] },
  { name: "前沿长度", probe: "probeA", plug: DATA.plugA, axis: DATA.axisA, home: XI_INC, reach: [150, 262], tour: [190, 208, 200] },
  { name: "K 值", probe: "probeK", plug: DATA.plugK, axis: DATA.axisK, home: XI_K, reach: [50, 185], tour: [84, 106, 95] },
  { name: "直探头", probe: "probeS", plug: DATA.plugS, axis: DATA.axisS, home: XS, reach: [12, 238], tour: [XS] },
];
const STEPS = [
  "斜探头放在顶面中线，声束朝 <b>R100 圆弧</b>。前后移动找最高回波：此时 R100 的圆心（顶面刻线 200）正对的探头位置，就是<b>入射点</b>。",
  "入射点找到后，量探头前端到圆弧边缘的距离 <b>M</b>（钢尺零点贴着圆弧边）。R100 圆心到边缘正好 100 mm，所以 <b>l₀ = 100 − M</b>。",
  "探头调头，声束对准 <b>φ50 孔</b>（孔心距顶面 30 mm）。找到最高回波，量探头前端到试块左端的距离 <b>L</b>，则 <b>K = (L + l₀ − 35) / 30</b>。也可直接读入射点对着的 K 刻线。",
  "直探头放在 100 mm 厚处，底面回波 B1、B2、B3、B4… 等距排开。<b>不能用始波定零</b>（中间隔着保护膜和耦合层），而是调「延迟」和「范围」，让 <b>B2 对准 50、B4 对准 100</b>，即 1:4。调好后<b>拖动探头</b>：右段只有 91 mm 厚，底波整排左移；跨在 x≈200 的台阶上，85 / 91 / 100 同时出现，这就是测分辨力的原理；移到 φ50 孔上方，孔顶只在 5 mm 深处，底波被挡住。",
];
let mode = 0;
let x = XI_INC, target = XI_INC;
let range = 300, delay = 0, rangeT = 300, delayT = 0;
let touring = true, clock = 0, idle = 0, frame = 0, last = 0, visible = false, beamPhase = 0;
const probeBase = { probeA: XI_INC, probeK: XI_K, probeS: XS };

function applyMode() {
  for (const name of ["probeA", "probeK", "probeS"]) $(name).style.opacity = MODES[mode].probe === name ? "1" : "0";
  $("rule").style.opacity = mode === 1 ? "1" : "0";
  $("scr-mode").textContent = mode === 3 ? "纵波 · 深度 1:4" : "横波 · 声程 K2";
}
function setView(i) {
  svgs.forEach((el, j) => { el.style.display = j === i ? "" : "none"; });
  svg = svgs[i]; P = DATA.views[i];
  svg.classList.remove("csk-in"); void svg.getBoundingClientRect(); svg.classList.add("csk-in");
  bindBeam(); bindKnobs(); cableEls = [...$("cable").children];
  for (const name of ["probeA", "probeK", "probeS", "rule"]) $(name).style.transition = "none";
  applyMode();
  requestAnimationFrame(() => { for (const name of ["probeA", "probeK", "probeS", "rule"]) $(name).style.transition = ""; });
  viewBtns.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
  draw(); run();
}
const viewBtns = [...document.querySelectorAll(".csk-viewbtn")];
viewBtns.forEach((b, i) => b.addEventListener("click", () => setView(i)));
function setMode(m, user) {
  mode = m;
  tabs.forEach((t, i) => t.setAttribute("aria-selected", String(i === m)));
  applyMode();
  knobBox.toggleAttribute("data-on", m === 3);
  steps.innerHTML = STEPS[m];
  x = MODES[m].tour[0]; target = x;
  if (m === 3) { range = rangeT = 300; delay = delayT = 0; rangeIn.value = 300; delayIn.value = 0; }
  else { range = 125; delay = 0; }
  clock = 0; touring = !still.matches;
  if (still.matches) { x = target = MODES[m].home; if (m === 3) { range = rangeT = 400; delay = delayT = ZERO; } }
  run();
}
tabs.forEach((t, i) => t.addEventListener("click", () => { setMode(i, true); }));

function tourTarget(t) {
  const m = MODES[mode];
  if (mode === 3) {
    // calibration story: delay first, then range, hold, reset
    const T = t % 11;
    if (T < 1.6) { delayT = 0; rangeT = 300; }
    else if (T < 4.2) { delayT = ZERO; rangeT = 300; }
    else if (T < 9.4) { delayT = ZERO; rangeT = 400; }
    else { delayT = 0; rangeT = 300; }
    rangeIn.value = rangeT; delayIn.value = delayT;
    return XS;
  }
  const seq = m.tour, i = Math.floor(t / 2.4) % (seq.length + 1);
  return seq[Math.min(i, seq.length - 1)];
}

function text(m, ech) {
  const amp = Math.round(Math.min(1, ech.main.a) * 100);
  if (m === 0) return "R100 回波 " + amp + "% · 入射点 x = " + x.toFixed(1) + (amp > 97 ? " · 正对圆心 ✓" : "");
  if (m === 1) { const M = 300 - (x + L0); return "M = " + M.toFixed(1) + " mm → l₀ = 100 − M = " + (100 - M).toFixed(1) + " mm" + (amp > 97 ? " ✓" : " (回波 " + amp + "%)"); }
  if (m === 2) { const Lx = x - L0; const K = (Lx + L0 - 35) / 30; return "L = " + Lx.toFixed(1) + " mm → K = " + K.toFixed(2) + " · β = " + (Math.atan(K) * 180 / Math.PI).toFixed(1) + "° · 孔回波 " + amp + "%"; }
  const b2 = (200 + ZERO - delay) / range * 100, b4 = (400 + ZERO - delay) / range * 100;
  if (Math.abs(x - XS) > 3) {
    const fs = (ech.firsts || []).filter((e) => e.a > 0.03).map((e) => e.d.toFixed(e.d < 20 ? 1 : 0) + " mm(" + Math.round(e.a * 100) + "%)");
    return "探头 x = " + x.toFixed(0) + " · 一次回波 " + (fs.length ? fs.join(" / ") : "无") + (fs.length >= 2 ? " · 能分开吗？" : "");
  }
  return "范围 " + range.toFixed(0) + " · 延迟 " + delay.toFixed(1) + " → B2 @ " + b2.toFixed(1) + " · B4 @ " + b4.toFixed(1) + (Math.abs(b2 - 50) < 0.6 && Math.abs(b4 - 100) < 0.6 ? " ✓ 1:4" : "");
}

function draw() {
  const m = MODES[mode];
  const ech = echoesFor(mode, x);
  $(m.probe).setAttribute("transform", translateAlong(P, [x - probeBase[m.probe], 0, 0]));
  const plug = [m.plug[0] + x - probeBase[m.probe], m.plug[1], m.plug[2]];
  drawCable(plug, m.axis);
  drawBeam(mode, x, ech.main.a, beamPhase);
  const r = mode === 3 ? range : 125, dl = mode === 3 ? delay : 0;
  drawTrace(mode, ech, r, dl);
  const val = mode === 3 ? "深度 " + (ech.main.d || 0).toFixed(1) + " · " + ((ech.main.s + ZERO - dl) / r * 100).toFixed(1) + "格" : "S " + ech.main.s.toFixed(1) + "  H " + Math.round(ech.main.a * 100) + "%";
  $("scr-val").textContent = val;
  const gate = $("gate");
  if (mode < 3) {
    const g0 = (ech.main.s - 7 - dl) / r, g1 = (ech.main.s + 7 - dl) / r, gz = GRID.z0 + (GRID.z1 - GRID.z0) * 0.3;
    const u0 = GRID.x0 + g0 * (GRID.x1 - GRID.x0), u1 = GRID.x0 + g1 * (GRID.x1 - GRID.x0);
    gate.setAttribute("d", "M" + u0.toFixed(2) + " " + (-gz - 1.2).toFixed(2) + "v1.2H" + u1.toFixed(2) + "v-1.2");
  } else gate.setAttribute("d", "");
  drawKnob(0, mode === 3 ? (range - 200) / 400 : 0.3);
  drawKnob(1, mode === 3 ? (delay + 10) / 20 : 0.5);
  rangeOut.textContent = range.toFixed(0) + " mm"; delayOut.textContent = delay.toFixed(1) + " mm";
  const t = text(mode, ech);
  if (readout.textContent !== t) readout.textContent = t;
}
let manual = false;
function update(dt, calm) {
  if (touring) { clock += dt; target = tourTarget(clock); }
  const ease = (cur, tgt, sec) => calm ? tgt : cur + (tgt - cur) * (1 - Math.exp(-dt / sec));
  x = ease(x, target, drag ? 0.06 : 0.55);
  range = ease(range, rangeT, 0.6); delay = ease(delay, delayT, 0.5);
  beamPhase = calm ? 0.5 : (beamPhase + dt / 1.8) % 1;
  noiseT += dt;
  draw();
}
function tick(now) {
  if (manual) { frame = 0; return; }
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  update(dt, calm);
  frame = visible && !calm ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (manual) return; if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } else if (still.matches) draw(); };
const steer = (next) => {
  touring = false; target = clamp(next, MODES[mode].reach[0], MODES[mode].reach[1]);
  resume(6000); run();
};
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
let drag = null;
const resume = (ms) => { clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, ms); };
stage.addEventListener("pointerdown", (event) => {
  if (event.button > 0) return;
  drag = { id: event.pointerId, x0: event.clientX, y0: event.clientY, start: x };
  try { stage.setPointerCapture(event.pointerId); } catch (e) {}
  touring = false; clearTimeout(idle); target = x;
  stage.setAttribute("data-drag", "");
});
stage.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const box = svg.getBoundingClientRect();
  const s = box.width / WIDTH;
  const ax = axisVector(P, [1, 0, 0]);
  const vx = ax[0] * s, vy = ax[1] * s;
  const w = ((event.clientX - drag.x0) * vx + (event.clientY - drag.y0) * vy) / (vx * vx + vy * vy);
  target = clamp(drag.start + w, MODES[mode].reach[0], MODES[mode].reach[1]);
  run();
});
const endDrag = (event) => { if (!drag || event.pointerId !== drag.id) return; drag = null; stage.removeAttribute("data-drag"); resume(6000); };
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);
stage.addEventListener("keydown", (event) => {
  if (/^[1-4]$/.test(event.key)) { setMode(Number(event.key) - 1, true); return; }
  let d = 0;
  if (event.key === "ArrowRight") d = 1; else if (event.key === "ArrowLeft") d = -1; else return;
  event.preventDefault();
  steer(target + d);
});
const knobInput = () => { touring = false; rangeT = Number(rangeIn.value); delayT = Number(delayIn.value); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 8000); run(); };
rangeIn.addEventListener("input", knobInput); delayIn.addEventListener("input", knobInput);
function annoSvg(items) {
  const out = [];
  const P2 = (p) => at(p);
  const f = (v) => v.toFixed(2);
  for (const it of items) {
    const pr = Math.max(0, Math.min(1, it.p ?? 1));
    if (pr <= 0) continue;
    if (it.k === "line" || it.k === "dim") {
      const pts = (it.k === "dim" ? [it.a, it.b] : it.pts).map(P2);
      // partial polyline by screen length
      let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      let left = total * pr; const drawn = [pts[0]];
      for (let i = 1; i < pts.length && left > 0; i++) {
        const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        const u = Math.min(1, left / seg); drawn.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]); left -= seg;
      }
      out.push('<path class="anno-l' + (it.dash ? ' anno-dash' : '') + (it.thin ? ' anno-thin' : '') + '" d="M' + drawn.map((q) => f(q[0]) + ' ' + f(q[1])).join('L') + '"/>');
      if (it.k === "dim") {
        const [a, b] = pts; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L * 2.2, ny = dx / L * 2.2;
        const tick = (q) => 'M' + f(q[0] - nx) + ' ' + f(q[1] - ny) + 'L' + f(q[0] + nx) + ' ' + f(q[1] + ny);
        out.push('<path class="anno-l" d="' + tick(a) + (pr >= 1 ? tick(b) : '') + '"/>');
      }
    } else if (it.k === "dot") {
      const q = P2(it.at); out.push('<circle class="anno-dot" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + (1.4 * pr).toFixed(2) + '"/>');
    }
    if (it.label && pr > 0.55) {
      const base = it.k === "dim" ? P2([(it.a[0] + it.b[0]) / 2, (it.a[1] + it.b[1]) / 2, (it.a[2] + it.b[2]) / 2]) : P2(it.at || it.pts[it.pts.length - 1]);
      const o = it.lo || [0, -3];
      const op = Math.min(1, (pr - 0.55) / 0.3);
      out.push('<text class="anno-t" x="' + f(base[0] + o[0]) + '" y="' + f(base[1] + o[1]) + '" text-anchor="' + (it.anchor || "middle") + '" style="opacity:' + op.toFixed(2) + ';font-size:' + (it.size || 7) + 'px">' + it.label + '</text>');
    }
  }
  return out.join("");
}
window.__csk = {
  anno(items) { $("anno").innerHTML = annoSvg(items || []); },
  manual(on) { manual = on; if (on && frame) { cancelAnimationFrame(frame); frame = 0; } if (!on) run(); },
  advance(dt) { update(dt, false); },
  set(o) { if ("target" in o) target = o.target; if ("x" in o) x = o.x; if ("rangeT" in o) rangeT = o.rangeT; if ("delayT" in o) delayT = o.delayT; if ("touring" in o) { touring = o.touring; clock = 0; } },
  setMode, setView, get state() { return { mode, x, range, delay }; }, steer, stopTour: () => { touring = false; } };
setMode(0, false);
draw();
`;
}

const body = k.plateHtml({
  fig: "Fig 1",
  title: "CSK-IA 试块",
  hint: "按住拖动探头 · 1–4 切换功能",
  readout: "R100 回波 —",
  keys: [
    { mark: "lit", label: "声束与回波脉冲：回波最高时声束变实" },
    { mark: "raised", label: "CSK-ⅠA：20 mm 层到 R100，前面 5 mm 层只到 R50" },
    { mark: "flat", label: "探伤仪屏幕：A 型显示，横轴声程，纵轴波高" },
  ],
  caption:
    "试块按 NB/T 47013.3 图 13 尺寸建模（300×100×25，R100/R50 圆心在顶面 200 处，φ50 孔心距顶面 30，φ1.5 孔距底面 15）。演示用斜探头 2.5P 13×13 K2、前沿 12 mm；直探头零偏（保护膜 + 耦合层）设为 2.6 mm。波幅按「偏离声束轴越远越低」示意，不是声场计算。",
  body: `<div class="iso-stage" tabindex="0" role="application" aria-label="CSK-IA 试块演示：左右方向键移动探头，数字键 1 到 4 切换功能">${svg}</div>
<div class="csk-views" role="group" aria-label="视角">${VIEWS.map((v, i) => `<button class="csk-viewbtn" aria-pressed="${i === 0}">${v.name}</button>`).join("")}</div>
<div class="csk-tabs" role="tablist">${["① 入射点", "② 前沿长度", "③ K 值", "④ 直探头"].map((t, i) => `<button class="csk-tab" role="tab" aria-selected="${i === 0}">${t}</button>`).join("")}</div>
<div class="csk-knobs"><label>范围 <input id="csk-range" type="range" min="200" max="600" step="5" value="300"><output id="csk-range-v">300 mm</output></label><label>延迟 <input id="csk-delay" type="range" min="-10" max="10" step="0.1" value="0"><output id="csk-delay-v">0.0 mm</output></label></div>
<p class="csk-steps"></p>`,
});

let html = k.pageHtml({ title: "CSK-IA 试块", theme, body: `<style>${CSS}</style>` + body, script: kitScript() + live, width: 760 });
html = html.replace('<html lang="en">', '<html lang="zh-CN">');
const name = theme === "dark" ? "csk-ia-dark.html" : "csk-ia.html";
// ---- artifact page: theme follows the viewer ----
{
  const KIT_DARK = k.ISO_CSS.match(/\.iso\{([^}]*)\}/)[1];
  const KIT_LIGHT = k.ISO_CSS.match(/\.iso\[data-theme="light"\]\{([^}]*)\}/)[1];
  const kitCss = k.ISO_CSS.replace(/\.iso\[data-theme="light"\]\{[^}]*\}/, "");
  const myCss = CSS.replace(/\.iso\{[^}]*\}\n\.iso\[data-theme="dark"\]\{[^}]*\}/, "");
  const art = `<title>CSK-IA 试块</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${kitCss}
.iso{${KIT_LIGHT};${CSK_LIGHT}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .iso{${KIT_DARK};${CSK_DARK}}}
:root[data-theme="dark"] .iso{${KIT_DARK};${CSK_DARK}}
:root{--pg:#f2f2ef}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--pg:#0b0b0b;color-scheme:dark}}
:root[data-theme="dark"]{--pg:#0b0b0b;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--pg);color:var(--anatomy-text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:24px 48px}
main.iso{background:var(--pg);width:min(760px,100%);margin:0 auto}
.iso-figure{margin:0}
.csk-tab:focus-visible,.iso-stage:focus-visible{outline:2px solid var(--anatomy-hi);outline-offset:3px}
${myCss}
</style>
<main class="iso">${body}</main>
<script type="module">${(kitScript() + live).replace(/<\/(script)/gi, "<\\/$1")}</script>`;
  if (theme === "light") writeFileSync(join(HERE, LANG_EN ? "csk-ia-artifact-en.html" : "csk-ia-artifact.html"), LANG_EN ? toEn(art) : art);
}
if (LANG_EN) html = toEn(html);
{
  // ---- 1920x1080 video page ----
  P = VIEW_PS[0];
  const fx = (p) => { const s = k.iso(p, P); return [+(s[0] / WIDTH).toFixed(4), +(s[1] / HEIGHT).toFixed(4)]; };
  const FOCUS = {
    screen: fx([(SCR.x0 + SCR.x1) / 2, DET_FRONT, (SCR.z0 + SCR.z1) / 2]),
    probe: fx([200, PY, 110]),
    hole: fx([60, BY2, 80]),
    block: fx([150, BY2, 55]),
    arc: fx([250, BY2, 60]),
    mid: fx([60, 0, 90]),
  };
  const VCSS = `
html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:var(--anatomy-card)}
#vf{position:relative;width:1920px;height:1080px;overflow:hidden;background:var(--anatomy-card);font-family:Inter,"Noto Sans CJK SC",ui-sans-serif,system-ui,sans-serif}
.v-cam{position:absolute;left:0;top:0;width:1720px;transform-origin:0 0}
.v-cam .iso-stage{overflow:visible}
.v-head{position:absolute;left:52px;top:36px;padding:16px 24px 18px;border-radius:14px;background:color-mix(in srgb,var(--anatomy-card) 90%,transparent);z-index:3;display:flex;flex-direction:column;gap:12px}
.v-head .v-brand,.v-head .v-sec{position:static}
.v-read{background:color-mix(in srgb,var(--anatomy-card) 90%,transparent);padding:12px 18px;border-radius:12px}
.v-brand{position:absolute;left:72px;top:54px;font:500 20px/1 ui-monospace,"DejaVu Sans Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--anatomy-muted);z-index:3}
.v-sec{position:absolute;left:72px;top:88px;font:600 46px/1.15 Inter,"Noto Sans CJK SC",sans-serif;color:var(--anatomy-strong);z-index:3;letter-spacing:-.01em}
.v-read{position:absolute;right:72px;top:54px;max-width:860px;text-align:right;font:500 24px/1.35 ui-monospace,"DejaVu Sans Mono",monospace;color:var(--anatomy-text);z-index:3;font-variant-numeric:tabular-nums}
.v-sub{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);max-width:1500px;padding:18px 34px;border-radius:14px;background:color-mix(in srgb,var(--anatomy-card) 88%,transparent);box-shadow:0 0 0 1px var(--anatomy-faint);font:500 36px/1.35 Inter,"Noto Sans CJK SC",sans-serif;color:var(--anatomy-strong);text-align:center;z-index:3}
.v-sub b{font-weight:700}
.v-card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:color-mix(in srgb,var(--anatomy-card) 92%,transparent);z-index:5;text-align:center}
.v-card h1{margin:0;font:700 84px/1.05 Inter,"Noto Sans CJK SC",sans-serif;letter-spacing:-.02em;color:var(--anatomy-strong)}
.v-card p{margin:0;font:400 36px/1.4 Inter,"Noto Sans CJK SC",sans-serif;color:var(--anatomy-text);max-width:1300px}
.v-card small{font:500 22px/1 ui-monospace,"DejaVu Sans Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--anatomy-muted)}
.v-calc{position:absolute;right:72px;top:118px;z-index:3;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.v-calc div{font:600 34px/1.25 Inter,"Noto Sans CJK SC",sans-serif;color:var(--anatomy-strong);background:color-mix(in srgb,var(--anatomy-card) 92%,transparent);padding:4px 14px;border-radius:10px;font-variant-numeric:tabular-nums}
.v-calc em{font-style:normal;color:#C15F3C}
.v-calc .res{font-size:44px;color:#fff;background:#D97757;padding:8px 20px}
.v-calc .res em{color:#fff}
.csk-swap{transition:none!important}.csk-in{animation:none!important}
.v-hidden{display:none}
`;
  const vbody = `<div id="vf">
<div class="v-head"><div class="v-brand">${LANG_EN ? "Ultrasonic testing · calibration" : "超声检测 · 仪器校准"}</div>
<div class="v-sec" id="vsec"></div></div>
<div class="v-read" data-readout></div>
<div class="v-cam" id="vcam"><div class="iso-stage">${svg}</div></div>
<div class="v-calc" id="vcalc"></div>
<div class="v-sub" id="vsub" style="opacity:0"></div>
<div class="v-card" id="vcard" style="opacity:0"></div>
<div class="v-hidden">
<div class="csk-views">${VIEWS.map((v, i) => `<button class="csk-viewbtn" aria-pressed="${i === 0}">${v.name}</button>`).join("")}</div>
<div class="csk-tabs">${[0, 1, 2, 3].map((i) => `<button class="csk-tab" aria-selected="${i === 0}">${i}</button>`).join("")}</div>
<div class="csk-knobs"><input id="csk-range" type="range" min="200" max="600" step="5" value="300"><output id="csk-range-v"></output><input id="csk-delay" type="range" min="-10" max="10" step="0.1" value="0"><output id="csk-delay-v"></output></div>
<p class="csk-steps"></p></div>
</div>`;
  const vhtml = (LANG_EN ? toEn : (x) => x)(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>CSK-IA video</title><style>${k.ISO_CSS}${CSS}${VCSS}</style></head><body class="iso" data-theme="light">${vbody}<script>window.__FOCUS=${JSON.stringify(FOCUS)};</script><script type="module">${(kitScript() + live).replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`);
  writeFileSync(join(HERE, LANG_EN ? "video.html" : "video-zh.html"), vhtml);
}
const outName = LANG_EN ? name.replace(".html", "-en.html") : name;
writeFileSync(join(HERE, outName), html);
console.log("wrote", outName, (html.length / 1024).toFixed(0) + " KB");
