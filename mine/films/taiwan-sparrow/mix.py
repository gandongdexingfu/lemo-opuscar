"""全片聲音：讀 events.json → out/sfx.wav（音效＋環境）、out/music.wav（配樂）、out/mix.wav（混音）
音效全部 numpy 合成。配樂：有 music/gemini.wav 就用它（偏移見 MUSIC_OFFSET），否則用 100 BPM 的暫用配樂（撥弦＋木琴＋口哨）。
安靜段（events 裡的 silence）：音樂與環境都壓到 0。"""
import json, numpy as np
from pathlib import Path
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
HERE = Path(__file__).parent
SR = 48000
E = json.loads((HERE / 'events.json').read_text())
DUR = E['dur'] + .3
N = int(DUR * SR)
rng = np.random.default_rng(7)
MUSIC_OFFSET = 0.0          # Gemini 配樂相對畫面的偏移（秒，正值＝音樂延後）

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
def noise(sec): return rng.standard_normal(int(sec * SR))
def tone(f0, f1, sec): n = int(sec * SR); f = np.geomspace(f0, f1, n); return np.sin(2 * np.pi * np.cumsum(f) / SR)
class Bus:
    def __init__(s): s.L = np.zeros(N); s.R = np.zeros(N)
    def add(s, x, at, gain=1.0, pan=0.0, norm=True):
        i = int(at * SR);
        if i >= N or len(x) == 0: return
        x = x[: N - i]
        if norm: x = x / (np.abs(x).max() + 1e-9)
        gl, gr = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
        s.L[i:i + len(x)] += x * gain * gl; s.R[i:i + len(x)] += x * gain * gr
SFX, AMB, MUS = Bus(), Bus(), Bus()

# —— 音效庫 ——
def wind(sec=1.4):
    n = noise(sec); t = np.arange(len(n)) / SR; s = bp(n, 350, 700) + .6 * bp(n, 700, 1300)
    return s * np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 1.5 * (1 + .3 * np.sin(t * 9))
def rustle(sec=.9):
    n = noise(sec); t = np.arange(len(n)) / SR; c = np.zeros_like(n)
    for k in rng.uniform(0, sec, 26): i = int(k * SR); m = min(len(n) - i, int(.02 * SR)); c[i:i + m] += env(m, .001, .006)
    return hp(n, 2500) * lp(c, 400) * np.sin(np.pi * t / sec)
def puff(): n = noise(.7); return lp(n, 900) * env(len(n), .03, .18) + bp(n, 2000, 6000) * env(len(n), .01, .09) * .3
def scratch(chars=2, per=.14):
    out = np.zeros(int((chars * per + .25) * SR))
    for c in range(chars):
        for s in range(3): x = bp(noise(.05), 1800, 7000) * env(int(.05 * SR), .004, .02); i = int((c * per + s * .04) * SR); out[i:i + len(x)] += x
    return out
def hop(): return tone(300, 700, .18) * env(int(.18 * SR), .005, .06)
def land(): n = int(.25 * SR); return tone(160, 90, .25) * env(n, .003, .08) * .6 + lp(noise(.25), 600) * env(n, .002, .05) * .4
def rise(sec=1.0): n = noise(sec); t = np.arange(len(n)) / SR; return bp(n, 300, 1600) * np.sin(np.pi * t / sec) ** 2
def bubble(i): f0 = 380 + 60 * i; return tone(f0, f0 * 2.2, .12) * env(int(.12 * SR), .005, .04)
def pop(i): f0 = 900 + 120 * i; n = int(.09 * SR); return tone(f0, f0 * .45, .09) * env(n, .001, .025) + bp(noise(.09), 1500, 6000) * env(n, .001, .01) * .4
def flap(k=9):
    out = np.zeros(int((k * .075 + .1) * SR))
    for j in range(k): x = lp(noise(.05), 1200) * env(int(.05 * SR), .004, .015); i = int(j * .075 * SR); out[i:i + len(x)] += x
    return out
