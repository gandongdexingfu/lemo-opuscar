# 初代 iPhone 精確版：配樂＋音效＋混音 → out/mix.wav
# .venv/bin/python mine/films/iphone-evolution/mix.py   （在倉庫根目錄）
# 時間全部讀 cues.json（頁面 window.CUES 匯出），音效落在畫面動作的同一幀。
# 配器：顫音琴（軟槌旋律、弓奏長音）、鐘琴（數字與標題）、合成脈衝與低音（numpy）。調式：D 利地亞（#11 的懸浮感＝科幻）。
# 兩次安靜：16.2–17.0（第一次觸碰前）、36.3–36.8（爆炸前）。觸碰聲＝電子提示音（用戶選）。
import sys, json, os
sys.path.insert(0, '.')
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit, noise, lp, hp, bp, env_exp, t_, click, whoosh, brown, compress

HERE = os.path.dirname(os.path.abspath(__file__))
C = json.load(open(os.path.join(HERE, 'cues.json')))
T, TL, DUR = C['T'], C['TL'], C['DUR']
N = int((DUR + 0.5) * SR)
S.seed(7)
rng = np.random.default_rng(7)

music = np.zeros((N, 2), np.float32)
fx = np.zeros((N, 2), np.float32)
bed = np.zeros((N, 2), np.float32)

# ---------------------------------------------------------------- 合成器
def adsr(d, a=.01, r=.2):
    n = len(t_(d)); e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(min(r, d * .9) * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr)
    return e
def pulse(f, d, v=.5, bright=1800):
    """柔和的合成脈衝：奇次諧波＋低通，短促"""
    x = t_(d); y = sum(np.sin(2 * np.pi * f * k * x) / k for k in (1, 3, 5, 7))
    return (lp(y, bright) * env_exp(d, .09) * v).astype(np.float32)
def bass(f, d, v=.5):
    x = t_(d); y = .5 * np.sin(2 * np.pi * f * x) + .45 * np.sin(4 * np.pi * f * x) + .3 * np.sin(6 * np.pi * f * x) + .15 * np.sin(8 * np.pi * f * x)   # 2、3、4 次諧波讓小喇叭聽得到
    return (y * adsr(d, .02, .4) * v * .45).astype(np.float32)
def pad(fs, d, v=.3, a=1.0, r=1.5):
    """合成長音墊底：微失諧的正弦堆疊"""
    x = t_(d); y = 0
    for f in fs:
        for det in (-.15, .15): y = y + np.sin(2 * np.pi * (f + det) * x)
    return (lp(y / (2 * len(fs)), 3000) * adsr(d, a, r) * v).astype(np.float32)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

# ---- 觸碰提示音（全片最重要的聲音）：FM 鈴音＋次低頻一下＋短回聲（像電容觸點被點亮）
def touch_tone(f=1318.5, v=1.0):
    d = 1.6; x = t_(d)
    mod = 2.0 * env_exp(d, .08) * np.sin(2 * np.pi * f * 1.5 * x)
    bell = np.sin(2 * np.pi * f * x + mod) * env_exp(d, .35)
    air = np.sin(2 * np.pi * f * 2 * x) * env_exp(d, .12) * .25
    sub = np.sin(2 * np.pi * 55 * x) * env_exp(d, .07) * .6
    tick = hp(noise(d), 4000) * env_exp(d, .004) * .5
    y = bell + air + sub + tick
    out = y.copy()
    for k, g in ((.18, .35), (.36, .15)):           # 兩次回聲，像漣漪
        n = int(k * SR); out[n:] += y[:-n] * g
    return (out * v * .5).astype(np.float32)
def glide_tone(f0, f1, d, v=.4):
    x = t_(d); f = f0 * (f1 / f0) ** (x / d); ph = 2 * np.pi * np.cumsum(f) / SR
    return ((np.sin(ph) + .2 * np.sin(2 * ph)) * adsr(d, .08, .3) * v).astype(np.float32)
def riser(d, f0=180, f1=900, v=.5):
    x = t_(d); f = f0 * (f1 / f0) ** (x / d); ph = 2 * np.pi * np.cumsum(f) / SR
    n = bp(noise(d), 600, 6000) * (x / d) ** 2 * .3
    return ((np.sin(ph) * .6 + n) * (x / d) ** 1.5 * v).astype(np.float32)
