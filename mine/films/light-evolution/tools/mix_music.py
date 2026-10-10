#!/usr/bin/env python3
"""把 Gemini 生成的配樂與純音效軌混在一起，再換掉影片的聲音（影片不重渲染）。
用法：
  ffmpeg -i music.mp3 -ar 44100 -ac 2 music.wav
  python3 mix_music.py --video 成片.mp4 --sfx sfx_only.wav --music music.wav --offset 2.0 --out 成片_配樂.mp4
--offset：音樂延後幾秒進場（用頻譜找停頓/爆發點對齊畫面）。需要剪接時另加 --cut 影片秒:音樂起點:音樂跳到（在小節線上，交叉淡化 2.4s）。
"""
import argparse, subprocess, wave, numpy as np
ap = argparse.ArgumentParser()
ap.add_argument('--video', required=True); ap.add_argument('--sfx', required=True); ap.add_argument('--music', required=True)
ap.add_argument('--offset', type=float, default=0); ap.add_argument('--out', required=True)
ap.add_argument('--music-gain', type=float, default=.85); ap.add_argument('--sfx-gain', type=float, default=.6)
ap.add_argument('--cut', help='影片秒:音樂A:音樂B，例 77.2:76.0:104.8'); ap.add_argument('--xf', type=float, default=2.4)
a = ap.parse_args()
def rd(f):
    w = wave.open(f); return np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2) / 32768.
SR = 44100; m = rd(a.music); s = rd(a.sfx); N = len(s); out = np.zeros((N, 2)); i0 = int(a.offset * SR)
if a.cut:
    cv, A, B = map(float, a.cut.split(':')); x = int(a.xf * SR); h = x // 2; c = int(cv * SR)
    seg1 = m[:int((A + a.xf / 2) * SR)]; out[i0:i0 + len(seg1)] += seg1[:N - i0]
    out[c - h:c + h] *= np.linspace(1, 0, x)[:, None][:len(out[c - h:c + h])]; out[c + h:] = 0
    seg2 = m[int((B - a.xf / 2) * SR):]; j0 = c - h; L = min(len(seg2), N - j0); seg2 = seg2[:L].copy(); seg2[:x] *= np.linspace(0, 1, x)[:, None]; out[j0:j0 + L] += seg2
else:
    L = min(len(m), N - i0); out[i0:i0 + L] = m[:L]
mix = out * a.music_gain + s * a.sfx_gain; t = np.arange(N) / SR; mix *= np.clip((N / SR - t) / 2.5, 0, 1)[:, None]
pk = np.abs(mix).max(); mix = mix / pk * .95 if pk > .95 else mix
w = wave.open('_mix.wav', 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes()); w.close()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-i', '_mix.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', a.out], check=True)
print('done', a.out)
