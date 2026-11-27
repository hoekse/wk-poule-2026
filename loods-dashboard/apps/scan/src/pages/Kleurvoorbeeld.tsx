// Kleurvoorbeeld: foto van een gevel of ruimte → de app vindt zelf de kleurvlakken → per onderdeel een nieuwe kleur kiezen → delen met de klant.
// Alles gebeurt op de telefoon zelf; de foto wordt nergens heen gestuurd.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { check, haalProjecten } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useLaden } from '../lib/useLaden';
import { useMelding } from '../components/Meldingen';
import { Blad, Fout, Kop, Laden } from '../components/Basis';
import {
  IcoonCamera,
  IcoonDelen,
  IcoonGum,
  IcoonHand,
  IcoonOngedaan,
  IcoonOog,
  IcoonPassend,
  IcoonPenseel,
  IcoonPlus,
  IcoonToverstaf,
  IcoonToverstafMin,
  IcoonVergelijk,
} from '../components/Iconen';
import {
  GEEN,
  MAX_EIGENAAR,
  MAX_ZIJDE,
  Werkbeeld,
  gemiddeldeKleur,
  pasMaskerToe,
  penseel,
  telPerOnderdeel,
  toverstaf,
  zoekKleurvlakken,
  type Rechthoek,
} from '../kleur/beeld';
import { hexNaarLineair, isLicht, kleurNaam, labNaarHex, type Lab, type Rgb } from '../kleur/kleurruimte';
import { Weergave, leesFoto } from '../kleur/weergave';
import { FotoVenster, type Gereedschap } from '../kleur/FotoVenster';
import { KleurKiezer } from '../kleur/KleurKiezer';
import { kleurLabel, onderdeelNamenBinnen, onderdeelNamenBuiten, ruimtes, type GekozenKleur } from '../kleur/paletten';
import { deelAfbeelding, maakAfbeelding } from '../kleur/exporteren';

type Onderdeel = {
  id: number;
  naam: string;
  /** Kleur zoals op de foto. */
  was: string;
  wasHex: string;
  kleur: GekozenKleur | null;
  aandeel: number;
  /** Zelf gemaakt (niet automatisch gevonden): "was"-kleur volgt de selectie. */
  eigen: boolean;
};

type Stand = { eigenaar: Uint8Array; onderdelen: Onderdeel[] };
type BladSoort = null | 'kleur' | 'naam' | 'nieuw' | 'delen';

const MAX_ONGEDAAN = 12;

