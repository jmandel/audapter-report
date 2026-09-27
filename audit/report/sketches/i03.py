from sketchlib import *


def sketch(d, up):
    T1 = d["trial_s"]; W0 = d["wrap_s"]; R0 = d["returned_from_s"]
    dt = d["env_dt"]; t = [i * dt + dt / 2 for i in range(len(d["env_in"]))]
    e1, e2 = d["ost_elapsed"]; s1 = e1; s2 = e1 + e2
    s = Sketch("sk-i-03", 0, T1, "A 35 s trial: what happened, and what getData returns")
    s.y = 24
    s.envelope("Input", t, d["env_in"], -60, -10, h=26, sub="a vowel every second")
    s.intervals("Trial", [(0, T1, f"{T1:.0f} s of speech and data", "expected")], h=26, sub="what was run")
    y = s.intervals("getData returns", [(R0, T1, f"{d['returned_s']:.1f} s", "observed")], h=26, sub="blab b2.5")
    s.band(0, R0, y, y + 26, f"0–{R0:.0f} s not returned (signalIn, signalOut, ost_stat, fmts, …)", ty=y + 17)
    if up:
        yu = s.intervals("getData returns", [(up["returned_from_s"], T1, f"{up['returned_s']:.1f} s", "observed")], h=26, sub="upstream 2.1.5")
        s.band(0, up["returned_from_s"], yu, yu + 26, f"upstream wraps every {up['wrap_s']:.1f} s", ty=yu + 17)
    s.gap(4)
    s.intervals("OST state", [(0, s1, "state 0", "expected"), (s1, s2, "state 1 (e.g. perturbation on)", "expected"), (s2, T1, "state 2", "expected")],
                h=26, sub=f"ELAPSED_TIME {e1:g} s, {e2:g} s")
    # actual states: pre-wrap snapshot, then the returned part
    sd = d["stat_dt"]
    pre = state_ivs([i * sd for i in range(len(d["stat_pre"]))], d["stat_pre"], "observed", W0)
    post = state_ivs([d["stat_post_t0"] + i * sd for i in range(len(d["stat_post"]))], d["stat_post"], "observed", T1)
    yo = s.intervals("OST state", pre + post, h=26, sub="what Audapter did")
    s.band(s2, T1, yo, yo + 26, "", )
    s.parts.append(f'<text class="sk-note" x="{s.x(W0) - 6:.1f}" y="{yo + 40}" text-anchor="end">state 2, due at {s2:g} s, never comes (checked to {d["ext_total_s"]:.0f} s)</text>')
    s.gap(26)
    yh = s.envelope("Heard", t, d["env_out"], -60, -10, h=34, cls="sk-output", sub=f"trialLen {d['trialLen']:g} s")
    s.band(d["trialLen"], T1, yh, yh + 34, f"not muted after trialLen ({d['trialLen']:g} s)", anchor="end", ty=yh - 4)
    s.guide(W0, 20, s.y - 8)
    s.parts.append(f'<text class="sk-note" x="{s.x(W0) - 4:.1f}" y="16" text-anchor="end">recorder full at {W0:.0f} s: counters restart</text>')
    s.axis([0, 5, 10, 15, 20, 25, 30, 35])
    main = s.svg(f"The {T1:.0f} s trial ran, but getData returns only {R0:.0f}–{T1:.0f} s. The OST entered state 1 at {d['state1_onset_s']:.1f} s and "
                 f"never reached state 2, due at {s2:g} s. The output was not muted after trialLen = {d['trialLen']:g} s.")
    # inset: heard output around the wrap (onset ramp restarts)
    z, t0, zdt = d["ramp_zoom"], d["ramp_zoom_t0"], d["ramp_zoom_dt"]
    zi = Sketch("sk-i-03-zoom", t0, t0 + len(z) * zdt, "Heard output around the recorder wrap")
    y = zi.y; h = 60; zi.label(y, h, "Heard", f"{t0:.3f}–{t0 + len(z) * zdt:.3f} s"); zi.frame(y, h)
    pk = max(abs(v) for v in z) or 1
    pts = " L".join(f"{zi.x(t0 + i*zdt):.1f},{y + h/2 - v/pk*(h/2-3):.1f}" for i, v in enumerate(z))
    zi.parts.append(f'<path class="sk-line-wave" d="M{pts}"/>')
    zi.band(W0, W0 + d["rampLen"], y, y + h, f"onset ramp re-applied: {d['ramp_db']:.1f} dB over {d['rampLen']*1000:.0f} ms, mid-vowel",
            anchor="start", ty=y + 12)
    zi.y += h + 8
    zi.axis([30.0, 30.01, 30.02, 30.03, 30.04, 30.05], "{:.3f} s")
    inset = zi.svg(f"At the wrap the {d['rampLen']*1000:.0f} ms onset ramp restarts from zero in the middle of a vowel.")
    return main + inset


def derive(d, up):
    e1, e2 = d["ost_elapsed"]
    return {"state2_due_s": e1 + e2, "lost_s": d["returned_from_s"],
            "up_returned_s": up["returned_s"] if up else float("nan"), "up_wrap_s": up["wrap_s"] if up else float("nan"),
            "rows_text": f'{d["returned_rows"]}', "stale_text": "yes" if d["stale_tail_equal"] else "no"}
