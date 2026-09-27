import io, requests
class HTTPRangeFile(io.RawIOBase):
    """Minimal seekable read-only file over HTTP Range requests."""
    def __init__(self, url):
        self.url = url; self.pos = 0; self.s = requests.Session()
        r = self.s.head(url, allow_redirects=True, timeout=60); r.raise_for_status()
        self.url = r.url; self.size = int(r.headers['Content-Length']); self.nreq = 0; self.nbytes = 0
    def readable(self): return True
    def seekable(self): return True
    def tell(self): return self.pos
    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else (self.pos + off if whence == 1 else self.size + off); return self.pos
    def read(self, n=-1):
        if n is None or n < 0: n = self.size - self.pos
        if n == 0 or self.pos >= self.size: return b''
        end = min(self.pos + n, self.size) - 1
        r = self.s.get(self.url, headers={'Range': 'bytes=%d-%d' % (self.pos, end)}, timeout=120); r.raise_for_status()
        b = r.content; self.pos += len(b); self.nreq += 1; self.nbytes += len(b); return b
    def readinto(self, b):
        d = self.read(len(b)); b[:len(d)] = d; return len(d)
