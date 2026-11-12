/* Diepblauw 3D — Elphinstone Reef in de Rode Zee.
   Een lang, smal rif midden in zee: de rifkam ligt op ± 3 m, aan beide kanten vallen bijna
   loodrechte wanden vol zacht koraal en waaiers weg tot 50 m. In het zuiden zakt het rif naar
   een breed plateau op ± 29 m, waar je soms hamerhaaien ziet; onder de safariboot patrouilleert
   in het najaar de longimanus. Heel helder water en meestal stevige stroming langs het rif.
   Assen: het rif loopt langs z (noord = +z), x = dwars op het rif (0 = midden van de kam). */
import * as THREE from 'three';
import { UW, uw } from './water.js';
import { setSeabed, setSolid, floorNoise as fbm } from './terrain.js';
import { loadModels, hasModel, modelGeo, modelMap } from './models.js';
import { Fauna } from './creatures3d.js';
import { rng, smooth, tileTex, scatterModels, makeCuller } from './sitekit.js';
import { swayMat } from './terrain.js';

const DG = window.DG;
const FLOOR = -50, WALL = 3.6;

/* ---------------- vorm van het rif ---------------- */
function topY(z) {
  if (z > 72) return -3 - smooth((z - 72) / 30) * 30;   // de noordpunt loopt af
  if (z < -50) return -3 - smooth((-50 - z) / 22) * 26; // naar het zuidplateau op ± 29 m
  return -3;
}
function edge(x, z) {
  let w = 7 + Math.sin(z * 0.045) * 2 + (fbm(z * 0.08, x > 0 ? 1 : 5) - 0.5) * 2.5;
  if (z < -55) w += smooth((-55 - z) / 25) * 20; // het zuidplateau is breed
  return { w, t: topY(z) };
}
// echte hoogte van het rif (met wanden)
function ridgeH(x, z) {
  const ax = Math.abs(x), { w, t } = edge(x, z);
  const tt = t + (fbm(x * 0.2, z * 0.2) - 0.5) * 1.2;
  if (ax <= w) return tt;
  if (ax >= w + WALL) return FLOOR + (fbm(x * 0.03, z * 0.03) - 0.5) * 3;
  return tt + (FLOOR - tt) * Math.pow((ax - w) / WALL, 0.85);
}
// bodem voor duiker en vissen: de wand zelf doet de botsing (anders 'spring' je de wand op)
function elSeabed(x, z) {
  const ax = Math.abs(x), { w } = edge(x, z);
  if (ax > w && ax < w + WALL) return FLOOR;
  return ridgeH(x, z);
}
const _push = new THREE.Vector3();
function elSolid(p, r) {
  const ax = Math.abs(p.x), s = p.x >= 0 ? 1 : -1, { w, t } = edge(p.x, p.z);
  if (ax < w - 0.4 || ax > w + WALL + r || p.y > t) return null;
  const f = Math.pow(Math.min(1, Math.max(0, (t - p.y) / (t - FLOOR))), 1 / 0.85);
  const xw = w + f * WALL;
  if (ax < xw + r) return _push.set(s * (xw + r - ax), 0, 0);
  return null;
}

