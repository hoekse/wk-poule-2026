-- =====================================================================
-- Loods Dashboard Hoeksema – basisschema (fase 1)
-- Tabellen, sleutels en indexen. Logica staat in ..._logica.sql,
-- beveiliging (RLS) in ..._beveiliging.sql.
-- Assenstelsel loods: x langs de ladderwand (0 → 10,60 m),
-- z langs de voorgevel (0 → 9,40 m), y = hoogte. Oorsprong = hoek
-- voorgevel (kanteldeur) × ladderwand.
-- =====================================================================

create table public.voertuigen (
  id            uuid primary key default gen_random_uuid(),
  naam          text not null check (length(trim(naam)) > 0),
  kenteken      text,
  actief        boolean not null default true,
  aangemaakt_op timestamptz not null default now()
);
comment on table public.voertuigen is 'Bussen en andere voertuigen. Nooit verwijderen, alleen deactiveren.';

create table public.medewerkers (
  id                    uuid primary key default gen_random_uuid(),
  naam                  text not null check (length(trim(naam)) > 0),
  email                 text,
  rol                   text not null default 'medewerker' check (rol in ('beheerder', 'medewerker')),
  actief                boolean not null default true,
  standaard_voertuig_id uuid references public.voertuigen (id) on delete set null,
  kleur                 text not null default '#008CDC' check (kleur ~ '^#[0-9A-Fa-f]{6}$'),
  auth_user_id          uuid unique references auth.users (id) on delete set null,
  aangemaakt_op         timestamptz not null default now()
);
create unique index medewerkers_email_uniek on public.medewerkers (lower(email)) where email is not null;
comment on table public.medewerkers is 'Medewerkers. Nooit verwijderen (historie), alleen deactiveren. Login wordt gekoppeld via e-mail.';
comment on column public.medewerkers.kleur is 'Vaste avatarkleur op de tv.';

create table public.projecten (
  id              uuid primary key default gen_random_uuid(),
  naam            text not null check (length(trim(naam)) > 0),
  adres           text,
  actief          boolean not null default true,
  aangemaakt_door uuid references public.medewerkers (id),
  aangemaakt_op   timestamptz not null default now()
);
comment on table public.projecten is 'Projecten. Later te koppelen aan Hoeksema Magister Colorum.';

create table public.zones (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (code ~ '^[A-Z0-9]{1,4}$'),
  naam           text not null check (length(trim(naam)) > 0),
  wand           text,
  x              numeric(5, 2) not null default 0,
  y              numeric(5, 2) not null default 0,
  z              numeric(5, 2) not null default 0,
  breedte        numeric(5, 2) not null default 1 check (breedte > 0),
  diepte         numeric(5, 2) not null default 1 check (diepte > 0),
  hoogte         numeric(5, 2) not null default 1 check (hoogte > 0),
  kleur_override text check (kleur_override ~ '^#[0-9A-Fa-f]{6}$'),
  omschrijving   text,
  maat_geschat   boolean not null default true,
  heeft_voorraad boolean not null default true,
  volgorde       int not null default 0,
  bijgewerkt_op  timestamptz not null default now()
);
comment on table public.zones is 'Zones in de loods. x/z = beginpunt (m), breedte langs x, diepte langs z, y = onderkant, hoogte langs y.';
comment on column public.zones.heeft_voorraad is 'false = vast punt (riool, gang, afvalcontainer): grijs tonen, niet in voorraadsysteem.';

create table public.artikelen (
  id                       uuid primary key default gen_random_uuid(),
  naam                     text not null check (length(trim(naam)) > 0),
  categorie                text not null check (categorie in ('steiger', 'ladder', 'gereedschap', 'verf', 'verbruik')),
  telwijze                 text not null check (telwijze in ('per_stuk', 'aantal')),
  zone_id                  uuid references public.zones (id) on delete set null,
  qr_code                  text not null unique,
  ean                      text check (ean ~ '^[0-9]{8,14}$'),
  minimum_voorraad         int check (minimum_voorraad >= 0),
  eenheid                  text,
  keuring_verplicht        boolean not null default false,
  keuring_interval_maanden int check (keuring_interval_maanden between 1 and 120),
  foto_url                 text,
  omschrijving             text,
  actief                   boolean not null default true,
  aangemaakt_op            timestamptz not null default now(),
  bijgewerkt_op            timestamptz not null default now()
);
create unique index artikelen_ean_uniek on public.artikelen (ean) where ean is not null;
create index artikelen_zone on public.artikelen (zone_id);
comment on column public.artikelen.qr_code is 'Code in het QR-label, bijv. LA-003. Wordt automatisch gemaakt als hij leeg is.';
comment on column public.artikelen.ean is 'Streepjescode van de fabrikant (handig voor kit, tape). Uniek.';
comment on column public.artikelen.eenheid is 'Bijv. rollen, kokers, stuks. Alleen voor de weergave.';

