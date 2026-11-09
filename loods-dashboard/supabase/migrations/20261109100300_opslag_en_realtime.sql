-- =====================================================================
-- Loods Dashboard Hoeksema – foto-opslag en realtime
-- =====================================================================

-- Openbare bucket voor foto's van verfbussen en artikelen (alleen lezen
-- via de link; uploaden alleen door ingelogde medewerkers).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "fotos uploaden door medewerkers" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (select public.is_medewerker()));

-- Realtime voor het tv-dashboard (fase 2): nieuwe bewegingen en verfrestanten.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bewegingen') then
      alter publication supabase_realtime add table public.bewegingen;
    end if;
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'verfrestanten') then
      alter publication supabase_realtime add table public.verfrestanten;
    end if;
  end if;
end
$$;
