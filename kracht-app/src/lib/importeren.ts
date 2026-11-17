import { naarDatum, plusDagen } from './datum';
import type { Bron, Dagdata, DagVeld, Datum } from './types';

export type DagInvoer = Partial<Dagdata> & { datum: Datum };

export interface ImportResultaat {
  bron: Bron;
  dagen: DagInvoer[];
  meldingen: string[];
}

// ── Getallen en tijden ─────────────────────────────────────

/** Leest een getal uit tekst als '45,3 ms', '1.234', '7.5' of een echt getal. */
export function getal(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v !== 'string') return undefined;
  let t = v.trim().replace(/\s/g, '');
  const m = t.match(/-?[\d.,]+/);
  if (!m) return undefined;
  t = m[0];
  const punt = t.lastIndexOf('.');
  const komma = t.lastIndexOf(',');
  if (punt >= 0 && komma >= 0) {
    t = punt > komma ? t.replace(/,/g, '') : t.replace(/\./g, '').replace(',', '.');
  } else if (komma >= 0) {
    t = /^-?\d{1,3}(,\d{3})+$/.test(t) && t.split(',').length > 2 ? t.replace(/,/g, '') : t.replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(t) && t.split('.').length > 2) {
    t = t.replace(/\./g, '');
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Leest een duur als uren. Snapt '7:32', '7:32:10', '7u32', '7h 32m', '452 min',
 * en kale getallen: > 1440 = seconden, > 24 = minuten, anders uren.
 */
export function duurInUren(v: unknown): number | undefined {
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    let m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) return +m[1] + +m[2] / 60 + (m[3] ? +m[3] / 3600 : 0);
    m = s.match(/^(\d{1,2})\s*(?:u|h|uur|hr|hrs|hours)\s*(?:(\d{1,2})\s*(?:m|min|mins|minuten|minutes)?)?$/);
    if (m) return +m[1] + (m[2] ? +m[2] / 60 : 0);
    m = s.match(/^([\d.,]+)\s*(?:m|min|mins|minuten|minutes)$/);
    if (m) return (getal(m[1]) ?? 0) / 60;
    m = s.match(/^([\d.,]+)\s*(?:s|sec|seconden|seconds)$/);
    if (m) return (getal(m[1]) ?? 0) / 3600;
  }
  const n = getal(v);
  if (n == null || n < 0) return undefined;
  if (n > 1440) return n / 3600;
  if (n > 24) return n / 60;
  return n;
}

