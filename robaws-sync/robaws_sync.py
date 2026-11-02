#!/usr/bin/env python3
"""Robaws -> Werkplaats: haalt klanten en projecten uit Robaws en maakt importpakketten voor de Werkplaats.

Gebruik:
  python3 robaws_sync.py check            test verbinding en sleutel (toont geen klantgegevens)
  python3 robaws_sync.py spec             haalt de API-beschrijving op en toont de velden van klanten en projecten
  python3 robaws_sync.py export [--droog] maakt pakketten in uit/ voor de Werkplaats (--droog: alleen tellen)

De sleutel komt uit de omgeving: als netwerkgeheim (de proxy zet hem erbij) of als ROBAWS_KEY en ROBAWS_SECRET.
Nooit in code, bestanden of chat.
De pakketten gaan naar de collectie robawsimport van de Werkplaats; de Werkplaats verwerkt ze zelf
(koppelen op robawsId, anders op naam en postcode; alleen gevulde velden overschrijven, nooit verwijderen).
"""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = os.environ.get('ROBAWS_BASE', 'https://app.robaws.com').rstrip('/')
SPEC_URL = BASE + '/api-docs/robaws'  # /public/api-docs/robaws is alleen de leesbare webpagina
HIER = Path(__file__).resolve().parent
UIT = HIER / 'uit'
MAX_PAKKET = 200_000  # een document in de Werkplaats mag maximaal 256 KiB zijn


class RobawsFout(Exception):
    pass


def _auth():
    """Basic-auth uit ROBAWS_KEY/ROBAWS_SECRET; ontbreken die, dan None: de proxy van de omgeving
    zet de sleutel (netwerkgeheim 'Basic' voor app.robaws.com) er zelf bij."""
    key, secret = os.environ.get('ROBAWS_KEY'), os.environ.get('ROBAWS_SECRET')
    if not key or not secret:
        return None
    return 'Basic ' + base64.b64encode(f'{key}:{secret}'.encode()).decode()


def haal(pad, params=None, auth=True, pogingen=5):
    """GET op de Robaws-API; wacht en probeert opnieuw bij de limiet van Robaws (HTTP 429) en bij een losse weigering (403)."""
    url = pad if pad.startswith('http') else BASE + pad
    if params:
        url += '?' + urllib.parse.urlencode(params, doseq=True)
    kop = {'Accept': 'application/json'}
    if auth and _auth():
        kop['Authorization'] = _auth()
    for poging in range(pogingen):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=kop), timeout=60) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429 and poging < pogingen - 1:
                wacht = float(e.headers.get('Retry-After') or 2 ** poging)
                time.sleep(min(wacht, 30))
                continue
            if e.code == 403 and auth and poging < pogingen - 1:
                # Robaws weigert soms los een verzoek dat even later wel mag (gezien na een rolwijziging): opnieuw.
                time.sleep(1 + poging)
                continue
            if e.code in (401, 403) and auth:
                raise RobawsFout(waarom_geweigerd(pad, e.code))
            raise RobawsFout(f'Robaws gaf HTTP {e.code} op {pad}')
        except urllib.error.URLError as e:
            raise RobawsFout(f'Robaws niet bereikbaar ({e.reason}). Staat app.robaws.com bij de toegestane domeinen?')
    raise RobawsFout('Robaws bleef te druk (HTTP 429).')


def waarom_geweigerd(pad, code):
    """Leg uit waarom Robaws een verzoek weigert: sleutel onbekend, of sleutel goed maar geen rechten."""
    try:
        wie = haal('/api/v2/whoami', auth=True, pogingen=1) if pad != '/api/v2/whoami' else None
    except RobawsFout:
        wie = None
    if wie is None:
        return (f'Robaws herkent de sleutel niet (HTTP {code}). Controleer of de sleutel als netwerkgeheim '
                '(Basic, app.robaws.com) of als ROBAWS_KEY/ROBAWS_SECRET in de omgeving staat, en of de '
                'API-gebruiker in Robaws API-toegang heeft.')
    return (f'De sleutel werkt, maar de API-gebruiker mag {pad} niet lezen (HTTP {code}). '
            'Geef hem in Robaws een rol met leesrechten op Klanten (met contactpersonen) en Projecten.')


