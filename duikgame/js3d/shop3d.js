/* Diepblauw — 3D-winkel van Duikcentrum De Tuimelaar in Zwolle.
   Opgebouwd uit de winkelfoto's: de wanden met spullen zijn rechtgetrokken stukken
   uit die foto's, de paspoppen, het trimvest, de reistassen en de flessen zijn
   3D-modellen (Magnific). De camera glijdt van afdeling naar afdeling; slepen = rondkijken.

   Assen: x naar rechts (gezien vanaf de ingang), y omhoog, z = 0 bij de etalage,
   de achterwand ligt op z = -15. Maten in meters. */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/addons.min.js';

const XL = -3.8, XR = 3.8, ZF = 0, ZB = -15, H = 2.7;
const AISLE_X = 0.35; // middenpad: daarlangs vliegt de camera

// Afdelingen: waar de camera staat, waar hij naar kijkt, en waar het label hangt
export const STATIONS = {
  // narrow: voor smalle beelden (telefoon rechtop) iets verder de winkel in
  overzicht: { pos: [0.9, 1.62, -0.7], look: [-0.5, 1.15, -10.5], narrow: { pos: [0.7, 1.55, -2.4], look: [-0.4, 0.95, -11] } },
  lamp: { pos: [-1.05, 1.6, -2.4], look: [-3.8, 1.42, -2.4], label: [-3.6, 1.95, -1.4], name: 'Lampen & accessoires' },
  automaat: { pos: [-1.25, 1.6, -5.6], look: [-3.8, 1.42, -5.8], label: [-3.6, 1.85, -5.2], name: 'Ademautomaten' },
  pak: { pos: [-0.35, 1.6, -7.4], look: [2.6, 1.12, -8.3], label: [2.3, 1.9, -7.6], name: 'Duikpakken' },
  trimvest: { pos: [0.15, 1.5, -5.1], look: [-0.8, 1.2, -6.8], label: [-0.85, 1.85, -6.8], name: 'Trimvesten' },
  masker: { pos: [1.35, 1.45, -1.9], look: [3.8, 0.85, -1.75], label: [3.6, 0.95, -1.65], name: 'Duikbrillen' },
  vinnen: { pos: [1.0, 1.6, -2.8], look: [3.8, 1.45, -2.9], label: [3.6, 1.95, -3.2], name: 'Vinnen' },
  computer: { pos: [-0.1, 1.55, -11.9], look: [-0.25, 1.0, -14.5], label: [-0.55, 1.98, -14.4], name: 'Vitrine: computers' },
  camera: { pos: [0.55, 1.55, -12.1], look: [0.6, 1.05, -14.5], label: [0.65, 1.05, -14.3], name: 'Camera’s' },
  fles: { pos: [-1.35, 1.6, -11.9], look: [-3.0, 0.95, -14.3], label: [-3.1, 2.15, -14.6], name: 'Vulstation' },
  cursus: { pos: [1.4, 1.6, -11.4], look: [2.6, 1.3, -14.9], label: [3.0, 1.75, -13.5], name: 'Balie & cursussen' },
};

const TEX = 'img/winkel3d/';
const MODELS = { pop: 'models/winkel/paspop.glb', torso: 'models/winkel/torso.glb', tas: 'models/winkel/tas.glb', fles: 'models/winkel/fles.glb' };

