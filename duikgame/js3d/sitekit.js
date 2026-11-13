/* Diepblauw 3D — gereedschap dat elke duikstek gebruikt: toevalsgetallen met zaadje,
   naadloze texturen uit foto's, hobbelige stenen en een bodemhoogte die ook op stenen
   en wrakdelen klopt. */
import * as THREE from 'three';

export const rng = (seed) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
export const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

// maakt een foto naadloos door de randen in elkaar over te laten lopen
export function tileable(img, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, w, h);
  const src = g.getImageData(0, 0, w, h), out = g.createImageData(w, h);
  const B = Math.round(Math.min(w, h) * 0.18);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const wx = x < B ? x / B : 1, wy = y < B ? y / B : 1;
      const j = (y * w + (x < B ? (w - B + x) : x)) * 4, k = ((y < B ? (h - B + y) : y) * w + x) * 4;
      for (let ch = 0; ch < 4; ch++) {
        let v = src.data[i + ch];
        if (x < B) v = v * wx + src.data[j + ch] * (1 - wx);
        if (y < B) v = v * wy + src.data[k + ch] * (1 - wy);
        out.data[i + ch] = v;
      }
    }
  }
  g.putImageData(out, 0, 0);
  // uitsnede zonder de overgangsrand
  const c2 = document.createElement('canvas'); c2.width = w - B; c2.height = h - B;
  c2.getContext('2d').drawImage(c, B, B, w - B, h - B, 0, 0, w - B, h - B);
  return c2;
}
export function loadTex(url, cb) {
  const img = new Image();
  img.onload = () => cb(img);
  img.src = url;
}
// naadloze textuur uit een foto; cb krijgt de THREE-textuur zodra hij geladen is
export function tileTex(url, size, cb, opts = {}) {
  loadTex(url, (img) => {
    const t = new THREE.CanvasTexture(tileable(img, size, size));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = opts.aniso || 4;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    cb(t);
  });
}

// hobbels op basis van de positie: hoekpunten die samenvallen schuiven even ver op, dus geen scheuren
export function lumpy(geo, amt, seed) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  const h = (x, y, z) => { const t = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.3) * 43758.5453; return t - Math.floor(t); };
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + (h(Math.round(v.x * 1000) / 1000, Math.round(v.y * 1000) / 1000, Math.round(v.z * 1000) / 1000) - 0.5) * amt;
    v.multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// bodemhoogte inclusief stenen of wrakdelen (straal van boven), met geheugen per 10 cm
export function makeRayGround(baseFn, meshes, top = 8) {
  const rc = new THREE.Raycaster(), o = new THREE.Vector3(), d = new THREE.Vector3(0, -1, 0), memo = new Map();
  rc.far = 60;
  return (x, z) => {
    const k = Math.round(x * 10) * 100000 + Math.round(z * 10);
    let y = memo.get(k);
    if (y !== undefined) return y;
    y = baseFn(x, z);
    o.set(x, top, z); rc.set(o, d);
    const h = rc.intersectObjects(meshes, false);
    if (h.length) y = Math.max(y, h[0].point.y);
    if (memo.size > 200000) memo.clear();
    memo.set(k, y);
    return y;
  };
}

