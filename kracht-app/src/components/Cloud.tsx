import { useCallback, useEffect, useRef, useState } from 'react';
import { cloudIngesteld, huidigeGebruiker, inboxAdres, inloggen, nieuweSleutel, registreren, synchroniseer, uitloggen } from '../lib/cloud';
import { inhoudSleutel, voegSamen } from '../lib/samenvoegen';
import { useWinkel } from '../lib/winkel';
import { IcoonKlembord, IcoonLet } from './Iconen';

const SYNC_NU = 'kracht-sync-nu';

/** Synchroniseert op de achtergrond: bij openen, bij terugkeren naar de app en 8 seconden na een wijziging. */
export function CloudSync() {
  const { staat, wijzig, melding } = useWinkel();
  const staatRef = useRef(staat);
  staatRef.current = staat;
  const laatst = useRef('');
  const bezig = useRef(false);

  const sync = useCallback(
    async (handmatig = false) => {
      if (!cloudIngesteld || bezig.current) return;
      if (!(await huidigeGebruiker().catch(() => null))) return;
      bezig.current = true;
      const begin = staatRef.current;
      try {
        const r = await synchroniseer(begin);
        laatst.current = inhoudSleutel(r.staat);
        wijzig((s) =>
          s === begin ? r.staat : { ...voegSamen(s, r.staat), instellingen: { ...s.instellingen, laatsteSync: r.staat.instellingen.laatsteSync } },
        );
        if (r.overgenomen) melding('Je gegevens zijn uit de cloud teruggezet');
        else if (r.nieuweDagen) melding(`${r.nieuweDagen} ${r.nieuweDagen === 1 ? 'dag' : 'dagen'} uit Apple Health binnengekomen`);
        else if (handmatig) melding('Gesynchroniseerd');
      } catch (e) {
        if (handmatig) melding((e as Error).message, true);
      } finally {
        bezig.current = false;
      }
    },
    [wijzig, melding],
  );

  useEffect(() => {
    if (!cloudIngesteld) return;
    void sync();
    const zichtbaar = () => document.visibilityState === 'visible' && void sync();
    const nu = () => void sync(true);
    document.addEventListener('visibilitychange', zichtbaar);
    window.addEventListener(SYNC_NU, nu);
    return () => {
      document.removeEventListener('visibilitychange', zichtbaar);
      window.removeEventListener(SYNC_NU, nu);
    };
  }, [sync]);

  useEffect(() => {
    if (!cloudIngesteld || inhoudSleutel(staat) === laatst.current) return;
    const t = window.setTimeout(() => void sync(), 8000);
    return () => window.clearTimeout(t);
  }, [staat, sync]);

  return null;
}

function Kopieer({ tekst, label }: { tekst: string; label: string }) {
  const { melding } = useWinkel();
  return (
    <div className="veld">
      <span>{label}</span>
      <div className="rij" style={{ gap: 8 }}>
        <code className="groei" style={{ padding: '10px 12px', borderRadius: 12, fontSize: '0.8rem' }}>
          {tekst}
        </code>
        <button
          className="icoonknop"
          aria-label={`${label} kopiëren`}
          onClick={() =>
            navigator.clipboard.writeText(tekst).then(
              () => melding('Gekopieerd'),
              () => melding('Kopiëren lukt niet; selecteer de tekst', true),
            )
          }
        >
          <IcoonKlembord />
        </button>
      </div>
    </div>
  );
}

