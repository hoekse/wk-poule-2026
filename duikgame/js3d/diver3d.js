/* Diepblauw 3D — duiker (speler en buddy). Fallback: procedureel opgebouwd, kijkt naar -Z */
import * as THREE from 'three';
import { uw } from './water.js';

function mat(color, opts = {}) {
  return uw(new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05 }, opts)), { caus: true, key: 'diver' + (opts.metalness ? 'm' : '') });
}
function capsule(r, len, m) {
  const g = new THREE.CapsuleGeometry(r, len, 4, 12);
  return new THREE.Mesh(g, m);
}

export function buildProcedural(look = {}) {
  const suit = mat(look.suit || 0x17181b, { roughness: 0.85 });
  const skin = mat(0xd9a57e, { roughness: 0.7 });
  const bcd = mat(look.bcd || 0x151619, { roughness: 0.8 });
  const accent = mat(look.accent || 0xf2c21a, { roughness: 0.6 });
  const tankM = mat(look.tank || 0xc7ccd2, { roughness: 0.35, metalness: 0.6 });
  const black = mat(0x0d0d0f, { roughness: 0.5 });
  const finM = mat(look.fin || 0xf2c21a, { roughness: 0.55, side: THREE.DoubleSide });
  const hair = mat(look.hair || 0x3a2618, { roughness: 0.9 });
  const glass = mat(0x14324a, { roughness: 0.05, metalness: 0.9 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // romp en heupen
  const torso = capsule(0.17, 0.5, suit); torso.rotation.x = Math.PI / 2; body.add(torso);
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 10), suit); hips.position.set(0, -0.01, 0.34); hips.scale.set(1.05, 0.9, 1.1); body.add(hips);
  // trimvest
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.27, 0.6, 2, 2, 2), bcd); vest.position.set(0, 0.06, -0.03); body.add(vest);
  [-0.17, 0.17].forEach((x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.29, 0.06), accent); s.position.set(x, 0.07, -0.28); body.add(s); });
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.08), black); belt.position.set(0, -0.06, 0.24); body.add(belt);
  // fles
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.66, 16), tankM); tank.rotation.x = Math.PI / 2; tank.position.set(0, 0.23, 0.05); body.add(tank);
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 8), black); valve.position.set(0, 0.25, -0.31); valve.rotation.x = Math.PI / 2; body.add(valve);
  const stage1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.06), black); stage1.position.set(0, 0.28, -0.36); body.add(stage1);
  // hoofd, masker, ademautomaat
  const head = new THREE.Group(); head.position.set(0, 0.06, -0.5); body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), skin); head.add(skull);
  const hairM = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), look.hood ? suit : hair); hairM.rotation.x = 0.5; hairM.position.set(0, 0.01, 0.01); head.add(hairM);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.085, 0.045), black); frame.position.set(0, 0.03, -0.095); head.add(frame);
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.135, 0.065), glass); lens.position.set(0, 0.03, -0.119); lens.rotation.y = Math.PI; head.add(lens);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.012, 6, 20), black); strap.rotation.y = Math.PI / 2; strap.position.y = 0.03; head.add(strap);
  const reg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.06), look.reg ? mat(look.reg) : black); reg.position.set(0, -0.06, -0.12); head.add(reg);
  // slang van eerste trap naar ademautomaat
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.03, 0.28, -0.36), new THREE.Vector3(0.16, 0.16, -0.5), new THREE.Vector3(0.1, 0.0, -0.62)]), 12, 0.012, 6), black);
  body.add(hose);

  // armen
  const arms = [];
  [-1, 1].forEach((s) => {
    const sh = new THREE.Group(); sh.position.set(s * 0.2, 0.0, -0.24); body.add(sh);
    const up = capsule(0.05, 0.2, suit); up.position.set(0, -0.06, -0.08); up.rotation.x = 0.9; sh.add(up);
    const el = new THREE.Group(); el.position.set(0, -0.13, -0.16); sh.add(el);
    const lo = capsule(0.042, 0.18, suit); lo.rotation.z = s * Math.PI / 2 * 0.9; lo.position.set(-s * 0.1, -0.01, 0); el.add(lo);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), skin); hand.position.set(-s * 0.2, -0.01, 0); el.add(hand);
    arms.push({ sh, el, up, lo, hand, s });
  });
  // computer op de pols
  const comp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), black); comp.position.set(0.1, 0.02, 0); arms[0].el.add(comp);

  // benen met vinnen
  const legs = [];
  const finShape = new THREE.Shape();
  finShape.moveTo(-0.06, 0); finShape.lineTo(-0.12, 0.5); finShape.quadraticCurveTo(0, 0.66, 0.12, 0.5); finShape.lineTo(0.06, 0); finShape.lineTo(-0.06, 0);
  const finGeo = new THREE.ShapeGeometry(finShape, 6);
  finGeo.rotateX(Math.PI / 2);
  [-1, 1].forEach((s) => {
    const hip = new THREE.Group(); hip.position.set(s * 0.09, -0.02, 0.42); body.add(hip);
    const th = capsule(0.07, 0.32, suit); th.rotation.x = Math.PI / 2; th.position.z = 0.2; hip.add(th);
    const knee = new THREE.Group(); knee.position.z = 0.42; hip.add(knee);
    const calf = capsule(0.055, 0.3, suit); calf.rotation.x = Math.PI / 2; calf.position.z = 0.19; knee.add(calf);
    const ankle = new THREE.Group(); ankle.position.z = 0.4; knee.add(ankle);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.18), black); boot.position.z = 0.05; ankle.add(boot);
    const fin = new THREE.Mesh(finGeo, finM); fin.position.set(0, 0, 0.08); fin.rotation.x = 0.05; ankle.add(fin);
    legs.push({ hip, knee, ankle, s });
  });

  // camera/lamp in de hand
  let lampTip = null;
  if (look.cam) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.12), black);
    housing.position.set(0, -0.12, -0.78); body.add(housing);
    const port = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glass);
    port.rotation.x = -Math.PI / 2; port.position.set(0, -0.12, -0.84); body.add(port);
    if (look.cam === 'pro') {
      [-1, 1].forEach((s) => {
        const armS = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32), black);
        armS.rotation.z = s * 0.9; armS.position.set(s * 0.2, -0.04, -0.8); body.add(armS);
        const strobe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10), black);
        strobe.rotation.x = Math.PI / 2; strobe.position.set(s * 0.33, 0.04, -0.86); body.add(strobe);
      });
    }
    arms.forEach((a) => { a.sh.rotation.x = -0.5; a.el.rotation.x = -0.6; });
  }
  if (look.lamp) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, look.lamp === 'primair' ? 0.2 : 0.14, 10), black);
    lamp.rotation.x = Math.PI / 2; lamp.position.set(-0.22, -0.1, -0.7); body.add(lamp);
    lampTip = new THREE.Object3D(); lampTip.position.set(-0.22, -0.1, -0.8); body.add(lampTip);
  }
  const mouth = new THREE.Object3D(); mouth.position.set(0, -0.07, -0.65); body.add(mouth);

  root.userData = { body, legs, arms, head, mouth, lampTip, phase: Math.random() * 6 };
  return root;
}

