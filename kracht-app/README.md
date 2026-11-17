# Kracht – persoonlijke krachttraining-app

Eigen app voor 3-4 krachttrainingen per week bij **FitButiq** (Spoorstraat 1, IJsselmuiden), met slaap, CPAP, O2Ring en herstel erbij.
Werkt als app op het beginscherm van de iPhone (PWA), ook zonder internet in de sportschool.

## Wat zit erin

| Onderdeel | Wat het doet |
|---|---|
| **Schema** | Voor een ervaren sporter die sterker, slanker en fitter wil: 3× volledig lichaam (A/B/C) of 4× boven/onder, gebouwd rond plate-loaded machines, dumbbells en veel roei-oefeningen, met conditie-intervallen. Blokken van 6 weken: instap, opbouw, zwaarste week, lichte week. |
| **Apparatuur** | Vink aan wat er bij FitButiq staat; per oefening wordt de beste variant gekozen (bijv. squat → hack squat → Smith → leg press). |
| **Training loggen** | Gewicht, herhalingen en RIR per set, vorige prestatie ernaast, rusttimer met piep, schijvencalculator (halterstang, plate-loaded machines, T-bar), opwarmsets, oefening wisselen, notities. |
| **Automatisch zwaarder** | Dubbele progressie: alle sets op het maximum → volgende keer zwaarder. Twee keer onder het minimum → 10% lichter. Lichte weken tellen niet mee als uitgangspunt. |
| **Herstelscore** | 0-100 uit slaap, CPAP (AHI + uren masker op), zuurstof van de O2Ring, HRV en rusthartslag t.o.v. je eigen gemiddelde, en de ochtendcheck. Bepaalt of je normaal, lichter of herstel traint. |
| **Voortgang** | Geschat maximum per oefening, records, sets per spiergroep, trainingen per week, conditie (VO2max), intervalminuten, totaal verplaatst gewicht, lichaamsgewicht. |
| **Herstel** | Slaap, uren CPAP, AHI, laagste zuurstof en zuurstofdips, HRV en rusthartslag per nacht (14/30/90 dagen). |
| **Lichaam** | Gewicht met afvaltempo, eiwitrichtlijn, vetpercentage, taille, heup, borst, arm, bovenbeen. |
| **Koppelingen** | Apple Health/Apple Watch via de iOS-app Opdrachten (klembord), Health Auto Export (JSON-bestand), O2Ring (ViHealth-CSV of ochtendcheck), SleepHQ/OSCAR (CSV), prisma APP (ochtendcheck). |
| **Back-up en export** | Back-up naar iCloud Drive via het deelmenu, terugzetten, CSV voor Excel (sets, herstel, metingen). |

Alle gegevens staan **lokaal op de telefoon** (IndexedDB). Maak wekelijks een back-up (de app herinnert je eraan).

## Documentatie

| Document | Waarvoor |
|---|---|
| [`docs/HANDLEIDING.md`](docs/HANDLEIDING.md) | App online zetten, op de iPhone installeren, de opdracht voor Apple Health maken, SleepHQ en prisma, back-up |
| [`docs/VOORTGANG.md`](docs/VOORTGANG.md) | Wat is af, gemaakte keuzes, open vragen en volgende stappen |

## Ontwikkelaar

```bash
cd kracht-app
npm install
npm run dev          # http://localhost:5174
npm test             # rekenlogica: progressie, herstelscore, imports, back-up
npm run build
npx vite preview --port 4174 & node tests/e2e.mjs test-results   # rondgang in iPhone-formaat (Playwright)
```

Structuur:

```
src/lib/        datamodel, opslag (IndexedDB), oefeningen, schema's, progressie, herstelscore, imports, back-up
src/components/ knoppen, onderblad, grafieken, ochtendcheck en import
src/pages/      Vandaag, Schema, Training (sessie), Voortgang, Herstel, Meer en subschermen
tests/          unit-tests (vitest) en e2e-rondgang (Playwright)
scripts/        app-iconen, voorbeeldgegevens voor screenshots
```
