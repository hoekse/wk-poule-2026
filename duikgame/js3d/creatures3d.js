/* Diepblauw 3D — dieren: vissen (uit de bestaande soortentekeningen), scholen, tarpons, schildpadden, kikvorsvis, adelaarsrog */
import * as THREE from 'three';
import { uw } from './water.js';
import { seabed } from './terrain.js';
import { CENTER, GROUPS, pillarAt } from './pier.js';
import { loadModels, hasModel, modelGeo, modelMap } from './models.js';

const DG = window.DG;
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);

/* ================================================================
 * 3D-vis uit een 2D-sprite: silhouet + dikte uit de alfa
 * ================================================================ */
const THICK = { disc: 0.07, oval: 0.11, torpedo: 0.12, long: 0.07, box: 0.17, parrot: 0.13, wrasse: 0.13, needle: 0.035, eelish: 0.05, scorpion: 0.13 };

function spriteCanvas(spc) {
  const L = DG.Art.sizeOf(spc);
  const pxm = Math.max(60, Math.min(900, 420 / L));
  const sp = DG.Art.sprite(spc, pxm);
  const tx = sp.tbx + sp.tail.x;
  const x0 = Math.min(sp.body.x, tx), x1 = Math.max(sp.body.x + sp.body.w, tx + sp.tail.w);
  const y0 = Math.min(sp.body.y, sp.tail.y), y1 = Math.max(sp.body.y + sp.body.h, sp.tail.y + sp.tail.h);
  const W = Math.ceil((x1 - x0) * pxm), H = Math.ceil((y1 - y0) * pxm);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(sp.tail.cv, (tx - x0) * pxm, (sp.tail.y - y0) * pxm, sp.tail.w * pxm, sp.tail.h * pxm);
  g.drawImage(sp.body.cv, (sp.body.x - x0) * pxm, (sp.body.y - y0) * pxm, sp.body.w * pxm, sp.body.h * pxm);
  return { c, x0, x1, y0, y1, pxm, L, tailX: x0, headX: x1 };
}

// realistische foto's (Magnific) met transparante achtergrond, kijkend naar rechts
export const PHOTO_FISH = ['franse_knorvis', 'kleinbek_knorvis', 'sergeant', 'blauwe_dokter', 'chromis_blauw', 'tarpon', 'barracuda', 'franse_keizer', 'koningin_keizer', 'stoplicht_papegaai', 'koffervis', 'trompetvis'];
const photoCanvas = {};
export function preloadFishPhotos() {
  return Promise.all(PHOTO_FISH.map((id) => new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      photoCanvas[id] = c;
      res();
    };
    img.onerror = () => res();
    img.src = 'img/vis/' + id + '.webp';
  })));
}
function photoSprite(spc) {
  const c = photoCanvas[spc.id];
  const L = spc.size * Math.min(spc.ds || 1, 1.3);
  const H = L * (c.height / c.width);
  return { c, x0: -L / 2, x1: L / 2, y0: -H / 2, y1: H / 2, pxm: c.width / L, L, tailX: -L / 2, headX: L / 2, photo: true };
}

// echte 3D-modellen (Magnific: foto → 3D) voor vissen en andere dieren
export const MODEL_ANIMALS = ['groene_schildpad', 'karet', 'adelaarsrog', 'kikvorsvis_geel', 'gevlekte_murene', 'rifoctopus'];
const NIGHT_MODELS = ['langoest', 'rifinktvis'];
export function preloadFaunaModels(night) { return loadModels(PHOTO_FISH.concat(MODEL_ANIMALS, ['zilvervisje'], PHOTO_FISH.map((id) => id + '-ver'), night ? NIGHT_MODELS : [])); }
// zilvervisjes: grote, dichte scholen onder de pier (sfeer, niet in het logboek)
const ZILVER = { id: 'zilvervisje', name: 'Zilvervisjes', size: 0.08, ds: 1, art: { t: 'fish', shape: 'long' }, log: false };
const LOD_FAR = { laag: 9, midden: 13, hoog: 18 };

function modelFishAsset(spc, name) {
  const L = spc.size * Math.min(spc.ds || 1, 1.3);
  const geo = modelGeo(name || spc.id, 'fish');
  geo.scale(L, L, L);
  geo.computeBoundingBox();
  const shiny = /tarpon|barracuda|trevally|jacks|fuselier|zeebrasem/.test(spc.id);
  return { geo, tex: modelMap(name || spc.id), headX: geo.boundingBox.max.x, tailX: geo.boundingBox.min.x, L, shiny: shiny || spc.id === 'zilvervisje', model: true };
}

const fishCache = {};
export function fishAsset(spc) {
  if (fishCache[spc.id]) return fishCache[spc.id];
  if (hasModel(spc.id)) return (fishCache[spc.id] = modelFishAsset(spc));
  const s = photoCanvas[spc.id] ? photoSprite(spc) : spriteCanvas(spc);
  const { c, x0, x1, y0, y1 } = s;
  const g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height).data;
  const alpha = (px, py) => {
    px = Math.max(0, Math.min(c.width - 1, Math.round(px)));
    py = Math.max(0, Math.min(c.height - 1, Math.round(py)));
    return img[(py * c.width + px) * 4 + 3] / 255;
  };
  const art = spc.art;
  const bodyH = s.photo ? (s.y1 - s.y0) * 0.7 : (art.h || 0.4) * s.L;
  const rad = Math.max(2, bodyH * s.pxm * 0.22);
  const blurA = (px, py) => {
    let sum = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { sum += alpha(px + dx * rad / 2, py + dy * rad / 2); n++; }
    return sum / n;
  };
  const NX = art.shape === 'needle' || art.shape === 'long' || art.shape === 'eelish' ? 34 : 26;
  const NY = 12;
  const T = s.L * (THICK[art.shape] || (art.t === 'shark' ? 0.085 : art.t === 'mammal' ? 0.12 : 0.1));
  const pos = [], uvs = [], idx = [];
  for (let side = 0; side < 2; side++) {
    for (let j = 0; j <= NY; j++) {
      for (let i = 0; i <= NX; i++) {
        const u = i / NX, v = j / NY;
        const x = x0 + u * (x1 - x0);
        const ys = y0 + v * (y1 - y0);
        const b = blurA(u * (c.width - 1), v * (c.height - 1));
        const t = Math.pow(Math.max(0, Math.min(1, (b - 0.08) / 0.85)), 0.6) * T;
        pos.push(x, -ys, side ? -t : t);
        uvs.push(u, 1 - v);
      }
    }
  }
  const row = NX + 1, off = row * (NY + 1);
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const a = j * row + i, b = a + 1, c2 = a + row, d = c2 + 1;
      idx.push(a, c2, b, b, c2, d);
      idx.push(off + a, off + b, off + c2, off + b, off + d, off + c2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const shiny = /tarpon|barracuda|trevally|jacks|fuselier|zeebrasem/.test(spc.id);
  const asset = { geo, tex, headX: x1, tailX: x0, L: s.L, shiny };
  fishCache[spc.id] = asset;
  return asset;
}

