import { useEffect, useMemo, useRef, useState } from 'react';
import { Blad, fmtInvoer, leesInvoer } from '../components/Basis';
import { MachineInstelling } from '../components/Machine';
import { VoorbeeldKaart } from '../components/Voorbeeld';
import { OPWARMEN } from '../lib/opwarmen';
import { IcoonInfo, IcoonLet, IcoonPlus, IcoonPotlood, IcoonPrullenbak, IcoonVink, IcoonWissel } from '../components/Iconen';
import { minutenTussen } from '../lib/datum';
import { APPARATUUR, alleOefeningen, beschikbaar, gewichtLabel, OP_TIJD, SPIERNAMEN, zoekOefening } from '../lib/oefeningen';
import { aantalWerkSets, fmtKg, geschiedenis, opwarmen, recordsIn, setTekst, tonnage } from '../lib/progressie';
import { zoekDag } from '../lib/schema';
import { schijfKleur, schijvenVoor } from '../lib/schijven';
import { wisselOefening } from '../lib/staat';
import type { Oefening, OefeningLog, SetLog, Training } from '../lib/types';
import { useWinkel } from '../lib/winkel';

// ── Geluid en trillen bij het einde van de rust ──
let audio: AudioContext | null = null;
function ontgrendelGeluid() {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
  } catch {
    /* geen geluid beschikbaar */
  }
}
function piep() {
  if (!audio) return;
  const nu = audio.currentTime;
  [0, 0.25, 0.5].forEach((t, i) => {
    const osc = audio!.createOscillator();
    const g = audio!.createGain();
    osc.frequency.value = i === 2 ? 1320 : 880;
    g.gain.setValueAtTime(0.0001, nu + t);
    g.gain.exponentialRampToValueAtTime(0.35, nu + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, nu + t + 0.18);
    osc.connect(g).connect(audio!.destination);
    osc.start(nu + t);
    osc.stop(nu + t + 0.2);
  });
}

function useNu(interval = 1000) {
  const [nu, setNu] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNu(Date.now()), interval);
    return () => window.clearInterval(t);
  }, [interval]);
  return nu;
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;

// ── Schijvencalculator (halterstang, plate-loaded machines, T-bar) ──
function Schijven({ oef, gewicht }: { oef: Oefening; gewicht: number }) {
  const { staat } = useWinkel();
  const r = schijvenVoor(oef, gewicht, staat.instellingen);
  if (!r) return null;
  return (
    <div className="schijven" aria-label={`${r.kop} ${r.schijven.join(', ')} kg`}>
      <span>{r.kop}</span>
      {r.schijven.length === 0 && <span>{r.leeg}</span>}
      {r.schijven.map((kg, i) => (
        <span key={i} className="schijf" style={{ background: schijfKleur(kg) }}>
          {fmtKg(kg)}
        </span>
      ))}
    </div>
  );
}

/** Indexen van de oefeningen die samen een superset vormen met oefening i (opeenvolgend, zelfde letter). */
export function supersetGroep(t: Training, i: number): number[] {
  const letter = t.oefeningen[i]?.superset;
  if (!letter) return [i];
  let van = i;
  while (van > 0 && t.oefeningen[van - 1].superset === letter && !t.oefeningen[van - 1].overgeslagen) van--;
  let tot = i;
  while (tot < t.oefeningen.length - 1 && t.oefeningen[tot + 1].superset === letter && !t.oefeningen[tot + 1].overgeslagen) tot++;
  return Array.from({ length: tot - van + 1 }, (_, k) => van + k);
}

function GetalVeld({ waarde, zet, placeholder, label, id }: { waarde: number | null; zet: (n: number | null) => void; placeholder?: string; label: string; id: string }) {
  const [tekst, setTekst] = useState(waarde == null ? '' : fmtInvoer(waarde));
  useEffect(() => {
    setTekst((t) => (leesInvoer(t) === waarde ? t : waarde == null ? '' : fmtInvoer(waarde)));
  }, [waarde]);
  return (
    <input
      id={id}
      aria-label={label}
      inputMode="decimal"
      enterKeyHint="next"
      placeholder={placeholder}
      value={tekst}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setTekst(e.target.value);
        zet(leesInvoer(e.target.value));
      }}
    />
  );
}

