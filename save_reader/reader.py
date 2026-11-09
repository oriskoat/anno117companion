"""Read-only, domain-targeted Anno 117 RDA/FileDB save reader.

No XML materialization, game writes, network access or optional dependencies.
Unknown/omitted saturation and loading values deliberately remain unknown.
"""
import hashlib
import json
import math
import struct
import time
import zlib
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from .vendor.parser.rda import RDAArchive
from .vendor.parser.filedb.version import detect_version, FileDBVersion
from .vendor.parser.filedb.dictionary import parse_tag_section
from .vendor.parser.filedb.dom import iter_dom, EventKind

SCHEMA = 8
MAX_SAVE_BYTES = 256 * 1024 * 1024
MAX_INNER_BYTES = 768 * 1024 * 1024
MAX_EVENTS = 40_000_000


class SaveReadError(ValueError):
    pass


class SaveChanged(SaveReadError):
    pass


class ReadCancelled(SaveReadError):
    pass


class ParticipantRequired(SaveReadError):
    def __init__(self, candidates):
        super().__init__('Choose a human participant for this multiplayer save.')
        self.candidates = candidates


def timestamp(value=None):
    return datetime.fromtimestamp(time.time() if value is None else value, timezone.utc).isoformat()


def inflate(data):
    decoder = zlib.decompressobj()
    result = decoder.decompress(data, MAX_INNER_BYTES + 1)
    if len(result) > MAX_INNER_BYTES or decoder.unconsumed_tail or not decoder.eof:
        raise SaveReadError('Save data exceeds the supported size or is incomplete.')
    if decoder.unused_data:
        # Anno's inner stream appends an empty zlib member and a little-endian
        # decompressed-length footer. Validate it rather than silently dropping
        # arbitrary trailing bytes as zlib.decompress() would do.
        trailer = decoder.unused_data
        if (len(trailer) != 12 or zlib.decompress(trailer[:8]) != b''
                or int.from_bytes(trailer[8:], 'little') != len(result)):
            raise SaveReadError('Unexpected data after a compressed save block.')
    return result


@dataclass(slots=True)
class Node:
    name: str
    data: bytes | None = None
    children: list = field(default_factory=list)

    def get(self, name):
        return next((c for c in self.children if c.name == name), None)

    def at(self, path):
        node = self
        for name in path.split('/'):
            node = node.get(name) if node else None
        return node

    def items(self, name=None):
        return [c for c in self.children if name is None or c.name == name]


def integer(node, signed=True):
    if node is None or node.data is None or len(node.data) not in (1, 2, 4, 8):
        return None
    return int.from_bytes(node.data, 'little', signed=signed)


def number(node):
    if node is None or node.data is None or len(node.data) != 4:
        return None
    value = struct.unpack('<f', node.data)[0]
    return value if math.isfinite(value) else None


def text(node):
    if node is None or not node.data:
        return ''
    if len(node.data) > 2048 or len(node.data) % 2:
        return ''
    try:
        return node.data.decode('utf-16-le').rstrip('\0')
    except UnicodeError:
        return ''


def pairs(node, signed=True):
    children = node.children if node else []
    for i in range(0, len(children) - 1, 2):
        key = integer(children[i], signed=signed)
        if key is not None and children[i + 1].data is None:
            yield key, children[i + 1]


def numeric_map(node):
    children = node.children if node else []
    result = {}
    for i in range(0, len(children) - 1, 2):
        guid, value = integer(children[i]), number(children[i + 1])
        if guid is not None and value is not None and value >= 0:
            result[guid] = value
    return result


def statistics_history(node):
    result = {}
    for aid, history in pairs(node, signed=False):
        snapshots = history.get('Snapshots')
        records = snapshots.children if snapshots else []
        if not records:
            continue
        last = max(records, key=lambda n: integer(n.get('CreationTime')) or -1)
        production = numeric_map(last.get('GenerationPerProduct'))
        consumption = numeric_map(last.get('ConsumptionPerProduct'))
        result[aid] = {'statistics_tick': integer(last.get('CreationTime')),
                       'entries': [{'ProductGuid': guid, 'ProductGeneration': production[guid],
                                    'ProductConsumption': consumption[guid],
                                    'ProductDelta': production[guid] - consumption[guid]}
                                   for guid in sorted(production.keys() & consumption.keys())]}
    return result


