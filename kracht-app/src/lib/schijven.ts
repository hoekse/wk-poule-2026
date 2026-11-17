import type { Instellingen, Oefening } from './types';

export const ALLE_SCHIJVEN: { kg: number; kleur: string }[] = [
  { kg: 25, kleur: '#e5484d' },
  { kg: 20, kleur: '#3d7bea' },
  { kg: 15, kleur: '#f2b705' },
  { kg: 10, kleur: '#3fa34d' },
  { kg: 5, kleur: 'var(--schijf-wit)' },
  { kg: 2.5, kleur: '#9aa0a8' },
  { kg: 1.25, kleur: '#c9cdd3' },
];

export const STANDAARD_SCHIJVEN = ALLE_SCHIJVEN.map((s) => s.kg);

export function schijfKleur(kg: number): string {
  return ALLE_SCHIJVEN.find((s) => s.kg === kg)?.kleur ?? '#9aa0a8';
}

/** Schijven per kant voor een totaalgewicht; null als het met deze schijven niet precies kan. */
export function schijvenPerKant(totaal: number, stang = 20, beschikbaar: number[] = STANDAARD_SCHIJVEN): number[] | null {
  let rest = (totaal - stang) / 2;
  if (rest < 0) return null;
  const uit: number[] = [];
  for (const kg of [...beschikbaar].sort((a, b) => b - a)) {
    while (rest >= kg - 1e-9) {
      uit.push(kg);
      rest -= kg;
    }
  }
  return rest > 0.01 ? null : uit;
}

/** Kleinste schijf die er ligt. */
export function kleinsteSchijf(inst?: Pick<Instellingen, 'schijven'>): number {
  const s = inst?.schijven?.length ? inst.schijven : STANDAARD_SCHIJVEN;
  return Math.min(...s);
}

/** Welke schijven erop moeten: halterstang (per kant), plate-loaded machine (per kant) of T-bar (één kant). */
export function schijvenVoor(
  oef: Oefening,
  gewicht: number,
  inst?: Pick<Instellingen, 'schijven' | 'stangGewicht'>,
): { kop: string; schijven: number[]; leeg: string } | null {
  const beschikbaar = inst?.schijven?.length ? inst.schijven : STANDAARD_SCHIJVEN;
  const stang = inst?.stangGewicht ?? 20;
  if (oef.gewichtType === 'totaal' && oef.apparaat.includes('stang')) {
    const s = schijvenPerKant(gewicht, stang, beschikbaar);
    return s && { kop: 'Per kant:', schijven: s, leeg: `alleen de stang (${stang} kg)` };
  }
  if (oef.gewichtType === 'schijven') {
    const eenzijdig = oef.id === 'tbar-roeien';
    const s = schijvenPerKant(eenzijdig ? gewicht * 2 : gewicht, 0, beschikbaar);
    return s && { kop: eenzijdig ? 'Op de stang:' : 'Per kant:', schijven: s, leeg: 'geen schijven' };
  }
  return null;
}
