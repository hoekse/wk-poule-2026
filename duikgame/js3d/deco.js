/* Diepblauw 3D — decompressie volgens Bühlmann ZHL-16C met gradient factors (zoals moderne duikcomputers) */

// halveringstijd (min), a (bar), b — stikstof, ZHL-16C (compartiment 1b)
const N2 = [
  [5.0, 1.1696, 0.5578], [8.0, 1.0, 0.6514], [12.5, 0.8618, 0.7222], [18.5, 0.7562, 0.7825],
  [27.0, 0.62, 0.8126], [38.3, 0.5043, 0.8434], [54.3, 0.441, 0.8693], [77.0, 0.4, 0.891],
  [109.0, 0.375, 0.9092], [146.0, 0.35, 0.9222], [187.0, 0.3295, 0.9319], [239.0, 0.3065, 0.9403],
  [305.0, 0.2835, 0.9477], [390.0, 0.261, 0.9544], [498.0, 0.248, 0.9602], [635.0, 0.2327, 0.9653],
];
const P_SURF = 1.01325;   // bar, zeeniveau (Bonaire)
const P_H2O = 0.0627;     // waterdamp in de longen
const BAR_PER_M = 0.1013; // zout water ≈ 1 bar per 10 m (1,025 kg/l)

export class Deco {
  constructor(opts = {}) {
    this.gfLo = opts.gfLo || 0.4;
    this.gfHi = opts.gfHi || 0.85;
    this.fN2 = opts.fN2 || 0.79;
    this.t = opts.tissues ? opts.tissues.slice() : N2.map(() => (P_SURF - P_H2O) * 0.79);
    this.firstStop = 0; // diepte van de eerste stop (voor GF-interpolatie)
    this.cns = opts.cns || 0;
  }
  static amb(depth) { return P_SURF + Math.max(0, depth) * BAR_PER_M; }

  // weefsels bijwerken voor `min` minuten op `depth` meter
  step(depth, min) {
    if (min <= 0) return;
    const palv = (Deco.amb(depth) - P_H2O) * this.fN2;
    for (let i = 0; i < 16; i++) {
      const k = Math.LN2 / N2[i][0];
      this.t[i] = palv + (this.t[i] - palv) * Math.exp(-k * min);
    }
    // zuurstofbelasting (CNS) grof bijhouden
    const po2 = Deco.amb(depth) * (1 - this.fN2);
    if (po2 > 0.5) this.cns += (min / (po2 > 1.4 ? 150 : po2 > 1.2 ? 210 : po2 > 1.0 ? 300 : 570)) * 100;
    else this.cns = Math.max(0, this.cns - min * 0.6);
  }

  // GF op een diepte, lineair tussen eerste stop (gfLo) en oppervlakte (gfHi)
  gfAt(depth) {
    if (this.firstStop <= 0) return this.gfHi;
    const f = Math.max(0, Math.min(1, depth / this.firstStop));
    return this.gfHi + (this.gfLo - this.gfHi) * f;
  }

  // plafond in meters (0 = je mag naar de oppervlakte)
  ceiling(gf) {
    let maxP = 0;
    for (let i = 0; i < 16; i++) {
      const [, a, b] = N2[i];
      const p = this.t[i];
      const pTol = (p - a * gf) / (gf / b + 1 - gf);
      if (pTol > maxP) maxP = pTol;
    }
    return Math.max(0, (maxP - P_SURF) / BAR_PER_M);
  }

  // plafond met GF-interpolatie; onthoudt de eerste stop
  currentCeiling() {
    const cLo = this.ceiling(this.gfLo);
    if (cLo > this.firstStop) this.firstStop = Math.ceil(cLo / 3) * 3;
    if (this.firstStop <= 0) return this.ceiling(this.gfHi);
    // iteratief: plafond met de GF die bij die diepte hoort
    let c = cLo;
    for (let k = 0; k < 4; k++) c = this.ceiling(this.gfAt(c));
    return c;
  }

  // nultijd in minuten op deze diepte (999 = onbeperkt)
  ndl(depth) {
    const palv = (Deco.amb(depth) - P_H2O) * this.fN2;
    let best = 999;
    for (let i = 0; i < 16; i++) {
      const [ht, a, b] = N2[i];
      const k = Math.LN2 / ht;
      const m = P_SURF * (this.gfHi / b + 1 - this.gfHi) + a * this.gfHi; // max. weefseldruk voor opstijgen naar de oppervlakte
      const p0 = this.t[i];
      if (p0 >= m) return 0;
      if (palv <= m) continue;
      const tmin = -Math.log((m - palv) / (p0 - palv)) / k;
      if (tmin < best) best = tmin;
    }
    return best;
  }

  inDeco() { return this.currentCeiling() > 0.05; }

  // decostops (3 m-stappen) en totale opstijgtijd, zonder de weefsels te veranderen
  plan(depth, ascentRate = 10) {
    const save = this.t.slice(), saveFirst = this.firstStop, saveCns = this.cns;
    const stops = [];
    let d = depth, total = 0;
    let c = this.currentCeiling();
    if (c <= 0.05) { this.t = save; return { stops, tts: depth / ascentRate }; }
    let stop = Math.ceil(c / 3) * 3;
    // opstijgen naar eerste stop
    const asc = (to) => { const m = (d - to) / ascentRate; this.step((d + to) / 2, m); total += m; d = to; };
    asc(stop);
    let guard = 0;
    while (stop > 0 && guard++ < 400) {
      let tm = 0;
      while (this.ceiling(this.gfAt(stop - 3 < 0 ? 0 : stop - 3)) > stop - 3 + 0.01 && tm < 240) { this.step(stop, 1); tm++; }
      if (tm > 0) stops.push({ depth: stop, min: tm });
      total += tm;
      const next = stop - 3;
      asc(Math.max(0, next));
      stop = next;
    }
    this.t = save; this.firstStop = saveFirst; this.cns = saveCns;
    return { stops, tts: total };
  }

  // tijd aan de oppervlakte (desatureren)
  surface(min) { this.step(0, min); if (!this.inDeco()) this.firstStop = 0; }

  // hoogste weefselverzadiging t.o.v. de M-waarde aan de oppervlakte (0..1+)
  load() {
    let worst = 0;
    for (let i = 0; i < 16; i++) {
      const [, a, b] = N2[i];
      const m = a + P_SURF / b;
      const sat = P_SURF * 0.79;
      worst = Math.max(worst, (this.t[i] - sat) / (m - sat));
    }
    return Math.max(0, worst);
  }
  snapshot() { return { tissues: this.t.slice(), cns: this.cns }; }
}

// Vliegverbod volgens de richtlijnen van DAN: 12 u na één duik zonder deco, 18 u na meerdere duiken of dagen, 24 u na een decoduik
export function noFlyHours(dives) {
  if (!dives.length) return 0;
  const deco = dives.some((d) => d.deco);
  if (deco) return 24;
  return dives.length > 1 ? 18 : 12;
}
