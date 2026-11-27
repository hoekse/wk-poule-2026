# Wallstories Kids – webshop

Premium fotobehang en muurdecoratie voor de kinderkamer. *Verhalen voor kleine dromers.*

Astro (statische pagina's, sterk voor SEO en snelheid) + serverless API-routes op Vercel + Supabase (bestellingen) + Mollie (betalingen).

## Snel starten

```bash
cd wallstories
npm install
cp .env.example .env      # vul de sleutels in (zie hieronder)
npm run dev               # http://localhost:4321
npm run build             # productiebuild (.vercel/output)
```

Zonder sleutels draait de site volledig, alleen afrekenen staat dan in **demo-modus** (nette melding, er wordt niets besteld).

## Structuur

| Map / bestand | Wat |
|---|---|
| `src/config.ts` | **Merknaam, contact, verzendkosten, levertijden, productspecificaties** – één plek (handig bij een naamswijziging) |
| `src/lib/prijs.ts` | Alle prijzen + validatie. Gebruikt door browser én server (server rekent altijd zelf opnieuw) |
| `src/data/werelden.ts` | De 6 werelden met SEO-titels, teksten en focuspunt van het beeld |
| `src/data/personages.ts` | Rembrandt 2.0, Bella Ballon, Kees Komeet |
| `src/data/producten.ts` | Categorieën + productcatalogus (wordt gegenereerd uit werelden × producttypes) |
| `src/data/faq.ts` | Veelgestelde vragen (ook als FAQPage-schema) |
| `src/content/inspiratie/*.md` | Blogartikelen (SEO) – nieuw artikel = nieuw markdownbestand |
| `src/content/paginas/*.md` | Over ons, voorwaarden, privacy, verzenden & retourneren |
| `src/assets/` | Beelden (worden bij de build omgezet naar AVIF/WebP in meerdere formaten) |
| `src/assets/brand/` | Logo als pure vector-SVG (opnieuw bouwen: `node scripts/build-logo.mjs`) |
| `src/pages/api/` | `bestelling` (Mollie-betaling starten), `mollie-webhook`, `bestelling-status`, `bestelling-zoeken`, `aanvraag` |
| `supabase/migrations/` | Database: `bestellingen` en `aanvragen` (RLS aan, alleen server-toegang) |

## Testomgeving (staat klaar)

| Onderdeel | Waar |
|---|---|
| Database | Supabase-project **wallstories-kids** (EU Frankfurt), tabellen `bestellingen` en `aanvragen` zijn aangemaakt |
| Hosting | Vercel-project **wallstories-kids**, bouwt automatisch bij elke push (map `wallstories`) |
| Al ingesteld in Vercel | `SUPABASE_URL`, `SITE_URL` (productie) |

**Nog door jou in te stellen** (Vercel → wallstories-kids → Settings → Environment Variables, type *Sensitive*):

1. `SUPABASE_SERVICE_ROLE_KEY` – Supabase → wallstories-kids → Project Settings → API Keys → *secret key* (`sb_secret_…`) of de legacy *service_role*-sleutel.
2. `MOLLIE_API_KEY` – Mollie Dashboard → Ontwikkelaars → API-sleutels → de **test**-sleutel (`test_…`).
3. Optioneel `RESEND_API_KEY` voor e-mails.
4. Vercel → Settings → Deployment Protection → **Protection Bypass for Automation** aanzetten, zodat Mollie de webhook van de (beveiligde) testversie kan bereiken.

Daarna opnieuw deployen (Deployments → … → Redeploy).

## Livegang in 6 stappen

1. **Supabase**: maak een project in regio *EU (Frankfurt)*, voer `supabase/migrations/*.sql` uit (SQL-editor), noteer `SUPABASE_URL` en de *service role key*.
2. **Mollie**: maak een account, activeer iDEAL (+ eventueel creditcard/Apple Pay/Klarna), kopieer eerst de `test_`-sleutel.
3. **Vercel**: nieuw project vanuit deze repository, *Root Directory* = `wallstories`, zet de omgevingsvariabelen uit `.env.example`.
4. **Domein** koppelen in Vercel en `SITE_URL` daarop zetten (belangrijk voor canonical-URL's, sitemap en de Mollie-webhook).
5. **Testbestelling** met de Mollie-testsleutel → controleer status in Supabase (`bestellingen`) → daarna `live_`-sleutel.
6. **Google Search Console** + **Merchant Center**: sitemap `…/sitemap-index.xml` en productfeed `…/feeds/google-shopping.xml` aanmelden.

Optioneel: `RESEND_API_KEY` voor orderbevestigingen per e-mail en notificaties van aanvragen.

## Vóór livegang controleren

- [ ] Merknaam juridisch checken (zie strategisch plan – er bestaat al een "Wallstories" in Amsterdam)
- [ ] Productclaims laten bevestigen door de drukpartner (`specs` in `src/config.ts`, specificaties in `ProductPagina.astro`)
- [ ] Prijzen en marges definitief (`src/lib/prijs.ts`)
- [ ] Bedrijfsgegevens invullen (`src/config.ts`, placeholders `[...]` in `src/content/paginas/`)
- [ ] Algemene voorwaarden en privacyverklaring juridisch laten controleren
- [ ] Drukbestanden: print-resolutie per wereld (opschalen/hertekenen – de webbeelden zijn ca. 2750 px breed)
- [ ] Instagram/Pinterest-accounts claimen (`merk.social`)