def grid_tick(v=.3, f=3200):
    d = .06; x = t_(d)
    return (np.sin(2 * np.pi * f * x) * env_exp(d, .012) * v).astype(np.float32)
def metal(v=.6, f=2400):
    """小金屬件：螺絲、SIM 卡托、屏蔽蓋扣合"""
    d = .5; x = t_(d)
    y = sum(np.sin(2 * np.pi * f * r * x) * env_exp(d, .04 + .02 * i) for i, r in enumerate((1, 1.51, 2.37, 3.1)))
    y = y * .3 + hp(noise(d), 3000) * env_exp(d, .006)
    return (y * v * .4).astype(np.float32)

def put(buf, x, at, gain=1.0, pan=0.0):
    if at < 0 or at > DUR: return
    add(buf, x, at, gain, pan)

# ================================================================ 音樂
D = 62  # D4
LYD = [0, 2, 4, 6, 7, 9, 11]                 # D 利地亞
def deg(n, base=D): o, k = divmod(n, 7); return base + 12 * o + LYD[k]
BEAT = .6                                      # 100 BPM
ev = []                                        # 取樣事件 (t, inst, pitch, dur, vel, pan, gain)

# A 0–6.4 鍵盤手機：悶的脈衝，像舊設備在待機
for k in range(int(6.4 / BEAT)):
    t = .6 + k * BEAT
    put(music, pulse(hz(50 if k % 4 else 50), .35, .22, 700), t, .7)
    if k % 4 == 2: put(music, pulse(hz(57), .3, .14, 900), t, .6, .2)
put(music, pad([hz(50), hz(57)], 6.6, .18, 1.5, 1.2), .4, .8)
# B 6.4–8.5 鍵帽飛走、變形：上揚
put(music, riser(2.2, 120, 700, .35), 6.4, .8)
ev += [(8.5, 'glockenspiel', deg(9 + 7), 1.5, .6, .2, .6), (8.5, 'vibraphone', deg(0), 2.0, .5, -.1, .8), (8.5, 'vibraphone', deg(4), 2.0, .45, .1, .7)]
# C 8.5–13.8 iPhone 正面：主題第一次露面（輕）
motif = [0, 4, 3, 7, 6, 4]                     # 帶 #11 的上行音型
for j, n in enumerate(motif):
    ev.append((9.4 + j * BEAT, 'vibraphone', deg(n), 1.2, .42, -.2 + j * .08, .8))
for j, n in enumerate([7, 6, 4, 2]):
    ev.append((9.4 + 6 * BEAT + .6 + j * BEAT, 'vibraphone', deg(n), 1.2, .36, .2 - j * .08, .7))
put(music, pad([hz(62), hz(69), hz(73)], 5.0, .16, 1.0, 1.4), 9.0, .8)
put(music, bass(hz(38), 4.4, .3), 9.4, .8)
# D 13.8–16.2 衝進玻璃：濾波收掉，只剩一條細長音
put(music, pad([hz(74), hz(81)], 2.6, .12, .4, 1.2), 13.6, .7)
# —— 安靜 16.2–17.0 ——
# E 17–33.2 觸控與正面：主題完整版，100 BPM 律動
CH = [[0, 2, 4, 6], [5, 0, 2, 4], [3, 5, 0, 2], [4, 6, 1, 3]]    # I(maj7#11) vi IV V 的利地亞版本
t0 = 17.0; bar = 4 * BEAT
for b in range(int((33.2 - t0) / bar) + 1):
    t = t0 + b * bar; ch = CH[b % 4]
    if t > 33.0: break
    ev.append((t, 'vibraphone_bowed', deg(ch[0]), bar + .4, .38, -.3, .55))
    ev.append((t, 'vibraphone_bowed', deg(ch[2]), bar + .4, .34, .3, .5))
    put(music, bass(hz(deg(ch[0]) - 24), bar * .95, .32), t, .8)
    for s in range(8):                         # 八分音符脈衝（從第二小節起）
        if b == 0: break
        tt = t + s * BEAT / 2
        put(music, pulse(hz(deg(ch[s % 4]) - 12), .18, .12, 2400), tt, .55, (-.3, .3)[s % 2])
    if b >= 1:                                  # 顫音琴旋律
        line = [ch[1] + 7, ch[2] + 7, ch[3] + 7, ch[2] + 7] if b % 2 else [ch[3] + 7, ch[2] + 7, ch[1] + 7, ch[0] + 7]
        for j, n in enumerate(line): ev.append((t + j * BEAT, 'vibraphone', deg(n), .9, .4 + .05 * (j == 0), .15, .75))
