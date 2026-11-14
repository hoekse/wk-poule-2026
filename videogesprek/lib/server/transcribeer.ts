import 'server-only';
import { createGateway, transcribe } from 'ai';
import OpenAI, { toFile } from 'openai';
import { ITEMS, NAAM } from '@/lib/antwoorden';
import { gatewayMogelijk, gatewaySleutel } from './gateway';

const MODEL = process.env.OPENAI_TRANSCRIPTIE_MODEL || 'gpt-transcribe';
/** Reserve als het hoofdmodel het verzoek weigert (werkt tot februari 2027). */
const RESERVE_MODEL = 'gpt-4o-mini-transcribe';

/** Met eigen OPENAI_API_KEY rechtstreeks, anders via de Vercel AI Gateway. */
export const spraakApiBeschikbaar = () => Boolean(process.env.OPENAI_API_KEY) || gatewayMogelijk();

// De vragen als hint helpen de herkenning bij namen, dialect en korte zinnen.
const VOORBEELDEN = ITEMS.slice(0, 30).map((item) => item.vragen[0]);
const CONTEXT = `Een korte vraag aan ${NAAM} in het Nederlands, bijvoorbeeld: ${VOORBEELDEN.join(' ')}`;

function extensie(mime: string): string {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'mp4';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  return 'webm';
}

// gpt-transcribe gebruikt languages/keywords, de oudere modellen language/prompt.
function opties(model: string) {
  return model.startsWith('gpt-transcribe')
    ? { languages: ['nl'], keywords: [NAAM, ...VOORBEELDEN] }
    : { language: 'nl', prompt: CONTEXT };
}

let direct: OpenAI | null = null;

async function viaOpenAI(data: Buffer, mime: string, model: string): Promise<string> {
  direct ??= new OpenAI({ timeout: 10_000, maxRetries: 1 });
  const file = await toFile(data, `vraag.${extensie(mime)}`, { type: mime.split(';')[0] });
  const resultaat = await direct.audio.transcriptions.create({ file, model, ...opties(model) });
  return resultaat.text ?? '';
}

async function viaGateway(data: Buffer, sleutel: string, model: string): Promise<string> {
  const gateway = createGateway({ apiKey: sleutel });
  const resultaat = await transcribe({
    model: gateway.transcriptionModel(`openai/${model}`),
    audio: new Uint8Array(data),
    providerOptions: { openai: opties(model) },
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(10_000),
  });
  return resultaat.text ?? '';
}

/** Zet een opname om in tekst. Geeft null als er geen spraak-API beschikbaar is. */
export async function transcribeer(audio: Blob): Promise<string | null> {
  const mime = audio.type || 'audio/webm';
  const data = Buffer.from(await audio.arrayBuffer());

  let poging: (model: string) => Promise<string>;
  if (process.env.OPENAI_API_KEY) {
    poging = (model) => viaOpenAI(data, mime, model);
  } else {
    const sleutel = await gatewaySleutel();
    if (!sleutel) return null;
    poging = (model) => viaGateway(data, sleutel, model);
  }

  try {
    return await poging(MODEL);
  } catch (fout) {
    if (MODEL === RESERVE_MODEL) throw fout;
    console.warn(`Transcriptie met ${MODEL} mislukt (${(fout as Error).message}); opnieuw met ${RESERVE_MODEL}.`);
    return await poging(RESERVE_MODEL);
  }
}
