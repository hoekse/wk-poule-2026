/* Diepblauw 3D — Darwin Island, Galápagos.
   Een helling van enorme basaltblokken onder het steile eiland, met naast het eiland de twee
   rotspilaren die overbleven toen Darwin's Arch in 2021 instortte. Op ± 15–20 m ligt 'het
   Theater': je houdt je vast aan een rotsblok en kijkt hoe de hamerhaaien in het blauw
   langstrekken. Groenblauw, voedselrijk water, 23 °C en stevige stroming. Soms een walvishaai. */
import * as THREE from 'three';
import { UW, uw } from './water.js';
import { setSeabed, setSolid, floorNoise as fbm } from './terrain.js';
import { loadModels, hasModel, modelGeo, modelMap } from './models.js';
import { Fauna } from './creatures3d.js';
import { rng, smooth, tileTex, lumpy, makeRayGround, scatterModels, makeCuller } from './sitekit.js';

const DG = window.DG;

/* ---------------- bodem: eiland, helling en het Theater ---------------- */
const PROF = [[70, 48], [36, 40], [26, 6], [21, -2.5], [10, -7.5], [0, -10.5], [-14, -15], [-30, -19], [-46, -25], [-70, -32], [-110, -42]];
function prof(x) {
  if (x >= PROF[0][0]) return PROF[0][1];
  for (let i = 1; i < PROF.length; i++) {
    const a = PROF[i - 1], b = PROF[i];
    if (x >= b[0]) return a[1] + (b[1] - a[1]) * smooth((a[0] - x) / (a[0] - b[0]));
  }
  return PROF[PROF.length - 1][1];
}
// de twee pilaren van de ingestorte boog
const PILLARS = [{ x: 13, z: -30, r: 5.5 }, { x: 4, z: -54, r: 6.5 }];
function baseSeabed(x, z) {
  let y = prof(x + Math.sin(z * 0.03) * 4);
  y += (fbm(x * 0.09, z * 0.09) - 0.45) * 2.2;
  y += (fbm(x * 0.4 + 5, z * 0.4) - 0.5) * 0.7;
  return y;
}

function makeFloor(scene, q) {
  const W = 240, D = 260, cx = -40;
  const geo = new THREE.PlaneGeometry(W, D, q === 'laag' ? 100 : 170, q === 'laag' ? 110 : 180);
  geo.rotateX(-Math.PI / 2);
  geo.translate(cx, 0, 0);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const col = new Float32Array(pos.count * 3);
  const rock = new THREE.Color('#c8c0b8'), sand = new THREE.Color('#d8d0c0'), cliff = new THREE.Color('#9a8a78'), green = new THREE.Color('#8a9a6a'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = baseSeabed(x, z);
    pos.setY(i, y);
    uv.setXY(i, x / 5, z / 5);
    c.copy(rock).lerp(sand, Math.max(0, fbm(x * 0.05, z * 0.05) - 0.55) * 2);
    if (y > 0) c.copy(cliff).lerp(green, Math.min(1, Math.max(0, (y - 25) / 15)) * fbm(x * 0.1, z * 0.1)); // eiland boven water
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mat = uw(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), { caus: true, key: 'dwFloor' });
  tileTex('img/darwin/rots.webp', 1024, (t) => { mat.map = t; mat.bumpMap = t; mat.bumpScale = 2; mat.needsUpdate = true; });
  scene.add(new THREE.Mesh(geo, mat));
}