def lijst_uit(antwoord):
    """De rijen uit een lijst-antwoord, ongeacht of Robaws ze in items, content of data zet."""
    if isinstance(antwoord, list):
        return antwoord, None
    for sleutel in ('items', 'content', 'data', 'results'):
        if isinstance(antwoord.get(sleutel), list):
            totaal = antwoord.get('totalItems', antwoord.get('totalElements', antwoord.get('total')))
            return antwoord[sleutel], totaal
    raise RobawsFout('Onbekende vorm van het lijst-antwoord: ' + ', '.join(list(antwoord)[:8]))


def alles(pad, params=None, grootte=100):
    """Alle rijen van een collectie, pagina voor pagina."""
    rijen, pagina = [], 0
    while True:
        deel, totaal = lijst_uit(haal(pad, dict(params or {}, page=pagina, size=grootte)))
        rijen += deel
        if len(deel) < grootte or (totaal is not None and len(rijen) >= int(totaal)):
            return rijen
        pagina += 1


# ---------- vertaling Robaws -> Werkplaats ----------
# Werkplaats-klant: naam, type (particulier|zakelijk), straat, postcode, plaats, land, tel, gsm, email,
# factuurEmail, btwnr, kvk, website, rechtsvorm, titel, betaalvoorwaarde, btw (0|9|21),
# contacten [{naam, functie, email, tel}], robawsId (tekst).
# Werkplaats-project: robawsId, robawsNr, naam, klantRobawsId, status (voorbereiding|actief|afgerond),
# straat, postcode, plaats, info.
# Lege of ontbrekende velden laat de Werkplaats staan, dus alleen vullen wat Robaws echt heeft.
# Veldnamen van Robaws komen uit de API-beschrijving (ClientReadDTO, ContactReadDTO, ProjectReadDTO, AddressDTO).

# legalForm en statusDetails vragen extra rechten (Robaws geeft 403); rechtsvorm en statusnaam laten we daarom weg.
KLANT_INCLUDE = ['contacts', 'paymentCondition', 'vatTariff']
PROJECT_INCLUDE = []
BTW_TARIEVEN = (0, 9, 21)  # wat de Werkplaats kent

# Robaws laat elk bedrijf zelf projectstatussen kiezen. Herkend op woorddelen, eerste treffer wint;
# onbekende status: leeg laten, dan houdt de Werkplaats zijn eigen status.
STATUS_WOORDEN = [
    ('afgerond', ('afgerond', 'afgewerkt', 'afgesloten', 'gesloten', 'opgeleverd', 'gefactureerd',
                  'geannuleerd', 'vervallen', 'verloren', 'closed', 'finished', 'cancel')),
    ('voorbereiding', ('voorbereid', 'offerte', 'aanvraag', 'nieuw', 'gepland', 'te plannen', 'planning', 'wacht',
                       'concept', 'prospect', 'new', 'draft', 'pending', 'planned')),
    ('actief', ('actief', 'lopend', 'loopt', 'uitvoering', 'bezig', 'gestart', 'in opdracht', 'opdracht',
                'gegund', 'open', 'active', 'progress', 'ongoing', 'started')),
]


def _tekst(v):
    return v.strip() if isinstance(v, str) else ''


def _schoon(d):
    """Alleen gevulde velden: de Werkplaats overschrijft niets met leeg."""
    return {k: v for k, v in d.items() if v not in (None, '', [])}


LANDEN = {'NL': 'Nederland', 'BE': 'België', 'DE': 'Duitsland', 'FR': 'Frankrijk', 'LU': 'Luxemburg'}  # zoals de Werkplaats


def _adres(a):
    a = a or {}
    straat = ', '.join(x for x in (_tekst(a.get('addressLine1')), _tekst(a.get('addressLine2'))) if x)
    land = _tekst(a.get('country'))
    return {'straat': straat, 'postcode': _tekst(a.get('postalCode')), 'plaats': _tekst(a.get('city')),
            'land': LANDEN.get(land.upper(), land)}


def _weg(r):
    return bool(r.get('deletedAt'))


def map_contact(c):
    if not c or _weg(c) or c.get('archivedAt'):
        return None
    naam = ' '.join(x for x in (_tekst(c.get('name')), _tekst(c.get('surname'))) if x)
    if not naam:
        return None
    naam = ' '.join(x for x in (_tekst(c.get('title')), naam) if x)  # zoals de Werkplaats: "Dhr. Jan Jansen"
    if not naam:
        return None
    # Sleutels op alfabet, zoals de opslag van de Werkplaats ze teruggeeft: die vergelijkt met JSON.stringify.
    return {'email': _tekst(c.get('email')), 'functie': _tekst(c.get('position')), 'naam': naam,
            'tel': _tekst(c.get('tel')) or _tekst(c.get('gsm'))}


