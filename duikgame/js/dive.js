/* Diepblauw — de duik zelf: besturing, duikcomputer, licht en kleur, spotten en fotograferen */
(function (DG) {
  'use strict';
  const U = DG.U, Art = DG.Art, TAU = Math.PI * 2;
  const D = (DG.Dive = {});
  const TS = DG.TIME_SCALE;

  // Nultijden (minuten) voor lucht, benadering van de gangbare tabellen
  const NDL = [[0, 999], [10, 219], [12, 147], [14, 98], [16, 72], [18, 56], [20, 45], [22, 37], [25, 29], [30, 20], [35, 14], [40, 9], [45, 6]];
  function ndlAt(d) {
    if (d <= 9) return 999;
    for (let i = 1; i < NDL.length; i++) {
      if (d <= NDL[i][0]) {
        const a = NDL[i - 1], b = NDL[i];
        return a[1] + (b[1] - a[1]) * ((d - a[0]) / (b[0] - a[0]));
      }
    }
    return 5;
  }

  const cam = { x: 0, y: 5, s: 60, w: 800, h: 600 };
  D.cam = cam;
  const keys = {};
  const stick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
  let last = 0;

  D.init = function (canvas) {
    D.cv = canvas;
    D.ctx = canvas.getContext('2d');
    D.wcv = document.createElement('canvas'); D.wctx = D.wcv.getContext('2d');
    D.lcv = document.createElement('canvas'); D.lctx = D.lcv.getContext('2d');
    D.bcv = document.createElement('canvas'); D.bctx = D.bcv.getContext('2d');
    D.resize();
    window.addEventListener('resize', D.resize);
    window.addEventListener('keydown', onKey(true));
    window.addEventListener('keyup', onKey(false));
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('pointerup', onPointer);
    window.addEventListener('pointercancel', onPointer);
    D.particles = [];
    for (let i = 0; i < 150; i++) D.particles.push({ x: Math.random() * 60, y: Math.random() * 40, k: U.rand(0.6, 1.5), r: U.rand(0.6, 2.2), a: U.rand(0.15, 0.5) });
    requestAnimationFrame(frame);
  };

  D.resize = function () {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = window.innerWidth, h = window.innerHeight;
    D.dpr = dpr;
    [D.cv, D.wcv, D.lcv, D.bcv].forEach((c) => { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); });
    D.cv.style.width = w + 'px'; D.cv.style.height = h + 'px';
    cam.w = w; cam.h = h;
    cam.s = Math.min(h / 12, w / 8);
    Art.clearSprites();
  };

  function onKey(down) {
    return function (e) {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (down && D.mode === 'dive' && !D.paused && document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      keys[k] = down;
      if (!down || D.mode !== 'dive') return;
      if (k === 'Escape' || k === 'p') { DG.UI.togglePause(); e.preventDefault(); }
      if (D.paused || !D.live) return;
      if (k === ' ') { D.takePhoto(); e.preventDefault(); }
      if (k === 'l') D.toggleLamp();
      if (k === 'e' && D.canEnd) D.finish(false);
      if (k.indexOf('Arrow') === 0) e.preventDefault();
    };
  }

  function onPointer(e) {
    if (D.mode !== 'dive' || !D.live || D.paused) { stick.active = false; return; }
    if (e.type === 'pointerdown') {
      if (stick.active) return;
      stick.active = true; stick.id = e.pointerId;
      stick.ox = e.clientX; stick.oy = e.clientY; stick.x = 0; stick.y = 0;
      DG.UI.stick(true, stick.ox, stick.oy, 0, 0);
    } else if (e.pointerId === stick.id && stick.active) {
      if (e.type === 'pointermove') {
        const dx = e.clientX - stick.ox, dy = e.clientY - stick.oy;
        const r = 55, d = Math.hypot(dx, dy);
        const f = d > r ? r / d : 1;
        stick.x = (dx * f) / r; stick.y = (dy * f) / r;
        DG.UI.stick(true, stick.ox, stick.oy, dx * f, dy * f);
      } else {
        stick.active = false; stick.x = stick.y = 0;
        DG.UI.stick(false);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  D.start = function (siteId, mode) {
    const site = DG.siteById(siteId);
    D.site = site;
    D.mode = mode;
    D.world = new DG.World(site, U.hash(site.id));
    const sp = DG.spawnCreatures(D.world);
    D.creatures = sp.list;
    D.groups = sp.groups;
    D.lo = mode === 'dive' ? DG.Save.loadout() : null;
    D.t = 0; D.gt = 0;
    D.live = false;
    D.paused = false;
    D.bubbles = []; D.ink = [];
    D.flash = 0;
    D.lampOn = false;
    D.canEnd = false;
    D.xmin = 1.5;
    for (let x = 0; x < 40; x += 0.25) { if (D.world.rawFloor(x) > 0.8) { D.xmin = x; break; } }
    const sx = Math.max(site.start.x, D.xmin + 0.5);
    D.diver = { x: sx, y: 0.35, vx: 0, vy: 0, face: 1, faceT: 1, tilt: 0, kick: 0 };
    D.buddy = { x: sx - 2.2, y: 0.4, vx: 0, vy: 0, face: 1, faceT: 1, tilt: 0, kick: 1 };
    D.buddyLook = { suitC: '#1d2a3a', accent: '#e8603a', suit: 'full', fin: '#e8603a', bcd: 'jacket', bcdC: '#24242a', bcdAccent: '#e8603a', tank: '#d8dce0', tankLen: 0.7, mask: '#202020', reg: '#202020', comp: '#222' };
    cam.x = sx + 2; cam.y = mode === 'attract' ? 9 : 3;
    if (mode === 'dive') {
      const lo = D.lo;
      D.dv = {
        air: lo.tankL * 200, maxD: 0, sumD: 0, n2: 0, cold: 0, ascRate: 0, prevD: 0.35,
        fastT: 0, ascentWarnings: 0, inFast: false, safety: 0, safetyDone: false, needStop: false, skippedStop: false,
        deco: false, decoViolation: false, spotted: {}, newSpecies: [], photos: [], hinted: new Set(),
        profile: [[0, 0]], profT: 0, warned: {}, ooa: false, freeflow: 0, freeflowDone: false, limitHit: false,
        hot: false, breath: 0, exhaling: false, lastBeep: 0,
      };
    }
  };

  D.begin = function () {
    D.live = true;
    if (DG.Audio) { DG.Audio.splash(); DG.Audio.ambience(true); }
  };

  D.stop = function () {
    D.mode = null;
    D.live = false;
    if (DG.Audio) DG.Audio.ambience(false);
  };

  D.toggleLamp = function () {
    if (!D.lo || !D.lo.lamp) { DG.UI.toast('Je hebt nog geen duiklamp. Die vind je bij De Tuimelaar.', 'info'); return; }
    D.lampOn = !D.lampOn;
    if (DG.Audio) DG.Audio.click();
    DG.UI.hudLamp(D.lampOn);
  };

  /* ------------------------------------------------------------------ */
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
    last = ts;
    if (!D.mode) return;
    if (!D.paused) update(dt);
    render();
  }

  function update(dt) {
    D.t += dt;
    const w = D.world, site = D.site;
    if (D.mode === 'attract') {
      const viewW = cam.w / cam.s;
      cam.x = U.clamp(w.W * 0.45 + Math.sin(D.t * 0.035) * w.W * 0.32, viewW / 2, w.W - viewW / 2);
      cam.y = 9.5 + Math.sin(D.t * 0.05) * 3;
      DG.updateCreatures(D.creatures, D.groups, { world: w, diver: null, t: D.t, current: site.current, focusX: cam.x }, dt);
      updateFx(dt);
      return;
    }
    const dv = D.dv, lo = D.lo, d = D.diver;
    // invoer
    let ix = 0, iy = 0;
    if (D.live && !dv.ooa) {
      if (keys.ArrowLeft || keys.a || keys.q) ix -= 1;
      if (keys.ArrowRight || keys.d) ix += 1;
      if (keys.ArrowUp || keys.w || keys.z) iy -= 1;
      if (keys.ArrowDown || keys.s) iy += 1;
      if (stick.active) { ix += stick.x; iy += stick.y; }
      const m = Math.hypot(ix, iy); if (m > 1) { ix /= m; iy /= m; }
    }
    const turbo = !!(keys.Shift || DG.UI.turboHeld);
    const coldSlow = dv.cold > 70 ? 0.85 : 1;
    const base = 1.35 * lo.speed * (turbo ? 1.65 : 1) * coldSlow;
    if (dv.ooa) { ix = 0; iy = -0.75; }
    d.vx = U.approach(d.vx, ix * base, 2.2, dt);
    d.vy = U.approach(d.vy, iy * base * 0.68, 2.2, dt);
    // stroming (minder vlak bij de bodem)
    const fl = w.floorAt(d.x);
    const shelter = U.clamp((fl - d.y) / 4, 0.25, 1);
    const drift = site.current * shelter * (d.y > 0.8 ? 1 : 0.3);
    d.x += (d.vx + drift) * dt;
    d.y += d.vy * dt;
    // grenzen
    if (d.y > fl - 0.55) { d.y = fl - 0.55; d.vy = Math.min(0, d.vy); }
    const headFl = w.floorAt(d.x + d.face * 0.6);
    if (d.y > headFl - 0.45) d.y = U.approach(d.y, headFl - 0.45, 8, dt);
    if (d.y < 0.35) { d.y = 0.35; d.vy = Math.max(0, d.vy); }
    let limit = lo.maxDepth;
    if (lo.gas === 'ean32') limit = Math.min(limit, 34);
    if (d.y > limit) {
      d.y = limit; d.vy = Math.min(0, d.vy);
      if (!dv.limitHit) {
        dv.limitHit = true;
        if (lo.gas === 'ean32' && limit === 34) DG.UI.toast('Maximale diepte voor nitrox 32% (ppO₂ 1,4) bereikt.', 'warn');
        else DG.UI.toast('Je buddy geeft het teken: niet dieper! Met je brevet (' + DG.Save.brevet() + ') mag je tot ' + lo.maxDepth + ' m. Bij De Tuimelaar kun je een cursus volgen om dieper te gaan.', 'warn', 7000);
      }
    }
    d.x = U.clamp(d.x, D.xmin, w.W - 1.5);
    // oriëntatie en beensslag
    if (Math.abs(ix) > 0.1) d.faceT = ix < 0 ? -1 : 1;
    d.face += U.clamp(d.faceT - d.face, -dt * 7, dt * 7);
    if (Math.abs(d.face) < 0.2) d.face = d.faceT * 0.2;
    d.tilt = U.approach(d.tilt, U.clamp(d.vy / (Math.abs(d.vx) + 0.6), -0.5, 0.5) * 0.7, 4, dt);
    const spd = Math.hypot(d.vx, d.vy);
    d.kick += dt * (1.2 + spd * 3.2);

    if (!D.live) { updateCam(dt); DG.updateCreatures(D.creatures, D.groups, { world: w, diver: null, t: D.t, current: site.current, focusX: d.x }, dt); updateFx(dt); return; }

    // tijd en diepte
    const gdt = dt * TS;
    D.gt += gdt;
    const depth = Math.max(0, d.y - 0.35);
    D.depth = depth;
    dv.maxD = Math.max(dv.maxD, depth);
    dv.sumD += depth * gdt;
    // opstijgsnelheid (m/min duiktijd)
    const rate = ((dv.prevD - depth) / gdt) * 60;
    dv.prevD = depth;
    dv.ascRate = U.approach(dv.ascRate, rate, 3, dt);
    if (dv.ascRate > 10.5 && depth > 1) {
      dv.fastT += dt;
      if (D.t - dv.lastBeep > 0.5) { dv.lastBeep = D.t; if (DG.Audio) DG.Audio.beep(); }
      if (dv.fastT > 1.2 && !dv.inFast) { dv.inFast = true; dv.ascentWarnings++; DG.UI.toast('Te snel omhoog! Stijg rustig op: maximaal 10 meter per minuut.', 'warn'); }
    } else { dv.fastT = 0; dv.inFast = false; }
    // lucht
    const amb = 1 + depth / 10;
    let sac = 16 * lo.sac * (turbo && spd > 0.3 ? 1.8 : 1);
    if (dv.cold > 50) sac *= 1 + ((dv.cold - 50) / 50) * 0.5;
    if (dv.hot) sac *= 1.08;
    dv.air -= (sac * amb * gdt) / 60;
    if (dv.freeflow > 0) { dv.freeflow -= dt; dv.air -= lo.tankL * 9 * dt; spawnBubbles(d, 6, true); }
    const bar = Math.max(0, dv.air / lo.tankL);
    D.bar = bar;
    if (bar < 100 && !dv.warned.b100) { dv.warned.b100 = 1; DG.UI.toast('Halverwege je lucht (100 bar). Denk aan de weg terug.', 'info'); }
    if (bar < 70 && !dv.warned.b70) { dv.warned.b70 = 1; DG.UI.toast('70 bar: tijd om rustig op te stijgen.', 'warn'); }
    if (bar < 50 && !dv.warned.b50) { dv.warned.b50 = 1; if (DG.Audio) DG.Audio.alarm(); DG.UI.toast('Reserve (50 bar)! Stijg nu op naar de oppervlakte.', 'danger'); }
    if (dv.air <= 0 && !dv.ooa) {
      dv.ooa = true; dv.air = 0;
      if (DG.Audio) DG.Audio.alarm();
      DG.UI.toast('Lucht op! Je buddy deelt zijn octopus en jullie stijgen samen op.', 'danger', 7000);
    }
    // stikstof (nultijd)
    const ead = lo.gas === 'ean32' ? Math.max(0, (depth + 10) * (0.68 / 0.79) - 10) : depth;
    const gmin = gdt / 60;
    if (ead > 9) dv.n2 += gmin / ndlAt(ead);
    else dv.n2 = Math.max(0, dv.n2 - gmin / (depth < 6.5 && dv.n2 > 1 ? 12 : 40));
    dv.deco = dv.n2 >= 1;
    if (dv.deco && !dv.warned.deco) { dv.warned.deco = 1; if (DG.Audio) DG.Audio.alarm(); DG.UI.toast('Nultijd voorbij! Je hebt een verplichte decompressiestop op 3-6 m.', 'danger', 6000); }
    if (!dv.deco && dv.warned.deco && dv.n2 < 0.95) dv.warned.deco = 0;
    // veiligheidsstop
    if (dv.maxD >= 10) dv.needStop = true;
    if (dv.needStop && !dv.safetyDone && depth >= 2.5 && depth <= 6.5 && D.gt > 120) {
      dv.safety += gdt;
      if (dv.safety >= 180) { dv.safetyDone = true; if (DG.Audio) DG.Audio.spot(); DG.UI.toast('Veiligheidsstop voltooid. Netjes!', 'good'); }
    }
    // temperatuur
    const temp = site.temp - depth / 15;
    D.temp = temp;
    const chill = lo.warmth - temp;
    if (chill > 0) dv.cold = Math.min(100, dv.cold + chill * 0.55 * gmin);
    else dv.cold = Math.max(0, dv.cold - gmin * 2);
    if (dv.cold > 60 && !dv.warned.c60) { dv.warned.c60 = 1; DG.UI.toast('Brrr, je begint het koud te krijgen. Je verbruikt meer lucht.', 'warn'); }
    if (dv.cold >= 100 && !dv.warned.c100) { dv.warned.c100 = 1; DG.UI.toast('Je rilt van de kou. Tijd om de duik af te ronden! (Een dikker pak helpt.)', 'danger'); }
    if (chill < -15 && !dv.hot) { dv.hot = true; DG.UI.toast('Pfff, wat is het warm in dat droogpak!', 'info'); }
    // freeflow in koud water zonder koudwater-automaat
    if (!lo.coldReg && temp < 15 && depth > 8 && !dv.freeflowDone && D.gt > 240 && Math.random() < dt * 0.04) {
      dv.freeflowDone = true; dv.freeflow = 3;
      DG.UI.toast('Freeflow! Je ademautomaat bevriest in het koude water. Een koudwater-automaat voorkomt dit.', 'danger', 6000);
    }
    // ademhaling en bellen
    const bRate = turbo ? 1 / 2.4 : dv.cold > 60 ? 1 / 3.0 : 1 / 3.8;
    dv.breath += dt * bRate;
    if (dv.breath >= 1) { dv.breath -= 1; dv.exhaling = false; if (DG.Audio && depth > 0.6) DG.Audio.breathIn(0.9); }
    if (!dv.exhaling && dv.breath > 0.5) { dv.exhaling = true; if (depth > 0.6) { spawnBubbles(d, 14, false); if (DG.Audio) DG.Audio.breathOut(0.9); } }
    // profiel
    dv.profT += dt;
    if (dv.profT > 1.5) { dv.profT = 0; dv.profile.push([D.gt / 60, depth]); }
    // eind
    D.canEnd = depth < 0.4 && D.gt > 60;
    if (dv.ooa && depth < 0.4) { D.finish(true); return; }
    if (depth < 0.4 && dv.needStop && !dv.safetyDone && D.gt > 120) dv.skippedStop = true;
    if (depth < 0.4 && dv.deco) dv.decoViolation = true;

    // dieren
    const env = { world: w, diver: { x: d.x + d.face * 0.5, y: d.y }, t: D.t, current: site.current, focusX: d.x, onInk: spawnInk };
    DG.updateCreatures(D.creatures, D.groups, env, dt);
    updateBuddy(dt);
    D.spotT = (D.spotT || 0) - dt;
    if (D.spotT <= 0) { D.spotT = 0.2; checkSpots(); }
    D.photoCd = Math.max(0, (D.photoCd || 0) - dt);
    updateCam(dt);
    updateFx(dt);
    D.hudT = (D.hudT || 0) - dt;
    if (D.hudT <= 0) { D.hudT = 0.1; DG.UI.hud(D); }
  }

  function updateCam(dt) {
    const d = D.diver;
    const viewH = cam.h / cam.s, viewW = cam.w / cam.s;
    cam.x = U.approach(cam.x, d.x + d.faceT * Math.min(2.2, viewW * 0.12), 2.2, dt);
    cam.y = U.approach(cam.y, d.y + 0.6, 2.6, dt);
    cam.x = U.clamp(cam.x, viewW / 2 - 14, D.world.W + 8 - viewW / 2);
    cam.y = U.clamp(cam.y, viewH / 2 - 4.5, Math.max(viewH / 2 - 4.5, D.world.maxFloor + 2.5 - viewH / 2));
  }

  function updateBuddy(dt) {
    const b = D.buddy, d = D.diver;
    const tx = d.x - d.faceT * 2.3, ty = Math.max(0.4, d.y - 0.7);
    const dx = tx - b.x, dy = ty - b.y;
    b.vx = U.approach(b.vx, U.clamp(dx * 0.9, -2, 2), 2, dt);
    b.vy = U.approach(b.vy, U.clamp(dy * 0.9, -1.4, 1.4), 2, dt);
    b.x += b.vx * dt; b.y += b.vy * dt;
    const fl = D.world.floorAt(b.x);
    if (b.y > fl - 0.6) b.y = fl - 0.6;
    if (b.y < 0.4) b.y = 0.4;
    if (Math.abs(b.vx) > 0.15) b.faceT = b.vx < 0 ? -1 : 1;
    else b.faceT = d.faceT;
    b.face += U.clamp(b.faceT - b.face, -dt * 6, dt * 6);
    if (Math.abs(b.face) < 0.2) b.face = b.faceT * 0.2;
    b.tilt = U.approach(b.tilt, U.clamp(b.vy / (Math.abs(b.vx) + 0.6), -0.5, 0.5) * 0.6, 3, dt);
    b.kick += dt * (1.1 + Math.hypot(b.vx, b.vy) * 3);
    b.breath = (b.breath || Math.random()) + dt / 4.2;
    if (b.breath > 1) { b.breath -= 1; if (b.y > 0.9) spawnBubbles(b, 10, false); }
  }

  function spawnBubbles(who, n, big) {
    const hx = who.x + who.face * 0.72, hy = who.y + 0.02;
    for (let i = 0; i < n; i++) {
      if (D.bubbles.length > 400) break;
      D.bubbles.push({ x: hx + U.rand(-0.05, 0.05), y: hy + U.rand(-0.05, 0.05), r0: U.rand(0.012, big ? 0.06 : 0.04), d0: Math.max(0.5, hy), wob: Math.random() * TAU, delay: i * 0.035 });
    }
  }
  function spawnInk(x, y) {
    for (let i = 0; i < 14; i++) D.ink.push({ x: x + U.rand(-0.2, 0.2), y: y + U.rand(-0.2, 0.2), r: U.rand(0.1, 0.25), a: 0.75, vx: U.rand(-0.2, 0.2), vy: U.rand(-0.1, 0.1) });
  }

  function updateFx(dt) {
    for (let i = D.bubbles.length - 1; i >= 0; i--) {
      const b = D.bubbles[i];
      if (b.delay > 0) { b.delay -= dt; continue; }
      const r = b.r0 * Math.cbrt((b.d0 + 10) / (Math.max(0, b.y) + 10));
      b.r = r;
      b.y -= (0.55 + r * 9) * dt;
      b.wob += dt * 7;
      b.x += Math.sin(b.wob) * 0.12 * dt + (D.site.current || 0) * 0.4 * dt;
      if (b.y < 0.05) D.bubbles.splice(i, 1);
    }
    for (let i = D.ink.length - 1; i >= 0; i--) {
      const k = D.ink[i];
      k.x += k.vx * dt; k.y += k.vy * dt; k.r += dt * 0.25; k.a -= dt * 0.18;
      if (k.a <= 0) D.ink.splice(i, 1);
    }
    D.flash = Math.max(0, D.flash - dt * 3.5);
    if (D.mode === 'dive' && D.live && DG.Audio) {
      D.whistleT = (D.whistleT || 3) - dt;
      if (D.whistleT <= 0) {
        D.whistleT = U.rand(0.6, 2.5);
        const near = D.creatures.some((c) => c.spc.art.t === 'mammal' && c.spc.art.v === 'dolphin' && Math.abs(c.x - D.diver.x) < 25);
        if (near) DG.Audio.whistle();
      }
    }
  }

  function onScreen(x, y, m) {
    const hw = cam.w / 2 / cam.s, hh = cam.h / 2 / cam.s;
    return x > cam.x - hw - m && x < cam.x + hw + m && y > cam.y - hh - m && y < cam.y + hh + m;
  }
  function inBeam(c) {
    if (!D.lampOn || !D.lo.lamp) return false;
    const d = D.diver;
    const hx = d.x + d.face * 0.95, hy = d.y + 0.1;
    const dx = c.x - hx, dy = c.y - hy;
    const dist = Math.hypot(dx, dy);
    if (dist > D.lo.lamp.bereik * 0.9) return false;
    const ang = Math.atan2(dy, dx * Math.sign(d.faceT));
    return Math.abs(ang - d.tilt) < D.lo.lamp.hoek + 0.08;
  }

  function checkSpots() {
    const d = D.diver, dv = D.dv, sv = DG.Save.data;
    const hx = d.x + d.face * 0.6, hy = d.y;
    for (const c of D.creatures) {
      const spc = c.spc;
      if (!spc.log) continue;
      if (!onScreen(c.x, c.y, 0)) continue;
      let cx = c.x, cy = c.y;
      if (c.b === 'gardeneel') cy -= 0.3;
      const dist = Math.hypot(cx - hx, cy - hy) - c.L * 0.3;
      let range = U.clamp(1.8 + c.L * 2.2, 2.6, 10);
      range = Math.min(range, D.site.vis * 0.9 + 0.6);
      let ok;
      if (c.hidden) ok = dist < 1.6 || (inBeam(c) && dist < D.lo.lamp.bereik * 0.85);
      else ok = dist < range;
      if (ok && !dv.spotted[spc.id]) {
        dv.spotted[spc.id] = true;
        const isNew = !sv.species[spc.id];
        if (isNew) {
          sv.species[spc.id] = { seen: true, photo: false, site: D.site.id, date: Date.now() };
          dv.newSpecies.push(spc.id);
          if (DG.Audio) DG.Audio.newSpecies();
          DG.UI.spotToast(spc, true);
        } else {
          if (DG.Audio) DG.Audio.spot();
          DG.UI.spotToast(spc, false);
        }
      } else if (!ok && c.hidden && !dv.spotted[spc.id] && !dv.hinted.has(c) && dist < 3.6) {
        dv.hinted.add(c);
        DG.UI.hint(D.lo.lamp ? 'Je buddy wijst naar iets verstopts… zwem dichterbij of schijn er met je lamp (L) op.' : 'Je buddy wijst naar iets verstopts… zwem er heel dichtbij om te kijken wat het is.');
      }
    }
  }

  /* ------------------------------------------------------------------ */
  D.takePhoto = function () {
    const lo = D.lo;
    if (!lo.camera) { DG.UI.toast('Je hebt nog geen camera. Bij De Tuimelaar hebben ze onderwatercamera’s.', 'info'); return; }
    if (D.photoCd > 0) return;
    D.photoCd = 0.9;
    const d = D.diver;
    const hx = d.x + d.face * 1.0, hy = d.y + 0.1;
    let best = null, bestScore = 0;
    for (const c of D.creatures) {
      if (!c.spc.log || !onScreen(c.x, c.y, 0)) continue;
      const dx = c.x - hx, dy = c.y - hy;
      if (dx * d.faceT < -0.3) continue;
      const dist = Math.hypot(dx, dy) - c.L * 0.3;
      if (dist > lo.camera.bereik + Math.min(c.L, 3) * 0.6) continue;
      if (c.hidden && dist > 1.9 && !inBeam(c)) continue;
      const ang = Math.atan2(Math.abs(dy), Math.abs(dx) + 0.01);
      if (ang > 1.0) continue;
      const score = (1 - dist / (lo.camera.bereik + 2)) * 0.6 + (1 - ang / 1.0) * 0.4 + (c.L > 1 ? 0.1 : 0);
      if (score > bestScore) { bestScore = score; best = c; }
    }
    // uitsnede
    let cx, cy, wm;
    if (best) {
      const bb = Art.bbox(best.spc);
      cx = best.x + ((bb[0] + bb[2]) / 2) * best.L * best.face;
      cy = best.y + ((bb[1] + bb[3]) / 2) * best.L;
      wm = U.clamp((bb[2] - bb[0]) * best.L * 1.5, 0.9, 12);
    } else { cx = hx + d.faceT * 2.2; cy = hy; wm = 4.5; }
    const hm = wm * 0.75;
    const dpr = D.dpr;
    const src = lo.camera.flits ? D.wcv : D.cv;
    const sx = ((cx - wm / 2 - cam.x) * cam.s + cam.w / 2) * dpr;
    const sy = ((cy - hm / 2 - cam.y) * cam.s + cam.h / 2) * dpr;
    const sw = wm * cam.s * dpr, sh = hm * cam.s * dpr;
    const th = document.createElement('canvas');
    th.width = 320; th.height = 240;
    const tc = th.getContext('2d');
    tc.fillStyle = '#04182a'; tc.fillRect(0, 0, 320, 240);
    try { tc.drawImage(src, sx, sy, sw, sh, 0, 0, 320, 240); } catch (e) { /* buiten beeld */ }
    if (!lo.camera.flits) {
      tc.fillStyle = 'rgba(0,40,80,' + U.clamp(D.depth / 60, 0, 0.25) + ')';
      tc.fillRect(0, 0, 320, 240);
    }
    // sterren
    let stars = 1;
    if (best) {
      const dist = Math.hypot(best.x - hx, best.y - hy);
      const ideal = Math.max(0.8, best.L * 1.1);
      const q = 1 - Math.min(1, Math.abs(dist - ideal) / (ideal * 1.3 + 0.5));
      const ang = Math.atan2(Math.abs(best.y - hy), Math.abs(best.x - hx) + 0.01);
      const cen = 1 - Math.min(1, ang / 0.9);
      const light = lo.camera.flits ? 1 : inBeam(best) ? 0.85 : U.clamp(1 - D.depth / 22, 0.25, 1);
      const sc = q * 0.45 + cen * 0.25 + light * 0.3;
      stars = sc > 0.74 ? 3 : sc > 0.5 ? 2 : 1;
    }
    const photo = { sp: best ? best.spc.id : null, stars, url: th.toDataURL('image/jpeg', 0.72), site: D.site.id, date: Date.now(), depth: Math.round(D.depth * 10) / 10 };
    D.dv.photos.push(photo);
    if (best && !D.dv.spotted[best.spc.id]) { D.spotT = 0; }
    D.flash = lo.camera.flits ? 1 : 0.55;
    if (DG.Audio) { DG.Audio.shutter(); if (lo.camera.flits) DG.Audio.strobe(); }
    DG.UI.photoToast(photo, best ? best.spc : null);
  };

  /* ------------------------------------------------------------------ */
  D.finish = function (ooa) {
    if (!D.live) return;
    D.live = false;
    const dv = D.dv, lo = D.lo, sv = DG.Save.data;
    const minutes = D.gt / 60;
    const res = {
      site: D.site.id, date: Date.now(), minutes, maxD: dv.maxD, avgD: D.gt > 0 ? dv.sumD / D.gt : 0,
      temp: D.site.temp, bar: Math.round(Math.max(0, dv.air / lo.tankL)), species: Object.keys(dv.spotted), newSpecies: dv.newSpecies.slice(),
      photos: dv.photos, needStop: dv.needStop, safetyDone: dv.safetyDone, ascentWarnings: dv.ascentWarnings, ooa: !!ooa,
      decoViolation: dv.decoViolation, cold: Math.round(dv.cold), gas: lo.gas, tankL: lo.tankL,
      profile: dv.profile.concat([[minutes, 0]]),
    };
    // beloning
    const lines = [];
    lines.push(['Duik gelogd', 75]);
    let nsum = 0;
    res.newSpecies.forEach((id) => { nsum += DG.RARITY[DG.SPECIES[id].r].pts; });
    if (nsum) lines.push(['Nieuwe soorten (' + res.newSpecies.length + ')', nsum]);
    const again = res.species.length - res.newSpecies.length;
    if (again > 0) lines.push(['Opnieuw gespot (' + again + ')', again * 5]);
    let psum = 0, firstPhotos = 0;
    const bonus = lo.camera ? lo.camera.bonus : 1;
    res.photos.forEach((p) => {
      psum += Math.round(p.stars * 12 * bonus);
      if (p.sp && !sv.species[p.sp].photo) { sv.species[p.sp].photo = true; firstPhotos++; }
    });
    if (psum) lines.push(['Foto’s (' + res.photos.length + ')', psum]);
    if (firstPhotos) lines.push(['Eerste foto van een soort (' + firstPhotos + ')', firstPhotos * 60]);
    if (res.needStop && res.safetyDone) lines.push(['Veiligheidsstop gemaakt', 50]);
    if (!res.ascentWarnings && !ooa) lines.push(['Rustig opgestegen', 30]);
    if (res.bar >= 50 && !ooa) lines.push(['Met reserve boven (≥ 50 bar)', 30]);
    const earned = lines.reduce((s, l) => s + l[1], 0);
    res.lines = lines; res.earned = earned;
    // opslaan
    sv.budget += earned;
    sv.earned = (sv.earned || 0) + earned;
    const prof = res.profile;
    const step = Math.max(1, Math.ceil(prof.length / 70));
    const slim = prof.filter((p, i) => i % step === 0 || i === prof.length - 1).map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
    sv.dives.push({
      nr: sv.dives.length + 1, site: res.site, date: res.date, minutes: Math.round(minutes), maxD: Math.round(res.maxD * 10) / 10,
      avgD: Math.round(res.avgD * 10) / 10, temp: res.temp, species: res.species, newSpecies: res.newSpecies, photos: res.photos.length,
      earned, safetyDone: res.safetyDone, needStop: res.needStop, ascentWarnings: res.ascentWarnings, ooa: res.ooa, bar: res.bar, gas: res.gas, profile: slim,
    });
    res.photos.forEach((p) => sv.photos.push(p));
    if (sv.photos.length > 40) sv.photos = sv.photos.slice(-40);
    DG.Save.save();
    if (DG.Audio) { DG.Audio.ambience(false); DG.Audio.splash(); }
    DG.UI.showSummary(res);
  };

  /* ================================================================
   * Tekenen
   * ================================================================ */
  function waterAt(d) {
    const pal = D.site.pal;
    return U.mix(pal.surf, pal.deep, Math.pow(U.clamp(d / 42, 0, 1), 0.75));
  }
  function depthAtScreen(py) { return cam.y + (py - cam.h / 2) / cam.s; }

  function render() {
    const dpr = D.dpr, W = D.cv.width, H = D.cv.height;
    const ctx = D.wctx, w = D.world, site = D.site;
    const pxm = Math.round(cam.s * dpr);
    const surfY = ((0 - cam.y) * cam.s + cam.h / 2) * dpr;
    const y0 = Math.max(0, surfY);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // waterkleur
    const wg = ctx.createLinearGradient(0, y0, 0, H);
    for (let i = 0; i <= 5; i++) {
      const py = U.lerp(y0, H, i / 5) / dpr;
      wg.addColorStop(i / 5, waterAt(Math.max(0, depthAtScreen(py))));
    }
    ctx.fillStyle = wg;
    ctx.fillRect(0, y0, W, H - y0);
    // lucht
    if (surfY > 0) {
      const sg = ctx.createLinearGradient(0, 0, 0, surfY);
      sg.addColorStop(0, '#5fb6ea'); sg.addColorStop(1, '#d9f0ff');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, surfY + 1);
      const sunX = W * 0.78, sunY = surfY - Math.min(surfY * 0.55, 150 * dpr);
      const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 90 * dpr);
      sun.addColorStop(0, 'rgba(255,255,235,1)'); sun.addColorStop(0.2, 'rgba(255,250,210,0.9)'); sun.addColorStop(1, 'rgba(255,250,210,0)');
      ctx.fillStyle = sun; ctx.fillRect(sunX - 90 * dpr, sunY - 90 * dpr, 180 * dpr, 180 * dpr);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 5; i++) {
        const cxp = ((i * 431 - cam.x * cam.s * 0.1 + D.t * 4) % (W / dpr + 300)) * dpr - 150 * dpr;
        const cyp = surfY - (90 + (i % 3) * 45) * dpr;
        ctx.beginPath(); ctx.ellipse(cxp, cyp, 70 * dpr, 16 * dpr, 0, 0, TAU); ctx.ellipse(cxp + 40 * dpr, cyp - 10 * dpr, 45 * dpr, 18 * dpr, 0, 0, TAU); ctx.fill();
      }
      w.drawHorizon(ctx, cam, dpr, D.t);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const fog = (a) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = wg; ctx.fillRect(0, y0, W, H - y0); ctx.globalAlpha = 1; };
    w.drawFar(ctx, cam, dpr);
    fog(0.55);
    w.drawRays(ctx, cam, dpr, D.t, U.clamp(1 - cam.y / 28, 0, 1) * (site.vis < 8 ? 0.5 : 1));
    w.drawBack(ctx, cam, dpr, D.t, pxm);
    fog(site.backStyle === 'wall' ? 0.14 : 0.33);
    w.drawMain(ctx, cam, dpr, D.t, pxm);
    // dieren, duikers, bellen
    w.setLayer(ctx, cam, 1, dpr);
    drawCreatures(ctx, pxm, -99, 0);
    if (D.mode === 'dive') {
      drawDiver(ctx, D.buddy, D.buddyLook, false);
      drawDiver(ctx, D.diver, D.lo.look, D.lampOn);
    }
    drawCreatures(ctx, pxm, 0, 99);
    drawBubbles(ctx);
    w.drawAbove(ctx, cam, dpr, D.t);
    w.setLayer(ctx, cam, 1, dpr);
    drawSurface(ctx);
    drawParticles(ctx, surfY);

    // samenstellen op het hoofdcanvas
    const m = D.ctx;
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = 'source-over';
    m.globalAlpha = 1;
    m.drawImage(D.wcv, 0, 0);
    if (H > y0) {
      // kleurverlies met diepte
      const ab = site.absorb;
      const tg = m.createLinearGradient(0, y0, 0, H);
      const dk = m.createLinearGradient(0, y0, 0, H);
      const dark = site.dark;
      for (let i = 0; i <= 4; i++) {
        const dd = Math.max(0, depthAtScreen(U.lerp(y0, H, i / 4) / dpr));
        const r = Math.max(0.28, Math.exp(-dd / ab.r)), g = Math.max(0.45, Math.exp(-dd / ab.g)), b = Math.max(0.45, Math.exp(-dd / ab.b));
        tg.addColorStop(i / 4, 'rgb(' + Math.round(255 * r) + ',' + Math.round(255 * g) + ',' + Math.round(255 * b) + ')');
        dk.addColorStop(i / 4, 'rgba(0,6,16,' + U.clamp((dd - dark.start) / dark.range, 0, dark.max).toFixed(3) + ')');
      }
      m.globalCompositeOperation = 'multiply';
      m.fillStyle = tg;
      m.fillRect(0, y0, W, H - y0);
      m.globalCompositeOperation = 'source-over';
      // duisternis met uitsparing voor de lamp
      const l = D.lctx;
      l.setTransform(1, 0, 0, 1, 0, 0);
      l.globalCompositeOperation = 'source-over';
      l.clearRect(0, 0, W, H);
      l.fillStyle = dk;
      l.fillRect(0, y0, W, H - y0);
      const beam = D.mode === 'dive' && D.lampOn && D.lo.lamp ? beamGeom() : null;
      if (beam) {
        l.globalCompositeOperation = 'destination-out';
        beamPath(l, beam, 1);
        l.globalCompositeOperation = 'source-over';
      }
      m.drawImage(D.lcv, 0, 0);
      // beperkt zicht (troebel water)
      if (D.mode === 'dive' && site.vis < 25) {
        const d = D.diver;
        const px = ((d.x - cam.x) * cam.s + cam.w / 2) * dpr, py = ((d.y - cam.y) * cam.s + cam.h / 2) * dpr;
        const murky = site.vis < 8;
        const r0 = site.vis * (murky ? 0.75 : 0.55) * cam.s * dpr, r1 = site.vis * (murky ? 1.75 : 1.35) * cam.s * dpr;
        const fc = waterAt(Math.max(0, D.diver.y));
        const rg = m.createRadialGradient(px, py, r0, px, py, r1);
        const fa = murky ? 0.9 : 0.55;
        rg.addColorStop(0, U.rgba(U.mix(fc, '#000000', 0.25), 0));
        rg.addColorStop(1, U.rgba(U.mix(fc, '#000000', 0.25), fa));
        m.fillStyle = rg;
        m.fillRect(0, y0, W, H - y0);
      }
      if (beam) {
        // ware kleuren in de lichtbundel
        const b = D.bctx;
        b.setTransform(1, 0, 0, 1, 0, 0);
        b.globalCompositeOperation = 'source-over';
        b.clearRect(0, 0, W, H);
        beamPath(b, beam, 0.95);
        b.globalCompositeOperation = 'source-in';
        b.drawImage(D.wcv, 0, 0);
        b.globalCompositeOperation = 'source-over';
        m.drawImage(D.bcv, 0, 0);
        m.globalCompositeOperation = 'lighter';
        beamPath(m, beam, 0.07, '255,250,225');
        m.globalCompositeOperation = 'source-over';
      }
    }
    // vignet van het masker
    if (D.mode === 'dive') {
      const vis = D.lo.vision;
      const vg = m.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35 * vis, W / 2, H / 2, Math.max(W, H) * 0.72);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,4,12,' + (0.55 - (vis - 1) * 0.6).toFixed(2) + ')');
      m.fillStyle = vg;
      m.fillRect(0, 0, W, H);
    }
    if (D.flash > 0) {
      m.fillStyle = 'rgba(255,255,255,' + (D.flash * 0.75).toFixed(3) + ')';
      m.fillRect(0, 0, W, H);
    }
  }

  function beamGeom() {
    const d = D.diver, dpr = D.dpr;
    const hx = d.x + d.face * 0.98, hy = d.y + 0.08;
    const px = ((hx - cam.x) * cam.s + cam.w / 2) * dpr, py = ((hy - cam.y) * cam.s + cam.h / 2) * dpr;
    const ang = d.faceT > 0 ? d.tilt : Math.PI - d.tilt;
    return { px, py, ang, len: D.lo.lamp.bereik * cam.s * dpr, half: D.lo.lamp.hoek, glow: 1.4 * cam.s * dpr };
  }
  function beamPath(c, bm, a, rgb) {
    const col = rgb || '0,0,0';
    const g = c.createRadialGradient(bm.px, bm.py, 0, bm.px, bm.py, bm.len);
    g.addColorStop(0, 'rgba(' + col + ',' + a + ')');
    g.addColorStop(0.55, 'rgba(' + col + ',' + a * 0.75 + ')');
    g.addColorStop(1, 'rgba(' + col + ',0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(bm.px, bm.py);
    c.arc(bm.px, bm.py, bm.len, bm.ang - bm.half, bm.ang + bm.half);
    c.closePath();
    c.fill();
    const h = c.createRadialGradient(bm.px, bm.py, 0, bm.px, bm.py, bm.glow);
    h.addColorStop(0, 'rgba(' + col + ',' + a * 0.6 + ')');
    h.addColorStop(1, 'rgba(' + col + ',0)');
    c.fillStyle = h;
    c.fillRect(bm.px - bm.glow, bm.py - bm.glow, bm.glow * 2, bm.glow * 2);
  }

  function drawCreatures(ctx, pxm, zmin, zmax) {
    const list = D.creatures;
    if (!D._sorted || D.t - (D._sortT || 0) > 0.5) {
      D._sorted = list.slice().sort((a, b) => a.z - b.z);
      D._sortT = D.t;
    }
    for (const c of D._sorted) {
      if (c.z < zmin || c.z >= zmax) continue;
      const m = c.L + (c.b === 'gardeneel' ? c.colonyW : 0);
      if (!onScreen(c.x, c.y, m)) continue;
      const s = 1 + c.z * 0.28;
      ctx.save();
      ctx.translate(c.x, c.y);
      if (c.z < 0) ctx.globalAlpha = U.clamp(1 + c.z * 0.9, 0.35, 1);
      if (c.noFlip) ctx.scale(s, s);
      else ctx.scale(c.face * s, s);
      if (c.tilt) ctx.rotate(c.tilt);
      Art.drawCreature(ctx, c.spc, c.st, D.t, pxm * s);
      ctx.restore();
    }
    // inkt
    for (const k of D.ink) {
      ctx.fillStyle = 'rgba(15,10,20,' + k.a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, TAU); ctx.fill();
    }
  }

  function drawDiver(ctx, d, look, lamp) {
    if (!onScreen(d.x, d.y, 3)) return;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(d.face, 1);
    ctx.rotate(d.tilt);
    Art.drawDiver(ctx, look, { kick: d.kick, lamp });
    ctx.restore();
  }

  function drawBubbles(ctx) {
    ctx.lineWidth = 0.012;
    for (const b of D.bubbles) {
      if (b.delay > 0 || !b.r) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.strokeStyle = 'rgba(235,250,255,0.75)';
      ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * 1.1, b.r * 0.85, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.3, b.r * 0.25, 0, TAU); ctx.fill();
    }
  }

  function drawSurface(ctx) {
    const hw = cam.w / 2 / cam.s;
    const x0 = cam.x - hw - 1, x1 = cam.x + hw + 1;
    if (cam.y - cam.h / 2 / cam.s > 1.5) return;
    const t = D.t;
    const wave = (x) => Math.sin(x * 0.8 + t * 1.5) * 0.07 + Math.sin(x * 2.3 - t * 2.1) * 0.03;
    const g = ctx.createLinearGradient(0, 0, 0, 1.1);
    g.addColorStop(0, 'rgba(230,250,255,0.55)'); g.addColorStop(1, 'rgba(230,250,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, 1.2);
    for (let x = x0; x <= x1; x += 0.3) ctx.lineTo(x, wave(x));
    ctx.lineTo(x1, 1.2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 0.3) { if (x === x0) ctx.moveTo(x, wave(x)); else ctx.lineTo(x, wave(x)); }
    ctx.stroke();
  }

  function drawParticles(ctx, surfY) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = D.dpr, W = D.wcv.width, H = D.wcv.height;
    const spanX = W / dpr + 40, spanY = H / dpr + 40;
    for (const p of D.particles) {
      p.y += 0.02 * (D.paused ? 0 : 1) * 0.016;
      let sx = (p.x * 40 - cam.x * cam.s * p.k) % spanX; if (sx < 0) sx += spanX;
      let sy = (p.y * 40 - cam.y * cam.s * p.k) % spanY; if (sy < 0) sy += spanY;
      sx = (sx - 20) * dpr; sy = (sy - 20) * dpr;
      if (sy < surfY + 4) continue;
      ctx.fillStyle = 'rgba(230,240,230,' + p.a + ')';
      ctx.beginPath(); ctx.arc(sx, sy, p.r * p.k * dpr * 0.8, 0, TAU); ctx.fill();
    }
  }

  D.ndlAt = ndlAt;
})(window.DG);
