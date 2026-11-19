import { maandagVan, vandaag } from './datum';
import { berekenHerstel } from './herstel';
import type { DagInvoer } from './importeren';
import { standaardApparatuur, zoekOefening } from './oefeningen';
import { advies, e1rm, rondAf, stapVoor, werkSets } from './progressie';
import { actieveDagen, blokInfo, kiesOefening, standaardDagen, zoekDag } from './schema';
import type { Aanpassing, Bron, Dagdata, DagVeld, Datum, Instellingen, Meting, OefeningLog, SchemaId, Slot, Staat, Training } from './types';

export const nieuwId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function standaardInstellingen(): Instellingen {
  return {
    naam: '',
    onboardingKlaar: false,
    schemaId: '3-dagen',
    trainingsdagen: standaardDagen('3-dagen'),
    blokStart: maandagVan(vandaag()),
    apparatuur: standaardApparatuur(),
    keuzes: {},
    aangepasteDagen: {},
    dumbbellStap: 2,
    slaapDoel: 7.5,
    geluid: true,
    trillen: true,
    opdrachtNaam: 'Kracht Gezondheid',
    machineInstellingen: {},
    supersets: true,
    schijven: [25, 20, 15, 10, 5, 2.5, 1.25],
    stangGewicht: 20,
    trainingstijd: '18:00',
  };
}

export function legeStaat(): Staat {
  return { versie: 1, instellingen: standaardInstellingen(), trainingen: [], dagdata: {}, metingen: [], eigenOefeningen: [], fotos: [], uitlegFotos: {} };
}

/** Vult ontbrekende velden aan (na een update van de app of een oude back-up). */
export function normaliseer(s: Partial<Staat>): Staat {
  const leeg = legeStaat();
  const inst = { ...leeg.instellingen, ...(s.instellingen ?? {}) };
  inst.apparatuur = { ...leeg.instellingen.apparatuur, ...(s.instellingen?.apparatuur ?? {}) };
  return {
    versie: 1,
    instellingen: inst,
    trainingen: Array.isArray(s.trainingen) ? s.trainingen : [],
    dagdata: s.dagdata && typeof s.dagdata === 'object' ? s.dagdata : {},
    metingen: Array.isArray(s.metingen) ? s.metingen : [],
    eigenOefeningen: Array.isArray(s.eigenOefeningen) ? s.eigenOefeningen : [],
    fotos: Array.isArray(s.fotos) ? s.fotos : [],
    uitlegFotos: s.uitlegFotos && typeof s.uitlegFotos === 'object' ? s.uitlegFotos : {},
  };
}

// ── Trainen ────────────────────────────────────────────────

export function actieveTraining(s: Staat): Training | undefined {
  return s.trainingen.find((t) => t.status === 'bezig');
}

export function maakTraining(s: Staat, dagId: string, aanpassing: Aanpassing, datum: Datum = vandaag()): Training {
  const inst = s.instellingen;
  const dag = zoekDag(inst, dagId) ?? actieveDagen(inst)[0];
  const blok = blokInfo(inst, datum);
  const herstel = berekenHerstel(s, datum);
  // Gisteren veel boven je hoofd gewerkt (plafonds, hoge muren)? Dan schouders ontzien.
  const ontzien = !!s.dagdata[datum]?.bovenHoofd;
  const oefeningen: OefeningLog[] = dag.slots.map((slot) => {
    const { oefening } = kiesOefening(slot, inst, s.eigenOefeningen);
    const a = advies(s, slot, oefening, { rirExtra: blok.rirExtra, deload: blok.deload, aanpassing });
    if (ontzien && oefening.spieren[0] === 'schouders' && oefening.soort === 'basis') {
      a.sets = Math.max(2, a.sets - 1);
      a.rir += 1;
      if (a.gewicht) a.gewicht = rondAf(a.gewicht * 0.9, stapVoor(oefening, inst));
      a.uitleg += ' Schouders ontzien na werk boven je hoofd: 10% lichter en 1 set minder.';
    }
    return {
      slotId: slot.id,
      oefeningId: oefening.id,
      doel: { ...a },
      sets: Array.from({ length: a.sets }, () => ({ gewicht: a.gewicht, reps: null, rir: null, klaar: false })),
      ...(inst.supersets && slot.superset ? { superset: slot.superset } : {}),
    };
  });
  if (ontzien && !oefeningen.some((l) => l.oefeningId === 'face-pull' || l.oefeningId === 'reverse-fly')) {
    const extra: Slot = { id: `${dag.id}-schouders`, oefeningen: ['face-pull', 'panatta-rear-delt', 'reverse-fly'], sets: 2, repMin: 15, repMax: 20, rir: 2, rust: 60 };
    const { oefening } = kiesOefening(extra, inst, s.eigenOefeningen);
    const a = advies(s, extra, oefening, { rirExtra: 0, deload: false, aanpassing: 'normaal' });
    a.uitleg = `Extra voor je schouders na werk boven je hoofd. ${a.uitleg}`;
    oefeningen.push({
      slotId: extra.id,
      oefeningId: oefening.id,
      doel: { ...a },
      sets: Array.from({ length: a.sets }, () => ({ gewicht: a.gewicht, reps: null, rir: null, klaar: false })),
      extra: true,
    });
  }
  return {
    id: nieuwId(),
    datum,
    schemaId: inst.schemaId,
    dagId: dag.id,
    dagNaam: `${dag.naam} · ${dag.focus}`,
    blokWeek: blok.week,
    deload: blok.deload,
    aanpassing,
    herstelScore: herstel.score,
    start: new Date().toISOString(),
    status: 'bezig',
    oefeningen,
    ...(ontzien ? { schoudersOntzien: true } : {}),
  };
}

