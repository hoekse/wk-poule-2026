/* Diepblauw — tekenwerk van alle onderwaterdieren (canvas 2D, eenheden in meters) */
(function (DG) {
  'use strict';
  const U = DG.U, TAU = Math.PI * 2;
  const Art = (DG.Art = DG.Art || {});

  /* ================================================================
   * Generieke vis
   * ================================================================ */
  const SHAPES = {
    oval: { xm: 0.05, th: 0.22, nr: 0.55, ny: 0.05, bf: 1, tb: -0.3 },
    disc: { xm: 0.06, th: 0.2, nr: 0.8, ny: 0.0, bf: 1, tb: -0.27 },
    long: { xm: 0.0, th: 0.36, nr: 0.15, ny: 0.0, bf: 1, tb: -0.36 },
    torpedo: { xm: 0.08, th: 0.18, nr: 0.38, ny: 0.05, bf: 1, tb: -0.32 },
    box: { xm: 0.0, th: 0.25, nr: 0.9, ny: 0.1, bf: 1, tb: -0.25, boxy: true },
    parrot: { xm: 0.08, th: 0.25, nr: 0.85, ny: 0.15, bf: 0.95, tb: -0.3 },
    wrasse: { xm: 0.05, th: 0.28, nr: 0.75, ny: 0.2, bf: 0.92, tb: -0.3 },
    scorpion: { xm: 0.2, th: 0.3, nr: 0.75, ny: 0.15, bf: 0.8, tb: -0.33 },
    needle: { xm: 0.0, th: 0.6, nr: 0.12, ny: 0, bf: 1, tb: -0.43 },
    eelish: { xm: 0.0, th: 0.55, nr: 0.5, ny: 0.05, bf: 1, tb: -0.42 },
  };
  Art.SHAPES = SHAPES;

  function bodyPath(c, L, hh, sh, art) {
    const n = 0.5 * L, tb = sh.tb * L, xm = sh.xm * L, thh = hh * sh.th, ny = sh.ny * hh;
    c.beginPath();
    if (sh.boxy) {
      c.moveTo(n, ny);
      c.quadraticCurveTo(n, -hh, n - 0.17 * L, -hh);
      c.lineTo(tb + 0.12 * L, -hh * 0.92);
      c.quadraticCurveTo(tb, -hh * 0.8, tb, -thh);
      c.lineTo(tb, thh);
      c.quadraticCurveTo(tb, hh * 0.85, tb + 0.12 * L, hh * 0.95);
      c.lineTo(n - 0.17 * L, hh);
      c.quadraticCurveTo(n, hh, n, ny);
      c.closePath();
      return;
    }
    c.moveTo(n, ny);
    if (art.hump) {
      c.bezierCurveTo(n + 0.01 * L, ny - hh * 0.9, n - 0.02 * L, -hh * 1.38, n - 0.16 * L, -hh * 1.24);
      c.bezierCurveTo(n - 0.26 * L, -hh * 1.12, xm + 0.06 * L, -hh, xm, -hh);
    } else {
      c.bezierCurveTo(n, ny - hh * sh.nr * 0.9, xm + (n - xm) * 0.45, -hh, xm, -hh);
    }
    c.bezierCurveTo(xm - (xm - tb) * 0.45, -hh, tb + (xm - tb) * 0.25, -thh * 1.2, tb, -thh);
    c.lineTo(tb, thh);
    c.bezierCurveTo(tb + (xm - tb) * 0.25, thh * 1.2, xm - (xm - tb) * 0.45, hh * sh.bf, xm, hh * sh.bf);
    c.bezierCurveTo(xm + (n - xm) * 0.45, hh * sh.bf, n, ny + hh * sh.nr * 0.9, n, ny);
    c.closePath();
  }

  function finFill(c, col, a) {
    c.fillStyle = U.rgba(col, a == null ? 0.9 : a);
    c.fill();
  }

  function drawFins(c, art, L, hh, sh, fin) {
    const n = 0.5 * L, tb = sh.tb * L, xm = sh.xm * L, thh = hh * sh.th;
    const d = art.dorsal || 'normal';
    const dc = art.dorsalC || fin;
    c.beginPath();
    if (d === 'normal') {
      c.moveTo(xm + 0.14 * L, -hh * 0.92);
      c.quadraticCurveTo(xm + 0.02 * L, -hh * 1.6, xm - 0.12 * L, -hh * 1.35);
      c.quadraticCurveTo(tb + 0.1 * L, -hh * 1.0, tb + 0.04 * L, -thh * 1.05);
      c.lineTo(tb + 0.07 * L, -thh * 0.7);
    } else if (d === 'long') {
      c.moveTo(n - 0.12 * L, -hh * 0.85);
      c.quadraticCurveTo(xm, -hh * 1.4, tb + 0.02 * L, -thh * 1.3);
      c.lineTo(tb + 0.05 * L, -thh * 0.7);
    } else if (d === 'trail') {
      c.moveTo(xm + 0.12 * L, -hh * 0.92);
      c.quadraticCurveTo(xm - 0.04 * L, -hh * 1.5, tb - 0.08 * L, -hh * 1.0);
      c.quadraticCurveTo(tb, -thh * 1.3, tb + 0.05 * L, -thh * 0.8);
    } else if (d === 'banner') {
      c.moveTo(xm + 0.12 * L, -hh * 0.9);
      c.quadraticCurveTo(xm + 0.06 * L, -hh * 2.2, xm - 0.32 * L, -hh * 2.5);
      c.quadraticCurveTo(xm - 0.06 * L, -hh * 1.75, xm - 0.08 * L, -hh * 1.0);
      c.quadraticCurveTo(tb + 0.1 * L, -hh * 1.0, tb + 0.04 * L, -thh * 1.1);
      c.lineTo(tb + 0.06 * L, -thh * 0.7);
    } else if (d === 'batfish') {
      c.moveTo(xm + 0.1 * L, -hh * 0.9);
      c.quadraticCurveTo(xm - 0.04 * L, -hh * 1.95, tb - 0.04 * L, -hh * 1.55);
      c.quadraticCurveTo(tb, -thh * 1.3, tb + 0.04 * L, -thh * 0.8);
    } else if (d === 'two') {
      c.moveTo(xm + 0.04 * L, -hh * 0.95);
      c.lineTo(xm - 0.02 * L, -hh * 1.7);
      c.lineTo(xm - 0.07 * L, -hh * 0.98);
      c.closePath();
      finFill(c, dc);
      c.beginPath();
      c.moveTo(tb + 0.12 * L, -thh * 1.4);
      c.lineTo(tb + 0.08 * L, -thh * 2.4);
      c.lineTo(tb + 0.04 * L, -thh * 1.2);
    } else if (d === 'spiny') {
      c.moveTo(n - 0.16 * L, -hh * 0.8);
      c.lineTo(n - 0.18 * L, -hh * 1.4);
      for (let i = 1; i <= 7; i++) {
        const x = U.lerp(n - 0.18 * L, tb + 0.06 * L, i / 7);
        c.lineTo(x + 0.03 * L, -hh * (1.1 - i * 0.02));
        c.lineTo(x, -hh * (1.45 - i * 0.05));
      }
      c.lineTo(tb + 0.03 * L, -thh * 1.0);
      c.lineTo(tb + 0.06 * L, -thh * 0.7);
    } else if (d === 'low') {
      c.moveTo(xm - 0.05 * L, -hh * 0.95);
      c.quadraticCurveTo(tb + 0.1 * L, -hh * 1.5, tb + 0.03 * L, -thh * 1.2);
      c.lineTo(tb + 0.06 * L, -thh * 0.7);
    } else if (d === 'small') {
      c.moveTo(tb + 0.14 * L, -hh * 0.85);
      c.quadraticCurveTo(tb + 0.07 * L, -hh * 1.25, tb + 0.03 * L, -thh * 1.1);
      c.lineTo(tb + 0.06 * L, -thh * 0.8);
    }
    if (d !== 'none') {
      c.closePath();
      finFill(c, dc);
      if (art.finEdge) { c.strokeStyle = art.finEdge; c.lineWidth = L * 0.012; c.stroke(); }
      if (art.dorsalTip) {
        c.save(); c.clip(); c.fillStyle = art.dorsalTip;
        c.fillRect(xm - 0.15 * L, -hh * 2, 0.15 * L, hh * 0.6); c.restore();
      }
    }
    // anaalvin
    c.beginPath();
    if (d === 'trail' || d === 'batfish' || d === 'banner' || art.shape === 'disc') {
      const big = d === 'batfish' ? 1.85 : d === 'banner' ? 1.35 : 1.45;
      c.moveTo(xm + 0.04 * L, hh * 0.92);
      c.quadraticCurveTo(xm - 0.08 * L, hh * big, tb - 0.06 * L, hh * (big * 0.62));
      c.quadraticCurveTo(tb, thh * 1.3, tb + 0.05 * L, thh * 0.8);
    } else if (d === 'long' || art.shape === 'eelish' || art.shape === 'needle') {
      c.moveTo(xm - 0.02 * L, hh * 0.9);
      c.quadraticCurveTo(tb + 0.1 * L, hh * 1.3, tb + 0.02 * L, thh * 1.2);
      c.lineTo(tb + 0.06 * L, thh * 0.7);
    } else {
      c.moveTo(xm - 0.08 * L, hh * 0.9);
      c.quadraticCurveTo(tb + 0.06 * L, hh * 1.3, tb + 0.04 * L, thh * 1.05);
      c.lineTo(tb + 0.07 * L, thh * 0.7);
    }
    c.closePath();
    finFill(c, fin);
    if (art.finEdge) { c.strokeStyle = art.finEdge; c.lineWidth = L * 0.012; c.stroke(); }
    // buikvin
    c.beginPath();
    c.moveTo(n - 0.24 * L, hh * 0.85);
    c.lineTo(n - 0.34 * L, hh * 1.3);
    c.lineTo(n - 0.32 * L, hh * 0.85);
    c.closePath();
    finFill(c, fin, 0.8);
  }

  function drawPattern(c, p, L, hh, sh, rng) {
    const n = 0.5 * L, tb = sh.tb * L;
    c.globalAlpha = p.a == null ? 1 : p.a;
    switch (p.k) {
      case 'vbars': {
        const x0 = (p.x0 == null ? 0.35 : p.x0) * L, x1 = (p.x1 == null ? -0.25 : p.x1) * L;
        const w = (p.w || 0.05) * L, sl = (p.slant || 0) * hh;
        c.fillStyle = p.c;
        for (let i = 0; i < p.n; i++) {
          const t = p.n === 1 ? 0 : i / (p.n - 1);
          const x = U.lerp(x0, x1, t);
          c.beginPath();
          c.moveTo(x - w / 2 + sl, -hh * 1.6);
          c.lineTo(x + w / 2 + sl, -hh * 1.6);
          c.lineTo(x + w / 2 - sl, hh * 1.6);
          c.lineTo(x - w / 2 - sl, hh * 1.6);
          c.fill();
        }
        break;
      }
      case 'hstripes': {
        c.strokeStyle = p.c;
        c.lineWidth = (p.w || 0.08) * hh * 2;
        const y0 = p.y0 == null ? -0.75 : p.y0, y1 = p.y1 == null ? 0.75 : p.y1;
        for (let i = 0; i < p.n; i++) {
          const y = U.lerp(y0, y1, p.n === 1 ? 0.5 : i / (p.n - 1)) * hh;
          const tl = (p.tilt || 0) * hh;
          c.beginPath();
          c.moveTo(n + 0.05 * L, y + tl);
          c.lineTo(tb - 0.05 * L, y - tl);
          c.stroke();
        }
        break;
      }
      case 'band2': {
        c.fillStyle = p.c;
        const y = p.y * hh, w = p.w * hh;
        c.beginPath();
        c.moveTo(n - 0.2 * L, y - w * 0.3);
        c.quadraticCurveTo(0, y - w, tb - 0.05 * L, y - w * 0.3);
        c.lineTo(tb - 0.05 * L, y + w * 0.6);
        c.quadraticCurveTo(0, y + w * 0.3, n - 0.2 * L, y + w * 0.4);
        c.fill();
        break;
      }
      case 'spots': {
        c.fillStyle = p.c;
        for (let i = 0; i < p.n; i++) {
          let x = U.lerp(tb, n - 0.05 * L, rng());
          if (p.area === 'tail') x = U.lerp(tb, 0, rng());
          if (p.area === 'tailbase') x = U.lerp(tb, tb + 0.08 * L, rng());
          const y = U.lerp(-hh, hh, rng());
          const r = (p.r || 0.02) * L * U.lerp(0.6, 1.25, rng());
          c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
        }
        break;
      }
      case 'band': {
        const x = p.x * L, w = p.w * L;
        c.beginPath();
        if (p.bulge) {
          c.moveTo(x - w / 2, -hh * 1.3);
          c.quadraticCurveTo(x + w * 1.3, 0, x - w / 2, hh * 1.3);
          c.lineTo(x + w / 2, hh * 1.3);
          c.quadraticCurveTo(x + w * 2.3, 0, x + w / 2, -hh * 1.3);
        } else {
          c.moveTo(x - w / 2, -hh * 1.3);
          c.quadraticCurveTo(x + w * 0.5, 0, x - w / 2, hh * 1.3);
          c.lineTo(x + w / 2, hh * 1.3);
          c.quadraticCurveTo(x + w * 1.5, 0, x + w / 2, -hh * 1.3);
        }
        c.closePath();
        c.fillStyle = p.c; c.fill();
        if (p.edge) { c.strokeStyle = p.edge; c.lineWidth = L * 0.014; c.stroke(); }
        break;
      }
      case 'patch': {
        c.fillStyle = p.c;
        c.beginPath();
        c.ellipse(p.x * L, p.y * hh, p.rx * L, p.ry * hh, 0, 0, TAU);
        c.fill();
        break;
      }
      case 'scales': {
        c.strokeStyle = p.c;
        c.lineWidth = L * 0.008;
        const s = p.s * L;
        let row = 0;
        for (let y = -hh; y < hh; y += s * 0.75) {
          for (let x = tb + (row % 2) * s * 0.5; x < n - 0.08 * L; x += s) {
            c.beginPath(); c.arc(x, y, s * 0.42, -1.2, 1.2); c.stroke();
          }
          row++;
        }
        break;
      }
      case 'gradientTop': {
        const g = c.createLinearGradient(0, -hh, 0, 0.1 * hh);
        g.addColorStop(0, p.c); g.addColorStop(1, U.rgba(p.c, 0));
        c.fillStyle = g; c.fillRect(-L, -hh * 2, L * 2, hh * 2.2);
        break;
      }
      case 'saddle': {
        const g = c.createLinearGradient(0, -hh, 0, -0.1 * hh);
        g.addColorStop(0, p.c); g.addColorStop(1, U.rgba(p.c, 0));
        c.fillStyle = g; c.fillRect(-L, -hh * 2, L * 2, hh * 1.95);
        break;
      }
      case 'fade': {
        const g = c.createLinearGradient(p.x0 * L, 0, p.x1 * L, 0);
        g.addColorStop(0, p.c0); g.addColorStop(1, p.c1);
        c.fillStyle = g; c.fillRect(-L, -hh * 2, L * 2, hh * 4);
        break;
      }
      case 'mask': {
        c.fillStyle = p.c;
        const x = p.x * L;
        c.beginPath();
        c.moveTo(x + 0.03 * L, -hh * 1.2); c.lineTo(x + 0.12 * L, -hh * 0.9);
        c.lineTo(x + 0.02 * L, hh * 0.4); c.lineTo(x - 0.07 * L, 0);
        c.fill();
        break;
      }
      case 'chevron': {
        c.strokeStyle = p.c; c.lineWidth = (p.w || 0.012) * L;
        for (let i = 0; i < p.n; i++) {
          const x = U.lerp(n - 0.15 * L, tb + 0.02 * L, i / (p.n - 1));
          c.beginPath();
          c.moveTo(x + 0.03 * L, -hh * 1.2); c.lineTo(x - 0.02 * L, -hh * 0.1); c.lineTo(x + 0.01 * L, hh * 0.3);
          c.stroke();
        }
        break;
      }
      case 'mottle': {
        for (let i = 0; i < p.n; i++) {
          c.fillStyle = p.c[i % p.c.length];
          c.globalAlpha = 0.55;
          c.beginPath();
          c.ellipse(U.lerp(tb, n, rng()), U.lerp(-hh, hh, rng()), p.r * L * U.lerp(0.5, 1.4, rng()), p.r * L * U.lerp(0.4, 1, rng()), rng() * 3, 0, TAU);
          c.fill();
        }
        break;
      }
      case 'lines': {
        c.strokeStyle = p.c; c.lineWidth = (p.w || 0.01) * L;
        const xa = (p.x0 == null ? 0.5 : p.x0) * L, xb = (p.x1 == null ? -0.35 : p.x1) * L;
        for (let i = 0; i < p.n; i++) {
          const y = U.lerp(-0.8, 0.8, (i + 0.5) / p.n) * hh;
          c.beginPath();
          for (let x = xa; x >= xb; x -= 0.02 * L) {
            const yy = y + (p.wave ? Math.sin(x / L * 30 + i) * hh * 0.06 : 0);
            if (x === xa) c.moveTo(x, yy); else c.lineTo(x, yy);
          }
          c.stroke();
        }
        break;
      }
      case 'facelines': {
        c.strokeStyle = p.c; c.lineWidth = 0.01 * L;
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.moveTo(n - 0.08 * L, -hh * 0.2 + i * hh * 0.12);
          c.quadraticCurveTo(n - 0.18 * L, -hh * 0.3 + i * hh * 0.2, n - 0.28 * L, -hh * 0.1 + i * hh * 0.18);
          c.stroke();
        }
        break;
      }
      case 'tailspot': {
        c.fillStyle = p.c;
        c.beginPath(); c.ellipse(tb + 0.03 * L, 0, p.r * L, p.r * L * 0.7, 0, 0, TAU); c.fill();
        break;
      }
      case 'dorsalspots': {
        for (let i = 0; i < p.n; i++) {
          const x = U.lerp(n - 0.12 * L, tb + 0.04 * L, i / (p.n - 1));
          c.fillStyle = p.ring; c.beginPath(); c.arc(x, -hh * 0.62, L * 0.016, 0, TAU); c.fill();
          c.fillStyle = p.c; c.beginPath(); c.arc(x, -hh * 0.62, L * 0.01, 0, TAU); c.fill();
        }
        break;
      }
      case 'picasso': {
        c.fillStyle = '#f2ece0'; c.fillRect(-L, 0.05 * hh, 2 * L, 2 * hh);
        c.fillStyle = '#2a2018';
        c.beginPath(); c.moveTo(0.12 * L, 0.1 * hh); c.lineTo(-0.05 * L, 0.05 * hh); c.lineTo(-0.22 * L, hh); c.lineTo(0.02 * L, hh); c.fill();
        const cols = ['#3a7ad8', '#f0d020', '#3a7ad8', '#f0d020', '#3a7ad8'];
        c.lineWidth = 0.014 * L;
        cols.forEach((col, i) => {
          c.strokeStyle = col; c.beginPath();
          c.moveTo(n - 0.12 * L - i * 0.012 * L, -hh * 0.15 + i * 0.03 * hh);
          c.lineTo(n - 0.32 * L - i * 0.02 * L, hh * 0.55); c.stroke();
        });
        c.strokeStyle = '#1a1a1a'; c.lineWidth = 0.02 * L;
        for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(tb + 0.04 * L + i * 0.04 * L, hh * 0.1); c.lineTo(tb + 0.1 * L + i * 0.04 * L, hh * 0.7); c.stroke(); }
        c.strokeStyle = '#f0a020'; c.lineWidth = 0.016 * L;
        c.beginPath(); c.moveTo(n, 0.1 * hh); c.lineTo(n - 0.16 * L, 0.25 * hh); c.stroke();
        break;
      }
    }
    c.globalAlpha = 1;
  }

  function drawEye(c, x, y, r, ring) {
    c.fillStyle = ring || '#e8e0c0';
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = '#0d0d10';
    c.beginPath(); c.arc(x, y, r * 0.64, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.arc(x + r * 0.25, y - r * 0.28, r * 0.22, 0, TAU); c.fill();
  }

  function drawFishBody(c, art, L, seed) {
    const sh = SHAPES[art.shape || 'oval'];
    const hh = (art.h * L) / 2;
    const n = 0.5 * L, ny = sh.ny * hh;
    const fin = art.fin || U.shade(art.c, -0.2);
    const rng = U.rng(seed);
    c.lineJoin = 'round'; c.lineCap = 'round';
    drawFins(c, art, L, hh, sh, fin);
    // snuit (achter het lijf)
    if (art.snout === 'tube') {
      c.fillStyle = art.snoutC || art.c;
      c.beginPath();
      c.moveTo(n - 0.04 * L, ny - hh * 0.12);
      c.lineTo(n + 0.1 * L, ny - hh * 0.06);
      c.quadraticCurveTo(n + 0.12 * L, ny, n + 0.1 * L, ny + hh * 0.06);
      c.lineTo(n - 0.04 * L, ny + hh * 0.16);
      c.fill();
    }
    c.save();
    bodyPath(c, L, hh, sh, art);
    const g = c.createLinearGradient(0, -hh, 0, hh * sh.bf);
    g.addColorStop(0, U.shade(art.c, -0.18));
    g.addColorStop(0.45, art.c);
    g.addColorStop(1, art.c2 || art.c);
    c.fillStyle = g;
    c.fill();
    c.clip();
    (art.pat || []).forEach((p) => drawPattern(c, p, L, hh, sh, rng));
    if (art.forehead) {
      c.fillStyle = U.rgba(art.forehead, 0.75);
      c.beginPath(); c.ellipse(n - 0.12 * L, -hh * 0.75, 0.14 * L, hh * 0.5, 0.3, 0, TAU); c.fill();
    }
    const s = c.createLinearGradient(0, -hh * 1.2, 0, hh);
    s.addColorStop(0, 'rgba(0,10,30,0.25)');
    s.addColorStop(0.42, 'rgba(0,0,0,0)');
    s.addColorStop(0.75, 'rgba(255,255,255,0.12)');
    s.addColorStop(1, 'rgba(0,0,0,0.15)');
    c.fillStyle = s;
    c.fillRect(-L, -hh * 2.5, L * 2, hh * 5);
    c.restore();
    bodyPath(c, L, hh, sh, art);
    c.strokeStyle = 'rgba(0,0,0,0.3)';
    c.lineWidth = L * 0.008;
    c.stroke();
    // kieuwboog
    c.strokeStyle = 'rgba(0,0,0,0.22)';
    c.lineWidth = L * 0.01;
    c.beginPath();
    c.arc(n - 0.05 * L, ny, 0.2 * L, Math.PI - 0.55, Math.PI + 0.55);
    c.stroke();
    // borstvin
    c.fillStyle = U.rgba(art.pect || fin, 0.7);
    c.beginPath();
    c.ellipse(n - 0.27 * L, hh * 0.2, 0.09 * L, Math.min(hh * 0.22, 0.04 * L), 0.5, 0, TAU);
    c.fill();
    // bek
    if (art.snout === 'beak') {
      c.fillStyle = art.beak || '#e0e0d0';
      c.beginPath(); c.ellipse(n - 0.03 * L, ny + hh * 0.02, 0.05 * L, hh * 0.18, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = L * 0.006;
      c.beginPath(); c.moveTo(n + 0.01 * L, ny); c.lineTo(n - 0.06 * L, ny + hh * 0.02); c.stroke();
    } else if (art.snout === 'lips') {
      c.fillStyle = U.shade(art.c, 0.2);
      c.beginPath(); c.ellipse(n - 0.01 * L, ny, 0.035 * L, hh * 0.16, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = L * 0.007;
      c.beginPath(); c.moveTo(n + 0.02 * L, ny); c.lineTo(n - 0.05 * L, ny + hh * 0.03); c.stroke();
    } else if (art.snout === 'jaw') {
      c.fillStyle = U.shade(art.c, 0.1);
      c.beginPath(); c.moveTo(n - 0.12 * L, ny + hh * 0.35); c.lineTo(n + 0.04 * L, ny + hh * 0.12); c.lineTo(n - 0.1 * L, ny + hh * 0.05); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = L * 0.006;
      c.beginPath(); c.moveTo(n, ny + 0.03 * hh); c.lineTo(n - 0.13 * L, ny + hh * 0.12); c.stroke();
    } else if (art.snout === 'up') {
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = L * 0.008;
      c.beginPath(); c.moveTo(n, ny - hh * 0.05); c.lineTo(n - 0.08 * L, ny - hh * 0.4); c.stroke();
    } else if (art.snout !== 'tube') {
      c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = L * 0.008;
      c.beginPath(); c.moveTo(n - 0.005 * L, ny); c.lineTo(n - 0.05 * L, ny + hh * 0.06); c.stroke();
    }
    const eye = art.eye || {};
    const er = (eye.r || (art.bigEye ? 0.055 : art.shape === 'long' || art.shape === 'needle' ? 0.025 : 0.04)) * L;
    const ex = n - (art.shape === 'disc' ? 0.14 : art.shape === 'needle' ? 0.08 : 0.12) * L;
    drawEye(c, ex, ny - hh * 0.25, Math.min(er, hh * 0.45), eye.ring);
  }

  function tailGeom(art, L) {
    const sh = SHAPES[art.shape || 'oval'];
    const hh = (art.h * L) / 2;
    const tl = 0.5 * L + sh.tb * L;
    let ts = Math.max(hh * 0.9, L * 0.11);
    if (art.shape === 'needle' || art.shape === 'eelish') ts = Math.max(hh * 1.2, L * 0.03);
    if (art.shape === 'long') ts = Math.max(hh * 1.1, L * 0.08);
    return { sh, hh, tl, ts, thh: hh * sh.th };
  }

  function drawFishTail(c, art, L) {
    const { tl, ts, thh } = tailGeom(art, L);
    const col = art.tailC || art.fin || U.shade(art.c, -0.2);
    c.beginPath();
    const kind = art.tail || 'fork';
    if (kind === 'fork') {
      c.moveTo(0.02 * L, -thh);
      c.lineTo(-tl, -ts);
      c.quadraticCurveTo(-tl * 0.45, 0, -tl, ts);
      c.lineTo(0.02 * L, thh);
    } else if (kind === 'lunate' || kind === 'lyre') {
      const ext = kind === 'lyre' ? 1.35 : 1;
      c.moveTo(0.02 * L, -thh);
      c.quadraticCurveTo(-tl * 0.5, -ts * 0.6, -tl * ext, -ts * 1.05 * ext);
      c.quadraticCurveTo(-tl * 0.5, 0, -tl * ext, ts * 1.05 * ext);
      c.quadraticCurveTo(-tl * 0.5, ts * 0.6, 0.02 * L, thh);
    } else if (kind === 'round') {
      c.moveTo(0.02 * L, -thh);
      c.bezierCurveTo(-tl * 0.5, -ts, -tl * 1.1, -ts * 0.8, -tl * 1.05, 0);
      c.bezierCurveTo(-tl * 1.1, ts * 0.8, -tl * 0.5, ts, 0.02 * L, thh);
    } else {
      c.moveTo(0.02 * L, -thh);
      c.lineTo(-tl, -ts * 0.95);
      c.lineTo(-tl * 0.94, 0);
      c.lineTo(-tl, ts * 0.95);
      c.lineTo(0.02 * L, thh);
    }
    c.closePath();
    c.fillStyle = U.rgba(col, 0.92);
    c.fill();
    c.save(); c.clip();
    c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = L * 0.006;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-tl * 1.2, (i / 3) * ts * 1.1); c.stroke(); }
    c.restore();
    if (art.finEdge) { c.strokeStyle = art.finEdge; c.lineWidth = L * 0.012; c.stroke(); }
  }

  /* ================================================================
   * Haaien
   * ================================================================ */
  const SHARK = {
    blacktip: { T: 1, dh: 1, pl: 1 },
    greyreef: { T: 1.05, dh: 0.95, pl: 1.05 },
    galapagos: { T: 1.08, dh: 1, pl: 1.05 },
    oceanic: { T: 1.12, dh: 1.0, pl: 1.75, round: true },
    hammer: { T: 0.95, dh: 1.5, pl: 0.95, hammer: true },
    whale: { T: 1.3, dh: 0.75, pl: 1.1, whale: true },
    cat: { T: 0.72, dh: 0.5, pl: 0.7, back: true },
  };

  function sharkBody(c, L, v) {
    const T = v.T;
    c.beginPath();
    if (v.whale) {
      c.moveTo(0.5 * L, -0.035 * L);
      c.bezierCurveTo(0.49 * L, -0.08 * L * T, 0.36 * L, -0.1 * L * T, 0.15 * L, -0.1 * L * T);
    } else {
      c.moveTo(0.5 * L, 0.01 * L);
      c.bezierCurveTo(0.49 * L, -0.04 * L, 0.36 * L, -0.085 * L * T, 0.15 * L, -0.09 * L * T);
    }
    c.bezierCurveTo(-0.05 * L, -0.095 * L * T, -0.22 * L, -0.06 * L * T, -0.36 * L, -0.022 * L);
    c.lineTo(-0.36 * L, 0.018 * L);
    c.bezierCurveTo(-0.22 * L, 0.045 * L * T, -0.05 * L, 0.08 * L * T, 0.15 * L, 0.075 * L * T);
    if (v.whale) {
      c.bezierCurveTo(0.34 * L, 0.075 * L * T, 0.48 * L, 0.06 * L * T, 0.5 * L, 0.04 * L);
      c.closePath();
    } else {
      c.bezierCurveTo(0.34 * L, 0.07 * L * T, 0.48 * L, 0.05 * L, 0.5 * L, 0.01 * L);
      c.closePath();
    }
  }

  function drawSharkBody(c, art, L, seed) {
    const v = SHARK[art.v] || SHARK.blacktip;
    const T = v.T, rng = U.rng(seed);
    const fin = U.shade(art.c, -0.08);
    const d1a = v.back ? -0.06 : v.whale ? 0.03 : 0.1;
    const d1b = v.back ? -0.16 : v.whale ? -0.1 : -0.05;
    // eerste rugvin
    const apY = -0.09 * T - 0.11 * v.dh;
    c.beginPath();
    c.moveTo(d1a * L, -0.08 * L * T);
    c.quadraticCurveTo((d1a - 0.045) * L, apY * 0.62 * L, (d1b + 0.005) * L, apY * L);
    c.quadraticCurveTo((d1b - 0.004) * L, apY * 0.55 * L, (d1b - 0.025) * L, -0.07 * L * T);
    c.closePath();
    c.fillStyle = fin; c.fill();
    if (v.round) { c.beginPath(); c.arc((d1b + 0.0) * L, (apY + 0.015) * L, 0.022 * L, 0, TAU); c.fill(); }
    if (art.tip) {
      c.save(); c.clip(); c.fillStyle = art.tip;
      c.beginPath(); c.arc(d1b * L, apY * L, 0.035 * L, 0, TAU); c.fill(); c.restore();
    }
    // tweede rugvin + anaalvin + buikvin
    c.fillStyle = fin;
    c.beginPath(); c.moveTo(-0.23 * L, -0.05 * L * T); c.lineTo(-0.275 * L, -0.085 * L * T - 0.012 * L); c.lineTo(-0.29 * L, -0.04 * L * T); c.fill();
    c.beginPath(); c.moveTo(-0.25 * L, 0.04 * L * T); c.lineTo(-0.3 * L, 0.07 * L * T); c.lineTo(-0.31 * L, 0.03 * L * T); c.fill();
    c.beginPath(); c.moveTo(-0.13 * L, 0.06 * L * T); c.lineTo(-0.19 * L, 0.1 * L * T); c.lineTo(-0.185 * L, 0.055 * L * T); c.fill();
    // hamer
    if (v.hammer) {
      c.fillStyle = U.shade(art.c, -0.05);
      c.beginPath(); c.ellipse(0.47 * L, -0.005 * L, 0.05 * L, 0.14 * L, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.004 * L; c.stroke();
    }
    // lijf
    c.save();
    sharkBody(c, L, v);
    const g = c.createLinearGradient(0, -0.1 * L * T, 0, 0.08 * L * T);
    g.addColorStop(0, U.shade(art.c, -0.15));
    g.addColorStop(0.5, art.c);
    g.addColorStop(0.62, U.mix(art.c, art.c2, 0.6));
    g.addColorStop(1, art.c2);
    c.fillStyle = g; c.fill();
    c.clip();
    if (v.whale) {
      c.fillStyle = 'rgba(240,245,250,0.85)';
      for (let x = -0.34; x < 0.44; x += 0.035) {
        for (let y = -0.095; y < 0.03; y += 0.03) {
          const jx = (rng() - 0.5) * 0.01, jy = (rng() - 0.5) * 0.01;
          c.beginPath(); c.arc((x + jx) * L, (y + jy + (x > 0.3 ? 0.005 : 0)) * L * T, 0.006 * L, 0, TAU); c.fill();
        }
      }
      c.strokeStyle = 'rgba(230,240,245,0.35)'; c.lineWidth = 0.004 * L;
      for (let x = -0.3; x < 0.25; x += 0.06) { c.beginPath(); c.moveTo(x * L, -0.1 * L * T); c.lineTo((x - 0.01) * L, 0.02 * L * T); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 0.006 * L;
      c.beginPath(); c.moveTo(0.3 * L, -0.065 * L * T); c.quadraticCurveTo(-0.05 * L, -0.08 * L * T, -0.3 * L, -0.025 * L); c.stroke();
      c.beginPath(); c.moveTo(0.25 * L, -0.03 * L * T); c.quadraticCurveTo(-0.05 * L, -0.04 * L * T, -0.3 * L, -0.005 * L); c.stroke();
    }
    if (art.spot) {
      c.fillStyle = art.spot;
      for (let i = 0; i < 70; i++) {
        c.beginPath(); c.arc(U.lerp(-0.34, 0.45, rng()) * L, U.lerp(-0.09, 0.02, rng()) * L * T, 0.006 * L * U.lerp(0.6, 1.4, rng()), 0, TAU); c.fill();
      }
    }
    c.restore();
    sharkBody(c, L, v);
    c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 0.005 * L; c.stroke();
    // kieuwspleten
    c.strokeStyle = 'rgba(0,0,0,0.3)';
    c.lineWidth = 0.004 * L;
    const gx = v.whale ? 0.3 : 0.27;
    for (let i = 0; i < 5; i++) {
      const x = (gx - i * 0.014) * L;
      c.beginPath(); c.moveTo(x, -0.035 * L * T); c.quadraticCurveTo(x - 0.008 * L, 0.0, x, (v.whale ? 0.05 : 0.035) * L * T); c.stroke();
    }
    // borstvin
    const pl = v.pl;
    c.beginPath();
    c.moveTo(0.21 * L, 0.055 * L * T);
    c.quadraticCurveTo(0.15 * L, 0.1 * L * T + 0.02 * L, (0.07 - 0.04 * pl) * L, (0.07 * T + 0.1 * pl) * L);
    if (v.round) c.quadraticCurveTo((0.04 - 0.04 * pl) * L, (0.07 * T + 0.1 * pl) * L + 0.02 * L, (0.03 - 0.03 * pl) * L, (0.06 * T + 0.09 * pl) * L);
    c.quadraticCurveTo(0.1 * L, 0.09 * L * T, 0.12 * L, 0.065 * L * T);
    c.closePath();
    c.fillStyle = U.shade(art.c, -0.12); c.fill();
    if (art.tip) {
      c.save(); c.clip(); c.fillStyle = art.tip;
      c.beginPath(); c.arc((0.05 - 0.04 * pl) * L, (0.07 * T + 0.1 * pl) * L, 0.045 * L * Math.min(pl, 1.3), 0, TAU); c.fill(); c.restore();
    }
    // oog en bek
    if (v.hammer) {
      c.fillStyle = '#121418';
      c.beginPath(); c.arc(0.47 * L, -0.135 * L, 0.011 * L, 0, TAU); c.fill();
      c.beginPath(); c.arc(0.47 * L, 0.125 * L, 0.011 * L, 0, TAU); c.fill();
    } else if (v.whale) {
      c.fillStyle = '#121418'; c.beginPath(); c.arc(0.43 * L, -0.012 * L, 0.006 * L, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(20,20,25,0.7)'; c.lineWidth = 0.008 * L;
      c.beginPath(); c.moveTo(0.5 * L, 0.02 * L); c.lineTo(0.43 * L, 0.025 * L); c.stroke();
    } else {
      c.fillStyle = v.back ? '#d8c060' : '#16181c';
      c.beginPath(); c.ellipse(0.4 * L, -0.022 * L * T, (v.back ? 0.016 : 0.011) * L, (v.back ? 0.008 : 0.01) * L, 0, 0, TAU); c.fill();
      if (v.back) { c.fillStyle = '#111'; c.beginPath(); c.ellipse(0.4 * L, -0.022 * L * T, 0.004 * L, 0.007 * L, 0, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.004 * L;
      c.beginPath(); c.moveTo(0.44 * L, 0.04 * L * T); c.quadraticCurveTo(0.4 * L, 0.055 * L * T, 0.36 * L, 0.045 * L * T); c.stroke();
    }
  }

  function drawSharkTail(c, art, L) {
    const v = SHARK[art.v] || SHARK.blacktip;
    c.beginPath();
    if (v.whale) {
      c.moveTo(0.02 * L, -0.022 * L);
      c.quadraticCurveTo(-0.06 * L, -0.07 * L, -0.17 * L, -0.2 * L);
      c.quadraticCurveTo(-0.12 * L, -0.06 * L, -0.11 * L, 0);
      c.quadraticCurveTo(-0.12 * L, 0.06 * L, -0.15 * L, 0.13 * L);
      c.quadraticCurveTo(-0.06 * L, 0.05 * L, 0.02 * L, 0.018 * L);
    } else if (v.back) {
      c.moveTo(0.02 * L, -0.02 * L);
      c.quadraticCurveTo(-0.08 * L, -0.03 * L, -0.2 * L, -0.045 * L);
      c.quadraticCurveTo(-0.17 * L, 0.0, -0.19 * L, 0.02 * L);
      c.quadraticCurveTo(-0.1 * L, 0.035 * L, 0.02 * L, 0.015 * L);
    } else {
      c.moveTo(0.02 * L, -0.022 * L);
      c.quadraticCurveTo(-0.07 * L, -0.05 * L, -0.165 * L, -0.15 * L);
      c.quadraticCurveTo(-0.12 * L, -0.06 * L, -0.1 * L, -0.008 * L);
      c.quadraticCurveTo(-0.12 * L, 0.03 * L, -0.125 * L, 0.075 * L);
      c.quadraticCurveTo(-0.06 * L, 0.04 * L, 0.02 * L, 0.018 * L);
    }
    c.closePath();
    const g = c.createLinearGradient(0, -0.15 * L, 0, 0.08 * L);
    g.addColorStop(0, U.shade(art.c, -0.15)); g.addColorStop(1, art.c);
    c.fillStyle = g; c.fill();
    if (art.v === 'blacktip') {
      c.save(); c.clip(); c.fillStyle = art.tip;
      c.beginPath(); c.arc(-0.125 * L, 0.075 * L, 0.03 * L, 0, TAU); c.fill();
      c.beginPath(); c.arc(-0.165 * L, -0.15 * L, 0.025 * L, 0, TAU); c.fill(); c.restore();
    }
    if (art.v === 'greyreef') { c.strokeStyle = 'rgba(15,15,15,0.8)'; c.lineWidth = 0.012 * L; c.stroke(); }
    if (art.v === 'oceanic') {
      c.save(); c.clip(); c.fillStyle = art.tip;
      c.beginPath(); c.arc(-0.165 * L, -0.15 * L, 0.03 * L, 0, TAU); c.fill();
      c.beginPath(); c.arc(-0.125 * L, 0.075 * L, 0.025 * L, 0, TAU); c.fill(); c.restore();
    }
  }

  /* ================================================================
   * Dolfijn / bruinvis
   * ================================================================ */
  function mammalPath(c, L, v) {
    c.beginPath();
    if (v === 'dolphin') {
      c.moveTo(0.5 * L, 0.03 * L);
      c.quadraticCurveTo(0.47 * L, 0.005 * L, 0.41 * L, 0.0);
      c.bezierCurveTo(0.38 * L, -0.065 * L, 0.28 * L, -0.09 * L, 0.14 * L, -0.092 * L);
      c.bezierCurveTo(-0.05 * L, -0.092 * L, -0.24 * L, -0.05 * L, -0.38 * L, -0.013 * L);
      c.lineTo(-0.38 * L, 0.013 * L);
      c.bezierCurveTo(-0.24 * L, 0.04 * L, -0.05 * L, 0.09 * L, 0.14 * L, 0.085 * L);
      c.bezierCurveTo(0.3 * L, 0.08 * L, 0.42 * L, 0.06 * L, 0.5 * L, 0.03 * L);
    } else {
      c.moveTo(0.5 * L, 0.015 * L);
      c.bezierCurveTo(0.5 * L, -0.05 * L, 0.42 * L, -0.09 * L, 0.24 * L, -0.1 * L);
      c.bezierCurveTo(0.0, -0.105 * L, -0.24 * L, -0.055 * L, -0.38 * L, -0.014 * L);
      c.lineTo(-0.38 * L, 0.014 * L);
      c.bezierCurveTo(-0.24 * L, 0.05 * L, 0.0, 0.1 * L, 0.24 * L, 0.095 * L);
      c.bezierCurveTo(0.42 * L, 0.085 * L, 0.5 * L, 0.06 * L, 0.5 * L, 0.015 * L);
    }
    c.closePath();
  }
  function drawMammalBody(c, art, L) {
    const v = art.v;
    // rugvin
    c.fillStyle = U.shade(art.c, -0.1);
    c.beginPath();
    if (v === 'dolphin') {
      c.moveTo(0.07 * L, -0.09 * L); c.quadraticCurveTo(0.0, -0.14 * L, -0.08 * L, -0.19 * L);
      c.quadraticCurveTo(-0.05 * L, -0.12 * L, -0.1 * L, -0.084 * L);
    } else {
      c.moveTo(0.05 * L, -0.098 * L); c.lineTo(-0.02 * L, -0.16 * L); c.lineTo(-0.08 * L, -0.09 * L);
    }
    c.closePath(); c.fill();
    c.save();
    mammalPath(c, L, v);
    const g = c.createLinearGradient(0, -0.1 * L, 0, 0.09 * L);
    g.addColorStop(0, U.shade(art.c, -0.15)); g.addColorStop(0.45, art.c); g.addColorStop(0.62, art.c2); g.addColorStop(1, art.c2);
    c.fillStyle = g; c.fill(); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.08)';
    c.beginPath(); c.ellipse(0.1 * L, -0.06 * L, 0.3 * L, 0.02 * L, 0, 0, TAU); c.fill();
    c.restore();
    mammalPath(c, L, v);
    c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 0.004 * L; c.stroke();
    // borstvin
    c.fillStyle = U.shade(art.c, -0.05);
    c.beginPath(); c.moveTo(0.27 * L, 0.06 * L); c.quadraticCurveTo(0.2 * L, 0.12 * L, 0.12 * L, 0.15 * L);
    c.quadraticCurveTo(0.18 * L, 0.09 * L, 0.21 * L, 0.07 * L); c.closePath(); c.fill();
    // oog, bek
    c.fillStyle = '#16181c';
    c.beginPath(); c.arc((v === 'dolphin' ? 0.36 : 0.4) * L, -0.012 * L, 0.009 * L, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.004 * L;
    c.beginPath();
    if (v === 'dolphin') { c.moveTo(0.5 * L, 0.03 * L); c.quadraticCurveTo(0.44 * L, 0.035 * L, 0.39 * L, 0.025 * L); }
    else { c.moveTo(0.5 * L, 0.03 * L); c.quadraticCurveTo(0.47 * L, 0.04 * L, 0.44 * L, 0.035 * L); }
    c.stroke();
  }
  function drawMammalTail(c, art, L) {
    c.beginPath();
    c.moveTo(0.02 * L, -0.013 * L);
    c.quadraticCurveTo(-0.06 * L, -0.02 * L, -0.12 * L, -0.05 * L);
    c.quadraticCurveTo(-0.095 * L, 0, -0.12 * L, 0.05 * L);
    c.quadraticCurveTo(-0.06 * L, 0.02 * L, 0.02 * L, 0.013 * L);
    c.closePath();
    c.fillStyle = U.shade(art.c, -0.1); c.fill();
  }

  /* ================================================================
   * Sprites (gecachet per soort en schaal)
   * ================================================================ */
  const spriteCache = new Map();
  Art.clearSprites = () => spriteCache.clear();

  function sizeOf(spc) { return spc.size * (spc.ds || 1); }

  Art.isSprite = (art) => art.t === 'fish' || art.t === 'shark' || art.t === 'mammal';

  Art.sprite = function (spc, pxm) {
    pxm = Math.max(4, Math.round(pxm));
    const L = sizeOf(spc);
    if (L * pxm > 2400) pxm = Math.floor(2400 / L);
    const key = spc.id + '@' + pxm;
    let sp = spriteCache.get(key);
    if (sp) return sp;
    const art = spc.art;
    let bodyBox, tailBox, tbx, drawB, drawT;
    const seed = U.hash(spc.id);
    if (art.t === 'fish') {
      const sh = SHAPES[art.shape || 'oval'];
      const hh = (art.h * L) / 2;
      const top = art.dorsal === 'banner' ? hh * 2.7 : art.dorsal === 'batfish' ? hh * 2.1 : hh * 1.75;
      const bot = art.dorsal === 'batfish' ? hh * 2.0 : art.shape === 'disc' ? hh * 1.6 : hh * 1.45;
      bodyBox = [sh.tb * L - 0.02 * L, -top, 0.62 * L, bot];
      const g = tailGeom(art, L);
      tailBox = [-g.tl * 1.4, -g.ts * 1.45, 0.04 * L, g.ts * 1.45];
      tbx = sh.tb * L;
      drawB = (c) => drawFishBody(c, art, L, seed);
      drawT = (c) => drawFishTail(c, art, L);
    } else if (art.t === 'shark') {
      const v = SHARK[art.v] || SHARK.blacktip;
      bodyBox = [-0.37 * L, -0.24 * L * Math.max(1, v.dh * 0.9), 0.52 * L, (0.08 * v.T + 0.13 * v.pl + 0.03) * L];
      if (v.hammer) bodyBox[1] = -0.26 * L, bodyBox[3] = Math.max(bodyBox[3], 0.16 * L);
      tailBox = [-0.2 * L, -0.22 * L, 0.03 * L, 0.16 * L];
      tbx = -0.36 * L;
      drawB = (c) => drawSharkBody(c, art, L, seed);
      drawT = (c) => drawSharkTail(c, art, L);
    } else if (art.t === 'mammal') {
      bodyBox = [-0.39 * L, -0.2 * L, 0.51 * L, 0.17 * L];
      tailBox = [-0.14 * L, -0.07 * L, 0.03 * L, 0.07 * L];
      tbx = -0.38 * L;
      drawB = (c) => drawMammalBody(c, art, L);
      drawT = (c) => drawMammalTail(c, art, L);
    } else return null;
    const mk = (box, fn) => {
      const w = Math.max(2, Math.ceil((box[2] - box[0]) * pxm) + 4);
      const h = Math.max(2, Math.ceil((box[3] - box[1]) * pxm) + 4);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const c = cv.getContext('2d');
      c.setTransform(pxm, 0, 0, pxm, -box[0] * pxm + 2, -box[1] * pxm + 2);
      fn(c);
      return { cv, x: box[0] - 2 / pxm, y: box[1] - 2 / pxm, w: w / pxm, h: h / pxm };
    };
    sp = { body: mk(bodyBox, drawB), tail: mk(tailBox, drawT), tbx, alpha: art.alpha || 1 };
    spriteCache.set(key, sp);
    if (spriteCache.size > 400) spriteCache.delete(spriteCache.keys().next().value);
    return sp;
  };

  /* ================================================================
   * Live getekende dieren
   * ================================================================ */
  function drawRay(c, art, W, t, st) {
    const k = 0.5, ph = st.phase || 0;
    const fr = art.v === 'manta' ? 1.25 : 1.7;
    const f = Math.sin(t * fr + ph), g = Math.cos(t * fr + ph);
    const up = -f * W * 0.13;
    const eagle = art.v === 'eagle';
    const tipX = (eagle ? -0.17 : -0.1) * W + g * W * 0.035;
    const span = W * 0.5 * k;
    const back = art.c;
    // staart
    c.strokeStyle = U.shade(back, 0.1);
    c.lineWidth = W * (eagle ? 0.01 : 0.014);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-W * 0.18, 0);
    const tl = eagle ? 1.0 : 0.48;
    c.quadraticCurveTo(-W * (tl * 0.6), Math.sin(t * 2 + ph) * W * 0.03, -W * tl, Math.sin(t * 2 + ph + 1) * W * 0.06);
    c.stroke();
    function wing(side, col) {
      const tipY = side * span + up * (side < 0 ? 1 : 0.75);
      c.beginPath();
      c.moveTo(W * 0.17, side * W * 0.05 * k);
      c.bezierCurveTo(W * 0.13, side * span * 0.5 + up * 0.35, W * (eagle ? -0.02 : 0.03), tipY - side * W * 0.03, tipX, tipY);
      c.bezierCurveTo(-W * 0.07, tipY * 0.55, -W * 0.13, side * W * 0.12 * k, -W * 0.2, side * W * 0.02 * k);
      c.lineTo(0, 0);
      c.closePath();
      const gr = c.createLinearGradient(0, 0, tipX, tipY);
      gr.addColorStop(0, col); gr.addColorStop(1, U.shade(col, 0.08));
      c.fillStyle = gr; c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = W * 0.004; c.stroke();
    }
    wing(-1, U.shade(back, -0.12));
    // lijf
    c.fillStyle = back;
    c.beginPath(); c.ellipse(0, 0, W * 0.21, W * 0.075, 0, 0, TAU); c.fill();
    if (eagle) { c.beginPath(); c.ellipse(W * 0.22, 0, W * 0.07, W * 0.032, 0, 0, TAU); c.fill(); }
    wing(1, back);
    if (art.v === 'manta') {
      // kopvinnen
      c.fillStyle = U.shade(back, 0.05);
      [-1, 1].forEach((s) => {
        c.beginPath(); c.ellipse(W * 0.23, s * W * 0.042, W * 0.055, W * 0.018, s * 0.35, 0, TAU); c.fill();
      });
      // witte schoudervlekken
      c.fillStyle = U.rgba(art.patch, 0.85);
      [-1, 1].forEach((s) => {
        c.beginPath(); c.ellipse(W * 0.05, s * W * 0.075 + up * 0.15, W * 0.075, W * 0.03, s * -0.5, 0, TAU); c.fill();
      });
      c.fillStyle = 'rgba(255,255,255,0.08)';
      c.beginPath(); c.ellipse(W * 0.02, -W * 0.02, W * 0.15, W * 0.03, 0, 0, TAU); c.fill();
    } else {
      const rng = U.rng(7);
      c.fillStyle = art.spot;
      for (let i = 0; i < 55; i++) {
        const a = rng() * TAU, rr = Math.sqrt(rng());
        const x = Math.cos(a) * rr * W * 0.3 - W * 0.04;
        const y = Math.sin(a) * rr * span * 0.9 + up * (y0(a) * 0.6);
        c.beginPath(); c.arc(x, y, W * 0.008, 0, TAU); c.fill();
      }
    }
    function y0(a) { return Math.abs(Math.sin(a)); }
    c.fillStyle = '#0c0d10';
    c.beginPath(); c.arc(W * (eagle ? 0.21 : 0.2), -W * 0.035, W * 0.008, 0, TAU); c.fill();
  }

  function drawTurtle(c, art, L, t, st) {
    const hawk = art.v === 'hawksbill';
    const shell = hawk ? '#7a4e26' : '#5f6334';
    const shell2 = hawk ? '#d8a040' : '#9a7a44';
    const skin = hawk ? '#c8a878' : '#8f8f6c';
    const ph = st.phase || 0;
    const a = Math.sin(t * 1.2 + ph);
    function flipper(x, y, len, w, ang, col) {
      c.save(); c.translate(x, y); c.rotate(ang);
      c.fillStyle = col;
      c.beginPath(); c.ellipse(len * 0.45, 0, len * 0.5, w, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = L * 0.006; c.stroke();
      c.restore();
    }
    flipper(-0.3 * L, 0.03 * L, 0.18 * L, 0.035 * L, 2.75 + a * 0.2, U.shade(skin, -0.25));
    flipper(0.2 * L, 0.02 * L, 0.42 * L, 0.06 * L, 2.05 + a * 0.55, U.shade(skin, -0.2));
    // kop
    c.fillStyle = skin;
    c.beginPath(); c.ellipse(0.38 * L, 0.0, 0.1 * L, 0.055 * L, -0.1, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(0.47 * L, -0.012 * L, 0.085 * L, 0.06 * L, -0.15, 0, TAU); c.fill();
    c.fillStyle = U.shade(skin, -0.35);
    c.beginPath(); c.moveTo(0.53 * L, -0.03 * L); c.lineTo(0.565 * L, 0.0); c.lineTo(0.53 * L, 0.02 * L); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(0.49 * L, -0.03 * L, 0.012 * L, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(60,40,20,0.35)'; c.lineWidth = L * 0.004;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(0.44 * L + i * 0.02 * L, -0.045 * L, 0.012 * L, 0, Math.PI); c.stroke(); }
    // schild
    c.beginPath();
    c.moveTo(-0.4 * L, 0.04 * L);
    c.bezierCurveTo(-0.36 * L, -0.22 * L, 0.24 * L, -0.25 * L, 0.37 * L, 0.02 * L);
    c.quadraticCurveTo(0.0, 0.12 * L, -0.4 * L, 0.04 * L);
    c.closePath();
    const g = c.createLinearGradient(0, -0.22 * L, 0, 0.1 * L);
    g.addColorStop(0, U.shade(shell, 0.12)); g.addColorStop(1, U.shade(shell, -0.25));
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    const rng = U.rng(hawk ? 3 : 5);
    for (let i = 0; i < 5; i++) {
      const x = U.lerp(-0.32, 0.26, i / 4) * L;
      c.fillStyle = U.rgba(shell2, 0.35);
      c.beginPath(); c.ellipse(x, -0.1 * L, 0.06 * L, 0.06 * L, 0, 0, TAU); c.fill();
      c.strokeStyle = U.rgba(shell2, 0.6); c.lineWidth = L * 0.006;
      for (let j = 0; j < 4; j++) { c.beginPath(); c.moveTo(x, -0.1 * L); c.lineTo(x + (rng() - 0.5) * 0.12 * L, -0.1 * L + (rng() - 0.3) * 0.12 * L); c.stroke(); }
    }
    c.strokeStyle = 'rgba(30,20,10,0.45)'; c.lineWidth = L * 0.008;
    for (let i = 0; i < 4; i++) { const x = U.lerp(-0.22, 0.18, i / 3) * L; c.beginPath(); c.moveTo(x, -0.25 * L); c.lineTo(x + 0.02 * L, 0.05 * L); c.stroke(); }
    c.beginPath(); c.moveTo(-0.4 * L, -0.04 * L); c.quadraticCurveTo(0, -0.14 * L, 0.36 * L, -0.03 * L); c.stroke();
    c.restore();
    // buikschild
    c.fillStyle = hawk ? '#e8d4a0' : '#d8cc98';
    c.beginPath(); c.moveTo(-0.36 * L, 0.05 * L); c.quadraticCurveTo(0, 0.13 * L, 0.34 * L, 0.03 * L); c.quadraticCurveTo(0, 0.08 * L, -0.36 * L, 0.05 * L); c.fill();
    flipper(-0.28 * L, 0.06 * L, 0.17 * L, 0.035 * L, 2.85 - a * 0.2, skin);
    flipper(0.22 * L, 0.05 * L, 0.44 * L, 0.065 * L, 2.2 - a * 0.6, skin);
  }

  function rockMound(c, L, col, w) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-w * L, 0.02 * L);
    c.bezierCurveTo(-w * 0.9 * L, -0.3 * L, -0.1 * L, -0.38 * L, 0.05 * L, -0.3 * L);
    c.bezierCurveTo(0.2 * L, -0.25 * L, w * 0.8 * L, -0.22 * L, w * L, 0.02 * L);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.08)';
    c.beginPath(); c.ellipse(-0.05 * L, -0.28 * L, w * 0.5 * L, 0.05 * L, 0, 0, TAU); c.fill();
  }

  function drawMoray(c, art, L, t, st) {
    const ph = st.phase || 0;
    rockMound(c, L, st.rock || '#6a5e50', 0.35);
    c.fillStyle = '#14100c';
    c.beginPath(); c.ellipse(0.02 * L, -0.15 * L, 0.09 * L, 0.07 * L, 0, 0, TAU); c.fill();
    const sw = Math.sin(t * 0.8 + ph) * 0.02 * L;
    const p0 = [0.02 * L, -0.14 * L], p1 = [0.08 * L, -0.3 * L + sw], p2 = [0.2 * L, -0.32 * L + sw * 1.5];
    const w = 0.07 * L;
    c.lineCap = 'round';
    c.strokeStyle = U.shade(art.c, -0.15); c.lineWidth = w;
    c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.stroke();
    c.strokeStyle = art.c; c.lineWidth = w * 0.75;
    c.beginPath(); c.moveTo(p0[0], p0[1] - w * 0.1); c.quadraticCurveTo(p1[0], p1[1] - w * 0.1, p2[0], p2[1] - w * 0.1); c.stroke();
    const rng = U.rng(U.hash(art.c));
    c.fillStyle = art.spot;
    for (let i = 0; i < 40; i++) {
      const tt = rng();
      const x = (1 - tt) * (1 - tt) * p0[0] + 2 * (1 - tt) * tt * p1[0] + tt * tt * p2[0];
      const y = (1 - tt) * (1 - tt) * p0[1] + 2 * (1 - tt) * tt * p1[1] + tt * tt * p2[1];
      c.beginPath(); c.arc(x + (rng() - 0.5) * w * 0.7, y + (rng() - 0.5) * w * 0.7, w * (art.leopard ? 0.13 : 0.09), 0, TAU); c.fill();
    }
    // kop
    const m = 0.12 + 0.13 * Math.max(0, Math.sin(t * 1.6 + ph));
    c.save(); c.translate(p2[0], p2[1]); c.rotate(-0.1);
    c.fillStyle = '#7a2a2a';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0.11 * L, -0.005 * L); c.lineTo(0.1 * L, 0.03 * L * (1 + m * 3)); c.fill();
    c.fillStyle = art.c;
    c.beginPath(); c.ellipse(0.04 * L, -0.012 * L, 0.075 * L, 0.03 * L, -0.05, 0, TAU); c.fill();
    c.save(); c.rotate(m);
    c.beginPath(); c.ellipse(0.04 * L, 0.012 * L, 0.07 * L, 0.018 * L, 0.05, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = art.spot;
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc((-0.01 + i * 0.015) * L, (-0.02 + (i % 2) * 0.012) * L, w * 0.08, 0, TAU); c.fill(); }
    drawEye(c, 0.07 * L, -0.025 * L, 0.009 * L, '#d8d070');
    c.restore();
  }

  function drawGardenEels(c, art, L, t, st) {
    const eels = st.eels || [{ x: -0.3 * L, ext: 1, ph: 0 }, { x: 0, ext: 1, ph: 1 }, { x: 0.3 * L, ext: 1, ph: 2 }];
    eels.forEach((e) => {
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.beginPath(); c.ellipse(e.x, 0, L * 0.035, L * 0.012, 0, 0, TAU); c.fill();
      const h = Math.max(0.02, e.ext) * L;
      if (e.ext < 0.06) return;
      const sw = Math.sin(t * 1.4 + e.ph) * 0.08 * L;
      const tx = e.x + 0.12 * h + sw * 0.5, ty = -h;
      c.strokeStyle = '#ece6d6'; c.lineWidth = L * 0.04; c.lineCap = 'round';
      c.beginPath(); c.moveTo(e.x, 0); c.quadraticCurveTo(e.x + sw, -h * 0.55, tx, ty); c.stroke();
      c.fillStyle = '#1a1a1a';
      for (let i = 1; i < 8; i++) {
        const tt = i / 8;
        const x = (1 - tt) * (1 - tt) * e.x + 2 * (1 - tt) * tt * (e.x + sw) + tt * tt * tx;
        const y = 2 * (1 - tt) * tt * (-h * 0.55) + tt * tt * ty;
        c.beginPath(); c.arc(x + ((i % 2) - 0.5) * L * 0.012, y, L * 0.009, 0, TAU); c.fill();
      }
      c.fillStyle = '#ece6d6';
      c.beginPath(); c.ellipse(tx + L * 0.03, ty + L * 0.01, L * 0.04, L * 0.025, 0.4, 0, TAU); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(tx + L * 0.04, ty + L * 0.002, L * 0.009, 0, TAU); c.fill();
    });
  }

  function drawOctopus(c, art, L, t, st) {
    const ph = st.phase || 0;
    const mix = 0.5 + 0.5 * Math.sin(t * 0.6 + ph);
    const col = U.mix(art.c, art.c2, mix * 0.35);
    const jet = st.mode === 'jet';
    c.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      let ang = jet ? Math.PI + (i - 3.5) * 0.08 : Math.PI / 2 + (i - 3.5) * 0.36;
      let x = 0, y = -0.05 * L;
      const seg = 9, len = (jet ? 0.55 : 0.42) * L / seg;
      for (let s = 0; s < seg; s++) {
        ang += Math.sin(t * 2.2 + i * 1.3 + s * 0.6 + ph) * (jet ? 0.08 : 0.22) * (s / seg + 0.3);
        if (!jet && y > -0.01 * L) ang -= 0.25 * Math.sign(Math.cos(ang) + 0.001);
        const nx = x + Math.cos(ang) * len, ny = Math.min(0, y + Math.sin(ang) * len);
        c.strokeStyle = U.shade(col, i % 2 ? -0.1 : 0);
        c.lineWidth = L * 0.07 * (1 - s / seg) + L * 0.01;
        c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke();
        x = nx; y = ny;
      }
    }
    c.save();
    c.translate(jet ? 0.12 * L : -0.02 * L, jet ? -0.08 * L : -0.18 * L);
    c.rotate(jet ? -1.5 : -0.5);
    const g = c.createRadialGradient(0, -0.04 * L, 0.02 * L, 0, 0, 0.18 * L);
    g.addColorStop(0, U.shade(col, 0.2)); g.addColorStop(1, U.shade(col, -0.2));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(0, -0.05 * L, 0.13 * L, 0.17 * L, 0, 0, TAU); c.fill();
    const rng = U.rng(11);
    c.fillStyle = U.rgba('#ffffff', 0.25);
    for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((rng() - 0.5) * 0.2 * L, (rng() - 0.7) * 0.25 * L, 0.012 * L, 0, TAU); c.fill(); }
    c.restore();
    c.fillStyle = U.shade(col, 0.1);
    c.beginPath(); c.arc(0.07 * L, -0.09 * L, 0.035 * L, 0, TAU); c.fill();
    c.fillStyle = '#e8d890'; c.beginPath(); c.ellipse(0.075 * L, -0.095 * L, 0.018 * L, 0.012 * L, 0, 0, TAU); c.fill();
    c.fillStyle = '#111'; c.fillRect(0.062 * L, -0.098 * L, 0.026 * L, 0.006 * L);
  }

  function drawCuttle(c, art, L, t, st) {
    const ph = st.phase || 0;
    // vinzoom
    c.fillStyle = U.rgba(art.c2, 0.55);
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * TAU;
      const r = 1 + 0.06 * Math.sin(i * 1.6 - t * 7 + ph);
      const x = -0.05 * L + Math.cos(a) * 0.38 * L * r;
      const y = Math.sin(a) * 0.17 * L * r;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.fill();
    // armen
    c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      c.strokeStyle = U.shade(art.c, -0.1 + i * 0.03);
      c.lineWidth = 0.025 * L;
      const y0 = (i - 2.5) * 0.012 * L;
      c.beginPath(); c.moveTo(0.36 * L, y0);
      c.quadraticCurveTo(0.48 * L, y0 + Math.sin(t * 3 + i) * 0.02 * L, 0.58 * L, y0 * 1.6 + Math.sin(t * 2 + i) * 0.03 * L);
      c.stroke();
    }
    // mantel
    c.save();
    c.beginPath(); c.ellipse(-0.05 * L, 0, 0.35 * L, 0.13 * L, 0, 0, TAU);
    c.ellipse(0.32 * L, 0, 0.09 * L, 0.09 * L, 0, 0, TAU);
    const g = c.createLinearGradient(0, -0.13 * L, 0, 0.13 * L);
    g.addColorStop(0, U.shade(art.c, -0.15)); g.addColorStop(0.6, art.c); g.addColorStop(1, art.c2);
    c.fillStyle = g; c.fill(); c.clip();
    c.fillStyle = 'rgba(40,30,20,0.35)';
    const off = (t * 0.45) % 0.12;
    for (let x = -0.42; x < 0.32; x += 0.12) {
      c.beginPath();
      c.moveTo((x + off) * L, -0.14 * L); c.lineTo((x + off + 0.04) * L, -0.14 * L);
      c.lineTo((x + off + 0.02) * L, 0.02 * L); c.lineTo((x + off - 0.02) * L, 0.02 * L); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.35)';
    const rng = U.rng(4);
    for (let i = 0; i < 25; i++) { c.beginPath(); c.arc(U.lerp(-0.38, 0.25, rng()) * L, U.lerp(-0.1, 0.02, rng()) * L, 0.006 * L, 0, TAU); c.fill(); }
    c.restore();
    // oog
    c.fillStyle = '#e8e0b0'; c.beginPath(); c.ellipse(0.31 * L, -0.03 * L, 0.035 * L, 0.028 * L, 0, 0, TAU); c.fill();
    c.strokeStyle = '#111'; c.lineWidth = 0.008 * L;
    c.beginPath(); c.moveTo(0.29 * L, -0.04 * L); c.lineTo(0.3 * L, -0.02 * L); c.lineTo(0.31 * L, -0.032 * L); c.lineTo(0.32 * L, -0.02 * L); c.lineTo(0.33 * L, -0.04 * L); c.stroke();
  }

  function drawPygmy(c, art, L) {
    c.fillStyle = art.c;
    c.beginPath();
    c.moveTo(0.08 * L, -0.42 * L);
    c.quadraticCurveTo(0.32 * L, -0.5 * L, 0.32 * L, -0.4 * L);
    c.quadraticCurveTo(0.2 * L, -0.36 * L, 0.12 * L, -0.3 * L);
    c.quadraticCurveTo(0.28 * L, -0.05 * L, 0.06 * L, 0.12 * L);
    c.quadraticCurveTo(-0.08 * L, 0.3 * L, 0.05 * L, 0.4 * L);
    c.quadraticCurveTo(0.18 * L, 0.42 * L, 0.12 * L, 0.3 * L);
    c.quadraticCurveTo(0.0, 0.3 * L, 0.0, 0.2 * L);
    c.quadraticCurveTo(-0.15 * L, -0.05 * L, -0.05 * L, -0.3 * L);
    c.quadraticCurveTo(-0.02 * L, -0.48 * L, 0.08 * L, -0.42 * L);
    c.fill();
    c.fillStyle = art.c2;
    const pts = [[0.1, -0.42], [-0.02, -0.3], [0.18, -0.15], [0.12, 0.0], [-0.06, -0.1], [0.04, 0.12], [0.02, 0.3], [0.12, 0.35], [-0.08, 0.05]];
    pts.forEach((p) => { c.beginPath(); c.arc(p[0] * L, p[1] * L, 0.045 * L, 0, TAU); c.fill(); });
    c.fillStyle = '#222'; c.beginPath(); c.arc(0.14 * L, -0.4 * L, 0.025 * L, 0, TAU); c.fill();
  }

  function drawNudi(c, art, L, t, st) {
    const ph = st.phase || 0;
    if (art.v === 'aeolid') {
      c.fillStyle = art.c;
      c.beginPath(); c.ellipse(0, -0.06 * L, 0.5 * L, 0.08 * L, 0, 0, TAU); c.fill();
      for (let i = 0; i < 22; i++) {
        const x = U.lerp(-0.42, 0.32, i / 21) * L;
        const ang = -1.9 + Math.sin(t * 1.5 + i * 0.5 + ph) * 0.18 - x / L * 0.5;
        const len = (0.13 + 0.08 * Math.sin(i * 2.3)) * L;
        c.strokeStyle = i % 2 ? art.c2 : U.shade(art.c2, 0.25);
        c.lineWidth = 0.035 * L; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, -0.1 * L); c.lineTo(x + Math.cos(ang) * len, -0.1 * L + Math.sin(ang) * len); c.stroke();
        c.fillStyle = '#f4ece0'; c.beginPath(); c.arc(x + Math.cos(ang) * len, -0.1 * L + Math.sin(ang) * len, 0.012 * L, 0, TAU); c.fill();
      }
      c.strokeStyle = U.shade(art.c, -0.2); c.lineWidth = 0.025 * L;
      c.beginPath(); c.moveTo(0.42 * L, -0.1 * L); c.lineTo(0.5 * L, -0.28 * L); c.moveTo(0.46 * L, -0.1 * L); c.lineTo(0.58 * L, -0.22 * L); c.stroke();
      return;
    }
    c.fillStyle = art.c2;
    c.beginPath(); c.ellipse(0, -0.09 * L, 0.52 * L, 0.13 * L, 0, 0, TAU); c.fill();
    c.fillStyle = art.c;
    c.beginPath(); c.ellipse(0, -0.1 * L, 0.48 * L, 0.11 * L, 0, 0, TAU); c.fill();
    c.strokeStyle = '#111'; c.lineWidth = 0.02 * L;
    c.beginPath(); c.ellipse(0, -0.12 * L, 0.38 * L, 0.05 * L, 0, Math.PI, TAU); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 0.012 * L;
    c.beginPath(); c.moveTo(-0.3 * L, -0.15 * L); c.lineTo(0.3 * L, -0.15 * L); c.stroke();
    c.strokeStyle = art.c3; c.lineWidth = 0.045 * L; c.lineCap = 'round';
    const sw = Math.sin(t * 2 + ph) * 0.02 * L;
    c.beginPath(); c.moveTo(0.34 * L, -0.15 * L); c.lineTo(0.38 * L + sw, -0.36 * L); c.stroke();
    c.beginPath(); c.moveTo(0.4 * L, -0.15 * L); c.lineTo(0.45 * L + sw, -0.33 * L); c.stroke();
    c.lineWidth = 0.025 * L;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(t * 1.3 + i) * 0.05;
      c.beginPath(); c.moveTo(-0.34 * L, -0.17 * L); c.lineTo(-0.34 * L + Math.cos(a) * 0.17 * L, -0.17 * L + Math.sin(a) * 0.17 * L); c.stroke();
    }
  }

  function drawLobster(c, art, L, t, st) {
    const ph = st.phase || 0, walk = st.walk || 0;
    c.lineCap = 'round';
    // poten
    c.strokeStyle = U.shade(art.c, -0.2); c.lineWidth = 0.018 * L;
    for (let i = 0; i < 4; i++) {
      const x = (0.18 - i * 0.07) * L, sw = Math.sin(walk * 6 + i * 1.7) * 0.03 * L;
      c.beginPath(); c.moveTo(x, -0.1 * L); c.lineTo(x + 0.03 * L + sw, -0.04 * L); c.lineTo(x + sw, 0); c.stroke();
    }
    // antennes
    c.strokeStyle = U.shade(art.c, 0.25); c.lineWidth = 0.008 * L;
    for (let i = 0; i < 2; i++) {
      const s = Math.sin(t * 1.3 + ph + i) * 0.06 * L;
      c.beginPath(); c.moveTo(0.3 * L, -0.16 * L); c.quadraticCurveTo(0.45 * L, -0.45 * L + s, (0.1 - i * 0.2) * L, -0.62 * L + s); c.stroke();
    }
    // achterlijf
    for (let i = 0; i < 6; i++) {
      const x = (-0.07 - i * 0.065) * L, r = (0.065 - i * 0.004) * L;
      c.fillStyle = U.shade(art.c, -0.05 + (i % 2) * 0.06);
      c.beginPath(); c.ellipse(x, -0.1 * L + i * 0.006 * L, 0.04 * L, r, 0, 0, TAU); c.fill();
    }
    c.fillStyle = U.shade(art.c, 0.05);
    c.beginPath(); c.moveTo(-0.44 * L, -0.08 * L); c.lineTo(-0.56 * L, -0.15 * L); c.lineTo(-0.58 * L, -0.02 * L); c.closePath(); c.fill();
    // schild
    const g = c.createLinearGradient(0, -0.2 * L, 0, 0);
    g.addColorStop(0, U.shade(art.c, 0.15)); g.addColorStop(1, U.shade(art.c, -0.25));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(0.1 * L, -0.12 * L, 0.19 * L, 0.075 * L, -0.05, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(0.27 * L, -0.15 * L); c.lineTo(0.36 * L, -0.15 * L); c.lineTo(0.27 * L, -0.1 * L); c.fill();
    c.fillStyle = U.rgba(art.c2, 0.5);
    const rng = U.rng(9);
    for (let i = 0; i < 18; i++) { c.beginPath(); c.arc(U.lerp(-0.4, 0.25, rng()) * L, U.lerp(-0.16, -0.06, rng()) * L, 0.007 * L, 0, TAU); c.fill(); }
    // scharen
    function claw(dx, dy, col, open) {
      c.strokeStyle = col; c.lineWidth = 0.04 * L;
      c.beginPath(); c.moveTo(0.22 * L, -0.1 * L); c.lineTo(0.32 * L + dx, -0.06 * L + dy); c.lineTo(0.4 * L + dx, -0.1 * L + dy); c.stroke();
      c.fillStyle = col;
      c.beginPath(); c.ellipse(0.5 * L + dx, -0.11 * L + dy, 0.11 * L, 0.045 * L, -0.1 - open, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(0.52 * L + dx, -0.075 * L + dy, 0.085 * L, 0.025 * L, 0.15 + open, 0, TAU); c.fill();
    }
    const op = 0.05 * Math.max(0, Math.sin(t * 0.9 + ph));
    claw(-0.03 * L, -0.03 * L, U.shade(art.c, -0.25), op);
    claw(0, 0, art.c, op);
    c.fillStyle = '#111'; c.beginPath(); c.arc(0.29 * L, -0.17 * L, 0.012 * L, 0, TAU); c.fill();
  }

  function drawCrab(c, art, L, t, st) {
    const walk = st.walk || 0, ph = st.phase || 0;
    c.lineCap = 'round';
    c.strokeStyle = U.shade(art.c, -0.15); c.lineWidth = 0.05 * L;
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 0; i < 4; i++) {
        const sw = Math.sin(walk * 7 + i * 1.3 + s) * 0.04 * L;
        const x0 = s * (0.15 + i * 0.06) * L;
        c.beginPath(); c.moveTo(x0, -0.32 * L); c.lineTo(s * (0.45 + i * 0.07) * L + sw, -0.38 * L); c.lineTo(s * (0.55 + i * 0.06) * L + sw, 0); c.stroke();
      }
    }
    c.strokeStyle = art.c2; c.lineWidth = 0.012 * L;
    for (let s = -1; s <= 1; s += 2) { c.beginPath(); c.moveTo(s * 0.5 * L, -0.36 * L); c.lineTo(s * 0.6 * L, -0.05 * L); c.stroke(); }
    const op = 0.1 * Math.sin(t * 2 + ph);
    for (let s = -1; s <= 1; s += 2) {
      c.strokeStyle = U.shade(art.c, -0.05); c.lineWidth = 0.07 * L;
      c.beginPath(); c.moveTo(s * 0.2 * L, -0.35 * L); c.lineTo(s * 0.42 * L, -0.5 * L); c.stroke();
      c.fillStyle = art.c;
      c.beginPath(); c.ellipse(s * 0.52 * L, -0.56 * L, 0.13 * L, 0.07 * L, s * (0.5 + op), 0, TAU); c.fill();
    }
    const g = c.createLinearGradient(0, -0.6 * L, 0, -0.2 * L);
    g.addColorStop(0, U.shade(art.c, 0.1)); g.addColorStop(1, U.shade(art.c, -0.3));
    c.fillStyle = g;
    c.beginPath(); c.ellipse(0, -0.38 * L, 0.42 * L, 0.2 * L, 0, 0, TAU); c.fill();
    c.strokeStyle = U.rgba(art.c2, 0.6); c.lineWidth = 0.02 * L;
    c.beginPath(); c.ellipse(0, -0.38 * L, 0.3 * L, 0.1 * L, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    for (let s = -1; s <= 1; s += 2) {
      c.strokeStyle = U.shade(art.c, -0.2); c.lineWidth = 0.025 * L;
      c.beginPath(); c.moveTo(s * 0.08 * L, -0.55 * L); c.lineTo(s * 0.11 * L, -0.66 * L); c.stroke();
      c.fillStyle = art.eye; c.beginPath(); c.arc(s * 0.11 * L, -0.68 * L, 0.04 * L, 0, TAU); c.fill();
    }
  }

  function drawJelly(c, art, L, t, st) {
    const ph = st.phase || 0;
    const p = Math.sin(t * 2.2 + ph);
    const rx = 0.5 * L * (1 + 0.08 * p), ry = 0.34 * L * (1 - 0.1 * p);
    // tentakels
    c.strokeStyle = U.rgba(art.c2, 0.5); c.lineWidth = L * 0.008;
    for (let i = 0; i < 12; i++) {
      const x0 = U.lerp(-rx * 0.95, rx * 0.95, i / 11);
      c.beginPath(); c.moveTo(x0, 0);
      for (let s = 1; s <= 10; s++) {
        c.lineTo(x0 * (1 - s * 0.04) + Math.sin(t * 2 + i + s * 0.6 + ph) * L * 0.05, s * 0.13 * L);
      }
      c.stroke();
    }
    // mondarmen
    for (let i = 0; i < 4; i++) {
      c.fillStyle = U.rgba(i % 2 ? art.c : '#f0d8c0', 0.55);
      c.beginPath();
      const x0 = (i - 1.5) * 0.07 * L;
      c.moveTo(x0 - 0.03 * L, 0);
      for (let s = 1; s <= 8; s++) c.lineTo(x0 - 0.03 * L + Math.sin(t * 1.6 + i + s * 0.7) * 0.04 * L, s * 0.1 * L);
      for (let s = 8; s >= 1; s--) c.lineTo(x0 + 0.04 * L + Math.sin(t * 1.6 + i + s * 0.7) * 0.04 * L, s * 0.1 * L);
      c.fill();
    }
    // scherm
    c.beginPath();
    c.moveTo(-rx, 0);
    c.bezierCurveTo(-rx, -ry * 1.35, rx, -ry * 1.35, rx, 0);
    for (let i = 16; i >= 0; i--) { const x = U.lerp(-rx, rx, i / 16); c.lineTo(x, i % 2 ? 0.035 * L : 0); }
    c.closePath();
    const g = c.createRadialGradient(0, -ry * 0.7, ry * 0.1, 0, -ry * 0.3, rx);
    g.addColorStop(0, U.rgba('#ffffff', 0.85)); g.addColorStop(1, U.rgba(art.c, 0.6));
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    c.strokeStyle = U.rgba(art.c2, 0.75); c.lineWidth = L * 0.03;
    for (let i = 0; i < 8; i++) {
      const x = U.lerp(-rx * 0.85, rx * 0.85, i / 7);
      c.beginPath(); c.moveTo(x * 0.25 - 0.02 * L, -ry * 0.95); c.lineTo(x, -0.02 * L); c.lineTo(x * 0.25 + 0.02 * L, -ry * 0.95); c.stroke();
    }
    c.fillStyle = U.rgba(art.c2, 0.8); c.beginPath(); c.arc(0, -ry * 0.95, 0.05 * L, 0, TAU); c.fill();
    c.restore();
  }

  function drawSealion(c, art, L, t, st) {
    const ph = st.phase || 0;
    const a = Math.sin(t * 3 + ph);
    // achterflippers
    c.fillStyle = U.shade(art.c, -0.25);
    c.beginPath(); c.moveTo(-0.36 * L, -0.02 * L); c.lineTo(-0.55 * L, -0.08 * L + a * 0.03 * L); c.lineTo(-0.52 * L, 0.0); c.lineTo(-0.56 * L, 0.06 * L - a * 0.03 * L); c.lineTo(-0.36 * L, 0.03 * L); c.fill();
    // verre voorflipper
    c.save(); c.translate(0.16 * L, 0.04 * L); c.rotate(1.9 + a * 0.4);
    c.fillStyle = U.shade(art.c, -0.3); c.beginPath(); c.ellipse(0.15 * L, 0, 0.16 * L, 0.04 * L, 0, 0, TAU); c.fill(); c.restore();
    // lijf
    c.beginPath();
    c.moveTo(0.52 * L, 0.0);
    c.quadraticCurveTo(0.48 * L, -0.06 * L, 0.4 * L, -0.075 * L);
    c.quadraticCurveTo(0.32 * L, -0.07 * L, 0.27 * L, -0.07 * L);
    c.bezierCurveTo(0.1 * L, -0.12 * L, -0.2 * L, -0.08 * L, -0.38 * L, -0.02 * L);
    c.lineTo(-0.38 * L, 0.03 * L);
    c.bezierCurveTo(-0.2 * L, 0.1 * L, 0.1 * L, 0.12 * L, 0.27 * L, 0.06 * L);
    c.quadraticCurveTo(0.4 * L, 0.04 * L, 0.52 * L, 0.0);
    c.closePath();
    const g = c.createLinearGradient(0, -0.1 * L, 0, 0.1 * L);
    g.addColorStop(0, U.shade(art.c, -0.15)); g.addColorStop(1, art.c2);
    c.fillStyle = g; c.fill();
    c.fillStyle = '#121212';
    c.beginPath(); c.arc(0.42 * L, -0.035 * L, 0.014 * L, 0, TAU); c.fill();
    c.beginPath(); c.arc(0.52 * L, -0.005 * L, 0.008 * L, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(240,230,210,0.6)'; c.lineWidth = 0.003 * L;
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0.49 * L, 0.01 * L); c.lineTo(0.56 * L, (-0.01 + i * 0.012) * L); c.stroke(); }
    // nabije voorflipper
    c.save(); c.translate(0.18 * L, 0.05 * L); c.rotate(1.7 - a * 0.5);
    c.fillStyle = U.shade(art.c, -0.12); c.beginPath(); c.ellipse(0.16 * L, 0, 0.17 * L, 0.045 * L, 0, 0, TAU); c.fill(); c.restore();
  }

  function drawFrogfish(c, art, L, t, st) {
    const ph = st.phase || 0;
    c.lineCap = 'round';
    c.strokeStyle = U.shade(art.c, -0.2); c.lineWidth = 0.08 * L;
    c.beginPath(); c.moveTo(0.12 * L, -0.25 * L); c.quadraticCurveTo(0.3 * L, -0.15 * L, 0.32 * L, 0); c.stroke();
    c.beginPath(); c.moveTo(-0.05 * L, -0.2 * L); c.quadraticCurveTo(0.05 * L, -0.08 * L, 0.06 * L, 0); c.stroke();
    c.fillStyle = U.shade(art.c, -0.1);
    c.beginPath(); c.ellipse(-0.46 * L, -0.45 * L, 0.1 * L, 0.16 * L, 0, 0, TAU); c.fill();
    const rng = U.rng(13);
    c.beginPath();
    for (let i = 0; i <= 36; i++) {
      const a = (i / 36) * TAU;
      const r = 0.42 * L * (1 + 0.07 * Math.sin(a * 7 + 1.3) + 0.03 * Math.sin(a * 13));
      const x = Math.cos(a) * r * 1.05, y = -0.45 * L + Math.sin(a) * r * 0.95;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath();
    const g = c.createRadialGradient(-0.05 * L, -0.65 * L, 0.05 * L, 0, -0.45 * L, 0.5 * L);
    g.addColorStop(0, U.shade(art.c, 0.2)); g.addColorStop(1, art.c2);
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    for (let i = 0; i < 40; i++) {
      c.fillStyle = i % 3 ? U.rgba(U.shade(art.c2, -0.3), 0.4) : U.rgba('#ffffff', 0.25);
      c.beginPath(); c.arc((rng() - 0.5) * 0.9 * L, -rng() * 0.9 * L, 0.025 * L * (0.5 + rng()), 0, TAU); c.fill();
    }
    c.restore();
    c.strokeStyle = U.shade(art.c2, -0.45); c.lineWidth = 0.025 * L;
    c.beginPath(); c.moveTo(0.42 * L, -0.62 * L); c.quadraticCurveTo(0.3 * L, -0.48 * L, 0.42 * L, -0.38 * L); c.stroke();
    drawEye(c, 0.2 * L, -0.72 * L, 0.035 * L, art.c);
    const tw = Math.max(0, Math.sin(t * 3 + ph)) > 0.92 ? Math.sin(t * 30) * 0.05 : 0;
    c.strokeStyle = U.shade(art.c, -0.3); c.lineWidth = 0.012 * L;
    c.beginPath(); c.moveTo(0.3 * L, -0.83 * L); c.lineTo((0.44 + tw) * L, -1.0 * L); c.stroke();
    c.fillStyle = '#f0f0e0'; c.beginPath(); c.arc((0.45 + tw) * L, -1.01 * L, 0.03 * L, 0, TAU); c.fill();
  }

  function drawLion(c, L, t, st) {
    const ph = st.phase || 0;
    const fan = 0.15 * Math.sin(t * 0.8 + ph);
    c.lineCap = 'round';
    // borstvinnen
    for (let i = 0; i < 9; i++) {
      const a = 0.9 + i * 0.22 + fan;
      const len = (0.42 - Math.abs(i - 4) * 0.02) * L;
      const x0 = 0.12 * L, y0 = 0.04 * L;
      c.fillStyle = 'rgba(240,220,210,0.25)';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len); c.lineTo(x0 + Math.cos(a + 0.22) * len * 0.95, y0 + Math.sin(a + 0.22) * len * 0.95); c.fill();
      for (let s = 0; s < 5; s++) {
        c.strokeStyle = s % 2 ? '#f4ece4' : '#a8301a';
        c.lineWidth = 0.012 * L;
        c.beginPath();
        c.moveTo(x0 + Math.cos(a) * len * s / 5, y0 + Math.sin(a) * len * s / 5);
        c.lineTo(x0 + Math.cos(a) * len * (s + 1) / 5, y0 + Math.sin(a) * len * (s + 1) / 5);
        c.stroke();
      }
    }
    // rugstekels
    for (let i = 0; i < 12; i++) {
      const x = U.lerp(0.22, -0.2, i / 11) * L;
      const len = (0.38 - i * 0.012) * L;
      const a = -1.9 + i * 0.04 + fan * 0.3;
      for (let s = 0; s < 4; s++) {
        c.strokeStyle = s % 2 ? '#f4ece4' : '#a8301a';
        c.lineWidth = 0.01 * L;
        c.beginPath();
        c.moveTo(x + Math.cos(a) * len * s / 4, -0.08 * L + Math.sin(a) * len * s / 4);
        c.lineTo(x + Math.cos(a) * len * (s + 1) / 4, -0.08 * L + Math.sin(a) * len * (s + 1) / 4);
        c.stroke();
      }
    }
    // staart
    c.fillStyle = 'rgba(240,220,210,0.45)';
    c.beginPath(); c.moveTo(-0.28 * L, 0); c.quadraticCurveTo(-0.5 * L, -0.12 * L, -0.48 * L, 0); c.quadraticCurveTo(-0.5 * L, 0.12 * L, -0.28 * L, 0); c.fill();
    // lijf
    c.save();
    c.beginPath(); c.ellipse(0.0, 0.0, 0.3 * L, 0.1 * L, 0, 0, TAU); c.ellipse(0.24 * L, -0.01 * L, 0.1 * L, 0.085 * L, 0, 0, TAU);
    c.fillStyle = '#f4e6dc'; c.fill(); c.clip();
    c.fillStyle = '#9a2a16';
    for (let i = 0; i < 11; i++) { const x = U.lerp(0.32, -0.3, i / 10) * L; c.fillRect(x - 0.018 * L, -0.2 * L, (i % 2 ? 0.02 : 0.035) * L, 0.4 * L); }
    c.restore();
    c.strokeStyle = '#a8301a'; c.lineWidth = 0.01 * L;
    c.beginPath(); c.moveTo(0.28 * L, -0.08 * L); c.lineTo(0.31 * L, -0.15 * L); c.stroke();
    drawEye(c, 0.27 * L, -0.03 * L, 0.025 * L, '#c84a2a');
  }

  function drawPuffer(c, art, L, t, st) {
    const inf = st.inflate || 0;
    const rx = 0.36 * L * (1 + 0.25 * inf), ry = 0.2 * L * (1 + 0.95 * inf);
    const wag = Math.sin(t * 6 + (st.phase || 0)) * 0.3;
    c.save(); c.translate(-rx * 0.95, 0); c.rotate(wag);
    c.fillStyle = U.shade(art.c, -0.15);
    c.beginPath(); c.moveTo(0, -0.04 * L); c.quadraticCurveTo(-0.16 * L, -0.12 * L, -0.15 * L, 0); c.quadraticCurveTo(-0.16 * L, 0.12 * L, 0, 0.04 * L); c.fill();
    c.restore();
    c.fillStyle = U.shade(art.c, -0.1);
    c.beginPath(); c.ellipse(-rx * 0.65, -ry * 0.9, 0.05 * L, 0.03 * L, -0.4, 0, TAU); c.fill();
    c.save();
    c.beginPath(); c.ellipse(0.02 * L, 0, rx, ry, 0, 0, TAU);
    const g = c.createLinearGradient(0, -ry, 0, ry);
    g.addColorStop(0, U.shade(art.c, -0.1)); g.addColorStop(0.55, art.c); g.addColorStop(0.75, art.c2); g.addColorStop(1, art.c2);
    c.fillStyle = g; c.fill(); c.clip();
    const rng = U.rng(21);
    c.fillStyle = art.spots;
    for (let i = 0; i < 30; i++) { c.beginPath(); c.arc((rng() - 0.5) * 2 * rx, (rng() - 0.6) * 1.6 * ry, 0.012 * L * (1 + inf * 0.6), 0, TAU); c.fill(); }
    c.restore();
    c.fillStyle = '#1a1a1a';
    c.beginPath(); c.ellipse(rx * 0.95, ry * 0.1, 0.025 * L, 0.03 * L, 0, 0, TAU); c.fill();
    drawEye(c, rx * 0.55, -ry * 0.35, 0.04 * L, '#2a2a2a');
    c.fillStyle = U.rgba(art.c, 0.6);
    c.beginPath(); c.ellipse(rx * 0.25, ry * 0.25, 0.06 * L, 0.03 * L, 0.6 + Math.sin(t * 8) * 0.3, 0, TAU); c.fill();
  }

  function drawWobbegong(c, art, L, t, st) {
    const br = 1 + 0.04 * Math.sin(t * 1.2 + (st.phase || 0));
    c.save();
    c.beginPath();
    c.moveTo(0.5 * L, -0.015 * L);
    c.quadraticCurveTo(0.45 * L, -0.07 * L * br, 0.3 * L, -0.08 * L * br);
    c.quadraticCurveTo(0.0, -0.09 * L * br, -0.3 * L, -0.05 * L);
    c.quadraticCurveTo(-0.45 * L, -0.03 * L, -0.52 * L, -0.015 * L);
    c.lineTo(-0.5 * L, 0); c.lineTo(0.5 * L, 0); c.closePath();
    c.fillStyle = art.c; c.fill(); c.clip();
    const rng = U.rng(17);
    for (let i = 0; i < 30; i++) {
      c.fillStyle = i % 2 ? 'rgba(60,45,25,0.6)' : 'rgba(200,180,130,0.45)';
      c.beginPath(); c.ellipse((rng() - 0.5) * L, -rng() * 0.08 * L, 0.04 * L, 0.02 * L, rng() * 3, 0, TAU); c.fill();
    }
    c.strokeStyle = 'rgba(220,200,150,0.5)'; c.lineWidth = 0.005 * L;
    for (let i = 0; i < 12; i++) { c.beginPath(); c.arc((rng() - 0.5) * L, -0.03 * L, 0.03 * L, 0, TAU); c.stroke(); }
    c.restore();
    c.fillStyle = U.shade(art.c, -0.15);
    c.beginPath(); c.moveTo(-0.12 * L, -0.07 * L); c.lineTo(-0.18 * L, -0.12 * L); c.lineTo(-0.22 * L, -0.06 * L); c.fill();
    c.beginPath(); c.moveTo(-0.28 * L, -0.05 * L); c.lineTo(-0.33 * L, -0.09 * L); c.lineTo(-0.36 * L, -0.04 * L); c.fill();
    c.strokeStyle = U.shade(art.c, 0.15); c.lineWidth = 0.006 * L;
    for (let i = 0; i < 16; i++) {
      const x = U.lerp(0.32, 0.52, i / 15) * L;
      const sw = Math.sin(t * 2 + i) * 0.006 * L;
      c.beginPath(); c.moveTo(x, -0.01 * L); c.lineTo(x + 0.01 * L + sw, 0.02 * L); c.lineTo(x + 0.02 * L + sw, 0.01 * L); c.stroke();
    }
    c.fillStyle = '#d8c070'; c.beginPath(); c.arc(0.36 * L, -0.06 * L, 0.008 * L, 0, TAU); c.fill();
  }

  function drawEpaulette(c, art, L, t, st) {
    const walk = st.walk || 0;
    c.fillStyle = U.shade(art.c, -0.15);
    for (let i = 0; i < 2; i++) {
      const x = (i ? -0.1 : 0.18) * L, a = Math.sin(walk * 5 + i * Math.PI) * 0.5;
      c.save(); c.translate(x, -0.03 * L); c.rotate(0.9 + a);
      c.beginPath(); c.ellipse(0.05 * L, 0, 0.06 * L, 0.02 * L, 0, 0, TAU); c.fill(); c.restore();
    }
    c.save();
    c.beginPath();
    c.moveTo(0.5 * L, -0.03 * L);
    c.quadraticCurveTo(0.45 * L, -0.08 * L, 0.3 * L, -0.085 * L);
    c.quadraticCurveTo(0.0, -0.09 * L, -0.25 * L, -0.06 * L);
    c.quadraticCurveTo(-0.45 * L, -0.04 * L, -0.55 * L, -0.03 * L);
    c.lineTo(-0.55 * L, -0.01 * L);
    c.quadraticCurveTo(-0.2 * L, -0.005 * L, 0.3 * L, -0.005 * L);
    c.quadraticCurveTo(0.45 * L, -0.008 * L, 0.5 * L, -0.03 * L);
    c.closePath();
    const g = c.createLinearGradient(0, -0.09 * L, 0, 0);
    g.addColorStop(0, U.shade(art.c, -0.1)); g.addColorStop(1, '#e8dcc0');
    c.fillStyle = g; c.fill(); c.clip();
    const rng = U.rng(23);
    c.fillStyle = 'rgba(60,40,20,0.55)';
    for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((rng() - 0.5) * L, -rng() * 0.08 * L, 0.009 * L, 0, TAU); c.fill(); }
    c.restore();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0.2 * L, -0.055 * L, 0.03 * L, 0, TAU); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(0.2 * L, -0.055 * L, 0.022 * L, 0, TAU); c.fill();
    c.fillStyle = U.shade(art.c, -0.1);
    c.beginPath(); c.moveTo(-0.2 * L, -0.065 * L); c.lineTo(-0.25 * L, -0.1 * L); c.lineTo(-0.28 * L, -0.055 * L); c.fill();
    c.beginPath(); c.moveTo(-0.32 * L, -0.05 * L); c.lineTo(-0.36 * L, -0.085 * L); c.lineTo(-0.39 * L, -0.045 * L); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(0.4 * L, -0.06 * L, 0.006 * L, 0, TAU); c.fill();
  }

  /* ================================================================
   * Publieke tekenfunctie
   * st: { phase, wag, inflate, mode, eels, walk, rock }
   * ctx staat al op positie, met spiegeling/kanteling toegepast.
   * ================================================================ */
  Art.drawCreature = function (c, spc, st, t, pxm) {
    const art = spc.art, L = sizeOf(spc);
    if (Art.isSprite(art)) {
      const sp = Art.sprite(spc, pxm);
      const ga = c.globalAlpha;
      if (sp.alpha < 1) c.globalAlpha = ga * sp.alpha;
      c.save();
      c.translate(sp.tbx, 0);
      c.rotate(st.wag || 0);
      c.drawImage(sp.tail.cv, sp.tail.x, sp.tail.y, sp.tail.w, sp.tail.h);
      c.restore();
      c.drawImage(sp.body.cv, sp.body.x, sp.body.y, sp.body.w, sp.body.h);
      c.globalAlpha = ga;
      return;
    }
    switch (art.t) {
      case 'ray': drawRay(c, art, L, t, st); break;
      case 'turtle': drawTurtle(c, art, L, t, st); break;
      case 'moray': drawMoray(c, art, L, t, st); break;
      case 'gardeneel': drawGardenEels(c, art, L, t, st); break;
      case 'octopus': drawOctopus(c, art, L, t, st); break;
      case 'cuttle': drawCuttle(c, art, L, t, st); break;
      case 'pygmy': drawPygmy(c, art, L, t, st); break;
      case 'nudi': drawNudi(c, art, L, t, st); break;
      case 'lobster': drawLobster(c, art, L, t, st); break;
      case 'crab': drawCrab(c, art, L, t, st); break;
      case 'jelly': drawJelly(c, art, L, t, st); break;
      case 'sealion': drawSealion(c, art, L, t, st); break;
      case 'frogfish': drawFrogfish(c, art, L, t, st); break;
      case 'lion': drawLion(c, L, t, st); break;
      case 'puffer': drawPuffer(c, art, L, t, st); break;
      case 'wobbegong': drawWobbegong(c, art, L, t, st); break;
      case 'epaulette': drawEpaulette(c, art, L, t, st); break;
    }
  };

  // Omhullende (in eenheden van L) voor iconen en camera-uitsneden
  Art.bbox = function (spc) {
    const a = spc.art;
    switch (a.t) {
      case 'fish': {
        const hh = a.h * 0.5;
        const top = a.dorsal === 'banner' ? hh * 2.6 : a.dorsal === 'batfish' ? hh * 2.0 : hh * 1.6;
        return [-0.55, -top, 0.62, hh * (a.dorsal === 'batfish' ? 1.9 : 1.5)];
      }
      case 'shark': return a.v === 'hammer' ? [-0.56, -0.26, 0.54, 0.18] : [-0.56, -0.24, 0.54, 0.24];
      case 'mammal': return [-0.52, -0.2, 0.52, 0.17];
      case 'ray': return [a.v === 'eagle' ? -0.9 : -0.5, -0.36, 0.3, 0.3];
      case 'turtle': return [-0.45, -0.25, 0.58, 0.3];
      case 'moray': return [-0.36, -0.4, 0.36, 0.03];
      case 'gardeneel': return [-0.4, -1.1, 0.5, 0.05];
      case 'octopus': return [-0.45, -0.42, 0.45, 0.03];
      case 'cuttle': return [-0.45, -0.2, 0.62, 0.2];
      case 'pygmy': return [-0.3, -0.55, 0.4, 0.5];
      case 'nudi': return [-0.55, -0.4, 0.6, 0.03];
      case 'lobster': return [-0.6, -0.65, 0.65, 0.03];
      case 'crab': return [-0.7, -0.75, 0.7, 0.03];
      case 'jelly': return [-0.6, -0.5, 0.6, 1.3];
      case 'sealion': return [-0.58, -0.2, 0.58, 0.3];
      case 'frogfish': return [-0.58, -1.05, 0.5, 0.03];
      case 'lion': return [-0.5, -0.5, 0.45, 0.5];
      case 'puffer': return [-0.55, -0.3, 0.45, 0.3];
      case 'wobbegong': return [-0.55, -0.14, 0.56, 0.04];
      case 'epaulette': return [-0.56, -0.13, 0.52, 0.04];
    }
    return [-0.5, -0.5, 0.5, 0.5];
  };

  // Icoon voor het logboek in een canvas; silhouette = onbekend
  Art.drawIcon = function (canvas, spc, silhouette) {
    const c = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    c.clearRect(0, 0, W, H);
    const L = sizeOf(spc);
    const b = Art.bbox(spc);
    const bw = (b[2] - b[0]) * L, bh = (b[3] - b[1]) * L;
    const s = Math.min((W * 0.86) / bw, (H * 0.82) / bh);
    c.save();
    c.translate(W / 2 - ((b[0] + b[2]) / 2) * L * s, H / 2 - ((b[1] + b[3]) / 2) * L * s);
    c.scale(s, s);
    Art.drawCreature(c, spc, { phase: 0.6, wag: 0.1, eels: spc.art.t === 'gardeneel' ? [{ x: -0.25 * L, ext: 0.9, ph: 0 }, { x: 0.05 * L, ext: 1, ph: 1.5 }, { x: 0.35 * L, ext: 0.8, ph: 3 }] : null }, 1.2, s);
    c.restore();
    if (silhouette) {
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = 'rgba(20,40,70,0.85)';
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
    }
  };

  Art.sizeOf = sizeOf;
  Art.drawEye = drawEye;
})(window.DG);