// beenslag en houding animeren; kick 0..1 = hoe hard er gezwommen wordt
export function animateProcedural(d, dt, kick, hideHead) {
  const u = d.userData;
  u.phase += dt * (1.2 + kick * 3.2);
  const a = 0.12 + kick * 0.3;
  u.legs.forEach((l, i) => {
    const ph = u.phase + (i ? Math.PI : 0);
    l.hip.rotation.x = Math.sin(ph) * a * 0.7 + 0.04;
    l.knee.rotation.x = -0.55 - Math.max(0, Math.sin(ph - 0.9)) * a * 0.9;
    l.ankle.rotation.x = 0.42 + Math.sin(ph - 1.7) * a * 0.8;
  });
  u.head.visible = !hideHead;
}

/* ------------------------------------------------------------------
   Fotorealistische duikers (Magnific: beeld → 3D-model met skelet).
   Het model staat rechtop in A-houding: +Y omhoog, +X = voorkant,
   +Z = rechterkant van de duiker. Voor het zwemmen draaien we het hele
   model horizontaal (hoofd naar -Z, rug naar boven) en zetten we de
   gewrichten via het skelet: benen gestrekt naar achteren, enkels
   gestrekt zodat de vinnen in het verlengde staan, armen voor de borst
   en het hoofd omhoog zodat de duiker vooruit kijkt.
------------------------------------------------------------------- */
import { GLTFLoader, SkeletonUtils } from '../vendor/three/addons.min.js';

