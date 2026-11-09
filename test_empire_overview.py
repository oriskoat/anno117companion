import unittest,struct
from save_reader.reader import Node,Catalogue,inspect_object
from save_reader.overview import empire,storage
from test_save_insights import i,f,tag,CATALOGUE
class EmpireOverviewTests(unittest.TestCase):
 def test_participant_finance_scope_and_zero_unknown(self):
  raw=struct.pack('<II',1010017,123456)
  economies=tag('EconomyManager',tag('Pair',i('ParticipantGUID',42),tag('MetaEconomy',f('Knowledge',999))),tag('Pair',i('ParticipantGUID',41),tag('MetaEconomy',Node('StrgLrg',raw),f('Population',53.5),f('Knowledge',70))))
  money=tag('MetaMoneyManager',tag('MoneyDataPerParticipant',i('_',42),tag('_',f('TotalAmountOfMoneyPerMinuteNew',999)),i('_',41),tag('_',f('TotalMoneyIncomePerMinute',120),f('TotalMoneyOutgoingsPerMinute',150),f('TotalAmountOfMoneyPerMinuteNew',-30))))
  r=empire(economies,money,41);self.assertEqual(r['treasury'],123456);self.assertEqual(r['attributes']['population'],53.5);self.assertEqual(r['attributes']['knowledge'],70);self.assertEqual(r['balance_per_minute'],-30);self.assertIsNone(empire(economies,money,43)['treasury']);self.assertIsNone(storage(Node('StrgLrg',struct.pack('<II',1010017,0)))[1010017])
 def test_explicit_residents_not_house_capacity(self):
  aid=8257;ident=bytearray(8);ident[4:6]=aid.to_bytes(2,'little');houses={};needs={}
  from collections import Counter
  for residents in [17.5,None]:
   children=[] if residents is None else [f('ResidentCount',residents)]
   obj=tag('_',i('guid',3142),Node('ID',bytes(ident)),tag('Residence7',*children))
   inspect_object(obj,aid,Counter(),houses,needs,Catalogue(CATALOGUE))
  row=next(iter(houses.values()));self.assertEqual(row['count'],2);self.assertEqual(row['residents'],17.5);self.assertEqual(row['resident_count_recorded'],1)
 def test_missing_or_nonfinite_fields_remain_unknown(self):
  r=empire(tag('EconomyManager',tag('Pair',i('ParticipantGUID',41),tag('MetaEconomy',f('Knowledge',float('nan'))))),None,41)
  self.assertIsNone(r['attributes']['knowledge']);self.assertIsNone(r['income_per_minute'])
