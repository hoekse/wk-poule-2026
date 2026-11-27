export type FaqItem = {
  vraag: string;
  antwoord: string;
  categorie:
    | 'Bestellen'
    | 'Maatwerk & opmeten'
    | 'Aanbrengen'
    | 'Materiaal & veiligheid'
    | 'Verzenden & retour'
    | 'Personaliseren';
};

export const faq: FaqItem[] = [
  // Bestellen
  {
    categorie: 'Bestellen',
    vraag: `Hoe bestel ik fotobehang op maat?`,
    antwoord: `Kies een wereld, vul de breedte en hoogte van je muur in en bekijk je ontwerp direct in de live preview. Klopt alles, dan leg je het in je winkelwagen en reken je af. Op <a href="/zo-werkt-het/">zo werkt het</a> lees je alle stappen.`,
  },
  {
    categorie: 'Bestellen',
    vraag: `Hoe kan ik betalen?`,
    antwoord: `Je betaalt bij het afrekenen via onze betaaldienstverlener Mollie. Je kiest daar uit de betaalmethoden die bij het afrekenen worden getoond, zoals iDEAL.`,
  },
  {
    categorie: 'Bestellen',
    vraag: `Komen de personages ook terug op andere producten?`,
    antwoord: `Ja. Rembrandt 2.0, Bella Ballon en Kees Komeet komen terug op fotobehang, behangcirkels, posters en muurstickers. Zo bouw je stap voor stap een kamer waarin alles bij elkaar hoort. Maak kennis met <a href="/personages/">de personages</a>.`,
  },
  {
    categorie: 'Bestellen',
    vraag: `Kan ik ook zakelijk bestellen, bijvoorbeeld voor een kinderopvang of praktijk?`,
    antwoord: `Ja, graag zelfs. Voor kinderopvang, praktijken en andere organisaties denken we mee over werelden, maten en planning. Lees meer op onze pagina voor <a href="/zakelijk/">zakelijke klanten</a>.`,
  },

  // Maatwerk & opmeten
  {
    categorie: 'Maatwerk & opmeten',
    vraag: `Hoe meet ik mijn muur op?`,
    antwoord: `Meet de breedte op drie hoogtes en de hoogte op drie plekken, en noteer steeds de grootste maat in hele centimeters. Rond altijd naar boven af. In ons artikel <a href="/inspiratie/hoeveel-behang-nodig/">hoeveel behang heb je nodig</a> leggen we het stap voor stap uit.`,
  },
  {
    categorie: 'Maatwerk & opmeten',
    vraag: `Wat betekent 5 cm overmaat rondom?`,
    antwoord: `We leveren fotobehang op maat met 5 cm extra aan alle kanten, zonder extra kosten. Zo kun je het behang netjes bijsnijden langs het plafond, de plint en scheve hoeken. Je vult zelf alleen de netto maat van je muur in.`,
  },
  {
    categorie: 'Maatwerk & opmeten',
    vraag: `Wat kost fotobehang op maat en is er een minimale afmeting?`,
    antwoord: `Fotobehang op maat kost €44,95 per m² in vlies mat en €59,95 per m² in naadloos textiel. Je bestelt vanaf 3 m². Voor een kleiner vlak is een <a href="/behangcirkels/">behangcirkel</a> vaak een mooie keuze.`,
  },
  {
    categorie: 'Maatwerk & opmeten',
    vraag: `Moet ik ramen en deuren van mijn maten aftrekken?`,
    antwoord: `Nee. Meet de hele muur, alsof het raam of de deur er niet zit. Het ontwerp loopt dan door en je snijdt de opening ter plekke uit. Bekijk in de live preview wel waar de personages terechtkomen.`,
  },

  // Aanbrengen
  {
    categorie: 'Aanbrengen',
    vraag: `Kan ik het fotobehang zelf aanbrengen?`,
    antwoord: `Ja. Ons fotobehang is vliesbehang en breng je aan met de plak-de-muur-methode: je rolt de lijm op de muur en drukt de droge baan erin. In onze handleiding <a href="/inspiratie/fotobehang-aanbrengen/">fotobehang aanbrengen</a> lees je hoe je dat stap voor stap doet.`,
  },
  {
    categorie: 'Aanbrengen',
    vraag: `Welke lijm heb ik nodig?`,
    antwoord: `Gebruik een vlieslijm die geschikt is voor vliesbehang en volg de mengverhouding op de verpakking. Rol de lijm op de muur, niet op het behang.`,
  },
  {
    categorie: 'Aanbrengen',
    vraag: `Kunnen jullie het behang voor mij aanbrengen?`,
    antwoord: `Ja. Onze partner <a href="https://www.multiwalls.nl" target="_blank" rel="noopener">Multiwalls</a> brengt je fotobehang aan voor € 75 per uur, exclusief reiskosten, in de regio Kampen, Zwolle, Dronten, Lelystad en Hattem (elders op aanvraag). Vink het aan bij het afrekenen of <a href="/contact/?onderwerp=aanbrengen">vraag een offerte aan</a>; je ontvangt altijd eerst een offerte.`,
  },
  {
    categorie: 'Aanbrengen',
    vraag: `Hoe verwijder ik het behang later weer?`,
    antwoord: `Ons vliesbehang is droog afneembaar. Je trekt de banen in principe in hun geheel van de muur, zonder ze eerst te weken of te stomen. Eventuele lijmresten verwijder je met een spons en warm water.`,
  },

  // Materiaal & veiligheid
  {
    categorie: 'Materiaal & veiligheid',
    vraag: `Van welk materiaal is jullie fotobehang gemaakt?`,
    antwoord: `Je kiest uit twee pvc-vrije, brandvertragende materialen. Vlies mat is 200 g/m², FSC-gecertificeerd en wordt geleverd in genummerde banen van 53 cm. Naadloos textiel is polyester textiel in één stuk tot 290 cm hoog, gedrukt met geurloze inkt op waterbasis.`,
  },
  {
    categorie: 'Materiaal & veiligheid',
    vraag: `Is jullie behang geschikt voor de babykamer?`,
    antwoord: `Ja. Voor de babykamer raden we naadloos textiel aan: pvc-vrij en gedrukt met geurloze inkt op waterbasis. Vlies mat wordt met UV-inkt gedrukt; die kan de eerste dagen licht ruiken, wat vanzelf wegtrekt. Behang wel op tijd, een aantal weken voor de uitgerekende datum, en lucht de kamer goed na het drogen. Meer tips lees je in ons artikel over <a href="/inspiratie/veilig-behang-babykamer/">behang in de babykamer</a>.`,
  },
  {
    categorie: 'Materiaal & veiligheid',
    vraag: `Wat is het verschil tussen vlies mat en naadloos textiel?`,
    antwoord: `Vlies mat (€44,95 per m²) komt in banen van 53 cm die je naad-op-naad plakt, en kan tot 4 meter hoog. Naadloos textiel (€59,95 per m²) is één doorlopend stuk zonder naden tot 290 cm hoog, met een zachte textielstructuur en geurloze inkt. Twijfel je, bestel dan eerst een proefstaal.`,
  },
  {
    categorie: 'Materiaal & veiligheid',
    vraag: `Kan ik eerst een proefstaal bestellen?`,
    antwoord: `Ja. Een proefstaal op A4-formaat kost €3,95. Zo zie en voel je het materiaal en bekijk je de kleuren in het licht van je eigen kamer.`,
  },

  // Verzenden & retour
  {
    categorie: 'Verzenden & retour',
    vraag: `Wat zijn de verzendkosten?`,
    antwoord: `Binnen Nederland betaal je €4,95 verzendkosten. Vanaf €50 verzenden we gratis. We leveren alleen in Nederland.`,
  },
  {
    categorie: 'Verzenden & retour',
    vraag: `Hoe lang duurt het voordat mijn bestelling er is?`,
    antwoord: `Fotobehang op maat drukken we speciaal voor jou; reken op 5 tot 7 werkdagen. Behangcirkels, posters, stickers en proefstalen zijn er binnen 2 tot 4 werkdagen. We versturen met PostNL en je krijgt een track & trace-code per e-mail.`,
  },
  {
    categorie: 'Verzenden & retour',
    vraag: `Kan ik mijn bestelling retourneren?`,
    antwoord: `Standaardproducten zoals posters zonder naam, behangcirkels, muurstickersets en proefstalen kun je binnen 14 dagen na ontvangst retourneren. Fotobehang op maat en gepersonaliseerde producten maken we speciaal voor jou; die vallen niet onder het herroepingsrecht. Alles over retourneren lees je op <a href="/verzenden-en-retourneren/">verzenden en retourneren</a>.`,
  },
  {
    categorie: 'Verzenden & retour',
    vraag: `Wat doe ik als mijn bestelling beschadigd aankomt of een drukfout heeft?`,
    antwoord: `Maak foto's van de verpakking en het product en stuur ze ons zo snel mogelijk, samen met je ordernummer. We zorgen voor een vervangend product of je geld terug, ook bij maatwerk. Breng behang met een zichtbare fout niet aan.`,
  },

  // Personaliseren
  {
    categorie: 'Personaliseren',
    vraag: `Kan ik de naam van mijn kind toevoegen?`,
    antwoord: `Ja. Op fotobehang voeg je een naam toe voor €14,95 en op een poster voor €9,95. Je kunt ook kiezen voor een losse naamsticker van €24,95. Bekijk alle mogelijkheden bij <a href="/gepersonaliseerd/">gepersonaliseerd</a>.`,
  },
  {
    categorie: 'Personaliseren',
    vraag: `Wat als ik een fout in de naam heb gemaakt?`,
    antwoord: `Gepersonaliseerde producten maken we speciaal voor jou en kun je daarom niet retourneren. Controleer de spelling dus goed voordat je afrekent. Ontdek je toch een fout, <a href="/contact/">neem dan zo snel mogelijk contact met ons op</a>.`,
  },
];
