import math
from sketchlib import *

MONO = ' style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px"'

def _quote(s, lines):
    for ln in lines:
        s.parts.append(f'<text class="sk-in" x="{X0}" y="{s.y+12}"{MONO}>{E(ln)}</text>'); s.y += 17
    s.y += 6

def _panel(sid, title, main_label, main_sub, main_ivs, cb_ivs, win, win_text, quote, desc, hot=None):
    s = Sketch(sid, 0, 10, title)
    s.y += 12
    ym = s.intervals(main_label, main_ivs, h=30, sub=main_sub)
    ya = s.intervals("Audio thread", cb_ivs, h=30, sub="callback every 2 ms")
    s.band(win[0], win[1], ym, ya + 30, win_text, ty=ym - 6)
    if hot:
        s.parts.append(f'<text class="sk-note" x="{s.x(hot[0]):.1f}" y="{ya+46}" text-anchor="middle">{E(hot[1])}</text>'); s.y += 12
    s.parts.append(f'<text class="sk-tick" x="{X1}" y="{s.y+8}" text-anchor="end">time (schematic, not to scale) →</text>'); s.y += 16
    _quote(s, quote)
    return s.svg(desc)

def _short(x):
    """Drop build/src/ and C++ argument lists from a sanitizer frame."""
    import re
    return re.sub(r"\([^()]*\)( const)?", "()", x.replace("build/src/", "").replace("audapter::", ""))

def sketch(d, up):
    cbs = lambda hot: [(a, a + 0.55, "", "observed" if a == hot else "expected") for a in (0.2, 2.0, 3.8, 5.6, 7.4, 9.2)]
    a = _panel("sk-live-1--live-2", "LIVE-1: loading a PCF while the callback runs",
               "MATLAB thread", "AudapterIO('pcf')",
               [(0.1, 1.7, "read file", "context"), (1.7, 3.4, "free → NULL", "observed"), (3.4, 6.1, "parse the file", "context"),
                (6.1, 7.6, "calloc(n)", "observed"), (7.6, 9.9, "rest of readPertCfg", "context")],
               cbs(5.6), (2.6, 7.3), "window: pitchShift is NULL but n > 0",
               ["callback in the window: pertCfg.pitchShift[stat] → NULL read → process dies",
                "ASan: " + d["asan_pcf_error"].replace("==1==ERROR: AddressSanitizer: ", "").split(" (pc")[0],
                "      #0 in " + _short(d["asan_pcf_frame"].split(" in ", 1)[-1]),
                "TSan (OST reload): " + _short(d["tsan_ost"])],
               "The MATLAB thread frees the PCF arrays and sets them to NULL, parses, then allocates new ones. A callback that runs in between "
               "reads pitchShift[stat] through a NULL pointer, because pertCfg.n still holds the old state count.", hot=(5.9, "handleBuffer reads pitchShift[stat]"))
    b = _panel("sk-live-2", "LIVE-2: setParam('pitchshiftratio') while the callback runs",
               "MATLAB thread", "setParam('pitchshiftratio')",
               [(0.6, 4.0, "new TimeDomainShifter(…)", "context"), (4.0, 5.5, "delete old", "observed"), (5.5, 9.9, "return to MATLAB", "none")],
               [(0.2, 0.75, "", "expected"), (3.4, 6.2, "processFrame on the old object", "observed"), (7.4, 7.95, "", "expected"), (9.2, 9.75, "", "expected")],
               (4.0, 6.2), "callback reads freed memory",
               ["ASan: heap-use-after-free in " + _short(d["td_read"]),
                "      freed by thread T0 in " + _short(d["td_free"]),
                "also: " + "; ".join(x.split(" in ")[-1].split("(")[0].split("::")[-1] + " (" + x.split(" ")[1].replace("build/src/", "") + ")" for x in d["uaf_summaries"][1:])],
               "setParam('pitchshiftratio') replaces the time-domain shifter object. The old one is deleted while the callback is still inside its processFrame.",
               hot=(4.8, "handleBuffer → timeDomainShifter->processFrame"))
    return a + b + _dots(d)

