#!/usr/bin/env python3
"""Collect the LPC-check sessions of voice-bank runs into one folder per talker.

  lpc_export.py RUNS_DIR OUT_DIR      e.g. results/coAdapt_voices_lpccheck results/lpccheck

For each RUNS_DIR/<talker>/lpccheck (written by shim/core/lr_lpc_experimenter.m) writes OUT_DIR/<talker>/:
  order<NN>_tracks.png, order<NN>_vowels.png   the tool's two panels at every order (same axis limits)
  audio/<trial>.wav                            the pretest signalIn at the Audapter rate, as it went into the check
  index.json                                   figures, preset and orders only (no scores: for a visual judge)
  check.json                                   everything: preset, chosen order (rule, no margin, margin only), weights,
                                               per-order scores, per-token reference and Audapter tracks, the tool's scatter
"""
import json, os, shutil, sys

src, dst = sys.argv[1], sys.argv[2]
for tk in sorted(os.listdir(src)):
    d = os.path.join(src, tk, 'lpccheck')
    if not os.path.isfile(os.path.join(d, 'check.json')): continue
    o = os.path.join(dst, tk); os.makedirs(os.path.join(o, 'audio'), exist_ok=True)
    for f in os.listdir(d):
        if f.endswith('.png'): shutil.copy(os.path.join(d, f), o)
    for f in os.listdir(os.path.join(d, 'audio')): shutil.copy(os.path.join(d, 'audio', f), os.path.join(o, 'audio'))
    shutil.copy(os.path.join(d, 'index.json'), o)
    J = json.load(open(os.path.join(d, 'check.json')))
    orders = [int(x['order']) for x in J['orders']]
    tl = lambda v: v if isinstance(v, list) else [v]
    toks = []
    for i, t in enumerate(tl(J['tokens'])):
        tr = {str(n): {'F1': tl(J['audapter_tracks'][k][i]['F1']), 'F2': tl(J['audapter_tracks'][k][i]['F2'])} for k, n in enumerate(orders)}
        toks.append({'id': t['id'], 'word': t['word'], 'trial': t['trial'], 'sr': t['sr'], 'frameLen': t['frameLen'], 't0': t['t0'],
                     'vowel_nucleus': t['vowel'], 'reference': {'F1': t['refF1'], 'F2': t['refF2'], 'qc': t['ref_qc']},
                     'praat': {k: tl(t['praat'][k]) for k in ('t', 'F1', 'F2')}, 'audapter': tr,
                     'per_token_cost': {str(n): tl(J['per_token_cost'][k])[i] for k, n in enumerate(orders)},
                     'audio': 'audio/%03d.wav' % t['trial']})
    out = {'talker': J['talker'], 'gender': J['gender'], 'study': J['study'], 'preset': J['preset'], 'chosen': J['chosen'],
           'chosen_no_margin': J['chosen_no_margin'], 'chosen_margin_only': J['chosen_margin_only'], 'differs': bool(J['differs']),
           'best_wins_tokens': J['best_wins_tokens'], 'n_tokens': J['n_tokens'], 'margin_rule': J['margin_rule'], 'weights': J['weights'],
           'orders': {str(x['order']): {k: x[k] for k in ('cost', 'A', 'B', 'C', 'nA')} for x in J['orders']},
           'scatter': {str(n): tl(J['scatter'][k]) for k, n in enumerate(orders)}, 'tokens': toks,
           'voice': 'AI-generated (OpenAI gpt-audio-1.5), see audit/labrun/voices/README.md'}
    json.dump(out, open(os.path.join(o, 'check.json'), 'w'), indent=0)
    print(tk, 'preset', out['preset'], 'chosen', out['chosen'], 'no margin', out['chosen_no_margin'])
