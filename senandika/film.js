// SENANDIKA snack promo — 60 s seamless loop for a canteen TV. Everything is a function of t (0..60), frame 60 = frame 0.
// Look follows the poster: blue sky, clouds, a joglo roof, a parchment scroll, blue pills, teal price stars, wayang-brown ground.
const W = 1920, H = 1080, DUR = 60;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eo = t => 1 - Math.pow(1 - clamp(t), 3);
const ei = t => Math.pow(clamp(t), 3);
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t, s = 1.7) => { t = clamp(t) - 1; return 1 + t * t * ((s + 1) * t + s); };
const TAU = Math.PI * 2;
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const BLUE = '#1565c0', BLUE2 = '#1e88e5', NAVY = '#0b2a5b', TEAL = '#12a594', CREAM = '#f3dfb4';
const IMG = {};
async function load(name, src) { const im = new Image(); im.src = src; await im.decode(); IMG[name] = im; }

// ───────── timeline (s). Every scene start sits on the 120 BPM half-second grid.
const S = { intro: [0, 6.5], items: [[6.5, 18.5], [18.5, 30.5], [30.5, 42.5]], recap: [42.5, 49], order: [49, 58.5] };
const ITEMS = [
  { name: ['BROWNIES ICE', 'CREAM SANDWICH'], price: '18K', tag: 'Brownies + es krim', vars: ['Cookies n Cream', 'Strawberry'], img: 'brownies', side: -1 },
  { name: ['TANGYUAN'], price: '20K', tag: 'Bola ketan manis', vars: ['Chocolate', 'Oreo'], img: 'tangyuan', side: 1 },
  { name: ['DIMSUM', 'KUAH KEJU'], price: '17K', tag: 'Dimsum + kuah keju', vars: null, img: 'dimsum', side: -1 },
];
const EV = [];                 // sound cues for the mixer
const cue = (t, type, extra = {}) => EV.push({ t: +t.toFixed(3), type, ...extra });

