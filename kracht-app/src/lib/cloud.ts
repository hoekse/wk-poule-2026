import type { SupabaseClient } from '@supabase/supabase-js';
import { naarDatum } from './datum';
import { isHealthAutoExport, leesHealthAutoExport, leesOpdrachtJson, leesWillekeurig, type ImportResultaat } from './importeren';
import { isLeeg, voegSamen } from './samenvoegen';
import { normaliseer, voegDagdataToe } from './staat';
import type { Staat } from './types';

/**
 * Cloud (Supabase): back-up, synchronisatie tussen apparaten en de inbox waar de iOS-opdracht
 * of Health Auto Export elke ochtend vanzelf gegevens aflevert. Werkt alleen als de app is gebouwd
 * met VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY.
 */
export const CLOUD_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const CLOUD_SLEUTEL = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
export const cloudIngesteld = !!(CLOUD_URL && CLOUD_SLEUTEL);
export const inboxAdres = `${CLOUD_URL}/functions/v1/kracht-health`;

let client: Promise<SupabaseClient> | null = null;
export function cloud(): Promise<SupabaseClient> {
  if (!cloudIngesteld) return Promise.reject(new Error('De cloud is nog niet ingesteld.'));
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(CLOUD_URL, CLOUD_SLEUTEL, { auth: { persistSession: true, storageKey: 'kracht-auth', autoRefreshToken: true } }),
  );
  return client;
}

export async function huidigeGebruiker(): Promise<{ id: string; email: string } | null> {
  if (!cloudIngesteld) return null;
  const { data } = await (await cloud()).auth.getSession();
  const u = data.session?.user;
  return u ? { id: u.id, email: u.email ?? '' } : null;
}

const vertaal = (m: string) =>
  /invalid login/i.test(m)
    ? 'E-mail of wachtwoord klopt niet.'
    : /not confirmed/i.test(m)
      ? 'Bevestig eerst je e-mailadres via de link in de mail, en log daarna hier in.'
      : /already registered/i.test(m)
        ? 'Dit e-mailadres heeft al een account: log in.'
        : /password/i.test(m)
          ? 'Kies een wachtwoord van minstens 8 tekens.'
          : m;

export async function inloggen(email: string, wachtwoord: string): Promise<void> {
  const { error } = await (await cloud()).auth.signInWithPassword({ email, password: wachtwoord });
  if (error) throw new Error(vertaal(error.message));
}

/** Maakt een account. Geeft true als je meteen bent ingelogd, false als je eerst je e-mail moet bevestigen. */
export async function registreren(email: string, wachtwoord: string): Promise<boolean> {
  const { data, error } = await (await cloud()).auth.signUp({ email, password: wachtwoord });
  if (error) throw new Error(vertaal(error.message));
  return !!data.session;
}

export async function uitloggen(): Promise<void> {
  await (await cloud()).auth.signOut();
}

/** Nieuwe sleutel voor de iOS-opdracht; oude sleutels vervallen. */
export async function nieuweSleutel(): Promise<string> {
  const sb = await cloud();
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const sleutel = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const gebruiker = await huidigeGebruiker();
  if (!gebruiker) throw new Error('Log eerst in.');
  await sb.from('kracht_sleutels').delete().eq('gebruiker', gebruiker.id);
  const { error } = await sb.from('kracht_sleutels').insert({ sleutel });
  if (error) throw new Error('Sleutel maken is mislukt.');
  return sleutel;
}

function leesBericht(data: unknown, ontvangen: string): ImportResultaat {
  const datum = naarDatum(new Date(ontvangen));
  if (typeof data === 'string') return leesWillekeurig(data, datum);
  if (isHealthAutoExport(data)) return leesHealthAutoExport(data as Parameters<typeof leesHealthAutoExport>[0]);
  return leesOpdrachtJson(JSON.stringify(data), datum);
}

export interface SyncResultaat {
  staat: Staat;
  nieuweDagen: number;
  overgenomen: boolean;
}

/** Haalt de cloud op, voegt samen, verwerkt de inbox en zet de nieuwe staat terug. */
export async function synchroniseer(lokaal: Staat): Promise<SyncResultaat> {
  const sb = await cloud();
  const gebruiker = await huidigeGebruiker();
  if (!gebruiker) throw new Error('Niet ingelogd.');

  const { data: rij, error: leesFout } = await sb.from('kracht_staat').select('data, bijgewerkt').maybeSingle();
  if (leesFout) throw new Error('Ophalen uit de cloud is mislukt.');
  let staat = lokaal;
  let overgenomen = false;
  if (rij?.data) {
    const remote = normaliseer(rij.data as Partial<Staat>);
    if (isLeeg(lokaal)) {
      staat = { ...remote, fotos: lokaal.fotos, uitlegFotos: lokaal.uitlegFotos };
      overgenomen = true;
    } else if (!lokaal.instellingen.laatsteSync || rij.bijgewerkt > lokaal.instellingen.laatsteSync) {
      staat = voegSamen(lokaal, remote);
    }
  }

  const { data: berichten } = await sb.from('kracht_inbox').select('id, data, ontvangen').order('ontvangen');
  let nieuweDagen = 0;
  const verwerkt: number[] = [];
  for (const b of berichten ?? []) {
    try {
      const r = leesBericht(b.data, b.ontvangen as string);
      const res = voegDagdataToe(staat, r.dagen, r.bron);
      staat = res.staat;
      nieuweDagen += res.aantal;
    } catch {
      /* onleesbaar bericht: toch opruimen */
    }
    verwerkt.push(b.id as number);
  }
  if (verwerkt.length) await sb.from('kracht_inbox').delete().in('id', verwerkt);

  const nu = new Date().toISOString();
  staat = { ...staat, instellingen: { ...staat.instellingen, laatsteSync: nu } };
  const { error: schrijfFout } = await sb
    .from('kracht_staat')
    .upsert({ gebruiker: gebruiker.id, data: { ...staat, fotos: [], uitlegFotos: {} }, bijgewerkt: nu }, { onConflict: 'gebruiker' });
  if (schrijfFout) throw new Error('Opslaan in de cloud is mislukt.');
  return { staat, nieuweDagen, overgenomen };
}
