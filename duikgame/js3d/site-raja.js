/* Diepblauw 3D — Dampier Strait, Raja Ampat ('Manta Sandy' en het rif ernaast).
   Bootduik: de duikboot ligt boven het rif op ± 5 m. Het rif loopt af naar een zandvlakte op
   ± 16 m met een koraalblok als poetsstation, waar rifmanta's rondjes draaien. Daarachter zakt
   het rif verder af naar 30 m+ met een tornado van chevronbarracuda's. Nergens zoveel koraal. */
import * as THREE from 'three';
import { UW, uw } from './water.js';
import { setSeabed, setSolid, floorNoise as fbm } from './terrain.js';
import { loadModels, hasModel, modelGeo, modelMap } from './models.js';
import { Fauna } from './creatures3d.js';
import { rng, smooth, tileTex, lumpy, scatterModels, scatterFans, makeCuller } from './sitekit.js';

const DG = window.DG;

/* ---------------- bodem: rif, zandvlakte en dieper rif ---------------- */
const PROF = [[24, -3.2], [6, -4.6], [-10, -6.2], [-30, -10.5], [-46, -15.2], [-56, -16.2], [-82, -16.9], [-90, -18.5], [-112, -24.5], [-140, -33], [-180, -40]];
function prof(x) {
  if (x >= PROF[0][0]) return PROF[0][1];
  for (let i = 1; i < PROF.length; i++) {
    const a = PROF[i - 1], b = PROF[i];
    if (x >= b[0]) return a[1] + (b[1] - a[1]) * smooth((a[0] - x) / (a[0] - b[0]));
  }
  return PROF[PROF.length - 1][1];
}
const SAND = { x0: -84, x1: -50 };  // Manta Sandy
const STATION = { x: -67, z: 2, r: 2.8, h: 2.6 }; // koraalblok waar de manta's zich laten poetsen
const isSand = (x, z) => x > SAND.x0 + Math.sin(z * 0.07) * 3 && x < SAND.x1 + Math.cos(z * 0.05) * 3;
function rjSeabed(x, z) {
  let y = prof(x);
  const reef = isSand(x, z) ? 0.25 : 1;
  y += (fbm(x * 0.13, z * 0.13) - 0.45) * 1.6 * reef;   // grillig rif
  y += (fbm(x * 0.5 + 9, z * 0.5) - 0.5) * 0.5 * reef;   // kleine bulten
  y += Math.sin(z * 0.03 + x * 0.01) * 0.6;             // brede ribbels langs het rif
  // het poetsstation: een koraalblok midden op het zand
  const d = Math.hypot(x - STATION.x, z - STATION.z);
  if (d < STATION.r * 1.6) y += STATION.h * smooth(1 - d / (STATION.r * 1.6));
  return y;
}

function makeFloor(scene, q) {
  const W = 250, D = 240, cx = -70;
  const geo = new THREE.PlaneGeometry(W, D, q === 'laag' ? 110 : 180, q === 'laag' ? 100 : 170);
  geo.rotateX(-Math.PI / 2);
  geo.translate(cx, 0, 0);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const col = new Float32Array(pos.count * 3);
  const sand = new THREE.Color('#f4ecd8'), rock = new THREE.Color('#e8dccc'), rock2 = new THREE.Color('#f0e0d0'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, rjSeabed(x, z));
    uv.setXY(i, x / 4, z / 4);
    if (isSand(x, z)) c.copy(sand).lerp(rock2, Math.max(0, fbm(x * 0.2, z * 0.2) - 0.6));
    else c.copy(rock).lerp(rock2, fbm(x * 0.09 + 3, z * 0.09));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  // twee delen met een eigen textuur: begroeide rifbodem en wit koraalzand
  const idx = geo.index.array, reefIdx = [], sandIdx = [];
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t], b = idx[t + 1], c3 = idx[t + 2];
    const cx = (pos.getX(a) + pos.getX(b) + pos.getX(c3)) / 3, cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c3)) / 3;
    (isSand(cx, cz) ? sandIdx : reefIdx).push(a, b, c3);
  }
  const gReef = geo.clone(); gReef.setIndex(reefIdx);
  const gSand = geo.clone(); gSand.setIndex(sandIdx);
  const mReef = uw(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), { caus: true, key: 'rjFloorR' });
  const mSand = uw(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), { caus: true, key: 'rjFloorS' });
  tileTex('img/raja/rifbodem.webp', 1024, (t) => { t.repeat.set(0.7, 0.7); mReef.map = t; mReef.bumpMap = t; mReef.bumpScale = 1.5; mReef.needsUpdate = true; });
  tileTex('img/raja/zand.webp', 1024, (t) => { mSand.map = t; mSand.needsUpdate = true; });
  scene.add(new THREE.Mesh(gReef, mReef), new THREE.Mesh(gSand, mSand));
}