// ───────── drawing primitives
function title(ctx, str, x, y, size, o = {}) {      // poster lettering: white, thick blue outline, soft glow
  ctx.save(); ctx.font = `${size}px ${o.font || 'PB'}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(30,110,220,.55)'; ctx.shadowBlur = size * .22;
  ctx.strokeStyle = o.stroke || BLUE; ctx.lineWidth = size * (o.sw ?? .16); ctx.strokeText(str, x, y);
  ctx.shadowBlur = 0; ctx.fillStyle = o.fill || '#fff'; ctx.fillText(str, x, y);
  ctx.restore();
}
function plain(ctx, str, x, y, size, color = NAVY, o = {}) {
  ctx.save(); ctx.font = `${size}px ${o.font || 'PS'}`; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic'; ctx.fillStyle = color; ctx.fillText(str, x, y); ctx.restore();
}
function pill(ctx, x, y, w, h, o = {}) {             // blue gradient pill (centre x,y)
  ctx.save();
  ctx.shadowColor = 'rgba(10,40,90,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, o.c1 || '#42a5f5'); g.addColorStop(1, o.c2 || '#0d47a1');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, o.r ?? h / 2); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 8, y - h / 2 + 5, w - 16, h * .38, o.r ?? h / 2); ctx.fill();
  ctx.restore();
}
function star(ctx, x, y, r, text, rot = 0, size) {   // teal starburst price badge
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,60,60,.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  ctx.fillStyle = TEAL; ctx.beginPath();
  const n = 16; for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * TAU, q = i % 2 ? r * .8 : r; ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r * .68, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = `${size || r * .62}px PB`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, r * .04);
  ctx.restore();
}
function photo(ctx, im, cx, cy, w, h, o = {}) {      // white-framed photo card, rotation, inner slow zoom
  const pad = o.pad ?? 16, rot = o.rot || 0, z = o.zoom || 1;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(o.s ?? 1, o.s ?? 1);
  ctx.shadowColor = 'rgba(10,40,90,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-w / 2 - pad, -h / 2 - pad, w + 2 * pad, h + 2 * pad, 26); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 14); ctx.clip();
  const ar = im.width / im.height, car = w / h; let dw, dh;
  if (ar > car) { dh = h * z; dw = dh * ar; } else { dw = w * z; dh = dw / ar; }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(im, -dw / 2 + (o.panX || 0) * w, -dh / 2 + (o.panY || 0) * h, dw, dh);
  ctx.restore();
}
function scroll(ctx, cx, cy, w, h, open) {           // parchment scroll that unrolls from the centre
  const ww = Math.max(40, w * open);
  ctx.save();
  ctx.shadowColor = 'rgba(70,40,10,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); g.addColorStop(0, '#e9cf9a'); g.addColorStop(.5, CREAM); g.addColorStop(1, '#d9b77a');
  ctx.fillStyle = g; ctx.fillRect(cx - ww / 2, cy - h / 2, ww, h);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(140,90,40,.12)'; for (let i = 0; i < 6; i++) ctx.fillRect(cx - ww / 2, cy - h / 2 + 12 + i * h / 6, ww, 3);
  for (const s of [-1, 1]) {                         // rolled ends
    const x = cx + s * ww / 2, rw = 46;
    const rg = ctx.createLinearGradient(x - rw / 2, 0, x + rw / 2, 0); rg.addColorStop(0, '#a87a3c'); rg.addColorStop(.45, '#f0d7a0'); rg.addColorStop(1, '#8a5d26');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.roundRect(x - rw / 2, cy - h / 2 - 34, rw, h + 68, 20); ctx.fill();
    ctx.fillStyle = '#6d4519'; ctx.beginPath(); ctx.ellipse(x, cy - h / 2 - 34, rw / 2, 8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, cy + h / 2 + 34, rw / 2, 8, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
  return ww;
}

// ───────── background (loops exactly every 60 s)
const R = mulberry(17);
const CLOUDS = Array.from({ length: 11 }, (_, i) => ({ x: R() * (W + 800), y: 60 + R() * 420, s: .6 + R() * .9, k: i < 6 ? 1 : 2, seed: i }));
function cloud(ctx, x, y, s, seed, a) {
  const r = mulberry(seed * 31 + 5), puffs = Array.from({ length: 7 }, (_, i) => [(i - 3) * 60 + (r() - .5) * 30, -Math.sin(i / 6 * Math.PI) * 55 + (r() - .5) * 20, 55 + r() * 45]);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(150,200,235,.45)'; ctx.beginPath(); for (const [px, py, pr] of puffs) { ctx.moveTo(px + pr, py + 14); ctx.arc(px, py + 14, pr, 0, TAU); } ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); for (const [px, py, pr] of puffs) { ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, TAU); } ctx.fill();
  ctx.restore();
}
function joglo(ctx, cx, base, s, a) {                // faint traditional roof silhouette, as in the poster
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, base); ctx.scale(s, s); ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(-90, -560); ctx.lineTo(90, -560); ctx.lineTo(260, -330); ctx.lineTo(-260, -330); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-260, -340); ctx.lineTo(260, -340); ctx.lineTo(560, -170); ctx.lineTo(-560, -170); ctx.fill();
  ctx.fillRect(-470, -175, 940, 22);
  for (let i = -4; i <= 4; i++) ctx.fillRect(i * 105 - 9, -160, 18, 160);
  ctx.globalAlpha = a * .8; for (let i = -9; i <= 9; i++) ctx.fillRect(i * 52 - 3, -168, 6, 18);
  ctx.restore();
}
function ground(ctx, t) {
  const sway = Math.sin(t / DUR * TAU * 4) * 4;
  ctx.fillStyle = '#9fd77a'; ctx.beginPath(); ctx.moveTo(0, 930);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 905 + Math.sin(x / 260) * 22); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillStyle = '#7cc35a'; ctx.beginPath(); ctx.moveTo(0, 980);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 965 + Math.sin(x / 190 + 2) * 18); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  const r = mulberry(3); ctx.fillStyle = '#7a4a1f';                      // wayang-brown bushes, like the poster's foreground
  ctx.beginPath(); for (let x = -40; x < W + 80; x += 70 + r() * 30) { const rr = 50 + r() * 34; ctx.moveTo(x + rr, 1060); ctx.arc(x + sway * (r() - .5), 1062 - r() * 20, rr, Math.PI, 0); }
  ctx.fillRect(0, 1040, W, 40); ctx.fill();
  ctx.fillStyle = '#5e3714'; ctx.beginPath(); for (let x = 0; x < W + 80; x += 90 + r() * 40) { const rr = 34 + r() * 22; ctx.moveTo(x + rr, 1080); ctx.arc(x, 1082, rr, Math.PI, 0); } ctx.fill();
}
function background(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2fa9ec'); g.addColorStop(.55, '#a9e0fa'); g.addColorStop(1, '#e8f7e0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const sun = ctx.createRadialGradient(1500, 120, 10, 1500, 120, 700); sun.addColorStop(0, 'rgba(255,255,230,.55)'); sun.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
  for (const c of CLOUDS.filter(c => c.k === 1)) { const x = ((c.x - t / DUR * (W + 800)) % (W + 800) + W + 800) % (W + 800) - 400; cloud(ctx, x, c.y, c.s * .8, c.seed, .75); }
  joglo(ctx, 960, 930, 1.25, .28);
  for (const c of CLOUDS.filter(c => c.k === 2)) { const x = ((c.x - 2 * t / DUR * (W + 800)) % (W + 800) + W + 800) % (W + 800) - 400; cloud(ctx, x, c.y + 120, c.s, c.seed, .92); }
  ground(ctx, t);
}

// ───────── persistent chrome during the menu (logos, mini QR, footer)
function logos(ctx, x, y, s, a) {
  if (a <= 0) return; const im = IMG.logos; ctx.save(); ctx.globalAlpha = a;
  const w = im.width * s, h = im.height * s; ctx.shadowColor = 'rgba(10,40,90,.25)'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x - 10, y - 8, w + 20, h + 16, (h + 16) / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.clip(); ctx.drawImage(im, x, y, w, h); ctx.restore();
}
function miniQR(ctx, a, t) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
  const x = 1690, y = 38, s = 190, bob = Math.sin(t * TAU / 4) * 3;
  ctx.shadowColor = 'rgba(10,40,90,.3)'; ctx.shadowBlur = 18; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x - 12, y - 12 + bob, s + 24, s + 70, 20); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false; ctx.drawImage(IMG.qr, x, y + bob, s, s); ctx.imageSmoothingEnabled = true;
  plain(ctx, 'Scan untuk order', x + s / 2, y + s + 40 + bob, 24, NAVY, { align: 'center', font: 'PX' });
  ctx.restore();
}
function footer(ctx, a) {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a;
  pill(ctx, 960, 1018, 1500, 72, { c1: '#1e88e5', c2: '#0b3d91' });
  plain(ctx, 'OTS & PICK UP HARI INI · RABU, 18 NOVEMBER 2026', 960 - 715, 1030, 30, '#fff', { font: 'PX' });
  plain(ctx, 'CP Julian N. · LINE julianjj24', 960 + 715, 1030, 28, '#d8ecff', { font: 'PS', align: 'right' });
  ctx.restore();
}

// ───────── scenes
function intro(ctx, t) {
  const out = ei(seg(t, 5.8, 6.5));                              // everything lifts away before the first item
  const dy = -out * 700;
  // logos pill drops in
  const lp = back(seg(t, .3, .9)); logos(ctx, 960 - IMG.logos.width * .9, 34 + (lp - 1) * 140 + dy, 1.8, seg(t, .3, .5) * (1 - out));
  // ISMKI PROJECT 2
  const a1 = eo(seg(t, .6, 1.1)); ctx.save(); ctx.globalAlpha = a1 * (1 - out); title(ctx, 'ISMKI PROJECT 2', 960, 205 + (1 - a1) * 30 + dy, 62, { sw: .14 }); ctx.restore();
  // SENANDIKA letter by letter
  const word = 'SENANDIKA'; ctx.save(); ctx.font = '210px PB'; const tw = ctx.measureText(word).width; ctx.restore();
  let x = 960 - tw / 2;
  for (let i = 0; i < word.length; i++) {
    ctx.save(); ctx.font = '210px PB'; const cw = ctx.measureText(word[i]).width; ctx.restore();
    const p = back(seg(t, .95 + i * .07, 1.35 + i * .07), 2.2);
    if (p > 0) { ctx.save(); ctx.translate(x + cw / 2, 400 + dy); ctx.scale(p, p); ctx.globalAlpha = (1 - out); title(ctx, word[i], 0, 0, 210, { sw: .13 }); ctx.restore(); }
    x += cw;
  }
  // tagline pill
  const tp = eo(seg(t, 1.9, 2.4)); if (tp > 0) { ctx.save(); ctx.globalAlpha = 1 - out; pill(ctx, 960, 470 + dy, 820 * tp, 58); if (tp > .9) plain(ctx, 'Strengthening Unity, Empowering Aspirations', 960, 481 + dy, 27, '#fff', { align: 'center', font: 'PX' }); ctx.restore(); }
  // scroll: TERSEDIA HARI INI
  const op = eio(seg(t, 2.6, 3.4));
  if (op > 0) {
    ctx.save(); ctx.globalAlpha = 1 - out; const cy = 690 + dy;
    const ww = scroll(ctx, 960, cy, 1120, 230, op);
    ctx.beginPath(); ctx.rect(960 - ww / 2 + 20, cy - 130, ww - 40, 260); ctx.clip();
    const pulse = 1 + Math.sin(Math.max(0, t - 3.6) * TAU / 1.0) * .025 * seg(t, 3.5, 3.8);
    ctx.save(); ctx.translate(960, cy - 8); ctx.scale(pulse, pulse); title(ctx, 'TERSEDIA HARI INI!', 0, 0, 96, { sw: .12, stroke: '#6d4519' }); ctx.restore();
    plain(ctx, 'OTS & PICK UP · RABU, 18 NOVEMBER 2026', 960, cy + 70, 40, '#5a3610', { align: 'center', font: 'PX' });
    ctx.restore();
  }
}
function itemScene(ctx, it, u, idx) {
  const L = 12, side = it.side, enter = back(seg(u, 0, .8), 1.4), exit = ei(seg(u, L - .75, L - .1));
  const px = side < 0 ? 560 : 1360, tx = side < 0 ? 990 : 140;               // photo centre x; text column left x
  const im = IMG[it.img], ar = im.width / im.height, ph = 470, pw = Math.min(720, ph * ar);
  const cardX = px + side * (1 - enter) * -1100 + side * exit * -1300;
  photo(ctx, im, cardX, 470, pw, ph, { rot: side * -.045 + Math.sin(u * .6) * .006, zoom: 1.02 + u / L * .1, panX: side * (u / L - .5) * .03 });
  star(ctx, px + side * -(pw / 2) + side * 10 + side * exit * -1300 + side * (1 - enter) * -1100, 470 - ph / 2 - 10, 105 * back(seg(u, 1.0, 1.5), 2.4), it.price, -.15 + Math.sin(u * 2) * .04, 72);
  // text column
  const ta = eo(seg(u, .35, .9)) * (1 - exit), off = (1 - eo(seg(u, .35, .9))) * 80 * -side + exit * 200 * -side;
  ctx.save(); ctx.globalAlpha = ta;
  const colW = 760, cx = tx + colW / 2 + off;
  pill(ctx, cx, 230, 300, 54, { c1: '#26c6b4', c2: '#0b7c70' }); plain(ctx, `MENU ${idx + 1} / 3`, cx, 241, 28, '#fff', { align: 'center', font: 'PX' });
  const big = it.name.length > 1 ? 100 : 140;
  const fit = ln => { ctx.save(); ctx.font = `${big}px PB`; const w = ctx.measureText(ln).width; ctx.restore(); return Math.min(big, big * 760 / w); };
  it.name.forEach((ln, i) => title(ctx, ln, cx, 395 + i * (big * 1.02) + (it.name.length > 1 ? 0 : 20), fit(ln), { sw: .13 }));
  plain(ctx, it.tag, cx, 395 + it.name.length * big * 1.02 + 20, 40, NAVY, { align: 'center', font: 'PX' });
  ctx.restore();
  if (it.vars) {
    const vy = 395 + it.name.length * big * 1.02 + 120;
    ctx.save(); ctx.globalAlpha = (1 - exit) * eo(seg(u, 1.8, 2.1)); plain(ctx, 'Pilihan rasa:', cx, vy - 10, 32, NAVY, { align: 'center', font: 'PS' }); ctx.restore();
    it.vars.forEach((v, i) => {
      const p = back(seg(u, 2.2 + i * .45, 2.7 + i * .45), 2); if (p <= 0) return;
      const vx = cx + (i - (it.vars.length - 1) / 2) * 380;
      ctx.save(); ctx.globalAlpha = 1 - exit; ctx.translate(vx, vy + 60 + exit * 300); ctx.scale(p, p); pill(ctx, 0, 0, 350, 86); plain(ctx, v, 0, 13, 36, '#fff', { align: 'center', font: 'PX' }); ctx.restore();
    });
  } else {
    const p = back(seg(u, 2.2, 2.7), 2), vy = 395 + it.name.length * big * 1.02 + 180;
    if (p > 0) { ctx.save(); ctx.globalAlpha = 1 - exit; ctx.translate(cx, vy + exit * 300); ctx.scale(p, p); pill(ctx, 0, 0, 520, 86); plain(ctx, 'Gurih, berkuah keju', 0, 13, 36, '#fff', { align: 'center', font: 'PX' }); ctx.restore(); }
  }
}
function recap(ctx, u) {
  const L = S.recap[1] - S.recap[0], exit = ei(seg(u, L - .6, L - .05));
  const tp = back(seg(u, 0, .5), 1.8);
  ctx.save(); ctx.globalAlpha = 1 - exit; ctx.translate(960, 175 - exit * 300); ctx.scale(tp, tp); title(ctx, 'PILIH FAVORITMU!', 0, 0, 104, { sw: .13 }); ctx.restore();
  ITEMS.forEach((it, i) => {
    const p = back(seg(u, .4 + i * .25, 1.0 + i * .25), 1.6); if (p <= 0) return;
    const cx = 380 + i * 580, cy = 520 + exit * 900 * (i % 2 ? 1.1 : 1);
    const im = IMG[it.img], h = 300, w = Math.min(470, h * im.width / im.height);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(p, p); ctx.translate(-cx, -cy);
    photo(ctx, im, cx, cy, w, h, { rot: (i - 1) * .04, zoom: 1.04 + Math.sin(u * .8 + i) * .02, pad: 12 });
    ctx.restore();
    const a = eo(seg(u, .9 + i * .25, 1.3 + i * .25)) * (1 - exit);
    ctx.save(); ctx.globalAlpha = a; const nm = it.name.join(' ');
    const ny = 750 + exit * 300;
    ctx.font = '44px PB'; const fits = ctx.measureText(nm).width < 540;
    if (fits) title(ctx, nm, cx, ny, 44, { sw: .16 }); else { title(ctx, it.name[0], cx, ny, 40, { sw: .16 }); title(ctx, it.name[1], cx, ny + 46, 40, { sw: .16 }); }
    ctx.restore();
    star(ctx, cx + w / 2 - 10, cy - h / 2 + 4, 78 * back(seg(u, 1.2 + i * .25, 1.6 + i * .25), 2.4) * (1 - exit), it.price, .12, 52);
  });
}
function order(ctx, u, t) {
  const L = S.order[1] - S.order[0], exit = ei(seg(u, L - .7, L - .05));
  const qp = back(seg(u, 0, .7), 1.4), qs = 520;
  const qx = 520, qy = 520 + exit * 900;
  ctx.save(); ctx.translate(qx, qy); ctx.scale(qp, qp);
  ctx.shadowColor = 'rgba(10,40,90,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-qs / 2 - 30, -qs / 2 - 30, qs + 60, qs + 60, 34); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.imageSmoothingEnabled = false; ctx.drawImage(IMG.qr, -qs / 2, -qs / 2, qs, qs); ctx.imageSmoothingEnabled = true;
  ctx.restore();
  // scanning line hint
  if (u > 1 && exit === 0) { const sy = qy - qs / 2 + ((u - 1) % 2.5) / 2.5 * qs; ctx.save(); ctx.globalAlpha = .35; const g = ctx.createLinearGradient(0, sy - 30, 0, sy + 4); g.addColorStop(0, 'rgba(18,165,148,0)'); g.addColorStop(1, 'rgba(18,165,148,.9)'); ctx.fillStyle = g; ctx.fillRect(qx - qs / 2, sy - 30, qs, 34); ctx.restore(); }
  const a = k => eo(seg(u, .5 + k * .2, .9 + k * .2)) * (1 - exit), off = k => (1 - eo(seg(u, .5 + k * .2, .9 + k * .2))) * 60 + exit * 400;
  const x0 = 900;
  ctx.save(); ctx.globalAlpha = a(0); title(ctx, 'ORDER DI SINI!', x0, 250 + off(0), 112, { align: 'left', sw: .13 }); ctx.restore();
  ctx.save(); ctx.globalAlpha = a(1); plain(ctx, 'Scan QR atau buka:', x0 + 6, 340 + off(1), 38, NAVY, { font: 'PS' }); ctx.restore();
  ctx.save(); ctx.globalAlpha = a(2); pill(ctx, x0 + 420, 410 + off(2), 840, 84, { r: 20 }); plain(ctx, 'bit.ly/PreOrderSENANDISNACK1', x0 + 420, 424 + off(2), 42, '#fff', { align: 'center', font: 'PX' }); ctx.restore();
  ctx.save(); ctx.globalAlpha = a(3);
  plain(ctx, 'Contact Person', x0 + 6, 545 + off(3), 36, '#0b7c70', { font: 'PX' });
  plain(ctx, 'Julian N.', x0 + 6, 615 + off(3), 58, NAVY, { font: 'PB' });
  plain(ctx, 'ID LINE: julianjj24', x0 + 6, 680 + off(3), 44, NAVY, { font: 'PX' });
  plain(ctx, '08111621155', x0 + 6, 742 + off(3), 44, NAVY, { font: 'PX' });
  ctx.restore();
  const sp = back(seg(u, 1.6, 2.1), 1.8) * (1 - exit);
  if (sp > 0) { ctx.save(); ctx.translate(x0 + 420, 860 + exit * 300); ctx.scale(sp, sp); pill(ctx, 0, 0, 860, 92, { c1: '#26c6b4', c2: '#0b7c70' });
    plain(ctx, 'Beli langsung (OTS) hari ini · 18 Nov', 0, 14, 40, '#fff', { align: 'center', font: 'PX' }); ctx.restore(); }
}

// ───────── frame
function render(ctx, t) {
  t = ((t % DUR) + DUR) % DUR;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  background(ctx, t);
  if (t < S.intro[1]) intro(ctx, t);
  S.items.forEach(([a, b], i) => { if (t >= a && t < b) itemScene(ctx, ITEMS[i], t - a, i); });
  if (t >= S.recap[0] && t < S.recap[1]) recap(ctx, t - S.recap[0]);
  if (t >= S.order[0] && t < S.order[1]) order(ctx, t - S.order[0], t);
  const chrome = seg(t, 6.6, 7.2) * (1 - seg(t, 48.4, 49));
  logos(ctx, 40, 40, 1.25, chrome);
  miniQR(ctx, chrome, t);
  footer(ctx, chrome);
}

// ───────── sound cues (same numbers as the picture)
cue(.3, 'pop', { v: .6 }); cue(.6, 'swish', { v: .4 });
for (let i = 0; i < 9; i++) cue(.95 + i * .07, 'tick', { v: .5 });
cue(1.9, 'swish', { v: .5 }); cue(2.6, 'unroll'); cue(3.4, 'stamp', { v: .7 }); cue(5.8, 'whoosh', { v: .7 });
S.items.forEach(([a], i) => {
  cue(a, 'whoosh', { v: .8 }); cue(a + 1.0, 'stamp', { v: 1 }); cue(a + 1.0, 'ding');
  const n = ITEMS[i].vars ? ITEMS[i].vars.length : 1; for (let k = 0; k < n; k++) cue(a + 2.2 + k * .45, 'pop', { v: .8 });
  cue(a + 12 - .75, 'whoosh', { v: .6 });
});
cue(S.recap[0], 'pop', { v: .8 }); for (let i = 0; i < 3; i++) { cue(S.recap[0] + .4 + i * .25, 'pop', { v: .7 }); cue(S.recap[0] + 1.2 + i * .25, 'tick', { v: .7 }); }
cue(S.recap[1] - .6, 'whoosh', { v: .6 });
cue(S.order[0], 'stamp', { v: .9 }); cue(S.order[0] + .5, 'swish', { v: .4 }); cue(S.order[0] + 1.6, 'ding');
cue(S.order[1] - .7, 'whoosh', { v: .7 });

await Promise.all([
  load('brownies', 'assets/brownies.png'), load('tangyuan', 'assets/tangyuan.png'), load('dimsum', 'assets/dimsum.png'),
  load('logos', 'assets/logos.png'), load('qr', 'assets/qr_clean.png'),
  document.fonts.load('100px PB'), document.fonts.load('100px PX'), document.fonts.load('100px PS'),
]);
const ctx = document.getElementById('c').getContext('2d');
window.DUR = DUR; window.EV = EV.sort((a, b) => a.t - b.t);
window.render = t => render(ctx, t);
window.TEXTS = () => [];
window.READY = true;
