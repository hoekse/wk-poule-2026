/* Diepblauw 3D — de Zeelandbrug in de Oosterschelde.
   Kantduik vanaf de dijk bij de brug (Schouwen-Duiveland). Een helling van stortsteen loopt
   af naar een slibbige bodem; verderop staan de pijlerparen van de brug, elke 95 m, vol
   zeeanjelieren en dodemansduimen. Groen water, ± 4 m zicht, 13 °C. Alleen rond de kentering. */
import * as THREE from 'three';
import { UW, uw } from './water.js';
import { setSeabed, setSolid, seabed, floorNoise as fbm } from './terrain.js';
import { loadModels, hasModel, modelGeo, modelMap } from './models.js';
import { Fauna } from './creatures3d.js';
import { rng, smooth, tileable, loadTex, lumpy, makeRayGround } from './sitekit.js';

const DG = window.DG;

// dwarsprofiel van de dijk naar de geul: [x, diepte (negatief)]
const PROF = [[12, 3.2], [3, 0.4], [0, -0.6], [-6, -3.6], [-14, -7.2], [-30, -10.5], [-60, -14], [-95, -17], [-130, -20.5], [-170, -22]];
function prof(x) {
  if (x >= PROF[0][0]) return PROF[0][1];
  for (let i = 1; i < PROF.length; i++) {
    const a = PROF[i - 1], b = PROF[i];
    if (x >= b[0]) return a[1] + (b[1] - a[1]) * smooth((a[0] - x) / (a[0] - b[0]));
  }
  return PROF[PROF.length - 1][1];
}
// pijlerparen van de Zeelandbrug (elke 95 m), de dichtstbijzijnde bij de dijk
export const PIERS = [-48, -143];
const COL_R = 1.5, COL_DZ = 3.8;
function osSeabed(x, z) {
  let y = prof(x);
  // stortsteen op de dijkhelling: grillig; verder slib met lichte ribbels
  const rip = x > -16 ? 1 : Math.max(0, 1 - (-16 - x) / 10);
  y += (fbm(x * 0.22, z * 0.22) - 0.45) * (0.35 + rip * 0.9);
  y += Math.sin(z * 0.05 + x * 0.02) * 0.25 * (1 - rip);
  // uitspoeling rond de voet van de pijlers
  for (const px of PIERS) {
    const d = Math.hypot(x - px, Math.max(0, Math.abs(z) - COL_DZ));
    if (d < 9) y -= (1 - d / 9) * 0.9;
  }
  return y;
}

/* ---------------- bodem ---------------- */
function makeFloor(scene, q) {
  const W = 220, D = 240, cx = -80;
  const geo = new THREE.PlaneGeometry(W, D, q === 'laag' ? 90 : 150, q === 'laag' ? 96 : 160);
  geo.rotateX(-Math.PI / 2);
  geo.translate(cx, 0, 0);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const col = new Float32Array(pos.count * 3);
  const mud = new THREE.Color('#8f8a77'), mud2 = new THREE.Color('#77745f'), stone = new THREE.Color('#5d5b55'), dike = new THREE.Color('#a29f91'), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = osSeabed(x, z);
    pos.setY(i, y);
    uv.setXY(i, x / 3, z / 3);
    const n = fbm(x * 0.07 + 3, z * 0.07);
    c.copy(mud).lerp(mud2, n);
    if (x > -16) c.lerp(stone, Math.min(1, (x + 16) / 8));
    if (y > 0.2) c.copy(dike);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mat = uw(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), { caus: true, key: 'osFloor' });
  loadTex('img/oosterschelde/bodem.webp', (img) => {
    const t = new THREE.CanvasTexture(tileable(img, 1024, 1024));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    mat.map = t; mat.needsUpdate = true;
  });
  const m = new THREE.Mesh(geo, mat);
  scene.add(m);
  return m;
}

