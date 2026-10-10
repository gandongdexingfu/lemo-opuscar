// chars.js — 角色與共用塗鴉元件（麻雀、袋子、風、雲、蒸汽、珍珠、星星、色塊）
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = innerWidth, H = innerHeight; cv.width = W; cv.height = H;
const SC = W / 1080;
const MODE = new URLSearchParams(location.search).get('mode') || 'film';
const { pen, wash, write, ease, prog, lerp, clamp, xf, path, ellipse, noise1, hash } = D;
const PAPER = '#F2EBDD';
const fillPoly = (pts, col, a = 1) => { ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * (D.ga ?? 1); ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore(); };
// 兩條路徑按弧長各取 N 點，再逐點混合（翅膀收↔舉）
const resN = (pts, N = 40) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const o = []; let j = 0; for (let k = 0; k <= N; k++) { const d = L[L.length - 1] * k / N; while (j < L.length - 2 && L[j + 1] < d) j++; const f = (d - L[j]) / ((L[j + 1] - L[j]) || 1); o.push([lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)]); } return o; };
const blendPts = (a, b, k) => { const A = resN(a), B = resN(b); return A.map((p, i) => [lerp(p[0], B[i][0], k), lerp(p[1], B[i][1], k)]); };
// —— 角色：麻雀（面向右，原點在身體中心，腳在 y≈+30） ——
const SP = {
  body: path('M 30 -14 C 31 -38 6 -44 -2 -30 C -10 -20 -28 -20 -38 -6 L -54 -13 L -46 4 C -40 24 18 30 30 4 C 33 -2 32 -9 30 -14'),
  back: path('M 30 -14 C 31 -38 6 -44 -2 -30 C -10 -20 -28 -20 -38 -6 L -54 -13 L -46 4 C -30 9 4 7 30 -3 L 30 -14'),
  cap: path('M 28 -23 C 24 -41 4 -43 -3 -30 C 6 -31 18 -29 28 -23'),
  beakU: path('M 30 -18 L 43 -13 L 30 -11'), beakL: path('M 30 -11 L 40 -10 L 30 -7'),
  wing: path('M -24 -7 C -12 -18 9 -12 8 0 C 2 11 -14 10 -27 2'),
  wingUp: path('M 6 -10 C 2 -40 -26 -58 -44 -50 C -38 -44 -36 -38 -38 -32 C -30 -30 -24 -24 -24 -18 C -14 -18 -4 -14 0 -6'),
  sc: [path('M -24 2 C -22 6 -18 6 -17 3'), path('M -18 5 C -15 9 -11 8 -10 5'), path('M -11 6 C -8 10 -4 9 -3 6')],   // 翅尖羽毛
  tuft: [path('M 4 -40 C 3 -50 10 -52 10 -44'), path('M 10 -42 C 13 -50 19 -48 15 -41')],                              // 頭頂呆毛
  tailF: [path('M -48 -8 L -41 -5'), path('M -46 -1 L -40 -1')],
  brow: path('M 13 -32 L 23 -30'),
};
function sparrow(t, x, y, s, o = {}) {
  const boil = Math.floor(t * 12), p = o.p ?? 1, flip = o.flip ? -1 : 1;
  // 呼吸：身體一縮一放；跳躍時的壓扁拉長疊在上面
  const breath = (o.still ? 0 : .035 * Math.sin(t * 5.2)), sq = (o.sq ?? 0) - breath;
  const sx = s * (1 + sq) * flip, sy = s * (1 - sq);
  const cr = Math.cos(o.rot || 0), sr = Math.sin(o.rot || 0);
  const T = pts => pts.map(([u, v]) => { const X = u * sx, Y = (v - 30) * sy + 30 * s - (o.rot ? 0 : 0); return o.rot ? [x + X * cr - (Y - 0) * sr, y + X * sr + Y * cr] : [x + X, y + Y]; });    // 以腳為軸；rot 時繞身體中心轉
  const rot = (pts, ang, cx, cy) => pts.map(([u, v]) => { const c = Math.cos(ang), si = Math.sin(ang), du = u - cx, dv = v - cy; return [cx + du * c - dv * si, cy + du * si + dv * c]; });
  // 頭：抬頭＋閒置時左右張望的小點頭
  const look = (o.look ?? 0) + (o.still ? 0 : .07 * Math.sin(t * 2.3) + .05 * Math.sin(t * 7.1) * (Math.sin(t * 1.3) > .6 ? 1 : 0));
  const head = pts => rot(pts, look, 4, -10);
  // 尾巴：每 1.3 秒甩一下
  const fl = (t * .77) % 1, tailAng = (o.tail ?? 0) + (o.still ? 0 : -.38 * Math.exp(-fl * 9) * Math.sin(fl * 40));
  const tail = pts => pts.map(([u, v]) => u < -36 ? rot([[u, v]], tailAng, -37, -4)[0] : [u, v]);
  const flap = o.flap ?? 0, wingPts = blendPts(SP.wing, SP.wingUp, flap);
  const seg = (k0, k1) => clamp((p - k0) / (k1 - k0));
  const W2 = 2.4 + s * .45, expr = o.expr || '';
  const beakOpen = expr === 'surprise' ? .5 : expr === 'shout' ? .7 : 0;
  const beakL = rot(SP.beakL, beakOpen, 30, -11);
  // 不透明的紙底（疊在照片上時不會透出去）
  if (p > .3) { fillPoly(T(tail(head(SP.body))), PAPER, clamp((p - .3) / .3)); if (flap > .3) fillPoly(T(wingPts), PAPER, clamp((p - .3) / .3)); }
 // 淡彩
  if (p > .55) { const a = clamp((p - .55) / .45);
    wash(ctx, T(tail(head(SP.back))), '#c08a58', { alpha: .5 * a, seed: 21, boil, off: [2, 2.5] });
    wash(ctx, T(head(SP.cap)), '#8c5434', { alpha: .55 * a, seed: 22, boil });
    wash(ctx, T(head(ellipse(19, -11, 5.5, 4, 0, 6.3, 16))), '#e98b8b', { alpha: (expr === 'happy' ? .75 : .5) * a, seed: 23, boil, off: [0, 0] });
    wash(ctx, T(wingPts), '#9b6a44', { alpha: .45 * a, seed: 24, boil });
    wash(ctx, T(head(SP.beakU)), '#e9a23b', { alpha: .7 * a, seed: 25, boil, off: [0, 0] });
    wash(ctx, T(head(beakL)), '#e9a23b', { alpha: .7 * a, seed: 26, boil, off: [0, 0] });
  }
  pen(ctx, T(tail(head(SP.body))), { w: W2, p: seg(0, .4), seed: 31, boil, over: 3 });
  pen(ctx, T(head(SP.beakU)), { w: W2 * .85, p: seg(.25, .4), seed: 32, boil, over: 1 });
  pen(ctx, T(head(beakL)), { w: W2 * .85, p: seg(.25, .4), seed: 38, boil, over: 1 });
  SP.tuft.forEach((f, i) => pen(ctx, T(head(f)), { w: W2 * .75, p: seg(.3, .45), seed: 50 + i, boil, over: 1 }));
  SP.tailF.forEach((f, i) => pen(ctx, T(tail(f)), { w: W2 * .7, p: seg(.4, .5), seed: 52 + i, boil, over: 1 }));
  pen(ctx, T(wingPts), { w: W2 * .9, p: seg(.35, .55), seed: 33, boil });
  if (flap < .25) SP.sc.forEach((f, i) => pen(ctx, T(f), { w: W2 * .7, p: seg(.5, .6), seed: 34 + i * 7, boil, over: 1 }));
  const legLen = o.legs ?? 0, kick = legLen * Math.sin(t * 14) * 3;
  const lg = [[[-5, 22], [-7 - kick, 28 + 6 * legLen], [-12 - kick, 31 + 6 * legLen]], [[6, 22], [6 + kick, 28 + 6 * legLen], [1 + kick, 31 + 6 * legLen]]];
  lg.forEach((l, i) => pen(ctx, T(l), { w: W2 * .8, p: seg(.55, .65), seed: 36 + i, boil, over: 1 }));
  // 眼睛：一般／眨眼／開心 ^ ／驚訝（變大）
  if (p > .45) { const [ex, ey] = T(head([[18, -24]]))[0];
    const autoBlink = !o.still && ((t + 0.7) % 2.6) < .09;
    if (expr === 'happy') pen(ctx, T(head(ellipse(18, -21, 4.5, 4, Math.PI * 1.1, Math.PI * 1.9, 8))), { w: W2 * .8, seed: 57, boil, over: 0 });
    else if (expr === 'dizzy') { const sp = []; for (let i = 0; i <= 24; i++) { const a2 = i / 24 * Math.PI * 4 + t * 8, r = 1 + i / 24 * 5.5; sp.push([18 + Math.cos(a2) * r, -24 + Math.sin(a2) * r]); } pen(ctx, T(head(sp)), { w: W2 * .6, seed: 59, boil, over: 0, gap: 0 });
      for (let i = 0; i < 3; i++) { const a2 = t * 5 + i * 2.1, [qx, qy] = T(head([[4 + Math.cos(a2) * 34, -56 + Math.sin(a2) * 9]]))[0]; star4(t, qx, qy, 6 * s, 64 + i, 1); } }
    else if (expr !== 'dizzy') { const big = expr === 'surprise' ? 1.35 : 1, bl = (o.blink || autoBlink) ? .2 : 1;
      ctx.save(); ctx.fillStyle = D.INK; ctx.beginPath(); ctx.ellipse(ex, ey, 3 * s * big, 3.3 * s * big * bl, 0, 0, 7); ctx.fill();
      if (bl === 1) { ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(ex + 1 * s * flip, ey - 1.2 * s, .95 * s * big, 0, 7); ctx.fill(); } ctx.restore(); }
    if (expr === 'determined') pen(ctx, T(head(SP.brow)), { w: W2 * .8, seed: 58, boil, over: 1 });
    // 驚訝的「！」與開心的小星星
    if (expr === 'surprise') { const [qx, qy] = T(head([[30, -62]]))[0]; pen(ctx, [[qx, qy - 14 * s], [qx + 1, qy]], { w: W2, seed: 59, boil, over: 0 }); ctx.save(); ctx.fillStyle = D.INK; ctx.beginPath(); ctx.arc(qx + 1, qy + 6 * s, 1.6 * s, 0, 7); ctx.fill(); ctx.restore(); }
    if (expr === 'happy') [[-6, -56], [36, -48]].forEach(([u, v], i) => { const [qx, qy] = T(head([[u, v]]))[0], r = 5 * s * (.8 + .3 * Math.sin(t * 9 + i));
      pen(ctx, [[qx - r, qy], [qx + r, qy]], { w: 2.2, seed: 60 + i, boil, over: 0 }); pen(ctx, [[qx, qy - r], [qx, qy + r]], { w: 2.2, seed: 62 + i, boil, over: 0 }); });
  }
}

