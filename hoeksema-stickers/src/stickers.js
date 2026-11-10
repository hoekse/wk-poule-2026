// Alle stickers: De Meester (pakket 1) en Het Gereedschap (pakket 2)
const A = require('./art.js');
const { C, ol, f, heart, sparkle, drop, dropPath, hmark, splat, kface, arm, speedLines, meester, handThumb, handWave, cloudBubble, bulb, steam, zzz, confetti } = A;

// ---------- Gereedschap ----------
function kwast() {
  const bristle = 'M 196 206 L 196 112 Q 198 70 256 64 Q 314 70 316 112 L 316 206 Z';
  const paint = 'M 196 122 L 196 112 Q 198 70 256 64 Q 314 70 316 112 L 316 124 L 314 124 L 314 150 Q 307 162 300 150 L 300 128 Q 286 134 270 126 L 270 138 Q 263 150 256 138 L 256 124 Q 236 132 214 124 L 214 148 Q 206 160 198 148 L 198 124 Z';
  return `<g transform="rotate(-12 256 270)">
  ${arm(192, 240, 146, 244, 132, 196, 'wave')}
  ${arm(320, 240, 370, 250, 382, 196, 'thumb', 10)}
  <path d="${bristle}" fill="${C.bristle}"/>
  <g stroke="${C.bristleDark}" stroke-width="3" stroke-linecap="round">${[210, 226, 242, 270, 286, 302].map((x) => `<path d="M ${x} 128 L ${x} 200"/>`).join('')}</g>
  <path d="${paint}" fill="${C.blue}" ${ol(4)}/>
  <path d="M 214 94 Q 230 78 252 76" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="${bristle}" fill="none" ${ol(6)}/>
  <path d="M 216 266 L 224 436 Q 226 474 256 474 Q 286 474 288 436 L 296 266 Z" fill="${C.wood}" ${ol(6)}/>
  <path d="M 240 290 Q 236 360 244 420 M 272 300 Q 276 360 268 410" stroke="${C.woodDark}" stroke-width="3" fill="none" opacity=".6"/>
  <circle cx="256" cy="446" r="9" fill="${C.woodDark}" ${ol(4)}/>
  <circle cx="238" cy="330" r="4.5" fill="#fff"/><circle cx="272" cy="384" r="4" fill="#fff"/><circle cx="250" cy="404" r="3.5" fill="${C.blue}"/><circle cx="278" cy="318" r="3.5" fill="${C.yellow}"/>
  <rect x="188" y="202" width="136" height="66" rx="10" fill="${C.metal}" ${ol(6)}/>
  <rect x="198" y="209" width="116" height="9" rx="4" fill="${C.metalLight}"/>
  <path d="M 194 246 L 318 246 M 194 256 L 318 256" stroke="${C.metalDark}" stroke-width="3.5"/>
  ${kface(256, 158, 1.1, { eyes: 'happy', mouth: 'open', id: 'k1' })}
  </g>`;
}

function roller() {
  let nap = '';
  const R = A.rng(4);
  for (let i = 0; i < 26; i++) {
    const x = 130 + R() * 200, y = 150 + R() * 60;
    nap += `<path d="M ${f(x)} ${f(y)} l 4 6" stroke="${C.redDark}" stroke-width="3" stroke-linecap="round" opacity=".45"/>`;
  }
  return `<g transform="rotate(-6 256 260)">
  ${speedLines(100, 134, 4, 66, 24)}
  <path d="M 360 168 L 386 168 L 386 262 L 270 292 L 270 332" fill="none" stroke="${C.ink}" stroke-width="24" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M 360 168 L 386 168 L 386 262 L 270 292 L 270 332" fill="none" stroke="${C.metal}" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
  <rect x="112" y="116" width="240" height="104" rx="34" fill="${C.red}" ${ol(6)}/>
  ${nap}
  <rect x="134" y="128" width="196" height="13" rx="6.5" fill="#fff" opacity=".35"/>
  <rect x="344" y="144" width="24" height="48" rx="7" fill="${C.metal}" ${ol(5)}/>
  <rect x="242" y="318" width="56" height="20" rx="6" fill="${C.dark}" ${ol(5)}/>
  <rect x="248" y="334" width="44" height="132" rx="20" fill="${C.yellow}" ${ol(6)}/>
  <path d="M 254 362 L 286 362 M 254 378 L 286 378 M 254 394 L 286 394 M 254 410 L 286 410" stroke="${C.yellowDark}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="270" cy="446" r="6" fill="${C.yellowDark}"/>
  ${kface(226, 160, 1.12, { eyes: 'happy', mouth: 'open', id: 'k2' })}
  </g>`;
}

