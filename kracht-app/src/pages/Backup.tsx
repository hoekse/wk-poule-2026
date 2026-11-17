import { useState } from 'react';
import { Kop } from '../components/Basis';
import { IcoonLet, IcoonOpslaan, IcoonUpload } from '../components/Iconen';
import { kortDatum, vandaag } from '../lib/datum';
import { dagdataCsv, leesBackup, maakBackup, metingenCsv, setsCsv } from '../lib/staat';
import type { Staat } from '../lib/types';
import { useWinkel } from '../lib/winkel';

/** Deelt een bestand via het deelmenu (Bewaar in Bestanden / iCloud), anders downloaden. */
async function deelBestand(naam: string, inhoud: string, type: string): Promise<'gedeeld' | 'gedownload' | 'geannuleerd'> {
  const bestand = new File([inhoud], naam, { type });
  try {
    if (navigator.canShare?.({ files: [bestand] })) {
      await navigator.share({ files: [bestand], title: naam });
      return 'gedeeld';
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'geannuleerd';
  }
  const url = URL.createObjectURL(bestand);
  const a = document.createElement('a');
  a.href = url;
  a.download = naam;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'gedownload';
}

export function Backup() {
  const { staat, wijzig, melding } = useWinkel();
  const [terug, setTerug] = useState<Staat | null>(null);
  const [fout, setFout] = useState('');
  const d = vandaag();
  const aantal = staat.trainingen.filter((t) => t.status === 'klaar').length;

  const backup = async () => {
    const r = await deelBestand(`kracht-backup-${d}.json`, JSON.stringify(maakBackup(staat)), 'application/json');
    if (r !== 'geannuleerd') {
      wijzig((s) => ({ ...s, instellingen: { ...s.instellingen, laatsteBackup: new Date().toISOString() } }));
      melding('Back-up gemaakt');
    }
  };

  return (
    <div className="pagina">
      <Kop titel="Back-up en export" terug />
      <section className="kaart">
        <h2>Back-up</h2>
        <p className="dun klein">
          Al je gegevens staan alleen op deze telefoon. Bewaar wekelijks een back-up in iCloud Drive (deelmenu → <b>Bewaar in Bestanden</b>). Nieuwe telefoon of app
          verwijderd? Dan zet je hier alles terug.
        </p>
        <p className="klein">
          {staat.instellingen.laatsteBackup ? `Laatste back-up: ${kortDatum(staat.instellingen.laatsteBackup.slice(0, 10))}.` : 'Nog geen back-up gemaakt.'} Inhoud: {aantal}{' '}
          trainingen, {Object.keys(staat.dagdata).length} dagen herstelgegevens, {staat.metingen.length} metingen.
        </p>
        <button className="knop primair groot" onClick={backup}>
          <IcoonOpslaan /> Back-up maken
        </button>
        <label className="knop">
          <IcoonUpload /> Back-up terugzetten
          <input
            className="verborgen"
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              setFout('');
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                setTerug(leesBackup(await f.text()));
              } catch (err) {
                setFout((err as Error).message || 'Dit bestand kan ik niet lezen.');
              }
            }}
          />
        </label>
        {fout && (
          <div className="melding rood">
            <IcoonLet /> {fout}
          </div>
        )}
        {terug && (
          <div className="kaart" style={{ borderColor: 'var(--geel)' }}>
            <p>
              Back-up gevonden met {terug.trainingen.filter((t) => t.status === 'klaar').length} trainingen en {Object.keys(terug.dagdata).length} dagen. Alles wat nu in de app
              staat wordt vervangen.
            </p>
            <div className="knoprij">
              <button className="knop" onClick={() => setTerug(null)}>
                Annuleren
              </button>
              <button
                className="knop vol-gevaar"
                onClick={() => {
                  const nieuw = terug;
                  wijzig(() => nieuw);
                  setTerug(null);
                  melding('Back-up teruggezet');
                }}
              >
                Vervangen
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="kaart">
        <h2>Exporteren naar Excel of Numbers</h2>
        <p className="dun klein">CSV-bestanden met puntkomma's, direct te openen in een Nederlandse Excel.</p>
        <div className="knoprij">
          <button className="knop" onClick={() => deelBestand(`kracht-sets-${d}.csv`, setsCsv(staat), 'text/csv')}>
            Alle sets
          </button>
          <button className="knop" onClick={() => deelBestand(`kracht-herstel-${d}.csv`, dagdataCsv(staat), 'text/csv')}>
            Slaap en herstel
          </button>
          <button className="knop" onClick={() => deelBestand(`kracht-metingen-${d}.csv`, metingenCsv(staat), 'text/csv')}>
            Metingen
          </button>
        </div>
      </section>
    </div>
  );
}
