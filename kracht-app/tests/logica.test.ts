import { describe, expect, it } from 'vitest';
import { blokInfo, kiesOefening, SCHEMAS, volgendeDag } from '../src/lib/schema';
import { berekenHerstel } from '../src/lib/herstel';
import { duurInUren, getal, leesCpapCsv, leesDatum, leesHealthAutoExport, leesOpdrachtJson, leesWillekeurig } from '../src/lib/importeren';
import { advies, e1rm, opwarmen, recordsIn } from '../src/lib/progressie';
import { leesBackup, legeStaat, maakBackup, maakTraining, setsCsv, voegDagdataToe } from '../src/lib/staat';
import { zoekOefening } from '../src/lib/oefeningen';
import { schijvenPerKant } from '../src/pages/Sessie';
import type { Staat, Training } from '../src/lib/types';

function staatMet(f: (s: Staat) => void = () => {}): Staat {
  const s = legeStaat();
  s.instellingen.onboardingKlaar = true;
  s.instellingen.blokStart = '2026-11-02';
  f(s);
  return s;
}

function klaar(s: Staat, dagId: string, datum: string, sets: Record<string, [number, number][]>): Training {
  const t = maakTraining(s, dagId, 'normaal', datum);
  t.start = `${datum}T18:00:00.000Z`;
  t.eind = `${datum}T19:00:00.000Z`;
  t.status = 'klaar';
  t.oefeningen = t.oefeningen.map((l) => ({
    ...l,
    sets: (sets[l.oefeningId] ?? []).map(([gewicht, reps]) => ({ gewicht, reps, rir: 2, klaar: true })),
  }));
  s.trainingen.push(t);
  return t;
}

describe('getallen en tijden lezen', () => {
  it('leest Nederlandse en Engelse notaties', () => {
    expect(getal('45,3 ms')).toBe(45.3);
    expect(getal('7.5')).toBe(7.5);
    expect(getal('12.345')).toBe(12.345);
    expect(getal('12.345.678')).toBe(12345678);
    expect(getal('1.234,5')).toBe(1234.5);
    expect(getal('58 count/min')).toBe(58);
    expect(getal(92.4)).toBe(92.4);
    expect(getal('geen')).toBeUndefined();
  });
  it('leest slaapduur in uren, minuten of seconden', () => {
    expect(duurInUren('7:30')).toBe(7.5);
    expect(duurInUren('7u15')).toBe(7.25);
    expect(duurInUren('6h 45m')).toBe(6.75);
    expect(duurInUren(420)).toBe(7);
    expect(duurInUren(25200)).toBe(7);
    expect(duurInUren('7,2')).toBe(7.2);
  });
  it('leest datums', () => {
    expect(leesDatum('2026-11-17')).toBe('2026-11-17');
    expect(leesDatum('2026-11-17 00:00:00 +0100')).toBe('2026-11-17');
    expect(leesDatum('17-11-2026')).toBe('2026-11-17');
    expect(leesDatum('11/17/2026')).toBe('2026-11-17');
    expect(leesDatum('05/11/2026')).toBe('2026-11-05');
  });
});

