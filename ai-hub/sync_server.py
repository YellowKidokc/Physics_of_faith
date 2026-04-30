from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from pathlib import Path
import configparser

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / 'config' / 'services.ini'
CLOUDFLARE = ROOT / 'config' / 'cloudflare_pages.json'
CLIPS = []

class H(BaseHTTPRequestHandler):
    def _json(self, data, code=200):
        raw = json.dumps(data).encode()
        self.send_response(code); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def do_GET(self):
        if self.path == '/clips': return self._json(CLIPS)
        if self.path == '/export/html':
            html=f"<!doctype html><meta charset='utf-8'><title>Clipboard Export</title><script>const EMBEDDED_CLIPS={json.dumps(CLIPS)}</script><body><pre id='o'></pre><script>o.textContent=JSON.stringify(EMBEDDED_CLIPS,null,2)</script></body>"
            b=html.encode(); self.send_response(200); self.send_header('Content-Type','text/html'); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b); return
        if self.path == '/config/services':
            cp=configparser.ConfigParser(); cp.read(CONFIG); return self._json({s:dict(cp[s]) for s in cp.sections()})
        if self.path == '/config/cloudflare_pages':
            return self._json(json.loads(CLOUDFLARE.read_text()))
        self.send_error(404)
    def do_POST(self):
        n=int(self.headers.get('Content-Length',0)); data=json.loads(self.rfile.read(n) or b'{}')
        if self.path == '/clips': CLIPS.append(data); return self._json({'ok':True})
        if self.path == '/config/cloudflare_pages': CLOUDFLARE.write_text(json.dumps(data, indent=2)); return self._json({'ok':True})
        self.send_error(404)

if __name__ == '__main__':
    HTTPServer(('0.0.0.0',3456), H).serve_forever()
