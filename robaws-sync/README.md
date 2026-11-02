# Robaws-koppeling voor de Hoeksema Werkplaats

Haalt klanten en projecten uit Robaws en zet ze in de Werkplaats (claude.ai-artifact
`https://claude.ai/artifact/WNbtbE9m4VAsEt9WNSSmPW`). Robaws is leidend voor klant- en projectgegevens.

## Hoe het werkt

1. `robaws_sync.py export` leest alle klanten en projecten via de Robaws-API (`/api/v2/clients`,
   `/api/v2/projects`), vertaalt ze naar het formaat van de Werkplaats en schrijft pakketten in `uit/`.
2. Een geplande Claude-sessie zet die pakketten in de collectie `robawsimport` van de Werkplaats
   (document-id = bestandsnaam zonder `robawsimport-` en `.json`). Alleen de eigenaar kan daar lezen en schrijven.
3. Zodra de beheerder de Werkplaats open heeft, verwerkt de app de pakketten zelf:
   - koppelen op `robawsId`, anders op naam (en postcode bij meerdere kandidaten);
   - alleen velden die in Robaws gevuld zijn overschrijven, eigen velden (opmerkingen, status) blijven staan;
   - nooit iets verwijderen; nieuwe klanten krijgen id `rb<robawsId>`, nieuwe projecten ook;
   - afgeronde Robaws-projecten worden niet als nieuw project toegevoegd;
   - daarna worden de pakketten opgeruimd en staat een samenvatting in `instellingen/robaws`
     (te zien bij Instellingen → Koppeling met Robaws).

## Benodigd in de omgeving

- De sleutel van een Robaws-gebruiker met "API only" en API access: als netwerkgeheim (Basic, host
  `app.robaws.com`; de omgeving zet hem dan zelf bij elk verzoek) of als `ROBAWS_KEY` en `ROBAWS_SECRET`.
  Nooit in code of chat.
- Die gebruiker heeft in Robaws een rol nodig met leesrechten op Klanten (met contactpersonen) en Projecten.
- `app.robaws.com` bij de toegestane domeinen van de omgeving.

## Opdrachten

```
python3 robaws_sync.py check            # sleutel, rechten en verbinding testen
python3 robaws_sync.py spec             # velden van klanten en projecten uit de API-beschrijving
python3 robaws_sync.py export --droog   # alleen tellen, met overzicht van statussen en namen
python3 robaws_sync.py export           # pakketten maken in uit/
python3 -m unittest test_robaws_sync    # tests
```

Zie `VERDER.md` voor wat er nog moet gebeuren.
