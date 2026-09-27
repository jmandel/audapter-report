from sketchlib import *

def sketch(d, up):
    dt = d["dt"]; n = len(d["level_step"]); t = [i * dt + dt / 2 for i in range(n)]
    lat = d["latency_s"]
    keep = [0.14 <= tt <= 1.26 for tt in t]
    msk = lambda v: [vv if k else None for vv, k in zip(v, keep)]
    s = Sketch("sk-pt-5", 0, 1.4, "Output level and F0 across a 0 to +2 semitone pitch-shift onset")
    s.envelope("Input", t, [None if not k else 0 for k in keep], -1, 1, h=18, sub="/a/, F0 120 Hz")
    on = d["ost_onset_s"]
    s.intervals("OST state", [(0, on, "state 0: 0 st", "context"), (on, 1.4, "state 1: +2 st", "context")], h=22)
    f_in = d["f0_in"]
    exp_f0 = [f_in if tt < on + lat else f_in * 2 ** (2 / 12) for tt in t]
    y1, sy1 = s.lines("F0 (Hz)", [(t, msk(exp_f0), "expected"), (t, msk(d["f0_out"]), "observed")], 110, 145, [120, 135], "", h=60)
    s.lane([(on, f"F0 step: {1200*__import__('math').log2(d['f0_after']/f_in):.0f} cents, as commanded", "start")])
    rel = [None if a is None or b is None else a - b for a, b in zip(d["level_step"], d["level_bypass"])]
    y2, sy2 = s.lines("Output level", [(t, msk([0.0] * n), "expected"), (t, msk(rel), "observed")],
                      -1.5, 5.5, [0, 2, 4], " dB", h=120, sub="re bPitchShift = 0")
    pre = [r for r, tt in zip(rel, t) if r is not None and 0.2 <= tt <= on - 0.02]
    post = [r for r, tt in zip(rel, t) if r is not None and on + 0.1 <= tt <= 1.2]
    mpre, mpost = sum(pre) / len(pre), sum(post) / len(post)
    s.band(0.14, on, sy2(mpre), sy2(0), "")
    s.band(on, 1.26, sy2(mpost), sy2(0), "")
    s.lane([(0.14, f"{mpre:+.1f} dB at 0 st", "start"), (on, f"after the step: mean {mpost:+.1f} dB, from {min(post):+.1f} to {max(post):+.1f}", "start")])
    s.guide(on, y1 - 30, y2 + 120)
    s.axis([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4])
    main = s.svg("F0 steps from 120 to %.1f Hz at %.2f s as commanded. The output level is %+.1f dB relative to the input before the step and "
                 "averages %+.1f dB after it, varying from block to block; with the phase vocoder off it is 0 dB." %
                 (d["f0_after"], on, d["gain_before_db"], d["gain_after_db"]))
    # sweep: steady level change 0 -> +2 st by F0, two vowels; F0 on the x axis (not time)
    sw = d["sweep"]
    g = Sketch("sk-pt-5-sweep", 90, 270, "Level change from 0 to +2 semitones by F0 and vowel (constant ratio, one trial per point)")
    pa = sorted((r["f0"], r["gain2_db"] - r["gain0_db"]) for r in sw if r["vowel"] == "a")
    pi = sorted((r["f0"], r["gain2_db"] - r["gain0_db"]) for r in sw if r["vowel"] == "i")
    y, sy = g.lines("Level change", [([f for f, _ in pa], [v for _, v in pa], "observed"), ([f for f, _ in pi], [v for _, v in pi], "expected")],
                    -10, 1, [0, -4, -8], " dB", h=150, sub="+2 st vs 0 st")
    for f, v in pa:
        g.parts.append(f'<circle class="sk-dot-a" cx="{g.x(f):.1f}" cy="{sy(v):.1f}" r="5"><title>/a/, F0 {f} Hz: {v:+.2f} dB</title></circle>')
    for f, v in pi:
        g.parts.append(f'<rect class="sk-dot-i" x="{g.x(f)-4.5:.1f}" y="{sy(v)-4.5:.1f}" width="9" height="9"><title>/i/, F0 {f} Hz: {v:+.2f} dB</title></rect>')
    g.lane([(90, "circles and blue line: /a/; squares and thin line: /i/. 0 dB would mean no loudness change.", "start")])
    g.axis([100, 150, 200, 250], "{:g} Hz", label="F0 of the synthetic vowel (Hz)")
    sweep = g.svg("The level change at +2 st ranges from about -1 to -9 dB depending on F0 and vowel.")
    return main + sweep


def derive(d, up):
    import math
    steps = [r["gain2_db"] - r["gain0_db"] for r in d["sweep"]]
    return {"f0_cents": 1200 * math.log2(d["f0_after"] / d["f0_in"]), "sweep_min": -max(steps), "sweep_max": -min(steps),
            "ampnorm_text": "; ".join(f'{a["name"]}: {a["result"].replace("Audapter: ", "")}' for a in d["ampnorm"])}


def derive_real(rd):
    import statistics as st
    clean = [c for c in rd["steady"]["per_clip"] if not c["id"].startswith("vbd_")]
    grp = lambda pre: [c["gp2"] - c["g0"] for c in clean if c["group"].startswith(pre)]
    h = [s["heard_step_db"] for s in rd["in_utterance"]]
    S = rd["steady"]
    return {"n_clean": len(clean), "g0_lo": S["gain0_db_range"][0], "g0_hi": S["gain0_db_range"][1],
            "st_lo": -S["step_0_to_up2_db_range"][1], "st_hi": -S["step_0_to_up2_db_range"][0],
            "med_m": -st.median(grp("adult_M")), "med_f": -st.median(grp("adult_F")), "med_c": -st.median(grp("child")),
            "n_utt": len(h), "on_lo": -max(h), "on_hi": -min(h), "on_med": -st.median(h)}
