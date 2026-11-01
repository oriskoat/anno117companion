import tempfile
import unittest
import zipfile
from pathlib import Path
from bridge import Bridge, Pairing, supply_suggestions
from import_content_pack import import_pack

class PublicChecks(unittest.TestCase):
    def test_pairing_code_is_not_an_api_token(self):
        pairing=Pairing();self.assertRegex(pairing.current_code(),r'^\d{6}$')
        self.assertFalse(pairing.authenticate(pairing.current_code()))
        status,result=pairing.exchange('test-device',pairing.current_code())
        self.assertEqual(status,200);self.assertTrue(pairing.authenticate(result['device_token']))

    def test_surplus_is_not_used_twice(self):
        def area(i,delta):
            return {'session_id':1,'island_id':i,'area_index':1,'area_name':'Synthetic',
                    'entries':[{'ProductGuid':1,'ProductDelta':delta}]}
        suggestions=supply_suggestions([area(1,5),area(2,-4),area(3,-4)])
        self.assertEqual(sum(s['suggested_rate'] for s in suggestions),5)

    def test_empty_bridge_does_not_invent_data(self):
        state=Bridge({}).snapshot();self.assertEqual(state['areas'],[])
        self.assertEqual(state['supply_suggestions'],[])

    def test_content_import_rejects_traversal_and_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            for bad in ['../escape.js','bridge-settings/devices.json','desktop_app.py']:
                archive=root/'bad.zip'
                with zipfile.ZipFile(archive,'w') as bundle:bundle.writestr(bad,'bad')
                with self.assertRaises(ValueError):import_pack(archive,root/'dashboard')
                self.assertFalse((root/'dashboard').exists())
            archive=root/'valid.zip'
            with zipfile.ZipFile(archive,'w') as bundle:bundle.writestr('icons/1.webp',b'own-test-data')
            self.assertEqual(import_pack(archive,root/'dashboard'),1)
            self.assertEqual((root/'dashboard/icons/1.webp').read_bytes(),b'own-test-data')

if __name__=='__main__':unittest.main()
