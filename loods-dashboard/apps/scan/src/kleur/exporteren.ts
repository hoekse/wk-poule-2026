// Kleurvoorbeeld als afbeelding: foto (eventueel voor en na) met een kleurenlijst eronder, om te delen met de klant.
import { kleuren, lettertype, logoBlokjes } from '@loods/shared';
import { kleurLabel, type GekozenKleur } from './paletten';

export type LegendaRegel = { onderdeel: string; was: string; wasHex: string; kleur: GekozenKleur };

export async function maakAfbeelding(opties: {
  voor: HTMLCanvasElement;
  na: HTMLCanvasElement;
  voorEnNa: boolean;
  titel: string;
  onderTitel: string;
  regels: LegendaRegel[];
}): Promise<Blob> {
  const { voor, na, voorEnNa, regels } = opties;
  const W = na.width;
  const H = na.height;
  const naastElkaar = voorEnNa && H > W; // staande foto's naast elkaar, liggende onder elkaar
  const fotoB = voorEnNa && naastElkaar ? W * 2 : W;
  const fotoH = voorEnNa && !naastElkaar ? H * 2 : H;
  const breedte = Math.max(fotoB, 900);
  const u = breedte / 1000; // schaal voor tekst en marges
  const kop = Math.round(110 * u);
  const regelH = Math.round(58 * u);
  const legendaH = Math.round(40 * u) + regels.length * regelH + Math.round(80 * u);
  const hoogte = kop + fotoH + legendaH;

  const c = document.createElement('canvas');
  c.width = breedte;
  c.height = hoogte;
  const g = c.getContext('2d')!;
  g.fillStyle = '#FFFFFF';
  g.fillRect(0, 0, breedte, hoogte);

  // Kopregel
  g.fillStyle = kleuren.donker;
  g.fillRect(0, 0, breedte, kop);
  const blok = Math.round(20 * u);
  const marge = Math.round(30 * u);
  logoBlokjes.forEach((k, i) => {
    g.fillStyle = k;
    g.fillRect(marge + (i % 2) * (blok + 5 * u), kop / 2 - blok - 2.5 * u + Math.floor(i / 2) * (blok + 5 * u), blok, blok);
  });
  const tekstX = marge + blok * 2 + 25 * u;
  g.fillStyle = '#FFFFFF';
  g.font = `700 ${Math.round(34 * u)}px ${lettertype}`;
  g.textBaseline = 'alphabetic';
  g.fillText(opties.titel, tekstX, kop / 2 - 4 * u, breedte - tekstX - marge);
  g.fillStyle = '#C3C4C9';
  g.font = `400 ${Math.round(22 * u)}px ${lettertype}`;
  g.fillText(opties.onderTitel, tekstX, kop / 2 + 30 * u, breedte - tekstX - marge);

  // Foto('s)
  const fx = Math.round((breedte - fotoB) / 2);
  if (voorEnNa) {
    g.drawImage(voor, fx, kop, W, H);
    g.drawImage(na, naastElkaar ? fx + W : fx, naastElkaar ? kop : kop + H, W, H);
    plaatje(g, 'Nu', fx + 16 * u, kop + 16 * u, u);
    plaatje(g, 'Nieuw', (naastElkaar ? fx + W : fx) + 16 * u, (naastElkaar ? kop : kop + H) + 16 * u, u);
  } else {
    g.drawImage(na, fx, kop, W, H);
  }

  // Kleurenlijst
  let y = kop + fotoH + Math.round(40 * u);
  g.textBaseline = 'middle';
  for (const r of regels) {
    const sw = Math.round(40 * u);
    // was → nieuw
    g.fillStyle = r.wasHex;
    g.fillRect(marge, y, sw * 0.6, sw);
    g.fillStyle = r.kleur.hex;
    g.fillRect(marge + sw * 0.6, y, sw, sw);
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = Math.max(1, u);
    g.strokeRect(marge, y, sw * 1.6, sw);
    const tx = marge + sw * 1.6 + 20 * u;
    g.fillStyle = kleuren.donker;
    g.font = `700 ${Math.round(26 * u)}px ${lettertype}`;
    g.fillText(r.onderdeel, tx, y + sw / 2, breedte * 0.3);
    g.fillStyle = kleuren.antraciet;
    g.font = `400 ${Math.round(26 * u)}px ${lettertype}`;
    g.fillText(`${kleurLabel(r.kleur)}   (nu: ${r.was.toLowerCase()})`, tx + breedte * 0.31, y + sw / 2, breedte - tx - breedte * 0.31 - marge);
    y += regelH;
  }
  g.fillStyle = kleuren.grijs;
  g.font = `400 ${Math.round(19 * u)}px ${lettertype}`;
  g.fillText(
    'Kleuren op een scherm zijn een benadering. Kies de definitieve kleur met een echte kleurstaal.',
    marge,
    hoogte - Math.round(40 * u),
    breedte - marge * 2,
  );

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Afbeelding maken lukte niet.'))), 'image/jpeg', 0.9));
}

function plaatje(g: CanvasRenderingContext2D, tekst: string, x: number, y: number, u: number) {
  g.font = `700 ${Math.round(26 * u)}px ${lettertype}`;
  const b = g.measureText(tekst).width + 28 * u;
  const h = 44 * u;
  g.fillStyle = 'rgba(45,46,50,0.85)';
  g.beginPath();
  g.roundRect(x, y, b, h, 10 * u);
  g.fill();
  g.fillStyle = '#FFFFFF';
  g.textBaseline = 'middle';
  g.fillText(tekst, x + 14 * u, y + h / 2);
}

/** Deelt via het deelmenu van de telefoon (WhatsApp, mail …) of downloadt als dat niet kan. */
export async function deelOfDownload(blob: Blob, bestandsnaam: string): Promise<'gedeeld' | 'gedownload' | 'geannuleerd'> {
  const bestand = new File([blob], bestandsnaam, { type: 'image/jpeg' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [bestand] })) {
    try {
      await nav.share({ files: [bestand], title: 'Kleurvoorbeeld' });
      return 'gedeeld';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'geannuleerd';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = bestandsnaam;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'gedownload';
}
