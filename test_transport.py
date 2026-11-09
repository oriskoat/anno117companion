import struct,unittest
from save_reader.reader import Node
from save_reader.transport import observe_ship

def tag(name,*children):return Node(name,children=list(children))
def num(name,value):return Node(name,value.to_bytes(8,'little'))

class TransportChecks(unittest.TestCase):
 def ship(self):
  return tag('object',num('ID',2**63+7),num('guid',37223),Node('Position',struct.pack('<fff',10,0,20)),tag('MetaPersistent',num('MetaID',35)),tag('PropertyTradeRouteVehicle',num('TradeRouteID',42),num('TargetStationID',3),num('TargetLoadingHarbour',2**63+19)),tag('ShipModuleOwner',tag('InstalledShipModules',tag('_',num('ShipModuleGuid',31648)))))
 def test_owned_route_reference_and_precision(self):
  ship=observe_ship(self.ship(),{'session_id':1,'session_guid':3245},[{'ship_ids':[35]}])
  self.assertEqual(ship['meta_id'],'35');self.assertEqual(ship['object_id'],str(2**63+7))
  self.assertEqual(ship['target_loading_harbour_id'],str(2**63+19));self.assertEqual(ship['position'],[10,0,20])
  self.assertEqual(ship['module_guids'],[31648]);self.assertEqual(ship['route_id'],42)
  self.assertNotIn('speed',ship);self.assertNotIn('round_trip_minutes',ship)
 def test_unassigned_and_non_vehicle_not_reported(self):
  self.assertIsNone(observe_ship(self.ship(),{},[{'ship_ids':[36]}]))
  self.assertIsNone(observe_ship(tag('object',tag('MetaPersistent',num('MetaID',35))),{},[{'ship_ids':[35]}]))
 def test_missing_position_stays_unknown(self):
  obj=self.ship();obj.children=[c for c in obj.children if c.name!='Position']
  self.assertIsNone(observe_ship(obj,{'session_id':1,'session_guid':3245},[{'ship_ids':[35]}])['position'])

if __name__=='__main__':unittest.main()
