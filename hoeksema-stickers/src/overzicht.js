// Maakt overzicht.png van alle stickers in png/ (3D-Meester + gereedschap).
// Gebruik: node overzicht.js [map]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { M, T } = require('./stickers.js');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const fontB64 = fs.readFileSync(path.join(__dirname, 'fonts/saira-latin.woff2')).toString('base64');
const cell = (s) => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(OUT, 'png', `${s.id}.png`)).toString('base64')}"><figcaption>${s.emoji} ${s.name}</figcaption></figure>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:'Saira';src:url(data:font/woff2;base64,${fontB64}) format('woff2');font-weight:800;}
  body{margin:0;background:#EDE6DC;font-family:Saira,Arial,sans-serif;font-weight:800;color:#2D2E32;padding:40px 48px;width:1504px}
  h1{font-size:44px;margin:0 0 6px} h2{font-size:26px;margin:34px 0 10px;color:#636466}
  .g{display:grid;grid-template-columns:repeat(6,1fr);gap:8px 14px}
  figure{margin:0;text-align:center} img{width:230px;height:230px;display:block;margin:0 auto}
  figcaption{font-size:17px;margin-top:-6px;color:#636466}
  .bar{display:flex;gap:6px;margin:8px 0 0}.bar i{display:block;width:60px;height:10px}
</style></head><body>
  <h1>Hoeksema Schilderwerken — stickers</h1>
  <div class="bar"><i style="background:#008CDC"></i><i style="background:#F0B400"></i><i style="background:#8CB400"></i><i style="background:#DC0014"></i></div>
  <h2>Pakket 1 — De Meester (${M.length})</h2><div class="g">${M.map(cell).join('')}</div>
  <h2>Pakket 2 — Het Gereedschap (${T.length})</h2><div class="g">${T.map(cell).join('')}</div>
</body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 800 } });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(OUT, 'overzicht.png'), fullPage: true });
  await b.close();
  console.log('overzicht.png klaar');
})();
