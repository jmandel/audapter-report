from sketchlib import *

def sketch(d, up):
    d["gaps"] = rows2(d["gaps"])
    dt, T1 = d["env_dt"], 12.0
    t = [i * dt for i in range(len(d["env_out"]))]
    s = Sketch("sk-i-01", 0, T1, "Masking noise over a 12 s trial: expected loop and what is played")
    s.envelope("Input", t, d["env_in"], -60, -10, h=26, sub="vowels")
    L = d["noise_len_samples"] / d["fs_device"]
    exp = []; a = 0; k = 1
    while a < T1:
        exp.append((a, min(a + L, T1), f"noise, pass {k}", "expected")); a += L; k += 1
    s.intervals("Noise, 5 s file", exp, sub="expected")
    on = runs(t, d["noise_on"], lambda v: v > 0)
    yo = s.intervals("Noise played", [(a, b, "noise", "observed") for a, b in on], sub="observed")
    for g0, g1 in d["gaps"]:
        s.band(g0, g1, yo, yo + 26, f"no noise for {g1-g0:.1f} s: voice unmasked", ty=yo + 17)
    s.envelope("Output", t, d["env_out"], -60, -10, h=34, cls="sk-output", sub="what is heard")
    s.axis([0, 2, 4, 6, 8, 10, 12])
    main = s.svg("With a 5 s noise file, noise plays from 0 to 5 s and from 10 s on, when the 10 s buffer wraps; nothing from 5 to 10 s.")
    # inset: bundled babble dropout
    z, t0, zdt = d["babble_zoom"], d["babble_zoom_t0"], d["babble_zoom_dt"]
    zi = Sketch("sk-i-01-zoom", t0, t0 + len(z) * zdt, "Bundled babble around 9.98 s")
    y = zi._row(); h = 60; zi.label(y, h, "Bundled babble", "fb 2, 9.90–10.06 s"); zi.frame(y, h)
    pk = max(abs(v) for v in z) or 1
    pts = " L".join(f"{zi.x(t0 + i*zdt):.1f},{y + h/2 - v/pk*(h/2-3):.1f}" for i, v in enumerate(z))
    zi.parts.append(f'<path class="sk-line-wave" d="M{pts}"/>')
    b0, b1 = d["babble_dropout"]
    zi.band(b0, b1 + 1/16000, y, y + h, f"{(b1-b0)*1000+1/16:.0f} ms of silence", anchor="start", ty=y + 12)
    zi.y += h + 8
    zi.axis([9.90, 9.94, 9.98, 10.02, 10.06], "{:.2f} s")
    inset = zi.svg("The full-length bundled babble (479230 samples) plays silence from 9.984 to 10.000 s before wrapping.")
    return main + inset


def derive(d, up):
    for x in (d, up):
        if x and "gaps" in x: x["gaps"] = rows2(x["gaps"])
    fmt = lambda g: ", ".join(f"{a:.2f}–{b:.2f} s" for a, b in g) if g else "none"
    return {"gaps_text": fmt(d["gaps"]), "up_maxPBLen": up["maxPBLen"] if up else "?",
            "up_gaps_text": fmt(up["gaps"]) if up else "not run"}


def derive_real(rd):
    return {}
