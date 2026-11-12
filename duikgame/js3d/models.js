/* Diepblauw 3D — fotorealistische 3D-modellen (gemaakt in Magnific: beeld → 3D).
   Eén mesh per bestand; bij het laden wordt de geometrie genormaliseerd zodat
   de rest van de code met vaste assen en maten kan werken. */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/addons.min.js';

// as: hoe het model in het bestand ligt → draaiing naar de standaardhouding
//  vis:   kop naar -Z in het bestand → kop naar +X, lengte 1
//  rif:   staat rechtop → onderkant op y = 0, midden op x,z = 0, breedte 1
//  dier:  per soort ingesteld in creatures3d.js
export const FILES = {
  // vissen
  franse_knorvis: 'models/vis/franse_knorvis.glb', kleinbek_knorvis: 'models/vis/kleinbek_knorvis.glb', sergeant: 'models/vis/sergeant.glb',
  blauwe_dokter: 'models/vis/blauwe_dokter.glb', chromis_blauw: 'models/vis/chromis_blauw.glb', tarpon: 'models/vis/tarpon.glb',
  barracuda: 'models/vis/barracuda.glb', franse_keizer: 'models/vis/franse_keizer.glb', koningin_keizer: 'models/vis/koningin_keizer.glb',
  stoplicht_papegaai: 'models/vis/stoplicht_papegaai.glb', koffervis: 'models/vis/koffervis.glb', trompetvis: 'models/vis/trompetvis.glb',
  // andere dieren
  groene_schildpad: 'models/dier/groene_schildpad.glb', karet: 'models/dier/karet.glb', adelaarsrog: 'models/dier/adelaarsrog.glb',
  kikvorsvis_geel: 'models/dier/kikvorsvis.glb', gevlekte_murene: 'models/dier/murene.glb', rifoctopus: 'models/dier/octopus.glb',
  // nachtdieren
  langoest: 'models/dier/langoest.glb', rifinktvis: 'models/dier/inktvis.glb',
  // rif
  hersenkoraal: 'models/rif/hersenkoraal.glb', sterkoraal: 'models/rif/sterkoraal.glb', buisspons: 'models/rif/buisspons.glb',
  vaasspons: 'models/rif/vaasspons.glb', tonspons: 'models/rif/tonspons.glb',
  bekerkoraal: 'models/rif/bekerkoraal.glb', korstspons: 'models/rif/korstspons.glb', zilvervisje: 'models/vis/zilvervisje.glb',
  zeepluim: 'models/rif/zeepluim.glb',
  // Oosterschelde (Zeelandbrug)
  zeeanjelier: 'models/os/zeeanjelier.glb', dodemansduim: 'models/os/dodemansduim.glb',
  lipvis: 'models/os/lipvis.glb', steenbolk: 'models/os/steenbolk.glb', zeebrasem: 'models/os/zeebrasem.glb',
  'lipvis-ver': 'models/os/lipvis-ver.glb', 'steenbolk-ver': 'models/os/steenbolk-ver.glb', 'zeebrasem-ver': 'models/os/zeebrasem-ver.glb',
  kreeft: 'models/os/kreeft.glb', zwemkrab: 'models/os/zwemkrab.glb', zeedonderpad: 'models/os/zeedonderpad.glb', kathaai: 'models/os/kathaai.glb',
  zeekat: 'models/os/zeekat.glb', vlokslak: 'models/os/vlokslak.glb', bruinvis: 'models/os/bruinvis.glb',
  // meer leven: geelstaartsnappers en gele geitenvissen
  geelstaart_snapper: 'models/vis/geelstaart_snapper.glb', gele_geitenvis: 'models/vis/gele_geitenvis.glb',
};
// eenvoudigere versies van de vissen voor op afstand (LOD)
['franse_knorvis', 'kleinbek_knorvis', 'sergeant', 'blauwe_dokter', 'chromis_blauw', 'tarpon', 'barracuda', 'franse_keizer', 'koningin_keizer', 'stoplicht_papegaai', 'koffervis', 'trompetvis', 'geelstaart_snapper', 'gele_geitenvis']
  .forEach((id) => { FILES[id + '-ver'] = 'models/vis/' + id + '-ver.glb'; });

const cache = {};

export function loadModels(names) {
  const loader = new GLTFLoader();
  return Promise.all(names.filter((n) => FILES[n] && !cache[n]).map((n) => loader.loadAsync(new URL('../' + FILES[n], import.meta.url).href)
    .then((g) => {
      let mesh = null;
      g.scene.updateMatrixWorld(true);
      g.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
      if (!mesh) return;
      const geo = mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);
      const map = mesh.material.map || null;
      if (map) { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; }
      cache[n] = { geo, map };
    })
    .catch((e) => console.warn('model niet geladen', n, e))));
}

export function hasModel(n) { return !!cache[n]; }

// genormaliseerde kopie van de geometrie
export function modelGeo(n, kind, opts = {}) {
  const c = cache[n];
  if (!c) return null;
  const g = c.geo.clone();
  if (opts.rot) { // [rx, ry, rz] in radialen, volgorde X → Y → Z
    if (opts.rot[0]) g.rotateX(opts.rot[0]);
    if (opts.rot[1]) g.rotateY(opts.rot[1]);
    if (opts.rot[2]) g.rotateZ(opts.rot[2]);
  }
  g.computeBoundingBox();
  const b = g.boundingBox, s = new THREE.Vector3(), m = new THREE.Vector3();
  b.getSize(s); b.getCenter(m);
  if (kind === 'fish') {
    g.rotateY(-Math.PI / 2); // kop van -Z naar +X
    g.computeBoundingBox();
    const bb = g.boundingBox, c2 = new THREE.Vector3(); bb.getCenter(c2);
    g.translate(-c2.x, -c2.y, -c2.z);
    const L = bb.max.x - bb.min.x;
    g.scale(1 / L, 1 / L, 1 / L);
  } else if (kind === 'reef') {
    g.translate(-m.x, -b.min.y, -m.z);
    const w = Math.max(s.x, s.z);
    g.scale(1 / w, 1 / w, 1 / w);
  } else { // 'center': midden op 0, langste maat 1
    g.translate(-m.x, -m.y, -m.z);
    const L = Math.max(s.x, s.y, s.z);
    g.scale(1 / L, 1 / L, 1 / L);
  }
  g.computeBoundingBox();
  g.computeBoundingSphere();
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}

export function modelMap(n) { return cache[n] ? cache[n].map : null; }
