# Verder met de Robaws-koppeling

Stand 13 november 2026:

- Verbinding werkt. De sleutel staat als netwerkgeheim voor `app.robaws.com` in de omgeving (de proxy zet hem
  erbij); `ROBAWS_KEY`/`ROBAWS_SECRET` als omgevingsvariabelen mag ook.
- De API-beschrijving staat op `/api-docs/robaws` (JSON). `/public/api-docs/robaws` is alleen de leespagina.
- `map_klant` en `map_project` zijn ingevuld en getest. Klanten: aanhef + voornaam + achternaam voor contactpersonen,
  btw uit vatTariff, rechtsvorm en betaalvoorwaarde uit include. Projecten: naam "klant - planningsnaam" of
  "klant - plaats", status afgewerkt -> afgerond.
- De bestaande klanten `r<N>` in de Werkplaats zijn Robaws-klant N; ze hebben sinds de eerste import
  (2 november) een `robawsId`. Nieuwe klanten en projecten krijgen id `rb<robawsId>`.
- De Werkplaats (vanaf versie 1794597137-fbbd) vergelijkt velden zonder op volgorde te letten en laat de naam van
  een bestaand project staan.
- Proef op 13 november (echte verwerking op een kopie): 3 nieuwe klanten, 11 bijgewerkt (e-mail, contactpersonen,
  rechtsvorm), 1 project kreeg een referentie, niets verwijderd.

Nog te doen:

1. Met akkoord van de eigenaar: `python3 robaws_sync.py export` en elk bestand uit `uit/` als document in de
   collectie `robawsimport` van https://claude.ai/artifact/WNbtbE9m4VAsEt9WNSSmPW zetten (ArtifactData batch,
   `set`, doc_id = bestandsnaam zonder `robawsimport-` en `.json`). De Werkplaats verwerkt ze zodra de eigenaar hem opent.
2. Een routine die stap 1 elke nacht doet vanaf branch `claude/robaws-api-integration-sax58k` en alleen bij fouten meldt.
