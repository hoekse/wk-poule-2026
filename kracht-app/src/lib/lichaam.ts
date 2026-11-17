import { dagenTussen, plusDagen } from './datum';
import type { Datum, Staat } from './types';

/** Lichaamsgewicht per dag: metingen gaan voor op Apple Health. */
export function gewichtReeks(staat: Staat): { x: Datum; y: number }[] {
  const per = new Map<Datum, number>();
  for (const d of Object.values(staat.dagdata)) if (d.gewicht) per.set(d.datum, d.gewicht);
  for (const m of staat.metingen) if (m.gewicht) per.set(m.datum, m.gewicht);
  return [...per.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([x, y]) => ({ x, y }));
}

export interface Tempo {
  kgPerWeek: number;
  procentPerWeek: number;
  huidig: number;
  oordeel: 'snel' | 'goed' | 'stabiel' | 'aankomen';
  tekst: string;
}

/**
 * Hoe snel je gewicht verandert: lijn door de metingen van de laatste 4 weken
 * (minimaal 4 metingen verspreid over 10 dagen). Dagelijkse schommelingen vallen zo weg.
 */
export function gewichtsTempo(staat: Staat, tot: Datum, dagen = 28): Tempo | null {
  const van = plusDagen(tot, -dagen);
  const punten = gewichtReeks(staat).filter((p) => p.x > van && p.x <= tot);
  if (punten.length < 4 || dagenTussen(punten[0].x, punten[punten.length - 1].x) < 10) return null;
  const xs = punten.map((p) => dagenTussen(van, p.x));
  const ys = punten.map((p) => p.y);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let teller = 0;
  let noemer = 0;
  xs.forEach((x, i) => {
    teller += (x - mx) * (ys[i] - my);
    noemer += (x - mx) ** 2;
  });
  const helling = noemer ? teller / noemer : 0;
  const huidig = my + helling * (dagenTussen(van, tot) - mx);
  const kgPerWeek = Math.round(helling * 7 * 100) / 100;
  const procentPerWeek = Math.round((kgPerWeek / huidig) * 1000) / 10;
  const kg = Math.abs(kgPerWeek).toLocaleString('nl-NL', { maximumFractionDigits: 1 });
  if (procentPerWeek < -1)
    return { kgPerWeek, procentPerWeek, huidig, oordeel: 'snel', tekst: `Je valt snel af (−${kg} kg per week). Eet iets meer, anders lever je kracht en spier in.` };
  if (procentPerWeek <= -0.25)
    return { kgPerWeek, procentPerWeek, huidig, oordeel: 'goed', tekst: `−${kg} kg per week: goed tempo om vet te verliezen en sterker te blijven worden.` };
  if (procentPerWeek < 0.25)
    return {
      kgPerWeek,
      procentPerWeek,
      huidig,
      oordeel: 'stabiel',
      tekst: 'Je gewicht is stabiel. Wil je slanker worden: eet 300-500 kcal per dag minder, vooral minder snacks en drinken met suiker of alcohol.',
    };
  return { kgPerWeek, procentPerWeek, huidig, oordeel: 'aankomen', tekst: `Je komt aan (+${kg} kg per week). Voor aftrainen: iets minder eten en de stappen omhoog.` };
}

/** Eiwit om spieren te houden terwijl je afvalt: 1,8-2,2 gram per kg lichaamsgewicht. */
export function eiwitAdvies(gewicht: number): { van: number; tot: number } {
  return { van: Math.round((gewicht * 1.8) / 5) * 5, tot: Math.round((gewicht * 2.2) / 5) * 5 };
}
