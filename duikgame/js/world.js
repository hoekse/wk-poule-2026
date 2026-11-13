/* Diepblauw — opbouw van een duikstek: terrein, koralen, pijlers, wrak, rifwand */
(function (DG) {
  'use strict';
  const U = DG.U, TAU = Math.PI * 2;
  const Art = DG.Art;

  const P_BACK = 0.82, P_FAR = 0.55;

  function World(site, seed) {
    this.site = site;
    this.W = site.width;
    this.seed = seed;
    const rng = (this.rng = U.rng(seed));
    this.step = 0.25;
    const n = Math.ceil((this.W + 60) / this.step) + 2;
    this.off = 30; // samples starten bij x = -30
    this.floorS = new Float32Array(n);
    this.backS = new Float32Array(n);
    this.farS = new Float32Array(n);
    const sA = rng() * 100, sB = rng() * 100, sC = rng() * 100;
    for (let i = 0; i < n; i++) {
      const x = i * this.step - this.off;
      let f;
      if (x < 0) {
        f = U.interp(site.floor, 0) + x * (site.scenery.shore === 'dyke' ? 0.35 : 0.18);
        if (site.scenery.shore === 'dyke') f = Math.max(f, -2.6);
      } else {
        f = U.interp(site.floor, x) + U.noise1(x, sA) * site.rough * U.clamp(x / 10, 0.25, 1);
      }
      this.floorS[i] = f;
      this.backS[i] = U.interp(site.back, x / P_BACK) + U.noise1(x * 1.3, sB) * site.rough * 1.4;
      this.farS[i] = U.interp(site.far, x / P_FAR) + U.noise1(x * 0.8, sC) * site.rough * 1.8;
    }
    this.maxFloor = 0;
    for (let i = 0; i < n; i++) this.maxFloor = Math.max(this.maxFloor, this.floorS[i]);
    this.corals = [];
    this.backCorals = [];
    this.specks = [];
    this.pillars = [];
    this.backPillars = [];
    this.wreck = null;
    this.bridge = null;
    this.pier = null;
    this.genStructures();
    if (site.backStyle === 'wall') {
      const wcols = ['rgba(0,0,0,0.16)', 'rgba(255,255,255,0.07)', 'rgba(210,110,150,0.28)', 'rgba(130,95,180,0.26)', 'rgba(230,140,70,0.24)', 'rgba(110,150,95,0.24)', 'rgba(0,0,0,0.22)'];
      this.wallSpots = [];
      for (let i = 0; i < 2200; i++) {
        this.wallSpots.push({ x: U.lerp(-12, this.W * P_BACK + 12, rng()), y: rng() * 46, rx: U.lerp(0.15, 0.85, rng()), ry: U.lerp(0.1, 0.45, rng()), r: rng() * 3, c: wcols[i % wcols.length] });
      }
      this.wallSpots.sort((a, b) => a.x - b.x);
    }
    this.genCorals();
    this.genSpecks();
    this.corals.sort((a, b) => (a.z || 0) - (b.z || 0));
    this.anemones = this.corals.filter((c) => c.type === 'anemone');
    this.fans = this.corals.filter((c) => c.type === 'fan').sort((a, b) => b.h - a.h);
  }

  World.prototype.sample = function (arr, x) {
    const f = (x + this.off) / this.step;
    const i = Math.floor(f);
    if (i < 0) return arr[0];
    if (i >= arr.length - 1) return arr[arr.length - 1];
    const t = f - i;
    return arr[i] * (1 - t) + arr[i + 1] * t;
  };
  World.prototype.floorAt = function (x) {
    let f = this.sample(this.floorS, x);
    if (this.wreck && x > this.wreck.x0 && x < this.wreck.x1) {
      // je kunt over het wrak heen zwemmen, niet erdoorheen
      f = Math.min(f, this.wreckTop(x) - 0.2);
    }
    return f;
  };
  World.prototype.rawFloor = function (x) { return this.sample(this.floorS, x); };
  World.prototype.backAt = function (x) { return this.sample(this.backS, x); };
  World.prototype.farAt = function (x) { return this.sample(this.farS, x); };

  World.prototype.pickType = function (types, rng) {
    let sum = 0;
    for (const k in types) sum += types[k];
    let r = rng() * sum;
    for (const k in types) { r -= types[k]; if (r <= 0) return k; }
    return Object.keys(types)[0];
  };

  World.prototype.genCorals = function () {
    const site = this.site, rng = this.rng;
    site.zones.forEach((z) => {
      let x = z.x[0];
      while (x < z.x[1]) {
        x += (1 / z.dens) * U.lerp(0.4, 1.6, rng());
        if (x >= z.x[1]) break;
        if (this.inStructureGap(x)) continue;
        const type = this.pickType(z.types, rng);
        const y = this.rawFloor(x) + 0.08;
        if (y < 0.4) continue;
        const o = Art.makeCoral(type, x, y, rng, 1);
        if (type === 'rock' && site.id === 'oosterschelde') { o.c1 = '#5a5c5a'; o.c2 = '#2c2e2e'; o.algae = '#6a8a4a'; }
        if (type === 'rock' && site.id === 'tulamben') { o.c1 = '#4a4644'; o.c2 = '#2a2826'; }
        if (type === 'rock' || type === 'boulder') o.z = -1;
        else o.z = rng();
        this.corals.push(o);
        // achtergrondlaag
        if (rng() < 0.75) {
          const bx = x * P_BACK + (rng() - 0.5) * 3;
          const by = this.backAt(bx) + 0.1;
          if (by > 0.5) {
            const bo = Art.makeCoral(this.pickType(z.types, rng), bx, by, rng, 1.1);
            this.backCorals.push(bo);
          }
        }
      }
    });
    // poetsstation (Raja Ampat)
    site.structures.forEach((s) => {
      if (s.type === 'station') {
        const y = this.rawFloor(s.x) + 0.3;
        const b = Art.makeCoral('boulder', s.x, y, rng, 1);
        b.w = 5; b.h = 2.4; b.c1 = '#7a7266'; b.c2 = '#4e4840'; b.z = -1;
        this.corals.push(b);
        for (let i = 0; i < 7; i++) {
          const cx = s.x + (rng() - 0.5) * 3.6;
          const t = Art.makeCoral(['brain', 'soft', 'fan', 'anemone', 'tube'][i % 5], cx, y - 2.0 + Math.abs(cx - s.x) * 0.45, rng, 0.6);
          t.z = 0.5;
          this.corals.push(t);
        }
        this.station = { x: s.x, y: y - 2.4 };
      }
    });
    // rifwand (Elphinstone)
    if (site.wallCorals) {
      const wc = site.wallCorals;
      for (let i = 0; i < wc.n; i++) {
        const bx = U.lerp(-10, this.W * P_BACK + 10, rng());
        const top = this.backAt(bx);
        if (top > 25) continue;
        const by = U.lerp(top + 0.6, Math.min(top + 30, 38), Math.pow(rng(), 1.4));
        const o = Art.makeCoral(this.pickType(wc.types, rng), bx, by, rng, U.lerp(0.7, 1.3, rng()));
        o.onWall = true;
        this.backCorals.push(o);
      }
    }
    // koralen op het wrak
    if (this.wreck) {
      const wr = this.wreck;
      for (let x = wr.x0 + 2; x < wr.x1 - 2; x += U.lerp(0.8, 2.2, rng())) {
        const type = this.pickType({ soft: 3, fan: 2.5, blackcoral: 1.5, tube: 1, anemone: 0.6, table: 0.5, brain: 0.4 }, rng);
        const o = Art.makeCoral(type, x, this.wreckTop(x) + 0.12, rng, 0.85);
        o.z = 0.3;
        this.corals.push(o);
      }
    }
    // pijlers van de brug begroeid met zeeanjelieren
    if (this.bridge) {
      this.bridge.pillars.forEach((p) => {
        for (let y = 1.2; y < this.rawFloor(p.x) - 0.5; y += U.lerp(0.35, 0.8, rng())) {
          [-1, 1].forEach((side) => {
            if (rng() < 0.75) {
              const o = Art.makeCoral(rng() < 0.65 ? 'plumose' : 'deadmans', p.x + side * (p.w / 2 + 0.05), y, rng, 0.8);
              o.rot = side * 1.25;
              o.z = 0.2;
              this.corals.push(o);
            }
          });
        }
      });
    }
  };

  World.prototype.inStructureGap = function (x) {
    return this.pillars.some((p) => Math.abs(p.x - x) < p.w / 2 + 0.3);
  };

  World.prototype.genSpecks = function () {
    const rng = this.rng, pal = this.site.pal;
    for (let x = -30; x < this.W + 30; x += 0.35) {
      this.specks.push({ x: x + rng() * 0.3, dy: rng() * 1.6 + 0.05, r: U.lerp(0.02, 0.07, rng()), c: rng() < 0.5 ? U.shade(pal.sand, 0.15) : U.shade(pal.sand2, -0.15) });
    }
  };

  World.prototype.genStructures = function () {
    const site = this.site, rng = this.rng;
    site.structures.forEach((s) => {
      if (s.type === 'pier') {
        this.pier = s;
        const cols = ['#e8742a', '#8a4fb0', '#e8c23a', '#c8443a', '#e86aa0', '#6aa84a', '#f09a3a', '#6a5a7a', '#4a6a5a', '#9a7a5a', '#b8505a'];
        for (let x = s.x0; x <= s.x1; x += s.every) {
          const mk = (px, back) => {
            const blobs = [];
            const bottom = back ? this.backAt(px) + 0.5 : this.rawFloor(px) + 0.4;
            for (let y = 0.4; y < bottom; y += 0.2) {
              const n = y < 1.2 ? 1 : 2;
              for (let k = 0; k < n; k++) {
                if (rng() < 0.6) blobs.push({ y: y + rng() * 0.1, dx: (rng() - 0.5) * 0.8, r: U.lerp(0.06, 0.18, rng()), c: cols[Math.floor(rng() * cols.length)] });
              }
            }
            return { x: px, w: 0.62, top: s.deckY + 0.6, bottom, blobs, back };
          };
          this.pillars.push(mk(x, false));
          this.backPillars.push(mk(x * P_BACK + 3.2, true));
        }
      } else if (s.type === 'bridge') {
        this.bridge = { pillars: s.pillars.map((x) => ({ x, w: s.w, top: -16, bottom: this.rawFloor(x) + 0.5 })) };
        this.bridge.pillars.forEach((p) => this.pillars.push(Object.assign({ concrete: true, blobs: [] }, p)));
      } else if (s.type === 'wreck') {
        const holes = [];
        for (let x = s.x0 + 5; x < s.x1 - 6; x += U.lerp(8, 14, rng())) holes.push({ x, w: U.lerp(0.9, 1.8, rng()), h: U.lerp(0.6, 1.1, rng()), y: U.lerp(0.3, 0.6, rng()) });
        this.wreck = { x0: s.x0, x1: s.x1, holes, seed: Math.floor(rng() * 1e6) };
      }
    });
  };

  // bovenkant van het wrak (diepte)
  World.prototype.wreckTop = function (x) {
    const wr = this.wreck;
    const t = (x - wr.x0) / (wr.x1 - wr.x0);
    let h = 5.2;
    if (t < 0.06) h *= t / 0.06;
    if (t > 0.9) h *= 1 - (t - 0.9) / 0.1 * 0.55;
    if (t > 0.42 && t < 0.5) h *= 0.35; // ingestort middenstuk
    h += Math.sin(x * 0.7) * 0.12;
    return this.rawFloor(x) - Math.max(0.2, h);
  };

  /* ================================================================
   * Tekenen
   * cam: {x, y, s, w, h}; ctx is in meter-ruimte via setLayer()
   * ================================================================ */
  World.prototype.setLayer = function (ctx, cam, p, dpr) {
    const s = cam.s * dpr;
    ctx.setTransform(s, 0, 0, s, dpr * (cam.w / 2) - cam.x * p * s, dpr * (cam.h / 2) - cam.y * s);
  };
  // zichtbaar x-bereik in een laag
  World.prototype.viewX = function (cam, p) {
    const half = cam.w / 2 / cam.s;
    return [cam.x * p - half - 2, cam.x * p + half + 2];
  };

  World.prototype.drawSilhouette = function (ctx, cam, arr, p, fill) {
    const [x0, x1] = this.viewX(cam, p);
    const bottom = cam.y + cam.h / 2 / cam.s + 5;
    ctx.beginPath();
    ctx.moveTo(x0, bottom);
    for (let x = x0; x <= x1 + 0.5; x += 0.5) ctx.lineTo(x, Math.min(this.sample(arr, x), bottom));
    ctx.lineTo(x1 + 0.5, bottom);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };

  World.prototype.drawFar = function (ctx, cam, dpr) {
    this.setLayer(ctx, cam, P_FAR, dpr);
    if (this.site.id === 'elphinstone') return;
    this.drawSilhouette(ctx, cam, this.farS, P_FAR, this.site.pal.far);
  };

  World.prototype.drawBack = function (ctx, cam, dpr, t, pxm) {
    this.setLayer(ctx, cam, P_BACK, dpr);
    const pal = this.site.pal;
    const [x0, x1] = this.viewX(cam, P_BACK);
    if (this.site.backStyle === 'wall') {
      const bottom = cam.y + cam.h / 2 / cam.s + 5;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, bottom);
      for (let x = x0; x <= x1 + 0.5; x += 0.5) ctx.lineTo(x, Math.min(this.backAt(x), bottom));
      ctx.lineTo(x1 + 0.5, bottom);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, 45);
      g.addColorStop(0, '#9a8c78'); g.addColorStop(0.45, '#6a6670'); g.addColorStop(1, '#2c3652');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.clip();
      for (const sp of this.wallSpots) {
        if (sp.x < x0 - 1) continue;
        if (sp.x > x1 + 1) break;
        ctx.fillStyle = sp.c;
        ctx.beginPath(); ctx.ellipse(sp.x, sp.y, sp.rx, sp.ry, sp.r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    } else {
      this.drawSilhouette(ctx, cam, this.backS, P_BACK, pal.back);
    }
    // pijlers achterste rij
    this.backPillars.forEach((p) => {
      if (p.x < x0 - 1 || p.x > x1 + 1) return;
      this.drawPillar(ctx, p, pxm);
    });
    for (const o of this.backCorals) {
      if (o.x < x0 - 3 || o.x > x1 + 3) continue;
      this.drawCoralObj(ctx, o, t, pxm);
    }
  };

  World.prototype.drawCoralObj = function (ctx, o, t, pxm) {
    const spr = Art.coralSprite(o, pxm);
    ctx.save();
    ctx.translate(o.x, o.y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.sway) {
      const sk = Math.sin(t * 0.9 + o.ph + o.x * 0.15) * o.sway;
      ctx.transform(1, 0, sk, 1, 0, 0);
    }
    ctx.drawImage(spr.cv, spr.x, spr.y, spr.w, spr.h);
    ctx.restore();
  };

  World.prototype.drawPillar = function (ctx, p, pxm) {
    if (!p._spr || p._pxm !== pxm) {
      const pad = 0.5;
      const w = p.w + pad * 2, h = p.bottom - p.top;
      const s = Math.min(pxm, 3000 / h);
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(w * s); cv.height = Math.ceil(h * s);
      const c = cv.getContext('2d');
      c.setTransform(s, 0, 0, s, pad * s + (p.w / 2) * s, -p.top * s);
      if (p.concrete) {
        const g = c.createLinearGradient(-p.w / 2, 0, p.w / 2, 0);
        g.addColorStop(0, '#5a5e5a'); g.addColorStop(0.45, '#8a8e86'); g.addColorStop(1, '#4a4e4a');
        c.fillStyle = g;
        c.fillRect(-p.w / 2, p.top, p.w, h);
        c.fillStyle = 'rgba(40,60,40,0.35)';
        c.fillRect(-p.w / 2, 0, p.w, h);
        c.fillStyle = 'rgba(255,255,255,0.08)';
        for (let y = p.top; y < p.bottom; y += 1.4) c.fillRect(-p.w / 2, y, p.w, 0.05);
      } else {
        const g = c.createLinearGradient(-p.w / 2, 0, p.w / 2, 0);
        g.addColorStop(0, '#3a3634'); g.addColorStop(0.4, '#6a625a'); g.addColorStop(1, '#2a2826');
        c.fillStyle = g;
        c.fillRect(-p.w / 2, p.top, p.w, h);
        p.blobs.forEach((b) => {
          c.fillStyle = b.c;
          c.beginPath(); c.ellipse(b.dx * p.w, b.y, b.r * 1.3, b.r, 0, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.15)';
          c.beginPath(); c.ellipse(b.dx * p.w - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.4, b.r * 0.3, 0, 0, TAU); c.fill();
        });
      }
      p._spr = { cv, x: -p.w / 2 - pad, y: p.top, w, h };
      p._pxm = pxm;
    }
    const sp = p._spr;
    ctx.drawImage(sp.cv, p.x + sp.x, sp.y, sp.w, sp.h);
  };

  World.prototype.drawMain = function (ctx, cam, dpr, t, pxm) {
    this.setLayer(ctx, cam, 1, dpr);
    const pal = this.site.pal;
    const [x0, x1] = this.viewX(cam, 1);
    // pijlers
    this.pillars.forEach((p) => {
      if (p.x < x0 - 3 || p.x > x1 + 3) return;
      this.drawPillar(ctx, p, pxm);
    });
    // rotsen en grote keien achter het terrein
    for (const o of this.corals) {
      if ((o.z || 0) >= 0) break;
      if (o.x < x0 - 4 || o.x > x1 + 4) continue;
      this.drawCoralObj(ctx, o, t, pxm);
    }
    if (this.wreck) this.drawWreck(ctx, x0, x1);
    // bodem
    const bottom = cam.y + cam.h / 2 / cam.s + 5;
    ctx.beginPath();
    ctx.moveTo(x0, bottom);
    for (let x = x0; x <= x1 + 0.5; x += 0.4) ctx.lineTo(x, Math.min(this.rawFloor(x), bottom));
    ctx.lineTo(x1 + 0.5, bottom);
    ctx.closePath();
    const top = Math.min(this.rawFloor(x0), this.rawFloor(x1));
    const g = ctx.createLinearGradient(0, top - 1, 0, top + 6);
    g.addColorStop(0, pal.sand); g.addColorStop(1, pal.sand2);
    ctx.fillStyle = g;
    ctx.fill();
    // bovenrand en zandribbels
    ctx.strokeStyle = U.rgba(U.shade(pal.sand, 0.2), 0.7);
    ctx.lineWidth = 0.07;
    ctx.beginPath();
    for (let x = x0; x <= x1 + 0.5; x += 0.4) {
      const y = this.rawFloor(x) + 0.02;
      if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (const s of this.specks) {
      if (s.x < x0 || s.x > x1) continue;
      ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.ellipse(s.x, this.rawFloor(s.x) + s.dy, s.r * 1.6, s.r * 0.6, 0, 0, TAU); ctx.fill();
    }
    // koralen
    for (const o of this.corals) {
      if ((o.z || 0) < 0) continue;
      if (o.x < x0 - 4 || o.x > x1 + 4) continue;
      this.drawCoralObj(ctx, o, t, pxm);
    }
  };

  World.prototype.drawWreck = function (ctx, x0, x1) {
    const wr = this.wreck;
    if (x1 < wr.x0 - 2 || x0 > wr.x1 + 4) return;
    const a = Math.max(wr.x0, x0 - 1), b = Math.min(wr.x1, x1 + 1);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a, this.rawFloor(a) + 0.6);
    for (let x = a; x <= b; x += 0.3) ctx.lineTo(x, this.wreckTop(x));
    if (b >= wr.x1) {
      // boeg
      ctx.lineTo(wr.x1 + 3, this.wreckTop(wr.x1) + 0.4);
      ctx.lineTo(wr.x1 + 1, this.rawFloor(wr.x1) + 0.4);
    }
    ctx.lineTo(b, this.rawFloor(b) + 0.6);
    for (let x = b; x >= a; x -= 0.5) ctx.lineTo(x, this.rawFloor(x) + 0.6);
    ctx.closePath();
    const yt = this.wreckTop((a + b) / 2);
    const g = ctx.createLinearGradient(0, yt, 0, yt + 6);
    g.addColorStop(0, '#86664c'); g.addColorStop(0.5, '#64493a'); g.addColorStop(1, '#3e2e26');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.clip();
    // spanten
    ctx.strokeStyle = 'rgba(20,12,8,0.45)';
    ctx.lineWidth = 0.14;
    for (let x = Math.ceil(a / 1.3) * 1.3; x < b; x += 1.3) {
      ctx.beginPath(); ctx.moveTo(x, this.wreckTop(x)); ctx.lineTo(x + 0.4, this.rawFloor(x) + 0.6); ctx.stroke();
    }
    // gaten in de romp
    wr.holes.forEach((h) => {
      if (h.x < a - 3 || h.x > b + 3) return;
      const top = this.wreckTop(h.x), fl = this.rawFloor(h.x);
      const y = top + (fl - top) * h.y;
      ctx.fillStyle = 'rgba(8,6,6,0.82)';
      ctx.beginPath(); ctx.ellipse(h.x, y, h.w / 2, h.h / 2, 0.1, 0, TAU); ctx.fill();
    });
    // patrijspoorten
    ctx.fillStyle = 'rgba(10,8,8,0.75)';
    for (let x = Math.ceil(a / 2.2) * 2.2; x < b; x += 2.2) {
      const top = this.wreckTop(x);
      ctx.beginPath(); ctx.arc(x, top + 1.1, 0.16, 0, TAU); ctx.fill();
    }
    // roest en begroeiing
    const rng = U.rng(wr.seed + Math.floor(a));
    const enc = ['rgba(210,110,50,0.3)', 'rgba(130,180,110,0.32)', 'rgba(235,130,170,0.32)', 'rgba(0,0,0,0.14)', 'rgba(150,120,210,0.3)', 'rgba(245,190,90,0.3)', 'rgba(255,255,255,0.08)'];
    for (let i = 0; i < (b - a) * 7; i++) {
      const x = U.lerp(a, b, rng());
      const top = this.wreckTop(x);
      ctx.fillStyle = enc[i % enc.length];
      ctx.beginPath(); ctx.ellipse(x, top + Math.pow(rng(), 1.6) * 5, U.lerp(0.12, 0.5, rng()), U.lerp(0.08, 0.3, rng()), rng() * 3, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // reling
    ctx.strokeStyle = 'rgba(60,40,30,0.85)';
    ctx.lineWidth = 0.06;
    ctx.beginPath();
    for (let x = a; x <= b; x += 0.3) { const y = this.wreckTop(x) - 0.5; if (x === a) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    for (let x = Math.ceil(a / 0.9) * 0.9; x < b; x += 0.9) {
      const y = this.wreckTop(x);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 0.5); ctx.stroke();
    }
    // laadboom
    const mx = wr.x0 + (wr.x1 - wr.x0) * 0.3;
    if (mx > x0 - 8 && mx < x1 + 8) {
      ctx.strokeStyle = '#4a3428'; ctx.lineWidth = 0.35;
      ctx.beginPath(); ctx.moveTo(mx, this.wreckTop(mx)); ctx.lineTo(mx + 5, this.wreckTop(mx) - 2.6); ctx.stroke();
    }
  };

  // Horizon (parallax 0.2), vóór de onderwaterlagen getekend
  World.prototype.drawHorizon = function (ctx, cam, dpr, t) {
    const site = this.site;
    const topY = cam.y - cam.h / 2 / cam.s;
    if (topY > 0.5 || !site.scenery.horizon) return;
    this.setLayer(ctx, cam, 0.2, dpr);
    const [hx0, hx1] = this.viewX(cam, 0.2);
    // verre horizon: kleiner getekend (perspectief)
    const k = 0.32, mid = (hx0 + hx1) / 2;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.translate(mid, 0);
    ctx.scale(k, k);
    Art.drawHorizon(ctx, site.scenery.horizon, (hx0 - mid) / k - 10, (hx1 - mid) / k + 10, t);
    ctx.restore();
  };

  // Boven water: kust, pier-dek, brug, boot
  World.prototype.drawAbove = function (ctx, cam, dpr, t) {
    const site = this.site;
    const topY = cam.y - cam.h / 2 / cam.s;
    if (topY > 3) return;
    this.setLayer(ctx, cam, 1, dpr);
    const [x0, x1] = this.viewX(cam, 1);
    // kust (land boven water) is onderdeel van de bodem; decor erop
    if (site.scenery.shore) this.drawShore(ctx, x0, x1, t);
    if (this.pier) this.drawPierDeck(ctx, x0, x1);
    if (this.bridge) this.drawBridgeDeck(ctx, x0, x1);
    if (site.scenery.boatX != null) Art.drawBoat(ctx, site.scenery.boatX, !!site.scenery.liveaboard, t);
  };

  World.prototype.drawShore = function (ctx, x0, x1, t) {
    const kind = this.site.scenery.shore;
    if (x0 > 12) return;
    if (kind === 'beach') {
      // cactussen en een duikvlag
      [[-6, 2.2], [-11, 3], [-3, 1.6]].forEach(([x, h]) => {
        const y = this.rawFloor(x);
        ctx.fillStyle = '#4a7a3a';
        ctx.fillRect(x - 0.15, y - h, 0.3, h);
        ctx.fillRect(x - 0.55, y - h * 0.7, 0.4, 0.18); ctx.fillRect(x - 0.55, y - h * 0.95, 0.18, 0.4);
        ctx.fillRect(x + 0.15, y - h * 0.55, 0.4, 0.18); ctx.fillRect(x + 0.37, y - h * 0.8, 0.18, 0.4);
      });
      this.drawDiveFlag(ctx, 1.2, t);
    } else if (kind === 'pebbles') {
      for (let x = -12; x < 4; x += 0.5) {
        ctx.fillStyle = (Math.floor(x * 7) % 2) ? '#2a2826' : '#3e3a36';
        ctx.beginPath(); ctx.ellipse(x, this.rawFloor(x) + 0.02, 0.3, 0.12, 0, 0, TAU); ctx.fill();
      }
      [[-8, 6], [-14, 7]].forEach(([x, h]) => {
        const y = this.rawFloor(x);
        ctx.strokeStyle = '#6a5038'; ctx.lineWidth = 0.25;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 0.6, y - h * 0.6, x + 0.3, y - h); ctx.stroke();
        ctx.fillStyle = '#3a7a3a';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + Math.sin(t + i) * 0.05;
          ctx.beginPath(); ctx.ellipse(x + 0.3 + Math.cos(a) * 1.2, y - h + Math.sin(a) * 0.5, 1.3, 0.25, a, 0, TAU); ctx.fill();
        }
      });
      this.drawDiveFlag(ctx, 1.5, t);
    } else if (kind === 'dyke') {
      for (let x = -20; x < 6; x += 0.7) {
        const y = this.rawFloor(x);
        ctx.fillStyle = (Math.floor(x * 3) % 2) ? '#3a3c3a' : '#4a4c48';
        ctx.beginPath(); ctx.moveTo(x - 0.35, y + 0.4); ctx.lineTo(x - 0.3, y - 0.05); ctx.lineTo(x + 0.3, y - 0.08); ctx.lineTo(x + 0.35, y + 0.4); ctx.fill();
      }
      ctx.fillStyle = '#6a9a4a';
      ctx.fillRect(-40, -2.75, 37.5, 0.3);
      // de Tuimelaar-bus op de dijk
      ctx.save();
      ctx.translate(-8, -2.75);
      ctx.scale(5.2, 5.2);
      Art.drawBus(ctx, {});
      ctx.restore();
      this.drawDiveFlag(ctx, -2.2, t, -2.75);
    }
  };

  World.prototype.drawDiveFlag = function (ctx, x, t, yBase) {
    const y = yBase != null ? yBase : this.rawFloor(x);
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.06;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 3.2); ctx.stroke();
    const wv = Math.sin(t * 3) * 0.08;
    ctx.fillStyle = '#d8202a';
    ctx.beginPath(); ctx.moveTo(x, y - 3.2); ctx.lineTo(x + 1.3, y - 3.15 + wv); ctx.lineTo(x + 1.3, y - 2.35 + wv); ctx.lineTo(x, y - 2.4); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.16;
    ctx.beginPath(); ctx.moveTo(x, y - 3.2); ctx.lineTo(x + 1.3, y - 2.35 + wv); ctx.stroke();
  };

  World.prototype.drawPierDeck = function (ctx, x0, x1) {
    const p = this.pier;
    if (x1 < p.x0 - 3 || x0 > p.x1 + 3) return;
    const a = Math.max(p.x0 - 2, x0), b = Math.min(p.x1 + 2, x1);
    ctx.fillStyle = '#4a4440';
    ctx.fillRect(a, p.deckY - 0.5, b - a, 0.6);
    ctx.fillStyle = '#6a625a';
    ctx.fillRect(a, p.deckY - 0.7, b - a, 0.2);
    // transportband van de zoutpier
    ctx.fillStyle = '#8a8478';
    ctx.fillRect(a, p.deckY - 2.6, b - a, 0.5);
    ctx.strokeStyle = '#5a544c'; ctx.lineWidth = 0.12;
    for (let x = Math.ceil(a / 3) * 3; x < b; x += 3) {
      ctx.beginPath(); ctx.moveTo(x, p.deckY - 0.7); ctx.lineTo(x + 1.5, p.deckY - 2.1); ctx.lineTo(x + 3, p.deckY - 0.7); ctx.stroke();
    }
  };

  World.prototype.drawBridgeDeck = function (ctx, x0, x1) {
    ctx.fillStyle = '#9a9c98';
    ctx.fillRect(x0 - 1, -17.5, x1 - x0 + 2, 1.6);
    ctx.fillStyle = '#7a7c78';
    ctx.fillRect(x0 - 1, -16, x1 - x0 + 2, 0.4);
    ctx.fillStyle = '#c8c8c0';
    for (let x = Math.ceil(x0 / 2) * 2; x < x1; x += 2) ctx.fillRect(x, -18.4, 0.12, 0.9);
    ctx.fillRect(x0 - 1, -18.5, x1 - x0 + 2, 0.12);
  };

  // Lichtstralen vanaf het oppervlak (additief)
  World.prototype.drawRays = function (ctx, cam, dpr, t, strength) {
    if (strength <= 0.01) return;
    this.setLayer(ctx, cam, 0.9, dpr);
    const [x0, x1] = this.viewX(cam, 0.9);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = Math.floor(x0 / 6) - 2; i < x1 / 6 + 2; i++) {
      const base = i * 6 + Math.sin(i * 12.9898) * 2.5 + Math.sin(t * 0.13 + i) * 1.2;
      const w = 0.8 + Math.abs(Math.sin(i * 3.1)) * 2.2;
      const a = (0.06 + 0.05 * Math.sin(t * 0.7 + i * 2.3)) * strength;
      if (a <= 0) continue;
      const len = 26;
      const g = ctx.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, 'rgba(255,255,240,' + a + ')');
      g.addColorStop(1, 'rgba(255,255,240,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(base, 0); ctx.lineTo(base + w, 0);
      ctx.lineTo(base + w * 2.2 + len * 0.25, len); ctx.lineTo(base + len * 0.25 - w * 0.6, len);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  World.P_BACK = P_BACK;
  World.P_FAR = P_FAR;
  DG.World = World;
})(window.DG);
