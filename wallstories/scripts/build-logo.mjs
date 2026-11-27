// Bouwt het Wallstories Kids-logo als pure vector-SVG (tekst omgezet naar paden).
// Gebruik: node scripts/build-logo.mjs  → schrijft naar src/assets/brand en public/
import opentype from 'opentype.js';
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const C = {
  ink: '#18403A', sand: '#E9D6B8', mint: '#A8C5B3', hill: '#8DB394',
  blue: '#9DC4E0', sun: '#F0B44D', coral: '#F08A76', cloud: '#F7F4EF',
};
const load = (p) => { const b = readFileSync(p); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const baloo = load('node_modules/@fontsource/baloo-2/files/baloo-2-latin-700-normal.woff');
const quick = load('node_modules/@fontsource/quicksand/files/quicksand-latin-600-normal.woff');

// Eigen serializer: opentype.js plakt '-0' soms aan het vorige getal vast (bug), dus altijd met spaties.
const n = (v) => { const r = Math.round(v * 100) / 100; return Object.is(r, -0) ? '0' : String(r); };
function toD(cmds) {
  return cmds.map((c) => {
    if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
    if (c.type === 'Q') return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    if (c.type === 'C') return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    return 'Z';
  }).join('');
}

function textPath(font, text, x, y, size, tracking = 0) {
  const opts = { kerning: true, letterSpacing: tracking / size };
  const d = toD(font.getPath(text, x, y, size, opts).commands);
  if (/NaN|Infinity/.test(d)) throw new Error(`Ongeldige paddata voor "${text}"`);
  return { d, width: font.getAdvanceWidth(text, size, opts) - tracking };
}

// --- Embleem: boogvenster met zon, ster en heuvels (viewBox 100×130) ---
const star = (cx, cy, R, r) => {
  let p = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5; const rad = i % 2 ? r : R;
    p += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }
  return p + 'Z';
};
const arch = 'M8,124V52A42,42 0 0 1 92,52V124Z';
const front = 'M24,124C38,112 54,104 66,100C74,97.5 79,100 83,105.5C87,110.5 91,112 92,112';
const emblem = (id) => `
  <defs><clipPath id="${id}"><path d="${arch}"/></clipPath></defs>
  <g clip-path="url(#${id})">
    <rect x="0" y="0" width="100" height="130" fill="#FFFDF9"/>
    <circle cx="33" cy="66" r="12.5" fill="${C.sun}"/>
    <path d="${star(67, 35, 7.6, 3.4)}" fill="${C.coral}" stroke="${C.coral}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M38,124C47,98 60,83 75,80.5C84,79 90,81 94,83V124Z" fill="${C.blue}"/>
    <path d="M2,99C15,89 33,87.5 47,95C56,100 62,109 64,124H2Z" fill="${C.hill}"/>
    <path d="${front}V124H24Z" fill="${C.blue}"/>
    <path d="${front}" fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>
  </g>
  <path d="${arch}" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`;

// --- "kids": handgeschreven monolijn, elke letter een eigen kleur (eenheden: x-hoogte 36, stok 66) ---
const kids = (sw = 8.5) => `
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${sw}">
    <path stroke="${C.sun}" d="M9,4V70M9,52C17,42 29,31 35,35.5C40,39.5 33,47.5 15,52C24,54 31,63.5 37,68.5C41,71.5 46,70 50,66"/>
    <path stroke="${C.coral}" d="M58,38V61C58,67 61,70 66,70"/>
    <circle cx="58" cy="19" r="5.6" fill="${C.coral}" stroke="none"/>
    <path stroke="${C.mint}" d="M109,47C105,39 98,36.5 92,37C82,38 76,46 76,55C76,64 82,70 90,70C98,70 105,64 108,55M109,4V61C109,67 112,70 117,70"/>
    <path stroke="${C.blue}" d="M153,41C148,35.5 137,35 134,41.5C131,48 138,51 145,53.5C153,56.5 155,62 151,66.5C146,72 134,71.5 128,65.5"/>
  </g>`;
const KIDS_W = 160; // breedte van de kids-groep in eigen eenheden

