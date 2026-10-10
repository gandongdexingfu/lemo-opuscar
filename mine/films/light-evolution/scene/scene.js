// 光的演變 · 完整版（9:16，約 59 秒）
// 寫實照片（ChatGPT 生成，每代點燈／熄燈兩張）＋代碼：點燈曲線、光暈、推鏡、字卡、火柴搖曳、地球拉遠
(() => {
const W = 1080, H = 1920, MAIN = document.getElementById('c').getContext('2d'); let c = MAIN;
const { clamp, lerp, rng } = U, seg = (t, a, b) => clamp((t - a) / (b - a)), TAU = Math.PI * 2;
const SC = W / 941;
const n1 = x => { const i = Math.floor(x), f = x - i, h = k => rng(k * 9973 + 7)(); const u = f * f * (3 - 2 * f); return lerp(h(i), h(i + 1), u); };

// ---------- 時代 ----------
const ERAS = [
  { id: 'f01_fire', type: 'fire', src: [490, 880], col: [255, 140, 50], gr: 2.0, year: '約 40 萬年前', en: 'FIRE', zh: '火', kw: ['學會用火', '驅寒煮食', '圍火而居'] },
  { id: 'f02_roman', type: 'flame', src: [715, 955], col: [255, 165, 80], gr: .8, year: '公元 1 世紀', en: 'ROMAN OIL LAMP', zh: '陶土油燈', kw: ['橄欖油', '棉麻燈芯', '量產燈具'] },
  { id: 'f03_candle', type: 'flame', src: [470, 431], col: [255, 170, 80], gr: .9, year: '13 世紀', en: 'BEESWAX CANDLE', zh: '蜂蠟蠟燭', kw: ['蜂蠟', '清香少煙', '權貴專屬'] },
  { id: 'f04_argand', type: 'flame', src: [405, 612], col: [255, 185, 95], gr: 1.2, year: '1780', en: 'ARGAND LAMP', zh: '阿岡燈', kw: ['空心燈芯', '玻璃燈罩', '亮度倍增'] },
  { id: 'f05_gas', type: 'gas', src: [523, 601], col: [255, 170, 70], gr: 1.1, year: '1812', en: 'GAS LIGHT', zh: '煤氣燈', kw: ['煤氣管網', '城市街燈', '夜生活誕生'] },
  { egg: true, year: '1826', en: 'FRICTION MATCH', zh: '火柴', kw: ['一劃即燃'], col: [255, 170, 80] },
  { id: 'f06_kero', type: 'flame', src: [473, 725], col: [255, 170, 70], gr: 1.0, year: '1853', en: 'KEROSENE LAMP', zh: '煤油燈', kw: ['石油提煉', '玻璃燈罩', '夜晚變長'] },
  { id: 'f07_edison', type: 'bulb', src: [469, 568], col: [255, 150, 50], gr: 1.0, year: '1879', en: 'INCANDESCENT BULB', zh: '白熾燈泡', kw: ['碳化燈絲', '真空玻璃', '電點亮黑夜'] },
  { id: 'f08_neon', type: 'neon', src: [465, 715], col: [255, 55, 35], gr: 1.7, shift: 195, cardY: 1372, year: '1910', en: 'NEON LIGHT', zh: '霓虹燈', kw: ['惰性氣體', '彩色招牌', '不夜城'] },
  { id: 'f09_fluor', type: 'fluor', src: [471, 705], col: [190, 225, 255], gr: 1.5, year: '1938', en: 'FLUORESCENT LAMP', zh: '日光燈', kw: ['螢光塗層', '省電明亮', '辦公室時代'] },
  { id: 'f10_led', type: 'led', src: [469, 529], col: [215, 232, 255], gr: 1.2, year: '1996', en: 'WHITE LED', zh: '白光 LED', kw: ['藍光晶片', '螢光轉白', '節能長壽'] },
  { id: 'f11_smart', type: 'smart', src: [464, 640], col: [255, 205, 150], gr: 1.5, year: '今天', en: 'SMART LIGHTING', zh: '智慧照明', kw: ['LED 普及', '可調色溫', '一鍵控制'] },
];
const P = 6.5, EGG = 3.2, IG = .8, OFF = 5.5, OPEN = 3.0;
// 每段的開始時間
let tt = OPEN; ERAS.forEach(e => { e.start = tt; tt += e.egg ? EGG : P; });
const LAST = ERAS[ERAS.length - 1];
const T = { OUT0: LAST.start + 5.9 }; T.OUT1 = T.OUT0 + 4.5; T.END = T.OUT1 + 10.0;
const IMG = {};

// ---------- 版面 ----------
let SHIFT = 285; const AY = 640;
function place(zoom) { const w = 941 * SC * zoom, h = 1672 * SC * zoom, y = AY - (AY + SHIFT) * zoom; return { x: (W - w) / 2, y, w, h }; }
function cover(img, zoom) {
  const r = place(zoom); c.drawImage(img, r.x, r.y, r.w, r.h);
  const bot = r.y + r.h; if (bot < H) { const sh = (H - bot) / (SC * zoom); c.save(); c.translate(0, bot); c.scale(1, -1); c.drawImage(img, 0, 1672 - sh, 941, sh, r.x, -(H - bot), r.w, H - bot); c.restore(); }
}
function px(src, zoom) { const r = place(zoom); return [r.x + src[0] * SC * zoom, r.y + src[1] * SC * zoom]; }
function glow(e, k, zoom, col = e.col) {
  if (k <= 0) return;
  const [x, y] = px(e.src, zoom), g0 = e.gr || 1;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const [r, a] of [[90, .5], [260, .2], [620, .09]]) {
    const R = r * zoom * g0, g = c.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - R, y - R, 2 * R, 2 * R);
  }
  c.restore();
}

