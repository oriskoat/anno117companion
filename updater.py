"""Pinned GitHub Releases updater. No game data or pairing is sent to GitHub."""
import ctypes
import hashlib
import hmac
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit, unquote
from version import APP_VERSION, REPOSITORY

API='https://api.github.com/repos/'+REPOSITORY+'/releases/latest'
RELEASES='https://github.com/'+REPOSITORY+'/releases'
MAX_PACKAGE=200_000_000


def version_parts(value):
    match=re.fullmatch(r'v?(\d+)\.(\d+)\.(\d+)',str(value))
    if not match:raise ValueError('Invalid stable release version')
    return tuple(map(int,match.groups()))


def select_release(release,current=APP_VERSION,extension='.exe'):
    if not isinstance(release,dict):raise ValueError('Invalid release metadata')
    if release.get('draft') or release.get('prerelease'):raise ValueError('Stable releases only')
    tag=release.get('tag_name','');latest=version_parts(tag)
    state={'current':current,'latest':tag.lstrip('v'),'status':'current','url':RELEASES}
    if latest<=version_parts(current):return state
    prefix=RELEASES+'/download/'+tag+'/'
    candidates=[]
    for asset in release.get('assets',[]):
        name=asset.get('name','');url=asset.get('browser_download_url','')
        if not name.lower().endswith(extension) or not name.lower().startswith('anno'):continue
        if not url.startswith(prefix) or unquote(url[len(prefix):])!=name:continue
        digest=asset.get('digest','')
        if not re.fullmatch(r'sha256:[0-9a-fA-F]{64}',digest):continue
        size=asset.get('size',0)
        if not isinstance(size,int) or not 0<size<=MAX_PACKAGE:continue
        candidates.append({'name':name,'url':url,'bytes':size,'sha256':digest[7:].lower()})
    candidates.sort(key=lambda a:(a['name']!='Anno117Companion.exe',a['name']))
    if not candidates:return {**state,'status':'incomplete'}
    return {**state,'status':'available','asset':candidates[0]}


def fetch_release():
    request=urllib.request.Request(API,headers={'User-Agent':'Anno117Companion/'+APP_VERSION,'Accept':'application/vnd.github+json'})
    with urllib.request.urlopen(request,timeout=12) as response:
        body=response.read(2_000_001)
        if len(body)>2_000_000:raise ValueError('Release metadata too large')
        return json.loads(body)


