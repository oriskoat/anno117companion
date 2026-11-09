"""Small, participant-scoped empire facts, separate from production rate history."""
import struct
from .reader import number, integer, pairs, SaveReadError

def storage(node):
    if node is None or node.data is None:return {}
    raw=node.data
    if len(raw)%8 or len(raw)>100000:raise SaveReadError('Unsupported meta-storage encoding')
    words=struct.unpack('<'+'I'*(len(raw)//4),raw);n=len(words)//2;guid=-1;result={}
    for i,delta in enumerate(words[:n]):
        guid=delta if i==0 else guid+delta+1
        if guid>=2**31:raise SaveReadError('Invalid meta-storage identifier')
        result[guid]=words[n+i] if words[n+i] else None
    return result

def empire(economies,money,participant):
    economy=next((p.get('MetaEconomy') for p in economies.items('Pair') if integer(p.get('ParticipantGUID'))==participant),None) if economies else None
    finance=next((r for pid,r in pairs(money.get('MoneyDataPerParticipant') if money else None) if pid==participant),None)
    attributes={name.lower():number(economy.get(name)) for name in ('Population','Knowledge','Belief','Prestige','Happiness','Health','FireSafety')} if economy else {}
    return {'participant':participant,'treasury':storage(economy.get('StrgLrg') if economy else None).get(1010017),
            'income_per_minute':number(finance.get('TotalMoneyIncomePerMinute') if finance else None),
            'expenses_per_minute':number(finance.get('TotalMoneyOutgoingsPerMinute') if finance else None),
            'balance_per_minute':number(finance.get('TotalAmountOfMoneyPerMinuteNew') if finance else None),
            'resources':[{'guid':guid,'amount':amount} for guid,amount in storage(economy.get('StrgLrg') if economy else None).items() if guid!=1010017],'attributes':attributes,'source':'selected participant economy and money managers'}