/* ---------------- stortsteen op de dijk en losse stenen ---------------- */
function makeStones(scene, q) {
  const R = rng(4242);
  const geo = lumpy(new THREE.IcosahedronGeometry(0.5, q === 'laag' ? 1 : 2), 0.38, 7);
  geo.scale(1, 0.8, 1);
  const mat = uw(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), { caus: true, key: 'osStone' });
  // de bodemfoto als steenstructuur (stenen, schelpjes, wier)
  loadTex('img/oosterschelde/bodem.webp', (img) => {
    const t = new THREE.CanvasTexture(tileable(img, 512, 512));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); t.colorSpace = THREE.SRGBColorSpace;
    mat.map = t; mat.bumpMap = t; mat.bumpScale = 1.5; mat.needsUpdate = true;
  });
  const n = q === 'laag' ? 520 : 1100;
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const d = new THREE.Object3D(), c = new THREE.Color();
  const list = [];
  for (let i = 0; i < n; i++) {
    const onDike = i < n * 0.78;
    const x = onDike ? 4 - R() * 22 : -16 - R() * 150, z = (R() - 0.5) * (onDike ? 220 : 200);
    const s = onDike ? 0.35 + R() * 0.75 : 0.12 + Math.pow(R(), 2) * 0.5;
    d.position.set(x, osSeabed(x, z) - s * 0.2, z);
    d.rotation.set(R() * 3, R() * 6, R() * 3);
    d.scale.set(s, s * (0.55 + R() * 0.35), s * (0.8 + R() * 0.4));
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    // basalt en grijze breuksteen, soms groen van algen
    c.setHSL(0.1 + R() * 0.14, 0.05 + R() * 0.15, onDike ? 0.32 + R() * 0.22 : 0.45 + R() * 0.2);
    mesh.setColorAt(i, c);
    list.push({ x, z, s });
  }
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
  return { list, mesh };
}

/* ---------------- pijlers van de brug ---------------- */
function makePiers(scene, q) {
  const pillars = [];
  const colGeo = new THREE.CylinderGeometry(COL_R, COL_R * 1.04, 1, q === 'laag' ? 24 : 40, 1, true);
  colGeo.translate(0, 0.5, 0);
  const mat = uw(new THREE.MeshStandardMaterial({ color: 0xb8b8ad, roughness: 0.95 }), { caus: true, key: 'osPier' });
  loadTex('img/oosterschelde/pijler.webp', (img) => {
    const t = new THREE.CanvasTexture(tileable(img, 720, 1280));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    mat.map = t; mat.bumpMap = t; mat.bumpScale = 2.2; mat.color.set(0xffffff); mat.needsUpdate = true;
  });
  const footMat = uw(new THREE.MeshStandardMaterial({ color: 0x7d7b70, roughness: 1 }), { caus: true, key: 'osFoot' });
  for (const px of PIERS) {
    for (const s of [-1, 1]) {
      const z = s * COL_DZ;
      const y0 = osSeabed(px, z) - 0.6;
      const m = new THREE.Mesh(colGeo, mat);
      m.position.set(px, y0, z);
      m.scale.set(1, 16 - y0, 1); // tot het brugdek boven water
      scene.add(m);
      pillars.push({ x: px, z, r: COL_R, tx: 0, tz: 0, y0: y0 + 0.6 });
    }
    // fundering (poer) op de bodem
    const foot = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.4, COL_DZ * 2 + 4.4), footMat);
    foot.position.set(px, osSeabed(px, 0) + 0.1, 0);
    scene.add(foot);
    // dwarsbalk en dek boven water (zichtbaar vanaf de oppervlakte)
    const beam = new THREE.Mesh(new THREE.BoxGeometry(4, 2.2, COL_DZ * 2 + 5), new THREE.MeshStandardMaterial({ color: 0x9a9a92, roughness: 0.9 }));
    beam.position.set(px, 15, 0); scene.add(beam);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(260, 1.4, 13), new THREE.MeshStandardMaterial({ color: 0x8e8e88, roughness: 0.9 }));
  deck.position.set(-110, 16.8, 0); scene.add(deck);
  return pillars;
}

