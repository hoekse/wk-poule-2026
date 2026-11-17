import { useState } from 'react';
import { Kop } from '../components/Basis';
import { IcoonTerug, IcoonVerder } from '../components/Iconen';
import { kortDatum, maandagVan, plusDagen, vandaag, weekdag, weeknummer } from '../lib/datum';
import { fmt1, uurMin } from '../lib/herstel';
import { deelTekst } from '../lib/delen';
import { weekSamenvatting, weekTekst } from '../lib/week';
import { useWinkel } from '../lib/winkel';

export function Weekoverzicht() {
  const { staat, melding } = useWinkel();
  const d = vandaag();
  // Op maandag laten we standaard de afgelopen week zien.
  const [maandag, setMaandag] = useState(weekdag(d) === 1 ? plusDagen(maandagVan(d), -7) : maandagVan(d));
  const w = weekSamenvatting(staat, maandag);
  const isHuidig = maandag === maandagVan(d);

  const tegels: { label: string; waarde: string; sub?: string; goed?: boolean | null }[] = [
    { label: 'Trainingen', waarde: `${w.trainingen}`, sub: `/ ${w.gepland}`, goed: w.trainingen >= w.gepland ? true : isHuidig ? null : false },
    { label: 'Sets', waarde: `${w.sets}` },
    { label: 'Verplaatst', waarde: w.tonnage.toLocaleString('nl-NL'), sub: 'kg' },
    { label: 'Intervallen', waarde: fmt1(w.intervalMinuten), sub: 'min' },
    ...(w.slaap != null ? [{ label: 'Gem. slaap', waarde: uurMin(w.slaap), goed: w.slaap >= staat.instellingen.slaapDoel - 0.5 }] : []),
    ...(w.cpap != null ? [{ label: 'Gem. CPAP', waarde: uurMin(w.cpap), goed: w.cpap >= 6 }] : []),
    ...(w.ahi != null ? [{ label: 'Gem. AHI', waarde: fmt1(w.ahi), goed: w.ahi < 5 }] : []),
    ...(w.spo2Min != null ? [{ label: 'Laagste SpO₂', waarde: `${Math.round(w.spo2Min)}`, sub: '%', goed: w.spo2Min >= 88 }] : []),
    ...(w.hrv != null ? [{ label: 'Gem. HRV', waarde: `${Math.round(w.hrv)}`, sub: 'ms' }] : []),
    ...(w.stappen != null ? [{ label: 'Stappen', waarde: Math.round(w.stappen).toLocaleString('nl-NL'), sub: 'per dag', goed: w.stappen >= 8000 }] : []),
    ...(w.eiwit != null ? [{ label: 'Eiwit', waarde: `${Math.round(w.eiwit)}`, sub: 'g per dag' }] : []),
    ...(w.gewichtVan != null && w.gewichtTot != null
      ? [{ label: 'Gewicht', waarde: `${w.gewichtTot - w.gewichtVan > 0 ? '+' : ''}${fmt1(w.gewichtTot - w.gewichtVan)}`, sub: 'kg' }]
      : []),
  ];

  return (
    <div className="pagina">
      <Kop titel="Weekoverzicht" sub={`Week ${weeknummer(maandag)} · ${kortDatum(maandag)} t/m ${kortDatum(w.zondag)}`} terug />
      <div className="rij tussen">
        <button className="icoonknop" aria-label="Vorige week" onClick={() => setMaandag(plusDagen(maandag, -7))}>
          <IcoonTerug />
        </button>
        <span className="label">{isHuidig ? 'Deze week' : `${Math.round((new Date(maandagVan(d)).getTime() - new Date(maandag).getTime()) / 604800000)} week terug`}</span>
        <button className="icoonknop" aria-label="Volgende week" disabled={isHuidig} onClick={() => setMaandag(plusDagen(maandag, 7))} style={{ opacity: isHuidig ? 0.3 : 1 }}>
          <IcoonVerder />
        </button>
      </div>
      <div className="tegels">
        {tegels.map((t) => (
          <div key={t.label} className="tegel">
            <span className="label">{t.label}</span>
            <b style={{ color: t.goed === true ? 'var(--groen)' : t.goed === false ? 'var(--geel)' : undefined }}>
              {t.waarde}
              {t.sub && <small>{t.sub}</small>}
            </b>
          </div>
        ))}
      </div>
      {w.records.length > 0 && (
        <section className="sectie">
          <span className="label">Records deze week</span>
          <div className="lijst">
            {w.records.map((r, i) => (
              <div key={i} className="lijstitem">
                <div className="groei">
                  <div className="titel">{r.naam}</div>
                  <div className="dun klein">{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {w.tempoTekst && (
        <div className="melding blauw">
          <span>{w.tempoTekst}</span>
        </div>
      )}
      <button
        className="knop primair groot"
        onClick={async () => {
          const r = await deelTekst('Kracht weekoverzicht', weekTekst(w));
          if (r === 'gekopieerd') melding('Weekoverzicht gekopieerd');
        }}
      >
        Weekoverzicht delen
      </button>
    </div>
  );
}