describe('importeren', () => {
  it('leest de JSON van de iOS-opdracht', () => {
    const r = leesOpdrachtJson('{"slaap":"25200","hrv":"45,3 ms","rusthartslag":"58","gewicht":"92,4 kg","vetpercentage":"0,22"}', '2026-11-17');
    expect(r.dagen).toEqual([{ datum: '2026-11-17', slaapUren: 7, hrv: 45.3, rustHartslag: 58, gewicht: 92.4, vetPct: 22 }]);
  });
  it('leest Health Auto Export', () => {
    const r = leesHealthAutoExport({
      data: {
        metrics: [
          { name: 'sleep_analysis', units: 'hr', data: [{ date: '2026-11-16 00:00:00 +0100', sleepEnd: '2026-11-17 06:40:00 +0100', totalSleep: 6.9, deep: 0.8, rem: 1.4, core: 4.7 }] },
          { name: 'heart_rate_variability', units: 'ms', data: [{ date: '2026-11-17 00:00:00 +0100', qty: 40 }, { date: '2026-11-17 00:00:00 +0100', qty: 50 }] },
          { name: 'step_count', units: 'count', data: [{ date: '2026-11-17 00:00:00 +0100', qty: 3000 }, { date: '2026-11-17 00:00:00 +0100', qty: 2000 }] },
          { name: 'weight_body_mass', units: 'kg', data: [{ date: '2026-11-17 07:00:00 +0100', qty: 91.8 }] },
        ],
      },
    });
    expect(r.dagen).toEqual([{ datum: '2026-11-17', slaapUren: 6.9, slaapDiep: 0.8, slaapRem: 1.4, slaapKern: 4.7, hrv: 45, stappen: 5000, gewicht: 91.8 }]);
  });
  it('leest een SleepHQ/OSCAR-CSV en schuift de nachtdatum op', () => {
    const csv = 'Date,Usage,AHI,Median Leak,Median Pressure\n2026-11-15,7:12,2.4,3.1,9.8\n2026-11-16,5:30,6.1,12.0,10.1\n';
    const r = leesCpapCsv(csv, true);
    expect(r.dagen).toEqual([
      { datum: '2026-11-16', cpapUren: 7.2, ahi: 2.4, lekkage: 3.1, druk: 9.8 },
      { datum: '2026-11-17', cpapUren: 5.5, ahi: 6.1, lekkage: 12, druk: 10.1 },
    ]);
    expect(leesCpapCsv(csv, false).dagen[0].datum).toBe('2026-11-15');
  });
  it('leest een Nederlandse CSV met puntkomma', () => {
    const r = leesWillekeurig('Datum;Gebruik (uren);AHI\n15-11-2026;6,5;1,8', '2026-11-17', false);
    expect(r.dagen).toEqual([{ datum: '2026-11-15', cpapUren: 6.5, ahi: 1.8 }]);
  });
  it('overschrijft handmatige waarden niet met een import', () => {
    let s = staatMet();
    s = voegDagdataToe(s, [{ datum: '2026-11-17', slaapUren: 7 }], 'handmatig').staat;
    s = voegDagdataToe(s, [{ datum: '2026-11-17', slaapUren: 5, hrv: 40 }], 'apple').staat;
    expect(s.dagdata['2026-11-17'].slaapUren).toBe(7);
    expect(s.dagdata['2026-11-17'].hrv).toBe(40);
    expect(s.dagdata['2026-11-17'].bronnen).toEqual({ slaapUren: 'handmatig', hrv: 'apple' });
  });
});

describe('schema', () => {
  it('kiest een alternatief als apparatuur ontbreekt', () => {
    const s = staatMet((x) => {
      x.instellingen.apparatuur.rek = false;
      x.instellingen.apparatuur.hacksquat = false;
    });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    expect(kiesOefening(slot, s.instellingen, []).oefening.id).toBe('smith-squat');
  });
  it('blok: week 1 instap, week 6 licht', () => {
    const s = staatMet();
    expect(blokInfo(s.instellingen, '2026-11-04')).toMatchObject({ blok: 1, week: 1, deload: false, rirExtra: 1 });
    expect(blokInfo(s.instellingen, '2026-12-09')).toMatchObject({ blok: 1, week: 6, deload: true });
    expect(blokInfo(s.instellingen, '2026-12-14')).toMatchObject({ blok: 2, week: 1 });
  });
  it('volgende training gaat door de rotatie', () => {
    const s = staatMet();
    expect(volgendeDag(s).id).toBe('3a');
    klaar(s, '3a', '2026-11-16', {});
    expect(volgendeDag(s).id).toBe('3b');
    klaar(s, '3b', '2026-11-18', {});
    klaar(s, '3c', '2026-11-20', {});
    expect(volgendeDag(s).id).toBe('3a');
  });
});

