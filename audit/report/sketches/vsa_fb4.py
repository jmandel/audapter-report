"""vsaGeneralize fb 4 gain (EXP-5): p.fb4Gain is not forwarded by AudapterIO; the level difference, measured on the WAVs."""
import os
import measure as M


def _lv(d, f):
    return M.span(os.path.join(d["_dir"], "..", "vsa-meas", f), 0.3, 1.1, "level", inner=1.0)


def sketch(d, up):
    import sketchlib as SL, html
    a, b = _lv(d, "fb4_intended.wav"), _lv(d, "fb4_committed.wav")
    W = 480 if SL.NARROW else 960; X0 = 8 if SL.NARROW else 200; X1 = W - 20
    lo, hi = -45, -20; x = lambda v: X0 + (v - lo) / (hi - lo) * (X1 - X0)
    rows = [("Expected: fb4GainDB = 20·log10(0.98)", a, "sk-expected"), ("Observed: default fb4GainDB (10 dB)", b, "sk-observed")]
    out, y = [], 6
    for lab, v, cls in rows:
        if SL.NARROW:
            out.append(f'<text class="sk-lab" x="{X0}" y="{y + 14}">{html.escape(lab)}</text>'); y += 20
        else:
            out.append(f'<text class="sk-lab" x="{X0 - 8}" y="{y + 18}" text-anchor="end">{html.escape(lab)}</text>')
        out.append(f'<rect class="{cls}" x="{X0}" y="{y + 4}" width="{x(v) - X0:.1f}" height="20" rx="2"/>'
                   f'<text class="sk-val" x="{x(v) + 6:.1f}" y="{y + 19}">{v:.1f} dBFS</text>'); y += 32
    out.append(f'<rect class="sk-disc" x="{x(a):.1f}" y="{y - 30}" width="{x(b) - x(a):.1f}" height="24"/>')
    out.append(f'<text class="sk-note" x="{X0 if SL.NARROW else x(a):.1f}" y="{y + 12}">+{b - a:.1f} dB louder{"" if SL.NARROW else " masking noise"} than the script sets</text>'); y += 24
    for t in (-45, -40, -35, -30, -25, -20):
        out.append(f'<text class="sk-tick" x="{x(t):.1f}" y="{y + 12}" text-anchor="middle">{t}</text>')
    out.append(f'<text class="sk-axlab" x="{X1}" y="{y + 28}" text-anchor="end">fb 4 output level, dBFS (measured)</text>'); y += 34
    sfx = "-n" if SL.NARROW else ""
    return (f'<svg class="sketch sk-{SL.LAYOUT}" id="sk-vsa-fb4{sfx}" viewBox="0 0 {W} {y}" role="img" aria-label="fb 4 output level: '
            f'{a:.1f} dBFS intended, {b:.1f} dBFS as committed">{"".join(out)}</svg>')


def derive(d, up):
    a, b = _lv(d, "fb4_intended.wav"), _lv(d, "fb4_committed.wav")
    return {"lv_int": a, "lv_obs": b, "lv_diff": b - a, "db_int": d["fb4"]["fb4GainDB_intended"], "db_obs": d["fb4"]["fb4GainDB_committed"]}
