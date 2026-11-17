// Rondgang door de app in een iPhone-formaat browser.
// Gebruik: npm run build && npx vite preview --port 4174 & node tests/e2e.mjs <map-voor-screenshots> [demo.json]
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

// Playwright staat globaal geïnstalleerd (of als devDependency); require vindt beide.
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const URL = process.env.KRACHT_URL ?? 'http://localhost:4174/';
const uit = process.argv[2] ?? 'test-results';
const demo = process.argv[3];
mkdirSync(uit, { recursive: true });

const browser = await chromium.launch();
const fouten = [];

async function nieuwePagina(initStaat) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: 'dark', locale: 'nl-NL' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  if (initStaat) await ctx.addInitScript((s) => localStorage.setItem('kracht-staat', s), initStaat);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => fouten.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && fouten.push(`console: ${m.text()}`));
  await page.goto(URL);
  return { ctx, page };
}

const foto = (page, naam) => page.screenshot({ path: `${uit}/${naam}.png` });
const geenHorizontaleScroll = async (page, waar) => {
  const breed = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(breed <= 1, `${waar}: pagina scrolt ${breed}px horizontaal`);
};

// ── A. Nieuwe gebruiker: kennismaken, ochtendcheck, import, training ──
{
  const { ctx, page } = await nieuwePagina();
  await page.getByRole('heading', { name: 'Krachttraining bij FitButiq' }).waitFor();
  await page.locator('#ob-naam').fill('Dennis');
  await page.getByRole('button', { name: '4× per week' }).click();
  await page.getByRole('button', { name: '3× per week' }).click();
  await foto(page, 'a1-kennismaken');
  await page.getByRole('button', { name: 'Volgende' }).click();
  await page.getByText('Hack squat').waitFor();
  await page.getByRole('button', { name: 'Volgende' }).click();
  await page.getByRole('button', { name: 'Beginnen' }).click();
  await page.getByRole('heading', { name: /Goede\w+, Dennis/ }).waitFor();
  await page.getByText('Nog geen gegevens van vannacht').waitFor();
  await geenHorizontaleScroll(page, 'vandaag (leeg)');

  // Ochtendcheck met prisma-waarden
  await page.getByRole('button', { name: 'Ochtendcheck' }).click();
  await page.locator('#oc-cpap').fill('7u05');
  await page.locator('#oc-ahi').fill('2,1');
  await page.getByRole('group', { name: 'Energie' }).getByRole('button', { name: '4' }).click();
  await page.getByRole('group', { name: 'Spierpijn' }).getByRole('button', { name: '2' }).click();
  await page.getByRole('group', { name: 'Stress' }).getByRole('button', { name: '2' }).click();
  await foto(page, 'a2-ochtendcheck');
  await page.getByRole('button', { name: 'Ochtendcheck opslaan' }).click();
  await page.getByText('Goed hersteld').waitFor();

  // Apple Health-tekst plakken (zoals de opdracht die kopieert)
  await page.getByRole('button', { name: 'Apple Health', exact: true }).click();
  await page.locator('#import-tekst').fill('{"slaap":"25200","hrv":"45,3 ms","rusthartslag":"58 count/min","gewicht":"92,4 kg"}');
  await page.getByText('slaap 7u00 · HRV 45 ms · rust-HS 58 · gewicht 92,4 kg').waitFor();
  await foto(page, 'a3-apple-health-plakken');
  await page.getByRole('button', { name: 'Opslaan', exact: true }).click();
  await page.getByText('7u00 geslapen').waitFor();

  // Training A starten en loggen
  await page.getByRole('button', { name: 'Start Training A' }).click();
  await page.getByText('Training A · Squat en bankdrukken').waitFor();
  await page.locator('#kg-0-0').fill('60');
  await page.locator('#reps-0-0').fill('8');
  await page.getByRole('button', { name: 'Set 1 klaar' }).first().click();
  await page.getByRole('timer').waitFor();
  assert.equal(await page.locator('#kg-0-1').inputValue(), '60', 'gewicht gaat mee naar set 2');
  await page.locator('#reps-0-1').fill('8');
  await page.getByRole('button', { name: 'Set 2 klaar' }).first().click();
  await page.locator('#reps-0-2').fill('7');
  await page.locator('#rir-0-2').fill('1');
  await page.getByRole('button', { name: 'Set 3 klaar' }).first().click();
  await page.locator('#kg-1-0').fill('50');
  await page.locator('#reps-1-0').fill('10');
  await page.getByRole('button', { name: 'Set 1 klaar' }).nth(1).click();
  await foto(page, 'a4-training-loggen');
  await geenHorizontaleScroll(page, 'training');

  // Wisselen van oefening
  await page.getByRole('button', { name: 'Wissel' }).nth(2).click();
  await page.getByRole('button', { name: /Eenarmig roeien/ }).click();
  await page.getByRole('heading', { name: 'Eenarmig roeien (dumbbell)' }).waitFor();

  await page.getByRole('button', { name: 'Afronden', exact: true }).click();
  await page.getByRole('group', { name: 'Zwaarte van de training' }).getByRole('button', { name: '7' }).click();
  await foto(page, 'a5-afronden');
  await page.getByRole('button', { name: 'Opslaan', exact: true }).click();
  await page.getByText('Vandaag al getraind').waitFor();
  await page.getByText('Training B', { exact: true }).waitFor();

  // Volgende keer: advies gebaseerd op deze training
  await page.getByRole('navigation').getByRole('button', { name: 'Schema' }).click();
  await page.getByRole('button', { name: 'Start Training A' }).click();
  await page.getByText(/Vorige keer: 60×8, 60×8, 60×7/).waitFor();
  await page.getByRole('button', { name: 'Afronden', exact: true }).click();
  await page.getByRole('button', { name: 'Training weggooien' }).click();
  await page.getByRole('button', { name: 'Ja, weggooien' }).click();

  // Overige schermen openen
  for (const [tab, kop] of [['Voortgang', 'Voortgang'], ['Herstel', 'Herstel'], ['Meer', 'Meer']]) {
    await page.getByRole('navigation').getByRole('button', { name: tab }).click();
    await page.getByRole('heading', { level: 1, name: new RegExp(`^${kop}`) }).waitFor();
    await geenHorizontaleScroll(page, tab);
  }
  for (const [item, kop] of [
    ['Lichaam en metingen', 'Lichaam'],
    ['Alle trainingen', 'Alle trainingen'],
    ['Schema en trainingsdagen', 'Schema'],
    ['Apparatuur bij FitButiq', 'Apparatuur'],
    ['Koppelingen', 'Koppelingen'],
    ['Back-up en export', 'Back-up en export'],
    ['Uitleg', 'Uitleg'],
  ]) {
    await page.getByRole('navigation').getByRole('button', { name: 'Meer' }).click();
    await page.getByRole('button', { name: new RegExp(`^${item}`) }).click();
    await page.getByRole('heading', { level: 1, name: new RegExp(`^${kop}`) }).waitFor();
    await geenHorizontaleScroll(page, item);
  }

  // Gegevens blijven bewaard na herladen
  await page.waitForTimeout(500);
  await page.reload();
  await page.getByRole('heading', { name: /Goede\w+, Dennis/ }).waitFor();
  await page.getByText('Vandaag al getraind').waitFor();
  await ctx.close();
  console.log('A. nieuwe gebruiker: ok');
}