function fishMaterial(spc, a) {
  const amp = spc.id === 'rifinktvis' ? 0.02 : spc.art.t === 'shark' ? 0.09 : spc.art.shape === 'disc' ? 0.06 : 0.1;
  const m = a.model
    ? new THREE.MeshStandardMaterial({ map: a.tex, roughness: a.shiny ? 0.38 : 0.62, metalness: a.shiny ? 0.3 : 0.03 })
    : new THREE.MeshStandardMaterial({ map: a.tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: a.shiny ? 0.35 : 0.6, metalness: a.shiny ? 0.35 : 0.04 });
  return uw(m, {
    caus: true,
    key: 'fish-' + spc.id,
    uniforms: { uHead: { value: a.headX }, uTail: { value: a.tailX }, uAmp: { value: amp }, uLen: { value: a.L } },
    vertexPars: 'uniform float uTime; uniform float uHead; uniform float uTail; uniform float uAmp; uniform float uLen;\nattribute float aPh; attribute float aSp;\n',
    vertexBegin: `{
      float tl = clamp((uHead - position.x) / (uHead - uTail), 0.0, 1.0);
      float w = sin(uTime * (5.0 + aSp * 7.0) + aPh - position.x / uLen * 4.0) * uAmp * uLen * tl * tl * (0.4 + aSp);
      transformed.z += w;
    }`,
  });
}

/* ================================================================
 * Speciale modellen
 * ================================================================ */
// materiaal voor een los 3D-model met eigen beweging in de vertex shader
function animalMat(id, key, vertexBegin, uniforms) {
  return uw(new THREE.MeshStandardMaterial({ map: modelMap(id), roughness: 0.7, metalness: 0.02 }), {
    caus: true, key, uniforms,
    vertexPars: 'uniform float uTime;\n' + (uniforms ? Object.keys(uniforms).map((k) => 'uniform float ' + k + ';\n').join('') : ''),
    vertexBegin,
  });
}
// genormaliseerd: kop naar -Z, breedte langs X, langste maat 1 (de spanwijdte van de voorpoten)
function turtleFromModel(kind) {
  const geo = modelGeo(kind, 'center', { rot: [0, kind === 'karet' ? Math.PI : Math.PI / 2, 0] });
  const uPh = { value: 0 };
  const mat = animalMat(kind, 'turtleM', `{
    float ax = abs(position.x);
    // voorpoten: grote vleugelslag, achterpoten sturen
    float fr = smoothstep(0.0, -0.12, position.z) * smoothstep(0.17, 0.3, ax);
    float rr = smoothstep(0.08, 0.22, position.z) * smoothstep(0.1, 0.2, ax);
    transformed.y += sin(uPh) * (ax - 0.17) * 0.9 * fr + sin(uPh + 1.2) * (ax - 0.1) * 0.35 * rr;
    transformed.z += cos(uPh) * (ax - 0.17) * 0.25 * fr;
  }`, { uPh });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat));
  g.userData.uPh = uPh;
  g.userData.flippers = [];
  return g;
}
function turtleModel(kind) {
  if (hasModel(kind)) return turtleFromModel(kind);
  const hawk = kind === 'karet';
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = hawk ? '#7a4e26' : '#5d6234'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 13; i++) {
    const cx = (i % 4) * 70 + 20 + (Math.floor(i / 4) % 2) * 30, cy = Math.floor(i / 4) * 70 + 30;
    const gr = x.createRadialGradient(cx, cy, 4, cx, cy, 40);
    gr.addColorStop(0, hawk ? '#e0a848' : '#9a8a4a'); gr.addColorStop(1, hawk ? 'rgba(90,50,20,0.9)' : 'rgba(60,60,30,0.9)');
    x.fillStyle = gr; x.beginPath(); x.ellipse(cx, cy, 36, 32, 0.3, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(30,20,10,0.6)'; x.lineWidth = 3; x.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const shellG = new THREE.SphereGeometry(0.5, 24, 14, 0, TAU, 0, Math.PI / 2);
  shellG.scale(0.62, 0.38, 0.85);
  const shell = new THREE.Mesh(shellG, uw(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), { caus: true, key: 'turtle' }));
  g.add(shell);
  const skinM = uw(new THREE.MeshStandardMaterial({ color: hawk ? 0xb89a6e : 0x8f8f6a, roughness: 0.8 }), { caus: true, key: 'tskin' });
  const plast = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 8, 0, TAU, Math.PI / 2, Math.PI / 6), uw(new THREE.MeshStandardMaterial({ color: 0xe0d0a0 }), { key: 'plast' }));
  plast.scale.set(0.6, 0.25, 0.82); g.add(plast);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), skinM); head.scale.set(0.9, 0.8, 1.3); head.position.set(0, 0.02, -0.5); g.add(head);
  const fl = [];
  [[-1, -0.22, 0.5], [1, -0.22, 0.5], [-1, 0.28, 0.25], [1, 0.28, 0.25]].forEach(([s, z, len]) => {
    const piv = new THREE.Group(); piv.position.set(s * 0.26, 0, z); g.add(piv);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 6), skinM);
    f.scale.set(len, 0.035, len * 0.32); f.position.set(s * len * 0.45, 0, 0.05); piv.add(f);
    fl.push({ piv, s, front: z < 0 });
  });
  g.userData.flippers = fl;
  return g;
}

