"""Local-only development server; leaves the existing pipe owner alone."""
import sys,threading
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from bridge import BridgeService
service=BridgeService(port=11792,save_preview=True,connect_pipe=False)
try:
 service.start();print('Local planner preview listening on 11792',flush=True);threading.Event().wait()
except KeyboardInterrupt:pass
finally:service.stop()