export function Sessie({ training }: { training: Training }) {
  const { staat, wijzig, melding } = useWinkel();
  const nu = useNu();
  const [rust, setRust] = useState<{ eind: number; totaal: number; label?: string } | null>(() => {
    try {
      const r = JSON.parse(localStorage.getItem('kracht-rust') ?? 'null');
      return r && r.eind > Date.now() - 60000 ? r : null;
    } catch {
      return null;
    }
  });
  const gepiept = useRef(false);
  const [info, setInfo] = useState<Oefening | null>(null);
  const [wissel, setWissel] = useState<number | null>(null);
  const [notitie, setNotitie] = useState<number | null>(null);
  const [afronden, setAfronden] = useState(false);

  // Scherm aan houden tijdens de training (waar de browser dat toestaat).
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const vraag = async () => {
      try {
        lock = (await navigator.wakeLock?.request('screen')) ?? null;
      } catch {
        /* niet ondersteund */
      }
    };
    void vraag();
    const opZicht = () => document.visibilityState === 'visible' && vraag();
    document.addEventListener('visibilitychange', opZicht);
    return () => {
      document.removeEventListener('visibilitychange', opZicht);
      void lock?.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kracht-rust', JSON.stringify(rust));
    } catch {
      /* geen opslag */
    }
    gepiept.current = false;
  }, [rust]);

  const resterend = rust ? Math.ceil((rust.eind - nu) / 1000) : 0;
  useEffect(() => {
    if (rust && resterend <= 0 && !gepiept.current) {
      gepiept.current = true;
      if (staat.instellingen.geluid) piep();
      if (staat.instellingen.trillen) navigator.vibrate?.([200, 100, 200]);
    }
  }, [resterend, rust, staat.instellingen.geluid, staat.instellingen.trillen]);

  const werk = (f: (t: Training) => Training) =>
    wijzig((s) => ({ ...s, trainingen: s.trainingen.map((t) => (t.id === training.id ? f(t) : t)) }));
  const werkLog = (i: number, f: (l: OefeningLog) => OefeningLog) => werk((t) => ({ ...t, oefeningen: t.oefeningen.map((l, j) => (j === i ? f(l) : l)) }));
  const werkSet = (i: number, j: number, f: (x: SetLog) => SetLog) => werkLog(i, (l) => ({ ...l, sets: l.sets.map((x, k) => (k === j ? f(x) : x)) }));

  const totaalSets = training.oefeningen.reduce((n, l) => n + (l.overgeslagen ? 0 : l.sets.length), 0);
  const klaarSets = training.oefeningen.reduce((n, l) => n + (l.overgeslagen ? 0 : l.sets.filter((x) => x.klaar).length), 0);
  // Bij het aanpassen van een oude training blijft de oorspronkelijke duur staan.
  const duur = minutenTussen(training.start, training.eind ?? new Date(nu).toISOString());

  const vorige = useMemo(
    () => training.oefeningen.map((l) => geschiedenis(staat, l.oefeningId, training.id)[0]?.log ?? null),
    [training.oefeningen.map((l) => l.oefeningId).join(), staat.trainingen.length],
  );

  const vink = (i: number, j: number) => {
    ontgrendelGeluid();
    const log = training.oefeningen[i];
    const set = log.sets[j];
    if (set.klaar) {
      werkSet(i, j, (x) => ({ ...x, klaar: false }));
      return;
    }
    const gewicht = set.gewicht ?? log.doel.gewicht ?? null;
    const reps = set.reps;
    if (reps == null || reps <= 0) {
      melding(`Vul eerst ${OP_TIJD.has(log.oefeningId) ? 'de seconden' : 'het aantal herhalingen'} in`, true);
      document.getElementById(`reps-${i}-${j}`)?.focus();
      return;
    }
    werkLog(i, (l) => ({
      ...l,
      sets: l.sets.map((x, k) => {
        if (k === j) return { ...x, gewicht, klaar: true };
        // Neem het gewicht mee naar de volgende sets die nog niet gedaan zijn.
        if (k > j && !x.klaar && (x.gewicht == null || x.gewicht === set.gewicht || x.gewicht === l.doel.gewicht)) return { ...x, gewicht };
        return x;
      }),
    }));
    const laatsteSet = j === log.sets.length - 1;
    const laatsteOefening = training.oefeningen.slice(i + 1).every((l) => l.overgeslagen);
    // Superset: na de eerste oefening kort wisselen, na de laatste van het rijtje de volle rust.
    const groep = supersetGroep(training, i);
    const volgende = groep.find((k) => k > i && training.oefeningen[k].sets.some((x) => !x.klaar));
    if (volgende != null) {
      const naam = zoekOefening(training.oefeningen[volgende].oefeningId, staat.eigenOefeningen)?.naam ?? 'volgende oefening';
      setRust({ eind: Date.now() + 15000, totaal: 15, label: `Superset: nu ${naam}` });
      return;
    }
    const rustTijd = groep.length > 1 ? Math.max(...groep.map((k) => training.oefeningen[k].doel.rust)) : log.doel.rust;
    if (!(laatsteSet && laatsteOefening)) setRust({ eind: Date.now() + rustTijd * 1000, totaal: rustTijd });
  };

  const eersteBasis = training.oefeningen.findIndex((l) => zoekOefening(l.oefeningId, staat.eigenOefeningen)?.soort === 'basis');

  return (
    <div style={{ paddingBottom: rust ? 120 : 32 }}>
      <div className="sessie-kop">
        <div className="binnen">
          <div className="groei">
            <div className="titel">{training.dagNaam}</div>
            <div className="dun mini getal">
              {training.eind ? 'Aanpassen · ' : ''}
              {duur} min · {klaarSets}/{totaalSets} sets
              {training.deload ? ' · lichte week' : ''}
              {training.aanpassing !== 'normaal' ? ` · ${training.aanpassing === 'licht' ? 'lichter' : 'herstelsessie'}` : ''}
            </div>
          </div>
          <button className="knop primair klein" onClick={() => setAfronden(true)}>
            Afronden
          </button>
        </div>
        <div className="binnen">
          <div className="voortgang groei">
            <i style={{ width: `${totaalSets ? (klaarSets / totaalSets) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      <div className="pagina" style={{ gap: 14 }}>
        {training.schoudersOntzien && (
          <div className="melding blauw">
            <IcoonInfo />
            <span>Gisteren veel boven je hoofd gewerkt: schouderoefeningen zijn 10% lichter en er staan face pulls extra in.</span>
          </div>
        )}
        <details className="kaart uitklap" open={!training.oefeningen.some((l) => l.sets.some((x) => x.klaar))}>
          <summary>
            <span className="groei" style={{ flex: 1 }}>
              Opwarmen (±5 minuten)
              <span className="dun klein" style={{ display: 'block', fontWeight: 500 }}>
                {training.opwarming?.length ?? 0} van {OPWARMEN.length} gedaan
              </span>
            </span>
          </summary>
          <div className="opwarm">
            {OPWARMEN.map((o, k) => {
              const gedaan = training.opwarming?.includes(k) ?? false;
              return (
                <label key={o.naam} className={gedaan ? 'gedaan' : ''}>
                  <input
                    type="checkbox"
                    checked={gedaan}
                    onChange={() =>
                      werk((t) => ({ ...t, opwarming: gedaan ? (t.opwarming ?? []).filter((x) => x !== k) : [...(t.opwarming ?? []), k] }))
                    }
                  />
                  <span className="naam">{o.naam}</span>
                  <span className="hoeveel">{o.hoeveel}</span>
                  <span className="tip">{o.tip}</span>
                </label>
              );
            })}
          </div>
        </details>
        {training.oefeningen.map((log, i) => {
          const oef = zoekOefening(log.oefeningId, staat.eigenOefeningen);
          if (!oef) return null;
          const tijd = OP_TIJD.has(oef.id);
          const allesKlaar = log.sets.length > 0 && log.sets.every((x) => x.klaar);
          const vorig = vorige[i];
          const hoofdGewicht = log.sets.find((x) => !x.klaar)?.gewicht ?? log.doel.gewicht;
          const opw = i === eersteBasis ? opwarmen(log.doel.gewicht, oef) : [];
          if (log.overgeslagen) {
            return (
              <div key={i} className="oefblok">
                <div className="oefblok-kop">
                  <div className="groei">
                    <h3 style={{ color: 'var(--tekst-3)' }}>{oef.naam}</h3>
                    <span className="dun klein">Overgeslagen</span>
                  </div>
                  <button className="knop klein" onClick={() => werkLog(i, (l) => ({ ...l, overgeslagen: false }))}>
                    Toch doen
                  </button>
                </div>
                <div style={{ height: 10 }} />
              </div>
            );
          }
          return (
            <section key={i} className={`oefblok${allesKlaar ? ' klaar' : ''}${log.superset ? ' superset' : ''}`} aria-label={oef.naam}>
              <div className="oefblok-kop">
                <div className="groei">
                  {log.superset && (
                    <div className="superset-label">
                      Superset {log.superset}
                      {supersetGroep(training, i).indexOf(i) + 1}
                    </div>
                  )}
                  {log.extra && <div className="superset-label">Extra voor je schouders</div>}
                  <button className="naam" onClick={() => setInfo(oef)}>
                    <h3>{oef.naam}</h3>
                  </button>
                </div>
                <button className="icoonknop" aria-label={`Uitleg ${oef.naam}`} onClick={() => setInfo(oef)}>
                  <IcoonInfo />
                </button>
              </div>
              <div className="doel">
                <span className="pil getal">
                  {log.doel.sets} × {log.doel.repMin}-{log.doel.repMax}
                  {tijd ? ' sec' : ''}
                  {oef.perKant ? ' per kant' : ''}
                </span>
                <span className="pil getal">RIR {log.doel.rir}</span>
                <span className="pil getal">rust {mmss(log.doel.rust)}</span>
                {log.doel.gewicht != null && (
                  <span className="pil blauw getal">
                    {fmtKg(log.doel.gewicht)} {gewichtLabel(oef)}
                  </span>
                )}
              </div>
              <MachineInstelling oef={oef} />
              <p className="uitleg">{log.doel.uitleg}</p>
              {(opw.length > 0 || (hoofdGewicht && schijvenVoor(oef, hoofdGewicht, staat.instellingen))) && (
                <div className="hulp">
                  {opw.length > 0 && (
                    <div className="klein dun getal">
                      Opwarmen: {opw.map((w) => `${fmtKg(w.gewicht)}×${w.reps}`).join(' · ')}
                    </div>
                  )}
                  {hoofdGewicht ? <Schijven oef={oef} gewicht={hoofdGewicht} /> : null}
                </div>
              )}
              <div className="sets">
                <div className="setrij kopregel">
                  <span>Set</span>
                  <span>Vorige</span>
                  <span>kg</span>
                  <span>{tijd ? 'sec' : 'reps'}</span>
                  <span>RIR</span>
                  <span />
                </div>
                {log.sets.map((x, j) => {
                  const v = vorig?.sets.filter((s) => s.klaar)[j];
                  return (
                    <div key={j} className={`setrij${x.klaar ? ' gedaan' : ''}`}>
                      <span className="nr">{j + 1}</span>
                      <span className="vorig">{v ? setTekst(v, oef) : '–'}</span>
                      {oef.gewichtType === 'geen' ? (
                        <span className="vorig" style={{ textAlign: 'center' }} aria-hidden="true">
                          –
                        </span>
                      ) : (
                      <GetalVeld
                        id={`kg-${i}-${j}`}
                        label={`Set ${j + 1} gewicht`}
                        waarde={x.gewicht}
                        placeholder={log.doel.gewicht != null ? fmtKg(log.doel.gewicht) : 'kg'}
                        zet={(n) => werkSet(i, j, (s) => ({ ...s, gewicht: n }))}
                      />
                      )}
                      <GetalVeld
                        id={`reps-${i}-${j}`}
                        label={`Set ${j + 1} ${tijd ? 'seconden' : 'herhalingen'}`}
                        waarde={x.reps}
                        placeholder={`${log.doel.repMax}`}
                        zet={(n) => werkSet(i, j, (s) => ({ ...s, reps: n == null ? null : Math.round(n) }))}
                      />
                      <GetalVeld
                        id={`rir-${i}-${j}`}
                        label={`Set ${j + 1} herhalingen over`}
                        waarde={x.rir}
                        placeholder={`${log.doel.rir}`}
                        zet={(n) => werkSet(i, j, (s) => ({ ...s, rir: n == null ? null : Math.max(0, Math.round(n)) }))}
                      />
                      <button className="vink" aria-label={x.klaar ? `Set ${j + 1} ongedaan maken` : `Set ${j + 1} klaar`} aria-pressed={x.klaar} onClick={() => vink(i, j)}>
                        <IcoonVink />
                      </button>
                    </div>
                  );
                })}
              </div>
              {log.notitie && <p className="uitleg" style={{ paddingTop: 0, paddingBottom: 8 }}>Notitie: {log.notitie}</p>}
              <div className="oefblok-voet">
                <button
                  className="knop stil klein"
                  onClick={() =>
                    werkLog(i, (l) => {
                      const laatste = l.sets[l.sets.length - 1];
                      return { ...l, sets: [...l.sets, { gewicht: laatste?.gewicht ?? l.doel.gewicht, reps: null, rir: null, klaar: false }] };
                    })
                  }
                >
                  <IcoonPlus /> Set
                </button>
                {log.sets.length > 1 && !log.sets[log.sets.length - 1].klaar && (
                  <button className="knop stil klein" onClick={() => werkLog(i, (l) => ({ ...l, sets: l.sets.slice(0, -1) }))}>
                    − Set
                  </button>
                )}
                <button className="knop stil klein" onClick={() => setWissel(i)}>
                  <IcoonWissel /> Wissel
                </button>
                <button className="knop stil klein" onClick={() => setNotitie(i)}>
                  <IcoonPotlood /> Notitie
                </button>
                {!log.sets.some((x) => x.klaar) && (
                  <button className="knop stil klein" onClick={() => werkLog(i, (l) => ({ ...l, overgeslagen: true }))}>
                    Overslaan
                  </button>
                )}
              </div>
            </section>
          );
        })}
        <button className="knop primair groot" onClick={() => setAfronden(true)}>
          Training afronden
        </button>
      </div>

      {rust && (
        <div className={`rusttimer${resterend <= 0 ? ' om' : ''}`} role="timer" aria-live="off">
          <div className="binnen">
            <div className="tijd">{resterend > 0 ? mmss(resterend) : 'Go!'}</div>
            <div className="groei" style={{ flex: 1, minWidth: 0 }}>
              <div className="klein dun" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rust.label ?? (resterend > 0 ? 'Rust' : 'Rust voorbij: volgende set')}
              </div>
              <div className="balk">
                <i style={{ width: `${Math.max(0, Math.min(100, (resterend / rust.totaal) * 100))}%` }} />
              </div>
            </div>
            <button className="knop klein" onClick={() => setRust((r) => r && { ...r, eind: r.eind - 15000 })} aria-label="15 seconden korter">
              −15
            </button>
            <button className="knop klein" onClick={() => setRust((r) => r && { eind: Math.max(r.eind, Date.now()) + 15000, totaal: r.totaal + 15 })} aria-label="15 seconden langer">
              +15
            </button>
            <button className="knop klein" onClick={() => setRust(null)}>
              Klaar
            </button>
          </div>
        </div>
      )}

      <OefeningInfo oef={info} sluit={() => setInfo(null)} />
      <WisselBlad
        index={wissel}
        training={training}
        sluit={() => setWissel(null)}
        kies={(id, altijd) => {
          const i = wissel!;
          wijzig((s) => {
            const t = s.trainingen.find((x) => x.id === training.id)!;
            const nieuw = wisselOefening(s, t, i, id);
            const keuzes = altijd ? { ...s.instellingen.keuzes, [t.oefeningen[i].slotId]: id } : s.instellingen.keuzes;
            return { ...s, instellingen: { ...s.instellingen, keuzes }, trainingen: s.trainingen.map((x) => (x.id === t.id ? nieuw : x)) };
          });
          setWissel(null);
        }}
      />
      <NotitieBlad
        open={notitie != null}
        waarde={notitie != null ? training.oefeningen[notitie]?.notitie ?? '' : ''}
        sluit={() => setNotitie(null)}
        zet={(t) => {
          werkLog(notitie!, (l) => ({ ...l, notitie: t || undefined }));
          setNotitie(null);
        }}
      />
      <AfrondBlad open={afronden} sluit={() => setAfronden(false)} training={training} klaarSets={klaarSets} totaalSets={totaalSets} duur={duur} />
    </div>
  );
}

function OefeningInfo({ oef, sluit }: { oef: Oefening | null; sluit: () => void }) {
  const { staat } = useWinkel();
  if (!oef) return null;
  const hist = geschiedenis(staat, oef.id).slice(0, 4);
  return (
    <Blad titel={oef.naam} open={!!oef} sluit={sluit}>
      <div className="keuzes">
        {oef.spieren.map((s, i) => (
          <span key={s} className={`pil${i === 0 ? ' blauw' : ''}`}>
            {SPIERNAMEN[s]}
          </span>
        ))}
      </div>
      <VoorbeeldKaart oef={oef} />
      <p className="dun klein">
        Nodig: {oef.apparaat.length ? oef.apparaat.map((a) => APPARATUUR.find((x) => x.id === a)?.naam).join(', ') : 'niets'}. Gewicht noteer je als{' '}
        {gewichtLabel(oef)}.
      </p>
      {hist.length > 0 && (
        <div className="sectie">
          <span className="label">Laatste keren</span>
          <div className="lijst">
            {hist.map(({ training, log }) => (
              <div key={training.id} className="lijstitem">
                <div className="groei">
                  <div className="titel getal">
                    {log.sets.filter((x) => x.klaar).map((x) => setTekst(x, oef)).join(' · ')}
                  </div>
                  <div className="dun klein">{training.datum}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Blad>
  );
}

function WisselBlad({ index, training, sluit, kies }: { index: number | null; training: Training; sluit: () => void; kies: (id: string, altijd: boolean) => void }) {
  const { staat } = useWinkel();
  const [alles, setAlles] = useState(false);
  const [altijd, setAltijd] = useState(false);
  useEffect(() => {
    setAlles(false);
    setAltijd(false);
  }, [index]);
  if (index == null) return null;
  const log = training.oefeningen[index];
  const huidig = zoekOefening(log.oefeningId, staat.eigenOefeningen);
  const slot = zoekDag(staat.instellingen, training.dagId)?.slots.find((s) => s.id === log.slotId);
  const alle = alleOefeningen(staat.eigenOefeningen);
  const voorkeur = (slot?.oefeningen ?? []).map((id) => alle.find((o) => o.id === id)).filter((o): o is Oefening => !!o);
  const zelfdeSpier = alle.filter((o) => o.spieren[0] === huidig?.spieren[0] && !voorkeur.includes(o));
  const lijst = alles ? alle : [...voorkeur, ...zelfdeSpier];
  return (
    <Blad titel="Oefening wisselen" open sluit={sluit}>
      <p className="dun klein">Bezet, kapot of doet het pijn? Kies een alternatief. Het advies wordt opnieuw berekend.</p>
      <label className="vinkje" style={{ padding: 0 }}>
        <input type="checkbox" checked={altijd} onChange={(e) => setAltijd(e.target.checked)} />
        <span className="groei">Voortaan altijd deze oefening op deze plek</span>
      </label>
      <div className="lijst">
        {lijst.map((o) => {
          const kan = beschikbaar(o, staat.instellingen.apparatuur);
          return (
            <button key={o.id} className="lijstitem" onClick={() => kies(o.id, altijd)} disabled={o.id === huidig?.id}>
              <div className="groei">
                <div className="titel">
                  {o.naam}
                  {o.id === huidig?.id ? ' (nu)' : ''}
                </div>
                <div className="dun klein">
                  {o.spieren.map((s) => SPIERNAMEN[s]).join(', ')}
                  {!kan ? ' · apparaat niet aangevinkt' : ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {!alles && (
        <button className="knop breed" onClick={() => setAlles(true)}>
          Alle oefeningen tonen
        </button>
      )}
    </Blad>
  );
}

function NotitieBlad({ open, waarde, sluit, zet }: { open: boolean; waarde: string; sluit: () => void; zet: (t: string) => void }) {
  const [t, setT] = useState(waarde);
  useEffect(() => setT(waarde), [waarde, open]);
  return (
    <Blad titel="Notitie" open={open} sluit={sluit}>
      <textarea id="notitie-oef" className="invoer" value={t} onChange={(e) => setT(e.target.value)} placeholder="bijv. stoel op stand 4, linkerschouder voelde stijf" />
      <button className="knop primair groot" onClick={() => zet(t.trim())}>
        Notitie opslaan
      </button>
    </Blad>
  );
}

function AfrondBlad({ open, sluit, training, klaarSets, totaalSets, duur }: { open: boolean; sluit: () => void; training: Training; klaarSets: number; totaalSets: number; duur: number }) {
  const { staat, wijzig, melding } = useWinkel();
  const [zwaarte, setZwaarte] = useState<number | undefined>(training.zwaarte);
  const [notitie, setNotitie] = useState(training.notitie ?? '');
  const [verwijder, setVerwijder] = useState(false);
  useEffect(() => setVerwijder(false), [open]);
  const voorlopig: Training = { ...training, status: 'klaar' };
  const records = open ? recordsIn(staat, voorlopig) : [];

  const opslaan = () => {
    wijzig((s) => ({
      ...s,
      trainingen: s.trainingen.map((t) =>
        t.id === training.id
          ? {
              ...t,
              status: 'klaar',
              eind: t.eind ?? new Date().toISOString(),
              zwaarte,
              notitie: notitie.trim() || undefined,
              // Niet afgevinkte sets tellen niet mee; lege sets weghalen.
              oefeningen: t.oefeningen.map((l) => ({ ...l, sets: l.sets.filter((x) => x.klaar) })),
            }
          : t,
      ),
    }));
    try {
      localStorage.removeItem('kracht-rust');
    } catch {
      /* geen opslag */
    }
    melding(records.length ? `Opgeslagen. ${records.length} ${records.length === 1 ? 'nieuw record' : 'nieuwe records'}!` : 'Training opgeslagen. Goed bezig!');
  };

  return (
    <Blad titel="Training afronden" open={open} sluit={sluit}>
      <div className="tegels">
        <div className="tegel">
          <span className="label">Duur</span>
          <b>
            {duur}
            <small>min</small>
          </b>
        </div>
        <div className="tegel">
          <span className="label">Sets</span>
          <b>
            {klaarSets}
            <small>/ {totaalSets}</small>
          </b>
        </div>
        <div className="tegel">
          <span className="label">Totaal verplaatst</span>
          <b>
            {Math.round(tonnage(voorlopig)).toLocaleString('nl-NL')}
            <small>kg</small>
          </b>
        </div>
        <div className="tegel">
          <span className="label">Records</span>
          <b>{records.length}</b>
        </div>
      </div>
      {records.length > 0 && (
        <div className="lijst">
          {records.map((r) => (
            <div key={r.oefeningId} className="lijstitem">
              <div className="groei">
                <div className="titel">{zoekOefening(r.oefeningId, staat.eigenOefeningen)?.naam}</div>
                <div className="dun klein">{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {klaarSets < totaalSets && (
        <div className="melding">
          <IcoonLet /> <span>{totaalSets - klaarSets} sets zijn niet afgevinkt. Die worden niet bewaard.</span>
        </div>
      )}
      <div className="veld">
        <span>Hoe zwaar was de hele training? (1 = heel licht, 10 = maximaal)</span>
        <div className="keuzes" role="group" aria-label="Zwaarte van de training">
          {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
            <button key={n} className="keuze" style={{ flex: '1 0 15%' }} aria-pressed={zwaarte === n} onClick={() => setZwaarte(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <label className="veld">
        <span>Notitie bij de training</span>
        <textarea id="notitie-training" className="invoer" value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Hoe ging het? Druk in de sportschool?" />
      </label>
      <button className="knop primair groot" onClick={opslaan} disabled={aantalWerkSets(training) === 0}>
        Opslaan
      </button>
      {aantalWerkSets(training) === 0 && <p className="dun mini">Vink minimaal één set af om de training op te slaan.</p>}
      {!verwijder ? (
        <button className="knop stil gevaar" onClick={() => setVerwijder(true)}>
          <IcoonPrullenbak /> Training weggooien
        </button>
      ) : (
        <div className="kaart" style={{ borderColor: 'var(--rood)' }}>
          <p>Deze training en alle ingevulde sets weggooien?</p>
          <div className="knoprij">
            <button className="knop" onClick={() => setVerwijder(false)}>
              Nee, terug
            </button>
            <button
              className="knop vol-gevaar"
              onClick={() => {
                wijzig((s) => ({ ...s, trainingen: s.trainingen.filter((t) => t.id !== training.id) }));
                melding('Training weggegooid');
              }}
            >
              Ja, weggooien
            </button>
          </div>
        </div>
      )}
      <p className="dun mini">Draag je een Apple Watch? Start daar een workout “Krachttraining”, dan komen hartslag en calorieën in Apple Health.</p>
    </Blad>
  );
}