/* ---------------- het rif als mesh: dwarsprofiel langs het rif ---------------- */
function ridgeGeometry(q) {
  const dz = q === 'laag' ? 1.4 : 0.9, z0 = -112, z1 = 106;
  const nz = Math.ceil((z1 - z0) / dz) + 1;
  // per rij: links bodem, linkerwand, kam, rechterwand, rechts bodem (dicht bij de wanden veel punten)
  const nF = 6, nW = q === 'laag' ? 12 : 18, nT = q === 'laag' ? 12 : 18;
  const pos = [], uvs = [], cols = [], idx = [];
  const cTop = new THREE.Color('#e8d8c8'), cWall = new THREE.Color('#d0b8c8'), cDeep = new THREE.Color('#8a8a90'), c = new THREE.Color();
  let row = 0;
  for (let i = 0; i < nz; i++) {
    const z = Math.min(z1, z0 + i * dz);
    const xs = [];
    const eL = edge(-1, z), eR = edge(1, z);
    for (let k = 0; k < nF; k++) xs.push(-60 + (k / nF) * (60 - (eL.w + WALL + 0.4)));
    for (let k = 0; k < nW; k++) xs.push(-(eL.w + WALL + 0.4) + (k / nW) * (WALL + 0.8));
    for (let k = 0; k < nT; k++) xs.push(-(eL.w - 0.4) + (k / nT) * (eL.w - 0.4 + eR.w - 0.4));
    for (let k = 0; k < nW; k++) xs.push((eR.w - 0.4) + (k / nW) * (WALL + 0.8));
    for (let k = 0; k <= nF; k++) xs.push((eR.w + WALL + 0.4) + (k / nF) * (60 - (eR.w + WALL + 0.4)));
    let arc = 0, px = 0, py = 0;
    xs.forEach((x, k) => {
      let y = ridgeH(x, z);
      const ax = Math.abs(x), e = x < 0 ? eL : eR;
      const onWall = ax > e.w - 0.2 && ax < e.w + WALL + 0.2;
      // ruwe wand: uitsteeksels en richels
      let xx = x;
      if (onWall) xx += Math.sign(x) * (fbm(y * 0.25 + 7, z * 0.22) - 0.5) * 0.9;
      if (k > 0) arc += Math.hypot(xx - px, y - py);
      px = xx; py = y;
      pos.push(xx, y, z);
      uvs.push(z / 4, arc / 4);
      if (y < -40) c.copy(cDeep); else if (onWall) c.copy(cWall).lerp(cTop, fbm(y * 0.2, z * 0.2)); else c.copy(cTop);
      cols.push(c.r, c.g, c.b);
    });
    row = xs.length;
  }
  for (let i = 0; i < nz - 1; i++) {
    for (let k = 0; k < row - 1; k++) {
      const a = i * row + k, b = a + row;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function makeReef(scene, q) {
  const mat = uw(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), { caus: true, key: 'elReef' });
  tileTex('img/raja/rifbodem.webp', 1024, (t) => { t.repeat.set(0.8, 0.8); mat.map = t; mat.bumpMap = t; mat.bumpScale = 1.6; mat.needsUpdate = true; });
  scene.add(new THREE.Mesh(ridgeGeometry(q), mat));
  // de diepe bodem rondom (zand op 50 m, valt bijna weg in het blauw)
  const fg = new THREE.PlaneGeometry(600, 600, 1, 1); fg.rotateX(-Math.PI / 2);
  const fm = uw(new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 1 }), { caus: false, key: 'elDeep' });
  const fl = new THREE.Mesh(fg, fm); fl.position.y = FLOOR - 1.2; scene.add(fl);
}

