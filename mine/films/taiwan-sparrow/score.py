"""配樂（真實樂器取樣，sampler.py）：100 BPM、C 大調；每個段落各自以畫面時間為拍點原點
→ music/score.wav（峰值 0.45，供 mix.py 疊進去）
樂器：烏克麗麗（FreePats）、竪笛主旋律、木琴、鐘琴、馬林巴低音、沙鈴、木魚（VCSL）。全部 CC0。"""
import sys, numpy as np, soundfile as sf
from pathlib import Path
HERE = Path(__file__).parent; LIB = HERE.parent.parent
sys.path.insert(0, str(LIB))
from core.audio import sampler as S
S.seed(11)
B = .6                     # 一拍
DUR = 33.3
ev = []                    # (t, inst, pitch, dur, vel, pan[, gain])
def at(g0, beat): return g0 + beat * B
CH = {'C': [60, 64, 67, 72], 'Am': [57, 60, 64, 69], 'F': [53, 57, 60, 65], 'G': [55, 59, 62, 67], 'Dm': [57, 62, 65, 69]}
ROOT = {'C': 48, 'Am': 45, 'F': 41, 'G': 43, 'Dm': 50}
def strum(t, ch, vel=.55, down=True, dur=.5, gain=1.0):
    ns = CH[ch] if down else CH[ch][::-1]
    for j, m in enumerate(ns): ev.append((t + j * .014, 'ukulele', m, dur, vel * (1 - .06 * j), -.15, gain))
def bass(t, ch, dur=.5, vel=.6, oct=0): ev.append((t, 'marimba', ROOT[ch] + oct, dur, vel, 0, 1.1))
def mel(g0, notes, inst='recorder', vel=.6, tr=0, pan=.15, gain=.9, stop=None):
    for b, m, d in notes:
        t = at(g0, b)
        if stop is not None and t >= stop: continue
        dd = d * B * .92 if stop is None else min(d * B * .92, stop - t - .03)
        ev.append((t, inst, m + tr, dd, vel, pan, gain))
THEME = [(0, 76, 1), (1, 79, 1), (2, 81, .5), (2.5, 79, .5), (3, 76, 1), (4, 74, .5), (4.5, 72, .5), (5, 74, 1), (6, 76, 2)]
ANSWER = [(0, 76, 1), (1, 79, 1), (2, 84, 1), (3, 83, .5), (3.5, 81, .5), (4, 79, 1), (5, 77, .5), (5.5, 76, .5), (6, 72, 2)]
PROG = ['C', 'Am', 'F', 'G']

# —— A 0–3.6 早晨：輕刷＋主題前半，2.4 秒風來了：木琴下行滑音 ——
for k, b in enumerate([0, 2]): strum(at(0, b), 'C', .45, dur=1.0)
bass(0, 'C', 1.0, .45)
mel(0, THEME[:4], vel=.55)
for j in range(12): ev.append((2.4 + j * .03, 'xylophone', 96 - j * 2 + (j % 2), .2, .5, .3, .8))
strum(3.0, 'G', .5, dur=.5)

