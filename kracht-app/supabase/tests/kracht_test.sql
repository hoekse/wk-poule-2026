-- Tests voor de beveiliging (RLS) en de inbox. Draait op een lokale Postgres met stubs.
\set ON_ERROR_STOP 1
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'dennis@voorbeeld.nl'),
  ('22222222-2222-2222-2222-222222222222', 'ander@voorbeeld.nl');

-- Dennis bewaart zijn staat en maakt een sleutel.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', false);
insert into public.kracht_staat (data) values ('{"versie":1}');
insert into public.kracht_sleutels (sleutel) values ('sleutel-van-dennis-0123456789abcdef0123');
update public.kracht_staat set data = '{"versie":1,"x":2}';
do $$ begin
  if (select count(*) from public.kracht_staat) <> 1 then raise exception 'Dennis ziet zijn staat niet'; end if;
end $$;

-- Een te korte sleutel mag niet.
do $$ begin
  begin
    insert into public.kracht_sleutels (sleutel) values ('kort');
    raise exception 'korte sleutel werd geaccepteerd';
  exception when check_violation then null;
  end;
end $$;

-- Een andere gebruiker ziet niets en kan niets aanpassen.
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', false);
do $$ begin
  if (select count(*) from public.kracht_staat) <> 0 then raise exception 'ander ziet staat van Dennis'; end if;
  if (select count(*) from public.kracht_sleutels) <> 0 then raise exception 'ander ziet sleutel van Dennis'; end if;
  update public.kracht_staat set data = '{}';
  delete from public.kracht_sleutels;
end $$;
do $$ begin
  begin
    insert into public.kracht_staat (gebruiker, data) values ('11111111-1111-1111-1111-111111111111', '{}');
    raise exception 'ander kon staat voor Dennis schrijven';
  exception when insufficient_privilege or unique_violation then null;
  end;
end $$;

-- Anoniem (de iOS-opdracht via de functie): alleen met een geldige sleutel.
reset role;
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select public.kracht_inbox_toevoegen('sleutel-van-dennis-0123456789abcdef0123', '{"slaap":"7,2","hrv":"45"}', 'apple');
do $$ begin
  begin
    perform public.kracht_inbox_toevoegen('verkeerde-sleutel-0123456789abcdef012345', '{}', 'apple');
    raise exception 'verkeerde sleutel werd geaccepteerd';
  exception when sqlstate '28000' then null;
  end;
  begin
    perform count(*) from public.kracht_inbox;
    raise exception 'anoniem kon de inbox lezen';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Dennis ziet het bericht in zijn inbox en ruimt het op; de ander niet.
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', false);
do $$ begin
  if (select count(*) from public.kracht_inbox) <> 0 then raise exception 'ander ziet inbox van Dennis'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', false);
do $$ begin
  if (select count(*) from public.kracht_inbox where bron = 'apple' and data->>'hrv' = '45') <> 1 then raise exception 'bericht niet in inbox'; end if;
  delete from public.kracht_inbox;
  if (select count(*) from public.kracht_inbox) <> 0 then raise exception 'opruimen mislukt'; end if;
end $$;
reset role;
\echo 'Alle databasetests geslaagd.'
