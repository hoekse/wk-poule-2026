/* Diepblauw — opslag van voortgang (localStorage, met veilige terugval) */
(function (DG) {
  'use strict';
  const KEY = 'diepblauw-save-v1';
  const S = (DG.Save = {});

  S.defaults = function () {
    return {
      v: 1,
      budget: DG.START_BUDGET,
      owned: {},
      equip: {},
      courses: {},
      species: {},
      dives: [],
      photos: [],
      settings: { sound: true, music: true },
      introSeen: false,
      gas: 'air',
      earned: 0,
      seenUnlocks: [],
    };
  };

  S.load = function () {
    let d = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) d = JSON.parse(raw);
    } catch (e) { d = null; }
    S.data = Object.assign(S.defaults(), d || {});
    S.data.settings = Object.assign(S.defaults().settings, S.data.settings || {});
    // bestaande spelers: wat al vrij was niet opnieuw melden
    if (!S.data.seenUnlocks && DG.GEAR) S.data.seenUnlocks = S.unlockedIds();
    return S.data;
  };

  S.save = function () {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(S.data));
    } catch (e) {
      // opslag vol (foto's): oudste foto's weggooien en opnieuw proberen
      if (S.data.photos.length > 5) {
        S.data.photos = S.data.photos.slice(-Math.floor(S.data.photos.length / 2));
        try { window.localStorage.setItem(KEY, JSON.stringify(S.data)); } catch (e2) { /* niets aan te doen */ }
      }
    }
  };

  S.reset = function () {
    S.data = S.defaults();
    S.save();
  };

  S.hasData = function () {
    return S.data && (S.data.dives.length > 0 || Object.keys(S.data.owned).length > 0);
  };

  S.maxDepth = function () {
    const c = S.data.courses;
    return c.k_deep ? 40 : c.k_aow ? 30 : 18;
  };
  S.brevet = function () {
    const c = S.data.courses;
    return c.k_deep ? 'Advanced + Diep' : c.k_aow ? 'Advanced Open Water' : 'Open Water';
  };
  S.hasNitrox = () => !!S.data.courses.k_nitrox;

  // Voortgang waarmee je spullen en cursussen vrijspeelt
  S.progress = function () {
    const d = S.data;
    return {
      dives: d.dives.length,
      species: Object.keys(d.species || {}).length,
      challenges: Object.keys(d.challenges || {}).length,
    };
  };
  // eisen die nog niet gehaald zijn, als tekst ([] = vrijgespeeld)
  S.missingFor = function (item) {
    const u = item.unlock, d = S.data;
    if (!u || (d.owned && d.owned[item.id])) return [];
    const p = S.progress(), out = [];
    if (u.course && !d.courses[u.course]) out.push(DG.courseById(u.course).name);
    if (u.dives && p.dives < u.dives) out.push(u.dives + ' gelogde duiken (nog ' + (u.dives - p.dives) + ')');
    if (u.species && p.species < u.species) out.push(u.species + ' soorten ontdekt (nog ' + (u.species - p.species) + ')');
    if (u.challenges && p.challenges < u.challenges) out.push(u.challenges + ' fotochallenges (nog ' + (u.challenges - p.challenges) + ')');
    return out;
  };
  S.isUnlocked = (item) => S.missingFor(item).length === 0;
  // alles wat vrijgespeeld moet worden en inmiddels vrij is
  S.unlockedIds = function () {
    return DG.GEAR.concat(DG.COURSES).filter((g) => g.unlock && S.isUnlocked(g)).map((g) => g.id);
  };
  // nieuw vrijgespeeld sinds de vorige keer (en meteen als gezien markeren)
  S.takeNewUnlocks = function () {
    const seen = S.data.seenUnlocks || (S.data.seenUnlocks = []);
    const fresh = S.unlockedIds().filter((id) => seen.indexOf(id) < 0);
    fresh.forEach((id) => seen.push(id));
    if (fresh.length) S.save();
    return fresh.map((id) => DG.gearById(id) || DG.courseById(id));
  };

  S.equipped = function (cat) {
    const id = S.data.equip[cat];
    return id ? DG.gearById(id) : null;
  };

  S.kitMissing = function () {
    return DG.CATEGORIES.filter((c) => c.required && !S.data.equip[c.id]);
  };

  // Afgeleide eigenschappen van de huidige uitrusting
  S.loadout = function () {
    const g = (cat) => S.equipped(cat);
    const st = (cat, k, def) => { const it = g(cat); return it && it.stats[k] != null ? it.stats[k] : def; };
    const look = {};
    DG.CATEGORIES.forEach((c) => { const it = g(c.id); if (it) Object.assign(look, it.look); });
    const lamp = g('lamp'), cam = g('camera');
    return {
      speed: st('vinnen', 'snelheid', 1) * st('pak', 'snelheid', 1) * st('trimvest', 'snelheid', 1),
      sac: st('vinnen', 'sac', 1) * st('trimvest', 'sac', 1) * st('automaat', 'sac', 1),
      warmth: st('pak', 'warmte', 26),
      coldReg: !!st('automaat', 'koud', false),
      tankL: st('fles', 'liter', 12),
      ai: !!st('computer', 'ai', false),
      vision: st('masker', 'zicht', 1),
      lamp: lamp ? lamp.stats : null,
      camera: cam ? cam.stats : null,
      maxDepth: S.maxDepth(),
      gas: S.hasNitrox() && S.data.gas === 'ean32' ? 'ean32' : 'air',
      look,
    };
  };
})(window.DG);
