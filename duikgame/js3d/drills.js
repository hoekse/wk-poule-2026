/* Diepblauw 3D — buddy-oefeningen tijdens de duik (zoals bij een duikopleiding):
   lucht delen, buddy kwijt, handsignalen en een gecontroleerde noodopstijging (CESA).
   Je buddy begint er onverwacht mee; eerst kies je wat je moet doen, daarna doe je het echt. */
import * as THREE from 'three';
import { seabed } from './terrain.js';

const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

export const DRILL_NAMES = { ooa: 'Lucht delen', lost: 'Buddy kwijt', signs: 'Handsignalen', cesa: 'Gecontroleerde noodopstijging' };

// handsignalen (zoals bij PADI/SSI): e = pictogram, g = wat je ziet, a = juiste betekenis, w = foute antwoorden
const SIGNS = [
  { e: '👍', g: 'Je buddy steekt zijn duim omhoog.', a: 'Omhoog: we gaan naar boven', w: ['Alles is OK', 'Goed gedaan!'], tip: 'Onder water betekent duim omhoog altijd “omhoog”. OK is de ring van duim en wijsvinger.' },
  { e: '👌', g: 'Je buddy maakt een ring met duim en wijsvinger.', a: 'OK, alles goed', w: ['Omhoog', 'Ik heb nog maar weinig lucht'] },
  { e: '👎', g: 'Je buddy steekt zijn duim omlaag.', a: 'Omlaag: we gaan dieper', w: ['Er is iets niet goed', 'Einde van de duik'] },
  { e: '✊', g: 'Je buddy houdt zijn vuist tegen zijn borst.', a: 'Ik heb bijna geen lucht meer (reserve)', w: ['Ik heb het koud', 'Wacht even op mij'] },
  { e: '🖐️', g: 'Je buddy haalt zijn vlakke hand langs zijn keel.', a: 'Lucht op: ik heb geen lucht!', w: ['Stop met fotograferen', 'Ik heb dorst'], tip: 'Lucht op: geef meteen je octopus.' },
  { e: '🤚', g: 'Je buddy wiebelt met zijn vlakke hand heen en weer.', a: 'Er is iets niet in orde', w: ['Nog een beetje lucht', 'Hallo!'], tip: 'Daarna wijst hij aan wát er niet goed is.' },
  { e: '☝️', g: 'Je buddy wijst naar zijn oor.', a: 'Ik krijg mijn oren niet geklaard', w: ['Luister eens', 'Ik hoor een boot'], tip: 'Stijg dan samen een stukje op en probeer opnieuw te klaren.' },
  { e: '✌️', g: 'Je buddy wijst met twee vingers naar zijn ogen en dan naar de bodem.', a: 'Kijk daar!', w: ['Mijn masker lekt', 'Ik ben moe'] },
  { e: '✋', g: 'Je buddy houdt zijn vlakke hand stil naar je toe.', a: 'Stop, blijf hier', w: ['Hallo!', 'Nog vijf minuten'] },
  { e: '👇', g: 'Je buddy beweegt zijn vlakke hand, handpalm omlaag, rustig op en neer.', a: 'Rustig aan, langzamer', w: ['Omlaag', 'Lucht uit je trimvest'] },
];

export class Drills {
  // ctx: { root (ui), hud, night, onSound(kind) }
  constructor(ctx) {
    this.ctx = ctx;
    this.on = !!ctx.on;
    this.queue = shuffle(['ooa', 'lost', 'signs', 'cesa']);
    this.wait = 50;
    this.cur = null;
    this.done = [];
    this.root = ctx.root;
    this.card = document.createElement('div');
    this.card.className = 'c3-drill';
    this.card.hidden = true;
    this.root.appendChild(this.card);
    this.exh = this.root.querySelector('.c3-exh');
    this.opts = [];
    this.tmp = new THREE.Vector3();
  }