// ---------- 點燈／熄燈曲線 ----------
function level(e, u) {           // 回傳 {k 亮度, warm 0..1}
  let k = 0, warm = 1; const q = u - IG, f = 0.9 + 0.1 * (n1(u * 7 + e.start) - .5) * 2;
  if (q < 0) return { k: 0, warm };
  switch (e.type) {
    case 'fire': k = MO.cubicOut(seg(q, 0, 1.3)) * (0.82 + 0.18 * (n1(u * 9 + 3) - .5) * 2 + .06 * Math.sin(u * 23)); break;
    case 'flame': k = MO.cubicOut(seg(q, 0, .5)) * (0.7 + 0.3 * Math.abs(Math.sin(seg(q, 0, .5) * 20))) ** (q < .5 ? 1 : 0) * f; break;
    case 'gas': k = MO.backOut(seg(q, 0, .18), 2) * (0.95 + 0.05 * (n1(u * 14) - .5) * 2); break;
    case 'bulb': k = MO.cubicOut(seg(q, 0, .6)) * (q < .2 && Math.floor(u * 30) % 3 === 0 ? .4 : 1) * (0.98 + .02 * Math.sin(u * 60)); warm = seg(q, 0, .6); break;
    case 'neon': { const fl = q < .45 ? (rng(Math.floor(u * 20) + 11)() > .45 ? 1 : .15) : 1; k = fl * (0.96 + .04 * Math.sin(u * 90)); break; }
    case 'fluor': { const on = (q < .06) || (q > .28 && q < .33) || q > .55; k = on ? (q > .55 ? MO.cubicOut(seg(q, .55, .7)) * (0.97 + .03 * Math.sin(u * 100)) : .7) : 0.04; break; }
    case 'led': k = seg(q, 0, .04); break;
    case 'smart': k = MO.sineInOut(seg(q, 0, 1.4)); break;
  }
  // 熄滅（最後一代不熄，接地球）
  if (e !== LAST) {
    const o = u - OFF;
    if (o > 0) {
      if (e.type === 'fire' || e.type === 'flame') k *= (1 - MO.cubicIn(seg(o, 0, .75))) * (0.6 + 0.4 * n1(u * 24));
      else if (e.type === 'gas') k *= 1 - MO.cubicIn(seg(o, 0, .5));
      else if (e.type === 'bulb') k *= Math.exp(-o / .2);
      else if (e.type === 'smart') k *= 1 - MO.sineInOut(seg(o, 0, 1.0));
      else k *= o < .05 ? .5 : 0;
    }
  }
  return { k: Math.max(0, k), warm };
}