/* ---------------- zeeanjelieren en dodemansduimen op pijlers en stenen ---------------- */
function makeGrowth(scene, q, pillars, stones) {
  const R = rng(99);
  const dense = q === 'laag' ? 0.5 : q === 'midden' ? 0.8 : 1;
  const up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3(), qq = new THREE.Quaternion(), tw = new THREE.Quaternion();
  const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  const build = (id, onPillars, onStones, size, sway) => {
    if (!hasModel(id)) return;
    const groups = new Map();
    const add = (key, mm, c) => { if (!groups.has(key)) groups.set(key, { list: [], cols: [] }); const g = groups.get(key); g.list.push(mm); g.cols.push(c); };
    pillars.forEach((p) => {
      const top = -1.2, k = Math.round(onPillars * dense);
      for (let i = 0; i < k; i++) {
        const y = p.y0 + 0.3 + Math.pow(R(), 0.8) * (top - p.y0 - 0.3);
        const a = R() * Math.PI * 2;
        nrm.set(Math.cos(a), (R() - 0.5) * 0.4, Math.sin(a)).normalize();
        pos.set(p.x + nrm.x * (p.r - 0.05), y, p.z + nrm.z * (p.r - 0.05));
        qq.setFromUnitVectors(up, nrm); tw.setFromAxisAngle(up, R() * Math.PI * 2); qq.multiply(tw);
        const s = size[0] + R() * (size[1] - size[0]);
        sc.set(s, s, s);
        add('p' + p.x, m4.compose(pos, qq, sc).clone(), 0.8 + R() * 0.25);
      }
    });
    for (let i = 0; i < Math.round(onStones * dense); i++) {
      const st = stones[Math.floor(R() * stones.length)];
      const gx = st.x + (R() - 0.5) * st.s * 0.8, gz = st.z + (R() - 0.5) * st.s * 0.8;
      pos.set(gx, seabed(gx, gz) - 0.04, gz);
      qq.setFromAxisAngle(up, R() * Math.PI * 2);
      const s = size[0] * 0.8 + R() * (size[1] - size[0]);
      sc.set(s, s, s);
      add('s' + Math.round(gz / 50), m4.compose(pos, qq, sc).clone(), 0.75 + R() * 0.25);
    }
    const mat = uw(new THREE.MeshStandardMaterial({ map: modelMap(id), roughness: 0.85, side: THREE.DoubleSide }), {
      caus: true, key: 'osGrow' + id,
      vertexPars: 'uniform float uTime;\n',
      vertexBegin: sway ? `{
        vec4 ip = vec4(0.0,0.0,0.0,1.0);
        #ifdef USE_INSTANCING
          ip = instanceMatrix * ip;
        #endif
        float h = max(0.0, position.y);
        transformed.x += sin(uTime * 1.3 + ip.x * 0.7 + ip.z * 0.4) * 0.06 * h;
        transformed.z += cos(uTime * 1.1 + ip.x * 0.3) * 0.05 * h;
      }` : '',
    });
    const geo = modelGeo(id, 'reef'), c = new THREE.Color();
    groups.forEach(({ list, cols }) => {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((mm, i) => { mesh.setMatrixAt(i, mm); mesh.setColorAt(i, c.setScalar(cols[i])); });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
    });
  };
  build('zeeanjelier', 150, 110, [0.24, 0.5], true);
  build('dodemansduim', 90, 160, [0.18, 0.34], false);
}

