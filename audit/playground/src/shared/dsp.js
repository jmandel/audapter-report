// Signal analysis and synthesis used by both the page and the engine worker (no DOM).
// Independent of Audapter: these estimates are what the page compares Audapter's own logs against.
(function (G) {
  'use strict';
  const TAU = 2 * Math.PI;

  function rng(seed) {   // mulberry32
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  // In-place iterative radix-2 FFT on (re, im), n a power of two.
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < h; k++) {
          const a = i + k, b = a + h;
          const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }

  // Broadband spectrogram in dB (Praat-like: 5 ms window, +6 dB/octave pre-emphasis). Returns Float32 dB, frames x bins.
  function spectrogramDb(x, sr, { win = 0.005, hop = 0.002, nfft = 256 } = {}) {
    const W = Math.round(win * sr), H = Math.max(1, Math.round(hop * sr));
    const nF = Math.max(1, Math.floor((x.length - 1) / H) + 1), nB = nfft / 2 + 1;
    const w = new Float64Array(W); for (let i = 0; i < W; i++) w[i] = 0.5 - 0.5 * Math.cos(TAU * (i + 0.5) / W);
    const out = new Float32Array(nF * nB), re = new Float64Array(nfft), im = new Float64Array(nfft);
    for (let f = 0; f < nF; f++) {
      const c = f * H - (W >> 1);
      re.fill(0); im.fill(0);
      for (let i = 0; i < W; i++) {
        const k = c + i; if (k < 1 || k >= x.length) continue;
        re[i] = (x[k] - 0.97 * x[k - 1]) * w[i];
      }
      fft(re, im);
      for (let b = 0; b < nB; b++) out[f * nB + b] = 10 * Math.log10(re[b] * re[b] + im[b] * im[b] + 1e-20);
    }
    return { db: out, nFrames: nF, nBins: nB, hop: H / sr, fmax: sr / 2 };
  }
  // Quantise to 0..255 over [ref - dyn, ref] dB (shared ref so input and output are comparable).
  function quantise(spec, ref, dyn = 60) {
    const q = new Uint8Array(spec.db.length), lo = ref - dyn;
    for (let i = 0; i < q.length; i++) { const v = (spec.db[i] - lo) / dyn; q[i] = v <= 0 ? 0 : v >= 1 ? 255 : Math.round(v * 255); }
    return { data: q, nFrames: spec.nFrames, nBins: spec.nBins, hop: spec.hop, fmax: spec.fmax, ref, dyn };
  }
  function maxOf(a) { let m = -Infinity; for (let i = 0; i < a.length; i++) if (a[i] > m) m = a[i]; return m; }

  // Short-time level in dBFS (RMS over `win`), every `hop` seconds.
  function levelDb(x, sr, { win = 0.02, hop = 0.005 } = {}) {
    const W = Math.round(win * sr), H = Math.round(hop * sr), n = Math.max(1, Math.floor(x.length / H));
    const out = new Float32Array(n);
    for (let f = 0; f < n; f++) {
      const c = f * H - (W >> 1); let s = 0, m = 0;
      for (let i = 0; i < W; i++) { const k = c + i; if (k >= 0 && k < x.length) { s += x[k] * x[k]; m++; } }
      out[f] = 10 * Math.log10(s / Math.max(1, m) + 1e-12);
    }
    return { db: out, hop };
  }
  // RMS over 20 ms blocks whose RMS exceeds 1e-3 (the report's "active RMS"), and the peak.
  function activeRms(x, sr = 48000) {
    const B = Math.round(0.02 * sr); let s = 0, n = 0;
    for (let i = 0; i + B <= x.length; i += B) {
      let e = 0; for (let k = i; k < i + B; k++) e += x[k] * x[k];
      if (Math.sqrt(e / B) > 1e-3) { s += e; n += B; }
    }
    return n ? Math.sqrt(s / n) : 0;
  }
  function peak(x) { let m = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; } return m; }
  // Largest 20 ms block RMS relative to the active RMS (dB): > 20 dB flags a burst.
  function burstDb(x, sr = 48000) {
    const B = Math.round(0.02 * sr), a = activeRms(x, sr); if (!a) return 0;
    let mx = 0; for (let i = 0; i + B <= x.length; i += B) { let e = 0; for (let k = i; k < i + B; k++) e += x[k] * x[k]; mx = Math.max(mx, Math.sqrt(e / B)); }
    return 20 * Math.log10(mx / a);
  }

  // YIN F0 estimate (de Cheveigne & Kawahara 2002), independent of Audapter's cepstral tracker.
  function yin(x, sr, { fmin = 60, fmax = 600, hop = 0.005, win = 0.04, thresh = 0.15, gateDb = -35 } = {}) {
    const W = Math.round(win * sr), H = Math.round(hop * sr), tmax = Math.min(W - 1, Math.ceil(sr / fmin)), tmin = Math.floor(sr / fmax);
    const n = Math.max(1, Math.floor(x.length / H)), f0 = new Float32Array(n), d = new Float64Array(tmax + 2);
    const lev = levelDb(x, sr, { win, hop }); const gate = maxOf(lev.db) + gateDb;
    for (let f = 0; f < n; f++) {
      if (lev.db[f] < gate) continue;
      const c = f * H - (W >> 1); if (c < 0 || c + W + tmax >= x.length) continue;
      d[0] = 1; let run = 0;
      for (let t = 1; t <= tmax; t++) {
        let s = 0; for (let i = 0; i < W; i++) { const v = x[c + i] - x[c + i + t]; s += v * v; }
        run += s; d[t] = run > 0 ? s * t / run : 1;
      }
      let T = -1;
      for (let t = Math.max(2, tmin); t < tmax; t++) if (d[t] < thresh) { while (t + 1 < tmax && d[t + 1] < d[t]) t++; T = t; break; }
      if (T < 0) continue;
      const a = d[T - 1], b = d[T], cc = d[T + 1], den = a - 2 * b + cc;
      const Tp = den ? T + 0.5 * (a - cc) / den : T;
      f0[f] = sr / Tp;
    }
    return { f0, hop };
  }

  // Autocorrelation LPC (Levinson-Durbin) -> polynomial roots (Durand-Kerner) -> F1..F3. Rough, independent estimate.
  function levinson(r, p) {
    const a = new Float64Array(p + 1); a[0] = 1; let e = r[0];
    if (!(e > 0)) return null;
    for (let i = 1; i <= p; i++) {
      let acc = r[i]; for (let j = 1; j < i; j++) acc += a[j] * r[i - j];
      const k = -acc / e, prev = a.slice();
      for (let j = 1; j < i; j++) a[j] = prev[j] + k * prev[i - j];
      a[i] = k; e *= 1 - k * k; if (!(e > 0)) return null;
    }
    return a;
  }
  function polyRoots(a) {   // roots of z^p + a1 z^(p-1) + ... + ap
    const p = a.length - 1, zr = new Float64Array(p), zi = new Float64Array(p);
    for (let i = 0; i < p; i++) { const ang = TAU * i / p + 0.4; zr[i] = 0.9 * Math.cos(ang); zi[i] = 0.9 * Math.sin(ang); }
    for (let it = 0; it < 500; it++) {
      let delta = 0;
      for (let i = 0; i < p; i++) {
        let vr = 1, vi = 0;   // Horner
        for (let k = 1; k <= p; k++) { const t = vr * zr[i] - vi * zi[i] + a[k]; vi = vr * zi[i] + vi * zr[i]; vr = t; }
        let dr = 1, di = 0;
        for (let j = 0; j < p; j++) if (j !== i) { const ur = zr[i] - zr[j], ui = zi[i] - zi[j]; const t = dr * ur - di * ui; di = dr * ui + di * ur; dr = t; }
        const m = dr * dr + di * di; if (!m) continue;
        const qr = (vr * dr + vi * di) / m, qi = (vi * dr - vr * di) / m;
        zr[i] -= qr; zi[i] -= qi; delta = Math.max(delta, Math.abs(qr) + Math.abs(qi));
      }
      if (delta < 1e-10) break;
    }
    return { zr, zi };
  }
  function lpcFormants(x, sr, { hop = 0.005, win = 0.025, order = 0, gateDb = -30 } = {}) {
    const p = order || Math.round(sr / 1000) + 2, W = Math.round(win * sr), H = Math.round(hop * sr);
    const n = Math.max(1, Math.floor(x.length / H));
    const F = [new Float32Array(n).fill(NaN), new Float32Array(n).fill(NaN), new Float32Array(n).fill(NaN)];
    const lev = levelDb(x, sr, { win, hop }); const gate = maxOf(lev.db) + gateDb;
    const w = new Float64Array(W); for (let i = 0; i < W; i++) w[i] = 0.54 - 0.46 * Math.cos(TAU * i / (W - 1));
    const s = new Float64Array(W), r = new Float64Array(p + 1);
    for (let f = 0; f < n; f++) {
      if (lev.db[f] < gate) continue;
      const c = f * H - (W >> 1); if (c < 1 || c + W >= x.length) continue;
      for (let i = 0; i < W; i++) s[i] = (x[c + i] - 0.97 * x[c + i - 1]) * w[i];
      for (let k = 0; k <= p; k++) { let acc = 0; for (let i = k; i < W; i++) acc += s[i] * s[i - k]; r[k] = acc; }
      r[0] *= 1 + 1e-9;
      const a = levinson(r, p); if (!a) continue;
      const { zr, zi } = polyRoots(a), cand = [];
      for (let i = 0; i < p; i++) {
        if (zi[i] <= 0) continue;
        const fr = Math.atan2(zi[i], zr[i]) * sr / TAU, bw = -Math.log(Math.hypot(zr[i], zi[i])) * sr / Math.PI;
        if (fr > 90 && fr < sr / 2 - 100 && bw < 500) cand.push(fr);
      }
      cand.sort((u, v) => u - v);
      for (let k = 0; k < 3 && k < cand.length; k++) F[k][f] = cand[k];
    }
    return { f: F, hop };
  }

  // Additive vowel synthesiser: harmonics with -6 dB/octave source tilt, shaped by 2-pole resonances evaluated every
  // 2.5 ms (so formant and F0 glides are clean). Output at 48 kHz, Float64.
  function resonance(f, F, B) {
    const b = B / 2, num = F * F + b * b;
    return num / Math.sqrt(((f - F) * (f - F) + b * b) * ((f + F) * (f + F) + b * b));
  }
  function synthVowel({ sr = 48000, dur = 2, onset = 0.2, offset = 1.8, ramp = 0.03, f0 = 120, f0End = null,
    formants = [700, 1200, 2600, 3500], formantsEnd = null, bw = [80, 90, 120, 150], level = -20, vibratoHz = 0,
    vibratoCents = 0, noiseDb = -45, seed = 1 } = {}) {
    const n = Math.round(dur * sr), y = new Float64Array(n), R = rng(seed);
    const blk = Math.round(0.0025 * sr), fe = formantsEnd || formants, f0e = f0End || f0;
    let phase = 0; const amps = new Float64Array(400);
    const T0 = onset, T1 = offset;
    for (let s0 = 0; s0 < n; s0 += blk) {
      const tm = (s0 + blk / 2) / sr, u = Math.min(1, Math.max(0, (tm - T0) / Math.max(1e-6, T1 - T0)));
      const Fs = formants.map((v, i) => v + (fe[i] - v) * u);
      let F0 = f0 + (f0e - f0) * u;
      const K = Math.min(399, Math.floor((sr / 2 - 200) / (F0 * 1.02)));
      for (let k = 1; k <= K; k++) { let g = 1 / k; for (let i = 0; i < Fs.length; i++) g *= resonance(k * F0, Fs[i], bw[i] || 100); amps[k] = g; }
      for (let s = s0; s < Math.min(n, s0 + blk); s++) {
        const t = s / sr;
        const f0t = F0 * (vibratoHz ? Math.pow(2, vibratoCents / 1200 * Math.sin(TAU * vibratoHz * t)) : 1);
        phase += TAU * f0t / sr; if (phase > TAU * 1000) phase -= TAU * 1000;
        let v = 0; for (let k = 1; k <= K; k++) v += amps[k] * Math.sin(k * phase);
        let env = 0;
        if (t >= T0 && t <= T1) env = Math.min(1, (t - T0) / ramp, (T1 - t) / ramp);
        env = env > 0 ? 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, env)) : 0;
        y[s] = v * env;
      }
    }
    // normalise the voiced part to the requested RMS level (dBFS), add a little aspiration noise under the vowel
    let e = 0, m = 0; for (let i = Math.round(T0 * sr); i < Math.min(n, Math.round(T1 * sr)); i++) { e += y[i] * y[i]; m++; }
    const g = m && e ? Math.pow(10, level / 20) / Math.sqrt(e / m) : 0, na = Math.pow(10, (level + noiseDb) / 20);
    for (let i = 0; i < n; i++) { const g1 = R(), g2 = R(); y[i] = y[i] * g + na * Math.sqrt(-2 * Math.log(Math.max(g1, 1e-12))) * Math.cos(TAU * g2) * 0.05; }
    return y;
  }

  // Masking noise for datapb (48 kHz): white or pink (Paul Kellet's filter), RMS in dBFS.
  function noise(n, { type = 'pink', level = -20, seed = 7 } = {}) {
    const R = rng(seed), y = new Float64Array(n);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = R() * 2 - 1;
      if (type === 'white') { y[i] = w; continue; }
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
      y[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
    }
    let e = 0; for (let i = 0; i < n; i++) e += y[i] * y[i];
    const g = Math.pow(10, level / 20) / Math.sqrt(e / Math.max(1, n));
    for (let i = 0; i < n; i++) y[i] *= g;
    return y;
  }

  // WAV (PCM16 or IEEE float32) encoder.
  function encodeWav(x, sr, { float = false } = {}) {
    const bps = float ? 4 : 2, n = x.length, buf = new ArrayBuffer(44 + n * bps), v = new DataView(buf);
    const s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    s(0, 'RIFF'); v.setUint32(4, 36 + n * bps, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, float ? 3 : 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * bps, true);
    v.setUint16(32, bps, true); v.setUint16(34, bps * 8, true); s(36, 'data'); v.setUint32(40, n * bps, true);
    for (let i = 0; i < n; i++) {
      if (float) v.setFloat32(44 + 4 * i, x[i], true);
      else v.setInt16(44 + 2 * i, Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), true);
    }
    return new Uint8Array(buf);
  }
  // Minimal WAV decoder (PCM 16/24/32, float 32/64), mixes to mono. Returns {sr, x: Float64Array} or null.
  function decodeWav(u8) {
    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const tag = o => String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);
    if (u8.length < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;
    let o = 12, fmt = null;
    while (o + 8 <= u8.length) {
      const id = tag(o), len = v.getUint32(o + 4, true), b = o + 8;
      if (id === 'fmt ') {
        fmt = { code: v.getUint16(b, true), ch: v.getUint16(b + 2, true), sr: v.getUint32(b + 4, true), bits: v.getUint16(b + 14, true) };
        if (fmt.code === 0xFFFE && len >= 26) fmt.code = v.getUint16(b + 24, true);   // WAVE_FORMAT_EXTENSIBLE sub-format
      }
      if (id === 'data' && fmt) {
        const bps = fmt.bits / 8, nFr = Math.floor(Math.min(len, u8.length - b) / (bps * fmt.ch)), x = new Float64Array(nFr);
        for (let i = 0; i < nFr; i++) {
          let acc = 0;
          for (let c = 0; c < fmt.ch; c++) {
            const p = b + (i * fmt.ch + c) * bps; let s;
            if (fmt.code === 3) s = bps === 4 ? v.getFloat32(p, true) : v.getFloat64(p, true);
            else if (bps === 2) s = v.getInt16(p, true) / 32768;
            else if (bps === 3) s = ((v.getUint8(p) | v.getUint8(p + 1) << 8 | v.getInt8(p + 2) << 16)) / 8388608;
            else if (bps === 4) s = v.getInt32(p, true) / 2147483648;
            else s = (v.getUint8(p) - 128) / 128;
            acc += s;
          }
          x[i] = acc / fmt.ch;
        }
        return { sr: fmt.sr, x };
      }
      o = b + len + (len & 1);
    }
    return null;
  }

  G.DSP = { rng, fft, spectrogramDb, quantise, maxOf, levelDb, activeRms, peak, burstDb, yin, lpcFormants, synthVowel, noise, encodeWav, decodeWav };
})(typeof self !== 'undefined' ? self : globalThis);
