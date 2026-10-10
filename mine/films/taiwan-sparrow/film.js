// film.js — 小麻雀追袋記（完整版）
// 一張 2160×4000 的長頁面，10 個物件排成 2 欄 × 5 列；路線從左下的早餐盤往上蛇行到右上的紅白袋
window.DUR = 33.0;
const SS = 1.9;                                      // 麻雀尺寸
const BB = {"plate": {"w": 1536, "h": 1024, "x0": 315, "x1": 1268, "y0": 173, "y1": 893}, "cooker": {"w": 1536, "h": 1024, "x0": 377, "x1": 1217, "y0": 195, "y1": 864}, "steamer": {"w": 1536, "h": 1024, "x0": 438, "x1": 1191, "y0": 185, "y1": 854}, "tea": {"w": 1536, "h": 1024, "x0": 521, "x1": 1096, "y0": 37, "y1": 911}, "coil": {"w": 1536, "h": 1024, "x0": 392, "x1": 1271, "y0": 193, "y1": 803}, "stools": {"w": 1312, "h": 1199, "x0": 371, "x1": 940, "y0": 189, "y1": 1042}, "slippers": {"w": 1536, "h": 1024, "x0": 293, "x1": 1306, "y0": 200, "y1": 891}, "fan": {"w": 1536, "h": 1024, "x0": 437, "x1": 1127, "y0": 20, "y1": 960}, "pinball": {"w": 1374, "h": 1145, "x0": 345, "x1": 1058, "y0": 76, "y1": 1066}, "bagr": {"w": 1536, "h": 1024, "x0": 477, "x1": 1127, "y0": 116, "y1": 919}};
const CELL = { plate: [540, 3650], cooker: [1620, 3650], steamer: [1620, 2950], tea: [540, 2950], coil: [540, 2250], stools: [1620, 2250], slippers: [1620, 1550], fan: [540, 1550], pinball: [540, 850], bagr: [1620, 850] };
const FIT = { plate: [540, 380], cooker: [520, 400], steamer: [480, 400], tea: [380, 540], coil: [540, 350], stools: [380, 460], slippers: [560, 380], fan: [440, 460], pinball: [420, 480], bagr: [380, 470] };
const ZONE = { plate: '#f8c4a2', cooker: '#f6d98e', steamer: '#f4b9a6', tea: '#b9dfc0', coil: '#d6c4ea', stools: '#b8d6ef', slippers: '#bccbdc', fan: '#c7e6dc', pinball: '#7d84bd', bagr: '#6a66a8' };
const PL = {};
for (const k in BB) { const b = BB[k], [fw, fh] = FIT[k], s = Math.min(fw / (b.x1 - b.x0), fh / (b.y1 - b.y0)), [cx, cy] = CELL[k];
  PL[k] = { s, x: cx - (b.x0 + b.x1) / 2 * s, y: cy + 30 - (b.y0 + b.y1) / 2 * s }; }
const P = (k, u, v) => [PL[k].x + u * PL[k].s, PL[k].y + v * PL[k].s];
const IMG = {}; const load = (k, s) => new Promise(r => { const i = new Image(); i.onload = () => { IMG[k] = i; r(); }; i.src = s; });
const feet = ([x, y]) => [x, y - 30 * SS];           // 腳踩在某點時，身體中心的位置
const hopTo = (a, b, k, h) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * h];

// —— 相機 ——
const CAM = [
  [0, 540, 3600, 1.34], [2.6, 560, 3610, 1.4], [3.5, 1620, 3600, 1.34], [5.3, 1620, 3580, 1.36], [6.1, 1640, 2930, 1.34],
  [7.6, 1600, 2930, 1.38], [8.4, 560, 2930, 1.34], [8.95, 520, 3000, 1.7], [9.8, 560, 2990, 1.7], [10.5, 560, 2820, 1.34],
  [11.6, 540, 2250, 1.34], [12.1, 560, 2260, 1.5], [12.85, 600, 2270, 1.42], [13.4, 1620, 2250, 1.34], [14.3, 1680, 2290, 1.46],
  [14.6, 1700, 2310, 1.56], [15.4, 1620, 1560, 1.34], [17.4, 1560, 1550, 1.36], [18.5, 560, 1550, 1.34], [19.4, 560, 1550, 1.38],
  [20.8, 600, 1480, 1.34], [21.6, 540, 860, 1.34], [23.5, 540, 860, 1.4], [24.2, 1620, 860, 1.34], [25.6, 1620, 850, 1.34],
  [27.2, 1680, 520, 1.15], [29.6, 1080, 2075, .48], [33, 1080, 2075, .47]];
function cam(t) { let i = 0; while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++; const a = CAM[i], b = CAM[i + 1], k = ease.io(clamp((t - a[0]) / (b[0] - a[0])));
  const sh = shake(t);
  return { x: lerp(a[1], b[1], k) + noise1(t * .6, 91) * 4 + sh[0], y: lerp(a[2], b[2], k) + noise1(t * .6, 92) * 4 + sh[1], z: lerp(a[3], b[3], k) }; }
function camRot(t) { return -.3 * Math.sin(Math.PI * prog(t, 11.6, 13.3)) * Math.sin(Math.PI * .5 * prog(t, 11.6, 12.5) + .2); }
function shake(t) { let x = 0, y = 0; for (const t0 of [14.5, 9.6, 2.45]) { const d = t - t0; if (d > 0 && d < .35) { const a = 14 * Math.exp(-d * 10); x += Math.sin(d * 70) * a; y += Math.cos(d * 55) * a; } } return [x, y]; }

// —— 關鍵點 ——
const K = {};
function keys() {
  K.rim = P('plate', 400, 470); K.bagHome = P('plate', 1185, 470);
  K.lid = P('cooker', 620, 300); K.knob = P('cooker', 768, 205);
  K.cloud0 = [K.knob[0] + 70, K.knob[1] - 240]; K.cloud1 = [CELL.steamer[0] + 300, CELL.steamer[1] - 170];
  K.stTop = P('steamer', 830, 255); K.ledges = [P('steamer', 470, 405), P('steamer', 455, 525), P('steamer', 450, 680)];
  K.teaGround = P('tea', 1150, 905); K.strawT = P('tea', 915, 22); K.strawB = P('tea', 845, 250);
  K.pearls = [[700, 760], [800, 800], [880, 760], [760, 860], [840, 700]].map(([u, v]) => P('tea', u, v));
  K.coilC = P('coil', 760, 410); K.coilEnd = P('coil', 1000, 640);
  K.stoolTop = P('stools', 650, 215); K.plankEnd = [K.stoolTop[0] + 290, K.stoolTop[1] - 6]; K.pool = [CELL.stools[0] + 300, CELL.stools[1] + 220];
  K.boat = P('slippers', 760, 690); K.fanTop = P('fan', 905, 95); K.fanC = P('fan', 907, 375);
  K.lane0 = P('pinball', 945, 900); K.lane1 = P('pinball', 790, 110); K.entry = P('pinball', 650, 150);
  K.bounce = [[590, 245], [705, 305], [600, 390], [720, 470], [610, 560], [660, 640]].map(([u, v]) => P('pinball', u, v));
  K.bagSpot = [CELL.bagr[0], CELL.bagr[1] + 30]; K.bagGround = P('bagr', 380, 905);
}
// 螺旋（蚊香）：由中心往外，角度增加
function spiral(k) { const ts = .96 - 5 * Math.PI, te = .96, th = lerp(ts, te, k), r = lerp(40, 420, k), b = PL.coil;
  return [b.x + (760 + r * Math.cos(th)) * b.s, b.y + (425 + r * .62 * Math.sin(th)) * b.s]; }

// —— 袋子的路線 ——
function bagState(t) {
  const H0 = [K.bagHome[0], K.bagHome[1] - 70];
  if (t < 2.4) return { p: H0, s: 1.8, fl: .25 };
  if (t < 4.6) { const k = ease.io(prog(t, 2.4, 4.6)); return { p: D.bez(H0, [1000, 3300], [1900, 3500], [1750, 2700], 30)[Math.round(k * 30)], s: 1.8, fl: 1.2 }; }
  if (t < 6.6) { const k = ease.io(prog(t, 4.6, 6.6)); return { p: D.bez([1750, 2700], [1500, 2350], [1000, 2500], [K.strawT[0] + 15, K.strawT[1] + 70], 30)[Math.round(k * 30)], s: 1.8, fl: 1 }; }
  if (t < 10.4) return { p: [K.strawT[0] + 15, K.strawT[1] + 70 + Math.sin(t * 2) * 3], s: 1.8, fl: .4, rot: .45 };
  if (t < 15.2) { const k = ease.io(prog(t, 10.4, 15.2)); return { p: D.bez([K.strawT[0] + 15, K.strawT[1] + 70], [700, 2000], [1500, 1900], P('slippers', 1240, 760), 40)[Math.round(k * 40)], s: 1.8, fl: 1 }; }
  if (t < 17.6) { const b = P('slippers', 1240, 760); return { p: [b[0] + Math.sin(t * 1.6) * 10, b[1] - 40 + Math.sin(t * 2.4) * 8], s: 1.8, fl: .5, rot: Math.sin(t * 1.6) * .12 }; }
  if (t < 19.4) { const k = ease.io(prog(t, 17.6, 18.6)), a = P('slippers', 1240, 720), b = P('fan', 1160, 260); return { p: hopTo(a, b, k, 200), s: 1.8, fl: t < 18.6 ? 1 : 0 }; }
  if (t < 21.8) { const k = ease.out(prog(t, 19.4, 21.8)), b = P('fan', 1160, 260); return { p: D.bez(b, [1300, 1200], [1100, 700], [1350, 560], 30)[Math.round(k * 30)], s: 1.8, fl: 1.6 }; }
  if (t < 24.0) { const k = ease.io(prog(t, 21.8, 24.0)); return { p: [lerp(1350, 1620, k), lerp(560, 520, k) + Math.sin(t * 3) * 10], s: 1.8, fl: .8 }; }
  if (t < 24.8) { const k = ease.io(prog(t, 24.0, 24.8)); return { p: [lerp(1620, K.bagSpot[0], k), lerp(520, K.bagSpot[1] + 30, k)], s: lerp(1.8, 6.4, k), fl: .3 * (1 - k) }; }
  return { p: [K.bagSpot[0], K.bagSpot[1] + 30], s: 6.4, fl: 0 };
}
// 結尾熱氣球：真袋子＋籃子＋麻雀一起升起
function balloonUp(t) { const k1 = ease.io(prog(t, 25.9, 27.4)), k2 = ease.io(prog(t, 27.4, 30.5)); return [k1 * 40 + k2 * 200, -k1 * 260 - k2 * 280 + Math.sin(t * 1.5) * 6 * k1]; }

