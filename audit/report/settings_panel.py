"""The "Settings used" panel of a card: what the example ran, in full, with a JSON download and a Playground link.

Inputs: data.json["settings"] written by the card's export script (harness/oct/report_settings.m: every parameter that differs
from getAudapterDefaultParams, the OST/PCF text as loaded, the trial sequence and switching method) merged with the card
yaml's `settings:` block (source experiment or "hypothetical design", input credit, notes). Nothing here is typed by hand
except the plain-language glosses, which are generated from the OST/PCF text.
"""
import base64, html, json, math, re
E = html.escape

# MATLAB field (p.<field>) -> Audapter parameter name, from AudapterIO('init') @e1695f1
P2A = {"aFact": "afact", "avgLen": "avglen", "bBypassFmt": "bbypassfmt", "bCepsLift": "bcepslift", "bClampFormants": "bclampformants",
       "bDetect": "bdetect", "bDownSampFilt": "bdownsampfilt", "bFact": "bfact", "bMelShift": "bmelshift", "bPitchShift": "bpitchshift",
       "bRatioShift": "bratioshift", "bRMSClip": "brmsclip", "bShift2D": "bshift2d", "bShift": "bshift", "bTimeDomainShift": "btimedomainshift",
       "bTrack": "btrack", "bWeight": "bweight", "cepsWinWidth": "cepswinwidth", "dFmtsForgFact": "dfmtsff", "downFact": "downfact",
       "dScale": "scale", "F1Max": "f1max", "F1Min": "f1min", "F2Max": "f2max", "F2Min": "f2min", "fb2Gain": "fb2gain", "fb3Gain": "fb3gain",
       "fb4GainDB": "fb4gaindb", "fb": "fb", "frameLen": "framelen", "gainAdapt": "bgainadapt", "LBb": "lbb", "LBk": "lbk",
       "minVowelLen": "minvowellen", "nDelay": "ndelay", "nLPC": "nlpc", "nWin": "nwin", "pitchShiftRatio": "pitchshiftratio",
       "preempFact": "preemp", "pvocFrameLen": "pvocframelen", "pvocHop": "pvochop", "rampLen": "ramplen", "rmsForgFact": "rmsff",
       "rmsRatioThresh": "rmsratio", "rmsThresh": "rmsthr", "sr": "srate", "trialLen": "triallen", "delayFrames": "delayFrames"}

# One-line plain-language meaning of each OST rule, and whether it records its end time (lastStatEnd; OST-F1).
OST_RULE = {
    "ELAPSED_TIME": ("moves on {p1} s after this state began", 1, False),
    "INTENSITY_RISE_HOLD": ("level rises above {p1} (next state) and stays above it for {p2} s", 2, True),
    "INTENSITY_RISE_HOLD_POS_SLOPE": ("level rises above {p1} and keeps rising for {p2} s", 2, True),
    "POS_INTENSITY_SLOPE_STRETCH": ("level keeps rising for more than {p1} frames", 2, True),
    "NEG_INTENSITY_SLOPE_STRETCH_SPAN": ("level keeps falling for more than {p1} frames, by a summed slope beyond {p2}", 2, True),
    "INTENSITY_SLOPE_BELOW_THRESH": ("level slope stays below {p1} for {p2} s", 2, True),
    "INTENSITY_SLOPE_ABOVE_THRESH": ("level slope stays above {p1} for {p2} s", 2, True),
    "INTENSITY_FALL": ("level below {p1} for 10 ms, once more than {p2} s have passed since the last recorded state end", 1, True),
    "INTENSITY_BELOW_THRESH_NEG_SLOPE": ("level below {p1} and falling for {p2} s", 2, True),
    "INTENSITY_RATIO_RISE": ("high-frequency energy ratio rises above {p1} and holds {p2} s", 2, False),
    "INTENSITY_RATIO_FALL_HOLD": ("high-frequency energy ratio falls below {p1} and holds {p2} s", 2, False),
    "INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR": ("high-frequency energy ratio above {p1} (ignored below level 0.0003) for {p2} s", 2, False),
    "INTENSITY_AND_RATIO_ABOVE_THRESH": ("level above {p1} and ratio above {p2} for the hold in field 5 ({p3} s)", 2, True),
    "INTENSITY_AND_RATIO_BELOW_THRESH": ("level below {p1} and ratio below {p2} for the hold in field 5 ({p3} s)", 2, True),
    "OST_END": ("final state", 0, None),
}


