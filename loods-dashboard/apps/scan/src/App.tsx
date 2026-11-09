import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { isIngesteld } from './lib/supabase';
import { useSessie } from './lib/sessie';
import { Fout, Kenmerk, Laden } from './components/Basis';
import { Inloggen } from './pages/Inloggen';
import { Start } from './pages/Start';
import { Winkelmand } from './pages/Winkelmand';
import { Restverf } from './pages/Restverf';
import { RestverfVoorraad } from './pages/RestverfVoorraad';
import { MijnSpullen } from './pages/MijnSpullen';

// Beheerschermen pas laden als de beheerder ze opent (kleinere app voor medewerkers).
const BeheerMenu = lazy(() => import('./pages/beheer/BeheerMenu').then((m) => ({ default: m.BeheerMenu })));
const Artikelen = lazy(() => import('./pages/beheer/Artikelen').then((m) => ({ default: m.Artikelen })));
const ArtikelBewerken = lazy(() => import('./pages/beheer/ArtikelBewerken').then((m) => ({ default: m.ArtikelBewerken })));
const Labels = lazy(() => import('./pages/beheer/Labels').then((m) => ({ default: m.Labels })));
const Correcties = lazy(() => import('./pages/beheer/Correcties').then((m) => ({ default: m.Correcties })));
const Historie = lazy(() => import('./pages/beheer/Historie').then((m) => ({ default: m.Historie })));
const Medewerkers = lazy(() => import('./pages/beheer/Stamgegevens').then((m) => ({ default: m.Medewerkers })));
const Voertuigen = lazy(() => import('./pages/beheer/Stamgegevens').then((m) => ({ default: m.Voertuigen })));
const Projecten = lazy(() => import('./pages/beheer/Stamgegevens').then((m) => ({ default: m.Projecten })));
const Zones = lazy(() => import('./pages/beheer/Zones').then((m) => ({ default: m.Zones })));

export function App() {
  if (!isIngesteld) return <NietIngesteld />;
  return <MetSessie />;
}

function MetSessie() {
  const { status, email, fout, opnieuw, uitloggen, isBeheerder } = useSessie();

  if (status === 'laden') return <Laden tekst="Loods Hoeksema laden…" />;
  if (status === 'uitgelogd') return <Inloggen />;
  if (status === 'onbekend' || status === 'inactief' || status === 'fout') {
    return (
      <main className="inloggen">
        <header>
          <Kenmerk groot />
          <h1>{status === 'fout' ? 'Geen verbinding' : status === 'inactief' ? 'Account gedeactiveerd' : 'Nog geen toegang'}</h1>
        </header>
        {status === 'fout' ? (
          <Fout tekst={fout ?? 'Er ging iets mis.'} opnieuw={opnieuw} />
        ) : (
          <p>
            {status === 'inactief'
              ? 'Je account staat niet meer op actief. Neem contact op met Dennis.'
              : `Het e-mailadres ${email ?? ''} is (nog) niet bekend. Vraag Dennis om je toe te voegen in Beheer → Medewerkers, en probeer het daarna opnieuw.`}
          </p>
        )}
        {status !== 'fout' && (
          <button className="knop blauw breed" type="button" onClick={opnieuw}>
            Opnieuw proberen
          </button>
        )}
        <button className="knop rand breed" type="button" onClick={() => void uitloggen()}>
          Uitloggen
        </button>
      </main>
    );
  }

  return (
    <Suspense fallback={<Laden />}>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/meenemen" element={<Winkelmand key="mee" modus="mee" />} />
        <Route path="/terugbrengen" element={<Winkelmand key="terug" modus="terug" />} />
        <Route path="/verbruik" element={<Winkelmand key="verbruikt" modus="verbruikt" />} />
        <Route path="/restverf" element={<Restverf />} />
        <Route path="/restverf/voorraad" element={<RestverfVoorraad />} />
        <Route path="/mijn-spullen" element={<MijnSpullen />} />
        {isBeheerder && (
          <>
            <Route path="/beheer" element={<BeheerMenu />} />
            <Route path="/beheer/artikelen" element={<Artikelen />} />
            <Route path="/beheer/artikelen/:id" element={<ArtikelBewerken />} />
            <Route path="/beheer/labels" element={<Labels />} />
            <Route path="/beheer/correcties" element={<Correcties />} />
            <Route path="/beheer/historie" element={<Historie />} />
            <Route path="/beheer/medewerkers" element={<Medewerkers />} />
            <Route path="/beheer/voertuigen" element={<Voertuigen />} />
            <Route path="/beheer/projecten" element={<Projecten />} />
            <Route path="/beheer/zones" element={<Zones />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function NietIngesteld() {
  return (
    <main className="inloggen">
      <header>
        <Kenmerk groot />
        <h1>Nog niet ingesteld</h1>
      </header>
      <p>
        De koppeling met de database ontbreekt. Vul <code>VITE_SUPABASE_URL</code> en <code>VITE_SUPABASE_ANON_KEY</code> in (zie
        docs/INSTALLATIE.md).
      </p>
    </main>
  );
}
