/** Deelt een bestand via het deelmenu (Bewaar in Bestanden, Agenda, iCloud), anders downloaden. */
export async function deelBestand(naam: string, inhoud: string | Blob, type: string): Promise<'gedeeld' | 'gedownload' | 'geannuleerd'> {
  const bestand = new File([inhoud], naam, { type });
  try {
    if (navigator.canShare?.({ files: [bestand] })) {
      await navigator.share({ files: [bestand], title: naam });
      return 'gedeeld';
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'geannuleerd';
  }
  const url = URL.createObjectURL(bestand);
  const a = document.createElement('a');
  a.href = url;
  a.download = naam;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'gedownload';
}

/** Deelt tekst (bijv. het weekoverzicht); valt terug op kopiëren. */
export async function deelTekst(titel: string, tekst: string): Promise<'gedeeld' | 'gekopieerd' | 'mislukt'> {
  try {
    if (navigator.share) {
      await navigator.share({ title: titel, text: tekst });
      return 'gedeeld';
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'mislukt';
  }
  try {
    await navigator.clipboard.writeText(tekst);
    return 'gekopieerd';
  } catch {
    return 'mislukt';
  }
}