def gloss_ost(text):
    out = []
    section = 0
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            out.append((raw, "")); continue
        if line.startswith("rmsSlopeWin"):
            out.append((raw, "window for the level-slope estimate")); continue
        m = re.match(r"n\s*=\s*(\d+)", line)
        if m:
            section += 1
            out.append((raw, f"{m.group(1)} rules follow" if section == 1 else (f"{m.group(1)} maxIOI (timeout) entries" if m.group(1) != "0" else "no maxIOI timeouts")))
            continue
        f = line.split("#")[0].split()
        if section == 1 and len(f) >= 2 and f[1] in OST_RULE:
            txt, span, sets = OST_RULE[f[1]]
            st = int(f[0]); prm = dict(p1=f[2] if len(f) > 2 else "", p2=f[3] if len(f) > 3 else "", p3=f[4] if len(f) > 4 else "")
            if f[1] == "OST_END":
                g = f"state {st}: final state"
            else:
                nxt = st + span
                g = f"state {st} → {nxt}: {txt.format(**prm)}"
                if sets is False:
                    g += "; does not record its end time"
            out.append((raw, g)); continue
        out.append((raw, ""))
    return out


def gloss_pcf(text, units):
    lines = text.splitlines(); out = []; i = 0
    def nxt():
        """Next line with content; blank and comment-only lines pass through (a comment's own text is its gloss)."""
        nonlocal i
        while i < len(lines) and (not lines[i].strip() or lines[i].strip().startswith("#")):
            out.append((lines[i], "")); i += 1
        if i >= len(lines): return None
        l = lines[i]; i += 1; return l.split("#")[0]
    l = nxt()
    if l is None: return out
    nw = int(float(l.split(",")[0])); out.append((l, f"{nw} time-warp section{'s' if nw != 1 else ''}"))
    for _ in range(nw):
        l = nxt(); f = [x.strip() for x in l.split(",")]
        g = f"time warp from {f[0]} s: slow to ×{f[1]} for {f[2]} s, hold {f[3]} s, then ×{f[4]}"
        if len(f) > 5: g = f"time warp from state {f[0]}: slow to ×{f[1]} for {f[2]} s, hold {f[3]} s, then ×{f[4]}"
        if float(f[2]) == 0: g += " (zero length: no audible warp)"
        out.append((l, g))
    l = nxt()
    if l is None: return out
    out.append((l, f"{int(float(l))} state rows: state, pitch (semitones), level (dB), formant shift amount, angle"))
    while True:
        l = nxt()
        if l is None: break
        f = [x.strip() for x in l.split(",")]
        if len(f) < 5: out.append((l, "")); continue
        st, pitch, db, amp, phi = f[:5]
        parts = []
        if float(pitch): parts.append(f"pitch {float(pitch):+g} st")
        if float(db): parts.append(f"level {float(db):+g} dB")
        if float(amp):
            a, ph = float(amp), float(phi)
            if units == "ratio":
                parts.append(f"formants ×{1 + a:g}" + (f" at angle {ph:g} rad" if ph else " (F1)"))
            else:
                u = "mel" if units == "mel" else "Hz"
                dirn = "F1 up" if ph == 0 else ("F1 down" if abs(ph - math.pi) < 1e-3 else f"angle {ph:g} rad")
                parts.append(f"formant shift {a:g} {u}, {dirn}")
        out.append((l, f"state {st}: " + (", ".join(parts) if parts else "no change")))
    return out


def _code(title, rows):
    body = "".join(f'<span class="ln"><span class="sc">{E(c) or " "}</span><span class="sg">{E(g)}</span></span>' for c, g in rows)
    return f'<figure class="setcode"><figcaption>{E(title)}</figcaption><pre><code>{body}</code></pre></figure>'


