"""Read-only launch diagnostics and unprivileged local Companion discovery."""
import ipaddress,json,os,re,secrets,socket,subprocess,threading,time
from pathlib import Path

DISCOVERY_PORT=11791
QUERY=b'ANNO117_COMPANION_DISCOVER_V1 '
def has_pipe(value):
    return bool(re.search(r'(?i)(?:^|[\s\"])/pipe(?=$|[\s\"])',str(value)))

def parse_vdf(text):
    tokens=re.findall(r'"((?:\\.|[^"\\])*)"|([{}])',text);stack=[{}];key=None
    for quoted,brace in tokens:
        if brace=='{':
            if key is None:raise ValueError('Invalid VDF')
            child={};stack[-1][key]=child;stack.append(child);key=None
        elif brace=='}':
            if len(stack)==1 or key is not None:raise ValueError('Invalid VDF')
            stack.pop()
        else:
            value=re.sub(r'\\([\\"])',r'\1',quoted)
            if key is None:key=value.lower()
            else:stack[-1][key]=value;key=None
    if len(stack)!=1 or key is not None:raise ValueError('Incomplete VDF')
    return stack[0]

def steam_diagnostics(roots):
    records=[]
    for root in dict.fromkeys(map(Path,roots)):
        libraries=[root]
        try:
            data=parse_vdf((root/'steamapps/libraryfolders.vdf').read_text(encoding='utf-8'))
            libraries += [Path(v['path']) for v in data.get('libraryfolders',{}).values() if isinstance(v,dict) and 'path' in v]
        except (OSError,ValueError):pass
        apps=set()
        for lib in dict.fromkeys(libraries):
            for manifest in (lib/'steamapps').glob('appmanifest_*.acf'):
                try:
                    a=parse_vdf(manifest.read_text(encoding='utf-8')).get('appstate',{})
                    if re.search(r'anno\s*117',a.get('name',''),re.I):apps.add(a['appid'])
                except (OSError,ValueError,KeyError):pass
        for appid in apps:
            found=[]
            for config in (root/'userdata').glob('*/config/localconfig.vdf'):
                try:
                    a=parse_vdf(config.read_text(encoding='utf-8'))['userlocalconfigstore']['software']['valve']['steam']['apps'][appid]
                    found.append(has_pipe(a.get('launchoptions','')))
                except (OSError,ValueError,KeyError,TypeError):pass
            records.append({'launcher':'Steam','state':'configured' if found and all(found) else 'mixed' if any(found) else 'missing' if found else 'unknown','profiles_checked':len(found)})
    return records

def launch_diagnostics():
    roots=[Path(os.environ.get('PROGRAMFILES(X86)','C:/Program Files (x86)'))/'Steam']
    installed=False
    if os.name=='nt':
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER,r'Software\Valve\Steam') as key:roots.append(Path(winreg.QueryValueEx(key,'SteamPath')[0]))
        except OSError:pass
        for branch in [r'SOFTWARE\Ubisoft\Launcher\Installs',r'SOFTWARE\WOW6432Node\Ubisoft\Launcher\Installs']:
            try:
                with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,branch) as key:
                    for i in range(winreg.QueryInfoKey(key)[0]):
                        try:
                            with winreg.OpenKey(key,winreg.EnumKey(key,i)) as game:
                                location=str(winreg.QueryValueEx(game,'InstallDir')[0]);installed |= bool(re.search(r'Anno\s*117',location,re.I))
                        except OSError:pass
            except OSError:pass
    records=steam_diagnostics(roots)
    if installed:records.append({'launcher':'Ubisoft Connect','state':'unknown','reason':'The launcher does not expose a verified launch-option format here. Running-game arguments are checked independently.'})
    runtime='not_running'
    if os.name=='nt':
        try:
            cmd="Get-CimInstance Win32_Process -Filter \"Name='Anno117.exe'\" | Select-Object -ExpandProperty CommandLine | ConvertTo-Json -Compress"
            result=subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',cmd],capture_output=True,text=True,timeout=12,creationflags=0x08000000)
            if result.returncode:runtime='unknown'
            elif result.stdout.strip():
                value=json.loads(result.stdout);commands=value if isinstance(value,list) else [value]
                runtime='active' if any(has_pipe(v) for v in commands) else 'missing' if all(isinstance(v,str) and v for v in commands) else 'unknown'
        except (OSError,ValueError,subprocess.TimeoutExpired):runtime='unknown'
    return {'runtime':runtime,'launchers':records,'checked_at':time.time(),'read_only':True}

