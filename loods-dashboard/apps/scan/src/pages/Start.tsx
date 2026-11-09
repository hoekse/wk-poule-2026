import { Link } from 'react-router-dom';
import { useSessie, useIk } from '../lib/sessie';
import { telMijnSpullen } from '../lib/api';
import { useLaden } from '../lib/useLaden';
import { Avatar, Kop } from '../components/Basis';
import { IcoonBeheer, IcoonMee, IcoonTas, IcoonTerug, IcoonVerbruik, IcoonVerf } from '../components/Iconen';

export function Start() {
  const ik = useIk();
  const { isBeheerder, uitloggen } = useSessie();
  const { data: aantalMee } = useLaden(() => telMijnSpullen(ik.id), [ik.id]);

  return (
    <>
      <Kop titel="Loods Hoeksema" />
      <main className="pagina">
        <div className="welkom">
          <Avatar naam={ik.naam} kleur={ik.kleur} />
          <div>
            <h2>Hoi {ik.naam}</h2>
            <p>
              {aantalMee == null
                ? 'Wat wil je doen?'
                : aantalMee === 0
                  ? 'Je hebt nu niets mee.'
                  : `Je hebt ${aantalMee} ${aantalMee === 1 ? 'ding' : 'dingen'} mee.`}
            </p>
          </div>
        </div>

        <nav className="hoofdknoppen" aria-label="Registreren">
          <Link className="hoofdknop blauw" to="/meenemen">
            <IcoonMee />
            <span>
              Meenemen
              <small>Scan wat je uit de loods meeneemt</small>
            </span>
          </Link>
          <Link className="hoofdknop groen" to="/terugbrengen">
            <IcoonTerug />
            <span>
              Terugbrengen
              <small>Scan wat je terugzet</small>
            </span>
          </Link>
          <Link className="hoofdknop geel" to="/restverf">
            <IcoonVerf />
            <span>
              Restverf invoeren
              <small>Scan de streepjescode op de bus</small>
            </span>
          </Link>
        </nav>

        <nav className="bijknoppen" aria-label="Meer">
          <Link className="bijknop" to="/verbruik">
            <IcoonVerbruik />
            Verbruik pakken
          </Link>
          <Link className="bijknop" to="/mijn-spullen">
            <IcoonTas />
            Mijn spullen
            {aantalMee ? <span className="teller">{aantalMee}</span> : null}
          </Link>
          <Link className="bijknop" to="/restverf/voorraad">
            <IcoonVerf />
            Restverf zoeken
          </Link>
          {isBeheerder && (
            <Link className="bijknop" to="/beheer">
              <IcoonBeheer />
              Beheer
            </Link>
          )}
        </nav>

        <div className="voet">
          <span>Ingelogd als {ik.naam}</span>
          <button className="linkknop" type="button" onClick={() => void uitloggen()}>
            Uitloggen
          </button>
        </div>
      </main>
    </>
  );
}
