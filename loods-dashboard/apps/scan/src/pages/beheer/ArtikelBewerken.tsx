import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  bewegingLabels,
  categorieen,
  telwijzen,
  type Artikel,
  type ArtikelOverzicht,
  type BewegingLog,
  type Categorie,
  type Keuring,
  type Telwijze,
  type Zone,
} from '@loods/shared';
import { check, haalArtikel, haalOnderweg, haalZones, registreer } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useLaden } from '../../lib/useLaden';
import { aantalTekst, datum, datumTijd, sindsTekst, vandaagIso } from '../../lib/opmaak';
import { useMelding } from '../../components/Meldingen';
import { Fout, Kop, Laden, Teller } from '../../components/Basis';
import { standLabel } from './Artikelen';

type Formulier = {
  naam: string;
  categorie: Categorie;
  telwijze: Telwijze;
  zone_id: string;
  qr_code: string;
  ean: string;
  eenheid: string;
  minimum_voorraad: string;
  keuring_verplicht: boolean;
  keuring_interval_maanden: string;
  omschrijving: string;
  actief: boolean;
};

const NIEUW: Formulier = {
  naam: '',
  categorie: 'gereedschap',
  telwijze: 'per_stuk',
  zone_id: '',
  qr_code: '',
  ean: '',
  eenheid: '',
  minimum_voorraad: '',
  keuring_verplicht: false,
  keuring_interval_maanden: '12',
  omschrijving: '',
  actief: true,
};

function naarFormulier(a: Artikel): Formulier {
  return {
    naam: a.naam,
    categorie: a.categorie,
    telwijze: a.telwijze,
    zone_id: a.zone_id ?? '',
    qr_code: a.qr_code,
    ean: a.ean ?? '',
    eenheid: a.eenheid ?? '',
    minimum_voorraad: a.minimum_voorraad?.toString() ?? '',
    keuring_verplicht: a.keuring_verplicht,
    keuring_interval_maanden: a.keuring_interval_maanden?.toString() ?? '12',
    omschrijving: a.omschrijving ?? '',
    actief: a.actief,
  };
}

export function ArtikelBewerken() {
  const { id = 'nieuw' } = useParams();
  const isNieuw = id === 'nieuw';
  const gegevens = useLaden(async () => {
    const [artikel, zones] = await Promise.all([isNieuw ? Promise.resolve(null) : haalArtikel(id), haalZones()]);
    return { artikel, zones };
  }, [id]);

  if (gegevens.laden && !gegevens.data) return (<><Kop titel="Artikel" terugNaar="/beheer/artikelen" /><Laden /></>);
  if (gegevens.fout || !gegevens.data) return (<><Kop titel="Artikel" terugNaar="/beheer/artikelen" /><main className="pagina"><Fout tekst={gegevens.fout ?? 'Niet gevonden'} /></main></>);
  if (!isNieuw && !gegevens.data.artikel) return (<><Kop titel="Artikel" terugNaar="/beheer/artikelen" /><main className="pagina"><Fout tekst="Dit artikel bestaat niet (meer)." /></main></>);

  return <ArtikelFormulier key={id} artikel={gegevens.data.artikel} zones={gegevens.data.zones} herlaad={gegevens.opnieuw} />;
}

