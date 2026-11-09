import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { leesbareFout, type Medewerker } from '@loods/shared';
import { supabase } from './supabase';

type Status = 'laden' | 'uitgelogd' | 'onbekend' | 'inactief' | 'ingelogd' | 'fout';

interface SessieWaarde {
  status: Status;
  email: string | null;
  medewerker: Medewerker | null;
  fout: string | null;
  isBeheerder: boolean;
  opnieuw: () => void;
  uitloggen: () => Promise<void>;
}

const SessieContext = createContext<SessieWaarde | null>(null);
const BEWAARD = 'loods.medewerker';

function leesBewaard(userId: string): Medewerker | null {
  try {
    const m = JSON.parse(localStorage.getItem(BEWAARD) || 'null') as Medewerker | null;
    return m && m.auth_user_id === userId ? m : null;
  } catch {
    return null;
  }
}

export function SessieProvider({ children }: { children: ReactNode }) {
  const [sessie, setSessie] = useState<Session | null | undefined>(undefined);
  const [medewerker, setMedewerker] = useState<Medewerker | null>(null);
  const [status, setStatus] = useState<Status>('laden');
  const [fout, setFout] = useState<string | null>(null);
  const [poging, setPoging] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessie(data.session));
    const { data } = supabase.auth.onAuthStateChange((_gebeurtenis, s) => {
      // Geen andere Supabase-aanroepen in deze callback (kan vastlopen); alleen state zetten.
      setSessie(s);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = sessie?.user.id ?? null;

  useEffect(() => {
    if (sessie === undefined) return;
    if (!sessie || !userId) {
      setMedewerker(null);
      setStatus('uitgelogd');
      return;
    }
    let weg = false;
    (async () => {
      const { data, error } = await supabase.rpc('koppel_mij').maybeSingle<Medewerker>();
      if (weg) return;
      if (error) {
        // Geen verbinding: werk verder met de laatst bekende gegevens.
        const bewaard = leesBewaard(userId);
        if (bewaard?.actief) {
          setMedewerker(bewaard);
          setStatus('ingelogd');
        } else {
          setFout(leesbareFout(error));
          setStatus('fout');
        }
        return;
      }
      if (!data || !data.id) {
        setMedewerker(null);
        setStatus('onbekend');
        return;
      }
      setMedewerker(data);
      try {
        localStorage.setItem(BEWAARD, JSON.stringify(data));
      } catch {
        /* privémodus: niet erg */
      }
      setStatus(data.actief ? 'ingelogd' : 'inactief');
    })();
    return () => {
      weg = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessie === undefined, poging]);

  const uitloggen = useCallback(async () => {
    try {
      localStorage.removeItem(BEWAARD);
    } catch {
      /* niet erg */
    }
    // 'local': werkt ook zonder verbinding (de standaard-uitlog belt eerst de server en faalt dan stil).
    await supabase.auth.signOut({ scope: 'local' });
    setSessie(null);
  }, []);

  const waarde = useMemo<SessieWaarde>(
    () => ({
      status,
      email: sessie?.user.email ?? null,
      medewerker,
      fout,
      isBeheerder: medewerker?.rol === 'beheerder' && medewerker.actief,
      opnieuw: () => {
        setStatus('laden');
        setPoging((p) => p + 1);
      },
      uitloggen,
    }),
    [status, sessie, medewerker, fout, uitloggen],
  );

  return <SessieContext.Provider value={waarde}>{children}</SessieContext.Provider>;
}

export function useSessie(): SessieWaarde {
  const s = useContext(SessieContext);
  if (!s) throw new Error('useSessie buiten SessieProvider');
  return s;
}

/** Alleen te gebruiken binnen ingelogde schermen. */
export function useIk(): Medewerker {
  const { medewerker } = useSessie();
  if (!medewerker) throw new Error('Niet ingelogd');
  return medewerker;
}
