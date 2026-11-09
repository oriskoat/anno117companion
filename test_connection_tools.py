import tempfile,unittest,json,threading,urllib.request,urllib.error
from pathlib import Path
from unittest.mock import patch
from connection_tools import has_pipe,parse_vdf,steam_diagnostics,DiscoveryServer,discover,save_connection_summary
from bridge import Bridge,CompanionHTTPServer,handler_for

class ConnectionToolsChecks(unittest.TestCase):
 def test_save_switch_does_not_claim_a_readable_or_matching_save(self):
  class Fake:
   def state(self,pipe):return {'enabled':True,'use_saves':True,'status':'select_profile','profiles':[],'snapshot':None,'join':{'matched':False}}
  s=save_connection_summary(Fake(),{'areas':[]})
  self.assertTrue(s['use_saves']);self.assertFalse(s['snapshot_ready']);self.assertEqual(s['pipe_comparison'],'not_available')
  class Ready:
   def state(self,pipe):return {'enabled':True,'use_saves':True,'status':'ready','snapshot':{'profile_name':'Example','file_name':'Example.a8s','areas':[{}],'owned_items':['private detail']},'join':{'matched':False}}
  s=save_connection_summary(Ready(),{'areas':[{}]});self.assertTrue(s['snapshot_ready']);self.assertEqual(s['pipe_comparison'],'not_matched');self.assertNotIn('owned_items',s)
  class Matched:
   def state(self,pipe):return {'enabled':True,'use_saves':True,'status':'ready','snapshot':{'areas':[{}]},'join':{'matched':True}}
  self.assertEqual(save_connection_summary(Matched(),{'areas':[{'cached':True}],'pipe_state':'waiting_for_game'})['pipe_comparison'],'matched_cached')
  self.assertEqual(save_connection_summary(Matched(),{'areas':[{'cached':False,'stale':False}],'pipe_state':'connected'})['pipe_comparison'],'matched')
 def test_pipe_is_an_argument_not_a_substring(self):
  for x in ['/pipe','"game.exe" /pipe','"/pipe"','/PIPE -other']:self.assertTrue(has_pipe(x))
  for x in ['/pipeline','foo/pipe','/pipefoo','C:/pipe.exe','']:self.assertFalse(has_pipe(x))
 def test_steam_profile_specific_launch_options(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);(root/'steamapps').mkdir();(root/'steamapps/appmanifest_123.acf').write_text('"AppState" { "appid" "123" "name" "Anno 117 - Pax Romana" }')
   user=root/'userdata/1/config';user.mkdir(parents=True)
   file=user/'localconfig.vdf';file.write_text('"UserLocalConfigStore" { "Software" { "Valve" { "Steam" { "apps" { "123" { "LaunchOptions" "/pipe" } } } } } }')
   self.assertEqual(steam_diagnostics([root])[0]['state'],'configured')
   file.write_text(file.read_text().replace('/pipe','/pipeline'));self.assertEqual(steam_diagnostics([root])[0]['state'],'missing')
   self.assertEqual(parse_vdf('"Root" {"key" "a\\\\b"}')['root']['key'],'a\\b')
 def test_discovery_never_returns_pairing_secrets(self):
  server=DiscoveryServer(12345,'127.0.0.1',discovery_port=0)
  self.assertTrue(server.start())
  try:
   rows=discover(.5,['127.0.0.1'],port=server.socket.getsockname()[1]);self.assertEqual(rows[0]['address'],'http://127.0.0.1:12345');self.assertTrue(rows[0]['requires_pairing']);self.assertNotIn('token',json.dumps(rows))
  finally:server.stop()
 def test_diagnostics_and_network_inventory_are_authenticated(self):
  server=CompanionHTTPServer(('127.0.0.1',0),handler_for(Bridge({}),'tools-test'))
  threading.Thread(target=server.serve_forever,daemon=True).start()
  try:
   url=f'http://127.0.0.1:{server.server_port}/v1/setup'
   with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(url)
   self.assertEqual(e.exception.code,401)
   with patch('connection_tools.launch_diagnostics',return_value={'runtime':'active','launchers':[],'read_only':True}):
    request=urllib.request.Request(url,headers={'Authorization':'Bearer tools-test'})
    with urllib.request.urlopen(request) as reply:self.assertEqual(json.load(reply)['runtime'],'active')
  finally:server.shutdown();server.server_close()

if __name__=='__main__':unittest.main()
