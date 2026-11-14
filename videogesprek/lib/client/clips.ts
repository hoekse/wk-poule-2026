// Laadt alle clips vooraf in het geheugen (blob-URL's), zodat een antwoord
// direct kan starten zonder te wachten op het netwerk.

const geladen = new Map<string, string>();

async function haal(url: string, pogingen = 2): Promise<string> {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`${res.status}`);
      return URL.createObjectURL(await res.blob());
    } catch (fout) {
      if (i + 1 >= pogingen) throw fout;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

/** Geeft per URL de te gebruiken bron. Mislukt laden, dan blijft de gewone URL staan. */
export async function laadClips(urls: string[], gelijktijdig = 4): Promise<Map<string, string>> {
  const rij = urls.filter((u) => !geladen.has(u));
  const werkers = Array.from({ length: Math.min(gelijktijdig, rij.length) }, async () => {
    for (let url = rij.shift(); url; url = rij.shift()) {
      try {
        geladen.set(url, await haal(url));
      } catch (fout) {
        console.warn('Clip niet vooraf geladen:', url, fout);
      }
    }
  });
  await Promise.all(werkers);
  return new Map(urls.map((u) => [u, geladen.get(u) ?? u]));
}

export const bronVoor = (url: string) => geladen.get(url) ?? url;
