// "SKABIES — dari tungau sampai terapi" · Whiteboard Explainer · no narrator: board + burned Indonesian subtitles + music.
// One board of 4×4 regions walked as a snake. Every time derives from the subtitle reading times, snapped to a 92 BPM grid.
import * as W from './engine/wb.js';
import { clamp, lerp, TAU, mulberry } from '/core/lib.js';

const INK = { black: '#23262c', blue: '#2a5cb3', red: '#c8363a' };
export const BPM = 92, BEAT = 60 / BPM;
const RW = 2400, RH = 1400, BW = RW * 4, BH = RH * 4;
const ORDER = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [2, 3], [1, 3], [0, 3]];
const SUB_CPS = 15.5, SUB_PAD = 1.0, SUB_MIN = 2.2;
const TEXT_SPEED = 7000, LINE_SPEED = 4000;

export async function build() {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const tl = new W.Timeline();
  const PEN = {
    k: new W.Pen('black', INK.black, { park: [2200, 1320] }),
    b: new W.Pen('blue', INK.blue, { park: [2100, 1420] }),
    r: new W.Pen('red', INK.red, { park: [2350, 1180] }),
  };
  const TEXTS = [];                 // {id, text, strokes, region, beat}
  let curRegion = 0, curBeat = 0, ox = 0, oy = 0;

  // ───────── local drawing helpers (region-local coords)
  const P = (x, y) => [ox + x, oy + y];
  const T = (str, x, y, o = {}) => {
    let h = o.h ?? 52, s = W.text(str, ox + x, oy + y, { ...o, h });
    if (o.maxW && s.width > o.maxW) { h *= o.maxW / s.width; s = W.text(str, ox + x, oy + y, { ...o, h }); }
    TEXTS.push({ id: `t${TEXTS.length}`, text: str, strokes: s, region: curRegion, beat: curBeat });
    return s;
  };
  const L = (x0, y0, x1, y1, o = {}) => W.line(ox + x0, oy + y0, ox + x1, oy + y1, o);
  const A = (x0, y0, x1, y1, o = {}) => W.arrow(ox + x0, oy + y0, ox + x1, oy + y1, { w: 8, ...o, curve: o.curve ? P(...o.curve) : undefined });
  const C = (x, y, r, o = {}) => W.circle(ox + x, oy + y, r, o);
  const E = (x, y, rx, ry, o = {}) => W.circle(ox + x, oy + y, rx, { ry, lap: .12, ...o });
  const RR = (x, y, w, h, r = 30, o = {}) => W.roundRect(ox + x, oy + y, w, h, r, o);
  const CV = (pts, o = {}) => W.curve(pts.map(([x, y]) => P(x, y)), o);
  const PL = (pts, o = {}) => W.poly(pts.map(([x, y]) => P(x, y)).flat(), o);
  const ARC = (x, y, r, a0, a1, o = {}) => W.arc(ox + x, oy + y, r, a0, a1, o);
  const HEAD = (str) => { const s = T(str, 140, 190, { h: 84, maxW: 1250 }); return [s, L(140, 228, 140 + s.width, 222, { w: 7, color: INK.blue })]; };
  const box = (x, y, w, h, lines, o = {}) => {                 // rounded box with centred lines of text
    const out = [RR(x, y, w, h, 34, { w: 8 })];
    const hs = lines.map((l, i) => (i === 0 ? (o.h1 ?? 50) : (o.h2 ?? 38)));
    const tot = hs.reduce((a, b) => a + b * 1.45, 0) - hs[hs.length - 1] * .45;
    let yy = y + h / 2 - tot / 2;
    lines.forEach((l, i) => { yy += hs[i]; out.push(T(l, x + w / 2, yy, { h: hs[i], align: 'center', maxW: w - 50, color: i === 0 ? o.c1 : undefined })); yy += hs[i] * .45; });
    return out;
  };
  // ───────── pictures
  function mite(cx, cy, s = 1) {
    const o = { w: 9 };
    const out = [E(cx, cy, 230 * s, 185 * s, o), RR(cx - 245 * s - 70 * s, cy - 40 * s, 80 * s, 80 * s, 30 * s, { w: 8 })];
    const legs = [[-150, -150, -260, -270, -330, -250], [-60, -175, -120, -300, -190, -320], [-150, 150, -250, 260, -330, 250], [-60, 172, -110, 290, -185, 320],
      [120, -160, 200, -280, 260, -300], [180, -120, 290, -200, 350, -190], [120, 160, 200, 280, 260, 300], [180, 120, 290, 200, 350, 190]];
    for (const l of legs) out.push(CV([[cx + l[0] * s, cy + l[1] * s], [cx + l[2] * s, cy + l[3] * s], [cx + l[4] * s, cy + l[5] * s]], { w: 8 }));
    const R = mulberry(77);
    for (let i = 0; i < 16; i++) { const a = R() * TAU, r = Math.sqrt(R()) * .62; const x = cx + Math.cos(a) * 200 * s * r + 20 * s, y = cy + Math.sin(a) * 150 * s * r; out.push(L(x, y, x + 22 * s, y - 10 * s, { w: 6 })); }
    return out;
  }
  function hand(x, y, s = 1) {                              // open palm, fingers up; returns outline stroke
    const fp = [[0, 700], [-6, 470], [-70, 410], [-150, 300], [-170, 235], [-130, 215], [-60, 290], [0, 330], [4, 120], [10, 70], [45, 50], [80, 70], [86, 280],
      [96, 70], [104, 25], [140, 8], [176, 25], [184, 270], [194, 50], [202, 20], [238, 10], [270, 30], [276, 285], [286, 130], [296, 100], [326, 92], [352, 112], [356, 300], [366, 700]];
    return CV(fp.map(([a, b]) => [x + a * s, y + b * s]), { w: 10, smooth: 2 });
  }
  const moon = (x, y, r) => [ARC(x, y, r, -2.1, 2.1, { w: 8, color: INK.blue }), CV([[x + r * Math.cos(-2.1), y + r * Math.sin(-2.1)], [x - r * .15, y], [x + r * Math.cos(2.1), y + r * Math.sin(2.1)]], { w: 8, color: INK.blue })];
  const house = (x, y, s = 1) => [PL([[x, y + 60 * s], [x + 130 * s, y - 60 * s], [x + 260 * s, y + 60 * s]], { w: 8 }), PL([[x + 25 * s, y + 40 * s], [x + 25 * s, y + 230 * s], [x + 235 * s, y + 230 * s], [x + 235 * s, y + 40 * s]], { w: 8 })];
  const stick = (x, y, s = 1, o = {}) => [C(x, y, 34 * s, { w: 7, ...o }), L(x, y + 36 * s, x, y + 190 * s, { w: 7, ...o }), L(x, y + 190 * s, x - 55 * s, y + 320 * s, { w: 7, ...o }), L(x, y + 190 * s, x + 55 * s, y + 320 * s, { w: 7, ...o })];
  const hatchDot = (x, y, r, color) => [C(x, y, r, { w: Math.max(4, r * .35), color }), W.hatch([[ox + x - r * .7, oy + y - r * .7], [ox + x + r * .7, oy + y - r * .7], [ox + x + r * .7, oy + y + r * .7], [ox + x - r * .7, oy + y + r * .7]], { color, spacing: Math.max(3, r * .35), w: Math.max(3, r * .3), alpha: .8 })];
  const bullets = (items, x, y, dy, o = {}) => items.map((s, i) => T(s, x, y + i * dy, o));

  // ───────── magnets (the mite = red; family = blue)
  const MAG = [];
  const magnet = (color, r = 48) => { const m = { color, r, k: [] }; MAG.push(m); return m; };
  const mkey = (m, t, x, y, lift = 0, vis = 1) => m.k.push({ t, x, y, lift, vis });
  const drop = (m, t, [x, y]) => { mkey(m, t - .4, x + 40, y - 60, 1, 1); mkey(m, t, x, y, 0, 1); tl.cue(t, 'magnet', { x, y }); };
  const slide = (m, t0, t1, pts) => {
    const n = pts.length; mkey(m, t0, pts[0][0], pts[0][1], 0); mkey(m, t0 + .12, pts[0][0], pts[0][1], .25);
    for (let i = 1; i < n - 1; i++) mkey(m, lerp(t0 + .12, t1 - .12, i / (n - 1)), pts[i][0], pts[i][1], .25);
    mkey(m, t1 - .12, pts[n - 1][0], pts[n - 1][1], .25); mkey(m, t1, pts[n - 1][0], pts[n - 1][1], 0);
    tl.cue(t0, 'slide', { dur: +(t1 - t0).toFixed(3), x: pts[0][0], y: pts[0][1] }); tl.cue(t1, 'magnetSoft', { x: pts[n - 1][0], y: pts[n - 1][1] });
  };
  const liftOff = (m, t, [x, y]) => { mkey(m, t, x, y, 0); mkey(m, t + .35, x, y, 1); mkey(m, t + 1.0, x + 900, y - 1400, 1, 0); tl.cue(t, 'magnetOff', { x, y }); };
  function magPose(m, t) {
    const K = m.k; if (!K.length || t < K[0].t) return null;
    if (t >= K[K.length - 1].t) { const k = K[K.length - 1]; return k.vis ? k : null; }
    let i = 0; while (t > K[i + 1].t) i++;
    const a = K[i], b = K[i + 1], u = (t - a.t) / (b.t - a.t), e = u * u * (3 - 2 * u);
    return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), lift: lerp(a.lift, b.lift, e), vis: 1 };
  }
  function drawMagnet(ctx, m, p, c) {
    const [sx, sy] = W.toScreen(c, p.x, p.y), r = m.r * c.z, up = p.lift * 40 * c.z;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save(); ctx.filter = `blur(${(5 + p.lift * 14) * c.z}px)`; ctx.fillStyle = `rgba(40,30,30,${.34 - p.lift * .14})`;
    ctx.beginPath(); ctx.ellipse(sx + (6 + up * .6) * 1, sy + (10 + up * .9), r * 1.02, r * .98, 0, 0, TAU); ctx.fill(); ctx.restore();
    const s = 1 + p.lift * .08, X = sx, Y = sy - up;
    const g = ctx.createRadialGradient(X - r * .4, Y - r * .45, r * .1, X, Y, r * s);
    const hi = m.color === INK.red ? '#f08a80' : '#8fb0ec', lo = m.color === INK.red ? '#8a1f1f' : '#183a7a';
    g.addColorStop(0, hi); g.addColorStop(.5, m.color); g.addColorStop(1, lo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, r * s, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = Math.max(1, 2 * c.z); ctx.beginPath(); ctx.arc(X, Y, r * s * .72, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(X - r * .35, Y - r * .45, r * .3, r * .14, -.6, 0, TAU); ctx.fill();
  }
  const MITE = magnet(INK.red, 50);
  const FAM = [0, 1, 2, 3].map(() => magnet(INK.blue, 42));

  // ───────── regions: each returns { beats, entry, exit } in local coords. A beat = { subs, focus, jobs, ... }
  //   job: [penKey, shapes, subIndex] or { fn(t) } (magnets, cues) with optional sub index
  const R = [];
  R.push(() => {   // 0 · hook + title
    const dot = [452, 590];
    return {
      exit: [2400, 700], entry: [0, 700],
      beats: [
        { subs: ['Titik merah sekecil ini panjangnya hanya ±0,4 mm.'], focus: [dot[0] - 120, dot[1] - 75, 240, 150], zoomCap: 7, move: 0, lead: .5,
          jobs: [['r', hatchDot(...dot, 9, INK.red), 0], ['r', T('±0,4 mm', dot[0] + 22, dot[1] - 18, { h: 15, color: INK.red }), 0]] },
        { subs: ['Tapi ia membuat gatal hebat, terutama di malam hari…', '…dan sering kali, satu rumah ikut gatal.'], focus: [0, 140, 2400, 1150], move: 3.8,
          jobs: [['k', hand(250, 330, 1.1), 0], ['b', moon(870, 300, 48), 0], ['k', T('Gatal hebat di malam hari?', 990, 380, { h: 66 }), 0],
            ['k', house(800, 560, .55), 1], ['k', T('Satu rumah ikut gatal?', 990, 650, { h: 66 }), 1]] },
        { subs: ['Itulah skabies. Kita bahas tuntas: dari definisi sampai terapi.'], focus: [700, 560, 1700, 760],
          jobs: [['k', T('SKABIES', 1010, 1010, { h: 190, w: 20, maxW: 1250 }), 0], ['r', [L(1000, 1060, 2230, 1050, { w: 10 }), L(1040, 1092, 2180, 1086, { w: 8 })], 0],
            ['b', T('dari definisi  →  terapi', 1020, 1210, { h: 60 }), 0]] },
      ],
    };
  });
  R.push(() => {   // 1 · definisi
    return {
      entry: [0, 700], exit: [2400, 700],
      beats: [
        { subs: ['Skabies adalah penyakit kulit menular akibat infestasi', 'dan sensitisasi terhadap tungau Sarcoptes scabiei var. hominis', 'beserta produknya: telur, feses (skibala), dan sekretnya.'], focus: [60, 80, 2280, 960],
          jobs: [['k', HEAD('1. DEFINISI'), 0], ['k', box(160, 300, 900, 250, ['INFESTASI', 'tungau masuk & hidup di kulit']), 0], ['b', T('+', 1160, 460, { h: 90 }), 1],
            ['k', box(1290, 300, 950, 250, ['SENSITISASI', 'reaksi imun terhadap tungau']), 1], ['b', A(1200, 590, 1200, 680), 1],
            ['r', T('Sarcoptes scabiei var. hominis', 1200, 790, { h: 80, align: 'center' }), 1],
            ['k', T('+ produknya: telur · skibala (feses) · sekret', 1200, 900, { h: 52, align: 'center' }), 2]] },
        { subs: ['Di Indonesia dikenal sebagai kudis, gudig, atau budukan.'], focus: [60, 80, 2280, 1250],
          jobs: [['k', T('Nama lain:', 160, 1090, { h: 56 }), 0], ['b', T('kudis · gudig · budukan', 620, 1090, { h: 56 }), 0]] },
      ],
    };
  });
  R.push(() => {   // 2 · epidemiologi
    return {
      entry: [0, 700], exit: [2400, 700],
      beats: [
        { subs: ['Lebih dari 200 juta orang di dunia menderita skabies setiap saat.'], focus: [60, 80, 1380, 700],
          jobs: [['k', HEAD('2. EPIDEMIOLOGI'), 0], ['k', [C(330, 520, 165, { w: 8 }), E(330, 520, 70, 165, { w: 6 }), L(170, 520, 492, 520, { w: 6 }), ARC(330, 700, 260, -2.05, -1.09, { w: 6 })], 0],
            ['r', T('>200 juta', 560, 540, { h: 125 }), 0], ['k', T('orang di dunia,', 570, 630, { h: 50 }), 0], ['k', T('setiap saat', 570, 700, { h: 50 }), 0]] },
        { subs: ['Sejak 2017, WHO memasukkannya ke daftar penyakit tropis terabaikan (NTD).'], focus: [60, 300, 1380, 700],
          jobs: [['b', T('WHO 2017:', 160, 830, { h: 50 }), 0], ['k', T('penyakit tropis terabaikan (NTD)', 160, 900, { h: 48, maxW: 1150 }), 0]] },
        { subs: ['Menyerang semua usia, tersering pada anak-anak,', 'terutama di lingkungan padat: pesantren, asrama, panti, penjara.'], focus: [60, 520, 1380, 760],
          jobs: [['k', T('• semua usia, tersering anak-anak', 160, 1030, { h: 46, maxW: 1150 }), 0], ['k', T('• lingkungan padat: pesantren,', 160, 1105, { h: 46 }), 1], ['k', T('asrama, panti, penjara', 205, 1175, { h: 46 }), 1]] },
        { subs: ['Faktor risiko: hunian padat, kontak erat, higiene kurang,', 'sosial-ekonomi rendah, dan imunitas yang menurun.'], focus: [1300, 200, 1100, 1000],
          jobs: [['k', T('FAKTOR RISIKO', 1420, 360, { h: 56 }), 0], ['b', L(1420, 395, 1880, 390, { w: 6 }), 0],
            ['k', bullets(['• hunian padat', '• kontak erat, tidur bersama', '• higiene & air bersih kurang'], 1420, 480, 92, { h: 42, maxW: 940 }), 0],
            ['k', bullets(['• sosial-ekonomi rendah', '• imunitas turun (HIV, steroid)'], 1420, 756, 92, { h: 42, maxW: 940 }), 1]] },
      ],
    };
  });
  R.push(() => {   // 3 · etiologi
    return {
      entry: [0, 700], exit: [1100, 1400],
      beats: [
        { subs: ['Penyebabnya adalah tungau (mite): Sarcoptes scabiei var. hominis.'], focus: [60, 80, 1300, 1150],
          jobs: [['k', HEAD('3. ETIOLOGI'), 0], ['r', T('Sarcoptes scabiei', 150, 375, { h: 64 }), 0], ['r', T('var. hominis', 150, 450, { h: 52 }), 0], ['k', mite(600, 770, .95), 0],
            { fn: t => drop(MITE, t + .2, P(1080, 1010)), sub: 0 }] },
        { subs: ['Ia bukan serangga: tungau termasuk Arachnida, kerabat laba-laba dan caplak.'], focus: [1150, 200, 1250, 800],
          jobs: [['k', bullets(['Filum: Arthropoda', 'Kelas: Arachnida', 'Ordo: Acari', 'Famili: Sarcoptidae'], 1260, 360, 72, { h: 46 }), 0], ['b', T('bukan serangga!', 1260, 680, { h: 50 }), 0]] },
        { subs: ['Betina berukuran 0,3–0,45 mm, jantan kira-kira setengahnya.', 'Tubuhnya oval, putih keabuan, dengan 4 pasang kaki.'], focus: [60, 450, 2100, 900],
          jobs: [['b', [L(330, 1075, 860, 1075, { w: 7 }), L(330, 1050, 330, 1100, { w: 7 }), L(860, 1050, 860, 1100, { w: 7 })], 0],
            ['k', T('betina 0,3–0,45 mm', 330, 1160, { h: 46 }), 0], ['k', T('jantan ± ½ betina', 330, 1230, { h: 42 }), 0],
            ['b', A(1250, 830, 960, 700, { curve: [1110, 820] }), 1], ['k', T('oval, 4 pasang kaki', 1270, 850, { h: 44 }), 1]] },
        { subs: ['Tak bisa terbang atau melompat; hanya merayap, ±2,5 cm per menit.', 'Di luar tubuh manusia, tungau hanya bertahan ±2–3 hari.'], focus: [1150, 600, 1250, 700],
          jobs: [['k', bullets(['• tidak terbang / melompat', '• merayap ±2,5 cm/menit'], 1270, 960, 70, { h: 42 }), 0], ['k', T('• di luar tubuh: ±2–3 hari', 1270, 1100, { h: 42 }), 1]] },
      ],
    };
  });
  R.push(() => {   // 4 · siklus hidup (col 3, row 1)
    const eggs = [], N = 7;
    return {
      entry: [1100, 0], exit: [0, 700],
      onEnter: t => slide(MITE, t - 1.9, t - .1, [P(1080, -390), P(700, -150), P(260, 418)]),
      beats: [
        { subs: ['Tungau kawin di permukaan kulit; tungau jantan lalu mati.'], focus: [60, 80, 1360, 800],
          jobs: [['k', HEAD('4. SIKLUS HIDUP'), 0], ['k', [CV([[120, 420], [450, 410], [800, 428], [1100, 412], [1360, 420]], { w: 9 }), CV([[120, 570], [500, 565], [900, 575], [1360, 568]], { w: 7 })], 0],
            ['b', T('stratum korneum', 150, 625, { h: 38 }), 0], ['k', T('permukaan kulit · kawin → jantan mati', 150, 340, { h: 40 }), 0]] },
        { subs: ['Betina menggali terowongan di stratum korneum, ±2–3 mm per hari,', 'sambil bertelur 2–4 butir per hari selama hidupnya (±30 hari).'], focus: [60, 200, 1360, 760],
          jobs: [{ fn: t => slide(MITE, t + .3, t + 7.5, [P(260, 418), P(300, 480), P(600, 496), P(900, 488), P(1230, 494)]), sub: 0 },
            ['k', [CV([[290, 470], [600, 474], [900, 466], [1240, 472]], { w: 6 }), CV([[290, 518], [600, 522], [900, 514], [1240, 520]], { w: 6 })], 0],
            ['b', T('terowongan ±2–3 mm/hari', 200, 720, { h: 42 }), 0],
            ['k', Array.from({ length: N }, (_, i) => E(340 + i * 120, 496, 20, 14, { w: 6 })), 1],
            ['b', T('telur 2–4 butir/hari', 200, 795, { h: 42 }), 1], ['b', T('betina hidup ±30 hari', 200, 870, { h: 42 }), 1]] },
        { subs: ['Telur menetas dalam 3–5 hari menjadi larva berkaki 3 pasang,', 'lalu berubah menjadi nimfa, kemudian tungau dewasa.'], focus: [1420, 230, 980, 950],
          jobs: [['k', T('telur', 1880, 380, { h: 46, align: 'center' }), 0], ['b', A(2010, 380, 2180, 600, { curve: [2140, 430] }), 0], ['b', T('3–5 hari', 2150, 470, { h: 34 }), 0],
            ['k', T('larva', 2220, 680, { h: 46, align: 'center' }), 0], ['k', T('(3 pasang kaki)', 2200, 735, { h: 30, align: 'center' }), 0], { fn: t => tl.cue(t, 'stage', { n: 1 }), sub: 0 },
            ['b', A(2150, 790, 1960, 990, { curve: [2120, 950] }), 1], ['k', T('nimfa', 1880, 1040, { h: 46, align: 'center' }), 1], { fn: t => tl.cue(t, 'stage', { n: 2 }), sub: 1 },
            ['b', A(1760, 1000, 1580, 760, { curve: [1610, 960] }), 1], ['k', T('dewasa', 1590, 700, { h: 46, align: 'center' }), 1], { fn: t => tl.cue(t, 'stage', { n: 3 }), sub: 1 },
            ['b', A(1590, 600, 1760, 380, { curve: [1610, 430] }), 1]] },
        { subs: ['Satu siklus, dari telur sampai dewasa, hanya 8–12 hari.', 'Pada skabies klasik, tubuh pasien rata-rata hanya membawa 10–15 tungau.'], focus: [60, 120, 2280, 1200],
          jobs: [['r', T('8–12', 1860, 700, { h: 66, align: 'center' }), 0], ['r', T('hari', 1860, 770, { h: 46, align: 'center' }), 0],
            ['k', T('skabies klasik: rata-rata 10–15 tungau/pasien', 150, 1000, { h: 44, maxW: 1200 }), 1]] },
      ],
    };
  });
  R.push(() => {   // 5 · penularan (col 2, row 1)
    return {
      entry: [2400, 700], exit: [0, 700], whip: true,
      beats: [
        { subs: ['Cara utama: kontak langsung kulit-ke-kulit yang lama dan erat,', 'misalnya tinggal serumah, tidur bersama, atau berhubungan seksual.'], focus: [60, 80, 1160, 1150],
          jobs: [['k', HEAD('5. CARA PENULARAN'), 0], ['k', W.dashed([P(1200, 300), P(1200, 1200)], { w: 6, color: INK.black }), 0],
            ['r', T('LANGSUNG (utama)', 150, 350, { h: 58 }), 0], ['k', [...stick(480, 470, 1), ...stick(800, 470, 1), CV([[480, 600], [640, 640], [800, 600]], { w: 7 })], 0],
            ['k', T('• kontak kulit-ke-kulit lama & erat', 150, 900, { h: 40, maxW: 1020 }), 0],
            ['k', bullets(['• serumah / tidur bersama', '• merawat anak / lansia', '• hubungan seksual'], 150, 970, 70, { h: 40 }), 1]] },
        { subs: ['Lewat benda (handuk, pakaian, sprei) lebih jarang —', 'kecuali pada skabies krustosa yang berisi sangat banyak tungau.'], focus: [1220, 230, 1160, 950],
          jobs: [['b', T('TIDAK LANGSUNG', 1280, 350, { h: 58 }), 0],
            ['k', [...W.rect(ox + 1300, oy + 470, 230, 260, { w: 7 }), L(1300, 680, 1530, 680, { w: 6 }), L(1300, 700, 1530, 700, { w: 6 }),
              PL([[1650, 520], [1720, 470], [1800, 470], [1870, 520], [1840, 570], [1815, 555], [1815, 730], [1705, 730], [1705, 555], [1680, 570], [1650, 520]], { w: 7 }),
              ...W.rect(ox + 1960, oy + 560, 340, 140, { w: 7 }), RR(1980, 520, 110, 50, 20, { w: 6 })], 0],
            ['k', [T('handuk', 1415, 800, { h: 38, align: 'center' }), T('pakaian', 1760, 800, { h: 38, align: 'center' }), T('sprei', 2130, 800, { h: 38, align: 'center' })], 0],
            ['k', T('• jarang pada skabies klasik', 1280, 920, { h: 40 }), 1], ['r', T('• sering pada skabies krustosa', 1280, 990, { h: 40, maxW: 1080 }), 1]] },
        { subs: ['Kontak singkat, seperti berjabat tangan, jarang menularkan.'], focus: [60, 120, 2280, 1200],
          jobs: [['b', T('jabat tangan singkat → risiko kecil', 1280, 1120, { h: 40, maxW: 1080 }), 0]] },
      ],
    };
  });
  R.push(() => {   // 6 · patogenesis (col 1, row 1)
    return {
      entry: [2400, 700], exit: [0, 700],
      beats: [
        { subs: ['Saat menggali, tungau mengeluarkan enzim yang melarutkan keratin.'], focus: [60, 80, 1560, 560],
          jobs: [['k', HEAD('6. PATOGENESIS'), 0], ['k', box(140, 300, 680, 200, ['Tungau menggali', '+ enzim pelarut keratin']), 0]] },
        { subs: ['Saliva, telur, dan skibala (fesesnya) bertindak sebagai antigen.'], focus: [60, 200, 2280, 420],
          jobs: [['b', A(840, 400, 930, 400), 0], ['k', box(950, 300, 680, 200, ['Produk tungau', 'saliva · telur · skibala']), 0], ['b', A(1650, 400, 1740, 400), 0],
            ['k', box(1760, 300, 520, 200, ['ANTIGEN'], { h1: 62 }), 0]] },
        { subs: ['Tubuh bereaksi: hipersensitivitas tipe IV (lambat) dan tipe I.', 'Reaksi inilah — bukan gigitan — yang menimbulkan gatal dan ruam.'], focus: [60, 230, 2280, 680],
          jobs: [['b', A(2020, 515, 2020, 610), 0], ['k', box(1340, 625, 940, 200, ['Hipersensitivitas', 'tipe IV (lambat) + tipe I']), 0], ['b', A(1325, 725, 1050, 725), 1],
            ['r', box(140, 625, 890, 200, ['GATAL + RUAM', 'lesi kulit'], { c1: INK.red }), 1]] },
        { subs: ['Pada infestasi pertama, gatal baru muncul setelah 2–6 minggu.', 'Pada infestasi ulang, gejala muncul dalam 1–4 hari.', 'Jadi, orang tanpa gejala bisa sudah tertular — dan menularkan.'], focus: [60, 830, 2280, 520],
          jobs: [['b', [...A(200, 1060, 2250, 1060), L(220, 1030, 220, 1090, { w: 7 })], 0], ['k', T('tertular', 220, 1150, { h: 38, align: 'center' }), 0],
            ['b', L(1650, 1030, 1650, 1090, { w: 7 }), 0], ['k', T('infestasi pertama: 2–6 minggu', 1650, 1000, { h: 42, align: 'center' }), 0],
            ['b', L(560, 1030, 560, 1090, { w: 7 }), 1], ['k', T('ulang: 1–4 hari', 560, 1000, { h: 42, align: 'center' }), 1],
            ['k', T('tanpa gejala ≠ tidak tertular', 1200, 1210, { h: 46, align: 'center' }), 2]] },
      ],
    };
  });
  R.push(() => {   // 7 · patofisiologi (col 0, row 1)
    return {
      entry: [2400, 700], exit: [1100, 1400],
      beats: [
        { subs: ['Gatal khas memburuk di malam hari: pruritus nokturna.', 'Tungau lebih aktif saat kulit hangat, misalnya di balik selimut.'], focus: [60, 80, 1500, 560],
          jobs: [['k', HEAD('7. PATOFISIOLOGI'), 0], ['b', moon(230, 400, 60), 0], ['r', T('PRURITUS NOKTURNA', 330, 420, { h: 68 }), 0],
            ['k', T('gatal memburuk di malam hari', 330, 500, { h: 44 }), 0], ['k', T('tungau aktif saat kulit hangat', 330, 570, { h: 44 }), 1]] },
        { subs: ['Garukan membuat kulit lecet (ekskoriasi) — pintu masuk bakteri.'], focus: [60, 560, 2280, 360],
          jobs: [['k', T('gatal', 150, 740, { h: 48 }), 0], ['b', A(330, 725, 440, 725), 0], ['k', T('garukan', 460, 740, { h: 48 }), 0], ['b', A(730, 725, 840, 725), 0],
            ['k', T('ekskoriasi (lecet)', 860, 740, { h: 48 }), 0], ['b', A(1500, 725, 1610, 725), 0], ['k', T('bakteri masuk', 1630, 740, { h: 48 }), 0]] },
        { subs: ['Tungau juga menghambat sistem komplemen kulit,', 'sehingga S. pyogenes dan S. aureus mudah menginfeksi:', 'timbul impetigo, selulitis, hingga abses.'], focus: [60, 760, 2280, 420],
          jobs: [['k', T('+ tungau menghambat komplemen', 150, 880, { h: 44 }), 0], ['b', A(1080, 865, 1190, 865), 1], ['k', T('S. pyogenes · S. aureus', 1210, 880, { h: 46 }), 1],
            ['b', A(1600, 905, 1600, 975), 2], ['k', T('impetigo · selulitis · abses', 1600, 1040, { h: 46, align: 'center' }), 2]] },
        { subs: ['Infeksi streptokokus bisa berlanjut menjadi GNAPS', '(glomerulonefritis akut pascastreptokokus) dan demam rematik.', 'Skabies bukan sekadar gatal.'], focus: [60, 830, 2280, 520],
          jobs: [['b', A(1450, 1065, 1400, 1125), 0], ['k', RR(450, 1140, 1800, 120, 30, { w: 8 }), 0], ['k', T('Streptokokus → GNAPS · demam rematik', 1350, 1222, { h: 48, align: 'center', maxW: 1700 }), 0],
            ['b', T('(glomerulonefritis akut pascastreptokokus)', 1350, 1320, { h: 34, align: 'center' }), 1]] },
      ],
    };
  });
  R.push(() => {   // 8 · gambaran klinis (col 0, row 2)
    const dots = [[1567, 846, 'sela jari', -1], [1590, 700, 'pergelangan tangan', -1], [1624, 520, 'siku', -1], [1690, 390, 'ketiak', -1], [1815, 430, 'areola', 1], [1750, 600, 'pusar', 1], [1845, 690, 'pinggang', 1], [1750, 790, 'genitalia pria', 1]];
    return {
      entry: [1100, 0], exit: [2400, 700],
      beats: [
        { subs: ['Lesi khas: terowongan (kanalikulus) putih keabuan, lurus atau berkelok, ±1 cm.', 'Di ujungnya ada papul atau vesikel — di situlah tungau berada.'], focus: [60, 80, 1260, 760],
          jobs: [['k', HEAD('8. GAMBARAN KLINIS'), 0], ['k', CV([[180, 470], [300, 420], [420, 480], [560, 430], [700, 470], [820, 440]], { w: 12, color: '#7d838c', alpha: .8 }), 0],
            ['k', T('terowongan (kanalikulus)', 150, 590, { h: 46 }), 0], ['k', T('putih keabuan, lurus/berkelok, ±1 cm', 150, 650, { h: 36, maxW: 1100 }), 0],
            ['r', C(870, 440, 32, { w: 7 }), 1], ['r', hatchDot(870, 440, 9, INK.red), 1], ['b', A(1050, 330, 910, 410, { curve: [1000, 340] }), 1], ['b', T('papul/vesikel = tungau', 750, 300, { h: 38 }), 1]] },
        { subs: ['Garukan dan infeksi menambah lesi: papul, pustul, ekskoriasi, krusta.'], focus: [60, 600, 1260, 620],
          jobs: [['k', T('Lesi sekunder:', 150, 820, { h: 46 }), 0], ['k', T('papul · vesikel · pustul', 150, 890, { h: 40 }), 0], ['k', T('ekskoriasi · krusta · nodul', 150, 955, { h: 40 }), 0]] },
        { subs: ['Tempat predileksi: kulit dengan lapisan tanduk tipis —', 'sela jari, pergelangan tangan, siku, lipat ketiak, areola,', 'pusar, pinggang, bokong, dan genitalia pria.'], focus: [900, 180, 1500, 1120], move: 2.2,
          jobs: [['k', body(1750, 250, 1.0), 0],
            ...dots.map(([x, y, s, side], i) => ['r', [hatchDot(x, y, 13, INK.red), T(s, side < 0 ? x - 40 : x + 40, y + 12, { h: 44, align: side < 0 ? 'right' : 'left', color: INK.black })], i < 4 ? 1 : 2]),
            ['k', T('+ bokong', 1990, 1120, { h: 44 }), 2]] },
        { subs: ['Wajah dan kepala biasanya bebas — kecuali pada bayi,', 'yang juga bisa terkena di telapak tangan dan telapak kaki.'], focus: [60, 120, 2280, 1240],
          jobs: [['b', T('bayi: + wajah, kepala, telapak tangan & kaki', 150, 1110, { h: 38, maxW: 1150 }), 0]] },
      ],
    };
    function body(cx, y0, s) {
      const half = [[0, 0], [60, 10], [85, 70], [70, 140], [35, 175], [40, 205], [150, 230], [190, 280], [215, 450], [240, 620], [250, 700], [235, 720], [205, 640], [170, 470], [150, 380],
        [140, 560], [150, 700], [130, 830], [120, 1000], [100, 1000], [55, 720], [25, 700], [0, 700]];
      const R = half.map(([x, y]) => [cx + x * s, y0 + y * s]), Lf = half.slice().reverse().map(([x, y]) => [cx - x * s, y0 + y * s]);
      return [CV(R, { w: 9, smooth: 2 }), CV(Lf, { w: 9, smooth: 2 })];
    }
  });
  R.push(() => {   // 9 · bentuk klinis (col 1, row 2)
    return {
      entry: [0, 700], exit: [2400, 700],
      beats: [
        { subs: ['Bentuk tersering adalah skabies klasik.', 'Skabies nodular: nodul merah-cokelat yang sangat gatal, bisa menetap berbulan-bulan.'], focus: [60, 80, 1200, 700],
          jobs: [['k', HEAD('9. BENTUK KLINIS'), 0], ['k', T('1. Klasik', 150, 380, { h: 54 }), 0], ['k', T('2. Nodular', 150, 510, { h: 54 }), 1], ['k', T('nodul merah-cokelat, sangat gatal', 200, 575, { h: 36, maxW: 1000 }), 1]] },
        { subs: ['Skabies incognito: gambarannya tersamar karena pemakaian kortikosteroid.', 'Pada bayi dan anak, lesi bisa muncul di wajah, kepala, dan telapak.'], focus: [60, 450, 1200, 700],
          jobs: [['k', T('3. Incognito', 150, 700, { h: 54 }), 0], ['k', T('tersamar akibat kortikosteroid', 200, 765, { h: 36 }), 0],
            ['k', T('4. Bayi & anak', 150, 890, { h: 54 }), 1], ['k', T('wajah, kepala, telapak', 200, 955, { h: 36 }), 1]] },
        { subs: ['Paling berbahaya: skabies krustosa (Norwegia), pada imunitas yang lemah.', 'Kulitnya berkrusta tebal dan berisi ribuan hingga jutaan tungau.', 'Gatalnya bisa ringan — tetapi sangat menular.'], focus: [1180, 220, 1200, 1060], silence: 2 * BEAT,
          jobs: [['r', RR(1250, 290, 1060, 960, 40, { w: 9 }), 0], ['r', T('KRUSTOSA', 1780, 400, { h: 72, align: 'center' }), 0], ['k', T('(Norwegia)', 1780, 470, { h: 44, align: 'center' }), 0],
            ['k', bullets(['• imunokompromais (HIV, steroid)', '• lansia, sindrom Down'], 1310, 570, 66, { h: 38, maxW: 960 }), 0],
            ['k', bullets(['• krusta tebal, hiperkeratosis', '• ribuan–jutaan tungau'], 1310, 730, 66, { h: 38, maxW: 960 }), 1],
            ['k', T('• gatal bisa minimal', 1310, 890, { h: 38 }), 2], ['r', T('SANGAT MENULAR!', 1780, 1040, { h: 60, align: 'center' }), 2]] },
      ],
    };
  });
  R.push(() => {   // 10 · diagnosis (col 2, row 2)
    return {
      entry: [0, 700], exit: [2400, 700],
      beats: [
        { subs: ['Diagnosis klinis memakai 4 tanda kardinal:', '1) gatal malam hari, 2) menyerang sekelompok orang,', '3) terowongan di tempat predileksi, 4) ditemukan tungau, telur, atau skibala.'], focus: [60, 80, 1360, 720],
          jobs: [['k', HEAD('10. DIAGNOSIS'), 0], ['k', T('4 TANDA KARDINAL', 150, 345, { h: 58 }), 0],
            ['k', bullets(['1  pruritus nokturna (gatal malam)', '2  menyerang kelompok (keluarga, asrama)'], 150, 445, 85, { h: 44, maxW: 1180 }), 1],
            ['k', bullets(['3  terowongan di tempat predileksi', '4  ditemukan tungau / telur / skibala'], 150, 615, 85, { h: 44, maxW: 1180 }), 2]] },
        { subs: ['Diagnosis ditegakkan bila ditemukan minimal 2 dari 4 tanda kardinal.'], focus: [100, 700, 1250, 330], zoomCap: 1.35,
          jobs: [['r', RR(150, 760, 1130, 150, 36, { w: 9 }), 0], ['r', T('≥ 2 dari 4 tanda  →  skabies', 715, 860, { h: 58, align: 'center', maxW: 1050 }), 0]] },
        { subs: ['Penunjang: kerokan kulit di ujung terowongan, diperiksa di bawah mikroskop.', 'Bisa juga tes tinta terowongan, dermoskopi, atau swab selotip.', 'Hasil negatif tidak menyingkirkan skabies.'], focus: [1320, 220, 1080, 760],
          jobs: [['k', T('PEMERIKSAAN PENUNJANG', 1400, 345, { h: 46, maxW: 950 }), 0], ['b', L(1400, 375, 2330, 370, { w: 6 }), 0],
            ['k', bullets(['• kerokan kulit + minyak mineral/KOH', '   → mikroskop: tungau, telur, skibala'], 1400, 440, 62, { h: 36, maxW: 930 }), 0],
            ['k', bullets(['• tes tinta terowongan', '• dermoskopi: tanda "delta wing"', '• swab selotip / biopsi'], 1400, 580, 62, { h: 36, maxW: 930 }), 1],
            ['b', T('hasil negatif ≠ bukan skabies', 1400, 800, { h: 40, maxW: 930 }), 2]] },
        { subs: ['Kriteria internasional IACS 2020 membaginya menjadi terkonfirmasi, klinis, dan suspek.'], focus: [60, 900, 2280, 440],
          jobs: [['k', T('Kriteria IACS 2020:', 150, 1100, { h: 48 }), 0], ['b', T('A terkonfirmasi  ·  B klinis  ·  C suspek', 150, 1185, { h: 46, maxW: 1400 }), 0]] },
      ],
    };
  });
  R.push(() => {   // 11 · diagnosis banding (col 3, row 2)
    const rows = [['Dermatitis atopik', 'riwayat atopi, lipatan, kronik'], ['Prurigo', 'papul keras, kronik, ekstensor'], ['Gigitan serangga', 'area terbuka, tidak menular'],
      ['Pedikulosis korporis', 'kutu & telur di lipatan baju'], ['Dermatitis kontak', 'sesuai area paparan'], ['Impetigo / folikulitis', 'infeksi bakteri primer']];
    return {
      entry: [0, 700], exit: [1100, 1400],
      beats: [
        { subs: ['Skabies sering mirip penyakit gatal lain.', 'Bedakan dengan dermatitis atopik, prurigo, gigitan serangga,', 'pedikulosis korporis, dermatitis kontak, dan impetigo.'], focus: [60, 80, 2280, 1000],
          jobs: [['k', HEAD('11. DIAGNOSIS BANDING'), 0], ...rows.map(([a, b], i) => ['k', [T(a, 150, 370 + i * 100, { h: 44 }), T(b, 1050, 370 + i * 100, { h: 38, color: INK.blue })], i < 3 ? 1 : 2])] },
        { subs: ['Skabies krustosa bisa mirip psoriasis atau dermatitis seboroik.', 'Kuncinya: gatal malam, menyerang kelompok, dan ada terowongan.'], focus: [60, 400, 2280, 950],
          jobs: [['k', [T('Krustosa ≈ psoriasis', 150, 970, { h: 44 }), T('plak bersisik; cari tungau', 1050, 970, { h: 38, color: INK.blue })], 0],
            ['r', T('KUNCI: gatal malam + kelompok + terowongan', 150, 1150, { h: 52, maxW: 2100 }), 1]] },
      ],
    };
  });
  R.push(() => {   // 12 · tatalaksana skabisida (col 3, row 3)
    return {
      entry: [1100, 0], exit: [0, 700],
      beats: [
        { subs: ['Pilihan utama: permetrin 5% krim.', 'Oleskan dari leher ke ujung kaki, termasuk sela jari, kuku, dan genital.', 'Bayi dan lansia: kepala dan wajah juga diolesi, hindari mata dan mulut.', 'Biarkan 8–12 jam (semalam), lalu mandi. Aman untuk bayi ≥ 2 bulan.'], focus: [60, 80, 1400, 820],
          jobs: [['k', HEAD('12. OBAT SKABISIDA'), 0], ['r', RR(140, 290, 1130, 120, 30, { w: 9 }), 0], ['r', T('LINI PERTAMA: Permetrin 5% krim', 705, 372, { h: 50, align: 'center', maxW: 1060 }), 0],
            ['k', bullets(['• oles leher → ujung kaki, termasuk', '   sela jari, kuku, lipatan, genital'], 150, 500, 60, { h: 38, maxW: 1100 }), 1],
            ['k', bullets(['• bayi & lansia: + kepala & wajah', '   (hindari mata dan mulut)'], 150, 640, 60, { h: 38, maxW: 1100 }), 2],
            ['k', bullets(['• biarkan 8–12 jam (malam) → mandi', '• aman untuk bayi ≥ 2 bulan'], 150, 780, 60, { h: 38, maxW: 1100 }), 3]] },
        { subs: ['Ulangi satu minggu kemudian (hari ke-7).', 'Obat kurang mampu membunuh telur — dosis kedua membasmi larva yang baru menetas.'], focus: [60, 840, 1300, 540], silence: 2 * BEAT,
          jobs: [['b', [...A(180, 1080, 1260, 1080), L(220, 1050, 220, 1110, { w: 7 }), L(1150, 1050, 1150, 1110, { w: 7 })], 0],
            ['k', T('hari 1', 220, 1170, { h: 40, align: 'center' }), 0], ['r', T('hari 7: ULANG', 1150, 1170, { h: 44, align: 'center' }), 0],
            ['k', [E(470, 1040, 22, 15, { w: 6 }), E(530, 1040, 22, 15, { w: 6 }), A(580, 1040, 700, 1040, { w: 6, head: 22 })], 1], ['k', T('menetas 3–5 hari', 700, 990, { h: 34 }), 1]] },
        { subs: ['Alternatif: salep sulfur presipitatum 5–10%, 3 malam berturut-turut —', 'aman untuk bayi dan ibu hamil.', 'Lainnya: benzil benzoat 20–25% atau krotamiton 10%. Lindan dihindari.'], focus: [1300, 230, 1100, 600],
          jobs: [['b', T('ALTERNATIF', 1370, 340, { h: 50 }), 0], ['k', T('• sulfur presipitatum 5–10%, 3 malam', 1370, 430, { h: 36, maxW: 990 }), 0],
            ['k', T('   aman untuk bayi & ibu hamil', 1370, 490, { h: 36 }), 1],
            ['k', bullets(['• benzil benzoat 20–25% (iritatif)', '• krotamiton 10% (juga antigatal)', '• lindan 1%: neurotoksik → hindari'], 1370, 560, 62, { h: 36, maxW: 990 }), 2]] },
        { subs: ['Obat oral: ivermektin 200 μg/kgBB dosis tunggal, diulang setelah 7–14 hari.', 'Tidak untuk anak dengan berat < 15 kg, ibu hamil, dan menyusui.'], focus: [1300, 700, 1100, 640],
          jobs: [['b', T('ORAL', 1370, 850, { h: 50 }), 0], ['k', bullets(['• ivermektin 200 μg/kgBB, dosis tunggal', '   ulang setelah 7–14 hari'], 1370, 930, 62, { h: 36, maxW: 990 }), 0],
            ['k', bullets(['• bukan untuk BB < 15 kg, hamil,', '   menyusui'], 1370, 1070, 62, { h: 36, maxW: 990 }), 1]] },
      ],
    };
  });
  R.push(() => {   // 13 · prinsip & terapi pendukung (col 2, row 3)
    const fam = [[280, 610], [400, 640], [520, 610], [400, 520]];
    return {
      entry: [2400, 700], exit: [0, 700],
      beats: [
        { subs: ['Prinsip terpenting: obati pasien dan semua kontak erat secara bersamaan,', 'walaupun mereka belum bergejala — agar tidak saling menulari ulang.'], focus: [60, 80, 1580, 760],
          jobs: [['k', HEAD('13. PRINSIP & PENDUKUNG'), 0], ['k', house(150, 400, 1.95), 0],
            ...fam.map((p, i) => ({ fn: t => drop(FAM[i], t + i * .3, P(...p)), sub: 0 })),
            ['r', C(400, 600, 190, { w: 8, lap: .3 }), 0], ['r', T('OBATI SEMUA KONTAK', 720, 420, { h: 52 }), 0], ['r', T('BERSAMAAN', 720, 495, { h: 52 }), 0],
            ['k', T('walau tanpa gejala', 720, 580, { h: 40 }), 1], ['k', T('cegah tertular ulang (ping-pong)', 720, 650, { h: 40, maxW: 700 }), 1]] },
        { subs: ['Untuk gatal: antihistamin sedatif di malam hari dan emolien.', 'Infeksi sekunder diberi antibiotik; nodul yang menetap dengan kortikosteroid.'], focus: [1480, 230, 920, 640],
          jobs: [['k', T('Gatal:', 1560, 360, { h: 46 }), 0], ['k', bullets(['antihistamin sedatif (malam)', '+ emolien'], 1580, 430, 60, { h: 38, maxW: 860 }), 0],
            ['k', T('Infeksi sekunder:', 1560, 600, { h: 46 }), 1], ['k', T('antibiotik', 1580, 665, { h: 38 }), 1], ['k', T('Nodul: kortikosteroid', 1560, 760, { h: 40, maxW: 880 }), 1]] },
        { subs: ['Cuci pakaian, sprei, dan handuk dengan air panas ≥ 60 °C lalu keringkan panas,', 'atau simpan dalam kantong plastik tertutup minimal 72 jam.'], focus: [60, 780, 1400, 560],
          jobs: [['b', T('DEKONTAMINASI', 150, 900, { h: 50 }), 0], ['k', T('• cuci air panas ≥ 60 °C, keringkan panas', 150, 980, { h: 38, maxW: 1200 }), 0],
            ['k', bullets(['• atau kantong plastik tertutup ≥ 72 jam', '• vakum kasur & karpet'], 150, 1050, 66, { h: 38, maxW: 1200 }), 1]] },
        { subs: ['Skabies krustosa: permetrin + ivermektin berulang, keratolitik, dan isolasi.'], focus: [1450, 780, 950, 560],
          jobs: [['k', T('Skabies krustosa:', 1560, 900, { h: 46 }), 0], ['k', bullets(['permetrin + ivermektin', 'berulang (mis. hari 1, 2, 8)', '+ keratolitik + isolasi'], 1580, 970, 62, { h: 38, maxW: 860 }), 0]] },
      ],
    };
  });
  R.push(() => {   // 14 · edukasi & evaluasi (col 1, row 3)
    return {
      entry: [2400, 700], exit: [0, 700],
      beats: [
        { subs: ['Setelah terapi berhasil, gatal bisa bertahan 2–4 minggu.', 'Itu reaksi terhadap sisa tungau mati — bukan tanda gagal.', 'Jangan mengoles obat berulang-ulang secara berlebihan.'], focus: [60, 80, 1260, 1150],
          jobs: [['k', HEAD('14. EDUKASI & EVALUASI'), 0], ['k', [...A(170, 950, 1150, 950, { w: 7 }), ...A(170, 950, 170, 330, { w: 7 })], 0],
            ['k', T('gatal', 120, 300, { h: 38 }), 0], ['r', CV([[180, 380], [300, 420], [450, 560], [650, 760], [850, 880], [1080, 930]], { w: 9 }), 0],
            ['k', [T('terapi', 180, 1010, { h: 34, align: 'center' }), T('2 mgg', 600, 1010, { h: 34, align: 'center' }), T('4 mgg', 1030, 1010, { h: 34, align: 'center' })], 0],
            ['b', T('gatal pasca-skabies', 560, 480, { h: 42 }), 0], ['r', T('≠ gagal terapi', 600, 560, { h: 50 }), 1],
            ['k', T('jangan oles berlebihan', 180, 1110, { h: 42 }), 2]] },
        { subs: ['Kontrol pada minggu ke-2 dan ke-4.', 'Ada terowongan atau lesi baru? Evaluasi cara pakai, kepatuhan,', 'dan kontak yang belum ikut diobati.'], focus: [1180, 220, 1220, 900],
          jobs: [['k', T('Kontrol: minggu ke-2 & ke-4', 1260, 380, { h: 46, maxW: 1080 }), 0], ['b', T('terowongan / lesi baru?', 1260, 500, { h: 44 }), 1], ['b', T('→ evaluasi:', 1260, 570, { h: 44 }), 1],
            ['k', bullets(['• cara oles & dosis kedua', '• kepatuhan', '• kontak yang belum diobati'], 1300, 650, 66, { h: 38 }), 2]] },
      ],
    };
  });
  R.push(() => {   // 15 · pencegahan & prognosis + ending (col 0, row 3)
    return {
      entry: [2400, 700], exit: [0, 700],
      beats: [
        { subs: ['Pencegahan: jangan berbagi handuk, pakaian, dan sprei;', 'obati kontak sekaligus; di asrama dan pesantren,', 'lakukan skrining dan pengobatan massal.'], focus: [60, 80, 1650, 800],
          jobs: [['k', HEAD('15. PENCEGAHAN & PROGNOSIS'), 0], ['b', T('PENCEGAHAN', 150, 350, { h: 50 }), 0],
            ['k', T('• jangan berbagi handuk, pakaian, sprei', 150, 440, { h: 38, maxW: 1150 }), 0],
            ['k', T('• obati kontak serumah sekaligus', 150, 510, { h: 38 }), 1],
            ['k', bullets(['• skrining & pengobatan massal', '   di asrama / pesantren'], 150, 580, 62, { h: 38 }), 2]] },
        { subs: ['Prognosis skabies baik — bila obat dipakai dengan benar', 'dan semua kontak ikut diobati.'], focus: [1250, 230, 1150, 600],
          jobs: [['r', T('PROGNOSIS: BAIK', 1350, 400, { h: 64, maxW: 1000 }), 0], ['k', T('bila obat dipakai benar', 1350, 490, { h: 42 }), 0], ['k', T('& semua kontak diobati', 1350, 560, { h: 42 }), 1]] },
        { subs: ['Kecil tungaunya, besar dampaknya — tetapi bisa disembuhkan.'], focus: [60, 600, 2280, 760], ending: true,
          jobs: [['k', T('kecil tungaunya, besar dampaknya,', 1200, 900, { h: 58, align: 'center' }), 0], ['r', T('tetapi bisa disembuhkan.', 1200, 1000, { h: 58, align: 'center' }), 0]] },
      ],
    };
  });

  // ───────── sequencer
  const T0 = 0.0;
  const grid = t => T0 + Math.ceil((t - T0) / BEAT - 1e-6) * BEAT;
  const camKeys = [], subs = [], beatsT = [], regionsT = [];
  const focusCam = (f, zoomCap = 1.2) => {
    const z = Math.min(zoomCap, 1920 / f[2], 930 / f[3]);
    const x = clamp(ox + f[0] + f[2] / 2, 960 / z, BW - 960 / z), y = clamp(oy + f[1] + f[3] / 2 + 62 / z, 540 / z, BH - 540 / z);
    return [x, y, z];
  };
  const estDur = list => W_flat(list).reduce((a, s) => a + s.len / (s.kind === "text" ? TEXT_SPEED : LINE_SPEED) + .014, 0);
  function W_flat(a) { return Array.isArray(a) ? a.flatMap(W_flat) : [a]; }
  let t = T0, prevExit = null, prevPen = null;
  const ghosts = [];
  for (let ri = 0; ri < R.length; ri++) {
    curRegion = ri; const [col, row] = ORDER[ri]; ox = col * RW; oy = row * RH;
    curBeat = 0;
    const reg = R[ri]();
    const entryW = P(...reg.entry);
    if (ri > 0) {                                   // transition: blue pen draws the connector, the camera rides it
      const TR = (reg.whip ? 2 : 3) * BEAT, first = focusCam(reg.beats[0].focus, reg.beats[0].zoomCap);
      const mid = [(prevExit[0] + entryW[0]) / 2, (prevExit[1] + entryW[1]) / 2];
      tl.draw(PEN.b, W.curve([prevExit, [mid[0] + (prevExit[1] === entryW[1] ? 0 : 60), mid[1] + (prevExit[1] === entryW[1] ? 40 : 0)], entryW], { w: 9, smooth: 3 }), t + .1, { by: t + TR - .25, tag: 'link' });
      tl.cue(t, reg.whip ? 'whip' : 'ride', { dur: +TR.toFixed(3) }); tl.cue(t + TR, 'region', { n: ri });
      camKeys.push([t, ...camKeys[camKeys.length - 1].slice(1, 4), 0, 'io']);
      camKeys.push([t + TR, first[0], first[1], first[2], 0, 'io']);
      t += TR;
      if (reg.onEnter) reg.onEnter(t);
    } else tl.cue(t, 'region', { n: 0 });
    regionsT.push(t);
    reg.beats.forEach((bt, bi) => {
      curBeat = bi;                                // (texts were created when the region was built; fix their beat below)
      if (bt.silence) { tl.cue(t, 'silence', { dur: +bt.silence.toFixed(3) }); t += bt.silence; }
      const tb = t, [cx, cy, cz] = focusCam(bt.focus, bt.zoomCap);
      if (!(ri > 0 && bi === 0)) {
        if (ri === 0 && bi === 0) camKeys.push([0, cx, cy, cz, 0, 'io']);
        else { const mv = bt.move ?? 1.15; camKeys.push([tb, ...camKeys[camKeys.length - 1].slice(1, 4), 0, 'io']); camKeys.push([tb + mv, cx, cy, cz, 0, 'io']); }
      }
      let jc = tb + (bt.lead ?? .25), sc = tb;
      const nS = bt.subs.length;
      for (let si = 0; si < nS; si++) {
        const s0 = Math.max(sc, si ? 0 : tb);
        jc = Math.max(jc, s0 + (si ? .15 : (bt.lead ?? .25)));
        for (const j of bt.jobs) {
          const js = Array.isArray(j) ? j[2] : (j.sub ?? 0); if (js !== si) continue;
          if (!Array.isArray(j)) { j.fn(jc); continue; }
          const [pk, shapes] = j, list = W_flat(shapes); if (!list.length) continue;
          for (const x of TEXTS) if (x.region === ri && list.includes(x.strokes[0])) x.beat = bi;
          const d = Math.max(estDur(list), .1 + .1 * Math.sqrt(list.length));
          jc = tl.draw(PEN[pk], list, jc, { by: jc + d, minGap: .015, maxGap: .22, tag: `r${ri}b${bi}` }) + .12;
        }
        const read = Math.max(SUB_MIN, bt.subs[si].replace(/\s/g, '').length / SUB_CPS + SUB_PAD);
        const end = Math.max(s0 + read, jc + (si === nS - 1 ? .9 : .3));
        subs.push({ t0: s0, t1: end, text: bt.subs[si], region: ri });
        sc = end;
      }
      let need = sc + (bi === reg.beats.length - 1 ? .5 : .15);
      for (const x of TEXTS) if (x.region === ri && x.beat === bi) {          // every board text gets its reading time
        const t0 = Math.min(...x.strokes.map(s => s.t0)); if (t0 > 1e8) { console.warn('undrawn text: ' + x.text); continue; } need = Math.max(need, t0 + x.text.replace(/\s/g, '').length / 15 + 1.5 + .35);
      }
      let tEnd = grid(need);
      if (bt.ending) {                            // final: pull back to the whole board, lift the mite, circle the title, cap the pen
        const tp = tEnd;
        camKeys.push([tp, cx, cy, cz, 0, 'io']);
        const zf = Math.min(1920 / (BW + 500), 1080 / (BH + 500));
        camKeys.push([tp + 4.2, BW / 2, BH / 2 + 40, zf, 0, 'io']);
        const mp = magPose(MITE, tp); if (mp) liftOff(MITE, tp + 3.0, [mp.x, mp.y]);
        ox = 0; oy = 0;
        tl.draw(PEN.r, [W.circle(1620, 950, 760, { ry: 260, w: 26, lap: .5 }), W.circle(1620, 955, 800, { ry: 290, w: 22, lap: .3, a0: -2.6 })], tp + 4.6, { by: tp + 6.4, tag: 'final circle' });
        tl.cue(tp + 7.6, 'cap');
        subs[subs.length - 1].t1 = Math.min(subs[subs.length - 1].t1, tp + 1.5);
        tEnd = grid(tp + 10.5);
      }
      beatsT.push({ t0: tb, t1: tEnd, region: ri, beat: bi });
      subs[subs.length - 1].t1 = Math.max(subs[subs.length - 1].t1, Math.min(tEnd - .05, subs[subs.length - 1].t1 + 1.2));
      t = tEnd;
    });
    prevExit = P(...reg.exit);
  }
  const END = t;
  // ghosts: faint residue of old lessons
  const gR = mulberry(99);
  for (let i = 0; i < 70; i++) {
    const x = gR() * BW, y = gR() * BH, k = gR(), o = { w: 7, color: gR() < .5 ? '#9aa0a8' : '#9db2d6', alpha: .05 + gR() * .05, jitter: 1 };
    if (k < .3) ghosts.push(...W.text(['x = 2', 'Hb 12', 'TD 120/80', 'kuis', 'p < 0,05', 'jumat', 'ok', 'UTS'][i % 8], x, y, { h: 50 + gR() * 40, ...o }));
    else if (k < .55) ghosts.push(W.circle(x, y, 40 + gR() * 110, o));
    else if (k < .8) ghosts.push(...W.arrow(x, y, x + (gR() - .5) * 500, y + (gR() - .5) * 300, o));
    else ghosts.push(W.line(x, y, x + 200 + gR() * 500, y + (gR() - .5) * 80, o));
  }
  tl.end();
  camKeys.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < camKeys.length; i++) if (camKeys[i][0] <= camKeys[i - 1][0]) camKeys[i][0] = camKeys[i - 1][0] + 1e-3;
  const cam = new W.Camera(camKeys);
  for (const s of subs) { s.t0 = +s.t0.toFixed(3); s.t1 = +s.t1.toFixed(3); }
  for (let i = 0; i < subs.length - 1; i++) subs[i].t1 = Math.min(subs[i].t1, subs[i + 1].t0 - .04);

  // ───────── board + props + overlays
  const board = new W.Board(tl, { ghosts, W: BW, H: BH });
  board.objs.push({ draw: (ctx, tt, c) => { for (const m of MAG) { const p = magPose(m, tt); if (p) drawMagnet(ctx, m, p, c); } } });
  const capAt = END - 2.0;
  const pose = (p, tt) => (tt > capAt - 1 && p !== PEN.r ? null : W.penPose(p, tt, cam));
  board.objs.push({ draw: (ctx, tt, c) => { for (const p of Object.values(PEN)) W.drawMarker(ctx, p, pose(p, tt), c, tt); } });
  board.overlays.push({
    draw: (ctx, tt) => {
      const s = subs.find(s => tt >= s.t0 && tt < s.t1); if (!s) return;
      const a = Math.min(1, (tt - s.t0) / .12, (s.t1 - tt) / .12);
      ctx.font = '42px AD';
      let rows = [s.text];
      if (ctx.measureText(s.text).width > 1300) {
        const ws = s.text.split(' '); let best = 1, bd = 1e9;
        for (let i = 1; i < ws.length; i++) { const d = Math.abs(ctx.measureText(ws.slice(0, i).join(' ')).width - ctx.measureText(ws.slice(i).join(' ')).width); if (d < bd) { bd = d; best = i; } }
        rows = [ws.slice(0, best).join(' '), ws.slice(best).join(' ')];
      }
      const w = Math.max(...rows.map(r => ctx.measureText(r).width)) + 70, h = 66 + (rows.length - 1) * 50, y0 = 1040 - h;
      ctx.globalAlpha = a * .92; ctx.fillStyle = '#fdfcf8'; ctx.shadowColor = 'rgba(30,30,40,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(960 - w / 2, y0, w, h, 14); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = a;
      ctx.fillStyle = INK.red; ctx.fillRect(960 - w / 2 + 22, y0 + h - 12, 36, 4);
      ctx.fillStyle = INK.black; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      rows.forEach((r, i) => ctx.fillText(r, 960, y0 + 35 + i * 50));
    },
  });

  // ───────── frame render with camera motion blur on fast moves
  const off = new OffscreenCanvas(1920, 1080), oc = off.getContext('2d');
  if (new URLSearchParams(location.search).has('nosubs')) board.overlays.length = 0;
  function render(ctx, tt) {
    const dt = 1 / 24, a = cam.at(tt), b = cam.at(Math.max(0, tt - dt));
    const sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 900;
    const N = sp > 14 ? Math.min(10, Math.ceil(sp * .5 / 4)) : 1;
    if (N === 1) { board.render(ctx, tt, cam); return; }
    const ov = board.overlays; board.overlays = [];
    for (let i = 0; i < N; i++) { board.render(oc, tt - dt * .5 * i / (N - 1), cam); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(off, 0, 0); }
    ctx.globalAlpha = 1; board.overlays = ov;
    for (const o of ov) { ctx.save(); o.draw(ctx, tt); ctx.restore(); }
  }

  // ───────── texts for readcheck: a board text must be read during the beat it is written in
  for (const x of TEXTS) { x.t0 = Math.min(...x.strokes.map(s => s.t0)); x.box = x.strokes.reduce((b, s) => [Math.min(b[0], s.box[0]), Math.min(b[1], s.box[1]), Math.max(b[2], s.box[2]), Math.max(b[3], s.box[3])], [1e9, 1e9, -1e9, -1e9]); }
  const textsAt = tt => {
    const bt = beatsT.find(b => tt >= b.t0 && tt < b.t1); if (!bt) return [];
    const c = cam.at(tt), out = [];
    for (const x of TEXTS) {
      if (x.region !== bt.region || tt < x.t0 || !isFinite(x.t0)) continue;
      const [x0, y0] = W.toScreen(c, x.box[0], x.box[1]), [x1, y1] = W.toScreen(c, x.box[2], x.box[3]);
      if (x1 < 0 || x0 > 1920 || y1 < 0 || y0 > 1080) continue;
      out.push({ id: x.id, text: x.text, x0, y0, x1, y1, pass: x.beat !== bt.beat || c.z < .3 });
    }
    return out;
  };

  const ev = tl.ev.slice();
  for (const e of ev) if (e.x != null) { const c = cam.at(e.t), [px, py] = W.toScreen(c, e.x, e.y); e.pan = +clamp((px - 960) / 1400, -.7, .7).toFixed(2); e.z = +c.z.toFixed(2); e.on = px > -100 && px < 2020 && py > -100 && py < 1180 ? 1 : 0; }
  ev.push({ t: 0, type: 'meta', bpm: BPM, beat: BEAT, regions: regionsT.map(x => +x.toFixed(3)), beats: beatsT.map(b => [+b.t0.toFixed(3), b.region, b.beat]), end: +END.toFixed(3) });
  for (const x of subs) ev.push({ t: x.t0, type: 'sub', t1: x.t1, text: x.text });
  ev.sort((a, b) => a.t - b.t);
  return { dur: END, render, ev, subs, textsAt, cam, regionsT, beatsT };
}
