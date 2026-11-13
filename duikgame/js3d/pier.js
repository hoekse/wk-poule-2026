/* Diepblauw 3D — de Zoutpier: ronde pijlers volgens het duikkaartje, pier en laadtoren boven water, kust */
import * as THREE from 'three';
import { uw } from './water.js';
import { seabed } from './terrain.js';

/*
 * Indeling (x = oost/west, kust bij x=0, zee naar -x; z = noord/zuid, noord is +z)
 * - Hoofdpier van de kust naar het midden (laadkop, "Tarpons") rond x=-120
 * - Rechterkant (noord): drie pijlergroepen in een zigzag
 * - Linkerkant (zuid): drie pijlergroepen in een zigzag ("Octopus Sighting" tussen midden en eerste groep)
 */
export const CENTER = { x: -120, z: 0 };
export const GROUPS = [
  { id: 'N1', x: -134, z: 19, side: 'rechts' },
  { id: 'N2', x: -108, z: 31, side: 'rechts' },
  { id: 'N3', x: -132, z: 45, side: 'rechts' },
  { id: 'S1', x: -113, z: -17, side: 'links' },
  { id: 'S2', x: -92, z: -31, side: 'links' },
  { id: 'S3', x: -116, z: -46, side: 'links' },
];

export function pillarLayout() {
  const P = [];
  const add = (x, z, tx = 0, tz = 0) => P.push({ x, z, tx, tz, r: 0.55 });
  // hoofdpier: jukken van drie palen, elke 10 m
  for (let x = -8; x >= -106; x -= 10) {
    add(x, -1.6); add(x, 1.6);
    const s = (Math.round(-x / 10) % 2) ? 1 : -1;
    add(x, s * 3.0, 0, s * 0.2);
  }
  // laadkop in het midden
  for (const dx of [-6, 0, 6]) for (const dz of [-4.5, -1.5, 1.5, 4.5]) add(CENTER.x + dx, CENTER.z + dz);
  add(CENTER.x - 9, -5.5, -0.18, -0.12); add(CENTER.x - 9, 5.5, -0.18, 0.12); add(CENTER.x + 8, -6.5, 0.12, -0.2); add(CENTER.x + 8, 6.5, 0.12, 0.2);
  // pijlergroepen (dukdalven)
  GROUPS.forEach((g) => {
    for (const dx of [-1.8, 1.8]) for (const dz of [-2.4, 0, 2.4]) add(g.x + dx, g.z + dz);
    add(g.x - 3.6, g.z, -0.22, 0); add(g.x + 3.6, g.z, 0.22, 0);
  });
  // de paal raakt de bodem: hellende palen lopen schuin naar buiten
  P.forEach((p) => { p.y0 = seabed(p.x, p.z); });
  return P;
}

// positie van paal-as op hoogte y (voor botsingen en dieren)
export function pillarAt(p, y) {
  return { x: p.x + p.tx * -y, z: p.z + p.tz * -y };
}

/* ---------------- textuur met begroeiing ---------------- */
function encrustTexture() {
  const W = 256, H = 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#4b4336';
  g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = Math.random() * 30 - 15;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n * 0.8;
  }
  g.putImageData(img, 0, 0);
  const blob = (x, y, r, col, a) => {
    for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) {
      g.globalAlpha = a;
      g.fillStyle = col;
      g.beginPath();
      const n = 9;
      for (let k = 0; k <= n; k++) {
        const ang = (k / n) * Math.PI * 2;
        const rr = r * (0.75 + Math.sin(k * 2.3 + x) * 0.25);
        const px = x + ox + Math.cos(ang) * rr, py = y + oy + Math.sin(ang) * rr * 0.8;
        if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
      }
      g.fill();
    }
    g.globalAlpha = 1;
  };
  const cols = [['#e0662a', 0.95], ['#c53b2c', 0.9], ['#7b4a9c', 0.85], ['#e6b53a', 0.9], ['#d96b8e', 0.8], ['#6e8a4a', 0.7], ['#2f2a24', 0.6], ['#a35a3a', 0.85]];
  for (let i = 0; i < 140; i++) {
    const [col, a] = cols[i % cols.length];
    blob(Math.random() * W, Math.random() * H, 6 + Math.random() * 22, col, a);
  }
  // oranje kelkkoralen (Tubastraea) en witte poliepjes
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * W, y = Math.random() * H, r = 1.5 + Math.random() * 2.5;
    g.fillStyle = i % 3 ? '#f2a03a' : '#f4efe0';
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(90,40,20,0.6)';
    g.beginPath(); g.arc(x, y, r * 0.4, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 6);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ---------------- pijler-geometrie ---------------- */
