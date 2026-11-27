# Voortgang Loods Dashboard

*Laatst bijgewerkt: 27 november 2026*

| Fase | Status |
|---|---|
| **Fase 1 – Registratie (scan-app)** | ✅ Gebouwd en getest. **Klaar om door Dennis getest te worden** (zie `TESTPLAN-FASE1.md`). |
| Fase 2 – 3D-tv-dashboard | ⏸ Wacht op goedkeuring van fase 1. Handleiding Raspberry Pi staat al klaar. |
| Fase 3 – Slimme meldingen | ⏸ Datamodel is er al op voorbereid (keuringen, dagen weg, minimum). |
| **Extra – Kleurvoorbeeld** | ✅ Gebouwd en getest met testfoto's. **Klaar om met echte foto's te testen** (zie hieronder). |

---

## Kleurvoorbeeld (extra, 27 november 2026)

Op het startscherm staat de knop **Kleurvoorbeeld**. Daarmee maak je bij de klant een kleurvoorstel op een foto.

**Zo werkt het**
1. Kies wat er op de foto staat (voorgevel, achtergevel, woonkamer, slaapkamer, kantoor …) en eventueel het project of adres.
2. **Foto maken** of **Foto kiezen**. De app zoekt in ongeveer een seconde zelf de kleurvlakken (bijvoorbeeld *Gebroken wit*, *Antraciet*, *Roodbruin*) en zet ze als onderdelen onder de foto.
3. Tik op een onderdeel → **Nieuwe kleur kiezen**: veelgebruikte RAL-kleuren, alle 215 RAL-kleuren (zoeken op nummer of naam), **Mijn kleuren**, of **Eigen kleur** (bijv. een Sikkens- of Flexa-code met een kleur erbij, of een kleur uit de foto pakken). Eigen kleuren blijven op de telefoon bewaard.
4. Klopt de selectie niet helemaal? Gereedschap onder de foto:
   - **Vlak erbij / Vlak eraf**: tik op een vlak (toverstaf). Stopt vanzelf bij randen, zoals kozijn → muur. Met *Gevoeligheid* stel je in hoe ruim, met *Ook losse plekken* pak je die kleur in de hele foto.
   - **Penseel / Gum**: met je vinger schilderen of weghalen. Het penseel blijft standaard binnen dezelfde kleur (niet over de rand).
   - Inzoomen met twee vingers; **Hele foto** zet het terug.
   - **Nieuw onderdeel** voor iets dat dezelfde kleur heeft als iets anders maar een eigen kleur krijgt (bijv. de voordeur in een wit kozijn).
   - **Ongedaan maken** (pijltje rechtsboven), tot 12 stappen terug.
5. **Voor / na**: schuif over de foto om de huidige en de nieuwe kleuren te vergelijken.
6. **Delen** (rechtsboven): één afbeelding met voor en na (of alleen nieuw), de lijst met onderdelen en kleurcodes en de Hoeksema-kopregel. Via WhatsApp, mail of opslaan in de foto's.
7. Staat er restverf in de gekozen kleurcode in de loods, dan meldt de app dat ("Restverf op voorraad: 2 bussen met 9001").

**Techniek en keuzes**
- Alles gebeurt op de telefoon zelf: de foto wordt niet geüpload en er is geen internet nodig voor de beeldbewerking. Geen kosten per foto.
- Kleurvlakken zoeken met kleurgroepering (k-means) op kleur, met minder gewicht voor licht/schaduw; de toverstaf kijkt ook naar randen in de foto.
- Inkleuren met behoud van licht en schaduw: een muur die in de schaduw ligt, wordt in de nieuwe kleur ook donkerder. Randen worden zacht gemengd, zodat er geen lichte randjes om een kozijn blijven.
- RAL-kleuren met Nederlandse namen; schermkleuren zijn een benadering (dat staat ook op de gedeelde afbeelding).
- Het scherm wordt pas geladen als iemand het opent, dus de scan-app blijft even snel.
- Code: `apps/scan/src/kleur/` (rekenwerk en onderdelen) en `apps/scan/src/pages/Kleurvoorbeeld.tsx`.

