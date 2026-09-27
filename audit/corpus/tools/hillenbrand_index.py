#!/usr/bin/env python3
"""Write index.tsv for the Hillenbrand et al. (1995) subset used by harness/oct/corpus_hillenbrand.m:
the first 12 talkers (sorted by id) of each group (m, w, b, g) x all 12 vowels, with steady-state and
20/50/80 % formants (vowdata.dat) and vowel start/end/steady-state times (timedata.dat, ss = mean of judges).
Usage: hillenbrand_index.py <dir containing vowdata.dat and timedata.dat>   (stdlib only)"""
import collections, os, re, sys
d = sys.argv[1]; pat = re.compile(r'^[mwbg]\d\d[a-z][a-z]$')
V = {p[0]: p[1:] for p in (l.split() for l in open(os.path.join(d, 'vowdata.dat'))) if len(p) == 16 and pat.match(p[0])}
T = {p[0]: p[1:] for p in (l.split() for l in open(os.path.join(d, 'timedata.dat'))) if len(p) == 5 and pat.match(p[0])}
tal = collections.defaultdict(set)
for k in V: tal[k[0]].add(k[:3])
keep = {g: sorted(tal[g])[:12] for g in tal}; n = 0
with open(os.path.join(d, 'index.tsv'), 'w') as f:
    f.write('file\tgroup\tvowel\tdur\tf0\tF1\tF2\tF3\tF1_20\tF2_20\tF1_50\tF2_50\tF1_80\tF2_80\tstart\tend\tss\n')
    for k in sorted(V):
        if k[:3] not in keep[k[0]] or k not in T: continue
        v = V[k]; t = T[k]; ss = (float(t[2]) + float(t[3])) / 2
        f.write('\t'.join([k + '.wav', k[0], k[3:], v[0], v[1], v[2], v[3], v[4], v[6], v[7], v[9], v[10], v[12], v[13], t[0], t[1], '%.1f' % ss]) + '\n'); n += 1
print('index.tsv: %d tokens (%s)' % (n, ', '.join('%s=%d talkers' % (g, len(keep[g])) for g in sorted(keep))))
