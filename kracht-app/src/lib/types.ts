/** Datum zonder tijd in lokale tijd: 'JJJJ-MM-DD'. */
export type Datum = string;

export type Spiergroep =
  | 'borst'
  | 'rug'
  | 'schouders'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'hamstrings'
  | 'billen'
  | 'kuiten'
  | 'romp'
  | 'onderrug'
  | 'grip'
  | 'conditie';

export type ApparaatId =
  | 'stang'
  | 'rek'
  | 'bank'
  | 'dumbbells'
  | 'kabel'
  | 'latpulldown'
  | 'roeimachine'
  | 'legpress'
  | 'hacksquat'
  | 'smith'
  | 'beenstrekker'
  | 'beenbuiger'
  | 'borstpress'
  | 'schouderpress'
  | 'pecdeck'
  | 'hipthrust'
  | 'trapbar'
  | 'optrekstang'
  | 'rugstrekbank'
  | 'kuitmachine'
  | 'kettlebell'
  | 'cardio'
  | 'plate-borst'
  | 'plate-schuin'
  | 'plate-schouder'
  | 'plate-roei'
  | 'plate-highrow'
  | 'plate-pulldown'
  | 'tbar'
  | 'pendulum'
  | 'pan-chest'
  | 'pan-incline'
  | 'pan-shoulder'
  | 'pan-pulldown'
  | 'pan-lowrow'
  | 'pan-highrow'
  | 'pan-tbar'
  | 'pan-hack'
  | 'pan-pendulum'
  | 'pan-legpress'
  | 'pan-hipthrust'
  | 'pan-calf'
  | 'pan-legext'
  | 'pan-legcurl'
  | 'pan-pecdeck'
  | 'pan-lateral'
  | 'pan-biceps'
  | 'pan-triceps'
  | 'pan-abs'
  | 'pan-pullover';

/** Hoe het gewicht van een oefening wordt genoteerd. */
/** schijven = plate-loaded machine: totaal aan schijven, de machine zelf telt niet mee. */
export type GewichtType = 'totaal' | 'per-hand' | 'stapel' | 'lichaamsgewicht' | 'schijven' | 'geen';

export interface Oefening {
  id: string;
  naam: string;
  /** Eerste spiergroep is de hoofdspier. */
  spieren: Spiergroep[];
  /** Alles wat nodig is (alle items moeten aanwezig zijn). */
  apparaat: ApparaatId[];
  soort: 'basis' | 'hulp' | 'romp';
  gewichtType: GewichtType;
  /** Kleinste zinvolle gewichtsstap in kg. */
  stap: number;
  /** Per arm/been uitgevoerd: herhalingen gelden per kant. */
  perKant?: boolean;
  /** Korte uitvoeringstips. */
  tips: string[];
  /** Zelf toegevoegd door de gebruiker. */
  eigen?: boolean;
  /** Uitgewerkt voorbeeld: instellen, startpositie, beweging, fouten en voorbeeld-sets. */
  voorbeeld?: Voorbeeld;
  /** Zoekterm voor voorbeeldvideo's. */
  video?: string;
}

export interface Voorbeeld {
  instelling?: string;
  start: string;
  beweging: string;
  fouten: string[];
  sets?: string;
}

export interface Slot {
  id: string;
  /** Oefeningen op volgorde van voorkeur; de eerste die met de aanwezige apparatuur kan, wordt gekozen. */
  oefeningen: string[];
  sets: number;
  repMin: number;
  repMax: number;
  /** Doel: zoveel herhalingen 'over' (Reps In Reserve). */
  rir: number;
  /** Rusttijd in seconden. */
  rust: number;
  notitie?: string;
  /** Opeenvolgende slots met dezelfde letter doe je als superset (om en om). */
  superset?: string;
}

export interface Trainingsdag {
  id: string;
  naam: string;
  kort: string;
  focus: string;
  slots: Slot[];
}

export interface Schema {
  id: SchemaId;
  naam: string;
  omschrijving: string;
  dagen: Trainingsdag[];
}

export type SchemaId = '3-dagen' | '4-dagen';

