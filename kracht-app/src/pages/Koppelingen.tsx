import { useState } from 'react';
import { Kop } from '../components/Basis';
import { IcoonInfo } from '../components/Iconen';
import { ImportBlad, OchtendCheck } from '../components/Invoer';
import { kortDatum } from '../lib/datum';
import type { Bron } from '../lib/types';
import { useWinkel } from '../lib/winkel';

export function Koppelingen() {
  const { staat, wijzig } = useWinkel();
  const [importeer, setImporteer] = useState<'opdracht' | 'bestand' | null>(null);
  const [check, setCheck] = useState(false);
  const inst = staat.instellingen;

  const laatst = (...bronnen: Bron[]) => {
    const datums = Object.values(staat.dagdata)
      .filter((d) => Object.values(d.bronnen).some((b) => b && bronnen.includes(b)))
      .map((d) => d.datum)
      .sort();
    return datums.length ? `Laatste gegevens: ${kortDatum(datums[datums.length - 1])} · ${datums.length} dagen` : 'Nog geen gegevens';
  };

  return (
    <div className="pagina">
      <Kop titel="Koppelingen" terug />
      <div className="melding blauw">
        <IcoonInfo />
        <span>
          Een web-app mag Apple Health niet zelf uitlezen. Daarom gaat het via de app <b>Opdrachten</b> van je iPhone: één tik en je gegevens staan erin. De prisma
          APP en SleepHQ hebben geen open koppeling op de telefoon; die waarden vul je in bij de ochtendcheck of importeer je als bestand.
        </span>
      </div>

      <section className="kaart" aria-label="Apple Health">
        <div className="rij tussen">
          <h2>Apple Health</h2>
          <span className="pil">{laatst('apple', 'hae')}</span>
        </div>
        <p className="dun klein">Slaap, hartslagvariabiliteit (HRV), rusthartslag, gewicht en stappen. HRV en rusthartslag heb je alleen met een Apple Watch.</p>
        <div className="knoprij">
          <button className="knop primair" onClick={() => setImporteer('opdracht')}>
            Nu ophalen
          </button>
        </div>
        <details className="uitklap">
          <summary>Opdracht “{inst.opdrachtNaam}” eenmalig maken (±5 minuten)</summary>
          <ol className="stappen klein">
            <li>
              Open de app <b>Opdrachten</b> → tik op <b>+</b> → noem de opdracht precies <b>{inst.opdrachtNaam}</b>.
            </li>
            <li>
              <b>Slaap.</b> Zoek in de acties op “gezondheid” en voeg <b>Zoek naar gezondheidsmonsters</b> toe (Engels: Find Health Samples). Stel in: type{' '}
              <b>Slaapanalyse</b>, <b>Startdatum</b> valt in de laatste <b>18 uur</b>, en voeg twee filters toe: <b>Waarde</b> is niet <b>In bed</b> en <b>Waarde</b>{' '}
              is niet <b>Wakker</b>.
            </li>
            <li>
              Voeg <b>Haal details op van gezondheidsmonsters</b> toe en kies <b>Duur</b>. Voeg daarna <b>Bereken statistieken</b> toe met <b>Som</b>.
            </li>
            <li>
              <b>HRV.</b> Nog een <b>Zoek naar gezondheidsmonsters</b>: type <b>Hartslagvariabiliteit</b>, startdatum in de laatste <b>1 dag</b>. Daarna{' '}
              <b>Bereken statistieken</b> → <b>Gemiddelde</b>.
            </li>
            <li>
              <b>Rusthartslag</b> en <b>Gewicht</b>: zelfde actie, type <b>Rusthartslag</b> (laatste 1 dag) en <b>Gewicht</b> (laatste 7 dagen), sorteer op{' '}
              <b>Startdatum</b> nieuwste eerst, <b>Limiet 1</b>.
            </li>
            <li>
              Voeg <b>Woordenboek</b> toe met deze sleutels (type Tekst) en kies als waarde telkens de uitkomst van de stap erboven:
              <pre className="code">{'slaap         → Statistieken (som duur)\nhrv           → Statistieken (gemiddelde)\nrusthartslag  → Gezondheidsmonsters\ngewicht       → Gezondheidsmonsters'}</pre>
            </li>
            <li>
              Voeg als laatste <b>Kopieer naar klembord</b> toe met het Woordenboek. Klaar.
            </li>
            <li>
              Werkt het? Tik hier op <b>Nu ophalen</b> → <b>Opdracht uitvoeren</b>, ga terug en tik op <b>Plakken</b>. Je ziet meteen wat er binnenkomt. Geen
              Apple Watch? Laat HRV en rusthartslag dan weg.
            </li>
          </ol>
          <label className="veld">
            <span>Naam van de opdracht</span>
            <input
              id="opdracht-naam"
              className="invoer"
              value={inst.opdrachtNaam}
              onChange={(e) => wijzig((s) => ({ ...s, instellingen: { ...s.instellingen, opdrachtNaam: e.target.value } }))}
            />
          </label>
          <p className="dun mini">
            Andere sleutels die de app begrijpt: stappen, actieve_energie, vetpercentage, diepe_slaap, rem_slaap, datum (JJJJ-MM-DD), cpap_uren, ahi, lekkage.
          </p>
        </details>
        <details className="uitklap">
          <summary>Liever volledig automatisch? Health Auto Export</summary>
          <p className="dun klein">
            De app <b>Health Auto Export</b> (App Store) maakt dagelijks een JSON-bestand van je gezondheidsgegevens. Kies bij Export: formaat <b>JSON</b>,
            aggregatie per <b>dag</b>, de metingen Sleep Analysis, Heart Rate Variability, Resting Heart Rate, Weight, Step Count en Active Energy, en bewaar in
            Bestanden. Importeer het bestand hier met <b>Bestand</b>. Ook handig om in één keer je hele geschiedenis binnen te halen.
          </p>
          <button className="knop" onClick={() => setImporteer('bestand')}>
            Bestand importeren
          </button>
        </details>
      </section>

      <section className="kaart" aria-label="prisma APP">
        <div className="rij tussen">
          <h2>prisma APP</h2>
          <span className="pil">{laatst('prisma')}</span>
        </div>
        <p className="dun klein">
          De prisma APP van Löwenstein laat je therapiegegevens zien, maar deelt ze niet met andere apps. Neem ze elke ochtend over in de ochtendcheck: <b>masker op</b>{' '}
          (uren), <b>AHI</b> en eventueel <b>lekkage</b>. Dat kost 15 seconden en telt voor een kwart mee in je herstelscore.
        </p>
        <button className="knop primair" onClick={() => setCheck(true)}>
          Ochtendcheck invullen
        </button>
      </section>

      <section className="kaart" aria-label="SleepHQ">
        <div className="rij tussen">
          <h2>SleepHQ</h2>
          <span className="pil">{laatst('sleephq', 'csv')}</span>
        </div>
        <p className="dun klein">
          Zet je je CPAP-gegevens in SleepHQ (of OSCAR)? Exporteer je nachten als CSV en importeer het bestand hier. De app zoekt zelf de kolommen datum, AHI,
          gebruiksduur, lekkage en druk. Zo vul je in één keer weken aan CPAP-gegevens aan.
        </p>
        <button className="knop" onClick={() => setImporteer('bestand')}>
          CSV importeren
        </button>
      </section>

      <section className="kaart" aria-label="Automatisch synchroniseren">
        <h2>Volgende stap: automatisch en in de cloud</h2>
        <p className="dun klein">
          Nu staat alles op deze telefoon. Met een kleine online database (Supabase, net als je loods-app) kan de opdracht zelf elke ochtend de gegevens versturen,
          kan SleepHQ via zijn API automatisch worden opgehaald en staat er altijd een back-up in de cloud. Dat is een aparte uitbreiding.
        </p>
      </section>

      <ImportBlad open={importeer != null} metOpdracht={importeer === 'opdracht'} sluit={() => setImporteer(null)} />
      <OchtendCheck open={check} sluit={() => setCheck(false)} />
    </div>
  );
}
