from sketchlib import *


def sketch(d, up):
    t, T1, n, ns = d["t"], 1.2, d["pcf_n"], d["n_states"]
    s = Sketch("sk-ost-f4", 0, T1, "PCF rows allocated vs OST states read, and when the out-of-bounds reads happen")
    # --- array-extent diagram: one cell per OST state index, same classes as the timeline tiers
    s.header("Memory: the PCF's arrays and the entries read (not a time axis)")
    cw, h = (X1 - X0) / max(ns, 5), 30
    def cells(label, sub, idx, kind, txt):
        y = s._row(); s.label(y, h, label, sub)
        for i in idx:
            x = X0 + i * cw
            s.parts.append(f'<rect class="sk-{kind}" x="{x + 1}" y="{y + 3}" width="{cw - 2}" height="{h - 6}" rx="2">'
                           f'<title>{E(label)}: index {i}</title></rect>'
                           f'<text class="sk-in sk-in-{kind}" x="{x + cw / 2:.1f}" y="{y + h / 2 + 4:.1f}" text-anchor="middle">{E(txt(i))}</text>')
        s.y += h + 8; return y
    amp = [0.0] * n
    for line in d["params"]["pcf"].strip().split("\n")[2:]:
        f = [v.strip() for v in line.split(",")]
        if len(f) == 5 and int(f[0]) < n: amp[int(f[0])] = float(f[3])
    s.y += 16
    ya = cells("fmtPertAmp[ ]", f"PCF: {n} rows, {d['alloc_bytes']} bytes", range(n), "expected", lambda i: f"[{i}] = {amp[i]:g}")
    yr = cells("fmtPertAmp[stat]", "read at Audapter.cpp:1811", range(ns), "observed", lambda i: f"state {i}")
    xa, xb = X0 + n * cw, X0 + ns * cw
    s.bands.append(f'<rect class="sk-disc" x="{xa}" y="{ya}" width="{xb - xa}" height="{yr + h - ya}"><title>read past the end</title></rect>')
    s.lane([((xa - X0) / (X1 - X0) * (s.t1 - s.t0) + s.t0, f"past the end: no row for state {n}" + (f"–{ns - 1}" if ns - 1 > n else ""), "start")])
    s.parts.append(f'<line class="sk-guide" x1="{xa}" x2="{xa}" y1="{ya - 14}" y2="{yr + h}"/>')
    s.gap(14)
    # --- timeline: when those indices are read
    s.header("One trial: when those entries are read")
    s.envelope("Input", t, db(d["rms"]), -60, -10, marks=[(d["vowel_on_s"] + 0.02, "/a/")])
    ivs = state_ivs(t, d["stat"], "observed", T1)
    yo = s.intervals("OST state", ivs, sub="ost_stat")
    s.gap(14)
    rd =[(a, b, "in bounds" if int(l.split()[1]) < n else f"[{l.split()[1]}] out of bounds", "expected" if int(l.split()[1]) < n else "none")
          for a, b, l, k in ivs]
    yb = s.intervals("fmtPertAmp[stat]", rd, sub="every frame")
    a = d["oob_first_s"]
    s.band(a, T1, yb, yb + 30, f"{d['oob_frames']} of {d['frames']} frames read past the end", anchor="start", ty=yb - 5)
    s.axis([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2])
    return s.svg("The PCF allocates %d rows (states 0-%d), but the OST has %d states. From %.3f s on (state %d and later) every frame reads "
                 "fmtPertAmp[stat] past the end of the array, %d of %d frames in this trial." % (n, n - 1, ns, a, n, d["oob_frames"], d["frames"]))


def derive(d, up):
    return {"oob_pct": 100.0 * d["oob_frac"], "last_state": d["n_states"] - 1, "pcf_last": d["pcf_n"] - 1,
            "state3_s": d["state_on_s"][3] if len(d["state_on_s"]) > 3 else float("nan"),
            "state4_s": d["state_on_s"][4] if len(d["state_on_s"]) > 4 else float("nan")}