// —— 麻雀的路線與表情 ——
function spState(t) {
  const o = { p: ease.out(prog(t, .1, .9)) }; let pos;
  if (t < 3.0) { pos = feet(K.rim);
    const peck = (a) => { const d = t - a; return d > 0 && d < .28 ? Math.sin(d / .28 * Math.PI) : 0; };
    o.look = .55 * (peck(.95) + peck(1.55)); o.expr = t < 2.45 ? 'happy' : 'surprise';
    if (t > 2.45 && t < 2.7) { o.sq = -.12 * Math.sin(prog(t, 2.45, 2.7) * Math.PI); pos = [pos[0], pos[1] - 40 * Math.sin(prog(t, 2.45, 2.7) * Math.PI)]; }
    if (t > 2.8) o.expr = 'determined'; }
  else if (t < 3.6) { const k = ease.io(prog(t, 3.0, 3.6)); pos = hopTo(feet(K.rim), feet(K.lid), k, 260); o.flap = Math.abs(Math.sin(t * 18)); o.legs = 1; o.expr = 'determined'; }
  else if (t < 5.0) { pos = feet(K.lid); o.expr = t < 4.2 ? 'determined' : 'surprise'; o.look = t > 4.2 ? -.35 : 0; if (t < 3.75) o.sq = .15 * Math.sin(prog(t, 3.6, 3.75) * Math.PI); if (t > 4.8) o.sq = .14 * ease.out(prog(t, 4.8, 5.0)); }
  else if (t < 5.4) { const k = prog(t, 5.0, 5.4), c = cloudPos(t); pos = hopTo(feet(K.lid), [c[0], c[1] - 70 - 30 * SS], k, 160); o.legs = 1; o.flap = .6; o.expr = 'determined'; }
  else if (t < 6.1) { const c = cloudPos(t); pos = [c[0], c[1] - 70 - 30 * SS]; o.expr = 'happy'; }
  else if (t < 6.4) { const k = prog(t, 6.1, 6.4), c = cloudPos(6.1); pos = hopTo([c[0], c[1] - 70 - 30 * SS], feet(K.stTop), k, 90); o.legs = 1; o.expr = 'happy'; }
  else if (t < 7.2) { pos = feet(K.stTop); o.expr = 'happy'; o.flip = t > 6.9; o.look = .15; }
  else if (t < 7.9) { const i = Math.min(2, Math.floor((t - 7.2) / .3)), k = ((t - 7.2) % .3) / .3, a = i === 0 ? feet(K.stTop) : feet(K.ledges[i - 1]);
    pos = hopTo(a, feet(K.ledges[i]), Math.min(1, k * 1.4), 50); o.flip = true; o.legs = 1; o.expr = 'determined'; if (t > 7.8) { pos = feet(K.ledges[2]); o.sq = .12; } }
  else if (t < 8.5) { const k = ease.io(prog(t, 7.9, 8.5)); pos = hopTo(feet(K.ledges[2]), feet(K.teaGround), k, 300); o.flip = true; o.flap = Math.abs(Math.sin(t * 16)); o.legs = 1; o.expr = 'shout'; }
  else if (t < 10.2) { pos = feet(K.teaGround); o.flip = true; o.look = t > 8.7 ? -.4 : 0; o.expr = t < 9.6 ? 'determined' : t < 9.95 ? 'surprise' : 'happy'; if (t < 8.65) o.sq = .15 * Math.sin(prog(t, 8.5, 8.65) * Math.PI); }
  else if (t < 10.6) { const k = ease.io(prog(t, 10.2, 10.6)), g = gatherPt(t); pos = hopTo(feet(K.teaGround), [g[0], g[1] - 30 * SS + 10], k, 60); o.flap = Math.abs(Math.sin(t * 18)); o.legs = 1; o.expr = 'shout'; }
  else if (t < 11.6) { const g = gatherPt(t); pos = [g[0], g[1] - 30 * SS + 10]; o.legs = 1; o.expr = 'happy'; o.flap = .3 + .2 * Math.sin(t * 10); }
  else if (t < 12.9) { const k = ease.in(prog(t, 11.6, 12.9)), a = spiral(k), b = spiral(Math.min(1, k + .01)); pos = feet(a); o.flip = b[0] < a[0]; o.expr = k < .25 ? 'surprise' : 'happy'; o.sq = -.08; }
  else if (t < 13.4) { const k = ease.out(prog(t, 12.9, 13.4)); pos = hopTo(feet(K.coilEnd), feet(K.stoolTop), k, 220); o.flap = Math.abs(Math.sin(t * 18)); o.legs = 1; o.expr = 'dizzy'; o.rot = Math.sin(t * 12) * .3; }
  else if (t < 14.0) { const k = ease.io(prog(t, 13.4, 13.95)); pos = feet([lerp(K.stoolTop[0], K.plankEnd[0] - 10, k), lerp(K.stoolTop[1], K.plankEnd[1], k) - Math.abs(Math.sin(k * Math.PI * 3)) * 18]); o.expr = t < 13.7 ? 'dizzy' : 'determined'; }
  else if (t < 14.2) { pos = feet([K.plankEnd[0] - 10, K.plankEnd[1] + 14 * Math.sin(prog(t, 14.0, 14.2) * Math.PI)]); o.sq = .22 * Math.sin(prog(t, 14.0, 14.2) * Math.PI); o.expr = 'determined'; }
  else if (t < 14.5) { const k = ease.in(prog(t, 14.2, 14.5)); pos = hopTo(feet([K.plankEnd[0] - 10, K.plankEnd[1]]), [K.pool[0], K.pool[1] - 20], k, 160); o.rot = k * 1.6; o.expr = 'happy'; o.sq = -.15; }
  else if (t < 15.3) return null;                                         // 在水裡
  else if (t < 17.6) { pos = feet([K.boat[0] + boatBob(t)[0], K.boat[1] + boatBob(t)[1]]); o.expr = t < 16.8 ? 'happy' : ''; o.look = t > 17.0 ? -.1 : 0; o.flip = t > 17.2; if (t < 15.5) o.sq = -.15 * Math.sin(prog(t, 15.3, 15.5) * Math.PI); }
  else if (t < 18.6) { const k = ease.io(prog(t, 17.6, 18.5)); pos = hopTo(feet([K.boat[0], K.boat[1]]), feet(K.fanTop), k, 260); o.flip = true; o.flap = Math.abs(Math.sin(t * 18)) * (k < 1 ? 1 : 0); o.legs = k < 1 ? 1 : 0; o.expr = 'determined'; }
  else if (t < 19.4) { pos = feet(K.fanTop); o.flip = true; o.still = true; o.expr = t > 19.0 ? 'surprise' : ''; }
  else if (t < 21.6) { const k = ease.out(prog(t, 19.4, 21.6)); pos = D.bez(feet(K.fanTop), [1100, 1400], [1200, 1000], K.lane0, 30)[Math.round(k * 30)]; o.rot = (t - 19.4) * 7; o.expr = 'surprise'; o.flap = Math.abs(Math.sin(t * 20)); o.legs = 1; }
  else if (t < 21.8) { const k = ease.in(prog(t, 21.6, 21.8)); pos = k < .7 ? [lerp(K.lane0[0], K.lane1[0], k / .7), lerp(K.lane0[1], K.lane1[1], k / .7)] : [lerp(K.lane1[0], K.entry[0], (k - .7) / .3), lerp(K.lane1[1], K.entry[1], (k - .7) / .3)]; o.rot = t * 9; o.expr = 'happy'; o.s = 1.3; }
  else if (t < 23.6) { const i = Math.min(5, Math.floor((t - 21.8) / .3)), k = ((t - 21.8) % .3) / .3, a = i === 0 ? K.entry : K.bounce[i - 1]; pos = hopTo(a, K.bounce[i], k, 40); o.rot = t * 10; o.expr = 'happy'; o.s = 1.3; }
  else if (t < 23.75) { pos = K.bounce[5]; o.expr = 'happy'; o.s = 1.3; o.sq = .1 * Math.sin(prog(t, 23.6, 23.75) * Math.PI * 2); }
  else if (t < 24.3) { const k = ease.io(prog(t, 23.75, 24.3)); pos = hopTo(K.bounce[5], feet(K.bagGround), k, 260); o.flap = Math.abs(Math.sin(t * 18)); o.legs = 1; o.expr = 'determined'; o.s = lerp(1.3, SS, k); }
  else if (t < 25.6) { pos = feet(K.bagGround); o.expr = t < 24.8 ? '' : 'surprise'; o.still = t < 24.8; o.look = -.3; }
  else if (t < 25.9) { const k = prog(t, 25.6, 25.9); pos = hopTo(feet(K.bagGround), basketSeat(t), k, 120); o.legs = 1; o.flap = .7; o.expr = 'happy'; }
  else { pos = basketSeat(t); o.expr = 'happy'; o.look = -.15; }
  return { pos, o, s: o.s ?? SS };
}
function boatBob(t) { return [Math.sin(t * 1.6) * 6, Math.sin(t * 2.3) * 5]; }
function cloudPos(t) { const k = ease.io(prog(t, 5.4, 6.1)); return [lerp(K.cloud0[0], K.cloud1[0], k), lerp(K.cloud0[1], K.cloud1[1], k) + Math.sin(t * 2.2) * 4]; }
function gatherPt(t) { const k = ease.io(prog(t, 10.6, 11.6)), a = [K.strawT[0] + 60, K.strawT[1] - 140], b = [K.coilC[0], K.coilC[1] - 30 - 30 * SS - 10]; return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }
function basketSeat(t) { const u = balloonUp(t); return [K.bagSpot[0] + u[0], K.bagSpot[1] + 330 + u[1] - 30 * SS - 18]; }

