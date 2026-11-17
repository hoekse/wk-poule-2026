import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { kortDatum } from '../lib/datum';

export interface GPunt {
  x: string; // datum of label
  y: number;
}

function useBreedte() {
  const ref = useRef<HTMLDivElement>(null);
  const [b, setB] = useState(320);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setB(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, b] as const;
}

/** Nette asverdeling: ±4 streepjes op ronde waarden. */
function ticks(min: number, max: number, aantal = 4): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const ruw = (max - min) / aantal;
  const mag = 10 ** Math.floor(Math.log10(ruw));
  const stap = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= ruw) ?? ruw;
  const uit: number[] = [];
  for (let v = Math.floor(min / stap) * stap; v <= max + stap * 0.001; v += stap) uit.push(Math.round(v * 1000) / 1000);
  if (uit[uit.length - 1] < max) uit.push(uit[uit.length - 1] + stap);
  return uit;
}

const fmt = (n: number, dec = 1) => n.toLocaleString('nl-NL', { maximumFractionDigits: dec });

export function LijnGrafiek({
  punten,
  eenheid = '',
  doel,
  doelLabel,
  hoogte = 180,
  decimalen = 1,
  vanafNul = false,
  label,
}: {
  punten: GPunt[];
  eenheid?: string;
  doel?: number;
  doelLabel?: string;
  hoogte?: number;
  decimalen?: number;
  vanafNul?: boolean;
  label: string;
}) {
  const [ref, breedte] = useBreedte();
  const [actief, setActief] = useState<number | null>(null);
  if (!punten.length) return <div className="leeg">Nog geen gegevens.</div>;

  const links = 40;
  const rechts = 12;
  const boven = 12;
  const onder = 24;
  const ys = punten.map((p) => p.y).concat(doel != null ? [doel] : []);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  const marge = (max - min) * 0.12 || Math.abs(max) * 0.05 || 1;
  min = vanafNul ? 0 : min - marge;
  max = max + marge;
  const t = ticks(min, max);
  const yMin = vanafNul ? 0 : t[0];
  const yMax = t[t.length - 1];
  const bw = breedte - links - rechts;
  const bh = hoogte - boven - onder;
  const xPos = (i: number) => links + (punten.length === 1 ? bw / 2 : (i / (punten.length - 1)) * bw);
  const yPos = (v: number) => boven + bh - ((v - yMin) / (yMax - yMin || 1)) * bh;
  const pad = punten.map((p, i) => `${i ? 'L' : 'M'}${xPos(i).toFixed(1)},${yPos(p.y).toFixed(1)}`).join('');
  const vlak = `${pad}L${xPos(punten.length - 1).toFixed(1)},${boven + bh}L${xPos(0).toFixed(1)},${boven + bh}Z`;
  const labelIdx = punten.length <= 2 ? punten.map((_, i) => i) : [0, Math.floor((punten.length - 1) / 2), punten.length - 1];
  const isDatum = /^\d{4}-\d{2}-\d{2}$/.test(punten[0].x);
  const xTekst = (x: string) => (isDatum ? kortDatum(x) : x);

  const kies = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * breedte;
    let beste = 0;
    punten.forEach((_, i) => {
      if (Math.abs(xPos(i) - x) < Math.abs(xPos(beste) - x)) beste = i;
    });
    setActief(beste);
  };

  const laatste = punten.length - 1;
  return (
    <div className="grafiek" ref={ref}>
      <svg
        viewBox={`0 0 ${breedte} ${hoogte}`}
        height={hoogte}
        role="img"
        aria-label={`${label}: ${punten.length} metingen, laatste ${fmt(punten[laatste].y, decimalen)} ${eenheid}`}
        onPointerDown={kies}
        onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && kies(e)}
        onPointerLeave={() => setActief(null)}
      >
        {t.map((v) => (
          <g key={v}>
            <line className="raster" x1={links} x2={breedte - rechts} y1={yPos(v)} y2={yPos(v)} />
            <text className="as" x={links - 6} y={yPos(v) + 4} textAnchor="end">
              {fmt(v, 1)}
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} className="as" x={xPos(i)} y={hoogte - 6} textAnchor={i === 0 && punten.length > 1 ? 'start' : i === laatste && punten.length > 1 ? 'end' : 'middle'}>
            {xTekst(punten[i].x)}
          </text>
        ))}
        {doel != null && (
          <g>
            <line className="doel" x1={links} x2={breedte - rechts} y1={yPos(doel)} y2={yPos(doel)} />
          </g>
        )}
        {punten.length > 1 && <path className="vlakvulling" d={vlak} />}
        <path className="lijn" d={pad} />
        {punten.length <= 20 && punten.map((p, i) => <circle key={i} className="punt" cx={xPos(i)} cy={yPos(p.y)} r={3.5} />)}
        <circle className="punt" cx={xPos(laatste)} cy={yPos(punten[laatste].y)} r={5} />
        {actief != null && (
          <g>
            <line className="kruis" x1={xPos(actief)} x2={xPos(actief)} y1={boven} y2={boven + bh} />
            <circle className="punt" cx={xPos(actief)} cy={yPos(punten[actief].y)} r={6} />
          </g>
        )}
      </svg>
      {doel != null && doelLabel && (
        <div className="doellegenda">
          <i aria-hidden="true" /> {doelLabel}
        </div>
      )}
      {actief != null && (
        <div className="tip" style={{ left: `${Math.min(Math.max((xPos(actief) / breedte) * 100, 14), 86)}%` }}>
          {fmt(punten[actief].y, decimalen)} {eenheid}
          <small>{xTekst(punten[actief].x)}</small>
        </div>
      )}
    </div>
  );
}

