import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type Soort = 'ok' | 'fout' | 'info' | 'let-op';
interface Melding {
  id: number;
  soort: Soort;
  tekst: string;
  t: number;
}

const MeldingContext = createContext<((soort: Soort, tekst: string) => void) | null>(null);

/** Korte meldingen onderin het scherm (max. twee tegelijk); verdwijnen vanzelf. */
export function MeldingProvider({ children }: { children: ReactNode }) {
  const [lijst, setLijst] = useState<Melding[]>([]);
  const volgende = useRef(1);
  const { pathname } = useLocation();

  // Naar een ander scherm: oude meldingen weg (een melding die net bij het
  // wisselen is getoond, zoals "Toegevoegd met code …", blijft staan).
  useEffect(() => {
    setLijst((l) => l.filter((m) => Date.now() - m.t < 400));
  }, [pathname]);

  const toon = useCallback((soort: Soort, tekst: string) => {
    const id = volgende.current++;
    setLijst((l) => [...l.slice(-1), { id, soort, tekst, t: Date.now() }]);
    setTimeout(() => setLijst((l) => l.filter((m) => m.id !== id)), soort === 'fout' ? 6000 : 2600);
  }, []);

  const waarde = useMemo(() => toon, [toon]);

  return (
    <MeldingContext.Provider value={waarde}>
      {children}
      <div className="meldingen" aria-live="assertive">
        {lijst.map((m) => (
          <div
            key={m.id}
            className={`melding ${m.soort}`}
            role={m.soort === 'fout' ? 'alert' : 'status'}
            onClick={() => setLijst((l) => l.filter((x) => x.id !== m.id))}
          >
            {m.tekst}
          </div>
        ))}
      </div>
    </MeldingContext.Provider>
  );
}

export function useMelding() {
  const m = useContext(MeldingContext);
  if (!m) throw new Error('useMelding buiten MeldingProvider');
  return m;
}