/* ---------------- koraal en sponzen over de bodem verspreiden ---------------- */
import { uw } from './water.js';
import { hasModel, modelGeo, modelMap } from './models.js';
import { swayMat } from './terrain.js';
// sets: [{ id, n, size: [min, max], cols: ['#..'], tint, where(x, z) → bool, sink, flat }]
// spot(R) → [x, z]; ground(x, z) → y. Per vak van 'chunk' meter een eigen mesh, zodat wat
// buiten beeld valt wordt overgeslagen.
export function scatterModels(scene, sets, { R, spot, ground, chunk = 25, dense = 1, key = 'sc' }) {
  const up = new THREE.Vector3(0, 1, 0), qq = new THREE.Quaternion(), tw = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = new THREE.Vector3(), pos = new THREE.Vector3(), nrm = new THREE.Vector3();
  const placed = [];
  placed.meshes = [];
  for (const set of sets) {
    if (!hasModel(set.id)) continue;
    const groups = new Map();
    const n = Math.round(set.n * dense);
    let guard = 0;
    for (let i = 0; i < n && guard++ < n * 20;) {
      const [x, z] = spot(R);
      if (set.where && !set.where(x, z)) continue;
      const s = set.size[0] + R() * (set.size[1] - set.size[0]);
      // licht scheef op een helling
      const e = 0.6, hx = ground(x + e, z) - ground(x - e, z), hz = ground(x, z + e) - ground(x, z - e);
      nrm.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize().lerp(up, set.flat ? 0.8 : 0.4).normalize();
      qq.setFromUnitVectors(up, nrm); tw.setFromAxisAngle(up, R() * Math.PI * 2); qq.multiply(tw);
      pos.set(x, ground(x, z) - (set.sink || 0.06) * s, z);
      sc.set(s, s * (0.8 + R() * 0.4), s);
      const k = Math.floor(x / chunk) + ',' + Math.floor(z / chunk);
      if (!groups.has(k)) groups.set(k, []);
      const col = new THREE.Color(1, 1, 1).lerp(new THREE.Color(set.cols[i % set.cols.length]), set.tint === undefined ? 0.35 : set.tint);
      groups.get(k).push({ m: m4.compose(pos, qq, sc).clone(), c: col });
      placed.push({ id: set.id, x, z, y: pos.y, s });
      i++;
    }
    const mat = set.sway ? swayMat({ color: 0xffffff, map: modelMap(set.id), roughness: 0.85, side: THREE.DoubleSide, key: key + set.id })
      : uw(new THREE.MeshStandardMaterial({ map: modelMap(set.id), roughness: 0.85, side: set.double ? THREE.DoubleSide : THREE.FrontSide }), { caus: true, key: key + set.id });
    const geo = modelGeo(set.id, 'reef');
    groups.forEach((list) => {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((it, i) => { mesh.setMatrixAt(i, it.m); mesh.setColorAt(i, it.c); });
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
      placed.meshes.push(mesh);
    });
  }
  return placed;
}
// verbergt meshes die verder weg liggen dan je in het water kunt zien (scheelt veel rekenwerk)
export function makeCuller(meshes, dist) {
  const c = new THREE.Vector3();
  let t = 0;
  return (dt, env) => {
    t -= dt;
    if (t > 0 || !env.cam) return;
    t = 0.25;
    for (const m of meshes) {
      if (!m.boundingSphere) continue;
      c.copy(m.boundingSphere.center).applyMatrix4(m.matrixWorld);
      m.visible = c.distanceTo(env.cam) - m.boundingSphere.radius < dist;
    }
  };
}
// waaierkoralen (foto met transparantie, wiegend); geeft de plekken terug
export function scatterFans(scene, n, { R, spot, ground, cols, size = [0.8, 2.0], where, key = 'fan' }) {
  const photo = new THREE.TextureLoader().load('img/waaier.webp');
  photo.colorSpace = THREE.SRGBColorSpace; photo.anisotropy = 4;
  const g = new THREE.PlaneGeometry(1.3, 1.3 * 0.98, 6, 6);
  g.translate(0, 0.63, 0);
  const mat = swayMat({ color: 0xffffff, map: photo, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9, key });
  const list = [];
  let guard = 0;
  while (list.length < n && guard++ < n * 20) {
    const [x, z] = spot(R);
    if (where && !where(x, z)) continue;
    list.push({ x, z, y: ground(x, z) - 0.05, s: size[0] + R() * (size[1] - size[0]), ry: R() * 6.3, c: new THREE.Color(cols[list.length % cols.length]).lerp(new THREE.Color(1, 1, 1), 0.25) });
  }
  const groups = new Map();
  list.forEach((f) => { const k = Math.floor(f.x / 25) + ',' + Math.floor(f.z / 25); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); });
  const d = new THREE.Object3D();
  list.meshes = [];
  groups.forEach((fl) => {
    const mesh = new THREE.InstancedMesh(g, mat, fl.length);
    fl.forEach((f, i) => { d.position.set(f.x, f.y, f.z); d.rotation.set(0, f.ry, 0); d.scale.setScalar(f.s); d.updateMatrix(); mesh.setMatrixAt(i, d.matrix); mesh.setColorAt(i, f.c); });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
    list.meshes.push(mesh);
  });
  return list;
}
