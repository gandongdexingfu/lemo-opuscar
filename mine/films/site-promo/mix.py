"""全片聲音：events.json（index.html 的 window.EV）→ out/sfx.wav（音效＋環境）、out/mix.wav（混音）
三層：環境（白天的空氣聲 / 幻燈機風扇）、動作音效（每個看得見的動作都有聲音）、配樂（music/score.wav）。
聲音轉場：風扇聲在房間變暗前 1 秒就進來（J-cut）；天亮後還延續 2 秒才退（L-cut）。"""
import json, sys, numpy as np, soundfile as sf
from pathlib import Path
HERE = Path(__file__).resolve().parent; LIB = next(p for p in HERE.parents if (p / "core" / "audio").is_dir())
sys.path.insert(0, str(LIB))
from core.audio import sfx as X
SR = X.SR
E = json.loads((HERE / 'events.json').read_text())
DUR = 27.6; N = int(DUR * SR)
EV = E['ev'] if 'ev' in E else E['EV']
at = {e['type']: e for e in EV}
fx = np.zeros((N, 2)); amb = np.zeros((N, 2))
tt = np.arange(N) / SR
rng = np.random.default_rng(3)
def env(a, b, fa=.3, fb=.3):  # 從 a 淡入、到 b 淡出
    return np.clip((tt - a) / fa, 0, 1) * np.clip((b - tt) / fb, 0, 1)
def sine(f, d, tau, ph=0): t = X.t_(d); return np.sin(2 * np.pi * f * t + ph) * X.env_exp(d, tau)
def glass_tap(p=1.0, v=1.0):   # 玻璃片輕碰：高頻共振、很短
    d = .5; t = X.t_(d)
    x = sum(a * np.sin(2 * np.pi * f * p * t) * X.env_exp(d, tau) for f, a, tau in [(2350, 1, .12), (3720, .6, .07), (5480, .35, .04)])
    return X.norm(x + X.hp(X.noise(d), 4000) * X.env_exp(d, .002) * .6) * v

# —— 環境 1：白天的空氣聲（很淡的柔和噪聲） ——
air = X.lp(X.hp(rng.standard_normal(N), 200), 2500)
air /= np.abs(air).max(); a_env = np.clip(1 - (tt - 8.4) / 1.2, 0, 1) + np.clip((tt - 22.2) / 1.5, 0, 1)
amb[:, 0] += air * np.clip(a_env, 0, 1) * .035; amb[:, 1] += np.roll(air, 999) * np.clip(a_env, 0, 1) * .035
# —— 環境 2：幻燈機風扇（低鳴＋葉片的拍頻＋濾過的風聲），9.0 進來、24.5 才退 ——
hum = sum(a * np.sin(2 * np.pi * f * tt + k) for k, (f, a) in enumerate([(98, .5), (196, .35), (294, .18), (392, .1)]))
hum *= 1 + .15 * np.sin(2 * np.pi * 6.5 * tt)
wind = X.bp(rng.standard_normal(N), 300, 1800); wind /= np.abs(wind).max()
f_env = env(9.0, 24.6, 1.0, 1.8) * (1 - .45 * env(20.4, 21.6, .2, .3))
fan = (hum * .05 + wind * .03) * f_env
amb[:, 0] += fan; amb[:, 1] += fan * .9

# —— 動作音效 ——
X.add(fx, sine(2637, .9, .25) * .6 + np.pad(sine(5274, .4, .08), (0, int(.5 * SR))) * .2, at['ping']['t'], .35)              # 藍點：細細的「叮」
for k in range(16):                                                                                  # 線一條條畫出來：細沙沙聲
    t0 = at['draw']['t'] + k * .068 + rng.random() * .02; d = .09
    X.add(fx, X.bp(X.noise(d), 3500, 9000) * np.sin(np.pi * X.t_(d) / d), t0, .05 + .02 * rng.random(), -.5 + k / 16)
for k in range(5):                                                                                   # 五層拉開：玻璃片錯開輕碰
    X.add(fx, glass_tap(.9 + .08 * k, 1), at['burst']['t'] + .05 + k * .055, .16, -.6 + .3 * k)
