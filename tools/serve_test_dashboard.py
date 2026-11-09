"""Synthetic UI test server: never opens the pipe, real saves or user settings."""
import argparse
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=11793);a=p.parse_args()
root=Path(__file__).resolve().parents[1]/'android-probe/app/src/main/assets/dashboard'
ThreadingHTTPServer(('127.0.0.1',a.port),partial(SimpleHTTPRequestHandler,directory=str(root))).serve_forever()