# —— B 3.6–15.0 追逐：越來越滿 ——
g = 0.0
for beat in range(6, 25):
    t = at(g, beat); ch = PROG[(beat // 4) % 4]
    dense = beat >= 14
    strum(t, ch, .55 if beat % 2 == 0 else .45, dur=.28)
    if dense: strum(t + B / 2, ch, .38, down=False, dur=.22)
    bass(t, ch, .45, .55 if beat % 2 == 0 else .45, oct=0 if beat % 2 == 0 else 7)
    if beat >= 10:
        ev.append((t, 'shaker', 'down', None, .45, .35, .7)); ev.append((t + B / 2, 'shaker', 'up', None, .35, .35, .6))
    if beat >= 14 and beat % 2 == 1: ev.append((t, 'woodblock', 'a', None, .55, -.3, .8))
for t in (6.6, 7.2, 7.8): ev.append((t, 'woodblock', 'b', None, .75, .25, 1.0))           # 蒸籠窗戶「咚」
mel(8.4, ANSWER, inst='xylophone', vel=.55, tr=12, pan=.3, gain=.7)                      # 珍奶：木琴答句
for i, m in enumerate([91, 93, 96, 98, 100]): ev.append((9.6 + i * .07, 'glockenspiel', m, .6, .6, .2 + .05 * i, .8))   # 「啵」
mel(10.8, THEME[:6], vel=.6)                                                              # 氣球飄起：竪笛主題
scale = [72, 74, 76, 77, 79, 81, 83, 84, 86, 88, 89, 91, 93, 95, 96, 98]
for j, m in enumerate(scale):                                                             # 蚊香溜滑梯：越來越快的上行
    tt = 11.6 + 1.3 * (1 - (1 - j / len(scale)) ** 1.8); ev.append((tt, 'xylophone', m, .15, .5, -.3 + .04 * j, .8))
ev.append((12.9, 'glockenspiel', 100, 1.0, .7, .3, .8))
for b, m in [(22, 55), (22.5, 57), (23, 59), (23.5, 62)]: ev.append((at(g, b), 'marimba', m, .25, .6, 0, 1.0))   # 跳水前的上行
strum(14.4, 'C', .75, dur=.6); bass(14.4, 'C', .6, .8); ev.append((14.5, 'glockenspiel', 96, 1.2, .8, 0, .9)); ev.append((14.5, 'glockenspiel', 100, 1.2, .7, .2, .8))

# —— C 15.0–18.6 雨天：稀疏、飄 ——
g = 15.0
for b, ch in [(0, 'Am'), (2, 'Am'), (4, 'F'), (6, 'G')]:
    bass(at(g, b), ch, 1.1, .4)
    for j, m in enumerate(CH[ch]): ev.append((at(g, b) + j * B / 2, 'ukulele', m + 12 if j == 3 else m, .5, .35, -.2, .8))
rng = np.random.default_rng(5)
for k in range(9):                                                                        # 雨滴：高音木琴
    tt = g + .2 + k * .36 + rng.uniform(-.05, .05); ev.append((tt, 'xylophone', int(rng.choice([84, 88, 91, 93, 96])), .2, .3, rng.uniform(-.5, .5), .55))
for i, m in enumerate([84, 88, 91, 96, 100, 103]): ev.append((16.95 + i * .09, 'glockenspiel', m, 1.2, .55, -.3 + .12 * i, .8))   # 彩虹
for b, m in [(4.5, 67), (5, 69), (5.5, 71)]: ev.append((at(g, b), 'ukulele', m, .3, .45, 0, .9))       # 停頓前的小上行（18.0）
# 18.6–19.4 全體停（無音）

# —— D 19.4–24.0 電扇＋夜市：最滿 ——
g = 19.4
for beat in range(0, 8):
    t = at(g, beat); ch = ['C', 'Am', 'F', 'G'][(beat // 2) % 4]
    if t >= 24.0: break
    for h in (0, .5):
        if t + h * B < 24.0 - .05: strum(t + h * B, ch, .6 if h == 0 else .45, down=h == 0, dur=.26)
    bass(t, ch, .26, .65);
    if t + B / 2 < 23.95: bass(t + B / 2, ch, .26, .5, oct=12)
    for q in range(4):
        if t + q * B / 4 < 23.95: ev.append((t + q * B / 4, 'shaker', 'down' if q % 2 == 0 else 'up', None, .45 if q % 2 == 0 else .3, .35, .65))
    if beat % 2 == 1: ev.append((t, 'woodblock', 'a', None, .65, -.3, .8))
mel(g, THEME, vel=.7, tr=12 - 12, stop=23.97, gain=1.0)
mel(g, THEME, inst='glockenspiel', vel=.35, tr=24 - 12, stop=23.97, gain=.45, pan=-.2)
ev.append((23.6, 'glockenspiel', 96, .35, .6, 0, .7))
# 24.0–24.8 全體停

# —— E 24.8–33 熱氣球＋結尾：主題回來，漸慢，長和弦收尾 ——
g = 24.8
for b, ch in [(0, 'F'), (2, 'G'), (4, 'C'), (6, 'Am'), (8, 'F'), (10, 'G')]:
    if at(g, b) >= 29.6: break
    strum(at(g, b), ch, .45, dur=1.1); strum(at(g, b + 1), ch, .35, dur=.5); bass(at(g, b), ch, 1.1, .5)
mel(g, ANSWER[:6] + [(6, 74, 1), (7, 72, 1)], vel=.65)
for t0, ms in [(26.3, [96, 100, 103]), (26.9, [98, 101, 105]), (27.6, [100, 103, 108])]:
    for i, m in enumerate(ms): ev.append((t0 + .06 + i * .05, 'glockenspiel', m, .8, .45, [-.5, .5, -.3][int((t0 - 26.3) / .6) % 3], .55))
# 29.0 標題：最後一個和弦（長、慢慢消失）
t = 29.6
for j, m in enumerate([48, 55, 60, 64, 67, 72, 76]): ev.append((t + j * .045, 'ukulele' if m >= 55 else 'marimba', m, 3.2, .55, -.3 + .1 * j, 1.0))
ev.append((t, 'recorder', 72, 2.6, .5, .15, .8)); ev.append((t + .1, 'glockenspiel', 84, 3.0, .45, .3, .6)); ev.append((t + .25, 'glockenspiel', 91, 3.0, .35, -.3, .5))
for j, m in enumerate([72, 76, 79, 84]): ev.append((29.0 + j * .08, 'xylophone', m + 12, .4, .35, .1 * j, .6))      # 標題寫字的小琶音

mix = S.render(ev, dur=DUR)
mix = S.room(mix, size=.35, mix=.14)
n = mix.shape[0]; t = np.arange(n) / 48000
for a, b in [(18.6, 19.4), (24.0, 24.8)]:                                                # 停頓：連殘響也切乾淨
    gte = np.clip(np.minimum((a - t) / .04, 1), 0, 1) + np.clip((t - b) / .01, 0, 1); gte = np.clip(gte, 0, 1); mix *= gte[:, None]
fade = np.clip((DUR - .2 - t) / 1.2, 0, 1); mix *= fade[:, None]
mix = mix / (np.abs(mix).max() + 1e-9) * .45
(HERE / 'music').mkdir(exist_ok=True)
sf.write(HERE / 'music' / 'score.wav', mix, 48000, subtype='PCM_16')
used = sorted({e[1] for e in ev}); print('score', n / 48000, 's', len(ev), 'notes', used)
(HERE / 'music' / 'credits.txt').write_text('\n'.join(S.credits(used)))
