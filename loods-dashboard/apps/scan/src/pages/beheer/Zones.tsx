// Zones: plattegrond van bovenaf en maten aanpassen zonder code.
// (Slepen in 3D komt in fase 2 bij het tv-dashboard.)
import { useState } from 'react';
import { kleuren, loods, type Zone } from '@loods/shared';
import { check, haalZones } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useLaden } from '../../lib/useLaden';
import { useMelding } from '../../components/Meldingen';
import { Blad, Fout, Kop, Laden } from '../../components/Basis';
import { IcoonPlus } from '../../components/Iconen';

const W = loods.breedte;
const D = loods.diepte;

type Invoer = Record<'code' | 'naam' | 'wand' | 'x' | 'y' | 'z' | 'breedte' | 'diepte' | 'hoogte' | 'omschrijving' | 'kleur_override', string> & {
  maat_geschat: boolean;
  heeft_voorraad: boolean;
  id?: string;
};

const getal = (s: string) => parseFloat(s.replace(',', '.'));
const tekst = (n: number) => String(Number(n)).replace('.', ',');

function naarInvoer(z?: Zone): Invoer {
  return {
    id: z?.id,
    code: z?.code ?? '',
    naam: z?.naam ?? '',
    wand: z?.wand ?? '',
    x: z ? tekst(z.x) : '0',
    y: z ? tekst(z.y) : '0',
    z: z ? tekst(z.z) : '0',
    breedte: z ? tekst(z.breedte) : '1',
    diepte: z ? tekst(z.diepte) : '0,5',
    hoogte: z ? tekst(z.hoogte) : '2',
    omschrijving: z?.omschrijving ?? '',
    kleur_override: z?.kleur_override ?? '',
    maat_geschat: z?.maat_geschat ?? true,
    heeft_voorraad: z?.heeft_voorraad ?? true,
  };
}

