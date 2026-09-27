#!/usr/bin/env python3
"""Download the ORIGINAL source files for every redistributable corpus clip into <cache>/raw,
from stable URLs (pinned commits / versioned records), and verify them against sources.lock.json.

  fetch_sources.py <cache_dir>          download missing files, verify all sha256 (fails loudly)
  fetch_sources.py <cache_dir> --lock   (maintainers) write sources.lock.json from the downloaded files

Kinds of source:
  http        plain GET of a stable URL
  zipmember   one member of a remote zip, read with HTTP range requests (no full download)
  parquet     one row of a Hugging Face parquet file at a pinned commit, read with range requests;
              the stored bytes are the row's original audio bytes
"""
import hashlib, io, json, os, sys
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

FEST = 'http://festvox.org/cmu_arctic/cmu_arctic/cmu_us_%s_arctic/%s/arctic_%s.%s'
GH = 'https://raw.githubusercontent.com/%s/%s/%s'
DS = 'https://datashare.ed.ac.uk/server/api/core/bitstreams/%s/content'
VBD_NOISY, VBD_CLEAN = DS % '13c1bfbf-14a6-41db-9b41-8f7310f01ad5', DS % 'dec213d3-bf57-4777-9663-c24bdce92d5e'
VBD_LOG, VBD_TXT = DS % '11185dc8-9cf1-405b-b858-35bd6a04aedd', DS % '09e12592-879e-4749-bf6d-e34cf0d1ddf6'
VOCALSET = 'https://zenodo.org/api/records/1442513/files/VocalSet11.zip/content'
VOCADITO = 'https://zenodo.org/api/records/5578807/files/vocadito.zip/content'
SO762 = 'https://huggingface.co/datasets/mispeech/speechocean762/resolve/06385584fad212b26134c656fdd3ccf9f093f33e/data/test-00000-of-00001.parquet'
LIBRI = 'https://huggingface.co/datasets/openslr/librispeech_asr/resolve/71cacbfb7e2354c4226d01e70d77d5fca3d04ba1/all/validation.clean/0000.parquet'
PVQD = 'https://data.mendeley.com/public-files/datasets/9dz247gnyb/files/%s/file_downloaded'

def sources():
    S = []
    for spk, utts in (('bdl', 'a0005 a0018 a0030 a0036'), ('slt', 'a0005 a0018 a0030 a0036'), ('clb', 'a0005 a0018 a0030 a0036'),
                      ('rms', 'a0005 a0018 a0030 a0036'), ('jmk', 'a0030'), ('awb', 'a0030'), ('ksp', 'a0030')):
        for u in utts.split():
            for k in ('wav', 'lab', 'pm'):
                S.append(('arctic/%s_%s.%s' % (spk, u, k), 'http', FEST % (spk, k, u, k), None))
    S.append(('arctic/txt.done.data', 'http', 'http://festvox.org/cmu_arctic/cmu_arctic/cmu_us_bdl_arctic/etc/txt.done.data', None))
    S.append(('arctic/COPYING', 'http', 'http://festvox.org/cmu_arctic/cmu_arctic/cmu_us_bdl_arctic/COPYING', None))
    for idx, spk in ((103, '0093'), (180, '0112'), (81, '0092'), (64, '0049'), (123, '0094'), (222, '0114'), (0, '0003'), (163, '0111')):
        S.append(('so762/so762_%s_%d.wav' % (spk, idx), 'parquet', SO762, {'row': idx, 'check': {'speaker': spk}}))
    for i in ('84-121123-0000', '1988-24833-0010', '8297-275154-0022', '5338-284437-0014', '2078-142845-0026', '2803-154320-0006'):
        S.append(('libri/%s.flac' % i, 'parquet', LIBRI, {'key': ('id', i)}))
    for k in ('p257_387', 'p232_234', 'p257_110', 'p257_315', 'p232_100', 'p232_113', 'p257_037', 'p232_039'):
        S.append(('vbd/noisy/%s.wav' % k, 'zipmember', VBD_NOISY, {'suffix': '/%s.wav' % k}))
        S.append(('vbd/clean/%s.wav' % k, 'zipmember', VBD_CLEAN, {'suffix': '/%s.wav' % k}))
        S.append(('vbd/testset_txt/%s.txt' % k, 'zipmember', VBD_TXT, {'suffix': '/%s.txt' % k}))
    S.append(('vbd/log_testset.txt', 'zipmember', VBD_LOG, {'suffix': 'log_testset.txt'}))
    for pid, fid in PVQD_IDS.items():
        S.append(('pvqd/%s.wav' % pid, 'http', PVQD % fid, None))
    for fn, spk in (('f2_long_straight_a', 'female2'), ('f2_long_straight_i', 'female2'), ('f9_long_straight_a', 'female9'),
                    ('f9_long_straight_i', 'female9'), ('m2_long_straight_a', 'male2'), ('m2_long_straight_i', 'male2')):
        S.append(('vocalset/%s.wav' % fn, 'zipmember', VOCALSET, {'member': 'FULL/%s/long_tones/straight/%s.wav' % (spk, fn)}))
    for t in (2, 4, 10):
        S.append(('vocadito/vocadito_%d.wav' % t, 'zipmember', VOCADITO, {'suffix': 'Audio/vocadito_%d.wav' % t}))
        S.append(('vocadito/vocadito_%d_f0.csv' % t, 'zipmember', VOCADITO, {'suffix': 'F0/vocadito_%d_f0.csv' % t}))
    S.append(('vocadito/vocadito_metadata.csv', 'zipmember', VOCADITO, {'suffix': 'vocadito_metadata.csv'}))
    K = ('elainekearney/audapter_matlab', '7e59a9286168421648e37e551c6515c96adc9874')
    for s in ('female', 'male'):
        S.append(('gh/sustained-eee-%s.wav' % s, 'http', GH % (K + ('mcode/audio/sustained-eee-%s.wav' % s,)), None))
    F = ('carrien/free-speech', 'ec961b7a04a79199217f4973effda9157afcdf9d')
    for w in ('dipper', 'tipper'):
        S.append(('gh/%s_cwn.wav' % w, 'http', GH % (F + ('templates/%s_cwn.wav' % w,)), None))
    P = ('praat/praat', 'b753a09ba0f4c2385735f08dacd2086088094d69')
    for w in ('heed', 'hid', 'hood', 'hud'):
        S.append(('gh/praat_%s.wav' % w, 'http', GH % (P + ('test/fon%%20ExperimentMFC/Sounds/%s.wav' % w,)), None))
    AM = ('shanqing-cai/audapter_matlab', '0398701a40ff9a0a5bebf2ab0a4ddf28b02ea961')
    S.append(('blab/diao1_female.mat', 'http', GH % (AM + ('example_data/diao1_female.mat',)), None))
    S.append(('blab/trial-1-2.mat', 'http', GH % (AM + ('example_data/trial-1-2.mat',)), None))
    S.append(('gh/da1_male.mat', 'http', GH % ('shanqing-cai/audapter_mex', 'f547196483fd2e68ef33f8a6fa7ed532eefd5af5', 'mcode/da1_male.mat'), None))
    return S

