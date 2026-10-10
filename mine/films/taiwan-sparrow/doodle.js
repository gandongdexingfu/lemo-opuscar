// doodle.js — 鋼筆淡彩塗鴉小引擎（確定性）
// 墨線：抖動、超出頭、偶爾斷筆、逐筆畫出、12fps boil；淡彩：錯位、溢出、乾邊、綻開
(function () {
  const D = {};
  D.INK = '#3a2a1f';
  // —— 確定性亂數 ——
  const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; h ^= h >>> 16; return ((h >>> 0) % 100000) / 100000; };
  D.hash = hash;
  D.rng = seed => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; };
  const noise1 = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i, s) * (1 - u) + hash(i + 1, s) * u) * 2 - 1; };
  D.noise1 = noise1;
  D.ease = { io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t,
    back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
  D.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  D.prog = (t, t0, t1) => D.clamp((t - t0) / (t1 - t0));
  D.lerp = (a, b, k) => a + (b - a) * k;

  // —— 路徑工具 ——
  D.bez = (p0, p1, p2, p3, n = 16) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]); } return o; };
  // 'M x y C x y x y x y L x y ...' 簡易 path → 點列
  D.path = (str, n = 14) => { const tk = str.trim().split(/[\s,]+/); let i = 0, cur = [0, 0], out = [], cmd = 'M'; const num = () => +tk[i++];
    while (i < tk.length) { if (/[MLC]/.test(tk[i])) cmd = tk[i++];
      if (cmd === 'M') { cur = [num(), num()]; out.push(cur); cmd = 'L'; }
      else if (cmd === 'L') { cur = [num(), num()]; out.push(cur); }
      else if (cmd === 'C') { const a = [num(), num()], b = [num(), num()], c = [num(), num()]; out.push(...D.bez(cur, a, b, c, n).slice(1)); cur = c; } }
    return out; };
  D.ellipse = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2 + .35, n = 40) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
  D.xf = (pts, x, y, s = 1, rot = 0, sy = s) => { const c = Math.cos(rot), si = Math.sin(rot); return pts.map(([u, v]) => [x + (u * s) * c - (v * sy) * si, y + (u * s) * si + (v * sy) * c]); };
  const resample = (pts, step) => { const o = [pts[0]]; let acc = 0; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; let d = Math.hypot(bx - ax, by - ay); let t0 = 0; while (acc + d * (1 - t0) >= step) { const need = (step - acc) / d; t0 += need; o.push([ax + (bx - ax) * t0, ay + (by - ay) * t0]); acc = 0; } acc += d * (1 - t0); } o.push(pts[pts.length - 1]); return o; };

  // —— 墨線 ——
  // opt: {w, p (畫出比例 0-1), from (從哪裡開始擦，風線用), seed, boil (幀種子), wob, over, gap, color, alpha}
  D.pen = (ctx, pts, opt = {}) => {
    const w = opt.w ?? 3, p = opt.p ?? 1, from = opt.from ?? 0, seed = opt.seed ?? 1, boil = opt.boil ?? 0, wob = opt.wob ?? 1.1, over = opt.over ?? 5;
    if (p <= from || pts.length < 2) return;
    let q = resample(pts, 3);
    // 超出頭：兩端沿切線延伸
    const ext = (a, b, L) => { const dx = a[0] - b[0], dy = a[1] - b[1], d = Math.hypot(dx, dy) || 1; return [a[0] + dx / d * L, a[1] + dy / d * L]; };
    const L0 = over * (0.4 + hash(seed, 7)), L1 = over * (0.4 + hash(seed, 8));
    q = [ext(q[0], q[1], L0), ...q, ext(q[q.length - 1], q[q.length - 2], L1)];
    const n = q.length, s2 = seed * 31 + boil * 7;
    // 抖動：沿法線位移（低頻＋每 boil 換種子）
    const r = q.map((pt, i) => { const a = q[Math.max(0, i - 1)], b = q[Math.min(n - 1, i + 1)]; let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
      const o = noise1(i * .09, s2) * wob + noise1(i * .5, s2 + 3) * wob * .35; return [pt[0] + nx * o, pt[1] + ny * o]; });
    const i0 = Math.floor(from * (n - 1)), i1 = Math.max(i0 + 1, Math.floor(p * (n - 1)));
    // 長線有機率斷一個小缺口
    const gapAt = (n > 40 && hash(seed, 11) < (opt.gap ?? .45)) ? Math.floor(n * (.3 + .4 * hash(seed, 12))) : -1;
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = (opt.alpha ?? .96) * (D.ga ?? 1); ctx.strokeStyle = opt.color ?? D.INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); let pen = false;
    for (let i = i0; i <= i1; i++) { if (gapAt > 0 && i >= gapAt && i < gapAt + 2) { pen = false; continue; }
      const [x, y] = r[i]; if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y); }
    ctx.lineWidth = w * (0.92 + .16 * hash(seed, boil)); ctx.stroke(); ctx.restore();
  };

  // —— 淡彩 ——
  // opt: {alpha, off:[dx,dy], seed, boil, bloom:{x,y,r}（綻開半徑，世界座標）, rough}
  D.wash = (ctx, pts, color, opt = {}) => {
    const seed = opt.seed ?? 3, boil = opt.boil ?? 0, rough = opt.rough ?? 2.5, off = opt.off ?? [2.5, 2];
    const q = resample(pts, 6).map((pt, i) => [pt[0] + off[0] + noise1(i * .3, seed * 13 + boil) * rough, pt[1] + off[1] + noise1(i * .3, seed * 17 + boil) * rough]);
    ctx.save();
    if (opt.bloom) { const b = opt.bloom; if (b.r <= 0) { ctx.restore(); return; } ctx.beginPath(); const N = 36; for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, rr = b.r * (1 + .18 * noise1(i * .7, seed + 5)); ctx.lineTo(b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr); } ctx.clip(); }
    ctx.globalCompositeOperation = 'multiply';
    ctx.beginPath(); q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.globalAlpha = (opt.alpha ?? .5) * (D.ga ?? 1); ctx.fillStyle = color; ctx.fill();
    // 乾邊：顏料在邊緣聚集
    ctx.globalAlpha = (opt.alpha ?? .5) * .45 * (D.ga ?? 1); ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.restore();
  };

  // —— 手寫字 ——
  // 一個字一個字寫出（從左到右擦出），每字輕微旋轉，boil 抖動
  D.write = (ctx, str, x, y, size, t, t0, opt = {}) => {
    if (t < t0) return; const per = opt.per ?? .1, chars = [...str]; let cx = x;
    ctx.save(); ctx.font = `700 ${size}px WK`; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = opt.color ?? D.INK;
    const boil = Math.floor(t * 12);
    chars.forEach((ch, i) => { const w = ctx.measureText(ch).width, k = D.clamp((t - t0 - i * per) / per); if (k <= 0) { cx += w * (opt.track ?? .92); return; }
      const pop = opt.pop ? 1 + .35 * Math.sin(Math.min(1, (t - t0 - i * per) / .25) * Math.PI) * Math.max(0, 1 - (t - t0 - i * per) / .25) : 1;
      ctx.save(); ctx.translate(cx + w / 2 + noise1(boil, i * 9) * 1.2, y + noise1(boil, i * 9 + 4) * 1.2 + (opt.bob ? Math.sin((t - t0) * 6 + i) * 4 : 0));
      ctx.rotate((hash(i, 77, str.length) - .5) * .22 + (opt.rot ?? 0)); ctx.scale(pop, pop);
      ctx.beginPath(); ctx.rect(-w / 2 - 4, -size, (w + 8) * k, size * 1.4); ctx.clip();
      ctx.fillText(ch, -w / 2, 0); ctx.restore(); cx += w * (opt.track ?? .92); });
    ctx.restore();
  };

  // —— 紙張 ——
  D.paperTile = (S = 768, seed = 5) => {
    const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), im = g.createImageData(S, S), r = D.rng(seed);
    const grid = (n) => { const a = []; for (let i = 0; i < n * n; i++) a.push(r()); return (x, y) => { const fx = x * n, fy = y * n, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, s = t => t * t * (3 - 2 * t);
      const A = (ii, jj) => a[((jj % n + n) % n) * n + ((ii % n + n) % n)]; return D.lerp(D.lerp(A(i, j), A(i + 1, j), s(u)), D.lerp(A(i, j + 1), A(i + 1, j + 1), s(u)), s(v)); }; };
    const g1 = grid(4), g2 = grid(11), g3 = grid(48);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const u = x / S, v = y / S, m = (g1(u, v) - .5) * .05 + (g2(u, v) - .5) * .03 + (g3(u, v) - .5) * .02 + (r() - .5) * .035;
      const k = 1 + m, i = (y * S + x) * 4; im.data[i] = 242 * k; im.data[i + 1] = 235 * k; im.data[i + 2] = 221 * k; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  };
  window.D = D;
})();
