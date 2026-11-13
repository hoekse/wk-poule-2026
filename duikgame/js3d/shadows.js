/* Diepblauw 3D — zachte schaduwen op de bodem onder duikers, schildpadden, roggen en vissen.
   Goedkoop: één geïnstanceerd vlakje per dier met een zachte ellips, vager naarmate het dier
   hoger boven de bodem zwemt en verder van de camera is. */
import * as THREE from 'three';
import { seabed } from './terrain.js';

export class BlobShadows {
  constructor(scene, max = 700) {
    this.max = max;
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    this.str = new Float32Array(max);
    geo.setAttribute('aStr', new THREE.InstancedBufferAttribute(this.str, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      vertexShader: /* glsl */ `
        attribute float aStr;
        varying vec2 vUv; varying float vS; varying float vD;
        void main() {
          vUv = uv; vS = aStr;
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vD = distance(wp.xyz, cameraPosition);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv; varying float vS; varying float vD;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          float a = min(0.75, pow(1.0 - smoothstep(0.0, 1.0, r), 1.2) * vS * 1.7 * exp(-vD / 40.0));
          if (a < 0.004) discard;
          gl_FragColor = vec4(0.0, 0.025, 0.05, a);
        }`,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, max);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.s = new THREE.Vector3();
    this.p = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.n = 0;
  }
  begin(cam) { this.n = 0; this.cam = cam; }
  // breedte w, lengte l (langs de kijkrichting yaw), kracht 0..1
  add(x, y, z, w, l, yaw, strength) {
    if (this.n >= this.max) return;
    if (this.cam && (x - this.cam.x) ** 2 + (z - this.cam.z) ** 2 > 32 * 32) return;
    const fl = seabed(x, z);
    const h = y - fl;
    if (h > 9 || h < -0.5) return;
    const k = strength * Math.max(0, 1 - h / 9) * Math.min(1, 0.5 + h * 0.6);
    if (k < 0.02) return;
    const spread = 1 + h * 0.18; // hoger = groter en zachter
    this.p.set(x + h * 0.08, fl + 0.2, z + h * 0.05); // iets boven de berekende bodem: het bodemraster wijkt een paar cm af
    this.q.setFromAxisAngle(this.up, yaw);
    this.s.set(w * spread, 1, l * spread);
    this.m.compose(this.p, this.q, this.s);
    this.mesh.setMatrixAt(this.n, this.m);
    this.str[this.n] = k;
    this.n++;
  }
  end() {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.geometry.attributes.aStr.needsUpdate = true;
  }
}
