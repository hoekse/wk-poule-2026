#!/usr/bin/env python3
"""Robaws -> Werkplaats: haalt klanten en projecten uit Robaws en maakt importpakketten voor de Werkplaats.

Gebruik:
  python3 robaws_sync.py check            test verbinding en sleutel (toont geen klantgegevens)
  python3 robaws_sync.py spec             haalt de API-beschrijving op en toont de velden van klanten en projecten
  python3 robaws_sync.py export [--droog] maakt pakketten in uit/ voor de Werkplaats (--droog: alleen tellen)

Sleutel en geheim komen uit de omgeving: ROBAWS_KEY en ROBAWS_SECRET. Nooit in code, bestanden of chat.
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
SPEC_URL = BASE + '/api-docs/robaws'  # /public/api-docs/robaws is de leespagina, dit is de JSON erachter
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
    """GET op de Robaws-API met wachten bij de limiet van Robaws (HTTP 429)."""
    url = pad if pad.startswith('http') else BASE + pad
    if params:
        url += '?' + urllib.parse.urlencode(params)
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
            if e.code in (401, 403):
                raise RobawsFout(f'Robaws weigert de sleutel (HTTP {e.code}). Controleer of de sleutel als netwerkgeheim (Basic, app.robaws.com) of als ROBAWS_KEY/ROBAWS_SECRET in de omgeving staat, en of de API-gebruiker in Robaws API-toegang heeft.')
            raise RobawsFout(f'Robaws gaf HTTP {e.code} op {pad}')
        except urllib.error.URLError as e:
            raise RobawsFout(f'Robaws niet bereikbaar ({e.reason}). Staat app.robaws.com bij de toegestane domeinen?')
    raise RobawsFout('Robaws bleef te druk (HTTP 429).')


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

KLANT_INCLUDE = 'contacts,vatTariff,legalForm,paymentCondition'
LANDEN = {'NL': 'Nederland', 'BE': 'België', 'DE': 'Duitsland'}
# Robaws-status van een project -> status in de Werkplaats; onbekend telt als lopend
PROJECT_STATUS = {'afgewerkt': 'afgerond', 'afgerond': 'afgerond', 'voorbereiding': 'voorbereiding', 'actief': 'actief'}


def _samen(*delen):
    return ' '.join(str(d).strip() for d in delen if d is not None and str(d).strip())


def _zonder_leeg(r):
    return {k: v for k, v in r.items() if v not in ('', None, [])}


def map_klant(c):
    """ClientReadDTO (met include=KLANT_INCLUDE) -> klant in de Werkplaats."""
    if c.get('deletedAt') or not _samen(c.get('name')):
        return None
    a = c.get('address') or {}
    vorm = (c.get('legalForm') or {}).get('name') or ''
    btw = (c.get('vatTariff') or {}).get('percentage')
    return _zonder_leeg({
        'robawsId': str(c['id']),
        'naam': _samen(c.get('name')),
        'type': 'particulier' if vorm.lower() == 'particulier' else 'zakelijk',
        'status': c.get('status') if c.get('status') in ('klant', 'prospect') else '',
        'straat': _samen(a.get('addressLine1'), a.get('addressLine2')),
        'postcode': a.get('postalCode') or '',
        'plaats': a.get('city') or '',
        'land': LANDEN.get(a.get('country'), a.get('country') or ''),
        'tel': c.get('tel') or '', 'gsm': c.get('gsm') or '',
        'email': c.get('email') or '', 'factuurEmail': c.get('invoiceEmail') or '',
        'btwnr': c.get('vatIdNumber') or '', 'kvk': c.get('kvk') or '', 'website': c.get('website') or '',
        'rechtsvorm': vorm, 'titel': c.get('title') or '',
        'betaalvoorwaarde': (c.get('paymentCondition') or {}).get('name') or '',
        'btw': int(btw) if isinstance(btw, (int, float)) and float(btw).is_integer() else btw,
        # sleutels op alfabet, zoals de Werkplaats ze opslaat, zodat een ongewijzigde lijst ook gelijk telt
        'contacten': [{'email': x.get('email') or '', 'functie': x.get('position') or '',
                       'naam': _samen(x.get('title'), x.get('name'), x.get('surname')), 'tel': x.get('tel') or x.get('gsm') or ''}
                      for x in (c.get('contacts') or []) if not x.get('deletedAt')],
    })


def map_project(p, klantnamen):
    """ProjectReadDTO -> project in de Werkplaats. Naam zoals bij de eerste import: 'klant - planningsnaam' of
    'klant - plaats'. De Werkplaats gebruikt de naam alleen voor nieuwe projecten; een eigen naam blijft staan."""
    if p.get('deletedAt'):
        return None
    a = p.get('siteAddress') or {}
    klant = klantnamen.get(str(p.get('clientId'))) or ''
    naam = ' - '.join(d for d in (klant, _samen(p.get('planningName')) or _samen(a.get('city'))) if d) or p.get('logicId')
    if not naam:
        return None
    return _zonder_leeg({
        'robawsId': str(p['id']),
        'robawsNr': p.get('logicId') or '',
        'naam': naam,
        'klantRobawsId': str(p['clientId']) if p.get('clientId') else '',
        'status': PROJECT_STATUS.get(str(p.get('status') or '').lower(), 'actief'),
        'straat': _samen(a.get('addressLine1'), a.get('addressLine2')),
        'postcode': a.get('postalCode') or '',
        'plaats': a.get('city') or '',
        'info': _samen(p.get('clientReference')),
    })


# Robaws-status van een factuur -> status in de Werkplaats; vervallen berekent de Werkplaats zelf uit de vervaldatum
FACTUUR_STATUS = {'betaald': 'betaald', 'gecrediteerd': 'gecrediteerd', 'opmaak': 'opmaak'}


def _getal(v):
    return int(v) if isinstance(v, (int, float)) and float(v).is_integer() else v


def map_factuur(f, klantnamen, btw_pct):
    """SalesInvoiceReadDTO (met include=lineItems) -> factuur in de Werkplaats, opgebouwd zoals de eerste import.
    Alleen LINE- en TEXT-regels: hoofdstukregels (CHAPTER1) dragen een subtotaal en zouden dubbel tellen.
    Een factuur die de Werkplaats al heeft, krijgt status, openstaand bedrag, datums en bedragen bij (zie de Werkplaats)."""
    if f.get('deletedAt') or not f.get('logicId'):
        return None
    # volgorde zoals Robaws ze geeft: lineNumber is een label ('1.2', '3W'), geen volgnummer
    lijn = [l for l in (f.get('lineItems') or []) if l.get('type') in ('LINE', 'TEXT') and not l.get('deletedAt')]
    bekend = [btw_pct[l['vatTariffId']] for l in lijn if l.get('vatTariffId') in btw_pct]
    standaard = max(set(bekend), key=bekend.count) if bekend else 21
    excl, incl = f.get('totalExclVat') or 0, f.get('totalInclVat') or 0
    status = str(f.get('status') or '').lower()
    return {
        'robawsId': str(f['id']), 'nr': f['logicId'],
        'datum': f.get('date') or '', 'vervaldatum': f.get('expireDate') or '',
        'status': FACTUUR_STATUS.get(status, 'verzonden'), 'robawsStatus': status,
        'openstaand': round(f.get('openTotal') or 0, 2),
        'type': 'credit' if f.get('type') == 'CREDIT_NOTE' else 'factuur',
        'totaalExcl': round(excl, 2), 'totaalIncl': round(incl, 2), 'btwTot': round(incl - excl, 2),
        'klantRobawsId': str(f.get('clientId') or ''), 'klantNaam': klantnamen.get(str(f.get('clientId')), ''),
        'ref': (f.get('clientReference') or '').strip(), 'betaalref': (f.get('paymentInstruction') or '').strip(),
        'regels': [{'aantal': _getal(l.get('quantity') or 0), 'btw': _getal(btw_pct.get(l.get('vatTariffId'), standaard)),
                    'code': '', 'eh': l.get('unitType') or '', 'oms': l.get('description') or '',
                    'prijs': _getal(l.get('price') or 0)} for l in lijn],
    }


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
    deel, totaal = lijst_uit(haal('/api/v2/clients', {'page': 0, 'size': 1}))
    print(f'Verbinding met Robaws in orde. Klanten: {totaal if totaal is not None else "onbekend (eerste pagina " + str(len(deel)) + ")"}.')


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


def cmd_export(args):
    run = datetime.now(timezone.utc).strftime('%Y%m%d%H%M')
    klanten = [k for k in (map_klant(c) for c in alles('/api/v2/clients', {'include': KLANT_INCLUDE})) if k]
    namen = {k['robawsId']: k['naam'] for k in klanten}
    projecten = [p for p in (map_project(x, namen) for x in alles('/api/v2/projects')) if p]
    btw_pct = {t['id']: t.get('percentage') for t in alles('/api/v2/vat-tariffs') if t.get('percentage') is not None}
    facturen = [f for f in (map_factuur(x, namen, btw_pct) for x in alles('/api/v2/sales-invoices', {'include': 'lineItems'})) if f]
    pak = pakketten('klanten', klanten, run) + pakketten('projecten', projecten, run) + pakketten('facturen', facturen, run)
    print(f'Klanten: {len(klanten)}, projecten: {len(projecten)}, facturen: {len(facturen)}, pakketten: {len(pak)}')
    if '--droog' in args:
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
