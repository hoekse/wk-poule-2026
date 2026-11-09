-- =====================================================================
-- Tests fase 1: koppelen, winkelmand, RLS, correcties, voorraad, verf.
-- Alleen voor de lokale testdatabase (scripts/test-db.sh), niet op Supabase.
-- =====================================================================
\set ON_ERROR_STOP on
\o /dev/null
set client_min_messages = warning;

create schema test;
grant usage on schema test to authenticated, anon;

create function test.is(p_waarde anyelement, p_verwacht anyelement, p_wat text) returns void
language plpgsql as $$
begin
  if p_waarde is distinct from p_verwacht then
    raise exception 'MISLUKT: % (kreeg %, verwacht %)', p_wat, p_waarde, p_verwacht;
  end if;
  raise warning 'ok  %', p_wat;
end $$;

create function test.verwacht_fout(p_sql text, p_deel text, p_wat text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(lower(p_deel) in lower(sqlerrm)) = 0 then
      raise exception 'MISLUKT: % (verkeerde fout: "%", verwacht "%")', p_wat, sqlerrm, p_deel;
    end if;
    raise warning 'ok  % → "%"', p_wat, sqlerrm;
    return;
  end;
  raise exception 'MISLUKT: % (geen fout, verwacht "%")', p_wat, p_deel;
end $$;

create function test.als(p_naam text) returns void
language plpgsql as $$
declare
  v_sub uuid;
  v_email text := lower(p_naam) || '@test.nl';
begin
  select u.id into v_sub from auth.users u where u.email = v_email;
  if v_sub is null then raise exception 'testgebruiker % onbekend', p_naam; end if;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_sub, 'email', v_email, 'role', 'authenticated')::text, false);
end $$;

create function test.art(p_code text) returns uuid
language sql stable as $$ select id from public.artikelen where qr_code = p_code $$;

create function test.mw(p_naam text) returns uuid
language sql stable security definer as $$ select id from public.medewerkers where naam = p_naam $$;

grant execute on all functions in schema test to authenticated, anon;

-- Opzet: e-mailadressen en logins (in Supabase doet de magic link dit).
update public.medewerkers set email = lower(naam) || '@test.nl';
insert into auth.users (id, email)
select gen_random_uuid(), lower(naam) || '@test.nl' from public.medewerkers;
insert into auth.users (id, email) values (gen_random_uuid(), 'vreemde@test.nl');

select id as buzz from public.voertuigen where naam like 'Volkswagen%' \gset

-- Seed-controle
select test.is((select count(*) from public.zones)::int, 17, 'seed: 17 zones');
select test.is((select count(*) from public.artikelen)::int, 13, 'seed: 13 voorbeeldartikelen');
select test.is((select aantal_totaal from public.voorraad v join public.artikelen a on a.id = v.artikel_id where a.qr_code = 'ST-001'), 24, 'seed: 24 staanders');

-- =====================================================================
-- Bas
-- =====================================================================
select test.als('Bas');
set role authenticated;

select test.is((select naam from public.koppel_mij()), 'Bas', 'koppel_mij koppelt Bas via e-mail');
select test.is((select naam from public.koppel_mij()), 'Bas', 'koppel_mij tweede keer');
select test.is(public.is_beheerder(), false, 'Bas is geen beheerder');

-- Winkelmand: boormachine + tacker + 12 staanders in de ID. Buzz
select test.is((select count(*)::int from public.registreer(jsonb_build_array(
  jsonb_build_object('artikel_id', test.art('GE-001'), 'type', 'mee', 'voertuig_id', :'buzz'),
  jsonb_build_object('artikel_id', test.art('GE-002'), 'type', 'mee', 'voertuig_id', :'buzz'),
  jsonb_build_object('artikel_id', test.art('ST-001'), 'type', 'mee', 'aantal', 12, 'voertuig_id', :'buzz')
))), 3, 'winkelmand met 3 regels');

select test.is((select count(distinct batch_id)::int from public.bewegingen), 1, 'één batch_id voor de winkelmand');
select test.is((select string_agg(qr_code || ':' || aantal, ',' order by qr_code) from public.onderweg where houder_naam = 'Bas'),
               'GE-001:1,GE-002:1,ST-001:12', 'onderweg bij Bas');
select test.is((select voertuig_naam from public.onderweg where qr_code = 'ST-001'), 'Volkswagen ID. Buzz Cargo', 'bus bij onderweg');
select test.is((select dagen_weg from public.onderweg where qr_code = 'ST-001'), 0, 'dagen weg = 0');
select test.is((select aanwezig from public.artikel_overzicht where qr_code = 'ST-001'), 12, 'nog 12 staanders aanwezig');

