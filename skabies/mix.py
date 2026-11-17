"""Foley + room + score → out/mix.wav. No narrator: the score carries the film, the marker strokes sit just under it.
Every stroke makes its own felt-on-gloss sound shaped by the engine's hand-speed curve, panned to its screen position."""
import sys, os, json, numpy as np, soundfile as sf
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, lp, add, limit
from core.audio import sampler as S
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
rng = np.random.default_rng(23)
NS = int((DUR + 1) * SR)
fol, room = np.zeros((NS, 2), np.float32), np.zeros((NS, 2), np.float32)
tt = lambda d: np.arange(int(d * SR)) / SR
db = lambda x: 10 ** (x / 20)
dec = lambda d, tau: np.exp(-tt(d) / tau)
silences = [(e['t'], e['t'] + e['dur']) for e in E if e['type'] == 'silence']

_band = {}
def band(n, lo, hi):
    k = (lo, hi)
    if k not in _band: _band[k] = bp(rng.standard_normal(SR * 8), lo, hi, 2).astype(np.float32)
    b = _band[k]; i = int(rng.integers(0, len(b) - n - 1)); return b[i:i + n]
def marker(dur, length, kind, pen, z=1.):
    d = max(.03, dur); n = int(d * SR); u = np.linspace(0, 1, n)
    v = 1 - .8 * np.cos(2 * np.pi * u)
    if kind == 'dash': v = np.ones(n) * 1.2
    a = (v / 1.8) ** .8 * np.minimum(1, u * d / .006) * np.minimum(1, (1 - u) * d / .012)
    br = {'black': 1.0, 'red': 1.1, 'blue': .92}.get(pen, 1.)
    hiss = band(n, 2200 * br, 7500 * br) * (.55 + .45 * v / 1.8)
    body = band(n, 500 * br, 1500 * br) * .45
    grain = (rng.random(n) < .004 * (1 + v)) * rng.standard_normal(n) * .8
    x = (hiss + body + bp(grain, 1500, 6000)) * a
    if kind != 'dash' and length > 160 and rng.random() < .18:          # the dry-erase squeak
        s0 = rng.uniform(.15, .55) * d; sd = min(d - s0, rng.uniform(.06, .14))
        if sd > .03:
            m = int(sd * SR); ts = np.arange(m) / SR; f0 = rng.uniform(1500, 2600) * br
            f = f0 * (1 + .03 * np.sin(2 * np.pi * rng.uniform(7, 13) * ts))
            sq = (np.sin(2 * np.pi * np.cumsum(f) / SR) + .3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * ts / sd) ** 1.5 * .25
            i0 = int(s0 * SR); x[i0:i0 + m] += sq[:len(x) - i0]
    k = int(.004 * SR); x[:k] += bp(rng.standard_normal(k), 2500, 6500) * np.linspace(1, 0, k) * 1.4
    return x * .32 * min(1.3, z ** .5)
def tap(z=1.):
    n = int(.03 * SR); return bp(rng.standard_normal(n), 1800, 6000) * dec(.03, .004) * .36 * min(1.3, z ** .5)
def ring(fs, taus, amps, d):
    x = np.zeros(int(d * SR)); t = tt(d)
    for f, ta, am in zip(fs, taus, amps): x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t / ta) * am
    return x
def magnet(v=1.):
    d = .5; x = np.zeros(int(d * SR)); k = int(.005 * SR)
    x[:k] += bp(rng.standard_normal(k), 2000, 9000) * np.linspace(1, 0, k) * 1.5
    x += ring([830, 1370, 2210, 3120], [.07, .05, .035, .02], [.35, .25, .15, .08], d) + ring([150], [.1], [.9], d) * .9
    return x * .6 * v
def slide(d):
    n = int(d * SR); t = tt(d)
    return (bp(rng.standard_normal(n), 300, 2200) * .5 + bp(rng.standard_normal(n), 2000, 5000) * .12) * np.minimum(1, t / .08) * np.minimum(1, (d - t) / .1) * .22
def magnet_off():
    d = .35; x = lp(rng.standard_normal(int(d * SR)), 1800) * np.minimum(1, tt(d) / .15) * dec(d, .1) * .25
    k = int(.004 * SR); x[:k] += bp(rng.standard_normal(k), 2500, 8000) * .8; return x
