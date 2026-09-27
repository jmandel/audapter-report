from sketchlib import *

CLS = {1: "700 Hz, as passed", 2: "1500 Hz (clamp_f2's values)", 3: "below 1 Hz (heap value)", 4: "above 8 kHz or not finite", 5: "other heap value (differs between runs)"}

def _ivs(t, cls, kind_ok, T1):
    out, a, cur = [], t[0], cls[0]
    for tt, c in zip(t, cls):
        if c != cur:
            out.append((a, tt, CLS[cur], kind_ok if cur == 1 else "observed")); a, cur = tt, c
    out.append((a, T1, CLS[cur], kind_ok if cur == 1 else "observed"))
    return out

def sketch(d, up):
    n, N, c = d["n_passed"], d["n_read"], d["cases"]
    short = c[1]
    s = Sketch("sk-fmt-f1", 0, N, "Array extent: what MATLAB passes for clamp_f1 and what Audapter copies")
    y0 = s.intervals("MATLAB array", [(0, n, "", "expected")], h=26, sub=f"clamp_f1, 1×{n}")
    s.gap(14)
    y1 = s.intervals("Audapter copies", [(0, N, f"{N} values (maxNClampFrames), whatever the length", "observed")], h=26, sub="setGetParam, len = 2048")
    s.band(n, N, y1, y1 + 26, f"{N - n} values read past the end of the {n * 8}-byte array", anchor="middle", ty=y1 - 6)
    s.parts.append(f'<text class="sk-note" x="{s.x(n) + 6:.1f}" y="{y0 + 17}">← allocated: {n} values ({n * 8} bytes)</text>')
    z = short["first_zero"]
    y2 = s.intervals("Clamp trajectory", [(0, n, "", "observed"), (n, z, "", "observed")], h=26, sub="what the clamp walks")
    s.band(n, z, y2, y2 + 26, "")
    s.parts.append(f'<text class="sk-note" x="{s.x(z) + 6:.1f}" y="{y2 + 17}">first zero at element {z}: the clamp then holds element {z - 1} ({short["stuck_value"]} Hz in this run)</text>')
    s.axis([0, n, 512, 1024, 1536, 2048], "{:g}")
    main = s.svg(f"MATLAB passes {n} values; Audapter copies {N}, reading {N - n} past the end of the array. The clamp advances "
                 f"through the passed values into heap contents until it meets a zero at element {z}, then holds element {z - 1}.")
    t, T1 = d["t"], d["trial_s"]
    s2 = Sketch("sk-fmt-f1-trial", 0, T1, "Logged sF1 during the trial: clamp padded to 2048 vs the same 100 values unpadded")
    s2.envelope("Input", t, db(d["rms_in"]), -60, -10, h=30, sub="/a/, 0.6 s")
    s2.intervals("sF1 logged", _ivs(t, c[0]["sF1_class"], "expected", T1), h=26, sub="padded (control)")
    yb = s2.intervals("sF1 logged", _ivs(t, short["sF1_class"], "expected", T1), h=26, sub=f"{n} values")
    if short["first_bad_s"] >= 0:
        s2.band(short["first_bad_s"], T1, yb, yb + 26, "")
    s2.axis([0, 0.2, 0.4, 0.6, 0.8])
    trial = s2.svg(f"With the padded array the logged sF1 is 700 Hz throughout. With the {n}-value array it is 700 Hz for {short['n_700']} frames, "
                   f"then {short['n_tiny']} frames below 1 Hz; the output peaks at {short['out_max']:.0f} (control {c[0]['out_max']:.3f}).")
    return main + trial


def derive(d, up):
    c, h = d["cases"], d["history"]
    h = h if isinstance(h, list) else [h]
    om = [x["out_max"] for x in h]
    return {"ctl_out_max": c[0]["out_max"], "short_out_max": c[1]["out_max"], "short_n_700": c[1]["n_700"], "short_n_tiny": c[1]["n_tiny"],
            "short_n_huge": c[1]["n_huge"], "short_n_1500": c[1]["n_1500"],
            "first_zero": c[1]["first_zero"], "held": c[1]["first_zero"] - 1, "stuck": c[1]["stuck_value"], "n_beyond": c[1]["n_nonzero_beyond"],
            "gain_db": 20 * __import__("math").log10(c[1]["out_max"] / c[0]["out_max"]),
            "hist_n": len(h), "hist_min": min(om), "hist_max": max(om),
            "hist_fz": ", ".join(sorted({str(x["first_zero"]) for x in h})),
            "up_pert_nonzero": up["pert_amp_nonzero_beyond"] if up else "not run", "n_past": d["n_read"] - d["n_passed"],
            "ctl_n": c[0]["n_700"], "n_passed_t": d["n_passed"], "n_read_t": d["n_read"]}