function kitkoker() {
  return `<g transform="rotate(6 256 280)">
  ${arm(190, 272, 140, 292, 126, 248, 'open')}
  ${arm(322, 272, 374, 282, 386, 232, 'thumb', 8)}
  <path d="M 256 54 C 262 28 302 16 324 34 C 344 52 330 78 310 72 C 296 68 298 52 310 52" fill="none" stroke="${C.ink}" stroke-width="22" stroke-linecap="round"/>
  <path d="M 256 54 C 262 28 302 16 324 34 C 344 52 330 78 310 72 C 296 68 298 52 310 52" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>
  <path d="M 240 128 L 272 128 L 264 52 L 248 58 Z" fill="#FBFBFB" ${ol(5)}/>
  <path d="M 196 166 L 316 166 L 292 126 L 220 126 Z" fill="${C.cream}" ${ol(5)}/>
  <rect x="232" y="118" width="48" height="14" rx="4" fill="${C.metal}" ${ol(4.5)}/>
  <rect x="186" y="160" width="140" height="252" rx="16" fill="${C.cream}" ${ol(6)}/>
  <rect x="298" y="170" width="18" height="232" rx="9" fill="#E3DACB"/>
  <rect x="190" y="300" width="132" height="86" fill="#fff"/>
  ${hmark(234, 310, 44, false)}
  ${[C.blue, C.yellow, C.green, C.red].map((c, i) => `<rect x="${190 + i * 33}" y="364" width="33" height="16" fill="${c}"/>`).join('')}
  <path d="M 188 300 L 324 300 M 188 386 L 324 386" ${ol(4)}/>
  <rect x="178" y="398" width="156" height="32" rx="10" fill="${C.gray}" ${ol(6)}/>
  <rect x="198" y="406" width="116" height="7" rx="3.5" fill="#8A8A8A"/>
  ${kface(256, 222, 1.15, { eyes: 'wink', mouth: 'grin', id: 'k3' })}
  </g>`;
}

function verfblik() {
  const quad = [[C.red, 150, 168], [C.blue, 256, 168], [C.yellow, 150, 202], [C.green, 256, 202]];
  return `<g>
  ${sparkle(110, 150, 22)} ${sparkle(410, 120, 18, '#fff')} ${sparkle(424, 214, 12)}
  <path d="M 152 236 Q 256 70 360 236" fill="none" stroke="${C.ink}" stroke-width="15" stroke-linecap="round"/>
  <path d="M 152 236 Q 256 70 360 236" fill="none" stroke="${C.metal}" stroke-width="7" stroke-linecap="round"/>
  <path d="M 150 200 L 150 410 Q 256 446 362 410 L 362 200 Z" fill="${C.metal}" ${ol(6)}/>
  <path d="M 330 214 L 330 418" stroke="#fff" stroke-width="10" opacity=".45" stroke-linecap="round"/>
  <path d="M 150 252 Q 256 284 362 252 L 362 372 Q 256 404 150 372 Z" fill="${C.cream}" ${ol(5)}/>
  <ellipse cx="256" cy="202" rx="106" ry="28" fill="${C.metalDark}" ${ol(6)}/>
  <defs><clipPath id="paintTop"><ellipse cx="256" cy="204" rx="92" ry="20"/></clipPath></defs>
  <g clip-path="url(#paintTop)">${quad.map(([c, x, y]) => `<rect x="${x}" y="${y}" width="106" height="34" fill="${c}"/>`).join('')}
   <path d="M 196 200 Q 230 188 262 204 Q 290 216 318 200" fill="none" stroke="#fff" stroke-width="4" opacity=".55"/></g>
  <ellipse cx="256" cy="204" rx="92" ry="20" fill="none" ${ol(4)}/>
  <path d="M 184 216 L 184 282 Q 193 298 202 282 L 202 222" fill="${C.yellow}"/>
  <path d="M 184 218 L 184 282 Q 193 298 202 282 L 202 222" fill="none" ${ol(4.5)}/>
  <path d="M 222 222 L 222 246 Q 229 258 236 246 L 236 224" fill="${C.yellow}"/>
  <path d="M 222 223 L 222 246 Q 229 258 236 246 L 236 224" fill="none" ${ol(4.5)}/>
  <path d="M 300 222 L 300 308 Q 310 324 320 308 L 320 218" fill="${C.green}"/>
  <path d="M 300 223 L 300 308 Q 310 324 320 308 L 320 219" fill="none" ${ol(4.5)}/>
  ${kface(252, 320, 1.2, { eyes: 'star', mouth: 'open', id: 'k4' })}
  </g>`;
}

