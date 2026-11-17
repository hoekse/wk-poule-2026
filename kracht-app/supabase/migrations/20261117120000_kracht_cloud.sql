-- Kracht: cloud-back-up, synchronisatie tussen apparaten en een inbox voor Apple Health.
-- Tabellen hebben het voorvoegsel kracht_, zodat ze ook naast andere apps in één Supabase-project passen.

-- De hele app-staat per gebruiker (JSON, zonder foto's).
create table if not exists public.kracht_staat (
  gebruiker  uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null,
  bijgewerkt timestamptz not null default now()
);

-- Sleutels waarmee de iOS-opdracht of Health Auto Export gegevens mag afleveren (geheim, per gebruiker).
create table if not exists public.kracht_sleutels (
  sleutel    text primary key check (length(sleutel) >= 32),
  gebruiker  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  aangemaakt timestamptz not null default now()
);

-- Binnengekomen gezondheidsgegevens; de app verwerkt ze bij de volgende synchronisatie en ruimt ze op.
create table if not exists public.kracht_inbox (
  id        bigint generated always as identity primary key,
  gebruiker uuid not null references auth.users (id) on delete cascade,
  ontvangen timestamptz not null default now(),
  bron      text not null default 'apple' check (bron in ('apple', 'hae')),
  data      jsonb not null check (pg_column_size(data) < 1048576)
);
create index if not exists kracht_inbox_gebruiker_ontvangen on public.kracht_inbox (gebruiker, ontvangen);

alter table public.kracht_staat enable row level security;
alter table public.kracht_sleutels enable row level security;
alter table public.kracht_inbox enable row level security;

revoke all on public.kracht_staat, public.kracht_sleutels, public.kracht_inbox from anon;
grant select, insert, update, delete on public.kracht_staat to authenticated;
grant select, insert, delete on public.kracht_sleutels to authenticated;
grant select, delete on public.kracht_inbox to authenticated;

drop policy if exists kracht_staat_eigen on public.kracht_staat;
create policy kracht_staat_eigen on public.kracht_staat for all to authenticated
  using (gebruiker = (select auth.uid())) with check (gebruiker = (select auth.uid()));

drop policy if exists kracht_sleutels_eigen on public.kracht_sleutels;
create policy kracht_sleutels_eigen on public.kracht_sleutels for all to authenticated
  using (gebruiker = (select auth.uid())) with check (gebruiker = (select auth.uid()));

drop policy if exists kracht_inbox_lezen on public.kracht_inbox;
create policy kracht_inbox_lezen on public.kracht_inbox for select to authenticated
  using (gebruiker = (select auth.uid()));

drop policy if exists kracht_inbox_opruimen on public.kracht_inbox;
create policy kracht_inbox_opruimen on public.kracht_inbox for delete to authenticated
  using (gebruiker = (select auth.uid()));

-- Aflevering met een sleutel: zonder geldige sleutel komt er niets in.
-- Aangeroepen door de edge function kracht-health (of rechtstreeks via /rest/v1/rpc).
create or replace function public.kracht_inbox_toevoegen(p_sleutel text, p_data jsonb, p_bron text default 'apple')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gebruiker uuid;
begin
  select gebruiker into v_gebruiker from public.kracht_sleutels where sleutel = p_sleutel;
  if v_gebruiker is null then
    raise exception 'onbekende sleutel' using errcode = '28000';
  end if;
  -- Maximaal 500 onverwerkte berichten per gebruiker, tegen volschrijven.
  if (select count(*) from public.kracht_inbox where gebruiker = v_gebruiker) >= 500 then
    raise exception 'inbox vol' using errcode = '54000';
  end if;
  insert into public.kracht_inbox (gebruiker, bron, data)
  values (v_gebruiker, case when p_bron = 'hae' then 'hae' else 'apple' end, p_data);
end;
$$;

revoke all on function public.kracht_inbox_toevoegen(text, jsonb, text) from public;
grant execute on function public.kracht_inbox_toevoegen(text, jsonb, text) to anon, authenticated;
