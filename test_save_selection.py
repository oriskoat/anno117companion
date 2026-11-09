import json,os,tempfile,time,unittest
from pathlib import Path
from save_reader.selection import select_matching_profile
from save_reader.service import SaveInsightsService,preview_access,correlate
from save_reader.reader import Catalogue,SCHEMA

def saved(name='Campaign',island='Island'):
 return {'schema':SCHEMA,'participant':41,'profile_name':name,'areas':[{'area_key':'1:5:1','session_guid':3245,'name':island}],'campaign_fingerprint':name}
def pipe(name='Campaign',island='Island'):
 return {'session_name':name,'pipe_state':'connected','fresh_area_count':1,'areas':[{'session_id':1,'island_id':5,'area_index':1,'session_guid':3245,'area_name':island}]}
class SelectionChecks(unittest.TestCase):
 def test_label_shortlists_but_islands_decide(self):
  profiles={'one':{'id':'one','name':'Campaign'},'two':{'id':'two','name':'Campaign'},'other':{'id':'other','name':'Other'}}
  calls=[]
  def read(p):calls.append(p['id']);return saved(island='Island' if p['id']=='two' else 'Wrong')
  result,data=select_matching_profile(pipe(),profiles,read,correlate)
  self.assertEqual(result['profile_id'],'two');self.assertEqual(calls,['one','two']);self.assertEqual(data['source_profile_id'],'two')
 def test_ambiguous_and_unreadable_not_auto_selected(self):
  profiles={str(i):{'id':str(i),'name':'Campaign'} for i in range(2)}
  result,data=select_matching_profile(pipe(),profiles,lambda p:saved(),correlate)
  self.assertEqual(result['status'],'ambiguous');self.assertIsNone(data)
  def partial(p):
   if p['id']=='1':raise ValueError('unreadable')
   return saved()
  self.assertIsNone(select_matching_profile(pipe(),profiles,partial,correlate)[1])
 def test_no_whole_library_scan_or_name_only_match(self):
  profiles={str(i):{'id':str(i),'name':'Campaign'} for i in range(5)}
  self.assertIsNone(select_matching_profile(pipe(),profiles,lambda p:self.fail('unbounded read'),correlate)[1])
  self.assertIsNone(select_matching_profile(pipe(),{'a':{'id':'a','name':'Campaign'}},lambda p:saved(island='Different'),correlate)[1])
 def test_service_automatic_manual_and_stale_pipe(self):
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);accounts=root/'accounts';a=accounts/'account'/'Campaign';b=accounts/'account'/'Other';a.mkdir(parents=True);b.mkdir()
   for folder in (a,b):
    path=folder/'Latest.a8s';path.write_bytes(b'fixture');os.utime(path,(time.time()-10,time.time()-10))
   catalogue=Catalogue({'schema':1,'assets_sha256':'test','texts_sha256':'test','human_profiles':[41],'assets':{},'text_labels':{}})
   calls=[]
   def reader(path,cat,participant,cancelled):
    calls.append(path);data=saved(path.parent.name);data.update(catalogue_fingerprint=cat.fingerprint,file_name=path.name,saved_at='2026-11-08T10:00:00Z');return data
   service=SaveInsightsService(accounts,root/'settings',root/'catalogue.json',preview_access(True),reader=reader);service.catalogue=catalogue;service.profiles=service._scan()
   other=next(g for g,p in service.profiles.items() if p['name']=='Other');service.choose(other)
   service.note_pipe(pipe());service.poll_once();self.assertEqual(service.selected,other)
   service.set_selection_mode('automatic');service.note_pipe({**pipe(),'fresh_area_count':0});service.poll_once();self.assertEqual(service.selected,other)
   service.note_pipe(pipe());service.poll_once();self.assertEqual(service.snapshot['profile_name'],'Campaign');self.assertEqual(service.state()['automatic_match']['status'],'matched')
   count=len(calls);service.poll_once();self.assertEqual(len(calls),count)
   service.choose(other);self.assertEqual(service.state()['selection_mode'],'manual');service.poll_once();self.assertEqual(service.selected,other)
   self.assertEqual(json.loads((root/'settings/save-insights-settings.json').read_text())['selection_mode'],'manual')

if __name__=='__main__':unittest.main()
