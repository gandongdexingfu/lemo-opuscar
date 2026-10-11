"""配樂（真實樂器取樣，sampler.py）：100 BPM、D 大調，乾淨透明的「玻璃與金屬」音色，對應網站的通透感。
→ music/score.wav（峰值 0.45，供 mix.py 疊進去）
樂器：顫音琴（軟槌、弓奏）、鐘琴、馬林巴、豎琴、手搖鐘、水杯琴（VCSL、FreePats，全部 CC0）。
所有時間都和 index.html 的 T 表對齊（一拍 0.6 秒）。"""
import sys, numpy as np, soundfile as sf
from pathlib import Path
HERE = Path(__file__).resolve().parent; LIB = next(p for p in HERE.parents if (p / "core" / "audio").is_dir())
sys.path.insert(0, str(LIB))
from core.audio import sampler as S
S.seed(5)
B = .6
DUR = 27.6
ev = []
def n(t, inst, m, d, v, pan=0, g=1.0): ev.append((t, inst, m, d, v, pan, g))

# 和弦（MIDI，D4 = 62）
CH = {'D': [62, 66, 69, 73], 'Bm': [59, 62, 66, 69], 'G': [59, 62, 66, 71], 'A': [61, 64, 69, 73], 'Em': [59, 64, 67, 71], 'Gmaj': [55, 62, 66, 71]}
ROOT = {'D': 38, 'Bm': 47, 'G': 43, 'A': 45, 'Em': 40, 'Gmaj': 43}
def pad(t, ch, d, v=.4, g=.8):                      # 弓奏顫音琴：沒有起音的長音，像光
    for j, m in enumerate(CH[ch][:3]): n(t, 'vibraphone_bowed', m, d, v, -.3 + .3 * j, g)
def vib(t, ch, d=1.2, v=.5, g=.9, strum=.03):
    for j, m in enumerate(CH[ch]): n(t + j * strum, 'vibraphone', m, d, v * (1 - .05 * j), -.25 + .17 * j, g)
def low(t, ch, d=1.0, v=.5, g=.9): n(t, 'marimba', ROOT[ch] + 12, d, v, 0, g)

# —— 0.0 藍點：一個鐘琴音 ——
n(0.0, 'glockenspiel', 86, 1.2, .55, 0, .8)
# 0.25–1.35 線一條條長出來：極輕的鐘琴上行
for j, m in enumerate([86, 88, 90, 93, 95, 98]): n(0.32 + j * .17, 'glockenspiel', m, .4, .22 + .03 * j, -.4 + .16 * j, .45)
# 1.5 五層爆開：顫音琴和弦＋馬林巴低音
vib(1.5, 'D', 1.4, .62, 1.0, .02); low(1.5, 'D', 1.2, .6)

# —— 2.4–7.2 指過五層：每層一個上行的旋律音，和弦每兩拍換一次 ——
PROG = [(2.4, 'D'), (3.6, 'Bm'), (4.8, 'G'), (6.0, 'A')]
LAY = [69, 71, 74, 76, 78]
for t, ch in PROG:
    pad(t, ch, 1.25, .35, .55); low(t, ch, .9, .45)
for i, t in enumerate([2.4, 3.6, 4.8, 6.0, 7.2]):
    n(t, 'vibraphone', LAY[i], 1.0, .62, .1, 1.0); n(t + .005, 'glockenspiel', LAY[i] + 12, .5, .3, -.2, .4)