/* ---------------- koraal op de kam en tegen de wanden ---------------- */
function wallSpots(R, n, yMin, yMax) {
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 10) {
    const z = -95 + R() * 180, s = R() < 0.5 ? -1 : 1;
    const { w, t } = edge(s, z);
    const y = t - yMin - R() * (yMax - yMin);
    if (y < FLOOR + 2) continue;
    const f = Math.pow(Math.min(1, Math.max(0, (t - y) / (t - FLOOR))), 1 / 0.85);
    const x = s * (w + f * WALL);
    out.push({ x, y, z, s });
  }
  return out;
}
function placeWallModels(scene, list, R, sets, key) {
  const meshes = [];
  const up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3(), qq = new THREE.Quaternion(), tw = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  let i0 = 0;
  for (const set of sets) {
    if (!hasModel(set.id)) { i0 += set.n; continue; }
    const groups = new Map();
    for (let i = 0; i < set.n && i0 + i < list.length; i++) {
      const p = list[i0 + i];
      // koraal groeit schuin naar buiten en omhoog uit de wand
      nrm.set(p.s * (0.75 + R() * 0.25), 0.35 + R() * 0.5, (R() - 0.5) * 0.3).normalize();
      qq.setFromUnitVectors(up, nrm); tw.setFromAxisAngle(up, R() * Math.PI * 2); qq.multiply(tw);
      const s = set.size[0] + R() * (set.size[1] - set.size[0]);
      pos.set(p.x - p.s * 0.25, p.y, p.z);
      const k = Math.floor(p.z / 25) + ',' + p.s;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push({ m: m4.compose(pos, qq, sc.set(s, s, s)).clone(), c: new THREE.Color(1, 1, 1).lerp(new THREE.Color(set.cols[i % set.cols.length]), 0.35) });
    }
    i0 += set.n;
    const mat = uw(new THREE.MeshStandardMaterial({ map: modelMap(set.id), roughness: 0.85, side: THREE.DoubleSide }), { caus: true, key: key + set.id });
    const geo = modelGeo(set.id, 'reef');
    groups.forEach((gl) => {
      const mesh = new THREE.InstancedMesh(geo, mat, gl.length);
      gl.forEach((it, j) => { mesh.setMatrixAt(j, it.m); mesh.setColorAt(j, it.c); });
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      scene.add(mesh); meshes.push(mesh);
    });
  }
  return meshes;
}
function makeWallFans(scene, list, R) {
  const photo = new THREE.TextureLoader().load('img/waaier.webp');
  photo.colorSpace = THREE.SRGBColorSpace; photo.anisotropy = 4;
  const g = new THREE.PlaneGeometry(1.3, 1.3 * 0.98, 6, 6); g.translate(0, 0.55, 0);
  const mat = swayMat({ color: 0xffffff, map: photo, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9, key: 'elFan' });
  const groups = new Map(), d = new THREE.Object3D(), cols = ['#e05030', '#f08040', '#d84060', '#f0c040', '#c070e0'];
  list.forEach((p, i) => {
    const k = Math.floor(p.z / 25) + ',' + p.s;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({ p, s: 1.0 + R() * 1.8, c: new THREE.Color(cols[i % cols.length]).lerp(new THREE.Color(1, 1, 1), 0.25), tilt: (R() - 0.5) * 0.5 });
  });
  const meshes = [];
  groups.forEach((gl) => {
    const mesh = new THREE.InstancedMesh(g, mat, gl.length);
    gl.forEach((it, j) => {
      // waaiers staan haaks op de wand, dwars op de stroming
      d.position.set(it.p.x + it.p.s * 0.55 * it.s, it.p.y - 0.2 * it.s, it.p.z);
      d.rotation.set(0, (Math.random() - 0.5) * 0.4, it.p.s * (0.25 + it.tilt));
      d.scale.setScalar(it.s); d.updateMatrix();
      mesh.setMatrixAt(j, d.matrix); mesh.setColorAt(j, it.c);
    });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    scene.add(mesh); meshes.push(mesh);
  });
  return meshes;
}
function makeCorals(scene, q) {
  const R = rng(2024);
  const dense = q === 'laag' ? 0.4 : q === 'midden' ? 0.7 : 1;
  // op de kam
  const top = (x, z) => { const e = edge(x, z); return Math.abs(x) < e.w - 0.6 && z > -105 && z < 95; };
  const spot = (r) => [(r() - 0.5) * 60, -105 + r() * 200];
  const placed = scatterModels(scene, [
    { id: 'tafelkoraal', n: 160, size: [1.0, 2.6], cols: ['#d8e0c0', '#c8d8b8', '#e0d0b0'], where: top, flat: true },
    { id: 'hertshoornkoraal', n: 220, size: [0.7, 1.8], cols: ['#d0b8e0', '#c8c0a0', '#e0c8a8'], where: top },
    { id: 'hersenkoraal', n: 120, size: [0.6, 1.6], cols: ['#e8d8a0', '#c8d890', '#d8c0c8'], where: top },
    { id: 'zachtkoraal', n: 160, size: [0.7, 1.6], cols: ['#ff90b0', '#e070d0', '#ff9070', '#b080f0'], where: top, double: true },
    { id: 'sterkoraal', n: 90, size: [0.7, 1.6], cols: ['#d0c8a0', '#c0d0b0'], where: top },
    { id: 'bekerkoraal', n: 90, size: [0.5, 1.1], cols: ['#f0a060', '#f0c070'], where: top },
    { id: 'anemoon', n: 12, size: [0.8, 1.2], cols: ['#ffffff'], tint: 0, where: (x, z) => top(x, z) && z > -45 && z < 70 },
  ], { R, spot, ground: elSeabed, dense, key: 'elT' });
  // tegen de wanden: vooral zacht koraal en waaiers (Elphinstone staat erom bekend)
  const wsets = [
    { id: 'zachtkoraal-lo', n: Math.round(900 * dense), size: [1.0, 2.4], cols: ['#ff90b0', '#e070d0', '#ff9070', '#ffd0a0', '#b080f0', '#f05080'] },
    { id: 'korstspons', n: Math.round(300 * dense), size: [0.7, 1.5], cols: ['#e07050', '#c060a0', '#f0a040'] },
    { id: 'buisspons', n: Math.round(180 * dense), size: [0.7, 1.4], cols: ['#c090d0', '#f0b060'] },
    { id: 'tafelkoraal', n: Math.round(110 * dense), size: [1.0, 2.2], cols: ['#d8e0c0', '#c8d8b8'] },
    { id: 'bekerkoraal', n: Math.round(220 * dense), size: [0.6, 1.3], cols: ['#f0a060', '#f0c070', '#e88070'] },
  ];
  // de bovenste 22 m van de wand is het dichtst begroeid
  const wl = wallSpots(R, wsets.reduce((a, s) => a + s.n, 0), 0.5, 22);
  const wm = placeWallModels(scene, wl, R, wsets, 'elW');
  const fm = makeWallFans(scene, wallSpots(R, Math.round(420 * dense), 3, 30), R);
  return { anemones: placed.filter((p) => p.id === 'anemoon'), meshes: placed.meshes.concat(wm, fm) };
}