// —— 紅白塑膠袋（原點在袋子中心） ——
const BAG = {
  out: path('M -26 -18 C -29 8 -31 28 -24 38 C -8 42 8 42 24 38 C 31 28 29 8 26 -18'),
  top: path('M -26 -18 C -14 -14 14 -14 26 -18'),
  hL: path('M -25 -17 C -31 -44 -6 -48 -8 -16'), hR: path('M 8 -16 C 7 -48 31 -44 25 -17'),
  wr: path('M -6 6 C -2 14 2 18 0 28'),
};
const stripe = (x0, x1) => [[x0, -16], [x1, -16], [x1 + 2, 38], [x0 - 1, 38]];
function bag(t, x, y, s, o = {}) {
  const boil = Math.floor(t * 12), fl = o.flutter ?? 1, p = o.p ?? 1;
  const rot = noise1(t * 2.2, 5) * .35 * fl + (o.rot ?? 0), sqx = 1 + noise1(t * 3.1, 6) * .12 * fl, sqy = 1 - noise1(t * 3.1, 6) * .1 * fl;
  const T = pts => xf(pts.map(([u, v]) => [u * sqx, v * sqy]), x, y, s, rot);
  fillPoly(T(BAG.out.concat([[24, -18]])), '#faf6ee', p);
  [[-19, -12], [-3, 4], [13, 20]].forEach(([a, b], i) => wash(ctx, T(stripe(a, b)), '#d8463c', { alpha: .55, seed: 40 + i, boil, off: [1.5, 1] }));
  pen(ctx, T(BAG.out), { w: 2.6, p, seed: 45, boil }); pen(ctx, T(BAG.top), { w: 2.4, p, seed: 46, boil });
  pen(ctx, T(BAG.hL), { w: 2.4, p, seed: 47, boil }); pen(ctx, T(BAG.hR), { w: 2.4, p, seed: 48, boil }); pen(ctx, T(BAG.wr), { w: 1.8, p, seed: 49, boil, over: 1 });
}

