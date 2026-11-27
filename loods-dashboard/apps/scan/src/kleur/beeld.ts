// Beeldbewerking voor het kleurvoorbeeld. Werkt helemaal op het toestel: geen upload, geen internet nodig.
//
// - Het Werkbeeld houdt de foto bij als kleurwaarden (CIELAB) en per pixel welk onderdeel hem "bezit".
// - zoekKleurvlakken: deelt de foto automatisch op in kleurgroepen (k-means op kleur, daarna ruis eruit).
// - toverstaf / penseel: selectie bijwerken.
// - kleurIn: nieuwe kleur aanbrengen met behoud van licht en schaduw, en zachte randen.

import { deltaE2000, hexNaarLab, kleurNaam, labNaarHex, lineairNaarLab, naarLineair, naarSrgb8, type Lab, type Rgb } from './kleurruimte';
import { ralKleuren, type RalKleur } from './ral';

/** Langste zijde van het werkbeeld. Groot genoeg voor kozijnen, klein genoeg voor een telefoon. */
export const MAX_ZIJDE = 1400;
/** Eigenaar 0 = hoort bij geen enkel onderdeel (blijft zoals op de foto). */
export const GEEN = 0;
export const MAX_EIGENAAR = 250;

/**
 * Gewicht van de helderheid bij het vergelijken van kleuren: licht/schaduw telt iets minder dan kleurtoon.
 * Niet te laag: wit kozijn en lichte voeg (of wit en lichtgrijs) verschillen vooral in helderheid.
 */
const GEWICHT_L = 0.75;

export type Rechthoek = { x0: number; y0: number; x1: number; y1: number };

export class Werkbeeld {
  readonly breedte: number;
  readonly hoogte: number;
  readonly n: number;
  /** De foto zelf (RGBA, 0–255). */
  readonly origineel: Uint8ClampedArray;
  /** CIELAB per pixel (L, a, b achter elkaar). */
  readonly lab: Float32Array;
  /** Helderheid in lineair licht (0–1) per pixel. */
  readonly lum: Float32Array;
  /** Welk onderdeel bezit deze pixel (0 = geen). */
  eigenaar: Uint8Array;
  /** Telt op bij elke wijziging van `eigenaar` (voor caches). */
  versie = 0;

  constructor(beeld: ImageData) {
    this.breedte = beeld.width;
    this.hoogte = beeld.height;
    this.n = beeld.width * beeld.height;
    this.origineel = new Uint8ClampedArray(beeld.data);
    this.lab = new Float32Array(this.n * 3);
    this.lum = new Float32Array(this.n);
    this.eigenaar = new Uint8Array(this.n);
    const d = this.origineel;
    for (let i = 0, j = 0; i < this.n; i++, j += 4) {
      const r = naarLineair[d[j]];
      const g = naarLineair[d[j + 1]];
      const b = naarLineair[d[j + 2]];
      const lab = lineairNaarLab(r, g, b);
      this.lab[i * 3] = lab[0];
      this.lab[i * 3 + 1] = lab[1];
      this.lab[i * 3 + 2] = lab[2];
      this.lum[i] = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
    }
  }

  gewijzigd() {
    this.versie++;
  }

  /** Gemiddelde kleur rond een punt (alleen pixels die op het middelpunt lijken, dus ook goed vlak naast een rand). */
  kleurRond(x: number, y: number, straal = 2): Lab {
    const { breedte: b, hoogte: h, lab } = this;
    const cx = Math.max(0, Math.min(b - 1, Math.round(x)));
    const cy = Math.max(0, Math.min(h - 1, Math.round(y)));
    const c = (cy * b + cx) * 3;
    let sL = 0, sA = 0, sB = 0, t = 0;
    for (let yy = Math.max(0, cy - straal); yy <= Math.min(h - 1, cy + straal); yy++) {
      for (let xx = Math.max(0, cx - straal); xx <= Math.min(b - 1, cx + straal); xx++) {
        const k = (yy * b + xx) * 3;
        if (afstand2(lab, k, lab[c], lab[c + 1], lab[c + 2]) > 64) continue;
        sL += lab[k];
        sA += lab[k + 1];
        sB += lab[k + 2];
        t++;
      }
    }
    return [sL / t, sA / t, sB / t];
  }

