"""Background local-save snapshots with an explicit entitlement boundary.

The development preview is opt-in at process start, never enabled by a LAN
request. A future license authority can replace the injected access callback.
"""
import copy
import hashlib
import json
import os
import struct
import threading
import time
import zlib
from pathlib import Path

from .reader import Catalogue, ParticipantRequired, ReadCancelled, SaveReadError, read_save, timestamp, SCHEMA
from .vendor.parser.rda.exceptions import RDAParseError
from .vendor.parser.filedb.exceptions import FileDBParseError


def preview_access(enabled=False):
    return lambda: {'active': bool(enabled), 'source': 'development_preview' if enabled else 'unavailable',
                    'feature': 'save_insights', 'billing_available': False}


def default_accounts():
    """Respect Windows' redirected Documents folder (including OneDrive)."""
    documents = Path.home() / 'Documents'
    if os.name == 'nt':
        try:
            import ctypes
            buffer = ctypes.create_unicode_buffer(32768)
            if ctypes.windll.shell32.SHGetFolderPathW(None, 5, None, 0, buffer) == 0 and buffer.value:
                documents = Path(buffer.value)
        except (OSError, AttributeError):
            pass
    return documents / 'Anno 117 - Pax Romana' / 'accounts'

def _atomic(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(',', ':')), encoding='utf8')
    temp.replace(path)


