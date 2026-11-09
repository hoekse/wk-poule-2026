# Installatie – Loods Dashboard (fase 1: scan-app)

Deze handleiding zet de scan-app online, zodat Dennis, Raymond, Bas en Lesley hem op hun telefoon kunnen gebruiken.
Reken op ongeveer een uur. Doe de stappen in deze volgorde.

> Kort samengevat: (1) nieuw Supabase-project, (2) database klaarzetten, (3) jezelf beheerder maken,
> (4) inlogmails instellen, (5) app online zetten op Vercel, (6) app op de telefoons zetten.

> **Stand 9 november 2026:** stap 1 en 2 zijn al gedaan. Het Supabase-project heet `hoeksema-loods`
> (Project URL `https://acmmnoqlzsgbqdflfpkg.supabase.co`) en de database staat erin, met de vier bussen en kentekens.
> De app weet het adres al (`apps/scan/.env.production`), dus in Vercel hoef je niets in te vullen.
> Nog te doen: stap 3 (jouw e-mailadres), 4 (inlogmails) en 5–6 (Vercel en telefoons).

---

## 1. Nieuw Supabase-project

Gebruik een **apart project**, niet het project van de WK-poule.

1. Ga naar <https://supabase.com/dashboard> → organisatie *Hoeksema schilderwerken* → **New project**.
2. Naam: `hoeksema-loods`. Regio: **Central EU (Frankfurt)**. Kies een sterk databasewachtwoord en bewaar het in je wachtwoordkluis.
3. Wacht tot het project klaar is (1–2 minuten).

> Het gratis plan staat 2 actieve projecten toe. Met de WK-poule erbij zit je daarmee aan het maximum.
> Gratis projecten worden na een week zonder gebruik gepauzeerd; met dagelijks scannen gebeurt dat niet.

## 2. Database klaarzetten

In het project: **SQL Editor** → **New query**. Plak de bestanden één voor één, **in deze volgorde**, en klik steeds op **Run**:

1. `supabase/migrations/20261109100000_basis.sql`: tabellen
2. `supabase/migrations/20261109100100_logica.sql`: regels, views, functies
3. `supabase/migrations/20261109100200_beveiliging.sql`: wie mag wat (RLS)
4. `supabase/migrations/20261109100300_opslag_en_realtime.sql`: foto's en live-updates
5. `supabase/seed.sql`: startdata: medewerkers, de ID. Buzz, alle zones uit de 3D-preview en 13 voorbeeldartikelen

Elke stap moet eindigen met *Success. No rows returned*.

*(Wie de Supabase-CLI gebruikt: `supabase link --project-ref <ref>` en daarna `supabase db push`; de seed blijft via de SQL-editor.)*

## 3. Jezelf beheerder maken

Nog in de SQL-editor (vul je eigen e-mailadres in):

```sql
update public.medewerkers set email = 'jouw@emailadres.nl' where naam = 'Dennis';
```

De e-mailadressen van Raymond, Bas en Lesley vul je straks in de app in, via **Beheer → Medewerkers**.

## 4. Inlogmails

De app logt in met een **code uit de mail** (6 cijfers). Een link alleen werkt niet goed op de iPhone: een app op het beginscherm opent links in Safari in plaats van in de app zelf. Daarom moet de code in de mail staan.

### 4a. Mailtekst aanpassen

**Authentication → Emails → Templates.** Pas deze twee sjablonen aan:

- **Magic link or OTP**
- **Confirm sign up** (deze krijgt iemand die voor het eerst inlogt)

Onderwerp: `Je inlogcode voor Loods Hoeksema`

Tekst:

```html
<h2>Inloggen bij Loods Hoeksema</h2>
<p>Je inlogcode is:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>Typ deze code in de app. De code is 1 uur geldig.</p>
<p>Of tik op <a href="{{ .ConfirmationURL }}">deze link</a> (werkt in de browser, niet in de app op het beginscherm van een iPhone).</p>
```

### 4b. Eigen mailserver (SMTP), nodig voor de medewerkers

De ingebouwde mailservice van Supabase stuurt **alleen naar teamleden van je Supabase-account**, en maar een paar mails per uur.
Raymond, Bas en Lesley krijgen hun code pas als je een eigen mailserver instelt:

