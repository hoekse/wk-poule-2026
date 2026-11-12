/* Diepblauw 3D — bodem van de Zoutpier: zandplaat, puin, rifrand en drop-off tot 40 m, koralen en sponzen */
import * as THREE from 'three';
import { uw, UW } from './water.js';

// diepteprofiel van kust (x=0) naar zee (x negatief), in meters (y omhoog)
const PROFILE = [
  [60, 3.2], [20, 1.6], [6, 0.5], [0, -0.4], [-6, -1.4], [-18, -3.0], [-40, -5.0], [-70, -7.2],
  [-100, -9.4], [-122, -11.0], [-138, -12.2], [-148, -13.6], [-156, -17], [-166, -24], [-178, -31],
  [-192, -36], [-215, -39], [-300, -41],
];
function smooth(t) { return t * t * (3 - 2 * t); }
function profile(x) {
  if (x >= PROFILE[0][0]) return PROFILE[0][1];
  for (let i = 1; i < PROFILE.length; i++) {
    const a = PROFILE[i - 1], b = PROFILE[i];
    if (x >= b[0]) return a[1] + (b[1] - a[1]) * smooth((a[0] - x) / (a[0] - b[0]));
  }
  return PROFILE[PROFILE.length - 1][1];
}
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = smooth(xf), v = smooth(zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z) {
  return vnoise(x, z) * 0.5 + vnoise(x * 2.1, z * 2.1) * 0.25 + vnoise(x * 4.3, z * 4.3) * 0.125;
}

// bodemhoogte (y) op positie x,z
export function seabed(x, z) {
  let y = profile(x);
  const reef = x < -138 ? Math.min(1, (-138 - x) / 12) : 0;
  y += (fbm(x * 0.05, z * 0.05) - 0.45) * (1.2 + reef * 3.0);
  y += Math.sin(z * 0.035 + 1.3) * 0.5 * Math.min(1, Math.max(0, -x / 30));
  // rifrand iets grillig
  if (x < -140) y -= Math.max(0, Math.sin(z * 0.06) * 2.5 * reef);
  return y;
}

