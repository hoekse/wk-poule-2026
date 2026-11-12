/* Diepblauw — de rit met de Tuimelaar-bus over de snelweg (3D).
   Een Nederlandse snelweg 2 x 3 rijstroken met vluchtstrook, middengeleider, blauwe
   bewegwijzering, matrixborden, hectometerpaaltjes, polders, sloten, bomenrijen en
   windmolens. De bus staat stil; de wereld schuift langs (loopband), zo blijft het licht
   voor telefoons. Tijdens de rit draait de camera langzaam om de bus heen. */
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/three/addons.min.js';

const LANE = 3.5;
const laneX = (l) => 0.6 + LANE * (l + 0.5);
// De bus rijdt in de middelste strook en haalt de vrachtwagens rechts in; auto's links halen de bus in.
// Elke strook heeft één snelheid, zodat voertuigen elkaar en de bus nooit kunnen raken.
const BUS_X = laneX(1);
const SPEED = 28; // m/s (± 100 km/h)
const LANE_V = [SPEED + 4, SPEED, SPEED - 6]; // links, midden, rechts (vrachtwagens ± 80 km/h)
const FAR = -900, NEAR = 60; // objecten vóór de bus (z < 0) schuiven naar +z en komen dan weer vooraan
const VFAR = -900, VNEAR = 160; // voertuigen: ruimer, zodat ze nooit vlak achter de bus verschijnen

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// rijbaan (één richting): zoab-asfalt, kantstrepen, onderbroken strepen (3 m streep, 9 m gat)
function roadTex() {
  return canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#3b3d40'; c.fillRect(0, 0, w, h);
    const r = rnd(2);
    for (let i = 0; i < 14000; i++) { const v = 40 + r() * 40 | 0; c.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 3) + ',0.6)'; c.fillRect(r() * w, r() * h, 1.5, 1.5); }
    // breedte 14 m (0,6 strook links + 3 x 3,5 + 3 m vluchtstrook) op 512 px; lengte 12 m op 512 px
    const px = w / 14, py = h / 12;
    c.fillStyle = '#e9e9e2';
    c.fillRect(0.45 * px, 0, 0.15 * px, h); // linker kantstreep
    c.fillRect((0.6 + LANE * 3) * px, 0, 0.2 * px, h); // rechter kantstreep (vluchtstrook)
    for (const lx of [0.6 + LANE, 0.6 + LANE * 2]) c.fillRect(lx * px - 0.07 * px, 0, 0.14 * px, 3 * py);
  }, true);
}
function grassTex() {
  return canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#5f8f3e'; c.fillRect(0, 0, w, h);
    const r = rnd(9);
    for (let i = 0; i < 9000; i++) { const g = 110 + r() * 60 | 0; c.fillStyle = 'rgba(' + (g - 50) + ',' + g + ',' + (g - 80) + ',0.5)'; c.fillRect(r() * w, r() * h, 1, 2); }
  }, true);
}
// polder: lange smalle kavels met sloten ertussen (texture = 400 m breed, 400 m lang)
function polderTex() {
  return canvasTex(1024, 1024, (c, w, h) => {
    const r = rnd(4);
    const cols = ['#6d9b45', '#7aa64f', '#5e8c3a', '#8fb35a', '#a7a24e', '#6f9a4b', '#c9b36a'];
    let x = 0;
    while (x < w) {
      const bw = 30 + r() * 70;
      c.fillStyle = cols[(r() * cols.length) | 0]; c.fillRect(x, 0, bw, h);
      for (let i = 0; i < 400; i++) { c.fillStyle = 'rgba(0,0,0,' + r() * 0.06 + ')'; c.fillRect(x + r() * bw, r() * h, 2, 6); }
      x += bw;
      c.fillStyle = '#3d5a5e'; c.fillRect(x, 0, 3, h); // sloot
      x += 3;
    }
    // dwarssloten
    for (let y = 0; y < h; y += 180 + r() * 160) { c.fillStyle = 'rgba(55,80,85,0.8)'; c.fillRect(0, y, w, 3); }
  }, true);
}
function skyTex() {
  return canvasTex(64, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3f7fc2'); g.addColorStop(0.55, '#8dbbe6'); g.addColorStop(1, '#dce9f2');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
}
function cloudTex(seed) {
  return canvasTex(256, 128, (c, w, h) => {
    const r = rnd(seed);
    for (let i = 0; i < 26; i++) {
      const x = 40 + r() * 176, y = 70 - r() * 30 + Math.abs(x - 128) * 0.12, rad = 16 + r() * 26;
      const g = c.createRadialGradient(x, y, 1, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.6, 'rgba(245,247,250,0.7)'); g.addColorStop(1, 'rgba(235,240,245,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill();
    }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(150,165,185,0.35)'; c.fillRect(0, h * 0.62, w, h);
  });
}
// blauw ANWB-achtig bord: routenummer in rood/geel vak, plaatsnamen in wit
function signTex(lines, opts = {}) {
  return canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#123f8c'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
    let y = 70;
    if (opts.road) {
      c.fillStyle = opts.road[0] === 'A' ? '#c8102e' : '#f2c21a';
      c.fillRect(24, 26, 96, 52);
      c.fillStyle = opts.road[0] === 'A' ? '#ffffff' : '#111111'; c.font = '700 40px Arial'; c.textAlign = 'center';
      c.fillText(opts.road, 72, 66);
    }
    c.fillStyle = '#ffffff'; c.textAlign = 'left';
    lines.forEach((l, i) => { c.font = (i === 0 ? '700 50px' : '700 44px') + ' Arial'; c.fillText(l, opts.road ? 140 : 32, y + i * 62); });
    if (opts.arrow) { c.font = '700 64px Arial'; c.textAlign = 'right'; c.fillText(opts.arrow, w - 26, h - 28); }
  });
}
function matrixTex(txt) {
  return canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#0c0d0f'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#e8352a'; c.lineWidth = 9; c.beginPath(); c.arc(64, 64, 48, 0, 7); c.stroke();
    c.fillStyle = '#f2f2ee'; c.font = '700 40px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 64, 66);
  });
}