def peck(): n = int(.06 * SR); return bp(noise(.06), 1500, 4500) * env(n, .001, .008) + tone(1800, 1200, .06) * env(n, .001, .01) * .5
def knock(): n = int(.3 * SR); t = np.arange(n) / SR; x = (np.sin(2 * np.pi * 220 * t) + .5 * np.sin(2 * np.pi * 570 * t)) * env(n, .002, .05); x2 = np.roll(x, int(.13 * SR)); x2[:int(.13 * SR)] = 0; return x + x2 * .8
def slide(): sec = 1.0; n = int(sec * SR); return tone(300, 1400, sec) * np.sin(np.pi * np.arange(n) / n) ** .5 * .6 + bp(noise(sec), 2000, 5000) * .3
def boing(): sec = .45; t = np.arange(int(sec * SR)) / SR; f = 180 + 140 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
def steps():
    out = np.zeros(int(.7 * SR))
    for j in range(4): x = lp(noise(.04), 2500) * env(int(.04 * SR), .001, .01); i = int(j * .15 * SR); out[i:i + len(x)] += x
    return out
def plank(): return boing() * .7 + tone(90, 70, .45) * env(int(.45 * SR), .005, .12) * .4
def splash():
    sec = 1.1; n = noise(sec); t = np.arange(len(n)) / SR; body = lp(n, 1500) * env(len(n), .005, .12) + hp(n, 2500) * env(len(n), .01, .35) * .6
    drops = np.zeros(len(n))
    for k in rng.uniform(.15, .9, 10): i = int(k * SR); d = tone(900 + rng.uniform(0, 900), 1600, .05) * env(int(.05 * SR), .001, .012); drops[i:i + len(d)] += d * .3
    return body + drops
def rain(sec):
    n = noise(sec); t = np.arange(len(n)) / SR; bed = bp(n, 1200, 7000) * .35 + lp(n, 500) * .15
    for k in rng.uniform(0, sec - .05, int(sec * 25)): i = int(k * SR); d = bp(noise(.02), 2500, 8000) * env(int(.02 * SR), .001, .004); bed[i:i + len(d)] += d * 1.5
    return bed * np.minimum(1, t / .3) * np.minimum(1, (sec - t) / .3)
def plop(): return tone(400, 900, .12) * env(int(.12 * SR), .003, .04)
def water(): sec = 1.2; n = noise(sec); t = np.arange(len(n)) / SR; return lp(n, 700) * (1 + .5 * np.sin(t * 7)) * np.sin(np.pi * t / sec)
def fan(sec=2.0):
    t = np.arange(int(sec * SR)) / SR; ramp = np.minimum(1, t / .35); f0 = 110
    hum = (np.sin(2 * np.pi * f0 * t) * .4 + np.sin(2 * np.pi * 2 * f0 * t) * .3) * ramp; air = bp(noise(sec), 400, 2500) * ramp * (1 + .25 * np.sin(2 * np.pi * 14 * t))
    return (hum * .4 + air) * np.minimum(1, (sec - t) / .4)
def spring(): b = boing() * .6; b[:int(.2 * SR)] += tone(200, 1200, .2) * env(int(.2 * SR), .005, .06); return b
def ding(i):
    f = [1047, 1319, 1568, 1760, 2093, 2637][i % 6]; t = np.arange(int(.5 * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 20)) * np.exp(-t * 7)
def score():
    out = np.zeros(int(.9 * SR))
    for j, f in enumerate([1047, 1319, 1568, 2093]): t = np.arange(int(.35 * SR)) / SR; x = np.sin(2 * np.pi * f * t) * np.exp(-t * 9); i = int(j * .08 * SR); out[i:i + len(x)] += x
    return out
def inflate(): sec = 1.0; n = noise(sec); t = np.arange(len(n)) / SR; return bp(n, 200, 1200) * (t / sec) ** .7 * np.exp(-np.maximum(0, t - .8) * 12) + tone(150, 320, sec) * .2 * (t / sec)
def firework(i):
    sec = 1.4; n = noise(sec); t = np.arange(len(n)) / SR; pop_ = lp(n, 1200) * env(len(n), .002, .06)
    crack = np.zeros(len(n))
    for k in rng.uniform(.1, 1.1, 30): j = int(k * SR); d = hp(noise(.01), 3000) * env(int(.01 * SR), .0005, .002); crack[j:j + len(d)] += d * .4
    return pop_ + crack * np.exp(-t * 2)