function frogfishModel() {
  if (hasModel('kikvorsvis_geel')) {
    // voorkant naar +X, onderkant op y = -0.5 (langste maat 1)
    const geo = modelGeo('kikvorsvis_geel', 'center', { rot: [0, Math.PI / 2, 0] });
    const g = new THREE.Group();
    const m = new THREE.Mesh(geo, uw(new THREE.MeshStandardMaterial({ map: modelMap('kikvorsvis_geel'), roughness: 0.92 }), { caus: true, key: 'frogM' }));
    m.scale.setScalar(0.24);
    g.add(m);
    return g;
  }
  const geo = new THREE.IcosahedronGeometry(0.12, 3);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + (Math.sin(x * 60) * Math.cos(z * 55) + Math.sin(y * 70)) * 0.06;
    p.setXYZ(i, x * k * 1.15, y * k, z * k);
  }
  geo.computeVertexNormals();
  const g = new THREE.Group();
  const body = new THREE.Mesh(geo, uw(new THREE.MeshStandardMaterial({ color: 0xf0bf2e, roughness: 0.95 }), { caus: true, key: 'frog' }));
  g.add(body);
  const eyeM = uw(new THREE.MeshStandardMaterial({ color: 0x111111 }), { key: 'eye' });
  [-1, 1].forEach((s) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), eyeM); e.position.set(0.09, 0.07, s * 0.05); g.add(e); });
  const lure = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.08), eyeM); lure.position.set(0.11, 0.13, 0); lure.rotation.z = -0.5; g.add(lure);
  return g;
}

function eagleRayModel() {
  if (hasModel('adelaarsrog')) {
    // neus naar +X, vleugels langs Z
    const geo = modelGeo('adelaarsrog', 'center', { rot: [0, Math.PI / 2, 0] });
    const m = new THREE.Mesh(geo, animalMat('adelaarsrog', 'eagleM', 'transformed.y += sin(uTime * 1.5 - abs(position.z) * 4.0) * pow(abs(position.z) * 2.2, 1.5) * 0.06;'));
    m.scale.setScalar(2.5);
    const g = new THREE.Group();
    g.add(m);
    return g;
  }
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#27313b';
  x.beginPath();
  x.moveTo(128, 30); x.quadraticCurveTo(170, 60, 250, 120); x.quadraticCurveTo(170, 140, 140, 200); x.lineTo(116, 200); x.quadraticCurveTo(86, 140, 6, 120); x.quadraticCurveTo(86, 60, 128, 30);
  x.fill();
  x.fillRect(125, 190, 6, 66);
  x.fillStyle = '#f2f2f2';
  for (let i = 0; i < 80; i++) { const px = 40 + Math.random() * 176, py = 60 + Math.random() * 120; if (Math.abs(px - 128) < (py - 30) * 1.2) { x.beginPath(); x.arc(px, py, 2.4, 0, TAU); x.fill(); } }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(2.2, 2.2, 16, 6);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, uw(new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }), {
    caus: true, key: 'eagle',
    vertexPars: 'uniform float uTime;\n',
    vertexBegin: 'transformed.y += sin(uTime * 1.6 - abs(position.x) * 1.2) * pow(abs(position.x), 1.4) * 0.35;',
  }));
  const g = new THREE.Group();
  m.rotation.y = Math.PI / 2; // neus naar +x
  g.add(m);
  return g;
}

/* ================================================================
 * Spawnen en gedrag
 * ================================================================ */
// plekken waar vissen graag hangen: pijlergroepen, laadkop en onder de pier
const HANG = [{ x: CENTER.x, z: CENTER.z, d: 7 }].concat(GROUPS.map((g) => ({ x: g.x, z: g.z, d: 8 }))).concat([-30, -55, -80].map((x) => ({ x, z: 0, d: 4 })))
  .concat([{ x: -150, z: -30, d: 15 }, { x: -152, z: 18, d: 16 }, { x: -147, z: 62, d: 14 }]);

class School {
  constructor(spc, n, opts) {
    this.spc = spc;
    this.n = n;
    this.spread = opts.spread || 2.5;
    this.speed = opts.speed || 0.35;
    this.home = opts.home || HANG[Math.floor(Math.random() * HANG.length)];
    this.pos = new THREE.Vector3(this.home.x + rand(-3, 3), -Math.max(1.5, this.home.d * rand(0.4, 0.8)), this.home.z + rand(-3, 3));
    this.target = this.pos.clone();
    this.vel = new THREE.Vector3();
    this.timer = 0;
    this.roam = opts.roam || 0.25;
    this.low = !!opts.low;       // 's nachts verspreid op het zand foerageren
    this.depth = opts.depth;     // vast dieptebereik [min, max]
    this.light = !!opts.light;   // komt af op lamplicht (zilvervisjes)
    if (this.depth) this.pos.y = -rand(this.depth[0], this.depth[1]);
    if (this.low) this.pos.y = seabed(this.pos.x, this.pos.z) + 0.6;
    this.members = [];
    for (let i = 0; i < n; i++) {
      const o = new THREE.Vector3(rand(-1, 1), rand(-0.45, 0.45), rand(-1, 1)).multiplyScalar(this.spread);
      this.members.push({ p: this.pos.clone().add(o), v: new THREE.Vector3(), off: o, ph: Math.random() * TAU, sp: rand(0.3, 0.7) });
    }
  }
  update(dt, env) {
    this.timer -= dt;
    let speed = this.speed;
    const L = env.lamp;
    if (this.light && L && L.on && this.pos.distanceTo(L.point) < 16) {
      // kleine visjes komen op het licht af (en de tarpons op hen)
      if (this.timer <= 0) { this.timer = rand(1, 2.2); this.target.copy(L.point).add(new THREE.Vector3(rand(-0.8, 0.8), rand(-0.5, 0.5), rand(-0.8, 0.8))); }
      speed = 0.7;
    } else if (this.timer <= 0 || this.pos.distanceTo(this.target) < 1.5) {
      this.timer = rand(8, 20);
      if (Math.random() < this.roam) this.home = HANG[Math.floor(Math.random() * HANG.length)];
      const x = this.home.x + rand(-5, 5), z = this.home.z + rand(-5, 5);
      const fl = seabed(x, z);
      const y = this.depth ? -rand(this.depth[0], this.depth[1]) : this.low ? fl + rand(0.3, 0.9) : Math.min(-1.2, fl + rand(1.2, 4.5));
      this.target.set(x, Math.max(fl + 0.3, y), z);
    }
    const dir = this.target.clone().sub(this.pos);
    const d = dir.length();
    if (d > 0.01) dir.multiplyScalar(Math.min(1, d / 3) * speed / d);
    this.vel.lerp(dir, Math.min(1, dt * 0.8));
    this.pos.addScaledVector(this.vel, dt);
    const sp = this.vel.length();
    for (const m of this.members) {
      m.off.applyAxisAngle(Y, dt * 0.05);
      const t = this.pos.clone().add(m.off);
      const acc = t.sub(m.p).multiplyScalar(1.4).add(this.vel.clone().multiplyScalar(0.6));
      // weg van de duiker
      if (env.diver) {
        const away = m.p.clone().sub(env.diver);
        const dd = away.length();
        if (dd < 2.6) acc.addScaledVector(away.normalize(), (2.6 - dd) * 4.5);
      }
      avoidPillars(m.p, acc, env);
      m.v.addScaledVector(acc, dt);
      const maxV = Math.max(0.3, sp * 1.8) + 0.8;
      if (m.v.length() > maxV) m.v.setLength(maxV);
      m.v.multiplyScalar(1 - dt * 0.9);
      m.p.addScaledVector(m.v, dt);
      clampWater(m.p, 0.4);
      m.speed = m.v.length();
    }
  }
}
const Y = new THREE.Vector3(0, 1, 0);