// —— 擬聲字 ——
const TX = [];
const tx = (s, x, y, size, t0, o = {}) => TX.push({ s, x, y, size, t0, o });
function texts() {
  tx('呼～', CELL.plate[0] - 380, CELL.plate[1] - 220, 110, 2.45, { per: .14 });
  tx('噗～', K.knob[0] + 110, K.knob[1] - 70, 110, 4.25, { per: .14 });
  tx('咚咚', CELL.steamer[0] - 400, CELL.steamer[1] - 230, 110, 6.6, { per: .6 });
  tx('啵！', K.strawT[0] + 120, K.strawT[1] + 40, 120, 9.6, { per: .1, pop: true });
  tx('咻～', CELL.coil[0] + 120, CELL.coil[1] - 260, 115, 11.95, { per: .16 });
  tx('撲通！', K.pool[0] - 260, K.pool[1] - 150, 110, 14.5, { per: .1, pop: true });
  tx('嘩～', CELL.slippers[0] - 400, CELL.slippers[1] - 240, 110, 15.9, { per: .2 });
  tx('嗡～', CELL.fan[0] + 140, CELL.fan[1] - 290, 115, 19.45, { per: .16 });
  tx('叮叮叮！', CELL.pinball[0] - 365, CELL.pinball[1] - 200, 88, 21.95, { per: .25, pop: true, color: '#fff6dc' });
  tx('呼～', CELL.bagr[0] - 400, CELL.bagr[1] - 250, 110, 24.9, { per: .18, color: '#fff6dc' });
}

// —— 事件（音效） ——
const EV = []; const ev = (t, type, extra = {}) => EV.push({ t, type, ...extra });
function events() {
  ev(.95, 'peck'); ev(1.55, 'peck'); ev(2.4, 'wind', { pan: -.3 }); ev(2.45, 'write'); ev(2.5, 'bag'); ev(3.0, 'flap'); ev(3.6, 'land');
  ev(4.2, 'puff'); ev(4.25, 'write'); ev(5.0, 'hop'); ev(5.4, 'rise'); ev(6.4, 'land');
  [6.6, 7.2, 7.8].forEach(t => ev(t, 'knock')); [7.35, 7.65, 7.95].forEach(t => ev(t, 'hop')); ev(7.9, 'flap'); ev(8.5, 'land');
  for (let i = 0; i < 5; i++) { ev(9.0 + i * .1, 'bubble', { i }); ev(9.6 + i * .07, 'pop', { i }); }
  ev(10.2, 'flap'); ev(11.6, 'land'); ev(11.95, 'slide'); ev(12.9, 'boing'); ev(13.4, 'land'); ev(13.5, 'steps');
  ev(14.0, 'plank'); ev(14.5, 'splash'); ev(14.4, 'rainin'); ev(15.3, 'plop'); ev(15.9, 'water'); ev(17.6, 'flap'); ev(18.5, 'land');
  ev(18.6, 'silence', { d: .8 }); ev(19.4, 'fan'); ev(19.45, 'write'); ev(19.5, 'wind', { pan: .3 });
  ev(11.65, 'fuse'); ev(12.1, 'flee'); ev(15.7, 'croak'); ev(15.95, 'fishjump'); ev(16.6, 'fishsplash'); ev(16.95, 'rainbow'); ev(21.6, 'spring'); for (let i = 0; i < 6; i++) ev(21.8 + (i + 1) * .3, 'ding', { i }); ev(23.6, 'score'); ev(23.75, 'flap');
  ev(24.0, 'silence', { d: .8 }); ev(24.8, 'inflate'); ev(24.9, 'write'); ev(25.6, 'hop'); ev(25.9, 'rise');
  [26.3, 26.9, 27.6].forEach((t, i) => ev(t, 'firework', { i })); ev(29.0, 'title');
  ev(0, 'amb', { place: 'shop', t1: 3.4 }); ev(3.4, 'amb', { place: 'kitchen', t1: 8.2 }); ev(8.2, 'amb', { place: 'street', t1: 14.4 });
  ev(14.4, 'amb', { place: 'rain', t1: 17.1 }); ev(19.4, 'amb', { place: 'summer', t1: 21.2 }); ev(21.0, 'amb', { place: 'market', t1: 24.0 }); ev(24.8, 'amb', { place: 'night', t1: 33 });
}

// —— 頁面：紙＋每格的色塊 ——
function page() {
  ctx.save(); ctx.fillStyle = ctx.createPattern(PT, 'repeat'); ctx.fillRect(-1e4, -1e4, 2e4, 2e4); ctx.restore();
  let i = 0; for (const k in CELL) { const [x, y] = CELL[k]; blob(x, y + 10, 500, 330, ZONE[k], 200 + i, k === 'pinball' || k === 'bagr' ? .62 : .5); i++; }
}

