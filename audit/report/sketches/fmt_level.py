"""Formant shifts change the output level (report_loudcues.m): per perturbation, the A-weighted level (dBA) of the shifted output
re the unshifted output of the same input over the perturbed span, one dot per voice; solid = bGainAdapt 0 (as blab runs),
hollow = 1. derive() also reads the loudness model (loudness.json) and the lab-script runs with the eight AI-generated voices
(labrun/results/{coAdapt,attentionComp}_voices_lpccheck/*/summary.tsv, column gain_dBA)."""
import csv, glob, html, json, math, os, statistics as st
import sketchlib as SL
E = html.escape
PERTS = ["F1 +125 mel", "F1 -125 mel", "F1 +20 %", "F1 -20 %", "2-D centralization, strength 0.5"]


def rows(d):
    R = d["rows"] if isinstance(d["rows"], list) else [d["rows"]]
    return [r for r in R if r["level_dba"] is not None and r["level_dba"] == r["level_dba"]]


def sketch(d, up):
    R = rows(d); W = 480 if SL.NARROW else 960; X0 = 8 if SL.NARROW else 250; X1 = W - (16 if SL.NARROW else 150)
    lo, hi = -12, 10; x = lambda v: X0 + (min(max(v, lo), hi) - lo) / (hi - lo) * (X1 - X0)
    out, y = [], 8
    out.append(f'<rect class="sk-jnd" x="{x(-1):.1f}" y="{y}" width="{x(1) - x(-1):.1f}" height="{len(PERTS) * (64 if SL.NARROW else 44)}"/>')
    for p in PERTS:
        g0 = [r["level_dba"] for r in R if r["pert"] == p and r["gainadapt"] == 0]; g1 = [r["level_dba"] for r in R if r["pert"] == p and r["gainadapt"] == 1]
        if SL.NARROW:
            out.append(f'<text class="sk-lab" x="{X0}" y="{y + 14}">{E(p.replace(" -", " −"))}</text>'); y += 20
        else:
            out.append(f'<text class="sk-lab" x="{X0 - 10}" y="{y + 22}" text-anchor="end">{E(p.replace(" -", " −"))}</text>')
        for v in g1:
            out.append(f'<circle class="sk-dot-g1" cx="{x(v):.1f}" cy="{y + 12}" r="4.5"><title>bGainAdapt 1: {v:+.1f} dBA</title></circle>')
        for v in g0:
            out.append(f'<circle class="sk-dot-g0" cx="{x(v):.1f}" cy="{y + 28}" r="4.5"><title>bGainAdapt 0: {v:+.1f} dBA</title></circle>')
        if g0:
            if SL.NARROW:
                out.append(f'<text class="sk-val" x="{X1}" y="{y - 6}" text-anchor="end">{min(g0):+.1f} to {max(g0):+.1f} dBA</text>')
            else:
                out.append(f'<text class="sk-val" x="{W - 4}" y="{y + 32}" text-anchor="end">{min(g0):+.1f} to {max(g0):+.1f} dBA</text>')
        y += 40 if not SL.NARROW else 44
    out.append(f'<line class="sk-axis" x1="{x(0):.1f}" x2="{x(0):.1f}" y1="4" y2="{y}"/>')
    for t in (-12, -8, -4, 0, 4, 8):
        out.append(f'<text class="sk-tick" x="{x(t):.1f}" y="{y + 16}" text-anchor="middle">{t:+d}</text>')
    out.append(f'<text class="sk-axlab" x="{X1}" y="{y + 32}" text-anchor="end">heard level vs unshifted, dBA (grey band: ±1 dB)</text>')
    y += 38
    out.append(f'<circle class="sk-dot-g0" cx="{X0 + 6}" cy="{y + 6}" r="4.5"/><text class="sk-in" x="{X0 + 16}" y="{y + 10}">bGainAdapt 0 (as blab runs)</text>'
               f'<circle class="sk-dot-g1" cx="{X0 + (200 if not SL.NARROW else 6)}" cy="{y + 6 + (0 if not SL.NARROW else 18)}" r="4.5"/>'
               f'<text class="sk-in" x="{X0 + (210 if not SL.NARROW else 16)}" y="{y + 10 + (0 if not SL.NARROW else 18)}">bGainAdapt 1 (C++ default)</text>')
    y += 20 + (18 if SL.NARROW else 0)
    sfx = "-n" if SL.NARROW else ""
    return (f'<svg class="sketch sk-{SL.LAYOUT}" id="sk-fmt-level{sfx}" viewBox="0 0 {W} {y}" role="img" aria-label="A-weighted level change caused by '
            f'formant shifts on eight real voices, with gain adaptation off and on">{"".join(out)}</svg>')


