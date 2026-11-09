// Beheer van medewerkers, bussen en projecten. Nooit verwijderen, alleen deactiveren (historie blijft).
import { useState } from 'react';
import { kleuren, type Medewerker, type Project, type Rol, type Voertuig } from '@loods/shared';
import { check } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useSessie } from '../../lib/sessie';
import { useLaden } from '../../lib/useLaden';
import { useMelding } from '../../components/Meldingen';
import { Avatar, Blad, Fout, Kop, Laden } from '../../components/Basis';
import { IcoonPlus } from '../../components/Iconen';

const AVATARKLEUREN = [kleuren.blauw, kleuren.groen, kleuren.geel, kleuren.rood, '#7A4FB5', '#E0701B', '#14A3A3', '#646464'];

function useOpslaan(na: () => void) {
  const melding = useMelding();
  const [bezig, setBezig] = useState(false);
  async function opslaan(tabel: string, id: string | null, rij: Record<string, unknown>) {
    setBezig(true);
    try {
      if (id) check(await supabase.from(tabel).update(rij).eq('id', id));
      else check(await supabase.from(tabel).insert(rij));
      melding('ok', 'Opgeslagen');
      na();
      return true;
    } catch (e) {
      melding('fout', e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBezig(false);
    }
  }
  return { bezig, opslaan };
}

// ---------------------------------------------------------------------------
export function Medewerkers() {
  const { medewerker: ik } = useSessie();
  const data = useLaden(async () => {
    const [m, v] = await Promise.all([
      supabase.from('medewerkers').select('*').order('actief', { ascending: false }).order('naam'),
      supabase.from('voertuigen').select('*').eq('actief', true).order('naam'),
    ]);
    return { medewerkers: check(m) as Medewerker[], voertuigen: check(v) as Voertuig[] };
  }, []);
  const [bewerk, setBewerk] = useState<Partial<Medewerker> | null>(null);
  const { bezig, opslaan } = useOpslaan(() => {
    setBewerk(null);
    void data.opnieuw();
  });

  return (
    <>
      <Kop titel="Medewerkers" terugNaar="/beheer" />
      <main className="pagina">
        <button className="knop blauw breed" type="button" onClick={() => setBewerk({ rol: 'medewerker', actief: true, kleur: kleuren.blauw })}>
          <IcoonPlus />
          Medewerker toevoegen
        </button>
        <p className="uitleg">Een nieuwe medewerker logt in met het e-mailadres dat je hier invult. Deactiveren in plaats van verwijderen: de historie blijft bewaard.</p>
        {!data.data ? (
          data.fout ? <Fout tekst={data.fout} opnieuw={data.opnieuw} /> : <Laden />
        ) : (
          <div className="lijst">
            {data.data.medewerkers.map((m) => (
              <button key={m.id} className="regel" type="button" onClick={() => setBewerk(m)} style={m.actief ? undefined : { opacity: 0.55 }}>
                <Avatar naam={m.naam} kleur={m.kleur} />
                <span>
                  <b>{m.naam}</b>
                  <small>{m.email ?? 'Nog geen e-mailadres'}</small>
                  <small>
                    {m.rol === 'beheerder' ? 'Beheerder' : 'Medewerker'}
                    {m.standaard_voertuig_id ? ` · ${data.data!.voertuigen.find((v) => v.id === m.standaard_voertuig_id)?.naam ?? ''}` : ''}
                  </small>
                </span>
                <span className="rechts">
                  {!m.actief ? <span className="label grijs">Inactief</span> : m.auth_user_id ? <span className="label groen">Ingelogd</span> : <span className="label geel">Nog niet</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
      {bewerk && data.data && (
        <Blad titel={bewerk.id ? bewerk.naam ?? 'Medewerker' : 'Nieuwe medewerker'} sluit={() => setBewerk(null)}>
          <form
            className="formulier"
            onSubmit={(e) => {
              e.preventDefault();
              void opslaan('medewerkers', bewerk.id ?? null, {
                naam: bewerk.naam ?? '',
                email: bewerk.email || null,
                rol: bewerk.rol ?? 'medewerker',
                standaard_voertuig_id: bewerk.standaard_voertuig_id || null,
                kleur: bewerk.kleur ?? kleuren.blauw,
                actief: bewerk.actief ?? true,
              });
            }}
          >
            <label className="veld">
              <span>Naam</span>
              <input className="invoer" value={bewerk.naam ?? ''} onChange={(e) => setBewerk({ ...bewerk, naam: e.target.value })} required />
            </label>
            <label className="veld">
              <span>E-mailadres (om in te loggen)</span>
              <input className="invoer" type="email" inputMode="email" value={bewerk.email ?? ''} onChange={(e) => setBewerk({ ...bewerk, email: e.target.value })} />
            </label>
            <div className="chips twee">
              {(['medewerker', 'beheerder'] as Rol[]).map((r) => (
                <button key={r} type="button" className="chip" aria-pressed={(bewerk.rol ?? 'medewerker') === r} onClick={() => setBewerk({ ...bewerk, rol: r })}>
                  {r === 'beheerder' ? 'Beheerder' : 'Medewerker'}
                  <small>{r === 'beheerder' ? 'Mag alles' : 'Scannen en registreren'}</small>
                </button>
              ))}
            </div>
            <label className="veld">
              <span>Standaardbus</span>
              <select className="invoer" value={bewerk.standaard_voertuig_id ?? ''} onChange={(e) => setBewerk({ ...bewerk, standaard_voertuig_id: e.target.value || null })}>
                <option value="">Geen (laatst gebruikte bus)</option>
                {data.data.voertuigen.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.naam} {v.kenteken ? `(${v.kenteken})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <div className="sectie">
              <span className="uitleg">Kleur op de tv</span>
              <div className="chips">
                {AVATARKLEUREN.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="chip"
                    aria-label={`Kleur ${k}`}
                    aria-pressed={bewerk.kleur?.toLowerCase() === k.toLowerCase()}
                    onClick={() => setBewerk({ ...bewerk, kleur: k })}
                    style={{ width: 56, background: k, borderColor: bewerk.kleur?.toLowerCase() === k.toLowerCase() ? '#fff' : 'transparent', borderWidth: 3 }}
                  />
                ))}
              </div>
            </div>
            {bewerk.id && (
              <label className="vinkje">
                <input
                  type="checkbox"
                  checked={bewerk.actief ?? true}
                  disabled={bewerk.id === ik?.id}
                  onChange={(e) => setBewerk({ ...bewerk, actief: e.target.checked })}
                />
                Actief {bewerk.id === ik?.id ? '(jezelf kun je niet deactiveren)' : ''}
              </label>
            )}
            {bewerk.id && bewerk.email && (
              <p className="uitleg">Verander je het e-mailadres, dan moet deze persoon opnieuw inloggen.</p>
            )}
            <button className="knop groen" type="submit" disabled={bezig}>
              {bezig ? 'Bezig…' : 'Opslaan'}
            </button>
          </form>
        </Blad>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
export function Voertuigen() {
  const data = useLaden(async () => check(await supabase.from('voertuigen').select('*').order('actief', { ascending: false }).order('naam')) as Voertuig[], []);
  const [bewerk, setBewerk] = useState<Partial<Voertuig> | null>(null);
  const { bezig, opslaan } = useOpslaan(() => {
    setBewerk(null);
    void data.opnieuw();
  });

  return (
    <>
      <Kop titel="Bussen" terugNaar="/beheer" />
      <main className="pagina">
        <button className="knop blauw breed" type="button" onClick={() => setBewerk({ actief: true })}>
          <IcoonPlus />
          Bus toevoegen
        </button>
        {!data.data ? (
          data.fout ? <Fout tekst={data.fout} opnieuw={data.opnieuw} /> : <Laden />
        ) : (
          <div className="lijst">
            {data.data.map((v) => (
              <button key={v.id} className="regel mand" type="button" onClick={() => setBewerk(v)} style={v.actief ? undefined : { opacity: 0.55 }}>
                <span>
                  <b>{v.naam}</b>
                  <small>{v.kenteken ?? 'Kenteken nog invullen'}</small>
                </span>
                {!v.actief && <span className="label grijs">Inactief</span>}
              </button>
            ))}
          </div>
        )}
      </main>
      {bewerk && (
        <Blad titel={bewerk.id ? bewerk.naam ?? 'Bus' : 'Nieuwe bus'} sluit={() => setBewerk(null)}>
          <form
            className="formulier"
            onSubmit={(e) => {
              e.preventDefault();
              void opslaan('voertuigen', bewerk.id ?? null, {
                naam: (bewerk.naam ?? '').trim(),
                kenteken: (bewerk.kenteken ?? '').trim().toUpperCase() || null,
                actief: bewerk.actief ?? true,
              });
            }}
          >
            <label className="veld">
              <span>Naam</span>
              <input className="invoer" value={bewerk.naam ?? ''} onChange={(e) => setBewerk({ ...bewerk, naam: e.target.value })} placeholder="Bijv. Bus 2 (Transporter)" required />
            </label>
            <label className="veld">
              <span>Kenteken</span>
              <input className="invoer" value={bewerk.kenteken ?? ''} onChange={(e) => setBewerk({ ...bewerk, kenteken: e.target.value })} autoCapitalize="characters" placeholder="V-123-AB" />
            </label>
            {bewerk.id && (
              <label className="vinkje">
                <input type="checkbox" checked={bewerk.actief ?? true} onChange={(e) => setBewerk({ ...bewerk, actief: e.target.checked })} />
                Actief
              </label>
            )}
            <button className="knop groen" type="submit" disabled={bezig}>
              {bezig ? 'Bezig…' : 'Opslaan'}
            </button>
          </form>
        </Blad>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
export function Projecten() {
  const [ookAfgesloten, setOokAfgesloten] = useState(false);
  const data = useLaden(async () => {
    let q = supabase.from('projecten').select('*').order('actief', { ascending: false }).order('aangemaakt_op', { ascending: false });
    if (!ookAfgesloten) q = q.eq('actief', true);
    return check(await q) as Project[];
  }, [ookAfgesloten]);
  const [bewerk, setBewerk] = useState<Partial<Project> | null>(null);
  const { bezig, opslaan } = useOpslaan(() => {
    setBewerk(null);
    void data.opnieuw();
  });

  return (
    <>
      <Kop titel="Projecten" terugNaar="/beheer" />
      <main className="pagina">
        <button className="knop blauw breed" type="button" onClick={() => setBewerk({ actief: true })}>
          <IcoonPlus />
          Project toevoegen
        </button>
        <p className="uitleg">Medewerkers kunnen bij Meenemen zelf snel een project toevoegen. Sluit een project af als het klaar is; dan verdwijnt het uit de keuzelijst.</p>
        <label className="vinkje">
          <input type="checkbox" checked={ookAfgesloten} onChange={(e) => setOokAfgesloten(e.target.checked)} />
          Ook afgesloten projecten tonen
        </label>
        {!data.data ? (
          data.fout ? <Fout tekst={data.fout} opnieuw={data.opnieuw} /> : <Laden />
        ) : data.data.length === 0 ? (
          <div className="leeg">Nog geen projecten.</div>
        ) : (
          <div className="lijst">
            {data.data.map((p) => (
              <button key={p.id} className="regel mand" type="button" onClick={() => setBewerk(p)} style={p.actief ? undefined : { opacity: 0.55 }}>
                <span>
                  <b>{p.naam}</b>
                  <small>{p.adres ?? 'Geen adres'}</small>
                </span>
                {!p.actief && <span className="label grijs">Afgesloten</span>}
              </button>
            ))}
          </div>
        )}
      </main>
      {bewerk && (
        <Blad titel={bewerk.id ? bewerk.naam ?? 'Project' : 'Nieuw project'} sluit={() => setBewerk(null)}>
          <form
            className="formulier"
            onSubmit={(e) => {
              e.preventDefault();
              void opslaan('projecten', bewerk.id ?? null, {
                naam: (bewerk.naam ?? '').trim(),
                adres: (bewerk.adres ?? '').trim() || null,
                actief: bewerk.actief ?? true,
              });
            }}
          >
            <label className="veld">
              <span>Naam</span>
              <input className="invoer" value={bewerk.naam ?? ''} onChange={(e) => setBewerk({ ...bewerk, naam: e.target.value })} required />
            </label>
            <label className="veld">
              <span>Adres</span>
              <input className="invoer" value={bewerk.adres ?? ''} onChange={(e) => setBewerk({ ...bewerk, adres: e.target.value })} />
            </label>
            {bewerk.id && (
              <label className="vinkje">
                <input type="checkbox" checked={bewerk.actief ?? true} onChange={(e) => setBewerk({ ...bewerk, actief: e.target.checked })} />
                Lopend project (uitvinken = afsluiten)
              </label>
            )}
            <button className="knop groen" type="submit" disabled={bezig}>
              {bezig ? 'Bezig…' : 'Opslaan'}
            </button>
          </form>
        </Blad>
      )}
    </>
  );
}