  private _randen: Float32Array | null = null;

  /**
   * Hoe sterk is de rand (kleurovergang) bij elke pixel? Sobel-filter op de gewogen Lab-kleur.
   * Een egaal vlak of een zacht verloop van licht geeft ~0, de overgang kozijn → muur een hoge waarde.
   */
  randsterkte(): Float32Array {
    if (this._randen) return this._randen;
    const { breedte: b, hoogte: h, lab } = this;
    const r = new Float32Array(this.n);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < b - 1; x++) {
        const i = y * b + x;
        let som = 0;
        for (let c = 0; c < 3; c++) {
          const w = c === 0 ? GEWICHT_L : 1;
          const v = (o: number) => lab[(i + o) * 3 + c];
          const gx = v(-b + 1) + 2 * v(1) + v(b + 1) - v(-b - 1) - 2 * v(-1) - v(b - 1);
          const gy = v(b - 1) + 2 * v(b) + v(b + 1) - v(-b - 1) - 2 * v(-b) - v(-b + 1);
          som += (gx * gx + gy * gy) * w * w;
        }
        r[i] = Math.sqrt(som);
      }
    }
    this._randen = r;
    return r;
  }

  kopieEigenaar(): Uint8Array {
    return new Uint8Array(this.eigenaar);
  }

  zetEigenaar(e: Uint8Array) {
    this.eigenaar.set(e);
    this.gewijzigd();
  }
}

/** Gewogen kleurafstand in het kwadraat tussen pixel k en een kleur. */
function afstand2(lab: Float32Array, k: number, L: number, a: number, b: number): number {
  const dL = (lab[k] - L) * GEWICHT_L;
  const da = lab[k + 1] - a;
  const db = lab[k + 2] - b;
  return dL * dL + da * da + db * db;
}

