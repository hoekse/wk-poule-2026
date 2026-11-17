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

const SQUAT = ['squat', 'hacksquat', 'smith-squat', 'legpress', 'goblet-squat'];
const BANK = ['bankdrukken', 'db-bankdrukken', 'smith-bankdrukken', 'borstpress'];
const SCHUIN = ['schuin-db', 'schuin-stang', 'borstpress'];
const DEADLIFT = ['trapbar-deadlift', 'deadlift', 'rdl', 'rdl-db'];
const RDL = ['rdl', 'rdl-db', 'rugstrekken'];
const OHP = ['overhead-press', 'db-schouderdrukken', 'schouderpress'];
const DB_OHP = ['db-schouderdrukken', 'schouderpress', 'overhead-press'];
const PULLDOWN = ['latpulldown', 'optrekken'];
const OPTREKKEN = ['optrekken', 'latpulldown'];
const ROEIEN = ['kabelroeien', 'borst-gesteund-roeien', 'db-roeien', 'stang-roeien'];
const ROEIEN_DB = ['db-roeien', 'borst-gesteund-roeien', 'kabelroeien', 'stang-roeien'];
const ROEIEN_STEUN = ['borst-gesteund-roeien', 'db-roeien', 'kabelroeien'];
const LEGPRESS = ['legpress', 'hacksquat', 'smith-squat', 'goblet-squat'];
const SPLIT = ['bulgaarse-split-squat', 'lunges', 'legpress'];
const HIPTHRUST = ['hipthrust-machine', 'hipthrust-stang', 'hipthrust-smith', 'rugstrekken'];
const LEGCURL = ['beenbuigen', 'rdl-db'];
const ZIJ = ['zijwaarts-heffen', 'kabel-zijwaarts'];
const FACEPULL = ['face-pull', 'reverse-fly'];
const CURL = ['db-curl', 'kabel-curl', 'stang-curl'];
const HAMER = ['hamer-curl', 'db-curl', 'kabel-curl'];
const PUSHDOWN = ['triceps-pushdown', 'triceps-boven-hoofd', 'db-triceps-boven-hoofd', 'dips'];
const TRI_BOVEN = ['triceps-boven-hoofd', 'db-triceps-boven-hoofd', 'triceps-pushdown'];
const KUIT = ['kuit-machine', 'kuit-legpress', 'kuit-staand-db'];
const BUIK = ['kabel-crunch', 'knieheffen-hangend', 'dead-bug', 'plank'];
const ANTIROTATIE = ['pallof-press', 'dead-bug', 'plank'];
const DRAGEN = ['boerenwandeling', 'plank'];

