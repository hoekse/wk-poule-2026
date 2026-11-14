// Eenvoudige tekstvergelijking zonder taalmodel. Wordt gebruikt als snelle
// eerste stap (bijna letterlijke vraag = geen taalmodel nodig) en als
// terugvaloptie wanneer er geen Anthropic-sleutel is of Claude niet reageert.

import type { Item } from './antwoorden';

export function normaliseer(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function bigrammen(s: string): Map<string, number> {
  const m = new Map<string, number>();
  const t = ` ${s} `;
  for (let i = 0; i < t.length - 1; i++) {
    const b = t.slice(i, i + 2);
    m.set(b, (m.get(b) ?? 0) + 1);
  }
  return m;
}

function dice<T>(a: Map<T, number>, b: Map<T, number>): number {
  let totaal = 0;
  let gedeeld = 0;
  for (const n of a.values()) totaal += n;
  for (const n of b.values()) totaal += n;
  for (const [k, n] of a) gedeeld += Math.min(n, b.get(k) ?? 0);
  return totaal === 0 ? 0 : (2 * gedeeld) / totaal;
}

function woorden(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of s.split(' ').filter(Boolean)) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
}

/** Gelijkenis tussen 0 en 1. */
export function gelijkenis(a: string, b: string): number {
  const na = normaliseer(a);
  const nb = normaliseer(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  return 0.5 * dice(woorden(na), woorden(nb)) + 0.5 * dice(bigrammen(na), bigrammen(nb));
}

export function besteLokaal(tekst: string, items: Item[]): { item: Item; score: number } | null {
  let beste: { item: Item; score: number } | null = null;
  for (const item of items) {
    for (const vraag of item.vragen) {
      const score = gelijkenis(tekst, vraag);
      if (!beste || score > beste.score) beste = { item, score };
    }
  }
  return beste;
}
