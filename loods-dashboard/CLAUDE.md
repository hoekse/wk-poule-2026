# Loods Dashboard – Hoeksema Schilderwerken

Projectbrief voor Claude Code. Lees dit bestand volledig voordat je code schrijft.
Opdrachtgever: Dennis Hoeksema (eigenaar). Communiceer en schrijf alle UI-teksten in het **Nederlands**.

> Voortgang, gemaakte keuzes en open vragen staan in `docs/VOORTGANG.md`. Lees die ook.

---

## 1. Doel

Een live overzicht van alles wat in de loods hoort (Industrieweg 3-U, 8263 AA Kampen, begane grond):
steigers, ladders, gereedschap, verf(restanten) en verbruiksartikelen.

- **Telefoon (PWA):** medewerkers scannen een QR- of streepjescode en registreren *meenemen* / *terugbrengen* / *restverf invoeren*. Naam, datum/tijd en bus worden automatisch ingevuld.
- **Tv in de loods:** een 3D-model van de loods waarin elke zone kleurt naar status, plus een live lijst "Onderweg".
- **Doel achter het doel:** minder verdwenen materiaal (kit, goldtape, schuurpapier), altijd weten wat er is en waar het is.

Gouden regel: **registreren mag nooit meer dan 10 seconden kosten.** Kost het meer, dan gebruikt niemand het.

---

## 2. Gebruikers

| Naam | Rol | Rechten |
|---|---|---|
| Dennis | Eigenaar / beheerder | Alles: artikelen, zones, voertuigen, medewerkers, keuringen, correcties |
| Raymond | Allround schilder | Scannen, meenemen, terugbrengen, restverf invoeren |
| Bas | Allround schilder | idem |
| Lesley | Allround schilder | idem |

- Medewerkers moeten eenvoudig toe te voegen en te deactiveren zijn (nooit hard verwijderen: historie blijft).
- Iedere medewerker heeft een **standaardbus** die automatisch wordt ingevuld (aanpasbaar per registratie).

## 3. Voertuigen

Beheerbaar in de beheerpagina. Startdata:
- Volkswagen ID. Buzz Cargo (bedrijfsbus) – kenteken: *door Dennis in te vullen*
- Overige bussen: *door Dennis in te vullen*

---

## 4. Techniek

| Onderdeel | Keuze | Waarom |
|---|---|---|
| Database / auth / realtime | **Supabase** (Postgres, Row Level Security, Realtime) | Live updates naar de tv; later dezelfde database als Dennis' bedrijfsapp "Hoeksema Magister Colorum" |
| Telefoon-app | **PWA** – Vite + React + TypeScript | Geen App Store nodig, te installeren op beginscherm (iOS + Android) |
| Scannen | `@zxing/browser` (QR + EAN-13) | Werkt ook op iPhone Safari (BarcodeDetector API niet) |
| Tv-dashboard | Vite + TypeScript + **Three.js** (r128-API, eigen orbit-besturing zoals in de preview) | 3D-weergave |
| Tv-hardware | Sony tv via HDMI + **Raspberry Pi 5 (8 GB)**, Chromium in kioskmodus | De tv-browser zelf is te zwak voor 3D |
| Hosting | Vercel (statische build van beide apps) | |

Structuur (monorepo):
```
/apps/scan      → telefoon-PWA
/apps/tv        → 3D-tv-dashboard
/packages/shared → types, Supabase-client, huisstijl-tokens
/supabase       → migraties, seed-data, RLS-policies
/docs           → installatiehandleiding Raspberry Pi
```

### Prestatie-eisen tv (Raspberry Pi 5)
- Low-poly scène: alleen basisvormen (boxen, cilinders). Geen zware modellen of schaduwen.
- `InstancedMesh` voor herhalende objecten (sporten, verfbussen, steigerdelen).
- Maximaal 30 fps, `devicePixelRatio` begrensd op 1.
- Langzame automatische camerarondgang. Pauzeer de rendering als er niets verandert.
- Moet 24/7 stabiel draaien: automatisch herladen bij verbindingsverlies, 's nachts (bijv. 03:00) volledige herlaadbeurt.
- Tv-resolutie: 1920×1080, leesbaar vanaf 4–5 meter afstand (minimale tekstgrootte ~28 px).

---

## 5. Datamodel (eerste opzet)

