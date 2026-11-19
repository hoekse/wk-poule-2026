# Voortgang Kracht

## Af (versie 1)

- PWA (Vite + React + TypeScript), werkt offline, installeerbaar op het iPhone-beginscherm, licht en donker thema.
- Kennismaking: naam, 3 of 4 trainingen per week, trainingsdagen, apparatuur bij FitButiq, dumbbellstap.
- Twee schema's: 3× volledig lichaam (A/B/C) en 4× boven/onder; per plek een voorkeurslijst van oefeningen met alternatieven (70 oefeningen).
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
- Tests: unit-tests op de rekenlogica (35 in versie 1.2) en een Playwright-rondgang op iPhone-formaat (kennismaking → ochtendcheck → import → training → afronden → alle schermen → herladen).

## Af (versie 1.1, na antwoorden van Dennis)

Dennis: ervaren, geen blessures, doel sterker + slanker + fitter, draagt een Apple Watch en 's nachts een O2Ring.

- Schema's voor gevorderden: basisoefeningen 4×4-6 (deadlift 3×3-5), hulpoefeningen 8-15, conditie-intervallen (6×20-30 s) als finisher.
  Apparaat "Hometrainer, roeiergometer of airbike" toegevoegd; zonder dat apparaat worden het kettlebell swing-intervallen.
- O2Ring: CSV-import uit ViHealth (gemiddelde/laagste zuurstof, dips per uur, minuten onder 90%, polsslag), velden in de ochtendcheck,
  15% van de herstelscore, waarschuwingen en grafieken bij Herstel.
- Apple Watch: zuurstof en VO2max via de opdracht en Health Auto Export; conditiegrafiek (VO2max) en intervalminuten bij Voortgang.
- Aftrainen: gewichtstempo (lijn door 4 weken metingen) met oordeel, eiwitrichtlijn, rustdagadvies met stappen.

## Af (versie 1.2): plate-loaded machines, dumbbells en rows

Dennis traint vooral met plate-loaded machines, roei-oefeningen en dumbbells.

- Nieuwe apparatuur en oefeningen: chest press, incline press, shoulder press, iso-lateral row, high row en pulldown (plate-loaded), T-bar row,
  pendulum squat, kroc row, dumbbell fly en pullover. Hack squat staat nu standaard aan.
- Schema's omgebouwd: per plek eerst de plate-loaded machine, dan dumbbells, dan de halterstang. Elke training minstens één roei- of
  trekoefening, bovenlichaamdagen (4×) twee tot drie. Deadlift en hip thrust blijven voor rug en billen.
- Gewicht bij plate-loaded machines = schijven totaal (beide kanten), zonder de machine. De schijvencalculator laat zien wat er per kant
  op moet, bij de T-bar wat er op de stang moet.

## Af (versie 1.3): hypermoderne vormgeving

- OLED-zwarte achtergrond met een blauw-cyaan gloed, glazen kaarten, zwevend menu onderin, verlopende knoppen, ringen en grafieken.
- Letters: Space Grotesk voor koppen en cijfers, Inter voor tekst (lokaal meegeleverd, werkt offline).
- Vandaag: grote herstelring, tegels per onderdeel (slaap, CPAP, zuurstof, HRV, rusthartslag, gevoel) en een uitgelichte trainingskaart.
- Licht thema werkt mee met de instelling van de iPhone.

## Af (versie 1.4): twaalf uitbreidingen en cloud

- Machine-instellingen per oefening, supersets (aan/uit), schouders ontzien na werk boven het hoofd, opwarmroutine van 5 minuten.
- Inzichten uit eigen gegevens, weekoverzicht met delen, voortgangsfoto's met vergelijken, eiwitteller, agendabestand (.ics),
  schijvenset en stanggewicht, advies voor een lichte week bij laag herstel en stilstand.
- Cloud (Supabase-project `kracht`): tabellen `kracht_staat`, `kracht_sleutels`, `kracht_inbox` met RLS; functie `kracht-health`
  (verify_jwt uit, beveiligd met een sleutel) voor de iOS-opdracht en Health Auto Export; synchronisatie en inloggen met e-mail en
  wachtwoord in de app. Databasetests: `bash scripts/test-db.sh`.
- Online via Vercel-project `kracht-hoeksema`.

Bewuste beperking: bij gelijktijdig gebruik op twee apparaten worden trainingen en metingen samengevoegd; iets wat op het ene apparaat is
verwijderd, kan via het andere terugkomen. Foto's blijven op de telefoon (en in de back-up).

## Af (versie 1.5): Panatta-machines met voorbeelden

- 21 Panatta-oefeningen: plate-loaded (chest press, incline press, shoulder press, lat pulldown, low row, high row, T-bar row, hack squat,
  pendulum squat, leg press 45°, hip thrust, calf) en met gewichtsstapel (pec deck, rear delt, lateral raise, triceps, biceps, pullover,
  leg extension, leg curl, abdominal crunch).
- Apart blok "Panatta-machines" bij Apparatuur; aangevinkte Panatta-machines staan in het schema bovenaan.
- Bij elke oefening "Zo doe je het": instellen, startpositie, beweging, let op (fouten), sets en gewicht als voorbeeld, en een knop naar
  voorbeeldvideo's (YouTube-zoekopdracht).
- Welke Panatta-machines er bij FitButiq staan is niet online te vinden: standaard aan staan de gangbare (chest/incline/shoulder press, lat
  pulldown, low/high row, hack squat, leg press, leg extension/curl, pec deck). De rest staat uit; aan te passen bij Apparatuur.

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

1. Klopt de apparatuur bij FitButiq? (Aanpassen in de app kan altijd.) Staat er een hometrainer, roeier of airbike voor de intervallen?
2. Exporteert jouw versie van de ViHealth-app een nacht als CSV? Zo niet: dan de ochtendcheck gebruiken, of een voorbeeldbestand sturen zodat ik de import erop afstem.

## Volgende stap (fase 2, optioneel)

Automatisch synchroniseren met een kleine online database (Supabase):

- de opdracht stuurt elke ochtend vanzelf de Apple Health-gegevens (of Health Auto Export via REST-automatisering);
- SleepHQ wordt via zijn API automatisch opgehaald;
- altijd een back-up in de cloud en dezelfde gegevens op meerdere apparaten.

Dit kost een extra Supabase-project (of een eigen schema in een bestaand project) en vraagt eenmalig je SleepHQ-API-gegevens.
