// Controleert of antwoorden.json en de clips in public/clips bij elkaar passen.
// Draait automatisch vóór elke build (ook op Vercel), zodat een ontbrekende
// clip niet pas tijdens een gesprek opvalt.
// Gebruik: npm run controleer

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clipsMap = join(root, 'public', 'clips');
// Een bestand telt als aanwezig als het in public/ staat of versleuteld in media/.
const aanwezig = (pad) => existsSync(join(root, 'public', pad)) || existsSync(join(root, 'media', `${pad}.enc`));
const fouten = [];
const waarschuwingen = [];

let items;
try {
  items = JSON.parse(readFileSync(join(root, 'data', 'antwoorden.json'), 'utf8'));
} catch (e) {
  console.error(`✗ data/antwoorden.json is geen geldige JSON: ${e.message}`);
  process.exit(1);
}
const instellingen = JSON.parse(readFileSync(join(root, 'data', 'instellingen.json'), 'utf8'));

if (!Array.isArray(items) || items.length === 0) fouten.push('antwoorden.json moet een lijst met minstens één item zijn.');

const ids = new Set();
const gebruikt = new Set(['idle.mp4', 'begroeting.mp4', 'onbekend.mp4']);
for (const [i, item] of (items ?? []).entries()) {
  const waar = `item ${i + 1}${item?.id ? ` (id ${item.id})` : ''}`;
  if (typeof item?.id !== 'string' || !item.id) fouten.push(`${waar}: "id" ontbreekt of is geen tekst.`);
  else if (ids.has(item.id)) fouten.push(`${waar}: id "${item.id}" komt vaker voor.`);
  else if (item.id === 'geen' || item.id === 'ruis') fouten.push(`${waar}: id "${item.id}" is gereserveerd.`);
  ids.add(item?.id);
  if (typeof item?.clip !== 'string' || !item.clip.endsWith('.mp4')) fouten.push(`${waar}: "clip" moet een .mp4-bestandsnaam zijn.`);
  else {
    gebruikt.add(item.clip);
    if (!aanwezig(`clips/${item.clip}`)) fouten.push(`${waar}: clip public/clips/${item.clip} (of media/clips/${item.clip}.enc) bestaat niet.`);
  }
  if (!Array.isArray(item?.vragen) || item.vragen.length === 0 || item.vragen.some((v) => typeof v !== 'string' || !v.trim()))
    fouten.push(`${waar}: "vragen" moet een lijst met minstens één vraag zijn.`);
  if (typeof item?.antwoordtekst !== 'string') fouten.push(`${waar}: "antwoordtekst" ontbreekt.`);
}

for (const vast of ['idle.mp4', 'begroeting.mp4', 'onbekend.mp4']) {
  if (!aanwezig(`clips/${vast}`)) fouten.push(`Vaste clip public/clips/${vast} ontbreekt.`);
}
if (!aanwezig(instellingen.foto)) fouten.push(`Foto public/${instellingen.foto} ontbreekt (zie data/instellingen.json).`);

if (existsSync(clipsMap)) {
  for (const bestand of readdirSync(clipsMap)) {
    if (bestand.endsWith('.mp4') && !gebruikt.has(bestand))
      waarschuwingen.push(`public/clips/${bestand} staat niet in antwoorden.json en wordt niet gebruikt.`);
  }
}

for (const w of waarschuwingen) console.warn(`! ${w}`);
if (fouten.length) {
  for (const f of fouten) console.error(`✗ ${f}`);
  console.error(`\n${fouten.length} probleem/problemen gevonden. Los ze op en probeer opnieuw.`);
  process.exit(1);
}
console.log(`✓ ${items.length} antwoorden en alle clips gevonden.`);