function plamuurmes() {
  return `<g transform="rotate(8 256 270)">
  ${arm(198, 200, 150, 226, 174, 268, 'open')}
  ${arm(314, 196, 372, 186, 382, 136, 'thumb', 6)}
  <path d="M 168 72 Q 168 60 180 60 L 332 60 Q 344 60 344 72 L 304 280 L 208 280 Z" fill="${C.metal}" ${ol(6)}/>
  <path d="M 188 78 L 214 78 L 232 266 L 220 266 Z" fill="${C.metalLight}" opacity=".85"/>
  <path d="M 171 64 Q 188 44 212 58 Q 234 40 260 56 Q 288 42 306 58 Q 326 48 341 64 L 340 78 Q 300 70 256 76 Q 210 70 172 78 Z" fill="#F7F4EE" ${ol(4.5)}/>
  <path d="M 220 306 L 228 432 Q 230 470 256 470 Q 282 470 284 432 L 292 306 Z" fill="${C.wood}" ${ol(6)}/>
  <path d="M 246 330 Q 242 380 248 424 M 270 324 Q 274 380 266 420" stroke="${C.woodDark}" stroke-width="3" fill="none" opacity=".6"/>
  <circle cx="256" cy="446" r="8" fill="${C.woodDark}" ${ol(4)}/>
  <circle cx="244" cy="352" r="4" fill="#fff"/><circle cx="268" cy="396" r="3.5" fill="${C.green}"/>
  <rect x="210" y="276" width="92" height="34" rx="8" fill="${C.metalDark}" ${ol(6)}/>
  <circle cx="232" cy="293" r="5.5" fill="${C.metal}" ${ol(3)}/><circle cx="280" cy="293" r="5.5" fill="${C.metal}" ${ol(3)}/>
  ${kface(256, 166, 1.25, { eyes: 'shades', mouth: 'smirk', id: 'k5' })}
  ${sparkle(352, 86, 16, '#fff')}
  </g>`;
}

function tape() {
  return `<g>
  <path d="M 200 344 L 458 344 L 446 353 L 460 362 L 446 371 L 458 380 L 200 380 Z" fill="${C.yellow}" ${ol(6)}/>
  <path d="M 300 362 L 430 362" stroke="${C.yellowDark}" stroke-width="3" stroke-dasharray="10 8" opacity=".6"/>
  ${arm(110, 236, 62, 226, 70, 172, 'wave')}
  <circle cx="230" cy="220" r="128" fill="${C.yellow}" ${ol(6)}/>
  <circle cx="230" cy="220" r="112" fill="none" stroke="${C.yellowDark}" stroke-width="3" opacity=".45"/>
  <circle cx="230" cy="220" r="96" fill="none" stroke="${C.yellowDark}" stroke-width="3" opacity=".35"/>
  <path d="M 150 140 A 112 112 0 0 1 230 108" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".5"/>
  <circle cx="230" cy="220" r="68" fill="${C.card}" ${ol(6)}/>
  <circle cx="230" cy="220" r="56" fill="none" stroke="${C.cardDark}" stroke-width="4"/>
  ${kface(230, 208, 0.95, { eyes: 'happy', mouth: 'grin', id: 'k6' })}
  ${sparkle(420, 300, 16)}
  </g>`;
}

function ladder() {
  const xl = (y) => 192 - (14 * (y - 150)) / 260, xr = (y) => 320 + (14 * (y - 150)) / 260;
  const rungs = [204, 258, 312, 366].map((y) => `<rect x="${f(xl(y))}" y="${y - 8}" width="${f(xr(y) - xl(y))}" height="16" rx="4" fill="${C.metal}" ${ol(5)}/><path d="M ${f(xl(y) + 8)} ${y - 2} L ${f(xr(y) - 8)} ${y - 2}" stroke="${C.metalDark}" stroke-width="2.5" stroke-dasharray="6 5"/>`).join('');
  return `<g transform="rotate(7 256 300)">
  ${speedLines(112, 236, 3, 60, 26)}
  <circle cx="122" cy="440" r="14" fill="#EDE6DC" ${ol(4)}/><circle cx="96" cy="432" r="10" fill="#EDE6DC" ${ol(4)}/>
  ${rungs}
  <path d="M 192 150 L 178 410" stroke="${C.ink}" stroke-width="30" stroke-linecap="round"/><path d="M 192 150 L 178 410" stroke="${C.metal}" stroke-width="19" stroke-linecap="round"/>
  <path d="M 320 150 L 334 410" stroke="${C.ink}" stroke-width="30" stroke-linecap="round"/><path d="M 320 150 L 334 410" stroke="${C.metal}" stroke-width="19" stroke-linecap="round"/>
  <path d="M 186 170 L 182 230 M 326 170 L 330 230" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
  <ellipse cx="166" cy="420" rx="26" ry="13" fill="${C.dark}" ${ol(5)} transform="rotate(-18 166 420)"/>
  <ellipse cx="350" cy="424" rx="26" ry="13" fill="${C.dark}" ${ol(5)}/>
  ${arm(168, 112, 118, 136, 112, 86, 'wave')}
  ${arm(344, 112, 392, 132, 404, 168, 'open')}
  <rect x="164" y="54" width="184" height="104" rx="22" fill="${C.blue}" ${ol(6)}/>
  <rect x="178" y="64" width="156" height="12" rx="6" fill="#fff" opacity=".35"/>
  ${kface(256, 98, 1.05, { eyes: 'dot', mouth: 'open', id: 'k7' })}
  </g>`;
}

