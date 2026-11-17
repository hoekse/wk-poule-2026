/** Maakt een foto kleiner (max. 1280 px, JPEG) zodat hij weinig ruimte inneemt. */
export async function verkleinFoto(bestand: Blob, max = 1280, kwaliteit = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(bestand);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fout) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => fout(new Error('Deze foto kan ik niet openen.'));
      i.src = url;
    });
    const schaal = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * schaal);
    canvas.height = Math.round(img.naturalHeight * schaal);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((ok, fout) => canvas.toBlob((b) => (b ? ok(b) : fout(new Error('Verkleinen mislukt.'))), 'image/jpeg', kwaliteit));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function blobNaarDataUrl(blob: Blob): Promise<string> {
  return new Promise((ok, fout) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fout(r.error);
    r.readAsDataURL(blob);
  });
}

export async function dataUrlNaarBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}