def title_chime():
    out = np.zeros(int(2.5 * SR))
    for j, f in enumerate([523, 659, 784, 1047]): t = np.arange(int(2.0 * SR)) / SR; x = (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 2.5); i = int(j * .12 * SR); out[i:i + len(x)] += x
    return out

ambience = {
    'shop': lambda s: lp(noise(s), 300) * .3 + bp(noise(s), 3000, 8000) * .15 * (1 + np.sin(np.arange(int(s * SR)) / SR * 40)),     # 煎台滋滋
    'kitchen': lambda s: lp(noise(s), 250) * .3,
    'street': lambda s: lp(noise(s), 600) * .35 + bp(noise(s), 200, 900) * .15,
    'rain': lambda s: rain(s),
    'summer': lambda s: bp(noise(s), 4000, 6500) * (.6 + .4 * np.sin(np.arange(int(s * SR)) / SR * 2 * np.pi * 7)) * .35,   # 蟬
    'market': lambda s: bp(noise(s), 250, 1800) * .5,
    'night': lambda s: bp(noise(s), 3500, 5000) * (np.sin(np.arange(int(s * SR)) / SR * 2 * np.pi * 3) > .6) * .3 + lp(noise(s), 300) * .2,  # 蟋蟀
}
AMB_GAIN = {'shop': .05, 'kitchen': .04, 'street': .06, 'rain': .16, 'summer': .05, 'market': .07, 'night': .05}

silences = []
for e in E['ev']:
    t, ty = e['t'], e['type']
    if ty == 'silence': silences.append((t, t + e['d']))
    elif ty == 'amb':
        s = e['t1'] - t + .4; x = ambience[e['place']](s); x = x / (np.abs(x).max() + 1e-9); m = len(x); fade = np.minimum(1, np.minimum(np.arange(m) / (.4 * SR), (m - np.arange(m)) / (.4 * SR)))
        AMB.add(x * fade, max(0, t - .2), AMB_GAIN[e['place']], norm=False)
    elif ty == 'wind': SFX.add(wind(), t, .3, e.get('pan', 0))
    elif ty == 'bag': SFX.add(rustle(), t, .22, .2)
    elif ty == 'puff': SFX.add(puff(), t, .55)
    elif ty == 'write': SFX.add(scratch(), t + .05, .3, .3)
    elif ty == 'hop': SFX.add(hop(), t, .4, -.1)
    elif ty == 'land': SFX.add(land(), t, .5)
    elif ty == 'rise': SFX.add(rise(), t, .25)
    elif ty == 'bubble': SFX.add(bubble(e['i']), t + .1, .35, -.1)
    elif ty == 'pop': SFX.add(pop(e['i']), t, .45, .2 + .05 * e['i'])
    elif ty == 'flap': SFX.add(flap(), t, .3, .1)
    elif ty == 'peck': SFX.add(peck(), t + .1, .35, -.2)
    elif ty == 'knock': SFX.add(knock(), t, .4, .1)
    elif ty == 'slide': SFX.add(slide(), t, .3)
    elif ty == 'boing': SFX.add(boing(), t, .4)
    elif ty == 'steps': SFX.add(steps(), t, .3)
    elif ty == 'plank': SFX.add(plank(), t, .45)
    elif ty == 'splash': SFX.add(splash(), t, .7)
    elif ty == 'plop': SFX.add(plop(), t, .4)
    elif ty == 'water': SFX.add(water(), t, .3)
    elif ty == 'fan': SFX.add(fan(), t, .45)
    elif ty == 'spring': SFX.add(spring(), t, .45)
    elif ty == 'ding': SFX.add(ding(e['i']), t, .3, -.3 + .12 * e['i'])
    elif ty == 'score': SFX.add(score(), t, .35)
    elif ty == 'inflate': SFX.add(inflate(), t, .5)
    elif ty == 'firework': SFX.add(firework(e['i']), t, .3, [-.5, .5, -.3][e['i']])
    elif ty == 'title': SFX.add(title_chime(), t, .3)
    elif ty == 'rainin': pass
    elif ty == 'fuse': x = bp(noise(1.4), 2500, 9000) * (np.random.default_rng(3).random(int(1.4 * SR)) > .9) ; SFX.add(lp(x, 8000) * np.minimum(1, np.arange(len(x)) / (.1 * SR)) * np.minimum(1, (len(x) - np.arange(len(x))) / (.4 * SR)), t, .18, -.2)
    elif ty == 'flee': tt = np.arange(int(.8 * SR)) / SR; SFX.add(np.sign(np.sin(2 * np.pi * (520 + 200 * tt) * tt)) * .3 * np.exp(-tt * 3), t, .12, .4)
    elif ty == 'croak': tt = np.arange(int(.35 * SR)) / SR; x = np.sign(np.sin(2 * np.pi * 140 * tt)) * (np.sin(2 * np.pi * 18 * tt) > 0) * np.exp(-tt * 4); SFX.add(lp(x, 1200), t, .3, -.3); SFX.add(lp(x, 1200), t + .4, .25, -.3)
    elif ty == 'fishjump': SFX.add(plop(), t, .35, -.4)
    elif ty == 'fishsplash': SFX.add(splash()[: int(.6 * SR)], t, .35, -.1)
    elif ty == 'rainbow': SFX.add(title_chime(), t, .18)

