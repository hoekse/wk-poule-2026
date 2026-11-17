import { useState } from 'react';
import { Blad, Kop } from '../components/Basis';
import { LijnGrafiek } from '../components/Grafiek';
import { IcoonPlus, IcoonPrullenbak } from '../components/Iconen';
import { kortDatum, vandaag } from '../lib/datum';
import { fmt1 } from '../lib/herstel';
import { getal } from '../lib/importeren';
import { nieuweMeting } from '../lib/staat';
import type { Meting } from '../lib/types';
import { useWinkel } from '../lib/winkel';
import { gewichtReeks } from './Voortgang';

const VELDEN: { k: keyof Meting; naam: string; eenheid: string }[] = [
  { k: 'gewicht', naam: 'Gewicht', eenheid: 'kg' },
  { k: 'vetPct', naam: 'Vetpercentage', eenheid: '%' },
  { k: 'taille', naam: 'Taille', eenheid: 'cm' },
  { k: 'heup', naam: 'Heup', eenheid: 'cm' },
  { k: 'borst', naam: 'Borst', eenheid: 'cm' },
  { k: 'arm', naam: 'Bovenarm', eenheid: 'cm' },
  { k: 'dij', naam: 'Bovenbeen', eenheid: 'cm' },
];

export function Lichaam() {
  const { staat, wijzig, melding } = useWinkel();
  const [bewerk, setBewerk] = useState<Meting | null>(null);
  const metingen = [...staat.metingen].sort((a, b) => b.datum.localeCompare(a.datum));
  const gewicht = gewichtReeks(staat);
  const taille = staat.metingen.filter((m) => m.taille).sort((a, b) => a.datum.localeCompare(b.datum)).map((m) => ({ x: m.datum, y: m.taille! }));
  const vet = [
    ...Object.values(staat.dagdata).filter((d) => d.vetPct).map((d) => ({ x: d.datum, y: d.vetPct! })),
    ...staat.metingen.filter((m) => m.vetPct).map((m) => ({ x: m.datum, y: m.vetPct! })),
  ].sort((a, b) => a.x.localeCompare(b.x));

  return (
    <div className="pagina">
      <Kop
        titel="Lichaam"
        terug
        rechts={
          <button className="knop primair klein" onClick={() => setBewerk(nieuweMeting(vandaag()))}>
            <IcoonPlus /> Meting
          </button>
        }
      />
      <section className="kaart">
        <h2>Gewicht</h2>
        {gewicht.length ? (
          <>
            <LijnGrafiek label="Lichaamsgewicht" punten={gewicht} eenheid="kg" />
            {gewicht.length >= 2 && (
              <p className="klein dun">
                {(() => {
                  const v = gewicht[gewicht.length - 1].y - gewicht[0].y;
                  return `${v >= 0 ? '+' : ''}${fmt1(v)} kg sinds ${kortDatum(gewicht[0].x)}.`;
                })()}
              </p>
            )}
          </>
        ) : (
          <p className="dun klein">Weeg jezelf bij voorkeur 's ochtends na het opstaan. Gewicht uit Apple Health komt hier vanzelf bij.</p>
        )}
      </section>
      {taille.length > 0 && (
        <section className="kaart">
          <h2>Taille</h2>
          <LijnGrafiek label="Tailleomtrek" punten={taille} eenheid="cm" />
        </section>
      )}
      {vet.length > 0 && (
        <section className="kaart">
          <h2>Vetpercentage</h2>
          <LijnGrafiek label="Vetpercentage" punten={vet} eenheid="%" />
        </section>
      )}
      <section className="sectie">
        <span className="label">Metingen</span>
        {metingen.length === 0 ? (
          <div className="kaart">
            <p className="dun">Meet eens per 2-4 weken je taille (op navelhoogte) en eventueel arm, borst en bovenbeen. Zo zie je ook verandering als de weegschaal stilstaat.</p>
          </div>
        ) : (
          <div className="lijst">
            {metingen.map((m) => (
              <button key={m.id} className="lijstitem" onClick={() => setBewerk(m)}>
                <div className="groei">
                  <div className="titel">{kortDatum(m.datum)}</div>
                  <div className="dun klein getal">
                    {VELDEN.filter((v) => m[v.k] != null)
                      .map((v) => `${v.naam.toLowerCase()} ${fmt1(m[v.k] as number)} ${v.eenheid}`)
                      .join(' · ') || m.notitie}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      <MetingBlad
        meting={bewerk}
        sluit={() => setBewerk(null)}
        bewaar={(m) => {
          wijzig((s) => ({ ...s, metingen: [...s.metingen.filter((x) => x.id !== m.id), m] }));
          melding('Meting opgeslagen');
          setBewerk(null);
        }}
        verwijder={(id) => {
          wijzig((s) => ({ ...s, metingen: s.metingen.filter((x) => x.id !== id) }));
          setBewerk(null);
        }}
        nieuw={!!bewerk && !staat.metingen.some((x) => x.id === bewerk.id)}
      />
    </div>
  );
}

function MetingBlad({ meting, sluit, bewaar, verwijder, nieuw }: { meting: Meting | null; sluit: () => void; bewaar: (m: Meting) => void; verwijder: (id: string) => void; nieuw: boolean }) {
  const [waarden, setWaarden] = useState<Record<string, string>>({});
  const [datum, setDatum] = useState('');
  const [notitie, setNotitie] = useState('');
  const [sleutel, setSleutel] = useState<string | null>(null);
  if (meting && sleutel !== meting.id) {
    setSleutel(meting.id);
    setDatum(meting.datum);
    setNotitie(meting.notitie ?? '');
    setWaarden(Object.fromEntries(VELDEN.map((v) => [v.k, meting[v.k] != null ? String(meting[v.k]).replace('.', ',') : ''])));
  }
  if (!meting) return null;
  return (
    <Blad titel={nieuw ? 'Nieuwe meting' : 'Meting aanpassen'} open sluit={() => { setSleutel(null); sluit(); }}>
      <label className="veld">
        <span>Datum</span>
        <input id="meting-datum" type="date" className="invoer" value={datum} onChange={(e) => setDatum(e.target.value)} />
      </label>
      <div className="velden">
        {VELDEN.map((v) => (
          <label key={v.k} className="veld">
            <span>
              {v.naam} ({v.eenheid})
            </span>
            <input
              id={`meting-${v.k}`}
              className="invoer getal"
              inputMode="decimal"
              value={waarden[v.k] ?? ''}
              onChange={(e) => setWaarden((w) => ({ ...w, [v.k]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <label className="veld">
        <span>Notitie</span>
        <input id="meting-notitie" className="invoer" value={notitie} onChange={(e) => setNotitie(e.target.value)} />
      </label>
      <button
        className="knop primair groot"
        onClick={() => {
          const m: Meting = { id: meting.id, datum: datum || vandaag(), notitie: notitie.trim() || undefined };
          for (const v of VELDEN) {
            const n = getal(waarden[v.k] ?? '');
            if (n != null) (m as unknown as Record<string, unknown>)[v.k] = n;
          }
          setSleutel(null);
          bewaar(m);
        }}
      >
        Meting opslaan
      </button>
      {!nieuw && (
        <button className="knop stil gevaar" onClick={() => { setSleutel(null); verwijder(meting.id); }}>
          <IcoonPrullenbak /> Meting verwijderen
        </button>
      )}
    </Blad>
  );
}
