"""Frame-by-frame compositing: shot list → white balance → grid / flashback → unified 35 mm release-print grade (S-curve, desaturation, warm highlights, bloom)
→ type and day ring → grain, vignette, gate weave, 1.85:1 matte. Grade, grain and grid follow the Time-lapse Symphony demo's renderer.
Usage: python tools/render.py out/picture.mp4
      python tools/render.py --still sec out.jpg [sec out.jpg …]
A full render also writes texts.json (frames and box of each on-screen text) for readcheck (index.html reads it)."""
import os, sys, subprocess, math, json
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
os.chdir(os.path.join(HERE, '..'))
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from shots import SHOTS, CLIPS, FLASH_SRC, FLASH_LEN, GRID_STAGES, GRID_LAST, NIGHT_SRC, SIZE
from timeline import FPS, DUR, BEAT, beat, GRID, RIVER, BRAKE, RETURN, FLASH, STOP, CODA, QUOTE, SLATE

W, H = 1920, 1080
PW, PH = SIZE
LB = (H - PH) // 2           # 21 px matte
NF = round(DUR * FPS)
rng = np.random.default_rng(1854)
F_LAT = 'fonts/Michroma-Regular.ttf'
F_TC = 'fonts/NotoSansTC-VF.ttf'

INK = (237, 232, 223)        # warm white
DIM = (176, 170, 160)        # secondary line
SODIUM = (217, 119, 47)      # the only accent


# ───────── grade ─────────
def make_luts():
    x = np.linspace(0, 1, 256)
    s = 1 / (1 + np.exp(-6.2 * (x - .47))); s = (s - s[0]) / (s[-1] - s[0])
    y = .55 * s + .45 * x
    y = .028 + .955 * y
    r = np.clip(y * 1.025 + .004, 0, 1); g = np.clip(y, 0, 1); b = np.clip(y * .965 + .01 * (1 - x), 0, 1)
    return [(c * 255 + .5).astype(np.uint8) for c in (r, g, b)]


LUT = make_luts()
SAT = .86


def wb_gains(img, strength):
    if strength <= 0: return np.ones(3, np.float32)
    a = img[::8, ::8].astype(np.float32) / 255; l = a.mean(2); m = (l > .12) & (l < .88)
    if m.sum() < 500: return np.ones(3, np.float32)
    mean = a[m].mean(0); g = mean.mean() / np.maximum(mean, 1e-3)
    return (g ** strength).astype(np.float32)


