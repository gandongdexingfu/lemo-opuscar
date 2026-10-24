"""Score for 風與光 (original; minimalist additive writing, no existing melody): VSCO 2 CE / VCSL real samples (CC0).
Arc: dawn, harp eighths over a soft organ → wind, string triplets against the eighths → light river, full-organ hit and sixteenths
→ brake, every arpeggio stops on one held Gmaj9 under the slowed geese → second hit → night, sixteenths, triplets and horns
→ hard stop (dry signal cut in 15 ms, the reverb left ringing) → coda, one unresolved chord and the opening figure in quarter notes.
Every cut lands on a beat from here (timeline.py is the single source of timing). Usage: python tools/music.py audio/music.wav"""
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))   # <repo>/mine/films/wind-and-light/tools
sys.path.insert(0, LIB); sys.path.insert(0, HERE)
import numpy as np, soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR
from timeline import bar, beat, BEAT, DUR, RIVER, BRAKE, RETURN, STOP, CODA, QUOTE, SLATE

S.seed(1854)
CH = {   # three arpeggio notes (low → high) + bass
    'Dmaj7': (['F#4', 'A4', 'C#5'], 'D2'), 'Bm7': (['D4', 'F#4', 'A4'], 'B1'), 'Gmaj7': (['D4', 'F#4', 'B4'], 'G1'),
    'Asus4': (['D4', 'E4', 'A4'], 'A1'), 'Bm': (['D4', 'F#4', 'B4'], 'B1'), 'D': (['D4', 'F#4', 'A4'], 'D2'),
    'A': (['C#4', 'E4', 'A4'], 'A1'), 'Em9': (['E4', 'G4', 'B4'], 'E2'),
}
PLAN = {0: 'Dmaj7', 1: 'Bm7', 2: 'Gmaj7', 3: 'Asus4', 4: 'Dmaj7', 5: 'Bm7', 6: 'Gmaj7', 7: 'Asus4',
        8: 'Bm', 9: 'Gmaj7', 10: 'D', 11: 'A', 12: 'Bm', 13: 'Gmaj7', 14: 'D', 15: 'A',
        16: 'Gmaj7', 17: 'Em9',
        21: 'Dmaj7', 22: 'Bm', 23: 'Gmaj7', 24: 'D', 25: 'A', 26: 'Bm'}
EV = []


def ev(t, inst, pitch, dur, vel, pan=0, gain=1.0, **kw):
    EV.append(dict(t=t, inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan, gain=gain, **kw))


