/* Diepblauw 3D — de duik bij de Zoutpier (Bonaire): vrij zwemmen in 3D met echte duikregels */
import * as THREE from 'three';
import { UW, makeCausticTexture, makeDome, makeSurface, makeRays, updateRays, makeParticles, makeBubbles, spawnBubbles, updateBubbles, makeBeam, updateBeam, makeBio, spawnBio, updateBio, makeGlows } from './water.js';
import { makeSeabed, makeReef, makePillarGrowth, seabed, loadSandTextures } from './terrain.js';
import { loadModels } from './models.js';
import { makePier, pillarAt } from './pier.js';
import { Fauna, preloadFishPhotos, preloadFaunaModels } from './creatures3d.js';
import { buildDiver, animateDiver, preloadDivers } from './diver3d.js';
import { Deco, noFlyHours } from './deco.js';
import { Controls } from './controls.js';
import { Hud } from './hud.js';
import { Sound3D } from './sound3d.js';
import { gradePhoto, checkChallenges } from './photo.js';
import { BlobShadows } from './shadows.js';

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
  const night = !!plan.night;
  UW.uCausTex.value = makeCausticTexture(q === 'laag' ? 128 : 256);
  UW.uCaus.value = night ? 0 : q === 'laag' ? 0.7 : 1;
  // nacht: alleen maanlicht en lampen; het water zelf is bijna zwart
  UW.uNight.value = night ? 1 : 0;
  UW.uWaterTop.value.set(night ? 0x0a1824 : 0x6fe0f6);
  UW.uWaterDeep.value.set(night ? 0x010409 : 0x0d5596);
  UW.uLampPower.value = night ? 2.3 : 1.6;
  UW.uLampOn.value = 0; UW.uLamp2On.value = 0;
  renderer.toneMappingExposure = night ? 1.5 : 1.28;
  scene.add(night ? new THREE.HemisphereLight(0x5b7bb0, 0x1a1a22, 0.1) : new THREE.HemisphereLight(0xd6f2ff, 0xa8977a, 1.9));
  const sun = night ? new THREE.DirectionalLight(0x9fb4e0, 0.18) : new THREE.DirectionalLight(0xfff2dc, 2.8);
  sun.position.set(30, 80, -40);
  scene.add(sun);
  const dome = makeDome(); scene.add(dome);
  const surf = makeSurface(); scene.add(surf);
  const rays = makeRays(q === 'laag' ? 14 : 28); scene.add(rays);
  rays.visible = !night;
  const parts = makeParticles(q === 'laag' ? 700 : 1600); scene.add(parts);
  parts.material.uniforms.uPx.value = pr;
  const bubbles = makeBubbles(600); scene.add(bubbles);
  const shadows = new BlobShadows(scene, q === 'laag' ? 300 : 700);
  shadows.mesh.visible = !night;
  bubbles.material.uniforms.uPx.value = pr;
  // nacht: lichtbundels van beide lampen, lichtgevend plankton en lichtjes op de flessen
  const beam = makeBeam(0xfff1d8), beam2 = makeBeam(0xf4f6ff);
  scene.add(beam); scene.add(beam2);
  const bio = makeBio(q === 'laag' ? 250 : 500); scene.add(bio);
  bio.material.uniforms.uPx.value = pr;
  const glows = makeGlows([0x39ff8a, 0x4aa8ff]); scene.add(glows);
  glows.material.uniforms.uPx.value = pr;
  glows.visible = night;

  await loading('Bodem en rif…');
  const [sandTex] = await Promise.all([loadSandTextures(), loadModels(['hersenkoraal', 'sterkoraal', 'buisspons', 'vaasspons', 'tonspons', 'bekerkoraal', 'korstspons'])]);
  scene.add(makeSeabed(q, sandTex));
  await loading('De pijlers van de Zoutpier…');
  const pier = makePier(scene, q);
  const pTex = new THREE.TextureLoader().load(q === 'laag' ? 'img/tex-pijler-laag.jpg' : 'img/tex-pijler.jpg', (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1.2); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    pier.mesh.material.map = t; pier.mesh.material.needsUpdate = true;
    // reliëf van sponzen, koralen en zeepokken (normaalkaart uit dezelfde textuur)
    new THREE.TextureLoader().load(q === 'laag' ? 'img/tex-pijler-laag-n.jpg' : 'img/tex-pijler-n.jpg', (n) => {
      n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(1, 1.2);
      pier.mesh.material.normalMap = n; pier.mesh.material.normalScale = new THREE.Vector2(1.2, 1.2); pier.mesh.material.needsUpdate = true;
    }, undefined, () => { pier.mesh.material.bumpMap = t; pier.mesh.material.bumpScale = 1.6; pier.mesh.material.needsUpdate = true; });
  });
  void pTex;
  makeReef(scene, q, pier.pillars);
  makePillarGrowth(scene, q, pier.pillars, pillarAt);
  await loading('Vissen, tarpons en schildpadden…');
  await Promise.all([preloadFishPhotos(), preloadFaunaModels(night)]);
  const fauna = new Fauna(scene, q, { night });
  fauna.placeFrogs(pier.pillars);

  await loading('Duikers en geluid…');
  const snd = new Sound3D();
  await Promise.all([preloadDivers(), snd.load()]);
  const lo = DG.Save.loadout();
  const look = Object.assign({}, lo.look);
  const me = buildDiver({ model: 'duiker', suit: 0x16171a, bcd: 0x141518, accent: 0xf2c21a, fin: hex(look.fin, 0xf2c21a), tank: 0xc8cdd2, lamp: lo.lamp ? look.lamp || 'compact' : null, cam: lo.camera ? look.cam : null, reg: look.reg ? hex(look.reg) : null });
  const buddyM = buildDiver({ model: 'buddy', suit: 0x1b1d22, bcd: 0x1f2026, accent: 0xd8402a, fin: 0xe86aa0, tank: 0xc8cdd2, hair: 0x6a4a2a, lamp: night ? 'primair' : null });
  // vinpunten en flessenlichtje in lokale coördinaten van het duikermodel (kop naar -Z, rug naar +Y)
  const dimsOf = (d) => { d.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(d); return { fin: bb.max.z - 0.15, valve: new THREE.Vector3(0, bb.max.y - 0.03, bb.min.z + 0.42) }; };
  const meDim = dimsOf(me), buDim = dimsOf(buddyM);
  scene.add(me); scene.add(buddyM);

  await loading(night ? 'De zon is onder. Lampen aan!' : 'Klaar om te water te gaan');
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
    spotted: {}, newSp: [], photos: [], chDone: [], prof: [[0, 0]], profT: 0,
    lamp: night && !!lo.lamp, view: sv.set3d.view, ts: sv.set3d.ts, assist: sv.set3d.assist,
    night, glareT: 0, glare: 0, glareCool: 0, bioT: 0, bioSeen: false, aimT: 0, aimP: null, nextAim: 45,
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
      if (night && !D.lamp && !D.warned.lampOff) { D.warned.lampOff = 1; hud.msg('Lamp uit. Nu zie je alleen nog het lichtje op de fles van je buddy… en misschien nog iets anders als je beweegt.', 4500); }
    } else if (a === 'view') {
      D.view = D.view === 'achter' ? 'bril' : 'achter';
      sv.set3d.view = D.view; hud.setMask(D.view === 'bril');
    } else if (a === 'equalize') {
      const depth = -D.p.y;
      if (depth - D.lastEq > 4.5) { hud.msg('Te laat: je oren gaan niet meer open. Stijg een stukje op en probeer opnieuw.'); }
      else { D.lastEq = depth; D.ear = 0; DG.Audio.click(); }
    } else if (a === 'photo') takePhoto();
    else if (a === 'ok' && D.sig === 'ok') {
      if (night && !D.lamp) { hud.msg('Doe eerst je lamp aan (L): in het donker ziet je buddy je teken alleen in je lampbundel.', 3500); return; }
      D.sig = null; ui.querySelector('.c3-ok').hidden = true;
      hud.msg(night ? '🔦 Je maakt een rustige cirkel met je lampbundel op de bodem: alles OK!' : '👌 Je geeft je buddy het OK-teken terug.', 2500);
    } else if (a === 'air' && D.sig === 'air') {
      if (night && !D.lamp) { hud.msg('Doe eerst je lamp aan (L) en schijn op je manometer.', 3500); return; }
      D.sig = null; ui.querySelector('.c3-air').hidden = true;
      const bar = D.gas / TANK_L;
      hud.msg((night ? 'Je schijnt op je manometer: ' : 'Je laat ') + Math.round(bar) + ' bar zien. Buddy: ' + Math.round(Math.max(60, bar - 12 + Math.random() * 20)) + ' bar.', 3500);
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
    const cands = fauna.spottables().concat([{ spc: { id: 'buddy', name: 'Je buddy' }, p: D.buddy.p, L: 1.8, v: D.buddy.v, buddy: true }]);
    for (const s of cands) {
      const to = s.p.clone().sub(camera.position);
      const d = to.length();
      if (d > lo.camera.bereik + s.L * 1.5 + 2) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, to.normalize().dot(fwd))));
      if (ang > 0.45) continue;
      const sc = (1 - ang / 0.45) * 0.5 + (1 - d / (lo.camera.bereik + 4)) * 0.5 - (s.buddy ? 0.15 : 0);
      if (sc > bs) { bs = sc; best = { s, d, ang }; }
    }
    wantPhoto = best || { none: true };
  }
  function capturePhoto() {
    const ph = wantPhoto; wantPhoto = null;
    const src = renderer.domElement;
    const w = src.width, h = src.height;
    const cw = Math.min(w, h * 4 / 3) * 0.7, ch = cw * 0.75;
    const c = document.createElement('canvas'); c.width = 400; c.height = 300;
    c.getContext('2d').drawImage(src, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, 400, 300);
    let g = { stars: 1, note: 'Sfeerfoto: richt op een dier of je buddy voor een challenge.' };
    if (!ph.none) {
      const lit = (D.lamp && litBy(ph.s.p, UW.uLampPos.value, UW.uLampDir.value, Math.cos(lo.lamp.hoek + 0.08), lo.lamp.bereik)) || (night && litBy(ph.s.p, UW.uLamp2Pos.value, UW.uLamp2Dir.value, UW.uLamp2Cos.value - 0.03, UW.uLamp2Range.value));
      g = gradePhoto({
        L: ph.s.L, d: ph.d, ang: ph.ang, vfov: camera.fov * Math.PI / 180, aspect: camera.aspect, depth: Math.max(0, -D.p.y),
        diverSpeed: D.v.length(), turn: D.turnRate || 0, subjSpeed: ph.s.v ? ph.s.v.length() : 0, strobe: !!lo.camera.flits, lamp: night ? lit : !!D.lamp, night, lit,
      });
    }
    const spId = ph.none ? null : ph.s.spc.id;
    const photo = { sp: ph.none || ph.s.buddy ? null : spId, title: ph.none ? 'Sfeerfoto' : ph.s.buddy ? 'Je buddy' : ph.s.sleep ? 'Slapende stoplichtpapegaaivis' : null, night, stars: g.stars, max: 5, note: g.note, url: c.toDataURL('image/jpeg', 0.78), site: 'saltpier', date: Date.now(), depth: Math.round(-D.p.y * 10) / 10, ch: [] };
    // fotochallenges
    sv.challenges = sv.challenges || {};
    checkChallenges((DG.PHOTO_CHALLENGES || {})[night ? 'saltpier_nacht' : 'saltpier'], sv.challenges, spId, g.stars).forEach((ch) => {
      const t = document.createElement('canvas'); t.width = 160; t.height = 120;
      t.getContext('2d').drawImage(c, 0, 0, 160, 120);
      sv.challenges[ch.id] = { stars: g.stars, date: Date.now(), thumb: t.toDataURL('image/jpeg', 0.7) };
      photo.ch.push(ch.id);
      D.chDone.push(ch.id);
      setTimeout(() => { DG.Audio.newSpecies(); hud.msg('🏆 Fotochallenge gehaald: ' + ch.title + '!', 4000); }, 700);
    });
    D.photos.push(photo);
    if (snd.ok) snd.camera(); else { DG.Audio.shutter(); if (lo.camera.flits) DG.Audio.strobe(); }
    flash.style.opacity = lo.camera.flits ? 0.85 : 0.5;
    setTimeout(() => (flash.style.opacity = 0), 90);
    UI.photoToast(photo, ph.none || ph.s.buddy ? null : ph.s.spc);
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
  function litBy(p, pos, dir, cosA, range) { const v = p.clone().sub(pos); const d = v.length(); return d < range && d > 0.01 && v.divideScalar(d).dot(dir) > cosA; }
  function inShadow(x, z) { return (x > -122 && x < -3 && Math.abs(z) < 2.6) || (Math.abs(x + 120) < 9 && Math.abs(z) < 7); }
  const fwdOf = (yaw, pitch) => new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));

  /* ---------------- hoofdlus ---------------- */
  let last = performance.now();
  let hudT = 0, spotT = 0, breathOut = false;
  // dynamische resolutie: lager als het toestel het niet bijhoudt, weer hoger als het kan
  let drT = 0, drN = 0, curPR = pr;
  function dynRes(real) {
    drT += real; drN++;
    if (drT < 2) return;
    const fps = drN / drT; drT = 0; drN = 0;
    const minPR = Math.max(0.5, pr * 0.55);
    if (fps < 28 && curPR > minPR) { curPR = Math.max(minPR, curPR - 0.1); renderer.setPixelRatio(curPR); }
    else if (fps > 52 && curPR < pr) { curPR = Math.min(pr, curPR + 0.05); renderer.setPixelRatio(curPR); }
  }
  function loop(now) {
    if (D.ended) return;
    requestAnimationFrame(loop);
    const real = Math.max(0, (now - last) / 1000);
    const dt = Math.min(0.05, real);
    last = now;
    if (real > 0 && real < 1) dynRes(real);
    if (!D.paused) step(dt);
    render(dt);
  }

  function step(dt) {
    D.t += dt;
    UW.uTime.value = D.t;
    const inp = D.ooa ? { fwd: 0, side: 0, turn: 0, lookX: 0, lookY: 0, bcdIn: false, bcdOut: false, breath: false, exhale: false, hard: false } : D.forceInp || ctl.read();
    // kijken
    const prevYaw = D.lookYaw;
    D.lookYaw -= inp.lookX * 0.0045 + inp.turn * dt * 1.3;
    D.turnRate = (D.turnRate || 0) * 0.8 + (Math.abs(D.lookYaw - prevYaw) / Math.max(dt, 1e-3)) * 0.2;
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
    // geluid van de inflator / ontluchter zolang de knop ingedrukt is
    if ((inp.bcdIn && D.gas > 0) || (inp.bcdOut && D.bcdN > 0.05)) {
      D.vestSndT = (D.vestSndT || 0) - dt;
      if (D.vestSndT <= 0) { D.vestSndT = 1.7; if (!D.forceInp) inp.bcdIn ? snd.vestIn() : snd.vestOut(); }
    } else D.vestSndT = 0;
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
    if (!holding && ph > 0.55 && !breathOut) { breathOut = true; if (dNow > 0.7) { const mp = me.userData.mouth.getWorldPosition(tmpV); spawnBubbles(bubbles, mp.x, mp.y, mp.z, 10, false); spawnBubbles(bubbles, mp.x, mp.y, mp.z, 4, true); if (!D.forceInp) { if (snd.ok) snd.exhale(dNow); else DG.Audio.breathOut(0.8); } } }
    if (ph < 0.55 && breathOut) { breathOut = false; if (dNow > 0.7 && !D.forceInp) { if (snd.ok) snd.inhale(dNow); else DG.Audio.breathIn(0.8); } }
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
    lampInfo.on = D.lamp && !!lo.lamp;
    if (lampInfo.on) lampInfo.point.copy(UW.uLampPos.value).addScaledVector(UW.uLampDir.value, 3);
    const env = { diver: D.p, nearPillars: nearP, cam: camera.position, shadows: night ? null : shadows, night, lamp: lampInfo, onMsg: (t) => hud.msg(t, 4500) };
    shadows.begin(camera.position);
    if (!night) {
      shadows.add(D.p.x, D.p.y, D.p.z, 0.75, 2.0, D.yaw, 0.75);
      shadows.add(D.buddy.p.x, D.buddy.p.y, D.buddy.p.z, 0.75, 2.0, D.buddy.yaw || 0, 0.75);
    }
    fauna.update(dt, env, D.t);
    shadows.end();
    // geluid: diepte, en de dichtstbijzijnde papegaaivis (knagen op koraal)
    if (snd.ok && !D.forceInp) {
      let pd = 99, pp = 0;
      for (const s of fauna.solos) {
        if (s.spc.id !== 'stoplicht_papegaai') continue;
        const dd = s.p.distanceTo(D.p);
        if (dd < pd) { pd = dd; const rx = Math.cos(D.lookYaw), rz = -Math.sin(D.lookYaw); pp = ((s.p.x - D.p.x) * rx + (s.p.z - D.p.z) * rz) / Math.max(1, dd); }
      }
      snd.update(dt, { depth: dNow, parrotDist: night ? 99 : pd, parrotPan: pp, night });
    }
    spotT -= dt;
    if (spotT <= 0) { spotT = 0.25; checkSpots(); }

    /* ---- lamp ---- */
    UW.uLampOn.value = D.lamp ? 1 : 0;
    if (D.lamp) {
      const tip = D.view === 'bril' ? me.userData.head : me.userData.lampTip || me.userData.mouth;
      tip.getWorldPosition(UW.uLampPos.value);
      if (D.view === 'bril') UW.uLampPos.value.y -= 0.25;
      // 's nachts richt je de lamp waar je kijkt; overdag in je zwemrichting
      const lf = D.view === 'bril' || night ? fwdOf(D.lookYaw, D.lookPitch) : fwdOf(D.yaw, D.pitch);
      UW.uLampDir.value.copy(lf);
      UW.uLampRange.value = lo.lamp.bereik;
      UW.uLampCos.value = Math.cos(lo.lamp.hoek);
    }
    updateBeam(beam, night && D.lamp, UW.uLampPos.value, UW.uLampDir.value, lo.lamp ? lo.lamp.bereik : 1, lo.lamp ? lo.lamp.hoek : 0.4, D.view === 'bril' ? 0 : 0.1);
    if (night) nightStep(dt, inp, dNow);

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

  /* ---------------- nacht: buddylamp, verblinden, plankton, flessenlichtjes ---------------- */
  const lampInfo = { on: false, pos: UW.uLampPos.value, dir: UW.uLampDir.value, cos: lo.lamp ? Math.cos(lo.lamp.hoek) : 0.9, point: new THREE.Vector3() };
  const tmpV2 = new THREE.Vector3(), tmpV3 = new THREE.Vector3();
  function nightStep(dt, inp, dNow) {
    // de lamp van je buddy: zwaait rustig over bodem en pijlers, of wijst iets aan
    buddyM.userData.lampTip.getWorldPosition(UW.uLamp2Pos.value);
    let want;
    if (D.aimT > 0 && D.aimP) { D.aimT -= dt; want = tmpV2.copy(D.aimP).sub(UW.uLamp2Pos.value).normalize(); }
    else want = fwdOf(D.buddy.yaw + Math.sin(D.t * 0.37) * 0.55, -0.38 + Math.sin(D.t * 0.23 + 1) * 0.22);
    UW.uLamp2Dir.value.lerp(want, Math.min(1, dt * 2.5)).normalize();
    UW.uLamp2On.value = -D.buddy.p.y > 0.6 ? 1 : 0;
    UW.uLamp2Cos.value = Math.cos(0.42);
    UW.uLamp2Range.value = 8;
    updateBeam(beam2, UW.uLamp2On.value > 0, UW.uLamp2Pos.value, UW.uLamp2Dir.value, 8, 0.42, 0.1);
    // af en toe schijnt je buddy op iets wat jij nog niet gezien hebt
    if (D.t > D.nextAim && dNow > 2) {
      D.nextAim = D.t + 35 + Math.random() * 30;
      let best = null, bd = 9;
      for (const s of fauna.spottables()) {
        if (D.spotted[s.spc.id]) continue;
        const d = s.p.distanceTo(D.buddy.p);
        if (d < bd) { bd = d; best = s; }
      }
      if (best) { D.aimP = best.p; D.aimT = 8; hud.msg('Je buddy schijnt met zijn lamp op iets en maakt kleine rondjes met de bundel: kijk eens!', 4000); }
    }
    // niet in de ogen schijnen
    D.glareCool -= dt;
    if (D.lamp) {
      const v = buddyM.userData.head.getWorldPosition(tmpV3).sub(UW.uLampPos.value);
      const d = v.length();
      const inBeam = d < 5 && d > 0.2 && v.divideScalar(d).dot(UW.uLampDir.value) > Math.cos(lo.lamp.hoek * 0.8);
      D.glareT = inBeam ? D.glareT + dt : 0;
      if (D.glareT > 0.9 && D.glareCool <= 0) { D.glare++; D.glareCool = 12; hud.msg('Je schijnt je buddy recht in de ogen! Richt je lamp op de bodem of op het dier dat je wilt laten zien.', 4000); }
    }
    // lichtgevend plankton waar vinnen en handen bewegen (het mooist met je lamp uit)
    const kick = Math.min(1, Math.abs(inp.fwd) * (inp.hard ? 1 : 0.6) + Math.abs(inp.side) * 0.3);
    if (dNow > 0.8) {
      D.bioAcc = (D.bioAcc || 0) + dt * (kick * 45 + D.v.length() * 25);
      while (D.bioAcc > 1) { D.bioAcc -= 1; const fp = me.localToWorld(tmpV2.set((Math.random() - 0.5) * 0.55, (Math.random() - 0.5) * 0.2, meDim.fin - Math.random() * 0.35)); spawnBio(bio, fp.x, fp.y, fp.z, 1, 0.25); }
      D.bioAcc2 = (D.bioAcc2 || 0) + dt * D.buddy.v.length() * 40;
      while (D.bioAcc2 > 1) { D.bioAcc2 -= 1; const fp = buddyM.localToWorld(tmpV2.set((Math.random() - 0.5) * 0.55, 0, buDim.fin - Math.random() * 0.35)); spawnBio(bio, fp.x, fp.y, fp.z, 1, 0.25); }
    }
    bio.material.uniforms.uBright.value = D.lamp ? 0.15 : 1;
    if (!D.lamp && kick > 0.25 && dNow > 2) D.bioT += dt;
    if (D.bioT > 2.5 && !D.bioSeen) { D.bioSeen = true; DG.Audio.newSpecies(); hud.msg('✨ Waar je vinnen bewegen, licht het water groenblauw op: lichtgevend plankton (bioluminescentie)!', 6500); }
    if (!D.bioHint && D.gt > 300 && !D.bioSeen && D.lamp && dNow > 3) { D.bioHint = true; hud.msg('Tip: doe je lamp even uit (L) en zwem een paar slagen. Kijk naar je vinnen…', 5500); }
    // lichtjes op de flessen
    const gp = glows.geometry.attributes.position;
    const a = me.localToWorld(tmpV2.copy(meDim.valve)); gp.setXYZ(0, a.x, a.y, a.z);
    const b = buddyM.localToWorld(tmpV3.copy(buDim.valve)); gp.setXYZ(1, b.x, b.y, b.z);
    gp.needsUpdate = true;
    glows.geometry.attributes.aOn.array[0] = D.view === 'bril' ? 0 : 0.8;
    glows.geometry.attributes.aOn.array[1] = 0.6 + 0.4 * (Math.sin(D.t * 6) > 0 ? 1 : 0.2);
    glows.geometry.attributes.aOn.needsUpdate = true;
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
    if (D.gt > D.nextOk && !D.sig && -D.p.y > 2) { D.sig = 'ok'; D.sigT = 0; D.nextOk = D.gt + 300; ui.querySelector('.c3-ok').hidden = false; hud.msg(night ? 'Je buddy maakt een cirkel met zijn lampbundel: alles OK? Antwoord met een cirkel van jouw lamp (👌 of O).' : 'Je buddy vraagt met een teken: alles OK? (👌 of O)', 4500); }
    if (D.gt > D.nextAir && !D.sig && -D.p.y > 2) { D.sig = 'air'; D.sigT = 0; D.nextAir = D.gt + 600; ui.querySelector('.c3-air').hidden = false; hud.msg(night ? 'Je buddy schijnt op zijn manometer en vraagt: hoeveel lucht heb jij nog?' : 'Je buddy vraagt: hoeveel lucht heb je nog?', 4000); }
    if (D.sig) {
      D.sigT += dt;
      if (D.sigT > 14) { D.missed++; D.sig = null; ui.querySelector('.c3-ok').hidden = true; ui.querySelector('.c3-air').hidden = true; hud.msg('Je reageerde niet op je buddy. Hij komt dichterbij kijken.', 3500); }
    }
    // buddy kwijt?
    if (dist > (night ? 7 : 12)) { D.sepT += dt; if (D.sepT > 1 && !D.warned.sep) { D.warned.sep = 1; hud.msg(night ? 'Je ziet het lampje van je buddy bijna niet meer! ’s Nachts blijf je binnen 2–3 m van elkaar.' : 'Blijf bij je buddy! Hij is ' + Math.round(dist) + ' m van je af.', 3500); } }
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
      if (night) {
        const lit = (D.lamp && litBy(s.p, UW.uLampPos.value, UW.uLampDir.value, Math.cos(lo.lamp.hoek + 0.05), lo.lamp.bereik * 0.9)) || (UW.uLamp2On.value > 0 && litBy(s.p, UW.uLamp2Pos.value, UW.uLamp2Dir.value, UW.uLamp2Cos.value - 0.03, 7));
        ok = d < (s.hidden ? 1.5 : 2.2) || (lit && d < (s.hidden ? lo.lamp.bereik * 0.85 : 12) && to.normalize().dot(fwd) > 0.35);
      } else if (s.hidden) {
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
        UI.spotToast(s.sleep ? Object.assign({}, s.spc, { name: 'Slapende ' + s.spc.name.toLowerCase() }) : s.spc, isNew, true);
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
    if (night) updateBio(bio, D.paused ? 0 : dt);
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
    snd.stop();
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
      species: Object.keys(D.spotted), newSpecies: D.newSp.slice(), photos: D.photos, challenges: D.chDone.slice(), needStop: D.needStop, safetyDone: D.stopDone,
      ascentWarnings: D.fastCount, ooa: !!ooa, decoViolation: D.decoViol || D.ceilViol > 0, cold: 0, gas: lo.gas, tankL: TANK_L,
      profile: D.prof.concat([[minutes, 0]]), lines, earned: 0, xp, three: true, night, bio: D.bioSeen,
      rules: { touches: D.touches, reef: D.reefTouch, missed: D.missed, limit: D.limitViol, deco: D.wasDeco, ceil: D.ceilViol, glare: D.glare, night },
    };
    // opslaan: logboek, foto's, restverzadiging, vliegverbod
    const prof = res.profile;
    const stp = Math.max(1, Math.ceil(prof.length / 70));
    sv.dives.push({
      nr: sv.dives.length + 1, site: 'saltpier', date: res.date, minutes: Math.round(minutes), maxD: Math.round(res.maxD * 10) / 10,
      avgD: Math.round(res.avgD * 10) / 10, temp: 28, species: res.species, newSpecies: res.newSpecies, photos: res.photos.length, earned: 0,
      safetyDone: res.safetyDone, needStop: res.needStop, ascentWarnings: res.ascentWarnings, ooa: res.ooa, bar, gas: res.gas,
      profile: prof.filter((p, i) => i % stp === 0 || i === prof.length - 1).map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]),
      three: true, rules: res.rules, night,
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

  if (snd.ok) snd.startLoops(); else DG.Audio.ambience(true);
  DG.Audio.splash();
  if (night) hud.msg('Het is donker. Je ligt met je buddy bij de gele steen, lampen aan. Laat lucht uit je vest (▼ of F) om af te dalen. Blijf dicht bij elkaar: zie je zijn lampje niet meer, stop dan en kijk rond.', 8000);
  else hud.msg(D.cur.length() > 0.01 ? 'Je ligt aan de oppervlakte bij de gele steen. Er staat lichte stroming: ' + plan.curTxt + '. Laat lucht uit je vest (▼ of F) om af te dalen.' : 'Je ligt aan de oppervlakte bij de gele steen. Laat lucht uit je trimvest (▼ of F) om af te dalen, en vergeet niet te klaren.', 7000);
  updateNear();
  requestAnimationFrame((t) => { last = t; loop(t); });
  // testhaakje: simulatie vooruitspoelen zonder beeld
  window.__d3 = {
    D, deco, camera, scene, renderer, action, fauna, camPos, shadows, snd,
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
  const hasLamp = !!DG.Save.loadout().lamp;
  let when = s3.when === 'nacht' && hasLamp ? 'nacht' : 'dag';
  const chLine = (key, w) => {
    const list = (DG.PHOTO_CHALLENGES || {})[key] || [], done = DG.Save.data.challenges || {};
    const n = list.filter((c) => done[c.id]).length, next = list.find((c) => !done[c.id]);
    const nm = w === 'nacht' ? 'nachtchallenges' : 'fotochallenges';
    if (!DG.Save.loadout().camera) return '<p class="b3-ch" data-w="' + w + '">📷 Huur een camera bij De Tuimelaar voor de ' + list.length + ' ' + nm + ' van de Zoutpier.</p>';
    return '<p class="b3-ch" data-w="' + w + '">' + (w === 'nacht' ? '🌙' : '🏆') + ' ' + nm[0].toUpperCase() + nm.slice(1) + ': ' + n + '/' + list.length + (next ? ' · volgende: <b>' + next.title + '</b> (minimaal ' + next.min + '★). ' + next.tip : ' · alles gehaald!') + '</p>';
  };
  // 1. briefing (dag of nacht)
  const go = await ask(
    '<div class="b3-photos"><img src="img/bonaire-zoutpier-lucht.jpg" alt="Luchtfoto van de Zoutpier"><img src="img/bonaire-zoutpier-steen.jpg" alt="De gele steen Salt Pier"><img src="img/bonaire-zoutpier-knorvissen.jpg" alt="Knorvissen tussen de pijlers"></div>' +
    '<div class="b3-when"><span class="seg" data-k="when"><button data-v="dag">☀️ Dagduik</button><button data-v="nacht"' + (hasLamp ? '' : ' disabled') + '>🌙 Nachtduik</button></span>' +
    (hasLamp ? '' : '<small>Voor een nachtduik heb je een duiklamp nodig. Die kun je huren bij De Tuimelaar.</small>') + '</div>' +
    '<h2>Briefing · Zoutpier, Bonaire<span data-w="nacht"> · nachtduik</span></h2>' +
    chLine('saltpier', 'dag') + chLine('saltpier_nacht', 'nacht') +
    '<div class="brief-grid">' +
    '<div><small>Water</small>28 °C · <span data-w="dag">zicht ±50 m</span><span data-w="nacht">zicht: alleen in je lampbundel</span></div><div><small>Ingang</small><span data-w="dag">Kantduik bij de gele steen</span><span data-w="nacht">Gele steen, ingang bij daglicht verkend</span></div>' +
    '<div><small>Stroming vandaag</small>' + curTxt + '</div><div><small>Diepte</small>pier 3–12 m · rif tot 40 m</div>' +
    '<div><small>Jouw grens</small>' + DG.Save.maxDepth() + ' m (' + esc(DG.Save.brevet()) + ')</div><div><small>Fles</small>aluminium 80 · 207 bar · ' + (DG.Save.loadout().gas === 'ean32' ? 'nitrox 32%' : 'lucht') + '</div>' +
    '</div>' +
    '<p class="lead" data-w="dag">' + esc(route) + ' ' + esc(siTxt) + '</p>' +
    '<p class="lead" data-w="nacht">De zon is net onder. ’s Nachts is de Zoutpier een andere wereld: tarpons jagen in het licht van je lamp, octopussen, murenen en langoesten zwerven over de bodem, mandsters vouwen hun armen uit op de pijlers en papegaaivissen slapen in een slijmcocon. Blijf vlak bij je buddy en zwem rustig: alleen in je lampbundel zie je kleur. ' + esc(siTxt) + '</p>' +
    '<h3>Regels van het Bonaire Marine Park</h3><ul class="b3-rules">' +
    '<li><label><input type="checkbox" required> Ik heb een geldige natuurtag (STINAPA)</label></li>' +
    '<li><label><input type="checkbox" required> Ik duik zonder handschoenen en raak niets aan</label></li>' +
    '<li><label><input type="checkbox" required> Ik heb gecontroleerd dat er geen schip aan de pier ligt</label></li>' +
    '</ul>' +
    '<div data-w="nacht"><h3>Afspraken voor de nachtduik</h3><ul class="b3-rules">' +
    '<li><label><input type="checkbox" required> Hoofdlamp en reservelamp zijn opgeladen en getest</label></li>' +
    '<li><label><input type="checkbox" required> Er zit een lichtje op mijn fles, zodat mijn buddy me in het donker ziet</label></li>' +
    '<li><label><input type="checkbox" required> Lampsignalen afgesproken: cirkel = OK, heen en weer zwaaien = aandacht of probleem, nooit in iemands ogen schijnen</label></li>' +
    '<li><label><input type="checkbox" required> We blijven binnen 2–3 m van elkaar. Kwijt? Eén minuut rondkijken, lamp afschermen om zijn licht te zien, daarna rustig opstijgen</label></li>' +
    '</ul></div>' +
    '<div class="modal-actions"><button class="btn ghost" data-a="back">Terug</button><button class="btn primary" data-a="go">Verder</button></div>',
    '', (c, done) => {
      const seg = c.querySelector('.seg[data-k=when]');
      const sync = () => {
        seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === when));
        c.querySelectorAll('[data-w]').forEach((el) => (el.hidden = el.dataset.w !== when));
      };
      seg.querySelectorAll('button').forEach((b) => (b.onclick = () => { if (b.disabled) return; when = b.dataset.v; sync(); DG.Audio.click(); }));
      sync();
      c.querySelector('[data-a=back]').onclick = () => done(false);
      c.querySelector('[data-a=go]').onclick = () => {
        const all = [...c.querySelectorAll('.b3-rules input')].filter((i) => !i.closest('[hidden]')).every((i) => i.checked);
        if (!all) { DG.UI.toast(when === 'nacht' ? 'Vink eerst de regels en de afspraken voor de nachtduik af.' : 'Vink eerst de regels van het marine park af.', 'warn'); return; }
        s3.when = when; DG.Save.save();
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
  return { tissues, current: cur, curTxt, night: when === 'nacht' };
}
