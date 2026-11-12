/* Diepblauw 3D — de duik bij de Zoutpier (Bonaire): vrij zwemmen in 3D met echte duikregels */
import * as THREE from 'three';
import { UW, makeCausticTexture, makeDome, makeSurface, makeRays, updateRays, makeParticles, makeBubbles, spawnBubbles, updateBubbles } from './water.js';
import { makeSeabed, makeReef, seabed, loadSandTextures } from './terrain.js';
import { loadModels } from './models.js';
import { makePier, pillarAt } from './pier.js';
import { Fauna, preloadFishPhotos, preloadFaunaModels } from './creatures3d.js';
import { buildDiver, animateDiver, preloadDivers } from './diver3d.js';
import { Deco, noFlyHours } from './deco.js';
import { Controls } from './controls.js';
import { Hud } from './hud.js';

const DG = window.DG;
const UI = DG.UI;
const esc = DG.U.esc;
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

// fysische constanten (kg = liter zeewater)
const TANK_L = 11.1;          // aluminium 80 (standaard op Bonaire)
const START_BAR = 207;        // 3000 psi
const AIR_KG_PER_L = 0.001225;
const SUIT0 = 3.2;            // 3 mm natpak: ±3,2 kg drijfvermogen aan de oppervlakte
const LEAD_REF = 10;          // jouw lood: 10 kg
const BASE = LEAD_REF + 50 * TANK_L * AIR_KG_PER_L - SUIT0 / 1.5; // neutraal op 5 m met 50 bar en lege trimvest
const BCD_CAP = 16;
const M_EFF = 135;

export function gameNow() { return Date.now() + ((DG.Save.data && DG.Save.data.clockOffset) || 0); }

/* ================================================================
 * Opstarten
 * ================================================================ */
