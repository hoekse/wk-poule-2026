import { useState } from 'react';
import { leesbareFout } from '@loods/shared';
import { supabase } from '../lib/supabase';
import { Kenmerk } from '../components/Basis';

const EMAIL_SLEUTEL = 'loods.email';

function leesEmail(): string {
  try {
    return localStorage.getItem(EMAIL_SLEUTEL) ?? '';
  } catch {
    return '';
  }
}

/**
 * Inloggen met e-mail: je krijgt een mail met een link én een code.
 * De code werkt altijd, ook in de app op het beginscherm van een iPhone
 * (daar opent een link in Safari in plaats van in de app).
 */
export function Inloggen() {
  const [email, setEmail] = useState(leesEmail);
  const [stap, setStap] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  async function stuur(e: React.FormEvent) {
    e.preventDefault();
    const adres = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(adres)) {
      setFout('Vul een geldig e-mailadres in.');
      return;
    }
    setBezig(true);
    setFout(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: adres,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setBezig(false);
    if (error) {
      const tekst = `${error.message} ${(error as { code?: string }).code ?? ''}`;
      if (/email_address_not_authorized|not authorized/i.test(tekst)) {
        setFout('De inlogmail kon niet naar dit adres worden gestuurd: de mailinstelling van de app is nog niet klaar. Laat Dennis dit nakijken (handleiding: stap "Inlogmails").');
      } else if (/over_email_send_rate_limit|email rate limit/i.test(tekst)) {
        setFout('Er zijn te veel inlogmails verstuurd. Probeer het later opnieuw, of vraag Dennis.');
      } else if (/rate limit|security purposes/i.test(tekst)) {
        setFout('Even wachten: je kunt over een minuut opnieuw een mail aanvragen.');
      } else {
        setFout(leesbareFout(error));
      }
      return;
    }
    try {
      localStorage.setItem(EMAIL_SLEUTEL, adres);
    } catch {
      /* niet erg */
    }
    setEmail(adres);
    setStap('code');
  }

  async function controleer(e: React.FormEvent) {
    e.preventDefault();
    const token = code.replace(/\D/g, '');
    if (token.length < 6) {
      setFout('De code bestaat uit 6 cijfers (soms 8).');
      return;
    }
    setBezig(true);
    setFout(null);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    setBezig(false);
    if (error) setFout(/expired|invalid/i.test(error.message) ? 'Deze code klopt niet of is verlopen. Vraag een nieuwe aan.' : leesbareFout(error));
    // Bij succes neemt de sessie het over en verschijnt het startscherm.
  }

  return (
    <main className="inloggen">
      <header>
        <Kenmerk groot />
        <h1>Loods Hoeksema</h1>
        <p className="uitleg">Materiaal meenemen, terugbrengen en restverf invoeren.</p>
      </header>

      {stap === 'email' ? (
        <form className="formulier" onSubmit={stuur}>
          <label className="veld">
            <span>Je e-mailadres</span>
            <input
              className="invoer"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="naam@voorbeeld.nl"
              required
            />
          </label>
          {fout && <div className="foutvak" role="alert">{fout}</div>}
          <button className="knop blauw breed" type="submit" disabled={bezig}>
            {bezig ? 'Bezig…' : 'Stuur inlogcode'}
          </button>
          <p className="uitleg">Je hoeft maar één keer in te loggen. Daarna blijf je ingelogd op deze telefoon.</p>
        </form>
      ) : (
        <form className="formulier" onSubmit={controleer}>
          <p style={{ margin: 0 }}>
            We hebben een mail gestuurd naar <b>{email}</b>. Typ de code uit die mail hieronder.
          </p>
          <label className="veld">
            <span>Code uit de mail</span>
            <input
              className="invoer groot"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={10}
              autoFocus
            />
          </label>
          {fout && <div className="foutvak" role="alert">{fout}</div>}
          <button className="knop groen breed" type="submit" disabled={bezig}>
            {bezig ? 'Bezig…' : 'Inloggen'}
          </button>
          <p className="uitleg">Geen mail? Kijk in de map Ongewenst, of vraag hieronder een nieuwe code aan.</p>
          <button className="knop rand breed klein" type="button" onClick={() => { setStap('email'); setCode(''); setFout(null); }}>
            Ander e-mailadres of nieuwe code
          </button>
        </form>
      )}
    </main>
  );
}
