import { dagenTussen, maandagVan, plusDagen, weekdag } from './datum';
import { beschikbaar, zoekOefening } from './oefeningen';
import type { Datum, Instellingen, Oefening, Schema, SchemaId, Slot, Staat, Training, Trainingsdag } from './types';

const s = (
  id: string,
  oefeningen: string[],
  sets: number,
  repMin: number,
  repMax: number,
  rir: number,
  rust: number,
  notitie?: string,
): Slot => ({ id, oefeningen, sets, repMin, repMax, rir, rust, notitie });

// Voorkeurslijsten: de eerste oefening die met de aanwezige apparatuur kan, wordt gekozen.
// Volgorde: plate-loaded machine → dumbbells → halterstang → kabel/stapel.
const SQUAT = ['hacksquat', 'squat', 'pendulum-squat', 'smith-squat', 'legpress', 'goblet-squat'];
const BEENPERS = ['pendulum-squat', 'legpress', 'hacksquat', 'smith-squat', 'goblet-squat'];
const LEGPRESS = ['legpress', 'pendulum-squat', 'hacksquat', 'smith-squat', 'goblet-squat'];
const BORST = ['plate-borstpress', 'db-bankdrukken', 'bankdrukken', 'smith-bankdrukken', 'borstpress'];
const SCHUIN = ['plate-schuin', 'schuin-db', 'schuin-stang', 'borstpress'];
const SCHUIN_DB = ['schuin-db', 'plate-schuin', 'schuin-stang', 'borstpress'];
const SCHOUDER = ['plate-schouderpress', 'db-schouderdrukken', 'overhead-press', 'schouderpress'];
const SCHOUDER_DB = ['db-schouderdrukken', 'plate-schouderpress', 'overhead-press', 'schouderpress'];
const DEADLIFT = ['deadlift', 'trapbar-deadlift', 'rdl', 'rdl-db'];
const RDL = ['rdl-db', 'rdl', 'rugstrekken'];
const ISO_ROW = ['plate-roeien', 'tbar-roeien', 'db-roeien', 'kabelroeien', 'borst-gesteund-roeien'];
const TBAR = ['tbar-roeien', 'plate-roeien', 'stang-roeien', 'borst-gesteund-roeien', 'db-roeien'];
const HIGHROW = ['plate-highrow', 'plate-pulldown', 'latpulldown', 'optrekken'];
const PULLDOWN = ['plate-pulldown', 'latpulldown', 'optrekken', 'plate-highrow'];
const DB_ROW = ['db-roeien', 'kroc-row', 'borst-gesteund-roeien', 'kabelroeien'];
const ROW_STEUN = ['borst-gesteund-roeien', 'db-roeien', 'plate-roeien', 'kabelroeien'];
const SPLIT = ['bulgaarse-split-squat', 'lunges', 'legpress'];
const HIPTHRUST = ['hipthrust-machine', 'hipthrust-stang', 'hipthrust-smith', 'rugstrekken'];
const LEGCURL = ['beenbuigen', 'rdl-db'];
const ZIJ = ['zijwaarts-heffen', 'kabel-zijwaarts'];
const CURL = ['db-curl', 'kabel-curl', 'stang-curl'];
const HAMER = ['hamer-curl', 'db-curl', 'kabel-curl'];
const TRICEPS = ['triceps-pushdown', 'db-triceps-boven-hoofd', 'triceps-boven-hoofd', 'dips'];
const TRI_BOVEN = ['db-triceps-boven-hoofd', 'triceps-boven-hoofd', 'triceps-pushdown', 'dips'];
const KUIT = ['kuit-machine', 'kuit-legpress', 'kuit-staand-db'];
const ANTIROTATIE = ['pallof-press', 'dead-bug', 'plank'];
const DRAGEN = ['boerenwandeling', 'plank'];
const CONDITIE = ['intervallen', 'kettlebell-intervallen'];

/** Markeert een slot als deel van een superset (om en om met de volgende oefening met dezelfde letter). */
const ss = (letter: string, slot: Slot): Slot => ({ ...slot, superset: letter });

const FINISHER = 'Finisher: seconden voluit, daarna rustig doortrappen tot de timer afgaat.';

/**
 * Schema's voor een ervaren sporter met als doel sterker, slanker en fitter.
 * Gebouwd rond plate-loaded machines, dumbbells en veel roei-oefeningen (elke training
 * minstens één, bovenlichaamdagen twee of meer), met een zware deadlift voor rug en billen
 * en korte intervallen voor conditie en vetverbranding.
 */
