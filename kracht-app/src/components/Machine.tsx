import { useEffect, useState } from 'react';
import type { Oefening } from '../lib/types';
import { useWinkel } from '../lib/winkel';
import { Blad } from './Basis';
import { IcoonInstellingen } from './Iconen';

/** Oefeningen op een machine of bank, waar een stoelstand of instelling bij hoort. */
export function heeftInstelling(oef: Oefening): boolean {
  return oef.gewichtType === 'schijven' || oef.gewichtType === 'stapel' || oef.apparaat.some((a) => a === 'bank' || a === 'smith' || a === 'kabel');
}

const SUGGESTIES = ['stoel ', 'rugleuning ', 'borststeun ', 'voeten hoog', 'voeten midden', 'handgreep breed', 'handgreep neutraal', 'katrol ', 'bank 30°', 'veiligheid '];

/** Toont de opgeslagen machine-instelling met een knop om die te wijzigen. */
export function MachineInstelling({ oef, compact = false }: { oef: Oefening; compact?: boolean }) {
  const { staat, wijzig, melding } = useWinkel();
  const [open, setOpen] = useState(false);
  const huidig = staat.instellingen.machineInstellingen[oef.id] ?? '';
  const [tekst, setTekst] = useState(huidig);
  useEffect(() => setTekst(huidig), [huidig, open]);
  if (!huidig && !heeftInstelling(oef)) return null;

  const opslaan = () => {
    wijzig((s) => {
      const m = { ...s.instellingen.machineInstellingen };
      if (tekst.trim()) m[oef.id] = tekst.trim();
      else delete m[oef.id];
      return { ...s, instellingen: { ...s.instellingen, machineInstellingen: m } };
    });
    melding('Instelling bewaard');
    setOpen(false);
  };

  return (
    <>
      <button className={`machine${huidig ? '' : ' leeg'}${compact ? ' compact' : ''}`} onClick={() => setOpen(true)} aria-label={`Instelling ${oef.naam}: ${huidig || 'nog niet ingevuld'}`}>
        <IcoonInstellingen />
        <span>{huidig || 'Stoelstand of instelling toevoegen'}</span>
      </button>
      <Blad titel="Machine-instelling" open={open} sluit={() => setOpen(false)}>
        <p className="dun klein">{oef.naam}: noteer stoelstand, rugleuning, voetplaatsing of handgreep. Je ziet het elke keer als je deze oefening start.</p>
        <textarea id={`machine-${oef.id}`} className="invoer" value={tekst} onChange={(e) => setTekst(e.target.value)} placeholder="bijv. stoel 4, rugleuning 2, handgreep neutraal" />
        <div className="keuzes">
          {SUGGESTIES.map((s) => (
            <button key={s} type="button" className="keuze" style={{ fontFamily: 'var(--font)', fontWeight: 550, fontSize: '0.85rem' }} onClick={() => setTekst((t) => (t.trim() ? `${t.trim().replace(/,$/, '')}, ${s}` : s))}>
              {s.trim()}
            </button>
          ))}
        </div>
        <button className="knop primair groot" onClick={opslaan}>
          Instelling opslaan
        </button>
      </Blad>
    </>
  );
}