# PVQD: Mendeley Data v4 file ids (stable per dataset version)
PVQD_IDS = json.load(open(os.path.join(HERE, 'pvqd_file_ids.json')))

def sha(b): return hashlib.sha256(b).hexdigest()

_zips, _pq = {}, {}
def get(kind, url, ex):
    if kind == 'http':
        r = requests.get(url, timeout=120, allow_redirects=True); r.raise_for_status(); return r.content
    if kind == 'zipmember':
        from remotezip import RemoteZip
        if url not in _zips: _zips[url] = RemoteZip(url)
        z = _zips[url]
        if 'member' in ex: return z.read(ex['member'])
        m = [n for n in z.namelist() if n.endswith(ex['suffix']) and '__MACOSX' not in n]
        if len(m) != 1: raise RuntimeError('zip member %r: %d matches in %s' % (ex['suffix'], len(m), url))
        return z.read(m[0])
    if kind == 'parquet':
        import pyarrow.parquet as pq
        from httprange import HTTPRangeFile
        if url not in _pq: _pq[url] = pq.ParquetFile(HTTPRangeFile(url))
        f = _pq[url]; md = f.metadata
        if 'row' in ex:
            off = 0
            for g in range(md.num_row_groups):
                n = md.row_group(g).num_rows
                if ex['row'] < off + n:
                    cols = ['audio'] + list(ex.get('check', {}))
                    t = f.read_row_group(g, columns=cols).slice(ex['row'] - off, 1).to_pylist()[0]
                    for k, v in ex.get('check', {}).items():
                        if str(t[k]) != str(v): raise RuntimeError('row %d: %s=%r, expected %r' % (ex['row'], k, t[k], v))
                    return t['audio']['bytes']
                off += n
            raise RuntimeError('row %d out of range' % ex['row'])
        col, val = ex['key']
        for g in range(md.num_row_groups):
            ids = f.read_row_group(g, columns=[col]).column(0).to_pylist()
            if val in ids:
                t = f.read_row_group(g, columns=[col, 'audio']).slice(ids.index(val), 1).to_pylist()[0]
                return t['audio']['bytes']
        raise RuntimeError('%s=%s not found in %s' % (col, val, url))
    raise ValueError(kind)

def main():
    cache = os.path.abspath(sys.argv[1]); lock = '--lock' in sys.argv
    raw = os.path.join(cache, 'raw'); lockf = os.path.join(HERE, 'sources.lock.json')
    L = {} if lock else json.load(open(lockf))
    bad = 0; n_dl = 0
    for rel, kind, url, ex in sources():
        p = os.path.join(raw, rel)
        if os.path.exists(p) and (lock or sha(open(p, 'rb').read()) == L.get(rel, {}).get('sha256')):
            b = open(p, 'rb').read()
        else:
            print('fetch %-40s <- %s' % (rel, url), flush=True)
            b = get(kind, url, ex or {}); n_dl += 1
            os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(b)
        h = sha(b)
        if lock:
            L[rel] = {'sha256': h, 'kind': kind, 'url': url, 'select': ex, 'bytes': len(b)}
        elif h != L[rel]['sha256']:
            print('CHECKSUM MISMATCH %s: got %s expected %s (source %s)' % (rel, h, L[rel]['sha256'], url), file=sys.stderr); bad += 1
    if lock:
        json.dump(L, open(lockf, 'w'), indent=1, sort_keys=True); print('wrote', lockf, len(L), 'entries')
    print('%d source files, %d downloaded, %d checksum failures' % (len(sources()), n_dl, bad))
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
