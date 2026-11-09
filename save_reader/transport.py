"""Owned-route ship observations, not inferred voyage times or pathfinding."""
from .reader import integer
from .production_context import _id, _position


def observe_ship(obj, session, routes):
    meta = integer(obj.at('MetaPersistent/MetaID'), False)
    if meta is None or not any(meta in route['ship_ids'] for route in routes):
        return None
    vehicle = obj.get('PropertyTradeRouteVehicle')
    if vehicle is None:
        return None
    modules = obj.at('ShipModuleOwner/InstalledShipModules')
    return {
        'meta_id': str(meta), 'object_id': _id(obj.get('ID')),
        'guid': integer(obj.get('guid')), 'session_id': session['session_id'],
        'session_guid': session['session_guid'], 'position': _position(obj.get('Position')),
        'route_id': integer(vehicle.get('TradeRouteID')),
        'target_station_id': integer(vehicle.get('TargetStationID')),
        'target_building_id': _id(vehicle.get('TargetBuildingID')),
        'target_loading_harbour_id': _id(vehicle.get('TargetLoadingHarbour')),
        'module_guids': [g for row in (modules.children if modules else [])
                         if (g := integer(row.get('ShipModuleGuid'))) is not None],
    }
