// Nieuwe kleur kiezen: veelgebruikte RAL-kleuren, alle RAL-kleuren, eigen kleuren (bijv. Sikkens- of Flexa-code) en kleur uit de foto.
import { useMemo, useState } from 'react';
import { hexNaarLab, isGeldigeHex, isLicht, normaliseerHex } from './kleurruimte';
import { dichtsteRal } from './beeld';
import { ralGroepen, ralKleuren, ralVeelgebruikt } from './ral';
import { bewaarMijnKleur, kleurLabel, leesMijnKleuren, verwijderMijnKleur, type GekozenKleur } from './paletten';

type Tab = 'veel' | 'ral' | 'mijn' | 'eigen';

export function KleurKiezer({
  huidig,
  beginEigen,
  kies,
  pakUitFoto,
  geenKleur,
}: {
  huidig: GekozenKleur | null;
  /** Kleur die net met de pipet uit de foto is gehaald. */
  beginEigen?: GekozenKleur | null;
  kies: (k: GekozenKleur) => void;
  pakUitFoto: () => void;
  geenKleur: () => void;
}) {
  const [tab, setTab] = useState<Tab>(beginEigen ? 'eigen' : 'veel');
  const [zoek, setZoek] = useState('');
  const [mijn, setMijn] = useState(leesMijnKleuren);
  const [eigen, setEigen] = useState<GekozenKleur>(beginEigen ?? { hex: huidig?.hex ?? '#F7F9EF', code: '', naam: '' });
  const [hexTekst, setHexTekst] = useState(eigen.hex);

  const ralGefilterd = useMemo(() => {
    const z = zoek.trim().toLowerCase().replace(/^ral\s*/, '');
    if (!z) return null;
    return ralKleuren.filter((k) => k.code.toLowerCase().includes(z) || k.naam.toLowerCase().includes(z));
  }, [zoek]);

  const suggesties = useMemo(() => (isGeldigeHex(eigen.hex) ? dichtsteRal(hexNaarLab(eigen.hex), 3) : []), [eigen.hex]);

  const Staal = ({ k, klein = false }: { k: GekozenKleur; klein?: boolean }) => {
    const gekozen = huidig?.hex === k.hex && (huidig.code ?? '') === (k.code ?? '');
    return (
      <button
        type="button"
        className={klein ? 'staal klein' : 'staal'}
        aria-pressed={gekozen}
        onClick={() => kies(k)}
        title={kleurLabel(k)}
      >
        <span className="vlak" style={{ background: k.hex, color: isLicht(k.hex) ? '#2D2E32' : '#FFFFFF' }}>
          {k.code?.replace(/^RAL /, '')}
        </span>
        {!klein && <span className="naam">{k.naam || k.code || k.hex}</span>}
      </button>
    );
  };

  function bewaarEigen() {
    const hex = isGeldigeHex(hexTekst) ? normaliseerHex(hexTekst) : eigen.hex;
    const k: GekozenKleur = { hex, code: eigen.code?.trim() || undefined, naam: eigen.naam?.trim() || undefined };
    setMijn(bewaarMijnKleur(k));
    kies(k);
  }

  return (
    <div className="kleurkiezer">
      <div className="tabs" role="tablist">
        {(
          [
            ['veel', 'Veel gebruikt'],
            ['ral', 'Alle RAL'],
            ['mijn', 'Mijn kleuren'],
            ['eigen', 'Eigen kleur'],
          ] as [Tab, string][]
        ).map(([id, tekst]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {tekst}
          </button>
        ))}
      </div>

      {tab === 'veel' && (
        <div className="stalen">
          {ralVeelgebruikt.map((k) => (
            <Staal key={k.code} k={k} />
          ))}
        </div>
      )}

      {tab === 'ral' && (
        <>
          <input
            className="invoer"
            type="search"
            inputMode="search"
            placeholder="Zoek op nummer of naam, bijv. 9001 of groen"
            aria-label="RAL-kleur zoeken"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
          />
          {ralGefilterd ? (
            ralGefilterd.length ? (
              <div className="stalen">
                {ralGefilterd.map((k) => (
                  <Staal key={k.code} k={k} />
                ))}
              </div>
            ) : (
              <p className="leeg">Geen RAL-kleur gevonden.</p>
            )
          ) : (
            ralGroepen.map((g) => (
              <section key={g.begin} className="sectie">
                <h2>{g.titel}</h2>
                <div className="stalen klein">
                  {ralKleuren
                    .filter((k) => k.code.startsWith(`RAL ${g.begin}`))
                    .map((k) => (
                      <Staal key={k.code} k={k} klein />
                    ))}
                </div>
              </section>
            ))
          )}
        </>
      )}

      {tab === 'mijn' &&
        (mijn.length ? (
          <div className="lijst">
            {mijn.map((k) => (
              <div key={k.hex + (k.code ?? '')} className="regel">
                <span className="staal-blok" style={{ background: k.hex }} />
                <button type="button" className="linkloos" onClick={() => kies(k)}>
                  <b>{k.code || k.naam || k.hex}</b>
                  <small>{[k.code ? k.naam : null, k.hex].filter(Boolean).join(' · ')}</small>
                </button>
                <button type="button" className="weg" aria-label={`${kleurLabel(k)} verwijderen`} onClick={() => setMijn(verwijderMijnKleur(k))}>
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="leeg">Nog geen eigen kleuren. Maak er een bij Eigen kleur, bijvoorbeeld een Sikkens- of Flexa-code.</p>
        ))}

      {tab === 'eigen' && (
        <div className="formulier">
          <button type="button" className="knop rand breed" onClick={pakUitFoto}>
            Kleur uit de foto pakken
          </button>
          <div className="eigen-kleur">
            <label className="kleurvak" style={{ background: isGeldigeHex(hexTekst) ? normaliseerHex(hexTekst) : eigen.hex }}>
              <input
                type="color"
                aria-label="Kleur kiezen"
                value={eigen.hex.toLowerCase()}
                onChange={(e) => {
                  const hex = e.target.value.toUpperCase();
                  setEigen({ ...eigen, hex });
                  setHexTekst(hex);
                }}
              />
            </label>
            <label className="veld">
              <span>Kleurwaarde (hex)</span>
              <input
                className="invoer"
                value={hexTekst}
                onChange={(e) => {
                  setHexTekst(e.target.value);
                  if (isGeldigeHex(e.target.value)) setEigen({ ...eigen, hex: normaliseerHex(e.target.value) });
                }}
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
          </div>
          <div className="rij2">
            <label className="veld">
              <span>Kleurcode</span>
              <input className="invoer" value={eigen.code ?? ''} onChange={(e) => setEigen({ ...eigen, code: e.target.value })} placeholder="bijv. Sikkens F6.05.80" />
            </label>
            <label className="veld">
              <span>Naam (mag leeg)</span>
              <input className="invoer" value={eigen.naam ?? ''} onChange={(e) => setEigen({ ...eigen, naam: e.target.value })} placeholder="bijv. Grachtengroen" />
            </label>
          </div>
          {suggesties.length > 0 && (
            <div className="sectie">
              <h2>Lijkt op</h2>
              <div className="stalen">
                {suggesties.map((k) => (
                  <Staal key={k.code} k={k} />
                ))}
              </div>
            </div>
          )}
          <button type="button" className="knop blauw breed" onClick={bewaarEigen}>
            Deze kleur gebruiken
          </button>
          <p className="uitleg">De kleur wordt bewaard bij Mijn kleuren op deze telefoon.</p>
        </div>
      )}

      {huidig && (
        <button type="button" className="knop rand breed" onClick={geenKleur}>
          Geen nieuwe kleur (laten zoals het is)
        </button>
      )}
    </div>
  );
}