const TOP = 3.2, BOT = -15;
function pillarGeometry(quality) {
  const radial = quality === 'laag' ? 14 : 20, hseg = quality === 'laag' ? 26 : 44;
  const g = new THREE.CylinderGeometry(0.52, 0.55, TOP - BOT, radial, hseg, false);
  g.translate(0, (TOP + BOT) / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const under = y < 0.2 ? 1 : 0.15;
    const n = (Math.sin(a * 5 + y * 3.1) * 0.5 + Math.sin(a * 11 - y * 7.3) * 0.3 + Math.sin(a * 3 + y * 13.7) * 0.2) * 0.07 * under;
    const k = 1 + n / 0.55;
    if (Math.abs(y - TOP) > 0.01 && Math.abs(y - BOT) > 0.01) p.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/* ---------------- bouwen ---------------- */
export function makePier(scene, quality) {
  const pillars = pillarLayout();
  const tex = encrustTexture();
  const mat = uw(new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.2, roughness: 0.92, metalness: 0.05 }), {
    caus: true,
    key: 'pillar',
    fragmentColor: `
      if (vWPos.y > 0.35) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.34, 0.27, 0.22), 0.88);
      else if (vWPos.y > -0.45) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.32, 0.42, 0.24), 0.6);
    `,
  });
  const geo = pillarGeometry(quality);
  const inst = new THREE.InstancedMesh(geo, mat, pillars.length);
  const d = new THREE.Object3D();
  pillars.forEach((p, i) => {
    d.position.set(p.x, 0, p.z);
    // hellende paal: onderkant schuift naar buiten (tx/tz per meter diepte); eerst om eigen as draaien, dan kantelen
    d.rotation.order = 'XZY';
    d.rotation.set(-Math.atan(p.tz), Math.random() * Math.PI * 2, Math.atan(p.tx));
    d.updateMatrix();
    inst.setMatrixAt(i, d.matrix);
  });
  inst.instanceMatrix.needsUpdate = true;
  scene.add(inst);
  buildAbove(scene, pillars);
  buildShore(scene);
  return { pillars, mesh: inst };
}

