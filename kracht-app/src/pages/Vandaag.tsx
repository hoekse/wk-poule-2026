import { useState } from 'react';
import { Ring, Segment, scoreKleur } from '../components/Basis';
import { IcoonDruppel, IcoonGevoel, IcoonHart, IcoonLet, IcoonMaan, IcoonMasker, IcoonPuls, IcoonStart, IcoonVink } from '../components/Iconen';
import { ImportBlad, OchtendCheck } from '../components/Invoer';
import { DAGEN_KORT, dagenTussen, langDatum, plusDagen, vandaag, weekdag } from '../lib/datum';
import { berekenHerstel, type Onderdeel } from '../lib/herstel';
import { gewichtLabel, repLabel } from '../lib/oefeningen';
import { advies, fmtKg } from '../lib/progressie';
import { blokInfo, kiesOefening, volgendeDag, weekOverzicht } from '../lib/schema';
import { maakTraining } from '../lib/staat';
import type { Aanpassing } from '../lib/types';
import { useNav, useWinkel } from '../lib/winkel';

function groet(): string {
  const u = new Date().getHours();
  return u < 6 ? 'Goedenacht' : u < 12 ? 'Goedemorgen' : u < 18 ? 'Goedemiddag' : 'Goedenavond';
}

const ICOON: Record<Onderdeel['sleutel'], typeof IcoonMaan> = {
  slaap: IcoonMaan,
  cpap: IcoonMasker,
  zuurstof: IcoonDruppel,
  hrv: IcoonHart,
  rusthartslag: IcoonPuls,
  gevoel: IcoonGevoel,
};

const NIVEAU_PIL = { groen: 'groen', oranje: 'geel', rood: 'rood', onbekend: '' } as const;