/* ---------------- boven water: de safariboot ---------------- */
function makeBoat(scene) {
  if (!hasModel('safariboot')) return;
  const g = modelGeo('safariboot', 'center');
  g.scale(30, 30, 30);
  // het model ligt al in de lengte langs z, dus langs het rif
  g.computeBoundingBox();
  const m = new THREE.Mesh(g, uw(new THREE.MeshStandardMaterial({ map: modelMap('safariboot'), roughness: 0.6 }), { caus: false, key: 'elBoat' }));
  m.position.set(24, -1.8 - g.boundingBox.min.y, 66);
  scene.add(m);
}

/* ---------------- dieren ---------------- */
const EL_MODELS = ['longimanus', 'hamerhaai', 'grijze_rifhaai', 'koraalvlinder', 'sohal', 'picasso', 'tuimelaar', 'napoleon', 'juweelbaarsje', 'chromis_blauw', 'jacks', 'koraalduivel', 'rodezee_anemoonvis',
  'koraalvlinder-ver', 'sohal-ver', 'picasso-ver', 'napoleon-ver', 'juweelbaarsje-ver', 'chromis_blauw-ver', 'jacks-ver', 'koraalduivel-ver', 'rodezee_anemoonvis-ver',
  'reuzenmurene', 'groene_schildpad'];
