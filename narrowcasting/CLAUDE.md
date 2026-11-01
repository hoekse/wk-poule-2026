# Narrowcasting Hoeksema Schilderwerken — instructies voor Claude

Dit is het narrowcasting-scherm (tv in de zaak/werkplaats) van Hoeksema Schilderwerken.
De eigenaar bedient het door Claude te vragen iets aan te passen ("zet de vacature aan",
"zet een mededeling op het scherm", "voeg een slide toe over …"). Antwoord in het Nederlands.

## Hoe het in elkaar zit

| Onderdeel | Waar |
|---|---|
| Speler (statisch) | `narrowcasting/index.html`, `speler.js`, `stijl.css`, `config.js` |
| Hosting | Vercel-project `wkpoule-hoeksemaschildersbedrijf`, deployt branch `main` van `hoekse/wk-poule-2026`; scherm-URL eindigt op `/narrowcasting/` |
| **Live inhoud** | Supabase-project `gkxcnbyialssruvhuiyn` ("wk poule hoeksema schilderwerken"), tabellen `narrowcasting_slides` en `narrowcasting_instellingen` |
| Noodinhoud | `narrowcasting/startinhoud.json` — alleen voor de allereerste start zonder internet of `?bron=lokaal`. **Niet** gebruiken om de inhoud te wijzigen. |
| Afbeeldingen | Volledige `https://`-URL, of een bestand in `narrowcasting/media/` (dat vergt commit + merge naar `main`) |

Het scherm haalt elke ~30 seconden de tabellen op. **Inhoud wijzigen = SQL uitvoeren via de
Supabase-connector (`execute_sql`)**; er is geen deploy nodig. De database staat voor de
publieke sleutel alleen lezen toe (RLS), schrijven gaat alleen via de connector/het dashboard.

## Werkwijze bij een verzoek

1. Bekijk eerst de huidige stand:
   ```sql
   select naam, volgorde, type, actief, duur, van, tot, inhoud from narrowcasting_slides order by volgorde;
   select sleutel, waarde from narrowcasting_instellingen order by sleutel;
   ```
2. Wijzig gericht (`update … where naam = '…'`). Voor deelwijzigingen in jsonb: `inhoud = inhoud || '{"titel":"…"}'::jsonb`.
3. "Weghalen" = `actief = false`, tenzij de gebruiker expliciet om verwijderen vraagt.
4. Laat na afloop kort zien wat er nu op het scherm staat (select) en zeg dat het binnen ~30 s zichtbaar is.
5. Teksten: kort en groot leesbaar. Titel ± 2–7 woorden, punten ± 3–7 woorden, hooguit 4–5 punten.
6. **Verzin geen feiten**: geen nep-reviews, cijfers, prijzen, garanties, certificaten of contactgegevens. Vraag ernaar.
7. Twijfel je over de bedoeling of over een onomkeerbare actie (rijen verwijderen), vraag het eerst.

## Slidetypes (kolom `type`) en velden in `inhoud`

Algemene velden voor elk type: `thema` (`licht` | `donker` | `kleur`), `kleur` (`rood` | `geel` | `blauw` | `groen`),
`kop` (klein label boven de titel). In tekstvelden: `*woord*` = accentkleur, `\n` = nieuwe regel,
`{groet}` (Goedemorgen/-middag/-avond), `{bedrijf}`, `{plaats}`, `{jaar}`, `{volgend_jaar}`.

| type | velden in `inhoud` | opmerking |
|---|---|---|
| `titel` | `titel`, `tekst`, `kop`, `achtergrond` (foto-URL), `logo` (`false` = verbergen) | groot logo + titel, voor welkom/feestdagen |
| `tekst` | `titel`, `tekst`, `punten` (lijst), `afbeelding`, `deco` (`false` = geen beeldmerk) | tips, nieuws, "wist je dat" |
| `foto` | **`afbeelding`**, `titel`, `tekst`, `passend` (`true` = hele foto tonen) | foto schermvullend met langzame zoom |
| `voor_na` | **`voor`**, **`na`**, `titel`, `onderschrift`, `weergave` (`naast` \| `schuif`) | `schuif` alleen bij foto's vanaf exact hetzelfde standpunt |
| `diensten` | `titel`, `items`: lijst van `{naam, icoon, tekst, kleur}` (max 8) | iconen: `roller`, `kwast`, `huis`, `glas`, `muur`, `palet`, `ladder`, `druppel`, `schild`, `spuit`, `behang` |
| `weer` | `titel`, `uitleg` | 5-daagse "schilderweer"-verwachting; werkt alleen als instelling `weer.plaats` is ingevuld |
| `review` | **`tekst`**, `naam`, `plaats`, `sterren` (1–5) | alleen echte reviews |
| `vacature` | `titel`, `functie`, `tekst`, `punten`, `link` of `qr`, `qr_label` | QR-code als er een link is |
| `contact` | `titel`, `tekst`, `telefoon`, `email`, `website`, `adres`, `qr` (URL of `false`), `qr_label` | lege velden vallen terug op instelling `bedrijf`; wordt overgeslagen zonder contactgegevens |
| `cijfers` | `titel`, `items`: lijst van `{getal, label}` (max 4) | getallen tellen op; alleen echte cijfers |
| `video` | **`url`** (mp4), `passend` | zonder geluid; `duur` leeg = hele video |

