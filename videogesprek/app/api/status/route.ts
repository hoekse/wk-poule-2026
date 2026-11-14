import { createGateway } from 'ai';
import type { NextRequest } from 'next/server';
import { testClaude } from '@/lib/server/kies';
import { gatewaySleutel } from '@/lib/server/gateway';
import { COOKIE, heeftToegang, toegangsCode } from '@/lib/server/toegang';
import { transcribeer } from '@/lib/server/transcribeer';

export const maxDuration = 30;

/** Een seconde stilte als WAV, om de spraakherkenning te testen. */
function stilte(): Blob {
  const rate = 16_000;
  const data = new Uint8Array(rate * 2);
  const kop = new DataView(new ArrayBuffer(44));
  const tekst = (o: number, s: string) => [...s].forEach((c, i) => kop.setUint8(o + i, c.charCodeAt(0)));
  tekst(0, 'RIFF');
  kop.setUint32(4, 36 + data.length, true);
  tekst(8, 'WAVEfmt ');
  kop.setUint32(16, 16, true);
  kop.setUint16(20, 1, true);
  kop.setUint16(22, 1, true);
  kop.setUint32(24, rate, true);
  kop.setUint32(28, rate * 2, true);
  kop.setUint16(32, 2, true);
  kop.setUint16(34, 16, true);
  tekst(36, 'data');
  kop.setUint32(40, data.length, true);
  return new Blob([kop.buffer, data], { type: 'audio/wav' });
}

// GET /api/status: werkt de spraakherkenning, werkt Claude, hoeveel AI Gateway-tegoed is er?
// Open hem in de browser na het invullen van de code, of met ?code=<toegangscode>.
export async function GET(request: NextRequest) {
  const code = toegangsCode();
  const metCookie = await heeftToegang(request.cookies.get(COOKIE)?.value);
  const metCode = Boolean(code) && request.nextUrl.searchParams.get('code') === code;
  if (!metCookie && !metCode) return new Response('Geen toegang', { status: 401 });

  const bron = {
    spraak: process.env.OPENAI_API_KEY ? 'eigen OpenAI-sleutel' : 'Vercel AI Gateway',
    claude: process.env.ANTHROPIC_API_KEY ? 'eigen Anthropic-sleutel' : 'Vercel AI Gateway',
  };

  const sleutel = await gatewaySleutel();
  const tegoed = sleutel
    ? await createGateway({ apiKey: sleutel })
        .getCredits()
        .then((c) => ({ ok: true, ...c }))
        .catch((fout: Error) => ({ ok: false, fout: fout.message }))
    : { ok: false, fout: 'geen AI Gateway-toegang (geen OIDC-token of AI_GATEWAY_API_KEY)' };

  const spraakStart = Date.now();
  const spraak = await transcribeer(stilte())
    .then((tekst) =>
      tekst === null
        ? { ok: false, fout: 'geen spraak-API beschikbaar' }
        : { ok: true, tekst, ms: Date.now() - spraakStart },
    )
    .catch((fout: Error) => ({ ok: false, fout: fout.message, ms: Date.now() - spraakStart }));

  const claude = await testClaude('Alles kits bij jou vandaag?');

  return Response.json(
    { ok: spraak.ok && claude.ok, bron, spraak, claude, gatewayTegoed: tegoed },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
