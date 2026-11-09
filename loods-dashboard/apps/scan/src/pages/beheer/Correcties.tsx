// Correcties: voorraad bijstellen of herstellen wat er onderweg staat.
// Een correctie is een nieuwe beweging (audittrail); er wordt nooit iets gewist.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ArtikelOverzicht, Medewerker } from '@loods/shared';
import { check, haalArtikel, haalOnderweg, registreer } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useLaden } from '../../lib/useLaden';
import { aantalTekst } from '../../lib/opmaak';
import { useMelding } from '../../components/Meldingen';
import { Fout, Kop, Laden, Teller } from '../../components/Basis';

export function Correcties() {
  const [params, setParams] = useSearchParams();
  const artikelId = params.get('artikel');
  const [zoek, setZoek] = useState('');

  const lijst = useLaden(
    async () => (artikelId ? [] : (check(await supabase.from('artikel_overzicht').select('*').order('qr_code')) as ArtikelOverzicht[])),
    [artikelId],
  );

  if (artikelId) return <CorrectieFormulier artikelId={artikelId} kiesAnder={() => setParams({})} />;

  const z = zoek.trim().toLowerCase();
  const gevonden = (lijst.data ?? []).filter((a) => !z || a.naam.toLowerCase().includes(z) || a.qr_code.toLowerCase().includes(z));
  return (
    <>
      <Kop titel="Correcties" terugNaar="/beheer" />
      <main className="pagina">
        <p className="uitleg">
          Kies het artikel. Je kunt de voorraad bijstellen (bijv. nieuwe doos goldtape, of 2 staanders kapot) of herstellen wat er bij
          iemand onderweg staat (bijv. vergeten te scannen). Elke correctie blijft zichtbaar in de historie.
        </p>
        <input className="invoer" type="search" value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek op naam of code" aria-label="Zoeken" />
        {lijst.laden && !lijst.data ? (
          <Laden />
        ) : lijst.fout ? (
          <Fout tekst={lijst.fout} opnieuw={lijst.opnieuw} />
        ) : (
          <div className="lijst">
            {gevonden.slice(0, 60).map((a) => (
              <button key={a.id} className="regel" type="button" onClick={() => setParams({ artikel: a.id })}>
                <span className="code">{a.qr_code}</span>
                <span>
                  <b>{a.naam}</b>
                  <small>
                    {a.telwijze === 'aantal' ? `${a.aanwezig} van ${a.totaal} aanwezig` : a.onderweg ? 'Onderweg' : 'Aanwezig'}
                  </small>
                </span>
                <span className="label blauw">Kies</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function CorrectieFormulier({ artikelId, kiesAnder }: { artikelId: string; kiesAnder: () => void }) {
  const melding = useMelding();
  const data = useLaden(async () => {
    const [artikel, onderweg, mw] = await Promise.all([
      haalArtikel(artikelId),
      haalOnderweg({ artikelId }),
      supabase.from('medewerkers').select('*').eq('actief', true).order('naam'),
    ]);
    return { artikel, onderweg, medewerkers: check(mw) as Medewerker[] };
  }, [artikelId]);

  const [soort, setSoort] = useState<'voorraad' | 'onderweg'>('voorraad');
  const [delta, setDelta] = useState(1);
  const [richting, setRichting] = useState<'erbij' | 'eraf'>('erbij');
  const [houderId, setHouderId] = useState<string>('');
  const [reden, setReden] = useState('');
  const [bezig, setBezig] = useState(false);

  if (!data.data) return (<><Kop titel="Correctie" opTerug={kiesAnder} />{data.fout ? <main className="pagina"><Fout tekst={data.fout} /></main> : <Laden />}</>);
  const { artikel, onderweg, medewerkers } = data.data;
  if (!artikel) return (<><Kop titel="Correctie" opTerug={kiesAnder} /><main className="pagina"><Fout tekst="Artikel niet gevonden." /></main></>);

  const isAantal = artikel.telwijze === 'aantal';
  const actieveSoort = isAantal ? soort : 'onderweg';
  const huidigBij = onderweg.find((o) => o.houder_id === houderId)?.aantal ?? 0;
  const maxEraf = actieveSoort === 'voorraad' ? Math.max(1, artikel.totaal) : Math.max(1, huidigBij);
  const getekend = richting === 'erbij' ? delta : -delta;

  async function opslaan(e: React.FormEvent) {
    e.preventDefault();
    if (!reden.trim()) {
      melding('let-op', 'Schrijf kort op waarom je corrigeert.');
      return;
    }
    if (actieveSoort === 'onderweg' && !houderId) {
      melding('let-op', 'Kies bij wie het onderweg staat.');
      return;
    }
    setBezig(true);
    try {
      await registreer([
        {
          artikel_id: artikel!.id,
          type: 'correctie',
          aantal: getekend,
          houder_id: actieveSoort === 'onderweg' ? houderId : null,
          opmerking: reden.trim(),
        },
      ]);
      melding('ok', 'Correctie opgeslagen');
      setReden('');
      setDelta(1);
      void data.opnieuw();
    } catch (err) {
      melding('fout', err instanceof Error ? err.message : String(err));
    } finally {
      setBezig(false);
    }
  }

  return (
    <>
      <Kop titel="Correctie" opTerug={kiesAnder} />
      <form className="pagina met-balk" onSubmit={opslaan}>
        <div className="kaart">
          <b style={{ fontSize: 21 }}>{artikel.naam}</b>
          <span>
            <span className="code">{artikel.qr_code}</span>{' '}
            {isAantal ? `${aantalTekst(artikel.aanwezig, artikel.eenheid)} aanwezig van ${artikel.totaal}` : artikel.onderweg ? 'Onderweg' : 'In de loods'}
          </span>
          {onderweg.map((o) => (
            <small key={o.houder_id} className="uitleg">
              Bij {o.houder_naam}: {aantalTekst(o.aantal, o.eenheid)}
            </small>
          ))}
        </div>

        {isAantal && (
          <div className="tabs" role="tablist">
            <button role="tab" type="button" aria-selected={soort === 'voorraad'} onClick={() => setSoort('voorraad')}>
              Voorraad bijstellen
            </button>
            <button role="tab" type="button" aria-selected={soort === 'onderweg'} onClick={() => setSoort('onderweg')}>
              Onderweg herstellen
            </button>
          </div>
        )}

        {actieveSoort === 'onderweg' && (
          <section className="sectie">
            <h2>Bij wie?</h2>
            <div className="chips raster">
              {medewerkers.map((m) => {
                const bij = onderweg.find((o) => o.houder_id === m.id)?.aantal ?? 0;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className="chip"
                    aria-pressed={houderId === m.id}
                    onClick={() => {
                      setHouderId(m.id);
                      setRichting(bij > 0 ? 'eraf' : 'erbij');
                      setDelta(bij > 0 ? bij : 1);
                    }}
                  >
                    {m.naam}
                    <small>{bij > 0 ? `heeft er ${bij}` : 'heeft niets'}</small>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="sectie">
          <h2>{actieveSoort === 'voorraad' ? 'Voorraad' : 'Op naam'}</h2>
          <div className="chips twee">
            <button type="button" className="chip" aria-pressed={richting === 'erbij'} onClick={() => setRichting('erbij')}>
              {actieveSoort === 'voorraad' ? 'Erbij (aangevuld)' : 'Erbij (vergeten mee te scannen)'}
            </button>
            <button type="button" className="chip" aria-pressed={richting === 'eraf'} onClick={() => { setRichting('eraf'); setDelta((d) => Math.min(d, maxEraf)); }}>
              {actieveSoort === 'voorraad' ? 'Eraf (kapot of kwijt)' : 'Eraf (al terug of kwijt)'}
            </button>
          </div>
          {isAantal ? (
            <Teller label="Aantal" waarde={delta} onChange={setDelta} min={1} max={richting === 'eraf' ? maxEraf : undefined} />
          ) : (
            <p className="uitleg">Dit artikel heeft een eigen nummer: de correctie is altijd 1 stuk.</p>
          )}
          {actieveSoort === 'voorraad' && (
            <p className="uitleg">
              Nieuw totaal: <b>{artikel.totaal + getekend}</b> (nu {artikel.totaal})
            </p>
          )}
        </section>

        <label className="veld">
          <span>Reden (verplicht)</span>
          <input className="invoer" value={reden} onChange={(e) => setReden(e.target.value)} placeholder="Bijv. nieuwe doos, vergeten te scannen" />
        </label>

        <div className="balk">
          <div className="binnen">
            <button className="knop groen" type="submit" disabled={bezig}>
              {bezig ? 'Bezig…' : 'Correctie opslaan'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
