/* Diepblauw — kleine hulpfuncties */
window.DG = window.DG || {};
(function (DG) {
  'use strict';
  const U = (DG.U = {});
  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = (t) => t * t * (3 - 2 * t);
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.sign = (v) => (v < 0 ? -1 : 1);
  U.approach = (v, target, rate, dt) => v + (target - v) * (1 - Math.exp(-rate * dt));

  // Deterministische random (mulberry32)
  U.rng = function (seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  // Kleuren
  const cache = {};
  U.rgb = function (hex) {
    if (cache[hex]) return cache[hex];
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return (cache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
  };
  U.hex = (r, g, b) =>
    '#' + [r, g, b].map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  U.mix = function (c1, c2, t) {
    const a = U.rgb(c1), b = U.rgb(c2);
    return U.hex(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t));
  };
  U.rgba = function (c, a) {
    const [r, g, b] = U.rgb(c);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  };
  U.shade = function (c, amt) {
    return amt < 0 ? U.mix(c, '#000000', -amt) : U.mix(c, '#ffffff', amt);
  };

  // Stuksgewijs vloeiende interpolatie door [[x,y],...]
  U.interp = function (pts, x) {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) {
        const a = pts[i - 1], b = pts[i];
        const t = (x - a[0]) / (b[0] - a[0]);
        return U.lerp(a[1], b[1], U.smooth(t));
      }
    }
    return pts[pts.length - 1][1];
  };

  // Gladde 1D-ruis uit sinussen
  U.noise1 = function (x, seed) {
    const s = seed || 0;
    return (
      0.5 * Math.sin(x * 0.13 + s * 1.7) +
      0.3 * Math.sin(x * 0.31 + s * 3.1 + 1.3) +
      0.2 * Math.sin(x * 0.77 + s * 5.3 + 2.1)
    );
  };

  U.euro = (n) => '€ ' + Math.round(n).toLocaleString('nl-NL');
  U.mmss = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  };
  U.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  U.esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
})(window.DG);