/* ---------------- canvas-texturen ---------------- */
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// lamellenwand: donkergrijs met een aluminium strip elke 10 cm (texture = 50 cm)
function slatTex() {
  return canvasTex(256, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#45474c'); g.addColorStop(1, '#3f4146');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = rnd(7);
    for (let i = 0; i < 900; i++) { c.fillStyle = 'rgba(255,255,255,' + (r() * 0.025) + ')'; c.fillRect(r() * w, r() * h, 2, 1); }
    for (let i = 0; i < 5; i++) {
      const y = Math.round(i * h / 5 + 22);
      c.fillStyle = '#303237'; c.fillRect(0, y - 1, w, 5);
      c.fillStyle = '#8f949a'; c.fillRect(0, y, w, 1);
      c.fillStyle = '#a9aeb3'; c.fillRect(0, y + 1, w, 1);
      c.fillStyle = '#5d6166'; c.fillRect(0, y + 2, w, 1);
    }
  }, { repeat: true });
}
// tapijt: grijsgroen met fijne spikkels (texture = 1 m)
function carpetTex() {
  return canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#5b625e'; c.fillRect(0, 0, w, h);
    const r = rnd(3);
    for (let i = 0; i < 26000; i++) {
      const v = 66 + r() * 60 | 0;
      c.fillStyle = 'rgba(' + v + ',' + (v + 8) + ',' + (v + 4) + ',0.55)';
      c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
  }, { repeat: true });
}
// systeemplafond 60 x 60 cm
function ceilingTex() {
  return canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#eceeed'; c.fillRect(0, 0, w, h);
    const r = rnd(11);
    for (let i = 0; i < 1500; i++) { c.fillStyle = 'rgba(120,120,120,' + r() * 0.12 + ')'; c.fillRect(r() * w, r() * h, 1, 1); }
    c.fillStyle = '#c9cccb'; c.fillRect(0, 0, w, 4); c.fillRect(0, 0, 4, h);
  }, { repeat: true });
}
// OSB-platen (texture = 1,2 m)
function osbTex() {
  return canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#c49a66'; c.fillRect(0, 0, w, h);
    const r = rnd(5);
    for (let i = 0; i < 1700; i++) {
      const x = r() * w, y = r() * h, l = 8 + r() * 26, b = 3 + r() * 7, a = r() * Math.PI;
      const v = r();
      c.fillStyle = v < 0.33 ? '#a97d4c' : v < 0.66 ? '#d6b07c' : '#b88a55';
      c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = 0.55 + r() * 0.4; c.fillRect(-l / 2, -b / 2, l, b); c.restore();
    }
    c.globalAlpha = 1; c.strokeStyle = 'rgba(70,45,20,0.5)'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
  }, { repeat: true });
}
function textTex(lines, opts = {}) {
  const w = opts.w || 512, h = opts.h || 128;
  return canvasTex(w, h, (c) => {
    c.fillStyle = opts.bg || '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = opts.fg || '#0f2a4a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach((l, i) => { c.font = (i === 0 ? '700 ' : '600 ') + (opts.size || 54) * (i === 0 ? 1 : 0.6) + 'px "Nunito Sans", Arial, sans-serif'; c.fillText(l, w / 2, h * (lines.length === 1 ? 0.5 : 0.36 + i * 0.36)); });
  });
}
// vulpaneel: rvs-plaat met manometers en vulslangen
function fillPanelTex() {
  return canvasTex(512, 384, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d9dde0'); g.addColorStop(1, '#a9afb4');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#26303a'; c.font = '700 30px Arial'; c.textAlign = 'center'; c.fillText('VULSTATION · 200 / 232 BAR', w / 2, 40);
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 118, y = 130;
      c.fillStyle = '#1b1d20'; c.beginPath(); c.arc(x, y, 44, 0, 7); c.fill();
      c.fillStyle = '#f5f5f2'; c.beginPath(); c.arc(x, y, 38, 0, 7); c.fill();
      c.strokeStyle = '#c0392b'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 30, 0.2 * Math.PI, 0.45 * Math.PI); c.stroke();
      c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(-0.6 + i * 0.5) * 30, y + Math.sin(-0.6 + i * 0.5) * 30); c.stroke();
      c.fillStyle = '#2b2b2b'; c.fillRect(x - 10, 200, 20, 34);
      c.strokeStyle = '#111'; c.lineWidth = 7; c.beginPath(); c.moveTo(x, 234); c.bezierCurveTo(x, 300, x + 30, 330, x + 10, h); c.stroke();
    }
  });
}

