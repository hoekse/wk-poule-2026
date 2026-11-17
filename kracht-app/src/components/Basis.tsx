import { useEffect, useId, useState, type ReactNode } from 'react';
import { useNav } from '../lib/winkel';
import { IcoonMin, IcoonPlus, IcoonSluit, IcoonTerug } from './Iconen';

export function Kop({ titel, sub, boven, terug, rechts }: { titel: string; sub?: string; boven?: string; terug?: boolean; rechts?: ReactNode }) {
  const nav = useNav();
  return (
    <header className="kop">
      {terug && (
        <button className="icoonknop" onClick={nav.terug} aria-label="Terug">
          <IcoonTerug />
        </button>
      )}
      <h1>
        {boven && <span className="boven">{boven}</span>}
        {titel}
        {sub && <span className="sub">{sub}</span>}
      </h1>
      {rechts}
    </header>
  );
}

export function Blad({ titel, open, sluit, children }: { titel: string; open: boolean; sluit: () => void; children: ReactNode }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const opToets = (e: KeyboardEvent) => e.key === 'Escape' && sluit();
    window.addEventListener('keydown', opToets);
    const oud = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', opToets);
      document.body.style.overflow = oud;
    };
  }, [open, sluit]);
  if (!open) return null;
  return (
    <div className="blad-achter" onClick={(e) => e.target === e.currentTarget && sluit()}>
      <div className="blad" role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="blad-greep" />
        <div className="blad-kop">
          <h2 id={id}>{titel}</h2>
          <button className="icoonknop" onClick={sluit} aria-label="Sluiten">
            <IcoonSluit />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Getalinvoer met − en + knoppen; leeg veld geeft null. */
export function Stapper({
  id,
  waarde,
  stap,
  zet,
  min = 0,
  max,
  decimalen = 1,
  label,
}: {
  id?: string;
  waarde: number | null | undefined;
  stap: number;
  zet: (n: number | null) => void;
  min?: number;
  max?: number;
  decimalen?: number;
  label: string;
}) {
  const [tekst, setTekst] = useState(waarde == null ? '' : fmtInvoer(waarde));
  useEffect(() => {
    setTekst((t) => (leesInvoer(t) === waarde ? t : waarde == null ? '' : fmtInvoer(waarde)));
  }, [waarde]);
  const klem = (n: number) => {
    let x = Math.max(min, n);
    if (max != null) x = Math.min(max, x);
    const f = 10 ** decimalen;
    return Math.round(x * f) / f;
  };
  return (
    <div className="stapper">
      <button type="button" aria-label={`${label} omlaag`} onClick={() => zet(klem((waarde ?? 0) - stap))}>
        <IcoonMin />
      </button>
      <input
        id={id}
        aria-label={label}
        inputMode="decimal"
        value={tekst}
        onChange={(e) => {
          setTekst(e.target.value);
          const n = leesInvoer(e.target.value);
          zet(n == null ? null : klem(n));
        }}
      />
      <button type="button" aria-label={`${label} omhoog`} onClick={() => zet(klem((waarde ?? 0) + stap))}>
        <IcoonPlus />
      </button>
    </div>
  );
}

export function fmtInvoer(n: number): string {
  return String(n).replace('.', ',');
}

export function leesInvoer(t: string): number | null {
  const s = t.trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function Segment<T extends string | number>({
  opties,
  waarde,
  zet,
  label,
}: {
  opties: { waarde: T; tekst: string }[];
  waarde: T;
  zet: (w: T) => void;
  label: string;
}) {
  return (
    <div className="segment" role="group" aria-label={label}>
      {opties.map((o) => (
        <button key={String(o.waarde)} type="button" aria-pressed={o.waarde === waarde} onClick={() => zet(o.waarde)}>
          {o.tekst}
        </button>
      ))}
    </div>
  );
}

export function Schaal({ waarde, zet, label, laag, hoog }: { waarde?: number; zet: (n: number | undefined) => void; label: string; laag: string; hoog: string }) {
  return (
    <div className="veld">
      <span>{label}</span>
      <div className="keuzes" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="keuze" aria-pressed={waarde === n} onClick={() => zet(waarde === n ? undefined : n)} style={{ flex: 1 }}>
            {n}
          </button>
        ))}
      </div>
      <div className="rij tussen mini dun">
        <span>{laag}</span>
        <span>{hoog}</span>
      </div>
    </div>
  );
}

export function Schakelaar({ id, aan, zet, children }: { id: string; aan: boolean; zet: (b: boolean) => void; children: ReactNode }) {
  return (
    <label className="schakelaar" htmlFor={id}>
      <span>{children}</span>
      <input id={id} type="checkbox" role="switch" checked={aan} onChange={(e) => zet(e.target.checked)} />
    </label>
  );
}

const NIVEAU_VERLOOP = {
  groen: ['var(--groen)', 'var(--groen-2)'],
  oranje: ['#fbbf24', '#fb923c'],
  rood: ['#f87171', '#f43f5e'],
  onbekend: ['var(--vlak-3)', 'var(--vlak-3)'],
} as const;

export function Ring({ score, niveau, groot = false }: { score: number | null; niveau: keyof typeof NIVEAU_VERLOOP; groot?: boolean }) {
  const id = `ring${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const r = 44;
  const omtrek = 2 * Math.PI * r;
  const deel = score == null ? 0 : Math.max(0.02, score / 100);
  const [van, tot] = NIVEAU_VERLOOP[niveau];
  return (
    <div className={`ring${groot ? ' groot' : ''}`} role="img" aria-label={score == null ? 'Geen herstelscore' : `Herstelscore ${score} van 100`}>
      <svg viewBox="0 0 104 104">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={van} />
            <stop offset="1" stopColor={tot} />
          </linearGradient>
        </defs>
        <circle cx="52" cy="52" r={r} fill="none" stroke="var(--vlak-2)" strokeWidth="9" />
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${omtrek * deel} ${omtrek}`}
          style={{ filter: score == null ? undefined : `drop-shadow(0 0 6px ${van})` }}
        />
      </svg>
      <div className="waarde">
        <div>
          <b>{score ?? '–'}</b>
          <small>herstel</small>
        </div>
      </div>
    </div>
  );
}

export function scoreKleur(score: number): string {
  return score >= 75 ? 'var(--groen)' : score >= 55 ? 'var(--geel)' : 'var(--rood)';
}
