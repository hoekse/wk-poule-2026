/**
 * POST /api/bestelling/ – maakt een bestelling aan en start een Mollie-betaling.
 * Prijzen worden hier opnieuw berekend; wat de browser stuurt aan prijzen wordt genegeerd.
 */
import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { productByKey, type ProductType } from '@/data/producten';
import { prijsVoor, verzendkosten, PrijsFout, type Config } from '@/lib/prijs';
import { db, mollie, json, siteUrl, geconfigureerd, bestelnummer } from '@/lib/server';
import { merk } from '@/config';

export const prerender = false;

const toegestaan: Record<ProductType, Config['type'][]> = {
  fotobehang: ['fotobehang', 'proefstaal'], behangcirkel: ['behangcirkel'], poster: ['poster'], muursticker: ['muursticker'], naamsticker: ['naamsticker'],
};

const tekst = (max: number) => z.string().trim().max(max);
const Schema = z.object({
  klant: z.object({
    email: z.string().trim().email().max(160),
    voornaam: tekst(80).min(1), achternaam: tekst(80).min(1), telefoon: tekst(30).optional().default(''),
    postcode: z.string().trim().regex(/^[1-9]\d{3}\s?[a-zA-Z]{2}$/, 'Ongeldige postcode'),
    huisnummer: tekst(10).min(1), toevoeging: tekst(10).optional().default(''),
    straat: tekst(120).min(1), plaats: tekst(80).min(1), opmerking: tekst(500).optional().default(''),
  }),
  regels: z.array(z.object({ key: z.string().max(80), config: z.any(), aantal: z.number().int().min(1).max(20) })).min(1).max(30),
  akkoordVoorwaarden: z.literal(true),
  akkoordMaatwerk: z.boolean().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? (e.issues[0]?.path.join('.') === 'akkoordVoorwaarden' ? 'Ga akkoord met de algemene voorwaarden.' : `Controleer je gegevens (${e.issues[0]?.path.join('.')}).`) : 'Ongeldige aanvraag.';
    return json({ fout: msg }, 400);
  }

  // 1. Regels valideren en prijzen server-side berekenen
  let regels;
  try {
    regels = body.regels.map((r) => {
      const product = productByKey(r.key);
      if (!product) throw new PrijsFout('Een product in je winkelwagen bestaat niet meer.');
      if (!toegestaan[product.type].includes(r.config?.type)) throw new PrijsFout('Ongeldige productconfiguratie.');
      const p = prijsVoor(r.config as Config);
      return { key: r.key, naam: r.config?.type === 'proefstaal' ? `Proefstaal – ${product.naam}` : product.naam, config: p.config, omschrijving: p.regels, maatwerk: p.maatwerk, aantal: r.aantal, stukprijs_cent: p.cent, totaal_cent: p.cent * r.aantal };
    });
  } catch (e) {
    return json({ fout: e instanceof PrijsFout ? e.message : 'Je winkelwagen bevat een ongeldig product.' }, 400);
  }
  const heeftMaatwerk = regels.some((r) => r.maatwerk);
  if (heeftMaatwerk && !body.akkoordMaatwerk) return json({ fout: 'Bevestig dat maatwerk niet onder het herroepingsrecht valt.' }, 400);

  const subtotaal = regels.reduce((s, r) => s + r.totaal_cent, 0);
  const verzend = verzendkosten(subtotaal);
  const totaal = subtotaal + verzend;

  if (!geconfigureerd()) {
    return json({ fout: 'Demo-modus: de betaalkoppeling (Mollie + Supabase) is nog niet geactiveerd. Je bestelling is niet geplaatst.', demo: true }, 503);
  }

  // 2. Bestelling opslaan
  const nr = bestelnummer();
  const token = crypto.randomUUID();
  const k = body.klant;
  try {
    await db('bestellingen', {
      method: 'POST',
      body: JSON.stringify({
        bestelnummer: nr, token, status: 'open',
        email: k.email.toLowerCase(), klant: { ...k, postcode: k.postcode.replace(/\s/g, '').toUpperCase() },
        regels, subtotaal_cent: subtotaal, verzendkosten_cent: verzend, totaal_cent: totaal,
        akkoord_voorwaarden: true, akkoord_maatwerk: !!body.akkoordMaatwerk, bevat_maatwerk: heeftMaatwerk,
      }),
    });

    // 3. Mollie-betaling
    const site = siteUrl();
    const lokaal = /localhost|127\.0\.0\.1/.test(site);
    const betaling = await mollie<{ id: string; _links: { checkout: { href: string } } }>('payments', {
      method: 'POST',
      body: JSON.stringify({
        amount: { currency: 'EUR', value: (totaal / 100).toFixed(2) },
        description: `${merk.naam} ${nr}`,
        redirectUrl: `${site}/bedankt/?nr=${nr}&t=${token}`,
        ...(lokaal ? {} : { webhookUrl: `${site}/api/mollie-webhook/` }),
        locale: 'nl_NL',
        metadata: { bestelnummer: nr },
        billingEmail: k.email,
      }),
    });
    await db(`bestellingen?bestelnummer=eq.${encodeURIComponent(nr)}`, { method: 'PATCH', body: JSON.stringify({ mollie_id: betaling.id }) });
    return json({ checkoutUrl: betaling._links.checkout.href, bestelnummer: nr });
  } catch (e) {
    console.error('[bestelling]', e);
    return json({ fout: 'Er ging iets mis bij het starten van de betaling. Probeer het over een paar minuten opnieuw.' }, 502);
  }
};