export function StaafGrafiek({
  punten,
  eenheid = '',
  doel,
  doelLabel,
  hoogte = 160,
  decimalen = 1,
  label,
  kleur,
}: {
  punten: GPunt[];
  eenheid?: string;
  doel?: number;
  doelLabel?: string;
  hoogte?: number;
  decimalen?: number;
  label: string;
  kleur?: (y: number) => string | undefined;
}) {
  const [ref, breedte] = useBreedte();
  const [actief, setActief] = useState<number | null>(null);
  if (!punten.length) return <div className="leeg">Nog geen gegevens.</div>;
  const links = 32;
  const rechts = 8;
  const boven = 12;
  const onder = 24;
  const max = Math.max(...punten.map((p) => p.y), doel ?? 0) * 1.1 || 1;
  const t = ticks(0, max, 3);
  const yMax = t[t.length - 1];
  const bw = breedte - links - rechts;
  const bh = hoogte - boven - onder;
  const kolom = bw / punten.length;
  const staaf = Math.max(4, Math.min(28, kolom - 4));
  const yPos = (v: number) => boven + bh - (v / yMax) * bh;
  const isDatum = /^\d{4}-\d{2}-\d{2}$/.test(punten[0].x);
  const xTekst = (x: string) => (isDatum ? kortDatum(x) : x);
  const elke = Math.ceil(punten.length / Math.max(2, Math.floor(bw / 52)));

  return (
    <div className="grafiek" ref={ref}>
      <svg viewBox={`0 0 ${breedte} ${hoogte}`} height={hoogte} role="img" aria-label={label} onPointerLeave={() => setActief(null)}>
        {t.map((v) => (
          <g key={v}>
            <line className="raster" x1={links} x2={breedte - rechts} y1={yPos(v)} y2={yPos(v)} />
            <text className="as" x={links - 6} y={yPos(v) + 4} textAnchor="end">
              {fmt(v, 1)}
            </text>
          </g>
        ))}
        {punten.map((p, i) => {
          const x = links + i * kolom + (kolom - staaf) / 2;
          const h = Math.max(p.y > 0 ? 2 : 0, (p.y / yMax) * bh);
          const r = Math.min(4, staaf / 2, h);
          const y0 = boven + bh;
          const d = h <= 0 ? '' : `M${x},${y0}V${y0 - h + r}Q${x},${y0 - h} ${x + r},${y0 - h}H${x + staaf - r}Q${x + staaf},${y0 - h} ${x + staaf},${y0 - h + r}V${y0}Z`;
          return (
            <g key={i}>
              {d && <path className="staaf" d={d} style={{ fill: kleur?.(p.y), opacity: actief == null || actief === i ? 1 : 0.55 }} />}
              <rect x={links + i * kolom} y={boven} width={kolom} height={bh} fill="transparent" onPointerEnter={() => setActief(i)} onPointerDown={() => setActief(i)} />
              {i % elke === 0 && (
                <text className="as" x={links + i * kolom + kolom / 2} y={hoogte - 6} textAnchor="middle">
                  {xTekst(p.x)}
                </text>
              )}
            </g>
          );
        })}
        {doel != null && (
          <g pointerEvents="none">
            <line className="doel" x1={links} x2={breedte - rechts} y1={yPos(doel)} y2={yPos(doel)} />
          </g>
        )}
      </svg>
      {doel != null && doelLabel && (
        <div className="doellegenda">
          <i aria-hidden="true" /> {doelLabel}
        </div>
      )}
      {actief != null && (
        <div className="tip" style={{ left: `${Math.min(Math.max(((links + actief * kolom + kolom / 2) / breedte) * 100, 14), 86)}%` }}>
          {fmt(punten[actief].y, decimalen)} {eenheid}
          <small>{xTekst(punten[actief].x)}</small>
        </div>
      )}
    </div>
  );
}
