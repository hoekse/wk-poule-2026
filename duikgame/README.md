# Diepblauw — duikgame

Een duikreis rond de wereld. Je kiest je uitrusting in de winkel van Duikcentrum De Tuimelaar in Zwolle, kiest je duikstek op de wereldkaart en gaat duiken.

## Zoutpier, Bonaire (3D)

De Zoutpier is de eerste duikstek in 3D: vrij rondzwemmen volgens de echte duikregels.

- **Water:** helder Bonaire-water (±50 m zicht), kleurverlies met diepte en afstand, lichtvlekken op het zand, de schaduw van de pier en het oppervlak van onderen.
- **Indeling:** ronde begroeide pijlers volgens het duikkaartje: hoofdpier, laadkop ("Tarpons") en drie pijlergroepen aan elke kant. Achter de pier ligt het rif, dat afloopt tot 40 m.
- **Dieren:** fotorealistische vissen (gemaakt in Magnific): knorvisscholen, sergeant-majoors, blauwe doktersvissen, chromissen, tarpons, barracuda, keizersvissen, papegaaivissen, koffervissen en trompetvissen. Verder schildpadden in het zeegras aan de noordkant, kikvorsvissen op de pijlers en soms een adelaarsrog.
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
- `js3d/`: de 3D-duik (Three.js): water, bodem, pier, dieren, duiker, fysica, decompressie, besturing en HUD
- `vendor/three/`: Three.js 0.186.1 (MIT-licentie)
- `img/`: winkelfoto's en logo van De Tuimelaar, foto's van Bonaire, pijlertextuur, `vis/` met de fotorealistische vissen

Fan-project in samenwerking met Duikcentrum De Tuimelaar Zwolle. Sommige referentiefoto's van internet zijn alleen als voorbeeld gebruikt en zitten niet in het spel.