select test.verwacht_fout($$select * from public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('VB-001'), 'type', 'correctie', 'aantal', 5)))$$,
  'Alleen de beheerder', 'medewerker mag geen correctie maken');
select test.verwacht_fout($$update public.bewegingen set aantal = 99$$, 'permission denied', 'beweging wijzigen kan niet');
select test.verwacht_fout($$delete from public.bewegingen$$, 'permission denied', 'beweging verwijderen kan niet');
select test.verwacht_fout($$insert into public.artikelen (naam, categorie, telwijze) values ('Hack', 'ladder', 'per_stuk')$$,
  'row-level security', 'medewerker mag geen artikel toevoegen');
select test.verwacht_fout($$update public.voorraad set aantal_totaal = 999$$, 'permission denied', 'voorraad niet direct aan te passen');
select test.verwacht_fout($$select * from public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('GE-001'), 'type', 'mee')))$$,
  'al mee', 'zelfde boormachine twee keer meenemen');
select test.verwacht_fout($$select * from public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('ST-001'), 'type', 'terug', 'aantal', 13)))$$,
  'maar 12', 'meer terugbrengen dan mee');
select test.verwacht_fout($$select * from public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('GE-003'), 'type', 'mee', 'aantal', 2)))$$,
  'altijd 1', 'per-stuk artikel met aantal 2');

-- Direct invoeren met een andere naam en tijd: de server overschrijft dat.
insert into public.bewegingen (artikel_id, type, aantal, medewerker_id, houder_id, tijdstip)
values (test.art('ST-002'), 'mee', 2, test.mw('Raymond'), test.mw('Raymond'), '2020-01-01');
select test.is((select medewerker_naam || '/' || houder_naam from public.beweging_log where qr_code = 'ST-002' order by id desc limit 1),
               'Bas/Bas', 'naam en houder door server gezet');
select test.is((select tijdstip > now() - interval '1 minute' from public.bewegingen where artikel_id = test.art('ST-002') order by id desc limit 1),
               true, 'tijdstip door server gezet');

-- Terugbrengen: 10 van de 12 staanders
select test.is((select count(*)::int from public.registreer(jsonb_build_array(
  jsonb_build_object('artikel_id', test.art('ST-001'), 'type', 'terug', 'aantal', 10)))), 1, 'Bas brengt 10 staanders terug');
select test.is((select aantal from public.onderweg where qr_code = 'ST-001' and houder_naam = 'Bas'), 2, 'Bas heeft nog 2 staanders');

reset role;

-- =====================================================================
-- Raymond
-- =====================================================================
select test.als('Raymond');
set role authenticated;
select test.is((select naam from public.koppel_mij()), 'Raymond', 'koppel_mij Raymond');

-- Tacker staat nog op naam van Bas: overnemen gaat automatisch.
select test.is((select string_agg(type, ',' order by id) from public.registreer(jsonb_build_array(
  jsonb_build_object('artikel_id', test.art('GE-002'), 'type', 'mee')))), 'terug,mee', 'tacker overnemen van Bas');
select test.is((select houder_naam from public.onderweg where qr_code = 'GE-002'), 'Raymond', 'tacker nu bij Raymond');
select test.is((select count(*)::int from public.onderweg where qr_code = 'GE-002'), 1, 'tacker maar bij één persoon');

-- Raymond brengt de boormachine van Bas terug.
select test.is((select count(*)::int from public.registreer(jsonb_build_array(
  jsonb_build_object('artikel_id', test.art('GE-001'), 'type', 'terug', 'houder_id', test.mw('Bas'))))), 1, 'Raymond brengt boormachine van Bas terug');
select test.is((select count(*)::int from public.onderweg where qr_code = 'GE-001'), 0, 'boormachine weer in de loods');
select test.is((select medewerker_naam || '/' || houder_naam from public.beweging_log where qr_code = 'GE-001' order by id desc limit 1),
               'Raymond/Bas', 'terug geregistreerd door Raymond voor Bas');

-- Verbruik: goldtape (10, minimum 6)
select test.is((select count(*)::int from public.registreer(jsonb_build_array(
  jsonb_build_object('artikel_id', test.art('VB-001'), 'type', 'verbruikt', 'aantal', 3)))), 1, 'verbruik 3 goldtape');
