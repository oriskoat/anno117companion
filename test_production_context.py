import json,struct,tempfile,unittest
from pathlib import Path
from save_reader.reader import Node
from save_reader.production_context import inventory,effects,observe
from trade_routes import TradeRouteStore,validate_planner

def tag(name,*children):return Node(name,children=list(children))
def integer(name,value):return Node(name,value.to_bytes(8,'little'))
class ProductionContextChecks(unittest.TestCase):
 def test_sparse_stock_full_sentinel_and_guid_deltas(self):
  raw=struct.pack('<IIII',2068,2,120,0)
  stocks=inventory(tag('info',tag('AreaEconomy',Node('StrgLrg',raw))))
  self.assertEqual(stocks,[{'guid':2068,'amount':120,'full_capacity':False},{'guid':2071,'amount':None,'full_capacity':True}])
 def test_ids_preserve_64_bit_precision(self):
  source=2**63+9
  data=effects(tag('manager',tag('Effects',tag('item',integer('Guid',54113),integer('Id',source),tag('Source',integer('ObjectID',source))))))
  self.assertEqual(data[0]['id'],str(source));self.assertEqual(data[0]['source_id'],str(source));self.assertEqual(data[0]['scale'],1)
 def test_owner_module_records_are_not_split_into_fake_ids(self):
  area={'production_context':{'instances':[],'warehouses':[]}}
  obj=tag('object',integer('ID',2**63+5),integer('guid',152145),tag('Factory7',Node('CurrentProductivity',struct.pack('<f',1.5))),tag('ModuleOwner',Node('BinArray',struct.pack('<QQQQ',100,7,200,9))))
  observe(obj,area);self.assertEqual(area['production_context']['instances'][0]['module_ids'],['100','200'])
 def test_shared_planner_survives_route_edits_and_restart(self):
  planner={'scenarios':{'live:campaign:151679':{'count':7,'overrides':{'4:34:6':{'stock':257}},'transfers':[{'amount':50,'cycle':15}]}}}
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'plans.json';store=TradeRouteStore(path)
   code,doc=store.put('live:test',0,[],[],planner);self.assertEqual(code,200)
   self.assertEqual(TradeRouteStore(path).get('live:test')['planner'],planner)
   code,doc=store.put('live:test',1,[],[]);self.assertEqual(doc['planner'],planner)
   self.assertEqual(store.put('live:test',0,[],[],{})[0],409)
   self.assertNotIn('planner',store.get('live:other'))
 def test_shared_planner_rejects_nonfinite_and_unbounded_documents(self):
  for value in [{'n':float('nan')},{'n':float('inf')},{'v':'x'*601},{'v':[0]*151},{'n':1e10}]:
   with self.assertRaises(ValueError):validate_planner(value)

if __name__=='__main__':unittest.main()