const MODELS = { duiker: 'models/duiker.glb', buddy: 'models/buddy.glb' };
const gltfCache = {};
const HEIGHT = 1.76; // lengte van kruin tot voetzool in meters

export function preloadDivers() {
  const loader = new GLTFLoader();
  return Promise.all(Object.keys(MODELS).map((k) => loader.loadAsync(new URL('../' + MODELS[k], import.meta.url).href)
    .then((g) => { gltfCache[k] = g; })
    .catch((e) => { console.warn('duikermodel niet geladen', k, e); })));
}

export function buildDiver(look = {}) {
  const g = look.model && gltfCache[look.model];
  if (!g) return buildProcedural(look);
  try { return buildFromGltf(g, look); } catch (e) { console.warn('duikermodel', e); return buildProcedural(look); }
}

export function animateDiver(d, dt, kick, hideHead) {
  if (d.userData.kind === 'gltf') animateGltf(d, dt, kick);
  else animateProcedural(d, dt, kick, hideHead);
}

const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };

function buildFromGltf(gltf, look) {
  const model = SkeletonUtils.clone(gltf.scene);
  // vinkleur uit de winkel: alleen de gele delen van de vinnen (onderste 8,5% van het model) kleuren mee
  const finOn = look.model === 'duiker' && look.fin != null && look.fin !== 0xf2c21a;
  model.traverse((o) => {
    if (o.isMesh) {
      const old = o.material;
      const m = new THREE.MeshStandardMaterial({ map: old.map, roughness: 0.75, metalness: 0.0 });
      m.color.setScalar(0.9);
      if (m.map) { m.map.colorSpace = THREE.SRGBColorSpace; m.map.anisotropy = 4; }
      const opts = { caus: true, key: 'diverSk' };
      if (finOn) {
        const g = o.geometry;
        if (!g.attributes.aFin) {
          g.computeBoundingBox();
          const pos = g.attributes.position, y0 = g.boundingBox.min.y, h = g.boundingBox.max.y - y0;
          const a = new Float32Array(pos.count);
          for (let i = 0; i < pos.count; i++) a[i] = pos.getY(i) < y0 + h * 0.085 ? 1 : 0;
          g.setAttribute('aFin', new THREE.BufferAttribute(a, 1));
        }
        Object.assign(opts, {
          key: 'diverSkF',
          uniforms: { uFin: { value: new THREE.Color(look.fin) } },
          vertexPars: 'attribute float aFin; varying float vFin;\n',
          vertexBegin: 'vFin = aFin;',
          fragmentPars: 'varying float vFin; uniform vec3 uFin;\n',
          fragmentColor: `{
            vec3 c = diffuseColor.rgb;
            float yel = smoothstep(0.08, 0.25, c.r) * step(0.3, c.g / max(c.r, 0.01)) * (1.0 - smoothstep(0.2, 0.45, c.b / max(c.g, 0.01)));
            diffuseColor.rgb = mix(c, uFin * (max(c.r, c.g) / 0.8), clamp(vFin * yel, 0.0, 1.0));
          }`,
        });
      }
      o.material = uw(m, opts);
      o.frustumCulled = false;
    }
  });
  // in rusthouding: posities van alle botten in modelruimte
  model.updateMatrixWorld(true);
  const bones = [];
  model.traverse((o) => { if (o.isBone) bones.push(o); });
  const P = new Map(), W = new Map();
  const mInv = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const mQ = new THREE.Quaternion(); model.getWorldQuaternion(mQ); mQ.invert();
  bones.forEach((b) => {
    P.set(b, new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(mInv));
    W.set(b, b.getWorldQuaternion(new THREE.Quaternion()).premultiply(mQ));
  });
  const isLeaf = (b) => !b.children.some((c) => c.isBone);
  const joint = (b) => ({ b, rest: b.quaternion.clone(), W: W.get(b), Wi: W.get(b).clone().invert(), p: P.get(b) });

  // benen: bladbotten laag bij de grond, omhoog lopen zolang de botten hoger komen
  const legs = [];
  const seenLeg = new Set();
  bones.filter((b) => isLeaf(b) && P.get(b).y < 0.16).forEach((leaf) => {
    const chain = [leaf];
    let c = leaf;
    while (c.parent && c.parent.isBone && P.get(c.parent).y > P.get(c).y - 0.01 && P.get(c.parent).y < 0.62) { c = c.parent; chain.unshift(c); }
    if (chain.length < 3 || seenLeg.has(chain[0])) return;
    seenLeg.add(chain[0]);
    legs.push({ s: Math.sign(P.get(leaf).z) || 1, hip: joint(chain[0]), knee: joint(chain[1]), ankle: joint(chain[2]), toe: chain[3] ? joint(chain[3]) : null });
  });
  // armen: bladbotten ver opzij en hoog; omhoog lopen tot vlak bij de romp
  const arms = [];
  const seenArm = new Set();
  bones.filter((b) => isLeaf(b) && Math.abs(P.get(b).z) > 0.2 && P.get(b).y > 0.4).forEach((leaf) => {
    const chain = [leaf];
    let c = leaf;
    while (c.parent && c.parent.isBone && Math.abs(P.get(c.parent).z) > 0.07) { c = c.parent; chain.unshift(c); }
    if (chain.length < 3 || seenArm.has(chain[0])) return;
    seenArm.add(chain[0]);
    // schouder = begin van de bovenarm; elleboog = eerste bot dat duidelijk verder ligt
    const sh = chain[0];
    let el = chain.find((b) => b !== sh && P.get(b).distanceTo(P.get(sh)) > 0.1) || chain[1];
    const wr = chain.find((b) => P.get(b).distanceTo(P.get(el)) > 0.09 && chain.indexOf(b) > chain.indexOf(el)) || chain[chain.indexOf(el) + 1] || chain[chain.length - 1];
    arms.push({ s: Math.sign(P.get(leaf).z) || 1, sh: joint(sh), el: joint(el), wr: joint(wr) });
  });
  // hoofd: bot met 'Head' in de naam (laagste), anders het hoogste bot op de middenlijn
  let head = bones.filter((b) => /head/i.test(b.name)).sort((a, b) => P.get(a).y - P.get(b).y)[0];
  if (!head) head = bones.filter((b) => Math.abs(P.get(b).z) < 0.06).sort((a, b) => P.get(b).y - P.get(a).y)[0];
  const neck = head && head.parent && head.parent.isBone && P.get(head.parent).y > 0.7 ? head.parent : null;

  // rustrichtingen voor de armen (bovenarm en onderarm)
  arms.forEach((a) => {
    a.upDir = P.get(a.el.b).clone().sub(P.get(a.sh.b)).normalize();
    a.foreDir = P.get(a.wr.b).clone().sub(P.get(a.el.b)).normalize();
  });

  // opbouw: root (fysicapositie) → pivot (horizontaal) → model
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0)));
  pivot.scale.setScalar(HEIGHT);
  model.position.set(0.02, -0.56, 0);
  pivot.add(model);
  root.add(pivot);

  // ankerpunten: mond (bellen), hoofd (duikbrilcamera), hand (lamp)
  const anchor = (bone, posModel) => {
    // lokale positie = W^-1 · (p - P_bot)  (botten hebben schaal 1 t.o.v. het model)
    const o = new THREE.Object3D();
    if (bone) { o.position.copy(posModel).sub(P.get(bone)).applyQuaternion(W.get(bone).clone().invert()); bone.add(o); } else { o.position.copy(posModel); model.add(o); }
    return o;
  };
  model.updateMatrixWorld(true);
  const headTop = head ? P.get(head).y : 0.85;
  const mouth = anchor(head, new THREE.Vector3(0.11, Math.min(0.93, headTop + 0.02), 0));
  const headA = anchor(head, new THREE.Vector3(0.06, Math.min(0.95, headTop + 0.06), 0));
  const rightArm = arms.find((a) => a.s > 0) || arms[0];
  const leftArm = arms.find((a) => a.s < 0) || arms[1] || arms[0];
  const black = mat(0x0d0d0f, { roughness: 0.5 });
  const glass = mat(0x14324a, { roughness: 0.05, metalness: 0.9 });
  let lampTip = null;
  // camera in de rechterhand, lamp in de linkerhand (schaal: modelruimte, 1 = 1,76 m)
  if (look.cam && rightArm) {
    const h = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.08), black); h.add(box);
    const port = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glass); port.rotation.z = -Math.PI / 2; port.position.x = 0.055; h.add(port);
    if (look.cam === 'pro') [-1, 1].forEach((s) => { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 10), black); st.rotation.z = Math.PI / 2; st.position.set(0.05, 0.07, s * 0.13); h.add(st); });
    const a = anchor(rightArm.wr.b, P.get(rightArm.wr.b).clone().add(new THREE.Vector3(0.05, -0.02, 0)));
    a.add(h);
  }
  if (look.lamp && leftArm) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.02, look.lamp === 'primair' ? 0.11 : 0.08, 10), black);
    lamp.rotation.z = Math.PI / 2;
    const a = anchor(leftArm.wr.b, P.get(leftArm.wr.b).clone().add(new THREE.Vector3(0.025, 0, 0)));
    a.add(lamp);
    lampTip = new THREE.Object3D(); lampTip.position.set(0.06, 0, 0); a.add(lampTip);
  }

  root.userData = { kind: 'gltf', model, pivot, legs, arms, head: headA, headBone: head ? joint(head) : null, neck: neck ? joint(neck) : null, mouth, lampTip: lampTip || mouth, phase: Math.random() * 6, look };
  poseGltf(root.userData, 0, 0.1);
  return root;
}