function druppel() {
  return `<g>
  <ellipse cx="256" cy="404" rx="128" ry="22" fill="${C.blue}" ${ol(6)}/>
  <ellipse cx="226" cy="398" rx="50" ry="6" fill="#fff" opacity=".35"/>
  <path d="${dropPath(256, 290, 108)}" fill="${C.blue}" ${ol(6)}/>
  <ellipse cx="200" cy="246" rx="18" ry="36" fill="#fff" opacity=".5" transform="rotate(20 200 246)"/>
  ${drop(96, 320, 13, C.blue, -30)} ${drop(420, 300, 15, C.blue, 25)} ${drop(400, 190, 9, C.blue, 15)}
  ${kface(256, 300, 1.35, { eyes: 'wide', mouth: 'wavy', brows: 'worried', id: 'k8' })}
  </g>`;
}

function oeps() {
  return `<g>
  <path d="M 250 334 C 280 318 330 318 360 324 C 404 316 452 326 464 352 C 476 378 440 396 400 390 C 370 404 318 404 288 394 C 248 398 212 388 212 368 C 212 350 230 340 250 334 Z" fill="${C.red}" ${ol(6)}/>
  <ellipse cx="380" cy="350" rx="40" ry="6" fill="#fff" opacity=".35"/>
  <circle cx="470" cy="312" r="7" fill="${C.red}" ${ol(3.5)}/><circle cx="204" cy="404" r="6" fill="${C.red}" ${ol(3.5)}/><circle cx="440" cy="410" r="8" fill="${C.red}" ${ol(3.5)}/>
  <g transform="rotate(-12 210 270)">
   <rect x="92" y="196" width="216" height="154" rx="12" fill="${C.metal}" ${ol(6)}/>
   <rect x="128" y="199" width="132" height="148" fill="${C.cream}"/>
   <path d="M 128 198 L 128 348 M 260 198 L 260 348" ${ol(4)}/>
   <path d="M 104 210 L 104 336" stroke="#fff" stroke-width="8" opacity=".5" stroke-linecap="round"/>
   <ellipse cx="308" cy="273" rx="26" ry="77" fill="${C.metalDark}" ${ol(6)}/>
   <ellipse cx="310" cy="276" rx="18" ry="64" fill="${C.red}"/>
   ${kface(194, 262, 1.0, { eyes: 'wide', mouth: 'o', brows: 'worried', id: 'k9' })}
  </g>
  <path d="M 318 296 C 336 316 346 330 356 340 L 330 344 C 320 330 310 318 304 304 Z" fill="${C.red}" ${ol(4)}/>
  ${drop(96, 168, 12, C.blue, -20)}
  <ellipse cx="100" cy="420" rx="48" ry="15" fill="${C.metalDark}" ${ol(5)}/>
  <ellipse cx="100" cy="416" rx="32" ry="8" fill="${C.red}" opacity=".9"/>
  </g>`;
}