// ── B. Met voorbeeldgegevens (8 weken) voor screenshots ──
if (demo) {
  const { ctx, page } = await nieuwePagina(readFileSync(demo, 'utf8'));
  await page.getByRole('heading', { name: /Goede\w+, Dennis/ }).waitFor();
  await foto(page, 'b1-vandaag');
  await page.screenshot({ path: `${uit}/b1-vandaag-lang.png`, fullPage: true });
  await page.getByRole('navigation').getByRole('button', { name: 'Voortgang' }).click();
  await page.getByRole('heading', { name: 'Kracht' }).waitFor();
  await page.screenshot({ path: `${uit}/b2-voortgang.png`, fullPage: true });
  await page.getByRole('navigation').getByRole('button', { name: 'Herstel' }).click();
  await page.getByRole('heading', { name: 'AHI' }).waitFor();
  await page.screenshot({ path: `${uit}/b3-herstel.png`, fullPage: true });
  await page.getByRole('navigation').getByRole('button', { name: 'Schema' }).click();
  await page.screenshot({ path: `${uit}/b4-schema.png`, fullPage: true });
  await page.getByRole('navigation').getByRole('button', { name: 'Vandaag' }).click();
  await page.getByRole('button', { name: /^Start Training/ }).click();
  await page.locator('#reps-0-0').fill('8');
  await page.getByRole('button', { name: 'Set 1 klaar' }).first().click();
  await page.waitForTimeout(1200);
  await foto(page, 'b5-training');
  await ctx.close();

  const licht = await browser.newContext({ ...devices['iPhone 14'], colorScheme: 'light', locale: 'nl-NL' });
  await licht.addInitScript((s) => localStorage.setItem('kracht-staat', s), readFileSync(demo, 'utf8'));
  const p2 = await licht.newPage();
  p2.on('pageerror', (e) => fouten.push(`pageerror: ${e.message}`));
  await p2.goto(URL);
  await p2.getByRole('heading', { name: /Goede\w+, Dennis/ }).waitFor();
  await p2.screenshot({ path: `${uit}/b6-vandaag-licht.png` });
  await licht.close();
  console.log('B. voorbeeldgegevens: ok');
}

await browser.close();
if (fouten.length) {
  console.error('Fouten in de browser:\n' + fouten.join('\n'));
  process.exit(1);
}
console.log('Geen fouten in de browserconsole.');
