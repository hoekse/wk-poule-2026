import { normaliseer } from './staat';
import type { Dagdata, Staat } from './types';

/**
 * Voegt de staat uit de cloud samen met die op dit apparaat.
 * Trainingen, metingen en eigen oefeningen: samen (bij hetzelfde id wint dit apparaat, behalve een afgeronde
 * training tegenover een lopende). Dagdata: per veld de nieuwste. Instellingen en foto's: dit apparaat.
 */
export function voegSamen(lokaal: Staat, cloud: Staat): Staat {
  const trainingen = new Map(cloud.trainingen.map((t) => [t.id, t]));
  for (const t of lokaal.trainingen) {
    const c = trainingen.get(t.id);
    trainingen.set(t.id, c && c.status === 'klaar' && t.status === 'bezig' ? c : t);
  }
  const dagdata: Record<string, Dagdata> = { ...cloud.dagdata };
  for (const [datum, l] of Object.entries(lokaal.dagdata)) {
    const c = dagdata[datum];
    if (!c) dagdata[datum] = l;
    else {
      const [oud, nieuw] = (c.bijgewerkt ?? '') > (l.bijgewerkt ?? '') ? [l, c] : [c, l];
      dagdata[datum] = { ...oud, ...nieuw, bronnen: { ...oud.bronnen, ...nieuw.bronnen } };
    }
  }
  const metingen = new Map(cloud.metingen.map((m) => [m.id, m]));
  for (const m of lokaal.metingen) metingen.set(m.id, m);
  const oefeningen = new Map(cloud.eigenOefeningen.map((o) => [o.id, o]));
  for (const o of lokaal.eigenOefeningen) oefeningen.set(o.id, o);
  return normaliseer({
    ...lokaal,
    trainingen: [...trainingen.values()].sort((a, b) => a.start.localeCompare(b.start)),
    dagdata,
    metingen: [...metingen.values()],
    eigenOefeningen: [...oefeningen.values()],
  });
}

/** Leeg apparaat (nog niet begonnen): dan nemen we de cloud over. */
export function isLeeg(s: Staat): boolean {
  return !s.instellingen.onboardingKlaar && s.trainingen.length === 0 && Object.keys(s.dagdata).length === 0;
}

/** Inhoud zonder de synchronisatietijd, om te zien of er echt iets veranderd is. */
export function inhoudSleutel(s: Staat): string {
  const { laatsteSync: _weg, ...inst } = s.instellingen;
  void _weg;
  return JSON.stringify({ ...s, instellingen: inst });
}