export function Kleurvoorbeeld() {
  const navigate = useNavigate();
  const melding = useMelding();

  const [stap, setStap] = useState<'kiezen' | 'bezig' | 'bewerken'>('kiezen');
  const [ruimteId, setRuimteId] = useState('voorgevel');
  const [project, setProject] = useState('');
  const [fout, setFout] = useState<string | null>(null);

  const [weergave, setWeergave] = useState<Weergave | null>(null);
  const [onderdelen, setOnderdelen] = useState<Onderdeel[]>([]);
  const [actief, setActief] = useState<number | null>(null);
  const [gereedschap, setGereedschap] = useState<Gereedschap>('vlak');
  const [tolerantie, setTolerantie] = useState(10);
  const [overal, setOveral] = useState(false);
  const [penseelDikte, setPenseelDikte] = useState(28);
  const [slim, setSlim] = useState(true);
  const [vergelijken, setVergelijken] = useState(false);
  const [toonSelectie, setToonSelectie] = useState(true);
  const [passend, setPassend] = useState(0);
  const [blad, setBlad] = useState<BladSoort>(null);
  const [pipetKleur, setPipetKleur] = useState<GekozenKleur | null>(null);
  const [aantalOngedaan, setAantalOngedaan] = useState(0);
  const [bezigMetDelen, setBezigMetDelen] = useState(false);
  /** Gemaakte afbeelding die niet via het deelmenu kon: tonen met een knop Opslaan. */
  const [afbeelding, setAfbeelding] = useState<{ url: string; naam: string } | null>(null);

  useEffect(() => () => {
    if (afbeelding) URL.revokeObjectURL(afbeelding.url);
  }, [afbeelding]);

  const historie = useRef<Stand[]>([]);
  const schaal = useRef(3);
  const streep = useRef<{ kleur: Lab | null; gebied: Rechthoek | null } | null>(null);
  const gewijzigd = useRef(false);
  const vorigGereedschap = useRef<Gereedschap>('vlak');

  const ruimte = ruimtes.find((r) => r.id === ruimteId) ?? ruimtes[0];
  const projecten = useLaden(haalProjecten, []);
  const wb = weergave?.wb ?? null;
  const actiefOnderdeel = onderdelen.find((o) => o.id === actief) ?? null;

  /** Nieuwe kleur per eigenaarnummer (lineair licht). */
  const kleurSleutel = onderdelen.map((o) => `${o.id}:${o.kleur?.hex ?? ''}`).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const doelen = useMemo(() => doelenVan(onderdelen), [kleurSleutel]);
  const doelenRef = useRef(doelen);
  doelenRef.current = doelen;

  // Opnieuw inkleuren als een kleur verandert.
  useEffect(() => {
    weergave?.kleurIn(doelen);
  }, [weergave, doelen]);

  // Selectie van het actieve onderdeel tonen.
  useEffect(() => {
    weergave?.toonSelectie(actief, randDikte());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weergave, actief]);

  // Niet per ongeluk wegklikken.
  useEffect(() => {
    if (stap !== 'bewerken') return;
    const waarschuw = (e: BeforeUnloadEvent) => {
      if (gewijzigd.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', waarschuw);
    return () => window.removeEventListener('beforeunload', waarschuw);
  }, [stap]);

  function randDikte() {
    return Math.max(1, schaal.current * 1.3);
  }

  // ---------- Foto inlezen en kleurvlakken zoeken ----------
  async function laadFoto(bestand: File | undefined) {
    if (!bestand) return;
    setFout(null);
    setStap('bezig');
    await new Promise((r) => setTimeout(r, 60)); // laat eerst het wachtscherm zien
    try {
      const data = await leesFoto(bestand, MAX_ZIJDE);
      const beeld = new Werkbeeld(data);
      const groepen = zoekKleurvlakken(beeld);
      const telNaam = new Map<string, number>();
      const lijst: Onderdeel[] = groepen.map((g) => {
        const n = (telNaam.get(g.naam) ?? 0) + 1;
        telNaam.set(g.naam, n);
        const naam = n > 1 ? `${g.naam} ${n}` : g.naam;
        return { id: g.id, naam, was: naam, wasHex: g.hex, kleur: null, aandeel: g.aandeel, eigen: false };
      });
      historie.current = [];
      setAantalOngedaan(0);
      gewijzigd.current = false;
      setVergelijken(false);
      setToonSelectie(true);
      setGereedschap('vlak');
      setOnderdelen(lijst);
      setActief(lijst[0]?.id ?? null);
      setWeergave(new Weergave(beeld));
      setStap('bewerken');
    } catch (e) {
      setFout(e instanceof Error ? e.message : String(e));
      setStap('kiezen');
    }
  }

  // ---------- Ongedaan maken ----------
  function bewaarStand() {
    if (!wb) return;
    historie.current.push({ eigenaar: wb.kopieEigenaar(), onderdelen });
    if (historie.current.length > MAX_ONGEDAAN) historie.current.shift();
    setAantalOngedaan(historie.current.length);
    gewijzigd.current = true;
  }

  function ongedaan(stil = false) {
    const s = historie.current.pop();
    setAantalOngedaan(historie.current.length);
    if (!s || !wb || !weergave) return;
    wb.zetEigenaar(s.eigenaar);
    setOnderdelen(s.onderdelen);
    if (!s.onderdelen.some((o) => o.id === actief)) setActief(s.onderdelen[0]?.id ?? null);
    weergave.kleurIn(doelenVan(s.onderdelen));
    weergave.toonSelectie(actief, randDikte());
    if (!stil) melding('info', 'Ongedaan gemaakt');
  }

  /** Na een selectiewijziging: alles opnieuw tekenen en de aandelen bijwerken. */
  function naWijziging() {
    if (!wb || !weergave) return;
    weergave.kleurIn(doelenRef.current);
    weergave.toonSelectie(actief, randDikte());
    const tel = telPerOnderdeel(wb);
    setOnderdelen((lijst) =>
      lijst.map((o) => {
        const aandeel = tel[o.id] / wb.n;
        if (!o.eigen) return { ...o, aandeel };
        const lab = gemiddeldeKleur(wb, o.id);
        return lab ? { ...o, aandeel, was: kleurNaam(lab), wasHex: labNaarHex(lab) } : { ...o, aandeel };
      }),
    );
  }

  // ---------- Tikken en schilderen op de foto ----------
  function opTik(x: number, y: number) {
    if (!wb) return;
    if (gereedschap === 'pipet') {
      const hex = labNaarHex(wb.kleurRond(x, y, 3));
      setPipetKleur({ hex, code: '', naam: '' });
      setGereedschap(vorigGereedschap.current);
      setBlad('kleur');
      return;
    }
    if (actief == null) {
      melding('let-op', 'Kies eerst een onderdeel in de lijst.');
      return;
    }
    const erbij = gereedschap === 'vlak';
    bewaarStand();
    const masker = toverstaf(wb, x, y, tolerantie, overal);
    const aantal = pasMaskerToe(wb, masker, actief, erbij);
    if (!aantal) {
      ongedaan(true);
      melding('info', erbij ? `Dit vlak hoort al bij ${actiefOnderdeel?.naam ?? 'dit onderdeel'}.` : `Hier zat niets van ${actiefOnderdeel?.naam ?? 'dit onderdeel'}.`);
      return;
    }
    naWijziging();
  }

  function streepBegin(x: number, y: number) {
    if (!wb || actief == null) {
      if (actief == null) melding('let-op', 'Kies eerst een onderdeel in de lijst.');
      return;
    }
    bewaarStand();
    streep.current = { kleur: gereedschap === 'penseel' && slim ? wb.kleurRond(x, y, 2) : null, gebied: null };
    streepStuk(x, y, x, y);
  }

  function streepStuk(x0: number, y0: number, x1: number, y1: number) {
    const s = streep.current;
    if (!s || !wb || !weergave || actief == null) return;
    const straal = Math.max(1, (penseelDikte / 2) * schaal.current);
    const g = penseel(wb, x0, y0, x1, y1, straal, actief, gereedschap === 'penseel', s.kleur ? { lab: s.kleur, tolerantie: tolerantie * 1.4 } : null);
    weergave.toonSelectie(actief, randDikte(), g);
    weergave.kleurIn(doelenRef.current, g);
  }

  function streepEind() {
    if (!streep.current) return;
    streep.current = null;
    naWijziging();
  }

  function streepAnnuleer() {
    if (!streep.current) return;
    streep.current = null;
    ongedaan(true);
  }

  // ---------- Onderdelen ----------
  function kiesKleur(k: GekozenKleur | null) {
    if (actief == null) return;
    bewaarStand();
    setOnderdelen((l) => l.map((o) => (o.id === actief ? { ...o, kleur: k } : o)));
    setBlad(null);
    setPipetKleur(null);
  }

  function nieuwOnderdeel(naam: string) {
    const ids = new Set(onderdelen.map((o) => o.id));
    let id = 1;
    while (ids.has(id) && id <= MAX_EIGENAAR) id++;
    if (id > MAX_EIGENAAR) {
      melding('fout', 'Er zijn te veel onderdelen. Verwijder er eerst een paar.');
      return;
    }
    bewaarStand();
    setOnderdelen((l) => [{ id, naam, was: 'nog leeg', wasHex: '#8A8B90', kleur: null, aandeel: 0, eigen: true }, ...l]);
    setActief(id);
    setGereedschap('vlak');
    setVergelijken(false);
    setToonSelectie(true);
    setBlad(null);
    melding('info', `Tik op de foto om vlakken aan ${naam} toe te voegen.`);
  }

  function hernoem(naam: string) {
    if (actief == null) return;
    setOnderdelen((l) => l.map((o) => (o.id === actief ? { ...o, naam } : o)));
    gewijzigd.current = true;
    setBlad(null);
  }

  function verwijderOnderdeel() {
    if (!wb || actief == null) return;
    bewaarStand();
    for (let i = 0; i < wb.n; i++) if (wb.eigenaar[i] === actief) wb.eigenaar[i] = GEEN;
    wb.gewijzigd();
    const rest = onderdelen.filter((o) => o.id !== actief);
    setOnderdelen(rest);
    setActief(rest[0]?.id ?? null);
    setBlad(null);
    weergave?.kleurIn(doelenVan(rest));
  }

  // ---------- Delen ----------
  async function deel(voorEnNa: boolean) {
    if (!weergave) return;
    const regels = onderdelen
      .filter((o) => o.kleur && o.aandeel > 0)
      .map((o) => ({ onderdeel: o.naam, was: o.was, wasHex: o.wasHex, kleur: o.kleur! }));
    if (!regels.length) {
      melding('let-op', 'Kies eerst voor minstens één onderdeel een nieuwe kleur.');
      return;
    }
    setBezigMetDelen(true);
    try {
      const vandaag = new Date();
      const blob = await maakAfbeelding({
        voor: weergave.voor,
        na: weergave.na,
        voorEnNa,
        titel: `Kleurvoorbeeld ${ruimte.naam.toLowerCase()}`,
        onderTitel: [project.trim(), 'Hoeksema Schilderwerken', vandaag.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })]
          .filter(Boolean)
          .join(' · '),
        regels,
      });
      const naam = `kleurvoorbeeld-${(project.trim() || ruimte.naam).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${vandaag.toISOString().slice(0, 10)}.jpg`;
      const uitkomst = await deelAfbeelding(blob, naam);
      if (uitkomst === 'gedeeld') setBlad(null);
      if (uitkomst === 'niet-mogelijk') {
        setAfbeelding({ url: URL.createObjectURL(blob), naam });
        setBlad(null);
      }
    } catch (e) {
      melding('fout', e instanceof Error ? e.message : String(e));
    } finally {
      setBezigMetDelen(false);
    }
  }

  function terug() {
    if (stap === 'bewerken' && gewijzigd.current && !window.confirm('Stoppen met dit kleurvoorbeeld? Wat je hebt gedaan, wordt niet bewaard.')) return;
    navigate('/');
  }

  function andereFoto() {
    if (gewijzigd.current && !window.confirm('Een andere foto kiezen? Dit kleurvoorbeeld wordt niet bewaard.')) return;
    setWeergave(null);
    setOnderdelen([]);
    setActief(null);
    setStap('kiezen');
  }

  // ---------- Schermen ----------
  if (stap === 'kiezen' || stap === 'bezig') {
    return (
      <>
        <Kop titel="Kleurvoorbeeld" opTerug={terug} />
        <main className="pagina">
          {stap === 'bezig' ? (
            <Laden tekst="Kleuren in de foto zoeken…" />
          ) : (
            <>
              <p className="uitleg">
                Maak of kies een foto van een gevel of ruimte. De app zoekt zelf de kleurvlakken; daarna kies je per onderdeel een nieuwe kleur
                en deel je het resultaat met de klant.
              </p>
              <section className="sectie">
                <h2>Wat staat er op de foto?</h2>
                <div className="chips raster">
                  {ruimtes.map((r) => (
                    <button key={r.id} type="button" className="chip" aria-pressed={r.id === ruimteId} onClick={() => setRuimteId(r.id)}>
                      {r.naam}
                    </button>
                  ))}
                </div>
              </section>
              <label className="veld">
                <span>Project of adres (mag leeg)</span>
                <input className="invoer" list="kv-projecten" value={project} onChange={(e) => setProject(e.target.value)} placeholder="bijv. Oudestraat 12, Kampen" />
                <datalist id="kv-projecten">
                  {(projecten.data ?? []).map((p) => (
                    <option key={p.id} value={p.naam} />
                  ))}
                </datalist>
              </label>
              {fout && <Fout tekst={fout} />}
              <div className="rij2">
                <label className="knop blauw">
                  <IcoonCamera />
                  Foto maken
                  <input className="verborgen" type="file" accept="image/*" capture="environment" onChange={(e) => void laadFoto(e.target.files?.[0])} />
                </label>
                <label className="knop rand">
                  Foto kiezen
                  <input className="verborgen" type="file" accept="image/*" onChange={(e) => void laadFoto(e.target.files?.[0])} />
                </label>
              </div>
              <div className="letop klein">
                Tip: fotografeer recht van voren, bij daglicht zonder felle zon. Kleuren op een scherm zijn altijd een benadering.
              </div>
            </>
          )}
        </main>
      </>
    );
  }

  if (!weergave) return <Laden />;

  const hulptekst: Record<Gereedschap, string> = {
    vlak: `Tik op een vlak in de foto om het bij ${actiefOnderdeel?.naam ?? 'het onderdeel'} te voegen.`,
    'vlak-eraf': `Tik op een vlak om het uit ${actiefOnderdeel?.naam ?? 'het onderdeel'} te halen.`,
    penseel: 'Schilder met je vinger over wat erbij moet. Zoom in met twee vingers voor kleine stukjes.',
    gum: 'Veeg over wat er niet bij hoort.',
    schuiven: 'Sleep om te verschuiven, knijp met twee vingers om te zoomen.',
    pipet: 'Tik op de kleur in de foto die je wilt overnemen.',
  };

  const gereedschappen: [Gereedschap, string, typeof IcoonHand][] = [
    ['vlak', 'Vlak erbij', IcoonToverstaf],
    ['vlak-eraf', 'Vlak eraf', IcoonToverstafMin],
    ['penseel', 'Penseel', IcoonPenseel],
    ['gum', 'Gum', IcoonGum],
    ['schuiven', 'Schuiven', IcoonHand],
  ];

  const namen = ruimte.buiten ? onderdeelNamenBuiten : onderdeelNamenBinnen;

  return (
    <>
      <Kop
        titel={ruimte.naam}
        opTerug={terug}
        rechts={
          <>
            <button type="button" className="kopknop" aria-label="Ongedaan maken" disabled={!aantalOngedaan} onClick={() => ongedaan()}>
              <IcoonOngedaan />
            </button>
            <button type="button" className="kopknop blauw" aria-label="Delen" onClick={() => setBlad('delen')}>
              <IcoonDelen />
            </button>
          </>
        }
      />
      <main className="pagina kv">
        <div className="kv-foto">
          <FotoVenster
            weergave={weergave}
            gereedschap={gereedschap}
            vergelijken={vergelijken}
            toonSelectie={toonSelectie && !vergelijken}
            passend={passend}
            onTik={opTik}
            onStreepBegin={streepBegin}
            onStreep={streepStuk}
            onStreepEind={streepEind}
            onStreepAnnuleer={streepAnnuleer}
            onSchaal={(s) => {
              schaal.current = s;
              weergave.toonSelectie(actief, randDikte());
            }}
          />
          <div className="kv-fotobalk">
            <button type="button" aria-pressed={vergelijken} onClick={() => setVergelijken((v) => !v)}>
              <IcoonVergelijk />
              Voor / na
            </button>
            <button type="button" aria-pressed={toonSelectie && !vergelijken} onClick={() => setToonSelectie((v) => !v)} disabled={vergelijken}>
              <IcoonOog />
              Selectie
            </button>
            <button type="button" onClick={() => setPassend((n) => n + 1)}>
              <IcoonPassend />
              Hele foto
            </button>
          </div>
        </div>

        <div className="kv-strook" role="group" aria-label="Onderdelen">
          <button type="button" className="kv-chip nieuw" onClick={() => setBlad('nieuw')}>
            <IcoonPlus />
            Nieuw
          </button>
          {onderdelen.map((o) => (
            <button
              key={o.id}
              type="button"
              className="kv-chip"
              aria-pressed={o.id === actief}
              onClick={() => {
                setActief(o.id);
                if (gereedschap === 'schuiven' || gereedschap === 'pipet') setGereedschap('vlak');
              }}
            >
              <StaalPaar was={o.wasHex} nieuw={o.kleur?.hex} />
              <span>
                <b>{o.naam}</b>
                <small>{o.aandeel > 0 && o.aandeel < 0.005 ? '< 1%' : `${Math.round(o.aandeel * 100)}%`}{o.kleur ? ` · ${o.kleur.code ?? o.kleur.naam ?? ''}` : ''}</small>
              </span>
            </button>
          ))}
        </div>

        {actiefOnderdeel && (
          <section className="kaart kv-actief" aria-label="Gekozen onderdeel">
            <div className="kv-actief-kop">
              <StaalPaar was={actiefOnderdeel.wasHex} nieuw={actiefOnderdeel.kleur?.hex} groot />
              <div className="kv-actief-tekst">
                <b>{actiefOnderdeel.naam}</b>
                <small>
                  {actiefOnderdeel.kleur ? `Nieuw: ${kleurLabel(actiefOnderdeel.kleur)}` : `Nu ${actiefOnderdeel.was.toLowerCase()}, nog geen nieuwe kleur`}
                </small>
              </div>
              <button type="button" className="knop mini rand" onClick={() => setBlad('naam')}>
                Naam
              </button>
            </div>
            <button type="button" className="knop blauw breed" onClick={() => setBlad('kleur')}>
              {actiefOnderdeel.kleur ? 'Andere kleur kiezen' : 'Nieuwe kleur kiezen'}
            </button>
            <RestverfHint kleur={actiefOnderdeel.kleur} />
          </section>
        )}

        <section className="sectie" aria-label="Selectie aanpassen">
          <div className="kv-gereedschap" role="toolbar" aria-label="Gereedschap">
            {gereedschappen.map(([id, tekst, Icoon]) => (
              <button key={id} type="button" aria-pressed={gereedschap === id} onClick={() => setGereedschap(id)}>
                <Icoon />
                {tekst}
              </button>
            ))}
          </div>
          <p className="uitleg">{hulptekst[gereedschap]}</p>
          {(gereedschap === 'vlak' || gereedschap === 'vlak-eraf') && (
            <>
              <Schuif label="Gevoeligheid" links="precies" rechts="ruim" min={4} max={30} waarde={tolerantie} zet={setTolerantie} />
              <label className="vinkje">
                <input type="checkbox" checked={overal} onChange={(e) => setOveral(e.target.checked)} />
                Ook losse plekken met dezelfde kleur
              </label>
            </>
          )}
          {(gereedschap === 'penseel' || gereedschap === 'gum') && (
            <>
              <Schuif label="Dikte" links="dun" rechts="dik" min={8} max={90} waarde={penseelDikte} zet={setPenseelDikte} />
              {gereedschap === 'penseel' && (
                <label className="vinkje">
                  <input type="checkbox" checked={slim} onChange={(e) => setSlim(e.target.checked)} />
                  Alleen dezelfde kleur (niet over de rand)
                </label>
              )}
            </>
          )}
        </section>

        <button type="button" className="linkknop" onClick={andereFoto}>
          Andere foto kiezen
        </button>
      </main>

      {blad === 'kleur' && actiefOnderdeel && (
        <Blad
          titel={`Kleur voor ${actiefOnderdeel.naam}`}
          sluit={() => {
            setBlad(null);
            setPipetKleur(null);
          }}
        >
          <KleurKiezer
            huidig={actiefOnderdeel.kleur}
            beginEigen={pipetKleur}
            kies={kiesKleur}
            geenKleur={() => kiesKleur(null)}
            pakUitFoto={() => {
              if (gereedschap !== 'pipet') vorigGereedschap.current = gereedschap;
              setGereedschap('pipet');
              setVergelijken(false);
              setBlad(null);
              melding('info', 'Tik op de kleur in de foto.');
            }}
          />
        </Blad>
      )}

      {(blad === 'naam' || blad === 'nieuw') && (
        <NaamBlad
          titel={blad === 'nieuw' ? 'Nieuw onderdeel' : 'Naam wijzigen'}
          begin={blad === 'naam' ? (actiefOnderdeel?.naam ?? '') : ''}
          namen={namen}
          bevestigTekst={blad === 'nieuw' ? 'Onderdeel maken' : 'Naam bewaren'}
          sluit={() => setBlad(null)}
          bevestig={blad === 'nieuw' ? nieuwOnderdeel : hernoem}
          verwijder={blad === 'naam' ? verwijderOnderdeel : undefined}
        />
      )}

      {blad === 'delen' && (
        <Blad titel="Kleurvoorbeeld delen" sluit={() => setBlad(null)}>
          <p className="uitleg">Er komt een afbeelding met de foto en een lijst van de gekozen kleuren. Delen kan via WhatsApp, mail of opslaan in je foto's.</p>
          <button type="button" className="knop blauw breed" disabled={bezigMetDelen} onClick={() => void deel(true)}>
            Voor en na delen
          </button>
          <button type="button" className="knop rand breed" disabled={bezigMetDelen} onClick={() => void deel(false)}>
            Alleen het nieuwe kleurvoorbeeld
          </button>
          {bezigMetDelen && <Laden tekst="Afbeelding maken…" />}
        </Blad>
      )}

      {afbeelding && (
        <Blad titel="Kleurvoorbeeld" sluit={() => setAfbeelding(null)}>
          <p className="uitleg">Delen via het deelmenu kan hier niet. Sla de afbeelding op en stuur hem daarna door.</p>
          <img className="kv-afbeelding" src={afbeelding.url} alt="Kleurvoorbeeld met voor en na en de gekozen kleuren" />
          <a className="knop blauw breed" href={afbeelding.url} download={afbeelding.naam}>
            Afbeelding opslaan
          </a>
        </Blad>
      )}
    </>
  );
}

