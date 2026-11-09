// Foto verkleinen op het toestel (sneller uploaden op trage wifi) en opslaan in Supabase Storage.
import { leesbareFout } from '@loods/shared';
import { supabase } from './supabase';

const MAX_ZIJDE = 1280;

async function verklein(bestand: File): Promise<Blob> {
  const bitmap = await createImageBitmap(bestand).catch(() => null);
  if (!bitmap) return bestand;
  const schaal = Math.min(1, MAX_ZIJDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * schaal);
  canvas.height = Math.round(bitmap.height * schaal);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? bestand), 'image/jpeg', 0.8));
}

/** Uploadt een foto naar de bucket 'fotos' en geeft de openbare link terug. */
export async function uploadFoto(bestand: File, map: 'verf' | 'artikelen'): Promise<string> {
  const blob = await verklein(bestand);
  const pad = `${map}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('fotos').upload(pad, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(leesbareFout(error));
  return supabase.storage.from('fotos').getPublicUrl(pad).data.publicUrl;
}
