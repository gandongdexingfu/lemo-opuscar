# 程序生成曬圖紙（普魯士藍）：配色與層次照 opuscar blueprint 的 paper.js（fbm 褪色、橫向刷痕、纖維、十字折痕、邊緣褪白、污點）
# python3 paper.py → paper.jpg（2400 × 5200，圖紙座標 1:1，放在 x=-200、y=-400）
import numpy as np
from PIL import Image

W, H = 2400, 5200
rng = np.random.default_rng(2007)

def noise(sx, sy, oct=5, seed=0):
    """多倍頻值噪聲：在 sx × sy 的格點上取亂數，雙三次放大到全圖"""
    g = np.random.default_rng(seed)
    out = np.zeros((H, W), np.float32); a = 0.5; tot = 0
    for o in range(oct):
        gw, gh = max(2, int(W / sx * 2 ** o)), max(2, int(H / sy * 2 ** o))
        small = g.random((gh, gw)).astype(np.float32)
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        out += a * np.asarray(img, np.float32) / 255; tot += a; a *= 0.5
    return out / tot

n1 = noise(760, 760, 4, 1)
n2 = noise(1500, 70, 4, 2)          # 橫向拉長的塗布刷痕
n3 = noise(190, 190, 4, 3)
x = np.linspace(0, 1, W)[None, :]; y = np.linspace(0, 1, H)[:, None]
m = np.clip(0.10 + 0.95 * (n1 - 0.25) + 0.22 * (n2 - 0.5) + 0.14 * (n3 - 0.5) + 0.12 * x + 0.06 * (1 - y), 0, 1)
dark = np.array([0.094, 0.200, 0.420]); light = np.array([0.165, 0.345, 0.650])
c = dark[None, None] * (1 - m[..., None]) + light[None, None] * m[..., None]

fib = noise(3, 3, 2, 4) * 0.5 + noise(1.2, 1.2, 1, 5) * 0.5
c *= (0.955 + 0.075 * fib)[..., None]
fl = np.clip((noise(40, 3, 2, 6) - 0.80) / 0.2, 0, 1)
c = c * (1 + 0.10 * fl[..., None]) + 0.015 * fl[..., None]

# 折痕：三等分橫折＋中線豎折（亮邊／暗邊＋磨白）
X = np.arange(W)[None, :].astype(np.float32); Y = np.arange(H)[:, None].astype(np.float32)
wob = (noise(400, 400, 2, 7) - 0.5) * 12
def crease(d):
    return np.exp(-d * d / 18.0), np.sign(d) * np.exp(-d * d / 260.0)
lines = [(X - W * 0.22 + wob, 0.05)] + [(Y - H * f + wob, 0.06) for f in (1 / 3, 2 / 3)]
wear = np.zeros((H, W), np.float32)
for d, s in lines:
    core, side = crease(d)
    c *= (1 + s * side)[..., None]
    wear += core
wear *= np.clip((noise(9, 9, 2, 8) - 0.45) / 0.35, 0, 1)
c = c * (1 - np.clip(wear * 0.5, 0, 0.55)[..., None]) + np.array([0.55, 0.66, 0.82])[None, None] * np.clip(wear * 0.5, 0, 0.55)[..., None]

# 邊緣褪白（不規則）、角落更白
e = np.minimum(np.minimum(X, W - X), np.minimum(Y, H - Y)) + 70 * (noise(60, 60, 3, 9) - 0.5)
bl = np.clip(1 - (e + 40) / 130, 0, 1) ** 1.5
c = c * (1 - 0.8 * bl[..., None]) + np.array([0.50, 0.62, 0.80])[None, None] * 0.8 * bl[..., None]
# 小污點
sp = np.clip((noise(14, 14, 1, 10) - 0.93) / 0.07, 0, 1)
c *= (1 - 0.09 * sp)[..., None]
c += (rng.random((H, W, 1)) - 0.5) * 0.012           # 極細顆粒
Image.fromarray((np.clip(c, 0, 1) * 255).astype(np.uint8)).save("paper.jpg", quality=88)
print("paper.jpg", c.shape, c.mean(axis=(0, 1)).round(3))
