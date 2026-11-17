import { useState } from 'react';
import { Kop } from '../components/Basis';
import { IcoonLet, IcoonOpslaan, IcoonUpload } from '../components/Iconen';
import { kortDatum, vandaag } from '../lib/datum';
import { blobNaarDataUrl, dataUrlNaarBlob } from '../lib/foto';
import { bewaarFoto, laadFoto } from '../lib/opslag';
import { dagdataCsv, leesBackupVolledig, maakBackup, metingenCsv, setsCsv } from '../lib/staat';
import type { Staat } from '../lib/types';
import { deelBestand } from '../lib/delen';
import { useWinkel } from '../lib/winkel';

export function Backup() {
  const { staat, wijzig, melding } = useWinkel();
  const [terug, setTerug] = useState<{ staat: Staat; fotos: Record<string, string> } | null>(null);
  const [fout, setFout] = useState('');
  const d = vandaag();
  const aantal = staat.trainingen.filter((t) => t.status === 'klaar').length;

  const backup = async () => {
    // Voortgangsfoto's gaan mee in de back-up.
    const fotos: Record<string, string> = {};
    for (const f of staat.fotos) {
      const blob = await laadFoto(f.id).catch(() => undefined);
      if (blob) fotos[f.id] = await blobNaarDataUrl(blob);
    }
    const r = await deelBestand(`kracht-backup-${d}.json`, JSON.stringify(maakBackup(staat, fotos)), 'application/json');
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
                setTerug(leesBackupVolledig(await f.text()));
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
              Back-up gevonden met {terug.staat.trainingen.filter((t) => t.status === 'klaar').length} trainingen, {Object.keys(terug.staat.dagdata).length} dagen en{' '}
              {Object.keys(terug.fotos).length} foto's. Alles wat nu in de app staat wordt vervangen.
            </p>
            <div className="knoprij">
              <button className="knop" onClick={() => setTerug(null)}>
                Annuleren
              </button>
              <button
                className="knop vol-gevaar"
                onClick={async () => {
                  const nieuw = terug;
                  for (const [id, url] of Object.entries(nieuw.fotos)) await bewaarFoto(id, await dataUrlNaarBlob(url)).catch(() => {});
                  wijzig(() => nieuw.staat);
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
