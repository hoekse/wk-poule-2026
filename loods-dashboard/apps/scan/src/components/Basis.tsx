// Kleine bouwstenen die op bijna elk scherm terugkomen.
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoBlokjes } from '@loods/shared';
import { IcoonPijlTerug } from './Iconen';

/** Logo-kenmerk: vier huisstijlblokjes. Placeholder tot het echte logo er is. */
export function Kenmerk({ groot = false }: { groot?: boolean }) {
  return (
    <div className={groot ? 'kenmerk groot' : 'kenmerk'} aria-hidden="true">
      {logoBlokjes.map((k) => (
        <span key={k} style={{ background: k }} />
      ))}
    </div>
  );
}

export function Kop({
  titel,
  terugNaar,
  opTerug,
  rechts,
}: {
  titel: string;
  terugNaar?: string | number;
  opTerug?: () => void;
  rechts?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="kop">
      {terugNaar !== undefined || opTerug ? (
        <button
          className="terug"
          type="button"
          aria-label="Terug"
          onClick={() => {
            if (opTerug) opTerug();
            else if (typeof terugNaar === 'number') navigate(terugNaar);
            else if (terugNaar) navigate(terugNaar);
          }}
        >
          <IcoonPijlTerug />
        </button>
      ) : (
        <Kenmerk />
      )}
      <h1>{titel}</h1>
      {rechts && <div className="rechts">{rechts}</div>}
    </header>
  );
}

export function Laden({ tekst = 'Even laden…' }: { tekst?: string }) {
  return (
    <div className="laden" role="status">
      <div className="spinner" />
      {tekst}
    </div>
  );
}

export function Fout({ tekst, opnieuw }: { tekst: string; opnieuw?: () => void }) {
  return (
    <div className="foutvak" role="alert">
      {tekst}
      {opnieuw && (
        <div style={{ marginTop: 10 }}>
          <button className="knop klein" type="button" onClick={opnieuw}>
            Opnieuw proberen
          </button>
        </div>
      )}
    </div>
  );
}

/** Teller met grote − en + knoppen (te bedienen met handschoenen). */
export function Teller({
  waarde,
  onChange,
  min = 1,
  max,
  label,
}: {
  waarde: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  const zet = (n: number) => onChange(Math.max(min, max !== undefined ? Math.min(max, n) : n));
  return (
    <div className="teller-invoer">
      <button type="button" aria-label={`${label}: één minder`} onClick={() => zet(waarde - 1)} disabled={waarde <= min}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={Number.isFinite(waarde) ? waarde : ''}
        onChange={(e) => zet(parseInt(e.target.value || String(min), 10))}
        onFocus={(e) => e.target.select()}
      />
      <button type="button" aria-label={`${label}: één meer`} onClick={() => zet(waarde + 1)} disabled={max !== undefined && waarde >= max}>
        +
      </button>
    </div>
  );
}

/** Onderblad (dialoog van onderen), sluit met Escape of tik buiten het blad. */
export function Blad({ titel, sluit, children }: { titel: string; sluit: () => void; children: ReactNode }) {
  useEffect(() => {
    const toets = (e: KeyboardEvent) => e.key === 'Escape' && sluit();
    window.addEventListener('keydown', toets);
    return () => window.removeEventListener('keydown', toets);
  }, [sluit]);
  return (
    <div className="scherm" onClick={sluit}>
      <div className="blad" role="dialog" aria-modal="true" aria-label={titel} onClick={(e) => e.stopPropagation()}>
        <h2>{titel}</h2>
        {children}
      </div>
    </div>
  );
}

export function Avatar({ naam, kleur }: { naam: string; kleur: string }) {
  return (
    <span className="av" style={{ background: kleur }} aria-hidden="true">
      {naam.charAt(0).toUpperCase()}
    </span>
  );
}