function zandloper() {
  const glass = 'M 186 92 L 326 92 C 326 170 272 220 266 254 C 272 288 326 338 326 418 L 186 418 C 186 338 240 288 246 254 C 240 220 186 170 186 92 Z';
  return `<g>
  <defs><clipPath id="gl"><path d="${glass}"/></clipPath></defs>
  <path d="${glass}" fill="${C.glass}"/>
  <g clip-path="url(#gl)">
    <path d="M 160 150 Q 256 162 352 150 L 352 262 L 160 262 Z" fill="${C.yellow}"/>
    <path d="M 160 420 L 160 396 Q 256 380 352 396 L 352 420 Z" fill="${C.red}"/>
    <path d="M 160 398 L 160 378 Q 256 360 352 378 L 352 398 Q 256 382 160 398 Z" fill="${C.blue}"/>
    <path d="M 160 380 L 160 364 Q 256 344 352 364 L 352 380 Q 256 362 160 380 Z" fill="${C.green}"/>
    <path d="M 200 366 Q 256 316 312 366 Q 256 350 200 366 Z" fill="${C.yellow}"/>
  </g>
  <path d="M 256 250 L 256 340" stroke="${C.yellow}" stroke-width="6" stroke-linecap="round"/>
  <path d="M 200 110 C 202 160 226 198 240 226 M 200 400 C 202 360 222 318 238 296" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".8"/>
  <path d="${glass}" fill="none" ${ol(6)}/>
  <rect x="164" y="88" width="18" height="334" rx="6" fill="${C.woodDark}" ${ol(5)}/>
  <rect x="330" y="88" width="18" height="334" rx="6" fill="${C.woodDark}" ${ol(5)}/>
  <rect x="146" y="58" width="220" height="36" rx="12" fill="${C.wood}" ${ol(6)}/>
  <rect x="146" y="416" width="220" height="36" rx="12" fill="${C.wood}" ${ol(6)}/>
  <path d="M 162 70 L 300 70 M 162 428 L 300 428" stroke="${C.woodLight}" stroke-width="5" stroke-linecap="round"/>
  ${kface(256, 186, 0.92, { eyes: 'closed', mouth: 'smile', id: 'k10' })}
  </g>`;
}

function waaier() {
  const cols = [C.blue, C.green, C.yellow, C.red, '#A88C6E', C.gray];
  const angles = [-52, -31, -10, 11, 32, 53];
  const tint = (hex, t) => {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const m = (c) => Math.round(c + (255 - c) * t);
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  };
  const strips = angles.map((a, i) => `<g transform="rotate(${a} 256 404)">
    <rect x="225" y="112" width="62" height="318" rx="12" fill="#fff" ${ol(5)}/>
    <rect x="232" y="120" width="48" height="76" rx="6" fill="${tint(cols[i], 0.6)}"/>
    <rect x="232" y="202" width="48" height="76" rx="6" fill="${tint(cols[i], 0.3)}"/>
    <rect x="232" y="284" width="48" height="76" rx="6" fill="${cols[i]}"/>
  </g>`).join('');
  return `<g>
  ${strips}
  <circle cx="256" cy="404" r="50" fill="${C.cream}" ${ol(6)}/>
  ${kface(256, 396, 0.88, { eyes: 'happy', mouth: 'open', id: 'k11' })}
  ${sparkle(70, 150, 18)} ${sparkle(444, 140, 14, '#fff')}
  </g>`;
}

function verfhart() {
  const hp = A.heartPath(256, 262, 188);
  return `<g>
  <defs><clipPath id="hc"><path d="${hp}"/></clipPath></defs>
  <g clip-path="url(#hc)">
    <g transform="rotate(-37 256 262)">
      <rect x="-200" y="40" width="912" height="155" fill="${C.blue}"/>
      <rect x="-200" y="195" width="912" height="70" fill="${C.yellow}"/>
      <rect x="-200" y="265" width="912" height="70" fill="${C.green}"/>
      <rect x="-200" y="335" width="912" height="170" fill="${C.red}"/>
      <path d="M 40 205 L 300 205 M 120 300 L 420 302 M 60 400 L 330 398 M 180 110 L 400 112" stroke="#fff" stroke-width="5" opacity=".3" stroke-linecap="round"/>
      <path d="M -200 195 L 712 195 M -200 265 L 712 265 M -200 335 L 712 335" stroke="${C.ink}" stroke-width="3" opacity=".25"/>
    </g>
  </g>
  <path d="M 162 380 L 162 432 Q 172 448 182 432 L 182 392" fill="${C.green}"/>
  <path d="M 162 382 L 162 432 Q 172 448 182 432 L 182 396" fill="none" ${ol(5)}/>
  <path d="M 318 384 L 318 412 Q 327 426 336 412 L 336 372" fill="${C.red}"/>
  <path d="M 318 386 L 318 412 Q 327 426 336 412 L 336 376" fill="none" ${ol(5)}/>
  <path d="${hp}" fill="none" ${ol(7)}/>
  <ellipse cx="160" cy="150" rx="28" ry="16" fill="#fff" opacity=".55" transform="rotate(-40 160 150)"/>
  ${kface(256, 238, 1.45, { eyes: 'happy', mouth: 'open', id: 'k12' })}
  ${sparkle(456, 96, 20)} ${sparkle(58, 380, 16, '#fff')}
  </g>`;
}

