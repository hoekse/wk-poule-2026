import { PANATTA } from './panatta';
import type { ApparaatId, Oefening, Spiergroep } from './types';

export const APPARATUUR: { id: ApparaatId; naam: string; standaard: boolean; groep?: 'Panatta' }[] = [
  { id: 'stang', naam: 'Halterstangen en schijven', standaard: true },
  { id: 'rek', naam: 'Squatrek / powerrek', standaard: true },
  { id: 'bank', naam: 'Verstelbare bank', standaard: true },
  { id: 'dumbbells', naam: 'Dumbbells', standaard: true },
  { id: 'kabel', naam: 'Kabelstation (verstelbaar)', standaard: true },
  { id: 'latpulldown', naam: 'Lat pulldown', standaard: true },
  { id: 'roeimachine', naam: 'Kabelroeien zittend (seated row)', standaard: true },
  { id: 'legpress', naam: 'Leg press', standaard: true },
  { id: 'hacksquat', naam: 'Hack squat (plate-loaded)', standaard: true },
  { id: 'pendulum', naam: 'Pendulum squat / V-squat (plate-loaded)', standaard: false },
  { id: 'plate-borst', naam: 'Chest press (plate-loaded)', standaard: true },
  { id: 'plate-schuin', naam: 'Incline press (plate-loaded)', standaard: true },
  { id: 'plate-schouder', naam: 'Shoulder press (plate-loaded)', standaard: true },
  { id: 'plate-roei', naam: 'Row / iso-lateral row (plate-loaded)', standaard: true },
  { id: 'plate-highrow', naam: 'High row (plate-loaded)', standaard: true },
  { id: 'plate-pulldown', naam: 'Pulldown (plate-loaded)', standaard: true },
  { id: 'tbar', naam: 'T-bar row', standaard: true },
  // Panatta (plate-loaded Freeweight-lijn en machines met gewichtsstapel). Vink aan wat er bij FitButiq staat.
  { id: 'pan-chest', naam: 'Panatta chest press', standaard: true, groep: 'Panatta' },
  { id: 'pan-incline', naam: 'Panatta incline chest press', standaard: true, groep: 'Panatta' },
  { id: 'pan-shoulder', naam: 'Panatta shoulder press', standaard: true, groep: 'Panatta' },
  { id: 'pan-pulldown', naam: 'Panatta lat pulldown', standaard: true, groep: 'Panatta' },
  { id: 'pan-lowrow', naam: 'Panatta low row', standaard: true, groep: 'Panatta' },
  { id: 'pan-highrow', naam: 'Panatta high row', standaard: true, groep: 'Panatta' },
  { id: 'pan-tbar', naam: 'Panatta T-bar row', standaard: false, groep: 'Panatta' },
  { id: 'pan-hack', naam: 'Panatta hack squat', standaard: true, groep: 'Panatta' },
  { id: 'pan-pendulum', naam: 'Panatta pendulum squat', standaard: false, groep: 'Panatta' },
  { id: 'pan-legpress', naam: 'Panatta leg press 45°', standaard: true, groep: 'Panatta' },
  { id: 'pan-hipthrust', naam: 'Panatta hip thrust', standaard: false, groep: 'Panatta' },
  { id: 'pan-calf', naam: 'Panatta calf (kuiten)', standaard: false, groep: 'Panatta' },
  { id: 'pan-legext', naam: 'Panatta leg extension', standaard: true, groep: 'Panatta' },
  { id: 'pan-legcurl', naam: 'Panatta leg curl', standaard: true, groep: 'Panatta' },
  { id: 'pan-pecdeck', naam: 'Panatta pec deck / rear delt', standaard: true, groep: 'Panatta' },
  { id: 'pan-lateral', naam: 'Panatta lateral raise', standaard: false, groep: 'Panatta' },
  { id: 'pan-biceps', naam: 'Panatta biceps curl', standaard: false, groep: 'Panatta' },
  { id: 'pan-triceps', naam: 'Panatta triceps (dip of extension)', standaard: false, groep: 'Panatta' },
  { id: 'pan-abs', naam: 'Panatta abdominal crunch', standaard: false, groep: 'Panatta' },
  { id: 'pan-pullover', naam: 'Panatta pullover', standaard: false, groep: 'Panatta' },
  { id: 'smith', naam: 'Smith-machine', standaard: true },
  { id: 'beenstrekker', naam: 'Beenstrekker (leg extension)', standaard: true },
  { id: 'beenbuiger', naam: 'Beenbuiger (leg curl)', standaard: true },
  { id: 'borstpress', naam: 'Chest press-machine', standaard: true },
  { id: 'schouderpress', naam: 'Shoulder press-machine', standaard: true },
  { id: 'pecdeck', naam: 'Pec deck / butterfly', standaard: true },
  { id: 'hipthrust', naam: 'Hip thrust-machine', standaard: false },
  { id: 'trapbar', naam: 'Trap bar (zeshoekige stang)', standaard: false },
  { id: 'optrekstang', naam: 'Optrekstang / dipstation', standaard: true },
  { id: 'rugstrekbank', naam: 'Rugstrekbank (45°)', standaard: true },
  { id: 'kuitmachine', naam: 'Kuitmachine', standaard: false },
  { id: 'kettlebell', naam: 'Kettlebells', standaard: true },
  { id: 'cardio', naam: 'Hometrainer, roeiergometer of airbike', standaard: true },
];

