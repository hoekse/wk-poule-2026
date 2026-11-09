-- =====================================================================
-- Loods Dashboard Hoeksema – beveiliging (Row Level Security)
-- Regel: alleen ingelogde, actieve medewerkers zien iets.
--        Medewerkers registreren op eigen naam; de beheerder mag alles.
--        Bewegingen zijn nooit te wijzigen of te verwijderen.
-- =====================================================================

alter table public.voertuigen    enable row level security;
alter table public.medewerkers   enable row level security;
alter table public.projecten     enable row level security;
alter table public.zones         enable row level security;
alter table public.artikelen     enable row level security;
alter table public.voorraad      enable row level security;
alter table public.bewegingen    enable row level security;
alter table public.verfproducten enable row level security;
alter table public.verfrestanten enable row level security;
alter table public.keuringen     enable row level security;

-- Rechten op tabelniveau: anoniem niets, ingelogd via RLS.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke truncate on all tables in schema public from authenticated;
revoke update, delete on public.bewegingen from authenticated;
revoke insert, update, delete on public.voorraad from authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;

-- ---------------------------------------------------------------------
-- Voertuigen
-- ---------------------------------------------------------------------
create policy "voertuigen lezen" on public.voertuigen
  for select to authenticated using ((select public.is_medewerker()));
create policy "voertuigen toevoegen door beheerder" on public.voertuigen
  for insert to authenticated with check ((select public.is_beheerder()));
create policy "voertuigen wijzigen door beheerder" on public.voertuigen
  for update to authenticated using ((select public.is_beheerder())) with check ((select public.is_beheerder()));

-- ---------------------------------------------------------------------
-- Medewerkers (ook je eigen regel als je gedeactiveerd bent)
-- ---------------------------------------------------------------------
create policy "medewerkers lezen" on public.medewerkers
  for select to authenticated using ((select public.is_medewerker()) or auth_user_id = (select auth.uid()));
create policy "medewerkers toevoegen door beheerder" on public.medewerkers
  for insert to authenticated with check ((select public.is_beheerder()));
create policy "medewerkers wijzigen door beheerder" on public.medewerkers
  for update to authenticated using ((select public.is_beheerder())) with check ((select public.is_beheerder()));

-- ---------------------------------------------------------------------
-- Projecten: iedereen mag snel een project toevoegen, beheerder wijzigt
-- ---------------------------------------------------------------------
create policy "projecten lezen" on public.projecten
  for select to authenticated using ((select public.is_medewerker()));
create policy "projecten toevoegen" on public.projecten
  for insert to authenticated with check ((select public.is_medewerker()));
create policy "projecten wijzigen door beheerder" on public.projecten
  for update to authenticated using ((select public.is_beheerder())) with check ((select public.is_beheerder()));

-- ---------------------------------------------------------------------
-- Zones
-- ---------------------------------------------------------------------
create policy "zones lezen" on public.zones
  for select to authenticated using ((select public.is_medewerker()));
create policy "zones toevoegen door beheerder" on public.zones
  for insert to authenticated with check ((select public.is_beheerder()));
create policy "zones wijzigen door beheerder" on public.zones
  for update to authenticated using ((select public.is_beheerder())) with check ((select public.is_beheerder()));
create policy "zones verwijderen door beheerder" on public.zones
  for delete to authenticated using ((select public.is_beheerder()));

-- ---------------------------------------------------------------------
-- Artikelen en voorraad
-- ---------------------------------------------------------------------
create policy "artikelen lezen" on public.artikelen
  for select to authenticated using ((select public.is_medewerker()));
create policy "artikelen toevoegen door beheerder" on public.artikelen
  for insert to authenticated with check ((select public.is_beheerder()));
create policy "artikelen wijzigen door beheerder" on public.artikelen
  for update to authenticated using ((select public.is_beheerder())) with check ((select public.is_beheerder()));

create policy "voorraad lezen" on public.voorraad
  for select to authenticated using ((select public.is_medewerker()));

-- ---------------------------------------------------------------------
-- Bewegingen: lezen mag iedereen, toevoegen alleen op eigen naam
-- ---------------------------------------------------------------------
create policy "bewegingen lezen" on public.bewegingen
  for select to authenticated using ((select public.is_medewerker()));
create policy "bewegingen toevoegen op eigen naam" on public.bewegingen
  for insert to authenticated
  with check (medewerker_id = (select public.huidige_medewerker_id()));

-- ---------------------------------------------------------------------
-- Verf
-- ---------------------------------------------------------------------
create policy "verfproducten lezen" on public.verfproducten
  for select to authenticated using ((select public.is_medewerker()));
create policy "verfproducten toevoegen" on public.verfproducten
  for insert to authenticated with check ((select public.is_medewerker()));
create policy "verfproducten wijzigen" on public.verfproducten
  for update to authenticated using ((select public.is_medewerker())) with check ((select public.is_medewerker()));

create policy "verfrestanten lezen" on public.verfrestanten
  for select to authenticated using ((select public.is_medewerker()));
create policy "verfrestanten toevoegen op eigen naam" on public.verfrestanten
  for insert to authenticated with check (ingevoerd_door = (select public.huidige_medewerker_id()));
create policy "verfrestanten wijzigen" on public.verfrestanten
  for update to authenticated using ((select public.is_medewerker())) with check ((select public.is_medewerker()));
create policy "verfrestanten verwijderen door beheerder" on public.verfrestanten
  for delete to authenticated using ((select public.is_beheerder()));

-- ---------------------------------------------------------------------
-- Keuringen
-- ---------------------------------------------------------------------
create policy "keuringen lezen" on public.keuringen
  for select to authenticated using ((select public.is_medewerker()));
create policy "keuringen toevoegen door beheerder" on public.keuringen
  for insert to authenticated with check ((select public.is_beheerder()));
create policy "keuringen wijzigen door beheerder" on public.keuringen
  for update to authenticated using ((select public.is_beheerder())) with check ((select public.is_beheerder()));
create policy "keuringen verwijderen door beheerder" on public.keuringen
  for delete to authenticated using ((select public.is_beheerder()));
