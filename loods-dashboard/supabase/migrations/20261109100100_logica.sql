-- =====================================================================
-- Loods Dashboard Hoeksema – logica: hulpfuncties, views, triggers, RPC's
-- =====================================================================

-- ---------------------------------------------------------------------
-- Wie is er ingelogd?
-- ---------------------------------------------------------------------
create or replace function public.huidige_medewerker_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select m.id from public.medewerkers m
  where m.auth_user_id = auth.uid() and m.actief
$$;
comment on function public.huidige_medewerker_id() is 'Id van de actieve medewerker achter de huidige login, anders null.';

create or replace function public.is_medewerker()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.medewerkers m
    where m.auth_user_id = auth.uid() and m.actief
  )
$$;

create or replace function public.is_beheerder()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.medewerkers m
    where m.auth_user_id = auth.uid() and m.actief and m.rol = 'beheerder'
  )
$$;

-- True als de huidige aanroep via de API komt (app), false voor de server
-- zelf (SQL-editor, migraties, seed, service-sleutel).
create or replace function public.via_app()
returns boolean
language sql stable set search_path = ''
as $$
  select current_user in ('authenticated', 'anon')
$$;

-- Koppelt de login aan de medewerker met hetzelfde e-mailadres (eenmalig)
-- en geeft de medewerker terug. Leeg als het e-mailadres niet bekend is.
create or replace function public.koppel_mij()
returns setof public.medewerkers
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_uid is null then
    return;
  end if;

  if not exists (select 1 from public.medewerkers where auth_user_id = v_uid) and v_email <> '' then
    update public.medewerkers
       set auth_user_id = v_uid
     where lower(email) = v_email
       and auth_user_id is null;
  end if;

  return query select * from public.medewerkers where auth_user_id = v_uid;
end
$$;
comment on function public.koppel_mij() is 'Na het inloggen aanroepen: koppelt de login via het e-mailadres aan een medewerker.';

-- ---------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------

-- Wat is er buiten de loods: per artikel en per houder.
create or replace view public.onderweg
with (security_invoker = true)
as
with d as (
  select b.id, b.artikel_id, b.houder_id, b.tijdstip, b.type, b.voertuig_id, b.project_id,
         case b.type
           when 'mee' then b.aantal
           when 'terug' then -b.aantal
           when 'correctie' then b.aantal
           else 0
         end as delta
  from public.bewegingen b
  where b.houder_id is not null
),
s as (
  select d.*,
         sum(d.delta) over (partition by d.artikel_id, d.houder_id order by d.tijdstip, d.id) as saldo
  from d
),
agg as (
  select s.artikel_id,
         s.houder_id,
         (array_agg(s.saldo order by s.tijdstip desc, s.id desc))[1]::int as aantal,
         max(s.tijdstip) filter (where s.saldo > 0 and s.saldo - s.delta <= 0) as sinds,
         (array_agg(s.voertuig_id order by s.tijdstip desc, s.id desc) filter (where s.type = 'mee'))[1] as voertuig_id,
         (array_agg(s.project_id order by s.tijdstip desc, s.id desc) filter (where s.type = 'mee'))[1] as project_id,
         max(s.tijdstip) as laatste_beweging
  from s
  group by s.artikel_id, s.houder_id
)
select agg.artikel_id,
       agg.houder_id,
       agg.aantal,
       agg.sinds,
       agg.voertuig_id,
       agg.project_id,
       agg.laatste_beweging,
       ((now() at time zone 'Europe/Amsterdam')::date - (agg.sinds at time zone 'Europe/Amsterdam')::date) as dagen_weg,
       a.naam      as artikel_naam,
       a.qr_code,
       a.categorie,
       a.telwijze,
       a.eenheid,
       a.zone_id,
       z.code      as zone_code,
       m.naam      as houder_naam,
       m.kleur     as houder_kleur,
       v.naam      as voertuig_naam,
       p.naam      as project_naam
from agg
join public.artikelen a on a.id = agg.artikel_id
join public.medewerkers m on m.id = agg.houder_id
left join public.zones z on z.id = a.zone_id
left join public.voertuigen v on v.id = agg.voertuig_id
left join public.projecten p on p.id = agg.project_id
where agg.aantal > 0;
comment on view public.onderweg is 'Per artikel en houder wat er buiten de loods is, in welke bus, voor welk project en sinds wanneer.';

