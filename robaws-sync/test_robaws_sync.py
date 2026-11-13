"""Tests voor de onderdelen die niet van Robaws zelf afhangen (verzonnen testgegevens)."""
import json
import tempfile
import unittest
from pathlib import Path

import robaws_sync as rs


class TestPakketten(unittest.TestCase):
    def test_verdeelt_onder_de_grens(self):
        recs = [{'robawsId': str(i), 'naam': 'Klant ' + 'x' * 500} for i in range(100)]
        pak = rs.pakketten('klanten', recs, '202611020500', max_bytes=10_000)
        self.assertGreater(len(pak), 1)
        self.assertEqual(sum(len(p['records']) for p in pak), 100)
        for p in pak:
            self.assertLessEqual(len(json.dumps(p['records']).encode()), 10_000 + 600)
            self.assertEqual(p['delen'], len(pak))
        self.assertEqual(pak[0]['id'], '202611020500-klanten-001')

    def test_leeg_geeft_geen_pakketten(self):
        self.assertEqual(rs.pakketten('projecten', [], 'r'), [])

    def test_schrijf_ruimt_oude_bestanden_op(self):
        with tempfile.TemporaryDirectory() as d:
            map_ = Path(d)
            (map_ / 'robawsimport-oud.json').write_text('{}')
            paden = rs.schrijf(rs.pakketten('klanten', [{'robawsId': '1', 'naam': 'A'}], 'r1'), map_)
            self.assertEqual([p.name for p in paden], ['robawsimport-r1-klanten-001.json'])
            self.assertFalse((map_ / 'robawsimport-oud.json').exists())
            doc = json.loads(paden[0].read_text())
            self.assertEqual(doc['soort'], 'klanten')
            self.assertNotIn('id', doc)


KLANT = {
    'id': '501', 'name': ' Testbedrijf Alfa ', 'status': 'klant', 'title': 'Fam.', 'tel': '0201234567', 'email': 'a@test.invalid',
    'invoiceEmail': '', 'vatIdNumber': 'NL000000000B01', 'kvk': '12345678',
    'address': {'addressLine1': 'Teststraat 1', 'postalCode': '1111 AA', 'city': 'Teststad', 'country': 'NL'},
    'legalForm': {'name': 'BV'}, 'vatTariff': {'percentage': 21.0}, 'paymentCondition': {'name': '30 dagen na datum'},
    'contacts': [{'title': 'Dhr.', 'name': 'Jan', 'surname': 'Test', 'position': 'Inkoop', 'email': 'j@test.invalid', 'tel': '', 'gsm': '0612345678'},
                 {'name': 'Weg', 'deletedAt': '2026-01-01T00:00:00Z'}],
}


class TestVertaling(unittest.TestCase):
    def test_klant(self):
        k = rs.map_klant(KLANT)
        self.assertEqual(k['robawsId'], '501')
        self.assertEqual(k['naam'], 'Testbedrijf Alfa')
        self.assertEqual(k['type'], 'zakelijk')
        self.assertEqual(k['land'], 'Nederland')
        self.assertEqual(k['btw'], 21)
        self.assertEqual(k['rechtsvorm'], 'BV')
        self.assertEqual(k['betaalvoorwaarde'], '30 dagen na datum')
        self.assertNotIn('factuurEmail', k)  # leeg in Robaws: niet meesturen, de Werkplaats laat het staan
        self.assertEqual(k['contacten'], [{'email': 'j@test.invalid', 'functie': 'Inkoop', 'naam': 'Dhr. Jan Test', 'tel': '0612345678'}])
        self.assertEqual(list(k['contacten'][0]), sorted(k['contacten'][0]))

    def test_particulier_en_verwijderd(self):
        self.assertEqual(rs.map_klant(dict(KLANT, legalForm={'name': 'Particulier'}))['type'], 'particulier')
        self.assertIsNone(rs.map_klant(dict(KLANT, deletedAt='2026-01-01T00:00:00Z')))
        self.assertIsNone(rs.map_klant(dict(KLANT, name='  ')))

    def test_project(self):
        namen = {'501': 'Testbedrijf Alfa'}
        p = {'id': '9001', 'logicId': 'P260042', 'clientId': '501', 'status': 'afgewerkt', 'planningName': 'Kantoor',
             'siteAddress': {'addressLine1': 'Werkweg 2', 'postalCode': '2222 BB', 'city': 'Werkstad'}}
        r = rs.map_project(p, namen)
        self.assertEqual(r['naam'], 'Testbedrijf Alfa - Kantoor')
        self.assertEqual(r['status'], 'afgerond')
        self.assertEqual(r['robawsNr'], 'P260042')
        self.assertEqual(r['klantRobawsId'], '501')
        self.assertEqual(rs.map_project(dict(p, planningName='', status='voorbereiding'), namen)['naam'], 'Testbedrijf Alfa - Werkstad')
        self.assertEqual(rs.map_project(dict(p, status='iets nieuws'), namen)['status'], 'actief')
        self.assertEqual(rs.map_project(dict(p, clientId='999', planningName='', siteAddress={}), namen)['naam'], 'P260042')