def grade(a, bloom=.10):
    l = a @ np.array([.2126, .7152, .0722], np.float32)
    a = l[..., None] + SAT * (a - l[..., None])
    a = np.clip(a, 0, 255).astype(np.uint8)
    out = np.stack([LUT[c][a[..., c]] for c in range(3)], 2).astype(np.float32)
    small = Image.fromarray(out.astype(np.uint8)).resize((W // 8, H // 8), Image.BILINEAR)
    hl = np.clip(np.asarray(small).astype(np.float32) - 170, 0, None) * 1.6
    hl = np.asarray(Image.fromarray(hl.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BILINEAR)).astype(np.float32)
    return out + bloom * hl * np.array([1.0, .82, .62], np.float32)


yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = (1 - .16 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.3).clip(.6, 1)[..., None]
GRAIN = []
for k in range(10):
    n = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    im = Image.fromarray(((n * 40) + 128).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(.6))
    GRAIN.append(((np.asarray(im).astype(np.float32) - 128) / 40)[..., None])


def finish(out, f):
    l = out.mean(2, keepdims=True) / 255
    out = out * VIG + GRAIN[(f * 7) % len(GRAIN)] * (9.0 * (0.35 + 1.3 * l * (1 - l)))
    out[:LB] = 0; out[H - LB:] = 0
    return np.clip(out, 0, 255).astype(np.uint8)


# ───────── motion ─────────
_wn = rng.normal(0, 1, (NF + 40, 2)); _k = np.exp(-np.linspace(-2, 2, 15) ** 2); _k /= _k.sum()
weave = np.stack([np.convolve(_wn[:, j], _k, 'same') for j in range(2)], 1) * 1.1      # ±0.5 px gate weave


def ease(u): u = min(1, max(0, u)); return u * u * (3 - 2 * u)


def move(img, s, dx, dy, f):
    h, w = img.shape[:2]; wx, wy = weave[min(f, len(weave) - 1)]
    if abs(s - 1) < 1e-4 and abs(dx) + abs(dy) + abs(wx) + abs(wy) < .05: return img
    cx, cy = w / 2 - dx - wx, h / 2 - dy - wy
    inv = (1 / s, 0, cx - w / 2 / s, 0, 1 / s, cy - h / 2 / s)
    return np.asarray(Image.fromarray(img).transform((w, h), Image.AFFINE, inv, Image.BICUBIC))


def fall_scale(u):
    """Falling push on the second hit: 1.0 → 1.15 in 0.35 s (ease-out), then on to 1.2 by the cut"""
    if u < .35: return 1.0 + .15 * (1 - (1 - u / .35) ** 3)
    return 1.15 + .05 * (u - .35) / (2.5 - .35)


# ───────── sources ─────────
class Reader:
    def __init__(self, cid, skip=0):
        w, h = CLIPS[cid]['size']; self.w, self.h = w, h
        self.p = subprocess.Popen(['ffmpeg', '-v', 'quiet', '-i', f'work/clips/{cid}.mp4', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
        self.last = None
        for _ in range(skip): self.next()

    def next(self):
        b = self.p.stdout.read(self.w * self.h * 3)
        if len(b) == self.w * self.h * 3: self.last = np.frombuffer(b, np.uint8).reshape(self.h, self.w, 3)
        return self.last

    def close(self):
        self.p.stdout.close(); self.p.wait()


def load_clip(cid):
    r = Reader(cid); fr = []
    for _ in range(CLIPS[cid]['n']):
        a = r.next()
        if a is None: break
        fr.append(a.copy())
    r.close()
    return fr


def place(p):
    """1920×1038 picture → 1920×1080 frame"""
    out = np.zeros((H, W, 3), np.float32); out[LB:LB + PH] = p; return out


# ───────── text ─────────
_fonts = {}


def font(path, size, wght=None):
    key = (path, size, wght)
    if key not in _fonts:
        f = ImageFont.truetype(path, size)
        if wght is not None:
            try: f.set_variation_by_axes([wght])
            except Exception: pass
        _fonts[key] = f
    return _fonts[key]


def tracked_w(d, text, fnt, track):
    return sum(d.textlength(ch, font=fnt) + track * fnt.size for ch in text) - track * fnt.size


class Layer:
    """One frame's text layer + readcheck records (only text that is fully opaque)"""
    def __init__(self):
        self.im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); self.d = ImageDraw.Draw(self.im); self.rec = []

    def text(self, tid, x, y, text, fnt, col, track=0.0, a=1.0, final=True):
        if a <= 0.004: return
        cx = x
        for ch in text:
            self.d.text((cx, y), ch, font=fnt, fill=col + (int(255 * a),))
            cx += self.d.textlength(ch, font=fnt) + track * fnt.size
        if a >= .98 and final:
            bb = self.d.textbbox((x, y), text, font=fnt)
            self.rec.append(dict(id=tid, text=text, x0=x, y0=bb[1], x1=x + tracked_w(self.d, text, fnt, track), y1=bb[3]))

    def rect(self, box, col, a=1.0):
        if a > 0.004: self.d.rectangle(box, fill=col + (int(255 * a),))


def fade(t, t0, t1, fi=.25, fo=.25):
    return min(1, max(0, (t - t0) / fi)) * min(1, max(0, (t1 - t) / fo))


_shade = {}


def shade(base, cx, cy, rx, ry, a):
    key = (cx, cy, rx, ry)
    if key not in _shade: _shade[key] = np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2))[..., None].astype(np.float32)
    return base * (1 - a * _shade[key])


# day ring: the film's day, 06:00 at dawn → 23:30 at night; frozen during the brake, reversed in the flashback
RING = [(0.0, 5.5), (beat(20), 8.0), (beat(32), 11.0), (RIVER, 16.5), (BRAKE, 18.6), (RETURN, 18.6), (beat(88), 20.0), (FLASH, 23.5)]
RING_ON = beat(12)


def ring_hour(t):
    for (a, ha), (b, hb) in zip(RING, RING[1:]):
        if a <= t < b: return ha + (hb - ha) * (t - a) / (b - a)
    return RING[-1][1]


def draw_ring(L, t):
    if not (RING_ON <= t < STOP): return
    a = fade(t, RING_ON, STOP, .4, .04)
    if BRAKE <= t < RETURN: a *= .45                       # frozen, dimmed
    if FLASH <= t < STOP:
        h = 23.5 - (23.5 - 5.5) * ((t - FLASH) / (STOP - FLASH)) ** .8
    else:
        h = ring_hour(t)
    cx, cy, r = 1726, 948, 40
    d = L.d
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=DIM + (int(140 * a),), width=1)
    for k in range(24):
        ang = math.radians(k * 15 - 90); r0 = r - (6 if k % 6 == 0 else 3)
        d.line([cx + r0 * math.cos(ang), cy + r0 * math.sin(ang), cx + r * math.cos(ang), cy + r * math.sin(ang)], fill=DIM + (int(170 * a),), width=1)
    a0 = h * 15 - 90
    d.arc([cx - r, cy - r, cx + r, cy + r], a0 - 45, a0, fill=SODIUM + (int(200 * a),), width=3)
    ang = math.radians(a0); px, py = cx + r * math.cos(ang), cy + r * math.sin(ang)
    d.ellipse([px - 4, py - 4, px + 4, py + 4], fill=SODIUM + (int(255 * a),))
    fl = font(F_LAT, 11)
    for lab, k in (('00', 0), ('06', 6), ('12', 12), ('18', 18)):
        ang = math.radians(k * 15 - 90); rr = r + 14
        w = d.textlength(lab, font=fl)
        L.text(f'ring{lab}', cx + rr * math.cos(ang) - w / 2, cy + rr * math.sin(ang) - 7, lab, fl, DIM, 0, a * .9, final=a > .98)