function offerte() {
  const wing = (m) => `<path transform="${m}" d="M 140 250 C 92 214 52 222 38 244 C 58 250 68 258 70 268 C 52 272 46 286 48 298 C 76 300 98 292 110 288 C 102 302 104 314 112 322 C 140 308 152 284 152 270 Z" fill="#fff" ${ol(5)}/>
  <path transform="${m}" d="M 70 268 C 90 266 108 270 128 270 M 110 288 C 120 284 132 282 144 278" fill="none" stroke="#C9C9C9" stroke-width="3.5" stroke-linecap="round"/>`;
  return `<g transform="rotate(-8 256 270)">
  ${speedLines(78, 396, 3, 50, 22)}
  ${wing('')}
  ${wing('translate(512 0) scale(-1 1)')}
  <rect x="128" y="190" width="256" height="170" rx="14" fill="#E9DCC6" ${ol(6)}/>
  <rect x="168" y="108" width="176" height="150" rx="8" fill="#fff" ${ol(5)}/>
  ${hmark(182, 122, 36, false)}
  <rect x="228" y="126" width="98" height="10" rx="5" fill="#C9C9C9"/>
  <rect x="228" y="144" width="70" height="10" rx="5" fill="#DADADA"/>
  <rect x="182" y="174" width="144" height="8" rx="4" fill="#E2E2E2"/>
  <rect x="182" y="190" width="120" height="8" rx="4" fill="#E2E2E2"/>
  <rect x="270" y="210" width="58" height="16" rx="6" fill="${C.green}"/>
  <path d="M 128 214 L 256 294 L 384 214 L 384 346 Q 384 360 370 360 L 142 360 Q 128 360 128 346 Z" fill="${C.cream}" ${ol(6)}/>
  <path d="M 134 352 L 234 284 M 378 352 L 278 284" stroke="#D8CCB8" stroke-width="5" stroke-linecap="round"/>
  ${kface(256, 318, 1.05, { eyes: 'happy', mouth: 'open', id: 'k13' })}
  </g>`;
}

