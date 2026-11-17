import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { bewaarStaat, laadStaat, vraagBlijvendeOpslag } from './opslag';
import { legeStaat, normaliseer } from './staat';
import type { Staat } from './types';

interface WinkelCtx {
  staat: Staat;
  wijzig: (f: (s: Staat) => Staat) => void;
  melding: (tekst: string, fout?: boolean) => void;
}

const Ctx = createContext<WinkelCtx | null>(null);

export function WinkelProvider({ children }: { children: ReactNode }) {
  const [staat, setStaat] = useState<Staat | null>(null);
  const [toast, setToast] = useState<{ tekst: string; fout: boolean; id: number } | null>(null);
  const laatste = useRef<Staat | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    laadStaat().then((s) => {
      const st = s ? normaliseer(s) : legeStaat();
      laatste.current = st;
      setStaat(st);
    });
    vraagBlijvendeOpslag();
  }, []);

  const bewaar = useCallback(() => {
    window.clearTimeout(timer.current);
    if (laatste.current) {
      bewaarStaat(laatste.current).catch((e: Error) => setToast({ tekst: e.message, fout: true, id: Date.now() }));
    }
  }, []);

  useEffect(() => {
    const opVerberg = () => {
      if (document.visibilityState === 'hidden') bewaar();
    };
    document.addEventListener('visibilitychange', opVerberg);
    window.addEventListener('pagehide', bewaar);
    return () => {
      document.removeEventListener('visibilitychange', opVerberg);
      window.removeEventListener('pagehide', bewaar);
    };
  }, [bewaar]);

  const wijzig = useCallback(
    (f: (s: Staat) => Staat) => {
      setStaat((oud) => {
        if (!oud) return oud;
        const nieuw = f(oud);
        laatste.current = nieuw;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(bewaar, 300);
        return nieuw;
      });
    },
    [bewaar],
  );

  const melding = useCallback((tekst: string, fout = false) => setToast({ tekst, fout, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.fout ? 6000 : 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!staat) return <div className="leeg" style={{ paddingTop: 80 }}>Laden…</div>;
  return (
    <Ctx.Provider value={{ staat, wijzig, melding }}>
      {children}
      {toast && (
        <div key={toast.id} className={`toast${toast.fout ? ' fout' : ''}`} role="status">
          {toast.tekst}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useWinkel(): WinkelCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useWinkel buiten WinkelProvider');
  return c;
}

// ── Navigatie: tabbladen plus een stapel subschermen ──────

export type Tab = 'vandaag' | 'training' | 'voortgang' | 'herstel' | 'meer';
export type Scherm =
  | { naam: 'oefening'; id: string }
  | { naam: 'training'; id: string }
  | { naam: 'lichaam' }
  | { naam: 'geschiedenis' }
  | { naam: 'schema' }
  | { naam: 'apparatuur' }
  | { naam: 'koppelingen' }
  | { naam: 'backup' }
  | { naam: 'over' };

interface NavCtx {
  tab: Tab;
  zetTab: (t: Tab) => void;
  scherm: Scherm | null;
  ga: (s: Scherm) => void;
  terug: () => void;
}

const Nav = createContext<NavCtx | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('vandaag');
  const [stapel, setStapel] = useState<Scherm[]>([]);

  useEffect(() => {
    const opTerug = () => setStapel((s) => s.slice(0, -1));
    window.addEventListener('popstate', opTerug);
    return () => window.removeEventListener('popstate', opTerug);
  }, []);

  const ga = useCallback((s: Scherm) => {
    history.pushState({ diepte: Date.now() }, '');
    setStapel((st) => [...st, s]);
    window.scrollTo(0, 0);
  }, []);
  const terug = useCallback(() => {
    history.back();
  }, []);
  const zetTab = useCallback((t: Tab) => {
    setTab(t);
    setStapel((st) => {
      if (st.length) history.go(-st.length);
      return [];
    });
    window.scrollTo(0, 0);
  }, []);

  return <Nav.Provider value={{ tab, zetTab, scherm: stapel[stapel.length - 1] ?? null, ga, terug }}>{children}</Nav.Provider>;
}

export function useNav(): NavCtx {
  const c = useContext(Nav);
  if (!c) throw new Error('useNav buiten NavProvider');
  return c;
}