function avoidPillars(p, acc, env) {
  for (const pl of env.nearPillars) {
    const a = pillarAt(pl, p.y);
    const dx = p.x - a.x, dz = p.z - a.z;
    const d = Math.hypot(dx, dz);
    if (d < 1.1 && d > 0.001) { acc.x += (dx / d) * (1.1 - d) * 8; acc.z += (dz / d) * (1.1 - d) * 8; }
  }
}
function clampWater(p, margin) {
  const fl = seabed(p.x, p.z);
  if (p.y < fl + margin) p.y = fl + margin;
  if (p.y > -0.4) p.y = -0.4;
}

// solitaire vis met eigen doel
class Solo {
  constructor(spc, opts) {
    this.spc = spc;
    this.kind = opts.kind || 'wander';
    this.home = opts.home || HANG[Math.floor(Math.random() * HANG.length)];
    this.radius = opts.radius || 10;
    this.speed = opts.speed || 0.35;
    this.p = new THREE.Vector3(this.home.x + rand(-4, 4), -rand(2, this.home.d || 6), this.home.z + rand(-4, 4));
    clampWater(this.p, 0.8);
    this.v = new THREE.Vector3();
    this.t = this.p.clone();
    this.timer = 0;
    this.ph = Math.random() * TAU;
    this.depth = opts.depth;
    this.vertical = !!opts.vertical;
  }
  update(dt, env) {
    this.timer -= dt;
    let speed = this.speed;
    const L = env.lamp;
    const hunting = this.kind === 'tarpon' && env.night && L && L.on && env.diver && env.diver.distanceTo(this.p) < 24;
    if (hunting) {
      // tarpons gebruiken het licht van duikers om te jagen: ze hangen net naast de bundel en schieten er af en toe doorheen
      this.hunt = (this.hunt || 0) - dt;
      if (this.hunt <= 0) {
        this.hunt = rand(1.5, 4.5);
        this.dart = Math.random() < 0.38 ? rand(0.7, 1.2) : 0;
        const side = new THREE.Vector3(-L.dir.z, 0, L.dir.x);
        if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
        side.normalize();
        this.t.copy(L.pos).addScaledVector(L.dir, rand(2.2, 4.6) + (this.dart ? rand(1.5, 3) : 0)).addScaledVector(side, (this.dart ? rand(-0.4, 0.4) : rand(0.8, 1.8) * (Math.random() < 0.5 ? -1 : 1))).add(new THREE.Vector3(0, rand(-0.6, 0.7), 0));
        this.timer = this.hunt;
      }
      speed = this.dart > 0 ? 2.6 : this.p.distanceTo(this.t) > 6 ? 1.1 : 0.5;
      if (this.dart > 0) this.dart -= dt;
    } else if (this.timer <= 0 || this.p.distanceTo(this.t) < 0.8) {
      this.timer = rand(5, 14);
      if (this.kind === 'curious' && env.diver && Math.random() < 0.5 && env.diver.distanceTo(this.p) < 18) {
        this.t.copy(env.diver).add(new THREE.Vector3(rand(-4, 4), rand(-1, 1.5), rand(-4, 4)));
      } else {
        const a = Math.random() * TAU, r = Math.random() * this.radius;
        const x = this.home.x + Math.cos(a) * r, z = this.home.z + Math.sin(a) * r;
        const fl = seabed(x, z);
        const y = this.depth ? -rand(this.depth[0], this.depth[1]) : fl + rand(0.6, 3);
        this.t.set(x, Math.max(fl + 0.6, Math.min(-0.8, y)), z);
      }
    }
    const acc = this.t.clone().sub(this.p);
    const d = acc.length();
    if (d > 0.01) acc.multiplyScalar(Math.min(1, d / 2.5) * speed / d);
    const steer = acc.sub(this.v).multiplyScalar(hunting ? 1.6 : 0.8);
    if (env.diver && this.kind !== 'curious' && (this.kind !== 'tarpon' || env.night)) {
      const away = this.p.clone().sub(env.diver), dd = away.length(), R = this.kind === 'tarpon' ? 1.3 : 1.8;
      if (dd < R) steer.addScaledVector(away.normalize(), (R - dd) * 3);
    }
    avoidPillars(this.p, steer, env);
    this.v.addScaledVector(steer, dt);
    this.p.addScaledVector(this.v, dt);
    clampWater(this.p, 0.5);
    this.speed2 = this.v.length();
  }
}

/* ================================================================
 * Wereld met dieren
 * ================================================================ */