/** Kleine voorspelbare toevalsgenerator: dezelfde foto geeft altijd dezelfde kleurvlakken. */
function toeval(zaad: number) {
  let s = zaad >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Automatisch kleurvlakken zoeken
// ---------------------------------------------------------------------------

export type Kleurgroep = {
  /** Eigenaarnummer in het werkbeeld. */
  id: number;
  lab: Lab;
  hex: string;
  naam: string;
  /** Deel van de foto, 0–1. */
  aandeel: number;
};

/**
 * Deelt de foto op in kleurgroepen en zet die als eigenaar in het werkbeeld (1 = grootste groep).
 * Werkwijze: k-means op (gewogen) Lab-kleur met een steekproef, dichtbij elkaar liggende groepen samenvoegen,
 * alle pixels indelen, losse spikkels en randjes van 1 pixel wegpoetsen, piepkleine groepen opheffen.
 */
export function zoekKleurvlakken(wb: Werkbeeld, opties: { maxGroepen?: number; samenvoegAfstand?: number; minAandeel?: number } = {}): Kleurgroep[] {
  const K0 = opties.maxGroepen ?? 12;
  const samenvoeg = opties.samenvoegAfstand ?? 9;
  const minAandeel = opties.minAandeel ?? 0.004;
  const { n, lab, breedte: b, hoogte: h } = wb;
  const rnd = toeval(n * 31 + b);

  // 1. Steekproef (gewogen kenmerken: L·w, a, b).
  const maxS = 30000;
  const stap = Math.max(1, Math.floor(n / maxS));
  const m = Math.floor(n / stap);
  const S = new Float32Array(m * 3);
  for (let s = 0; s < m; s++) {
    const i = Math.min(n - 1, s * stap + Math.floor(rnd() * stap));
    S[s * 3] = lab[i * 3] * GEWICHT_L;
    S[s * 3 + 1] = lab[i * 3 + 1];
    S[s * 3 + 2] = lab[i * 3 + 2];
  }

  // 2. k-means++ beginpunten.
  const K = Math.min(K0, m);
  const C = new Float32Array(K * 3);
  const dMin = new Float32Array(m).fill(Infinity);
  let eerste = Math.floor(rnd() * m);
  C.set(S.subarray(eerste * 3, eerste * 3 + 3), 0);
  for (let k = 1; k < K; k++) {
    let som = 0;
    for (let s = 0; s < m; s++) {
      const d = d2(S, s * 3, C, (k - 1) * 3);
      if (d < dMin[s]) dMin[s] = d;
      som += dMin[s];
    }
    let r = rnd() * som;
    eerste = m - 1;
    for (let s = 0; s < m; s++) {
      r -= dMin[s];
      if (r <= 0) {
        eerste = s;
        break;
      }
    }
    C.set(S.subarray(eerste * 3, eerste * 3 + 3), k * 3);
  }

  // 3. Lloyd-iteraties op de steekproef.
  const toewijzing = new Uint8Array(m);
  const som = new Float64Array(K * 3);
  const aantal = new Float64Array(K);
  for (let it = 0; it < 14; it++) {
    som.fill(0);
    aantal.fill(0);
    for (let s = 0; s < m; s++) {
      const k = dichtstbij(S, s * 3, C, K);
      toewijzing[s] = k;
      som[k * 3] += S[s * 3];
      som[k * 3 + 1] += S[s * 3 + 1];
      som[k * 3 + 2] += S[s * 3 + 2];
      aantal[k]++;
    }
    for (let k = 0; k < K; k++) {
      if (aantal[k] === 0) continue;
      C[k * 3] = som[k * 3] / aantal[k];
      C[k * 3 + 1] = som[k * 3 + 1] / aantal[k];
      C[k * 3 + 2] = som[k * 3 + 2] / aantal[k];
    }
  }

  // 4. Groepen die bijna dezelfde kleur hebben samenvoegen.
  let groepen: { c: [number, number, number]; w: number }[] = [];
  for (let k = 0; k < K; k++) if (aantal[k] > 0) groepen.push({ c: [C[k * 3], C[k * 3 + 1], C[k * 3 + 2]], w: aantal[k] });
  for (;;) {
    let beste = Infinity, bi = -1, bj = -1;
    for (let i = 0; i < groepen.length; i++) {
      for (let j = i + 1; j < groepen.length; j++) {
        const a = groepen[i].c, c = groepen[j].c;
        const d = Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]);
        if (d < beste) [beste, bi, bj] = [d, i, j];
      }
    }
    if (bi < 0 || beste >= samenvoeg) break;
    const A = groepen[bi], B = groepen[bj];
    const w = A.w + B.w;
    A.c = [(A.c[0] * A.w + B.c[0] * B.w) / w, (A.c[1] * A.w + B.c[1] * B.w) / w, (A.c[2] * A.w + B.c[2] * B.w) / w];
    A.w = w;
    groepen.splice(bj, 1);
  }

  // 5. Alle pixels indelen; daarna ruis eruit; dan te kleine groepen opheffen en opnieuw indelen.
  let labels: Uint8Array<ArrayBuffer> = new Uint8Array(n);
  for (let ronde = 0; ; ronde++) {
    const G = groepen.length;
    const CG = new Float32Array(G * 3);
    groepen.forEach((g, k) => CG.set(g.c, k * 3));
    for (let i = 0; i < n; i++) {
      const L = lab[i * 3] * GEWICHT_L, a = lab[i * 3 + 1], bb = lab[i * 3 + 2];
      let best = 0, bd = Infinity;
      for (let k = 0; k < G; k++) {
        const dl = L - CG[k * 3], da = a - CG[k * 3 + 1], db = bb - CG[k * 3 + 2];
        const d = dl * dl + da * da + db * db;
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      labels[i] = best + 1;
    }
    labels = meerderheidsfilter(labels, b, h);
    labels = meerderheidsfilter(labels, b, h);
    if (ronde === 2) break;

    const tel = new Float64Array(G + 1);
    for (let i = 0; i < n; i++) tel[labels[i]]++;
    const blijven = groepen.filter((_, k) => tel[k + 1] / n >= minAandeel);
    if (blijven.length === groepen.length || blijven.length === 0) break;
    groepen = blijven;
  }

  // 6. Statistiek per groep, sorteren op grootte, nummeren vanaf 1.
  const G = groepen.length;
  const tel = new Float64Array(G + 1);
  const sL = new Float64Array(G + 1), sA = new Float64Array(G + 1), sB = new Float64Array(G + 1);
  for (let i = 0; i < n; i++) {
    const k = labels[i];
    tel[k]++;
    sL[k] += lab[i * 3];
    sA[k] += lab[i * 3 + 1];
    sB[k] += lab[i * 3 + 2];
  }
  const volgorde = Array.from({ length: G }, (_, k) => k + 1)
    .filter((k) => tel[k] > 0)
    .sort((p, q) => tel[q] - tel[p]);
  const nieuwNummer = new Uint8Array(G + 1);
  volgorde.forEach((k, idx) => (nieuwNummer[k] = idx + 1));
  for (let i = 0; i < n; i++) wb.eigenaar[i] = nieuwNummer[labels[i]];
  wb.gewijzigd();

  return volgorde.map((k, idx) => {
    const kleur: Lab = [sL[k] / tel[k], sA[k] / tel[k], sB[k] / tel[k]];
    return { id: idx + 1, lab: kleur, hex: labNaarHex(kleur), naam: kleurNaam(kleur), aandeel: tel[k] / n };
  });
}

