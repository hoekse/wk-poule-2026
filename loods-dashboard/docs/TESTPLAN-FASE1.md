# Testplan fase 1: scan-app

Doel: vaststellen of registreren in de praktijk **binnen 10 seconden** lukt en of alles klopt.
Doe de test het liefst in de loods zelf (licht, wifi en werkhandschoenen zoals in het echt).
Noteer bij elke stap: gelukt / niet gelukt / opmerking.

## Voorbereiding (Dennis)

1. Installatie gedaan volgens `INSTALLATIE.md` (inclusief stap 4b als de anderen meedoen).
2. Log in op je eigen telefoon. Je ziet **Beheer** op het startscherm.
3. **Beheer → Medewerkers**: vul de e-mailadressen van Raymond, Bas en Lesley in en kies per persoon de standaardbus.
4. **Beheer → Bussen**: vul het kenteken van de ID. Buzz in en voeg de andere bussen toe.
5. **Beheer → QR-labels printen**: kies *Alles hierboven kiezen* en druk één vel af (gewoon papier is goed voor de test).
   Knip de labels uit en plak ze op iets in de buurt van de juiste zone.

> De 13 artikelen met "(voorbeeld)" in de naam zijn testartikelen. Na de test kun je ze aanpassen naar echte artikelen of deactiveren.

## Test 1: Inloggen (iedereen)

| Stap | Verwacht |
|---|---|
| App op het beginscherm zetten en openen | Inlogscherm met vier gekleurde blokjes |
| E-mailadres invullen → **Stuur inlogcode** | Mail met een code van 6 cijfers |
| Code typen → **Inloggen** | Startscherm met "Hoi [naam]" |
| App sluiten en een dag later weer openen | Meteen het startscherm, niet opnieuw inloggen |

## Test 2: Meenemen met de winkelmand (stopwatch erbij!)

Voorbeeld uit de projectbrief: Bas neemt boormachine + tacker + 12 staanders mee.

| Stap | Verwacht |
|---|---|
| **Meenemen** → camera aan | Camerabeeld met kader |
| QR van boormachine (GE-001) scannen | Piep + tril, "Toegevoegd: Boormachine…" |
| QR van tacker (GE-002) scannen | Tweede regel in de lijst |
| QR van staanders (ST-001) scannen, dan **+10** en **+** | Aantal staat op 12; "Nog 24 stuks in de loods" |
| **Verder (3)** | Project en bus; bus staat al goed |
| Project kiezen (of **Ander of nieuw project** → naam typen → *Nieuw project: …*) | Project blauw gemarkeerd |
| **Meenemen bevestigen** | Groen vinkje "Meenemen geregistreerd" |

⏱ **Meet de tijd** van het openen van Meenemen tot het groene vinkje. Doel: ongeveer 10 seconden voor één artikel.

Extra controles:
- Hetzelfde staanderslabel nog een keer scannen: het aantal gaat +1, er komt geen nieuwe regel bij.
- Lukt de camera niet? Tik op **Code typen** en typ `GE-001`.
- In een donkere hoek: verschijnt rechtsboven in het camerabeeld een lampje? Tik erop. *(Alleen Android; de iPhone staat dit in de browser niet toe.)*

## Test 3: Mijn spullen

| Stap | Verwacht |
|---|---|
| **Mijn spullen** | Boormachine, tacker en 12 staanders, met bus, project en "vandaag" |
| Tab **Iedereen** | Ook wat anderen mee hebben, met hun naam en kleur |

## Test 4: Terugbrengen

| Stap | Verwacht |
|---|---|
| **Terugbrengen** | Onder de camera "Wat jij nu mee hebt" |
| **Alles toevoegen (3)** | Alle drie in de lijst; staanders staan op 12 |
| Staanders met **−** naar 10 (2 blijven op de bouw) | 10 |
| **Terugbrengen bevestigen** | Groen vinkje; Mijn spullen toont nog 2 staanders |

## Test 5: Iets van een collega

| Stap | Verwacht |
|---|---|
| Bas neemt de tacker mee. Daarna scant Raymond dezelfde tacker bij **Meenemen** | Melding "Staat nog op naam van Bas. Wordt naar jou overgezet." Na bevestigen staat de tacker bij Raymond. |
| Lesley scant die tacker bij **Terugbrengen** | In de lijst staat "van Raymond". Na bevestigen staat de tacker weer in de loods. |

## Test 6: Verbruik (kit, goldtape, schuurpapier)

| Stap | Verwacht |
|---|---|
| **Verbruik pakken** → Goldtape (VB-001) scannen, nog een keer scannen | Aantal 2 |
| **Verbruik bevestigen** | Groen vinkje |
| Dennis: **Beheer** | Bij minder dan 6 rollen: Goldtape onder *Aandacht nodig* |

Tip: kit en tape hebben vaak al een streepjescode van de fabrikant. Vul die bij het artikel in als *EAN*; dan hoef je er geen QR-label op te plakken.

## Test 7: Restverf

| Stap | Verwacht |
|---|---|
| **Restverf invoeren** → streepjescode op een verfbus scannen | Nieuwe bus: merk en product één keer invullen |
| Kleurcode, glansgraad, ½ → **Restverf opslaan** | "Restverf opgeslagen" |
| **Nog een bus invoeren** → dezelfde soort bus scannen | Merk en product staan al klaar; alleen kleurcode en vulling invullen |
| **Restverf zoeken** → kleurcode typen | De bussen verschijnen; tik erop → **Ik gebruik deze bus** |

## Test 8: Beheer (Dennis)

- **Artikelen → Nieuw artikel**: maak een echte ladder aan (bijv. *Schuifladder 2x12*, Ladder, Per stuk, zone B2, *Moet gekeurd worden*). Hij krijgt automatisch een code (LA-004 enz.). Voeg een keuring toe.
- **Label printen** vanaf dat artikel. Tip: met *Begin bij label nummer* gebruik je een half gebruikt etiketvel verder.
- **Correcties**: Goldtape → *Voorraad bijstellen* → Erbij 10 → reden "Nieuwe doos". De voorraad loopt op.
- **Correcties**: staanders → *Onderweg herstellen* → Bas → Eraf → "vergeten te scannen". Ze staan niet meer bij Bas.
- **Historie**: alles hierboven staat erin, met naam en tijd. Niets is te wijzigen of te wissen (dat is zo bedoeld).
- **Zones**: tik op B1 en pas de breedte aan na nameten. Vink *Maat is geschat* uit als je gemeten hebt.
- **Medewerkers**: maak een testmedewerker aan en deactiveer die weer.

## Test 9: Beveiliging

- Log in met een e-mailadres dat níet bij Medewerkers staat → "Nog geen toegang".
- Raymond ziet geen knop **Beheer**.

## Wat Dennis terugmeldt

1. Lukt registreren binnen 10 seconden? Waar gaat tijd verloren?
2. Werkt de camera op alle telefoons (merk en type)? Ook in de donkere hoeken?
3. Is de wifi overal goed genoeg? (Zonder verbinding kan de app niet registreren; hij laat dan een duidelijke melding zien.)
4. Zijn de knoppen groot genoeg met handschoenen?
5. Teksten die onduidelijk zijn of anders moeten.
