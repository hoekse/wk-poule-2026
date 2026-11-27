// Kleurrekenwerk: sRGB ⇄ lineair licht ⇄ CIELAB, kleurverschil (ΔE2000) en gewone kleurnamen.

export type Lab = [number, number, number];
export type Rgb = [number, number, number];

/** sRGB-waarde 0–255 → lineair licht 0–1 (tabel, want dit gebeurt per pixel). */
export const naarLineair = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  naarLineair[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Lineair licht 0–1 → sRGB 0–255 via een fijne tabel (snel genoeg voor elke pixel). */
const STAPPEN = 8192;
const terugTabel = new Uint8Array(STAPPEN + 1);
for (let i = 0; i <= STAPPEN; i++) {
  const v = i / STAPPEN;
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  terugTabel[i] = Math.max(0, Math.min(255, Math.round(c * 255)));
}
export function naarSrgb8(v: number): number {
  if (!(v > 0)) return 0;
  if (v >= 1) return 255;
  return terugTabel[(v * STAPPEN + 0.5) | 0];
}

const XN = 0.95047;
const ZN = 1.08883;
const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
const fInv = (t: number) => (t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787);

export function lineairNaarLab(r: number, g: number, b: number): Lab {
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / XN;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / ZN;
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labNaarLineair([L, a, b]: Lab): Rgb {
  const fy = (L + 16) / 116;
  const x = fInv(fy + a / 500) * XN;
  const y = fInv(fy);
  const z = fInv(fy - b / 200) * ZN;
  const r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const g = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
  return [Math.max(0, r), Math.max(0, g), Math.max(0, bl)];
}

export function hexNaarRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

export function rgbNaarHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function hexNaarLineair(hex: string): Rgb {
  const [r, g, b] = hexNaarRgb(hex);
  return [naarLineair[r], naarLineair[g], naarLineair[b]];
}

export function hexNaarLab(hex: string): Lab {
  const [r, g, b] = hexNaarLineair(hex);
  return lineairNaarLab(r, g, b);
}

export function labNaarHex(lab: Lab): string {
  const [r, g, b] = labNaarLineair(lab);
  return rgbNaarHex([naarSrgb8(r), naarSrgb8(g), naarSrgb8(b)]);
}

export function isGeldigeHex(hex: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim());
}

export function normaliseerHex(hex: string): string {
  const h = hex.trim().replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return ('#' + v).toUpperCase();
}

/** Lichte achtergrond? Dan donkere tekst erop. */
export function isLicht(hex: string): boolean {
  return hexNaarLab(hex)[0] > 62;
}

/** Kleurverschil volgens CIEDE2000 (ongeveer: < 2 nauwelijks zichtbaar, > 10 duidelijk anders). */
export function deltaE2000([L1, a1, b1]: Lab, [L2, a2, b2]: Lab): number {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = C1p === 0 ? 0 : (Math.atan2(b1, a1p) / rad + 360) % 360;
  const h2p = C2p === 0 ? 0 : (Math.atan2(b2, a2p) / rad + 360) % 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lpm = (L1 + L2) / 2;
  const Cpm = (C1p + C2p) / 2;
  let hpm = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hpm = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
    else hpm = (h1p + h2p) / 2;
  }
  const T =
    1 -
    0.17 * Math.cos((hpm - 30) * rad) +
    0.24 * Math.cos(2 * hpm * rad) +
    0.32 * Math.cos((3 * hpm + 6) * rad) -
    0.2 * Math.cos((4 * hpm - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hpm - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lpm - 50) ** 2) / Math.sqrt(20 + (Lpm - 50) ** 2);
  const Sc = 1 + 0.045 * Cpm;
  const Sh = 1 + 0.015 * Cpm * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

/** Gewone Nederlandse kleurnaam ("wit", "antraciet", "roodbruin" …) voor een gevonden kleurvlak. */
export function kleurNaam([L, a, b]: Lab): string {
  const C = Math.hypot(a, b);
  const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;

  if (C < 7 || (C < 11 && L > 80)) {
    if (L >= 88) return b > 3 ? 'Gebroken wit' : 'Wit';
    if (L >= 74) return b > 4 ? 'Gebroken wit' : 'Lichtgrijs';
    if (L >= 50) return 'Grijs';
    if (L >= 28) return 'Donkergrijs';
    if (L >= 14) return 'Antraciet';
    return 'Zwart';
  }

  const grauw = C < 18;
  if (h < 22 || h >= 345) return L > 65 ? 'Roze' : L < 32 ? 'Bordeaux' : 'Rood';
  if (h < 48) {
    if (L < 32) return grauw ? 'Donkerbruin' : 'Roodbruin';
    if (L < 55) return grauw ? 'Bruin' : 'Roodbruin';
    return grauw ? 'Oudroze' : L > 70 ? 'Zalm' : 'Terracotta';
  }
  if (h < 75) {
    if (L < 40) return 'Bruin';
    if (L < 58) return grauw ? 'Taupe' : 'Lichtbruin';
    return grauw ? (L > 80 ? 'Crème' : 'Beige') : 'Oranje';
  }
  if (h < 105) {
    if (L < 40) return grauw ? 'Olijfbruin' : 'Bruin';
    if (L > 78) return grauw ? 'Crème' : 'Geel';
    return grauw ? 'Zand' : C > 45 ? 'Geel' : 'Oker';
  }
  if (h < 140) return L < 40 ? 'Olijfgroen' : grauw ? 'Grijsgroen' : 'Geelgroen';
  if (h < 200) return L < 35 ? 'Donkergroen' : grauw ? 'Grijsgroen' : L > 70 ? 'Lichtgroen' : 'Groen';
  if (h < 240) return L < 35 ? 'Petrol' : grauw ? 'Grijsblauw' : 'Turkoois';
  if (h < 305) return L < 32 ? 'Donkerblauw' : grauw ? 'Grijsblauw' : L > 68 ? 'Lichtblauw' : 'Blauw';
  return L > 65 ? 'Lila' : 'Paars';
}
