import { Kop } from '../components/Basis';
import { IcoonBoek, IcoonGebouw, IcoonInstellingen, IcoonKoppeling, IcoonLijst, IcoonOpslaan, IcoonVerder, IcoonWeegschaal } from '../components/Iconen';
import { kortDatum } from '../lib/datum';
import { useNav, useWinkel, type Scherm } from '../lib/winkel';

export function Meer() {
  const { staat } = useWinkel();
  const nav = useNav();
  const inst = staat.instellingen;
  const items: { scherm: Scherm; titel: string; sub: string; Icoon: typeof IcoonLijst }[] = [
    { scherm: { naam: 'lichaam' }, titel: 'Lichaam en metingen', sub: 'Gewicht, vetpercentage, omtrekken', Icoon: IcoonWeegschaal },
    { scherm: { naam: 'geschiedenis' }, titel: 'Alle trainingen', sub: `${staat.trainingen.filter((t) => t.status === 'klaar').length} opgeslagen`, Icoon: IcoonLijst },
    { scherm: { naam: 'schema' }, titel: 'Schema en trainingsdagen', sub: 'Aantal dagen, oefeningen, sets, blok', Icoon: IcoonInstellingen },
    { scherm: { naam: 'apparatuur' }, titel: 'Apparatuur bij FitButiq', sub: 'Wat er staat bepaalt de oefeningen', Icoon: IcoonGebouw },
    { scherm: { naam: 'koppelingen' }, titel: 'Koppelingen', sub: 'Apple Health, prisma APP, SleepHQ', Icoon: IcoonKoppeling },
    {
      scherm: { naam: 'backup' },
      titel: 'Back-up en export',
      sub: inst.laatsteBackup ? `Laatste back-up ${kortDatum(inst.laatsteBackup.slice(0, 10))}` : 'Nog geen back-up gemaakt',
      Icoon: IcoonOpslaan,
    },
    { scherm: { naam: 'over' }, titel: 'Uitleg', sub: 'RIR, blokken, herstelscore', Icoon: IcoonBoek },
  ];
  return (
    <div className="pagina">
      <Kop titel="Meer" />
      <div className="lijst">
        {items.map(({ scherm, titel, sub, Icoon }) => (
          <button key={titel} className="lijstitem" onClick={() => nav.ga(scherm)}>
            <Icoon className="icoon" />
            <div className="groei">
              <div className="titel">{titel}</div>
              <div className="dun klein">{sub}</div>
            </div>
            <IcoonVerder className="chevron" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Over() {
  return (
    <div className="pagina">
      <Kop titel="Uitleg" terug />
      <div className="kaart">
        <h3>RIR: herhalingen in reserve</h3>
        <p className="dun">
          Hoeveel herhalingen had je nog gekund met goede techniek? RIR 2 = je stopt terwijl er nog 2 in zitten. Zo train je zwaar genoeg om sterker te worden,
          zonder elke set tot falen te gaan. Vul na elke set eerlijk in wat je nog over had; leeg laten mag ook.
        </p>
      </div>
      <div className="kaart">
        <h3>Dubbele progressie</h3>
        <p className="dun">
          Elke oefening heeft een bereik, bijvoorbeeld 8-12. Je blijft op hetzelfde gewicht en probeert elke keer een herhaling meer. Haal je in alle sets 12,
          dan gaat het gewicht de volgende keer omhoog (halterstang +2,5 kg, machines +5 kg, dumbbells een stap). Lukt het twee keer achter elkaar niet om het
          minimum te halen, dan gaat het gewicht 10% omlaag en bouw je opnieuw op.
        </p>
      </div>
      <div className="kaart">
        <h3>Blokken van 6 weken</h3>
        <p className="dun">
          Week 1: instappen (1 herhaling extra over). Week 2-4: opbouwen. Week 5: zwaarste week. Week 6: lichte week met minder sets en 10% minder gewicht.
          Daarna start het volgende blok.
        </p>
      </div>
      <div className="kaart">
        <h3>Herstelscore</h3>
        <p className="dun">
          Een score van 0-100 uit: slaapduur (25%), je CPAP-nacht: AHI en uren masker op (25%), hartslagvariabiliteit ten opzichte van je eigen 30-dagengemiddelde
          (20%), rusthartslag (10%) en je ochtendcheck (20%). Ontbreekt iets, dan telt de rest zwaarder. Vanaf 75 train je volgens schema, 55-74 iets lichter,
          onder de 55 een herstelsessie of rust.
        </p>
        <p className="dun klein">
          De app is geen medisch hulpmiddel. Blijft je AHI hoog of voel je je slecht, neem dan contact op met je slaapcentrum of huisarts.
        </p>
      </div>
      <div className="kaart">
        <h3>Schijvencalculator</h3>
        <p className="dun">
          Bij oefeningen met de halterstang zie je per kant welke schijven erop moeten, uitgaande van een stang van 20 kg en schijven van 25, 20, 15, 10, 5, 2,5 en
          1,25 kg in de wedstrijdkleuren.
        </p>
      </div>
    </div>
  );
}
