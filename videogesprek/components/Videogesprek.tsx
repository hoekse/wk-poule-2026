'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Gesprek, type Clips, type Staat } from '@/lib/client/gesprek';
import { IcoonBellen, IcoonMicrofoon, IcoonMicrofoonUit, IcoonOphangen } from './iconen';

type Props = { naam: string; foto: string; clips: Clips; spraakApi: boolean };

const VERBERG_KNOPPEN_MS = 5000;

function tijd(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Timer({ sinds }: { sinds: number }) {
  const [nu, setNu] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNu(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular-nums">{tijd(nu - sinds)}</span>;
}

export default function Videogesprek({ naam, foto, clips, spraakApi }: Props) {
  const idleRef = useRef<HTMLVideoElement>(null);
  const antwoordRef = useRef<HTMLVideoElement>(null);
  const eigenRef = useRef<HTMLVideoElement>(null);
  const gesprekRef = useRef<Gesprek | null>(null);
  const [staat, setStaat] = useState<Staat | null>(null);
  const [debug, setDebug] = useState(false);
  const [knoppen, setKnoppen] = useState(true);
  const verbergTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const metDebug = new URLSearchParams(window.location.search).has('debug');
    setDebug(metDebug);
    const gesprek = new Gesprek(
      clips,
      spraakApi,
      { idle: idleRef.current!, antwoord: antwoordRef.current!, eigen: eigenRef.current! },
      setStaat,
      metDebug,
    );
    gesprekRef.current = gesprek;
    setStaat(gesprek.staat);
    const zichtbaarheid = () => void gesprek.zichtbaarheid();
    document.addEventListener('visibilitychange', zichtbaarheid);
    return () => {
      document.removeEventListener('visibilitychange', zichtbaarheid);
      gesprek.sluit();
    };
  }, [clips, spraakApi]);

  const toonKnoppen = useCallback(() => {
    setKnoppen(true);
    clearTimeout(verbergTimer.current);
    verbergTimer.current = setTimeout(() => setKnoppen(false), VERBERG_KNOPPEN_MS);
  }, []);

  const fase = staat?.fase ?? 'klaar';
  const inGesprek = fase === 'gesprek';

  useEffect(() => {
    if (inGesprek) toonKnoppen();
    return () => clearTimeout(verbergTimer.current);
  }, [inGesprek, toonKnoppen]);

  const tikOpBeeld = () => {
    if (!inGesprek) return;
    if (knoppen) {
      clearTimeout(verbergTimer.current);
      setKnoppen(false);
    } else toonKnoppen();
  };

  // Eigen camerabeeld: tijdens het bellen schermvullend, tijdens het gesprek klein rechtsboven.
  const eigenZichtbaar = Boolean(staat?.eigenBeeld) && (fase === 'bellen' || inGesprek);
  const klein = inGesprek;

  const statusTekst =
    fase === 'bellen' ? 'Bellen…' : fase === 'opgehangen' ? `Gesprek beëindigd · ${tijd(staat?.duur ?? 0)}` : 'Videogesprek';

  return (
    <main className="fixed inset-0 overflow-hidden bg-black" onClick={tikOpBeeld}>
      {/* Beeld: foto als ondergrond, daarboven de luisterlus en de antwoordclip. */}
      <div className="absolute inset-0">
        <img src={foto} alt="" className="laag" draggable={false} />
        <video ref={idleRef} className="laag" playsInline muted loop preload="auto" />
        <video ref={antwoordRef} className="laag crossfade" style={{ opacity: 0 }} playsInline preload="auto" />
      </div>

      {/* Knoppen tijdens het gesprek */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          inGesprek && knoppen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
        <div
          className="absolute inset-x-0 flex flex-col items-center text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]"
          style={{ top: 'calc(env(safe-area-inset-top) + 14px)' }}
        >
          <span className="text-lg font-medium">{naam}</span>
          <span className="text-sm text-white/85">{staat?.gestartOp ? <Timer sinds={staat.gestartOp} /> : null}</span>
        </div>
        <div
          className={`absolute inset-x-0 flex justify-center gap-16 ${inGesprek && knoppen ? 'pointer-events-auto' : ''}`}
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 36px)' }}
        >
          <button
            type="button"
            aria-label={staat?.gedempt ? 'Microfoon aan' : 'Microfoon dempen'}
            onClick={(e) => {
              e.stopPropagation();
              gesprekRef.current?.wisselDempen();
              toonKnoppen();
            }}
            className={`flex h-[68px] w-[68px] items-center justify-center rounded-full backdrop-blur-md active:scale-95 ${
              staat?.gedempt ? 'bg-white text-black' : 'bg-white/25 text-white'
            }`}
          >
            {staat?.gedempt ? <IcoonMicrofoonUit className="h-8 w-8" /> : <IcoonMicrofoon className="h-8 w-8" />}
          </button>
          <button
            type="button"
            aria-label="Ophangen"
            onClick={(e) => {
              e.stopPropagation();
              gesprekRef.current?.hangOp();
            }}
            className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#ff3b30] text-white active:scale-95"
          >
            <IcoonOphangen className="h-9 w-9" />
          </button>
        </div>
      </div>

      {/* Eigen camerabeeld, gespiegeld zoals bij een videogesprek */}
      <video
        ref={eigenRef}
        playsInline
        muted
        autoPlay
        aria-hidden
        className="absolute object-cover transition-all duration-500 ease-out"
        style={{
          transform: 'scaleX(-1)',
          opacity: eigenZichtbaar ? 1 : 0,
          top: klein ? 'calc(env(safe-area-inset-top) + 12px)' : 0,
          right: klein ? 12 : 0,
          width: klein ? 104 : '100%',
          height: klein ? 156 : '100%',
          borderRadius: klein ? 16 : 0,
          boxShadow: klein ? '0 4px 18px rgba(0,0,0,0.45)' : 'none',
        }}
      />

      {/* Belscherm: voor, tijdens en na het bellen */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-between transition-opacity duration-500 ${
          inGesprek ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {fase === 'bellen' && staat?.eigenBeeld ? (
          // Tijdens het bellen zie je jezelf, iets gedimd.
          <div className="absolute inset-0 bg-black/35" />
        ) : (
          <>
            <img src={foto} alt="" className="laag scale-110 blur-2xl" draggable={false} />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}

        <div className="relative flex flex-col items-center px-8" style={{ marginTop: 'calc(env(safe-area-inset-top) + 14vh)' }}>
          <img
            src={foto}
            alt={naam}
            className="h-36 w-36 rounded-full object-cover shadow-2xl ring-1 ring-white/10"
            draggable={false}
          />
          <h1 className="mt-6 text-4xl font-light tracking-tight text-white">{naam}</h1>
          <p className={`mt-2 text-base text-white/70 ${fase === 'bellen' ? 'animate-pulse' : ''}`}>{statusTekst}</p>
          {staat?.melding && <p className="mt-6 max-w-xs text-center text-sm text-amber-200">{staat.melding}</p>}
        </div>

        <div className="relative flex flex-col items-center" style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 56px)' }}>
          {fase === 'bellen' ? (
            <button
              type="button"
              aria-label="Annuleren"
              onClick={(e) => {
                e.stopPropagation();
                gesprekRef.current?.hangOp();
              }}
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#ff3b30] text-white active:scale-95"
            >
              <IcoonOphangen className="h-10 w-10" />
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Bel ${naam}`}
              disabled={!staat || fase === 'opgehangen'}
              onClick={(e) => {
                e.stopPropagation();
                gesprekRef.current?.bel();
              }}
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#34c759] text-white transition-opacity active:scale-95 disabled:opacity-40"
            >
              <IcoonBellen className="h-9 w-9" />
            </button>
          )}
          <span className="mt-2 text-sm text-white/80">{fase === 'bellen' ? 'Annuleer' : 'Bel'}</span>
        </div>
      </div>

      {debug && staat && (
        <div className="pointer-events-none absolute left-2 top-[calc(env(safe-area-inset-top)+64px)] z-50 max-w-[90vw] rounded bg-black/70 p-2 font-mono text-[11px] leading-snug text-lime-300">
          <div>
            fase {staat.fase} · status {staat.status} · modus {staat.modus ?? '-'}
          </div>
          {staat.niveau && (
            <div>
              niveau {staat.niveau.niveau.toFixed(4)} · drempel {staat.niveau.drempel.toFixed(4)}
              {staat.niveau.spreekt ? ' · SPRAAK' : ''}
            </div>
          )}
          {staat.laatste && (
            <>
              <div>tekst “{staat.laatste.tekst}”</div>
              <div>
                {staat.laatste.soort}
                {'id' in staat.laatste ? ` ${staat.laatste.id}` : ''}
                {'zekerheid' in staat.laatste ? ` · zekerheid ${staat.laatste.zekerheid.toFixed(2)}` : ''} · {staat.laatste.bron}{' '}
                · {staat.laatste.ms} ms
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
