# Handleiding Kracht

## 1. App online zetten (eenmalig, ±5 minuten)

De app is een website die je op je beginscherm zet. Hosting gaat via Vercel, net als de loods-app.

1. Ga naar <https://vercel.com> → **Add New → Project** → kies de GitHub-repository **wk-poule-2026** → **Import**.
2. **Project Name**: bijvoorbeeld `kracht-dennis` (het adres wordt dan `https://kracht-dennis.vercel.app`).
3. **Root Directory** → **Edit** → kies `kracht-app`. De rest staat al in `kracht-app/vercel.json`.
4. **Deploy**. Na ±1 minuut staat de app online.

> Vercel bouwt standaard de branch `main`. Staat de app nog op een andere branch, voeg die dan eerst samen (pull request) of kies in Vercel bij
> *Settings → Git → Production Branch* de juiste branch.

## 2. Op de iPhone zetten

1. Open het adres in **Safari** (niet in Chrome).
2. Tik op het deelicoon (vierkantje met pijl) → **Zet op beginscherm** → **Voeg toe**.
3. Open **Kracht** vanaf je beginscherm. Beantwoord de drie vragen: naam, 3 of 4 keer per week en welke dagen, en wat er bij FitButiq staat.

De app werkt daarna ook zonder internet. Updates komen vanzelf binnen als je online bent.

## 3. Apparatuur bij FitButiq

Ik kon de apparatuurlijst van FitButiq niet online vinden. Standaard staat aan wat in een goed uitgeruste sportschool staat; hack squat, trap bar,
hip thrust-machine en kuitmachine staan uit. Loop één keer met de app door de zaal: **Meer → Apparatuur bij FitButiq** en zet aan/uit wat klopt.
Het schema past zich direct aan. Staat er tijdens het trainen iets bezet of kapot: tik op **Wissel** bij de oefening.

## 4. Trainen

1. **Vandaag** → kijk naar je herstelscore → kies *Volgens schema*, *Lichter* of *Herstel* → **Start**.
2. Per set: gewicht (staat al ingevuld), herhalingen, eventueel RIR (hoeveel had je nog gekund), dan het vinkje. De rusttimer start vanzelf.
3. Bij halterstang-oefeningen zie je welke schijven per kant erop moeten.
4. Aan het eind staan **intervallen**: 6 rondes van 20-30 seconden voluit op de hometrainer, roeier of airbike, daarna rustig door tot de timer afgaat.
   Je noteert de seconden die je voluit ging.
5. **Afronden** → zwaarte 1-10 → **Opslaan**. Nieuwe records worden gemeld.

Het schema is gemaakt voor een ervaren sporter die **sterker, slanker en fitter** wil worden: de basisoefeningen zwaar (4×4-6, deadlift 3×3-5),
hulpoefeningen in 8-15 herhalingen en korte intervallen voor conditie. Op rustdagen: 30-45 minuten rustig bewegen en minstens 8.000 stappen.
Bij **Lichaam** zie je hoe snel je afvalt (goed is 0,25-0,75% per week) en hoeveel eiwit je nodig hebt.

Tip: draag je een Apple Watch, start daar dan een workout *Krachttraining*. Hartslag en calorieën komen dan in Apple Health.

## 5. Apple Health koppelen (opdracht, ±5 minuten eenmalig)

Een website mag Apple Health niet zelf uitlezen. Daarom maak je één keer een **opdracht** in de app *Opdrachten*. Daarna: in Kracht op
**Apple Health** tikken → **Opdracht uitvoeren** → terug naar Kracht → **Plakken** → **Opslaan**.

Maak de opdracht zo (de stappen staan ook in de app onder **Meer → Koppelingen**):

1. Open **Opdrachten** → **+** → noem de opdracht precies **Kracht Gezondheid**.
2. **Slaap**: zoek in de acties op “gezondheid” en voeg *Zoek naar gezondheidsmonsters* toe (Engels: *Find Health Samples*).
   Type **Slaapanalyse**, startdatum in de laatste **18 uur**, filters: *Waarde is niet In bed* en *Waarde is niet Wakker*.
   Daarna *Haal details op van gezondheidsmonsters* → **Duur**, en *Bereken statistieken* → **Som**.
3. **HRV**: *Zoek naar gezondheidsmonsters*, type **Hartslagvariabiliteit**, laatste 1 dag → *Bereken statistieken* → **Gemiddelde**.
4. **Rusthartslag** (laatste 1 dag) en **Gewicht** (laatste 7 dagen): sorteer op startdatum, nieuwste eerst, limiet 1.
5. **Zuurstof** (O2Ring of Apple Watch): type **Zuurstofsaturatie**, laatste 12 uur → *Bereken statistieken* → **Minimum**.
   **Conditie**: type **Cardiofitheid** (VO2 max), laatste 30 dagen, nieuwste eerst, limiet 1.
