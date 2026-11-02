# Verder met de Robaws-koppeling

Stand (2 november 2026):

- De Werkplaats-kant (verwerken van `robawsimport`, toegangsregel, kaart bij Instellingen) staat live in het
  artifact. Wijzig de Werkplaats altijd vanaf de live versie (Artifact read), niet vanaf een oude kopie.
- Netwerk en sleutel zijn in orde: de omgeving zet de sleutel zelf bij elk verzoek naar `app.robaws.com`.
  `GET /api/v2/whoami` geeft 200.
- **Blokkade:** de API-gebruiker heeft in Robaws 0 rechten. `/api/v2/clients` en `/api/v2/projects` geven 403.
  De eigenaar moet in Robaws de API-gebruiker een rol geven met leesrechten op Klanten (met contactpersonen)
  en Projecten. `python3 robaws_sync.py check` zegt precies wat er nog ontbreekt.
- De vertaling `map_klant` en `map_project` is ingevuld vanuit de API-beschrijving (`/api-docs/robaws`:
  ClientReadDTO, ContactReadDTO, ProjectReadDTO, AddressDTO) en getest met verzonnen gegevens.
  Nog niet gecontroleerd met echte Robaws-gegevens.

Nog te doen, zodra `check` slaagt:

1. `python3 robaws_sync.py export --droog`. Controleer in het overzicht:
   - **Projectstatussen.** Robaws laat elk bedrijf zijn eigen statussen kiezen. Staan er statussen op
     "onbekend", vul dan `STATUS_WOORDEN` aan.
   - **Projectnamen.** Robaws heeft geen naamveld voor projecten. Het script neemt de planningsnaam,
     anders de klantreferentie, anders klant + plaats. Vergelijk een paar met de projectnamen in de
     Werkplaats: daarop koppelt de Werkplaats bestaande projecten zonder `robawsId`.
   - **include.** Kijk of `contacts`, `legalForm`, `paymentCondition`, `vatTariff` en `statusDetails` echt
     gevuld terugkomen. Zo niet, controleer de schrijfwijze van `include` (komma's of herhaald).
2. Controleer of de bestaande klanten in de Werkplaats (ids `r1`..`r256`, `bron: robaws`) Robaws-ids zijn:
   vergelijk een paar namen met `/api/v2/clients/<nummer>`. De Werkplaats koppelt nu op naam en postcode;
   blijken het Robaws-ids, dan kan `robawsId` eenmalig op die documenten gezet worden.
3. Laat de aantallen aan de eigenaar zien en vraag akkoord.
4. `python3 robaws_sync.py export` en zet elk bestand uit `uit/` als document in de collectie
   `robawsimport` van https://claude.ai/artifact/WNbtbE9m4VAsEt9WNSSmPW (ArtifactData batch, `set`,
   doc_id = bestandsnaam zonder `robawsimport-` en `.json`, `file_path` naar het bestand).
5. Laat de eigenaar de Werkplaats openen; controleer `instellingen/robaws` en een paar klanten en projecten.
6. Maak een routine (create_trigger, nieuwe sessie per keer, bijvoorbeeld `CRON_TZ=Europe/Amsterdam 43 5 * * *`)
   die stap 4 elke nacht uitvoert vanaf deze branch, en alleen bij fouten meldt.
   Tip: met `updatedFrom` (klanten en projecten) kan de nachtelijke run later alleen wijzigingen ophalen.
