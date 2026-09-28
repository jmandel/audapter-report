#!/usr/bin/env python3
"""Table of the LPC-check choices over voice-bank sessions (results/<plan>_voices_lpccheck/<talker>/lpccheck/check.json).

  lpc_summary.py RESULTS_DIR [--md OUT.md]

Per session: preset, the rule's choice, the lowest-cost order (no margin), the choice with the relative margin only, the
best order's cost relative to the preset's, its per-token wins, and how many pretest tokens had a usable reference.
"""
import glob, json, os, sys

def main():
    root = sys.argv[1]; md = sys.argv[sys.argv.index('--md') + 1] if '--md' in sys.argv else None
    rows = []
    for f in sorted(glob.glob(os.path.join(root, '*_voices_lpccheck', '*', 'lpccheck', 'check.json'))):
        J = json.load(open(f)); study = f.split(os.sep)[-4].replace('_voices_lpccheck', ''); tk = f.split(os.sep)[-3]
        O = {int(o['order']): o for o in (J['orders'] if isinstance(J['orders'], list) else [J['orders']])}
        b = int(J['chosen_no_margin']); p = int(J['preset'])
        rows.append(dict(study=study, talker=tk, preset=p, chosen=int(J['chosen']), best=b, margin_only=int(J['chosen_margin_only']),
                         rel=O[b]['cost'] / O[p]['cost'] if O[p]['cost'] else float('nan'), wins='%d/%d' % (J['best_wins_tokens'], J['n_tokens']),
                         nA=O[p].get('nA', 0)))
    L = ['| study | talker | preset | chosen (rule) | lowest cost | margin only | best/preset cost | best wins tokens | tokens with reference |',
         '|---|---|---|---|---|---|---|---|---|']
    for r in rows:
        L.append('| %s | %s | %d | %s | %d | %d | %.2f | %s | %d |' % (r['study'], r['talker'], r['preset'], ('**%d**' % r['chosen']) if r['chosen'] != r['preset'] else str(r['chosen']),
                                                                   r['best'], r['margin_only'], r['rel'], r['wins'], r['nA']))
    n = len(rows); d = sum(r['chosen'] != r['preset'] for r in rows); db = sum(r['best'] != r['preset'] for r in rows); dm = sum(r['margin_only'] != r['preset'] for r in rows)
    tal = sorted(set(r['talker'] for r in rows)); dt = [t for t in tal if any(r['chosen'] != r['preset'] for r in rows if r['talker'] == t)]
    L += ['', 'Sessions: %d. Chosen order differs from the preset in %d (%.0f %%); lowest-cost order differs in %d; margin-only choice differs in %d. '
          'Talkers with at least one session off the preset: %d of %d (%s).' % (n, d, 100 * d / max(n, 1), db, dm, len(dt), len(tal), ', '.join(dt) or 'none')]
    out = '\n'.join(L) + '\n'
    if md: open(md, 'w').write(out)
    sys.stdout.write(out)

if __name__ == '__main__':
    main()