def save_connection_summary(insights,pipe):
    if insights is None:return {'enabled':False,'status':'unavailable','use_saves':False,'snapshot_ready':False}
    value=insights.state(pipe);saved=value.get('snapshot') or {};join=value.get('join') or {}
    selected=next((p for p in value.get('profiles',[]) if p.get('id')==value.get('selected_profile_id')),{})
    fresh=pipe.get('pipe_state')=='connected' and any(not a.get('cached',True) and not a.get('stale',True) for a in pipe.get('areas',[]))
    return {'enabled':value.get('enabled',False),'use_saves':value.get('use_saves',False),'status':value.get('status'),'error':value.get('error',''),
            'profile_name':saved.get('profile_name') or selected.get('name'),'file_name':saved.get('file_name') or value.get('selected_file'),
            'saved_at':saved.get('saved_at'),'area_count':len(saved.get('areas',[])),'snapshot_ready':bool(saved.get('areas')),
            'pipe_comparison':'not_available' if not pipe.get('areas') else ('matched' if fresh else 'matched_cached') if join.get('matched') else 'not_matched','comparison_reason':join.get('reason','')}

class DiscoveryServer:
    def __init__(self,http_port,host='0.0.0.0',discovery_port=DISCOVERY_PORT):
        self.port=http_port;self.host=host;self.discovery_port=discovery_port;self.socket=None;self.stopped=threading.Event();self.id=secrets.token_hex(8)
    def start(self):
        try:
            sock=socket.socket(socket.AF_INET,socket.SOCK_DGRAM);sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);sock.bind((self.host,self.discovery_port));sock.settimeout(.5);self.socket=sock
            threading.Thread(target=self.run,daemon=True).start();return True
        except OSError:
            if 'sock' in locals():sock.close()
            return False
    def run(self):
        recent={}
        while not self.stopped.is_set():
            try:
                data,peer=self.socket.recvfrom(256)
                if not data.startswith(QUERY):continue
                nonce=data[len(QUERY):].decode('ascii',errors='ignore')
                if not re.fullmatch('[a-f0-9]{24}',nonce):continue
                ip=ipaddress.ip_address(peer[0])
                if not(ip.is_private or ip.is_loopback):continue
                now=time.monotonic()
                if now-recent.get(peer[0],0)<.4:continue
                if len(recent)>256:recent.clear()
                recent[peer[0]]=now
                reply={'service':'anno117-companion','protocol':1,'nonce':nonce,'name':socket.gethostname()[:80],'port':self.port,'id':self.id}
                self.socket.sendto(json.dumps(reply).encode(),peer)
            except socket.timeout:pass
            except OSError:break
    def stop(self):
        self.stopped.set()
        if self.socket:self.socket.close()

def discover(timeout=1.5,targets=None,port=DISCOVERY_PORT):
    nonce=secrets.token_hex(12);results={};sock=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
    try:
        sock.setsockopt(socket.SOL_SOCKET,socket.SO_BROADCAST,1);sock.settimeout(.15)
        for target in targets or ['255.255.255.255','127.0.0.1']:
            try:sock.sendto(QUERY+nonce.encode(),(target,port))
            except OSError:pass
        end=time.monotonic()+min(3,max(.2,timeout))
        while time.monotonic()<end:
            try:
                raw,peer=sock.recvfrom(2048);value=json.loads(raw)
                if not isinstance(value,dict):continue
                if value.get('service')!='anno117-companion' or value.get('nonce')!=nonce or type(value.get('port')) is not int or not 1<=value['port']<=65535:continue
                ip=ipaddress.ip_address(peer[0])
                if not(ip.is_private or ip.is_loopback):continue
                identifier=value.get('id','');key=(identifier,value['port']) if isinstance(identifier,str) and re.fullmatch('[a-f0-9]{16}',identifier) else (peer[0],value['port'])
                previous=results.get(key)
                if previous and not previous['address'].startswith('http://127.') and ip.is_loopback:continue
                results[key]={'name':str(value.get('name','PC'))[:80],'address':f'http://{peer[0]}:{value["port"]}','requires_pairing':True}
            except (socket.timeout,ValueError,TypeError):continue
    finally:sock.close()
    return list(results.values())
