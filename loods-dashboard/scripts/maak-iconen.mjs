// Maakt de app-iconen (PNG) met het logo-kenmerk: vier huisstijlblokjes op donker.
// Geen externe pakketten nodig. Vervang ze later door het echte logo van Dennis.
// Gebruik: node scripts/maak-iconen.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const uit = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'scan', 'public', 'icons');
mkdirSync(uit, { recursive: true });

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ACHTERGROND = hex('#2D2E32');
const BLOKJES = ['#DC0014', '#F0B400', '#008CDC', '#8CB400'].map(hex);

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
  for (let y = 0; y < size; y++) {
    raw[y * rij] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      raw.set([r, g, b], y * rij + 1 + x * 3);
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

/** @param inhoud deel van het icoon dat het kenmerk beslaat (kleiner voor maskable). */
function icoon(size, inhoud) {
  const totaal = size * inhoud;
  const gat = totaal * 0.08;
  const blok = (totaal - gat) / 2;
  const start = (size - totaal) / 2;
  const straal = blok * 0.12;
  return png(size, (x, y) => {
    for (let i = 0; i < 4; i++) {
      const bx = start + (i % 2) * (blok + gat);
      const by = start + Math.floor(i / 2) * (blok + gat);
      if (x >= bx && x < bx + blok && y >= by && y < by + blok) {
        const dx = Math.max(bx + straal - x, 0, x - (bx + blok - straal));
        const dy = Math.max(by + straal - y, 0, y - (by + blok - straal));
        if (dx * dx + dy * dy <= straal * straal) return BLOKJES[i];
      }
    }
    return ACHTERGROND;
  });
}

const bestanden = {
  'icoon-192.png': icoon(192, 0.6),
  'icoon-512.png': icoon(512, 0.6),
  'icoon-maskable-512.png': icoon(512, 0.46),
  'apple-touch-icon.png': icoon(180, 0.56),
  'favicon-32.png': icoon(32, 0.8),
};
for (const [naam, data] of Object.entries(bestanden)) {
  writeFileSync(join(uit, naam), data);
  console.log('gemaakt:', join('apps/scan/public/icons', naam));
}