// ---------- 一代的畫面 ----------
function eraScene(i, u) {
  const e = ERAS[i], zoom = 1 + 0.05 * MO.sineInOut(clamp(u / P)); SHIFT = e.shift || 285;
  c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  cover(IMG[e.id + '_off'], zoom);
  const { k, warm } = level(e, u);
  if (k > 0) { c.globalAlpha = clamp(k); cover(IMG[e.id + '_lit'], zoom); c.globalAlpha = 1; }
  const col = e.type === 'bulb' ? [lerp(200, e.col[0], warm), lerp(40, e.col[1], warm), lerp(10, e.col[2], warm)] : e.col;
  glow(e, Math.min(1.2, k) * .9, zoom, col);
  // 未點亮時壓暗
  const dark = .5 * (1 - clamp(k));
  if (dark > 0) { c.fillStyle = `rgba(0,0,0,${dark})`; c.fillRect(0, 0, W, H); }
  return { zoom, k };
}

// ---------- 字卡（博物館說明牌）----------
const FONT = '"Noto Serif CJK TC"';
function card(e, t0, t1, t) {
  const out = 1 - MO.smooth(seg(t, t1 - .45, t1));
  if (t < t0 || out <= 0) return;
  const cx = W / 2, Y = e.cardY || 1345, gold = `rgb(${Math.min(255, e.col[0])},${Math.min(235, e.col[1] + 45)},${Math.min(215, e.col[2] + 70)})`;
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  const g = c.createLinearGradient(0, Y - 140, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.3, `rgba(0,0,0,${.68 * out})`); g.addColorStop(1, `rgba(0,0,0,${.85 * out})`);
  c.fillStyle = g; c.fillRect(0, Y - 140, W, H);
  const fade = (d, dur = .7) => MO.smooth(seg(t, t0 + d, t0 + d + dur)) * out;
  const q = MO.quintOut(seg(t, t0, t0 + 1.0)) * out;
  c.globalAlpha = .75 * out; c.fillStyle = gold;
  c.fillRect(cx - 34 - 150 * q, Y - 1, 150 * q, 1.5); c.fillRect(cx + 34, Y - 1, 150 * q, 1.5);
  c.save(); c.translate(cx, Y); c.rotate(Math.PI / 4); c.globalAlpha = q; c.strokeStyle = gold; c.lineWidth = 1.5; c.strokeRect(-7, -7, 14, 14); c.restore();
  // 年份：逐字浮現（中英混排按實際字寬排）
  c.font = `300 46px ${FONT}`; c.letterSpacing = '0px'; c.fillStyle = gold;
  const ys = [...e.year], gap = 14, ws = ys.map(ch => ch === ' ' ? 14 : c.measureText(ch).width + gap), tw = ws.reduce((a, b) => a + b, 0) - gap;
  let x = cx - tw / 2;
  ys.forEach((ch, i) => { const a = fade(.15 + i * .06, .6); c.globalAlpha = a; c.fillText(ch, x + (ws[i] - gap) / 2, Y - 58 + (1 - a) * 10); x += ws[i]; });
  // 中文大標
  c.font = `600 98px ${FONT}`;
  const toks = e.zh.match(/[A-Za-z0-9]+|[^\s]/g), gap2 = 24, tws = toks.map(tk => c.measureText(tk).width + gap2), tot = tws.reduce((a, b) => a + b, 0) - gap2;
  let xx = cx - tot / 2;
  toks.forEach((tk, i) => {
    const a = fade(.35 + i * .12, .8), w = tws[i] - gap2; if (a > 0) {
    c.globalAlpha = a; c.filter = `blur(${(1 - a) * 8}px)`; c.fillStyle = '#f5ecdc';
    c.shadowColor = `rgba(${e.col[0]},${e.col[1]},${e.col[2]},${.35 * a})`; c.shadowBlur = 30;
    c.fillText(tk, xx + w / 2, Y + 68 + (1 - a) * 14); }
    xx += tws[i];
  });
  c.filter = 'none'; c.shadowBlur = 0;
  c.globalAlpha = fade(.85) * .7; c.font = `300 22px ${FONT}`; c.letterSpacing = '9px'; c.fillStyle = '#e9dcc4'; c.fillText(e.en, cx + 4, Y + 140);
  c.globalAlpha = fade(1.05) * .85; c.font = `300 28px ${FONT}`; c.letterSpacing = '5px'; c.fillText(e.kw.join('　｜　'), cx, Y + 192);
  c.restore();
}
function quote(zh, en, t0, t1, t, y = 360, col = [255, 200, 120]) {
  const out = 1 - MO.smooth(seg(t, t1 - .6, t1)); if (t < t0 || out <= 0) return;
  c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
  const gg = c.createLinearGradient(0, 0, 0, y + 260); gg.addColorStop(0, `rgba(0,0,0,${.55 * out})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(0, 0, W, y + 260);
  const lines = zh.split('\n'), step = 80; let k = 0;
  c.font = `500 68px ${FONT}`;
  lines.forEach((ln, li) => { const chars = [...ln], x0 = W / 2 - (chars.length - 1) * step / 2;
    chars.forEach((ch, i) => {
      const d = (k++) * .07, a = MO.smooth(seg(t, t0 + d, t0 + d + .8)) * out; if (a <= 0) return;
      c.globalAlpha = a; c.filter = `blur(${(1 - a) * 6}px)`; c.fillStyle = '#f5ecdc';
      c.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},.45)`; c.shadowBlur = 28; c.fillText(ch, x0 + i * step, y + li * 96 + (1 - a) * 12);
    }); });
  c.filter = 'none'; c.shadowBlur = 0;
  const ye = y + (lines.length - 1) * 96, a2 = MO.smooth(seg(t, t0 + k * .07 + .2, t0 + k * .07 + 1.0)) * out;
  c.globalAlpha = a2 * .7; c.font = `300 22px ${FONT}`; c.letterSpacing = '8px'; c.fillStyle = '#e9dcc4'; c.fillText(en, W / 2 + 4, ye + 76);
  c.globalAlpha = a2 * .6; c.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; c.fillRect(W / 2 - 40 * a2, ye + 116, 80 * a2, 1.5);
  c.restore();
}

