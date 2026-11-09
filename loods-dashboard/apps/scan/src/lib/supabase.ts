import { maakSupabase } from '@loods/shared';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const sleutel = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False zolang de Supabase-gegevens (.env.local / Vercel) nog niet zijn ingevuld. */
export const isIngesteld = Boolean(url && sleutel);

export const supabase = maakSupabase(url || 'http://localhost:54321', sleutel || 'nog-niet-ingesteld');
