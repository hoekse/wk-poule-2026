import { useState } from 'react';
import { verkleinFoto } from '../lib/foto';
import { bewaarFoto, verwijderFoto } from '../lib/opslag';
import { nieuwId } from '../lib/staat';
import type { Oefening } from '../lib/types';
import { useWinkel } from '../lib/winkel';
import { Blad } from './Basis';
import { useFotoUrl } from './Fotos';
import { IcoonPlus, IcoonPrullenbak } from './Iconen';

function Plaatje({ id, alt }: { id: string; alt: string }) {
  const url = useFotoUrl(id);
  if (url === undefined) return <span className="dun mini">Laden…</span>;
  return url ? <img src={url} alt={alt} /> : <span className="dun mini">Foto staat niet op deze telefoon</span>;
}

/**
 * Eigen foto's van de uitleg op de machine (de sticker met tekening en spieren).
 * Maak ze één keer in de sportschool; ze blijven op je telefoon en gaan mee in de back-up.
 */
export function UitlegFotos({ oef }: { oef: Oefening }) {
  const { staat, wijzig, melding } = useWinkel();
  const ids = staat.uitlegFotos[oef.id] ?? [];
  const [bezig, setBezig] = useState(false);
  const [groot, setGroot] = useState<string | null>(null);

  const voegToe = async (bestand: File | undefined) => {
    if (!bestand) return;
    setBezig(true);
    try {
      const blob = await verkleinFoto(bestand, 1600, 0.85);
      const id = `uitleg-${nieuwId()}`;
      await bewaarFoto(id, blob);
      wijzig((s) => ({ ...s, uitlegFotos: { ...s.uitlegFotos, [oef.id]: [...(s.uitlegFotos[oef.id] ?? []), id] } }));
      melding('Uitlegfoto bewaard');
    } catch (e) {
      melding((e as Error).message || 'Foto bewaren is mislukt', true);
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="uitlegfotos">
      {ids.length > 0 && (
        <div className="uitlegfotos-rij">
          {ids.map((id, i) => (
            <button key={id} onClick={() => setGroot(id)} aria-label={`Uitlegfoto ${i + 1} van ${oef.naam} vergroten`}>
              <Plaatje id={id} alt={`Uitleg op de machine: ${oef.naam}`} />
            </button>
          ))}
        </div>
      )}
      <label className={`machine${ids.length ? '' : ' leeg'}`} aria-disabled={bezig}>
        <IcoonPlus />
        <span>{bezig ? 'Bezig…' : ids.length ? 'Nog een foto van de machine' : 'Foto van de uitleg op de machine'}</span>
        <input
          className="verborgen"
          type="file"
          accept="image/*"
          capture="environment"
          aria-label={`Foto van de uitleg op de machine toevoegen voor ${oef.naam}`}
          onChange={(e) => {
            void voegToe(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      {!ids.length && <p className="dun mini">Fotografeer in de sportschool de sticker met de tekening op de machine; die zie je dan hier en tijdens het trainen.</p>}
      <Blad titel={oef.naam} open={!!groot} sluit={() => setGroot(null)}>
        {groot && (
          <>
            <div className="uitlegfoto-groot">
              <Plaatje id={groot} alt={`Uitleg op de machine: ${oef.naam}`} />
            </div>
            <p className="dun mini">Knijp met twee vingers om in te zoomen.</p>
            <button
              className="knop stil gevaar"
              onClick={async () => {
                const weg = groot;
                await verwijderFoto(weg).catch(() => {});
                wijzig((s) => ({ ...s, uitlegFotos: { ...s.uitlegFotos, [oef.id]: (s.uitlegFotos[oef.id] ?? []).filter((x) => x !== weg) } }));
                setGroot(null);
                melding('Foto verwijderd');
              }}
            >
              <IcoonPrullenbak /> Foto verwijderen
            </button>
          </>
        )}
      </Blad>
    </div>
  );
}
