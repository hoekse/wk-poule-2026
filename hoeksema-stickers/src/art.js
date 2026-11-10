// Hoeksema Schilderwerken — stickerset
// Alle tekeningen zijn SVG in een vlak van 512 x 512 (WhatsApp/Telegram-formaat).

const C = {
  // Huisstijl (loods-dashboard/CLAUDE.md, hoofdstuk 8)
  red: '#DC0014', yellow: '#F0B400', green: '#8CB400', blue: '#008CDC',
  dark: '#2D2E32', gray: '#646464',
  // Afgeleide tinten
  redLight: '#FF4A55', yellowLight: '#FFD24D', greenLight: '#B5DB3A', blueLight: '#4FB7F0',
  redDark: '#A3000F', yellowDark: '#B88800', greenDark: '#678400', blueDark: '#0068A6',
  ink: '#2A221C',
  white: '#FFFFFF', cream: '#F4EFE6',
  skin: '#E8AB80', skinShade: '#CF8D63', skinDeep: '#B9754D', skinLight: '#F6C9A6', blush: '#F0806C',
  hair: '#8C5631', hairDark: '#5A331A', hairLight: '#B98352', beard: '#5E3B20',
  beret: '#3D3E43', beretShade: '#2B2C30', beretLight: '#5A5B62',
  hoodie: '#DCCBB3', hoodieShade: '#C3AE92', hoodieLight: '#EAE0D0',
  mouth: '#5B1F1B', tongue: '#E8706E',
  metal: '#C9CED4', metalLight: '#F0F2F5', metalDark: '#959DA6',
  wood: '#A0602F', woodDark: '#6E3E1C', woodLight: '#C27D45',
  bristle: '#EBCB8E', bristleDark: '#C9A35F',
  card: '#D8B47A', cardDark: '#B08850',
  glass: '#DDF0FA',
};

// ---------- hulpjes ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;
const ol = (w = 6) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

function heartPath(cx, cy, s) {
  return `M ${f(cx)} ${f(cy + s * 0.95)} C ${f(cx - s * 1.45)} ${f(cy - s * 0.05)}, ${f(cx - s * 0.75)} ${f(cy - s * 1.2)}, ${f(cx)} ${f(cy - s * 0.45)} C ${f(cx + s * 0.75)} ${f(cy - s * 1.2)}, ${f(cx + s * 1.45)} ${f(cy - s * 0.05)}, ${f(cx)} ${f(cy + s * 0.95)} Z`;
}
function heart(cx, cy, s, color = C.red, rot = 0, w = 5) {
  return `<g transform="rotate(${rot} ${cx} ${cy})"><path d="${heartPath(cx, cy, s)}" fill="${color}" ${ol(w)}/>
  <ellipse cx="${f(cx - s * 0.42)}" cy="${f(cy - s * 0.38)}" rx="${f(s * 0.2)}" ry="${f(s * 0.13)}" fill="#fff" opacity=".7" transform="rotate(-35 ${f(cx - s * 0.42)} ${f(cy - s * 0.38)})"/></g>`;
}
function starPath(cx, cy, r, ri = 0.46, pts = 5, rot = -90) {
  let d = '';
  for (let i = 0; i < pts * 2; i++) {
    const rr = i % 2 === 0 ? r : r * ri;
    const a = ((rot + (i * 180) / pts) * Math.PI) / 180;
    d += `${i === 0 ? 'M' : 'L'} ${f(cx + rr * Math.cos(a))} ${f(cy + rr * Math.sin(a))} `;
  }
  return d + 'Z';
}
function sparkle(cx, cy, r, color = C.yellow) {
  const k = r * 0.22;
  return `<path d="M ${cx} ${cy - r} Q ${cx + k} ${cy - k} ${cx + r} ${cy} Q ${cx + k} ${cy + k} ${cx} ${cy + r} Q ${cx - k} ${cy + k} ${cx - r} ${cy} Q ${cx - k} ${cy - k} ${cx} ${cy - r} Z" fill="${color}" ${ol(4)}/>`;
}
// Druppel met ronde onderkant; (cx, cy) = middelpunt van het ronde deel
function dropPath(cx, cy, r) {
  return `M ${f(cx)} ${f(cy - r * 2.3)} C ${f(cx + r * 0.35)} ${f(cy - r * 1.5)}, ${f(cx + r)} ${f(cy - r * 0.8)}, ${f(cx + r)} ${f(cy)} A ${r} ${r} 0 1 1 ${f(cx - r)} ${f(cy)} C ${f(cx - r)} ${f(cy - r * 0.8)}, ${f(cx - r * 0.35)} ${f(cy - r * 1.5)}, ${f(cx)} ${f(cy - r * 2.3)} Z`;
}
function drop(cx, cy, r, color = C.blue, rot = 0, w = 4.5) {
  return `<g transform="rotate(${rot} ${cx} ${cy})"><path d="${dropPath(cx, cy, r)}" fill="${color}" ${ol(w)}/>
  <ellipse cx="${f(cx - r * 0.4)}" cy="${f(cy - r * 0.35)}" rx="${f(r * 0.22)}" ry="${f(r * 0.35)}" fill="#fff" opacity=".75"/></g>`;
}
// Klein logo-kenmerk: vier hoekjes in de huisstijlkleuren met een H erin
function hmark(x, y, s, withInk = true) {
  const p = (d) => d.replace(/([\d.]+) ([\d.]+)/g, (m, a, b) => `${f(x + a * s)} ${f(y + b * s)}`);
  return `<g>
  ${withInk ? `<rect x="${f(x - s * 0.06)}" y="${f(y - s * 0.06)}" width="${f(s * 1.12)}" height="${f(s * 1.12)}" rx="${f(s * 0.08)}" fill="#fff"/>` : ''}
  <path d="${p('M 0 0 L 0.44 0 L 0.44 0.17 L 0.17 0.17 L 0.17 0.46 L 0 0.46 Z')}" fill="${C.blue}"/>
  <path d="${p('M 0.56 0 L 1 0 L 1 0.46 L 0.83 0.46 L 0.83 0.17 L 0.56 0.17 Z')}" fill="${C.yellow}"/>
  <path d="${p('M 0 0.54 L 0.17 0.54 L 0.17 0.83 L 0.44 0.83 L 0.44 1 L 0 1 Z')}" fill="${C.green}"/>
  <path d="${p('M 0.83 0.54 L 1 0.54 L 1 1 L 0.56 1 L 0.56 0.83 L 0.83 0.83 Z')}" fill="${C.red}"/>
  <path d="${p('M 0.3 0.3 L 0.4 0.3 L 0.4 0.45 L 0.6 0.45 L 0.6 0.3 L 0.7 0.3 L 0.7 0.7 L 0.6 0.7 L 0.6 0.55 L 0.4 0.55 L 0.4 0.7 L 0.3 0.7 Z')}" fill="${C.dark}"/>
  </g>`;
}
// Verfspetter
function splat(cx, cy, r, color, seed = 1) {
  const R = rng(seed);
  const n = 9;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.75 + R() * 0.45);
    const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
    if (i === 0) d += `M ${f(x)} ${f(y)} `;
    else {
      const am = ((i - 0.5) / n) * Math.PI * 2;
      const rm = r * (0.55 + R() * 0.2);
      d += `Q ${f(cx + rm * Math.cos(am))} ${f(cy + rm * Math.sin(am))} ${f(x)} ${f(y)} `;
    }
  }
  let dots = '';
  for (let i = 0; i < 4; i++) {
    const a = R() * Math.PI * 2, dist = r * (1.35 + R() * 0.5);
    dots += `<circle cx="${f(cx + dist * Math.cos(a))}" cy="${f(cy + dist * Math.sin(a))}" r="${f(r * (0.12 + R() * 0.12))}" fill="${color}"/>`;
  }
  return `<path d="${d}Z" fill="${color}"/>${dots}`;
}

