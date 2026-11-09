// Restverf invoeren: scan de EAN op de bus. Bekend → merk/product staan klaar.
// Onbekend → één keer invullen, daarna onthoudt de app het.
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  glansgraden,
  inhoudKeuzes,
  restverfZone,
  verfMerken,
  vullingen,
  type VerfBasis,
  type Verfproduct,
  type Vulling,
} from '@loods/shared';
import { check, haalZones, normaliseerCode, zoekVerfproduct } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useIk } from '../lib/sessie';
import { useLaden } from '../lib/useLaden';
import { feedback } from '../lib/feedback';
import { uploadFoto } from '../lib/foto';
import { liter } from '../lib/opmaak';
import { useMelding } from '../components/Meldingen';
import { Scanner } from '../components/Scanner';
import { Kop } from '../components/Basis';
import { IcoonCamera, IcoonVink } from '../components/Iconen';

interface Invoer {
  merk: string;
  product: string;
  kleurcode: string;
  glansgraad: string;
  basis: VerfBasis | '';
  inhoud: number | null;
  vulling: Vulling | '';
  zoneId: string;
  opmerking: string;
}

const LEEG: Invoer = { merk: '', product: '', kleurcode: '', glansgraad: '', basis: '', inhoud: null, vulling: '', zoneId: '', opmerking: '' };

