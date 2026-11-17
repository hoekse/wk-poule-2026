import { maandagVan, plusDagen } from './datum';
import { berekenHerstel } from './herstel';
import { zoekOefening } from './oefeningen';
import { e1rm, trainingenPerWeek, werkSets } from './progressie';
import { blokInfo } from './schema';
import type { Datum, Staat, Training } from './types';

const gem = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const isNormaal = (t: Training) => t.status === 'klaar' && !t.deload && t.aanpassing === 'normaal';

function besteE1rm(t: Training, oefeningId: string): number {
  const log = t.oefeningen.find((l) => l.oefeningId === oefeningId);
  if (!log) return 0;
  return Math.max(0, ...werkSets(log).map((x) => e1rm(x.gewicht ?? 0, x.reps ?? 0, x.rir)));
}

/**
 * Prestatie per training: hoe sterk je was ten opzichte van je eigen niveau.
 * Per oefening de beste set gedeeld door het beste van de 3 trainingen ervoor; daarvan het gemiddelde.
 * 1,03 = 3% sterker dan je recente niveau.
 */
export function prestatieIndex(staat: Staat): Map<string, number> {
  const trainingen = staat.trainingen.filter(isNormaal).sort((a, b) => a.start.localeCompare(b.start));
  const uit = new Map<string, number>();
  trainingen.forEach((t, i) => {
    const ratios: number[] = [];
    for (const log of t.oefeningen) {
      const nu = besteE1rm(t, log.oefeningId);
      if (!nu) continue;
      const eerder = trainingen
        .slice(0, i)
        .filter((x) => x.oefeningen.some((l) => l.oefeningId === log.oefeningId))
        .slice(-3)
        .map((x) => besteE1rm(x, log.oefeningId))
        .filter((x) => x > 0);
      if (eerder.length) ratios.push(nu / Math.max(...eerder));
    }
    if (ratios.length) uit.set(t.id, gem(ratios));
  });
  return uit;
}

export interface Inzicht {
  titel: string;
  tekst: string;
  soort: 'goed' | 'let-op' | 'info';
}

function vergelijk(
  staat: Staat,
  index: Map<string, number>,
  inGroep: (t: Training) => boolean | null,
): { goed: number; slecht: number; nGoed: number; nSlecht: number } | null {
  const goed: number[] = [];
  const slecht: number[] = [];
  for (const t of staat.trainingen) {
    const p = index.get(t.id);
    if (p == null) continue;
    const g = inGroep(t);
    if (g === true) goed.push(p);
    else if (g === false) slecht.push(p);
  }
  if (goed.length < 3 || slecht.length < 3) return null;
  return { goed: gem(goed), slecht: gem(slecht), nGoed: goed.length, nSlecht: slecht.length };
}

const procent = (a: number, b: number) => Math.round((a / b - 1) * 1000) / 10;
const fmt = (n: number) => Math.abs(n).toLocaleString('nl-NL', { maximumFractionDigits: 1 });