def _dots(d):
    rows = []
    for op, lab in (("pcf", "PCF reload"), ("ost", "OST reload")):
        for gap in (20, 250):
            rr = [(cr, k) for g, cr, k in d[op]["runs_now"] + d[op]["runs_earlier"] if g == gap]
            rows.append((lab, f"every {gap} ms", rr))
    Wd, top, rh = W, 30, 30
    XR = X1 - 150
    lx = lambda v: X0 + (math.log10(v) - 0) / (math.log10(2000)) * (XR - X0)
    H = top + rh * len(rows) + 64
    p = [f'<text class="sk-note" x="{X0}" y="18">Reloads until the process died, one mark per run (log scale)</text>']
    for g in (1, 10, 100, 1000):
        p.append(f'<line class="sk-grid" x1="{lx(g):.1f}" x2="{lx(g):.1f}" y1="{top}" y2="{top + rh*len(rows)}"/>'
                 f'<text class="sk-tick" x="{lx(g):.1f}" y="{top + rh*len(rows) + 16}" text-anchor="middle">{g}</text>')
    p.append(f'<text class="sk-tick" x="{(X0+XR)/2:.1f}" y="{top + rh*len(rows) + 32}" text-anchor="middle">reloads while audio ran</text>')
    for i, (lab, sub, rr) in enumerate(rows):
        y = top + i * rh + rh / 2
        p.append(f'<text class="sk-lab" x="{LX}" y="{y+1:.1f}" text-anchor="end">{E(lab)}</text><text class="sk-sub" x="{LX}" y="{y+14:.1f}" text-anchor="end">{E(sub)}</text>')
        p.append(f'<line class="sk-grid" x1="{X0}" x2="{XR}" y1="{y:.1f}" y2="{y:.1f}"/>')
        nc = sum(1 for cr, _ in rr if cr); ns = len(rr) - nc
        for j, (cr, k) in enumerate(sorted(rr, key=lambda r: r[1])):
            dy = (-5 if j % 2 else 5) if not cr else 0
            if cr:
                p.append(f'<circle class="sk-dot-a" cx="{lx(k):.1f}" cy="{y:.1f}" r="6"><title>{lab}, {sub}: crashed after {k} reloads</title></circle>')
            else:
                p.append(f'<rect class="sk-expected" x="{lx(k)-5:.1f}" y="{y-5+dy:.1f}" width="10" height="10"><title>{lab}, {sub}: survived {k} reloads (run ended)</title></rect>')
        p.append(f'<text class="sk-in" x="{X1}" y="{y+4:.1f}" text-anchor="end">{nc} of {len(rr)} runs crashed</text>')
    p.append(f'<circle class="sk-dot-a" cx="{X0+8}" cy="{H-8}" r="5"/><text class="sk-in" x="{X0+18}" y="{H-4}">crashed</text>'
             f'<rect class="sk-expected" x="{X0+86}" y="{H-13}" width="10" height="10"/><text class="sk-in" x="{X0+102}" y="{H-4}">run ended without a crash (600 reloads)</text>')
    return (f'<svg class="sketch" id="sk-live-1--live-2-runs" viewBox="0 0 {Wd} {H}" role="img" aria-labelledby="sk-live-1--live-2-runs-t">'
            f'<title id="sk-live-1--live-2-runs-t">PCF: {d["pcf"]["crashes"]} crashes in {d["pcf"]["reloads"]} reloads; OST: {d["ost"]["crashes"]} crashes in {d["ost"]["reloads"]} reloads</title>{"".join(p)}</svg>')

def derive(d, up):
    return {"pcf_crashes": d["pcf"]["crashes"], "pcf_reloads": d["pcf"]["reloads"], "pcf_per": d["pcf"]["per"],
            "ost_crashes": d["ost"]["crashes"], "ost_reloads": d["ost"]["reloads"], "ost_per": d["ost"]["per"],
            "crash_min": min(d["pcf"]["min_at"], d["ost"]["min_at"]), "crash_max": max(d["pcf"]["max_at"], d["ost"]["max_at"])}