select test.is((select aanwezig::text || '/' || onder_minimum::text from public.artikel_overzicht where qr_code = 'VB-001'), '7/false', 'goldtape 7, niet onder minimum');
select public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('VB-001'), 'type', 'verbruikt', 'aantal', 2)));
select test.is((select aanwezig::text || '/' || onder_minimum::text from public.artikel_overzicht where qr_code = 'VB-001'), '5/true', 'goldtape 5, onder minimum');
select test.verwacht_fout($$select * from public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('GE-003'), 'type', 'verbruikt', 'aantal', 1)))$$,
  'per stuk', 'per-stuk artikel als verbruik');

-- Snel een project toevoegen en gebruiken
insert into public.projecten (naam) values ('  Testproject Kampen ');
select test.is((select naam || '/' || (aangemaakt_door = test.mw('Raymond'))::text from public.projecten), 'Testproject Kampen/true', 'project door medewerker toegevoegd');
select public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('ST-003'), 'type', 'mee', 'aantal', 20,
  'project_id', (select id from public.projecten limit 1), 'voertuig_id', :'buzz')));
select test.is((select project_naam from public.onderweg where qr_code = 'ST-003'), 'Testproject Kampen', 'project bij onderweg');
update public.projecten set naam = 'Anders';
select test.is((select naam from public.projecten), 'Testproject Kampen', 'medewerker kan project niet hernoemen');

-- Restverf: nieuw EAN onthouden en restant invoeren (op eigen naam)
insert into public.verfproducten (ean, merk, product, glansgraad, basis, inhoud_liter)
values ('8712345678906', 'Sikkens', 'Rubbol BL Satura', 'Zijdeglans', 'watergedragen', 2.5);
insert into public.verfrestanten (ean, merk, product, kleurcode, glansgraad, basis, inhoud_liter, vulling, zone_id, ingevoerd_door)
values (' 8712345678906 ', 'Sikkens', 'Rubbol BL Satura', ' RAL 9010 ', 'Zijdeglans', 'watergedragen', 2.5, '1/2',
        (select id from public.zones where code = 'D2'), test.mw('Bas'));
select test.is((select v.ean || '/' || v.kleurcode || '/' || m.naam from public.verfrestanten v join public.medewerkers m on m.id = v.ingevoerd_door),
               '8712345678906/RAL 9010/Raymond', 'restverf op naam van Raymond');
select test.is((select aangemaakt_door = test.mw('Raymond') from public.verfproducten), true, 'verfproduct onthouden door Raymond');
update public.verfrestanten set status = 'gebruikt';
select test.is((select status || '/' || (status_gewijzigd_door = test.mw('Raymond'))::text from public.verfrestanten), 'gebruikt/true', 'restverf als gebruikt gemarkeerd');

reset role;

-- =====================================================================
-- Onbekende login
-- =====================================================================
select test.als('vreemde');
set role authenticated;
select test.is((select count(*)::int from public.koppel_mij()), 0, 'onbekend e-mailadres wordt niet gekoppeld');
select test.is((select count(*)::int from public.artikelen), 0, 'onbekende ziet geen artikelen');
select test.is((select count(*)::int from public.onderweg), 0, 'onbekende ziet niets onderweg');
select test.verwacht_fout($$select * from public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', '00000000-0000-0000-0000-000000000000', 'type', 'mee')))$$,
  'niet gekoppeld', 'onbekende kan niet registreren');
select test.verwacht_fout($$insert into public.projecten (naam) values ('x')$$, 'row-level security', 'onbekende kan geen project toevoegen');
reset role;

-- Anoniem (niet ingelogd)
select set_config('request.jwt.claims', '', false);
set role anon;
select test.verwacht_fout($$select count(*) from public.artikelen$$, 'permission denied', 'anoniem ziet niets');
reset role;

-- =====================================================================
-- Dennis (beheerder)
-- =====================================================================
select test.als('Dennis');
set role authenticated;
select test.is((select rol from public.koppel_mij()), 'beheerder', 'Dennis is beheerder');

-- Voorraadcorrectie: 10 rollen goldtape erbij (5 + 10 = 15)
select public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('VB-001'), 'type', 'correctie', 'aantal', 10, 'opmerking', 'Nieuwe doos')));
select test.is((select aanwezig from public.artikel_overzicht where qr_code = 'VB-001'), 15, 'goldtape aangevuld tot 15');

-- Onderweg herstellen: Bas heeft de 2 liggers al lang teruggelegd.
select public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('ST-002'), 'type', 'correctie', 'aantal', -2,
  'houder_id', test.mw('Bas'), 'opmerking', 'Vergeten te scannen')));
