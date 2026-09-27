from sketchlib import *


def _runs(t, v):
    """Contiguous runs of non-None values -> [(i0, i1)] (inclusive indices)."""
    out, a = [], None
    for i, x in enumerate(v):
        if x is not None and a is None: a = i
        if x is None and a is not None: out.append((a, i - 1)); a = None
    if a is not None: out.append((a, len(v) - 1))
    return out


def sketch(d, up):
    dt = d["env_dt"]; n = len(d["env_in"]); t = [i * dt + dt / 2 for i in range(n)]
    ds, clg = d["dScale"], d["closedLoopGain_db"]
    s = Sketch("sk-i-02", 0, n * dt, "fb 5: level of the speech-modulated component relative to the constant component, at two closedLoopGain settings")
    s.envelope("Input", t, d["env_in"], -60, -5, h=30, sub="three vowels")
    lo, hi = -12, 12
    # drop the first 3 blocks (60 ms) of each vowel: rms_fb is still rising there and the ratio is tens of dB below the plot
    keep = [False] * n
    for a, b in _runs(t, d["ratio_ref"]):
        for i in range(a + 3, b + 1): keep[i] = True
    msk = lambda v: [x if k else None for x, k in zip(v, keep)]
    for tag, i, lab in (("A", 1, "−"), ("B", 2, "+")):
        ref, obs = msk(d["ratio_ref"]), msk(d["ratio_" + tag])
        y, sy = s.lines(f"Mix at {clg[i-1]} dB", [(t, ref, "expected"), (t, obs, "observed")], lo, hi, [-6, 0, 6], " dB", h=96,
                        sub=f"dScale {ds[i]:.3f}")
        shift = d[f"shift_{tag}_db"]
        for k, (a, b) in enumerate(_runs(t, ref)):
            me = sum(ref[a:b+1]) / (b - a + 1); mo = sum(obs[a:b+1]) / (b - a + 1)
            s.band(t[a] - dt / 2, t[b] + dt / 2, min(sy(me), sy(mo)), max(sy(me), sy(mo)), "")
        s.lane([(0, f"{shift:+.1f} dB off the intended mix (thin line: the same run at dScale 1, where scaling once or twice is the same)", "start")])
    s.axis([0, 1, 2, 3, 4])
    main = s.svg(f"With the same input and parameters, the speech-modulated component sits {d['shift_A_db']:+.1f} dB off the intended mix at "
                 f"closedLoopGain {clg[0]} dB and {d['shift_B_db']:+.1f} dB off at {clg[1]} dB: the mix moves by {d['shift_AB_db']:.1f} dB.")
    return main


def derive(d, up):
    return {"dsA": d["dScale"][1], "dsB": d["dScale"][2], "clgA": d["closedLoopGain_db"][0], "clgB": d["closedLoopGain_db"][1]}


def derive_real(rd):
    c = rd["dScale_conditions"]; ref = c[0]["speech_minus_playback_db"]
    return {"d_lo": c[1]["speech_minus_playback_db"] - ref, "d_hi": c[2]["speech_minus_playback_db"] - ref,
            "ds_lo": c[1]["dScale"], "ds_hi": c[2]["dScale"]}