# —— 配樂 ——
SCORE = HERE / 'music' / 'score.wav'
gem = HERE / 'music' / 'gemini_full.wav'
# Gemini 配樂 55.7 秒、100.4 BPM，比片子長：按拍點剪成四段，對應畫面的四個段落（來源起點都落在拍點上）
EDIT = [  # (畫面起點, 來源起點, 長度, 增益dB)
    (0.0, 0.45, 15.0, 0),      # 起＋承：追逐漸滿
    (15.0, 18.97, 3.6, -4),    # 雨天：取原曲較空的一段，壓低
    (19.4, 32.83, 4.6, 0),     # 電扇＋夜市：原曲最滿的一段
    (24.8, 46.56, 8.5, 0),     # 熱氣球＋結尾：原曲最後一段（含收尾和弦的餘音）
]
if SCORE.exists():
    sr, m = wavfile.read(SCORE); m = m.astype(float) / 32767 * 1.35; k = min(len(m), N); MUS.L[:k] += m[:k, 0]; MUS.R[:k] += m[:k, 1]
elif gem.exists():
    sr, m = wavfile.read(gem); m = m.astype(float) / 32767
    if m.ndim == 1: m = np.stack([m, m], 1)
    XF = int(.03 * SR)
    for d0, s0, ln, g in EDIT:
        seg = m[int(s0 * SR): int((s0 + ln) * SR)].copy() * 10 ** (g / 20); n = len(seg)
        ramp = np.ones(n); ramp[:XF] = np.linspace(0, 1, XF); ramp[-XF:] = np.linspace(1, 0, XF)
        i = int(d0 * SR); k = min(n, N - i); MUS.L[i:i + k] += seg[:k, 0] * ramp[:k]; MUS.R[i:i + k] += seg[:k, 1] * ramp[:k]
    pk = max(np.abs(MUS.L).max(), np.abs(MUS.R).max()); MUS.L *= .42 / pk; MUS.R *= .42 / pk
