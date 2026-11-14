# Videogesprek

Een web-app voor je telefoon die aanvoelt als een videogesprek met Rick. Je tikt op de groene knop, hoort de kiestoon, hij neemt op en zegt hallo. Daarna stel je hardop een vraag en hij antwoordt met een clip die jij vooraf hebt laten maken. Hij zegt nooit iets wat jij niet hebt opgenomen.

> **Let op: de GitHub-repository `hoekse/wk-poule-2026` is openbaar.**
> Iedereen kan alles zien wat erin staat. Zet de echte foto en de echte clips van Rick daarom **niet** in deze repository. Er staan nu alleen placeholders in. Verhuis de map `videogesprek` eerst naar een eigen **privé**-repository (zie [Naar een privé-repository](#naar-een-privé-repository)) en zet de echte bestanden pas daar.

## Zo werkt het

1. **Belscherm.** Ronde foto, naam en een groene belknop. Bij het openen laadt de app op de achtergrond alle clips in het geheugen.
2. **Bellen.** Na de tik hoor je de Nederlandse kiestoon (425 Hz). Na ruim vier seconden neemt hij op, of later als de clips nog niet binnen zijn.
3. **Begroeting.** `begroeting.mp4` speelt af. Daarna draait `idle.mp4` in een lus: hij luistert.
4. **Jouw vraag.** De microfoon staat open. De app merkt zelf wanneer je begint te praten en stopt na ongeveer 0,7 seconde stilte.
5. **Verstaan.** De opname gaat naar de server. OpenAI zet hem om in tekst (`gpt-transcribe`), Claude Haiku (`claude-haiku-5-5`) kiest het best passende antwoord uit `data/antwoorden.json`.
6. **Antwoord.** De gekozen clip speelt af, met een crossfade van 150 ms vanuit de luisterlus. Bij twijfel (zekerheid onder 0,6) speelt `onbekend.mp4`. Bij ruis of een kuchje gebeurt er niets en luistert hij verder.
7. **Ophangen** met de rode knop.

Tijdens het afspelen luistert de microfoon niet, zodat hij zichzelf niet hoort. In beeld staan alleen de naam, de gesprekstimer, de dempknop en de ophangknop. Na vijf seconden verdwijnen de knoppen. Tik op het scherm om ze terug te halen.

Wordt een vraag (bijna) letterlijk gesteld zoals in de lijst, dan kiest de app zelf het antwoord, zonder Claude. Dat is sneller en gratis.

## Een antwoord toevoegen

1. **Maak de clip** van foto plus jouw ingesproken antwoord. Zorg dat hij begint en eindigt in dezelfde neutrale houding als `idle.mp4`.
2. **Zet hem in het juiste formaat** (staand, 720×1280, H.264 met AAC-geluid), bijvoorbeeld met [ffmpeg](https://ffmpeg.org):

   ```bash
   ffmpeg -i gemaakte-clip.mp4 \
     -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" \
     -c:v libx264 -profile:v high -crf 20 -pix_fmt yuv420p \
     -c:a aac -b:a 128k -movflags +faststart \
     public/clips/4.mp4
   ```

3. **Zet de clip** in `public/clips/`. Bestandsnaam = nummer van de vraag, bijvoorbeeld `4.mp4`.
4. **Voeg een regel toe** aan `data/antwoorden.json`:

   ```json
   {
     "id": "4",
     "clip": "4.mp4",
     "vragen": ["Wat ga je vanavond doen?", "Heb je plannen voor vanavond?", "Nog iets leuks vanavond?"],
     "antwoordtekst": "Bankhangen."
   }
   ```

   Zet bij `vragen` de vraag zoals je hem meestal stelt, plus twee of drie andere manieren. De `antwoordtekst` wordt niet getoond, maar helpt Claude om te zien of het antwoord past.
5. **Controleer** (optioneel, gebeurt ook automatisch bij elke deploy):

   ```bash
   npm run controleer
   ```

   Dit meldt ontbrekende clips, dubbele id's en clips die nergens gebruikt worden.
6. **Opnieuw deployen:** commit en push. Vercel bouwt en zet de nieuwe versie automatisch online. Ontbreekt er een clip, dan stopt de build met een duidelijke melding, zodat je dat niet pas tijdens een gesprek merkt.

### De vaste clips

| Bestand | Wanneer |
| --- | --- |
| `public/clips/idle.mp4` | Luisterlus, draait zonder geluid steeds opnieuw. Ongeveer 10 seconden: knipperen, ademen, licht bewegen. Laatste beeld gelijk aan het eerste, anders zie je bij elke herhaling een sprongetje. |
| `public/clips/begroeting.mp4` | Direct na het opnemen. |
| `public/clips/onbekend.mp4` | Als de vraag niet herkend wordt, bijvoorbeeld "Dat moet je me nog een keer vragen." |

### Foto en naam

- **Foto** voor het belscherm en als ondergrond van de video: `public/foto.jpg`, staand. Gebruik dezelfde foto waarvan de clips gemaakt zijn, dan klopt de uitsnede.
- **Naam**: `data/instellingen.json`.

### Placeholders opnieuw maken

`npm run placeholders` maakt de tijdelijke clips, de placeholder-foto en de app-iconen opnieuw (ffmpeg en ImageMagick nodig). De iconen tonen bewust geen gezicht, omdat iconen voor iedereen op te vragen zijn.

## Online zetten op Vercel

De app staat online op **https://videogesprek.vercel.app** (Vercel-project `videogesprek`). Het project is bewust **niet** aan deze openbare GitHub-repository gekoppeld. Een push zet dus niet vanzelf een nieuwe versie online.

Bij **Settings › Environment Variables** van het project:

| Variabele | Waarvoor |
| --- | --- |
| `TOEGANGSCODE` | De code die je één keer per telefoon invult. Staat al ingesteld. **Zonder code is de app in productie dicht.** |
| `OPENAI_API_KEY` | Spraak naar tekst. Zelf toevoegen. |
| `ANTHROPIC_API_KEY` | Het juiste antwoord kiezen. Zelf toevoegen. |
| `ZEKERHEID_DREMPEL` | Optioneel, standaard `0.6`. Hoger = sneller "nog een keer vragen". |
| `OPENAI_TRANSCRIPTIE_MODEL` | Optioneel, standaard `gpt-transcribe`. Weigert dat model een verzoek, dan probeert de app het met `gpt-4o-mini-transcribe`. |

Na het toevoegen of wijzigen van een variabele: **Deployments › (laatste) › Redeploy**. Pas dan werkt hij.

Zonder `OPENAI_API_KEY` gebruikt de app de spraakherkenning van de browser. Die is op iPhone onbetrouwbaar. Zonder `ANTHROPIC_API_KEY` vergelijkt de app de tekst zelf met de vragenlijst. Dat werkt als je de vraag ongeveer zo stelt als in de lijst.

**Nieuwe versie online zetten.** Zodra de app in een eigen privé-repository staat: koppel die bij **Settings › Git** aan het project (Root Directory leeg maken). Daarna zet elke push naar `main` de nieuwe versie automatisch online. Tot die tijd kan Claude een nieuwe versie voor je deployen.

**Privé houden.** Alles staat achter de toegangscode, ook de clips en de foto. Vercels eigen login beschermt alleen de preview-versies. Zoekmachines worden geweerd (`noindex` en `robots.txt`). Deel de link en de code niet.

### Op je telefoon zetten

Open de link in Safari, vul de code in, tik op **Deel › Zet op beginscherm**. Daarna start de app schermvullend vanaf het icoon. Vul de code de eerste keer ook in de beginscherm-app in: iOS bewaart die apart van Safari.

## Testen

- Voeg `?debug=1` toe aan de link. Linksboven verschijnen dan het microfoonniveau, de herkende tekst, het gekozen antwoord, de zekerheid en hoeveel milliseconden het duurde. Handig om elke vraag op drie manieren te proberen.
- Test in een rumoerige ruimte en met slechte verbinding. Bij een netwerkfout speelt `onbekend.mp4`.

## Problemen oplossen

| Probleem | Wat te doen |
| --- | --- |
| "Geef de app toegang tot je microfoon" | iPhone: **Instellingen › Safari › Microfoon** op *Vragen* of *Sta toe*, en de pagina opnieuw laden. |
| Hij reageert al op een kuchje, of juist niet als je zacht praat | Pas de drempels aan bovenin `lib/client/luisteraar.ts` (`MIN_NIVEAU`, `MIN_SPRAAK_MS`, `STILTE_MS`). Kijk met `?debug=1` naar het niveau. |
| Hij valt je in de rede, of wacht te lang | `STILTE_MS` in `lib/client/luisteraar.ts` (nu 700 ms). |
| Te vaak "nog een keer vragen" | Meer varianten bij `vragen` zetten, of `ZEKERHEID_DREMPEL` verlagen. |
| Geluid klinkt zacht of via de oorspeaker op iPhone | Zet de telefoon niet op stil en probeer de volumeknoppen tijdens het gesprek. De spraakverwerking van de microfoon staat bewust uit (`MICROFOON` in `lib/client/gesprek.ts`). |
| Een vervangen clip is nog de oude | Volledig herladen. Clips worden bij elk bezoek gecontroleerd op wijzigingen. |

## Naar een privé-repository

1. Maak op GitHub een nieuwe **privé**-repository, bijvoorbeeld `videogesprek-rick`.
2. Kopieer de inhoud van de map `videogesprek` naar die repository en push.
3. Koppel die repository aan het Vercel-project `videogesprek` (**Settings › Git**, Root Directory leeg).
4. Zet pas daarna de echte foto en clips erin.
5. Verwijder `videogesprek` uit `wk-poule-2026`.

## Lokaal ontwikkelen

```bash
cd videogesprek
npm install
cp .env.example .env.local   # sleutels invullen; TOEGANGSCODE mag lokaal leeg
npm run dev                  # http://localhost:3000
npm run typecheck
npm run build
```

De microfoon werkt alleen via `localhost` of `https`. Wil je lokaal op je telefoon testen, gebruik dan een Vercel-preview.

## Kosten

Per vraag kost het een fractie van een cent: een paar seconden audio bij OpenAI en een korte aanvraag bij Claude Haiku. Letterlijk gestelde vragen gaan niet naar Claude.

## Structuur

```
data/antwoorden.json        vragen en antwoorden (dit pas je aan)
data/instellingen.json      naam en foto
public/clips/               de clips (nu placeholders)
public/foto.jpg             foto voor het belscherm (nu placeholder)
app/page.tsx                hoofdpagina
app/api/vraag/route.ts      opname -> tekst (OpenAI) -> antwoord (Claude)
app/api/kies/route.ts       tekst -> antwoord (voor de browser-spraakherkenning)
app/toegang/                pagina voor de toegangscode
proxy.ts                    controleert de toegangscode bij elke aanvraag
components/Videogesprek.tsx belscherm en gespreksscherm
lib/client/gesprek.ts       gesprekslogica: bellen, luisteren, afspelen, ophangen
lib/client/luisteraar.ts    microfoon, begin en einde van je vraag herkennen
lib/client/videolaag.ts     twee video's boven elkaar met crossfade
lib/client/beltoon.ts       kiestoon
lib/server/kies.ts          antwoord kiezen (snel, Claude, of zelf vergelijken)
lib/server/transcribeer.ts  spraak naar tekst
scripts/controleer.mjs      controleert clips en json vóór elke build
scripts/maak-placeholders.sh placeholders en iconen maken
```