/* ---------------- suikerwier in bosjes op de stenen van de dijk ---------------- */
function makeKelp(scene, q) {
  const R = rng(777);
  const clumps = q === 'laag' ? 45 : q === 'midden' ? 75 : 100;
  const tex = new THREE.TextureLoader().load('img/oosterschelde/wier.webp');
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = uw(new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }), {
    caus: true, key: 'osKelp', vertexPars: 'uniform float uTime;\n',
    vertexBegin: `{
      vec4 ip = vec4(0.0, 0.0, 0.0, 1.0);
      #ifdef USE_INSTANCING
        ip = instanceMatrix * ip;
      #endif
      float h = position.y * position.y;
      transformed.x += sin(uTime * 0.8 + ip.x * 0.5 + ip.z * 0.3 + position.y * 2.0) * 0.22 * h;
      transformed.z += cos(uTime * 0.6 + ip.z * 0.4 + position.y * 1.6) * 0.12 * h;
    }`,
  });
  // drie bladvormen uit één textuur (drie kolommen naast elkaar)
  const lists = [[], [], []];
  const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), qq = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
  for (let c = 0; c < clumps; c++) {
    const cx = -1.5 - R() * 13, cz = (R() - 0.5) * 190;
    const k = 4 + Math.floor(R() * 8);
    for (let i = 0; i < k; i++) {
      const x = cx + (R() - 0.5) * 1.1, z = cz + (R() - 0.5) * 1.1;
      const h = 0.7 + R() * 1.3;
      pos.set(x, seabed(x, z) - 0.05, z);
      e.set((R() - 0.5) * 0.5, R() * Math.PI * 2, (R() - 0.3) * 0.6);
      qq.setFromEuler(e);
      sc.set(h * (0.14 + R() * 0.05), h, h);
      lists[Math.floor(R() * 3)].push(m4.compose(pos, qq, sc).clone());
    }
  }
  lists.forEach((list, col) => {
    const g = new THREE.PlaneGeometry(1, 1, 1, 12);
    g.translate(0, 0.5, 0);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      // licht gedraaid en overhangend lint
      const tw = y * 0.9;
      p.setXYZ(i, x * Math.cos(tw), y * (1 - 0.15 * y), x * Math.sin(tw) + y * y * 0.45);
      uv.setX(i, (col * 160 + 5 + uv.getX(i) * 150) / 480);
      uv.setY(i, 0.005 + uv.getY(i) * 0.99);
    }
    g.computeVertexNormals();
    const mesh = new THREE.InstancedMesh(g, mat, list.length);
    list.forEach((mm, i) => mesh.setMatrixAt(i, mm));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  });
}