def _fmt(v):
    if isinstance(v, float):
        return f"{v:.6g}"
    if isinstance(v, list):
        return "[" + ", ".join(_fmt(x) for x in v) + "]"
    return str(v)


def units_of(params):
    """Formant-shift units: bRatioShift defaults to 1 in getAudapterDefaultParams, so it appears in the diff only when 0."""
    if params.get("bRatioShift", 1) == 0:
        return "mel" if params.get("bMelShift", 0) == 1 else "hz"
    return "ratio"


def playground(S):
    """A Playground settings object (audit/playground src/shared/settings-core.js) from the same settings the export used,
    and the list of things it cannot express."""
    prm = S.get("params", {}); left = []
    raw = {}
    for k, v in prm.items():
        a = P2A.get(k)
        if a and isinstance(v, (int, float)) and not isinstance(v, bool):
            raw[a] = v
    units = units_of(prm)
    o = {"v": 1, "preset": S.get("preset", "female"), "build": "lite", "raw": raw,
         "shift": {"formant": {"on": False}, "pitch": {"on": False}}, "when": {"mode": "always"}, "hear": {"fb": int(prm.get("fb", 1))}}
    if prm.get("bShift") == 1:
        f = {"on": True, "units": {"ratio": "pct", "mel": "mel", "hz": "hz"}[units], "f1": 0, "f2": 0, "field": "all"}
        fld = S.get("field")
        if fld:
            f.update(f1=fld.get("f1", 0), f2=fld.get("f2", 0))
        o["shift"]["formant"] = f
    if prm.get("bPitchShift") == 1:
        st = 12 * math.log2(float(prm.get("pitchShiftRatio", 1) or 1))
        o["shift"]["pitch"] = {"on": True, "method": "pvoc", "semitones": round(st, 3)}
    drop = S.get("pg_drop") or []
    if (S.get("ost") or S.get("pcf")) and not ("ost" in drop and "pcf" in drop):
        o["when"] = {"mode": "custom", "ost": S.get("ost", ""), "pcf": S.get("pcf", "")}
    fb = o["hear"]["fb"]
    if fb in (2, 3, 4, 5):
        g = prm.get({2: "fb2Gain", 3: "fb3Gain"}.get(fb, ""), 1)
        o["hear"]["noise"] = {"type": "pink", "seconds": 10, "level": -20, "gain": g}
        left.append("the masking noise: the Playground plays its own generated pink noise, not the lab's babble file")
    if S.get("sequence") and len(S["sequence"]) > 1:
        left.append("the trial sequence: the link loads one trial's settings; run several trials as one session in the Playground to see carry-over")
    if S.get("pcf_catch"):
        left.append("the catch-trial PCF (shown above)")
    for k in S.get("setparam", {}):
        if k.lower() not in ("datapb",):
            left.append(f"the setParam value {k}")
    left += S.get("playground_left_out", [])
    return o, left


def link(obj):
    j = json.dumps(obj, separators=(",", ":"))
    return "playground/#s=" + base64.urlsafe_b64encode(j.encode()).decode().rstrip("=")


def _flat(S):
    """Octave's jsonencode of a cell passed as {c} gives [[...]]: flatten one level."""
    for k in ("sequence", "pg_drop"):
        v = S.get(k)
        if isinstance(v, list) and len(v) == 1 and isinstance(v[0], list):
            S[k] = v[0]
    return S


_CASES = None


def cases():
    """The Playground's test cases (audit/playground/cases.json, generated by the Playground build from the captured export
    command streams): card id -> {available, title, why}."""
    global _CASES
    if _CASES is None:
        import os
        f = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "playground", "cases.json")
        _CASES = {c["id"]: c for c in json.load(open(f))["cases"]} if os.path.exists(f) else {}
    return _CASES


def case_of(card):
    return cases().get(card["id"].split(" ")[0])