```
medewerkers     id, naam, actief, standaard_voertuig_id, rol (beheerder|medewerker), auth_user_id
voertuigen      id, naam, kenteken, actief
projecten       id, naam, adres, actief            -- later te koppelen aan Magister Colorum
zones           id, code, naam, wand, x, y, z, breedte, diepte, hoogte, kleur_override
artikelen       id, naam, categorie, telwijze, zone_id, qr_code, ean, minimum_voorraad,
                keuring_verplicht, keuring_interval_maanden, foto_url, actief
                -- categorie: steiger | ladder | gereedschap | verf | verbruik
                -- telwijze: per_stuk (eigen nummer) | aantal (bijv. 24 staanders)
voorraad        artikel_id, aantal_totaal                 -- alleen voor telwijze=aantal
bewegingen      id, artikel_id, type (mee|terug|correctie|verbruikt), aantal,
                medewerker_id, voertuig_id, project_id, tijdstip, opmerking
verfrestanten   id, ean, merk, product, kleurcode, glansgraad, basis (synthetisch|watergedragen),
                inhoud_liter, vulling (vol|3/4|1/2|1/4), geopend_op, zone_id, foto_url,
                ingevoerd_door, status (aanwezig|gebruikt|afgevoerd)
keuringen       id, artikel_id, gekeurd_op, geldig_tot, door, opmerking
```

Afgeleide view `onderweg`: per artikel wat er buiten de loods is, bij wie, in welke bus en sinds wanneer.

Regels:
- `tijdstip` en `medewerker_id` worden altijd door de server/sessie gezet, nooit handmatig.
- Een beweging wordt nooit bewerkt of verwijderd. Fouten herstel je met een `correctie`-beweging (audittrail).
- RLS: medewerkers mogen alleen bewegingen op eigen naam aanmaken. Beheerder mag alles.

---

## 6. De loods (begane grond) – vastgestelde indeling

Indeling is door Dennis gecontroleerd in de 3D-preview (`loods-3d-preview.html`, meegeleverd in deze map).
**Gebruik de geometrie uit dat bestand als bron** (array `zones` en de vaste elementen). Maten met (≈) zijn geschat; bouw een zone-editor zodat Dennis ze kan bijstellen zonder code.

### Afmetingen en assenstelsel
- Binnenmaat: **10,60 m (langs de ladderwand) × 9,40 m (langs de voorgevel)** – gemeten. Plafond ≈ 3,6 m.
- Oorsprong (0,0) = hoek voorgevel (kanteldeur) × ladderwand.
- x loopt langs de ladderwand (0 → 10,60 m), z langs de voorgevel (0 → 9,40 m), y = hoogte.

### Wanden en vaste elementen
| Element | Positie (m) | Opmerking |
|---|---|---|
| Voorgevel (wand A) | x = 0 | Kanteldeur z 0,5–3,5 (≈3 m breed); ramen z 5,9–7,6 |
| Ladderwand (wand B) | z = 0 | gemeten 10,60 m |
| Achterwand (wand C) | x = 10,60 | gemeten 9,40 m; deur trappenhuis z 8,65–9,3 (≈) |
| Buitenwand (wand D) | z = 9,40 | achter de gang en bij riool/water |
| **Verfwand** | z ≈ 7,80–7,90, x 0–5,65 | staat **150 cm naar voren**; daarachter de gang. Kleurbalken rood/geel/blauw/groen boven de verfstelling |
| **Deur naar hal** (rood) | in de verfwand, x 0,68–1,53 | tussen de hoek en de bouwstofzuigers; aan beide zijden rood |
| **Gang** | x 0–5,6, z 7,95–9,35 | ±150 cm diep, achter de verfwand |
| **Trap naar kantoor** | in de gang, x 3,5–5,8 | begint ±3,5 m van de voorgevel, loopt op richting achterwand |
| Entresol (vliering) | x 7,6–10,6, z 0–5,0, bovenkant 2,4 m (≈) | hoek ladderwand/achterwand |
| Brandblusser | achterwand, z ≈ 5,8 | vast punt |

### Zones
| Code | Naam | Positie (x / z in m) | Telwijze |
|---|---|---|---|
| B1 | Trap- en reformladders | x 0,1–1,7, ladderwand | per stuk |
| B2 | Opgehangen ladders | x 1,8–6,4, hoog aan ladderwand | per stuk + keuring |
| B3 | Steigerkoppelingen en PBM | x 1,8–4,4, vloer ladderwand | aantallen |
| B4 | Steekwagen en losse delen | x 4,5–6,4 | per stuk |
| B5 | Huishoudtrappen en rolsteigerframes | x 6,5–7,5 | per stuk / aantallen |
| B6 | Stellingkast verf en koffers | x 7,8–10,0, onder entresol | per stuk |
| E1 | Bovenop de entresol (Instant Span, dekzeilen) | x 7,75–10,45, z 0,15–4,85 | aantallen per onderdeel |
| E2 | Onder de entresol (verf, koffers, airless spuit) | achterwand z 0,8–4,6 | per stuk |
| C2 | Steigerframes en staanders | achterwand z 5,1–6,4 | aantallen |
| C3 | Materieel (hogedrukreiniger, palletwagen) | achterwand z 6,6–8,4 | per stuk |
| D2 | Verfstelling (Synthetisch / Watergedragen) | verfwand x 3,9–5,65 (begin gemeten) | verfrestanten |
| D3 | Verbruiksartikelen (kit, goldtape, schuurpapier) | verfwand x 2,2–3,85 | aantallen + minimum; komt afgesloten kast |
| D4 | Bouwstofzuigers | verfwand x 2,2–3,85, vloer | per stuk |

