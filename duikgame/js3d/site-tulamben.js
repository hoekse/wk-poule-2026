/* Diepblauw 3D — het wrak van de USAT Liberty bij Tulamben (Bali).
   Kantduik vanaf een strand van zwarte keien. Het zwarte vulkanische zand loopt steil af; op
   ± 40 m uit de kust ligt het 120 m lange wrak op zijn zij, van ± 5 tot 25 m diep, in tweeën
   gebroken en helemaal begroeid met koraal, waaiers en sponzen.

   Assen van het wrak: z loopt langs het schip (achtersteven z = -60, boeg z = +62).
   u = van kiel (0) naar dek (10), het dek kijkt naar het strand (+x).
   w = over de breedte (±8): de bakboordzijde ligt boven, de stuurboordzijde in het zand. */
import * as THREE from 'three';
import { UW, uw } from './water.js';
import { setSeabed, setSolid, floorNoise as fbm, swayMat } from './terrain.js';
import { loadModels, hasModel, modelGeo, modelMap } from './models.js';
import { Fauna } from './creatures3d.js';
import { rng, smooth, tileTex, lumpy, makeRayGround } from './sitekit.js';

const DG = window.DG;

/* ---------------- bodem: kiezelstrand en steil zwart zand ---------------- */
const PROF = [[16, 3.5], [4, 0.8], [0, -0.8], [-8, -4.5], [-20, -9.5], [-35, -15], [-55, -21], [-80, -27], [-120, -34], [-170, -40]];
function prof(x) {
  if (x >= PROF[0][0]) return PROF[0][1];
  for (let i = 1; i < PROF.length; i++) {
    const a = PROF[i - 1], b = PROF[i];
    if (x >= b[0]) return a[1] + (b[1] - a[1]) * smooth((a[0] - x) / (a[0] - b[0]));
  }
  return PROF[PROF.length - 1][1];
}
function tuSeabed(x, z) {
  let y = prof(x);
  const beach = x > -6 ? 1 : Math.max(0, 1 - (-6 - x) / 6);
  y += (fbm(x * 0.18, z * 0.18) - 0.45) * (0.3 + beach * 0.6);
  y += Math.sin(z * 0.11 + x * 0.05) * 0.12 * (1 - beach); // zandribbels
  return y;
}

/* ---------------- het wrak: vorm ---------------- */
const WR = { xk: -50, D: 10, B: 8, z0: -60, z1: 62, rb: 2.4 };
const yMid = (z) => -14 - z * 0.04;
function beamK(z) {
  if (z > 34) return Math.max(0.05, 1 - smooth((z - 34) / (WR.z1 - 34)) * 0.95);
  if (z < -50) return 1 - smooth((-50 - z) / 10) * 0.35;
  return 1;
}
const keelU = (z) => (z > 40 ? smooth((z - 40) / (WR.z1 - 40)) * 6 : 0); // de boeg loopt schuin op
function shape(z) {
  const B = WR.B * beamK(z), u0 = keelU(z);
  const rb = Math.max(0.05, Math.min(WR.rb, B * 0.9, (WR.D - u0) * 0.45));
  const L1 = WR.D - u0 - rb, L2 = rb * Math.PI / 2, L3 = Math.max(0, 2 * B - 2 * rb);
  return { B, u0, rb, L: [L1, L2, L3, L2, L1], tot: 2 * L1 + 2 * L2 + L3 };
}
// punt op de U-vormige romp (zonder dek) bij fractie s (0 = dek bakboord … 1 = dek stuurboord)
function sect(sh, s, out) {
  let d = Math.max(0, Math.min(1, s)) * sh.tot;
  const { B, u0, rb } = sh;
  if (d <= sh.L[0]) { out.u = WR.D - d; out.w = B; out.nu = 0; out.nw = 1; return out; }
  d -= sh.L[0];
  if (d <= sh.L[1]) { const a = d / rb; out.u = u0 + rb - rb * Math.sin(a); out.w = B - rb + rb * Math.cos(a); out.nu = -Math.sin(a); out.nw = Math.cos(a); return out; }
  d -= sh.L[1];
  if (d <= sh.L[2]) { out.u = u0; out.w = B - rb - d; out.nu = -1; out.nw = 0; return out; }
  d -= sh.L[2];
  if (d <= sh.L[3]) { const a = d / rb; out.u = u0 + rb - rb * Math.cos(a); out.w = -B + rb - rb * Math.sin(a); out.nu = -Math.cos(a); out.nw = -Math.sin(a); return out; }
  d -= sh.L[3];
  out.u = u0 + rb + Math.min(d, sh.L[4]); out.w = -B; out.nu = 0; out.nw = -1; return out;
}
// gaten in de romp: de breuk midscheeps, ingestorte platen en het torpedogat
const HOLES = [
  { z: [-7, -1], s: [-1, 2] },
  { z: [6, 21], s: [0.03, 0.3] },
  { z: [-31, -24], s: [0.42, 0.6] },
  { z: [-46, -39], s: [0.06, 0.22] },
  { z: [30, 37], s: [0.1, 0.24] },
];
function inHole(z, s) {
  for (const h of HOLES) {
    const j = (fbm(z * 0.7 + s * 13, s * 9 + 3) - 0.5) * 1.8;
    if (z > h.z[0] - j && z < h.z[1] + j && s > h.s[0] - j * 0.03 && s < h.s[1] + j * 0.03) return true;
  }
  return false;
}
// luiken in het dek (open ruimen) en de breuk
const HATCH = [{ z: [-47, -40], w: [0.24, 0.76] }, { z: [-31, -23], w: [0.22, 0.78] }, { z: [23, 31], w: [0.22, 0.78] }, { z: [40, 46], w: [0.3, 0.7] }];
function deckHole(z, w01) {
  if (z > -7.5 + (fbm(w01 * 9, 1) - 0.5) * 2 && z < -0.5 + (fbm(w01 * 7, 5) - 0.5) * 2) return true;
  for (const h of HATCH) if (z > h.z[0] && z < h.z[1] && w01 > h.w[0] && w01 < h.w[1]) return true;
  return false;
}
// opbouw (brug) midscheeps: platen met deur- en raamgaten, in wrak-coördinaten
const HOUSE = { z: [3, 15], w: 5.5, u: [10, 16] };

