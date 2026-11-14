import 'server-only';
import OpenAI, { toFile } from 'openai';
import { ITEMS, NAAM } from '@/lib/antwoorden';

const MODEL = process.env.OPENAI_TRANSCRIPTIE_MODEL || 'gpt-transcribe';
/** Reserve als het hoofdmodel het verzoek weigert (werkt tot februari 2027). */
const RESERVE_MODEL = 'gpt-4o-mini-transcribe';

let client: OpenAI | null = null;
function openai(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  client ??= new OpenAI({ timeout: 10_000, maxRetries: 1 });
  return client;
}

export const spraakApiBeschikbaar = () => Boolean(process.env.OPENAI_API_KEY);

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

/** Zet een opname om in tekst. Geeft null als er geen sleutel is ingesteld. */
export async function transcribeer(audio: Blob): Promise<string | null> {
  const api = openai();
  if (!api) return null;

  const mime = audio.type || 'audio/webm';
  const data = Buffer.from(await audio.arrayBuffer());
  const bestand = () => toFile(data, `vraag.${extensie(mime)}`, { type: mime.split(';')[0] });

  try {
    const resultaat = await api.audio.transcriptions.create({ file: await bestand(), model: MODEL, ...opties(MODEL) });
    return resultaat.text ?? '';
  } catch (fout) {
    if (!(fout instanceof OpenAI.BadRequestError) || MODEL === RESERVE_MODEL) throw fout;
    console.warn(`Transcriptie met ${MODEL} geweigerd (${fout.message}); opnieuw met ${RESERVE_MODEL}.`);
    const resultaat = await api.audio.transcriptions.create({
      file: await bestand(),
      model: RESERVE_MODEL,
      ...opties(RESERVE_MODEL),
    });
    return resultaat.text ?? '';
  }
}