Vaste punten zonder voorraad (grijs tonen, niet in voorraadsysteem):
- **D1 Riool en water**: strook 200 × 60 cm tegen buitenwand D, x 5,8–7,8, direct links naast het hoge deel van de trap. Kraan en afvoerput.
- **GA Gang**, **AC Afvalcontainer** (x 0,25–1,5, z 4,2–5,9), **OV Overig** (karts e.d., x 8,4–9,4, z 5,6–8,0).

## 7. Functionaliteit per fase

### Fase 1 – Registratie (MVP) — eerst bouwen en laten testen
1. Inloggen op de telefoon met e-mail-magic-link, daarna blijvend ingelogd.
2. Startscherm met drie grote knoppen: **Meenemen**, **Terugbrengen**, **Restverf invoeren**.
3. **Meenemen:** scan QR → artikel verschijnt → (bij `aantal`: aantal kiezen met +/- knoppen) → project kiezen (laatst gebruikte bovenaan) → bus staat al ingevuld → **Bevestigen**. Datum/tijd automatisch.
4. **Terugbrengen:** scan QR → aantal (standaard: alles wat de medewerker mee heeft) → **Bevestigen**.
5. **Meerdere items in één keer:** "winkelmand" – scan na scan, één keer bevestigen. Voorbeeld: Bas neemt boormachine + tacker + 12 staanders mee naar project X in de ID. Buzz.
6. **Restverf invoeren:** scan EAN op de bus. Bekend EAN → merk/product vooringevuld. Onbekend → één keer handmatig, daarna onthouden. Velden: kleurcode, glansgraad, vulling (4 knoppen), optioneel foto. Zone standaard Z-D2.
7. **Verbruik pakken** (kit, goldtape, schuurpapier): scan → aantal → bevestigen (`verbruikt`).
8. Overzicht "Mijn spullen": wat heb ik nu mee?
9. **Beheer (alleen Dennis):** artikelen, zones, voertuigen, medewerkers, projecten, minimumvoorraad, correcties, **QR-labels printen** (A4-vellen met naam, nummer, zone, Hoeksema-logo).

### Fase 2 – 3D-tv-dashboard (ontwerp vastgesteld)
Volg het ontwerp van `loods-3d-preview.html` – dat is goedgekeurd door Dennis. Vervang alleen de voorbeelddata door live data uit Supabase.