// Kwaststreek als tekstbanner. width/height in px.
function brushStroke(cx, cy, w, h, color, seed = 7, id = 'bs', textHalf = 0) {
  const R = rng(seed);
  const x0 = cx - w / 2, x1 = cx + w / 2, top = cy - h / 2, bot = cy + h / 2;
  const step = 26;
  let d = `M ${f(x0 + 14)} ${f(top + 2)} `;
  for (let x = x0 + 14 + step; x < x1 - 8; x += step) d += `L ${f(x)} ${f(top + (R() - 0.5) * 5 - Math.sin(((x - x0) / w) * Math.PI) * 3)} `;
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (i % 2 === 0 ? 4 + R() * 16 : -8 - R() * 8);
    d += `L ${f(x)} ${f(top + t * h)} `;
  }
  for (let x = x1 - 14; x > x0 + 14; x -= step) d += `L ${f(x)} ${f(bot + (R() - 0.5) * 5 + Math.sin(((x - x0) / w) * Math.PI) * 2)} `;
  d += `L ${f(x0 + 12)} ${f(bot - 1)} C ${f(x0 - 6)} ${f(bot + 2)}, ${f(x0 - 12)} ${f(top + h * 0.3)}, ${f(x0 + 14)} ${f(top + 2)} Z`;
  // droge-kwast-strepen (gaten) aan het eind
  let gaps = '';
  for (let i = 0; i < 4; i++) {
    const y = top + h * (0.2 + i * 0.2) + (R() - 0.5) * 6;
    const gx0 = Math.max(x1 - w * (0.06 + R() * 0.12), cx + textHalf + 10);
    gaps += `<path d="M ${f(gx0)} ${f(y)} L ${f(x1 + 30)} ${f(y + (R() - 0.5) * 3)}" stroke="#000" stroke-width="${f(2.5 + R() * 3)}" stroke-linecap="round"/>`;
  }
  let streaks = '';
  for (let i = 0; i < 5; i++) {
    const y = top + h * (0.15 + R() * 0.7);
    const sx = x0 + w * R() * 0.4, ex = sx + w * (0.25 + R() * 0.45);
    streaks += `<path d="M ${f(sx)} ${f(y)} L ${f(ex)} ${f(y + (R() - 0.5) * 2)}" stroke="${i % 2 ? '#fff' : '#000'}" stroke-opacity="${i % 2 ? 0.2 : 0.12}" stroke-width="${f(2 + R() * 3)}" stroke-linecap="round"/>`;
  }
  return `<defs><mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"><rect width="512" height="512" fill="#fff"/>${gaps}</mask></defs>
  <g mask="url(#${id}m)"><path d="${d}" fill="${color}"/>${streaks}</g>`;
}

// Tekst op een kwaststreek. Tekst met '\n' wordt twee streken onder elkaar.
// o.tws = gemeten tekstbreedtes per regel bij o.fs
function captionLine(text, tw, fs, color, cx, cy, rot, seed, id) {
  const w = Math.min(470, tw + fs * 1.3), h = fs * 1.42;
  const dark = color === C.yellow;
  const txt = dark ? C.dark : '#fff';
  const sh = { [C.red]: C.redDark, [C.blue]: C.blueDark, [C.green]: C.greenDark, [C.yellow]: C.yellowDark, [C.dark]: '#000' }[color] || '#000';
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<g transform="rotate(${rot} ${cx} ${cy})">
  ${brushStroke(cx, cy, w, h, color, seed, id, tw / 2)}
  <text x="${cx + 2}" y="${f(cy + fs * 0.36 + 3)}" text-anchor="middle" font-family="Saira" font-weight="800" font-size="${fs}" fill="${sh}" opacity="${dark ? 0.25 : 0.6}">${esc}</text>
  <text x="${cx}" y="${f(cy + fs * 0.36)}" text-anchor="middle" font-family="Saira" font-weight="800" font-size="${fs}" fill="${txt}">${esc}</text>
  </g>`;
}
function caption(text, o = {}) {
  const fs = o.fs || 54, color = o.color || C.red, seed = o.seed || 11;
  const lines = text.split('\n');
  if (lines.length === 1) return captionLine(text, o.tws[0], fs, color, 256, o.cy || 432, -4, seed, 'cap0');
  const cy = o.cy || 412;
  return captionLine(lines[0], o.tws[0], fs, color, 240, cy - 30, -5, seed, 'cap0') +
    captionLine(lines[1], o.tws[1], fs, color, 272, cy + 30, -2, seed + 5, 'cap1');
}

// ---------- De Meester ----------
const EL = { x: 222, y: 256 }, ER = { x: 290, y: 256 };

const HAIR_TONES = ['#8C5631', '#97613A', '#7F4C2A', '#8C5631'];
// Eén krul: bol met een open spiraal en een glimlijntje. side = -1 (links) of 1 (rechts)
function curl(cx, cy, r, side = -1, rot = 0, tone = C.hair) {
  const sx = side < 0 ? 1 : -1;
  return `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)}) scale(${sx} 1)">
  <circle cx="0" cy="0" r="${f(r)}" fill="${tone}" ${ol(5)}/>
  <path d="M ${f(-r * 0.5)} ${f(r * 0.05)} C ${f(-r * 0.5)} ${f(-r * 0.5)}, ${f(r * 0.45)} ${f(-r * 0.55)}, ${f(r * 0.42)} ${f(r * 0.05)} C ${f(r * 0.38)} ${f(r * 0.42)}, ${f(-r * 0.1)} ${f(r * 0.4)}, ${f(-r * 0.08)} ${f(r * 0.08)}" fill="none" stroke="${C.hairDark}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M ${f(-r * 0.7)} ${f(-r * 0.15)} Q ${f(-r * 0.6)} ${f(-r * 0.62)} ${f(-r * 0.15)} ${f(-r * 0.72)}" fill="none" stroke="${C.hairLight}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}
