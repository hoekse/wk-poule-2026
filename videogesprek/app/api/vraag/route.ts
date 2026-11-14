import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { KeuzeAntwoord } from '@/lib/antwoorden';
import { kies } from '@/lib/server/kies';
import { transcribeer } from '@/lib/server/transcribeer';

export const maxDuration = 30;

const MAX_BYTES = 4_000_000;

// Opname van de vraag -> tekst (OpenAI) -> best passende antwoord (Claude).
// Eén route voor beide stappen scheelt een extra rondreis vanaf de telefoon.
export async function POST(request: Request) {
  const start = Date.now();
  const form = await request.formData().catch(() => null);
  const audio = form?.get('audio');
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ fout: 'audio ontbreekt' }, { status: 400 });
  }
  if (audio.size > MAX_BYTES) return NextResponse.json({ fout: 'opname te groot' }, { status: 413 });

  let tekst: string | null;
  try {
    tekst = await transcribeer(audio);
  } catch (fout) {
    if (fout instanceof OpenAI.APIError) console.error(`OpenAI-fout ${fout.status}:`, fout.message);
    else console.error('Transcriptiefout:', fout);
    const antwoord: KeuzeAntwoord = { soort: 'onbekend', zekerheid: 0, tekst: '', bron: 'fout', ms: Date.now() - start };
    return NextResponse.json(antwoord);
  }
  if (tekst === null) return NextResponse.json({ fout: 'geen spraak-API ingesteld' }, { status: 503 });

  return NextResponse.json(await kies(tekst, start));
}
