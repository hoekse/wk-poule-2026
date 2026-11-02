# Verder met de Robaws-koppeling

Stand: de Werkplaats-kant (verwerken van `robawsimport`, toegangsregel, kaart bij Instellingen) staat live
in versie 22 van het artifact. Wijzig de Werkplaats altijd vanaf de live versie (Artifact read), niet vanaf een oude kopie.
Dit script kan verbinden, pagineren en pakketten maken. Nog te doen, zodra `ROBAWS_KEY`, `ROBAWS_SECRET`
en netwerktoegang tot `app.robaws.com` er zijn:

1. `python3 robaws_sync.py check`: sleutel en verbinding.
2. `python3 robaws_sync.py spec`: velden van klanten (met adres en contactpersonen) en projecten bekijken.
   Vul `map_klant` en `map_project` in met de echte veldnamen (zie de opsomming boven die functies).
   Gebruik zo nodig `include=` voor adressen en contactpersonen. Zet de projectstatus om naar
   `voorbereiding`, `actief` of `afgerond`.
3. Controleer of de bestaande klanten in de Werkplaats (ids `r1`..`r256`, `bron: robaws`) Robaws-ids zijn:
   vergelijk een paar namen met `/api/v2/clients/<nummer>`. De Werkplaats koppelt nu op naam en postcode;
   blijken het Robaws-ids, dan kan `robawsId` eenmalig op die documenten gezet worden.
4. `python3 robaws_sync.py export --droog`, laat de aantallen aan de eigenaar zien en vraag akkoord.
5. `python3 robaws_sync.py export` en zet elk bestand uit `uit/` als document in de collectie
   `robawsimport` van https://claude.ai/artifact/WNbtbE9m4VAsEt9WNSSmPW (ArtifactData batch, `set`,
   doc_id = bestandsnaam zonder `robawsimport-` en `.json`, `file_path` naar het bestand).
6. Laat de eigenaar de Werkplaats openen; controleer `instellingen/robaws` en een paar klanten en projecten.
7. Maak een routine (create_trigger, nieuwe sessie per keer, bijvoorbeeld `CRON_TZ=Europe/Amsterdam 43 5 * * *`)
   die stap 5 elke nacht uitvoert vanaf deze branch, en alleen bij fouten meldt.
