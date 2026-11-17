"""Original score for "SKABIES — dari tungau sampai terapi": clockwork minimalism at 92 BPM.
Marimba figure + pizzicato bass + vibraphone / glockenspiel colour, one section per board region, laid on the same
beat grid as the picture (every region and beat starts on a beat). D major (cause & mechanism) → F major (diagnosis)
→ D major with everything (therapy). Instruments are added one per stage of the life cycle; the music stops for the
two silences (crusted scabies, the day-7 repeat). Writes music/score.wav (stereo 48 kHz)."""
import sys, os, json, numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
M = next(e for e in E if e['type'] == 'meta'); B = M['beat']; REG = M['regions']; BEATS = M['beats']
S.seed(5)
N = []
def n(t, inst, p, d, v=.6, pan=0., g=1.):
    if 0 <= t < DUR - .05: N.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g))
def region_at(t):
    r = 0
    for i, x in enumerate(REG):
        if t >= x - 1e-3: r = i
    return r
silences = [(e['t'], e['t'] + e['dur']) for e in E if e['type'] == 'silence']
def silent(t): return any(a - .05 <= t < b for a, b in silences)
title_t = next(b[0] for b in BEATS if b[1] == 0 and b[2] == 2)          # "SKABIES" is written
end_t = next(b[0] for b in BEATS if b[1] == 15 and b[2] == 2)           # the pull-back to the whole board
cap_t = next(e['t'] for e in E if e['type'] == 'cap')
stages = sorted(e['t'] for e in E if e['type'] == 'stage')

CH = {'D': ['D', 'F#', 'A'], 'Bm': ['B', 'D', 'F#'], 'G': ['G', 'B', 'D'], 'A': ['A', 'C#', 'E'], 'Em': ['E', 'G', 'B'], 'F#m': ['F#', 'A', 'C#'],
      'F#': ['F#', 'A#', 'C#'], 'F': ['F', 'A', 'C'], 'Dm': ['D', 'F', 'A'], 'Bb': ['Bb', 'D', 'F'], 'C': ['C', 'E', 'G'], 'Gm': ['G', 'Bb', 'D'], 'Am': ['A', 'C', 'E']}
ROOT = {'D': 'D2', 'Bm': 'B1', 'G': 'G1', 'A': 'A1', 'Em': 'E2', 'F#m': 'F#1', 'F#': 'F#1', 'F': 'F1', 'Dm': 'D2', 'Bb': 'Bb1', 'C': 'C2', 'Gm': 'G1', 'Am': 'A1'}
# per region: progression (one chord per bar), density 0..3, figure variant
PLAN = {
    0: (['D', 'Bm', 'G', 'A'], 1, 0), 1: (['D', 'Bm', 'G', 'A'], 1, 0), 2: (['D', 'G', 'Bm', 'A'], 1, 1), 3: (['Bm', 'G', 'D', 'A'], 2, 1),
    4: (['D', 'A', 'Bm', 'G'], 1, 2), 5: (['G', 'D', 'A', 'D'], 2, 0), 6: (['Bm', 'G', 'Em', 'F#'], 2, 2), 7: (['Bm', 'Em', 'G', 'F#'], 2, 1),
    8: (['D', 'Bm', 'G', 'A'], 2, 0), 9: (['Bm', 'F#m', 'G', 'F#'], 2, 2), 10: (['F', 'Dm', 'Bb', 'C'], 2, 0), 11: (['F', 'Am', 'Bb', 'C'], 2, 1),
    12: (['D', 'A', 'Bm', 'G'], 3, 0), 13: (['G', 'D', 'A', 'D'], 3, 1), 14: (['D', 'Bm', 'G', 'A'], 3, 2), 15: (['D', 'G', 'A', 'D'], 2, 0)}
def up(p, k): return S.name(S.midi(p) + k)
def tones(ch, oct=4):
    r = S.midi(CH[ch][0] + str(oct)); t3 = S.midi(CH[ch][1] + str(oct)); f5 = S.midi(CH[ch][2] + str(oct))
    if t3 < r: t3 += 12
    if f5 < r: f5 += 12
    return r, t3, f5
FIG = [lambda r, t3, f5: [r, f5, r + 12, f5, t3 + 12, f5, r + 12, f5],
       lambda r, t3, f5: [r, t3, f5, r + 12, f5, t3, f5, t3 + 12],
       lambda r, t3, f5: [r + 12, f5, t3, f5, r + 12, t3 + 12, f5, t3]]

