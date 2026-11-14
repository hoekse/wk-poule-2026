// Versleutelt een foto of clip voor de openbare repository.
// Gebruik: npm run versleutel -- <bronbestand> <doel in public/>
// Voorbeeld: npm run versleutel -- ~/Downloads/antwoord4.mp4 clips/4.mp4
//            -> media/clips/4.mp4.enc (bij de build op Vercel: public/clips/4.mp4)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { versleutel } from './media-crypto.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [bron, doel] = process.argv.slice(2);
if (!bron || !doel) {
  console.error('Gebruik: npm run versleutel -- <bronbestand> <doel in public/, bijv. clips/4.mp4 of foto.jpg>');
  process.exit(1);
}
const schoon = normalize(doel).replace(/^([/\\]|public[/\\])+/, '');
if (schoon.startsWith('..')) {
  console.error('Doel moet binnen public/ liggen.');
  process.exit(1);
}
const publiek = readFileSync(join(root, 'media', 'publieke-sleutel.txt'), 'utf8');
const uit = join(root, 'media', `${schoon}.enc`);
mkdirSync(dirname(uit), { recursive: true });
writeFileSync(uit, versleutel(readFileSync(bron), publiek));
console.log(`✓ ${bron} -> media/${schoon}.enc (wordt public/${schoon} bij de build op Vercel)`);
