# Voortgang Kracht

## Af (versie 1)

- PWA (Vite + React + TypeScript), werkt offline, installeerbaar op het iPhone-beginscherm, licht en donker thema.
- Kennismaking: naam, 3 of 4 trainingen per week, trainingsdagen, apparatuur bij FitButiq, dumbbellstap.
- Twee schema's: 3× volledig lichaam (A/B/C) en 4× boven/onder; per plek een voorkeurslijst van oefeningen met alternatieven (57 oefeningen).
- Blokken van 6 weken (instap, opbouw, zwaarste week, lichte week); handmatig nieuw blok of lichte week starten.
- Trainingslogger: gewicht/herhalingen/RIR, vorige prestatie, rusttimer met piep en scherm-aan, schijvencalculator, opwarmsets,
  oefening wisselen (eenmalig of voortaan), notities, sets toevoegen/verwijderen, overslaan, afronden met zwaarte en records,
  oude trainingen aanpassen of verwijderen.
- Dubbele progressie met automatische gewichtsverhoging, terugschakelen na twee keer onder het minimum; lichte weken en lichtere
  sessies tellen niet mee als uitgangspunt.
- Herstelscore uit slaap, CPAP, HRV, rusthartslag en ochtendcheck, met waarschuwingen (hoge AHI, < 4 uur CPAP, verhoogde rusthartslag, pijn).
- Voortgang: geschat maximum per oefening, records, sets per spiergroep, trainingen en kilo's per week, lichaamsgewicht.
- Herstel: grafieken en tabel per nacht; tik op een nacht om aan te passen.
- Lichaam: metingen met grafieken.
- Imports: iOS-opdracht (klembord of plakken), Health Auto Export (JSON), SleepHQ/OSCAR/eigen CSV. Handmatige waarden worden nooit door een import overschreven.
- Back-up (deelmenu → iCloud Drive), terugzetten, CSV-export voor Excel.
- Tests: 25 unit-tests op de rekenlogica en een Playwright-rondgang op iPhone-formaat (kennismaking → ochtendcheck → import → training → afronden → alle schermen → herladen).

## Gemaakte keuzes

- **Gegevens lokaal op de telefoon** (IndexedDB) in plaats van een database in de cloud: geen extra kosten, werkt zonder internet in de
  sportschool, en gezondheidsgegevens komen niet in de bedrijfsdatabase van de loods. Nadeel: zelf back-uppen.
- **Apple Health via de app Opdrachten**: een website kan HealthKit niet uitlezen. Een echte iOS-app kan dat wel, maar vraagt een Mac met
  Xcode en een Apple-ontwikkelaarsaccount.
- **prisma APP via de ochtendcheck**: de prisma APP heeft geen export of koppeling. SleepHQ via CSV, omdat de SleepHQ-API vanuit een
  website niet bruikbaar is zonder eigen server.
- **Apparatuurlijst FitButiq is een aanname**: de website van FitButiq geeft geen lijst. Standaard aan: halterstangen, rek, banken,
  dumbbells, kabels, lat pulldown, kabelroeien, leg press, Smith, beenstrekker/-buiger, chest/shoulder press, pec deck, optrekstang,
  rugstrekbank, kettlebells. Standaard uit: hack squat, trap bar, hip thrust-machine, kuitmachine.

## Open vragen

1. Klopt de apparatuur bij FitButiq? (Aanpassen in de app kan altijd.)
2. Ervaring, blessures of beperkingen (rug, schouders, knieën)? Dan pas ik de oefeningkeuze en startgewichten aan.
3. Doel: vooral sterker, meer spiermassa, of afvallen/fitter? Nu een mix (kracht op de basisoefeningen, spiermassa op de rest).
4. Heb je een Apple Watch? Zonder Watch zijn er geen HRV en rusthartslag; de herstelscore gebruikt dan slaap, CPAP en de ochtendcheck.

## Volgende stap (fase 2, optioneel)

Automatisch synchroniseren met een kleine online database (Supabase):

- de opdracht stuurt elke ochtend vanzelf de Apple Health-gegevens (of Health Auto Export via REST-automatisering);
- SleepHQ wordt via zijn API automatisch opgehaald;
- altijd een back-up in de cloud en dezelfde gegevens op meerdere apparaten.

Dit kost een extra Supabase-project (of een eigen schema in een bestaand project) en vraagt eenmalig je SleepHQ-API-gegevens.
