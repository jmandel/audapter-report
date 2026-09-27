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