-- Stand per artikel: totaal, onderweg, aanwezig, minimum en keuring.
create or replace view public.artikel_overzicht
with (security_invoker = true)
as
with o as (
  select artikel_id, sum(aantal)::int as onderweg
  from public.onderweg
  group by artikel_id
),
basis as (
  select a.*,
         z.code as zone_code,
         z.naam as zone_naam,
         case when a.telwijze = 'per_stuk' then 1 else coalesce(v.aantal_totaal, 0) end as totaal,
         coalesce(o.onderweg, 0) as onderweg,
         k.gekeurd_op as laatste_keuring,
         k.geldig_tot as keuring_geldig_tot
  from public.artikelen a
  left join public.zones z on z.id = a.zone_id
  left join public.voorraad v on v.artikel_id = a.id
  left join o on o.artikel_id = a.id
  left join lateral (
    select kk.gekeurd_op, kk.geldig_tot
    from public.keuringen kk
    where kk.artikel_id = a.id
    order by kk.gekeurd_op desc, kk.ingevoerd_op desc
    limit 1
  ) k on true
)
select basis.*,
       (basis.totaal - basis.onderweg) as aanwezig,
       (basis.minimum_voorraad is not null and (basis.totaal - basis.onderweg) < basis.minimum_voorraad) as onder_minimum,
       case
         when not basis.keuring_verplicht then null
         when basis.keuring_geldig_tot is null then 'onbekend'
         when basis.keuring_geldig_tot < current_date then 'verlopen'
         when basis.keuring_geldig_tot < current_date + 30 then 'verloopt'
         else 'geldig'
       end as keuring_status
from basis;
comment on view public.artikel_overzicht is 'Stand per artikel: totaal, onderweg, aanwezig, onder minimum en keuringsstatus.';

-- Leesbare historie voor het beheerscherm.
create or replace view public.beweging_log
with (security_invoker = true)
as
select b.*,
       a.naam    as artikel_naam,
       a.qr_code,
       a.telwijze,
       a.eenheid,
       m.naam    as medewerker_naam,
       h.naam    as houder_naam,
       v.naam    as voertuig_naam,
       p.naam    as project_naam
from public.bewegingen b
join public.artikelen a on a.id = b.artikel_id
join public.medewerkers m on m.id = b.medewerker_id
left join public.medewerkers h on h.id = b.houder_id
left join public.voertuigen v on v.id = b.voertuig_id
left join public.projecten p on p.id = b.project_id;

-- ---------------------------------------------------------------------
-- Saldo: hoeveel staat er van een artikel op naam van een houder?
-- ---------------------------------------------------------------------
create or replace function public.saldo(p_artikel uuid, p_houder uuid)
returns int
language sql stable set search_path = ''
as $$
  select coalesce(sum(case b.type
                        when 'mee' then b.aantal
                        when 'terug' then -b.aantal
                        when 'correctie' then b.aantal
                        else 0
                      end), 0)::int
  from public.bewegingen b
  where b.artikel_id = p_artikel and b.houder_id = p_houder
$$;

-- ---------------------------------------------------------------------
-- Artikelen: QR-code automatisch, voorraadregel aanmaken
-- ---------------------------------------------------------------------
create or replace function public.artikel_voor_opslaan()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_prefix text;
  v_nr     int;
begin
  new.bijgewerkt_op := now();
  new.ean := nullif(regexp_replace(coalesce(new.ean, ''), '\s', '', 'g'), '');

  if new.qr_code is null or trim(new.qr_code) = '' then
    v_prefix := case new.categorie
                  when 'steiger' then 'ST'
                  when 'ladder' then 'LA'
                  when 'gereedschap' then 'GE'
                  when 'verf' then 'VF'
                  else 'VB'
                end;
    select coalesce(max(substring(a.qr_code from '-([0-9]+)$')::int), 0) + 1
      into v_nr
      from public.artikelen a
     where a.qr_code ~ ('^' || v_prefix || '-[0-9]+$');
    new.qr_code := v_prefix || '-' || lpad(v_nr::text, 3, '0');
  else
    new.qr_code := upper(trim(new.qr_code));
  end if;

  if tg_op = 'UPDATE' and new.telwijze <> old.telwijze
     and exists (select 1 from public.bewegingen b where b.artikel_id = new.id) then
    raise exception 'De telwijze van "%" kan niet meer worden gewijzigd: er zijn al bewegingen.', new.naam;
  end if;

  return new;
