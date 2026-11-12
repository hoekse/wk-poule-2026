/* Diepblauw — schermen: titel, winkel van De Tuimelaar, wereldkaart, reis, HUD, logboek */
(function (DG) {
  'use strict';
  const U = DG.U, Art = DG.Art;
  const UI = (DG.UI = {});
  const $ = (id) => document.getElementById(id);
  const esc = U.esc;
  const TOUCH = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  UI.screen = null;
  UI.cat = 'overzicht';
  UI.sel = null;
  UI.turboHeld = false;

  /* ================================================================
   * Navigatie
   * ================================================================ */
  UI.go = function (name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === 'scr-' + name));
    $('topbar').hidden = !(name === 'shop' || name === 'map' || name === 'log');
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('on', b.dataset.go === name));
    document.body.classList.toggle('dive-on', name === 'dive');
    UI.screen = name;
    if (name === 'title') {
      if (DG.Dive.mode !== 'attract') DG.Dive.start('raja', 'attract');
      UI.renderTitle();
    } else if (name !== 'dive') {
      DG.Dive.stop();
    }
    const musicScreens = { title: 1, shop: 1, map: 1, log: 1 };
    if (DG.Audio.ctx) DG.Audio.music(!!musicScreens[name] && DG.Save.data.settings.music && DG.Save.data.settings.sound);
    if (name === 'shop') UI.renderShop();
    if (name === 'map') UI.renderMap();
    if (name === 'log') UI.renderLog('dives');
    UI.updateTop();
    if (name !== 'shop') UI.stopPreview();
  };

  UI.updateTop = function () {
    const sv = DG.Save.data;
    const b = $('budget');
    const txt = U.euro(sv.budget);
    if (b.textContent !== txt && b.textContent !== '€ 0') { const p = b.parentElement; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
    b.textContent = txt;
    $('brevet-pill').textContent = DG.Save.brevet() + ' · ' + DG.Save.maxDepth() + ' m';
    $('btn-sound').textContent = sv.settings.sound ? '🔊' : '🔇';
  };

  /* ================================================================
   * Meldingen
   * ================================================================ */
  UI.toast = function (html, kind, ms, node) {
    const box = $('toasts');
    const t = U.el('div', 'toast ' + (kind || ''));
    if (node) t.appendChild(node);
    const txt = U.el('div', '', html);
    t.appendChild(txt);
    box.appendChild(t);
    while (box.children.length > (UI.screen === 'dive' ? 3 : 4)) box.removeChild(box.firstChild);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms || 4200);
    return t;
  };
  function iconCanvas(spc, w, h, sil) {
    const c = document.createElement('canvas');
    const r = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * r; c.height = h * r;
    c.style.width = w + 'px'; c.style.height = h + 'px';
    Art.drawIcon(c, spc, sil);
    return c;
  }
  UI.iconCanvas = iconCanvas;
  UI.spotToast = function (spc, isNew, noPts) {
    const r = DG.RARITY[spc.r];
    const ic = iconCanvas(spc, 64, 44, false);
    const html = '<div class="t-title">' + (isNew ? 'Nieuwe soort ontdekt!' : 'Gespot') + '</div><div>' + esc(spc.name) + ' <span class="t-sub">· ' + r.name + '</span></div>';
    const t = UI.toast(html, isNew ? 'new' : '', isNew ? 4800 : 2600, ic);
    if (isNew && !noPts) { const p = U.el('div', 'pts', '+' + U.euro(r.pts)); t.appendChild(p); }
  };
  UI.photoToast = function (photo, spc) {
    const img = new Image(); img.src = photo.url; img.width = 64; img.height = 48;
    UI.toast('<div class="t-title">📸 ' + (spc ? esc(spc.name) : 'Sfeerfoto van het rif') + '</div><div class="stars">' + '★'.repeat(photo.stars) + '<span style="opacity:.3">' + '★'.repeat(3 - photo.stars) + '</span></div>', '', 2600, img);
  };
  let hintTimer = null;
  UI.hint = function (text) {
    const h = $('hint');
    h.textContent = '🔎 ' + text;
    h.hidden = false;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { h.hidden = true; }, 5500);
  };

  /* ================================================================
   * Modal
   * ================================================================ */
  UI.modal = function (html, cls) {
    const m = $('modal'), c = $('modal-card');
    c.className = 'modal-card ' + (cls || '');
    c.innerHTML = html;
    m.hidden = false;
    const f = c.querySelector('button.primary, button');
    if (f) setTimeout(() => f.focus({ preventScroll: true }), 50);
    return c;
  };
  UI.closeModal = function () { $('modal').hidden = true; UI.modalKind = null; };
  UI.confirm = function (title, text, okLabel, onOk) {
    const c = UI.modal('<h2>' + esc(title) + '</h2><p class="lead">' + text + '</p><div class="modal-actions"><button class="btn ghost" data-a="no">Annuleren</button><button class="btn primary" data-a="ok">' + esc(okLabel) + '</button></div>', 'narrow');
    c.querySelector('[data-a=no]').onclick = UI.closeModal;
    c.querySelector('[data-a=ok]').onclick = () => { UI.closeModal(); onOk(); };
  };

  /* ================================================================
   * Titel
   * ================================================================ */
  UI.renderTitle = function () {
    const has = DG.Save.hasData();
    $('btn-start').textContent = has ? 'Verder duiken' : 'Start je duikreis';
    $('btn-new').hidden = !has;
    $('title-sites').innerHTML = DG.SITES.map((s) => '<span>' + esc(s.name) + ' · ' + esc(s.area) + '</span>').join('');
  };

  /* ================================================================
   * Winkel
   * ================================================================ */
  const HOTSPOTS = [
    { cat: 'masker', x: 0.43, y: 0.27, label: 'Duikbrillen' },
    { cat: 'trimvest', x: 0.47, y: 0.33, label: 'Trimvesten' },
    { cat: 'automaat', x: 0.16, y: 0.36, label: 'Ademautomaten' },
    { cat: 'camera', x: 0.545, y: 0.42, label: 'Vitrine: camera’s' },
    { cat: 'computer', x: 0.66, y: 0.44, label: 'Duikcomputers' },
    { cat: 'lamp', x: 0.72, y: 0.27, label: 'Lampen & accessoires' },
    { cat: 'pak', x: 0.86, y: 0.56, label: 'Duikpakken' },
    { cat: 'fles', x: 0.27, y: 0.6, label: 'Flessen & vullen' },
    { cat: 'vinnen', x: 0.06, y: 0.5, label: 'Vinnen' },
  ];

  UI.renderShop = function () {
    const sv = DG.Save.data;
    if (!sv.introSeen) {
      sv.introSeen = true; DG.Save.save();
      UI.welcome();
    }
    // tabs
    const tabs = $('cat-tabs');
    tabs.innerHTML = '';
    const mk = (id, icon, name, extra) => {
      const b = U.el('button', 'chip' + (UI.cat === id ? ' on' : ''), '<span aria-hidden="true">' + icon + '</span>' + esc(name) + (extra || ''));
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', UI.cat === id ? 'true' : 'false');
      b.onclick = () => { UI.cat = id; DG.Audio.click(); UI.renderShop(); };
      tabs.appendChild(b);
    };
    mk('overzicht', '🏬', 'Rondkijken');
    DG.CATEGORIES.forEach((c) => {
      const eq = sv.equip[c.id];
      const extra = c.id === 'cursus' ? '' : eq ? ' <span class="ok" aria-label="gekozen">✓</span>' : c.required ? ' <span class="req" aria-label="verplicht">★</span>' : '';
      mk(c.id, c.icon, c.name, extra);
    });
    // hero
    const cat = DG.CATEGORIES.find((c) => c.id === UI.cat);
    const img = $('hero-img');
    const src = cat ? (cat.photo2 && Object.keys(sv.owned).length % 2 ? cat.photo2 : cat.photo) : 'img/winkel-overzicht.jpg';
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    img.alt = cat ? 'Foto uit de winkel: ' + cat.name : 'Overzicht van de winkel van Duikcentrum De Tuimelaar';
    img.style.animation = cat ? '' : 'none';
    $('hero-title').textContent = cat ? cat.name : 'Welkom in de winkel';
    $('hero-intro').textContent = cat ? cat.intro : 'Klik op een afdeling in de winkel, of kies hierboven. Alles met een ★ heb je nodig om te kunnen duiken.';
    const hs = $('hotspots');
    hs.innerHTML = '';
    if (!cat) {
      HOTSPOTS.forEach((h) => {
        const b = U.el('button', 'hotspot', '<i></i><span>' + esc(h.label) + '</span>');
        b.dataset.x = h.x; b.dataset.y = h.y;
        b.onclick = () => { UI.cat = h.cat; DG.Audio.click(); UI.renderShop(); };
        hs.appendChild(b);
      });
      const place = () => UI.placeHotspots();
      if (img.complete) place(); else img.onload = place;
    }
    UI.renderProducts();
    UI.renderKit();
    UI.startPreview();
    UI.updateTop();
  };

  UI.placeHotspots = function () {
    const img = $('hero-img'), box = $('shop-hero');
    if (!img.naturalWidth) return;
    const cw = box.clientWidth, ch = box.clientHeight;
    const sc = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    const ox = (cw - dw) / 2, oy = (ch - dh) / 2;
    $('hotspots').querySelectorAll('.hotspot').forEach((b) => {
      const x = ox + dw * +b.dataset.x, y = oy + dh * +b.dataset.y;
      b.style.left = x + 'px'; b.style.top = y + 'px';
      b.hidden = x < 10 || x > cw - 10 || y < 10 || y > ch - 10;
      const sp = b.querySelector('span');
      sp.style.order = x > cw * 0.7 ? -1 : 0;
    });
  };

  UI.renderProducts = function () {
    const sv = DG.Save.data;
    const box = $('products');
    box.innerHTML = '';
    if (UI.cat === 'overzicht') {
      DG.CATEGORIES.forEach((c) => {
        const eq = c.id === 'cursus' ? null : DG.Save.equipped(c.id);
        let status = eq ? esc(eq.name) : c.required ? '<b style="color:#c0392b">Nog kiezen</b>' : 'Optioneel';
        if (c.id === 'cursus') status = 'Jouw brevet: ' + esc(DG.Save.brevet());
        const card = U.el('div', 'product' + (eq ? ' equipped' : ''),
          '<span class="tag-hole"></span><h4>' + c.icon + ' ' + esc(c.name) + (c.required ? ' <span style="color:#c08a00">★</span>' : '') + '</h4><p>' + status + '</p><div class="foot"><span></span><button class="btn small">Bekijk</button></div>');
        card.querySelector('button').onclick = () => { UI.cat = c.id; UI.renderShop(); };
        box.appendChild(card);
      });
      return;
    }
    if (UI.cat === 'cursus') {
      DG.COURSES.forEach((k) => {
        const has = !!sv.courses[k.id];
        const lock = k.requires && !sv.courses[k.requires];
        const tags = [];
        if (k.maxDepth) tags.push('Tot ' + k.maxDepth + ' m');
        if (k.nitrox) tags.push('Nitrox EAN32');
        if (k.requires) tags.push('Vereist: ' + DG.courseById(k.requires).name);
        const card = U.el('div', 'product' + (has ? ' equipped' : ''),
          '<span class="tag-hole"></span><h4>🎓 ' + esc(k.name) + '</h4><p>' + esc(k.desc) + '</p><div class="stats">' + tags.map((t) => '<span>' + esc(t) + '</span>').join('') +
          '</div><div class="foot"><span class="price">' + U.euro(k.price) + '</span><button class="btn small"></button></div>');
        const b = card.querySelector('button');
        if (has) { b.textContent = '✓ Behaald'; b.className = 'btn small on'; b.disabled = true; }
        else if (lock) { b.textContent = 'Eerst ' + DG.courseById(k.requires).name.split(' ')[0]; b.disabled = true; }
        else if (sv.budget < k.price) { b.textContent = 'Te duur'; b.disabled = true; }
        else { b.textContent = 'Inschrijven'; b.onclick = () => UI.buyCourse(k); }
        box.appendChild(card);
      });
      return;
    }
    DG.GEAR.filter((g) => g.cat === UI.cat).forEach((g) => {
      const own = !!sv.owned[g.id], on = sv.equip[g.cat] === g.id;
      const card = U.el('div', 'product' + (on ? ' equipped' : ''),
        '<span class="tag-hole"></span><h4>' + esc(g.name) + '</h4><p>' + esc(g.desc) + '</p><div class="stats">' + statTags(g).map((t) => '<span>' + esc(t) + '</span>').join('') +
        '</div><div class="foot"><span class="price">' + (own ? '<small style="font-size:.8rem;color:#0c6d78">In bezit</small>' : U.euro(g.price)) + '</span><button class="btn small"></button></div>');
      const b = card.querySelector('button');
      const cat = DG.CATEGORIES.find((c) => c.id === g.cat);
      if (on) {
        if (!cat.required) { b.textContent = '✓ Mee · uitzetten'; b.className = 'btn small on'; b.onclick = () => { delete sv.equip[g.cat]; DG.Save.save(); UI.renderShop(); }; }
        else { b.textContent = '✓ In gebruik'; b.className = 'btn small on'; b.disabled = true; }
      } else if (own) {
        b.textContent = 'Gebruiken'; b.className = 'btn small owned';
        b.onclick = () => { sv.equip[g.cat] = g.id; DG.Save.save(); DG.Audio.click(); UI.renderShop(); };
      } else if (sv.budget < g.price) {
        b.textContent = 'Te duur'; b.disabled = true;
      } else {
        b.textContent = 'Kopen';
        b.onclick = () => UI.buy(g);
      }
      box.appendChild(card);
    });
  };

  function statTags(g) {
    const s = g.stats, out = [];
    if (s.zicht) out.push('Zicht ' + Math.round(s.zicht * 100) + '%');
    if (s.snelheid) out.push('Snelheid ' + Math.round(s.snelheid * 100) + '%');
    if (s.sac && s.sac !== 1) out.push('Luchtverbruik ' + Math.round(s.sac * 100) + '%');
    if (s.warmte) out.push('Warm vanaf ' + s.warmte + ' °C');
    if (s.koud) out.push('Koudwater');
    if (s.liter) out.push(s.liter * 200 + ' liter lucht');
    if (g.cat === 'computer') out.push(s.ai ? 'Luchttijd + kompas' : 'Nultijd + stop');
    if (s.bereik && g.cat === 'lamp') out.push('Bundel ' + s.bereik + ' m');
    if (g.cat === 'camera') out.push(s.flits ? 'Flitsers: ware kleuren' : 'Zonder flitser');
    return out;
  }

  UI.buy = function (g) {
    const sv = DG.Save.data;
    if (sv.budget < g.price) return;
    sv.budget -= g.price;
    sv.owned[g.id] = true;
    sv.equip[g.cat] = g.id;
    DG.Save.save();
    DG.Audio.kaching();
    UI.toast('Gekocht bij De Tuimelaar: <b>' + esc(g.name) + '</b>', 'good', 2600);
    UI.renderShop();
  };
  UI.buyCourse = function (k) {
    const sv = DG.Save.data;
    if (sv.budget < k.price) return;
    sv.budget -= k.price;
    sv.courses[k.id] = true;
    if (k.nitrox) sv.gas = 'ean32';
    DG.Save.save();
    DG.Audio.newSpecies();
    UI.toast('🎓 Gefeliciteerd! Je hebt <b>' + esc(k.name) + '</b> gehaald.' + (k.maxDepth ? ' Je mag nu tot ' + k.maxDepth + ' meter.' : ' Je kunt nu met nitrox duiken.'), 'good', 5000);
    UI.renderShop();
  };

  UI.renderKit = function () {
    const sv = DG.Save.data;
    const kit = $('kit');
    kit.innerHTML = '';
    DG.CATEGORIES.forEach((c) => {
      if (c.id === 'cursus') return;
      const it = DG.Save.equipped(c.id);
      const li = U.el('li', !it && c.required ? 'miss' : '', '<b>' + esc(c.name) + '</b><span>' + (it ? esc(it.name) : c.required ? 'nog kiezen ★' : '—') + '</span>');
      kit.appendChild(li);
    });
    const lo = DG.Save.loadout();
    const usable = lo.tankL * 150;
    const mins = Math.round(usable / (16 * lo.sac * 2.5));
    const missing = DG.Save.kitMissing();
    $('kit-stats').innerHTML =
      '<div><small>Lucht op 15 m</small><b>' + (sv.equip.fles ? '± ' + mins + ' min' : '—') + '</b></div>' +
      '<div><small>Warm tot</small><b>' + (sv.equip.pak ? lo.warmth + ' °C' : '—') + '</b></div>' +
      '<div><small>Max. diepte</small><b>' + lo.maxDepth + ' m</b></div>' +
      '<div><small>Snelheid</small><b>' + Math.round(lo.speed * 100) + '%</b></div>';
    const btn = $('btn-to-map');
    btn.textContent = missing.length ? 'Nog ' + missing.length + ' te kiezen' : 'Naar de wereldkaart ✈';
    btn.classList.toggle('primary', !missing.length);
    btn.classList.toggle('teal', !!missing.length);
  };

  // Geanimeerde duiker in de winkel
  let prevRaf = null;
  UI.startPreview = function () {
    if (prevRaf) return;
    const cv = $('diver-preview');
    const c = cv.getContext('2d');
    const r = Math.min(2, window.devicePixelRatio || 1);
    cv.width = 360 * r; cv.height = 200 * r;
    let t = 0, lastT = performance.now();
    const loop = (now) => {
      prevRaf = requestAnimationFrame(loop);
      t += (now - lastT) / 1000; lastT = now;
      if (cv.offsetParent === null) return;
      const lo = DG.Save.loadout();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, cv.width, cv.height);
      c.fillStyle = 'rgba(255,255,255,0.15)';
      for (let i = 0; i < 12; i++) {
        const y = (cv.height - ((t * 30 + i * 37) % (cv.height + 20))) ;
        c.beginPath(); c.arc((i * 61) % cv.width, y, 3 * r, 0, Math.PI * 2); c.fill();
      }
      c.setTransform(95 * r, 0, 0, 95 * r, 165 * r, (100 + Math.sin(t * 1.2) * 5) * r);
      c.rotate(Math.sin(t * 0.8) * 0.04);
      Art.drawDiver(c, lo.look, { kick: t * 3, lamp: !!lo.lamp });
    };
    prevRaf = requestAnimationFrame(loop);
  };
  UI.stopPreview = function () { if (prevRaf) cancelAnimationFrame(prevRaf); prevRaf = null; };

  UI.welcome = function () {
    const c = UI.modal(
      '<div class="welcome-photo"><img src="img/winkel-pui-en-bus.jpg" alt="De winkel van Duikcentrum De Tuimelaar in Zwolle met de Tuimelaar-bus ervoor"></div>' +
      '<h2>Welkom bij De Tuimelaar in Zwolle!</h2>' +
      '<p class="lead">Hier begint je duikreis. Je hebt <b>' + U.euro(DG.Save.data.budget) + '</b> duikbudget. Kies eerst je uitrusting: alles met een <b style="color:var(--sun)">★</b> heb je nodig. Een lamp en een camera zijn optioneel, maar wel heel handig.</p>' +
      '<p class="lead">Met elke duik verdien je budget bij: voor nieuwe ontdekkingen, mooie foto’s en veilig duiken. Daarmee kun je later betere spullen of een cursus kopen.</p>' +
      '<div class="modal-actions"><button class="btn primary big">Stap binnen</button></div>');
    c.querySelector('button').onclick = UI.closeModal;
  };
  UI.storefront = function () {
    const c = UI.modal('<div class="welcome-photo"><img src="img/winkel-pui-en-bus.jpg" alt="Winkelpui van Duikcentrum De Tuimelaar met de bus"></div><h2>Duikcentrum De Tuimelaar</h2><p class="lead">Duik- en snorkelwinkel, vulstation, servicecentrum en opleidingscentrum in Zwolle. Met de Tuimelaar-bus voor de deur.</p><div class="modal-actions"><button class="btn primary">Terug de winkel in</button></div>');
    c.querySelector('button').onclick = UI.closeModal;
  };

  /* ================================================================
   * Wereldkaart
   * ================================================================ */
  const proj = (lat, lon) => [((lon + 180) / 360) * 2000, ((90 - lat) / 180) * 1000];
  const LABEL = {
    saltpier: { dx: 18, dy: -14, a: 'start' }, raja: { dx: 16, dy: -18, a: 'start' }, tulamben: { dx: -16, dy: 34, a: 'end' },
    oosterschelde: { dx: -18, dy: 8, a: 'end', off: [-46, 34] }, elphinstone: { dx: 16, dy: 6, a: 'start' }, darwin: { dx: -16, dy: 30, a: 'end' },
  };
  let mapBuilt = false;
  UI.buildMap = function () {
    const svg = $('worldmap');
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
    const grat = el('g', { class: 'grat' });
    for (let lon = -180; lon <= 180; lon += 30) el('line', { x1: proj(0, lon)[0], y1: 0, x2: proj(0, lon)[0], y2: 1000 }, grat);
    for (let lat = -60; lat <= 90; lat += 30) el('line', { x1: 0, y1: proj(lat, 0)[1], x2: 2000, y2: proj(lat, 0)[1] }, grat);
    el('path', { d: DG.WORLD_LAND, class: 'land' });
    UI.routeEl = el('path', { class: 'route', d: '' });
    const [hx, hy] = proj(DG.HOME.lat, DG.HOME.lon);
    const home = el('g', { class: 'pin home', tabindex: '0', role: 'button', 'aria-label': 'De Tuimelaar in Zwolle: naar de winkel' });
    el('circle', { cx: hx, cy: hy, r: 11, class: 'dot' }, home);
    const ht = el('text', { x: hx + 16, y: hy - 16 }, home); ht.textContent = 'De Tuimelaar';
    const hs = el('text', { x: hx + 16, y: hy + 2, class: 'sub' }, home); hs.textContent = 'Zwolle · winkel';
    home.addEventListener('click', () => UI.go('shop'));
    home.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') UI.go('shop'); });
    UI.pins = {};
    DG.SITES.forEach((s) => {
      let [x, y] = proj(s.lat, s.lon);
      const L = LABEL[s.id] || { dx: 16, dy: 6, a: 'start' };
      const g = el('g', { class: 'pin', tabindex: '0', role: 'button', 'aria-label': s.name + ', ' + s.area });
      if (L.off) {
        el('line', { x1: x, y1: y, x2: x + L.off[0], y2: y + L.off[1], stroke: 'rgba(255,255,255,0.7)', 'stroke-width': 2 }, g);
        el('circle', { cx: x, cy: y, r: 3, fill: '#fff' }, g);
        x += L.off[0]; y += L.off[1];
      }
      el('circle', { cx: x, cy: y, r: 10, class: 'ring' }, g);
      el('circle', { cx: x, cy: y, r: 10, class: 'dot' }, g);
      const t = el('text', { x: x + L.dx, y: y + L.dy, 'text-anchor': L.a }, g); t.textContent = s.name;
      const t2 = el('text', { x: x + L.dx, y: y + L.dy + 19, 'text-anchor': L.a, class: 'sub' }, g); t2.textContent = s.area;
      g.addEventListener('click', () => UI.selectSite(s.id));
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); UI.selectSite(s.id); } });
      UI.pins[s.id] = { g, x, y };
    });
    const list = $('site-list');
    DG.SITES.forEach((s) => {
      const b = U.el('button', 'chip', esc(s.name) + ' <span style="opacity:.7">· ' + esc(s.area) + '</span>');
      b.onclick = () => UI.selectSite(s.id);
      list.appendChild(b);
    });
    mapBuilt = true;
  };

  UI.renderMap = function () {
    if (!mapBuilt) UI.buildMap();
    const sv = DG.Save.data;
    DG.SITES.forEach((s) => {
      const dived = sv.dives.some((d) => d.site === s.id);
      UI.pins[s.id].g.classList.toggle('done', dived);
    });
    if (UI.sel) UI.selectSite(UI.sel, true); else { $('site-card').hidden = true; $('scr-map').classList.remove('card-open'); $('map-hint').hidden = false; UI.routeEl.setAttribute('d', ''); }
    if (DG.Save.kitMissing().length) UI.toast('Je uitrusting is nog niet compleet. Ga eerst langs bij De Tuimelaar.', 'warn', 3500);
  };

  UI.selectSite = function (id, quiet) {
    UI.sel = id;
    const s = DG.siteById(id), sv = DG.Save.data, lo = DG.Save.loadout();
    Object.keys(UI.pins).forEach((k) => UI.pins[k].g.classList.toggle('sel', k === id));
    const [hx, hy] = proj(DG.HOME.lat, DG.HOME.lon);
    const p = UI.pins[id];
    const mx = (hx + p.x) / 2, my = Math.min(hy, p.y) - Math.abs(p.x - hx) * 0.25 - 30;
    UI.routeEl.setAttribute('d', 'M' + hx + ' ' + hy + ' Q' + mx + ' ' + my + ' ' + p.x + ' ' + p.y);
    $('map-hint').hidden = true;
    if (!quiet) DG.Audio.click();
    const card = $('site-card');
    card.hidden = false;
    $('scr-map').classList.add('card-open');
    const spList = DG.siteSpecies(s);
    const found = spList.filter((k) => sv.species[k]).length;
    const dives = sv.dives.filter((d) => d.site === id).length;
    const cur = s.current < 0.02 ? 'Geen' : s.current < 0.1 ? 'Licht' : s.current < 0.25 ? 'Matig' : 'Sterk';
    const missing = DG.Save.kitMissing();
    const adv = UI.advice(s, lo, missing);
    const bus = s.travel.mode === 'bus';
    card.innerHTML =
      '<div class="sc-top"><button class="icon-btn sc-close" aria-label="Sluiten">✕</button><h3>' + esc(s.name) + '</h3><div class="where">' + esc(s.area) + ' · ' + esc(s.country) + '</div>' +
      '<div class="sc-icons" id="sc-icons"></div></div>' +
      '<div class="sc-body"><p>' + esc(s.desc) + '</p>' +
      '<div class="facts">' +
      '<div><small>Watertemperatuur</small><b>' + s.temp + ' °C</b></div>' +
      '<div><small>Zicht</small><b>' + s.vis + ' m</b></div>' +
      '<div><small>Diepte tot</small><b>' + s.depth + ' m</b></div>' +
      '<div><small>Stroming</small><b>' + cur + '</b></div>' +
      '<div><small>Niveau</small><b>' + esc(s.level) + '</b></div>' +
      '<div><small>Type</small><b>' + esc(s.entry) + '</b></div>' +
      '</div>' +
      '<p style="font-size:.88rem;color:var(--muted)">' + (bus ? '🚐 ' : '✈️ ') + esc(s.travel.time) + (dives ? ' · je dook hier ' + dives + '×' : '') + '</p>' +
      '<ul class="advice">' + adv.map((a) => '<li class="' + a[0] + '">' + a[1] + '</li>').join('') + '</ul>' +
      '<div class="progress"><b>Soorten ontdekt: ' + found + ' / ' + spList.length + '</b><div class="bar"><i style="width:' + (found / spList.length) * 100 + '%"></i></div><div class="mini-grid" id="mini-grid"></div></div>' +
      (DG.Save.hasNitrox() ? '<div class="gas-row">Gas: <span class="seg"><button data-gas="air" class="' + (sv.gas !== 'ean32' ? 'on' : '') + '">Lucht</button><button data-gas="ean32" class="' + (sv.gas === 'ean32' ? 'on' : '') + '">Nitrox 32%</button></span></div>' : '') +
      (missing.length ? '<button class="btn teal wide" id="btn-go">Eerst naar De Tuimelaar</button>' : '<button class="btn primary wide big" id="btn-go">' + (sv.location === s.area ? '🤿 Naar de duikstek' + (s.three ? ' (3D)' : '') : bus ? '🚐 Rijd naar Zeeland en duik' : '✈ Vlieg naar ' + esc(s.area) + ' en duik' + (s.three ? ' (3D)' : '')) + '</button>') +
      '</div>';
    card.querySelector('.sc-close').onclick = () => { card.hidden = true; $('scr-map').classList.remove('card-open'); UI.sel = null; UI.routeEl.setAttribute('d', ''); $('map-hint').hidden = false; Object.values(UI.pins).forEach((q) => q.g.classList.remove('sel')); };
    const icons = $('sc-icons');
    s.highlights.forEach((k) => { const c = iconCanvas(DG.SPECIES[k], 78, 54, false); c.title = DG.SPECIES[k].name; icons.appendChild(c); });
    const mg = $('mini-grid');
    spList.forEach((k) => { const known = !!sv.species[k]; const c = iconCanvas(DG.SPECIES[k], 44, 32, !known); c.title = known ? DG.SPECIES[k].name : 'Nog niet ontdekt'; mg.appendChild(c); });
    card.querySelectorAll('[data-gas]').forEach((b) => { b.onclick = () => { sv.gas = b.dataset.gas; DG.Save.save(); UI.selectSite(id, true); }; });
    $('btn-go').onclick = () => { if (missing.length) { UI.cat = missing[0].id; UI.go('shop'); } else UI.travel(s); };
    card.scrollTop = 0;
  };

  UI.advice = function (s, lo, missing) {
    const out = [];
    const sv = DG.Save.data;
    if (missing.length) out.push(['bad', 'Je mist nog: ' + missing.map((c) => c.name.toLowerCase()).join(', ') + '.']);
    if (sv.equip.pak) {
      if (lo.warmth > s.temp + 1) {
        const better = DG.GEAR.filter((g) => g.cat === 'pak' && g.stats.warmte <= s.temp + 1).sort((a, b) => b.stats.warmte - a.stats.warmte)[0];
        out.push(['bad', 'Je pak is te koud voor water van ' + s.temp + ' °C. Je verbruikt meer lucht en moet eerder naar boven.' + (better ? ' Tip: ' + better.name.toLowerCase() + '.' : '')]);
      } else if (lo.warmth < s.temp - 15) out.push(['tip', 'Een droogpak in ' + s.temp + ' °C water? Je gaat het warm krijgen…']);
    }
    if (sv.equip.automaat && s.temp < 15 && !lo.coldReg) out.push(['tip', 'Koud water: een standaard ademautomaat kan gaan freeflowen.']);
    if (s.depth > lo.maxDepth) out.push(['tip', 'Met je brevet mag je tot ' + lo.maxDepth + ' m; hier gaat het tot ' + s.depth + ' m. Sommige dieren leven dieper.']);
    if (s.current >= 0.15 && lo.speed < 1.15) out.push(['tip', 'Stevige stroming: met jet fins zwem je er makkelijker tegenin.']);
    const hid = DG.siteSpecies(s).filter((k) => DG.SPECIES[k].hidden).map((k) => DG.SPECIES[k].name.toLowerCase());
    if (hid.length && !lo.lamp) out.push(['tip', 'Hier verstoppen zich onder meer ' + hid.slice(0, 2).join(' en ') + '. Met een lamp vind je ze makkelijker.']);
    if (s.vis < 8 && !lo.lamp) out.push(['tip', 'Beperkt zicht en groen water: een lamp brengt de kleuren terug.']);
    if (!lo.camera) out.push(['tip', 'Neem een camera mee voor je fotoalbum (en extra beloning).']);
    if (!missing.length && !out.some((a) => a[0] === 'bad')) out.unshift(['good', 'Je uitrusting past bij deze duik. Veel plezier!']);
    return out;
  };

  /* ================================================================
   * Reis: met de Tuimelaar-bus en het vliegtuig
   * ================================================================ */
  let travelRaf = null, landPath = null;
  UI.travel = function (site, force) {
    const sv0 = DG.Save.data;
    if (!force && sv0.location === site.area) {
      UI.toast('Je bent al op ' + esc(site.area) + '. Je rijdt zo naar de duikstek.', 'info', 3000);
      return UI.startDive(site);
    }
    if (!force && site.travel.mode === 'vlieg' && sv0.noFlyUntil && sv0.noFlyUntil > UI.gameNow()) {
      const h = Math.ceil((sv0.noFlyUntil - UI.gameNow()) / 3600e3);
      const c = UI.modal('<h2>Vliegverbod</h2><p class="lead">Je hebt kort geleden gedoken. Volgens de richtlijnen van DAN mag je nog ' + h + ' uur niet vliegen, omdat er nog stikstof uit je lichaam moet. Je duikcomputer toont dit ook.</p><div class="modal-actions"><button class="btn ghost" data-a="no">Terug</button><button class="btn primary" data-a="wait">Wacht ' + h + ' uur en vlieg</button></div>', 'narrow');
      c.querySelector('[data-a=no]').onclick = UI.closeModal;
      c.querySelector('[data-a=wait]').onclick = () => { sv0.clockOffset = (sv0.clockOffset || 0) + (sv0.noFlyUntil - UI.gameNow()) + 60e3; DG.Save.save(); UI.closeModal(); UI.travel(site, true); };
      return;
    }
    sv0.location = site.area;
    DG.Save.save();
    UI.go('travel');
    DG.Audio.unlock();
    const cv = $('travel-canvas');
    const r = Math.min(2, window.devicePixelRatio || 1);
    const fit = () => { cv.width = innerWidth * r; cv.height = innerHeight * r; };
    fit();
    const bus = site.travel.mode === 'bus';
    const tBus = bus ? 4.2 : 2.8, tFly = bus ? 0 : 3.6;
    const total = tBus + tFly;
    let t = 0, last = performance.now(), done = false;
    if (!landPath) landPath = new Path2D(DG.WORLD_LAND);
    DG.Audio.engine(tBus);
    if (!bus) setTimeout(() => { if (!done) DG.Audio.plane(tFly); }, tBus * 1000);
    const txt = $('travel-text');
    const finish = () => {
      if (done) return; done = true;
      cancelAnimationFrame(travelRaf);
      window.removeEventListener('resize', fit);
      UI.startDive(site);
    };
    $('btn-skip').onclick = finish;
    window.addEventListener('resize', fit);
    const loop = (now) => {
      travelRaf = requestAnimationFrame(loop);
      t += Math.min(0.05, (now - last) / 1000); last = now;
      const c = cv.getContext('2d');
      const W = cv.width, H = cv.height;
      if (t < tBus) {
        txt.textContent = bus ? 'Met de Tuimelaar-bus naar de Oosterschelde…' : 'Met de Tuimelaar-bus naar Schiphol…';
        drawRoad(c, W, H, t, bus ? 'Zeeland' : 'Schiphol', r);
      } else if (t < total) {
        txt.textContent = 'Vliegen naar ' + site.area + '…';
        drawFlight(c, W, H, (t - tBus) / tFly, site);
      } else {
        finish();
      }
    };
    travelRaf = requestAnimationFrame(loop);
  };

  function drawRoad(c, W, H, t, dest, r) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H * 0.62);
    g.addColorStop(0, '#5aaee6'); g.addColorStop(1, '#cfeaff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const speed = 260 * r;
    // wolken
    c.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 420 * r - t * speed * 0.08) % (W + 300 * r) + W + 300 * r) % (W + 300 * r) - 150 * r;
      const y = H * (0.12 + (i % 3) * 0.08);
      c.beginPath(); c.ellipse(x, y, 90 * r, 22 * r, 0, 0, Math.PI * 2); c.ellipse(x + 50 * r, y - 14 * r, 60 * r, 24 * r, 0, 0, Math.PI * 2); c.fill();
    }
    const hor = H * 0.6;
    // polder in de verte met molens
    c.fillStyle = '#7fb069'; c.fillRect(0, hor - 6 * r, W, H);
    for (let i = 0; i < 7; i++) {
      const x = ((i * 300 * r - t * speed * 0.18) % (W + 300 * r) + W + 300 * r) % (W + 300 * r) - 100 * r;
      c.fillStyle = '#5a5048';
      c.beginPath(); c.moveTo(x - 10 * r, hor); c.lineTo(x - 6 * r, hor - 46 * r); c.lineTo(x + 6 * r, hor - 46 * r); c.lineTo(x + 10 * r, hor); c.fill();
      c.strokeStyle = '#f2f2ee'; c.lineWidth = 4 * r;
      const a = t * 1.5 + i;
      for (let k = 0; k < 4; k++) { const b = a + k * Math.PI / 2; c.beginPath(); c.moveTo(x, hor - 44 * r); c.lineTo(x + Math.cos(b) * 34 * r, hor - 44 * r + Math.sin(b) * 34 * r); c.stroke(); }
    }
    // bomen
    for (let i = 0; i < 14; i++) {
      const x = ((i * 170 * r - t * speed * 0.45) % (W + 200 * r) + W + 200 * r) % (W + 200 * r) - 80 * r;
      c.fillStyle = '#6a4a30'; c.fillRect(x - 3 * r, hor - 14 * r, 6 * r, 24 * r);
      c.fillStyle = i % 2 ? '#3f7a3a' : '#4d8a42';
      c.beginPath(); c.arc(x, hor - 30 * r, 22 * r, 0, Math.PI * 2); c.fill();
    }
    // weg
    const ry = H * 0.72;
    c.fillStyle = '#4a4d52'; c.fillRect(0, ry, W, H * 0.16);
    c.fillStyle = '#f2f2f2';
    for (let x = -((t * speed) % (120 * r)); x < W; x += 120 * r) c.fillRect(x, ry + H * 0.075, 60 * r, 5 * r);
    c.fillStyle = '#6f9f58'; c.fillRect(0, ry + H * 0.16, W, H);
    // bord
    const sx = W - ((t * speed * 0.9) % (W * 1.6));
    c.fillStyle = '#888'; c.fillRect(sx, ry - 120 * r, 8 * r, 120 * r);
    c.fillStyle = '#1d4fa8'; c.fillRect(sx - 90 * r, ry - 170 * r, 190 * r, 60 * r);
    c.strokeStyle = '#fff'; c.lineWidth = 3 * r; c.strokeRect(sx - 86 * r, ry - 166 * r, 182 * r, 52 * r);
    c.fillStyle = '#fff'; c.font = '700 ' + 26 * r + 'px Nunito Sans, Arial'; c.textAlign = 'center';
    c.fillText(dest + ' →', sx + 5 * r, ry - 131 * r);
    // de bus
    const bs = Math.min(W * 0.42, 520 * r);
    c.save();
    c.translate(W * 0.42, ry + H * 0.11 + Math.sin(t * 18) * 1.2 * r);
    c.scale(bs, bs);
    Art.drawBus(c, { wheel: t * 14 });
    c.restore();
  }

  function drawFlight(c, W, H, p, site) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H));
    g.addColorStop(0, '#0f5d90'); g.addColorStop(1, '#04213a');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const [hx, hy] = proj(DG.HOME.lat, DG.HOME.lon), [sx, sy] = proj(site.lat, site.lon);
    const minX = Math.min(hx, sx) - 260, maxX = Math.max(hx, sx) + 260;
    const minY = Math.min(hy, sy) - 200, maxY = Math.max(hy, sy) + 160;
    const sc = Math.min(W / (maxX - minX), H / (maxY - minY));
    const ox = W / 2 - ((minX + maxX) / 2) * sc, oy = H / 2 - ((minY + maxY) / 2) * sc;
    c.setTransform(sc, 0, 0, sc, ox, oy);
    c.fillStyle = '#d8c79c'; c.strokeStyle = '#b9a678'; c.lineWidth = 1 / sc;
    c.fill(landPath); c.stroke(landPath);
    const mx = (hx + sx) / 2, my = Math.min(hy, sy) - Math.abs(sx - hx) * 0.25 - 30;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const bez = (u) => [(1 - u) * (1 - u) * hx + 2 * (1 - u) * u * mx + u * u * sx, (1 - u) * (1 - u) * hy + 2 * (1 - u) * u * my + u * u * sy];
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3 / sc; c.setLineDash([8 / sc, 8 / sc]);
    c.beginPath(); c.moveTo(hx, hy);
    for (let u = 0; u <= e; u += 0.01) { const q = bez(u); c.lineTo(q[0], q[1]); }
    c.stroke(); c.setLineDash([]);
    [[hx, hy, '#fff'], [sx, sy, '#ff7a59']].forEach(([x, y, col]) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, 9 / sc * 1.2, 0, Math.PI * 2); c.fill(); });
    const q = bez(e), q2 = bez(Math.min(1, e + 0.01));
    const ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]);
    c.save(); c.translate(q[0], q[1]); c.rotate(ang); c.scale(1 / sc * 1.4, 1 / sc * 1.4);
    c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(24, 0); c.lineTo(-18, -4); c.lineTo(-22, 0); c.lineTo(-18, 4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(4, 0); c.lineTo(-8, -20); c.lineTo(-13, -20); c.lineTo(-5, 0); c.lineTo(-13, 20); c.lineTo(-8, 20); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-14, 0); c.lineTo(-20, -9); c.lineTo(-23, -9); c.lineTo(-19, 0); c.lineTo(-23, 9); c.lineTo(-20, 9); c.closePath(); c.fill();
    c.restore();
  }

  /* ================================================================
   * Duiken
   * ================================================================ */
  UI.gameNow = () => Date.now() + (DG.Save.data.clockOffset || 0);

  UI.startDive3D = function (site) {
    UI.go('dive');
    $('hud').hidden = true;
    DG.Dive.stop();
    DG.Audio.unlock();
    DG.Audio.music(false);
    DG.Save.data.location = site.area;
    DG.Save.save();
    import(new URL('js3d/main.js', document.baseURI).href)
      .then((m) => m.runZoutpier(site))
      .then((res) => { if (res) UI.showSummary(res); else UI.leaveDive('map'); })
      .catch((e) => {
        if (window.console) console.error(e);
        UI.toast('De 3D-duik kon niet starten (' + esc(e && e.message ? e.message : String(e)) + '). Probeer een recente browser zoals Chrome of Safari.', 'danger', 9000);
        UI.leaveDive('map');
      });
  };

  UI.startDive = function (site) {
    if (site.three) return UI.startDive3D(site);
    UI.go('dive');
    $('hud').hidden = false;
    $('hud').classList.toggle('touch', TOUCH);
    $('keys-help').classList.remove('fade');
    $('hint').hidden = true;
    $('warn').hidden = true;
    $('btn-end').hidden = true;
    DG.Dive.start(site.id, 'dive');
    UI.hud(DG.Dive);
    const lo = DG.Dive.lo;
    UI.modalKind = 'brief';
    const c = UI.modal(
      '<h2>Duikbriefing · ' + esc(site.name) + '</h2>' +
      '<p class="lead">' + esc(site.area) + ', ' + esc(site.country) + '. Je buddy duikt met je mee. Daal af, verken het rif en kom met minstens 50 bar weer boven.</p>' +
      '<div class="brief-grid">' +
      '<div><small>Water</small>' + site.temp + ' °C · zicht ' + site.vis + ' m</div>' +
      '<div><small>Jouw max. diepte</small>' + Math.min(lo.maxDepth, lo.gas === 'ean32' ? 34 : 99) + ' m</div>' +
      '<div><small>Fles</small>' + lo.tankL + ' L · 200 bar · ' + (lo.gas === 'ean32' ? 'nitrox 32%' : 'lucht') + '</div>' +
      '<div><small>Veiligheidsstop</small>3 min op 3–6 m</div>' +
      '</div>' +
      '<ul class="sum-checks">' +
      '<li>🧭 ' + (TOUCH ? 'Sleep met je duim over het scherm om te zwemmen. Knoppen rechtsonder: foto, lamp, sneller.' : 'Zwem met de pijltjes of WASD, Shift = sneller, Spatie = foto, L = lamp.') + '</li>' +
      '<li>🐢 Kom dichtbij om dieren te spotten. Verstopte dieren zie je alleen van heel dichtbij of met een lamp.</li>' +
      '<li>⬆️ Stijg rustig op (max. 10 m/min) en maak een veiligheidsstop als je dieper dan 10 m bent geweest.</li>' +
      '<li>⏱️ Eén seconde in het spel is ' + DG.TIME_SCALE + ' seconden duiktijd.</li>' +
      '</ul>' +
      '<div class="modal-actions"><button class="btn ghost" data-a="back">Terug naar de kaart</button><button class="btn primary big" data-a="go">Te water! 🤿</button></div>');
    c.querySelector('[data-a=go]').onclick = () => {
      UI.closeModal();
      DG.Dive.begin();
      setTimeout(() => $('keys-help').classList.add('fade'), 14000);
    };
    c.querySelector('[data-a=back]').onclick = () => { UI.closeModal(); UI.leaveDive('map'); };
  };

  UI.leaveDive = function (to) {
    DG.Dive.stop();
    $('hud').hidden = true;
    UI.go(to || 'map');
  };

  UI.togglePause = function () {
    if (UI.modalKind === 'pause') { UI.closeModal(); DG.Dive.paused = false; return; }
    if (UI.modalKind) return;
    DG.Dive.paused = true;
    UI.modalKind = 'pause';
    const sv = DG.Save.data;
    const c = UI.modal('<h2>Pauze</h2><p class="lead">Je hangt even stil in het water. Neem de tijd.</p>' +
      '<div class="modal-actions"><button class="btn ghost" data-a="snd">' + (sv.settings.sound ? '🔊 Geluid uit' : '🔇 Geluid aan') + '</button><button class="btn ghost" data-a="abort">Duik afbreken</button><button class="btn primary" data-a="go">Verder duiken</button></div>', 'narrow');
    c.querySelector('[data-a=go]').onclick = () => { UI.closeModal(); DG.Dive.paused = false; };
    c.querySelector('[data-a=snd]').onclick = () => { UI.toggleSound(); UI.modalKind = null; UI.togglePause(); };
    c.querySelector('[data-a=abort]').onclick = () => {
      UI.modalKind = null;
      UI.confirm('Duik afbreken?', 'Je gaat terug naar de wereldkaart. Deze duik wordt niet in je logboek gezet.', 'Afbreken', () => { DG.Dive.paused = false; UI.leaveDive('map'); });
    };
  };

  UI.hud = function (D) {
    if (!D.dv) return;
    const dv = D.dv, lo = D.lo;
    const depth = D.depth || 0;
    $('dc-depth').textContent = depth.toFixed(1);
    $('dc-time').textContent = U.mmss(D.gt);
    $('dc-max').textContent = dv.maxD.toFixed(1);
    $('dc-temp').textContent = Math.round(D.temp != null ? D.temp : D.site.temp) + '°';
    $('dc-gas').textContent = lo.gas === 'ean32' ? 'EAN32' : 'LUCHT';
    const ead = lo.gas === 'ean32' ? Math.max(0, (depth + 10) * (0.68 / 0.79) - 10) : depth;
    const ndl = DG.Dive.ndlAt(ead);
    const rem = dv.deco ? 0 : ndl >= 999 ? 99 : Math.max(0, Math.round((1 - dv.n2) * ndl));
    const ndlCell = $('dc-ndl').parentElement;
    $('dc-ndl').textContent = dv.deco ? 'DECO' : rem >= 99 ? '>99' : rem + '′';
    ndlCell.classList.toggle('alert', dv.deco || rem < 5);
    const asc = Math.max(0, dv.ascRate);
    const ai = $('dc-asc');
    ai.style.height = U.clamp((asc / 15) * 100, 0, 100) + '%';
    ai.classList.toggle('fast', asc > 10.5);
    const stop = $('dc-stop');
    if (dv.deco) { stop.hidden = false; stop.className = 'dc-stop deco'; stop.textContent = 'DECO-STOP 3–6 m'; }
    else if (dv.needStop && !dv.safetyDone && depth < 7.5) { stop.hidden = false; stop.className = 'dc-stop'; stop.textContent = (depth >= 2.5 && depth <= 6.5 ? 'VEILIGHEIDSSTOP ' : 'STOP OP 5 m · ') + U.mmss(180 - dv.safety); }
    else stop.hidden = true;
    const bar = D.bar != null ? D.bar : 200;
    $('g-bar').textContent = Math.round(bar);
    $('g-needle').style.transform = 'rotate(' + (-135 + (bar / 300) * 270) + 'deg)';
    const rmt = $('g-rmt');
    if (lo.ai) {
      const amb = 1 + depth / 10;
      const m = Math.max(0, ((dv.air - 50 * lo.tankL) / (16 * lo.sac * amb)));
      rmt.hidden = false; rmt.textContent = 'Luchttijd ' + Math.floor(m) + '′';
      const cmp = $('compass');
      cmp.hidden = false;
      const ex = D.site.scenery.boatX != null ? D.site.scenery.boatX : D.xmin + 2;
      const a = Math.atan2(0.4 - D.diver.y, ex - D.diver.x);
      $('compass-arrow').style.transform = 'rotate(' + a + 'rad)';
      $('compass-txt').textContent = D.site.scenery.boatX != null ? 'boot' : 'kant';
    } else { rmt.hidden = true; $('compass').hidden = true; }
    $('cold-fill').style.width = 100 - dv.cold + '%';
    $('spot-count').textContent = Object.keys(dv.spotted).length;
    $('photo-count').textContent = dv.photos.length;
    const warn = $('warn');
    let w = '';
    if (dv.ooa) w = 'LUCHT OP · SAMEN OPSTIJGEN';
    else if (dv.deco) w = 'DECOMPRESSIEPLICHT';
    else if (asc > 10.5 && depth > 1) w = '▲ TE SNEL OMHOOG';
    else if (bar < 50) w = 'RESERVE · STIJG OP';
    else if (dv.cold >= 100) w = 'TE KOUD · BEËINDIG DE DUIK';
    warn.hidden = !w; warn.textContent = w;
    $('btn-end').hidden = !D.canEnd;
  };
  UI.hudLamp = function (on) { $('t-lamp').classList.toggle('on', on); };
  UI.stick = function (show, ox, oy, dx, dy) {
    const s = $('stick');
    if (!TOUCH || !show) { s.hidden = true; return; }
    s.hidden = false;
    s.style.left = ox + 'px'; s.style.top = oy + 'px';
    $('stick-knob').style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  };

  /* ================================================================
   * Samenvatting na de duik
   * ================================================================ */
  UI.showSummary = function (res) {
    const s = DG.siteById(res.site);
    UI.modalKind = 'summary';
    const checks = [];
    checks.push([res.needStop ? (res.safetyDone ? '✅' : '⚠️') : '✅', res.needStop ? (res.safetyDone ? 'Veiligheidsstop gemaakt' : 'Veiligheidsstop overgeslagen') : 'Ondiepe duik, geen stop nodig']);
    checks.push([res.ascentWarnings ? '⚠️' : '✅', res.ascentWarnings ? res.ascentWarnings + '× te snel opgestegen' : 'Rustig opgestegen']);
    checks.push([res.ooa ? '❌' : res.bar >= 50 ? '✅' : '⚠️', res.ooa ? 'Lucht op: je buddy hielp je naar boven' : 'Boven met ' + res.bar + ' bar']);
    if (res.decoViolation) checks.push(['❌', 'Decompressieplicht genegeerd']);
    if (res.cold > 60) checks.push(['🥶', 'Je had het koud (' + res.cold + '%). Een dikker pak helpt.']);
    let rightCol = '<h3>Verdiend</h3><ul class="sum-lines">' + res.lines.map((l) => '<li><span>' + esc(l[0]) + '</span><b>+' + U.euro(l[1]) + '</b></li>').join('') + '</ul>';
    let earnTxt = '+' + U.euro(res.earned);
    if (res.three) {
      const R = res.rules || {};
      const nf = DG.Save.data.noFlyUntil ? Math.ceil((DG.Save.data.noFlyUntil - UI.gameNow()) / 3600e3) : 0;
      rightCol = '<h3>Regels &amp; buddy</h3><ul class="sum-checks">' +
        '<li>' + (R.touches ? '⚠️ ' + R.touches + '× een pijler geraakt' : '✅ Niets aangeraakt') + '</li>' +
        (R.reef ? '<li>⚠️ ' + R.reef + '× het rif geraakt</li>' : '') +
        '<li>' + (R.missed ? '⚠️ ' + R.missed + '× niet gereageerd op je buddy' : '✅ Goed contact met je buddy') + '</li>' +
        (R.limit ? '<li>⚠️ Dieper geweest dan je brevet toestaat</li>' : '') +
        (R.deco ? '<li>' + (R.ceil ? '❌ Decoplafond overschreden' : '⚠️ Decostop nodig geweest') + '</li>' : '<li>✅ Binnen de nultijd gebleven</li>') +
        '<li>✈️ Vliegverbod: ' + nf + ' uur</li></ul>';
      earnTxt = res.newSpecies.length ? '+' + res.newSpecies.length + ' nieuwe soorten' : 'Duik #' + DG.Save.data.dives.length;
    }
    const c = UI.modal(
      '<div class="sum-head"><div><h2>Duik gelogd · ' + esc(s.name) + '</h2><p class="lead" style="margin:0">' + esc(s.area) + ' · ' + Math.round(res.minutes) + ' min · max ' + res.maxD.toFixed(1) + ' m · gem. ' + res.avgD.toFixed(1) + ' m · ' + res.temp + ' °C</p></div>' +
      '<div class="sum-earn">' + earnTxt + '</div></div>' +
      '<canvas class="profile" id="sum-profile"></canvas>' +
      '<div class="sum-cols"><div><h3>Duikveiligheid</h3><ul class="sum-checks">' + checks.map((k) => '<li>' + k[0] + ' ' + esc(k[1]) + '</li>').join('') + '</ul></div>' +
      '<div>' + rightCol + '</div></div>' +
      '<h3>Gespot (' + res.species.length + ')</h3><div class="species-row" id="sum-species">' + (res.species.length ? '' : '<span class="t-sub">Nog niets gespot. Zwem eens wat dichter naar de dieren toe!</span>') + '</div>' +
      (res.photos.length ? '<h3>Foto’s (' + res.photos.length + ')</h3><div class="photo-row" id="sum-photos"></div>' : '') +
      '<div class="modal-actions"><button class="btn ghost" data-a="shop">Naar De Tuimelaar</button><button class="btn ghost" data-a="again">Nog een duik hier</button><button class="btn primary" data-a="map">Naar de wereldkaart</button></div>');
    UI.drawProfile($('sum-profile'), res.profile, true);
    const sp = $('sum-species');
    res.species.forEach((id) => {
      const spc = DG.SPECIES[id];
      const isNew = res.newSpecies.indexOf(id) >= 0;
      const d = U.el('div', 'sp-chip' + (isNew ? ' new' : ''));
      d.appendChild(iconCanvas(spc, 88, 60, false));
      d.appendChild(U.el('span', '', esc(spc.name) + (isNew ? '<br><span class="badge">Nieuw!</span>' : '')));
      sp.appendChild(d);
    });
    const ph = $('sum-photos');
    if (ph) res.photos.forEach((p) => {
      const f = U.el('figure', '', '<img alt="">' + '<figcaption>' + esc(p.sp ? DG.SPECIES[p.sp].name : 'Sfeerfoto') + ' <span class="stars">' + '★'.repeat(p.stars) + '</span></figcaption>');
      f.querySelector('img').src = p.url;
      ph.appendChild(f);
    });
    const leave = (to) => { UI.closeModal(); UI.leaveDive(to); };
    c.querySelector('[data-a=map]').onclick = () => leave('map');
    c.querySelector('[data-a=shop]').onclick = () => leave('shop');
    c.querySelector('[data-a=again]').onclick = () => { UI.closeModal(); DG.Dive.stop(); UI.startDive(s); };
    UI.updateTop();
  };

  UI.drawProfile = function (cv, prof, big) {
    const r = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth || 160, h = cv.clientHeight || 52;
    cv.width = w * r; cv.height = h * r;
    const c = cv.getContext('2d');
    c.scale(r, r);
    const maxT = Math.max(1, prof[prof.length - 1][0]);
    const maxD = Math.max(6, ...prof.map((p) => p[1])) * 1.1;
    const pad = big ? 28 : 4;
    const X = (t) => pad + (t / maxT) * (w - pad - 8), Y = (d) => 8 + (d / maxD) * (h - 16 - (big ? 12 : 0));
    if (big) {
      c.fillStyle = 'rgba(58,209,143,0.12)';
      c.fillRect(pad, Y(3), w - pad - 8, Y(6) - Y(3));
      c.fillStyle = '#9ab'; c.font = '11px Nunito Sans, sans-serif'; c.textAlign = 'right';
      for (let d = 0; d <= maxD; d += maxD > 20 ? 10 : 5) { c.fillText(d + ' m', pad - 4, Y(d) + 4); c.strokeStyle = 'rgba(255,255,255,0.07)'; c.beginPath(); c.moveTo(pad, Y(d)); c.lineTo(w - 8, Y(d)); c.stroke(); }
      c.textAlign = 'center';
      c.fillText(Math.round(maxT) + ' min', w - 24, h - 4);
      c.fillText('0', pad, h - 4);
    }
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(28,192,210,0.5)'); g.addColorStop(1, 'rgba(14,90,138,0.15)');
    c.beginPath(); c.moveTo(X(0), Y(0));
    prof.forEach((p) => c.lineTo(X(p[0]), Y(p[1])));
    c.lineTo(X(maxT), Y(0)); c.closePath();
    c.fillStyle = g; c.fill();
    c.beginPath(); prof.forEach((p, i) => (i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1]))));
    c.strokeStyle = '#7ef6ff'; c.lineWidth = big ? 2.2 : 1.5; c.stroke();
  };

  /* ================================================================
   * Logboek
   * ================================================================ */
  UI.renderLog = function (tab) {
    UI.logTab = tab;
    const sv = DG.Save.data;
    document.querySelectorAll('#log-tabs .tab').forEach((b) => { b.classList.toggle('on', b.dataset.tab === tab); b.setAttribute('aria-selected', b.dataset.tab === tab); });
    const totalMin = sv.dives.reduce((s, d) => s + d.minutes, 0);
    const maxD = sv.dives.reduce((s, d) => Math.max(s, d.maxD), 0);
    const logSp = Object.keys(DG.SPECIES).filter((k) => DG.SPECIES[k].log);
    const seen = logSp.filter((k) => sv.species[k]).length;
    $('log-stats').innerHTML =
      '<div><b>' + sv.dives.length + '</b><small>duiken</small></div><div><b>' + Math.floor(totalMin / 60) + ':' + String(totalMin % 60).padStart(2, '0') + '</b><small>uur onder water</small></div>' +
      '<div><b>' + maxD.toFixed(1) + ' m</b><small>diepste duik</small></div><div><b>' + seen + '/' + logSp.length + '</b><small>soorten</small></div><div><b>' + sv.photos.length + '</b><small>foto’s</small></div>';
    const body = $('log-body');
    body.innerHTML = '';
    if (tab === 'dives') {
      if (!sv.dives.length) { body.innerHTML = '<p class="empty">Nog geen duiken gelogd. Kies een duikstek op de wereldkaart!</p>'; return; }
      const list = U.el('div', 'dive-list');
      sv.dives.slice().reverse().forEach((d) => {
        const s = DG.siteById(d.site);
        const it = U.el('div', 'dive-item',
          '<div class="dive-nr">#' + d.nr + '</div><div><h4>' + esc(s.name) + ' · ' + esc(s.area) + '</h4><div class="meta"><span>' + new Date(d.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span><span>⏱ ' + d.minutes + ' min</span><span>⬇ ' + d.maxD + ' m</span><span>🐠 ' + d.species.length + ' soorten</span><span>📷 ' + d.photos + '</span><span>' + (d.needStop ? (d.safetyDone ? '✅ stop' : '⚠️ geen stop') : '') + '</span><span style="color:var(--sun)">+' + U.euro(d.earned) + '</span></div></div><canvas></canvas>');
        list.appendChild(it);
        requestAnimationFrame(() => UI.drawProfile(it.querySelector('canvas'), d.profile || [[0, 0], [1, 0]], false));
      });
      body.appendChild(list);
    } else if (tab === 'species') {
      DG.SITES.forEach((s) => {
        const ids = DG.siteSpecies(s);
        const f = ids.filter((k) => sv.species[k]).length;
        const sec = U.el('div', 'sp-section', '<h3>' + esc(s.name) + ' <small>' + esc(s.area) + ' · ' + f + '/' + ids.length + '</small></h3>');
        const grid = U.el('div', 'sp-grid');
        ids.forEach((k) => {
          const spc = DG.SPECIES[k], info = sv.species[k];
          const card = U.el('button', 'sp-card' + (info ? '' : ' unknown') + ' r' + spc.r);
          card.appendChild(iconCanvas(spc, 140, 90, !info));
          card.appendChild(U.el('b', '', info ? esc(spc.name) : '???'));
          card.appendChild(U.el('span', 'flags', DG.RARITY[spc.r].name + (info ? ' · 👁' + (info.photo ? ' 📷' : '') : '')));
          card.onclick = () => UI.speciesDetail(spc);
          grid.appendChild(card);
        });
        sec.appendChild(grid);
        body.appendChild(sec);
      });
    } else {
      if (!sv.photos.length) { body.innerHTML = '<p class="empty">Nog geen foto’s. Koop een camera bij De Tuimelaar en druk onder water op spatie (of 📷).</p>'; return; }
      const al = U.el('div', 'album');
      sv.photos.slice().reverse().forEach((p, i) => {
        const s = DG.siteById(p.site);
        const f = U.el('figure', '', '<img alt=""><figcaption><span><b>' + esc(p.sp ? DG.SPECIES[p.sp].name : 'Sfeerfoto') + '</b><br><small>' + esc(s ? s.name : '') + ' · ' + p.depth + ' m</small></span><span class="stars">' + '★'.repeat(p.stars) + '</span></figcaption>');
        f.style.setProperty('--rot', ((i * 37) % 7 - 3) * 0.6 + 'deg');
        f.querySelector('img').src = p.url;
        al.appendChild(f);
      });
      body.appendChild(al);
    }
  };
  UI.speciesDetail = function (spc) {
    const info = DG.Save.data.species[spc.id];
    const where = DG.SITES.filter((s) => DG.siteSpecies(s).indexOf(spc.id) >= 0).map((s) => s.name + ' (' + s.area + ')');
    const c = UI.modal('<div class="sp-detail"><div id="spd-ic"></div><div><h2>' + (info ? esc(spc.name) : 'Nog niet ontdekt') + '</h2>' +
      (info ? '<p><i>' + esc(spc.latin) + '</i> · ' + DG.RARITY[spc.r].name + '</p><p class="lead">' + esc(spc.fact) + '</p>' : '<p class="lead">Duik bij ' + esc(where.join(' of ')) + ' om deze soort te vinden.' + (spc.hidden ? ' Hij verstopt zich goed: zoek dichtbij de bodem en gebruik een lamp.' : '') + '</p>') +
      '<p style="color:var(--muted);font-size:.9rem">Te zien bij: ' + esc(where.join(', ')) + '</p></div></div><div class="modal-actions"><button class="btn primary">Sluiten</button></div>');
    $('spd-ic').appendChild(iconCanvas(spc, 220, 150, !info));
    c.querySelector('button').onclick = UI.closeModal;
  };

  UI.toggleSound = function () {
    const sv = DG.Save.data;
    sv.settings.sound = !sv.settings.sound;
    DG.Save.save();
    DG.Audio.unlock();
    DG.Audio.setSound(sv.settings.sound);
    if (UI.screen !== 'dive' && UI.screen !== 'travel') DG.Audio.music(sv.settings.sound);
    UI.updateTop();
  };

  /* ================================================================
   * Bedrading
   * ================================================================ */
  UI.init = function () {
    document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { DG.Audio.unlock(); UI.go(b.dataset.go); }));
    $('btn-start').onclick = () => {
      DG.Audio.unlock();
      if (DG.Save.data.settings.sound) DG.Audio.setSound(true);
      UI.go(DG.Save.kitMissing().length ? 'shop' : 'map');
    };
    $('btn-new').onclick = () => UI.confirm('Opnieuw beginnen?', 'Je budget, uitrusting, logboek en foto’s worden gewist.', 'Wissen', () => { DG.Save.reset(); UI.cat = 'overzicht'; UI.sel = null; UI.renderTitle(); });
    $('btn-reset').onclick = $('btn-new').onclick;
    $('btn-to-map').onclick = () => {
      const miss = DG.Save.kitMissing();
      if (miss.length) { UI.cat = miss[0].id; UI.renderShop(); UI.toast('Je mist nog: ' + miss.map((c) => c.name.toLowerCase()).join(', ') + '.', 'warn'); $('scr-shop').scrollTo({ top: 0, behavior: 'smooth' }); }
      else UI.go('map');
    };
    $('shop-front').onclick = UI.storefront;
    $('btn-sound').onclick = UI.toggleSound;
    $('btn-pause').onclick = UI.togglePause;
    $('btn-end').onclick = () => { if (DG.Dive.canEnd) DG.Dive.finish(false); };
    $('t-photo').addEventListener('pointerdown', (e) => { e.preventDefault(); DG.Dive.takePhoto(); });
    $('t-lamp').addEventListener('pointerdown', (e) => { e.preventDefault(); DG.Dive.toggleLamp(); });
    const tb = $('t-turbo');
    tb.addEventListener('pointerdown', (e) => { e.preventDefault(); UI.turboHeld = true; tb.classList.add('on'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => tb.addEventListener(ev, () => { UI.turboHeld = false; tb.classList.remove('on'); }));
    document.querySelectorAll('#log-tabs .tab').forEach((b) => (b.onclick = () => UI.renderLog(b.dataset.tab)));
    window.addEventListener('resize', () => { if (UI.screen === 'shop' && UI.cat === 'overzicht') UI.placeHotspots(); });
    $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal' && (UI.modalKind === null || UI.modalKind === undefined)) UI.closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').hidden && !UI.modalKind) UI.closeModal(); });
  };
})(window.DG);
