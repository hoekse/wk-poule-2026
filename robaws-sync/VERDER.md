# Verder met de Robaws-koppeling

Stand (2 november 2026, middag):

- Sleutel, netwerk en rechten in orde. De API-gebruiker heeft een rol met (onder meer) Klanten en Projecten.
  Nog niet: `include=legalForm` en `include=statusDetails` (403), daarom weggelaten.
  Robaws weigerde vlak na de rolwijziging los ~1 op 5 verzoeken (403); `haal()` probeert dat opnieuw.
- Vertaling gecontroleerd tegen echte gegevens (122 klanten, 91 projecten) en tegen de Werkplaats
  (119 klanten, 15 projecten) met een simulatie van `verwerkRobaws()`:
  - de Werkplaats-ids `r<N>` zijn Robaws-klant N (117 van 119); koppelen op naam geeft hetzelfde;
  - land als "Nederland", contactnaam met aanhef ("Dhr. Jan Jansen"), contactvelden op alfabet:
    daardoor wijzigt er bij bestaande klanten alleen wat echt anders is (7 klanten);
  - projectstatus in Robaws is `afgewerkt` / `voorbereiding` / `actief`;
  - projectnaam = "klant - omschrijving".
- Met akkoord van de eigenaar:
  - Werkplaats-project `zeearend-vu0d` gekoppeld aan Robaws-project 200 (P260080, Van Werven) en
    `tromp-noordweg-5t80` aan Robaws-project 156 (P260067). Er is ook Robaws-project 50 (P250045, SKO,
    afgewerkt) met "Zeearend" in de naam; niet gekoppeld.
  - Eerste pakketten gezet in `robawsimport` (run 202611021502: 120 klanten, 91 projecten).
    Verwacht na verwerking: 3 nieuwe klanten, 13 nieuwe projecten (10 voorbereiding, 3 actief; waarvan
    2 de gekoppelde bestaande), 78 afgewerkte overgeslagen.

Nog te doen:

1. Na het openen van de Werkplaats door de eigenaar: `robawsimport` moet leeg zijn en `instellingen/robaws`
   een samenvatting hebben. Controleer een paar klanten (robawsId gezet) en de nieuwe projecten.
2. Routine voor elke nacht (alleen met akkoord van de eigenaar): create_trigger, nieuwe sessie per keer,
   bijvoorbeeld `CRON_TZ=Europe/Amsterdam 43 5 * * *`, op deze branch: `python3 robaws_sync.py export` en
   de bestanden uit `uit/` als `set` in `robawsimport` (ArtifactData batch, doc_id = bestandsnaam zonder
   `robawsimport-` en `.json`). Alleen bij fouten melden. Sla de run over als `robawsimport` nog
   onverwerkte pakketten heeft (de Werkplaats is dan niet geopend), anders stapelen ze op.
3. Later eventueel: alleen wijzigingen ophalen met `updatedFrom`; rechten van de API-gebruiker beperken
   tot lezen (de rol mag nu ook schrijven en verwijderen); de sleutel vervangen (stond in een chat).