export const SCHEMAS: Record<SchemaId, Schema> = {
  '3-dagen': {
    id: '3-dagen',
    naam: '3× per week: volledig lichaam',
    omschrijving:
      'Drie trainingen (A, B, C) die elk je hele lichaam trainen. Ideaal met een drukke werkweek: elke spiergroep 2-3× per week, ±60 minuten per training.',
    dagen: [
      {
        id: '3a',
        naam: 'Training A',
        kort: 'A',
        focus: 'Squat en bankdrukken',
        slots: [
          s('3a-1', SQUAT, 3, 5, 8, 2, 180),
          s('3a-2', BANK, 3, 6, 10, 2, 150),
          s('3a-3', ROEIEN, 3, 8, 12, 2, 120),
          s('3a-4', LEGCURL, 3, 10, 15, 1, 90),
          s('3a-5', ZIJ, 2, 12, 20, 1, 60),
          s('3a-6', BUIK, 2, 10, 15, 2, 60),
        ],
      },
      {
        id: '3b',
        naam: 'Training B',
        kort: 'B',
        focus: 'Deadlift en drukken boven het hoofd',
        slots: [
          s('3b-1', DEADLIFT, 3, 4, 6, 2, 180),
          s('3b-2', DB_OHP, 3, 6, 10, 2, 150),
          s('3b-3', PULLDOWN, 3, 8, 12, 2, 120),
          s('3b-4', LEGPRESS, 3, 10, 12, 2, 120),
          s('3b-5', CURL, 2, 10, 15, 1, 60),
          s('3b-6', PUSHDOWN, 2, 10, 15, 1, 60),
        ],
      },
      {
        id: '3c',
        naam: 'Training C',
        kort: 'C',
        focus: 'Benen, schuin drukken en roeien',
        slots: [
          s('3c-1', SPLIT, 3, 8, 12, 2, 120, 'Herhalingen per been.'),
          s('3c-2', SCHUIN, 3, 8, 12, 2, 120),
          s('3c-3', ROEIEN_DB, 3, 8, 12, 2, 120),
          s('3c-4', HIPTHRUST, 3, 8, 12, 2, 120),
          s('3c-5', FACEPULL, 2, 12, 20, 1, 60),
          s('3c-6', DRAGEN, 3, 30, 45, 2, 90, 'Seconden lopen met zware dumbbells.'),
        ],
      },
    ],
  },
  '4-dagen': {
    id: '4-dagen',
    naam: '4× per week: boven/onder',
    omschrijving:
      'Twee bovenlichaam- en twee onderlichaamtrainingen. Meer volume per spiergroep, elke spiergroep 2× per week, ±55-65 minuten per training.',
    dagen: [
      {
        id: '4o1',
        naam: 'Onder 1',
        kort: 'O1',
        focus: 'Squat',
        slots: [
          s('4o1-1', SQUAT, 3, 5, 8, 2, 180),
          s('4o1-2', RDL, 3, 8, 10, 2, 150),
          s('4o1-3', ['beenstrekken', 'goblet-squat'], 2, 12, 15, 1, 75),
          s('4o1-4', LEGCURL, 3, 10, 15, 1, 75),
          s('4o1-5', KUIT, 3, 10, 15, 1, 60),
          s('4o1-6', BUIK, 2, 10, 15, 2, 60),
        ],
      },
      {
        id: '4b1',
        naam: 'Boven 1',
        kort: 'B1',
        focus: 'Bankdrukken',
        slots: [
          s('4b1-1', BANK, 3, 5, 8, 2, 150),
          s('4b1-2', ROEIEN, 3, 8, 12, 2, 120),
          s('4b1-3', DB_OHP, 2, 8, 12, 2, 120),
          s('4b1-4', PULLDOWN, 2, 10, 12, 2, 90),
          s('4b1-5', ZIJ, 2, 12, 20, 1, 60),
          s('4b1-6', PUSHDOWN, 2, 10, 15, 1, 60),
          s('4b1-7', CURL, 2, 10, 15, 1, 60),
        ],
      },
      {
        id: '4o2',
        naam: 'Onder 2',
        kort: 'O2',
        focus: 'Deadlift',
        slots: [
          s('4o2-1', DEADLIFT, 3, 4, 6, 2, 180),
          s('4o2-2', LEGPRESS, 3, 10, 12, 2, 120),
          s('4o2-3', SPLIT, 2, 8, 12, 2, 90, 'Herhalingen per been.'),
          s('4o2-4', HIPTHRUST, 3, 8, 12, 2, 120),
          s('4o2-5', LEGCURL, 2, 10, 15, 1, 75),
          s('4o2-6', ANTIROTATIE, 2, 10, 12, 2, 60),
          s('4o2-7', DRAGEN, 2, 30, 45, 2, 90, 'Seconden lopen met zware dumbbells.'),
        ],
      },
      {
        id: '4b2',
        naam: 'Boven 2',
        kort: 'B2',
        focus: 'Drukken boven het hoofd',
        slots: [
          s('4b2-1', OHP, 3, 5, 8, 2, 150),
          s('4b2-2', OPTREKKEN, 3, 6, 10, 2, 120),
          s('4b2-3', SCHUIN, 3, 8, 12, 2, 120),
          s('4b2-4', ROEIEN_STEUN, 3, 8, 12, 2, 90),
          s('4b2-5', FACEPULL, 2, 12, 20, 1, 60),
          s('4b2-6', HAMER, 2, 10, 15, 1, 60),
          s('4b2-7', TRI_BOVEN, 2, 10, 15, 1, 60),
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