class Updater:
    def __init__(self,root):
        self.root=Path(root);self.folder=self.root/'bridge-settings/updates'
        self.lock=threading.Lock();self.state={'status':'idle','current':APP_VERSION,'url':RELEASES}
        self.downloaded=None

    def check(self,force=False):
        with self.lock:return self._check(force)

    def _check(self,force):
        try:
            path=self.folder/'release.json';saved={}
            if path.is_file():
                try:saved=json.loads(path.read_text(encoding='utf-8'))
                except (ValueError,OSError):pass
            if not force and 0<=time.time()-saved.get('checked_at',0)<21600:
                release=saved.get('release')
            else:
                try:release=fetch_release()
                except urllib.error.HTTPError as error:
                    if error.code!=404:raise
                    release=None
                self.folder.mkdir(parents=True,exist_ok=True)
                path.write_text(json.dumps({'checked_at':time.time(),'release':release}),encoding='utf-8')
            self.state=select_release(release) if release else {'status':'unpublished','current':APP_VERSION,'url':RELEASES}
        except (OSError,ValueError,TypeError,KeyError):self.state={'status':'offline','current':APP_VERSION,'url':RELEASES}
        return self.state

    def download(self):
        with self.lock:
            state=self._check(True)
            if state['status']!='available':return state
            asset=state['asset'];self.folder.mkdir(parents=True,exist_ok=True)
            destination=self.folder/('Anno117Companion-'+state['latest']+'.exe')
            partial=destination.with_suffix('.part')
            try:
                request=urllib.request.Request(asset['url'],headers={'User-Agent':'Anno117Companion/'+APP_VERSION})
                checksum=hashlib.sha256();total=0
                with urllib.request.urlopen(request,timeout=30) as response,partial.open('wb') as output:
                    final=urlsplit(response.url)
                    if final.scheme!='https' or final.hostname not in {'github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'}:raise ValueError('Unexpected download host')
                    while True:
                        data=response.read(262144)
                        if not data:break
                        total+=len(data)
                        if total>asset['bytes'] or total>MAX_PACKAGE:raise ValueError('Package too large')
                        checksum.update(data);output.write(data)
                if total!=asset['bytes'] or not hmac.compare_digest(checksum.hexdigest(),asset['sha256']):raise ValueError('Package checksum mismatch')
                with partial.open('rb') as file:
                    if file.read(2)!=b'MZ':raise ValueError('Invalid Windows package')
                partial.replace(destination);self.downloaded=(destination,asset['sha256'])
                self.state={**state,'status':'ready'}
            except (OSError,ValueError):
                partial.unlink(missing_ok=True);self.downloaded=None
                self.state={**state,'status':'failed'}
            return self.state

    def restart(self):
        with self.lock:
            if not getattr(sys,'frozen',False):raise ValueError('Run the packaged EXE to install updates')
            if not self.downloaded or self.state['status']!='ready':raise ValueError('Download and verify an update first')
            source,checksum=self.downloaded
            config=self.folder/'apply.json'
            config.write_text(json.dumps({'source':str(source.resolve()),'target':str(Path(sys.executable).resolve()),'sha256':checksum,'pids':[os.getpid(),os.getppid()]}),encoding='utf-8')
            subprocess.Popen([str(source),'--apply-update',str(config)],cwd=str(self.root),creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
            return {'status':'restarting','current':APP_VERSION}


def apply_update(config_path):
    config_path=Path(config_path).resolve();data=json.loads(config_path.read_text(encoding='utf-8'))
    target=Path(data['target']).resolve();source=Path(data['source']).resolve();root=target.parent
    folder=root/'bridge-settings/updates'
    if config_path.parent!=folder or source.parent!=folder or target.suffix.lower()!='.exe' or source!=Path(sys.executable).resolve():raise ValueError('Invalid update paths')
    result=folder/'result.json';backup=target.with_suffix('.previous.exe');temporary=target.with_suffix('.updating.exe')
    moved=False;exited=False
    try:
        if not hmac.compare_digest(hashlib.sha256(source.read_bytes()).hexdigest(),data['sha256']):raise ValueError('Update checksum changed')
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.OpenProcess.argtypes=[ctypes.c_uint32,ctypes.c_bool,ctypes.c_uint32];kernel.OpenProcess.restype=ctypes.c_void_p
        kernel.WaitForSingleObject.argtypes=[ctypes.c_void_p,ctypes.c_uint32];kernel.CloseHandle.argtypes=[ctypes.c_void_p]
        for process_id in data['pids']:
            handle=kernel.OpenProcess(0x00100000,False,int(process_id))
            if handle:
                try:
                    if kernel.WaitForSingleObject(handle,60000)!=0:raise ValueError('Previous app did not exit')
                finally:kernel.CloseHandle(handle)
        exited=True
        shutil.copy2(source,temporary)
        for attempt in range(30):
            try:
                if target.exists():os.replace(target,backup);moved=True
                os.replace(temporary,target)
                break
            except PermissionError:
                if attempt==29:raise
                time.sleep(.3)
        subprocess.Popen([str(target)],cwd=str(root))
        result.write_text(json.dumps({'status':'updated','version':APP_VERSION}),encoding='utf-8')
    except Exception as error:
        if moved and backup.exists():
            try:os.replace(backup,target)
            except OSError:pass
        result.write_text(json.dumps({'status':'failed','message':str(error)}),encoding='utf-8')
        if exited and target.exists():subprocess.Popen([str(target)],cwd=str(root))
