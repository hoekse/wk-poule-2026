-- Wallstories Kids – bestellingen en aanvragen
-- Toegang uitsluitend via de server (service role). RLS staat aan zonder publieke policies.

create table if not exists public.bestellingen (
  id                 uuid primary key default gen_random_uuid(),
  bestelnummer       text not null unique,
  token              uuid not null,
  status             text not null default 'open' check (status in ('open', 'betaald', 'mislukt', 'geannuleerd', 'verlopen', 'terugbetaald')),
  productie_status   text not null default 'nieuw' check (productie_status in ('nieuw', 'proef_verstuurd', 'proef_akkoord', 'in_productie', 'verzonden', 'afgerond')),
  email              text not null,
  klant              jsonb not null,
  regels             jsonb not null,
  subtotaal_cent     integer not null check (subtotaal_cent >= 0),
  verzendkosten_cent integer not null check (verzendkosten_cent >= 0),
  totaal_cent        integer not null check (totaal_cent >= 0),
  bevat_maatwerk     boolean not null default false,
  akkoord_voorwaarden boolean not null default false,
  akkoord_maatwerk   boolean not null default false,
  mollie_id          text unique,
  track_trace        text,
  notities           text,
  betaald_op         timestamptz,
  aangemaakt_op      timestamptz not null default now(),
  bijgewerkt_op      timestamptz not null default now()
);
create index if not exists bestellingen_status_idx on public.bestellingen (status, productie_status);
create index if not exists bestellingen_email_idx on public.bestellingen (email);

create table if not exists public.aanvragen (
  id            uuid primary key default gen_random_uuid(),
  soort         text not null check (soort in ('contact', 'op-maat', 'zakelijk', 'aanbrengen')),
  naam          text not null,
  email         text not null,
  telefoon      text,
  organisatie   text,
  muurmaat      text,
  plaats        text,
  bericht       text not null,
  afgehandeld   boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

create or replace function public.ws_bijgewerkt() returns trigger language plpgsql set search_path = '' as $$
begin new.bijgewerkt_op = now(); return new; end; $$;
drop trigger if exists bestellingen_bijgewerkt on public.bestellingen;
create trigger bestellingen_bijgewerkt before update on public.bestellingen for each row execute function public.ws_bijgewerkt();

alter table public.bestellingen enable row level security;
alter table public.aanvragen enable row level security;
-- Bewust géén policies: anon/authenticated hebben geen toegang; de server gebruikt de service-role-sleutel.
revoke all on public.bestellingen, public.aanvragen from anon, authenticated;
