const mod = await import('./film.js');
await document.fonts.load('42px AD');
const F = await mod.build();
const ctx = document.getElementById('c').getContext('2d');
window.DUR = F.dur; window.EV = F.ev; window.SUBS = F.subs;
window.TEXTS = F.textsAt;
const fast = new URLSearchParams(location.search).has('textsonly');   // readcheck: text boxes only, no drawing
window.render = fast ? () => {} : t => F.render(ctx, t);
window.READY = true;
