import { Link } from 'react-router-dom';
import type { ArtikelOverzicht, Onderweg } from '@loods/shared';
import { check, haalOnderweg } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useLaden } from '../../lib/useLaden';
import { Kop } from '../../components/Basis';

const MENU: { pad: string; titel: string; uitleg: string }[] = [
  { pad: '/beheer/artikelen', titel: 'Artikelen', uitleg: 'Toevoegen, minimum, keuringen' },
  { pad: '/beheer/labels', titel: 'QR-labels printen', uitleg: 'A4-vellen met 24 labels' },
  { pad: '/beheer/correcties', titel: 'Correcties', uitleg: 'Voorraad of onderweg herstellen' },
  { pad: '/beheer/historie', titel: 'Historie', uitleg: 'Alle bewegingen' },
  { pad: '/beheer/medewerkers', titel: 'Medewerkers', uitleg: 'Toevoegen, e-mail, standaardbus' },
  { pad: '/beheer/voertuigen', titel: 'Bussen', uitleg: 'Namen en kentekens' },
  { pad: '/beheer/projecten', titel: 'Projecten', uitleg: 'Toevoegen en afsluiten' },
  { pad: '/beheer/zones', titel: 'Zones', uitleg: 'Plattegrond en maten' },
  { pad: '/restverf/voorraad', titel: 'Restverf', uitleg: 'Overzicht en status' },
];

export function BeheerMenu() {
  const aandacht = useLaden(async () => {
    const [artikelen, onderweg] = await Promise.all([
      supabase.from('artikel_overzicht').select('id, naam, qr_code, onder_minimum, keuring_status, aanwezig, minimum_voorraad, eenheid').eq('actief', true),
      haalOnderweg(),
    ]);
    const a = check(artikelen) as ArtikelOverzicht[];
    return {
      minimum: a.filter((x) => x.onder_minimum),
      keuring: a.filter((x) => x.keuring_status === 'verlopen' || x.keuring_status === 'verloopt'),
      lang: (onderweg as Onderweg[]).filter((o) => o.dagen_weg >= 14),
    };
  }, []);

  const d = aandacht.data;
  const meldingen = d ? d.minimum.length + d.keuring.length + d.lang.length : 0;

  return (
    <>
      <Kop titel="Beheer" terugNaar="/" />
      <main className="pagina">
        {d && meldingen > 0 && (
          <section className="sectie">
            <h2>Aandacht nodig ({meldingen})</h2>
            <div className="lijst">
              {d.minimum.map((a) => (
                <Link key={a.id} className="regel" to={`/beheer/artikelen/${a.id}`}>
                  <span className="label rood">Minimum</span>
                  <span>
                    <b>{a.naam}</b>
                    <small>
                      {a.aanwezig} aanwezig, minimaal {a.minimum_voorraad} {a.eenheid ?? ''}
                    </small>
                  </span>
                  <span className="code">{a.qr_code}</span>
                </Link>
              ))}
              {d.keuring.map((a) => (
                <Link key={a.id} className="regel" to={`/beheer/artikelen/${a.id}`}>
                  <span className={a.keuring_status === 'verlopen' ? 'label rood' : 'label geel'}>Keuring</span>
                  <span>
                    <b>{a.naam}</b>
                    <small>{a.keuring_status === 'verlopen' ? 'Keuring verlopen' : 'Keuring verloopt binnen 30 dagen'}</small>
                  </span>
                  <span className="code">{a.qr_code}</span>
                </Link>
              ))}
              {d.lang.map((o) => (
                <Link key={`${o.artikel_id}:${o.houder_id}`} className="regel" to={`/beheer/artikelen/${o.artikel_id}`}>
                  <span className="label geel">{o.dagen_weg} d</span>
                  <span>
                    <b>{o.artikel_naam}</b>
                    <small>Al {o.dagen_weg} dagen bij {o.houder_naam}</small>
                  </span>
                  <span className="code">{o.qr_code}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <nav className="beheer-menu" aria-label="Beheer">
          {MENU.map((m) => (
            <Link key={m.pad} to={m.pad}>
              {m.titel}
              <small>{m.uitleg}</small>
            </Link>
          ))}
        </nav>
      </main>
    </>
  );
}