export async function runZoutpier(site) {
  const sv = DG.Save.data;
  sv.set3d = Object.assign({ quality: matchMedia('(pointer: coarse)').matches ? 'midden' : 'hoog', ts: 2, assist: true, view: 'achter' }, sv.set3d || {});
  // vooraf: briefing, regels, instellingen en buddycheck
  const plan = await preDive(site);
  if (!plan) return null;
  const root = document.createElement('div');
  root.className = 'd3';
  document.body.classList.add('d3-on');
  root.innerHTML = '<canvas class="d3-canvas"></canvas><div class="d3-load"><div class="d3-spin"></div><p>Zoutpier laden…</p></div>';
  document.body.appendChild(root);
  const loadTxt = root.querySelector('.d3-load p');
  const canvas = root.querySelector('canvas');
  const q = sv.set3d.quality;
  const loading = async (t) => { loadTxt.textContent = t; await frame(); await frame(); };

  await loading('Water en licht…');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: q === 'hoog', powerPreference: 'high-performance' });
  const pr = q === 'hoog' ? Math.min(devicePixelRatio, 1.5) : q === 'midden' ? Math.min(devicePixelRatio, 1.1) : 0.75;
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0);
  const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 1500);
  UW.uCausTex.value = makeCausticTexture(q === 'laag' ? 128 : 256);
  UW.uCaus.value = q === 'laag' ? 0.7 : 1;
  scene.add(new THREE.HemisphereLight(0xd6f2ff, 0xa8977a, 1.9));
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.8);
  sun.position.set(30, 80, -40);
  scene.add(sun);
  const dome = makeDome(); scene.add(dome);
  const surf = makeSurface(); scene.add(surf);
  const rays = makeRays(q === 'laag' ? 14 : 28); scene.add(rays);
  const parts = makeParticles(q === 'laag' ? 700 : 1600); scene.add(parts);
  parts.material.uniforms.uPx.value = pr;
  const bubbles = makeBubbles(600); scene.add(bubbles);
  bubbles.material.uniforms.uPx.value = pr;

  await loading('Bodem en rif…');
  const [sandTex] = await Promise.all([loadSandTextures(), loadModels(['hersenkoraal', 'sterkoraal', 'buisspons', 'vaasspons', 'tonspons'])]);
  scene.add(makeSeabed(q, sandTex));
  await loading('De pijlers van de Zoutpier…');
  const pier = makePier(scene, q);
  const pTex = new THREE.TextureLoader().load(q === 'laag' ? 'img/tex-pijler-laag.jpg' : 'img/tex-pijler.jpg', (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1.2); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    pier.mesh.material.map = t; pier.mesh.material.bumpMap = t; pier.mesh.material.bumpScale = 1.6; pier.mesh.material.needsUpdate = true;
  });
  void pTex;
  makeReef(scene, q, pier.pillars);
  await loading('Vissen, tarpons en schildpadden…');
  await Promise.all([preloadFishPhotos(), preloadFaunaModels()]);
  const fauna = new Fauna(scene, q);
  fauna.placeFrogs(pier.pillars);

  await loading('Duikers…');
  await preloadDivers();
  const lo = DG.Save.loadout();
  const look = Object.assign({}, lo.look);
  const me = buildDiver({ model: 'duiker', suit: 0x16171a, bcd: 0x141518, accent: 0xf2c21a, fin: hex(look.fin, 0xf2c21a), tank: 0xc8cdd2, lamp: lo.lamp ? look.lamp || 'compact' : null, cam: lo.camera ? look.cam : null, reg: look.reg ? hex(look.reg) : null });
  const buddyM = buildDiver({ model: 'buddy', suit: 0x1b1d22, bcd: 0x1f2026, accent: 0xd8402a, fin: 0xe86aa0, tank: 0xc8cdd2, hair: 0x6a4a2a });
  scene.add(me); scene.add(buddyM);

  await loading('Klaar om te water te gaan');
  root.querySelector('.d3-load').remove();
  const ui = document.createElement('div');
  ui.className = 'd3-ui';
  root.appendChild(ui);
  const hud = new Hud(ui);

  /* ---------------- staat ---------------- */
  const deco = new Deco({ gfLo: 0.4, gfHi: 0.85, fN2: lo.gas === 'ean32' ? 0.68 : 0.79, tissues: plan.tissues });
  const D = {
    p: new THREE.Vector3(-3.5, -0.25, 8), v: new THREE.Vector3(),
    yaw: Math.PI / 2, pitch: 0, lookYaw: Math.PI / 2, lookPitch: -0.15,
    bcdN: 5, gas: START_BAR * TANK_L, lungPh: 0, holdT: 0,
    t: 0, gt: 0, maxD: 0, sumD: 0, lastEq: 0, ear: 0,
    stop: 0, stopDone: false, needStop: false, asc: 0, fastT: 0, fastCount: 0, inFast: false,
    ceilViol: 0, decoViol: false, wasDeco: false, limitViol: 0, inLimit: false,
    touches: 0, reefTouch: 0, touchCool: 0,
    spotted: {}, newSp: [], photos: [], prof: [[0, 0]], profT: 0,
    lamp: false, view: sv.set3d.view, ts: sv.set3d.ts, assist: sv.set3d.assist,
    buddy: { p: new THREE.Vector3(-4.5, -0.3, 10), v: new THREE.Vector3(), yaw: Math.PI / 2, br: 0 },
    sig: null, sigT: 0, nextOk: 240, nextAir: 600, missed: 0, warned: {}, sepT: 0, ooa: false,
    ndl: 999, ceil: 0, stopPlan: null, planT: 0, paused: false, ended: false, cur: plan.current,
  };
  const ctl = new Controls(ui, (a) => action(a), canvas);
  hud.setMask(D.view === 'bril');

  function hex(c, def) {
    if (typeof c === 'number') return c;
    if (typeof c === 'string' && c[0] === '#') return parseInt(c.slice(1), 16);
    return def != null ? def : 0x222222;
  }

  /* ---------------- acties ---------------- */
  function action(a) {
    if (D.ended) return;
    if (a === 'pause') return togglePause();
    if (D.paused) return;
    if (a === 'lamp') {
      if (!lo.lamp) return hud.msg('Je hebt geen lamp gehuurd. Die kun je huren bij De Tuimelaar.');
      D.lamp = !D.lamp; DG.Audio.click();
    } else if (a === 'view') {
      D.view = D.view === 'achter' ? 'bril' : 'achter';
      sv.set3d.view = D.view; hud.setMask(D.view === 'bril');
    } else if (a === 'equalize') {
      const depth = -D.p.y;
      if (depth - D.lastEq > 4.5) { hud.msg('Te laat: je oren gaan niet meer open. Stijg een stukje op en probeer opnieuw.'); }
      else { D.lastEq = depth; D.ear = 0; DG.Audio.click(); }
    } else if (a === 'photo') takePhoto();
    else if (a === 'ok' && D.sig === 'ok') { D.sig = null; ui.querySelector('.c3-ok').hidden = true; hud.msg('👌 Je geeft je buddy het OK-teken terug.', 2500); }
    else if (a === 'air' && D.sig === 'air') {
      D.sig = null; ui.querySelector('.c3-air').hidden = true;
      const bar = D.gas / TANK_L;
      hud.msg('Je laat ' + Math.round(bar) + ' bar zien. Buddy: ' + Math.round(Math.max(60, bar - 12 + Math.random() * 20)) + ' bar.', 3500);
    } else if (a === 'exit') {
      if (-D.p.y < 0.8 && D.gt > 60) finish(false);
    }
  }

  let resolveRun;
  const done = new Promise((r) => (resolveRun = r));

  function togglePause() {
    if (D.paused) { UI.closeModal(); D.paused = false; return; }
    D.paused = true;
    UI.modalKind = 'pause3d';
    const c = UI.modal('<h2>Pauze</h2><p class="lead">Je hangt stil in het water. Neem de tijd.</p>' +
      '<div class="modal-actions"><button class="btn ghost" data-a="abort">Duik afbreken</button><button class="btn primary" data-a="go">Verder duiken</button></div>', 'narrow');
    c.querySelector('[data-a=go]').onclick = () => { UI.closeModal(); D.paused = false; };
    c.querySelector('[data-a=abort]').onclick = () => { UI.closeModal(); cleanup(); resolveRun(null); };
  }

  /* ---------------- foto ---------------- */
  let wantPhoto = null;
  function takePhoto() {
    if (!lo.camera) return hud.msg('Je hebt geen camera gehuurd. Die kun je huren bij De Tuimelaar.');
    if (wantPhoto) return;
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    let best = null, bs = 0;
    for (const s of fauna.spottables()) {
      const to = s.p.clone().sub(camera.position);
      const d = to.length();
      if (d > lo.camera.bereik + s.L * 1.5 + 2) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, to.normalize().dot(fwd))));
      if (ang > 0.45) continue;
      const sc = (1 - ang / 0.45) * 0.5 + (1 - d / (lo.camera.bereik + 4)) * 0.5;
      if (sc > bs) { bs = sc; best = { s, d, ang }; }
    }
    wantPhoto = best || { none: true };
  }
  function capturePhoto() {
    const ph = wantPhoto; wantPhoto = null;
    const src = renderer.domElement;
    const w = src.width, h = src.height;
    const cw = Math.min(w, h * 4 / 3) * 0.7, ch = cw * 0.75;
    const c = document.createElement('canvas'); c.width = 320; c.height = 240;
    c.getContext('2d').drawImage(src, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, 320, 240);
    let stars = 1;
    if (!ph.none) {
      const ideal = Math.max(1, ph.s.L * 2);
      const q = 1 - Math.min(1, Math.abs(ph.d - ideal) / (ideal + 1));
      const light = lo.camera.flits ? 1 : D.lamp ? 0.85 : Math.max(0.3, 1 + D.p.y / 20);
      const sc = q * 0.45 + (1 - ph.ang / 0.45) * 0.25 + light * 0.3;
      stars = sc > 0.74 ? 3 : sc > 0.5 ? 2 : 1;
    }
    const photo = { sp: ph.none ? null : ph.s.spc.id, stars, url: c.toDataURL('image/jpeg', 0.75), site: 'saltpier', date: Date.now(), depth: Math.round(-D.p.y * 10) / 10 };
    D.photos.push(photo);
    DG.Audio.shutter(); if (lo.camera.flits) DG.Audio.strobe();
    flash.style.opacity = lo.camera.flits ? 0.85 : 0.5;
    setTimeout(() => (flash.style.opacity = 0), 90);
    UI.photoToast(photo, ph.none ? null : ph.s.spc);
  }
  const flash = document.createElement('div');
  flash.className = 'd3-flash';
  root.appendChild(flash);

  /* ---------------- hulpfuncties ---------------- */
  const tmpV = new THREE.Vector3();
  let nearP = [], nearT = 0;
  function updateNear() {
    nearP = pier.pillars.filter((pl) => Math.abs(pl.x - D.p.x) < 14 && Math.abs(pl.z - D.p.z) < 14);
  }
  function inShadow(x, z) { return (x > -122 && x < -3 && Math.abs(z) < 2.6) || (Math.abs(x + 120) < 9 && Math.abs(z) < 7); }
  const fwdOf = (yaw, pitch) => new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));

  /* ---------------- hoofdlus ---------------- */
  let last = performance.now();
  let hudT = 0, spotT = 0, breathOut = false;
  function loop(now) {
    if (D.ended) return;
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!D.paused) step(dt);
    render(dt);
  }

  function step(dt) {
    D.t += dt;
    UW.uTime.value = D.t;
    const inp = D.ooa ? { fwd: 0, side: 0, turn: 0, lookX: 0, lookY: 0, bcdIn: false, bcdOut: false, breath: false, exhale: false, hard: false } : D.forceInp || ctl.read();
    // kijken
    D.lookYaw -= inp.lookX * 0.0045 + inp.turn * dt * 1.3;
    D.lookPitch = Math.max(-1.35, Math.min(1.35, D.lookPitch - inp.lookY * 0.0038));
    // lichaam volgt kijkrichting; trimt horizontaal als je niet zwemt
    let dy = D.lookYaw - D.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    D.yaw += dy * Math.min(1, dt * 3);
    const swimming = Math.abs(inp.fwd) > 0.1;
    const tp = swimming ? Math.max(-1.2, Math.min(1.2, D.lookPitch)) * Math.sign(inp.fwd) : 0;
    D.pitch += (tp - D.pitch) * Math.min(1, dt * (swimming ? 2 : 0.9));

    const depth = Math.max(0, -D.p.y);
    const amb = 1 + depth / 10;
    const gdt = dt * D.ts;
    // trimvest
    let bcdVol = Math.min(BCD_CAP, D.bcdN / amb);
    if (inp.bcdIn && D.gas > 0) { const dn = 1.3 * amb * dt; D.bcdN += dn; D.gas -= dn; }
    if (inp.bcdOut) D.bcdN = Math.max(0, D.bcdN - 3.2 * amb * dt);
    if (D.bcdN / amb > BCD_CAP) D.bcdN = BCD_CAP * amb; // overdrukventiel
    // ademhaling (longvolume rond het gemiddelde)
    D.lungPh += dt / 4.6;
    const holding = inp.breath;
    let lungs = holding ? 1.6 : inp.exhale ? -1.0 : Math.sin(D.lungPh * Math.PI * 2) * 0.55;
    D.holdT = holding ? D.holdT + dt : 0;
    // trimhulp: houdt je ongeveer neutraal
    const air = (D.gas / TANK_L) * TANK_L * AIR_KG_PER_L;
    bcdVol = Math.min(BCD_CAP, D.bcdN / amb);
    const suit = SUIT0 / amb;
    let net = BASE + suit + bcdVol + lungs - LEAD_REF - air;
    if (D.assist && !inp.bcdIn && !inp.bcdOut && depth > 1.2 && !D.ooa) {
      const want = bcdVol - (net - lungs) - D.v.y * 2.5;
      const dv = Math.max(-0.9 * dt, Math.min(0.9 * dt, want - bcdVol));
      const dn = dv * amb;
      if (dn > 0) { D.bcdN += dn; D.gas -= dn; } else D.bcdN = Math.max(0, D.bcdN + dn);
      bcdVol = Math.min(BCD_CAP, D.bcdN / amb);
      net = BASE + suit + bcdVol + lungs - LEAD_REF - air;
    }
    D.net = net - lungs;
    // krachten
    const f = fwdOf(D.yaw, D.pitch);
    const r = new THREE.Vector3(Math.cos(D.yaw), 0, -Math.sin(D.yaw));
    const speedK = lo.speed;
    const thrust = (inp.hard ? 34 : 18) * speedK;
    const F = new THREE.Vector3();
    F.addScaledVector(f, inp.fwd * thrust);
    F.addScaledVector(r, inp.side * thrust * 0.35);
    F.y += net * 9.81;
    // oorpijn remt het afdalen
    if (D.ear > 1) F.y += 22;
    if (D.ooa) { F.set(0, 0, 0); D.v.y = Math.min(D.v.y + dt * 0.3, 0.15); }
    // weerstand t.o.v. het water (met stroming)
    const vr = D.v.clone().sub(D.cur);
    const along = f.clone().multiplyScalar(vr.dot(f));
    const across = vr.clone().sub(along);
    F.addScaledVector(along, -55 * along.length());
    F.addScaledVector(across, -150 * across.length());
    D.v.addScaledVector(F, dt / M_EFF);
    D.p.addScaledVector(D.v, dt);
    // oppervlak: drijven met het hoofd boven water
    if (D.p.y > -0.25) { D.p.y = -0.25; if (D.v.y > 0) D.v.y = 0; }
    // bodem
    const fl = seabed(D.p.x, D.p.z) + 0.34;
    D.touchCool -= dt;
    if (D.p.y < fl) {
      const hit = -D.v.y;
      D.p.y = fl; if (D.v.y < 0) D.v.y = 0;
      if (hit > 0.12 && D.touchCool <= 0) {
        D.touchCool = 3;
        if (D.p.x < -136) { D.reefTouch++; hud.msg('Pas op: je raakt het rif! In het Bonaire Marine Park mag je niets aanraken.'); }
        else hud.msg('Je raakt de bodem en het zand dwarrelt op. Trim iets bij.', 2500);
      }
    }
    // pijlers
    nearT -= dt; if (nearT <= 0) { nearT = 0.4; updateNear(); }
    for (const pl of nearP) {
      const a = pillarAt(pl, D.p.y);
      const dx = D.p.x - a.x, dz = D.p.z - a.z, d = Math.hypot(dx, dz);
      const minD = 0.62 + 0.38;
      if (d < minD && D.p.y < pl.y0 + 20) {
        D.p.x = a.x + (dx / d) * minD; D.p.z = a.z + (dz / d) * minD;
        if (D.touchCool <= 0 && D.v.length() > 0.08) { D.touchCool = 3; D.touches++; hud.msg('Je raakt een pijler. Niets aanraken: het leven op de pijlers is kwetsbaar.', 3000); }
      }
    }
    // gebied begrenzen
    D.p.x = Math.max(-260, Math.min(2, D.p.x)); D.p.z = Math.max(-140, Math.min(140, D.p.z));

    /* ---- duikcomputer ---- */
    const dNow = Math.max(0, -D.p.y - 0.0);
    const started = dNow > 1.2 || D.gt > 0;
    if (started) {
      D.gt += gdt;
      deco.step(dNow, gdt / 60);
      D.maxD = Math.max(D.maxD, dNow);
      D.sumD += dNow * gdt;
      D.profT += gdt;
      if (D.profT > 20) { D.profT = 0; D.prof.push([D.gt / 60, dNow]); }
      // luchtverbruik
      const effort = Math.min(1, Math.abs(inp.fwd) * (inp.hard ? 1 : 0.55) + Math.abs(inp.side) * 0.3);
      const sac = (13 + effort * 15 + (D.alarm ? 4 : 0)) * lo.sac;
      D.gas -= (sac * amb * gdt) / 60;
      if (D.gas < 0) D.gas = 0;
    }
    // ademhaling: bellen en geluid
    const ph = D.lungPh % 1;
    if (!holding && ph > 0.55 && !breathOut) { breathOut = true; if (dNow > 0.7) { const mp = me.userData.mouth.getWorldPosition(tmpV); spawnBubbles(bubbles, mp.x, mp.y, mp.z, 12, false); DG.Audio.breathOut(0.8); } }
    if (ph < 0.55 && breathOut) { breathOut = false; if (dNow > 0.7) DG.Audio.breathIn(0.8); }
    if (D.holdT > 3 && D.v.y > 0.05 && !D.warned.hold) { D.warned.hold = 1; hud.msg('Nooit je adem inhouden tijdens het opstijgen: je longen zetten uit. Adem rustig door!', 5000); }
    // klaren
    if (dNow < D.lastEq) D.lastEq = dNow;
    D.ear = Math.max(0, (dNow - D.lastEq - 1.2) / 1.4);
    if (D.ear > 0.3 && !D.warned.ear) { D.warned.ear = 1; hud.msg('Je voelt druk op je oren. Klaar ze (👂 of K).', 3500); }
    if (D.ear < 0.1) D.warned.ear = 0;
    // opstijgsnelheid (echte meters per minuut)
    D.asc += ((D.v.y * 60) - D.asc) * Math.min(1, dt * 3);
    if (D.asc > 10 && dNow > 1) {
      D.fastT += dt;
      if (D.fastT > 0.8 && !D.inFast) { D.inFast = true; D.fastCount++; DG.Audio.alarm(); }
    } else { D.fastT = 0; D.inFast = false; }
    // nultijd, plafond, stops
    D.planT -= dt;
    if (D.planT <= 0) {
      D.planT = 0.5;
      D.ndl = Math.min(999, deco.ndl(dNow));
      D.ceil = deco.currentCeiling();
      D.stopPlan = D.ceil > 0.05 ? deco.plan(dNow) : null;
    }
    const inDeco = D.ceil > 0.05;
    if (inDeco && !D.wasDeco) { D.wasDeco = true; DG.Audio.alarm(); hud.msg('Nultijd voorbij: je hebt een verplichte decompressiestop. Volg de computer.', 5000); }
    if (inDeco && dNow < D.ceil - 0.5) { if (!D.warned.ceil) { D.warned.ceil = 1; D.ceilViol++; DG.Audio.alarm(); } } else D.warned.ceil = 0;
    if (D.maxD > 10) D.needStop = true;
    if (D.needStop && !D.stopDone && dNow >= 2.8 && dNow <= 6.2 && !inDeco) {
      D.stop += gdt;
      if (D.stop >= 180) { D.stopDone = true; DG.Audio.spot(); hud.msg('Veiligheidsstop voltooid. Rustig verder opstijgen.', 3500); }
    }
    // brevetgrens en dieptroes
    const limit = DG.Save.maxDepth();
    if (dNow > limit + 0.5) { if (!D.inLimit) { D.inLimit = true; D.limitViol++; hud.msg('Je buddy wijst omhoog: dieper dan je brevet (' + limit + ' m). Stijg op!', 4500); } } else if (dNow < limit - 1) D.inLimit = false;
    // gas
    const bar = D.gas / TANK_L;
    if (bar < 100 && !D.warned.b100) { D.warned.b100 = 1; hud.msg('Halve fles (100 bar): je buddy geeft het teken om om te keren.', 4500); }
    if (bar < 70 && !D.warned.b70) { D.warned.b70 = 1; hud.msg('70 bar: tijd om rustig naar de oppervlakte te gaan.', 4500); }
    if (bar < 50 && !D.warned.b50) { D.warned.b50 = 1; DG.Audio.alarm(); hud.msg('Reserve (50 bar)! Opstijgen, met veiligheidsstop.', 5000); }
    if (D.gas <= 0 && !D.ooa) { D.ooa = true; DG.Audio.alarm(); hud.msg('Lucht op! Je buddy geeft je zijn octopus. Samen rustig opstijgen.', 7000); }
    if (D.ooa && dNow < 0.8) return finish(true);
    // oppervlakte
    if (dNow < 0.8 && D.gt > 60) {
      if (D.needStop && !D.stopDone) D.skipStop = true;
      if (inDeco) D.decoViol = true;
    }
    ui.querySelector('.c3-exit').hidden = !(dNow < 0.8 && D.gt > 60);
    D.alarm = D.inFast ? 'LANGZAMER OMHOOG' : inDeco && dNow < D.ceil - 0.5 ? 'PLAFOND!' : D.ooa ? 'LUCHT OP' : bar < 50 ? 'RESERVE' : D.ear > 1 ? 'KLAREN!' : dNow > limit + 0.5 ? 'TE DIEP' : '';

    /* ---- buddy ---- */
    updateBuddy(dt, f, r);

    /* ---- dieren ---- */
    const env = { diver: D.p, nearPillars: nearP };
    fauna.update(dt, env, D.t);
    spotT -= dt;
    if (spotT <= 0) { spotT = 0.25; checkSpots(); }

    /* ---- lamp ---- */
    UW.uLampOn.value = D.lamp ? 1 : 0;
    if (D.lamp) {
      const tip = D.view === 'bril' ? me.userData.head : me.userData.lampTip || me.userData.mouth;
      tip.getWorldPosition(UW.uLampPos.value);
      if (D.view === 'bril') UW.uLampPos.value.y -= 0.25;
      const lf = D.view === 'bril' ? fwdOf(D.lookYaw, D.lookPitch) : fwdOf(D.yaw, D.pitch);
      UW.uLampDir.value.copy(lf);
      UW.uLampRange.value = lo.lamp.bereik;
      UW.uLampCos.value = Math.cos(lo.lamp.hoek);
    }

    // HUD
    hudT -= dt;
    if (hudT <= 0) {
      hudT = 0.1;
      const heading = (Math.atan2(-Math.sin(D.lookYaw), -Math.cos(D.lookYaw)) * 180) / Math.PI;
      const sp = D.stopPlan && D.stopPlan.stops[0];
      hud.update({
        depth: dNow, time: D.gt, bar, temp: 28, maxD: D.maxD, heading,
        ndl: D.ndl, deco: inDeco, ceil: sp ? sp.depth : D.ceil, stopMin: sp ? sp.min : 0,
        stop: D.needStop && !D.stopDone && !inDeco && dNow < 7.5 ? 180 - D.stop : 0,
        asc: Math.max(0, D.asc), alert: D.alarm,
        bcdFrac: Math.min(1, D.bcdN / amb / BCD_CAP), net: D.net, ear: D.ear,
        ts: D.ts, assist: D.assist, spot: Object.keys(D.spotted).length, photos: D.photos.length,
      });
      root.style.setProperty('--narc', String(Math.max(0, Math.min(1, (dNow - 28) / 12))));
    }

    /* ---- model van de speler ---- */
    me.position.copy(D.p);
    me.rotation.order = 'YXZ';
    me.rotation.set(D.pitch, D.yaw, -dy * 0.25);
    animateDiver(me, dt, Math.min(1, Math.abs(inp.fwd) * (inp.hard ? 1 : 0.6) + Math.abs(inp.side) * 0.3), D.view === 'bril');
    me.visible = D.view !== 'bril';
  }

  function updateBuddy(dt, f, r) {
    const b = D.buddy;
    const target = D.p.clone().addScaledVector(r, 2.2).addScaledVector(f.clone().setY(0).normalize(), -0.8);
    target.y = Math.min(-0.3, D.p.y + 0.2);
    const to = target.sub(b.p);
    const dist = b.p.distanceTo(D.p);
    const maxV = dist > 8 ? 1.2 : 0.7;
    const want = to.clone().multiplyScalar(0.8);
    if (want.length() > maxV) want.setLength(maxV);
    b.v.lerp(want, Math.min(1, dt * 1.5));
    for (const pl of nearP) {
      const a = pillarAt(pl, b.p.y);
      const dx = b.p.x - a.x, dz = b.p.z - a.z, d = Math.hypot(dx, dz);
      if (d < 1.1 && d > 0.01) { b.v.x += (dx / d) * dt * 3; b.v.z += (dz / d) * dt * 3; }
    }
    b.p.addScaledVector(b.v, dt);
    const fl = seabed(b.p.x, b.p.z) + 0.4;
    if (b.p.y < fl) b.p.y = fl;
    if (b.p.y > -0.3) b.p.y = -0.3;
    const hv = Math.hypot(b.v.x, b.v.z);
    if (hv > 0.05) b.yaw = Math.atan2(-b.v.x, -b.v.z);
    else { let d2 = D.yaw - b.yaw; while (d2 > Math.PI) d2 -= Math.PI * 2; while (d2 < -Math.PI) d2 += Math.PI * 2; b.yaw += d2 * dt; }
    buddyM.position.copy(b.p);
    buddyM.rotation.order = 'YXZ';
    buddyM.rotation.set(Math.max(-0.6, Math.min(0.6, b.v.y * 1.2)), b.yaw, 0);
    animateDiver(buddyM, dt, Math.min(1, b.v.length() * 1.4), false);
    b.br += dt / 4.3;
    if (b.br > 1) { b.br -= 1; if (b.p.y < -0.7) { const mp = buddyM.userData.mouth.getWorldPosition(tmpV); spawnBubbles(bubbles, mp.x, mp.y, mp.z, 10, false); } }
    // signalen
    if (D.gt > D.nextOk && !D.sig && -D.p.y > 2) { D.sig = 'ok'; D.sigT = 0; D.nextOk = D.gt + 300; ui.querySelector('.c3-ok').hidden = false; hud.msg('Je buddy vraagt met een teken: alles OK? (👌 of O)', 4000); }
    if (D.gt > D.nextAir && !D.sig && -D.p.y > 2) { D.sig = 'air'; D.sigT = 0; D.nextAir = D.gt + 600; ui.querySelector('.c3-air').hidden = false; hud.msg('Je buddy vraagt: hoeveel lucht heb je nog?', 4000); }
    if (D.sig) {
      D.sigT += dt;
      if (D.sigT > 14) { D.missed++; D.sig = null; ui.querySelector('.c3-ok').hidden = true; ui.querySelector('.c3-air').hidden = true; hud.msg('Je reageerde niet op je buddy. Hij komt dichterbij kijken.', 3500); }
    }
    // buddy kwijt?
    if (dist > 12) { D.sepT += dt; if (D.sepT > 1 && !D.warned.sep) { D.warned.sep = 1; hud.msg('Blijf bij je buddy! Hij is ' + Math.round(dist) + ' m van je af.', 3500); } }
    else { D.sepT = 0; D.warned.sep = 0; }
  }

  function checkSpots() {
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const eye = D.view === 'bril' ? camera.position : D.p;
    for (const s of fauna.spottables()) {
      if (D.spotted[s.spc.id]) continue;
      const to = s.p.clone().sub(eye);
      const d = to.length();
      let ok;
      if (s.hidden) {
        let lit = false;
        if (D.lamp) { const lf = UW.uLampDir.value; const lt = s.p.clone().sub(UW.uLampPos.value); lit = lt.length() < lo.lamp.bereik * 0.85 && lt.normalize().dot(lf) > Math.cos(lo.lamp.hoek + 0.05); }
        ok = d < 1.7 || lit;
        if (!ok && d < 3.5 && !D.warned['h' + s.spc.id]) { D.warned['h' + s.spc.id] = 1; hud.msg('Je buddy wijst naar iets op de pijler… zwem dichterbij' + (lo.lamp ? ' of gebruik je lamp.' : '.'), 4000); }
      } else {
        ok = d < Math.min(40, 3 + s.L * 8) && to.normalize().dot(fwd) > 0.55;
      }
      if (ok) {
        D.spotted[s.spc.id] = true;
        const isNew = !sv.species[s.spc.id];
        if (isNew) { sv.species[s.spc.id] = { seen: true, photo: false, site: 'saltpier', date: Date.now() }; D.newSp.push(s.spc.id); DG.Audio.newSpecies(); }
        else DG.Audio.spot();
        UI.spotToast(s.spc, isNew, true);
      }
    }
  }

  /* ---------------- tekenen ---------------- */
  const camPos = new THREE.Vector3().copy(D.p).add(new THREE.Vector3(3, 0.8, 0));
  function render(dt) {
    const lf = fwdOf(D.lookYaw, D.lookPitch);
    if (D.view === 'bril') {
      const head = me.userData.head.getWorldPosition(tmpV);
      camera.position.copy(head).addScaledVector(lf, 0.12);
      camera.rotation.order = 'YXZ';
      camera.rotation.set(D.lookPitch, D.lookYaw, 0);
      camPos.copy(camera.position);
    } else {
      const want = D.p.clone().addScaledVector(lf, -3.6).add(new THREE.Vector3(0, 1.5, 0));
      const fl = seabed(want.x, want.z) + 0.35;
      if (want.y < fl) want.y = fl;
      camPos.lerp(want, Math.min(1, dt * 6));
      camera.position.copy(camPos);
      camera.lookAt(D.p.clone().addScaledVector(lf, 1.6).add(new THREE.Vector3(0, 0.25, 0)));
    }
    dome.position.copy(camera.position);
    surf.position.set(camera.position.x, 0, camera.position.z);
    updateRays(rays, camera, D.t, inShadow);
    updateBubbles(bubbles, dt);
    renderer.render(scene, camera);
    if (wantPhoto) capturePhoto();
  }

  function onResize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  function cleanup() {
    D.ended = true;
    DG.Audio.ambience(false);
    ctl.destroy();
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    root.remove();
    document.body.classList.remove('d3-on');
  }

  /* ---------------- einde van de duik ---------------- */
  function finish(ooa) {
    if (D.ended) return;
    const minutes = D.gt / 60;
    const bar = Math.round(D.gas / TANK_L);
    const lines = [];
    const xp = [];
    xp.push(['Duik gelogd', 1]);
    if (D.newSp.length) xp.push(['Nieuwe soorten', D.newSp.length]);
    const res = {
      site: 'saltpier', date: Date.now(), minutes, maxD: D.maxD, avgD: D.gt > 0 ? D.sumD / D.gt : 0, temp: 28, bar,
      species: Object.keys(D.spotted), newSpecies: D.newSp.slice(), photos: D.photos, needStop: D.needStop, safetyDone: D.stopDone,
      ascentWarnings: D.fastCount, ooa: !!ooa, decoViolation: D.decoViol || D.ceilViol > 0, cold: 0, gas: lo.gas, tankL: TANK_L,
      profile: D.prof.concat([[minutes, 0]]), lines, earned: 0, xp, three: true,
      rules: { touches: D.touches, reef: D.reefTouch, missed: D.missed, limit: D.limitViol, deco: D.wasDeco, ceil: D.ceilViol },
    };
    // opslaan: logboek, foto's, restverzadiging, vliegverbod
    const prof = res.profile;
    const stp = Math.max(1, Math.ceil(prof.length / 70));
    sv.dives.push({
      nr: sv.dives.length + 1, site: 'saltpier', date: res.date, minutes: Math.round(minutes), maxD: Math.round(res.maxD * 10) / 10,
      avgD: Math.round(res.avgD * 10) / 10, temp: 28, species: res.species, newSpecies: res.newSpecies, photos: res.photos.length, earned: 0,
      safetyDone: res.safetyDone, needStop: res.needStop, ascentWarnings: res.ascentWarnings, ooa: res.ooa, bar, gas: res.gas,
      profile: prof.filter((p, i) => i % stp === 0 || i === prof.length - 1).map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]),
      three: true, rules: res.rules,
    });
    res.photos.forEach((p) => { sv.photos.push(p); if (p.sp && sv.species[p.sp]) sv.species[p.sp].photo = true; });
    if (sv.photos.length > 40) sv.photos = sv.photos.slice(-40);
    const nowG = gameNow();
    const recent = (sv.decoLog || []).filter((x) => nowG - x.end < 24 * 3600e3);
    recent.push({ end: nowG, deco: D.wasDeco });
    sv.decoLog = recent;
    sv.tissues = { t: deco.snapshot().tissues, end: nowG };
    sv.noFlyUntil = nowG + noFlyHours(recent) * 3600e3;
    DG.Save.save();
    cleanup();
    resolveRun(res);
  }

  DG.Audio.ambience(true);
  DG.Audio.splash();
  hud.msg(D.cur.length() > 0.01 ? 'Je ligt aan de oppervlakte bij de gele steen. Er staat lichte stroming: ' + plan.curTxt + '. Laat lucht uit je vest (▼ of F) om af te dalen.' : 'Je ligt aan de oppervlakte bij de gele steen. Laat lucht uit je trimvest (▼ of F) om af te dalen, en vergeet niet te klaren.', 7000);
  updateNear();
  requestAnimationFrame((t) => { last = t; loop(t); });
  // testhaakje: simulatie vooruitspoelen zonder beeld
  window.__d3 = {
    D, deco, camera, scene, renderer, action, fauna, camPos,
    sim(sec, inp) {
      D.forceInp = Object.assign({ fwd: 0, side: 0, turn: 0, lookX: 0, lookY: 0, bcdIn: false, bcdOut: false, breath: false, exhale: false, hard: false }, inp || {});
      for (let t = 0; t < sec && !D.ended; t += 0.05) step(0.05);
      D.forceInp = null;
    },
  };
  return done;
}

