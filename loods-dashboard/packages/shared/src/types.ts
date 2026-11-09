// Types die overeenkomen met de Supabase-tabellen en -views (zie /supabase/migrations).

export type Rol = 'beheerder' | 'medewerker';
export type Categorie = 'steiger' | 'ladder' | 'gereedschap' | 'verf' | 'verbruik';
export type Telwijze = 'per_stuk' | 'aantal';
export type BewegingType = 'mee' | 'terug' | 'correctie' | 'verbruikt';
export type VerfBasis = 'synthetisch' | 'watergedragen';
export type Vulling = 'vol' | '3/4' | '1/2' | '1/4';
export type VerfStatus = 'aanwezig' | 'gebruikt' | 'afgevoerd';
export type KeuringStatus = 'geldig' | 'verloopt' | 'verlopen' | 'onbekend';

export interface Voertuig {
  id: string;
  naam: string;
  kenteken: string | null;
  actief: boolean;
  aangemaakt_op: string;
}

export interface Medewerker {
  id: string;
  naam: string;
  email: string | null;
  rol: Rol;
  actief: boolean;
  standaard_voertuig_id: string | null;
  kleur: string;
  auth_user_id: string | null;
  aangemaakt_op: string;
}

export interface Project {
  id: string;
  naam: string;
  adres: string | null;
  actief: boolean;
  aangemaakt_door: string | null;
  aangemaakt_op: string;
}

export interface Zone {
  id: string;
  code: string;
  naam: string;
  wand: string | null;
  x: number;
  y: number;
  z: number;
  breedte: number;
  diepte: number;
  hoogte: number;
  kleur_override: string | null;
  omschrijving: string | null;
  maat_geschat: boolean;
  heeft_voorraad: boolean;
  volgorde: number;
  bijgewerkt_op: string;
}

export interface Artikel {
  id: string;
  naam: string;
  categorie: Categorie;
  telwijze: Telwijze;
  zone_id: string | null;
  qr_code: string;
  ean: string | null;
  minimum_voorraad: number | null;
  eenheid: string | null;
  keuring_verplicht: boolean;
  keuring_interval_maanden: number | null;
  foto_url: string | null;
  omschrijving: string | null;
  actief: boolean;
  aangemaakt_op: string;
  bijgewerkt_op: string;
}

/** View `artikel_overzicht`: artikel plus stand. */
export interface ArtikelOverzicht extends Artikel {
  zone_code: string | null;
  zone_naam: string | null;
  totaal: number;
  onderweg: number;
  aanwezig: number;
  onder_minimum: boolean;
  laatste_keuring: string | null;
  keuring_geldig_tot: string | null;
  keuring_status: KeuringStatus | null;
}

export interface Beweging {
  id: number;
  artikel_id: string;
  type: BewegingType;
  aantal: number;
  medewerker_id: string;
  houder_id: string | null;
  voertuig_id: string | null;
  project_id: string | null;
  tijdstip: string;
  opmerking: string | null;
  batch_id: string | null;
}

/** View `beweging_log`: beweging met namen erbij. */
export interface BewegingLog extends Beweging {
  artikel_naam: string;
  qr_code: string;
  telwijze: Telwijze;
  eenheid: string | null;
  medewerker_naam: string;
  houder_naam: string | null;
  voertuig_naam: string | null;
  project_naam: string | null;
}

/** View `onderweg`: wat er buiten de loods is, per artikel en houder. */
export interface Onderweg {
  artikel_id: string;
  houder_id: string;
  aantal: number;
  sinds: string;
  voertuig_id: string | null;
  project_id: string | null;
  laatste_beweging: string;
  dagen_weg: number;
  artikel_naam: string;
  qr_code: string;
  categorie: Categorie;
  telwijze: Telwijze;
  eenheid: string | null;
  zone_id: string | null;
  zone_code: string | null;
  houder_naam: string;
  houder_kleur: string;
  voertuig_naam: string | null;
  project_naam: string | null;
}

export interface Voorraad {
  artikel_id: string;
  aantal_totaal: number;
  bijgewerkt_op: string;
}

export interface Verfproduct {
  ean: string;
  merk: string;
  product: string;
  glansgraad: string | null;
  basis: VerfBasis | null;
  inhoud_liter: number | null;
  aangemaakt_door: string | null;
  aangemaakt_op: string;
  bijgewerkt_op: string;
}

export interface Verfrestant {
  id: string;
  ean: string | null;
  merk: string | null;
  product: string | null;
  kleurcode: string | null;
  glansgraad: string | null;
  basis: VerfBasis | null;
  inhoud_liter: number | null;
  vulling: Vulling;
  geopend_op: string | null;
  zone_id: string | null;
  foto_url: string | null;
  opmerking: string | null;
  ingevoerd_door: string;
  ingevoerd_op: string;
  status: VerfStatus;
  status_gewijzigd_door: string | null;
  status_gewijzigd_op: string | null;
}

export interface Keuring {
  id: string;
  artikel_id: string;
  gekeurd_op: string;
  geldig_tot: string | null;
  door: string | null;
  opmerking: string | null;
  ingevoerd_door: string | null;
  ingevoerd_op: string;
}

/** Eén regel voor de RPC `registreer` (winkelmand). */
export interface RegistratieRegel {
  artikel_id: string;
  type: BewegingType;
  aantal: number;
  houder_id?: string | null;
  voertuig_id?: string | null;
  project_id?: string | null;
  opmerking?: string | null;
}