def select(data, predicate, cancelled=lambda: False, omit=()):
    """Stream only requested subtrees; all other events allocate no tree nodes.

    Returns (path, Node). Attribute-level predicates can select just GameTotal,
    etc. Large nested FileDB bytes remain binary; never hex/XML-encode them.
    """
    version = detect_version(data)
    if version is not FileDBVersion.V3:
        raise SaveReadError('This FileDB save version is not supported yet.')
    section = parse_tag_section(data, version)
    path, stack = [], []
    capture_path = None
    omitted = 0
    for count, event in enumerate(iter_dom(data, version, tag_section=section)):
        if count > MAX_EVENTS:
            raise SaveReadError('Save contains too many records for this reader.')
        if count % 4096 == 0 and cancelled():
            raise ReadCancelled('Save reading cancelled.')
        if event.kind is EventKind.TERMINATOR:
            if stack:
                if omitted:
                    omitted -= 1
                else:
                    node = stack.pop()
                    if not stack:
                        yield capture_path, node
                        capture_path = None
            if path:
                path.pop()
            continue
        name = event.name or '_'
        here = tuple(path + [name])
        if event.kind is EventKind.TAG:
            path.append(name)
            if stack:
                if omitted or name in omit:
                    omitted += 1
                else:
                    node = Node(name)
                    stack[-1].children.append(node)
                    stack.append(node)
            elif predicate(here):
                stack.append(Node(name))
                capture_path = here
        elif stack and not omitted:
            if name not in omit:
                stack[-1].children.append(Node(name, event.content))
        elif not stack and predicate(here):
            yield here, Node(name, event.content)


class Catalogue:
    def __init__(self, payload):
        if payload.get('schema') != 1:
            raise SaveReadError('Unsupported save catalogue.')
        self.assets = payload.get('assets', {})
        self.texts = payload.get('text_labels', {})
        self.humans = set(payload.get('human_profiles', []))
        self.fingerprint = payload.get('assets_sha256', '') + ':' + payload.get('texts_sha256', '')

    @classmethod
    def read(cls, path):
        return cls(json.loads(Path(path).read_text(encoding='utf8')))

    def asset(self, guid):
        return self.assets.get(str(guid), {})

    def name(self, guid):
        return self.asset(guid).get('name') or f'GUID {guid}'

    def city(self, node, aid):
        custom = text(node.get('CityName'))
        return custom or self.texts.get(str(integer(node.get('CityNameGuid')))) or f'Island {aid >> 6 & 127}'


def area_key(aid):
    return f'{aid & 63}:{aid >> 6 & 127}:{aid >> 13 & 7}'


def extract_area(info, aid, session, catalogue):
    inventory = []
    for guid, record in pairs(info.at('AreaEconomy/StorageTrends')):
        points = record.get('Points')
        samples = [integer(x) for x in points.items('_')] if points else []
        if len(samples) > 2048 or any(x is None for x in samples):
            raise SaveReadError('Unsupported inventory sample encoding.')
        inventory.append({'product_guid': guid, 'name': catalogue.name(guid),
                          'samples': samples, 'latest_sample': samples[-1] if samples else None,
                          'last_point_tick': integer(record.get('LastPointTime'))})
    return {'area_id': aid, 'area_key': area_key(aid), 'session_id': session['session_id'],
            'session_guid': session['session_guid'], 'region': catalogue.name(session['session_guid']),
            'name': catalogue.city(info, aid), 'owner': integer(info.get('OwnerProfile')),
            'fertilities': [{'guid': integer(c), 'name': catalogue.name(integer(c))}
                            for c in (info.get('Fertility').children if info.get('Fertility') else [])
                            if integer(c) is not None],
            'inventory': inventory, 'production_context': {'instances': [], 'warehouses': [], 'effects': [], 'religion': None, 'current_stocks': __import__(__package__+'.production_context', fromlist=['inventory']).inventory(info)}, 'housing': [], 'residence_count': 0,
            'need_states': [], 'buildings': []}


