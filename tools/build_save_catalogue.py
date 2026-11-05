"""Generate a compact local save-reader catalogue from an extracted game config.

This development command never opens or changes saves. No developer paths are
written into its output. Regenerate after game/DLC asset updates.
"""
import argparse
import hashlib
import json
import xml.etree.ElementTree as ET
from pathlib import Path


def build(config):
    asset_path = config / 'export/assets.xml'
    text_path = config / 'gui/texts_english.xml'
    assets = {a.findtext('Values/Standard/GUID'): a
              for a in ET.parse(asset_path).getroot().iter('Asset')
              if a.findtext('Values/Standard/GUID')}
    texts = {t.findtext('LineId'): t.findtext('Text') or ''
             for t in ET.parse(text_path).getroot().findall('Texts/Text')}

    def value(guid, field, seen=None):
        seen = set() if seen is None else seen
        if guid not in assets or guid in seen:
            return None
        seen.add(guid)
        asset = assets[guid]
        found = asset.findtext(field)
        if found:
            return found
        base = asset.findtext('BaseAssetGUID') or asset.findtext('Values/Standard/BaseAssetGUID')
        return value(base, field, seen)

    entries = {}
    humans = []
    for guid, asset in assets.items():
        internal = value(guid, 'Values/Standard/Name') or guid
        name = texts.get(value(guid, 'Values/Text/OasisId')) or internal
        entry = {'name': name, 'template': value(guid, 'Template')}
        item_kind = value(guid, 'Values/Item/ItemType')
        if not item_kind and entry['template'] in ('Item', 'ItemWithBoost', 'Specialist'):
            item_kind = 'Specialist'
        if item_kind in ('Specialist', 'Captains'):
            entry['item_kind'] = item_kind
        tier = value(guid, 'Values/Residence7/PopulationLevel')
        if tier and tier.isdecimal():
            entry['tier_guid'] = int(tier)
        entries[guid] = entry
        if internal.startswith('Profile_Human_'):
            humans.append(int(guid))
    # CityNameGuid is a signed 64-bit text ID, not a 32-bit asset GUID. Keep
    # short plain labels only; dialogue and formatted rich text are unnecessary.
    short_texts = {k: v for k, v in texts.items()
                   if 0 < len(v) <= 80 and not any(c in v for c in '<>\n\r{}')}
    return {'schema': 1, 'assets_sha256': hashlib.sha256(asset_path.read_bytes()).hexdigest(),
            'texts_sha256': hashlib.sha256(text_path.read_bytes()).hexdigest(),
            'language': 'en', 'assets': entries, 'text_labels': short_texts,
            'human_profiles': humans}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config', type=Path)
    parser.add_argument('--output', type=Path, default=Path('save_catalogue.json'))
    args = parser.parse_args()
    payload = build(args.config)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf8')
    print('Save catalogue:', len(payload['assets']), 'assets;', len(payload['human_profiles']), 'human profiles')