/** Wisselt de oefening in een lopende training en rekent het advies opnieuw uit. */
export function wisselOefening(s: Staat, t: Training, index: number, nieuweId: string): Training {
  const log = t.oefeningen[index];
  const dag = zoekDag(s.instellingen, t.dagId);
  const slot = dag?.slots.find((x) => x.id === log.slotId) ?? {
    id: log.slotId,
    oefeningen: [nieuweId],
    sets: log.doel.sets,
    repMin: log.doel.repMin,
    repMax: log.doel.repMax,
    rir: log.doel.rir,
    rust: log.doel.rust,
  };
  const oef = zoekOefening(nieuweId, s.eigenOefeningen);
  if (!oef) return t;
  const blok = blokInfo(s.instellingen, t.datum);
  const a = advies(s, slot, oef, { rirExtra: blok.rirExtra, deload: t.deload, aanpassing: t.aanpassing });
  const nieuw: OefeningLog = {
    slotId: log.slotId,
    oefeningId: oef.id,
    doel: { ...a },
    sets: Array.from({ length: a.sets }, () => ({ gewicht: a.gewicht, reps: null, rir: null, klaar: false })),
  };
  return { ...t, oefeningen: t.oefeningen.map((x, i) => (i === index ? nieuw : x)) };
}

// ── Dagdata ────────────────────────────────────────────────

/** Voegt geïmporteerde of ingevoerde waarden samen. Handmatige waarden worden niet overschreven door een import. */
export function voegDagdataToe(s: Staat, invoer: DagInvoer[], bron: Bron): { staat: Staat; aantal: number } {
  const dagdata = { ...s.dagdata };
  let aantal = 0;
  for (const dag of invoer) {
    const oud: Dagdata = dagdata[dag.datum] ?? { datum: dag.datum, bronnen: {}, bijgewerkt: '' };
    const nieuw: Dagdata = { ...oud, bronnen: { ...oud.bronnen } };
    let veranderd = false;
    for (const [k, v] of Object.entries(dag)) {
      if (k === 'datum' || k === 'bronnen' || k === 'bijgewerkt') continue;
      const veld = k as DagVeld;
      if (bron !== 'handmatig' && oud.bronnen[veld] === 'handmatig' && oud[veld] != null) continue;
      if (v === undefined) continue;
      (nieuw as unknown as Record<string, unknown>)[veld] = v === '' || v === null ? undefined : v;
      nieuw.bronnen[veld] = bron;
      veranderd = true;
    }
    if (veranderd) {
      nieuw.bijgewerkt = new Date().toISOString();
      dagdata[dag.datum] = nieuw;
      aantal++;
    }
  }
  return { staat: { ...s, dagdata }, aantal };
}

// ── Back-up en export ─────────────────────────────────────

export interface Backup {
  app: 'kracht';
  versie: 1;
  gemaakt: string;
  staat: Staat;
  /** Voortgangsfoto's als data-URL per foto-id. */
  fotos?: Record<string, string>;
}

export function maakBackup(s: Staat, fotos?: Record<string, string>): Backup {
  return { app: 'kracht', versie: 1, gemaakt: new Date().toISOString(), staat: s, ...(fotos ? { fotos } : {}) };
}

export function leesBackup(tekst: string): Staat {
  const data = JSON.parse(tekst);
  if (data?.app !== 'kracht' || !data.staat) throw new Error('Dit is geen back-up van de Kracht-app.');
  return normaliseer(data.staat);
}

