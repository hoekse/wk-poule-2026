// De drie lagen op het scherm: de foto zoals hij was, de foto met nieuwe kleuren, en de selectie.
import { Inkleurder, tekenSelectie, type Rechthoek, type Werkbeeld } from './beeld';
import type { Rgb } from './kleurruimte';

export class Weergave {
  readonly voor: HTMLCanvasElement;
  readonly na: HTMLCanvasElement;
  readonly selectie: HTMLCanvasElement;
  private naData: ImageData;
  private selData: ImageData;
  private inkleurder: Inkleurder;

  constructor(readonly wb: Werkbeeld) {
    const maak = () => {
      const c = document.createElement('canvas');
      c.width = wb.breedte;
      c.height = wb.hoogte;
      return c;
    };
    this.voor = maak();
    this.na = maak();
    this.selectie = maak();
    const origineel = new ImageData(new Uint8ClampedArray(wb.origineel), wb.breedte, wb.hoogte);
    this.voor.getContext('2d')!.putImageData(origineel, 0, 0);
    this.naData = new ImageData(wb.breedte, wb.hoogte);
    this.selData = new ImageData(wb.breedte, wb.hoogte);
    this.inkleurder = new Inkleurder(wb);
  }

  /** Nieuwe kleuren aanbrengen (heel beeld of alleen een stuk). */
  kleurIn(doelen: (Rgb | null)[], gebied?: Rechthoek) {
    const g = gebied && verruim(gebied, 2, this.wb);
    this.inkleurder.kleurIn(doelen, this.naData.data, g, !!g);
    const ctx = this.na.getContext('2d')!;
    if (g) ctx.putImageData(this.naData, 0, 0, g.x0, g.y0, g.x1 - g.x0 + 1, g.y1 - g.y0 + 1);
    else ctx.putImageData(this.naData, 0, 0);
  }

  /** Selectie van één onderdeel tonen (null = niets tonen). `dikte` = randdikte in fotopixels. */
  toonSelectie(onderdeel: number | null, dikte: number, gebied?: Rechthoek) {
    const ctx = this.selectie.getContext('2d')!;
    if (onderdeel == null) {
      ctx.clearRect(0, 0, this.selectie.width, this.selectie.height);
      return;
    }
    const g = gebied && verruim(gebied, Math.ceil(dikte) + 1, this.wb);
    tekenSelectie(this.wb, onderdeel, this.selData.data, dikte, g);
    if (g) ctx.putImageData(this.selData, 0, 0, g.x0, g.y0, g.x1 - g.x0 + 1, g.y1 - g.y0 + 1);
    else ctx.putImageData(this.selData, 0, 0);
  }
}

function verruim(r: Rechthoek, m: number, wb: Werkbeeld): Rechthoek {
  return {
    x0: Math.max(0, r.x0 - m),
    y0: Math.max(0, r.y0 - m),
    x1: Math.min(wb.breedte - 1, r.x1 + m),
    y1: Math.min(wb.hoogte - 1, r.y1 + m),
  };
}

/** Foto inlezen, rechtop zetten (EXIF) en verkleinen tot het werkformaat. */
export async function leesFoto(bestand: Blob, maxZijde: number): Promise<ImageData> {
  const bitmap = await createImageBitmap(bestand, { imageOrientation: 'from-image' }).catch(() => null);
  if (!bitmap) throw new Error('Deze foto kan niet worden geopend. Probeer een JPG- of PNG-foto.');
  const schaal = Math.min(1, maxZijde / Math.max(bitmap.width, bitmap.height));
  const b = Math.max(1, Math.round(bitmap.width * schaal));
  const h = Math.max(1, Math.round(bitmap.height * schaal));
  // In twee stappen verkleinen: scherper en zonder trapjes.
  let bron: CanvasImageSource = bitmap;
  let bb = bitmap.width;
  let bh = bitmap.height;
  while (bb / 2 > b * 1.2) {
    const tussen = document.createElement('canvas');
    tussen.width = Math.round(bb / 2);
    tussen.height = Math.round(bh / 2);
    const t = tussen.getContext('2d')!;
    t.imageSmoothingQuality = 'high';
    t.drawImage(bron, 0, 0, tussen.width, tussen.height);
    bron = tussen;
    bb = tussen.width;
    bh = tussen.height;
  }
  const c = document.createElement('canvas');
  c.width = b;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bron, 0, 0, b, h);
  bitmap.close?.();
  return ctx.getImageData(0, 0, b, h);
}
