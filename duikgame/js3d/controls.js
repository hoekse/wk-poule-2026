/* Diepblauw 3D — besturing: joystick + kijken met slepen (telefoon/tablet), toetsenbord + muis (pc) */

export class Controls {
  constructor(root, cb, area) {
    this.root = root;
    this.area = area;
    this.cb = cb;
    this.fwd = 0; this.side = 0;
    this.lookX = 0; this.lookY = 0; // opgebouwde kijkbeweging (pixels)
    this.bcdIn = false; this.bcdOut = false; this.breath = false; this.exhale = false; this.hard = false;
    this.keys = {};
    this.stick = { id: null, ox: 0, oy: 0 };
    this.look = { id: null, x: 0, y: 0 };
    this.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.build();
    this.bind();
  }

  build() {
    const r = this.root;
    r.insertAdjacentHTML('beforeend', `
      <div class="c3-stick" hidden><i></i></div>
      <div class="c3-left">
        <button class="c3-btn" data-hold="bcdIn" aria-label="Lucht in trimvest">▲<small>vest</small></button>
        <button class="c3-btn" data-hold="bcdOut" aria-label="Lucht uit trimvest">▼<small>vest</small></button>
      </div>
      <div class="c3-right">
        <button class="c3-btn" data-tap="equalize" aria-label="Oren klaren">👂<small>klaren</small></button>
        <button class="c3-btn" data-hold="breath" aria-label="Diep inademen (vasthouden)">🫁<small>adem in</small></button>
        <button class="c3-btn" data-hold="hard" aria-label="Harder zwemmen (vasthouden)">⏩<small>harder</small></button>
        <button class="c3-btn" data-tap="lamp" aria-label="Lamp">🔦<small>lamp</small></button>
        <button class="c3-btn" data-tap="view" aria-label="Camera wisselen">👁️<small>zicht</small></button>
        <button class="c3-btn big" data-tap="photo" aria-label="Foto maken">📷</button>
      </div>
      <button class="c3-ok" data-tap="ok" hidden>👌 OK</button>
      <button class="c3-air" data-tap="air" hidden>🫧 Laat lucht zien</button>
      <button class="c3-pause" data-tap="pause" aria-label="Pauze">❚❚</button>
      <button class="c3-exit btn primary" data-tap="exit" hidden>Duik beëindigen</button>
      <div class="c3-keys">
        <span><kbd>W A S D</kbd> zwemmen</span><span>muis slepen = kijken</span><span><kbd>R</kbd>/<kbd>F</kbd> trimvest</span>
        <span><kbd>B</kbd> adem in</span><span><kbd>K</kbd> klaren</span><span><kbd>Shift</kbd> harder</span><span><kbd>Spatie</kbd> foto</span>
        <span><kbd>L</kbd> lamp</span><span><kbd>V</kbd> zicht</span><span><kbd>O</kbd> OK-teken</span><span><kbd>Esc</kbd> pauze</span>
      </div>`);
    if (this.touch) r.classList.add('c3-touch');
  }

  bind() {
    const r = this.root;
    r.querySelectorAll('[data-hold]').forEach((b) => {
      const k = b.dataset.hold;
      const on = (e) => { e.preventDefault(); e.stopPropagation(); this[k] = true; b.classList.add('on'); };
      const off = () => { this[k] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, off));
    });
    r.querySelectorAll('[data-tap]').forEach((b) => {
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.cb(b.dataset.tap); });
    });
    const area = this.area;
    area.addEventListener('pointerdown', (e) => {
      const left = e.clientX < innerWidth * 0.45;
      if (e.pointerType !== 'mouse' && left && this.stick.id === null) {
        this.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
        const s = r.querySelector('.c3-stick');
        s.hidden = false; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
      } else if (this.look.id === null) {
        this.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
      }
      area.setPointerCapture && area.setPointerCapture(e.pointerId);
    });
    area.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.stick.id) {
        const dx = e.clientX - this.stick.ox, dy = e.clientY - this.stick.oy;
        const R = 60, d = Math.hypot(dx, dy), f = d > R ? R / d : 1;
        this.side = (dx * f) / R; this.fwd = -(dy * f) / R;
        r.querySelector('.c3-stick i').style.transform = `translate(${dx * f}px,${dy * f}px)`;
      } else if (e.pointerId === this.look.id) {
        this.lookX += e.clientX - this.look.x; this.lookY += e.clientY - this.look.y;
        this.look.x = e.clientX; this.look.y = e.clientY;
      }
    });
    const up = (e) => {
      if (e.pointerId === this.stick.id) { this.stick.id = null; this.fwd = this.side = 0; r.querySelector('.c3-stick').hidden = true; }
      if (e.pointerId === this.look.id) this.look.id = null;
    };
    area.addEventListener('pointerup', up);
    area.addEventListener('pointercancel', up);
    this.onKey = (down) => (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (down && this.keys[k]) return;
      this.keys[k] = down;
      if (!down) return;
      const map = { ' ': 'photo', l: 'lamp', v: 'view', k: 'equalize', o: 'ok', Escape: 'pause', p: 'pause', e: 'exit' };
      if (map[k]) { e.preventDefault(); this.cb(map[k]); }
      if (k.indexOf('Arrow') === 0) e.preventDefault();
    };
    this.kd = this.onKey(true); this.ku = this.onKey(false);
    window.addEventListener('keydown', this.kd);
    window.addEventListener('keyup', this.ku);
  }

  // samengestelde invoer per frame
  read() {
    const k = this.keys;
    let fwd = this.fwd, side = this.side;
    if (k.w || k.ArrowUp) fwd += 1;
    if (k.s || k.ArrowDown) fwd -= 1;
    if (k.a) side -= 1;
    if (k.d) side += 1;
    let turn = 0;
    if (k.ArrowLeft) turn -= 1;
    if (k.ArrowRight) turn += 1;
    const out = {
      fwd: Math.max(-1, Math.min(1, fwd)), side: Math.max(-1, Math.min(1, side)), turn,
      lookX: this.lookX, lookY: this.lookY,
      bcdIn: this.bcdIn || !!k.r, bcdOut: this.bcdOut || !!k.f,
      breath: this.breath || !!k.b, exhale: !!k.n, hard: this.hard || !!k.Shift,
    };
    this.lookX = 0; this.lookY = 0;
    return out;
  }

  destroy() {
    window.removeEventListener('keydown', this.kd);
    window.removeEventListener('keyup', this.ku);
  }
}