/** Leest een datum in veel notaties; geeft 'JJJJ-MM-DD' terug. */
export function leesDatum(v: unknown): Datum | undefined {
  if (v instanceof Date) return naarDatum(v);
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return maak(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let [a, b, j] = [+m[1], +m[2], +m[3]];
    if (j < 100) j += 2000;
    // Standaard dag-maand-jaar; alleen maand/dag als het tweede getal > 12 is.
    if (b > 12 && a <= 12) [a, b] = [b, a];
    return maak(j, b, a);
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return naarDatum(new Date(t));
  return undefined;
}

function maak(j: number, m: number, d: number): Datum | undefined {
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined;
  return `${j}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const normaal = (k: string) => k.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');

// ── iOS-opdracht (eigen formaat, zie handleiding) ─────────

const SLEUTELS: Record<string, DagVeld | 'datum'> = {};
const alias = (veld: DagVeld | 'datum', ...namen: string[]) => namen.forEach((n) => (SLEUTELS[normaal(n)] = veld));
alias('datum', 'datum', 'date', 'dag', 'day');
alias('slaapUren', 'slaap', 'slaapuren', 'slaap_uren', 'sleep', 'totalsleep', 'asleep', 'slaapanalyse', 'geslapen');
alias('slaapDiep', 'diep', 'diepe_slaap', 'diepeslaap', 'deep', 'deepsleep');
alias('slaapRem', 'rem', 'rem_slaap', 'remslaap', 'remsleep');
alias('slaapKern', 'kern', 'kernslaap', 'core', 'coresleep');
alias('slaapWakker', 'wakker', 'awake');
alias('hrv', 'hrv', 'hartslagvariabiliteit', 'heartratevariability', 'heart_rate_variability');
alias('rustHartslag', 'rusthartslag', 'rust_hartslag', 'restinghr', 'restingheartrate', 'resting_heart_rate', 'rhr');
alias('stappen', 'stappen', 'steps', 'stepcount', 'step_count');
alias('actieveKcal', 'actieve_energie', 'actieveenergie', 'actievekcal', 'actieve_kcal', 'activeenergy', 'active_energy', 'kcal');
alias('gewicht', 'gewicht', 'weight', 'bodymass', 'body_mass', 'lichaamsgewicht');
alias('vetPct', 'vet', 'vetpercentage', 'vetpct', 'bodyfat', 'body_fat_percentage', 'lichaamsvet', 'vetmassa');
alias('vo2max', 'vo2max', 'vo2_max', 'cardiofitheid');
alias('ademhalingsstoornissen', 'ademhalingsstoornissen', 'breathingdisturbances', 'breathing_disturbances');
alias('cpapUren', 'cpap', 'cpap_uren', 'cpapuren', 'gebruik', 'gebruiksduur', 'usage', 'therapieduur', 'maskerop');
alias('ahi', 'ahi');
alias('lekkage', 'lekkage', 'leak', 'lek');
alias('druk', 'druk', 'pressure');
alias('spo2Gem', 'spo2', 'spo2_gem', 'zuurstof', 'zuurstofsaturatie', 'bloedzuurstof', 'oxygen', 'blood_oxygen', 'oxygen_saturation');
alias('spo2Min', 'spo2_min', 'spo2min', 'laagste_spo2', 'min_spo2', 'laagste_zuurstof', 'lowest_o2');
alias('odi', 'odi');
alias('dips', 'dips', 'zuurstofdips', 'drops');
alias('onder90', 'onder90', 'onder_90');
alias('polsNacht', 'pols', 'pols_nacht', 'hartslag_nacht', 'pulse');

const NUL_MOGELIJK = new Set<DagVeld>(['stappen', 'actieveKcal', 'ahi', 'dips', 'odi', 'onder90', 'lekkage', 'ademhalingsstoornissen']);
const DUUR_VELDEN = new Set<DagVeld>(['slaapUren', 'slaapDiep', 'slaapRem', 'slaapKern', 'slaapWakker', 'cpapUren']);

function invoerUitObject(obj: Record<string, unknown>, standaardDatum: Datum): DagInvoer | null {
  const dag: DagInvoer = { datum: standaardDatum };
  let iets = false;
  for (const [k, v] of Object.entries(obj)) {
    const veld = SLEUTELS[normaal(k)];
    if (!veld || v === '' || v == null) continue;
    if (veld === 'datum') {
      const d = leesDatum(v);
      if (d) dag.datum = d;
      continue;
    }
    let n = DUUR_VELDEN.has(veld) ? duurInUren(v) : getal(v);
    if (n == null) continue;
    if ((veld === 'vetPct' || veld === 'spo2Gem' || veld === 'spo2Min') && n > 0 && n <= 1) n *= 100;
    if (n < 0) continue;
    // Een lege meting komt uit de opdracht vaak als 0: alleen echte nullen bewaren waar 0 kan.
    if (n === 0 && !NUL_MOGELIJK.has(veld)) continue;
    (dag as Record<string, unknown>)[veld] = Math.round(n * 100) / 100;
    iets = true;
  }
  return iets ? dag : null;
}

export function leesOpdrachtJson(tekst: string, standaardDatum: Datum): ImportResultaat {
  const data = JSON.parse(tekst.trim());
  const lijst: unknown[] = Array.isArray(data) ? data : Array.isArray(data?.dagen) ? data.dagen : [data];
  const dagen = lijst
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => invoerUitObject(x, standaardDatum))
    .filter((x): x is DagInvoer => !!x);
  return { bron: 'apple', dagen, meldingen: dagen.length ? [] : ['Geen bekende waarden gevonden in de geplakte tekst.'] };
}

// ── Health Auto Export (iOS-app, JSON-export of REST-automatisering) ──

interface HaeMetric {
  name?: string;
  units?: string;
  data?: Record<string, unknown>[];
}

export function isHealthAutoExport(data: unknown): boolean {
  return !!data && typeof data === 'object' && Array.isArray((data as { data?: { metrics?: unknown } }).data?.metrics);
}

export function leesHealthAutoExport(data: { data: { metrics: HaeMetric[] } }): ImportResultaat {
  const per = new Map<Datum, { som: Partial<Record<DagVeld, number>>; aantal: Partial<Record<DagVeld, number>>; laatst: Partial<Record<DagVeld, number>> }>();
  const meldingen: string[] = [];
  const pak = (d: Datum) => {
    if (!per.has(d)) per.set(d, { som: {}, aantal: {}, laatst: {} });
    return per.get(d)!;
  };
  const voegToe = (d: Datum, veld: DagVeld, n: number, manier: 'som' | 'gem' | 'laatst') => {
    const x = pak(d);
    if (manier === 'laatst') x.laatst[veld] = n;
    else {
      x.som[veld] = (x.som[veld] ?? 0) + n;
      x.aantal[veld] = (x.aantal[veld] ?? 0) + (manier === 'gem' ? 1 : 0);
    }
  };

  for (const m of data.data.metrics) {
    const naam = (m.name ?? '').toLowerCase();
    const eenheid = (m.units ?? '').toLowerCase();
    for (const rij of m.data ?? []) {
      if (naam.includes('sleep')) {
        const d = leesDatum(rij.sleepEnd ?? rij.inBedEnd ?? rij.date);
        if (!d) continue;
        const totaal = getal(rij.totalSleep) ?? getal(rij.asleep) ?? undefined;
        const kern = getal(rij.core);
        const diep = getal(rij.deep);
        const rem = getal(rij.rem);
        const som = (kern ?? 0) + (diep ?? 0) + (rem ?? 0);
        const uren = totaal && totaal > 0 ? totaal : som > 0 ? som + (getal(rij.asleep) ?? 0) : getal(rij.qty);
        if (uren) voegToe(d, 'slaapUren', eenheid === 'min' ? uren / 60 : uren, 'som');
        if (diep) voegToe(d, 'slaapDiep', diep, 'som');
        if (rem) voegToe(d, 'slaapRem', rem, 'som');
        if (kern) voegToe(d, 'slaapKern', kern, 'som');
        const wakker = getal(rij.awake);
        if (wakker) voegToe(d, 'slaapWakker', wakker, 'som');
        continue;
      }
      const d = leesDatum(rij.date);
      const n = getal(rij.qty ?? rij.Avg ?? rij.avg);
      if (!d || n == null) continue;
      if (naam.includes('variability')) voegToe(d, 'hrv', n, 'gem');
      else if (naam.includes('resting_heart')) voegToe(d, 'rustHartslag', n, 'gem');
      else if (naam.includes('step_count')) voegToe(d, 'stappen', n, 'som');
      else if (naam.includes('active_energy')) voegToe(d, 'actieveKcal', eenheid === 'kj' ? n / 4.184 : n, 'som');
      else if (naam.includes('body_mass') && !naam.includes('index') && !naam.includes('lean')) voegToe(d, 'gewicht', eenheid === 'lb' ? n * 0.4536 : n, 'laatst');
      else if (naam === 'weight') voegToe(d, 'gewicht', eenheid === 'lb' ? n * 0.4536 : n, 'laatst');
      else if (naam.includes('body_fat')) voegToe(d, 'vetPct', n < 1 ? n * 100 : n, 'laatst');
      else if (naam.includes('vo2')) voegToe(d, 'vo2max', n, 'laatst');
      else if (naam.includes('breathing_disturb')) voegToe(d, 'ademhalingsstoornissen', n, 'gem');
      else if (naam.includes('oxygen_saturation') || naam.includes('blood_oxygen')) {
        const pct = (x: number) => (x <= 1 ? x * 100 : x);
        voegToe(d, 'spo2Gem', pct(n), 'gem');
        const laagste = getal(rij.Min ?? rij.min);
        const x = pct(laagste ?? n);
        const huidig = pak(d).laatst.spo2Min;
        if (huidig == null || x < huidig) voegToe(d, 'spo2Min', x, 'laatst');
      }
    }
  }

  const dagen: DagInvoer[] = [...per.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([datum, x]) => {
      const dag: DagInvoer = { datum };
      for (const [veld, som] of Object.entries(x.som) as [DagVeld, number][]) {
        const aantal = x.aantal[veld] ?? 0;
        (dag as Record<string, unknown>)[veld] = Math.round((aantal ? som / aantal : som) * 100) / 100;
      }
      for (const [veld, n] of Object.entries(x.laatst) as [DagVeld, number][]) {
        (dag as Record<string, unknown>)[veld] = Math.round(n * 100) / 100;
      }
      return dag;
    });
  if (!dagen.length) meldingen.push('Geen bruikbare gegevens gevonden in het Health Auto Export-bestand.');
  return { bron: 'hae', dagen, meldingen };
}

// ── CSV (SleepHQ, OSCAR of eigen lijst) ───────────────────

export function leesCsv(tekst: string): string[][] {
  const regels = tekst.replace(/^﻿/, '').split(/\r?\n/).filter((r) => r.trim());
  if (!regels.length) return [];
  const kop = regels[0];
  const scheiding = [';', '\t', ','].map((s) => ({ s, n: kop.split(s).length })).sort((a, b) => b.n - a.n)[0].s;
  return regels.map((regel) => {
    const velden: string[] = [];
    let huidig = '';
    let inAanhaling = false;
    for (let i = 0; i < regel.length; i++) {
      const c = regel[i];
      if (c === '"') {
        if (inAanhaling && regel[i + 1] === '"') {
          huidig += '"';
          i++;
        } else inAanhaling = !inAanhaling;
      } else if (c === scheiding && !inAanhaling) {
        velden.push(huidig.trim());
        huidig = '';
      } else huidig += c;
    }
    velden.push(huidig.trim());
    return velden;
  });
}

export interface CsvKolommen {
  datum: number;
  ahi: number;
  cpapUren: number;
  lekkage: number;
  druk: number;
}

function zoekKolom(kop: string[], ...patronen: RegExp[]): number {
  for (const p of patronen) {
    const i = kop.findIndex((k) => p.test(k));
    if (i >= 0) return i;
  }
  return -1;
}

export function herkenKolommen(kop: string[]): CsvKolommen {
  return {
    datum: zoekKolom(kop, /^(date|datum|day|dag|night|nacht)$/i, /date|datum|night|nacht/i),
    ahi: zoekKolom(kop, /^ahi$/i, /\bahi\b/i),
    cpapUren: zoekKolom(kop, /usage|gebruik/i, /total\s*time|therapy\s*time|therapietijd/i, /duration|duur|hours|uren/i),
    lekkage: zoekKolom(kop, /median\s*leak|leak\s*median|mediane\s*lek/i, /leak|lek/i),
    druk: zoekKolom(kop, /median\s*pressure|pressure\s*median|mediane\s*druk/i, /pressure|druk/i),
  };
}

/**
 * CPAP-gegevens uit een CSV. OSCAR en SleepHQ noteren de datum van de avond
 * waarop de nacht begon; met nachtDatum = true schuiven we op naar de ochtend.
 */
export function leesCpapCsv(tekst: string, nachtDatum: boolean): ImportResultaat & { kolommen: CsvKolommen; kop: string[] } {
  const rijen = leesCsv(tekst);
  const kop = rijen[0] ?? [];
  const kolommen = herkenKolommen(kop);
  const meldingen: string[] = [];
  if (kolommen.datum < 0) meldingen.push('Geen datumkolom gevonden. Verwacht een kolom "Date" of "Datum".');
  if (kolommen.ahi < 0 && kolommen.cpapUren < 0) meldingen.push('Geen kolom met AHI of gebruiksduur gevonden.');
  const dagen: DagInvoer[] = [];
  if (kolommen.datum >= 0) {
    for (const rij of rijen.slice(1)) {
      const d = leesDatum(rij[kolommen.datum]);
      if (!d) continue;
      const dag: DagInvoer = { datum: nachtDatum ? plusDagen(d, 1) : d };
      const ahi = kolommen.ahi >= 0 ? getal(rij[kolommen.ahi]) : undefined;
      const uren = kolommen.cpapUren >= 0 ? duurInUren(rij[kolommen.cpapUren]) : undefined;
      const lek = kolommen.lekkage >= 0 ? getal(rij[kolommen.lekkage]) : undefined;
      const druk = kolommen.druk >= 0 ? getal(rij[kolommen.druk]) : undefined;
      if (ahi != null) dag.ahi = Math.round(ahi * 100) / 100;
      if (uren != null && uren > 0) dag.cpapUren = Math.round(uren * 100) / 100;
      if (lek != null) dag.lekkage = Math.round(lek * 10) / 10;
      if (druk != null) dag.druk = Math.round(druk * 10) / 10;
      if (dag.ahi != null || dag.cpapUren != null) dagen.push(dag);
    }
  }
  return { bron: 'sleephq', dagen, meldingen, kolommen, kop };
}

// ── O2Ring (ViHealth-app): zuurstof en polsslag per paar seconden ──

const ZUURSTOF_KOLOM = /oxygen|spo2|sp02|o2\b|zuurstof/i;

export function isO2RingCsv(kop: string[]): boolean {
  return kop.some((k) => ZUURSTOF_KOLOM.test(k)) && !kop.some((k) => /\bahi\b/i.test(k));
}

/** Leest een tijdstip als '22:15:04 16/11/2026', '10:15:04 PM Nov 16, 2026' of '2026-11-16 22:15:04'. */
export function leesTijdstip(v: string): number | undefined {
  const m = v.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?/);
  if (!m) return undefined;
  const rest = v.replace(m[0], ' ').replace(/[T,]/g, ' ').trim();
  const d = leesDatum(rest);
  if (!d) return undefined;
  let uur = +m[1];
  const ampm = m[4]?.toLowerCase();
  if (ampm === 'pm' && uur < 12) uur += 12;
  if (ampm === 'am' && uur === 12) uur = 0;
  const [j, mnd, dag] = d.split('-').map(Number);
  return new Date(j, mnd - 1, dag, uur, +m[2], +(m[3] ?? 0)).getTime();
}

export interface ZuurstofNacht {
  uren: number;
  spo2Gem: number;
  spo2Min: number;
  dips: number;
  odi: number;
  onder90: number;
  polsNacht?: number;
}

/**
 * Rekent een nacht zuurstofmetingen om naar samenvattende waarden.
 * ODI is een schatting: een dip telt als de zuurstof minstens 10 seconden 4% of meer
 * onder het gemiddelde van de 2 minuten ervoor zakt (zoals 'drops ≥ 4%' in ViHealth).
 */
export function vatZuurstofSamen(spo2: number[], interval: number, pols: number[] = []): ZuurstofNacht | null {
  const n = spo2.length;
  if (n < 10) return null;
  const uren = (n * interval) / 3600;
  const gem = spo2.reduce((a, b) => a + b, 0) / n;
  // Laagste waarde die minstens twee metingen aanhoudt (losse meetfouten tellen niet).
  let min = 100;
  for (let i = 0; i < n - 1; i++) min = Math.min(min, Math.max(spo2[i], spo2[i + 1]));
  const venster = Math.max(1, Math.round(120 / interval));
  const minDuur = Math.max(1, Math.ceil(10 / interval));
  let dips = 0;
  let i = venster;
  while (i < n) {
    let som = 0;
    for (let k = i - venster; k < i; k++) som += spo2[k];
    const basis = som / venster;
    if (spo2[i] <= basis - 4) {
      let j = i;
      while (j < n && spo2[j] <= basis - 3) j++;
      if (j - i >= minDuur) dips++;
      // Wacht tot de zuurstof hersteld is voordat een nieuwe dip telt.
      while (j < n && spo2[j] < basis - 1) j++;
      i = Math.max(j, i + 1);
    } else i++;
  }
  const onder90 = (spo2.filter((x) => x < 90).length * interval) / 60;
  const geldigePols = pols.filter((p) => p >= 25 && p <= 250);
  return {
    uren: Math.round(uren * 100) / 100,
    spo2Gem: Math.round(gem * 10) / 10,
    spo2Min: min,
    dips,
    odi: Math.round((dips / Math.max(uren, 0.1)) * 10) / 10,
    onder90: Math.round(onder90),
    polsNacht: geldigePols.length ? Math.round(geldigePols.reduce((a, b) => a + b, 0) / geldigePols.length) : undefined,
  };
}

export function leesO2RingCsv(tekst: string, standaardDatum: Datum): ImportResultaat {
  const rijen = leesCsv(tekst);
  const kop = rijen[0] ?? [];
  const iZ = zoekKolom(kop, /oxygen\s*level|spo2|sp02/i, ZUURSTOF_KOLOM);
  const iP = zoekKolom(kop, /pulse|pols|\bpr\b|heart|hartslag/i);
  const iT = zoekKolom(kop, /^(time|tijd|date|datum)/i, /time|tijd/i);
  if (iZ < 0) return { bron: 'o2ring', dagen: [], meldingen: ['Geen kolom met zuurstofwaarden gevonden.'] };
  const spo2: number[] = [];
  const pols: number[] = [];
  const tijden: number[] = [];
  for (const rij of rijen.slice(1)) {
    const z = getal(rij[iZ]);
    if (z == null || z < 50 || z > 100) continue;
    spo2.push(z);
    pols.push(iP >= 0 ? getal(rij[iP]) ?? 0 : 0);
    const t = iT >= 0 ? leesTijdstip(rij[iT] ?? '') : undefined;
    if (t != null) tijden.push(t);
  }
  let interval = 4;
  if (tijden.length > 2) {
    const verschillen = tijden.slice(1).map((t, k) => (t - tijden[k]) / 1000).filter((x) => x > 0 && x < 60).sort((a, b) => a - b);
    if (verschillen.length) interval = verschillen[Math.floor(verschillen.length / 2)];
  }
  const nacht = vatZuurstofSamen(spo2, interval, pols);
  if (!nacht) return { bron: 'o2ring', dagen: [], meldingen: ['Te weinig geldige zuurstofmetingen in dit bestand.'] };
  // De nacht hoort bij de ochtend waarop je wakker werd; eindigt de meting vóór middernacht, dan is dat de volgende dag.
  const eind = tijden.length ? new Date(tijden[tijden.length - 1]) : null;
  const datum = eind ? (eind.getHours() >= 15 ? plusDagen(naarDatum(eind), 1) : naarDatum(eind)) : standaardDatum;
  const { uren, ...waarden } = nacht;
  return {
    bron: 'o2ring',
    dagen: [{ datum, ...waarden }],
    meldingen: [`${String(uren).replace('.', ',')} uur gemeten. Zuurstofdips per uur (ODI) zijn een schatting van de app.`],
  };
}

/** Herkent automatisch wat er geplakt of gekozen is. */
export function leesWillekeurig(tekst: string, standaardDatum: Datum, nachtDatum = true): ImportResultaat {
  const t = tekst.trim();
  if (t.startsWith('{') || t.startsWith('[')) {
    const data = JSON.parse(t);
    if (isHealthAutoExport(data)) return leesHealthAutoExport(data);
    return leesOpdrachtJson(t, standaardDatum);
  }
  const kop = leesCsv(t.split(/\r?\n/)[0] ?? '')[0] ?? [];
  if (isO2RingCsv(kop)) return leesO2RingCsv(t, standaardDatum);
  return leesCpapCsv(t, nachtDatum);
}
