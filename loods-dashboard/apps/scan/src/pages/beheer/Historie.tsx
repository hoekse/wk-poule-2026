import { useState } from 'react';
import { bewegingLabels, type BewegingLog, type BewegingType } from '@loods/shared';
import { check } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useLaden } from '../../lib/useLaden';
import { aantalTekst, datumTijd } from '../../lib/opmaak';
import { Fout, Kop, Laden } from '../../components/Basis';

const KLEUR: Record<BewegingType, string> = { mee: 'blauw', terug: 'groen', verbruikt: 'geel', correctie: 'rood' };

export function Historie() {
  const [type, setType] = useState<BewegingType | 'alle'>('alle');
  const [zoek, setZoek] = useState('');
  const [aantal, setAantal] = useState(100);

  const lijst = useLaden(async () => {
    let q = supabase.from('beweging_log').select('*').order('id', { ascending: false }).limit(aantal);
    if (type !== 'alle') q = q.eq('type', type);
    return check(await q) as BewegingLog[];
  }, [type, aantal]);

  const z = zoek.trim().toLowerCase();
  const gevonden = (lijst.data ?? []).filter(
    (b) =>
      !z ||
      [b.artikel_naam, b.qr_code, b.medewerker_naam, b.houder_naam, b.project_naam, b.voertuig_naam, b.opmerking].some((x) =>
        (x ?? '').toLowerCase().includes(z),
      ),
  );

  return (
    <>
      <Kop titel="Historie" terugNaar="/beheer" />
      <main className="pagina">
        <div className="zoekbalk">
          <input className="invoer" type="search" value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek op artikel, naam, project…" aria-label="Zoeken" />
          <div className="chips">
            <button type="button" className="chip" aria-pressed={type === 'alle'} onClick={() => setType('alle')}>Alle</button>
            {(Object.keys(bewegingLabels) as BewegingType[]).map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
                {bewegingLabels[t]}
              </button>
            ))}
          </div>
        </div>
        {lijst.laden && !lijst.data ? (
          <Laden />
        ) : lijst.fout ? (
          <Fout tekst={lijst.fout} opnieuw={lijst.opnieuw} />
        ) : gevonden.length === 0 ? (
          <div className="leeg">Geen bewegingen gevonden.</div>
        ) : (
          <div className="lijst">
            {gevonden.map((b) => (
              <div key={b.id} className="regel">
                <span className={`label ${KLEUR[b.type]}`}>{bewegingLabels[b.type]}</span>
                <span>
                  <b>
                    {b.telwijze === 'aantal' || b.type === 'correctie' ? `${b.type === 'correctie' && b.aantal > 0 ? '+' : ''}${aantalTekst(b.aantal, b.eenheid)} ` : ''}
                    {b.artikel_naam}
                  </b>
                  <small>
                    {b.medewerker_naam}
                    {b.houder_naam && b.houder_naam !== b.medewerker_naam ? ` voor ${b.houder_naam}` : ''}
                    {b.voertuig_naam ? ` · ${b.voertuig_naam}` : ''}
                    {b.project_naam ? ` · project ${b.project_naam}` : ''}
                  </small>
                  {b.opmerking && <small>“{b.opmerking}”</small>}
                </span>
                <span className="rechts">
                  <small className="uitleg">{datumTijd(b.tijdstip)}</small>
                  <br />
                  <span className="code">{b.qr_code}</span>
                </span>
              </div>
            ))}
            {(lijst.data ?? []).length >= aantal && (
              <button className="knop rand klein" type="button" onClick={() => setAantal((a) => a + 200)}>
                Meer laden
              </button>
            )}
          </div>
        )}
      </main>
    </>
  );
}