else:
    def ks(freq, sec=.9, damp=.996):
        n = int(sec * SR); p = int(SR / freq); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
        for i in range(n): out[i] = buf[i % p]; buf[i % p] = damp * .5 * (buf[i % p] + buf[(i + 1) % p])
        return lp(out, 5000)
    def mk(m): return 440 * 2 ** ((m - 69) / 12)
    def xylo(freq, sec=.5): t = np.arange(int(sec * SR)) / SR; return (np.sin(2 * np.pi * freq * t) + .3 * np.sin(2 * np.pi * freq * 3.9 * t) * np.exp(-t * 30)) * np.exp(-t * 9)
    def whistle(freq, sec): t = np.arange(int(sec * SR)) / SR; vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * t); return (np.sin(2 * np.pi * np.cumsum(freq * vib) / SR) + bp(noise(sec), freq * .9, freq * 1.2) * .04) * np.minimum(1, t / .04) * np.minimum(1, (sec - t) / .06)
    B = .6; chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
    cache = {}; mus = np.zeros(N); lead = np.zeros(N)
    def put(buf, x, at, g): i = int(at * SR); x = x[: max(0, N - i)]; buf[i:i + len(x)] += x * g
    nbars = int(DUR / (4 * B)) + 1
    for bar in range(nbars):
        t0 = bar * 4 * B; ch = chords[bar % 4]
        dens = 1 if t0 < 3.6 else 2 if t0 < 15 else 1 if t0 < 18.6 else 3 if t0 < 24 else 1
        beats = [0, 2] if dens == 1 else [0, 1, 1.5, 2, 3, 3.5] if dens == 2 else [0, .5, 1, 1.5, 2, 2.5, 3, 3.5]
        for bt in beats:
            for j, m in enumerate(ch):
                if m not in cache: cache[m] = ks(mk(m))
                put(mus, cache[m], t0 + bt * B + j * .012, .14 if bt % 1 == 0 else .09)
        if 3.6 <= t0 < 24:
            for bt in ([0, 1, 2, 3] if t0 < 15 or t0 >= 18.6 else [0, 2]):
                put(mus, xylo(mk(ch[(int(bt) + bar) % 4] + 12)), t0 + bt * B, .1)
        if 19.4 <= t0 < 24:
            for bt in np.arange(0, 4, .5): put(mus, xylo(mk(ch[int(bt * 2) % 4] + 24), .25), t0 + bt * B, .05)
    mel = [(0, 76, .5), (.5, 79, .5), (1, 81, 1), (2, 79, .5), (2.5, 76, .5), (3, 74, 1.5), (4.5, 72, 1)]
    for st in [0, 41.33]:   # 開場與結尾（第 42 拍 ≈ 24.8 秒）
        for b, m, d in mel: put(lead, whistle(mk(m), d * B * .95), st * B + b * B, .12)
    for b, m, d in [(48, 76, 1), (49, 79, 1), (50, 84, 2), (52, 83, 1), (53, 79, 1), (54, 81, 3)]: put(lead, whistle(mk(m), d * B * .95), b * B, .12)
    mus = mus + lead
    # 漸慢收尾＋最後一個和弦
    end = int(32.0 * SR); mus[end:] *= np.linspace(1, 0, N - end)
    MUS.add(mus, 0, .9, norm=True); MUS.L, MUS.R = MUS.L * .3 / .9, MUS.R * .3 / .9

# 安靜段：音樂和環境壓到 0（前後 60 ms 斜坡）
gate = np.ones(N)
for a, b in silences:
    ia, ib, r = int(a * SR), int(b * SR), int(.06 * SR)
    gate[ia:ib] = 0; gate[max(0, ia - r):ia] = np.minimum(gate[max(0, ia - r):ia], np.linspace(1, 0, ia - max(0, ia - r))); gate[ib:ib + r] = np.minimum(gate[ib:ib + r], np.linspace(0, 1, len(gate[ib:ib + r])))
for bus in (MUS, AMB): bus.L *= gate; bus.R *= gate

(HERE / 'out').mkdir(exist_ok=True)
def save(name, L, R, peak=.9):
    x = np.stack([L, R], 1); x = x / (np.abs(x).max() + 1e-9) * peak; wavfile.write(HERE / 'out' / name, SR, (x * 32767).astype(np.int16))
save('sfx.wav', SFX.L + AMB.L, SFX.R + AMB.R)
save('mix.wav', SFX.L + AMB.L + MUS.L, SFX.R + AMB.R + MUS.R)
print('mix', N / SR, 's; silences', silences, '; music', 'score' if SCORE.exists() else 'gemini' if gem.exists() else 'temp')
