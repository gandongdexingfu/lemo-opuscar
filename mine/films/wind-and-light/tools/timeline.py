"""Beat map: the single source of timing for music and picture. 96 BPM, 24 fps: 1 beat = 0.625 s = 15 frames, 1 bar = 4 beats = 2.5 s = 60 frames.
All cut points come from beat(n); shot lengths are never typed in seconds."""
BPM = 96
BEAT = 60 / BPM          # 0.625 s
BAR = 4 * BEAT           # 2.5 s
FPS = 24


def beat(n):
    """Time (seconds) of beat n, counting from 0"""
    return n * BEAT


def bar(n, b=0.0):
    return beat(4 * n + b)


# sections (in beats)
DAWN = beat(0)       # bars 0–7   dawn: eighth-note arpeggios, cuts 3 bars → 2 bars
WIND = beat(32)      # bars 8–15  wind: triplets against eighths, cuts 2 bars → half bar → the grid
GRID = beat(54)      # grid 1×2 → 2×2 → 3×3, last beat re-cut on sixteenths
RIVER = beat(64)     # bar 16     full-organ hit, highway light river
BIRDS = beat(70)     # bar 17.2   geese over the sun (1.3×)
BRAKE = beat(72)     # bar 18     arpeggios all stop, birds braked to 0.4×
RETURN = beat(84)    # bar 21     second hit, falling push on the twilight sky
NIGHT = beat(88)     # bars 22–26 night: sixteenths + triplets + horns
FLASH = beat(104)    # bar 26     the day in reverse, 4 frames → 2 frames
STOP = beat(108)     # bar 27     hard stop: dry cut, black
CODA = beat(110)     # stars over the daisies
QUOTE = beat(112)    # Thoreau
SLATE = beat(126)    # end card over the darkened stars
DUR = beat(136)      # 85.0 s