**Beperkingen (eerlijk)**
- De app herkent kleuren, geen voorwerpen. Witte wolken of een witte schutting kunnen bij de groep van de witte kozijnen zitten; haal ze weg met *Vlak eraf* of de gum.
- Getest met nagemaakte testfoto's (gevel en woonkamer), omdat de testomgeving geen echte foto's kon downloaden. **Graag met echte foto's testen** en voorbeelden sturen waar het misgaat; dan stel ik de herkenning bij.
- Een kleurvoorbeeld wordt nog niet bewaard: na sluiten is het weg (wel eerst een waarschuwing). Delen of opslaan als afbeelding kan altijd.

**Vragen voor Dennis**
1. Wil je kleurvoorbeelden **bewaren bij een project** (in Supabase), zodat je ze later terugziet en verder kunt bewerken?
2. Welke kleurwaaiers gebruik je naast RAL (Sikkens 5051, Sigma, Flexa, NCS)? Merkkleuren mag ik niet zelf verzinnen; als je een kleurenlijst van de leverancier hebt (met kleurwaarden), zet ik die erin. Tot dan: *Eigen kleur* met code.
3. Moet het logo op de gedeelde afbeelding? Dat kan zodra `Hoeksema_Logo_Transparant.png` er is.
4. Mogen alle medewerkers het kleurvoorbeeld gebruiken, of alleen jij?

---

## Wat is af (fase 1)

### Database (Supabase, map `supabase/`)
- Tabellen volgens de brief: medewerkers, voertuigen, projecten, zones, artikelen, voorraad, bewegingen, verfrestanten, keuringen; plus `verfproducten` (geheugen voor EAN-codes van verfbussen).
- Views: `onderweg` (wie heeft wat, in welke bus, voor welk project, sinds wanneer), `artikel_overzicht` (stand per artikel, onder minimum, keuringsstatus) en `beweging_log` (historie met namen).
- Regels in de database zelf, dus ook geldig als iemand de app omzeilt:
  - Naam en tijdstip van een beweging zet altijd de server.
  - Bewegingen zijn niet te wijzigen of te wissen, ook niet door de beheerder. Fouten herstel je met een correctie.
  - Medewerkers registreren alleen op eigen naam. Alleen de beheerder maakt correcties en beheert artikelen, zones, bussen en medewerkers.
  - Een artikel met eigen nummer kan maar bij één persoon tegelijk zijn.
  - Je kunt niet meer terugbrengen dan er op iemands naam staat.
  - Er blijft altijd minstens één actieve beheerder over.
  - Nieuwe artikelen krijgen automatisch een QR-code per soort: LA-001 (ladder), ST- (steiger), GE- (gereedschap), VF- (verf), VB- (verbruik).
- Seed: Dennis (beheerder), Raymond, Bas, Lesley met hun vaste kleuren; de ID. Buzz; alle 17 zones met de maten uit de 3D-preview; 13 voorbeeldartikelen.
- Realtime staat al aan voor bewegingen en verfrestanten (voor de tv in fase 2).
- Automatische test (`npm run test:db`): 60+ controles op een lokale Postgres. Alles groen.