/* ---------------- textures ---------------- */
function canvasTex(size, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
export function sandTexture() {
  return canvasTex(512, (g, s) => {
    g.fillStyle = '#e8e2d2';
    g.fillRect(0, 0, s, s);
    const img = g.getImageData(0, 0, s, s);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const p = i / 4, x = p % s, y = Math.floor(p / s);
      const rip = Math.sin((x * 0.09 + Math.sin(y * 0.03) * 2.5)) * 0.5 + 0.5;
      const n = Math.random() * 26 - 13 + rip * 14;
      d[i] = 222 + n; d[i + 1] = 214 + n; d[i + 2] = 196 + n;
    }
    g.putImageData(img, 0, 0);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = ['rgba(120,105,85,0.35)', 'rgba(255,255,255,0.5)', 'rgba(170,150,120,0.4)', 'rgba(90,80,70,0.25)'][i % 4];
      const r = Math.random() * 3 + 0.6;
      g.beginPath(); g.ellipse(Math.random() * s, Math.random() * s, r * 1.4, r, Math.random() * 3, 0, Math.PI * 2); g.fill();
    }
  }, 1);
}
function sandNormal() {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const img = g.createImageData(s, s);
  const h = (x, y) => Math.sin(x * 0.18 + Math.sin(y * 0.05) * 3) * 0.6 + (hash(x, y) - 0.5) * 0.4;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
      const nx = -dx * 0.5, ny = -dy * 0.5, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      const i = (y * s + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------------- bodem-mesh ---------------- */
export function makeSeabed(quality) {
  const W = 340, D = 300;
  const segX = quality === 'laag' ? 110 : 170, segZ = quality === 'laag' ? 96 : 150;
  const geo = new THREE.PlaneGeometry(W, D, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(-120, 0, 0);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const sand = new THREE.Color('#efe8d6'), rubble = new THREE.Color('#a59a86'), reefC = new THREE.Color('#7f735f'), algae = new THREE.Color('#8d9a6e'), beach = new THREE.Color('#f3ecdb'), deep = new THREE.Color('#6d6a66'), purple = new THREE.Color('#8a6a8a');
  const c = new THREE.Color();
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = seabed(x, z);
    pos.setY(i, y);
    uv.setXY(i, x / 6, z / 6);
    // kleur
    const n = fbm(x * 0.08 + 7, z * 0.08);
    c.copy(sand);
    if (y > 0.3) c.copy(beach);
    const rubbleAmt = Math.max(0, 1 - Math.abs(z) / 14) * (x < -4 && x > -130 ? 0.55 : 0) + Math.max(0, n - 0.55) * 1.4;
    c.lerp(rubble, Math.min(0.75, rubbleAmt));
    if (x < -136) {
      const r = Math.min(1, (-136 - x) / 14);
      c.lerp(reefC, r * 0.8);
      c.lerp(n > 0.55 ? purple : algae, r * 0.25 * n);
    }
    if (y < -28) c.lerp(deep, Math.min(1, (-28 - y) / 10) * 0.5);
    if (x > -40 && x < -6 && z > 6 && z < 44 && n > 0.42) c.lerp(algae, 0.35);
    c.multiplyScalar(0.92 + hash(x * 3.1, z * 2.7) * 0.1);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mat = uw(new THREE.MeshStandardMaterial({ vertexColors: true, map: sandTexture(), normalMap: sandNormal(), normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.95, metalness: 0 }), { caus: true, key: 'sand' });
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = false;
  return m;
}

/* ---------------- koralen, sponzen, rotsen (geïnstanceerd) ---------------- */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// zwaaiende hoge vormen (zeezwepen, waaiers, zeegras) via vertex-shader
function swayMat(params) {
  const key = params.key;
  params = Object.assign({}, params);
  delete params.key;
  const mat = new THREE.MeshStandardMaterial(params);
  delete params.key;
  return uw(mat, {
    caus: true,
    key: 'sway' + (key || ''),
    vertexPars: 'uniform float uTime;\n',
    vertexBegin: `{
      vec4 ip = vec4(0.0,0.0,0.0,1.0);
      #ifdef USE_INSTANCING
        ip = instanceMatrix * ip;
      #endif
      float h = max(0.0, position.y);
      float ph = ip.x * 0.37 + ip.z * 0.21;
      transformed.x += sin(uTime * 0.9 + ph) * 0.06 * h * h;
      transformed.z += cos(uTime * 0.7 + ph) * 0.05 * h * h;
    }`,
  });
}

// vertakte zeezweep (Caribische gorgoon)
function seaRodGeometry(seed) {
  const r = rng(seed);
  const parts = [];
  function branch(p, dir, len, rad, depth) {
    const end = p.clone().addScaledVector(dir, len);
    const g = new THREE.CylinderGeometry(rad * 0.7, rad, len, 5, 1, true);
    g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.applyQuaternion(q);
    g.translate(p.x, p.y, p.z);
    parts.push(g);
    if (depth > 0) {
      const n = r() < 0.4 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const nd = dir.clone().add(new THREE.Vector3((r() - 0.5) * 0.9, 0.35, (r() - 0.5) * 0.9)).normalize();
        branch(end, nd, len * (0.65 + r() * 0.25), rad * 0.72, depth - 1);
      }
    }
  }
  branch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 0.32, 0.035, 4);
  return mergeGeos(parts);
}
function mergeGeos(list) {
  let nPos = 0, nIdx = 0;
  list.forEach((g) => { nPos += g.attributes.position.count; nIdx += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(nPos * 3), nor = new Float32Array(nPos * 3), uv = new Float32Array(nPos * 2);
  const idx = new Uint32Array(nIdx);
  let po = 0, io = 0;
  list.forEach((g) => {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, po * 3);
    nor.set(g.attributes.normal.array, po * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, po * 2);
    const gi = g.index ? g.index.array : [...Array(g.attributes.position.count).keys()];
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + po;
    po += g.attributes.position.count; io += gi.length;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
export { mergeGeos };

function lumpy(geo, amt, freq, seed) {
  const p = geo.attributes.position;
  const r = rng(seed);
  const o1 = r() * 10, o2 = r() * 10;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * freq + o1) * Math.cos(z * freq * 1.3 + o2) * 0.5 + Math.sin(y * freq * 1.7 + o1) * 0.5;
    const k = 1 + n * amt;
    p.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

function brainTex() {
  return canvasTex(256, (g, s) => {
    g.fillStyle = '#c9b98a'; g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(110,90,50,0.55)'; g.lineWidth = 3;
    for (let y = 0; y < s; y += 9) {
      g.beginPath();
      for (let x = 0; x <= s; x += 4) { const yy = y + Math.sin(x * 0.11 + y * 0.7) * 4 + Math.sin(x * 0.031 + y) * 3; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); }
      g.stroke();
    }
  });
}
function fanTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 256);
  g.strokeStyle = '#ffffff';
  g.lineCap = 'round';
  function br(x, y, a, len, w, d) {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    if (d > 0) { br(x2, y2, a - 0.35, len * 0.75, w * 0.75, d - 1); br(x2, y2, a + 0.35, len * 0.75, w * 0.75, d - 1); }
  }
  br(128, 250, -Math.PI / 2, 60, 9, 6);
  g.lineWidth = 1.2;
  g.globalAlpha = 0.8;
  for (let i = 0; i < 70; i++) { g.beginPath(); g.moveTo(20 + Math.random() * 216, 30 + Math.random() * 200); g.lineTo(20 + Math.random() * 216, 30 + Math.random() * 200); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  return t;
}

export function makeReef(scene, quality, pillarList) {
  const R = rng(20251112);
  const dense = quality === 'laag' ? 0.55 : 1;
  const objs = [];
  const dummy = new THREE.Object3D();
  function place(mesh, list) {
    list.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
      dummy.scale.set(it.s, it.sy || it.s, it.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (it.c && mesh.instanceColor !== undefined) mesh.setColorAt(i, it.c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    objs.push(mesh);
  }
  const nearPillar = () => {
    const p = pillarList[Math.floor(R() * pillarList.length)];
    const a = R() * Math.PI * 2, d = 0.9 + R() * 3.5;
    return [p.x + Math.cos(a) * d, p.z + Math.sin(a) * d];
  };
  const reefSpot = () => [-140 - R() * 50, (R() - 0.5) * 220];
  const flatSpot = () => [-10 - R() * 125, (R() - 0.5) * 120];

  // zeezwepen / zeeveren
  const rodGeos = [seaRodGeometry(3), seaRodGeometry(7), seaRodGeometry(11)];
  const rodCols = ['#7a4f86', '#8a6a52', '#6f5d8e', '#9b6b7a', '#a07a58'];
  rodGeos.forEach((g, gi) => {
    const list = [];
    const n = Math.round(110 * dense);
    for (let i = 0; i < n; i++) {
      const q = R();
      const [x, z] = q < 0.4 ? nearPillar() : q < 0.85 ? reefSpot() : flatSpot();
      list.push({ x, z, y: seabed(x, z) - 0.02, s: 1.1 + R() * 1.4, ry: R() * 6.3, c: new THREE.Color(rodCols[Math.floor(R() * rodCols.length)]) });
    }
    const m = new THREE.InstancedMesh(g, swayMat({ color: 0xffffff, roughness: 0.9, key: 'rod' }), list.length);
    place(m, list);
  });

  // waaierkoralen bij de rifrand
  {
    const g = new THREE.PlaneGeometry(1.4, 1.3, 6, 6);
    g.translate(0, 0.65, 0);
    const mat = swayMat({ color: 0xffffff, map: fanTex(), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9, key: 'fan' });
    const list = [];
    for (let i = 0; i < Math.round(110 * dense); i++) {
      const [x, z] = R() < 0.85 ? reefSpot() : nearPillar();
      list.push({ x, z, y: seabed(x, z) - 0.05, s: 0.8 + R() * 1.2, ry: R() * 6.3, c: new THREE.Color(['#8e4fb4', '#b2508a', '#c86a3a', '#9a63c8'][i % 4]) });
    }
    place(new THREE.InstancedMesh(g, mat, list.length), list);
  }

  // hersenkoralen en sterkoralen
  {
    const g = lumpy(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0.08, 6, 4);
    const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, map: brainTex(), roughness: 0.85 }), { caus: true, key: 'brain' });
    const list = [];
    for (let i = 0; i < Math.round(200 * dense); i++) {
      const [x, z] = R() < 0.8 ? reefSpot() : nearPillar();
      list.push({ x, z, y: seabed(x, z) - 0.12, s: 0.6 + R() * 1.6, sy: 0.5 + R() * 0.5, ry: R() * 6.3, c: new THREE.Color(['#d8c79a', '#b7c27a', '#d6a77a', '#a7b98c', '#c8b0c0'][i % 5]) });
    }
    place(new THREE.InstancedMesh(g, mat, list.length), list);
  }

  // buisponzen (clusters)
  {
    const parts = [];
    for (let i = 0; i < 4; i++) {
      const h = 0.35 + i * 0.12;
      const t = new THREE.CylinderGeometry(0.06, 0.05, h, 10, 1, true);
      t.translate(Math.cos(i * 1.7) * 0.09, h / 2, Math.sin(i * 1.7) * 0.09);
      parts.push(t);
    }
    const g = mergeGeos(parts);
    const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide }), { caus: true, key: 'tube' });
    const list = [];
    for (let i = 0; i < Math.round(170 * dense); i++) {
      const [x, z] = R() < 0.45 ? nearPillar() : reefSpot();
      list.push({ x, z, y: seabed(x, z) - 0.02, s: 0.8 + R() * 1.4, ry: R() * 6.3, rz: (R() - 0.5) * 0.3, c: new THREE.Color(['#8a3fb0', '#e0b030', '#d8682a', '#6a5ad0', '#c03a5a'][i % 5]) });
    }
    place(new THREE.InstancedMesh(g, mat, list.length), list);
  }

  // vaasponzen en tonsponzen (rifrand)
  {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.12 + Math.pow(t, 0.8) * 0.28, t * 0.9)); }
    const g = new THREE.LatheGeometry(pts, 16);
    const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide }), { caus: true, key: 'vase' });
    const list = [];
    for (let i = 0; i < Math.round(80 * dense); i++) {
      const [x, z] = reefSpot();
      list.push({ x, z, y: seabed(x, z) - 0.05, s: 0.8 + R() * 1.6, ry: R() * 6.3, c: new THREE.Color(['#7a62d8', '#8f4a36', '#a85a40', '#5f6ee0'][i % 4]) });
    }
    place(new THREE.InstancedMesh(g, mat, list.length), list);
  }

  // rotsen en puin
  {
    const g = lumpy(new THREE.IcosahedronGeometry(0.5, 1), 0.25, 3.3, 9);
    const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), { caus: true, key: 'rock' });
    const list = [];
    for (let i = 0; i < Math.round(320 * dense); i++) {
      const [x, z] = R() < 0.5 ? nearPillar() : R() < 0.5 ? reefSpot() : flatSpot();
      const s = 0.15 + Math.pow(R(), 2) * (x < -136 ? 2.2 : 0.8);
      list.push({ x, z, y: seabed(x, z) - s * 0.25, s, sy: s * (0.4 + R() * 0.4), rx: R(), ry: R() * 6, c: new THREE.Color().setHSL(0.09 + R() * 0.05, 0.12 + R() * 0.1, 0.38 + R() * 0.2) });
    }
    place(new THREE.InstancedMesh(g, mat, list.length), list);
  }

  // koraalkoppen (berg- en sterkoraal) die het rif vormen
  {
    const g = lumpy(new THREE.IcosahedronGeometry(0.6, 2), 0.16, 4.1, 21);
    g.scale(1, 0.55, 1);
    const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, map: brainTex(), roughness: 0.9 }), { caus: true, key: 'head' });
    const cols = ['#a08a5a', '#8a7a4a', '#b49a62', '#7a8a5a', '#8a6a7a', '#c0a070', '#9a8070', '#6f7f6a'];
    const list = [];
    for (let i = 0; i < Math.round(340 * dense); i++) {
      const x = -138 - Math.pow(R(), 0.8) * 46, z = (R() - 0.5) * 230;
      const s = 0.6 + Math.pow(R(), 1.5) * 2.4;
      list.push({ x, z, y: seabed(x, z) - s * 0.15, s, sy: s * (0.6 + R() * 0.5), ry: R() * 6.3, c: new THREE.Color(cols[i % cols.length]) });
    }
    place(new THREE.InstancedMesh(g, mat, list.length), list);
  }

  // zeegras in het ondiepe aan de noordkant (waar de schildpadden grazen)
  {
    const g = new THREE.PlaneGeometry(0.018, 0.3, 1, 3);
    g.translate(0, 0.15, 0);
    const mat = swayMat({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide, key: 'grass' });
    const list = [];
    for (let i = 0; i < Math.round(7000 * dense); i++) {
      const x = -6 - R() * 36, z = 8 + R() * 38;
      if (fbm(x * 0.12, z * 0.12) < 0.44) continue;
      list.push({ x, z, y: seabed(x, z) - 0.02, s: 0.7 + R() * 0.7, ry: R() * 6.3, rz: (R() - 0.5) * 0.35, c: new THREE.Color().setHSL(0.24 + R() * 0.05, 0.45, 0.42 + R() * 0.12) });
    }
    place(new THREE.InstancedMesh(g, mat, list.length), list);
  }
  return objs;
}
