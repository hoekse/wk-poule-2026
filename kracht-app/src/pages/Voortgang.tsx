import { useMemo, useState } from 'react';
import { Kop } from '../components/Basis';
import { LijnGrafiek, StaafGrafiek } from '../components/Grafiek';
import { IcoonLijst, IcoonVerder, IcoonWeegschaal } from '../components/Iconen';
import { kortDatum, maandagVan, plusDagen, vandaag } from '../lib/datum';
import { SPIERNAMEN, zoekOefening } from '../lib/oefeningen';
import { e1rm, e1rmReeks, fmtKg, geschiedenis, recordsIn, setsPerSpier, tonnage, trainingenPerWeek, werkSets } from '../lib/progressie';
import { gewichtReeks, gewichtsTempo } from '../lib/lichaam';
import type { Datum, Spiergroep } from '../lib/types';
import { useNav, useWinkel } from '../lib/winkel';

const SPIER_VOLGORDE: Spiergroep[] = ['borst', 'rug', 'schouders', 'quadriceps', 'hamstrings', 'billen', 'biceps', 'triceps', 'kuiten', 'romp'];

export function Voortgang() {
  const { staat } = useWinkel();
  const nav = useNav();
  const d = vandaag();
  const klaar = staat.trainingen.filter((t) => t.status === 'klaar');

  const oefeningen = useMemo(() => {
    const tel = new Map<string, number>();
    for (const t of klaar) for (const l of t.oefeningen) if (werkSets(l).some((x) => (x.gewicht ?? 0) > 0)) tel.set(l.oefeningId, (tel.get(l.oefeningId) ?? 0) + 1);
    return [...tel.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [klaar]);
  const [gekozen, setGekozen] = useState<string>('');
  const oefId = gekozen && oefeningen.includes(gekozen) ? gekozen : oefeningen[0];
  const reeks = oefId ? e1rmReeks(staat, oefId) : [];

  const weken = trainingenPerWeek(staat);
  const dezeWeek = maandagVan(d);
  const weekLijst = Array.from({ length: 12 }, (_, i) => plusDagen(dezeWeek, (i - 11) * 7));
  const perWeek = weekLijst.map((w) => ({ x: w, y: weken.get(w) ?? 0 }));
  const tonPerWeek = weekLijst.map((w) => ({
    x: w,
    y: Math.round(klaar.filter((t) => maandagVan(t.datum) === w).reduce((s, t) => s + tonnage(t), 0)),
  }));
  const laatste8 = perWeek.slice(-9, -1);
  const gemPerWeek = laatste8.reduce((s, p) => s + p.y, 0) / 8;
  const dezeMaand = klaar.filter((t) => t.datum.slice(0, 7) === d.slice(0, 7)).length;
  const sets7 = setsPerSpier(staat, plusDagen(d, -6), d);
  const records30 = klaar.filter((t) => t.datum >= plusDagen(d, -30)).reduce((n, t) => n + recordsIn(staat, t).length, 0);
  const gewicht = gewichtReeks(staat).filter((p) => p.x >= plusDagen(d, -180));
  const doelPerWeek = staat.instellingen.trainingsdagen.length;
  const tempo = gewichtsTempo(staat, d);
  const vo2 = Object.values(staat.dagdata)
    .filter((x) => x.vo2max && x.datum >= plusDagen(d, -365))
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .map((x) => ({ x: x.datum, y: x.vo2max! }));
  const intervalMinuten = klaar
    .filter((t) => t.datum >= plusDagen(d, -27))
    .flatMap((t) => t.oefeningen.filter((l) => zoekOefening(l.oefeningId, staat.eigenOefeningen)?.spieren[0] === 'conditie'))
    .reduce((som, l) => som + werkSets(l).reduce((a, x) => a + (x.reps ?? 0), 0), 0) / 60;

  const besteSet = (() => {
    if (!oefId) return null;
    let beste: { g: number; r: number; e: number; datum: Datum } | null = null;
    for (const { training, log } of geschiedenis(staat, oefId)) {
      for (const x of werkSets(log)) {
        const e = e1rm(x.gewicht ?? 0, x.reps ?? 0, x.rir);
        if (!beste || e > beste.e) beste = { g: x.gewicht ?? 0, r: x.reps ?? 0, e, datum: training.datum };
      }
    }
    return beste;
  })();

  return (
    <div className="pagina">
      <Kop
        titel="Voortgang"
        rechts={
          <button className="icoonknop" aria-label="Alle trainingen" onClick={() => nav.ga({ naam: 'geschiedenis' })}>
            <IcoonLijst />
          </button>
        }
      />
      <div className="tegels">
        <div className="tegel">
          <span className="label">Deze maand</span>
          <b>
            {dezeMaand}
            <small>trainingen</small>
          </b>
        </div>
        <div className="tegel">
          <span className="label">Gem. per week</span>
          <b>
            {gemPerWeek.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
            <small>/ {doelPerWeek}</small>
          </b>
        </div>
        <div className="tegel">
          <span className="label">Totaal</span>
          <b>
            {klaar.length}
            <small>trainingen</small>
          </b>
        </div>
        <div className="tegel">
          <span className="label">Records (30 d)</span>
          <b>{records30}</b>
        </div>
      </div>

      <section className="kaart" aria-label="Kracht per oefening">
        <div className="rij tussen">
          <h2>Kracht</h2>
        </div>
        {oefeningen.length === 0 ? (
          <div className="leeg">Na je eerste training zie je hier per oefening hoe sterk je wordt.</div>
        ) : (
          <>
            <select id="voortgang-oefening" className="invoer" value={oefId} onChange={(e) => setGekozen(e.target.value)} aria-label="Oefening">
              {oefeningen.map((id) => (
                <option key={id} value={id}>
                  {zoekOefening(id, staat.eigenOefeningen)?.naam ?? id}
                </option>
              ))}
            </select>
            <p className="dun klein">
              Geschatte 1-herhalingsmaximum per training: wat je theoretisch één keer zou kunnen tillen. Stijgt die lijn, dan word je sterker.
            </p>
            <LijnGrafiek label="Geschat maximum" punten={reeks.map((p) => ({ x: p.datum, y: Math.round(p.waarde * 10) / 10 }))} eenheid="kg" />
            {reeks.length >= 2 && (
              <p className="klein">
                {(() => {
                  const verschil = reeks[reeks.length - 1].waarde - reeks[0].waarde;
                  const pct = (verschil / reeks[0].waarde) * 100;
                  return `${verschil >= 0 ? '+' : ''}${fmtKg(Math.round(verschil * 10) / 10)} kg (${verschil >= 0 ? '+' : ''}${Math.round(pct)}%) sinds ${kortDatum(reeks[0].datum)}.`;
                })()}{' '}
                {besteSet && `Beste set: ${fmtKg(besteSet.g)} kg × ${besteSet.r} op ${kortDatum(besteSet.datum)}.`}
              </p>
            )}
            <button className="knop klein" onClick={() => nav.ga({ naam: 'oefening', id: oefId })}>
              Alles over deze oefening
            </button>
          </>
        )}
      </section>

      <section className="kaart" aria-label="Sets per spiergroep">
        <h2>Sets per spiergroep</h2>
        <p className="dun klein">Afgelopen 7 dagen. Tussen de streepjes (8-16 sets) groeien spieren het best.</p>
        <div className="hbalken">
          {SPIER_VOLGORDE.map((sp) => {
            const n = sets7[sp] ?? 0;
            const schaal = 20;
            const metZone = sp !== 'romp' && sp !== 'kuiten';
            return (
              <div key={sp} className="hbalk">
                <span>{SPIERNAMEN[sp]}</span>
                <div className="spoor" aria-hidden="true">
                  {metZone && <span className="zone" style={{ left: `${(8 / schaal) * 100}%`, width: `${(8 / schaal) * 100}%` }} />}
                  <i style={{ width: `${Math.min(100, (n / schaal) * 100)}%`, opacity: n ? 1 : 0 }} />
                </div>
                <b>{n.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}</b>
              </div>
            );
          })}
        </div>
      </section>

      <section className="kaart" aria-label="Trainingen per week">
        <h2>Trainingen per week</h2>
        <StaafGrafiek
          label="Trainingen per week, laatste 12 weken"
          punten={perWeek}
          doel={doelPerWeek}
          doelLabel={`doel ${doelPerWeek}`}
          decimalen={0}
          eenheid="trainingen"
          kleur={(y) => (y >= doelPerWeek ? 'var(--groen)' : undefined)}
        />
      </section>

      <section className="kaart" aria-label="Conditie">
        <h2>Conditie</h2>
        {vo2.length > 0 ? (
          <>
            <p className="dun klein">VO2max van je Apple Watch (ml/kg/min): hoe hoger, hoe fitter. Stijgt door de intervallen en door af te vallen.</p>
            <LijnGrafiek label="VO2max" punten={vo2} eenheid="ml/kg/min" hoogte={150} />
          </>
        ) : (
          <p className="dun klein">Haal je VO2max (Cardiofitheid) op uit Apple Health, dan zie je hier hoe fit je wordt.</p>
        )}
        <p className="klein getal">
          Intervallen afgelopen 4 weken: {intervalMinuten.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} minuten voluit.
        </p>
      </section>

      <section className="kaart" aria-label="Totaal verplaatst gewicht per week">
        <h2>Totaal verplaatst per week</h2>
        <p className="dun klein">Gewicht × herhalingen van alle sets bij elkaar.</p>
        <StaafGrafiek label="Kilo's per week" punten={tonPerWeek} eenheid="kg" decimalen={0} />
      </section>

      <button className="kaart" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => nav.ga({ naam: 'lichaam' })}>
        <div className="rij">
          <IcoonWeegschaal style={{ width: 24, height: 24, color: 'var(--tekst-2)' }} />
          <h2 className="groei">Lichaamsgewicht</h2>
          <IcoonVerder style={{ width: 20, height: 20, color: 'var(--tekst-3)' }} />
        </div>
        {gewicht.length ? (
          <>
            <LijnGrafiek label="Lichaamsgewicht, laatste 6 maanden" punten={gewicht} eenheid="kg" hoogte={150} />
            {tempo && <p className="klein">{tempo.tekst}</p>}
          </>
        ) : (
          <p className="dun klein">Nog geen gewicht. Komt automatisch uit Apple Health, of vul een meting in.</p>
        )}
      </button>
    </div>
  );
}
