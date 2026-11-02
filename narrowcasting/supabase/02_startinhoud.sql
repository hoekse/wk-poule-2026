-- Narrowcasting Hoeksema Schilderwerken — startinhoud
-- Bestaande rijen worden NIET overschreven (on conflict do nothing),
-- dus dit script is veilig om opnieuw te draaien.

insert into public.narrowcasting_instellingen (sleutel, waarde) values
  ('bedrijf', $j${"naam":"Hoeksema Schilderwerken","slogan":"Jouw partner in kleurrijk meesterschap","website":"schildersbedrijfhoeksema.nl","telefoon":"06 41 14 43 58","email":"","adres":"Industrieweg 3-U, 8263 AA Kampen","logo":"media/logo.svg","logo_wit":"media/logo-wit.svg"}$j$::jsonb),
  ('ticker', $j$["Vakwerk voor binnen én buiten — vraag vrijblijvend advies","Schilderwerk · Beglazing · Wandafwerking · Kleuradvies","De winter is hét moment voor binnenschilderwerk","Plan je buitenschilderwerk voor het voorjaar nu alvast in"]$j$::jsonb),
  ('mededeling', $j${"tekst":"","kleur":"rood","tot":null}$j$::jsonb),
  ('weer', $j${"plaats":"Kampen"}$j$::jsonb),
  ('weergave', $j${"standaard_duur":12,"overgang":"vervagen","verversen_sec":30,"ticker_snelheid":110}$j$::jsonb),
  ('nachtstand', $j${"aan":false,"van":"19:00","tot":"07:00","weekend":false}$j$::jsonb),
  ('herladen', $j$1$j$::jsonb)
on conflict (sleutel) do nothing;

insert into public.narrowcasting_slides (naam, volgorde, type, actief, duur, van, tot, dagen, schermen, inhoud) values
  ('welkom', 10, 'titel', true, 10, null, null, null, null, $j${"titel":"{groet}, welkom!","tekst":"Jouw partner in *kleurrijk meesterschap*","thema":"licht","kleur":"blauw"}$j$::jsonb),
  ('diensten', 20, 'diensten', true, 14, null, null, null, null, $j${"kop":"Onze diensten","titel":"Vakwerk voor binnen én buiten","thema":"licht","items":[{"naam":"Binnenschilderwerk","icoon":"roller","tekst":"Wanden, plafonds, deuren en kozijnen strak afgewerkt"},{"naam":"Buitenschilderwerk","icoon":"huis","tekst":"Kozijnen, gevels en houtwerk beschermd tegen weer en wind"},{"naam":"Beglazing","icoon":"glas","tekst":"Glas vervangen of vernieuwen, vakkundig geplaatst"},{"naam":"Wandafwerking","icoon":"muur","tekst":"Een strakke, verzorgde afwerking van je wanden"},{"naam":"Kleuradvies","icoon":"palet","tekst":"De juiste kleur op de juiste plek"}]}$j$::jsonb),
  ('voor-na-voorbeeld', 30, 'voor_na', true, 14, null, null, null, null, $j${"kop":"Voor & na","titel":"Van verweerd naar *als nieuw*","voor":"media/voorbeeld-voor.svg","na":"media/voorbeeld-na.svg","onderschrift":"Kozijnen, boeideel en voordeur opnieuw geschilderd","thema":"donker","kleur":"groen"}$j$::jsonb),
  ('schilderweer', 40, 'weer', true, 14, null, null, null, null, $j${"thema":"licht","kleur":"blauw"}$j$::jsonb),
  ('tip-buiten-schilderen', 50, 'tekst', true, 14, null, null, null, null, $j${"kop":"Schilderstip","titel":"Wanneer schilder je *buiten*?","punten":["Bij voorkeur vanaf zo'n 10 °C","Droog weer, ook de dag erna","Niet in de felle middagzon","Liefst niet bij hoge luchtvochtigheid"],"thema":"donker","kleur":"geel"}$j$::jsonb),
  ('wist-je-dat-onderhoud', 60, 'tekst', true, 12, null, null, null, null, $j${"kop":"Wist je dat?","titel":"Op tijd schilderen voorkomt *houtrot*","tekst":"Door buitenschilderwerk tijdig bij te werken, blijft het hout beschermd en voorkom je dure reparaties. We kijken graag vrijblijvend met je mee.","thema":"licht","kleur":"groen"}$j$::jsonb),
  ('contact', 70, 'contact', true, 12, null, null, null, null, $j${"kop":"Contact","titel":"Vrijblijvend advies of een offerte?","tekst":"Scan de QR-code of neem contact met ons op.","thema":"donker","kleur":"blauw"}$j$::jsonb),
  ('feestdagen', 5, 'titel', true, 10, '2026-12-14', '2027-01-03', null, null, $j${"kop":"Het team van Hoeksema Schilderwerken wenst je","titel":"Fijne feestdagen en een *kleurrijk* {volgend_jaar}!","thema":"donker","kleur":"rood"}$j$::jsonb),
  ('vacature', 80, 'vacature', false, 14, null, null, null, null, $j${"kop":"Vacature","titel":"Wij zoeken versterking!","functie":"Allround schilder (m/v)","punten":["Binnen- en buitenschilderwerk","Gevarieerde projecten","Vakmanschap en netjes werken staan voorop"],"tekst":"Interesse? Spreek ons aan of kijk op de website.","link":"schildersbedrijfhoeksema.nl","thema":"licht","kleur":"rood"}$j$::jsonb),
  ('review-voorbeeld', 90, 'review', false, 12, null, null, null, null, $j${"tekst":"Plak hier een echte review van een klant (bijvoorbeeld van Google).","naam":"Naam klant","plaats":"Plaats","sterren":5,"thema":"donker","kleur":"geel"}$j$::jsonb)
on conflict (naam) do nothing;