function d2(A: Float32Array, i: number, B: Float32Array, j: number) {
  const x = A[i] - B[j], y = A[i + 1] - B[j + 1], z = A[i + 2] - B[j + 2];
  return x * x + y * y + z * z;
}

function dichtstbij(S: Float32Array, i: number, C: Float32Array, K: number) {
  let best = 0, bd = Infinity;
  for (let k = 0; k < K; k++) {
    const d = d2(S, i, C, k * 3);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best;
}

/**
 * Elke pixel krijgt het label dat het vaakst bij zijn 8 buren voorkomt (bij gelijkspel blijft hij zoals hij is).
 * Haalt losse spikkels en randjes van één pixel breed weg; vlakken van 2 pixels en breder blijven staan.
 */
function meerderheidsfilter(L: Uint8Array, b: number, h: number): Uint8Array<ArrayBuffer> {
  const uit = new Uint8Array(L);
  const tel = new Uint8Array(256);
  const buren = [-b - 1, -b, -b + 1, -1, 1, b - 1, b, b + 1];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < b - 1; x++) {
      const i = y * b + x;
      const c = L[i];
      if (L[i - 1] === c && L[i + 1] === c && L[i - b] === c && L[i + b] === c && L[i - b - 1] === c && L[i - b + 1] === c && L[i + b - 1] === c && L[i + b + 1] === c) continue;
      for (const o of buren) tel[L[i + o]]++;
      let best = c, bn = tel[c];
      for (const o of buren) {
        const v = L[i + o];
        if (tel[v] > bn) {
          bn = tel[v];
          best = v;
        }
      }
      uit[i] = best;
      for (const o of buren) tel[L[i + o]] = 0;
    }
  }
  return uit;
}

// ---------------------------------------------------------------------------
// Selecteren
// ---------------------------------------------------------------------------

/**
 * Toverstaf: alles wat aansluit op het aangetikte punt en dezelfde kleur heeft (masker 0/1).
 * Met `overal` ook losse plekken elders in de foto met die kleur.
 * Een verloop (zon → schaduw) mag, zolang buren onderling weinig verschillen.
 * Over een duidelijke rand (kozijn → muur, deur → wand) groeit de selectie nooit verder, ook niet als de kleuren daar toevallig op elkaar lijken.
 */