end
$$;

create trigger artikel_voor_opslaan
before insert or update on public.artikelen
for each row execute function public.artikel_voor_opslaan();

create or replace function public.artikel_na_opslaan()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.telwijze = 'aantal' then
    insert into public.voorraad (artikel_id) values (new.id)
    on conflict (artikel_id) do nothing;
  end if;
  return null;
end
$$;

create trigger artikel_na_opslaan
after insert or update of telwijze on public.artikelen
for each row execute function public.artikel_na_opslaan();

-- ---------------------------------------------------------------------
-- Bewegingen: server zet naam en tijd, controles, voorraad bijwerken
-- ---------------------------------------------------------------------
create or replace function public.beweging_voor_invoer()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_me        uuid;
  v_beheerder boolean := false;
  v_artikel   public.artikelen;
  v_saldo     int;
  v_naam      text;
begin
  select * into v_artikel from public.artikelen where id = new.artikel_id;
  if not found then
    raise exception 'Onbekend artikel.';
  end if;

  if public.via_app() then
    v_me := public.huidige_medewerker_id();
    if v_me is null then
      raise exception 'Je login is niet gekoppeld aan een actieve medewerker.';
    end if;
    v_beheerder := public.is_beheerder();
    new.medewerker_id := v_me;   -- altijd de ingelogde persoon
    new.tijdstip := now();       -- altijd de servertijd
    if new.type = 'correctie' and not v_beheerder then
      raise exception 'Alleen de beheerder kan correcties maken.';
    end if;
    if new.type = 'mee' and not v_beheerder then
      new.houder_id := v_me;     -- meenemen gaat altijd op eigen naam
    end if;
  else
    if new.medewerker_id is null then
      raise exception 'medewerker_id is verplicht bij invoer door de server.';
    end if;
    new.tijdstip := coalesce(new.tijdstip, now());
  end if;

  if new.type in ('mee', 'terug') and new.houder_id is null then
    new.houder_id := new.medewerker_id;
  end if;
  if new.type = 'verbruikt' then
    new.houder_id := null;
  end if;

  if not v_artikel.actief and new.type in ('mee', 'verbruikt') then
    raise exception '"%" is niet meer actief.', v_artikel.naam;
  end if;

  if new.type = 'verbruikt' and v_artikel.telwijze <> 'aantal' then
    raise exception '"%" wordt per stuk geteld en kan niet als verbruik worden geboekt.', v_artikel.naam;
  end if;

  if v_artikel.telwijze = 'per_stuk' and new.type in ('mee', 'terug') and new.aantal <> 1 then
    raise exception '"%" heeft een eigen nummer: het aantal is altijd 1.', v_artikel.naam;
  end if;

  if new.type = 'correctie' and new.houder_id is null and v_artikel.telwijze <> 'aantal' then
    raise exception 'Een voorraadcorrectie kan alleen bij artikelen die in aantallen worden geteld.';
  end if;

  if new.type = 'mee' and v_artikel.telwijze = 'per_stuk' then
    select o.houder_naam into v_naam
      from public.onderweg o
     where o.artikel_id = new.artikel_id
     limit 1;
    if found then
      raise exception '"%" staat al op naam van %.', v_artikel.naam, v_naam;
    end if;
  end if;

  if new.type = 'terug' or (new.type = 'correctie' and new.houder_id is not null) then
    v_saldo := public.saldo(new.artikel_id, new.houder_id);
    select m.naam into v_naam from public.medewerkers m where m.id = new.houder_id;
    if new.type = 'terug' and new.aantal > v_saldo then
      if v_saldo <= 0 then
        raise exception '"%" staat niet op naam van %.', v_artikel.naam, v_naam;
      else
        raise exception 'Er staan maar % van "%" op naam van %.', v_saldo, v_artikel.naam, v_naam;
      end if;
    end if;
    if new.type = 'correctie' and v_saldo + new.aantal < 0 then
      raise exception 'Deze correctie maakt het aantal bij % negatief (nu %).', v_naam, v_saldo;
    end if;
    if new.type = 'correctie' and v_artikel.telwijze = 'per_stuk' and new.aantal > 0
       and exists (select 1 from public.onderweg o where o.artikel_id = new.artikel_id) then
      raise exception '"%" staat al bij iemand onderweg.', v_artikel.naam;
    end if;
  end if;

  new.opmerking := nullif(trim(coalesce(new.opmerking, '')), '');
  return new;
