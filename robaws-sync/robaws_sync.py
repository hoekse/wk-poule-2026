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
SPEC_URL = BASE + '/public/api-docs/robaws'
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

def map_klant(c):
    raise RobawsFout('Vertaling klanten nog niet ingevuld: eerst "spec" draaien en de velden van Robaws overnemen.')


def map_project(p):
    raise RobawsFout('Vertaling projecten nog niet ingevuld: eerst "spec" draaien en de velden van Robaws overnemen.')


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
    klanten = [k for k in (map_klant(c) for c in alles('/api/v2/clients')) if k]
    projecten = [p for p in (map_project(x) for x in alles('/api/v2/projects')) if p]
    pak = pakketten('klanten', klanten, run) + pakketten('projecten', projecten, run)
    print(f'Klanten: {len(klanten)}, projecten: {len(projecten)}, pakketten: {len(pak)}')
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
