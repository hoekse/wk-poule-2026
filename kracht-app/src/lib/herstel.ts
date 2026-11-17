import { plusDagen } from './datum';
import type { Aanpassing, Dagdata, Datum, Staat } from './types';

export interface Onderdeel {
  sleutel: 'slaap' | 'cpap' | 'hrv' | 'rusthartslag' | 'gevoel';
  naam: string;
  score: number;
  gewicht: number;
  toelichting: string;
}

export interface Herstel {
  score: number | null;
  niveau: 'groen' | 'oranje' | 'rood' | 'onbekend';
  aanpassing: Aanpassing;
  kop: string;
  advies: string;
  onderdelen: Onderdeel[];
  waarschuwingen: string[];
}

const klem = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const gem = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Gemiddelde van een veld over de 30 dagen vóór een datum (minimaal 5 metingen). */
export function basislijn(staat: Staat, datum: Datum, veld: 'hrv' | 'rustHartslag'): number | null {
  const waarden: number[] = [];
  for (let i = 1; i <= 30; i++) {
    const v = staat.dagdata[plusDagen(datum, -i)]?.[veld];
    if (typeof v === 'number' && v > 0) waarden.push(v);
  }
  return waarden.length >= 5 ? gem(waarden) : null;
}

export function ahiScore(ahi: number): number {
  if (ahi <= 5) return 100;
  if (ahi <= 15) return 100 - (ahi - 5) * 4;
  return klem(60 - (ahi - 15) * 3, 15);
}

export function cpapGebruikScore(uren: number): number {
  if (uren >= 6) return 100;
  if (uren >= 4) return 70 + ((uren - 4) / 2) * 30;
  return klem((uren / 4) * 70, 5);
}

export function berekenHerstel(staat: Staat, datum: Datum): Herstel {
  const d: Partial<Dagdata> = staat.dagdata[datum] ?? {};
  const doel = staat.instellingen.slaapDoel;
  const onderdelen: Onderdeel[] = [];
  const waarschuwingen: string[] = [];

  const slaap = d.slaapUren ?? d.cpapUren;
  if (typeof slaap === 'number') {
    const tekort = Math.max(0, doel - slaap);
    onderdelen.push({
      sleutel: 'slaap',
      naam: 'Slaap',
      score: klem(100 - tekort * 25),
      gewicht: 25,
      toelichting: `${uurMin(slaap)} geslapen${d.slaapUren == null ? ' (CPAP-tijd)' : ''}, doel ${uurMin(doel)}`,
    });
  }

  if (typeof d.ahi === 'number' || typeof d.cpapUren === 'number') {
    const delen: number[] = [];
    const tekst: string[] = [];
    if (typeof d.ahi === 'number') {
      delen.push(ahiScore(d.ahi));
      tekst.push(`AHI ${fmt1(d.ahi)}`);
      if (d.ahi > 10) waarschuwingen.push(`AHI ${fmt1(d.ahi)} is hoger dan normaal. Controleer masker en lekkage; blijft het hoog, overleg met je slaapcentrum.`);
    }
    if (typeof d.cpapUren === 'number') {
      delen.push(cpapGebruikScore(d.cpapUren));
      tekst.push(`${uurMin(d.cpapUren)} masker op`);
      if (d.cpapUren < 4) waarschuwingen.push('Minder dan 4 uur CPAP vannacht. Een korte nacht met apneus kost herstel: houd het vandaag rustiger.');
    }
    onderdelen.push({ sleutel: 'cpap', naam: 'CPAP', score: Math.min(...delen) * 0.6 + gem(delen) * 0.4, gewicht: 25, toelichting: tekst.join(', ') });
  }

  if (typeof d.hrv === 'number') {
    const basis = basislijn(staat, datum, 'hrv');
    if (basis) {
      const verhouding = d.hrv / basis;
      onderdelen.push({
        sleutel: 'hrv',
        naam: 'Hartslagvariabiliteit',
        score: klem(100 + (verhouding - 1.03) * 350),
        gewicht: 20,
        toelichting: `${Math.round(d.hrv)} ms (normaal ${Math.round(basis)} ms)`,
      });
    }
  }

  if (typeof d.rustHartslag === 'number') {
    const basis = basislijn(staat, datum, 'rustHartslag');
    if (basis) {
      const verschil = d.rustHartslag - basis;
      onderdelen.push({
        sleutel: 'rusthartslag',
        naam: 'Rusthartslag',
        score: klem(100 - Math.max(0, verschil - 1) * 12),
        gewicht: 10,
        toelichting: `${Math.round(d.rustHartslag)} slagen/min (normaal ${Math.round(basis)})`,
      });
      if (verschil >= 7) waarschuwingen.push('Je rusthartslag is flink hoger dan normaal. Word je ziek? Neem dan liever rust.');
    }
  }

  if (d.energie || d.spierpijn || d.stress) {
    const delen: number[] = [];
    if (d.energie) delen.push(((d.energie - 1) / 4) * 100);
    if (d.spierpijn) delen.push(((5 - d.spierpijn) / 4) * 100);
    if (d.stress) delen.push(((5 - d.stress) / 4) * 100);
    let score = gem(delen);
    if (d.zwareWerkdag) score -= 10;
    onderdelen.push({
      sleutel: 'gevoel',
      naam: 'Hoe je je voelt',
      score: klem(score),
      gewicht: 20,
      toelichting: [d.energie && `energie ${d.energie}/5`, d.spierpijn && `spierpijn ${d.spierpijn}/5`, d.stress && `stress ${d.stress}/5`, d.zwareWerkdag && 'zware werkdag']
        .filter(Boolean)
        .join(', '),
    });
  }
  if (d.pijn) waarschuwingen.push(`Pijn gemeld: "${d.pijn}". Sla oefeningen over die pijn doen of kies een alternatief.`);

  if (!onderdelen.length) {
    return {
      score: null,
      niveau: 'onbekend',
      aanpassing: 'normaal',
      kop: 'Nog geen gegevens van vannacht',
      advies: 'Doe de ochtendcheck of haal je gegevens op uit Apple Health. Dan weet je hoe zwaar je vandaag kunt trainen.',
      onderdelen,
      waarschuwingen,
    };
  }

  const totaalGewicht = onderdelen.reduce((s, o) => s + o.gewicht, 0);
  const score = Math.round(onderdelen.reduce((s, o) => s + o.score * o.gewicht, 0) / totaalGewicht);
  if (score >= 75) {
    return { score, niveau: 'groen', aanpassing: 'normaal', kop: 'Goed hersteld', advies: 'Train volgens schema. Ga voor de geplande gewichten.', onderdelen, waarschuwingen };
  }
  if (score >= 55) {
    return {
      score,
      niveau: 'oranje',
      aanpassing: 'licht',
      kop: 'Matig hersteld',
      advies: 'Train wel, maar iets lichter: 1 set minder per oefening en houd een herhaling extra over.',
      onderdelen,
      waarschuwingen,
    };
  }
  return {
    score,
    niveau: 'rood',
    aanpassing: 'herstel',
    kop: 'Slecht hersteld',
    advies: 'Neem rust of doe een korte herstelsessie (2 rustige sets, 15% lichter). Een wandeling van 30 minuten is ook prima.',
    onderdelen,
    waarschuwingen,
  };
}

export function uurMin(uren: number): string {
  const h = Math.floor(uren);
  const m = Math.round((uren - h) * 60);
  if (m === 60) return `${h + 1}u00`;
  return `${h}u${String(m).padStart(2, '0')}`;
}

export function fmt1(n: number): string {
  return n.toLocaleString('nl-NL', { maximumFractionDigits: 1 });
}
