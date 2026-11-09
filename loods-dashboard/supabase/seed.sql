-- =====================================================================
-- Loods Dashboard Hoeksema – startdata
-- Draai dit één keer na de migraties (Supabase: SQL-editor of `supabase db reset`).
--
-- LET OP: e-mailadressen en kentekens zijn nog niet bekend en staan leeg.
-- Vul daarna in de SQL-editor in (eenmalig, daarna kan het via Beheer):
--   update public.medewerkers set email = 'dennis@...' where naam = 'Dennis';
-- =====================================================================

-- Voertuigen -----------------------------------------------------------
insert into public.voertuigen (naam, kenteken)
select 'Volkswagen ID. Buzz Cargo', null
where not exists (select 1 from public.voertuigen where naam = 'Volkswagen ID. Buzz Cargo');

-- Medewerkers (kleur = vaste avatarkleur op de tv) ---------------------
insert into public.medewerkers (naam, rol, kleur)
select v.naam, v.rol, v.kleur
from (values
  ('Dennis',  'beheerder',  '#DC0014'),
  ('Raymond', 'medewerker', '#008CDC'),
  ('Bas',     'medewerker', '#F0B400'),
  ('Lesley',  'medewerker', '#8CB400')
) as v (naam, rol, kleur)
where not exists (select 1 from public.medewerkers m where m.naam = v.naam);

-- Zones (geometrie uit loods-3d-preview.html) ----------------------------
-- x/z = beginpunt in meters, breedte langs x, diepte langs z,
-- y = onderkant, hoogte = y-bereik.
insert into public.zones (code, naam, wand, x, y, z, breedte, diepte, hoogte, omschrijving, maat_geschat, heeft_voorraad, volgorde)
values
  ('B1', 'Trap- en reformladders',            'Wand B, bij de kanteldeur',               0.10, 0.00, 0.05, 1.60, 0.55, 2.30, 'Trapladders en reformladders, elk met een eigen nummer en QR-label.', true, true, 10),
  ('B2', 'Opgehangen ladders',                'Wand B, hoog aan de wand',                1.80, 1.50, 0.05, 4.60, 0.20, 1.10, 'Enkele en schuifladders aan de wandhaken. Keuring per ladder bijhouden.', true, true, 20),
  ('B3', 'Steigerkoppelingen en PBM',         'Wand B, vloer',                           1.80, 0.00, 0.05, 2.60, 0.60, 0.55, 'Kratten met koppelingen, korte buizen en veiligheidshesjes. Telwijze: aantallen.', true, true, 30),
  ('B4', 'Steekwagen en losse delen',         'Wand B, vloer',                           4.50, 0.00, 0.05, 1.90, 0.50, 1.60, 'Steekwagen, Linda-doos, profielen en losse delen.', true, true, 40),
  ('B5', 'Huishoudtrappen en rolsteigerframes','Wand B',                                  6.50, 0.00, 0.05, 1.00, 0.50, 2.10, 'Huishoudtrappen en kleine rolsteigerframes.', true, true, 50),
  ('B6', 'Stellingkast verf en koffers',      'Wand B, onder de entresol',               7.80, 0.00, 0.05, 2.20, 0.55, 2.00, 'Stelling met verfbussen en Makita-koffers.', true, true, 60),
  ('E1', 'Bovenop de entresol',               'Hoek wand B en wand C',                   7.75, 2.42, 0.15, 2.70, 4.70, 0.43, 'Instant Span rolsteigeronderdelen en dekzeilen. Telwijze: aantallen per onderdeel.', true, true, 70),
  ('E2', 'Onder de entresol',                 'Wand C',                                 10.00, 0.00, 0.80, 0.55, 3.80, 2.00, 'Stellingkasten met verf en gereedschapskoffers, airless verfspuit (Graco).', true, true, 80),
  ('C2', 'Steigerframes en staanders',        'Wand C, naast de entresol',              10.15, 0.00, 5.10, 0.40, 1.30, 2.30, 'Steigerframes, staanders en liggers tegen de wand. Telwijze: aantallen.', true, true, 90),
  ('C3', 'Materieel',                         'Wand C',                                  9.50, 0.00, 6.60, 1.05, 1.80, 1.20, 'Hogedrukreiniger, palletwagen, bak op pallet.', true, true, 100),
  ('D2', 'Verfstelling',                      'Verfwand, Synthetisch en Watergedragen',  3.90, 0.00, 7.40, 1.75, 0.36, 2.30, 'Verfrestanten, ingevoerd door de EAN op de bus te scannen. Begin stelling gemeten: 5,65 m van de voorgevel.', false, true, 110),
  ('D3', 'Verbruiksartikelen',                'Verfwand',                                2.20, 0.90, 7.40, 1.65, 0.36, 1.40, 'Kit, goldtape, schuurpapier, spuiten en slangen. Hier komt de afgesloten voorraadkast.', true, true, 120),
  ('D4', 'Bouwstofzuigers',                   'Verfwand, vloer',                         2.20, 0.00, 7.00, 1.65, 0.76, 0.70, 'Bouwstofzuigers en schuurmachines.', true, true, 130),
  ('OV', 'Overig',                            'Voor wand C',                             8.40, 0.00, 5.60, 1.00, 2.40, 1.10, 'Karts en overige spullen. Niet in het voorraadsysteem.', true, false, 200),
  ('D1', 'Riool en water',                    'Wand D, links naast de trap',             5.80, 0.00, 8.75, 2.00, 0.60, 0.06, 'Riool en wateraansluiting op de wand, naast het hoge deel van de trap. Mogelijke wasplaats voor kwasten en rollers.', true, false, 210),
  ('GA', 'Gang',                              'Achter de verfwand',                      0.05, 0.00, 7.95, 5.55, 1.40, 0.03, 'Gang achter de verfwand, ongeveer 150 cm diep, met de trap naar het kantoor.', true, false, 220),
  ('AC', 'Afvalcontainer restafval',          'Voor wand A',                             0.25, 0.00, 4.20, 1.25, 1.70, 1.25, 'Rolcontainer Milieu Service.', true, false, 230)