/* ---------------- dieren ---------------- */
const OS_MODELS = ['lipvis', 'steenbolk', 'zeebrasem', 'lipvis-ver', 'steenbolk-ver', 'zeebrasem-ver', 'kreeft', 'zwemkrab', 'zeedonderpad', 'kathaai', 'zeekat', 'vlokslak', 'bruinvis'];
function hangSpots() {
  const out = [];
  PIERS.forEach((px) => { out.push({ x: px + 3.5, z: 0, d: 9 }); out.push({ x: px - 3.5, z: 5, d: 11 }); out.push({ x: px, z: -7, d: 10 }); });
  out.push({ x: -10, z: -12, d: 6 }, { x: -12, z: 14, d: 6 }, { x: -28, z: 0, d: 8 });
  return out;
}
function comp(F, S, k, { rand }) {
  const H = F.hang;
  // steenbolken hangen in groepjes in de luwte van de pijlers; zwarte zeebrasems trekken voorbij
  if (S.steenbolk) {
    F.addSchool(S.steenbolk, Math.round(26 * k), { spread: 1.8, speed: 0.18, home: H[0], roam: 0.1 });
    F.addSchool(S.steenbolk, Math.round(20 * k), { spread: 1.6, speed: 0.18, home: H[3], roam: 0.1 });
    F.addSchool(S.steenbolk, Math.round(14 * k), { spread: 1.5, speed: 0.18, home: H[8], roam: 0.2 });
  }
  if (S.zeebrasem && Math.random() < 0.8) F.addSchool(S.zeebrasem, Math.round(12 * k), { spread: 2.4, speed: 0.35, roam: 0.5 });
  for (let i = 0; i < 4; i++) F.addSolo(S.lipvis, { radius: 6, speed: 0.22, home: H[(i * 2) % H.length] });
}
function extra(F, scene, { rand }, pillars, stones) {
  const S = DG.SPECIES;
  const nearPier = (r) => { const p = pillars[Math.floor(Math.random() * pillars.length)]; const a = Math.random() * Math.PI * 2; return { x: p.x + Math.cos(a) * (p.r + r), z: p.z + Math.sin(a) * (p.r + r), a }; };
  // stenen op de dijkhelling tussen ± 2 en 7 m diep, binnen bereik van de ingang
  const deep = stones.filter((st) => st.x < -3 && st.x > -16 && Math.abs(st.z) < 70);
  const onDike = () => { const st = deep[Math.floor(Math.random() * deep.length)]; return { x: st.x + rand(-0.4, 0.4), z: st.z + rand(-0.4, 0.4), a: Math.random() * Math.PI * 2 }; };
  const onMud = () => ({ x: rand(-20, -150), z: rand(-60, 60), a: Math.random() * Math.PI * 2 });
  // kreeften verstopt tussen de stenen en aan de voet van de pijlers
  for (let i = 0; i < 3; i++) F.addCrawler('kreeft', { at: i < 2 ? onDike : () => nearPier(0.5), rot: [0, 0, 0], scale: S.kreeft.size * 1.4, L: 0.5 });
  // fluwelen zwemkrabben scharrelen rond
  for (let i = 0; i < 6; i++) F.addCrawler('zwemkrab', { at: i < 3 ? onDike : onMud, scale: 0.2, L: 0.1, moving: true, speed: 0.07, range: 3 });
  // zeedonderpadden liggen stil op stenen en bij de pijlers
  for (let i = 0; i < 3; i++) F.addCrawler('zeedonderpad', { at: i < 2 ? onDike : () => nearPier(0.6), scale: S.zeedonderpad.size * 1.1, L: 0.25 });
  // vlokslakken (klein!) op de stenen
  for (let i = 0; i < 4; i++) F.addCrawler('vlokslak', { at: onDike, rot: [0, Math.PI / 2, 0], scale: 0.09, L: 0.08, moving: true, speed: 0.01, range: 0.6 });
  // kathaaien rusten op de slibbodem en zwemmen af en toe een stukje
  for (let i = 0; i < 2; i++) F.addCrawler('kathaai', { at: onMud, rot: [0, Math.PI / 2, 0], scale: S.kathaai.size, L: 0.6, moving: true, speed: 0.12, range: 8, wave: 'transformed.z += sin(uTime * 2.2 - position.x * 5.0) * 0.03 * (0.5 - position.x);' });
  // een zeekat hangt soms bij de pijlers (in het voorjaar en de zomer het vaakst)
  if (Math.random() < 0.55) F.addCrawler('zeekat', { at: () => nearPier(1.2), rot: [0, Math.PI / 2, 0], scale: S.zeekat.size * 1.3, L: 0.35, moving: true, speed: 0.05, range: 3, lift: 1.1, hidden: false,
    wave: 'transformed.y += sin(uTime * 3.0 + position.x * 9.0) * 0.012 * step(0.1, abs(position.z));' });
  // heel soms komt er een bruinvis langs
  if (Math.random() < 0.22) F.addCruiser('bruinvis', { rot: [0, Math.PI / 2, 0], center: { x: -70, z: 0 }, r: 45, depth: 4, speed: 2.2, scale: S.bruinvis.size });
}

