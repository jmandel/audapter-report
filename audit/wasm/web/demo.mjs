// Main-thread side of the browser Audapter demo: mic -> AudioWorklet(Audapter WASM) -> output.
// Exposes window.app for automation (test/browser.mjs).
const $ = id => document.getElementById(id);
const S = { ctx: null, node: null, stream: null, chunks: [], rows: [], times: [], underruns: 0, frameSize: 96, ready: null, log: null };

export function shiftCmds(f1pct, f2pct) {
  const amp = Math.hypot(f1pct, f2pct) / 100, phi = Math.atan2(f2pct, f1pct);
  return [{ op: 'set', name: 'pertamp', value: new Array(257).fill(amp) }, { op: 'set', name: 'pertphi', value: new Array(257).fill(phi) }];
}
export function pitchCmds(st) {
  return st === 0 ? [{ op: 'set', name: 'bpitchshift', value: 0 }]
    : [{ op: 'set', name: 'bpitchshift', value: 1 }, { op: 'set', name: 'pitchshiftratio', value: 2 ** (st / 12) }];
}

async function start({ sampleRate = 48000, latencyHint = 0, extraOverrides = {} } = {}) {   // latencyHint 0 = smallest buffer the browser allows
  if (S.ctx) await stop();
  const wasmBytes = await fetch('../dist/audapter-lite.wasm').then(r => r.arrayBuffer());
  // blab getAudapterDefaultParams('female') + a 1-D ratio perturbation field (as in harness t_fmt_shift.m) with zero shift
  const g = Array.from({ length: 257 }, (_, i) => i * 5000 / 256);
  const overrides = { bShift: 1, bRatioShift: 1, bMelShift: 0, F1Min: 0, F1Max: 5000, F2Min: 0, F2Max: 5000, LBk: 0, LBb: 0,
    pertF1: g, pertF2: g, pertAmp: new Array(257).fill(0), pertPhi: new Array(257).fill(0),
    rmsThresh: Number($('rms').value), ...extraOverrides };
  S.stream = await navigator.mediaDevices.getUserMedia({ audio: {
    echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1, sampleRate } });
  S.ctx = new AudioContext({ sampleRate, latencyHint });
  await S.ctx.audioWorklet.addModule('./worklet.mjs');
  const src = S.ctx.createMediaStreamSource(S.stream);
  S.chunks = []; S.rows = []; S.times = []; S.underruns = 0; S.log = null;
  S.node = new AudioWorkletNode(S.ctx, 'audapter', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2],
    channelCount: 1, channelCountMode: 'explicit', processorOptions: { wasmBytes, sex: 'female', overrides } });
  S.ready = new Promise((resolve, reject) => {
    S.node.port.onmessage = e => {
      const m = e.data;
      if (m.type === 'ready') { S.info = m; S.frameSize = m.frameSize; resolve(m); }
      else if (m.type === 'error') { $('status').textContent = 'worklet error: ' + m.message; reject(new Error(m.message)); }
      else if (m.type === 'chunk') onChunk(m);
      else if (m.type === 'log') S.log = m;
    };
  });
  src.connect(S.node).connect(S.ctx.destination);
  await S.ready;
  await S.ctx.resume();
  sendCurrentControls();
  const tr = S.stream.getAudioTracks()[0].getSettings();
  S.info = { ...S.info, baseLatency: S.ctx.baseLatency, outputLatency: S.ctx.outputLatency, ctxRate: S.ctx.sampleRate, track: tr };
  $('status').textContent = `running: ctx ${S.ctx.sampleRate} Hz, frame ${S.frameSize}, FIFO prefill ${S.info.prefill} samples, ` +
    `baseLatency ${(S.ctx.baseLatency * 1000).toFixed(1)} ms, outputLatency ${(S.ctx.outputLatency * 1000).toFixed(1)} ms, wasm mem ${S.info.memMB.toFixed(0)} MB`;
  requestAnimationFrame(draw);
  return S.info;
}

async function stop() {
  if (!S.ctx) return;
  S.stream.getTracks().forEach(t => t.stop());
  await S.ctx.close();
  S.ctx = null;
}

function send(cmds) { if (S.node) S.node.port.postMessage({ type: 'cmds', cmds }); }
function sendCurrentControls() {
  send([...shiftCmds(Number($('f1').value), Number($('f2').value)), ...pitchCmds(Number($('pitch').value)),
    { op: 'bypass', on: $('bypass').checked }]);
}