class TestFactuur(unittest.TestCase):
    FACTUUR = {
        'id': '700', 'logicId': 'F260150', 'date': '2026-11-01', 'expireDate': '2026-12-01', 'status': '1e herinnering',
        'type': 'INVOICE', 'totalExclVat': 200.0, 'totalInclVat': 242.0, 'openTotal': 242.0, 'clientId': '501',
        'clientReference': 'Kozijnen voorgevel ', 'paymentInstruction': '123456789012',
        'lineItems': [
            {'lineNumber': 1, 'type': 'CHAPTER1', 'quantity': 1.0, 'price': 200.0, 'description': 'Buitenschilderwerk'},
            {'lineNumber': 2, 'type': 'LINE', 'quantity': 4.0, 'price': 50.0, 'unitType': 'uur', 'description': 'Schilderen', 'vatTariffId': '1'},
            {'lineNumber': 3, 'type': 'TEXT', 'quantity': 1.0, 'price': 0.0, 'description': 'Inclusief materiaal'},
        ],
    }

    def test_factuur(self):
        f = rs.map_factuur(self.FACTUUR, {'501': 'Testbedrijf Alfa'}, {'1': 21.0, '49': 9.0})
        self.assertEqual(f['status'], 'verzonden')  # herinnering = nog open; vervallen rekent de Werkplaats zelf
        self.assertEqual(f['robawsStatus'], '1e herinnering')
        self.assertEqual(f['btwTot'], 42.0)
        self.assertEqual(f['klantNaam'], 'Testbedrijf Alfa')
        self.assertEqual(f['ref'], 'Kozijnen voorgevel')  # Robaws zet er vaak een spatie achter
        self.assertEqual([r['oms'] for r in f['regels']], ['Schilderen', 'Inclusief materiaal'])  # hoofdstukregel telt niet
        self.assertEqual(sum(r['aantal'] * r['prijs'] for r in f['regels']), f['totaalExcl'])
        self.assertEqual(f['regels'][1]['btw'], 21)  # regel zonder tarief krijgt het tarief van de factuur

    def test_status_en_credit(self):
        f = rs.map_factuur(dict(self.FACTUUR, status='betaald', openTotal=0.0, type='CREDIT_NOTE'), {}, {})
        self.assertEqual((f['status'], f['type'], f['openstaand']), ('betaald', 'credit', 0.0))
        self.assertEqual(rs.map_factuur(dict(self.FACTUUR, status='gecrediteerd'), {}, {})['status'], 'gecrediteerd')
        self.assertIsNone(rs.map_factuur(dict(self.FACTUUR, logicId=''), {}, {}))


class TestLijst(unittest.TestCase):
    def test_vormen(self):
        self.assertEqual(rs.lijst_uit([1, 2]), ([1, 2], None))
        self.assertEqual(rs.lijst_uit({'items': [1], 'totalItems': 5}), ([1], 5))
        self.assertEqual(rs.lijst_uit({'content': [1], 'totalElements': 3}), ([1], 3))
        with self.assertRaises(rs.RobawsFout):
            rs.lijst_uit({'iets': 1})


if __name__ == '__main__':
    unittest.main()
