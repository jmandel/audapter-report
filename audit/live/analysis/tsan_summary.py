"""Summarise ThreadSanitizer logs: unique (main-thread site, audio-thread site) pairs, with the
nearest Audapter/audioIO/RtAudio frame for each side and the main-thread MEX action.
usage: tsan_summary.py <log files...>"""
import sys, re, collections
OURS = re.compile(r'(build/src(?:-io)?/[\w.]+:\d+)')
def frames(block):
    out = []
    for l in block:
        m = re.search(r'#\d+ (\S+(?:\([^)]*\))?[^/]*) (\S+:\d+)', l)
        if m: out.append((m.group(1).strip(), m.group(2)))
    return out
def site(fr):
    for fn, loc in fr:
        if loc.startswith('build/src'): return f"{loc} {fn.split('(')[0]}"
    return fr[0][1] if fr else '?'
def action(fr):
    # which mexFunction line (i.e. which Audapter action) the main thread was in
    for fn, loc in fr:
        if 'mexLibrary.cpp' in loc: return loc
    return ''
pairs = collections.Counter(); kinds = {}
for fn in sys.argv[1:]:
    txt = open(fn, errors='replace').read()
    for rep in txt.split('==================\n'):
        if 'WARNING: ThreadSanitizer' not in rep: continue
        kind = re.search(r'ThreadSanitizer: ([\w -]+?) \(', rep).group(1)
        parts = re.split(r'\n  (?=(?:Previous |Atomic )?(?:[Rr]ead|[Ww]rite|Location|Mutex|Thread|Previous))', rep)
        acc = [p for p in parts if re.match(r'(Previous )?(atomic )?([Rr]ead|[Ww]rite) of', p)]
        if kind != 'data race' or len(acc) < 2:
            pairs[(kind, site(frames(rep.splitlines())), '', '')] += 1; continue
        a, b = acc[0], acc[1]
        ta = 'main' if 'main thread' in a.splitlines()[0] else 'audio'
        tb = 'main' if 'main thread' in b.splitlines()[0] else 'audio'
        fa, fb = frames(a.splitlines()), frames(b.splitlines())
        m_, a_ = (fa, fb) if ta == 'main' else (fb, fa)
        rw = lambda blk: 'W' if re.search(r'[Ww]rite', blk.splitlines()[0].split(' at ')[0]) else 'R'
        wa = rw(a if ta == 'main' else b); wb = rw(b if ta == 'main' else a)
        pairs[(kind, f"{wa} {site(m_)}", f"{wb} {site(a_)}", action(m_))] += 1
byfn = collections.Counter()
for (k, m, a, act), n in pairs.items():
    f = lambda x: x.split(' ')[-1] if x else ''
    byfn[(f(m), f(a), act)] += n
print("== grouped by function (main-thread fn <-> audio-thread fn [MEX action line])")
for (m, a, act), n in sorted(byfn.items(), key=lambda x: -x[1]): print(f"{n:4d}  {m:40s} <-> {a:35s} [{act}]")
print()
print(f"{sum(pairs.values())} reports, {len(pairs)} unique site pairs\n")
print(f"{'n':>4}  main thread (MEX action)  <->  audio callback thread")
for (k, m, a, act), n in sorted(pairs.items(), key=lambda x: (-x[1])):
    print(f"{n:4d}  {m}   [{act}]\n      <-> {a}" if a else f"{n:4d}  {k}: {m}")