/* ---------------- het wrak: bouwen ---------------- */
function hullGeometry(q) {
  const dz = q === 'laag' ? 1.2 : 0.8, ns = q === 'laag' ? 48 : 72;
  const nz = Math.ceil((WR.z1 - WR.z0) / dz) + 1;
  const pos = [], uvs = [], idx = [];
  const o = {};
  for (let i = 0; i < nz; i++) {
    const z = Math.min(WR.z1, WR.z0 + i * dz), sh = shape(z), ym = yMid(z);
    for (let j = 0; j <= ns; j++) {
      const s = j / ns;
      sect(sh, s, o);
      // lichte deuken in de platen
      const dent = (fbm(z * 0.35, s * 20) - 0.5) * 0.35;
      pos.push(WR.xk + o.u + o.nu * dent, ym + o.w + o.nw * dent, z);
      uvs.push(z / 3.5, s * sh.tot / 3.5);
    }
  }
  for (let i = 0; i < nz - 1; i++) {
    const zc = WR.z0 + (i + 0.5) * dz;
    for (let j = 0; j < ns; j++) {
      if (inHole(zc, (j + 0.5) / ns)) continue;
      const a = i * (ns + 1) + j, b = a + ns + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function deckGeometry(q) {
  const dz = q === 'laag' ? 1.2 : 0.8, nw = 20;
  const nz = Math.ceil((WR.z1 - WR.z0) / dz) + 1;
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i < nz; i++) {
    const z = Math.min(WR.z1, WR.z0 + i * dz), B = WR.B * beamK(z), ym = yMid(z);
    for (let j = 0; j <= nw; j++) {
      const w01 = j / nw;
      pos.push(WR.xk + WR.D + (fbm(z * 0.4, w01 * 8) - 0.5) * 0.25, ym + (w01 * 2 - 1) * B, z);
      uvs.push(z / 3.5, w01 * 2 * B / 3.5);
    }
  }
  for (let i = 0; i < nz - 1; i++) {
    const zc = WR.z0 + (i + 0.5) * dz;
    for (let j = 0; j < nw; j++) {
      if (zc > HOUSE.z[0] && zc < HOUSE.z[1] && Math.abs(((j + 0.5) / nw) * 2 - 1) * WR.B < HOUSE.w) continue; // onder de opbouw
      if (deckHole(zc, (j + 0.5) / nw)) continue;
      const a = i * (nw + 1) + j, b = a + nw + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// rechthoekige plaat met gaten: o = hoek, a/b = richtingen, la/lb = lengtes, hole(fa, fb) → true = weg
const PLATES = [];
function plateGeometry(o, a, b, la, lb, hole) {
  const na = Math.max(2, Math.round(la / 0.7)), nb = Math.max(2, Math.round(lb / 0.7));
  const pos = [], uvs = [], idx = [];
  for (let i = 0; i <= na; i++) {
    for (let j = 0; j <= nb; j++) {
      const fa = i / na, fb = j / nb;
      pos.push(o.x + a.x * la * fa + b.x * lb * fb, o.y + a.y * la * fa + b.y * lb * fb, o.z + a.z * la * fa + b.z * lb * fb);
      uvs.push(la * fa / 3.5, lb * fb / 3.5);
    }
  }
  for (let i = 0; i < na; i++) {
    for (let j = 0; j < nb; j++) {
      if (hole && hole((i + 0.5) / na, (j + 0.5) / nb)) continue;
      const p0 = i * (nb + 1) + j, p1 = p0 + nb + 1;
      idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  PLATES.push({ o: o.clone(), a: a.clone(), b: b.clone(), la, lb, n: new THREE.Vector3().crossVectors(a, b).normalize(), hole });
  return g;
}
const W2 = (u, w, z) => new THREE.Vector3(WR.xk + u, yMid(z) + w, z); // wrak → wereld
function houseGeometries() {
  PLATES.length = 0;
  const [z0, z1] = HOUSE.z, [u0, u1] = HOUSE.u, hw = HOUSE.w, X = new THREE.Vector3(1, 0, 0), Yv = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const gs = [];
  // dak (naar het strand gekeerd), met een ingestort gat
  gs.push(plateGeometry(W2(u1, -hw, z0), Yv, Z, hw * 2, z1 - z0, (fa, fb) => fa > 0.35 && fa < 0.7 && fb > 0.3 && fb < 0.62));
  // bovenwand (bakboord): ramen
  gs.push(plateGeometry(W2(u0, hw, z0), X, Z, u1 - u0, z1 - z0, (fa, fb) => fa > 0.35 && fa < 0.65 && ((fb > 0.12 && fb < 0.26) || (fb > 0.42 && fb < 0.56) || (fb > 0.72 && fb < 0.86))));
  // voor- en achterwand met een deur: hier kun je naar binnen
  gs.push(plateGeometry(W2(u0, -hw, z1), X, Yv, u1 - u0, hw * 2, (fa, fb) => fa < 0.62 && fb > 0.38 && fb < 0.62));
  gs.push(plateGeometry(W2(u0, -hw, z0), X, Yv, u1 - u0, hw * 2, (fa, fb) => (fa > 0.2 && fa < 0.7 && fb > 0.2 && fb < 0.4) || (fa > 0.3 && fa < 0.85 && fb > 0.62 && fb < 0.84)));
  // spiegelplaat achter (transom), dicht
  const sh = shape(WR.z0);
  const tr = new THREE.Shape();
  const o = {};
  for (let j = 0; j <= 32; j++) { sect(sh, j / 32, o); if (j === 0) tr.moveTo(o.u, o.w); else tr.lineTo(o.u, o.w); }
  tr.lineTo(WR.D, sh.B);
  const tg = new THREE.ShapeGeometry(tr);
  tg.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)));
  tg.translate(WR.xk, yMid(WR.z0), WR.z0);
  gs.push(tg);
  return gs;
}
// spanten in de gaten: het skelet van het schip
function ribList() {
  const out = [];
  const o1 = {}, o2 = {};
  for (const h of HOLES) {
    for (let z = Math.ceil(h.z[0] / 1.4) * 1.4; z <= h.z[1]; z += 1.4) {
      const sh = shape(z), ym = yMid(z), s0 = Math.max(0, h.s[0] - 0.04), s1 = Math.min(1, h.s[1] + 0.04);
      if (h.s[0] < 0 && Math.random() < 0.55) continue; // in de breuk zijn veel spanten weg
      for (let s = s0; s < s1; s += 0.025) {
        if (Math.random() < 0.08) continue;
        sect(sh, s, o1); sect(sh, Math.min(s1, s + 0.025), o2);
        out.push({ a: new THREE.Vector3(WR.xk + o1.u, ym + o1.w, z), b: new THREE.Vector3(WR.xk + o2.u, ym + o2.w, z) });
      }
    }
  }
  return out;
}

/* ---------------- botsen met het wrak ---------------- */
const _o = {}, _push = new THREE.Vector3(), _v = new THREE.Vector3();
function nearestOnU(sh, u, w) {
  // dichtstbijzijnde punt op de U (vijf stukken), via een grove zoektocht + verfijning
  let best = 1e9, bs = 0;
  for (let k = 0; k <= 24; k++) {
    const s = k / 24; sect(sh, s, _o);
    const d = (_o.u - u) ** 2 + (_o.w - w) ** 2;
    if (d < best) { best = d; bs = s; }
  }
  let lo = Math.max(0, bs - 0.042), hi = Math.min(1, bs + 0.042);
  for (let it = 0; it < 12; it++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
    sect(sh, m1, _o); const d1 = (_o.u - u) ** 2 + (_o.w - w) ** 2;
    sect(sh, m2, _o); const d2 = (_o.u - u) ** 2 + (_o.w - w) ** 2;
    if (d1 < d2) hi = m2; else lo = m1;
  }
  const s = (lo + hi) / 2; sect(sh, s, _o);
  return { s, u: _o.u, w: _o.w, nu: _o.nu, nw: _o.nw, d: Math.hypot(_o.u - u, _o.w - w) };
}
const SOLIDS = []; // extra vaste delen: bollen en capsules (schroef, kanon, ketel, masten)
function capsulePush(p, a, b, rad, r) {
  _v.subVectors(b, a);
  const t = Math.max(0, Math.min(1, _v.dot(_push.subVectors(p, a)) / _v.lengthSq()));
  const c = a.clone().addScaledVector(_v, t);
  const d = p.distanceTo(c), lim = rad + r;
  if (d >= lim) return null;
  return p.clone().sub(c).setLength(lim - d + 0.001);
}
function wreckSolid(p, r) {
  const z = p.z;
  if (z < WR.z0 - 8 || z > WR.z1 + 2 || p.x < WR.xk - 4 || p.x > WR.xk + HOUSE.u[1] + 12) return null;
  const T = 0.18; // halve plaatdikte
  let res = null;
  const add = (v) => { if (v) { if (!res) res = new THREE.Vector3(); res.add(v); } };
  if (z >= WR.z0 && z <= WR.z1) {
    const sh = shape(z), ym = yMid(z), u = p.x - WR.xk, w = p.y - ym;
    if (u > -r - 1 && u < WR.D + r + 1 && Math.abs(w) < sh.B + r + 1) {
      // romp
      const n = nearestOnU(sh, u, w);
      if (n.d < r + T && !inHole(z, n.s)) {
        let du = u - n.u, dw = w - n.w, l = Math.hypot(du, dw);
        if (l < 1e-4) { du = n.nu; dw = n.nw; l = 1; }
        const k = (r + T - n.d) / l;
        add(new THREE.Vector3(du * k, dw * k, 0));
      }
      // dek
      const dd = u - WR.D;
      if (Math.abs(dd) < r + T && Math.abs(w) < sh.B) {
        const w01 = (w / sh.B + 1) / 2;
        const underHouse = z > HOUSE.z[0] && z < HOUSE.z[1] && Math.abs(w) < HOUSE.w;
        if (!underHouse && !deckHole(z, w01)) add(new THREE.Vector3((dd >= 0 ? 1 : -1) * (r + T - Math.abs(dd)), 0, 0));
      }
    }
  }
  // spiegel achter
  if (Math.abs(z - WR.z0) < r + T) {
    const sh = shape(WR.z0), u = p.x - WR.xk, w = p.y - yMid(WR.z0);
    if (u > 0 && u < WR.D && Math.abs(w) < sh.B) add(new THREE.Vector3(0, 0, (z >= WR.z0 ? 1 : -1) * (r + T - Math.abs(z - WR.z0))));
  }
  // opbouw
  for (const pl of PLATES) {
    _v.subVectors(p, pl.o);
    const dn = _v.dot(pl.n);
    if (Math.abs(dn) >= r + T) continue;
    const fa = _v.dot(pl.a) / pl.la, fb = _v.dot(pl.b) / pl.lb;
    if (fa < 0 || fa > 1 || fb < 0 || fb > 1) continue;
    if (pl.hole && pl.hole(fa, fb)) continue;
    add(pl.n.clone().multiplyScalar((dn >= 0 ? 1 : -1) * (r + T - Math.abs(dn))));
  }
  for (const s of SOLIDS) add(capsulePush(p, s.a, s.b, s.r, r));
  return res;
}

/* ---------------- materiaal van het wrak ---------------- */
function wreckMaterial(q) {
  const mat = uw(new THREE.MeshStandardMaterial({ color: 0xc8b8a8, roughness: 0.92, metalness: 0.05, side: THREE.DoubleSide }), { caus: true, key: 'tuHull' });
  tileTex('img/tulamben/romp.webp', q === 'laag' ? 512 : 1024, (t) => { mat.map = t; mat.bumpMap = t; mat.bumpScale = 2.4; mat.color.set(0xffffff); mat.needsUpdate = true; });
  return mat;
}

/* ---------------- Magnific-onderdelen: schroef, kanon en ketel ---------------- */
// basis: model-as X → wereld, model-as Y → wereld (het schip ligt op zijn zij: 'boven' is +x)
function placeModel(scene, id, size, pos, ex, ey) {
  if (!hasModel(id)) return null;
  const g = modelGeo(id, 'center');
  const ez = new THREE.Vector3().crossVectors(ex, ey);
  g.applyMatrix4(new THREE.Matrix4().makeBasis(ex, ey, ez));
  g.scale(size, size, size);
  const mat = uw(new THREE.MeshStandardMaterial({ map: modelMap(id), roughness: 0.85, metalness: 0.1 }), { caus: true, key: 'tuProp' + id });
  const m = new THREE.Mesh(g, mat);
  m.position.copy(pos);
  scene.add(m);
  return m;
}

/* ---------------- koraal, sponzen en waaiers op het wrak ---------------- */
function coralSpots(R, n, filter) {
  // willekeurige punten op romp en dek met de richting van het oppervlak
  const out = [], o = {};
  let guard = 0;
  while (out.length < n && guard++ < n * 30) {
    const onDeck = R() < 0.22;
    const z = WR.z0 + 1 + R() * (WR.z1 - WR.z0 - 3);
    const sh = shape(z), ym = yMid(z);
    let p, nrm, s = -1;
    if (onDeck) {
      const w01 = 0.05 + R() * 0.9;
      if (deckHole(z, w01) || (z > HOUSE.z[0] && z < HOUSE.z[1] && Math.abs(w01 * 2 - 1) * WR.B < HOUSE.w)) continue;
      p = new THREE.Vector3(WR.xk + WR.D, ym + (w01 * 2 - 1) * sh.B, z);
      nrm = new THREE.Vector3(1, 0, 0);
    } else {
      s = R() * 0.62; // bovenkant en de kant naar zee (de onderkant ligt in het zand)
      if (inHole(z, s)) continue;
      sect(sh, s, o);
      p = new THREE.Vector3(WR.xk + o.u, ym + o.w, z);
      nrm = new THREE.Vector3(o.nu, o.nw, 0);
    }
    if (p.y < tuSeabed(p.x, p.z) + 0.3) continue; // begraven
    const kind = nrm.y > 0.6 ? 'top' : 'side';
    if (filter && !filter(kind)) continue;
    out.push({ p, n: nrm, kind });
  }
  return out;
}
function makeCorals(scene, q) {
  const R = rng(321);
  const dense = q === 'laag' ? 0.45 : q === 'midden' ? 0.75 : 1;
  const up = new THREE.Vector3(0, 1, 0), qq = new THREE.Quaternion(), tw = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = new THREE.Vector3();
  const tint = (hex, k) => new THREE.Color(1, 1, 1).lerp(new THREE.Color(hex), k);
  const sets = [
    // id, aantal, plek, maat, kleuren
    ['tafelkoraal', 170, 'top', [0.8, 2.0], ['#d8e0c0', '#c8d8b8', '#e0d0b0']],
    ['hersenkoraal', 130, 'top', [0.5, 1.2], ['#e8d8a0', '#c8d890', '#d8c0c8']],
    ['sterkoraal', 110, 'top', [0.6, 1.3], ['#d0c8a0', '#c0d0b0']],
    ['bekerkoraal', 140, 'any', [0.4, 0.9], ['#f0a060', '#f0c070', '#e88070']],
    ['korstspons', 160, 'any', [0.5, 1.1], ['#e07050', '#c060a0', '#f0a040']],
    ['zachtkoraal', 260, 'any', [0.7, 1.6], ['#ff90b0', '#e070d0', '#ff9070', '#f0f0f0']],
    ['tonspons', 50, 'top', [0.9, 1.8], ['#b07060', '#a08070']],
    ['vaasspons', 80, 'side', [0.5, 1.1], ['#d0a0e0', '#e0b080']],
    ['buisspons', 80, 'side', [0.5, 1.1], ['#c090d0', '#f0b060']],
  ];
  for (const [id, n, where, size, cols] of sets) {
    if (!hasModel(id)) continue;
    const spots = coralSpots(R, Math.round(n * dense), (k) => where === 'any' || k === where);
    if (!spots.length) continue;
    const mat = uw(new THREE.MeshStandardMaterial({ map: modelMap(id), roughness: 0.85, side: id === 'zachtkoraal' ? THREE.DoubleSide : THREE.FrontSide }), { caus: true, key: 'tuC' + id });
    // per derde van het wrak een eigen mesh: wat buiten beeld is, wordt overgeslagen
    const parts = [[], [], []];
    spots.forEach((sp, i) => {
      qq.setFromUnitVectors(up, sp.n); tw.setFromAxisAngle(up, R() * Math.PI * 2); qq.multiply(tw);
      const s = size[0] + R() * (size[1] - size[0]);
      sc.set(s, s * (0.8 + R() * 0.4), s);
      parts[sp.p.z < -20 ? 0 : sp.p.z < 20 ? 1 : 2].push({ m: m4.compose(sp.p.clone().addScaledVector(sp.n, -0.05), qq, sc).clone(), c: tint(cols[i % cols.length], 0.35) });
    });
    const geo = modelGeo(id, 'reef');
    parts.forEach((list) => {
      if (!list.length) return;
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((it, i) => { mesh.setMatrixAt(i, it.m); mesh.setColorAt(i, it.c); });
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
    });
  }
  // rode en oranje waaiers (gorgonen) op de kant naar zee en op het dek
  {
    const photo = new THREE.TextureLoader().load('img/waaier.webp');
    photo.colorSpace = THREE.SRGBColorSpace; photo.anisotropy = 4;
    const g = new THREE.PlaneGeometry(1.3, 1.3 * 0.98, 6, 6);
    g.translate(0, 0.63, 0);
    const mat = swayMat({ color: 0xffffff, map: photo, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9, key: 'tuFan' });
    const spots = coralSpots(R, Math.round(170 * dense), (k) => k === 'side');
    const mesh = new THREE.InstancedMesh(g, mat, spots.length);
    const c = new THREE.Color();
    spots.forEach((sp, i) => {
      // waaiers staan dwars op de stroming: plat vlak langs het wrak
      qq.setFromUnitVectors(up, sp.n); tw.setFromAxisAngle(up, (R() - 0.5) * 0.8); qq.multiply(tw);
      const s = 0.8 + R() * 1.4;
      mesh.setMatrixAt(i, m4.compose(sp.p, qq, sc.set(s, s, s)));
      mesh.setColorAt(i, c.set(['#e05030', '#f08040', '#d84060', '#f0c040'][i % 4]).lerp(new THREE.Color(1, 1, 1), 0.25));
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
}

/* ---------------- strand van keien, losse rotsen en wrakstukken ---------------- */
function makeRocks(scene, q, wreckMat) {
  const R = rng(77);
  const geo = lumpy(new THREE.IcosahedronGeometry(0.5, q === 'laag' ? 1 : 2), 0.3, 11);
  geo.scale(1, 0.7, 1);
  const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), { caus: true, key: 'tuRock' });
  tileTex('img/tulamben/kiezel.webp', 512, (t) => { mat.map = t; mat.needsUpdate = true; }, { repeat: [1.5, 1] });
  const n = q === 'laag' ? 600 : 1300;
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const d = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const beach = i < n * 0.8;
    const x = beach ? 6 - Math.pow(R(), 1.4) * 15 : -10 - R() * 90, z = (R() - 0.5) * 220;
    if (!beach && Math.abs(z) < 64 && x < -36 && x > -62) { i--; continue; } // niet onder het wrak
    const s = beach ? 0.18 + R() * 0.55 : 0.3 + Math.pow(R(), 2) * 1.4;
    d.position.set(x, tuSeabed(x, z) - s * 0.15, z);
    d.rotation.set(R() * 3, R() * 6, R() * 3);
    d.scale.set(s, s * (0.6 + R() * 0.4), s * (0.8 + R() * 0.4));
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    c.setHSL(0.08, 0.05, beach ? 0.45 + R() * 0.3 : 0.3 + R() * 0.2);
    mesh.setColorAt(i, c);
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
  // losse platen en balken rond de breuk en langs het wrak
  const pg = new THREE.BoxGeometry(1, 0.12, 1);
  const pl = new THREE.InstancedMesh(pg, wreckMat, 70);
  for (let i = 0; i < 70; i++) {
    const nearBreak = i < 30;
    const z = nearBreak ? -4 + (R() - 0.5) * 16 : WR.z0 + R() * (WR.z1 - WR.z0);
    const x = nearBreak ? WR.xk - 3 + R() * 18 : (R() < 0.5 ? WR.xk - 2 - R() * 6 : WR.xk + WR.D + 1 + R() * 7);
    d.position.set(x, tuSeabed(x, z) + 0.15, z);
    d.rotation.set((R() - 0.5) * 0.9, R() * 6, (R() - 0.5) * 0.9);
    d.scale.set(0.8 + R() * 2.6, 1 + R() * 1.5, 0.5 + R() * 1.6);
    d.updateMatrix();
    pl.setMatrixAt(i, d.matrix);
  }
  pl.instanceMatrix.needsUpdate = true;
  pl.computeBoundingSphere();
  scene.add(pl);
}

/* ---------------- bodem ---------------- */
function makeFloor(scene, q) {
  const W = 240, D = 240, cx = -60;
  const geo = new THREE.PlaneGeometry(W, D, q === 'laag' ? 100 : 170, q === 'laag' ? 100 : 170);
  geo.rotateX(-Math.PI / 2);
  geo.translate(cx, 0, 0);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const col = new Float32Array(pos.count * 3);
  const sand = new THREE.Color('#9a9894'), sand2 = new THREE.Color('#7c7a76'), beach = new THREE.Color('#6e6a66'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, tuSeabed(x, z));
    uv.setXY(i, x / 4, z / 4);
    c.copy(sand).lerp(sand2, fbm(x * 0.05 + 7, z * 0.05));
    if (x > -8) c.lerp(beach, Math.min(1, (x + 8) / 6));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mat = uw(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), { caus: true, key: 'tuFloor' });
  tileTex('img/tulamben/zand.webp', 1024, (t) => { mat.map = t; mat.needsUpdate = true; });
  scene.add(new THREE.Mesh(geo, mat));
}

/* ---------------- tuinalen: steken uit het zand en duiken weg als je te dichtbij komt ---------------- */
function makeGardenEels(scene, F) {
  const R = rng(5150);
  const geo = new THREE.CylinderGeometry(0.016, 0.02, 1, 6, 12, true);
  geo.translate(0, 0.5, 0);
  // wit met zwarte stippen
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256;
  const g = cv.getContext('2d'); g.fillStyle = '#f2efe6'; g.fillRect(0, 0, 64, 256);
  g.fillStyle = '#1a1a1a';
  for (let i = 0; i < 260; i++) { g.beginPath(); g.arc(R() * 64, R() * 256, 1.2 + R() * 1.6, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#222'; g.fillRect(0, 248, 64, 8); // kopje
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = uw(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), {
    caus: true, key: 'tuEel', vertexPars: 'uniform float uTime;\n',
    vertexBegin: `{
      vec4 ip = vec4(0.0, 0.0, 0.0, 1.0);
      #ifdef USE_INSTANCING
        ip = instanceMatrix * ip;
      #endif
      float h = position.y;
      // vraagteken-vorm, kop in de stroming, zachtjes wiegend
      transformed.x += (h * h * 0.18 + sin(uTime * 1.6 + ip.x * 3.1 + ip.z * 2.3) * 0.05 * h);
      transformed.z += cos(uTime * 1.2 + ip.z * 2.7) * 0.03 * h;
    }`,
  });
  const fields = [{ x: -19, z: 28 }, { x: -23, z: 40 }, { x: -16, z: 46 }];
  const eels = [];
  fields.forEach((f) => {
    for (let i = 0; i < 26; i++) {
      const x = f.x + (R() - 0.5) * 7, z = f.z + (R() - 0.5) * 7;
      eels.push({ x, z, y: tuSeabed(x, z) - 0.05, h: 0.42 + R() * 0.28, out: 1, ry: R() * 0.6 - 0.3 });
    }
    // voor het fototoestel: één 'tuinaal' per veld
    const o = new THREE.Object3D(); o.position.set(f.x, tuSeabed(f.x, f.z) + 0.25, f.z);
    F.lurkers.push({ m: o, spc: DG.SPECIES.tuinaal, L: 0.35, hidden: false });
  });
  const mesh = new THREE.InstancedMesh(geo, mat, eels.length);
  mesh.computeBoundingSphere = function () { this.boundingSphere = new THREE.Sphere(new THREE.Vector3(-19, -9, 38), 16); };
  scene.add(mesh);
  const d = new THREE.Object3D();
  const put = () => {
    eels.forEach((e, i) => {
      d.position.set(e.x, e.y, e.z);
      d.rotation.set(0, e.ry, 0);
      d.scale.set(1, Math.max(0.02, e.h * e.out), 1);
      d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  put();
  return (dt, env) => {
    if (!env.diver) return;
    let changed = false;
    for (const e of eels) {
      const dd = Math.hypot(env.diver.x - e.x, env.diver.z - e.z) + Math.max(0, env.diver.y - e.y - 1.5) * 0.5;
      const want = dd < 2.2 ? 0 : dd < 3.4 ? 0.4 : 1;
      const nv = e.out + (want - e.out) * Math.min(1, dt * (want < e.out ? 4 : 0.35));
      if (Math.abs(nv - e.out) > 0.002) { e.out = nv; changed = true; }
    }
    if (changed) put();
  };
}

/* ---------------- dieren ---------------- */
const TU_MODELS = ['bultkop', 'grootoog_trevally', 'wimpelvis', 'batvis', 'kogelvis', 'koraalduivel', 'chromis_blauw', 'glasvisje',
  'bultkop-ver', 'grootoog_trevally-ver', 'wimpelvis-ver', 'batvis-ver', 'kogelvis-ver', 'koraalduivel-ver', 'chromis_blauw-ver',
  'naaktslak', 'reuzenkikvorsvis', 'reuzenmurene', 'groene_schildpad'];
const CORAL_MODELS = ['tafelkoraal', 'zachtkoraal', 'hersenkoraal', 'sterkoraal', 'bekerkoraal', 'korstspons', 'tonspons', 'vaasspons', 'buisspons', 'schroef', 'kanon', 'ketel'];
function hangSpots() {
  // naast het wrak (niet erin!), boven het dak, in de ruimen en bij de tuinalen
  return [
    { x: -33, z: -30, d: 12 }, { x: -33, z: 10, d: 13 }, { x: -34, z: 40, d: 14 }, { x: -57, z: -10, d: 14 },
    { x: -46, z: -67, d: 10 }, { x: -20, z: 30, d: 8 }, { x: -62, z: 30, d: 16 },
    { x: -45, z: -27, d: 15 }, { x: -45, z: 27, d: 16 }, { x: -28, z: -20, d: 9 },
    { x: -45, z: -15, d: 3 }, { x: -45, z: 30, d: 4.5 },
  ];
}
const GLASS = { id: 'glasvisje', name: 'Glasvisjes', size: 0.09, ds: 1, art: { t: 'fish', shape: 'oval' }, log: false };
function comp(F, S, k) {
  const H = F.hang;
  const around = [H[0], H[1], H[2], H[3], H[4], H[9]];
  if (S.bultkop) F.addSchool(S.bultkop, Math.round(14 * k), { spread: 3.2, speed: 0.35, home: H[1], roam: 0.45, range: 8, spots: around });
  if (S.grootoog_trevally) F.addSchool(S.grootoog_trevally, Math.round(90 * k), { spread: 3.4, speed: 0.6, home: H[6], roam: 0.02, range: 3, depth: [12, 18] });
  if (S.wimpelvis) F.addSchool(S.wimpelvis, Math.round(12 * k), { spread: 1.8, speed: 0.25, home: H[0], roam: 0.25, range: 6, spots: around });
  if (S.batvis) F.addSchool(S.batvis, Math.round(6 * k), { spread: 1.6, speed: 0.2, home: H[4], roam: 0.08, range: 3, depth: [8, 12] });
  if (S.chromis_blauw) {
    F.addSchool(S.chromis_blauw, Math.round(60 * k), { spread: 1.4, speed: 0.2, home: H[10], roam: 0.05, range: 3, depth: [2.5, 4] });
    F.addSchool(S.chromis_blauw, Math.round(50 * k), { spread: 1.3, speed: 0.2, home: H[11], roam: 0.05, range: 3, depth: [3.5, 5.5] });
  }
  // glasvisjes in de donkere ruimen
  if (hasModel('glasvisje')) {
    F.addSchool(GLASS, Math.round(220 * k), { spread: 1.6, speed: 0.15, home: H[7], roam: 0, range: 1.2, depth: [14.5, 16.5] });
    F.addSchool(GLASS, Math.round(160 * k), { spread: 1.5, speed: 0.15, home: H[8], roam: 0, range: 1.2, depth: [15.5, 17.5] });
  }
  for (let i = 0; i < 3; i++) F.addSolo(S.koraalduivel, { kind: 'hover', home: H[[0, 4, 1][i]], radius: 3, speed: 0.08 });
  for (let i = 0; i < 2; i++) F.addSolo(S.kogelvis, { radius: 8, speed: 0.2, home: H[[3, 2][i]] });
}
function extra(F, scene, { rand }, ground) {
  const S = DG.SPECIES;
  const onTop = () => { // ergens op de bovenkant van het wrak
    for (let g = 0; g < 40; g++) {
      const z = rand(-55, 50), x = rand(WR.xk + 3, WR.xk + WR.D - 1);
      if (inHole(z, 0.12)) continue;
      return { x, z, y: ground(x, z), a: Math.random() * Math.PI * 2 };
    }
    return { x: -45, z: -20, y: ground(-45, -20), a: 0 };
  };
  // reuzenkikvorsvissen zitten als oranje sponzen op het wrak
  for (let i = 0; i < 2; i++) F.addCrawler('reuzenkikvorsvis', { at: onTop, scale: 0.42, L: 0.32, ground });
  // naaktslakken kruipen over de romp
  for (let i = 0; i < 4; i++) F.addCrawler('naaktslak', { at: onTop, rot: [0, Math.PI * 0.75, 0], scale: 0.1, L: 0.07, moving: true, speed: 0.008, range: 0.5, ground });
  // reuzenmurenen in de breuk en onder wrakstukken
  for (let i = 0; i < 2; i++) {
    F.addCrawler('reuzenmurene', { at: () => ({ x: WR.xk + WR.D + rand(1.2, 2.2), z: rand(-50, 30), a: Math.PI / 2 + rand(-0.4, 0.4) }), rot: [0, Math.PI / 2, 0], scale: 1.9, L: 1.6,
      wave: 'transformed.z += sin(uTime * 1.2 - position.x * 7.0) * 0.016 * (0.7 - position.x);' });
  }
  // een groene zeeschildpad graast op de bovenkant van het wrak
  if (Math.random() < 0.8) F.addTurtle('groene_schildpad', { x: -45, z: -16, box: { x: [WR.xk + 2, WR.xk + WR.D - 2], z: [-36, -10] }, ground });
}

/* ---------------- profiel ---------------- */
export const tulamben = {
  id: 'tulamben',
  loadTitle: 'Liberty-wrak laden…',
  temp: 27,
  tank: { L: 11.1, bar: 200, name: 'aluminium 80 · 200 bar' },
  lead: '8 kg aan de loodgordel',
  nightOk: false,
  challenges: () => 'tulamben',
  bounds: { x: [-115, 6], z: [-110, 110] },
  start: { p: [-1, -0.25, -8], buddy: [-1.3, -0.3, -5.5], yaw: Math.PI / 2 },
  touchTxt: 'het wrak',
  solidMsg: 'Je raakt het wrak. Pas op voor scherpe randen en het kwetsbare koraal: houd afstand.',
  water() {
    // helder tropisch water, zwart zand: ± 20 m zicht
    UW.uAbs.value.set(0.13, 0.042, 0.026);
    UW.uDown.value.set(0.07, 0.02, 0.0095);
    return { top: 0x7ae2f6, deep: 0x1765a6, exposure: 1.5, hemi: [0xe0f6ff, 0x8a8478, 2.3], sun: [0xfff2dc, 3.0], caus: 1, rays: true };
  },
  inShadow: () => false,
  isReef: () => false,
  reefMsg: '',
  pillarMsg: 'Je raakt het wrak. Houd afstand van het koraal.',
  async build({ scene, q, loading }) {
    setSeabed(tuSeabed);
    await loadModels(CORAL_MODELS.concat(TU_MODELS));
    makeFloor(scene, q);
    await loading('Het wrak van de Liberty…');
    const wmat = wreckMaterial(q);
    const hull = new THREE.Mesh(hullGeometry(q), wmat);
    const deck = new THREE.Mesh(deckGeometry(q), wmat);
    scene.add(hull, deck);
    const house = houseGeometries().map((g) => { const m = new THREE.Mesh(g, wmat); scene.add(m); return m; });
    // spanten
    const ribs = ribList();
    const rg = new THREE.BoxGeometry(0.22, 0.3, 1); rg.translate(0, 0, 0.5);
    const ribMat = uw(new THREE.MeshStandardMaterial({ color: 0x8a6a58, roughness: 0.9 }), { caus: true, key: 'tuRib' });
    const rm = new THREE.InstancedMesh(rg, ribMat, ribs.length);
    const d = new THREE.Object3D();
    ribs.forEach((r, i) => { d.position.copy(r.a); d.lookAt(r.b); d.scale.set(1, 1, r.a.distanceTo(r.b) + 0.05); d.updateMatrix(); rm.setMatrixAt(i, d.matrix); });
    rm.instanceMatrix.needsUpdate = true; rm.computeBoundingSphere();
    scene.add(rm);
    // luikhoofden rond de ruimen
    const cm = [];
    for (const h of HATCH) {
      const zc = (h.z[0] + h.z[1]) / 2, B = WR.B * beamK(zc), w0 = (h.w[0] * 2 - 1) * B, w1 = (h.w[1] * 2 - 1) * B, ym = yMid(zc);
      cm.push([h.z[1] - h.z[0], 0.25, ym + w0, zc], [h.z[1] - h.z[0], 0.25, ym + w1, zc]);
      cm.push([0.25, w1 - w0, ym + (w0 + w1) / 2, h.z[0]], [0.25, w1 - w0, ym + (w0 + w1) / 2, h.z[1]]);
    }
    cm.forEach(([lz, ly, y, z]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, Math.max(0.25, ly), Math.max(0.25, lz)), wmat); b.position.set(WR.xk + WR.D + 0.45, y, z); scene.add(b); });
    // masten: van het dek schuin op het zand richting strand
    SOLIDS.length = 0;
    for (const zm of [-34, 33]) {
      const a = new THREE.Vector3(WR.xk + WR.D, yMid(zm), zm), bx = WR.xk + WR.D + 15, b = new THREE.Vector3(bx, tuSeabed(bx, zm + 2) + 0.35, zm + 2);
      const len = a.distanceTo(b);
      const cg = new THREE.CylinderGeometry(0.28, 0.38, len, 12, 1); cg.translate(0, len / 2, 0);
      const mm = new THREE.Mesh(cg, wmat); mm.position.copy(a); mm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); scene.add(mm);
      SOLIDS.push({ a, b, r: 0.4 });
      // dwarsboom
      const mid = a.clone().lerp(b, 0.45), bg = new THREE.CylinderGeometry(0.16, 0.16, 7, 8); const bm = new THREE.Mesh(bg, wmat);
      bm.position.copy(mid); bm.rotation.set(0, 0, 0); bm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.25, 1).normalize()); scene.add(bm);
      SOLIDS.push({ a: mid.clone().add(new THREE.Vector3(0, -0.85, -3.4)), b: mid.clone().add(new THREE.Vector3(0, 0.85, 3.4)), r: 0.22 });
    }
    // schroef met roer achter de spiegel, kanon op het achterdek, ketel in de breuk
    const aft = new THREE.Vector3(0, 0, -1), shipUp = new THREE.Vector3(1, 0, 0);
    if (placeModel(scene, 'schroef', 9, new THREE.Vector3(WR.xk + 3.2, yMid(WR.z0), WR.z0 - 3.2), aft, shipUp)) {
      SOLIDS.push({ a: new THREE.Vector3(WR.xk + 3.2, yMid(WR.z0), WR.z0 - 0.5), b: new THREE.Vector3(WR.xk + 3.2, yMid(WR.z0), WR.z0 - 5.5), r: 1.3 });
    }
    if (placeModel(scene, 'kanon', 4.2, new THREE.Vector3(WR.xk + WR.D + 1.6, yMid(-53), -53), aft, shipUp)) {
      SOLIDS.push({ a: new THREE.Vector3(WR.xk + WR.D, yMid(-53), -53), b: new THREE.Vector3(WR.xk + WR.D + 2.6, yMid(-53), -53.5), r: 0.9 });
    }
    {
      const kx = WR.xk + 4.5, kz = -4;
      const by = tuSeabed(kx, kz) + 1.2;
      if (placeModel(scene, 'ketel', 5.2, new THREE.Vector3(kx, by, kz), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0))) {
        SOLIDS.push({ a: new THREE.Vector3(kx, by, kz - 1.8), b: new THREE.Vector3(kx, by, kz + 1.8), r: 1.25 });
      }
    }
    setSolid(wreckSolid);
    await loading('Koraal, waaiers en sponzen…');
    makeRocks(scene, q, wmat);
    makeCorals(scene, q);
    await loading('Bultkoppen, trevally’s en tuinalen…');
    const ground = makeRayGround(tuSeabed, [hull, deck, ...house], 2);
    const fauna = new Fauna(scene, q, { site: 'tulamben', hang: hangSpots(), comp, extra: (F, sc, h) => extra(F, sc, h, ground) });
    fauna.onUpdate = makeGardenEels(scene, fauna);
    return { pillars: [], fauna };
  },
  startMsg() {
    return 'Je staat tot je middel in het water op de zwarte keien van Tulamben. Het wrak ligt ± 40 m recht voor je, evenwijdig aan het strand. Laat lucht uit je vest (▼ of F) en volg het zwarte zand naar beneden.';
  },
  conditions() {
    // meestal rustig; soms staat er branding op het keienstrand
    return {
      cur: new THREE.Vector3(0, 0, 0), curTxt: 'geen tot zwak',
      route: 'Zwem vanaf het strand recht naar het wrak (± 40 m, kompas 270°). Begin bij de achtersteven met de schroef en het kanon, zwem over de breuk naar de boeg en kom over de bovenkant van het wrak terug. Halverwege het strand liggen de tuinalen.',
      ship: Math.random() < 0.08,
    };
  },
  brief: {
    photos: '<img src="img/tulamben/wrak.webp" alt="Het begroeide wrak op het zwarte zand (illustratie)"><img src="img/tulamben/strand.webp" alt="Het keienstrand van Tulamben met de vulkaan (illustratie)">',
    title: 'USAT Liberty-wrak, Tulamben',
    name: 'het Liberty-wrak',
    grid: (curTxt) => '<div><small>Water</small>27 °C · zicht ± 20 m</div><div><small>Ingang</small>Kantduik over zwarte keien</div>' +
      '<div><small>Stroming</small>' + curTxt + '</div><div><small>Diepte</small>wrak 5–25 m · zand tot 30 m</div>',
    nightLead: '',
    rulesTitle: 'Afspraken bij het Liberty-wrak',
    rules: ['Ik raak het wrak en het koraal niet aan en neem niets mee', 'Ik zwem alleen door open delen van het wrak, nooit dieper een ruimte in', 'Ik doe mijn vinnen pas in het water aan (glibberige keien)', 'Ik blijf binnen de diepte van mijn brevet'],
    rulesToast: 'Vink eerst de afspraken voor het Liberty-wrak af.',
    blocked: '<h2>Branding op het strand</h2><p class="lead">Er staan vandaag hoge golven op het keienstrand. In- en uitstappen is dan gevaarlijk. Wacht tot het rustiger is.</p>',
    waitLabel: 'Wacht tot de zee rustiger is',
    waitHours: 3,
  },
};
