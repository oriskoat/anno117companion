import json
import threading
import unittest
import urllib.request
import urllib.error
from pathlib import Path
from bridge import Bridge, CompanionHTTPServer, handler_for
from empire_report import build_empire_pdf


class ReportChecks(unittest.TestCase):
    def test_report_in_every_ui_language_and_cached_data(self):
        root=Path(__file__).parent/'android-probe/app/src/main/assets/dashboard'
        snapshot=json.loads((root/'demo.json').read_text(encoding='utf-8'))
        locales=json.JSONDecoder().raw_decode((root/'ui-locales.js').read_text(encoding='utf-8').split('=',1)[1])[0]
        snapshot['data_mode']='cached'
        for language,labels in locales.items():
            translated={key:labels.get(key.lower(),key) for key in ['Empire Summary','Island briefing','Priority local gaps','Supply suggestions']}
            pdf=build_empire_pdf({'snapshot':snapshot,'labels':translated,'language':language})
            self.assertTrue(pdf.startswith(b'%PDF-'))
            self.assertTrue(pdf.rstrip().endswith(b'%%EOF'))
        with self.assertRaises(ValueError):build_empire_pdf({'snapshot':{'areas':[{}]*1001}})

    def test_http_report_requires_live_pairing_but_allows_demo(self):
        server=CompanionHTTPServer(('127.0.0.1',0),handler_for(Bridge({}),'report-secret'))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        url=f'http://127.0.0.1:{server.server_port}/v1/report'
        try:
            def request(body,headers=None):
                return urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(body).encode(),headers={'Content-Type':'application/json',**(headers or {})}))
            with self.assertRaises(urllib.error.HTTPError) as failure:request({'isDemo':False,'snapshot':{}})
            self.assertEqual(failure.exception.code,401)
            with self.assertRaises(urllib.error.HTTPError) as failure:request({'isDemo':True},{'Origin':'http://other-host'})
            self.assertEqual(failure.exception.code,403)
            for body,headers in [({'isDemo':True},{}),({'isDemo':False,'snapshot':{'areas':[]}}, {'Authorization':'Bearer report-secret'})]:
                with request(body,headers) as response:
                    self.assertEqual(response.headers['Content-Type'],'application/pdf')
                    self.assertEqual(response.headers['Cache-Control'],'no-store')
                    self.assertTrue(response.read().startswith(b'%PDF-'))
        finally:
            server.shutdown();server.server_close()


if __name__=='__main__':unittest.main()
