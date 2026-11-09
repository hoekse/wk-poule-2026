// Weergave van datums en aantallen in gewone Nederlandse woorden.

export function sindsTekst(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const nu = new Date();
  const dagen = Math.floor((startVanDag(nu) - startVanDag(d)) / 86_400_000);
  if (dagen <= 0) return `vandaag ${tijd(d)}`;
  if (dagen === 1) return `gisteren ${tijd(d)}`;
  if (dagen < 7) return `${dagen} dagen`;
  if (dagen < 14) return '1 week';
  if (dagen < 60) return `${Math.floor(dagen / 7)} weken`;
  return `${Math.floor(dagen / 30)} maanden`;
}

export function datumTijd(iso: string): string {
  return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function datum(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function aantalTekst(aantal: number, eenheid: string | null | undefined): string {
  return eenheid ? `${aantal} ${eenheid}` : `${aantal}×`;
}

export function liter(l: number | null | undefined): string {
  if (l == null) return '';
  return `${String(l).replace('.', ',')} L`;
}

export function vandaagIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startVanDag(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function tijd(d: Date): string {
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}
