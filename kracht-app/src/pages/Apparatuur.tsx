import { Kop, Segment } from '../components/Basis';
import { STANDAARD_SCHIJVEN } from '../lib/schijven';
import { APPARATUUR } from '../lib/oefeningen';
import { useWinkel } from '../lib/winkel';

export function Apparatuur() {
  const { staat, wijzig } = useWinkel();
  const inst = staat.instellingen;
  return (
    <div className="pagina">
      <Kop titel="Apparatuur" sub="FitButiq, Spoorstraat 1, IJsselmuiden" terug />
      <p className="dun">
        Vink aan wat er staat. Per oefening kiest het schema de eerste variant die kan. Loop een keer met de app door de zaal en zet uit wat er niet is; dan klopt
        je schema precies.
      </p>
      <div className="lijst">
        {APPARATUUR.map((a) => (
          <label key={a.id} className="vinkje">
            <input
              type="checkbox"
              checked={inst.apparatuur[a.id]}
              onChange={(e) => wijzig((s) => ({ ...s, instellingen: { ...s.instellingen, apparatuur: { ...s.instellingen.apparatuur, [a.id]: e.target.checked } } }))}
            />
            <span className="groei">{a.naam}</span>
          </label>
        ))}
      </div>

      <section className="kaart" aria-label="Schijven">
        <h3>Schijven en stang</h3>
        <p className="dun klein">Welke schijven liggen er? De schijvencalculator en de gewichtsstappen rekenen hiermee.</p>
        <div className="keuzes" role="group" aria-label="Schijven">
          {STANDAARD_SCHIJVEN.map((kg) => {
            const aan = inst.schijven.includes(kg);
            return (
              <button
                key={kg}
                className="keuze"
                aria-pressed={aan}
                onClick={() =>
                  wijzig((s) => {
                    const lijst = aan ? s.instellingen.schijven.filter((x) => x !== kg) : [...s.instellingen.schijven, kg];
                    return { ...s, instellingen: { ...s.instellingen, schijven: lijst.length ? lijst.sort((a, b) => b - a) : s.instellingen.schijven } };
                  })
                }
              >
                {kg.toLocaleString('nl-NL')}
              </button>
            );
          })}
        </div>
        <div className="veld">
          <span>Gewicht van de halterstang</span>
          <Segment<number>
            label="Stanggewicht"
            waarde={inst.stangGewicht}
            zet={(n) => wijzig((s) => ({ ...s, instellingen: { ...s.instellingen, stangGewicht: n } }))}
            opties={[
              { waarde: 20, tekst: '20 kg' },
              { waarde: 15, tekst: '15 kg' },
              { waarde: 10, tekst: '10 kg' },
            ]}
          />
        </div>
      </section>
    </div>
  );
}