describe('progressie', () => {
  it('verhoogt het gewicht als alle sets op het maximum zitten', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[60, 8], [60, 8], [60, 8]] });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    const a = advies(s, slot, zoekOefening('squat')!, { rirExtra: 0, deload: false, aanpassing: 'normaal' });
    expect(a.gewicht).toBe(62.5);
  });
  it('houdt het gewicht als niet alle sets het maximum halen', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[60, 8], [60, 7], [60, 6]] });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    expect(advies(s, slot, zoekOefening('squat')!, { rirExtra: 0, deload: false, aanpassing: 'normaal' }).gewicht).toBe(60);
  });
  it('gaat 10% omlaag na twee keer onder het minimum', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[80, 4], [80, 4], [80, 3]] });
    klaar(s, '3a', '2026-11-12', { squat: [[80, 4], [80, 3], [80, 3]] });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    expect(advies(s, slot, zoekOefening('squat')!, { rirExtra: 0, deload: false, aanpassing: 'normaal' }).gewicht).toBe(72.5);
  });
  it('lichte week en herstelsessie verlagen sets en gewicht', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[100, 6], [100, 6], [100, 6]] });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    const deload = advies(s, slot, zoekOefening('squat')!, { rirExtra: 2, deload: true, aanpassing: 'normaal' });
    expect(deload).toMatchObject({ sets: 2, gewicht: 90 });
    const herstel = advies(s, slot, zoekOefening('squat')!, { rirExtra: 0, deload: false, aanpassing: 'herstel' });
    expect(herstel).toMatchObject({ sets: 2, gewicht: 85, rir: 4 });
  });
  it('na een lichte week weer verder op het gewicht van daarvoor', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-30', { squat: [[100, 8], [100, 8], [100, 8]] });
    const licht = klaar(s, '3a', '2026-12-09', { squat: [[90, 6], [90, 6]] });
    licht.deload = true;
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    expect(advies(s, slot, zoekOefening('squat')!, { rirExtra: 1, deload: false, aanpassing: 'normaal' }).gewicht).toBe(102.5);
  });
  it('dumbbells volgen de ingestelde stap', () => {
    const s = staatMet((x) => (x.instellingen.dumbbellStap = 2.5));
    klaar(s, '3b', '2026-11-09', { 'db-schouderdrukken': [[20, 10], [20, 10], [20, 10]] });
    const slot = SCHEMAS['3-dagen'].dagen[1].slots[1];
    expect(advies(s, slot, zoekOefening('db-schouderdrukken')!, { rirExtra: 0, deload: false, aanpassing: 'normaal' }).gewicht).toBe(22.5);
  });
  it('e1rm, opwarmen en schijven', () => {
    expect(e1rm(100, 5, 0)).toBeCloseTo(116.67, 1);
    expect(e1rm(100, 3, 2)).toBeCloseTo(116.67, 1);
    expect(opwarmen(100, zoekOefening('squat')!).map((x) => x.gewicht)).toEqual([20, 50, 70, 85]);
    expect(schijvenPerKant(100)).toEqual([25, 15]);
    expect(schijvenPerKant(62.5)).toEqual([20, 1.25]);
    expect(schijvenPerKant(20)).toEqual([]);
  });
  it('herkent records', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[60, 8]] });
    const t = klaar(s, '3a', '2026-11-12', { squat: [[65, 8]] });
    expect(recordsIn(s, t)).toHaveLength(1);
  });
});

describe('herstelscore', () => {
  it('groen bij een goede nacht', () => {
    const s = staatMet();
    s.dagdata['2026-11-17'] = { datum: '2026-11-17', slaapUren: 7.8, cpapUren: 7.5, ahi: 1.2, energie: 4, spierpijn: 2, stress: 2, bronnen: {}, bijgewerkt: '' };
    const h = berekenHerstel(s, '2026-11-17');
    expect(h.niveau).toBe('groen');
    expect(h.aanpassing).toBe('normaal');
  });
  it('rood bij een korte nacht met hoge AHI', () => {
    const s = staatMet();
    s.dagdata['2026-11-17'] = { datum: '2026-11-17', slaapUren: 4.5, cpapUren: 3, ahi: 22, energie: 2, spierpijn: 4, stress: 4, bronnen: {}, bijgewerkt: '' };
    const h = berekenHerstel(s, '2026-11-17');
    expect(h.niveau).toBe('rood');
    expect(h.aanpassing).toBe('herstel');
    expect(h.waarschuwingen.length).toBeGreaterThanOrEqual(2);
  });
  it('HRV telt mee ten opzichte van je eigen gemiddelde', () => {
    const s = staatMet();
    for (let i = 1; i <= 10; i++) {
      const d = `2026-11-${String(17 - i).padStart(2, '0')}`;
      s.dagdata[d] = { datum: d, hrv: 50, rustHartslag: 55, bronnen: {}, bijgewerkt: '' };
    }
    s.dagdata['2026-11-17'] = { datum: '2026-11-17', hrv: 35, rustHartslag: 63, bronnen: {}, bijgewerkt: '' };
    const h = berekenHerstel(s, '2026-11-17');
    expect(h.onderdelen.map((o) => o.sleutel)).toEqual(['hrv', 'rusthartslag']);
    expect(h.niveau).toBe('rood');
  });
  it('zonder gegevens: onbekend', () => {
    expect(berekenHerstel(staatMet(), '2026-11-17').niveau).toBe('onbekend');
  });
});

describe('back-up en export', () => {
  it('back-up gaat heen en terug', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[60, 8]] });
    const terug = leesBackup(JSON.stringify(maakBackup(s)));
    expect(terug.trainingen).toHaveLength(1);
    expect(() => leesBackup('{"iets":1}')).toThrow();
  });
  it('CSV met puntkomma en komma-decimaal', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[62.5, 8]] });
    const csv = setsCsv(s).split('\n');
    expect(csv[0]).toBe('datum;training;oefening;set;gewicht_kg;herhalingen;rir;geschat_1rm;notitie');
    expect(csv[1]).toContain('Squat (stang);1;62,5;8;2;');
  });
});