// Haar links (x < 256); rechts wordt gespiegeld met eigen variatie
const HAIR_INNER = [[196, 208, 27], [184, 242, 28], [176, 278, 28], [176, 314, 28], [182, 350, 28], [190, 384, 26], [206, 410, 22]];
const HAIR_FILL = [[150, 178, 15], [124, 236, 17], [118, 304, 18], [124, 372, 17], [142, 420, 16]];
const HAIR_OUTER = [[178, 166, 28], [158, 194, 27], [144, 224, 30], [134, 258, 29], [130, 292, 31], [132, 328, 29], [138, 362, 30], [148, 396, 28], [166, 426, 26], [192, 442, 21]];

function hairLayer(list, side, seed) {
  const R = rng(seed);
  return list.map(([x, y, r]) => {
    const jx = (R() - 0.5) * 6, jy = (R() - 0.5) * 6, jr = (R() - 0.5) * 4;
    const X = side < 0 ? x + jx : 512 - x + jx;
    return [X, y + jy, r + jr, side, R() * 360, HAIR_TONES[Math.floor(R() * HAIR_TONES.length)]];
  });
}
function hairBack() {
  let s = '';
  for (const [lst, sd] of [[HAIR_INNER, 21], [HAIR_FILL, 33]]) {
    for (const c of [...hairLayer(lst, -1, sd), ...hairLayer(lst, 1, sd + 100)]) s += curl(...c);
  }
  const L = hairLayer(HAIR_OUTER, -1, 47), Rr = hairLayer(HAIR_OUTER, 1, 147);
  for (let i = L.length - 1; i >= 0; i--) { s += curl(...L[i]); s += curl(...Rr[i]); }
  return s;
}
function hairFront() {
  const L = [[180, 206, 22], [168, 238, 18]];
  return [...hairLayer(L, -1, 61), ...hairLayer(L, 1, 161)].map((c) => curl(...c)).join('');
}

function torso(seed = 3) {
  const R = rng(seed);
  const path = 'M 108 496 C 100 440 128 404 182 392 C 208 386 230 384 256 384 C 282 384 304 386 330 392 C 384 404 412 440 404 496 Q 256 510 108 496 Z';
  let dots = '';
  const cols = [C.red, C.yellow, C.blue, C.green, C.gray, '#fff', C.gray];
  for (let i = 0; i < 46; i++) {
    dots += `<circle cx="${f(110 + R() * 292)}" cy="${f(392 + R() * 110)}" r="${f(1.4 + R() * 2.6)}" fill="${cols[i % cols.length]}" opacity=".85"/>`;
  }
  return `<defs><clipPath id="torsoClip"><path d="${path}"/></clipPath></defs>
  <path d="${path}" fill="${C.hoodie}" ${ol(6)}/>
  <g clip-path="url(#torsoClip)">${dots}
   <path d="M 120 470 Q 140 440 170 430" stroke="${C.hoodieShade}" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="M 392 470 Q 372 440 342 430" stroke="${C.hoodieShade}" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <path d="${path}" fill="none" ${ol(6)}/>
  <ellipse cx="256" cy="388" rx="80" ry="26" fill="${C.hoodieShade}" ${ol(5)}/>`;
}
function neckAndCollar() {
  return `<path d="M 226 330 L 226 398 Q 256 414 286 398 L 286 330 Z" fill="${C.skinShade}" ${ol(5)}/>
  <path d="M 188 394 C 212 430 300 430 324 394 C 334 404 338 414 336 424 C 302 454 210 454 176 424 C 174 414 178 404 188 394 Z" fill="${C.hoodieLight}" ${ol(5)}/>
  <path d="M 238 438 L 234 478" stroke="${C.hoodieShade}" stroke-width="5" stroke-linecap="round"/>
  <path d="M 274 438 L 278 478" stroke="${C.hoodieShade}" stroke-width="5" stroke-linecap="round"/>
  <rect x="229" y="474" width="10" height="16" rx="3" fill="${C.gray}"/>
  <rect x="273" y="474" width="10" height="16" rx="3" fill="${C.gray}"/>
  ${hmark(298, 463, 24, true)}`;
}
function facePath(chinY) {
  return `M 256 158 C 318 158 350 200 348 256 C 346 318 314 ${chinY - 14} 256 ${chinY} C 198 ${chinY - 14} 166 318 164 256 C 162 200 194 158 256 158 Z`;
}