end
$$;

create trigger beweging_voor_invoer
before insert on public.bewegingen
for each row execute function public.beweging_voor_invoer();

create or replace function public.beweging_na_invoer()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.type = 'verbruikt' or (new.type = 'correctie' and new.houder_id is null) then
    insert into public.voorraad as v (artikel_id, aantal_totaal, bijgewerkt_op)
    values (new.artikel_id,
            case when new.type = 'verbruikt' then -new.aantal else new.aantal end,
            now())
    on conflict (artikel_id) do update
      set aantal_totaal = v.aantal_totaal + excluded.aantal_totaal,
          bijgewerkt_op = now();
  end if;
  return null;
end
$$;

create trigger beweging_na_invoer
after insert on public.bewegingen
for each row execute function public.beweging_na_invoer();

create or replace function public.beweging_onveranderlijk()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  raise exception 'Bewegingen kunnen niet worden gewijzigd of verwijderd. Maak een correctie.';
end
$$;

create trigger beweging_onveranderlijk
before update or delete on public.bewegingen
for each row execute function public.beweging_onveranderlijk();

create trigger beweging_geen_truncate
before truncate on public.bewegingen
for each statement execute function public.beweging_onveranderlijk();

-- ---------------------------------------------------------------------
-- Winkelmand registreren (één transactie)
-- p_regels: [{artikel_id, type, aantal, houder_id?, voertuig_id?, project_id?, opmerking?}, ...]
-- Wie iets per stuk meeneemt dat nog op naam van een ander staat, zet het
-- automatisch over (met een terug-regel voor de vorige houder).
-- ---------------------------------------------------------------------
create or replace function public.registreer(p_regels jsonb)
returns setof public.bewegingen
language plpgsql set search_path = ''
as $$
declare
  v_batch   uuid := gen_random_uuid();
  v_me      uuid := public.huidige_medewerker_id();
  v_me_naam text;
  v_regel   jsonb;
  v_artikel public.artikelen;
  v_houder  uuid;
  v_ander   record;
  v_rij     public.bewegingen;
begin
  if public.via_app() and v_me is null then
    raise exception 'Je login is niet gekoppeld aan een actieve medewerker.';
  end if;
  if p_regels is null or jsonb_typeof(p_regels) <> 'array' or jsonb_array_length(p_regels) = 0 then
    raise exception 'Er is niets om te registreren.';
  end if;

  select m.naam into v_me_naam from public.medewerkers m where m.id = v_me;

  for v_regel in select value from jsonb_array_elements(p_regels) loop
    select * into v_artikel from public.artikelen where id = nullif(v_regel ->> 'artikel_id', '')::uuid;
    if not found then
      raise exception 'Onbekend artikel in de winkelmand.';
    end if;

    v_houder := coalesce(nullif(v_regel ->> 'houder_id', '')::uuid, v_me);

    if v_regel ->> 'type' = 'mee' and v_artikel.telwijze = 'per_stuk' then
      for v_ander in
        select o.houder_id, o.houder_naam, o.aantal from public.onderweg o where o.artikel_id = v_artikel.id
      loop
        if v_ander.houder_id = v_houder then
          raise exception 'Je hebt "%" al mee.', v_artikel.naam;
        end if;
        insert into public.bewegingen (artikel_id, type, aantal, medewerker_id, houder_id, opmerking, batch_id)
        values (v_artikel.id, 'terug', v_ander.aantal, v_me, v_ander.houder_id,
                'Automatisch teruggezet: opnieuw meegenomen door ' || coalesce(v_me_naam, 'onbekend'),
                v_batch)
        returning * into v_rij;
        return next v_rij;
      end loop;
    end if;

    insert into public.bewegingen (artikel_id, type, aantal, medewerker_id, houder_id, voertuig_id, project_id, opmerking, batch_id)
    values (v_artikel.id,
            v_regel ->> 'type',
            coalesce(nullif(v_regel ->> 'aantal', '')::int, 1),
            v_me,
            nullif(v_regel ->> 'houder_id', '')::uuid,
            nullif(v_regel ->> 'voertuig_id', '')::uuid,
            nullif(v_regel ->> 'project_id', '')::uuid,
            v_regel ->> 'opmerking',
            v_batch)
    returning * into v_rij;
    return next v_rij;
  end loop;
  return;
