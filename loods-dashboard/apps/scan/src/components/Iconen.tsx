// Eenvoudige lijn-iconen (24×24), dik genoeg om in een donkere loods te zien.
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const basis = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const IcoonMee = (p: P) => (
  <svg {...basis} {...p}><path d="M4 12h12" /><path d="M12 6l6 6-6 6" /><path d="M20 4v16" /></svg>
);
export const IcoonTerug = (p: P) => (
  <svg {...basis} {...p}><path d="M20 12H8" /><path d="M12 6l-6 6 6 6" /><path d="M4 4v16" /></svg>
);
export const IcoonVerf = (p: P) => (
  <svg {...basis} {...p}><path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" /><path d="M5 7a7 3 0 0 1 14 0" /><path d="M9 12h6" /></svg>
);
export const IcoonVerbruik = (p: P) => (
  <svg {...basis} {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IcoonTas = (p: P) => (
  <svg {...basis} {...p}><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const IcoonBeheer = (p: P) => (
  <svg {...basis} {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>
);
export const IcoonPijlTerug = (p: P) => (
  <svg {...basis} {...p}><path d="M15 5l-7 7 7 7" /></svg>
);
export const IcoonVink = (p: P) => (
  <svg {...basis} strokeWidth={3} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IcoonLamp = (p: P) => (
  <svg {...basis} {...p}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" /></svg>
);
export const IcoonToetsenbord = (p: P) => (
  <svg {...basis} {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" /></svg>
);
export const IcoonCamera = (p: P) => (
  <svg {...basis} {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
);
export const IcoonZoek = (p: P) => (
  <svg {...basis} {...p}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></svg>
);
export const IcoonPlus = (p: P) => (
  <svg {...basis} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