// —— 各格點綴（以格子中心為原點） ——
function at(k, f) { ctx.save(); ctx.translate(CELL[k][0], CELL[k][1]); f(); ctx.restore(); }
const PR = (t, a, b) => ease.out(prog(t, a, b));
function linesRect(x0, y0, x1, y1, p, seed, boil, w = 2.6) { pen(ctx, [[x0, y0], [x1, y0 + 1], [x1 - 1, y1], [x0 + 1, y1 - 1], [x0, y0]], { w, p, seed, boil }); }
function deco(t) {
  const boil = Math.floor(t * 12);
  // 1 早餐盤：菜單板、豆漿杯、檯面
  at('plate', () => { const p = PR(t, 0, .8);
    linesRect(-410, -320, -240, -160, p, 501, boil); pen(ctx, [[-325, -320], [-325, -350]], { w: 2, p, seed: 502, boil }); wash(ctx, [[-410, -320], [-240, -320], [-240, -280], [-410, -280]], '#e7787a', { alpha: .55 * p, seed: 503, boil });
    [[-390, -250, -270], [-390, -220, -300], [-390, -190, -285]].forEach(([a, y, b], i) => pen(ctx, [[a, y], [b, y]], { w: 2, p, seed: 504 + i, boil }));
    const q = PR(t, .3, 1.1); const cup = [[300, 60], [400, 60], [388, 220], [312, 220]]; wash(ctx, cup, '#f3e3c3', { alpha: .8 * q, seed: 510, boil }); pen(ctx, cup.concat([cup[0]]), { w: 2.6, p: q, seed: 511, boil });
    pen(ctx, [[292, 60], [408, 60]], { w: 3, p: q, seed: 512, boil }); pen(ctx, [[365, 60], [395, -40]], { w: 3, p: q, seed: 513, boil }); pen(ctx, ellipse(350, 140, 22, 14, 0, 6.6, 14), { w: 2, p: q, seed: 514, boil, color: '#c0703a' });
    for (let j = 0; j < 3; j++) { const pts = []; for (let i = 0; i <= 12; i++) pts.push([320 + j * 25 + Math.sin(i * .8 + t * 3 + j) * 5, 40 - i * 7]); pen(ctx, pts, { w: 1.8, p: q, seed: 515 + j, boil, gap: 0 }); }
    const c = PR(t, 0, .6); wash(ctx, [[-540, 250], [540, 252], [540, 360], [-540, 360]], '#d9a874', { alpha: .45 * c, seed: 520, boil, rough: 4 }); pen(ctx, [[-500, 250], [500, 252]], { w: 3, p: c, seed: 521, boil });
    star4(t, 300, -260, 16, 522, PR(t, .5, 1)); star4(t, -140, 180, 10, 523, PR(t, .6, 1));
  });
  // 2 電鍋：窗＋晨光、撕頁日曆、檯面、白飯、蔥
  at('cooker', () => { const wp = PR(t, 3.0, 3.7);
    linesRect(-410, -330, -250, -150, wp, 301, boil, 3); pen(ctx, [[-330, -330], [-330, -150]], { w: 2.2, p: wp, seed: 302, boil }); pen(ctx, [[-410, -240], [-250, -240]], { w: 2.2, p: wp, seed: 303, boil });
    const sp = PR(t, 3.2, 3.9); wash(ctx, ellipse(-370, -290, 26, 26, 0, 6.3, 20), '#f2a93b', { alpha: .7 * sp, seed: 305, boil, off: [3, 2] }); pen(ctx, ellipse(-370, -290, 26, 26), { w: 2.4, p: sp, seed: 306, boil });
    const cp = []; for (let i = 0; i <= 40; i++) { const u = i / 40; cp.push([-410 + u * 160, -324 + Math.abs(Math.sin(u * Math.PI * 4)) * 14]); }
    wash(ctx, cp.concat([[-250, -330], [-410, -330]]), '#e7787a', { alpha: .45 * wp, seed: 313, boil }); pen(ctx, cp, { w: 2, p: wp, seed: 314, boil });
    const kp = PR(t, 3.2, 3.9); linesRect(290, -330, 400, -190, kp, 321, boil); wash(ctx, [[290, -330], [400, -330], [400, -300], [290, -300]], '#d8463c', { alpha: .6 * kp, seed: 322, boil });
    [[305, -270, 385], [312, -245, 378], [320, -220, 370]].forEach(([a, y, b], i) => pen(ctx, [[a, y], [b, y]], { w: 2, p: kp, seed: 323 + i, boil }));
    const tp = PR(t, 3.0, 3.6); wash(ctx, [[-540, 245], [540, 247], [540, 360], [-540, 360]], '#d9a874', { alpha: .45 * tp, seed: 330, boil, rough: 4 }); pen(ctx, [[-500, 245], [500, 247]], { w: 3, p: tp, seed: 331, boil });
    const bp = PR(t, 3.3, 4.0), bx = -340, by = 200, bowl = ellipse(bx, by, 70, 48, 0, Math.PI, 24);
    wash(ctx, bowl.concat([[bx - 70, by]]), '#dfe8f4', { alpha: .7 * bp, seed: 340, boil }); pen(ctx, bowl, { w: 2.6, p: bp, seed: 341, boil }); pen(ctx, [[bx - 74, by], [bx + 74, by]], { w: 2.6, p: bp, seed: 342, boil });
    pen(ctx, ellipse(bx, by + 9, 58, 8, .2, Math.PI - .2, 16), { w: 2, p: bp, seed: 343, boil, color: '#4e6fa8' });
    const rice = []; for (let i = 0; i <= 30; i++) { const u = i / 30, a = Math.PI + u * Math.PI; rice.push([bx + Math.cos(a) * 66, by + Math.sin(a) * 38 - Math.abs(Math.sin(u * Math.PI * 6)) * 6]); } pen(ctx, rice, { w: 2.2, p: bp, seed: 345, boil });
    pen(ctx, [[bx - 80, by - 58], [bx + 100, by - 92]], { w: 3.5, p: bp, seed: 355, boil, color: '#7a4b2a' }); pen(ctx, [[bx - 76, by - 42], [bx + 104, by - 80]], { w: 3.5, p: bp, seed: 356, boil, color: '#7a4b2a' });
    const gp = PR(t, 3.4, 4.1), gx = 370, gy = 245;
    wash(ctx, [[gx - 28, gy - 76], [gx + 28, gy - 76], [gx + 23, gy], [gx - 23, gy]], '#b8d4e6', { alpha: .45 * gp, seed: 360, boil }); pen(ctx, [[gx - 28, gy - 76], [gx - 23, gy], [gx + 23, gy], [gx + 28, gy - 76]], { w: 2.4, p: gp, seed: 361, boil });
    [[-12, -190, -30], [0, -215, 8], [12, -180, 36]].forEach(([dx, h, lean], i) => { const st = D.bez([gx + dx, gy - 16], [gx + dx, gy + h * .4], [gx + dx + lean * .5, gy + h * .8], [gx + dx + lean, gy + h], 10);
      pen(ctx, st, { w: 2.2, p: gp, seed: 362 + i, boil }); wash(ctx, st.concat(st.slice().reverse().map(([x, y]) => [x + 8, y])), '#7fb069', { alpha: .55 * gp, seed: 366 + i, boil, off: [1, 0] }); });
  });
  // 3 蒸籠：蒸籠公寓（窗戶裡的小動物）、小籠包、燈籠
  at('steamer', () => { const p = PR(t, 5.6, 6.3);
    const lx = -330, ly = -270; pen(ctx, [[lx, -350], [lx, ly - 40]], { w: 2, p, seed: 601, boil }); const lan = ellipse(lx, ly, 40, 46, 0, 6.6, 24);
    wash(ctx, lan, '#e0483d', { alpha: .7 * p, seed: 602, boil }); pen(ctx, lan, { w: 2.6, p, seed: 603, boil }); pen(ctx, [[lx - 22, ly - 44], [lx + 22, ly - 44]], { w: 3, p, seed: 604, boil }); pen(ctx, [[lx - 22, ly + 44], [lx + 22, ly + 44]], { w: 3, p, seed: 605, boil });
    pen(ctx, [[lx, ly + 46], [lx, ly + 80]], { w: 2, p, seed: 606, boil, color: '#c0392b' });
    const q = PR(t, 5.8, 6.5), dx = 330, dy = 230; pen(ctx, ellipse(dx, dy, 120, 26, 0, 6.6, 26), { w: 2.6, p: q, seed: 610, boil }); wash(ctx, ellipse(dx, dy, 120, 26, 0, 6.3, 26), '#e9e2d0', { alpha: .6 * q, seed: 611, boil });
    [[-55, 0], [0, -10], [55, 0]].forEach(([ox, oy], i) => { const cx = dx + ox, cy = dy - 22 + oy, bun = []; for (let j = 0; j <= 30; j++) { const a = Math.PI + j / 30 * Math.PI; bun.push([cx + Math.cos(a) * 34, cy + Math.sin(a) * 30 * (1 + .08 * Math.sin(j * 1.9))]); }
      bun.push([cx + 34, cy]); wash(ctx, bun, '#f6efe2', { alpha: .9 * q, seed: 612 + i, boil }); pen(ctx, bun.concat([[cx - 34, cy]]), { w: 2.4, p: q, seed: 615 + i, boil });
      pen(ctx, [[cx - 8, cy - 28], [cx, cy - 34], [cx + 8, cy - 28]], { w: 2, p: q, seed: 618 + i, boil, over: 0 });
      pen(ctx, ellipse(cx - 9, cy - 12, 3.5, 2.5, Math.PI * 1.1, Math.PI * 1.9, 6), { w: 2, p: q, seed: 621 + i, boil, over: 0 }); pen(ctx, ellipse(cx + 9, cy - 12, 3.5, 2.5, Math.PI * 1.1, Math.PI * 1.9, 6), { w: 2, p: q, seed: 624 + i, boil, over: 0 });
      wash(ctx, ellipse(cx - 16, cy - 6, 5, 3, 0, 6.3, 8), '#e98b8b', { alpha: .6 * q, seed: 627 + i, boil, off: [0, 0] }); });
    pen(ctx, [[dx - 150, dy + 40], [dx + 40, dy - 60]], { w: 3.5, p: q, seed: 630, boil, color: '#7a4b2a' });
  });
  // 蒸籠窗戶（畫在照片上方，世界座標）
  { const tiers = [[540, 450], [930, 450], [540, 590], [930, 590], [540, 745], [930, 745]], faces = ['cat', 'dog', 'rabbit', 'cat', 'dog', 'rabbit'];
    tiers.forEach(([u, v], i) => { const open = PR(t, 6.6 + Math.floor(i / 2) * .6 - .05, 6.6 + Math.floor(i / 2) * .6 + .1); if (open <= 0) return; const [x, y] = P('steamer', u, v), w = 46, h = 38;
      wash(ctx, [[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h]], '#fff1c9', { alpha: .85 * open, seed: 640 + i, boil, off: [0, 0] });
      linesRect(x - w, y - h, x + w, y + h, open, 650 + i, boil, 2.4); animal(t, faces[i], x, y + 6, open, 660 + i * 5, boil); }); }
  // 4 珍奶：地磚、盆栽、三角旗、小雲、鳥
  at('tea', () => { const gp = PR(t, 7.9, 8.5), gy = 290;
    wash(ctx, [[-540, gy], [540, gy + 2], [540, 350], [-540, 350]], '#d6b896', { alpha: .45 * gp, seed: 401, boil, rough: 4 }); pen(ctx, [[-500, gy], [500, gy + 2]], { w: 3, p: gp, seed: 402, boil });
    for (let i = 0; i < 9; i++) { const x = -470 + i * 110; pen(ctx, [[x, gy + 2], [x - 12, gy + 55]], { w: 1.8, p: gp, seed: 403 + i, boil, over: 1 }); }
    const pp = PR(t, 8.0, 8.7), px = -360, py = gy;
    wash(ctx, [[px - 42, py - 84], [px + 42, py - 84], [px + 32, py], [px - 32, py]], '#d0784c', { alpha: .65 * pp, seed: 430, boil }); pen(ctx, [[px - 46, py - 84], [px + 46, py - 84], [px + 32, py], [px - 32, py], [px - 46, py - 84]], { w: 2.6, p: pp, seed: 431, boil });
    [[-1.9, 130], [-1.4, 150], [-1.05, 128], [-2.3, 104]].forEach(([a, l], i) => { const sw = Math.sin(t * 1.8 + i) * .04, ex = px + Math.cos(a + sw) * l, ey = py - 84 + Math.sin(a + sw) * l;
      pen(ctx, [[px, py - 84], [ex, ey]], { w: 2.2, p: pp, seed: 433 + i, boil });
      const lf = ellipse(ex, ey, 40, 26, 0, 6.3, 22).map(([x, y]) => { const dx = x - ex, dy = y - ey, c = Math.cos(a + sw + 1.57), s2 = Math.sin(a + sw + 1.57); return [ex + dx * c - dy * s2, ey + dx * s2 + dy * c]; });
      wash(ctx, lf, '#6fa15a', { alpha: .6 * pp, seed: 437 + i, boil }); pen(ctx, lf, { w: 2.2, p: pp, seed: 441 + i, boil }); });
    const fp = PR(t, 8.0, 8.8), fl = []; for (let i = 0; i <= 30; i++) { const u = i / 30; fl.push([-480 + u * 330, -330 + u * 60 + Math.sin(u * Math.PI) * 50]); }
    pen(ctx, fl, { w: 2.2, p: fp, seed: 450, boil }); const cols = ['#e7787a', '#f2c14e', '#6fb3c8', '#8cc084'];
    for (let i = 0; i < 5; i++) { const u = (i + .5) / 5, x = -480 + u * 330, y = -330 + u * 60 + Math.sin(u * Math.PI) * 50, sw = Math.sin(t * 3 + i) * 5, tri = [[x - 18, y], [x + 18, y], [x + sw, y + 42]];
      if (fp > u) { wash(ctx, tri, cols[i % 4], { alpha: .7, seed: 451 + i, boil }); pen(ctx, tri.concat([tri[0]]), { w: 2, seed: 457 + i, boil, over: 1 }); } }
    [[-330, -160], [-290, -130]].forEach(([x, y], i) => { const f = Math.sin(t * 8 + i * 2) * 6; pen(ctx, [[x - 14, y - f], [x, y], [x + 14, y - f]], { w: 2, p: PR(t, 8.2, 8.8), seed: 480 + i, boil, over: 0 }); });
  });
  // 5 蚊香：嗡嗡叫的小蚊子、仙人掌
  at('coil', () => { const p = PR(t, 10.9, 11.6);
    for (let m = 0; m < 2; m++) { const a = t * (2.2 + m) + m * 3, fle = Math.max(0, t - 12.05), mx = -320 + m * 620 + Math.cos(a) * 60 + (m ? 1 : -1) * fle * fle * 900, my = -230 + m * 60 + Math.sin(a * 1.3) * 40 - fle * 260;
      const tr = []; for (let i = 0; i < 16; i++) { const b = a - i * .12; tr.push([-320 + m * 620 + Math.cos(b) * 60, -230 + m * 60 + Math.sin(b * 1.3) * 40]); }
      if (p > 0) { for (let i = 0; i < 15; i += 3) pen(ctx, [tr[i], tr[i + 1]], { w: 1.6, seed: 700 + i + m * 20, boil, alpha: .6 * p, over: 0, gap: 0 });
        pen(ctx, ellipse(mx, my, 12, 9, 0, 6.6, 14), { w: 2.2, p, seed: 720 + m, boil }); wash(ctx, ellipse(mx, my, 12, 9, 0, 6.3, 14), '#8a8f9e', { alpha: .5 * p, seed: 722 + m, boil, off: [0, 0] });
        pen(ctx, [[mx + 10, my - 2], [mx + 26, my - 6]], { w: 1.8, p, seed: 724 + m, boil, over: 0 });
        const fw = Math.sin(t * 40 + m) * 6; pen(ctx, ellipse(mx - 4, my - 14 - fw * .3, 9, 6 + fw * .3, 0, 6.6, 10), { w: 1.6, p, seed: 726 + m, boil, over: 0 });
        [[-6, 8], [2, 9], [8, 8]].forEach(([lx, ly], j) => pen(ctx, [[mx + lx, my + ly - 2], [mx + lx - 4, my + ly + 12]], { w: 1.5, p, seed: 730 + j + m * 5, boil, over: 0 }));
        pen(ctx, [[mx + 18, my - 22], [mx + 21, my - 12]], { w: 2, p: PR(t, 11.6, 12), seed: 740 + m, boil, color: '#4e8fc8', over: 0 }); } }
    const q = PR(t, 11.0, 11.7), cx = 380, cy = 250; const pot = [[cx - 40, cy - 60], [cx + 40, cy - 60], [cx + 30, cy], [cx - 30, cy]];
    wash(ctx, pot, '#d0784c', { alpha: .6 * q, seed: 750, boil }); pen(ctx, pot.concat([pot[0]]), { w: 2.4, p: q, seed: 751, boil });
    const cac = D.path(`M ${cx - 18} ${cy - 60} C ${cx - 22} ${cy - 150} ${cx + 22} ${cy - 150} ${cx + 18} ${cy - 60}`);
    wash(ctx, cac, '#7fb069', { alpha: .6 * q, seed: 752, boil }); pen(ctx, cac, { w: 2.4, p: q, seed: 753, boil }); pen(ctx, D.path(`M ${cx + 16} ${cy - 100} C ${cx + 40} ${cy - 100} ${cx + 40} ${cy - 120} ${cx + 38} ${cy - 130}`), { w: 2.2, p: q, seed: 754, boil });
    wash(ctx, [[-540, 230], [540, 232], [540, 350], [-540, 350]], '#bfa9d6', { alpha: .35 * q, seed: 755, boil, rough: 4 }); pen(ctx, [[-500, 230], [500, 232]], { w: 2.6, p: q, seed: 756, boil });
  });
  // 6 塑膠凳：梯子、跳板、泳池、游泳圈
  at('stools', () => { const p = PR(t, 12.8, 13.5), [sx, sy] = [K.stoolTop[0] - CELL.stools[0], K.stoolTop[1] - CELL.stools[1]];
    const lx0 = sx - 210, lx1 = sx - 160; pen(ctx, [[lx0, sy + 10], [lx0 - 20, 260]], { w: 2.6, p, seed: 801, boil }); pen(ctx, [[lx1, sy + 10], [lx1 - 20, 260]], { w: 2.6, p, seed: 802, boil });
    for (let i = 0; i < 8; i++) { const y = sy + 40 + i * 30, d = (y - sy) / (260 - sy) * 20; pen(ctx, [[lx0 - d, y], [lx1 - d, y]], { w: 2.2, p, seed: 803 + i, boil, over: 1 }); }
    const bend = t > 14.0 && t < 14.5 ? 14 * Math.sin(prog(t, 14.0, 14.5) * Math.PI * 3) * Math.exp(-prog(t, 14.0, 14.5) * 2) : 0;
    const plank = [[sx + 60, sy - 6], [K.plankEnd[0] - CELL.stools[0], K.plankEnd[1] - CELL.stools[1] + bend], [K.plankEnd[0] - CELL.stools[0], K.plankEnd[1] - CELL.stools[1] + 14 + bend], [sx + 60, sy + 8]];
    wash(ctx, plank, '#f2f2f2', { alpha: .9 * p, seed: 812, boil }); pen(ctx, plank.concat([plank[0]]), { w: 2.6, p, seed: 813, boil });
    const q = PR(t, 13.0, 13.7), pl = [[100, 140], [500, 140], [520, 300], [80, 300]];
    wash(ctx, pl, '#6fb3d6', { alpha: .65 * q, seed: 820, boil }); pen(ctx, pl.concat([pl[0]]), { w: 2.8, p: q, seed: 821, boil });
    for (let i = 0; i < 3; i++) { const pts = []; for (let j = 0; j <= 20; j++) { const u = j / 20; pts.push([130 + u * 360, 175 + i * 40 + Math.sin(u * 12 + t * 3 + i) * 5]); } pen(ctx, pts, { w: 1.8, p: q, seed: 822 + i, boil, color: '#ffffff', gap: 0 }); }
    const rx = 420, ry = 200 + Math.sin(t * 2) * 4; wash(ctx, ellipse(rx, ry, 34, 18, 0, 6.3, 20), '#e0483d', { alpha: .7 * q, seed: 830, boil }); pen(ctx, ellipse(rx, ry, 34, 18), { w: 2.4, p: q, seed: 831, boil }); pen(ctx, ellipse(rx, ry, 14, 7), { w: 2, p: q, seed: 832, boil });
    // 水花
    const sp = prog(t, 14.5, 15.2); if (sp > 0 && sp < 1) for (let i = 0; i < 9; i++) { const a = -Math.PI * (.15 + .7 * i / 8), r = 40 + 260 * ease.out(sp), x0 = K.pool[0] - CELL.stools[0], y0 = K.pool[1] - CELL.stools[1] - 30;
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r * 1.1 + 400 * sp * sp; wash(ctx, ellipse(x0 + dx, y0 + dy, 9, 12, 0, 6.3, 10), '#6fb3d6', { alpha: .8 * (1 - sp), seed: 840 + i, boil, off: [0, 0] }); pen(ctx, ellipse(x0 + dx, y0 + dy, 9, 12), { w: 2, seed: 850 + i, boil, alpha: 1 - sp }); }
  });
  // 7 藍白拖：水窪、漣漪、小紙船
  at('slippers', () => { const p = PR(t, 14.9, 15.6), pud = []; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r = 1 + .06 * Math.sin(a * 5); pud.push([Math.cos(a) * 420 * r, 70 + Math.sin(a) * 210 * r]); }
    wash(ctx, pud, '#8ab8d8', { alpha: .55 * p, seed: 901, boil, rough: 6 }); pen(ctx, pud.concat([pud[0]]), { w: 2.6, p, seed: 902, boil });
    for (let i = 0; i < 4; i++) { const ph = ((t * .6 + i * .25) % 1), cx = -250 + i * 170, cy = 180 + (i % 2) * 60; if (t > 15.0) pen(ctx, ellipse(cx, cy, 20 + ph * 60, 6 + ph * 18, 0, 6.6, 20), { w: 1.8, seed: 910 + i, boil, alpha: .8 * (1 - ph), gap: 0 }); }
    const q = PR(t, 15.2, 15.9), bx = -380, by = 140 + Math.sin(t * 2) * 4; const hull = [[bx - 50, by], [bx + 50, by], [bx + 30, by + 26], [bx - 30, by + 26]];
    wash(ctx, hull, '#ffffff', { alpha: 0 }); pen(ctx, hull.concat([hull[0]]), { w: 2.4, p: q, seed: 920, boil }); pen(ctx, [[bx - 30, by], [bx, by - 50], [bx + 30, by]], { w: 2.4, p: q, seed: 921, boil });
  });
  // 船帆（畫在右邊拖鞋上，世界座標）
  if (t > 15.0) { const q = PR(t, 15.0, 15.6), b = boatBob(t), [mx, my] = P('slippers', 1060, 640); const m0 = [mx + b[0], my + b[1]];
    pen(ctx, [m0, [m0[0] + 4, m0[1] - 240]], { w: 3, p: q, seed: 930, boil }); const sail = [[m0[0] + 8, m0[1] - 230], [m0[0] + 8, m0[1] - 40], [m0[0] + 140 + Math.sin(t * 2) * 8, m0[1] - 60]];
    wash(ctx, sail, '#f6e7b4', { alpha: .85 * q, seed: 931, boil }); pen(ctx, sail.concat([sail[0]]), { w: 2.6, p: q, seed: 932, boil });
    const fl = [[m0[0] + 4, m0[1] - 240], [m0[0] + 44, m0[1] - 228 + Math.sin(t * 6) * 5], [m0[0] + 4, m0[1] - 214]]; wash(ctx, fl, '#d8463c', { alpha: .8 * q, seed: 933, boil }); pen(ctx, fl, { w: 2, p: q, seed: 934, boil }); }
  // 8 電扇：西瓜、夏天的太陽
  at('fan', () => { const p = PR(t, 18.0, 18.7), wx = -340, wy = 230, sl = ellipse(wx, wy, 90, 70, Math.PI, Math.PI * 2, 24);
    wash(ctx, sl, '#e7686a', { alpha: .75 * p, seed: 1001, boil }); pen(ctx, sl.concat([sl[0]]), { w: 2.6, p, seed: 1002, boil }); pen(ctx, ellipse(wx, wy - 2, 90, 10, Math.PI, Math.PI * 2, 20), { w: 4, p, seed: 1003, boil, color: '#5f9e4f' });
    for (let i = 0; i < 6; i++) pen(ctx, ellipse(wx - 50 + i * 20, wy - 30 - (i % 2) * 12, 3, 5, 0, 6.6, 6), { w: 2.4, p, seed: 1004 + i, boil, over: 0 });
    const sp = PR(t, 18.1, 18.8); wash(ctx, ellipse(360, -280, 34, 34, 0, 6.3, 20), '#f2a93b', { alpha: .65 * sp, seed: 1010, boil }); pen(ctx, ellipse(360, -280, 34, 34), { w: 2.4, p: sp, seed: 1011, boil });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + t * .4, r1 = 62 + 6 * Math.sin(t * 5 + i); pen(ctx, [[360 + Math.cos(a) * 46, -280 + Math.sin(a) * 46], [360 + Math.cos(a) * r1, -280 + Math.sin(a) * r1]], { w: 2.2, p: sp, seed: 1012 + i, boil, over: 0 }); }
    const tp = PR(t, 18.0, 18.6); wash(ctx, [[-540, 270], [540, 272], [540, 350], [-540, 350]], '#a9cfc0', { alpha: .45 * tp, seed: 1020, boil, rough: 4 }); pen(ctx, [[-500, 270], [500, 272]], { w: 2.6, p: tp, seed: 1021, boil });
  });
  // 電扇轉動：扇葉上的動態圈＋風線
  if (t > 19.4) { const on = prog(t, 19.4, 19.9), c = K.fanC; for (let i = 0; i < 3; i++) { const a0 = t * 14 + i * 2.1; pen(ctx, ellipse(c[0] + 60, c[1], 120 + i * 24, 160 + i * 26, a0, a0 + 1.3, 16), { w: 2.2, seed: 1030 + i, boil, alpha: .45 * on, over: 0, gap: 0 }); }
    for (let i = 0; i < 4; i++) wind(t, 19.5 + i * .35, c[0] + 140, c[1] - 120 + i * 60, 380, 1040 + i); }
  // 9 彈珠台（夜市）：燈籠串、星星、月亮
  at('pinball', () => { const p = PR(t, 20.9, 21.7), fl = []; for (let i = 0; i <= 30; i++) { const u = i / 30; fl.push([-500 + u * 1000, -330 + Math.sin(u * Math.PI) * 70]); }
    pen(ctx, fl, { w: 2.2, p, seed: 1101, boil });
    for (let i = 0; i < 5; i++) { const u = (i + .5) / 5, x = -500 + u * 1000, y = -330 + Math.sin(u * Math.PI) * 70 + 34, sw = Math.sin(t * 2 + i) * .06; if (p < u) continue;
      const lan = ellipse(x, y, 26, 30, 0, 6.6, 18).map(([a, b]) => [x + (a - x) * Math.cos(sw) - (b - y + 30) * Math.sin(sw), y - 30 + (a - x) * Math.sin(sw) + (b - y + 30) * Math.cos(sw)]);
      wash(ctx, lan, '#e0483d', { alpha: .85, seed: 1102 + i, boil }); pen(ctx, lan, { w: 2.2, seed: 1110 + i, boil });
      ctx.save(); ctx.globalAlpha = .35 + .15 * Math.sin(t * 5 + i); const g = ctx.createRadialGradient(x, y, 0, x, y, 70); g.addColorStop(0, 'rgba(255,200,120,.9)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 70, y - 70, 140, 140); ctx.restore(); }
    const q = PR(t, 21.0, 21.8); for (let i = 0; i < 10; i++) { const x = -480 + hash(i, 3) * 960, y = -260 + hash(i, 4) * 520; if (Math.abs(x) < 250 && y > -230) continue; ctx.save(); ctx.globalAlpha = q * (.6 + .4 * Math.sin(t * 4 + i)); ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); ctx.restore(); }
  });
  // 彈珠台的「叮」閃光
  if (t > 21.9 && t < 23.9) for (let i = 0; i < 6; i++) { const t0 = 21.8 + (i + 1) * .3, d = t - t0; if (d < 0 || d > .3) continue; const [x, y] = K.bounce[i]; for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2, r0 = 20 + d * 120, r1 = r0 + 20;
    pen(ctx, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], { w: 2.6, seed: 1130 + j, boil, color: '#fff2b0', alpha: 1 - d / .3, over: 0 }); } }
  if (t > 23.6 && t < 25) { const d = t - 23.6, [x, y] = K.bounce[5]; for (let j = 0; j < 5; j++) star4(t, x + Math.cos(j * 1.26 + d * 2) * (60 + d * 80), y - 40 + Math.sin(j * 1.26 + d * 2) * (40 + d * 50), 14, 1140 + j, 1); }
  // 10 紅白袋（夜空）：月亮、星星、煙火
  at('bagr', () => { const p = PR(t, 23.6, 24.4); const moon = D.path('M 300 -330 C 250 -320 240 -250 290 -230 C 255 -250 260 -310 300 -330');
    wash(ctx, moon, '#f6e08e', { alpha: .9 * p, seed: 1201, boil, off: [0, 0] }); pen(ctx, moon, { w: 2.6, p, seed: 1202, boil });
    for (let i = 0; i < 12; i++) { const x = -480 + hash(i, 13) * 960, y = -320 + hash(i, 14) * 560; if (Math.abs(x) < 230) continue; ctx.save(); ctx.globalAlpha = p * (.6 + .4 * Math.sin(t * 4 + i)); ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); ctx.restore(); }
    [[26.3, -330, -150, '#f2c14e'], [26.9, 330, -60, '#e7787a'], [27.6, -300, 120, '#8fd0e8']].forEach(([t0, x, y, col], i) => { const d = t - t0; if (d < 0) return; const k = ease.out(clamp(d / .6)), fade = clamp(1 - (d - .8) / 1.6);
      for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2; pen(ctx, [[x + Math.cos(a) * 20 * k, y + Math.sin(a) * 20 * k], [x + Math.cos(a) * 90 * k, y + Math.sin(a) * 90 * k + 20 * d * d]], { w: 2.6, seed: 1210 + j + i * 20, boil, color: col, alpha: fade, over: 0 }); } });
  });
  // 雨（14.8–18.6）
  if (t > 14.7 && t < 17.2) { const a = clamp((t - 14.7) / .4) * clamp((17.2 - t) / .4); for (let i = 0; i < 70; i++) { const x = 1050 + hash(i, 21) * 1150, y0 = 1050 + ((hash(i, 22) * 1500 + t * 1100) % 1500);
    pen(ctx, [[x, y0], [x - 8, y0 + 34]], { w: 2.2, seed: 1300 + i, boil, color: '#4e7fb8', alpha: .75 * a, over: 0, gap: 0 }); } }
}
// 小動物的臉
function animal(t, kind, x, y, p, seed, boil) {
  const face = ellipse(x, y, 22, 19, 0, 6.6, 20); wash(ctx, face, kind === 'cat' ? '#f2c38a' : kind === 'dog' ? '#d9b28c' : '#f2f2f2', { alpha: .8 * p, seed, boil, off: [0, 0] }); pen(ctx, face, { w: 2.2, p, seed: seed + 1, boil });
  if (kind === 'cat') { pen(ctx, [[x - 18, y - 10], [x - 14, y - 28], [x - 4, y - 18]], { w: 2.2, p, seed: seed + 2, boil, over: 0 }); pen(ctx, [[x + 18, y - 10], [x + 14, y - 28], [x + 4, y - 18]], { w: 2.2, p, seed: seed + 3, boil, over: 0 }); }
  if (kind === 'dog') { pen(ctx, ellipse(x - 22, y - 2, 7, 14, -.3, 6.6, 10), { w: 2.2, p, seed: seed + 2, boil }); pen(ctx, ellipse(x + 22, y - 2, 7, 14, .3, 6.6, 10), { w: 2.2, p, seed: seed + 3, boil }); }
  if (kind === 'rabbit') { pen(ctx, ellipse(x - 8, y - 32, 5, 15, 0, 6.6, 10), { w: 2.2, p, seed: seed + 2, boil }); pen(ctx, ellipse(x + 8, y - 32, 5, 15, 0, 6.6, 10), { w: 2.2, p, seed: seed + 3, boil }); }
  const bl = ((t + seed * .37) % 2.2) < .1; ctx.save(); ctx.fillStyle = D.INK; [[-8, -2], [8, -2]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 2.6, bl ? .6 : 2.8, 0, 0, 7); ctx.fill(); }); ctx.restore();
  pen(ctx, ellipse(x, y + 6, 5, 3, .2, Math.PI - .2, 6), { w: 1.8, p, seed: seed + 4, boil, over: 0 });
}