export function Restverf() {
  const ik = useIk();
  const melding = useMelding();
  const navigate = useNavigate();
  const [stap, setStap] = useState<'scannen' | 'invoer' | 'klaar'>('scannen');
  const [ean, setEan] = useState<string | null>(null);
  const [bekend, setBekend] = useState<Verfproduct | null>(null);
  const [productWijzigen, setProductWijzigen] = useState(false);
  const [v, setV] = useState<Invoer>(LEEG);
  const [foto, setFoto] = useState<File | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const zoekt = useRef(false);

  const extra = useLaden(async () => {
    const [zones, recent] = await Promise.all([
      haalZones(),
      supabase.from('verfrestanten').select('kleurcode').not('kleurcode', 'is', null).order('ingevoerd_op', { ascending: false }).limit(60),
    ]);
    const kleuren = [...new Set((check(recent) as { kleurcode: string }[]).map((r) => r.kleurcode))].slice(0, 6);
    return { zones: zones.filter((z) => z.heeft_voorraad), kleuren };
  }, []);

  const zet = <K extends keyof Invoer>(k: K, w: Invoer[K]) => setV((x) => ({ ...x, [k]: w }));
  const standaardZone = () => extra.data?.zones.find((z) => z.code === restverfZone)?.id ?? '';

  async function verwerk(code: string) {
    if (zoekt.current) return;
    const c = normaliseerCode(code);
    if (!/^[0-9]{8,14}$/.test(c)) {
      feedback.fout();
      melding('fout', 'Dit is geen streepjescode van een verfbus. Scan de streepjes op het etiket.');
      return;
    }
    zoekt.current = true;
    try {
      const p = await zoekVerfproduct(c);
      feedback.goed();
      begin(c, p);
      melding(p ? 'ok' : 'info', p ? `${p.merk} ${p.product}` : 'Nieuwe bus: vul merk en product één keer in.');
    } catch (e) {
      feedback.fout();
      melding('fout', e instanceof Error ? e.message : String(e));
    } finally {
      zoekt.current = false;
    }
  }

  function begin(code: string | null, p: Verfproduct | null) {
    setEan(code);
    setBekend(p);
    setProductWijzigen(!p);
    setV({
      ...LEEG,
      merk: p?.merk ?? '',
      product: p?.product ?? '',
      glansgraad: p?.glansgraad ?? '',
      basis: p?.basis ?? '',
      inhoud: p?.inhoud_liter ?? null,
      zoneId: standaardZone(),
    });
    setFoto(null);
    setFout(null);
    setStap('invoer');
  }

  async function opslaan(e: React.FormEvent) {
    e.preventDefault();
    if (!v.vulling) return setFout('Kies hoe vol de bus is.');
    if (!v.merk.trim()) return setFout('Vul het merk in.');
    if (!v.kleurcode.trim() && !v.product.trim()) return setFout('Vul een kleurcode of product in.');
    setBezig(true);
    setFout(null);
    try {
      const productGegevens = {
        merk: v.merk.trim(),
        product: v.product.trim(),
        glansgraad: v.glansgraad || null,
        basis: v.basis || null,
        inhoud_liter: v.inhoud,
      };
      if (ean && v.product.trim()) {
        const veranderd =
          !bekend ||
          bekend.merk !== productGegevens.merk ||
          bekend.product !== productGegevens.product ||
          (bekend.glansgraad ?? null) !== productGegevens.glansgraad ||
          (bekend.basis ?? null) !== productGegevens.basis ||
          (bekend.inhoud_liter ?? null) !== productGegevens.inhoud_liter;
        if (veranderd) check(await supabase.from('verfproducten').upsert({ ean, ...productGegevens }));
      }
      let foto_url: string | null = null;
      if (foto) {
        try {
          foto_url = await uploadFoto(foto, 'verf');
        } catch (err) {
          melding('let-op', `Foto niet opgeslagen: ${err instanceof Error ? err.message : err}`);
        }
      }
      check(
        await supabase.from('verfrestanten').insert({
          ean,
          ...productGegevens,
          product: productGegevens.product || null,
          kleurcode: v.kleurcode.trim().toUpperCase() || null,
          vulling: v.vulling,
          zone_id: v.zoneId || null,
          foto_url,
          opmerking: v.opmerking.trim() || null,
          ingevoerd_door: ik.id,
        }),
      );
      feedback.klaar();
      setStap('klaar');
      void extra.opnieuw(); // recente kleurcodes bijwerken voor de volgende bus
    } catch (err) {
      feedback.fout();
      setFout(err instanceof Error ? err.message : String(err));
    } finally {
      setBezig(false);
    }
  }

  if (stap === 'klaar') {
    return (
      <>
        <Kop titel="Restverf invoeren" terugNaar="/" />
        <main className="klaar" aria-live="polite">
          <div className="vink">
            <IcoonVink />
          </div>
          <h2>Restverf opgeslagen</h2>
          <p className="uitleg">
            {[v.merk, v.product].filter(Boolean).join(' ')} {v.kleurcode && `· ${v.kleurcode.toUpperCase()}`} ·{' '}
            {vullingen.find((x) => x.waarde === v.vulling)?.label} vol
          </p>
          <div className="lijst" style={{ width: '100%', maxWidth: 520 }}>
            <button className="knop geel breed" type="button" onClick={() => setStap('scannen')}>
              Nog een bus invoeren
            </button>
            <button className="knop rand breed" type="button" onClick={() => navigate('/')}>
              Klaar
            </button>
          </div>
        </main>
      </>
    );
  }

  if (stap === 'scannen') {
    return (
      <>
        <Kop titel="Restverf invoeren" terugNaar="/" />
        <main className="pagina">
          <Scanner onCode={verwerk} soort="streepjescode" hint="Scan de streepjescode op de bus" />
          <p className="uitleg">Scan de streepjescode (EAN) op het etiket van de bus. Een bus die al eens is ingevoerd, herkent de app.</p>
          <button className="knop rand breed klein" type="button" onClick={() => begin(null, null)}>
            Bus zonder streepjescode
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Kop titel="Restverf invoeren" opTerug={() => setStap('scannen')} />
      <form className="pagina met-balk" onSubmit={opslaan}>
        <section className="sectie">
          <h2>Product</h2>
          {bekend && !productWijzigen ? (
            <div className="kaart">
              <div className="tabel-regel">
                <span>
                  <b style={{ fontSize: 21 }}>
                    {bekend.merk} {bekend.product}
                  </b>
                  <br />
                  <small className="uitleg">
                    {[bekend.glansgraad, bekend.basis === 'watergedragen' ? 'Watergedragen' : bekend.basis === 'synthetisch' ? 'Synthetisch' : null, liter(bekend.inhoud_liter)]
                      .filter(Boolean)
                      .join(' · ')}
                    {ean ? ` · EAN ${ean}` : ''}
                  </small>
                </span>
                <button className="knop mini rand" type="button" onClick={() => setProductWijzigen(true)}>
                  Wijzigen
                </button>
              </div>
            </div>
          ) : (
            <>
              {ean && <p className="uitleg">Nieuwe streepjescode {ean}. Vul dit één keer in; daarna weet de app het.</p>}
              <div className="chips">
                {verfMerken.map((m) => (
                  <button key={m} type="button" className="chip" aria-pressed={v.merk === m} onClick={() => zet('merk', m)}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="rij2">
                <label className="veld">
                  <span>Merk</span>
                  <input className="invoer" value={v.merk} onChange={(e) => zet('merk', e.target.value)} autoComplete="off" />
                </label>
                <label className="veld">
                  <span>Product</span>
                  <input className="invoer" value={v.product} onChange={(e) => zet('product', e.target.value)} placeholder="Bijv. Rubbol BL Satura" autoComplete="off" />
                </label>
              </div>
              <div className="sectie">
                <span className="uitleg">Glansgraad</span>
                <div className="chips">
                  {glansgraden.map((g) => (
                    <button key={g} type="button" className="chip" aria-pressed={v.glansgraad === g} onClick={() => zet('glansgraad', v.glansgraad === g ? '' : g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sectie">
                <span className="uitleg">Basis</span>
                <div className="chips twee">
                  {(['synthetisch', 'watergedragen'] as const).map((b) => (
                    <button key={b} type="button" className="chip" aria-pressed={v.basis === b} onClick={() => zet('basis', b)}>
                      {b === 'synthetisch' ? 'Synthetisch' : 'Watergedragen'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sectie">
                <span className="uitleg">Inhoud van de bus</span>
                <div className="chips">
                  {inhoudKeuzes.map((l) => (
                    <button key={l} type="button" className="chip" aria-pressed={v.inhoud === l} onClick={() => zet('inhoud', l)}>
                      {liter(l)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        <section className="sectie">
          <h2>Kleurcode</h2>
          <input
            className="invoer groot"
            value={v.kleurcode}
            onChange={(e) => zet('kleurcode', e.target.value)}
            placeholder="Bijv. RAL 9010"
            aria-label="Kleurcode"
            style={{ textTransform: 'uppercase' }}
            autoCapitalize="characters"
            autoComplete="off"
          />
          {!!extra.data?.kleuren.length && (
            <div className="chips">
              {extra.data.kleuren.map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={v.kleurcode.toUpperCase() === k} onClick={() => zet('kleurcode', k)}>
                  {k}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="sectie">
          <h2>Hoe vol is de bus?</h2>
          <div className="chips vier" role="group" aria-label="Vulling">
            {vullingen.map((x) => (
              <button key={x.waarde} type="button" className="chip" aria-pressed={v.vulling === x.waarde} onClick={() => zet('vulling', x.waarde)}>
                {x.label}
              </button>
            ))}
          </div>
        </section>

        <section className="sectie">
          <h2>Foto (mag ook later)</h2>
          <label className="knop rand klein" style={{ cursor: 'pointer' }}>
            <IcoonCamera />
            {foto ? `Foto gekozen: ${foto.name.slice(0, 24)}` : 'Foto maken'}
            <input
              className="verborgen"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            />
          </label>
        </section>

        <section className="sectie">
          <h2>Plek</h2>
          <select className="invoer" value={v.zoneId} onChange={(e) => zet('zoneId', e.target.value)} aria-label="Zone">
            <option value="">Onbekend</option>
            {extra.data?.zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.code} · {z.naam}
              </option>
            ))}
          </select>
          <label className="veld">
            <span>Opmerking (niet verplicht)</span>
            <input className="invoer" value={v.opmerking} onChange={(e) => zet('opmerking', e.target.value)} placeholder="Bijv. project Zwolle, kozijnen" />
          </label>
        </section>

        {fout && (
          <div className="foutvak" role="alert">
            {fout}
          </div>
        )}

        <div className="balk">
          <div className="binnen">
            <button className="knop geel" type="submit" disabled={bezig}>
              {bezig ? 'Bezig…' : 'Restverf opslaan'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