const CORAL_MODELS = ['tafelkoraal', 'hertshoornkoraal', 'hersenkoraal', 'zachtkoraal', 'zachtkoraal-lo', 'sterkoraal', 'bekerkoraal', 'korstspons', 'buisspons', 'anemoon', 'safariboot'];
function hangSpots() {
  return [
    // vlak voor de wanden (de wand ligt op ± 9–10 m van het midden)
    { x: 12.5, z: 40, d: 9 }, { x: -12.5, z: 20, d: 10 }, { x: 12.5, z: -5, d: 12 }, { x: -12.5, z: -30, d: 14 },
    { x: 0, z: 30, d: 2.2 }, { x: 0, z: 0, d: 2.2 }, { x: 22, z: 10, d: 16 }, { x: 13, z: 60, d: 8 }, { x: -13, z: 55, d: 9 },
  ];
}
function comp(F, S, k, { rand }, info) {
  const H = F.hang;
  // wolken juweelbaarsjes langs de wanden
  if (S.juweelbaarsje) [H[0], H[1], H[2], H[3], H[7], H[8]].forEach((h, i) => F.addSchool(S.juweelbaarsje, Math.round((90 - i * 8) * k), { spread: 2.2, speed: 0.15, home: h, roam: 0, range: 3 }));
  if (S.chromis_blauw) [H[4], H[5]].forEach((h) => F.addSchool(S.chromis_blauw, Math.round(50 * k), { spread: 1.3, speed: 0.15, home: h, roam: 0, range: 2, depth: [3.5, 5] }));
  if (S.jacks) F.addSchool(S.jacks, Math.round(40 * k), { spread: 3, speed: 0.5, home: H[6], roam: 0.05, range: 6, depth: [12, 20] });
  // vissen op de kam
  for (let i = 0; i < 4; i++) F.addSolo(S.koraalvlinder, { radius: 6, speed: 0.2, home: [H[4], H[5]][i % 2], depth: [3.5, 7] });
  for (let i = 0; i < 3; i++) F.addSolo(S.sohal, { radius: 4, speed: 0.3, home: [H[4], H[5]][i % 2], depth: [3.2, 5] });
  for (let i = 0; i < 2; i++) F.addSolo(S.picasso, { radius: 5, speed: 0.2, home: [H[4], H[5]][i % 2], depth: [3.5, 6] });
  for (let i = 0; i < 2; i++) F.addSolo(S.koraalduivel, { kind: 'hover', home: [H[0], H[3]][i], radius: 2.5, speed: 0.08 });
  F.addSolo(S.napoleon, { kind: 'curious', home: H[2], radius: 18, speed: 0.4, depth: [6, 20] });
  // Rode Zee-anemoonvissen bij de anemonen
  (info.anemones || []).forEach((a) => {
    for (let i = 0; i < 2; i++) F.addSolo(S.rodezee_anemoonvis, { kind: 'hover', home: { x: a.x, z: a.z, d: -a.y - 0.5 * a.s - 0.25 }, radius: 0.35 * a.s, speed: 0.08 });
  });
}
function extraAnimals(F, scene, { rand }) {
  const S = DG.SPECIES;
  const tail = 'transformed.z += sin(uTime * 2.6 - position.x * 5.0) * 0.035 * (0.55 - position.x);';
  // longimanus: nieuwsgierig, vlak onder de boot
  if (Math.random() < 0.7) F.addCruiser('longimanus', { rot: [0, -Math.PI / 2, 0], center: { x: 22, z: 62 }, r: 13, depth: 5, speed: 1.1, scale: S.longimanus.size, wave: tail });
  // hamerhaaien in het blauw voorbij het zuidplateau (± 37 m)
  if (Math.random() < 0.6) for (let i = 0; i < 3; i++) F.addCruiser('hamerhaai', { rot: [0, -Math.PI / 2, 0], center: { x: i < 2 ? 46 : -46, z: -86 + i * 4 }, r: 7 + i * 1.5, depth: 36 + i, speed: 1.2 + i * 0.1, scale: S.hamerhaai.size, wave: tail });
  // grijze rifhaaien langs de wanden
  F.addCruiser('grijze_rifhaai', { rot: [0, -Math.PI / 2, 0], center: { x: 24, z: 0 }, r: 8, depth: 20, speed: 1.3, scale: S.grijze_rifhaai.size, wave: tail });
  F.addCruiser('grijze_rifhaai', { rot: [0, -Math.PI / 2, 0], center: { x: -24, z: 28 }, r: 8, depth: 24, speed: 1.2, scale: S.grijze_rifhaai.size, wave: tail });
  // een groepje tuimelaars (niet altijd)
  if (Math.random() < 0.4) {
    const fluke = 'transformed.y += sin(uTime * 3.0 - position.x * 4.0) * 0.04 * max(0.0, -position.x);';
    for (let i = 0; i < 4; i++) F.addCruiser('tuimelaar', { rot: [0, -Math.PI / 2, 0], center: { x: 32 + i * 0.8, z: 30 }, r: 16 + i * 1.6, depth: 2.5 + (i % 2) * 1.5, speed: 2.6 + i * 0.12, scale: S.tuimelaar.size * 0.9, wave: fluke });
  }
  // reuzenmurene in een spleet op de kam, groene zeeschildpad
  F.addCrawler('reuzenmurene', { at: () => ({ x: rand(-4, 4), z: rand(-20, 40), a: Math.random() * Math.PI * 2 }), rot: [0, Math.PI / 2, 0], scale: 1.8, L: 1.6,
    wave: 'transformed.z += sin(uTime * 1.2 - position.x * 7.0) * 0.016 * (0.7 - position.x);' });
  if (Math.random() < 0.6) F.addTurtle('groene_schildpad', { x: 0, z: 10, box: { x: [-5, 5], z: [-30, 50] } });
}