// —— 電扇真的轉：無扇葉底圖＋扇葉層（繞軸旋轉、按轉速做動態模糊）＋前景（輪轂蓋、鋼絲） ——
let FO, BL;
const FC = [868, 382], FAS = .72;                    // 扇葉平面的中心與透視壓縮比（橫/縱）
function fanAngle(t) { const d = t - 19.4, a = 45, T0 = .7; return d < T0 ? .5 * a / T0 * d * d : .5 * a * T0 + a * (d - T0); }   // 0.7 秒加速到 45 rad/s
function fanFrame(t) {
  if (!FO) { FO = document.createElement('canvas'); FO.width = 1536; FO.height = 1024; BL = document.createElement('canvas'); BL.width = 1536; BL.height = 1024; }
  const g = FO.getContext('2d'), b = BL.getContext('2d'), th = fanAngle(t), om = Math.min(45, 45 * (t - 19.4) / .7), span = Math.min(Math.PI / 2, om / 24 * .9), N = 14;
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, 1536, 1024);
  for (let j = 0; j < N; j++) { const a = th - span * j / N; b.globalAlpha = 1 / (j + 1);
    b.setTransform(1, 0, 0, 1, 0, 0); b.translate(FC[0], FC[1]); b.scale(FAS, 1); b.rotate(a); b.scale(1 / FAS, 1); b.translate(-FC[0], -FC[1]); b.drawImage(IMG.fanBlades, 0, 0); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.drawImage(IMG.fanBg, 0, 0); g.drawImage(BL, 0, 0); g.drawImage(IMG.fanFront, 0, 0);
  return FO;
}
// —— 主畫面 ——
function scene(t) {
  const boil = Math.floor(t * 12);
  deco(t);
  // 照片（multiply 疊上；紅白袋在 24.8 秒由塗鴉轉為照片）
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  for (const k in PL) { if (k === 'bagr') continue; const b = PL[k]; let ox = 0, oy = 0, rot = 0;
    if (k === 'slippers' && t > 15.0) { const bb = boatBob(t); ox = bb[0]; oy = bb[1]; }
    if (k === 'fan' && t > 19.4) { ctx.drawImage(fanFrame(t), b.x, b.y, IMG[k].width * b.s, IMG[k].height * b.s); continue; }
    ctx.drawImage(IMG[k], b.x + ox, b.y + oy, IMG[k].width * b.s, IMG[k].height * b.s); }
  const ba = ease.io(prog(t, 24.8, 25.4)); if (ba > 0) { const b = PL.bagr, u = balloonUp(t), pulse = 1 + .05 * Math.sin(prog(t, 24.8, 25.6) * Math.PI);
    const cx = K.bagSpot[0], cy = K.bagSpot[1]; ctx.globalAlpha = ba; ctx.translate(cx + u[0], cy + u[1]); ctx.scale(pulse, pulse); ctx.translate(-cx, -cy); ctx.drawImage(IMG.bagr, b.x, b.y, IMG.bagr.width * b.s, IMG.bagr.height * b.s); }
  ctx.restore();

  // 蒸汽與雲
  if (t > 4.1 && t < 6.5) steam(t, K.knob[0], K.knob[1], 4.15, { len: 230, erase: 5.6 });
  if (t > 4.4 && t < 6.9) { const c = cloudPos(t), fade = 1 - prog(t, 6.4, 6.9); D.ga = fade; cloud(t, c[0], c[1], 300, 140, prog(t, 4.45, 5.0)); D.ga = 1;
    if (t > 5.4 && t < 6.3) { const k = prog(t, 5.4, 5.7), f = prog(t, 5.8, 6.25); [[-1, 0], [1, 1], [-1, 2], [1, 3]].forEach(([sd, j]) => { const x0 = c[0] + sd * (165 + (j > 1 ? 20 : 0)), y0 = c[1] - 10 + (j > 1 ? 50 : 0);
      pen(ctx, D.bez([x0, y0], [x0 + sd * 10, y0 + 40], [x0 + sd * 6, y0 + 80], [x0 - sd * 4, y0 + 110], 10), { w: 2.2, seed: 80 + j, boil, p: k, from: f, gap: 0 }); }); } }
  // 早餐盤：荷包蛋太陽（光芒＋笑臉）
  { const p = PR(t, .2, 1.0), [ex, ey] = P('plate', 755, 490), r = 130 * PL.plate.s;
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + t * .5, r0 = r * 1.25, r1 = r * (1.6 + .08 * Math.sin(t * 6 + i)); pen(ctx, [[ex + Math.cos(a) * r0, ey + Math.sin(a) * r0 * .8], [ex + Math.cos(a) * r1, ey + Math.sin(a) * r1 * .8]], { w: 2.6, p, seed: 1500 + i, boil, over: 0 }); }
    pen(ctx, ellipse(ex - r * .35, ey - r * .05, 6, 5, Math.PI * 1.1, Math.PI * 1.9, 8), { w: 2.6, p, seed: 1511, boil, over: 0 }); pen(ctx, ellipse(ex + r * .35, ey - r * .05, 6, 5, Math.PI * 1.1, Math.PI * 1.9, 8), { w: 2.6, p, seed: 1512, boil, over: 0 });
    pen(ctx, ellipse(ex, ey + r * .2, 16, 10, .2, Math.PI - .2, 10), { w: 2.6, p, seed: 1513, boil, over: 0 }); }
  // 珍珠 → 氣球
  const BAL = [[-40, -210], [30, -190], [-80, -150], [0, -270], [70, -250]];
  for (let i = 0; i < 5; i++) { const t0 = 9.0 + i * .1, k1 = prog(t, t0, t0 + .35), k2 = prog(t, t0 + .35, 9.6 + i * .07), k3 = ease.back(prog(t, 9.6 + i * .07, 9.95 + i * .07));
    if (t < 8.8 || t > 12.5) continue;
    if (t < t0) { ticks(t, K.pearls[i][0], K.pearls[i][1], 20, 90 + i * 3); continue; }
    let x, y, r = 15;
    if (k2 <= 0) { x = lerp(K.pearls[i][0], K.strawB[0], ease.io(k1)); y = lerp(K.pearls[i][1], K.strawB[1], ease.io(k1)); }
    else if (k3 <= 0) { x = lerp(K.strawB[0], K.strawT[0], k2); y = lerp(K.strawB[1], K.strawT[1], k2); r = 13; }
    else { const g = gatherPt(t), rel = t < 10.6 ? [K.strawT[0] + 60 + BAL[i][0], K.strawT[1] - 140 + BAL[i][1]] : [g[0] + BAL[i][0], g[1] + BAL[i][1]];
      x = lerp(K.strawT[0], rel[0], k3) + Math.sin(t * 2.5 + i) * 4; y = lerp(K.strawT[1], rel[1], k3) - (t > 11.6 ? (t - 11.6) * 500 : 0); r = lerp(13, 32, k3);
      const gp = t > 11.6 ? [g[0], g[1] - (t - 11.6) * 500 + 60] : g; pen(ctx, D.bez([x, y + r], [x + (gp[0] - x) * .3, y + r + 40], [gp[0], gp[1] - 50], gp, 12), { w: 1.8, seed: 100 + i, boil, over: 0, p: clamp(k3 * 1.4), gap: 0 }); }
    pearl(t, x, y, r, 110 + i * 4, { knot: k3 > .5 }); }
  // 蚊香溜滑梯的速度線
  if (t > 11.7 && t < 13.0) { const k = ease.in(prog(t, 11.6, 12.9)); for (let j = 1; j < 4; j++) { const a = spiral(Math.max(0, k - j * .03)), b = spiral(Math.max(0, k - j * .03 - .03)); pen(ctx, [a, b], { w: 2.2, seed: 1600 + j, boil, over: 0, gap: 0, alpha: 1 - j * .25 }); } }

  // 蚊香被點著：麻雀滑過的地方變成發光的引信，冒煙
  if (t > 11.6 && t < 21) { const k = ease.in(prog(t, 11.6, 12.9)), fade = 1 - prog(t, 14.5, 16), pts = []; for (let i = 0; i <= 160 * k; i++) pts.push(spiral(i / 160));
    if (pts.length > 1 && fade > 0) { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; const fl = .75 + .25 * Math.sin(t * 13);
      ctx.globalAlpha = .4 * fade * fl; ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 38; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      ctx.globalAlpha = .95 * fade; ctx.strokeStyle = '#ff6a1f'; ctx.lineWidth = 10; ctx.stroke(); ctx.restore();
      const hd = pts[pts.length - 1]; if (t < 13.0) for (let j = 0; j < 7; j++) { const a = hash(j, Math.floor(t * 24)) * 6.28, r = 10 + hash(j, Math.floor(t * 24) + 1) * 40; ctx.save(); ctx.fillStyle = '#ffd36a'; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(hd[0] + Math.cos(a) * r, hd[1] + Math.sin(a) * r, 3.5, 0, 7); ctx.fill(); ctx.restore(); }
      for (let j = 0; j < 7; j++) { const u = (j + .5) / 7; if (u > k) continue; const [x0, y0] = spiral(u), sm = []; for (let i = 0; i <= 16; i++) { const v = i / 16; sm.push([x0 + Math.sin(v * 7 + t * 2.5 + j) * 14 * v, y0 - v * (110 + 40 * Math.sin(j))]); }
        pen(ctx, sm, { w: 2, seed: 1900 + j, boil, gap: 0, alpha: .55 * fade, p: clamp((t - 11.6 - u * 1.2) / .6), color: '#7d7a86' }); } } }
  // 拖鞋小船：浪、青蛙撐葉子傘、跳出水面的魚、麻雀划槳、雨停後的彩虹
  if (t > 14.9) { const [cx, cy] = CELL.slippers, bb = boatBob(t);
    for (let r = 0; r < 4; r++) { const y = cy + 140 + r * 48, ph = t * (60 + r * 15) + r * 40, wv = []; for (let i = 0; i <= 50; i++) { const x = cx - 400 + i * 16; wv.push([x, y + Math.sin((x + ph) * .045) * 7]); }
      pen(ctx, wv, { w: 2, seed: 2000 + r, boil, gap: 0, alpha: .55, p: PR(t, 15.0 + r * .1, 15.6 + r * .1), color: '#3f6f9e' });
      for (let i = 0; i < 4; i++) { const x = cx - 380 + ((i * 230 + ph * 1.1) % 800), yy = y + Math.sin((x + ph) * .045) * 7 - 6; pen(ctx, [[x - 10, yy + 4], [x, yy - 4], [x + 10, yy + 4]], { w: 2.2, seed: 2010 + i + r * 4, boil, color: '#ffffff', over: 0, alpha: .9 * PR(t, 15.2, 15.7) }); } }
    // 青蛙
    const fp = PR(t, 15.3, 15.9), fx = cx - 198 + bb[0], fy = cy + 40 + bb[1], wave = Math.sin(t * 7) * .5;
    const fb = ellipse(fx, fy, 36, 27, 0, 6.6, 22); fillPoly(fb, PAPER, fp); wash(ctx, fb, '#7fbf5f', { alpha: .75 * fp, seed: 2020, boil }); pen(ctx, fb, { w: 2.4, p: fp, seed: 2021, boil });
    [[-14, -24], [14, -24]].forEach(([dx, dy], i) => { const e = ellipse(fx + dx, fy + dy, 10, 10, 0, 6.6, 14); fillPoly(e, '#fbfaf3', fp); wash(ctx, e, '#7fbf5f', { alpha: .5 * fp, seed: 2022 + i, boil }); pen(ctx, e, { w: 2.2, p: fp, seed: 2024 + i, boil });
      const bl = ((t + i * .05) % 2.4) < .1; ctx.save(); ctx.globalAlpha = fp; ctx.fillStyle = D.INK; ctx.beginPath(); ctx.ellipse(fx + dx + 1, fy + dy + 1, 3.5, bl ? .7 : 3.8, 0, 0, 7); ctx.fill(); ctx.restore(); });
    pen(ctx, ellipse(fx, fy + 4, 15, 8, .15, Math.PI - .15, 12), { w: 2.2, p: fp, seed: 2026, boil, over: 0 }); wash(ctx, ellipse(fx - 22, fy + 2, 6, 4, 0, 6.3, 10), '#e98b8b', { alpha: .6 * fp, seed: 2027, boil, off: [0, 0] }); wash(ctx, ellipse(fx + 22, fy + 2, 6, 4, 0, 6.3, 10), '#e98b8b', { alpha: .6 * fp, seed: 2028, boil, off: [0, 0] });
    const st0 = [fx + 30, fy + 6], st1 = [fx + 44, fy - 100]; pen(ctx, [st0, st1], { w: 2.4, p: fp, seed: 2029, boil });
    const leaf = []; for (let i = 0; i <= 26; i++) { const a = Math.PI + i / 26 * Math.PI; leaf.push([st1[0] + Math.cos(a) * 82, st1[1] + Math.sin(a) * 38 * (1 + .1 * Math.sin(i * 1.7))]); }
    fillPoly(leaf, PAPER, fp); wash(ctx, leaf, '#5f9e4f', { alpha: .7 * fp, seed: 2030, boil }); pen(ctx, leaf.concat([leaf[0]]), { w: 2.4, p: fp, seed: 2031, boil });
    for (let i = 0; i < 5; i++) { const a = Math.PI + (i + .5) / 5 * Math.PI; pen(ctx, [st1, [st1[0] + Math.cos(a) * 70, st1[1] + Math.sin(a) * 32]], { w: 1.6, p: fp, seed: 2032 + i, boil, over: 0 }); }
    pen(ctx, [[fx - 30, fy - 2], [fx - 52, fy - 20 + wave * 20], [fx - 58, fy - 38 + wave * 30]], { w: 2.4, p: fp, seed: 2040, boil, over: 0 });
    // 魚跳出水面
    const fk = prog(t, 15.95, 16.6); if (fk > 0 && fk < 1) { const x = lerp(cx - 330, cx - 40, fk), y = cy + 230 - Math.sin(fk * Math.PI) * 230, ang = Math.atan2(-Math.cos(fk * Math.PI) * 230 * Math.PI, 290);
      const body = ellipse(0, 0, 40, 17, 0, 6.6, 20).map(([u, v]) => [x + u * Math.cos(ang) - v * Math.sin(ang), y + u * Math.sin(ang) + v * Math.cos(ang)]);
      const tail = [[-38, 0], [-62, -18], [-58, 18]].map(([u, v]) => [x + u * Math.cos(ang) - v * Math.sin(ang), y + u * Math.sin(ang) + v * Math.cos(ang)]);
      fillPoly(body, PAPER); wash(ctx, body, '#f08a3c', { alpha: .8, seed: 2050, boil }); wash(ctx, tail, '#f08a3c', { alpha: .8, seed: 2051, boil }); pen(ctx, body, { w: 2.4, seed: 2052, boil }); pen(ctx, tail.concat([tail[0]]), { w: 2.2, seed: 2053, boil });
      const [ex, ey] = [x + 22 * Math.cos(ang) - (-5) * Math.sin(ang), y + 22 * Math.sin(ang) + (-5) * Math.cos(ang)]; ctx.save(); ctx.fillStyle = D.INK; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, 7); ctx.fill(); ctx.restore(); }
    [[15.95, cx - 330], [16.6, cx - 40]].forEach(([t0, x], i) => { const d = t - t0; if (d < 0 || d > .6) return; for (let j = 0; j < 6; j++) { const a = -Math.PI * (.15 + .7 * j / 5), r = 20 + d * 160; wash(ctx, ellipse(x + Math.cos(a) * r, cy + 225 + Math.sin(a) * r + 300 * d * d, 6, 8, 0, 6.3, 8), '#6fb3d6', { alpha: .8 * (1 - d / .6), seed: 2060 + j + i * 6, boil, off: [0, 0] }); } });
    // 彩虹（雨停之後）
    const rp = PR(t, 16.95, 17.6); if (rp > 0) ['#e7686a', '#f2a93b', '#f2d24e', '#7fbf5f', '#6fb3d6', '#8a7fd0'].forEach((col, i) => { const r = 470 - i * 22, arc = []; for (let j = 0; j <= 40; j++) { const a = Math.PI + j / 40 * Math.PI; arc.push([cx + Math.cos(a) * r, cy + 10 + Math.sin(a) * r * .62]); }
      pen(ctx, arc, { w: 20, p: rp, seed: 2070 + i, boil, color: col, alpha: .55, over: 0, gap: 0, wob: .6 }); }); }
  // 紅白袋（塗鴉）＋身後紅點路線
  for (let k = 1; k <= 9; k++) { const tt = t - k * .06; if (tt < 2.45 || (tt > 6.6 && tt < 10.4) || (tt > 15.2 && tt < 17.6) || tt > 24.0) continue; const [qx, qy] = bagState(tt).p;
    ctx.save(); ctx.globalAlpha = .55 * (1 - k / 10); ctx.fillStyle = '#d8463c'; ctx.beginPath(); ctx.arc(qx, qy + 30, 5 - k * .3, 0, 7); ctx.fill(); ctx.restore(); }
  const bs = bagState(t), da = 1 - ease.io(prog(t, 24.9, 25.4)); if (da > 0) { D.ga = da; bag(t, bs.p[0], bs.p[1], bs.s, { flutter: bs.fl, rot: bs.rot || 0 }); D.ga = 1; }
  // 熱氣球：繩子＋籃子
  if (t > 25.0) { const p = PR(t, 25.0, 25.6), u = balloonUp(t), [l0, r0] = [P('bagr', 600, 880), P('bagr', 1010, 880)], by = K.bagSpot[1] + 330 + u[1], bx = K.bagSpot[0] + u[0];
    const L0 = [l0[0] + u[0], l0[1] + u[1]], R0 = [r0[0] + u[0], r0[1] + u[1]];
    pen(ctx, [L0, [bx - 70, by - 50]], { w: 2.4, p, seed: 1700, boil }); pen(ctx, [R0, [bx + 70, by - 50]], { w: 2.4, p, seed: 1701, boil });
    const bk = [[bx - 80, by - 50], [bx + 80, by - 50], [bx + 64, by + 30], [bx - 64, by + 30]];
    wash(ctx, bk, '#c99a63', { alpha: .8 * p, seed: 1702, boil }); pen(ctx, bk.concat([bk[0]]), { w: 2.8, p, seed: 1703, boil });
    for (let i = 0; i < 5; i++) pen(ctx, [[bx - 60 + i * 30, by - 46], [bx - 52 + i * 26, by + 26]], { w: 1.8, p, seed: 1704 + i, boil, over: 0 });
    pen(ctx, [[bx - 74, by - 10], [bx + 74, by - 10]], { w: 1.8, p, seed: 1710, boil }); }
  // 麻雀
  const S = spState(t); if (S) { if (t > 25.9 && t < 33) { /* 坐在籃子裡：先畫麻雀再補籃子前緣 */ } sparrow(t, S.pos[0], S.pos[1], S.s, S.o);
    if (t > 25.9) { const u = balloonUp(t), by = K.bagSpot[1] + 330 + u[1], bx = K.bagSpot[0] + u[0]; const bk = [[bx - 80, by - 18], [bx + 80, by - 18], [bx + 64, by + 30], [bx - 64, by + 30]];
      wash(ctx, bk, '#c99a63', { alpha: .95, seed: 1720, boil }); pen(ctx, bk.concat([bk[0]]), { w: 2.8, seed: 1721, boil }); for (let i = 0; i < 5; i++) pen(ctx, [[bx - 58 + i * 29, by - 14], [bx - 50 + i * 25, by + 26]], { w: 1.8, seed: 1722 + i, boil, over: 0 }); } }

  if (S && t > 15.4 && t < 17.6) { const a = .5 + Math.sin(t * 5) * .45, px = S.pos[0] - 6, py = S.pos[1] + 18; pen(ctx, [[px - Math.cos(a) * 40, py - Math.sin(a) * 40], [px + Math.cos(a) * 110, py + Math.sin(a) * 110]], { w: 3.5, seed: 2080, boil: Math.floor(t * 12), color: '#8a5a32' });
    const ex = px + Math.cos(a) * 110, ey = py + Math.sin(a) * 110; wash(ctx, ellipse(ex, ey, 9, 20, a, a + 6.3, 12), '#c99a63', { alpha: .9, seed: 2081, boil: Math.floor(t * 12), off: [0, 0] }); }
  // 風
  wind(t, 2.4, CELL.plate[0] - 520, CELL.plate[1] - 60, 520, 3); wind(t, 2.55, CELL.plate[0] - 480, CELL.plate[1] + 20, 460, 4);
  wind(t, 10.4, K.strawT[0] - 300, K.strawT[1] + 60, 320, 5);
  // 擬聲字
  TX.forEach(x => write(ctx, x.s, x.x, x.y, x.size, t, x.t0, x.o));
  // 結尾：路線（紅色虛線）＋標題
  if (t > 27.4) { const route = [K.rim, K.lid, K.stTop, K.teaGround, K.coilC, K.stoolTop, K.boat, K.fanTop, K.entry, K.bagSpot], pts = [];
    for (let i = 0; i < route.length - 1; i++) pts.push(...D.bez(route[i], [route[i][0], route[i][1] - 260], [route[i + 1][0], route[i + 1][1] + 260], route[i + 1], 24));
    const kk = ease.io(prog(t, 27.6, 29.8)), n = Math.floor(pts.length * kk);
    for (let i = 0; i + 2 < n; i += 4) pen(ctx, [pts[i], pts[i + 1], pts[i + 2]], { w: 7, seed: 1800 + i, boil, color: '#d8463c', over: 0, gap: 0, alpha: .85 });
    write(ctx, '台灣生活圖鑑', 1080 - 3 * 230 * .92, 400, 230, t, 29.0, { per: .2 });
    const ul = PR(t, 30.2, 31.0); pen(ctx, D.bez([450, 450], [800, 470], [1300, 435], [1720, 455], 20), { w: 6, p: ul, seed: 1850, boil, color: '#d8463c' }); }
}

