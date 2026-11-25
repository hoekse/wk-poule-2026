/*
 * Narrowcasting Hoeksema Schilderwerken — verbinding met de database
 *
 * De inhoud van het scherm (slides, lopende tekst, mededelingen, instellingen)
 * staat in Supabase, in de tabellen `narrowcasting_slides` en
 * `narrowcasting_instellingen`. Claude past die tabellen aan; het scherm
 * haalt elke ~30 seconden de nieuwste versie op.
 *
 * De "publishable key" hieronder is bedoeld om openbaar te zijn: de database
 * staat voor deze sleutel alleen LEZEN toe (zie supabase/01_schema.sql).
 */
window.NARROWCASTING_CONFIG = {
  supabaseUrl: 'https://gkxcnbyialssruvhuiyn.supabase.co',
  supabaseKey: 'sb_publishable_8PQM6fi3o1GHQtEpm2abgg_UnPIt1rT',

  // Optioneel: vaste schermnaam (kan ook via de adresbalk: ?scherm=werkplaats)
  scherm: ''
};