/* ---------------- profiel ---------------- */
export const elphinstone = {
  id: 'elphinstone',
  loadTitle: 'Elphinstone laden…',
  temp: 26,
  tank: { L: 11.1, bar: 200, name: 'aluminium 80 · 200 bar' },
  lead: '6 kg aan de loodgordel',
  nightOk: false,
  challenges: () => 'elphinstone',
  touchTxt: 'het koraal',
  solidMsg: 'Je raakt de rifwand. Houd afstand van het koraal: trim iets bij.',
  bounds: { x: [-60, 60], z: [-112, 104] },
  start: { p: [13, -0.25, 58], buddy: [13.5, -0.3, 60.5], yaw: Math.PI / 2 },
  water() {
    // de helderste duikstek van de game: Rode Zee-blauw
    UW.uAbs.value.set(0.1, 0.028, 0.016);
    UW.uDown.value.set(0.062, 0.018, 0.0085);
    return { top: 0x5ccdf6, deep: 0x0a4692, exposure: 1.38, hemi: [0xe0f6ff, 0x9a8c7a, 2.0], sun: [0xfff2dc, 3.0], caus: 1, rays: true };
  },
  inShadow: (x, z) => Math.abs(x - 24) < 5 && Math.abs(z - 66) < 15,
  isReef: (x, z) => Math.abs(x) < edge(x, z).w,
  reefMsg: 'Pas op: je raakt het koraal op de rifkam! Blijf er een armlengte boven.',
  pillarMsg: '',
  async build({ scene, q, loading }) {
    setSeabed(elSeabed); setSolid(elSolid);
    await loadModels(CORAL_MODELS.concat(EL_MODELS));
    makeReef(scene, q);
    await loading('Zacht koraal en waaiers op de wanden…');
    const info = makeCorals(scene, q);
    makeBoat(scene);
    await loading('Haaien, dolfijnen en juweelbaarsjes…');
    const fauna = new Fauna(scene, q, { site: 'elphinstone', hang: hangSpots(), comp: (F, S, k, h) => comp(F, S, k, h, info), extra: extraAnimals });
    fauna.onUpdate = makeCuller(info.meshes, q === 'laag' ? 50 : q === 'midden' ? 65 : 85);
    return { pillars: [], fauna };
  },
  startMsg(night, plan) {
    return 'Je ligt naast de safariboot, boven de oostwand bij de noordpunt van Elphinstone. ' + (plan.current.length() > 0.01 ? 'De stroming staat ' + plan.curTxt + '. ' : '') + 'Daal af langs de wand en houd hem aan je rechterhand. Kijk ook af en toe het blauw in.';
  },
  conditions() {
    // meestal stroming van noord naar zuid langs het rif
    const cur = new THREE.Vector3(0, 0, -(0.08 + Math.random() * 0.12));
    return {
      cur, curTxt: 'van noord naar zuid langs het rif',
      route: 'Daal af bij de noordpunt en drift met de stroming langs de oostwand naar het zuiden. Blijf op je eigen diepte: het zuidplateau ligt op 29 m, de hamerhaaien zwemmen nog dieper in het blauw. Keer om bij de helft van je lucht en doe je veiligheidsstop onder de boot.',
      ship: Math.random() < 0.12,
    };
  },
  brief: {
    photos: '<img src="img/elphinstone/wand.webp" alt="De rifwand met zacht koraal en een longimanus (illustratie)"><img src="img/elphinstone/boot.webp" alt="De safariboot boven Elphinstone (illustratie)">',
    title: 'Elphinstone Reef, Rode Zee',
    name: 'Elphinstone Reef',
    grid: (curTxt) => '<div><small>Water</small>26 °C · zicht ± 35 m</div><div><small>Ingang</small>Bootduik vanaf de safariboot</div>' +
      '<div><small>Stroming</small>' + curTxt + '</div><div><small>Diepte</small>kam 3 m · wanden tot 50 m · plateau 29 m</div>',
    nightLead: '',
    rulesTitle: 'Afspraken bij Elphinstone',
    rules: ['Ik blijf binnen de diepte van mijn brevet, ook als er hamerhaaien dieper zwemmen', 'Ik voer geen haaien en zwem niet achter ze aan', 'Bij een longimanus blijf ik dicht bij mijn buddy en kijk ik hem aan', 'Ik raak het koraal niet aan'],
    rulesToast: 'Vink eerst de afspraken voor Elphinstone af.',
    blocked: '<h2>Te veel golven</h2><p class="lead">De wind staat te hard en de golven bij het rif zijn te hoog. De kapitein vaart vandaag niet naar Elphinstone. Wacht op beter weer.</p>',
    waitLabel: 'Wacht op beter weer',
    waitHours: 12,
  },
};