/** Back-up inclusief voortgangsfoto's (als data-URL per foto-id). */
export function leesBackupVolledig(tekst: string): { staat: Staat; fotos: Record<string, string> } {
  const data = JSON.parse(tekst);
  const staat = leesBackup(tekst);
  const fotos = data?.fotos && typeof data.fotos === 'object' ? (data.fotos as Record<string, string>) : {};
  return { staat, fotos };
}

const csvVeld = (v: unknown) => {
  if (v == null) return '';
  const t = typeof v === 'number' ? String(v).replace('.', ',') : String(v);
  return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const csvRegel = (velden: unknown[]) => velden.map(csvVeld).join(';');

/** Alle sets als CSV (puntkomma, komma als decimaal: opent direct goed in Nederlandse Excel/Numbers). */
export function setsCsv(s: Staat): string {
  const regels = [csvRegel(['datum', 'training', 'oefening', 'set', 'gewicht_kg', 'herhalingen', 'rir', 'geschat_1rm', 'notitie'])];
  const trainingen = s.trainingen.filter((t) => t.status === 'klaar').sort((a, b) => a.start.localeCompare(b.start));
  for (const t of trainingen) {
    for (const log of t.oefeningen) {
      const naam = zoekOefening(log.oefeningId, s.eigenOefeningen)?.naam ?? log.oefeningId;
      werkSets(log).forEach((x, i) =>
        regels.push(
          csvRegel([t.datum, t.dagNaam, naam, i + 1, x.gewicht, x.reps, x.rir, x.gewicht ? Math.round(e1rm(x.gewicht, x.reps ?? 0, x.rir) * 10) / 10 : '', i === 0 ? log.notitie : '']),
        ),
      );
    }
  }
  return regels.join('\n');
}

const DAGVELDEN: [DagVeld, string][] = [
  ['slaapUren', 'slaap_uren'],
  ['slaapDiep', 'diepe_slaap_uren'],
  ['slaapRem', 'rem_slaap_uren'],
  ['cpapUren', 'cpap_uren'],
  ['ahi', 'ahi'],
  ['lekkage', 'lekkage'],
  ['druk', 'druk'],
  ['spo2Gem', 'spo2_gem'],
  ['spo2Min', 'spo2_laagste'],
  ['odi', 'zuurstofdips_per_uur'],
  ['dips', 'zuurstofdips'],
  ['onder90', 'minuten_onder_90'],
  ['polsNacht', 'pols_nacht'],
  ['vo2max', 'vo2max'],
  ['hrv', 'hrv_ms'],
  ['rustHartslag', 'rusthartslag'],
  ['stappen', 'stappen'],
  ['actieveKcal', 'actieve_kcal'],
  ['gewicht', 'gewicht_kg'],
  ['vetPct', 'vet_pct'],
  ['energie', 'energie_1_5'],
  ['spierpijn', 'spierpijn_1_5'],
  ['stress', 'stress_1_5'],
  ['zwareWerkdag', 'zware_werkdag'],
  ['bovenHoofd', 'boven_hoofd_gewerkt'],
  ['eiwit', 'eiwit_g'],
  ['pijn', 'pijn'],
];

export function dagdataCsv(s: Staat): string {
  const regels = [csvRegel(['datum', ...DAGVELDEN.map(([, k]) => k)])];
  for (const d of Object.values(s.dagdata).sort((a, b) => a.datum.localeCompare(b.datum))) {
    regels.push(csvRegel([d.datum, ...DAGVELDEN.map(([v]) => (typeof d[v] === 'boolean' ? (d[v] ? 'ja' : 'nee') : d[v]))]));
  }
  return regels.join('\n');
}

export function metingenCsv(s: Staat): string {
  const regels = [csvRegel(['datum', 'gewicht_kg', 'vet_pct', 'taille_cm', 'heup_cm', 'borst_cm', 'arm_cm', 'dij_cm', 'notitie'])];
  for (const m of [...s.metingen].sort((a, b) => a.datum.localeCompare(b.datum))) {
    regels.push(csvRegel([m.datum, m.gewicht, m.vetPct, m.taille, m.heup, m.borst, m.arm, m.dij, m.notitie]));
  }
  return regels.join('\n');
}

export function wisselSchema(s: Staat, id: SchemaId): Staat {
  return { ...s, instellingen: { ...s.instellingen, schemaId: id, trainingsdagen: standaardDagen(id) } };
}

export function nieuweMeting(datum: Datum): Meting {
  return { id: nieuwId(), datum };
}
