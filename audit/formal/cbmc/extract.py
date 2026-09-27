#!/usr/bin/env python3
"""Extract verbatim code snippets from the blab Audapter.cpp for CBMC harnesses.

Every snippet is copied byte-for-byte from the pinned source (blab audapter_mex @169cadf) by
line range, and its SHA-256 is compared with the value recorded below, so any edit to the
source makes this script fail instead of silently checking stale code.

Three mechanical transforms may be applied (each is listed in the README):
  1. loop -> one nondeterministic iteration: `for (V = a; V < b; V++)` (or `<=`) becomes a
     loop that runs its body once, for an arbitrary V in the same range (and not at all if the
     range is empty).  Indices in these loops do not depend on earlier iterations, so checking
     one arbitrary iteration is equivalent to checking all of them.
  2. access recording ("char" variant): `outFrameBufPS[A][B]`, `outFrameBufSum[B]` become
     `(*ACC_PS(A, B))`, `(*ACC_SUM(B))`, which record the index before the access so a harness
     can state exactly when it is out of bounds.
  3. fixes ("fixed" variant): exact string replacements, each required to match exactly once.
"""
import hashlib, os, re, sys

SRC = os.path.expanduser('~/hobby/audapter/blab/audapter_mex/TransShiftMex/Audapter.cpp')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'extracted')

# name: (first line, last line, sha256 of the verbatim text, loop vars to make nondet, fixes)
SNIPPETS = {
    # current frame into the pre-pitch-shift ring (bypass branch; 1948/1952 use the same pointer/len)
    'curframe':      (1962, 1962, None, [], []),
    # pvoc analysis-frame copy with wrap-around
    'pvoc_in':       (2002, 2009, None, [], []),
    # pvoc overlap-add accumulate, front zeroing, back zeroing
    'pvoc_ola':      (2065, 2081, None, ['i0'], [
        ('outFrameBufPS[ifb][(outFrameBuf_circPtr - p.delayFrames[ifb] * p.frameLen - i0) % (internalBufLen)] = 0.;',
         'outFrameBufPS[ifb][((outFrameBuf_circPtr - p.delayFrames[ifb] * p.frameLen - i0) % (internalBufLen) + (internalBufLen)) % (internalBufLen)] = 0.;')]),
    # no-pitch-shift copy of the ring into every voice's output ring
    'nopvoc_copy':   (2089, 2092, None, ['i0'], []),
    # DAF read pointer and summation into outFrameBufSum
    'optr_sum':      (2110, 2128, None, ['n0', 'm0'], [
        ('if (outFrameBuf_circPtr - p.delayFrames[h0] * p.frameLen > 0) {',
         'if (outFrameBuf_circPtr - p.delayFrames[h0] * p.frameLen >= 0) {')]),
    # ring pointer advance
    'circ_step':     (2225, 2228, None, [], []),
    # signal recorder writes (input and output)
    'rec_in':        (1683, 1687, None, [], []),
    'rec_out':       (2211, 2213, None, [], []),
    # counter increments and the recorder wrap condition (the body calls sprintf/threads, so only
    # the condition line is taken; the harness supplies `{ frame_counter=0; data_counter=0; }`)
    'fc_step':       (2304, 2307, None, [], []),
}

HASHES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'snippet-hashes.txt')

LOOP_RE = re.compile(r'for\s*\(\s*(int\s+)?(\w+)\s*=\s*([^;]+?)\s*;\s*\2\s*(<=|<)\s*([^;]+?)\s*;\s*\2\s*\+\+\s*\)')

def nondet_loops(text, vars_):
    def rep(m):
        decl, v, lo, op, hi = m.groups()
        if v not in vars_:
            return m.group(0)
        hi_ex = f'({hi}) + 1' if op == '<=' else f'({hi})'
        if decl:
            return (f'for (int {v} = nondet_int(), __once_{v} = ({lo}) <= {v} && {v} < {hi_ex}; '
                    f'__once_{v}; __once_{v} = 0)')
        return (f'for (int __once_{v} = ({v} = nondet_int(), ({lo}) <= {v} && {v} < {hi_ex}); '
                f'__once_{v}; __once_{v} = 0)')
    return LOOP_RE.sub(rep, text)

def bracket_groups(text, i, n):
    """Parse n balanced [...] groups starting at text[i] == '['. Return (groups, end)."""
    groups = []
    for _ in range(n):
        assert text[i] == '[', text[i:i+20]
        depth, j = 0, i
        while True:
            if text[j] == '[': depth += 1
            elif text[j] == ']':
                depth -= 1
                if depth == 0: break
            j += 1
        groups.append(text[i+1:j]); i = j + 1
    return groups, i

def record_accesses(text):
    out, i = [], 0
    names = [('outFrameBufPS', 2, 'ACC_PS'), ('outFrameBufSum', 1, 'ACC_SUM')]
    while i < len(text):
        for name, n, macro in names:
            if text.startswith(name + '[', i) and not re.match(r'\w', text[i-1] if i else ' '):
                g, j = bracket_groups(text, i + len(name), n)
                out.append(f'(*{macro}({", ".join(record_accesses(x) for x in g)}))')
                i = j
                break
        else:
            out.append(text[i]); i += 1
    return ''.join(out)

def main():
    lines = open(SRC, encoding='latin-1').read().split('\n')
    known = {}
    if os.path.exists(HASHES_FILE):
        for l in open(HASHES_FILE):
            k, h = l.split(); known[k] = h
    record = '--record' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    bad = False
    newhashes = []
    for name, (a, b, _, loopvars, fixes) in SNIPPETS.items():
        text = '\n'.join(lines[a-1:b]) + '\n'
        h = hashlib.sha256(text.encode('latin-1')).hexdigest()
        newhashes.append(f'{name} {h}\n')
        if not record and known.get(name) != h:
            print(f'SNIPPET CHANGED: {name} (Audapter.cpp:{a}-{b}) hash {h} != {known.get(name)}')
            bad = True
        hdr = f'/* VERBATIM Audapter.cpp:{a}-{b} (blab 169cadf) sha256={h[:16]} */\n'
        verb = text
        fixed = text
        for fx in fixes:
            for old, new in zip(fx[0::2], fx[1::2]):
                assert fixed.count(old) == 1, (name, old)
                fixed = fixed.replace(old, new)
        for suffix, body in [('', verb), ('.fixed', fixed)]:
            t = nondet_loops(body, loopvars)
            open(os.path.join(OUT, f'{name}{suffix}.inc'), 'w').write(hdr + t)
            open(os.path.join(OUT, f'{name}{suffix}.char.inc'), 'w').write(hdr + record_accesses(t))
    if record:
        open(HASHES_FILE, 'w').writelines(newhashes)
        print('recorded hashes')
    if bad:
        sys.exit(1)

if __name__ == '__main__':
    main()