/* ================================================================
 * Voor de duik: briefing (met jouw foto's), regels, instellingen, buddycheck
 * ================================================================ */
function ask(html, cls, bind) {
  return new Promise((resolve) => {
    UI.modalKind = 'brief3d';
    const c = UI.modal(html, cls);
    bind(c, (v) => { UI.closeModal(); resolve(v); });
  });
}

async function preDive(site) {
  const sv = DG.Save.data;
  const nowG = gameNow();
  // restverzadiging na eerdere duiken
  let tissues = null, siTxt = 'Eerste duik: je weefsels zijn verzadigd op oppervlakteniveau.';
  if (sv.tissues && sv.tissues.end) {
    const min = (nowG - sv.tissues.end) / 60000;
    if (min < 24 * 60) {
      const d = new Deco({ tissues: sv.tissues.t });
      d.surface(min);
      tissues = d.t;
      const h = Math.floor(min / 60), m = Math.round(min % 60);
      siTxt = 'Oppervlakte-interval ' + h + ' u ' + m + ' min: je hebt nog restverzadiging, dus je nultijden zijn korter.';
    }
  }
  // stroming vandaag
  const r = Math.random();
  const cur = new THREE.Vector3(0, 0, 0);
  let curTxt = 'geen';
  if (r > 0.45) { const s = r > 0.75 ? 1 : -1; cur.z = s * (0.05 + Math.random() * 0.1); curTxt = s > 0 ? 'van zuid naar noord' : 'van noord naar zuid'; }
  const route = cur.z > 0.01 ? 'Begin tegen de stroom in aan de linkerkant (zuid) en laat je terugdrijven langs de rechterkant.'
    : cur.z < -0.01 ? 'Begin tegen de stroom in aan de rechterkant (noord) en laat je terugdrijven langs de linkerkant.'
    : 'Geen stroming: zwem langs de pier naar de laadkop (tarpons) en daarna links of rechts langs de pijlergroepen.';
  const ship = Math.random() < 0.1;
  const s3 = sv.set3d;
  // 1. briefing
  const go = await ask(
    '<div class="b3-photos"><img src="img/bonaire-zoutpier-lucht.jpg" alt="Luchtfoto van de Zoutpier"><img src="img/bonaire-zoutpier-steen.jpg" alt="De gele steen Salt Pier"><img src="img/bonaire-zoutpier-knorvissen.jpg" alt="Knorvissen tussen de pijlers"></div>' +
    '<h2>Briefing · Zoutpier, Bonaire</h2>' +
    '<div class="brief-grid">' +
    '<div><small>Water</small>28 °C · zicht ±50 m</div><div><small>Ingang</small>Kantduik bij de gele steen</div>' +
    '<div><small>Stroming vandaag</small>' + curTxt + '</div><div><small>Diepte</small>pier 3–12 m · rif tot 40 m</div>' +
    '<div><small>Jouw grens</small>' + DG.Save.maxDepth() + ' m (' + esc(DG.Save.brevet()) + ')</div><div><small>Fles</small>aluminium 80 · 207 bar · ' + (DG.Save.loadout().gas === 'ean32' ? 'nitrox 32%' : 'lucht') + '</div>' +
    '</div>' +
    '<p class="lead">' + esc(route) + ' ' + esc(siTxt) + '</p>' +
    '<h3>Regels van het Bonaire Marine Park</h3><ul class="b3-rules">' +
    '<li><label><input type="checkbox" required> Ik heb een geldige natuurtag (STINAPA)</label></li>' +
    '<li><label><input type="checkbox" required> Ik duik zonder handschoenen en raak niets aan</label></li>' +
    '<li><label><input type="checkbox" required> Ik heb gecontroleerd dat er geen schip aan de pier ligt</label></li>' +
    '</ul>' +
    '<div class="modal-actions"><button class="btn ghost" data-a="back">Terug</button><button class="btn primary" data-a="go">Verder</button></div>',
    '', (c, done) => {
      c.querySelector('[data-a=back]').onclick = () => done(false);
      c.querySelector('[data-a=go]').onclick = () => {
        const all = [...c.querySelectorAll('.b3-rules input')].every((i) => i.checked);
        if (!all) { DG.UI.toast('Vink eerst de regels van het marine park af.', 'warn'); return; }
        done(true);
      };
    });
  if (!go) return null;
  if (ship) {
    const again = await ask('<h2>Er ligt een schip aan de pier</h2><p class="lead">Een zoutschip ligt aan de laadkop. Dan mag je bij de Zoutpier niet duiken. Kom later terug.</p><div class="modal-actions"><button class="btn ghost" data-a="map">Naar de kaart</button><button class="btn primary" data-a="wait">Morgen terugkomen</button></div>', 'narrow', (c, done) => {
      c.querySelector('[data-a=map]').onclick = () => done(false);
      c.querySelector('[data-a=wait]').onclick = () => { sv.clockOffset = (sv.clockOffset || 0) + 20 * 3600e3; DG.Save.save(); done(true); };
    });
    if (!again) return null;
    return preDive(site);
  }
  // 2. instellingen
  const ok2 = await ask(
    '<h2>Hoe wil je duiken?</h2>' +
    '<div class="b3-set"><b>Duiktijd</b><span class="seg" data-k="ts"><button data-v="1">Echt ×1</button><button data-v="2">×2</button><button data-v="4">×4</button></span><small>Klok, lucht en stikstof lopen sneller; jij zwemt op normale snelheid.</small></div>' +
    '<div class="b3-set"><b>Trimhulp</b><span class="seg" data-k="assist"><button data-v="1">Aan</button><button data-v="0">Uit</button></span><small>Uit = zelf trimmen met trimvest (▲▼ / R F) en ademhaling (🫁 / B).</small></div>' +
    '<div class="b3-set"><b>Zicht</b><span class="seg" data-k="view"><button data-v="achter">Achter de duiker</button><button data-v="bril">Door je duikbril</button></span></div>' +
    '<div class="b3-set"><b>Beeldkwaliteit</b><span class="seg" data-k="quality"><button data-v="laag">Laag</button><button data-v="midden">Midden</button><button data-v="hoog">Hoog</button></span><small>Kies laag als het schokt op je telefoon.</small></div>' +
    '<div class="modal-actions"><button class="btn primary" data-a="go">Naar de buddycheck</button></div>',
    '', (c, done) => {
      const cur = { ts: String(s3.ts), assist: s3.assist ? '1' : '0', view: s3.view, quality: s3.quality };
      c.querySelectorAll('.seg').forEach((seg) => {
        const k = seg.dataset.k;
        const sync = () => seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === cur[k]));
        seg.querySelectorAll('button').forEach((b) => (b.onclick = () => { cur[k] = b.dataset.v; sync(); }));
        sync();
      });
      c.querySelector('[data-a=go]').onclick = () => {
        s3.ts = +cur.ts; s3.assist = cur.assist === '1'; s3.view = cur.view; s3.quality = cur.quality;
        DG.Save.save(); done(true);
      };
    });
  if (!ok2) return null;
  // 3. buddycheck (BWRAF)
  const items = [
    ['B', 'Trimvest', 'Inblazer en leeglaatventielen werken. Trimvest kort opgeblazen en weer leeg.'],
    ['W', 'Lood', '10 kg aan de loodgordel, snelsluiting vrij en met de rechterhand te openen.'],
    ['R', 'Sluitingen', 'Schouder- en buikbanden dicht, fles zit vast, slangen goed geborgen.'],
    ['A', 'Lucht', 'Fles helemaal open, manometer 207 bar, drie keer proefademen op ademautomaat en octopus.'],
    ['F', 'Laatste check', 'Masker, vinnen, computer aan (Bühlmann GF 40/85), duikplan afgesproken. OK!'],
  ];
  const ok3 = await ask(
    '<h2>Buddycheck</h2><p class="lead">Loop samen met je buddy de check door. Tik elk onderdeel aan.</p><div class="b3-check">' +
    items.map((it, i) => '<button class="b3-ci" data-i="' + i + '"><b>' + it[0] + '</b><span><strong>' + it[1] + '</strong><small>' + it[2] + '</small></span><i>○</i></button>').join('') +
    '</div><div class="modal-actions"><button class="btn primary big" data-a="go" disabled>Te water! 🤿</button></div>',
    '', (c, done) => {
      const set = new Set();
      c.querySelectorAll('.b3-ci').forEach((b) => (b.onclick = () => {
        set.add(b.dataset.i); b.classList.add('ok'); b.querySelector('i').textContent = '✓'; DG.Audio.click();
        c.querySelector('[data-a=go]').disabled = set.size < items.length;
      }));
      c.querySelector('[data-a=go]').onclick = () => done(true);
    });
  if (!ok3) return null;
  return { tissues, current: cur, curTxt };
}