for k in range(16):                                  # 馬林巴八分音符脈衝，越來越亮
    t = 2.4 + k * B / 2; ch = PROG[min(3, int((t - 2.4) // 1.2))][1]
    n(t, 'marimba', CH[ch][(k % 4) % 3] - 12 + 12 * (k % 2), .25, .24 + .012 * k, .35 * (1 if k % 2 else -1), .6)
vib(7.2, 'D', 1.0, .55, .9)

# —— 7.8–9.3 起飛：豎琴與鐘琴上行琶音，然後全停（9.6–10.2 安靜） ——
for j in range(14):
    t = 7.8 + j * .1; m = [62, 66, 69, 73, 74, 78, 81, 85, 86, 90, 93, 97, 98, 102][j]
    n(t, 'harp', m, .5, .5 - .015 * j, -.5 + .07 * j, .7)
n(9.3, 'hand_chimes', 81, 1.2, .35, .2, .5)

# —— 10.2 點亮：低音＋弓奏鋪底＋手搖鐘；顫音琴主題 ——
THEME = [(0, 78, 1), (1, 76, 1), (2, 74, 1), (3, 69, 1), (4, 71, 1), (5, 74, 1), (6, 76, 2)]
def theme(t0, tr=0, inst='vibraphone', v=.6, g=1.0, pan=.15):
    for b, m, d in THEME: n(t0 + b * B, inst, m + tr, d * B * .95, v, pan, g)
t = 10.2
n(t, 'marimba', 38, 2.2, .7, 0, 1.0); n(t, 'hand_chimes', 74, 2.5, .45, -.2, .7); n(t + .02, 'hand_chimes', 81, 2.5, .35, .3, .6)
for b, ch in [(0, 'D'), (4, 'G'), (8, 'Em'), (12, 'A')]:
    tt = t + b * B
    if tt >= 15.0: break
    pad(tt, ch, 2.35, .4, .7); low(tt, ch, 1.1, .5)
    for k in (2, 3): n(tt + k * B, 'marimba', CH[ch][k % 3], .25, .3, .3, .55)
theme(t + 2 * B, v=.58)
theme(t + 2 * B, tr=12, inst='glockenspiel', v=.25, g=.35, pan=-.25)

# —— 15.0–15.9 拖轉盤：豎琴快速上行（全片唯一的加速），16.2 換片的和弦 ——
for j in range(22):
    k = j / 21; t = 15.0 + .9 * (1 - (1 - k) ** 1.7)          # 越撥越快
    n(t, 'harp', 50 + j * 2 + (j % 3 == 0), .35, .35 + .3 * k, -.6 + 1.2 * k, .65)
t = 16.2
vib(t, 'D', 1.6, .7, 1.0, .015); n(t, 'marimba', 38, 1.8, .7, 0, 1.0); n(t, 'glockenspiel', 90, 1.0, .45, .3, .55)
for b, ch in [(0, 'D'), (2, 'Bm'), (4, 'G'), (6, 'A')]:
    tt = t + b * B * 1.0
    pad(tt, ch, 1.25, .42, .75); low(tt, ch, .9, .5)
for k in range(14):
    tt = 16.2 + k * B / 2; ch = ['D', 'Bm', 'G', 'A'][min(3, k // 4)]
    n(tt, 'marimba', CH[ch][k % 3], .22, .28, .3 * (1 if k % 2 else -1), .55)
theme(16.2 + 0 * B, tr=0, v=.6)
theme(16.2 + 0 * B, tr=12, inst='glockenspiel', v=.3, g=.4, pan=-.25)

# —— 20.4–21.6 第二次安靜：只剩一個弓奏長音 ——
n(20.4, 'vibraphone_bowed', 69, 1.3, .3, 0, .55)

# —— 21.6 天亮：解決和弦；23.0 標題；23.6 網址打字；26.4 光收回成一個點 ——
t = 21.6
pad(t, 'Gmaj', 1.4, .42, .75); vib(t, 'Gmaj', 1.4, .5, .9); n(t, 'marimba', 43, 1.4, .55)
pad(23.0, 'D', 3.6, .42, .75); vib(23.0, 'D', 2.6, .55, .95, .05); n(23.0, 'marimba', 38, 2.4, .6)
n(23.0, 'glass', 81, 2.0, .45, .25, .7); n(23.15, 'glass', 86, 2.0, .4, -.25, .6)
for j, m in enumerate([74, 78, 81, 86]): n(24.2 + j * B, 'vibraphone', m, 1.2, .42, -.2 + .13 * j, .8)
n(26.4, 'glockenspiel', 86, 1.5, .55, 0, .8)                     # 和開場同一個音：首尾呼應
n(26.42, 'hand_chimes', 74, 1.2, .3, 0, .5)

mix = S.render(ev, dur=DUR)
mix = S.room(mix, size=.55, mix=.22)
N = mix.shape[0]; tt = np.arange(N) / 48000
for a, b in [(9.55, 10.2), (20.35, 20.38)]:                       # 安靜：連殘響也切乾淨（第二段只切掉前面的尾巴，留長音）
    gte = np.clip((a - tt) / .05, 0, 1) + np.clip((tt - b) / .01, 0, 1); mix *= np.clip(gte, 0, 1)[:, None]
fade = np.clip((DUR - .1 - tt) / .8, 0, 1); mix *= fade[:, None]
mix = mix / (np.abs(mix).max() + 1e-9) * .45
(HERE / 'music').mkdir(exist_ok=True)
sf.write(HERE / 'music' / 'score.wav', mix, 48000, subtype='PCM_16')
used = sorted({e[1] for e in ev}); print('score', N / 48000, 's', len(ev), 'notes', used)
(HERE / 'music' / 'credits.txt').write_text('\n'.join(S.credits(used)))
