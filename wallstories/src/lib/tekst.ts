const woorden = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien', 'twintig'];
/** Getal als Nederlands woord (tot twintig), optioneel met hoofdletter. */
export const aantalWoord = (n: number, hoofdletter = false) => {
  const w = woorden[n] ?? String(n);
  return hoofdletter ? w.charAt(0).toUpperCase() + w.slice(1) : w;
};
