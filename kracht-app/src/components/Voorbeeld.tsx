import { videoLink } from '../lib/oefeningen';
import type { Oefening } from '../lib/types';

/** Uitgewerkt voorbeeld bij een oefening: instellen, startpositie, beweging, fouten, voorbeeld-sets en video's. */
export function VoorbeeldKaart({ oef }: { oef: Oefening }) {
  const v = oef.voorbeeld;
  return (
    <section className="kaart voorbeeld" aria-label={`Voorbeeld ${oef.naam}`}>
      <div className="rij tussen">
        <h3>Zo doe je het</h3>
        <a className="knop klein" href={videoLink(oef)} target="_blank" rel="noopener noreferrer">
          ▶ Voorbeeldvideo's
        </a>
      </div>
      {v ? (
        <ol className="voorbeeld-stappen">
          {v.instelling && (
            <li>
              <b>Instellen</b>
              <span>{v.instelling}</span>
            </li>
          )}
          <li>
            <b>Startpositie</b>
            <span>{v.start}</span>
          </li>
          <li>
            <b>Beweging</b>
            <span>{v.beweging}</span>
          </li>
        </ol>
      ) : (
        oef.tips.length > 0 && (
          <ul className="stappen">
            {oef.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )
      )}
      {v && v.fouten.length > 0 && (
        <div className="voorbeeld-fouten">
          <span className="label">Let op</span>
          <ul>
            {v.fouten.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {v?.sets && (
        <div className="melding blauw">
          <span>
            <b>Sets en gewicht:</b> {v.sets}
          </span>
        </div>
      )}
      {v && oef.tips.length > 0 && (
        <ul className="stappen klein dun">
          {oef.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
