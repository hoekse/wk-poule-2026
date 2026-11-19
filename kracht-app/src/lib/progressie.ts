import { maandagVan } from './datum';
import { EENZIJDIG, kleinsteSchijf } from './schijven';
import { OP_TIJD, zoekOefening } from './oefeningen';
import type { Aanpassing, Datum, Instellingen, Oefening, OefeningLog, SetLog, Slot, Spiergroep, Staat, Training } from './types';

/** Geschatte 1-herhalingsmaximum (Epley), rekening houdend met herhalingen in reserve. */
export function e1rm(gewicht: number, reps: number, rir: number | null = null): number {
  if (gewicht <= 0 || reps <= 0) return 0;
  const effectief = Math.min(reps + (rir ?? 0), 15);
  if (effectief <= 1) return gewicht;
  return gewicht * (1 + effectief / 30);
}

export function rondAf(gewicht: number, stap: number): number {
  if (!stap) return Math.round(gewicht * 2) / 2;
  return Math.round(gewicht / stap) * stap;
}

/** Stapgrootte voor deze oefening (dumbbell-basisoefeningen volgen de instelling). */
export function stapVoor(oef: Oefening, inst: Instellingen): number {
  if (oef.gewichtType === 'per-hand' && oef.stap >= 2) return inst.dumbbellStap;
  // Met de schijven die er liggen: halterstang en machines laden aan twee kanten, de T-bar aan één.
  const kleinste = kleinsteSchijf(inst);
  if (oef.gewichtType === 'totaal' && oef.apparaat.includes('stang')) return Math.max(oef.stap, kleinste * 2);
  if (oef.gewichtType === 'schijven') return Math.max(oef.stap, EENZIJDIG.has(oef.id) ? kleinste : kleinste * 2);
  return oef.stap;
}

export const werkSets = (log: OefeningLog): SetLog[] =>
  log.sets.filter((x) => x.klaar && (x.reps ?? 0) > 0);

export interface Uitvoering {
  training: Training;
  log: OefeningLog;
}

/** Alle afgeronde uitvoeringen van een oefening, nieuwste eerst. */
export function geschiedenis(staat: Staat, oefeningId: string, voorTrainingId?: string): Uitvoering[] {
  const uit: Uitvoering[] = [];
  for (const t of staat.trainingen) {
    if (t.status !== 'klaar' || t.id === voorTrainingId) continue;
    for (const log of t.oefeningen) {
      if (log.oefeningId === oefeningId && !log.overgeslagen && werkSets(log).length) uit.push({ training: t, log });
    }
  }
  return uit.sort((a, b) => b.training.start.localeCompare(a.training.start));
}

export interface Advies {
  sets: number;
  repMin: number;
  repMax: number;
  rir: number;
  rust: number;
  gewicht: number | null;
  uitleg: string;
}

function topGewicht(sets: SetLog[]): number {
  return Math.max(...sets.map((x) => x.gewicht ?? 0));
}

/**
 * Dubbele progressie: blijf op hetzelfde gewicht tot je alle sets op het
 * maximum aantal herhalingen haalt, dan gaat het gewicht omhoog.
 */
