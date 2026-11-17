import { CloudSync } from './components/Cloud';
import { IcoonGrafiek, IcoonHalter, IcoonMaan, IcoonMeer, IcoonVandaag } from './components/Iconen';
import { actieveTraining } from './lib/staat';
import { useNav, useWinkel, type Tab } from './lib/winkel';
import { Apparatuur } from './pages/Apparatuur';
import { Backup } from './pages/Backup';
import { Geschiedenis, TrainingDetail } from './pages/Geschiedenis';
import { Herstel } from './pages/Herstel';
import { Koppelingen } from './pages/Koppelingen';
import { Lichaam } from './pages/Lichaam';
import { Meer, Over } from './pages/Meer';
import { OefeningDetail } from './pages/OefeningDetail';
import { Onboarding } from './pages/Onboarding';
import { SchemaInstellingen } from './pages/SchemaInstellingen';
import { Sessie } from './pages/Sessie';
import { Training } from './pages/Training';
import { Vandaag } from './pages/Vandaag';
import { Voortgang } from './pages/Voortgang';
import { Weekoverzicht } from './pages/Weekoverzicht';

const TABS: { id: Tab; naam: string; Icoon: typeof IcoonVandaag }[] = [
  { id: 'vandaag', naam: 'Vandaag', Icoon: IcoonVandaag },
  { id: 'training', naam: 'Schema', Icoon: IcoonHalter },
  { id: 'voortgang', naam: 'Voortgang', Icoon: IcoonGrafiek },
  { id: 'herstel', naam: 'Herstel', Icoon: IcoonMaan },
  { id: 'meer', naam: 'Meer', Icoon: IcoonMeer },
];

export function App() {
  const { staat } = useWinkel();
  const nav = useNav();

  if (!staat.instellingen.onboardingKlaar)
    return (
      <>
        <CloudSync />
        <Onboarding />
      </>
    );

  const bezig = actieveTraining(staat);
  if (bezig)
    return (
      <>
        <CloudSync />
        <Sessie training={bezig} />
      </>
    );

  let inhoud;
  const s = nav.scherm;
  if (s) {
    switch (s.naam) {
      case 'oefening': inhoud = <OefeningDetail id={s.id} />; break;
      case 'training': inhoud = <TrainingDetail id={s.id} />; break;
      case 'lichaam': inhoud = <Lichaam />; break;
      case 'geschiedenis': inhoud = <Geschiedenis />; break;
      case 'schema': inhoud = <SchemaInstellingen />; break;
      case 'apparatuur': inhoud = <Apparatuur />; break;
      case 'koppelingen': inhoud = <Koppelingen />; break;
      case 'backup': inhoud = <Backup />; break;
      case 'over': inhoud = <Over />; break;
      case 'week': inhoud = <Weekoverzicht />; break;
    }
  } else {
    inhoud = {
      vandaag: <Vandaag />,
      training: <Training />,
      voortgang: <Voortgang />,
      herstel: <Herstel />,
      meer: <Meer />,
    }[nav.tab];
  }

  return (
    <div className="app">
      <CloudSync />
      <main>{inhoud}</main>
      <nav className="tabbalk" aria-label="Hoofdmenu">
        {TABS.map(({ id, naam, Icoon }) => (
          <button key={id} aria-current={nav.tab === id && !s ? 'page' : undefined} onClick={() => nav.zetTab(id)}>
            <span className="tab-icoon">
              <Icoon />
            </span>
            {naam}
          </button>
        ))}
      </nav>
    </div>
  );
}
