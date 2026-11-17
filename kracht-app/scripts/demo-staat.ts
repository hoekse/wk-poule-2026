// Maakt een voorbeeldstaat (8 weken) voor screenshots en tests. NIET de echte gegevens.
// Gebruik: npx vite-node scripts/demo-staat.ts > demo.json
import { plusDagen, weekdag } from '../src/lib/datum';
import { volgendeDag } from '../src/lib/schema';
import { legeStaat, maakTraining, voegDagdataToe } from '../src/lib/staat';
import { OP_TIJD } from '../src/lib/oefeningen';

let zaad = 7;
const rnd = () => ((zaad = (zaad * 16807) % 2147483647) / 2147483647);

const START: Record<string, number> = {
  squat: 60, 'bankdrukken': 50, kabelroeien: 45, beenbuigen: 30, 'zijwaarts-heffen': 6, 'kabel-crunch': 20,
  deadlift: 80, 'db-schouderdrukken': 14, latpulldown: 45, legpress: 100, 'db-curl': 10, 'triceps-pushdown': 17.5,
  'bulgaarse-split-squat': 10, 'schuin-db': 18, 'db-roeien': 20, 'hipthrust-stang': 60, 'face-pull': 15, boerenwandeling: 24,
};

const vandaag = process.argv[2] ?? '2026-11-17';
const s = legeStaat();
s.instellingen = { ...s.instellingen, naam: 'Dennis', onboardingKlaar: true, blokStart: plusDagen(vandaag, -7 * 7 - (weekdag(vandaag) - 1)) };
let staat = s;
for (let d = plusDagen(vandaag, -56); d < vandaag; d = plusDagen(d, 1)) {
  const nacht = rnd();
  const ahi = Math.round((1 + rnd() * 3 + (nacht < 0.12 ? 9 : 0)) * 10) / 10;
  const cpap = Math.round((5.6 + rnd() * 2.2 - (nacht < 0.12 ? 2.5 : 0)) * 100) / 100;
  staat = voegDagdataToe(staat, [{
    datum: d, cpapUren: cpap, ahi, lekkage: Math.round(rnd() * 120) / 10,
    slaapUren: Math.round((cpap + 0.2 + rnd() * 0.4) * 100) / 100,
    hrv: Math.round(42 + rnd() * 12 - (nacht < 0.12 ? 10 : 0)), rustHartslag: Math.round(56 + rnd() * 4 + (nacht < 0.12 ? 4 : 0)),
    gewicht: Math.round((96 - (dagIndex(d)) * 0.045 + rnd() * 0.6) * 10) / 10, stappen: Math.round(6000 + rnd() * 7000),
  }], 'apple').staat;
  staat = voegDagdataToe(staat, [{ datum: d, energie: 3 + Math.round(rnd()), spierpijn: 2 + Math.round(rnd()), stress: 2 + Math.round(rnd()) }], 'handmatig').staat;
  if ([1, 3, 5].includes(weekdag(d)) && rnd() > 0.08) {
    const dag = volgendeDag(staat);
    const t = maakTraining(staat, dag.id, 'normaal', d);
    t.start = `${d}T17:${String(Math.floor(rnd() * 50)).padStart(2, '0')}:00.000Z`;
    t.eind = new Date(new Date(t.start).getTime() + (52 + rnd() * 18) * 60000).toISOString();
    t.status = 'klaar';
    t.zwaarte = 6 + Math.round(rnd() * 2);
    t.oefeningen = t.oefeningen.map((l) => {
      const g = l.doel.gewicht ?? START[l.oefeningId] ?? 20;
      return {
        ...l,
        sets: l.sets.map((_, j) => {
          const reps = OP_TIJD.has(l.oefeningId)
            ? 30 + Math.round(rnd() * 15)
            : Math.min(l.doel.repMax, l.doel.repMin + Math.floor(rnd() * (l.doel.repMax - l.doel.repMin + 4)) - (j === 2 && rnd() < 0.3 ? 1 : 0));
          return { gewicht: g, reps: Math.max(1, reps), rir: 1 + Math.round(rnd() * 2), klaar: true };
        }),
      };
    });
    staat = { ...staat, trainingen: [...staat.trainingen, t] };
  }
}
staat.metingen = [
  { id: 'm1', datum: plusDagen(vandaag, -56), gewicht: 96.2, taille: 104, arm: 36 },
  { id: 'm2', datum: plusDagen(vandaag, -28), gewicht: 94.9, taille: 102, arm: 36.5 },
  { id: 'm3', datum: plusDagen(vandaag, -2), gewicht: 93.6, taille: 100.5, arm: 37 },
];
// Vanochtend: alleen Apple Health, nog geen ochtendcheck.
staat = voegDagdataToe(staat, [{ datum: vandaag, slaapUren: 6.6, hrv: 41, rustHartslag: 59 }], 'apple').staat;
staat.instellingen.laatsteBackup = `${plusDagen(vandaag, -3)}T20:00:00.000Z`;
function dagIndex(d: string) { return Math.round((new Date(d).getTime() - new Date(plusDagen(vandaag, -56)).getTime()) / 86400000); }
process.stdout.write(JSON.stringify(staat));
