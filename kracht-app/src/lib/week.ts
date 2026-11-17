import { kortDatum, plusDagen } from './datum';
import { fmt1, odiVan, uurMin } from './herstel';
import { gewichtsTempo } from './lichaam';
import { zoekOefening } from './oefeningen';
import { aantalWerkSets, recordsIn, tonnage, werkSets } from './progressie';
import type { Datum, Staat } from './types';

export interface WeekSamenvatting {
  maandag: Datum;
  zondag: Datum;
  trainingen: number;
  gepland: number;
  sets: number;
  tonnage: number;
  intervalMinuten: number;
  records: { naam: string; detail: string }[];
  slaap: number | null;
  cpap: number | null;
  ahi: number | null;
  spo2Min: number | null;
  odi: number | null;
  hrv: number | null;
  rustHartslag: number | null;
  stappen: number | null;
  eiwit: number | null;
  gewichtVan: number | null;
  gewichtTot: number | null;
  tempoTekst: string | null;
}

const gemOfNull = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function weekSamenvatting(staat: Staat, maandag: Datum): WeekSamenvatting {
  const zondag = plusDagen(maandag, 6);
  const binnen = (d: Datum) => d >= maandag && d <= zondag;
  const trainingen = staat.trainingen.filter((t) => t.status === 'klaar' && binnen(t.datum));
  const dagen = Object.values(staat.dagdata).filter((d) => binnen(d.datum));
  const veld = (f: (d: (typeof dagen)[number]) => number | undefined) => gemOfNull(dagen.map(f).filter((x): x is number => typeof x === 'number'));
  const gewichten = [
    ...dagen.filter((d) => d.gewicht).map((d) => ({ datum: d.datum, kg: d.gewicht! })),
    ...staat.metingen.filter((m) => m.gewicht && binnen(m.datum)).map((m) => ({ datum: m.datum, kg: m.gewicht! })),
  ].sort((a, b) => a.datum.localeCompare(b.datum));
  const intervalSec = trainingen
    .flatMap((t) => t.oefeningen.filter((l) => zoekOefening(l.oefeningId, staat.eigenOefeningen)?.spieren[0] === 'conditie'))
    .reduce((som, l) => som + werkSets(l).reduce((a, x) => a + (x.reps ?? 0), 0), 0);
  return {
    maandag,
    zondag,
    trainingen: trainingen.length,
    gepland: staat.instellingen.trainingsdagen.length,
    sets: trainingen.reduce((n, t) => n + aantalWerkSets(t), 0),
    tonnage: Math.round(trainingen.reduce((n, t) => n + tonnage(t), 0)),
    intervalMinuten: Math.round((intervalSec / 60) * 10) / 10,
    records: trainingen.flatMap((t) =>
      recordsIn(staat, t).map((r) => ({ naam: zoekOefening(r.oefeningId, staat.eigenOefeningen)?.naam ?? r.oefeningId, detail: r.detail })),
    ),
    slaap: veld((d) => d.slaapUren),
    cpap: veld((d) => d.cpapUren),
    ahi: veld((d) => d.ahi),
    spo2Min: veld((d) => d.spo2Min),
    odi: veld((d) => odiVan(d)),
    hrv: veld((d) => d.hrv),
    rustHartslag: veld((d) => d.rustHartslag),
    stappen: veld((d) => d.stappen),
    eiwit: veld((d) => d.eiwit),
    gewichtVan: gewichten[0]?.kg ?? null,
    gewichtTot: gewichten.length > 1 ? gewichten[gewichten.length - 1].kg : null,
    tempoTekst: gewichtsTempo(staat, zondag)?.tekst ?? null,
  };
}

/** Korte tekst om te delen (bijv. naar jezelf of een trainer). */
export function weekTekst(w: WeekSamenvatting): string {
  const r: string[] = [`Kracht – week ${kortDatum(w.maandag)} t/m ${kortDatum(w.zondag)}`, ''];
  r.push(`Trainingen: ${w.trainingen}/${w.gepland} · ${w.sets} sets · ${w.tonnage.toLocaleString('nl-NL')} kg verplaatst`);
  if (w.intervalMinuten) r.push(`Intervallen: ${fmt1(w.intervalMinuten)} min voluit`);
  if (w.records.length) r.push(`Records: ${w.records.map((x) => x.naam).join(', ')}`);
  const nacht = [
    w.slaap != null && `slaap ${uurMin(w.slaap)}`,
    w.cpap != null && `CPAP ${uurMin(w.cpap)}`,
    w.ahi != null && `AHI ${fmt1(w.ahi)}`,
    w.spo2Min != null && `laagste SpO₂ ${Math.round(w.spo2Min)}%`,
    w.hrv != null && `HRV ${Math.round(w.hrv)} ms`,
  ].filter(Boolean);
  if (nacht.length) r.push(`Gemiddeld per nacht: ${nacht.join(', ')}`);
  if (w.gewichtVan != null && w.gewichtTot != null) r.push(`Gewicht: ${fmt1(w.gewichtVan)} → ${fmt1(w.gewichtTot)} kg`);
  if (w.stappen != null) r.push(`Stappen: gemiddeld ${Math.round(w.stappen).toLocaleString('nl-NL')} per dag`);
  if (w.eiwit != null) r.push(`Eiwit: gemiddeld ${Math.round(w.eiwit)} g per dag`);
  return r.join('\n');
}