/** Wat je eigen gegevens laten zien: slaap, CPAP en werk tegenover je prestaties en herstel. */
export function inzichten(staat: Staat, vandaag: Datum): Inzicht[] {
  const uit: Inzicht[] = [];
  const index = prestatieIndex(staat);
  const nacht = (t: Training) => staat.dagdata[t.datum];

  const ahi = vergelijk(staat, index, (t) => (nacht(t)?.ahi == null ? null : nacht(t)!.ahi! < 5));
  if (ahi) {
    const v = procent(ahi.goed, ahi.slecht);
    uit.push(
      v > 0.5
        ? { soort: 'goed', titel: 'CPAP loont', tekst: `Na nachten met AHI onder 5 presteer je gemiddeld ${fmt(v)}% beter dan na nachten met AHI 5 of hoger (${ahi.nGoed} tegen ${ahi.nSlecht} trainingen).` }
        : { soort: 'info', titel: 'AHI en kracht', tekst: `Je AHI maakt tot nu toe weinig verschil voor je kracht (${v >= 0 ? '+' : '−'}${fmt(v)}%).` },
    );
  }

  const slaap = vergelijk(staat, index, (t) => {
    const u = nacht(t)?.slaapUren ?? nacht(t)?.cpapUren;
    if (u == null) return null;
    return u >= 7 ? true : u < 6.5 ? false : null;
  });
  if (slaap) {
    const v = procent(slaap.goed, slaap.slecht);
    uit.push(
      v > 0.5
        ? { soort: 'goed', titel: 'Slaap = kracht', tekst: `Na 7 uur slaap of meer til je gemiddeld ${fmt(v)}% meer dan na minder dan 6,5 uur.` }
        : { soort: 'info', titel: 'Slaap en kracht', tekst: `Korte nachten kosten je tot nu toe weinig kracht (${v >= 0 ? '+' : '−'}${fmt(v)}%). Herstel en vetverlies hebben er wel last van.` },
    );
  }

  const score = vergelijk(staat, index, (t) => (t.herstelScore == null ? null : t.herstelScore >= 75));
  if (score) {
    const v = procent(score.goed, score.slecht);
    if (v > 0.5) uit.push({ soort: 'goed', titel: 'Herstelscore klopt', tekst: `Bij een groene herstelscore presteer je gemiddeld ${fmt(v)}% beter. Lichter trainen op slechte dagen is dus slim.` });
  }

  // Zware werkdag tegenover herstelscore de dag erna.
  const zwaar: number[] = [];
  const licht: number[] = [];
  for (const d of Object.values(staat.dagdata)) {
    if (d.energie == null && d.spierpijn == null) continue;
    const s = berekenHerstel(staat, d.datum).score;
    if (s == null) continue;
    (d.zwareWerkdag ? zwaar : licht).push(s);
  }
  if (zwaar.length >= 3 && licht.length >= 3) {
    const v = Math.round(gem(licht) - gem(zwaar));
    if (v >= 3)
      uit.push({ soort: 'let-op', titel: 'Zware werkdagen', tekst: `Na een fysiek zware werkdag is je herstelscore gemiddeld ${v} punten lager. Plan je zwaarste training liever na een rustiger dag.` });
  }

  // CPAP-gebruik afgelopen 30 dagen.
  const cpap = Array.from({ length: 30 }, (_, i) => staat.dagdata[plusDagen(vandaag, -i)]?.cpapUren).filter((x): x is number => x != null);
  if (cpap.length >= 7) {
    const ok = cpap.filter((u) => u >= 4).length;
    const pct = Math.round((ok / cpap.length) * 100);
    uit.push({
      soort: pct >= 90 ? 'goed' : 'let-op',
      titel: 'Masker op',
      tekst: `${ok} van de ${cpap.length} nachten minstens 4 uur CPAP (${pct}%).${pct < 90 ? ' Elke nacht telt: korte nachten met apneus kosten herstel en maken afvallen moeilijker.' : ''}`,
    });
  }

  // Weken op rij het trainingsdoel gehaald.
  const perWeek = trainingenPerWeek(staat);
  const doel = staat.instellingen.trainingsdagen.length || 3;
  let reeks = 0;
  for (let w = plusDagen(maandagVan(vandaag), -7); (perWeek.get(w) ?? 0) >= doel; w = plusDagen(w, -7)) reeks++;
  if (reeks >= 2) uit.push({ soort: 'goed', titel: 'Op dreef', tekst: `${reeks} weken op rij ${doel}× getraind. Volhouden!` });

  return uit;
}

/**
 * Advies voor een lichte week: herstel al een paar dagen laag én je kracht staat stil.
 * Niet in week 1-2 van een blok, niet als het al een lichte week is en niet als je het deze week wegklikte.
 */
export function deloadAdvies(staat: Staat, datum: Datum): string | null {
  const inst = staat.instellingen;
  const blok = blokInfo(inst, datum);
  if (blok.deload || blok.week < 3) return null;
  if (inst.deloadAdviesWeg === maandagVan(datum)) return null;

  const scores = [0, 1, 2].map((i) => berekenHerstel(staat, plusDagen(datum, -i)).score).filter((x): x is number => x != null);
  if (scores.length < 2 || gem(scores) >= 60) return null;

  const normaal = staat.trainingen.filter(isNormaal).sort((a, b) => a.start.localeCompare(b.start));
  const basis = new Set(
    normaal.flatMap((t) => t.oefeningen.map((l) => l.oefeningId)).filter((id) => zoekOefening(id, staat.eigenOefeningen)?.soort === 'basis'),
  );
  let gemeten = 0;
  let stil = 0;
  for (const id of basis) {
    const reeks = normaal.map((t) => besteE1rm(t, id)).filter((x) => x > 0);
    if (reeks.length < 4) continue;
    gemeten++;
    const laatste = Math.max(...reeks.slice(-2));
    const ervoor = Math.max(...reeks.slice(-4, -2));
    if (laatste <= ervoor) stil++;
  }
  if (gemeten < 2 || stil / gemeten < 0.5) return null;
  return `Je herstelscore is al ${scores.length} dagen gemiddeld ${Math.round(gem(scores))} en bij ${stil} van ${gemeten} basisoefeningen sta je stil. Een lichte week nu laat je lichaam inhalen; daarna ga je weer vooruit.`;
}