/* ---------------- rifblokken (de 'rots' onder het koraal) ---------------- */
function makeBoulders(scene, q) {
  const R = rng(91);
  const geo = lumpy(new THREE.IcosahedronGeometry(0.5, q === 'laag' ? 1 : 2), 0.42, 5);
  geo.scale(1, 0.75, 1);
  const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), { caus: true, key: 'rjRock' });
  tileTex('img/raja/rifbodem.webp', 512, (t) => { mat.map = t; mat.bumpMap = t; mat.bumpScale = 2; mat.needsUpdate = true; }, { repeat: [1.5, 1.2] });
  const n = q === 'laag' ? 260 : 520;
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const d = new THREE.Object3D(), c = new THREE.Color();
  let i = 0;
  while (i < n) {
    const x = 10 - R() * 140, z = (R() - 0.5) * 210;
    if (isSand(x, z) && Math.hypot(x - STATION.x, z - STATION.z) > 4) continue;
    const s = 0.8 + Math.pow(R(), 2) * 3.2;
    d.position.set(x, rjSeabed(x, z) - s * 0.25, z);
    d.rotation.set(R() * 0.6, R() * 6, R() * 0.6);
    d.scale.set(s, s * (0.5 + R() * 0.4), s * (0.8 + R() * 0.4));
    d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
    c.setHSL(0.05 + R() * 0.08, 0.15, 0.55 + R() * 0.2); mesh.setColorAt(i, c);
    i++;
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
}

/* ---------------- koraal: het rijkste rif ter wereld ---------------- */
function makeCorals(scene, q) {
  const R = rng(4711);
  const dense = q === 'laag' ? 0.4 : q === 'midden' ? 0.7 : 1;
  const spot = (r) => [12 - r() * 140, (r() - 0.5) * 130];
  const reef = (x, z) => !isSand(x, z) || Math.hypot(x - STATION.x, z - STATION.z) < STATION.r * 1.3;
  const shallow = (x, z) => reef(x, z) && x > -46;
  const placed = scatterModels(scene, [
    { id: 'tafelkoraal', n: 380, size: [1.2, 3.0], cols: ['#d8e0c0', '#c8d8b8', '#b8d0c8', '#e0d0b0'], where: shallow, flat: true },
    { id: 'hertshoornkoraal', n: 560, size: [0.8, 2.2], cols: ['#d0b8e0', '#c8c0a0', '#e0c8a8'], where: reef },
    { id: 'zachtkoraal', n: 560, size: [0.8, 2.0], cols: ['#ff90b0', '#e070d0', '#ff9070', '#ffd0a0', '#b080f0'], where: reef, double: true },
    { id: 'hersenkoraal', n: 260, size: [0.7, 1.8], cols: ['#e8d8a0', '#c8d890', '#d8c0c8'], where: reef },
    { id: 'sterkoraal', n: 220, size: [0.8, 1.8], cols: ['#d0c8a0', '#c0d0b0', '#b0c0d8'], where: reef },
    { id: 'bekerkoraal', n: 240, size: [0.5, 1.3], cols: ['#f0a060', '#f0c070', '#e88070'], where: reef },
    { id: 'korstspons', n: 220, size: [0.7, 1.5], cols: ['#e07050', '#c060a0', '#f0a040'], where: reef },
    { id: 'tonspons', n: 90, size: [1.1, 2.4], cols: ['#b07060', '#a08070'], where: (x, z) => reef(x, z) && x < -20 },
    { id: 'vaasspons', n: 120, size: [0.7, 1.5], cols: ['#d0a0e0', '#e0b080', '#a0c0f0'], where: reef },
    { id: 'buisspons', n: 120, size: [0.7, 1.5], cols: ['#c090d0', '#f0b060'], where: reef },
    { id: 'anemoon', n: 14, size: [0.8, 1.2], cols: ['#ffffff'], tint: 0, where: (x, z) => shallow(x, z) && x < 0 && Math.abs(z) < 40 },
  ], { R, spot, ground: rjSeabed, dense, key: 'rj' });
  const fans = scatterFans(scene, Math.round(300 * dense), { R, spot, ground: rjSeabed, where: (x, z) => reef(x, z) && x < -20, cols: ['#e05030', '#f08040', '#d84060', '#f0c040', '#c070e0'], size: [1.0, 2.6], key: 'rjFan' });
  return { anemones: placed.filter((p) => p.id === 'anemoon'), fans, meshes: placed.meshes.concat(fans.meshes) };
}

