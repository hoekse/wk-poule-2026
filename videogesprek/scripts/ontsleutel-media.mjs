// Draait vóór de build. Alleen op Vercel en alleen met MEDIA_PRIVE_SLEUTEL:
// zet media/**/*.enc ontsleuteld in public/. Lokaal gebeurt dit nooit, zodat de
// echte foto en clips niet per ongeluk onversleuteld in git terechtkomen.

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ontsleutel } from './media-crypto.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mediaMap = join(root, 'media');
const sleutel = process.env.MEDIA_PRIVE_SLEUTEL;

if (!process.env.VERCEL) {
  console.log('• Media niet ontsleuteld (alleen tijdens de build op Vercel). Lokaal gelden de placeholders.');
  process.exit(0);
}
if (!sleutel) {
  console.warn('! MEDIA_PRIVE_SLEUTEL ontbreekt: de placeholders worden gebruikt.');
  process.exit(0);
}

function* bestanden(map) {
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) yield* bestanden(pad);
    else if (naam.endsWith('.enc')) yield pad;
  }
}

let aantal = 0;
for (const pad of existsSync(mediaMap) ? bestanden(mediaMap) : []) {
  const doel = relative(mediaMap, pad).slice(0, -'.enc'.length);
  const uit = join(root, 'public', doel);
  mkdirSync(dirname(uit), { recursive: true });
  try {
    writeFileSync(uit, ontsleutel(readFileSync(pad), sleutel));
    aantal++;
  } catch (fout) {
    console.error(`✗ ${relative(root, pad)} kon niet worden ontsleuteld: ${fout.message}`);
    process.exit(1);
  }
}
console.log(`✓ ${aantal} mediabestand(en) ontsleuteld.`);