function eye(cx, cy, o = {}, id = 'e') {
  const t = o.type || 'open';
  const dx = o.dx || 0, dy = o.dy || 0;
  switch (t) {
    case 'happy':
      return `<path d="M ${cx - 20} ${cy + 5} Q ${cx} ${cy - 18} ${cx + 20} ${cy + 5}" fill="none" ${ol(7.5)}/>`;
    case 'closed':
      return `<path d="M ${cx - 19} ${cy} Q ${cx} ${cy + 13} ${cx + 19} ${cy}" fill="none" ${ol(7)}/>`;
    case 'squeeze': // dichtgeknepen (huilen)
      return `<path d="M ${cx - 20} ${cy + 2} Q ${cx} ${cy - 10} ${cx + 20} ${cy + 2}" fill="none" ${ol(7.5)}/>
      <path d="M ${cx - 16} ${cy + 10} Q ${cx} ${cy + 4} ${cx + 16} ${cy + 10}" fill="none" ${ol(5)}/>`;
    case 'xl': // >
      return `<path d="M ${cx - 16} ${cy - 15} L ${cx + 14} ${cy} L ${cx - 16} ${cy + 15}" fill="none" ${ol(8)}/>`;
    case 'xr': // <
      return `<path d="M ${cx + 16} ${cy - 15} L ${cx - 14} ${cy} L ${cx + 16} ${cy + 15}" fill="none" ${ol(8)}/>`;
    case 'heart':
      return heart(cx, cy + 2, 25, C.red, cx < 256 ? -8 : 8, 5);
    case 'star':
      return `<path d="${starPath(cx, cy, 27)}" fill="${C.yellow}" ${ol(5)}/><circle cx="${cx - 6}" cy="${cy - 7}" r="4" fill="#fff" opacity=".8"/>`;
    default: {
      const big = t === 'wide';
      const rx = big ? 22 : 19, ry = big ? 28 : 23;
      const ir = big ? 10 : 14.5, pr = big ? 5 : 7.5;
      let lid = '';
      if (o.lid) {
        // lid: [outerOffset, innerOffset] t.o.v. cy; buiten = weg van de neus
        const outer = cx < 256 ? cx - rx - 4 : cx + rx + 4;
        const inner = cx < 256 ? cx + rx + 4 : cx - rx - 4;
        const yo = cy + o.lid[0], yi = cy + o.lid[1];
        lid = `<path d="M ${outer} ${yo} L ${inner} ${yi} L ${inner} ${cy - ry - 6} L ${outer} ${cy - ry - 6} Z" fill="${C.skin}"/>
        <path d="M ${outer + (cx < 256 ? 3 : -3)} ${yo} L ${inner + (cx < 256 ? -3 : 3)} ${yi}" ${ol(6)}/>`;
      }
      return `<defs><clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath></defs>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff"/>
      <g clip-path="url(#${id})">
        <circle cx="${cx + dx}" cy="${cy + dy + 2}" r="${ir}" fill="#6B3B1C"/>
        <circle cx="${cx + dx}" cy="${cy + dy + 2}" r="${pr}" fill="#1B110B"/>
        <circle cx="${cx + dx + ir * 0.38}" cy="${cy + dy - ir * 0.38}" r="${big ? 3.5 : 4.8}" fill="#fff"/>
        <circle cx="${cx + dx - ir * 0.32}" cy="${cy + dy + ir * 0.48}" r="2" fill="#fff" opacity=".8"/>
        ${lid}
      </g>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" ${ol(4.5)}/>
      <path d="M ${cx - rx} ${cy - 2} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy - 2}" fill="none" ${ol(6.5)}/>`;
    }
  }
}

function brows(type = 'normal') {
  const B = {
    normal: ['M 198 222 Q 220 206 244 216', 'M 268 216 Q 292 206 314 222'],
    raised: ['M 198 212 Q 220 194 244 204', 'M 268 204 Q 292 194 314 212'],
    angry: ['M 198 210 Q 222 214 246 230', 'M 266 230 Q 290 214 314 210'],
    sad: ['M 198 226 Q 222 220 244 204', 'M 268 204 Q 290 220 314 226'],
    skeptic: ['M 198 224 Q 220 214 244 220', 'M 268 206 Q 292 192 314 208'],
    flat: ['M 198 220 L 244 218', 'M 268 218 L 314 220'],
  }[type];
  return B.map((d) => `<path d="${d}" fill="none" stroke="#3A2414" stroke-width="12" stroke-linecap="round"/>`).join('');
}