let PT;
function render(t) {
  const c = cam(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  if (MODE === 'sheet') return sheet(t);
  const z = c.z * SC, rr = camRot(t), cr = Math.cos(rr), sr = Math.sin(rr);
  ctx.setTransform(z * cr, z * sr, -z * sr, z * cr, W / 2 - (c.x * cr - c.y * sr) * z, H / 2 - (c.x * sr + c.y * cr) * z);
  page(); scene(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(1, 'rgba(60,40,20,.15)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (t > DUR - .9) { ctx.fillStyle = `rgba(242,235,221,${ease.in(prog(t, DUR - .9, DUR))})`; ctx.fillRect(0, 0, W, H); }
}
function sheet(t) {
  ctx.setTransform(SC, 0, 0, SC, 0, 0); ctx.fillStyle = ctx.createPattern(PT, 'repeat'); ctx.fillRect(0, 0, 1080, 1920);
  const poses = [['坐', {}], ['開心', { expr: 'happy' }], ['驚訝', { expr: 'surprise', look: -.3 }], ['堅定', { expr: 'determined', sq: .14 }], ['跳', { sq: -.12, legs: 1, flap: .5, expr: 'determined' }], ['飛', { flap: 1, legs: 1, expr: 'shout' }], ['翻滾', { rot: 1.2, expr: 'surprise' }], ['畫出中', { p: .5 }]];
  poses.forEach(([name, o], i) => { const x = 270 + (i % 2) * 540, y = 260 + Math.floor(i / 2) * 400; sparrow(t, x, y, 3.2, o); write(ctx, name, x - 60, y + 175, 56, 10, 0); });
}
window.TEXTS = t => TX.filter(x => t >= x.t0).map((x, i) => ({ id: 'tx' + i, text: x.s, x0: 0, y0: 0, x1: 1, y1: 1 }));
window.render = render;
const ALL = ['plate', 'cooker', 'steamer', 'tea', 'coil', 'stools', 'slippers', 'fan', 'pinball', 'bagr'];
Promise.all([...ALL.map(k => load(k, `img/${k}_m.png`)), load('fanBg', 'img/fan_bg_m.png'), load('fanBlades', 'img/fan_blades.png'), load('fanFront', 'img/fan_front.png'), document.fonts.load('700 40px WK', '噗～啵！呼咚咻撲通嘩嗡叮台灣生活圖鑑')]).then(() => {
  PT = D.paperTile(); keys(); texts(); events(); window.EV = EV; window.READY = true; });