/* ---------------- boven water: de duikboot en karsteilanden ---------------- */
function makeSurfaceScene(scene) {
  if (hasModel('duikboot')) {
    const g = modelGeo('duikboot', 'center');
    g.scale(16, 16, 16);
    g.computeBoundingBox();
    const m = new THREE.Mesh(g, uw(new THREE.MeshStandardMaterial({ map: modelMap('duikboot'), roughness: 0.8 }), { caus: false, key: 'rjBoat' }));
    // romp ± 1,3 m onder water
    m.position.set(9, -1.3 - g.boundingBox.min.y, -3);
    m.rotation.y = 0.15;
    scene.add(m);
  }
  // groene kalksteeneilanden aan de horizon
  const R = rng(12);
  const mat = uw(new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 1, flatShading: true }), { caus: false, key: 'rjIsle' });
  const rock = uw(new THREE.MeshStandardMaterial({ color: 0x8a8576, roughness: 1, flatShading: true }), { caus: false, key: 'rjIsleR' });
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + i * 0.32 + (R() - 0.5) * 0.2, dist = 420 + R() * 380;
    const r = 30 + R() * 70, h = 40 + R() * 70;
    const g = lumpy(new THREE.CylinderGeometry(r * 0.75, r, h, 14, 4), 0.25, i + 3);
    const isle = new THREE.Mesh(g, mat);
    isle.position.set(Math.cos(a) * dist + 200, h / 2 - 6, Math.sin(a) * dist);
    scene.add(isle);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.05, 10, 14), rock);
    base.position.set(isle.position.x, -2, isle.position.z);
    scene.add(base);
  }
}

/* ---------------- dieren ---------------- */
const RJ_MODELS = ['zwartpunt', 'napoleon', 'clownvis', 'moorse_afgod', 'fuselier', 'juweelbaarsje', 'bultkop', 'batvis', 'koraalduivel', 'chromis_groen', 'chevron_barracuda',
  'zwartpunt-ver', 'napoleon-ver', 'clownvis-ver', 'moorse_afgod-ver', 'fuselier-ver', 'juweelbaarsje-ver', 'bultkop-ver', 'batvis-ver', 'koraalduivel-ver', 'chromis_groen-ver', 'chevron_barracuda-ver',
  'rifmanta', 'wobbegong', 'epaulette', 'dwergzeepaardje', 'karet'];
