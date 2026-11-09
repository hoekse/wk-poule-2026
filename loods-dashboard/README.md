# Loods Dashboard – Hoeksema Schilderwerken

Live overzicht van alles in de loods (Industrieweg 3-U, Kampen): steigers, ladders, gereedschap, restverf en verbruiksartikelen.

- **Telefoon (PWA)**: QR- of streepjescode scannen → meenemen, terugbrengen, verbruik of restverf invoeren. Binnen 10 seconden.
- **Tv in de loods** (fase 2): 3D-model van de loods dat per zone kleurt naar status, met een live lijst *Onderweg*.

De volledige projectbrief staat in [`CLAUDE.md`](CLAUDE.md); de goedgekeurde 3D-indeling in [`loods-3d-preview.html`](loods-3d-preview.html).

## Stand van zaken

Fase 1 (scan-app) is gebouwd en getest. Zie [`docs/VOORTGANG.md`](docs/VOORTGANG.md) voor wat er af is, de gemaakte keuzes en de open vragen.

| Document | Waarvoor |
|---|---|
| [`docs/INSTALLATIE.md`](docs/INSTALLATIE.md) | Supabase, inlogmails, Vercel en de app op de telefoon zetten |
| [`docs/TESTPLAN-FASE1.md`](docs/TESTPLAN-FASE1.md) | Stap voor stap testen in de loods |
| [`docs/VOORTGANG.md`](docs/VOORTGANG.md) | Wat is af, wat moet nog, open vragen |
| [`docs/RASPBERRY-PI.md`](docs/RASPBERRY-PI.md) | Raspberry Pi 5 als kiosk-computer voor de tv |

## Structuur

```
apps/scan          telefoon-app (Vite + React + TypeScript, PWA, @zxing/browser)
apps/tv            3D-tv-dashboard (fase 2, nog niet gebouwd)
packages/shared    types, Supabase-client, huisstijl, loodsmaten
supabase/          migraties, seed-data, databasetests
scripts/           databasetest, app-iconen
docs/              handleidingen en voortgang
```

## Snel starten (ontwikkelaar)

```bash
npm install
cp apps/scan/.env.example apps/scan/.env.local   # Supabase-URL en publishable key invullen
npm run dev          # http://localhost:5173
npm run typecheck
npm run build
npm run test:db      # migraties, seed en 60+ databaseregels testen op een lokale Postgres
```
