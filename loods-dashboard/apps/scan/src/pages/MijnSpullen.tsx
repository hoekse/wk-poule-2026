// Wat heb ik mee? En wie heeft wat (handig als je iets zoekt)?
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Onderweg } from '@loods/shared';
import { haalOnderweg } from '../lib/api';
import { useIk } from '../lib/sessie';
import { useLaden } from '../lib/useLaden';
import { aantalTekst, sindsTekst } from '../lib/opmaak';
import { Avatar, Fout, Kop, Laden } from '../components/Basis';
import { IcoonTerug } from '../components/Iconen';

export function MijnSpullen() {
  const ik = useIk();
  const [tab, setTab] = useState<'ik' | 'iedereen'>('ik');
  const lijst = useLaden(() => haalOnderweg(tab === 'ik' ? { houderId: ik.id } : {}), [tab, ik.id]);

  return (
    <>
      <Kop titel="Mijn spullen" terugNaar="/" />
      <main className="pagina">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'ik'} type="button" onClick={() => setTab('ik')}>
            Wat ik mee heb
          </button>
          <button role="tab" aria-selected={tab === 'iedereen'} type="button" onClick={() => setTab('iedereen')}>
            Iedereen
          </button>
        </div>

        {lijst.laden && !lijst.data ? (
          <Laden />
        ) : lijst.fout ? (
          <Fout tekst={lijst.fout} opnieuw={lijst.opnieuw} />
        ) : (lijst.data ?? []).length === 0 ? (
          <div className="leeg">{tab === 'ik' ? 'Je hebt niets mee. Alles staat in de loods.' : 'Er is niets onderweg.'}</div>
        ) : (
          <div className="lijst">
            {(lijst.data ?? []).map((o) => (
              <OnderwegRegel key={`${o.artikel_id}:${o.houder_id}`} o={o} metNaam={tab === 'iedereen'} />
            ))}
          </div>
        )}

        {tab === 'ik' && (lijst.data ?? []).length > 0 && (
          <Link className="knop groen breed" to="/terugbrengen">
            <IcoonTerug />
            Terugbrengen
          </Link>
        )}
      </main>
    </>
  );
}

export function OnderwegRegel({ o, metNaam }: { o: Onderweg; metNaam: boolean }) {
  const lang = o.dagen_weg >= 14;
  return (
    <div className="regel">
      {metNaam ? <Avatar naam={o.houder_naam} kleur={o.houder_kleur} /> : <span className="code">{o.qr_code}</span>}
      <span>
        <b>
          {o.telwijze === 'aantal' ? `${aantalTekst(o.aantal, o.eenheid)} ` : ''}
          {o.artikel_naam}
        </b>
        <small>
          {metNaam ? `${o.houder_naam} · ` : ''}
          {[o.voertuig_naam, o.project_naam ? `project ${o.project_naam}` : null].filter(Boolean).join(', ') || 'Geen bus of project'}
        </small>
      </span>
      <span className="rechts">
        <small className={lang ? 'label geel' : undefined} style={lang ? undefined : { color: 'var(--muted)' }}>
          {sindsTekst(o.sinds)}
        </small>
        <br />
        {o.zone_code && <span className="zone">{o.zone_code}</span>}
      </span>
    </div>
  );
}
