"""Small, read-only production evidence joined to the selected save."""
import struct

def _id(node):
 from .reader import integer
 value=integer(node,False)
 return None if value is None else str(value)

def _position(node):
 if node is None or node.data is None or len(node.data)!=12:return None
 values=list(struct.unpack('<fff',node.data))
 import math
 return values if all(math.isfinite(v) for v in values) else None

def effects(node):
 from .reader import integer,number
 rows=[]
 if node is None:return rows
 for group in node.children:
  if group.name not in ('Effects','TimedEffects','LocalEffects'):continue
  for effect in group.children:
   guid=integer(effect.get('Guid'))
   if not guid:continue
   source=effect.at('Source/ObjectID')
   rows.append({'guid':guid,'id':_id(effect.get('Id')),'source_id':_id(source),
    'participant':integer(effect.get('TargetParticipant')),
    'scale':number(effect.get('ScalingFactor')) if effect.get('ScalingFactor') is not None else 1.,
    'position':_position(effect.get('SourcePosition')),'radius':integer(effect.get('Distance')),
    'end_tick':integer(effect.at('EndTimestamp/value'))})
 return rows

def inventory(info):
 from .reader import SaveReadError
 node=info.at('AreaEconomy/StrgLrg')
 if node is None or node.data is None:return []
 raw=node.data
 if len(raw)%8 or len(raw)>100000:raise SaveReadError('Unsupported current-stock encoding')
 words=struct.unpack('<'+'I'*(len(raw)//4),raw);n=len(words)//2;guid=-1;rows=[]
 for i,delta in enumerate(words[:n]):
  guid=delta if i==0 else guid+delta+1
  if guid>=2**31:raise SaveReadError('Invalid current-stock identifier')
  amount=words[n+i]
  rows.append({'guid':guid,'amount':amount if amount else None,'full_capacity':amount==0})
 return rows

def observe(obj,area):
 from .reader import integer,number
 factory=obj.get('Factory7');warehouse=obj.get('Warehouse')
 if factory is not None:
  modules=[];binary=obj.at('ModuleOwner/BinArray')
  if binary is not None and binary.data is not None and len(binary.data)%16==0:
   modules=[str(struct.unpack_from('<Q',binary.data,i)[0]) for i in range(0,len(binary.data),16)]
  supplied=obj.at('AqueductConsumer/IsSuppliedByDistributor/value/ObjectID')
  area['production_context']['instances'].append({'id':_id(obj.get('ID')),'guid':integer(obj.get('guid')),
   'productivity':number(factory.get('CurrentProductivity')),'in_progress':integer(factory.at('ProductionState/InProgress')),
   'remaining_ms':number(factory.at('ProductionState/RemainingTime')),'module_ids':modules,
   'water_source_id':_id(supplied),'position':_position(obj.get('Position')),'direction':number(obj.get('Direction'))})
 if warehouse is not None:
  area['production_context']['warehouses'].append({'id':_id(obj.get('ID')),'guid':integer(obj.get('guid')),
   'registered_capacity':integer(warehouse.get('StorageCapacityRegistered'))})

def session_context(data,owned,session_guid,cancelled):
 from .reader import select,integer,number
 season=None;session_effects=[];volcano=None
 def wanted(p):
  return p in [('GameSessionManager','SeasonManager'),('GameSessionManager','SessionEffectManager'),('GameSessionManager','VolcanoEruptionManager')] or (len(p)==4 and p[:2]==('GameSessionManager','AreaManagers') and p[-1] in ('AreaReligionManager','AreaEffectManager'))
 for p,n in select(data,wanted,cancelled):
  if p[-1]=='SeasonManager':
   season={'guid':integer(n.at('CurrentSeason/SeasonGUID')),'next_guid':integer(n.at('NextSeason/SeasonGUID')),'start_tick':integer(n.get('SeasonStartTime')),'end_tick':integer(n.get('SeasonEndTime'))}
  elif p[-1]=='SessionEffectManager':session_effects=effects(n)
  elif p[-1]=='VolcanoEruptionManager':
   elapsed=integer(n.get('PhaseTime'));duration=integer(n.get('PhaseEndTime'))
   volcano={'guid':integer(n.get('CurrentPhase')),'active':integer(n.get('SchedulerIsActive')),'paused_by_quest':integer(n.get('IsPausedViaQuests')),'started_tick':integer(n.get('PhaseStartTimestamp')),'elapsed_ms':elapsed,'duration_ms':duration,'remaining_ms':max(0,duration-elapsed) if elapsed is not None and duration is not None else None,'first_run':integer(n.get('IsFirstSchedulerRun'))}
  else:
   aid=int(p[2].removeprefix('AreaManager_'))
   if aid not in owned:continue
   ctx=owned[aid]['production_context']
   if p[-1]=='AreaEffectManager':ctx['effects']=effects(n)
   else:ctx['religion']={'patron_guid':integer(n.get('PatronGuid')),'belief':integer(n.get('Devotion')),'belief_fraction':number(n.get('DevotionFraction'))}
 for area in owned.values():
  if area['session_guid']==session_guid:area['production_context'].update(season=season,session_effects=session_effects,volcano=volcano)
