/* Diepblauw — koralen, rotsen, duiker, de Tuimelaar-bus en landschap */
(function (DG) {
  'use strict';
  const U = DG.U, TAU = Math.PI * 2;
  const Art = (DG.Art = DG.Art || {});

  Art.logo = new Image();
  Art.logo.src = 'img/tuimelaar-logo.png';

  /* ================================================================
   * Koralen & bodemleven. Oorsprong = voet, omhoog is -y, eenheden m.
   * ================================================================ */
  const PAL = {
    brain: [['#d8c890', '#a08850'], ['#b8c878', '#7a8a40'], ['#e0b080', '#a8784a'], ['#c8a0c0', '#8a6080']],
    star: [['#c8b070', '#8a7040'], ['#9ab070', '#5a7040'], ['#d89a60', '#9a6030']],
    table: [['#c8b890', '#8a7a5a'], ['#9ab8a8', '#5a7a6a'], ['#c0a8d0', '#7a6890']],
    staghorn: [['#c8a878', '#e0d0f0'], ['#b89a6a', '#80c8f0'], ['#d0b890', '#f0c0d8']],
    fan: [['#c83a6a', '#e86a90'], ['#8a3ab0', '#b070d8'], ['#e8803a', '#f8b070'], ['#e8c83a', '#f8e070'], ['#d0302a', '#f06050']],
    soft: [['#e8508a', '#ffa0c8'], ['#a050d8', '#d0a0ff'], ['#f07030', '#ffb080'], ['#e03a3a', '#ff9090'], ['#f0c030', '#fff0a0']],
    barrel: [['#a0603a', '#6a3a20'], ['#8a5a4a', '#5a3a2a'], ['#b07a50', '#7a5030']],
    tube: [['#9a4ac0', '#6a2a90'], ['#e8c03a', '#b08a20'], ['#e8803a', '#b05a20'], ['#5a9ad8', '#3a6aa8']],
    vase: [['#6a7ae0', '#a0b0ff'], ['#9a6ad8', '#c8a0ff']],
    rod: [['#7a4a8a', '#b088c0'], ['#8a6a4a', '#c0a080'], ['#6a5a8a', '#a090c0']],
    whip: [['#e8b030', '#fff0a0'], ['#e86a30', '#ffb080'], ['#d84060', '#ff90a8']],
    anemone: [['#b8a060', '#e870b0'], ['#9ab070', '#f0f0d0'], ['#d8c8a0', '#c070e0']],
    seagrass: [['#4a8a3a', '#7ab860'], ['#5a9a40', '#90c870']],
    weed: [['#6a6a2a', '#9a9a50'], ['#5a4a20', '#8a7a40'], ['#3a6a3a', '#6aa060']],
    plumose: [['#f4f0e8', '#ffffff'], ['#f0a050', '#ffd0a0'], ['#e8e0d0', '#fff8ec']],
    deadmans: [['#f09a4a', '#ffe0c0'], ['#f0ece0', '#ffffff']],
    mussels: [['#1e2430', '#4a5a7a']],
    oyster: [['#8a8a80', '#c8c8b8']],
    urchin: [['#1a1a22', '#4a3a5a'], ['#3a2030', '#7a3a60']],
    rock: [['#8a7a6a', '#5a4e44']],
    boulder: [['#5a5a60', '#3a3a40']],
    blackcoral: [['#e8e8d0', '#a0a888'], ['#c8d8a0', '#7a9050']],
    starfish: [['#e8502a', '#f8a060'], ['#e88a2a', '#f8c070'], ['#c83a6a', '#f080a0']],
    cucumber: [['#3a2a20', '#6a5040'], ['#1a1a1a', '#4a3a3a']],
  };
  const SIZE = {
    brain: [0.6, 1.6, 0.45], star: [0.6, 1.5, 0.6], table: [1.0, 2.2, 0.38], staghorn: [0.8, 1.6, 0.8],
    fan: [0.8, 2.1, 0.95], soft: [0.45, 1.0, 1.15], barrel: [0.5, 1.0, 1.6], tube: [0.4, 0.8, 1.3],
    vase: [0.3, 0.5, 1.8], rod: [0.6, 1.2, 1.3], whip: [0.1, 0.12, 14], anemone: [0.45, 0.85, 0.5],
    seagrass: [0.4, 0.8, 0.8], weed: [0.4, 0.9, 1.3], plumose: [0.25, 0.5, 1.6], deadmans: [0.25, 0.5, 1.0],
    mussels: [0.6, 1.4, 0.18], oyster: [0.4, 0.9, 0.25], urchin: [0.22, 0.32, 0.9], rock: [0.8, 2.6, 0.5],
    boulder: [2.0, 5.0, 0.6], blackcoral: [0.8, 1.4, 1.0], starfish: [0.16, 0.24, 0.3], cucumber: [0.25, 0.4, 0.25],
  };
  const SWAY = { fan: 0.04, soft: 0.06, whip: 0.16, anemone: 0.1, seagrass: 0.2, weed: 0.18, plumose: 0.05, rod: 0.05, blackcoral: 0.04 };

  Art.makeCoral = function (type, x, y, rng, scale) {
    const sz = SIZE[type] || [0.5, 1, 1];
    const pal = PAL[type] || [['#888', '#aaa']];
    const p = pal[Math.floor(rng() * pal.length)];
    const w = U.lerp(sz[0], sz[1], rng()) * (scale || 1);
    const h = Math.min(w * sz[2] * U.lerp(0.85, 1.15, rng()), type === 'whip' ? 2.2 : 99);
    return { type, x, y, w, h, c1: p[0], c2: p[1], seed: Math.floor(rng() * 1e9), sway: SWAY[type] || 0, ph: rng() * 6 };
  };

  function branch(c, x, y, ang, len, th, depth, rng, spread, shrink) {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    c.lineWidth = th;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
    if (depth <= 0) return [[x2, y2]];
    let tips = [];
    const n = rng() < 0.35 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = ang + (i - (n - 1) / 2) * spread + (rng() - 0.5) * 0.3;
      tips = tips.concat(branch(c, x2, y2, a, len * U.lerp(shrink - 0.1, shrink + 0.08, rng()), th * 0.7, depth - 1, rng, spread, shrink));
    }
    return tips;
  }

  Art.drawCoral = function (c, o) {
    const w = o.w, h = o.h, rng = U.rng(o.seed);
    c.lineCap = 'round'; c.lineJoin = 'round';
    switch (o.type) {
      case 'brain': {
        c.beginPath(); c.moveTo(-w / 2, 0); c.bezierCurveTo(-w / 2, -h * 1.33, w / 2, -h * 1.33, w / 2, 0); c.closePath();
        const g = c.createRadialGradient(-w * 0.1, -h * 0.8, w * 0.05, 0, -h * 0.3, w * 0.7);
        g.addColorStop(0, U.shade(o.c1, 0.2)); g.addColorStop(1, o.c2);
        c.fillStyle = g; c.fill(); c.save(); c.clip();
        c.strokeStyle = U.rgba(o.c2, 0.7); c.lineWidth = w * 0.025;
        for (let y = -h; y < 0; y += h / 6) {
          c.beginPath();
          for (let x = -w / 2; x <= w / 2; x += w / 30) {
            const yy = y + Math.sin(x * 25 / w + y * 9 + rng()) * h * 0.04;
            if (x === -w / 2) c.moveTo(x, yy); else c.lineTo(x, yy);
          }
          c.stroke();
        }
        c.restore();
        break;
      }
      case 'star': {
        const n = 4 + Math.floor(rng() * 3);
        for (let i = 0; i < n; i++) {
          const cx = U.lerp(-w * 0.35, w * 0.35, rng()), r = U.lerp(0.25, 0.42, rng()) * w;
          const cy = -r * U.lerp(0.4, 0.8, rng()) * (h / w) * 1.6;
          const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
          g.addColorStop(0, U.shade(o.c1, 0.15)); g.addColorStop(1, o.c2);
          c.fillStyle = g; c.beginPath(); c.ellipse(cx, Math.min(cy, -r * 0.2), r, Math.min(r, h * 0.8), 0, Math.PI, TAU); c.fill();
        }
        c.fillStyle = U.rgba('#ffffff', 0.18);
        for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(U.lerp(-w * 0.45, w * 0.45, rng()), -rng() * h * 0.9, w * 0.012, 0, TAU); c.fill(); }
        break;
      }
      case 'table': {
        c.fillStyle = o.c2;
        c.beginPath(); c.moveTo(-w * 0.07, 0); c.lineTo(-w * 0.04, -h * 0.75); c.lineTo(w * 0.04, -h * 0.75); c.lineTo(w * 0.08, 0); c.fill();
        const tiers = rng() < 0.4 ? 2 : 1;
        for (let k = 0; k < tiers; k++) {
          const ty = -h * (0.78 + k * 0.18), tw = w * (k ? 0.65 : 1);
          c.fillStyle = U.shade(o.c2, -0.15);
          c.beginPath(); c.ellipse(0, ty + h * 0.05, tw / 2, h * 0.09, 0, 0, TAU); c.fill();
          const g = c.createLinearGradient(0, ty - h * 0.1, 0, ty + h * 0.05);
          g.addColorStop(0, U.shade(o.c1, 0.2)); g.addColorStop(1, o.c1);
          c.fillStyle = g; c.beginPath(); c.ellipse(0, ty, tw / 2, h * 0.08, 0, 0, TAU); c.fill();
          c.fillStyle = U.rgba('#ffffff', 0.2);
          for (let i = 0; i < 30; i++) { c.beginPath(); c.arc(U.lerp(-tw * 0.45, tw * 0.45, rng()), ty + U.lerp(-h * 0.05, h * 0.03, rng()), w * 0.008, 0, TAU); c.fill(); }
          c.strokeStyle = U.rgba(o.c1, 0.8); c.lineWidth = w * 0.01;
          for (let i = 0; i < 18; i++) { const x = U.lerp(-tw / 2, tw / 2, i / 17); c.beginPath(); c.moveTo(x, ty + h * 0.03); c.lineTo(x * 1.02, ty + h * 0.1); c.stroke(); }
        }
        break;
      }
      case 'staghorn': {
        const g = c.createLinearGradient(0, 0, 0, -h);
        g.addColorStop(0, o.c1); g.addColorStop(0.75, U.shade(o.c1, 0.1)); g.addColorStop(1, o.c2);
        c.strokeStyle = g;
        for (let i = 0; i < 4; i++) {
          branch(c, U.lerp(-w * 0.25, w * 0.25, rng()), 0, -Math.PI / 2 + (rng() - 0.5) * 0.9, h * 0.38, w * 0.07, 3, rng, 0.55, 0.72);
        }
        break;
      }
      case 'fan': {
        c.fillStyle = U.rgba(o.c1, 0.07);
        c.beginPath(); c.ellipse(0, -h * 0.5, w * 0.42, h * 0.42, 0, 0, TAU); c.fill();
        c.strokeStyle = o.c1;
        const tips = branch(c, 0, 0, -Math.PI / 2, h * 0.25, w * 0.04, 5, rng, 0.42, 0.72);
        c.strokeStyle = U.rgba(o.c2, 0.45); c.lineWidth = w * 0.006;
        for (let i = 0; i < tips.length - 1; i += 1) {
          const a = tips[i], b = tips[Math.min(tips.length - 1, i + 1 + Math.floor(rng() * 2))];
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        }
        break;
      }
      case 'soft': {
        c.strokeStyle = 'rgba(245,240,240,0.75)';
        const tips = branch(c, 0, 0, -Math.PI / 2, h * 0.35, w * 0.12, 3, rng, 0.6, 0.7);
        tips.forEach((tp) => {
          for (let i = 0; i < 6; i++) {
            const r = w * U.lerp(0.04, 0.075, rng());
            c.fillStyle = i % 3 ? o.c1 : o.c2;
            c.beginPath(); c.arc(tp[0] + (rng() - 0.5) * w * 0.15, tp[1] + (rng() - 0.6) * w * 0.15, r, 0, TAU); c.fill();
          }
        });
        break;
      }
      case 'barrel':
      case 'vase': {
        const vase = o.type === 'vase';
        c.beginPath();
        c.moveTo(-w * 0.28, 0);
        c.quadraticCurveTo(-w * (vase ? 0.4 : 0.6), -h * 0.55, -w * 0.5, -h);
        c.lineTo(w * 0.5, -h);
        c.quadraticCurveTo(w * (vase ? 0.4 : 0.6), -h * 0.55, w * 0.28, 0);
        c.closePath();
        const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
        g.addColorStop(0, U.shade(o.c1, -0.25)); g.addColorStop(0.4, U.shade(o.c1, 0.1)); g.addColorStop(1, o.c2);
        c.fillStyle = g; c.fill();
        c.save(); c.clip();
        c.strokeStyle = U.rgba(o.c2, 0.6); c.lineWidth = w * 0.03;
        if (!vase) for (let i = 1; i < 8; i++) { const x = U.lerp(-w / 2, w / 2, i / 8); c.beginPath(); c.moveTo(x * 0.6, 0); c.quadraticCurveTo(x * 1.15, -h * 0.55, x, -h); c.stroke(); }
        c.restore();
        c.fillStyle = U.shade(o.c2, -0.45);
        c.beginPath(); c.ellipse(0, -h, w * 0.48, w * 0.1, 0, 0, TAU); c.fill();
        c.strokeStyle = U.shade(o.c1, 0.2); c.lineWidth = w * 0.03; c.stroke();
        break;
      }
      case 'tube': {
        const n = 3 + Math.floor(rng() * 3);
        for (let i = 0; i < n; i++) {
          const x = U.lerp(-w * 0.35, w * 0.35, n === 1 ? 0.5 : i / (n - 1)) + (rng() - 0.5) * w * 0.1;
          const th = h * U.lerp(0.5, 1, rng()), tw = w * U.lerp(0.13, 0.2, rng());
          const lean = (rng() - 0.5) * 0.25;
          c.save(); c.translate(x, 0); c.rotate(lean);
          const g = c.createLinearGradient(-tw, 0, tw, 0);
          g.addColorStop(0, U.shade(o.c1, -0.2)); g.addColorStop(0.5, U.shade(o.c1, 0.15)); g.addColorStop(1, o.c2);
          c.fillStyle = g;
          c.beginPath(); c.moveTo(-tw * 0.8, 0); c.lineTo(-tw, -th); c.lineTo(tw, -th); c.lineTo(tw * 0.8, 0); c.fill();
          c.fillStyle = U.shade(o.c2, -0.5); c.beginPath(); c.ellipse(0, -th, tw, tw * 0.3, 0, 0, TAU); c.fill();
          c.restore();
        }
        break;
      }
      case 'rod': {
        c.strokeStyle = o.c1;
        const tips = branch(c, 0, 0, -Math.PI / 2, h * 0.3, w * 0.06, 3, rng, 0.45, 0.8);
        c.fillStyle = U.rgba(o.c2, 0.5);
        tips.forEach((tp) => { c.beginPath(); c.arc(tp[0], tp[1], w * 0.03, 0, TAU); c.fill(); });
        break;
      }
      case 'whip': {
        c.strokeStyle = o.c1; c.lineWidth = 0.025;
        c.beginPath(); c.moveTo(0, 0);
        for (let i = 1; i <= 20; i++) { const t = i / 20; c.lineTo(Math.sin(t * 9) * 0.06 * t, -h * t); }
        c.stroke();
        break;
      }
      case 'anemone': {
        c.fillStyle = U.shade(o.c1, -0.25);
        c.beginPath(); c.ellipse(0, -h * 0.25, w * 0.3, h * 0.3, 0, 0, TAU); c.fill();
        for (let i = 0; i < 46; i++) {
          const a = -Math.PI / 2 + (rng() - 0.5) * 2.6;
          const len = h * U.lerp(0.6, 1.1, rng());
          const x0 = (rng() - 0.5) * w * 0.5, y0 = -h * 0.4;
          const x1 = x0 + Math.cos(a) * len * 0.9, y1 = y0 + Math.sin(a) * len;
          c.strokeStyle = o.c1; c.lineWidth = w * 0.05;
          c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + Math.cos(a) * len * 0.4, y0 - len * 0.6, x1, y1); c.stroke();
          c.fillStyle = o.c2; c.beginPath(); c.arc(x1, y1, w * 0.035, 0, TAU); c.fill();
        }
        break;
      }
      case 'seagrass':
      case 'weed': {
        const n = o.type === 'weed' ? 5 : 8;
        for (let i = 0; i < n; i++) {
          const x = U.lerp(-w / 2, w / 2, rng()), bh = h * U.lerp(0.6, 1, rng()), bw = o.type === 'weed' ? w * 0.18 : w * 0.05;
          const bend = (rng() - 0.5) * w * 0.6;
          c.fillStyle = i % 2 ? o.c1 : o.c2;
          c.beginPath(); c.moveTo(x - bw / 2, 0);
          c.quadraticCurveTo(x + bend * 0.5 - bw, -bh * 0.6, x + bend, -bh);
          c.quadraticCurveTo(x + bend * 0.5 + bw, -bh * 0.6, x + bw / 2, 0);
          c.fill();
        }
        break;
      }
      case 'plumose': {
        const g = c.createLinearGradient(-w * 0.15, 0, w * 0.15, 0);
        g.addColorStop(0, U.shade(o.c1, -0.15)); g.addColorStop(1, o.c2);
        c.fillStyle = g;
        c.beginPath(); c.moveTo(-w * 0.16, 0); c.lineTo(-w * 0.12, -h * 0.62); c.lineTo(w * 0.12, -h * 0.62); c.lineTo(w * 0.16, 0); c.fill();
        for (let i = 0; i < 70; i++) {
          const a = rng() * Math.PI + Math.PI;
          const r = w * 0.5 * Math.sqrt(rng());
          c.fillStyle = U.rgba(i % 2 ? o.c1 : o.c2, 0.6);
          c.beginPath(); c.arc(Math.cos(a) * r, -h * 0.68 + Math.sin(a) * r * 0.8, w * 0.07, 0, TAU); c.fill();
        }
        break;
      }
      case 'deadmans': {
        const n = 3 + Math.floor(rng() * 3);
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.45;
          const len = h * U.lerp(0.6, 1, rng());
          c.strokeStyle = o.c1; c.lineWidth = w * 0.3;
          c.beginPath(); c.moveTo(0, -w * 0.1); c.quadraticCurveTo(Math.cos(a) * len * 0.3, -len * 0.5, Math.cos(a) * len * 0.7, Math.sin(a) * len); c.stroke();
          c.fillStyle = U.rgba(o.c2, 0.8);
          for (let k = 0; k < 8; k++) { const t = rng(); c.beginPath(); c.arc(Math.cos(a) * len * 0.7 * t + (rng() - 0.5) * w * 0.2, Math.sin(a) * len * t, w * 0.025, 0, TAU); c.fill(); }
        }
        break;
      }
      case 'mussels': {
        for (let i = 0; i < Math.ceil(w * 14); i++) {
          const x = U.lerp(-w / 2, w / 2, rng()), y = -rng() * h * 0.8;
          c.fillStyle = o.c1;
          c.beginPath(); c.ellipse(x, y, 0.05, 0.022, rng() * 3, 0, TAU); c.fill();
          c.fillStyle = U.rgba(o.c2, 0.6); c.beginPath(); c.ellipse(x - 0.01, y - 0.008, 0.025, 0.007, 0, 0, TAU); c.fill();
        }
        break;
      }
      case 'oyster': {
        for (let i = 0; i < Math.ceil(w * 6); i++) {
          const x = U.lerp(-w / 2, w / 2, rng()), y = -rng() * h * 0.6;
          c.fillStyle = i % 2 ? o.c1 : o.c2;
          c.beginPath();
          for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; const r = 0.09 * U.lerp(0.6, 1.1, rng()); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.45); }
          c.fill();
        }
        break;
      }
      case 'urchin': {
        c.strokeStyle = o.c1; c.lineWidth = 0.01;
        for (let i = 0; i < 40; i++) {
          const a = -Math.PI * rng();
          const l = h * U.lerp(0.9, 1.8, rng());
          c.beginPath(); c.moveTo(0, -h * 0.35); c.lineTo(Math.cos(a) * l, -h * 0.35 + Math.sin(a) * l * 0.9); c.stroke();
        }
        c.fillStyle = o.c2; c.beginPath(); c.ellipse(0, -h * 0.3, w * 0.4, h * 0.33, 0, 0, TAU); c.fill();
        break;
      }
      case 'rock':
      case 'boulder': {
        c.beginPath();
        const n = 11;
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          const x = U.lerp(-w / 2, w / 2, t);
          const y = -Math.sin(t * Math.PI) * h * U.lerp(0.75, 1.15, rng());
          if (i === 0) c.moveTo(x, 0.05); else c.lineTo(x, y);
        }
        c.lineTo(w / 2, 0.05); c.closePath();
        const g = c.createLinearGradient(0, -h, 0, 0);
        g.addColorStop(0, U.shade(o.c1, 0.12)); g.addColorStop(1, o.c2);
        c.fillStyle = g; c.fill();
        c.save(); c.clip();
        for (let i = 0; i < 14; i++) {
          c.fillStyle = i % 3 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)';
          c.beginPath(); c.ellipse(U.lerp(-w / 2, w / 2, rng()), -rng() * h, w * 0.08, h * 0.06, rng() * 3, 0, TAU); c.fill();
        }
        if (o.algae) { c.fillStyle = U.rgba(o.algae, 0.35); c.fillRect(-w, -h * 1.2, w * 2, h * 0.35); }
        c.restore();
        break;
      }
      case 'blackcoral': {
        c.strokeStyle = o.c2;
        const tips = branch(c, 0, 0, -Math.PI / 2, h * 0.3, w * 0.035, 4, rng, 0.5, 0.75);
        c.strokeStyle = U.rgba(o.c1, 0.6); c.lineWidth = w * 0.01;
        tips.forEach((tp) => { c.beginPath(); c.moveTo(tp[0], tp[1]); c.lineTo(tp[0] + (rng() - 0.5) * 0.15, tp[1] - 0.12); c.stroke(); });
        break;
      }
      case 'starfish': {
        c.fillStyle = o.c1;
        c.beginPath();
        for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2; const r = i % 2 ? w * 0.18 : w * 0.5; c.lineTo(Math.cos(a) * r, -h * 0.5 + Math.sin(a) * r * 0.3); }
        c.fill();
        break;
      }
      case 'cucumber': {
        c.fillStyle = o.c1;
        c.beginPath(); c.ellipse(0, -h * 0.5, w * 0.5, h * 0.5, 0, 0, TAU); c.fill();
        c.fillStyle = U.rgba(o.c2, 0.6);
        for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(U.lerp(-w * 0.4, w * 0.4, rng()), -h * U.lerp(0.5, 0.95, rng()), w * 0.03, 0, TAU); c.fill(); }
        break;
      }
    }
  };

  // Gecachete sprite per koraal
  Art.coralSprite = function (o, pxm) {
    if (o._spr && o._pxm === pxm) return o._spr;
    const pad = Math.max(o.w, o.h) * 0.35 + 0.1;
    const x0 = -o.w / 2 - pad, x1 = o.w / 2 + pad, y0 = -o.h - pad, y1 = 0.15;
    let s = pxm;
    if ((x1 - x0) * s > 1400) s = 1400 / (x1 - x0);
    const W = Math.max(2, Math.ceil((x1 - x0) * s)), H = Math.max(2, Math.ceil((y1 - y0) * s));
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
    Art.drawCoral(c, o);
    o._spr = { cv, x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    o._pxm = pxm;
    return o._spr;
  };

  /* ================================================================
   * Duiker
   * look: samengevoegde look-eigenschappen van de uitrusting
   * st: { kick, lamp, cam, tint }
   * ================================================================ */
  Art.drawDiver = function (c, look, st) {
    const k = st.kick || 0;
    const suit = look.suitC || '#1c1c20';
    const skin = '#e3b48a';
    const shorty = look.suit === 'shorty';
    const dry = look.suit === 'dry';
    const acc = look.accent || '#4a90d8';
    c.lineCap = 'round'; c.lineJoin = 'round';

    function leg(phase, far) {
      const a1 = Math.sin(k + phase) * 0.28;
      const kx = -0.3 + Math.cos(Math.PI + a1) * -0.0;
      const hip = [-0.3, 0.04];
      const knee = [hip[0] - Math.cos(a1) * 0.42, hip[1] + Math.sin(a1) * 0.42];
      const a2 = a1 + 0.18 + Math.sin(k + phase + 0.9) * 0.22;
      const ank = [knee[0] - Math.cos(a2) * 0.4, knee[1] + Math.sin(a2) * 0.4];
      const thW = dry ? 0.15 : 0.13;
      const col = far ? U.shade(suit, -0.25) : suit;
      c.strokeStyle = col; c.lineWidth = thW;
      c.beginPath(); c.moveTo(hip[0], hip[1]); c.lineTo(knee[0], knee[1]); c.stroke();
      c.strokeStyle = shorty ? (far ? U.shade(skin, -0.25) : skin) : col; c.lineWidth = thW * 0.82;
      c.beginPath(); c.moveTo(knee[0], knee[1]); c.lineTo(ank[0], ank[1]); c.stroke();
      if (!far && !dry) { c.strokeStyle = acc; c.lineWidth = 0.018; c.beginPath(); c.moveTo(hip[0], hip[1] - 0.05); c.lineTo(knee[0], knee[1] - 0.05); c.stroke(); }
      // vin
      const a3 = a2 + 0.25 + Math.sin(k + phase + 1.6) * 0.25;
      const fl = look.jet ? 0.45 : 0.56;
      const fin = far ? U.shade(look.fin || '#f2c21a', -0.3) : look.fin || '#f2c21a';
      c.save(); c.translate(ank[0], ank[1]); c.rotate(Math.PI - a3);
      c.fillStyle = dry ? '#1a1a1a' : U.shade(suit, -0.2);
      c.beginPath(); c.ellipse(0.04, 0, 0.08, 0.05, 0, 0, TAU); c.fill();
      c.fillStyle = fin;
      c.beginPath();
      c.moveTo(0.02, -0.04);
      c.lineTo(fl, look.jet ? -0.1 : -0.075);
      c.quadraticCurveTo(fl + 0.04, 0, fl, look.jet ? 0.1 : 0.075);
      c.lineTo(0.02, 0.04);
      c.closePath(); c.fill();
      if (look.split) { c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(fl * 0.45, 0); c.lineTo(fl + 0.02, 0); c.stroke(); }
      if (look.jet) { c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0.12, -0.03, 0.08, 0.06); }
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0.1, -0.012, fl * 0.75, 0.01);
      c.restore();
    }
    leg(Math.PI, true);

    // fles
    const tl = look.tankLen || 0.7;
    const tx = 0.05 - tl / 2, ty = -0.29;
    if (look.bcd === 'wing') {
      c.fillStyle = U.shade(look.bcdC || '#2a2a2e', -0.1);
      c.beginPath(); c.ellipse(0.03, -0.2, tl * 0.48, 0.13, 0, 0, TAU); c.fill();
    }
    const tg = c.createLinearGradient(0, ty, 0, ty + 0.18);
    tg.addColorStop(0, U.shade(look.tank || '#c9ced3', 0.3)); tg.addColorStop(0.5, look.tank || '#c9ced3'); tg.addColorStop(1, U.shade(look.tank || '#c9ced3', -0.35));
    c.fillStyle = tg;
    c.beginPath(); c.roundRect ? c.roundRect(tx, ty, tl, 0.18, 0.09) : c.rect(tx, ty, tl, 0.18); c.fill();
    c.fillStyle = '#9aa0a8'; c.fillRect(tx + tl - 0.02, ty + 0.05, 0.07, 0.08);
    c.fillStyle = look.reg || '#202020'; c.beginPath(); c.arc(tx + tl + 0.07, ty + 0.09, 0.045, 0, TAU); c.fill();
    // slang naar de mond
    c.strokeStyle = '#151515'; c.lineWidth = 0.028;
    c.beginPath(); c.moveTo(tx + tl + 0.08, ty + 0.12); c.quadraticCurveTo(0.68, -0.25, 0.68, 0.0); c.stroke();
    c.strokeStyle = '#1c1c1c'; c.lineWidth = 0.022;
    c.beginPath(); c.moveTo(tx + tl + 0.04, ty + 0.14); c.quadraticCurveTo(0.2, 0.22, 0.05, 0.12); c.stroke();

    // romp
    c.fillStyle = suit;
    c.beginPath(); c.ellipse(0.03, 0.0, 0.38, dry ? 0.14 : 0.125, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(0.32, -0.01, 0.15, dry ? 0.13 : 0.12, 0, 0, TAU); c.fill();
    if (!dry) { c.strokeStyle = acc; c.lineWidth = 0.02; c.beginPath(); c.moveTo(-0.25, 0.08); c.quadraticCurveTo(0.1, 0.13, 0.42, 0.07); c.stroke(); }
    if (dry) { c.fillStyle = '#c8c8c8'; c.beginPath(); c.arc(0.36, -0.03, 0.03, 0, TAU); c.fill(); }
    // trimvest
    if (look.bcd === 'jacket') {
      c.fillStyle = look.bcdC || '#1a1a1e';
      c.beginPath(); c.roundRect ? c.roundRect(-0.25, -0.15, 0.62, 0.25, 0.08) : c.rect(-0.25, -0.15, 0.62, 0.25); c.fill();
      c.strokeStyle = look.bcdAccent || '#f2c21a'; c.lineWidth = 0.025;
      c.beginPath(); c.moveTo(-0.2, -0.13); c.lineTo(-0.2, 0.08); c.moveTo(0.3, -0.13); c.lineTo(0.3, 0.08); c.stroke();
      c.fillStyle = U.shade(look.bcdC || '#1a1a1e', 0.12); c.fillRect(-0.12, 0.0, 0.2, 0.08);
      c.fillStyle = look.bcdAccent || '#f2c21a'; c.fillRect(-0.05, 0.02, 0.06, 0.03);
    } else {
      c.strokeStyle = '#111'; c.lineWidth = 0.035;
      c.beginPath(); c.moveTo(0.3, -0.14); c.lineTo(0.3, 0.1); c.moveTo(-0.2, -0.14); c.lineTo(-0.15, 0.1); c.moveTo(-0.22, 0.1); c.lineTo(0.36, 0.1); c.stroke();
      c.fillStyle = look.bcdAccent || '#a8b0b8'; c.fillRect(0.0, 0.085, 0.06, 0.03);
    }
    leg(0, false);

    // hoofd
    const hx = 0.58, hy = -0.04;
    c.fillStyle = look.hood || dry ? U.shade(suit, 0.05) : skin;
    c.beginPath(); c.arc(hx, hy, 0.115, 0, TAU); c.fill();
    if (!(look.hood || dry)) {
      c.fillStyle = '#4a3020';
      c.beginPath(); c.arc(hx - 0.02, hy - 0.04, 0.1, Math.PI * 0.9, Math.PI * 2.05); c.fill();
    }
    c.strokeStyle = '#111'; c.lineWidth = 0.025;
    c.beginPath(); c.moveTo(hx + 0.08, hy - 0.06); c.quadraticCurveTo(hx - 0.05, hy - 0.08, hx - 0.11, hy - 0.02); c.stroke();
    // masker
    c.fillStyle = look.mask || '#3d7fbf';
    c.beginPath(); c.roundRect ? c.roundRect(hx + 0.05, hy - 0.11, 0.1, 0.11, 0.03) : c.rect(hx + 0.05, hy - 0.11, 0.1, 0.11); c.fill();
    const mg = c.createLinearGradient(hx + 0.08, hy - 0.1, hx + 0.15, hy - 0.01);
    mg.addColorStop(0, 'rgba(220,245,255,0.95)'); mg.addColorStop(0.5, 'rgba(120,180,220,0.8)'); mg.addColorStop(1, 'rgba(40,80,120,0.9)');
    c.fillStyle = mg;
    c.beginPath(); c.roundRect ? c.roundRect(hx + 0.08, hy - 0.095, 0.065, 0.08, 0.02) : c.rect(hx + 0.08, hy - 0.095, 0.065, 0.08); c.fill();
    // ademautomaat
    c.fillStyle = look.reg || '#202020';
    c.beginPath(); c.ellipse(hx + 0.11, hy + 0.07, 0.05, 0.04, 0, 0, TAU); c.fill();
    c.fillStyle = '#111'; c.fillRect(hx + 0.12, hy + 0.08, 0.05, 0.03);

    // armen
    const sh = [0.36, 0.01];
    const armCol = suit, foreCol = shorty ? skin : suit;
    function arm(hand, far) {
      const el = [(sh[0] + hand[0]) / 2 + 0.02, (sh[1] + hand[1]) / 2 + 0.07];
      c.strokeStyle = far ? U.shade(armCol, -0.25) : armCol; c.lineWidth = 0.1;
      c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.stroke();
      c.strokeStyle = far ? U.shade(foreCol, -0.25) : foreCol; c.lineWidth = 0.085;
      c.beginPath(); c.moveTo(el[0], el[1]); c.lineTo(hand[0], hand[1]); c.stroke();
      c.fillStyle = dry || look.hood ? '#222' : skin;
      c.beginPath(); c.arc(hand[0], hand[1], 0.045, 0, TAU); c.fill();
      return el;
    }
    if (look.cam) {
      arm([0.86, 0.1], true);
      const elb = arm([0.86, 0.14], false);
      if (look.cam === 'pro') {
        c.strokeStyle = '#333'; c.lineWidth = 0.02;
        c.beginPath(); c.moveTo(0.92, 0.1); c.lineTo(1.0, -0.12); c.lineTo(1.12, -0.16); c.moveTo(0.92, 0.18); c.lineTo(1.0, 0.36); c.lineTo(1.12, 0.38); c.stroke();
        c.fillStyle = '#2a2a2a'; c.fillRect(1.1, -0.2, 0.06, 0.08); c.fillRect(1.1, 0.34, 0.06, 0.08);
        c.fillStyle = '#ddd'; c.fillRect(1.15, -0.19, 0.012, 0.06); c.fillRect(1.15, 0.35, 0.012, 0.06);
        c.fillStyle = '#1a1a1a'; c.beginPath(); c.roundRect ? c.roundRect(0.86, 0.02, 0.18, 0.2, 0.03) : c.rect(0.86, 0.02, 0.18, 0.2); c.fill();
        c.fillStyle = 'rgba(160,210,240,0.7)'; c.beginPath(); c.arc(1.04, 0.12, 0.08, -Math.PI / 2, Math.PI / 2); c.fill();
      } else {
        c.fillStyle = '#2a3a4a'; c.beginPath(); c.roundRect ? c.roundRect(0.88, 0.06, 0.12, 0.1, 0.02) : c.rect(0.88, 0.06, 0.12, 0.1); c.fill();
        c.fillStyle = 'rgba(160,210,240,0.8)'; c.beginPath(); c.arc(1.0, 0.11, 0.035, 0, TAU); c.fill();
      }
      if (look.lamp) {
        c.fillStyle = '#2a2a2a'; c.fillRect(0.96, -0.02, 0.1, 0.05);
        c.fillStyle = st.lamp ? '#fffbe0' : '#666'; c.fillRect(1.05, -0.015, 0.015, 0.04);
      }
      void elb;
    } else if (look.lamp) {
      arm([0.45, 0.13], true);
      arm([0.86, 0.1], false);
      const big = look.lamp === 'primair';
      c.fillStyle = '#2a2a2a'; c.beginPath(); c.roundRect ? c.roundRect(0.84, 0.06, big ? 0.2 : 0.14, big ? 0.08 : 0.06, 0.02) : c.rect(0.84, 0.06, 0.2, 0.08); c.fill();
      c.fillStyle = st.lamp ? '#fffbe0' : '#666'; c.fillRect(big ? 1.03 : 0.97, big ? 0.065 : 0.07, 0.015, big ? 0.07 : 0.04);
      if (big) { c.strokeStyle = '#111'; c.lineWidth = 0.015; c.beginPath(); c.moveTo(0.84, 0.1); c.quadraticCurveTo(0.4, 0.25, 0.0, 0.12); c.stroke(); c.fillStyle = '#333'; c.fillRect(-0.08, 0.06, 0.16, 0.08); }
    } else {
      arm([0.52, 0.14], true);
      arm([0.56, 0.12], false);
    }
    // computer op de pols
    c.fillStyle = look.comp || '#222';
    c.fillRect(look.cam || look.lamp ? 0.72 : 0.47, look.cam || look.lamp ? 0.08 : 0.1, 0.06, 0.05);
    c.fillStyle = '#7ad8ff'; c.fillRect(look.cam || look.lamp ? 0.733 : 0.483, look.cam || look.lamp ? 0.09 : 0.11, 0.035, 0.028);
  };

  /* ================================================================
   * De Tuimelaar-bus (zijaanzicht, lengte 1, wielen op y=0)
   * ================================================================ */
  Art.drawBus = function (c, opts) {
    opts = opts || {};
    const wheelRot = opts.wheel || 0;
    c.lineJoin = 'round';
    // schaduw
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath(); c.ellipse(0, 0.01, 0.52, 0.03, 0, 0, TAU); c.fill();
    // carrosserie
    function body() {
      c.beginPath();
      c.moveTo(-0.5, -0.07);
      c.lineTo(-0.5, -0.38);
      c.quadraticCurveTo(-0.5, -0.42, -0.46, -0.42);
      c.lineTo(0.1, -0.42);
      c.quadraticCurveTo(0.14, -0.42, 0.17, -0.39);
      c.lineTo(0.31, -0.27);
      c.quadraticCurveTo(0.34, -0.245, 0.4, -0.235);
      c.lineTo(0.47, -0.22);
      c.quadraticCurveTo(0.51, -0.21, 0.51, -0.16);
      c.lineTo(0.51, -0.08);
      c.quadraticCurveTo(0.51, -0.05, 0.48, -0.05);
      c.lineTo(-0.48, -0.05);
      c.quadraticCurveTo(-0.5, -0.05, -0.5, -0.07);
      c.closePath();
    }
    body();
    c.fillStyle = '#f7f8f9'; c.fill();
    c.save(); body(); c.clip();
    // blauwe wrap achterin met rif
    c.beginPath();
    c.moveTo(-0.52, -0.44);
    c.lineTo(0.02, -0.44);
    c.bezierCurveTo(-0.06, -0.3, -0.02, -0.18, -0.16, -0.04);
    c.lineTo(-0.52, -0.04);
    c.closePath();
    const g = c.createLinearGradient(-0.5, -0.42, -0.1, -0.05);
    g.addColorStop(0, '#0b3f8c'); g.addColorStop(0.55, '#1d77c4'); g.addColorStop(1, '#57b7e8');
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    const rng = U.rng(42);
    const reef = ['#e8603a', '#f2a03a', '#d8406a', '#8a5ad0', '#f2d23a', '#3ab08a'];
    for (let i = 0; i < 70; i++) {
      c.fillStyle = reef[i % reef.length];
      c.beginPath(); c.arc(U.lerp(-0.5, -0.05, rng()), U.lerp(-0.13, -0.05, rng()), U.lerp(0.008, 0.02, rng()), 0, TAU); c.fill();
    }
    // duikersilhouet
    c.save(); c.translate(-0.2, -0.32); c.rotate(-0.25); c.scale(0.06, 0.06);
    c.fillStyle = '#0a1a2a';
    c.beginPath(); c.ellipse(0, 0, 0.6, 0.15, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(0.65, -0.03, 0.14, 0, TAU); c.fill();
    c.fillRect(-1.2, -0.06, 0.7, 0.1); c.fillRect(-1.2, 0.04, 0.6, 0.08);
    c.fillStyle = '#f2c21a'; c.fillRect(-0.3, -0.24, 0.6, 0.12);
    c.restore();
    // vissen en bubbels
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-0.1 + i * 0.005, -0.38 + i * 0.02, 0.006, 0, TAU); c.fill(); }
    c.restore();
    // ramen
    c.fillStyle = '#1d2a36';
    c.beginPath(); c.moveTo(0.06, -0.39); c.lineTo(0.15, -0.39); c.lineTo(0.27, -0.28); c.lineTo(0.06, -0.28); c.closePath(); c.fill();
    c.fillStyle = 'rgba(160,200,230,0.35)';
    c.beginPath(); c.moveTo(0.08, -0.38); c.lineTo(0.13, -0.38); c.lineTo(0.1, -0.3); c.lineTo(0.08, -0.3); c.fill();
    c.restore();
    // logo-tekst op de witte zijkant
    c.save();
    c.scale(0.001, 0.001);
    c.fillStyle = '#16346e';
    c.textAlign = 'center';
    c.font = 'bold 42px Arial, Helvetica, sans-serif';
    c.fillText('DUIKCENTRUM', -20, -235);
    c.font = 'bold 22px Arial, Helvetica, sans-serif';
    c.fillText('DE TUIMELAAR ZWOLLE', -20, -205);
    c.restore();
    // golflijn + dolfijn boven de tekst
    c.strokeStyle = '#16346e'; c.lineWidth = 0.006;
    c.beginPath(); c.moveTo(-0.1, -0.29); c.quadraticCurveTo(-0.06, -0.31, -0.03, -0.3); c.quadraticCurveTo(0.02, -0.28, 0.06, -0.3); c.stroke();
    c.beginPath(); c.moveTo(-0.03, -0.3); c.quadraticCurveTo(0.0, -0.335, 0.04, -0.32); c.lineTo(0.05, -0.31); c.stroke();
    // logo op de voordeur
    if (Art.logo.complete && Art.logo.naturalWidth) {
      c.drawImage(Art.logo, 0.13, -0.24, 0.1, 0.1);
    } else {
      c.fillStyle = '#16346e'; c.beginPath(); c.arc(0.18, -0.19, 0.045, 0, TAU); c.fill();
    }
    // lijnen, deuren, spiegel, verlichting
    body();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.004; c.stroke();
    c.beginPath(); c.moveTo(0.05, -0.39); c.lineTo(0.05, -0.06); c.moveTo(0.28, -0.27); c.lineTo(0.3, -0.06); c.moveTo(-0.3, -0.41); c.lineTo(-0.3, -0.06); c.stroke();
    c.fillStyle = '#222'; c.fillRect(0.02, -0.2, 0.02, 0.008); c.fillRect(0.25, -0.2, 0.02, 0.008);
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.ellipse(0.29, -0.27, 0.02, 0.012, 0.4, 0, TAU); c.fill();
    c.fillStyle = '#ffeaa0'; c.beginPath(); c.ellipse(0.49, -0.18, 0.02, 0.014, 0, 0, TAU); c.fill();
    c.fillStyle = '#c03020'; c.fillRect(-0.505, -0.2, 0.012, 0.05);
    c.fillStyle = '#2a2a2a'; c.fillRect(0.4, -0.1, 0.11, 0.05); c.fillRect(-0.5, -0.09, 0.06, 0.04);
    c.fillStyle = '#9aa2aa'; c.fillRect(-0.12, -0.085, 0.36, 0.01);
    // wielen
    [-0.33, 0.33].forEach((wx) => {
      c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(wx, -0.075, 0.075, 0, TAU); c.fill();
      c.fillStyle = '#c8ccd0'; c.beginPath(); c.arc(wx, -0.075, 0.045, 0, TAU); c.fill();
      c.strokeStyle = '#7a8088'; c.lineWidth = 0.008;
      for (let i = 0; i < 5; i++) {
        const a = wheelRot + (i / 5) * TAU;
        c.beginPath(); c.moveTo(wx, -0.075); c.lineTo(wx + Math.cos(a) * 0.04, -0.075 + Math.sin(a) * 0.04); c.stroke();
      }
      c.fillStyle = '#555'; c.beginPath(); c.arc(wx, -0.075, 0.012, 0, TAU); c.fill();
    });
  };

  /* ================================================================
   * Boten en landschap boven water
   * ================================================================ */
  Art.drawBoat = function (c, x, big, t) {
    const bob = Math.sin(t * 1.3) * 0.08;
    c.save(); c.translate(x, bob); c.rotate(Math.sin(t * 0.9) * 0.01);
    if (big) {
      // liveaboard
      c.fillStyle = '#f4f6f8';
      c.beginPath(); c.moveTo(-14, -2.2); c.lineTo(13, -2.2); c.quadraticCurveTo(16, -2.4, 17, -3.2); c.lineTo(15, 0.9); c.quadraticCurveTo(0, 1.6, -13.5, 0.9); c.closePath(); c.fill();
      c.fillStyle = '#1a4f8a'; c.fillRect(-13.6, -0.6, 28.5, 0.45);
      c.fillStyle = '#e8ecef'; c.fillRect(-11, -4.4, 19, 2.2); c.fillRect(-8, -6.1, 12, 1.7);
      c.fillStyle = '#2a3a4a';
      for (let i = 0; i < 8; i++) c.fillRect(-10 + i * 2.2, -3.8, 1.2, 0.8);
      for (let i = 0; i < 5; i++) c.fillRect(-7 + i * 2.2, -5.6, 1.2, 0.7);
      c.fillStyle = '#d8402a'; c.fillRect(-1, -7, 0.5, 1);
    } else {
      // duikboot / speedboot
      c.fillStyle = '#f2f4f6';
      c.beginPath(); c.moveTo(-5, -1.2); c.lineTo(4.5, -1.2); c.quadraticCurveTo(6.2, -1.3, 6.5, -1.9); c.lineTo(5.2, 0.5); c.quadraticCurveTo(0, 0.9, -4.8, 0.45); c.closePath(); c.fill();
      c.fillStyle = '#e8803a'; c.fillRect(-5, -0.45, 10.5, 0.3);
      c.fillStyle = '#e0e4e8'; c.fillRect(-2, -2.4, 4, 1.2);
      c.fillStyle = '#2a3a4a'; c.fillRect(-1.7, -2.2, 3.4, 0.5);
      c.fillStyle = '#cfd4da'; c.fillRect(-4.5, -1.9, 0.3, 0.7); c.fillRect(-3.8, -1.9, 0.3, 0.7); c.fillRect(-3.1, -1.9, 0.3, 0.7);
      c.fillStyle = '#d8402a'; c.beginPath(); c.moveTo(-4, -2.4); c.lineTo(-4, -4.2); c.lineTo(-2.8, -3.8); c.lineTo(-4, -3.4); c.fill();
      c.strokeStyle = '#444'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(-4, -2.4); c.lineTo(-4, -4.3); c.stroke();
    }
    c.restore();
  };

  // Horizon-decor per stek; tekent in wereldcoördinaten (y<0 = boven water)
  Art.drawHorizon = function (c, kind, x0, x1, t) {
    const span = x1 - x0;
    if (kind === 'saltpans') {
      c.fillStyle = '#e8dcc0'; c.fillRect(x0, -1.6, span, 1.6);
      c.fillStyle = '#e8a8b8'; c.fillRect(x0, -0.9, span, 0.5);
      for (let i = 0; i < 8; i++) {
        const x = x0 + span * (0.1 + i * 0.12);
        c.fillStyle = '#ffffff';
        c.beginPath(); c.moveTo(x - 4, -1.5); c.lineTo(x, -4.5 - (i % 3)); c.lineTo(x + 4, -1.5); c.fill();
        c.fillStyle = 'rgba(180,190,200,0.5)';
        c.beginPath(); c.moveTo(x, -4.5 - (i % 3)); c.lineTo(x + 4, -1.5); c.lineTo(x + 1, -1.5); c.fill();
      }
    } else if (kind === 'karst') {
      for (let i = 0; i < 9; i++) {
        const x = x0 + span * (0.05 + i * 0.11), w = 4 + (i % 3) * 2, h = 5 + (i % 4) * 2;
        c.fillStyle = '#6a7a6a';
        c.beginPath(); c.moveTo(x - w * 0.35, 0); c.lineTo(x - w * 0.4, -h * 0.6); c.lineTo(x + w * 0.4, -h * 0.6); c.lineTo(x + w * 0.35, 0); c.fill();
        c.fillStyle = '#3a7a3a';
        c.beginPath(); c.ellipse(x, -h * 0.7, w * 0.6, h * 0.35, 0, 0, TAU); c.fill();
        c.fillStyle = '#4a8a44';
        c.beginPath(); c.ellipse(x - w * 0.2, -h * 0.82, w * 0.35, h * 0.2, 0, 0, TAU); c.fill();
      }
    } else if (kind === 'agung') {
      const cx = x0 + span * 0.55;
      c.fillStyle = '#7a8aa0';
      c.beginPath(); c.moveTo(cx - 40, 0); c.lineTo(cx - 5, -26); c.lineTo(cx + 3, -27); c.lineTo(cx + 45, 0); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.beginPath(); c.moveTo(cx - 5, -26); c.lineTo(cx + 3, -27); c.lineTo(cx + 9, -21); c.lineTo(cx - 10, -21); c.fill();
      c.fillStyle = '#4a6a4a'; c.fillRect(x0, -2, span, 2);
    } else if (kind === 'zeeland') {
      c.fillStyle = '#7aa05a'; c.fillRect(x0, -1.5, span, 1.5);
      for (let i = 0; i < 5; i++) {
        const x = x0 + span * (0.12 + i * 0.19);
        c.strokeStyle = '#e8ecef'; c.lineWidth = 0.35;
        c.beginPath(); c.moveTo(x, -1.5); c.lineTo(x, -11); c.stroke();
        const a = t * 0.8 + i;
        for (let k = 0; k < 3; k++) {
          const b = a + (k * TAU) / 3;
          c.beginPath(); c.moveTo(x, -11); c.lineTo(x + Math.cos(b) * 4.5, -11 + Math.sin(b) * 4.5); c.stroke();
        }
      }
    } else if (kind === 'darwin') {
      const cx = x0 + span * 0.35;
      c.fillStyle = '#5a5048';
      c.beginPath(); c.moveTo(cx - 30, 0); c.lineTo(cx - 24, -14); c.lineTo(cx - 10, -20); c.lineTo(cx + 6, -17); c.lineTo(cx + 18, -8); c.lineTo(cx + 26, 0); c.fill();
      c.fillStyle = '#6a7a4a'; c.beginPath(); c.ellipse(cx - 8, -19, 12, 2, 0, 0, TAU); c.fill();
      c.fillStyle = '#6a5e54';
      c.fillRect(cx + 40, -12, 3.5, 12); c.fillRect(cx + 47, -9, 3, 9);
    } else if (kind === 'sea') {
      c.fillStyle = 'rgba(200,170,130,0.55)';
      c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + span * 0.2, -3); c.lineTo(x0 + span * 0.35, -1.5); c.lineTo(x0 + span * 0.5, -3.5); c.lineTo(x0 + span * 0.7, -1); c.lineTo(x0 + span, -2); c.lineTo(x0 + span, 0); c.fill();
    }
  };
})(window.DG);