export function toverstaf(wb: Werkbeeld, x: number, y: number, tolerantie: number, overal: boolean): Uint8Array {
  const { n, lab, breedte: b, hoogte: h } = wb;
  const [L, a, bb] = wb.kleurRond(x, y);
  const t2 = tolerantie * tolerantie;
  const ruim2 = (tolerantie * 1.5) ** 2;
  const buur2 = (tolerantie * 0.25) ** 2;
  const rand2 = (tolerantie * 2.2) ** 2;
  const masker = new Uint8Array(n);

  if (overal) {
    for (let i = 0; i < n; i++) if (afstand2(lab, i * 3, L, a, bb) <= t2) masker[i] = 1;
  } else {
    const cx = Math.max(0, Math.min(b - 1, Math.round(x)));
    const cy = Math.max(0, Math.min(h - 1, Math.round(y)));
    const randen = wb.randsterkte();
    const randGrens = tolerantie * 3;
    const stapel = new Int32Array(n);
    let top = 0;
    const start = cy * b + cx;
    masker[start] = 1;
    stapel[top++] = start;
    while (top > 0) {
      const p = stapel[--top];
      const px = p % b;
      const kp = p * 3;
      const probeer = (q: number) => {
        if (masker[q]) return;
        const kq = q * 3;
        const dSeed = afstand2(lab, kq, L, a, bb);
        if (dSeed <= t2 || (dSeed <= ruim2 && afstand2(lab, kq, lab[kp], lab[kp + 1], lab[kp + 2]) <= buur2)) {
          masker[q] = 1;
          // Op een rand: wel meenemen, maar niet verder groeien.
          if (randen[q] <= randGrens) stapel[top++] = q;
        }
      };
      if (px > 0) probeer(p - 1);
      if (px < b - 1) probeer(p + 1);
      if (p >= b) probeer(p - b);
      if (p < n - b) probeer(p + b);
    }
  }

  randMeenemen(wb, masker, L, a, bb, rand2);
  gatenVullen(masker, b, h, Math.max(40, Math.round(n * 0.00006)));
  return masker;
}

/** Neemt pixels direct naast het masker mee als ze half op de kleur lijken (overgang van JPEG en scherpte). */
function randMeenemen(wb: Werkbeeld, masker: Uint8Array, L: number, a: number, bb: number, max2: number) {
  const { n, lab, breedte: b } = wb;
  const erbij: number[] = [];
  for (let i = 0; i < n; i++) {
    if (masker[i]) continue;
    const x = i % b;
    const raak = (x > 0 && masker[i - 1]) || (x < b - 1 && masker[i + 1]) || (i >= b && masker[i - b]) || (i < n - b && masker[i + b]);
    if (raak && afstand2(lab, i * 3, L, a, bb) <= max2) erbij.push(i);
  }
  for (const i of erbij) masker[i] = 1;
}

/** Vult kleine gaatjes in een masker (vuil, spijkergaatjes, glimlichtjes). Grote gaten (glas in een kozijn) blijven. */
function gatenVullen(masker: Uint8Array, b: number, h: number, maxGat: number) {
  const n = b * h;
  const gezien = new Uint8Array(n);
  const stapel = new Int32Array(n);
  const lid: number[] = [];
  for (let s = 0; s < n; s++) {
    if (masker[s] || gezien[s]) continue;
    let top = 0;
    let aanRand = false;
    let groot = false;
    lid.length = 0;
    stapel[top++] = s;
    gezien[s] = 1;
    while (top > 0) {
      const p = stapel[--top];
      if (!groot) {
        lid.push(p);
        if (lid.length > maxGat) groot = true;
      }
      const x = p % b;
      if (x === 0 || x === b - 1 || p < b || p >= n - b) aanRand = true;
      if (x > 0 && !masker[p - 1] && !gezien[p - 1]) (gezien[p - 1] = 1), (stapel[top++] = p - 1);
      if (x < b - 1 && !masker[p + 1] && !gezien[p + 1]) (gezien[p + 1] = 1), (stapel[top++] = p + 1);
      if (p >= b && !masker[p - b] && !gezien[p - b]) (gezien[p - b] = 1), (stapel[top++] = p - b);
      if (p < n - b && !masker[p + b] && !gezien[p + b]) (gezien[p + b] = 1), (stapel[top++] = p + b);
    }
    if (!aanRand && !groot) for (const p of lid) masker[p] = 1;
  }
}

/** Zet een masker op een onderdeel (erbij) of haalt het eraf (alleen pixels die nu van dat onderdeel zijn). */
export function pasMaskerToe(wb: Werkbeeld, masker: Uint8Array, onderdeel: number, erbij: boolean): number {
  const e = wb.eigenaar;
  let gewijzigd = 0;
  for (let i = 0; i < wb.n; i++) {
    if (!masker[i]) continue;
    if (erbij) {
      if (e[i] !== onderdeel) (e[i] = onderdeel), gewijzigd++;
    } else if (e[i] === onderdeel) (e[i] = GEEN), gewijzigd++;
  }
  if (gewijzigd) wb.gewijzigd();
  return gewijzigd;
}