**Authentication → Emails → SMTP Settings → Enable custom SMTP**

- Afzender: bijvoorbeeld `loods@hoeksema-schilderwerken.nl`, naam `Loods Hoeksema`
- Server, poort, gebruiker en wachtwoord: van je mailprovider. Dat kan je eigen zakelijke mail zijn (Microsoft 365, Google Workspace of je hostingpartij), of een verzenddienst zoals Brevo of Resend (gratis voor deze kleine aantallen).

Daarna kun je onder **Authentication → Rate Limits** het aantal mails per uur verhogen (bijvoorbeeld 30).

> Tip: test eerst alleen met je eigen adres. Werkt dat, stel dan de SMTP in en voeg de anderen toe.

### 4c. Adres van de app

**Authentication → URL Configuration**

- **Site URL**: het adres van de app uit stap 5, bijvoorbeeld `https://loods-hoeksema.vercel.app`
- **Redirect URLs**: hetzelfde adres, plus `http://localhost:5173` als je lokaal test

## 5. App online zetten (Vercel)

1. Ga naar <https://vercel.com> → **Add New → Project** → kies de GitHub-repository **wk-poule-2026** → **Import**.
2. **Project Name**: `loods-hoeksema` (dan wordt het adres `https://loods-hoeksema.vercel.app`).
3. **Root Directory** → **Edit** → kies `loods-dashboard/apps/scan`. De rest staat al in `apps/scan/vercel.json`, die ook het gedeelde pakket meeneemt.
4. **Environment Variables**: niets invullen. Het Supabase-adres en de publieke sleutel staan al in `apps/scan/.env.production`.
   *(Ander Supabase-project? Vul dan hier `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` in; dat gaat voor. Gebruik **nooit** de secret/service_role-sleutel.)*
5. **Deploy**. Na ongeveer een minuut krijg je een adres. Zet dat adres in stap 4c.

> Let op: de WK-poule staat in dezelfde repository. Die blijft gewoon werken; Vercel bouwt alleen de map `loods-dashboard/apps/scan`.

Wijzig je later iets in de code op GitHub, dan zet Vercel de nieuwe versie automatisch online. De app op de telefoons werkt zichzelf bij.

## 6. App op de telefoon zetten

**iPhone (Safari)**: open het adres → deelknop (vierkant met pijl) → **Zet op beginscherm** → **Voeg toe**.
**Android (Chrome)**: open het adres → menu (⋮) → **App installeren** (of *Toevoegen aan startscherm*).

Open de app vanaf het beginscherm, vul je e-mailadres in en typ de code uit de mail. De eerste keer vraagt de telefoon of de app de camera mag gebruiken: kies **Toestaan**.

> iPhone: lukt de camera niet, kijk dan bij Instellingen → Safari → Camera → *Vraag* of *Sta toe*.

---

## Lettertype en logo

- **Lettertype Square 721**: zet de bestanden in `apps/scan/public/fonts/` als `Square721-Bold.ttf` (van *SQR721B 2.TTF*) en `Square721-Roman.ttf` (van *TT0246M_.TTF*). Controleer of je licentie gebruik op een website toestaat.
- **Logo**: zolang `Hoeksema_Logo_Transparant.png` er niet is, gebruikt de app de vier huisstijlblokjes. De app-iconen maak je opnieuw met `npm run iconen`.

## Voor de ontwikkelaar: lokaal werken

```bash
cd loods-dashboard
npm install
cp apps/scan/.env.example apps/scan/.env.local   # vul URL en sleutel in
npm run dev            # app op http://localhost:5173 (ook bereikbaar vanaf je telefoon in hetzelfde wifi-netwerk)
npm run typecheck      # TypeScript-controle
npm run build          # productieversie
npm run test:db        # alle databaseregels testen op een lokale Postgres (Postgres 15+ nodig)
```

`npm run test:db` zet een tijdelijke database op, draait de migraties en de seed (twee keer) en controleert daarna 60+ regels:
winkelmand, overnemen, RLS, correcties, voorraad, keuringen en verf.
