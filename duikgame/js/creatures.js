/* Diepblauw — gedrag van dieren: scholen, tornado's, cruisers, poetsstation, verstoppertjes */
(function (DG) {
  'use strict';
  const U = DG.U, TAU = Math.PI * 2;
  const Art = DG.Art;

  function baseSpeed(spc) {
    const a = spc.art, L = spc.size;
    switch (a.t) {
      case 'shark': return a.v === 'whale' ? 0.75 : a.v === 'cat' ? 0.35 : 1.0;
      case 'ray': return a.v === 'manta' ? 0.9 : 1.1;
      case 'mammal': return a.v === 'porpoise' ? 2.2 : 2.8;
      case 'turtle': return 0.45;
      case 'sealion': return 2.6;
      case 'jelly': return 0.1;
      case 'cuttle': return 0.3;
      default: return U.clamp(0.3 + L * 0.55, 0.32, 1.1);
    }
  }
  const FLOOR_TYPES = { moray: 1, gardeneel: 1, lobster: 1, crab: 1, nudi: 1, frogfish: 1, wobbegong: 1, epaulette: 1, octopus: 1, pygmy: 1 };

  function Creature(spc, cfg, x, y) {
    this.spc = spc;
    this.cfg = cfg;
    this.b = cfg.b;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.face = Math.random() < 0.5 ? -1 : 1;
    this.faceT = this.face;
    this.tilt = 0;
    this.z = 0;
    this.L = Art.sizeOf(spc);
    this.sp = baseSpeed(spc);
    this.st = { phase: Math.random() * TAU, wag: 0, walk: 0, inflate: 0 };
    this.timer = Math.random() * 3;
    this.tx = x; this.ty = y;
    this.home = { x, y };
    this.onFloor = !!FLOOR_TYPES[spc.art.t];
    this.noFlip = spc.art.t === 'jelly' || spc.art.t === 'gardeneel' || spc.art.t === 'pygmy';
    this.fullRot = spc.art.t === 'sealion';
    this.hidden = !!spc.hidden;
  }

  Creature.prototype.steer = function (tx, ty, speed, rate, dt) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const arrive = Math.min(1, d / 1.2);
    const dvx = (dx / d) * speed * arrive, dvy = (dy / d) * speed * arrive;
    this.vx = U.approach(this.vx, dvx, rate, dt);
    this.vy = U.approach(this.vy, dvy, rate, dt);
  };

  Creature.prototype.fleeFrom = function (env, radius, power, dt) {
    if (!env.diver) return;
    const dx = this.x - env.diver.x, dy = this.y - env.diver.y;
    const d = Math.hypot(dx, dy);
    if (d < radius && d > 0.01) {
      const f = (1 - d / radius) * power;
      this.vx += (dx / d) * f * dt * 6;
      this.vy += (dy / d) * f * dt * 6;
    }
  };

  Creature.prototype.integrate = function (env, dt, margin) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const fl = env.world.floorAt(this.x);
    const m = margin == null ? 0.25 + this.L * 0.2 : margin;
    if (this.y > fl - m) { this.y = fl - m; this.vy = Math.min(this.vy, 0); }
    if (this.y < 0.5) { this.y = 0.5; this.vy = Math.max(this.vy, 0); }
  };

  Creature.prototype.orient = function (dt, refVx) {
    const vx = refVx != null && Math.abs(this.vx) < 0.05 ? refVx : this.vx;
    if (Math.abs(vx) > 0.03) this.faceT = vx < 0 ? -1 : 1;
    this.face += U.clamp(this.faceT - this.face, -dt * 5, dt * 5);
    const target = U.clamp(Math.atan2(this.vy, Math.abs(this.vx) + 0.08), -0.55, 0.55) * 0.8;
    this.tilt = U.approach(this.tilt, target, 4, dt);
    const spd = Math.hypot(this.vx, this.vy);
    const a = this.spc.art;
    const amp = a.t === 'mammal' ? 0.35 : a.t === 'shark' ? 0.22 : 0.3;
    const freq = a.t === 'mammal' ? 2 + spd * 0.8 : 3 + Math.min(spd / Math.max(0.1, this.L), 6) * 1.5;
    this.st.phase += dt * freq;
    this.st.wag = Math.sin(this.st.phase) * amp * (0.35 + Math.min(1, spd / (this.sp + 0.01)) * 0.65);
  };

  /* ---------------- groepen ---------------- */
  function Group(kind, cfg, world, members) {
    this.kind = kind;
    this.cfg = cfg;
    this.world = world;
    this.members = members;
    const xr = cfg.x || [5, world.W - 5], dr = cfg.d || [2, 15];
    this.xr = xr; this.dr = dr;
    this.x = U.rand(xr[0], xr[1]);
    this.y = U.rand(dr[0], dr[1]);
    this.vx = 0; this.vy = 0;
    this.tx = this.x; this.ty = this.y;
    this.timer = 0;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.state = 'go';
    this.spread = cfg.spread || 3;
    if (kind === 'cruise') {
      this.state = 'wait';
      this.timer = U.rand(3, 25);
      this.x = -40;
    }
  }
  Group.prototype.update = function (env, dt) {
    const w = this.world;
    const sp = (this.members[0] ? this.members[0].sp : 0.6) * (this.cfg.fast || 1) * (this.cfg.slow || 1);
    if (this.kind === 'cruise') {
      if (this.state === 'wait') {
        this.timer -= dt;
        if (this.timer <= 0) {
          this.state = 'go';
          this.dir = Math.random() < 0.5 ? -1 : 1;
          const fx = env.focusX != null ? env.focusX : w.W / 2;
          this.x = fx - this.dir * (26 + this.spread);
          this.y = U.rand(this.dr[0], this.dr[1]);
          this.ty = this.y;
          this.members.forEach((m) => { m.x = this.x + m.off.x * this.spread - this.dir * 3; m.y = this.y + m.off.y * this.spread * 0.4; m.vx = this.dir * sp; m.face = m.faceT = this.dir; });
        }
        return;
      }
      this.timer -= dt;
      if (this.timer <= 0) { this.timer = U.rand(4, 9); this.ty = U.rand(this.dr[0], this.dr[1]); }
      this.vx = this.dir * sp * 0.85;
      this.vy = U.clamp((this.ty - this.y) * 0.2, -0.3, 0.3);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const fx = env.focusX != null ? env.focusX : w.W / 2;
      if ((this.x - fx) * this.dir > 32 + this.spread) {
        this.state = 'wait';
        this.timer = U.rand(12, 35) * (this.cfg.p != null && this.cfg.p < 0.5 ? 1.6 : 1);
      }
      return;
    }
    if (this.kind === 'tornado') {
      this.x += Math.sin(env.t * 0.05) * 0.05 * dt;
      return;
    }
    // zwervende school
    this.timer -= dt;
    const d = Math.hypot(this.tx - this.x, this.ty - this.y);
    if (this.timer <= 0 || d < 1.5) {
      this.timer = U.rand(5, 11);
      const near = env.focusX != null && Math.random() < 0.75;
      this.tx = U.clamp(near ? env.focusX + U.rand(-15, 15) : this.x + U.rand(-18, 18), this.xr[0], this.xr[1]);
      this.ty = U.rand(this.dr[0], this.dr[1]);
      this.ty = Math.min(this.ty, w.floorAt(this.tx) - 1.5);
    }
    const dd = Math.hypot(this.tx - this.x, this.ty - this.y) || 1;
    this.vx = U.approach(this.vx, ((this.tx - this.x) / dd) * sp * 0.6, 0.8, dt);
    this.vy = U.approach(this.vy, ((this.ty - this.y) / dd) * sp * 0.3, 0.8, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.y = Math.min(this.y, w.floorAt(this.x) - 1.2);
  };

  /* ---------------- gedrag per dier ---------------- */
  const B = {};

  B.wander = function (c, env, dt) {
    c.timer -= dt;
    const cfg = c.cfg, w = env.world;
    const xr = cfg.x || [3, w.W - 3], dr = cfg.d || [1, 30];
    if (c.timer <= 0 || Math.hypot(c.tx - c.x, c.ty - c.y) < 0.7) {
      c.timer = U.rand(4, 10);
      const near = env.focusX != null && Math.random() < 0.35 && Math.abs(env.focusX - c.x) < 40;
      c.tx = U.clamp(near ? env.focusX + U.rand(-10, 10) : c.x + U.rand(-10, 10), xr[0], xr[1]);
      c.ty = Math.min(U.rand(dr[0], dr[1]), w.floorAt(c.tx) - 0.4 - c.L * 0.3);
    }
    c.steer(c.tx, c.ty, c.sp * 0.55 * (cfg.slow || 1), 1.2, dt);
    if (c.L < 1.2) c.fleeFrom(env, 1.4 + c.L, 1.5, dt);
    c.integrate(env, dt);
    c.orient(dt);
  };
  B.curious = function (c, env, dt) {
    const dv = env.diver;
    c.timer -= dt;
    if (dv && c.timer <= 0) {
      const dd = Math.hypot(dv.x - c.x, dv.y - c.y);
      if (dd < 14 && Math.random() < 0.6) {
        c.timer = U.rand(5, 9);
        const side = Math.random() < 0.5 ? -1 : 1;
        c.tx = dv.x + side * U.rand(2.5, 4);
        c.ty = U.clamp(dv.y + U.rand(-1.5, 1), 1, env.world.floorAt(c.tx) - 0.8);
        c.steer(c.tx, c.ty, c.sp * 0.5, 1, dt);
        c.integrate(env, dt);
        c.orient(dt);
        return;
      }
    }
    B.wander(c, env, dt);
  };
  B.hover = function (c, env, dt) {
    c.timer -= dt;
    if (c.timer <= 0) {
      c.timer = U.rand(5, 12);
      c.tx = c.home.x + U.rand(-1.5, 1.5);
      c.ty = Math.min(c.home.y + U.rand(-0.6, 0.6), env.world.floorAt(c.tx) - 0.4);
    }
    c.steer(c.tx, c.ty, 0.12, 0.8, dt);
    c.integrate(env, dt);
    c.orient(dt);
    if (c.spc.id === 'trompetvis') c.tilt = U.approach(c.tilt, -1.1, 0.5, dt);
  };
  B.member = function (c, env, dt) {
    const g = c.group;
    let tx, ty;
    if (g.kind === 'tornado') {
      const dv = env.diver;
      let rs = 1;
      if (dv) {
        const dd = Math.hypot(dv.x - g.x, dv.y - g.y);
        if (dd < c.r + 1.5) rs = U.clamp((dd + 1.8) / c.r, 1, 1.9);
      }
      c.rs = U.approach(c.rs || 1, rs, 1.2, dt);
      c.th += dt * c.om;
      const r = c.r * c.rs;
      tx = g.x + Math.cos(c.th) * r;
      ty = g.y + c.hy + Math.sin(c.th) * r * 0.28;
      c.z = Math.sin(c.th) * 0.55;
      c.steer(tx, ty, c.sp * 1.4, 3, dt);
      c.x += c.vx * dt; c.y += c.vy * dt;
      c.orient(dt);
      return;
    }
    c.off.a += dt * 0.15;
    const ox = (c.off.x + Math.sin(c.off.a) * 0.15) * g.spread;
    const oy = (c.off.y + Math.cos(c.off.a * 1.3) * 0.12) * g.spread * 0.45;
    tx = g.x + ox; ty = g.y + oy;
    if (g.kind === 'pod') ty += Math.sin(env.t * 1.6 + c.off.a * 3) * 0.8;
    const sp = Math.max(c.sp * 1.3, Math.hypot(g.vx, g.vy) * 1.3);
    c.steer(tx, ty, sp, 2.2, dt);
    c.vx += g.vx * dt * 0.8;
    if (g.kind !== 'cruise') c.fleeFrom(env, 2.3 + c.L, 3, dt);
    c.integrate(env, dt, 0.4);
    c.orient(dt, g.vx || g.dir);
  };
  B.cleaning = function (c, env, dt) {
    c.th += dt * c.om;
    const nx = c.cx + Math.cos(c.th) * c.rx, ny = c.cy + Math.sin(c.th) * c.ry + Math.sin(env.t * 0.4 + c.st.phase) * 0.3;
    c.vx = (nx - c.x) / Math.max(dt, 0.001);
    c.vy = (ny - c.y) / Math.max(dt, 0.001);
    c.x = nx; c.y = ny;
    c.z = Math.sin(c.th) * 0.45 * Math.sign(c.om);
    c.orient(dt);
    c.tilt = U.clamp(c.vy * 0.25, -0.3, 0.3);
  };
  B.cruiseSolo = function (c, env, dt) {
    const g = c.group;
    if (g.state === 'wait') { c.x = -100; return; }
    let tx = g.x, ty = g.y;
    const dv = env.diver;
    if (c.cfg.curious && dv) {
      const dd = Math.hypot(dv.x - c.x, dv.y - c.y);
      if (dd < 9) { tx = dv.x + g.dir * 1.5; ty = dv.y - 1.2; }
    }
    c.steer(tx, ty, c.sp, 1.2, dt);
    c.vx = U.approach(c.vx, g.dir * c.sp * 0.85, 0.6, dt);
    c.x += c.vx * dt; c.y += c.vy * dt;
    const fl = env.world.floorAt(c.x);
    if (c.y > fl - 1) c.y = fl - 1;
    if (c.y < 0.6) c.y = 0.6;
    c.orient(dt);
    if (c.spc.art.t === 'ray') c.tilt = U.clamp(c.vy * 0.4, -0.3, 0.3);
  };
  B.hidden = function (c, env, dt) {
    c.st.phase += dt;
    if (c.spc.art.t === 'puffer') return;
  };
  B.crawl = function (c, env, dt) {
    const cfg = c.cfg, w = env.world;
    const xr = cfg.x || [3, w.W - 3];
    const t = c.spc.art.t;
    if (t === 'octopus' && c.mode === 'jet') {
      c.jet -= dt;
      c.x += c.vx * dt; c.y += c.vy * dt;
      c.vx *= 1 - dt * 0.8; c.vy *= 1 - dt * 0.8;
      c.st.mode = 'jet';
      c.y = Math.min(c.y, w.floorAt(c.x) - 0.1);
      if (c.jet <= 0) { c.mode = null; c.st.mode = null; c.cool = 6; }
      c.orient(dt);
      c.tilt = 0;
      return;
    }
    c.cool = (c.cool || 0) - dt;
    if (t === 'octopus' && env.diver && c.cool <= 0) {
      const dd = Math.hypot(env.diver.x - c.x, env.diver.y - c.y);
      if (dd < 1.2) {
        c.mode = 'jet'; c.jet = 2.2;
        const dir = c.x > env.diver.x ? 1 : -1;
        c.vx = dir * 2.6; c.vy = -0.6;
        c.faceT = dir;
        if (env.onInk) env.onInk(c.x, c.y - 0.15);
      }
    }
    c.timer -= dt;
    if (c.timer <= 0) { c.timer = U.rand(4, 12); c.dir = Math.random() < 0.5 ? -1 : 1; c.pause = Math.random() < 0.4; }
    const sp = c.cfg.swimmer ? 0.3 : t === 'nudi' ? 0.015 : t === 'crab' ? 0.14 : t === 'lobster' ? 0.07 : t === 'epaulette' ? 0.12 : 0.06;
    c.vx = c.pause ? 0 : (c.dir || 1) * sp;
    c.x += c.vx * dt;
    if (c.x < xr[0]) c.dir = 1;
    if (c.x > xr[1]) c.dir = -1;
    c.st.walk += Math.abs(c.vx) * dt * 8;
    const fl = w.floorAt(c.x);
    c.y = c.cfg.swimmer ? U.approach(c.y, fl - 0.35 + Math.sin(env.t + c.st.phase) * 0.05, 2, dt) : fl + 0.02;
    if (Math.abs(c.vx) > 0.001) c.faceT = c.vx < 0 ? -1 : 1;
    c.face += U.clamp(c.faceT - c.face, -dt * 4, dt * 4);
    if (c.cfg.swimmer) { c.st.phase += dt * 4; c.st.wag = Math.sin(c.st.phase) * 0.25; }
    else c.st.phase += dt;
    c.tilt = 0;
  };
  B.drift = function (c, env, dt) {
    const cfg = c.cfg, dr = cfg.d || [1, 10];
    const pulse = Math.max(0, Math.sin(env.t * 2.2 + c.st.phase));
    c.vx = (env.current || 0) * 0.5 + Math.sin(env.t * 0.1 + c.st.phase) * 0.05;
    c.vy = -pulse * 0.12 + 0.04;
    c.x += c.vx * dt; c.y += c.vy * dt;
    if (c.y < dr[0]) c.y = dr[0];
    if (c.y > dr[1]) c.y = dr[1] - 0.01;
    const W = env.world.W;
    if (c.x > W + 5) c.x = -5; if (c.x < -5) c.x = W + 5;
    c.tilt = Math.sin(env.t * 0.5 + c.st.phase) * 0.12;
  };
  B.playful = function (c, env, dt) {
    const dv = env.diver;
    let tx, ty;
    c.th += dt * (c.th2 || 1.4);
    if (dv && Math.hypot(dv.x - c.x, dv.y - c.y) < 16 && dv.y < 18) {
      tx = dv.x + Math.cos(c.th) * 2.6;
      ty = Math.max(0.6, dv.y + Math.sin(c.th) * 1.5 - 0.3);
    } else {
      tx = c.home.x + Math.cos(c.th * 0.6) * 5;
      ty = c.home.y + Math.sin(c.th * 0.6) * 1.8;
    }
    c.steer(tx, ty, c.sp, 2.4, dt);
    c.integrate(env, dt, 0.6);
    c.face = 1; c.faceT = 1;
    c.tilt = Math.atan2(c.vy, c.vx);
    c.st.phase += dt;
  };
  B.anemone = function (c, env, dt) {
    const a = c.anem;
    const hx = a.x + c.ox, hy = a.y - a.h * 0.75;
    c.th += dt * (1.4 + c.ox);
    let tx = hx + Math.cos(c.th) * 0.22, ty = hy + Math.sin(c.th * 1.3) * 0.12;
    if (env.diver && Math.hypot(env.diver.x - hx, env.diver.y - hy) < 1.1) { tx = hx; ty = hy + 0.15; }
    c.steer(tx, ty, 0.35, 5, dt);
    c.x += c.vx * dt; c.y += c.vy * dt;
    c.orient(dt);
  };
  B.reef = function (c, env, dt) {
    c.timer -= dt;
    if (c.timer <= 0) {
      c.timer = U.rand(1.5, 4);
      c.tx = c.home.x + U.rand(-0.8, 0.8);
      c.ty = c.home.y + U.rand(-0.5, 0.5);
    }
    c.steer(c.tx, c.ty, 0.25, 2, dt);
    c.fleeFrom(env, 1.3, 4, dt);
    c.integrate(env, dt, 0.15);
    c.orient(dt);
  };
  B.bottom = function (c, env, dt) {
    c.timer -= dt;
    if (c.timer <= 0) { c.timer = U.rand(2, 6); c.vx = U.rand(-0.5, 0.5); }
    c.vx *= 1 - dt * 3;
    if (env.diver && Math.hypot(env.diver.x - c.x, env.diver.y - c.y) < 1.2) c.vx += (c.x > env.diver.x ? 1 : -1) * dt * 3;
    c.x += c.vx * dt;
    c.y = env.world.floorAt(c.x) - 0.03;
    c.orient(dt);
    c.tilt = 0;
  };
  B.gardeneel = function (c, env, dt) {
    const dv = env.diver;
    c.st.eels.forEach((e) => {
      const ex = c.x + e.x;
      const near = dv && Math.hypot(dv.x - ex, dv.y - c.y) < 3.2;
      const target = near ? 0.0 : 1;
      e.ext = target < e.ext ? Math.max(target, e.ext - dt * 5) : Math.min(target, e.ext + dt * 0.35);
    });
  };

  /* ---------------- spawnen ---------------- */
  DG.spawnCreatures = function (world) {
    const site = world.site;
    const list = [], groups = [];
    const W = world.W;
    site.spawns.forEach((cfg) => {
      const spc = DG.SPECIES[cfg.sp];
      if (!spc || cfg.night) return;
      if (cfg.p != null && Math.random() > cfg.p) return;
      const xr = cfg.x || [5, W - 5], dr = cfg.d || [2, 30];
      const L = Art.sizeOf(spc);
      const pos = () => {
        const x = U.rand(xr[0], xr[1]);
        const fl = world.floorAt(x);
        return [x, U.clamp(U.rand(dr[0], dr[1]), 0.8, Math.max(0.9, fl - 0.5 - L * 0.3))];
      };
      const add = (c) => { list.push(c); return c; };
      switch (cfg.b) {
        case 'wander':
        case 'curious':
        case 'hover':
          for (let i = 0; i < cfg.n; i++) { const [x, y] = pos(); add(new Creature(spc, cfg, x, y)); }
          break;
        case 'school':
        case 'tornado':
        case 'sharkschool':
        case 'pod':
        case 'cruise': {
          const kind = cfg.b === 'sharkschool' || cfg.b === 'pod' || cfg.b === 'cruise' ? 'cruise' : cfg.b;
          const g = new Group(kind, cfg, world, []);
          if (cfg.b === 'sharkschool') g.spread = 7;
          if (cfg.b === 'pod') g.spread = 3;
          if (cfg.b === 'cruise') g.spread = cfg.n > 1 ? 6 : 0;
          if (kind === 'tornado') { g.x = U.rand(xr[0], xr[1]); g.y = (dr[0] + dr[1]) / 2; }
          for (let i = 0; i < cfg.n; i++) {
            const c = new Creature(spc, cfg, g.x, g.y);
            c.group = g;
            c.b = cfg.b === 'cruise' && cfg.n === 1 ? 'cruiseSolo' : 'member';
            if (cfg.b === 'cruise' && cfg.n > 1) c.b = 'member';
            const a = Math.random() * TAU, r = Math.sqrt(Math.random());
            c.off = { x: Math.cos(a) * r, y: Math.sin(a) * r, a: Math.random() * TAU };
            if (kind === 'tornado') {
              c.r = U.rand(1.6, 4.2); c.th = Math.random() * TAU; c.om = U.rand(0.25, 0.42); c.hy = U.rand(-2.2, 2.2);
              c.x = g.x + Math.cos(c.th) * c.r; c.y = g.y + c.hy;
            } else if (kind === 'school') {
              c.x = g.x + c.off.x * g.spread; c.y = g.y + c.off.y * g.spread * 0.45;
              c.z = U.rand(-0.35, 0.25);
            } else {
              c.x = -100;
              c.z = cfg.b === 'sharkschool' ? U.rand(-0.6, 0.2) : 0;
            }
            g.members.push(c);
            add(c);
          }
          groups.push(g);
          break;
        }
        case 'cleaning': {
          for (let i = 0; i < cfg.n; i++) {
            const c = add(new Creature(spc, cfg, cfg.cx, cfg.cy));
            c.cx = cfg.cx; c.cy = cfg.cy;
            c.rx = U.rand(5.5, 8); c.ry = U.rand(1.2, 2);
            c.th = Math.random() * TAU;
            c.om = (Math.random() < 0.5 ? -1 : 1) * (c.sp / c.rx) * 0.75;
          }
          break;
        }
        case 'hidden':
        case 'pillar':
        case 'pygmy': {
          for (let i = 0; i < cfg.n; i++) {
            let x = U.rand(xr[0], xr[1]), y = world.floorAt(x) + 0.03;
            if (cfg.b === 'pillar' && world.pillars.length) {
              const ps = world.pillars.filter((p) => p.x >= xr[0] && p.x <= xr[1]);
              const p = U.pick(ps.length ? ps : world.pillars);
              const side = Math.random() < 0.5 ? -1 : 1;
              x = p.x + side * (p.w / 2 + 0.05);
              y = U.rand(dr[0], Math.min(dr[1], p.bottom - 1));
            }
            if (cfg.b === 'pygmy') {
              const fans = world.fans.filter((f) => f.y >= (cfg.minD || 10) && f.h > 1.1);
              const f = fans.length ? U.pick(fans.slice(0, 6)) : world.fans[0];
              if (!f) break;
              x = f.x + U.rand(-0.15, 0.15); y = f.y - f.h * U.rand(0.45, 0.7);
            }
            const c = add(new Creature(spc, cfg, x, y));
            c.b = 'hidden';
            c.face = c.faceT = Math.random() < 0.5 ? -1 : 1;
            c.st.rock = site.pal.rock;
            if (spc.art.t === 'frogfish' && cfg.b === 'pillar') { c.tilt = 0; c.onPillar = true; }
          }
          break;
        }
        case 'crawl':
          for (let i = 0; i < cfg.n; i++) {
            const x = U.rand(xr[0], xr[1]);
            const c = add(new Creature(spc, cfg, x, world.floorAt(x)));
            c.dir = Math.random() < 0.5 ? -1 : 1;
          }
          break;
        case 'drift':
          for (let i = 0; i < cfg.n; i++) { const [x, y] = pos(); add(new Creature(spc, cfg, x, y)); }
          break;
        case 'playful':
          for (let i = 0; i < cfg.n; i++) {
            const x = (site.scenery.boatX || 40) + U.rand(-10, 10);
            const c = add(new Creature(spc, cfg, x, U.rand(1.5, 5)));
            c.th = Math.random() * TAU; c.th2 = U.rand(1.1, 1.8);
          }
          break;
        case 'anemone': {
          const anems = world.anemones.slice().sort(() => Math.random() - 0.5).slice(0, 14);
          anems.forEach((a) => {
            const n = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < n; i++) {
              const c = add(new Creature(spc, cfg, a.x, a.y - a.h));
              c.b = 'anemone'; c.anem = a; c.ox = U.rand(-0.15, 0.15); c.th = Math.random() * TAU;
            }
          });
          break;
        }
        case 'reef': {
          const hosts = world.corals.filter((o) => o.type !== 'rock' && o.type !== 'boulder' && o.x >= xr[0] && o.x <= xr[1] && o.y > 1);
          for (let i = 0; i < cfg.n; i++) {
            let hx, hy;
            if (cfg.wall) { hx = U.rand(xr[0], xr[1]); hy = U.rand(2, 22); if (i % 6) { const prev = list[list.length - 1]; if (prev && prev.spc === spc) { hx = prev.home.x + U.rand(-1.2, 1.2); hy = prev.home.y + U.rand(-0.8, 0.8); } } }
            else {
              if (!hosts.length) break;
              const hst = (i % 5 === 0 || !list.length || list[list.length - 1].spc !== spc) ? U.pick(hosts) : list[list.length - 1].hostObj;
              hx = hst.x + U.rand(-0.6, 0.6); hy = hst.y - hst.h - U.rand(0.2, 0.9);
              const c = add(new Creature(spc, cfg, hx, hy));
              c.hostObj = hst; c.z = U.rand(-0.3, 0.3);
              continue;
            }
            const c = add(new Creature(spc, cfg, hx, hy));
            c.z = U.rand(-0.4, 0.3);
          }
          break;
        }
        case 'bottom':
          for (let i = 0; i < cfg.n; i++) { const x = U.rand(xr[0], xr[1]); add(new Creature(spc, cfg, x, world.floorAt(x))); }
          break;
        case 'gardeneel': {
          const cx = (xr[0] + xr[1]) / 2;
          const c = add(new Creature(spc, cfg, cx, world.floorAt(cx) + 0.02));
          const eels = [];
          for (let i = 0; i < (cfg.count || 12); i++) eels.push({ x: U.rand(xr[0], xr[1]) - cx, ext: 1, ph: Math.random() * TAU });
          eels.sort((a, b) => a.x - b.x);
          c.st.eels = eels.map((e) => ({ x: e.x, ext: 1, ph: e.ph }));
          c.b = 'gardeneel';
          c.colonyW = xr[1] - xr[0];
          break;
        }
      }
    });
    return { list, groups };
  };

  DG.updateCreatures = function (cs, groups, env, dt) {
    for (const g of groups) g.update(env, dt);
    for (const c of cs) {
      const f = B[c.b] || B.wander;
      f(c, env, dt);
      if (c.spc.art.t === 'puffer' && env.diver) {
        const near = Math.hypot(env.diver.x - c.x, env.diver.y - c.y) < 1.2;
        if (near) c.puffT = 3;
        c.puffT = (c.puffT || 0) - dt;
        c.st.inflate = U.approach(c.st.inflate, c.puffT > 0 ? 1 : 0, c.puffT > 0 ? 6 : 0.8, dt);
      }
      if (c.gardenX == null && c.b === 'gardeneel') c.gardenX = c.x;
    }
  };

  // De gardeneel-kolonie tekent eels relatief t.o.v. c.x; zet de eels in meters
  DG.prepEels = function (c) {
    return c.st.eels;
  };
})(window.DG);