on conflict (code) do nothing;

-- Voorbeeldartikelen ----------------------------------------------------
-- Alleen om mee te testen. Vervang of deactiveer ze zodra de echte lijst er is.
insert into public.artikelen (naam, categorie, telwijze, zone_id, qr_code, minimum_voorraad, eenheid, keuring_verplicht, keuring_interval_maanden, omschrijving)
select v.naam, v.categorie, v.telwijze, z.id, v.qr_code, v.minimum, v.eenheid, v.keuring, v.interval, 'Voorbeeldartikel: aanpassen of deactiveren.'
from (values
  ('Trapladder 6 treden (voorbeeld)',      'ladder',      'per_stuk', 'B1', 'LA-001', null::int, null,     true,  12),
  ('Reformladder 3x8 (voorbeeld)',         'ladder',      'per_stuk', 'B1', 'LA-002', null,      null,     true,  12),
  ('Schuifladder 2x12 (voorbeeld)',        'ladder',      'per_stuk', 'B2', 'LA-003', null,      null,     true,  12),
  ('Staanders 3 m (voorbeeld)',            'steiger',     'aantal',   'C2', 'ST-001', null,      'stuks',  false, null),
  ('Liggers 2,5 m (voorbeeld)',            'steiger',     'aantal',   'C2', 'ST-002', null,      'stuks',  false, null),
  ('Steigerkoppelingen (voorbeeld)',       'steiger',     'aantal',   'B3', 'ST-003', null,      'stuks',  false, null),
  ('Boormachine Makita (voorbeeld)',       'gereedschap', 'per_stuk', 'B6', 'GE-001', null,      null,     false, null),
  ('Tacker (voorbeeld)',                   'gereedschap', 'per_stuk', 'B6', 'GE-002', null,      null,     false, null),
  ('Airless verfspuit Graco (voorbeeld)',  'gereedschap', 'per_stuk', 'E2', 'GE-003', null,      null,     false, null),
  ('Bouwstofzuiger 1 (voorbeeld)',         'gereedschap', 'per_stuk', 'D4', 'GE-004', null,      null,     false, null),
  ('Goldtape 50 mm (voorbeeld)',           'verbruik',    'aantal',   'D3', 'VB-001', 6,         'rollen', false, null),
  ('Acrylaatkit wit (voorbeeld)',          'verbruik',    'aantal',   'D3', 'VB-002', 10,        'kokers', false, null),
  ('Schuurpapier P120 (voorbeeld)',        'verbruik',    'aantal',   'D3', 'VB-003', 5,         'pakken', false, null)
) as v (naam, categorie, telwijze, zone, qr_code, minimum, eenheid, keuring, interval)
join public.zones z on z.code = v.zone
on conflict (qr_code) do nothing;

-- Beginvoorraad van de voorbeeldartikelen (alleen telwijze = aantal).
update public.voorraad vr
set aantal_totaal = v.aantal
from (values ('ST-001', 24), ('ST-002', 20), ('ST-003', 60), ('VB-001', 10), ('VB-002', 24), ('VB-003', 12)) as v (qr_code, aantal),
     public.artikelen a
where a.qr_code = v.qr_code and vr.artikel_id = a.id and vr.aantal_totaal = 0;