### Telefoon-app (PWA, map `apps/scan/`)
- Inloggen met een code uit de mail (plus link). Daarna blijf je ingelogd.
- Startscherm met drie grote knoppen: **Meenemen**, **Terugbrengen**, **Restverf invoeren**; daaronder Verbruik pakken, Mijn spullen, Restverf zoeken en (alleen Dennis) Beheer.
- **Winkelmand**: scan na scan, één keer bevestigen. Aantallen met grote − / + en snelknoppen +5 / +10. Nog een keer scannen telt +1.
- **Meenemen**: project kiezen (laatst gebruikte bovenaan, of snel een nieuw project toevoegen) en bus (standaardbus, anders de laatst gebruikte).
- **Terugbrengen**: standaard alles wat je mee hebt; knop *Alles toevoegen*. Iets van een collega terugbrengen kan ook.
- **Verbruik pakken**: kit, tape en schuurpapier; trekt het van de voorraad af.
- **Restverf**: EAN scannen; bekende bus = merk en product vooringevuld; vulling met 4 knoppen; foto (wordt verkleind voor het uploaden); zone standaard D2. Restverf zoeken op kleurcode, en markeren als gebruikt of afgevoerd.
- **Mijn spullen**: wat heb ik mee, en wie heeft wat.
- **Scanner**: QR, EAN-13/EAN-8 en Code 128, ook op iPhone. Piep en tril bij een scan, zaklamp (Android), en *Code typen* als de camera niet wil.
- **Beheer**: artikelen (incl. minimumvoorraad, beginvoorraad, keuringen), QR-labels printen (A4, 3 × 8 labels, beginnen bij label X), correcties (voorraad en onderweg), historie, medewerkers, bussen, projecten, zones (plattegrond van bovenaf met maten), en een blok *Aandacht nodig* (onder minimum, keuring, langer dan 14 dagen weg).
- Donker thema met hoog contrast, knoppen van minimaal 56 px (de meeste 64–112 px), alle teksten in het Nederlands.
- Installeerbaar op het beginscherm (iPhone en Android) en werkt zichzelf automatisch bij.
- End-to-end getest als telefoon (390 × 844): inloggen, meenemen (ook met een echte QR-scan via een nep-camera), terugbrengen, verbruik, restverf, onbekend e-mailadres, en alle beheerschermen. 22 stappen, geen fouten.

---

## Keuzes die ik heb gemaakt (graag akkoord of bijsturen)

1. **Inlogcode naast de magic link.** Op de iPhone opent een link uit de mail in Safari en niet in de app op het beginscherm; dan ben je in de app niet ingelogd. Met de 6-cijferige code werkt het altijd.
2. **Extra velden in het datamodel:** `medewerkers.email` (om in te loggen) en `kleur` (avatar), `artikelen.eenheid` en `omschrijving`, `bewegingen.houder_id` (op wiens naam het staat, zodat je ook iets van een collega kunt terugbrengen) en `batch_id` (één winkelmand), en zones met `omschrijving`, `maat_geschat` en `heeft_voorraad`.
3. **Correcties** hebben twee soorten: *voorraad bijstellen* (nieuwe doos, kapot) en *onderweg herstellen* (vergeten te scannen). Beide met verplichte reden.
4. **Medewerkers mogen zelf snel een project toevoegen** bij Meenemen, zodat ze nooit vastlopen. Dennis kan projecten hernoemen en afsluiten. *Risico: dubbele namen. Liever niet? Dan zet ik dit uit.*
5. **Iets meenemen dat nog op naam van een collega staat** zet het automatisch over (met een terug-regel voor de collega in de historie). Zo blijft het overzicht kloppen, ook als iemand vergat terug te scannen.
6. **Meer meenemen dan volgens het systeem aanwezig is** mag, met een waarschuwing. Blokkeren zou iemand op de bouw laten vastlopen door een telfout; de waarschuwing laat zien dat de telling niet klopt.
7. **Verlopen keuring** geeft nu een waarschuwing bij Meenemen. Blokkeren (met bevestiging) hoort bij fase 3.
8. **Project kiezen is verplicht** bij Meenemen (*Geen project* telt ook als keuze). Dat is één tik extra, maar het project wordt niet vergeten.
9. **De code staat in een eigen map** `loods-dashboard/` in de repository *wk-poule-2026*, op de werkbranch. De WK-poule blijft onaangeroerd. Advies: maak een eigen repository `loods-dashboard`; de map kan er zo in.

---

## Wat moet nog

