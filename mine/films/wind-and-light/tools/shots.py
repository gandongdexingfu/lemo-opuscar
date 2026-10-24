"""Shot list (all timings come from timeline.beat).

CLIPS: the clips prep.py cuts → work/clips/<id>.mp4 (frame-accurate, 24 fps)
  id: dict(src, s0=source in-point s, n=frame count, speed=constant or [(seconds into clip, speed), …] keyframes (smoothstep between them),
           blend=max frames blended (360° shutter), interp=motion-compensated interpolation factor for slow motion, mix=crossfade slow motion, size)
SHOTS: shots on the timeline (render.py composites them frame by frame)
  kind: clip / grid / flash / black
"""
import os
from timeline import beat, FPS, GRID, RIVER, BIRDS, RETURN, FLASH, STOP, CODA, DUR

FOOT = os.environ.get('FOOTAGE') or os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'footage')   # the 11 source clips (not in git)
V = dict(lake='1f0c5c412abda99a4d399eb82990f3cbd1ecdbed.MP4', sky='44e8f5a313311cfb97a397de9f464ef02af285b4.MP4',
         beach='503f005312c4a46f9a2c62466f22ce7d53e2556e.MP4', rain='66f701806281c82358f50c4241ccb67c2c943d09.MP4',
         pink='760869e71a68532b7675ef4d4c4b4472493c08f8.MP4', cliff='8d7b00708696b183a9fbeb9214ffefb40fd1a260.MP4',
         road='8f0e40ddf577e7f382acaf0792dc0c8b8828cf92.MP4', stars='95f7149206f3b7c200918da93e7c104a7600cd24.MP4',
         geese='c30fe508b2491ef30728755175cd74c12bdf4da6.MP4', reeds='da88742409f91cc81bcf5962fe031f45664394ef.MP4',
         bloom='e3413ddded8216ac4f4031ba4ab98cc912108cff.MP4')
V = {k: os.path.normpath(os.path.join(FOOT, v)) for k, v in V.items()}
NIGHT_SRC = ('rain', 'beach', 'stars', 'pink')        # night: no grey-world balance, stronger bloom
SIZE = (1920, 1038)                                   # 1.85:1 picture inside the 1920×1080 frame


def nf(a, b):
    return round(b * FPS) - round(a * FPS)


CLIPS = {}
SHOTS = []


def clip(cid, b0, b1, src, s0, speed, blend=1, interp=1, mix=False, motion=(1, 1, 0, 0), wb=.3, push=None):
    t0, t1 = beat(b0), beat(b1)
    CLIPS[cid] = dict(src=src, s0=s0, n=nf(t0, t1), speed=speed, blend=blend, interp=interp, mix=mix, size=SIZE)
    SHOTS.append(dict(id=cid, kind='clip', t0=t0, t1=t1, motion=motion, wb=wb, src=src, push=push))


# ───────── dawn (bars 0–7) ─────────
clip('s01_lake', 0, 12, 'lake', .1, .95, motion=(1.0, 1.08, 0, 0), wb=.15)               # mist; title
clip('s02_bloom', 12, 20, 'bloom', .3, 1.0, motion=(1.0, 1.06, -10, 6), wb=.2)           # first direct light
clip('s03_sky', 20, 32, 'sky', 0.0, 1.66, blend=3, wb=.1)                                 # tilt down the vertical frame (in prep)
# ───────── wind (bars 8–15) ─────────
clip('s04_reeds', 32, 40, 'reeds', .2, 1.0, wb=0)
clip('s05_cliff', 40, 46, 'cliff', .2, 1.0, motion=(1.0, 1.05, 0, 0), wb=.15)
clip('s06_reeds', 46, 50, 'reeds', 5.2, 1.0, motion=(1.04, 1.04, 0, 0), wb=0)
clip('s07_cliff', 50, 54, 'cliff', 4.0, 1.2, blend=2, motion=(1.06, 1.06, 0, 0), wb=.15)
SHOTS.append(dict(id='s08_grid', kind='grid', t0=GRID, t1=RIVER))
# grid pool: each clip covers its stage until the end of the grid (cells keep running)
POOL = [('g_lake', 'lake', .6, 1.0), ('g_bloom', 'bloom', .4, 1.0), ('g_sky', 'sky', 2.5, 1.4), ('g_reeds', 'reeds', 1.0, 1.0),
        ('g_cliff', 'cliff', .6, 1.0), ('g_road', 'road', .3, 1.0), ('g_geese', 'geese', .3, 1.0), ('g_pink', 'pink', .5, 1.0),
        ('g_rain', 'rain', 1.0, 1.0), ('g_beach', 'beach', .5, 1.0), ('g_stars', 'stars', .5, 1.0)]