def arp(n, sub, pattern, vel, pan, gain, oct_=0, inst='harp', legato=1.0, b0=0, b1=4):
    tones = CH[PLAN[n]][0]; step = BEAT / sub; k = 0; t = bar(n, b0)
    while t < bar(n, b1) - 1e-6:
        p = pattern[k % len(pattern)]
        ev(t, inst, S.midi(tones[p % 3]) + 12 * (oct_ + p // 3), step * legato, vel, pan, gain)
        t += step; k += 1


def pad(n, gain=.3, inst='organ_soft'):
    tones = CH[PLAN[n]][0]
    for p in tones: ev(bar(n), inst, S.midi(p) - 12, BEAT * 4, .5, 0, gain, attack=.25, release=.4)


def slam(n, vel=.88, g=1.0):
    tones, ped = CH[PLAN[n]]
    ev(bar(n), 'organ', S.midi(tones[0]) - 12, 1.6, vel, -.1, .55 * g)
    for p in tones: ev(bar(n), 'organ', p, 1.6, vel, .1, .42 * g)
    ev(bar(n), 'gran_cassa', 'hit', None, .75 * g, 0, .9 * g)


def pulse(n, inst='cellos_spic', per_beat=1, vel=.66, gain=.8):
    ped = CH[PLAN[n]][1]
    for k in range(4 * per_beat):
        ev(bar(n, k / per_beat), inst, S.midi(ped) + 12, .2, vel, .22, gain)


# bass line under every bar that has a chord
for n, c in PLAN.items():
    end = min(bar(n + 1), BRAKE if n < 18 else STOP)
    ev(bar(n), 'contrabass', S.midi(CH[c][1]) + 12, end - bar(n), .55, .15, .55, attack=.15, release=.25)
    ev(bar(n), 'organ_pedal', CH[c][1], end - bar(n), .6, 0, .55, release=.25)

# ── A dawn (bars 0–7): harp eighths, soft organ; clarinet from bar 4, flute from bar 6 ──
for n in range(8):
    arp(n, 2, [0, 1, 2, 1], .62, -.25, .9)
    pad(n, .26)
    if n >= 4: arp(n, 2, [2, 1, 0, 1], .5, .35, .42, oct_=0, inst='clarinet_stac')
    if n >= 6: arp(n, 2, [0, 2, 1, 2], .42, .45, .3, oct_=1, inst='flute_stac')
ev(0.0, 'violins', 'A5', bar(4) - .3, .3, -.3, .22, attack=1.5, release=.8)          # a high line through the mist
ev(bar(4), 'violins', 'F#5', bar(4) - .3, .32, -.3, .24, attack=1.0, release=.8)
# ── B wind (bars 8–15): string triplets against the eighths, cello pulse; cymbal swell into the light river ──
slam(8, .7, .7)
for n in range(8, 16):
    arp(n, 2, [0, 1, 2, 1], .68, -.25, .9)
    arp(n, 3, [0, 1, 2], .62, .35, .55, oct_=1, inst='violins_spic')
    arp(n, 2, [2, 1, 0, 1], .55, .45, .45, inst='clarinet_stac')
    pulse(n, per_beat=1 if n < 12 else 2)
    pad(n, .22)
    if n >= 13: arp(n, 4, [0, 1, 2, 3], .5, -.45, .32, oct_=1, inst='flute_stac')
ev(bar(14, 2), 'sus_cymbal', 'cresc', None, .62, .1, .5)
# ── C light river (bars 16–17): full-organ hit, sixteenths; dry cut at the brake ──
slam(16)
for n in (16, 17):
    arp(n, 4, [0, 1, 2, 3, 2, 1], .82, -.25, .95, inst='organ_soft')
    arp(n, 3, [0, 1, 2], .66, .3, .6, oct_=1, inst='violins_spic')
    arp(n, 2, [2, 1, 0, 1], .62, .45, .5, inst='clarinet_stac')
    arp(n, 4, [3, 2, 1, 0], .55, -.45, .4, oct_=1, inst='flute_stac')
    pulse(n, per_beat=2, vel=.76, gain=.9)
ev(bar(17), 'gran_cassa', 'hit', None, .55, 0, .6)
# ── D brake (bars 18–20): all arpeggios stop, one held Gmaj9 under the slowed geese ──
t = BRAKE; L = RETURN - BRAKE
for p, g in [('G2', .5), ('D3', .42), ('F#3', .38), ('A3', .36), ('B3', .32)]:
    ev(t, 'organ_soft', p, L - .3, .55, 0, g, attack=.1, release=.6)
ev(t, 'organ_pedal', 'G1', L - .3, .55, 0, .7, release=.5)
ev(t, 'cellos', 'G2', L - .3, .5, .25, .5, attack=.3, release=.6)
ev(t + .3, 'violins', 'F#5', L - .8, .36, -.3, .34, attack=.9, release=.6)
ev(t + .1, 'vibraphone_bowed', 'A5', L - 1.0, .42, .35, .34)
for tt, p, d in [(t + 1.0, 'B5', 1.6), (t + 2.875, 'A5', 1.2), (t + 4.25, 'F#5', 2.6)]:     # three falling flute notes as the birds cross the sun
    ev(tt, 'flute', p, d, .42, -.2, .42, attack=.1, release=.4)
ev(RETURN - BEAT * 4, 'sus_cymbal', 'cresc', None, .6, -.1, .48)
# ── E return and night (bars 21–26): hit; eighths → triplets → sixteenths; horns in the last two bars ──
slam(21)
arp(21, 2, [0, 1, 2, 1], .78, -.25, .95); pulse(21, vel=.72)
arp(21, 3, [0, 1, 2], .55, .35, .5, oct_=1, inst='violins_spic')
arp(22, 3, [0, 1, 2], .8, -.25, .95); pulse(22, vel=.74)
arp(22, 2, [2, 1, 0, 1], .6, .35, .55, inst='clarinet_stac')
arp(22, 3, [0, 2, 1], .62, .45, .5, oct_=1, inst='violins_spic')
for n in (23, 24, 25, 26):
    arp(n, 4, [0, 1, 2, 3, 2, 1], .84, -.25, 1.0, inst='organ_soft')
    arp(n, 3, [0, 1, 2], .7, .3, .6, inst='clarinet_stac')
    arp(n, 4 if n >= 25 else 3, [3, 2, 1, 0], .7, .45, .6, oct_=1, inst='violins_spic')
    arp(n, 2, [0, 1, 2, 1], .7, -.4, .7)
    pulse(n, per_beat=2, vel=.8, gain=.95)
    if n >= 25: arp(n, 4, [0, 1, 2, 3], .6, -.45, .45, oct_=1, inst='flute_stac')
    ev(bar(n), 'gran_cassa', 'hit', None, .58, 0, .65)
for n, (p, q) in ((25, ('E3', 'A3')), (26, ('F#3', 'B3'))):
    ev(bar(n), 'horn', p, BEAT * 4, .64, -.2, .44, attack=.2, release=.15)
    ev(bar(n), 'horn', q, BEAT * 4, .62, .2, .38, attack=.2, release=.15)
ev(bar(26), 'organ', 'B2', BEAT * 4, .88, 0, .45)
for p in ['F#3', 'B3', 'D4', 'F#4']: ev(bar(26), 'organ', p, BEAT * 4, .88, 0, .32)
ev(bar(26), 'gran_cassa', 'roll', None, .62, 0, .55)
ev(bar(25, 2), 'sus_cymbal', 'cresc', None, .72, .1, .58)
# ── F coda: one soft chord that does not resolve (Em9 over G), the opening figure in quarter notes under the end card ──
CL = DUR - CODA
for p, g in [('G2', .4), ('E3', .38), ('B3', .34), ('D4', .3), ('F#4', .26)]:
    ev(CODA, 'organ_soft', p, CL - 1.2, .5, 0, g, attack=.8, release=1.2)
ev(CODA, 'organ_pedal', 'G1', CL - 1.2, .45, 0, .5, attack=.8, release=1.2)
ev(CODA + .6, 'violins', 'B5', CL - 2.4, .3, -.3, .28, attack=1.4, release=1.0)
ev(QUOTE, 'vibraphone_bowed', 'F#5', 5.0, .36, .35, .28)
fig = ['F#4', 'A4', 'C#5', 'A4']
for k in range(int((DUR - SLATE - 1.0) / BEAT)):
    ev(SLATE + k * BEAT, 'harp', fig[k % 4], BEAT, .5, -.25, .55 * (1 - k / 18))

# dynamic arc: headroom at dawn, the brake sinks, night is loudest
for e in EV:
    if e['t'] < bar(8) and e['inst'] not in ('organ', 'gran_cassa'): e['gain'] *= .8
    elif BRAKE - .01 <= e['t'] < RETURN - .01 and e['inst'] != 'sus_cymbal': e['gain'] *= .7
    elif bar(23) <= e['t'] < STOP: e['gain'] *= 1.1
N = int(DUR * SR)


def cut_at(x, t):
    c = int(t * SR); f = int(.015 * SR); y = x.copy()
    y[c:c + f] *= np.linspace(1, 0, f)[:, None]; y[c + f:] = 0
    return y


# two dry cuts: light river → brake, night → black. The dry signal is cut, the reverb tail stays
A = S.render([e for e in EV if e['t'] < BRAKE - .01], dur=DUR + 1.5, master=False)
B = S.render([e for e in EV if BRAKE - .01 <= e['t'] < STOP - .01], dur=DUR + 1.5, master=False)
C = S.render([e for e in EV if e['t'] >= STOP - .01], dur=DUR + 1.5, master=False)
A = cut_at(A, BRAKE); B = cut_at(B, STOP)
wet = S.room(A + B, size=.7, mix=.28) + S.room(C, size=.78, mix=.36)
mix = wet[:N]
fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
mix /= max(1e-6, np.abs(mix).max()) / .89
out = sys.argv[1] if len(sys.argv) > 1 else 'audio/music.wav'
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
sf.write(out, mix.astype(np.float32), SR)
print(out, len(EV), 'events', f'{len(mix) / SR:.2f}s')
open(os.path.join(HERE, '..', 'work', 'instruments.txt'), 'w').write('\n'.join(S.credits(sorted({e['inst'] for e in EV}))) + '\n')