def _labrun(d):
    """Heard level re input (gain_dBA, and gain_dB for evidence) per voice in the lab's own coAdapt and attentionComp scripts."""
    base = os.path.normpath(os.path.join(d["_dir"], "..", "..", "..", "..", "..", "labrun", "results"))
    def per_voice(plan, key, cond=None, col="gain_dBA"):
        out = {}
        for f in sorted(glob.glob(os.path.join(base, plan, "*", "summary.tsv"))):
            D = {}
            for r in csv.DictReader(open(f), delimiter="\t"):
                if r["mode"] != "proc" or (cond and r["cond"] != cond) or not r.get(col):
                    continue
                D.setdefault(r[key], []).append(float(r[col]))
            out[os.path.basename(os.path.dirname(f))] = {k: st.median(x) for k, x in D.items()}
        return out
    v = {}
    for col, sfx in (("gain_dBA", ""), ("gain_dB", "_rms")):
        co = per_voice("coAdapt_voices_lpccheck", "word", "hold", col); at = per_voice("attentionComp_voices_lpccheck", "cond", None, col)
        if not co or not at:
            raise ValueError("labrun results for coAdapt/attentionComp (summary.tsv with gain_dBA) not found under " + base)
        bed, head, ted = ([x[w] for x in co.values()] for w in ("bed", "head", "ted")); gap = [x["ted"] - x["bed"] for x in co.values()]
        v.update({f"co_bed_lo{sfx}": min(bed), f"co_bed_hi{sfx}": max(bed), f"co_head{sfx}": st.median(head), f"co_ted_lo{sfx}": min(ted), f"co_ted_hi{sfx}": max(ted),
                  f"co_gap_lo{sfx}": min(gap), f"co_gap_hi{sfx}": max(gap), f"co_gap_med{sfx}": st.median(gap), f"co_n{sfx}": len(co)})
        ns, ae, ih = ([x[c] for x in at.values()] for c in ("noShift", "shiftAE", "shiftIH"))
        ihg = [x["shiftIH"] - x["noShift"] for x in at.values()]; aeg = [x["shiftAE"] - x["noShift"] for x in at.values()]
        v.update({f"at_ns{sfx}": st.median(ns), f"at_ae_lo{sfx}": min(ae), f"at_ae_hi{sfx}": max(ae), f"at_ih_lo{sfx}": min(ih), f"at_ih_hi{sfx}": max(ih),
                  f"at_ihg_lo{sfx}": min(ihg), f"at_ihg_hi{sfx}": max(ihg), f"at_aeg_lo{sfx}": min(aeg), f"at_aeg_hi{sfx}": max(aeg),
                  f"at_n{sfx}": len(at)})
    return v


def _loud(d):
    """Loudness-level ranges (phon, ISO 532-1, 60-85 dB SPL) of the two ARCTIC voices whose clips the card plays."""
    L = json.load(open(os.path.join(d["_dir"], "..", "loudness.json")))["pairs"]; v = {}
    for key, nm in (("dn125", "F1 -125 mel"), ("up125", "F1 +125 mel")):
        for g in (0, 1):
            P = [L[f"FMT level {spk} {nm} bGainAdapt {g}"] for spk in ("bdl_a0005", "clb_a0030") if f"FMT level {spk} {nm} bGainAdapt {g}" in L]
            if P:
                v[f"ph_{key}_g{g}_lo"] = min(p["dphon_min"] for p in P); v[f"ph_{key}_g{g}_hi"] = max(p["dphon_max"] for p in P)
    return v


def derive(d, up):
    R = rows(d); v = {}
    for p, key in zip(PERTS, ("up125", "dn125", "up20", "dn20", "c2d")):
        for g in (0, 1):
            for col, sfx in (("level_dba", ""), ("level_db", "_rms")):
                L = [r[col] for r in R if r["pert"] == p and r["gainadapt"] == g]
                if L:
                    v[f"{key}_g{g}_min{sfx}"], v[f"{key}_g{g}_max{sfx}"], v[f"{key}_g{g}_med{sfx}"] = min(L), max(L), st.median(L)
    v["n_voices"] = len({r["clip"] for r in R}); G = d["gainstate"]; v["gs_n"] = G["n_diff"]
    ex = [r for r in R if r["clip"] == "arctic_bdl_a0005" and r["gainadapt"] == 0]
    for r in ex:
        k = {"F1 +125 mel": "up125", "F1 -125 mel": "dn125", "F1 +20 %": "up20", "F1 -20 %": "dn20"}.get(r["pert"], "c2d")
        v["bdl_" + k] = r["level_dba"]; v["bdl_" + k + "_rms"] = r["level_db"]
    g1r = [abs(r["level_db"]) for r in R if r["gainadapt"] == 1 and r["pert"] in ("F1 +125 mel", "F1 -125 mel")]
    v["g1_rms_n2"] = sum(1 for x in g1r if x <= 2.5); v["g1_rms_n"] = len(g1r)
    v.update(_labrun(d)); v.update(_loud(d))
    return {k: (0.0 if isinstance(x, float) and -0.05 < x < 0 else x) for k, x in v.items()}   # no "-0.0" in the prose
