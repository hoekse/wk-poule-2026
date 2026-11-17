import type { Datum } from './types';

const twee = (n: number) => String(n).padStart(2, '0');

/** Lokale datum als 'JJJJ-MM-DD'. */
export function naarDatum(d: Date): Datum {
  return `${d.getFullYear()}-${twee(d.getMonth() + 1)}-${twee(d.getDate())}`;
}

export function vandaag(): Datum {
  return naarDatum(new Date());
}

/** 'JJJJ-MM-DD' → Date om 12:00 lokale tijd (veilig rond zomertijd). */
export function vanDatum(d: Datum): Date {
  const [j, m, dag] = d.split('-').map(Number);
  return new Date(j, m - 1, dag, 12);
}

export function plusDagen(d: Datum, n: number): Datum {
  const x = vanDatum(d);
  x.setDate(x.getDate() + n);
  return naarDatum(x);
}

export function dagenTussen(van: Datum, tot: Datum): number {
  return Math.round((vanDatum(tot).getTime() - vanDatum(van).getTime()) / 86400000);
}

/** 1 = maandag … 7 = zondag. */
export function weekdag(d: Datum): number {
  const w = vanDatum(d).getDay();
  return w === 0 ? 7 : w;
}

export function maandagVan(d: Datum): Datum {
  return plusDagen(d, 1 - weekdag(d));
}

/** ISO-weeknummer. */
export function weeknummer(d: Datum): number {
  const x = vanDatum(d);
  const dag = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dag + 3);
  const eersteDonderdag = new Date(x.getFullYear(), 0, 4, 12);
  return 1 + Math.round(((x.getTime() - eersteDonderdag.getTime()) / 86400000 - 3 + ((eersteDonderdag.getDay() + 6) % 7)) / 7);
}

export const DAGNAMEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
export const DAGEN_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MAANDEN_LANG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

/** '17 nov' */
export function kortDatum(d: Datum): string {
  const x = vanDatum(d);
  return `${x.getDate()} ${MAANDEN[x.getMonth()]}`;
}

/** 'dinsdag 17 november' */
export function langDatum(d: Datum): string {
  const x = vanDatum(d);
  return `${DAGNAMEN[weekdag(d) - 1]} ${x.getDate()} ${MAANDEN_LANG[x.getMonth()]}`;
}

/** 'di 17 nov' */
export function dagDatum(d: Datum): string {
  return `${DAGEN_KORT[weekdag(d) - 1]} ${kortDatum(d)}`;
}

export function relatief(d: Datum, nu: Datum = vandaag()): string {
  const n = dagenTussen(d, nu);
  if (n === 0) return 'vandaag';
  if (n === 1) return 'gisteren';
  if (n === -1) return 'morgen';
  if (n > 1 && n < 7) return `${n} dagen geleden`;
  if (n < -1 && n > -7) return `over ${-n} dagen`;
  return kortDatum(d);
}

/** Duur in minuten tussen twee ISO-tijdstippen. */
export function minutenTussen(start: string, eind: string): number {
  return Math.max(0, Math.round((new Date(eind).getTime() - new Date(start).getTime()) / 60000));
}

export function tijd(iso: string): string {
  const d = new Date(iso);
  return `${twee(d.getHours())}:${twee(d.getMinutes())}`;
}
