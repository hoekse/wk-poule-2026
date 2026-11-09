// Meenemen, terugbrengen en verbruik: scan na scan in een "winkelmand", één keer bevestigen.
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ArtikelOverzicht, Onderweg, Project, RegistratieRegel } from '@loods/shared';
import {
  haalOnderweg,
  haalProjecten,
  haalVoertuigen,
  laatsteVoertuig,
  nieuwProject,
  normaliseerCode,
  recenteProjecten,
  registreer,
  zoekArtikel,
} from '../lib/api';
import { useIk } from '../lib/sessie';
import { useLaden } from '../lib/useLaden';
import { feedback } from '../lib/feedback';
import { aantalTekst, sindsTekst } from '../lib/opmaak';
import { useMelding } from '../components/Meldingen';
import { Scanner } from '../components/Scanner';
import { Blad, Kop, Laden, Teller } from '../components/Basis';
import { IcoonVink } from '../components/Iconen';

export type Modus = 'mee' | 'terug' | 'verbruikt';

const TEKST: Record<Modus, { titel: string; hint: string; bevestig: string; klaar: string; nogMeer: string; leeg: string }> = {
  mee: {
    titel: 'Meenemen',
    hint: 'Scan wat je meeneemt',
    bevestig: 'Meenemen bevestigen',
    klaar: 'Meenemen geregistreerd',
    nogMeer: 'Nog iets meenemen',
    leeg: 'Scan de QR-code op het materiaal. Je kunt meerdere dingen achter elkaar scannen.',
  },
  terug: {
    titel: 'Terugbrengen',
    hint: 'Scan wat je terugbrengt',
    bevestig: 'Terugbrengen bevestigen',
    klaar: 'Terugbrengen geregistreerd',
    nogMeer: 'Nog iets terugbrengen',
    leeg: 'Scan wat je terugzet, of tik hieronder op wat je mee hebt.',
  },
  verbruikt: {
    titel: 'Verbruik pakken',
    hint: 'Scan kit, tape of schuurpapier',
    bevestig: 'Verbruik bevestigen',
    klaar: 'Verbruik geregistreerd',
    nogMeer: 'Nog meer verbruik',
    leeg: 'Scan de streepjescode of QR-code van kit, goldtape of schuurpapier.',
  },
};

interface Regel {
  sleutel: string;
  artikel: ArtikelOverzicht;
  aantal: number;
  max?: number;
  houderId?: string;
  houderNaam?: string;
  overnemenVan?: string;
}