const MOUTH_GY = { smile: 354, grin: 362, laugh: 374, o: 366, scream: 390, frown: 364, sadopen: 374, wavy: 360, kiss: 362, flat: 358, smirk: 358, grit: 366 };
function mouth(type = 'smile') {
  const d = C.mouth;
  switch (type) {
    case 'grin':
      return `<path d="M 220 330 Q 256 380 292 330 Q 256 342 220 330 Z" fill="${d}" ${ol(5)}/>
      <path d="M 225 333 Q 256 344 287 333 L 284 341 Q 256 352 228 341 Z" fill="#fff"/>`;
    case 'laugh':
      return `<defs><clipPath id="mclip"><path d="M 212 328 Q 256 412 300 328 Q 256 340 212 328 Z"/></clipPath></defs>
      <path d="M 212 328 Q 256 412 300 328 Q 256 340 212 328 Z" fill="${d}"/>
      <g clip-path="url(#mclip)"><ellipse cx="256" cy="374" rx="26" ry="15" fill="${C.tongue}"/>
      <path d="M 210 330 Q 256 345 302 330 L 300 341 Q 256 356 212 341 Z" fill="#fff"/></g>
      <path d="M 212 328 Q 256 412 300 328 Q 256 340 212 328 Z" fill="none" ${ol(5)}/>`;
    case 'o':
      return `<ellipse cx="256" cy="348" rx="12" ry="15" fill="${d}" ${ol(5)}/>`;
    case 'scream':
      return `<defs><clipPath id="mclip"><ellipse cx="256" cy="356" rx="21" ry="31"/></clipPath></defs>
      <ellipse cx="256" cy="356" rx="21" ry="31" fill="${d}"/>
      <g clip-path="url(#mclip)"><ellipse cx="256" cy="384" rx="16" ry="11" fill="${C.tongue}"/></g>
      <ellipse cx="256" cy="356" rx="21" ry="31" fill="none" ${ol(5)}/>`;
    case 'frown':
      return `<path d="M 226 358 Q 256 334 286 358" fill="none" ${ol(6.5)}/>`;
    case 'sadopen':
      return `<defs><clipPath id="mclip"><path d="M 220 368 C 224 334 288 334 292 368 Q 256 358 220 368 Z"/></clipPath></defs>
      <path d="M 220 368 C 224 334 288 334 292 368 Q 256 358 220 368 Z" fill="${d}"/>
      <g clip-path="url(#mclip)"><ellipse cx="256" cy="366" rx="20" ry="9" fill="${C.tongue}"/></g>
      <path d="M 220 368 C 224 334 288 334 292 368 Q 256 358 220 368 Z" fill="none" ${ol(5)}/>`;
    case 'wavy':
      return `<path d="M 226 348 q 7.5 -7 15 0 t 15 0 t 15 0 t 15 0" fill="none" ${ol(5.5)}/>`;
    case 'kiss':
      return `<path d="M 250 334 q 14 3 4 10 q 12 4 -2 12" fill="none" ${ol(6)}/>`;
    case 'flat':
      return `<path d="M 234 346 L 278 346" fill="none" ${ol(6.5)}/>`;
    case 'smirk':
      return `<path d="M 228 342 Q 262 354 292 330" fill="none" ${ol(6.5)}/>`;
    case 'grit':
      return `<rect x="226" y="334" width="60" height="24" rx="8" fill="#fff" ${ol(5)}/>
      <path d="M 241 334 L 241 358 M 256 334 L 256 358 M 271 334 L 271 358 M 226 346 L 286 346" ${ol(3)}/>`;
    default:
      return `<path d="M 218 332 Q 256 362 294 332" fill="none" ${ol(6.5)}/>`;
  }
}
function mustache() {
  return `<path d="M 256 306 C 244 298 222 300 210 312 C 204 318 196 320 189 311 C 185 324 196 335 212 333 C 230 331 244 323 256 323 C 268 323 282 331 300 333 C 316 335 327 324 323 311 C 316 320 308 318 302 312 C 290 300 268 298 256 306 Z" fill="${C.beard}" ${ol(4.5)}/>
  <path d="M 236 312 Q 226 314 218 320 M 276 312 Q 286 314 294 320" fill="none" stroke="#3E2614" stroke-width="2.5" stroke-linecap="round"/>`;
}
function goatee(gy) {
  return `<path d="M 241 ${gy} Q 256 ${gy - 5} 271 ${gy} L 264 ${gy + 30} Q 256 ${gy + 41} 248 ${gy + 30} Z" fill="${C.beard}" ${ol(4.5)}/>`;
}
function beret() {
  return `<g transform="rotate(-6 256 140)">
  <path d="M 246 89 C 247 72 262 66 270 78 C 265 85 259 89 254 92 Z" fill="${C.beret}" ${ol(4.5)}/>
  <ellipse cx="250" cy="140" rx="134" ry="55" fill="${C.beret}" ${ol(6)}/>
  <path d="M 148 156 Q 256 214 354 160 Q 348 176 332 184 Q 256 208 168 182 Q 152 172 148 156 Z" fill="${C.beretShade}" ${ol(4)}/>
  <ellipse cx="212" cy="116" rx="66" ry="18" fill="${C.beretLight}" opacity=".55"/>
  <g stroke="${C.yellow}" stroke-width="3.5" stroke-linecap="round">
   ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i * Math.PI) / 4; return `<path d="M ${f(206 + 12 * Math.cos(a))} ${f(122 + 12 * Math.sin(a))} L ${f(206 + 18 * Math.cos(a))} ${f(122 + 18 * Math.sin(a))}"/>`; }).join('')}
  </g>
  <circle cx="206" cy="122" r="8" fill="${C.yellow}"/>
  <circle cx="300" cy="112" r="4.5" fill="${C.red}"/><circle cx="332" cy="134" r="3.5" fill="${C.blue}"/>
  <circle cx="268" cy="104" r="3.2" fill="${C.green}"/><circle cx="176" cy="142" r="2.4" fill="#fff" opacity=".8"/>
  <circle cx="246" cy="134" r="1.8" fill="#fff" opacity=".8"/><circle cx="352" cy="150" r="2.2" fill="${C.red}"/>
  <circle cx="160" cy="128" r="2.6" fill="${C.blue}"/>
  </g>`;
}
function shades() {
  return `<g>
  <path d="M 190 238 L 324 238" ${ol(8)}/>
  <path d="M 192 236 L 250 236 Q 252 268 238 280 Q 222 290 204 280 Q 190 268 192 236 Z" fill="#1E1F24" ${ol(5)}/>
  <path d="M 262 236 L 320 236 Q 322 268 308 280 Q 292 290 274 280 Q 260 268 262 236 Z" fill="#1E1F24" ${ol(5)}/>
  <path d="M 202 246 L 216 246 M 272 246 L 286 246" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
  <path d="M 230 270 L 238 260" stroke="${C.blue}" stroke-width="4" stroke-linecap="round"/>
  <path d="M 300 270 L 308 260" stroke="${C.yellow}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

function handThumb(x, y, s = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
  <rect x="-4" y="54" width="80" height="44" rx="12" fill="${C.hoodie}" ${ol(5)}/>
  <path d="M 4 66 L 68 66 M 4 76 L 68 76" stroke="${C.hoodieShade}" stroke-width="3"/>
  <rect x="10" y="-44" width="28" height="60" rx="14" fill="${C.skin}" ${ol(5)}/>
  <rect x="0" y="-2" width="78" height="62" rx="22" fill="${C.skin}" ${ol(5)}/>
  <path d="M 26 14 Q 50 10 74 16 M 26 30 Q 50 26 76 32 M 26 46 Q 50 42 74 48" fill="none" stroke="${C.skinDeep}" stroke-width="4" stroke-linecap="round"/>
  <path d="M 16 -30 L 16 -10" stroke="${C.skinLight}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}
function handWave(x, y, s = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
  <path d="M -2 150 L 12 62" stroke="${C.ink}" stroke-width="58" stroke-linecap="round"/>
  <path d="M -2 150 L 12 62" stroke="${C.hoodie}" stroke-width="47" stroke-linecap="round"/>
  <rect x="-16" y="40" width="58" height="34" rx="12" fill="${C.hoodieLight}" ${ol(5)}/>
  <g fill="${C.skin}" ${ol(5)}>
   <rect x="-26" y="-58" width="18" height="56" rx="9" transform="rotate(-14 -17 -2)"/>
   <rect x="-8" y="-72" width="18" height="66" rx="9" transform="rotate(-5 1 -6)"/>
   <rect x="11" y="-70" width="18" height="64" rx="9" transform="rotate(4 20 -6)"/>
   <rect x="29" y="-56" width="17" height="52" rx="8.5" transform="rotate(13 37 -4)"/>
   <rect x="-44" y="-8" width="40" height="18" rx="9" transform="rotate(-38 -24 1)"/>
   <rect x="-26" y="-26" width="68" height="70" rx="24"/>
  </g>
  <path d="M -6 -14 L -4 4 M 10 -14 L 10 4 M 26 -12 L 24 4" stroke="${C.skinDeep}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 62 -44 Q 76 -24 64 -2 M 78 -56 Q 98 -26 80 6" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
  <path d="M -56 -50 Q -70 -28 -60 -6" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}
function cloudBubble(cx, cy) {
  const circles = [[cx - 52, cy + 6, 34], [cx - 18, cy - 22, 40], [cx + 28, cy - 18, 38], [cx + 56, cy + 12, 32], [cx + 18, cy + 30, 36], [cx - 26, cy + 32, 32]];
  const trail = [[cx - 70, cy + 64, 13], [cx - 92, cy + 92, 8]];
  const all = [...circles, ...trail];
  return all.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="11"/>`).join('') +
    all.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`).join('') +
    [[C.red, -40, -8], [C.yellow, -6, -8], [C.blue, 28, -8], [C.green, -6, 22]].map(([c, dx, dy], i) =>
      `<rect x="${cx + dx - 14}" y="${cy + dy - 14}" width="30" height="30" rx="7" fill="${c}" ${ol(4)} transform="rotate(${[-8, 4, -4, 6][i]} ${cx + dx} ${cy + dy})"/>`).join('') +
    `<text x="${cx + 36}" y="${cy + 40}" font-family="Saira" font-weight="800" font-size="34" fill="${C.ink}" text-anchor="middle">?</text>`;
}
function bulb(cx, cy) {
  return `<g>
   ${[...Array(9)].map((_, i) => { const a = (-200 + i * 27.5) * Math.PI / 180; return `<path d="M ${f(cx + 50 * Math.cos(a))} ${f(cy + 50 * Math.sin(a))} L ${f(cx + 68 * Math.cos(a))} ${f(cy + 68 * Math.sin(a))}" stroke="${C.ink}" stroke-width="11" stroke-linecap="round"/><path d="M ${f(cx + 50 * Math.cos(a))} ${f(cy + 50 * Math.sin(a))} L ${f(cx + 68 * Math.cos(a))} ${f(cy + 68 * Math.sin(a))}" stroke="${C.yellow}" stroke-width="5" stroke-linecap="round"/>`; }).join('')}
   <path d="M ${cx - 20} ${cy + 34} C ${cx - 20} ${cy + 18} ${cx - 38} ${cy + 10} ${cx - 38} ${cy - 10} A 38 38 0 1 1 ${cx + 38} ${cy - 10} C ${cx + 38} ${cy + 10} ${cx + 20} ${cy + 18} ${cx + 20} ${cy + 34} Z" fill="${C.yellowLight}" ${ol(5)}/>
   <path d="M ${cx - 14} ${cy - 22} A 22 22 0 0 1 ${cx + 4} ${cy - 30}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>
   <path d="M ${cx - 10} ${cy + 30} L ${cx - 8} ${cy + 6} L ${cx} ${cy + 14} L ${cx + 8} ${cy + 6} L ${cx + 10} ${cy + 30}" fill="none" stroke="${C.yellowDark}" stroke-width="3.5" stroke-linejoin="round"/>
   <rect x="${cx - 22}" y="${cy + 32}" width="44" height="12" rx="4" fill="${C.metal}" ${ol(4)}/>
   <rect x="${cx - 20}" y="${cy + 43}" width="40" height="12" rx="4" fill="${C.metalDark}" ${ol(4)}/>
   <path d="M ${cx - 10} ${cy + 55} L ${cx + 10} ${cy + 55} L ${cx + 4} ${cy + 64} L ${cx - 4} ${cy + 64} Z" fill="${C.dark}" ${ol(4)}/>
  </g>`;
}
function steam(cx, cy, flip = 1) {
  const cs = [[0, 0, 18], [16 * flip, -14, 16], [30 * flip, -2, 14], [12 * flip, 12, 13]];
  return cs.map(([dx, dy, r]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="10"/>`).join('') +
    cs.map(([dx, dy, r]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r}" fill="#F2F2F2"/>`).join('');
}
function zzz() {
  return [[372, 190, 44, C.blue], [410, 136, 56, C.green], [448, 78, 68, C.red]].map(([x, y, s, c]) =>
    `<text x="${x}" y="${y}" font-family="Saira" font-weight="800" font-size="${s}" fill="${c}" stroke="${C.ink}" stroke-width="5" paint-order="stroke" stroke-linejoin="round" text-anchor="middle" transform="rotate(-12 ${x} ${y})">Z</text>`).join('');
}
function confetti(seed = 5) {
  const R = rng(seed);
  const cols = [C.red, C.yellow, C.blue, C.green];
  let s = '';
  const spots = [[70, 120], [110, 60], [420, 70], [460, 150], [56, 230], [452, 250], [176, 46], [340, 40], [470, 330], [44, 330]];
  spots.forEach(([x, y], i) => {
    const c = cols[i % 4];
    if (i % 3 === 0) s += `<g>${splat(x, y, 14, c, seed + i)}</g>`;
    else s += `<rect x="${x - 6}" y="${y - 13}" width="12" height="26" rx="4" fill="${c}" ${ol(3.5)} transform="rotate(${f(R() * 180)} ${x} ${y})"/>`;
  });
  return s;
}