export function Vandaag() {
  const { staat, wijzig } = useWinkel();
  const nav = useNav();
  const [check, setCheck] = useState(false);
  const [ophalen, setOphalen] = useState(false);
  const d = vandaag();
  const inst = staat.instellingen;
  const herstel = berekenHerstel(staat, d);
  const [keuze, setKeuze] = useState<Aanpassing | null>(null);
  const aanpassing = keuze ?? herstel.aanpassing;
  const dag = volgendeDag(staat);
  const blok = blokInfo(inst, d);
  const week = weekOverzicht(staat, d);
  const vandaagGedaan = staat.trainingen.filter((t) => t.datum === d && t.status === 'klaar');
  const geplandVandaag = inst.trainingsdagen.includes(weekdag(d));
  const aantalKlaar = staat.trainingen.filter((t) => t.status === 'klaar').length;
  const stappenGisteren = staat.dagdata[plusDagen(d, -1)]?.stappen;
  const backupOud = aantalKlaar >= 3 && (!inst.laatsteBackup || dagenTussen(inst.laatsteBackup.slice(0, 10), d) > 7);
  const initiaal = (inst.naam.trim()[0] ?? 'K').toUpperCase();

  const start = () => wijzig((s) => ({ ...s, trainingen: [...s.trainingen, maakTraining(s, dag.id, aanpassing)] }));

  return (
    <div className="pagina">
      <header className="kop">
        <h1>
          <span className="boven">{langDatum(d)}</span>
          {groet()}
          {inst.naam ? `, ${inst.naam}` : ''}
        </h1>
        <button className="avatar" aria-label="Meer en instellingen" onClick={() => nav.zetTab('meer')}>
          {initiaal}
        </button>
      </header>

      <section className="kaart" aria-label="Herstel">
        <div className="herstel">
          <Ring score={herstel.score} niveau={herstel.niveau} groot />
          <div className="sectie" style={{ gap: 6 }}>
            {herstel.niveau !== 'onbekend' && (
              <span className={`pil ${NIVEAU_PIL[herstel.niveau]}`} style={{ alignSelf: 'flex-start' }}>
                {herstel.aanpassing === 'normaal' ? 'Volgens schema' : herstel.aanpassing === 'licht' ? 'Iets lichter' : 'Herstel'}
              </span>
            )}
            <h2>{herstel.kop}</h2>
            <p className="dun klein">{herstel.advies}</p>
          </div>
        </div>
        <div className="knoprij">
          <button className="knop" onClick={() => setCheck(true)}>
            Ochtendcheck
          </button>
          <button className="knop" onClick={() => setOphalen(true)}>
            Apple Health
          </button>
        </div>
      </section>

      {herstel.onderdelen.length > 0 && (
        <section className="statgrid" aria-label="Vannacht">
          {herstel.onderdelen.map((o) => {
            const Icoon = ICOON[o.sleutel];
            const kleur = scoreKleur(o.score);
            return (
              <div key={o.sleutel} className="stat">
                <div className="stat-kop">
                  <Icoon />
                  {o.naam}
                  <span className="stip" style={{ background: kleur, color: kleur }} aria-hidden="true" />
                </div>
                <b>{o.hoofd}</b>
                <span className="stat-sub">{o.toelichting}</span>
                <div className="balk">
                  <i style={{ width: `${Math.max(4, o.score)}%`, background: kleur }} />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {herstel.waarschuwingen.map((w) => (
        <div key={w} className="melding">
          <IcoonLet /> <span>{w}</span>
        </div>
      ))}

      <section className="kaart uitgelicht" aria-label="Volgende training">
        <div className="rij tussen">
          <span className="label">Volgende training</span>
          <span className={`pil ${blok.deload ? 'geel' : 'blauw'}`}>{blok.label}</span>
        </div>
        <div>
          <h2 style={{ fontSize: '1.9rem' }}>{dag.naam}</h2>
          <p className="dun" style={{ marginTop: 4 }}>
            {dag.focus}
          </p>
        </div>
        {vandaagGedaan.length > 0 && (
          <div className="melding blauw">
            <IcoonVink /> <span>Vandaag al getraind: {vandaagGedaan.map((t) => t.dagNaam.split(' · ')[0]).join(', ')}. Morgen weer!</span>
          </div>
        )}
        {!vandaagGedaan.length && !geplandVandaag && <p className="dun klein">Vandaag staat geen training gepland. Toch gaan? Prima, dit is de volgende in je schema.</p>}
        <div className="lijst">
          {dag.slots.map((slot) => {
            const { oefening, ontbreekt } = kiesOefening(slot, inst, staat.eigenOefeningen);
            const a = advies(staat, slot, oefening, { rirExtra: blok.rirExtra, deload: blok.deload, aanpassing });
            return (
              <button key={slot.id} className="lijstitem" onClick={() => nav.ga({ naam: 'oefening', id: oefening.id })}>
                <div className="groei">
                  <div className="titel">{oefening.naam}</div>
                  <div className="dun klein getal">
                    {a.sets} × {a.repMin}-{a.repMax}
                    {repLabel(oefening.id) === 'sec' ? ' sec' : ''} · RIR {a.rir}
                    {ontbreekt ? ' · apparaat ontbreekt' : ''}
                  </div>
                </div>
                {a.gewicht != null && (
                  <span className="rechts" title={gewichtLabel(oefening)}>
                    {fmtKg(a.gewicht)} kg
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="veld">
          <span>Zwaarte van vandaag</span>
          <Segment<Aanpassing>
            label="Zwaarte"
            waarde={aanpassing}
            zet={setKeuze}
            opties={[
              { waarde: 'normaal', tekst: 'Volgens schema' },
              { waarde: 'licht', tekst: 'Lichter' },
              { waarde: 'herstel', tekst: 'Herstel' },
            ]}
          />
        </div>
        <button className="knop primair groot" onClick={start}>
          <IcoonStart /> Start {dag.naam}
        </button>
        <p className="dun mini">{blok.uitleg}</p>
      </section>

      {!geplandVandaag && !vandaagGedaan.length && (
        <section className="kaart" aria-label="Rustdag">
          <h3>Rustdag</h3>
          <p className="dun klein">
            Beweeg 30-45 minuten rustig: wandelen of fietsen in een tempo waarin je nog kunt praten. Dat helpt bij aftrainen en herstel, zonder je krachttraining
            te hinderen.
          </p>
          {stappenGisteren != null && (
            <p className="klein getal">
              Stappen gisteren: <b>{Math.round(stappenGisteren).toLocaleString('nl-NL')}</b> {stappenGisteren >= 8000 ? '(doel 8.000 gehaald)' : '(doel 8.000)'}
            </p>
          )}
        </section>
      )}

      <section className="sectie" aria-label="Deze week">
        <span className="label">Deze week</span>
        <div className="week">
          {week.map((w) => {
            const gedaan = w.trainingen.length > 0;
            return (
              <div key={w.datum} className={`weekdag${w.datum === d ? ' vandaag' : ''}`}>
                {DAGEN_KORT[weekdag(w.datum) - 1]}
                <span className={`stip${gedaan ? ' gedaan' : w.gepland ? ' gepland' : ''}`}>
                  {gedaan ? <IcoonVink /> : w.gepland ? '•' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {backupOud && (
        <button className="melding" style={{ border: 0 }} onClick={() => nav.ga({ naam: 'backup' })}>
          <IcoonLet />
          <span>
            <b>Maak een back-up.</b> Je laatste back-up is {inst.laatsteBackup ? 'meer dan een week oud' : 'nog nooit gemaakt'}. Tik hier; het kost 10 seconden.
          </span>
        </button>
      )}

      <OchtendCheck open={check} sluit={() => setCheck(false)} />
      <ImportBlad open={ophalen} sluit={() => setOphalen(false)} />
    </div>
  );
}