def cap_on():
    d = .2; x = np.zeros(int(d * SR))
    for j, o in enumerate([0, .045]):
        i = int(o * SR); k = int(.006 * SR); x[i:i + k] += bp(rng.standard_normal(k), 2500, 9000) * np.linspace(1, 0, k) * (1 - .4 * j)
        r = ring([2600], [.015], [.4], .06); x[i:i + len(r)] += r
    return x * .8
def whoosh(d, v=1.):
    n = int(d * SR); t = tt(d); return bp(rng.standard_normal(n), 300, 2400) * np.sin(np.pi * t / d) ** 2 * .35 * v
def put(buf, x, t, g=1., pan=0.):
    if 0 <= t < DUR: add(buf, np.asarray(x, np.float32), t, g, pan)

for e in E:
    ty, t = e['type'], e['t']; pan = e.get('pan', 0); z = e.get('z', 1); off = db(-9) if e.get('on', 1) == 0 else 1
    if ty in ('stroke', 'write', 'dash'): put(fol, marker(e['dur'], e['len'], ty, e.get('pen'), z), t, off * (.75 if ty == 'write' else 1.), pan)
    elif ty == 'tap': put(fol, tap(z), t, off, pan)
    elif ty == 'magnet': put(fol, magnet(), t, 1.0, pan)
    elif ty == 'magnetSoft': put(fol, magnet(.45), t, 1.0, pan)
    elif ty == 'slide': put(fol, slide(e['dur']), t, 1.0, pan)
    elif ty == 'magnetOff': put(fol, magnet_off(), t, 1.0, 0)
    elif ty == 'ride': put(fol, whoosh(e['dur'] * .9, .45), t + .05, 1, 0)
    elif ty == 'whip': put(fol, whoosh(e['dur'] * .7, .9), t + .1, 1, -.2)
    elif ty == 'cap': put(fol, cap_on(), t, 1.0, .35)
# pens flying in after a long pause: a soft air pass
by_pen = {}
for e in E:
    if e['type'] in ('stroke', 'write', 'dash', 'tap'): by_pen.setdefault(e['pen'], []).append(e)
for L in by_pen.values():
    L.sort(key=lambda e: e['t'])
    for a, b in zip(L, L[1:]):
        if b['t'] - (a['t'] + a['dur']) > 1.2: put(fol, whoosh(.4, .3), b['t'] - .42, 1, .4)

# room: low tone + a projector fan that owns the silences
tone = lp(rng.standard_normal(NS), 900) * .010 + lp(rng.standard_normal(NS), 180) * .006
fan = bp(rng.standard_normal(NS), 90, 420) * .006 * (1 + .15 * np.sin(2 * np.pi * 29 * np.arange(NS) / SR))
room[:, 0] += tone + fan; room[:, 1] += np.roll(tone, 311) + np.roll(fan, 97)
for a, b in silences:                                    # the fan comes forward in the silence
    i0, i1 = int(a * SR), int(b * SR); room[i0:i1] *= 2.2
room = S.room(room, size=.35, mix=.25)

mus, _ = sf.read(os.path.join(HERE, 'music', 'score.wav')); mus = mus[:NS].astype(np.float32)
if len(mus) < NS: mus = np.pad(mus, ((0, NS - len(mus)), (0, 0)))
mus = mus - .7 * np.stack([lp(mus[:, c], 120, 2) for c in range(2)], 1).astype(np.float32)   # tame the low end (pizz bass + room)
def rms(x): m = np.abs(x).max(1) > 1e-4; return float(np.sqrt(np.mean(x[m] ** 2))) if m.any() else 1.
mu_r, fo_r = rms(mus), rms(fol)
mix = mus + fol * (mu_r / fo_r) * db(-7) + room * 1.0
mix = np.stack([limit(mix[:, c], .95) for c in range(2)], 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
print('rms music/foley dB', round(20 * np.log10(mu_r), 1), round(20 * np.log10(fo_r), 1), 'peak', round(float(np.abs(mix).max()), 3))