def panel_html(card, S, asset_rel):
    S = _flat(S)
    y = card.get("settings", {})
    prm = S.get("params", {})
    units = units_of(prm)
    seq = S.get("sequence") or []
    summ = []
    src = y.get("source") or "hypothetical design"
    summ.append(f'<dt>Source</dt><dd>{y.get("source_html", E(src))}</dd>')
    inp = y.get("input") or S.get("input", "")
    if inp: summ.append(f'<dt>Input</dt><dd>{E(inp)}</dd>')
    if seq: summ.append(f'<dt>Trials</dt><dd>{E(", ".join(seq))}</dd>')
    sw = y.get("switching") or S.get("switching", "")
    if sw: summ.append(f'<dt>Between trials</dt><dd>{E(sw)}</dd>')
    key = [f"{k} {_fmt(v)}" for k, v in prm.items() if k in y.get("key_params", [])]
    if key: summ.append(f'<dt>Key parameters</dt><dd><code>{E(", ".join(key))}</code></dd>')
    b = S.get("build", "shipped")
    summ.append(f'<dt>Build</dt><dd>{E(y.get("build", "blab-lab audapter_mex as shipped (@169cadf)" if b == "shipped" else b))}</dd>')
    rows = "".join(f'<tr><th scope="row"><code>p.{E(k)}</code></th><td><code>{E(_fmt(v))}</code></td></tr>' for k, v in prm.items())
    sp = "".join(f'<tr><th scope="row"><code>{E(k)}</code></th><td>{E(_fmt(v))}</td></tr>' for k, v in S.get("setparam", {}).items())
    det = [f'<p class="setnote">Parameters passed to <code>AudapterIO(\'init\', p)</code> that differ from <code>getAudapterDefaultParams(\'{E(S.get("preset", "female"))}\')</code>:</p>'
           f'<table class="plain settab"><tbody>{rows or "<tr><td>none</td></tr>"}</tbody></table>']
    if sp:
        det.append(f'<p class="setnote">Sent with <code>Audapter(\'setParam\', …)</code>:</p><table class="plain settab"><tbody>{sp}</tbody></table>')
    for k, title in (("ost", "OST file"), ("ost_safe", "OST file, safe variant"), ("pcf", "PCF file"), ("pcf_catch", "PCF file on catch trials"), ("pcf_control", "PCF file on control trials")):
        t = S.get(k)
        if t:
            det.append(_code(title, gloss_ost(t) if k.startswith("ost") else gloss_pcf(t, units)))
    for extra in y.get("details", []):
        det.append(f'<p class="setnote">{extra}</p>')
    pg, left = playground(S)
    if y.get("playground") is False:
        pgl = f'<span class="setnote">Settings link not available: {E(y.get("playground_why", ""))}</span>'
    else:
        pgl = (f'<a href="{link(pg)}">Open these settings in the Playground</a>'
               + (f' <span class="setnote">(left out: {E("; ".join(left))})</span>' if left else ""))
    c = case_of(card)
    if c and c.get("available"):
        # the whole example as a replayable test case: the exact trial sequence, switching, inputs, build and expected run
        pgl = (f'<a href="playground/#case={E(c["id"])}"><strong>Open this test case in the Playground</strong></a> '
               f'<span class="setnote">(replays the exact trial sequence and compares with this card)</span> · ' + pgl)
    elif c:
        pgl += f' · <span class="setnote">Not replayable as a test case: {E(c.get("why", ""))}</span>' 
    return (f'<section class="settings" aria-label="Settings used"><h4>Settings used</h4><dl class="setsum">{"".join(summ)}</dl>'
            f'<details class="setdet"><summary>All settings: parameters, OST and PCF, each line explained</summary>{"".join(det)}</details>'
            f'<p class="setlinks"><a href="{asset_rel}/settings.json" download>Download settings (JSON)</a> · {pgl}</p></section>')


def settings_json(card, S):
    S = _flat(S)
    y = card.get("settings", {})
    pg, left = playground(S)
    return {"card": card["id"], "source": y.get("source", "hypothetical design"), **{k: v for k, v in S.items()},
            "playground": pg, "playground_left_out": left}
