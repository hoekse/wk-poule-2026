import { Kop, Schakelaar, Segment, Stapper } from '../components/Basis';
import { DAGEN_KORT, maandagVan, plusDagen, vandaag } from '../lib/datum';
import { alleOefeningen, beschikbaar, SPIERNAMEN } from '../lib/oefeningen';
import { actieveDagen, blokInfo, kiesOefening, SCHEMAS } from '../lib/schema';
import { wisselSchema } from '../lib/staat';
import type { Instellingen, SchemaId, Slot, Trainingsdag } from '../lib/types';
import { useWinkel } from '../lib/winkel';

export function SchemaInstellingen() {
  const { staat, wijzig, melding } = useWinkel();
  const inst = staat.instellingen;
  const zet = (f: (i: Instellingen) => Instellingen) => wijzig((s) => ({ ...s, instellingen: f(s.instellingen) }));
  const blok = blokInfo(inst, vandaag());
  const alle = alleOefeningen(staat.eigenOefeningen);
  const nodig = inst.schemaId === '3-dagen' ? 3 : 4;

  const zetSlot = (dag: Trainingsdag, slotId: string, f: (s: Slot) => Slot) =>
    zet((i) => ({ ...i, aangepasteDagen: { ...i.aangepasteDagen, [dag.id]: { ...dag, slots: dag.slots.map((s) => (s.id === slotId ? f(s) : s)) } } }));

  return (
    <div className="pagina">
      <Kop titel="Schema" sub="Dagen, oefeningen en blok" terug />

      <section className="sectie">
        <span className="label">Trainingen per week</span>
        <Segment<SchemaId>
          label="Trainingen per week"
          waarde={inst.schemaId}
          zet={(id) => wijzig((s) => wisselSchema(s, id))}
          opties={[
            { waarde: '3-dagen', tekst: '3× volledig lichaam' },
            { waarde: '4-dagen', tekst: '4× boven/onder' },
          ]}
        />
        <p className="dun klein">{SCHEMAS[inst.schemaId].omschrijving} Je geschiedenis per oefening blijft bewaard als je wisselt.</p>
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
                onClick={() => zet((x) => ({ ...x, trainingsdagen: aan ? x.trainingsdagen.filter((n) => n !== nr) : [...x.trainingsdagen, nr].sort() }))}
              >
                {d}
              </button>
            );
          })}
        </div>
        {inst.trainingsdagen.length !== nodig && (
          <p className="klein" style={{ color: 'var(--geel)' }}>
            Je hebt {inst.trainingsdagen.length} dagen gekozen; dit schema is gemaakt voor {nodig}.
          </p>
        )}
      </section>

      <section className="kaart">
        <h3>{blok.label}</h3>
        <p className="dun klein">{blok.uitleg}</p>
        <div className="knoprij">
          <button
            className="knop"
            onClick={() => {
              zet((i) => ({ ...i, blokStart: maandagVan(vandaag()) }));
              melding('Nieuw blok gestart: week 1');
            }}
          >
            Nieuw blok starten
          </button>
          <button
            className="knop"
            onClick={() => {
              zet((i) => ({ ...i, blokStart: plusDagen(maandagVan(vandaag()), -35) }));
              melding('Deze week is nu een lichte week');
            }}
          >
            Nu lichte week
          </button>
        </div>
      </section>

      {actieveDagen(inst).map((dag) => (
        <section key={dag.id} className="sectie">
          <div className="rij tussen">
            <span className="label">
              {dag.naam} · {dag.focus}
            </span>
            {inst.aangepasteDagen[dag.id] && (
              <button
                className="knop stil klein"
                onClick={() =>
                  zet((i) => {
                    const { [dag.id]: _weg, ...rest } = i.aangepasteDagen;
                    void _weg;
                    return { ...i, aangepasteDagen: rest };
                  })
                }
              >
                Standaard herstellen
              </button>
            )}
          </div>
          <div className="lijst">
            {dag.slots.map((slot) => {
              const { oefening, ontbreekt } = kiesOefening(slot, inst, staat.eigenOefeningen);
              const vast = inst.keuzes[slot.id];
              return (
                <details key={slot.id} className="uitklap" style={{ padding: '4px 14px 12px' }}>
                  <summary>
                    <span className="groei" style={{ flex: 1, minWidth: 0 }}>
                      {oefening.naam}
                      <span className="dun klein getal" style={{ display: 'block', fontWeight: 400 }}>
                        {slot.sets} × {slot.repMin}-{slot.repMax} · RIR {slot.rir} · rust {Math.round(slot.rust / 15) * 15} s{ontbreekt ? ' · apparaat ontbreekt' : ''}
                      </span>
                    </span>
                  </summary>
                  <div className="sectie" style={{ gap: 12 }}>
                    <label className="veld">
                      <span>Oefening</span>
                      <select
                        id={`slot-oef-${slot.id}`}
                        className="invoer"
                        value={vast ?? ''}
                        onChange={(e) =>
                          zet((i) => {
                            const keuzes = { ...i.keuzes };
                            if (e.target.value) keuzes[slot.id] = e.target.value;
                            else delete keuzes[slot.id];
                            return { ...i, keuzes };
                          })
                        }
                      >
                        <option value="">Automatisch (beste met jouw apparatuur)</option>
                        <optgroup label="Past op deze plek">
                          {slot.oefeningen.map((id) => {
                            const o = alle.find((x) => x.id === id);
                            return o ? (
                              <option key={id} value={id}>
                                {o.naam}
                                {beschikbaar(o, inst.apparatuur) ? '' : ' (apparaat niet aangevinkt)'}
                              </option>
                            ) : null;
                          })}
                        </optgroup>
                        <optgroup label="Alle oefeningen">
                          {alle
                            .filter((o) => !slot.oefeningen.includes(o.id))
                            .map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.naam} ({SPIERNAMEN[o.spieren[0]].toLowerCase()})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </label>
                    <div className="velden">
                      <div className="veld">
                        <span>Sets</span>
                        <Stapper label="Sets" waarde={slot.sets} stap={1} min={1} max={8} decimalen={0} zet={(n) => n && zetSlot(dag, slot.id, (s) => ({ ...s, sets: n }))} />
                      </div>
                      <div className="veld">
                        <span>RIR</span>
                        <Stapper label="RIR" waarde={slot.rir} stap={1} min={0} max={5} decimalen={0} zet={(n) => n != null && zetSlot(dag, slot.id, (s) => ({ ...s, rir: n }))} />
                      </div>
                      <div className="veld">
                        <span>Minimaal</span>
                        <Stapper label="Minimaal aantal herhalingen" waarde={slot.repMin} stap={1} min={1} max={60} decimalen={0} zet={(n) => n && zetSlot(dag, slot.id, (s) => ({ ...s, repMin: n, repMax: Math.max(n, s.repMax) }))} />
                      </div>
                      <div className="veld">
                        <span>Maximaal</span>
                        <Stapper label="Maximaal aantal herhalingen" waarde={slot.repMax} stap={1} min={1} max={90} decimalen={0} zet={(n) => n && zetSlot(dag, slot.id, (s) => ({ ...s, repMax: n, repMin: Math.min(n, s.repMin) }))} />
                      </div>
                      <div className="veld">
                        <span>Rust (sec)</span>
                        <Stapper label="Rust in seconden" waarde={slot.rust} stap={15} min={30} max={600} decimalen={0} zet={(n) => n && zetSlot(dag, slot.id, (s) => ({ ...s, rust: n }))} />
                      </div>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ))}

      <section className="sectie">
        <span className="label">Overig</span>
        <div className="kaart">
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
          <div className="veld">
            <span>Slaapdoel (uren)</span>
            <Stapper label="Slaapdoel" waarde={inst.slaapDoel} stap={0.25} min={5} max={10} decimalen={2} zet={(n) => n && zet((i) => ({ ...i, slaapDoel: n }))} />
          </div>
          <Schakelaar id="inst-geluid" aan={inst.geluid} zet={(b) => zet((i) => ({ ...i, geluid: b }))}>
            Piep als de rust voorbij is
          </Schakelaar>
          <Schakelaar id="inst-trillen" aan={inst.trillen} zet={(b) => zet((i) => ({ ...i, trillen: b }))}>
            Trillen als de rust voorbij is (niet op iPhone)
          </Schakelaar>
          <label className="veld">
            <span>Je voornaam</span>
            <input id="inst-naam" className="invoer" value={inst.naam} onChange={(e) => zet((i) => ({ ...i, naam: e.target.value }))} />
          </label>
        </div>
      </section>
    </div>
  );
}