export function Zones() {
  const melding = useMelding();
  const lijst = useLaden(haalZones, []);
  const [bewerk, setBewerk] = useState<Invoer | null>(null);
  const [bezig, setBezig] = useState(false);

  async function opslaan(e: React.FormEvent) {
    e.preventDefault();
    if (!bewerk) return;
    const maten = { x: getal(bewerk.x), y: getal(bewerk.y), z: getal(bewerk.z), breedte: getal(bewerk.breedte), diepte: getal(bewerk.diepte), hoogte: getal(bewerk.hoogte) };
    if (Object.values(maten).some((n) => Number.isNaN(n))) return melding('fout', 'Vul alle maten in als getal (meters, bijv. 1,65).');
    if (maten.breedte <= 0 || maten.diepte <= 0 || maten.hoogte <= 0) return melding('fout', 'Breedte, diepte en hoogte moeten groter dan 0 zijn.');
    const rij = {
      code: bewerk.code.trim().toUpperCase(),
      naam: bewerk.naam.trim(),
      wand: bewerk.wand.trim() || null,
      ...maten,
      omschrijving: bewerk.omschrijving.trim() || null,
      kleur_override: /^#[0-9a-f]{6}$/i.test(bewerk.kleur_override) ? bewerk.kleur_override : null,
      maat_geschat: bewerk.maat_geschat,
      heeft_voorraad: bewerk.heeft_voorraad,
    };
    setBezig(true);
    try {
      if (bewerk.id) check(await supabase.from('zones').update(rij).eq('id', bewerk.id));
      else check(await supabase.from('zones').insert({ ...rij, volgorde: 500 }));
      melding('ok', `Zone ${rij.code} opgeslagen`);
      if (maten.x + maten.breedte > W + 0.01 || maten.z + maten.diepte > D + 0.01) melding('let-op', 'Let op: deze zone steekt buiten de loods.');
      setBewerk(null);
      void lijst.opnieuw();
    } catch (err) {
      melding('fout', err instanceof Error ? err.message : String(err));
    } finally {
      setBezig(false);
    }
  }

  const zones = lijst.data ?? [];

  return (
    <>
      <Kop titel="Zones" terugNaar="/beheer" />
      <main className="pagina">
        <p className="uitleg">
          Bovenaanzicht. Links de voorgevel met de kanteldeur, boven de ladderwand. Tik op een zone om de maten aan te passen (in meters,
          gemeten vanaf de hoek kanteldeur × ladderwand).
        </p>
        {lijst.laden && !lijst.data ? (
          <Laden />
        ) : lijst.fout ? (
          <Fout tekst={lijst.fout} opnieuw={lijst.opnieuw} />
        ) : (
          <>
            <Plattegrond zones={zones} gekozen={bewerk?.id} kies={(z) => setBewerk(naarInvoer(z))} />
            <button className="knop blauw breed" type="button" onClick={() => setBewerk(naarInvoer())}>
              <IcoonPlus />
              Zone toevoegen
            </button>
            <div className="lijst">
              {zones.map((z) => (
                <button key={z.id} className="regel" type="button" onClick={() => setBewerk(naarInvoer(z))}>
                  <span className="code">{z.code}</span>
                  <span>
                    <b>{z.naam}</b>
                    <small>
                      x {tekst(z.x)}–{tekst(+(z.x + z.breedte).toFixed(2))} · z {tekst(z.z)}–{tekst(+(z.z + z.diepte).toFixed(2))} m
                      {z.heeft_voorraad ? '' : ' · vast punt'}
                    </small>
                  </span>
                  <span className="rechts">{z.maat_geschat ? <span className="label geel">Geschat</span> : <span className="label groen">Gemeten</span>}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
      {bewerk && (
        <Blad titel={bewerk.id ? `Zone ${bewerk.code}` : 'Nieuwe zone'} sluit={() => setBewerk(null)}>
          <form className="formulier" onSubmit={opslaan}>
            <div className="rij2">
              <label className="veld">
                <span>Code</span>
                <input className="invoer" value={bewerk.code} onChange={(e) => setBewerk({ ...bewerk, code: e.target.value.toUpperCase() })} maxLength={4} required />
              </label>
              <label className="veld">
                <span>Naam</span>
                <input className="invoer" value={bewerk.naam} onChange={(e) => setBewerk({ ...bewerk, naam: e.target.value })} required />
              </label>
            </div>
            <label className="veld">
              <span>Plek / wand</span>
              <input className="invoer" value={bewerk.wand} onChange={(e) => setBewerk({ ...bewerk, wand: e.target.value })} placeholder="Bijv. Wand B, vloer" />
            </label>
            <div className="rij3">
              {(['x', 'z', 'y'] as const).map((k) => (
                <label key={k} className="veld">
                  <span>{k === 'x' ? 'Begin x (langs ladderwand)' : k === 'z' ? 'Begin z (langs voorgevel)' : 'Onderkant (hoogte)'}</span>
                  <input className="invoer" inputMode="decimal" value={bewerk[k]} onChange={(e) => setBewerk({ ...bewerk, [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <div className="rij3">
              {(['breedte', 'diepte', 'hoogte'] as const).map((k) => (
                <label key={k} className="veld">
                  <span>{k === 'breedte' ? 'Breedte (x)' : k === 'diepte' ? 'Diepte (z)' : 'Hoogte'}</span>
                  <input className="invoer" inputMode="decimal" value={bewerk[k]} onChange={(e) => setBewerk({ ...bewerk, [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <label className="veld">
              <span>Wat staat hier?</span>
              <textarea className="invoer" value={bewerk.omschrijving} onChange={(e) => setBewerk({ ...bewerk, omschrijving: e.target.value })} />
            </label>
            <label className="vinkje">
              <input type="checkbox" checked={bewerk.maat_geschat} onChange={(e) => setBewerk({ ...bewerk, maat_geschat: e.target.checked })} />
              Maat is geschat (nog nameten)
            </label>
            <label className="vinkje">
              <input type="checkbox" checked={!bewerk.heeft_voorraad} onChange={(e) => setBewerk({ ...bewerk, heeft_voorraad: !e.target.checked })} />
              Vast punt zonder voorraad (grijs, bijv. riool of gang)
            </label>
            <button className="knop groen" type="submit" disabled={bezig}>
              {bezig ? 'Bezig…' : 'Zone opslaan'}
            </button>
          </form>
        </Blad>
      )}
    </>
  );
}

function Plattegrond({ zones, gekozen, kies }: { zones: Zone[]; gekozen?: string; kies: (z: Zone) => void }) {
  const rand = 0.7;
  // Eerst de vloer-zones, daarna wat hoger hangt (aan de wand of op de entresol)
  // als stippellijn erover, met de code rechts zodat die niet over een andere valt.
  const isHoog = (z: Zone) => z.y >= 0.5;
  const opVolgorde = [...zones].sort((a, b) => Number(isHoog(a)) - Number(isHoog(b)));
  return (
    <svg className="plattegrond" viewBox={`${-rand} ${-rand} ${W + rand * 2} ${D + rand * 2}`} role="img" aria-label="Plattegrond van de loods">
      {/* raster 1 m */}
      {Array.from({ length: Math.floor(W) + 1 }, (_, i) => (
        <line key={`x${i}`} x1={i} y1={0} x2={i} y2={D} stroke="rgba(255,255,255,.07)" strokeWidth={0.02} />
      ))}
      {Array.from({ length: Math.floor(D) + 1 }, (_, i) => (
        <line key={`z${i}`} x1={0} y1={i} x2={W} y2={i} stroke="rgba(255,255,255,.07)" strokeWidth={0.02} />
      ))}
      <rect x={0} y={0} width={W} height={D} fill="none" stroke={kleuren.blauw} strokeWidth={0.06} />
      {/* vaste elementen */}
      <line x1={0} y1={0.5} x2={0} y2={3.5} stroke="#d5d8db" strokeWidth={0.22} />
      <line x1={0} y1={5.9} x2={0} y2={7.6} stroke="#5e8fb3" strokeWidth={0.16} />
      <rect x={0} y={D - 1.62} width={5.65} height={0.12} fill="#8a8b90" />
      <rect x={0.68} y={D - 1.66} width={0.85} height={0.2} fill={kleuren.rood} />
      <rect x={7.6} y={0} width={W - 7.6} height={5} fill="rgba(169,124,80,.12)" stroke="#a97c50" strokeWidth={0.04} strokeDasharray="0.15 0.1" />
      <rect x={3.5} y={D - 1.05} width={2.28} height={0.95} fill="rgba(207,207,203,.15)" stroke="#8a8b90" strokeWidth={0.03} />
      <line x1={W} y1={8.65} x2={W} y2={9.3} stroke="#d5d8db" strokeWidth={0.16} />
      <circle cx={W - 0.12} cy={5.8} r={0.1} fill={kleuren.rood} />
      {/* zones */}
      {opVolgorde.map((z) => {
        const hoog = isHoog(z);
        const kleur = z.kleur_override ?? (z.heeft_voorraad ? kleuren.blauw : '#8a8b90');
        const sel = z.id === gekozen;
        return (
          <g key={z.id} onClick={() => kies(z)} style={{ cursor: 'pointer' }}>
            <rect
              x={z.x}
              y={z.z}
              width={z.breedte}
              height={z.diepte}
              fill={hoog ? 'transparent' : kleur}
              fillOpacity={sel ? 0.75 : 0.4}
              stroke={sel ? '#fff' : kleur}
              strokeWidth={sel ? 0.06 : 0.035}
              strokeDasharray={hoog ? '0.12 0.08' : undefined}
            />
            <text
              x={hoog ? z.x + z.breedte - 0.3 : z.x + z.breedte / 2}
              y={hoog ? z.z + Math.min(z.diepte / 2, 0.45) : z.z + z.diepte / 2}
              fontSize={hoog ? 0.26 : 0.3}
              fontWeight={700}
              fill="#fff"
              textAnchor="middle"
              dominantBaseline="central"
              style={{ paintOrder: 'stroke', stroke: '#26272b', strokeWidth: 0.08 }}
            >
              {z.code}
            </text>
          </g>
        );
      })}
      {/* bijschriften */}
      <text x={W / 2} y={-0.3} fontSize={0.28} fill="#c3c4c9" textAnchor="middle">Ladderwand (B) · 10,60 m</text>
      <text x={-0.3} y={D / 2} fontSize={0.28} fill="#c3c4c9" textAnchor="middle" transform={`rotate(-90 ${-0.3} ${D / 2})`}>
        Voorgevel (A) · kanteldeur · 9,40 m
      </text>
      <text x={1.1} y={D - 1.85} fontSize={0.22} fill="#c3c4c9" textAnchor="middle">Verfwand</text>
      <text x={4.64} y={D - 0.45} fontSize={0.2} fill="#c3c4c9" textAnchor="middle">Trap</text>
      <text x={9.1} y={5.25} fontSize={0.2} fill="#a97c50" textAnchor="middle">Entresol</text>
    </svg>
  );
}