  get active() { return !!this.cur; }
  // luchtverbruik: bij lucht delen ademt je buddy uit jouw fles
  gasFactor() { return this.cur && this.cur.id === 'ooa' && (this.cur.phase === 'grip' || this.cur.phase === 'up') ? 2 : 1; }
  // bij de noodopstijging mag je sneller (max. 18 m/min) dan normaal
  ascLimit() { return this.cur && this.cur.id === 'cesa' && this.cur.phase === 'swim' ? 18 : 10; }
  // geen afstandswaarschuwingen terwijl je buddy 'kwijt' is
  quietSep() { return !!(this.cur && this.cur.id === 'lost'); }
  // wat doet de buddy? null = normaal volgen
  buddyMode() {
    const c = this.cur;
    if (!c) return null;
    if (c.id === 'ooa') return c.phase === 'come' ? 'front' : c.phase === 'grip' || c.phase === 'up' ? 'attach' : null;
    if (c.id === 'lost') return c.phase === 'gone' || c.phase === 'search' || c.phase === 'ascend' ? 'gone' : c.phase === 'surface' ? 'surface' : null;
    if (c.id === 'signs') return 'front';
    return null;
  }

  /* ---------------- kaart met vraag en keuzes ---------------- */
  show(title, html, options, limit) {
    const c = this.card;
    c.hidden = false;
    this.opts = options ? shuffle(options.slice()) : [];
    c.innerHTML = '<div class="dr-t">' + title + '</div>' + html +
      (this.opts.length ? '<div class="dr-btns">' + this.opts.map((o, i) => '<button data-i="' + i + '"><kbd>' + (i + 1) + '</kbd>' + o.t + '</button>').join('') + '</div>' : '') +
      (limit ? '<div class="dr-bar"><i></i></div>' : '');
    c.querySelectorAll('.dr-btns button').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.choose(+b.dataset.i); }));
    this.limit = limit || 0;
    this.qT = 0;
    this.locked = false;
  }
  text(title, html) { this.show(title, html, null, 0); }
  hide() { this.card.hidden = true; this.opts = []; }
  mark(i, ok) {
    const bs = this.card.querySelectorAll('.dr-btns button');
    if (bs[i]) bs[i].classList.add(ok ? 'ok' : 'bad');
    if (!ok) this.opts.forEach((o, j) => { if (o.ok && bs[j]) bs[j].classList.add('ok'); });
  }

  /* ---------------- per frame ---------------- */
  // s: { depth, inp, asc (m/min, omhoog positief), yawStep (rad dit frame), me, camPos, camFwd, buddyP, lampOn, needStop, stopDone, inDeco, bar, fastCount }
  update(dt, s) {
    if (!this.on) return;
    if (this.limit && !this.locked) {
      this.qT += dt;
      const bar = this.card.querySelector('.dr-bar i');
      if (bar) bar.style.width = Math.max(0, 100 - (this.qT / this.limit) * 100) + '%';
      if (this.qT > this.limit) this.timeout();
    }
    if (!this.cur) {
      if (s.depth > 3 && !s.inDeco) this.wait -= dt;
      if (this.wait > 0) return;
      const ok = {
        ooa: s.depth >= 6.5 && s.depth <= 15 && s.bar > 90,
        lost: s.depth >= 3,
        signs: s.depth >= 2,
        cesa: s.depth >= 4 && s.depth <= 9.5 && (!s.needStop || s.stopDone) && s.bar > 60,
      };
      const id = this.queue.find((q) => ok[q]);
      if (id) { this.queue.splice(this.queue.indexOf(id), 1); this.start(id, s); }
      return;
    }
    const c = this.cur;
    c.t += dt;
    this['up_' + c.id](dt, s, c);
  }

  start(id, s) {
    const H = this.ctx.hud;
    this.cur = { id, phase: 'start', t: 0, notes: [], ok: true, d0: s.depth, fast0: s.fastCount };
    const c = this.cur;
    if (id === 'ooa') {
      c.phase = 'come';
      H.msg('OEFENING · Je buddy zwemt naar je toe en haalt zijn vlakke hand langs zijn keel: lucht op!', 5000);
      this.show('Oefening · lucht delen', '<div class="dr-sig"><b>🖐️</b><span>Je buddy heeft (voor de oefening) geen lucht meer.</span></div><div class="dr-q">Wat doe je?</div>', [
        { t: 'Geef je octopus (de gele reserve-automaat op je borst)', ok: true },
        { t: 'Geef het teken omhoog en zwem voor hem uit naar boven', ok: false },
        { t: 'Maak het OK-teken', ok: false },
      ], 15);
    } else if (id === 'lost') {
      c.phase = 'gone';
      // je buddy verdwijnt achter de pijlers, ±25 m achter je
      const back = this.tmp.copy(s.camFwd).setY(0);
      if (back.lengthSq() < 1e-4) back.set(1, 0, 0);
      back.normalize().multiplyScalar(-1);
      const side = new THREE.Vector3(-back.z, 0, back.x);
      const x = Math.max(-140, Math.min(-6, s.me.x + back.x * 24 + side.x * rand(-6, 6)));
      const z = Math.max(-30, Math.min(30, s.me.z + back.z * 24 + side.z * rand(-6, 6)));
      c.lostAt = new THREE.Vector3(x, Math.min(-1.5, seabed(x, z) + 1.4), z);
      c.from = s.me.clone();
      c.rot = 0; c.maxDist = 0;
      this.ctx.hud.msg('Je kijkt even naar een vis… en je buddy is weg!', 4500);
      this.show('Oefening · buddy kwijt', '<div class="dr-q">Je ziet je buddy nergens meer. Wat is de afspraak?</div>', [
        { t: 'Maximaal één minuut rondkijken (ook omhoog en omlaag), dan rustig opstijgen en boven op elkaar wachten', ok: true },
        { t: 'Zwemmen naar waar je hem het laatst zag en daar blijven zoeken', ok: false },
        { t: 'Op de bodem wachten tot hij vanzelf terugkomt', ok: false },
      ], 15);
    } else if (id === 'signs') {
      c.phase = 'q';
      c.list = shuffle(SIGNS.slice()).slice(0, 3);
      c.i = 0; c.right = 0;
      H.msg('OEFENING · Je buddy oefent handsignalen met je. Wat bedoelt hij?', 4000);
      this.askSign();
    } else if (id === 'cesa') {
      c.phase = 'ask';
      c.exT = 0; c.upT = 0; c.held = false; c.fast = 0; c.noEx = 0; c.noExT = 0;
      H.msg('OEFENING · Je buddy geeft aan: we oefenen een gecontroleerde noodopstijging.', 4500);
      this.show('Oefening · noodopstijging (CESA)', '<div class="dr-q">Stel: je lucht is op en je buddy is te ver weg om lucht te delen. Je bent minder dan 9 m diep. Wat doe je?</div>', [
        { t: 'Automaat in je mond houden, continu uitademen (“aaah”) en rustig naar boven zwemmen', ok: true },
        { t: 'Diep inademen, je adem inhouden en zo snel mogelijk naar boven', ok: false },
        { t: 'Je automaat uit je mond halen zodat je makkelijker kunt uitademen', ok: false },
      ], 15);
    }
    if (this.ctx.onSound) this.ctx.onSound('start');
  }

  askSign() {
    const c = this.cur, sg = c.list[c.i];
    this.show('Oefening · handsignalen (' + (c.i + 1) + '/' + c.list.length + ')',
      '<div class="dr-sig"><b>' + sg.e + '</b><span>' + sg.g + '</span></div><div class="dr-q">Wat bedoelt je buddy?</div>',
      [{ t: sg.a, ok: true }].concat(sg.w.map((w) => ({ t: w, ok: false }))), 12);
  }

  // keuze 0..2 (knop of toets 1/2/3)
  choose(i) {
    const c = this.cur;
    if (!c || this.locked || !this.opts[i]) return;
    const o = this.opts[i];
    const H = this.ctx.hud;
    if (this.ctx.onSound) this.ctx.onSound(o.ok ? 'ok' : 'bad');
    if (c.id === 'signs') {
      this.locked = true;
      this.mark(i, o.ok);
      const sg = c.list[c.i];
      if (o.ok) c.right++;
      H.msg(o.ok ? 'Goed! ' + (sg.tip || '') : 'Niet goed: het betekent “' + sg.a + '”. ' + (sg.tip || ''), 4000);
      setTimeout(() => this.nextSign(), 1800);
      return;
    }
    if (!o.ok) {
      this.mark(i, false);
      c.wrong = (c.wrong || 0) + 1;
      c.ok = false;
      c.notes.push('Eerst een verkeerde keuze gemaakt');
      this.locked = true;
      setTimeout(() => this.afterChoice(), 1600);
      return;
    }
    this.mark(i, true);
    this.locked = true;
    setTimeout(() => this.afterChoice(), 700);
  }

  // na een (goede of foute) keuze: door naar het doe-gedeelte
  afterChoice() {
    const c = this.cur;
    if (!c) return;
    const H = this.ctx.hud;
    if (c.id === 'ooa') {
      if (c.phase === 'come') {
        c.react = c.t;
        c.phase = 'grip';
        H.msg('Je buddy ademt nu uit jouw octopus. Pak elkaar vast aan de schouderband van het trimvest.', 4500);
        this.show('Oefening · lucht delen', '<div class="dr-q">Jullie houden elkaar vast. Welk teken geef je nu?</div>', [
          { t: '👍 Duim omhoog: we gaan samen naar boven', ok: true },
          { t: '👎 Duim omlaag', ok: false },
          { t: '👌 OK-teken en verder duiken', ok: false },
        ], 15);
      } else if (c.phase === 'grip') {
        c.phase = 'up';
        c.goal = Math.max(1.5, Math.min(5, c.d0 - 2.5));
        c.fastUp = 0;
        this.hide();
        H.msg('Stijg samen rustig op naar ' + c.goal.toFixed(0) + ' m (max. 9–10 m/min). Je buddy ademt uit jouw fles: let op je manometer!', 6000);
      }
    } else if (c.id === 'lost') {
      c.phase = 'search';
      c.st = 0;
      this.hide();
      H.msg('Kijk rond: draai een volledig rondje en kijk ook omhoog en omlaag. Na één minuut ga je rustig naar boven.', 6000);
    } else if (c.id === 'cesa') {
      c.phase = 'swim';
      this.hide();
      if (this.exh) this.exh.hidden = false;
      H.msg('Houd 💨 Uitademen (of N) ingedrukt en zwem rustig naar boven. Niet sneller dan 18 m/min!', 6000);
    }
  }

  timeout() {
    const c = this.cur;
    if (!c) return;
    this.locked = true;
    const H = this.ctx.hud;
    if (c.id === 'signs') {
      this.mark(-1, false);
      const sg = c.list[c.i];
      H.msg('Te laat: het betekent “' + sg.a + '”.', 3500);
      setTimeout(() => this.nextSign(), 1600);
      return;
    }
    c.ok = false;
    c.late = true;
    if (c.id === 'ooa' && c.phase === 'come') { c.notes.push('Te laat: je buddy pakte zelf je octopus'); H.msg('Je reageerde te laat. Je buddy pakt zelf je octopus van je borst (dat mag), maar sneller reageren is beter.', 5000); }
    else if (c.id === 'ooa') c.notes.push('Te laat het teken omhoog gegeven');
    else c.notes.push('Te laat gekozen');
    this.mark(-1, false);
    setTimeout(() => this.afterChoice(), 1400);
  }

  nextSign() {
    const c = this.cur;
    if (!c) return;
    c.i++;
    if (c.i < c.list.length) { this.askSign(); return; }
    c.ok = c.right === c.list.length;
    c.notes.push(c.right + ' van de ' + c.list.length + ' tekens goed');
    this.finish(c.right >= 2 ? 'Handsignalen: ' + c.right + '/' + c.list.length + ' goed.' : 'Handsignalen: ' + c.right + '/' + c.list.length + '. Oefen ze nog eens!');
  }

  /* ---------------- lucht delen ---------------- */
  up_ooa(dt, s, c) {
    if (c.phase !== 'up') return;
    this.text('Oefening · lucht delen', '<div class="dr-q">Samen rustig opstijgen naar ' + c.goal.toFixed(0) + ' m · nu <b>' + s.depth.toFixed(1) + ' m</b> · ' + Math.max(0, s.asc).toFixed(0) + ' m/min</div>');
    if (s.depth <= c.goal + 0.2) {
      const fast = s.fastCount - c.fast0;
      if (fast) { c.ok = false; c.notes.push(fast + '× te snel opgestegen'); }
      c.notes.unshift(c.late ? 'Octopus te laat gegeven' : 'Octopus gegeven na ' + c.react.toFixed(0) + ' s');
      this.finish('Op ' + c.goal.toFixed(0) + ' m. Je buddy geeft het OK-teken en neemt zijn eigen automaat weer. ' + (c.ok ? 'Oefening geslaagd!' : 'Oefening klaar, maar het kan beter.'));
    }
  }

  /* ---------------- buddy kwijt ---------------- */
  up_lost(dt, s, c) {
    if (c.phase === 'gone' || c.phase === 'done') return;
    const H = this.ctx.hud;
    if (c.phase === 'search' || c.phase === 'ascend') {
      c.st += dt;
      c.rot += Math.abs(s.yawStep);
      c.maxDist = Math.max(c.maxDist, s.me.distanceTo(c.from));
      // gevonden? (binnen zicht; 's nachts zie je zijn lamp het best met je eigen lamp uit)
      const to = this.tmp.copy(s.buddyP).sub(s.camPos);
      const d = to.length();
      const vis = this.ctx.night ? (s.lampOn ? 10 : 24) : 32;
      const seen = d < vis && to.normalize().dot(s.camFwd) > 0.9;
      if (c.phase === 'search' && c.st > 2 && seen) {
        c.found = c.st;
        c.phase = 'done';
        c.notes.push('Gevonden na ' + c.st.toFixed(0) + ' s');
        if (c.maxDist > 12) { c.ok = false; c.notes.push('Je zwom ' + c.maxDist.toFixed(0) + ' m weg tijdens het zoeken'); }
        this.finish('Daar is je buddy! Je zwaait' + (this.ctx.night ? ' met je lamp' : '') + ' en jullie zwemmen weer naar elkaar toe. Gevonden binnen een minuut: goed gedaan!');
        return;
      }
      if (this.ctx.night && !c.hint && c.st > 15) { c.hint = true; H.msg('Tip: scherm je eigen lamp even af (L) en kijk rond. In het donker zie je zijn lamp van ver.', 5000); }
      if (c.phase === 'search') {
        if (c.d0 - s.depth > 3 && c.st < 40 && !c.early) { c.early = true; c.ok = false; c.notes.push('Te snel opgegeven: eerst een minuut rondkijken'); }
        this.text('Oefening · buddy kwijt', '<div class="dr-q">Rondkijken: <b>' + fmt(Math.max(0, 60 - c.st)) + '</b> · rondje ' + Math.min(100, Math.round((c.rot / (Math.PI * 2)) * 100)) + '%</div>');
        if (c.st >= 60) { c.phase = 'ascend'; H.msg('Eén minuut voorbij. Stijg nu rustig op naar de oppervlakte' + (s.needStop && !s.stopDone ? ' (met veiligheidsstop)' : '') + ' en wacht daar op je buddy.', 6000); }
      } else {
        this.text('Oefening · buddy kwijt', '<div class="dr-q">Rustig opstijgen en boven op je buddy wachten · nu <b>' + s.depth.toFixed(1) + ' m</b></div>');
        if (c.st > 200 && !c.slow) { c.slow = true; c.ok = false; c.notes.push('Te lang onder water gebleven na het zoeken'); }
        if (s.depth < 0.9) {
          c.phase = 'surface';
          c.surfT = 0;
          const fast = s.fastCount - c.fast0;
          if (fast) { c.ok = false; c.notes.push(fast + '× te snel opgestegen'); }
          if (c.rot < Math.PI * 1.7) { c.ok = false; c.notes.push('Niet goed rondgekeken (kijk ook achter je)'); }
          else c.notes.push('Goed rondgekeken');
        }
      }
    } else if (c.phase === 'surface') {
      c.surfT += dt;
      if (c.surfT > 2.5) this.finish('Je buddy komt naast je boven. Herenigd aan de oppervlakte: precies volgens de afspraak! Jullie kunnen weer samen afdalen.');
    }
  }

  /* ---------------- noodopstijging ---------------- */
  up_cesa(dt, s, c) {
    const H = this.ctx.hud;
    if (c.phase === 'swim') {
      const rising = s.asc > 3;
      if (rising) {
        c.upT += dt;
        if (s.inp.exhale) { c.exT += dt; c.noExT = 0; } else { c.noExT += dt; if (c.noExT > 1.5) { c.noExT = -3; c.noEx++; H.msg('Blijf uitademen! Je longen zetten uit als je opstijgt.', 2500); } }
        if (s.inp.breath && !c.held) { c.held = true; c.ok = false; H.msg('Nooit je adem inhouden tijdens het opstijgen!', 4000); }
        if (s.asc > 18) { c.fastT = (c.fastT || 0) + dt; if (c.fastT > 0.8 && !c.fastOn) { c.fastOn = true; c.fast++; H.msg('Te snel! Maximaal 18 m/min, ook bij een noodopstijging.', 3000); } } else { c.fastT = 0; c.fastOn = false; }
      }
      this.text('Oefening · noodopstijging', '<div class="dr-q">Uitademen en rustig opzwemmen · <b>' + s.depth.toFixed(1) + ' m</b> · ' + Math.max(0, s.asc).toFixed(0) + ' m/min ' + (s.inp.exhale ? '💨' : '') + '</div>');
      if (s.depth < 0.9) {
        if (this.exh) this.exh.hidden = true;
        const frac = c.upT > 0 ? c.exT / c.upT : 0;
        c.notes.push(Math.round(frac * 100) + '% van de tijd uitgeademd');
        if (frac < 0.7) c.ok = false;
        if (c.held) c.notes.push('Adem ingehouden');
        if (c.fast) { c.ok = false; c.notes.push(c.fast + '× sneller dan 18 m/min'); }
        c.phase = 'inflate';
        c.inT = 0;
        H.msg('Aan de oppervlakte! Blaas je trimvest op (▲ of R) zodat je blijft drijven.', 6000);
        this.text('Oefening · noodopstijging', '<div class="dr-q">Blaas je trimvest op (▲ of R)</div>');
      }
    } else if (c.phase === 'inflate') {
      c.inT += dt;
      if (s.inp.bcdIn) { c.notes.push('Trimvest opgeblazen'); this.finish(c.ok ? 'Noodopstijging geslaagd: uitgeademd, rustig gestegen en boven drijfvermogen gemaakt.' : 'Noodopstijging klaar. Let op de punten in je logboek.'); }
      else if (c.inT > 12) { c.ok = false; c.notes.push('Trimvest niet opgeblazen'); this.finish('Vergeet niet: aan de oppervlakte meteen je trimvest opblazen.'); }
    }
  }

  up_signs() {}

  finish(msg) {
    const c = this.cur;
    if (!c) return;
    this.hide();
    if (this.exh) this.exh.hidden = true;
    this.ctx.hud.msg('🎓 ' + msg, 6000);
    if (this.ctx.onSound) this.ctx.onSound(c.ok ? 'done' : 'meh');
    this.done.push({ id: c.id, title: DRILL_NAMES[c.id], ok: !!c.ok, notes: c.notes.slice() });
    this.cur = null;
    this.wait = rand(60, 95);
  }

  results() {
    const out = this.done.slice();
    if (this.cur) out.push({ id: this.cur.id, title: DRILL_NAMES[this.cur.id], ok: false, notes: ['Niet afgemaakt'] });
    return out;
  }
}
