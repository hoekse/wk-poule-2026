/* Diepblauw 3D — water: kleurverlies, zicht, caustics, lamp, oppervlak, lichtstralen, zwevende deeltjes */
import * as THREE from 'three';

// Gedeelde uniforms voor alle onderwatermaterialen
export const UW = {
  uTime: { value: 0 },
  // licht dat langs de kijkrichting verdwijnt (per meter, r/g/b): helder Bonaire-water, ±60 m zicht in blauw
  uAbs: { value: new THREE.Vector3(0.115, 0.036, 0.021) },
  // daglicht dat met de diepte verzwakt (per meter diepte)
  uDown: { value: new THREE.Vector3(0.072, 0.02, 0.0095) },
  uWaterTop: { value: new THREE.Color(0x6fe0f6) },
  uWaterDeep: { value: new THREE.Color(0x0d5596) },
  uCaus: { value: 1.0 },
  uCausTex: { value: null },
  uLampOn: { value: 0 },
  uLampPos: { value: new THREE.Vector3() },
  uLampDir: { value: new THREE.Vector3(0, 0, -1) },
  uLampCos: { value: 0.9 },
  uLampRange: { value: 8 },
  uLampPower: { value: 1.6 },
  uShade: { value: 1.0 },
};

const GLSL_PARS = /* glsl */ `
uniform float uTime;
uniform vec3 uAbs;
uniform vec3 uDown;
uniform vec3 uWaterTop;
uniform vec3 uWaterDeep;
uniform float uCaus;
uniform sampler2D uCausTex;
uniform float uLampOn;
uniform vec3 uLampPos;
uniform vec3 uLampDir;
uniform float uLampCos;
uniform float uLampRange;
uniform float uLampPower;
uniform float uShade;
varying vec3 vWPos;

vec3 uwWaterColor(vec3 dir, float depthMid) {
  float up = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 c = mix(uWaterDeep, uWaterTop, pow(up, 1.7));
  return c * exp(-uDown * depthMid * 0.65);
}
// schaduw van de pier (dek boven water) op alles eronder
float uwPierShade(vec2 p) {
  float s = 0.0;
  // hoofdpier: x van -122 tot -3, breedte ±2.6 m
  s = max(s, (1.0 - smoothstep(1.6, 3.4, abs(p.y))) * smoothstep(-124.0, -118.0, p.x) * (1.0 - smoothstep(-5.0, -1.0, p.x)));
  // laadkop in het midden
  s = max(s, (1.0 - smoothstep(5.0, 8.0, abs(p.y))) * (1.0 - smoothstep(6.0, 10.0, abs(p.x + 120.0))));
  return 1.0 - 0.55 * s * uShade;
}
// onderwater-afstand langs de kijkstraal (rekening houdend met het oppervlak)
float uwUnderPath(vec3 wp) {
  float dist = length(wp - cameraPosition);
  float cy = cameraPosition.y, fy = wp.y;
  if (cy <= 0.0 && fy <= 0.0) return dist;
  if (cy > 0.0 && fy > 0.0) return 0.0;
  float s = cy / (cy - fy);
  return cy <= 0.0 ? dist * s : dist * (1.0 - s);
}
`;

const GLSL_APPLY = /* glsl */ `
{
  vec3 uwC = gl_FragColor.rgb;
  float uwDep = max(0.0, -vWPos.y);
  #ifdef UW_LIT
    vec3 uwN = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
    #ifdef UW_CAUS
      if (vWPos.y < 0.5) {
        vec2 cp = vWPos.xz * 0.16;
        float c1 = texture2D(uCausTex, cp + vec2(uTime * 0.021, uTime * 0.012)).r;
        float c2 = texture2D(uCausTex, cp * 1.21 + vec2(-uTime * 0.016, uTime * 0.025)).r;
        float cs = min(c1, c2);
        float upF = clamp(uwN.y * 0.85 + 0.15, 0.0, 1.0);
        uwC += diffuseColor.rgb * cs * uCaus * upF * 2.6 * exp(-uwDep * 0.075) * uwPierShade(vWPos.xz);
      }
    #endif
  #endif
  if (vWPos.y < 0.0) {
    uwC *= exp(-uDown * uwDep);
    uwC *= uwPierShade(vWPos.xz);
  }
  #ifdef UW_LIT
    if (uLampOn > 0.5) {
      vec3 Lv = uLampPos - vWPos;
      float dl = length(Lv);
      vec3 ld = Lv / max(dl, 0.001);
      float spot = smoothstep(uLampCos, uLampCos + 0.06, dot(-ld, uLampDir));
      float ndl = max(dot(uwN, ld), 0.0) * 0.75 + 0.25;
      float fall = (1.0 - smoothstep(uLampRange * 0.6, uLampRange, dl)) / (1.0 + dl * dl * 0.05);
      uwC += diffuseColor.rgb * spot * ndl * fall * uLampPower * exp(-uAbs * dl * 0.6);
    }
  #endif
  float uwL = uwUnderPath(vWPos);
  if (uwL > 0.0) {
    vec3 vd = normalize(vWPos - cameraPosition);
    float midD = max(0.0, -0.5 * (min(vWPos.y, 0.0) + min(cameraPosition.y, 0.0)));
    vec3 T = exp(-uAbs * uwL);
    uwC = uwC * T + uwWaterColor(vd, midD) * (1.0 - T);
  }
  gl_FragColor.rgb = uwC;
}
`;

