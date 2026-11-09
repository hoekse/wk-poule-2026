-- =====================================================================
-- Triggerfuncties hoeven niet via de API (/rest/v1/rpc/...) aanroepbaar te
-- zijn. Triggers blijven gewoon werken: PostgreSQL controleert het
-- EXECUTE-recht alleen bij het aanmaken van de trigger.
-- (Supabase-beveiligingscontrole 0029.)
-- =====================================================================
revoke execute on function
  public.artikel_voor_opslaan(),
  public.artikel_na_opslaan(),
  public.beweging_voor_invoer(),
  public.beweging_na_invoer(),
  public.beweging_onveranderlijk(),
  public.projecten_voor_invoer(),
  public.verfproduct_voor_opslaan(),
  public.verfrestant_voor_opslaan(),
  public.keuring_voor_invoer(),
  public.zone_voor_opslaan(),
  public.medewerker_na_wijzigen(),
  public.medewerker_voor_opslaan()
from public, anon, authenticated;
