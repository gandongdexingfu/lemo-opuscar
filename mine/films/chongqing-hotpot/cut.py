"""剪接：10 段 MiniMax 素材 → 22 秒循環畫面（out/picture.mp4）
用法：python3 cut.py <ASSETS>   # ASSETS = assets/chongqing-hotpot 分支的根目錄
節拍：120 BPM，一拍 0.5 秒。每段前後各留 0.15 秒把手做 0.3 秒溶接，交接中心落在拍點上。"""
import subprocess, sys, os
A = sys.argv[1] if len(sys.argv) > 1 else "assets"
C = os.path.join(A, "clips")
os.makedirs("out", exist_ok=True)
# (素材, 入點, 出點, 在片中佔的秒數)
S = [("s01_freezer_shiver.mp4",   3.8, 5.8,  2.0),   # 冷凍庫抱團發抖
     ("s02_tallow_hotspring.mp4", 0.0, 6.55, 2.0),   # 牛油大叔泡溫泉（固定鏡頭，整段加速成縮時）
     ("s03_chili_party.mp4",      0.6, 2.6,  2.0),   # 紅湯派對（3 秒後角色融合，不用）
     ("s04_chopstick_dive.mp4",   0.5, 4.5,  2.0),   # 筷子跳水板猶豫（2×）
     ("s05_cannonball.mp4",       0.5, 3.5,  2.0),   # 炸彈式跳水，入水落在 8.0 秒
     ("s06_tripe_bungee.mp4",     0.5, 4.5,  2.0),   # 毛肚蔥繩彈跳（2×）
     ("s07_duckblood_tofu.mp4",   2.7, 4.7,  2.0),   # 香菜滑落笑點
     ("s08_oil_dish_divers.mp4",  0.0, 2.0,  2.0),   # 蒜蔥跳水隊
     ("s09_beef_to_dish.mp4",     0.4, 2.4,  2.0),   # 落油對 16.5 秒拍點
     ("s10_group_thumbs.mp4",     2.0, 6.55, 3.0)]   # 比讚＋蒸氣全白
T = 0.3; H = T / 2; SRC = 6.58
TRANS = ["fadewhite"] + ["dissolve"] * 8              # 冷→熱用閃白，其餘溶接
def ff(*a): subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)
outs = []
for i, (f, a, b, d) in enumerate(S, 1):
    sp = (b - a) / d
    hh = H if i > 1 else 0; ht = H if i < 10 else 0
    D = d + hh + ht
    a2 = max(0, a - hh * sp); b2 = min(SRC, b + ht * sp); sp2 = (b2 - a2) / D
    vf = f"trim={a2}:{b2},setpts=(PTS-STARTPTS)/{sp2},fps=30,scale=1080:1920:flags=lanczos,setsar=1"
    if i == 7: vf += ",colorbalance=rm=0.06:bm=-0.04"              # 鴨血偏咖啡色 → 拉回酒紅
    if i == 10: vf += f",fade=t=out:st={D-0.5}:d=0.5:color=0xEEF4FF"  # 淡到冰白，接循環
    vf += f",trim=duration={D},setpts=PTS-STARTPTS"
    o = f"out/h{i:02d}.mp4"; outs.append((o, D))
    ff("-i", os.path.join(C, f), "-an", "-vf", vf, "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", o)
inputs = []; [inputs.extend(["-i", o]) for o, _ in outs]
fc = []; prev = "[0:v]"; acc = outs[0][1]
for k in range(1, len(outs)):
    off = acc - T; lab = f"[x{k}]"
    fc.append(f"{prev}[{k}:v]xfade=transition={TRANS[k-1]}:duration={T}:offset={off:.4f}{lab}")
    prev = lab; acc = off + outs[k][1]
ff(*inputs, "-filter_complex", ";".join(fc), "-map", prev, "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "out/body.mp4")
# 循環段 21–22 秒：從冰白淡入第 1 鏡（取素材 2.8–3.8 秒，正好接上片頭的 3.8 秒）
ff("-i", os.path.join(C, S[0][0]), "-an", "-vf", "trim=2.8:3.8,setpts=PTS-STARTPTS,fps=30,scale=1080:1920:flags=lanczos,setsar=1,fade=t=in:st=0.1:d=0.9:color=0xEEF4FF,trim=duration=1.0",
   "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "out/loop.mp4")
open("out/list.txt", "w").write("file 'body.mp4'\nfile 'loop.mp4'\n")
ff("-f", "concat", "-safe", "0", "-i", "out/list.txt", "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-r", "30", "out/picture.mp4")
print("picture: 22 s → out/picture.mp4")