/** Cloud-instellingen: inloggen, status en de sleutel voor automatische Apple Health-gegevens. */
export function CloudKaart() {
  const { staat } = useWinkel();
  const [gebruiker, setGebruiker] = useState<{ email: string } | null | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [fout, setFout] = useState('');
  const [info, setInfo] = useState('');
  const [bezig, setBezig] = useState(false);
  const [sleutel, setSleutel] = useState<string>(() => {
    try {
      return localStorage.getItem('kracht-sleutel') ?? '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    huidigeGebruiker()
      .then(setGebruiker)
      .catch(() => setGebruiker(null));
  }, []);

  const actie = async (f: () => Promise<void>) => {
    setFout('');
    setInfo('');
    setBezig(true);
    try {
      await f();
    } catch (e) {
      setFout((e as Error).message);
    } finally {
      setBezig(false);
    }
  };

  if (!cloudIngesteld) {
    return (
      <section className="kaart" aria-label="Cloud">
        <h2>Cloud en automatisch ophalen</h2>
        <p className="dun klein">
          Nog niet aangezet. Zodra de app online staat met een eigen database, worden je gegevens automatisch in de cloud bewaard en kan de opdracht elke ochtend
          vanzelf je Apple Health-gegevens versturen.
        </p>
      </section>
    );
  }

  return (
    <section className="kaart" aria-label="Cloud">
      <div className="rij tussen">
        <h2>Cloud</h2>
        {gebruiker && <span className="pil groen">Aan</span>}
      </div>
      {gebruiker === undefined && <p className="dun klein">Even kijken…</p>}
      {gebruiker === null && (
        <>
          <p className="dun klein">Log in om je gegevens automatisch in de cloud te bewaren en op een nieuwe telefoon terug te zetten.</p>
          <label className="veld">
            <span>E-mail</span>
            <input id="cloud-email" className="invoer" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="veld">
            <span>Wachtwoord</span>
            <input id="cloud-wachtwoord" className="invoer" type="password" autoComplete="current-password" value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} />
          </label>
          <div className="knoprij">
            <button
              className="knop primair"
              disabled={bezig || !email || !wachtwoord}
              onClick={() =>
                actie(async () => {
                  await inloggen(email.trim(), wachtwoord);
                  setGebruiker(await huidigeGebruiker());
                  window.dispatchEvent(new Event(SYNC_NU));
                })
              }
            >
              Inloggen
            </button>
            <button
              className="knop"
              disabled={bezig || !email || wachtwoord.length < 8}
              onClick={() =>
                actie(async () => {
                  const direct = await registreren(email.trim(), wachtwoord);
                  if (direct) {
                    setGebruiker(await huidigeGebruiker());
                    window.dispatchEvent(new Event(SYNC_NU));
                  } else setInfo('Account gemaakt. Bevestig je e-mailadres via de link in de mail en log daarna hier in.');
                })
              }
            >
              Account maken
            </button>
          </div>
        </>
      )}
      {gebruiker && (
        <>
          <p className="dun klein">
            Ingelogd als <b>{gebruiker.email}</b>.{' '}
            {staat.instellingen.laatsteSync ? `Laatst gesynchroniseerd ${new Date(staat.instellingen.laatsteSync).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}.` : ''} Foto's
            blijven alleen op deze telefoon (en in je back-up).
          </p>
          <div className="knoprij">
            <button className="knop" onClick={() => window.dispatchEvent(new Event(SYNC_NU))}>
              Nu synchroniseren
            </button>
            <button className="knop stil" onClick={() => actie(async () => (await uitloggen(), setGebruiker(null)))}>
              Uitloggen
            </button>
          </div>
          <details className="uitklap">
            <summary>Elke ochtend automatisch uit Apple Health</summary>
            <ol className="stappen klein">
              <li>Maak hieronder een sleutel en kopieer het adres en de sleutel.</li>
              <li>
                Open de opdracht <b>{staat.instellingen.opdrachtNaam}</b> en vervang de laatste stap (Kopieer naar klembord) door <b>Haal inhoud van URL op</b>: plak het
                adres, kies methode <b>POST</b>, voeg bij Headers <code>X-Sleutel</code> toe met de sleutel, en kies bij Hoofdtekst <b>JSON</b> met je Woordenboek.
              </li>
              <li>
                In Opdrachten → <b>Automatisering</b> → <b>+</b> → <b>Tijdstip</b>: elke dag om 8:00, <b>Voer direct uit</b>, actie: voer de opdracht uit.
              </li>
              <li>Vanaf dan staan je slaap, HRV, rusthartslag, zuurstof en gewicht er elke ochtend vanzelf in zodra je de app opent.</li>
            </ol>
            <p className="dun mini">
              Health Auto Export: kies bij Automations een REST API-export naar hetzelfde adres met <code>?sleutel=</code> en je sleutel erachter, formaat JSON.
            </p>
            {sleutel ? (
              <>
                <Kopieer label="Adres" tekst={inboxAdres} />
                <Kopieer label="Sleutel (X-Sleutel)" tekst={sleutel} />
              </>
            ) : null}
            <button
              className="knop"
              disabled={bezig}
              onClick={() =>
                actie(async () => {
                  const s = await nieuweSleutel();
                  try {
                    localStorage.setItem('kracht-sleutel', s);
                  } catch {
                    /* geen opslag */
                  }
                  setSleutel(s);
                })
              }
            >
              {sleutel ? 'Nieuwe sleutel maken (oude vervalt)' : 'Sleutel maken'}
            </button>
          </details>
        </>
      )}
      {info && (
        <div className="melding blauw">
          <IcoonLet /> <span>{info}</span>
        </div>
      )}
      {fout && (
        <div className="melding rood">
          <IcoonLet /> <span>{fout}</span>
        </div>
      )}
    </section>
  );
}
