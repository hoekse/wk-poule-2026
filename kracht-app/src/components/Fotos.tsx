import { useEffect, useMemo, useState } from 'react';
import { kortDatum, vandaag } from '../lib/datum';
import { verkleinFoto } from '../lib/foto';
import { bewaarFoto, laadFoto, verwijderFoto } from '../lib/opslag';
import { nieuwId } from '../lib/staat';
import type { FotoHouding, FotoMeta } from '../lib/types';
import { useWinkel } from '../lib/winkel';
import { Blad, Segment } from './Basis';
import { IcoonPlus, IcoonPrullenbak } from './Iconen';

const HOUDING: { waarde: FotoHouding; tekst: string }[] = [
  { waarde: 'voor', tekst: 'Voorkant' },
  { waarde: 'zij', tekst: 'Zijkant' },
  { waarde: 'achter', tekst: 'Achterkant' },
];

/** Laadt een foto uit IndexedDB als object-URL. */
function useFotoUrl(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let weg: string | null = null;
    let actief = true;
    laadFoto(id)
      .then((blob) => {
        if (!blob || !actief) return;
        weg = URL.createObjectURL(blob);
        setUrl(weg);
      })
      .catch(() => setUrl(null));
    return () => {
      actief = false;
      if (weg) URL.revokeObjectURL(weg);
    };
  }, [id]);
  return url;
}

function Foto({ meta, alt }: { meta: FotoMeta | undefined; alt: string }) {
  const url = useFotoUrl(meta?.id);
  return url ? <img src={url} alt={alt} /> : <div className="leeg" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>–</div>;
}

export function Fotos() {
  const { staat, wijzig, melding } = useWinkel();
  const [houding, setHouding] = useState<FotoHouding>('voor');
  const [bezig, setBezig] = useState(false);
  const [bekijk, setBekijk] = useState<FotoMeta | null>(null);
  const lijst = useMemo(() => staat.fotos.filter((f) => f.houding === houding).sort((a, b) => a.datum.localeCompare(b.datum)), [staat.fotos, houding]);
  const [vanId, setVanId] = useState<string>('');
  const [totId, setTotId] = useState<string>('');
  const van = lijst.find((f) => f.id === vanId) ?? lijst[0];
  const tot = lijst.find((f) => f.id === totId) ?? lijst[lijst.length - 1];

  const voegToe = async (bestand: File | undefined) => {
    if (!bestand) return;
    setBezig(true);
    try {
      const blob = await verkleinFoto(bestand);
      const meta: FotoMeta = { id: nieuwId(), datum: vandaag(), houding };
      await bewaarFoto(meta.id, blob);
      wijzig((s) => ({ ...s, fotos: [...s.fotos, meta] }));
      melding('Foto bewaard');
    } catch (e) {
      melding((e as Error).message || 'Foto bewaren is mislukt', true);
    } finally {
      setBezig(false);
    }
  };

  return (
    <section className="kaart" aria-label="Voortgangsfoto's">
      <div className="rij tussen">
        <h2>Foto's</h2>
        <label className="knop primair klein" aria-disabled={bezig}>
          <IcoonPlus /> {bezig ? 'Bezig…' : 'Foto'}
          <input className="verborgen" type="file" accept="image/*" capture="environment" onChange={(e) => { voegToe(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      </div>
      <Segment<FotoHouding> label="Houding" waarde={houding} zet={setHouding} opties={HOUDING} />
      {lijst.length === 0 ? (
        <p className="dun klein">
          Maak één keer per maand een foto, steeds op dezelfde plek, in hetzelfde licht en 's ochtends. Bij aftrainen zie je hier vaak meer dan op de weegschaal. De
          foto's blijven op je telefoon.
        </p>
      ) : (
        <>
          {lijst.length >= 2 && (
            <>
              <div className="vergelijk">
                <figure>
                  <div className="kader">
                    <Foto meta={van} alt={`Foto ${van && kortDatum(van.datum)}`} />
                  </div>
                  <select id="foto-van" className="invoer" value={van?.id} onChange={(e) => setVanId(e.target.value)} aria-label="Eerste foto">
                    {lijst.map((f) => (
                      <option key={f.id} value={f.id}>
                        {kortDatum(f.datum)}
                      </option>
                    ))}
                  </select>
                </figure>
                <figure>
                  <div className="kader">
                    <Foto meta={tot} alt={`Foto ${tot && kortDatum(tot.datum)}`} />
                  </div>
                  <select id="foto-tot" className="invoer" value={tot?.id} onChange={(e) => setTotId(e.target.value)} aria-label="Tweede foto">
                    {lijst.map((f) => (
                      <option key={f.id} value={f.id}>
                        {kortDatum(f.datum)}
                      </option>
                    ))}
                  </select>
                </figure>
              </div>
            </>
          )}
          <div className="fotogrid">
            {[...lijst].reverse().map((f) => (
              <button key={f.id} onClick={() => setBekijk(f)} aria-label={`Foto van ${kortDatum(f.datum)} bekijken`}>
                <Foto meta={f} alt={`Foto ${kortDatum(f.datum)}`} />
                <span>{kortDatum(f.datum)}</span>
              </button>
            ))}
          </div>
        </>
      )}
      <Blad titel={bekijk ? `Foto ${kortDatum(bekijk.datum)}` : 'Foto'} open={!!bekijk} sluit={() => setBekijk(null)}>
        {bekijk && (
          <>
            <div className="kader" style={{ borderRadius: 18, overflow: 'hidden' }}>
              <Foto meta={bekijk} alt={`Foto ${kortDatum(bekijk.datum)}`} />
            </div>
            <button
              className="knop stil gevaar"
              onClick={async () => {
                await verwijderFoto(bekijk.id).catch(() => {});
                wijzig((s) => ({ ...s, fotos: s.fotos.filter((x) => x.id !== bekijk.id) }));
                setBekijk(null);
                melding('Foto verwijderd');
              }}
            >
              <IcoonPrullenbak /> Foto verwijderen
            </button>
          </>
        )}
      </Blad>
    </section>
  );
}