TITLE0, TITLE1 = beat(2), beat(11) + .3
SLATE_LINES = [('s_img', '影像　自備素材十一段'),
               ('s_mus', '配樂　原創，取樣自 VSCO 2 CE 與 VCSL（CC0）'),
               ('s_quo', '引文　梭羅《湖濱散記》，1854，公有領域')]


def texts(t, f):
    """All on-screen text (left-aligned, no backing plate). Returns (Layer, list of darkening ellipses)"""
    L = Layer(); sh = []
    # 1 title over the mist
    if TITLE0 <= t < TITLE1:
        a1 = fade(t, TITLE0, TITLE1, .5, .45); a2 = fade(t, TITLE0 + .3, TITLE1, .5, .45)
        sh.append((520, 840, 760, 260, .5 * max(a1, a2)))
        L.text('title_cn', 180, 740, '風與光', font(F_TC, 66, 300), INK, .16, a1)
        L.rect([184, 846, 184 + int(380 * ease((t - TITLE0 - .2) / .9)), 847], SODIUM, a2)
        L.text('title_en', 184, 866, 'OF WIND AND LIGHT', font(F_LAT, 20), INK, .32, a2)
    draw_ring(L, t)
    # 2 quotation over the stars
    if QUOTE <= t < SLATE - .3:
        u = t - QUOTE; out = min(1, max(0, (SLATE - .3 - t) / .3))
        fd = lambda t0: min(1, max(0, (u - t0) / .25)) * out
        sh.append((600, 330, 860, 280, .45 * out))
        x0, y0 = 196, 236
        L.text('q_cn', x0, y0, '我們需要荒野的滋養。', font(F_TC, 56, 300), INK, .1, fd(0))
        L.text('q_en', x0 + 4, y0 + 100, 'WE NEED THE TONIC OF WILDNESS.', font(F_LAT, 20), INK, .16, fd(.1))
        L.text('q_src', x0 + 4, y0 + 146, 'HENRY DAVID THOREAU · WALDEN · 1854', font(F_LAT, 14), SODIUM, .22, fd(.2))
    # 3 end card over the darkened stars
    if t >= SLATE:
        u = t - SLATE; out = min(1, max(0, (DUR - .3 - t) / .3))
        fd = lambda t0: min(1, max(0, (u - t0) / .3)) * out
        x0 = 196
        L.text('s_title_cn', x0, 330, '風與光', font(F_TC, 54, 300), INK, .14, fd(0))
        L.text('s_title_en', x0 + 250, 356, 'OF WIND AND LIGHT', font(F_LAT, 20), INK, .3, fd(0))
        L.rect([x0 + 2, 430, x0 + 2 + int(640 * ease(u / .6)), 431], SODIUM, out)
        for k, (tid, line) in enumerate(SLATE_LINES):
            L.text(tid, x0, 462 + k * 44, line, font(F_TC, 22, 350), (214, 208, 198), .06, fd(.15 + .05 * k))
    return L, sh