export const SPIERNAMEN: Record<Spiergroep, string> = {
  borst: 'Borst',
  rug: 'Rug',
  schouders: 'Schouders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quadriceps: 'Bovenbeen voor',
  hamstrings: 'Bovenbeen achter',
  billen: 'Billen',
  kuiten: 'Kuiten',
  romp: 'Romp',
  onderrug: 'Onderrug',
  grip: 'Grip',
  conditie: 'Conditie',
};

type O = Omit<Oefening, 'tips'> & { tips?: string[] };
const o = (x: O): Oefening => ({ tips: [], ...x });

export const OEFENINGEN: Oefening[] = [
  // ── Squatten ──────────────────────────────────────────────
  o({ id: 'squat', naam: 'Squat (stang)', spieren: ['quadriceps', 'billen', 'onderrug'], apparaat: ['stang', 'rek'], soort: 'basis', gewichtType: 'totaal', stap: 2.5,
    tips: ['Stang op je bovenrug, voeten iets breder dan je heupen.', 'Adem in, span je buik aan, dan pas zakken.', 'Knieën gaan mee in de richting van je tenen.', 'Zak tot je heupen minstens op kniehoogte zijn en duw door je hele voet omhoog.'] }),
  o({ id: 'hacksquat', naam: 'Hack squat', spieren: ['quadriceps', 'billen'], apparaat: ['hacksquat'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Rug en billen blijven tegen het kussen.', 'Zak gecontroleerd zo diep als je rug plat blijft.', 'Knieën niet op slot bovenin.', 'Noteer alleen de schijven (beide kanten samen).'] }),
  o({ id: 'pendulum-squat', naam: 'Pendulum squat', spieren: ['quadriceps', 'billen'], apparaat: ['pendulum'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Voeten midden op het plateau, rug tegen het kussen.', 'Zak zo diep als het lukt met je hielen aan de grond.', 'Noteer alleen de schijven.'] }),
  o({ id: 'smith-squat', naam: 'Squat in de Smith-machine', spieren: ['quadriceps', 'billen'], apparaat: ['smith'], soort: 'basis', gewichtType: 'totaal', stap: 2.5,
    tips: ['Voeten iets voor de stang, zodat je rechtop blijft.', 'Zak tot je heupen op kniehoogte zijn.', 'Noteer het gewicht van de schijven (de stang zelf weegt per machine anders).'] }),
  o({ id: 'legpress', naam: 'Leg press', spieren: ['quadriceps', 'billen'], apparaat: ['legpress'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Onderrug blijft tegen het kussen: zak niet verder dan dat lukt.', 'Voeten op heupbreedte, midden op het plateau.', 'Knieën niet op slot bovenin.'] }),
  o({ id: 'goblet-squat', naam: 'Goblet squat', spieren: ['quadriceps', 'billen', 'romp'], apparaat: ['dumbbells'], soort: 'basis', gewichtType: 'totaal', stap: 2,
    tips: ['Houd één dumbbell rechtop tegen je borst.', 'Ellebogen zakken tussen je knieën door.', 'Borst blijft omhoog.'] }),
  o({ id: 'bulgaarse-split-squat', naam: 'Bulgaarse split squat', spieren: ['quadriceps', 'billen'], apparaat: ['dumbbells', 'bank'], soort: 'hulp', gewichtType: 'per-hand', stap: 2, perKant: true,
    tips: ['Achterste voet op de bank, voorste voet een grote stap ervoor.', 'Zak recht naar beneden tot je achterste knie bijna de grond raakt.', 'Begin met je zwakste been.'] }),
  o({ id: 'lunges', naam: 'Lopende lunges', spieren: ['quadriceps', 'billen'], apparaat: ['dumbbells'], soort: 'hulp', gewichtType: 'per-hand', stap: 2, perKant: true,
    tips: ['Grote stappen, romp rechtop.', 'Achterste knie zakt tot net boven de grond.'] }),
  o({ id: 'beenstrekken', naam: 'Beenstrekken (leg extension)', spieren: ['quadriceps'], apparaat: ['beenstrekker'], soort: 'hulp', gewichtType: 'stapel', stap: 5,
    tips: ['Draaipunt van de machine ter hoogte van je knie.', 'Bovenin één tel vasthouden, rustig laten zakken.'] }),

  // ── Heupscharnier ─────────────────────────────────────────
  o({ id: 'deadlift', naam: 'Deadlift (stang)', spieren: ['billen', 'hamstrings', 'onderrug', 'rug', 'grip'], apparaat: ['stang'], soort: 'basis', gewichtType: 'totaal', stap: 5,
    tips: ['Stang boven het midden van je voet, schenen bijna tegen de stang.', 'Rug recht, borst omhoog, armen gestrekt.', 'Duw de vloer weg; stang blijft langs je benen.', 'Elke herhaling rustig neerzetten, niet laten stuiteren.'] }),
  o({ id: 'trapbar-deadlift', naam: 'Trap bar deadlift', spieren: ['billen', 'quadriceps', 'hamstrings', 'onderrug', 'grip'], apparaat: ['trapbar'], soort: 'basis', gewichtType: 'totaal', stap: 5,
    tips: ['Ga midden in de stang staan.', 'Heupen iets hoger dan bij een squat, rug recht.', 'Duw de vloer weg en sta helemaal rechtop.'] }),
  o({ id: 'rdl', naam: 'Roemeense deadlift (stang)', spieren: ['hamstrings', 'billen', 'onderrug'], apparaat: ['stang'], soort: 'basis', gewichtType: 'totaal', stap: 2.5,
    tips: ['Knieën licht gebogen en die hoek blijft gelijk.', 'Heupen naar achteren duwen tot je de hamstrings voelt rekken.', 'Stang blijft dicht langs je benen, rug recht.'] }),
  o({ id: 'rdl-db', naam: 'Roemeense deadlift (dumbbells)', spieren: ['hamstrings', 'billen', 'onderrug'], apparaat: ['dumbbells'], soort: 'basis', gewichtType: 'per-hand', stap: 2,
    tips: ['Knieën licht gebogen, heupen naar achteren.', 'Dumbbells langs je benen, rug recht.'] }),
  o({ id: 'hipthrust-stang', naam: 'Hip thrust (stang)', spieren: ['billen', 'hamstrings'], apparaat: ['stang', 'bank'], soort: 'hulp', gewichtType: 'totaal', stap: 5,
    tips: ['Schouderbladen tegen de bank, kussen onder de stang.', 'Kin naar je borst, ribben omlaag.', 'Bovenin billen hard aanspannen, één tel vasthouden.'] }),
  o({ id: 'hipthrust-machine', naam: 'Hip thrust-machine', spieren: ['billen', 'hamstrings'], apparaat: ['hipthrust'], soort: 'hulp', gewichtType: 'schijven', stap: 5,
    tips: ['Bovenin billen hard aanspannen, één tel vasthouden.', 'Niet overstrekken in je onderrug.'] }),
  o({ id: 'hipthrust-smith', naam: 'Hip thrust in de Smith-machine', spieren: ['billen', 'hamstrings'], apparaat: ['smith', 'bank'], soort: 'hulp', gewichtType: 'totaal', stap: 5,
    tips: ['Schouderbladen tegen de bank, kussen onder de stang.', 'Bovenin één tel vasthouden.'] }),
  o({ id: 'rugstrekken', naam: 'Rugstrekken (45°)', spieren: ['onderrug', 'billen', 'hamstrings'], apparaat: ['rugstrekbank'], soort: 'hulp', gewichtType: 'lichaamsgewicht', stap: 2.5,
    tips: ['Kussen net onder je heupbeenderen.', 'Buig vanuit je heupen, rug blijft recht.', 'Extra gewicht: schijf of dumbbell tegen je borst (noteer dat gewicht).'] }),
  o({ id: 'beenbuigen', naam: 'Beenbuigen (leg curl)', spieren: ['hamstrings'], apparaat: ['beenbuiger'], soort: 'hulp', gewichtType: 'stapel', stap: 5,
    tips: ['Draaipunt van de machine ter hoogte van je knie.', 'Langzaam terug, voel de rek.'] }),
  o({ id: 'kettlebell-swing', naam: 'Kettlebell swing', spieren: ['billen', 'hamstrings', 'romp'], apparaat: ['kettlebell'], soort: 'hulp', gewichtType: 'totaal', stap: 4,
    tips: ['Beweging komt uit je heupen, niet uit je armen.', 'Bovenin sta je rechtop met aangespannen billen.'] }),

  // ── Duwen horizontaal ─────────────────────────────────────
  o({ id: 'bankdrukken', naam: 'Bankdrukken (stang)', spieren: ['borst', 'triceps', 'schouders'], apparaat: ['stang', 'bank', 'rek'], soort: 'basis', gewichtType: 'totaal', stap: 2.5,
    tips: ['Schouderbladen naar achteren en omlaag, voeten stevig op de grond.', 'Stang zakt naar je onderste borst, ellebogen ±45° van je lichaam.', 'Train zwaar alleen met de veiligheidssteunen op de juiste hoogte.'] }),
  o({ id: 'db-bankdrukken', naam: 'Bankdrukken (dumbbells)', spieren: ['borst', 'triceps', 'schouders'], apparaat: ['dumbbells', 'bank'], soort: 'basis', gewichtType: 'per-hand', stap: 2,
    tips: ['Schouderbladen naar achteren en omlaag.', 'Dumbbells zakken tot naast je borst.'] }),
  o({ id: 'smith-bankdrukken', naam: 'Bankdrukken in de Smith-machine', spieren: ['borst', 'triceps', 'schouders'], apparaat: ['smith', 'bank'], soort: 'basis', gewichtType: 'totaal', stap: 2.5,
    tips: ['Bank zo zetten dat de stang op je onderste borst zakt.'] }),
  o({ id: 'borstpress', naam: 'Chest press (machine)', spieren: ['borst', 'triceps', 'schouders'], apparaat: ['borstpress'], soort: 'basis', gewichtType: 'stapel', stap: 5,
    tips: ['Handgrepen ter hoogte van je middelste borst.', 'Schouderbladen tegen het kussen.'] }),
  o({ id: 'plate-borstpress', naam: 'Chest press (plate-loaded)', spieren: ['borst', 'triceps', 'schouders'], apparaat: ['plate-borst'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Stoel zo dat de handgrepen op je middelste borst uitkomen.', 'Schouderbladen naar achteren tegen het kussen, borst vooruit.', 'Rustig terug tot je de rek in je borst voelt.', 'Noteer alleen de schijven (beide kanten samen).'] }),
  o({ id: 'plate-schuin', naam: 'Incline press (plate-loaded)', spieren: ['borst', 'schouders', 'triceps'], apparaat: ['plate-schuin'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Handgrepen ter hoogte van je bovenste borst.', 'Schouderbladen naar achteren, ellebogen iets onder schouderhoogte.', 'Noteer alleen de schijven.'] }),
  o({ id: 'db-fly', naam: 'Dumbbell fly', spieren: ['borst'], apparaat: ['dumbbells', 'bank'], soort: 'hulp', gewichtType: 'per-hand', stap: 2,
    tips: ['Ellebogen licht gebogen en die hoek blijft gelijk.', 'Zak tot je de rek in je borst voelt, niet verder.'] }),
  o({ id: 'schuin-db', naam: 'Schuin bankdrukken (dumbbells)', spieren: ['borst', 'schouders', 'triceps'], apparaat: ['dumbbells', 'bank'], soort: 'basis', gewichtType: 'per-hand', stap: 2,
    tips: ['Bank op 30°.', 'Dumbbells zakken tot naast je bovenste borst.'] }),
  o({ id: 'schuin-stang', naam: 'Schuin bankdrukken (stang)', spieren: ['borst', 'schouders', 'triceps'], apparaat: ['stang', 'bank', 'rek'], soort: 'basis', gewichtType: 'totaal', stap: 2.5,
    tips: ['Bank op 30°.', 'Stang zakt naar je bovenste borst.'] }),
  o({ id: 'pecdeck', naam: 'Butterfly (pec deck)', spieren: ['borst'], apparaat: ['pecdeck'], soort: 'hulp', gewichtType: 'stapel', stap: 5,
    tips: ['Ellebogen licht gebogen, borst vooruit.', 'Rustig terug tot je de rek voelt.'] }),
  o({ id: 'kabel-fly', naam: 'Kabel fly', spieren: ['borst'], apparaat: ['kabel'], soort: 'hulp', gewichtType: 'stapel', stap: 2.5,
    tips: ['Katrollen op schouderhoogte, één stap naar voren.', 'Handen komen samen voor je borst.'] }),
  o({ id: 'dips', naam: 'Dips', spieren: ['borst', 'triceps', 'schouders'], apparaat: ['optrekstang'], soort: 'hulp', gewichtType: 'lichaamsgewicht', stap: 2.5,
    tips: ['Zak tot je bovenarmen horizontaal zijn.', 'Lukt het nog niet: gebruik de ondersteuning of een band.', 'Gewicht = extra gewicht (0 = alleen je lichaam).'] }),
  o({ id: 'push-up', naam: 'Opdrukken', spieren: ['borst', 'triceps', 'romp'], apparaat: [], soort: 'hulp', gewichtType: 'lichaamsgewicht', stap: 0,
    tips: ['Lichaam in één lijn, buik aangespannen.', 'Borst tot vlak boven de grond.'] }),

  // ── Duwen verticaal ───────────────────────────────────────
  o({ id: 'overhead-press', naam: 'Overhead press (stang)', spieren: ['schouders', 'triceps', 'romp'], apparaat: ['stang', 'rek'], soort: 'basis', gewichtType: 'totaal', stap: 2.5,
    tips: ['Staand, billen en buik aangespannen.', 'Hoofd even naar achteren, stang recht omhoog.', 'Bovenin hoofd door je armen.'] }),
  o({ id: 'db-schouderdrukken', naam: 'Schouderdrukken zittend (dumbbells)', spieren: ['schouders', 'triceps'], apparaat: ['dumbbells', 'bank'], soort: 'basis', gewichtType: 'per-hand', stap: 2,
    tips: ['Bank bijna rechtop, rug tegen de leuning.', 'Dumbbells zakken tot oorhoogte.'] }),
  o({ id: 'plate-schouderpress', naam: 'Shoulder press (plate-loaded)', spieren: ['schouders', 'triceps'], apparaat: ['plate-schouder'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Handgrepen starten op schouderhoogte.', 'Rug tegen de leuning, niet hol trekken.', 'Noteer alleen de schijven.'] }),
  o({ id: 'schouderpress', naam: 'Shoulder press (machine)', spieren: ['schouders', 'triceps'], apparaat: ['schouderpress'], soort: 'basis', gewichtType: 'stapel', stap: 5,
    tips: ['Handgrepen starten op schouderhoogte.', 'Niet volledig op slot bovenin.'] }),
  o({ id: 'zijwaarts-heffen', naam: 'Zijwaarts heffen (dumbbells)', spieren: ['schouders'], apparaat: ['dumbbells'], soort: 'hulp', gewichtType: 'per-hand', stap: 1,
    tips: ['Licht gewicht, geen zwaai.', 'Armen tot schouderhoogte, pinken iets omhoog.'] }),
  o({ id: 'kabel-zijwaarts', naam: 'Zijwaarts heffen (kabel)', spieren: ['schouders'], apparaat: ['kabel'], soort: 'hulp', gewichtType: 'stapel', stap: 2.5, perKant: true,
    tips: ['Katrol laag, kabel achter je lichaam langs.', 'Arm tot schouderhoogte.'] }),
  o({ id: 'face-pull', naam: 'Face pull (kabel)', spieren: ['schouders', 'rug'], apparaat: ['kabel'], soort: 'hulp', gewichtType: 'stapel', stap: 2.5,
    tips: ['Touw op ooghoogte.', 'Trek naar je gezicht, ellebogen hoog en handen naar buiten.', 'Goed voor je schouders als je veel boven je hoofd werkt.'] }),
  o({ id: 'reverse-fly', naam: 'Reverse fly (pec deck)', spieren: ['schouders', 'rug'], apparaat: ['pecdeck'], soort: 'hulp', gewichtType: 'stapel', stap: 5,
    tips: ['Borst tegen het kussen, armen bijna gestrekt.', 'Trek naar achteren tot je armen in lijn met je schouders zijn.'] }),

  // ── Trekken verticaal ─────────────────────────────────────
  o({ id: 'latpulldown', naam: 'Lat pulldown', spieren: ['rug', 'biceps'], apparaat: ['latpulldown'], soort: 'basis', gewichtType: 'stapel', stap: 5,
    tips: ['Iets breder dan schouderbreedte, borst omhoog.', 'Trek de stang naar je bovenste borst, ellebogen naar je zij.', 'Rustig terug tot je armen gestrekt zijn.'] }),
  o({ id: 'plate-pulldown', naam: 'Pulldown (plate-loaded)', spieren: ['rug', 'biceps'], apparaat: ['plate-pulldown'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Bovenbenen vast onder de rol.', 'Trek met je ellebogen naar je zij, borst omhoog.', 'Eenarmig kan ook: noteer dan per arm en zet het in de notitie.', 'Noteer alleen de schijven.'] }),
  o({ id: 'optrekken', naam: 'Optrekken (pull-up)', spieren: ['rug', 'biceps'], apparaat: ['optrekstang'], soort: 'basis', gewichtType: 'lichaamsgewicht', stap: 2.5,
    tips: ['Vanuit gestrekte armen tot je kin boven de stang.', 'Lukt het nog niet: gebruik de ondersteuning of kies lat pulldown.', 'Gewicht = extra gewicht (0 = alleen je lichaam).'] }),

  // ── Trekken horizontaal ───────────────────────────────────
  o({ id: 'kabelroeien', naam: 'Kabelroeien zittend', spieren: ['rug', 'biceps'], apparaat: ['roeimachine'], soort: 'basis', gewichtType: 'stapel', stap: 5,
    tips: ['Rug recht, borst omhoog.', 'Trek naar je navel, schouderbladen samen.', 'Niet achterover zwaaien.'] }),
  o({ id: 'plate-roeien', naam: 'Iso-lateral row (plate-loaded)', spieren: ['rug', 'biceps'], apparaat: ['plate-roei'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Borst tegen het kussen, schouders laag.', 'Trek je ellebogen langs je lichaam naar achteren, schouderbladen samen.', 'Eén tel vasthouden, rustig terug tot je armen gestrekt zijn.', 'Noteer alleen de schijven (beide kanten samen).'] }),
  o({ id: 'plate-highrow', naam: 'High row (plate-loaded)', spieren: ['rug', 'schouders', 'biceps'], apparaat: ['plate-highrow'], soort: 'basis', gewichtType: 'schijven', stap: 5,
    tips: ['Trek schuin naar beneden en naar achteren, ellebogen breed.', 'Borst omhoog, niet achterover hangen.', 'Noteer alleen de schijven.'] }),
  o({ id: 'tbar-roeien', naam: 'T-bar row', spieren: ['rug', 'biceps', 'onderrug'], apparaat: ['tbar'], soort: 'basis', gewichtType: 'schijven', stap: 2.5,
    tips: ['Met borststeun: borst tegen het kussen. Zonder: rug recht, ±45° voorover.', 'Trek naar je onderste borst, schouderbladen samen.', 'Noteer de schijven op de stang.'] }),
  o({ id: 'kroc-row', naam: 'Kroc row (zware eenarmige dumbbell row)', spieren: ['rug', 'biceps', 'grip'], apparaat: ['dumbbells'], soort: 'hulp', gewichtType: 'per-hand', stap: 2, perKant: true,
    tips: ['Zware dumbbell, hand op het rek of de bank.', 'Veel herhalingen (12-20), een beetje body English mag.', 'Trek naar je heup.'] }),
  o({ id: 'db-pullover', naam: 'Dumbbell pullover', spieren: ['rug', 'borst'], apparaat: ['dumbbells', 'bank'], soort: 'hulp', gewichtType: 'totaal', stap: 2,
    tips: ['Dwars of in de lengte op de bank, één dumbbell met twee handen.', 'Armen licht gebogen, zak achter je hoofd tot je de rek voelt.'] }),
  o({ id: 'db-roeien', naam: 'Eenarmig roeien (dumbbell)', spieren: ['rug', 'biceps'], apparaat: ['dumbbells', 'bank'], soort: 'basis', gewichtType: 'per-hand', stap: 2, perKant: true,
    tips: ['Knie en hand op de bank, rug plat.', 'Trek de dumbbell naar je heup.'] }),
  o({ id: 'borst-gesteund-roeien', naam: 'Roeien met borststeun (dumbbells)', spieren: ['rug', 'biceps'], apparaat: ['dumbbells', 'bank'], soort: 'basis', gewichtType: 'per-hand', stap: 2,
    tips: ['Bank op 30-45°, borst tegen de leuning.', 'Trek beide dumbbells naar je heupen.', 'Spaart je onderrug.'] }),
  o({ id: 'stang-roeien', naam: 'Voorovergebogen roeien (stang)', spieren: ['rug', 'biceps', 'onderrug'], apparaat: ['stang'], soort: 'basis', gewichtType: 'totaal', stap: 2.5,
    tips: ['Romp ±45° voorover, rug recht.', 'Trek de stang naar je navel.'] }),

  // ── Armen ─────────────────────────────────────────────────
  o({ id: 'db-curl', naam: 'Biceps curl (dumbbells)', spieren: ['biceps'], apparaat: ['dumbbells'], soort: 'hulp', gewichtType: 'per-hand', stap: 1,
    tips: ['Ellebogen blijven naast je lichaam.', 'Rustig laten zakken.'] }),
  o({ id: 'hamer-curl', naam: 'Hamer curl', spieren: ['biceps', 'grip'], apparaat: ['dumbbells'], soort: 'hulp', gewichtType: 'per-hand', stap: 1,
    tips: ['Duimen omhoog, ellebogen naast je lichaam.'] }),
  o({ id: 'kabel-curl', naam: 'Biceps curl (kabel)', spieren: ['biceps'], apparaat: ['kabel'], soort: 'hulp', gewichtType: 'stapel', stap: 2.5,
    tips: ['Katrol laag, ellebogen naast je lichaam.'] }),
  o({ id: 'stang-curl', naam: 'Biceps curl (stang)', spieren: ['biceps'], apparaat: ['stang'], soort: 'hulp', gewichtType: 'totaal', stap: 2.5,
    tips: ['Geen zwaai vanuit je rug.'] }),
  o({ id: 'triceps-pushdown', naam: 'Triceps pushdown (kabel)', spieren: ['triceps'], apparaat: ['kabel'], soort: 'hulp', gewichtType: 'stapel', stap: 2.5,
    tips: ['Ellebogen tegen je zij, alleen je onderarmen bewegen.', 'Onderin even uitstrekken.'] }),
  o({ id: 'triceps-boven-hoofd', naam: 'Triceps boven het hoofd (kabel)', spieren: ['triceps'], apparaat: ['kabel'], soort: 'hulp', gewichtType: 'stapel', stap: 2.5,
    tips: ['Met je rug naar de katrol, touw achter je hoofd.', 'Ellebogen wijzen naar voren en blijven op hun plek.'] }),
  o({ id: 'db-triceps-boven-hoofd', naam: 'Triceps boven het hoofd (dumbbell)', spieren: ['triceps'], apparaat: ['dumbbells'], soort: 'hulp', gewichtType: 'totaal', stap: 2,
    tips: ['Eén dumbbell met twee handen achter je hoofd.', 'Ellebogen wijzen naar voren.'] }),

  // ── Kuiten ────────────────────────────────────────────────
  o({ id: 'kuit-machine', naam: 'Kuitheffen (machine)', spieren: ['kuiten'], apparaat: ['kuitmachine'], soort: 'hulp', gewichtType: 'stapel', stap: 5,
    tips: ['Helemaal omlaag tot je de rek voelt, bovenin één tel vasthouden.'] }),
  o({ id: 'kuit-legpress', naam: 'Kuitheffen in de leg press', spieren: ['kuiten'], apparaat: ['legpress'], soort: 'hulp', gewichtType: 'schijven', stap: 5,
    tips: ['Alleen je voorvoeten op de rand van het plateau.', 'Zet de veiligheidsvergrendeling dicht bij.'] }),
  o({ id: 'kuit-staand-db', naam: 'Kuitheffen staand (dumbbell)', spieren: ['kuiten'], apparaat: ['dumbbells'], soort: 'hulp', gewichtType: 'per-hand', stap: 2, perKant: true,
    tips: ['Voorvoet op een verhoging, één been tegelijk.'] }),

  // ── Romp en grip ──────────────────────────────────────────
  o({ id: 'kabel-crunch', naam: 'Kabel crunch', spieren: ['romp'], apparaat: ['kabel'], soort: 'romp', gewichtType: 'stapel', stap: 2.5,
    tips: ['Geknield, touw naast je hoofd.', 'Rol je ribben naar je bekken; heupen blijven stil.'] }),
  o({ id: 'pallof-press', naam: 'Pallof press', spieren: ['romp'], apparaat: ['kabel'], soort: 'romp', gewichtType: 'stapel', stap: 2.5, perKant: true,
    tips: ['Zijwaarts naast de katrol, handgreep tegen je borst.', 'Druk je armen recht vooruit en laat je niet wegdraaien.'] }),
  o({ id: 'knieheffen-hangend', naam: 'Knieheffen hangend', spieren: ['romp'], apparaat: ['optrekstang'], soort: 'romp', gewichtType: 'lichaamsgewicht', stap: 0,
    tips: ['Rustig, zonder zwaaien.', 'Knieën naar je borst en je bekken iets kantelen.'] }),
  o({ id: 'dead-bug', naam: 'Dead bug', spieren: ['romp'], apparaat: [], soort: 'romp', gewichtType: 'lichaamsgewicht', stap: 0, perKant: true,
    tips: ['Onderrug blijft tegen de grond.', 'Strek tegelijk arm en tegenovergesteld been, langzaam.'] }),
  o({ id: 'plank', naam: 'Plank (seconden)', spieren: ['romp'], apparaat: [], soort: 'romp', gewichtType: 'lichaamsgewicht', stap: 0,
    tips: ['Ellebogen onder je schouders, lichaam in één lijn.', 'Noteer seconden bij herhalingen.'] }),
  o({ id: 'boerenwandeling', naam: 'Boerenwandeling (seconden)', spieren: ['grip', 'romp', 'schouders'], apparaat: ['dumbbells'], soort: 'romp', gewichtType: 'per-hand', stap: 2,
    tips: ['Zware dumbbell in elke hand, rechtop lopen.', 'Schouders laag, buik aangespannen.', 'Noteer seconden bij herhalingen. Handig voor sjouwen met emmers en ladders.'] }),

  // ── Conditie ──────────────────────────────────────────────
  o({ id: 'intervallen', naam: 'Intervallen (fiets, roeier of airbike)', spieren: ['conditie'], apparaat: ['cardio'], soort: 'romp', gewichtType: 'geen', stap: 0,
    tips: ['2-3 minuten rustig inrijden.', 'Elke ronde: de aangegeven seconden voluit, daarna rustig doortrappen of -roeien tot de rusttimer afgaat.', 'Noteer de seconden die je voluit ging. Lukt alles makkelijk: maak de rondes langer of zet de weerstand hoger.', 'Maakt je vetverbranding en conditie beter zonder je krachttraining in de weg te zitten.'] }),
  o({ id: 'kettlebell-intervallen', naam: 'Kettlebell swing-intervallen', spieren: ['conditie', 'billen', 'hamstrings'], apparaat: ['kettlebell'], soort: 'romp', gewichtType: 'totaal', stap: 4,
    tips: ['Swings op tempo gedurende de aangegeven seconden, daarna rust tot de timer afgaat.', 'Beweging uit je heupen, rug recht.'] }),

  // ── Panatta (zie panatta.ts) ──────────────────────────────
  ...PANATTA,
];

/** Engelse zoektermen voor voorbeeldvideo's van de algemene oefeningen. */
const VIDEO: Record<string, string> = {
  squat: 'barbell back squat technique',
  hacksquat: 'hack squat machine technique',
  'smith-squat': 'smith machine squat technique',
  legpress: 'leg press technique',
  'goblet-squat': 'goblet squat technique',
  'bulgaarse-split-squat': 'bulgarian split squat dumbbell technique',
  deadlift: 'conventional deadlift technique',
  rdl: 'romanian deadlift technique',
  'rdl-db': 'dumbbell romanian deadlift technique',
  'hipthrust-stang': 'barbell hip thrust technique',
  bankdrukken: 'bench press technique',
  'db-bankdrukken': 'dumbbell bench press technique',
  'schuin-db': 'incline dumbbell press technique',
  'db-schouderdrukken': 'seated dumbbell shoulder press technique',
  'zijwaarts-heffen': 'dumbbell lateral raise technique',
  'face-pull': 'cable face pull technique',
  latpulldown: 'lat pulldown technique',
  optrekken: 'pull up technique',
  kabelroeien: 'seated cable row technique',
  'db-roeien': 'one arm dumbbell row technique',
  'borst-gesteund-roeien': 'chest supported dumbbell row technique',
  'kroc-row': 'kroc row technique',
  'tbar-roeien': 't bar row technique',
  'db-curl': 'dumbbell biceps curl technique',
  'hamer-curl': 'hammer curl technique',
  'triceps-pushdown': 'cable triceps pushdown technique',
  boerenwandeling: 'farmers walk technique',
  'pallof-press': 'pallof press technique',
  'kabel-crunch': 'cable crunch technique',
};

/** Link naar voorbeeldvideo's (YouTube-zoekopdracht). */
export function videoLink(oef: Oefening): string {
  const zoek = oef.video ?? VIDEO[oef.id] ?? `${oef.naam.replace(/\s*\(.*\)\s*/g, ' ').trim()} oefening uitvoering`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(zoek)}`;
}

/** Oefeningen waarbij je seconden noteert in plaats van herhalingen. */
export const OP_TIJD = new Set(['plank', 'boerenwandeling', 'intervallen', 'kettlebell-intervallen']);

export function alleOefeningen(eigen: Oefening[]): Oefening[] {
  return [...OEFENINGEN, ...eigen];
}

export function zoekOefening(id: string, eigen: Oefening[] = []): Oefening | undefined {
  return OEFENINGEN.find((x) => x.id === id) ?? eigen.find((x) => x.id === id);
}

export function beschikbaar(oef: Oefening, apparatuur: Record<ApparaatId, boolean>): boolean {
  return oef.apparaat.every((a) => apparatuur[a]);
}

export function standaardApparatuur(): Record<ApparaatId, boolean> {
  return Object.fromEntries(APPARATUUR.map((a) => [a.id, a.standaard])) as Record<ApparaatId, boolean>;
}

/** Eenheid achter het gewicht, bijvoorbeeld 'kg per hand'. */
export function gewichtLabel(oef: Oefening): string {
  switch (oef.gewichtType) {
    case 'per-hand':
      return 'kg per hand';
    case 'lichaamsgewicht':
      return 'kg extra';
    case 'stapel':
      return 'kg (stapel)';
    case 'schijven':
      return 'kg schijven';
    case 'geen':
      return '';
    default:
      return 'kg';
  }
}

export function repLabel(oefId: string): string {
  return OP_TIJD.has(oefId) ? 'sec' : 'x';
}
