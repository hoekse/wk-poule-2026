import { useState } from 'react';
import { Segment } from '../components/Basis';
import { IcoonHalter } from '../components/Iconen';
import { DAGEN_KORT, maandagVan, vandaag } from '../lib/datum';
import { APPARATUUR } from '../lib/oefeningen';
import { SCHEMAS, standaardDagen } from '../lib/schema';
import type { SchemaId } from '../lib/types';
import { useWinkel } from '../lib/winkel';

export function Onboarding() {
  const { staat, wijzig } = useWinkel();
  const [stap, setStap] = useState(1);
  const inst = staat.instellingen;
  const zet = (f: (i: typeof inst) => typeof inst) => wijzig((s) => ({ ...s, instellingen: f(s.instellingen) }));
  const nodig = inst.schemaId === '3-dagen' ? 3 : 4;

  return (
    <div className="app" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
      <div className="pagina">
        <div className="rij" style={{ gap: 10, paddingTop: 12 }}>
          <IcoonHalter style={{ width: 32, height: 32, color: 'var(--accent)' }} />
          <span className="label">Stap {stap} van 3</span>
        </div>

        {stap === 1 && (
          <>
            <h1>Krachttraining bij FitButiq</h1>
            <p className="dun">
              Je persoonlijke schema, logboek en herstelmeter. Alles blijft op deze telefoon. We beginnen met drie vragen.
            </p>
            <label className="veld">
              <span>Je voornaam</span>
              <input id="ob-naam" className="invoer" autoComplete="given-name" value={inst.naam} onChange={(e) => zet((i) => ({ ...i, naam: e.target.value }))} />
            </label>
            <div className="veld">
              <span>Hoe vaak per week train je?</span>
              <Segment<SchemaId>
                label="Trainingen per week"
                waarde={inst.schemaId}
                zet={(id) => zet((i) => ({ ...i, schemaId: id, trainingsdagen: standaardDagen(id) }))}
                opties={[
                  { waarde: '3-dagen', tekst: '3× per week' },
                  { waarde: '4-dagen', tekst: '4× per week' },
                ]}
              />
              <p className="dun klein">{SCHEMAS[inst.schemaId].omschrijving}</p>
            </div>
            <div className="veld">
              <span>Op welke dagen ga je meestal? (kies er {nodig})</span>
              <div className="keuzes" role="group" aria-label="Trainingsdagen">
                {DAGEN_KORT.map((d, i) => {
                  const nr = i + 1;
                  const aan = inst.trainingsdagen.includes(nr);
                  return (
                    <button
                      key={d}
                      className="keuze"
                      style={{ flex: 1 }}
                      aria-pressed={aan}
                      onClick={() =>
                        zet((x) => ({ ...x, trainingsdagen: aan ? x.trainingsdagen.filter((n) => n !== nr) : [...x.trainingsdagen, nr].sort() }))
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="dun klein">Mis je een dag, dan schuift de volgende training gewoon door. Je loopt nooit achter.</p>
            </div>
            <button className="knop primair groot" onClick={() => setStap(2)}>
              Volgende
            </button>
          </>
        )}

        {stap === 2 && (
          <>
            <h1>Wat staat er bij FitButiq?</h1>
            <p className="dun">
              Vink aan wat er in de sportschool aan de Spoorstraat staat. Het schema kiest dan per oefening de beste variant. Twijfel je? Laat het aan staan en
              wissel later tijdens de training.
            </p>
            <div className="lijst">
              {APPARATUUR.map((a) => (
                <label key={a.id} className="vinkje">
                  <input
                    type="checkbox"
                    checked={inst.apparatuur[a.id]}
                    onChange={(e) => zet((i) => ({ ...i, apparatuur: { ...i.apparatuur, [a.id]: e.target.checked } }))}
                  />
                  <span className="groei">{a.naam}</span>
                </label>
              ))}
            </div>
            <div className="veld">
              <span>Kleinste stap tussen dumbbells</span>
              <Segment<number>
                label="Dumbbellstap"
                waarde={inst.dumbbellStap}
                zet={(n) => zet((i) => ({ ...i, dumbbellStap: n }))}
                opties={[
                  { waarde: 1, tekst: '1 kg' },
                  { waarde: 2, tekst: '2 kg' },
                  { waarde: 2.5, tekst: '2,5 kg' },
                ]}
              />
            </div>
            <div className="knoprij">
              <button className="knop" onClick={() => setStap(1)}>
                Terug
              </button>
              <button className="knop primair" onClick={() => setStap(3)}>
                Volgende
              </button>
            </div>
          </>
        )}

        {stap === 3 && (
          <>
            <h1>Zo werkt het</h1>
            <div className="kaart">
              <h3>Blokken van 6 weken</h3>
              <p className="dun">
                Week 1 is instappen, week 2 t/m 5 bouw je op, week 6 is een lichte week. Daarna begint het volgende blok, sterker dan het vorige.
              </p>
            </div>
            <div className="kaart">
              <h3>Automatisch zwaarder</h3>
              <p className="dun">
                Per oefening staat een bereik, bijvoorbeeld 6-10 herhalingen. Haal je in alle sets het maximum, dan zet de app de volgende keer het gewicht
                omhoog. RIR is hoeveel herhalingen je nog had gekund: RIR 2 betekent stoppen met 2 in de tank.
              </p>
            </div>
            <div className="kaart">
              <h3>Herstel bepaalt de dag</h3>
              <p className="dun">
                Slaap, je CPAP-nacht (AHI en gebruik uit de prisma APP of SleepHQ), zuurstof van je O2Ring, hartslag van je Apple Watch en hoe je je voelt geven
                een herstelscore. Slecht geslapen? Dan wordt de training automatisch lichter.
              </p>
            </div>
            <div className="knoprij">
              <button className="knop" onClick={() => setStap(2)}>
                Terug
              </button>
              <button
                className="knop primair"
                onClick={() => zet((i) => ({ ...i, onboardingKlaar: true, blokStart: maandagVan(vandaag()) }))}
              >
                Beginnen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