export const SCHEMAS: Record<SchemaId, Schema> = {
  '3-dagen': {
    id: '3-dagen',
    naam: '3× per week: volledig lichaam',
    omschrijving:
      'Drie trainingen (A, B, C) die elk je hele lichaam trainen, vooral met plate-loaded machines en dumbbells. Zwaar beginnen, elke training roeien, afsluiten met een korte conditie-finisher. ±65-75 minuten.',
    dagen: [
      {
        id: '3a',
        naam: 'Training A',
        kort: 'A',
        focus: 'Hack squat, chest press en row',
        slots: [
          s('3a-1', SQUAT, 4, 5, 8, 2, 180),
          s('3a-2', BORST, 4, 5, 8, 2, 150),
          s('3a-3', ISO_ROW, 4, 6, 10, 2, 120),
          ss('A', s('3a-4', LEGCURL, 3, 10, 12, 1, 90)),
          ss('A', s('3a-5', ZIJ, 3, 12, 20, 1, 60)),
          s('3a-6', CONDITIE, 6, 20, 30, 1, 90, FINISHER),
        ],
      },
      {
        id: '3b',
        naam: 'Training B',
        kort: 'B',
        focus: 'Deadlift, shoulder press, pulldown en T-bar',
        slots: [
          s('3b-1', DEADLIFT, 3, 3, 5, 2, 210),
          s('3b-2', SCHOUDER, 4, 5, 8, 2, 150),
          s('3b-3', PULLDOWN, 3, 6, 10, 2, 120),
          s('3b-4', TBAR, 3, 6, 10, 2, 120),
          s('3b-5', LEGPRESS, 3, 10, 12, 2, 120),
          ss('A', s('3b-6', CURL, 2, 8, 12, 1, 60)),
          ss('A', s('3b-7', DRAGEN, 3, 30, 45, 1, 90, 'Seconden lopen met zware dumbbells.')),
        ],
      },
      {
        id: '3c',
        naam: 'Training C',
        kort: 'C',
        focus: 'Incline press, high row en benen met dumbbells',
        slots: [
          s('3c-1', SCHUIN, 4, 6, 10, 2, 150),
          s('3c-2', HIGHROW, 3, 8, 12, 2, 120),
          s('3c-3', SPLIT, 3, 6, 10, 2, 120, 'Herhalingen per been.'),
          s('3c-4', ROW_STEUN, 3, 8, 12, 2, 90),
          ss('A', s('3c-5', HIPTHRUST, 3, 8, 12, 2, 120)),
          ss('A', s('3c-6', TRICEPS, 2, 10, 15, 1, 60)),
          s('3c-7', CONDITIE, 6, 20, 30, 1, 90, FINISHER),
        ],
      },
    ],
  },
  '4-dagen': {
    id: '4-dagen',
    naam: '4× per week: boven/onder',
    omschrijving:
      'Twee bovenlichaam- en twee onderlichaamtrainingen, vooral met plate-loaded machines en dumbbells. Op bovenlichaamdagen twee tot drie roei- en trekoefeningen; na beide beentrainingen een korte conditie-finisher. ±60-70 minuten.',
    dagen: [
      {
        id: '4o1',
        naam: 'Onder 1',
        kort: 'O1',
        focus: 'Hack squat',
        slots: [
          s('4o1-1', SQUAT, 4, 5, 8, 2, 180),
          s('4o1-2', RDL, 3, 8, 10, 2, 150),
          s('4o1-3', BEENPERS, 3, 10, 15, 1, 120),
          ss('A', s('4o1-4', LEGCURL, 3, 10, 12, 1, 75)),
          ss('A', s('4o1-5', KUIT, 3, 10, 15, 1, 60)),
          s('4o1-6', CONDITIE, 6, 20, 30, 1, 90, FINISHER),
        ],
      },
      {
        id: '4b1',
        naam: 'Boven 1',
        kort: 'B1',
        focus: 'Chest press en row',
        slots: [
          s('4b1-1', BORST, 4, 5, 8, 2, 150),
          s('4b1-2', ISO_ROW, 4, 6, 10, 2, 120),
          ss('A', s('4b1-3', SCHOUDER_DB, 3, 8, 12, 2, 120)),
          ss('A', s('4b1-4', PULLDOWN, 3, 8, 12, 2, 90)),
          s('4b1-5', ZIJ, 3, 12, 20, 1, 60),
          ss('B', s('4b1-6', TRICEPS, 2, 10, 15, 1, 60)),
          ss('B', s('4b1-7', CURL, 2, 10, 15, 1, 60)),
        ],
      },
      {
        id: '4o2',
        naam: 'Onder 2',
        kort: 'O2',
        focus: 'Deadlift',
        slots: [
          s('4o2-1', DEADLIFT, 3, 3, 5, 2, 210),
          s('4o2-2', LEGPRESS, 3, 8, 12, 2, 120),
          s('4o2-3', SPLIT, 2, 8, 10, 2, 90, 'Herhalingen per been.'),
          s('4o2-4', HIPTHRUST, 3, 8, 12, 2, 120),
          s('4o2-5', ANTIROTATIE, 2, 10, 12, 2, 60),
          s('4o2-6', CONDITIE, 6, 20, 30, 1, 90, FINISHER),
        ],
      },
      {
        id: '4b2',
        naam: 'Boven 2',
        kort: 'B2',
        focus: 'Shoulder press en T-bar',
        slots: [
          s('4b2-1', SCHOUDER, 4, 5, 8, 2, 150),
          s('4b2-2', TBAR, 4, 6, 10, 2, 120),
          ss('A', s('4b2-3', SCHUIN_DB, 3, 8, 12, 2, 120)),
          ss('A', s('4b2-4', HIGHROW, 3, 8, 12, 2, 90)),
          s('4b2-5', DB_ROW, 2, 10, 15, 1, 75, 'Per arm. Zwaar en veel herhalingen.'),
          ss('B', s('4b2-6', HAMER, 2, 10, 12, 1, 60)),
          ss('B', s('4b2-7', TRI_BOVEN, 2, 10, 15, 1, 60)),
        ],
      },
    ],
  },
};

