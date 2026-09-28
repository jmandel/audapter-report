#!/usr/bin/env python3
"""labrun load-time transformation: MATLAB graphics-object dot notation (h.Visible = 'on', x = h.Value) that
Octave cannot run (its handles are plain doubles). Applied only to files that failed with such an error, in the
sandbox copy (the lab's files are never edited). Each rewritten line is reported (file, line, before, after).

  EXPR.Prop = RHS;          ->  EXPR = lr_dotset(EXPR, 'Prop', RHS);
  EXPR.Prop(i,j) = RHS;     ->  EXPR = lr_dotset(EXPR, 'Prop', RHS, {i,j});
  ... EXPR.Prop ...         ->  ... lr_dotget(EXPR, 'Prop') ...
lr_dotset/lr_dotget use set/get for graphics handles and plain field access for structs, so a rewritten struct
access behaves as before. Only a fixed list of graphics property names is rewritten.
usage: transform.py FILE  (rewrites in place, prints TSV lines: line<TAB>before<TAB>after)"""
import re, sys
import os
# graphics property names (Octave's get() of every object type, lower case; tools/hgprops.txt), plus MATLAB-only ones.
# A dotted name is rewritten only if it is CamelCase in the code (MATLAB's convention) and a property name.
_extra = 'windowstate autoresizechildren scrollable innerposition layout'.split()
PROPS_LC = set(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hgprops.txt')).read().split()) | set(_extra)
P = r'(?=[A-Z])(?i:' + '|'.join(sorted(PROPS_LC, key=len, reverse=True)) + r')(?![A-Za-z0-9_])'
ID = r'[A-Za-z]\w*(?:\([^()\n]*\))?'
BASE = rf'(?<![\w.]){ID}(?:\.{ID})*?'
READ = re.compile(rf'({BASE})\.({P})\b(?!\s*\()')
READIDX = re.compile(rf'({BASE})\.({P})\b(?=\s*\()')
ASSIGN = re.compile(rf'^(\s*)({BASE})\.({P})\s*(\(([^()\n]*)\))?\s*=(?!=)\s*(.*?)\s*;?\s*$')

def mask(line):
    """Replace string literals and comments with placeholders of equal length (X) so regexes skip them."""
    out, i, n, prev = [], 0, len(line), ''
    while i < n:
        c = line[i]
        if c == '%':
            out.append('X' * (n - i)); break
        if c == '"' or (c == "'" and not re.match(r"[\w)\]}.']", prev)):
            j = i + 1
            while j < n:
                if line[j] == c:
                    if j + 1 < n and line[j + 1] == c: j += 2; continue
                    break
                j += 1
            out.append(c + 'X' * (j - i - 1) + (c if j < n else '')); i = j + 1; prev = c; continue
        out.append(c); prev = c if not c.isspace() else prev; i += 1
    return ''.join(out)

def rewrite_reads(line, m=None):
    """Rewrite reads one at a time (leftmost first), re-masking after each, so chains like h.Parent.Parent
    become lr_dotget(lr_dotget(h, 'Parent'), 'Parent'). Indexed reads become lr_dotget(...)(idx)."""
    for _ in range(50):
        m = mask(line)
        cands = list(READ.finditer(m)) + list(READIDX.finditer(m))
        if not cands: break
        x = min(cands, key=lambda z: z.start())
        b, p = x.group(1), x.group(2)
        base = line[x.start():x.start() + len(b)]
        line = line[:x.start()] + f"lr_dotget({base}, '{p}')" + line[x.end():]
    return line

def main(fn):
    src = open(fn, encoding='latin-1').read().split('\n'); changed = []
    for k, full in enumerate(src):
        mfull = mask(full)
        # split off a trailing comment (outside strings) so it is not taken into a right-hand side
        ci = full.find('%') if False else -1
        for idx in range(len(full)):
            if full[idx] == '%' and mfull[idx] == 'X' and (idx == 0 or mfull[idx - 1] != 'X' or full[idx - 1] != 'X'):
                ci = idx if (mfull[idx:] == 'X' * (len(full) - idx)) else -1
                if ci >= 0: break
        line, comment = (full[:ci], full[ci:]) if ci >= 0 else (full, '')
        m = mask(line)
        if not any(z.group(1).lower() in PROPS_LC for z in re.finditer(r'\.([A-Z][A-Za-z0-9]*)\b', m)): continue
        new = line
        a = ASSIGN.match(m)
        if a and a.group(6) is not None and a.group(6).strip() and a.group(3).lower() in PROPS_LC:
            ind, base, prop = line[a.start(1):a.end(1)], line[a.start(2):a.end(2)], a.group(3)
            idx = line[a.start(5):a.end(5)] if a.group(5) is not None else None
            rhs = line[a.start(6):a.end(6)]
            rhs_m = m[a.start(6):a.end(6)]
            rhs = rewrite_reads(rhs)
            base2 = rewrite_reads(base)
            call = f"lr_dotset({base2}, '{prop}', {rhs}" + (f", {{{idx}}}" if idx is not None else '') + ')'
            new = f"{ind}{call};" if base2 != base else f"{ind}{base} = {call};"
        else:
            new = rewrite_reads(line, m)
        if new != line:
            new = new.rstrip() + ((' ' + comment) if comment else '')
            src[k] = new; changed.append((k + 1, full.strip(), new.strip()))
    if changed:
        open(fn, 'w', encoding='latin-1').write('\n'.join(src))
    for k, a, b in changed: print(f'{k}\t{a}\t{b}')

if __name__ == '__main__':
    main(sys.argv[1])
