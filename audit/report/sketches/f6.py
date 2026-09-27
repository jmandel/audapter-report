from sketchlib import *

def _segs(x, k):
    return rows2(x[k]) if x else []

def sketch(d, up):
    t, T1 = d["t"], 1.3
    s = Sketch("sk-f6", 0, T1, "Field perturbation (F1 +20 % while F1 is at least 600 Hz): upstream 2.1.5 vs blab, on two inputs")
    s.envelope("Input 1", t, db(d["rms_glide"]), -60, -10, h=34, sub="/a/ → /i/ → /a/", marks=[(0.13, "/a/"), (0.56, "/i/"), (1.0, "/a/")])
    yl, sy = s.lines("F1 tracked", [(t, [v if v > 0 else None for v in d["F1_glide"]], "observed")], 200, 1000, [400, 800], " Hz", h=86,
                     sub="field: F1 ≥ 600 Hz")
    s.parts.append(f'<line class="sk-guide" x1="{X0}" x2="{X1}" y1="{sy(d["F1Min"]):.1f}" y2="{sy(d["F1Min"]):.1f}"/>'
                   f'<text class="sk-tick" x="{X0+4}" y="{sy(d["F1Min"])-3:.1f}">field edge {d["F1Min"]:g} Hz</text>')
    ug = [(a, b, "F1 +20 %", "expected") for a, b in _segs(up, "glide_segments")]
    bg = [(a, b, "F1 +20 %", "observed") for a, b in _segs(d, "glide_segments")]
    yu = s.intervals("Shift applied", ug, h=26, sub="upstream 2.1.5")
    yb = s.intervals("Shift applied", bg, h=26, sub="blab")
    for a, b in _segs(d, "glide_segments")[1:]:
        s.band(a, b, yu, yb + 26, "blab only: re-armed when F1 re-entered the field", anchor="end", ty=yu + 17)
    s.gap(22)
    s.envelope("Input 2", t, db(d["rms_dip"]), -60, -10, h=34, sub="/a/, 40 ms F1 dip",
               marks=[(0.13, "/a/, F1 760 Hz"), (d["dip_center_s"] - 0.02, "F1 dips to 520 Hz")])
    ud = [(a, b, "F1 +20 %", "expected") for a, b in _segs(up, "dip_segments")]
    bd = [(a, b, "F1 +20 %", "observed") for a, b in _segs(d, "dip_segments")]
    yu2 = s.intervals("Shift applied", ud, h=26, sub="upstream 2.1.5")
    yb2 = s.intervals("Shift applied", bd, h=26, sub="blab")
    if ud and len(bd) > 1:
        a, b = bd[1][0], bd[-1][1]
        s.band(a, b, yu2, yb2 + 26, "upstream: off for the rest of the trial (the dropout blab fixed)", anchor="start", ty=yu2 + 17)
    s.axis([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2])
    g, gu = _segs(d, "glide_segments"), _segs(up, "glide_segments")
    return s.svg("On the /a/-/i/-/a/ glide, upstream shifts F1 only in the first /a/ (%.2f-%.2f s); blab also shifts the final /a/ (%.2f-%.2f s). "
                 "With a brief F1 dip out of the field, upstream stops shifting for the rest of the trial and blab resumes after the dip."
                 % (gu[0][0], gu[0][1], g[-1][0], g[-1][1]))


def derive(d, up):
    fmt = lambda g: ", ".join(f"{a:.2f}–{b:.2f} s" for a, b in g) if g else "none"
    g, dp = _segs(d, "glide_segments"), _segs(d, "dip_segments")
    ug, ud = _segs(up, "glide_segments"), _segs(up, "dip_segments")
    return {"glide_text": fmt(g), "up_glide_text": fmt(ug), "dip_text": fmt(dp), "up_dip_text": fmt(ud),
            "re_on": g[-1][0], "re_off": g[-1][1], "first_on": g[0][0], "first_off": g[0][1],
            "up_dip_off": ud[0][1] if ud else float("nan"), "dip_resume": dp[1][0] if len(dp) > 1 else float("nan"),
            "up_last_a_out": up["glide_last_a_F1_out_hz"] if up else float("nan"),
            "up_dip_after_out": up["dip_after_F1_out_hz"] if up else float("nan"),
            "mvl_text": " / ".join(str(v) for v in d["mvl_values"]),
            "mvl_same": "identical output on both builds" if d["mvl_all_identical"] and up and up["mvl_all_identical"] else "differs"}


def derive_real(rd):
    s = rd["corpus_sweep"]
    b = [c for c in rd["clips"] if c["clip"] == "arctic_bdl_a0030"][0]
    return {"n": s["clips"], "n_diff": s["clips_differing"], "fr_up": s["shifted_frames_upstream"], "fr_blab": s["shifted_frames_blab"],
            "ratio": s["shifted_frames_blab"] / s["shifted_frames_upstream"], "n_seg": len(b["segments"]),
            "seg_total": sum(e - a for a, e in b["segments"]), "last_s": b["last_s"]}
