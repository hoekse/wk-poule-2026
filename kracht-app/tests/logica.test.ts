import { describe, expect, it } from 'vitest';
import { blokInfo, kiesOefening, SCHEMAS, volgendeDag } from '../src/lib/schema';
import { berekenHerstel } from '../src/lib/herstel';
import { duurInUren, getal, leesCpapCsv, leesDatum, leesHealthAutoExport, leesOpdrachtJson, leesTijdstip, leesWillekeurig, vatZuurstofSamen } from '../src/lib/importeren';
import { eiwitAdvies, gewichtsTempo } from '../src/lib/lichaam';
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
    klaar(s, '3a', '2026-11-09', { squat: [[100, 6], [100, 6], [100, 6], [100, 6]] });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    const a = advies(s, slot, zoekOefening('squat')!, { rirExtra: 0, deload: false, aanpassing: 'normaal' });
    expect(a).toMatchObject({ gewicht: 102.5, sets: 4, repMin: 4, repMax: 6 });
  });
  it('houdt het gewicht als niet alle sets het maximum halen', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[60, 6], [60, 6], [60, 5], [60, 5]] });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    expect(advies(s, slot, zoekOefening('squat')!, { rirExtra: 0, deload: false, aanpassing: 'normaal' }).gewicht).toBe(60);
  });
  it('gaat 10% omlaag na twee keer onder het minimum', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[80, 4], [80, 4], [80, 3], [80, 3]] });
    klaar(s, '3a', '2026-11-12', { squat: [[80, 4], [80, 3], [80, 3], [80, 3]] });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    expect(advies(s, slot, zoekOefening('squat')!, { rirExtra: 0, deload: false, aanpassing: 'normaal' }).gewicht).toBe(72.5);
  });
  it('lichte week en herstelsessie verlagen sets en gewicht', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { squat: [[100, 5], [100, 5], [100, 5], [100, 5]] });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    const deload = advies(s, slot, zoekOefening('squat')!, { rirExtra: 2, deload: true, aanpassing: 'normaal' });
    expect(deload).toMatchObject({ sets: 3, gewicht: 90 });
    const herstel = advies(s, slot, zoekOefening('squat')!, { rirExtra: 0, deload: false, aanpassing: 'herstel' });
    expect(herstel).toMatchObject({ sets: 2, gewicht: 85, rir: 4 });
  });
  it('na een lichte week weer verder op het gewicht van daarvoor', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-30', { squat: [[100, 6], [100, 6], [100, 6], [100, 6]] });
    const licht = klaar(s, '3a', '2026-12-09', { squat: [[90, 6], [90, 6]] });
    licht.deload = true;
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[0];
    expect(advies(s, slot, zoekOefening('squat')!, { rirExtra: 1, deload: false, aanpassing: 'normaal' }).gewicht).toBe(102.5);
  });
  it('dumbbells volgen de ingestelde stap', () => {
    const s = staatMet((x) => {
      x.instellingen.dumbbellStap = 2.5;
      x.instellingen.keuzes['3b-2'] = 'db-schouderdrukken';
    });
    klaar(s, '3b', '2026-11-09', { 'db-schouderdrukken': [[20, 6], [20, 6], [20, 6], [20, 6]] });
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

describe('O2Ring', () => {
  it('leest tijdstippen in ViHealth-notaties', () => {
    const a = leesTijdstip('22:15:04 16/11/2026')!;
    const b = leesTijdstip('10:15:04 PM Nov 16, 2026')!;
    const c = leesTijdstip('2026-11-16 22:15:04')!;
    expect(new Date(a).getHours()).toBe(22);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
  it('rekent een nacht om: gemiddelde, laagste, dips, tijd onder 90%', () => {
    // 2 uur met elke 4 seconden een meting; 6 dips van 30 seconden naar 89%.
    const spo2: number[] = [];
    for (let i = 0; i < 1800; i++) spo2.push(i % 300 >= 200 && i % 300 < 208 ? 89 : 96);
    spo2[50] = 80; // losse meetfout: telt niet als laagste
    const n = vatZuurstofSamen(spo2, 4)!;
    expect(n.uren).toBe(2);
    expect(n.spo2Min).toBe(89);
    expect(n.dips).toBe(6);
    expect(n.odi).toBe(3);
    expect(n.onder90).toBe(3);
  });
  it('importeert een O2Ring-CSV en zet de datum op de ochtend', () => {
    const regels = ['Time,Oxygen Level,Pulse Rate,Motion'];
    const start = new Date(2026, 10, 16, 23, 0, 0).getTime();
    for (let i = 0; i < 900; i++) {
      const t = new Date(start + i * 4000);
      const tijd = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`;
      const datum = `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}/${t.getFullYear()}`;
      regels.push(`${tijd} ${datum},${i === 10 ? '--' : 95},${60},0`);
    }
    const r = leesWillekeurig(regels.join('\n'), '2026-11-20');
    expect(r.bron).toBe('o2ring');
    expect(r.dagen).toEqual([{ datum: '2026-11-17', spo2Gem: 95, spo2Min: 95, dips: 0, odi: 0, onder90: 0, polsNacht: 60 }]);
  });
  it('zuurstof telt mee in de herstelscore en waarschuwt', () => {
    const s = staatMet();
    s.dagdata['2026-11-17'] = { datum: '2026-11-17', slaapUren: 7.5, spo2Min: 82, dips: 90, bronnen: {}, bijgewerkt: '' };
    const h = berekenHerstel(s, '2026-11-17');
    expect(h.onderdelen.find((o) => o.sleutel === 'zuurstof')?.toelichting).toBe('laagste 82%, 12 dips per uur');
    expect(h.waarschuwingen).toHaveLength(2);
  });
  it('Apple Health-zuurstof als fractie en lege nullen uit de opdracht', () => {
    const r = leesOpdrachtJson('{"spo2_min":"0,91","hrv":"0","rusthartslag":"","stappen":"0"}', '2026-11-17');
    expect(r.dagen).toEqual([{ datum: '2026-11-17', spo2Min: 91, stappen: 0 }]);
  });
});

describe('aftrainen en conditie', () => {
  it('gewichtstempo uit de laatste 4 weken', () => {
    const s = staatMet();
    for (let i = 0; i < 28; i += 2) {
      const d = `2026-${i < 13 ? '10' : '11'}-${String(i < 13 ? 20 + i : i - 11).padStart(2, '0')}`;
      s.dagdata[d] = { datum: d, gewicht: 95 - i * 0.07, bronnen: {}, bijgewerkt: '' };
    }
    const t = gewichtsTempo(s, '2026-11-17')!;
    expect(t.kgPerWeek).toBeCloseTo(-0.49, 1);
    expect(t.oordeel).toBe('goed');
    expect(eiwitAdvies(93)).toEqual({ van: 165, tot: 205 });
  });
  it('intervallen: zonder gewicht, seconden omhoog', () => {
    const s = staatMet();
    klaar(s, '3a', '2026-11-09', { intervallen: Array.from({ length: 6 }, () => [null as unknown as number, 25] as [number, number]) });
    const slot = SCHEMAS['3-dagen'].dagen[0].slots[5];
    const a = advies(s, slot, zoekOefening('intervallen')!, { rirExtra: 0, deload: false, aanpassing: 'normaal' });
    expect(a.sets).toBe(6);
    expect(a.uitleg).toContain('Vorige keer: 25s, 25s');
    expect(a.uitleg).toContain('1 seconde meer');
  });
});