function agenda() {
  let grid = '';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
    const hl = r === 1 && c === 3;
    grid += `<rect x="${164 + c * 38}" y="${300 + r * 34}" width="30" height="26" rx="6" fill="${hl ? C.green : '#ECECEC'}"/>`;
  }
  return `<g transform="rotate(-5 256 260)">
  <rect x="136" y="96" width="240" height="290" rx="22" fill="#fff" ${ol(6)}/>
  <path d="M 136 118 Q 136 96 158 96 L 354 96 Q 376 96 376 118 L 376 168 L 136 168 Z" fill="${C.red}" ${ol(6)}/>
  <circle cx="196" cy="122" r="9" fill="${C.redDark}"/><circle cx="316" cy="122" r="9" fill="${C.redDark}"/>
  <rect x="189" y="64" width="14" height="60" rx="7" fill="${C.metal}" ${ol(4.5)}/>
  <rect x="309" y="64" width="14" height="60" rx="7" fill="${C.metal}" ${ol(4.5)}/>
  ${grid}
  ${kface(256, 220, 1.1, { eyes: 'happy', mouth: 'grin', id: 'k14' })}
  <circle cx="370" cy="372" r="50" fill="${C.green}" ${ol(6)}/>
  <path d="M 346 372 L 364 390 L 396 354" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

// ---------- De Meester: varianten ----------
const sideTears = `
  <path d="M 200 266 Q 160 268 132 306" fill="none" stroke="${C.ink}" stroke-width="24" stroke-linecap="round"/>
  <path d="M 200 266 Q 160 268 132 306" fill="none" stroke="${C.blue}" stroke-width="14" stroke-linecap="round"/>
  <path d="M 312 266 Q 352 268 380 306" fill="none" stroke="${C.ink}" stroke-width="24" stroke-linecap="round"/>
  <path d="M 312 266 Q 352 268 380 306" fill="none" stroke="${C.blue}" stroke-width="14" stroke-linecap="round"/>
  ${drop(122, 334, 12, C.blue, 30)} ${drop(392, 334, 12, C.blue, -30)} ${drop(98, 282, 8, C.blue, 60)} ${drop(416, 282, 8, C.blue, -60)}`;
const downTears = `
  ${[[222, 2], [290, -2]].map(([x, d]) => `<path d="M ${x} 270 L ${x - d * 4} 392" fill="none" stroke="${C.ink}" stroke-width="28" stroke-linecap="round"/><path d="M ${x} 270 L ${x - d * 4} 392" fill="none" stroke="${C.blue}" stroke-width="18" stroke-linecap="round"/><path d="M ${x - 4} 290 L ${x - 6} 330" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`).join('')}
  ${drop(170, 420, 11, C.blue, -40)} ${drop(344, 420, 11, C.blue, 40)}`;

const M = [
  { id: 'meester-hoi', name: 'Hoi!', emoji: '👋', cap: 'Hoi!', capColor: C.blue,
    o: { eyes: { l: { type: 'open', dx: 2 } }, brows: 'raised', mouth: 'grin', extras: handWave(404, 300, 0.92, 8) } },
  { id: 'meester-lacht', name: 'Lacht', emoji: '😄',
    o: { eyes: { l: { type: 'happy' } }, brows: 'raised', mouth: 'laugh' } },
  { id: 'meester-tranen-van-het-lachen', name: 'Tranen van het lachen', emoji: '😂', tilt: -8,
    o: { eyes: { l: { type: 'xl' }, r: { type: 'xr' } }, brows: 'raised', mouth: 'laugh', extras: sideTears } },
  { id: 'meester-knipoog', name: 'Knipoog', emoji: '😉',
    o: { eyes: { l: { type: 'open', dx: 3 }, r: { type: 'happy' } }, brows: 'skeptic', mouth: 'smirk', extras: sparkle(352, 224, 16, C.yellow) } },
  { id: 'meester-duim', name: 'Duim omhoog', emoji: '👍', cap: 'Top!', capColor: C.green,
    o: { eyes: { l: { type: 'happy' } }, brows: 'raised', mouth: 'grin', extras: handThumb(336, 334, 1.05, -6) } },
  { id: 'meester-verliefd', name: 'Verliefd', emoji: '😍',
    o: { eyes: { l: { type: 'heart' } }, brows: 'raised', mouth: 'grin', blush: 0.7,
      extras: heart(100, 176, 26, C.red, -18) + heart(414, 136, 20, C.blue, 16) + heart(426, 236, 13, C.yellow, 10) + heart(84, 268, 12, C.green, -10) } },
  { id: 'meester-kusje', name: 'Kusje', emoji: '😘',
    o: { eyes: { l: { type: 'open', dx: 2 }, r: { type: 'happy' } }, brows: 'raised', mouth: 'kiss', blush: 0.75, extras: heart(330, 350, 24, C.red, 18) } },
  { id: 'meester-verdrietig', name: 'Verdrietig', emoji: '😢',
    o: { eyes: { l: { type: 'open', dy: 4, lid: [-4, -16] } }, brows: 'sad', mouth: 'frown', blush: 0.25, extras: drop(204, 306, 10, C.blue) } },
  { id: 'meester-huilt', name: 'Huilt', emoji: '😭',
    o: { eyes: { l: { type: 'squeeze' } }, brows: 'sad', mouth: 'sadopen', blush: 0.25, extras: downTears } },
  { id: 'meester-wauw', name: 'Wauw', emoji: '😮', cap: 'Wauw!', capColor: C.yellow,
    o: { eyes: { l: { type: 'wide' } }, brows: 'raised', mouth: 'o' } },
  { id: 'meester-oei', name: 'Schrikt', emoji: '😱', cap: 'Oei!', capColor: C.red,
    o: { eyes: { l: { type: 'wide', dy: -3 } }, brows: 'sad', mouth: 'scream', tint: 'pale', blush: 0,
      extras: drop(140, 222, 11, C.blue, -15) + drop(372, 206, 10, C.blue, 15) } },
  { id: 'meester-boos', name: 'Boos', emoji: '😠',
    o: { eyes: { l: { type: 'open', lid: [-22, -6] } }, brows: 'angry', mouth: 'grit', tint: 'red', blush: 0,
      extras: steam(112, 150, -1) + steam(400, 150, 1) } },
  { id: 'meester-denkt', name: 'Denkt na', emoji: '🤔', dx: -28,
    o: { eyes: { l: { type: 'open', dx: 7, dy: -9 } }, brows: 'skeptic', mouth: 'flat', extras: cloudBubble(408, 102) } },
  { id: 'meester-cool', name: 'Cool', emoji: '😎',
    o: { glasses: true, brows: 'raised', mouth: 'smirk', extras: sparkle(330, 232, 15, '#fff') } },
  { id: 'meester-laat-drogen', name: 'Slaapt', emoji: '😴', cap: 'Laat even\ndrogen…', capColor: C.blue, dx: -20,
    o: { eyes: { l: { type: 'closed' } }, brows: 'normal', mouth: 'o', blush: 0.35, extras: zzz() } },
  { id: 'meester-opgeleverd', name: 'Feest', emoji: '🥳', cap: 'Opgeleverd!', capColor: C.green,
    o: { eyes: { l: { type: 'happy' } }, brows: 'raised', mouth: 'laugh', behind: confetti(9) } },
  { id: 'meester-hard-werken', name: 'Zweet', emoji: '😅', cap: "Hard aan\n't werk!", capColor: C.yellow,
    o: { eyes: { l: { type: 'happy' } }, brows: 'sad', mouth: 'grin', extras: drop(344, 200, 14, C.blue, 12) + `<path d="M 290 312 q 14 -6 26 4" stroke="${C.green}" stroke-width="7" stroke-linecap="round" fill="none"/>` } },
  { id: 'meester-idee', name: 'Idee', emoji: '💡', cap: 'Idee!', capColor: C.yellow, dx: -18,
    o: { eyes: { l: { type: 'wide', dy: -7, dx: 4 } }, brows: 'raised', mouth: 'grin', extras: bulb(408, 104) } },
  { id: 'meester-rolt-ogen', name: 'Rolt met ogen', emoji: '🙄',
    o: { eyes: { l: { type: 'open', dy: -14, dx: 2, lid: [-9, -9] } }, brows: 'flat', mouth: 'flat', blush: 0.2 } },
  { id: 'meester-prachtig', name: 'Sterretjes', emoji: '🤩', cap: 'Prachtig!', capColor: C.red,
    o: { eyes: { l: { type: 'star' } }, brows: 'raised', mouth: 'laugh', extras: sparkle(100, 150, 22) + sparkle(420, 120, 18, '#fff') + sparkle(440, 230, 12) } },
  { id: 'meester-bedankt', name: 'Bedankt', emoji: '🙏', cap: 'Bedankt!', capColor: C.red,
    o: { eyes: { l: { type: 'happy' } }, brows: 'sad', mouth: 'smile', blush: 0.8,
      extras: heart(104, 170, 22, C.red, -16) + heart(410, 156, 18, C.red, 14) } },
  { id: 'meester-tot-morgen', name: 'Tot morgen', emoji: '👋', cap: 'Tot morgen!', capColor: C.green,
    o: { eyes: { l: { type: 'happy' } }, brows: 'raised', mouth: 'grin', extras: handWave(404, 300, 0.92, 8) +
      `<path d="M 116 96 A 40 40 0 1 0 150 166 A 32 32 0 1 1 116 96 Z" fill="${C.yellow}" ${ol(5)}/>` + sparkle(170, 70, 11) + sparkle(76, 196, 9, '#fff') } },
];

const T = [
  { id: 'kwast-komt-goed', name: 'Kwast', emoji: '🖌️', cap: 'Komt goed!', capColor: C.green, draw: kwast },
  { id: 'roller-rolt-als-een-trein', name: 'Roller', emoji: '🚂', cap: 'Rolt als\neen trein!', capColor: C.blue, draw: roller },
  { id: 'kitkoker-naadloos', name: 'Kitkoker', emoji: '✅', cap: 'Naadloos\ngeregeld!', capColor: C.red, draw: kitkoker },
  { id: 'verfblik-kleur-bekend', name: 'Verfblik', emoji: '🎨', cap: 'Kleur bekend!', capColor: C.yellow, draw: verfblik },
  { id: 'plamuurmes-strak-plan', name: 'Plamuurmes', emoji: '😎', cap: 'Strak plan!', capColor: C.blue, draw: plamuurmes },
  { id: 'tape-netjes-afgeplakt', name: 'Afplaktape', emoji: '📏', cap: 'Netjes\nafgeplakt!', capColor: C.green, draw: tape },
  { id: 'ladder-onderweg', name: 'Ladder', emoji: '🚐', cap: 'Onderweg!', capColor: C.red, draw: ladder },
  { id: 'druppel-natte-verf', name: 'Verfdruppel', emoji: '⚠️', cap: 'Natte verf!', capColor: C.red, draw: druppel },
  { id: 'verfblik-oeps', name: 'Omgevallen blik', emoji: '🙈', cap: 'Oeps!', capColor: C.blue, draw: oeps },
  { id: 'zandloper-even-geduld', name: 'Zandloper', emoji: '⏳', cap: 'Even geduld…', capColor: C.blue, draw: zandloper },
  { id: 'kleurenwaaier-kies-je-kleur', name: 'Kleurenwaaier', emoji: '🌈', cap: 'Kies je kleur!', capColor: C.red, draw: waaier },
  { id: 'offerte-onderweg', name: 'Offerte', emoji: '✉️', cap: 'Offerte\nonderweg!', capColor: C.green, draw: offerte },
  { id: 'agenda-afspraak-staat', name: 'Agenda', emoji: '📅', cap: 'Afspraak\nstaat!', capColor: C.blue, draw: agenda },
  { id: 'verfhart', name: 'Verfhart', emoji: '❤️', draw: verfhart },
];

module.exports = { M, T };