# ───────── compositing ─────────
class State:
    def __init__(self): self.rd = {}; self.gains = {}; self.mem = {}

    def reader(self, cid, skip=0):
        if cid not in self.rd: self.rd[cid] = Reader(cid, skip)
        return self.rd[cid]

    def close_all(self):
        for r in self.rd.values(): r.close()
        self.rd = {}


ST = State()
GUT = 6
ORDER9 = [4, 0, 8, 2, 6, 1, 7, 3, 5]


def gain(key, frame, strength):
    if key not in ST.gains: ST.gains[key] = wb_gains(frame, strength)
    return ST.gains[key]


def pool(cid):
    if cid not in ST.mem:
        fr = load_clip(cid); src = CLIPS[cid]['src']
        g = wb_gains(fr[len(fr) // 2], 0 if src in NIGHT_SRC or src == 'reeds' else .15)
        ST.mem[cid] = [(a.astype(np.float32) * g).clip(0, 255).astype(np.uint8) for a in fr]
    return ST.mem[cid]


def grid_plate(t, f, stage=None):
    if stage is None: stage = max(k for k, s in enumerate(GRID_STAGES) if t >= s[0] - 1e-9)
    t0, cols, rows, ids = GRID_STAGES[stage]
    n = cols * rows
    step = min(BEAT / 4, .3 / n)
    filling = stage > 0 and t < t0 + n * step
    out = grid_plate(t, f, stage - 1) if filling else np.zeros((H, W, 3), np.float32)
    i = f - round(GRID * FPS)
    cw, ch = W // cols, PH // rows
    order = ORDER9 if n == 9 else list(range(n))
    frantic = stage == len(GRID_STAGES) - 1 and t >= RIVER - BEAT          # last beat: cells re-cut every sixteenth
    shift = int((t - (RIVER - BEAT)) / (BEAT / 4)) + 1 if frantic else 0
    for k in range(n):
        if t < t0 + order.index(k) * step: continue
        cid = GRID_LAST[(k * 4 + shift * 3) % len(GRID_LAST)] if frantic else ids[k]
        fr = pool(cid); a = fr[min(len(fr) - 1, max(0, i))]
        if cols == 2 and rows == 1:                       # 1×2: centre 480 px of each 960 px half-picture, scaled to the half frame
            cell = np.asarray(Image.fromarray(a[:, 240:720]).resize((cw, ch), Image.BICUBIC))
        else:
            cell = np.asarray(Image.fromarray(a).resize((cw, ch), Image.BILINEAR)) if (cw, ch) != a.shape[1::-1] else a
        cx, cy = (k % cols) * cw, LB + (k // cols) * ch
        out[cy:cy + ch, cx:cx + cw] = cell
    for c in range(1, cols): out[:, c * cw - GUT // 2:c * cw + GUT // 2] = 0
    for r in range(1, rows): out[LB + r * ch - GUT // 2:LB + r * ch + GUT // 2, :] = 0
    return out


def plate_for(s, t, f, i, n):
    """White-balanced picture (float32, full frame) and bloom strength"""
    kind = s['kind']
    if kind == 'clip':
        raw = ST.reader(s['id']).next()
        if s.get('push') == 'fall':
            sc, dx, dy = fall_scale(i / FPS), 0, 0
        else:
            mv = s['motion']; u = ease(i / max(1, n - 1)); sc = mv[0] + (mv[1] - mv[0]) * u; dx, dy = mv[2] * u, mv[3] * u
        raw = move(raw, sc, dx, dy, f)
        p = raw.astype(np.float32) * gain(s['id'], raw, s['wb'])
        if s['id'] == 's01_lake': p *= ease(t / 1.0)                                   # fade up from black
        if s['id'] == 's17_stars':
            p *= ease((t - CODA) / .5)
            if t >= SLATE: p *= 1 - .7 * ease((t - SLATE) / .4)                       # darkened under the end card
            p *= min(1, max(0, (DUR - .05 - t) / 1.2))                                 # last fade to black
        night = s['src'] in NIGHT_SRC or s['id'] == 's09_road'
        return place(p), (.17 if night else .09)
    if kind == 'grid':
        return grid_plate(t, f), .08
    return np.zeros((H, W, 3), np.float32), 0


def main():
    stills = []
    if '--still' in sys.argv:
        a = sys.argv[sys.argv.index('--still') + 1:]
        stills = [(float(a[k]), a[k + 1]) for k in range(0, len(a) - 1, 2)]
        frames = sorted(round(t * FPS) for t, _ in stills)
        outp = None
    else:
        outp = sys.argv[1]; frames = range(NF)
    ranges = [(round(s['t0'] * FPS), round(s['t1'] * FPS), s) for s in SHOTS]
    plan = []; occ = {}
    for sid, ln in zip(FLASH_SRC, FLASH_LEN):
        occ[sid] = occ.get(sid, 0) + 1; plan.append((sid, ln, 'end' if occ[sid] == 1 else 'mid'))
    cache = {}
    enc = None
    if outp:
        enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                                '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709',
                                '-color_trc', 'bt709', '-colorspace', 'bt709', outp], stdin=subprocess.PIPE)
    rec = {}; spans = []
    fl_i = fl_k = 0; cur = None
    still_map = {round(t * FPS): p for t, p in stills}
    for f in frames:
        t = f / FPS
        hit = next((r for r in ranges if r[0] <= f < r[1]), None)
        bloom = .08
        if hit is None or hit[2]['kind'] == 'black':
            img = np.zeros((H, W, 3), np.float32); hit = None
        else:
            a, b, s = hit; i = f - a; n = b - a
            if s['id'] != cur:
                ST.close_all(); cur = s['id']
                if s['kind'] == 'clip': ST.rd[s['id']] = Reader(s['id'], skip=i)
            if s['kind'] == 'flash':
                img = np.zeros((H, W, 3), np.float32)
                if outp:
                    sid, ln, which = plan[fl_i]
                    lst = cache.get((sid, which)) or cache[(sid, 'end')]
                    img = lst[len(lst) - 1 - fl_k % len(lst)].astype(np.float32)        # each flash runs backwards
                    fl_k += 1
                    if fl_k >= ln: fl_i += 1; fl_k = 0
                    bloom = .12
            else:
                img, bloom = plate_for(s, t, f, i, n)
                if outp and s['id'] in FLASH_SRC:
                    if n // 2 - 2 <= i < n // 2 + 2: cache.setdefault((s['id'], 'mid'), []).append(img.clip(0, 255).astype(np.uint8))
                    if n - 5 <= i < n - 1: cache.setdefault((s['id'], 'end'), []).append(img.clip(0, 255).astype(np.uint8))
                    if s['id'] == 's01_lake' and 40 <= i < 44: cache.setdefault((s['id'], 'mid'), []).append(img.clip(0, 255).astype(np.uint8))
        L, sh = texts(t, f)
        for cx, cy, rx, ry, al in sh: img = shade(img, cx, cy, rx, ry, al)
        out = grade(img, bloom) if hit is not None and np.any(img) else img
        bb = L.im.getbbox()
        if bb:
            x0, y0, x1, y1 = bb
            lay = np.asarray(L.im.crop(bb)).astype(np.float32); al = lay[..., 3:4] / 255
            out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - al) + lay[..., :3] * al
        fr = finish(out, f)
        if outp is None:
            ST.close_all(); cur = None
            Image.fromarray(fr).save(still_map[f], quality=92); print(still_map[f], flush=True); continue
        enc.stdin.write(fr.tobytes())
        for r in L.rec:
            k = r['id']; box = [round(r['x0']), round(r['y0']), round(r['x1']), round(r['y1'])]
            if k in rec and rec[k][0] == r['text'] and rec[k][3] == f - 1:
                rec[k][3] = f
            else:
                if k in rec: spans.append(dict(id=k, text=rec[k][0], box=rec[k][1], f0=rec[k][2], f1=rec[k][3]))
                rec[k] = [r['text'], box, f, f]
        if f % 120 == 0: print(f'{t:5.1f}s', flush=True)
    if outp:
        for k, v in rec.items(): spans.append(dict(id=k, text=v[0], box=v[1], f0=v[2], f1=v[3]))
        enc.stdin.close(); enc.wait()
        json.dump(dict(fps=FPS, dur=DUR, spans=spans), open('texts.json', 'w'), ensure_ascii=False)
        print(outp, len(spans), 'text spans')
    ST.close_all()


if __name__ == '__main__':
    main()