export function advies(
  staat: Staat,
  slot: Slot,
  oef: Oefening,
  opties: { rirExtra: number; deload: boolean; aanpassing: Aanpassing },
): Advies {
  const inst = staat.instellingen;
  const stap = stapVoor(oef, inst);
  let sets = slot.sets;
  let rir = Math.max(0, slot.rir + opties.rirExtra);
  let factor = 1;
  const extra: string[] = [];

  if (opties.deload) {
    sets = Math.max(1, Math.ceil(slot.sets * 0.6));
    factor = 0.9;
    rir = Math.max(rir, 3);
  }
  if (opties.aanpassing === 'licht') {
    sets = Math.max(2, sets - 1);
    rir += 1;
    extra.push('Lichtere dag: 1 set minder en 1 herhaling extra over.');
  } else if (opties.aanpassing === 'herstel') {
    sets = Math.min(sets, 2);
    factor = Math.min(factor, 0.85);
    rir = Math.max(rir, 4);
    extra.push('Herstelsessie: 2 rustige sets, 15% lichter.');
  }

  const alles = geschiedenis(staat, oef.id);
  // Lichte weken en lichtere sessies tellen niet als uitgangspunt: anders zakt het gewicht blijvend.
  const normaal = alles.filter((u) => !u.training.deload && u.training.aanpassing === 'normaal');
  const vorige = normaal.length ? normaal : alles;
  const basis = { sets, repMin: slot.repMin, repMax: slot.repMax, rir, rust: slot.rust };
  const tijd = OP_TIJD.has(oef.id);
  const eenheid = tijd ? 'seconden' : 'herhalingen';

  if (!vorige.length) {
    const uitleg = stap === 0
      ? `Eerste keer: ${slot.repMin}-${slot.repMax} ${eenheid} per set${oef.gewichtType === 'geen' ? ' voluit' : ' met nette techniek'}.`
      : `Eerste keer: kies een gewicht waarmee je ${slot.repMax} ${eenheid} haalt en er nog ±${rir} over hebt. Begin liever te licht.`;
    return { ...basis, gewicht: null, uitleg: [uitleg, ...extra].join(' ') };
  }

  const laatste = vorige[0].log;
  const ws = werkSets(laatste);
  const w = topGewicht(ws);
  const opW = ws.filter((x) => (x.gewicht ?? 0) === w);
  const allesMax = opW.length >= Math.min(slot.sets, laatste.doel.sets) && opW.every((x) => (x.reps ?? 0) >= slot.repMax);
  const teZwaar = ws.some((x) => (x.reps ?? 0) < slot.repMin);
  const vorigeOokTeZwaar = vorige[1] ? werkSets(vorige[1].log).some((x) => (x.reps ?? 0) < slot.repMin) : false;
  const vorigeKeerTekst = `Vorige keer: ${ws.map((x) => setTekst(x, oef)).join(', ')}.`;

  let gewicht = w;
  let uitleg: string;
  if (stap === 0) {
    uitleg = allesMax
      ? `${vorigeKeerTekst} Alle sets op ${slot.repMax}: maak het zwaarder (langzamer, extra gewicht of moeilijkere variant).`
      : `${vorigeKeerTekst} Probeer per set 1 ${tijd ? 'seconde' : 'herhaling'} meer.`;
  } else if (allesMax) {
    gewicht = w + stap;
    uitleg = `${vorigeKeerTekst} Alle sets op ${slot.repMax} gehaald: +${fmtKg(stap)} kg.`;
  } else if (teZwaar && vorigeOokTeZwaar) {
    gewicht = Math.max(0, rondAf(w * 0.9, stap));
    uitleg = `${vorigeKeerTekst} Twee keer onder de ${slot.repMin}: 10% lichter en weer opbouwen.`;
  } else if (teZwaar) {
    uitleg = `${vorigeKeerTekst} Zelfde gewicht; haal minimaal ${slot.repMin} ${eenheid} per set.`;
  } else {
    uitleg = `${vorigeKeerTekst} Zelfde gewicht, probeer 1 ${tijd ? 'seconde' : 'herhaling'} meer per set.`;
  }

  if (factor < 1 && gewicht > 0) {
    gewicht = rondAf(gewicht * factor, stap || 0.5);
    if (opties.deload) extra.unshift('Lichte week: 10% lichter, minder sets.');
  }
  return { ...basis, gewicht, uitleg: [uitleg, ...extra].join(' ') };
}

/** Opwarmsets voor de eerste zware oefening. */
export function opwarmen(werkgewicht: number | null, oef: Oefening): { gewicht: number; reps: number }[] {
  if (!werkgewicht || oef.soort !== 'basis' || oef.gewichtType === 'lichaamsgewicht') return [];
  const stap = oef.gewichtType === 'totaal' ? 2.5 : oef.stap;
  const leeg = oef.gewichtType === 'totaal' && oef.apparaat.includes('stang') ? 20 : 0;
  const schema: [number, number][] = [[0.5, 8], [0.7, 4], [0.85, 2]];
  const uit: { gewicht: number; reps: number }[] = [];
  if (leeg && werkgewicht >= 40) uit.push({ gewicht: leeg, reps: 10 });
  for (const [p, reps] of schema) {
    const g = Math.max(leeg, rondAf(werkgewicht * p, stap));
    if (g < werkgewicht && !uit.some((x) => x.gewicht === g)) uit.push({ gewicht: g, reps });
  }
  return uit;
}

/** Een set als tekst: '60×8', of '25s' bij intervallen zonder gewicht. */
export function setTekst(x: SetLog, oef?: Oefening): string {
  const tijd = oef ? OP_TIJD.has(oef.id) : false;
  if (oef?.gewichtType === 'geen' || (!x.gewicht && oef?.gewichtType === 'lichaamsgewicht')) return `${x.reps}${tijd ? 's' : '×'}`;
  return `${fmtKg(x.gewicht)}×${x.reps}${tijd ? 's' : ''}`;
}

