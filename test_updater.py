import hashlib
import io
import json
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch
from updater import Updater, select_release, apply_update, version_parts, RELEASES
from version import APP_VERSION


def release(body=b'MZverified-exe'):
    return {'tag_name':'v99.0.0','draft':False,'prerelease':False,'assets':[{'name':'Anno117Companion.exe','size':len(body),'digest':'sha256:'+hashlib.sha256(body).hexdigest(),'browser_download_url':RELEASES+'/download/v99.0.0/Anno117Companion.exe'}]}


class UpdateChecks(unittest.TestCase):
    def test_versions_and_pinned_checked_assets(self):
        self.assertGreater(version_parts('0.13.0'),version_parts('0.9.9'))
        self.assertEqual(select_release(release())['status'],'available')
        self.assertEqual(select_release(release(),'99.0.0')['status'],'current')
        for kind in ['wrong-host','no-checksum','oversize']:
            data=release();asset=data['assets'][0]
            if kind=='wrong-host':asset['browser_download_url']='https://evil.example/Anno117Companion.exe'
            if kind=='no-checksum':asset.pop('digest')
            if kind=='oversize':asset['size']=300000000
            self.assertEqual(select_release(data)['status'],'incomplete')
        data=release();data['prerelease']=True
        with self.assertRaises(ValueError):select_release(data)

    def test_checked_download_and_checksum_mismatch(self):
        class Response(io.BytesIO):url='https://release-assets.githubusercontent.com/test'
        with tempfile.TemporaryDirectory() as directory:
            updater=Updater(directory)
            with patch('updater.fetch_release',return_value=release()),patch('updater.urllib.request.urlopen',return_value=Response(b'MZverified-exe')):
                self.assertEqual(updater.download()['status'],'ready')
                self.assertEqual(updater.downloaded[0].read_bytes(),b'MZverified-exe')
            with patch('updater.fetch_release',return_value=release()),patch('updater.urllib.request.urlopen',return_value=Response(b'MZtampered')):
                self.assertEqual(updater.download()['status'],'failed')
                self.assertIsNone(updater.downloaded)
                self.assertFalse(list(updater.folder.glob('*.part')))

    def test_missing_release_offline_and_cached_check(self):
        with tempfile.TemporaryDirectory() as directory:
            updater=Updater(directory)
            with patch('updater.fetch_release',side_effect=urllib.error.HTTPError('test',404,'missing',{},None)) as fetch:
                self.assertEqual(updater.check(True)['status'],'unpublished')
                self.assertEqual(updater.check()['status'],'unpublished')
                self.assertEqual(fetch.call_count,1)
            with patch('updater.fetch_release',side_effect=OSError('offline')):
                self.assertEqual(updater.check(True)['status'],'offline')

    def test_atomic_replacement_rollback_and_pairing_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);folder=root/'bridge-settings/updates';folder.mkdir(parents=True)
            (root/'bridge-settings/pairing.json').write_text('private-pairing')
            source=folder/'new.exe';source.write_bytes(b'MZnew');target=root/'Anno117Companion.exe';target.write_bytes(b'MZold')
            config=folder/'apply.json';config.write_text(json.dumps({'source':str(source),'target':str(target),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pids':[]}))
            with patch('updater.sys.executable',str(source)),patch('updater.ctypes.WinDLL'),patch('updater.subprocess.Popen'):
                apply_update(config)
            self.assertEqual(target.read_bytes(),b'MZnew')
            self.assertEqual(target.with_suffix('.previous.exe').read_bytes(),b'MZold')
            self.assertEqual((root/'bridge-settings/pairing.json').read_text(),'private-pairing')
            self.assertEqual(json.loads((folder/'result.json').read_text())['status'],'updated')
            source.write_bytes(b'MZnewer')
            data=json.loads(config.read_text());data['sha256']=hashlib.sha256(source.read_bytes()).hexdigest();config.write_text(json.dumps(data))
            with patch('updater.sys.executable',str(source)),patch('updater.ctypes.WinDLL'),patch('updater.subprocess.Popen',side_effect=[OSError('launch failed'),None]):
                apply_update(config)
            self.assertEqual(target.read_bytes(),b'MZnew')
            self.assertEqual(json.loads((folder/'result.json').read_text())['status'],'failed')


if __name__=='__main__':unittest.main()
