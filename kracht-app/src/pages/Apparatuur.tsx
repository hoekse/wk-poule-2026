import { Kop } from '../components/Basis';
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
    </div>
  );
}