**Schermindeling (1920×1080):**
```
┌────────────────────────────────────────────────────────────────────────┐
│ ■■ Loods Industrieweg 3-U   [Ladders][Steigerdelen][Verf][Aandacht]  10:21 │
│ ■■ ● Live overzicht                                       Maandag 9 nov │
├──────────────────────────────────────────────────┬─────────────────────┤
│  [detailkaart zone]                [voorbeelddata]│ Onderweg (4)        │
│                                                   │  R Raymond  E1      │
│               3D-loods (draait langzaam)          │  ...                │
│                                                   │ Aandacht nodig (3)  │
│  [legenda]     [Rondgang|Overzicht|Boven|Labels]  │  ▌Goldtape  D3      │
└──────────────────────────────────────────────────┴─────────────────────┘
```
1. **Kopregel:** logo-kenmerk (4 huisstijlblokjes), titel, live-indicator; vier tellers (Ladders x/y, Steigerdelen x/y, Verfrestanten, Aandacht); klok + datum (nl-NL).
2. **Tellers met "ladder-sporten":** 12 segmenten, gevuld naar aandeel aanwezig; groen ≥ 90 %, geel ≥ 60 %, anders rood.
3. **3D-scène:** donkere vloer met 1 m-raster, blauwe contourlijn (#008CDC) om de loods, nepschaduw onder zones. Zones = lichaam in gedempte statuskleur + felle gekleurde bovenkant + gekleurde randlijnen. Rode zones pulseren zacht (niet bij reduced motion). Wanden die naar de camera wijzen worden doorzichtig (cutaway). Langzame rondgang.
4. **Labels:** pil met statusbolletje + code; bij selectie verschijnt de naam. Vaste labels: maten (10,60 m / 9,40 m), Kanteldeur, Ladderwand, Entresol, Verfwand, Trap naar kantoor, Deur naar hal (rood label).
5. **Detailkaart (glas-effect):** code, naam, plek, maat, inhoud, statusblok, melding als maat geschat is.
6. **Zijpaneel:** *Onderweg* (avatar met initiaal in vaste medewerkerskleur, wat, bus, project, sinds, zonecode) en *Aandacht nodig* (gekleurde vlag, titel, toelichting, zonecode). Klik op een regel → camera vliegt naar die zone en detailkaart opent.
7. **Live:** nieuwe beweging via Supabase Realtime → regel verschijnt in Onderweg, camera vliegt kort naar de zone, daarna terug naar rondgang (na 20 s geen interactie).
8. **Telefoon (≤ 900 px):** tellers horizontaal scrollbaar, 3D-scène 62 vh, zijpaneel eronder, detailkaart als onderblad.
9. **Thema:** donker is de standaard voor de tv; licht thema werkt mee via `prefers-color-scheme`.
10. Zone-editor in beheer (slepen/maten aanpassen) – bewaart in tabel `zones`.

Medewerkerskleuren (avatar): Raymond #008CDC, Lesley #8CB400, Bas #F0B400, Dennis #DC0014.

### Fase 3 – Slimme meldingen
- Artikel langer dan X dagen weg (instelbaar, standaard 14) → oranje op tv + melding aan Dennis.
- Keuringen (ladders, steigers, elektrisch gereedschap): verloopt binnen 30 dagen → melding; verlopen → artikel rood en niet uit te geven zonder bevestiging.
- Voorraad onder minimum → melding / bestellijst.
- Bij een nieuw project: tonen welke restverf er al is (zoeken op kleurcode).
- Verfrestanten ouder dan instelbare termijn → markeren om op te maken of af te voeren.

---

## 8. Huisstijl Hoeksema (verplicht)

Kleuren:
| Naam | Hex | Gebruik |
|---|---|---|
| Donker | `#2D2E32` | Achtergrond tv, kopregels app |
| Grijs | `#646464` | Secundaire tekst, 3D-wanden |
| Antraciet tekst | `#636466` | Tekst op lichte achtergrond (niet zwart) |
| Rood | `#DC0014` | Status leeg / onder minimum, foutmeldingen |
| Geel | `#F0B400` | Status deels onderweg, waarschuwing |
| Groen | `#8CB400` | Status compleet, bevestigen |
| Blauw | `#008CDC` | Selectie, knoppen, accenten |

- Lettertype: **Square 721** (Bold en Roman). Dennis levert de bestanden (`SQR721B 2.TTF`, `TT0246M_.TTF`); laad ze lokaal via `@font-face`. Fallback: `"Square 721 BT", "Eurostile", "Arial", sans-serif`.
- Logo: Dennis levert `Hoeksema_Logo_Transparant.png`. Gebruik een placeholder tot het bestand er is.
- Toon: kort, duidelijk, gewone woorden. Knoppen zeggen wat ze doen ("Meenemen bevestigen"). Geen Engelse termen in de interface.
- Telefoon: grote knoppen (min. 56 px hoog), te bedienen met werkhandschoenen en verfhanden, hoog contrast voor gebruik in een donkere loods.

---

## 9. Werkwijze voor Claude Code

1. Begin met **fase 1**. Bouw fase 2 pas als Dennis fase 1 heeft getest en goedgekeurd.
2. Maak eerst de Supabase-migraties en seed-data (medewerkers, voertuig, zones uit hoofdstuk 6, een paar voorbeeldartikelen).
3. Leg na elke stap in gewone taal uit wat er gebouwd is en hoe Dennis het kan testen. Geef bij elke stap een tip of verbetersuggestie.
4. Vraag om ontbrekende gegevens (kentekens, artikellijst, steigerinventaris, logo, fonts) in plaats van ze te verzinnen.
5. Houd een `docs/VOORTGANG.md` bij met wat af is, wat nog moet en open vragen.
6. Schrijf in `docs/RASPBERRY-PI.md` een stap-voor-stap-handleiding: Pi 5 installeren, Chromium kiosk, automatisch opstarten, scherm nooit uit, nachtelijke herlaadbeurt.

## 10. Open punten (door Dennis aan te leveren)
- Kentekens en namen van alle bussen
- Steigerinventaris per onderdeel (staanders, liggers, vloeren, diagonalen, voetplaten, leuningen, koppelingen) en Instant Span-onderdelen
- Lijst ladders (type, lengte) en duur gereedschap dat een eigen nummer krijgt
- Nameten: entresol, kanteldeur, posities stellingen, diepte gang
- Logo- en fontbestanden
- Is er goede wifi in de hele loods?