def map_klant(c):
    if not c or _weg(c) or not c.get('id') or not _tekst(c.get('name')):
        return None
    adres = _adres(c.get('address'))
    btw = (c.get('vatTariff') or {}).get('percentage')
    btw = int(btw) if isinstance(btw, (int, float)) and btw in BTW_TARIEVEN else None
    rechtsvorm = _tekst((c.get('legalForm') or {}).get('name'))
    # Alleen btw-nummer of KvK telt als bewijs: in Robaws heeft ook "particulier" een rechtsvorm-id.
    zakelijk = any(_tekst(c.get(v)) for v in ('vatIdNumber', 'kvk', 'belgianCompanyNumber'))
    contacten = [x for x in (map_contact(k) for k in (c.get('contacts') or [])) if x]
    return _schoon({
        'robawsId': str(c['id']),
        'naam': _tekst(c.get('name')),
        'titel': _tekst(c.get('title')),
        'type': 'zakelijk' if zakelijk else None,  # geen bewijs van een bedrijf: laat de Werkplaats beslissen
        **adres,
        'tel': _tekst(c.get('tel')),
        'gsm': _tekst(c.get('gsm')),
        'email': _tekst(c.get('email')),
        'factuurEmail': _tekst(c.get('invoiceEmail')),
        'website': _tekst(c.get('website')),
        'btwnr': _tekst(c.get('vatIdNumber')),
        'kvk': _tekst(c.get('kvk')),
        'rechtsvorm': rechtsvorm,
        'betaalvoorwaarde': _tekst((c.get('paymentCondition') or {}).get('name')),
        'btw': btw,
        'contacten': contacten,
    })


def project_status(p):
    if p.get('archivedAt'):
        return 'afgerond'
    tekst = ' '.join(_tekst(x) for x in (p.get('status'), (p.get('statusDetails') or {}).get('name'))).lower()
    for status, woorden in STATUS_WOORDEN:
        if any(w in tekst for w in woorden):
            return status
    return None


def project_naam(p, klantnamen):
    """Robaws-projecten hebben geen naamveld. Naam = "klant - omschrijving", met als omschrijving de
    planningsnaam, anders de klantreferentie, anders de plaats. Alleen de omschrijving is vaak niet
    genoeg: veel projecten heten "Buitenschilderwerk woning"."""
    klant = klantnamen.get(str(p.get('clientId') or ''), '')
    oms = (_tekst(p.get('planningName')) or _tekst(p.get('clientReference'))
           or _tekst((p.get('siteAddress') or {}).get('city'))).rstrip('.').strip()
    if klant and oms.lower().startswith(klant.lower()):
        oms = oms[len(klant):].lstrip(' -').strip()
    samen = ' - '.join(x for x in (klant, oms) if x)
    return samen or _tekst(p.get('logicId'))


def map_project(p, klantnamen=None):
    if not p or _weg(p) or not p.get('id'):
        return None
    adres = _adres(p.get('siteAddress'))
    naam = project_naam(p, klantnamen or {})
    if not naam:
        return None
    return _schoon({
        'robawsId': str(p['id']),
        'robawsNr': _tekst(p.get('logicId')),
        'naam': naam,
        'klantRobawsId': str(p['clientId']) if p.get('clientId') else None,
        'status': project_status(p),
        'straat': adres['straat'],
        'postcode': adres['postcode'],
        'plaats': adres['plaats'],
    })


# ---------- pakketten ----------

def pakketten(soort, records, run, max_bytes=MAX_PAKKET):
    """Verdeel records over pakketten die elk in één document van de Werkplaats passen."""
    uit, deel, grootte = [], [], 0
    for r in records:
        n = len(json.dumps(r, ensure_ascii=False).encode('utf-8')) + 2
        if deel and grootte + n > max_bytes:
            uit.append(deel)
            deel, grootte = [], 0
        deel.append(r)
        grootte += n
    if deel:
        uit.append(deel)
    return [{'id': f'{run}-{soort}-{i + 1:03d}', 'soort': soort, 'run': run, 'deel': i + 1, 'delen': len(uit), 'records': d}
            for i, d in enumerate(uit)]


def schrijf(pakket_lijst, map_=UIT):
    map_.mkdir(parents=True, exist_ok=True)
    for oud in map_.glob('robawsimport-*.json'):
        oud.unlink()
    paden = []
    for p in pakket_lijst:
        doc = {k: v for k, v in p.items() if k != 'id'}
        pad = map_ / f"robawsimport-{p['id']}.json"
        pad.write_text(json.dumps(doc, ensure_ascii=False), encoding='utf-8')
        paden.append(pad)
    return paden


