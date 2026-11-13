# Robaws-koppeling voor de Hoeksema Werkplaats

Haalt klanten, projecten en facturen uit Robaws en zet ze in de Werkplaats (claude.ai-artifact
`https://claude.ai/artifact/WNbtbE9m4VAsEt9WNSSmPW`). Robaws is leidend voor klant- en projectgegevens.

## Hoe het werkt

1. `robaws_sync.py export` leest alle klanten, projecten en facturen via de Robaws-API (`/api/v2/clients`,
   `/api/v2/projects`, `/api/v2/sales-invoices`), vertaalt ze naar het formaat van de Werkplaats en schrijft pakketten in `uit/`.
2. Een geplande Claude-sessie zet die pakketten in de collectie `robawsimport` van de Werkplaats
   (document-id = bestandsnaam zonder `robawsimport-` en `.json`). Alleen de eigenaar kan daar lezen en schrijven.
3. Zodra de beheerder de Werkplaats open heeft, verwerkt de app de pakketten zelf:
   - koppelen op `robawsId`, anders op naam (en postcode bij meerdere kandidaten);
   - alleen velden die in Robaws gevuld zijn overschrijven, eigen velden (opmerkingen, status) blijven staan;
   - nooit iets verwijderen; nieuwe klanten krijgen id `rb<robawsId>`, nieuwe projecten ook;
   - afgeronde Robaws-projecten worden niet als nieuw project toegevoegd;
   - facturen uit Robaws (id `r<robawsId>`) volgen Robaws: status, openstaand bedrag, datums en bedragen;
     nieuwe komen erbij, concepten pas als ze verzonden zijn; facturen die in de Werkplaats zelf zijn gemaakt
     blijven ongemoeid;
   - daarna worden de pakketten opgeruimd en staat een samenvatting in `instellingen/robaws`
     (te zien bij Instellingen → Koppeling met Robaws).

## Benodigd in de omgeving

- `ROBAWS_KEY` en `ROBAWS_SECRET`: access key en secret van een Robaws-gebruiker met "API only" en API access.
  Als netwerkgeheim of omgevingsvariabele, nooit in code of chat.
- `app.robaws.com` bij de toegestane domeinen van de omgeving.

## Opdrachten

```
python3 robaws_sync.py check            # verbinding en sleutel testen
python3 robaws_sync.py spec             # velden van klanten en projecten uit de API-beschrijving
python3 robaws_sync.py export --droog   # alleen tellen
python3 robaws_sync.py export           # pakketten maken in uit/
python3 -m unittest test_robaws_sync    # tests
```

Zie `VERDER.md` voor wat er nog moet gebeuren.
