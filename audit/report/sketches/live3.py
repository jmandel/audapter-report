from sketchlib import *

MS = "{:.0f} ms"

def _axis_ms(s, ticks):
    y = s.y
    s.parts.append(f'<line class="sk-axis" x1="{X0}" x2="{X1}" y1="{y}" y2="{y}"/>')
    for t in ticks:
        s.parts.append(f'<line class="sk-axis" x1="{s.x(t):.1f}" x2="{s.x(t):.1f}" y1="{y}" y2="{y+4}"/>'
                       f'<text class="sk-tick" x="{s.x(t):.1f}" y="{y+16}" text-anchor="middle">{t*1000:+.0f} ms</text>'.replace("+0 ms", "0 ms"))
    s.y += 22

def _span(d):
    """Burst span (s, relative to the reset): first/last sample above the loudest normal output sample."""
    w, t0, dt, pk = d["wave_obs"], d["wave_t0"], d["wave_dt"], d["ref_peak"]
    idx = [i for i, v in enumerate(w) if abs(v) > pk]
    return t0 + idx[0] * dt, t0 + (idx[-1] + 1) * dt

def sketch(d, up):
    b0, b1 = _span(d)
    n = len(d["env_obs_db"]); t = [d["env_t0"] + (i + 0.5) * d["env_dt"] for i in range(n)]
    s = Sketch("sk-live-3", d["env_t0"], d["env_t0"] + n * d["env_dt"], "Headphone signal around a reset() that raced the audio callback")
    s.envelope("Input", t, d["env_in_db"], -60, 0, h=30, sub="mic, looped vowel")
    ref_db = 20 * __import__("math").log10(d["ref_peak"])
    s.y += 18
    s.parts.append(f'<path class="sk-line-observed" d="M{X0},{s.y-12} l22,0"/><text class="sk-in" x="{X0+28}" y="{s.y-8}">the reset that raced the callback</text>'
                   f'<path class="sk-line-expected" d="M{X0+290},{s.y-12} l22,0"/><text class="sk-in" x="{X0+318}" y="{s.y-8}">another reset at the same point of the vowel (no burst)</text>')
    y, sy = s.lines("Output peak", [(t, d["env_exp_db"], "expected"), (t, d["env_obs_db"], "observed")],
                    -60, 6, [0, -20, -40], " dBFS", h=150, sub="1 ms blocks")
    s.parts.append(f'<line class="sk-grid" x1="{X0}" x2="{X1}" y1="{sy(ref_db):.1f}" y2="{sy(ref_db):.1f}" stroke-dasharray="4 3"/>'
                   f'<text class="sk-tick" x="{X1-4}" y="{sy(ref_db)-4:.1f}" text-anchor="end">loudest normal sample, {ref_db:.1f} dBFS</text>')
    s.band(b0, b1, y, y + 150, f"burst: {d['burst_peak_db_re_normal']:+.1f} dB re normal peak, {(b1-b0)*1000:.1f} ms, clipped", anchor="start", ty=y + 14)
    s.guide(0, y - 6, y + 150)
    s.parts.append(f'<text class="sk-note" x="{s.x(0)-6:.1f}" y="{y+150-8}" text-anchor="end">reset() zeroes the output ({d["dropout_ms_median"]:.0f} ms of silence)</text>')
    s.parts.append(f'<text class="sk-in" x="{s.x(0.064):.1f}" y="{y+150-8}" text-anchor="start">next reset</text>')
    _axis_ms(s, [-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06])
    main = s.svg(f"Time 0 is where the output falls silent because reset() cleared Audapter's buffers. Normally the output then resumes at its "
                 f"usual level (thin line, another reset at the same point of the vowel). Here the resampling filter state was torn and the output "
                 f"jumps to {d['burst_peak']:.2f} times digital full scale ({d['burst_peak_db_re_normal']:+.1f} dB above the loudest normal sample) "
                 f"for about {(b1-b0)*1000:.1f} ms.")
    # waveform inset, every sample, clipped at full scale as a DAC plays it
    w, we, t0, dt = d["wave_obs"], d["wave_exp"], d["wave_t0"], d["wave_dt"]
    zi = Sketch("sk-live-3-wave", t0, t0 + len(w) * dt, "Waveform of the burst, clipped at full scale")
    h = 150; y = zi.y; zi.label(y, h, "Headphone signal", "every sample"); zi.frame(y, h)
    Y = lambda v: y + h / 2 - v / 1.25 * (h / 2 - 4)
    for lv, txt in ((1, "digital full scale"), (-1, ""), (d["ref_peak"], "normal peak"), (-d["ref_peak"], "")):
        zi.parts.append(f'<line class="sk-grid" x1="{X0}" x2="{X1}" y1="{Y(lv):.1f}" y2="{Y(lv):.1f}"' + ('' if abs(lv) == 1 else ' stroke-dasharray="4 3"') + '/>')
        if txt: zi.parts.append(f'<text class="sk-tick" x="{X0+4}" y="{Y(lv)-4:.1f}">{txt}</text>')
    pe = " L".join(f"{zi.x(t0 + i*dt):.1f},{Y(v):.1f}" for i, v in enumerate(we))
    po = " L".join(f"{zi.x(t0 + i*dt):.1f},{Y(v):.1f}" for i, v in enumerate(w))
    zi.parts.append(f'<path class="sk-line-expected" d="M{pe}"><title>another reset, no burst</title></path>')
    zi.parts.append(f'<path class="sk-line-wave" d="M{po}"><title>the racing reset</title></path>')
    zi.band(b0, b1, y, y + h, f"{d['clipped_samples']} samples beyond full scale", anchor="end", ty=y + 14)
    zi.y += h + 8
    _axis_ms(zi, [-0.004, 0, 0.004, 0.008, 0.012])
    inset = zi.svg(f"Sample by sample: the burst swings to full scale in both directions; {d['clipped_samples']} samples exceed it and are clipped.")
    # rate / size statistics
    tiles = [(f"{d['n_resets']}", f"resets in {d['run_s']:.0f} s"),
             (f"{d['n_resets_voiced']}", "during voicing"),
             (f"{d['n_bursts']}", "burst > 2× normal peak"),
             (f"{d['burst_peak']:.2f}×", f"full scale ({d['burst_peak_dbfs']:+.1f} dBFS)")]
    tw = (X1 - X0) / 4; parts = [f'<text class="sk-lab" x="{LX}" y="30" text-anchor="end">One 120 s run</text>',
                                 f'<text class="sk-sub" x="{LX}" y="45" text-anchor="end">control: {d["control_peak"]:.3f} peak</text>']
    for i, (v, lab) in enumerate(tiles):
        x = X0 + i * tw
        parts.append(f'<rect class="sk-frame" x="{x+2:.1f}" y="6" width="{tw-8:.1f}" height="54" rx="3"/>'
                     f'<text class="sk-note" x="{x+12:.1f}" y="30" style="font-size:20px">{E(v)}</text>'
                     f'<text class="sk-sub" x="{x+12:.1f}" y="50">{E(lab)}</text>')
    stats = (f'<svg class="sketch" id="sk-live-3-stats" viewBox="0 0 {W} 66" role="img" aria-labelledby="sk-live-3-stats-t">'
             f'<title id="sk-live-3-stats-t">{d["n_resets"]} resets, {d["n_resets_voiced"]} during voicing, {d["n_bursts"]} burst; '
             f'race-free control peak {d["control_peak"]:.3f}</title>{"".join(parts)}</svg>')
    return main + inset + stats


def derive(d, up):
    b0, b1 = _span(d)
    return {"burst_ms": (b1 - b0) * 1000, "burst_start_ms": b0 * 1000}
