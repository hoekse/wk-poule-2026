import { NextResponse } from 'next/server';
import { kies } from '@/lib/server/kies';

// Tekst (uit de spraakherkenning van de browser) -> best passende antwoord.
export async function POST(request: Request) {
  const start = Date.now();
  const { tekst } = (await request.json().catch(() => ({}))) as { tekst?: unknown };
  if (typeof tekst !== 'string') return NextResponse.json({ fout: 'tekst ontbreekt' }, { status: 400 });
  return NextResponse.json(await kies(tekst.slice(0, 500), start));
}