export class Fauna {
  constructor(scene, quality, opts = {}) {
    this.scene = scene;
    this.lo = quality === 'laag';
    this.night = !!opts.night;
    this.lodD = LOD_FAR[quality] || 13;
    this.schools = [];
    this.solos = [];
    this.meshes = {};
    this.special = [];
    this.crawlers = [];
    this.stars = [];
    this.sleepers = [];
    const S = DG.SPECIES;
    const k = this.lo ? 0.55 : 1;
    if (!this.night) {
      // scholen
      this.addSchool(S.franse_knorvis, Math.round(80 * k), { spread: 1.7, speed: 0.25, roam: 0.15 });
      this.addSchool(S.franse_knorvis, Math.round(60 * k), { spread: 1.5, speed: 0.25, roam: 0.15 });
      this.addSchool(S.kleinbek_knorvis, Math.round(120 * k), { spread: 1.9, speed: 0.28, roam: 0.2 });
      this.addSchool(S.kleinbek_knorvis, Math.round(80 * k), { spread: 1.6, speed: 0.26, roam: 0.2 });
      this.addSchool(S.sergeant, Math.round(26 * k), { spread: 2.0, speed: 0.3, home: { x: -30, z: 2, d: 4 }, roam: 0.3 });
      this.addSchool(S.blauwe_dokter, Math.round(22 * k), { spread: 2.6, speed: 0.45, roam: 0.6 });
      this.addSchool(S.chromis_blauw, Math.round(60 * k), { spread: 1.6, speed: 0.15, home: HANG[0], roam: 0.05 });
      this.addSchool(S.chromis_blauw, Math.round(40 * k), { spread: 1.4, speed: 0.15, home: HANG[3], roam: 0.05 });
      if (hasModel('zilvervisje')) {
        this.addSchool(ZILVER, Math.round(320 * k), { spread: 1.2, speed: 0.3, home: HANG[0], roam: 0.05 });
        this.addSchool(ZILVER, Math.round(200 * k), { spread: 1.0, speed: 0.3, home: HANG[2], roam: 0.08 });
      }
      // solo's
      for (let i = 0; i < 6; i++) this.addSolo(S.tarpon, { kind: 'tarpon', home: { x: CENTER.x + rand(-3, 3), z: rand(-4, 4), d: 8 }, radius: 7, speed: 0.22, depth: [3.5, 9] });
      this.addSolo(S.barracuda, { kind: 'curious', home: HANG[1], radius: 14, speed: 0.4, depth: [2, 7] });
      [S.franse_keizer, S.franse_keizer, S.koningin_keizer, S.koningin_keizer, S.stoplicht_papegaai, S.stoplicht_papegaai, S.stoplicht_papegaai, S.koffervis, S.koffervis].forEach((s) => this.addSolo(s, { radius: 8, speed: 0.3 }));
      for (let i = 0; i < 3; i++) this.addSolo(S.trompetvis, { kind: 'hover', radius: 3, speed: 0.12, vertical: true });
    } else {
      // 's nachts: knorvissen verspreid op het zand, rifvisjes slapen in spleten,
      // zilvervisjes komen op het licht af en de tarpons jagen erop
      this.addSchool(S.franse_knorvis, Math.round(36 * k), { spread: 6, speed: 0.1, roam: 0.3, low: true });
      this.addSchool(S.kleinbek_knorvis, Math.round(50 * k), { spread: 7, speed: 0.1, roam: 0.3, low: true });
      if (hasModel('zilvervisje')) {
        this.addSchool(ZILVER, Math.round(240 * k), { spread: 1.0, speed: 0.35, home: HANG[0], roam: 0.05, light: true });
        this.addSchool(ZILVER, Math.round(160 * k), { spread: 0.9, speed: 0.35, home: HANG[2], roam: 0.08, light: true });
      }
      if (hasModel('rifinktvis')) {
        this.addSchool(S.rifinktvis, 6, { spread: 1.3, speed: 0.12, home: { x: -24, z: 12, d: 4 }, roam: 0.15, depth: [0.9, 2.6] });
        this.addSchool(S.rifinktvis, 4, { spread: 1.1, speed: 0.12, home: { x: -62, z: -6, d: 6 }, roam: 0.15, depth: [1.0, 3.0] });
      }
      for (let i = 0; i < 6; i++) this.addSolo(S.tarpon, { kind: 'tarpon', home: { x: CENTER.x + rand(-6, 6), z: rand(-5, 5), d: 8 }, radius: 10, speed: 0.25, depth: [2.5, 8] });
      this.addSolo(S.barracuda, { kind: 'wander', home: HANG[1], radius: 6, speed: 0.1, depth: [2, 6] });
      for (let i = 0; i < 2; i++) this.addSolo(S.trompetvis, { kind: 'hover', radius: 2, speed: 0.06, vertical: true });
    }
    this.buildMeshes();
    // schildpadden in het ondiepe aan de noordkant ('s nachts slapen ze op de bodem)
    this.turtles = [];
    [['groene_schildpad', 0.95], ['groene_schildpad', 0.9], ['karet', 0.9]].forEach(([id, sc], i) => {
      if (this.night && i === 2) return;
      const m = turtleModel(id);
      const x = rand(-36, -10), z = rand(12, 40);
      m.position.set(x, seabed(x, z) + 0.25, z);
      m.scale.setScalar(sc * DG.SPECIES[id].size * (m.userData.uPh ? 1.45 : 1));
      scene.add(m);
      this.turtles.push({ m, spc: DG.SPECIES[id], state: this.night ? 'sleep' : 'graze', timer: rand(20, 80), t: m.position.clone(), v: new THREE.Vector3(), ph: Math.random() * 6, L: DG.SPECIES[id].size });
      if (this.night) { m.position.y = seabed(x, z) + 0.12; m.rotation.y = Math.random() * TAU; }
    });
    // kikvorsvissen op pijlers
    this.frogs = [];
    // adelaarsrog bij de rifrand (niet altijd)
    this.ray = null;
    if (!this.night && Math.random() < 0.5) {
      const r = eagleRayModel();
      scene.add(r);
      this.ray = { m: r, spc: DG.SPECIES.adelaarsrog, a: Math.random() * TAU, L: 2.2 };
    }
  }
  placeFrogs(pillars) {
    const cand = pillars.filter((p) => p.y0 < -6);
    for (let i = 0; i < 2; i++) {
      const p = cand[Math.floor(Math.random() * cand.length)];
      const y = -rand(4.5, Math.min(8, -p.y0 - 1));
      const a = Math.random() * TAU;
      const at = pillarAt(p, y);
      const m = frogfishModel();
      m.position.set(at.x + Math.cos(a) * 0.62, y, at.z + Math.sin(a) * 0.62);
      m.rotation.y = -a;
      m.scale.setScalar(DG.SPECIES.kikvorsvis_geel.ds * 0.6);
      this.scene.add(m);
      this.frogs.push({ m, spc: DG.SPECIES.kikvorsvis_geel, hidden: true, L: 0.12 });
    }
    // murenen aan de voet van de pijlers en een octopus tussen het puin (niet altijd);
    // 's nachts zwemmen murenen, octopussen en langoesten vrij over de bodem
    this.lurkers = [];
    const night = this.night;
    const onFloor = (m, x, z) => { m.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(m); m.position.set(x, seabed(x, z) - (b.min.y - m.position.y) - 0.03, z); return m.position.y - seabed(x, z); };
    const pick = () => cand[Math.floor(Math.random() * cand.length)];
    const nearPillar = (r) => { const p = pick(); const a = Math.random() * TAU; const at = pillarAt(p, p.y0 + 0.3); return { x: at.x + Math.cos(a) * r, z: at.z + Math.sin(a) * r, a }; };
    const crawler = (m, spc, L, opts) => {
      const q = nearPillar(opts.r || 1.2);
      m.rotation.y = -q.a;
      const lift = onFloor(m, q.x, q.z);
      this.scene.add(m);
      const o = { m, spc, L, hidden: true, lift, home: new THREE.Vector3(q.x, 0, q.z), t: new THREE.Vector3(q.x, 0, q.z), timer: rand(1, 5), pause: 0, speed: opts.speed, range: opts.range, wig: opts.wig || 0, yaw: -q.a, ph: Math.random() * TAU };
      if (night) this.crawlers.push(o);
      this.lurkers.push(o);
      return o;
    };
    if (hasModel('gevlekte_murene')) {
      for (let i = 0; i < 2; i++) {
        // kop naar +X, golft zachtjes
        const wave = night ? 'transformed.z += sin(uTime * 3.0 - position.x * 7.0) * 0.035 * (0.7 - position.x);' : 'transformed.z += sin(uTime * 1.2 - position.x * 7.0) * 0.016 * (0.7 - position.x);';
        const m = new THREE.Mesh(modelGeo('gevlekte_murene', 'center', { rot: [0, Math.PI / 2, 0] }), animalMat('gevlekte_murene', night ? 'morayN' : 'morayM', wave));
        m.scale.setScalar(DG.SPECIES.gevlekte_murene.size * 0.95);
        crawler(m, DG.SPECIES.gevlekte_murene, 1, { r: 0.95, speed: 0.22, range: 9, wig: 0.35 });
      }
    }
    const octoMat = () => uw(new THREE.MeshStandardMaterial({ map: modelMap('rifoctopus'), roughness: 0.7, metalness: 0.02 }), {
      caus: true, key: night ? 'octoN' : 'octoM',
      vertexPars: 'uniform float uTime;\n',
      vertexBegin: `{
        float r = length(position.xz);
        float k = smoothstep(0.12, 0.45, r);
        transformed.y += sin(uTime * 1.1 + atan(position.z, position.x) * 2.0 + r * 9.0) * 0.025 * k;
        transformed.xz *= 1.0 + sin(uTime * 0.7 + r * 5.0) * 0.03 * k;
      }`,
      // kleurwisselingen over de huid
      fragmentColor: night ? 'diffuseColor.rgb *= 1.0 + 0.45 * sin(uTime * 0.9 + vWPos.x * 6.0 + vWPos.z * 4.0) * vec3(0.9, 0.35, 0.15);' : '',
    });
    if (hasModel('rifoctopus')) {
      const n = night ? 2 : Math.random() < 0.75 ? 1 : 0;
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(modelGeo('rifoctopus', 'center'), octoMat());
        m.scale.setScalar(0.65);
        crawler(m, DG.SPECIES.rifoctopus, 0.5, { r: 1.8, speed: 0.09, range: 6 });
      }
    }
    if (night && hasModel('langoest')) {
      // kop naar +X; pootjes bewegen als hij loopt
      const lm = uw(new THREE.MeshStandardMaterial({ map: modelMap('langoest'), roughness: 0.6, metalness: 0.05 }), {
        caus: true, key: 'lobsterM',
        vertexPars: 'uniform float uTime;\n',
        vertexBegin: 'if (position.y < -0.02 && abs(position.z) > 0.08) transformed.y += sin(uTime * 9.0 + position.x * 25.0 + sign(position.z) * 1.5) * 0.012;',
      });
      for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(modelGeo('langoest', 'center', { rot: [0, Math.PI / 2, 0] }), lm);
        m.scale.setScalar(DG.SPECIES.langoest.size * 1.15);
        crawler(m, DG.SPECIES.langoest, 0.45, { r: 1.0, speed: 0.06, range: 5 });
      }
    }
    if (!night) return;
    // slapende papegaaivissen in een slijmcocon aan de voet van de pijlers
    if (hasModel('stoplicht_papegaai')) {
      const L = DG.SPECIES.stoplicht_papegaai.size;
      const fm = uw(new THREE.MeshStandardMaterial({ map: modelMap('stoplicht_papegaai'), roughness: 0.6 }), { caus: true, key: 'sleepF' });
      const cm = uw(new THREE.MeshStandardMaterial({ color: 0xeef6ff, transparent: true, opacity: 0.34, roughness: 0.08, metalness: 0, depthWrite: false, side: THREE.DoubleSide }), { key: 'cocoon' });
      for (let i = 0; i < 3; i++) {
        const g = new THREE.Group();
        const geo = modelGeo('stoplicht_papegaai', 'fish');
        geo.scale(L, L, L);
        g.add(new THREE.Mesh(geo, fm));
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), cm);
        c.scale.set(L * 1.3, L * 0.62, L * 0.5);
        c.renderOrder = 3;
        g.add(c);
        const q = nearPillar(1.1);
        g.rotation.set(0, -q.a + Math.PI / 2, rand(-0.12, 0.12));
        g.position.set(q.x, seabed(q.x, q.z) + L * 0.3, q.z);
        this.scene.add(g);
        this.sleepers.push({ m: g, spc: DG.SPECIES.stoplicht_papegaai, L, hidden: true, sleep: true });
      }
    }
    // mandsters: uitgevouwen op de pijlers, gekromd als een schotel (foto van Magnific met transparante achtergrond)
    const tex = new THREE.TextureLoader().load(new URL('../img/vis/mandster.webp', import.meta.url).href);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const dish = new THREE.PlaneGeometry(1, 1, 14, 14);
    const pa = dish.attributes.position;
    for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, (x * x + y * y) * 0.45); }
    dish.computeVertexNormals();
    for (let i = 0; i < 5; i++) {
      const p = pick();
      const y = -rand(3, Math.min(7, -p.y0 - 1));
      const a = Math.random() * TAU;
      const at = pillarAt(p, y);
      const uCurl = { value: 0 };
      const mat = uw(new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.85 }), {
        caus: true, key: 'mandster', uniforms: { uCurl },
        vertexPars: 'uniform float uTime; uniform float uCurl;\n',
        vertexBegin: `{
          float r = length(position.xy);
          transformed.xy *= 1.0 - uCurl * 0.55 * r;
          transformed.z += uCurl * 0.7 * r * r + sin(uTime * 0.8 + r * 6.0) * 0.012 * r;
        }`,
      });
      const m = new THREE.Mesh(dish, mat);
      const sc = rand(0.55, 0.85);
      m.scale.setScalar(sc);
      // schotel naar buiten gericht, licht omhoog gekanteld
      const out = new THREE.Vector3(Math.cos(a), 0.25, Math.sin(a)).normalize();
      m.position.set(at.x + Math.cos(a) * 0.72, y, at.z + Math.sin(a) * 0.72);
      m.lookAt(m.position.clone().add(out));
      this.scene.add(m);
      this.stars.push({ m, spc: DG.SPECIES.mandster, L: sc, uCurl, lit: 0, warned: false });
    }
  }
  addSchool(spc, n, opts) { if (spc) this.schools.push(new School(spc, n, opts)); }
  addSolo(spc, opts) { if (spc) this.solos.push(new Solo(spc, opts)); }
  buildMeshes() {
    const count = {}, spcs = {};
    this.schools.forEach((s) => { count[s.spc.id] = (count[s.spc.id] || 0) + s.n; spcs[s.spc.id] = s.spc; });
    this.solos.forEach((s) => { count[s.spc.id] = (count[s.spc.id] || 0) + 1; spcs[s.spc.id] = s.spc; });
    const mk = (spc, a, n) => {
      const geo = a.geo.clone();
      const ph = new Float32Array(n), sp = new Float32Array(n);
      for (let i = 0; i < n; i++) { ph[i] = Math.random() * TAU; sp[i] = 0.4; }
      geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1));
      geo.setAttribute('aSp', new THREE.InstancedBufferAttribute(sp, 1));
      const mesh = new THREE.InstancedMesh(geo, fishMaterial(spc, a), n);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      return mesh;
    };
    Object.keys(count).forEach((id) => {
      const spc = spcs[id];
      const a = fishAsset(spc);
      const n = count[id];
      // op afstand een eenvoudiger model met dezelfde maat (minder driehoeken)
      let far = null;
      if (a.model && hasModel(id + '-ver')) far = mk(spc, Object.assign(modelFishAsset(spc, id + '-ver'), { headX: a.headX, tailX: a.tailX }), n);
      this.meshes[id] = { mesh: mk(spc, a, n), far, n, spc, L: a.L, i: 0, j: 0 };
    });
  }
  update(dt, env, t) {
    this.schools.forEach((s) => s.update(dt, env));
    this.solos.forEach((s) => s.update(dt, env));
    Object.values(this.meshes).forEach((m) => { m.i = 0; m.j = 0; });
    const cam = env.cam, lod2 = this.lodD * this.lodD, sh = env.shadows;
    const tmp = new THREE.Object3D();
    tmp.rotation.order = 'YZX';
    const dir = new THREE.Vector3();
    const put = (spc, p, v, speed, vertical, school) => {
      const m = this.meshes[spc.id];
      if (!m) return;
      // vissen in een school kijken grotendeels dezelfde kant op als de school
      dir.copy(v);
      if (school && school.vel.lengthSq() > 1e-4) dir.multiplyScalar(0.35).addScaledVector(school.vel, 1.6);
      const hv = Math.hypot(dir.x, dir.z);
      tmp.position.copy(p);
      if (hv > 0.02 || Math.abs(dir.y) > 0.02) {
        const yaw = Math.atan2(-dir.z, dir.x);
        const pitch = Math.max(-0.6, Math.min(0.6, Math.atan2(dir.y, hv)));
        tmp.rotation.set(0, yaw, vertical ? 1.25 : pitch);
      } else if (vertical) tmp.rotation.z = 1.25;
      tmp.scale.setScalar(1);
      tmp.updateMatrix();
      const useFar = m.far && cam && p.distanceToSquared(cam) > lod2;
      const mesh = useFar ? m.far : m.mesh;
      const k = useFar ? m.j++ : m.i++;
      mesh.setMatrixAt(k, tmp.matrix);
      mesh.geometry.attributes.aSp.array[k] = Math.min(1, speed / (m.L * 1.5 + 0.2));
      if (sh && m.L > 0.12) sh.add(p.x, p.y, p.z, m.L * 0.35, m.L * 0.9, tmp.rotation.y + Math.PI / 2, Math.min(0.5, 0.18 + m.L * 0.25));
    };
    this.schools.forEach((s) => s.members.forEach((f) => put(s.spc, f.p, f.v, f.speed || 0, false, s)));
    this.solos.forEach((s) => put(s.spc, s.p, s.v, s.speed2 || 0, s.vertical));
    Object.values(this.meshes).forEach((m) => {
      m.mesh.count = m.i;
      m.mesh.instanceMatrix.needsUpdate = true;
      m.mesh.geometry.attributes.aSp.needsUpdate = true;
      if (m.far) {
        m.far.count = m.j;
        m.far.instanceMatrix.needsUpdate = true;
        m.far.geometry.attributes.aSp.needsUpdate = true;
      }
    });
    // 's nachts: murenen, octopussen en langoesten lopen/zwemmen over de bodem
    this.crawlers.forEach((o) => this.crawl(o, dt, env));
    // mandsters rollen zich op als je er te lang op schijnt
    const L = env.lamp;
    this.stars.forEach((st) => {
      let lit = false;
      if (L && L.on) {
        const v = st.m.position.clone().sub(L.pos), d = v.length();
        lit = d < 3.5 && v.normalize().dot(L.dir) > L.cos;
      }
      st.lit = lit ? st.lit + dt : Math.max(0, st.lit - dt * 0.5);
      const c = st.uCurl;
      c.value = Math.max(0, Math.min(0.85, c.value + (st.lit > 2.5 ? dt * 0.09 : -dt * 0.03)));
      if (c.value > 0.3 && !st.warned) { st.warned = true; if (env.onMsg) env.onMsg('De mandster rolt zich langzaam op in je lamplicht. Schijn niet te lang op één dier.'); }
    });
    // schildpadden: grazen op de bodem en af en toe naar boven om adem te halen ('s nachts slapen ze)
    this.turtles.forEach((tu) => {
      tu.timer -= dt;
      const p = tu.m.position;
      if (tu.state === 'sleep') {
        tu.ph += dt * 0.15;
        if (tu.m.userData.uPh) tu.m.userData.uPh.value = Math.sin(tu.ph) * 0.15;
        return;
      }
      if (tu.state === 'graze' && tu.timer <= 0) { tu.state = 'up'; tu.timer = 60; }
      if (tu.state === 'graze') {
        if (p.distanceTo(tu.t) < 0.6 || !tu.tset) { const x = Math.max(-45, Math.min(-6, p.x + rand(-6, 6))), z = Math.max(8, Math.min(46, p.z + rand(-6, 6))); tu.t.set(x, seabed(x, z) + 0.25, z); tu.tset = true; }
      } else if (tu.state === 'up') {
        tu.t.set(p.x + 0.5, -0.3, p.z + 0.5);
        if (p.y > -0.6) { tu.state = 'down'; tu.timer = 4; }
      } else if (tu.state === 'down') {
        if (tu.timer <= 0) { tu.state = 'graze'; tu.timer = rand(90, 200); tu.tset = false; }
      }
      const dir = tu.t.clone().sub(p);
      const dd = dir.length();
      const spd = tu.state === 'graze' ? 0.12 : 0.3;
      if (dd > 0.05) dir.multiplyScalar(Math.min(1, dd) * spd / dd);
      tu.v.lerp(dir, dt * 0.6);
      p.addScaledVector(tu.v, dt);
      const fl = seabed(p.x, p.z) + 0.22;
      if (p.y < fl) p.y = fl;
      if (tu.v.lengthSq() > 0.0004) tu.m.rotation.y = Math.atan2(-tu.v.x, -tu.v.z);
      tu.m.rotation.x = Math.max(-0.5, Math.min(0.5, tu.v.y * 1.5));
      tu.ph += dt * (0.8 + tu.v.length() * 3);
      if (sh) sh.add(p.x, p.y, p.z, tu.L * 0.9, tu.L * 1.1, tu.m.rotation.y, 0.55);
      if (tu.m.userData.uPh) tu.m.userData.uPh.value = tu.ph;
      tu.m.userData.flippers.forEach((f) => {
        f.piv.rotation.z = f.s * (Math.sin(tu.ph + (f.front ? 0 : 1)) * (f.front ? 0.5 : 0.25));
        f.piv.rotation.y = f.s * (f.front ? 0.5 + Math.sin(tu.ph) * 0.3 : -0.4);
      });
    });
    // adelaarsrog draait grote rondes langs de rifrand
    if (this.ray) {
      const r = this.ray;
      r.a += dt * 0.025;
      const x = -150 + Math.cos(r.a) * 18, z = Math.sin(r.a) * 70;
      const y = Math.max(seabed(x, z) + 2.5, -16);
      const np = new THREE.Vector3(x, y, z);
      const v = np.clone().sub(r.m.position);
      r.m.position.copy(np);
      if (v.lengthSq() > 1e-6) r.m.rotation.y = Math.atan2(-v.z, v.x);
      if (sh) sh.add(x, y, z, 2.0, 1.4, r.m.rotation.y, 0.5);
    }
  }
  // over de bodem lopen naar telkens een nieuw doel in de buurt, met pauzes; om pijlers heen
  crawl(o, dt, env) {
    const p = o.m.position;
    o.timer -= dt;
    o.ph += dt;
    const dx = o.t.x - p.x, dz = o.t.z - p.z, dd = Math.hypot(dx, dz);
    if (o.timer <= 0 || dd < 0.15) {
      o.timer = rand(6, 16);
      const a = Math.random() * TAU, r = rand(0.5, o.range);
      o.t.set(o.home.x + Math.cos(a) * r, 0, o.home.z + Math.sin(a) * r);
      o.pause = Math.random() < 0.45 ? rand(2, 7) : 0;
    }
    if (o.pause > 0) { o.pause -= dt; return; }
    if (dd < 0.01) return;
    let want = Math.atan2(-dz, dx) + Math.sin(o.ph * 2.2) * o.wig;
    let dy = want - o.yaw;
    while (dy > Math.PI) dy -= TAU;
    while (dy < -Math.PI) dy += TAU;
    o.yaw += dy * Math.min(1, dt * 1.5);
    const step = o.speed * dt * Math.max(0.2, Math.cos(dy));
    let nx = p.x + Math.cos(o.yaw) * step, nz = p.z - Math.sin(o.yaw) * step;
    for (const pl of env.nearPillars || []) {
      const a = pillarAt(pl, pl.y0 + 0.3);
      const ex = nx - a.x, ez = nz - a.z, e = Math.hypot(ex, ez);
      if (e < 0.85 && e > 0.001) { nx = a.x + (ex / e) * 0.85; nz = a.z + (ez / e) * 0.85; }
    }
    p.x = nx; p.z = nz;
    p.y = seabed(p.x, p.z) + o.lift;
    o.m.rotation.y = o.yaw;
  }
  // alles wat gespot kan worden, met positie
  spottables() {
    const out = [];
    this.schools.forEach((s) => { if (s.spc.log) out.push({ spc: s.spc, p: s.members[0].p, L: s.spc.size, v: s.members[0].v }); });
    this.solos.forEach((s) => { if (s.spc.log) out.push({ spc: s.spc, p: s.p, L: s.spc.size, v: s.v }); });
    this.turtles.forEach((t) => out.push({ spc: t.spc, p: t.m.position, L: t.L, v: t.v }));
    this.frogs.forEach((f) => out.push({ spc: f.spc, p: f.m.position, L: f.L, hidden: true }));
    (this.lurkers || []).forEach((f) => { if (f.spc) out.push({ spc: f.spc, p: f.m.position, L: f.L, hidden: true }); });
    this.sleepers.forEach((f) => out.push({ spc: f.spc, p: f.m.position, L: f.L, hidden: true, sleep: true }));
    this.stars.forEach((f) => out.push({ spc: f.spc, p: f.m.position, L: f.L }));
    if (this.ray) out.push({ spc: this.ray.spc, p: this.ray.m.position, L: 2.2 });
    return out;
  }
}
