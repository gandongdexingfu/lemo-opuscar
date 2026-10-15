"""Original ambient 'lab' score for the CSK-IA video. Pure synthesis, no samples."""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
DUR = 66.5
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)

# sections aligned with the video
SECTIONS = [  # start, end, chord (midi notes), root
    (0.0, 8.0,  [57, 64, 67, 71, 72], 45),   # Am9 (A C E G B)
    (8.0, 16.6, [53, 60, 64, 67, 69], 41),   # Fmaj9
    (16.6, 23.6, [48, 55, 59, 62, 64], 36),  # Cmaj9
    (23.6, 35.2, [52, 59, 62, 66, 67], 40),  # Em9
    (35.2, 47.3, [50, 57, 60, 64, 65], 38),  # Dm9
    (47.3, 59.6, [53, 60, 64, 69, 71], 41),  # Fmaj7#11-ish
    (59.6, 66.5, [57, 64, 67, 71, 76], 45),  # Am(add9) home
]
XF = 1.6  # crossfade seconds

def window(a, b):
    """smooth 0..1 gate for [a, b) with crossfades"""
    w = np.clip((t - (a - XF / 2)) / XF, 0, 1) * np.clip(((b + XF / 2) - t) / XF, 0, 1)
    return w * w * (3 - 2 * w)

def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="low", fs=SR, output="sos"), x)

def highpass(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="high", fs=SR, output="sos"), x)

L = np.zeros(N); R = np.zeros(N)

# ---- pad ----
for (a, b, notes, root) in SECTIONS:
    g = window(a, b)
    for k, m in enumerate(notes):
        f = midi(m)
        pan = 0.5 + 0.35 * np.sin(k * 1.7)
        voice = np.zeros(N)
        for det in (-0.07, 0.0, 0.06):  # semitone detune
            ff = f * 2 ** (det / 12)
            ph = rng.uniform(0, 2 * np.pi)
            voice += np.sin(2 * np.pi * ff * t + ph) + 0.18 * np.sin(4 * np.pi * ff * t + ph) + 0.06 * np.sin(6 * np.pi * ff * t)
        lfo = 0.82 + 0.18 * np.sin(2 * np.pi * (0.07 + 0.02 * k) * t + k)
        voice *= g * lfo * 0.055
        L += voice * (1 - pan) * 1.2; R += voice * pan * 1.2
    # sub
    sub = np.sin(2 * np.pi * midi(root) * t) * g * 0.035
    L += sub; R += sub
L = lowpass(L, 2200); R = lowpass(R, 2200)

# ---- soft bell arpeggio (from 8 s) ----
BPM = 72.0
eighth = 60 / BPM / 2
bell_L = np.zeros(N); bell_R = np.zeros(N)
step = 0
tt = 8.0
while tt < 62.0:
    sec = next(s for s in SECTIONS if s[0] <= tt < s[1])
    notes = sec[2]
    if rng.random() > 0.32:
        m = notes[[1, 2, 3, 4, 3, 2][step % 6]] + 12
        f = midi(m)
        vel = rng.uniform(0.35, 0.75)
        i0 = int(tt * SR); n = int(2.4 * SR)
        n = min(n, N - i0)
        tau = np.arange(n) / SR
        env = (1 - np.exp(-tau / 0.004)) * np.exp(-tau / 0.55)
        tone = (np.sin(2 * np.pi * f * tau) + 0.22 * np.sin(2 * np.pi * f * 2.0 * tau) * np.exp(-tau / 0.12)
                + 0.08 * np.sin(2 * np.pi * f * 3.01 * tau) * np.exp(-tau / 0.06))
        s = tone * env * vel * 0.05
        p = 0.5 + 0.3 * np.sin(step * 0.9)
        bell_L[i0:i0 + n] += s * (1 - p); bell_R[i0:i0 + n] += s * p
    step += 1
    tt += eighth
# ping-pong delay on the bells
d = int(SR * eighth * 3)
for _ in range(3):
    bell_L[d:] += 0.35 * bell_R[:-d]
    bell_R[d:] += 0.35 * bell_L[:-d]
L += bell_L; R += bell_R

# ---- gentle pulse in part 4 (time base) and after ----
pulse = np.zeros(N)
tt = 35.2
while tt < 59.4:
    i0 = int(tt * SR); n = min(int(0.5 * SR), N - i0)
    tau = np.arange(n) / SR
    pulse[i0:i0 + n] += np.sin(2 * np.pi * (52 + 30 * np.exp(-tau / 0.03)) * tau) * np.exp(-tau / 0.16) * 0.09
    tt += 60 / BPM * 2  # every two beats
tick = np.zeros(N)
tt = 35.2 + eighth
while tt < 59.4:
    i0 = int(tt * SR); n = min(int(0.06 * SR), N - i0)
    tick[i0:i0 + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.012) * 0.012
    tt += eighth * 2
tick = highpass(tick, 6000)
L += pulse + tick * 0.8; R += pulse + tick

# ---- swells into each section ----
for (a, b, _, _) in SECTIONS[1:]:
    i1 = int(a * SR); i0 = max(0, i1 - int(1.4 * SR)); n = i1 - i0
    if n <= 0: continue
    noise = rng.standard_normal(n + int(0.6 * SR))
    env = np.concatenate([np.linspace(0, 1, n) ** 2.2, np.exp(-np.arange(int(0.6 * SR)) / SR / 0.15)])
    sw = lowpass(highpass(noise * env, 400), 3500) * 0.024
    m = min(len(sw), N - i0)
    L[i0:i0 + m] += sw[:m]; R[i0:i0 + m] += sw[:m] * 0.9

# ---- reverb ----
ir_n = int(3.2 * SR)
tau = np.arange(ir_n) / SR
irL = rng.standard_normal(ir_n) * np.exp(-tau / 0.9); irR = rng.standard_normal(ir_n) * np.exp(-tau / 0.9)
irL = lowpass(irL, 5000); irR = lowpass(irR, 5000)
irL /= np.sqrt(np.sum(irL ** 2)); irR /= np.sqrt(np.sum(irR ** 2))
wetL = fftconvolve(L, irL)[:N]; wetR = fftconvolve(R, irR)[:N]
L = 0.72 * L + 0.42 * wetL; R = 0.72 * R + 0.42 * wetR

# ---- master ----
L = highpass(L, 38); R = highpass(R, 38)
fade = np.clip(t / 2.0, 0, 1) * np.clip((DUR - t) / 4.0, 0, 1)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
L /= peak / 0.8; R /= peak / 0.8
wavfile.write("music.wav", SR, (np.stack([L, R], axis=1) * 32767).astype(np.int16))
print("ok", DUR)
