// 共用幾何工具：在 Anatomy kit 之上，補藍圖片需要的東西（框形零件、側面圖形、尺寸線、草圖筆劃長度）
import * as k from "../../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../../vendor/anatomy/kit/lathe.mjs";
export { k, G };

export const plan = (x, y, w, d, r) => ({ x, y, w, d, r });
const f1 = (v) => (Math.round(v * 10) / 10).toString();
export const pathOf = (pts, closed = false) => pts.length ? "M" + pts.map((p) => f1(p[0]) + " " + f1(p[1])).join("L") + (closed ? "Z" : "") : "";

// 凸多邊形裁切（Sutherland–Hodgman），用於框形零件中間看穿的洞
function clip(subject, clipper) {
  const inside = (p, a, b) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
  const hit = (p, q, a, b) => {
    const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1];
    const A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1];
    const det = A1 * B2 - A2 * B1;
    return [(B2 * C1 - B1 * C2) / det, (A1 * C2 - A2 * C1) / det];
  };
  let out = subject;
  for (let i = 0; i < clipper.length; i++) {
    const a = clipper[i], b = clipper[(i + 1) % clipper.length];
    const input = out; out = [];
    if (!input.length) break;
    for (let j = 0; j < input.length; j++) {
      const p = input[j], q = input[(j + 1) % input.length];
      const pin = inside(p, a, b), qin = inside(q, a, b);
      if (qin) { if (!pin) out.push(hit(p, q, a, b)); out.push(q); }
      else if (pin) out.push(hit(p, q, a, b));
    }
  }
  return out;
}
const area = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const ccw = (pts) => (area(pts) < 0 ? pts.slice().reverse() : pts);

// 框形零件（邊框、前框）：外側實心、頂面挖洞、看得到遠側內壁，洞裡露出下面的東西或圖紙
export function frameSolid(outer, inner, z, h, P, steps = 10) {
  const out = k.slabOf(outer, z, h, P, steps);
  const ring = k.ringOf(inner, steps);
  const top = ccw(ring.map(([x, y]) => k.iso([x, y, z + h], P)));
  const bot = ccw(ring.map(([x, y]) => k.iso([x, y, z], P)));
  const see = ccw(clip(top, bot));                       // 從上往下看穿洞的部分
  const fill = out.fill + pathOf(see.slice().reverse(), true);
  const wall = pathOf(top, true) + pathOf(see.slice().reverse(), true);   // 遠側內壁
  const topFace = out.top + pathOf(top.slice().reverse(), true);
  // 內壁下緣只畫看得見的那段：洞的邊界上，不在頂面洞邊上的點
  const lowEdge = [];
  ring.forEach(([x, y]) => {
    const p = k.iso([x, y, z], P);
    const inTop = clip([p, [p[0] + 0.01, p[1]], [p[0], p[1] + 0.01]], top).length > 0;
    lowEdge.push(inTop ? p : null);
  });
  const runs = []; let cur = [];
  lowEdge.concat(lowEdge.slice(0, 1)).forEach((p) => { if (p) cur.push(p); else { if (cur.length > 1) runs.push(cur); cur = []; } });
  if (cur.length > 1) runs.push(cur);
  return {
    fill, top: topFace, shades: out.shades, crease: out.crease,
    outline: out.outline + pathOf(top, true),
    wall, lowEdge: runs.map((r) => pathOf(r)).join(""),
  };
}

// 側面（豎直面）上的平面圖形：face 'y' 表示 y=常數 的面，座標 (u=x, v=z)；face 'x' 表示 x=常數 的面 (u=y, v=z)
export function onSide(face, at, pts, P, closed = false) {
  return pathOf(pts.map(([u, v]) => k.iso(face === "y" ? [u, at, v] : [at, u, v], P)), closed);
}
export function roundRect2(u, v, w, h, r, n = 6) {
  const pts = [];
  const c = [[u + w - r, v + h - r, 0], [u + r, v + h - r, 1], [u + r, v + r, 2], [u + w - r, v + r, 3]];
  c.forEach(([cx, cy, q]) => { for (let i = 0; i <= n; i++) { const a = (q + i / n) * Math.PI / 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } });
  return pts;
}
export function circle2(cu, cv, r, n = 28) { return Array.from({ length: n }, (_, i) => [cu + r * Math.cos(i / n * 2 * Math.PI), cv + r * Math.sin(i / n * 2 * Math.PI)]); }

// 自訂輪廓（頂部圓角、底部直角等）
export function ringCustom(x0, y0, x1, y1, rTop, rBot, n = 10) {
  const pts = [];
  const arc = (cx, cy, r, a0) => { if (r <= 0) { pts.push([cx, cy]); return; } for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  arc(x0 + rTop, y0 + rTop, rTop, Math.PI);            // 左上
  arc(x1 - rTop, y0 + rTop, rTop, Math.PI * 1.5);      // 右上
  arc(x1 - rBot, y1 - rBot, rBot, 0);                  // 右下
  arc(x0 + rBot, y1 - rBot, rBot, Math.PI / 2);        // 左下
  return pts;
}

// 扁平軟排線：沿著頂面的折線，寬 w，轉角圓滑
export function ribbon(points, w, z, P, r = 4) {
  const pts = G.fillet(points.map(([x, y]) => [x, y, z]), r, 9);
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l * w / 2, ny = dx / l * w / 2;
    L.push([pts[i][0] + nx, pts[i][1] + ny]); R.push([pts[i][0] - nx, pts[i][1] - ny]);
  }
  const ring = L.concat(R.reverse());
  return { fill: k.onTop(ring, z, P, true), edges: k.onTop(L, z, P) + k.onTop(R.slice().reverse(), z, P), mid: k.onTop(pts.map((p) => [p[0], p[1]]), z, P) };
}

// 尺寸線（在一個平面上）：a、b 兩端點（3D），沿 off 方向偏移，延伸線＋箭頭
export function dimension(a, b, off, P, gap = 2, over = 3) {
  const add = (p, v, s) => [p[0] + v[0] * s, p[1] + v[1] * s, p[2] + v[2] * s];
  const L = Math.hypot(off[0], off[1], off[2]); const n = off.map((v) => v / L);
  const A = add(a, off, 1), B = add(b, off, 1);
  const ext = k.segment(add(a, n, gap), add(A, n, over), P) + k.segment(add(b, n, gap), add(B, n, over), P);
  const sa = k.iso(A, P), sb = k.iso(B, P);
  const dx = sb[0] - sa[0], dy = sb[1] - sa[1], l = Math.hypot(dx, dy); const ux = dx / l, uy = dy / l;
  const ah = 9, aw = 3.2;
  const head = (p, s) => pathOf([[p[0] + s * ux * ah - uy * aw, p[1] + s * uy * ah + ux * aw], p, [p[0] + s * ux * ah + uy * aw, p[1] + s * uy * ah - ux * aw]]);
  return { ext, line: pathOf([sa, sb]), heads: head(sa, 1) + head(sb, -1), mid: [(sa[0] + sb[0]) / 2, (sa[1] + sb[1]) / 2], angle: Math.atan2(dy, dx) * 180 / Math.PI };
}