export function Winkelmand({ modus }: { modus: Modus }) {
  const ik = useIk();
  const melding = useMelding();
  const navigate = useNavigate();
  const t = TEKST[modus];

  const [regels, setRegels] = useState<Regel[]>([]);
  const [stap, setStap] = useState<'scannen' | 'gegevens' | 'klaar'>('scannen');
  const [bezig, setBezig] = useState(false);
  const [kiesHouder, setKiesHouder] = useState<{ artikel: ArtikelOverzicht; opties: Onderweg[] } | null>(null);
  const [geregistreerd, setGeregistreerd] = useState<Regel[]>([]);
  const [projectId, setProjectId] = useState<string | null | undefined>(undefined);
  const [voertuigId, setVoertuigId] = useState<string | null | undefined>(undefined);
  const zoekt = useRef(false);
  // Altijd de actuele lijst, ook als camera en "Alles toevoegen" tegelijk iets toevoegen.
  const regelsRef = useRef<Regel[]>([]);
  function zetRegels(wijzig: (r: Regel[]) => Regel[]) {
    regelsRef.current = wijzig(regelsRef.current);
    setRegels(regelsRef.current);
  }
  const huidige = () => regelsRef.current;

  // Voor terugbrengen: wat heb ik nu mee?
  const mijnSpullen = useLaden(() => (modus === 'terug' ? haalOnderweg({ houderId: ik.id }) : Promise.resolve([])), [modus, ik.id]);

  function voegToe(regel: Regel) {
    if (huidige().some((x) => x.sleutel === regel.sleutel)) {
      melding('info', `${regel.artikel.naam} staat al in je lijst.`);
      return;
    }
    zetRegels((r) => [regel, ...r]);
    feedback.goed();
    melding('ok', `Toegevoegd: ${regel.artikel.naam}`);
  }

  function telEenErbij(sleutel: string, naam: string) {
    const nieuw = (huidige().find((r) => r.sleutel === sleutel)?.aantal ?? 0) + 1;
    zetRegels((rs) => rs.map((r) => (r.sleutel === sleutel ? { ...r, aantal: nieuw } : r)));
    feedback.goed();
    melding('ok', `${naam}: ${nieuw}`);
  }

  async function verwerk(ruweCode: string) {
    if (zoekt.current || stap !== 'scannen') return;
    zoekt.current = true;
    try {
      const artikel = await zoekArtikel(ruweCode);
      if (!artikel) {
        feedback.fout();
        melding('fout', `Onbekende code: ${normaliseerCode(ruweCode)}`);
        return;
      }
      if (!artikel.actief && modus !== 'terug') {
        feedback.fout();
        melding('fout', `${artikel.naam} is niet meer in gebruik.`);
        return;
      }
      if (modus === 'mee') await meeToevoegen(artikel);
      else if (modus === 'terug') await terugToevoegen(artikel);
      else verbruikToevoegen(artikel);
    } catch (e) {
      feedback.fout();
      melding('fout', e instanceof Error ? e.message : String(e));
    } finally {
      zoekt.current = false;
    }
  }

  async function meeToevoegen(a: ArtikelOverzicht) {
    const bestaand = huidige().find((r) => r.artikel.id === a.id);
    if (a.telwijze === 'aantal') {
      if (bestaand) telEenErbij(bestaand.sleutel, a.naam);
      else voegToe({ sleutel: a.id, artikel: a, aantal: 1 });
      return;
    }
    if (bestaand) {
      melding('info', `${a.naam} staat al in je lijst.`);
      return;
    }
    const bij = await haalOnderweg({ artikelId: a.id });
    if (bij.some((o) => o.houder_id === ik.id)) {
      feedback.fout();
      melding('fout', `Je hebt ${a.naam} al mee.`);
      return;
    }
    if (a.keuring_status === 'verlopen') melding('let-op', `Let op: de keuring van ${a.naam} is verlopen.`);
    voegToe({ sleutel: a.id, artikel: a, aantal: 1, overnemenVan: bij[0]?.houder_naam });
  }

  async function terugToevoegen(a: ArtikelOverzicht) {
    const bij = await haalOnderweg({ artikelId: a.id });
    if (bij.length === 0) {
      feedback.fout();
      melding('fout', `${a.naam} staat al in de loods.`);
      return;
    }
    const mijn = bij.find((o) => o.houder_id === ik.id);
    const opties = mijn ? [mijn] : bij;
    const nogNiet = opties.filter((o) => !huidige().some((r) => r.artikel.id === a.id && r.houderId === o.houder_id));
    if (nogNiet.length === 0) {
      melding('info', `${a.naam} staat al in je lijst.`);
      return;
    }
    if (nogNiet.length === 1) {
      terugRegel(a, nogNiet[0]);
      return;
    }
    setKiesHouder({ artikel: a, opties: nogNiet });
  }

  function terugRegel(a: ArtikelOverzicht, o: Onderweg) {
    voegToe({
      sleutel: `${a.id}:${o.houder_id}`,
      artikel: a,
      aantal: o.aantal,
      max: o.aantal,
      houderId: o.houder_id,
      houderNaam: o.houder_id === ik.id ? undefined : o.houder_naam,
    });
  }

  function verbruikToevoegen(a: ArtikelOverzicht) {
    if (a.telwijze !== 'aantal') {
      feedback.fout();
      melding('fout', `${a.naam} is geen verbruiksartikel. Gebruik Meenemen.`);
      return;
    }
    const bestaand = huidige().find((r) => r.artikel.id === a.id);
    if (bestaand) telEenErbij(bestaand.sleutel, a.naam);
    else voegToe({ sleutel: a.id, artikel: a, aantal: 1 });
  }

  /** Snelkeuze bij terugbrengen: een regel uit "wat ik mee heb". */
  async function voegMijnToe(o: Onderweg) {
    try {
      const a = await zoekArtikel(o.qr_code);
      if (a) terugRegel(a, o);
    } catch (e) {
      melding('fout', e instanceof Error ? e.message : String(e));
    }
  }

  async function voegAllesToe() {
    const nog = (mijnSpullen.data ?? []).filter((o) => !huidige().some((r) => r.sleutel === `${o.artikel_id}:${o.houder_id}`));
    for (const o of nog) await voegMijnToe(o);
  }

  async function bevestig() {
    if (regels.length === 0) return;
    if (modus === 'mee' && projectId === undefined) {
      melding('let-op', 'Kies eerst een project (of "Geen project").');
      return;
    }
    setBezig(true);
    try {
      const api: RegistratieRegel[] = [...regels].reverse().map((r) => ({
        artikel_id: r.artikel.id,
        type: modus,
        aantal: r.aantal,
        houder_id: r.houderId ?? null,
        voertuig_id: modus === 'mee' ? voertuigId ?? null : null,
        project_id: modus === 'mee' ? projectId ?? null : null,
      }));
      await registreer(api);
      feedback.klaar();
      setGeregistreerd(regels);
      zetRegels(() => []);
      setStap('klaar');
    } catch (e) {
      feedback.fout();
      melding('fout', e instanceof Error ? e.message : String(e));
    } finally {
      setBezig(false);
    }
  }

  function opnieuw() {
    setGeregistreerd([]);
    setStap('scannen');
    setProjectId(undefined);
    void mijnSpullen.opnieuw();
  }

  // ---------------------------------------------------------------------------
  if (stap === 'klaar') {
    return (
      <>
        <Kop titel={t.titel} terugNaar="/" />
        <main className="klaar" aria-live="polite">
          <div className="vink">
            <IcoonVink />
          </div>
          <h2>{t.klaar}</h2>
          <div className="lijst">
            {geregistreerd.map((r) => (
              <div key={r.sleutel} className="regel mand">
                <span>
                  <b>{r.artikel.naam}</b>
                  <small>
                    {r.artikel.qr_code}
                    {r.houderNaam ? ` · van ${r.houderNaam}` : ''}
                  </small>
                </span>
                <span className="stand">{r.artikel.telwijze === 'aantal' ? aantalTekst(r.aantal, r.artikel.eenheid) : '1×'}</span>
              </div>
            ))}
          </div>
          <div className="lijst" style={{ maxWidth: 520 }}>
            <button className="knop blauw breed" type="button" onClick={() => navigate('/')}>
              Klaar
            </button>
            <button className="knop rand breed" type="button" onClick={opnieuw}>
              {t.nogMeer}
            </button>
          </div>
        </main>
      </>
    );
  }

  if (stap === 'gegevens') {
    return (
      <Gegevens
        regels={regels}
        projectId={projectId}
        setProjectId={setProjectId}
        voertuigId={voertuigId}
        setVoertuigId={setVoertuigId}
        terug={() => setStap('scannen')}
        bevestig={bevestig}
        bezig={bezig}
        knoptekst={t.bevestig}
      />
    );
  }

  const mijnNog = (mijnSpullen.data ?? []).filter((o) => !regels.some((r) => r.sleutel === `${o.artikel_id}:${o.houder_id}`));

  return (
    <>
      <Kop titel={t.titel} terugNaar="/" />
      <main className={regels.length ? 'pagina met-balk' : 'pagina'}>
        <Scanner onCode={verwerk} actief={!kiesHouder} hint={t.hint} />

        <section className="sectie" aria-label="Winkelmand">
          <h2>
            {regels.length === 0 ? 'Nog niets gescand' : `In je lijst (${regels.length})`}
          </h2>
          {regels.length === 0 && <p className="uitleg">{t.leeg}</p>}
          <div className="lijst">
            {regels.map((r) => (
              <MandRegel
                key={r.sleutel}
                regel={r}
                modus={modus}
                wijzig={(aantal) => zetRegels((rs) => rs.map((x) => (x.sleutel === r.sleutel ? { ...x, aantal } : x)))}
                verwijder={() => zetRegels((rs) => rs.filter((x) => x.sleutel !== r.sleutel))}
              />
            ))}
          </div>
        </section>

        {modus === 'terug' && (
          <section className="sectie">
            <h2>Wat jij nu mee hebt</h2>
            {mijnSpullen.laden ? (
              <Laden />
            ) : mijnNog.length === 0 ? (
              <p className="uitleg">{(mijnSpullen.data ?? []).length ? 'Alles staat al in je lijst.' : 'Je hebt niets op je naam staan.'}</p>
            ) : (
              <>
                <div className="lijst">
                  {mijnNog.map((o) => (
                    <button key={`${o.artikel_id}:${o.houder_id}`} className="regel" type="button" onClick={() => void voegMijnToe(o)}>
                      <span className="code">{o.qr_code}</span>
                      <span>
                        <b>{o.artikel_naam}</b>
                        <small>
                          {o.telwijze === 'aantal' ? `${aantalTekst(o.aantal, o.eenheid)} · ` : ''}sinds {sindsTekst(o.sinds)}
                        </small>
                      </span>
                      <span className="label blauw">Toevoegen</span>
                    </button>
                  ))}
                </div>
                {mijnNog.length > 1 && (
                  <button className="knop rand breed klein" type="button" onClick={() => void voegAllesToe()}>
                    Alles toevoegen ({mijnNog.length})
                  </button>
                )}
              </>
            )}
          </section>
        )}
      </main>

      {regels.length > 0 && (
        <div className="balk">
          <div className="binnen">
            {modus === 'mee' ? (
              <button className="knop blauw" type="button" onClick={() => setStap('gegevens')}>
                Verder ({regels.length})
              </button>
            ) : (
              <button className="knop groen" type="button" onClick={() => void bevestig()} disabled={bezig}>
                {bezig ? 'Bezig…' : `${t.bevestig} (${regels.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {kiesHouder && (
        <Blad titel={`Van wie is ${kiesHouder.artikel.naam}?`} sluit={() => setKiesHouder(null)}>
          <div className="lijst">
            {kiesHouder.opties.map((o) => (
              <button
                key={o.houder_id}
                className="regel"
                type="button"
                onClick={() => {
                  terugRegel(kiesHouder.artikel, o);
                  setKiesHouder(null);
                }}
              >
                <span className="av" style={{ background: o.houder_kleur }}>{o.houder_naam.charAt(0)}</span>
                <span>
                  <b>{o.houder_naam}</b>
                  <small>
                    {aantalTekst(o.aantal, o.eenheid)} · sinds {sindsTekst(o.sinds)}
                  </small>
                </span>
                <span className="label blauw">Kies</span>
              </button>
            ))}
          </div>
        </Blad>
      )}
    </>
  );
}

function MandRegel({
  regel: r,
  modus,
  wijzig,
  verwijder,
}: {
  regel: Regel;
  modus: Modus;
  wijzig: (n: number) => void;
  verwijder: () => void;
}) {
  const a = r.artikel;
  const teVeel = modus !== 'terug' && a.telwijze === 'aantal' && r.aantal > a.aanwezig;
  return (
    <div className="kaart">
      <div className="regel mand" style={{ padding: 0, border: 0, background: 'none' }}>
        <span>
          <b>{a.naam}</b>
          <small>
            <span className="code">{a.qr_code}</span> {a.zone_code && <span className="zone">{a.zone_code}</span>}
            {r.houderNaam ? ` · van ${r.houderNaam}` : ''}
          </small>
        </span>
        <button className="weg" type="button" aria-label={`${a.naam} uit de lijst halen`} onClick={verwijder}>
          ×
        </button>
      </div>
      {a.telwijze === 'aantal' && (
        <>
          <Teller label={`Aantal ${a.naam}`} waarde={r.aantal} onChange={wijzig} min={1} max={r.max} />
          <div className="snel">
            {modus === 'terug' ? (
              <small className="uitleg">
                Op naam: {aantalTekst(r.max ?? r.aantal, a.eenheid)}
              </small>
            ) : (
              <small className="uitleg">Nog {aantalTekst(a.aanwezig, a.eenheid)} in de loods</small>
            )}
            {modus !== 'terug' &&
              [5, 10].map((n) => (
                <button key={n} className="knop mini" type="button" onClick={() => wijzig(r.aantal + n)}>
                  +{n}
                </button>
              ))}
          </div>
          {teVeel && <div className="letop klein">Volgens het systeem zijn er maar {a.aanwezig}. Klopt de telling? Meld het aan Dennis.</div>}
        </>
      )}
      {r.overnemenVan && (
        <div className="letop klein">Staat nog op naam van {r.overnemenVan}. Wordt naar jou overgezet.</div>
      )}
      {modus === 'mee' && a.keuring_status === 'verlopen' && <div className="letop klein">Keuring verlopen.</div>}
    </div>
  );
}

function Gegevens({
  regels,
  projectId,
  setProjectId,
  voertuigId,
  setVoertuigId,
  terug,
  bevestig,
  bezig,
  knoptekst,
}: {
  regels: Regel[];
  projectId: string | null | undefined;
  setProjectId: (id: string | null) => void;
  voertuigId: string | null | undefined;
  setVoertuigId: (id: string | null) => void;
  terug: () => void;
  bevestig: () => void;
  bezig: boolean;
  knoptekst: string;
}) {
  const ik = useIk();
  const melding = useMelding();
  const [zoekBlad, setZoekBlad] = useState(false);

  const gegevens = useLaden(async () => {
    const [projecten, recent, voertuigen, laatste] = await Promise.all([
      haalProjecten(),
      recenteProjecten(ik.id),
      haalVoertuigen(),
      ik.standaard_voertuig_id ? Promise.resolve(null) : laatsteVoertuig(ik.id),
    ]);
    if (voertuigId === undefined) {
      const standaard = ik.standaard_voertuig_id ?? laatste;
      setVoertuigId(voertuigen.some((v) => v.id === standaard) ? standaard : voertuigen.length === 1 ? voertuigen[0].id : null);
    }
    return { projecten, recent, voertuigen };
  }, [ik.id]);

  const snelProjecten = useMemo(() => {
    if (!gegevens.data) return [] as Project[];
    const { projecten, recent } = gegevens.data;
    const opVolgorde = recent.map((id) => projecten.find((p) => p.id === id)).filter(Boolean) as Project[];
    const rest = projecten.filter((p) => !recent.includes(p.id));
    const lijst = [...opVolgorde, ...rest].slice(0, 5);
    const gekozen = projecten.find((p) => p.id === projectId);
    if (gekozen && !lijst.includes(gekozen)) lijst.unshift(gekozen);
    return lijst;
  }, [gegevens.data, projectId]);

  async function maakProject(naam: string) {
    try {
      const p = await nieuwProject(naam);
      await gegevens.opnieuw();
      setProjectId(p.id);
      setZoekBlad(false);
      melding('ok', `Project toegevoegd: ${p.naam}`);
    } catch (e) {
      melding('fout', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <Kop titel="Project en bus" opTerug={terug} />
      <main className="pagina met-balk">
        <section className="sectie">
          <h2>Je neemt mee ({regels.length})</h2>
          <div className="kaart">
            {regels.map((r) => (
              <div key={r.sleutel} className="tabel-regel">
                <span>{r.artikel.naam}</span>
                <b>{r.artikel.telwijze === 'aantal' ? aantalTekst(r.aantal, r.artikel.eenheid) : '1×'}</b>
              </div>
            ))}
          </div>
        </section>

        {gegevens.laden && !gegevens.data ? (
          <Laden />
        ) : gegevens.fout ? (
          <div className="foutvak">{gegevens.fout}</div>
        ) : (
          <>
            <section className="sectie">
              <h2>Project</h2>
              <div className="chips raster" role="group" aria-label="Project">
                {snelProjecten.map((p) => (
                  <button key={p.id} type="button" className="chip" aria-pressed={projectId === p.id} onClick={() => setProjectId(p.id)}>
                    {p.naam}
                    {p.adres && <small>{p.adres}</small>}
                  </button>
                ))}
                <button type="button" className="chip" aria-pressed={projectId === null} onClick={() => setProjectId(null)}>
                  Geen project
                </button>
              </div>
              <button className="knop rand klein" type="button" onClick={() => setZoekBlad(true)}>
                Ander of nieuw project
              </button>
            </section>

            <section className="sectie">
              <h2>Bus</h2>
              <div className="chips raster" role="group" aria-label="Bus">
                {gegevens.data?.voertuigen.map((v) => (
                  <button key={v.id} type="button" className="chip" aria-pressed={voertuigId === v.id} onClick={() => setVoertuigId(v.id)}>
                    {v.naam}
                    {v.kenteken && <small>{v.kenteken}</small>}
                  </button>
                ))}
                <button type="button" className="chip" aria-pressed={voertuigId === null} onClick={() => setVoertuigId(null)}>
                  Geen bus
                </button>
              </div>
            </section>
          </>
        )}
      </main>
      <div className="balk">
        <div className="binnen">
          <button className="knop groen" type="button" onClick={bevestig} disabled={bezig || projectId === undefined}>
            {bezig ? 'Bezig…' : projectId === undefined ? 'Kies een project' : knoptekst}
          </button>
        </div>
      </div>
      {zoekBlad && gegevens.data && (
        <ProjectZoeken
          projecten={gegevens.data.projecten}
          kies={(id) => {
            setProjectId(id);
            setZoekBlad(false);
          }}
          maak={maakProject}
          sluit={() => setZoekBlad(false)}
        />
      )}
    </>
  );
}

function ProjectZoeken({
  projecten,
  kies,
  maak,
  sluit,
}: {
  projecten: Project[];
  kies: (id: string) => void;
  maak: (naam: string) => Promise<void>;
  sluit: () => void;
}) {
  const [zoek, setZoek] = useState('');
  const [bezig, setBezig] = useState(false);
  const z = zoek.trim().toLowerCase();
  const gevonden = projecten.filter((p) => !z || p.naam.toLowerCase().includes(z) || (p.adres ?? '').toLowerCase().includes(z));
  const bestaatAl = projecten.some((p) => p.naam.toLowerCase() === z);
  return (
    <Blad titel="Project kiezen" sluit={sluit}>
      <input
        className="invoer"
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        placeholder="Zoek of typ een nieuwe naam"
        aria-label="Project zoeken"
        autoFocus
      />
      <div className="lijst">
        {gevonden.slice(0, 30).map((p) => (
          <button key={p.id} className="regel mand" type="button" onClick={() => kies(p.id)}>
            <span>
              <b>{p.naam}</b>
              {p.adres && <small>{p.adres}</small>}
            </span>
            <span className="label blauw">Kies</span>
          </button>
        ))}
        {gevonden.length === 0 && !z && <p className="uitleg">Nog geen projecten.</p>}
      </div>
      {z && !bestaatAl && (
        <button
          className="knop blauw breed"
          type="button"
          disabled={bezig}
          onClick={async () => {
            setBezig(true);
            await maak(zoek);
            setBezig(false);
          }}
        >
          Nieuw project: {zoek.trim()}
        </button>
      )}
    </Blad>
  );
}
