/** POST /api/aanvraag/ – contact-, maatwerk-, zakelijke en aanbrengaanvragen. */
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { db, mail, json, esc, env } from '@/lib/server';
import { merk } from '@/config';
export const prerender = false;
const Schema = z.object({
  soort: z.enum(['contact', 'op-maat', 'zakelijk', 'aanbrengen']),
  naam: z.string().trim().min(1).max(100), email: z.string().trim().email().max(160),
  telefoon: z.string().trim().max(30).optional(), organisatie: z.string().trim().max(120).optional(),
  muurmaat: z.string().trim().max(60).optional(), plaats: z.string().trim().max(80).optional(),
  bericht: z.string().trim().min(10).max(4000), website: z.string().max(0).optional(), // honeypot
});
export const POST: APIRoute = async ({ request }) => {
  let d: z.infer<typeof Schema>;
  try { d = Schema.parse(await request.json()); } catch { return json({ fout: 'Controleer je naam, e-mailadres en bericht (min. 10 tekens).' }, 400); }
  const { website, ...data } = d;
  let opgeslagen = false, gemaild = false;
  if (env('SUPABASE_URL')) { try { await db('aanvragen', { method: 'POST', body: JSON.stringify(data) }); opgeslagen = true; } catch (e) { console.error('[aanvraag]', e); } }
  try {
    gemaild = await mail({ aan: merk.email, antwoordAan: d.email, onderwerp: `Nieuwe aanvraag (${d.soort}) van ${d.naam}`,
      html: `<h2>Aanvraag: ${esc(d.soort)}</h2>${Object.entries(data).map(([k, v]) => `<p><b>${esc(k)}</b><br>${esc(v).replace(/\n/g, '<br>')}</p>`).join('')}` });
  } catch (e) { console.error('[aanvraag-mail]', e); }
  if (!opgeslagen && !gemaild) return json({ fout: `Versturen lukt nu niet. Mail ons gerust direct: ${merk.email}` }, 503);
  return json({ ok: true });
};
