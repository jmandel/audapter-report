"""Independent measurements on the exported WAV files (not Audapter's own tracker or logs).

The report's per-word values ("F1 596 -> 800 Hz", "F0 +200 cents", "level -31 dB") are computed here, at build time, from the
same WAV files the reader plays. The estimators are ports of the harness's est_formants.m / est_f0.m (autocorrelation LPC
with pre-emphasis; autocorrelation F0), so the numbers agree with the harness logs to within estimator noise.

  span(path, a, b, what)   -> value measured over the middle 60 % of [a, b] seconds of the file
"""
import numpy as np, wave, functools

@functools.lru_cache(maxsize=256)
def load(path):
    with wave.open(path) as w:
        fs, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        x = np.frombuffer(w.readframes(n), dtype="<i2").astype(float) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch)[:, 0]
    return fs, x

def _lpc(s, order):
    """Autocorrelation LPC (Levinson-Durbin), as Octave's lpc()."""
    r = np.correlate(s, s, "full")[len(s) - 1:len(s) + order]
    if r[0] <= 0:
        return None
    a = np.zeros(order + 1); a[0] = 1.0; e = r[0]
    for i in range(1, order + 1):
        k = -(r[i] + np.dot(a[1:i], r[i - 1:0:-1])) / e
        a[1:i + 1] = a[1:i + 1] + k * np.concatenate((a[i - 1:0:-1], [1.0]))
        e *= (1 - k * k)
        if e <= 0:
            return None
    return a

def formants(x, fs, win=0.03, hop=0.01, rmsmin=1e-3, fmin=150):
    """Per-frame [F1, F2] (Hz) by LPC, NaN in quiet or unresolved frames (est_formants.m)."""
    order = round(2 + fs / 1000)
    y = np.append(x[0], x[1:] - 0.97 * x[:-1])
    W, H = round(win * fs), round(hop * fs); w = np.hamming(W)
    out = []
    for i in range(0, max(0, len(y) - W) + 1, H):
        s = y[i:i + W]
        if np.sqrt(np.mean(s ** 2)) < rmsmin:
            out.append((np.nan, np.nan)); continue
        a = _lpc(s * w, order)
        if a is None:
            out.append((np.nan, np.nan)); continue
        r = np.roots(a); r = r[np.imag(r) > 0]
        f = np.angle(r) * fs / (2 * np.pi); bw = -np.log(np.abs(r)) * fs / np.pi
        f = np.sort(f[(f > fmin) & (bw < 500)])
        out.append((f[0], f[1]) if len(f) >= 2 else (np.nan, np.nan))
    return np.array(out).reshape(-1, 2)

def f0(x, fs, fmin=60, fmax=500):
    """Median autocorrelation F0 over voiced 40 ms frames (est_f0.m); NaN if unvoiced."""
    W, H = round(0.04 * fs), round(0.01 * fs); v = []
    for i in range(0, len(x) - W, H):
        s = x[i:i + W] - np.mean(x[i:i + W])
        if np.sqrt(np.mean(s ** 2)) < 1e-3:
            continue
        r = np.correlate(s, s, "full")[W - 1:]
        if r[0] <= 0:
            continue
        r = r / r[0]
        lo, hi = int(np.floor(fs / fmax)), int(np.ceil(fs / fmin))
        k = lo + int(np.argmax(r[lo:hi + 1]))
        if r[k] > 0.5:
            d = 0.0
            if 0 < k < len(r) - 1:
                den = r[k - 1] - 2 * r[k] + r[k + 1]
                d = (r[k - 1] - r[k + 1]) / (2 * den) if den else 0.0
            v.append(fs / (k + d))
    return float(np.median(v)) if v else float("nan")

def level_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12))

def cut(path, a, b, inner=0.6):
    """Samples of [a, b] s, keeping the middle `inner` fraction (avoids onsets, offsets and the ~10 ms output delay)."""
    fs, x = load(path)
    m = (b - a) * (1 - inner) / 2
    return fs, x[int(round((a + m) * fs)):int(round((b - m) * fs))]

def span(path, a, b, what, inner=0.6):
    fs, s = cut(path, a, b, inner)
    if what == "F1":
        F = formants(s, fs); v = F[:, 0]; v = v[np.isfinite(v)]
        return float(np.median(v)) if len(v) >= 3 else float("nan")
    if what == "F2":
        F = formants(s, fs); v = F[:, 1]; v = v[np.isfinite(v)]
        return float(np.median(v)) if len(v) >= 3 else float("nan")
    if what == "F0":
        return f0(s, fs)
    if what == "level":
        return level_db(s)
    raise ValueError(what)

def silent_runs(path, a, b, thresh=1e-6, min_s=0.002):
    """Stretches of exact digital silence inside [a, b] s: [(start, end)] in seconds (for dropouts)."""
    fs, x = load(path)
    i0, i1 = int(a * fs), int(b * fs); z = np.abs(x[i0:i1]) < thresh
    d = np.diff(np.concatenate(([0], z.astype(int), [0])))
    on, off = np.where(d == 1)[0], np.where(d == -1)[0]
    return [((i0 + s) / fs, (i0 + e) / fs) for s, e in zip(on, off) if (e - s) / fs >= min_s]