nb = int(DUR / B) + 2
start_b = int(np.ceil(title_t / B - 1e-6))
for b in range(nb):
    t = b * B
    if t >= end_t + 4 * B or silent(t): continue
    ri = region_at(t); prog, dens, fv = PLAN[ri]
    bar = b // 4; ch = prog[bar % 4]; r, t3, f5 = tones(ch); beat_in_bar = b % 4
    if t < title_t:                                                   # hook: only a vibraphone note per bar, no pulse
        if beat_in_bar == 0 and t > 1.0: n(t, 'vibraphone', S.name(r + 12), 3 * B, .32, .2, .8)
        continue
    fade = 1.0 if t < end_t else max(0., 1 - (t - end_t) / (4 * B))
    # marimba figure (eighths), lighter where the board is dense with reading
    fig = FIG[fv](r, t3, f5)
    for h in (0, 1):
        i = beat_in_bar * 2 + h
        if dens == 1 and h == 1 and i % 4 == 3: continue
        if not silent(t + h * B / 2): n(t + h * B / 2, 'marimba', fig[i], .3, (.5 if h == 0 else .4) * fade, -.2, .85)
    # pizzicato bass
    if beat_in_bar == 0: n(t, 'contrabass_pizz', ROOT[ch], .6, .62 * fade, 0, 1.0); n(t, 'cellos_pizz', up(ROOT[ch], 12), .5, .5 * fade, .08, .9)
    if beat_in_bar == 2 and dens >= 2: n(t, 'cellos_pizz', up(ROOT[ch], 19), .35, .42 * fade, .1, .85)
    # colour: violins pizz off-beats from density 2, vibraphone chord pads in diagnosis, glock theme in therapy
    if dens >= 2 and beat_in_bar in (1, 3): n(t + B / 2, 'violins_pizz', S.name(f5 + 12), .25, .33 * fade, .3, .7)
    if ri in (10, 11) and beat_in_bar == 0:
        for k, p in enumerate((r + 12, t3 + 12, f5 + 12)): n(t + k * .03, 'vibraphone', S.name(p), 3.5 * B, .3, -.1 + .1 * k, .7)
    if dens >= 3 and beat_in_bar == 0 and bar % 2 == 0:
        for k, p in enumerate([f5 + 24, t3 + 24, r + 24]): n(t + k * B, 'glockenspiel', S.name(p), .5, .3 * fade, .25, .6)
    if dens >= 2 and beat_in_bar in (0, 2): n(t, 'woodblock', 'a' if beat_in_bar == 0 else 'b', None, .22 * fade, .35, .45)

# the life cycle: one instrument enters per stage (glock ping, vibraphone, harp run)
for k, ts in enumerate(stages):
    ri = region_at(ts); r, t3, f5 = tones(PLAN[ri][0][int(ts / B) // 4 % 4], 5)
    if k == 0: n(ts, 'glockenspiel', S.name(f5 + 12), 1.0, .5, .3, .8)
    if k == 1: n(ts, 'vibraphone', S.name(t3), 2.0, .45, -.2, .8)
    if k == 2:
        for i, p in enumerate([r, t3, f5, r + 12]): n(ts + i * .08, 'harp', S.name(p), 1.2, .5, .1, .8)
# every region change: a rising marimba pickup one beat before the camera lands (J-cut into the next section)
for i, rt in enumerate(REG[1:], 1):
    if silent(rt): continue
    ch = PLAN[i][0][int(rt / B) // 4 % 4]; r, t3, f5 = tones(ch, 5)
    for k, p in enumerate([r - 12, t3 - 12, f5 - 12, r]): n(rt - B + k * B / 4, 'marimba', S.name(p), .2, .38 + .05 * k, .15, .8)
# title hit and ending: D chord on vibraphone + glock, one bell as the pen is capped
for k, p in enumerate(['D4', 'F#4', 'A4', 'D5']): n(title_t + k * .04, 'vibraphone', p, 4 * B, .5, -.2 + .13 * k, .9)
n(title_t, 'glockenspiel', 'A6', 1.5, .45, .3, .7)
for k, p in enumerate(['D3', 'A3', 'D4', 'F#4', 'A4']): n(end_t + 4 * B + k * .06, 'vibraphone', p, 8.0, .42, -.2 + .1 * k, .85)
n(end_t + 4 * B, 'contrabass_pizz', 'D2', 1.0, .55, 0, 1.0)
n(cap_t + .05, 'glockenspiel', 'D7', 3.0, .5, .2, .7)

mix = S.render([(e['t'], e['inst'], e['pitch'], e['dur'], e['vel'], e['pan'], e['gain']) for e in N], dur=DUR + 1)
mix = S.room(mix, size=.42, mix=.2)
for a, b in silences:                                                 # hard stop into silence (short fade), clean restart
    i0, i1 = int((a - .05) * SR), int(b * SR); f = int(.12 * SR)
    mix[max(0, i0 - f):i0] *= np.linspace(1, 0, min(f, i0))[:, None]; mix[i0:i1] = 0
os.makedirs(os.path.join(HERE, 'music'), exist_ok=True)
sf.write(os.path.join(HERE, 'music', 'score.wav'), mix.astype(np.float32), SR)
print('score', len(N), 'notes', round(len(mix) / SR, 1), 's; instruments:', sorted({e['inst'] for e in N}))