function ArtikelFormulier({ artikel, zones, herlaad }: { artikel: ArtikelOverzicht | null; zones: Zone[]; herlaad: () => void }) {
  const navigate = useNavigate();
  const melding = useMelding();
  const [f, setF] = useState<Formulier>(artikel ? naarFormulier(artikel) : NIEUW);
  const [beginvoorraad, setBeginvoorraad] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const zet = <K extends keyof Formulier>(k: K, w: Formulier[K]) => setF((x) => ({ ...x, [k]: w }));

  async function opslaan(e: React.FormEvent) {
    e.preventDefault();
    if (!f.naam.trim()) return setFout('Vul een naam in.');
    if (f.ean.trim() && !/^[0-9\s]{8,17}$/.test(f.ean.trim())) return setFout('Een EAN bestaat uit 8 tot 14 cijfers.');
    setBezig(true);
    setFout(null);
    const rij = {
      naam: f.naam.trim(),
      categorie: f.categorie,
      telwijze: f.telwijze,
      zone_id: f.zone_id || null,
      qr_code: f.qr_code.trim() || null,
      ean: f.ean.trim() || null,
      eenheid: f.eenheid.trim() || null,
      minimum_voorraad: f.minimum_voorraad === '' ? null : Math.max(0, parseInt(f.minimum_voorraad, 10)),
      keuring_verplicht: f.keuring_verplicht,
      keuring_interval_maanden: f.keuring_verplicht && f.keuring_interval_maanden ? parseInt(f.keuring_interval_maanden, 10) : null,
      omschrijving: f.omschrijving.trim() || null,
      actief: f.actief,
    };
    try {
      if (artikel) {
        check(await supabase.from('artikelen').update(rij).eq('id', artikel.id));
        melding('ok', 'Opgeslagen');
        herlaad();
      } else {
        const nieuw = check(await supabase.from('artikelen').insert(rij).select().single<Artikel>());
        if (nieuw.telwijze === 'aantal' && beginvoorraad > 0) {
          await registreer([{ artikel_id: nieuw.id, type: 'correctie', aantal: beginvoorraad, opmerking: 'Beginvoorraad' }]);
        }
        melding('ok', `Toegevoegd met code ${nieuw.qr_code}`);
        navigate(`/beheer/artikelen/${nieuw.id}`, { replace: true });
      }
    } catch (err) {
      setFout(err instanceof Error ? err.message : String(err));
    } finally {
      setBezig(false);
    }
  }

  return (
    <>
      <Kop titel={artikel ? artikel.naam : 'Nieuw artikel'} terugNaar="/beheer/artikelen" />
      <main className="pagina met-balk">
        {artikel && (
          <div className="kaart">
            <div className="tabel-regel">
              <span>
                <span className="code" style={{ fontSize: 20 }}>{artikel.qr_code}</span>{' '}
                {artikel.zone_code && <span className="zone">{artikel.zone_code}</span>}
              </span>
              {standLabel(artikel)}
            </div>
            {artikel.telwijze === 'aantal' && (
              <div className="stand">
                {artikel.aanwezig} <small>aanwezig van {artikel.totaal} · {artikel.onderweg} onderweg</small>
              </div>
            )}
            <div className="snel">
              <Link className="knop mini rand" to={`/beheer/labels?ids=${artikel.id}`}>Label printen</Link>
              <Link className="knop mini rand" to={`/beheer/correcties?artikel=${artikel.id}`}>Correctie maken</Link>
            </div>
          </div>
        )}

        <form id="artikel" className="formulier" onSubmit={opslaan}>
          <label className="veld">
            <span>Naam</span>
            <input className="invoer" value={f.naam} onChange={(e) => zet('naam', e.target.value)} placeholder="Bijv. Schuifladder 2x12" required />
          </label>

          <div className="sectie">
            <span className="uitleg">Soort</span>
            <div className="chips">
              {categorieen.map((c) => (
                <button key={c.waarde} type="button" className="chip" aria-pressed={f.categorie === c.waarde} onClick={() => zet('categorie', c.waarde)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sectie">
            <span className="uitleg">Telwijze</span>
            <div className="chips twee">
              {telwijzen.map((t) => (
                <button
                  key={t.waarde}
                  type="button"
                  className="chip"
                  aria-pressed={f.telwijze === t.waarde}
                  onClick={() => zet('telwijze', t.waarde)}
                  disabled={!!artikel && artikel.telwijze !== t.waarde && (artikel.onderweg > 0 || artikel.totaal > 0)}
                >
                  {t.label}
                  <small>{t.uitleg}</small>
                </button>
              ))}
            </div>
          </div>

          <label className="veld">
            <span>Zone in de loods</span>
            <select className="invoer" value={f.zone_id} onChange={(e) => zet('zone_id', e.target.value)}>
              <option value="">Geen vaste plek</option>
              {zones.filter((z) => z.heeft_voorraad).map((z) => (
                <option key={z.id} value={z.id}>
                  {z.code} · {z.naam}
                </option>
              ))}
            </select>
          </label>

          <div className="rij2">
            <label className="veld">
              <span>QR-code</span>
              <input className="invoer" value={f.qr_code} onChange={(e) => zet('qr_code', e.target.value.toUpperCase())} placeholder="Automatisch" autoCapitalize="characters" />
            </label>
            <label className="veld">
              <span>Streepjescode (EAN)</span>
              <input className="invoer" value={f.ean} onChange={(e) => zet('ean', e.target.value)} inputMode="numeric" placeholder="Niet verplicht" />
            </label>
          </div>

          {f.telwijze === 'aantal' && (
            <div className="rij2">
              <label className="veld">
                <span>Eenheid</span>
                <input className="invoer" value={f.eenheid} onChange={(e) => zet('eenheid', e.target.value)} placeholder="stuks, rollen…" />
              </label>
              <label className="veld">
                <span>Minimumvoorraad</span>
                <input className="invoer" value={f.minimum_voorraad} onChange={(e) => zet('minimum_voorraad', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Geen" />
              </label>
            </div>
          )}

          {!artikel && f.telwijze === 'aantal' && (
            <div className="sectie">
              <span className="uitleg">Hoeveel zijn er nu? (beginvoorraad)</span>
              <Teller label="Beginvoorraad" waarde={beginvoorraad} onChange={setBeginvoorraad} min={0} />
            </div>
          )}

          <label className="vinkje">
            <input type="checkbox" checked={f.keuring_verplicht} onChange={(e) => zet('keuring_verplicht', e.target.checked)} />
            Moet gekeurd worden
          </label>
          {f.keuring_verplicht && (
            <label className="veld">
              <span>Keuren elke … maanden</span>
              <input className="invoer" value={f.keuring_interval_maanden} onChange={(e) => zet('keuring_interval_maanden', e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
            </label>
          )}

          <label className="veld">
            <span>Omschrijving (niet verplicht)</span>
            <textarea className="invoer" value={f.omschrijving} onChange={(e) => zet('omschrijving', e.target.value)} />
          </label>

          {artikel && (
            <label className="vinkje">
              <input type="checkbox" checked={f.actief} onChange={(e) => zet('actief', e.target.checked)} />
              Actief (uitvinken als het weg of kapot is; de historie blijft bewaard)
            </label>
          )}

          {fout && <div className="foutvak" role="alert">{fout}</div>}
        </form>

        {artikel && <ArtikelDetails artikel={artikel} />}
      </main>
      <div className="balk">
        <div className="binnen">
          <button className="knop groen" type="submit" form="artikel" disabled={bezig}>
            {bezig ? 'Bezig…' : artikel ? 'Wijzigingen opslaan' : 'Artikel toevoegen'}
          </button>
        </div>
      </div>
    </>
  );
}

function ArtikelDetails({ artikel }: { artikel: ArtikelOverzicht }) {
  const melding = useMelding();
  const details = useLaden(async () => {
    const [onderweg, keuringen, log] = await Promise.all([
      haalOnderweg({ artikelId: artikel.id }),
      supabase.from('keuringen').select('*').eq('artikel_id', artikel.id).order('gekeurd_op', { ascending: false }),
      supabase.from('beweging_log').select('*').eq('artikel_id', artikel.id).order('id', { ascending: false }).limit(15),
    ]);
    return { onderweg, keuringen: check(keuringen) as Keuring[], log: check(log) as BewegingLog[] };
  }, [artikel.id]);
  const [keuring, setKeuring] = useState({ gekeurd_op: vandaagIso(), door: '', opmerking: '' });

  async function keuringToevoegen(e: React.FormEvent) {
    e.preventDefault();
    try {
      check(
        await supabase.from('keuringen').insert({
          artikel_id: artikel.id,
          gekeurd_op: keuring.gekeurd_op,
          door: keuring.door.trim() || null,
          opmerking: keuring.opmerking.trim() || null,
        }),
      );
      melding('ok', 'Keuring opgeslagen');
      setKeuring({ gekeurd_op: vandaagIso(), door: '', opmerking: '' });
      void details.opnieuw();
    } catch (err) {
      melding('fout', err instanceof Error ? err.message : String(err));
    }
  }

  if (!details.data) return details.fout ? <Fout tekst={details.fout} /> : <Laden />;
  const { onderweg, keuringen, log } = details.data;

  return (
    <>
      <section className="sectie">
        <h2>Onderweg</h2>
        {onderweg.length === 0 ? (
          <p className="uitleg">Niets onderweg: alles staat in de loods.</p>
        ) : (
          <div className="lijst">
            {onderweg.map((o) => (
              <div key={o.houder_id} className="regel">
                <span className="av" style={{ background: o.houder_kleur }}>{o.houder_naam.charAt(0)}</span>
                <span>
                  <b>{o.houder_naam}{o.telwijze === 'aantal' ? ` · ${aantalTekst(o.aantal, o.eenheid)}` : ''}</b>
                  <small>{[o.voertuig_naam, o.project_naam].filter(Boolean).join(', ') || 'Geen bus of project'}</small>
                </span>
                <span className="rechts"><small>{sindsTekst(o.sinds)}</small></span>
              </div>
            ))}
          </div>
        )}
      </section>

      {(artikel.keuring_verplicht || keuringen.length > 0) && (
        <section className="sectie">
          <h2>Keuringen</h2>
          {keuringen.map((k) => (
            <div key={k.id} className="regel mand">
              <span>
                <b>Gekeurd {datum(k.gekeurd_op)}</b>
                <small>
                  {k.geldig_tot ? `Geldig tot ${datum(k.geldig_tot)}` : 'Geen einddatum'}
                  {k.door ? ` · ${k.door}` : ''}
                  {k.opmerking ? ` · ${k.opmerking}` : ''}
                </small>
              </span>
            </div>
          ))}
          <form className="kaart formulier" onSubmit={keuringToevoegen}>
            <b>Keuring toevoegen</b>
            <div className="rij2">
              <label className="veld">
                <span>Datum</span>
                <input className="invoer" type="date" value={keuring.gekeurd_op} onChange={(e) => setKeuring({ ...keuring, gekeurd_op: e.target.value })} required />
              </label>
              <label className="veld">
                <span>Door</span>
                <input className="invoer" value={keuring.door} onChange={(e) => setKeuring({ ...keuring, door: e.target.value })} placeholder="Keurder" />
              </label>
            </div>
            <label className="veld">
              <span>Opmerking</span>
              <input className="invoer" value={keuring.opmerking} onChange={(e) => setKeuring({ ...keuring, opmerking: e.target.value })} />
            </label>
            <button className="knop blauw" type="submit">Keuring opslaan</button>
          </form>
        </section>
      )}

      <section className="sectie">
        <h2>Laatste bewegingen</h2>
        {log.length === 0 ? (
          <p className="uitleg">Nog geen bewegingen.</p>
        ) : (
          <div className="lijst">
            {log.map((b) => (
              <div key={b.id} className="regel mand">
                <span>
                  <b>
                    {bewegingLabels[b.type]} {b.telwijze === 'aantal' || b.type === 'correctie' ? `(${b.aantal > 0 && b.type === 'correctie' ? '+' : ''}${b.aantal})` : ''}
                  </b>
                  <small>
                    {b.medewerker_naam}
                    {b.houder_naam && b.houder_naam !== b.medewerker_naam ? ` voor ${b.houder_naam}` : ''}
                    {b.opmerking ? ` · ${b.opmerking}` : ''}
                  </small>
                </span>
                <small className="uitleg">{datumTijd(b.tijdstip)}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
