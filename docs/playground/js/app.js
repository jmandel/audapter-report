/* Audapter Playground. Apache-2.0. Built by audit/playground/tools/build.mjs. */
self.AUD_DEFAULTS = {"female":[["downfact",3],["srate",16000],["framelen",32],["ndelay",5],["nwin",1],["nlpc",15],["nfmts",2],["ntracks",4],["scale",0.7952707287670507],["preemp",0.98],["rmsthr",0.011354028455474416],["rmsratio",0.7],["rmsff",0.95],["dfmtsff",0.93],["bgainadapt",0],["bshift",0],["btrack",1],["bdetect",1],["avglen",8],["bweight",1],["minvowellen",60],["bratioshift",1],["bmelshift",0],["bcepslift",0],["cepswinwidth",30],["bbypassfmt",0],["f2min",0],["f2max",5000],["f1min",0],["f1max",5000],["lbk",0],["lbb",0],["pertf1",{"fill":0,"n":257}],["pertf2",{"fill":0,"n":257}],["pertamp",{"fill":0,"n":257}],["pertphi",{"fill":0,"n":257}],["pertamp2d",{"fill":0,"n":66049}],["pertphi2d",{"fill":0,"n":66049}],["fb",1],["nfb",1],["triallen",0],["ramplen",0],["afact",1],["bfact",0.8],["gfact",1],["fn1",675],["fn2",1392],["fb2gain",1],["fb3gain",0],["fb4gaindb",10],["fb5gaindb_speech",0],["fb5gain_playback",1],["rmsff_fb",[0.8,0.99,0.1,0.1]],["bpitchshift",0],["bshift2d",0],["pitchshiftratio",1],["pvocframelen",256],["pvochop",64],["bdownsampfilt",1],["stereomode",1],["delayFrames",0],["btimedomainshift",0],["pitchlowerboundhz",0],["pitchupperboundhz",0],["timedomainpitchshiftschedule",1],["timedomainpitchshiftalgorithm",0],["bclampformants",0],["clamposts",[0,0]],["clampf1",{"fill":0,"n":2048}],["clampf2",{"fill":0,"n":2048}]],"male":[["downfact",3],["srate",16000],["framelen",32],["ndelay",5],["nwin",1],["nlpc",17],["nfmts",2],["ntracks",4],["scale",0.7952707287670507],["preemp",0.98],["rmsthr",0.011354028455474416],["rmsratio",0.7],["rmsff",0.95],["dfmtsff",0.93],["bgainadapt",0],["bshift",0],["btrack",1],["bdetect",1],["avglen",8],["bweight",1],["minvowellen",60],["bratioshift",1],["bmelshift",0],["bcepslift",0],["cepswinwidth",50],["bbypassfmt",0],["f2min",0],["f2max",5000],["f1min",0],["f1max",5000],["lbk",0],["lbb",0],["pertf1",{"fill":0,"n":257}],["pertf2",{"fill":0,"n":257}],["pertamp",{"fill":0,"n":257}],["pertphi",{"fill":0,"n":257}],["pertamp2d",{"fill":0,"n":66049}],["pertphi2d",{"fill":0,"n":66049}],["fb",1],["nfb",1],["triallen",0],["ramplen",0],["afact",1],["bfact",0.8],["gfact",1],["fn1",591],["fn2",1314],["fb2gain",1],["fb3gain",0],["fb4gaindb",10],["fb5gaindb_speech",0],["fb5gain_playback",1],["rmsff_fb",[0.8,0.99,0.1,0.1]],["bpitchshift",0],["bshift2d",0],["pitchshiftratio",1],["pvocframelen",256],["pvochop",64],["bdownsampfilt",1],["stereomode",1],["delayFrames",0],["btimedomainshift",0],["pitchlowerboundhz",0],["pitchupperboundhz",0],["timedomainpitchshiftschedule",1],["timedomainpitchshiftalgorithm",0],["bclampformants",0],["clamposts",[0,0]],["clampf1",{"fill":0,"n":2048}],["clampf2",{"fill":0,"n":2048}]]};
self.AUD_PARAM_TABLE = [{"name":"bshift","type":"bool","help":"Formant perturbation switch","line":123},{"name":"btrack","type":"bool","help":"Formant tracking switch","line":124},{"name":"bdetect","type":"bool","help":"Formant tracking period detection switch","line":125},{"name":"bweight","type":"bool","help":"Switch for intensity-weighted smoothing of formant frequencies","line":126},{"name":"bcepslift","type":"bool","help":"Switch for cepstral liftering for formant trackng","line":127},{"name":"btimedomainshift","type":"bool","help":"Perform time-domain pitch shifting, by tracking pitch in real-time, using cepstral method","line":128},{"name":"bratioshift","type":"bool","help":"Switch for ratio-based formant shifting","line":129},{"name":"bmelshift","type":"bool","help":"Switch for formant shifting based on the mel frequency scale","line":130},{"name":"bgainadapt","type":"bool","help":"Formant perturbation gain adaptation switch","line":131},{"name":"brmsclip","type":"bool","help":"Switch for auto RMS intensity clipping (loudness protection)","line":132},{"name":"bbypassfmt","type":"bool","help":"Switch for bypassing formant tracking (for use in pitch shifting and time warping","line":133},{"name":"bshift2d","type":"bool","help":"Switch for using F1 and F2 for formant perturbation, instead of just F2","line":134},{"name":"bpitchshift","type":"bool","help":"Pitch shifting switch","line":135},{"name":"bdownsampfilt","type":"bool","help":"Down-sampling filter switch","line":136},{"name":"mute","type":"bool","help":"Global mute switch","line":137},{"name":"bpvocmpnorm","type":"bool","help":"Phase vocoder amplitude normalization switch","line":138},{"name":"bclampformants","type":"bool","help":"Switch for using clamped formants passed in from Matlab","line":139},{"name":"srate","type":"int","help":"Sampling rate (Hz), after downsampling","line":142},{"name":"framelen","type":"int","help":"Frame length (samples), after downsampling","line":143},{"name":"ndelay","type":"int","help":"Number of delayed frames before an incoming frame is sent back","line":144},{"name":"nwin","type":"int","help":"Length of an internal frame (frames)","line":145},{"name":"nlpc","type":"int","help":"Order of LPC","line":146},{"name":"nfmts","type":"int","help":"Number of formants to be shifted","line":147},{"name":"ntracks","type":"int","help":"Number of formants to be tracked","line":148},{"name":"avglen","type":"int","help":"Formant smoothing window length (frames)","line":149},{"name":"cepswinwidth","type":"int","help":"Window width for cepstral liftering","line":150},{"name":"fb","type":"int","help":"Feedback mode (0-mute, 1-normal, 2-masking noise, 3-speech+noise, 4-speech modulated noise","line":151},{"name":"minvowellen","type":"int","help":"Minimum vowel length (frames)","line":152},{"name":"pvocframelen","type":"int","help":"Phase vocoder frame length (samples)","line":153},{"name":"pvochop","type":"int","help":"Phase vocoder frame hop (samples)","line":154},{"name":"nfb","type":"int","help":"Number of feedbac voices","line":155},{"name":"tsgntones","type":"int","help":"Tone sequence generator: number of tones","line":156},{"name":"downfact","type":"int","help":"Downsampling factor","line":157},{"name":"stereomode","type":"int","help":"Two-channel mode","line":158},{"name":"pvocampnormtrans","type":"int[]","help":"Phase vocoder amplitude normalization transitional period length (frames)","line":161},{"name":"delayframes","type":"int[]","help":"DAF global delay (frames): maxNVoices-long array","line":162},{"name":"clamposts","type":"int[]","help":"OST values to start [0] and stop [1] using clamped formant values","line":163},{"name":"scale","type":"double","help":"Output scaling factor (gain)","line":166},{"name":"preemp","type":"double","help":"Pre-emphasis factor","line":167},{"name":"rmsthr","type":"double","help":"RMS intensity threshold","line":168},{"name":"rmsratio","type":"double","help":"RMS ratio threshold","line":169},{"name":"rmsff","type":"double","help":"Forgetting factor for RMS intensity smoothing","line":170},{"name":"dfmtsff","type":"double","help":"Forgetting factor for formant smoothing (in status tracking)","line":171},{"name":"rmsclipthresh","type":"double","help":"Auto RMS intensity clipping threshold (loudness protection)","line":172},{"name":"wgfreq","type":"double","help":"Waveform generator: sine-wave frequency (Hz)","line":174},{"name":"wgamp","type":"double","help":"Waveform generator: sine-wave peak amplitude","line":175},{"name":"wgtime","type":"double","help":"Waveform generator: sine-wave duration (s)","line":176},{"name":"f2min","type":"double","help":"Formant perturbation field: minimum F2 (Hz)","line":178},{"name":"f2max","type":"double","help":"Formant perturbation field: maximum F2 (Hz)","line":179},{"name":"f1min","type":"double","help":"Formant perturbation field: minimum F1 (Hz)","line":180},{"name":"f1max","type":"double","help":"Formant perturbation field: maximum F1 (Hz)","line":181},{"name":"lbk","type":"double","help":"Formant perturbation field: Oblique lower border: Slope k","line":182},{"name":"lbb","type":"double","help":"Formant perturbation field: Oblique lower border: Intercept b","line":183},{"name":"triallen","type":"double","help":"Trial length (s)","line":185},{"name":"ramplen","type":"double","help":"Audio ramp length (s)","line":186},{"name":"afact","type":"double","help":"Formant-tracking algorithm: alpha","line":188},{"name":"bfact","type":"double","help":"Formant-tracking algorithm: beta","line":189},{"name":"gfact","type":"double","help":"Formant-tracking algorithm: gamma","line":190},{"name":"fn1","type":"double","help":"Formant-tracking algorithm: F1 prior","line":191},{"name":"fn2","type":"double","help":"Formant-tracking algorithm: F2 prior","line":192},{"name":"pitchlowerboundhz","type":"double","help":"Lower bound for pitch, in Hz. Used by pitch tracker.","line":194},{"name":"pitchupperboundhz","type":"double","help":"Upper bound for pitch, in Hz. Used by pitch tracker.","line":195},{"name":"fb2gain","type":"double","help":"Noise gain factor for noise only mode","line":197},{"name":"fb3gain","type":"double","help":"Noise gain factor for speech+noise feedback mode","line":198},{"name":"fb4gaindb","type":"double","help":"Speech-modulated noise feedback: intensity gain factor","line":199},{"name":"fb5gaindb_speech","type":"double","help":"Feedback mode 5: gain (in dB) for speech-modulated component","line":200},{"name":"fb5gain_playback","type":"double","help":"Feedback mode 5: gain (linear scaling factor) for constant component","line":201},{"name":"pitchshiftratio","type":"double[]","help":"Pitch-shifting: ratio (1.0 = no shift)","line":204},{"name":"datapb","type":"double[]","help":"Waveform for playback","line":206},{"name":"pertf1","type":"double[]","help":"Formant perturbation field: F1 grid (Hz)","line":207},{"name":"pertf2","type":"double[]","help":"Formant perturbation field: F2 grid (Hz)","line":208},{"name":"pertamp","type":"double[]","help":"Formant perturbation field: Perturbation vector amplitude","line":209},{"name":"pertphi","type":"double[]","help":"Formant perturbation field: Perturbation vector angle","line":210},{"name":"gain","type":"double[]","help":"Global intensity gain","line":211},{"name":"tsgtonedur","type":"double[]","help":"Tone sequence generator: tone durations (s)","line":213},{"name":"tsgtonefreq","type":"double[]","help":"Tone sequence generator: tone frequencies (Hz)","line":214},{"name":"tsgtoneamp","type":"double[]","help":"Tone sequence generator: tone peak amplitudes","line":215},{"name":"tsgtoneramp","type":"double[]","help":"Tone sequence generator: tone ramp durations (s)","line":216},{"name":"tsgint","type":"double[]","help":"Tone sequence generator: intervals between tone onsets (s)","line":217},{"name":"clampf1","type":"double[]","help":"F1 values used during clamped signal output","line":218},{"name":"clampf2","type":"double[]","help":"F2 values used during clamped signal output","line":219},{"name":"pertamp2d","type":"double[][]","help":"Formant perturbation field: Perturbation vector amplitude for F1-F2","line":222},{"name":"pertphi2d","type":"double[][]","help":"Formant perturbation field: Perturbation vector angle for F1-F2","line":223},{"name":"rmsff_fb","type":"double[]","help":"Speech-modulated noise feedback: RMS forgetting factor","line":226},{"name":"pvocwarp","type":"warp","help":"Phase vocoder time warping configuration","line":227},{"name":"timedomainpitchshiftschedule","type":"double[]","help":"Time-domain pitch shift schedule: Can take one of the following formats.\n1. A single number: Applies a constant pitch shift.\n2. An length-n*2 1D array, where n is the number of time points, of alternating time \n  points and pitch-shift ratios.  The time points (in seconds) are required to be monotonically increasing.\n  The first element is required to be 0.\n  The time points are anchor points. The amount\n  of pitch shift between the anchor points are interpolated linearly. For time periods\n  after the last time point in the array, the amount of the last time point will be\n  used.\nEach pitch-shift amount is defined in the same way as parameter 'pitchshiftratio', i.e.,\n1.0 corresponds to no shift. Each pitch-shift amount is required to be a positive number.","line":228},{"name":"timedomainpitchshiftalgorithm","type":"enum","help":"Time-domain pitch shift algorithm: Can take one of the following values.\n0 - pp_none: does not adjust pitch cycles (default).\n1 - pp_peaks: adjusts pitch cycle based on waveform maximum.\n2 - pp_valleys: adjusts pitch cycle based on waveform minimum.","line":243}];
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

;
// Playground settings model, shared by the page and the engine worker (no DOM).
// A settings object is small, readable JSON. compile() turns it into exactly what MATLAB would send:
// an ordered list of Audapter setParam calls (blab AudapterIO('init') order) plus OST and PCF texts.
(function (G) {
  'use strict';
  const DEF = G.AUD_DEFAULTS;          // { female: [[name, value], ...], male: [...] } recorded from blab AudapterIO('init')
  const decode = v => (v && typeof v === 'object' && !Array.isArray(v) && 'fill' in v) ? new Array(v.n).fill(v.fill) : v;
  const hz2mel = f => 1127.01048 * Math.log(1 + f / 700);   // Audapter utils.cpp hz2mel
  const clone = o => JSON.parse(JSON.stringify(o));
  const GRID = 257, FMAX = 5000;
  const noiseCache = new Map();

  // ---------- presets: starting points built on the recorded blab defaults
  const PRESETS = {
    female: { label: 'Adult female', sex: 'female', params: {},
      note: 'blab getAudapterDefaultParams(\'female\'): nLPC 15, frameLen 32, nDelay 5.' },
    male: { label: 'Adult male', sex: 'male', params: {},
      note: 'blab getAudapterDefaultParams(\'male\'): nLPC 17. On some low /a/ vowels it reports F3 as F2 (CORPUS-4).' },
    child: { label: 'Child', sex: 'female', params: { nlpc: 11 },
      note: 'Female defaults with nLPC 11. With nLPC 15, F2 of 6-7-year-olds was underestimated by about 12 % (CORPUS-3).' },
    lowvoice: { label: 'Low voice, upstream demo', sex: 'male', params: { framelen: 64, ndelay: 7, bcepslift: 1, pitchlowerboundhz: 80, pitchupperboundhz: 160 },
      note: 'Male defaults with frameLen 64 and nDelay 7, as upstream time_domain_shift_demo.m. A longer analysis window, so pitch below ~180 Hz is tracked (CORPUS-8), at 14 ms more delay.' },
  };

  // ---------- timeline design (the "Timing & design" tab): blocks anchored to events Audapter's level rules can detect
  // ref: {ev: 't0'|'on'|'off'|'dur'|'none', k: sound number (1-based), ms: offset after the event}
  function defaultDesign() {
    return { template: 'step', tpl: { delay: 200, jitter: 0, start: 20, n: 2, at: 300, dur: 150, hold: 500 },
      detect: { auto: true, onDb: -12, offDb: -18, onThresh: 0.02, onHold: 0.02, offThresh: 0.01, offMin: 0.02 },
      blocks: [{ start: { ev: 'on', k: 1, ms: 200 }, end: { ev: 'none', k: 1, ms: 0 }, what: { f1: 20, f2: 0, st: 0, db: 0 } }] };
  }
  const TEMPLATES = {
    whole: { label: 'Whole utterance', blurb: 'On for the whole trial.', controls: [],
      blocks: t => [{ start: { ev: 't0', k: 1, ms: 0 }, end: { ev: 'none', k: 1, ms: 0 } }] },
    step: { label: 'Sudden step after voice onset', blurb: 'Turns on a fixed time after the voice starts and stays on.', controls: [['delay', 'Delay after voice onset', 'ms', 20, 2000, 10], ['jitter', 'Random extra delay, up to', 'ms', 0, 1000, 10]],
      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.delay }, end: { ev: 'none', k: 1, ms: 0 } }] },
    vowel: { label: 'During the vowel only', blurb: 'From voice onset to the end of the first sound.', controls: [['start', 'Start after voice onset', 'ms', 20, 1000, 10]],
      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.start }, end: { ev: 'off', k: 1, ms: 0 } }] },
    nth: { label: 'Nth word or syllable', blurb: 'Only during one sound, as Audapter\'s level rules count them.', controls: [['n', 'Sound number', '', 1, 20, 1]],
      blocks: t => [{ start: { ev: 'on', k: Math.max(1, t.n | 0), ms: 20 }, end: { ev: 'off', k: Math.max(1, t.n | 0), ms: 0 } }] },
    pulse: { label: 'Brief pulse', blurb: 'A short perturbation some time after voice onset.', controls: [['at', 'Starts after voice onset', 'ms', 20, 3000, 10], ['dur', 'Lasts', 'ms', 10, 1000, 10]],
      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.at }, end: { ev: 'dur', k: 1, ms: t.dur } }] },
    stepback: { label: 'Step, then return', blurb: 'On after voice onset, then back to normal while the voice continues.', controls: [['delay', 'Delay after voice onset', 'ms', 20, 2000, 10], ['hold', 'Stays on for', 'ms', 50, 5000, 10]],
      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.delay }, end: { ev: 'dur', k: 1, ms: t.hold } }] },
  };
  const refText = (r, isEnd) => r.ev === 't0' ? (r.ms ? `${r.ms} ms into the trial` : 'the trial start') : r.ev === 'none' ? 'the end of the trial'
    : r.ev === 'dur' ? `${r.ms} ms later` : `${r.ms ? r.ms + ' ms after ' : ''}sound ${r.k} ${r.ev === 'on' ? 'starts' : 'ends'}`;

  // Compile blocks to a linear OST chain. Every "sound ends" rule (INTENSITY_FALL) comes after the matching "sound starts"
  // rule (INTENSITY_RISE_HOLD), which sets Audapter's lastStatEnd within the trial, so no rule depends on the previous
  // trial (OST-F1); no maxIOI (OST-F2) and no AND_RATIO rules (OST-F8) are used.
  function compileDesign(d) {
    const det = d.detect, rules = [], bounds = [], errors = [], notes = [];
    let s = 0, next = { ev: 'on', k: 1 }, known = true, abs = 0;
    const evIdx = r => (r.k - 1) * 2 + (r.ev === 'off' ? 1 : 0), nextIdx = () => evIdx(next);
    const add = (mode, p1, p2, span) => { rules.push({ stat: s, mode, p1, p2, p3: null }); s += span; };
    function to(ref, label, startState) {
      if (ref.ev === 'none') return null;
      if (ref.ev === 't0') {
        if (!known) { errors.push(`${label}: Audapter can only time from the trial start while nothing else has been detected yet. Anchor it to a sound instead.`); return s; }
        const dt = ref.ms / 1000 - abs;
        if (dt < 0) { errors.push(`${label}: it comes before the previous boundary.`); return s; }
        if (dt > 0) add('ELAPSED_TIME', dt, NaN, 1);
        abs = ref.ms / 1000; return s;
      }
      if (ref.ev === 'dur') { if (ref.ms > 0) add('ELAPSED_TIME', ref.ms / 1000, NaN, 1); abs += ref.ms / 1000; return s; }
      const target = evIdx(ref);
      if (target < nextIdx()) { errors.push(`${label}: sound ${ref.k} ${ref.ev === 'on' ? 'start' : 'end'} has already gone by at this point of the design; Audapter's rules only move forward.`); return s; }
      while (nextIdx() <= target) {
        if (next.ev === 'on') { add('INTENSITY_RISE_HOLD', det.onThresh, det.onHold, 2); next = { ev: 'off', k: next.k }; }
        else { add('INTENSITY_FALL', det.offThresh, det.offMin, 1); next = { ev: 'on', k: next.k + 1 }; }
      }
      known = false;
      let extra = ref.ms / 1000 - (ref.ev === 'on' ? det.onHold : 0);
      if (extra < -1e-9) { notes.push(`${label}: Audapter confirms a voice onset only after the ${Math.round(det.onHold * 1000)} ms hold, so the earliest start is onset + ${Math.round(det.onHold * 1000)} ms.`); extra = 0; }
      if (extra > 1e-9) add('ELAPSED_TIME', extra, NaN, 1);
      return s;
    }
    d.blocks.forEach((b, i) => {
      const a = to(b.start, `Block ${i + 1} start`);
      if (a === null) { errors.push(`Block ${i + 1} needs a start.`); return; }
      if (b.end.ev === 'dur' && !(b.end.ms > 0)) errors.push(`Block ${i + 1} has no duration.`);
      const e = to(b.end, `Block ${i + 1} end`);
      bounds.push({ block: i, start: a, end: e === null ? Infinity : e });
      if (e === null && i < d.blocks.length - 1) errors.push(`Block ${i + 1} lasts to the end of the trial, so later blocks can never start.`);
    });
    rules.push({ stat: s, mode: 'OST_END', p1: NaN, p2: NaN, p3: null });
    const nStates = s + 1, whatOf = [];
    for (let k = 0; k < nStates; k++) { const b = bounds.find(x => k >= x.start && k < x.end); whatOf.push(b ? { block: b.block, ...d.blocks[b.block].what } : null); }
    return { ost: { rmsSlopeWin: 0.03, rules, maxIOI: [] }, nStates, whatOf, bounds, errors, notes };
  }

  // ---------- vowel variability field (inward / outward): heard = centre + k (spoken - centre), k = 1 -/+ strength.
  // Compiled to Audapter's 2-D field with absolute units (bRatioShift = 0): sF1 = F1 + amp cos(phi), sF2 = F2 + amp sin(phi)
  // (Audapter.cpp:1858-1860), pertAmp2D[i][j] with i = F1 grid index, j = F2 grid index (MATLAB column-major i + 257 j).
  // Audapter reads the lower-left cell without interpolating (FMT-F3), so each cell holds the value at its centre:
  // the applied shift is piecewise constant, within half a grid step of the intended one per axis.
  const variCache = { key: '', v: null };
  const mel2hz = m => 700 * (Math.exp(m / 1127.01048) - 1);
  function variField(v) {
    const key = JSON.stringify(v);
    if (variCache.key === key) return variCache.v;
    const mel = v.units === 'mel', cv = f => (mel ? hz2mel(f) : f);
    const c1 = cv(v.c1), c2 = cv(v.c2);
    const lo1 = cv(Math.max(60, v.c1 - v.ext1)), hi1 = cv(v.c1 + v.ext1), lo2 = cv(Math.max(200, v.c2 - v.ext2)), hi2 = cv(v.c2 + v.ext2);
    const g1 = Array.from({ length: GRID }, (_, i) => lo1 + (hi1 - lo1) * i / (GRID - 1)), g2 = Array.from({ length: GRID }, (_, j) => lo2 + (hi2 - lo2) * j / (GRID - 1));
    const st1 = g1[1] - g1[0], st2 = g2[1] - g2[0], k = (v.strength || 0) / 100, sign = v.dir === 'out' ? 1 : -1;
    const A2 = new Array(GRID * GRID).fill(0), P2 = new Array(GRID * GRID).fill(0);
    for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {
      const d1 = g1[i] + st1 / 2 - c1, d2 = g2[j] + st2 / 2 - c2, dist = Math.hypot(d1, d2);
      let amp = k * dist; if (v.maxShift > 0) amp = Math.min(amp, v.maxShift);
      A2[i + GRID * j] = amp; P2[i + GRID * j] = dist > 0 ? Math.atan2(sign * d2, sign * d1) : 0;
    }
    const out = { g1, g2, A2, P2, mel, c1, c2, step1: st1, step2: st2, lo1, hi1, lo2, hi2 };
    variCache.key = key; variCache.v = out;
    return out;
  }
  // Audapter's 2-D lookup (locateF1/locateF2 binary search, Audapter.cpp:2675-2727, then the lower-left cell) and shift,
  // for a compiled parameter map. Returns [sF1, sF2] in Hz, or null outside the field bounds.
  function apply2D(m, f1, f2) {
    const g1 = m.get('pertf1'), g2 = m.get('pertf2'), A = m.get('pertamp2d'), P = m.get('pertphi2d');
    const mel = Number([].concat(m.get('bmelshift'))[0]) === 1, ratio = Number([].concat(m.get('bratioshift'))[0]) === 1;
    const x1 = mel ? hz2mel(f1) : f1, x2 = mel ? hz2mel(f2) : f2;
    const b = k => Number([].concat(m.get(k))[0]);
    if (!(x2 >= b('f2min') && x2 <= b('f2max') && x1 >= b('f1min') && x1 <= b('f1max'))) return null;
    const locate = (g, f) => {
      let k = 128; for (let n = 0; n < 7; n++) k += (f >= g[k] ? 1 : -1) * (1 << (6 - n));
      if (f < g[k]) k--;
      let loc = k + (f - g[k]) / (g[k + 1] - g[k]);
      if (loc >= GRID - 1) loc = GRID - 1 - 1e-12; if (loc < 0) loc = 0;
      return Math.floor(loc);
    };
    const i = locate(g1, x1), j = locate(g2, x2), amp = A[i + GRID * j], phi = P[i + GRID * j];
    const s1 = ratio ? x1 * (1 + amp * Math.cos(phi)) : x1 + amp * Math.cos(phi), s2 = ratio ? x2 * (1 + amp * Math.sin(phi)) : x2 + amp * Math.sin(phi);
    return mel ? [mel2hz(s1), mel2hz(s2)] : [s1, s2];
  }
  // The intended (smooth) heard point for the variability field, in Hz.
  function variIntended(v, f1, f2) {
    const mel = v.units === 'mel', cv = f => (mel ? hz2mel(f) : f), inv = x => (mel ? mel2hz(x) : x);
    const c1 = cv(v.c1), c2 = cv(v.c2), x1 = cv(f1), x2 = cv(f2), d1 = x1 - c1, d2 = x2 - c2, dist = Math.hypot(d1, d2);
    let amp = (v.strength / 100) * dist; if (v.maxShift > 0) amp = Math.min(amp, v.maxShift);
    const sg = v.dir === 'out' ? 1 : -1, u1 = dist ? sg * d1 / dist : 0, u2 = dist ? sg * d2 / dist : 0;
    return [inv(x1 + amp * u1), inv(x2 + amp * u2)];
  }

  function defaultSettings() {
    return {
      v: 1, preset: 'female', build: 'lite',
      shift: {
        formant: { on: true, units: 'pct', f1: 20, f2: 0, field: 'all',
          region: { f1min: 250, f1max: 1000, f2min: 600, f2max: 3000 },
          curve: [[800, 0, 0], [1500, 20, 0], [2500, 0, 0]],
          painted: { res: 4, cells: [] },
          vari: { dir: 'in', strength: 50, maxShift: 0, centre: 'auto', c1: 600, c2: 1700, units: 'hz', ext1: 450, ext2: 900 } },
        pitch: { on: false, method: 'pvoc', semitones: 2, algorithm: 0, lower: null, upper: null, ramp: 0.05 },
        loudness: { on: false, db: 6 },
        timing: { on: false, rate1: 0.5, dur1: 0.1, hold: 0.1, rate2: 2 },
        delay: { on: false, ms: 100 },
      },
      when: { mode: 'always', after: 0.3, until: 1.0, onThresh: 0.02, onHold: 0.02, offThresh: 0.01, offHold: 0.02, onDelay: 0, ost: '', pcf: '' },
      design: defaultDesign(),
      listen: {},
      hear: { fb: 1, noise: { type: 'pink', seconds: 10, level: -20, gain: 1 }, gainDb: 0 },
      raw: {},
    };
  }

  // Deep-merge onto defaults so partial / older JSON loads safely.
  function normalize(s) {
    const d = defaultSettings();
    const merge = (a, b) => {
      if (b === undefined || b === null) return a;
      if (Array.isArray(a) || typeof a !== 'object' || a === null) return b;
      const o = { ...a };
      for (const k of Object.keys(b)) o[k] = (k in a) ? merge(a[k], b[k]) : b[k];
      return o;
    };
    const o = merge(d, s || {});
    if (!PRESETS[o.preset]) o.preset = 'female';
    return o;
  }

  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  function setPath(o, p, v) { const ks = p.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null) a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; return o; }

  // Base parameter map (ordered) for a preset, after the "how Audapter listens" overrides.
  function baseParams(s) {
    const pr = PRESETS[s.preset] || PRESETS.female;
    const m = new Map(DEF[pr.sex].map(([k, v]) => [k.toLowerCase(), decode(v)]));
    const put = (k, v) => { if (v !== undefined && v !== null && v !== '') m.set(k.toLowerCase(), v); };
    for (const [k, v] of Object.entries(pr.params)) put(k, v);
    for (const [k, v] of Object.entries(s.listen || {})) put(k, v);
    return m;
  }
  const num = (m, k) => { const v = m.get(k); return Array.isArray(v) ? Number(v[0]) : Number(v); };

  // ---------- OST / PCF text formats
  const OST_MODES = {
    OST_END: { code: 0, span: 0, sets: false, params: [], text: 'Final state: nothing happens after this.' },
    ELAPSED_TIME: { code: 1, span: 1, sets: false, params: ['duration (s)'],
      text: 'Move on after a fixed time in this state.' },
    INTENSITY_RISE_HOLD: { code: 5, span: 2, sets: true, params: ['level threshold (RMS)', 'hold (s)'],
      text: 'Level rises above the threshold (next state), and moves on once it has stayed above it for the hold time; drops back if it falls first.' },
    INTENSITY_RISE_HOLD_POS_SLOPE: { code: 6, span: 2, sets: true, params: ['level threshold (RMS)', 'hold (s)'],
      text: 'Like the rise-and-hold rule, but the level must also keep rising during the hold.' },
    POS_INTENSITY_SLOPE_STRETCH: { code: 10, span: 2, sets: true, params: ['frames of rising level'],
      text: 'The level keeps rising for more than the given number of frames.' },
    NEG_INTENSITY_SLOPE_STRETCH_SPAN: { code: 11, span: 2, sets: true, params: ['frames of falling level', 'summed slope below'],
      text: 'The level keeps falling for more than the given number of frames, by more than the given total slope.' },
    INTENSITY_SLOPE_BELOW_THRESH: { code: 12, span: 2, sets: true, params: ['slope threshold', 'duration (s)'],
      text: 'The level slope stays below the threshold for the duration.' },
    INTENSITY_SLOPE_ABOVE_THRESH: { code: 13, span: 2, sets: true, params: ['slope threshold', 'duration (s)'],
      text: 'The level slope stays above the threshold for the duration.' },
    INTENSITY_FALL: { code: 20, span: 1, sets: true, params: ['level threshold (RMS)', 'minimum time (s)'],
      text: 'Level has been below the threshold for 10 ms, and more than the minimum time has passed since the last level-based state change.' },
    INTENSITY_BELOW_THRESH_NEG_SLOPE: { code: 21, span: 2, sets: true, params: ['level threshold (RMS)', 'duration (s)'],
      text: 'Level is below the threshold and falling, for the duration.' },
    INTENSITY_RATIO_RISE: { code: 30, span: 3, sets: true, params: ['ratio threshold', 'hold (s)'],
      text: 'The high-frequency energy ratio (high for /s/-like sounds) rises above the threshold, holds, then falls back.' },
    INTENSITY_RATIO_FALL_HOLD: { code: 31, span: 3, sets: true, params: ['ratio threshold', 'hold (s)'],
      text: 'The high-frequency energy ratio falls below the threshold and holds.' },
    INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR: { code: 32, span: 2, sets: false, params: ['ratio threshold', 'hold (s)'],
      text: 'The high-frequency energy ratio stays above the threshold (ignored when the level is below 0.0003).' },
    INTENSITY_AND_RATIO_ABOVE_THRESH: { code: 40, span: 2, sets: true, params: ['level threshold (RMS)', 'ratio threshold', 'hold (s)'],
      text: 'Both level and high-frequency ratio are above their thresholds, for the hold time. Blab reads the hold from the 5th field, where the manual puts {} (OST-F8).' },
    INTENSITY_AND_RATIO_BELOW_THRESH: { code: 45, span: 2, sets: true, params: ['level threshold (RMS)', 'ratio threshold', 'hold (s)'],
      text: 'Both level and high-frequency ratio are below their thresholds, for the hold time (hold in the 5th field, OST-F8).' },
  };
  const OST_BY_CODE = Object.fromEntries(Object.entries(OST_MODES).map(([k, v]) => [v.code, k]));
  const fmtNum = v => (v === null || v === undefined || Number.isNaN(v)) ? 'NaN' : String(+Number(v).toPrecision(6));

  function parseOst(text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
    const out = { rmsSlopeWin: 0.03, rules: [], maxIOI: [], errors: [] };
    if (!lines.length) return out;
    let i = 0;
    const m0 = /^rmsSlopeWin\s*=\s*(\S+)$/.exec(lines[i]);
    if (!m0) out.errors.push(`line 1: expected "rmsSlopeWin = <s>", got "${lines[i]}"`); else { out.rmsSlopeWin = +m0[1]; i++; }
    const m1 = /^n\s*=\s*(\d+)$/.exec(lines[i] || '');
    if (!m1) { out.errors.push(`expected "n = <number of rules>"`); return out; }
    const n = +m1[1]; i++;
    for (let k = 0; k < n; k++, i++) {
      const it = (lines[i] || '').split(/[\s,]+/).filter(Boolean);
      if (it.length !== 5) { out.errors.push(`rule ${k + 1}: expected 5 fields, got ${it.length} ("${lines[i] || ''}")`); continue; }
      let mode = it[1];
      if (/^\d+$/.test(mode)) mode = OST_BY_CODE[+mode] || mode;
      if (!OST_MODES[mode]) out.errors.push(`rule ${k + 1}: unknown mode "${it[1]}"`);
      const p = x => (x === '{}' ? null : x.toLowerCase() === 'nan' ? NaN : +x);
      out.rules.push({ stat: +it[0], mode, p1: p(it[2]), p2: p(it[3]), p3: p(it[4]) });
    }
    const m2 = /^n\s*=\s*(\d+)$/.exec(lines[i] || '');
    if (m2) {
      i++;
      for (let k = 0; k < +m2[1]; k++, i++) {
        const it = (lines[i] || '').split(/[\s,]+/).filter(Boolean);
        if (it.length !== 3) { out.errors.push(`maxIOI line ${k + 1}: expected 3 fields`); continue; }
        out.maxIOI.push({ stat0: +it[0], interval: +it[1], stat1: +it[2] });
      }
    }
    return out;
  }
  function serializeOst(o) {
    const f = v => (v === null || v === undefined) ? '{}' : fmtNum(v);
    return `rmsSlopeWin = ${Number(o.rmsSlopeWin ?? 0.03).toFixed(6)}\n\nn = ${o.rules.length}\n` +
      o.rules.map(r => `${r.stat} ${r.mode} ${f(r.p1)} ${f(r.p2)} ${f(r.p3)}`).join('\n') +
      `\n\nn = ${o.maxIOI.length}\n` + o.maxIOI.map(m => `${m.stat0} ${fmtNum(m.interval)} ${m.stat1}`).join('\n') + (o.maxIOI.length ? '\n' : '');
  }
  function ostStateCount(o) {
    let mx = 0;
    for (const r of o.rules) mx = Math.max(mx, r.stat + (OST_MODES[r.mode] ? OST_MODES[r.mode].span : 0));
    for (const m of o.maxIOI) mx = Math.max(mx, m.stat1, m.stat0);
    return o.rules.length ? mx + 1 : 0;
  }
  function parsePcf(text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
    const out = { warps: [], rows: [], errors: [] };
    if (!lines.length) return out;
    let i = 0;
    const nw = +lines[i++];
    if (!Number.isInteger(nw)) { out.errors.push('line 1: expected the number of time-warp events'); return out; }
    for (let k = 0; k < nw; k++, i++) {
      const it = (lines[i] || '').split(/[\s,]+/).filter(Boolean).map(Number);
      if (it.length === 5) out.warps.push({ ostInitState: null, tBegin: it[0], rate1: it[1], dur1: it[2], hold: it[3], rate2: it[4] });
      else if (it.length === 6) out.warps.push({ ostInitState: it[0], tBegin: it[1], rate1: it[2], dur1: it[3], hold: it[4], rate2: it[5] });
      else out.errors.push(`warp ${k + 1}: expected 5 or 6 fields`);
    }
    const n = +lines[i++];
    if (!Number.isInteger(n)) { out.errors.push('expected the number of state rows'); return out; }
    for (let k = 0; k < n; k++, i++) {
      const it = (lines[i] || '').split(/[\s,]+/).filter(Boolean).map(Number);
      if (it.length !== 5) { out.errors.push(`row ${k + 1}: expected 5 fields (state, pitch st, level dB, formant amp, formant angle)`); continue; }
      if (it[0] !== k) out.errors.push(`row ${k + 1}: state number must be ${k} (Audapter rejects out-of-order rows)`);
      out.rows.push({ stat: it[0], pitch: it[1], db: it[2], amp: it[3], phi: it[4] });
    }
    return out;
  }
  function serializePcf(o) {
    const w = o.warps.map(x => (x.ostInitState === null || x.ostInitState === undefined ? '' : `${x.ostInitState}, `) +
      [x.tBegin, x.rate1, x.dur1, x.hold, x.rate2].map(fmtNum).join(', '));
    return `${o.warps.length}\n${w.join('\n')}${w.length ? '\n' : ''}\n${o.rows.length}\n` +
      o.rows.map((r, i) => `${i}, ${fmtNum(r.pitch)}, ${fmtNum(r.db)}, ${fmtNum(r.amp)}, ${fmtNum(r.phi)}`).join('\n') + '\n';
  }

  // ---------- formant perturbation vector in Audapter's units
  function fmtVector(fm) {
    if (fm.units === 'pct') return { amp: Math.hypot(fm.f1 / 100, fm.f2 / 100), phi: Math.atan2(fm.f2 / 100, fm.f1 / 100) };
    return { amp: Math.hypot(fm.f1, fm.f2), phi: Math.atan2(fm.f2, fm.f1) };   // Hz or mel
  }
  const unitsFlags = u => (u === 'pct' ? { bratioshift: 1, bmelshift: 0 } : u === 'hz' ? { bratioshift: 0, bmelshift: 0 } : { bratioshift: 0, bmelshift: 1 });

  // ---------- compile: settings -> { list: [[name, value]], ost, pcf, notes, meta }
  function compile(settings) {
    const s = normalize(settings), m = baseParams(s), notes = [];
    const sr = num(m, 'srate'), frameLen = num(m, 'framelen'), nDelay = num(m, 'ndelay');
    const F = s.shift.formant, Pi = s.shift.pitch, L = s.shift.loudness, T = s.shift.timing, D = s.shift.delay, W = s.when;
    const isDesign = W.mode === 'design', cd = isDesign ? compileDesign(s.design) : null;
    const anyW = k => isDesign && s.design.blocks.some(b => b.what && b.what[k]);
    const fOn = isDesign ? (anyW('f1') || anyW('f2')) : F.on && (F.f1 !== 0 || F.f2 !== 0 || F.field === 'curve' || F.field === 'painted' || F.field === 'variability');
    const pvoc = isDesign ? anyW('st') : Pi.on && Pi.method === 'pvoc', tds = !isDesign && Pi.on && Pi.method === 'tds';
    const timeWhen = W.mode !== 'always';
    // A PCF is needed for anything per-state: level shifts, time warps, pvoc pitch or formant shifts that are not always on.
    const needPcf = isDesign || W.mode === 'custom' || (L.on && L.db !== 0) || (T.on && !isDesign) || (timeWhen && (fOn || pvoc));
    if (isDesign) {
      if (Pi.on && Pi.method === 'tds' && anyW('st')) notes.push({ where: 'when', text: 'Time-domain pitch shifting follows its own schedule, not OST states, so a timeline design shifts pitch with the phase vocoder.' });
      if (T.on) notes.push({ where: 'when', text: 'The time-warp card is not used by a timeline design.' });
      if (F.on && F.field !== 'all') notes.push({ where: 'when', text: 'A timeline design uses a PCF, so the formant shift is uniform (the field shape is not used).' });
    }
    const vec = fmtVector(F), mel = F.units === 'mel';

    // formant shift
    if (fOn || (W.mode === 'custom' && F.on)) {
      m.set('bshift', 1);
      for (const [k, v] of Object.entries(unitsFlags(F.units))) m.set(k, v);
      const top = mel ? hz2mel(FMAX) : FMAX, grid = Array.from({ length: GRID }, (_, i) => top * i / (GRID - 1));
      m.set('pertf1', grid); m.set('pertf2', grid);
      const cv = f => (mel ? hz2mel(f) : f);
      if (!needPcf && F.field === 'region') {
        m.set('f1min', cv(F.region.f1min)); m.set('f1max', cv(F.region.f1max)); m.set('f2min', cv(F.region.f2min)); m.set('f2max', cv(F.region.f2max));
      }
      if (!needPcf && F.field === 'curve') {
        const pts = [...F.curve].sort((a, b) => a[0] - b[0]), amp = [], phi = [];
        for (let i = 0; i < GRID; i++) {
          const f2 = FMAX * i / (GRID - 1);
          let d1 = 0, d2 = 0;
          if (pts.length) {
            if (f2 <= pts[0][0]) [, d1, d2] = pts[0];
            else if (f2 >= pts[pts.length - 1][0]) [, d1, d2] = pts[pts.length - 1];
            else for (let k = 0; k < pts.length - 1; k++) if (f2 >= pts[k][0] && f2 <= pts[k + 1][0]) {
              const u = (f2 - pts[k][0]) / Math.max(1e-9, pts[k + 1][0] - pts[k][0]);
              d1 = pts[k][1] + u * (pts[k + 1][1] - pts[k][1]); d2 = pts[k][2] + u * (pts[k + 1][2] - pts[k][2]); break;
            }
          }
          const v = fmtVector({ units: F.units, f1: d1, f2: d2 }); amp.push(v.amp); phi.push(v.phi);
        }
        m.set('pertamp', amp); m.set('pertphi', phi);
      } else if (!needPcf && F.field === 'painted') {
        const A2 = new Array(GRID * GRID).fill(0), P2 = new Array(GRID * GRID).fill(0), r = F.painted.res || 4;
        for (const [ci, cj, d1, d2] of F.painted.cells) {
          const v = fmtVector({ units: F.units, f1: d1, f2: d2 });
          for (let i = ci * r; i < Math.min(GRID, ci * r + r); i++) for (let j = cj * r; j < Math.min(GRID, cj * r + r); j++) {
            A2[i + GRID * j] = v.amp; P2[i + GRID * j] = v.phi;   // MATLAB column-major: row i = F1 index, column j = F2 index
          }
        }
        m.set('bshift2d', 1); m.set('pertamp2d', A2); m.set('pertphi2d', P2);
        m.set('pertamp', new Array(GRID).fill(0)); m.set('pertphi', new Array(GRID).fill(0));
      } else {
        m.set('pertamp', new Array(GRID).fill(needPcf ? 0 : vec.amp)); m.set('pertphi', new Array(GRID).fill(needPcf ? 0 : vec.phi));
      }
      if (!needPcf && F.field === 'variability') {
        const V = variField(F.vari);
        m.set('bratioshift', 0); m.set('bmelshift', V.mel ? 1 : 0); m.set('bshift2d', 1);
        m.set('pertf1', V.g1); m.set('pertf2', V.g2); m.set('pertamp2d', V.A2); m.set('pertphi2d', V.P2);
        m.set('pertamp', new Array(GRID).fill(0)); m.set('pertphi', new Array(GRID).fill(0));
        m.set('f1min', V.g1[0]); m.set('f1max', V.g1[GRID - 1]); m.set('f2min', V.g2[0]); m.set('f2max', V.g2[GRID - 1]);
      }
      if (needPcf && F.field !== 'all') notes.push({ where: 'formant', text: 'A PCF is in use (for the timing, loudness or "when" settings), so Audapter takes the formant shift from the PCF row and ignores the field shape: the shift is uniform.' });
    }

    // pitch
    if (pvoc || (T.on && !isDesign)) {
      m.set('bpitchshift', 1); m.set('btimedomainshift', 0);
      m.set('pitchshiftratio', pvoc && !needPcf ? Math.pow(2, Pi.semitones / 12) : 1);
    }
    if (tds) {
      m.set('btimedomainshift', 1); m.set('bpitchshift', 0); m.set('bcepslift', 1);
      const sex = PRESETS[s.preset].sex, dl = s.preset === 'child' ? [200, 450] : sex === 'male' ? [80, 160] : [150, 300];
      m.set('pitchlowerboundhz', Pi.lower ?? (num(m, 'pitchlowerboundhz') || dl[0]));
      m.set('pitchupperboundhz', Pi.upper ?? (num(m, 'pitchupperboundhz') || dl[1]));
      const r = Math.pow(2, Pi.semitones / 12), ramp = Math.max(0.001, Pi.ramp || 0.001);
      let sch = [0, r];
      if (W.mode === 'after') sch = [0, 1, W.after, 1, W.after + ramp, r];
      else if (W.mode === 'window') sch = [0, 1, W.after, 1, W.after + ramp, r, Math.max(W.until, W.after + ramp + 0.001), r, Math.max(W.until, W.after + ramp + 0.001) + ramp, 1];
      else if (W.mode === 'vowel' && W.onDelay > 0) sch = [0, 1, W.onDelay, 1, W.onDelay + ramp, r];
      m.set('timedomainpitchshiftschedule', sch);
      m.set('timedomainpitchshiftalgorithm', Pi.algorithm | 0);
    }

    // delay (DAF)
    if (D.on) m.set('delayframes', Math.round(D.ms / 1000 * sr / frameLen));

    // what the participant hears
    const H = s.hear;
    m.set('fb', H.fb | 0);
    if (H.fb >= 2 && H.fb <= 5) {
      const n = Math.min(480000, Math.max(48, Math.round((H.noise.seconds || 10) * 48000)));
      const key = `${n}|${H.noise.type}|${H.noise.level}`;
      if (!noiseCache.has(key)) { noiseCache.clear(); noiseCache.set(key, Array.from(G.DSP.noise(n, { type: H.noise.type, level: H.noise.level, seed: 7 }))); }
      m.set('datapb', noiseCache.get(key));
      const g = H.noise.gain ?? 1;
      if (H.fb === 2) m.set('fb2gain', g);
      if (H.fb === 3) m.set('fb3gain', g);
      if (H.fb === 4) m.set('fb4gaindb', num(m, 'fb4gaindb'));
      if (H.fb === 5) m.set('fb5gain_playback', g);
    }
    if (H.gainDb) m.set('scale', num(m, 'scale') * Math.pow(10, H.gainDb / 20));

    // when: OST + PCF
    let ost = null, pcf = null, perturbStates = [];
    if (W.mode === 'custom') { ost = W.ost || ''; pcf = W.pcf || ''; }
    else if (isDesign) {
      ost = serializeOst(cd.ost);
      pcf = serializePcf({ warps: [], rows: cd.whatOf.map(w => { if (!w) return { pitch: 0, db: 0, amp: 0, phi: 0 };
        const v = fmtVector({ units: F.units, f1: w.f1 || 0, f2: w.f2 || 0 }); return { pitch: w.st || 0, db: w.db || 0, amp: (w.f1 || w.f2) ? v.amp : 0, phi: (w.f1 || w.f2) ? v.phi : 0 }; }) });
      perturbStates = cd.whatOf.map((w, k) => (w ? k : -1)).filter(k => k >= 0);
      for (const e of cd.errors) notes.push({ where: 'design', level: 'error', text: e });
      for (const e of cd.notes) notes.push({ where: 'design', text: e });
    }
    else if (needPcf) {
      const R = [];
      if (W.mode === 'always') { perturbStates = [0]; }
      else if (W.mode === 'after') { R.push([0, 'ELAPSED_TIME', W.after, NaN, null]); perturbStates = [1]; }
      else if (W.mode === 'window') { R.push([0, 'ELAPSED_TIME', W.after, NaN, null], [1, 'ELAPSED_TIME', Math.max(0.002, W.until - W.after), NaN, null]); perturbStates = [1]; }
      else if (W.mode === 'vowel') {
        R.push([0, 'INTENSITY_RISE_HOLD', W.onThresh, W.onHold, null]);
        let st = 2;
        if (W.onDelay > 0) { R.push([2, 'ELAPSED_TIME', W.onDelay, NaN, null]); st = 3; }
        R.push([st, 'INTENSITY_FALL', W.offThresh, W.offHold, null]); perturbStates = [st];
      }
      const endState = R.length ? R[R.length - 1][0] + (OST_MODES[R[R.length - 1][1]].span) : 0;
      R.push([endState, 'OST_END', NaN, NaN, null]);
      ost = serializeOst({ rmsSlopeWin: 0.03, rules: R.map(([stat, mode, p1, p2, p3]) => ({ stat, mode, p1, p2, p3 })), maxIOI: [] });
      const rows = [];
      for (let k = 0; k <= endState; k++) {
        const on = perturbStates.includes(k);
        rows.push({ pitch: on && pvoc ? Pi.semitones : 0, db: on && L.on ? L.db : 0, amp: on && fOn ? vec.amp : 0, phi: on && fOn ? vec.phi : 0 });
      }
      const warps = [];
      if (T.on) {
        const w = { tBegin: 0, rate1: T.rate1, dur1: T.dur1, hold: T.hold, rate2: T.rate2, ostInitState: null };
        if (W.mode === 'after' || W.mode === 'window') w.tBegin = W.after;
        if (W.mode === 'vowel') { w.ostInitState = perturbStates[0]; w.tBegin = 0; }
        warps.push(w);
      }
      pcf = serializePcf({ warps, rows });
    }

    // raw overrides from the full parameter table come last and win
    for (const [k, v] of Object.entries(s.raw || {})) if (v !== undefined && v !== null && v !== '') m.set(k.toLowerCase(), v);

    const list = [...m.entries()].map(([k, v]) => [k, v]);
    const g = k => num(m, k);
    const meta = { sr, frameLen: g('framelen'), nDelay: g('ndelay'), downFact: g('downfact'), nLPC: g('nlpc'), rmsThr: g('rmsthr'),
      latencyMs: 1000 * g('ndelay') * g('framelen') / g('srate'), windowMs: 1000 * (g('framelen') + 2 * (g('ndelay') - 1) * g('framelen')) / g('srate'),
      perturbStates, design: cd, needPcf, pvoc: g('bpitchshift') === 1, tds: g('btimedomainshift') === 1 };
    return { list, ost, pcf, notes, meta, map: m };
  }

  // ---------- warnings from the audit's findings, attached to where they apply
  function warnings(settings, c, ctx = {}) {
    const s = normalize(settings), out = [], m = c.map, g = k => num(m, k);
    const W = (where, id, level, text) => out.push({ where, id, level, text });
    const frameLen = g('framelen'), nDelay = g('ndelay'), sr = g('srate');
    for (const n of c.notes || []) W(n.where === 'design' ? 'design' : n.where, null, n.level || 'info', n.text);
    // hard errors Audapter itself raises
    if (2 * (nDelay - 1) * frameLen > 960) W('listen', null, 'error', `2 × (nDelay − 1) × frameLen = ${2 * (nDelay - 1) * frameLen} exceeds Audapter's maxFrameLen 960: Audapter refuses to run.`);
    if (g('btimedomainshift') === 1 && g('bpitchshift') === 1) W('pitch', null, 'error', 'bPitchShift and bTimeDomainShift are mutually exclusive: Audapter refuses to run.');
    if (g('btimedomainshift') === 1 && g('bcepslift') !== 1) W('pitch', null, 'error', 'bTimeDomainShift = 1 requires bCepsLift = 1: Audapter refuses to run.');
    // pitch tracking window (CORPUS-8)
    const minF0 = Math.round(3.2 / (c.meta.windowMs / 1000));
    if (g('btimedomainshift') === 1 && g('pitchlowerboundhz') > 0 && g('pitchlowerboundhz') < minF0)
      W('pitch', 'CORPUS-8', 'warn', `The pitch lower bound (${g('pitchlowerboundhz')} Hz) is below what a ${c.meta.windowMs.toFixed(0)} ms analysis window (frameLen ${frameLen}, nDelay ${nDelay}) can represent (about ${minF0} Hz). The logged pitchHz, and the TDS band-pass centred on it, will be wrong for lower voices. frameLen 64 / nDelay 7 tracks down to about 60 Hz.`);
    if (ctx.f0 && ctx.f0 < minF0 * 1.05) W('listen', 'CORPUS-8', 'warn', `This input's pitch (median ${Math.round(ctx.f0)} Hz) is below what the ${c.meta.windowMs.toFixed(0)} ms analysis window represents (about ${minF0} Hz): Audapter's pitchHz will not be F0. Try the "Low voice" preset (frameLen 64, nDelay 7).`);
    // phase vocoder
    if (g('bpitchshift') === 1) {
      W('pitch', 'PT-5', 'info', 'The phase vocoder plays about 3.5 dB louder even at 0 semitones, and the level at a pitch-shift onset jumps by 0.8–8.8 dB depending on F0 and vowel. bPvocAmpNorm cannot be switched on.');
      if (g('pvocframelen') < frameLen) W('pitch', 'PT-11', 'warn', `pvocFrameLen (${g('pvocframelen')}) is shorter than frameLen (${frameLen}).`);
      if (g('pvochop') < frameLen) W('pitch', '17g', 'error', `pvocHop (${g('pvochop')}) is below frameLen (${frameLen}): Audapter divides by pvocHop / frameLen = 0 and crashes (its own check is broken).`);
    }
    if (g('btimedomainshift') === 1) {
      W('pitch', 'PT-3', 'info', 'The time-domain schedule clock only runs while the level is above rmsThresh: a pause pushes the shift later, and unshifted audio is heard during dips.');
      W('pitch', 'PT-4', 'info', 'For time-domain shifting the logged pitchShiftRatio is not the applied ratio; compare shiftedPitchHz / pitchHz instead (itself unreliable below the window limit).');
    }
    if (s.shift.timing.on && s.shift.pitch.on && s.shift.pitch.method === 'pvoc') W('timing', '17e', 'warn', 'A PCF with both a pitch shift and a time warp silently drops the warp (duplicated condition in Audapter.cpp).');
    if (s.shift.timing.on) W('timing', 'PT-5', 'info', 'Time warping runs through the phase vocoder, which adds its +3.5 dB level offset.');
    // formant units (CORPUS-11)
    const br = g('bratioshift'), bm = g('bmelshift');
    if (g('bshift') === 1) {
      const amps = [].concat(m.get('pertamp') || [], s.when.mode !== 'always' ? [] : []);
      const maxAmp = amps.reduce((a, v) => Math.max(a, Math.abs(v)), 0);
      if (br === 1 && bm === 1) W('formant', 'CORPUS-11', 'warn', 'Both bRatioShift and bMelShift are 1: the ratio is applied to mel values. Audapter\'s C++ defaults are ratio 0 / mel 1, the MATLAB defaults ratio 1 / mel 0.');
      if (br === 1 && maxAmp > 2) W('formant', 'CORPUS-11', 'warn', `Ratio mode with a perturbation amplitude of ${maxAmp.toFixed(2)} (i.e. ${(maxAmp * 100).toFixed(0)} %): Audapter does not bound the shifted targets, and mel-unit values read as ratios have produced targets of 130 kHz and +24 dB bursts.`);
      if (bm === 1 && br === 0 && maxAmp > 0 && maxAmp < 5) W('formant', 'CORPUS-11', 'info', `Mel mode: the amplitude ${maxAmp.toFixed(2)} is in mel, not a ratio. ${maxAmp.toFixed(2)} mel is a tiny shift.`);
      if (s.shift.formant.field === 'region' && !c.meta.needPcf) W('formant', 'F6', 'info', 'With a restricted field, blab\'s dropout fix re-arms the shift every time the formants re-enter the region, and minVowelLen has no effect (upstream shifted only the first entry).');
      if (s.shift.formant.field === 'variability' && !c.meta.needPcf) { const V = variField(s.shift.formant.vari), u = V.mel ? 'mel' : 'Hz';
        W('formant', 'FMT-F3', 'info', `Audapter reads the 2-D field at the lower-left grid cell without interpolating, so the applied shift is piecewise constant: the grid step here is ${V.step1.toFixed(1)} ${u} (F1) × ${V.step2.toFixed(1)} ${u} (F2), and each cell holds the shift at its centre (within half a step of the intended shift). Formants outside ±${s.shift.formant.vari.ext1} Hz (F1) / ±${s.shift.formant.vari.ext2} Hz (F2) around the centre are not shifted.`); }
      if (s.shift.formant.field === 'painted' && !c.meta.needPcf) W('formant', '2D', 'info', 'The 2-D field is looked up at the lower-left grid cell (about 20 Hz steps), not interpolated, and its last row and column are never used.');
    }
    if (g('bclampformants') === 1) W('formant', 'FMT-F1', 'warn', 'Clamping reads 2048 values from clampF1/clampF2 whatever length was passed, and the clamp branch skips the voicing check.');
    // masking noise (I-01, I-02)
    const fb = g('fb');
    if (fb >= 2 && fb <= 5) {
      const pb = (m.get('datapb') || []).length, sec = pb / 48000;
      if (pb && pb < 480000) W('hear', 'I-01', s.build === 'patched' ? 'info' : 'warn', s.build === 'patched'
        ? `Noise is ${sec.toFixed(1)} s long. The patched build loops it at its own length.`
        : `Noise shorter than 10 s (${sec.toFixed(1)} s) is followed by silence until 10 s: the shipped build loops playback at 480 000 samples, not at the noise length. The gap position also carries over between trials. Use 10 s of noise, or the patched build.`);
      if (fb === 3 && (s.hear.noise.gain ?? 1) === 0) W('hear', null, 'info', 'fb3Gain is 0 (Audapter\'s default), so the noise is silent in mode 3.');
      if (fb === 5) W('hear', 'I-02', 'warn', 'Feedback mode 5 applies dScale twice to the speech-modulated part and once to the playback, so the balance depends on each rig\'s calibration.');
    }
    // delay
    if (s.shift.delay.on) {
      const df = Math.round(s.shift.delay.ms / 1000 * sr / frameLen);
      if (df > 600) W('delay', null, 'warn', `${s.shift.delay.ms} ms is ${df} frames; Audapter silently clamps delayFrames to 600 (${(600 * frameLen / sr * 1000).toFixed(0)} ms).`);
    }
    // OST / PCF
    if (c.ost) {
      const o = parseOst(c.ost), p = parsePcf(c.pcf || ''), nS = ostStateCount(o);
      for (const e of o.errors) W('ost', null, 'error', 'OST: ' + e);
      for (const e of p.errors) W('pcf', null, 'error', 'PCF: ' + e);
      if (c.pcf && p.rows.length < nS) W('pcf', 'OST-F4', 'warn', `The PCF has ${p.rows.length} rows but the OST reaches ${nS} states. Audapter reads past the end of the PCF table for the missing states, so heap garbage decides whether and how much to perturb.`);
      o.rules.forEach((r, i) => {
        if (r.mode === 'INTENSITY_FALL' && !o.rules.slice(0, i).some(q => OST_MODES[q.mode] && OST_MODES[q.mode].sets))
          W('ost', 'OST-F1', ctx.sequence ? 'warn' : 'info', `Rule ${i + 1} (INTENSITY_FALL) comes after rules that never set "last state end", so its minimum time counts from ${ctx.sequence ? 'the previous trial: in one Audapter session the offset is detected late, e.g. 1.68 s instead of 0.40 s (fixed in the patched build)' : 'trial start. In a same-session sequence it would count from the previous trial (OST-F1)'}.`);
        if ((r.mode === 'INTENSITY_AND_RATIO_ABOVE_THRESH' || r.mode === 'INTENSITY_AND_RATIO_BELOW_THRESH') && (r.p3 === null || !(r.p3 > 0)))
          W('ost', 'OST-F8', 'warn', `Rule ${i + 1}: blab reads this rule's hold time from the 5th field; with {} the hold is 0 and the rule fires immediately.`);
        if (/SLOPE/.test(r.mode)) W('ost', 'I-05', 'info', `Rule ${i + 1} uses the level slope, which is NaN for the first 14 frames of every trial.`);
      });
      if (o.maxIOI.length) W('ost', 'OST-F2', 'warn', `The maxIOI timeout writes the wrong onset index: a following ELAPSED_TIME fires after 2 ms${ctx.sequence ? ', and without reloading the OST the timeout drifts 0.2 → 0.4 → 0.6 s over trials' : ''} (fixed in the patched build).`);
    }
    if (ctx.sequence) {
      W('run', 'COORD-1', 'info', 'In one session, an OST/PCF loaded by an earlier trial stays active for later trials that do not load one (AudapterIO(\'init\') does not clear them), and silently overrides their field-mode formant shift.');
      if (ctx.frameChange) W('run', 'CORPUS-10', 'warn', 'frameLen or nDelay changes between trials of this sequence. Audapter does not rebuild its formant tracker then; on some voices this hangs the core in an endless loop. The page stops a hung run after a timeout.');
    }
    // recorder length (I-03)
    if (ctx.dur && ctx.recorderSec && ctx.dur > ctx.recorderSec - 0.05) W('run', 'I-03', 'warn', `The input (${ctx.dur.toFixed(1)} s) is longer than this build's recorder (${ctx.recorderSec.toFixed(0)} s): the recorder silently wraps and returns only the end. Choose the full-size build for trials up to 30 s.`);
    return out;
  }

  // ---------- human-readable summary and diff
  const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(+Number(v).toPrecision(4));
  function summarize(settings) {
    const s = normalize(settings), S = s.shift, parts = [];
    const u = S.formant.units === 'pct' ? ' %' : S.formant.units === 'hz' ? ' Hz' : ' mel';
    if (s.when.mode === 'design') {
      const B = s.design.blocks, w = b => [b.what.f1 ? `F1 ${sgn(b.what.f1)}${u}` : '', b.what.f2 ? `F2 ${sgn(b.what.f2)}${u}` : '', b.what.st ? `pitch ${sgn(b.what.st)} st` : '', b.what.db ? `level ${sgn(b.what.db)} dB` : ''].filter(Boolean).join(', ') || 'nothing';
      const tl = TEMPLATES[s.design.template];
      const txt = B.length === 1 ? `${w(B[0])} from ${refText(B[0].start)} to ${refText(B[0].end, true)}` : `${B.length} blocks: ` + B.map(w).join('; ');
      const extra = [];
      if (S.delay.on) extra.push(`delay ${S.delay.ms} ms`);
      if (s.hear.fb !== 1) extra.push(`fb ${s.hear.fb}`);
      if (s.design.jitterApplied !== undefined) extra.push(`jitter +${s.design.jitterApplied} ms`);
      return txt + (extra.length ? ', ' + extra.join(', ') : '');
    }
    if (S.formant.on) {
      if (S.formant.field === 'variability') parts.push(`vowel variability ${S.formant.vari.dir === 'in' ? 'inward' : 'outward'} ${S.formant.vari.strength} % (centre ${Math.round(S.formant.vari.c1)}/${Math.round(S.formant.vari.c2)} Hz)`);
      else if (S.formant.field === 'painted') parts.push(`painted field (${S.formant.painted.cells.length} cells)`);
      else if (S.formant.field === 'curve') parts.push('F2-dependent field');
      else if (S.formant.f1 || S.formant.f2) parts.push([S.formant.f1 ? `F1 ${sgn(S.formant.f1)}${u}` : '', S.formant.f2 ? `F2 ${sgn(S.formant.f2)}${u}` : ''].filter(Boolean).join(', ') + (S.formant.field === 'region' ? ' in region' : ''));
    }
    if (S.pitch.on) parts.push(`pitch ${sgn(S.pitch.semitones)} st (${S.pitch.method === 'pvoc' ? 'phase vocoder' : 'time domain'})`);
    if (S.loudness.on && S.loudness.db) parts.push(`level ${sgn(S.loudness.db)} dB`);
    if (S.timing.on) parts.push(`time warp ×${S.timing.rate1}`);
    if (S.delay.on) parts.push(`delay ${S.delay.ms} ms`);
    if (s.hear.fb !== 1) parts.push(['muted', '', 'noise only', 'speech + noise', 'speech-modulated noise', 'fb 5'][s.hear.fb] || `fb ${s.hear.fb}`);
    if (s.hear.gainDb) parts.push(`gain ${sgn(s.hear.gainDb)} dB`);
    if (!parts.length) parts.push('no perturbation');
    const w = s.when;
    const when = w.mode === 'always' ? '' : w.mode === 'after' ? ` after ${w.after} s` : w.mode === 'window' ? ` ${w.after}–${w.until} s` : w.mode === 'vowel' ? ' during the vowel' : ' by custom OST/PCF';
    return parts.join(', ') + when;
  }
  function flatten(o, pre = '', out = {}) {
    for (const [k, v] of Object.entries(o || {})) {
      const p = pre ? pre + '.' + k : k;
      if (k === 'cells' && Array.isArray(v)) out[p] = `${v.length} cells`;
      else if (k === 'curve' && Array.isArray(v)) out[p] = v.map(x => x.join('/')).join('; ');
      else if ((k === 'ost' || k === 'pcf') && typeof v === 'string') out[p] = v.trim() ? v.trim().split('\n').length + ' lines' : '';
      else if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out);
      else out[p] = Array.isArray(v) ? (v.length > 6 ? `[${v.length} values]` : JSON.stringify(v)) : v;
    }
    return out;
  }
  // Rows where the settings differ (only paths that matter: disabled cards are collapsed to "off").
  function diff(a, b) {
    const pa = flatten(effective(a)), pb = flatten(effective(b)), keys = [...new Set([...Object.keys(pa), ...Object.keys(pb)])];
    return keys.filter(k => JSON.stringify(pa[k]) !== JSON.stringify(pb[k])).map(k => ({ path: k, a: pa[k], b: pb[k] }));
  }
  function effective(settings) {
    const s = normalize(settings), o = { preset: s.preset, build: s.build, shift: {}, when: {}, listen: s.listen, hear: { fb: s.hear.fb, gainDb: s.hear.gainDb }, raw: s.raw };
    for (const [k, v] of Object.entries(s.shift)) o.shift[k] = v.on ? v : { on: false };
    if (o.shift.formant.on && o.shift.formant.field !== 'region') delete o.shift.formant.region;
    if (o.shift.formant.on && o.shift.formant.field !== 'curve') delete o.shift.formant.curve;
    if (o.shift.formant.on && o.shift.formant.field !== 'painted') delete o.shift.formant.painted;
    if (o.shift.formant.on && o.shift.formant.field !== 'variability') delete o.shift.formant.vari;
    if (o.shift.formant.on && o.shift.formant.field === 'variability') { delete o.shift.formant.f1; delete o.shift.formant.f2; delete o.shift.formant.units; }
    const w = s.when; o.when.mode = w.mode;
    if (w.mode === 'after') o.when.after = w.after;
    if (w.mode === 'window') { o.when.after = w.after; o.when.until = w.until; }
    if (w.mode === 'vowel') Object.assign(o.when, { onThresh: w.onThresh, onHold: w.onHold, offThresh: w.offThresh, offHold: w.offHold, onDelay: w.onDelay });
    if (w.mode === 'custom') Object.assign(o.when, { ost: w.ost, pcf: w.pcf });
    if (w.mode === 'design') { o.when.design = { blocks: s.design.blocks, detect: s.design.detect }; for (const k of ['formant', 'pitch', 'loudness', 'timing']) o.shift[k] = { on: false }; if (s.shift.formant.units !== 'pct') o.shift.formant = { units: s.shift.formant.units }; }
    if (s.hear.fb >= 2) o.hear.noise = s.hear.noise;
    return o;
  }

  G.PGS = { PRESETS, OST_MODES, defaultSettings, normalize, clone, getPath, setPath, baseParams, compile, warnings, summarize, diff, flatten, effective,
    parseOst, serializeOst, ostStateCount, variField, apply2D, variIntended, TEMPLATES, defaultDesign, compileDesign, refText, parsePcf, serializePcf, hz2mel, fmtVector, GRID, FMAX };
})(typeof self !== 'undefined' ? self : globalThis);

;
self.PG = self.PG || {};
PG.WORKER_SRC = "self.AUD_DEFAULTS = {\"female\":[[\"downfact\",3],[\"srate\",16000],[\"framelen\",32],[\"ndelay\",5],[\"nwin\",1],[\"nlpc\",15],[\"nfmts\",2],[\"ntracks\",4],[\"scale\",0.7952707287670507],[\"preemp\",0.98],[\"rmsthr\",0.011354028455474416],[\"rmsratio\",0.7],[\"rmsff\",0.95],[\"dfmtsff\",0.93],[\"bgainadapt\",0],[\"bshift\",0],[\"btrack\",1],[\"bdetect\",1],[\"avglen\",8],[\"bweight\",1],[\"minvowellen\",60],[\"bratioshift\",1],[\"bmelshift\",0],[\"bcepslift\",0],[\"cepswinwidth\",30],[\"bbypassfmt\",0],[\"f2min\",0],[\"f2max\",5000],[\"f1min\",0],[\"f1max\",5000],[\"lbk\",0],[\"lbb\",0],[\"pertf1\",{\"fill\":0,\"n\":257}],[\"pertf2\",{\"fill\":0,\"n\":257}],[\"pertamp\",{\"fill\":0,\"n\":257}],[\"pertphi\",{\"fill\":0,\"n\":257}],[\"pertamp2d\",{\"fill\":0,\"n\":66049}],[\"pertphi2d\",{\"fill\":0,\"n\":66049}],[\"fb\",1],[\"nfb\",1],[\"triallen\",0],[\"ramplen\",0],[\"afact\",1],[\"bfact\",0.8],[\"gfact\",1],[\"fn1\",675],[\"fn2\",1392],[\"fb2gain\",1],[\"fb3gain\",0],[\"fb4gaindb\",10],[\"fb5gaindb_speech\",0],[\"fb5gain_playback\",1],[\"rmsff_fb\",[0.8,0.99,0.1,0.1]],[\"bpitchshift\",0],[\"bshift2d\",0],[\"pitchshiftratio\",1],[\"pvocframelen\",256],[\"pvochop\",64],[\"bdownsampfilt\",1],[\"stereomode\",1],[\"delayFrames\",0],[\"btimedomainshift\",0],[\"pitchlowerboundhz\",0],[\"pitchupperboundhz\",0],[\"timedomainpitchshiftschedule\",1],[\"timedomainpitchshiftalgorithm\",0],[\"bclampformants\",0],[\"clamposts\",[0,0]],[\"clampf1\",{\"fill\":0,\"n\":2048}],[\"clampf2\",{\"fill\":0,\"n\":2048}]],\"male\":[[\"downfact\",3],[\"srate\",16000],[\"framelen\",32],[\"ndelay\",5],[\"nwin\",1],[\"nlpc\",17],[\"nfmts\",2],[\"ntracks\",4],[\"scale\",0.7952707287670507],[\"preemp\",0.98],[\"rmsthr\",0.011354028455474416],[\"rmsratio\",0.7],[\"rmsff\",0.95],[\"dfmtsff\",0.93],[\"bgainadapt\",0],[\"bshift\",0],[\"btrack\",1],[\"bdetect\",1],[\"avglen\",8],[\"bweight\",1],[\"minvowellen\",60],[\"bratioshift\",1],[\"bmelshift\",0],[\"bcepslift\",0],[\"cepswinwidth\",50],[\"bbypassfmt\",0],[\"f2min\",0],[\"f2max\",5000],[\"f1min\",0],[\"f1max\",5000],[\"lbk\",0],[\"lbb\",0],[\"pertf1\",{\"fill\":0,\"n\":257}],[\"pertf2\",{\"fill\":0,\"n\":257}],[\"pertamp\",{\"fill\":0,\"n\":257}],[\"pertphi\",{\"fill\":0,\"n\":257}],[\"pertamp2d\",{\"fill\":0,\"n\":66049}],[\"pertphi2d\",{\"fill\":0,\"n\":66049}],[\"fb\",1],[\"nfb\",1],[\"triallen\",0],[\"ramplen\",0],[\"afact\",1],[\"bfact\",0.8],[\"gfact\",1],[\"fn1\",591],[\"fn2\",1314],[\"fb2gain\",1],[\"fb3gain\",0],[\"fb4gaindb\",10],[\"fb5gaindb_speech\",0],[\"fb5gain_playback\",1],[\"rmsff_fb\",[0.8,0.99,0.1,0.1]],[\"bpitchshift\",0],[\"bshift2d\",0],[\"pitchshiftratio\",1],[\"pvocframelen\",256],[\"pvochop\",64],[\"bdownsampfilt\",1],[\"stereomode\",1],[\"delayFrames\",0],[\"btimedomainshift\",0],[\"pitchlowerboundhz\",0],[\"pitchupperboundhz\",0],[\"timedomainpitchshiftschedule\",1],[\"timedomainpitchshiftalgorithm\",0],[\"bclampformants\",0],[\"clamposts\",[0,0]],[\"clampf1\",{\"fill\":0,\"n\":2048}],[\"clampf2\",{\"fill\":0,\"n\":2048}]]};\nself.AUD_PARAM_TABLE = [{\"name\":\"bshift\",\"type\":\"bool\",\"help\":\"Formant perturbation switch\",\"line\":123},{\"name\":\"btrack\",\"type\":\"bool\",\"help\":\"Formant tracking switch\",\"line\":124},{\"name\":\"bdetect\",\"type\":\"bool\",\"help\":\"Formant tracking period detection switch\",\"line\":125},{\"name\":\"bweight\",\"type\":\"bool\",\"help\":\"Switch for intensity-weighted smoothing of formant frequencies\",\"line\":126},{\"name\":\"bcepslift\",\"type\":\"bool\",\"help\":\"Switch for cepstral liftering for formant trackng\",\"line\":127},{\"name\":\"btimedomainshift\",\"type\":\"bool\",\"help\":\"Perform time-domain pitch shifting, by tracking pitch in real-time, using cepstral method\",\"line\":128},{\"name\":\"bratioshift\",\"type\":\"bool\",\"help\":\"Switch for ratio-based formant shifting\",\"line\":129},{\"name\":\"bmelshift\",\"type\":\"bool\",\"help\":\"Switch for formant shifting based on the mel frequency scale\",\"line\":130},{\"name\":\"bgainadapt\",\"type\":\"bool\",\"help\":\"Formant perturbation gain adaptation switch\",\"line\":131},{\"name\":\"brmsclip\",\"type\":\"bool\",\"help\":\"Switch for auto RMS intensity clipping (loudness protection)\",\"line\":132},{\"name\":\"bbypassfmt\",\"type\":\"bool\",\"help\":\"Switch for bypassing formant tracking (for use in pitch shifting and time warping\",\"line\":133},{\"name\":\"bshift2d\",\"type\":\"bool\",\"help\":\"Switch for using F1 and F2 for formant perturbation, instead of just F2\",\"line\":134},{\"name\":\"bpitchshift\",\"type\":\"bool\",\"help\":\"Pitch shifting switch\",\"line\":135},{\"name\":\"bdownsampfilt\",\"type\":\"bool\",\"help\":\"Down-sampling filter switch\",\"line\":136},{\"name\":\"mute\",\"type\":\"bool\",\"help\":\"Global mute switch\",\"line\":137},{\"name\":\"bpvocmpnorm\",\"type\":\"bool\",\"help\":\"Phase vocoder amplitude normalization switch\",\"line\":138},{\"name\":\"bclampformants\",\"type\":\"bool\",\"help\":\"Switch for using clamped formants passed in from Matlab\",\"line\":139},{\"name\":\"srate\",\"type\":\"int\",\"help\":\"Sampling rate (Hz), after downsampling\",\"line\":142},{\"name\":\"framelen\",\"type\":\"int\",\"help\":\"Frame length (samples), after downsampling\",\"line\":143},{\"name\":\"ndelay\",\"type\":\"int\",\"help\":\"Number of delayed frames before an incoming frame is sent back\",\"line\":144},{\"name\":\"nwin\",\"type\":\"int\",\"help\":\"Length of an internal frame (frames)\",\"line\":145},{\"name\":\"nlpc\",\"type\":\"int\",\"help\":\"Order of LPC\",\"line\":146},{\"name\":\"nfmts\",\"type\":\"int\",\"help\":\"Number of formants to be shifted\",\"line\":147},{\"name\":\"ntracks\",\"type\":\"int\",\"help\":\"Number of formants to be tracked\",\"line\":148},{\"name\":\"avglen\",\"type\":\"int\",\"help\":\"Formant smoothing window length (frames)\",\"line\":149},{\"name\":\"cepswinwidth\",\"type\":\"int\",\"help\":\"Window width for cepstral liftering\",\"line\":150},{\"name\":\"fb\",\"type\":\"int\",\"help\":\"Feedback mode (0-mute, 1-normal, 2-masking noise, 3-speech+noise, 4-speech modulated noise\",\"line\":151},{\"name\":\"minvowellen\",\"type\":\"int\",\"help\":\"Minimum vowel length (frames)\",\"line\":152},{\"name\":\"pvocframelen\",\"type\":\"int\",\"help\":\"Phase vocoder frame length (samples)\",\"line\":153},{\"name\":\"pvochop\",\"type\":\"int\",\"help\":\"Phase vocoder frame hop (samples)\",\"line\":154},{\"name\":\"nfb\",\"type\":\"int\",\"help\":\"Number of feedbac voices\",\"line\":155},{\"name\":\"tsgntones\",\"type\":\"int\",\"help\":\"Tone sequence generator: number of tones\",\"line\":156},{\"name\":\"downfact\",\"type\":\"int\",\"help\":\"Downsampling factor\",\"line\":157},{\"name\":\"stereomode\",\"type\":\"int\",\"help\":\"Two-channel mode\",\"line\":158},{\"name\":\"pvocampnormtrans\",\"type\":\"int[]\",\"help\":\"Phase vocoder amplitude normalization transitional period length (frames)\",\"line\":161},{\"name\":\"delayframes\",\"type\":\"int[]\",\"help\":\"DAF global delay (frames): maxNVoices-long array\",\"line\":162},{\"name\":\"clamposts\",\"type\":\"int[]\",\"help\":\"OST values to start [0] and stop [1] using clamped formant values\",\"line\":163},{\"name\":\"scale\",\"type\":\"double\",\"help\":\"Output scaling factor (gain)\",\"line\":166},{\"name\":\"preemp\",\"type\":\"double\",\"help\":\"Pre-emphasis factor\",\"line\":167},{\"name\":\"rmsthr\",\"type\":\"double\",\"help\":\"RMS intensity threshold\",\"line\":168},{\"name\":\"rmsratio\",\"type\":\"double\",\"help\":\"RMS ratio threshold\",\"line\":169},{\"name\":\"rmsff\",\"type\":\"double\",\"help\":\"Forgetting factor for RMS intensity smoothing\",\"line\":170},{\"name\":\"dfmtsff\",\"type\":\"double\",\"help\":\"Forgetting factor for formant smoothing (in status tracking)\",\"line\":171},{\"name\":\"rmsclipthresh\",\"type\":\"double\",\"help\":\"Auto RMS intensity clipping threshold (loudness protection)\",\"line\":172},{\"name\":\"wgfreq\",\"type\":\"double\",\"help\":\"Waveform generator: sine-wave frequency (Hz)\",\"line\":174},{\"name\":\"wgamp\",\"type\":\"double\",\"help\":\"Waveform generator: sine-wave peak amplitude\",\"line\":175},{\"name\":\"wgtime\",\"type\":\"double\",\"help\":\"Waveform generator: sine-wave duration (s)\",\"line\":176},{\"name\":\"f2min\",\"type\":\"double\",\"help\":\"Formant perturbation field: minimum F2 (Hz)\",\"line\":178},{\"name\":\"f2max\",\"type\":\"double\",\"help\":\"Formant perturbation field: maximum F2 (Hz)\",\"line\":179},{\"name\":\"f1min\",\"type\":\"double\",\"help\":\"Formant perturbation field: minimum F1 (Hz)\",\"line\":180},{\"name\":\"f1max\",\"type\":\"double\",\"help\":\"Formant perturbation field: maximum F1 (Hz)\",\"line\":181},{\"name\":\"lbk\",\"type\":\"double\",\"help\":\"Formant perturbation field: Oblique lower border: Slope k\",\"line\":182},{\"name\":\"lbb\",\"type\":\"double\",\"help\":\"Formant perturbation field: Oblique lower border: Intercept b\",\"line\":183},{\"name\":\"triallen\",\"type\":\"double\",\"help\":\"Trial length (s)\",\"line\":185},{\"name\":\"ramplen\",\"type\":\"double\",\"help\":\"Audio ramp length (s)\",\"line\":186},{\"name\":\"afact\",\"type\":\"double\",\"help\":\"Formant-tracking algorithm: alpha\",\"line\":188},{\"name\":\"bfact\",\"type\":\"double\",\"help\":\"Formant-tracking algorithm: beta\",\"line\":189},{\"name\":\"gfact\",\"type\":\"double\",\"help\":\"Formant-tracking algorithm: gamma\",\"line\":190},{\"name\":\"fn1\",\"type\":\"double\",\"help\":\"Formant-tracking algorithm: F1 prior\",\"line\":191},{\"name\":\"fn2\",\"type\":\"double\",\"help\":\"Formant-tracking algorithm: F2 prior\",\"line\":192},{\"name\":\"pitchlowerboundhz\",\"type\":\"double\",\"help\":\"Lower bound for pitch, in Hz. Used by pitch tracker.\",\"line\":194},{\"name\":\"pitchupperboundhz\",\"type\":\"double\",\"help\":\"Upper bound for pitch, in Hz. Used by pitch tracker.\",\"line\":195},{\"name\":\"fb2gain\",\"type\":\"double\",\"help\":\"Noise gain factor for noise only mode\",\"line\":197},{\"name\":\"fb3gain\",\"type\":\"double\",\"help\":\"Noise gain factor for speech+noise feedback mode\",\"line\":198},{\"name\":\"fb4gaindb\",\"type\":\"double\",\"help\":\"Speech-modulated noise feedback: intensity gain factor\",\"line\":199},{\"name\":\"fb5gaindb_speech\",\"type\":\"double\",\"help\":\"Feedback mode 5: gain (in dB) for speech-modulated component\",\"line\":200},{\"name\":\"fb5gain_playback\",\"type\":\"double\",\"help\":\"Feedback mode 5: gain (linear scaling factor) for constant component\",\"line\":201},{\"name\":\"pitchshiftratio\",\"type\":\"double[]\",\"help\":\"Pitch-shifting: ratio (1.0 = no shift)\",\"line\":204},{\"name\":\"datapb\",\"type\":\"double[]\",\"help\":\"Waveform for playback\",\"line\":206},{\"name\":\"pertf1\",\"type\":\"double[]\",\"help\":\"Formant perturbation field: F1 grid (Hz)\",\"line\":207},{\"name\":\"pertf2\",\"type\":\"double[]\",\"help\":\"Formant perturbation field: F2 grid (Hz)\",\"line\":208},{\"name\":\"pertamp\",\"type\":\"double[]\",\"help\":\"Formant perturbation field: Perturbation vector amplitude\",\"line\":209},{\"name\":\"pertphi\",\"type\":\"double[]\",\"help\":\"Formant perturbation field: Perturbation vector angle\",\"line\":210},{\"name\":\"gain\",\"type\":\"double[]\",\"help\":\"Global intensity gain\",\"line\":211},{\"name\":\"tsgtonedur\",\"type\":\"double[]\",\"help\":\"Tone sequence generator: tone durations (s)\",\"line\":213},{\"name\":\"tsgtonefreq\",\"type\":\"double[]\",\"help\":\"Tone sequence generator: tone frequencies (Hz)\",\"line\":214},{\"name\":\"tsgtoneamp\",\"type\":\"double[]\",\"help\":\"Tone sequence generator: tone peak amplitudes\",\"line\":215},{\"name\":\"tsgtoneramp\",\"type\":\"double[]\",\"help\":\"Tone sequence generator: tone ramp durations (s)\",\"line\":216},{\"name\":\"tsgint\",\"type\":\"double[]\",\"help\":\"Tone sequence generator: intervals between tone onsets (s)\",\"line\":217},{\"name\":\"clampf1\",\"type\":\"double[]\",\"help\":\"F1 values used during clamped signal output\",\"line\":218},{\"name\":\"clampf2\",\"type\":\"double[]\",\"help\":\"F2 values used during clamped signal output\",\"line\":219},{\"name\":\"pertamp2d\",\"type\":\"double[][]\",\"help\":\"Formant perturbation field: Perturbation vector amplitude for F1-F2\",\"line\":222},{\"name\":\"pertphi2d\",\"type\":\"double[][]\",\"help\":\"Formant perturbation field: Perturbation vector angle for F1-F2\",\"line\":223},{\"name\":\"rmsff_fb\",\"type\":\"double[]\",\"help\":\"Speech-modulated noise feedback: RMS forgetting factor\",\"line\":226},{\"name\":\"pvocwarp\",\"type\":\"warp\",\"help\":\"Phase vocoder time warping configuration\",\"line\":227},{\"name\":\"timedomainpitchshiftschedule\",\"type\":\"double[]\",\"help\":\"Time-domain pitch shift schedule: Can take one of the following formats.\\n1. A single number: Applies a constant pitch shift.\\n2. An length-n*2 1D array, where n is the number of time points, of alternating time \\n  points and pitch-shift ratios.  The time points (in seconds) are required to be monotonically increasing.\\n  The first element is required to be 0.\\n  The time points are anchor points. The amount\\n  of pitch shift between the anchor points are interpolated linearly. For time periods\\n  after the last time point in the array, the amount of the last time point will be\\n  used.\\nEach pitch-shift amount is defined in the same way as parameter 'pitchshiftratio', i.e.,\\n1.0 corresponds to no shift. Each pitch-shift amount is required to be a positive number.\",\"line\":228},{\"name\":\"timedomainpitchshiftalgorithm\",\"type\":\"enum\",\"help\":\"Time-domain pitch shift algorithm: Can take one of the following values.\\n0 - pp_none: does not adjust pitch cycles (default).\\n1 - pp_peaks: adjusts pitch cycle based on waveform maximum.\\n2 - pp_valleys: adjusts pitch cycle based on waveform minimum.\",\"line\":243}];\n// Signal analysis and synthesis used by both the page and the engine worker (no DOM).\n// Independent of Audapter: these estimates are what the page compares Audapter's own logs against.\n(function (G) {\n  'use strict';\n  const TAU = 2 * Math.PI;\n\n  function rng(seed) {   // mulberry32\n    let a = seed >>> 0;\n    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };\n  }\n\n  // In-place iterative radix-2 FFT on (re, im), n a power of two.\n  function fft(re, im) {\n    const n = re.length;\n    for (let i = 1, j = 0; i < n; i++) {\n      let bit = n >> 1;\n      for (; j & bit; bit >>= 1) j ^= bit;\n      j ^= bit;\n      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }\n    }\n    for (let len = 2; len <= n; len <<= 1) {\n      const ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;\n      for (let i = 0; i < n; i += len) {\n        let cr = 1, ci = 0;\n        for (let k = 0; k < h; k++) {\n          const a = i + k, b = a + h;\n          const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;\n          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;\n          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;\n        }\n      }\n    }\n  }\n\n  // Broadband spectrogram in dB (Praat-like: 5 ms window, +6 dB/octave pre-emphasis). Returns Float32 dB, frames x bins.\n  function spectrogramDb(x, sr, { win = 0.005, hop = 0.002, nfft = 256 } = {}) {\n    const W = Math.round(win * sr), H = Math.max(1, Math.round(hop * sr));\n    const nF = Math.max(1, Math.floor((x.length - 1) / H) + 1), nB = nfft / 2 + 1;\n    const w = new Float64Array(W); for (let i = 0; i < W; i++) w[i] = 0.5 - 0.5 * Math.cos(TAU * (i + 0.5) / W);\n    const out = new Float32Array(nF * nB), re = new Float64Array(nfft), im = new Float64Array(nfft);\n    for (let f = 0; f < nF; f++) {\n      const c = f * H - (W >> 1);\n      re.fill(0); im.fill(0);\n      for (let i = 0; i < W; i++) {\n        const k = c + i; if (k < 1 || k >= x.length) continue;\n        re[i] = (x[k] - 0.97 * x[k - 1]) * w[i];\n      }\n      fft(re, im);\n      for (let b = 0; b < nB; b++) out[f * nB + b] = 10 * Math.log10(re[b] * re[b] + im[b] * im[b] + 1e-20);\n    }\n    return { db: out, nFrames: nF, nBins: nB, hop: H / sr, fmax: sr / 2 };\n  }\n  // Quantise to 0..255 over [ref - dyn, ref] dB (shared ref so input and output are comparable).\n  function quantise(spec, ref, dyn = 60) {\n    const q = new Uint8Array(spec.db.length), lo = ref - dyn;\n    for (let i = 0; i < q.length; i++) { const v = (spec.db[i] - lo) / dyn; q[i] = v <= 0 ? 0 : v >= 1 ? 255 : Math.round(v * 255); }\n    return { data: q, nFrames: spec.nFrames, nBins: spec.nBins, hop: spec.hop, fmax: spec.fmax, ref, dyn };\n  }\n  function maxOf(a) { let m = -Infinity; for (let i = 0; i < a.length; i++) if (a[i] > m) m = a[i]; return m; }\n\n  // Short-time level in dBFS (RMS over `win`), every `hop` seconds.\n  function levelDb(x, sr, { win = 0.02, hop = 0.005 } = {}) {\n    const W = Math.round(win * sr), H = Math.round(hop * sr), n = Math.max(1, Math.floor(x.length / H));\n    const out = new Float32Array(n);\n    for (let f = 0; f < n; f++) {\n      const c = f * H - (W >> 1); let s = 0, m = 0;\n      for (let i = 0; i < W; i++) { const k = c + i; if (k >= 0 && k < x.length) { s += x[k] * x[k]; m++; } }\n      out[f] = 10 * Math.log10(s / Math.max(1, m) + 1e-12);\n    }\n    return { db: out, hop };\n  }\n  // RMS over 20 ms blocks whose RMS exceeds 1e-3 (the report's \"active RMS\"), and the peak.\n  function activeRms(x, sr = 48000) {\n    const B = Math.round(0.02 * sr); let s = 0, n = 0;\n    for (let i = 0; i + B <= x.length; i += B) {\n      let e = 0; for (let k = i; k < i + B; k++) e += x[k] * x[k];\n      if (Math.sqrt(e / B) > 1e-3) { s += e; n += B; }\n    }\n    return n ? Math.sqrt(s / n) : 0;\n  }\n  function peak(x) { let m = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; } return m; }\n  // Largest 20 ms block RMS relative to the active RMS (dB): > 20 dB flags a burst.\n  function burstDb(x, sr = 48000) {\n    const B = Math.round(0.02 * sr), a = activeRms(x, sr); if (!a) return 0;\n    let mx = 0; for (let i = 0; i + B <= x.length; i += B) { let e = 0; for (let k = i; k < i + B; k++) e += x[k] * x[k]; mx = Math.max(mx, Math.sqrt(e / B)); }\n    return 20 * Math.log10(mx / a);\n  }\n\n  // YIN F0 estimate (de Cheveigne & Kawahara 2002), independent of Audapter's cepstral tracker.\n  function yin(x, sr, { fmin = 60, fmax = 600, hop = 0.005, win = 0.04, thresh = 0.15, gateDb = -35 } = {}) {\n    const W = Math.round(win * sr), H = Math.round(hop * sr), tmax = Math.min(W - 1, Math.ceil(sr / fmin)), tmin = Math.floor(sr / fmax);\n    const n = Math.max(1, Math.floor(x.length / H)), f0 = new Float32Array(n), d = new Float64Array(tmax + 2);\n    const lev = levelDb(x, sr, { win, hop }); const gate = maxOf(lev.db) + gateDb;\n    for (let f = 0; f < n; f++) {\n      if (lev.db[f] < gate) continue;\n      const c = f * H - (W >> 1); if (c < 0 || c + W + tmax >= x.length) continue;\n      d[0] = 1; let run = 0;\n      for (let t = 1; t <= tmax; t++) {\n        let s = 0; for (let i = 0; i < W; i++) { const v = x[c + i] - x[c + i + t]; s += v * v; }\n        run += s; d[t] = run > 0 ? s * t / run : 1;\n      }\n      let T = -1;\n      for (let t = Math.max(2, tmin); t < tmax; t++) if (d[t] < thresh) { while (t + 1 < tmax && d[t + 1] < d[t]) t++; T = t; break; }\n      if (T < 0) continue;\n      const a = d[T - 1], b = d[T], cc = d[T + 1], den = a - 2 * b + cc;\n      const Tp = den ? T + 0.5 * (a - cc) / den : T;\n      f0[f] = sr / Tp;\n    }\n    return { f0, hop };\n  }\n\n  // Autocorrelation LPC (Levinson-Durbin) -> polynomial roots (Durand-Kerner) -> F1..F3. Rough, independent estimate.\n  function levinson(r, p) {\n    const a = new Float64Array(p + 1); a[0] = 1; let e = r[0];\n    if (!(e > 0)) return null;\n    for (let i = 1; i <= p; i++) {\n      let acc = r[i]; for (let j = 1; j < i; j++) acc += a[j] * r[i - j];\n      const k = -acc / e, prev = a.slice();\n      for (let j = 1; j < i; j++) a[j] = prev[j] + k * prev[i - j];\n      a[i] = k; e *= 1 - k * k; if (!(e > 0)) return null;\n    }\n    return a;\n  }\n  function polyRoots(a) {   // roots of z^p + a1 z^(p-1) + ... + ap\n    const p = a.length - 1, zr = new Float64Array(p), zi = new Float64Array(p);\n    for (let i = 0; i < p; i++) { const ang = TAU * i / p + 0.4; zr[i] = 0.9 * Math.cos(ang); zi[i] = 0.9 * Math.sin(ang); }\n    for (let it = 0; it < 500; it++) {\n      let delta = 0;\n      for (let i = 0; i < p; i++) {\n        let vr = 1, vi = 0;   // Horner\n        for (let k = 1; k <= p; k++) { const t = vr * zr[i] - vi * zi[i] + a[k]; vi = vr * zi[i] + vi * zr[i]; vr = t; }\n        let dr = 1, di = 0;\n        for (let j = 0; j < p; j++) if (j !== i) { const ur = zr[i] - zr[j], ui = zi[i] - zi[j]; const t = dr * ur - di * ui; di = dr * ui + di * ur; dr = t; }\n        const m = dr * dr + di * di; if (!m) continue;\n        const qr = (vr * dr + vi * di) / m, qi = (vi * dr - vr * di) / m;\n        zr[i] -= qr; zi[i] -= qi; delta = Math.max(delta, Math.abs(qr) + Math.abs(qi));\n      }\n      if (delta < 1e-10) break;\n    }\n    return { zr, zi };\n  }\n  function lpcFormants(x, sr, { hop = 0.005, win = 0.025, order = 0, gateDb = -30 } = {}) {\n    const p = order || Math.round(sr / 1000) + 2, W = Math.round(win * sr), H = Math.round(hop * sr);\n    const n = Math.max(1, Math.floor(x.length / H));\n    const F = [new Float32Array(n).fill(NaN), new Float32Array(n).fill(NaN), new Float32Array(n).fill(NaN)];\n    const lev = levelDb(x, sr, { win, hop }); const gate = maxOf(lev.db) + gateDb;\n    const w = new Float64Array(W); for (let i = 0; i < W; i++) w[i] = 0.54 - 0.46 * Math.cos(TAU * i / (W - 1));\n    const s = new Float64Array(W), r = new Float64Array(p + 1);\n    for (let f = 0; f < n; f++) {\n      if (lev.db[f] < gate) continue;\n      const c = f * H - (W >> 1); if (c < 1 || c + W >= x.length) continue;\n      for (let i = 0; i < W; i++) s[i] = (x[c + i] - 0.97 * x[c + i - 1]) * w[i];\n      for (let k = 0; k <= p; k++) { let acc = 0; for (let i = k; i < W; i++) acc += s[i] * s[i - k]; r[k] = acc; }\n      r[0] *= 1 + 1e-9;\n      const a = levinson(r, p); if (!a) continue;\n      const { zr, zi } = polyRoots(a), cand = [];\n      for (let i = 0; i < p; i++) {\n        if (zi[i] <= 0) continue;\n        const fr = Math.atan2(zi[i], zr[i]) * sr / TAU, bw = -Math.log(Math.hypot(zr[i], zi[i])) * sr / Math.PI;\n        if (fr > 90 && fr < sr / 2 - 100 && bw < 500) cand.push(fr);\n      }\n      cand.sort((u, v) => u - v);\n      for (let k = 0; k < 3 && k < cand.length; k++) F[k][f] = cand[k];\n    }\n    return { f: F, hop };\n  }\n\n  // Additive vowel synthesiser: harmonics with -6 dB/octave source tilt, shaped by 2-pole resonances evaluated every\n  // 2.5 ms (so formant and F0 glides are clean). Output at 48 kHz, Float64.\n  function resonance(f, F, B) {\n    const b = B / 2, num = F * F + b * b;\n    return num / Math.sqrt(((f - F) * (f - F) + b * b) * ((f + F) * (f + F) + b * b));\n  }\n  function synthVowel({ sr = 48000, dur = 2, onset = 0.2, offset = 1.8, ramp = 0.03, f0 = 120, f0End = null,\n    formants = [700, 1200, 2600, 3500], formantsEnd = null, bw = [80, 90, 120, 150], level = -20, vibratoHz = 0,\n    vibratoCents = 0, noiseDb = -45, seed = 1 } = {}) {\n    const n = Math.round(dur * sr), y = new Float64Array(n), R = rng(seed);\n    const blk = Math.round(0.0025 * sr), fe = formantsEnd || formants, f0e = f0End || f0;\n    let phase = 0; const amps = new Float64Array(400);\n    const T0 = onset, T1 = offset;\n    for (let s0 = 0; s0 < n; s0 += blk) {\n      const tm = (s0 + blk / 2) / sr, u = Math.min(1, Math.max(0, (tm - T0) / Math.max(1e-6, T1 - T0)));\n      const Fs = formants.map((v, i) => v + (fe[i] - v) * u);\n      let F0 = f0 + (f0e - f0) * u;\n      const K = Math.min(399, Math.floor((sr / 2 - 200) / (F0 * 1.02)));\n      for (let k = 1; k <= K; k++) { let g = 1 / k; for (let i = 0; i < Fs.length; i++) g *= resonance(k * F0, Fs[i], bw[i] || 100); amps[k] = g; }\n      for (let s = s0; s < Math.min(n, s0 + blk); s++) {\n        const t = s / sr;\n        const f0t = F0 * (vibratoHz ? Math.pow(2, vibratoCents / 1200 * Math.sin(TAU * vibratoHz * t)) : 1);\n        phase += TAU * f0t / sr; if (phase > TAU * 1000) phase -= TAU * 1000;\n        let v = 0; for (let k = 1; k <= K; k++) v += amps[k] * Math.sin(k * phase);\n        let env = 0;\n        if (t >= T0 && t <= T1) env = Math.min(1, (t - T0) / ramp, (T1 - t) / ramp);\n        env = env > 0 ? 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, env)) : 0;\n        y[s] = v * env;\n      }\n    }\n    // normalise the voiced part to the requested RMS level (dBFS), add a little aspiration noise under the vowel\n    let e = 0, m = 0; for (let i = Math.round(T0 * sr); i < Math.min(n, Math.round(T1 * sr)); i++) { e += y[i] * y[i]; m++; }\n    const g = m && e ? Math.pow(10, level / 20) / Math.sqrt(e / m) : 0, na = Math.pow(10, (level + noiseDb) / 20);\n    for (let i = 0; i < n; i++) { const g1 = R(), g2 = R(); y[i] = y[i] * g + na * Math.sqrt(-2 * Math.log(Math.max(g1, 1e-12))) * Math.cos(TAU * g2) * 0.05; }\n    return y;\n  }\n\n  // Masking noise for datapb (48 kHz): white or pink (Paul Kellet's filter), RMS in dBFS.\n  function noise(n, { type = 'pink', level = -20, seed = 7 } = {}) {\n    const R = rng(seed), y = new Float64Array(n);\n    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;\n    for (let i = 0; i < n; i++) {\n      const w = R() * 2 - 1;\n      if (type === 'white') { y[i] = w; continue; }\n      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;\n      b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;\n      y[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;\n    }\n    let e = 0; for (let i = 0; i < n; i++) e += y[i] * y[i];\n    const g = Math.pow(10, level / 20) / Math.sqrt(e / Math.max(1, n));\n    for (let i = 0; i < n; i++) y[i] *= g;\n    return y;\n  }\n\n  // WAV (PCM16 or IEEE float32) encoder.\n  function encodeWav(x, sr, { float = false } = {}) {\n    const bps = float ? 4 : 2, n = x.length, buf = new ArrayBuffer(44 + n * bps), v = new DataView(buf);\n    const s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };\n    s(0, 'RIFF'); v.setUint32(4, 36 + n * bps, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true);\n    v.setUint16(20, float ? 3 : 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * bps, true);\n    v.setUint16(32, bps, true); v.setUint16(34, bps * 8, true); s(36, 'data'); v.setUint32(40, n * bps, true);\n    for (let i = 0; i < n; i++) {\n      if (float) v.setFloat32(44 + 4 * i, x[i], true);\n      else v.setInt16(44 + 2 * i, Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), true);\n    }\n    return new Uint8Array(buf);\n  }\n  // Minimal WAV decoder (PCM 16/24/32, float 32/64), mixes to mono. Returns {sr, x: Float64Array} or null.\n  function decodeWav(u8) {\n    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);\n    const tag = o => String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);\n    if (u8.length < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;\n    let o = 12, fmt = null;\n    while (o + 8 <= u8.length) {\n      const id = tag(o), len = v.getUint32(o + 4, true), b = o + 8;\n      if (id === 'fmt ') {\n        fmt = { code: v.getUint16(b, true), ch: v.getUint16(b + 2, true), sr: v.getUint32(b + 4, true), bits: v.getUint16(b + 14, true) };\n        if (fmt.code === 0xFFFE && len >= 26) fmt.code = v.getUint16(b + 24, true);   // WAVE_FORMAT_EXTENSIBLE sub-format\n      }\n      if (id === 'data' && fmt) {\n        const bps = fmt.bits / 8, nFr = Math.floor(Math.min(len, u8.length - b) / (bps * fmt.ch)), x = new Float64Array(nFr);\n        for (let i = 0; i < nFr; i++) {\n          let acc = 0;\n          for (let c = 0; c < fmt.ch; c++) {\n            const p = b + (i * fmt.ch + c) * bps; let s;\n            if (fmt.code === 3) s = bps === 4 ? v.getFloat32(p, true) : v.getFloat64(p, true);\n            else if (bps === 2) s = v.getInt16(p, true) / 32768;\n            else if (bps === 3) s = ((v.getUint8(p) | v.getUint8(p + 1) << 8 | v.getInt8(p + 2) << 16)) / 8388608;\n            else if (bps === 4) s = v.getInt32(p, true) / 2147483648;\n            else s = (v.getUint8(p) - 128) / 128;\n            acc += s;\n          }\n          x[i] = acc / fmt.ch;\n        }\n        return { sr: fmt.sr, x };\n      }\n      o = b + len + (len & 1);\n    }\n    return null;\n  }\n\n  G.DSP = { rng, fft, spectrogramDb, quantise, maxOf, levelDb, activeRms, peak, burstDb, yin, lpcFormants, synthVowel, noise, encodeWav, decodeWav };\n})(typeof self !== 'undefined' ? self : globalThis);\n\n;\n// Playground settings model, shared by the page and the engine worker (no DOM).\n// A settings object is small, readable JSON. compile() turns it into exactly what MATLAB would send:\n// an ordered list of Audapter setParam calls (blab AudapterIO('init') order) plus OST and PCF texts.\n(function (G) {\n  'use strict';\n  const DEF = G.AUD_DEFAULTS;          // { female: [[name, value], ...], male: [...] } recorded from blab AudapterIO('init')\n  const decode = v => (v && typeof v === 'object' && !Array.isArray(v) && 'fill' in v) ? new Array(v.n).fill(v.fill) : v;\n  const hz2mel = f => 1127.01048 * Math.log(1 + f / 700);   // Audapter utils.cpp hz2mel\n  const clone = o => JSON.parse(JSON.stringify(o));\n  const GRID = 257, FMAX = 5000;\n  const noiseCache = new Map();\n\n  // ---------- presets: starting points built on the recorded blab defaults\n  const PRESETS = {\n    female: { label: 'Adult female', sex: 'female', params: {},\n      note: 'blab getAudapterDefaultParams(\\'female\\'): nLPC 15, frameLen 32, nDelay 5.' },\n    male: { label: 'Adult male', sex: 'male', params: {},\n      note: 'blab getAudapterDefaultParams(\\'male\\'): nLPC 17. On some low /a/ vowels it reports F3 as F2 (CORPUS-4).' },\n    child: { label: 'Child', sex: 'female', params: { nlpc: 11 },\n      note: 'Female defaults with nLPC 11. With nLPC 15, F2 of 6-7-year-olds was underestimated by about 12 % (CORPUS-3).' },\n    lowvoice: { label: 'Low voice, upstream demo', sex: 'male', params: { framelen: 64, ndelay: 7, bcepslift: 1, pitchlowerboundhz: 80, pitchupperboundhz: 160 },\n      note: 'Male defaults with frameLen 64 and nDelay 7, as upstream time_domain_shift_demo.m. A longer analysis window, so pitch below ~180 Hz is tracked (CORPUS-8), at 14 ms more delay.' },\n  };\n\n  // ---------- timeline design (the \"Timing & design\" tab): blocks anchored to events Audapter's level rules can detect\n  // ref: {ev: 't0'|'on'|'off'|'dur'|'none', k: sound number (1-based), ms: offset after the event}\n  function defaultDesign() {\n    return { template: 'step', tpl: { delay: 200, jitter: 0, start: 20, n: 2, at: 300, dur: 150, hold: 500 },\n      detect: { auto: true, onDb: -12, offDb: -18, onThresh: 0.02, onHold: 0.02, offThresh: 0.01, offMin: 0.02 },\n      blocks: [{ start: { ev: 'on', k: 1, ms: 200 }, end: { ev: 'none', k: 1, ms: 0 }, what: { f1: 20, f2: 0, st: 0, db: 0 } }] };\n  }\n  const TEMPLATES = {\n    whole: { label: 'Whole utterance', blurb: 'On for the whole trial.', controls: [],\n      blocks: t => [{ start: { ev: 't0', k: 1, ms: 0 }, end: { ev: 'none', k: 1, ms: 0 } }] },\n    step: { label: 'Sudden step after voice onset', blurb: 'Turns on a fixed time after the voice starts and stays on.', controls: [['delay', 'Delay after voice onset', 'ms', 20, 2000, 10], ['jitter', 'Random extra delay, up to', 'ms', 0, 1000, 10]],\n      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.delay }, end: { ev: 'none', k: 1, ms: 0 } }] },\n    vowel: { label: 'During the vowel only', blurb: 'From voice onset to the end of the first sound.', controls: [['start', 'Start after voice onset', 'ms', 20, 1000, 10]],\n      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.start }, end: { ev: 'off', k: 1, ms: 0 } }] },\n    nth: { label: 'Nth word or syllable', blurb: 'Only during one sound, as Audapter\\'s level rules count them.', controls: [['n', 'Sound number', '', 1, 20, 1]],\n      blocks: t => [{ start: { ev: 'on', k: Math.max(1, t.n | 0), ms: 20 }, end: { ev: 'off', k: Math.max(1, t.n | 0), ms: 0 } }] },\n    pulse: { label: 'Brief pulse', blurb: 'A short perturbation some time after voice onset.', controls: [['at', 'Starts after voice onset', 'ms', 20, 3000, 10], ['dur', 'Lasts', 'ms', 10, 1000, 10]],\n      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.at }, end: { ev: 'dur', k: 1, ms: t.dur } }] },\n    stepback: { label: 'Step, then return', blurb: 'On after voice onset, then back to normal while the voice continues.', controls: [['delay', 'Delay after voice onset', 'ms', 20, 2000, 10], ['hold', 'Stays on for', 'ms', 50, 5000, 10]],\n      blocks: t => [{ start: { ev: 'on', k: 1, ms: t.delay }, end: { ev: 'dur', k: 1, ms: t.hold } }] },\n  };\n  const refText = (r, isEnd) => r.ev === 't0' ? (r.ms ? `${r.ms} ms into the trial` : 'the trial start') : r.ev === 'none' ? 'the end of the trial'\n    : r.ev === 'dur' ? `${r.ms} ms later` : `${r.ms ? r.ms + ' ms after ' : ''}sound ${r.k} ${r.ev === 'on' ? 'starts' : 'ends'}`;\n\n  // Compile blocks to a linear OST chain. Every \"sound ends\" rule (INTENSITY_FALL) comes after the matching \"sound starts\"\n  // rule (INTENSITY_RISE_HOLD), which sets Audapter's lastStatEnd within the trial, so no rule depends on the previous\n  // trial (OST-F1); no maxIOI (OST-F2) and no AND_RATIO rules (OST-F8) are used.\n  function compileDesign(d) {\n    const det = d.detect, rules = [], bounds = [], errors = [], notes = [];\n    let s = 0, next = { ev: 'on', k: 1 }, known = true, abs = 0;\n    const evIdx = r => (r.k - 1) * 2 + (r.ev === 'off' ? 1 : 0), nextIdx = () => evIdx(next);\n    const add = (mode, p1, p2, span) => { rules.push({ stat: s, mode, p1, p2, p3: null }); s += span; };\n    function to(ref, label, startState) {\n      if (ref.ev === 'none') return null;\n      if (ref.ev === 't0') {\n        if (!known) { errors.push(`${label}: Audapter can only time from the trial start while nothing else has been detected yet. Anchor it to a sound instead.`); return s; }\n        const dt = ref.ms / 1000 - abs;\n        if (dt < 0) { errors.push(`${label}: it comes before the previous boundary.`); return s; }\n        if (dt > 0) add('ELAPSED_TIME', dt, NaN, 1);\n        abs = ref.ms / 1000; return s;\n      }\n      if (ref.ev === 'dur') { if (ref.ms > 0) add('ELAPSED_TIME', ref.ms / 1000, NaN, 1); abs += ref.ms / 1000; return s; }\n      const target = evIdx(ref);\n      if (target < nextIdx()) { errors.push(`${label}: sound ${ref.k} ${ref.ev === 'on' ? 'start' : 'end'} has already gone by at this point of the design; Audapter's rules only move forward.`); return s; }\n      while (nextIdx() <= target) {\n        if (next.ev === 'on') { add('INTENSITY_RISE_HOLD', det.onThresh, det.onHold, 2); next = { ev: 'off', k: next.k }; }\n        else { add('INTENSITY_FALL', det.offThresh, det.offMin, 1); next = { ev: 'on', k: next.k + 1 }; }\n      }\n      known = false;\n      let extra = ref.ms / 1000 - (ref.ev === 'on' ? det.onHold : 0);\n      if (extra < -1e-9) { notes.push(`${label}: Audapter confirms a voice onset only after the ${Math.round(det.onHold * 1000)} ms hold, so the earliest start is onset + ${Math.round(det.onHold * 1000)} ms.`); extra = 0; }\n      if (extra > 1e-9) add('ELAPSED_TIME', extra, NaN, 1);\n      return s;\n    }\n    d.blocks.forEach((b, i) => {\n      const a = to(b.start, `Block ${i + 1} start`);\n      if (a === null) { errors.push(`Block ${i + 1} needs a start.`); return; }\n      if (b.end.ev === 'dur' && !(b.end.ms > 0)) errors.push(`Block ${i + 1} has no duration.`);\n      const e = to(b.end, `Block ${i + 1} end`);\n      bounds.push({ block: i, start: a, end: e === null ? Infinity : e });\n      if (e === null && i < d.blocks.length - 1) errors.push(`Block ${i + 1} lasts to the end of the trial, so later blocks can never start.`);\n    });\n    rules.push({ stat: s, mode: 'OST_END', p1: NaN, p2: NaN, p3: null });\n    const nStates = s + 1, whatOf = [];\n    for (let k = 0; k < nStates; k++) { const b = bounds.find(x => k >= x.start && k < x.end); whatOf.push(b ? { block: b.block, ...d.blocks[b.block].what } : null); }\n    return { ost: { rmsSlopeWin: 0.03, rules, maxIOI: [] }, nStates, whatOf, bounds, errors, notes };\n  }\n\n  // ---------- vowel variability field (inward / outward): heard = centre + k (spoken - centre), k = 1 -/+ strength.\n  // Compiled to Audapter's 2-D field with absolute units (bRatioShift = 0): sF1 = F1 + amp cos(phi), sF2 = F2 + amp sin(phi)\n  // (Audapter.cpp:1858-1860), pertAmp2D[i][j] with i = F1 grid index, j = F2 grid index (MATLAB column-major i + 257 j).\n  // Audapter reads the lower-left cell without interpolating (FMT-F3), so each cell holds the value at its centre:\n  // the applied shift is piecewise constant, within half a grid step of the intended one per axis.\n  const variCache = { key: '', v: null };\n  const mel2hz = m => 700 * (Math.exp(m / 1127.01048) - 1);\n  function variField(v) {\n    const key = JSON.stringify(v);\n    if (variCache.key === key) return variCache.v;\n    const mel = v.units === 'mel', cv = f => (mel ? hz2mel(f) : f);\n    const c1 = cv(v.c1), c2 = cv(v.c2);\n    const lo1 = cv(Math.max(60, v.c1 - v.ext1)), hi1 = cv(v.c1 + v.ext1), lo2 = cv(Math.max(200, v.c2 - v.ext2)), hi2 = cv(v.c2 + v.ext2);\n    const g1 = Array.from({ length: GRID }, (_, i) => lo1 + (hi1 - lo1) * i / (GRID - 1)), g2 = Array.from({ length: GRID }, (_, j) => lo2 + (hi2 - lo2) * j / (GRID - 1));\n    const st1 = g1[1] - g1[0], st2 = g2[1] - g2[0], k = (v.strength || 0) / 100, sign = v.dir === 'out' ? 1 : -1;\n    const A2 = new Array(GRID * GRID).fill(0), P2 = new Array(GRID * GRID).fill(0);\n    for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) {\n      const d1 = g1[i] + st1 / 2 - c1, d2 = g2[j] + st2 / 2 - c2, dist = Math.hypot(d1, d2);\n      let amp = k * dist; if (v.maxShift > 0) amp = Math.min(amp, v.maxShift);\n      A2[i + GRID * j] = amp; P2[i + GRID * j] = dist > 0 ? Math.atan2(sign * d2, sign * d1) : 0;\n    }\n    const out = { g1, g2, A2, P2, mel, c1, c2, step1: st1, step2: st2, lo1, hi1, lo2, hi2 };\n    variCache.key = key; variCache.v = out;\n    return out;\n  }\n  // Audapter's 2-D lookup (locateF1/locateF2 binary search, Audapter.cpp:2675-2727, then the lower-left cell) and shift,\n  // for a compiled parameter map. Returns [sF1, sF2] in Hz, or null outside the field bounds.\n  function apply2D(m, f1, f2) {\n    const g1 = m.get('pertf1'), g2 = m.get('pertf2'), A = m.get('pertamp2d'), P = m.get('pertphi2d');\n    const mel = Number([].concat(m.get('bmelshift'))[0]) === 1, ratio = Number([].concat(m.get('bratioshift'))[0]) === 1;\n    const x1 = mel ? hz2mel(f1) : f1, x2 = mel ? hz2mel(f2) : f2;\n    const b = k => Number([].concat(m.get(k))[0]);\n    if (!(x2 >= b('f2min') && x2 <= b('f2max') && x1 >= b('f1min') && x1 <= b('f1max'))) return null;\n    const locate = (g, f) => {\n      let k = 128; for (let n = 0; n < 7; n++) k += (f >= g[k] ? 1 : -1) * (1 << (6 - n));\n      if (f < g[k]) k--;\n      let loc = k + (f - g[k]) / (g[k + 1] - g[k]);\n      if (loc >= GRID - 1) loc = GRID - 1 - 1e-12; if (loc < 0) loc = 0;\n      return Math.floor(loc);\n    };\n    const i = locate(g1, x1), j = locate(g2, x2), amp = A[i + GRID * j], phi = P[i + GRID * j];\n    const s1 = ratio ? x1 * (1 + amp * Math.cos(phi)) : x1 + amp * Math.cos(phi), s2 = ratio ? x2 * (1 + amp * Math.sin(phi)) : x2 + amp * Math.sin(phi);\n    return mel ? [mel2hz(s1), mel2hz(s2)] : [s1, s2];\n  }\n  // The intended (smooth) heard point for the variability field, in Hz.\n  function variIntended(v, f1, f2) {\n    const mel = v.units === 'mel', cv = f => (mel ? hz2mel(f) : f), inv = x => (mel ? mel2hz(x) : x);\n    const c1 = cv(v.c1), c2 = cv(v.c2), x1 = cv(f1), x2 = cv(f2), d1 = x1 - c1, d2 = x2 - c2, dist = Math.hypot(d1, d2);\n    let amp = (v.strength / 100) * dist; if (v.maxShift > 0) amp = Math.min(amp, v.maxShift);\n    const sg = v.dir === 'out' ? 1 : -1, u1 = dist ? sg * d1 / dist : 0, u2 = dist ? sg * d2 / dist : 0;\n    return [inv(x1 + amp * u1), inv(x2 + amp * u2)];\n  }\n\n  function defaultSettings() {\n    return {\n      v: 1, preset: 'female', build: 'lite',\n      shift: {\n        formant: { on: true, units: 'pct', f1: 20, f2: 0, field: 'all',\n          region: { f1min: 250, f1max: 1000, f2min: 600, f2max: 3000 },\n          curve: [[800, 0, 0], [1500, 20, 0], [2500, 0, 0]],\n          painted: { res: 4, cells: [] },\n          vari: { dir: 'in', strength: 50, maxShift: 0, centre: 'auto', c1: 600, c2: 1700, units: 'hz', ext1: 450, ext2: 900 } },\n        pitch: { on: false, method: 'pvoc', semitones: 2, algorithm: 0, lower: null, upper: null, ramp: 0.05 },\n        loudness: { on: false, db: 6 },\n        timing: { on: false, rate1: 0.5, dur1: 0.1, hold: 0.1, rate2: 2 },\n        delay: { on: false, ms: 100 },\n      },\n      when: { mode: 'always', after: 0.3, until: 1.0, onThresh: 0.02, onHold: 0.02, offThresh: 0.01, offHold: 0.02, onDelay: 0, ost: '', pcf: '' },\n      design: defaultDesign(),\n      listen: {},\n      hear: { fb: 1, noise: { type: 'pink', seconds: 10, level: -20, gain: 1 }, gainDb: 0 },\n      raw: {},\n    };\n  }\n\n  // Deep-merge onto defaults so partial / older JSON loads safely.\n  function normalize(s) {\n    const d = defaultSettings();\n    const merge = (a, b) => {\n      if (b === undefined || b === null) return a;\n      if (Array.isArray(a) || typeof a !== 'object' || a === null) return b;\n      const o = { ...a };\n      for (const k of Object.keys(b)) o[k] = (k in a) ? merge(a[k], b[k]) : b[k];\n      return o;\n    };\n    const o = merge(d, s || {});\n    if (!PRESETS[o.preset]) o.preset = 'female';\n    return o;\n  }\n\n  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);\n  function setPath(o, p, v) { const ks = p.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null) a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; return o; }\n\n  // Base parameter map (ordered) for a preset, after the \"how Audapter listens\" overrides.\n  function baseParams(s) {\n    const pr = PRESETS[s.preset] || PRESETS.female;\n    const m = new Map(DEF[pr.sex].map(([k, v]) => [k.toLowerCase(), decode(v)]));\n    const put = (k, v) => { if (v !== undefined && v !== null && v !== '') m.set(k.toLowerCase(), v); };\n    for (const [k, v] of Object.entries(pr.params)) put(k, v);\n    for (const [k, v] of Object.entries(s.listen || {})) put(k, v);\n    return m;\n  }\n  const num = (m, k) => { const v = m.get(k); return Array.isArray(v) ? Number(v[0]) : Number(v); };\n\n  // ---------- OST / PCF text formats\n  const OST_MODES = {\n    OST_END: { code: 0, span: 0, sets: false, params: [], text: 'Final state: nothing happens after this.' },\n    ELAPSED_TIME: { code: 1, span: 1, sets: false, params: ['duration (s)'],\n      text: 'Move on after a fixed time in this state.' },\n    INTENSITY_RISE_HOLD: { code: 5, span: 2, sets: true, params: ['level threshold (RMS)', 'hold (s)'],\n      text: 'Level rises above the threshold (next state), and moves on once it has stayed above it for the hold time; drops back if it falls first.' },\n    INTENSITY_RISE_HOLD_POS_SLOPE: { code: 6, span: 2, sets: true, params: ['level threshold (RMS)', 'hold (s)'],\n      text: 'Like the rise-and-hold rule, but the level must also keep rising during the hold.' },\n    POS_INTENSITY_SLOPE_STRETCH: { code: 10, span: 2, sets: true, params: ['frames of rising level'],\n      text: 'The level keeps rising for more than the given number of frames.' },\n    NEG_INTENSITY_SLOPE_STRETCH_SPAN: { code: 11, span: 2, sets: true, params: ['frames of falling level', 'summed slope below'],\n      text: 'The level keeps falling for more than the given number of frames, by more than the given total slope.' },\n    INTENSITY_SLOPE_BELOW_THRESH: { code: 12, span: 2, sets: true, params: ['slope threshold', 'duration (s)'],\n      text: 'The level slope stays below the threshold for the duration.' },\n    INTENSITY_SLOPE_ABOVE_THRESH: { code: 13, span: 2, sets: true, params: ['slope threshold', 'duration (s)'],\n      text: 'The level slope stays above the threshold for the duration.' },\n    INTENSITY_FALL: { code: 20, span: 1, sets: true, params: ['level threshold (RMS)', 'minimum time (s)'],\n      text: 'Level has been below the threshold for 10 ms, and more than the minimum time has passed since the last level-based state change.' },\n    INTENSITY_BELOW_THRESH_NEG_SLOPE: { code: 21, span: 2, sets: true, params: ['level threshold (RMS)', 'duration (s)'],\n      text: 'Level is below the threshold and falling, for the duration.' },\n    INTENSITY_RATIO_RISE: { code: 30, span: 3, sets: true, params: ['ratio threshold', 'hold (s)'],\n      text: 'The high-frequency energy ratio (high for /s/-like sounds) rises above the threshold, holds, then falls back.' },\n    INTENSITY_RATIO_FALL_HOLD: { code: 31, span: 3, sets: true, params: ['ratio threshold', 'hold (s)'],\n      text: 'The high-frequency energy ratio falls below the threshold and holds.' },\n    INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR: { code: 32, span: 2, sets: false, params: ['ratio threshold', 'hold (s)'],\n      text: 'The high-frequency energy ratio stays above the threshold (ignored when the level is below 0.0003).' },\n    INTENSITY_AND_RATIO_ABOVE_THRESH: { code: 40, span: 2, sets: true, params: ['level threshold (RMS)', 'ratio threshold', 'hold (s)'],\n      text: 'Both level and high-frequency ratio are above their thresholds, for the hold time. Blab reads the hold from the 5th field, where the manual puts {} (OST-F8).' },\n    INTENSITY_AND_RATIO_BELOW_THRESH: { code: 45, span: 2, sets: true, params: ['level threshold (RMS)', 'ratio threshold', 'hold (s)'],\n      text: 'Both level and high-frequency ratio are below their thresholds, for the hold time (hold in the 5th field, OST-F8).' },\n  };\n  const OST_BY_CODE = Object.fromEntries(Object.entries(OST_MODES).map(([k, v]) => [v.code, k]));\n  const fmtNum = v => (v === null || v === undefined || Number.isNaN(v)) ? 'NaN' : String(+Number(v).toPrecision(6));\n\n  function parseOst(text) {\n    const lines = String(text || '').split(/\\r?\\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean);\n    const out = { rmsSlopeWin: 0.03, rules: [], maxIOI: [], errors: [] };\n    if (!lines.length) return out;\n    let i = 0;\n    const m0 = /^rmsSlopeWin\\s*=\\s*(\\S+)$/.exec(lines[i]);\n    if (!m0) out.errors.push(`line 1: expected \"rmsSlopeWin = <s>\", got \"${lines[i]}\"`); else { out.rmsSlopeWin = +m0[1]; i++; }\n    const m1 = /^n\\s*=\\s*(\\d+)$/.exec(lines[i] || '');\n    if (!m1) { out.errors.push(`expected \"n = <number of rules>\"`); return out; }\n    const n = +m1[1]; i++;\n    for (let k = 0; k < n; k++, i++) {\n      const it = (lines[i] || '').split(/[\\s,]+/).filter(Boolean);\n      if (it.length !== 5) { out.errors.push(`rule ${k + 1}: expected 5 fields, got ${it.length} (\"${lines[i] || ''}\")`); continue; }\n      let mode = it[1];\n      if (/^\\d+$/.test(mode)) mode = OST_BY_CODE[+mode] || mode;\n      if (!OST_MODES[mode]) out.errors.push(`rule ${k + 1}: unknown mode \"${it[1]}\"`);\n      const p = x => (x === '{}' ? null : x.toLowerCase() === 'nan' ? NaN : +x);\n      out.rules.push({ stat: +it[0], mode, p1: p(it[2]), p2: p(it[3]), p3: p(it[4]) });\n    }\n    const m2 = /^n\\s*=\\s*(\\d+)$/.exec(lines[i] || '');\n    if (m2) {\n      i++;\n      for (let k = 0; k < +m2[1]; k++, i++) {\n        const it = (lines[i] || '').split(/[\\s,]+/).filter(Boolean);\n        if (it.length !== 3) { out.errors.push(`maxIOI line ${k + 1}: expected 3 fields`); continue; }\n        out.maxIOI.push({ stat0: +it[0], interval: +it[1], stat1: +it[2] });\n      }\n    }\n    return out;\n  }\n  function serializeOst(o) {\n    const f = v => (v === null || v === undefined) ? '{}' : fmtNum(v);\n    return `rmsSlopeWin = ${Number(o.rmsSlopeWin ?? 0.03).toFixed(6)}\\n\\nn = ${o.rules.length}\\n` +\n      o.rules.map(r => `${r.stat} ${r.mode} ${f(r.p1)} ${f(r.p2)} ${f(r.p3)}`).join('\\n') +\n      `\\n\\nn = ${o.maxIOI.length}\\n` + o.maxIOI.map(m => `${m.stat0} ${fmtNum(m.interval)} ${m.stat1}`).join('\\n') + (o.maxIOI.length ? '\\n' : '');\n  }\n  function ostStateCount(o) {\n    let mx = 0;\n    for (const r of o.rules) mx = Math.max(mx, r.stat + (OST_MODES[r.mode] ? OST_MODES[r.mode].span : 0));\n    for (const m of o.maxIOI) mx = Math.max(mx, m.stat1, m.stat0);\n    return o.rules.length ? mx + 1 : 0;\n  }\n  function parsePcf(text) {\n    const lines = String(text || '').split(/\\r?\\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean);\n    const out = { warps: [], rows: [], errors: [] };\n    if (!lines.length) return out;\n    let i = 0;\n    const nw = +lines[i++];\n    if (!Number.isInteger(nw)) { out.errors.push('line 1: expected the number of time-warp events'); return out; }\n    for (let k = 0; k < nw; k++, i++) {\n      const it = (lines[i] || '').split(/[\\s,]+/).filter(Boolean).map(Number);\n      if (it.length === 5) out.warps.push({ ostInitState: null, tBegin: it[0], rate1: it[1], dur1: it[2], hold: it[3], rate2: it[4] });\n      else if (it.length === 6) out.warps.push({ ostInitState: it[0], tBegin: it[1], rate1: it[2], dur1: it[3], hold: it[4], rate2: it[5] });\n      else out.errors.push(`warp ${k + 1}: expected 5 or 6 fields`);\n    }\n    const n = +lines[i++];\n    if (!Number.isInteger(n)) { out.errors.push('expected the number of state rows'); return out; }\n    for (let k = 0; k < n; k++, i++) {\n      const it = (lines[i] || '').split(/[\\s,]+/).filter(Boolean).map(Number);\n      if (it.length !== 5) { out.errors.push(`row ${k + 1}: expected 5 fields (state, pitch st, level dB, formant amp, formant angle)`); continue; }\n      if (it[0] !== k) out.errors.push(`row ${k + 1}: state number must be ${k} (Audapter rejects out-of-order rows)`);\n      out.rows.push({ stat: it[0], pitch: it[1], db: it[2], amp: it[3], phi: it[4] });\n    }\n    return out;\n  }\n  function serializePcf(o) {\n    const w = o.warps.map(x => (x.ostInitState === null || x.ostInitState === undefined ? '' : `${x.ostInitState}, `) +\n      [x.tBegin, x.rate1, x.dur1, x.hold, x.rate2].map(fmtNum).join(', '));\n    return `${o.warps.length}\\n${w.join('\\n')}${w.length ? '\\n' : ''}\\n${o.rows.length}\\n` +\n      o.rows.map((r, i) => `${i}, ${fmtNum(r.pitch)}, ${fmtNum(r.db)}, ${fmtNum(r.amp)}, ${fmtNum(r.phi)}`).join('\\n') + '\\n';\n  }\n\n  // ---------- formant perturbation vector in Audapter's units\n  function fmtVector(fm) {\n    if (fm.units === 'pct') return { amp: Math.hypot(fm.f1 / 100, fm.f2 / 100), phi: Math.atan2(fm.f2 / 100, fm.f1 / 100) };\n    return { amp: Math.hypot(fm.f1, fm.f2), phi: Math.atan2(fm.f2, fm.f1) };   // Hz or mel\n  }\n  const unitsFlags = u => (u === 'pct' ? { bratioshift: 1, bmelshift: 0 } : u === 'hz' ? { bratioshift: 0, bmelshift: 0 } : { bratioshift: 0, bmelshift: 1 });\n\n  // ---------- compile: settings -> { list: [[name, value]], ost, pcf, notes, meta }\n  function compile(settings) {\n    const s = normalize(settings), m = baseParams(s), notes = [];\n    const sr = num(m, 'srate'), frameLen = num(m, 'framelen'), nDelay = num(m, 'ndelay');\n    const F = s.shift.formant, Pi = s.shift.pitch, L = s.shift.loudness, T = s.shift.timing, D = s.shift.delay, W = s.when;\n    const isDesign = W.mode === 'design', cd = isDesign ? compileDesign(s.design) : null;\n    const anyW = k => isDesign && s.design.blocks.some(b => b.what && b.what[k]);\n    const fOn = isDesign ? (anyW('f1') || anyW('f2')) : F.on && (F.f1 !== 0 || F.f2 !== 0 || F.field === 'curve' || F.field === 'painted' || F.field === 'variability');\n    const pvoc = isDesign ? anyW('st') : Pi.on && Pi.method === 'pvoc', tds = !isDesign && Pi.on && Pi.method === 'tds';\n    const timeWhen = W.mode !== 'always';\n    // A PCF is needed for anything per-state: level shifts, time warps, pvoc pitch or formant shifts that are not always on.\n    const needPcf = isDesign || W.mode === 'custom' || (L.on && L.db !== 0) || (T.on && !isDesign) || (timeWhen && (fOn || pvoc));\n    if (isDesign) {\n      if (Pi.on && Pi.method === 'tds' && anyW('st')) notes.push({ where: 'when', text: 'Time-domain pitch shifting follows its own schedule, not OST states, so a timeline design shifts pitch with the phase vocoder.' });\n      if (T.on) notes.push({ where: 'when', text: 'The time-warp card is not used by a timeline design.' });\n      if (F.on && F.field !== 'all') notes.push({ where: 'when', text: 'A timeline design uses a PCF, so the formant shift is uniform (the field shape is not used).' });\n    }\n    const vec = fmtVector(F), mel = F.units === 'mel';\n\n    // formant shift\n    if (fOn || (W.mode === 'custom' && F.on)) {\n      m.set('bshift', 1);\n      for (const [k, v] of Object.entries(unitsFlags(F.units))) m.set(k, v);\n      const top = mel ? hz2mel(FMAX) : FMAX, grid = Array.from({ length: GRID }, (_, i) => top * i / (GRID - 1));\n      m.set('pertf1', grid); m.set('pertf2', grid);\n      const cv = f => (mel ? hz2mel(f) : f);\n      if (!needPcf && F.field === 'region') {\n        m.set('f1min', cv(F.region.f1min)); m.set('f1max', cv(F.region.f1max)); m.set('f2min', cv(F.region.f2min)); m.set('f2max', cv(F.region.f2max));\n      }\n      if (!needPcf && F.field === 'curve') {\n        const pts = [...F.curve].sort((a, b) => a[0] - b[0]), amp = [], phi = [];\n        for (let i = 0; i < GRID; i++) {\n          const f2 = FMAX * i / (GRID - 1);\n          let d1 = 0, d2 = 0;\n          if (pts.length) {\n            if (f2 <= pts[0][0]) [, d1, d2] = pts[0];\n            else if (f2 >= pts[pts.length - 1][0]) [, d1, d2] = pts[pts.length - 1];\n            else for (let k = 0; k < pts.length - 1; k++) if (f2 >= pts[k][0] && f2 <= pts[k + 1][0]) {\n              const u = (f2 - pts[k][0]) / Math.max(1e-9, pts[k + 1][0] - pts[k][0]);\n              d1 = pts[k][1] + u * (pts[k + 1][1] - pts[k][1]); d2 = pts[k][2] + u * (pts[k + 1][2] - pts[k][2]); break;\n            }\n          }\n          const v = fmtVector({ units: F.units, f1: d1, f2: d2 }); amp.push(v.amp); phi.push(v.phi);\n        }\n        m.set('pertamp', amp); m.set('pertphi', phi);\n      } else if (!needPcf && F.field === 'painted') {\n        const A2 = new Array(GRID * GRID).fill(0), P2 = new Array(GRID * GRID).fill(0), r = F.painted.res || 4;\n        for (const [ci, cj, d1, d2] of F.painted.cells) {\n          const v = fmtVector({ units: F.units, f1: d1, f2: d2 });\n          for (let i = ci * r; i < Math.min(GRID, ci * r + r); i++) for (let j = cj * r; j < Math.min(GRID, cj * r + r); j++) {\n            A2[i + GRID * j] = v.amp; P2[i + GRID * j] = v.phi;   // MATLAB column-major: row i = F1 index, column j = F2 index\n          }\n        }\n        m.set('bshift2d', 1); m.set('pertamp2d', A2); m.set('pertphi2d', P2);\n        m.set('pertamp', new Array(GRID).fill(0)); m.set('pertphi', new Array(GRID).fill(0));\n      } else {\n        m.set('pertamp', new Array(GRID).fill(needPcf ? 0 : vec.amp)); m.set('pertphi', new Array(GRID).fill(needPcf ? 0 : vec.phi));\n      }\n      if (!needPcf && F.field === 'variability') {\n        const V = variField(F.vari);\n        m.set('bratioshift', 0); m.set('bmelshift', V.mel ? 1 : 0); m.set('bshift2d', 1);\n        m.set('pertf1', V.g1); m.set('pertf2', V.g2); m.set('pertamp2d', V.A2); m.set('pertphi2d', V.P2);\n        m.set('pertamp', new Array(GRID).fill(0)); m.set('pertphi', new Array(GRID).fill(0));\n        m.set('f1min', V.g1[0]); m.set('f1max', V.g1[GRID - 1]); m.set('f2min', V.g2[0]); m.set('f2max', V.g2[GRID - 1]);\n      }\n      if (needPcf && F.field !== 'all') notes.push({ where: 'formant', text: 'A PCF is in use (for the timing, loudness or \"when\" settings), so Audapter takes the formant shift from the PCF row and ignores the field shape: the shift is uniform.' });\n    }\n\n    // pitch\n    if (pvoc || (T.on && !isDesign)) {\n      m.set('bpitchshift', 1); m.set('btimedomainshift', 0);\n      m.set('pitchshiftratio', pvoc && !needPcf ? Math.pow(2, Pi.semitones / 12) : 1);\n    }\n    if (tds) {\n      m.set('btimedomainshift', 1); m.set('bpitchshift', 0); m.set('bcepslift', 1);\n      const sex = PRESETS[s.preset].sex, dl = s.preset === 'child' ? [200, 450] : sex === 'male' ? [80, 160] : [150, 300];\n      m.set('pitchlowerboundhz', Pi.lower ?? (num(m, 'pitchlowerboundhz') || dl[0]));\n      m.set('pitchupperboundhz', Pi.upper ?? (num(m, 'pitchupperboundhz') || dl[1]));\n      const r = Math.pow(2, Pi.semitones / 12), ramp = Math.max(0.001, Pi.ramp || 0.001);\n      let sch = [0, r];\n      if (W.mode === 'after') sch = [0, 1, W.after, 1, W.after + ramp, r];\n      else if (W.mode === 'window') sch = [0, 1, W.after, 1, W.after + ramp, r, Math.max(W.until, W.after + ramp + 0.001), r, Math.max(W.until, W.after + ramp + 0.001) + ramp, 1];\n      else if (W.mode === 'vowel' && W.onDelay > 0) sch = [0, 1, W.onDelay, 1, W.onDelay + ramp, r];\n      m.set('timedomainpitchshiftschedule', sch);\n      m.set('timedomainpitchshiftalgorithm', Pi.algorithm | 0);\n    }\n\n    // delay (DAF)\n    if (D.on) m.set('delayframes', Math.round(D.ms / 1000 * sr / frameLen));\n\n    // what the participant hears\n    const H = s.hear;\n    m.set('fb', H.fb | 0);\n    if (H.fb >= 2 && H.fb <= 5) {\n      const n = Math.min(480000, Math.max(48, Math.round((H.noise.seconds || 10) * 48000)));\n      const key = `${n}|${H.noise.type}|${H.noise.level}`;\n      if (!noiseCache.has(key)) { noiseCache.clear(); noiseCache.set(key, Array.from(G.DSP.noise(n, { type: H.noise.type, level: H.noise.level, seed: 7 }))); }\n      m.set('datapb', noiseCache.get(key));\n      const g = H.noise.gain ?? 1;\n      if (H.fb === 2) m.set('fb2gain', g);\n      if (H.fb === 3) m.set('fb3gain', g);\n      if (H.fb === 4) m.set('fb4gaindb', num(m, 'fb4gaindb'));\n      if (H.fb === 5) m.set('fb5gain_playback', g);\n    }\n    if (H.gainDb) m.set('scale', num(m, 'scale') * Math.pow(10, H.gainDb / 20));\n\n    // when: OST + PCF\n    let ost = null, pcf = null, perturbStates = [];\n    if (W.mode === 'custom') { ost = W.ost || ''; pcf = W.pcf || ''; }\n    else if (isDesign) {\n      ost = serializeOst(cd.ost);\n      pcf = serializePcf({ warps: [], rows: cd.whatOf.map(w => { if (!w) return { pitch: 0, db: 0, amp: 0, phi: 0 };\n        const v = fmtVector({ units: F.units, f1: w.f1 || 0, f2: w.f2 || 0 }); return { pitch: w.st || 0, db: w.db || 0, amp: (w.f1 || w.f2) ? v.amp : 0, phi: (w.f1 || w.f2) ? v.phi : 0 }; }) });\n      perturbStates = cd.whatOf.map((w, k) => (w ? k : -1)).filter(k => k >= 0);\n      for (const e of cd.errors) notes.push({ where: 'design', level: 'error', text: e });\n      for (const e of cd.notes) notes.push({ where: 'design', text: e });\n    }\n    else if (needPcf) {\n      const R = [];\n      if (W.mode === 'always') { perturbStates = [0]; }\n      else if (W.mode === 'after') { R.push([0, 'ELAPSED_TIME', W.after, NaN, null]); perturbStates = [1]; }\n      else if (W.mode === 'window') { R.push([0, 'ELAPSED_TIME', W.after, NaN, null], [1, 'ELAPSED_TIME', Math.max(0.002, W.until - W.after), NaN, null]); perturbStates = [1]; }\n      else if (W.mode === 'vowel') {\n        R.push([0, 'INTENSITY_RISE_HOLD', W.onThresh, W.onHold, null]);\n        let st = 2;\n        if (W.onDelay > 0) { R.push([2, 'ELAPSED_TIME', W.onDelay, NaN, null]); st = 3; }\n        R.push([st, 'INTENSITY_FALL', W.offThresh, W.offHold, null]); perturbStates = [st];\n      }\n      const endState = R.length ? R[R.length - 1][0] + (OST_MODES[R[R.length - 1][1]].span) : 0;\n      R.push([endState, 'OST_END', NaN, NaN, null]);\n      ost = serializeOst({ rmsSlopeWin: 0.03, rules: R.map(([stat, mode, p1, p2, p3]) => ({ stat, mode, p1, p2, p3 })), maxIOI: [] });\n      const rows = [];\n      for (let k = 0; k <= endState; k++) {\n        const on = perturbStates.includes(k);\n        rows.push({ pitch: on && pvoc ? Pi.semitones : 0, db: on && L.on ? L.db : 0, amp: on && fOn ? vec.amp : 0, phi: on && fOn ? vec.phi : 0 });\n      }\n      const warps = [];\n      if (T.on) {\n        const w = { tBegin: 0, rate1: T.rate1, dur1: T.dur1, hold: T.hold, rate2: T.rate2, ostInitState: null };\n        if (W.mode === 'after' || W.mode === 'window') w.tBegin = W.after;\n        if (W.mode === 'vowel') { w.ostInitState = perturbStates[0]; w.tBegin = 0; }\n        warps.push(w);\n      }\n      pcf = serializePcf({ warps, rows });\n    }\n\n    // raw overrides from the full parameter table come last and win\n    for (const [k, v] of Object.entries(s.raw || {})) if (v !== undefined && v !== null && v !== '') m.set(k.toLowerCase(), v);\n\n    const list = [...m.entries()].map(([k, v]) => [k, v]);\n    const g = k => num(m, k);\n    const meta = { sr, frameLen: g('framelen'), nDelay: g('ndelay'), downFact: g('downfact'), nLPC: g('nlpc'), rmsThr: g('rmsthr'),\n      latencyMs: 1000 * g('ndelay') * g('framelen') / g('srate'), windowMs: 1000 * (g('framelen') + 2 * (g('ndelay') - 1) * g('framelen')) / g('srate'),\n      perturbStates, design: cd, needPcf, pvoc: g('bpitchshift') === 1, tds: g('btimedomainshift') === 1 };\n    return { list, ost, pcf, notes, meta, map: m };\n  }\n\n  // ---------- warnings from the audit's findings, attached to where they apply\n  function warnings(settings, c, ctx = {}) {\n    const s = normalize(settings), out = [], m = c.map, g = k => num(m, k);\n    const W = (where, id, level, text) => out.push({ where, id, level, text });\n    const frameLen = g('framelen'), nDelay = g('ndelay'), sr = g('srate');\n    for (const n of c.notes || []) W(n.where === 'design' ? 'design' : n.where, null, n.level || 'info', n.text);\n    // hard errors Audapter itself raises\n    if (2 * (nDelay - 1) * frameLen > 960) W('listen', null, 'error', `2 × (nDelay − 1) × frameLen = ${2 * (nDelay - 1) * frameLen} exceeds Audapter's maxFrameLen 960: Audapter refuses to run.`);\n    if (g('btimedomainshift') === 1 && g('bpitchshift') === 1) W('pitch', null, 'error', 'bPitchShift and bTimeDomainShift are mutually exclusive: Audapter refuses to run.');\n    if (g('btimedomainshift') === 1 && g('bcepslift') !== 1) W('pitch', null, 'error', 'bTimeDomainShift = 1 requires bCepsLift = 1: Audapter refuses to run.');\n    // pitch tracking window (CORPUS-8)\n    const minF0 = Math.round(3.2 / (c.meta.windowMs / 1000));\n    if (g('btimedomainshift') === 1 && g('pitchlowerboundhz') > 0 && g('pitchlowerboundhz') < minF0)\n      W('pitch', 'CORPUS-8', 'warn', `The pitch lower bound (${g('pitchlowerboundhz')} Hz) is below what a ${c.meta.windowMs.toFixed(0)} ms analysis window (frameLen ${frameLen}, nDelay ${nDelay}) can represent (about ${minF0} Hz). The logged pitchHz, and the TDS band-pass centred on it, will be wrong for lower voices. frameLen 64 / nDelay 7 tracks down to about 60 Hz.`);\n    if (ctx.f0 && ctx.f0 < minF0 * 1.05) W('listen', 'CORPUS-8', 'warn', `This input's pitch (median ${Math.round(ctx.f0)} Hz) is below what the ${c.meta.windowMs.toFixed(0)} ms analysis window represents (about ${minF0} Hz): Audapter's pitchHz will not be F0. Try the \"Low voice\" preset (frameLen 64, nDelay 7).`);\n    // phase vocoder\n    if (g('bpitchshift') === 1) {\n      W('pitch', 'PT-5', 'info', 'The phase vocoder plays about 3.5 dB louder even at 0 semitones, and the level at a pitch-shift onset jumps by 0.8–8.8 dB depending on F0 and vowel. bPvocAmpNorm cannot be switched on.');\n      if (g('pvocframelen') < frameLen) W('pitch', 'PT-11', 'warn', `pvocFrameLen (${g('pvocframelen')}) is shorter than frameLen (${frameLen}).`);\n      if (g('pvochop') < frameLen) W('pitch', '17g', 'error', `pvocHop (${g('pvochop')}) is below frameLen (${frameLen}): Audapter divides by pvocHop / frameLen = 0 and crashes (its own check is broken).`);\n    }\n    if (g('btimedomainshift') === 1) {\n      W('pitch', 'PT-3', 'info', 'The time-domain schedule clock only runs while the level is above rmsThresh: a pause pushes the shift later, and unshifted audio is heard during dips.');\n      W('pitch', 'PT-4', 'info', 'For time-domain shifting the logged pitchShiftRatio is not the applied ratio; compare shiftedPitchHz / pitchHz instead (itself unreliable below the window limit).');\n    }\n    if (s.shift.timing.on && s.shift.pitch.on && s.shift.pitch.method === 'pvoc') W('timing', '17e', 'warn', 'A PCF with both a pitch shift and a time warp silently drops the warp (duplicated condition in Audapter.cpp).');\n    if (s.shift.timing.on) W('timing', 'PT-5', 'info', 'Time warping runs through the phase vocoder, which adds its +3.5 dB level offset.');\n    // formant units (CORPUS-11)\n    const br = g('bratioshift'), bm = g('bmelshift');\n    if (g('bshift') === 1) {\n      const amps = [].concat(m.get('pertamp') || [], s.when.mode !== 'always' ? [] : []);\n      const maxAmp = amps.reduce((a, v) => Math.max(a, Math.abs(v)), 0);\n      if (br === 1 && bm === 1) W('formant', 'CORPUS-11', 'warn', 'Both bRatioShift and bMelShift are 1: the ratio is applied to mel values. Audapter\\'s C++ defaults are ratio 0 / mel 1, the MATLAB defaults ratio 1 / mel 0.');\n      if (br === 1 && maxAmp > 2) W('formant', 'CORPUS-11', 'warn', `Ratio mode with a perturbation amplitude of ${maxAmp.toFixed(2)} (i.e. ${(maxAmp * 100).toFixed(0)} %): Audapter does not bound the shifted targets, and mel-unit values read as ratios have produced targets of 130 kHz and +24 dB bursts.`);\n      if (bm === 1 && br === 0 && maxAmp > 0 && maxAmp < 5) W('formant', 'CORPUS-11', 'info', `Mel mode: the amplitude ${maxAmp.toFixed(2)} is in mel, not a ratio. ${maxAmp.toFixed(2)} mel is a tiny shift.`);\n      if (s.shift.formant.field === 'region' && !c.meta.needPcf) W('formant', 'F6', 'info', 'With a restricted field, blab\\'s dropout fix re-arms the shift every time the formants re-enter the region, and minVowelLen has no effect (upstream shifted only the first entry).');\n      if (s.shift.formant.field === 'variability' && !c.meta.needPcf) { const V = variField(s.shift.formant.vari), u = V.mel ? 'mel' : 'Hz';\n        W('formant', 'FMT-F3', 'info', `Audapter reads the 2-D field at the lower-left grid cell without interpolating, so the applied shift is piecewise constant: the grid step here is ${V.step1.toFixed(1)} ${u} (F1) × ${V.step2.toFixed(1)} ${u} (F2), and each cell holds the shift at its centre (within half a step of the intended shift). Formants outside ±${s.shift.formant.vari.ext1} Hz (F1) / ±${s.shift.formant.vari.ext2} Hz (F2) around the centre are not shifted.`); }\n      if (s.shift.formant.field === 'painted' && !c.meta.needPcf) W('formant', '2D', 'info', 'The 2-D field is looked up at the lower-left grid cell (about 20 Hz steps), not interpolated, and its last row and column are never used.');\n    }\n    if (g('bclampformants') === 1) W('formant', 'FMT-F1', 'warn', 'Clamping reads 2048 values from clampF1/clampF2 whatever length was passed, and the clamp branch skips the voicing check.');\n    // masking noise (I-01, I-02)\n    const fb = g('fb');\n    if (fb >= 2 && fb <= 5) {\n      const pb = (m.get('datapb') || []).length, sec = pb / 48000;\n      if (pb && pb < 480000) W('hear', 'I-01', s.build === 'patched' ? 'info' : 'warn', s.build === 'patched'\n        ? `Noise is ${sec.toFixed(1)} s long. The patched build loops it at its own length.`\n        : `Noise shorter than 10 s (${sec.toFixed(1)} s) is followed by silence until 10 s: the shipped build loops playback at 480 000 samples, not at the noise length. The gap position also carries over between trials. Use 10 s of noise, or the patched build.`);\n      if (fb === 3 && (s.hear.noise.gain ?? 1) === 0) W('hear', null, 'info', 'fb3Gain is 0 (Audapter\\'s default), so the noise is silent in mode 3.');\n      if (fb === 5) W('hear', 'I-02', 'warn', 'Feedback mode 5 applies dScale twice to the speech-modulated part and once to the playback, so the balance depends on each rig\\'s calibration.');\n    }\n    // delay\n    if (s.shift.delay.on) {\n      const df = Math.round(s.shift.delay.ms / 1000 * sr / frameLen);\n      if (df > 600) W('delay', null, 'warn', `${s.shift.delay.ms} ms is ${df} frames; Audapter silently clamps delayFrames to 600 (${(600 * frameLen / sr * 1000).toFixed(0)} ms).`);\n    }\n    // OST / PCF\n    if (c.ost) {\n      const o = parseOst(c.ost), p = parsePcf(c.pcf || ''), nS = ostStateCount(o);\n      for (const e of o.errors) W('ost', null, 'error', 'OST: ' + e);\n      for (const e of p.errors) W('pcf', null, 'error', 'PCF: ' + e);\n      if (c.pcf && p.rows.length < nS) W('pcf', 'OST-F4', 'warn', `The PCF has ${p.rows.length} rows but the OST reaches ${nS} states. Audapter reads past the end of the PCF table for the missing states, so heap garbage decides whether and how much to perturb.`);\n      o.rules.forEach((r, i) => {\n        if (r.mode === 'INTENSITY_FALL' && !o.rules.slice(0, i).some(q => OST_MODES[q.mode] && OST_MODES[q.mode].sets))\n          W('ost', 'OST-F1', ctx.sequence ? 'warn' : 'info', `Rule ${i + 1} (INTENSITY_FALL) comes after rules that never set \"last state end\", so its minimum time counts from ${ctx.sequence ? 'the previous trial: in one Audapter session the offset is detected late, e.g. 1.68 s instead of 0.40 s (fixed in the patched build)' : 'trial start. In a same-session sequence it would count from the previous trial (OST-F1)'}.`);\n        if ((r.mode === 'INTENSITY_AND_RATIO_ABOVE_THRESH' || r.mode === 'INTENSITY_AND_RATIO_BELOW_THRESH') && (r.p3 === null || !(r.p3 > 0)))\n          W('ost', 'OST-F8', 'warn', `Rule ${i + 1}: blab reads this rule's hold time from the 5th field; with {} the hold is 0 and the rule fires immediately.`);\n        if (/SLOPE/.test(r.mode)) W('ost', 'I-05', 'info', `Rule ${i + 1} uses the level slope, which is NaN for the first 14 frames of every trial.`);\n      });\n      if (o.maxIOI.length) W('ost', 'OST-F2', 'warn', `The maxIOI timeout writes the wrong onset index: a following ELAPSED_TIME fires after 2 ms${ctx.sequence ? ', and without reloading the OST the timeout drifts 0.2 → 0.4 → 0.6 s over trials' : ''} (fixed in the patched build).`);\n    }\n    if (ctx.sequence) {\n      W('run', 'COORD-1', 'info', 'In one session, an OST/PCF loaded by an earlier trial stays active for later trials that do not load one (AudapterIO(\\'init\\') does not clear them), and silently overrides their field-mode formant shift.');\n      if (ctx.frameChange) W('run', 'CORPUS-10', 'warn', 'frameLen or nDelay changes between trials of this sequence. Audapter does not rebuild its formant tracker then; on some voices this hangs the core in an endless loop. The page stops a hung run after a timeout.');\n    }\n    // recorder length (I-03)\n    if (ctx.dur && ctx.recorderSec && ctx.dur > ctx.recorderSec - 0.05) W('run', 'I-03', 'warn', `The input (${ctx.dur.toFixed(1)} s) is longer than this build's recorder (${ctx.recorderSec.toFixed(0)} s): the recorder silently wraps and returns only the end. Choose the full-size build for trials up to 30 s.`);\n    return out;\n  }\n\n  // ---------- human-readable summary and diff\n  const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(+Number(v).toPrecision(4));\n  function summarize(settings) {\n    const s = normalize(settings), S = s.shift, parts = [];\n    const u = S.formant.units === 'pct' ? ' %' : S.formant.units === 'hz' ? ' Hz' : ' mel';\n    if (s.when.mode === 'design') {\n      const B = s.design.blocks, w = b => [b.what.f1 ? `F1 ${sgn(b.what.f1)}${u}` : '', b.what.f2 ? `F2 ${sgn(b.what.f2)}${u}` : '', b.what.st ? `pitch ${sgn(b.what.st)} st` : '', b.what.db ? `level ${sgn(b.what.db)} dB` : ''].filter(Boolean).join(', ') || 'nothing';\n      const tl = TEMPLATES[s.design.template];\n      const txt = B.length === 1 ? `${w(B[0])} from ${refText(B[0].start)} to ${refText(B[0].end, true)}` : `${B.length} blocks: ` + B.map(w).join('; ');\n      const extra = [];\n      if (S.delay.on) extra.push(`delay ${S.delay.ms} ms`);\n      if (s.hear.fb !== 1) extra.push(`fb ${s.hear.fb}`);\n      if (s.design.jitterApplied !== undefined) extra.push(`jitter +${s.design.jitterApplied} ms`);\n      return txt + (extra.length ? ', ' + extra.join(', ') : '');\n    }\n    if (S.formant.on) {\n      if (S.formant.field === 'variability') parts.push(`vowel variability ${S.formant.vari.dir === 'in' ? 'inward' : 'outward'} ${S.formant.vari.strength} % (centre ${Math.round(S.formant.vari.c1)}/${Math.round(S.formant.vari.c2)} Hz)`);\n      else if (S.formant.field === 'painted') parts.push(`painted field (${S.formant.painted.cells.length} cells)`);\n      else if (S.formant.field === 'curve') parts.push('F2-dependent field');\n      else if (S.formant.f1 || S.formant.f2) parts.push([S.formant.f1 ? `F1 ${sgn(S.formant.f1)}${u}` : '', S.formant.f2 ? `F2 ${sgn(S.formant.f2)}${u}` : ''].filter(Boolean).join(', ') + (S.formant.field === 'region' ? ' in region' : ''));\n    }\n    if (S.pitch.on) parts.push(`pitch ${sgn(S.pitch.semitones)} st (${S.pitch.method === 'pvoc' ? 'phase vocoder' : 'time domain'})`);\n    if (S.loudness.on && S.loudness.db) parts.push(`level ${sgn(S.loudness.db)} dB`);\n    if (S.timing.on) parts.push(`time warp ×${S.timing.rate1}`);\n    if (S.delay.on) parts.push(`delay ${S.delay.ms} ms`);\n    if (s.hear.fb !== 1) parts.push(['muted', '', 'noise only', 'speech + noise', 'speech-modulated noise', 'fb 5'][s.hear.fb] || `fb ${s.hear.fb}`);\n    if (s.hear.gainDb) parts.push(`gain ${sgn(s.hear.gainDb)} dB`);\n    if (!parts.length) parts.push('no perturbation');\n    const w = s.when;\n    const when = w.mode === 'always' ? '' : w.mode === 'after' ? ` after ${w.after} s` : w.mode === 'window' ? ` ${w.after}–${w.until} s` : w.mode === 'vowel' ? ' during the vowel' : ' by custom OST/PCF';\n    return parts.join(', ') + when;\n  }\n  function flatten(o, pre = '', out = {}) {\n    for (const [k, v] of Object.entries(o || {})) {\n      const p = pre ? pre + '.' + k : k;\n      if (k === 'cells' && Array.isArray(v)) out[p] = `${v.length} cells`;\n      else if (k === 'curve' && Array.isArray(v)) out[p] = v.map(x => x.join('/')).join('; ');\n      else if ((k === 'ost' || k === 'pcf') && typeof v === 'string') out[p] = v.trim() ? v.trim().split('\\n').length + ' lines' : '';\n      else if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, p, out);\n      else out[p] = Array.isArray(v) ? (v.length > 6 ? `[${v.length} values]` : JSON.stringify(v)) : v;\n    }\n    return out;\n  }\n  // Rows where the settings differ (only paths that matter: disabled cards are collapsed to \"off\").\n  function diff(a, b) {\n    const pa = flatten(effective(a)), pb = flatten(effective(b)), keys = [...new Set([...Object.keys(pa), ...Object.keys(pb)])];\n    return keys.filter(k => JSON.stringify(pa[k]) !== JSON.stringify(pb[k])).map(k => ({ path: k, a: pa[k], b: pb[k] }));\n  }\n  function effective(settings) {\n    const s = normalize(settings), o = { preset: s.preset, build: s.build, shift: {}, when: {}, listen: s.listen, hear: { fb: s.hear.fb, gainDb: s.hear.gainDb }, raw: s.raw };\n    for (const [k, v] of Object.entries(s.shift)) o.shift[k] = v.on ? v : { on: false };\n    if (o.shift.formant.on && o.shift.formant.field !== 'region') delete o.shift.formant.region;\n    if (o.shift.formant.on && o.shift.formant.field !== 'curve') delete o.shift.formant.curve;\n    if (o.shift.formant.on && o.shift.formant.field !== 'painted') delete o.shift.formant.painted;\n    if (o.shift.formant.on && o.shift.formant.field !== 'variability') delete o.shift.formant.vari;\n    if (o.shift.formant.on && o.shift.formant.field === 'variability') { delete o.shift.formant.f1; delete o.shift.formant.f2; delete o.shift.formant.units; }\n    const w = s.when; o.when.mode = w.mode;\n    if (w.mode === 'after') o.when.after = w.after;\n    if (w.mode === 'window') { o.when.after = w.after; o.when.until = w.until; }\n    if (w.mode === 'vowel') Object.assign(o.when, { onThresh: w.onThresh, onHold: w.onHold, offThresh: w.offThresh, offHold: w.offHold, onDelay: w.onDelay });\n    if (w.mode === 'custom') Object.assign(o.when, { ost: w.ost, pcf: w.pcf });\n    if (w.mode === 'design') { o.when.design = { blocks: s.design.blocks, detect: s.design.detect }; for (const k of ['formant', 'pitch', 'loudness', 'timing']) o.shift[k] = { on: false }; if (s.shift.formant.units !== 'pct') o.shift.formant = { units: s.shift.formant.units }; }\n    if (s.hear.fb >= 2) o.hear.noise = s.hear.noise;\n    return o;\n  }\n\n  G.PGS = { PRESETS, OST_MODES, defaultSettings, normalize, clone, getPath, setPath, baseParams, compile, warnings, summarize, diff, flatten, effective,\n    parseOst, serializeOst, ostStateCount, variField, apply2D, variIntended, TEMPLATES, defaultDesign, compileDesign, refText, parsePcf, serializePcf, hz2mel, fmtVector, GRID, FMAX };\n})(typeof self !== 'undefined' ? self : globalThis);\n\n;\n// Engine worker: one Audapter WASM instance (the bundle text is prepended to this script in a Blob).\n// Messages in:  {type:'create'}                               -> {type:'ready', info}\n//               {type:'run', id, trials:[{input, settings}], sequence, clearAbsent}\n//                                                             -> {type:'progress', id, i, frac} ... {type:'result', id, i, result}\n//                                                                {type:'done', id} | {type:'error', id, i, message}\n//               {type:'analyse', id, trials:[{input, result}]} (no Audapter needed; used after loading a session)\n// \"Fresh\" trials: the page terminates this worker after one trial, so every fresh trial gets a new instance with\n// fresh C++ statics (like a new MATLAB process). Sequences run on one instance without re-creating it.\n'use strict';\nlet A = null, variant = null;\nconst CHUNK_S = 0.25;\n\nfunction post(msg, transfer) { self.postMessage(msg, transfer || []); }\n\nasync function ensure() {\n  if (A) return A;\n  const NS = self.Audapter;\n  if (!NS) throw new Error('Audapter bundle not loaded in worker');\n  variant = NS.variants[0];\n  A = await NS.create(variant);\n  return A;\n}\n\nfunction info() {\n  const i = A.info;\n  return { variant: i.variant, patches: i.patches, sizeofAudapter: i.sizeofAudapter, memoryBytes: i.memoryBytes, recorderSeconds: i.recorderSeconds };\n}\n\nfunction apply(settings, seq, clearAbsent) {\n  const c = self.PGS.compile(settings);\n  A.setParams(c.list);                     // AudapterIO('init') order, values from the settings\n  // Fresh instances start with no OST/PCF. In a sequence, a trial without OST/PCF leaves the previous ones loaded,\n  // exactly as AudapterIO('init') does (COORD-1), unless the user asked to clear them.\n  if (c.ost !== null) A.loadOst(c.ost); else if (!seq || clearAbsent) A.loadOst('');\n  if (c.pcf !== null) A.loadPcf(c.pcf); else if (!seq || clearAbsent) A.loadPcf('');\n  A.reset();\n  return c;\n}\n\n// Same as AudapterWasm.processBuffer (whole frames, zero-padded tail) but in chunks, reporting progress.\nfunction processChunked(input, onFrac) {\n  const N = A.frameSize(), nF = Math.ceil(input.length / N), len = nF * N;\n  const p = A.fn.malloc(8 * len);\n  if (!p) throw new Error('out of memory');\n  try {\n    let h = A.F64; h.fill(0, p >> 3, (p >> 3) + len); h.set(input, p >> 3);\n    const step = Math.max(1, Math.round(CHUNK_S * 48000 / N));\n    for (let f = 0; f < nF; f += step) {\n      const k = Math.min(step, nF - f);\n      A.check(A.fn.aud_process_block(p + 8 * f * N, p + 8 * f * N, k), 'process');\n      onFrac((f + k) / nF);\n    }\n    return A.F64.slice(p >> 3, (p >> 3) + input.length);\n  } finally { A.fn.free(p); }\n}\n\n// Independent analyses of the input and output (spectrograms, YIN F0, LPC formants, level).\nfunction analyse(inp48, r) {\n  const D = self.DSP, sIn = r.signalIn, sOut = r.signalOut, sr = 16000;\n  const spIn = D.spectrogramDb(sIn, sr), spOut = D.spectrogramDb(sOut, sr);\n  const ref = Math.max(D.maxOf(spIn.db), D.maxOf(spOut.db));\n  return {\n    specIn: D.quantise(spIn, ref), specOut: D.quantise(spOut, ref),\n    f0In: D.yin(sIn, sr), f0Out: D.yin(sOut, sr),\n    lpcIn: D.lpcFormants(sIn, sr), lpcOut: D.lpcFormants(sOut, sr),\n    levIn: D.levelDb(sIn, sr), levOut: D.levelDb(sOut, sr),\n    inRms: D.activeRms(inp48), outRms: D.activeRms(r.output), inPeak: D.peak(inp48), outPeak: D.peak(r.output),\n    burstDb: D.burstDb(r.output),\n  };\n}\n\nfunction pack(d) {   // getData fields -> plain object with typed arrays (copies, so they are transferable)\n  const f = a => (a ? Float64Array.from(a) : null), fs = a => (a ? a.map(f) : null);\n  return { signalIn: Float64Array.from(d.signalIn), signalOut: Float64Array.from(d.signalOut), frameRate: d.frameRate,\n    intervals: f(d.intervals), rms: fs(d.rms), fmts: fs(d.fmts), rads: fs(d.rads), dfmts: fs(d.dfmts), sfmts: fs(d.sfmts),\n    rms_slope: f(d.rms_slope), ost_stat: f(d.ost_stat), pitchShiftRatio: f(d.pitchShiftRatio), pitchHz: f(d.pitchHz), shiftedPitchHz: f(d.shiftedPitchHz) };\n}\nfunction transferables(r) {\n  const t = [];\n  const add = a => { if (a && a.buffer && !t.includes(a.buffer)) t.push(a.buffer); };\n  for (const v of Object.values(r)) { if (Array.isArray(v)) v.forEach(add); else add(v); }\n  if (r.analysis) for (const v of Object.values(r.analysis)) if (v && typeof v === 'object') { add(v.data); add(v.f0); add(v.db); if (v.f) v.f.forEach(add); }\n  return t;\n}\n\nself.onmessage = async e => {\n  const m = e.data;\n  try {\n    if (m.type === 'create') { await ensure(); post({ type: 'ready', info: info() }); return; }\n    if (m.type === 'analyse') {\n      m.trials.forEach((t, i) => { const a = analyse(t.input, t.result); post({ type: 'analysis', id: m.id, i, analysis: a }); });\n      post({ type: 'done', id: m.id }); return;\n    }\n    if (m.type === 'run') {\n      await ensure();\n      for (let i = 0; i < m.trials.length; i++) {\n        const t = m.trials[i], t0 = performance.now();\n        post({ type: 'progress', id: m.id, i, frac: 0 });\n        try {\n          const c = apply(t.settings, !!m.sequence, !!m.clearAbsent);\n          const input = t.input instanceof Float64Array ? t.input : Float64Array.from(t.input);\n          const output = processChunked(input, frac => post({ type: 'progress', id: m.id, i, frac }));\n          const r = { output, ...pack(A.getData()) };\n          r.compiled = { ost: c.ost, pcf: c.pcf, meta: c.meta };\n          r.info = { ...info(), processMs: performance.now() - t0 };\n          r.analysis = analyse(input, r);\n          r.info.totalMs = performance.now() - t0;\n          post({ type: 'result', id: m.id, i, result: r }, transferables(r));\n        } catch (err) {\n          post({ type: 'error', id: m.id, i, message: String(err && err.message || err) });\n          if (!m.sequence) break;\n        }\n      }\n      post({ type: 'done', id: m.id, info: A ? info() : null });\n    }\n  } catch (err) { post({ type: 'error', id: m.id, message: String(err && err.message || err) }); }\n};\n";
PG.ENGINES = {"lite":{"label":"shipped","bytes":363390},"patched":{"label":"patched","bytes":363515},"full":{"label":"shipped (full size)","bytes":363400}};
PG.CLIPS = [{"id":"arctic_slt_a0030","label":"I had faith in them.","speaker":"cmu_us_slt","sex":"F","age":"adult","group":"adult_F","dur":1.475,"source":"CMU ARCTIC (Kominek & Black 2003), festvox.org","license":"CMU ARCTIC licence (BSD-style: free for any use; keep copyright notice; mark modifications)","url":"http://festvox.org/cmu_arctic/","notes":"US English; resampled 16k->48k (modification)","bytes":41103},{"id":"arctic_clb_a0036","label":"She turned in at the hotel.","speaker":"cmu_us_clb","sex":"F","age":"adult","group":"adult_F","dur":2.155,"source":"CMU ARCTIC (Kominek & Black 2003), festvox.org","license":"CMU ARCTIC licence (BSD-style: free for any use; keep copyright notice; mark modifications)","url":"http://festvox.org/cmu_arctic/","notes":"US English; resampled 16k->48k (modification)","bytes":57810},{"id":"arctic_bdl_a0030","label":"I had faith in them.","speaker":"cmu_us_bdl","sex":"M","age":"adult","group":"adult_M","dur":1.285,"source":"CMU ARCTIC (Kominek & Black 2003), festvox.org","license":"CMU ARCTIC licence (BSD-style: free for any use; keep copyright notice; mark modifications)","url":"http://festvox.org/cmu_arctic/","notes":"US English; resampled 16k->48k (modification)","bytes":34644},{"id":"arctic_rms_a0018","label":"There was a change now.","speaker":"cmu_us_rms","sex":"M","age":"adult","group":"adult_M","dur":1.585,"source":"CMU ARCTIC (Kominek & Black 2003), festvox.org","license":"CMU ARCTIC licence (BSD-style: free for any use; keep copyright notice; mark modifications)","url":"http://festvox.org/cmu_arctic/","notes":"US English; resampled 16k->48k (modification)","bytes":42042},{"id":"arctic_awb_a0030","label":"I had faith in them.","speaker":"cmu_us_awb","sex":"M","age":"adult","group":"adult_M","dur":3,"source":"CMU ARCTIC (Kominek & Black 2003), festvox.org","license":"CMU ARCTIC licence (BSD-style: free for any use; keep copyright notice; mark modifications)","url":"http://festvox.org/cmu_arctic/","notes":"Scottish English; resampled 16k->48k (modification)","bytes":71034},{"id":"libri_84-121123-0000","label":"GO DO YOU HEAR","speaker":"libri_84","sex":"F","age":"adult","group":"adult_F","dur":2.09,"source":"LibriSpeech dev-clean (Panayotov et al. 2015), OpenSLR 12","license":"CC BY 4.0","url":"https://www.openslr.org/12/","notes":"audiobook read speech","bytes":37838},{"id":"libri_2078-142845-0026","label":"TO MAKE DRY TOAST","speaker":"libri_2078","sex":"M","age":"adult","group":"adult_M","dur":2.475,"source":"LibriSpeech dev-clean (Panayotov et al. 2015), OpenSLR 12","license":"CC BY 4.0","url":"https://www.openslr.org/12/","notes":"audiobook read speech","bytes":65060},{"id":"so762_0093_103","label":"TWO NINE SIX FOUR","speaker":"so762_0093","sex":"F","age":"6","group":"child","dur":2.71,"source":"speechocean762 (Zhang et al. 2021), OpenSLR 101","license":"CC BY 4.0","url":"https://www.openslr.org/101/","notes":"Mandarin-L1 child reading English; expert total score 9/10","bytes":67323},{"id":"so762_0094_123","label":"TWO NINE NINE TWO","speaker":"so762_0094","sex":"M","age":"6","group":"child","dur":3.125,"source":"speechocean762 (Zhang et al. 2021), OpenSLR 101","license":"CC BY 4.0","url":"https://www.openslr.org/101/","notes":"Mandarin-L1 child reading English; expert total score 10/10","bytes":86628},{"id":"so762_0112_180","label":"IT'S NOT FISH","speaker":"so762_0112","sex":"F","age":"6","group":"child","dur":2.293,"source":"speechocean762 (Zhang et al. 2021), OpenSLR 101","license":"CC BY 4.0","url":"https://www.openslr.org/101/","notes":"Mandarin-L1 child reading English; expert total score 9/10","bytes":69547},{"id":"vbd_p257_110_cafe2.5","label":"It is normal.","speaker":"vctk_p257","sex":"F","age":"adult","group":"adult_F","dur":1.595,"source":"Noisy speech database / VoiceBank-DEMAND test set (Valentini-Botinhao 2017), doi:10.7488/ds/2117","license":"CC BY 4.0","url":"https://datashare.ed.ac.uk/handle/10283/2791","notes":"DEMAND noise \"cafe\" at 2.5 dB SNR","bytes":94775},{"id":"pvqd_LA9003_a","label":"sustained /a/ (CAPE-V)","speaker":"pvqd_LA9003","sex":"F","age":"27","group":"adult_F","dur":3.4,"source":"Perceptual Voice Qualities Database (Walden 2022), Mendeley Data doi:10.17632/9dz247gnyb.4","license":"CC BY 4.0","url":"https://data.mendeley.com/datasets/9dz247gnyb/4","notes":"diagnosis: none; CAPE-V overall severity 1.2; 44.1k->48k","bytes":110105},{"id":"pvqd_LA9003_i","label":"sustained /i/ (CAPE-V)","speaker":"pvqd_LA9003","sex":"F","age":"27","group":"adult_F","dur":3.3,"source":"Perceptual Voice Qualities Database (Walden 2022), Mendeley Data doi:10.17632/9dz247gnyb.4","license":"CC BY 4.0","url":"https://data.mendeley.com/datasets/9dz247gnyb/4","notes":"diagnosis: none; CAPE-V overall severity 1.2; 44.1k->48k","bytes":108133},{"id":"pvqd_LA9015_a","label":"sustained /a/ (CAPE-V)","speaker":"pvqd_LA9015","sex":"M","age":"24","group":"adult_M","dur":3.5,"source":"Perceptual Voice Qualities Database (Walden 2022), Mendeley Data doi:10.17632/9dz247gnyb.4","license":"CC BY 4.0","url":"https://data.mendeley.com/datasets/9dz247gnyb/4","notes":"diagnosis: none; CAPE-V overall severity 2.7; 44.1k->48k","bytes":133665},{"id":"pvqd_LA9015_i","label":"sustained /i/ (CAPE-V)","speaker":"pvqd_LA9015","sex":"M","age":"24","group":"adult_M","dur":3.5,"source":"Perceptual Voice Qualities Database (Walden 2022), Mendeley Data doi:10.17632/9dz247gnyb.4","license":"CC BY 4.0","url":"https://data.mendeley.com/datasets/9dz247gnyb/4","notes":"diagnosis: none; CAPE-V overall severity 2.7; 44.1k->48k","bytes":131457},{"id":"pvqd_SJ2001_a","label":"sustained /a/ (CAPE-V)","speaker":"pvqd_SJ2001","sex":"F","age":"69","group":"adult_F","dur":3.5,"source":"Perceptual Voice Qualities Database (Walden 2022), Mendeley Data doi:10.17632/9dz247gnyb.4","license":"CC BY 4.0","url":"https://data.mendeley.com/datasets/9dz247gnyb/4","notes":"diagnosis: none; CAPE-V overall severity 0.8; 44.1k->48k","bytes":120539},{"id":"pvqd_NYU1015_a","label":"sustained /a/ (CAPE-V)","speaker":"pvqd_NYU1015","sex":"F","age":"52","group":"adult_F","dur":3.5,"source":"Perceptual Voice Qualities Database (Walden 2022), Mendeley Data doi:10.17632/9dz247gnyb.4","license":"CC BY 4.0","url":"https://data.mendeley.com/datasets/9dz247gnyb/4","notes":"diagnosis: atrophy; CAPE-V overall severity 45.5; 44.1k->48k","bytes":133721},{"id":"vocalset_f2_long_straight_a","label":"sung sustained /a/ (long tone, straight)","speaker":"vocalset_female2","sex":"F","age":"adult","group":"singer_F","dur":3.5,"source":"VocalSet (Wilkins et al. 2018), Zenodo doi:10.5281/zenodo.1442513","license":"CC BY 4.0","url":"https://zenodo.org/records/1442513","notes":"trained singer; 44.1k->48k","bytes":131643},{"id":"vocalset_m2_long_straight_i","label":"sung sustained /i/ (long tone, straight)","speaker":"vocalset_male2","sex":"M","age":"adult","group":"singer_M","dur":2.6,"source":"VocalSet (Wilkins et al. 2018), Zenodo doi:10.5281/zenodo.1442513","license":"CC BY 4.0","url":"https://zenodo.org/records/1442513","notes":"trained singer; 44.1k->48k","bytes":99841},{"id":"vocadito_4","label":"sung phrase (Catalan/Valencian), avg MIDI pitch 47","speaker":"vocadito_S3","sex":"unknown","age":"adult","group":"singer_unknown","dur":4.7,"source":"vocadito (Bittner et al. 2021), Zenodo doi:10.5281/zenodo.5578807","license":"CC BY 4.0","url":"https://zenodo.org/records/5578807","notes":"solo singing; 44.1k -> 48k","bytes":200185},{"id":"vocadito_10","label":"sung phrase (English), avg MIDI pitch 49","speaker":"vocadito_S7","sex":"unknown","age":"adult","group":"singer_unknown","dur":4.7,"source":"vocadito (Bittner et al. 2021), Zenodo doi:10.5281/zenodo.5578807","license":"CC BY 4.0","url":"https://zenodo.org/records/5578807","notes":"solo singing; 44.1k -> 48k","bytes":169387}];

/* ---- core.js ---- */
'use strict';
// Namespace, DOM helpers, small event bus, formatting, app state.
PG.DSP = self.DSP; PG.S = self.PGS;

PG.h = function h(tag, attrs, ...kids) {
  let [t, ...cls] = tag.split('.'), id = null;
  if (t.includes('#')) [t, id] = t.split('#');
  const el = t === 'svg' || PG.h.svgTags.has(t) ? document.createElementNS('http://www.w3.org/2000/svg', t) : document.createElement(t || 'div');
  if (cls.length) el.setAttribute('class', cls.join(' '));
  if (id) el.id = id;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'class') el.setAttribute('class', (el.getAttribute('class') ? el.getAttribute('class') + ' ' : '') + v);
    else if (k in el && !(el instanceof SVGElement) && k !== 'list' && k !== 'form') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
};
PG.h.svgTags = new Set(['g', 'path', 'line', 'rect', 'circle', 'text', 'polyline', 'polygon', 'title', 'desc', 'defs', 'marker', 'tspan', 'clipPath', 'use']);
PG.$ = (s, r = document) => r.querySelector(s);
PG.$$ = (s, r = document) => [...r.querySelectorAll(s)];
PG.clear = el => { el.replaceChildren(); return el; };

PG.bus = (() => {
  const m = new Map();
  return {
    on(ev, fn) { if (!m.has(ev)) m.set(ev, new Set()); m.get(ev).add(fn); return () => m.get(ev).delete(fn); },
    emit(ev, ...a) { for (const fn of m.get(ev) || []) { try { fn(...a); } catch (e) { console.error(ev, e); } } },
  };
})();

PG.fmt = {
  s: t => (t < 10 ? t.toFixed(2) : t.toFixed(1)) + ' s',
  hz: f => (Number.isFinite(f) && f > 0 ? Math.round(f) + ' Hz' : '–'),
  db: d => (Number.isFinite(d) ? (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d).toFixed(1) + ' dB' : '–'),
  mb: b => (b / 1048576).toFixed(0) + ' MB',
  signed: (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d),
  num: (v, d = 3) => (Number.isFinite(+v) ? String(+Number(v).toPrecision(d)) : String(v)),
};
PG.uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
PG.debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.cancel = () => clearTimeout(t); return d; };
PG.median = a => { const v = Array.from(a).filter(x => Number.isFinite(x) && x > 0).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : NaN; };

// ---------- application state
PG.state = {
  settings: PG.S.defaultSettings(),
  input: null,            // {id, kind, label, x: Float64Array @48k, meta}
  inputs: new Map(),      // id -> input (trials reference inputs by id)
  trials: [],             // every run; trial.kept marks the ones the user kept
  currentId: null,        // trial shown in the views
  selected: new Set(),    // trials ticked for compare / sequence
  view: 'spectro',
  autoRun: true,
  running: false,
};
PG.trial = id => PG.state.trials.find(t => t.id === id) || null;
PG.current = () => PG.trial(PG.state.currentId);
PG.setSettings = (s, why) => { PG.state.settings = PG.S.normalize(s); PG.bus.emit('settings', why); };
PG.editSettings = (fn, why) => { const s = PG.S.clone(PG.state.settings); fn(s); PG.setSettings(s, why || 'edit'); };

// Theme follows the OS unless the user picks one.
PG.theme = {
  init() { const t = localStorage.getItem('pg-theme'); if (t) document.documentElement.dataset.theme = t; },
  toggle() {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = nx; localStorage.setItem('pg-theme', nx); PG.bus.emit('theme');
  },
  dark() { return (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'; },
};
PG.css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();


/* ---- engine.js ---- */
'use strict';
// Engine client: runs trials in Web Workers, one Audapter WASM instance per worker.
// Fresh trials: a worker (with a new instance) runs ONE trial and is then terminated, so memory is returned and the next
// trial starts from fresh C++ state. A spare worker is pre-created after each termination to hide the ~0.2 s start-up,
// so at most one instance is alive at a time. Sequences: one fresh worker runs all trials in order, then is terminated.
PG.Engine = (() => {
  const blobs = {}, spares = {}, scripts = {};
  let active = null, analysisWorker = null;
  const stats = { peakWasmBytes: 0, lastWasmBytes: 0, instancesCreated: 0, mode: 'worker' };
  const HANG_MS = 12000;

  function loadScript(v) {
    if (self.PG_ENGINE_FN && PG_ENGINE_FN[v]) return Promise.resolve();
    if (!scripts[v]) scripts[v] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = `engine/engine-${v}.js`;
      s.onload = () => (self.PG_ENGINE_FN && PG_ENGINE_FN[v] ? res() : rej(new Error(`engine ${v} did not register`)));
      s.onerror = () => { delete scripts[v]; rej(new Error(`could not load engine/engine-${v}.js`)); };
      document.head.append(s);
    });
    return scripts[v];
  }
  async function blobUrl(v) {
    if (blobs[v]) return blobs[v];
    await loadScript(v);
    blobs[v] = URL.createObjectURL(new Blob(['(', PG_ENGINE_FN[v].toString(), ')();\n', PG.WORKER_SRC], { type: 'text/javascript' }));
    return blobs[v];
  }
  async function spawn(v) {
    const url = await blobUrl(v);
    const w = new Worker(url);
    stats.instancesCreated++;
    const ready = new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('engine start-up timed out')), 30000);
      w.addEventListener('message', function f(e) { if (e.data.type === 'ready') { clearTimeout(t); w.removeEventListener('message', f); res(e.data.info); } else if (e.data.type === 'error') { clearTimeout(t); rej(new Error(e.data.message)); } });
      w.addEventListener('error', e => { clearTimeout(t); rej(new Error(e.message || 'worker failed to start')); }, { once: true });
    });
    w.postMessage({ type: 'create' });
    ready.then(i => note(i)).catch(() => {});
    return { w, ready, v };
  }
  function note(info) { if (info && info.memoryBytes) { stats.lastWasmBytes = info.memoryBytes; stats.peakWasmBytes = Math.max(stats.peakWasmBytes, info.memoryBytes); PG.bus.emit('engine-stats', stats); } }
  async function take(v) {
    const s = spares[v]; delete spares[v];
    return s || spawn(v);
  }
  function prewarm(v) {
    if (spares[v] || stats.mode !== 'worker') return;
    setTimeout(() => { if (!spares[v] && !active) spawn(v).then(s => { if (spares[v] || active) { s.w.terminate(); return; } spares[v] = s; }).catch(() => {}); }, 150);
  }
  function dropSpares(except) { for (const k of Object.keys(spares)) if (k !== except) { spares[k].w.terminate(); delete spares[k]; } }

  // Run trials. opts: {variant, trials:[{input, settings}], sequence, clearAbsent, onProgress(i, frac), onResult(i, result)}
  let running = false;
  async function run(opts) {
    if (running) throw new Error('a run is already in progress');
    running = true;
    try { return await run1(opts); } finally { running = false; }
  }
  async function run1(opts) {
    const { variant, trials, sequence } = opts;
    if (stats.mode === 'main') return runMain(opts);
    dropSpares(variant);
    const results = new Array(trials.length).fill(null), errors = [];
    const groups = sequence ? [trials.map((t, i) => i)] : trials.map((t, i) => [i]);
    try {
      for (const g of groups) {
        let slot;
        try { slot = await take(variant); await slot.ready; }
        catch (e) { if (slot) slot.w.terminate(); if (/Worker|script|blob|security/i.test(String(e.message)) || !stats.instancesCreated) { stats.mode = 'main'; return runMain(opts); } throw e; }
        await new Promise((resolve, reject) => {
          const id = PG.uid(); let beat = performance.now();
          active = { slot, reject, id };
          const dog = setInterval(() => {
            if (performance.now() - beat > HANG_MS) {
              clearInterval(dog); slot.w.terminate(); active = null;
              reject(Object.assign(new Error(`Audapter stopped responding (no progress for ${HANG_MS / 1000} s); the worker was terminated. An endless loop in the formant tracker is a known failure after frameLen/nDelay changes in one session (CORPUS-10).`), { hang: true }));
            }
          }, 500);
          slot.w.onmessage = e => {
            const m = e.data; beat = performance.now();
            if (m.id !== id) return;
            const gi = g[m.i ?? 0];
            if (m.type === 'progress') opts.onProgress && opts.onProgress(gi, m.frac);
            else if (m.type === 'result') { results[gi] = m.result; note(m.result.info); opts.onResult && opts.onResult(gi, m.result); }
            else if (m.type === 'error') { errors.push({ i: gi, message: m.message }); opts.onError && opts.onError(gi, m.message); }
            else if (m.type === 'done') { clearInterval(dog); resolve(); }
          };
          slot.w.onerror = e => { clearInterval(dog); reject(new Error(e.message || 'engine worker crashed')); };
          const payload = g.map(i => ({ input: trials[i].input, settings: trials[i].settings }));
          slot.w.postMessage({ type: 'run', id, trials: payload, sequence: !!sequence, clearAbsent: !!opts.clearAbsent });
        });
        slot.w.terminate(); active = null;
      }
    } finally { if (active) { active.slot.w.terminate(); active = null; } prewarm(variant); }
    return { results, errors };
  }
  function cancel() {
    if (!active) return false;
    active.slot.w.terminate(); const r = active.reject; active = null;
    r(Object.assign(new Error('Stopped.'), { cancelled: true })); return true;
  }

  // Fallback without workers (e.g. a browser that refuses Blob workers on file://): one instance on the main thread.
  let mainInst = {};
  async function runMain(opts) {
    await loadScript(opts.variant);
    if (!self.Audapter || !Audapter.factories[opts.variant]) PG_ENGINE_FN[opts.variant]();
    const A = mainInst[opts.variant] || (mainInst[opts.variant] = await Audapter.create(opts.variant));
    const results = [], errors = [];
    for (let i = 0; i < opts.trials.length; i++) {
      const t = opts.trials[i];
      try {
        await new Promise(r => setTimeout(r, 0));
        const c = PG.S.compile(t.settings);
        if (!opts.sequence) { A.loadOst(''); A.loadPcf(''); }
        A.setParams(c.list);
        if (c.ost !== null) A.loadOst(c.ost); else if (!opts.sequence || opts.clearAbsent) A.loadOst('');
        if (c.pcf !== null) A.loadPcf(c.pcf); else if (!opts.sequence || opts.clearAbsent) A.loadPcf('');
        A.reset();
        const t0 = performance.now(), output = A.processBuffer(t.input), d = A.getData();
        const r = { output, ...d, compiled: { ost: c.ost, pcf: c.pcf, meta: c.meta }, info: { ...A.info, processMs: performance.now() - t0, mainThread: true } };
        r.analysis = PG.analyseMain(t.input, r);
        results[i] = r; note(r.info); opts.onResult && opts.onResult(i, r);
      } catch (e) { errors.push({ i, message: e.message }); opts.onError && opts.onError(i, e.message); }
    }
    return { results, errors };
  }

  // Analyses for trials loaded from a saved session (no Audapter instance needed).
  function analyse(items) {
    if (!analysisWorker) {
      try { analysisWorker = new Worker(URL.createObjectURL(new Blob([PG.WORKER_SRC], { type: 'text/javascript' }))); }
      catch { return Promise.resolve(items.map(t => PG.analyseMain(t.input, t.result))); }
    }
    return new Promise(res => {
      const id = PG.uid(), out = [];
      analysisWorker.onmessage = e => { if (e.data.id !== id) return; if (e.data.type === 'analysis') out[e.data.i] = e.data.analysis; if (e.data.type === 'done') res(out); };
      analysisWorker.postMessage({ type: 'analyse', id, trials: items.map(t => ({ input: t.input, result: { signalIn: t.result.signalIn, signalOut: t.result.signalOut, output: t.result.output } })) });
    });
  }
  // Dry run for the timing designer: Audapter's own per-frame level (rms_s, rms_p, slope) on this input, no OST/PCF.
  const dryCache = new Map();
  async function dryRun(input, settings) {
    const s = PG.S.normalize(PG.S.clone(settings));
    s.when.mode = 'always'; for (const k of Object.keys(s.shift)) s.shift[k].on = false; s.hear.fb = 1;
    const key = input.id + '|' + JSON.stringify([s.preset, s.listen, s.raw, s.build]);
    if (dryCache.has(key)) return dryCache.get(key);
    while (running) await new Promise(r => setTimeout(r, 120));
    const { results } = await run({ variant: s.build || 'lite', trials: [{ input: input.x, settings: s }] });
    const r = results[0]; if (!r) throw new Error('dry run failed');
    const m = PG.S.compile(s).meta;
    const out = { rms: r.rms[0], rmsP: r.rms[1], slope: r.rms_slope, fmts: [r.fmts[0], r.fmts[1]], frameDur: m.frameLen / m.sr, n: r.rms[0].length };
    if (dryCache.size > 20) dryCache.clear();
    dryCache.set(key, out); return out;
  }
  return { run, cancel, analyse, stats, prewarm, dryRun, busy: () => running, loadScript };
})();

PG.analyseMain = (inp48, r) => {
  const D = PG.DSP, sr = 16000, spIn = D.spectrogramDb(r.signalIn, sr), spOut = D.spectrogramDb(r.signalOut, sr);
  const ref = Math.max(D.maxOf(spIn.db), D.maxOf(spOut.db));
  return { specIn: D.quantise(spIn, ref), specOut: D.quantise(spOut, ref), f0In: D.yin(r.signalIn, sr), f0Out: D.yin(r.signalOut, sr),
    lpcIn: D.lpcFormants(r.signalIn, sr), lpcOut: D.lpcFormants(r.signalOut, sr), levIn: D.levelDb(r.signalIn, sr), levOut: D.levelDb(r.signalOut, sr),
    inRms: D.activeRms(inp48), outRms: D.activeRms(r.output), inPeak: D.peak(inp48), outPeak: D.peak(r.output), burstDb: D.burstDb(r.output) };
};


/* ---- audio.js ---- */
'use strict';
// Playback (with gapless A/B switching), file decoding and microphone recording, all at 48 kHz (Audapter's device rate).
PG.Audio = (() => {
  let ctx = null, cur = null, recMod = null;
  const getCtx = () => {
    if (!ctx) ctx = new (self.AudioContext || self.webkitAudioContext)({ sampleRate: 48000, latencyHint: 'playback' });
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const buf = x => { const c = getCtx(), b = c.createBuffer(1, Math.max(1, x.length), 48000); b.getChannelData(0).set(x instanceof Float32Array ? x : Float32Array.from(x)); return b; };

  // Play one or two signals in sync; only one is audible at a time (A/B), switching is instantaneous.
  // tracks: [{x, gain, label, trialId, kind}], opts: {which, loop, from, to}
  function play(tracks, { which = 0, loop = false, from = 0, to = null } = {}) {
    stop();
    const c = getCtx(), t0 = c.currentTime + 0.03;
    const len = Math.max(...tracks.map(t => t.x.length)) / 48000;
    const end = Math.min(len, to ?? len), start = Math.max(0, Math.min(from, end - 0.01));
    const nodes = tracks.map((t, i) => {
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = buf(t.x); g.gain.value = i === which ? (t.gain ?? 1) : 0;
      s.connect(g).connect(c.destination);
      if (loop) { s.loop = true; s.loopStart = start; s.loopEnd = end; s.start(t0, start); }
      else s.start(t0, start, end - start);
      return { s, g, t };
    });
    const h = { nodes, which, loop, start, end, t0, tracks,
      set(k) { h.which = k; nodes.forEach((n, i) => n.g.gain.setValueAtTime(i === k ? (n.t.gain ?? 1) : 0, c.currentTime)); PG.bus.emit('play', h); },
      toggle() { if (nodes.length > 1) h.set(1 - h.which); } };
    nodes[0].s.onended = () => { if (cur === h) { cur = null; PG.bus.emit('play', null); } };
    cur = h; PG.bus.emit('play', h);
    return h;
  }
  function stop() { if (cur) { const h = cur; cur = null; h.nodes.forEach(n => { try { n.s.stop(); } catch {} }); PG.bus.emit('play', null); } }
  function position() {
    if (!cur || !ctx) return null;
    const el = ctx.currentTime - cur.t0; if (el < 0) return { h: cur, t: cur.start };
    const L = cur.end - cur.start;
    return { h: cur, t: cur.start + (cur.loop ? el % L : Math.min(el, L)) };
  }

  // Decode an uploaded file to mono Float64 at 48 kHz. 48 kHz WAVs are read exactly; anything else goes through the browser's decoder (resampled).
  async function decode(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const w = PG.DSP.decodeWav(u8);
    if (w && w.sr === 48000) return { x: w.x, sr: 48000, resampled: false };
    const oc = new OfflineAudioContext(1, 1, 48000);
    const ab = await oc.decodeAudioData(arrayBuffer.slice(0));
    const n = ab.length, x = new Float64Array(n);
    for (let c = 0; c < ab.numberOfChannels; c++) { const d = ab.getChannelData(c); for (let i = 0; i < n; i++) x[i] += d[i] / ab.numberOfChannels; }
    return { x, sr: 48000, resampled: (w ? w.sr : ab.sampleRate) !== 48000, origSr: w ? w.sr : null };
  }

  // Record from the microphone with all browser processing off. Returns a controller: stop() resolves with Float64 @48 kHz.
  async function record({ maxSeconds = 10, onLevel } = {}) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error(location.protocol === 'file:' ? 'The microphone needs https (or localhost); it is not available from a file:// page.' : 'This browser does not offer microphone access.');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
    const c = getCtx();
    const src = c.createMediaStreamSource(stream), chunks = []; let n = 0, done, over = false;
    const finished = new Promise(r => { done = r; });
    const stopAll = () => { if (over) return; over = true; stream.getTracks().forEach(t => t.stop()); try { src.disconnect(); node.disconnect(); } catch {} ; const x = new Float64Array(n); let o = 0; for (const ch of chunks) { x.set(ch, o); o += ch.length; } done(x); };
    const onChunk = ch => {
      if (n >= maxSeconds * 48000) return;
      chunks.push(ch); n += ch.length;
      if (onLevel) { let m = 0; for (let i = 0; i < ch.length; i++) m = Math.max(m, Math.abs(ch[i])); onLevel(m, n / 48000); }
      if (n >= maxSeconds * 48000) stopAll();
    };
    let node;
    try {
      const code = 'class R extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor("pg-rec",R);';
      if (!recMod) recMod = c.audioWorklet.addModule(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })));
      await recMod;
      node = new AudioWorkletNode(c, 'pg-rec', { numberOfInputs: 1, numberOfOutputs: 0 });
      node.port.onmessage = e => onChunk(e.data);
      src.connect(node);
    } catch {
      node = c.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = e => onChunk(e.inputBuffer.getChannelData(0).slice(0));
      src.connect(node); node.connect(c.destination);
    }
    return { stop() { stopAll(); return finished; }, finished, rate: c.sampleRate };
  }
  return { play, stop, position, decode, record, ctx: getCtx, playing: () => cur };
})();


/* ---- store.js ---- */
'use strict';
// Persistence: IndexedDB for the session (kept trials and their inputs), zip export/import (session.json + float WAVs),
// settings as JSON files and as a shareable URL hash.
PG.Store = (() => {
  const DB = 'audapter-playground', VER = 1;
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    if (!self.indexedDB) return rej(new Error('IndexedDB unavailable'));
    const r = indexedDB.open(DB, VER);
    r.onupgradeneeded = () => { const d = r.result; for (const s of ['inputs', 'trials', 'meta']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (store, mode, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction(store, mode); const o = fn(t.objectStore(store)); t.oncomplete = () => res(o && o.result); t.onerror = () => rej(t.error); }); };
  const put = (s, k, v) => tx(s, 'readwrite', o => o.put(v, k)).catch(e => console.warn('store', e));
  const del = (s, k) => tx(s, 'readwrite', o => o.delete(k)).catch(() => {});
  const all = async s => { const d = await open(); return new Promise((res, rej) => { const out = []; const c = d.transaction(s).objectStore(s).openCursor(); c.onsuccess = () => { const x = c.result; if (x) { out.push(x.value); x.continue(); } else res(out); }; c.onerror = () => rej(c.error); }); };

  const slim = t => ({ ...t, result: t.result ? { ...t.result } : null });
  async function saveTrial(t) {
    if (!t.kept) return;
    const inp = PG.state.inputs.get(t.inputId);
    if (inp) await put('inputs', inp.id, { id: inp.id, kind: inp.kind, label: inp.label, meta: inp.meta || {}, x: inp.x instanceof Float32Array ? inp.x : Float32Array.from(inp.x) });
    await put('trials', t.id, slim(t));
  }
  const deleteTrial = id => del('trials', id);
  const saveSettings = s => put('meta', 'settings', s);
  async function load() {
    try {
      const [inputs, trials, meta] = await Promise.all([all('inputs'), all('trials'), tx('meta', 'readonly', o => o.get('settings'))]);
      for (const i of inputs) i.x = Float64Array.from(i.x);
      return { inputs, trials: trials.sort((a, b) => a.created - b.created), settings: meta || null };
    } catch (e) { console.warn('session restore failed', e); return { inputs: [], trials: [], settings: null }; }
  }
  async function clearAll() { for (const s of ['inputs', 'trials']) await tx(s, 'readwrite', o => o.clear()).catch(() => {}); }

  // ---- zip (store method, no compression) with CRC-32
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u8 => { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files) {   // files: [{name, data: Uint8Array}]
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), n = f.data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true);
      h.setUint32(18, n, true); h.setUint32(22, n, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, f.data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true);
      c.setUint32(20, n, true); c.setUint32(24, n, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + n;
    }
    const csize = central.reduce((s, p) => s + p.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
  }
  function unzip(u8) {   // stored entries only (what zip() writes)
    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), dec = new TextDecoder(), out = {};
    let e = u8.length - 22; while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('not a zip file');
    let p = v.getUint32(e + 16, true);
    for (let k = 0; k < v.getUint16(e + 10, true); k++) {
      const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
      const name = dec.decode(u8.subarray(p + 46, p + 46 + nl));
      if (method !== 0) throw new Error(`${name}: compressed zip entries are not supported (use a session exported by the playground)`);
      const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true);
      out[name] = u8.subarray(ds, ds + size);
      p += 46 + nl + xl + cl;
    }
    return out;
  }

  // ---- session export / import
  const DATA_FIELDS = ['frameRate', 'intervals', 'rms', 'fmts', 'rads', 'dfmts', 'sfmts', 'rms_slope', 'ost_stat', 'pitchShiftRatio', 'pitchHz', 'shiftedPitchHz'];
  const arr = a => (a ? (Array.isArray(a) ? a.map(arr) : typeof a === 'number' ? a : Array.from(a)) : a);
  function exportSession(trials) {
    const files = [], enc = new TextEncoder(), inputs = new Map();
    const meta = { format: 'audapter-playground-session', version: 1, exported: new Date().toISOString(), trials: [] };
    for (const t of trials) {
      const inp = PG.state.inputs.get(t.inputId);
      if (inp && !inputs.has(inp.id)) { inputs.set(inp.id, true); files.push({ name: `inputs/${inp.id}.wav`, data: PG.DSP.encodeWav(inp.x, 48000, { float: true }) }); }
      const r = t.result, d = {};
      if (r) {
        for (const k of DATA_FIELDS) d[k] = arr(r[k]);
        files.push({ name: `trials/${t.id}.output.wav`, data: PG.DSP.encodeWav(r.output, 48000, { float: true }) });
        files.push({ name: `trials/${t.id}.signalIn.wav`, data: PG.DSP.encodeWav(r.signalIn, 16000, { float: true }) });
        files.push({ name: `trials/${t.id}.signalOut.wav`, data: PG.DSP.encodeWav(r.signalOut, 16000, { float: true }) });
      }
      meta.trials.push({ id: t.id, name: t.name, tags: t.tags, notes: t.notes, created: t.created, seq: t.seq, variant: t.variant,
        input: inp ? { id: inp.id, kind: inp.kind, label: inp.label, meta: inp.meta } : null, settings: t.settings, summary: t.summary,
        compiled: r && r.compiled, info: r && r.info, data: d });
    }
    files.unshift({ name: 'session.json', data: enc.encode(JSON.stringify(meta)) });
    files.push({ name: 'README.txt', data: enc.encode('Audapter Playground session. session.json holds every trial\'s settings, the compiled OST/PCF, and Audapter\'s getData fields; inputs/ and trials/ hold 32-bit float WAVs (48 kHz input and output, 16 kHz signalIn/signalOut).\n') });
    return zip(files);
  }
  async function importSession(u8) {
    const f = unzip(u8), meta = JSON.parse(new TextDecoder().decode(f['session.json']));
    if (meta.format !== 'audapter-playground-session') throw new Error('session.json is not a playground session');
    const wav = n => (f[n] ? Float64Array.from(PG.DSP.decodeWav(f[n]).x) : null);
    const inputs = new Map(), trials = [];
    for (const m of meta.trials) {
      if (m.input && !inputs.has(m.input.id)) inputs.set(m.input.id, { ...m.input, x: wav(`inputs/${m.input.id}.wav`) });
      const out = wav(`trials/${m.id}.output.wav`);
      const typed = a => (Array.isArray(a) ? (typeof a[0] === 'number' || a.length === 0 ? Float64Array.from(a) : a.map(typed)) : a);
      const result = out ? { output: out, signalIn: wav(`trials/${m.id}.signalIn.wav`), signalOut: wav(`trials/${m.id}.signalOut.wav`), compiled: m.compiled, info: m.info } : null;
      if (result) for (const k of DATA_FIELDS) result[k] = typed(m.data[k]);
      trials.push({ id: m.id, name: m.name, tags: m.tags || [], notes: m.notes || '', created: m.created, seq: m.seq || null, variant: m.variant,
        inputId: m.input && m.input.id, settings: m.settings, summary: m.summary, kept: true, result });
    }
    return { inputs, trials };
  }

  // ---- settings
  const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  function settingsLink(s) {
    const json = JSON.stringify(PG.S.effective(s)), h = '#s=' + b64u(json);
    return h.length > 6000 ? null : location.href.replace(/#.*$/, '') + h;
  }
  function settingsFromHash() {
    const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(location.hash);
    if (!m) return null;
    try { return PG.S.normalize(JSON.parse(unb64u(m[1]))); } catch { return null; }
  }
  function download(blob, name) {
    const a = PG.h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  return { saveTrial, deleteTrial, saveSettings, load, clearAll, exportSession, importSession, settingsLink, settingsFromHash, download, zip, unzip };
})();


/* ---- controls.js ---- */
'use strict';
// The settings controls: one plain-language line per control, with units and a sensible range.
// path: where the value lives in the settings object. Controls under "listen." default to the preset's value.
(() => {
  const S = PG.S;
  const vOn = s => s.shift.formant.field === 'variability';
  const fOn = s => s.shift.formant.on, pOn = s => s.shift.pitch.on, tdsOn = s => pOn(s) && s.shift.pitch.method === 'tds';
  const unitRange = { pct: [-50, 50, 1, '%'], hz: [-400, 400, 5, 'Hz'], mel: [-300, 300, 5, 'mel'] };
  const u = s => unitRange[s.shift.formant.units] || unitRange.pct;

  PG.GROUPS = [
    { id: 'shift', title: 'What gets shifted', blurb: 'Switch on one or more changes to the speech the participant hears.', cards: [
      { id: 'formant', title: 'Formants', on: 'shift.formant.on', blurb: 'Move F1 and F2, the resonances that make vowels sound different.',
        summary: s => { const f = s.shift.formant, un = u(s)[3]; if (f.field === 'variability') return `variability ${f.vari.dir === 'in' ? 'inward' : 'outward'} ${f.vari.strength} %`; return f.field === 'painted' ? `painted field, ${f.painted.cells.length} cells` : f.field === 'curve' ? 'depends on F2' : `F1 ${PG.fmt.signed(f.f1, 0)} ${un}, F2 ${PG.fmt.signed(f.f2, 0)} ${un}`; },
        controls: [
          { path: 'shift.formant.units', label: 'Units', kind: 'seg', show: s => s.shift.formant.field !== 'variability', options: [['pct', '% (ratio)'], ['hz', 'Hz'], ['mel', 'mel']],
            desc: 'Percent multiplies each formant; Hz and mel add a fixed amount. Audapter calls these bRatioShift and bMelShift.' },
          { path: 'shift.formant.f1', label: 'F1 shift', kind: 'range', range: u, sweep: true, show: s => s.shift.formant.field === 'all' || s.shift.formant.field === 'region',
            desc: 'Positive raises F1 (a more open vowel, /ɪ/ towards /ɛ/).' },
          { path: 'shift.formant.f2', label: 'F2 shift', kind: 'range', range: s => { const r = u(s); return [r[0] * (r[3] === '%' ? 1 : 2), r[1] * (r[3] === '%' ? 1 : 2), r[2], r[3]]; }, sweep: true, show: s => s.shift.formant.field === 'all' || s.shift.formant.field === 'region',
            desc: 'Positive raises F2 (more front, /u/ towards /i/).' },
          { path: 'shift.formant.field', label: 'Where on the vowel map', kind: 'select',
            options: [['all', 'Everywhere'], ['region', 'Only inside an F1–F2 region'], ['curve', 'Varies with F2 (1-D field)'], ['painted', 'Painted on the vowel map (2-D field)'], ['variability', 'Vowel variability: inward / outward (2-D field)']],
            desc: 'Audapter looks the shift up from the current F1/F2. A restricted field only shifts vowels inside it.' },
          { path: 'shift.formant.region', kind: 'region', show: s => s.shift.formant.field === 'region', desc: 'Shift only while F1 and F2 are both inside these bounds (f1Min … f2Max).' },
          { path: 'shift.formant.curve', kind: 'curve', show: s => s.shift.formant.field === 'curve', desc: 'The shift at each F2, interpolated between points (pertAmp/pertPhi over pertF2).' },
          { path: 'shift.formant.vari.dir', label: 'Direction', kind: 'seg', show: vOn, options: [['in', 'Inward'], ['out', 'Outward']],
            desc: 'Inward pulls every production toward the vowel centre (the heard vowel varies less); outward pushes it away (varies more).' },
          { path: 'shift.formant.vari.strength', label: 'Strength', kind: 'range', show: vOn, range: [0, 100, 5, '%'], sweep: true,
            desc: 'Fraction of the distance to the centre. 50 % inward: heard = centre + 0.5 × (spoken − centre); outward: centre + 1.5 × (spoken − centre).' },
          { path: 'shift.formant.vari.maxShift', label: 'Maximum shift', kind: 'number', show: vOn, range: [0, 1000, 5, 'Hz'], desc: 'Cap on the size of the shift (in mel when the units are mel). 0 means no cap.' },
          { path: 'shift.formant.vari.centre', label: 'Vowel centre', kind: 'select', show: vOn, options: [['auto', 'Median of the current input'], ['trials', 'Median of the ticked trials (baseline)'], ['manual', 'Entered by hand']],
            desc: 'In these designs the centre is usually the median of baseline productions of the same vowel.' },
          { path: 'shift.formant.vari.c1', label: 'Centre F1', kind: 'number', show: vOn, range: [150, 1200, 1, 'Hz'], also: x => { x.shift.formant.vari.centre = 'manual'; }, desc: 'Typing a value switches the centre to "entered by hand".' },
          { path: 'shift.formant.vari.c2', label: 'Centre F2', kind: 'number', show: vOn, range: [400, 3500, 1, 'Hz'], also: x => { x.shift.formant.vari.centre = 'manual'; } },
          { path: 'shift.formant.vari.units', label: 'Space', kind: 'seg', show: vOn, options: [['hz', 'Hz'], ['mel', 'mel']], desc: 'Scale distances in Hz or in mel (bMelShift).' },
          { path: 'shift.formant.vari.ext1', label: 'Field reach, F1', kind: 'number', show: vOn, range: [50, 1000, 10, '± Hz'], desc: 'The field covers the centre ± this; formants outside are not shifted. Its 257 grid points set the step.' },
          { path: 'shift.formant.vari.ext2', label: 'Field reach, F2', kind: 'number', show: vOn, range: [100, 2000, 10, '± Hz'] },
          { path: 'shift.formant.painted', kind: 'painter', show: s => s.shift.formant.field === 'painted', desc: 'Paint shift vectors onto the F1–F2 plane (pertAmp2D/pertPhi2D, 257 × 257 cells of 19.5 Hz).' },
        ] },
      { id: 'pitch', title: 'Pitch', on: 'shift.pitch.on', blurb: 'Raise or lower the voice pitch (F0).',
        summary: s => `${PG.fmt.signed(s.shift.pitch.semitones, 1)} st, ${s.shift.pitch.method === 'pvoc' ? 'phase vocoder' : 'time domain'}`,
        controls: [
          { path: 'shift.pitch.semitones', label: 'Shift', kind: 'range', range: [-12, 12, 0.5, 'st'], sweep: true, desc: '100 cents per semitone; +12 is an octave up.' },
          { path: 'shift.pitch.method', label: 'Method', kind: 'seg', options: [['pvoc', 'Phase vocoder'], ['tds', 'Time domain']],
            desc: 'The phase vocoder shifts the whole spectrum in 16 ms blocks (more delay). Time domain resamples pitch periods, follows a schedule and needs a good pitch range.' },
          { path: 'shift.pitch.algorithm', label: 'Period alignment', kind: 'select', show: tdsOn, options: [[0, 'None'], [1, 'Peaks'], [2, 'Valleys']],
            desc: 'How the time-domain shifter aligns pitch periods (timeDomainPitchShiftAlgorithm).' },
          { path: 'shift.pitch.lower', label: 'Pitch range, low', kind: 'number', show: tdsOn, range: [40, 500, 5, 'Hz'], nullable: true,
            desc: 'Expected lowest F0 of the talker (pitchLowerBoundHz). Empty uses the preset (men 80, women 150, children 200 Hz).' },
          { path: 'shift.pitch.upper', label: 'Pitch range, high', kind: 'number', show: tdsOn, range: [80, 1000, 5, 'Hz'], nullable: true,
            desc: 'Expected highest F0 (pitchUpperBoundHz).' },
          { path: 'shift.pitch.ramp', label: 'Onset ramp', kind: 'number', show: tdsOn, range: [0.001, 2, 0.01, 's'], desc: 'Time to reach the full shift when it is scheduled to start later.' },
        ] },
      { id: 'loudness', title: 'Loudness', on: 'shift.loudness.on', blurb: 'Make the feedback louder or quieter while the perturbation is on.',
        summary: s => PG.fmt.db(s.shift.loudness.db),
        controls: [{ path: 'shift.loudness.db', label: 'Level change', kind: 'range', range: [-20, 20, 0.5, 'dB'], sweep: true,
          desc: 'Applied at zero crossings through the PCF "intensity" column (gainPerturb).' }] },
      { id: 'timing', title: 'Timing', on: 'shift.timing.on', blurb: 'Slow the feedback down, then let it catch up (a phase-vocoder time warp). It starts at the "When" start time, at voice onset, or at trial start.',
        summary: s => `×${s.shift.timing.rate1} for ${s.shift.timing.dur1} s`,
        controls: [
          { path: 'shift.timing.rate1', label: 'Slow-down rate', kind: 'range', range: [0.1, 1, 0.05, '×'], sweep: true, desc: '0.5 plays the feedback at half speed during the slow-down.' },
          { path: 'shift.timing.dur1', label: 'Slow-down length', kind: 'number', range: [0.01, 1, 0.01, 's'], desc: 'How long the feedback is slowed.' },
          { path: 'shift.timing.hold', label: 'Hold', kind: 'number', range: [0, 1, 0.01, 's'], desc: 'Time the lag is held before catching up.' },
          { path: 'shift.timing.rate2', label: 'Catch-up rate', kind: 'number', range: [1.05, 4, 0.05, '×'], desc: 'Faster than real time until the feedback is back in sync.' },
        ] },
      { id: 'delay', title: 'Delay', on: 'shift.delay.on', blurb: 'Delayed auditory feedback (DAF): the participant hears themselves late.',
        summary: s => `${s.shift.delay.ms} ms`,
        controls: [{ path: 'shift.delay.ms', label: 'Delay', kind: 'range', range: [0, 1000, 10, 'ms'], sweep: true,
          desc: 'Added on top of Audapter\'s own processing delay (delayFrames, in frames of frameLen).' }] },
    ] },
    { id: 'when', title: 'When', blurb: 'When the shift is on during each trial.', controls: [
      { path: 'when.mode', label: 'Perturb', kind: 'choice', options: [
        ['always', 'Always', 'Whenever the voice is above the tracking threshold.'],
        ['after', 'After a delay', 'From a fixed time into the trial (an OST ELAPSED_TIME rule).'],
        ['window', 'In a time window', 'Between two times (two ELAPSED_TIME rules).'],
        ['vowel', 'During the vowel', 'From voice onset (level rises and holds) until the level falls (INTENSITY_RISE_HOLD, INTENSITY_FALL).'],
        ['design', 'As designed on the Timing & design tab', 'Blocks drawn on a timeline, anchored to the sounds Audapter detects.'],
        ['custom', 'Custom OST/PCF', 'Your own online status tracking (OST) and perturbation (PCF) files, under Timing & design, advanced.']] },
      { path: 'when.after', label: 'Start', kind: 'number', range: [0, 10, 0.05, 's'], sweep: true, show: s => s.when.mode === 'after' || s.when.mode === 'window', desc: 'Time from the start of the trial.' },
      { path: 'when.until', label: 'End', kind: 'number', range: [0, 10, 0.05, 's'], show: s => s.when.mode === 'window', desc: 'Time from the start of the trial.' },
      { path: 'when.onThresh', label: 'Onset level', kind: 'number', range: [0.001, 0.2, 0.001, 'RMS'], show: s => s.when.mode === 'vowel', desc: 'Voice onset: level above this…' },
      { path: 'when.onHold', label: 'Onset hold', kind: 'number', range: [0, 0.5, 0.005, 's'], show: s => s.when.mode === 'vowel', desc: '…for at least this long.' },
      { path: 'when.onDelay', label: 'Start after onset', kind: 'number', range: [0, 2, 0.01, 's'], show: s => s.when.mode === 'vowel', desc: 'Wait this long after onset before shifting (an extra ELAPSED_TIME state).' },
      { path: 'when.offThresh', label: 'Offset level', kind: 'number', range: [0.001, 0.2, 0.001, 'RMS'], show: s => s.when.mode === 'vowel', desc: 'Stop when the level falls below this…' },
      { path: 'when.offHold', label: 'Offset minimum', kind: 'number', range: [0, 0.5, 0.005, 's'], show: s => s.when.mode === 'vowel', desc: '…and more than this has passed since onset.' },
      { kind: 'ostlink', show: s => s.when.mode !== 'always' && s.when.mode !== 'design' },
      { kind: 'designlink', show: s => s.when.mode === 'design' },
    ] },
    { id: 'listen', title: 'How Audapter listens', blurb: 'Tracking settings. Presets set these; change them to see how tracking and shifting respond.', controls: [
      { path: 'listen.nlpc', param: 'nlpc', label: 'LPC order', kind: 'number', range: [6, 24, 1, ''], sweep: true, int: true,
        desc: 'Model complexity for formant tracking. Too high splits a formant, too low merges them: about 11 for children, 15 women, 17 men.' },
      { path: 'listen.framelen', param: 'framelen', label: 'Frame length', kind: 'select', options: [[16, '16 samples (1 ms)'], [32, '32 samples (2 ms)'], [48, '48 samples (3 ms)'], [64, '64 samples (4 ms)'], [96, '96 samples (6 ms)']], num: true,
        desc: 'Audapter processes the 16 kHz signal in frames of this size. Longer frames lengthen the analysis window.' },
      { path: 'listen.ndelay', param: 'ndelay', label: 'Look-ahead frames', kind: 'number', range: [2, 12, 1, 'frames'], sweep: true, int: true,
        desc: 'nDelay: Audapter\'s processing delay in frames; also sets the analysis window.' },
      { kind: 'derived' },
      { path: 'listen.rmsthr', param: 'rmsthr', label: 'Tracking threshold', kind: 'number', range: [0.0005, 0.2, 0.0005, 'RMS'], sweep: true,
        desc: 'rmsThresh: quieter frames are not tracked or shifted (and the time-domain schedule clock pauses).' },
      { path: 'listen.rmsratio', param: 'rmsratio', label: 'Voicing ratio threshold', kind: 'number', range: [0, 5, 0.05, ''],
        desc: 'rmsRatioThresh: frames with more high-frequency energy than this (like /s/) are treated as unvoiced.' },
      { path: 'listen.fn1', param: 'fn1', label: 'F1 prior', kind: 'number', range: [200, 1200, 10, 'Hz'], desc: 'Where the tracker expects F1 when it starts (fn1).' },
      { path: 'listen.fn2', param: 'fn2', label: 'F2 prior', kind: 'number', range: [600, 3000, 10, 'Hz'], desc: 'Where the tracker expects F2 (fn2).' },
      { path: 'listen.avglen', param: 'avglen', label: 'Formant smoothing', kind: 'number', range: [1, 30, 1, 'frames'], int: true, desc: 'Moving-average length for tracked formants (avgLen).' },
      { path: 'listen.bcepslift', param: 'bcepslift', label: 'Cepstral liftering', kind: 'toggle', desc: 'Smooth the spectrum before LPC; required for time-domain pitch shifting (bCepsLift).' },
      { path: 'listen.cepswinwidth', param: 'cepswinwidth', label: 'Lifter width', kind: 'number', range: [5, 100, 1, ''], int: true, show: s => PG.effParam(s, 'bcepslift') === 1, desc: 'cepsWinWidth: wider keeps more spectral detail.' },
      { path: 'listen.btrack', param: 'btrack', label: 'Formant tracking', kind: 'toggle', desc: 'Off disables tracking, and with it formant shifting (bTrack).' },
    ] },
    { id: 'hear', title: 'What the participant hears', blurb: 'The mix sent to the headphones.', controls: [
      { path: 'hear.fb', label: 'Feedback', kind: 'select', num: true, options: [[1, 'Speech (normal)'], [0, 'Nothing (muted)'], [2, 'Noise only'], [3, 'Speech + noise'], [4, 'Speech-modulated noise'], [5, 'Speech-modulated + constant noise (blab)']],
        desc: 'Feedback mode (fb). Modes 2–5 play the noise below.' },
      { path: 'hear.noise.type', label: 'Noise', kind: 'seg', options: [['pink', 'Pink'], ['white', 'White']], show: s => s.hear.fb >= 2, desc: 'Generated here and loaded as datapb.' },
      { path: 'hear.noise.seconds', label: 'Noise length', kind: 'number', range: [0.5, 10, 0.5, 's'], sweep: true, show: s => s.hear.fb >= 2, desc: 'Audapter loops the noise; 10 s is the maximum it holds.' },
      { path: 'hear.noise.level', label: 'Noise level', kind: 'range', range: [-60, 0, 1, 'dBFS'], sweep: true, show: s => s.hear.fb >= 2, desc: 'RMS of the generated noise.' },
      { path: 'hear.noise.gain', label: 'Noise gain', kind: 'number', range: [0, 4, 0.05, '×'], show: s => s.hear.fb === 2 || s.hear.fb === 3 || s.hear.fb === 5, desc: 'fb2Gain / fb3Gain / fb5Gain_playback. Audapter\'s own default for mode 3 is 0 (silent).' },
      { path: 'hear.gainDb', label: 'Output gain', kind: 'range', range: [-20, 20, 0.5, 'dB'], sweep: true, desc: 'Scales dScale, the output calibration factor (0.795 in the blab defaults).' },
    ] },
  ];

  // Effective Audapter parameter value (after preset + listen overrides + raw), for display.
  PG.effParam = (s, name) => { const m = S.compile(s).map, v = m.get(name); return Array.isArray(v) ? v[0] : v; };
  PG.controlValue = (s, c) => {
    if (c.param) { const v = s.listen[c.param]; if (v !== undefined && v !== null && v !== '') return v; const b = S.baseParams(s).get(c.param); return Array.isArray(b) ? b[0] : b; }
    return S.getPath(s, c.path);
  };
  PG.controlRange = (s, c) => (typeof c.range === 'function' ? c.range(s) : c.range);
  PG.allControls = () => { const out = []; for (const g of PG.GROUPS) { for (const c of g.controls || []) if (c.path) out.push({ ...c, group: g }); for (const cd of g.cards || []) for (const c of cd.controls) if (c.path) out.push({ ...c, group: g, card: cd }); } return out; };
  PG.controlByPath = p => PG.allControls().find(c => c.path === p);
})();


/* ---- settings-ui.js ---- */
'use strict';
// The settings column: presets, the four groups of controls, inline warnings, sweeps, and settings files/links.
PG.SettingsUI = (() => {
  const { h, S } = PG;
  let root, rows = [];   // rows: {c, el, sync()}

  function mount(el) { root = el; render(); PG.bus.on('settings', why => (why === 'load' || why === 'preset' ? render() : refresh())); PG.bus.on('warnings', showWarnings); }

  function render() {
    const s = PG.state.settings; rows = [];
    PG.clear(root);
    root.append(presetBar(s));
    for (const g of PG.GROUPS) root.append(group(g, s));
    root.append(footer());
    refresh();
  }

  function presetBar(s) {
    const note = h('p.preset-note');
    const bar = h('div.seg.presets', { role: 'radiogroup', 'aria-label': 'Starting point' },
      Object.entries(S.PRESETS).map(([k, p]) => h('button', { type: 'button', role: 'radio', 'data-preset': k, text: p.label,
        on: { click: () => PG.editSettings(x => { x.preset = k; x.listen = {}; x.raw = {}; }, 'preset') } })));
    const row = h('div.presetrow', {}, h('h2.grp-title', { text: 'Starting point' }), bar, note);
    rows.push({ sync(s) { PG.$$('button', bar).forEach(b => b.setAttribute('aria-checked', String(b.dataset.preset === s.preset))); note.textContent = S.PRESETS[s.preset].note; } });
    return row;
  }

  function group(g, s) {
    const sec = h('section.grp', { id: 'grp-' + g.id, 'aria-labelledby': 'gt-' + g.id },
      h('h2.grp-title', { id: 'gt-' + g.id, text: g.title }), h('p.grp-blurb', { text: g.blurb }));
    if (g.id === 'shift') { const ban = h('p.derived'); ban.append('A timeline design is in use: when and how much to shift come from its blocks. The switches below still set units and the time-domain / phase-vocoder choice. ', h('button.linkish', { type: 'button', text: 'Open Timing & design', on: { click: () => PG.bus.emit('tab', 'design') } })); sec.append(ban); rows.push({ sync(s) { ban.hidden = s.when.mode !== 'design'; } }); }
    if (g.cards) for (const cd of g.cards) sec.append(card(cd, s));
    if (g.controls) { const body = h('div.ctl-list'); for (const c of g.controls) body.append(control(c, s)); sec.append(body); }
    sec.append(h('div.warns', { 'data-where': g.id }));
    return sec;
  }

  function card(cd, s) {
    const sw = h('input.switch', { type: 'checkbox', id: 'sw-' + cd.id, 'aria-describedby': 'cb-' + cd.id,
      on: { change: e => PG.editSettings(x => S.setPath(x, cd.on, e.target.checked)) } });
    const sum = h('span.card-sum');
    const body = h('div.card-body');
    for (const c of cd.controls) body.append(control(c, s));
    body.append(h('div.warns', { 'data-where': cd.id }));
    const el = h('div.card', { 'data-card': cd.id },
      h('div.card-head', {}, sw, h('label.card-title', { for: 'sw-' + cd.id, text: cd.title }), sum),
      h('p.card-blurb', { id: 'cb-' + cd.id, text: cd.blurb }), body);
    rows.push({ sync(s) { const on = !!S.getPath(s, cd.on); sw.checked = on; el.classList.toggle('on', on); body.hidden = !on; sum.textContent = on ? cd.summary(s) : 'off'; } });
    return el;
  }

  function control(c, s) {
    if (c.kind === 'derived') return derived();
    if (c.kind === 'ostlink') return ostlink(c);
    if (c.kind === 'designlink') { const p = h('p.derived'); rows.push({ sync(s) { p.textContent = 'Timeline: ' + S.summarize(s) + '. '; p.append(h('button.linkish', { type: 'button', text: 'Open Timing & design', on: { click: () => PG.bus.emit('tab', 'design') } })); } }); return p; }
    const id = 'c-' + (c.path || '').replace(/\./g, '-');
    const desc = h('p.ctl-desc', { id: id + '-d', text: c.desc || '' });
    const unit = h('span.unit');
    const reset = c.param ? h('button.linkish.reset', { type: 'button', text: 'preset value', title: 'Use the preset\'s value',
      on: { click: () => PG.editSettings(x => { delete x.listen[c.param]; }) } }) : null;
    const sweepBtn = c.sweep ? h('button.linkish.sweep', { type: 'button', text: 'Sweep', title: 'Run this setting at several values and compare',
      'aria-expanded': 'false', on: { click: () => toggleSweep() } }) : null;
    let sweepBox = null;
    const set = v => PG.editSettings(x => { if (c.param) x.listen[c.param] = v; else S.setPath(x, c.path, v); if (c.also) c.also(x); });
    let widget, sync;
    const rg = () => PG.controlRange(PG.state.settings, c) || [0, 1, 0.01, ''];
    if (c.kind === 'range' || c.kind === 'number') {
      const numIn = h('input.num', { type: 'number', id, 'aria-describedby': id + '-d', inputMode: 'decimal',
        on: { change: e => { const v = e.target.value === '' ? (c.nullable ? null : 0) : +e.target.value; set(c.int ? Math.round(v) : v); } } });
      const slider = c.kind === 'range' ? h('input.slider', { type: 'range', 'aria-label': c.label, on: { input: e => { numIn.value = e.target.value; set(+e.target.value); } } }) : null;
      widget = h('div.ctl-w', {}, slider, numIn, unit);
      sync = s => {
        const [mn, mx, st, un] = rg(), v = PG.controlValue(s, c);
        for (const e of [slider, numIn]) if (e) { e.min = mn; e.max = mx; e.step = st; }
        if (document.activeElement !== numIn) numIn.value = v === null || v === undefined ? '' : v;
        if (slider && document.activeElement !== slider) slider.value = v ?? 0;
        numIn.placeholder = c.nullable ? 'preset' : '';
        unit.textContent = un || '';
      };
    } else if (c.kind === 'select') {
      const sel = h('select', { id, 'aria-describedby': id + '-d', on: { change: e => set(c.num || typeof c.options[0][0] === 'number' ? +e.target.value : e.target.value) } },
        c.options.map(([v, t]) => h('option', { value: v, text: t })));
      widget = h('div.ctl-w', {}, sel); sync = s => { sel.value = String(PG.controlValue(s, c)); };
    } else if (c.kind === 'seg') {
      const bs = c.options.map(([v, t]) => h('button', { type: 'button', role: 'radio', text: t, on: { click: () => set(v) } }));
      widget = h('div.seg', { role: 'radiogroup', 'aria-label': c.label }, bs);
      sync = s => { const v = PG.controlValue(s, c); bs.forEach((b, i) => b.setAttribute('aria-checked', String(c.options[i][0] === v))); };
    } else if (c.kind === 'toggle') {
      const cb = h('input.switch', { type: 'checkbox', id, 'aria-describedby': id + '-d', on: { change: e => set(e.target.checked ? 1 : 0) } });
      widget = h('div.ctl-w', {}, cb); sync = s => { cb.checked = +PG.controlValue(s, c) === 1; };
    } else if (c.kind === 'choice') {
      const items = c.options.map(([v, t, d]) => h('label.choice', {}, h('input', { type: 'radio', name: id, value: v, on: { change: () => set(v) } }), h('span.choice-t', { text: t }), h('span.choice-d', { text: d })));
      widget = h('div.choices', { role: 'radiogroup', 'aria-label': c.label }, items);
      sync = s => { const v = PG.controlValue(s, c); items.forEach((it, i) => { it.firstChild.checked = c.options[i][0] === v; }); };
    } else if (c.kind === 'region') {
      const f = (k, lab) => { const i = h('input.num', { type: 'number', step: 10, 'aria-label': lab, on: { change: e => PG.editSettings(x => { x.shift.formant.region[k] = +e.target.value; }) } }); return [h('span.rlab', { text: lab }), i]; };
      const parts = [f('f1min', 'F1 from'), f('f1max', 'to'), f('f2min', 'F2 from'), f('f2max', 'to')];
      widget = h('div.region', {}, parts.map(([l, i], k) => h('span.rg', {}, l, i, k % 2 ? h('span.unit', { text: 'Hz' }) : null)));
      sync = s => { const r = s.shift.formant.region; ['f1min', 'f1max', 'f2min', 'f2max'].forEach((k, i) => { if (document.activeElement !== parts[i][1]) parts[i][1].value = r[k]; }); };
    } else if (c.kind === 'curve') {
      const tb = h('tbody');
      widget = h('div.curve', {}, h('table.mini', {}, h('thead', {}, h('tr', {}, h('th', { text: 'at F2 (Hz)' }), h('th', { text: 'F1 shift' }), h('th', { text: 'F2 shift' }), h('th'))), tb),
        h('button.linkish', { type: 'button', text: 'Add a point', on: { click: () => PG.editSettings(x => { const c2 = x.shift.formant.curve; c2.push([(c2.length ? c2[c2.length - 1][0] : 500) + 500, 0, 0]); }, 'curve') } }));
      sync = s => {
        if (tb.contains(document.activeElement)) return;
        PG.clear(tb);
        s.shift.formant.curve.forEach((p, i) => tb.append(h('tr', {}, [0, 1, 2].map(k => h('td', {}, h('input.num', { type: 'number', value: p[k], step: k ? 1 : 50, 'aria-label': ['F2', 'F1 shift', 'F2 shift'][k] + ' ' + (i + 1),
          on: { change: e => PG.editSettings(x => { x.shift.formant.curve[i][k] = +e.target.value; }) } }))),
          h('td', {}, h('button.linkish', { type: 'button', text: 'remove', on: { click: () => PG.editSettings(x => { x.shift.formant.curve.splice(i, 1); }) } })))));
      };
    } else if (c.kind === 'painter') {
      const info = h('span.muted');
      widget = h('div.painter-ctl', {},
        h('button.btn', { type: 'button', text: 'Paint on the vowel map', on: { click: () => PG.bus.emit('open-painter') } }),
        h('button.linkish', { type: 'button', text: 'Clear', on: { click: () => PG.editSettings(x => { x.shift.formant.painted.cells = []; }) } }), info);
      sync = s => { info.textContent = `${s.shift.formant.painted.cells.length} cells painted`; };
    }
    const lab = c.label ? h('label.ctl-label', { for: id, text: c.label }) : null;
    const stacked = ['choice', 'region', 'curve', 'painter'].includes(c.kind) || (c.kind === 'seg' && c.options.map(o => o[1]).join('').length > 18);
    const el = h('div.ctl' + (stacked ? '.stacked' : ''), { 'data-path': c.path || '' }, h('div.ctl-row', {}, lab, widget), h('div.ctl-foot', {}, c.desc ? desc : h('span'), h('span.ctl-extra', {}, reset, sweepBtn)));
    function toggleSweep() {
      if (sweepBox) { sweepBox.remove(); sweepBox = null; sweepBtn.setAttribute('aria-expanded', 'false'); return; }
      const [mn, mx, st] = rg(), v = +PG.controlValue(PG.state.settings, c) || 0;
      let vals;
      if (c.path === 'shift.formant.f1' || c.path === 'shift.formant.f2') vals = [-2, -1, 0, 1, 2].map(k => v + k * (PG.state.settings.shift.formant.units === 'pct' ? 10 : 100));
      else { const span = (mx - mn) / 8; vals = [-2, -1, 0, 1, 2].map(k => v + k * Math.max(st, Math.round(span / st) * st)); }
      vals = [...new Set(vals.map(x => Math.min(mx, Math.max(mn, +x.toFixed(4)))))];
      const inp = h('input.sweep-vals', { type: 'text', value: vals.join(', '), 'aria-label': `Values of ${c.label} to try` });
      sweepBox = h('div.sweep-box', {}, h('label', { text: 'Try these values' }), inp,
        h('button.btn.primary', { type: 'button', text: 'Run sweep', on: { click: () => {
          const vs = inp.value.split(/[,\s]+/).filter(Boolean).map(Number).filter(Number.isFinite);
          if (vs.length) PG.bus.emit('sweep', { control: c, values: vs.slice(0, 8) });
          toggleSweep();
        } } }),
        h('p.ctl-desc', { text: 'Each value runs as its own trial from the current input; the results open side by side in Compare.' }));
      el.append(sweepBox); sweepBtn.setAttribute('aria-expanded', 'true'); inp.focus();
    }
    rows.push({ sync(s) {
      const vis = !c.show || c.show(s); el.hidden = !vis; if (!vis) return;
      sync && sync(s);
      if (reset) reset.hidden = !(c.param in s.listen);
      el.classList.toggle('changed', !!c.param && c.param in s.listen);
    } });
    return el;
  }

  function derived() {
    const el = h('p.derived');
    rows.push({ sync(s) {
      const m = S.compile(s).meta, minF0 = Math.round(3.2 / (m.windowMs / 1000));
      el.textContent = `Processing delay ${m.latencyMs.toFixed(1)} ms (nDelay × frame), before sound-card latency. Analysis window ${m.windowMs.toFixed(0)} ms: pitch below about ${minF0} Hz is not tracked reliably.`;
    } });
    return el;
  }

  function ostlink() {
    const pre = h('pre.ost-preview'), btn = h('button.btn', { type: 'button', on: { click: () => {
      const s = PG.state.settings;
      if (s.when.mode !== 'custom') { const c = S.compile(s); PG.editSettings(x => { x.when.mode = 'custom'; x.when.ost = c.ost || ''; x.when.pcf = c.pcf || ''; }); }
      PG.bus.emit('tab', 'design'); setTimeout(() => { const d = document.querySelector('.dz-adv'); if (d) { d.open = true; d.scrollIntoView(); } }, 80);
    } } });
    const el = h('div.ostlink', {}, h('details', {}, h('summary', { text: 'The OST and PCF this generates' }), pre), btn);
    rows.push({ sync(s) {
      const c = S.compile(s);
      pre.textContent = c.ost ? `# OST\n${c.ost}\n# PCF\n${c.pcf}` : 'No OST/PCF needed: the shift is set through the perturbation field.';
      btn.textContent = s.when.mode === 'custom' ? 'Edit the OST and PCF' : 'Copy to a custom OST/PCF and edit';
    } });
    return el;
  }

  function footer() {
    const fileIn = h('input', { type: 'file', accept: '.json,application/json', hidden: true, on: { change: async e => {
      const f = e.target.files[0]; if (!f) return;
      try { PG.setSettings(JSON.parse(await f.text()), 'load'); PG.toast('Settings loaded.'); } catch (err) { PG.toast('That file is not a settings JSON: ' + err.message, 'error'); }
      e.target.value = '';
    } } });
    const build = h('select', { id: 'build-sel', on: { change: e => PG.editSettings(x => { x.build = e.target.value; }) } },
      Object.entries(PG.ENGINES).map(([v, i]) => h('option', { value: v, text: { lite: 'Shipped (recorders 10 s)', patched: 'Patched: OST-F1, OST-F2, I-01 fixed', full: 'Shipped, full size (30 s, ~310 MB)' }[v] || i.label })));
    rows.push({ sync(s) { build.value = s.build; } });
    return h('section.grp.grp-foot', {},
      h('div.ctl', {}, h('div.ctl-row', {}, h('label.ctl-label', { for: 'build-sel', text: 'Audapter build' }), h('div.ctl-w', {}, build)),
        h('p.ctl-desc', { text: 'The blab-lab core compiled to WebAssembly. "Patched" adds three one-line fixes from the audit; use it to see whether a result depends on those bugs.' })),
      h('div.btnrow', {},
        h('button.btn', { type: 'button', text: 'Save settings', on: { click: () => PG.Store.download(new Blob([JSON.stringify(PG.S.effective(PG.state.settings), null, 1)], { type: 'application/json' }), 'audapter-settings.json') } }),
        h('button.btn', { type: 'button', text: 'Load settings', on: { click: () => fileIn.click() } }), fileIn,
        h('button.btn', { type: 'button', text: 'Copy link', on: { click: async () => {
          const l = PG.Store.settingsLink(PG.state.settings);
          if (!l) return PG.toast('These settings are too large for a link (a painted field). Use Save settings.', 'error');
          history.replaceState(null, '', l); try { await navigator.clipboard.writeText(l); PG.toast('Link copied.'); } catch { PG.toast('Link is in the address bar.'); }
        } } }),
        h('button.btn', { type: 'button', text: 'Reset', on: { click: () => PG.setSettings(PG.S.defaultSettings(), 'load') } })),
      h('p.expert-link', {}, h('button.linkish', { type: 'button', text: 'Expert: all 87 Audapter parameters', on: { click: () => PG.ParamsUI.openExpert() } })));
  }

  function refresh() { const s = PG.state.settings; for (const r of rows) r.sync(s); PG.bus.emit('settings-rendered'); }

  // Warnings are computed by main (they need the input); place each under the card or group it concerns.
  function showWarnings(list) {
    if (!root) return;
    const map = { formant: 'formant', pitch: 'pitch', loudness: 'loudness', timing: 'timing', delay: 'delay', when: 'when', ost: 'when', pcf: 'when', listen: 'listen', hear: 'hear', run: 'run', build: 'hear' };
    for (const box of PG.$$('.warns', root)) PG.clear(box);
    const runBox = PG.$('#run-warns');
    if (runBox) PG.clear(runBox);
    for (const w of list) {
      const where = map[w.where] || 'listen';
      const box = where === 'run' ? runBox : PG.$(`.warns[data-where="${where}"]`, root) || PG.$('.warns[data-where="listen"]', root);
      if (!box) continue;
      box.append(PG.warnEl(w));
    }
  }
  return { mount, render, refresh };
})();

PG.warnEl = w => PG.h(`div.warn.w-${w.level}`, { role: w.level === 'error' ? 'alert' : null },
  PG.h('span.w-glyph', { 'aria-hidden': 'true' }), PG.h('span.w-lvl', { text: w.level === 'error' ? 'Will not run' : w.level === 'warn' ? 'Caution' : 'Note' }),
  w.id ? PG.h('span.w-id', { text: w.id }) : null, PG.h('span.w-text', { text: w.text }));


/* ---- input-ui.js ---- */
'use strict';
// Input sources: bundled corpus clip, microphone recording, uploaded file, synthetic vowel.
// Peterson & Barney (1952) average formants (Hz) and F0, used for the vowel-space backdrop and the synthesiser.
PG.VOWELS = {
  F0: { men: 132, women: 223, children: 264 },
  list: [['i', 'heed'], ['ɪ', 'hid'], ['ɛ', 'head'], ['æ', 'had'], ['ɑ', 'hod'], ['ɔ', 'hawed'], ['ʊ', 'hood'], ['u', 'who\'d'], ['ʌ', 'hud'], ['ɝ', 'heard']],
  men: [[270, 2290, 3010], [390, 1990, 2550], [530, 1840, 2480], [660, 1720, 2410], [730, 1090, 2440], [570, 840, 2410], [440, 1020, 2240], [300, 870, 2240], [640, 1190, 2390], [490, 1350, 1690]],
  women: [[310, 2790, 3310], [430, 2480, 3070], [610, 2330, 2990], [860, 2050, 2850], [850, 1220, 2810], [590, 920, 2710], [470, 1160, 2680], [370, 950, 2670], [760, 1400, 2780], [500, 1640, 1960]],
  children: [[370, 3200, 3730], [530, 2730, 3600], [690, 2610, 3570], [1010, 2320, 3320], [1030, 1370, 3170], [680, 1060, 3180], [560, 1410, 3310], [430, 1170, 3260], [850, 1590, 3360], [560, 1820, 2160]],
};
PG.talkerFor = preset => (preset === 'child' ? 'children' : preset === 'male' || preset === 'lowvoice' ? 'men' : 'women');

PG.InputUI = (() => {
  const { h } = PG;
  let root, body, info, src = 'clip', rec = null;
  const clipWait = {};
  PG.clipLoaded = (id, fmt, b64) => { const r = clipWait[id]; if (r) r({ fmt, b64 }); };
  function loadClipScript(id) {
    return new Promise((res, rej) => {
      clipWait[id] = res;
      const s = document.createElement('script'); s.src = `clips/${id}.js`; s.onerror = () => rej(new Error(`could not load clips/${id}.js`));
      document.head.append(s); s.onload = () => s.remove();
    });
  }
  const clipInputs = new Map();
  async function loadClipInput(id) {
    if (clipInputs.has(id) && PG.state.inputs.has(clipInputs.get(id).id)) return clipInputs.get(id);
    const meta = PG.CLIPS.find(c => c.id === id);
    const { b64 } = await loadClipScript(id);
    const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const d = await PG.Audio.decode(u8.buffer);
    const inp = { id: PG.uid(), kind: 'clip', clipId: id, label: `${meta.label} (${groupLabel(meta)}, ${meta.id})`, x: d.x, meta: { source: meta.source, license: meta.license, url: meta.url } };
    PG.state.inputs.set(inp.id, inp); clipInputs.set(id, inp);
    return inp;
  }
  async function loadClip(id) { set(await loadClipInput(id)); }
  const groupLabel = c => ({ adult_F: 'woman', adult_M: 'man', child: `child, ${c.age}`, teen_F: `girl, ${c.age}`, singer_F: 'female singer', singer_M: 'male singer', singer_unknown: 'singer' }[c.group] || c.group);

  function set(inp) {
    inp.id = inp.id || PG.uid();
    PG.state.inputs.set(inp.id, inp); PG.state.input = inp;
    PG.bus.emit('input', inp);
  }

  function mount(el) { root = el; render(); PG.bus.on('input', inp => { const sel = PG.$('#clip-sel'); if (sel && inp && inp.clipId) sel.value = inp.clipId; showInfo(inp); }); }
  function render() {
    PG.clear(root);
    const tabs = [['clip', 'Speech clip'], ['synth', 'Synthetic vowel'], ['record', 'Record'], ['upload', 'Upload']];
    const bar = h('div.seg.src-tabs', { role: 'tablist', 'aria-label': 'Input source' }, tabs.map(([k, t]) => h('button', { type: 'button', role: 'tab', id: 'src-' + k, 'aria-selected': String(k === src), text: t,
      on: { click: () => { src = k; render(); } } })));
    body = h('div.src-body', { role: 'tabpanel', 'aria-labelledby': 'src-' + src });
    info = h('p.input-info', { 'aria-live': 'polite' });
    root.append(h('div.src-head', {}, h('h2.grp-title', { text: 'Input' }), bar), body, info);
    ({ clip, record, upload, synth })[src]();
    showInfo(PG.state.input);
  }
  function showInfo(inp) {
    if (!info) return;
    if (!inp) { info.textContent = 'Choose an input to start.'; return; }
    const pk = PG.DSP.peak(inp.x);
    info.textContent = `${inp.label}: ${(inp.x.length / 48000).toFixed(2)} s, peak ${(20 * Math.log10(pk + 1e-12)).toFixed(1)} dBFS${inp.meta && inp.meta.license ? `. ${inp.meta.license.split('(')[0].trim()}, ${inp.meta.source}` : ''}${inp.meta && inp.meta.note ? '. ' + inp.meta.note : ''}`;
  }

  function clip() {
    const groups = {};
    for (const c of PG.CLIPS) (groups[groupLabel(c).replace(/, .*/, '')] ||= []).push(c);
    const sel = h('select', { id: 'clip-sel', 'aria-label': 'Speech clip', on: { change: e => loadClip(e.target.value).catch(err => PG.toast(err.message, 'error')) } },
      h('option', { value: '', text: 'Choose a clip…', disabled: true, selected: !(PG.state.input && PG.state.input.clipId) }),
      Object.entries(groups).map(([g, cs]) => h('optgroup', { label: g }, cs.map(c => h('option', { value: c.id, text: `“${c.label}” ${c.dur.toFixed(1)} s`, selected: PG.state.input && PG.state.input.clipId === c.id })))));
    body.append(h('div.src-row', {}, sel),
      h('p.ctl-desc', { text: 'Real speech from the audit corpus: CMU ARCTIC, LibriSpeech, speechocean762 children, VoiceBank-DEMAND in noise, PVQD sustained vowels (some dysphonic), VocalSet and vocadito singers. 48 kHz, original level.' }));
  }

  function synth() {
    const talker = PG.talkerFor(PG.state.settings.preset);
    const st = synth.state || (synth.state = { vowel: 4, vowel2: -1, f0: PG.VOWELS.F0[talker], f0End: null, dur: 2, level: -20, vib: 0, talker });
    if (st.talker !== talker) { st.talker = talker; st.f0 = PG.VOWELS.F0[talker]; }
    const num = (k, lab, min, max, step, unit) => h('label.syn', {}, h('span', { text: lab }), h('input.num', { type: 'number', min, max, step, value: st[k] ?? '', placeholder: 'same',
      on: { change: e => { st[k] = e.target.value === '' ? null : +e.target.value; } } }), h('span.unit', { text: unit }));
    const vsel = (k, withNone) => h('select', { 'aria-label': k === 'vowel' ? 'Vowel' : 'Glide to', on: { change: e => { st[k] = +e.target.value; } } },
      withNone ? h('option', { value: -1, text: 'no glide', selected: st[k] < 0 }) : null,
      PG.VOWELS.list.map(([ipa, w], i) => h('option', { value: i, text: `/${ipa}/ as in ${w}`, selected: st[k] === i })));
    body.append(h('div.syn-grid', {},
      h('label.syn', {}, h('span', { text: 'Vowel' }), vsel('vowel')),
      h('label.syn', {}, h('span', { text: 'Glide to' }), vsel('vowel2', true)),
      num('f0', 'F0', 50, 600, 1, 'Hz'), num('f0End', 'F0 at end', 50, 600, 1, 'Hz'),
      num('dur', 'Length', 0.5, 9, 0.1, 's'), num('level', 'Level', -50, -3, 1, 'dBFS'), num('vib', 'Vibrato', 0, 100, 5, 'cents')),
      h('div.btnrow', {}, h('button.btn.primary', { type: 'button', text: 'Make vowel', on: { click: make } })),
      cloudBox(),
      h('p.ctl-desc', { text: `Harmonics shaped by four resonances at Peterson & Barney's average formants for ${talker} (1952). Onset at 0.2 s, offset 0.2 s before the end, 30 ms ramps. Pick a vowel on the vowel map to use its formants.` }));
    function cloudBox() {
      const c = synth.cloud || (synth.cloud = { n: 20, sd1: 50, sd2: 110, baseline: true });
      const nn = (k, lab, unit, step) => h('label.syn', {}, h('span', { text: lab }), h('input.num', { type: 'number', step, value: c[k], id: 'cloud-' + k, on: { change: e => { c[k] = +e.target.value; } } }), h('span.unit', { text: unit }));
      return h('details.cloud', { open: !!synth.cloudOpen, on: { toggle: e => { synth.cloudOpen = e.target.open; } } }, h('summary', { text: 'Vowel cloud: many tokens of this vowel' }),
        h('p.ctl-desc', { text: 'Makes several short tokens of the vowel above with random F1 and F2 (normal spread), runs each as its own trial with the current settings, ticks them and shows them as tokens on the vowel map. Useful for variability (inward / outward) designs.' }),
        h('div.syn-grid', {}, nn('n', 'Tokens', '', 1), nn('sd1', 'F1 spread (SD)', 'Hz', 5), nn('sd2', 'F2 spread (SD)', 'Hz', 5)),
        h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: c.baseline, id: 'cloud-baseline', on: { change: e => { c.baseline = e.target.checked; } } }), ' First run them unshifted and use their median as the vowel centre (a baseline)'),
        h('div.btnrow', {}, h('button.btn.primary', { type: 'button', id: 'cloud-run', text: 'Make and run the cloud', on: { click: () => {
          const V = PG.VOWELS[talker], a = V[st.vowel];
          PG.bus.emit('cloud', { n: Math.max(2, Math.min(100, c.n | 0)), sd1: c.sd1, sd2: c.sd2, f1: a[0], f2: a[1], f3: a[2], f0: st.f0, dur: 0.8, baseline: c.baseline });
        } } })));
    }
    function make() {
      const V = PG.VOWELS[talker], a = V[st.vowel], b = st.vowel2 >= 0 ? V[st.vowel2] : null;
      const fm = [a[0], a[1], a[2], a[2] + 900], fe = b ? [b[0], b[1], b[2], b[2] + 900] : null;
      const x = PG.DSP.synthVowel({ dur: st.dur, onset: 0.2, offset: Math.max(0.3, st.dur - 0.2), f0: st.f0, f0End: st.f0End || null, formants: fm, formantsEnd: fe, level: st.level, vibratoHz: st.vib ? 5.5 : 0, vibratoCents: st.vib || 0 });
      const ipa = PG.VOWELS.list[st.vowel][0], ipa2 = b ? PG.VOWELS.list[st.vowel2][0] : null;
      set({ kind: 'synth', label: `Synthetic /${ipa}/${ipa2 ? '→/' + ipa2 + '/' : ''}, F0 ${st.f0}${st.f0End ? '→' + st.f0End : ''} Hz`, x, meta: { synth: { ...st, formants: fm, formantsEnd: fe } } });
    }
    synth.make = make;
    PG.synthPick = (f1, f2) => { const V = PG.VOWELS[talker]; let best = 0, bd = Infinity; V.forEach((v, i) => { const d = Math.hypot(v[0] - f1, (v[1] - f2) / 2); if (d < bd) { bd = d; best = i; } }); st.vowel = best; if (src === 'synth') render(); };
  }

  function record() {
    const meter = h('div.meter', { role: 'meter', 'aria-label': 'Input level', 'aria-valuemin': 0, 'aria-valuemax': 1 }, h('div.meter-fill'));
    const secs = h('select', { 'aria-label': 'Maximum length' }, [2, 3, 5, 8].map(s => h('option', { value: s, text: `${s} s max`, selected: s === 3 })));
    const status = h('span.muted', { 'aria-live': 'polite' });
    const btn = h('button.btn.primary.rec', { type: 'button', id: 'rec-btn', text: 'Record', on: { click: async () => {
      if (rec) { const x = await rec.stop(); return; }
      try {
        btn.textContent = 'Stop'; status.textContent = 'Recording…';
        rec = await PG.Audio.record({ maxSeconds: +secs.value, onLevel: (pk, t) => { meter.firstChild.style.width = Math.min(100, 100 * Math.sqrt(pk)) + '%'; meter.setAttribute('aria-valuenow', pk.toFixed(2)); status.textContent = `Recording ${t.toFixed(1)} s`; } });
        const x = await rec.finished; rec = null; btn.textContent = 'Record';
        const pk = PG.DSP.peak(x);
        status.textContent = pk > 0.99 ? 'The recording clipped; move back from the microphone.' : '';
        set({ kind: 'mic', label: `Recording ${new Date().toLocaleTimeString()}`, x, meta: { rate: 48000 } });
      } catch (e) { rec = null; btn.textContent = 'Record'; status.textContent = ''; PG.toast(e.message || String(e), 'error'); }
    } } });
    body.append(h('div.src-row', {}, btn, secs, meter, status),
      h('p.ctl-desc', { text: 'Record, then process: the page records first and runs Audapter afterwards, so this is not real-time feedback. Echo cancellation, noise suppression and automatic gain are off.' }));
  }

  function upload() {
    const f = h('input', { type: 'file', id: 'file-in', accept: 'audio/*,.wav,.flac', on: { change: async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const d = await PG.Audio.decode(await file.arrayBuffer());
        set({ kind: 'file', label: file.name, x: d.x, meta: { note: d.resampled ? 'Resampled to 48 kHz by the browser' : '' } });
      } catch (err) { PG.toast(`Could not read ${file.name}: ${err.message}`, 'error'); }
    } } });
    body.append(h('div.src-row', {}, h('label.btn', { for: 'file-in', text: 'Choose a WAV or FLAC file' }), f),
      h('p.ctl-desc', { text: 'Mono or stereo (mixed to mono). Files not at 48 kHz are resampled by the browser; 48 kHz WAVs are read sample-exact. The file stays in this browser.' }));
  }
  return { mount, set, loadClip, loadClipInput, render, makeSynth: () => { if (!synth.make) { src = 'synth'; render(); } synth.make(); } };
})();


/* ---- tiers.js ---- */
'use strict';
// Time-aligned tiers in the Praat TextGrid style: labels in a left column, one shared time axis, hairline boundaries.
// Tier kinds: 'wave', 'spec' (spectrogram + formant overlays), 'lines' (continuous values), 'intervals'.
// Encodings (the report's): input grey, expected hollow ink, observed blue, discrepancy orange.
PG.Tiers = (() => {
  const { h } = PG;
  const zoom = { t0: 0, t1: 1, dur: 1 };
  let cursor = null;   // time the user clicked (playback starts there)
  const stacks = new Set();

  function col() {
    return { ink: PG.css('--ink'), ink2: PG.css('--ink-2'), ink3: PG.css('--ink-3'), paper: PG.css('--paper'), surface: PG.css('--surface'), rule: PG.css('--rule'),
      input: PG.css('--input'), obs: PG.css('--observed'), disc: PG.css('--disc'), discFill: PG.css('--disc-fill'), context: PG.css('--context'), dark: PG.theme.dark() };
  }
  function setDuration(d, keep) { const nd = Math.max(0.05, d), same = Math.abs(nd - zoom.dur) < 1e-6; zoom.dur = nd; if (!keep || !same || zoom.t1 > zoom.dur + 1e-9) { zoom.t0 = 0; zoom.t1 = zoom.dur; } redrawAll(); }
  function setZoom(t0, t1) {
    const span = Math.max(0.02, Math.min(zoom.dur, t1 - t0));
    t0 = Math.max(0, Math.min(zoom.dur - span, t0)); zoom.t0 = t0; zoom.t1 = t0 + span; redrawAll(); PG.bus.emit('zoom', zoom);
  }
  const zoomBy = (f, at) => { const c = at ?? (zoom.t0 + zoom.t1) / 2, s = (zoom.t1 - zoom.t0) * f; setZoom(c - (c - zoom.t0) * f, c - (c - zoom.t0) * f + s); };
  const fit = () => setZoom(0, zoom.dur);
  function redrawAll() { for (const s of stacks) s.draw(); }

  // A stack of tiers sharing the zoom, hover crosshair, cursor and playhead.
  function Stack(container, { tiers, compact = false, axis = true, t0Offset = 0 } = {}) {
    const narrow = !compact && container.clientWidth > 0 && container.clientWidth < 560, LW = compact || narrow ? 0 : 150;
    const rowsEl = h('div.tiers-rows');
    const hair = h('div.hair', { 'aria-hidden': 'true' }), play = h('div.playhead', { 'aria-hidden': 'true' }), cur = h('div.cursor', { 'aria-hidden': 'true' });
    const tip = h('div.tip', { role: 'status' });
    const axisC = axis ? h('canvas.axis') : null;
    const plot = h('div.tiers-plot', {}, rowsEl, hair, cur, play);
    const el = h('div.tiers' + (narrow ? '.narrow' : ''), {}, plot, axisC ? h('div.axis-row', {}, LW ? h('div.axis-lab', { text: 'time (s)' }) : null, axisC) : null, tip);
    el.style.setProperty('--lw', LW + 'px');
    container.append(el);
    const T = tiers.map(t => {
      const cv = h('canvas.tier-c', { role: 'img', 'aria-label': t.alt || t.label });
      const lab = compact ? null : h('div.tier-lab', {}, h('div.tl-name', { text: t.label }), t.sub ? h('div.tl-sub', { text: t.sub }) : null, t.key ? t.key() : null);
      const row = h('div.tier', { style: { height: t.height + 'px', minHeight: compact ? '' : '40px' } }, lab, cv);
      rowsEl.append(row);
      if (t.attach) setTimeout(() => t.attach(cv, { tOf: px => zoom.t0 + px / Math.max(1, cv.clientWidth) * (zoom.t1 - zoom.t0), xOf: tt => (tt - zoom.t0) / (zoom.t1 - zoom.t0) * cv.clientWidth, redraw: () => api.draw() }), 0);
      return { ...t, cv, row };
    });
    const W = () => Math.max(50, rowsEl.clientWidth - LW);
    const xOf = (t, w) => (t - zoom.t0) / (zoom.t1 - zoom.t0) * w;
    const tOf = px => zoom.t0 + px / W() * (zoom.t1 - zoom.t0);
    const api = {
      el,
      draw() {
        const w = W(), dpr = Math.min(2, self.devicePixelRatio || 1), C = col();
        for (const t of T) {
          const hgt = t.height;
          t.cv.width = Math.round(w * dpr); t.cv.height = Math.round(hgt * dpr); t.cv.style.width = w + 'px'; t.cv.style.height = hgt + 'px';
          const g = t.cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, hgt);
          try { t.draw(g, w, hgt, tt => xOf(tt, w), C, zoom); } catch (e) { console.error('tier', t.label, e); }
          g.strokeStyle = C.rule; g.lineWidth = 1; g.beginPath(); g.moveTo(0, hgt - 0.5); g.lineTo(w, hgt - 0.5); g.stroke();
        }
        if (axisC) drawAxis(axisC, w, C);
        api.placeCursor();
      },
      placeCursor() { if (cursor === null) { cur.hidden = true; return; } const x = xOf(cursor, W()); cur.hidden = x < 0 || x > W(); cur.style.left = (LW + x) + 'px'; },
      playhead(t) { if (t === null) { play.hidden = true; return; } const x = xOf(t, W()); play.hidden = x < 0 || x > W(); play.style.left = (LW + x) + 'px'; },
      destroy() { stacks.delete(api); ro.disconnect(); el.remove(); },
    };
    function drawAxis(c, w, C) {
      const dpr = Math.min(2, self.devicePixelRatio || 1); c.width = w * dpr; c.height = 22 * dpr; c.style.width = w + 'px'; c.style.height = '22px';
      const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const span = zoom.t1 - zoom.t0, steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10];
      const st = steps.find(s => w / (span / s) >= 60) || 10;
      g.fillStyle = C.ink3; g.strokeStyle = C.rule; g.font = '12px ' + PG.css('--serif'); g.textBaseline = 'top';
      for (let t = Math.ceil(zoom.t0 / st) * st; t <= zoom.t1 + 1e-9; t += st) {
        const x = xOf(t, w); g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, 4); g.stroke();
        const s = (t + t0Offset).toFixed(st < 0.1 ? 2 : st < 1 ? 1 : 0);
        g.fillText(s, Math.min(w - g.measureText(s).width, Math.max(0, x - g.measureText(s).width / 2)), 6);
      }
    }
    // interaction: hover crosshair + readout, click to place the cursor, drag to pan, wheel/pinch to zoom
    let drag = null;
    plot.addEventListener('pointermove', e => {
      const r = rowsEl.getBoundingClientRect(), px = e.clientX - r.left - LW;
      if (drag) { const dt = (drag.x - e.clientX) / W() * (drag.t1 - drag.t0); if (Math.abs(drag.x - e.clientX) > 3) drag.moved = true; setZoom(drag.t0 + dt, drag.t1 + dt); return; }
      if (px < 0 || px > W()) { hair.hidden = true; tip.hidden = true; return; }
      const t = tOf(px); hair.hidden = false; hair.style.left = (LW + px) + 'px';
      showTip(t, e.clientX - el.getBoundingClientRect().left, e.clientY - el.getBoundingClientRect().top);
    });
    plot.addEventListener('pointerleave', () => { hair.hidden = true; tip.hidden = true; });
    plot.addEventListener('pointerdown', e => { if (e.button !== 0) return; drag = { x: e.clientX, t0: zoom.t0, t1: zoom.t1, moved: false }; plot.setPointerCapture(e.pointerId); });
    plot.addEventListener('pointerup', e => {
      const d = drag; drag = null; if (!d || d.moved) return;
      const r = rowsEl.getBoundingClientRect(), px = e.clientX - r.left - LW; if (px < 0) return;
      setCursor(tOf(px));
    });
    plot.addEventListener('wheel', e => {
      if (!(e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey)) return;
      e.preventDefault();
      const r = rowsEl.getBoundingClientRect(), t = tOf(e.clientX - r.left - LW);
      if (e.ctrlKey || e.metaKey) zoomBy(Math.exp(e.deltaY * 0.01), t);
      else { const dt = (e.deltaX || e.deltaY) / W() * (zoom.t1 - zoom.t0); setZoom(zoom.t0 + dt, zoom.t1 + dt); }
    }, { passive: false });
    plot.addEventListener('dblclick', () => fit());
    function showTip(t, x, y) {
      const lines = [];
      for (const tr of T) if (tr.readout) for (const r of tr.readout(t) || []) lines.push(r);
      if (!lines.length) { tip.hidden = true; return; }
      PG.clear(tip);
      tip.append(h('div.tip-t', { text: `${(t + t0Offset).toFixed(3)} s` }));
      for (const r of lines) tip.append(h('div.tip-r', {}, h(`span.key.k-${r.style || 'none'}`), h('b', { text: r.value }), h('span', { text: ' ' + r.label })));
      tip.hidden = false;
      const tw = tip.offsetWidth, ew = el.clientWidth;
      tip.style.left = Math.min(ew - tw - 4, x + 14) + 'px'; tip.style.top = Math.max(0, y - 10) + 'px';
    }
    const ro = new ResizeObserver(() => api.draw()); ro.observe(rowsEl);
    stacks.add(api);
    hair.hidden = true; tip.hidden = true; play.hidden = true;
    api.draw();
    return api;
  }
  function setCursor(t) { cursor = t; for (const s of stacks) s.placeCursor(); PG.bus.emit('cursor', t); }

  // playhead animation
  function tick() {
    const p = PG.Audio.position();
    for (const s of stacks) s.playhead(p ? p.t - (p.h.offset || 0) : null);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  PG.bus.on('theme', redrawAll);

  // ---------- drawing primitives
  const isNum = v => Number.isFinite(v) && v > 0;
  // series: {t(i) or dt, y: array, style: 'observed'|'target'|'input'|'obsDots'|'inDots'|'refLine', yOf}
  function drawSeries(g, s, xOf, yOf, C, w) {
    const n = s.y.length, tAt = s.t || (i => i * s.dt + (s.tOff || 0));
    const i0 = Math.max(0, Math.floor((zoom.t0 - (s.tOff || 0)) / (s.dt || 1e9)) - 2), i1 = s.dt ? Math.min(n, Math.ceil((zoom.t1 - (s.tOff || 0)) / s.dt) + 2) : n;
    const ok = s.ok || isNum;
    if (/Dots$/.test(s.style)) {
      g.fillStyle = s.style === 'obsDots' ? C.obs : C.input;
      const r = s.r || 2;
      const stride = Math.max(1, Math.floor((i1 - i0) / (w * 1.2)));
      for (let i = i0; i < i1; i += stride) { const v = s.y[i]; if (!ok(v)) continue; const x = xOf(tAt(i)); g.beginPath(); g.arc(x, yOf(v), r, 0, 2 * Math.PI); g.fill(); }
      return;
    }
    const path = () => {
      g.beginPath(); let pen = false;
      for (let i = i0; i < i1; i++) { const v = s.y[i]; if (!ok(v)) { pen = false; continue; } const x = xOf(tAt(i)), y = yOf(v); if (pen) g.lineTo(x, y); else { g.moveTo(x, y); pen = true; } }
    };
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (s.style === 'target') {   // hollow tube: ink outline, paper core
      path(); g.strokeStyle = C.ink; g.lineWidth = 4.5; g.stroke();
      path(); g.strokeStyle = C.dark ? '#0d0f12' : '#ffffff'; g.lineWidth = 2; g.stroke();
    } else {
      path(); g.strokeStyle = s.style === 'observed' ? C.obs : s.style === 'input' ? C.input : C.ink2; g.lineWidth = s.lw || (s.style === 'input' ? 1.5 : 2); g.stroke();
    }
  }
  function spectroImage(spec, fmax, C) {   // offscreen canvas (frames x bins), grey ramp; cached per theme
    const key = (C.dark ? 'd' : 'l') + fmax;
    if (spec._img && spec._img.key === key) return spec._img.c;
    const nb = Math.min(spec.nBins, Math.round(fmax / spec.fmax * (spec.nBins - 1)) + 1);
    const c = document.createElement('canvas'); c.width = spec.nFrames; c.height = nb;
    const g = c.getContext('2d'), im = g.createImageData(spec.nFrames, nb);
    const lo = C.dark ? [21, 24, 28] : [255, 255, 255], hi = C.dark ? [225, 230, 236] : [22, 28, 36];
    for (let f = 0; f < spec.nFrames; f++) for (let b = 0; b < nb; b++) {
      const v = spec.data[f * spec.nBins + b] / 255, q = v * v * (3 - 2 * v) * 0.85 + v * 0.15, o = ((nb - 1 - b) * spec.nFrames + f) * 4;
      im.data[o] = lo[0] + (hi[0] - lo[0]) * q; im.data[o + 1] = lo[1] + (hi[1] - lo[1]) * q; im.data[o + 2] = lo[2] + (hi[2] - lo[2]) * q; im.data[o + 3] = 255;
    }
    g.putImageData(im, 0, 0); spec._img = { key, c };
    return c;
  }
  function drawSpec(g, spec, xOf, w, hgt, fmax, C) {
    if (!spec) return;
    const img = spectroImage(spec, fmax, C), dur = spec.nFrames * spec.hop;
    const x0 = xOf(-spec.hop / 2), x1 = xOf(dur - spec.hop / 2);
    g.imageSmoothingEnabled = true; g.drawImage(img, x0, 0, x1 - x0, hgt);
  }
  function gridY(g, w, yOf, vals, C, fmt) {
    g.font = '11px ' + PG.css('--serif'); g.textBaseline = 'bottom';
    for (const v of vals) { const y = Math.round(yOf(v)) + 0.5; g.strokeStyle = C.rule; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.fillStyle = C.ink3; g.fillText(fmt(v), 3, y - 1); }
  }
  function bands(g, list, xOf, hgt, C, label) {   // discrepancy bands
    for (const [a, b] of list) { const x0 = xOf(a), x1 = xOf(b); g.fillStyle = C.discFill; g.fillRect(x0, 0, Math.max(1, x1 - x0), hgt); g.fillStyle = C.disc; g.fillRect(x0, 0, Math.max(1, x1 - x0), 2); }
    if (label && list.length) { g.fillStyle = C.ink; g.font = '12px ' + PG.css('--serif'); g.textBaseline = 'top'; const x = Math.max(2, Math.min(xOf(list[0][0]) + 3, g.canvas.width / 2)); g.fillText(label, x, 4); }
  }
  // intervals: [{a, b, label, kind:'obs'|'exp'|'ctx'|'disc'}], two lanes (expected above, observed below) when both exist
  function drawIntervals(g, items, xOf, w, hgt, C) {
    const lanes = [...new Set(items.map(i => i.lane || 0))].sort(), lh = (hgt - 4) / Math.max(1, lanes.length);
    g.font = '12px ' + PG.css('--serif'); g.textBaseline = 'middle';
    for (const it of items) {
      const li = lanes.indexOf(it.lane || 0), y = 2 + li * lh + 2, hh = lh - 4, x0 = Math.max(-2, xOf(it.a)), x1 = Math.min(w + 2, xOf(it.b));
      if (x1 < 0 || x0 > w || x1 - x0 < 0.5) continue;
      if (it.kind === 'obs') { g.fillStyle = C.obs; g.fillRect(x0, y, x1 - x0, hh); }
      else if (it.kind === 'ctx') { g.fillStyle = C.context; g.fillRect(x0, y, x1 - x0, hh); }
      else if (it.kind === 'disc') { g.fillStyle = C.discFill; g.fillRect(x0, y, x1 - x0, hh); }
      else { g.strokeStyle = C.ink; g.lineWidth = 1.5; g.strokeRect(x0 + 0.75, y + 0.75, x1 - x0 - 1.5, hh - 1.5); }
      g.strokeStyle = C.paper; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.round(x0) + 0.5, y); g.lineTo(Math.round(x0) + 0.5, y + hh); g.stroke();
      if (it.label && x1 - x0 > g.measureText(it.label).width + 8) {
        g.fillStyle = it.kind === 'obs' ? PG.css('--on-observed') : C.ink;
        g.fillText(it.label, Math.max(x0, 0) + 4, y + hh / 2 + 1);
      }
    }
  }
  // Run-length intervals of a per-frame array.
  function runs(arr, dt, pred, labelOf) {
    const out = []; let a = null, lab = null;
    for (let i = 0; i <= arr.length; i++) {
      const on = i < arr.length && pred(arr[i], i), l = on ? (labelOf ? labelOf(arr[i]) : '') : null;
      if (a !== null && (!on || l !== lab)) { out.push({ a: a * dt, b: i * dt, label: lab }); a = null; }
      if (on && a === null) { a = i; lab = l; }
    }
    return out;
  }
  return { Stack, zoom, setDuration, setZoom, zoomBy, fit, redrawAll, setCursor, cursor: () => cursor, drawSeries, drawSpec, gridY, bands, drawIntervals, runs, col, isNum };
})();


/* ---- views.js ---- */
'use strict';
// Tier definitions for one trial: the "Spectrograms" and "Pitch & level" views.
PG.Views = (() => {
  const { h } = PG, TT = PG.Tiers;
  const key = (cls, text) => h('span.lk', {}, h(`span.key.k-${cls}`), text);

  // Per-trial derived series (cached on the trial object).
  function derive(t) {
    if (t._d) return t._d;
    const r = t.result, A = r.analysis, dt = 1 / r.frameRate, n = r.fmts[0].length;
    const m = (r.compiled && r.compiled.meta) || {};
    const S = PG.S.normalize(t.settings);
    const dur = t.inputLen / 48000;
    // pitch: Audapter's logged pitchHz vs the independent YIN estimate on the input
    const hasPitch = r.pitchHz && r.pitchHz.some(v => v > 0);
    const disc = [];
    if (hasPitch) {
      let a = null;
      for (let i = 0; i <= n; i++) {
        const tt = i * dt, k = Math.round(tt / A.f0In.hop), f = A.f0In.f0[k], p = i < n ? r.pitchHz[i] : 0;
        const bad = i < n && f > 0 && p > 0 && (p / f > 1.25 || p / f < 0.8);
        if (bad && a === null) a = tt;
        if (!bad && a !== null) { if (tt - a >= 0.02) { if (disc.length && a - disc[disc.length - 1][1] < 0.03) disc[disc.length - 1][1] = tt; else disc.push([a, tt]); } a = null; }
      }
    }
    // measured pitch shift in the audio: YIN(out) / YIN(in), in semitones
    const f0i = A.f0In.f0, f0o = A.f0Out.f0, pst = new Float32Array(f0i.length).fill(NaN);
    for (let i = 0; i < f0i.length; i++) if (f0i[i] > 0 && f0o[i] > 0) pst[i] = 12 * Math.log2(f0o[i] / f0i[i]);
    const pShifted = TT.runs(pst, A.f0In.hop, v => Number.isFinite(v) && Math.abs(v) > 0.4).filter(x => x.b - x.a > 0.03);
    const moved = i => r.sfmts[0][i] > 0 && (Math.abs(r.sfmts[0][i] - r.fmts[0][i]) > 0.5 || Math.abs(r.sfmts[1][i] - r.fmts[1][i]) > 0.5);
    const fShifted = TT.runs(r.sfmts[0], dt, (v, i) => moved(i));
    let expected = null;
    if (S.when.mode === 'after') expected = [S.when.after, dur];
    if (S.when.mode === 'window') expected = [S.when.after, Math.min(dur, S.when.until)];
    const ost = r.ost_stat, hasOst = !!(r.compiled && r.compiled.ost) || ost.some(v => v > 0);
    const f0med = PG.median(A.f0In.f0), rmsThr = m.rmsThr || PG.S.compile(S).meta.rmsThr;
    return (t._d = { dt, n, m, S, dur, hasPitch, disc, pst, pShifted, fShifted, expected, hasOst, f0med, rmsThr });
  }

  const readAt = (arr, dt, tt) => { const i = Math.round(tt / dt); return i >= 0 && i < arr.length ? arr[i] : NaN; };
  const hz = v => (v > 0 ? Math.round(v) + ' Hz' : '–');

  function waveTier(t) {
    const r = t.result, inp = PG.state.inputs.get(t.inputId).x;
    return { id: 'wave', label: 'Waveform', sub: 'grey heard before, blue after', height: 64, alt: 'Waveform of the input (grey) and the processed output (blue)',
      draw(g, w, hgt, xOf, C, z) {
        const env = (x, style) => {
          const mid = hgt / 2, sc = hgt / 2 - 3;
          g.beginPath();
          const top = [], bot = [];
          for (let px = 0; px < w; px++) {
            const a = Math.max(0, Math.floor((z.t0 + px / w * (z.t1 - z.t0)) * 48000)), b = Math.min(x.length, Math.ceil((z.t0 + (px + 1) / w * (z.t1 - z.t0)) * 48000));
            let mn = 0, mx = 0; for (let i = a; i < b; i++) { if (x[i] < mn) mn = x[i]; if (x[i] > mx) mx = x[i]; }
            top.push(mid - Math.min(1, mx) * sc); bot.push(mid - Math.max(-1, mn) * sc);
          }
          if (style === 'fill') { g.moveTo(0, top[0]); top.forEach((y, i) => g.lineTo(i, y)); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(i, bot[i]); g.closePath(); g.fillStyle = C.input; g.fill(); }
          else { g.strokeStyle = C.obs; g.lineWidth = 1; g.moveTo(0, top[0]); top.forEach((y, i) => g.lineTo(i, y)); g.stroke(); g.beginPath(); g.moveTo(0, bot[0]); bot.forEach((y, i) => g.lineTo(i, y)); g.stroke(); }
        };
        env(inp, 'fill'); env(r.output, 'line');
        const clip = TT.runs(r.output, 1 / 48000, v => Math.abs(v) >= 0.999).map(x => [x.a - 0.002, x.b + 0.002]);
        if (clip.length) TT.bands(g, clip, xOf, hgt, C, 'clipped');
      },
      readout: tt => [{ label: 'input sample', value: (inp[Math.round(tt * 48000)] || 0).toFixed(3), style: 'input' }, { label: 'output sample', value: (r.output[Math.round(tt * 48000)] || 0).toFixed(3), style: 'obs' }] };
  }

  function specTier(t, which, fmax) {
    const r = t.result, A = r.analysis, d = derive(t);
    const isIn = which === 'in';
    const spec = isIn ? A.specIn : A.specOut;
    const series = isIn
      ? [{ y: r.fmts[0], dt: d.dt, style: 'observed' }, { y: r.fmts[1], dt: d.dt, style: 'observed' }]
      : [{ y: r.sfmts[0], dt: d.dt, style: 'target' }, { y: r.sfmts[1], dt: d.dt, style: 'target' },
         { y: A.lpcOut.f[0], dt: A.lpcOut.hop, style: 'obsDots', r: 1.6 }, { y: A.lpcOut.f[1], dt: A.lpcOut.hop, style: 'obsDots', r: 1.6 }];
    return { id: 'spec-' + which, label: isIn ? 'Spoken (input)' : 'Heard (output)', height: 170,
      sub: isIn ? 'signalIn, with Audapter\'s tracked F1/F2' : 'signalOut, with the shifted targets and an independent estimate',
      alt: isIn ? 'Spectrogram of the input with the formants Audapter tracked' : 'Spectrogram of the output with Audapter\'s shifted formant targets (sfmts) and an independent LPC estimate of the output formants',
      key: () => h('div.tl-keys', {}, isIn ? key('obs', 'fmts (logged)') : [key('exp', 'sfmts target'), key('obsdot', 'LPC on output')]),
      draw(g, w, hgt, xOf, C) {
        TT.drawSpec(g, spec, xOf, w, hgt, fmax, C);
        const yOf = v => hgt - v / fmax * hgt;
        TT.gridY(g, w, yOf, [1000, 2000, 3000, 4000].filter(v => v < fmax), C, v => v / 1000 + ' kHz');
        for (const s of series) TT.drawSeries(g, s, xOf, yOf, C, w);
      },
      readout: tt => isIn
        ? [{ label: 'F1 tracked', value: hz(readAt(r.fmts[0], d.dt, tt)), style: 'obs' }, { label: 'F2 tracked', value: hz(readAt(r.fmts[1], d.dt, tt)), style: 'obs' }]
        : [{ label: 'F1 target', value: hz(readAt(r.sfmts[0], d.dt, tt)), style: 'exp' }, { label: 'F2 target', value: hz(readAt(r.sfmts[1], d.dt, tt)), style: 'exp' },
           { label: 'F1 in output (LPC)', value: hz(readAt(A.lpcOut.f[0], A.lpcOut.hop, tt)), style: 'obsdot' }] };
  }

  function pitchTier(t) {
    const r = t.result, A = r.analysis, d = derive(t), tds = d.m.tds;
    const all = [...A.f0In.f0, ...A.f0Out.f0, ...(d.hasPitch ? r.pitchHz : [])].filter(v => v > 0);
    const lo = Math.max(40, Math.min(80, ...(all.length ? [Math.min(...all) * 0.85] : [80]))), hi = Math.min(1200, Math.max(400, ...(all.length ? [Math.max(...all) * 1.15] : [400])));
    return { id: 'pitch', label: 'Pitch', sub: d.hasPitch ? 'log scale' : 'log scale; Audapter logged no pitchHz with these settings', height: 150, alt: 'Pitch: independent estimate of the input (grey) and output (blue dots), Audapter\'s logged pitchHz (blue line)',
      key: () => h('div.tl-keys', {}, key('indot', 'F0 in (YIN)'), key('obsdot', 'F0 out (YIN)'), d.hasPitch ? key('obs', 'pitchHz (logged)') : null, tds ? key('exp', 'shiftedPitchHz') : null),
      draw(g, w, hgt, xOf, C) {
        const yOf = v => hgt - 4 - (Math.log(v / lo) / Math.log(hi / lo)) * (hgt - 8);
        TT.bands(g, d.disc, xOf, hgt, C, d.disc.length ? 'logged pitch is not F0' : null);
        TT.gridY(g, w, yOf, [50, 100, 200, 400, 800].filter(v => v > lo && v < hi), C, v => v + ' Hz');
        TT.drawSeries(g, { y: A.f0In.f0, dt: A.f0In.hop, style: 'inDots', r: 2 }, xOf, yOf, C, w);
        if (d.hasPitch) TT.drawSeries(g, { y: r.pitchHz, dt: d.dt, style: 'observed' }, xOf, yOf, C, w);
        if (tds) TT.drawSeries(g, { y: r.shiftedPitchHz, dt: d.dt, style: 'target' }, xOf, yOf, C, w);
        TT.drawSeries(g, { y: A.f0Out.f0, dt: A.f0Out.hop, style: 'obsDots', r: 2 }, xOf, yOf, C, w);
      },
      readout: tt => {
        const o = [{ label: 'F0 input (YIN)', value: hz(readAt(A.f0In.f0, A.f0In.hop, tt)), style: 'indot' }, { label: 'F0 output (YIN)', value: hz(readAt(A.f0Out.f0, A.f0Out.hop, tt)), style: 'obsdot' }];
        if (d.hasPitch) o.push({ label: 'pitchHz (logged)', value: hz(readAt(r.pitchHz, d.dt, tt)), style: 'obs' });
        if (tds) o.push({ label: 'shiftedPitchHz', value: hz(readAt(r.shiftedPitchHz, d.dt, tt)), style: 'exp' });
        const s = readAt(d.pst, A.f0In.hop, tt); if (Number.isFinite(s)) o.push({ label: 'measured shift', value: PG.fmt.signed(s, 2) + ' st', style: 'none' });
        return o;
      } };
  }

  function levelTier(t) {
    const r = t.result, A = r.analysis, d = derive(t);
    const rmsDb = Float32Array.from(r.rms[0], v => (v > 0 ? 20 * Math.log10(v) : NaN)), thrDb = 20 * Math.log10(d.rmsThr);
    return { id: 'level', label: 'Level', sub: 'dBFS, 20 ms RMS', height: 120, alt: 'Level of input (grey) and output (blue) over time, with Audapter\'s tracking threshold',
      key: () => h('div.tl-keys', {}, key('in', 'input'), key('obs', 'output'), key('ref', 'rmsThresh')),
      draw(g, w, hgt, xOf, C) {
        const lo = -75, hi = 0, yOf = v => hgt - 3 - (v - lo) / (hi - lo) * (hgt - 6), ok = v => Number.isFinite(v) && v > lo - 5;
        TT.gridY(g, w, yOf, [-60, -40, -20], C, v => v + ' dB');
        TT.drawSeries(g, { y: A.levIn.db, dt: A.levIn.hop, style: 'input', ok, lw: 2 }, xOf, yOf, C, w);
        TT.drawSeries(g, { y: A.levOut.db, dt: A.levOut.hop, style: 'observed', ok }, xOf, yOf, C, w);
        // Audapter's own RMS (on its internal 16 kHz signal) against its threshold, as a thin ink trace and a hairline
        TT.drawSeries(g, { y: rmsDb, dt: d.dt, style: 'ref', ok, lw: 1 }, xOf, yOf, C, w);
        const y = Math.round(yOf(thrDb)) + 0.5; g.strokeStyle = C.ink; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
        g.fillStyle = C.ink2; g.font = '11px ' + PG.css('--serif'); g.textBaseline = 'bottom'; g.textBaseline = 'top'; g.fillText('rmsThresh ' + thrDb.toFixed(0) + ' dB; thin ink: Audapter\'s own RMS', 4, y + 2);
      },
      readout: tt => [{ label: 'input level', value: PG.fmt.db(readAt(A.levIn.db, A.levIn.hop, tt)), style: 'in' }, { label: 'output level', value: PG.fmt.db(readAt(A.levOut.db, A.levOut.hop, tt)), style: 'obs' },
        { label: 'Audapter RMS', value: (readAt(r.rms[0], d.dt, tt) || 0).toFixed(4) + ` (thr ${d.rmsThr.toFixed(4)})`, style: 'ref' }] };
  }

  function ostTier(t) {
    const r = t.result, d = derive(t);
    const iv = TT.runs(r.ost_stat, d.dt, () => true, v => String(v)).map(x => ({ ...x, kind: x.label === '0' ? 'ctx' : 'obs' }));
    const perturbed = new Set(d.m.perturbStates || []);
    return { id: 'ost', label: 'OST state', sub: 'ost_stat', height: 30, alt: 'Online status tracking state over time',
      draw(g, w, hgt, xOf, C) { TT.drawIntervals(g, iv, xOf, w, hgt, C); },
      readout: tt => [{ label: 'OST state' + (perturbed.has(readAt(r.ost_stat, d.dt, tt)) ? ' (perturbed in the PCF)' : ''), value: String(readAt(r.ost_stat, d.dt, tt)), style: 'obs' }] };
  }
  function trackedTier(t) {
    const r = t.result, d = derive(t);
    const iv = TT.runs(r.rms[0], d.dt, v => v > d.rmsThr).map(x => ({ ...x, kind: 'obs', label: 'above threshold' }));
    return { id: 'voiced', label: 'Tracked', sub: 'Audapter RMS > rmsThresh', height: 26, alt: 'Frames above the tracking threshold',
      draw(g, w, hgt, xOf, C) { TT.drawIntervals(g, iv, xOf, w, hgt, C); } };
  }
  function shiftTier(t) {
    const d = derive(t), S = d.S, items = [], lanes = [];
    if (d.expected) { items.push({ a: d.expected[0], b: d.expected[1], kind: 'exp', label: 'configured', lane: 0 }); }
    if (S.shift.formant.on) d.fShifted.forEach(x => items.push({ ...x, kind: 'obs', label: 'formants', lane: 1 }));
    if (S.shift.pitch.on || S.shift.timing.on) d.pShifted.forEach(x => items.push({ ...x, kind: 'obs', label: 'pitch (measured)', lane: 2 }));
    const used = new Set(items.map(i => i.lane));
    return { id: 'shift', label: 'Shift on', sub: [used.has(0) ? 'hollow: configured' : '', used.has(1) ? 'formants: sfmts ≠ fmts' : '', used.has(2) ? 'pitch: measured in audio' : ''].filter(Boolean).join('; ') || 'nothing shifted',
      height: Math.max(38, 24 * used.size + 4), alt: 'When the perturbation was configured and when it was applied',
      draw(g, w, hgt, xOf, C) { TT.drawIntervals(g, items, xOf, w, hgt, C); } };
  }

  function tiersFor(t, view) {
    const d = derive(t), out = [waveTier(t)];
    if (view === 'spectro') { out.push(specTier(t, 'in', 5000), specTier(t, 'out', 5000)); if (d.hasOst) out.push(ostTier(t)); out.push(shiftTier(t)); }
    else { out.push(pitchTier(t), levelTier(t), trackedTier(t)); if (d.hasOst) out.push(ostTier(t)); out.push(shiftTier(t)); }
    return out;
  }
  // Numbers behind the view (the accessible text alternative).
  function numbers(t) {
    const r = t.result, A = r.analysis, d = derive(t);
    const ratios = k => { const v = []; for (let i = 0; i < d.n; i++) if (r.fmts[k][i] > 0 && r.sfmts[k][i] > 0) v.push(r.sfmts[k][i] / r.fmts[k][i]); return v.length ? PG.median(v) : NaN; };
    const med = a => PG.median(a);
    const rows = [
      ['Frames with a formant shift (sfmts ≠ fmts)', `${r.sfmts[0].filter((v, i) => v > 0 && (Math.abs(v - r.fmts[0][i]) > 0.5 || Math.abs(r.sfmts[1][i] - r.fmts[1][i]) > 0.5)).length} of ${d.n} (${(d.n / r.frameRate).toFixed(2)} s at ${r.frameRate} frames/s)`],
      ['Median sF1 / F1 and sF2 / F2 (logged)', `${Number.isFinite(ratios(0)) ? ratios(0).toFixed(4) : '–'} and ${Number.isFinite(ratios(1)) ? ratios(1).toFixed(4) : '–'}`],
      ['Median tracked F1, F2 (fmts)', `${hz(med(r.fmts[0]))}, ${hz(med(r.fmts[1]))}`],
      ['Median F1, F2 in the output (independent LPC)', `${hz(med(A.lpcOut.f[0]))}, ${hz(med(A.lpcOut.f[1]))}`],
      ['Median F0 input / output (YIN)', `${hz(med(A.f0In.f0))} / ${hz(med(A.f0Out.f0))}`],
      ['Median pitchHz (logged)', d.hasPitch ? hz(med(r.pitchHz)) : 'not logged (0)'],
      ['Level, active RMS', `input ${PG.fmt.db(20 * Math.log10(A.inRms || 1e-9))} FS, output ${PG.fmt.db(20 * Math.log10(A.outRms || 1e-9))} FS (${PG.fmt.db(20 * Math.log10((A.outRms || 1e-9) / (A.inRms || 1e-9)))})`],
      ['Output peak', `${A.outPeak.toFixed(3)}${A.outPeak >= 0.999 ? ' (clipped)' : ''}; loudest 20 ms block ${PG.fmt.db(A.burstDb)} re active RMS`],
      ['OST states reached', [...new Set(r.ost_stat)].join(', ')],
      ['Processing', `${(r.info.processMs || 0).toFixed(0)} ms in the ${r.info.variant} build${r.info.patches && r.info.patches.length ? ' (' + r.info.patches.join(', ') + ')' : ''}; WASM memory ${PG.fmt.mb(r.info.memoryBytes || 0)}`],
    ];
    return rows;
  }
  return { tiersFor, derive, numbers, key, waveTier, specTier, pitchTier, levelTier, ostTier, shiftTier, trackedTier };
})();


/* ---- vowelspace.js ---- */
'use strict';
// F1-F2 vowel space: Peterson & Barney backdrop, the perturbation field as arrows, and one trial's trajectories:
// input formants (grey), shifted targets (hollow), output formants measured independently (blue). Also the 2-D field painter.
PG.Vowel = (() => {
  const { h } = PG, S = PG.S, NS = 'http://www.w3.org/2000/svg';
  let arrowScale = 1, mode = 'trial', allFrames = false, root, svg, tip, trial = null, paint = false, brush = { d1: 20, d2: 0, radius: 120, erase: false }, liveCells = null, headG = null;
  const M = { l: 58, r: 14, t: 14, b: 44 };
  let W = 600, H = 440, R = { f1: [150, 1150], f2: [3400, 500] };
  const x = f2 => M.l + (R.f2[0] - f2) / (R.f2[0] - R.f2[1]) * (W - M.l - M.r);
  const y = f1 => M.t + (f1 - R.f1[0]) / (R.f1[1] - R.f1[0]) * (H - M.t - M.b);
  const f2Of = px => R.f2[0] - (px - M.l) / (W - M.l - M.r) * (R.f2[0] - R.f2[1]);
  const f1Of = py => R.f1[0] + (py - M.t) / (H - M.t - M.b) * (R.f1[1] - R.f1[0]);
  const el = (tag, a = {}, ...k) => { const e = document.createElementNS(NS, tag); for (const [n, v] of Object.entries(a)) if (v !== null && v !== undefined) e.setAttribute(n, v); for (const c of k) if (c) e.append(c); return e; };

  function mount(container) {
    root = container;
    PG.bus.on('settings', () => { if (root.isConnected && !root.hidden) render(); });
    PG.bus.on('theme', () => root.isConnected && render());
    PG.bus.on('open-painter', () => { paint = true; });
    const rt = () => { if (mode === 'tokens' && root.isConnected && !root.hidden) render(); };
    PG.bus.on('selection', rt); PG.bus.on('trials', rt);
    new ResizeObserver(() => { if (root.isConnected && root.clientWidth && Math.abs(root.clientWidth - W) > 4) render(); }).observe(root);
    requestAnimationFrame(tickHead);
  }
  function setTrial(t) { trial = t; render(); }
  function setPaint(on) { paint = on; render(); }

  // displacement (dF1, dF2) in Hz at (f1, f2) from the settings, or null if no shift there
  function fieldAt(s, f1, f2, uniform) {
    const F = s.shift.formant; if (!F.on) return null;
    if (uniform === undefined) uniform = S.compile(s).meta.needPcf;
    let d1 = F.f1, d2 = F.f2;
    if (!uniform && F.field === 'region') { const r = F.region; if (f1 < r.f1min || f1 > r.f1max || f2 < r.f2min || f2 > r.f2max) return null; }
    if (!uniform && F.field === 'curve') {
      const p = [...F.curve].sort((a, b) => a[0] - b[0]); if (!p.length) return null;
      if (f2 <= p[0][0]) [, d1, d2] = p[0]; else if (f2 >= p[p.length - 1][0]) [, d1, d2] = p[p.length - 1];
      else for (let k = 0; k < p.length - 1; k++) if (f2 >= p[k][0] && f2 <= p[k + 1][0]) { const u = (f2 - p[k][0]) / (p[k + 1][0] - p[k][0]); d1 = p[k][1] + u * (p[k + 1][1] - p[k][1]); d2 = p[k][2] + u * (p[k + 1][2] - p[k][2]); break; }
    }
    if (!uniform && F.field === 'variability') {
      const v = F.vari; if (Math.abs(f1 - v.c1) > v.ext1 || Math.abs(f2 - v.c2) > v.ext2) return null;
      const t = S.variIntended(v, f1, f2); return [t[0] - f1, t[1] - f2];
    }
    if (!uniform && F.field === 'painted') {
      const cells = liveCells || F.painted.cells, res = F.painted.res || 4, ci = Math.floor(f1 / S.FMAX * 256 / res), cj = Math.floor(f2 / S.FMAX * 256 / res);
      const c2 = cells.find(q => q[0] === ci && q[1] === cj); if (!c2) return null; d1 = c2[2]; d2 = c2[3];
    }
    if (!d1 && !d2) return null;
    if (F.units === 'pct') return [f1 * d1 / 100, f2 * d2 / 100];
    if (F.units === 'hz') return [d1, d2];
    const mel2hz = m => 700 * (Math.exp(m / 1127.01048) - 1);
    return [mel2hz(S.hz2mel(f1) + d1) - f1, mel2hz(S.hz2mel(f2) + d2) - f2];
  }

  function render() {
    if (!root) return;
    PG.clear(root);
    const s = PG.state.settings, talker = PG.talkerFor(s.preset), V = PG.VOWELS[talker];
    R = talker === 'children' ? { f1: [200, 1250], f2: [3700, 600] } : talker === 'women' ? { f1: [200, 1150], f2: [3300, 600] } : { f1: [150, 1000], f2: [2800, 500] };
    const TK = mode === 'tokens' ? tokenData(s) : null;
    const r = TK ? null : trial && trial.result;
    if (TK && TK.pts.length) {
      const f1s = TK.pts.flatMap(p => [p.s[0], p.h[0]]), f2s = TK.pts.flatMap(p => [p.s[1], p.h[1]]);
      R.f1 = [Math.max(80, Math.min(...f1s) - 120), Math.max(...f1s) + 120]; R.f2 = [Math.max(...f2s) + 250, Math.max(200, Math.min(...f2s) - 250)];
    }
    if (r) {   // widen to fit the data
      const f1s = [...r.fmts[0], ...r.sfmts[0]].filter(v => v > 0), f2s = [...r.fmts[1], ...r.sfmts[1]].filter(v => v > 0);
      if (f1s.length) { R.f1 = [Math.max(80, Math.min(R.f1[0], quant(f1s, 0.05) * 0.9)), Math.max(R.f1[1], Math.min(1400, quant(f1s, 0.95) * 1.08))]; R.f2 = [Math.max(R.f2[0], Math.min(4200, quant(f2s, 0.95) * 1.05)), Math.min(R.f2[1], quant(f2s, 0.05) * 0.92)]; }
    }
    W = Math.max(300, root.clientWidth || 600); H = Math.round(Math.min(560, Math.max(300, W * 0.66)));
    const modeSeg = h('div.seg', { role: 'radiogroup', 'aria-label': 'Show' }, [['trial', 'One trial'], ['tokens', 'Ticked trials as tokens']].map(([v, t]) =>
      h('button', { type: 'button', role: 'radio', 'aria-checked': String(mode === v), text: t, on: { click: () => { mode = v; render(); } } })));
    const legend = TK ? h('div.legend-row', {}, modeSeg, PG.Views.key('indot', 'spoken (fmts, median per token)'), PG.Views.key('exp', 'heard (sfmts)'), PG.Views.key('obsdot', 'measured in the output (LPC, relative to the input)'),
      PG.Views.key('arrow', 'field'), h('span.muted', { text: 'Ellipses: 1 SD of the tokens.' })) : h('div.legend-row', {}, modeSeg,
      PG.Views.key('in', 'input formants (fmts)'), PG.Views.key('exp', 'shifted targets (sfmts)'), PG.Views.key('obsdot', 'output formants (independent LPC)'),
      PG.Views.key('arrow', 'perturbation field'),
      h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: allFrames, on: { change: e => { allFrames = e.target.checked; render(); } } }), ' all tracked frames (default: the loudest, within 10 dB of the peak)'),
      h('span.muted', { text: `Backdrop: Peterson & Barney (1952) averages for ${talker}. Click a vowel symbol to use it for the synthetic vowel.` }));
    const tools = paintTools(s);
    svg = el('svg', { class: 'vspace', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': 'F1–F2 vowel space' });
    svg.append(el('title', {}, document.createTextNode(r ? `Vowel space for ${trial.name}: input, shifted targets and output formants` : 'Vowel space')));
    tip = h('div.tip'); tip.hidden = true;
    root.append(legend, tools || '', h('div.vs-wrap', {}, svg, tip));
    axes();
    // backdrop
    const bg = el('g', { class: 'vs-bg' });
    V.forEach(([f1, f2], i) => {
      const t = el('text', { x: x(f2), y: y(f1), class: 'vs-ipa', 'text-anchor': 'middle', 'dominant-baseline': 'central', tabindex: 0, role: 'button', 'aria-label': `Use /${PG.VOWELS.list[i][0]}/ for the synthetic vowel` }, document.createTextNode(PG.VOWELS.list[i][0]));
      t.addEventListener('click', () => { if (PG.synthPick) { PG.synthPick(f1, f2); PG.toast(`Synthetic vowel set to /${PG.VOWELS.list[i][0]}/. Make it under Input, Synthetic vowel.`); } });
      bg.append(t);
    });
    svg.append(bg);
    field(s);
    if (s.shift.formant.on && s.shift.formant.field === 'variability') centreMark(s);
    if (r) trajectories(r);
    if (TK) drawTokens(TK);
    headG = el('g', { class: 'vs-head' }); svg.append(headG);
    if (paint && s.shift.formant.field === 'painted') attachPainter(s);
    else hover();
    if (!r && !TK) svg.append(el('text', { x: W / 2, y: H / 2, class: 'vs-empty', 'text-anchor': 'middle' }, document.createTextNode('Run a trial to see its formants here.')));
    if (TK && !TK.pts.length) svg.append(el('text', { x: W / 2, y: H / 2, class: 'vs-empty', 'text-anchor': 'middle' }, document.createTextNode('Tick at least three trials in the list (or make a vowel cloud under Input) to see them as tokens.')));
    if (arrowScale < 0.999) root.insertBefore(h('p.muted.arrow-note', { text: `Field arrows are drawn at ${Math.round(arrowScale * 100)} % of their true length so they do not overlap; directions are exact.` }), root.querySelector('.vs-wrap'));
    if (TK && TK.pts.length) root.append(tokenNumbers(TK));
    if (s.shift.formant.on && s.shift.formant.field === 'variability' && !S.compile(s).meta.needPcf) root.append(stairs(s));
  }
  function centreMark(s) {
    const v = s.shift.formant.vari, g = el('g', { class: 'vs-centre' }), cx = x(v.c2), cy = y(v.c1);
    g.append(el('path', { d: `M${cx - 8},${cy}L${cx + 8},${cy}M${cx},${cy - 8}L${cx},${cy + 8}`, class: 'vs-cross' }));
    g.append(el('text', { x: cx + 10, y: cy - 8, class: 'vs-clab' }, document.createTextNode(`centre ${Math.round(v.c1)}, ${Math.round(v.c2)} Hz`)));
    const r0 = x(v.c2 + v.ext2) , r1 = x(v.c2 - v.ext2);
    g.append(el('rect', { x: Math.min(r0, r1), y: y(v.c1 - v.ext1), width: Math.abs(r1 - r0), height: Math.abs(y(v.c1 + v.ext1) - y(v.c1 - v.ext1)), class: 'vs-region' }));
    svg.append(g);
  }
  // ---- tokens: one point per ticked trial (median over its shifted frames), with 1 SD dispersion ellipses
  function tokenData(s) {
    const T = PG.state.trials.filter(t => PG.state.selected.has(t.id) && t.result);
    const pts = [];
    for (const t of T) {
      const r = t.result, A = r.analysis, lag = ((r.compiled && r.compiled.meta && r.compiled.meta.latencyMs) || 10) / 1000;
      let idx = []; for (let i = 0; i < r.fmts[0].length; i++) if (r.sfmts[0][i] > 0 && r.fmts[0][i] > 0) idx.push(i);
      const shifted = idx.length > 0;
      if (!shifted) for (let i = 0; i < r.fmts[0].length; i++) if (r.fmts[0][i] > 0) idx.push(i);
      if (idx.length < 5) continue;
      const md = a => PG.median(a);
      const sp = [md(idx.map(i => r.fmts[0][i])), md(idx.map(i => r.fmts[1][i]))], he = shifted ? [md(idx.map(i => r.sfmts[0][i])), md(idx.map(i => r.sfmts[1][i]))] : sp.slice();
      const dd = [[], []];
      for (const i of idx) { const tt = i / r.frameRate; for (const j of [0, 1]) { const a = A.lpcIn.f[j][Math.round(tt / A.lpcIn.hop)], b = A.lpcOut.f[j][Math.round((tt + lag) / A.lpcOut.hop)]; if (a > 0 && b > 0) dd[j].push(b - a); } }
      const med2 = a => { const v = a.filter(Number.isFinite).sort((p, q) => p - q); return v.length ? v[v.length >> 1] : NaN; };
      const me = dd[0].length >= 10 && dd[1].length >= 10 ? [sp[0] + med2(dd[0]), sp[1] + med2(dd[1])] : null;
      pts.push({ t, s: sp, h: he, m: me });
    }
    const F = s.shift.formant, vari = F.on && F.field === 'variability';
    const mean = k => { const a = pts.map(p => p[k]).filter(Boolean); return a.length ? [a.reduce((q, p) => q + p[0], 0) / a.length, a.reduce((q, p) => q + p[1], 0) / a.length] : null; };
    const centre = vari ? [F.vari.c1, F.vari.c2] : mean('s');
    return { pts, centre, vari, mean };
  }
  function covEllipse(P) {
    if (P.length < 3) return null;
    const n = P.length, m1 = P.reduce((a, p) => a + p[0], 0) / n, m2 = P.reduce((a, p) => a + p[1], 0) / n;
    let a = 0, b = 0, c = 0; for (const p of P) { a += (p[0] - m1) ** 2; b += (p[0] - m1) * (p[1] - m2); c += (p[1] - m2) ** 2; }
    a /= n - 1; b /= n - 1; c /= n - 1;
    const tr = a + c, det = a * c - b * b, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const th = Math.abs(b) < 1e-12 ? (a >= c ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
    const pts = []; for (let k = 0; k <= 64; k++) { const t = 2 * Math.PI * k / 64, u = Math.sqrt(Math.max(l1, 0)) * Math.cos(t), v = Math.sqrt(Math.max(l2, 0)) * Math.sin(t);
      pts.push([m1 + u * Math.cos(th) - v * Math.sin(th), m2 + u * Math.sin(th) + v * Math.cos(th)]); }
    return { pts, area: Math.PI * Math.sqrt(Math.max(0, det)), m: [m1, m2] };
  }
  function drawTokens(TK) {
    const g = el('g', { class: 'vs-tokens' });
    const ell = (P, cls) => { const e = covEllipse(P); if (e) g.append(el('path', { d: e.pts.map((p, k) => (k ? 'L' : 'M') + x(p[1]).toFixed(1) + ',' + y(p[0]).toFixed(1)).join('') + 'Z', class: cls })); return e; };
    TK.ellS = ell(TK.pts.map(p => p.s), 'vs-ell-s'); TK.ellH = ell(TK.pts.map(p => p.h), 'vs-ell-h');
    const ms = TK.pts.filter(p => p.m).map(p => p.m); TK.ellM = ms.length >= 3 ? ell(ms, 'vs-ell-m') : null;
    pts = [];
    for (const p of TK.pts) {
      g.append(el('line', { x1: x(p.s[1]), y1: y(p.s[0]), x2: x(p.h[1]), y2: y(p.h[0]), class: 'vs-tok-line' }));
      g.append(el('circle', { cx: x(p.s[1]), cy: y(p.s[0]), r: 4.5, class: 'vs-in m' }, el('title', {}, document.createTextNode(`${p.t.name}: spoken F1 ${Math.round(p.s[0])}, F2 ${Math.round(p.s[1])} Hz`))));
      g.append(el('circle', { cx: x(p.h[1]), cy: y(p.h[0]), r: 5, class: 'vs-tgt' }, el('title', {}, document.createTextNode(`${p.t.name}: heard F1 ${Math.round(p.h[0])}, F2 ${Math.round(p.h[1])} Hz`))));
      if (p.m) g.append(el('circle', { cx: x(p.m[1]), cy: y(p.m[0]), r: 2.6, class: 'vs-out' }));
      pts.push({ t: 0, f1: p.s[0], f2: p.s[1], kind: `${p.t.name}, spoken`, px: x(p.s[1]), py: y(p.s[0]) }, { t: 0, f1: p.h[0], f2: p.h[1], kind: `${p.t.name}, heard`, px: x(p.h[1]), py: y(p.h[0]) });
    }
    svg.append(g);
  }
  function tokenNumbers(TK) {
    const c = TK.centre, dist = P => P.reduce((a, p) => a + Math.hypot(p[0] - c[0], p[1] - c[1]), 0) / P.length;
    const S1 = TK.pts.map(p => p.s), Hh = TK.pts.map(p => p.h), Mm = TK.pts.filter(p => p.m).map(p => p.m);
    const dS = dist(S1), dH = dist(Hh), dM = Mm.length ? dist(Mm) : NaN;
    const aS = TK.ellS && TK.ellS.area, aH = TK.ellH && TK.ellH.area;
    const rows = [
      ['Tokens', `${TK.pts.length} ticked trials, one point each (median over its shifted frames)`],
      ['Vowel centre', `${Math.round(c[0])}, ${Math.round(c[1])} Hz ${TK.vari ? '(the field\'s centre)' : '(mean of the spoken tokens)'}`],
      ['Dispersion: mean distance to the centre', `spoken ${dS.toFixed(1)} Hz, heard ${dH.toFixed(1)} Hz${Number.isFinite(dM) ? `, measured ${dM.toFixed(1)} Hz` : ''}`],
      ['Heard / spoken dispersion', `${(dH / dS).toFixed(3)}${Number.isFinite(dM) ? ` (measured in the output: ${(dM / dS).toFixed(3)})` : ''}`],
      ['1 SD ellipse area, heard / spoken', aS && aH ? `${(aH / aS).toFixed(3)} (the square of the dispersion ratio for a uniform scaling)` : '–'],
    ];
    return h('table.plain.tok-num', {}, h('tbody', {}, rows.map(([a, b]) => h('tr', {}, h('th', { text: a }), h('td', { text: b })))));
  }
  // Intended (smooth) vs applied (lower-left cell) shift along F1 through the centre, zoomed to 24 grid steps.
  function stairs(s) {
    const v = s.shift.formant.vari, c = S.compile(s), V = S.variField(v), n = 24;
    const a = v.c1 + v.ext1 * 0.4, stepHz = (v.units === 'mel' ? 700 * (Math.exp((S.hz2mel(a) + V.step1) / 1127.01048) - 1) - a : V.step1), b = a + n * stepHz;
    const Wd = Math.min(560, Math.max(300, (root.clientWidth || 600) - 20)), Hd = 150, ml = 50, mr = 10, mt = 12, mb = 28;
    const N = 400, XS = [], I = [], Ap = [];
    for (let k = 0; k <= N; k++) { const f = a + (b - a) * k / N; XS.push(f); I.push(S.variIntended(v, f, v.c2)[0] - f); const ap = S.apply2D(c.map, f, v.c2); Ap.push(ap ? ap[0] - f : NaN); }
    const all = [...I, ...Ap].filter(Number.isFinite), lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.15 || 1;
    const X = f => ml + (f - a) / (b - a) * (Wd - ml - mr), Y = d => mt + (1 - (d - lo + pad) / (hi - lo + 2 * pad)) * (Hd - mt - mb);
    const g = el('svg', { class: 'vs-stairs', viewBox: `0 0 ${Wd} ${Hd}`, width: Wd, height: Hd, role: 'img', 'aria-label': 'Intended versus applied F1 shift over 24 grid steps' });
    const line = (arr, cls) => { let d = '', pen = false; arr.forEach((v2, k) => { if (!Number.isFinite(v2)) { pen = false; return; } d += (pen ? 'L' : 'M') + X(XS[k]).toFixed(1) + ',' + Y(v2).toFixed(1); pen = true; }); g.append(el('path', { d, class: cls })); };
    for (const t of [lo, hi]) { g.append(el('line', { x1: ml, x2: Wd - mr, y1: Y(t), y2: Y(t), class: 'grid' })); g.append(el('text', { x: ml - 4, y: Y(t) + 4, 'text-anchor': 'end' }, document.createTextNode(`${t.toFixed(1)}`))); }
    line(Ap, 'st-applied'); line(I, 'st-intended');
    g.append(el('text', { x: ml, y: Hd - 8 }, document.createTextNode(`F1 ${Math.round(a)} → ${Math.round(b)} Hz (F2 at the centre)`)));
    g.append(el('text', { x: 4, y: 10 }, document.createTextNode('F1 shift, Hz')));
    return h('figure.stairs', {}, h('figcaption', {}, h('b', { text: 'Stepped, not smooth. ' }), `Zoom on ${n} grid steps (${V.step1.toFixed(1)} ${V.mel ? 'mel' : 'Hz'} each): the intended F1 shift (thin ink) and what Audapter applies (blue steps). Audapter reads the lower-left cell of its 2-D field without interpolating (FMT-F3); each cell holds the shift at its centre.`), g);
  }
  const quant = (a, q) => { const v = [...a].sort((p, q2) => p - q2); return v[Math.min(v.length - 1, Math.floor(q * v.length))]; };

  function axes() {
    const g = el('g', { class: 'vs-axes' });
    for (let f2 = Math.ceil(R.f2[1] / 500) * 500; f2 <= R.f2[0]; f2 += 500) { g.append(el('line', { x1: x(f2), x2: x(f2), y1: M.t, y2: H - M.b, class: 'grid' })); g.append(el('text', { x: x(f2), y: H - M.b + 16, 'text-anchor': 'middle' }, document.createTextNode(f2))); }
    for (let f1 = Math.ceil(R.f1[0] / 200) * 200; f1 <= R.f1[1]; f1 += 200) { g.append(el('line', { x1: M.l, x2: W - M.r, y1: y(f1), y2: y(f1), class: 'grid' })); g.append(el('text', { x: M.l - 6, y: y(f1), 'text-anchor': 'end', 'dominant-baseline': 'central' }, document.createTextNode(f1))); }
    g.append(el('text', { x: (M.l + W - M.r) / 2, y: H - 8, 'text-anchor': 'middle', class: 'ax-lab' }, document.createTextNode('F2 (Hz), front ← → back')));
    g.append(el('text', { x: 14, y: (M.t + H - M.b) / 2, 'text-anchor': 'middle', class: 'ax-lab', transform: `rotate(-90 14 ${(M.t + H - M.b) / 2})` }, document.createTextNode('F1 (Hz), close ↑ ↓ open')));
    svg.append(g);
  }
  function arrow(g, f1, f2, d, cls) {
    const x0 = x(f2), y0 = y(f1), x1 = x(f2 + d[1]), y1 = y(f1 + d[0]), L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 1.5) return;
    const a = Math.atan2(y1 - y0, x1 - x0), hl = Math.min(6, L * 0.4);
    g.append(el('path', { d: `M${x0},${y0}L${x1},${y1}M${x1 - hl * Math.cos(a - 0.45)},${y1 - hl * Math.sin(a - 0.45)}L${x1},${y1}L${x1 - hl * Math.cos(a + 0.45)},${y1 - hl * Math.sin(a + 0.45)}`, class: cls }));
  }
  function field(s) {
    const g = el('g', { class: 'vs-field' });
    const F = s.shift.formant, uniform = S.compile(s).meta.needPcf;
    if (F.field === 'painted' && !uniform) {
      const res = F.painted.res || 4, step = S.FMAX / 256 * res;
      for (const [ci, cj] of liveCells || F.painted.cells) {
        const a1 = ci * step, a2 = cj * step;
        if (a1 > R.f1[1] || a2 > R.f2[0]) continue;
        g.append(el('rect', { x: x(a2 + step), y: y(a1), width: Math.abs(x(a2) - x(a2 + step)), height: Math.abs(y(a1 + step) - y(a1)), class: 'vs-cell' }));
      }
    }
    const nx = Math.max(6, Math.round((W - M.l - M.r) / 60)), ny = Math.max(5, Math.round((H - M.t - M.b) / 55));
    const cand = [];
    for (let i = 0; i <= ny; i++) for (let j = 0; j <= nx; j++) {
      const f1 = R.f1[0] + (i + 0.5) / (ny + 1) * (R.f1[1] - R.f1[0]), f2 = R.f2[1] + (j + 0.5) / (nx + 1) * (R.f2[0] - R.f2[1]);
      const d = fieldAt(s, f1, f2, uniform); if (d) cand.push([f1, f2, d]);
    }
    // Arrows keep their true direction; if the longest would overrun the arrow grid, all are scaled by one factor (stated).
    const cell = Math.min((W - M.l - M.r) / (nx + 1), (H - M.t - M.b) / (ny + 1)) * 0.85;
    const len = ([f1, f2, d]) => Math.hypot(x(f2 + d[1]) - x(f2), y(f1 + d[0]) - y(f1));
    const mx = cand.reduce((m, c) => Math.max(m, len(c)), 0), sc = mx > cell ? cell / mx : 1;
    for (const [f1, f2, d] of cand) arrow(g, f1, f2, [d[0] * sc, d[1] * sc], 'vs-arrow');
    arrowScale = sc;
    svg.append(g);
  }
  let pts = [];
  function trajectories(r) {
    const A = r.analysis, dt = 1 / r.frameRate, g = el('g', { class: 'vs-traj' });
    pts = [];
    const dec = (n, max) => Math.max(1, Math.ceil(n / max));
    // By default only the loud (vowel-like) frames: Audapter RMS within 10 dB of its maximum.
    let mx = 0; for (const v of r.rms[0]) if (v > mx) mx = v;
    const strong = t => { if (allFrames) return true; const k = Math.round(t * r.frameRate); return k >= 0 && k < r.rms[0].length && r.rms[0][k] >= 0.316 * mx; };
    const addSet = (f1a, f2a, hop, cls, radius, kind, line) => {
      const st = dec(f1a.length, line ? 700 : 260);
      let d = '', prev = -1;
      for (let i = 0; i < f1a.length; i += st) {
        const a = f1a[i], b = f2a[i]; if (!(a > 0 && b > 0) || !strong(i * hop) || a < R.f1[0] || a > R.f1[1] || b > R.f2[0] || b < R.f2[1]) continue;
        if (line) { d += (prev === i - st ? 'L' : 'M') + x(b).toFixed(1) + ',' + y(a).toFixed(1); prev = i; }
        g.append(el('circle', { cx: x(b), cy: y(a), r: radius, class: cls }));
        pts.push({ t: i * hop, f1: a, f2: b, kind, px: x(b), py: y(a) });
      }
      if (d) g.insertBefore(el('path', { d, class: 'vs-line' }), g.firstChild);
    };
    addSet(r.fmts[0], r.fmts[1], dt, 'vs-in', 1.6, 'input (tracked)', true);
    addSet(A.lpcOut.f[0], A.lpcOut.f[1], A.lpcOut.hop, 'vs-out', 2, 'output (LPC)');
    addSet(r.sfmts[0], r.sfmts[1], dt, 'vs-tgt', 3, 'target');
    svg.append(g);
    // medians
    const med = (a, b) => { const k = []; for (let i = 0; i < a.length; i++) if (a[i] > 0 && b[i] > 0) k.push(i); return k.length ? [PG.median(k.map(i => a[i])), PG.median(k.map(i => b[i]))] : null; };
    const mi = med(r.fmts[0], r.fmts[1]), mt = med(r.sfmts[0], r.sfmts[1]), mo = med(A.lpcOut.f[0], A.lpcOut.f[1]);
    const gm = el('g', { class: 'vs-means' });
    if (mi && mt) arrow(gm, mi[0], mi[1], [mt[0] - mi[0], mt[1] - mi[1]], 'vs-mean-arrow');
    if (mi) gm.append(el('circle', { cx: x(mi[1]), cy: y(mi[0]), r: 7, class: 'vs-in m' }, el('title', {}, document.createTextNode(`input median F1 ${Math.round(mi[0])}, F2 ${Math.round(mi[1])} Hz`))));
    if (mt) gm.append(el('circle', { cx: x(mt[1]), cy: y(mt[0]), r: 7, class: 'vs-tgt m' }, el('title', {}, document.createTextNode(`target median F1 ${Math.round(mt[0])}, F2 ${Math.round(mt[1])} Hz`))));
    if (mo) gm.append(el('circle', { cx: x(mo[1]), cy: y(mo[0]), r: 7, class: 'vs-out m' }, el('title', {}, document.createTextNode(`output median F1 ${Math.round(mo[0])}, F2 ${Math.round(mo[1])} Hz (independent LPC)`))));
    svg.append(gm);
  }
  function hover() {
    svg.addEventListener('pointermove', e => {
      const b = svg.getBoundingClientRect(), px = (e.clientX - b.left) * W / b.width, py = (e.clientY - b.top) * H / b.height;
      let best = null, bd = 24 * 24;
      for (const p of pts) { const d = (p.px - px) ** 2 + (p.py - py) ** 2; if (d < bd) { bd = d; best = p; } }
      if (!best) { tip.hidden = true; return; }
      PG.clear(tip); tip.append(h('div.tip-t', { text: `${best.t.toFixed(3)} s, ${best.kind}` }), h('div', { text: `F1 ${Math.round(best.f1)} Hz, F2 ${Math.round(best.f2)} Hz` }));
      tip.hidden = false; tip.style.left = Math.min(b.width - 180, e.clientX - b.left + 12) + 'px'; tip.style.top = (e.clientY - b.top + 8) + 'px';
      svg.dataset.hoverT = best.t;
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; });
    svg.addEventListener('click', () => { if (svg.dataset.hoverT) PG.Tiers.setCursor(+svg.dataset.hoverT); });
  }
  // moving marker at the playhead (or cursor) time
  function tickHead() {
    requestAnimationFrame(tickHead);
    if (!headG || !trial || !trial.result || !svg || !svg.isConnected) return;
    const p = PG.Audio.position(), t = p ? p.t : PG.Tiers.cursor();
    PG.clear(headG);
    if (t === null || t === undefined) return;
    const r = trial.result, i = Math.round(t * r.frameRate);
    if (i < 0 || i >= r.fmts[0].length) return;
    const a = r.fmts[0][i], b = r.fmts[1][i], c = r.sfmts[0][i], d = r.sfmts[1][i];
    if (a > 0 && b > 0) headG.append(el('circle', { cx: x(b), cy: y(a), r: 9, class: 'vs-headring' }));
    if (c > 0 && d > 0) headG.append(el('circle', { cx: x(d), cy: y(c), r: 9, class: 'vs-headring' }));
  }

  function paintTools(s) {
    const F = s.shift.formant;
    if (F.field !== 'painted') return null;
    const u = F.units === 'pct' ? '%' : F.units;
    const num = (k, lab, step) => h('label.syn', {}, h('span', { text: lab }), h('input.num', { type: 'number', step, value: brush[k], on: { change: e => { brush[k] = +e.target.value; } } }), h('span.unit', { text: k === 'radius' ? 'Hz' : u }));
    return h('div.paint-tools', {},
      h('button.btn' + (paint ? '.primary' : ''), { type: 'button', text: paint ? 'Painting: drag on the map' : 'Paint the field', 'aria-pressed': String(paint), on: { click: () => setPaint(!paint) } }),
      num('d1', 'F1 shift', 1), num('d2', 'F2 shift', 1), num('radius', 'Brush radius', 10),
      h('label.syn', {}, h('input', { type: 'checkbox', checked: brush.erase, on: { change: e => { brush.erase = e.target.checked; } } }), h('span', { text: 'Erase' })),
      h('span.muted', { text: `${F.painted.cells.length} cells of ${Math.round(S.FMAX / 256 * (F.painted.res || 4))} Hz. Audapter reads the lower-left 19.5 Hz cell, without interpolation.` }));
  }
  function attachPainter(s) {
    const res = s.shift.formant.painted.res || 4, step = S.FMAX / 256 * res;
    liveCells = s.shift.formant.painted.cells.map(c => [...c]);
    svg.classList.add('painting');
    let down = false;
    const at = e => { const b = svg.getBoundingClientRect(); return [f1Of((e.clientY - b.top) * H / b.height), f2Of((e.clientX - b.left) * W / b.width)]; };
    const apply = e => {
      const [f1, f2] = at(e), rr = brush.radius;
      for (let ci = Math.floor((f1 - rr) / step); ci <= Math.ceil((f1 + rr) / step); ci++) for (let cj = Math.floor((f2 - 2 * rr) / step); cj <= Math.ceil((f2 + 2 * rr) / step); cj++) {
        if (ci < 0 || cj < 0 || ci > 256 / res || cj > 256 / res) continue;
        const c1 = (ci + 0.5) * step, c2 = (cj + 0.5) * step;
        if (Math.hypot(c1 - f1, (c2 - f2) / 2) > rr) continue;
        const k = liveCells.findIndex(q => q[0] === ci && q[1] === cj);
        if (brush.erase) { if (k >= 0) liveCells.splice(k, 1); }
        else if (k >= 0) liveCells[k] = [ci, cj, brush.d1, brush.d2]; else liveCells.push([ci, cj, brush.d1, brush.d2]);
      }
      const old = PG.$('.vs-field', svg); if (old) old.remove();
      field(PG.S.normalize({ ...PG.state.settings, shift: { ...PG.state.settings.shift, formant: { ...PG.state.settings.shift.formant, painted: { res, cells: liveCells } } } }));
      const f = PG.$('.vs-field', svg); svg.insertBefore(f, PG.$('.vs-traj', svg) || headG);
    };
    svg.addEventListener('pointerdown', e => { down = true; svg.setPointerCapture(e.pointerId); apply(e); });
    svg.addEventListener('pointermove', e => { if (down) apply(e); });
    svg.addEventListener('pointerup', () => { if (!down) return; down = false; const cells = liveCells; liveCells = null; PG.editSettings(x2 => { x2.shift.formant.painted.cells = cells; }, 'paint'); });
  }
  return { mount, setTrial, render, setPaint, fieldAt, setMode: m => { mode = m; }, tokenData };
})();


/* ---- compare.js ---- */
'use strict';
// Compare: small multiples of several trials on shared axes, the settings that differ, A/B listening,
// and a session timeline that lays trials end to end (never as rows that look simultaneous).
PG.Compare = (() => {
  const { h, S } = PG;
  let root, metric = 'formants', layout = 'grid', stacks = [];

  function mount(el) { root = el; }
  function trials() {
    const sel = PG.state.trials.filter(t => PG.state.selected.has(t.id) && t.result);
    if (sel.length >= 2) return sel;
    return PG.state.trials.filter(t => t.result).slice(-4);
  }
  const labelFor = path => {
    const c = PG.controlByPath(path);
    if (c && c.label) { const un = c.range ? (typeof c.range === 'function' ? c.range(PG.state.settings) : c.range)[3] : ''; return { label: c.label, unit: un || '' }; }
    return { label: path.replace(/^shift\./, '').replace(/\./g, ' '), unit: '' };
  };
  const show = v => (v === true ? 'on' : v === false ? 'off' : v === undefined || v === '' ? '–' : String(v));

  function render() {
    if (!root) return;
    for (const s of stacks) s.destroy(); stacks = [];
    PG.clear(root);
    const T = trials();
    const selNote = PG.state.selected.size >= 2 ? `${T.length} ticked trials` : `the ${T.length} most recent trials (tick trials in the list to choose)`;
    const seg = (opts, cur, set, lab) => h('div.seg', { role: 'radiogroup', 'aria-label': lab }, opts.map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === cur), text: t, on: { click: () => { set(v); render(); } } })));
    root.append(h('div.cmp-head', {},
      h('p.muted', { text: `Comparing ${selNote}.` }),
      seg([['grid', 'Side by side'], ['timeline', 'Session timeline']], layout, v => { layout = v; }, 'Layout'),
      layout === 'grid' ? seg([['formants', 'Formants'], ['pitch', 'Pitch'], ['level', 'Level'], ['ost', 'OST state']], metric, v => { metric = v; }, 'Show') : null));
    if (T.length < 2) { root.append(h('p.empty', { text: 'Run at least two trials to compare them. Try "Sweep" next to any setting: it runs several values at once.' })); return; }
    root.append(abPanel(T), diffTable(T));
    if (layout === 'timeline') timeline(T); else grid(T);
  }

  function abPanel(T) {
    const opts = [];
    for (const t of T) { opts.push([`${t.id}:out`, `${t.name}, processed`]); opts.push([`${t.id}:in`, `${t.name}, original`]); }
    const a = h('select', { 'aria-label': 'A' }, opts.map(([v, l], i) => h('option', { value: v, text: l, selected: i === 0 })));
    const b = h('select', { 'aria-label': 'B' }, opts.map(([v, l], i) => h('option', { value: v, text: l, selected: i === 2 })));
    const get = v => { const [id, k] = v.split(':'), t = PG.trial(id); return { x: k === 'in' ? PG.state.inputs.get(t.inputId).x : t.result.output, trial: t, kind: k }; };
    return h('div.ab', {}, h('span.ab-lab', { text: 'Listen' }), h('label', {}, 'A ', a), h('label', {}, 'B ', b),
      h('button.btn.primary', { type: 'button', text: 'Play A/B', on: { click: () => PG.Transport.playPair(get(a.value), get(b.value)) } }),
      h('span.muted', { text: 'While it plays, press X (or the switch button) to swap between A and B without a gap.' }));
  }

  function diffTable(T) {
    const base = T[0], rows = new Map();
    for (const t of T.slice(1)) for (const d of S.diff(base.settings, t.settings)) rows.set(d.path, true);
    const paths = [...rows.keys()];
    const inputsDiffer = new Set(T.map(t => t.inputId)).size > 1, buildsDiffer = new Set(T.map(t => t.variant)).size > 1;
    const flat = T.map(t => S.flatten(S.effective(t.settings)));
    const tb = h('tbody');
    if (inputsDiffer) tb.append(h('tr', {}, h('th', { text: 'Input' }), T.map(t => h('td', { text: (PG.state.inputs.get(t.inputId) || {}).label || '–' }))));
    for (const p of paths) { const { label, unit } = labelFor(p); tb.append(h('tr', {}, h('th', {}, label, unit ? h('span.muted', { text: ` (${unit})` }) : null), flat.map(f => h('td', { text: show(f[p]) })))); }
    if (!paths.length && !inputsDiffer) tb.append(h('tr', {}, h('td', { colSpan: T.length + 1, text: buildsDiffer ? 'Same settings; different Audapter builds.' : 'These trials have identical settings.' })));
    return h('details.diff', { open: true }, h('summary', { text: `Settings that differ (${paths.length + (inputsDiffer ? 1 : 0)})` }),
      h('div.tscroll', {}, h('table.plain.diff-t', {}, h('thead', {}, h('tr', {}, h('th', { text: '' }), T.map(t => h('th', { text: t.name })))), tb)));
  }

  function tierFor(t, fmaxOrNull) {
    const V = PG.Views;
    if (metric === 'pitch') return V.pitchTier(t);
    if (metric === 'level') return V.levelTier(t);
    if (metric === 'ost') { const d = V.derive(t); return d.hasOst ? V.ostTier(t) : V.shiftTier(t); }
    const tr = V.specTier(t, 'out', 4000); tr.height = 130; return tr;
  }
  function grid(T) {
    const dur = Math.max(...T.map(t => t.inputLen / 48000));
    PG.Tiers.setDuration(dur, true);
    const g = h('div.smult');
    root.append(g);
    const base = T[0];
    for (const t of T) {
      const diffs = t === base ? [] : S.diff(base.settings, t.settings).map(d => `${labelFor(d.path).label} ${show(d.b)}`);
      const cell = h('figure.sm', {}, h('figcaption', {}, h('b', { text: t.name }), h('span.muted', { text: ' ' + (t === base || (t.tags || []).includes('sweep') ? t.summary : (diffs.join(', ') || t.summary)) })));
      g.append(cell);
      const tr = tierFor(t); tr.label = ''; tr.height = Math.min(tr.height, 130);
      stacks.push(PG.Tiers.Stack(cell, { tiers: [tr], compact: true, axis: true }));
      cell.addEventListener('dblclick', () => PG.bus.emit('show-trial', t.id));
    }
    root.append(h('p.muted', { text: 'Panels share one time axis and one scale. Double-click a panel to open that trial.' }));
  }

  // Trials end to end on one time axis. For a same-session sequence this is what Audapter experienced in order.
  function timeline(T) {
    const offs = [], sr = 48000; let o = 0;
    for (const t of T) { offs.push(o); o += t.inputLen / sr; }
    const seqIds = new Set(T.map(t => t.seq && t.seq.id)), oneSeq = seqIds.size === 1 && !seqIds.has(undefined) && !seqIds.has(null);
    root.append(h('p.timeline-note', { text: oneSeq ? 'These trials ran in order in one Audapter session: anything that carries over (OST state, PCF, playback position) carries over here.'
      : 'These trials ran independently (a fresh Audapter for each). They are placed end to end for reading, not because they ran together.' }));
    PG.Tiers.setDuration(o, false);
    const C = PG.Tiers;
    const trialTier = { label: 'Trial', sub: oneSeq ? 'one session' : 'independent runs', height: 28,
      draw(g, w, hgt, xOf, Cc) { C.drawIntervals(g, T.map((t, i) => ({ a: offs[i], b: offs[i] + t.inputLen / sr, label: t.name, kind: i % 2 ? 'ctx' : 'exp' })), xOf, w, hgt, Cc); } };
    const concat = (get, dtOf) => ({ get, dtOf });
    const ostTier = { label: 'OST state', sub: 'ost_stat', height: 30,
      draw(g, w, hgt, xOf, Cc) {
        const items = [];
        T.forEach((t, i) => { const r = t.result; for (const x of C.runs(r.ost_stat, 1 / r.frameRate, () => true, v => String(v))) items.push({ a: x.a + offs[i], b: x.b + offs[i], label: x.label, kind: x.label === '0' ? 'ctx' : 'obs' }); });
        C.drawIntervals(g, items, xOf, w, hgt, Cc);
      } };
    const shiftTier = { label: 'Formant shift on', sub: 'sfmts ≠ fmts', height: 26,
      draw(g, w, hgt, xOf, Cc) {
        const items = [];
        T.forEach((t, i) => { const r = t.result; for (const x of C.runs(r.sfmts[0], 1 / r.frameRate, (v, k) => v > 0 && (Math.abs(v - r.fmts[0][k]) > 0.5 || Math.abs(r.sfmts[1][k] - r.fmts[1][k]) > 0.5))) items.push({ a: x.a + offs[i], b: x.b + offs[i], kind: 'obs', label: 'shifted' }); });
        C.drawIntervals(g, items, xOf, w, hgt, Cc);
      } };
    const levelTier = { label: 'Level', sub: 'input grey, output blue', height: 90,
      draw(g, w, hgt, xOf, Cc) {
        const lo = -75, yOf = v => hgt - 3 - (v - lo) / -lo * (hgt - 6), ok = v => Number.isFinite(v) && v > lo - 5;
        C.gridY(g, w, yOf, [-60, -40, -20], Cc, v => v + ' dB');
        T.forEach((t, i) => { const A = t.result.analysis;
          C.drawSeries(g, { y: A.levIn.db, dt: A.levIn.hop, tOff: offs[i], style: 'input', ok, lw: 2 }, xOf, yOf, Cc, w);
          C.drawSeries(g, { y: A.levOut.db, dt: A.levOut.hop, tOff: offs[i], style: 'observed', ok }, xOf, yOf, Cc, w); });
        g.strokeStyle = Cc.ink; g.lineWidth = 1; for (const x0 of offs.slice(1)) { const x = Math.round(xOf(x0)) + 0.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hgt); g.stroke(); }
      } };
    const f1Tier = { label: 'F1', sub: 'tracked blue, target hollow', height: 110,
      draw(g, w, hgt, xOf, Cc) {
        const all = T.flatMap(t => [...t.result.fmts[0], ...t.result.sfmts[0]].filter(v => v > 0)), hi = Math.max(1000, ...all.slice(0, 20000)) * 1.05, lo = 100;
        const yOf = v => hgt - 3 - (v - lo) / (hi - lo) * (hgt - 6);
        C.gridY(g, w, yOf, [300, 600, 900].filter(v => v < hi), Cc, v => v + ' Hz');
        T.forEach((t, i) => { const r = t.result;
          C.drawSeries(g, { y: r.sfmts[0], dt: 1 / r.frameRate, tOff: offs[i], style: 'target' }, xOf, yOf, Cc, w);
          C.drawSeries(g, { y: r.fmts[0], dt: 1 / r.frameRate, tOff: offs[i], style: 'observed' }, xOf, yOf, Cc, w); });
        g.strokeStyle = Cc.ink; g.lineWidth = 1; for (const x0 of offs.slice(1)) { const x = Math.round(xOf(x0)) + 0.5; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hgt); g.stroke(); }
      } };
    const tiers = [trialTier, ostTier, shiftTier, f1Tier, levelTier];
    const holder = h('div'); root.append(holder);
    stacks.push(PG.Tiers.Stack(holder, { tiers }));
  }
  return { mount, render, setLayout: l => { layout = l; } };
})();


/* ---- trials-ui.js ---- */
'use strict';
// Trial list: every run, newest first by default; sort by a setting, filter, tick for compare / session runs,
// keep or discard drafts, rename, tag and annotate.
PG.TrialsUI = (() => {
  const { h, S } = PG;
  let root, listEl, filter = '', sortKey = 'new';

  function mount(el) {
    root = el;
    PG.bus.on('trials', render); PG.bus.on('current', render);
    render();
  }
  const sortable = () => [['new', 'Newest first'], ['old', 'Oldest first'], ['name', 'Name'],
    ...PG.allControls().filter(c => c.kind === 'range' || c.kind === 'number' || c.kind === 'select' || c.kind === 'seg').map(c => ['p:' + c.path, `${c.card ? c.card.title + ': ' : ''}${c.label}`])];
  const valueOf = (t, path) => { const c = PG.controlByPath(path); const s = S.normalize(t.settings); return c ? PG.controlValue(s, c) : S.getPath(s, path); };

  function render() {
    if (!root) return;
    PG.clear(root);
    const all = PG.state.trials;
    const head = h('div.tl-head', {},
      h('h2.grp-title', {}, 'Trials ', h('span.count', { text: String(all.length) })),
      h('input.filter', { type: 'search', placeholder: 'Filter by name, setting or tag', value: filter, 'aria-label': 'Filter trials',
        on: { input: e => { filter = e.target.value; renderList(); } } }),
      h('select', { 'aria-label': 'Sort trials', on: { change: e => { sortKey = e.target.value; renderList(); } } }, sortable().map(([v, l]) => h('option', { value: v, text: 'Sort: ' + l, selected: v === sortKey }))));
    const n = PG.state.selected.size;
    const actions = h('div.tl-actions', {},
      h('button.btn', { type: 'button', text: n >= 2 ? `Compare ${n}` : 'Compare', disabled: all.length < 2, on: { click: () => PG.bus.emit('view', 'compare') } }),
      h('button.btn', { type: 'button', text: 'Run ticked as one session', disabled: n < 2, title: 'Run the ticked trials in order in ONE Audapter instance, so state carries over between them',
        on: { click: () => PG.bus.emit('run-sequence', [...PG.state.selected]) } }),
      h('button.linkish', { type: 'button', text: n ? 'Untick all' : 'Tick all', on: { click: () => { if (n) PG.state.selected.clear(); else all.forEach(t => PG.state.selected.add(t.id)); render(); PG.bus.emit('selection'); } } }),
      h('button.linkish', { type: 'button', text: 'Delete ticked', disabled: !n, on: { click: () => { for (const id of [...PG.state.selected]) remove(id); PG.state.selected.clear(); PG.bus.emit('trials'); } } }));
    listEl = h('ol.tl-list', { 'aria-label': 'Trials' });
    const fileIn = h('input', { type: 'file', accept: '.zip', hidden: true, on: { change: async e => { const f = e.target.files[0]; if (f) PG.bus.emit('import-session', new Uint8Array(await f.arrayBuffer())); e.target.value = ''; } } });
    const io = h('div.tl-io', {},
      h('button.linkish', { type: 'button', text: 'Export session (zip)', disabled: !all.some(t => t.result), on: { click: () => PG.bus.emit('export-session') } }),
      h('button.linkish', { type: 'button', text: 'Import session', on: { click: () => fileIn.click() } }), fileIn,
      h('span.muted', { text: 'Kept trials are saved in this browser.' }));
    root.append(head, actions, listEl, editor(), io);
    renderList();
  }

  function renderList() {
    PG.clear(listEl);
    let T = [...PG.state.trials];
    const q = filter.trim().toLowerCase();
    if (q) T = T.filter(t => [t.name, t.summary, (t.tags || []).join(' '), t.notes, (PG.state.inputs.get(t.inputId) || {}).label].join(' ').toLowerCase().includes(q));
    const sk = sortKey.startsWith('p:') ? sortKey.slice(2) : null;
    if (sortKey === 'new') T.reverse();
    else if (sortKey === 'name') T.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    else if (sk) T.sort((a, b) => { const va = valueOf(a, sk), vb = valueOf(b, sk); return (typeof va === 'number' && typeof vb === 'number') ? va - vb : String(va).localeCompare(String(vb)); });
    if (!T.length) { listEl.append(h('li.empty', { text: PG.state.trials.length ? 'No trial matches the filter.' : 'No trials yet. Choose an input: the current settings run automatically.' })); return; }
    for (const t of T) {
      const cur = t.id === PG.state.currentId;
      const cb = h('input', { type: 'checkbox', checked: PG.state.selected.has(t.id), 'aria-label': `Tick ${t.name}`,
        on: { change: e => { if (e.target.checked) PG.state.selected.add(t.id); else PG.state.selected.delete(t.id); render(); PG.bus.emit('selection'); } } });
      const inp = PG.state.inputs.get(t.inputId);
      const badges = [];
      if (!t.kept) badges.push(h('span.badge.draft', { text: 'draft' }));
      if (t.error) badges.push(h('span.badge.err', { text: t.hang ? 'hung' : 'failed' }));
      if (t.seq) badges.push(h('span.badge', { text: `session ${t.seq.n}, #${t.seq.index + 1}` }));
      if (t.variant && t.variant !== 'lite') badges.push(h('span.badge', { text: t.variant }));
      if (sk) badges.push(h('span.badge.val', { text: `${String(valueOf(t, sk))}` }));
      listEl.append(h('li.tl-item' + (cur ? '.current' : ''), { 'aria-current': cur ? 'true' : null }, cb,
        h('button.tl-open', { type: 'button', on: { click: () => PG.bus.emit('show-trial', t.id) } },
          h('span.tl-name', { text: t.name }), badges,
          h('span.tl-sum', { text: t.summary }),
          h('span.tl-inp', { text: inp ? inp.label : '' })),
        !t.kept ? h('button.linkish.keep', { type: 'button', text: 'Keep', on: { click: () => keep(t) } }) : null));
    }
  }

  function editor() {
    const t = PG.current();
    if (!t) return h('div');
    const name = h('input', { type: 'text', value: t.name, 'aria-label': 'Trial name', on: { change: e => { t.name = e.target.value || t.name; save(t); render(); } } });
    const tags = h('input', { type: 'text', value: (t.tags || []).join(', '), placeholder: 'tags, comma separated', 'aria-label': 'Tags', on: { change: e => { t.tags = e.target.value.split(',').map(x => x.trim()).filter(Boolean); save(t); render(); } } });
    const notes = h('textarea', { rows: 2, placeholder: 'Notes', 'aria-label': 'Notes', text: t.notes || '', on: { change: e => { t.notes = e.target.value; save(t); } } });
    return h('details.tl-edit', { open: false }, h('summary', { text: `This trial: ${t.name}` }),
      h('div.tl-edit-grid', {}, name, tags, notes),
      h('div.btnrow', {},
        h('button.btn', { type: 'button', text: 'Use these settings', title: 'Load this trial\'s settings into the controls', on: { click: () => { PG.setSettings(S.clone(t.settings), 'load'); PG.toast(`Settings of ${t.name} loaded.`); } } }),
        h('button.btn', { type: 'button', text: 'Use this input', on: { click: () => { const i = PG.state.inputs.get(t.inputId); if (i) { PG.state.input = i; PG.bus.emit('input', i); } } } }),
        !t.kept ? h('button.btn', { type: 'button', text: 'Keep', on: { click: () => keep(t) } }) : null,
        h('button.linkish', { type: 'button', text: 'Delete', on: { click: () => { remove(t.id); PG.bus.emit('trials'); } } })));
  }
  function keep(t) { t.kept = true; save(t); PG.bus.emit('trials'); }
  function save(t) { if (t.kept) PG.Store.saveTrial(t); }
  function remove(id) {
    const i = PG.state.trials.findIndex(t => t.id === id); if (i < 0) return;
    PG.state.trials.splice(i, 1); PG.state.selected.delete(id); PG.Store.deleteTrial(id);
    if (PG.state.currentId === id) { const last = PG.state.trials[PG.state.trials.length - 1]; PG.state.currentId = last ? last.id : null; PG.bus.emit('current'); }
  }
  return { mount, render, keep, remove };
})();


/* ---- params-ui.js ---- */
'use strict';
// Parameters tab: every Audapter parameter from the C++ table (name, type, help text) with validated overrides,
// and the OST/PCF editor (state diagram, rule list with plain-language descriptions, PCF table, text import/export).
PG.ParamsUI = (() => {
  const { h, S } = PG;
  const CPP = 'https://github.com/blab-lab/audapter_mex/blob/169cadffef4c2d82a33939b840245b8a8a9db0de/TransShiftMex/Audapter.cpp#L';
  let root, q = '', onlyChanged = false, tableBody;

  const LEN = { pertf1: 257, pertf2: 257, pertamp: 257, pertphi: 257, pertamp2d: 66049, pertphi2d: 66049, clampf1: 2048, clampf2: 2048, rmsff_fb: 4 };
  const NOTE = {
    bpvocmpnorm: 'Registered under this misspelling but checked as "bpvocampnorm", so phase-vocoder level normalisation cannot be switched on (PT-5).',
    minvowellen: 'Has no effect in blab (the dropout fix removed its only use; F6), and cannot be changed in upstream either (REPORT-9).',
    pvocwarp: 'Set through the PCF time-warp lines instead.',
    datapb: 'Generated from the noise settings under "What the participant hears". At most 480 000 samples (10 s at 48 kHz).',
    clampf1: 'Audapter copies 2048 values whatever length is passed (FMT-F1).', clampf2: 'Audapter copies 2048 values whatever length is passed (FMT-F1).',
    pertf1: 'Audapter reads 257 values whatever length is passed (I-08).', pertamp: 'Audapter reads 257 values whatever length is passed (I-08).',
    tsgntones: 'The range check tests the old value, so 100 is accepted and overwrites neighbouring parameters (I-14).',
    rmsclipthresh: 'The RMS clip zeroes the wrong buffer slot, so it does not protect (PT-2).', brmsclip: 'The RMS clip zeroes the wrong buffer slot, so it does not protect (PT-2).',
  };
  const PLAIN = Object.fromEntries(PG.allControls().filter(c => c.param).map(c => [c.param, c.desc]));

  function parseVal(p, text) {
    const t = String(text).trim();
    if (t === '') return { v: undefined };
    let v;
    try { v = t.startsWith('[') ? JSON.parse(t) : t.includes(',') || /\s/.test(t) ? t.split(/[\s,]+/).filter(Boolean).map(Number) : Number(t); }
    catch { return { err: 'Not a number or a JSON array.' }; }
    const arr = Array.isArray(v) ? v : [v];
    if (arr.some(x => typeof x !== 'number' || !Number.isFinite(x))) return { err: 'Every value must be a finite number.' };
    const n = p.name;
    if (p.type === 'bool' && (arr.length !== 1 || (arr[0] !== 0 && arr[0] !== 1))) return { err: 'A switch takes 0 or 1.' };
    if ((p.type === 'int' || p.type === 'enum') && (arr.length !== 1 || !Number.isInteger(arr[0]))) return { err: 'Takes one whole number.' };
    if (p.type === 'double' && arr.length !== 1) return { err: 'Takes one number.' };
    if (LEN[n] && arr.length !== LEN[n]) return { err: `Needs exactly ${LEN[n]} values (got ${arr.length}). Audapter ignores the length you pass and reads ${LEN[n]}, past the end of a shorter array.` };
    if (n === 'delayframes' && (arr.length < 1 || arr.length > 4)) return { err: 'One value per voice, 1 to 4 values.' };
    if (n === 'datapb' && arr.length > 480000) return { err: 'At most 480 000 samples.' };
    if (n === 'timedomainpitchshiftschedule' && arr.length > 1) {
      if (arr.length % 2) return { err: 'Pairs of (time, ratio), or a single ratio.' };
      if (arr[0] !== 0) return { err: 'The first time must be 0.' };
      for (let i = 2; i < arr.length; i += 2) if (!(arr[i] > arr[i - 2])) return { err: 'Times must increase.' };
      for (let i = 1; i < arr.length; i += 2) if (!(arr[i] > 0)) return { err: 'Ratios must be positive.' };
    }
    if (n === 'timedomainpitchshiftalgorithm' && ![0, 1, 2].includes(arr[0])) return { err: '0, 1 or 2.' };
    if ((n === 'triallen' || n === 'ramplen') && arr[0] < 0) return { err: 'Audapter rejects negative values.' };
    if (n === 'fb' && !(arr[0] >= 0 && arr[0] <= 5)) return { err: 'Feedback modes are 0 to 5.' };
    return { v: arr.length === 1 && !/\[\]$/.test(p.type) && !LEN[n] ? arr[0] : arr };
  }
  const show = v => {
    if (v === undefined || v === null) return '–';
    if (!Array.isArray(v)) return String(+Number(v).toPrecision(8));
    if (v.length <= 8) return '[' + v.map(x => +Number(x).toPrecision(6)).join(', ') + ']';
    const mn = Math.min(...v.slice(0, 70000)), mx = Math.max(...v.slice(0, 70000));
    return `[${v.length} values${mn === mx ? `, all ${+mn.toPrecision(6)}` : `, ${+mn.toPrecision(4)} … ${+mx.toPrecision(4)}`}]`;
  };

  function mount(el) { root = el; }
  // Expert drawer: the full parameter table in a modal dialog.
  let dlg = null;
  function openExpert() {
    dlg = document.getElementById('expert');
    const fill = () => { PG.clear(dlg); dlg.append(h('div.dlg-head', {}, h('button.btn', { type: 'button', text: 'Close', on: { click: () => dlg.close() } })), paramTable()); };
    fill();
    if (!dlg.dataset.bound) { dlg.dataset.bound = '1'; PG.bus.on('settings', () => { if (dlg.open) { const sc = dlg.scrollTop, f = document.activeElement && document.activeElement.id; fill(); dlg.scrollTop = sc; if (f) { const e = document.getElementById(f); if (e) e.focus(); } } }); }
    if (!dlg.open) dlg.showModal();
  }

  function render() {
    if (!root) return;
    const scroll = document.scrollingElement.scrollTop, focusId = document.activeElement && document.activeElement.id;
    PG.clear(root);
    root.append(ostEditor(), paramTable());
    document.scrollingElement.scrollTop = scroll;
    if (focusId) { const f = document.getElementById(focusId); if (f) { f.focus(); if (f.setSelectionRange && f.type === 'search') f.setSelectionRange(f.value.length, f.value.length); } }
  }

  // ---------------- parameter table
  function paramTable() {
    const s = PG.state.settings, c = S.compile(s), eff = c.map;
    const presetMap = S.baseParams({ ...s, listen: {} });
    const search = h('input.filter', { type: 'search', id: 'param-search', placeholder: 'Search parameters', value: q, 'aria-label': 'Search parameters', on: { input: e => { q = e.target.value; fill(); } } });
    const chk = h('label', {}, h('input', { type: 'checkbox', checked: onlyChanged, on: { change: e => { onlyChanged = e.target.checked; fill(); } } }), ' only values that differ from the preset');
    tableBody = h('tbody');
    const wrap = h('section.grp.ptable', { 'aria-labelledby': 'pt-title' },
      h('h2.grp-title', { id: 'pt-title', text: 'All Audapter parameters' }),
      h('p.grp-blurb', { text: `The ${AUD_PARAM_TABLE.length} parameters registered in Audapter's C++ constructor, with their help text. "Sent" is what this page passes to setParam, in AudapterIO('init') order, after the preset, the cards above and your overrides. An override here wins over everything else.` }),
      h('div.pt-tools', {}, search, chk, h('button.linkish', { type: 'button', text: 'Clear all overrides', on: { click: () => PG.editSettings(x => { x.raw = {}; }, 'load') } })),
      h('div.tscroll', {}, h('table.plain.params', {}, h('thead', {}, h('tr', {}, ['Parameter', 'Sent', 'Override', 'What it does'].map(t => h('th', { text: t })))), tableBody)));
    function fill() {
      PG.clear(tableBody);
      const qq = q.trim().toLowerCase();
      for (const p of AUD_PARAM_TABLE) {
        const n = p.name, v = eff.get(n), pv = presetMap.get(n), raw = s.raw[n];
        const changed = raw !== undefined || JSON.stringify(v) !== JSON.stringify(pv);
        if (onlyChanged && !changed) continue;
        if (qq && ![n, p.help, PLAIN[n] || '', NOTE[n] || ''].join(' ').toLowerCase().includes(qq)) continue;
        const err = h('div.p-err', { role: 'alert' });
        const disabled = p.type === 'warp' || n === 'bpvocmpnorm';
        const inp = h('input.num.wide', { type: 'text', id: 'raw-' + n, value: raw === undefined ? '' : Array.isArray(raw) ? JSON.stringify(raw) : raw, placeholder: disabled ? 'not settable here' : 'value', disabled, 'aria-label': `Override ${n}`,
          on: { change: e => { const r = parseVal(p, e.target.value); if (r.err) { err.textContent = r.err; e.target.setAttribute('aria-invalid', 'true'); return; } PG.editSettings(x => { if (r.v === undefined) delete x.raw[n]; else x.raw[n] = r.v; }); } } });
        tableBody.append(h('tr' + (changed ? '.changed' : ''), {},
          h('td', {}, h('code', { text: n }), h('div.muted', { text: p.type })),
          h('td.p-val', { text: v === undefined ? '(C++ default)' : show(v) }, pv !== undefined && JSON.stringify(v) !== JSON.stringify(pv) ? h('div.muted', { text: 'preset ' + show(pv) }) : null),
          h('td', {}, inp, err),
          h('td.p-help', {}, PLAIN[n] ? h('div', { text: PLAIN[n] }) : null, h('div.muted', {}, p.help.split('\n')[0], ' ', h('a', { href: CPP + p.line, target: '_blank', rel: 'noopener', text: `Audapter.cpp:${p.line}` })),
            NOTE[n] ? h('div.p-note', { text: NOTE[n] }) : null)));
      }
      if (!tableBody.children.length) tableBody.append(h('tr', {}, h('td', { colSpan: 4, text: 'No parameter matches.' })));
    }
    fill();
    return wrap;
  }

  // ---------------- OST / PCF editor
  function ostEditor() {
    const s = PG.state.settings, custom = s.when.mode === 'custom', c = S.compile(s);
    const ostText = custom ? s.when.ost : (c.ost || ''), pcfText = custom ? s.when.pcf : (c.pcf || '');
    const o = S.parseOst(ostText), p = S.parsePcf(pcfText), nS = S.ostStateCount(o);
    const commit = (oo, pp) => PG.editSettings(x => { x.when.mode = 'custom'; x.when.ost = oo ? S.serializeOst(oo) : x.when.ost || ostText; x.when.pcf = pp ? S.serializePcf(pp) : x.when.pcf || pcfText; });
    const sec = h('section.grp.ost-ed', { id: 'ost-editor', 'aria-labelledby': 'ost-title' },
      h('h2.grp-title', { id: 'ost-title', text: 'When: OST and PCF' }),
      h('p.grp-blurb', { text: 'The online status tracking (OST) file is a small state machine that follows the speech; the perturbation configuration (PCF) says what to change in each state. ' +
        (custom ? 'You are editing a custom pair; it drives the shift whenever "When" is set to Custom.' : 'The pair below is generated from the "When" settings. Editing it switches "When" to Custom.') }));
    if (!ostText.trim()) {
      sec.append(h('p', { text: 'No OST/PCF is in use: the shift is controlled by the perturbation field alone.' }),
        h('button.btn', { type: 'button', text: 'Start a custom OST/PCF', on: { click: () => commit({ rmsSlopeWin: 0.03, rules: [{ stat: 0, mode: 'INTENSITY_RISE_HOLD', p1: 0.02, p2: 0.02, p3: null }, { stat: 2, mode: 'INTENSITY_FALL', p1: 0.01, p2: 0.02, p3: null }, { stat: 3, mode: 'OST_END', p1: NaN, p2: NaN, p3: null }], maxIOI: [] },
          { warps: [], rows: [0, 1, 2, 3].map(i => ({ pitch: 0, db: 0, amp: i === 2 ? 0.2 : 0, phi: 0 })) }) } }));
      return sec;
    }
    sec.append(diagram(o, p, nS));
    // warnings for this pair
    const ws = PG.S.warnings(s, c, { sequence: false }).filter(w => w.where === 'ost' || w.where === 'pcf');
    if (ws.length) sec.append(h('div.warns', {}, ws.map(PG.warnEl)));
    // rules
    const rules = h('tbody');
    o.rules.forEach((r, i) => {
      const md = S.OST_MODES[r.mode] || { params: [], text: 'Unknown mode.' };
      const upd = fn => { const oo = S.clone(o); fn(oo.rules[i]); commit(oo, null); };
      const pin = (k, idx) => h('input.num', { type: 'number', step: 'any', value: r[k] === null || Number.isNaN(r[k]) ? '' : r[k], placeholder: idx < md.params.length ? '' : (k === 'p3' ? '{}' : 'NaN'),
        'aria-label': md.params[idx] || `field ${idx + 3}`, title: md.params[idx] || 'unused', on: { change: e => upd(rr => { rr[k] = e.target.value === '' ? (k === 'p3' ? null : NaN) : +e.target.value; }) } });
      rules.append(h('tr', {},
        h('td', {}, h('input.num.narrow', { type: 'number', min: 0, value: r.stat, 'aria-label': 'From state', on: { change: e => upd(rr => { rr.stat = +e.target.value; }) } })),
        h('td', {}, h('select', { 'aria-label': 'Rule', on: { change: e => upd(rr => { rr.mode = e.target.value; }) } }, Object.keys(S.OST_MODES).map(k => h('option', { value: k, text: k, selected: k === r.mode })))),
        h('td', {}, pin('p1', 0)), h('td', {}, pin('p2', 1)), h('td', {}, pin('p3', 2)),
        h('td.rule-d', {}, md.text, md.params.length ? h('div.muted', { text: 'Fields: ' + md.params.join('; ') }) : null),
        h('td', {}, h('button.linkish', { type: 'button', text: 'remove', on: { click: () => { const oo = S.clone(o); oo.rules.splice(i, 1); commit(oo, null); } } }))));
    });
    const ioi = h('div.ioi', {}, h('h3', { text: 'Timeouts (maxIOI)' }),
      o.maxIOI.map((m, i) => h('div.src-row', {}, 'From state ', h('input.num.narrow', { type: 'number', value: m.stat0, 'aria-label': 'From state', on: { change: e => { const oo = S.clone(o); oo.maxIOI[i].stat0 = +e.target.value; commit(oo); } } }),
        ' jump to ', h('input.num.narrow', { type: 'number', value: m.stat1, 'aria-label': 'To state', on: { change: e => { const oo = S.clone(o); oo.maxIOI[i].stat1 = +e.target.value; commit(oo); } } }),
        ' after ', h('input.num', { type: 'number', step: 0.01, value: m.interval, 'aria-label': 'Seconds', on: { change: e => { const oo = S.clone(o); oo.maxIOI[i].interval = +e.target.value; commit(oo); } } }), ' s ',
        h('button.linkish', { type: 'button', text: 'remove', on: { click: () => { const oo = S.clone(o); oo.maxIOI.splice(i, 1); commit(oo); } } }))),
      h('button.linkish', { type: 'button', text: 'Add a timeout', on: { click: () => { const oo = S.clone(o); oo.maxIOI.push({ stat0: 0, interval: 0.5, stat1: Math.max(1, nS - 1) }); commit(oo); } } }));
    sec.append(h('h3', { text: 'OST rules' }),
      h('div.tscroll', {}, h('table.plain.rules', {}, h('thead', {}, h('tr', {}, ['State', 'Rule', 'Field 3', 'Field 4', 'Field 5', 'What it does', ''].map(t => h('th', { text: t })))), rules)),
      h('div.btnrow', {}, h('button.linkish', { type: 'button', text: 'Add a rule', on: { click: () => { const oo = S.clone(o); const last = oo.rules[oo.rules.length - 1]; const st = last ? last.stat : 0; oo.rules.splice(Math.max(0, oo.rules.length - 1), 0, { stat: st, mode: 'ELAPSED_TIME', p1: 0.1, p2: NaN, p3: null }); if (last && last.mode === 'OST_END') last.stat = st + 1; commit(oo); } } }),
        h('label', {}, 'rmsSlopeWin ', h('input.num', { type: 'number', step: 0.005, value: o.rmsSlopeWin, 'aria-label': 'rmsSlopeWin (s)', on: { change: e => { const oo = S.clone(o); oo.rmsSlopeWin = +e.target.value; commit(oo); } } }), ' s')),
      ioi);
    // PCF table
    const pb = h('tbody');
    const rowsN = Math.max(p.rows.length, nS);
    for (let i = 0; i < rowsN; i++) {
      const r = p.rows[i], missing = !r;
      const upd = (k, v) => { const pp = S.clone(p); while (pp.rows.length <= i) pp.rows.push({ pitch: 0, db: 0, amp: 0, phi: 0 }); pp.rows[i][k] = v; commit(null, pp); };
      const cell = k => h('td', {}, h('input.num', { type: 'number', step: 'any', value: missing ? '' : r[k], placeholder: missing ? 'missing' : '', 'aria-label': `${k} for state ${i}`, on: { change: e => upd(k, +e.target.value || 0) } }));
      const eq = r && r.amp ? `≈ ${s.shift.formant.units === 'pct' || S.compile(s).map.get('bratioshift') === 1 ? `F1 ${PG.fmt.signed(100 * r.amp * Math.cos(r.phi), 1)} %, F2 ${PG.fmt.signed(100 * r.amp * Math.sin(r.phi), 1)} %` : `F1 ${PG.fmt.signed(r.amp * Math.cos(r.phi), 0)}, F2 ${PG.fmt.signed(r.amp * Math.sin(r.phi), 0)} (Hz or mel)`}` : '';
      pb.append(h('tr' + (missing ? '.missing' : ''), {}, h('td', { text: String(i) }), cell('pitch'), cell('db'), cell('amp'), cell('phi'), h('td.muted', { text: missing ? 'no row: Audapter reads past the table (OST-F4)' : eq })));
    }
    sec.append(h('h3', { text: 'PCF: what changes in each state' }),
      h('div.tscroll', {}, h('table.plain.pcf', {}, h('thead', {}, h('tr', {}, ['State', 'Pitch (st)', 'Level (dB)', 'Formant amplitude', 'Formant angle (rad)', ''].map(t => h('th', { text: t })))), pb)),
      p.warps.length ? h('p.muted', { text: `Time warps: ${p.warps.map(w => `${w.ostInitState !== null ? `from state ${w.ostInitState}, ` : ''}start ${w.tBegin} s, ×${w.rate1} for ${w.dur1} s, hold ${w.hold} s, catch up ×${w.rate2}`).join('; ')}.` }) : '',
      h('p.ctl-desc', { text: 'Formant amplitude and angle are a vector in the F1–F2 plane: in ratio mode, amplitude 0.2 at angle 0 is F1 +20 %; angle π/2 moves F2 instead. A PCF overrides the perturbation field.' }));
    // text import/export
    const ta1 = h('textarea.code', { rows: 9, 'aria-label': 'OST text', text: ostText }), ta2 = h('textarea.code', { rows: 9, 'aria-label': 'PCF text', text: pcfText });
    const errs = h('div.p-err', { role: 'alert' });
    const fileIn = (ta, ext) => h('input', { type: 'file', accept: ext, hidden: true, on: { change: async e => { const f = e.target.files[0]; if (f) ta.value = await f.text(); e.target.value = ''; } } });
    const f1 = fileIn(ta1, '.ost,.txt'), f2 = fileIn(ta2, '.pcf,.txt');
    sec.append(h('details.ost-text', {}, h('summary', { text: 'Edit as text, import or export .ost / .pcf files' }),
      h('div.two', {}, h('div', {}, h('h3', { text: 'OST' }), ta1), h('div', {}, h('h3', { text: 'PCF' }), ta2)), errs,
      h('div.btnrow', {},
        h('button.btn.primary', { type: 'button', text: 'Apply text', on: { click: () => {
          const e1 = S.parseOst(ta1.value).errors, e2 = S.parsePcf(ta2.value).errors;
          errs.textContent = [...e1.map(x => 'OST ' + x), ...e2.map(x => 'PCF ' + x)].join('. ');
          if (!e1.length && !e2.length) PG.editSettings(x => { x.when.mode = 'custom'; x.when.ost = ta1.value; x.when.pcf = ta2.value; });
        } } }),
        h('button.btn', { type: 'button', text: 'Import .ost', on: { click: () => f1.click() } }), f1,
        h('button.btn', { type: 'button', text: 'Import .pcf', on: { click: () => f2.click() } }), f2,
        h('button.btn', { type: 'button', text: 'Export .ost', on: { click: () => PG.Store.download(new Blob([ta1.value]), 'playground.ost') } }),
        h('button.btn', { type: 'button', text: 'Export .pcf', on: { click: () => PG.Store.download(new Blob([ta2.value]), 'playground.pcf') } }))));
    return sec;
  }

  // State diagram: states left to right, each rule an arrow labelled in words; states the PCF perturbs are annotated.
  function diagram(o, p, nS) {
    const NS = 'http://www.w3.org/2000/svg', el = (t, a = {}, txt) => { const e = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (txt !== undefined) e.textContent = txt; return e; };
    const gap = 150, r = 17, Wd = Math.max(320, 40 + (nS - 1) * gap + 60), Hd = 150, yc = 62;
    const svg = el('svg', { class: 'ost-diagram', viewBox: `0 0 ${Wd} ${Hd}`, width: Wd, height: Hd, role: 'img', 'aria-label': `OST state diagram with ${nS} states` });
    const X = i => 30 + i * gap;
    const short = { ELAPSED_TIME: r => `after ${r.p1} s`, INTENSITY_RISE_HOLD: r => [`level > ${r.p1}`, `held ${r.p2} s`], INTENSITY_RISE_HOLD_POS_SLOPE: r => [`level > ${r.p1}, rising`, `held ${r.p2} s`],
      INTENSITY_FALL: r => `level < ${r.p1}`, INTENSITY_AND_RATIO_ABOVE_THRESH: r => [`level & ratio up`, `held ${r.p3 ?? 0} s`], INTENSITY_AND_RATIO_BELOW_THRESH: r => [`level & ratio down`, `held ${r.p3 ?? 0} s`],
      INTENSITY_RATIO_RISE: () => ['ratio up', 'held', 'ratio down'], INTENSITY_RATIO_FALL_HOLD: () => ['ratio down', 'held', 'ratio down'] };
    const defs = el('defs'); const mk = el('marker', { id: 'ah', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }); mk.append(el('path', { d: 'M0,0L10,5L0,10z', class: 'ah' })); defs.append(mk); svg.append(defs);
    for (const rule of o.rules) {
      const md = S.OST_MODES[rule.mode]; if (!md || !md.span) continue;
      const labs = short[rule.mode] ? [].concat(short[rule.mode](rule)) : [rule.mode.toLowerCase().replace(/_/g, ' ')];
      for (let k = 0; k < md.span; k++) {
        const a = rule.stat + k, b = a + 1;
        svg.append(el('line', { x1: X(a) + r + 2, y1: yc, x2: X(b) - r - 3, y2: yc, class: 'ost-edge', 'marker-end': 'url(#ah)' }));
        svg.append(el('text', { x: (X(a) + X(b)) / 2, y: yc - 10, 'text-anchor': 'middle', class: 'ost-elab' }, labs[Math.min(k, labs.length - 1)]));
      }
    }
    for (const m of o.maxIOI) {
      const a = X(m.stat0), b = X(m.stat1), mid = (a + b) / 2;
      svg.append(el('path', { d: `M${a},${yc + r}Q${mid},${yc + 72} ${b},${yc + r + 2}`, class: 'ost-edge ioi', 'marker-end': 'url(#ah)' }));
      svg.append(el('text', { x: mid, y: yc + 52, 'text-anchor': 'middle', class: 'ost-elab' }, `timeout ${m.interval} s`));
    }
    for (let i = 0; i < nS; i++) {
      const row = p.rows[i], pert = row && (row.pitch || row.db || row.amp);
      svg.append(el('circle', { cx: X(i), cy: yc, r, class: 'ost-node' + (pert ? ' pert' : '') + (!row && p.rows.length ? ' missing' : '') }));
      svg.append(el('text', { x: X(i), y: yc + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'ost-nlab' }, String(i)));
      const bits = [];
      if (row) { if (row.amp) bits.push(`F ${+(row.amp).toPrecision(3)}∠${+(row.phi).toFixed(2)}`); if (row.pitch) bits.push(`${PG.fmt.signed(row.pitch, 1)} st`); if (row.db) bits.push(`${PG.fmt.signed(row.db, 1)} dB`); }
      else if (p.rows.length) bits.push('no PCF row');
      if (bits.length) svg.append(el('text', { x: X(i), y: yc + r + 16, 'text-anchor': 'middle', class: 'ost-plab' + (row ? '' : ' bad') }, bits.join(', ')));
    }
    return h('div.tscroll.ost-dwrap', {}, svg);
  }
  return { mount, render, openExpert, ostEditor, paramTable };
})();


/* ---- ostsim.js ---- */
'use strict';
// A line-by-line JavaScript port of Audapter's OST_TAB::osTrack (ost.cpp:334-738 @169cadf), run over the per-frame
// level that Audapter itself logged in a dry run (rms[0] = rms_s, rms[1] = rms_p, rms_slope). It predicts ost_stat for a
// design before the real run. Faithful details: the current frame's rms_rec entry is not yet written when INTENSITY_FALL
// reads it (so it counts as 0); ELAPSED_TIME compares (frame - onset) * frameDur > duration in doubles; the lookup reads
// one past the rule table for the last rule (treated here as +infinity); maxIOI writes statOnsetIndices[stat] (OST-F2)
// unless `patched`.
PG.OstSim = (() => {
  const S = PG.S;
  function run(ostText, fr, frameDur, { patched = false } = {}) {
    const o = S.parseOst(ostText), n = o.rules.length, N = fr.rms.length;
    const out = new Int32Array(N);
    if (!n) return { states: out, supported: true };
    const stat0 = o.rules.map(r => r.stat), mode = o.rules.map(r => S.OST_MODES[r.mode] ? S.OST_MODES[r.mode].code : -1);
    const p1 = o.rules.map(r => (r.p1 === null ? 0 : r.p1)), p2 = o.rules.map(r => (r.p2 === null ? 0 : r.p2)), p3 = o.rules.map(r => (r.p3 === null ? 0 : r.p3));
    const onset = new Int32Array(Math.max(64, n * 4 + 64));
    let stat = 0, stretchCnt = 0, span = 0, lastStatEnd = 0;
    const nLB = Math.floor(0.01 / frameDur + 0.5);
    const rec = i => (i >= 0 && i < N ? fr.rms[i] : 0);
    for (let dc = 0; dc < N; dc++) {
      const rms_s = fr.rms[dc], slp = fr.slope[dc], ratio = fr.rms[dc] / fr.rmsP[dc];
      let out1 = stat, k = -1;
      for (let i = 0; i < n; i++) if (stat >= stat0[i] && stat < (i + 1 < n ? stat0[i + 1] : Infinity)) { k = i; break; }
      if (k >= 0) {
        const t0 = stat0[k], m = mode[k], set = () => { onset[out1] = dc; };
        const minDur = x => Math.floor(x / frameDur + 0.5), minDurF = x => Math.floor(x / frameDur);
        const hold2 = (cond, dur, round) => {   // the common "+2" pattern
          if (stat === t0) { if (cond) { out1 = stat + 1; set(); stretchCnt = 1; } }
          else { if (cond) { stretchCnt++; if (stretchCnt > dur) { out1 = stat + 1; set(); lastStatEnd = dc; } } else out1 = stat - 1; }
        };
        if (m === 1) { if ((dc - onset[stat]) * frameDur > p1[k]) { out1 = stat + 1; set(); } }
        else if (m === 5) hold2(rms_s > p1[k], minDur(p2[k]));
        else if (m === 6) hold2(rms_s > p1[k] && slp > 0, minDur(p2[k]));
        else if (m === 10) hold2(slp > 0, p1[k]);
        else if (m === 11) {
          if (stat === t0) { if (slp < 0) { out1 = stat + 1; set(); stretchCnt = 1; span = slp; } }
          else if (slp < 0) { stretchCnt++; span += slp; if (stretchCnt > p1[k] && span < p2[k]) { out1 = stat + 1; set(); lastStatEnd = dc; } } else out1 = stat - 1;
        }
        else if (m === 12) hold2(slp < p1[k], minDur(p2[k]));
        else if (m === 13) hold2(slp > p1[k], minDur(p2[k]));
        else if (m === 20) {
          const md = minDur(p2[k]); let goet = 0;
          for (let j = 0; j < nLB; j++) { if (dc - j < 0) { goet = 1; break; } if ((j === 0 ? 0 : rec(dc - j)) >= p1[k]) { goet = 1; break; } }
          if (goet === 0 && dc - lastStatEnd > md) { out1 = stat + 1; set(); lastStatEnd = dc; }
        }
        else if (m === 21) hold2(rms_s < p1[k] && slp < 0, minDur(p2[k]));
        else if (m === 30 || m === 31) {
          const c = m === 30 ? 1 / ratio > p1[k] : 1 / ratio < p1[k];
          if (stat === t0) { if (c) { out1 = stat + 1; set(); stretchCnt = 0; } }
          else if (stat - t0 === 1) { if (c) { stretchCnt++; if (stretchCnt > minDurF(p2[k])) { out1 = stat + 1; set(); } } else out1 = stat - 1; }
          else if (1 / ratio < p1[k]) { out1 = stat + 1; set(); lastStatEnd = dc; }
        }
        else if (m === 32) {
          const c = 1 / ratio > p1[k] && rms_s >= 0.0003;
          if (stat === t0) { if (c) { out1 = stat + 1; set(); stretchCnt = 0; } }
          else if (stat - t0 === 1) { if (c) { stretchCnt++; if (stretchCnt > minDurF(p2[k])) { out1 = stat + 1; set(); } } else out1 = stat - 1; }
        }
        else if (m === 40) hold2(rms_s > p1[k] && 1 / ratio > p2[k], minDur(p3[k]));
        else if (m === 45) hold2(rms_s < p1[k] && 1 / ratio < p2[k], minDur(p3[k]));
      }
      for (const q of o.maxIOI) {
        if (stat >= q.stat0 && stat < q.stat1 && (dc - onset[q.stat0]) * frameDur > q.interval) {
          for (let j = stat + 1; j <= q.stat1; j++) onset[patched ? j : stat] = dc;
          out1 = q.stat1;
        }
      }
      stat = out1; out[dc] = stat;
    }
    return { states: out, supported: true };
  }
  // Sounds as Audapter's level rules see them: alternate "sound starts" / "sound ends" rules over the whole input.
  function sounds(fr, frameDur, det) {
    const rules = [];
    for (let k = 0; k < 60; k++) rules.push({ stat: 3 * k, mode: 'INTENSITY_RISE_HOLD', p1: det.onThresh, p2: det.onHold, p3: null }, { stat: 3 * k + 2, mode: 'INTENSITY_FALL', p1: det.offThresh, p2: det.offMin, p3: null });
    rules.push({ stat: 180, mode: 'OST_END', p1: NaN, p2: NaN, p3: null });
    const st = run(S.serializeOst({ rmsSlopeWin: 0.03, rules, maxIOI: [] }), fr, frameDur).states;
    const out = []; let cur = null;
    for (let i = 0; i < st.length; i++) {
      const ph = st[i] % 3, prev = i ? st[i - 1] : 0;
      if (st[i] !== prev) {
        if (ph === 2 && prev % 3 === 1) {   // confirmed: the sound began where state +1 was entered
          let a = i; while (a > 0 && st[a - 1] === st[i] - 1) a--;
          cur = { k: out.length + 1, on: a * frameDur, confirm: i * frameDur };
        }
        if (ph === 0 && st[i] > prev && cur) { cur.off = i * frameDur; out.push(cur); cur = null; }
      }
    }
    if (cur) { cur.off = st.length * frameDur; cur.open = true; out.push(cur); }
    return out;
  }
  return { run, sounds };
})();


/* ---- design-ui.js ---- */
'use strict';
// "Timing & design" tab: draw WHEN the perturbation happens on the current input, from events Audapter's own level rules
// detect (a dry run of the real core gives the per-frame level; PG.OstSim replays the OST rules on it). Templates,
// draggable blocks, a prediction of the resulting states, the generated OST/PCF (advanced), and an experiment schedule.
PG.DesignUI = (() => {
  const { h, S } = PG, TT = PG.Tiers;
  let advOpen = false, root, dry = null, dryErr = null, dryKey = '', stack = null, drag = null, schedRes = null, lastSchedId = null;
  const sched = { base: 10, ramp: 10, hold: 10, wash: 10, catchPct: 0, clips: 'current', clipIds: [], session: false };

  const D = () => PG.state.settings.design;
  const edit = (fn, why) => PG.editSettings(s => { fn(s.design, s); s.when.mode = 'design'; }, why);
  const round10 = v => Math.round(v / 10) * 10;
  const asDesign = () => { const x = S.clone(PG.state.settings); x.when.mode = 'design'; return x; };
  const fd = () => (dry ? dry.frameDur : 0.002);

  function mount(el) {
    root = el;
    PG.bus.on('tab', t => { if (t === 'design') { render(); ensureDry(); } });
    PG.bus.on('settings', why => { if (visible()) { if (why !== 'drag') render(); ensureDry(); } });
    PG.bus.on('input', () => { if (visible()) { render(); ensureDry(); } });
    PG.bus.on('current', () => { if (visible() && stack) stack.draw(); });
    PG.bus.on('trials', () => { if (visible() && schedRes) renderSchedPlot(); });
  }
  const visible = () => root && !root.closest('[hidden]');

  // ---------- dry run (Audapter's level per frame) and events
  async function ensureDry() {
    const inp = PG.state.input; if (!inp) return;
    const s = PG.state.settings, key = inp.id + '|' + JSON.stringify([s.preset, s.listen, s.raw, s.build]);
    if (key === dryKey && dry) return;
    dryKey = key;
    try {
      const d = await PG.Engine.dryRun(inp, s);
      if (dryKey !== key) return;
      dry = d; dryErr = null;
      const det = D().detect;
      if (det.auto !== false) {   // fit detection levels to this input's peak (Audapter's own RMS)
        let pk = 0; for (const v of d.rms) if (v > pk) pk = v;
        const on = +(pk * Math.pow(10, (det.onDb ?? -12) / 20)).toPrecision(3), off = +(pk * Math.pow(10, (det.offDb ?? -18) / 20)).toPrecision(3);
        if (on !== det.onThresh || off !== det.offThresh) { PG.editSettings(x => { x.design.detect.onThresh = on; x.design.detect.offThresh = off; }, 'fit'); return; }
      }
      render();
    } catch (e) { dryErr = e.message; render(); }
  }
  const sounds = () => (dry ? PG.OstSim.sounds(dry, dry.frameDur, D().detect) : []);
  function refTime(ref, snd, startT, dur) {
    if (ref.ev === 't0') return ref.ms / 1000;
    if (ref.ev === 'none') return dur;
    if (ref.ev === 'dur') return startT === null ? null : startT + ref.ms / 1000;
    const z = snd[ref.k - 1]; if (!z) return null;
    return (ref.ev === 'on' ? z.on : z.off) + ref.ms / 1000;
  }
  function intended(snd, dur) {
    return D().blocks.map(b => { const a = refTime(b.start, snd, null, dur); const e = refTime(b.end, snd, a, dur); return { a, b: e === null ? null : Math.min(dur, e) }; });
  }
  // Predicted spans per block from simulating the compiled OST on the dry-run level.
  function predict() {
    if (!dry) return null;
    const c = S.compile(asDesign()); if (!c.ost || !c.meta.design) return null;
    const st = PG.OstSim.run(c.ost, dry, dry.frameDur, { patched: PG.state.settings.build === 'patched' }).states;
    const W = c.meta.design.whatOf, spans = D().blocks.map(() => []);
    let cur = -1, a = 0;
    for (let i = 0; i <= st.length; i++) {
      const b = i < st.length && W[st[i]] ? W[st[i]].block : -1;
      if (b !== cur) { if (cur >= 0) spans[cur].push([a * dry.frameDur, i * dry.frameDur]); cur = b; a = i; }
    }
    return { states: st, spans, compiled: c };
  }

  // ---------- rendering
  let rendering = false;
  function render() {
    if (!root || rendering) return;
    rendering = true;
    try { render1(); } finally { rendering = false; }
  }
  function render1() {
    if (stack) { stack.destroy(); stack = null; }
    const scroll = document.scrollingElement.scrollTop;
    PG.clear(root);
    const s = PG.state.settings, d = s.design, inUse = s.when.mode === 'design';
    root.append(h('section.dz-head', {},
      h('h2.dz-title', { text: 'When the perturbation happens' }),
      h('p.grp-blurb', { text: 'Pick a common design, then drag the blocks on the timeline. Blocks snap to the sounds Audapter detects in this input, and the row below them predicts when Audapter will actually switch the perturbation on.' }),
      h('div.dz-status' + (inUse ? '.on' : ''), {}, inUse
        ? h('span', {}, h('b', { text: 'In use. ' }), 'Every run uses this timing (Explore, "When": as designed here).')
        : [h('span', { text: `Not in use: Explore's "When" is set to "${({ always: 'always', after: 'after a delay', window: 'a time window', vowel: 'during the vowel', custom: 'custom OST/PCF' })[s.when.mode]}". ` }),
           h('button.btn.primary', { type: 'button', text: 'Use this timing', on: { click: () => edit(() => {}) } })])));
    root.append(templates(d));
    const inp = PG.state.input;
    const tl = h('div.dz-timeline');
    root.append(h('section.dz-sec', {}, h('h3', { text: inp ? `Timeline: ${inp.label}` : 'Timeline' }), tl));
    if (!inp) tl.append(h('p.empty', { text: 'Choose an input on the Explore tab first.' }));
    else if (dryErr) tl.append(h('p.empty', { text: 'Could not analyse this input: ' + dryErr }));
    else if (!dry) tl.append(h('p.empty', { text: 'Analysing the input with Audapter…' }));
    else timeline(tl);
    root.append(blockList(), detection(), notesBox(), advanced(), schedule(),
      h('p.expert-link', {}, h('button.linkish', { type: 'button', text: 'Expert: all 87 Audapter parameters', on: { click: () => PG.ParamsUI.openExpert() } })));
    document.scrollingElement.scrollTop = scroll;
  }

  function sketch(key) {   // tiny picture of each template: a voice bar (grey) and when the shift is on (hollow block)
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 64 22'); svg.setAttribute('class', 'tpl-sk'); svg.setAttribute('aria-hidden', 'true');
    const r = (x, y, w, hh, cls) => { const e = document.createElementNS(NS, 'rect'); Object.entries({ x, y, width: w, height: hh, class: cls, rx: 1 }).forEach(([k, v]) => e.setAttribute(k, v)); svg.append(e); };
    const voice = key === 'nth' ? [[8, 14], [26, 14], [44, 14]] : [[10, 48]];
    voice.forEach(([x, w]) => r(x, 15, w, 5, 'sk-voice'));
    const on = { whole: [[1, 62]], step: [[22, 41]], vowel: [[12, 46]], nth: [[26, 14]], pulse: [[30, 9]], stepback: [[20, 22]] }[key] || [];
    on.forEach(([x, w]) => r(x, 3, w, 8, 'sk-on'));
    return svg;
  }
  function templates(d) {
    const T = S.TEMPLATES;
    const grid = h('div.tpl-grid', { role: 'group', 'aria-label': 'Designs' }, Object.entries(T).map(([k, t]) =>
      h('button.tpl', { type: 'button', 'aria-pressed': String(d.template === k), title: t.blurb, on: { click: () => applyTemplate(k) } }, sketch(k), h('span.tpl-l', { text: t.label }))));
    const cur = T[d.template];
    const ctl = h('div.tpl-ctl');
    if (cur && cur.controls.length) for (const [key, label, unit, mn, mx, step] of cur.controls)
      ctl.append(h('label.syn', {}, h('span', { text: label }), h('input.num', { type: 'number', min: mn, max: mx, step, value: d.tpl[key], id: 'tpl-' + key,
        on: { change: e => { const v = +e.target.value; edit(dd => { dd.tpl[key] = v; if (key === 'jitter') dd.jitterMs = v; else rebuild(dd); }); } } }), h('span.unit', { text: unit })));
    else if (!cur) ctl.append(h('p.muted', { text: 'Adjusted by hand. Pick a design above to start again from a template.' }));
    return h('section.dz-sec', {}, h('h3', { text: 'Common designs' }), grid,
      cur ? h('p.ctl-desc', { text: cur.blurb + (d.template === 'nth' ? ' A "sound" is a stretch where the level stays above the detection level; a word with a stop consonant can be two sounds.' : '') }) : null, ctl);
  }
  function currentWhat() {
    const b = D().blocks[0];
    if (b && b.what && (b.what.f1 || b.what.f2 || b.what.st || b.what.db)) return { ...b.what };
    const sh = PG.state.settings.shift;
    const w = { f1: sh.formant.on ? sh.formant.f1 : 0, f2: sh.formant.on ? sh.formant.f2 : 0, st: sh.pitch.on ? sh.pitch.semitones : 0, db: sh.loudness.on ? sh.loudness.db : 0 };
    return w.f1 || w.f2 || w.st || w.db ? w : { f1: 20, f2: 0, st: 0, db: 0 };
  }
  function rebuild(dd) { const T = S.TEMPLATES[dd.template]; if (!T) return; const w = currentWhat(); dd.blocks = T.blocks(dd.tpl).map(b => ({ ...b, what: { ...w } })); }
  function applyTemplate(k) { edit(dd => { dd.template = k; dd.jitterMs = k === 'step' ? dd.tpl.jitter || 0 : 0; rebuild(dd); }); }

  // ---------- timeline tiers
  function timeline(el) {
    const snd = sounds(), dur = dry.n * dry.frameDur, pred = predict(), I = intended(snd, dur);
    TT.setDuration(dur, true);
    const inp = PG.state.input, det = D().detect;
    const t = PG.current(), lastRun = t && t.result && t.inputId === inp.id && t.settings.when.mode === 'design' && JSON.stringify(t.settings.design.blocks) === JSON.stringify(D().blocks) ? t : null;
    const lvlDb = Float32Array.from(dry.rms, v => (v > 0 ? 20 * Math.log10(v) : NaN));
    const tiers = [
      { label: 'Input', sub: 'waveform; Audapter\'s level (ink line) with the start and end levels', height: 84, alt: 'Input waveform and level',
        draw(g, w, hh, xOf, C, z) {
          const x = inp.x, mid = hh / 2; g.fillStyle = C.input; g.beginPath();
          const top = [], bot = [];
          for (let px = 0; px < w; px++) { const a = Math.floor((z.t0 + px / w * (z.t1 - z.t0)) * 48000), b = Math.ceil((z.t0 + (px + 1) / w * (z.t1 - z.t0)) * 48000); let mn = 0, mx = 0; for (let i = Math.max(0, a); i < Math.min(x.length, b); i++) { if (x[i] < mn) mn = x[i]; if (x[i] > mx) mx = x[i]; } top.push(mid - mx * (mid - 2)); bot.push(mid - mn * (mid - 2)); }
          g.moveTo(0, top[0]); top.forEach((yy, i) => g.lineTo(i, yy)); for (let i = bot.length - 1; i >= 0; i--) g.lineTo(i, bot[i]); g.fill();
          const lo = -70, yOf = v => hh - 2 - (v - lo) / -lo * (hh - 4);
          TT.drawSeries(g, { y: lvlDb, dt: dry.frameDur, style: 'ref', lw: 1.2, ok: v => Number.isFinite(v) }, xOf, yOf, C, w);
          for (const [v, lab] of [[det.onThresh, 'starts above'], [det.offThresh, 'ends below']]) { const yy = Math.round(yOf(20 * Math.log10(v))) + 0.5; g.strokeStyle = C.ink2; g.lineWidth = 1; g.setLineDash([]); g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); g.fillStyle = C.ink2; g.font = '11px ' + PG.css('--serif'); g.textBaseline = lab === 'starts above' ? 'bottom' : 'top'; g.fillText(lab, w - 80, lab === 'starts above' ? yy - 1 : yy + 1); }
        },
        readout: tt => { const i = Math.round(tt / dry.frameDur); return [{ label: 'Audapter level', value: (dry.rms[i] || 0).toFixed(4) + ' RMS', style: 'ref' }]; } },
      { label: 'Sounds', sub: 'detected by level', height: 40, alt: 'Detected sounds',
        draw(g, w, hh, xOf, C) { TT.drawIntervals(g, snd.map(z => ({ a: z.on, b: z.off, label: `sound ${z.k}`, kind: 'ctx' })), xOf, w, hh, C); },
        readout: tt => { const z = snd.find(q => tt >= q.on && tt < q.off); return z ? [{ label: `sound ${z.k}: ${z.on.toFixed(2)}–${z.off.toFixed(2)} s`, value: '', style: 'none' }] : [{ label: 'silence', value: '', style: 'none' }]; } },
      { label: 'Your design', sub: 'drag; double-click adds', height: 44, alt: 'Designed perturbation blocks',
        draw(g, w, hh, xOf, C) {
          const items = I.map((iv, i) => { const o = drag && drag.i === i ? drag.iv : iv; return o.a === null || o.b === null ? null : { a: o.a, b: o.b, kind: 'exp', label: `${i + 1}: ${whatText(D().blocks[i].what)}` }; }).filter(Boolean);
          TT.drawIntervals(g, items, xOf, w, hh, C);
          for (const it of items) for (const x0 of [xOf(it.a), xOf(it.b)]) { g.fillStyle = C.ink; g.fillRect(x0 - 2, hh / 2 - 7, 4, 14); }
        },
        attach: (cv, H) => attachDrag(cv, H, snd, dur) },
      { label: 'Predicted', sub: 'Audapter\'s rules, replayed', height: 40, alt: 'Predicted perturbation on-times',
        draw(g, w, hh, xOf, C) {
          if (!pred) return;
          const items = []; pred.spans.forEach((sp, i) => sp.forEach(([a, b]) => items.push({ a, b, kind: 'obs', label: `${i + 1} on` })));
          const disc = [];
          I.forEach((iv, i) => { if (iv.a === null || iv.b === null) return; const sp = pred.spans[i]; const pa = sp.length ? sp[0][0] : null, pb = sp.length ? sp[sp.length - 1][1] : null;
            if (pa === null) disc.push([iv.a, iv.b]); else { if (Math.abs(pa - iv.a) > 0.012) disc.push([Math.min(pa, iv.a), Math.max(pa, iv.a)]); if (Math.abs(pb - iv.b) > 0.012) disc.push([Math.min(pb, iv.b), Math.max(pb, iv.b)]); } });
          TT.bands(g, disc, xOf, hh, C, null);
          TT.drawIntervals(g, items, xOf, w, hh, C);
        },
        readout: tt => { if (!pred) return []; const i = Math.round(tt / dry.frameDur); return [{ label: 'predicted OST state', value: String(pred.states[i] ?? ''), style: 'obs' }]; } },
    ];
    if (lastRun) {
      const r = lastRun.result, P = new Set((r.compiled && r.compiled.meta && r.compiled.meta.perturbStates) || []), dt = 1 / r.frameRate;
      tiers.push({ label: 'Last run', sub: `${lastRun.name}: states logged (blue), formants shifted (ink)`, height: 40, alt: 'Logged on-times in the last run',
        draw(g, w, hh, xOf, C) {
          const on = TT.runs(r.ost_stat, dt, v => P.has(v)).map(x => ({ ...x, kind: 'obs', label: 'state on', lane: 0 }));
          const sh = TT.runs(r.sfmts[0], dt, (v, i) => v > 0 && (Math.abs(v - r.fmts[0][i]) > 0.5 || Math.abs(r.sfmts[1][i] - r.fmts[1][i]) > 0.5)).map(x => ({ ...x, kind: 'exp', label: '', lane: 1 }));
          TT.drawIntervals(g, [...on, ...sh], xOf, w, hh, C);
        } });
    }
    stack = TT.Stack(el, { tiers });
    const legend = h('div.legend-row', {}, PG.Views.key('exp', 'your design'), PG.Views.key('obs', 'predicted on'), h('span.lk', {}, h('span.key.k-disc'), 'differs from the drawn block by more than 12 ms'),
      h('span.muted', { text: 'Onsets count once the level has stayed up for the hold time; ends need 10 ms of quiet.' }));
    el.append(legend);
  }
  const whatText = w => [w.f1 ? `F1 ${PG.fmt.signed(w.f1, 0)}` : '', w.f2 ? `F2 ${PG.fmt.signed(w.f2, 0)}` : '', w.st ? `${PG.fmt.signed(w.st, 1)} st` : '', w.db ? `${PG.fmt.signed(w.db, 1)} dB` : ''].filter(Boolean).join(', ') || 'no change';

  // ---------- dragging
  function snapRef(t, snd, which, startT, dur) {
    const ev = [{ ev: 't0', k: 1, t: 0 }]; snd.forEach(z => { ev.push({ ev: 'on', k: z.k, t: z.on }); ev.push({ ev: 'off', k: z.k, t: z.off }); });
    if (which === 'end' && t > dur - 0.02) return { ev: 'none', k: 1, ms: 0 };
    const near = ev.filter(e => e.ev !== 't0' || which === 'start').sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t))[0];
    const hold = Math.round(D().detect.onHold * 1000);
    if (near && Math.abs(near.t - t) < 0.03) return { ev: near.ev, k: near.k, ms: near.ev === 'on' ? hold : 0 };
    if (which === 'end' && startT !== null) return { ev: 'dur', k: 1, ms: Math.max(10, round10((t - startT) * 1000)) };
    const before = ev.filter(e => e.t <= t).sort((a, b) => b.t - a.t)[0] || ev[0];
    return { ev: before.ev, k: before.k, ms: Math.max(before.ev === 'on' ? hold : 0, round10((t - before.t) * 1000)) };
  }
  function attachDrag(cv, H, snd, dur) {
    cv.style.cursor = 'grab';
    const I = () => intended(snd, dur);
    cv.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const r = cv.getBoundingClientRect(), px = e.clientX - r.left, t = H.tOf(px), iv = I();
      let hit = null;
      iv.forEach((q, i) => { if (q.a === null || q.b === null) return; const xa = H.xOf(q.a), xb = H.xOf(q.b); if (Math.abs(px - xa) < 8) hit = { i, which: 'start' }; else if (Math.abs(px - xb) < 8) hit = { i, which: 'end' }; else if (!hit && px > xa && px < xb) hit = { i, which: 'body', off: t - q.a }; });
      if (!hit) return;
      drag = { ...hit, iv: { ...iv[hit.i] }, t0: t }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = cv.getBoundingClientRect(), t = Math.max(0, Math.min(dur, H.tOf(e.clientX - r.left))), q = I()[drag.i];
      if (drag.which === 'start') drag.iv = { a: Math.min(t, q.b - 0.01), b: q.b };
      else if (drag.which === 'end') drag.iv = { a: q.a, b: Math.max(t, q.a + 0.01) };
      else { const len = q.b - q.a, a = Math.max(0, Math.min(dur - len, t - drag.off)); drag.iv = { a, b: a + len }; }
      H.redraw();
    });
    cv.addEventListener('pointerup', () => {
      if (!drag) return;
      const g = drag; drag = null; cv.style.cursor = 'grab';
      edit(dd => {
        const b = dd.blocks[g.i];
        if (g.which !== 'end') b.start = snapRef(g.iv.a, snd, 'start', null, dur);
        if (g.which !== 'start') { if (!(g.which === 'body' && b.end.ev === 'dur')) b.end = snapRef(g.iv.b, snd, 'end', g.iv.a, dur); }
        dd.template = 'custom';
        sortBlocks(dd, snd, dur);
      });
    });
    cv.addEventListener('dblclick', e => {
      e.stopPropagation();
      const r = cv.getBoundingClientRect(), t = H.tOf(e.clientX - r.left);
      if (I().some(q => q.a !== null && t >= q.a && t <= q.b)) return;
      edit(dd => { dd.blocks.push({ start: snapRef(t, snd, 'start', null, dur), end: { ev: 'dur', k: 1, ms: 200 }, what: { ...currentWhat() } }); dd.template = 'custom'; sortBlocks(dd, snd, dur); });
    });
  }
  function sortBlocks(dd, snd, dur) {
    const t = b => { const v = refTime(b.start, snd, null, dur); return v === null ? 1e9 : v; };
    dd.blocks.sort((a, b) => t(a) - t(b));
  }

  // ---------- block list (plain controls for each block)
  function refSelect(ref, which, snd, onChange) {
    const opts = [];
    if (which === 'start') opts.push(['t0|1', 'the trial start']);
    const nS = Math.max(snd.length, ref.k || 1, 1);
    for (let k = 1; k <= nS; k++) { const z = snd[k - 1], at = z ? '' : ' (not in this input)'; opts.push([`on|${k}`, `sound ${k} starts${z ? ` (${z.on.toFixed(2)} s)` : at}`]); opts.push([`off|${k}`, `sound ${k} ends${z ? ` (${z.off.toFixed(2)} s)` : at}`]); }
    if (which === 'end') { opts.push(['dur|1', 'a fixed time after the start']); opts.push(['none|1', 'the end of the trial']); }
    const sel = h('select', { 'aria-label': which === 'start' ? 'Starts at' : 'Ends at', on: { change: e => { const [ev, k] = e.target.value.split('|'); onChange({ ev, k: +k, ms: ev === 'dur' ? 200 : ev === 'on' ? Math.round(D().detect.onHold * 1000) : 0 }); } } },
      opts.map(([v, t]) => h('option', { value: v, text: t, selected: v === `${ref.ev}|${ref.ev === 't0' || ref.ev === 'dur' || ref.ev === 'none' ? 1 : ref.k}` })));
    const ms = ref.ev === 'none' ? null : h('input.num', { type: 'number', step: 10, min: 0, value: ref.ms, 'aria-label': 'milliseconds', on: { change: e => onChange({ ...ref, ms: Math.max(0, +e.target.value || 0) }) } });
    return h('span.refsel', {}, ref.ev === 'dur' ? null : sel, ms ? h('span.unit', { text: ref.ev === 'dur' ? '' : ref.ev === 't0' ? 'at' : 'plus' }) : null, ms, ms ? h('span.unit', { text: 'ms' }) : null, ref.ev === 'dur' ? [h('span.unit', { text: 'later' }), sel] : null);
  }
  function blockList() {
    const d = D(), snd = dry ? sounds() : [], u = PG.state.settings.shift.formant.units, un = u === 'pct' ? '%' : u;
    const list = h('ol.blocks');
    d.blocks.forEach((b, i) => {
      const set = fn => edit(dd => { fn(dd.blocks[i]); dd.template = 'custom'; });
      const num = (k, lab, unit, step) => h('label.syn', { title: { f1: 'First formant shift', f2: 'Second formant shift', st: 'Pitch shift in semitones (phase vocoder)', db: 'Level change in decibels' }[k] },
        h('span', { text: lab }), h('input.num', { type: 'number', step, value: b.what[k] || 0, 'aria-label': `Block ${i + 1} ${lab}`, on: { change: e => set(bb => { bb.what[k] = +e.target.value || 0; }) } }), h('span.unit', { text: unit }));
      list.append(h('li.block', {},
        h('div.b-when', {}, h('b', { text: `Block ${i + 1}` }), ' starts at ', refSelect(b.start, 'start', snd, r => set(bb => { bb.start = r; })), ', ends at ', refSelect(b.end, 'end', snd, r => set(bb => { bb.end = r; }))),
        h('div.b-what', {}, h('span.muted', { text: 'What changes' }), num('f1', 'F1', un, 1), num('f2', 'F2', un, 1), num('st', 'Pitch', 'st', 0.5), num('db', 'Level', 'dB', 0.5),
          h('button.linkish', { type: 'button', text: 'remove', disabled: d.blocks.length < 2, on: { click: () => edit(dd => { dd.blocks.splice(i, 1); dd.template = 'custom'; }) } }))));
    });
    return h('section.dz-sec', {}, h('h3', { text: 'Blocks' }), list,
      h('div.btnrow', {}, h('button.linkish', { type: 'button', text: 'Add a block', on: { click: () => edit(dd => { const last = dd.blocks[dd.blocks.length - 1]; dd.blocks.push({ start: last && last.end.ev !== 'none' ? { ...last.end, ms: (last.end.ms || 0) + 100 } : { ev: 'on', k: 1, ms: 200 }, end: { ev: 'dur', k: 1, ms: 200 }, what: { ...currentWhat() } }); dd.template = 'custom'; }) } }),
        h('span.muted', { text: `Formant shifts are in ${un === '%' ? 'percent' : un}, set by "Units" on the Explore tab. Pitch uses the phase vocoder.` })));
  }

  function detection() {
    const det = D().detect;
    const f = (k, lab, step, unit, tip) => h('label.syn', { title: tip }, h('span', { text: lab }), h('input.num', { type: 'number', step, value: det[k], 'aria-label': lab, on: { change: e => edit(dd => { dd.detect[k] = +e.target.value; if (k === 'onThresh' || k === 'offThresh') dd.detect.auto = false; }) } }), h('span.unit', { text: unit }));
    return h('details.dz-sec.dz-det', {}, h('summary', { text: 'How sounds are detected' }),
      h('p.ctl-desc', { text: 'Audapter follows speech with level rules: a sound starts when its level (smoothed RMS) rises above the start level and stays there for the hold time, and ends when it has been below the end level for 10 ms. These are the same rules the design compiles to (INTENSITY_RISE_HOLD and INTENSITY_FALL).' }),
      h('div.syn-grid', {}, f('onThresh', 'Starts above', 0.001, 'RMS', 'Level for "sound starts"'), f('onHold', 'Hold', 0.005, 's', 'How long the level must stay up before the onset counts'),
        f('offThresh', 'Ends below', 0.001, 'RMS', 'Level for "sound ends"'), f('offMin', 'Minimum length', 0.005, 's', 'A sound cannot end sooner than this after its onset is confirmed')),
      h('div.btnrow', {}, h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: det.auto !== false, on: { change: e => edit(dd => { dd.detect.auto = e.target.checked; }) } }), ' Fit the levels to each input (start 12 dB, end 18 dB below its peak)')));
  }

  function notesBox() {
    const s = PG.state.settings, c = S.compile(asDesign()), box = h('div.warns');
    for (const n of c.notes) box.append(PG.warnEl({ level: n.level || 'info', text: n.text }));
    if (dry && c.meta.design) {
      const snd = sounds(), I = intended(snd, dry.n * dry.frameDur), P = predict();
      D().blocks.forEach((b, i) => {
        for (const [r, w] of [[b.start, 'start'], [b.end, 'end']]) if ((r.ev === 'on' || r.ev === 'off') && !snd[r.k - 1]) box.append(PG.warnEl({ level: 'warn', text: `Block ${i + 1} ${w}s at sound ${r.k}, but this input has ${snd.length} sound${snd.length === 1 ? '' : 's'} at the current detection levels, so it never ${w}s.` }));
        const iv = I[i], sp = P && P.spans[i];
        if (iv.a !== null && iv.b !== null && sp) {
          const pa = sp.length ? sp[0][0] : null, pb = sp.length ? sp[sp.length - 1][1] : null;
          if (pa === null) box.append(PG.warnEl({ level: 'warn', text: `Block ${i + 1} is predicted never to switch on: Audapter's rules do not reach it on this input. This can happen when an earlier wait outlasts the sound it waits in, so the next "sound ends" rule catches a later sound.` }));
          else if (Math.abs(pa - iv.a) > 0.012 || Math.abs(pb - iv.b) > 0.012) box.append(PG.warnEl({ level: 'info', text: `Block ${i + 1}: drawn ${iv.a.toFixed(3)}–${iv.b.toFixed(3)} s, predicted ${pa.toFixed(3)}–${pb.toFixed(3)} s. Audapter counts an onset only after the hold and an end only after 10 ms of quiet, and timers restart at each detected event.` }));
        }
      });
    }
    box.append(PG.warnEl({ level: 'info', text: 'Rule choice: every "sound ends" rule follows a "sound starts" rule in the same trial, so no rule depends on the previous trial (avoids OST-F1). No maxIOI timeouts (OST-F2) or level-and-ratio rules (OST-F8) are used.' }));
    return h('section.dz-sec', { hidden: !box.children.length }, box);
  }

  function advanced() {
    const s = PG.state.settings, c = S.compile(s);
    const det = h('details.dz-sec.dz-adv', {}, h('summary', { text: 'Show generated OST/PCF (advanced)' }));
    const fill = () => {
      if (det.dataset.filled) return; det.dataset.filled = '1';
      det.append(h('p.ctl-desc', { text: 'Audapter runs the timing as an OST file (online status tracking: a small state machine that follows the level) and a PCF (perturbation configuration: what to change in each state). The design above compiles to these. Import your own files to use them instead ("When": custom).' }),
        PG.ParamsUI.ostEditor());
    };
    det.addEventListener('toggle', () => { advOpen = det.open; if (det.open) fill(); });
    if (advOpen) { det.open = true; fill(); }
    if (!c.ost && s.when.mode !== 'custom') det.append(h('p.muted', { text: 'No OST/PCF is generated for the current Explore settings.' }));
    return det;
  }

  // ---------- experiment schedule (across trials)
  function schedule() {
    const n = sched.base + sched.ramp + sched.hold + sched.wash;
    const f = (k, lab, tip) => h('label.syn', { title: tip }, h('span', { text: lab }), h('input.num.narrow', { type: 'number', min: 0, max: 200, value: sched[k], 'aria-label': lab + ' trials', id: 'sch-' + k, on: { change: e => { sched[k] = Math.max(0, +e.target.value | 0); render(); } } }), h('span.unit', { text: k === 'catchPct' ? '%' : 'trials' }));
    const clipSel = h('div.sch-clips', { hidden: sched.clips !== 'set' }, PG.CLIPS.map(cl => h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: sched.clipIds.includes(cl.id), on: { change: e => { if (e.target.checked) sched.clipIds.push(cl.id); else sched.clipIds = sched.clipIds.filter(x => x !== cl.id); } } }), ` ${cl.label} (${cl.id})`)));
    const radio = (name, v, cur, lab, set) => h('label.tp-opt', {}, h('input', { type: 'radio', name, checked: cur === v, on: { change: () => { set(v); render(); } } }), ' ' + lab);
    const sec = h('section.dz-sec.sched', { id: 'schedule' }, h('h3', { text: 'Across trials: experiment schedule' }),
      h('p.ctl-desc', { text: 'A common adaptation design. Every trial uses the timing above; only the size of the change varies: none in baseline, growing to the full value over the ramp, full in hold, none in washout. Catch trials are randomly chosen ramp or hold trials run without the change.' }),
      h('div.syn-grid', {}, f('base', 'Baseline', 'Trials with no change'), f('ramp', 'Ramp', 'Change grows to the full value'), f('hold', 'Hold', 'Full change'), f('wash', 'Washout', 'No change again'), f('catchPct', 'Catch trials', 'Share of ramp and hold trials run unperturbed')),
      h('div.btnrow', {}, h('span.muted', { text: 'Input' }), radio('sch-in', 'current', sched.clips, 'the current input for every trial', v => { sched.clips = v; }), radio('sch-in', 'set', sched.clips, 'cycle through chosen clips', v => { sched.clips = v; })), clipSel,
      h('div.btnrow', {}, h('span.muted', { text: 'Run as' }), radio('sch-mode', false, sched.session, 'fresh Audapter per trial', v => { sched.session = v; }), radio('sch-mode', true, sched.session, 'one Audapter session (state carries over)', v => { sched.session = v; })),
      h('div.btnrow', {}, h('button.btn.primary', { type: 'button', id: 'sch-run', text: `Create and run ${n} trials`, disabled: !n, on: { click: runSchedule } }), h('span.muted', { text: `About ${Math.max(1, Math.round(n * 0.5))} s.` })));
    const plot = h('div#sched-plot'); sec.append(plot);
    setTimeout(renderSchedPlot, 0);
    return sec;
  }
  function makeSchedule(rng) {
    const out = [], ph = [['baseline', sched.base], ['ramp', sched.ramp], ['hold', sched.hold], ['washout', sched.wash]];
    for (const [name, N] of ph) for (let i = 0; i < N; i++) {
      let f = name === 'ramp' ? (i + 1) / N : name === 'hold' ? 1 : 0, isCatch = false;
      if ((name === 'ramp' || name === 'hold') && sched.catchPct > 0 && rng() * 100 < sched.catchPct) { f = 0; isCatch = true; }
      out.push({ phase: name, idx: i + 1, factor: f, isCatch });
    }
    return out;
  }
  async function runSchedule() {
    const s = PG.state.settings;
    if (!PG.state.input && sched.clips === 'current') return PG.toast('Choose an input first.', 'error');
    const ids = sched.clips === 'set' ? sched.clipIds.slice() : [];
    if (sched.clips === 'set' && !ids.length) return PG.toast('Tick at least one clip.', 'error');
    const inputs = [];
    for (const id of ids) inputs.push(await PG.InputUI.loadClipInput(id));
    if (!inputs.length) inputs.push(PG.state.input);
    const plan = makeSchedule(PG.DSP.rng(Date.now() & 0xffff)), sid = 'S' + (1 + new Set(PG.state.trials.filter(t => t.sched).map(t => t.sched.id)).size);
    lastSchedId = sid;
    const specs = plan.map((p, i) => {
      const x = S.clone(s); x.when.mode = 'design';
      for (const b of x.design.blocks) for (const k of ['f1', 'f2', 'st', 'db']) b.what[k] = +(b.what[k] * p.factor).toFixed(4);
      return { inputId: inputs[i % inputs.length].id, settings: x, name: `${sid} ${p.phase} ${p.idx}${p.isCatch ? ' (catch)' : ''}`, sched: { id: sid, n: i + 1, ...p } };
    });
    schedRes = sid;
    await PG.runSpecs(specs, { kept: true, sequence: sched.session, noCompare: true });
    renderSchedPlot();
    const pl = document.getElementById('sched-plot'); if (pl) pl.scrollIntoView({ block: 'nearest' });
  }
  // Produced vs heard, per trial, in the design's perturbation window.
  function trialMeasure(t) {
    const r = t.result; if (!r) return null;
    const P = new Set((r.compiled && r.compiled.meta && r.compiled.meta.perturbStates) || []), A = r.analysis;
    const w = t.settings.design.blocks[0].what, useF = t.settings.design.blocks.some(b => b.what.f1 || b.what.f2) || !t.settings.design.blocks.some(b => b.what.st || b.what.db);
    const key = useF ? (Math.abs(w.f2) > Math.abs(w.f1) ? 'F2' : 'F1') : t.settings.design.blocks.some(b => b.what.st) ? 'F0' : 'level';
    // "Measured in the output": the SAME independent estimator (LPC for formants, YIN for F0) on input and output over the
    // same voiced frames of the perturbation window, the output read one processing delay later. Its bias cancels in the
    // per-frame ratio out/in, which is applied to the produced value. Too few paired frames: no dot, with the reason.
    const lag = ((r.compiled && r.compiled.meta && r.compiled.meta.latencyMs) || 10) / 1000;
    const prod = [], heard = [], ratio = [];
    for (let i = 0; i < r.ost_stat.length; i++) {
      if (!P.has(r.ost_stat[i])) continue;
      const tt = i / r.frameRate;
      if (key === 'F1' || key === 'F2') {
        const j = key === 'F1' ? 0 : 1, f = r.fmts[j][i]; if (!(f > 0)) continue;
        prod.push(f); heard.push(r.sfmts[j][i] > 0 ? r.sfmts[j][i] : f);
        const a = A.lpcIn.f[j][Math.round(tt / A.lpcIn.hop)], b = A.lpcOut.f[j][Math.round((tt + lag) / A.lpcOut.hop)];
        if (a > 0 && b > 0) ratio.push(b / a);
      } else if (key === 'F0') {
        const a = A.f0In.f0[Math.round(tt / A.f0In.hop)], b = A.f0Out.f0[Math.round((tt + lag) / A.f0Out.hop)];
        if (a > 0) prod.push(a); if (a > 0 && b > 0) ratio.push(b / a);
      } else {
        const a = A.levIn.db[Math.round(tt / A.levIn.hop)], b = A.levOut.db[Math.round((tt + lag) / A.levOut.hop)];
        if (Number.isFinite(a) && a > -60) { prod.push(a); if (Number.isFinite(b)) ratio.push(b - a); }
      }
    }
    const med = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); return v.length ? v[v.length >> 1] : NaN; };
    const p = med(prod), rq = med(ratio);
    let meas = NaN, why = '';
    if (ratio.length < 20) why = `only ${ratio.length} frames where both the input and the output estimate exist`;
    else if (key !== 'level' && !(rq > 0.5 && rq < 2)) why = `the output/input estimate ratio ${rq.toFixed(2)} is implausible`;
    else meas = key === 'level' ? p + rq : p * rq;
    return { key, prod: p, heard: heard.length ? med(heard) : NaN, meas, ratio: rq, pairs: ratio.length, why, frames: prod.length };
  }
  function renderSchedPlot() {
    const el = document.getElementById('sched-plot'); if (!el) return;
    PG.clear(el);
    const all = PG.state.trials.filter(t => t.sched), sid = schedRes || lastSchedId || (all.length ? all[all.length - 1].sched.id : null);
    const T = all.filter(t => t.sched.id === sid && t.result).sort((a, b) => a.sched.n - b.sched.n);
    if (!T.length) { el.append(h('p.muted', { text: 'Run a schedule to see produced and heard values trial by trial here.' })); return; }
    const M = T.map(trialMeasure), key = M[0].key, unit = key === 'level' ? 'dB' : 'Hz';
    const vals = M.flatMap(m => [m.prod, m.heard, m.meas]).filter(Number.isFinite);
    const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.12 || 10;
    const W = Math.max(320, el.clientWidth || 700), Hh = 240, ml = 56, mr = 12, mt = 34, mb = 30;
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    const E = (tag, a, txt) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); if (txt !== undefined) e.textContent = txt; svg.append(e); return e; };
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`); svg.setAttribute('class', 'sched-svg'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Schedule ${sid}: ${key} produced and heard per trial`);
    const x = i => ml + (i + 0.5) / T.length * (W - ml - mr), y = v => mt + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad)) * (Hh - mt - mb);
    // phases as TextGrid-style intervals on top
    let i0 = 0;
    for (let i = 1; i <= T.length; i++) if (i === T.length || T[i].sched.phase !== T[i0].sched.phase) {
      const a = ml + i0 / T.length * (W - ml - mr), b = ml + i / T.length * (W - ml - mr);
      E('rect', { x: a + 1, y: 4, width: Math.max(1, b - a - 2), height: 20, class: T[i0].sched.phase === 'hold' || T[i0].sched.phase === 'ramp' ? 'sp-on' : 'sp-off' });
      E('text', { x: a + 5, y: 18, class: 'sp-lab' }, T[i0].sched.phase);
      if (i < T.length) E('line', { x1: b, x2: b, y1: 4, y2: Hh - mb, class: 'sp-div' });
      i0 = i;
    }
    for (const g of [lo, (lo + hi) / 2, hi]) { E('line', { x1: ml, x2: W - mr, y1: y(g), y2: y(g), class: 'grid' }); E('text', { x: ml - 6, y: y(g) + 4, 'text-anchor': 'end', class: 'ax' }, `${Math.round(g)}`); }
    E('text', { x: 4, y: mt - 6, class: 'ax' }, `${key} (${unit})`);
    M.forEach((m, i) => {
      const t = T[i];
      if (Number.isFinite(m.prod)) E('circle', { cx: x(i), cy: y(m.prod), r: 4, class: 'sd-prod' }).append(Object.assign(document.createElementNS(NS, 'title'), { textContent: `${t.name}: produced ${m.prod.toFixed(0)}` }));
      if (Number.isFinite(m.heard) && key !== 'F0' && key !== 'level') E('circle', { cx: x(i), cy: y(m.heard), r: 4.5, class: 'sd-heard' }).append(Object.assign(document.createElementNS(NS, 'title'), { textContent: `${t.name}: heard target ${m.heard.toFixed(0)}` }));
      if (Number.isFinite(m.meas)) E('circle', { cx: x(i), cy: y(m.meas), r: 3, class: 'sd-meas' }).append(Object.assign(document.createElementNS(NS, 'title'), { textContent: `${t.name}: measured in the output ${m.meas.toFixed(0)}` }));
      if (t.sched.isCatch) E('text', { x: x(i), y: Hh - mb + 14, 'text-anchor': 'middle', class: 'ax' }, 'c');
    });
    E('text', { x: W - mr, y: Hh - 6, 'text-anchor': 'end', class: 'ax' }, `trial 1–${T.length}${T.some(t => t.sched.isCatch) ? '; c = catch trial' : ''}`);
    const est = key === 'F0' ? 'YIN' : key === 'level' ? 'level' : 'LPC';
    const hidden = M.map((m, i) => (Number.isFinite(m.meas) ? null : `${T[i].name}: ${m.why}`)).filter(Boolean);
    el.append(h('div.legend-row', {}, PG.Views.key('indot', `produced ${key} (Audapter's tracking of the input, in the perturbation window)`), key !== 'F0' && key !== 'level' ? PG.Views.key('exp', `heard target (sfmts)`) : null,
      PG.Views.key('obsdot', `measured in the output (independent ${est}, relative to the input)`)), svg,
      h('p.ctl-desc', { text: `The output dot is the produced value times the median ratio of the same ${est} estimate on output and input, over the same voiced frames (output read one processing delay later), so the estimator's own bias cancels. With a recorded input the produced values cannot adapt; the plot shows what Audapter delivered on each trial.` }),
      hidden.length ? h('p.ctl-desc', { text: `No output dot for ${hidden.join('; ')}.` }) : '');
  }
  return { mount, render, ensureDry, predict, sounds, intended, trialMeasure, state: () => ({ dry, sched }) };
})();


/* ---- main.js ---- */
'use strict';
// Page wiring: tabs, run control (auto-run, Run, sweeps, sessions), transport, views, warnings, persistence, test hooks.
(() => {
  const { h, S, $ } = PG;
  const st = PG.state;
  let counter = 0, pending = false, stack = null;

  PG.toast = (msg, kind = 'info') => {
    const t = h(`div.toast.t-${kind}`, { role: kind === 'error' ? 'alert' : 'status', text: msg });
    $('#toasts').append(t); setTimeout(() => t.remove(), kind === 'error' ? 9000 : 4000);
  };

  // ---------------- layout
  function layout() {
    const app = $('#app');
    const tabs = [['explore', 'Explore'], ['design', 'Timing & design'], ['about', 'About']];
    const nav = $('#tabs');
    for (const [k, t] of tabs) nav.append(h('button', { type: 'button', role: 'tab', id: 'tab-' + k, 'aria-controls': 'panel-' + k, 'aria-selected': String(k === 'explore'), text: t, on: { click: () => PG.bus.emit('tab', k) } }));
    $('#theme-btn').addEventListener('click', () => PG.theme.toggle());
    PG.bus.on('tab', k => {
      for (const [x] of tabs) { $('#tab-' + x).setAttribute('aria-selected', String(x === k)); $('#panel-' + x).hidden = x !== k; }
      if (k === 'explore') showView();
    });
    PG.SettingsUI.mount($('#settings'));
    PG.InputUI.mount($('#input-panel'));
    PG.TrialsUI.mount($('#trials'));
    PG.DesignUI.mount($('#panel-design'));
    PG.Compare.mount($('#v-compare'));
    PG.Vowel.mount($('#v-vowel'));
    runBar(); PG.Transport.mount($('#transport')); viewTabs();
    PG.bus.on('engine-stats', s => { $('#mem').textContent = `WASM heap ${PG.fmt.mb(s.lastWasmBytes)}, one instance at a time${s.mode === 'main' ? ' (main thread)' : ''}`; });
  }

  // ---------------- run bar
  function runBar() {
    const bar = $('#runbar');
    const run = h('button.btn.primary.big', { type: 'button', id: 'run-btn', text: 'Run', title: 'Run the current settings on the current input and keep the trial', on: { click: () => runCurrent(true) } });
    const auto = h('label.auto', {}, h('input', { type: 'checkbox', id: 'auto-run', checked: st.autoRun, on: { change: e => { st.autoRun = e.target.checked; if (st.autoRun) schedule(); } } }), ' Update as I change settings');
    const stop = h('button.btn', { type: 'button', id: 'stop-btn', text: 'Stop', hidden: true, on: { click: () => PG.Engine.cancel() } });
    const prog = h('div.progress', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Processing' }, h('div.progress-fill'));
    const status = h('span#run-status.muted', { 'aria-live': 'polite' });
    bar.append(run, auto, stop, prog, status);
    PG.bus.on('run-state', s => {
      stop.hidden = !s.running; prog.hidden = !s.running; run.disabled = !!s.running && !s.canQueue;
      if (s.frac !== undefined) { prog.firstChild.style.width = (100 * s.frac).toFixed(0) + '%'; prog.setAttribute('aria-valuenow', (100 * s.frac).toFixed(0)); }
      if (s.text !== undefined) status.textContent = s.text;
    });
    prog.hidden = true;
  }

  // ---------------- running
  const schedule = PG.debounce(() => { if (st.autoRun && st.input) runCurrent(false); }, 450);
  PG.bus.on('settings', why => { PG.Store.saveSettings(st.settings); updateWarnings(); if (why !== 'noauto') schedule(); });
  PG.bus.on('input', inp => { updateWarnings(); analyseInput(inp); schedule(); });

  function nextName(extra) { counter++; return `T${counter}${extra ? ' ' + extra : ''}`; }
  function recSec(v) { return v === 'full' ? 30 : 10; }

  async function runCurrent(kept) {
    if (!st.input) { PG.toast('Choose an input first: a clip, a synthetic vowel, a recording or a file.'); return; }
    return runSpecs([{ inputId: st.input.id, settings: S.clone(st.settings) }], { kept });
  }
  // specs: [{inputId, settings, name?}]
  // A timeline design's random extra delay is drawn once per trial and stored in that trial's settings (reproducible).
  function resolveJitter(s) {
    const d = s.design;
    if (s.when.mode === 'design' && d && d.jitterMs > 0 && d.blocks[0]) {
      const j = Math.round(Math.random() * d.jitterMs / 10) * 10;
      d.blocks[0].start.ms += j; d.jitterApplied = j; d.jitterMs = 0;
    }
    return s;
  }
  async function runSpecs(specs, { kept = true, sequence = false, clearAbsent = false, sweep = null, noCompare = false } = {}) {
    specs.forEach(sp => resolveJitter(sp.settings));
    const errs = PG.S.warnings(specs[0].settings, S.compile(specs[0].settings), {}).filter(w => w.level === 'error');
    if (errs.length) { PG.bus.emit('run-state', { running: false, text: 'Not run: ' + errs[0].text }); return; }
    if (PG.Engine.busy()) { if (!kept && !sequence && !sweep) { pending = true; return; } PG.toast('A run is in progress; press Stop first or wait.'); return; }
    st.running = true;
    const variant = specs[0].settings.build || 'lite';
    const seq = sequence ? { id: PG.uid(), n: 1 + new Set(st.trials.filter(t => t.seq).map(t => t.seq.id)).size } : null;
    const label = sequence ? `session of ${specs.length} trials` : specs.length > 1 ? `${specs.length} trials` : 'trial';
    PG.bus.emit('run-state', { running: true, frac: 0, text: `Running ${label} on the ${variant === 'lite' ? 'shipped' : variant} build…` });
    const t0 = performance.now(), made = [];
    try {
      const res = await PG.Engine.run({ variant, sequence, clearAbsent,
        trials: specs.map(s => ({ input: st.inputs.get(s.inputId).x, settings: s.settings })),
        onProgress: (i, f) => PG.bus.emit('run-state', { running: true, frac: (i + f) / specs.length }),
        onResult: (i, r) => { made.push(addTrial(specs[i], r, { kept, seq: seq && { ...seq, index: i }, sweep })); PG.bus.emit('run-state', { running: true, text: `Running ${label}: ${made.length} of ${specs.length} done…` }); },
        onError: (i, m) => { PG.toast(`Trial ${i + 1} failed: ${m}`, 'error'); },
      });
      const ms = performance.now() - t0, last = made[made.length - 1];
      PG.bus.emit('run-state', { running: false, text: last ? `${last.name}: ${last.summary}. ${ms < 1000 ? ms.toFixed(0) + ' ms' : (ms / 1000).toFixed(1) + ' s'}${res.errors.length ? `, ${res.errors.length} failed` : ''}.` : 'No result.' });
    } catch (e) {
      PG.bus.emit('run-state', { running: false, text: e.cancelled ? 'Stopped.' : '' });
      if (!e.cancelled) PG.toast(e.message, 'error');
      if (e.hang) for (let i = made.length; i < specs.length; i++) addFailed(specs[i], e.message, seq && { ...seq, index: i });
    } finally {
      st.running = false;
      if (!noCompare && (made.length > 1 || sequence)) { made.forEach(t => st.selected.add(t.id)); if (sequence) PG.Compare.setLayout('timeline'); PG.bus.emit('trials'); PG.bus.emit('view', 'compare'); }
      if (pending) { pending = false; schedule(); }
    }
    return made;
  }
  PG.runSpecs = runSpecs;
  function addTrial(spec, r, { kept, seq, sweep }) {
    // an automatic run replaces the previous draft
    if (!kept) { const i = st.trials.findIndex(t => !t.kept && !t.seq); if (i >= 0) { st.selected.delete(st.trials[i].id); st.trials.splice(i, 1); } }
    const inp = st.inputs.get(spec.inputId);
    const t = { id: PG.uid(), name: spec.name || nextName(sweep ? `(${sweep})` : ''), created: Date.now(), kept, tags: sweep ? ['sweep'] : spec.sched ? ['schedule', spec.sched.phase] : [], notes: '', sched: spec.sched || null, inputId: spec.inputId, inputLen: inp.x.length,
      settings: spec.settings, summary: S.summarize(spec.settings), variant: spec.settings.build || 'lite', seq, result: r };
    st.trials.push(t); st.currentId = t.id;
    if (kept) PG.Store.saveTrial(t);
    PG.bus.emit('trials'); PG.bus.emit('current');
    return t;
  }
  function addFailed(spec, msg, seq) {
    const t = { id: PG.uid(), name: nextName('(hung)'), created: Date.now(), kept: false, tags: [], notes: msg, inputId: spec.inputId, inputLen: st.inputs.get(spec.inputId).x.length,
      settings: spec.settings, summary: S.summarize(spec.settings), variant: spec.settings.build, seq, result: null, error: msg, hang: true };
    st.trials.push(t); PG.bus.emit('trials');
  }

  // sweep: one control across several values, each a fresh trial
  PG.bus.on('sweep', ({ control, values }) => {
    if (!st.input) return PG.toast('Choose an input first.');
    const specs = values.map(v => { const s = S.clone(st.settings); if (control.param) s.listen[control.param] = v; else S.setPath(s, control.path, v);
      if (control.card) S.setPath(s, control.card.on, true); return { inputId: st.input.id, settings: s, sweepLabel: `${control.label} ${v}` }; });
    st.selected.clear();
    runSweep(specs);
  });
  async function runSweep(specs) {
    const made = [];
    for (const s of specs) { const m = await runSpecs([s], { kept: true, sweep: s.sweepLabel }); if (!m) break; made.push(...m); }
    st.selected.clear(); made.forEach(t => st.selected.add(t.id)); PG.Compare.setLayout('grid'); PG.bus.emit('trials'); PG.bus.emit('view', 'compare');
  }
  // same-session sequence of the ticked trials (their inputs and settings, in list order)
  PG.bus.on('run-sequence', ids => {
    const T = st.trials.filter(t => ids.includes(t.id)).sort((a, b) => a.created - b.created);
    const variants = new Set(T.map(t => t.settings.build || 'lite'));
    if (variants.size > 1) return PG.toast('The ticked trials use different Audapter builds; a session runs on one build.', 'error');
    const fr = new Set(T.map(t => { const m = S.compile(t.settings).meta; return m.frameLen + '/' + m.nDelay; }));
    const ws = PG.S.warnings(T[0].settings, S.compile(T[T.length - 1].settings), { sequence: true, frameChange: fr.size > 1 }).filter(w => w.where === 'run' || w.id === 'OST-F1' || w.id === 'OST-F2');
    for (const w of ws) if (w.level !== 'info') PG.toast(`${w.id ? w.id + ': ' : ''}${w.text}`, 'error');
    const loads = T.map(t => S.compile(t.settings).ost !== null);
    if (loads.some((l, i) => l && loads.slice(i + 1).some(x => !x))) PG.toast('COORD-1: an earlier trial in this session loads an OST/PCF and a later one does not; the later trial keeps the earlier OST/PCF, as in MATLAB.', 'error');
    st.selected.clear();
    runSpecs(T.map(t => ({ inputId: t.inputId, settings: S.clone(t.settings), name: `${t.name} in session` })), { kept: true, sequence: true });
  });

  // ---------------- vowel variability: resolve the field centre (median of the input, or of the ticked trials)
  const med = a => PG.median(Array.from(a).filter(v => v > 0));
  async function resolveCentre() {
    const F = st.settings.shift.formant; if (!F.on || F.field !== 'variability') return;
    let c = null;
    if (F.vari.centre === 'auto' && st.input) {
      try { const d = await PG.Engine.dryRun(st.input, st.settings); c = [med(d.fmts[0]), med(d.fmts[1])]; } catch { return; }
    } else if (F.vari.centre === 'trials') {
      const T = st.trials.filter(t => st.selected.has(t.id) && t.result);
      if (!T.length) return;
      c = [PG.median(T.map(t => med(t.result.fmts[0]))), PG.median(T.map(t => med(t.result.fmts[1])))];
    }
    if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) return;
    const v = st.settings.shift.formant.vari;
    if (Math.abs(v.c1 - c[0]) > 0.5 || Math.abs(v.c2 - c[1]) > 0.5) PG.editSettings(x => { x.shift.formant.vari.c1 = Math.round(c[0] * 10) / 10; x.shift.formant.vari.c2 = Math.round(c[1] * 10) / 10; }, 'centre');
  }
  PG.bus.on('settings', why => { if (why !== 'centre') resolveCentre(); });
  PG.bus.on('input', () => resolveCentre());
  PG.bus.on('selection', () => { if (st.settings.shift.formant.vari.centre === 'trials') resolveCentre(); });
  PG.resolveCentre = resolveCentre;

  // ---------------- synthetic vowel cloud: N tokens with random F1/F2 around a vowel, optional unshifted baseline pass
  PG.bus.on('cloud', async o => {
    const R = PG.DSP.rng(o.seed || (Date.now() & 0xffff)), g = () => { const u = Math.max(R(), 1e-9), v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const n = new Set(st.trials.filter(t => t.cloud).map(t => t.cloud)).size + 1, ids = [];
    for (let k = 0; k < o.n; k++) {
      const f1 = o.f1 + o.sd1 * g(), f2 = o.f2 + o.sd2 * g();
      const x = PG.DSP.synthVowel({ dur: o.dur, onset: 0.1, offset: o.dur - 0.1, f0: o.f0 * Math.pow(2, 0.03 * g()), formants: [f1, f2, o.f3, o.f3 + 900], level: -20, seed: k + 1 });
      const inp = { id: PG.uid(), kind: 'synth', label: `Cloud ${n} token ${k + 1} (F1 ${Math.round(f1)}, F2 ${Math.round(f2)} Hz synthesised)`, x, meta: { synth: { f1, f2 } } };
      st.inputs.set(inp.id, inp); ids.push(inp.id);
    }
    const tag = (arr, phase) => arr.forEach(t => { t.cloud = n; t.tags = [...(t.tags || []), 'cloud ' + n, phase]; PG.Store.saveTrial(t); });
    if (o.baseline) {
      const base = S.clone(st.settings); base.shift.formant.on = false; base.when.mode = 'always';
      const made = await runSpecs(ids.map((id, k) => ({ inputId: id, settings: S.clone(base), name: `C${n} baseline ${k + 1}` })), { kept: true, noCompare: true });
      if (!made) return;
      tag(made, 'baseline');
      const c = [PG.median(made.map(t => med(t.result.fmts[0]))), PG.median(made.map(t => med(t.result.fmts[1])))];
      PG.editSettings(x => { const v = x.shift.formant.vari; v.c1 = Math.round(c[0] * 10) / 10; v.c2 = Math.round(c[1] * 10) / 10; v.centre = 'manual'; }, 'noauto');
      PG.toast(`Vowel centre set from the baseline tokens: F1 ${Math.round(c[0])}, F2 ${Math.round(c[1])} Hz.`);
    }
    const made = await runSpecs(ids.map((id, k) => ({ inputId: id, settings: S.clone(st.settings), name: `C${n} token ${k + 1}` })), { kept: true, noCompare: true });
    if (!made) return;
    tag(made, 'shifted');
    st.selected.clear(); made.forEach(t => st.selected.add(t.id));
    PG.Vowel.setMode('tokens'); PG.bus.emit('trials'); PG.bus.emit('view', 'vowel');
  });

  // ---------------- warnings (settings + input context)
  function updateWarnings() {
    const s = st.settings, c = S.compile(s);
    const ctx = { f0: st.input && st.input.f0med, dur: st.input ? st.input.x.length / 48000 : 0, recorderSec: recSec(s.build) };
    PG.bus.emit('warnings', S.warnings(s, c, ctx));
  }
  function analyseInput(inp) {
    if (!inp || inp.f0med !== undefined) return;
    setTimeout(() => {
      const x = inp.x, n = Math.floor(x.length / 3), y = new Float64Array(n);
      for (let i = 0; i < n; i++) y[i] = (x[3 * i] + x[3 * i + 1] + x[3 * i + 2]) / 3;
      inp.f0med = PG.median(PG.DSP.yin(y, 16000, { hop: 0.01 }).f0) || null;
      if (inp === st.input) updateWarnings();
    }, 30);
  }

  // ---------------- views
  function viewTabs() {
    const tabs = [['spectro', 'Spectrograms'], ['pitch', 'Pitch and level'], ['vowel', 'Vowel space'], ['compare', 'Compare']];
    const bar = $('#viewtabs');
    for (const [k, t] of tabs) bar.append(h('button', { type: 'button', role: 'tab', id: 'vt-' + k, 'aria-selected': String(k === st.view), text: t, on: { click: () => PG.bus.emit('view', k) } }));
    const zoom = h('div.zoom', { role: 'group', 'aria-label': 'Time zoom' },
      h('button.icon', { type: 'button', 'aria-label': 'Zoom in', text: '+', on: { click: () => PG.Tiers.zoomBy(0.5) } }),
      h('button.icon', { type: 'button', 'aria-label': 'Zoom out', text: '−', on: { click: () => PG.Tiers.zoomBy(2) } }),
      h('button.icon.wide', { type: 'button', text: 'Fit', on: { click: () => PG.Tiers.fit() } }));
    bar.append(zoom);
    PG.bus.on('view', k => { st.view = k; for (const [x] of tabs) $('#vt-' + x).setAttribute('aria-selected', String(x === k)); showView(); });
    PG.bus.on('current', () => showView());
    PG.bus.on('show-trial', id => { st.currentId = id; PG.bus.emit('current'); if (st.view === 'compare') PG.bus.emit('view', 'spectro'); });
    PG.bus.on('selection', () => { if (st.view === 'compare') showView(); });
  }
  function showView() {
    const k = st.view, t = PG.current();
    for (const v of ['tiers', 'vowel', 'compare']) $('#v-' + v).hidden = !((v === 'tiers' && (k === 'spectro' || k === 'pitch')) || v === k);
    $('.zoom').hidden = k === 'vowel';
    if (stack) { stack.destroy(); stack = null; }
    const holder = $('#v-tiers'); PG.clear(holder);
    const nums = $('#numbers'); PG.clear(nums);
    PG.Transport.render();
    if (k === 'compare') { PG.Compare.render(); return; }
    if (!t || !t.result) {
      const msg = t && t.error ? `This trial did not finish: ${t.error}` : 'Choose an input. The current settings then run automatically, and the result appears here.';
      if (k === 'vowel') PG.Vowel.setTrial(null);
      holder.append(h('p.empty', { text: msg }));
      return;
    }
    if (k === 'vowel') { PG.Vowel.setTrial(t); }
    else {
      PG.Tiers.setDuration(t.inputLen / 48000, true);
      holder.append(h('div.trial-title', {}, h('b', { text: t.name }), h('span', { text: ' ' + t.summary }), t.kept ? null : h('span.badge.draft', { text: 'draft' }),
        h('span.muted', { text: `  ${(st.inputs.get(t.inputId) || {}).label || ''}` })));
      stack = PG.Tiers.Stack(holder, { tiers: PG.Views.tiersFor(t, k) });
      holder.append(h('p.hint', { text: 'Hover for values. Click to set where playback starts; drag to pan; ctrl + wheel or the + / − buttons to zoom; double-click to fit.' }));
    }
    nums.append(h('details', {}, h('summary', { text: 'Numbers behind this view' }),
      h('table.plain', {}, h('tbody', {}, PG.Views.numbers(t).map(([a, b]) => h('tr', {}, h('th', { text: a }), h('td', { text: b }))))),
      h('div.btnrow', {},
        h('button.linkish', { type: 'button', text: 'Download output WAV', on: { click: () => PG.Store.download(new Blob([PG.DSP.encodeWav(t.result.output, 48000, { float: true })], { type: 'audio/wav' }), `${t.name}-output.wav`) } }),
        h('button.linkish', { type: 'button', text: 'Download data (JSON)', on: { click: () => PG.Store.download(PG.Store.exportSession([t]), `${t.name}.zip`) } }))));
  }

  // ---------------- session persistence
  PG.bus.on('export-session', () => { const T = st.trials.filter(t => t.result && (t.kept || st.selected.has(t.id))); PG.Store.download(PG.Store.exportSession(T), `audapter-playground-session-${new Date().toISOString().slice(0, 10)}.zip`); });
  PG.bus.on('import-session', async u8 => {
    try {
      const { inputs, trials } = await PG.Store.importSession(u8);
      for (const [k, v] of inputs) st.inputs.set(k, v);
      await attachAnalysis(trials);
      for (const t of trials) { t.inputLen = st.inputs.get(t.inputId).x.length; st.trials.push(t); PG.Store.saveTrial(t); }
      counter += trials.length;
      if (trials.length) st.currentId = trials[trials.length - 1].id;
      PG.bus.emit('trials'); PG.bus.emit('current'); PG.toast(`Imported ${trials.length} trials.`);
    } catch (e) { PG.toast('Import failed: ' + e.message, 'error'); }
  });
  async function attachAnalysis(trials) {
    const need = trials.filter(t => t.result && !t.result.analysis);
    if (!need.length) return;
    const an = await PG.Engine.analyse(need.map(t => ({ input: st.inputs.get(t.inputId).x, result: t.result })));
    need.forEach((t, i) => { t.result.analysis = an[i]; });
  }
  async function restore() {
    const hashS = PG.Store.settingsFromHash();
    const saved = await PG.Store.load();
    for (const i of saved.inputs) st.inputs.set(i.id, i);
    const T = saved.trials.filter(t => st.inputs.has(t.inputId));
    for (const t of T) { t.inputLen = st.inputs.get(t.inputId).x.length; st.trials.push(t); }
    counter = T.reduce((m, t) => Math.max(m, +(/^T(\d+)/.exec(t.name) || [0, 0])[1]), 0);
    if (hashS) PG.setSettings(hashS, 'load'); else if (saved.settings) PG.setSettings(saved.settings, 'load');
    if (T.length) { st.currentId = T[T.length - 1].id; const inp = st.inputs.get(T[T.length - 1].inputId); st.input = inp; PG.bus.emit('input-quiet', inp); }
    PG.bus.emit('trials'); PG.bus.emit('current');
    return T.length;
  }

  // keyboard: space play/stop, x switch A/B, o original, p processed
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('#panel-explore') || $('#panel-explore').hidden) return;
    if (e.key === ' ') { e.preventDefault(); PG.Audio.playing() ? PG.Audio.stop() : PG.Transport.play('out'); }
    else if (e.key === 'x' || e.key === 'X') PG.Transport.toggle();
    else if (e.key === 'o') PG.Transport.play('in');
    else if (e.key === 'p') PG.Transport.play('out');
  });

  // ---------------- start
  async function start() {
    PG.theme.init();
    layout();
    const had = await restore();
    PG.bus.on('input-quiet', () => {});
    PG.InputUI.render();
    updateWarnings();
    PG.Engine.prewarm(st.settings.build);
    if (!had && !st.input) {
      const first = PG.CLIPS.find(c => c.id === 'arctic_slt_a0030') || PG.CLIPS[0];
      if (first) PG.InputUI.loadClip(first.id).catch(e => PG.toast(e.message, 'error'));
    }
    showView();
  }

  // Test hooks (used by audit/playground/test/run.mjs); harmless in normal use.
  self.PG_TEST = {
    runAndWait: async (kept = true) => { const m = await runSpecs([{ inputId: st.input.id, settings: S.clone(st.settings) }], { kept }); return m && m[0] && m[0].id; },
    idle: () => !PG.Engine.busy() && !st.running,
    trial: id => { const t = PG.trial(id); if (!t) return null; const r = t.result, inp = st.inputs.get(t.inputId);
      return { name: t.name, settings: t.settings, compiled: S.compile(t.settings).list.map(([k, v]) => [k, Array.isArray(v) ? Array.from(v) : v]), ost: S.compile(t.settings).ost, pcf: S.compile(t.settings).pcf,
        input: Array.from(inp.x), output: Array.from(r.output), fmts: r.fmts.map(a => Array.from(a)), sfmts: r.sfmts.map(a => Array.from(a)), ost_stat: Array.from(r.ost_stat), info: r.info }; },
    stats: () => PG.Engine.stats,
    // design check: predicted (OST replay on the dry run) vs logged on-frames for the current trial
    designCheck: id => {
      const t = PG.trial(id), r = t.result, P = new Set(r.compiled.meta.perturbStates);
      const pred = PG.DesignUI.predict(); if (!pred) return null;
      const n = Math.min(pred.states.length, r.ost_stat.length);
      let stateMis = 0, predOn = 0, logOn = 0, onMis = 0, shiftOutside = 0, shiftIn = 0, trackedIn = 0;
      for (let i = 0; i < n; i++) {
        const a = P.has(pred.states[i]), b = P.has(r.ost_stat[i]);
        if (pred.states[i] !== r.ost_stat[i]) stateMis++; if (a) predOn++; if (b) logOn++; if (a !== b) onMis++;
        const sh = r.sfmts[0][i] > 0 && (Math.abs(r.sfmts[0][i] - r.fmts[0][i]) > 0.5 || Math.abs(r.sfmts[1][i] - r.fmts[1][i]) > 0.5);
        if (sh && !a) shiftOutside++; if (sh && a) shiftIn++; if (a && r.fmts[0][i] > 0) trackedIn++;
      }
      const spans = pred.spans.map(sp => sp.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]));
      return { n, stateMis, predOn, logOn, onMis, shiftOutside, shiftIn, trackedIn, spans, frameDur: r.compiled.meta.frameLen / r.compiled.meta.sr };
    },
    setAutoRun: on => { st.autoRun = on; const c = $('#auto-run'); if (c) c.checked = on; },
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();

// ---------------- transport: original / processed / A/B, loop, level match, loud-output warning
PG.Transport = (() => {
  const { h } = PG;
  let root, loop = false, match = false, pair = null;
  const LIMIT = 0.89;   // -1 dBFS
  function mount(el) { root = el; render(); PG.bus.on('play', () => sync()); PG.bus.on('current', render); }
  function gains(tracks) {
    const g = tracks.map(() => 1), notes = [];
    if (match && tracks.length) { const ref = PG.DSP.activeRms(tracks[0].x) || 1; tracks.forEach((t, i) => { const a = PG.DSP.activeRms(t.x); if (a) g[i] = ref / a; }); }
    tracks.forEach((t, i) => { const pk = PG.DSP.peak(t.x) * g[i]; if (pk > LIMIT) { g[i] *= LIMIT / pk; notes.push(`${t.label} turned down ${(20 * Math.log10(pk / LIMIT)).toFixed(1)} dB to stay below −1 dBFS`); } });
    return { g, notes };
  }
  function range() { const z = PG.Tiers.zoom, c = PG.Tiers.cursor(); const from = c !== null && c >= z.t0 && c < z.t1 ? c : z.t0; return { from, to: z.t1 < z.dur - 1e-6 || loop ? z.t1 : null }; }
  function start(tracks, which = 0) {
    const { g, notes } = gains(tracks);
    tracks.forEach((t, i) => { t.gain = g[i]; });
    const r = range();
    PG.Audio.play(tracks, { which, loop, from: r.from, to: r.to });
    const n = root && root.querySelector('.tp-note');
    if (n) n.textContent = [match && tracks.length > 1 ? `Level-matched: ${tracks.slice(1).map((t, i) => `${t.label} ${PG.fmt.db(20 * Math.log10(g[i + 1] / g[0]))}`).join(', ')} relative to ${tracks[0].label}` : '', ...notes].filter(Boolean).join('. ');
  }
  function current() { const t = PG.current(); return t && t.result ? t : null; }
  function play(kind) {
    const t = current(); if (!t) return;
    const inp = PG.state.inputs.get(t.inputId).x, tr = [{ x: inp, label: 'original' }, { x: t.result.output, label: 'processed' }];
    pair = null;
    start(tr, kind === 'in' ? 0 : 1);
  }
  function playPair(a, b) {
    pair = [a, b];
    start([{ x: a.x, label: 'A' }, { x: b.x, label: 'B' }], 0);
  }
  function toggle() { const p = PG.Audio.playing(); if (p) p.toggle(); }
  function sync() {
    if (!root) return;
    const p = PG.Audio.playing();
    root.querySelectorAll('[data-k]').forEach(b => b.setAttribute('aria-pressed', String(!!p && ((b.dataset.k === 'in' && !pair && p.which === 0) || (b.dataset.k === 'out' && !pair && p.which === 1)))));
    const sw = root.querySelector('.tp-switch'); if (sw) { sw.disabled = !p; sw.textContent = p ? (pair ? `Now: ${p.which ? 'B' : 'A'}. Switch (X)` : `Now: ${p.which ? 'processed' : 'original'}. Switch (X)`) : 'Switch (X)'; }
  }
  function render() {
    if (!root) return;
    PG.clear(root);
    const t = current(), A = t && t.result.analysis;
    const warn = [];
    if (A && A.outPeak >= 0.999) warn.push(`The output clips (peak ${A.outPeak.toFixed(2)}).`);
    if (A && A.burstDb > 20) warn.push(`Loud burst: a 20 ms stretch is ${A.burstDb.toFixed(0)} dB above the average level.`);
    root.append(
      h('button.btn', { type: 'button', 'data-k': 'in', text: 'Play original', disabled: !t, on: { click: () => play('in') } }),
      h('button.btn.primary', { type: 'button', 'data-k': 'out', text: 'Play processed', disabled: !t, on: { click: () => play('out') } }),
      h('button.btn.tp-switch', { type: 'button', text: 'Switch (X)', disabled: true, on: { click: toggle } }),
      h('button.btn', { type: 'button', text: 'Stop', on: { click: () => PG.Audio.stop() } }),
      h('label.tp-opt', {}, h('input', { type: 'checkbox', checked: loop, on: { change: e => { loop = e.target.checked; } } }), ' Loop'),
      h('label.tp-opt', { title: 'Scale playback so both have the same average level (active RMS). Off plays true levels.' }, h('input', { type: 'checkbox', checked: match, on: { change: e => { match = e.target.checked; } } }), ' Level-match'),
      warn.length ? h('div.warn.w-warn.tp-loud', {}, h('span.w-glyph'), h('span.w-lvl', { text: 'Loud' }), h('span.w-text', { text: warn.join(' ') + ' Playback is capped at −1 dBFS peak.' })) : '',
      h('p.tp-note.muted', { 'aria-live': 'polite' }));
    sync();
  }
  return { mount, render, play, playPair, toggle };
})();
