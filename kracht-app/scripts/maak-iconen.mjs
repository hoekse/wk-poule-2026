// Maakt de app-iconen (PNG): een halter van opzij, met schijven in wedstrijdkleuren.
// Geen externe pakketten nodig. Gebruik: npm run iconen
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const uit = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(uit, { recursive: true });

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ACHTERGROND = hex('#15171B');
const STANG = hex('#C9CDD3');
const BLAUW = hex('#2F6FE0'); // 20 kg-schijf
const GEEL = hex('#F2B705'); // 15 kg-schijf
const GROEN = hex('#3FA34D'); // 10 kg-schijf

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const rij = size * 3 + 1;
  const raw = Buffer.alloc(rij * size);
  const S = 4; // supersampling voor zachte randen
  for (let y = 0; y < size; y++) {
    raw[y * rij] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const [pr, pg, pb] = pixel((x + (sx + 0.5) / S) / size, (y + (sy + 0.5) / S) / size);
        r += pr; g += pg; b += pb;
      }
      raw.set([r / (S * S), g / (S * S), b / (S * S)].map(Math.round), y * rij + 1 + x * 3);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRechthoek(x, y, x0, y0, b, h, r) {
  if (x < x0 || x > x0 + b || y < y0 || y > y0 + h) return false;
  const dx = Math.max(x0 + r - x, 0, x - (x0 + b - r));
  const dy = Math.max(y0 + r - y, 0, y - (y0 + h - r));
  return dx * dx + dy * dy <= r * r;
}

/** schaal: hoe groot de halter in het icoon is (kleiner voor maskable). */
function icoon(size, schaal) {
  return png(size, (u, v) => {
    // coördinaten rond het midden, geschaald
    const x = 0.5 + (u - 0.5) / schaal;
    const y = 0.5 + (v - 0.5) / schaal;
    // schijven (symmetrisch)
    const schijven = [
      { x: 0.275, b: 0.085, h: 0.62, kleur: BLAUW },
      { x: 0.2, b: 0.065, h: 0.46, kleur: GEEL },
      { x: 0.14, b: 0.05, h: 0.32, kleur: GROEN },
    ];
    for (const s of schijven) {
      for (const sx of [s.x, 1 - s.x - s.b]) {
        if (inRechthoek(x, y, sx, 0.5 - s.h / 2, s.b, s.h, 0.025)) return s.kleur;
      }
    }
    // stang
    if (inRechthoek(x, y, 0.07, 0.475, 0.86, 0.05, 0.02)) return STANG;
    return ACHTERGROND;
  });
}

const bestanden = {
  'icoon-192.png': icoon(192, 0.82),
  'icoon-512.png': icoon(512, 0.82),
  'icoon-maskable-512.png': icoon(512, 0.62),
  'apple-touch-icon.png': icoon(180, 0.78),
  'favicon-32.png': icoon(32, 1),
};
for (const [naam, data] of Object.entries(bestanden)) {
  writeFileSync(join(uit, naam), data);
  console.log('gemaakt:', join('public/icons', naam));
}