/**
 * Penseelstreek van (x0,y0) naar (x1,y1). `erbij` = schilderen op het onderdeel, anders gummen.
 * Met `alleenKleur` worden alleen pixels geraakt die op die kleur lijken ("slim penseel": niet over de rand heen).
 */
export function penseel(
  wb: Werkbeeld,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  straal: number,
  onderdeel: number,
  erbij: boolean,
  alleenKleur: { lab: Lab; tolerantie: number } | null,
): Rechthoek {
  const { breedte: b, hoogte: h, lab } = wb;
  const e = wb.eigenaar;
  const lengte = Math.hypot(x1 - x0, y1 - y0);
  const stappen = Math.max(1, Math.ceil(lengte / Math.max(1, straal / 3)));
  const r2 = straal * straal;
  const t2 = alleenKleur ? alleenKleur.tolerantie ** 2 : 0;
  const [kL, kA, kB] = alleenKleur?.lab ?? [0, 0, 0];
  for (let s = 0; s <= stappen; s++) {
    const cx = x0 + ((x1 - x0) * s) / stappen;
    const cy = y0 + ((y1 - y0) * s) / stappen;
    const ya = Math.max(0, Math.floor(cy - straal)), yb = Math.min(h - 1, Math.ceil(cy + straal));
    const xa = Math.max(0, Math.floor(cx - straal)), xb = Math.min(b - 1, Math.ceil(cx + straal));
    for (let y = ya; y <= yb; y++) {
      for (let x = xa; x <= xb; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r2) continue;
        const i = y * b + x;
        if (alleenKleur && afstand2(lab, i * 3, kL, kA, kB) > t2) continue;
        if (erbij) e[i] = onderdeel;
        else if (e[i] === onderdeel) e[i] = GEEN;
      }
    }
  }
  wb.gewijzigd();
  return {
    x0: Math.max(0, Math.floor(Math.min(x0, x1) - straal - 2)),
    y0: Math.max(0, Math.floor(Math.min(y0, y1) - straal - 2)),
    x1: Math.min(b - 1, Math.ceil(Math.max(x0, x1) + straal + 2)),
    y1: Math.min(h - 1, Math.ceil(Math.max(y0, y1) + straal + 2)),
  };
}

/** Telt per onderdeel hoeveel pixels het heeft. */
export function telPerOnderdeel(wb: Werkbeeld): Uint32Array {
  const tel = new Uint32Array(256);
  for (let i = 0; i < wb.n; i++) tel[wb.eigenaar[i]]++;
  return tel;
}

/** Gemiddelde kleur van een onderdeel (Lab), of null als het leeg is. */
export function gemiddeldeKleur(wb: Werkbeeld, onderdeel: number): Lab | null {
  let sL = 0, sA = 0, sB = 0, t = 0;
  for (let i = 0; i < wb.n; i++) {
    if (wb.eigenaar[i] !== onderdeel) continue;
    sL += wb.lab[i * 3];
    sA += wb.lab[i * 3 + 1];
    sB += wb.lab[i * 3 + 2];
    t++;
  }
  return t ? [sL / t, sA / t, sB / t] : null;
}

// ---------------------------------------------------------------------------
// Inkleuren
// ---------------------------------------------------------------------------

/** Zachte drempel zodat ruis in donkere vlakken niet wordt opgeblazen. */
const DONKER = 0.04;

/**
 * Brengt de nieuwe kleuren aan. `doelen[eigenaar]` = nieuwe kleur in lineair licht, of null (blijft origineel).
 * Licht en schaduw blijven: elke pixel krijgt de nieuwe kleur × (zijn helderheid / de gewone helderheid van zijn vlak).
 * Op de rand van twee vlakken wordt de mengverhouding uit de foto geschat, zodat er geen lichte of donkere randjes ontstaan.
 */
export class Inkleurder {
  private refVersie = -1;
  private ref = new Float32Array(256);

  constructor(private wb: Werkbeeld) {}

