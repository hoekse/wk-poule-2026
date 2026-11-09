// QR-labels printen op A4 (3 × 8 = 24 labels van 70 × 37 mm).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { categorieen, type ArtikelOverzicht, type Categorie } from '@loods/shared';
import { check } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useLaden } from '../../lib/useLaden';
import { Fout, Kenmerk, Kop, Laden } from '../../components/Basis';

const PER_VEL = 24;

export function Labels() {
  const [params] = useSearchParams();
  const [gekozen, setGekozen] = useState<Set<string>>(() => new Set((params.get('ids') ?? '').split(',').filter(Boolean)));
  const [zoek, setZoek] = useState('');
  const [categorie, setCategorie] = useState<Categorie | 'alle'>('alle');
  const [eerste, setEerste] = useState(1);
  const [qr, setQr] = useState<Record<string, string>>({});

  const lijst = useLaden(
    async () => check(await supabase.from('artikel_overzicht').select('*').eq('actief', true).order('qr_code')) as ArtikelOverzicht[],
    [],
  );

  const z = zoek.trim().toLowerCase();
  const zichtbaar = (lijst.data ?? []).filter(
    (a) => (categorie === 'alle' || a.categorie === categorie) && (!z || a.naam.toLowerCase().includes(z) || a.qr_code.toLowerCase().includes(z)),
  );
  const teprinten = useMemo(() => (lijst.data ?? []).filter((a) => gekozen.has(a.id)), [lijst.data, gekozen]);

  useEffect(() => {
    let weg = false;
    (async () => {
      const nieuw: Record<string, string> = {};
      for (const a of teprinten) {
        nieuw[a.qr_code] = await QRCode.toString(a.qr_code, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
      }
      if (!weg) setQr(nieuw);
    })();
    return () => {
      weg = true;
    };
  }, [teprinten]);

  const vakken: (ArtikelOverzicht | null)[] = [...Array(Math.max(0, eerste - 1)).fill(null), ...teprinten];
  const vellen: (ArtikelOverzicht | null)[][] = [];
  for (let i = 0; i < vakken.length; i += PER_VEL) vellen.push(vakken.slice(i, i + PER_VEL));

  function wissel(id: string) {
    setGekozen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <>
      <Kop titel="QR-labels printen" terugNaar="/beheer" />
      <main className="pagina met-balk">
        <div className="niet-printen formulier">
          <p className="uitleg">
            Kies de artikelen. De labels passen op A4-etiketvellen met 3 × 8 labels (70 × 37 mm), maar kunnen ook op gewoon papier.
            Tip: lamineer of gebruik weerbestendige etiketten voor ladders en steigerdelen.
          </p>
          <input className="invoer" type="search" value={zoek} onChange={(e) => setZoek(e.target.value)} placeholder="Zoek op naam of code" aria-label="Zoeken" />
          <div className="chips">
            <button type="button" className="chip" aria-pressed={categorie === 'alle'} onClick={() => setCategorie('alle')}>Alle</button>
            {categorieen.map((c) => (
              <button key={c.waarde} type="button" className="chip" aria-pressed={categorie === c.waarde} onClick={() => setCategorie(c.waarde)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="snel">
            <button className="knop mini rand" type="button" onClick={() => setGekozen((s) => new Set([...s, ...zichtbaar.map((a) => a.id)]))}>
              Alles hierboven kiezen
            </button>
            <button className="knop mini rand" type="button" onClick={() => setGekozen(new Set())}>
              Niets kiezen
            </button>
          </div>
          {lijst.laden && !lijst.data ? (
            <Laden />
          ) : lijst.fout ? (
            <Fout tekst={lijst.fout} opnieuw={lijst.opnieuw} />
          ) : (
            <div className="lijst" style={{ maxHeight: '40vh', overflow: 'auto' }}>
              {zichtbaar.map((a) => (
                <label key={a.id} className="regel" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={gekozen.has(a.id)} onChange={() => wissel(a.id)} style={{ width: 28, height: 28, accentColor: 'var(--blauw)' }} />
                  <span>
                    <b>{a.naam}</b>
                    <small>{a.zone_code ? `Zone ${a.zone_code}` : 'Geen zone'}</small>
                  </span>
                  <span className="code">{a.qr_code}</span>
                </label>
              ))}
            </div>
          )}
          <label className="veld">
            <span>Begin bij label nummer (voor een half gebruikt vel)</span>
            <input
              className="invoer"
              inputMode="numeric"
              value={eerste}
              onChange={(e) => setEerste(Math.min(PER_VEL, Math.max(1, parseInt(e.target.value || '1', 10))))}
            />
          </label>
          <h2 className="uitleg">
            Voorbeeld: {teprinten.length} labels op {vellen.length} {vellen.length === 1 ? 'vel' : 'vellen'}
          </h2>
        </div>

        <Vellen vellen={vellen} qr={qr} />
      </main>
      <div className="balk niet-printen">
        <div className="binnen">
          <button className="knop blauw" type="button" disabled={teprinten.length === 0} onClick={() => window.print()}>
            Afdrukken ({teprinten.length})
          </button>
        </div>
      </div>
    </>
  );
}

function Vellen({ vellen, qr }: { vellen: (ArtikelOverzicht | null)[][]; qr: Record<string, string> }) {
  const houder = useRef<HTMLDivElement>(null);
  const [schaal, setSchaal] = useState(1);
  useLayoutEffect(() => {
    const el = houder.current;
    if (!el) return;
    const meet = () => setSchaal(Math.min(1, el.clientWidth / 794)); // 210 mm ≈ 794 px
    meet();
    const ro = new ResizeObserver(meet);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="vellen" ref={houder}>
      {vellen.map((vel, i) => (
        <div key={i} className="vel-wrap" style={{ width: 794 * schaal, height: 1123 * schaal }}>
          <div className="vel" style={{ transform: `scale(${schaal})` }}>
            {Array.from({ length: PER_VEL }, (_, j) => vel[j] ?? null).map((a, j) =>
              a ? (
                <div key={j} className="etiket">
                  <div className="qr">
                    <div dangerouslySetInnerHTML={{ __html: qr[a.qr_code] ?? '' }} />
                  </div>
                  <div className="tekst">
                    <div className="merk">
                      <Kenmerk />
                      HOEKSEMA
                    </div>
                    <div className="naam">{a.naam}</div>
                    <div>
                      <div className="grote-code">{a.qr_code}</div>
                      <div className="plek">{a.zone_code ? `Zone ${a.zone_code} · ${a.zone_naam}` : 'Loods Industrieweg 3-U'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={j} className="etiket" />
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