export const oosterschelde = {
  id: 'oosterschelde',
  loadTitle: 'Zeelandbrug laden…',
  temp: 13,
  tank: { L: 0, bar: 200, name: '' }, // jouw eigen gehuurde stalen fles
  lead: 'Lood afgestemd op je dikkere pak',
  nightOk: false,
  murky: true, // troebel: lamp standaard aan en de bundel is zichtbaar in het water
  challenges: () => 'oosterschelde',
  bounds: { x: [-185, 6], z: [-110, 110] },
  start: { p: [-1.5, -0.25, -4], buddy: [-1.8, -0.3, -1.6], yaw: Math.PI / 2 },
  water() {
    // groen, troebel water: rood verdwijnt snel, zicht ± 4 m; het wordt snel donker met de diepte
    UW.uAbs.value.set(0.46, 0.27, 0.37);
    UW.uDown.value.set(0.13, 0.05, 0.09);
    return { top: 0xc4e3a6, deep: 0x4a8560, exposure: 1.5, hemi: [0xd8ecd0, 0x7a7560, 1.8], sun: [0xf2f0dc, 2.2], caus: 0.35, rays: true, sea: [0.06, 0.13, 0.1], overcast: 0.75 };
  },
  inShadow: (x, z) => PIERS.some((px) => Math.abs(x - px) < 4 && Math.abs(z) < 8),
  isReef: () => false,
  reefMsg: '',
  pillarMsg: 'Je raakt een pijler. Zeeanjelieren en dodemansduimen zijn kwetsbaar: houd afstand.',
  async build({ scene, q, loading }) {
    setSeabed(osSeabed); setSolid(null);
    await loadModels(['zeeanjelier', 'dodemansduim'].concat(OS_MODELS));
    makeFloor(scene, q);
    const { list: stones, mesh: stoneMesh } = makeStones(scene, q);
    setSeabed(makeRayGround(osSeabed, [stoneMesh]));
    await loading('De pijlers van de Zeelandbrug…');
    const pillars = makePiers(scene, q);
    makeGrowth(scene, q, pillars, stones);
    makeKelp(scene, q);
    await loading('Kreeften, krabben en steenbolken…');
    const fauna = new Fauna(scene, q, { site: 'oosterschelde', hang: hangSpots(), comp, extra: (F, sc, h) => extra(F, sc, h, pillars, stones) });
    return { pillars, fauna };
  },
  startMsg() {
    return 'Je ligt in het water aan de voet van de dijk, naast de Zeelandbrug. Het is net kentering: de stroming valt stil. Laat lucht uit je vest (▼ of F) en volg de stenen naar beneden. Het zicht is maar een paar meter: blijf bij je buddy.';
  },
  conditions() {
    // je duikt alleen rond de kentering; soms trekt de stroming al aan
    const late = Math.random() < 0.3;
    const cur = new THREE.Vector3(0, 0, late ? (Math.random() < 0.5 ? 1 : -1) * 0.12 : 0);
    return {
      cur, curTxt: late ? 'kentering bijna voorbij: de stroming trekt aan' : 'kentering (stil water)',
      route: 'Daal af langs de stenen van de dijk. Op ± 7 m begint de slibbodem; volg je kompas naar het eerste pijlerpaar op ± 50 m en keer om bij 120 bar of als de stroming aantrekt.',
      ship: Math.random() < 0.12,
    };
  },
  brief: {
    photos: '<img src="img/oosterschelde/pijler.webp" alt="Een pijler vol zeeanjelieren en dodemansduimen"><img src="img/oosterschelde/bodem.webp" alt="De bodem van de Oosterschelde">',
    title: 'Zeelandbrug, Oosterschelde',
    name: 'de Zeelandbrug',
    grid: (curTxt) => '<div><small>Water</small>13 °C · zicht ± 4 m (groen)</div><div><small>Ingang</small>Kantduik vanaf de dijk bij de brug</div>' +
      '<div><small>Stroming</small>' + curTxt + '</div><div><small>Diepte</small>dijk 0–7 m · pijlers 14–20 m</div>',
    nightLead: '',
    rulesTitle: 'Afspraken voor de Oosterschelde',
    rules: ['We duiken alleen rond de kentering (stil water), volgens de getijtabel', 'Ik draag een pak dat warm genoeg is voor 13 °C, met capuchon en handschoenen', 'We blijven bij elkaar: bij slecht zicht hooguit een armlengte uit elkaar', 'Ik raak niets aan en neem niets mee (Nationaal Park Oosterschelde)'],
    rulesToast: 'Vink eerst de afspraken voor de Oosterschelde af.',
    blocked: '<h2>De stroming staat te hard</h2><p class="lead">Je bent te laat voor de kentering: het water stroomt alweer stevig langs de pijlers. Hier niet duiken. Wacht op de volgende kentering, ruim zes uur later.</p>',
    waitLabel: 'Wacht op de volgende kentering',
    waitHours: 6.2,
  },
};
