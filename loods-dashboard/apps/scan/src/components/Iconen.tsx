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
export const IcoonPalet = (p: P) => (
  <svg {...basis} {...p}><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.3-1-1.6-1-2.8 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z" /><circle cx="7.5" cy="11" r="1.2" /><circle cx="10" cy="7" r="1.2" /><circle cx="15" cy="7" r="1.2" /></svg>
);
export const IcoonDelen = (p: P) => (
  <svg {...basis} {...p}><path d="M12 15V3" /><path d="M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
);
export const IcoonOngedaan = (p: P) => (
  <svg {...basis} {...p}><path d="M9 7H4V2" /><path d="M4.5 7A8 8 0 1 1 4 13" /></svg>
);
export const IcoonToverstaf = (p: P) => (
  <svg {...basis} {...p}><path d="M4 20L15 9" /><path d="M15 3v3M18.5 4.5l-2 2M21 9h-3M18.5 13.5l-2-2" /></svg>
);
export const IcoonToverstafMin = (p: P) => (
  <svg {...basis} {...p}><path d="M4 20L15 9" /><path d="M15.5 4.5h6" /></svg>
);
export const IcoonPenseel = (p: P) => (
  <svg {...basis} {...p}><path d="M14 4l6 6-8.5 8.5a3 3 0 0 1-4.2 0l-1.8-1.8a3 3 0 0 1 0-4.2z" /><path d="M5.5 17.5L3 21" /></svg>
);
export const IcoonGum = (p: P) => (
  <svg {...basis} {...p}><path d="M8 20h12" /><path d="M14.5 4.5l5 5L10 19H6l-2.5-2.5a1.5 1.5 0 0 1 0-2.1z" /><path d="M9 10l5 5" /></svg>
);
export const IcoonHand = (p: P) => (
  <svg {...basis} {...p}><path d="M12 3v18M3 12h18" /><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" /></svg>
);
export const IcoonVergelijk = (p: P) => (
  <svg {...basis} {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 2v20" /></svg>
);
export const IcoonOog = (p: P) => (
  <svg {...basis} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IcoonPassend = (p: P) => (
  <svg {...basis} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
);
