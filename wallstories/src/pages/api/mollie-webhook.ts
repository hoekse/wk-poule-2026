/** POST /api/mollie-webhook/ – Mollie meldt een statuswijziging; we halen de echte status op bij Mollie (nooit de body vertrouwen). */
import type { APIRoute } from 'astro';
import { db, mollie, mail, esc, siteUrl } from '@/lib/server';
import { euro } from '@/lib/prijs';
import { merk, winkel, aanbrengen } from '@/config';

export const prerender = false;

const statusMap: Record<string, string> = { paid: 'betaald', failed: 'mislukt', canceled: 'geannuleerd', expired: 'verlopen', open: 'open', pending: 'open', authorized: 'open' };

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  const id = String(form?.get('id') ?? '');
  if (!/^tr_\w+$/.test(id)) return new Response('ok'); // onbekend → negeren (Mollie test soms met lege body)
  try {
    const betaling = await mollie<{ status: string; paidAt?: string; metadata?: { bestelnummer?: string } }>(`payments/${id}`);
    const status = statusMap[betaling.status] ?? 'open';
    const [bestaand] = await db<any[]>(`bestellingen?mollie_id=eq.${id}&select=*`);
    if (!bestaand) return new Response('ok');
    if (bestaand.status === status) return new Response('ok');
    await db(`bestellingen?mollie_id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ status, betaald_op: status === 'betaald' ? betaling.paidAt ?? new Date().toISOString() : null }) });
    if (status === 'betaald') await bevestiging(bestaand).catch((e) => console.error('[mail]', e));
    return new Response('ok');
  } catch (e) {
    console.error('[webhook]', e);
    return new Response('fout', { status: 500 }); // Mollie probeert het later opnieuw
  }
};

async function bevestiging(b: any) {
  const k = b.klant;
  const regels = (b.regels as any[]).map((r) => `<tr><td style="padding:8px 0">${esc(r.aantal)}× <b>${esc(r.naam)}</b><br><span style="color:#5d6b66;font-size:13px">${(r.omschrijving as string[]).map(esc).join(' · ')}</span></td><td style="padding:8px 0;text-align:right;white-space:nowrap">${euro(r.totaal_cent)}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;color:#34433f;max-width:560px;margin:auto">
    <h1 style="color:#18403A;font-size:24px">Bedankt voor je bestelling, ${esc(k.voornaam)}!</h1>
    <p>We hebben je betaling ontvangen. Je bestelnummer is <b>${esc(b.bestelnummer)}</b>.</p>
    ${b.regels.some((r: any) => r.config?.naam) ? '<p>Je hebt een gepersonaliseerd product besteld. Binnen 1 werkdag sturen we je een digitale proef ter goedkeuring.</p>' : ''}
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e6ded1;border-bottom:1px solid #e6ded1">${regels}</table>
    <p style="text-align:right">Verzending: ${b.verzendkosten_cent ? euro(b.verzendkosten_cent) : 'gratis'}<br><b style="color:#18403A;font-size:18px">Totaal: ${euro(b.totaal_cent)}</b></p>
    <p><b>Bezorgadres</b><br>${esc(k.voornaam)} ${esc(k.achternaam)}<br>${esc(k.straat)} ${esc(k.huisnummer)}${esc(k.toevoeging)}<br>${esc(k.postcode)} ${esc(k.plaats)}</p>
    ${b.aanbrengen ? `<p><b>Laten aanbrengen:</b> je hebt gekozen voor aanbrengen door ${aanbrengen.partner} (${aanbrengen.tariefTekst.toLowerCase()}). We nemen binnen twee werkdagen contact met je op voor een offerte en een datum.</p>` : ''}
    <p>Verwachte levertijd: ${b.bevat_maatwerk ? winkel.levertijd.maatwerk : winkel.levertijd.standaard}. Je ontvangt een track & trace zodra je pakket onderweg is.</p>
    <p>Tips voor het aanbrengen vind je op <a href="${siteUrl()}/inspiratie/fotobehang-aanbrengen/" style="color:#18403A">onze site</a>.</p>
    <p>Liefs,<br>${merk.naam}</p></div>`;
  await mail({ aan: b.email, onderwerp: `Je bestelling ${b.bestelnummer} – ${merk.naam}`, html });
}