const CORAL_MODELS = ['tafelkoraal', 'hertshoornkoraal', 'zachtkoraal', 'hersenkoraal', 'sterkoraal', 'bekerkoraal', 'korstspons', 'tonspons', 'vaasspons', 'buisspons', 'anemoon', 'duikboot'];
function hangSpots() {
  return [
    { x: -12, z: -20, d: 6 }, { x: -20, z: 15, d: 8 }, { x: -35, z: -30, d: 11 }, { x: -38, z: 30, d: 12 },
    { x: -67, z: 2, d: 12 }, { x: -100, z: 0, d: 18 }, { x: -95, z: -40, d: 20 }, { x: -5, z: 40, d: 5 },
    { x: -105, z: 35, d: 21 },
  ];
}
function comp(F, S, k, { rand }, extra) {
  const H = F.hang;
  const reefSpots = [H[0], H[1], H[2], H[3], H[7]];
  if (S.fuselier) {
    F.addSchool(S.fuselier, Math.round(120 * k), { spread: 4, speed: 0.7, home: H[1], roam: 0.4, spots: reefSpots, range: 8 });
    F.addSchool(S.fuselier, Math.round(90 * k), { spread: 3.6, speed: 0.7, home: H[2], roam: 0.4, spots: reefSpots, range: 8 });
  }
  if (S.chevron_barracuda) F.addSchool(S.chevron_barracuda, Math.round(70 * k), { spread: 3, speed: 0.5, home: H[5], roam: 0.02, range: 3, depth: [15, 21] });
  if (S.bultkop) F.addSchool(S.bultkop, Math.round(10 * k), { spread: 3, speed: 0.35, home: H[2], roam: 0.4, spots: reefSpots, range: 8 });
  if (S.batvis) F.addSchool(S.batvis, Math.round(6 * k), { spread: 2, speed: 0.25, home: H[3], roam: 0.2, spots: reefSpots, range: 5 });
  // juweelbaarsjes in wolken boven de koraalblokken
  if (S.juweelbaarsje) [H[0], H[1], H[7], H[2]].forEach((h, i) => F.addSchool(S.juweelbaarsje, Math.round((70 - i * 10) * k), { spread: 1.4, speed: 0.15, home: h, roam: 0, range: 2.5 }));
  if (S.chromis_groen) [H[0], H[1], H[3]].forEach((h) => F.addSchool(S.chromis_groen, Math.round(60 * k), { spread: 1.2, speed: 0.15, home: h, roam: 0, range: 2 }));
  // clownvissen bij de anemonen
  (extra.anemones || []).forEach((a) => {
    for (let i = 0; i < 2 + (Math.random() < 0.5 ? 1 : 0); i++) F.addSolo(S.clownvis, { kind: 'hover', home: { x: a.x, z: a.z, d: -a.y - 0.5 * a.s - 0.25 }, radius: 0.35 * a.s, speed: 0.08 });
  });
  for (let i = 0; i < 3; i++) F.addSolo(S.moorse_afgod, { radius: 8, speed: 0.25, home: reefSpots[i] });
  for (let i = 0; i < 2; i++) F.addSolo(S.koraalduivel, { kind: 'hover', home: reefSpots[i + 2], radius: 2.5, speed: 0.08 });
  F.addSolo(S.napoleon, { kind: 'curious', home: H[3], radius: 18, speed: 0.4, depth: [8, 20] });
  for (let i = 0; i < 2; i++) F.addSolo(S.zwartpunt, { radius: 22, speed: 0.65, home: H[[0, 7][i]], depth: [3, 9] });
}
function extraAnimals(F, scene, { rand }, info) {
  // rifmanta's draaien rondjes boven het poetsstation (vleugelslag via de vertex-shader)
  const flap = 'transformed.y += sin(uTime * 1.1 - abs(position.z) * 2.5 + position.x * 1.5) * 0.16 * pow(abs(position.z) * 2.0, 1.6);';
  const nM = Math.random() < 0.85 ? 3 : 1;
  for (let i = 0; i < nM; i++) {
    F.addCruiser('rifmanta', { center: { x: STATION.x, z: STATION.z }, r: 6 + i * 2.2, depth: 12.4 - i * 0.9, speed: 0.9 + i * 0.12, scale: DG.SPECIES.rifmanta.size * 0.9, wave: flap });
  }
  // wobbegong verstopt onder een tafelkoraal, epaulettehaai 'loopt' over het rif
  F.addCrawler('wobbegong', { at: () => ({ x: rand(-40, -20), z: rand(-30, 30), a: Math.random() * Math.PI * 2 }), rot: [0, Math.PI / 2, 0], scale: DG.SPECIES.wobbegong.size, L: 1.2,
    wave: 'transformed.z += sin(uTime * 0.6 - position.x * 4.0) * 0.01 * (0.5 - position.x);' });
  F.addCrawler('epaulette', { at: () => ({ x: rand(-14, -4), z: rand(-25, 25), a: Math.random() * Math.PI * 2 }), rot: [0, Math.PI / 2, 0], scale: DG.SPECIES.epaulette.size, L: 0.7, moving: true, speed: 0.12, range: 6,
    wave: 'transformed.z += sin(uTime * 3.0 - position.x * 6.0) * 0.035 * (0.6 - position.x);' });
  // dwergzeepaardje op een grote rode waaier aan de rand van het rif (± 14 m), vlak naar de route gekeerd
  if (hasModel('dwergzeepaardje')) {
    const fx = -44 + rand(-1, 1), fz = rand(-14, 14), fy = rjSeabed(fx, fz) - 0.05, s = 2.2;
    const photo = new THREE.TextureLoader().load('img/waaier.webp'); photo.colorSpace = THREE.SRGBColorSpace;
    const g = new THREE.PlaneGeometry(1.3, 1.3 * 0.98, 4, 4); g.translate(0, 0.63, 0);
    const fan = new THREE.Mesh(g, uw(new THREE.MeshStandardMaterial({ map: photo, color: 0xf07858, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 }), { caus: true, key: 'rjPygFan' }));
    fan.position.set(fx, fy, fz); fan.rotation.y = Math.PI / 2; fan.scale.setScalar(s);
    scene.add(fan);
    // het vlak van de waaier ligt nu langs z; het zeepaardje zit er net voor (+x), halverwege
    F.addCrawler('dwergzeepaardje', { at: () => ({ x: fx + 0.03, z: fz + 0.25 * s, y: fy + 0.8 * s, a: Math.PI / 2 }), scale: 0.05, L: 0.03 });
  }
  F.addTurtle('karet', { x: -25, z: -10, box: { x: [-40, -8], z: [-40, 30] } });
}