end
$$;
comment on function public.registreer(jsonb) is 'Registreert een hele winkelmand in één keer (meenemen, terugbrengen, verbruik, correctie).';

-- ---------------------------------------------------------------------
-- Overige tabellen: server zet naam en tijd
-- ---------------------------------------------------------------------
create or replace function public.projecten_voor_invoer()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if public.via_app() then
    new.aangemaakt_door := public.huidige_medewerker_id();
    new.aangemaakt_op := now();
  end if;
  new.naam := trim(new.naam);
  return new;
end
$$;

create trigger projecten_voor_invoer
before insert on public.projecten
for each row execute function public.projecten_voor_invoer();

create or replace function public.verfproduct_voor_opslaan()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.bijgewerkt_op := now();
  if tg_op = 'INSERT' and public.via_app() then
    new.aangemaakt_door := public.huidige_medewerker_id();
    new.aangemaakt_op := now();
  end if;
  return new;
end
$$;

create trigger verfproduct_voor_opslaan
before insert or update on public.verfproducten
for each row execute function public.verfproduct_voor_opslaan();

create or replace function public.verfrestant_voor_opslaan()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.ean := nullif(regexp_replace(coalesce(new.ean, ''), '\s', '', 'g'), '');
  new.kleurcode := nullif(trim(coalesce(new.kleurcode, '')), '');
  if tg_op = 'INSERT' then
    if public.via_app() then
      new.ingevoerd_door := public.huidige_medewerker_id();
      new.ingevoerd_op := now();
    end if;
  else
    new.ingevoerd_door := old.ingevoerd_door;
    new.ingevoerd_op := old.ingevoerd_op;
    if new.status is distinct from old.status then
      new.status_gewijzigd_door := case when public.via_app() then public.huidige_medewerker_id() else new.status_gewijzigd_door end;
      new.status_gewijzigd_op := now();
    end if;
  end if;
  return new;
end
$$;

create trigger verfrestant_voor_opslaan
before insert or update on public.verfrestanten
for each row execute function public.verfrestant_voor_opslaan();

create or replace function public.keuring_voor_invoer()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  v_interval int;
begin
  if new.geldig_tot is null then
    select a.keuring_interval_maanden into v_interval from public.artikelen a where a.id = new.artikel_id;
    if v_interval is not null then
      new.geldig_tot := (new.gekeurd_op + make_interval(months => v_interval))::date;
    end if;
  end if;
  if public.via_app() then
    new.ingevoerd_door := public.huidige_medewerker_id();
    new.ingevoerd_op := now();
  end if;
  return new;
end
$$;

create trigger keuring_voor_invoer
before insert on public.keuringen
for each row execute function public.keuring_voor_invoer();

create or replace function public.zone_voor_opslaan()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.code := upper(trim(new.code));
  new.bijgewerkt_op := now();
  return new;
end
$$;

create trigger zone_voor_opslaan
before insert or update on public.zones
for each row execute function public.zone_voor_opslaan();

-- Er moet altijd minstens één actieve beheerder overblijven.
create or replace function public.medewerker_na_wijzigen()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.medewerkers where rol = 'beheerder' and actief) then
    raise exception 'Er moet minstens één actieve beheerder overblijven.';
  end if;
  return null;
end
$$;

create trigger medewerker_na_wijzigen
after update of rol, actief on public.medewerkers
for each row
when (old.rol = 'beheerder' and old.actief)
execute function public.medewerker_na_wijzigen();

create or replace function public.medewerker_voor_opslaan()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.naam := trim(new.naam);
  new.email := nullif(lower(trim(coalesce(new.email, ''))), '');
  -- Als het e-mailadres verandert, moet de login opnieuw gekoppeld worden.
  if tg_op = 'UPDATE' and new.email is distinct from old.email then
    new.auth_user_id := null;
  end if;
  return new;
end
$$;

create trigger medewerker_voor_opslaan
before insert or update on public.medewerkers
for each row execute function public.medewerker_voor_opslaan();
