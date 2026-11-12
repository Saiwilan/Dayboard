import json
import os
import glob
import subprocess
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOKEN = open('/etc/dayboard-agent/token').read().strip()
BACKLIGHT = next(iter(sorted(glob.glob('/sys/class/backlight/*'))), '/sys/class/backlight/none')
ENV = dict(os.environ, DISPLAY=':0', XAUTHORITY='/root/.Xauthority')
SAVED_BRIGHT = None


def run(args):
    return subprocess.run(args, env=ENV, capture_output=True, text=True, timeout=5)


def xset(*args):
    return run(['xset', *args])


def read(path):
    try:
        return open(path).read().strip()
    except Exception:
        return None


def set_backlight(raw):
    try:
        with open(f'{BACKLIGHT}/brightness', 'w') as f:
            f.write(str(raw))
        return True
    except Exception:
        return False


def hardware():
    eth = None
    try:
        for n in sorted(os.listdir('/sys/class/net')):
            if n == 'lo' or n.startswith(('wlan', 'wl', 'docker', 'veth', 'br', 'bond')):
                continue
            base = f'/sys/class/net/{n}'
            if not os.path.exists(base + '/device'):
                continue
            carrier = read(base + '/carrier')
            up = carrier == '1' if carrier is not None else read(base + '/operstate') == 'up'
            eth = {'iface': n, 'up': up}
            break
    except Exception:
        pass
    bat = None
    try:
        for n in sorted(os.listdir('/sys/class/power_supply')):
            base = f'/sys/class/power_supply/{n}'
            if read(base + '/type') != 'Battery':
                continue
            bat = {'name': n, 'status': read(base + '/status')}
            cap = read(base + '/capacity')
            if cap is not None:
                try:
                    bat['capacity'] = int(cap)
                except ValueError:
                    pass
            break
    except Exception:
        pass
    temp = None
    for pat in ('/sys/class/thermal/thermal_zone*/temp', '/sys/class/hwmon/hwmon*/temp*_input'):
        for f in glob.glob(pat):
            v = read(f)
            if v is None:
                continue
            try:
                c = int(v) / 1000
            except ValueError:
                continue
            if 0 < c < 150:
                temp = max(temp or 0, c)
    return eth, bat, temp


def status():
    try:
        cur = int(open(f'{BACKLIGHT}/brightness').read())
        mx = int(open(f'{BACKLIGHT}/max_brightness').read())
        bright = round(cur * 100 / mx)
    except Exception:
        bright = None
    q = run(['xset', 'q']).stdout
    m = run(['amixer', 'get', 'Master']).stdout
    eth, bat, temp = hardware()
    return {'ok': True, 'brightness': bright, 'displayOn': 'Monitor is Off' not in q and bright != 0, 'muted': '[off]' in m,
            'ethernet': eth, 'battery': bat, 'tempC': temp}


def cmd(b):
    global SAVED_BRIGHT
    c = b.get('cmd')
    if c == 'brightness':
        v = max(5, min(100, int(b.get('value', 80))))
        mx = int(open(f'{BACKLIGHT}/max_brightness').read())
        raw = max(8, round(v * mx / 100))
        with open(f'{BACKLIGHT}/brightness', 'w') as f:
            f.write(str(raw))
        if SAVED_BRIGHT is not None:
            SAVED_BRIGHT = str(raw)
        return {'ok': True, 'brightness': v}
    if c == 'on':
        d = xset('+dpms', 'dpms', 'force', 'on').returncode == 0
        cur = read(f'{BACKLIGHT}/brightness')
        if SAVED_BRIGHT is not None:
            bl = set_backlight(SAVED_BRIGHT)
            SAVED_BRIGHT = None
        elif cur in (None, '0'):
            mx = read(f'{BACKLIGHT}/max_brightness')
            bl = set_backlight(round(int(mx) * 0.8)) if mx else False
        else:
            bl = True
        return {'ok': d or bl, 'dpms': d, 'backlight': bl}
    if c == 'off':
        # DPMS alone can leave an eDP backlight lit; cut it too so the panel truly sleeps
        cur = read(f'{BACKLIGHT}/brightness')
        if cur not in (None, '0'):
            SAVED_BRIGHT = cur
        d = xset('+dpms', 'dpms', 'force', 'off').returncode == 0
        bl = set_backlight(0)
        return {'ok': d or bl, 'dpms': d, 'backlight': bl}
    if c == 'mute':
        run(['amixer', 'set', 'Master', 'mute' if b.get('value') else 'unmute'])
        return {'ok': True}
    if c == 'status':
        return status()
    return {'ok': False, 'error': 'unknown cmd'}


class Handler(BaseHTTPRequestHandler):
    def _auth(self):
        return hmac.compare_digest(self.headers.get('x-dayboard-token', ''), TOKEN)

    def _send(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('content-type', 'application/json')
        self.send_header('content-length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if not self._auth():
            return self._send({'ok': False, 'error': 'unauthorized'}, 401)
        try:
            n = int(self.headers.get('content-length', 0))
            b = json.loads(self.rfile.read(n) or b'{}')
            self._send(cmd(b))
        except Exception as e:
            self._send({'ok': False, 'error': str(e)}, 500)

    def do_GET(self):
        if not self._auth():
            return self._send({'ok': False, 'error': 'unauthorized'}, 401)
        self._send(status())

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    xset('+dpms', 'dpms', '0', '0', '0')
    run(['amixer', '-c', '1', 'sset', 'Speaker', 'on'])
    run(['amixer', '-c', '1', 'sset', 'Auto-Mute Mode', 'Disabled'])
    ThreadingHTTPServer(('0.0.0.0', 8009), Handler).serve_forever()