/** Standaard trainingsdagen: 3× ma-wo-vr, 4× ma-di-do-vr. */
export function standaardDagen(id: SchemaId): number[] {
  return id === '3-dagen' ? [1, 3, 5] : [1, 2, 4, 5];
}

/** Trainingsdagen van het actieve schema, met eigen aanpassingen. */
export function actieveDagen(inst: Instellingen): Trainingsdag[] {
  return SCHEMAS[inst.schemaId].dagen.map((d) => inst.aangepasteDagen[d.id] ?? d);
}

export function zoekDag(inst: Instellingen, dagId: string): Trainingsdag | undefined {
  return actieveDagen(inst).find((d) => d.id === dagId);
}

/** Welke oefening er voor een slot wordt gedaan. */
export function kiesOefening(slot: Slot, inst: Instellingen, eigen: Oefening[]): { oefening: Oefening; ontbreekt: boolean } {
  const keuze = inst.keuzes[slot.id];
  if (keuze) {
    const oef = zoekOefening(keuze, eigen);
    if (oef) return { oefening: oef, ontbreekt: !beschikbaar(oef, inst.apparatuur) };
  }
  for (const id of slot.oefeningen) {
    const oef = zoekOefening(id, eigen);
    if (oef && beschikbaar(oef, inst.apparatuur)) return { oefening: oef, ontbreekt: false };
  }
  const eerste = zoekOefening(slot.oefeningen[0], eigen)!;
  return { oefening: eerste, ontbreekt: true };
}

// ── Blokken van 6 weken: 5 opbouwweken + 1 lichte week (deload) ──

export const BLOK_WEKEN = 6;

export interface BlokInfo {
  blok: number;
  week: number;
  deload: boolean;
  /** Verschuiving van het RIR-doel deze week (+1 = makkelijker, -1 = zwaarder). */
  rirExtra: number;
  label: string;
  uitleg: string;
}

const RIR_PER_WEEK = [1, 0, 0, 0, -1];

export function blokInfo(inst: Instellingen, datum: Datum): BlokInfo {
  const start = maandagVan(inst.blokStart);
  const weken = Math.max(0, Math.floor(dagenTussen(start, maandagVan(datum)) / 7));
  const week = (weken % BLOK_WEKEN) + 1;
  const blok = Math.floor(weken / BLOK_WEKEN) + 1;
  const deload = week === BLOK_WEKEN;
  const rirExtra = deload ? 2 : RIR_PER_WEEK[week - 1];
  const uitleg = deload
    ? 'Lichte week: minder sets en 10% lichter. Je lichaam herstelt en wordt sterker.'
    : week === 1
      ? 'Instapweek: houd 1 herhaling extra over. Techniek en gewichten vinden.'
      : week === 5
        ? 'Zwaarste week: ga tot 1 herhaling voor je limiet waar het veilig kan.'
        : 'Opbouwweek: probeer elke training iets meer gewicht of herhalingen.';
  return { blok, week, deload, rirExtra, label: deload ? `Blok ${blok} · lichte week` : `Blok ${blok} · week ${week} van ${BLOK_WEKEN - 1}`, uitleg };
}

/** Volgende training in de rotatie (A → B → C → A …), los van de kalender. */
export function volgendeDag(staat: Staat): Trainingsdag {
  const dagen = actieveDagen(staat.instellingen);
  const laatste = [...staat.trainingen]
    .filter((t) => t.status === 'klaar' && t.schemaId === staat.instellingen.schemaId)
    .sort((a, b) => b.start.localeCompare(a.start))[0];
  if (!laatste) return dagen[0];
  const i = dagen.findIndex((d) => d.id === laatste.dagId);
  return dagen[(i + 1) % dagen.length];
}

export interface WeekDag {
  datum: Datum;
  gepland: boolean;
  trainingen: Training[];
}

/** De week (ma-zo) rond een datum, met geplande dagen en gedane trainingen. */
export function weekOverzicht(staat: Staat, datum: Datum): WeekDag[] {
  const ma = maandagVan(datum);
  return Array.from({ length: 7 }, (_, i) => {
    const d = plusDagen(ma, i);
    return {
      datum: d,
      gepland: staat.instellingen.trainingsdagen.includes(weekdag(d)),
      trainingen: staat.trainingen.filter((t) => t.datum === d && t.status === 'klaar'),
    };
  });
}