X.add(fx, X.whoosh(.45, 1), at['burst']['t'] - .05, .1)
for e in EV:
    if e['type'] == 'layer': X.add(fx, X.click(1.5 + .1 * e['i'], 1), e['t'], .12, -.3 + .15 * e['i'])   # 每層亮起：一個細 tick
X.add(fx, X.whoosh(1.2, 1), at['whoosh']['t'], .22, -.2)                                             # 起飛
X.add(fx, X.whoosh(.6, 1), at['whoosh']['t'] + .9, .12, .3)
X.add(fx, X.clack(1.3, 1), at['land']['t'], .22, .2)                                                 # 落進轉盤
X.add(fx, X.clack(.8, 1), at['click']['t'], .3, .25); X.add(fx, X.click(.7, .8), at['click']['t'] + .03, .2, .25)   # 片子卡進片門
ig = at['ignite']['t']                                                                               # 點亮：燈泡「咚」＋電流「嗡」
X.add(fx, X.thump(1, 55), ig, .5); X.add(fx, X.ignite(1), ig, .3)
d = 1.6; t = X.t_(d); buzz = (np.sin(2 * np.pi * 120 * t) * .6 + np.sin(2 * np.pi * 240 * t) * .3 + X.bp(X.noise(d), 2000, 5000) * .08) * X.env_exp(d, .45)
X.add(fx, X.norm(buzz), ig, .12)
X.add(fx, X.click(1.2, 1), at['grab']['t'], .15, .2)                                                 # 按住轉盤
s0, s1 = at['spin']['t'], at['spin']['t1']                                                           # 轉盤轉過 7 格：每過一格一聲棘輪，越來越快再放慢
ease = lambda k: 4 * k ** 3 if k < .5 else 1 - (-2 * k + 2) ** 3 / 2
ks = np.linspace(0, 1, 4000); pos = np.array([ease(k) for k in ks]) * 7
for j in range(1, 8):
    k = ks[np.argmax(pos >= j)]; X.add(fx, X.clack(1.6 + .05 * j, 1), s0 + k * (s1 - s0) + .12, .16, -.3 + .1 * j)
sw = at['swap']['t']                                                                                 # 換片：咔嗒＋燈閃一下的嗞聲
X.add(fx, X.clack(.9, 1), sw - .05, .3, .2); X.add(fx, X.norm(X.bp(X.noise(.4), 1500, 6000) * X.env_exp(.4, .05)), sw, .06)
X.add(fx, X.thump(1, 70), sw, .25)
ti = at['title']['t']                                                                                # 標題浮現：柔和的閃光聲
d = 1.8; t = X.t_(d); sh = X.bp(X.noise(d), 5000, 11000) * np.sin(np.pi * t / d) ** 2
X.add(fx, X.norm(sh), ti, .05)
u0, u1 = at['type']['t'], at['type']['t1']                                                           # 網址逐字打出來：25 個極輕的鍵聲
for j in range(25):
    X.add(fx, X.click(2.2 + .04 * (j % 5), 1), u0 + (u1 - u0) * (j / 25) ** 1 + .01, .05, -.4 + .8 * j / 25)
cl = at['close']['t']                                                                                # 光收回去：反向的細「咻」
w = X.whoosh(.8, 1)[::-1]; X.add(fx, w, cl, .1)

sfx_all = fx + amb
(HERE / 'out').mkdir(exist_ok=True)
sf.write(HERE / 'out' / 'sfx.wav', sfx_all.astype(np.float32), SR)
music, msr = sf.read(HERE / 'music' / 'score.wav'); assert msr == SR
m = np.zeros((N, 2)); m[:min(N, len(music))] = music[:N]
m = m + np.stack([X.hp(m[:, 0], 4000), X.hp(m[:, 1], 4000)], 1) * .35   # 一點空氣感：玻璃與金屬的泛音再亮一些
mix = m * 1.0 + fx * 1.0 + amb * 1.0
mix = X.limit(mix, .9) if mix.ndim == 1 else np.stack([X.limit(mix[:, 0], .9), X.limit(mix[:, 1], .9)], 1)
sf.write(HERE / 'out' / 'mix.wav', mix.astype(np.float32), SR)
print('mix', N / SR, 's peak', float(np.abs(mix).max()))