select test.is((select count(*)::int from public.onderweg where qr_code = 'ST-002'), 0, 'liggers niet meer onderweg na correctie');
select test.verwacht_fout($$select * from public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('ST-002'), 'type', 'correctie', 'aantal', -1, 'houder_id', test.mw('Bas'))))$$,
  'negatief', 'correctie onder nul');
select test.verwacht_fout($$select * from public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('GE-001'), 'type', 'correctie', 'aantal', 1)))$$,
  'aantallen', 'voorraadcorrectie op per-stuk artikel');

-- Beheerder neemt iets mee op naam van Lesley (bijv. vergeten te scannen)
select public.registreer(jsonb_build_array(jsonb_build_object('artikel_id', test.art('LA-003'), 'type', 'mee', 'houder_id', test.mw('Lesley'))));
select test.is((select houder_naam from public.onderweg where qr_code = 'LA-003'), 'Lesley', 'beheerder registreert op naam van Lesley');

-- Nieuw artikel krijgt automatisch een QR-code
insert into public.artikelen (naam, categorie, telwijze) values ('Testladder', 'ladder', 'per_stuk');
select test.is((select qr_code from public.artikelen where naam = 'Testladder'), 'LA-004', 'automatische QR-code LA-004');
insert into public.artikelen (naam, categorie, telwijze, ean) values ('Afplaktape', 'verbruik', 'aantal', '87 1000 1234567');
select test.is((select qr_code || '/' || ean from public.artikelen where naam = 'Afplaktape'), 'VB-004/8710001234567', 'QR VB-004 en EAN zonder spaties');
select test.is((select aantal_totaal from public.voorraad where artikel_id = (select id from public.artikelen where naam = 'Afplaktape')), 0, 'voorraadregel aangemaakt');
select test.verwacht_fout($$update public.artikelen set telwijze = 'per_stuk' where qr_code = 'ST-001'$$, 'telwijze', 'telwijze wijzigen na bewegingen');

-- Keuring: geldig_tot volgt uit het interval (12 maanden)
insert into public.keuringen (artikel_id, gekeurd_op, door) values (test.art('LA-001'), current_date - 30, 'Keuringsbedrijf');
select test.is((select keuring_geldig_tot from public.artikel_overzicht where qr_code = 'LA-001'), (current_date - 30 + interval '12 months')::date, 'keuring geldig tot +12 mnd');
select test.is((select keuring_status from public.artikel_overzicht where qr_code = 'LA-001'), 'geldig', 'keuring geldig');
select test.is((select keuring_status from public.artikel_overzicht where qr_code = 'LA-002'), 'onbekend', 'geen keuring = onbekend');
select test.is((select keuring_status from public.artikel_overzicht where qr_code = 'GE-001'), null::text, 'geen keuringsplicht');

-- Beheer medewerkers
select test.verwacht_fout($$update public.medewerkers set actief = false where naam = 'Dennis'$$, 'minstens één actieve beheerder', 'laatste beheerder deactiveren');
update public.medewerkers set actief = false where naam = 'Lesley';
insert into public.medewerkers (naam, email) values ('Nieuwe Collega', ' Nieuw@Test.nl ');
select test.is((select email from public.medewerkers where naam = 'Nieuwe Collega'), 'nieuw@test.nl', 'e-mail opgeschoond');
update public.zones set breedte = 1.65 where code = 'B1';
select test.is((select breedte from public.zones where code = 'B1'), 1.65::numeric, 'beheerder past zonemaat aan');
reset role;

-- Gedeactiveerde medewerker ziet niets meer
select test.als('Lesley');
set role authenticated;
select test.is((select actief from public.koppel_mij()), false, 'Lesley gekoppeld maar inactief');
select test.is((select count(*)::int from public.artikelen), 0, 'inactieve medewerker ziet geen artikelen');
reset role;

-- =====================================================================
-- Server (postgres)
-- =====================================================================
select set_config('request.jwt.claims', '', false);
select test.verwacht_fout($$delete from public.bewegingen$$, 'kunnen niet worden gewijzigd', 'ook de server kan geen bewegingen wissen');
select test.verwacht_fout($$truncate public.bewegingen$$, 'kunnen niet worden gewijzigd', 'geen truncate');
select test.is((select count(*)::int from pg_publication_tables where pubname = 'supabase_realtime'), 2, 'realtime aan voor 2 tabellen');
select test.is((select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity), 0, 'RLS aan op alle tabellen');

drop schema test cascade;