function doelenVan(lijst: Onderdeel[]): (Rgb | null)[] {
  const d: (Rgb | null)[] = [];
  for (const o of lijst) d[o.id] = o.kleur ? hexNaarLineair(o.kleur.hex) : null;
  return d;
}

function StaalPaar({ was, nieuw, groot = false }: { was: string; nieuw?: string; groot?: boolean }) {
  return (
    <span className={groot ? 'staalpaar groot' : 'staalpaar'} aria-hidden="true">
      <span style={{ background: was }} />
      <span style={{ background: nieuw ?? was }}>
        {!nieuw && <i style={{ color: isLicht(was) ? '#2D2E32' : '#FFFFFF' }}>?</i>}
      </span>
    </span>
  );
}

function Schuif({
  label,
  links,
  rechts,
  min,
  max,
  waarde,
  zet,
}: {
  label: string;
  links: string;
  rechts: string;
  min: number;
  max: number;
  waarde: number;
  zet: (n: number) => void;
}) {
  return (
    <label className="schuif">
      <span>{label}</span>
      <input type="range" min={min} max={max} value={waarde} onChange={(e) => zet(Number(e.target.value))} />
      <small>
        <span>{links}</span>
        <span>{rechts}</span>
      </small>
    </label>
  );
}

function NaamBlad({
  titel,
  begin,
  namen,
  bevestigTekst,
  sluit,
  bevestig,
  verwijder,
}: {
  titel: string;
  begin: string;
  namen: string[];
  bevestigTekst: string;
  sluit: () => void;
  bevestig: (naam: string) => void;
  verwijder?: () => void;
}) {
  const [naam, setNaam] = useState(begin);
  return (
    <Blad titel={titel} sluit={sluit}>
      <div className="chips">
        {namen.map((n) => (
          <button key={n} type="button" className="chip" aria-pressed={naam === n} onClick={() => setNaam(n)}>
            {n}
          </button>
        ))}
      </div>
      <input className="invoer" value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Of typ een naam" aria-label="Naam" />
      <button type="button" className="knop blauw breed" disabled={!naam.trim()} onClick={() => bevestig(naam.trim())}>
        {bevestigTekst}
      </button>
      {verwijder && (
        <button type="button" className="knop rand breed" onClick={verwijder}>
          Onderdeel verwijderen
        </button>
      )}
    </Blad>
  );
}

/** Is er restverf in deze kleur? (zoekt op het nummer in de kleurcode, bijv. 9001) */
function RestverfHint({ kleur }: { kleur: GekozenKleur | null }) {
  const zoekterm = (kleur?.code ?? '').replace(/^RAL\s*/i, '').trim();
  const [aantal, setAantal] = useState<number | null>(null);
  useEffect(() => {
    setAantal(null);
    if (zoekterm.length < 3) return;
    let weg = false;
    supabase
      .from('verfrestanten')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aanwezig')
      .ilike('kleurcode', `%${zoekterm.replace(/[%_]/g, '')}%`)
      .then((res) => {
        if (weg) return;
        try {
          check(res);
          setAantal(res.count ?? 0);
        } catch {
          setAantal(null);
        }
      });
    return () => {
      weg = true;
    };
  }, [zoekterm]);
  if (!aantal) return null;
  return (
    <p className="kv-restverf">
      Restverf op voorraad: {aantal} {aantal === 1 ? 'bus' : 'bussen'} met {zoekterm} (zie Restverf zoeken)
    </p>
  );
}
