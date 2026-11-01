import copy,json,tempfile,threading,unittest,urllib.request,urllib.error
from pathlib import Path
from trade_routes import TradeRouteStore,validate_plan
from bridge import Bridge,CompanionHTTPServer,handler_for

def route():return {'id':'r1','name':'Test ship route','ship':'Aurora','slots':2,'slotCapacity':50,'stops':[{'id':'a','areaKey':'1:1:1','name':'A'},{'id':'b','areaKey':'1:2:1','name':'B'},{'id':'c','areaKey':'1:3:1','name':'C'}],'cargo':[{'id':'x','productGuid':2086,'from':'a','to':'b','amount':40},{'id':'y','productGuid':2174,'from':'b','to':'c','amount':50}]}
class RouteChecks(unittest.TestCase):
 def test_multiple_goods_persistence_and_conflict(self):
  with tempfile.TemporaryDirectory() as directory:
   path=Path(directory)/'routes.json';store=TradeRouteStore(path)
   status,first=store.put('live:test',0,[route()],[]);self.assertEqual(status,200);self.assertEqual(len(first['routes'][0]['cargo']),2)
   self.assertEqual(TradeRouteStore(path).get('live:test'),first)
   self.assertEqual(store.put('live:test',0,[],[])[0],409)
   self.assertEqual(store.get('live:other')['routes'],[])
   self.assertEqual(store.put('live:test',1,[],[])[0],200)
 def test_invalid_cargo_and_corrupt_file_are_not_saved(self):
  for mutation in ['same-stop','negative','nan','bad-id']:
   r=route()
   if mutation=='same-stop':r['cargo'][0]['to']='a'
   elif mutation=='negative':r['cargo'][0]['amount']=-1
   elif mutation=='nan':r['cargo'][0]['amount']=float('nan')
   else:r['stops'][0]['id']="a';attack"
   with self.assertRaises(ValueError):validate_plan([r],[])
  with tempfile.TemporaryDirectory() as directory:
   p=Path(directory)/'routes.json';p.write_text('broken');s=TradeRouteStore(p)
   with self.assertRaises(OSError):s.put('live:test',0,[route()],[])
   self.assertEqual(p.read_text(),'broken')
 def test_authenticated_shared_http_and_stale_writer(self):
  server=CompanionHTTPServer(('127.0.0.1',0),handler_for(Bridge({}),'routes-token'))
  threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/v1/trade-routes?context=live%3Atest'
  def request(body=None,auth=True,origin=None):
   headers={'Content-Type':'application/json'}
   if auth:headers['Authorization']='Bearer routes-token'
   if origin:headers['Origin']=origin
   return urllib.request.urlopen(urllib.request.Request(url,headers=headers,method='PUT' if body else 'GET',data=json.dumps(body).encode() if body else None))
  try:
   with self.assertRaises(urllib.error.HTTPError) as error:request(auth=False)
   self.assertEqual(error.exception.code,401)
   with request() as response:self.assertEqual(json.load(response)['revision'],0)
   body={'revision':0,'routes':[route()],'skipped':[]}
   with request(body) as response:self.assertEqual(json.load(response)['revision'],1)
   with self.assertRaises(urllib.error.HTTPError) as error:request(body)
   self.assertEqual(error.exception.code,409)
   with self.assertRaises(urllib.error.HTTPError) as error:request(body,origin='https://other.example')
   self.assertEqual(error.exception.code,403)
  finally:server.shutdown();server.server_close()
if __name__=='__main__':unittest.main()
