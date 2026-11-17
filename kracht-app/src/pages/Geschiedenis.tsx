import { useState } from 'react';
import { Kop } from '../components/Basis';
import { IcoonPotlood, IcoonPrullenbak, IcoonVerder } from '../components/Iconen';
import { dagDatum, langDatum, minutenTussen, tijd } from '../lib/datum';
import { gewichtLabel, zoekOefening } from '../lib/oefeningen';
import { aantalWerkSets, recordsIn, setTekst, tonnage, werkSets } from '../lib/progressie';
import type { Training } from '../lib/types';
import { useNav, useWinkel } from '../lib/winkel';

const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

export function Geschiedenis() {
  const { staat } = useWinkel();
  const nav = useNav();
  const lijst = staat.trainingen.filter((t) => t.status === 'klaar').sort((a, b) => b.start.localeCompare(a.start));
  const perMaand = new Map<string, Training[]>();
  for (const t of lijst) {
    const k = t.datum.slice(0, 7);
    perMaand.set(k, [...(perMaand.get(k) ?? []), t]);
  }
  return (
    <div className="pagina">
      <Kop titel="Alle trainingen" sub={`${lijst.length} opgeslagen`} terug />
      {lijst.length === 0 && <div className="leeg">Nog geen trainingen. Start je eerste vanaf Vandaag.</div>}
      {[...perMaand.entries()].map(([maand, ts]) => (
        <section key={maand} className="sectie">
          <span className="label">
            {MAANDEN[Number(maand.slice(5, 7)) - 1]} {maand.slice(0, 4)} · {ts.length}×
          </span>
          <div className="lijst">
            {ts.map((t) => (
              <button key={t.id} className="lijstitem" onClick={() => nav.ga({ naam: 'training', id: t.id })}>
                <div className="groei">
                  <div className="titel">{t.dagNaam.split(' · ')[0]}</div>
                  <div className="dun klein getal">
                    {dagDatum(t.datum)} · {t.eind ? `${minutenTussen(t.start, t.eind)} min · ` : ''}
                    {aantalWerkSets(t)} sets · {Math.round(tonnage(t)).toLocaleString('nl-NL')} kg
                  </div>
                </div>
                <IcoonVerder className="chevron" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TrainingDetail({ id }: { id: string }) {
  const { staat, wijzig, melding } = useWinkel();
  const nav = useNav();
  const [verwijder, setVerwijder] = useState(false);
  const t = staat.trainingen.find((x) => x.id === id);
  if (!t) return (
    <div className="pagina">
      <Kop titel="Training" terug />
      <div className="leeg">Deze training bestaat niet meer.</div>
    </div>
  );
  const records = recordsIn(staat, t);

  return (
    <div className="pagina">
      <Kop titel={t.dagNaam.split(' · ')[0]} sub={`${langDatum(t.datum)} · ${tijd(t.start)}`} terug />
      <div className="tegels">
        <div className="tegel">
          <span className="label">Duur</span>
          <b>
            {t.eind ? minutenTussen(t.start, t.eind) : '–'}
            <small>min</small>
          </b>
        </div>
        <div className="tegel">
          <span className="label">Sets</span>
          <b>{aantalWerkSets(t)}</b>
        </div>
        <div className="tegel">
          <span className="label">Verplaatst</span>
          <b>
            {Math.round(tonnage(t)).toLocaleString('nl-NL')}
            <small>kg</small>
          </b>
        </div>
        <div className="tegel">
          <span className="label">Zwaarte</span>
          <b>
            {t.zwaarte ?? '–'}
            <small>/ 10</small>
          </b>
        </div>
      </div>
      <div className="keuzes">
        <span className="pil">Blok-week {t.blokWeek}{t.deload ? ' (licht)' : ''}</span>
        {t.herstelScore != null && <span className="pil">Herstel {t.herstelScore}</span>}
        {t.aanpassing !== 'normaal' && <span className="pil geel">{t.aanpassing === 'licht' ? 'Lichter getraind' : 'Herstelsessie'}</span>}
        {records.length > 0 && <span className="pil groen">{records.length} record{records.length > 1 ? 's' : ''}</span>}
      </div>
      {t.notitie && <p className="dun">“{t.notitie}”</p>}
      <div className="lijst">
        {t.oefeningen.filter((l) => werkSets(l).length).map((l, i) => {
          const oef = zoekOefening(l.oefeningId, staat.eigenOefeningen);
          const rec = records.find((r) => r.oefeningId === l.oefeningId);
          return (
            <button key={i} className="lijstitem" onClick={() => nav.ga({ naam: 'oefening', id: l.oefeningId })}>
              <div className="groei">
                <div className="titel">
                  {oef?.naam ?? l.oefeningId} {rec && <span className="pil groen">record</span>}
                </div>
                <div className="dun klein getal">
                  {werkSets(l)
                    .map((x) => `${setTekst(x, oef)}${x.rir != null ? ` @${x.rir}` : ''}`)
                    .join(' · ')}{' '}
                  {oef && gewichtLabel(oef) ? `(${gewichtLabel(oef)})` : ''}
                </div>
                {l.notitie && <div className="dun mini">Notitie: {l.notitie}</div>}
              </div>
            </button>
          );
        })}
      </div>
      <p className="dun mini">@ = herhalingen in reserve (RIR).</p>
      <button
        className="knop"
        onClick={() => wijzig((s) => ({ ...s, trainingen: s.trainingen.map((x) => (x.id === id ? { ...x, status: 'bezig' } : x)) }))}
      >
        <IcoonPotlood /> Sets aanpassen
      </button>
      {!verwijder ? (
        <button className="knop stil gevaar" onClick={() => setVerwijder(true)}>
          <IcoonPrullenbak /> Training verwijderen
        </button>
      ) : (
        <div className="kaart" style={{ borderColor: 'var(--rood)' }}>
          <p>Deze training definitief verwijderen? Dit kan niet ongedaan worden gemaakt.</p>
          <div className="knoprij">
            <button className="knop" onClick={() => setVerwijder(false)}>
              Nee
            </button>
            <button
              className="knop vol-gevaar"
              onClick={() => {
                wijzig((s) => ({ ...s, trainingen: s.trainingen.filter((x) => x.id !== id) }));
                melding('Training verwijderd');
                nav.terug();
              }}
            >
              Ja, verwijderen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