/**
 * Bouwt de Meester (borstbeeld).
 * o: eyes {l:{type,dx,dy,lid}, r:{...}}, brows, mouth, tint, extras(after face), front(after all)
 */
function meester(o) {
  const mt = o.mouth || 'smile';
  const chinY = ['laugh', 'scream', 'sadopen'].includes(mt) ? 386 : 372;
  const fp = facePath(chinY);
  const tint = o.tint === 'red'
    ? `<defs><linearGradient id="tint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.red}" stop-opacity=".75"/><stop offset=".75" stop-color="${C.red}" stop-opacity="0"/></linearGradient></defs><path d="${fp}" fill="url(#tint)"/>`
    : o.tint === 'pale'
      ? `<defs><linearGradient id="tint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E8FC4" stop-opacity=".85"/><stop offset=".6" stop-color="#5E8FC4" stop-opacity="0"/></linearGradient></defs><path d="${fp}" fill="url(#tint)"/>`
      : '';
  const el = o.eyes?.l || { type: 'open' }, er = o.eyes?.r || el;
  const blushOp = o.blush ?? 0.45;
  return `<g>
  ${o.behind || ''}
  ${torso(o.seed || 3)}
  ${neckAndCollar()}
  ${hairBack()}
  <path d="${fp}" fill="${C.skin}" ${ol(6)}/>
  <defs><clipPath id="faceClip"><path d="${fp}"/></clipPath></defs>
  <g clip-path="url(#faceClip)">
    <ellipse cx="256" cy="198" rx="100" ry="18" fill="${C.skinShade}" opacity=".55"/>
    <ellipse cx="346" cy="280" rx="26" ry="90" fill="${C.skinShade}" opacity=".35"/>
  </g>
  ${tint}
  <ellipse cx="202" cy="300" rx="18" ry="11" fill="${C.blush}" opacity="${blushOp}"/>
  <ellipse cx="310" cy="300" rx="18" ry="11" fill="${C.blush}" opacity="${blushOp}"/>
  <ellipse cx="256" cy="292" rx="16" ry="12" fill="${C.skinShade}"/>
  <path d="M 242 298 Q 256 308 270 298" fill="none" stroke="${C.skinDeep}" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="251" cy="287" rx="5.5" ry="3.5" fill="${C.skinLight}"/>
  ${mouth(mt)}
  ${mustache()}
  ${goatee(MOUTH_GY[mt])}
  ${eye(EL.x, EL.y, el, 'eyeL')}
  ${eye(ER.x, ER.y, er, 'eyeR')}
  ${o.glasses ? shades() : ''}
  ${hairFront()}
  ${beret()}
  ${brows(o.brows || 'normal')}
  ${o.extras || ''}
  </g>`;
}

