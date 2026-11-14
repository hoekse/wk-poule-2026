import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { ITEMS, NAAM, type Keuze, type KeuzeAntwoord } from '@/lib/antwoorden';
import { besteLokaal, normaliseer } from '@/lib/vergelijk';
import { GATEWAY_URL, gatewaySleutel } from './gateway';

const MODEL = 'claude-haiku-5-5';
/** Hetzelfde model via de Vercel AI Gateway. */
const GATEWAY_MODEL = 'anthropic/claude-haiku-5.5';

/** Onder deze zekerheid speelt onbekend.mp4. */
export const DREMPEL = (() => {
  const waarde = Number(process.env.ZEKERHEID_DREMPEL);
  return Number.isFinite(waarde) && waarde > 0 && waarde <= 1 ? waarde : 0.6;
})();

/** Vanaf deze lokale gelijkenis is de vraag (bijna) letterlijk gesteld: geen taalmodel nodig. */
const SNEL_GENOEG = 0.9;

let direct: Anthropic | null = null;
/** Eigen ANTHROPIC_API_KEY gaat voor; anders via de Vercel AI Gateway. */
async function anthropic(): Promise<{ api: Anthropic; model: string } | null> {
  if (process.env.ANTHROPIC_API_KEY) {
    direct ??= new Anthropic({ timeout: 8_000, maxRetries: 1 });
    return { api: direct, model: MODEL };
  }
  // Het OIDC-token wisselt per verzoek, dus elke keer een nieuwe client.
  const sleutel = await gatewaySleutel();
  if (!sleutel) return null;
  return {
    api: new Anthropic({ apiKey: sleutel, baseURL: GATEWAY_URL, timeout: 8_000, maxRetries: 1 }),
    model: GATEWAY_MODEL,
  };
}

// De lijst verandert alleen bij een nieuwe deploy, dus de systeemprompt is per
// deploy gelijk (goed voor prompt caching zodra de lijst groot genoeg is).
const LIJST = JSON.stringify(
  ITEMS.map((item) => ({ id: item.id, vragen: item.vragen, antwoord: item.antwoordtekst })),
  null,
  1,
);

const SYSTEEM = `Je bent de vraagherkenner van een app die een videogesprek met ${NAAM} nabootst. Iemand stelt ${NAAM} hardop een vraag in het Nederlands. De tekst komt uit automatische spraakherkenning en kan verkeerd verstane woorden, dialect, stopwoorden of ontbrekende leestekens bevatten.

${NAAM} kan alleen de vooraf opgenomen antwoorden uit de lijst hieronder geven. Kies het item waarvan de vragen hetzelfde bedoelen als wat er gezegd is, ook als het anders geformuleerd is. Het antwoord bij elk item is wat ${NAAM} terugzegt; kies een item alleen als dat antwoord echt past op wat er gevraagd werd.

Kies "geen" als er wel iets tegen ${NAAM} gezegd of gevraagd wordt, maar geen item past.
Kies "ruis" als de tekst geen bedoelde vraag of opmerking is: leeg, losse klanken, achtergrondgeluid, een ondertitelingsregel of tekst die duidelijk niet tegen ${NAAM} gezegd is.

zekerheid is een getal van 0 tot 1: hoe zeker je bent dat het gekozen item klopt.

De lijst:
${LIJST}`;

const keuzes: [string, ...string[]] = ['geen', 'ruis', ...ITEMS.map((item) => item.id)];
const KeuzeSchema = z.object({
  id: z.enum(keuzes),
  zekerheid: z.number().describe('0 tot 1'),
});

async function vraagClaude(tekst: string): Promise<Keuze | null> {
  const verbinding = await anthropic();
  if (!verbinding) return null;

  const response = await verbinding.api.messages.parse({
    model: verbinding.model,
    max_tokens: 1024,
    // Eenvoudige keuze uit een korte lijst: lage effort houdt de vertraging klein.
    output_config: { effort: 'low', format: zodOutputFormat(KeuzeSchema) },
    system: SYSTEEM,
    messages: [{ role: 'user', content: `Gezegd: "${tekst}"` }],
  });

  if (response.stop_reason === 'refusal') return { soort: 'onbekend', zekerheid: 0 };
  const uitkomst = response.parsed_output;
  if (!uitkomst) return null;

  const zekerheid = Math.min(1, Math.max(0, uitkomst.zekerheid));
  if (uitkomst.id === 'ruis') return { soort: 'stil' };
  if (uitkomst.id === 'geen' || zekerheid < DREMPEL) return { soort: 'onbekend', zekerheid };
  return { soort: 'antwoord', id: uitkomst.id, zekerheid };
}

function lokaal(tekst: string): Keuze {
  const beste = besteLokaal(tekst, ITEMS);
  if (!beste || beste.score < DREMPEL) return { soort: 'onbekend', zekerheid: beste?.score ?? 0 };
  return { soort: 'antwoord', id: beste.item.id, zekerheid: beste.score };
}

/** Kiest het passende antwoord bij een (herkende) vraag. */
export async function kies(tekst: string, start = Date.now()): Promise<KeuzeAntwoord> {
  const schoon = tekst.trim();
  const klaar = (keuze: Keuze, bron: KeuzeAntwoord['bron']): KeuzeAntwoord => ({
    ...keuze,
    tekst: schoon,
    bron,
    ms: Date.now() - start,
  });

  // Minder dan twee letters: niets zinnigs gehoord.
  if (normaliseer(schoon).replace(/ /g, '').length < 2) return klaar({ soort: 'stil' }, 'leeg');

  const beste = besteLokaal(schoon, ITEMS);
  if (beste && beste.score >= SNEL_GENOEG) {
    return klaar({ soort: 'antwoord', id: beste.item.id, zekerheid: beste.score }, 'snel');
  }

  try {
    const keuze = await vraagClaude(schoon);
    if (keuze) return klaar(keuze, 'claude');
  } catch (fout) {
    if (fout instanceof Anthropic.APIError) {
      console.error(`Claude-fout ${fout.status}:`, fout.message);
    } else {
      console.error('Claude-fout:', fout);
    }
  }
  return klaar(lokaal(schoon), 'lokaal');
}

/** Voor /api/status: roept Claude rechtstreeks aan en meldt fouten in plaats van ze te verbergen. */
export async function testClaude(tekst: string) {
  const start = Date.now();
  try {
    const keuze = await vraagClaude(tekst);
    return keuze ? { ok: true, keuze, ms: Date.now() - start } : { ok: false, fout: 'geen verbinding of geen antwoord' };
  } catch (fout) {
    return { ok: false, fout: fout instanceof Error ? fout.message : String(fout), ms: Date.now() - start };
  }
}
