// Rendert de 3D-Meester-stickers: uitgeknipte 3D-renders (src/meester-3d/*.webp)
// met witte stickerrand, tekstbanner en merkkleur-extra's.
// Gebruik: node render3d.js [uitvoermap]
// Uitvoer: png/ (512), png-1024/ (voor drukwerk)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const A = require('./art.js');
const { M } = require('./stickers.js');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const SRC = path.join(__dirname, 'meester-3d');
const fontB64 = fs.readFileSync(path.join(__dirname, 'fonts/saira-latin.woff2')).toString('base64');
const FONT_CSS = `@font-face{font-family:'Saira';src:url(data:font/woff2;base64,${fontB64}) format('woff2');font-weight:800;font-style:normal;}`;
const DIE = `<filter id="die" filterUnits="userSpaceOnUse" x="0" y="0" width="512" height="512" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d0"/>
  <feGaussianBlur in="d0" stdDeviation="6" result="b"/>
  <feComponentTransfer in="b" result="o"><feFuncA type="linear" slope="30" intercept="-2.4"/></feComponentTransfer>
  <feFlood flood-color="#ffffff"/><feComposite in2="o" operator="in" result="white"/>
  <feGaussianBlur in="o" stdDeviation="4" result="sb"/><feOffset in="sb" dy="5" result="so"/>
  <feFlood flood-color="#2A221C" flood-opacity=".32"/><feComposite in2="so" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="shadow"/><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

// Extra's die bij het uitknippen verloren gingen, opnieuw in merkkleuren
const EXTRA = {
  'meester-denkt': { dx: -40, front: A.cloudBubble(404, 100) },
  'meester-opgeleverd': { behind: A.confetti(9) },
};

const BOX = { none: [40, 34, 472, 478], one: [52, 28, 460, 400], two: [64, 26, 448, 372] };

(async () => {
  const browser = await chromium.launch();
  const meas = await browser.newPage();
  const lines = [...new Set(M.filter((s) => s.cap).flatMap((s) => s.cap.split('\n')))];
  await meas.setContent(`<html><head><style>${FONT_CSS}</style></head><body><svg width="900" height="100">${lines.map((c, i) => `<text id="t${i}" x="0" y="60" font-family="Saira" font-weight="800" font-size="54">${c.replace(/&/g, '&amp;')}</text>`).join('')}</svg></body></html>`);
  await meas.evaluate(() => document.fonts.ready);
  const widths = await meas.evaluate((n) => [...Array(n)].map((_, i) => document.getElementById('t' + i).getComputedTextLength()), lines.length);
  const W = Object.fromEntries(lines.map((c, i) => [c, widths[i]]));

  const capSvg = (s, cy) => {
    const ls = s.cap.split('\n'), two = ls.length > 1;
    const base = two ? 50 : 54, maxTW = two ? 320 : 352;
    const longest = Math.max(...ls.map((l) => W[l]));
    const fsz = longest * (base / 54) > maxTW ? Math.floor((54 * maxTW) / longest) : base;
    return A.caption(s.cap, { color: s.capColor, tws: ls.map((l) => (W[l] * fsz) / 54), fs: fsz, cy, seed: s.id.length * 7 + 3 });
  };

  const pages = {
    1: await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 }),
    2: await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 }),
  };
  for (const d of ['png', 'png-1024']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

  for (const s of M) {
    const file = path.join(SRC, `${s.id}.webp`);
    if (!fs.existsSync(file)) { console.log('ontbreekt:', s.id); continue; }
    const dim = await pages[1].evaluate(async (src) => { const i = new Image(); i.src = src; await i.decode(); return [i.naturalWidth, i.naturalHeight]; }, `data:image/webp;base64,${fs.readFileSync(file).toString('base64')}`);
    const kind = !s.cap ? 'none' : s.cap.includes('\n') ? 'two' : 'one';
    const [x0, y0, x1, y1] = BOX[kind];
    const ex = EXTRA[s.id] || {};
    const sc = Math.min((x1 - x0) / dim[0], (y1 - y0) / dim[1]);
    const w = dim[0] * sc, h = dim[1] * sc;
    const x = (x0 + x1) / 2 - w / 2 + (ex.dx || 0), y = y1 - h;
    const img = `<image href="data:image/webp;base64,${fs.readFileSync(file).toString('base64')}" x="${A.f(x)}" y="${A.f(y)}" width="${A.f(w)}" height="${A.f(h)}" preserveAspectRatio="none"/>`;
    const cap = s.cap ? capSvg(s, kind === 'two' ? 410 : 424) : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs>${DIE}</defs><g filter="url(#die)">${ex.behind || ''}${img}${ex.front || ''}${cap}</g></svg>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS} html,body{margin:0;background:transparent}</style></head><body>${svg}</body></html>`;
    for (const [scale, dir] of [[1, 'png'], [2, 'png-1024']]) {
      await pages[scale].setContent(html);
      await pages[scale].evaluate(() => document.fonts.ready);
      await pages[scale].waitForFunction(() => [...document.images].every((i) => i.complete) || true);
      await pages[scale].screenshot({ path: path.join(OUT, dir, `${s.id}.png`), omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 512 } });
    }
  }
  await browser.close();
  console.log('klaar: 3D-Meester ->', OUT);
})();