/* ---------------- schaduwvlekjes onder objecten ---------------- */
let blobTex = null;
function blob(w, d, o = 0.5) {
  if (!blobTex) blobTex = canvasTex(128, 128, (c, w2, h2) => {
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, w2, h2);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: o, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.004; m.renderOrder = 1;
  return m;
}
// blob(w, d, o) op plek (x, y, z)
function blobAt(w, d, o, x, y, z) { const m = blob(w, d, o); m.position.set(x, y, z); return m; }

/* ---------------- de winkel ---------------- */
export class Shop3D {
  constructor(host, opts = {}) {
    this.host = host;
    this.onPick = opts.onPick || (() => {});
    this.onReady = opts.onReady || (() => {});
    this.quality = opts.quality || 'midden';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'shop3d-canvas';
    this.canvas.setAttribute('aria-label', '3D-winkel van Duikcentrum De Tuimelaar');
    host.prepend(this.canvas);
    const pr = Math.min(window.devicePixelRatio || 1, this.quality === 'laag' ? 1 : 2);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: pr < 1.5, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(pr);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2b2d31);
    this.camera = new THREE.PerspectiveCamera(58, 1, 0.05, 60);
    const st = STATIONS.overzicht;
    this.pos = new THREE.Vector3(...st.pos);
    this.setLook(new THREE.Vector3(...st.look));
    this.fly = null;
    this.station = 'overzicht';
    this.loader = new THREE.TextureLoader();
    this.build();
    this.labels = [];
    this.dirty = 2;
    this.raf = 0;
    this.alive = true;
    this.bindInput();
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
    this.loadModels().then(() => { this.dirty = 3; this.onReady(); });
  }

  setLook(target) {
    const d = target.clone().sub(this.pos);
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
  }

  tex(name, opts = {}) {
    const t = this.loader.load(TEX + name + '.webp', () => { this.dirty = 3; });
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (opts.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  /* --- ruimte en inrichting --- */
  build() {
    const S = this.scene;
    // licht: plafondpanelen + omgevingslicht; een kleine kamer als omgevingskaart voor glans
    S.add(new THREE.HemisphereLight(0xffffff, 0x6c736f, 1.25));
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.BoxGeometry(8, 3, 16), new THREE.MeshBasicMaterial({ color: 0x55585e, side: THREE.BackSide })));
    for (let z = -6; z <= 6; z += 3) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      p.material.color.setScalar(6); p.rotation.x = Math.PI / 2; p.position.set(0, 1.45, z); env.add(p);
    }
    this.envMap = pmrem.fromScene(env, 0.04).texture;
    S.environment = this.envMap;
    pmrem.dispose();
    [[-1.6, -3], [1.6, -3], [-1.6, -8], [1.6, -8], [0, -12.5]].forEach(([x, z]) => {
      const l = new THREE.PointLight(0xfff4e6, 3.2, 7, 1.6); l.position.set(x, 2.2, z); S.add(l);
    });

    // vloer, plafond, wanden
    const carpet = carpetTex(); carpet.repeat.set((XR - XL), (ZF - ZB));
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(XR - XL, ZF - ZB), new THREE.MeshStandardMaterial({ map: carpet, roughness: 1, envMapIntensity: 0.2 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (ZF + ZB) / 2); S.add(floor);
    const ceil = ceilingTex(); ceil.repeat.set((XR - XL) / 0.6, (ZF - ZB) / 0.6);
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(XR - XL, ZF - ZB), new THREE.MeshBasicMaterial({ map: ceil, color: 0xc9cbca }));
    ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, H, (ZF + ZB) / 2); S.add(ceiling);
    // ledpanelen in het plafond
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); ledMat.color.setScalar(1.6);
    for (let z = -1.8; z > ZB + 0.5; z -= 2.4) for (const x of [-1.8, 1.8]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.58), ledMat); p.rotation.x = Math.PI / 2; p.position.set(x, H - 0.005, z); S.add(p);
    }
    // airco-cassette (zie foto) en zwarte railspots
    const ac = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.75), new THREE.MeshStandardMaterial({ color: 0xdedfe0, roughness: 0.6 }));
    ac.position.set(-0.9, H - 0.03, -5.4); S.add(ac);
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x3a3c40 }));
    grille.rotation.x = Math.PI / 2; grille.position.set(-0.9, H - 0.065, -5.4); S.add(grille);
    const spotMat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.5, metalness: 0.4 });
    for (const [x, z] of [[-2.9, -2.2], [-2.9, -5.2], [-2.9, -8.6], [2.9, -2.4], [2.9, -6.6], [-0.5, -13.4], [1.6, -13.2]]) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.16, 12), spotMat);
      s.position.set(x, H - 0.12, z); s.rotation.z = x < 0 ? 0.6 : -0.6; S.add(s);
    }

    const slat = slatTex();
    const wallMat = (len) => { const t = slat.clone(); t.needsUpdate = true; t.repeat.set(len / 0.5, H / 0.5); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, envMapIntensity: 0.4 }); };
    const wall = (len, mat, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, H), mat); m.position.set(x, H / 2, z); m.rotation.y = ry; S.add(m); return m; };
    wall(ZF - ZB, wallMat(ZF - ZB), XL, (ZF + ZB) / 2, Math.PI / 2); // links
    wall(ZF - ZB, wallMat(ZF - ZB), XR, (ZF + ZB) / 2, -Math.PI / 2); // rechts
    // achterwand: OSB, met lamellen achter de balie
    const osb = osbTex(); osb.repeat.set((XR - XL) / 1.2, H / 1.2);
    const osbMat = new THREE.MeshStandardMaterial({ map: osb, roughness: 0.85, envMapIntensity: 0.3 });
    wall(XR - XL, osbMat, 0, ZB, 0);
    // turquoise kolom bij de etalage (zie foto)
    const teal = new THREE.Mesh(new THREE.BoxGeometry(0.35, H, 0.7), new THREE.MeshStandardMaterial({ color: 0x1e7f93, roughness: 0.6 }));
    teal.position.set(XL + 0.17, H / 2, -0.35); S.add(teal);

    // wandpanelen uit de foto's (onverlicht: het licht zit al in de foto)
    const photo = (name, w, h, x, y, z, ry, tint = 0.96) => {
      const mat = new THREE.MeshBasicMaterial({ map: this.tex(name), transparent: true, toneMapped: false, depthWrite: false });
      mat.color.setScalar(tint);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z); m.rotation.y = ry; m.renderOrder = 2; S.add(m); return m;
    };
    const L = XL + 0.012, R = XR - 0.012, B = ZB + 0.012;
    photo('wand-accessoires', 3.4, 2.19, L, 1.45, -2.4, Math.PI / 2);
    photo('wand-automaten', 1.6, 2.0, L, 1.5, -5.25, Math.PI / 2);
    photo('wand-meters', 2.0, 2.14, L, 1.42, -7.15, Math.PI / 2);
    photo('wand-pakken', 1.6, 2.3, L, 1.38, -9.25, Math.PI / 2, 0.92);
    photo('rek-pakken', 1.0, 2.12, L, 1.36, -10.65, Math.PI / 2, 0.92);
    photo('rek-trimvesten', 2.1, 2.26, L, 1.42, -12.6, Math.PI / 2, 0.9);
    photo('rek-vesten', 0.75, 2.5, R, 1.32, -0.75, -Math.PI / 2, 0.92);
    photo('wand-vinnen', 2.3, 2.3, R, 1.3, -2.55, -Math.PI / 2);
    photo('rek-hoodies', 0.8, 2.45, R, 1.3, -4.15, -Math.PI / 2, 0.9);
    photo('wand-meters2', 0.95, 2.26, R, 1.33, -5.1, -Math.PI / 2, 0.92);
    photo('wand-pakken', 1.6, 2.3, R, 1.38, -6.5, -Math.PI / 2, 0.9);
    photo('rek-pakken', 1.0, 2.12, R, 1.36, -7.9, -Math.PI / 2, 0.9);
    photo('wand-meters', 1.8, 1.93, R, 1.35, -9.4, -Math.PI / 2, 0.92);
    // lamellen + hangers achter de balie
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2.5, H), wallMat(2.5)); back.position.set(2.5, H / 2, ZB + 0.006); S.add(back);
    photo('wand-hangers', 2.4, 2.31, 2.5, 1.38, B + 0.004, 0);

    // ramen rechtsachter en de etalage met zicht op de straat
    const street = this.tex('raam-straat');
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xbfd9e6, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.2, depthWrite: false });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd8dadc, roughness: 0.35, metalness: 0.6 });
    const outside = (w, h, x, y, z, ry) => {
      const mat = new THREE.MeshBasicMaterial({ map: street, toneMapped: false }); mat.color.setScalar(1.12);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; S.add(m);
    };
    // etalage (voorwand): straat buiten, glas met kozijnen, deur rechts van het midden
    outside(9, 4.2, 0.2, 1.7, ZF + 2.5, Math.PI);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(XR - XL - 0.35, H), glassMat); front.position.set(0.17, H / 2, ZF); front.rotation.y = Math.PI; S.add(front);
    for (const x of [-3.45, -1.6, 0.25, 1.6, 2.6, 3.78]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.07, H, 0.09), frameMat); f.position.set(x, H / 2, ZF); S.add(f); }
    for (const y of [0.05, 2.15, H - 0.04]) { const f = new THREE.Mesh(new THREE.BoxGeometry(XR - XL, 0.07, 0.09), frameMat); f.position.set(0, y, ZF); S.add(f); }
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshStandardMaterial({ color: 0x222426, roughness: 1 }));
    mat.rotation.x = -Math.PI / 2; mat.position.set(2.1, 0.006, -0.55); S.add(mat);
    // hoge ramen in de rechterwand achterin: het straatbeeld ligt als foto in het raam
    for (const z of [-10.4, -12.0, -13.6]) {
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.98, 1.38), frameMat); fr.position.set(XR - 0.02, 2.0, z); S.add(fr);
      const mat = new THREE.MeshBasicMaterial({ map: street, toneMapped: false }); mat.color.setScalar(1.1);
      const view = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.86), mat); view.position.set(XR - 0.055, 2.0, z); view.rotation.y = -Math.PI / 2; S.add(view);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.86), glassMat); gl.position.set(XR - 0.06, 2.0, z); gl.rotation.y = -Math.PI / 2; S.add(gl);
    }

    // logo van De Tuimelaar boven de vitrines
    const logo = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), new THREE.MeshBasicMaterial({ map: this.loader.load('img/tuimelaar-logo.png', () => { this.dirty = 3; }), toneMapped: false }));
    logo.material.map.colorSpace = THREE.SRGBColorSpace;
    logo.position.set(-0.1, 2.12, ZB + 0.02); S.add(logo);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.32), new THREE.MeshBasicMaterial({ map: textTex(['Opleidingen & balie'], { w: 512, h: 110, size: 58, fg: '#ffffff', bg: '#0d4d7c' }), toneMapped: false }));
    sign.position.set(2.5, 2.48, ZB + 0.03); S.add(sign);

    // deur in de achterwand
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.1, 0.04), new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.5 }));
    door.position.set(-1.65, 1.05, ZB + 0.02); S.add(door);
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.05), frameMat); knob.position.set(-1.3, 1.02, ZB + 0.06); S.add(knob);
    const dmat = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), new THREE.MeshStandardMaterial({ color: 0x1d1f21, roughness: 1 }));
    dmat.rotation.x = -Math.PI / 2; dmat.position.set(-1.65, 0.006, ZB + 0.5); S.add(dmat);

    // vitrines (glas) met computers en camera's
    this.buildVitrine(-0.55, ZB + 0.55, 'computer');
    this.buildVitrine(0.65, ZB + 0.55, 'camera');
    // display-zuil met duikcomputers (zie foto)
    const zuil = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.85, 0.32), new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.4 }));
    zuil.position.set(1.35, 0.925, ZB + 0.6); S.add(zuil);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.5), new THREE.MeshBasicMaterial({ map: textTex(['DUIK', 'computers'], { w: 256, h: 400, size: 70, fg: '#2ee6d6', bg: '#0b1218' }), toneMapped: false }));
    scr.position.set(1.35, 1.35, ZB + 0.765); S.add(scr);
    S.add(blobAt(0.9, 0.7, 0.45, 1.35, 0.004, ZB + 0.62));

    // balie van OSB met wit blad, logboeken en een kassa
    const balie = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.6), osbMat); body.position.y = 0.5; balie.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 0.7), new THREE.MeshStandardMaterial({ color: 0xf2f2ef, roughness: 0.35 })); top.position.y = 1.02; balie.add(top);
    const books = ['#0d4d7c', '#d8402a', '#2ab0a0', '#f2c21a', '#1b1b1b'];
    books.forEach((c, i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.22), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })); b.position.set(-0.75 + i * 0.03, 1.05 + i * 0.021, -0.05 + (i % 2) * 0.02); b.rotation.y = i * 0.12; balie.add(b); });
    const kassa = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.05), new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.3 })); kassa.position.set(0.55, 1.18, 0.05); kassa.rotation.x = -0.25; balie.add(kassa);
    const kscr = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ color: 0x9fd0f0 })); kscr.position.set(0.55, 1.18, 0.08); kscr.rotation.x = -0.25; balie.add(kscr);
    balie.position.set(2.55, 0, ZB + 1.45);
    S.add(balie);
    S.add(blobAt(2.4, 1.0, 0.5, 2.55, 0.004, ZB + 1.45));

    // vulstation linksachter: paneel aan de wand, flessen worden geladen als model
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.94), new THREE.MeshStandardMaterial({ map: fillPanelTex(), roughness: 0.4, metalness: 0.3 }));
    panel.position.set(-3.0, 1.55, ZB + 0.02); S.add(panel);

    // tafel in het midden (aluminium frame, licht blad) — trimvest-torso komt erop
    const tafel = new THREE.Group();
    const blad = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.04, 0.95), new THREE.MeshStandardMaterial({ color: 0xd9dcdf, roughness: 0.25, metalness: 0.2 })); blad.position.y = 0.9; tafel.add(blad);
    for (const [x, z] of [[-0.68, -0.43], [0.68, -0.43], [-0.68, 0.43], [0.68, 0.43]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.9, 0.04), frameMat); p.position.set(x, 0.45, z); tafel.add(p); }
    tafel.position.set(-0.85, 0, -6.8);
    S.add(tafel);
    S.add(blobAt(1.9, 1.4, 0.5, -0.85, 0.004, -6.8));
    this.table = tafel;

  }

  buildVitrine(x, z, kind) {
    const S = this.scene, g = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({ color: 0xd8eef5, transparent: true, opacity: 0.16, roughness: 0.03, metalness: 0.2, envMapIntensity: 1.5, depthWrite: false });
    const frame = new THREE.MeshStandardMaterial({ color: 0xe9ebee, roughness: 0.3, metalness: 0.5 });
    const w = 1.0, d = 0.5, h = 1.75;
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glass); box.position.y = h / 2 + 0.08; box.renderOrder = 3; g.add(box);
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.08, d + 0.02), frame); base.position.y = 0.04; g.add(base);
    const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.03, d + 0.02), frame); top.position.y = h + 0.09; g.add(top);
    for (const [ex, ez] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.025, h, 0.025), frame); e.position.set(ex, h / 2 + 0.08, ez); g.add(e);
    }
    const backP = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.02, h - 0.02), new THREE.MeshStandardMaterial({ color: 0xf1f2f3, roughness: 0.6 }));
    backP.position.set(0, h / 2 + 0.08, -d / 2 + 0.01); g.add(backP);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0xcfe7ee, transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false });
    const r = rnd(kind === 'camera' ? 9 : 4);
    for (const y of [0.45, 0.85, 1.25]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 0.012, d - 0.04), shelfMat); s.position.y = y; g.add(s);
      for (let i = 0; i < 4; i++) {
        let it;
        if (kind === 'computer') {
          it = new THREE.Group();
          const face = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.018, 20), new THREE.MeshStandardMaterial({ color: r() < 0.5 ? 0x1a1a1c : 0x3a3d42, roughness: 0.3, metalness: 0.6 }));
          face.rotation.x = 1.25; it.add(face);
          const screen = new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), new THREE.MeshBasicMaterial({ color: r() < 0.5 ? 0x9ee6ff : 0xdfe9ee }));
          screen.position.set(0, 0.004, 0.0095); screen.rotation.x = 1.25 - Math.PI / 2; it.add(screen);
          const band = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.006, 0.16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })); band.position.y = -0.02; it.add(band);
          it.position.y = y + 0.05;
        } else {
          it = new THREE.Group();
          const body = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.08), new THREE.MeshStandardMaterial({ color: r() < 0.5 ? 0x1c1d20 : 0x8b9096, roughness: 0.35, metalness: 0.4 })); it.add(body);
          const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 20), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.2, metalness: 0.7 })); lens.rotation.x = Math.PI / 2; lens.position.z = 0.06; it.add(lens);
          it.position.y = y + 0.052;
        }
        it.position.x = -0.33 + i * 0.22 + (r() - 0.5) * 0.04; it.position.z = 0.04 + (r() - 0.5) * 0.06;
        g.add(it);
      }
    }
    g.position.set(x, 0, z);
    S.add(g);
    S.add(blobAt(1.4, 0.9, 0.45, x, 0.004, z));
  }

  /* --- 3D-modellen uit Magnific --- */
  async loadModels() {
    const loader = new GLTFLoader();
    const load = (k) => loader.loadAsync(MODELS[k]).then((g) => g.scene).catch((e) => { console.warn('winkelmodel ontbreekt', k, e); return null; });
    const [pop, torso, tas, fles] = await Promise.all(['pop', 'torso', 'tas', 'fles'].map(load));
    if (!this.alive) return;
    // genormaliseerd: onderkant op 0, gewenste hoogte
    const norm = (src, height) => {
      const o = src.clone(true);
      o.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.envMapIntensity = 0.5; if (m.material.map) m.material.map.anisotropy = 4; } });
      const box = new THREE.Box3().setFromObject(o), s = new THREE.Vector3(), c = new THREE.Vector3();
      box.getSize(s); box.getCenter(c);
      const k = height / s.y;
      const wrap = new THREE.Group();
      o.position.set(-c.x * k, -box.min.y * k, -c.z * k); o.scale.setScalar(k);
      wrap.add(o);
      return wrap;
    };
    const S = this.scene;
    const place = (src, h, x, z, ry, sh, tint) => {
      if (!src) return null;
      const o = norm(src, h); o.position.set(x, 0, z); o.rotation.y = ry; S.add(o);
      if (tint) o.traverse((m) => { if (m.isMesh) m.material.color.multiplyScalar(tint); });
      if (sh) S.add(blobAt(sh[0], sh[1], 0.5, x, 0.004, z));
      return o;
    };
    // paspoppen rechts, kijkend naar de etalage (zoals op de foto)
    [[1.65, -5.7, 0.55, 1.8], [2.05, -6.85, 0.45, 1.76], [2.4, -8.0, 0.6, 1.82], [2.75, -9.15, 0.4, 1.78]]
      .forEach(([x, z, ry, h]) => place(pop, h, x, z, ry + Math.PI, [0.8, 0.8]));
    // torso met trimvest op de tafel
    if (torso) { const t = norm(torso, 0.95); t.position.set(0.1, 0.92, 0); t.rotation.y = 0.55 + 1.35 * Math.PI; this.table.add(t); }
    // reistassen vóór de tafel
    place(tas, 0.78, -1.25, -5.95, 0.25, [0.7, 0.5]);
    place(tas, 0.74, -0.55, -5.85, -0.15, [0.7, 0.5]);
    place(tas, 0.76, -3.2, -9.9, 1.3, [0.6, 0.6]);
    // flessen bij het vulstation
    [[-3.55, -14.5, 0], [-3.25, -14.55, 0.8], [-2.95, -14.5, 2.1], [-2.65, -14.55, 3.0], [-2.35, -14.5, 0.3], [-2.4, -13.9, 1.4], [-2.05, -14.0, 2.6]]
      .forEach(([x, z, ry], i) => place(fles, i < 5 ? 0.66 : 0.6, x, z, ry, [0.32, 0.32], 0.72));
    this.dirty = 3;
  }

  /* --- labels (HTML) per afdeling --- */
  setLabels(els) { this.labels = els; this.dirty = 2; }

  updateLabels() {
    const w = this.cw, h = this.ch, v = new THREE.Vector3(), cd = new THREE.Vector3();
    this.camera.getWorldDirection(cd);
    const placed = [];
    const order = this.labels.slice().sort((a, b) => this.labelDist(a) - this.labelDist(b));
    order.forEach((el) => {
      const st = STATIONS[el.dataset.cat];
      if (!st) { el.hidden = true; return; }
      v.set(...st.label);
      const to = v.clone().sub(this.camera.position);
      const dist = to.length();
      const front = to.normalize().dot(cd) > 0.25;
      v.project(this.camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      // niet onder de knop rechtsboven
      const vis = front && dist < 13 && x > 12 && x < w - 12 && y > 12 && y < h - 12 && !(y < 50 && x > w - 190) && el.dataset.cat !== this.station;
      el.hidden = !vis;
      if (vis) {
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.classList.toggle('flip', x > w * 0.72);
        // botst met een dichterbij label? dan verbergen
        const bw = el.offsetWidth || 120, bh = el.offsetHeight || 26;
        const x0 = el.classList.contains('flip') ? x - bw + 11 : x - 11, y0 = y - bh / 2;
        if (placed.some((r) => x0 < r[0] + r[2] && x0 + bw > r[0] && y0 < r[1] + r[3] && y0 + bh > r[1])) { el.hidden = true; return; }
        placed.push([x0, y0, bw, bh]);
        el.style.opacity = dist > 10 ? String(Math.max(0.35, 1 - (dist - 10) / 4)) : '';
      }
    });
  }

  labelDist(el) {
    const st = STATIONS[el.dataset.cat];
    return st ? this.camera.position.distanceTo(new THREE.Vector3(...st.label)) : 99;
  }

  /* --- naar een afdeling vliegen --- */
  go(id, instant) {
    let st = STATIONS[id] || STATIONS.overzicht;
    if (st.narrow && this.cw / this.ch < 1.3) st = st.narrow;
    this.station = STATIONS[id] ? id : 'overzicht';
    const from = this.pos.clone(), to = new THREE.Vector3(...st.pos);
    const y0 = this.yaw, p0 = this.pitch;
    const tmp = { pos: to.clone() };
    const d = new THREE.Vector3(...st.look).sub(to);
    let y1 = Math.atan2(-d.x, -d.z); const p1 = Math.atan2(d.y, Math.hypot(d.x, d.z));
    while (y1 - y0 > Math.PI) y1 -= Math.PI * 2;
    while (y1 - y0 < -Math.PI) y1 += Math.PI * 2;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) instant = true;
    if (instant) { this.pos.copy(to); this.yaw = y1; this.pitch = p1; this.fly = null; this.dirty = 2; return; }
    // via het middenpad als de route langs tafel of paspoppen loopt
    const mid = new THREE.Vector3(AISLE_X, 1.63, (from.z + to.z) / 2);
    const len = from.distanceTo(to);
    this.fly = { from, to, mid, y0, y1, p0, p1, t: 0, dur: Math.min(2.2, 0.7 + len * 0.12), tmp };
  }

  /* --- invoer: slepen = rondkijken, wiel/knijpen = inzoomen, tik op label = kiezen --- */
  bindInput() {
    const c = this.canvas;
    const pts = new Map();
    let pinch0 = 0, fov0 = 58, moved = 0;
    c.style.touchAction = 'pan-y';
    c.addEventListener('pointerdown', (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); fov0 = this.camera.fov; }
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0) this.camera.fov = THREE.MathUtils.clamp(fov0 * pinch0 / d, 32, 72);
        this.camera.updateProjectionMatrix();
      } else {
        // bij aanraken: vooral horizontaal draaien, zodat verticaal scrollen van de pagina blijft werken
        if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.4 && moved < 6) return;
        moved += Math.abs(dx) + Math.abs(dy);
        const k = 2.0 / Math.max(300, this.cw) * (this.camera.fov / 58);
        this.yaw += dx * k; this.pitch = THREE.MathUtils.clamp(this.pitch + dy * k, -0.75, 0.55);
        this.fly = null;
      }
      this.dirty = 2;
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.fov = THREE.MathUtils.clamp(this.camera.fov * (1 + Math.sign(e.deltaY) * 0.08), 32, 72);
      this.camera.updateProjectionMatrix(); this.dirty = 2;
    }, { passive: false });
    this.keys = (e) => {
      if (!this.host.isConnected || this.host.closest('[hidden]')) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight') { this.yaw += (k === 'ArrowLeft' ? -1 : 1) * 0.12; this.fly = null; this.dirty = 2; }
    };
    window.addEventListener('keydown', this.keys);
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    const img = this.host.querySelector('img');
    // de canvas volgt de foto-afmetingen: op de telefoon staat de tekst eronder
    const w = Math.max(50, Math.round(img && img.clientWidth ? img.clientWidth : r.width));
    const h = Math.max(50, Math.round(img && img.clientHeight ? img.clientHeight : r.height));
    if (w === this.cw && h === this.ch) return;
    this.cw = w; this.ch = h;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h;
    // smalle beelden: iets wijder kijken, zodat er genoeg van de afdeling in beeld is
    this.baseFov = w / h < 1.2 ? 68 : 58;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.dirty = 2;
  }

  loop(now) {
    if (!this.alive) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
    if (this.fly) {
      const f = this.fly;
      f.t = Math.min(1, f.t + dt / f.dur);
      const e = f.t < 0.5 ? 4 * f.t * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 3) / 2;
      // kwadratische bezier via het middenpad
      const a = f.from.clone().lerp(f.mid, e), b = f.mid.clone().lerp(f.to, e);
      this.pos.copy(a.lerp(b, e));
      this.yaw = f.y0 + (f.y1 - f.y0) * e;
      this.pitch = f.p0 + (f.p1 - f.p0) * e;
      if (this.camera.fov !== this.baseFov) { this.camera.fov += (this.baseFov - this.camera.fov) * Math.min(1, dt * 6); this.camera.updateProjectionMatrix(); }
      if (f.t >= 1) this.fly = null;
      this.dirty = 2;
    }
    if (!this.dirty) return;
    if (!this.fly) this.dirty--;
    const cp = Math.cos(this.pitch);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.pos.x - Math.sin(this.yaw) * cp, this.pos.y + Math.sin(this.pitch), this.pos.z - Math.cos(this.yaw) * cp);
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
    if (!this.shown) { this.shown = true; this.host.classList.add('has3d'); }
  }

  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keys);
    if (this.ro) this.ro.disconnect();
    this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    this.renderer.dispose();
    this.canvas.remove();
    this.host.classList.remove('has3d');
  }
}