export function fmtKg(n: number | null | undefined): string {
  if (n == null) return '–';
  return Number.isInteger(n) ? String(n) : n.toLocaleString('nl-NL', { maximumFractionDigits: 2 });
}

// ── Records ────────────────────────────────────────────────

export interface Record_ {
  oefeningId: string;
  soort: 'e1rm' | 'gewicht';
  waarde: number;
  detail: string;
}

/** Nieuwe records die in deze training zijn gezet (ten opzichte van alles ervoor). */
export function recordsIn(staat: Staat, training: Training): Record_[] {
  const uit: Record_[] = [];
  for (const log of training.oefeningen) {
    const ws = werkSets(log).filter((x) => (x.gewicht ?? 0) > 0);
    if (!ws.length) continue;
    const eerder = staat.trainingen.filter((t) => t.status === 'klaar' && t.id !== training.id && t.start < training.start);
    const eerdereSets = eerder.flatMap((t) => t.oefeningen.filter((l) => l.oefeningId === log.oefeningId).flatMap(werkSets));
    if (!eerdereSets.length) continue;
    const besteE = Math.max(...eerdereSets.map((x) => e1rm(x.gewicht ?? 0, x.reps ?? 0, x.rir)));
    const besteW = Math.max(...eerdereSets.map((x) => x.gewicht ?? 0));
    const nuBest = ws.reduce((a, b) => (e1rm(b.gewicht!, b.reps!, b.rir) > e1rm(a.gewicht!, a.reps!, a.rir) ? b : a));
    const nuE = e1rm(nuBest.gewicht!, nuBest.reps!, nuBest.rir);
    const nuW = Math.max(...ws.map((x) => x.gewicht ?? 0));
    if (nuW > besteW) uit.push({ oefeningId: log.oefeningId, soort: 'gewicht', waarde: nuW, detail: `Zwaarste gewicht ooit: ${fmtKg(nuW)} kg` });
    else if (nuE > besteE + 0.01) uit.push({ oefeningId: log.oefeningId, soort: 'e1rm', waarde: nuE, detail: `Beste set ooit: ${fmtKg(nuBest.gewicht)} kg × ${nuBest.reps}` });
  }
  return uit;
}

// ── Statistiek ─────────────────────────────────────────────

export function tonnage(t: Training): number {
  return t.oefeningen.reduce(
    (som, log) => som + werkSets(log).reduce((s, x) => s + (OP_TIJD.has(log.oefeningId) ? 0 : (x.gewicht ?? 0) * (x.reps ?? 0)), 0),
    0,
  );
}

export function aantalWerkSets(t: Training): number {
  return t.oefeningen.reduce((s, log) => s + werkSets(log).length, 0);
}

/** Sets per spiergroep per week: hoofdspier telt 1, meewerkende spieren 0,5. */
export function setsPerSpier(staat: Staat, vanaf: Datum, tot: Datum): Record<Spiergroep, number> {
  const uit = {} as Record<Spiergroep, number>;
  for (const t of staat.trainingen) {
    if (t.status !== 'klaar' || t.datum < vanaf || t.datum > tot) continue;
    for (const log of t.oefeningen) {
      const oef = zoekOefening(log.oefeningId, staat.eigenOefeningen);
      if (!oef) continue;
      const n = werkSets(log).length;
      oef.spieren.forEach((sp, i) => {
        uit[sp] = (uit[sp] ?? 0) + n * (i === 0 ? 1 : 0.5);
      });
    }
  }
  return uit;
}

export interface Punt {
  datum: Datum;
  waarde: number;
}

/** Beste geschatte 1RM per training voor een oefening (zonder lichte weken). */
export function e1rmReeks(staat: Staat, oefeningId: string): Punt[] {
  const alles = geschiedenis(staat, oefeningId);
  // Lichte weken en herstelsessies laten de lijn onterecht zakken: alleen normale trainingen.
  const normaal = alles.filter((u) => !u.training.deload && u.training.aanpassing === 'normaal');
  return (normaal.length ? normaal : alles)
    .map(({ training, log }) => ({
      datum: training.datum,
      waarde: Math.max(...werkSets(log).map((x) => e1rm(x.gewicht ?? 0, x.reps ?? 0, x.rir))),
    }))
    .filter((p) => p.waarde > 0)
    .reverse();
}

/** Trainingen per week (maandag als sleutel). */
export function trainingenPerWeek(staat: Staat): Map<Datum, number> {
  const m = new Map<Datum, number>();
  for (const t of staat.trainingen) {
    if (t.status !== 'klaar') continue;
    const w = maandagVan(t.datum);
    m.set(w, (m.get(w) ?? 0) + 1);
  }
  return m;
}
