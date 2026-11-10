// Rendert alle stickers naar SVG + PNG (512x512, transparant) en maakt een overzichtsvel.
// Gebruik: node render.js [uitvoermap]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const A = require('./art.js');
const { M, T } = require('./stickers.js');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
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

function wrap(inner, withFont) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${withFont ? `<style>${FONT_CSS}</style>` : ''}<defs>${DIE}</defs><g filter="url(#die)">${inner}</g></svg>`;
}

const page0 = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS} html,body{margin:0;background:transparent}</style></head><body>${body}</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });

  // 1. tekstbreedtes meten
  const caps = [...new Set([...M, ...T].filter((s) => s.cap).flatMap((s) => s.cap.split('\n')))];
  await page.setContent(page0(`<svg width="800" height="100">${caps.map((c, i) => `<text id="t${i}" x="0" y="60" font-family="Saira" font-weight="800" font-size="54">${c.replace(/&/g, '&amp;')}</text>`).join('')}</svg>`));
  await page.evaluate(() => document.fonts.ready);
  const widths = await page.evaluate((n) => [...Array(n)].map((_, i) => document.getElementById('t' + i).getComputedTextLength()), caps.length);
  const W = Object.fromEntries(caps.map((c, i) => [c, widths[i]]));

  const capSvg = (s, cy) => {
    const lines = s.cap.split('\n');
    const two = lines.length > 1;
    const base = two ? 50 : 54, maxTW = two ? 320 : 352;
    const longest = Math.max(...lines.map((l) => W[l]));
    const fsz = longest * (base / 54) > maxTW ? Math.floor((54 * maxTW) / longest) : base;
    const tws = lines.map((l) => (W[l] * fsz) / 54);
    return A.caption(s.cap, { color: s.capColor, tws, fs: fsz, cy, seed: s.id.length * 7 + 3 });
  };
  const twoLine = (s) => s.cap && s.cap.includes('\n');

  const all = [];
  for (const s of M) {
    const dx = s.dx || 0, tilt = s.tilt || 0;
    const body = A.meester(s.o);
    const inner = !s.cap
      ? `<g transform="translate(${256 + dx} 266) rotate(${tilt}) scale(0.92) translate(-256 -284)">${body}</g>`
      : twoLine(s)
        ? `<g transform="translate(${256 + dx} 196) rotate(${tilt}) scale(0.72) translate(-256 -284)">${body}</g>${capSvg(s, 410)}`
        : `<g transform="translate(${256 + dx} 212) rotate(${tilt}) scale(0.78) translate(-256 -284)">${body}</g>${capSvg(s, 424)}`;
    all.push({ ...s, pack: 'meester', inner });
  }
  for (const s of T) {
    const body = s.draw();
    const inner = !s.cap
      ? `<g transform="translate(256 256) scale(0.92) translate(-256 -256)">${body}</g>`
      : twoLine(s)
        ? `<g transform="translate(256 192) scale(0.70) translate(-256 -256)">${body}</g>${capSvg(s, 412)}`
        : `<g transform="translate(256 204) scale(0.76) translate(-256 -256)">${body}</g>${capSvg(s, 428)}`;
    all.push({ ...s, pack: 'gereedschap', inner });
  }

  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  fs.mkdirSync(path.join(OUT, 'png'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'svg'), { recursive: true });
  for (const s of all) {
    if (only && !only.some((o) => s.id.includes(o))) continue;
    await page.setContent(page0(wrap(s.inner, false)));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, 'png', `${s.id}.png`), omitBackground: true, clip: { x: 0, y: 0, width: 512, height: 512 } });
    fs.writeFileSync(path.join(OUT, 'svg', `${s.id}.svg`), wrap(s.inner, true));
  }

  // 2. lijst voor de volgende stappen
  fs.writeFileSync(path.join(OUT, 'stickers.json'), JSON.stringify(all.map(({ id, name, emoji, cap, pack }) => ({ id, name, emoji, caption: cap || null, pack })), null, 2));

  // 3. overzichtsvel
  const cell = (s) => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(OUT, 'png', `${s.id}.png`)).toString('base64')}"><figcaption>${s.emoji} ${s.name}</figcaption></figure>`;
  const sheet = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}
    body{margin:0;background:#EDE6DC;font-family:Saira,Arial,sans-serif;color:#2D2E32;padding:40px 48px;width:1504px}
    h1{font-size:44px;margin:0 0 6px;letter-spacing:.02em} h2{font-size:26px;margin:34px 0 10px;color:#636466}
    .g{display:grid;grid-template-columns:repeat(6,1fr);gap:8px 14px}
    figure{margin:0;text-align:center} img{width:230px;height:230px;display:block;margin:0 auto}
    figcaption{font-size:17px;margin-top:-6px;color:#636466}
    .bar{display:flex;gap:6px;margin:8px 0 0}.bar i{display:block;width:60px;height:10px}
  </style></head><body>
  <h1>Hoeksema Schilderwerken — stickers</h1>
  <div class="bar"><i style="background:#008CDC"></i><i style="background:#F0B400"></i><i style="background:#8CB400"></i><i style="background:#DC0014"></i></div>
  <h2>Pakket 1 — De Meester (${M.length})</h2><div class="g">${all.filter((s) => s.pack === 'meester').map(cell).join('')}</div>
  <h2>Pakket 2 — Het Gereedschap (${T.length})</h2><div class="g">${all.filter((s) => s.pack === 'gereedschap').map(cell).join('')}</div>
  </body></html>`;
  const sp = await browser.newPage({ viewport: { width: 1600, height: 800 }, deviceScaleFactor: 1 });
  await sp.setContent(sheet);
  await sp.evaluate(() => document.fonts.ready);
  await sp.screenshot({ path: path.join(OUT, 'overzicht.png'), fullPage: true });
  await browser.close();
  console.log(`klaar: ${all.length} stickers -> ${OUT}`);
})();
