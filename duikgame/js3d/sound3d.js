/* Diepblauw 3D — echte geluiden (Magnific): ademhaling door de automaat, bellen,
   knappende garnalen op het rif, golven aan de oppervlakte, trimvest, camera,
   papegaaivissen die op koraal knagen en af en toe een boot in de verte.
   Valt terug op de gesynthetiseerde geluiden van DG.Audio als laden mislukt. */
const DG = window.DG;

const FILES = ['inadem1', 'inadem2', 'inadem3', 'uitadem1', 'uitadem2', 'uitadem3', 'rif', 'golven', 'boot', 'vest-in', 'vest-uit', 'camera', 'papegaai'];

export class Sound3D {
  constructor() {
    this.buf = {};
    this.ok = false;
    this.last = {};
    this.boatT = 60 + Math.random() * 120;
    this.crunchT = 8;
  }

  async load() {
    const A = DG.Audio;
    if (A.unlock) A.unlock();
    const c = A.ctx;
    if (!c) return;
    this.c = c;
    this.out = c.createGain();
    this.out.gain.value = 1;
    this.out.connect(A.master || c.destination);
    await Promise.all(FILES.map((n) => fetch(new URL('../audio/' + n + '.mp3', import.meta.url).href)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((ab) => ab && new Promise((res) => c.decodeAudioData(ab, (b) => { this.buf[n] = b; res(); }, () => res())))
      .catch(() => {})));
    this.ok = !!(this.buf.inadem1 && this.buf.uitadem1);
  }

  play(name, gain = 1, rate = 1, pan = 0) {
    const b = this.buf[name];
    if (!this.ok || !b) return null;
    const c = this.c;
    const s = c.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = rate;
    const g = c.createGain();
    g.gain.value = gain;
    let node = s.connect(g);
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); node = node.connect(p); }
    node.connect(this.out);
    s.start();
    return { s, g };
  }
  // willekeurige variant, niet twee keer dezelfde achter elkaar
  pick(base, n) {
    let i = 1 + Math.floor(Math.random() * n);
    if (i === this.last[base]) i = (i % n) + 1;
    this.last[base] = i;
    return base + i;
  }

  inhale(depth) { return this.play(this.pick('inadem', 3), 0.42, 1 - Math.min(0.08, depth * 0.003)); }
  exhale(depth) { return this.play(this.pick('uitadem', 3), 0.5, 1 - Math.min(0.1, depth * 0.004)); }
  vestIn() { return this.play('vest-in', 0.45); }
  vestOut() { return this.play('vest-uit', 0.4); }
  camera() { return this.play('camera', 0.55); }

  // achtergrond: rif-geknetter onder water, golven aan de oppervlakte
  startLoops() {
    if (!this.ok) return;
    const loop = (n) => {
      if (!this.buf[n]) return null;
      const s = this.c.createBufferSource(); s.buffer = this.buf[n]; s.loop = true;
      const g = this.c.createGain(); g.gain.value = 0;
      s.connect(g).connect(this.out); s.start();
      return { s, g };
    };
    this.rif = loop('rif');
    this.golven = loop('golven');
  }
  update(dt, st) {
    if (!this.ok) return;
    const t = this.c.currentTime;
    const surf = st.depth < 0.6 ? 1 : 0;
    // knappende garnalen zijn 's nachts nog actiever
    if (this.rif) this.rif.g.gain.setTargetAtTime(surf ? 0.04 : (0.16 + Math.min(0.08, st.depth * 0.006)) * (st.night ? 1.3 : 1), t, 0.6);
    if (this.golven) this.golven.g.gain.setTargetAtTime(surf ? 0.55 : 0, t, 0.3);
    // af en toe een boot in de verte (alleen onder water te horen)
    this.boatT -= dt;
    if (this.boatT <= 0) {
      this.boatT = 150 + Math.random() * 240;
      if (!surf) this.play('boot', 0.32, 0.9 + Math.random() * 0.2, (Math.random() - 0.5) * 1.4);
    }
    // papegaaivissen die op koraal knagen
    this.crunchT -= dt;
    if (this.crunchT <= 0) {
      this.crunchT = 5 + Math.random() * 10;
      if (st.parrotDist < 12) this.play('papegaai', 0.55 * (1 - st.parrotDist / 12), 0.9 + Math.random() * 0.25, st.parrotPan || 0);
    }
  }
  stop() {
    [this.rif, this.golven].forEach((l) => { if (l) { try { l.s.stop(); } catch (e) { /* al gestopt */ } } });
    if (this.out) this.out.disconnect();
    this.ok = false;
  }
}
