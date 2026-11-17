import { Kop } from '../components/Basis';
import { LijnGrafiek } from '../components/Grafiek';
import { MachineInstelling } from '../components/Machine';
import { dagDatum } from '../lib/datum';
import { APPARATUUR, beschikbaar, gewichtLabel, repLabel, SPIERNAMEN, zoekOefening } from '../lib/oefeningen';
import { e1rm, e1rmReeks, fmtKg, geschiedenis, setTekst, werkSets } from '../lib/progressie';
import { useNav, useWinkel } from '../lib/winkel';

export function OefeningDetail({ id }: { id: string }) {
  const { staat } = useWinkel();
  const nav = useNav();
  const oef = zoekOefening(id, staat.eigenOefeningen);
  if (!oef) return (
    <div className="pagina">
      <Kop titel="Oefening" terug />
      <div className="leeg">Onbekende oefening.</div>
    </div>
  );
  const hist = geschiedenis(staat, id);
  const reeks = e1rmReeks(staat, id);
  const sec = repLabel(id) === 'sec';
  const beste = hist.flatMap(({ training, log }) => werkSets(log).map((x) => ({ x, datum: training.datum }))).sort(
    (a, b) => e1rm(b.x.gewicht ?? 0, b.x.reps ?? 0, b.x.rir) - e1rm(a.x.gewicht ?? 0, a.x.reps ?? 0, a.x.rir),
  )[0];
  const kan = beschikbaar(oef, staat.instellingen.apparatuur);

  return (
    <div className="pagina">
      <Kop titel={oef.naam} terug />
      <div className="keuzes">
        {oef.spieren.map((s, i) => (
          <span key={s} className={`pil${i === 0 ? ' blauw' : ''}`}>
            {SPIERNAMEN[s]}
          </span>
        ))}
        {!kan && <span className="pil geel">apparaat niet aangevinkt</span>}
      </div>
      <MachineInstelling oef={oef} />
      {oef.tips.length > 0 && (
        <section className="kaart">
          <h3>Uitvoering</h3>
          <ul className="stappen">
            {oef.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="dun klein">
            Nodig: {oef.apparaat.length ? oef.apparaat.map((a) => APPARATUUR.find((x) => x.id === a)?.naam).join(', ') : 'niets'}. Gewicht noteer je als {gewichtLabel(oef)}.
          </p>
        </section>
      )}
      {reeks.length > 0 && !sec && (
        <section className="kaart">
          <h3>Geschat maximum</h3>
          <LijnGrafiek label={`Geschat maximum ${oef.naam}`} punten={reeks.map((p) => ({ x: p.datum, y: Math.round(p.waarde * 10) / 10 }))} eenheid="kg" />
          {beste && (
            <p className="klein">
              Beste set: {fmtKg(beste.x.gewicht)} kg × {beste.x.reps} op {dagDatum(beste.datum)} (geschat maximum {fmtKg(Math.round(e1rm(beste.x.gewicht ?? 0, beste.x.reps ?? 0, beste.x.rir) * 10) / 10)} kg).
            </p>
          )}
        </section>
      )}
      <section className="sectie">
        <span className="label">Geschiedenis ({hist.length}×)</span>
        {hist.length === 0 ? (
          <div className="leeg">Nog niet gedaan.</div>
        ) : (
          <div className="lijst">
            {hist.map(({ training, log }) => (
              <button key={training.id} className="lijstitem" onClick={() => nav.ga({ naam: 'training', id: training.id })}>
                <div className="groei">
                  <div className="titel getal">
                    {werkSets(log)
                      .map((x) => setTekst(x, oef))
                      .join(' · ')}
                  </div>
                  <div className="dun klein">
                    {dagDatum(training.datum)} · {training.dagNaam.split(' · ')[0]}
                    {log.notitie ? ` · ${log.notitie}` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
