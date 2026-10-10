#!/usr/bin/env python3
"""render.py PROJ OUT [--stills 0.9,3.4] [--fps 30] [--audio a.wav]  逐幀渲染 canvas → ffmpeg"""
import argparse, base64, functools, http.server, json, socketserver, subprocess, threading, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('proj'); ap.add_argument('out')
ap.add_argument('--stills'); ap.add_argument('--fps', type=int, default=30); ap.add_argument('--audio')
ap.add_argument('--events')
a = ap.parse_args()

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
class Srv(socketserver.ThreadingTCPServer):
    daemon_threads = True; allow_reuse_address = True
srv = Srv(('127.0.0.1', 0), functools.partial(Q, directory=a.proj)); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    errs = []
    pg.on('pageerror', lambda e: (print('[pageerror]', e), errs.append(e)))
    pg.on('console', lambda m: print('[console]', m.type, m.text) if m.type in ('error', 'warning') else None)
    pg.goto(f'http://127.0.0.1:{port}/index.html')
    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=60000)
    bf = pg.evaluate('window.__bootFailed || null')
    if bf: sys.exit('boot failed: ' + bf)
    if a.events: Path(a.events).write_text(json.dumps(pg.evaluate('window.EVENTS')))
    grab = "(t)=>{renderFrame(t);return document.getElementById('c').toDataURL('image/png').slice(22)}"
    if a.stills:
        out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
        for t in [float(x) for x in a.stills.split(',')]:
            (out / f't{t:05.2f}.png').write_bytes(base64.b64decode(pg.evaluate(grab, t)))
    else:
        total = pg.evaluate('window.__total'); n = round(total * a.fps)
        cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(a.fps), '-i', '-']
        if a.audio: cmd += ['-i', a.audio]
        cmd += ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium']
        if a.audio: cmd += ['-c:a', 'aac', '-b:a', '192k', '-shortest']
        cmd += [a.out]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for i in range(n):
            ff.stdin.write(base64.b64decode(pg.evaluate(grab, i / a.fps)))
            if i % 30 == 0: print('frame', i, '/', n, flush=True)
        ff.stdin.close(); ff.wait()
    b.close()
if errs: sys.exit('page errors')