# ---------- opdrachten ----------

def cmd_check(_):
    wie = haal('/api/v2/whoami')
    print('Sleutel werkt.' if wie else 'Sleutel werkt, maar Robaws gaf geen gebruiker terug.')
    for soort, pad in (('Klanten', '/api/v2/clients'), ('Projecten', '/api/v2/projects')):
        deel, totaal = lijst_uit(haal(pad, {'page': 0, 'size': 1}))
        print(f'{soort}: {totaal if totaal is not None else "onbekend (eerste pagina " + str(len(deel)) + ")"}')
    print('Verbinding met Robaws in orde.')


def cmd_spec(_):
    spec = haal(SPEC_URL, auth=False)
    UIT.mkdir(parents=True, exist_ok=True)
    (UIT / 'spec.json').write_text(json.dumps(spec), encoding='utf-8')
    paden = spec.get('paths', {})
    for p in sorted(paden):
        if any(w in p for w in ('/clients', '/projects')) and p.count('/') <= 4:
            print(p, ' '.join(sorted(m.upper() for m in paden[p])))
    schemas = spec.get('components', {}).get('schemas', {})
    for naam in sorted(schemas):
        if any(w in naam.lower() for w in ('client', 'project', 'address', 'contact')):
            velden = schemas[naam].get('properties', {})
            print(f'\n{naam}: ' + ', '.join(f'{k}({v.get("type") or v.get("$ref", "").split("/")[-1]})' for k, v in velden.items()))
    print(f'\nVolledige beschrijving: {UIT / "spec.json"}')


def overzicht(ruwe_projecten, klanten, projecten):
    """Tellingen zonder persoonsgegevens, om de vertaling te controleren."""
    from collections import Counter
    statussen = Counter()
    for p in ruwe_projecten:
        if _weg(p):
            continue
        robaws = _tekst((p.get('statusDetails') or {}).get('name')) or _tekst(p.get('status')) or '(leeg)'
        statussen[(robaws, project_status(p) or 'onbekend: Werkplaats houdt eigen status')] += 1
    print('Projectstatussen (Robaws -> Werkplaats):')
    for (rb, wp), n in sorted(statussen.items(), key=lambda x: -x[1]):
        print(f'  {n:5d}  {rb} -> {wp}')
    namen = Counter('planningName' if _tekst(p.get('planningName')) else 'clientReference' if _tekst(p.get('clientReference'))
                    else 'klant + plaats' for p in ruwe_projecten if not _weg(p))
    print('Projectnaam gehaald uit: ' + ', '.join(f'{k} {v}' for k, v in namen.most_common()))
    print(f"Klanten zakelijk: {sum(k.get('type') == 'zakelijk' for k in klanten)}, "
          f"met contactpersonen: {sum(bool(k.get('contacten')) for k in klanten)}, "
          f"met btw-tarief: {sum('btw' in k for k in klanten)}")
    print(f"Nieuwe afgeronde projecten worden niet toegevoegd: {sum(p.get('status') == 'afgerond' for p in projecten)} afgerond.")


def cmd_export(args):
    run = datetime.now(timezone.utc).strftime('%Y%m%d%H%M')
    ruwe_klanten = alles('/api/v2/clients', {'include': ','.join(KLANT_INCLUDE)})
    klanten = [k for k in (map_klant(c) for c in ruwe_klanten) if k]
    klantnamen = {k['robawsId']: k['naam'] for k in klanten}
    ruwe_projecten = alles('/api/v2/projects', {'include': ','.join(PROJECT_INCLUDE)} if PROJECT_INCLUDE else None)
    projecten = [p for p in (map_project(x, klantnamen) for x in ruwe_projecten) if p]
    pak = pakketten('klanten', klanten, run) + pakketten('projecten', projecten, run)
    print(f'Klanten: {len(klanten)}, projecten: {len(projecten)}, pakketten: {len(pak)}')
    if '--droog' in args:
        overzicht(ruwe_projecten, klanten, projecten)
        return
    for pad in schrijf(pak):
        print(pad)


def main(argv):
    cmds = {'check': cmd_check, 'spec': cmd_spec, 'export': cmd_export}
    if not argv or argv[0] not in cmds:
        print(__doc__)
        return 2
    try:
        cmds[argv[0]](argv[1:])
    except RobawsFout as e:
        print('FOUT:', e, file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
