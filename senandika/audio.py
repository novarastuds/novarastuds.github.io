"""Music + sfx → out/mix.wav, exactly 60 s and seamless when looped.
120 BPM = 30 bars of 2 s. The score and the sfx are rendered over two cycles and the second cycle is kept,
so reverb and decays from the end wrap into the start."""
import sys, os, json, numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, bp, lp, hp, limit
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); DUR = ev['dur']; EV = [e for e in ev['ev']]
B = .5; BAR = 2.0; S.seed(3)
CH = {'D': ('D', 'F#', 'A'), 'Bm': ('B', 'D', 'F#'), 'G': ('G', 'B', 'D'), 'A': ('A', 'C#', 'E'), 'Em': ('E', 'G', 'B')}
BASS = {'D': 'D2', 'Bm': 'B1', 'G': 'G1', 'A': 'A1', 'Em': 'E2'}
PROG = ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'Em', 'A']
HOOK = [(0, 'F#5', .5), (.5, 'A5', .5), (1, 'B5', .5), (1.5, 'A5', .5), (2, 'D6', 1), (3, 'A5', .5), (3.5, 'B5', .5),
        (4, 'A5', .5), (4.5, 'F#5', .5), (5, 'E5', 1), (6, 'F#5', .5), (6.5, 'E5', .5), (7, 'D5', 1)]
def m(p): return S.midi(p)
N = []
def n(t, inst, p, d, v, pan=0., g=1.): N.append((t, inst, p, d, v, pan, g))
def section(bar):                       # 0..29 → intensity by scene
    t = bar * BAR
    if t < 6: return 1
    if t < 42: return 3
    if t < 48: return 4
    return 2
for cyc in range(2):
    T0 = cyc * DUR
    for bar in range(30):
        t0 = T0 + bar * BAR; ch = PROG[bar % 8]; r, t3, f5 = (m(x + '4') for x in CH[ch])
        if t3 < r: t3 += 12
        if f5 < r: f5 += 12
        lv = section(bar)
        fig = [r, f5, r + 12, f5, t3 + 12, f5, r + 12, f5]
        for i, p in enumerate(fig):
            if lv == 1 and i % 2: continue
            n(t0 + i * B / 2 * 1, 'marimba', p, .25, .55 if i % 2 == 0 else .42, -.25, .8)
        n(t0, 'contrabass_pizz', BASS[ch], .5, .7, 0, 1.0); n(t0 + 1.0, 'cellos_pizz', S.name(m(BASS[ch]) + 12), .4, .55, .1, .9)
        if lv >= 2:
            for k in range(4): n(t0 + k * B, 'shaker', 'down' if k % 2 == 0 else 'up', None, .3, .3, .45)
            n(t0 + B, 'woodblock', 'a', None, .3, .35, .5); n(t0 + 3 * B, 'woodblock', 'b', None, .3, .35, .5)
        if lv >= 3:
            for k in (1, 3): n(t0 + k * B + B / 2, 'violins_pizz', S.name(f5 + 12), .2, .38, .35, .7)
            if bar % 4 in (0, 2):
                for (o, p, d) in HOOK:
                    if o < 4: n(t0 + o * B * 1, 'glockenspiel', p, d * B, .42, .2, .65)
            else:
                for (o, p, d) in HOOK:
                    if o >= 4: n(t0 + (o - 4) * B, 'glockenspiel', p, d * B, .42, .2, .65)
        if lv == 4 and bar % 2 == 0:
            for k, p in enumerate([r + 12, t3 + 12, f5 + 12, r + 24]): n(t0 + k * .12, 'harp', S.name(p), .8, .45, -.1, .7)
mus = S.render(N, dur=2 * DUR + 2)
# soft synth kick on 1 and 3 from the first menu scene to the recap (gives the loop a pulse)
tt = lambda d: np.arange(int(d * SR)) / SR
def kick():
    t = tt(.35); f = 55 + 70 * np.exp(-t / .04); x = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / .12); return x * .5
TAU = 2 * np.pi
for cyc in range(2):
    for bar in range(30):
        if 3 <= section(bar) <= 4:
            for k in (0, 2): add(mus, kick().astype(np.float32), cyc * DUR + bar * BAR + k * B, .9, 0)
mus = S.room(mus, size=.35, mix=.16)
mus = mus - .55 * np.stack([lp(mus[:, c], 110) for c in range(2)], 1)

# sfx from the picture's cues
rng = np.random.default_rng(5)
fx = np.zeros_like(mus)
def pop(v):
    t = tt(.12); f = 380 + 900 * np.exp(-t / .02); return np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / .03) * .6 * v
def tick(v):
    t = tt(.06); return np.sin(TAU * 2400 * t) * np.exp(-t / .012) * .35 * v
def swish(v):
    d = .35; t = tt(d); return bp(rng.standard_normal(len(t)), 1500, 7000) * np.sin(np.pi * t / d) ** 2 * .25 * v
def whoosh(v):
    d = .6; t = tt(d); x = bp(rng.standard_normal(len(t)), 250, 2600) * np.sin(np.pi * t / d) ** 2; return x * .45 * v
def stamp(v):
    t = tt(.4); x = np.sin(TAU * np.cumsum(70 + 90 * np.exp(-t / .03)) / SR) * np.exp(-t / .09)
    k = int(.01 * SR); x[:k] += bp(rng.standard_normal(k), 800, 5000) * np.linspace(1, 0, k) * .8; return x * .7 * v
def ding(v=1):
    t = tt(1.2); return (np.sin(TAU * 1760 * t) * np.exp(-t / .35) + .5 * np.sin(TAU * 2637 * t) * np.exp(-t / .25)) * .22 * v
def unroll(v=1):
    d = .8; t = tt(d); x = bp(rng.standard_normal(len(t)), 600, 4500) * (.5 + .5 * np.sin(TAU * 18 * t)) * np.sin(np.pi * t / d) * .3; return x * v
G = {'pop': pop, 'tick': tick, 'swish': swish, 'whoosh': whoosh, 'stamp': stamp, 'ding': ding, 'unroll': unroll}
for cyc in range(2):
    for e in EV:
        f = G.get(e['type'])
        if f: add(fx, f(e.get('v', 1)).astype(np.float32), cyc * DUR + e['t'], 1, 0)
def rms(x): q = x[np.abs(x).max(1) > 1e-4]; return float(np.sqrt(np.mean(q ** 2)))
mix = mus + fx * (rms(mus) / rms(fx)) * 10 ** (-4 / 20)
a, b = int(DUR * SR), int(2 * DUR * SR)
out = mix[a:b]
out = np.stack([limit(out[:, c], .95) for c in range(2)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), out.astype(np.float32), SR)
print('mix', round(len(out) / SR, 3), 's  peak', round(float(np.abs(out).max()), 3), ' seam jump', round(float(np.abs(out[0] - out[-1]).max()), 4))
