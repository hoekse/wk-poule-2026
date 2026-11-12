/* Diepblauw 3D — onderwaterfoto's beoordelen (1–5 sterren) zoals een fotograaf dat doet:
   vulling van het beeld, compositie, scherpte, kleur (water filtert rood weg) en backscatter
   (flitser of lamp die zwevend vuil oplicht). */

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// o: { L (lengte onderwerp, m), d (afstand, m), ang (hoek uit het midden, rad), vfov (rad), aspect,
//      depth (m), diverSpeed (m/s), turn (rad/s), subjSpeed (m/s), strobe (bool), lamp (bool) }
export function gradePhoto(o) {
  // 1. vulling: breedte van het onderwerp t.o.v. de uitsnede (70% van de beeldbreedte)
  const frameW = 2 * o.d * Math.tan(o.vfov / 2) * o.aspect * 0.7;
  const fill = (o.L * 0.9) / Math.max(0.05, frameW);
  const sFill = fill < 0.33 ? fill / 0.33 : fill > 1.0 ? clamp(1 - (fill - 1.0) * 1.5, 0.35) : 1;
  // 2. compositie: in het midden of netjes op een derde
  const sComp = 1 - smooth(0.12, 0.42, o.ang);
  // 3. scherpte: zelf stilhangen, niet draaien, en een snel onderwerp is lastiger
  const motion = o.diverSpeed * 1.1 + o.turn * 0.7 + (o.subjSpeed || 0) * 0.5 / Math.max(1, o.d);
  const sSharp = clamp(1 - (motion - 0.15) / 0.9);
  // 4. kleur: lichtweg door water (diepte + afstand); flitsers geven kleur terug op korte afstand
  const natural = clamp(Math.exp(-0.075 * (o.depth + o.d)) + 0.08);
  let sColor = natural;
  if (o.strobe) sColor = Math.max(natural, clamp(0.98 - Math.max(0, o.d - 1.0) * 0.28));
  else if (o.lamp) sColor = Math.max(natural, clamp(0.82 - Math.max(0, o.d - 0.8) * 0.3));
  // 5. backscatter: kunstlicht op afstand licht zwevende deeltjes op
  const sBack = o.strobe || o.lamp ? clamp(1 - Math.max(0, o.d - 1.2) * 0.32, 0.3) : 1;

  const score = sFill * 0.3 + sComp * 0.15 + sSharp * 0.2 + sColor * 0.2 + sBack * 0.15;
  const stars = score > 0.91 ? 5 : score > 0.77 ? 4 : score > 0.6 ? 3 : score > 0.44 ? 2 : 1;

  // feedback: de zwakste punten eerst
  const tips = [];
  if (sFill < 0.7) tips.push([sFill, fill < 0.33 ? 'Te ver weg: kom dichterbij, dan vult het onderwerp het beeld.' : 'Te dichtbij: het onderwerp past niet in beeld.']);
  if (sComp < 0.7) tips.push([sComp, 'Zet het onderwerp meer in het midden.']);
  if (sSharp < 0.7) tips.push([sSharp, 'Bewogen: hang stil en draai niet tijdens het fotograferen.']);
  if (sColor < 0.7) tips.push([sColor, o.strobe ? 'Kleuren vallen weg: kom dichterbij, je flitsers reiken maar ongeveer een meter.' : 'Blauw en vlak: onder water verdwijnt rood. Kom dichterbij of gebruik flitsers.']);
  if (sBack < 0.75) tips.push([sBack, 'Backscatter: je licht laat zwevend vuil oplichten. Ga dichterbij (onder 1 m).']);
  tips.sort((a, b) => a[0] - b[0]);
  const note = stars >= 5 ? 'Perfect: scherp, goed gevuld en mooie kleuren!' : tips.length ? tips[0][1] : 'Mooie foto!';
  return { stars, score, note, parts: { vulling: sFill, compositie: sComp, scherpte: sSharp, kleur: sColor, backscatter: sBack } };
}

// welke challenges haalt deze foto (die nog niet gehaald waren)?
export function checkChallenges(list, done, sp, stars) {
  return (list || []).filter((c) => !done[c.id] && stars >= c.min && (!c.sp || (sp && c.sp.indexOf(sp) >= 0)));
}