create table public.voorraad (
  artikel_id    uuid primary key references public.artikelen (id) on delete cascade,
  aantal_totaal int not null default 0,
  bijgewerkt_op timestamptz not null default now()
);
comment on table public.voorraad is 'Totaal in bezit, alleen voor telwijze=aantal. Wordt bijgewerkt door bewegingen (correctie / verbruikt), nooit direct.';

create table public.bewegingen (
  id            bigint generated always as identity primary key,
  artikel_id    uuid not null references public.artikelen (id),
  type          text not null check (type in ('mee', 'terug', 'correctie', 'verbruikt')),
  aantal        int not null check (aantal <> 0),
  medewerker_id uuid not null references public.medewerkers (id),
  houder_id     uuid references public.medewerkers (id),
  voertuig_id   uuid references public.voertuigen (id),
  project_id    uuid references public.projecten (id),
  tijdstip      timestamptz not null default now(),
  opmerking     text,
  batch_id      uuid,
  constraint aantal_positief check (type = 'correctie' or aantal > 0),
  constraint houder_bij_mee_terug check (type not in ('mee', 'terug') or houder_id is not null),
  constraint geen_houder_bij_verbruik check (type <> 'verbruikt' or houder_id is null)
);
create index bewegingen_artikel_houder on public.bewegingen (artikel_id, houder_id, tijdstip, id);
create index bewegingen_medewerker on public.bewegingen (medewerker_id, tijdstip desc);
create index bewegingen_tijdstip on public.bewegingen (tijdstip desc);
comment on table public.bewegingen is 'Audittrail. Nooit wijzigen of verwijderen: fouten herstellen met een correctie.';
comment on column public.bewegingen.medewerker_id is 'Wie registreerde. Altijd door de server gezet.';
comment on column public.bewegingen.houder_id is 'Op wiens naam het materiaal staat (mee/terug, correctie onderweg). Leeg bij verbruik en voorraadcorrectie.';
comment on column public.bewegingen.aantal is 'Positief, behalve bij correctie (+ of -).';
comment on column public.bewegingen.batch_id is 'Regels uit één winkelmand delen hetzelfde batch_id.';

create table public.verfproducten (
  ean             text primary key check (ean ~ '^[0-9]{8,14}$'),
  merk            text not null check (length(trim(merk)) > 0),
  product         text not null check (length(trim(product)) > 0),
  glansgraad      text,
  basis           text check (basis in ('synthetisch', 'watergedragen')),
  inhoud_liter    numeric(5, 2) check (inhoud_liter > 0),
  aangemaakt_door uuid references public.medewerkers (id),
  aangemaakt_op   timestamptz not null default now(),
  bijgewerkt_op   timestamptz not null default now()
);
comment on table public.verfproducten is 'Geheugen voor EAN-codes van verfbussen: één keer invoeren, daarna vooringevuld.';

create table public.verfrestanten (
  id                    uuid primary key default gen_random_uuid(),
  ean                   text,
  merk                  text,
  product               text,
  kleurcode             text,
  glansgraad            text,
  basis                 text check (basis in ('synthetisch', 'watergedragen')),
  inhoud_liter          numeric(5, 2) check (inhoud_liter > 0),
  vulling               text not null check (vulling in ('vol', '3/4', '1/2', '1/4')),
  geopend_op            date,
  zone_id               uuid references public.zones (id) on delete set null,
  foto_url              text,
  opmerking             text,
  ingevoerd_door        uuid not null references public.medewerkers (id),
  ingevoerd_op          timestamptz not null default now(),
  status                text not null default 'aanwezig' check (status in ('aanwezig', 'gebruikt', 'afgevoerd')),
  status_gewijzigd_door uuid references public.medewerkers (id),
  status_gewijzigd_op   timestamptz
);
create index verfrestanten_kleurcode on public.verfrestanten (lower(kleurcode));
create index verfrestanten_status on public.verfrestanten (status);

create table public.keuringen (
  id             uuid primary key default gen_random_uuid(),
  artikel_id     uuid not null references public.artikelen (id) on delete cascade,
  gekeurd_op     date not null,
  geldig_tot     date,
  door           text,
  opmerking      text,
  ingevoerd_door uuid references public.medewerkers (id),
  ingevoerd_op   timestamptz not null default now(),
  constraint geldig_na_keuring check (geldig_tot is null or geldig_tot >= gekeurd_op)
);
create index keuringen_artikel on public.keuringen (artikel_id, gekeurd_op desc);
