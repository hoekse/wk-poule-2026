import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const basis = (p: P) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
});

export const IcoonVandaag = (p: P) => (
  <svg {...basis(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const IcoonHalter = (p: P) => (
  <svg {...basis(p)}><path d="M3 12h18" /><rect x="5" y="7" width="3" height="10" rx="1" /><rect x="16" y="7" width="3" height="10" rx="1" /><path d="M2 10v4M22 10v4" /></svg>
);
export const IcoonGrafiek = (p: P) => (
  <svg {...basis(p)}><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-7" /></svg>
);
export const IcoonMaan = (p: P) => (
  <svg {...basis(p)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>
);
export const IcoonMeer = (p: P) => (
  <svg {...basis(p)}><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></svg>
);
export const IcoonPlus = (p: P) => (<svg {...basis(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const IcoonMin = (p: P) => (<svg {...basis(p)}><path d="M5 12h14" /></svg>);
export const IcoonVink = (p: P) => (<svg {...basis({ strokeWidth: 3, ...p })}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const IcoonTerug = (p: P) => (<svg {...basis(p)}><path d="m15 18-6-6 6-6" /></svg>);
export const IcoonVerder = (p: P) => (<svg {...basis(p)}><path d="m9 18 6-6-6-6" /></svg>);
export const IcoonSluit = (p: P) => (<svg {...basis(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>);
export const IcoonWissel = (p: P) => (
  <svg {...basis(p)}><path d="M17 3l4 4-4 4" /><path d="M3 7h18" /><path d="M7 21l-4-4 4-4" /><path d="M21 17H3" /></svg>
);
export const IcoonPrullenbak = (p: P) => (
  <svg {...basis(p)}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
);
export const IcoonInfo = (p: P) => (<svg {...basis(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>);
export const IcoonLet = (p: P) => (<svg {...basis(p)}><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>);
export const IcoonTimer = (p: P) => (<svg {...basis(p)}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>);
export const IcoonHart = (p: P) => (
  <svg {...basis(p)}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
);
export const IcoonMasker = (p: P) => (
  <svg {...basis(p)}><path d="M5 9c0-3 3-5 7-5s7 2 7 5v3c0 4-3 7-7 7s-7-3-7-7Z" /><path d="M9 12h6M12 19v3" /></svg>
);
export const IcoonWeegschaal = (p: P) => (
  <svg {...basis(p)}><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 9a5 5 0 0 1 8 0" /><path d="m12 9 1.5-2" /></svg>
);
export const IcoonLijst = (p: P) => (<svg {...basis(p)}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>);
export const IcoonInstellingen = (p: P) => (
  <svg {...basis(p)}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
);
export const IcoonKoppeling = (p: P) => (
  <svg {...basis(p)}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
);
export const IcoonOpslaan = (p: P) => (
  <svg {...basis(p)}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
);
export const IcoonUpload = (p: P) => (
  <svg {...basis(p)}><path d="M12 21V9M7 14l5-5 5 5" /><path d="M5 3h14" /></svg>
);
export const IcoonKlembord = (p: P) => (
  <svg {...basis(p)}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 11h6M9 15h4" /></svg>
);
export const IcoonPotlood = (p: P) => (<svg {...basis(p)}><path d="M4 20h4L19 9l-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></svg>);
export const IcoonBeker = (p: P) => (
  <svg {...basis(p)}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></svg>
);
export const IcoonGebouw = (p: P) => (
  <svg {...basis(p)}><path d="M3 21h18M5 21V8l7-5 7 5v13" /><path d="M9 21v-6h6v6" /></svg>
);
export const IcoonBoek = (p: P) => (<svg {...basis(p)}><path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4Z" /><path d="M8 8h6M8 12h6" /></svg>);
export const IcoonPuls = (p: P) => (<svg {...basis(p)}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>);
export const IcoonDruppel = (p: P) => (<svg {...basis(p)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" /></svg>);
export const IcoonGevoel = (p: P) => (<svg {...basis(p)}><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01" /></svg>);
export const IcoonStart = (p: P) => (<svg {...basis(p)}><path d="M7 4.5v15l12-7.5Z" fill="currentColor" /></svg>);