// —— 風線（從頭畫出、從尾擦掉） ——
function wind(t, t0, x, y, len, seed, dir = 1) {
  const k = (t - t0) / .9; if (k < 0 || k > 1.4) return;
  const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([x + u * len * dir, y + Math.sin(u * 5 + seed) * 8 - u * 10]); }
  const n = pts.length; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.3; pts.push([pts[n - 1][0] + Math.cos(a) * 11 * dir - 11 * dir, pts[n - 1][1] - 11 + Math.sin(a) * 11 + 11]); }
  pen(ctx, pts, { w: 2.2, p: clamp(k), from: clamp(k - .45), seed, boil: Math.floor(t * 12), gap: 0 });
}

// —— 雲（扇貝邊） ——
function cloud(t, cx, cy, w, h, p, o = {}) {
  const boil = Math.floor(t * 12), pts = [];
  for (let i = 0; i <= 90; i++) { const a = Math.PI * .55 + i / 90 * Math.PI * 2.08; const bottom = Math.sin(a) > .35;
    const r = bottom ? 1 : 1 + .16 * Math.abs(Math.sin(a * 3.5)); pts.push([cx + Math.cos(a) * w / 2 * r, cy + Math.sin(a) * h / 2 * (bottom ? .75 : r)]); }
  if (p > .2) fillPoly(pts, PAPER, clamp((p - .2) / .3));
  if (p > .4) wash(ctx, pts, '#b9c7d6', { alpha: .45 * clamp((p - .4) / .6), seed: 60, boil, bloom: { x: cx, y: cy, r: w * .7 * ease.out(clamp((p - .4) / .6)) } });
  pen(ctx, pts, { w: 2.6, p: clamp(p / .6), seed: 61, boil });
  if (p > .7) { const k = clamp((p - .7) / .3), f = w / 180;   // 小臉：瞇眼笑
    pen(ctx, ellipse(cx - 18 * f, cy + 4 * f, 6 * f, 4 * f, Math.PI, Math.PI * 2, 10), { w: 2, p: k, seed: 62, boil, over: 1 });
    pen(ctx, ellipse(cx + 14 * f, cy + 4 * f, 6 * f, 4 * f, Math.PI, Math.PI * 2, 10), { w: 2, p: k, seed: 63, boil, over: 1 });
    pen(ctx, ellipse(cx - 2 * f, cy + 12 * f, 6 * f, 4 * f, 0, Math.PI, 10), { w: 2, p: k, seed: 64, boil, over: 1 }); }
}

