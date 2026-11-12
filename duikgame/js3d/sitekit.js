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
