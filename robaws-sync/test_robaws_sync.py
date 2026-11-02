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


if __name__ == '__main__':
    unittest.main()