for cid, src, s0, sp in POOL:
    CLIPS[cid] = dict(src=src, s0=s0, n=nf(GRID, RIVER), speed=sp, blend=2 if sp > 1.1 else 1, interp=1, mix=False, size=(960, 518))
GRID_STAGES = [   # (start, columns, rows, pool ids)
    (GRID, 2, 1, ['g_lake', 'g_bloom']),
    (beat(56), 2, 2, ['g_sky', 'g_reeds', 'g_cliff', 'g_road']),
    (beat(58), 3, 3, ['g_lake', 'g_geese', 'g_bloom', 'g_rain', 'g_sky', 'g_pink', 'g_reeds', 'g_beach', 'g_cliff']),
]
GRID_LAST = ['g_lake', 'g_bloom', 'g_sky', 'g_reeds', 'g_cliff', 'g_road', 'g_geese', 'g_pink', 'g_rain', 'g_beach', 'g_stars']
# ───────── dusk ─────────
clip('s09_road', 64, 70, 'road', .2, 1.8, blend=3, wb=0, motion=(1.0, 1.05, 0, 0))       # tail lights → river of light
clip('s10_geese', 70, 84, 'geese', .4, [(0, 1.3), (beat(72) - beat(70), 1.3), (beat(72) - beat(70) + .55, .4), (9.0, .4)],
     interp=3, wb=0, motion=(1.0, 1.07, 0, 0))                                            # brake into slow motion
clip('s11_pink', 84, 88, 'pink', 1.0, 1.0, wb=0, push='fall')                             # second hit: falling push
# ───────── night ─────────
clip('s12_rain', 88, 94, 'rain', .3, 1.0, wb=0, motion=(1.0, 1.05, 0, 0))
clip('s13_beach', 94, 100, 'beach', .2, 1.6, blend=2, wb=0, motion=(1.0, 1.04, 0, 0))
clip('s14_rain', 100, 102, 'rain', 4.4, 1.2, blend=2, wb=0, motion=(1.12, 1.15, 0, 0))
clip('s15_beach', 102, 104, 'beach', 6.0, .8, mix=True, wb=0, motion=(1.1, 1.12, 0, 0))
# ───────── the day in reverse (60 frames), hard stop ─────────
SHOTS.append(dict(id='s16_flash', kind='flash', t0=FLASH, t1=STOP))
FLASH_SRC = ['s15_beach', 's14_rain', 's13_beach', 's12_rain', 's11_pink', 's10_geese',
             's09_road', 's07_cliff', 's06_reeds', 's05_cliff', 's04_reeds', 's03_sky', 's02_bloom', 's01_lake',
             's09_road', 's10_geese', 's05_cliff', 's03_sky', 's02_bloom', 's01_lake']
FLASH_SRC += ['s01_lake', 's01_lake']                     # lands on the opening mist, then black
FLASH_LEN = [4] * 6 + [2] * 14 + [4, 4]
assert len(FLASH_SRC) == len(FLASH_LEN) and sum(FLASH_LEN) == nf(FLASH, STOP)
SHOTS.append(dict(id='black', kind='black', t0=STOP, t1=CODA))
# ───────── coda ─────────
clip('s17_stars', 110, 136, 'stars', .2, .42, mix=True, wb=0, motion=(1.0, 1.06, 0, -6))