const sparks = (x, y, s, flip) => {
  const k = flip ? -1 : 1;
  const ln = (dx1, dy1, dx2, dy2, c) => `<path d="M${x + k * dx1 * s},${y + dy1 * s}L${x + k * dx2 * s},${y + dy2 * s}" stroke="${c}"/>`;
  return `<g stroke-width="${3 * s}" stroke-linecap="round">${ln(0, -12, 8, -8, C.blue)}${ln(-2, 0, 9, 0, C.hill)}${ln(0, 12, 8, 8, C.sun)}</g>`;
};

// ---------- Horizontale lockup (header) ----------
function horizontal({ tagline = true } = {}) {
  const ws = textPath(baloo, 'wallstories', 0, 0, 64);
  const H = tagline ? 114 : 98;
  const eH = H - 8; const eW = (eH / 130) * 100;
  const tx = eW + 18;
  const wsY = 50; // basislijn wallstories
  const kScale = 0.5; const kW = KIDS_W * kScale;
  const kx = tx + ws.width / 2 - kW / 2; const ky = wsY + 5;
  let tag = '';
  if (tagline) {
    const label = 'VERHALEN VOOR KLEINE DROMERS';
    const t0 = textPath(quick, label, 0, 0, 8.6, 0);
    const tracking = (ws.width - 4 - t0.width) / (label.length - 1); // vult exact de breedte van het woordmerk
    const t = textPath(quick, label, 0, 0, 8.6, tracking);
    tag = `<path transform="translate(${tx + 2},${H - 3})" d="${t.d}" fill="${C.ink}"/>`;
  }
  const W = Math.ceil(tx + ws.width + 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wallstories Kids – verhalen voor kleine dromers">
  <g transform="translate(2,4) scale(${(eH / 130).toFixed(4)})">${emblem('wsh')}</g>
  <path transform="translate(${tx},${wsY})" d="${ws.d}" fill="${C.ink}"/>
  <g transform="translate(${kx.toFixed(2)},${ky}) scale(${kScale})">${kids()}</g>
  ${sparks(kx - 12, ky + 24, 0.9, true)}${sparks(kx + kW + 12, ky + 24, 0.9, false)}
  ${tag}
</svg>`;
}

// ---------- Gestapelde lockup (footer, social, merkpagina) ----------
function stacked() {
  const ws = textPath(baloo, 'wallstories', 0, 0, 120);
  const W = Math.ceil(ws.width + 40);
  const eW = 150; const eH = 195;
  const kScale = 0.95; const kW = KIDS_W * kScale;
  const t = textPath(quick, 'VERHALEN VOOR KLEINE DROMERS', 0, 0, 17, 5.2);
  const H = eH + 40 + 95 + 75 + 46;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wallstories Kids – verhalen voor kleine dromers">
  <g transform="translate(${(W - eW) / 2},4) scale(1.5)">${emblem('wss')}</g>
  <path transform="translate(20,${eH + 115})" d="${ws.d}" fill="${C.ink}"/>
  <g transform="translate(${(W - kW) / 2},${eH + 132}) scale(${kScale})">${kids()}</g>
  ${sparks((W - kW) / 2 - 26, eH + 172, 1.6, true)}${sparks((W + kW) / 2 + 26, eH + 172, 1.6, false)}
  <path transform="translate(${(W - t.width) / 2},${H - 8})" d="${t.d}" fill="${C.ink}"/>
</svg>`;
}

// ---------- Embleem los (favicon, app-icoon) ----------
const emblemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -2 112 134" role="img" aria-label="Wallstories Kids">${emblem('wse')}</svg>`;
const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${C.cloud}"/><g transform="translate(153,92) scale(2.06)">${emblem('wsa')}</g></svg>`;

const out = {
  'src/assets/brand/logo-horizontaal.svg': horizontal(),
  'src/assets/brand/logo-horizontaal-compact.svg': horizontal({ tagline: false }),
  'src/assets/brand/logo-gestapeld.svg': stacked(),
  'src/assets/brand/embleem.svg': emblemSvg,
  'public/favicon.svg': emblemSvg,
};
for (const [f, s] of Object.entries(out)) writeFileSync(f, s.replace(/\n\s*\n/g, '\n'));
await sharp(Buffer.from(appIcon)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(appIcon)).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(Buffer.from(appIcon)).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(Buffer.from(emblemSvg)).resize(48, 48).png().toFile('public/favicon-48.png');
console.log('logo gebouwd');
