/* Diepblauw — spelgegevens: uitrusting, cursussen, soorten en duikstekken */
(function (DG) {
  'use strict';

  DG.START_BUDGET = 2500;
  DG.TIME_SCALE = 8; // 1 echte seconde = 8 seconden duiktijd

  /* ------------------------------------------------------------------
   * Winkel: categorieën en producten (fictieve spelprijzen)
   * ------------------------------------------------------------------ */
  DG.CATEGORIES = [
    { id: 'masker', name: 'Duikbril', icon: '🥽', required: true, photo: 'img/winkel-vinnen.jpg',
      intro: 'Een goed passende duikbril is het begin van alles. Druk hem zonder bandje tegen je gezicht: blijft hij zitten, dan past hij.' },
    { id: 'vinnen', name: 'Vinnen', icon: '🦶', required: true, photo: 'img/winkel-vinnen.jpg',
      intro: 'Snelheid, stuurvastheid of zuinig zwemmen: elke vin heeft zijn karakter.' },
    { id: 'pak', name: 'Duikpak', icon: '🧥', required: true, photo: 'img/winkel-duikpakken.jpg', photo2: 'img/winkel-paspoppen.jpg',
      intro: 'Kies je pak op de watertemperatuur. Te koud = meer luchtverbruik en een kortere duik.' },
    { id: 'trimvest', name: 'Trimvest', icon: '🦺', required: true, photo: 'img/winkel-overzicht.jpg',
      intro: 'Met een goed trimvest lig je mooi horizontaal en zwem je efficiënter.' },
    { id: 'automaat', name: 'Ademautomaat', icon: '🫧', required: true, photo: 'img/winkel-ademautomaten.jpg',
      intro: 'Je levenslijn onder water. In koud water wil je een automaat die niet bevriest.' },
    { id: 'fles', name: 'Duikfles', icon: '🛢️', required: true, photo: 'img/winkel-meters.jpg',
      intro: 'Meer liters = langer onderwater. Gevuld op 200 bar.' },
    { id: 'computer', name: 'Duikcomputer', icon: '⌚', required: true, photo: 'img/winkel-overzicht.jpg',
      intro: 'Houdt diepte, tijd en je nultijd (NDL) bij. Zonder computer geen duik.' },
    { id: 'lamp', name: 'Duiklamp', icon: '🔦', required: false, photo: 'img/winkel-accessoires.jpg',
      intro: 'Onder water verdwijnt eerst het rood. Een lamp brengt de kleuren terug en laat verstopte dieren zien.' },
    { id: 'camera', name: 'Camera', icon: '📷', required: false, photo: 'img/winkel-logboeken.jpg',
      intro: 'Maak foto’s voor je logboek. Met flitsers krijg je de échte kleuren terug.' },
    { id: 'cursus', name: 'Cursussen', icon: '🎓', required: false, photo: 'img/winkel-logboeken.jpg',
      intro: 'Je start met een Open Water-brevet (max. 18 m). Wil je dieper of met nitrox? Volg een cursus.' },
  ];

  /* Huren bij De Tuimelaar en vrijspelen: er is geen spelgeld. Alles huur je bij De Tuimelaar.
     De basisset is meteen te huur; betere spullen en cursussen speel je vrij met gelogde duiken
     (dives), ontdekte soorten (species), gehaalde fotochallenges (challenges) of een brevet (course).
     price is alleen nog een indicatie van de winkelprijs. */
  DG.GEAR = [
    // Duikbril
    { id: 'm_basis', cat: 'masker', name: 'Basic duikbril', price: 39,
      desc: 'Degelijk siliconen masker met helder glas.', stats: { zicht: 1.0 }, look: { mask: '#3d7fbf', maskFrame: '#9fd0f0' } },
    { id: 'm_hd', unlock: { dives: 2 }, cat: 'masker', name: 'Low-volume HD-masker', price: 95,
      desc: 'Klein binnenvolume en ontspiegeld glas: breder zicht, minder randvignet.', stats: { zicht: 1.25 }, look: { mask: '#151515', maskFrame: '#2a2a2a' } },
    // Vinnen
    { id: 'v_allround', cat: 'vinnen', name: 'Allround vinnen', price: 65,
      desc: 'Lichte vinnen voor elke duik. Prima om mee te beginnen.', stats: { snelheid: 1.0 }, look: { fin: '#f2c21a' } },
    { id: 'v_split', unlock: { dives: 3 }, cat: 'vinnen', name: 'Split-fins', price: 129,
      desc: 'Minder kracht per slag, dus zuiniger met lucht.', stats: { snelheid: 1.08, sac: 0.95 }, look: { fin: '#2a7ad8', split: true } },
    { id: 'v_jet', unlock: { course: 'k_aow' }, cat: 'vinnen', name: 'Jet fins (zwaar rubber)', price: 159,
      desc: 'Krachtig en stuurvast. Ideaal tegen de stroming van Darwin of de Dampier Strait.', stats: { snelheid: 1.22 }, look: { fin: '#1b1b1b', jet: true } },
    // Duikpak
    { id: 'p_shorty', cat: 'pak', name: 'Shorty 3 mm', price: 99,
      desc: 'Korte mouwen en pijpen. Comfortabel vanaf ±26 °C.', stats: { warmte: 26 }, look: { suit: 'shorty', suitC: '#1c1c20', accent: '#d8402a' } },
    { id: 'p_5mm', cat: 'pak', name: 'Natpak 5 mm', price: 229,
      desc: 'Volledig pak, comfortabel vanaf ±22 °C.', stats: { warmte: 22 }, look: { suit: 'full', suitC: '#1c1c20', accent: '#4a90d8' } },
    { id: 'p_semidry', unlock: { dives: 4 }, cat: 'pak', name: 'Semi-droogpak 7 mm', price: 429,
      desc: 'Dichte manchetten en een kap. Comfortabel vanaf ±16 °C.', stats: { warmte: 16 }, look: { suit: 'full', hood: true, suitC: '#18181c', accent: '#2ab0a0' } },
    { id: 'p_droog', unlock: { dives: 8, course: 'k_aow' }, cat: 'pak', name: 'Droogpak (trilaminaat)', price: 1395,
      desc: 'Je blijft droog en warm, ook in de Oosterschelde. In de tropen wordt het wel erg warm…', stats: { warmte: 4, snelheid: 0.95 }, look: { suit: 'dry', hood: true, suitC: '#2a2c33', accent: '#e8b020' } },
    // Trimvest
    { id: 't_jacket', cat: 'trimvest', name: 'Jacket-trimvest', price: 399,
      desc: 'Vertrouwd en stabiel aan de oppervlakte.', stats: { sac: 1.0 }, look: { bcd: 'jacket', bcdC: '#1a1a1e', bcdAccent: '#f2c21a' } },
    { id: 't_wing', unlock: { dives: 5 }, cat: 'trimvest', name: 'Backplate & wing', price: 595,
      desc: 'Perfecte horizontale trim: minder weerstand, minder luchtverbruik.', stats: { sac: 0.93, snelheid: 1.04 }, look: { bcd: 'wing', bcdC: '#2a2a2e', bcdAccent: '#a8b0b8' } },
    // Ademautomaat
    { id: 'a_basis', cat: 'automaat', name: 'Ademautomaat standaard', price: 279,
      desc: 'Betrouwbare set voor warm water.', stats: { sac: 1.0, koud: false }, look: { reg: '#202020' } },
    { id: 'a_koud', unlock: { dives: 3 }, cat: 'automaat', name: 'Koudwater-ademautomaat', price: 549,
      desc: 'Afgesloten eerste trap: bevriest niet in koud water en ademt licht.', stats: { sac: 0.96, koud: true }, look: { reg: '#f2c21a' } },
    // Fles
    { id: 'f_10', cat: 'fles', name: 'Stalen fles 10 liter', price: 249,
      desc: '2000 liter lucht bij 200 bar.', stats: { liter: 10 }, look: { tank: '#c9ced3', tankLen: 0.62 } },
    { id: 'f_12', cat: 'fles', name: 'Stalen fles 12 liter', price: 299,
      desc: '2400 liter lucht bij 200 bar. De standaard op duikstekken wereldwijd.', stats: { liter: 12 }, look: { tank: '#f0c020', tankLen: 0.7 } },
    { id: 'f_15', unlock: { dives: 5 }, cat: 'fles', name: 'Stalen fles 15 liter', price: 389,
      desc: '3000 liter lucht: voor lange duiken en grotere ademhalers.', stats: { liter: 15 }, look: { tank: '#e9ecef', tankLen: 0.8 } },
    // Computer
    { id: 'c_basis', cat: 'computer', name: 'Duikcomputer basis', price: 229,
      desc: 'Diepte, duiktijd, nultijd (NDL), opstijgsnelheid en veiligheidsstop.', stats: { ai: false }, look: { comp: '#222' } },
    { id: 'c_ai', unlock: { species: 12 }, cat: 'computer', name: 'Luchtgeïntegreerde computer + kompas', price: 749,
      desc: 'Toont ook je resterende luchttijd én een kompaspijl terug naar de boot of de kant.', stats: { ai: true }, look: { comp: '#1a5aa8' } },
    // Lamp
    { id: 'l_compact', cat: 'lamp', name: 'Compacte duiklamp', price: 89,
      desc: 'Handig voor in gaatjes en spleten kijken.', stats: { bereik: 4.5, hoek: 0.36 }, look: { lamp: 'compact' } },
    { id: 'l_primair', unlock: { dives: 2 }, cat: 'lamp', name: 'Primaire lamp 3000 lumen', price: 329,
      desc: 'Brede, verre lichtbundel. Ook in groen Oosterscheldewater zie je weer kleur.', stats: { bereik: 8, hoek: 0.46 }, look: { lamp: 'primair' } },
    // Camera
    { id: 'cam_compact', cat: 'camera', name: 'Compacte onderwatercamera', price: 399,
      desc: 'Leuke kiekjes; dieper wordt alles blauw (zonder lamp).', stats: { bereik: 3.5, flits: false, bonus: 1.0 }, look: { cam: 'compact' } },
    { id: 'cam_pro', unlock: { challenges: 3 }, cat: 'camera', name: 'Systeemcamera + 2 flitsers', price: 1499,
      desc: 'Flitsers brengen de échte kleuren terug. Meer sterren, meer beloning.', stats: { bereik: 5, flits: true, bonus: 1.6 }, look: { cam: 'pro' } },
  ];

  DG.COURSES = [
    { id: 'k_aow', unlock: { dives: 3 }, name: 'Advanced Open Water', price: 299, maxDepth: 30,
      desc: 'Vijf avonturenduiken, waaronder diep en navigatie. Je mag daarna tot 30 meter.' },
    { id: 'k_deep', unlock: { dives: 8 }, name: 'Diepduiken specialty', price: 249, maxDepth: 40, requires: 'k_aow',
      desc: 'Leer plannen en duiken tot 40 meter. Nodig voor de hamerhaaien van Elphinstone.' },
    { id: 'k_nitrox', unlock: { dives: 2 }, name: 'Nitrox specialty', price: 179, nitrox: true,
      desc: 'Duik met verrijkte lucht (EAN32): langere nultijden. Let op je maximale diepte van 33 m.' },
  ];

  /* ------------------------------------------------------------------
   * Soorten. size = lengte in meters (bij roggen: spanwijdte).
   * ds = tekenschaal (kleine diertjes groter getekend zodat je ze ziet).
   * r: 1 = algemeen, 2 = bijzonder, 3 = zeldzaam
   * ------------------------------------------------------------------ */
  DG.RARITY = { 1: { name: 'Algemeen', pts: 40 }, 2: { name: 'Bijzonder', pts: 80 }, 3: { name: 'Zeldzaam', pts: 150 } };

  const S = (DG.SPECIES = {});
  function sp(id, name, latin, size, r, fact, art, extra) {
    S[id] = Object.assign({ id, name, latin, size, r, fact, art, ds: 1, log: true }, extra || {});
  }

  // --- Bonaire, Zoutpier
  sp('tarpon', 'Tarpon', 'Megalops atlanticus', 1.6, 1,
    'Tarpons kunnen lucht happen aan de oppervlakte: hun zwemblaas werkt als een extra long. Ze worden meer dan 2 meter lang.',
    { t: 'fish', shape: 'torpedo', h: 0.26, c: '#c3ced6', c2: '#f2f5f7', fin: '#8d9aa5', tail: 'fork', snout: 'up', dorsal: 'normal',
      pat: [{ k: 'saddle', c: '#5f7484' }, { k: 'scales', c: 'rgba(80,100,120,0.35)', s: 0.055 }], eye: { r: 0.045, ring: '#d8d0a0' } });
  sp('karet', 'Karetschildpad', 'Eretmochelys imbricata', 0.85, 2,
    'De karetschildpad eet vooral sponzen en heeft een snavel als een roofvogel. De soort is ernstig bedreigd.',
    { t: 'turtle', v: 'hawksbill' });
  sp('franse_keizer', 'Franse keizersvis', 'Pomacanthus paru', 0.35, 1,
    'Zwart met gele randjes op elke schub. Ze zwemmen vaak in vaste paartjes en zijn nieuwsgierig naar duikers.',
    { t: 'fish', shape: 'disc', h: 0.82, c: '#1f1f25', c2: '#2a2a31', fin: '#1f1f25', tail: 'round', dorsal: 'trail',
      pat: [{ k: 'scales', c: '#f5d23a', s: 0.045 }, { k: 'patch', x: 0.44, y: 0.1, rx: 0.05, ry: 0.25, c: '#f5d23a' }], eye: { ring: '#f5d23a' } });
  sp('koningin_keizer', 'Koninginnekeizersvis', 'Holacanthus ciliaris', 0.35, 2,
    'Herkenbaar aan de blauwe ‘kroon’ met lichtblauwe stippen op het voorhoofd. Een van de mooiste vissen van de Cariben.',
    { t: 'fish', shape: 'disc', h: 0.76, c: '#2f86c8', c2: '#c8d84a', fin: '#2a6fd0', tail: 'round', tailC: '#f7d21e', dorsal: 'trail',
      pat: [{ k: 'fade', x0: 0.25, x1: -0.3, c0: '#2b72d0', c1: '#e8d633', a: 0.7 }, { k: 'scales', c: 'rgba(255,240,120,0.4)', s: 0.045 },
        { k: 'patch', x: 0.26, y: -0.78, rx: 0.07, ry: 0.16, c: '#14287a' }] });
  sp('blauwe_dokter', 'Blauwe doktersvis', 'Acanthurus coeruleus', 0.25, 1,
    'Jonge dieren zijn knalgeel en worden pas later blauw. Bij de staart zit een vlijmscherp ‘scalpel’.',
    { t: 'fish', shape: 'oval', h: 0.58, c: '#2b52d6', c2: '#3c66e2', fin: '#2846b8', tail: 'lunate', dorsal: 'long', finEdge: '#7fd4ff',
      pat: [{ k: 'lines', n: 6, c: 'rgba(20,30,110,0.45)', w: 0.01 }, { k: 'tailspot', c: '#e8f0ff', r: 0.018 }] }, { ds: 1.1 });
  sp('trompetvis', 'Trompetvis', 'Aulostomus maculatus', 0.7, 1,
    'Hangt rechtop tussen zeezwepen om onzichtbaar te zijn, of ‘schaduwt’ andere vissen om zo prooi te verrassen.',
    { t: 'fish', shape: 'needle', h: 0.1, c: '#b98a4a', c2: '#dcb478', fin: '#a07040', tail: 'round', dorsal: 'low', snout: 'tube',
      pat: [{ k: 'hstripes', n: 2, c: 'rgba(255,255,255,0.3)', w: 0.15 }, { k: 'spots', n: 10, c: '#3a2a1a', r: 0.008, area: 'tail' }] });
  sp('koffervis', 'Gevlekte koffervis', 'Lactophrys bicaudalis', 0.3, 2,
    'Zijn lijf zit in een stevig ‘doosje’ van benen plaatjes. Bij gevaar kan hij een gifstof afscheiden.',
    { t: 'fish', shape: 'box', h: 0.5, c: '#f0ece2', c2: '#ffffff', fin: '#e2ddd0', tail: 'round', dorsal: 'small',
      pat: [{ k: 'spots', n: 45, c: '#1a1a1a', r: 0.016 }] });
  sp('geelstaart_snapper', 'Geelstaartsnapper', 'Ocyurus chrysurus', 0.4, 1,
    'Nieuwsgierig: geelstaartsnappers zwemmen in losse groepjes achter duikers aan, op zoek naar een makkelijk hapje.',
    { t: 'fish', shape: 'torpedo', h: 0.3, c: '#b9c9da', c2: '#eef3f7', fin: '#f2d23a', tail: 'fork', tailC: '#f7d21e', dorsal: 'normal',
      pat: [{ k: 'hstripes', n: 1, c: '#f2c81a', w: 0.1 }, { k: 'spots', n: 12, c: '#f2d23a', r: 0.012 }] });
  sp('gele_geitenvis', 'Gele geitenvis', 'Mulloidichthys martinicus', 0.35, 1,
    'Met twee baarddraden onder zijn kin woelt hij door het zand naar wormpjes en kreeftjes. Andere vissen volgen hem voor de restjes.',
    { t: 'fish', shape: 'torpedo', h: 0.24, c: '#e8e2d4', c2: '#f8f5ee', fin: '#f2d23a', tail: 'fork', tailC: '#f2c81a', dorsal: 'normal',
      pat: [{ k: 'hstripes', n: 1, c: '#f2c81a', w: 0.09 }] });
  sp('stoplicht_papegaai', 'Stoplichtpapegaaivis', 'Sparisoma viride', 0.45, 1,
    'Papegaaivissen schrapen algen van koraal en poepen fijn wit zand uit. Een groot deel van het witte strand komt van hen!',
    { t: 'fish', shape: 'parrot', h: 0.38, c: '#1f9a6a', c2: '#86d6a8', fin: '#178a5c', tail: 'lunate', tailC: '#e2c040', snout: 'beak', beak: '#d8e8d0',
      pat: [{ k: 'patch', x: 0.3, y: -0.45, rx: 0.035, ry: 0.15, c: '#f5c63a' }, { k: 'patch', x: -0.27, y: 0, rx: 0.05, ry: 0.5, c: '#f5c63a', a: 0.8 },
        { k: 'lines', n: 3, c: 'rgba(240,110,160,0.6)', w: 0.008, x0: 0.5, x1: 0.28 }] });
  sp('franse_knorvis', 'Franse knorvis', 'Haemulon flavolineatum', 0.22, 1,
    'Knorvissen maken knorgeluiden door hun keeltanden over elkaar te wrijven. Overdag hangen ze in scholen in de schaduw.',
    { t: 'fish', shape: 'oval', h: 0.38, c: '#f2d24a', c2: '#f6e48a', fin: '#f0c030', tail: 'fork',
      pat: [{ k: 'hstripes', n: 6, c: 'rgba(70,140,220,0.85)', w: 0.08, tilt: 0.25 }] });
  sp('kleinbek_knorvis', 'Kleinbekknorvis', 'Haemulon chrysargyreum', 0.2, 1,
    'Zilverblauw met smalle gele strepen. Overdag hangen ze in grote scholen in de schaduw van de pijlers; ’s nachts zoeken ze op het zand naar voedsel.',
    { t: 'fish', shape: 'oval', h: 0.34, c: '#b8c6d4', c2: '#e9eef3', fin: '#e8c84a', tail: 'fork',
      pat: [{ k: 'hstripes', n: 6, c: 'rgba(240,200,60,0.85)', w: 0.05 }] });
  sp('sergeant', 'Sergeant-majoor', 'Abudefduf saxatilis', 0.15, 1,
    'Vijf zwarte strepen, net als de strepen van een sergeant. De mannetjes bewaken hun eitjes en kleuren dan donkerblauw.',
    { t: 'fish', shape: 'oval', h: 0.58, c: '#dfe6d8', c2: '#f4f4ec', fin: '#cfd8c4', tail: 'fork',
      pat: [{ k: 'gradientTop', c: '#e6d84a' }, { k: 'vbars', n: 5, c: '#1d2026', w: 0.05, x0: 0.25, x1: -0.22 }] }, { ds: 1.15 });
  sp('kikvorsvis_geel', 'Kikvorsvis', 'Antennarius multiocellatus', 0.12, 3,
    'Zwemt bijna nooit, maar ‘loopt’ op zijn vinnen. Met een hengeltje op zijn kop lokt hij prooi en hapt dan razendsnel toe.',
    { t: 'frogfish', c: '#f2c230', c2: '#e08a20' }, { ds: 2.2, hidden: true });
  sp('gevlekte_murene', 'Gevlekte murene', 'Gymnothorax moringa', 1.0, 1,
    'Een murene opent en sluit zijn bek om water langs zijn kieuwen te pompen. Dat lijkt dreigend, maar is gewoon ademen.',
    { t: 'moray', c: '#e9e2c4', spot: '#3a2c1c', spotN: 60 }, { hidden: true });
  sp('rifoctopus', 'Caribische rifoctopus', 'Octopus briareus', 0.5, 3,
    'Verandert in een fractie van een seconde van kleur én van huidstructuur. Vooral ’s nachts actief.',
    { t: 'octopus', c: '#c79a74', c2: '#6aa8c0' }, { hidden: true });
  // --- Bonaire, Zoutpier bij nacht
  sp('langoest', 'Caribische langoest', 'Panulirus argus', 0.45, 2,
    'Een langoest heeft geen scharen maar lange stekelige antennes. Overdag zit hij diep in een spleet; ’s nachts loopt hij over de bodem op zoek naar slakken en mosselen.',
    { t: 'lobster', c: '#9a4a28', c2: '#f0d890' }, { hidden: true, night: true });
  sp('rifinktvis', 'Caribische rifinktvis', 'Sepioteuthis sepioidea', 0.3, 2,
    'Rifinktvissen zweven in kleine groepjes en ‘praten’ met kleurpatronen op hun huid. ’s Nachts jagen ze vlak onder het oppervlak op visjes en garnalen.',
    { t: 'cuttle', c: '#b8905a', c2: '#e8d8b0' }, { night: true });
  sp('mandster', 'Mandster', 'Astrophyton muricatum', 0.6, 2,
    'Overdag ligt de mandster opgerold als een bolletje. ’s Nachts klimt hij op een koraal of pijler en spreidt hij zijn vertakte armen uit tot een net om plankton te vangen. In fel lamplicht rolt hij zich langzaam weer op.',
    { t: 'basket', c: '#d29a5a', c2: '#f2dcc0' }, { night: true });
  sp('adelaarsrog', 'Gevlekte adelaarsrog', 'Aetobatus narinari', 2.0, 3,
    'Vliegt als een vogel door het water en kan zelfs uit het water springen. Kraakt schelpen met zijn plaatvormige tanden.',
    { t: 'ray', v: 'eagle', c: '#27313b', spot: '#f2f2f2', belly: '#f4f4f4' });
  sp('barracuda', 'Grote barracuda', 'Sphyraena barracuda', 1.3, 1,
    'Nieuwsgierig: hij komt vaak even kijken en blijft dan in de buurt hangen. Gevaarlijk is hij niet voor duikers.',
    { t: 'fish', shape: 'long', h: 0.14, c: '#b7c3cc', c2: '#eef2f4', fin: '#6a7680', tail: 'fork', snout: 'jaw', dorsal: 'two',
      pat: [{ k: 'chevron', n: 16, c: 'rgba(60,70,80,0.45)', w: 0.012 }, { k: 'spots', n: 10, c: '#141414', r: 0.009, area: 'tail' }] });

  // --- Raja Ampat
  sp('rifmanta', 'Rifmanta', 'Mobula alfredi', 4.2, 3,
    'Mantas komen naar ‘poetsstations’, waar kleine poetsvisjes parasieten van hun huid eten. Spanwijdte tot 5 meter!',
    { t: 'ray', v: 'manta', c: '#1c1f26', patch: '#e9ecef', belly: '#f2f2f2' });
  sp('zwartpunt', 'Zwartpuntrifhaai', 'Carcharhinus melanopterus', 1.4, 2,
    'Herkenbaar aan de zwarte punten op zijn vinnen. Schuw: hij zwemt meestal in een boog om duikers heen.',
    { t: 'shark', v: 'blacktip', c: '#9a9086', c2: '#f2f0ea', tip: '#111' });
  sp('wobbegong', 'Franjewobbegong', 'Eucrossorhinus dasypogon', 1.3, 3,
    'Een platte haai met een baard van franjes. Hij ligt doodstil onder tafelkoralen te wachten tot een visje te dichtbij komt.',
    { t: 'wobbegong', c: '#8a7a5a' }, { hidden: true });
  sp('epaulette', 'Raja Ampat-epaulettehaai', 'Hemiscyllium freycineti', 0.7, 3,
    'Deze kleine haai ‘loopt’ over de bodem met zijn vinnen. Hij komt alleen in Raja Ampat voor.',
    { t: 'epaulette', c: '#a8875a' }, { hidden: true });
  sp('bultkop', 'Bultkoppapegaaivis', 'Bolbometopon muricatum', 1.1, 2,
    'De grootste papegaaivis ter wereld. Mannetjes vechten door met hun bultige koppen tegen elkaar te rammen.',
    { t: 'fish', shape: 'parrot', h: 0.42, hump: true, c: '#4e7a6a', c2: '#7aa08e', fin: '#3f6656', tail: 'trunc', snout: 'beak', beak: '#d6e0c8',
      forehead: '#c8d8b0', pat: [{ k: 'scales', c: 'rgba(30,60,50,0.3)', s: 0.05 }] });
  sp('napoleon', 'Napoleonvis', 'Cheilinus undulatus', 1.5, 2,
    'Kan bijna 2 meter worden. Alle napoleonvissen beginnen als vrouwtje; de grootste worden later mannetje.',
    { t: 'fish', shape: 'wrasse', h: 0.4, hump: true, c: '#3f8a8a', c2: '#6db0a0', fin: '#2f7070', tail: 'round', snout: 'lips',
      pat: [{ k: 'lines', n: 10, c: 'rgba(20,70,70,0.5)', w: 0.006, wave: true }, { k: 'facelines', c: '#1d4f4f' }] });
  sp('chevron_barracuda', 'Chevronbarracuda', 'Sphyraena putnamae', 0.8, 2,
    'Vormt draaikolken van honderden vissen. Zwem er rustig in de buurt en ze draaien om je heen.',
    { t: 'fish', shape: 'long', h: 0.15, c: '#aeb9c2', c2: '#eef2f4', fin: '#7d8a94', tail: 'fork', snout: 'jaw', dorsal: 'two',
      pat: [{ k: 'chevron', n: 18, c: 'rgba(50,60,75,0.6)', w: 0.014 }] });
  sp('clownvis', 'Oranje clownvis', 'Amphiprion percula', 0.09, 1,
    'Een slijmlaagje beschermt hem tegen de netelcellen van zijn anemoon. Hij gaat zelden verder dan een meter van huis.',
    { t: 'fish', shape: 'oval', h: 0.5, c: '#f47a1a', c2: '#f6923a', fin: '#f07018', finEdge: '#111', tail: 'round',
      pat: [{ k: 'band', x: 0.25, w: 0.07, c: '#fff', edge: '#111' }, { k: 'band', x: 0.02, w: 0.09, c: '#fff', edge: '#111', bulge: true },
        { k: 'band', x: -0.25, w: 0.05, c: '#fff', edge: '#111' }] }, { ds: 1.5 });
  sp('dwergzeepaardje', 'Dwergzeepaardje', 'Hippocampus bargibanti', 0.02, 3,
    'Maar 2 centimeter groot en precies even knobbelig als de gorgoon waarop hij woont. Pas in 1969 ontdekt!',
    { t: 'pygmy', c: '#eaa2ba', c2: '#c8406a' }, { ds: 6, hidden: true });
  sp('batvis', 'Vleermuisvis', 'Platax teira', 0.5, 1,
    'Jonge vleermuisvissen lijken op dode bladeren die in het water dwarrelen. Volwassen dieren zijn erg nieuwsgierig.',
    { t: 'fish', shape: 'disc', h: 1.0, c: '#c4c6c0', c2: '#e6e6e0', fin: '#9a9c94', tail: 'trunc', dorsal: 'batfish',
      pat: [{ k: 'vbars', n: 2, c: 'rgba(40,40,40,0.6)', w: 0.06, x0: 0.34, x1: 0.13 }, { k: 'patch', x: -0.02, y: 0.55, rx: 0.08, ry: 0.15, c: '#e8d040', a: 0.7 }] });
  sp('koraalduivel', 'Rode koraalduivel', 'Pterois volitans', 0.35, 1,
    'Mooi maar giftig: de lange stekels zitten vol gif. In de Cariben is hij een invasieve exoot, hier in de Indo-Pacific hoort hij thuis.',
    { t: 'lion' });
  sp('moorse_afgod', 'Moorse afgod', 'Zanclus cornutus', 0.2, 1,
    'Met zijn lange witte rugvin lijkt hij op een vlaggetje. Hij eet vooral sponzen.',
    { t: 'fish', shape: 'disc', h: 0.88, c: '#f4f1e6', c2: '#ffffff', fin: '#f4f1e6', tail: 'trunc', tailC: '#18181a', dorsal: 'banner', snout: 'tube', snoutC: '#f2a020',
      pat: [{ k: 'vbars', n: 1, c: '#16161a', w: 0.15, x0: 0.19, x1: 0.19 }, { k: 'vbars', n: 1, c: '#16161a', w: 0.13, x0: -0.13, x1: -0.13 },
        { k: 'patch', x: -0.03, y: 0.1, rx: 0.12, ry: 0.9, c: '#f4c51a', a: 0.9 }] }, { ds: 1.2 });
  sp('fuselier', 'Fuseliers', 'Caesio teres', 0.3, 1,
    'Snelle planktoneters die in enorme glinsterende scholen langs het rif trekken.',
    { t: 'fish', shape: 'torpedo', h: 0.3, c: '#3d7ad8', c2: '#d6e6f6', fin: '#4a7ad0', tail: 'fork', tailC: '#f4d23a',
      pat: [{ k: 'band2', y: -0.35, c: '#f4d23a', x1: -0.1, w: 0.22 }] });

  // --- Tulamben, USAT Liberty
  sp('grootoog_trevally', 'Grootoogtrevally', 'Caranx sexfasciatus', 0.6, 2,
    'Duizenden trevally’s draaien soms als een tornado rond het wrak. Ze jagen vooral ’s nachts.',
    { t: 'fish', shape: 'torpedo', h: 0.36, c: '#9fb0bc', c2: '#e8eef2', fin: '#6c7c88', tail: 'fork', bigEye: true, dorsalTip: '#111',
      pat: [{ k: 'scales', c: 'rgba(70,90,110,0.25)', s: 0.05 }] });
  sp('tuinaal', 'Gevlekte tuinaal', 'Heteroconger hassi', 0.35, 2,
    'Hele velden tuinalen steken uit het zand en eten plankton uit de stroming. Kom je te dichtbij, dan schieten ze hun hol in.',
    { t: 'gardeneel' }, { ds: 1.2 });
  sp('reuzenmurene', 'Reuzenmurene', 'Gymnothorax javanicus', 2.2, 2,
    'De zwaarste murene ter wereld, tot 3 meter lang. Poetsgarnalen maken zelfs zijn tanden schoon.',
    { t: 'moray', c: '#6e5a34', spot: '#2a1f12', spotN: 90, leopard: true }, { hidden: true });
  sp('naaktslak', 'Annas naaktslak', 'Chromodoris annae', 0.05, 2,
    'De felle kleuren zijn een waarschuwing: ik smaak vies! Naaktslakken ruiken met de twee hoorntjes op hun kop.',
    { t: 'nudi', v: 'chromodoris', c: '#3f49d6', c2: '#ffffff', c3: '#f08a20' }, { ds: 3, hidden: true });
  sp('reuzenkikvorsvis', 'Reuzenkikvorsvis', 'Antennarius commerson', 0.3, 3,
    'Lijkt op een spons, maar is een vis! Hij kan zijn bek zo snel openen dat prooi naar binnen wordt gezogen.',
    { t: 'frogfish', c: '#e86a2a', c2: '#b83a1a' }, { ds: 1.5, hidden: true });
  sp('groene_schildpad', 'Groene zeeschildpad', 'Chelonia mydas', 1.0, 2,
    'Volwassen groene zeeschildpadden zijn vegetariërs. Ze danken hun naam aan het groenige vet onder hun schild.',
    { t: 'turtle', v: 'green' });
  sp('kogelvis', 'Zwartgevlekte kogelvis', 'Arothron nigropunctatus', 0.3, 1,
    'Bij gevaar pompt hij zich vol water tot een stekelloze bal. Zijn organen bevatten het dodelijke gif tetrodotoxine.',
    { t: 'puffer', c: '#8f949a', spots: '#141414', c2: '#dfe2e5' });
  sp('wimpelvis', 'Wimpelvis', 'Heniochus diphreutes', 0.2, 1,
    'Lijkt op de Moorse afgod, maar zwemt in scholen boven het rif. Jongen poetsen soms andere vissen.',
    { t: 'fish', shape: 'disc', h: 0.86, c: '#f6f4ec', c2: '#ffffff', fin: '#f4e030', tail: 'trunc', tailC: '#f4e030', dorsal: 'banner',
      pat: [{ k: 'vbars', n: 2, c: '#1a1a1e', w: 0.13, x0: 0.2, x1: -0.1, slant: 0.18 }] }, { ds: 1.2 });

  // --- Oosterschelde
  sp('zeekat', 'Zeekat', 'Sepia officinalis', 0.35, 2,
    'In het voorjaar komen zeekatten de Oosterschelde in om hun zwarte eitjes (‘zeedruifjes’) af te zetten. Kan razendsnel van kleur wisselen.',
    { t: 'cuttle', c: '#a99878', c2: '#e8dcc0' });
  sp('kreeft', 'Europese kreeft', 'Homarus gammarus', 0.45, 2,
    'Levend is een kreeft blauw; pas na het koken wordt hij rood. Overdag verstopt hij zich in holen tussen de stenen.',
    { t: 'lobster', c: '#2c5290', c2: '#e0d090' }, { hidden: true });
  sp('zwemkrab', 'Fluwelen zwemkrab', 'Necora puber', 0.1, 1,
    'Felrode ogen en een fluweelzacht schild. Het achterste pootje is een peddel waarmee hij kan zwemmen. Erg strijdlustig!',
    { t: 'crab', c: '#5a4a3a', c2: '#3a5a9a', eye: '#e02020' }, { ds: 1.8 });
  sp('zeedonderpad', 'Gewone zeedonderpad', 'Myoxocephalus scorpius', 0.25, 1,
    'Perfect gecamoufleerd op de bodem. Als je hem stoort kan hij een knorrend geluid maken.',
    { t: 'fish', shape: 'scorpion', h: 0.32, c: '#7a6248', c2: '#c8b890', fin: '#6a5238', tail: 'round', dorsal: 'spiny',
      pat: [{ k: 'mottle', n: 22, c: ['#4a3a28', '#a08a60', '#8a3a2a'], r: 0.05 }] }, { hidden: true });
  sp('zeenaald', 'Grote zeenaald', 'Syngnathus acus', 0.35, 2,
    'Familie van het zeepaardje. Ook hier draagt het mannetje de eitjes uit in een broedbuidel.',
    { t: 'fish', shape: 'needle', h: 0.05, c: '#7a6a3a', c2: '#b8a870', fin: '#8a7a4a', tail: 'round', snout: 'tube', dorsal: 'low',
      pat: [{ k: 'vbars', n: 22, c: 'rgba(50,40,20,0.5)', w: 0.012, x0: 0.35, x1: -0.4 }] }, { hidden: true });
  sp('kompaskwal', 'Kompaskwal', 'Chrysaora hysoscella', 0.3, 1,
    'De bruine streepjes op zijn scherm lijken op een kompasroos. Let op: hij netelt!',
    { t: 'jelly', v: 'compass', c: '#f4e8d0', c2: '#8a4a2a' });
  sp('lipvis', 'Gevlekte lipvis', 'Labrus bergylta', 0.4, 1,
    'De grootste lipvis van onze kust. Slaapt ’s nachts in een spleet tussen de stenen.',
    { t: 'fish', shape: 'oval', h: 0.33, c: '#7a6a3a', c2: '#c8b878', fin: '#6a5a2a', tail: 'round', snout: 'lips', dorsal: 'long',
      pat: [{ k: 'spots', n: 55, c: 'rgba(240,230,190,0.7)', r: 0.011 }] });
  sp('bruinvis', 'Bruinvis', 'Phocoena phocoena', 1.5, 3,
    'De kleinste walvisachtige van de Noordzee. Er leven er een paar in de Oosterschelde, maar onder water zie je ze zelden.',
    { t: 'mammal', v: 'porpoise', c: '#3a3e44', c2: '#c8ccd0' });
  sp('kathaai', 'Kleingevlekte kathaai', 'Scyliorhinus canicula', 0.6, 2,
    'Een klein haaitje dat zijn eitjes in leerachtige kapsels legt: de ‘zeemeerminnenbeurzen’ die je op het strand vindt.',
    { t: 'shark', v: 'cat', c: '#b8a07a', c2: '#efe6d6', spot: '#3a2a1a' });
  sp('vlokslak', 'Gewone vlokslak', 'Aeolidia papillosa', 0.08, 2,
    'Eet zeeanemonen en slaat hun netelcellen op in de vlokjes op zijn rug, om ze zelf als wapen te gebruiken!',
    { t: 'nudi', v: 'aeolid', c: '#cdbca4', c2: '#8a6a50' }, { ds: 2.5, hidden: true });
  sp('botervis', 'Botervis', 'Pholis gunnellus', 0.2, 2,
    'Zo glibberig als boter. Beide ouders bewaken samen het eiklompje.',
    { t: 'fish', shape: 'eelish', h: 0.12, c: '#a07040', c2: '#d8b080', fin: '#8a6038', tail: 'round', dorsal: 'long',
      pat: [{ k: 'dorsalspots', n: 10, c: '#111', ring: '#f0e0c0' }] }, { hidden: true, ds: 1.4 });
  sp('steenbolk', 'Steenbolk', 'Trisopterus luscus', 0.3, 1,
    'Koperkleurig met brede lichte banden en een baarddraadje onder de kin. Hangt in groepjes rond pijlers en wrakken.',
    { t: 'fish', shape: 'oval', h: 0.34, c: '#9a6a3e', c2: '#d8b48a', fin: '#7a5432', tail: 'round', dorsal: 'normal',
      pat: [{ k: 'vbars', n: 4, c: 'rgba(240,220,190,0.45)', w: 0.08 }] });
  sp('zeebrasem', 'Zwarte zeebrasem', 'Spondyliosoma cantharus', 0.35, 1,
    'In de zomer graven de mannetjes kuiltjes in het zand, waar de vrouwtjes hun eitjes leggen.',
    { t: 'fish', shape: 'oval', h: 0.42, c: '#7c8a94', c2: '#c8d0d6', fin: '#4a5660', tail: 'fork',
      pat: [{ k: 'hstripes', n: 6, c: 'rgba(40,50,60,0.35)', w: 0.06 }] });

  // --- Rode Zee, Elphinstone
  sp('longimanus', 'Oceanische witpunthaai', 'Carcharhinus longimanus', 2.5, 3,
    'De ‘longimanus’ heeft enorme, ronde borstvinnen met witte punten. Nieuwsgierig: hij komt graag vlak onder de boot kijken.',
    { t: 'shark', v: 'oceanic', c: '#8a8270', c2: '#f0ede6', tip: '#f6f6f2' });
  sp('hamerhaai', 'Geschulpte hamerhaai', 'Sphyrna lewini', 2.8, 3,
    'Met de ogen op de uiteinden van de ‘hamer’ ziet hij bijna rondom. Overdag in scholen, ’s nachts jaagt hij alleen.',
    { t: 'shark', v: 'hammer', c: '#8a9098', c2: '#eef0f2' });
  sp('grijze_rifhaai', 'Grijze rifhaai', 'Carcharhinus amblyrhynchos', 1.7, 2,
    'Patrouilleert langs de rifwand. De zwarte rand aan de staart verraadt hem.',
    { t: 'shark', v: 'greyreef', c: '#7c8590', c2: '#f0f2f4', tip: '#1a1a1a' });
  sp('rodezee_anemoonvis', 'Rode Zee-anemoonvis', 'Amphiprion bicinctus', 0.12, 1,
    'Komt alleen in de Rode Zee voor. Twee witte banden en een gele staart, en altijd dicht bij zijn anemoon.',
    { t: 'fish', shape: 'oval', h: 0.5, c: '#c8601a', c2: '#f0a040', fin: '#e07a20', tail: 'round', tailC: '#f6e0a0',
      pat: [{ k: 'gradientTop', c: '#6a3010' }, { k: 'band', x: 0.22, w: 0.07, c: '#fff', edge: '#2a1a10' }, { k: 'band', x: -0.04, w: 0.07, c: '#fff', edge: '#2a1a10', bulge: true }] }, { ds: 1.4 });
  sp('juweelbaarsje', 'Juweelbaarsje', 'Pseudanthias squamipinnis', 0.1, 1,
    'Wolken oranje juweelbaarsjes dansen langs het rif. Vrouwtjes zijn oranje; het dominante mannetje wordt paars.',
    { t: 'fish', shape: 'oval', h: 0.38, c: '#f68a2a', c2: '#f8b060', fin: '#f68a2a', tail: 'lyre',
      pat: [{ k: 'patch', x: 0.25, y: 0.2, rx: 0.12, ry: 0.12, c: '#a84a9a', a: 0.5 }] }, { ds: 1.35 });
  sp('koraalvlinder', 'Gemaskerde koraalvlinder', 'Chaetodon semilarvatus', 0.2, 2,
    'Alleen in de Rode Zee. Hangt overdag graag met een partner stil onder een tafelkoraal.',
    { t: 'fish', shape: 'disc', h: 0.84, c: '#f6c41a', c2: '#f8d84a', fin: '#f4b81a', tail: 'round', snout: 'tube',
      pat: [{ k: 'vbars', n: 12, c: 'rgba(230,110,40,0.5)', w: 0.012, x0: 0.2, x1: -0.28 }, { k: 'mask', x: 0.3, c: '#4a6a9a' }] }, { ds: 1.15 });
  sp('sohal', 'Sohal-doktersvis', 'Acanthurus sohal', 0.35, 1,
    'Verdedigt fel zijn algentuintje in de branding. Het oranje ‘scalpel’ bij de staart is vlijmscherp.',
    { t: 'fish', shape: 'oval', h: 0.5, c: '#d8dce4', c2: '#eef0f4', fin: '#1a2440', tail: 'lyre', tailC: '#1a2440',
      pat: [{ k: 'hstripes', n: 12, c: 'rgba(30,40,70,0.75)', w: 0.04 }, { k: 'tailspot', c: '#f4801a', r: 0.03 }, { k: 'patch', x: 0.25, y: 0.3, rx: 0.06, ry: 0.2, c: '#f4801a' }] });
  sp('picasso', 'Picassotrekkervis', 'Rhinecanthus assasi', 0.25, 2,
    'Zijn tekening lijkt geschilderd door Picasso. Hij kan zijn rugstekel ‘op slot’ zetten om zich vast te klemmen in een spleet.',
    { t: 'fish', shape: 'oval', h: 0.55, c: '#c8b49a', c2: '#f2ece0', fin: '#c8b49a', tail: 'round', pat: [{ k: 'picasso' }] });
  sp('tuimelaar', 'Tuimelaar', 'Tursiops aduncus', 2.4, 3,
    'Naamgenoot van je duikcentrum in Zwolle! Tuimelaars slapen met één hersenhelft tegelijk, zodat ze kunnen blijven ademen.',
    { t: 'mammal', v: 'dolphin', c: '#6c747c', c2: '#d8dde0' });

  // --- Galápagos, Darwin
  sp('walvishaai', 'Walvishaai', 'Rhincodon typus', 9, 3,
    'De grootste vis ter wereld, maar hij eet alleen plankton. Elk dier heeft een uniek stippenpatroon, als een vingerafdruk.',
    { t: 'shark', v: 'whale', c: '#3e4c5c', c2: '#e8ecef' });
  sp('galapagoshaai', 'Galápagoshaai', 'Carcharhinus galapagensis', 2.4, 2,
    'Een stevige haai van afgelegen oceaaneilanden. Bij Darwin zie je ze vaak in groepjes.',
    { t: 'shark', v: 'galapagos', c: '#7a7a74', c2: '#efede8' });
  sp('zeeleeuw', 'Galápagos-zeeleeuw', 'Zalophus wollebaeki', 1.8, 2,
    'Speelse onderwaterclowns: ze maken salto’s en blazen bellen in je gezicht.',
    { t: 'sealion', c: '#7a5a3a', c2: '#a37c56' });
  sp('geelstaart_dokter', 'Geelstaartdoktersvis', 'Prionurus laticlavius', 0.4, 1,
    'Grazende scholen van honderden vissen trekken als een grijze wolk over de rotsen.',
    { t: 'fish', shape: 'oval', h: 0.5, c: '#5a6068', c2: '#7a8088', fin: '#4a5058', tail: 'lunate', tailC: '#f4d020',
      pat: [{ k: 'spots', n: 4, c: '#1a1a1a', r: 0.018, area: 'tailbase' }, { k: 'patch', x: 0.28, y: -0.2, rx: 0.04, ry: 0.3, c: '#3a3e46' }] });
  sp('koningskeizer', 'Koningskeizersvis', 'Holacanthus passer', 0.3, 1,
    'Donkerblauw met één witte streep. Volwassen dieren poetsen soms zelfs hamerhaaien!',
    { t: 'fish', shape: 'disc', h: 0.76, c: '#2c2a4a', c2: '#3a3858', fin: '#2c2a4a', tail: 'round', tailC: '#f4c020', dorsal: 'trail',
      pat: [{ k: 'vbars', n: 1, c: '#ffffff', w: 0.05, x0: 0.06, x1: 0.06 }, { k: 'patch', x: -0.2, y: -0.6, rx: 0.12, ry: 0.3, c: '#e07a20', a: 0.6 },
        { k: 'spots', n: 20, c: 'rgba(120,160,230,0.5)', r: 0.009 }] });

  // --- Decorvissen (niet in het logboek)
  function decor(id, size, art, ds) { S[id] = { id, name: id, size, art, ds: ds || 1, log: false, r: 1 }; }
  decor('chromis_blauw', 0.09, { t: 'fish', shape: 'oval', h: 0.45, c: '#3a8ae0', c2: '#5aaaf0', fin: '#3a7ad0', tail: 'fork' }, 1.4);
  decor('chromis_groen', 0.08, { t: 'fish', shape: 'oval', h: 0.45, c: '#6ad6c6', c2: '#a8f0e0', fin: '#5ac0b0', tail: 'fork' }, 1.4);
  decor('glasvisje', 0.07, { t: 'fish', shape: 'oval', h: 0.42, c: '#e6d6b8', c2: '#f6efe0', fin: '#e0d0b0', tail: 'fork', alpha: 0.75 }, 1.3);
  decor('grondel', 0.07, { t: 'fish', shape: 'oval', h: 0.24, c: '#b8a888', c2: '#e0d6c0', fin: '#a89878', tail: 'round',
    pat: [{ k: 'mottle', n: 6, c: ['#6a5a40', '#8a7a5a'], r: 0.08 }] }, 1.6);
  decor('jacks', 0.5, { t: 'fish', shape: 'torpedo', h: 0.34, c: '#a2b0ba', c2: '#e8eef2', fin: '#6c7c88', tail: 'fork', bigEye: true }, 1);

  /* ------------------------------------------------------------------
   * Duikstekken
   * floor: [[x, diepte]], back/far: achtergrond-silhouetten (parallax)
   * spawns: b = gedrag; d = dieptebereik; x = horizontaal bereik; p = kans aanwezig
   * ------------------------------------------------------------------ */
  DG.HOME = { name: 'Duikcentrum De Tuimelaar', city: 'Zwolle', lat: 52.512, lon: 6.094 };

  DG.SITES = [
    {
      id: 'saltpier', name: 'Zoutpier', area: 'Bonaire', country: 'Caribisch Nederland', lat: 12.083, lon: -68.283, three: true,
      temp: 28, vis: 50, depth: 40, level: 'Open Water (pier 3–12 m)', current: 0.05, entry: 'Kantduik bij de gele steen',
      travel: { mode: 'vlieg', time: '± 10 uur vliegen vanaf Schiphol' },
      desc: 'De pijlers onder de zoutpier bij de zoutpannen zijn begroeid met oranje, paarse en gele sponzen. Tarpons hangen in de schaduw en scholen knorvissen zweven tussen de palen. Duiken mag alleen als er geen schip aan de pier ligt.',
      highlights: ['tarpon', 'groene_schildpad', 'kikvorsvis_geel', 'barracuda'],
      pal: { surf: '#5fd0f0', deep: '#0a3a6c', sand: '#efe4c8', sand2: '#cfc19f', rock: '#9a8a72', back: '#3c7f9a', far: '#2f6f92' },
      absorb: { r: 10, g: 45, b: 400 }, dark: { start: 12, range: 40, max: 0.45 },
      width: 170,
      floor: [[0, -0.6], [6, 0.8], [14, 3], [24, 5.5], [40, 8], [70, 9.5], [100, 10.5], [128, 11.5], [142, 13.5], [156, 16.5], [170, 19]],
      back: [[0, 2], [30, 6], [80, 7.5], [130, 8.5], [170, 14]],
      far: [[0, 4], [60, 7], [120, 8.5], [170, 12]],
      rough: 0.5,
      zones: [
        { x: [8, 30], dens: 0.7, types: { seagrass: 3, rock: 1, star: 1, starfish: 0.4 } },
        { x: [30, 170], dens: 1.0, types: { brain: 1.5, star: 2, tube: 2, vase: 1, fan: 1.4, rod: 1.6, whip: 0.8, rock: 1.2, barrel: 0.5 } },
      ],
      structures: [{ type: 'pier', x0: 30, x1: 138, every: 8.6, deckY: -2.6 }],
      scenery: { shore: 'beach', horizon: 'saltpans' },
      start: { x: 9 },
      spawns: [
        { sp: 'tarpon', n: 4, b: 'wander', d: [2, 9], x: [35, 130], slow: 0.5 },
        { sp: 'franse_knorvis', n: 30, b: 'school', d: [3, 8], x: [45, 115], spread: 2.4, slow: 0.4 },
        { sp: 'kleinbek_knorvis', n: 30, b: 'school', d: [3, 9], x: [40, 120], spread: 2.6, slow: 0.4 },
        { sp: 'groene_schildpad', n: 2, b: 'wander', d: [2, 6], x: [10, 45], slow: 0.5 },
        { sp: 'sergeant', n: 14, b: 'school', d: [1, 5], x: [14, 90], spread: 2 },
        { sp: 'chromis_blauw', n: 14, b: 'reef', x: [10, 30] },
        { sp: 'blauwe_dokter', n: 12, b: 'school', d: [4, 10], x: [25, 160], spread: 2.5 },
        { sp: 'franse_keizer', n: 2, b: 'wander', d: [5, 11], x: [40, 160] },
        { sp: 'koningin_keizer', n: 2, b: 'wander', d: [6, 13], x: [60, 170] },
        { sp: 'trompetvis', n: 2, b: 'hover', d: [3, 9], x: [35, 130] },
        { sp: 'koffervis', n: 2, b: 'wander', d: [6, 12], x: [40, 165] },
        { sp: 'stoplicht_papegaai', n: 3, b: 'wander', d: [4, 12], x: [30, 160] },
        { sp: 'geelstaart_snapper', n: 8, b: 'school', d: [2, 9], x: [20, 140], spread: 3 },
        { sp: 'gele_geitenvis', n: 8, b: 'school', d: [4, 12], x: [30, 140], spread: 2.5 },
        { sp: 'kikvorsvis_geel', n: 1, b: 'pillar', d: [5, 8], x: [50, 120] },
        { sp: 'gevlekte_murene', n: 1, b: 'hidden', x: [60, 140] },
        { sp: 'rifoctopus', n: 1, b: 'crawl', x: [90, 160], p: 0.7 },
        { sp: 'adelaarsrog', n: 1, b: 'cruise', d: [6, 15], p: 0.45 },
        { sp: 'barracuda', n: 1, b: 'curious', d: [2, 8], x: [30, 120] },
        { sp: 'karet', n: 1, b: 'wander', d: [5, 14], x: [60, 170], p: 0.85, slow: 0.5 },
        { sp: 'chromis_blauw', n: 80, b: 'reef', x: [30, 170] },
        // alleen bij een nachtduik
        { sp: 'langoest', n: 3, b: 'crawl', night: true },
        { sp: 'rifinktvis', n: 6, b: 'school', night: true },
        { sp: 'mandster', n: 4, b: 'pillar', night: true },
      ],
    },
    {
      id: 'raja', name: 'Dampier Strait', area: 'Raja Ampat', country: 'Indonesië', lat: -0.56, lon: 130.68, three: true,
      temp: 29, vis: 20, depth: 32, level: 'Advanced aanbevolen', current: 0.12, entry: 'Bootduik',
      travel: { mode: 'vlieg', time: '± 24 uur reizen via Jakarta en Sorong' },
      desc: 'Het hart van de Koraaldriehoek: nergens ter wereld leven meer soorten koraal en rifvis. Op de zandbodem ligt een poetsstation waar rifmanta’s rondjes draaien om zich te laten schoonmaken.',
      highlights: ['rifmanta', 'wobbegong', 'dwergzeepaardje', 'chevron_barracuda'],
      pal: { surf: '#46c0d0', deep: '#073656', sand: '#e2d4ae', sand2: '#bba984', rock: '#7c7262', back: '#2f7a8a', far: '#2a6680' },
      absorb: { r: 9, g: 38, b: 300 }, dark: { start: 10, range: 38, max: 0.5 },
      width: 230,
      floor: [[0, 4], [20, 5], [45, 7], [70, 9], [95, 12], [120, 14.5], [140, 16], [162, 16.5], [180, 19], [205, 25], [230, 33]],
      back: [[0, 2], [40, 4.5], [90, 8], [140, 11], [230, 19]],
      far: [[0, 5], [70, 9], [160, 13], [230, 21]],
      rough: 0.8,
      zones: [
        { x: [0, 140], dens: 1.7, types: { table: 2, staghorn: 2.2, soft: 3, fan: 2, barrel: 1, brain: 1, anemone: 0.6, tube: 0.4, rock: 1, whip: 0.5 } },
        { x: [140, 165], dens: 0.5, types: { rock: 1, starfish: 1, brain: 0.5 } },
        { x: [165, 230], dens: 1.6, types: { soft: 3, fan: 3, table: 1.4, barrel: 1, whip: 1, staghorn: 1, anemone: 0.4, rock: 1 } },
      ],
      structures: [{ type: 'station', x: 152 }],
      scenery: { boatX: 60, horizon: 'karst' },
      start: { x: 60 },
      spawns: [
        { sp: 'rifmanta', n: 2, b: 'cleaning', cx: 152, cy: 13, p: 0.95 },
        { sp: 'rifmanta', n: 1, b: 'cleaning', cx: 152, cy: 11.5, p: 0.5 },
        { sp: 'zwartpunt', n: 2, b: 'cruise', d: [3, 10] },
        { sp: 'wobbegong', n: 1, b: 'hidden', x: [80, 135] },
        { sp: 'epaulette', n: 1, b: 'crawl', x: [15, 60] },
        { sp: 'bultkop', n: 8, b: 'school', d: [5, 13], x: [20, 140], spread: 3, slow: 0.45, p: 0.8 },
        { sp: 'napoleon', n: 1, b: 'curious', d: [8, 20], x: [60, 220], p: 0.85 },
        { sp: 'chevron_barracuda', n: 36, b: 'tornado', d: [15, 22], x: [178, 200], p: 0.8 },
        { sp: 'clownvis', n: 0, b: 'anemone' },
        { sp: 'dwergzeepaardje', n: 1, b: 'pygmy', minD: 12 },
        { sp: 'batvis', n: 5, b: 'school', d: [6, 14], x: [40, 200], spread: 2.4, slow: 0.35 },
        { sp: 'koraalduivel', n: 2, b: 'hover', d: [5, 20], x: [20, 220] },
        { sp: 'moorse_afgod', n: 3, b: 'wander', d: [3, 15], x: [10, 220] },
        { sp: 'fuselier', n: 50, b: 'school', d: [4, 13], x: [10, 220], spread: 4, fast: 1.6 },
        { sp: 'karet', n: 1, b: 'wander', d: [5, 18], x: [20, 200], p: 0.6, slow: 0.5 },
        { sp: 'juweelbaarsje', n: 60, b: 'reef', x: [20, 230] },
        { sp: 'chromis_groen', n: 130, b: 'reef', x: [0, 230] },
      ],
    },
    {
      id: 'tulamben', name: 'USAT Liberty-wrak', area: 'Tulamben, Bali', country: 'Indonesië', lat: -8.276, lon: 115.593, three: true,
      temp: 27, vis: 20, depth: 30, level: 'Open Water', current: 0.03, entry: 'Kantduik',
      travel: { mode: 'vlieg', time: '± 16 uur vliegen naar Bali' },
      desc: 'Het Amerikaanse vrachtschip werd in 1942 getorpedeerd en op het strand van Tulamben gezet. Door de uitbarsting van de Gunung Agung in 1963 schoof het wrak de zee in. Nu ligt het op 5 tot 30 meter diepte, overgroeid met koraal.',
      highlights: ['bultkop', 'grootoog_trevally', 'tuinaal', 'reuzenkikvorsvis'],
      pal: { surf: '#46b4dc', deep: '#09305c', sand: '#45423f', sand2: '#2a2826', rock: '#3a3632', back: '#2f6a88', far: '#2a5e80' },
      absorb: { r: 9, g: 40, b: 350 }, dark: { start: 10, range: 40, max: 0.5 },
      width: 180,
      floor: [[0, -0.8], [5, 0.6], [12, 3], [30, 7], [60, 12], [90, 17], [120, 22], [150, 26], [180, 30]],
      back: [[0, 1], [40, 6], [100, 13], [180, 22]],
      far: [[0, 3], [80, 10], [180, 20]],
      rough: 0.35,
      zones: [
        { x: [6, 34], dens: 0.35, types: { rock: 1, anemone: 0.3, cucumber: 0.6, starfish: 0.4 } },
        { x: [34, 180], dens: 0.5, types: { rock: 1.2, fan: 0.8, soft: 0.8, barrel: 0.6, anemone: 0.4, cucumber: 0.4, blackcoral: 0.5 } },
      ],
      structures: [{ type: 'wreck', x0: 40, x1: 132 }],
      scenery: { shore: 'pebbles', horizon: 'agung' },
      start: { x: 7 },
      spawns: [
        { sp: 'bultkop', n: 10, b: 'school', d: [6, 14], x: [40, 95], spread: 3, slow: 0.4, p: 0.9 },
        { sp: 'grootoog_trevally', n: 40, b: 'tornado', d: [10, 19], x: [100, 125], p: 0.85 },
        { sp: 'tuinaal', n: 1, b: 'gardeneel', x: [17, 29], count: 15 },
        { sp: 'reuzenmurene', n: 1, b: 'hidden', x: [60, 115] },
        { sp: 'naaktslak', n: 2, b: 'crawl', x: [40, 130] },
        { sp: 'reuzenkikvorsvis', n: 1, b: 'hidden', x: [50, 120] },
        { sp: 'groene_schildpad', n: 1, b: 'wander', d: [4, 16], x: [20, 170], p: 0.6, slow: 0.5 },
        { sp: 'kogelvis', n: 2, b: 'wander', d: [5, 18], x: [30, 150] },
        { sp: 'wimpelvis', n: 10, b: 'school', d: [6, 14], x: [40, 130], spread: 2 },
        { sp: 'koraalduivel', n: 2, b: 'hover', d: [6, 20], x: [40, 130] },
        { sp: 'batvis', n: 4, b: 'school', d: [6, 14], x: [45, 120], spread: 2, slow: 0.35, p: 0.7 },
        { sp: 'glasvisje', n: 80, b: 'reef', x: [40, 132] },
        { sp: 'chromis_blauw', n: 50, b: 'reef', x: [30, 170] },
      ],
    },
    {
      id: 'oosterschelde', name: 'Zeelandbrug', area: 'Oosterschelde', country: 'Nederland', lat: 51.59, lon: 3.9, three: true,
      temp: 13, vis: 4, depth: 22, level: 'Open Water (koud!)', current: 0.06, entry: 'Kantduik vanaf de dijk',
      travel: { mode: 'bus', time: '± 2,5 uur rijden vanaf Zwolle' },
      desc: 'Een van de bekendste duikstekken van Nederland. Langs de pijlers van de ruim 5 km lange Zeelandbrug groeien zeeanjelieren en dodemansduimen. Duik rond de kentering, want de stroming is hier stevig. En trek iets warms aan…',
      highlights: ['zeekat', 'kreeft', 'bruinvis', 'vlokslak'],
      pal: { surf: '#7aa877', deep: '#16301f', sand: '#8a8268', sand2: '#5e5844', rock: '#4c4e4a', back: '#3d6248', far: '#3a5a44' },
      absorb: { r: 6, g: 60, b: 18 }, dark: { start: 2, range: 18, max: 0.62 },
      width: 150,
      floor: [[0, -1.6], [4, 0.4], [10, 3], [22, 7], [35, 10], [60, 13], [90, 15], [120, 17], [150, 20]],
      back: [[0, 0.5], [40, 8], [100, 12], [150, 16]],
      far: [[0, 2], [80, 9], [150, 14]],
      rough: 0.4,
      zones: [
        { x: [3, 32], dens: 1.6, types: { rock: 4, mussels: 2, weed: 2, oyster: 1, plumose: 1, deadmans: 1 } },
        { x: [32, 150], dens: 0.9, types: { mussels: 1, oyster: 1.6, weed: 1.2, plumose: 0.6, starfish: 0.7, rock: 0.6 } },
      ],
      structures: [{ type: 'bridge', pillars: [60, 114], w: 3.2 }],
      scenery: { shore: 'dyke', horizon: 'zeeland', bus: true },
      start: { x: 8 },
      spawns: [
        { sp: 'zeekat', n: 2, b: 'wander', d: [3, 12], x: [15, 140], slow: 0.35 },
        { sp: 'kreeft', n: 2, b: 'hidden', x: [6, 32] },
        { sp: 'kreeft', n: 1, b: 'hidden', x: [57, 63] },
        { sp: 'zwemkrab', n: 3, b: 'crawl', x: [5, 120] },
        { sp: 'zeedonderpad', n: 2, b: 'hidden', x: [10, 130] },
        { sp: 'zeenaald', n: 1, b: 'hidden', x: [12, 40] },
        { sp: 'kompaskwal', n: 4, b: 'drift', d: [1, 9], x: [10, 150] },
        { sp: 'lipvis', n: 3, b: 'wander', d: [3, 14], x: [8, 140] },
        { sp: 'bruinvis', n: 1, b: 'cruise', d: [1, 5], p: 0.18 },
        { sp: 'kathaai', n: 1, b: 'crawl', x: [40, 150], p: 0.7, swimmer: true },
        { sp: 'vlokslak', n: 2, b: 'crawl', x: [8, 120] },
        { sp: 'botervis', n: 1, b: 'hidden', x: [5, 30] },
        { sp: 'zeebrasem', n: 8, b: 'school', d: [4, 12], x: [30, 140], spread: 2, p: 0.7 },
        { sp: 'steenbolk', n: 14, b: 'school', d: [6, 18], x: [40, 140], spread: 2 },
        { sp: 'grondel', n: 40, b: 'bottom', x: [5, 150] },
      ],
    },
    {
      id: 'elphinstone', name: 'Elphinstone Reef', area: 'Rode Zee', country: 'Egypte', lat: 25.31, lon: 34.86,
      temp: 26, vis: 35, depth: 40, level: 'Advanced (Deep voor de hamerhaaien)', current: 0.18, entry: 'Bootduik',
      travel: { mode: 'vlieg', time: '± 5 uur vliegen naar Marsa Alam' },
      desc: 'Een lang, smal rif midden in zee voor de kust van Marsa Alam. Steile wanden vol zachte koralen en wolken juweelbaarsjes. In het najaar patrouilleert de longimanus vlak onder de boot, en op het zuidplateau zie je soms hamerhaaien.',
      highlights: ['longimanus', 'hamerhaai', 'tuimelaar', 'juweelbaarsje'],
      pal: { surf: '#2fb2ee', deep: '#052866', sand: '#b9a88e', sand2: '#7c6c5c', rock: '#8a7a6a', back: '#3a6e96', far: '#1f5a92' },
      absorb: { r: 11, g: 50, b: 500 }, dark: { start: 14, range: 45, max: 0.5 },
      width: 210,
      floor: [[0, 2.2], [12, 3], [17, 7], [22, 46], [150, 48], [158, 31], [175, 28.5], [195, 31], [210, 35]],
      back: [[0, 1], [38, 1.5], [44, 34], [52, 2], [100, 2.5], [106, 36], [113, 3], [150, 2], [210, 4]],
      backStyle: 'wall',
      far: [[0, 30], [210, 30]],
      rough: 0.6,
      zones: [
        { x: [0, 20], dens: 2.2, types: { table: 2, staghorn: 2, brain: 1.2, soft: 2, fan: 1, anemone: 0.8, rock: 1, tube: 0.5 } },
        { x: [156, 210], dens: 1.4, types: { table: 1.5, fan: 2, soft: 2, brain: 1, rock: 1, whip: 1 } },
      ],
      wallCorals: { n: 560, types: { soft: 4, fan: 3, table: 1.2, brain: 1, whip: 1, tube: 0.8, anemone: 0.5, barrel: 0.4 } },
      structures: [],
      scenery: { boatX: 34, horizon: 'sea', liveaboard: true },
      start: { x: 34 },
      spawns: [
        { sp: 'longimanus', n: 1, b: 'cruise', d: [2, 10], p: 0.65, curious: true },
        { sp: 'hamerhaai', n: 3, b: 'cruise', d: [31, 39], p: 0.4 },
        { sp: 'grijze_rifhaai', n: 2, b: 'cruise', d: [14, 30] },
        { sp: 'napoleon', n: 1, b: 'curious', d: [6, 20], x: [10, 200], p: 0.7 },
        { sp: 'rodezee_anemoonvis', n: 0, b: 'anemone' },
        { sp: 'juweelbaarsje', n: 200, b: 'reef', x: [0, 210], wall: true },
        { sp: 'koraalvlinder', n: 3, b: 'wander', d: [2, 15], x: [0, 200] },
        { sp: 'sohal', n: 2, b: 'wander', d: [1, 4], x: [0, 20] },
        { sp: 'picasso', n: 1, b: 'wander', d: [1, 5], x: [0, 20] },
        { sp: 'tuimelaar', n: 4, b: 'pod', d: [0.5, 8], p: 0.3 },
        { sp: 'groene_schildpad', n: 1, b: 'wander', d: [3, 18], x: [0, 200], p: 0.5, slow: 0.5 },
        { sp: 'reuzenmurene', n: 1, b: 'hidden', x: [3, 16] },
        { sp: 'koraalduivel', n: 2, b: 'hover', d: [3, 15], x: [0, 200] },
        { sp: 'chromis_blauw', n: 50, b: 'reef', x: [0, 20] },
        { sp: 'jacks', n: 26, b: 'school', d: [8, 20], x: [20, 200], spread: 3 },
      ],
    },
    {
      id: 'darwin', name: 'Darwin Island', area: 'Galápagos', country: 'Ecuador', lat: 1.678, lon: -92.003,
      temp: 23, vis: 18, depth: 38, level: 'Advanced (sterke stroming)', current: 0.32, entry: 'Bootduik (liveaboard)',
      travel: { mode: 'vlieg', time: '± 20 uur via Quito, daarna 2 dagen varen' },
      desc: 'Het meest afgelegen eiland van de Galápagos, alleen bereikbaar per liveaboard. Hier zwemmen scholen hamerhaaien langs en van juni tot november, met wat geluk, een walvishaai. De beroemde Darwin’s Arch stortte in 2021 in; nu staan er twee ‘pilaren’.',
      highlights: ['hamerhaai', 'walvishaai', 'zeeleeuw', 'galapagoshaai'],
      pal: { surf: '#4aa6c0', deep: '#0b2f48', sand: '#8a8478', sand2: '#5e5a52', rock: '#4a4a50', back: '#2e6478', far: '#2a5a70' },
      absorb: { r: 8, g: 42, b: 220 }, dark: { start: 9, range: 36, max: 0.52 },
      width: 230,
      floor: [[0, 8], [20, 10], [50, 13.5], [80, 16.5], [110, 18], [140, 22], [170, 27], [200, 32], [230, 38]],
      back: [[0, 3], [60, 9], [130, 15], [230, 26]],
      far: [[0, 6], [100, 13], [230, 24]],
      rough: 1.1,
      zones: [
        { x: [0, 230], dens: 1.3, types: { boulder: 3, rock: 3, urchin: 2, star: 0.5, fan: 0.4, starfish: 0.5, brain: 0.3 } },
      ],
      structures: [],
      scenery: { boatX: 40, horizon: 'darwin', liveaboard: true },
      start: { x: 40 },
      spawns: [
        { sp: 'hamerhaai', n: 24, b: 'sharkschool', d: [12, 28], p: 0.95 },
        { sp: 'walvishaai', n: 1, b: 'cruise', d: [6, 16], p: 0.38, slow: 0.4 },
        { sp: 'galapagoshaai', n: 3, b: 'cruise', d: [10, 26] },
        { sp: 'zeeleeuw', n: 2, b: 'playful', d: [0.5, 8] },
        { sp: 'groene_schildpad', n: 2, b: 'wander', d: [5, 18], x: [10, 220], slow: 0.5 },
        { sp: 'adelaarsrog', n: 2, b: 'cruise', d: [8, 22], p: 0.5 },
        { sp: 'tuimelaar', n: 5, b: 'pod', d: [1, 10], p: 0.35 },
        { sp: 'geelstaart_dokter', n: 45, b: 'school', d: [5, 15], x: [0, 200], spread: 3.5 },
        { sp: 'geelstaart_dokter', n: 30, b: 'school', d: [6, 16], x: [0, 220], spread: 3 },
        { sp: 'koningskeizer', n: 3, b: 'wander', d: [6, 18], x: [10, 220] },
        { sp: 'moorse_afgod', n: 3, b: 'wander', d: [5, 16], x: [10, 220] },
        { sp: 'jacks', n: 40, b: 'school', d: [10, 22], x: [20, 220], spread: 3.5 },
      ],
    },
  ];

  // fotochallenges per duikstek: sp = soorten die tellen (null = elk onderwerp), min = minimaal aantal sterren (van 5)
  DG.PHOTO_CHALLENGES = {
    saltpier: [
      { id: 'zp_tarpon', title: 'Tarpon van dichtbij', sp: ['tarpon'], min: 4, tip: 'Tarpons hangen onder de laadkop op 4–9 m. Benader ze rustig van opzij.' },
      { id: 'zp_schildpad', title: 'Schildpad in het zeegras', sp: ['groene_schildpad', 'karet'], min: 3, tip: 'Ondiep aan de noordkant van de pier, 2–6 m.' },
      { id: 'zp_kikvors', title: 'Gele kikvorsvis', sp: ['kikvorsvis_geel'], min: 3, tip: 'Op de pijlers op 5–8 m. Je buddy wijst hem soms aan; gebruik je lamp.' },
      { id: 'zp_knorvis', title: 'Knorvissen tussen de pijlers', sp: ['franse_knorvis', 'kleinbek_knorvis'], min: 3, tip: 'De scholen hangen in de schaduw van de pier.' },
      { id: 'zp_murene', title: 'Murene aan de pijlervoet', sp: ['gevlekte_murene'], min: 3, tip: 'Kijk laag langs de voet van de pijlers.' },
      { id: 'zp_octopus', title: 'Octopus tussen het puin', sp: ['rifoctopus'], min: 3, tip: 'Op de bodem tussen de pijlers, goed gecamoufleerd.' },
      { id: 'zp_barracuda', title: 'Nieuwsgierige barracuda', sp: ['barracuda'], min: 3, tip: 'De barracuda komt vaak zelf kijken.' },
      { id: 'zp_buddy', title: 'Buddy-portret', sp: ['buddy'], min: 3, tip: 'Fotografeer je buddy van 2–3 m tussen de pijlers.' },
      { id: 'zp_perfect', title: 'Perfecte foto (5 sterren)', sp: null, min: 5, tip: 'Dichtbij, scherp, in het midden en met flitsers.' },
    ],
    // Zeelandbrug, Oosterschelde
    oosterschelde: [
      { id: 'os_kreeft', title: 'Kreeft tussen de stenen', sp: ['kreeft'], min: 3, tip: 'Kijk in de spleten tussen de stenen van de dijk, op 3–7 m. Een lamp helpt.' },
      { id: 'os_steenbolk', title: 'Steenbolken bij de pijler', sp: ['steenbolk'], min: 3, tip: 'Ze hangen in groepjes in de luwte van de pijlers.' },
      { id: 'os_donderpad', title: 'Zeedonderpad', sp: ['zeedonderpad'], min: 3, tip: 'Perfect gecamoufleerd op de stenen. Zwem langzaam en kijk goed.' },
      { id: 'os_kathaai', title: 'Kathaai op de bodem', sp: ['kathaai'], min: 3, tip: 'Op de slibbodem tussen dijk en pijlers.' },
      { id: 'os_vlokslak', title: 'Vlokslak (macro)', sp: ['vlokslak'], min: 3, tip: 'Klein! Op de stenen van de dijk. Ga heel dichtbij met flitsers.' },
      { id: 'os_zeekat', title: 'Zeekat', sp: ['zeekat'], min: 3, tip: 'Soms bij de pijlers. Benader hem heel rustig.' },
    ],
    raja: [
      { id: 'rj_manta', title: 'Rifmanta bij het poetsstation', sp: ['rifmanta'], min: 3, tip: 'Op de zandvlakte (16 m) laag achter het koraalblok liggen en wachten tot een manta over je heen komt.' },
      { id: 'rj_pygmy', title: 'Dwergzeepaardje (macro)', sp: ['dwergzeepaardje'], min: 3, tip: 'Piepklein, op een waaierkoraal dieper dan 12 m. Zoek met je lamp en ga heel dichtbij.' },
      { id: 'rj_wobbegong', title: 'Wobbegong onder het koraal', sp: ['wobbegong'], min: 3, tip: 'Hij ligt bewegingloos op het rif tussen 10 en 15 m. Let op de franjes rond zijn kop.' },
      { id: 'rj_clown', title: 'Clownvis in zijn anemoon', sp: ['clownvis'], min: 3, tip: 'In het ondiepe deel van het rif, vlak bij de boot.' },
      { id: 'rj_barracuda', title: 'Barracuda-tornado', sp: ['chevron_barracuda'], min: 3, tip: 'Voorbij de zandvlakte, aan het diepe rif op ± 18 m.' },
      { id: 'rj_napoleon', title: 'Napoleonvis', sp: ['napoleon'], min: 3, tip: 'Nieuwsgierig: hij komt vaak zelf kijken. Blijf rustig liggen.' },
    ],
    tulamben: [
      { id: 'tu_bultkop', title: 'Bultkoppen bij het wrak', sp: ['bultkop'], min: 3, tip: 'Een groep bultkoppapegaaivissen trekt langs het wrak. Zwem rustig mee en kom van opzij.' },
      { id: 'tu_trevally', title: 'Trevally-tornado', sp: ['grootoog_trevally'], min: 3, tip: 'Boven het diepe deel van het wrak, rond 15–20 m, draait een school grootoogtrevally’s.' },
      { id: 'tu_tuinaal', title: 'Tuinalen in het zand', sp: ['tuinaal'], min: 2, tip: 'Op het zwarte zand tussen strand en wrak. Ga plat liggen en kom heel langzaam dichterbij, anders duiken ze weg.' },
      { id: 'tu_kikvors', title: 'Reuzenkikvorsvis', sp: ['reuzenkikvorsvis'], min: 3, tip: 'Hij lijkt op een oranje spons op het wrak. Kijk goed bij de koralen op de romp.' },
      { id: 'tu_naaktslak', title: 'Naaktslak (macro)', sp: ['naaktslak'], min: 3, tip: 'Klein en knalblauw. Ze kruipen over de romp; ga dichtbij met flitsers.' },
      { id: 'tu_schroef', title: 'Bij de schroef', sp: ['batvis', 'koraalduivel', 'wimpelvis'], min: 3, tip: 'Bij de achtersteven ligt de grote schroef met het roer. Er hangen vaak vleermuisvissen en koraalduivels.' },
    ],
    // nachtduik bij de Zoutpier
    saltpier_nacht: [
      { id: 'zn_tarpon', title: 'Tarpon in je lampbundel', sp: ['tarpon'], min: 3, tip: '’s Nachts jagen de tarpons op visjes in het licht van je lamp. Houd je lamp stil en wacht.' },
      { id: 'zn_octopus', title: 'Jagende octopus', sp: ['rifoctopus'], min: 3, tip: '’s Nachts kruipen octopussen over de bodem tussen de pijlers.' },
      { id: 'zn_langoest', title: 'Langoest op pad', sp: ['langoest'], min: 3, tip: 'Laag langs de voet van de pijlers en over het zand.' },
      { id: 'zn_slaap', title: 'Slapende papegaaivis', sp: ['stoplicht_papegaai'], min: 3, tip: 'Papegaaivissen slapen aan de voet van de pijlers in een doorzichtige slijmcocon.' },
      { id: 'zn_mandster', title: 'Mandster in vol ornaat', sp: ['mandster'], min: 3, tip: 'Op de pijlers, 3–7 m. Schijn er niet te lang op, anders rolt hij zich op.' },
      { id: 'zn_inktvis', title: 'Rifinktvissen', sp: ['rifinktvis'], min: 3, tip: 'Vlak onder het oppervlak, 1–3 m, vooral bij de ingang en onder de pier.' },
    ],
  };
  DG.CHALLENGE_SITE = { saltpier: 'saltpier', saltpier_nacht: 'saltpier', oosterschelde: 'oosterschelde', tulamben: 'tulamben', raja: 'raja' };
  DG.siteById = (id) => DG.SITES.find((s) => s.id === id);
  DG.gearById = (id) => DG.GEAR.find((g) => g.id === id);
  DG.courseById = (id) => DG.COURSES.find((c) => c.id === id);

  // Lijst van soorten per stek (voor het logboek), afgeleid uit de spawns
  DG.siteSpecies = function (site) {
    const out = [];
    site.spawns.forEach((s) => {
      const spc = S[s.sp];
      if (spc && spc.log && out.indexOf(s.sp) < 0) out.push(s.sp);
    });
    return out;
  };
})(window.DG);
