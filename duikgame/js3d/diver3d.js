/* Diepblauw 3D — duiker (speler en buddy), procedureel opgebouwd, kijkt naar -Z */
import * as THREE from 'three';
import { uw } from './water.js';

function mat(color, opts = {}) {
  return uw(new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.05 }, opts)), { caus: true, key: 'diver' + (opts.metalness ? 'm' : '') });
}
function capsule(r, len, m) {
  const g = new THREE.CapsuleGeometry(r, len, 4, 12);
  return new THREE.Mesh(g, m);
}

export function buildDiver(look = {}) {
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
export function animateDiver(d, dt, kick, hideHead) {
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
