import { useState } from 'react';
import { Kop, Segment } from '../components/Basis';
import { LijnGrafiek, StaafGrafiek } from '../components/Grafiek';
import { IcoonKoppeling } from '../components/Iconen';
import { ImportBlad, OchtendCheck, bronNaam } from '../components/Invoer';
import { dagDatum, plusDagen, vandaag } from '../lib/datum';
import { berekenHerstel, fmt1, uurMin } from '../lib/herstel';
import type { Dagdata, DagVeld } from '../lib/types';
import { useNav, useWinkel } from '../lib/winkel';

type Periode = 14 | 30 | 90;

export function Herstel() {
  const { staat } = useWinkel();
  const nav = useNav();
  const [periode, setPeriode] = useState<Periode>(14);
  const [check, setCheck] = useState<string | null>(null);
  const [importeer, setImporteer] = useState(false);
  const d = vandaag();
  const dagen = Array.from({ length: periode }, (_, i) => plusDagen(d, i - periode + 1));
  const data = dagen.map((x) => staat.dagdata[x]).filter((x): x is Dagdata => !!x);

  const reeks = (veld: DagVeld) =>
    dagen.flatMap((x) => {
      const v = staat.dagdata[x]?.[veld];
      return typeof v === 'number' ? [{ x, y: Math.round(v * 100) / 100 }] : [];
    });
  const gem = (veld: DagVeld) => {
    const r = reeks(veld);
    return r.length ? r.reduce((s, p) => s + p.y, 0) / r.length : null;
  };
  const scores = dagen.flatMap((x) => {
    const s = berekenHerstel(staat, x).score;
    return s == null ? [] : [{ x, y: s }];
  });

  const slaap = reeks('slaapUren');
  const cpap = reeks('cpapUren');
  const ahi = reeks('ahi');
  const hrv = reeks('hrv');
  const rhr = reeks('rustHartslag');
  const gAhi = gem('ahi');
  const gCpap = gem('cpapUren');
  const gSlaap = gem('slaapUren');
  const nachtenBoven4 = cpap.filter((p) => p.y >= 4).length;

  return (
    <div className="pagina">
      <Kop
        titel="Herstel"
        sub="Slaap, CPAP en hartslag"
        rechts={
          <button className="icoonknop" aria-label="Koppelingen" onClick={() => nav.ga({ naam: 'koppelingen' })}>
            <IcoonKoppeling />
          </button>
        }
      />
      <Segment<Periode>
        label="Periode"
        waarde={periode}
        zet={setPeriode}
        opties={[
          { waarde: 14, tekst: '14 dagen' },
          { waarde: 30, tekst: '30 dagen' },
          { waarde: 90, tekst: '90 dagen' },
        ]}
      />
      <div className="tegels">
        <div className="tegel">
          <span className="label">Gem. slaap</span>
          <b>{gSlaap != null ? uurMin(gSlaap) : '–'}</b>
        </div>
        <div className="tegel">
          <span className="label">Gem. AHI</span>
          <b style={{ color: gAhi != null && gAhi > 5 ? 'var(--geel)' : undefined }}>{gAhi != null ? fmt1(gAhi) : '–'}</b>
        </div>
        <div className="tegel">
          <span className="label">Gem. masker op</span>
          <b>{gCpap != null ? uurMin(gCpap) : '–'}</b>
        </div>
        <div className="tegel">
          <span className="label">Nachten ≥ 4 uur</span>
          <b>
            {cpap.length ? nachtenBoven4 : '–'}
            {cpap.length > 0 && <small>/ {cpap.length}</small>}
          </b>
        </div>
      </div>

      <div className="knoprij">
        <button className="knop" onClick={() => setCheck(d)}>
          Ochtendcheck
        </button>
        <button className="knop" onClick={() => setImporteer(true)}>
          Gegevens ophalen
        </button>
      </div>

      {data.length === 0 && (
        <div className="kaart">
          <p>Nog geen nachten in deze periode.</p>
          <p className="dun klein">
            Vul elke ochtend de ochtendcheck in (AHI en masker-tijd uit de prisma APP), of koppel Apple Health en SleepHQ via <b>Meer → Koppelingen</b>.
          </p>
        </div>
      )}

      {scores.length > 0 && (
        <section className="kaart" aria-label="Herstelscore">
          <h2>Herstelscore</h2>
          <LijnGrafiek label="Herstelscore per dag" punten={scores} doel={75} doelLabel="goed (75)" decimalen={0} />
        </section>
      )}

      {(slaap.length > 0 || cpap.length > 0) && (
        <section className="kaart" aria-label="Slaap">
          <h2>Slaap</h2>
          {slaap.length > 0 ? (
            <StaafGrafiek
              label="Uren slaap per nacht"
              punten={slaap}
              eenheid="uur"
              doel={staat.instellingen.slaapDoel}
              doelLabel={`doel ${uurMin(staat.instellingen.slaapDoel)}`}
              kleur={(y) => (y < staat.instellingen.slaapDoel - 1 ? 'var(--geel)' : undefined)}
            />
          ) : (
            <p className="dun klein">Geen slaapgegevens uit Apple Health. Hieronder de tijd met je masker op.</p>
          )}
          {cpap.length > 0 && (
            <>
              <span className="label">CPAP: uren masker op</span>
              <StaafGrafiek label="Uren CPAP per nacht" punten={cpap} eenheid="uur" doel={4} doelLabel="minimaal 4 uur" kleur={(y) => (y < 4 ? 'var(--rood)' : undefined)} />
            </>
          )}
        </section>
      )}

      {ahi.length > 0 && (
        <section className="kaart" aria-label="AHI">
          <h2>AHI</h2>
          <p className="dun klein">Ademstops per uur met je CPAP. Onder de 5 is goed behandeld.</p>
          <LijnGrafiek label="AHI per nacht" punten={ahi} doel={5} doelLabel="grens 5" vanafNul />
        </section>
      )}

      {hrv.length > 0 && (
        <section className="kaart" aria-label="Hartslagvariabiliteit">
          <h2>Hartslagvariabiliteit (HRV)</h2>
          <p className="dun klein">Hoger dan je normaal is beter hersteld. Vergelijk alleen met jezelf.</p>
          <LijnGrafiek label="HRV per dag" punten={hrv} eenheid="ms" decimalen={0} />
        </section>
      )}

      {rhr.length > 0 && (
        <section className="kaart" aria-label="Rusthartslag">
          <h2>Rusthartslag</h2>
          <p className="dun klein">Een paar slagen hoger dan normaal kan wijzen op vermoeidheid of een opkomende verkoudheid.</p>
          <LijnGrafiek label="Rusthartslag per dag" punten={rhr} eenheid="slagen/min" decimalen={0} />
        </section>
      )}

      {data.length > 0 && (
        <section className="sectie" aria-label="Per nacht">
          <span className="label">Per nacht (tik om aan te passen)</span>
          <div className="tabel-wrap">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Ochtend</th>
                  <th>Slaap</th>
                  <th>CPAP</th>
                  <th>AHI</th>
                  <th>HRV</th>
                  <th>Rust-HS</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {[...data].reverse().map((x) => {
                  const s = berekenHerstel(staat, x.datum).score;
                  return (
                    <tr key={x.datum} onClick={() => setCheck(x.datum)} style={{ cursor: 'pointer' }}>
                      <td>{dagDatum(x.datum)}</td>
                      <td title={bronNaam(x.bronnen.slaapUren)}>{x.slaapUren != null ? uurMin(x.slaapUren) : <span className="zacht">–</span>}</td>
                      <td title={bronNaam(x.bronnen.cpapUren)}>{x.cpapUren != null ? uurMin(x.cpapUren) : <span className="zacht">–</span>}</td>
                      <td style={{ color: x.ahi != null && x.ahi > 5 ? 'var(--geel)' : undefined }}>{x.ahi != null ? fmt1(x.ahi) : <span className="zacht">–</span>}</td>
                      <td>{x.hrv != null ? Math.round(x.hrv) : <span className="zacht">–</span>}</td>
                      <td>{x.rustHartslag != null ? Math.round(x.rustHartslag) : <span className="zacht">–</span>}</td>
                      <td>{s ?? <span className="zacht">–</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <OchtendCheck open={check != null} datum={check ?? d} sluit={() => setCheck(null)} />
      <ImportBlad open={importeer} sluit={() => setImporteer(false)} />
    </div>
  );
}