def inspect_object(node, aid, buildings, housing, needs, catalogue):
    guid = integer(node.get('guid'))
    if guid is None:
        guid = integer(node.get('GUID'))
    identifier = node.get('ID')
    if guid is None or identifier is None or not identifier.data or len(identifier.data) != 8:
        return
    # An explicit AreaManager container and object ID must agree.
    if int.from_bytes(identifier.data[4:6], 'little') != aid:
        return
    if catalogue.asset(guid).get('template') not in ('Product', None):
        buildings[guid] += 1
    residence = node.get('Residence7')
    if residence is None:
        return
    tier = catalogue.asset(guid).get('tier_guid')
    h = housing.setdefault((guid, tier), {'building_guid': guid, 'name': catalogue.name(guid),
                                       'tier_guid': tier, 'tier_name': catalogue.name(tier) if tier else 'Unknown tier',
                                       'count': 0})
    h['count'] += 1
    residents = number(residence.get('ResidentCount'))
    if residents is not None and 0 <= residents <= 100000:
        h['residents'] = h.get('residents', 0) + residents
        h['resident_count_recorded'] = h.get('resident_count_recorded', 0) + 1
    for product, state in pairs(residence.get('ConsumptionStates')):
        key = (tier, product)
        need = needs.setdefault(key, {'tier_guid': tier, 'tier_name': h['tier_name'],
                                     'product_guid': product, 'name': catalogue.name(product),
                                     'tracked_houses': 0, 'explicit_full': 0,
                                     'explicit_partial': 0, 'explicit_zero': 0, 'omitted': 0})
        need['tracked_houses'] += 1
        saturation = number(state.get('CurrentSaturation'))
        if saturation is None or not 0 <= saturation <= 1.001:
            need['omitted'] += 1
        elif saturation >= .999:
            need['explicit_full'] += 1
        elif saturation == 0:
            need['explicit_zero'] += 1
        else:
            need['explicit_partial'] += 1


def extract_routes(route_map, owner, all_areas, catalogue):
    result = []
    for rid, record in pairs(route_map):
        if integer(record.get('Owner')) != owner:
            continue
        ships = record.get('Ships')
        data = ships.data if ships and ships.data else b''
        if len(data) % 8:
            raise SaveReadError('Unsupported route ship-reference encoding.')
        stops = []
        for station in record.get('Stations').items() if record.get('Stations') else []:
            aid = integer(station.get('AreaID'), False)
            goods = []
            for item in station.get('GoodInfos').items() if station.get('GoodInfos') else []:
                guid = integer(item.get('ProductGUID'))
                if guid is None:
                    continue
                loading = integer(item.get('IsLoading'), False)
                goods.append({'product_guid': guid, 'name': catalogue.name(guid),
                              'amount': integer(item.get('Amount')), 'slot_index': integer(item.get('Index')),
                              'action': 'unload' if loading == 0 else 'load' if loading == 1 else 'unspecified',
                              'loading_value_omitted': loading is None})
            stops.append({'station_id': integer(station.get('StationID')), 'area_id': aid, 'area_key': area_key(aid) if aid is not None else None,
                          'name': all_areas.get(aid, {}).get('name') or f'Area {aid}',
                          'owner': integer(station.get('AreaOwner')), 'goods': goods})
        result.append({'id': rid, 'name': text(record.get('Name')) or f'Route {rid}',
                       'ship_ids': [int.from_bytes(data[i:i + 8], 'little') for i in range(0, len(data), 8)],
                       'stops': stops})
    return result


def saved_items(container, catalogue, source, location=None, equipped=False):
    """Read concrete item instances, never a quest or catalogue reference."""
    if container is None:
        return []
    items = []
    paths = ('SocketContainer/SocketItems',) if equipped else ('SlotList', 'SlotContainer/SlotList')
    for path in paths:
        slots = container.at(path)
        if slots is None:
            continue
        for slot in slots.children:
            stack = slot.at('Stack/value/Stack')
            refs = [slot.get('ItemReference')] if equipped else stack.children if stack else []
            for ref in refs:
                if ref is None:
                    continue
                guid = integer(ref.get('GUID'))
                iid = ref.get('ID')
                if not guid or iid is None or not iid.data or len(iid.data) != 8 or not any(iid.data):
                    continue
                kind = catalogue.asset(guid).get('item_kind')
                if kind not in ('Specialist', 'Captains'):
                    continue
                items.append((iid.data, {'instance_id': iid.data.hex(), 'guid': guid, 'name': catalogue.name(guid), 'kind': kind,
                                         'state': 'assigned' if equipped else 'stored',
                                         'source': source, 'area_key': location}))
    return items


