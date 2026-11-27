// Fotovenster: inzoomen met twee vingers (of scrollwiel), tikken en schilderen met één vinger,
// en een schuif om voor en na te vergelijken.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Weergave } from './weergave';

export type Gereedschap = 'vlak' | 'vlak-eraf' | 'penseel' | 'gum' | 'schuiven' | 'pipet';

type Props = {
  weergave: Weergave;
  gereedschap: Gereedschap;
  vergelijken: boolean;
  toonSelectie: boolean;
  onTik: (x: number, y: number) => void;
  onStreepBegin: (x: number, y: number) => void;
  onStreep: (x0: number, y0: number, x1: number, y1: number) => void;
  onStreepEind: () => void;
  onStreepAnnuleer: () => void;
  /** Hoeveel fotopixels er in één schermpunt passen (voor de dikte van de selectierand). */
  onSchaal: (fotoPixelsPerPunt: number) => void;
  /** Teller: bij elke wijziging wordt de zoom teruggezet naar passend. */
  passend: number;
};

const MAX_ZOOM = 10;

export function FotoVenster(p: Props) {
  const venster = useRef<HTMLDivElement>(null);
  const laagNa = useRef<HTMLDivElement>(null);
  const laagVoor = useRef<HTMLDivElement>(null);
  const voorKader = useRef<HTMLDivElement>(null);
  const greep = useRef<HTMLDivElement>(null);
  const props = useRef(p);
  props.current = p;
  const [hoogte, setHoogte] = useState(320);

  // Zoomtoestand buiten React (60 keer per seconde bijwerken zonder opnieuw te tekenen).
  const z = useRef({ basisB: 1, basisH: 1, ox: 0, oy: 0, zoom: 1, tx: 0, ty: 0, vw: 1, vh: 1, split: 0.5 });

  // Canvassen in de lagen hangen.
  useLayoutEffect(() => {
    const { voor, na, selectie } = p.weergave;
    for (const c of [voor, na, selectie]) c.className = 'fv-canvas';
    selectie.classList.add('fv-selectie');
    laagNa.current!.replaceChildren(na, selectie);
    laagVoor.current!.replaceChildren(voor);
  }, [p.weergave]);

  useEffect(() => {
    p.weergave.selectie.style.display = p.toonSelectie ? '' : 'none';
  }, [p.toonSelectie, p.weergave]);

  // Vensterhoogte: zo hoog als de foto bij volle breedte, maar hooguit 58% van het scherm.
  useLayoutEffect(() => {
    const meet = () => {
      const v = venster.current;
      if (!v) return;
      const b = v.clientWidth;
      const verhouding = p.weergave.wb.hoogte / p.weergave.wb.breedte;
      setHoogte(Math.round(Math.min(b * verhouding, window.innerHeight * 0.58, 900)));
    };
    meet();
    window.addEventListener('resize', meet);
    return () => window.removeEventListener('resize', meet);
  }, [p.weergave]);

  const pasToe = () => {
    const s = z.current;
    const t = `translate(${s.tx}px, ${s.ty}px) scale(${s.zoom})`;
    for (const l of [laagNa.current, laagVoor.current]) {
      if (!l) continue;
      l.style.left = `${s.ox}px`;
      l.style.top = `${s.oy}px`;
      l.style.width = `${s.basisB}px`;
      l.style.height = `${s.basisH}px`;
      l.style.transform = t;
    }
    if (voorKader.current) voorKader.current.style.clipPath = `inset(0 ${(1 - s.split) * 100}% 0 0)`;
    if (greep.current) greep.current.style.left = `${s.split * 100}%`;
  };

  const begrens = () => {
    const s = z.current;
    s.zoom = Math.max(1, Math.min(MAX_ZOOM, s.zoom));
    const bw = s.basisB * s.zoom;
    const bh = s.basisH * s.zoom;
    const links = bw <= s.vw ? (s.vw - bw) / 2 : Math.min(0, Math.max(s.vw - bw, s.ox + s.tx));
    const boven = bh <= s.vh ? (s.vh - bh) / 2 : Math.min(0, Math.max(s.vh - bh, s.oy + s.ty));
    s.tx = links - s.ox;
    s.ty = boven - s.oy;
  };

  const meldSchaal = () => {
    const s = z.current;
    props.current.onSchaal(p.weergave.wb.breedte / (s.basisB * s.zoom));
  };

  // Passend maken bij nieuwe foto, nieuwe vensterhoogte of op verzoek.
  useLayoutEffect(() => {
    const v = venster.current;
    if (!v) return;
    const s = z.current;
    s.vw = v.clientWidth;
    s.vh = v.clientHeight;
    const { breedte, hoogte: fh } = p.weergave.wb;
    const f = Math.min(s.vw / breedte, s.vh / fh);
    s.basisB = breedte * f;
    s.basisH = fh * f;
    s.ox = (s.vw - s.basisB) / 2;
    s.oy = (s.vh - s.basisH) / 2;
    s.zoom = 1;
    s.tx = 0;
    s.ty = 0;
    pasToe();
    meldSchaal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.weergave, hoogte, p.passend]);

  useEffect(pasToe, [p.vergelijken]);

  // ---------- Aanwijzers (vinger, pen, muis) ----------
  useEffect(() => {
    const v = venster.current!;
    const wijzers = new Map<number, { x: number; y: number }>();
    let modus: 'niets' | 'tik' | 'streep' | 'knijp' | 'schuif' | 'greep' = 'niets';
    let start = { x: 0, y: 0, t: 0 };
    let laatsteFoto = { x: 0, y: 0 };
    let knijp = { d: 1, mx: 0, my: 0, zoom: 1, tx: 0, ty: 0 };

    const lokaal = (e: PointerEvent) => {
      const r = v.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const fotoPunt = (cx: number, cy: number) => {
      const r = p.weergave.na.getBoundingClientRect();
      return {
        x: ((cx - r.left) / r.width) * p.weergave.wb.breedte,
        y: ((cy - r.top) / r.height) * p.weergave.wb.hoogte,
      };
    };
    const beginKnijp = () => {
      const [a, b] = [...wijzers.values()];
      const s = z.current;
      knijp = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, zoom: s.zoom, tx: s.tx, ty: s.ty };
    };

    const omlaag = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      v.setPointerCapture(e.pointerId);
      wijzers.set(e.pointerId, lokaal(e));
      if (wijzers.size === 2) {
        if (modus === 'streep') props.current.onStreepAnnuleer();
        modus = 'knijp';
        beginKnijp();
        return;
      }
      if (wijzers.size > 2) return;
      const pt = lokaal(e);
      start = { ...pt, t: Date.now() };
      if ((e.target as HTMLElement).closest('.fv-greep')) {
        modus = 'greep';
        return;
      }
      const g = props.current.gereedschap;
      if (g === 'schuiven') {
        modus = 'schuif';
        knijp = { d: 1, mx: pt.x, my: pt.y, zoom: z.current.zoom, tx: z.current.tx, ty: z.current.ty };
      } else if (g === 'penseel' || g === 'gum') {
        modus = 'streep';
        laatsteFoto = fotoPunt(e.clientX, e.clientY);
        props.current.onStreepBegin(laatsteFoto.x, laatsteFoto.y);
      } else {
        modus = 'tik';
      }
    };

    const beweeg = (e: PointerEvent) => {
      if (!wijzers.has(e.pointerId)) return;
      const pt = lokaal(e);
      wijzers.set(e.pointerId, pt);
      const s = z.current;
      if (modus === 'knijp' && wijzers.size >= 2) {
        const [a, b] = [...wijzers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const zoom = Math.max(1, Math.min(MAX_ZOOM, (knijp.zoom * d) / knijp.d));
        const ix = (knijp.mx - s.ox - knijp.tx) / knijp.zoom;
        const iy = (knijp.my - s.oy - knijp.ty) / knijp.zoom;
        s.zoom = zoom;
        s.tx = mx - s.ox - ix * zoom;
        s.ty = my - s.oy - iy * zoom;
        begrens();
        pasToe();
      } else if (modus === 'schuif') {
        s.tx = knijp.tx + (pt.x - knijp.mx);
        s.ty = knijp.ty + (pt.y - knijp.my);
        begrens();
        pasToe();
      } else if (modus === 'greep') {
        s.split = Math.max(0, Math.min(1, pt.x / s.vw));
        pasToe();
      } else if (modus === 'streep') {
        const f = fotoPunt(e.clientX, e.clientY);
        props.current.onStreep(laatsteFoto.x, laatsteFoto.y, f.x, f.y);
        laatsteFoto = f;
      } else if (modus === 'tik' && Math.hypot(pt.x - start.x, pt.y - start.y) > 12) {
        // Toch slepen: verschuiven als er ingezoomd is.
        modus = 'schuif';
        knijp = { d: 1, mx: pt.x, my: pt.y, zoom: s.zoom, tx: s.tx, ty: s.ty };
      }
    };

    const omhoog = (e: PointerEvent) => {
      if (!wijzers.has(e.pointerId)) return;
      wijzers.delete(e.pointerId);
      if (modus === 'knijp') {
        if (wijzers.size === 0) {
          modus = 'niets';
          meldSchaal();
        }
        return;
      }
      if (modus === 'tik' && e.type === 'pointerup') {
        const f = fotoPunt(e.clientX, e.clientY);
        if (f.x >= 0 && f.y >= 0 && f.x < p.weergave.wb.breedte && f.y < p.weergave.wb.hoogte) props.current.onTik(f.x, f.y);
      } else if (modus === 'streep') {
        if (e.type === 'pointerup') props.current.onStreepEind();
        else props.current.onStreepAnnuleer();
      }
      modus = 'niets';
    };

    const wiel = (e: WheelEvent) => {
      e.preventDefault();
      const s = z.current;
      const r = v.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const ix = (mx - s.ox - s.tx) / s.zoom, iy = (my - s.oy - s.ty) / s.zoom;
      s.zoom = Math.max(1, Math.min(MAX_ZOOM, s.zoom * Math.exp(-e.deltaY * 0.0015)));
      s.tx = mx - s.ox - ix * s.zoom;
      s.ty = my - s.oy - iy * s.zoom;
      begrens();
      pasToe();
      meldSchaal();
    };

    v.addEventListener('pointerdown', omlaag);
    v.addEventListener('pointermove', beweeg);
    v.addEventListener('pointerup', omhoog);
    v.addEventListener('pointercancel', omhoog);
    v.addEventListener('wheel', wiel, { passive: false });
    return () => {
      v.removeEventListener('pointerdown', omlaag);
      v.removeEventListener('pointermove', beweeg);
      v.removeEventListener('pointerup', omhoog);
      v.removeEventListener('pointercancel', omhoog);
      v.removeEventListener('wheel', wiel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.weergave]);

  const cursor = p.gereedschap === 'schuiven' ? 'grab' : p.gereedschap === 'pipet' ? 'copy' : 'crosshair';

  return (
    <div className="fv" ref={venster} style={{ height: hoogte, cursor }} data-gereedschap={p.gereedschap}>
      <div className="fv-laag" ref={laagNa} />
      <div className="fv-voor" ref={voorKader} hidden={!p.vergelijken}>
        <div className="fv-laag" ref={laagVoor} />
      </div>
      {p.vergelijken && (
        <>
          <span className="fv-plaatje links">Nu</span>
          <span className="fv-plaatje rechts">Nieuw</span>
          <div className="fv-greep" ref={greep} role="slider" aria-label="Voor en na vergelijken" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(z.current.split * 100)}>
            <span />
          </div>
        </>
      )}
    </div>
  );
}