// —— 蒸汽線 ——
function steam(t, x, y, t0, o = {}) {
  const boil = Math.floor(t * 12);
  [-14, 0, 14].forEach((dx, j) => { const k = (t - t0 - j * .12) / .7; if (k <= 0) return; const pts = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([x + dx + Math.sin(u * 9 + j * 2 + t * 3) * 7 * u, y - u * (o.len ?? 190)]); }
    pen(ctx, pts, { w: 2.2, p: clamp(k), from: clamp(o.erase ? (t - o.erase) / .5 : 0), seed: 70 + j, boil, gap: 0 }); });
}

// —— 珍珠氣球 ——
function pearl(t, x, y, r, seed, o = {}) {
  const boil = Math.floor(t * 12);
  wash(ctx, ellipse(x, y, r, r * 1.06, 0, 6.3, 22), '#4b2c1a', { alpha: .78, seed, boil, off: [1.5, 1.5], rough: 1.2 });
  pen(ctx, ellipse(x, y, r, r * 1.06, -1.2, 5.4, 26), { w: 2.4, seed: seed + 1, boil, over: 2 });
  ctx.save(); ctx.strokeStyle = PAPER; ctx.globalAlpha = .9; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x - r * .1, y - r * .1, r * .55, 3.6, 4.5); ctx.stroke(); ctx.restore();
  if (o.knot) pen(ctx, [[x - 3, y + r + 1], [x, y + r + 5], [x + 3, y + r + 1]], { w: 2, seed: seed + 2, boil, over: 0 });
}

// —— 動線小記號 ——
const ticks = (t, x, y, r, seed) => { const boil = Math.floor(t * 12); for (let i = 0; i < 3; i++) { const a = -2.4 + i * .5; pen(ctx, [[x + Math.cos(a) * r, y + Math.sin(a) * r], [x + Math.cos(a) * (r + 12), y + Math.sin(a) * (r + 12)]], { w: 2, seed: seed + i, boil, over: 0 }); } };

function blob(x, y, rx, ry, col, seed, a) {
  const pts = []; for (let i = 0; i < 70; i++) { const ang = i / 70 * Math.PI * 2, r = 1 + .08 * noise1(i * .25, seed) + .04 * noise1(i * 1.1, seed + 1); pts.push([x + Math.cos(ang) * rx * r, y + Math.sin(ang) * ry * r]); }
  wash(ctx, pts, col, { alpha: a, seed, boil: 0, rough: 10, off: [0, 0] });
}
const star4 = (t, x, y, r, seed, p = 1) => { const boil = Math.floor(t * 12), k = r * (.75 + .25 * Math.sin(t * 7 + seed));
  pen(ctx, [[x - k, y], [x - k * .2, y - k * .2], [x, y - k], [x + k * .2, y - k * .2], [x + k, y], [x + k * .2, y + k * .2], [x, y + k], [x - k * .2, y + k * .2], [x - k, y]], { w: 2.2, seed, boil, over: 0, p, gap: 0 }); };

