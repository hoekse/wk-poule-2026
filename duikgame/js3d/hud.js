/* Diepblauw 3D — duikcomputer in de stijl van een ronde Suunto Ocean, plus trim- en orenmeter */

const fmtT = (sec) => { sec = Math.max(0, Math.floor(sec)); return Math.floor(sec / 60) + '′' + String(sec % 60).padStart(2, '0'); };

export class Hud {
  constructor(root) {
    root.insertAdjacentHTML('beforeend', `
      <div class="h3-watch" aria-label="Duikcomputer">
        <svg class="h3-ring" viewBox="0 0 200 200" aria-hidden="true">
          <g class="h3-bezel"></g>
          <path class="h3-asc-bg" d="M 34 150 A 80 80 0 0 1 34 50"/>
          <path class="h3-asc" d="M 34 150 A 80 80 0 0 1 34 50" pathLength="100"/>
        </svg>
        <div class="h3-top"><span class="h3-l" data-k="ndlL">NULTIJD</span><b data-k="ndl">--</b></div>
        <div class="h3-depth"><b data-k="depth">0.0</b><small>m</small></div>
        <div class="h3-row"><span><small>TIJD</small><b data-k="time">0′00</b></span><span><small>FLES</small><b data-k="bar">207</b></span></div>
        <div class="h3-bot"><span data-k="temp">28°C</span><span data-k="max">max 0.0</span><span data-k="head">N</span></div>
        <div class="h3-alert" data-k="alert" hidden></div>
      </div>
      <div class="h3-side">
        <div class="h3-meter"><small>Trimvest</small><span><i data-k="bcd"></i></span></div>
        <div class="h3-meter"><small>Drijfvermogen</small><span class="mid"><i data-k="buoy"></i></span><em data-k="buoyT">neutraal</em></div>
        <div class="h3-meter"><small>Oren</small><span><i data-k="ear"></i></span></div>
        <div class="h3-flags"><span data-k="ts">×2</span><span data-k="assist">trimhulp aan</span></div>
      </div>
      <div class="h3-spot"><b data-k="spot">0</b> soorten · <b data-k="photos">0</b> foto’s</div>
      <div class="h3-msg" data-k="msg" hidden></div>
      <div class="h3-mask" hidden></div>`);
    this.el = {};
    root.querySelectorAll('[data-k]').forEach((e) => (this.el[e.dataset.k] = e));
    this.mask = root.querySelector('.h3-mask');
    this.asc = root.querySelector('.h3-asc');
    const bz = root.querySelector('.h3-bezel');
    let s = '';
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, r1 = 94, r2 = i % 6 ? 90 : 86;
      s += `<line x1="${100 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * r2}" y2="${100 - Math.cos(a) * r2}"/>`;
    }
    ['N', 'O', 'Z', 'W'].forEach((l, i) => { const a = (i / 4) * Math.PI * 2; s += `<text x="${100 + Math.sin(a) * 79}" y="${104 - Math.cos(a) * 79}">${l}</text>`; });
    bz.innerHTML = s;
    this.bezel = bz;
    this.msgTimer = 0;
  }
  set(k, v) { if (this.el[k] && this.el[k].textContent !== v) this.el[k].textContent = v; }
  update(s) {
    this.set('depth', s.depth.toFixed(1));
    this.set('time', fmtT(s.time));
    this.set('bar', String(Math.round(s.bar)));
    this.set('temp', Math.round(s.temp) + '°C');
    this.set('max', 'max ' + s.maxD.toFixed(1));
    const dirs = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
    this.set('head', dirs[Math.round(((s.heading % 360) + 360) % 360 / 45) % 8] + ' ' + Math.round(((s.heading % 360) + 360) % 360) + '°');
    this.bezel.setAttribute('transform', `rotate(${-s.heading} 100 100)`);
    if (s.deco) { this.set('ndlL', 'DECO'); this.set('ndl', s.ceil.toFixed(0) + ' m · ' + Math.ceil(s.stopMin) + '′'); }
    else if (s.stop) { this.set('ndlL', 'STOP'); this.set('ndl', fmtT(s.stop)); }
    else { this.set('ndlL', 'NULTIJD'); this.set('ndl', s.ndl >= 99 ? '>99′' : Math.floor(s.ndl) + '′'); }
    this.el.ndl.parentElement.classList.toggle('warn', s.deco || (!s.stop && s.ndl < 5));
    const r = Math.max(0, Math.min(1, s.asc / 15));
    this.asc.style.strokeDasharray = `${r * 100} 100`;
    this.asc.classList.toggle('fast', s.asc > 10);
    this.asc.classList.toggle('mid', s.asc > 7 && s.asc <= 10);
    this.el.alert.hidden = !s.alert;
    if (s.alert) this.set('alert', s.alert);
    this.el.bcd.style.width = Math.round(s.bcdFrac * 100) + '%';
    const b = Math.max(-1, Math.min(1, s.net / 3));
    this.el.buoy.style.left = (50 + b * 50) + '%';
    this.set('buoyT', Math.abs(s.net) < 0.35 ? 'neutraal' : s.net > 0 ? 'stijgt (+' + s.net.toFixed(1) + ' kg)' : 'zakt (' + s.net.toFixed(1) + ' kg)');
    this.el.ear.style.width = Math.round(Math.min(1, s.ear) * 100) + '%';
    this.el.ear.classList.toggle('pain', s.ear > 0.6);
    this.set('ts', '×' + s.ts);
    this.set('assist', s.assist ? 'trimhulp aan' : 'trimhulp uit');
    this.set('spot', String(s.spot));
    this.set('photos', String(s.photos));
  }
  msg(text, ms) {
    const m = this.el.msg;
    m.textContent = text;
    m.hidden = false;
    clearTimeout(this.msgTimer);
    this.msgTimer = setTimeout(() => (m.hidden = true), ms || 4000);
  }
  setMask(on) { this.mask.hidden = !on; }
}