// gewricht draaien om een as in modelruimte (rustframe), bovenop de rusthouding
function setJoint(j, qModel) {
  // lokaal = rust * (W^-1 * q * W)
  _q2.copy(j.Wi).multiply(qModel).multiply(j.W);
  j.b.quaternion.copy(j.rest).multiply(_q2);
}
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3();

function poseGltf(u, ph, a) {
  // benen: flutter kick vanuit de heup, knie licht gebogen, enkel gestrekt
  u.legs.forEach((l, i) => {
    const p = ph + (i ? Math.PI : 0);
    _qa.setFromAxisAngle(AX.z, Math.sin(p) * a * 0.8 + 0.06);
    _qb.setFromAxisAngle(AX.x, l.s * 0.07);
    setJoint(l.hip, _q.copy(_qb).multiply(_qa));
    setJoint(l.knee, _q.setFromAxisAngle(AX.z, -0.32 - Math.max(0, Math.sin(p - 0.9)) * a * 1.1));
    // enkel: eerst de voet naar binnen draaien (geen 'eendenvoeten'), dan strekken
    _qb.setFromAxisAngle(AX.y, l.s * 0.38);
    _qa.setFromAxisAngle(AX.z, -1.22 + Math.sin(p - 1.7) * a * 0.45);
    setJoint(l.ankle, _q.copy(_qa).multiply(_qb));
  });
  // armen: bovenarm schuin naar beneden-voren, onderarmen gekruist voor de borst
  u.arms.forEach((ar) => {
    _t1.set(0.42, -0.86, ar.s * 0.28).normalize();
    _qa.setFromUnitVectors(ar.upDir, _t1);
    setJoint(ar.sh, _qa);
    _t2.set(0.62, 0.38, -ar.s * 0.68).normalize();
    _qb.copy(_qa).invert();
    _t2.applyQuaternion(_qb);
    setJoint(ar.el, _q.setFromUnitVectors(ar.foreDir, _t2));
  });
  // hoofd achterover zodat de duiker vooruit kijkt
  if (u.neck) setJoint(u.neck, _q.setFromAxisAngle(AX.z, 0.45));
  if (u.headBone) setJoint(u.headBone, _q.setFromAxisAngle(AX.z, u.neck ? 0.5 : 0.95));
}

function animateGltf(d, dt, kick) {
  const u = d.userData;
  u.phase += dt * (1.3 + kick * 3.0);
  poseGltf(u, u.phase, 0.1 + kick * 0.32);
}