/* ---------------- basaltblokken (het Theater) en de pilaren ---------------- */
function rockMaterial(key) {
  const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), { caus: true, key });
  tileTex('img/darwin/rots.webp', 512, (t) => { mat.map = t; mat.bumpMap = t; mat.bumpScale = 2.5; mat.needsUpdate = true; }, { repeat: [1.6, 1.2] });
  return mat;
}
function makeBoulders(scene, q) {
  const R = rng(1835); // het jaar dat Darwin de Galápagos bezocht
  const geo = lumpy(new THREE.IcosahedronGeometry(0.5, q === 'laag' ? 1 : 2), 0.4, 3);
  geo.scale(1, 0.72, 1);
  const n = q === 'laag' ? 420 : 900;
  const mesh = new THREE.InstancedMesh(geo, rockMaterial('dwRock'), n);
  const d = new THREE.Object3D(), c = new THREE.Color(), list = [];
  for (let i = 0; i < n; i++) {
    // dicht opeen op de helling van 8 tot 30 m (het Theater), losser daarbuiten
    const theater = i < n * 0.7;
    const x = theater ? 8 - R() * 52 : 22 - R() * 120, z = (R() - 0.5) * (theater ? 150 : 240);
    const s = (theater ? 1.2 : 0.8) + Math.pow(R(), 1.8) * (theater ? 3.6 : 2.4);
    d.position.set(x, baseSeabed(x, z) - s * 0.18, z);
    d.rotation.set(R() * 0.8, R() * 6.3, R() * 0.8);
    d.scale.set(s, s * (0.55 + R() * 0.4), s * (0.8 + R() * 0.4));
    d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
    c.setHSL(0.07, 0.08, 0.5 + R() * 0.25); mesh.setColorAt(i, c);
    list.push({ x, z, s });
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
  return { mesh, list };
}
function makePillars(scene, q) {
  const mat = rockMaterial('dwPillar');
  const out = [];
  PILLARS.forEach((p, i) => {
    const y0 = baseSeabed(p.x, p.z) - 1, h = 30 - y0 + i * 4;
    const g = lumpy(new THREE.CylinderGeometry(p.r * 0.8, p.r * 1.15, h, q === 'laag' ? 16 : 28, 12), 0.18, 20 + i);
    g.translate(0, h / 2, 0);
    // de bovenkant boven water is kaal en lichter (vogelpoep!)
    const m = new THREE.Mesh(g, mat);
    m.position.set(p.x, y0, p.z);
    scene.add(m);
    out.push({ x: p.x, z: p.z, r: p.r * 1.05, tx: 0, tz: 0, y0 });
  });
  return out;
}

/* ---------------- boven water: de safariboot op afstand ---------------- */
function makeBoat(scene) {
  if (!hasModel('safariboot')) return;
  const g = modelGeo('safariboot', 'center');
  g.scale(30, 30, 30); g.computeBoundingBox();
  const m = new THREE.Mesh(g, uw(new THREE.MeshStandardMaterial({ map: modelMap('safariboot'), roughness: 0.6 }), { caus: false, key: 'dwBoat' }));
  m.position.set(-75, -1.8 - g.boundingBox.min.y, 70); m.rotation.y = 0.6;
  scene.add(m);
}

/* ---------------- dieren ---------------- */
const DW_MODELS = ['hamerhaai', 'walvishaai', 'galapagoshaai', 'zeeleeuw', 'geelstaart_dokter', 'koningskeizer', 'moorse_afgod', 'jacks', 'tuimelaar', 'adelaarsrog', 'groene_schildpad', 'zee-egel',
  'geelstaart_dokter-ver', 'koningskeizer-ver', 'moorse_afgod-ver', 'jacks-ver'];
function hangSpots() {
  return [
    { x: -45, z: -10, d: 18 }, { x: -50, z: 25, d: 22 }, { x: -20, z: -20, d: 12 }, { x: -15, z: 20, d: 11 },
    { x: -5, z: 0, d: 9 }, { x: -35, z: 45, d: 16 }, { x: -30, z: -50, d: 18 },
  ];
}
function comp(F, S, k) {
  const H = F.hang;
  // de school hamerhaaien trekt langzaam langs het Theater, in het blauw
  if (S.hamerhaai) F.addSchool(S.hamerhaai, Math.round(26 * k + 4), { spread: 7, speed: 0.55, home: H[0], roam: 0.3, spots: [H[0], H[1], H[6]], range: 12, depth: [14, 26] });
  if (S.geelstaart_dokter) {
    F.addSchool(S.geelstaart_dokter, Math.round(50 * k), { spread: 3.2, speed: 0.4, home: H[2], roam: 0.3, spots: [H[2], H[3], H[4]], range: 8 });
    F.addSchool(S.geelstaart_dokter, Math.round(35 * k), { spread: 3, speed: 0.4, home: H[3], roam: 0.3, spots: [H[2], H[3], H[4]], range: 8 });
  }
  if (S.jacks) F.addSchool(S.jacks, Math.round(45 * k), { spread: 3.6, speed: 0.6, home: H[5], roam: 0.1, range: 8, depth: [10, 20] });
  for (let i = 0; i < 3; i++) F.addSolo(S.koningskeizer, { radius: 6, speed: 0.25, home: [H[2], H[3], H[4]][i] });
  for (let i = 0; i < 3; i++) F.addSolo(S.moorse_afgod, { radius: 7, speed: 0.25, home: [H[3], H[4], H[2]][i] });
}
function extraAnimals(F, scene, { rand }) {
  const S = DG.SPECIES;
  const tail = 'transformed.z += sin(uTime * 2.4 - position.x * 5.0) * 0.03 * (0.55 - position.x);';
  // walvishaai (in het seizoen ongeveer 4 op de 10 duiken)
  if (Math.random() < 0.45) F.addCruiser('walvishaai', { rot: [0, -Math.PI / 2, 0], center: { x: -40, z: 5 }, r: 32, depth: 10, speed: 1.0, scale: S.walvishaai.size,
    wave: 'transformed.z += sin(uTime * 1.1 - position.x * 3.5) * 0.025 * (0.55 - position.x);' });
  // Galápagoshaaien patrouilleren langs de helling
  for (let i = 0; i < 3; i++) F.addCruiser('galapagoshaai', { rot: [0, -Math.PI / 2, 0], center: { x: -38 - i * 6, z: -20 + i * 22 }, r: 9 + i * 2, depth: 18 + i * 3, speed: 1.3, scale: S.galapagoshaai.size, wave: tail });
  // zeeleeuwen spelen vlak onder de oppervlakte en bij de duikers
  for (let i = 0; i < 2; i++) F.addCruiser('zeeleeuw', { rot: [0, -Math.PI / 2, 0], center: { x: 2 + i * 3, z: 8 - i * 4 }, r: 4 + i * 2, depth: 3 + i * 2.5, speed: 2.6 + i * 0.4, scale: S.zeeleeuw.size,
    wave: 'transformed.y += sin(uTime * 4.0 - position.x * 5.0) * 0.03 * max(0.0, -position.x);' });
  // gevlekte adelaarsroggen en soms een groep tuimelaars
  for (let i = 0; i < 2; i++) F.addCruiser('adelaarsrog', { rot: [0, Math.PI / 2, 0], center: { x: -25, z: 15 - i * 30 }, r: 12 + i * 3, depth: 14 + i * 3, speed: 1.0, scale: S.adelaarsrog.size,
    wave: 'transformed.y += sin(uTime * 1.5 - abs(position.z) * 4.0) * pow(abs(position.z) * 2.2, 1.5) * 0.06;' });
  if (Math.random() < 0.35) {
    const fluke = 'transformed.y += sin(uTime * 3.0 - position.x * 4.0) * 0.04 * max(0.0, -position.x);';
    for (let i = 0; i < 5; i++) F.addCruiser('tuimelaar', { rot: [0, -Math.PI / 2, 0], center: { x: -30 + i, z: -10 }, r: 18 + i * 1.5, depth: 3 + (i % 2) * 2, speed: 2.7 + i * 0.1, scale: S.tuimelaar.size * 0.9, wave: fluke });
  }
  F.addTurtle('groene_schildpad', { x: -6, z: 10, box: { x: [-20, 6], z: [-30, 40] } });
  F.addTurtle('groene_schildpad', { x: -14, z: -24, box: { x: [-25, 0], z: [-50, 0] } });
}
function makeUrchins(scene, q, ground) {
  // potloodzee-egels tussen en op de blokken
  const R = rng(77);
  const dense = q === 'laag' ? 0.5 : q === 'midden' ? 0.75 : 1;
  return scatterModels(scene, [
    { id: 'zee-egel', n: 420, size: [0.18, 0.32], cols: ['#ffffff', '#f0d0c0'], tint: 0.2, sink: 0.25 },
    { id: 'korstspons', n: 120, size: [0.5, 1.1], cols: ['#e07050', '#f0a040', '#c8a060'] },
    { id: 'bekerkoraal', n: 90, size: [0.4, 0.9], cols: ['#f0a060', '#f0c070'] },
  ], { R, spot: (r) => [8 - r() * 60, (r() - 0.5) * 150], ground, dense, key: 'dwU' });
}

/* ---------------- profiel ---------------- */
export const darwin = {
  id: 'darwin',
  loadTitle: 'Darwin Island laden…',
  temp: 23,
  tank: { L: 11.1, bar: 200, name: 'aluminium 80 · 200 bar' },
  lead: '8 kg aan de loodgordel',
  nightOk: false,
  challenges: () => 'darwin',
  touchTxt: 'de rots',
  pillarMsg: 'Je raakt de rotspilaar. Houd afstand: de stroming kan je ertegenaan duwen.',
  bounds: { x: [-110, 22], z: [-120, 120] },
  start: { p: [12, -0.25, 6], buddy: [12.5, -0.3, 8.5], yaw: Math.PI / 2 },
  water() {
    // groenblauw, voedselrijk water (daarom zoveel grote vissen)
    UW.uAbs.value.set(0.17, 0.062, 0.068);
    UW.uDown.value.set(0.08, 0.03, 0.03);
    return { top: 0x76dccc, deep: 0x125f74, exposure: 1.45, hemi: [0xe0f6ff, 0x8a8478, 2.1], sun: [0xfff2dc, 2.8], caus: 0.8, rays: true };
  },
  inShadow: () => false,
  isReef: () => false,
  reefMsg: '',
  async build({ scene, q, loading }) {
    setSeabed(baseSeabed); setSolid(null);
    await loadModels(DW_MODELS.concat(['korstspons', 'bekerkoraal', 'safariboot']));
    makeFloor(scene, q);
    await loading('Basaltblokken en de pilaren van de boog…');
    const { mesh } = makeBoulders(scene, q);
    const ground = makeRayGround(baseSeabed, [mesh], 10);
    setSeabed(ground);
    const pillars = makePillars(scene, q);
    const urch = makeUrchins(scene, q, ground);
    makeBoat(scene);
    await loading('Hamerhaaien, zeeleeuwen en walvishaaien…');
    const fauna = new Fauna(scene, q, { site: 'darwin', hang: hangSpots(), comp, extra: extraAnimals });
    fauna.onUpdate = makeCuller(urch.meshes, q === 'laag' ? 40 : 55);
    return { pillars, fauna };
  },
  startMsg(night, plan) {
    return 'Je ligt in het water bij het eiland, naast de pilaren van de oude boog. De stroming staat ' + plan.curTxt + '. Daal snel af naar de rotsblokken (▼ of F), zoek op ± 17 m een plek in het Theater en houd je vast. Kijk dan het blauw in.';
  },
  conditions() {
    const s = Math.random() < 0.5 ? 1 : -1;
    const cur = new THREE.Vector3(0, 0, s * (0.15 + Math.random() * 0.15));
    return {
      cur, curTxt: s > 0 ? 'stevig van zuid naar noord' : 'stevig van noord naar zuid',
      route: 'Negatieve afdaling: meteen naar beneden, niet blijven hangen aan de oppervlakte. Op het Theater (15–20 m) houd je je met één hand vast aan kale rots en kijk je naar de hamerhaaien. Daarna laat je je met de stroming meedrijven het blauw in voor je veiligheidsstop.',
      ship: Math.random() < 0.1,
    };
  },
  brief: {
    photos: '<img src="img/darwin/onder.webp" alt="Hamerhaaien en een zeeleeuw boven de rotsblokken (illustratie)"><img src="img/darwin/eiland.webp" alt="Darwin Island met de pilaren van de boog (illustratie)">',
    title: 'Darwin Island, Galápagos',
    name: 'Darwin Island',
    grid: (curTxt) => '<div><small>Water</small>23 °C · zicht ± 18 m (groenblauw)</div><div><small>Ingang</small>Bootduik vanaf de rubberboot, negatieve afdaling</div>' +
      '<div><small>Stroming</small>' + curTxt + '</div><div><small>Diepte</small>Theater 15–20 m · helling tot 40 m</div>',
    nightLead: '',
    rulesTitle: 'Regels van het Galápagos Marine Reserve',
    rules: ['Ik duik altijd met een gids van het park en blijf bij de groep', 'Ik houd me alleen vast aan kale rots, nooit aan koraal of dieren', 'Ik raak geen dieren aan en jaag ze niet op, ook niet de nieuwsgierige zeeleeuwen', 'Ik heb een oppervlakteboei (SMB) en een signaalfluit bij me'],
    rulesToast: 'Vink eerst de regels van het marine reserve af.',
    blocked: '<h2>De stroming is te sterk</h2><p class="lead">De gids zegt dat de stroming bij Darwin nu te hard staat. Je wacht op de boot tot het rustiger wordt.</p>',
    waitLabel: 'Wacht op rustiger water',
    waitHours: 3,
  },
};
