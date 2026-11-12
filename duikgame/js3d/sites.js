/* Diepblauw 3D — profielen per duikstek.
   Elke duikstek zegt zelf hoe het water eruitziet, hoe de bodem loopt, wat er gebouwd staat
   (pier, brug, wrak), welke dieren er zwemmen en wat er in de briefing staat.
   De duikmotor (main.js) is voor alle stekken hetzelfde. */
import * as THREE from 'three';
import { UW } from './water.js';
import { makeSeabed, makeReef, makePillarGrowth, loadSandTextures, setSeabed, setSolid } from './terrain.js';
import { loadModels } from './models.js';
import { makePier, pillarAt } from './pier.js';
import { Fauna, preloadFishPhotos, preloadFaunaModels } from './creatures3d.js';
import { oosterschelde } from './site-oosterschelde.js';
import { tulamben } from './site-tulamben.js';
import { raja } from './site-raja.js';
import { elphinstone } from './site-elphinstone.js';
import { darwin } from './site-darwin.js';

const esc = (s) => window.DG.U.esc(s);

/* ---------------- Zoutpier, Bonaire ---------------- */
export const saltpier = {
  id: 'saltpier',
  loadTitle: 'Zoutpier laden…',
  temp: 28,
  tank: { L: 11.1, bar: 207, name: 'aluminium 80 · 207 bar' },
  lead: '10 kg aan de loodgordel',
  nightOk: true,
  challenges: (night) => (night ? 'saltpier_nacht' : 'saltpier'),
  bounds: { x: [-260, 2], z: [-140, 140] },
  start: { p: [-3.5, -0.25, 8], buddy: [-4.5, -0.3, 10], yaw: Math.PI / 2 },
  water(night) {
    UW.uAbs.value.set(0.115, 0.036, 0.021);
    UW.uDown.value.set(0.072, 0.02, 0.0095);
    return {
      top: night ? 0x0a1824 : 0x6fe0f6, deep: night ? 0x010409 : 0x0d5596, exposure: night ? 1.5 : 1.28,
      hemi: night ? [0x5b7bb0, 0x1a1a22, 0.1] : [0xd6f2ff, 0xa8977a, 1.9], sun: night ? [0x9fb4e0, 0.18] : [0xfff2dc, 2.8], caus: 1, rays: !night, pierShade: true,
    };
  },
  inShadow: (x, z) => (x > -122 && x < -3 && Math.abs(z) < 2.6) || (Math.abs(x + 120) < 9 && Math.abs(z) < 7),
  isReef: (x) => x < -136,
  reefMsg: 'Pas op: je raakt het rif! In het Bonaire Marine Park mag je niets aanraken.',
  pillarMsg: 'Je raakt een pijler. Niets aanraken: het leven op de pijlers is kwetsbaar.',
  async build({ scene, q, loading, night }) {
    setSeabed(null); setSolid(null);
    const [sandTex] = await Promise.all([loadSandTextures(), loadModels(['hersenkoraal', 'sterkoraal', 'buisspons', 'vaasspons', 'tonspons', 'bekerkoraal', 'korstspons', 'zeepluim'])]);
    scene.add(makeSeabed(q, sandTex));
    await loading('De pijlers van de Zoutpier…');
    const pier = makePier(scene, q);
    new THREE.TextureLoader().load(q === 'laag' ? 'img/tex-pijler-laag.jpg' : 'img/tex-pijler.jpg', (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1.2); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      pier.mesh.material.map = t; pier.mesh.material.needsUpdate = true;
      new THREE.TextureLoader().load(q === 'laag' ? 'img/tex-pijler-laag-n.jpg' : 'img/tex-pijler-n.jpg', (n) => {
        n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(1, 1.2);
        pier.mesh.material.normalMap = n; pier.mesh.material.normalScale = new THREE.Vector2(1.2, 1.2); pier.mesh.material.needsUpdate = true;
      }, undefined, () => { pier.mesh.material.bumpMap = t; pier.mesh.material.bumpScale = 1.6; pier.mesh.material.needsUpdate = true; });
    });
    makeReef(scene, q, pier.pillars);
    makePillarGrowth(scene, q, pier.pillars, pillarAt);
    await loading('Vissen, tarpons en schildpadden…');
    await Promise.all([preloadFishPhotos(), preloadFaunaModels(night)]);
    const fauna = new Fauna(scene, q, { night });
    fauna.placeFrogs(pier.pillars);
    return { pillars: pier.pillars, fauna };
  },
  startMsg(night, plan) {
    if (night) return 'Het is donker. Je ligt met je buddy bij de gele steen, lampen aan. Laat lucht uit je vest (▼ of F) om af te dalen. Blijf dicht bij elkaar: zie je zijn lampje niet meer, stop dan en kijk rond.';
    return plan.current.length() > 0.01 ? 'Je ligt aan de oppervlakte bij de gele steen. Er staat lichte stroming: ' + plan.curTxt + '. Laat lucht uit je vest (▼ of F) om af te dalen.'
      : 'Je ligt aan de oppervlakte bij de gele steen. Laat lucht uit je trimvest (▼ of F) om af te dalen, en vergeet niet te klaren.';
  },
  // stroming vandaag en de route
  conditions() {
    const r = Math.random();
    const cur = new THREE.Vector3(0, 0, 0);
    let curTxt = 'geen';
    if (r > 0.45) { const s = r > 0.75 ? 1 : -1; cur.z = s * (0.05 + Math.random() * 0.1); curTxt = s > 0 ? 'van zuid naar noord' : 'van noord naar zuid'; }
    const route = cur.z > 0.01 ? 'Begin tegen de stroom in aan de linkerkant (zuid) en laat je terugdrijven langs de rechterkant.'
      : cur.z < -0.01 ? 'Begin tegen de stroom in aan de rechterkant (noord) en laat je terugdrijven langs de linkerkant.'
        : 'Geen stroming: zwem langs de pier naar de laadkop (tarpons) en daarna links of rechts langs de pijlergroepen.';
    return { cur, curTxt, route, ship: Math.random() < 0.1 };
  },
  brief: {
    photos: '<img src="img/bonaire-zoutpier-lucht.jpg" alt="Luchtfoto van de Zoutpier"><img src="img/bonaire-zoutpier-steen.jpg" alt="De gele steen Salt Pier"><img src="img/bonaire-zoutpier-knorvissen.jpg" alt="Knorvissen tussen de pijlers">',
    title: 'Zoutpier, Bonaire',
    name: 'de Zoutpier',
    grid: (curTxt) => '<div><small>Water</small>28 °C · <span data-w="dag">zicht ±50 m</span><span data-w="nacht">zicht: alleen in je lampbundel</span></div><div><small>Ingang</small><span data-w="dag">Kantduik bij de gele steen</span><span data-w="nacht">Gele steen, ingang bij daglicht verkend</span></div>' +
      '<div><small>Stroming vandaag</small>' + curTxt + '</div><div><small>Diepte</small>pier 3–12 m · rif tot 40 m</div>',
    nightLead: 'De zon is net onder. ’s Nachts is de Zoutpier een andere wereld: tarpons jagen in het licht van je lamp, octopussen, murenen en langoesten zwerven over de bodem, mandsters vouwen hun armen uit op de pijlers en papegaaivissen slapen in een slijmcocon. Blijf vlak bij je buddy en zwem rustig: alleen in je lampbundel zie je kleur.',
    rulesTitle: 'Regels van het Bonaire Marine Park',
    rules: ['Ik heb een geldige natuurtag (STINAPA)', 'Ik duik zonder handschoenen en raak niets aan', 'Ik heb gecontroleerd dat er geen schip aan de pier ligt'],
    rulesToast: 'Vink eerst de regels van het marine park af.',
    blocked: '<h2>Er ligt een schip aan de pier</h2><p class="lead">Een zoutschip ligt aan de laadkop. Dan mag je bij de Zoutpier niet duiken. Kom later terug.</p>',
  },
};

export const PROFILES = { saltpier, oosterschelde, tulamben, raja, elphinstone, darwin };
export function profileFor(site) { return PROFILES[site.id] || saltpier; }
export { esc };
