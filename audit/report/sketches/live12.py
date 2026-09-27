import math
from sketchlib import *

MONO = ' style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px"'

def _quote(lines):
    return '<pre class="skq"><code>' + "\n".join(E(l) for l in lines) + '</code></pre>'

def _panel(sid, title, main_label, main_sub, main_ivs, cb_ivs, win, win_text, quote, desc, hot=None):
    s = Sketch(sid + ("" if not NARROW else ""), 0, 10, title)
    s.header(title)
    s.lane([(win[0], win_text, "start")])
    ym = s.intervals(main_label, main_ivs, h=30, sub=main_sub)
    ya = s.intervals("Audio thread", cb_ivs, h=30, sub="callback every 2 ms")
    s.band(win[0], win[1], ym, ya + 30, "")
    if hot:
        s.lane([(hot[0], hot[1], "end" if hot[0] > 5 else "start")])
    s.parts.append(f'<text class="sk-axlab" x="{X1}" y="{s.y+8}" text-anchor="end">time within one call (schematic, not to scale) →</text>'); s.y += 16
    return s.svg(desc) + _quote(quote)

def _short(x):
    """Drop build/src/ and C++ argument lists from a sanitizer frame."""
    import re
    return re.sub(r"\([^()]*\)( const)?", "()", x.replace("build/src/", "").replace("audapter::", ""))

def sketch(d, up):
    cbs = lambda hot: [(a, a + 0.55, "", "observed" if a == hot else "expected") for a in (0.2, 2.0, 3.8, 5.6, 7.4, 9.2)]
    a = _panel("sk-live-1--live-2", "Loading a PCF while the audio callback runs",
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
    b = _panel("sk-live-2", "setParam('pitchshiftratio') while the audio callback runs",
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
            rows.append((lab, gap, rr))
    s = Sketch("sk-live-1--live-2-runs", 0, math.log10(2000), "Reloads until the process died, one mark per run")
    s.header("Reloads until the process died, one mark per run")
    for lab, gap, rr in rows:
        nc = sum(1 for cr, _ in rr if cr)
        y = s._row(); h = 26
        s.label(y, h, lab, f"{gap} ms apart: {nc}/{len(rr)} crashed"); s.frame(y, h)
        for j, (cr, k) in enumerate(sorted(rr, key=lambda r: r[1])):
            x = s.x(math.log10(max(k, 1)))
            if cr:
                s.parts.append(f'<circle class="sk-dot-a" cx="{x:.1f}" cy="{y + h/2:.1f}" r="6"><title>{lab}, every {gap} ms: crashed after {k} reloads</title></circle>')
            else:
                s.parts.append(f'<rect class="sk-expected" x="{x-5:.1f}" y="{y + h/2 - 5:.1f}" width="10" height="10"><title>{lab}, every {gap} ms: run ended after {k} reloads without a crash</title></rect>')
        s.y += h + 8
    s.lane([(0, "dot: the run crashed after this many reloads; square: the run ended (600 reloads) without a crash", "start")])
    s.axis([0, 1, 2, 3], label="reloads while audio ran (log scale)", tickfmt=lambda v: f"{10 ** v:g}")
    return s.svg(f'PCF: {d["pcf"]["crashes"]} crashes in {d["pcf"]["reloads"]} reloads; OST: {d["ost"]["crashes"]} crashes in {d["ost"]["reloads"]} reloads')


def derive(d, up):
    return {"pcf_crashes": d["pcf"]["crashes"], "pcf_reloads": d["pcf"]["reloads"], "pcf_per": d["pcf"]["per"],
            "ost_crashes": d["ost"]["crashes"], "ost_reloads": d["ost"]["reloads"], "ost_per": d["ost"]["per"],
            "crash_min": min(d["pcf"]["min_at"], d["ost"]["min_at"]), "crash_max": max(d["pcf"]["max_at"], d["ost"]["max_at"])}