// Bewegwijzering per deel van de route (p = 0..1)
const ROUTES = {
  schiphol: [
    { p: 0, road: 'A28', lines: ['Amersfoort', 'Utrecht'], km: 'Harderwijk 28' },
    { p: 0.32, road: 'A1', lines: ['Amsterdam', 'Hilversum'], km: 'Amsterdam 38' },
    { p: 0.62, road: 'A9', lines: ['Schiphol', 'Haarlem'], km: 'Schiphol 18' },
    { p: 0.86, road: 'A4', lines: ['Schiphol', 'Vertrek ✈'], km: 'Schiphol 3' },
  ],
  zeeland: [
    { p: 0, road: 'A28', lines: ['Amersfoort', 'Utrecht'], km: 'Utrecht 74' },
    { p: 0.3, road: 'A27', lines: ['Breda', 'Gorinchem'], km: 'Gorinchem 41' },
    { p: 0.6, road: 'A29', lines: ['Zierikzee', 'Hellegatsplein'], km: 'Zierikzee 47' },
    { p: 0.85, road: 'N59', lines: ['Zierikzee', 'Oosterschelde'], km: 'Zierikzee 8' },
  ],
};

export class Drive {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.route = ROUTES[opts.route] || ROUTES.schiphol;
    this.duration = opts.duration || 18;
    this.onProgress = opts.onProgress || (() => {});
    this.onDone = opts.onDone || (() => {});
    const low = opts.quality === 'laag';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1 : 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xcfdde8, 220, 1100);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.3, 3000);
    this.t = 0; this.signStage = -1;
    this.movers = [];
    this.build();
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.alive = true;
    this.loadBus();
    this.loadVehicles();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  build() {
    const S = this.scene;
    const sun = new THREE.DirectionalLight(0xfff3dc, 2.4); sun.position.set(-120, 160, -60); S.add(sun);
    S.add(new THREE.HemisphereLight(0xcfe3f5, 0x5f7a45, 1.15));
    // lucht
    const sky = new THREE.Mesh(new THREE.SphereGeometry(2500, 24, 12), new THREE.MeshBasicMaterial({ map: skyTex(), side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -2; S.add(sky); this.sky = sky;
    // Hollandse stapelwolken
    this.clouds = [];
    const ct = [cloudTex(1), cloudTex(2), cloudTex(3)];
    const r = rnd(12);
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: ct[i % 3], transparent: true, depthWrite: false, fog: false }));
      const s = 160 + r() * 220; m.scale.set(s, s, 1);
      const a = (r() - 0.5) * 2.4, d = 900 + r() * 900;
      m.position.set(Math.sin(a) * d, 120 + r() * 160, -Math.cos(a) * d - 200);
      m.lookAt(0, m.position.y * 0.5, 0);
      m.renderOrder = -1; S.add(m); this.clouds.push(m);
    }
    // polder rondom (texture schuift mee)
    this.polder = polderTex(); this.polder.repeat.set(6, 6);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshLambertMaterial({ map: this.polder }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, -600); S.add(ground);
    // bermen
    this.grass = grassTex(); this.grass.repeat.set(4, 120);
    const berm = new THREE.Mesh(new THREE.PlaneGeometry(60, 1000), new THREE.MeshLambertMaterial({ map: this.grass }));
    berm.rotation.x = -Math.PI / 2; berm.position.set(0, 0, -400); S.add(berm);
    // twee rijbanen
    this.road = roadTex(); this.road.repeat.set(1, 1000 / 12);
    const roadMat = new THREE.MeshLambertMaterial({ map: this.road });
    const ours = new THREE.Mesh(new THREE.PlaneGeometry(14, 1000), roadMat);
    ours.rotation.x = -Math.PI / 2; ours.position.set(7.1, 0.02, -400); S.add(ours);
    const other = new THREE.Mesh(new THREE.PlaneGeometry(14, 1000), roadMat);
    other.rotation.x = -Math.PI / 2; other.rotation.z = Math.PI; other.position.set(-7.1, 0.02, -400); S.add(other);
    // middengeleider: betonnen barrier
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 1000), new THREE.MeshLambertMaterial({ color: 0xbfc0bd }));
    barrier.position.set(0, 0.45, -400); S.add(barrier);
    // vangrail rechts (glimmend strookje)
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 1000), new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 0.7, roughness: 0.35 }));
    rail.position.set(15.6, 0.62, -400); S.add(rail);
    // sloten langs de weg
    const water = new THREE.MeshStandardMaterial({ color: 0x46646b, roughness: 0.15, metalness: 0.2 });
    for (const x of [24, -24]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1000), water); s.rotation.x = -Math.PI / 2; s.position.set(x, 0.01, -400); S.add(s); }

    // bewegende dingen (worden steeds hergebruikt)
    const add = (obj, z, kind, extra = {}) => { obj.position.z = z; S.add(obj); this.movers.push(Object.assign({ obj, kind }, extra)); return obj; };
    // hectometerpaaltjes (groen) elke 100 m
    const hmGeo = new THREE.BoxGeometry(0.12, 0.9, 0.3), hmMat = new THREE.MeshLambertMaterial({ color: 0x1f6b3a });
    for (let z = FAR; z < NEAR; z += 100) { const p = new THREE.Mesh(hmGeo, hmMat); p.position.set(16.1, 0.45, 0); add(p, z, 'post'); }
    // lantaarnpalen langs de middengeleider (elke 60 m)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.4 });
    for (let z = FAR; z < NEAR; z += 60) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 11, 6), poleMat); pole.position.y = 5.5; g.add(pole);
      for (const s of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.12), poleMat); arm.position.set(s * 1.1, 10.9, 0); g.add(arm); const l = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.3), new THREE.MeshLambertMaterial({ color: 0x5f6368 })); l.position.set(s * 2.1, 10.85, 0); g.add(l); }
      g.position.x = 0; add(g, z, 'post');
    }
    // bomenrijen en boerderijen
    const trunk = new THREE.MeshLambertMaterial({ color: 0x5d4632 });
    const leaf = [new THREE.MeshLambertMaterial({ color: 0x3f6f32 }), new THREE.MeshLambertMaterial({ color: 0x4f7d3a }), new THREE.MeshLambertMaterial({ color: 0x5a8a45 })];
    const crown = new THREE.SphereGeometry(1, 8, 6);
    const r2 = rnd(33);
    for (let i = 0; i < 70; i++) {
      const g = new THREE.Group();
      const h = 6 + r2() * 8, poplar = r2() < 0.5;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, h * 0.5, 5), trunk); tr.position.y = h * 0.25; g.add(tr);
      const c = new THREE.Mesh(crown, leaf[i % 3]); c.position.y = h * 0.62; c.scale.set(poplar ? 1.3 : 2.8, h * (poplar ? 0.45 : 0.3), poplar ? 1.3 : 2.8); g.add(c);
      const side = r2() < 0.5 ? -1 : 1;
      g.position.x = side * (28 + r2() * 60);
      add(g, FAR + r2() * (NEAR - FAR), 'tree');
    }
    const wall = new THREE.MeshLambertMaterial({ color: 0x8e4c35 }), roof = new THREE.MeshLambertMaterial({ color: 0x3e3b3a }), shed = new THREE.MeshLambertMaterial({ color: 0x5d6b5f });
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group();
      const w = 8 + r2() * 6, d = 12 + r2() * 10;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 4, d), i % 3 ? wall : shed); b.position.y = 2; g.add(b);
      const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.62, 4, 4, 1), roof); rf.rotation.y = Math.PI / 4; rf.scale.z = d / w; rf.position.y = 6; g.add(rf);
      g.position.x = (r2() < 0.5 ? -1 : 1) * (90 + r2() * 220);
      g.rotation.y = r2() * 0.3;
      add(g, FAR + r2() * (NEAR - FAR), 'tree');
    }
    // windmolens (wieken draaien)
    const towerMat = new THREE.MeshLambertMaterial({ color: 0xf4f5f5 });
    const blade = new THREE.BoxGeometry(1.6, 42, 0.4); blade.translate(0, 21, 0);
    for (let i = 0; i < 9; i++) {
      const g = new THREE.Group();
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 90, 10), towerMat); tw.position.y = 45; g.add(tw);
      const hub = new THREE.Group(); hub.position.set(0, 90, 2.4); g.add(hub);
      const nac = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 7), towerMat); nac.position.set(0, 90, 0); g.add(nac);
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(blade, towerMat); b.rotation.z = k * Math.PI * 2 / 3; hub.add(b); }
      g.position.x = (i % 2 ? -1 : 1) * (180 + r2() * 260);
      g.rotation.y = 0.4;
      add(g, FAR + (i / 9) * (NEAR - FAR) - 200, 'mill', { hub, spin: 0.9 + r2() * 0.5 });
    }
    // portalen met bewegwijzering en matrixborden (elke 450 m)
    this.signs = [];
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0xb7bcc2, metalness: 0.6, roughness: 0.45 });
    for (let z = FAR + 120, k = 0; z < NEAR; z += 450, k++) {
      const g = new THREE.Group();
      for (const x of [-0.2, 16.4]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.2, 0.4), gantryMat); p.position.set(x, 3.6, 0); g.add(p); }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.6, 0.6), gantryMat); beam.position.set(8.1, 7.0, 0); g.add(beam);
      const bordM = new THREE.MeshBasicMaterial({ color: 0xffffff }), bordM2 = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const b1 = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.2), bordM); b1.position.set(5.0, 8.6, 0.32); g.add(b1);
      const b2 = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.3), bordM2); b2.position.set(11.6, 8.15, 0.32); g.add(b2);
      // matrixborden boven elke rijstrook
      const mt = matrixTex('100');
      for (let l = 0; l < 3; l++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: mt })); m.position.set(0.6 + LANE * (l + 0.5), 5.9, 0.32); g.add(m); }
      add(g, z, 'gantry');
      this.signs.push({ b1, b2 });
    }
    // ander verkeer: per strook gelijke snelheid en vaste onderlinge afstand
    this.traffic = [];
    const colors = [0x1d2a44, 0xbfc3c8, 0x8a1d1d, 0x2b2b2e, 0xe9e9e6, 0x3d5e7a, 0x6b6f72];
    const span = VNEAR - VFAR;
    const lane = (l, n, kindOf, offset) => {
      for (let i = 0; i < n; i++) {
        const kind = kindOf(i);
        const v = this.vehicle(kind, colors[(i * 3 + l) % colors.length]);
        v.position.x = laneX(l);
        add(v, VFAR + ((i + offset) / n) * span, 'car', { v: LANE_V[l], kind, wrap: [VFAR, VNEAR] });
        this.traffic.push(v);
      }
    };
    lane(0, 7, (i) => (i % 3 === 2 ? 'car2' : 'car1'), 0.3); // links: personenauto's die de bus inhalen
    lane(2, 6, (i) => (i % 2 ? 'car1' : 'truck'), 0.6); // rechts: vrachtwagens en een enkele auto
    // in de eigen strook alleen een auto ver vóór de bus, met dezelfde snelheid
    { const v = this.vehicle('car2', 0x2b2b2e); v.position.x = laneX(1); add(v, -85, 'car', { v: SPEED, kind: 'car2', wrap: [VFAR, VNEAR] }); this.traffic.push(v); }
    // tegenliggers (rijden de andere kant op)
    for (let i = 0; i < 8; i++) {
      const kind = i % 3 === 0 ? 'truck' : i % 2 ? 'car2' : 'car1';
      const v = this.vehicle(kind, colors[(i + 3) % colors.length]);
      v.rotation.y = Math.PI;
      const l = kind === 'truck' ? 2 : i % 2;
      v.position.x = -laneX(l);
      add(v, VFAR + (i / 8) * span, 'oncoming', { v: -(l === 2 ? SPEED - 6 : SPEED + 2), kind, wrap: [VFAR, VNEAR] });
    }
    this.setSigns(0);
  }

  vehicle(kind, color) {
    const g = new THREE.Group();
    g.userData.kind = kind;
    const tpl = this.vehicleModels && this.vehicleModels[kind];
    g.add(tpl ? tpl.clone(true) : kind === 'truck' ? this.makeTruck() : this.makeCar(color));
    return g;
  }
  // 3D-modellen van auto's en een vrachtwagen (Magnific); vervangen de eenvoudige vormen zodra ze geladen zijn
  loadVehicles() {
    const loader = new GLTFLoader();
    const LEN = { car1: 4.3, car2: 4.8, truck: 16.5 };
    this.vehicleModels = {};
    Promise.all(Object.keys(LEN).map((k) => loader.loadAsync('models/verkeer/' + k + '.glb').then((g) => {
      const o = g.scene;
      o.traverse((m) => { if (m.isMesh && m.material.map) m.material.map.anisotropy = 4; });
      const box = new THREE.Box3().setFromObject(o), s = new THREE.Vector3(), c = new THREE.Vector3();
      box.getSize(s); box.getCenter(c);
      const alongX = s.x > s.z, L = Math.max(s.x, s.z), sc = LEN[k] / L;
      o.position.set(-c.x * sc, -box.min.y * sc, -c.z * sc); o.scale.setScalar(sc);
      const wrap = new THREE.Group(); wrap.add(o);
      wrap.rotation.y = (alongX ? Math.PI / 2 : 0) + Math.PI;
      this.vehicleModels[k] = wrap;
    }).catch(() => null))).then(() => {
      if (!this.alive) return;
      // bestaande voertuigen omwisselen
      this.movers.forEach((m) => {
        if (!m.kind || !this.vehicleModels[m.kind]) return;
        const g = m.obj;
        g.children.slice().forEach((ch) => { g.remove(ch); ch.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); });
        g.add(this.vehicleModels[m.kind].clone(true));
      });
    });
  }

  makeCar(color) {
    const g = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.35 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x1b2430, metalness: 0.3, roughness: 0.15 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 4.4), paint); body.position.y = 0.6; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.3), glass); cab.position.set(0, 1.2, 0.2); g.add(cab);
    const roofM = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 1.9), paint); roofM.position.set(0, 1.52, 0.25); g.add(roofM);
    const tyre = new THREE.MeshLambertMaterial({ color: 0x151515 });
    for (const [x, z] of [[-0.85, -1.4], [0.85, -1.4], [-0.85, 1.4], [0.85, 1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.25, 12), tyre); w.rotation.z = Math.PI / 2; w.position.set(x, 0.33, z); g.add(w); }
    const tl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.05), new THREE.MeshBasicMaterial({ color: 0xb01818 })); tl.position.set(0, 0.8, 2.22); g.add(tl);
    return g;
  }
  makeTruck() {
    const g = new THREE.Group();
    const cabM = new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.5 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.0, 2.3), cabM); cab.position.set(0, 1.9, -6.3); g.add(cab);
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.55, 3.2, 12), new THREE.MeshStandardMaterial({ color: 0xdfe2e4, roughness: 0.6 })); trailer.position.set(0, 2.3, 1.2); g.add(trailer);
    const tyre = new THREE.MeshLambertMaterial({ color: 0x151515 });
    for (const z of [-6.0, -0.5, 4.5, 5.8]) for (const x of [-1.15, 1.15]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12), tyre); w.rotation.z = Math.PI / 2; w.position.set(x, 0.5, z); g.add(w); }
    return g;
  }

  setSigns(p) {
    let st = 0;
    this.route.forEach((r, i) => { if (p >= r.p) st = i; });
    if (st === this.signStage) return;
    this.signStage = st;
    const R = this.route[st];
    this.signs.forEach((s) => {
      s.b1.material.map = signTex(R.lines, { road: R.road, arrow: '↑' }); s.b1.material.needsUpdate = true;
      s.b2.material.map = signTex([R.km.split(' ').slice(0, -1).join(' '), R.km.split(' ').slice(-1)[0] + ' km'], {}); s.b2.material.needsUpdate = true;
    });
  }

  loadBus() {
    new GLTFLoader().loadAsync('models/winkel/bus.glb').then((g) => {
      if (!this.alive) return;
      const o = g.scene;
      o.traverse((m) => { if (m.isMesh) { m.material.envMapIntensity = 0.6; if (m.material.map) m.material.map.anisotropy = 8; } });
      const box = new THREE.Box3().setFromObject(o), s = new THREE.Vector3(), c = new THREE.Vector3();
      box.getSize(s); box.getCenter(c);
      // de bus ligt in de lengte langs x of z: schalen naar 5,0 m lang en met de neus naar -z draaien
      const alongX = s.x > s.z, L = Math.max(s.x, s.z), k = 4.98 / L;
      const wrap = new THREE.Group();
      o.position.set(-c.x * k, -box.min.y * k, -c.z * k); o.scale.setScalar(k);
      wrap.add(o);
      // neus naar -z (de rijrichting); het model uit Magnific kijkt de andere kant op
      wrap.rotation.y = (alongX ? Math.PI / 2 : 0) + Math.PI;
      const holder = new THREE.Group(); holder.add(wrap);
      holder.position.set(BUS_X, 0.02, 0);
      this.scene.add(holder);
      this.bus = holder; this.busInner = wrap;
      // schaduw onder de bus
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.6), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.set(BUS_X, 0.04, 0); this.scene.add(sh);
    }).catch((e) => console.warn('bus niet geladen', e));
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1 ? 62 : 48;
    this.camera.updateProjectionMatrix();
  }

  loop(now) {
    if (!this.alive) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000); this.last = now;
    this.t += dt;
    const p = Math.min(1, this.t / this.duration);
    const move = SPEED * dt;
    // loopband: texturen en objecten schuiven
    this.road.offset.y += move / 12;
    this.grass.offset.y += move / (1000 / 120);
    this.polder.offset.y += move / 400;
    this.movers.forEach((m) => {
      const o = m.obj;
      // stilstaande dingen schuiven met de snelheid van de bus; voertuigen met het verschil in snelheid
      o.position.z += m.v != null ? (SPEED - m.v) * dt : move;
      const [lo, hi] = m.wrap || [FAR, NEAR];
      if (o.position.z > hi) o.position.z -= hi - lo;
      if (o.position.z < lo) o.position.z += hi - lo;
      if (m.hub) m.hub.rotation.z += m.spin * dt;
    });
    // de bus: klein beetje veren
    if (this.bus) { this.bus.position.y = 0.02 + Math.sin(this.t * 9) * 0.012; this.bus.rotation.z = Math.sin(this.t * 1.3) * 0.004; }
    this.setSigns(p);
    // camera: van achter (boven het verkeer) via de rechterberm naar schuin voor; nooit boven de middenberm
    // met de lantaarnpalen en nooit laag in een rijstrook waar auto's of vrachtwagens rijden
    const a = -0.25 + p * 2.15 + Math.sin(this.t * 0.25) * 0.06;
    const dist = 11 + Math.sin(p * Math.PI) * 2.5;
    const tx = BUS_X, ty = 1.4, tz = 0;
    const side = Math.max(0, Math.sin(a));
    this.camera.position.set(tx + Math.sin(a) * dist, 5.4 - side * 2.2, tz + Math.cos(a) * dist);
    this.camera.lookAt(tx, ty, tz - 2);
    this.sky.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
    this.onProgress(p);
    if (p >= 1 && !this.doneFired) { this.doneFired = true; this.onDone(); }
  }

  stop() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    this.renderer.dispose();
  }
}
