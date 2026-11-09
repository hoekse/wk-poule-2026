// Alle databaseaanroepen van de scan-app op één plek.
import {
  leesbareFout,
  type ArtikelOverzicht,
  type Beweging,
  type Onderweg,
  type Project,
  type RegistratieRegel,
  type Verfproduct,
  type Voertuig,
  type Zone,
} from '@loods/shared';
import { supabase } from './supabase';

/** Gooit een leesbare fout als Supabase een fout teruggeeft. */
export function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw new Error(leesbareFout(res.error));
  return res.data as T;
}

/** Maakt een gescande of getypte code schoon: spaties weg, hoofdletters. */
export function normaliseerCode(code: string): string {
  return code.trim().replace(/\s+/g, '').toUpperCase();
}

/** Zoekt een artikel op QR-code of EAN (streepjescode). */
export async function zoekArtikel(code: string): Promise<ArtikelOverzicht | null> {
  const c = normaliseerCode(code);
  if (!c) return null;
  const kolom = /^[0-9]{8,14}$/.test(c) ? 'ean' : 'qr_code';
  const data = check(
    await supabase.from('artikel_overzicht').select('*').eq(kolom, c).limit(1).maybeSingle<ArtikelOverzicht>(),
  );
  return data ?? null;
}

export async function haalArtikel(id: string): Promise<ArtikelOverzicht | null> {
  return check(await supabase.from('artikel_overzicht').select('*').eq('id', id).maybeSingle<ArtikelOverzicht>());
}

export async function haalOnderweg(filter: { houderId?: string; artikelId?: string } = {}): Promise<Onderweg[]> {
  let q = supabase.from('onderweg').select('*');
  if (filter.houderId) q = q.eq('houder_id', filter.houderId);
  if (filter.artikelId) q = q.eq('artikel_id', filter.artikelId);
  return check(await q.order('sinds', { ascending: false })) as Onderweg[];
}

export async function registreer(regels: RegistratieRegel[]): Promise<Beweging[]> {
  return check(await supabase.rpc('registreer', { p_regels: regels })) as Beweging[];
}

export async function haalProjecten(): Promise<Project[]> {
  return check(await supabase.from('projecten').select('*').eq('actief', true).order('naam')) as Project[];
}

/** Project-id's die deze medewerker het laatst gebruikte (nieuwste eerst). */
export async function recenteProjecten(medewerkerId: string): Promise<string[]> {
  const rijen = check(
    await supabase
      .from('bewegingen')
      .select('project_id')
      .eq('medewerker_id', medewerkerId)
      .not('project_id', 'is', null)
      .order('tijdstip', { ascending: false })
      .limit(100),
  ) as { project_id: string }[];
  return [...new Set(rijen.map((r) => r.project_id))];
}

export async function nieuwProject(naam: string): Promise<Project> {
  return check(await supabase.from('projecten').insert({ naam: naam.trim() }).select().single<Project>());
}

export async function haalVoertuigen(): Promise<Voertuig[]> {
  return check(await supabase.from('voertuigen').select('*').eq('actief', true).order('naam')) as Voertuig[];
}

/** Bus die deze medewerker het laatst gebruikte. */
export async function laatsteVoertuig(medewerkerId: string): Promise<string | null> {
  const rij = check(
    await supabase
      .from('bewegingen')
      .select('voertuig_id')
      .eq('medewerker_id', medewerkerId)
      .not('voertuig_id', 'is', null)
      .order('tijdstip', { ascending: false })
      .limit(1)
      .maybeSingle<{ voertuig_id: string }>(),
  );
  return rij?.voertuig_id ?? null;
}

export async function haalZones(): Promise<Zone[]> {
  return check(await supabase.from('zones').select('*').order('volgorde').order('code')) as Zone[];
}

export async function zoekVerfproduct(ean: string): Promise<Verfproduct | null> {
  return check(await supabase.from('verfproducten').select('*').eq('ean', ean).maybeSingle<Verfproduct>());
}

/** Aantal dingen dat deze medewerker nu mee heeft (voor het startscherm). */
export async function telMijnSpullen(medewerkerId: string): Promise<number> {
  const rijen = await haalOnderweg({ houderId: medewerkerId });
  return rijen.length;
}
