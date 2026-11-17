// Ontvangt gezondheidsgegevens van de iOS-opdracht "Kracht Gezondheid" of van Health Auto Export
// en zet ze in de inbox van de Kracht-app. Deployen met verify_jwt = false: de sleutel is de beveiliging.
//
//   POST https://<project>.supabase.co/functions/v1/kracht-health
//   Header: X-Sleutel: <sleutel uit de app>   (of ?sleutel=<sleutel>)
//   Body:   JSON (woordenboek uit de opdracht, of de export van Health Auto Export)
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-sleutel, authorization, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const antwoord = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return antwoord({ fout: 'Gebruik POST.' }, 405);

  const sleutel = req.headers.get('x-sleutel') ?? new URL(req.url).searchParams.get('sleutel') ?? '';
  if (sleutel.length < 32) return antwoord({ fout: 'Sleutel ontbreekt.' }, 401);

  const tekst = await req.text();
  if (tekst.length > 1_000_000) return antwoord({ fout: 'Bericht is te groot.' }, 413);
  let data: unknown;
  try {
    data = JSON.parse(tekst);
  } catch {
    return antwoord({ fout: 'Geen geldige JSON.' }, 400);
  }
  const bron = (data as { data?: { metrics?: unknown } })?.data?.metrics ? 'hae' : 'apple';

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const { error } = await supabase.rpc('kracht_inbox_toevoegen', { p_sleutel: sleutel, p_data: data, p_bron: bron });
  if (error) {
    if (error.code === '28000') return antwoord({ fout: 'Onbekende sleutel.' }, 403);
    if (error.code === '54000') return antwoord({ fout: 'Inbox vol: open de Kracht-app om te synchroniseren.' }, 429);
    return antwoord({ fout: 'Opslaan mislukt.' }, 500);
  }
  return antwoord({ ok: true, bron });
});
