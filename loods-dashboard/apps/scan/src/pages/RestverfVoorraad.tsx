// Welke restverf is er? Zoeken op kleurcode, merk of product; markeren als gebruikt of afgevoerd.
import { useState } from 'react';
import { vullingen, verfStatusLabels, type Verfrestant, type VerfStatus } from '@loods/shared';
import { check } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useLaden } from '../lib/useLaden';
import { datum, liter } from '../lib/opmaak';
import { useMelding } from '../components/Meldingen';
import { Blad, Fout, Kop, Laden } from '../components/Basis';

type Rij = Verfrestant & { zone: { code: string } | null; door: { naam: string } | null };

export function RestverfVoorraad() {
  const melding = useMelding();
  const [zoek, setZoek] = useState('');
  const [alles, setAlles] = useState(false);
  const [gekozen, setGekozen] = useState<Rij | null>(null);

  const lijst = useLaden(async () => {
    let q = supabase
      .from('verfrestanten')
      .select('*, zone:zones(code), door:medewerkers!verfrestanten_ingevoerd_door_fkey(naam)')
      .order('ingevoerd_op', { ascending: false })
      .limit(500);
    if (!alles) q = q.eq('status', 'aanwezig');
    return check(await q) as Rij[];
  }, [alles]);

  const z = zoek.trim().toLowerCase();
  const gevonden = (lijst.data ?? []).filter(
    (r) => !z || [r.kleurcode, r.merk, r.product, r.glansgraad, r.opmerking].some((x) => (x ?? '').toLowerCase().includes(z)),
  );

  async function zetStatus(r: Rij, status: VerfStatus) {
    try {
      check(await supabase.from('verfrestanten').update({ status }).eq('id', r.id));
      melding('ok', `${r.kleurcode ?? r.product ?? 'Restverf'}: ${verfStatusLabels[status].toLowerCase()}`);
      setGekozen(null);
      void lijst.opnieuw();
    } catch (e) {
      melding('fout', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <Kop titel="Restverf zoeken" terugNaar="/" />
      <main className="pagina">
        <div className="zoekbalk">
          <input
            className="invoer"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek op kleurcode, merk of product"
            aria-label="Zoeken"
            type="search"
          />
          <label className="vinkje">
            <input type="checkbox" checked={alles} onChange={(e) => setAlles(e.target.checked)} />
            Ook gebruikte en afgevoerde bussen tonen
          </label>
        </div>
        {lijst.laden && !lijst.data ? (
          <Laden />
        ) : lijst.fout ? (
          <Fout tekst={lijst.fout} opnieuw={lijst.opnieuw} />
        ) : gevonden.length === 0 ? (
          <div className="leeg">{z ? 'Niets gevonden.' : 'Nog geen restverf ingevoerd.'}</div>
        ) : (
          <div className="lijst">
            <p className="uitleg">{gevonden.length} {gevonden.length === 1 ? 'bus' : 'bussen'}</p>
            {gevonden.map((r) => (
              <button key={r.id} className="regel" type="button" onClick={() => setGekozen(r)}>
                <span className="code">{r.zone?.code ?? '?'}</span>
                <span>
                  <b>{r.kleurcode ?? 'Geen kleurcode'}</b>
                  <small>
                    {[r.merk, r.product].filter(Boolean).join(' ')}
                    {r.glansgraad ? ` · ${r.glansgraad}` : ''}
                    {r.basis ? ` · ${r.basis === 'watergedragen' ? 'Water' : 'Synth.'}` : ''}
                  </small>
                  <small>
                    {liter(r.inhoud_liter)} {liter(r.inhoud_liter) && '·'} {datum(r.ingevoerd_op)} door {r.door?.naam ?? '?'}
                  </small>
                </span>
                <span className="rechts">
                  <span className={r.status === 'aanwezig' ? 'label groen' : 'label grijs'}>
                    {r.status === 'aanwezig' ? vullingen.find((x) => x.waarde === r.vulling)?.label : verfStatusLabels[r.status]}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
      {gekozen && (
        <Blad titel={gekozen.kleurcode ?? [gekozen.merk, gekozen.product].filter(Boolean).join(' ')} sluit={() => setGekozen(null)}>
          {gekozen.foto_url && <img src={gekozen.foto_url} alt="Foto van de bus" style={{ width: '100%', borderRadius: 12, maxHeight: 280, objectFit: 'cover' }} />}
          <p className="uitleg" style={{ margin: 0 }}>
            {[gekozen.merk, gekozen.product, gekozen.glansgraad, liter(gekozen.inhoud_liter)].filter(Boolean).join(' · ')}
            {gekozen.opmerking ? ` · ${gekozen.opmerking}` : ''}
          </p>
          {gekozen.status === 'aanwezig' ? (
            <>
              <button className="knop blauw breed" type="button" onClick={() => void zetStatus(gekozen, 'gebruikt')}>
                Ik gebruik deze bus
              </button>
              <button className="knop rand breed" type="button" onClick={() => void zetStatus(gekozen, 'afgevoerd')}>
                Bus is leeg of afgevoerd
              </button>
            </>
          ) : (
            <button className="knop rand breed" type="button" onClick={() => void zetStatus(gekozen, 'aanwezig')}>
              Toch weer aanwezig
            </button>
          )}
        </Blad>
      )}
    </>
  );
}
