/*
 * Narrowcasting-speler — Hoeksema Schilderwerken
 *
 * Haalt de inhoud op uit Supabase (tabellen narrowcasting_slides en
 * narrowcasting_instellingen), toont de slides één voor één en controleert
 * elke ~30 seconden of er iets is gewijzigd. Zonder internet blijft de
 * laatst bekende inhoud gewoon draaien.
 *
 * Handige adresbalk-opties (voor testen):
 *   ?slide=naam      toon alleen deze slide (ook als hij uit staat)
 *   ?pauze           niet automatisch doorschakelen
 *   ?scherm=naam     schermnaam (voor slides die alleen op één scherm horen)
 *   ?bron=lokaal     gebruik startinhoud.json i.p.v. de database
 *   ?nu=2026-12-20T10:00   doe alsof het dit tijdstip is
 *   ?debug           toon technische info
 * Toetsen: ← → vorige/volgende, spatie = pauze, F = volledig scherm, D = debug
 *
 * Geschreven in ES2017 zodat het ook op oudere tv-browsers draait.
 */
(function () {
  'use strict';

  var CONFIG = window.NARROWCASTING_CONFIG || {};
  var zoek = new URLSearchParams(location.search);
  var OPTIES = {
    scherm: (zoek.get('scherm') || CONFIG.scherm || '').toLowerCase(),
    slide: zoek.get('slide'),
    pauze: zoek.has('pauze') || zoek.has('slide'),
    bron: zoek.get('bron') || (CONFIG.supabaseUrl ? 'supabase' : 'lokaal'),
    debug: zoek.has('debug')
  };

  var KLEUREN = ['rood', 'geel', 'blauw', 'groen'];
  var THEMAS = ['licht', 'donker', 'kleur'];
  var DAGCODES = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  var CACHE_INHOUD = 'hoeksema-nc-inhoud-v1';
  var CACHE_WEER = 'hoeksema-nc-weer-v1';

  // ---------------------------------------------------------------- tijd
  var tijdVerschuiving = 0;
  if (zoek.get('nu')) {
    var testTijd = new Date(zoek.get('nu'));
    if (!isNaN(testTijd.getTime())) tijdVerschuiving = testTijd.getTime() - Date.now();
  }
  function nu() { return new Date(Date.now() + tijdVerschuiving); }
  function twee(n) { return (n < 10 ? '0' : '') + n; }
  function datumSleutel(d) { return d.getFullYear() + '-' + twee(d.getMonth() + 1) + '-' + twee(d.getDate()); }
  function minuten(tekst) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(tekst || ''));
    return m ? (+m[1]) * 60 + (+m[2]) : null;
  }
  function groet(d) {
    var u = d.getHours();
    if (u < 6) return 'Goedenacht';
    if (u < 12) return 'Goedemorgen';
    if (u < 18) return 'Goedemiddag';
    return 'Goedenavond';
  }

  // ---------------------------------------------------------------- hulpjes
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function vulIn(s) {
    var d = nu();
    return String(s == null ? '' : s)
      .replace(/\{groet\}/g, groet(d))
      .replace(/\{bedrijf\}/g, bedrijf().naam || '')
      .replace(/\{plaats\}/g, (weerStaat.data && weerStaat.data.plaats) || (instelling('weer', {}).plaats || ''))
      .replace(/\{jaar\}/g, String(d.getFullYear()))
      .replace(/\{volgend_jaar\}/g, String(d.getFullYear() + 1));
  }
  // Tekstopmaak: *woord* = in accentkleur, regeleinde = nieuwe regel
  function opmaak(s) {
    return esc(vulIn(s))
      .replace(/\*([^*]+)\*/g, '<em class="nadruk">$1</em>')
      .replace(/\n/g, '<br>');
  }
  function media(url) { return String(url || '').trim(); }
  function websiteUrl(w) {
    w = String(w || '').trim();
    if (!w) return '';
    return /^[a-z][a-z0-9+.-]*:/i.test(w) ? w : 'https://' + w;
  }
  function websiteTekst(w) { return String(w || '').replace(/^https?:\/\//i, '').replace(/\/$/, ''); }
  function getal(v, standaard) { var n = parseFloat(v); return isNaN(n) ? standaard : n; }
  function lijst(v) {
    if (Array.isArray(v)) return v;
    if (v == null || v === '') return [];
    return [v];
  }
  function kies(waarde, opties, standaard) { return opties.indexOf(waarde) > -1 ? waarde : standaard; }
  function log() {
    if (window.console) console.log.apply(console, ['[narrowcasting]'].concat([].slice.call(arguments)));
  }

  // ---------------------------------------------------------------- iconen
  var S = 'fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"';
  var ICONEN = {
    roller: '<svg viewBox="0 0 64 64" ' + S + '><rect x="8" y="8" width="40" height="16" rx="5"/><path d="M48 16h6v13H32v9"/><rect x="27" y="38" width="10" height="20" rx="4"/></svg>',
    kwast: '<svg viewBox="0 0 64 64" ' + S + '><rect x="28" y="4" width="8" height="20" rx="4"/><rect x="21" y="24" width="22" height="11" rx="2"/><path d="M21 35h22v10c0 7-5 12-11 14-6-2-11-7-11-14z"/></svg>',
    huis: '<svg viewBox="0 0 64 64" ' + S + '><path d="M7 31L32 9l25 22"/><path d="M14 26v29h36V26"/><path d="M27 55V40h10v15"/></svg>',
    glas: '<svg viewBox="0 0 64 64" ' + S + '><rect x="11" y="7" width="42" height="50" rx="3"/><path d="M32 7v50M11 32h42"/><path d="M17 25l7-7M38 50l8-8"/></svg>',
    muur: '<svg viewBox="0 0 64 64" ' + S + '><path d="M6 46h52M6 56h52M6 36h52M20 36v10M44 36v10M32 46v10"/><rect x="22" y="6" width="22" height="12" rx="6"/><path d="M33 18v6M12 24h42"/></svg>',
    palet: '<svg viewBox="0 0 64 64" ' + S + '><path d="M32 7C17 7 6 17 6 31s10 25 23 25c4 0 6-2 6-5s-3-4-3-7 2-6 6-6h7c8 0 14-5 14-12C59 14 47 7 32 7z"/><circle cx="19" cy="27" r="2.5" fill="#fff"/><circle cx="29" cy="18" r="2.5" fill="#fff"/><circle cx="42" cy="20" r="2.5" fill="#fff"/></svg>',
    ladder: '<svg viewBox="0 0 64 64" ' + S + '><path d="M20 6L12 58M44 6l8 52M18 18h28M16 31h32M14 45h36"/></svg>',
    druppel: '<svg viewBox="0 0 64 64" ' + S + '><path d="M32 6C24 19 15 28 15 40a17 17 0 0 0 34 0C49 28 40 19 32 6z"/></svg>',
    schild: '<svg viewBox="0 0 64 64" ' + S + '><path d="M32 6l22 8v16c0 14-9 23-22 28C19 53 10 44 10 30V14z"/><path d="M22 32l7 7 13-14"/></svg>',
    spuit: '<svg viewBox="0 0 64 64" ' + S + '><path d="M18 26h18l4 6v6H18z"/><path d="M24 38l-4 20h10l2-20M36 26v-8h-8v8M40 32h6"/><path d="M52 24v0M54 32v0M52 40v0" stroke-width="6"/></svg>',
    behang: '<svg viewBox="0 0 64 64" ' + S + '><rect x="10" y="8" width="22" height="48" rx="3"/><path d="M32 12h18v40H32"/><path d="M16 18l10 8M16 34l10 8"/></svg>',
    telefoon: '<svg viewBox="0 0 64 64" ' + S + '><path d="M22 8l-9 3c-2 16 11 36 30 44l7-7-9-11-7 4c-6-4-10-9-12-15l5-6z"/></svg>',
    mail: '<svg viewBox="0 0 64 64" ' + S + '><rect x="7" y="14" width="50" height="36" rx="4"/><path d="M8 16l24 19 24-19"/></svg>',
    web: '<svg viewBox="0 0 64 64" ' + S + '><circle cx="32" cy="32" r="24"/><path d="M8 32h48M32 8c8 8 8 40 0 48M32 8c-8 8-8 40 0 48"/></svg>',
    adres: '<svg viewBox="0 0 64 64" ' + S + '><path d="M32 58S12 38 12 25a20 20 0 0 1 40 0c0 13-20 33-20 33z"/><circle cx="32" cy="25" r="7"/></svg>',
    check: '<svg viewBox="0 0 64 64" ' + S + '><path d="M14 33l12 12 24-26"/></svg>',
    pijl: '<svg viewBox="0 0 64 64" ' + S + ' stroke-width="7"><path d="M12 32h38M36 16l16 16-16 16"/></svg>'
  };
  function icoon(naam) { return ICONEN[naam] || ICONEN.kwast; }
  function ster(vol) {
    return '<svg viewBox="0 0 64 64"><path d="M32 5l8.3 17 18.7 2.7-13.5 13.2 3.2 18.6L32 47.7 15.3 56.5l3.2-18.6L5 24.7 23.7 22z" fill="' +
      (vol ? 'var(--geel)' : 'none') + '" stroke="var(--geel)" stroke-width="3" stroke-linejoin="round"/></svg>';
  }

  // Weericonen (gekleurd)
  var WOLK = '<path d="M19 48h28a11 11 0 0 0 1-22 15 15 0 0 0-28-4 13 13 0 0 0-1 26z" fill="#c9d3dc"/>';
  var WOLK_DONKER = '<path d="M19 46h28a11 11 0 0 0 1-22 15 15 0 0 0-28-4 13 13 0 0 0-1 26z" fill="#8f9ba6"/>';
  var ZON = function (cx, cy, r) {
    var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#F0B400"/>';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, r1 = r + 5, r2 = r + 11;
      s += '<line x1="' + (cx + Math.cos(a) * r1).toFixed(1) + '" y1="' + (cy + Math.sin(a) * r1).toFixed(1) + '" x2="' + (cx + Math.cos(a) * r2).toFixed(1) + '" y2="' + (cy + Math.sin(a) * r2).toFixed(1) + '" stroke="#F0B400" stroke-width="4" stroke-linecap="round"/>';
    }
    return s;
  };
  var DRUPPELS = '<path d="M24 52l-3 7M34 52l-3 7M44 52l-3 7" stroke="#008CDC" stroke-width="4" stroke-linecap="round"/>';
  var WEERICONEN = {
    zon: ZON(32, 32, 13),
    zonwolk: ZON(24, 22, 10) + WOLK,
    wolk: WOLK,
    mist: '<path d="M10 24h44M6 34h52M12 44h40" stroke="#a9b3bc" stroke-width="5" stroke-linecap="round"/>',
    motregen: WOLK + '<path d="M26 53v4M38 53v4" stroke="#008CDC" stroke-width="4" stroke-linecap="round"/>',
    regen: WOLK_DONKER + DRUPPELS,
    buien: ZON(22, 18, 9) + WOLK_DONKER + DRUPPELS,
    sneeuw: WOLK + '<g fill="#8ab8d8"><circle cx="24" cy="55" r="3"/><circle cx="34" cy="58" r="3"/><circle cx="44" cy="55" r="3"/></g>',
    onweer: WOLK_DONKER + '<path d="M34 46l-8 10h7l-4 8 11-12h-7l4-6z" fill="#F0B400"/>'
  };
  function weerIcoon(code) {
    var c = +code, n = 'wolk';
    if (c === 0) n = 'zon';
    else if (c === 1 || c === 2) n = 'zonwolk';
    else if (c === 3) n = 'wolk';
    else if (c === 45 || c === 48) n = 'mist';
    else if (c >= 51 && c <= 57) n = 'motregen';
    else if (c >= 61 && c <= 67) n = 'regen';
    else if ((c >= 71 && c <= 77) || c === 85 || c === 86) n = 'sneeuw';
    else if (c >= 80 && c <= 82) n = 'buien';
    else if (c >= 95) n = 'onweer';
    return '<svg class="weericoon" viewBox="0 0 64 64">' + WEERICONEN[n] + '</svg>';
  }

  // ---------------------------------------------------------------- QR-code
  function qrSvg(tekst) {
    try {
      if (typeof qrcode !== 'function') return '';
      if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
      var qr = qrcode(0, 'M');
      qr.addData(String(tekst));
      qr.make();
      var n = qr.getModuleCount(), d = '';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
      return '<svg viewBox="-1 -1 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges"><path d="' + d + '" fill="#2D2E32"/></svg>';
    } catch (e) { log('QR mislukt', e); return ''; }
  }
  function qrKaart(url, label) {
    var svg = qrSvg(url);
    if (!svg) return '';
    return '<div class="qr-kaart">' + svg + (label ? '<div class="qr-label">' + opmaak(label) + '</div>' : '') + '</div>';
  }

  // ---------------------------------------------------------------- inhoud
  var inhoud = null;            // { instellingen: {}, slides: [] }
  var inhoudSignatuur = '';
  var herlaadWaarde;            // om het scherm op afstand te herladen
  var laatsteSucces = 0;
  var bronGebruikt = '-';
  var kapot = {};               // afbeeldingen/video's die niet laden

  function instelling(naam, standaard) {
    var v = inhoud && inhoud.instellingen ? inhoud.instellingen[naam] : undefined;
    return v == null ? standaard : v;
  }
  function bedrijf() {
    return Object.assign({
      naam: 'Hoeksema Schilderwerken',
      logo: 'media/logo.svg',
      logo_wit: 'media/logo-wit.svg'
    }, instelling('bedrijf', {}));
  }
  function weergave() {
    return Object.assign({ standaard_duur: 12, overgang: 'vervagen', verversen_sec: 30, ticker_snelheid: 110 }, instelling('weergave', {}));
  }

  function normaliseer(ruw) {
    var inst = ruw && ruw.instellingen ? ruw.instellingen : {};
    var slides = (ruw && ruw.slides ? ruw.slides : []).map(function (s, i) {
      var inh = s.inhoud || {};
      if (typeof inh === 'string') { try { inh = JSON.parse(inh); } catch (e) { inh = {}; } }
      return {
        id: s.id == null ? i : s.id,
        naam: String(s.naam || ('slide-' + (i + 1))),
        volgorde: getal(s.volgorde, (i + 1) * 10),
        type: String(s.type || '').toLowerCase(),
        actief: s.actief !== false,
        duur: getal(s.duur, null),
        van: s.van ? String(s.van).slice(0, 10) : null,
        tot: s.tot ? String(s.tot).slice(0, 10) : null,
        dagen: lijst(s.dagen).map(function (d) { return String(d).toLowerCase().slice(0, 2); }),
        schermen: lijst(s.schermen).map(function (d) { return String(d).toLowerCase(); }),
        inhoud: inh,
        _index: i
      };
    });
    slides.sort(function (a, b) { return (a.volgorde - b.volgorde) || (a._index - b._index); });
    return { instellingen: inst, slides: slides };
  }

  function fetchMetTimeout(url, opties, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var o = Object.assign({}, opties || {});
    if (ctrl) o.signal = ctrl.signal;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms || 15000);
    return fetch(url, o).then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }

  async function haalUitSupabase() {
    var basis = CONFIG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/';
    var opties = { headers: { apikey: CONFIG.supabaseKey, Accept: 'application/json' }, cache: 'no-store' };
    var antwoorden = await Promise.all([
      fetchMetTimeout(basis + 'narrowcasting_slides?select=*&order=volgorde.asc,id.asc', opties),
      fetchMetTimeout(basis + 'narrowcasting_instellingen?select=sleutel,waarde', opties)
    ]);
    if (!antwoorden[0].ok || !antwoorden[1].ok) throw new Error('Supabase gaf ' + antwoorden[0].status + '/' + antwoorden[1].status);
    var slides = await antwoorden[0].json();
    var rijen = await antwoorden[1].json();
    var instellingen = {};
    rijen.forEach(function (r) { instellingen[r.sleutel] = r.waarde; });
    return { instellingen: instellingen, slides: slides };
  }
  async function haalLokaal() {
    var r = await fetchMetTimeout('startinhoud.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('startinhoud.json gaf ' + r.status);
    return r.json();
  }
  function haalInhoud() { return OPTIES.bron === 'lokaal' ? haalLokaal() : haalUitSupabase(); }

  function bewaarCache(ruw) { try { localStorage.setItem(CACHE_INHOUD, JSON.stringify(ruw)); } catch (e) { /* vol of geblokkeerd */ } }
  function leesCache() { try { return JSON.parse(localStorage.getItem(CACHE_INHOUD) || 'null'); } catch (e) { return null; } }

  function verwerkInhoud(ruw, bron) {
    var sig = JSON.stringify(ruw);
    if (sig === inhoudSignatuur) return;
    var eerste = !inhoud;
    inhoudSignatuur = sig;
    inhoud = normaliseer(ruw);
    bronGebruikt = bron;

    // Herladen op afstand: verandert de instelling 'herladen', dan laadt het scherm opnieuw.
    var h = JSON.stringify(instelling('herladen', null));
    if (herlaadWaarde === undefined) herlaadWaarde = h;
    else if (h !== herlaadWaarde && bron === 'online') {
      bewaarCache(ruw);
      log('herladen op verzoek');
      setTimeout(function () { location.reload(); }, 500);
      return;
    }

    $('podium').setAttribute('data-overgang', kies(weergave().overgang, ['vervagen', 'schuiven', 'geen'], 'vervagen'));
    var b = bedrijf();
    $('balk-logo').src = media(b.logo);
    $('balk-logo').alt = b.naam || '';
    zetTicker(instelling('ticker', []));
    zetMededeling(instelling('mededeling', null));
    weerBijwerken();
    controleerNacht();

    if (eerste || !huidig || huidig.slide.type === '_leeg' || OPTIES.slide) toonVolgende(huidig ? 0 : 1);
    toonDebug();
  }

  async function ververs() {
    try {
      var ruw = await haalInhoud();
      bewaarCache(ruw);
      laatsteSucces = Date.now();
      $('offline').hidden = true;
      verwerkInhoud(ruw, 'online');
    } catch (e) {
      log('ophalen mislukt:', e && e.message ? e.message : e);
      var interval = weergave().verversen_sec * 1000;
      if (Date.now() - laatsteSucces > interval * 3) $('offline').hidden = false;
      if (!inhoud) {
        // Allereerste start zonder verbinding en zonder cache: gebruik de startinhoud.
        try { verwerkInhoud(await haalLokaal(), 'lokaal'); } catch (e2) { toonVolgende(1); }
      }
    } finally {
      var sec = Math.max(10, getal(weergave().verversen_sec, 30));
      setTimeout(ververs, sec * 1000);
    }
  }

  // ---------------------------------------------------------------- weer
  var weerStaat = { data: null, sleutel: '', opgehaald: 0, bezig: false };

  function weerNodig() {
    if (!inhoud) return false;
    var w = instelling('weer', {});
    if (!w || (!w.plaats && !(w.lat && w.lon))) return false;
    return inhoud.slides.some(function (s) { return s.type === 'weer' && (s.actief || OPTIES.slide); });
  }
  function laadWeerCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_WEER) || 'null');
      if (c && Date.now() - c.opgehaald < 6 * 3600 * 1000) { weerStaat.data = c.data; weerStaat.sleutel = c.sleutel; weerStaat.opgehaald = c.opgehaald; }
    } catch (e) { /* niets */ }
  }
  async function weerBijwerken(forceer) {
    if (!weerNodig()) { return; }
    var w = instelling('weer', {});
    var sleutel = JSON.stringify([w.plaats || '', w.lat || '', w.lon || '']);
    if (sleutel !== weerStaat.sleutel) weerStaat.data = null;
    var vers = sleutel === weerStaat.sleutel && Date.now() - weerStaat.opgehaald < 30 * 60 * 1000;
    if ((vers && !forceer) || weerStaat.bezig) return;
    weerStaat.bezig = true;
    try {
      var lat = w.lat, lon = w.lon, plaats = w.plaats || '';
      if (!(lat && lon)) {
        var g = await (await fetchMetTimeout('https://geocoding-api.open-meteo.com/v1/search?count=1&language=nl&format=json&countryCode=NL&name=' + encodeURIComponent(w.plaats))).json();
        if (!g.results || !g.results.length) throw new Error('plaats niet gevonden: ' + w.plaats);
        lat = g.results[0].latitude; lon = g.results[0].longitude;
        plaats = w.plaats || g.results[0].name;
      }
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max' +
        '&hourly=relative_humidity_2m&timezone=Europe%2FAmsterdam&forecast_days=5';
      var r = await (await fetchMetTimeout(url)).json();
      if (!r.daily || !r.daily.time) throw new Error('onverwacht weerantwoord');
      var vocht = {};
      if (r.hourly && r.hourly.time) {
        r.hourly.time.forEach(function (t, i) {
          var uur = +t.slice(11, 13);
          if (uur < 9 || uur > 17) return;            // alleen werkuren
          var dag = t.slice(0, 10);
          (vocht[dag] = vocht[dag] || []).push(r.hourly.relative_humidity_2m[i]);
        });
      }
      var dagen = r.daily.time.map(function (d, i) {
        var v = vocht[d] || [];
        return {
          datum: d,
          code: r.daily.weather_code[i],
          tmax: r.daily.temperature_2m_max[i],
          tmin: r.daily.temperature_2m_min[i],
          neerslag: r.daily.precipitation_sum[i],
          kans: r.daily.precipitation_probability_max ? r.daily.precipitation_probability_max[i] : null,
          wind: r.daily.wind_speed_10m_max[i],
          vocht: v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length) : null
        };
      });
      weerStaat.data = { plaats: plaats, dagen: dagen };
      weerStaat.sleutel = sleutel;
      weerStaat.opgehaald = Date.now();
      try { localStorage.setItem(CACHE_WEER, JSON.stringify(weerStaat)); } catch (e) { /* niets */ }
      // Voorbeeldmodus of leeg scherm: de weerslide meteen laten zien.
      if (OPTIES.slide || (huidig && huidig.slide.type === '_leeg')) toonVolgende(0);
    } catch (e) {
      log('weer ophalen mislukt:', e && e.message ? e.message : e);
    } finally {
      weerStaat.bezig = false;
    }
  }
  // Is het schilderweer? Vuistregels voor buitenschilderwerk.
  function schilderOordeel(d) {
    var kans = d.kans == null ? 0 : d.kans;
    if (d.tmax < 5 || kans >= 70 || d.neerslag >= 3 || d.wind >= 50) return { klasse: 'slecht', tekst: 'Binnendag', kleur: 'var(--rood)' };
    if (d.tmax >= 10 && kans < 35 && d.neerslag < 0.5 && d.wind < 30 && (d.vocht == null || d.vocht < 85)) return { klasse: 'goed', tekst: 'Schilderweer', kleur: 'var(--groen)' };
    return { klasse: 'matig', tekst: 'Twijfelachtig', kleur: 'var(--geel)' };
  }

  // ---------------------------------------------------------------- slidetypes
  function basis(s, standaardThema, standaardKleur) {
    var i = s.inhoud;
    var el = document.createElement('section');
    el.className = 'slide t-' + s.type + ' ' + kies(i.thema, THEMAS, standaardThema) + ' k-' + kies(i.kleur, KLEUREN, standaardKleur);
    el.setAttribute('data-naam', s.naam);
    return el;
  }
  function a(n) { return ' anim" style="--i:' + n; }   // animatie-volgorde
  function kopHtml(i, n, standaard) {
    var k = i.kop != null ? i.kop : standaard;
    return k ? '<div class="kop' + a(n) + '">' + opmaak(k) + '</div>' : '';
  }
  function puntenHtml(punten, n) {
    punten = lijst(punten);
    if (!punten.length) return '';
    return '<ul class="punten">' + punten.map(function (p, k) { return '<li class="' + a(n + k).slice(1) + '">' + opmaak(p) + '</li>'; }).join('') + '</ul>';
  }
  function streep(extra) {
    return '<div class="kleurstreep ' + (extra || '') + '"><i class="rood"></i><i class="geel"></i><i class="blauw"></i><i class="groen"></i></div>';
  }
  function heeftContact(i) {
    var b = bedrijf();
    return !!(i.telefoon || i.email || i.website || i.adres || b.telefoon || b.email || b.website || b.adres || i.qr);
  }

  var TYPES = {
    titel: {
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'licht', 'blauw'), b = bedrijf(), n = 0, h = '';
        var thema = kies(i.thema, THEMAS, 'licht');
        if (i.achtergrond) {
          el.classList.add('met-achtergrond');
          h += '<img class="achtergrond" src="' + esc(media(i.achtergrond)) + '" alt=""><div class="waas"></div>';
        }
        h += '<div class="midden">';
        if (i.logo !== false) {
          var logo = (i.achtergrond || thema !== 'licht') ? b.logo_wit : b.logo;
          h += '<img class="groot-logo' + a(n++) + '" src="' + esc(media(logo)) + '" alt="">';
        }
        h += kopHtml(i, n++, '');
        if (i.titel) h += '<h1 class="titel' + a(n++) + '" data-regels="2">' + opmaak(i.titel) + '</h1>';
        if (i.tekst) h += '<p class="tekst' + a(n++) + '" data-regels="3">' + opmaak(i.tekst) + '</p>';
        h += streep('los groei');
        h += '</div>';
        el.innerHTML = h;
        return el;
      }
    },

    tekst: {
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'donker', 'geel'), n = 0, h = '';
        var thema = kies(i.thema, THEMAS, 'donker');
        if (i.afbeelding) {
          el.classList.add('met-beeld');
          h += '<div class="beeld anim" style="--i:2"><img src="' + esc(media(i.afbeelding)) + '" alt="">' + streep() + '</div>';
        } else if (i.deco !== false && thema !== 'kleur') {
          el.classList.add('met-deco');
          h += '<img class="beeldmerk-deco anim" style="--i:3" src="media/beeldmerk.svg" alt="">';
        }
        h += '<div class="inhoud" data-pas>';
        h += kopHtml(i, n++, '');
        if (i.titel) h += '<h2 class="titel' + a(n++) + '" data-regels="3">' + opmaak(i.titel) + '</h2>';
        if (i.tekst) h += '<p class="tekst' + a(n++) + '">' + opmaak(i.tekst) + '</p>';
        h += puntenHtml(i.punten, n);
        h += '</div>';
        el.innerHTML = h;
        return el;
      }
    },

    foto: {
      geldig: function (i) { return !!i.afbeelding && !kapot[media(i.afbeelding)]; },
      bouw: function (s, duur) {
        var i = s.inhoud, el = basis(s, 'donker', 'blauw'), h = '';
        if (i.passend) el.classList.add('passend');
        el.style.setProperty('--duur', (duur + 2) + 's');
        h += '<img class="achtergrond" src="' + esc(media(i.afbeelding)) + '" alt="">';
        if (i.titel || i.tekst || i.onderschrift) {
          h += '<div class="onderschrift-blok">';
          if (i.titel) h += '<div class="titel' + a(0) + '" data-regels="2">' + opmaak(i.titel) + '</div>';
          if (i.tekst || i.onderschrift) h += '<div class="tekst' + a(1) + '" data-regels="2">' + opmaak(i.tekst || i.onderschrift) + '</div>';
          h += '</div>';
        }
        el.innerHTML = h;
        el.querySelector('img').onerror = function () {
          kapot[media(i.afbeelding)] = true;
          if (huidig && huidig.el === el) toonVolgende(1);
        };
        return el;
      }
    },

    voor_na: {
      geldig: function (i) { return !!(i.voor && i.na) && !kapot[media(i.voor)] && !kapot[media(i.na)]; },
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'donker', 'groen'), h = '';
        h += '<div class="kader-kop">' + kopHtml(i, 0, 'Voor & na');
        if (i.titel) h += '<div class="titel' + a(1) + '" data-regels="1">' + opmaak(i.titel) + '</div>';
        h += '</div>';
        var voor = esc(media(i.voor)), na = esc(media(i.na));
        if (i.weergave === 'schuif') {
          h += '<div class="schuif anim" style="--i:2"><img src="' + voor + '" alt="Voor"><img class="na-laag" src="' + na + '" alt="Na">' +
               '<div class="lijn"></div><span class="label">VOOR</span><span class="label na">NA</span></div>';
        } else {
          h += '<div class="paar">' +
               '<div class="foto-kader voor"><img src="' + voor + '" alt="Voor"><span class="label">VOOR</span></div>' +
               '<div class="pijl">' + ICONEN.pijl + '</div>' +
               '<div class="foto-kader na"><img src="' + na + '" alt="Na"><span class="label na">NA</span></div>' +
               '</div>';
        }
        if (i.onderschrift) h += '<div class="onderschrift' + a(3) + '" data-regels="1">' + opmaak(i.onderschrift) + '</div>';
        el.innerHTML = h;
        [].forEach.call(el.querySelectorAll('img'), function (img) {
          img.onerror = function () { kapot[img.getAttribute('src')] = true; };
        });
        return el;
      }
    },

    diensten: {
      geldig: function (i) { return lijst(i.items).length > 0; },
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'licht', 'blauw'), h = '';
        var items = lijst(i.items).slice(0, 8);
        var n = items.length;
        var kolommen = n <= 4 ? n : (n <= 6 ? 3 : 4);
        var rijen = Math.ceil(n / kolommen);
        var breedte = Math.min(rijen > 1 ? 560 : 500, Math.floor((1720 - kolommen * 36) / kolommen));
        h += '<div class="kader-kop">' + kopHtml(i, 0, 'Onze diensten');
        if (i.titel) h += '<div class="titel' + a(1) + '" data-regels="1">' + opmaak(i.titel) + '</div>';
        h += '</div><div class="raster">';
        items.forEach(function (it, k) {
          if (typeof it === 'string') it = { naam: it };
          var kleur = kies(it.kleur, KLEUREN, KLEUREN[k % 4]);
          h += '<div class="kaart ' + (rijen > 1 ? 'liggend' : 'staand') + a(2 + k) + ';--kaartkleur:var(--' + kleur + ');width:' + breedte + 'px">' +
               '<div class="kaart-kop"><div class="icoon">' + icoon(it.icoon) + '</div>' +
               '<div class="naam" data-regels="' + (rijen > 1 ? 1 : 2) + '">' + opmaak(it.naam) + '</div></div>' +
               (it.tekst ? '<div class="omschrijving" data-regels="3">' + opmaak(it.tekst) + '</div>' : '') + '</div>';
        });
        h += '</div>';
        el.innerHTML = h;
        return el;
      }
    },

    weer: {
      geldig: function () { return !!(weerStaat.data && weerStaat.data.dagen && weerStaat.data.dagen.length); },
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'licht', 'blauw'), h = '', data = weerStaat.data;
        var vandaag = datumSleutel(nu());
        var dagen = data.dagen.filter(function (d) { return d.datum >= vandaag; }).slice(0, 5);
        if (!dagen.length) return null;
        h += '<div class="kader-kop">' + kopHtml(i, 0, 'Schilderweer · ' + data.plaats);
        h += '<div class="titel' + a(1) + '" data-regels="1">' + opmaak(i.titel || 'Kunnen we buiten aan de slag?') + '</div></div>';
        h += '<div class="dagen">';
        dagen.forEach(function (d, k) {
          var dt = new Date(d.datum + 'T12:00:00');
          var naam = d.datum === vandaag ? 'Vandaag' : (k === 1 && dagen[0].datum === vandaag ? 'Morgen' : dt.toLocaleDateString('nl-NL', { weekday: 'long' }));
          naam = naam.charAt(0).toUpperCase() + naam.slice(1);
          var o = schilderOordeel(d);
          h += '<div class="dag' + (d.datum === vandaag ? ' vandaag' : '') + a(2 + k) + ';--oordeel:' + o.kleur + '">' +
               '<div class="dagnaam">' + esc(naam) + '</div>' +
               '<div class="datum">' + esc(dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })) + '</div>' +
               weerIcoon(d.code) +
               '<div class="temp">' + Math.round(d.tmax) + '°<small> / ' + Math.round(d.tmin) + '°</small></div>' +
               '<div class="details">' + (d.kans != null ? 'Regenkans ' + Math.round(d.kans) + '%<br>' : '') + 'Wind ' + Math.round(d.wind) + ' km/u</div>' +
               '<div class="oordeel o-' + o.klasse + '">' + o.tekst + '</div></div>';
        });
        h += '</div>';
        h += '<div class="uitleg' + a(8) + '">' + opmaak(i.uitleg || '*Schilderweer* = droog, minimaal 10 °C, weinig wind en niet te vochtig. Ideaal voor buitenschilderwerk.') + '</div>';
        el.innerHTML = h;
        return el;
      }
    },

    review: {
      geldig: function (i) { return !!i.tekst; },
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'donker', 'geel'), h = '';
        var sterren = Math.max(0, Math.min(5, Math.round(getal(i.sterren, 5))));
        h += '<div class="inhoud" data-pas><div class="aanhalingsteken' + a(0) + '">“</div>';
        if (sterren) {
          h += '<div class="sterren' + a(1) + '">';
          for (var k = 0; k < 5; k++) h += ster(k < sterren);
          h += '</div>';
        }
        h += '<div class="quote' + a(2) + '" data-regels="5">' + opmaak(i.tekst) + '</div>';
        if (i.naam || i.plaats) h += '<div class="wie' + a(3) + '">— <b>' + opmaak(i.naam || '') + '</b>' + (i.plaats ? ', ' + opmaak(i.plaats) : '') + '</div>';
        h += '</div>';
        el.innerHTML = h;
        return el;
      }
    },

    vacature: {
      geldig: function (i) { return !!(i.titel || i.functie); },
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'licht', 'rood'), n = 0, h = '';
        h += '<div class="inhoud" data-pas>' + kopHtml(i, n++, 'Vacature');
        if (i.titel) h += '<div class="titel' + a(n++) + '" data-regels="2">' + opmaak(i.titel) + '</div>';
        if (i.functie) h += '<div class="functie' + a(n++) + '" data-regels="2">' + opmaak(i.functie) + '</div>';
        if (i.tekst) h += '<p class="tekst' + a(n++) + '">' + opmaak(i.tekst) + '</p>';
        h += puntenHtml(i.punten, n);
        h += '</div>';
        var link = i.qr || i.link;
        h += '<div class="zijkant anim" style="--i:4">' +
             (link ? qrKaart(websiteUrl(link), i.qr_label || 'Scan & solliciteer') : '<img src="media/beeldmerk.svg" alt="" style="width:420px">') + '</div>';
        el.innerHTML = h;
        return el;
      }
    },

    contact: {
      geldig: function (i) { return heeftContact(i); },
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'donker', 'blauw'), b = bedrijf(), n = 0, h = '';
        var tel = i.telefoon || b.telefoon, mail = i.email || b.email, web = i.website || b.website, adres = i.adres || b.adres;
        h += '<div class="inhoud" data-pas>' + kopHtml(i, n++, 'Contact');
        h += '<div class="titel' + a(n++) + '" data-regels="2">' + opmaak(i.titel || 'Vrijblijvend advies of een offerte?') + '</div>';
        if (i.tekst) h += '<p class="tekst' + a(n++) + '">' + opmaak(i.tekst) + '</p>';
        h += '<div class="regels">';
        [['telefoon', tel], ['mail', mail], ['web', web ? websiteTekst(web) : ''], ['adres', adres]].forEach(function (r) {
          if (r[1]) h += '<div class="regel' + a(n++) + '"><span class="rond">' + icoon(r[0]) + '</span><span>' + opmaak(r[1]) + '</span></div>';
        });
        h += '</div></div>';
        var qr = i.qr === false ? '' : (i.qr || web);
        if (qr) h += '<div class="zijkant anim" style="--i:' + n + '">' + qrKaart(websiteUrl(qr), i.qr_label || 'Scan voor onze website') + '</div>';
        el.innerHTML = h;
        return el;
      }
    },

    cijfers: {
      geldig: function (i) { return lijst(i.items).length > 0; },
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'kleur', 'blauw'), h = '';
        h += '<div class="kader-kop">' + kopHtml(i, 0, '');
        if (i.titel) h += '<div class="titel' + a(1) + '" data-regels="1">' + opmaak(i.titel) + '</div>';
        h += '</div><div class="rij">';
        lijst(i.items).slice(0, 4).forEach(function (it, k) {
          h += '<div class="cijfer' + a(2 + k) + '"><div class="getal" data-getal="' + esc(it.getal) + '">' + esc(it.getal) + '</div>' +
               '<div class="label">' + opmaak(it.label || '') + '</div></div>';
        });
        h += '</div>';
        el.innerHTML = h;
        return el;
      },
      naTonen: function (el) {
        [].forEach.call(el.querySelectorAll('[data-getal]'), function (g) {
          var m = /^([^0-9]*)([0-9][0-9.]*)(.*)$/.exec(g.getAttribute('data-getal'));
          if (!m) return;
          var doel = parseInt(m[2].replace(/\./g, ''), 10);
          if (isNaN(doel) || doel < 10) return;
          var start = null;
          function stap(t) {
            if (start === null) start = t;
            var p = Math.min(1, (t - start) / 1600), e = 1 - Math.pow(1 - p, 3);
            g.textContent = m[1] + Math.round(doel * e).toLocaleString('nl-NL') + m[3];
            if (p < 1) requestAnimationFrame(stap);
          }
          setTimeout(function () { requestAnimationFrame(stap); }, 500);
        });
      }
    },

    video: {
      geldig: function (i) { return !!i.url && !kapot[media(i.url)]; },
      bouw: function (s) {
        var i = s.inhoud, el = basis(s, 'donker', 'rood');
        if (i.passend) el.classList.add('passend');
        var v = document.createElement('video');
        v.muted = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
        v.src = media(i.url);
        el.appendChild(v);
        v.onerror = function () { kapot[media(i.url)] = true; if (huidig && huidig.el === el) toonVolgende(1); };
        v.onended = function () { if (!s.duur && huidig && huidig.el === el && !gepauzeerd) toonVolgende(1); };
        return el;
      },
      naTonen: function (el) { var v = el.querySelector('video'); if (v && v.play) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
    }
  };

  var LEGE_SLIDE = { naam: '_leeg', type: '_leeg', inhoud: {} };
  function bouwLeeg() {
    var el = document.createElement('section');
    el.className = 'slide t-leeg licht k-blauw';
    el.innerHTML = '<img class="anim" src="' + esc(media(bedrijf().logo)) + '" alt="">';
    return el;
  }

  // ---------------------------------------------------------------- afspeellijst
  function isGeldig(s, d, voorbeeld) {
    var type = TYPES[s.type];
    if (!type) return false;
    if (!voorbeeld) {
      if (!s.actief) return false;
      var dag = datumSleutel(d);
      if (s.van && dag < s.van) return false;
      if (s.tot && dag > s.tot) return false;
      if (s.dagen.length && s.dagen.indexOf(DAGCODES[d.getDay()]) === -1) return false;
      if (s.schermen.length && s.schermen.indexOf(OPTIES.scherm) === -1) return false;
    }
    try { return type.geldig ? !!type.geldig(s.inhoud, s) : true; } catch (e) { return false; }
  }
  function speellijst() {
    if (!inhoud) return [];
    var d = nu();
    if (OPTIES.slide) {
      var gezocht = OPTIES.slide.toLowerCase();
      var gevonden = inhoud.slides.filter(function (s, k) { return s.naam.toLowerCase() === gezocht || String(k + 1) === gezocht; })[0];
      return gevonden && isGeldig(gevonden, d, true) ? [gevonden] : [];
    }
    return inhoud.slides.filter(function (s) { return isGeldig(s, d, false); });
  }
  function slideDuur(s) {
    if (s.duur) return Math.max(3, s.duur);
    return Math.max(3, getal(weergave().standaard_duur, 12));
  }

  // ---------------------------------------------------------------- afspelen
  var huidig = null;            // { slide, el }
  var huidigePositie = -1;
  var wisselTimer = null;
  var laatsteWissel = Date.now();
  var gepauzeerd = OPTIES.pauze;
  var nachtActief = false;

  function toonVolgende(stap) {
    if (stap == null) stap = 1;
    clearTimeout(wisselTimer);
    if (nachtActief) return;
    var lijstNu = speellijst();
    var n = lijstNu.length;
    if (!n) {
      if (!huidig || huidig.slide.type !== '_leeg') toon(LEGE_SLIDE, bouwLeeg(), 0);
      wisselTimer = setTimeout(function () { toonVolgende(1); }, 15000);
      return;
    }
    var pos = -1;
    if (huidig) for (var k = 0; k < n; k++) if (lijstNu[k].naam === huidig.slide.naam) { pos = k; break; }
    var start = pos === -1 ? (huidigePositie < 0 ? 0 : huidigePositie % n) : (((pos + stap) % n) + n) % n;
    if (pos === -1 && stap < 0) start = ((start - 1) % n + n) % n;

    for (var poging = 0; poging < n; poging++) {
      var richting = stap < 0 ? -1 : 1;
      var idx = (((start + poging * richting) % n) + n) % n;
      var s = lijstNu[idx];
      var duur = slideDuur(s);
      var el = null;
      try { el = TYPES[s.type].bouw(s, duur); } catch (e) { log('slide "' + s.naam + '" kon niet worden opgebouwd', e); }
      if (el) { huidigePositie = idx; toon(s, el, duur); return; }
    }
    toon(LEGE_SLIDE, bouwLeeg(), 0);
    wisselTimer = setTimeout(function () { toonVolgende(1); }, 15000);
  }

  function toon(s, el, duur) {
    var container = $('slides');
    var oud = [].slice.call(container.querySelectorAll('.slide'));
    container.appendChild(el);
    pasTekstAan(el);
    var type = TYPES[s.type];
    void el.offsetWidth;   // forceer opmaak zodat de overgang start
    requestAnimationFrame(function () {
      el.classList.add('actief');
      oud.forEach(function (o) {
        o.classList.remove('actief');
        o.classList.add('weg');
        var v = o.querySelector('video'); if (v) { try { v.pause(); } catch (e) { /* niets */ } }
        setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 1100);
      });
      if (type && type.naTonen) type.naTonen(el);
    });
    huidig = { slide: s, el: el };
    laatsteWissel = Date.now();

    var kleur = (/\bk-(rood|geel|blauw|groen)\b/.exec(el.className) || [0, 'blauw'])[1];
    var wachtOpVideo = s.type === 'video' && !s.duur;
    startVoortgang(wachtOpVideo ? 0 : duur, kleur);
    if (!gepauzeerd && duur && !wachtOpVideo) wisselTimer = setTimeout(function () { toonVolgende(1); }, duur * 1000);
    if (wachtOpVideo) wisselTimer = setTimeout(function () { toonVolgende(1); }, 10 * 60 * 1000);  // vangnet
    laadVolgendeVooraf();
    toonDebug();
  }

  function startVoortgang(sec, kleur) {
    var b = $('voortgang-balk');
    b.style.transition = 'none';
    b.style.width = '0';
    b.style.background = 'var(--' + kleur + ')';
    if (!sec || gepauzeerd) return;
    void b.offsetWidth;
    b.style.transition = 'width ' + sec + 's linear';
    b.style.width = '100%';
  }

  // Afbeeldingen van de volgende slide alvast inladen
  function laadVolgendeVooraf() {
    var l = speellijst();
    if (l.length < 2) return;
    var s = l[(huidigePositie + 1) % l.length];
    ['afbeelding', 'achtergrond', 'voor', 'na'].forEach(function (k) {
      if (s.inhoud[k]) { var img = new Image(); img.src = media(s.inhoud[k]); }
    });
  }

  // Te lange teksten automatisch kleiner maken
  function pasTekstAan(root) {
    [].forEach.call(root.querySelectorAll('[data-regels]'), function (e) {
      // Aantal regels bepalen t.o.v. de hoogte van één regel (werkt ook bij lettertypes met hoge stokken).
      var regels = +e.getAttribute('data-regels');
      var origineel = e.innerHTML;
      var fs = parseFloat(getComputedStyle(e).fontSize);
      var min = fs * 0.5, g = 0;
      function past() {
        var lh = parseFloat(getComputedStyle(e).lineHeight);
        if (isNaN(lh)) lh = parseFloat(getComputedStyle(e).fontSize) * 1.25;
        e.innerHTML = 'X';
        var eenRegel = e.scrollHeight;
        e.innerHTML = origineel;
        return e.scrollHeight <= eenRegel + (regels - 1) * lh + 2;
      }
      while (!past() && fs > min && g++ < 30) {
        fs *= 0.93;
        e.style.fontSize = fs + 'px';
      }
    });
    [].forEach.call(root.querySelectorAll('[data-pas]'), function (c) {
      var cs = getComputedStyle(c);
      var beschikbaar = c.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      var g = 0;
      function hoogte() {
        var kids = c.children;
        if (!kids.length) return 0;
        var eerste = kids[0], laatste = kids[kids.length - 1];
        return laatste.offsetTop + laatste.offsetHeight - eerste.offsetTop;
      }
      while (hoogte() > beschikbaar && g++ < 12) {
        [].forEach.call(c.querySelectorAll('.titel, .tekst, .punten li, .functie, .quote, .regel, .kop'), function (e) {
          e.style.fontSize = (parseFloat(getComputedStyle(e).fontSize) * 0.92) + 'px';
        });
      }
    });
  }

  // ---------------------------------------------------------------- ticker & mededeling
  var tickerSignatuur = '';
  function zetTicker(berichten) {
    berichten = lijst(berichten).map(function (b) { return String(b).trim(); }).filter(Boolean);
    if (!berichten.length) {
      var b = bedrijf();
      berichten = [b.slogan || b.naam || ''].filter(Boolean);
    }
    var sig = JSON.stringify(berichten);
    if (sig === tickerSignatuur) return;
    tickerSignatuur = sig;
    var baan = $('ticker-baan'), vak = $('ticker');
    baan.className = '';
    baan.style.removeProperty('--tickerduur');
    if (!berichten.length) { baan.innerHTML = ''; return; }
    var reeks = berichten.map(function (b, k) {
      return '<span class="ticker-item">' + opmaak(b) + '</span><span class="ticker-scheiding" style="background:var(--' + KLEUREN[k % 4] + ')"></span>';
    }).join('');
    baan.innerHTML = '<span class="ticker-item">' + opmaak(berichten[0]) + '</span>';
    if (berichten.length === 1 && baan.scrollWidth <= vak.clientWidth - 60) { baan.className = 'stil'; return; }
    baan.innerHTML = reeks;
    var herhaald = reeks, g = 0;
    while (baan.scrollWidth < vak.clientWidth + 200 && g++ < 10) { herhaald += reeks; baan.innerHTML = herhaald; }
    baan.innerHTML = herhaald + herhaald;
    var afstand = baan.scrollWidth / 2;
    var snelheid = Math.max(30, getal(weergave().ticker_snelheid, 110));
    baan.style.setProperty('--tickerduur', (afstand / snelheid).toFixed(1) + 's');
    baan.className = 'loopt';
  }

  var mededelingSignatuur = '';
  function zetMededeling(m) {
    var tekst = '', kleur = 'rood', tot = null;
    if (typeof m === 'string') tekst = m;
    else if (m && typeof m === 'object') { tekst = m.tekst || ''; kleur = kies(m.kleur, KLEUREN, 'rood'); tot = m.tot || null; }
    if (tot) { var t = new Date(tot); if (!isNaN(t.getTime()) && nu() > t) tekst = ''; }
    var sig = JSON.stringify([tekst, kleur]);
    if (sig === mededelingSignatuur) return;
    mededelingSignatuur = sig;
    var box = $('mededeling');
    box.className = 'k-' + kleur;
    box.style.setProperty('--accent', 'var(--' + kleur + ')');
    $('mededeling-tekst').innerHTML = opmaak(tekst);
    box.hidden = !tekst;
    $('podium').classList.toggle('met-mededeling', !!tekst);
  }

  // ---------------------------------------------------------------- klok & nachtstand
  var vorigeMinuut = -1;
  function tikKlok() {
    var d = nu();
    $('klok-tijd').textContent = twee(d.getHours()) + ':' + twee(d.getMinutes());
    var datum = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
    $('klok-datum').textContent = datum.charAt(0).toUpperCase() + datum.slice(1);
    if (d.getMinutes() !== vorigeMinuut) {
      vorigeMinuut = d.getMinutes();
      controleerNacht();
      if (inhoud) zetMededeling(instelling('mededeling', null));   // voor mededelingen met een eindtijd
    }
  }
  function isNacht(d) {
    var n = instelling('nachtstand', null);
    if (!n || !n.aan) return false;
    var wd = d.getDay();
    if (n.weekend && (wd === 0 || wd === 6)) return true;
    var van = minuten(n.van), tot = minuten(n.tot);
    if (van === null || tot === null || van === tot) return false;
    var m = d.getHours() * 60 + d.getMinutes();
    return van < tot ? (m >= van && m < tot) : (m >= van || m < tot);
  }
  function controleerNacht() {
    var nacht = !OPTIES.slide && isNacht(nu());
    if (nacht === nachtActief) { if (nacht) verplaatsNachtKlok(); return; }
    nachtActief = nacht;
    $('nachtstand').hidden = !nacht;
    if (nacht) {
      clearTimeout(wisselTimer);
      if (huidig) { var v = huidig.el.querySelector('video'); if (v) v.pause(); }
      verplaatsNachtKlok();
    } else {
      toonVolgende(1);
    }
  }
  function verplaatsNachtKlok() {
    var k = $('nacht-klok'), d = nu();
    k.textContent = twee(d.getHours()) + ':' + twee(d.getMinutes());
    k.style.left = (100 + Math.random() * 1500) + 'px';
    k.style.top = (100 + Math.random() * 800) + 'px';
  }

  // ---------------------------------------------------------------- scherm & bediening
  function schaal() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    $('podium').style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  async function houdWakker() {
    try { if (navigator.wakeLock && document.visibilityState === 'visible') await navigator.wakeLock.request('screen'); } catch (e) { /* niet ondersteund */ }
  }
  function volledigScherm() {
    var d = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    var f = d.requestFullscreen || d.webkitRequestFullscreen;
    if (f) { try { var p = f.call(d); if (p && p.catch) p.catch(function () {}); } catch (e) { /* niets */ } }
  }
  function dagelijksHerladen() {
    // Elke nacht om 04:00 opnieuw laden: haalt nieuwe versies van de speler op en houdt het geheugen schoon.
    var d = new Date(), doel = new Date(d);
    doel.setHours(4, 0, 0, 0);
    if (doel <= d) doel.setDate(doel.getDate() + 1);
    setTimeout(function () { location.reload(); }, doel - d);
  }
  function toetsen() {
    document.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === 'MediaTrackNext') toonVolgende(1);
      else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'MediaTrackPrevious') toonVolgende(-1);
      else if (k === ' ' || k === 'MediaPlayPause') {
        gepauzeerd = !gepauzeerd;
        if (gepauzeerd) { clearTimeout(wisselTimer); startVoortgang(0, 'blauw'); } else toonVolgende(1);
      } else if (k === 'f' || k === 'F') volledigScherm();
      else if (k === 'd' || k === 'D') { OPTIES.debug = !OPTIES.debug; toonDebug(); }
      else return;
      e.preventDefault();
    });
    document.addEventListener('click', volledigScherm);
    var muisTimer = null;
    document.addEventListener('mousemove', function () {
      document.body.classList.add('muis');
      clearTimeout(muisTimer);
      muisTimer = setTimeout(function () { document.body.classList.remove('muis'); }, 3000);
    });
  }
  function toonDebug() {
    var box = $('melding-debug');
    box.hidden = !OPTIES.debug;
    if (!OPTIES.debug) return;
    var l = speellijst().map(function (s) { return s.naam; });
    box.textContent = 'bron: ' + bronGebruikt + (laatsteSucces ? ' · laatst opgehaald ' + new Date(laatsteSucces).toLocaleTimeString('nl-NL') : '') +
      '\nnu: ' + (huidig ? huidig.slide.naam : '-') + (gepauzeerd ? ' (pauze)' : '') +
      '\nin rotatie (' + l.length + '): ' + l.join(', ') +
      (OPTIES.scherm ? '\nscherm: ' + OPTIES.scherm : '') +
      '\nweer: ' + (weerStaat.data ? weerStaat.data.plaats : 'geen');
  }
  // Vangnet: als er om wat voor reden dan ook niet meer gewisseld wordt, zelf weer starten.
  function waakhond() {
    if (gepauzeerd || nachtActief || !huidig) return;
    var max = (huidig.slide.type === 'video' ? 11 * 60 : slideDuur(huidig.slide)) * 1000 + 60000;
    if (Date.now() - laatsteWissel > max) { log('waakhond: herstart afspelen'); toonVolgende(1); }
  }

  // ---------------------------------------------------------------- start
  function start() {
    schaal();
    window.addEventListener('resize', schaal);
    tikKlok();
    setInterval(tikKlok, 1000);
    setInterval(waakhond, 30000);
    setInterval(function () { weerBijwerken(); }, 10 * 60 * 1000);
    laadWeerCache();
    // Eerst de lettertypes laden (max. 3 s), zodat tekstmaten meteen kloppen.
    var fonts = document.fonts && document.fonts.load ? Promise.all(['400', '500', '600', '700', '800'].map(function (w) {
      return document.fonts.load(w + ' 40px Poppins');
    })) : Promise.resolve();
    Promise.race([fonts, new Promise(function (r) { setTimeout(r, 3000); })]).catch(function () {}).then(function () {
      var cache = leesCache();
      if (cache) verwerkInhoud(cache, 'cache');
      ververs();
    });
    houdWakker();
    document.addEventListener('visibilitychange', houdWakker);
    dagelijksHerladen();
    toetsen();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { tickerSignatuur = ''; if (inhoud) zetTicker(instelling('ticker', [])); });
    }
    window.addEventListener('error', function (e) { log('fout:', e.message); });
    window.addEventListener('unhandledrejection', function (e) { log('fout (promise):', e.reason); });
    window.__narrowcasting = { volgende: function () { toonVolgende(1); }, status: function () { return { bron: bronGebruikt, huidig: huidig && huidig.slide.naam, rotatie: speellijst().map(function (s) { return s.naam; }) }; } };
  }

  start();
})();