class SaveInsightsService:
    def __init__(self, accounts, settings, catalogue_path, access=None, interval=600, reader=read_save):
        self.accounts = Path(accounts).resolve()
        self.settings = Path(settings)
        from .voyages import VoyageHistory
        self.voyages = VoyageHistory(self.settings/'voyage-observations.json')
        self.catalogue_path = Path(catalogue_path)
        self.access = access or preview_access(False)
        self.interval = max(10, interval)
        self.reader = reader
        self.lock = threading.RLock()
        self.poll_guard = threading.Lock()
        self.wake = threading.Event()
        self.cancel = threading.Event()
        self.thread = None
        self.generation = 0
        self.catalogue = None
        self.profiles = {}
        self.selected = None
        self.participant = None
        self.selected_file = None
        self.use_saves = False
        self.selection_mode = 'automatic'
        self.pipe_evidence = None
        self.pipe_generation = 0
        self.match_status = {'status': 'waiting_for_pipe', 'reason': 'Fresh pipe statistics are required.'}
        self.selection_cache = {}
        self.snapshot = None
        self.file_identity = None
        self.candidates = []
        self.status = 'disabled'
        self.error = ''
        self.checked_at = None
        self.read_count = 0
        self.unchanged_count = 0

    def allowed(self):
        try:
            value = self.access()
            return bool(value.get('active') and value.get('feature') == 'save_insights')
        except Exception:
            return False

    def _scan(self):
        result = {}
        if not self.accounts.is_dir():
            return result
        # Expected accounts/<account>/<campaign>/*.a8s. Fixed root and fixed
        # depth avoid exposing arbitrary filesystem access to paired clients.
        for account in self.accounts.iterdir():
            if not account.is_dir() or account.is_symlink():
                continue
            for campaign in account.iterdir():
                if not campaign.is_dir() or campaign.is_symlink():
                    continue
                saves = []
                for path in campaign.glob('*.a8s'):
                    try:
                        if path.name.lower() == 'accountdata.a8s' or path.is_symlink():
                            continue
                        resolved = path.resolve()
                        if not resolved.is_relative_to(self.accounts) or not resolved.is_file():
                            continue
                        stat = resolved.stat()
                        if stat.st_size:
                            saves.append((stat.st_mtime_ns, path.name, resolved, stat.st_size))
                    except OSError:
                        continue
                if not saves:
                    continue
                saves.sort(reverse=True)
                relative = str(campaign.relative_to(self.accounts))
                identifier = hashlib.sha256(relative.encode('utf8')).hexdigest()[:24]
                account_label = hashlib.sha256(account.name.encode()).hexdigest()[:6]
                result[identifier] = {'id': identifier, 'name': campaign.name, 'account_label': account_label, 'count': len(saves),
                                      'latest_name': saves[0][1], 'latest_at': timestamp(saves[0][0] / 1e9),
                                      'saves': [{'name': name, 'saved_at': timestamp(modified/1e9), 'bytes': size}
                                                for modified, name, _, size in saves[:200]],
                                      '_saves': saves}
        return result

    def _restore(self):
        try:
            config = json.loads((self.settings / 'save-insights-settings.json').read_text(encoding='utf8'))
            self.use_saves = config.get('use_saves') is True
            if config.get('profile_id') in self.profiles:
                self.selected = config['profile_id']
                self.participant = config.get('participant')
                self.selected_file = config.get('file_name')
                self.selection_mode = config.get('selection_mode', 'manual' if self.selected_file else 'automatic')
                if self.selection_mode not in ('automatic','manual'):self.selection_mode='manual'
        except (OSError, ValueError, TypeError):
            pass
        if self.selected is None and len(self.profiles) == 1:
            self.selected = next(iter(self.profiles))
            try:
                self._persist_settings()
            except OSError:
                pass
        cache = self.settings / 'save-insights-cache.json'
        try:
            if cache.stat().st_size > 12_000_000:
                return
            data = json.loads(cache.read_text(encoding='utf8'))
            snapshot = data['snapshot']
            if (data.get('schema') == 1 and data.get('profile_id') == self.selected
                    and snapshot.get('catalogue_fingerprint') == self.catalogue.fingerprint
                    and snapshot.get('schema') == SCHEMA and isinstance(snapshot.get('areas'), list)):
                self.snapshot = snapshot
                self.file_identity = data.get('file_identity')
        except (OSError, ValueError, TypeError, KeyError):
            pass

    def start(self):
        if not self.allowed():
            return
        with self.lock:
            if self.thread and self.thread.is_alive():
                return
            self.cancel.clear()
            self.error = ''
            try:
                self.catalogue = Catalogue.read(self.catalogue_path)
                self.profiles = self._scan()
                self._restore()
                self.status = 'waiting' if self.selected else 'select_profile' if self.profiles else 'no_saves'
            except (OSError, ValueError, TypeError):
                self.status, self.error = 'error', 'The local save catalogue could not be loaded.'
                return
            self.thread = threading.Thread(target=self._run, name='anno-save-insights', daemon=True)
            self.thread.start()

    def stop(self):
        self.cancel.set()
        self.wake.set()
        if self.thread and self.thread is not threading.current_thread():
            self.thread.join(timeout=3)

    def _persist_settings(self):
        _atomic(self.settings / 'save-insights-settings.json', {'profile_id': self.selected,
                'participant': self.participant, 'file_name': self.selected_file, 'use_saves': self.use_saves, 'selection_mode': self.selection_mode})

    def set_use_saves(self, enabled):
        if not self.allowed():
            raise PermissionError('Save Insights is not enabled.')
        if type(enabled) is not bool:
            raise ValueError('Use save data must be ON or OFF.')
        with self.lock:
            self.use_saves = enabled
            self._persist_settings()
        if enabled:
            self.wake.set()

    def choose(self, identifier, participant=None, file_name=None):
        if not self.allowed():
            raise PermissionError('Save Insights is not enabled.')
        if self.catalogue is None:
            raise ValueError('The local save catalogue is unavailable.')
        if participant is not None and (type(participant) is not int or participant not in self.catalogue.humans):
            raise ValueError('Invalid human participant.')
        with self.lock:
            profiles = self._scan()
            if identifier not in profiles:
                raise ValueError('Choose one of the discovered save profiles.')
            if file_name is not None and (not isinstance(file_name, str) or not any(s[1] == file_name for s in profiles[identifier]['_saves'])):
                raise ValueError('Choose a discovered save file.')
            if identifier != self.selected or participant != self.participant or file_name != self.selected_file or self.selection_mode != 'manual':
                self.generation += 1
                self.snapshot = None
                self.file_identity = None
                self.candidates = []
            self.profiles = profiles
            self.selected, self.participant = identifier, participant
            self.selected_file = file_name
            self.selection_mode = 'manual'
            self.status, self.error = 'waiting', ''
            self._persist_settings()
        self.wake.set()

    def set_selection_mode(self, mode):
        if not self.allowed():raise PermissionError('Save Insights is not enabled.')
        if mode not in ('automatic','manual'):raise ValueError('Invalid selection mode.')
        with self.lock:
            self.selection_mode=mode
            self.generation+=1
            if mode=='automatic':self.selected_file=None
            self._persist_settings()
        self.wake.set()

    def note_pipe(self, pipe):
        areas=[a for a in pipe.get('areas',[]) if not a.get('cached') and not a.get('stale')]
        fresh=pipe.get('pipe_state')=='connected' and pipe.get('fresh_area_count',0)>0 and areas
        evidence={'session_name':pipe.get('session_name'),'areas':[{k:a.get(k) for k in ('session_id','island_id','area_index','session_guid','area_name')} for a in areas]} if fresh else None
        with self.lock:
            if evidence==self.pipe_evidence:return
            self.pipe_evidence=evidence;self.pipe_generation+=1
            if not evidence:self.match_status={'status':'waiting_for_pipe','reason':'Fresh pipe statistics are required; the current selection is retained.'}
            if self.selection_mode=='automatic' and evidence:self.wake.set()

    def refresh(self):
        if not self.allowed():
            raise PermissionError('Save Insights is not enabled.')
        self.wake.set()

    def _run(self):
        while not self.cancel.is_set():
            # Clear before work so a refresh requested during a read is retained.
            self.wake.clear()
            self.poll_once()
            self.wake.wait(3 if self.status == 'waiting' else self.interval)

    def poll_once(self):
        if not self.poll_guard.acquire(blocking=False):
            return
        try:
            self._poll_once()
        finally:
            self.poll_guard.release()

    def _poll_once(self):
        if not self.allowed() or self.cancel.is_set():
            return
        with self.lock:
            generation = self.generation
            selected, participant, selected_file = self.selected, self.participant, self.selected_file
            if self.catalogue is None:
                self.catalogue = Catalogue.read(self.catalogue_path)
            catalogue = self.catalogue
            pipe_generation = self.pipe_generation
            evidence = copy.deepcopy(self.pipe_evidence) if self.selection_mode == 'automatic' else None
        try:
            profiles = self._scan()
            parsed_hint = None
            if evidence:
                from .selection import select_matching_profile
                def read_candidate(profile):
                    modified, name, path, size = profile['_saves'][0]
                    if time.time_ns()-modified < 1_000_000_000:raise SaveReadError('Save is still being written.')
                    identity=(profile['id'],name,modified,size,catalogue.fingerprint)
                    if identity not in self.selection_cache:
                        self.selection_cache[identity]=self.reader(path,catalogue,None,lambda: self.cancel.is_set() or generation!=self.generation or pipe_generation!=self.pipe_generation)
                        if len(self.selection_cache)>4:self.selection_cache.pop(next(iter(self.selection_cache)))
                    return copy.deepcopy(self.selection_cache[identity])
                match, parsed_hint = select_matching_profile(evidence,profiles,read_candidate,correlate)
                with self.lock:
                    if generation!=self.generation or pipe_generation!=self.pipe_generation or self.selection_mode!='automatic':return
                    self.match_status=match
                    if parsed_hint:
                        selected=match['profile_id'];participant=parsed_hint['participant'];selected_file=None
                        self.selected,self.participant,self.selected_file=selected,participant,None
                        self._persist_settings()
            with self.lock:
                if generation != self.generation:
                    return
                self.profiles = profiles
                self.checked_at = timestamp()
                if not selected:
                    self.status = 'select_profile' if profiles else 'no_saves'
                    return
                profile = profiles.get(selected)
                if not profile:
                    self.status, self.error = 'no_saves', 'No save was found for the selected profile. Previous data is retained.'
                    return
                candidates = [s for s in profile['_saves'] if selected_file is None or s[1] == selected_file]
                if not candidates:
                    self.status, self.error = 'error', 'The selected save is no longer available. Choose another save.'
                    return
                modified, name, path, size = candidates[0]
                identity = [selected, name, modified, size, participant, catalogue.fingerprint]
                if self.snapshot and identity == self.file_identity:
                    self.status, self.error = 'ready', ''
                    self.unchanged_count += 1
                    return
                # Very recent writes are retried rather than parsing half a file.
                if time.time_ns() - modified < 1_000_000_000:
                    self.status, self.error = 'waiting', 'Waiting for the game to finish writing the save.'
                    return
                self.status, self.error = 'reading', ''
            def cancelled():
                return self.cancel.is_set() or generation != self.generation or (evidence is not None and pipe_generation != self.pipe_generation) or not self.allowed()
            parsed = parsed_hint if parsed_hint is not None else self.reader(path, catalogue, participant, cancelled)
            after = path.stat()
            if (modified, size) != (after.st_mtime_ns, after.st_size):
                raise SaveReadError('The save changed while reading. Previous data is retained; retry on the next check.')
            parsed.setdefault('transport',{})['cycle_observations']=self.voyages.observe(parsed)
            parsed['profile_name'] = profile['name']
            parsed['source_profile_id'] = selected
            with self.lock:
                if cancelled():
                    return
                # Advance the snapshot only after the whole parse succeeds.
                self.snapshot = parsed
                self.file_identity = identity
                self.status, self.error = 'ready', ''
                self.candidates = []
                self.read_count += 1
                try:
                    _atomic(self.settings / 'save-insights-cache.json', {'schema': 1, 'profile_id': selected,
                            'file_identity': identity, 'snapshot': parsed})
                except OSError:
                    self.error = 'Data is available, but its local cache could not be saved.'
        except ReadCancelled:
            return
        except ParticipantRequired as error:
            with self.lock:
                if generation == self.generation:
                    self.candidates = error.candidates
                    self.status, self.error = 'select_participant', str(error)
        except (OSError, ValueError, TypeError, KeyError, EOFError, IndexError,
                struct.error, zlib.error, RDAParseError, FileDBParseError) as error:
            with self.lock:
                if generation == self.generation:
                    self.status = 'error'
                    self.error = str(error) if isinstance(error, SaveReadError) else 'This save could not be read. Previous data is retained.'

    def state(self, pipe_snapshot=None):
        active = self.allowed()
        with self.lock:
            result = {'enabled': active, 'access': self.access() if active else {'active': False},
                      'status': self.status if active else 'disabled', 'interval_seconds': self.interval,
                      'billing_available': False, 'checked_at': self.checked_at if active else None,
                      'selected_profile_id': self.selected if active else None,
                      'selected_file': self.selected_file if active else None,
                      'selection_mode': self.selection_mode, 'automatic_match': copy.deepcopy(self.match_status),
                      'use_saves': bool(active and self.use_saves),
                      'participant_candidates': list(self.candidates) if active else [],
                      'profiles': [{k: v for k, v in p.items() if not k.startswith('_')}
                                   for p in self.profiles.values()] if active else [],
                      'error': self.error if active else '', 'snapshot': copy.deepcopy(self.snapshot) if active else None,
                      'diagnostics': {'read_count': self.read_count, 'unchanged_checks': self.unchanged_count} if active else {}}
        result['join'] = correlate(result['snapshot'], pipe_snapshot)
        return result

    def dashboard(self, pipe):
        self.note_pipe(pipe)
        with self.lock:
            if not self.allowed() or not self.use_saves or not self.snapshot:
                return pipe
            saved = self.snapshot
            join = correlate(saved, pipe)
            pipe_index = {f"{a['session_id']}:{a['island_id']}:{a['area_index']}": a for a in pipe.get('areas', [])} if join['matched'] else {}
            areas = []
            for area in saved['areas']:
                original = pipe_index.get(area['area_key'])
                from .evidence import retain_pipe
                keep, reason = retain_pipe(original, area, saved, pipe.get('pipe_state'))
                if keep:
                    retained = copy.deepcopy(original)
                    retained['data_source'] = 'pipe'
                    retained['provenance'] = {'kind':'rate','source':'pipe','decision':reason,'received_at':original.get('received_at'),'game_tick':original.get('game_timestamp')}
                    areas.append(retained)
                    continue
                entries = []
                for item in area.get('entries', []):
                    entry = copy.deepcopy(item)
                    entry.update(data_source='save', statistics_tick=area.get('statistics_tick'),
                                 BuildingGUIDtoAmount={}, WorkforceGUIDtoAmount={}, BuildingsNamed=[], WorkforcesNamed=[])
                    entries.append(entry)
                aid = area['area_id']
                areas.append({'session_id': area['session_id'], 'session_guid': area['session_guid'],
                    'island_id': aid >> 6 & 127, 'area_index': aid >> 13 & 7, 'area_name': area['name'],
                    'entries': entries, 'received_at': saved['saved_at'], 'cached': True, 'stale': True,
                    'data_source': 'save', 'provenance':{'kind':'rate','source':'save','game_tick':area.get('statistics_tick'),'file_at':saved['saved_at'],'decision':reason}, 'statistics_tick': area.get('statistics_tick'),
                    'saved_residence_count': area['residence_count']})
            represented = {f"{a['session_id']}:{a['island_id']}:{a['area_index']}" for a in areas}
            areas.extend(copy.deepcopy(a) for key, a in pipe_index.items() if key not in represented)
            from bridge import supply_suggestions
            result = copy.deepcopy(pipe)
            fresh = sum(not a.get('cached', True) and not a.get('stale', True) for a in areas)
            transfers = supply_suggestions(areas)
            index = {f"{a['session_id']}:{a['island_id']}:{a['area_index']}": a for a in areas}
            for transfer in transfers:
                transfer['cached'] = bool(index[transfer['from_area_key']].get('cached') or index[transfer['to_area_key']].get('cached'))
            result.update(areas=areas, session_name=saved['profile_name'], supply_suggestions=transfers,
                fresh_area_count=fresh, cached_area_count=len(areas)-fresh,
                last_data_at=max((a['received_at'] for a in areas), default=saved['saved_at']),
                data_mode='save', save_source={'enabled': True, 'saved_at': saved['saved_at'],
                    'file_name': saved['file_name'], 'profile_name': saved['profile_name'],
                    'campaign_fingerprint': saved['campaign_fingerprint'],
                    'conflicting_pipe': bool(pipe.get('areas') and not join['matched']),
                    'saved_areas': sum(a.get('data_source')=='save' for a in areas)},
                supply_note='Recorded production/consumption from saved statistics history; it may predate the save. Configured shipping does not prove actual throughput.')
            return result

def correlate(saved, pipe):
    """Conservative join: campaign label AND matching IDs/names/regions.

    Other campaigns with the same default island IDs must not receive overlays.
    """
    if not saved or not pipe or not pipe.get('areas'):
        return {'matched': False, 'reason': 'No pipe snapshot to compare.'}
    normalize = lambda value: str(value or '').strip().casefold()
    labels = {normalize(saved.get('profile_name')), normalize(saved.get('profile_display_name'))} - {''}
    if normalize(pipe.get('session_name')) not in labels:
        return {'matched': False, 'reason': 'Save profile and pipe session have not been matched.'}
    index = {a['area_key']: a for a in saved.get('areas', [])}
    matching = []
    for a in pipe['areas']:
        key = f"{a.get('session_id')}:{a.get('island_id')}:{a.get('area_index')}"
        item = index.get(key)
        if item:
            if (item['session_guid'] != a.get('session_guid')
                    or normalize(item['name']) != normalize(a.get('area_name'))):
                return {'matched': False, 'reason': 'Island identities conflict; saved overlays are disabled.'}
            matching.append(key)
    return {'matched': bool(matching), 'matched_area_keys': matching,
            'reason': 'Campaign label and island IDs/names match.' if matching else 'No matching islands.'}
