import { useCallback, useEffect, useRef, useState } from 'react';

/** Laadt gegevens bij het openen van een scherm, met laden/fout-status en opnieuw laden. */
export function useLaden<T>(laad: () => Promise<T>, afhankelijk: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [laden, setLaden] = useState(true);
  const teller = useRef(0);

  const opnieuw = useCallback(async () => {
    const mijn = ++teller.current;
    setLaden(true);
    setFout(null);
    try {
      const d = await laad();
      if (mijn === teller.current) setData(d);
    } catch (e) {
      if (mijn === teller.current) setFout(e instanceof Error ? e.message : String(e));
    } finally {
      if (mijn === teller.current) setLaden(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, afhankelijk);

  useEffect(() => {
    void opnieuw();
  }, [opnieuw]);

  return { data, fout, laden, opnieuw, setData };
}
