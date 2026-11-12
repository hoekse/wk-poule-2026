# Diepblauw — duikgame

Een duikreis rond de wereld. Je kiest je uitrusting in de winkel van Duikcentrum De Tuimelaar in Zwolle, kiest je duikstek op de wereldkaart en gaat duiken.

## Zoutpier, Bonaire (3D)

De Zoutpier is de eerste duikstek in 3D: vrij rondzwemmen volgens de echte duikregels.

- **Water:** helder Bonaire-water (±50 m zicht), kleurverlies met diepte en afstand, lichtvlekken op het zand, de schaduw van de pier en het oppervlak van onderen.
- **Indeling:** ronde begroeide pijlers volgens het duikkaartje: hoofdpier, laadkop ("Tarpons") en drie pijlergroepen aan elke kant. Achter de pier ligt het rif, dat afloopt tot 40 m.
- **Duikers:** jij en je buddy zijn echte 3D-modellen met een skelet (gemaakt in Magnific van foto naar 3D). Ze liggen horizontaal in trim, doen een flutter kick met de benen, houden de handen voor de borst en kijken vooruit. Met camera en lamp als je die gehuurd hebt.
- **Dieren:** alle dieren zijn echte 3D-modellen (Magnific): knorvisscholen, sergeant-majoors, blauwe doktersvissen, chromissen, tarpons, barracuda, keizersvissen, papegaaivissen, koffervissen en trompetvissen. Verder groene en karetschildpadden in het zeegras aan de noordkant, kikvorsvissen op de pijlers, murenen aan de voet van de pijlers, soms een octopus tussen het puin en soms een adelaarsrog.
- **Rif en bodem:** fotorealistisch zand met ribbels en schelpgruis (naadloze textuur met reliëf), 3D-hersenkoralen, sterkoralen, gele buisponzen, vaasponzen, tonsponzen en echte zeewaaiers.
- **Beeld:** zachte schaduwen op de bodem onder duikers en dieren, fonkelende zon aan het wateroppervlak, bellen die onderweg naar boven uiteenvallen, pijlers met reliëf en 3D-aangroei (korstsponzen en oranje bekerkoralen), en grote scholen zilvervisjes onder de pier waar de tarpons doorheen jagen. De vinkleur uit de winkel komt op je eigen duiker.
- **Snel op telefoon en tablet:** vissen op afstand gebruiken een eenvoudiger model en de resolutie past zich automatisch aan als het toestel het niet bijhoudt.
- **Geluid (Magnific):** ademhaling door de automaat en uitademingsbellen in het ritme van je ademhaling, knappende garnalen op het rif, golven aan de oppervlakte, trimvest, camera met flitser, knagende papegaaivissen en af en toe een boot in de verte.
- **Fotochallenges:** elke foto krijgt 1–5 sterren op vulling, compositie, scherpte, kleur en backscatter, met een tip. Bij de Zoutpier zijn er 9 challenges (tarpon, schildpad, kikvorsvis, knorvissen, murene, octopus, barracuda, buddy-portret en een perfecte foto). Je ziet ze in de briefing en in het fotoalbum in je logboek.
- **Nachtduik:** kies in de briefing tussen dag en nacht (daarvoor heb je een duiklamp nodig). 's Nachts zie je alleen kleur in je lampbundel en in die van je buddy. Tarpons jagen in het licht van je lamp, octopussen, murenen en Caribische langoesten zwerven over de bodem, mandsters vouwen hun armen uit op de pijlers (en rollen zich op als je er te lang op schijnt), papegaaivissen slapen in een slijmcocon en rifinktvissen hangen vlak onder het oppervlak. Doe je lamp uit en zwem: dan licht het plankton op. Er zijn extra afspraken (reservelamp, lichtje op de fles, lampsignalen, bij elkaar blijven), een OK-teken met je lamp, en je mag je buddy niet verblinden. Er zijn 6 eigen nachtchallenges.
- **Duikregels:**
  - trimmen met trimvest, ademhaling, 3 mm-pak, 10 kg lood en een aluminium fles;
  - decompressie volgens Bühlmann ZHL-16C met GF 40/85;
  - opstijgsnelheid, veiligheidsstop en klaren;
  - buddycheck, handsignalen en een computer-buddy;
  - restverzadiging bij herhalingsduiken en vliegverbod (DAN);
  - de regels van het Bonaire Marine Park.
- **Duikcomputer:** in de stijl van een Suunto Ocean.
- **Instellingen:**
  - duiktijd: echte tijd ×1 of versneld ×2 of ×4;
  - trimhulp aan of uit;
  - camera achter de duiker of door de duikbril;
  - beeldkwaliteit laag, midden of hoog.

### Besturing

| | Telefoon / tablet | Pc |
|---|---|---|
| Zwemmen | joystick links (duim) | W A S D |
| Kijken | slepen rechts | muis slepen, pijltjes |
| Trimvest | ▲ / ▼ links | R / F |
| Diep inademen | 🫁 | B |
| Klaren | 👂 | K |
| Harder zwemmen | ⏩ | Shift |
| Foto / lamp / zicht | 📷 / 🔦 / 👁️ | Spatie / L / V |
| OK-teken buddy | 👌 | O |

## Spelen

De 3D-duik gebruikt JavaScript-modules en werkt daarom alleen via een webserver, niet door `index.html` direct te openen. Lokaal kan dat bijvoorbeeld zo:

```bash
cd duikgame
python3 -m http.server 8000
# open http://localhost:8000
```

Op GitHub Pages of Vercel werkt het direct.

## Bestanden

- `js/`: menu's, winkel, wereldkaart, logboek en de 2D-duikstekken
- `js3d/`: de 3D-duik (Three.js): water, bodem, pier, dieren, duiker, 3D-modellen laden, fysica, decompressie, besturing en HUD
- `vendor/three/`: Three.js 0.186.1 (MIT-licentie)
- `models/`: 3D-modellen (glTF) uit Magnific: `duiker.glb` en `buddy.glb` met skelet, `vis/` (met `-ver`-versies voor op afstand), `dier/` en `rif/`
- `audio/`: geluiden uit Magnific
- `img/`: winkelfoto's en logo van De Tuimelaar, foto's van Bonaire, pijler- en zandtextuur, zeewaaier, `vis/` met de vissenfoto's (reserve als een 3D-model niet laadt)

Fan-project in samenwerking met Duikcentrum De Tuimelaar Zwolle. Sommige referentiefoto's van internet zijn alleen als voorbeeld gebruikt en zitten niet in het spel.