  /** Mediaan van de helderheid per onderdeel (de "gewone" kleur van dat vlak). */
  private referenties(snel: boolean) {
    // Tijdens een penseelstreek de vorige waarden houden (dat scheelt per beweging een rondgang over de hele foto).
    if (this.refVersie === this.wb.versie || (snel && this.refVersie >= 0)) return this.ref;
    const BAKJES = 512;
    const hist = new Uint32Array(256 * BAKJES);
    const tel = new Uint32Array(256);
    const { eigenaar: e, lum, n } = this.wb;
    for (let i = 0; i < n; i++) {
      const k = e[i];
      hist[k * BAKJES + Math.min(BAKJES - 1, (lum[i] * BAKJES) | 0)]++;
      tel[k]++;
    }
    for (let k = 0; k < 256; k++) {
      if (!tel[k]) continue;
      const helft = tel[k] / 2;
      let s = 0;
      for (let j = 0; j < BAKJES; j++) {
        s += hist[k * BAKJES + j];
        if (s >= helft) {
          this.ref[k] = (j + 0.5) / BAKJES;
          break;
        }
      }
    }
    this.refVersie = this.wb.versie;
    return this.ref;
  }

  kleurIn(doelen: (Rgb | null)[], uit: Uint8ClampedArray, gebied?: Rechthoek, snel = false) {
    const wb = this.wb;
    const { breedte: b, hoogte: h, origineel: o, lum } = wb;
    const e = wb.eigenaar;
    const ref = this.referenties(snel);
    const x0 = gebied?.x0 ?? 0, y0 = gebied?.y0 ?? 0;
    const x1 = gebied?.x1 ?? b - 1, y1 = gebied?.y1 ?? h - 1;
    const actief = new Uint8Array(256);
    const tr = new Float32Array(256), tg = new Float32Array(256), tb = new Float32Array(256);
    doelen.forEach((d, k) => {
      if (!d || k === GEEN) return;
      actief[k] = 1;
      tr[k] = d[0];
      tg[k] = d[1];
      tb[k] = d[2];
    });
    const buren = [-b - 1, -b, -b + 1, -1, 1, b - 1, b, b + 1];

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * b + x;
        const j = i * 4;
        const k = e[i];
        const rand = x > 0 && x < b - 1 && y > 0 && y < h - 1 && !(
          e[i - 1] === k && e[i + 1] === k && e[i - b] === k && e[i + b] === k &&
          e[i - b - 1] === k && e[i - b + 1] === k && e[i + b - 1] === k && e[i + b + 1] === k
        );

        if (!rand) {
          if (!actief[k]) {
            uit[j] = o[j];
            uit[j + 1] = o[j + 1];
            uit[j + 2] = o[j + 2];
          } else {
            const s = schaal(lum[i], ref[k]);
            uit[j] = naarSrgb8(tr[k] * s);
            uit[j + 1] = naarSrgb8(tg[k] * s);
            uit[j + 2] = naarSrgb8(tb[k] * s);
          }
          uit[j + 3] = 255;
          continue;
        }

        // Rand: bepaal de "andere" eigenaar (meest voorkomend bij de buren) en de gemiddelde kleur aan beide kanten.
        let ander = -1, anderTel = 0;
        for (const off of buren) {
          const q = e[i + off];
          if (q === k) continue;
          let t = 0;
          for (const off2 of buren) if (e[i + off2] === q) t++;
          if (t > anderTel) {
            anderTel = t;
            ander = q;
          }
        }
        if (!actief[k] && !actief[ander]) {
          uit[j] = o[j];
          uit[j + 1] = o[j + 1];
          uit[j + 2] = o[j + 2];
          uit[j + 3] = 255;
          continue;
        }
        const pr = naarLineair[o[j]], pg = naarLineair[o[j + 1]], pb = naarLineair[o[j + 2]];
        let ar = 0, ag = 0, ab = 0, an = 0, br = 0, bg = 0, bb2 = 0, bn = 0;
        for (const off of buren) {
          const q = i + off;
          const jq = q * 4;
          if (e[q] === k) {
            ar += naarLineair[o[jq]];
            ag += naarLineair[o[jq + 1]];
            ab += naarLineair[o[jq + 2]];
            an++;
          } else if (e[q] === ander) {
            br += naarLineair[o[jq]];
            bg += naarLineair[o[jq + 1]];
            bb2 += naarLineair[o[jq + 2]];
            bn++;
          }
        }
        if (an) (ar /= an), (ag /= an), (ab /= an);
        else (ar = pr), (ag = pg), (ab = pb);
        br /= bn;
        bg /= bn;
        bb2 /= bn;
        // Mengverhouding: hoeveel van "deze kant" zit er in deze pixel?
        const vr = ar - br, vg = ag - bg, vb = ab - bb2;
        const lengte2 = vr * vr + vg * vg + vb * vb;
        let alfa = lengte2 < 1e-5 ? 1 : ((pr - br) * vr + (pg - bg) * vg + (pb - bb2) * vb) / lengte2;
        alfa = alfa < 0 ? 0 : alfa > 1 ? 1 : alfa;
        // Verandering van elke kant, gewogen naar de mengverhouding.
        let nr = pr, ng = pg, nb = pb;
        if (actief[k]) {
          const s = schaal(0.2126729 * ar + 0.7151522 * ag + 0.072175 * ab, ref[k]);
          nr += alfa * (tr[k] * s - ar);
          ng += alfa * (tg[k] * s - ag);
          nb += alfa * (tb[k] * s - ab);
        }
        if (actief[ander]) {
          const s = schaal(0.2126729 * br + 0.7151522 * bg + 0.072175 * bb2, ref[ander]);
          nr += (1 - alfa) * (tr[ander] * s - br);
          ng += (1 - alfa) * (tg[ander] * s - bg);
          nb += (1 - alfa) * (tb[ander] * s - bb2);
        }
        uit[j] = naarSrgb8(nr);
        uit[j + 1] = naarSrgb8(ng);
        uit[j + 2] = naarSrgb8(nb);
        uit[j + 3] = 255;
      }
    }
  }
}