export interface Instellingen {
  naam: string;
  onboardingKlaar: boolean;
  schemaId: SchemaId;
  /** Trainingsdagen in de week: 1 = maandag … 7 = zondag. */
  trainingsdagen: number[];
  /** Maandag van de week waarin het blok begon. */
  blokStart: Datum;
  apparatuur: Record<ApparaatId, boolean>;
  /** Per slot een vaste oefeningkeuze van de gebruiker. */
  keuzes: Record<string, string>;
  /** Zelf aangepaste trainingsdagen (overschrijven het standaardschema). */
  aangepasteDagen: Record<string, Trainingsdag>;
  /** Stap voor dumbbells in kg (FitButiq: meestal 2 of 2,5). */
  dumbbellStap: number;
  slaapDoel: number;
  geluid: boolean;
  trillen: boolean;
  /** Naam van de iOS-opdracht voor Apple Health. */
  opdrachtNaam: string;
  laatsteBackup?: string;
  /** Stoelstand, rugleuning, handgreep enz. per oefening. */
  machineInstellingen: Record<string, string>;
  /** Supersets uit het schema gebruiken. */
  supersets: boolean;
  /** Schijven die bij FitButiq liggen (kg). */
  schijven: number[];
  /** Gewicht van de halterstang. */
  stangGewicht: number;
  /** Tijd waarop je meestal traint, voor de agenda ('18:00'). */
  trainingstijd: string;
  /** Maandag van de week waarin je het advies voor een lichte week hebt weggeklikt. */
  deloadAdviesWeg?: Datum;
  /** Supabase-cloud: laatst gesynchroniseerd. */
  laatsteSync?: string;
}

export interface SetLog {
  gewicht: number | null;
  reps: number | null;
  rir: number | null;
  klaar: boolean;
}

export interface OefeningLog {
  slotId: string;
  oefeningId: string;
  doel: {
    sets: number;
    repMin: number;
    repMax: number;
    rir: number;
    rust: number;
    gewicht: number | null;
    uitleg: string;
  };
  sets: SetLog[];
  notitie?: string;
  overgeslagen?: boolean;
  /** Superset-letter: om en om met de andere oefening(en) met dezelfde letter. */
  superset?: string;
  /** Extra toegevoegd (bijv. face pulls na werk boven je hoofd). */
  extra?: boolean;
}

export type Aanpassing = 'normaal' | 'licht' | 'herstel';

export interface Training {
  id: string;
  datum: Datum;
  schemaId: SchemaId;
  dagId: string;
  dagNaam: string;
  blokWeek: number;
  deload: boolean;
  aanpassing: Aanpassing;
  herstelScore: number | null;
  start: string;
  eind?: string;
  status: 'bezig' | 'klaar';
  oefeningen: OefeningLog[];
  /** Zwaarte van de hele training, 1-10. */
  zwaarte?: number;
  notitie?: string;
  /** Afgevinkte onderdelen van de opwarmroutine. */
  opwarming?: number[];
  /** Training is aangepast omdat je gisteren veel boven je hoofd werkte. */
  schoudersOntzien?: boolean;
}

export type Bron = 'apple' | 'hae' | 'sleephq' | 'prisma' | 'o2ring' | 'csv' | 'handmatig';

export interface Dagdata {
  /** Ochtend waarop je wakker werd. */
  datum: Datum;
  // Apple Health
  slaapUren?: number;
  slaapDiep?: number;
  slaapRem?: number;
  slaapKern?: number;
  slaapWakker?: number;
  hrv?: number;
  rustHartslag?: number;
  stappen?: number;
  actieveKcal?: number;
  gewicht?: number;
  vetPct?: number;
  vo2max?: number;
  ademhalingsstoornissen?: number;
  // CPAP (prisma / SleepHQ)
  cpapUren?: number;
  ahi?: number;
  lekkage?: number;
  druk?: number;
  // Zuurstof 's nachts (O2Ring, of Apple Watch via Apple Health)
  spo2Gem?: number;
  spo2Min?: number;
  /** Zuurstofdips (≥ 4%) per uur. */
  odi?: number;
  /** Aantal zuurstofdips (≥ 4%) in de nacht, zoals de ViHealth-app ze toont. */
  dips?: number;
  /** Minuten onder 90% zuurstof. */
  onder90?: number;
  polsNacht?: number;
  // Ochtendcheck
  energie?: number;
  spierpijn?: number;
  stress?: number;
  zwareWerkdag?: boolean;
  /** Gisteren veel boven je hoofd gewerkt (plafonds, hoge muren). */
  bovenHoofd?: boolean;
  pijn?: string;
  /** Gegeten eiwit in gram. */
  eiwit?: number;
  bronnen: Partial<Record<DagVeld, Bron>>;
  bijgewerkt: string;
}

export type DagVeld = Exclude<keyof Dagdata, 'datum' | 'bronnen' | 'bijgewerkt'>;

export interface Meting {
  id: string;
  datum: Datum;
  gewicht?: number;
  vetPct?: number;
  taille?: number;
  heup?: number;
  borst?: number;
  arm?: number;
  dij?: number;
  notitie?: string;
}

export interface Staat {
  versie: 1;
  instellingen: Instellingen;
  trainingen: Training[];
  dagdata: Record<Datum, Dagdata>;
  metingen: Meting[];
  eigenOefeningen: Oefening[];
  /** Voortgangsfoto's; de afbeeldingen zelf staan apart in IndexedDB. */
  fotos: FotoMeta[];
}

export type FotoHouding = 'voor' | 'zij' | 'achter';

export interface FotoMeta {
  id: string;
  datum: Datum;
  houding: FotoHouding;
}