// ---------- 火柴（頭尾與彩蛋）：火柴棒不動，火焰分條變形搖曳 ----------
const SPR = {}, HEAD = [470, 700], MF = [481, 431];
function sprite(img, { y0 = -1e9, y1 = 1e9, fe = 40, th = 10, rng_ = 26, rad = null } = {}) {
  const k = document.createElement('canvas'); k.width = img.width; k.height = img.height; const g = k.getContext('2d');
  g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, k.width, k.height), p = d.data;
  for (let y = 0; y < k.height; y++) { const ym = clamp((y - y0) / fe + .5) * clamp((y1 - y) / fe + .5);
    for (let x = 0; x < k.width; x++) { const i = (y * k.width + x) * 4, m = Math.max(p[i], p[i + 1], p[i + 2]); const rm = rad ? clamp((rad[2] - Math.hypot(x - rad[0], y - rad[1])) / rad[3]) : 1; p[i + 3] = 255 * clamp((m - th) / rng_) * ym * rm; } }
  g.putImageData(d, 0, 0); return k;
}
function drawAt(spr, pivot, Pt, sc, alpha) { if (alpha <= 0) return; c.save(); c.globalAlpha = alpha; c.translate(Pt[0], Pt[1]); c.scale(sc, sc); c.drawImage(spr, -pivot[0], -pivot[1]); c.restore(); }
const FC = document.createElement('canvas'); FC.width = W; FC.height = H; const fg = FC.getContext('2d');
function flameWarp(t, k, grow, HP, sc) {
  const spr = SPR.flameOnly, top = 40, bot = HEAD[1] + 60, strip = 3;
  const sway = yy => { const h = clamp((HEAD[1] - yy) / (HEAD[1] - top)), amp = 26 * Math.pow(h, 1.6);
    return amp * (0.6 * Math.sin(t * 5.1 + yy * 0.012) + 0.4 * Math.sin(t * 8.7 + 1.3 + yy * 0.02) + 0.5 * (n1(t * 3 + yy * .003) - .5)); };
  const sy = (0.93 + 0.07 * n1(t * 6.3) + 0.04 * Math.sin(t * 11)) * grow;
  fg.clearRect(0, 0, W, H);
  for (let yy = top; yy < bot; yy += strip) { const dx = sway(yy + strip / 2) * grow; fg.drawImage(spr, 0, yy, spr.width, strip, HP[0] + (dx - HEAD[0]) * sc, HP[1] + (yy - HEAD[1]) * sy * sc, spr.width * sc, strip * sy * sc + .6); }
  c.save(); c.globalAlpha = k; c.globalCompositeOperation = 'lighter'; c.drawImage(FC, 0, 0); c.restore();
}
// 火焰中心對齊到 A；ts 點燃時刻；tout 吹熄時刻（可無）
function match(t, ts, A, z, tout = 1e9) {
  const sc = SC * z, HP = [A[0] + (HEAD[0] - MF[0]) * sc, A[1] + (HEAD[1] - MF[1]) * sc];
  const q = t - ts, o = t - tout;
  const live = o > 0 ? 1 - MO.cubicIn(seg(o, 0, .35)) : 1;
  const grow = q < 0 ? 0 : clamp(MO.backOut(clamp(q / .35), 1.6)) * (o > 0 ? 1 - .5 * seg(o, 0, .35) : 1);
  const flash = q < 0 ? 0 : Math.exp(-q / .12);
  const k = (q < 0 ? 0 : clamp(q / .06) * (1 + .5 * flash)) * live;
  const fl = .9 + .1 * (n1(t * 7) - .5) * 2;
  drawAt(SPR.offStick, HEAD, HP, sc, .55 * (1 - clamp(q / .2)));
  drawAt(SPR.offHead, HEAD, HP, sc, .55 * (1 - clamp(q / .15)));
  drawAt(SPR.litStick, HEAD, HP, sc, clamp(q / .2) * (.5 + .5 * live) * (.85 + .15 * fl));
  if (q >= 0) {
    drawAt(SPR.headLit, HEAD, HP, sc, clamp(q / .1));
    if (k > 0) flameWarp(t, k * fl, grow, HP, sc);
    const F = [HP[0], HP[1] - 170 * grow * z];
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const [r, a] of [[70, .5], [240, .22], [650, .09]]) { const R = r * z * (1 + flash * .6), g = c.createRadialGradient(F[0], F[1], 0, F[0], F[1], R);
      g.addColorStop(0, `rgba(255,${175 + 50 * flash | 0},${85 + 90 * flash | 0},${a * k * fl})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(F[0] - R, F[1] - R, 2 * R, 2 * R); }
    const r = rng(3); for (let i = 0; i < 10; i++) { const life = .2 + r() * .3, a = -Math.PI * (.15 + r() * .7), sp = (120 + r() * 260) * z; if (q > life) continue;
      c.fillStyle = `rgba(255,${200 + r() * 50 | 0},120,${1 - q / life})`; c.fillRect(HP[0] + Math.cos(a) * sp * q, HP[1] - 20 * z + Math.sin(a) * sp * q + 500 * q * q, 3, 3); }
    // 吹熄後一縷煙
    if (o > 0 && o < 1.2) { c.globalCompositeOperation = 'source-over'; c.strokeStyle = `rgba(200,200,200,${.25 * (1 - o / 1.2)})`; c.lineWidth = 3 * z; c.beginPath();
      for (let s = 0; s <= 20; s++) { const qq = s / 20, yy = HP[1] - 20 * z - qq * 260 * z * (.4 + o), xx = HP[0] + Math.sin(o * 3 - qq * 5) * 14 * qq * z; s ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
    c.restore();
  }
}

// ---------- 結尾：拉遠到地球 → 熄燈 → 火柴 ----------
const BUF = document.createElement('canvas'); BUF.width = W; BUF.height = H; const bctx = BUF.getContext('2d');
const MASKED = document.createElement('canvas'); MASKED.width = W; MASKED.height = H; const mctx = MASKED.getContext('2d');
function feather(F, k) {
  mctx.globalCompositeOperation = 'source-over'; mctx.clearRect(0, 0, W, H); mctx.drawImage(BUF, 0, 0);
  if (k <= 0) return;
  const r1 = k < .12 ? lerp(950, 440, MO.smooth(k / .12)) : lerp(440, 240, (k - .12) / .88), g = mctx.createRadialGradient(F[0], F[1], r1 * .25, F[0], F[1], r1);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  mctx.globalCompositeOperation = 'destination-in'; mctx.fillStyle = g; mctx.fillRect(0, 0, W, H); mctx.globalCompositeOperation = 'source-over';
}
const TW = [426, 956];
function ending(t) {
  c.globalAlpha = 1; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const q = MO.smooth(seg(t, T.OUT0, T.OUT1));
  const E = Math.pow(16, 1 - q) * (1 + 0.08 * (1 - MO.sineInOut(seg(t, T.OUT1, T.END))));   // 到位後繼續極慢地拉遠
  const li = ERAS.length - 1;
  c = bctx; const { zoom } = eraScene(li, Math.min(t - LAST.start, P)); c = MAIN;
  const F = px(LAST.src, zoom), twF = [TW[0] * SC, TW[1] * SC], A = [lerp(F[0], twF[0], q), lerp(F[1], twF[1], q)];
  const ea = clamp((14 - E) / 8);
  if (ea > 0) { const sc = SC * E; c.globalAlpha = ea; c.filter = `blur(${Math.max(0, (E - 2) * 1.6)}px)`; c.drawImage(IMG.earth, A[0] - TW[0] * sc, A[1] - TW[1] * sc, 941 * sc, 1672 * sc); c.filter = 'none'; c.globalAlpha = 1; }
  const B = E / 16, ba = clamp((E - 3) / 9);
  if (ba > 0) { c.save(); c.globalAlpha = ba; c.translate(A[0], A[1]); c.scale(B, B); c.translate(-F[0], -F[1]); feather(F, 1 - B); c.drawImage(MASKED, 0, 0); c.restore(); }
  const dot = clamp(1 - Math.abs(E - 4) / 6) * (1 - seg(t, T.OUT1 - .6, T.OUT1 + .4));
  if (dot > 0) { const g = c.createRadialGradient(A[0], A[1], 0, A[0], A[1], 60); g.addColorStop(0, `rgba(255,230,170,${.9 * dot})`); g.addColorStop(1, 'rgba(255,180,80,0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(A[0] - 60, A[1] - 60, 120, 120); c.restore(); }
  // 城市燈火的呼吸：極輕的明暗起伏
  if (t > T.OUT1) { const br = .06 * Math.sin((t - T.OUT1) * 1.3) * seg(t, T.OUT1, T.OUT1 + 1); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, br); c.drawImage(IMG.earth, A[0] - TW[0] * SC * E, A[1] - TW[1] * SC * E, 941 * SC * E, 1672 * SC * E); c.restore(); }
  quote('從一朵火焰，\n到一顆發光的星球', 'FROM A SINGLE FLAME TO A GLOWING PLANET', T.OUT1 - .5, T.END - 1.2, t, 290, [140, 200, 255]);
}

// ---------- 一幀 ----------
function frame(t) {
  c = MAIN; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (t < OPEN) {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    match(t, .7, [540, 830], 1, 2.3);
    const fo = MO.smooth(seg(t, 2.35, OPEN)); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  } else if (t < T.OUT0) {
    let i = ERAS.length - 1; while (ERAS[i].start > t) i--;
    const e = ERAS[i], u = t - e.start;
    if (e.egg) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      match(t, e.start + .5, [540, 600], .7, e.start + 2.45);
      card(e, e.start + .7, e.start + 2.85, t);
      const nx = ERAS[i + 1], fi = MO.smooth(seg(u, EGG - .5, EGG)); if (fi > 0) { c.globalAlpha = fi; c.drawImage(darkOff(nx), 0, 0); c.globalAlpha = 1; }
    } else {
      eraScene(i, u);
      // 下一代的熄燈照片在黑暗中淡入（彩蛋前則淡到全黑）
      const nx = ERAS[i + 1];
      if (nx && e !== LAST) { const a = MO.smooth(seg(u, P - .7, P)); if (a > 0) { if (nx.egg) { c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, W, H); } else { c.globalAlpha = a; c.drawImage(darkOff(nx), 0, 0); c.globalAlpha = 1; } } }
      if (i === 0) { const fin = MO.smooth(seg(u, 0, .9)); if (fin < 1) { c.fillStyle = `rgba(0,0,0,${1 - fin})`; c.fillRect(0, 0, W, H); } }
      if (i > 0 && ERAS[i - 1].egg) { /* 從彩蛋接過來：已在彩蛋末段淡入 */ }
      card(e, e.start + 1.2, e.start + (e === LAST ? 5.9 : 5.6), t);
    }
  } else ending(t);
  const vg = c.createRadialGradient(W / 2, H * .45, H * .25, W / 2, H * .5, H * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
  c.globalAlpha = 1; c.fillStyle = vg; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = .05; c.globalCompositeOperation = 'overlay'; const r = rng(Math.floor(t * 24) + 1);
  c.translate(-r() * 256, -r() * 256); c.fillStyle = c.createPattern(GRAIN, 'repeat'); c.fillRect(0, 0, W + 256, H + 256); c.restore();
  const fo = MO.sineInOut(seg(t, T.END - 3.5, T.END)); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
}
// 某一代「起始時」的熄燈畫面（含壓暗），快取
const DO = {};
function darkOff(e) {
  if (DO[e.id]) return DO[e.id];
  const k = document.createElement('canvas'); k.width = W; k.height = H; const save = c; c = k.getContext('2d');
  SHIFT = e.shift || 285; c.fillStyle = '#000'; c.fillRect(0, 0, W, H); cover(IMG[e.id + '_off'], 1); c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, 0, W, H);
  c = save; DO[e.id] = k; return k;
}
const GRAIN = (() => { const k = document.createElement('canvas'); k.width = k.height = 256; const g = k.getContext('2d'), d = g.createImageData(256, 256), r = rng(5); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return k; })();

const names = [...ERAS.filter(e => !e.egg).flatMap(e => [e.id + '_lit', e.id + '_off']), 'earth', 'match_lit', 'match_off'];
const allText = ERAS.map(e => e.year + e.zh + e.kw.join('') + e.en).join('') + '從一朵火焰，到顆發光的星球｜';
Promise.all([...names.map(n => new Promise((res, rej) => { const i = new Image(); i.onload = () => { IMG[n] = i; res(); }; i.onerror = () => rej(n); i.src = 'assets/' + n + '.png'; })),
  document.fonts.load(`600 98px ${FONT}`, allText), document.fonts.load(`300 46px ${FONT}`, allText), document.fonts.load(`500 68px ${FONT}`, allText), document.fonts.load(`300 22px ${FONT}`, allText)])
  .then(() => {
    SPR.offStick = sprite(IMG.match_off, { y0: 760, fe: 30, th: 8, rng_: 30 });
    SPR.offHead = sprite(IMG.match_off, { y0: 560, y1: 780, fe: 20, th: 8, rng_: 30 });
    SPR.litStick = sprite(IMG.match_lit, { y0: 745, fe: 30, th: 22, rng_: 40, rad: [470, 1200, 700, 120] });
    SPR.flameOnly = sprite(IMG.match_lit, { y1: 640, fe: 40, th: 32, rng_: 50, rad: [476, 480, 400, 160] });
    SPR.headLit = sprite(IMG.match_lit, { y0: 600, y1: 770, fe: 25, th: 32, rng_: 50, rad: [476, 690, 170, 60] });
    window.renderFrame = frame; window.__total = T.END;
    window.EVENTS = { T, eras: ERAS.map(e => ({ start: e.start, type: e.egg ? 'egg' : e.type })), P, IG, OFF, EGG, OPEN };
    window.__ready = true; frame(0);
  }).catch(e => { window.__bootFailed = 'missing ' + String(e); });
})();