// ---------- Gereedschap: kawaii-gezichtjes en armpjes ----------
function kface(cx, cy, s, o = {}) {
  const ex = 30 * s;
  const eyeT = o.eyes || 'dot';
  const one = (x, side) => {
    let t = eyeT;
    if (eyeT === 'wink' && side > 0) t = 'happy';
    if (eyeT === 'wink' && side < 0) t = 'dot';
    switch (t) {
      case 'happy': return `<path d="M ${f(x - 11 * s)} ${f(cy + 4 * s)} Q ${f(x)} ${f(cy - 12 * s)} ${f(x + 11 * s)} ${f(cy + 4 * s)}" fill="none" ${ol(6 * s)}/>`;
      case 'closed': return `<path d="M ${f(x - 11 * s)} ${f(cy)} Q ${f(x)} ${f(cy + 9 * s)} ${f(x + 11 * s)} ${f(cy)}" fill="none" ${ol(6 * s)}/>`;
      case 'star': return `<path d="${starPath(x, cy, 16 * s)}" fill="${C.yellow}" ${ol(4 * s)}/>`;
      case 'xd': return side < 0
        ? `<path d="M ${f(x - 9 * s)} ${f(cy - 10 * s)} L ${f(x + 9 * s)} ${f(cy)} L ${f(x - 9 * s)} ${f(cy + 10 * s)}" fill="none" ${ol(6.5 * s)}/>`
        : `<path d="M ${f(x + 9 * s)} ${f(cy - 10 * s)} L ${f(x - 9 * s)} ${f(cy)} L ${f(x + 9 * s)} ${f(cy + 10 * s)}" fill="none" ${ol(6.5 * s)}/>`;
      case 'wide': return `<ellipse cx="${f(x)}" cy="${f(cy)}" rx="${f(13 * s)}" ry="${f(16 * s)}" fill="#fff" ${ol(4.5 * s)}/><circle cx="${f(x)}" cy="${f(cy + 2 * s)}" r="${f(6.5 * s)}" fill="${C.ink}"/><circle cx="${f(x + 2.5 * s)}" cy="${f(cy - 1 * s)}" r="${f(2.2 * s)}" fill="#fff"/>`;
      case 'heart': return heart(x, cy, 15 * s, C.red, 0, 4 * s);
      default: return `<ellipse cx="${f(x)}" cy="${f(cy)}" rx="${f(9 * s)}" ry="${f(12.5 * s)}" fill="${C.ink}"/><circle cx="${f(x + 3 * s)}" cy="${f(cy - 4.5 * s)}" r="${f(3.6 * s)}" fill="#fff"/><circle cx="${f(x - 3 * s)}" cy="${f(cy + 5 * s)}" r="${f(1.8 * s)}" fill="#fff"/>`;
    }
  };
  let eyes = one(cx - ex, -1) + one(cx + ex, 1);
  if (eyeT === 'shades') {
    eyes = `<path d="M ${f(cx - ex - 24 * s)} ${f(cy - 8 * s)} L ${f(cx + ex + 24 * s)} ${f(cy - 8 * s)}" ${ol(6 * s)}/>
    <path d="M ${f(cx - ex - 22 * s)} ${f(cy - 10 * s)} L ${f(cx - 6 * s)} ${f(cy - 10 * s)} Q ${f(cx - 6 * s)} ${f(cy + 16 * s)} ${f(cx - ex)} ${f(cy + 16 * s)} Q ${f(cx - ex - 22 * s)} ${f(cy + 16 * s)} ${f(cx - ex - 22 * s)} ${f(cy - 10 * s)} Z" fill="#1E1F24" ${ol(4 * s)}/>
    <path d="M ${f(cx + 6 * s)} ${f(cy - 10 * s)} L ${f(cx + ex + 22 * s)} ${f(cy - 10 * s)} Q ${f(cx + ex + 22 * s)} ${f(cy + 16 * s)} ${f(cx + ex)} ${f(cy + 16 * s)} Q ${f(cx + 6 * s)} ${f(cy + 16 * s)} ${f(cx + 6 * s)} ${f(cy - 10 * s)} Z" fill="#1E1F24" ${ol(4 * s)}/>
    <path d="M ${f(cx - ex - 14 * s)} ${f(cy - 3 * s)} L ${f(cx - ex - 4 * s)} ${f(cy - 3 * s)} M ${f(cx + 14 * s)} ${f(cy - 3 * s)} L ${f(cx + 24 * s)} ${f(cy - 3 * s)}" stroke="#fff" stroke-width="${f(4 * s)}" stroke-linecap="round"/>`;
  }
  let browsS = '';
  if (o.brows === 'worried') browsS = `<path d="M ${f(cx - ex - 12 * s)} ${f(cy - 18 * s)} L ${f(cx - ex + 10 * s)} ${f(cy - 26 * s)} M ${f(cx + ex + 12 * s)} ${f(cy - 18 * s)} L ${f(cx + ex - 10 * s)} ${f(cy - 26 * s)}" ${ol(5 * s)}/>`;
  if (o.brows === 'up') browsS = `<path d="M ${f(cx - ex - 10 * s)} ${f(cy - 24 * s)} Q ${f(cx - ex)} ${f(cy - 32 * s)} ${f(cx - ex + 10 * s)} ${f(cy - 24 * s)} M ${f(cx + ex - 10 * s)} ${f(cy - 24 * s)} Q ${f(cx + ex)} ${f(cy - 32 * s)} ${f(cx + ex + 10 * s)} ${f(cy - 24 * s)}" fill="none" ${ol(5 * s)}/>`;
  const my = cy + 24 * s;
  const mt = o.mouth || 'smile';
  let m = '';
  const id = o.id || 'km';
  switch (mt) {
    case 'open':
      m = `<defs><clipPath id="${id}"><path d="M ${f(cx - 17 * s)} ${f(my - 3 * s)} Q ${f(cx)} ${f(my + 28 * s)} ${f(cx + 17 * s)} ${f(my - 3 * s)} Z"/></clipPath></defs>
      <path d="M ${f(cx - 17 * s)} ${f(my - 3 * s)} Q ${f(cx)} ${f(my + 28 * s)} ${f(cx + 17 * s)} ${f(my - 3 * s)} Z" fill="${C.mouth}"/>
      <g clip-path="url(#${id})"><ellipse cx="${f(cx)}" cy="${f(my + 12 * s)}" rx="${f(10 * s)}" ry="${f(6 * s)}" fill="${C.tongue}"/></g>
      <path d="M ${f(cx - 17 * s)} ${f(my - 3 * s)} Q ${f(cx)} ${f(my + 28 * s)} ${f(cx + 17 * s)} ${f(my - 3 * s)} Z" fill="none" ${ol(4.5 * s)}/>`;
      break;
    case 'grin':
      m = `<path d="M ${f(cx - 18 * s)} ${f(my - 3 * s)} Q ${f(cx)} ${f(my + 26 * s)} ${f(cx + 18 * s)} ${f(my - 3 * s)} Z" fill="${C.mouth}" ${ol(4.5 * s)}/>
      <path d="M ${f(cx - 15 * s)} ${f(my - 1 * s)} L ${f(cx + 15 * s)} ${f(my - 1 * s)} L ${f(cx + 12 * s)} ${f(my + 5 * s)} L ${f(cx - 12 * s)} ${f(my + 5 * s)} Z" fill="#fff"/>`;
      break;
    case 'o':
      m = `<ellipse cx="${f(cx)}" cy="${f(my + 4 * s)}" rx="${f(8 * s)}" ry="${f(10 * s)}" fill="${C.mouth}" ${ol(4.5 * s)}/>`;
      break;
    case 'wavy':
      m = `<path d="M ${f(cx - 18 * s)} ${f(my + 2 * s)} q ${f(4.5 * s)} ${f(-5 * s)} ${f(9 * s)} 0 t ${f(9 * s)} 0 t ${f(9 * s)} 0 t ${f(9 * s)} 0" fill="none" ${ol(4.5 * s)}/>`;
      break;
    case 'smirk':
      m = `<path d="M ${f(cx - 14 * s)} ${f(my + 2 * s)} Q ${f(cx + 4 * s)} ${f(my + 10 * s)} ${f(cx + 18 * s)} ${f(my - 6 * s)}" fill="none" ${ol(5.5 * s)}/>`;
      break;
    case 'tongue':
      m = `<path d="M ${f(cx - 6 * s)} ${f(my + 4 * s)} Q ${f(cx - 6 * s)} ${f(my + 22 * s)} ${f(cx + 4 * s)} ${f(my + 20 * s)} Q ${f(cx + 10 * s)} ${f(my + 18 * s)} ${f(cx + 8 * s)} ${f(my + 4 * s)} Z" fill="${C.tongue}" ${ol(4 * s)}/>
      <path d="M ${f(cx - 16 * s)} ${f(my)} Q ${f(cx)} ${f(my + 12 * s)} ${f(cx + 16 * s)} ${f(my)}" fill="none" ${ol(5.5 * s)}/>`;
      break;
    default:
      m = `<path d="M ${f(cx - 15 * s)} ${f(my)} Q ${f(cx)} ${f(my + 14 * s)} ${f(cx + 15 * s)} ${f(my)}" fill="none" ${ol(5.5 * s)}/>`;
  }
  const bl = o.blush === false ? '' : `<ellipse cx="${f(cx - ex - 14 * s)}" cy="${f(cy + 15 * s)}" rx="${f(10 * s)}" ry="${f(6.5 * s)}" fill="${C.blush}" opacity=".6"/><ellipse cx="${f(cx + ex + 14 * s)}" cy="${f(cy + 15 * s)}" rx="${f(10 * s)}" ry="${f(6.5 * s)}" fill="${C.blush}" opacity=".6"/>`;
  return bl + eyes + browsS + m;
}
// Rubberslang-armpje met witte handschoen
function arm(x1, y1, cx, cy, x2, y2, glove = 'open', grot = 0) {
  let g;
  if (glove === 'thumb') {
    g = `<g transform="rotate(${grot} ${x2} ${y2})"><rect x="${x2 - 7}" y="${y2 - 34}" width="14" height="28" rx="7" fill="#fff" ${ol(4.5)}/><circle cx="${x2}" cy="${y2}" r="15" fill="#fff" ${ol(4.5)}/><path d="M ${x2 - 6} ${y2 - 2} L ${x2 + 8} ${y2 - 2} M ${x2 - 6} ${y2 + 6} L ${x2 + 8} ${y2 + 6}" ${ol(2.5)}/></g>`;
  } else if (glove === 'wave') {
    g = `<circle cx="${x2}" cy="${y2}" r="15" fill="#fff" ${ol(4.5)}/>
    <path d="M ${x2 + 20} ${y2 - 18} Q ${x2 + 30} ${y2 - 4} ${x2 + 22} ${y2 + 10} M ${x2 - 22} ${y2 - 22} Q ${x2 - 32} ${y2 - 6} ${x2 - 24} ${y2 + 8}" fill="none" ${ol(4)}/>`;
  } else {
    g = `<circle cx="${x2}" cy="${y2}" r="15" fill="#fff" ${ol(4.5)}/>`;
  }
  return `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>${g}`;
}
function legs(x1, y1, x2, y2, bend = 0) {
  return [[x1, y1, -1], [x2, y2, 1]].map(([x, y, sd], i) => {
    const kx = x + (i === 0 ? -bend : bend);
    return `<path d="M ${x} ${y} Q ${kx} ${y + 30} ${x + sd * 6} ${y + 52}" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
    <ellipse cx="${x + sd * 14}" cy="${y + 56}" rx="20" ry="10" fill="${C.dark}" ${ol(4)}/>`;
  }).join('');
}
function speedLines(x, y, n = 3, len = 60, gap = 22) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<path d="M ${x} ${y + i * gap} L ${x - len + i * 12} ${y + i * gap}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" opacity=".85"/>`;
  return s;
}

module.exports = { C, f, ol, rng, heart, heartPath, starPath, sparkle, drop, dropPath, hmark, splat, brushStroke, caption, meester, kface, arm, legs, speedLines, handThumb, handWave, cloudBubble, bulb, steam, zzz, confetti, EL, ER };
