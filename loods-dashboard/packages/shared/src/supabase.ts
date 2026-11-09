import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type { SupabaseClient };

/**
 * Maakt de Supabase-client. De sessie blijft bewaard op het toestel en wordt
 * automatisch ververst, zodat medewerkers maar één keer hoeven in te loggen.
 */
export function maakSupabase(url: string, sleutel: string): SupabaseClient {
  return createClient(url, sleutel, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  });
}

/** Maakt een Supabase/PostgREST-foutmelding leesbaar voor medewerkers. */
export function leesbareFout(fout: unknown): string {
  if (!fout) return 'Er ging iets mis.';
  const bericht =
    typeof fout === 'string'
      ? fout
      : typeof fout === 'object' && fout !== null && 'message' in fout
        ? String((fout as { message: unknown }).message)
        : String(fout);
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(bericht)) {
    return 'Geen verbinding. Controleer de wifi of mobiele data en probeer het opnieuw.';
  }
  if (/row-level security|permission denied/i.test(bericht)) {
    return 'Dit mag je niet doen met jouw account.';
  }
  if (/duplicate key.*qr_code/i.test(bericht)) return 'Deze QR-code is al in gebruik.';
  if (/duplicate key.*ean/i.test(bericht)) return 'Deze streepjescode (EAN) is al gekoppeld aan een ander artikel.';
  if (/duplicate key.*email/i.test(bericht)) return 'Dit e-mailadres is al in gebruik.';
  if (/duplicate key.*code/i.test(bericht)) return 'Deze code bestaat al.';
  if (/JWT expired/i.test(bericht)) return 'Je sessie is verlopen. Log opnieuw in.';
  return bericht;
}
