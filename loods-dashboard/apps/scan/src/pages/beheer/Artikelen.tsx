import { useState } from 'react';
import { Link } from 'react-router-dom';
import { categorieen, categorieLabel, type ArtikelOverzicht, type Categorie } from '@loods/shared';
import { check } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useLaden } from '../../lib/useLaden';
import { Fout, Kop, Laden } from '../../components/Basis';
import { IcoonPlus } from '../../components/Iconen';

export function standLabel(a: ArtikelOverzicht) {
  if (!a.actief) return <span className="label grijs">Inactief</span>;
  if (a.telwijze === 'per_stuk') {
    return a.onderweg > 0 ? <span className="label geel">Onderweg</span> : <span className="label groen">Aanwezig</span>;
  }
  const kleur = a.onder_minimum || a.aanwezig <= 0 ? 'rood' : a.onderweg > 0 ? 'geel' : 'groen';
  return (
    <span className={`label ${kleur}`}>
      {a.aanwezig}/{a.totaal}
    </span>
  );
}

export function Artikelen() {
  const [zoek, setZoek] = useState('');
  const [categorie, setCategorie] = useState<Categorie | 'alle'>('alle');
  const [inactief, setInactief] = useState(false);
  const lijst = useLaden(
    async () => check(await supabase.from('artikel_overzicht').select('*').order('qr_code')) as ArtikelOverzicht[],
    [],
  );

  const z = zoek.trim().toLowerCase();
  const gevonden = (lijst.data ?? []).filter(
    (a) =>
      (inactief || a.actief) &&
      (categorie === 'alle' || a.categorie === categorie) &&
      (!z || a.naam.toLowerCase().includes(z) || a.qr_code.toLowerCase().includes(z) || (a.ean ?? '').includes(z)),
  );

  return (
    <>
      <Kop titel="Artikelen" terugNaar="/beheer" />
      <main className="pagina">
        <Link className="knop blauw breed" to="/beheer/artikelen/nieuw">
          <IcoonPlus />
          Nieuw artikel
        </Link>
        <div className="zoekbalk">
          <input className="invoer" type="search" value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek op naam, code of EAN" aria-label="Zoeken" />
          <div className="chips">
            <button type="button" className="chip" aria-pressed={categorie === 'alle'} onClick={() => setCategorie('alle')}>
              Alle
            </button>
            {categorieen.map((c) => (
              <button key={c.waarde} type="button" className="chip" aria-pressed={categorie === c.waarde} onClick={() => setCategorie(c.waarde)}>
                {c.label}
              </button>
            ))}
          </div>
          <label className="vinkje">
            <input type="checkbox" checked={inactief} onChange={(e) => setInactief(e.target.checked)} />
            Ook inactieve artikelen tonen
          </label>
        </div>
        {lijst.laden && !lijst.data ? (
          <Laden />
        ) : lijst.fout ? (
          <Fout tekst={lijst.fout} opnieuw={lijst.opnieuw} />
        ) : gevonden.length === 0 ? (
          <div className="leeg">Geen artikelen gevonden.</div>
        ) : (
          <div className="lijst">
            <p className="uitleg">{gevonden.length} artikelen</p>
            {gevonden.map((a) => (
              <Link key={a.id} className="regel" to={`/beheer/artikelen/${a.id}`}>
                <span className="code">{a.qr_code}</span>
                <span>
                  <b>{a.naam}</b>
                  <small>
                    {categorieLabel(a.categorie)}
                    {a.zone_code ? ` · ${a.zone_code}` : ''}
                    {a.keuring_status === 'verlopen' ? ' · keuring verlopen' : a.keuring_status === 'verloopt' ? ' · keuring verloopt' : ''}
                  </small>
                </span>
                <span className="rechts">{standLabel(a)}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