function onChunk(m) {
  S.chunks.push(m); S.underruns = m.underruns;
  for (let k = 0; k < m.n; k++) { S.rows.push(m.rows.subarray(k * 6, k * 6 + 6)); S.times.push(m.t[k]); }
}

function draw() {
  if (!S.ctx) return;
  const cv = $('tracks'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const fps = S.ctx.sampleRate / S.frameSize, nShow = Math.round(5 * fps), rows = S.rows.slice(-nShow);
  g.fillStyle = '#fbfaf7'; g.fillRect(0, 0, W, H);
  const fmax = 3000, y = f => H - 20 - (f / fmax) * (H - 30);
  g.strokeStyle = '#e4e1da'; g.fillStyle = '#8a8579'; g.font = '11px system-ui';
  for (let f = 0; f <= fmax; f += 500) { g.beginPath(); g.moveTo(40, y(f)); g.lineTo(W, y(f)); g.stroke(); g.fillText(f + ' Hz', 2, y(f) + 4); }
  const x = i => 40 + (i + nShow - rows.length) / nShow * (W - 40);
  const dot = (col, color) => { g.fillStyle = color; rows.forEach((r, i) => { if (r[col] > 0) g.fillRect(x(i), y(r[col]) - 1, 2, 2); }); };
  dot(1, '#9aa7b8'); dot(2, '#9aa7b8');          // tracked F1, F2 (heard input)
  dot(3, '#c2410c'); dot(4, '#1d4ed8');          // shifted targets sF1, sF2
  const t = S.times.slice(-2000), mean = t.reduce((a, b) => a + b, 0) / (t.length || 1), mx = Math.max(0, ...t);
  $('perf').textContent = `per-frame cost in worklet: mean ${(mean * 1000).toFixed(0)} us, max ${(mx * 1000).toFixed(0)} us ` +
    `(budget ${(S.frameSize / S.ctx.sampleRate * 1e6).toFixed(0)} us); FIFO underruns ${S.underruns}; frames ${S.rows.length}`;
  requestAnimationFrame(draw);
}

function concat(key) {
  const n = S.chunks.reduce((a, c) => a + c[key].length, 0), out = new Float32Array(n);
  let o = 0; for (const c of S.chunks) { out.set(c[key], o); o += c[key].length; }
  return out;
}
function wav(chs, rate) {
  const n = chs[0].length, nc = chs.length, buf = new ArrayBuffer(44 + n * nc * 4), v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * nc * 4, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 3, true);
  v.setUint16(22, nc, true); v.setUint32(24, rate, true); v.setUint32(28, rate * nc * 4, true); v.setUint16(32, nc * 4, true);
  v.setUint16(34, 32, true); w(36, 'data'); v.setUint32(40, n * nc * 4, true);
  for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < nc; c++, o += 4) v.setFloat32(o, chs[c][i], true);
  return new Blob([buf], { type: 'audio/wav' });
}
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); }

async function getLog() {
  S.node.port.postMessage({ type: 'getLog' });
  for (let i = 0; i < 100 && !S.log; i++) await new Promise(r => setTimeout(r, 20));
  const l = S.log; S.log = null; return l;
}

// Automation API
window.app = {
  start, stop, send, shiftCmds, pitchCmds, getLog,
  info: () => S.info,
  recording: () => ({ inp: Array.from(concat('inp')), out: Array.from(concat('out')), rows: S.rows.map(r => Array.from(r)),
    times: S.times, startFrame: S.chunks.length ? S.chunks[0].startFrame : 0, frameSize: S.frameSize, underruns: S.underruns }),
  frames: () => S.rows.length,
};

$('start').onclick = () => start().catch(e => { $('status').textContent = 'error: ' + e.message; });
$('stop').onclick = () => stop();
for (const id of ['f1', 'f2', 'pitch']) $(id).oninput = () => { $(id + 'v').textContent = $(id).value; sendCurrentControls(); };
$('bypass').onchange = sendCurrentControls;
$('rms').onchange = () => send([{ op: 'set', name: 'rmsthr', value: Number($('rms').value) }]);
$('dl').onclick = () => download(wav([concat('inp'), concat('out')], S.ctx ? S.ctx.sampleRate : 48000), 'audapter-in-L-out-R.wav');
$('dlcsv').onclick = () => {
  const lines = ['frame,rms,F1,F2,sF1,sF2,ost_stat', ...S.rows.map((r, i) => [i, ...r].join(','))];
  download(new Blob([lines.join('\n')], { type: 'text/csv' }), 'audapter-tracks.csv');
};
