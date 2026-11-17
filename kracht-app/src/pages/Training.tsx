import { Kop } from '../components/Basis';
import { IcoonInstellingen, IcoonLet } from '../components/Iconen';
import { DAGEN_KORT, vandaag } from '../lib/datum';
import { berekenHerstel } from '../lib/herstel';
import { repLabel } from '../lib/oefeningen';
import { actieveDagen, blokInfo, kiesOefening, SCHEMAS, volgendeDag } from '../lib/schema';
import { maakTraining } from '../lib/staat';
import { useNav, useWinkel } from '../lib/winkel';

export function Training() {
  const { staat, wijzig } = useWinkel();
  const nav = useNav();
  const inst = staat.instellingen;
  const schema = SCHEMAS[inst.schemaId];
  const blok = blokInfo(inst, vandaag());
  const volgende = volgendeDag(staat);
  const herstel = berekenHerstel(staat, vandaag());

  return (
    <div className="pagina">
      <Kop
        titel="Schema"
        sub={`${schema.naam} · ${inst.trainingsdagen.map((d) => DAGEN_KORT[d - 1]).join(' ')}`}
        rechts={
          <button className="icoonknop" aria-label="Schema aanpassen" onClick={() => nav.ga({ naam: 'schema' })}>
            <IcoonInstellingen />
          </button>
        }
      />
      <div className="kaart">
        <div className="rij tussen">
          <h3>{blok.label}</h3>
          {blok.deload && <span className="pil geel">lichte week</span>}
        </div>
        <div className="rij" style={{ gap: 4 }} aria-label="Weken in dit blok">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              title={i === 5 ? 'Lichte week' : `Week ${i + 1}`}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                background: i + 1 < blok.week ? 'var(--groen)' : i + 1 === blok.week ? 'var(--accent)' : 'var(--vlak-3)',
                opacity: i === 5 ? 0.7 : 1,
              }}
            />
          ))}
        </div>
        <p className="dun klein">{blok.uitleg}</p>
      </div>

      {actieveDagen(inst).map((dag) => (
        <section key={dag.id} className="kaart" aria-label={dag.naam}>
          <div className="rij tussen">
            <div>
              <h2>{dag.naam}</h2>
              <p className="dun klein">{dag.focus}</p>
            </div>
            {dag.id === volgende.id && <span className="pil blauw">volgende</span>}
          </div>
          <div className="lijst">
            {dag.slots.map((slot) => {
              const { oefening, ontbreekt } = kiesOefening(slot, inst, staat.eigenOefeningen);
              return (
                <button key={slot.id} className="lijstitem" onClick={() => nav.ga({ naam: 'oefening', id: oefening.id })}>
                  <div className="groei">
                    <div className="titel">{oefening.naam}</div>
                    <div className="dun klein getal">
                      {slot.sets} × {slot.repMin}-{slot.repMax}
                      {repLabel(oefening.id) === 'sec' ? ' sec' : ''} · RIR {slot.rir}
                      {slot.notitie ? ` · ${slot.notitie}` : ''}
                    </div>
                  </div>
                  {ontbreekt && <IcoonLet className="icoon" style={{ color: 'var(--geel)' }} aria-label="Apparaat ontbreekt" />}
                </button>
              );
            })}
          </div>
          <button
            className={`knop${dag.id === volgende.id ? ' primair' : ''}`}
            onClick={() => wijzig((s) => ({ ...s, trainingen: [...s.trainingen, maakTraining(s, dag.id, herstel.aanpassing)] }))}
          >
            Start {dag.naam}
          </button>
        </section>
      ))}
      <p className="dun klein">{schema.omschrijving}</p>
    </div>
  );
}
