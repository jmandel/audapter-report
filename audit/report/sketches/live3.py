from sketchlib import *

MS = "{:.0f} ms"

def _axis_ms(s, ticks):
    y = s.y
    s.parts.append(f'<line class="sk-axis" x1="{X0}" x2="{X1}" y1="{y}" y2="{y}"/>')
    for t in ticks:
        s.parts.append(f'<line class="sk-axis" x1="{s.x(t):.1f}" x2="{s.x(t):.1f}" y1="{y}" y2="{y+4}"/>'
                       f'<text class="sk-tick" x="{s.x(t):.1f}" y="{y+16}" text-anchor="{"start" if s.x(t) < X0 + 12 else "end" if s.x(t) > X1 - 12 else "middle"}">{t*1000:+.0f}</text>'.replace(">+0<", ">0<"))
    s.y += 22
    s.parts.append(f'<text class="sk-axlab" x="{X1}" y="{s.y + 8}" text-anchor="end">time relative to the reset (ms)</text>'); s.y += 14

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
    y, sy = s.lines("Output peak", [(t, d["env_exp_db"], "expected"), (t, d["env_obs_db"], "observed")],
                    -60, 6, [0, -20, -40], " dBFS", h=150, sub="1 ms blocks")
    s.parts.append(f'<line class="sk-grid" x1="{X0}" x2="{X1}" y1="{sy(ref_db):.1f}" y2="{sy(ref_db):.1f}" stroke-dasharray="4 3"/>'
                   f'<text class="sk-tick" x="{X1-4}" y="{sy(ref_db)-4:.1f}" text-anchor="end">loudest normal sample, {ref_db:.1f} dBFS</text>')
    s.band(b0, b1, y, y + 150, "")
    s.guide(0, y - 6, y + 150)
    s.lane([(0, f"reset(): output silent for {d['dropout_ms_median']:.0f} ms", "end"),
            (b0, f"burst: {d['burst_peak_db_re_normal']:+.1f} dB re the normal peak, {(b1-b0)*1000:.1f} ms, clipped", "start")])
    _axis_ms(s, [-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06])
    main = s.svg(f"Time 0 is where the output falls silent because reset() cleared Audapter's buffers. Normally the output then resumes at its "
                 f"usual level (thin line, another reset at the same point of the vowel). Here the resampling filter state was torn and the output "
                 f"jumps to {d['burst_peak']:.2f} times digital full scale ({d['burst_peak_db_re_normal']:+.1f} dB above the loudest normal sample) "
                 f"for about {(b1-b0)*1000:.1f} ms.")
    # waveform inset, every sample, clipped at full scale as a DAC plays it
    w, we, t0, dt = d["wave_obs"], d["wave_exp"], d["wave_t0"], d["wave_dt"]
    zi = Sketch("sk-live-3-wave", t0, t0 + len(w) * dt, "Waveform of the burst, clipped at full scale")
    h = 150; y = zi._row(); zi.label(y, h, "Headphone signal", "every sample"); zi.frame(y, h)
    Y = lambda v: y + h / 2 - v / 1.25 * (h / 2 - 4)
    for lv, txt in ((1, "digital full scale"), (-1, ""), (d["ref_peak"], "normal peak"), (-d["ref_peak"], "")):
        zi.parts.append(f'<line class="sk-grid" x1="{X0}" x2="{X1}" y1="{Y(lv):.1f}" y2="{Y(lv):.1f}"' + ('' if abs(lv) == 1 else ' stroke-dasharray="4 3"') + '/>')
        if txt: zi.parts.append(f'<text class="sk-tick" x="{X0+4}" y="{Y(lv)-4:.1f}">{txt}</text>')
    pe = " L".join(f"{zi.x(t0 + i*dt):.1f},{Y(v):.1f}" for i, v in enumerate(we))
    po = " L".join(f"{zi.x(t0 + i*dt):.1f},{Y(v):.1f}" for i, v in enumerate(w))
    zi.parts.append(f'<path class="sk-line-expected" d="M{pe}"><title>another reset, no burst</title></path>')
    zi.parts.append(f'<path class="sk-line-wave" d="M{po}"><title>the racing reset</title></path>')
    zi.band(b0, b1, y, y + h, "")
    zi.y += h + 8
    zi.lane([(b0, f"{d['clipped_samples']} samples beyond full scale", "start")])
    _axis_ms(zi, [-0.004, 0, 0.004, 0.008, 0.012])
    inset = zi.svg(f"Sample by sample: the burst swings to full scale in both directions; {d['clipped_samples']} samples exceed it and are clipped.")
    return main + inset


def derive(d, up):
    b0, b1 = _span(d)
    return {"burst_ms": (b1 - b0) * 1000, "burst_start_ms": b0 * 1000}