# F 33.8–36.2 背面組合：收窄，懸著
put(music, pad([hz(62), hz(68)], 2.6, .14, .6, .8), 33.6, .8)
ev.append((33.8, 'vibraphone_bowed', deg(3), 2.3, .35, 0, .5))
# —— 安靜 36.3–36.8 ——
# G 36.8–41.4 爆炸：高潮
ev += [(36.8, 'vibraphone_bowed', deg(0), 4.6, .55, -.3, .7), (36.8, 'vibraphone_bowed', deg(4), 4.6, .5, .3, .65), (36.8, 'vibraphone_bowed', deg(3 + 7), 4.6, .45, 0, .6)]
put(music, bass(hz(38), 4.6, .45), 36.8, .9)
for k in range(int(4.6 / (BEAT / 2))):
    tt = 36.8 + k * BEAT / 2
    put(music, pulse(hz(deg([0, 4, 7, 10][k % 4]) - 12), .2, .16 + .04 * min(1, k / 8), 3200), tt, .6, (-.35, .35)[k % 2])
for j, n in enumerate([7, 9, 11, 12, 14, 13, 11, 14]):     # 發牌時的上行琶音
    ev.append((38.1 + j * .27, 'glockenspiel', deg(n + 7), .8, .5, -.4 + j * .1, .5))
# H 41.4–74.8 逐組巡覽：低密度循環
for b in range(int((74.8 - 41.4) / bar) + 1):
    t = 41.4 + b * bar; ch = CH[b % 4]
    if t > 74.6: break
    ev.append((t, 'vibraphone_bowed', deg(ch[0]), bar + .3, .26, -.3, .45))
    ev.append((t, 'vibraphone_bowed', deg(ch[2]), bar + .3, .24, .3, .4))
    put(music, bass(hz(deg(ch[0]) - 24), bar * .9, .22), t, .8)
    for s in range(4): put(music, pulse(hz(deg(ch[s]) - 12), .16, .07, 2000), t + s * BEAT, .5, (-.25, .25)[s % 2])
for st in C['stops']:                           # 每組亮起時一個鐘琴音（依組號上行）
    ev.append((st['t'] - .15, 'glockenspiel', deg(st['i'] + 7), 1.2, .5, -.5 + st['i'] / 8, .55))
# I 76.4 標題欄：收尾和弦
TB = C['TOUR1'] + 1.6
ev += [(TB, 'vibraphone_bowed', deg(0), 6.5, .45, -.3, .6), (TB, 'vibraphone_bowed', deg(4), 6.5, .4, .3, .55), (TB, 'vibraphone_bowed', deg(3 + 7), 6.5, .35, 0, .5),
       (TB, 'vibraphone', deg(7), 3.0, .45, 0, .7), (TB + .4, 'glockenspiel', deg(14), 2.0, .4, .2, .45)]
put(music, bass(hz(38), 6.0, .3), TB, .8)

samp = S.render(ev, dur=DUR + .5, master=False)
music += samp[:N]
music = S.room(music, size=.55, mix=.22)
for ch in range(2): music[:, ch] -= .6 * lp(music[:, ch], 200, 2)   # 低頻壓下去（合成配樂容易轟）
# 安靜段：音樂（含殘響）真正歸零
for a, b in ((16.2, 17.0), (36.3, 36.8)):
    i0, i1 = int(a * SR), int(b * SR); fade = int(.25 * SR)
    music[i0 - fade:i0] *= np.linspace(1, 0, fade)[:, None]; music[i0:i1] = 0
music[int((DUR - 2.5) * SR):] *= np.linspace(1, 0, len(music) - int((DUR - 2.5) * SR))[:, None]

# ================================================================ 音效
# 鍵盤手機：按鍵塑膠咔嗒（出現時輕，飛走時一排一排）
for k in C['keys']:
    put(fx, click(1.6 + .15 * rng.random(), .25), 1.4 + k['row'] * .12 + k['col'] * .03, .12, (k['col'] - 4.5) / 6)
    put(fx, click(1.0 + .3 * rng.random(), .6), T['keysGo'] + (k['row'] + 1) * .13 + k['col'] * .025 + .15, .22, (k['col'] - 4.5) / 6)
