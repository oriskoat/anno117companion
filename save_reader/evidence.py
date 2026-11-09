"""Rate-source arbitration, independent from saved inventory/building evidence."""
from datetime import datetime
import math

def tick(value):
    return value if isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value) and value>=0 else None

def retain_pipe(area,saved,meta,pipe_state):
    if not area:return False,'saved_only'
    if pipe_state=='connected' and not area.get('cached',True) and not area.get('stale',True):return True,'fresh_pipe'
    pt,st=tick(area.get('game_timestamp')),tick(saved.get('statistics_tick'))
    if pt is not None and st is not None and area.get('game_clock_domain')=='simulation_ms' and saved.get('statistics_clock_domain')=='simulation_ms':
        return pt>=st,'compared_game_statistics_ticks'
    try:
        if datetime.fromisoformat(area['received_at'])>=datetime.fromisoformat(meta['saved_at']):return True,'pipe_received_after_save'
    except (KeyError,TypeError,ValueError):pass
    # File mtime alone does not prove its saved rate-history sample is newer.
    return True,'cached_pipe_retained_unknown_history_chronology'
