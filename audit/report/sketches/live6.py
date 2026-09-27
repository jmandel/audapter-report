from sketchlib import *

def _wave(s, text, sub, x, t0, dt, cls, h=70, amp=0.22, style=""):
    y = s._row(); s.label(y, h, text, sub); s.frame(y, h)
    Y = lambda v: y + h / 2 - max(-amp, min(amp, v)) / amp * (h / 2 - 3)
    pts = " L".join(f"{s.x(t0 + i*dt):.1f},{Y(v):.1f}" for i, v in enumerate(x) if s.t0 <= t0 + i * dt <= s.t1)
    s.parts.append(f'<line class="sk-grid" x1="{X0}" x2="{X1}" y1="{Y(0):.1f}" y2="{Y(0):.1f}"/>')
    s.parts.append(f'<path class="{cls}" d="M{pts}"{style}><title>{E(text)}</title></path>')
    s.y += h + 8; return y

def sketch(d, up):
    B, fs = d["buf"], d["fs"]; P = B / fs
    t0 = d["win_t0"]; t1 = t0 + 3 * P
    s = Sketch("sk-live-6", t0, t1, "Three 128-sample device buffers with Audapter's 96-sample frame")
    k = d["win_k0"]
    s.intervals("Device buffer", [(t0 + i * P, t0 + (i + 1) * P, f"buffer {k+i}: {B} samples", "context") for i in range(3)], h=26)
    s.intervals("handleBuffer", [(t0 + i * P, t0 + (i + 1) * P, f"{B} ≠ {d['frame']}: returns at once", "observed") for i in range(3)], h=26,
                sub="Audapter.cpp:1667")
    # mic samples that end up in each buffer: those of 2 buffers earlier, drawn where they are played
    lead = t0 - d["win_mic_t0"]
    _wave(s, "Mic", f"{lead*1000:.2f} ms earlier", d["win_mic"], t0, 1 / fs, "sk-line-expected", style=' style="stroke:var(--input);stroke-width:1.5"')
    _wave(s, "Expected", "buffer 96: Audapter output", d["win_expected"], t0, 1 / fs, "sk-line-expected")
    y = _wave(s, "Heard", "buffer 128, left ear", d["win_heard"], t0, 1 / fs, "sk-line-wave", h=80)
    for i in range(3):
        a = t0 + i * P
        s.band(a + P / 2, a + P, y, y + 80, "")
    s.lane([(t0, "first half of each buffer: the raw mic at double speed; second half (shaded): silence", "start")])
    s.axis([t0 + i * P for i in range(4)], label=f"time in the trial (ms); one device buffer = {P*1000:.2f} ms", tickfmt=lambda v: f"{v*1000:.1f}")
    return s.svg(f"With a {B}-sample device buffer, handleBuffer returns without processing. Each buffer then plays the raw mic samples of "
                 f"two buffers earlier, read as interleaved stereo: the left ear gets every second sample in the first half of the buffer "
                 f"(double speed, one octave up) and silence in the second half, {fs/B:.0f} times a second.")

def derive(d, up):
    return {}