### Nodig om fase 1 te testen (Dennis)
- [x] Supabase-project `hoeksema-loods` aangemaakt (Frankfurt) en database klaargezet: 5 migraties en startdata. Rooktest op de echte database geslaagd.
- [x] Bussen met kenteken: ID. Buzz V-54-JXL (Dennis), VJ-972-V (Bas), V-292-HN (Lesley), 12-VKH-9 (Raymond); ieder heeft zijn eigen bus als standaardbus.
- [x] App-code samengevoegd met `main`, klaar voor Vercel.
- [ ] App importeren in Vercel (`INSTALLATIE.md` stap 5, 3 klikken).
- [ ] In Supabase: Site URL instellen en de code in de inlogmail zetten (stap 4a en 4c).
- [ ] Jouw e-mailadres als beheerder (stap 3), daarna de anderen via Beheer → Medewerkers.
- [ ] Eigen mailserver (SMTP) instellen (stap 4b). Zonder eigen SMTP krijgen alleen teamleden van het Supabase-account een mail.
- [ ] Testen volgens `TESTPLAN-FASE1.md` en terugmelden.

### Daarna
- [ ] Echte artikellijst invoeren (of als lijst aanleveren; dan maak ik een import).
- [ ] Labels op weerbestendige etiketten printen.
- [ ] Fase 2: tv-dashboard (pas na goedkeuring van fase 1).

---

## Open vragen voor Dennis

1. **Merk/type van de bussen** van Bas, Lesley en Raymond (heten nu "Bus Bas" enz.; kentekens staan erin).
2. **E-mailadressen** van Dennis, Raymond, Bas en Lesley.
3. **Mailserver**: via welke dienst mogen de inlogmails verstuurd worden (eigen zakelijke mail, of Brevo/Resend)?
4. **Steigerinventaris** per onderdeel (staanders, liggers, vloeren, diagonalen, voetplaten, leuningen, koppelingen) en de Instant Span-onderdelen, met aantallen.
5. **Ladderlijst** (type, lengte, keuringsdatum) en het dure gereedschap dat een eigen nummer krijgt.
6. **Nameten**: entresol, kanteldeur, posities van de stellingen, diepte van de gang. Aanpassen kan zelf via *Beheer → Zones*.
7. **Logo en lettertypen** (`Hoeksema_Logo_Transparant.png`, `SQR721B 2.TTF`, `TT0246M_.TTF`). Mag het lettertype volgens de licentie op een website gebruikt worden?
8. **Wifi**: is er overal in de loods goede dekking? Zonder verbinding kan de app niet registreren.
9. **Labels**: welke etiketvellen wil je gebruiken? De app is ingesteld op A4 met 3 × 8 labels van 70 × 37 mm.
10. **Projecten**: wil je later projectnummers uit *Magister Colorum* gebruiken? Dan houd ik daar nu al rekening mee.
11. **Tv in fase 2**: de tv krijgt een eigen, beperkte login die alleen mag lezen. Akkoord?

---

## Tips en verbeterideeën

- **Fabrieksstreepjescode gebruiken**: kit, tape en schuurpapier hebben al een EAN. Vul die in bij het artikel; dan scan je de verpakking zelf en hoef je niets te plakken.
- **Eén label per stapel**: voor staanders en liggers één label aan de wand of stelling (zone C2) in plaats van op elk onderdeel.
- **Labels voor ladders en steigers** lamineren of op weerbestendige polyester-etiketten printen.
- **Afgesloten kast D3**: hang een vel met de QR-codes van alle verbruiksartikelen op de binnenkant van de deur. Dan hoeft niemand te zoeken.
- **Later (fase 3)**: bij Verbruik ook het project vastleggen, zodat je ziet welk project hoeveel kit en tape gebruikt (handig voor de nacalculatie in Magister Colorum).
- **Later**: registraties onthouden als er even geen wifi is, en versturen zodra er weer verbinding is. Eerst kijken of de wifi goed genoeg is.