function box(w, h, d, x, y, z, mat, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function buildAbove(scene, pillars) {
  const G = new THREE.Group();
  const steel = uw(new THREE.MeshStandardMaterial({ color: 0x3a3634, roughness: 0.8, metalness: 0.3 }), { key: 'steel' });
  const rust = uw(new THREE.MeshStandardMaterial({ color: 0x5e4535, roughness: 0.9, metalness: 0.2 }), { key: 'rust' });
  const concrete = uw(new THREE.MeshStandardMaterial({ color: 0xb8b0a2, roughness: 0.95 }), { key: 'conc' });
  const yellow = uw(new THREE.MeshStandardMaterial({ color: 0xd8b02a, roughness: 0.7 }), { key: 'yel' });
  // jukbalken en dek van de hoofdpier
  for (let x = -8; x >= -106; x -= 10) box(0.7, 0.8, 7.6, x, TOP + 0.2, 0, rust, G);
  box(118, 0.5, 4.2, -59, TOP + 0.85, 0, steel, G);
  // transportband-galerij met steunportalen
  box(124, 2.4, 2.6, -56, TOP + 3.0, 0, steel, G);
  for (let x = -2; x >= -118; x -= 12) {
    box(0.3, 2.2, 0.3, x, TOP + 1.9, -1.4, steel, G);
    box(0.3, 2.2, 0.3, x, TOP + 1.9, 1.4, steel, G);
  }
  // laadkop + toren + giekarm
  box(20, 1.0, 14, CENTER.x, TOP + 0.4, 0, concrete, G);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.6, 22, 0.6, CENTER.x + sx * 2.6, TOP + 11, sz * 2.6, steel, G);
  for (let h = 4; h < 22; h += 4.5) {
    box(5.8, 0.25, 0.25, CENTER.x, TOP + h, 2.6, steel, G); box(5.8, 0.25, 0.25, CENTER.x, TOP + h, -2.6, steel, G);
    box(0.25, 0.25, 5.8, CENTER.x + 2.6, TOP + h, 0, steel, G); box(0.25, 0.25, 5.8, CENTER.x - 2.6, TOP + h, 0, steel, G);
  }
  box(8, 4, 7, CENTER.x, TOP + 24, 0, steel, G);
  const boom = box(30, 1.3, 1.8, CENTER.x - 16, TOP + 20, 0, steel, G);
  boom.rotation.z = -0.12;
  box(2.2, 6, 2.2, CENTER.x - 30, TOP + 15.5, 0, steel, G);
  box(6, 3, 3, CENTER.x + 6, TOP + 21, 0, yellow, G);
  // dukdalven met loopbruggen
  GROUPS.forEach((g) => box(6.2, 1.3, 7.2, g.x, TOP + 0.5, g.z, concrete, G));
  const walk = (a, b) => {
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    const m = box(L, 0.22, 1.1, (a.x + b.x) / 2, TOP + 2.6, (a.z + b.z) / 2, steel, G);
    m.rotation.y = -Math.atan2(dz, dx);
    const r1 = box(L, 0.06, 0.06, (a.x + b.x) / 2, TOP + 3.6, (a.z + b.z) / 2, yellow, G);
    r1.rotation.y = m.rotation.y;
  };
  const cN = { x: CENTER.x, z: 7 }, cS = { x: CENTER.x, z: -7 };
  walk(cN, GROUPS[0]); walk(GROUPS[0], GROUPS[1]); walk(GROUPS[1], GROUPS[2]);
  walk(cS, GROUPS[3]); walk(GROUPS[3], GROUPS[4]); walk(GROUPS[4], GROUPS[5]);
  // transportband landinwaarts
  box(70, 2.4, 2.6, 34, TOP + 3.6, 0, steel, G);
  scene.add(G);
}

function buildShore(scene) {
  const G = new THREE.Group();
  // de gele steen "SALT PIER" bij de ingang
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#e4c23a'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(120,90,20,' + Math.random() * 0.15 + ')'; g.fillRect(Math.random() * 512, Math.random() * 256, 3, 3); }
  g.fillStyle = '#1a1612';
  g.font = 'bold 96px Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('SALT', 256, 112); g.fillText('PIER', 256, 216);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sg = new THREE.SphereGeometry(0.6, 20, 14);
  sg.scale(1.0, 0.7, 0.55);
  const stone = new THREE.Mesh(sg, uw(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), { key: 'stone' }));
  stone.position.set(9, seabed(9, 7) + 0.35, 7);
  stone.rotation.y = -Math.PI / 2 + 0.3;
  G.add(stone);
  // zoutpannen en zoutbergen in de verte
  const pink = new THREE.MeshBasicMaterial({ color: 0xe9b3c2 });
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), pink);
    p.rotation.x = -Math.PI / 2;
    p.position.set(150 + i * 170, 2.6, (i - 1.5) * 110);
    G.add(p);
  }
  const salt = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(14 + i * 2, 12 + (i % 2) * 5, 18), salt);
    cone.position.set(120 + i * 22, 3 + 6, -40 + i * 18);
    G.add(cone);
  }
  scene.add(G);
}
