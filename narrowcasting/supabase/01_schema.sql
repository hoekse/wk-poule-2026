-- Narrowcasting Hoeksema Schilderwerken — databaseschema (Supabase / PostgreSQL)
--
-- Twee tabellen:
--   narrowcasting_slides        één rij per slide
--   narrowcasting_instellingen  algemene instellingen (sleutel → JSON-waarde)
--
-- Beveiliging: het scherm gebruikt de openbare 'publishable' sleutel en mag
-- alleen LEZEN. Wijzigen kan alleen via het Supabase-dashboard of via Claude
-- (Supabase-connector), die als database-beheerder werken.

create table if not exists public.narrowcasting_slides (
  id         bigint generated always as identity primary key,
  naam       text not null unique,
  volgorde   integer not null default 100,
  type       text not null check (type in ('titel','tekst','foto','voor_na','diensten','weer','review','vacature','contact','cijfers','video')),
  actief     boolean not null default true,
  duur       integer check (duur is null or duur between 3 and 600),
  van        date,
  tot        date,
  dagen      text[],
  schermen   text[],
  inhoud     jsonb not null default '{}'::jsonb,
  bijgewerkt timestamptz not null default now()
);

create table if not exists public.narrowcasting_instellingen (
  sleutel    text primary key,
  waarde     jsonb not null,
  bijgewerkt timestamptz not null default now()
);

-- 'bijgewerkt' automatisch bijhouden
create or replace function public.narrowcasting_zet_bijgewerkt()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.bijgewerkt := now();
  return new;
end;
$$;

drop trigger if exists narrowcasting_slides_bijgewerkt on public.narrowcasting_slides;
create trigger narrowcasting_slides_bijgewerkt
  before update on public.narrowcasting_slides
  for each row execute function public.narrowcasting_zet_bijgewerkt();

drop trigger if exists narrowcasting_instellingen_bijgewerkt on public.narrowcasting_instellingen;
create trigger narrowcasting_instellingen_bijgewerkt
  before update on public.narrowcasting_instellingen
  for each row execute function public.narrowcasting_zet_bijgewerkt();

-- Row Level Security: iedereen mag lezen, niemand mag via de API schrijven
alter table public.narrowcasting_slides enable row level security;
alter table public.narrowcasting_instellingen enable row level security;

drop policy if exists "narrowcasting_slides: lezen" on public.narrowcasting_slides;
create policy "narrowcasting_slides: lezen" on public.narrowcasting_slides
  for select to anon, authenticated using (true);

drop policy if exists "narrowcasting_instellingen: lezen" on public.narrowcasting_instellingen;
create policy "narrowcasting_instellingen: lezen" on public.narrowcasting_instellingen
  for select to anon, authenticated using (true);

revoke insert, update, delete, truncate on public.narrowcasting_slides from anon, authenticated;
revoke insert, update, delete, truncate on public.narrowcasting_instellingen from anon, authenticated;
grant select on public.narrowcasting_slides to anon, authenticated;
grant select on public.narrowcasting_instellingen to anon, authenticated;

-- Uitleg in de database zelf, zodat Claude (of wie dan ook) snapt hoe het werkt
comment on table public.narrowcasting_slides is
  'Narrowcasting-scherm Hoeksema Schilderwerken: één rij per slide. Het scherm ververst elke ~30 s. '
  'Types: titel, tekst, foto, voor_na, diensten, weer, review, vacature, contact, cijfers, video. '
  'Velden per type staan in kolom inhoud (jsonb); volledige uitleg: narrowcasting/CLAUDE.md in GitHub-repo hoekse/wk-poule-2026.';
comment on column public.narrowcasting_slides.naam is 'Unieke korte naam (kebab-case), bv. vacature-schilder. Gebruik deze om slides aan te wijzen.';
comment on column public.narrowcasting_slides.volgorde is 'Afspeelvolgorde, laag eerst. Gebruik stappen van 10.';
comment on column public.narrowcasting_slides.actief is 'false = slide staat uit (blijft bewaard).';
comment on column public.narrowcasting_slides.duur is 'Seconden in beeld; leeg = standaardduur uit instelling weergave.';
comment on column public.narrowcasting_slides.van is 'Optioneel: pas tonen vanaf deze datum.';
comment on column public.narrowcasting_slides.tot is 'Optioneel: tonen tot en met deze datum.';
comment on column public.narrowcasting_slides.dagen is 'Optioneel: alleen op deze dagen, bv. {ma,di,wo,do,vr}.';
comment on column public.narrowcasting_slides.schermen is 'Optioneel: alleen op schermen met deze naam (adres ...?scherm=naam). Leeg = alle schermen.';
comment on column public.narrowcasting_slides.inhoud is 'Inhoud van de slide (jsonb), velden afhankelijk van type. Algemeen: thema (licht/donker/kleur), kleur (rood/geel/blauw/groen). *woord* = accentkleur.';
comment on table public.narrowcasting_instellingen is
  'Instellingen narrowcasting. Sleutels: bedrijf, ticker (lijst lopende teksten), mededeling ({tekst,kleur,tot}), weer ({plaats}), '
  'weergave ({standaard_duur,overgang,verversen_sec,ticker_snelheid}), nachtstand ({aan,van,tot,weekend}), herladen (wijzig waarde = scherm herlaadt).';