const VERT_PARS = 'varying vec3 vWPos;\n';
const VERT_WPOS = /* glsl */ `
{
  vec4 uwWP = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    uwWP = batchingMatrix * uwWP;
  #endif
  #ifdef USE_INSTANCING
    uwWP = instanceMatrix * uwWP;
  #endif
  vWPos = (modelMatrix * uwWP).xyz;
}
`;

/**
 * Maak een standaardmateriaal geschikt voor onder water.
 * opts: { lit, caus, extraVertex(shader), key }
 */
export function uw(material, opts = {}) {
  const lit = opts.lit !== false;
  const caus = !!opts.caus;
  material.onBeforeCompile = (shader) => {
    Object.keys(UW).forEach((k) => (shader.uniforms[k] = UW[k]));
    if (opts.uniforms) Object.assign(shader.uniforms, opts.uniforms);
    let defs = '';
    if (lit) defs += '#define UW_LIT\n';
    if (caus) defs += '#define UW_CAUS\n';
    shader.vertexShader = VERT_PARS + (opts.vertexPars || '') + shader.vertexShader.replace('#include <fog_vertex>', '#include <fog_vertex>\n' + VERT_WPOS);
    if (opts.vertexBegin) shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + opts.vertexBegin);
    if (opts.vertexUv) shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n' + opts.vertexUv);
    shader.fragmentShader = defs + GLSL_PARS + (opts.fragmentPars || '') + shader.fragmentShader.replace('#include <fog_fragment>', GLSL_APPLY);
    if (opts.fragmentColor) shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + opts.fragmentColor);
  };
  material.customProgramCacheKey = () => 'uw' + (lit ? 1 : 0) + (caus ? 1 : 0) + (opts.key || '');
  material.fog = true;
  return material;
}

/* ---------------- caustics-textuur (tegelbaar Voronoi-netwerk) ---------------- */
export function makeCausticTexture(size = 256) {
  const pts = [];
  let s = 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 28; i++) pts.push([rnd(), rnd()]);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      let f1 = 9, f2 = 9;
      for (const p of pts) {
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const dx = p[0] + ox - u, dy = p[1] + oy - v;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
          }
        }
      }
      const e = f2 - f1;
      let c = 1 - Math.min(1, e / 0.055);
      c = Math.pow(c, 2.2) * 0.95 + Math.max(0, 0.12 - f1) * 1.2;
      const b = Math.max(0, Math.min(255, Math.round(c * 255)));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/* ---------------- lucht/water-koepel ---------------- */