def read_save(path, catalogue, participant=None, cancelled=lambda: False):
    path = Path(path)
    before = path.stat()
    if not 0 < before.st_size <= MAX_SAVE_BYTES:
        raise SaveReadError('Save file size is not supported.')
    start = time.monotonic()
    with RDAArchive(path) as archive:
        if len(archive.entries) > 16 or any(e.uncompressed_size > MAX_SAVE_BYTES for e in archive.entries):
            raise SaveReadError('Unexpected save archive layout.')
        header = inflate(archive.read('header.a7s'))
        outer = inflate(archive.read('data.a7s'))
    after = path.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise SaveChanged('The game was still writing this save. It will be retried.')
    profile = next((n for _, n in select(header, lambda p: p == ('CorporationProfile',), cancelled)), None)
    if profile is None:
        raise SaveReadError('Save profile metadata is missing.')
    from .production_context import effects as production_effects
    global_production_effects, production_unlocks = [], None
    empire_economies, empire_money = None, None
    sessions, route_map, clock, history, participants_with_items = [], None, {}, {}, []
    def outer_wanted(p):
        return (p[:2] == ('MetaGameManager', 'GameSessions') and len(p) == 3
                or p[:3] == ('MetaGameManager', 'MetaGameObjectManager', 'MetaObjectMap') and len(p) == 4
                or p in [('MetaGameManager','MetaEffectManager'), ('MetaGameManager','ParticipantUnlockManager'), ('MetaGameManager','EconomyManager'), ('MetaGameManager','MetaMoneyManager')]
                or p == ('MetaGameManager', 'SessionTradeRouteManager', 'RouteMap')
                or p == ('MetaGameManager', 'EconomyStatisticManager', 'History', 'areaHistory')
                or p in [('MetaGameManager', 'GameTotal'), ('MetaGameManager', 'GameCount')])
    for where, node in select(outer, outer_wanted, cancelled):
        if where[:3] == ('MetaGameManager', 'MetaGameObjectManager', 'MetaObjectMap'):
            if node.get('MetaItemTransfer') is not None or node.get('MetaTechHandler') is not None:
                participants_with_items.append(node)
        elif where[-1] == 'EconomyManager':
            empire_economies = node
        elif where[-1] == 'MetaMoneyManager':
            empire_money = node
        elif where[-1] == 'MetaEffectManager':
            global_production_effects = production_effects(node)
        elif where[-1] == 'ParticipantUnlockManager':
            production_unlocks = node
        elif where[-1] == 'RouteMap':
            route_map = node
        elif where[-1] == 'areaHistory':
            history = statistics_history(node)
        elif where[-1] in ('GameTotal', 'GameCount'):
            clock[where[-1]] = integer(node)
        else:
            desc, blob = node.get('SessionDesc'), node.at('SessionData/BinaryData')
            if desc and blob and blob.data:
                sessions.append({'session_id': integer(desc.get('SessionID'), False),
                                 'session_guid': integer(desc.get('SessionGUID')), 'data': blob.data})
    from .production_context import observe, session_context
    del outer, header
    if not sessions or any(s['session_id'] is None or s['session_guid'] is None for s in sessions):
        raise SaveReadError('Save sessions could not be identified.')
    all_areas, captures = {}, []
    for session in sessions:
        areas = next((n for _, n in select(session['data'], lambda p: p == ('GameSessionManager', 'AreaInfo'), cancelled)), None)
        if areas is None:
            raise SaveReadError('Save island metadata is missing.')
        records = list(pairs(areas, signed=False))
        captures.append((session, records))
        for aid, info in records:
            all_areas[aid] = {'name': catalogue.city(info, aid), 'owner': integer(info.get('OwnerProfile'))}
    humans = sorted({a['owner'] for a in all_areas.values() if a['owner'] in catalogue.humans})
    if participant is None:
        if len(humans) != 1:
            raise ParticipantRequired(humans)
        participant = humans[0]
    if participant not in humans:
        raise SaveReadError('The selected human participant has no identified islands.')
    flood_gate = None
    for pid, record in pairs(production_unlocks.at('UnlockData/Data') if production_unlocks else None):
        if pid != participant: continue
        for guid, lock in pairs(record.get('LockState')):
            if guid == 157020:
                flood_gate = integer(lock.at('value/value/value'))
    owned = {}
    items = {}
    routes = extract_routes(route_map, participant, all_areas, catalogue)
    ship_observations = []
    from .transport import observe_ship
    for node in participants_with_items:
        if integer(node.get('ParticipantGUID')) == participant:
            for iid, row in saved_items(node.at('MetaItemTransfer/GlobalItemContainer'), catalogue, 'global'):
                items[iid] = row
    for session, records in captures:
        for aid, info in records:
            if integer(info.get('OwnerProfile')) == participant:
                owned[aid] = extract_area(info, aid, session, catalogue)
                owned[aid].update(history.get(aid, {'statistics_tick': None, 'entries': []}))
                for entry in owned[aid]['entries']:
                    entry['ProductNameEnglish'] = catalogue.name(entry['ProductGuid'])
        # Only object records in owned area containers become temporary nodes.
        def wanted(p):
            if len(p) != 7 or p[:2] != ('GameSessionManager', 'AreaManagers'):
                return False
            if p[3:] != ('AreaObjectManager', 'GameObject', 'objects', '_'):
                return False
            try:
                return int(p[2].removeprefix('AreaManager_')) in owned or p[2] == 'AreaManager_' + str(session['session_id'])
            except ValueError:
                return False
        counters, housing, needs = defaultdict(Counter), defaultdict(dict), defaultdict(dict)
        omit = ('Mesh', 'FeedbackController', 'Health', 'Building', 'LogisticNode', 'AttributeProvider',
                'Infolayer', 'IncidentInfectable', 'Maintenance', 'Buffable')
        for where, obj in select(session['data'], wanted, cancelled, omit):
            aid = int(where[2].removeprefix('AreaManager_'))
            owner = integer(obj.get('OwnerProfile'))
            identifier = obj.get('ID')
            ship = observe_ship(obj, session, routes)
            if ship is not None:
                ship_observations.append(ship)
            verified_area = identifier is not None and identifier.data is not None and len(identifier.data) == 8 and int.from_bytes(identifier.data[4:6], 'little') == aid
            if verified_area and (owner == participant or owner is None and aid in owned and catalogue.asset(integer(obj.get('guid'))).get('template') in ('VillaUrban','VillaRural','HippodromeBuilding','GuestHouse')):
                for equipped in (False, True):
                    for iid, row in saved_items(obj.get('ItemContainer'), catalogue,
                                                'island' if aid in owned else 'ship',
                                                owned.get(aid, {}).get('area_key'), equipped):
                        if iid not in items or row['state'] == 'assigned':
                            items[iid] = row
            if aid in owned:
                observe(obj, owned[aid])
                inspect_object(obj, aid, counters[aid], housing[aid], needs[aid], catalogue)
        session_context(session['data'], owned, session['session_guid'], cancelled)
        for aid in [k for k, v in owned.items() if v['session_id'] == session['session_id']]:
            owned[aid]['housing'] = list(housing[aid].values())
            owned[aid]['residence_count'] = sum(x['count'] for x in housing[aid].values())
            owned[aid]['need_states'] = list(needs[aid].values())
            owned[aid]['buildings'] = [{'guid': g, 'name': catalogue.name(g), 'count': count}
                                       for g, count in counters[aid].items()]
    ident = (profile.get('ID').data if profile.get('ID') else b'') + (profile.get('CreationTimeStamp').data if profile.get('CreationTimeStamp') else b'')
    from .overview import empire as empire_overview
    from .progression import read as progression_read
    snapshot = {'progression': progression_read(production_unlocks, participants_with_items, participant, catalogue), 'empire': empire_overview(empire_economies, empire_money, participant), 'schema': SCHEMA, 'catalogue_fingerprint': catalogue.fingerprint,
                'campaign_fingerprint': hashlib.sha256(ident + str(participant).encode()).hexdigest(),
                'profile_display_name': text(profile.get('SavegameProfileDisplayName')),
                'participant': participant, 'game_seed': integer(profile.get('GameSeed')),
                'need_consumption_setting_raw': integer(profile.at('SetupNeedConsumption/value/id')),
                'production_context': {'global_effects': [e for e in global_production_effects if e['participant'] in (None, participant)], 'flood_gate_state': flood_gate},
                'simulator_clock': clock, 'file_name': path.name, 'saved_at': timestamp(before.st_mtime),
                'parsed_at': timestamp(), 'areas': list(owned.values()), 'routes': routes, 'owned_items': list(items.values()),
                'transport': {'observed_game_ms': clock.get('GameTotal'), 'ships': ship_observations,
                              'timing_status': 'unmeasured', 'path_status': 'not_reconstructed'},
                'metrics': {'parse_seconds': round(time.monotonic() - start, 3), 'save_bytes': before.st_size,
                            'session_count': len(sessions)},
                'limitations': ['Inventory is the latest saved statistics sample, not live warehouse stock.',
                                'Configured routes do not prove delivered throughput.',
                                'Omitted saturation and loading values are not treated as confirmed defaults.',
                                'Population sums use explicit saved ResidentCount fields; missing residence values remain unknown. Service-radius coverage is not inferred.']}
    json.dumps(snapshot, allow_nan=False)
    return snapshot
