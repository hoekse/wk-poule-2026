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


class TestLijst(unittest.TestCase):
    def test_vormen(self):
        self.assertEqual(rs.lijst_uit([1, 2]), ([1, 2], None))
        self.assertEqual(rs.lijst_uit({'items': [1], 'totalItems': 5}), ([1], 5))
        self.assertEqual(rs.lijst_uit({'content': [1], 'totalElements': 3}), ([1], 3))
        with self.assertRaises(rs.RobawsFout):
            rs.lijst_uit({'iets': 1})


class TestVertaling(unittest.TestCase):
    """Velden volgens ClientReadDTO/ProjectReadDTO uit de API-beschrijving van Robaws; waarden verzonnen."""

    def test_klant_zakelijk_met_alles(self):
        c = {'id': '101', 'name': ' Testbedrijf BV ', 'title': 'Fam.', 'vatIdNumber': 'NL000000000B01', 'kvk': '12345678',
             'tel': '0500-000000', 'gsm': '', 'email': 'info@test.invalid', 'invoiceEmail': 'factuur@test.invalid',
             'address': {'addressLine1': 'Teststraat 1', 'addressLine2': 'unit 2', 'postalCode': '9999 ZZ', 'city': 'Testdorp', 'country': 'NL'},
             'legalForm': {'name': 'Besloten vennootschap'}, 'paymentCondition': {'name': '30 dagen'},
             'vatTariff': {'percentage': 21.0},
             'contacts': [{'title': 'Dhr.', 'name': 'Jan', 'surname': 'Test', 'position': 'Inkoop', 'email': 'jan@test.invalid', 'gsm': '0600000000'},
                          {'name': 'Oud', 'deletedAt': '2025-01-01T00:00:00Z'}]}
        k = rs.map_klant(c)
        self.assertEqual(k['robawsId'], '101')
        self.assertEqual(k['naam'], 'Testbedrijf BV')
        self.assertEqual(k['type'], 'zakelijk')
        self.assertEqual(k['straat'], 'Teststraat 1, unit 2')
        self.assertEqual((k['postcode'], k['plaats'], k['land']), ('9999 ZZ', 'Testdorp', 'Nederland'))
        self.assertEqual(k['factuurEmail'], 'factuur@test.invalid')
        self.assertEqual((k['rechtsvorm'], k['betaalvoorwaarde'], k['btw']), ('Besloten vennootschap', '30 dagen', 21))
        self.assertEqual(k['contacten'], [{'naam': 'Dhr. Jan Test', 'functie': 'Inkoop', 'email': 'jan@test.invalid', 'tel': '0600000000'}])
        self.assertNotIn('gsm', k)  # leeg in Robaws: niet meesturen, dan blijft de Werkplaats-waarde staan

    def test_klant_particulier_laat_type_en_lege_velden_weg(self):
        k = rs.map_klant({'id': 7, 'name': 'Fam. Test', 'address': None, 'vatTariff': {'percentage': 6}})
        self.assertEqual(k, {'robawsId': '7', 'naam': 'Fam. Test'})

    def test_klant_overslaan(self):
        self.assertIsNone(rs.map_klant({'id': '1', 'name': ''}))
        self.assertIsNone(rs.map_klant({'id': '1', 'name': 'Weg', 'deletedAt': '2025-01-01T00:00:00Z'}))
        self.assertIsNone(rs.map_klant({'name': 'Zonder id'}))

    def test_project(self):
        p = {'id': '55', 'logicId': 'P2026-001', 'clientId': '101', 'planningName': 'Schilderwerk gevels',
             'siteAddress': {'addressLine1': 'Werfweg 3', 'postalCode': '9999 AA', 'city': 'Testdorp'},
             'statusDetails': {'name': 'In uitvoering'}}
        self.assertEqual(rs.map_project(p, {'101': 'Testbedrijf BV'}), {'robawsId': '55', 'robawsNr': 'P2026-001', 'naam': 'Testbedrijf BV - Schilderwerk gevels',
                                             'klantRobawsId': '101', 'status': 'actief', 'straat': 'Werfweg 3',
                                             'postcode': '9999 AA', 'plaats': 'Testdorp'})

    def test_projectnaam_terugval(self):
        p = {'id': '56', 'clientId': '101', 'logicId': 'P2', 'siteAddress': {'city': 'Testdorp'}}
        self.assertEqual(rs.map_project(p, {'101': 'Testbedrijf BV'})['naam'], 'Testbedrijf BV - Testdorp')
        self.assertEqual(rs.map_project({'id': '57', 'logicId': 'P3'})['naam'], 'P3')
        self.assertEqual(rs.map_project({'id': '58', 'clientReference': 'Ref 9', 'logicId': 'P4'})['naam'], 'Ref 9')
        self.assertEqual(rs.map_project({'id': '59', 'clientId': '101', 'planningName': 'Woning.'}, {'101': 'Test'})['naam'], 'Test - Woning')
        self.assertEqual(rs.map_project({'id': '60', 'clientId': '101', 'planningName': 'Test - Kampen'}, {'101': 'Test'})['naam'], 'Test - Kampen')

    def test_projectstatus(self):
        st = lambda **kw: rs.project_status(kw)
        self.assertEqual(st(status='Afgewerkt'), 'afgerond')
        self.assertEqual(st(statusDetails={'name': 'Offerte verstuurd'}), 'voorbereiding')
        self.assertEqual(st(status='Lopend'), 'actief')
        self.assertEqual(st(status='Lopend', archivedAt='2025-01-01T00:00:00Z'), 'afgerond')
        self.assertIsNone(st(status='XYZ'))
        self.assertNotIn('status', rs.map_project({'id': '1', 'logicId': 'P1', 'status': 'XYZ'}))


if __name__ == '__main__':
    unittest.main()