Kolommen in `narrowcasting_slides`: `naam` (uniek, kebab-case), `volgorde` (stappen van 10), `type`,
`actief`, `duur` (sec, leeg = standaard), `van`/`tot` (datums, inclusief), `dagen` (bv. `{ma,di,wo,do,vr}`),
`schermen` (bv. `{werkplaats}`; leeg = alle schermen, scherm-URL `…/narrowcasting/?scherm=werkplaats`).

## Instellingen (`narrowcasting_instellingen`, sleutel → jsonb)

| sleutel | voorbeeld | betekenis |
|---|---|---|
| `bedrijf` | `{"naam":"Hoeksema Schilderwerken","slogan":"…","website":"…","telefoon":"","email":"","adres":"","logo":"media/logo.svg","logo_wit":"media/logo-wit.svg"}` | bedrijfsgegevens, gebruikt door contact-slide en onderbalk |
| `ticker` | `["regel 1","regel 2"]` | lopende tekst onderin |
| `mededeling` | `{"tekst":"","kleur":"rood","tot":null}` | opvallende balk bovenin over alle slides; lege tekst = uit; `tot` = ISO-tijd waarna hij verdwijnt |
| `weer` | `{"plaats":"Drachten"}` (of `lat`/`lon`) | plaats voor de weerslide |
| `weergave` | `{"standaard_duur":12,"overgang":"vervagen","verversen_sec":30,"ticker_snelheid":110}` | overgang: `vervagen` \| `schuiven` \| `geen` |
| `nachtstand` | `{"aan":false,"van":"19:00","tot":"07:00","weekend":false}` | zwart scherm buiten openingstijden |
| `herladen` | `1` | waarde wijzigen = alle schermen laden de pagina opnieuw (na een code-update) |

## SQL-recepten

```sql
-- Mededeling aan (verdwijnt automatisch na 'tot')
update narrowcasting_instellingen
   set waarde = jsonb_build_object('tekst', 'Vandaag vanaf 15:00 gesloten', 'kleur', 'rood', 'tot', '2026-11-06T17:00')
 where sleutel = 'mededeling';

-- Mededeling uit
update narrowcasting_instellingen set waarde = waarde || '{"tekst":""}' where sleutel = 'mededeling';

-- Lopende tekst vervangen / regel toevoegen
update narrowcasting_instellingen set waarde = '["Regel 1","Regel 2"]'::jsonb where sleutel = 'ticker';
update narrowcasting_instellingen set waarde = waarde || to_jsonb('Nieuwe regel'::text) where sleutel = 'ticker';

-- Slide aan- of uitzetten
update narrowcasting_slides set actief = true where naam = 'vacature';

-- Tekst van een slide aanpassen (overige velden blijven staan)
update narrowcasting_slides set inhoud = inhoud || '{"titel":"Wij zoeken *jou*!"}'::jsonb where naam = 'vacature';

-- Nieuwe slide (tijdelijk, alleen op werkdagen)
insert into narrowcasting_slides (naam, volgorde, type, duur, van, tot, dagen, inhoud) values
  ('actie-voorjaar', 25, 'tekst', 12, '2027-03-01', '2027-04-30', '{ma,di,wo,do,vr}',
   '{"kop":"Voorjaar","titel":"Nu buitenschilderwerk *inplannen*","punten":["…","…"],"thema":"kleur","kleur":"groen"}');

-- Volgorde wijzigen
update narrowcasting_slides set volgorde = 15 where naam = 'schilderweer';

-- Plaats voor het weer / contactgegevens
update narrowcasting_instellingen set waarde = '{"plaats":"Drachten"}' where sleutel = 'weer';
update narrowcasting_instellingen set waarde = waarde || '{"telefoon":"06 …","email":"…"}' where sleutel = 'bedrijf';

-- Alle schermen opnieuw laten laden (na een nieuwe versie van de speler)
update narrowcasting_instellingen set waarde = to_jsonb(extract(epoch from now())::bigint) where sleutel = 'herladen';
```

## De speler zelf aanpassen (code)

- Schrijf ES2017 (geen `?.` of `??`): oudere tv-browsers moeten het blijven draaien.
- Testen: serveer de map lokaal (`python3 -m http.server` in `narrowcasting/`) en open met Playwright
  `http://127.0.0.1:8000/?bron=lokaal&slide=<naam>` (1920×1080). Weer-API's kun je mocken.
- Nieuw slidetype: voeg het toe aan `TYPES` in `speler.js`, stijl in `stijl.css`, documenteer het hier
  én breid de check-constraint `narrowcasting_slides_type_check` in de database uit.
- Live zetten: wijzigingen moeten op `main` komen (Vercel deployt dan automatisch). Verhoog daarna `herladen`.
- Schema-wijzigingen ook vastleggen in `narrowcasting/supabase/`.
