import { useState } from 'react';
import { Ring, Segment, scoreKleur } from '../components/Basis';
import { IcoonLet, IcoonVink } from '../components/Iconen';
import { ImportBlad, OchtendCheck } from '../components/Invoer';
import { DAGEN_KORT, dagenTussen, langDatum, vandaag, weekdag } from '../lib/datum';
import { berekenHerstel } from '../lib/herstel';
import { repLabel } from '../lib/oefeningen';
import { advies, fmtKg } from '../lib/progressie';
import { blokInfo, kiesOefening, volgendeDag, weekOverzicht } from '../lib/schema';
import { maakTraining } from '../lib/staat';
import type { Aanpassing } from '../lib/types';
import { useNav, useWinkel } from '../lib/winkel';

function groet(): string {
  const u = new Date().getHours();
  return u < 6 ? 'Goedenacht' : u < 12 ? 'Goedemorgen' : u < 18 ? 'Goedemiddag' : 'Goedenavond';
}

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
  const backupOud = aantalKlaar >= 3 && (!inst.laatsteBackup || dagenTussen(inst.laatsteBackup.slice(0, 10), d) > 7);

  const start = () => wijzig((s) => ({ ...s, trainingen: [...s.trainingen, maakTraining(s, dag.id, aanpassing)] }));

  return (
    <div className="pagina">
      <header className="kop">
        <h1>
          {groet()}
          {inst.naam ? `, ${inst.naam}` : ''}
          <span className="sub">{langDatum(d)}</span>
        </h1>
      </header>

      <section className="kaart" aria-label="Herstel">
        <div className="herstel">
          <Ring score={herstel.score} niveau={herstel.niveau} />
          <div className="sectie" style={{ gap: 4 }}>
            <h2>{herstel.kop}</h2>
            <p className="dun klein">{herstel.advies}</p>
          </div>
        </div>
        {herstel.onderdelen.length > 0 && (
          <div className="onderdelen">
            {herstel.onderdelen.map((o) => (
              <div key={o.sleutel} className="onderdeel">
                <span>{o.naam}</span>
                <span className="dun getal">{o.toelichting}</span>
                <div className="balk">
                  <i style={{ width: `${Math.max(3, o.score)}%`, background: scoreKleur(o.score) }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {herstel.waarschuwingen.map((w) => (
          <div key={w} className="melding">
            <IcoonLet /> <span>{w}</span>
          </div>
        ))}
        <div className="knoprij">
          <button className="knop" onClick={() => setCheck(true)}>
            Ochtendcheck
          </button>
          <button className="knop" onClick={() => setOphalen(true)}>
            Apple Health
          </button>
        </div>
      </section>

      <section className="kaart" aria-label="Volgende training">
        <div className="rij tussen">
          <span className="label">Volgende training</span>
          <span className={`pil ${blok.deload ? 'geel' : 'blauw'}`}>{blok.label}</span>
        </div>
        <div>
          <h2>{dag.naam}</h2>
          <p className="dun">{dag.focus}</p>
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
                    {a.gewicht != null ? ` · ${fmtKg(a.gewicht)} kg` : ''}
                    {ontbreekt ? ' · apparaat ontbreekt' : ''}
                  </div>
                </div>
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
          Start {dag.naam}
        </button>
        <p className="dun mini">{blok.uitleg}</p>
      </section>

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
        <button className="melding" style={{ border: 0, textAlign: 'left' }} onClick={() => nav.ga({ naam: 'backup' })}>
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
