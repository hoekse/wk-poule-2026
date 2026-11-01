# Narrowcasting — Hoeksema Schilderwerken

Een eigen narrowcasting-scherm in de huisstijl van Hoeksema Schilderwerken, dat je
**vanuit Claude bedient**. Je zegt bijvoorbeeld *"zet een mededeling op het scherm dat we
vrijdag om 15:00 dicht zijn"* en binnen een halve minuut staat het op de tv.

## Wat staat er op het scherm?

- Welkomstslide met logo en een groet die meebeweegt met de tijd (Goedemorgen/Goedemiddag/…)
- Onze diensten: schilderwerk binnen en buiten, beglazing, wandafwerking, kleuradvies
- Voor & na-project (nu nog met voorbeeldillustraties; vervang ze door eigen foto's)
- **Schilderweer**: 5-daagse verwachting met per dag "Schilderweer / Twijfelachtig / Binnendag"
- Schilderstip en "Wist je dat?"
- Contact met QR-code naar de website
- Feestdagen-slide die vanzelf verschijnt van 14 december tot 3 januari
- Klaar voor gebruik maar uitgeschakeld: vacature en klantreview
- Onderin: logo, lopende tekst, klok en datum. Bovenin kan een opvallende mededeling verschijnen.

## Bedienen via Claude

Open Claude met de Supabase-koppeling (en/of deze GitHub-repository) en vraag gewoon wat je wilt:

- "Zet een mededeling op het scherm: *Vandaag vanaf 15:00 gesloten*, tot 17:00."
- "Zet de vacature voor allround schilder aan."
- "Maak een slide met deze foto van het project aan de Dorpsstraat."
- "Voeg aan de lopende tekst toe: *Nu 10% korting op binnenschilderwerk*."
- "Laat de schilderweer-slide de verwachting voor Drachten zien."
- "Zet het scherm 's avonds na 19:00 en in het weekend op zwart."
- "Welke slides staan er nu aan?"

Claude past dan de inhoud in de database aan; de tv haalt elke 30 seconden de nieuwste
versie op. Alle details voor Claude staan in [`CLAUDE.md`](CLAUDE.md).

> Tip: maak in Claude een Project "Narrowcasting" en plak de inhoud van `CLAUDE.md` in de
> projectinstructies. Dan weet Claude in elk gesprek meteen hoe het werkt.

## Het scherm instellen

1. Open op de tv of mediaspeler de scherm-URL: `https://<jouw-domein>/narrowcasting/`
2. Klik/tik één keer op het scherm voor volledig scherm (of druk op **F**).
3. Zet de slaapstand van tv/speler uit.

Geschikte hardware: elke tv of speler met een moderne browser. Prettig en betrouwbaar zijn
een Android-tv-box of Fire TV-stick met een kiosk-browser (bijv. *Fully Kiosk Browser*, start
automatisch op), of een mini-pc met Chrome in kioskmodus (`chrome --kiosk https://…/narrowcasting/`).

Het scherm blijft werken als internet even wegvalt (laatst bekende inhoud blijft draaien) en
laadt zichzelf elke nacht om 04:00 opnieuw.

### Meerdere schermen

Geef een scherm een naam via de URL, bv. `…/narrowcasting/?scherm=werkplaats`. Slides kun je
dan beperken tot bepaalde schermen ("laat deze slide alleen in de werkplaats zien").

### Handig bij testen

| Toevoeging aan de URL | Wat het doet |
|---|---|
| `?slide=vacature` | alleen deze slide tonen (ook als hij uit staat) |
| `?pauze` | niet automatisch doorschakelen |
| `?debug` | technische info in beeld |
| `?bron=lokaal` | `startinhoud.json` gebruiken i.p.v. de database |
| `?nu=2026-12-20T10:00` | doen alsof het dit tijdstip is |

Toetsen: ← → vorige/volgende, spatie = pauze, F = volledig scherm, D = debug.

## Techniek in het kort

- **Speler**: `index.html` + `speler.js` + `stijl.css` (geen frameworks, eigen lettertype Poppins, werkt offline door).
- **Inhoud**: Supabase (zelfde project als de WK-poule), tabellen `narrowcasting_slides` en
  `narrowcasting_instellingen`. Het scherm mag alleen lezen; wijzigen gaat via Claude of het Supabase-dashboard.
  Schema en startinhoud: `supabase/01_schema.sql` en `supabase/02_startinhoud.sql`.
- **Weer**: Open-Meteo (gratis, zonder account).
- **QR-codes**: lokaal gegenereerd (`lib/qrcode.js`, MIT-licentie).
- **Logo**: `media/logo.svg`, `media/logo-wit.svg` en `media/beeldmerk.svg` (scherpe vectorversies van het logo).