6. Voeg **Woordenboek** toe met de sleutels `slaap`, `hrv`, `rusthartslag`, `gewicht`, `spo2_min`, `vo2max` en kies als waarde telkens de uitkomst van de stap erboven.
7. Als laatste: **Kopieer naar klembord** (het Woordenboek).

De app begrijpt ook: `stappen`, `actieve_energie`, `vetpercentage`, `diepe_slaap`, `rem_slaap`, `datum` (JJJJ-MM-DD), `cpap_uren`, `ahi`, `lekkage`.
Getallen met komma, eenheden (“45,3 ms”, “92,4 kg”) en slaap in seconden, minuten of uren worden allemaal herkend.
Een lege meting (0) wordt overgeslagen.

**Alternatief:** de app *Health Auto Export* (App Store) maakt een JSON-bestand van je gegevens (aggregatie per dag). Dat bestand importeer je via
**Meer → Koppelingen → Bestand importeren**. Handig om in één keer maanden geschiedenis binnen te halen.

## 6. prisma APP (Löwenstein)

De prisma APP deelt geen gegevens met andere apps. Neem elke ochtend drie getallen over in de **Ochtendcheck**: *masker op* (bijv. `7u05`),
*AHI* en eventueel *lekkage*. Dat kost 15 seconden en telt voor een kwart mee in je herstelscore.

## 7. O2Ring (zuurstof 's nachts)

De O2Ring laat zien of je CPAP echt goed werkt: hoe laag je zuurstof zakt en hoe vaak (dips van 4% of meer).

- **Snel, elke ochtend:** neem in de **Ochtendcheck** de *laagste zuurstof* en het *aantal dips (≥ 4%)* over uit de ViHealth-app.
  De app rekent zelf de dips per uur uit met je slaapduur.
- **Volledig:** deel of exporteer de nacht in ViHealth als **CSV-bestand** en importeer het via **Meer → Koppelingen → O2Ring → CSV importeren**.
  De app berekent gemiddelde en laagste zuurstof, dips per uur (een schatting), minuten onder 90% en je polsslag.
- Zet ViHealth je metingen in Apple Health, dan kan de opdracht de laagste zuurstof meenemen (sleutel `spo2_min`).

Telt voor 15% mee in je herstelscore. Zakt je zuurstof onder de 85% of heb je meer dan 10 dips per uur, dan krijg je een waarschuwing.

## 8. SleepHQ

Exporteer je nachten in SleepHQ (of OSCAR) als CSV en importeer het bestand via **Meer → Koppelingen → CSV importeren**. De app zoekt zelf de
kolommen datum, AHI, gebruiksduur, lekkage en druk en laat eerst zien wat er binnenkomt. SleepHQ en OSCAR zetten de datum van de *avond* bij een
nacht; de app schuift die standaard naar de ochtend (uit te zetten bij het importeren).

## 9. Back-up

**Meer → Back-up en export → Back-up maken** → in het deelmenu **Bewaar in Bestanden** → iCloud Drive. Doe dit wekelijks; de app herinnert je
eraan. Nieuwe telefoon: app installeren → **Back-up terugzetten**.

Voor Excel of Numbers: dezelfde pagina heeft CSV-exports van alle sets, slaap/herstel en metingen.

## 10. Herstelscore in het kort

| Onderdeel | Gewicht | Wat telt |
|---|---|---|
| Slaap | 25% | uren t.o.v. je slaapdoel (standaard 7u30); zonder Apple Health telt de CPAP-tijd |
| CPAP | 25% | AHI (onder 5 = goed) en uren masker op (6+ = goed, onder 4 = slecht) |
| Zuurstof (O2Ring) | 15% | laagste zuurstof (92%+ = goed, onder 85% = slecht), dips per uur, minuten onder 90% |
| HRV | 20% | t.o.v. je eigen gemiddelde van de afgelopen 30 dagen |
| Rusthartslag | 10% | hoger dan je gemiddelde = minder hersteld |
| Ochtendcheck | 20% | energie, spierpijn, stress, zware werkdag |

75+ = volgens schema, 55-74 = lichter (1 set minder, 1 herhaling extra over), onder 55 = herstelsessie of rust.
De app is geen medisch hulpmiddel: blijft je AHI hoog, neem dan contact op met je slaapcentrum.