function schaal(y: number, ref: number): number {
  const s = (y + DONKER) / (ref + DONKER);
  return s > 2.5 ? 2.5 : s;
}

// ---------------------------------------------------------------------------
// Selectie tonen
// ---------------------------------------------------------------------------

/**
 * Tekent de selectie van één onderdeel: lichte waas over het vlak en een gestreepte rand (wit/blauw),
 * met een randdikte die op het scherm nog zichtbaar is.
 */
export function tekenSelectie(wb: Werkbeeld, onderdeel: number, uit: Uint8ClampedArray, dikte: number, gebied?: Rechthoek) {
  const { breedte: b, hoogte: h } = wb;
  const e = wb.eigenaar;
  const d = Math.max(1, Math.round(dikte));
  const x0 = gebied?.x0 ?? 0, y0 = gebied?.y0 ?? 0;
  const x1 = gebied?.x1 ?? b - 1, y1 = gebied?.y1 ?? h - 1;
  const streep = Math.max(4, d * 4);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * b + x;
      const j = i * 4;
      if (e[i] !== onderdeel) {
        uit[j + 3] = 0;
        continue;
      }
      const rand =
        (x >= d && e[i - d] !== onderdeel) || (x < b - d && e[i + d] !== onderdeel) ||
        (y >= d && e[i - d * b] !== onderdeel) || (y < h - d && e[i + d * b] !== onderdeel) ||
        x === 0 || y === 0 || x === b - 1 || y === h - 1;
      if (rand) {
        const wit = (((x + y) / streep) | 0) % 2 === 0;
        uit[j] = wit ? 255 : 0;
        uit[j + 1] = wit ? 255 : 140;
        uit[j + 2] = wit ? 255 : 220;
        uit[j + 3] = 255;
      } else {
        uit[j] = 0;
        uit[j + 1] = 140;
        uit[j + 2] = 220;
        uit[j + 3] = 90;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Kleur uit de foto
// ---------------------------------------------------------------------------

/** De RAL-kleuren die het dichtst bij een kleur liggen (ΔE2000). */
export function dichtsteRal(lab: Lab, aantal = 3): (RalKleur & { verschil: number })[] {
  return ralKleuren
    .map((k) => ({ ...k, verschil: deltaE2000(lab, hexNaarLab(k.hex)) }))
    .sort((a, b) => a.verschil - b.verschil)
    .slice(0, aantal);
}
