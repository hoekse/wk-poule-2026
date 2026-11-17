import { useState } from 'react';
import { eiwitAdvies, gewichtReeks } from '../lib/lichaam';
import { voegDagdataToe } from '../lib/staat';
import type { Datum } from '../lib/types';
import { useWinkel } from '../lib/winkel';

const SNEL = [
  { g: 20, tekst: '+20 g', uitleg: 'kwark, eieren' },
  { g: 30, tekst: '+30 g', uitleg: 'shake' },
  { g: 40, tekst: '+40 g', uitleg: 'vlees, vis' },
];

/** Eiwit bijhouden met één tik per maaltijd. */
export function EiwitTeller({ datum }: { datum: Datum }) {
  const { staat, wijzig } = useWinkel();
  const [vorige, setVorige] = useState<number | null>(null);
  const gewichten = gewichtReeks(staat);
  const gewicht = gewichten.length ? gewichten[gewichten.length - 1].y : 90;
  const doel = eiwitAdvies(gewicht);
  const nu = staat.dagdata[datum]?.eiwit ?? 0;
  const zet = (g: number) => {
    setVorige(nu);
    wijzig((s) => voegDagdataToe(s, [{ datum, eiwit: Math.max(0, g) }], 'handmatig').staat);
  };
  const schaal = doel.tot * 1.15;
  return (
    <section className="kaart" aria-label="Eiwit vandaag">
      <div className="rij tussen">
        <div>
          <span className="label">Eiwit vandaag</span>
          <div style={{ fontFamily: 'var(--font-kop)', fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.03em', marginTop: 4 }} className="getal">
            {nu} <span className="dun" style={{ fontSize: '1rem', fontWeight: 600 }}>/ {doel.van}-{doel.tot} g</span>
          </div>
        </div>
        {nu >= doel.van && <span className="pil groen">Doel gehaald</span>}
      </div>
      <div className="eiwit-balk" role="img" aria-label={`${nu} van ${doel.van} tot ${doel.tot} gram eiwit`}>
        <span className="doelzone" style={{ left: `${(doel.van / schaal) * 100}%`, width: `${((doel.tot - doel.van) / schaal) * 100}%` }} />
        <i style={{ width: `${Math.min(100, (nu / schaal) * 100)}%` }} />
      </div>
      <div className="keuzes">
        {SNEL.map((x) => (
          <button key={x.g} className="keuze" style={{ flex: 1 }} onClick={() => zet(nu + x.g)} aria-label={`${x.tekst} eiwit (${x.uitleg})`}>
            {x.tekst}
          </button>
        ))}
        <button className="keuze" onClick={() => (vorige != null ? (zet(vorige), setVorige(null)) : zet(nu - 10))} aria-label={vorige != null ? 'Laatste ongedaan maken' : '10 gram eraf'}>
          {vorige != null ? '↶' : '−10'}
        </button>
      </div>
      <p className="dun mini">Op basis van {gewicht.toLocaleString('nl-NL')} kg lichaamsgewicht (1,8-2,2 g per kg). Verdeel het over 3-4 maaltijden.</p>
    </section>
  );
}