export function makeDome() {
  const geo = new THREE.SphereGeometry(900, 48, 24);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: Object.assign({ uSun: { value: new THREE.Vector3(0.35, 0.85, -0.4).normalize() } }, UW),
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * p;
        gl_Position.z = gl_Position.w * 0.9999;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uWaterTop; uniform vec3 uWaterDeep; uniform vec3 uDown; uniform vec3 uSun;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float camD = max(0.0, -cameraPosition.y);
        vec3 col;
        if (cameraPosition.y < 0.0) {
          float up = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
          float dm = d.y > 0.0 ? camD * 0.5 : camD + (-d.y) * 30.0;
          col = mix(uWaterDeep, uWaterTop, pow(up, 1.7)) * exp(-uDown * dm * 0.65);
        } else {
          float h = clamp(d.y, 0.0, 1.0);
          col = mix(vec3(0.82, 0.92, 0.98), vec3(0.32, 0.62, 0.92), pow(h, 0.55));
          float sd = max(dot(d, uSun), 0.0);
          col += vec3(1.0, 0.95, 0.85) * (pow(sd, 900.0) * 6.0 + pow(sd, 24.0) * 0.25);
          if (d.y < 0.0) col = mix(vec3(0.05, 0.38, 0.55), vec3(0.2, 0.55, 0.7), clamp(1.0 + d.y * 6.0, 0.0, 1.0));
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  m.renderOrder = -10;
  return m;
}

/* ---------------- wateroppervlak (van onder én boven) ---------------- */
export function makeSurface() {
  const geo = new THREE.PlaneGeometry(1600, 1600, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: Object.assign({ uSun: { value: new THREE.Vector3(0.35, 0.85, -0.4).normalize() } }, UW),
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uAbs; uniform vec3 uDown; uniform vec3 uWaterTop; uniform vec3 uWaterDeep; uniform vec3 uSun;
      varying vec3 vW;
      vec3 rippleN(vec2 p) {
        float t = uTime;
        float dx = 0.0, dz = 0.0;
        dx += cos(p.x * 0.9 + t * 1.3) * 0.06; dz += cos(p.y * 0.7 - t * 1.1) * 0.05;
        dx += cos((p.x + p.y) * 1.7 + t * 2.1) * 0.03; dz += cos((p.y - p.x) * 2.3 - t * 1.7) * 0.03;
        dx += cos(p.x * 4.1 - t * 3.0) * 0.012; dz += cos(p.y * 3.7 + t * 2.7) * 0.012;
        return normalize(vec3(-dx, 1.0, -dz));
      }
      void main() {
        vec3 n = rippleN(vW.xz);
        vec3 v = normalize(vW - cameraPosition);
        float dist = length(vW - cameraPosition);
        if (cameraPosition.y < 0.0) {
          // van onder: venster van Snellius + totale interne reflectie
          float c = dot(v, n);
          float win = smoothstep(0.60, 0.72, c);
          vec3 sky = vec3(0.86, 0.96, 1.0) * 1.35;
          float sun = pow(max(dot(refract(v, -n, 1.33), uSun), 0.0), 60.0);
          vec3 tir = mix(uWaterDeep, uWaterTop, 0.55) * 0.8;
          vec3 col = mix(tir, sky + sun * 2.0, win);
          col += vec3(0.6, 0.8, 0.9) * pow(max(0.0, n.x * 4.0 + n.z * 3.0), 2.0) * 0.4;
          float camD = -cameraPosition.y;
          vec3 T = exp(-uAbs * dist);
          float upw = clamp(v.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 wcol = mix(uWaterDeep, uWaterTop, pow(upw, 1.7)) * exp(-uDown * camD * 0.5 * 0.65);
          col = col * T + wcol * (1.0 - T);
          float a = mix(1.0, 0.42, win * T.b);
          gl_FragColor = vec4(col, a);
        } else {
          // van boven: turquoise met luchtweerspiegeling
          float fres = pow(1.0 - max(dot(-v, n), 0.0), 4.0);
          vec3 sky = mix(vec3(0.75, 0.88, 0.97), vec3(0.35, 0.62, 0.9), 0.4);
          vec3 sea = vec3(0.12, 0.62, 0.72);
          vec3 col = mix(sea, sky, clamp(fres * 1.4, 0.0, 1.0));
          float gl = pow(max(dot(reflect(v, n), uSun), 0.0), 220.0);
          col += vec3(1.0, 0.95, 0.85) * gl * 3.0;
          float a = clamp(0.35 + fres * 0.6 + dist * 0.004, 0.0, 0.92);
          gl_FragColor = vec4(col, a);
        }
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 10;
  return m;
}

/* ---------------- lichtstralen ---------------- */
export function makeRays(count = 26) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1, 1, 1, 8);
  geo.translate(0, -0.5, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTime: UW.uTime, uFade: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vDist; varying float vY;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vY = w.y;
        vDist = length(w.xyz - cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uFade;
      varying vec2 vUv; varying float vDist; varying float vY;
      void main() {
        float edge = sin(vUv.x * 3.14159);
        edge = pow(edge, 2.0);
        float along = pow(vUv.y, 1.6) * smoothstep(1.0, 0.96, vUv.y);
        float flick = 0.65 + 0.35 * sin(uTime * 0.9 + vUv.x * 4.0 + vY * 0.1);
        float near = smoothstep(0.5, 4.0, vDist) * (1.0 - smoothstep(35.0, 60.0, vDist));
        float a = edge * along * flick * near * 0.11 * uFade;
        gl_FragColor = vec4(vec3(0.85, 0.97, 1.0) * a, a);
      }`,
  });
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat);
    m.userData = { w: 1.2 + Math.random() * 3.2, len: 18 + Math.random() * 16, ph: Math.random() * 10, ox: 0, oz: 0 };
    m.frustumCulled = false;
    group.add(m);
  }
  group.userData.mat = mat;
  return group;
}

export function updateRays(group, cam, t, inShadow) {
  const fade = Math.max(0, 1 - Math.max(0, -cam.position.y) / 32);
  group.userData.mat.uniforms.uFade.value = cam.position.y < 0 ? fade : 0;
  group.children.forEach((m, i) => {
    const u = m.userData;
    const dx = m.position.x - cam.position.x, dz = m.position.z - cam.position.z;
    if (!u.placed || dx * dx + dz * dz > 40 * 40) {
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 34;
      m.position.set(cam.position.x + Math.cos(a) * r, 0.2, cam.position.z + Math.sin(a) * r);
      u.placed = true;
    }
    const shade = inShadow(m.position.x, m.position.z) ? 0.15 : 1;
    m.scale.set(u.w * shade, u.len, 1);
    // cilindrisch billboard, licht schuin (zon)
    const ang = Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z);
    m.rotation.set(0, ang, 0);
    m.rotateX(0.0);
    m.rotation.z = Math.sin(t * 0.15 + u.ph) * 0.04 + 0.18;
  });
}

/* ---------------- zwevende deeltjes ---------------- */
export function makeParticles(n = 1600) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), sz = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = Math.random() * 30; pos[i * 3 + 1] = Math.random() * 30; pos[i * 3 + 2] = Math.random() * 30;
    sz[i] = 0.4 + Math.random() * 1.2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: Object.assign({ uPx: { value: 1 } }, UW),
    vertexShader: /* glsl */ `
      attribute float aSize; uniform float uTime; uniform float uPx;
      varying float vA; varying float vY;
      void main() {
        vec3 p = position + vec3(uTime * 0.05, -uTime * 0.02, uTime * 0.03);
        vec3 c = cameraPosition;
        p = mod(p - c + 15.0, 30.0) - 15.0 + c;
        vY = p.y;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        vA = smoothstep(0.3, 1.5, d) * (1.0 - smoothstep(9.0, 15.0, d));
        gl_PointSize = aSize * uPx * 18.0 / max(d, 0.3);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vA; varying float vY;
      void main() {
        if (vY > -0.2) discard;
        vec2 q = gl_PointCoord - 0.5;
        float r = length(q);
        float a = smoothstep(0.5, 0.15, r) * vA * 0.55;
        gl_FragColor = vec4(vec3(0.92, 0.97, 0.95), a);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

/* ---------------- luchtbellen ---------------- */
export function makeBubbles(max = 500) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(max * 3), sz = new Float32Array(max);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  geo.setDrawRange(0, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uPx: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSize; uniform float uPx;
      void main() {
        vec4 mv = viewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPx * 900.0 / max(-mv.z, 0.2);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float r = length(q);
        if (r > 0.5) discard;
        float rim = smoothstep(0.3, 0.48, r) * 0.85;
        float hl = smoothstep(0.14, 0.0, length(q - vec2(-0.15, -0.15)));
        gl_FragColor = vec4(vec3(0.92, 0.99, 1.0), max(rim, hl) * 0.9 + 0.08);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.userData = { list: [], max };
  return pts;
}
export function spawnBubbles(b, x, y, z, n, big) {
  const L = b.userData.list;
  for (let i = 0; i < n && L.length < b.userData.max; i++) {
    L.push({ x: x + (Math.random() - 0.5) * 0.06, y: y + (Math.random() - 0.5) * 0.05, z: z + (Math.random() - 0.5) * 0.06, r0: (big ? 0.012 : 0.006) + Math.random() * (big ? 0.03 : 0.016), d0: Math.max(0.5, -y), wob: Math.random() * 6, delay: i * 0.035 });
  }
}
export function updateBubbles(b, dt) {
  const L = b.userData.list;
  const pos = b.geometry.attributes.position.array, sz = b.geometry.attributes.aSize.array;
  let n = 0;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    if (q.delay > 0) { q.delay -= dt; continue; }
    const r = q.r0 * Math.cbrt((q.d0 + 10) / (Math.max(0, -q.y) + 10));
    q.y += (0.5 + r * 14) * dt;
    q.wob += dt * 8;
    q.x += Math.sin(q.wob) * 0.1 * dt;
    q.z += Math.cos(q.wob * 0.8) * 0.08 * dt;
    if (q.y > -0.05) { L.splice(i, 1); continue; }
  }
  for (const q of L) {
    if (q.delay > 0) continue;
    if (n >= b.userData.max) break;
    pos[n * 3] = q.x; pos[n * 3 + 1] = q.y; pos[n * 3 + 2] = q.z;
    sz[n] = q.r0 * Math.cbrt((q.d0 + 10) / (Math.max(0, -q.y) + 10));
    n++;
  }
  b.geometry.setDrawRange(0, n);
  b.geometry.attributes.position.needsUpdate = true;
  b.geometry.attributes.aSize.needsUpdate = true;
}