put(fx, whoosh(1.2, .6), T['keysGo'] + .3, .35)
put(fx, glide_tone(220, 660, 1.4, .25), T['morph0'], .5)          # 屏幕被拉大
# 衝進玻璃
put(fx, whoosh(1.4, 1.0), T['dive0'] + .1, .55)
for c in range(10): put(fx, grid_tick(.22, 2800 + 40 * c), T['grid'] + c * .05, .35, -.5 + c / 9)       # 電極一條條通電
for r in range(16): put(fx, grid_tick(.18, 3600 - 30 * r), T['grid'] + .5 + r * .04, .3, .3)
# 第一次觸碰（安靜後第一個聲音）、第二指、捏合
put(fx, touch_tone(1318.5, 1.0), T['touch1'], 1.0, -.1)
put(fx, touch_tone(1318.5, .8), T['touch2'], .8, -.2)
put(fx, touch_tone(1975.5, .8), T['touch2'] + .08, .8, .25)
put(fx, glide_tone(1318.5, 1760, T['pinch1'] - T['pinch0'], .18), T['pinch0'], .7, -.2)
put(fx, glide_tone(1975.5, 2637, T['pinch1'] - T['pinch0'], .14), T['pinch0'], .7, .2)
put(fx, whoosh(1.4, .7), T['back0'], .45)
# 尺寸：三條尺寸線＋字逐位出現
for k, dt in enumerate((0, .4, .8)):
    put(fx, grid_tick(.35, 2200 + 200 * k), T['dims'] + dt, .5, -.3 + .3 * k)
    put(fx, grid_tick(.25, 3400), T['dims'] + dt + .45, .3)
put(fx, whoosh(1.0, .5), T['out1'], .35)
# SIM 卡托退出
put(fx, metal(.8, 2600), T['sim'] + .05, .6, .2)
put(fx, click(2.2, .8), T['sim'], .4, .2)
# 爆炸：抬升（上升音＋低頻）、發牌（9 下輕掃，依位置定聲像）、分層（金屬碎響）
put(fx, riser(TL['lift'][1] - TL['lift'][0] + .3, 90, 520, .7), T['ex'], .6)
put(fx, lp(noise(1.4), 120).astype(np.float32) * env_exp(1.4, .5).astype(np.float32), T['ex'], .5)
for i in range(9):
    put(fx, whoosh(.9, .55), T['ex'] + TL['slide0'] + abs(i - 4) * TL['stagger'], .32, (i - 4) / 5)
for j in range(14):
    put(fx, metal(.35, 2400 + 600 * rng.random()), T['ex'] + TL['subs'][0] + .05 * j + .2 * rng.random(), .25, rng.uniform(-.7, .7))
# 巡覽：主板屏蔽蓋掀開、通訊板升起
s5 = C['stops'][5]['t']
put(fx, metal(.7, 1900), s5 + .5, .45, .1); put(fx, whoosh(1.1, .5), s5 + .5, .3, .1)
put(fx, whoosh(1.0, .45), s5 + 2.0, .3, -.1)
# 標題欄
put(fx, grid_tick(.3, 2600), TB, .4)

# ---- 環境音：很輕的室內底噪；安靜段一起降
b = lp(brown(DUR + .5), 900)[:N]; b = b / np.abs(b).max() * .02
bed[:, 0] = b; bed[:, 1] = np.roll(b, 2400)
for a, c in ((16.2, 17.0), (36.3, 36.8)):
    bed[int(a * SR):int(c * SR)] *= .35

# ================================================================ 混音
mix = music * .55 + fx * .9 + bed
for ch in range(2): mix[:, ch] = limit(mix[:, ch], .95)
out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
sf.write(os.path.join(out, 'mix.wav'), mix.astype(np.float32), SR)
# 頻段檢查：20–120 Hz 相對其餘
spec = np.abs(np.fft.rfft(mix[:, 0][::4])); fr = np.fft.rfftfreq(len(mix[:, 0][::4]), 4 / SR)
lo = 10 * np.log10((spec[(fr > 20) & (fr < 120)] ** 2).mean()); rest = 10 * np.log10((spec[(fr > 120) & (fr < 8000)] ** 2).mean())
print(f'mix.wav {len(mix) / SR:.1f}s  peak {np.abs(mix).max():.2f}  low-end {lo - rest:+.1f} dB vs rest')
print(S.credits(['vibraphone', 'vibraphone_bowed', 'glockenspiel']))
