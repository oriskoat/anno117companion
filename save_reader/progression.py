"""Explicit player permits, research records and unlock overrides."""
from .reader import integer,number,pairs

def read(unlocks,meta_objects,participant,catalogue):
    locks=[];completed=[];queue=[];progress=[]
    for pid,record in pairs(unlocks.at('UnlockData/Data') if unlocks else None):
        if pid!=participant:continue
        for guid,state in pairs(record.get('LockState')):
            raw=integer(state.at('value/value/value'))
            if raw is not None:locks.append({'guid':guid,'raw':raw,'state':'unlocked' if raw==0 else 'locked' if raw==1 else 'unknown'})
    for obj in meta_objects:
        if integer(obj.get('ParticipantGUID'))!=participant:continue
        tech=obj.get('MetaTechHandler')
        if tech is None:continue
        for tag,target in [('TechCompleted',completed),('ResearchQueue',queue)]:
            n=tech.get(tag)
            target.extend(g for item in (n.children if n else []) if (g:=integer(item)) is not None and g>0)
        n=tech.get('TechProgress');children=n.children if n else []
        for i in range(0,len(children)-1,2):
            guid,value=integer(children[i]),number(children[i+1])
            if guid is not None and value is not None:progress.append({'guid':guid,'value':value})
    return {'locks':locks,'completed_techs':sorted(set(completed)),'research_queue':queue,'tech_progress':progress,'source':'selected participant unlock and MetaTechHandler records'}