/* ---------------- profiel ---------------- */
export const raja = {
  id: 'raja',
  loadTitle: 'Dampier Strait laden…',
  temp: 29,
  tank: { L: 11.1, bar: 200, name: 'aluminium 80 · 200 bar' },
  lead: '6 kg aan de loodgordel',
  nightOk: false,
  challenges: () => 'raja',
  touchTxt: 'het koraal',
  bounds: { x: [-150, 14], z: [-110, 110] },
  start: { p: [3, -0.25, 2], buddy: [3.5, -0.3, 4.5], yaw: Math.PI / 2 },
  water() {
    // helder, iets groenig van het plankton (daarom de manta's)
    UW.uAbs.value.set(0.13, 0.045, 0.034);
    UW.uDown.value.set(0.07, 0.022, 0.012);
    return { top: 0x76e4ea, deep: 0x136b96, exposure: 1.42, hemi: [0xe0f8ff, 0xb0a088, 2.2], sun: [0xfff2dc, 3.0], caus: 1, rays: true };
  },
  inShadow: (x, z) => Math.abs(x - 9) < 8 && Math.abs(z + 3) < 3,
  isReef: (x, z) => !isSand(x, z) && x < 4,
  reefMsg: 'Pas op: je raakt het koraal! In Raja Ampat is alles beschermd: blijf er een armlengte boven.',
  pillarMsg: '',
  async build({ scene, q, loading }) {
    setSeabed(rjSeabed); setSolid(null);
    await loadModels(CORAL_MODELS.concat(RJ_MODELS));
    makeFloor(scene, q);
    makeBoulders(scene, q);
    await loading('Koraal, waaiers en anemonen…');
    const info = makeCorals(scene, q);
    makeSurfaceScene(scene);
    await loading('Manta’s, haaien en barracuda’s…');
    const fauna = new Fauna(scene, q, { site: 'raja', hang: hangSpots(), comp: (F, S, k, h) => comp(F, S, k, h, info), extra: (F, sc, h) => extraAnimals(F, sc, h, info) });
    fauna.onUpdate = makeCuller(info.meshes, q === 'laag' ? 42 : q === 'midden' ? 55 : 70);
    return { pillars: [], fauna };
  },
  startMsg(night, plan) {
    return 'Je ligt naast de duikboot boven het rif. ' + (plan.current.length() > 0.01 ? 'Er staat stroming: ' + plan.curTxt + '. ' : '') + 'Daal af (▼ of F) langs het rif en volg het naar de zandvlakte op ± 16 m: daar is het poetsstation van de manta’s.';
  },
  conditions() {
    // in de Dampier Strait staat bijna altijd wat stroming
    const r = Math.random();
    const cur = new THREE.Vector3(0, 0, (r < 0.5 ? 1 : -1) * (0.04 + Math.random() * 0.1));
    return {
      cur, curTxt: cur.z > 0 ? 'van zuid naar noord' : 'van noord naar zuid',
      route: 'Daal af bij de boot en zwem met de stroom langs het rif naar beneden. Op de zandvlakte (16 m) ga je achter het koraalblok liggen en wacht je tot de manta’s komen. Niet boven het poetsstation zwemmen! Daarna terug over het rif en een veiligheidsstop bij de boot.',
      ship: Math.random() < 0.1,
    };
  },
  brief: {
    photos: '<img src="img/raja/rif.webp" alt="Rif met manta’s in Raja Ampat (illustratie)"><img src="img/raja/eilanden.webp" alt="Karsteilanden vanaf de duikboot (illustratie)">',
    title: 'Dampier Strait, Raja Ampat',
    name: 'Manta Sandy in de Dampier Strait',
    grid: (curTxt) => '<div><small>Water</small>29 °C · zicht ± 20 m</div><div><small>Ingang</small>Bootduik, achterwaartse rol</div>' +
      '<div><small>Stroming</small>' + curTxt + '</div><div><small>Diepte</small>rif 5–30 m · zand 16 m</div>',
    nightLead: '',
    rulesTitle: 'Regels van het Raja Ampat Marine Park',
    rules: ['Ik heb een geldige Raja Ampat-marinepas (tag)', 'Bij het poetsstation blijf ik laag achter het koraalblok en zwem ik niet boven de manta’s', 'Ik raak niets aan en blijf met mijn vinnen van het koraal af', 'Ik let op de stroming en blijf bij mijn buddy en de gids'],
    rulesToast: 'Vink eerst de regels van het marine park af.',
    blocked: '<h2>De stroming staat te hard</h2><p class="lead">De gids vindt de stroming in de Dampier Strait nu te sterk om bij Manta Sandy te duiken. Wacht tot het tij keert.</p>',
    waitLabel: 'Wacht op rustiger water',
    waitHours: 3,
  },
};
