import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright-core');
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const p = await b.newPage(); await p.goto('data:text/html,x');
console.log(JSON.stringify(await p.evaluate(async () => {
  const res = {};
  const ctx = new AudioContext({ sampleRate: 48000 }); const osc = ctx.createOscillator(); const dst = ctx.createMediaStreamDestination(); osc.connect(dst); osc.start();
  const track = dst.stream.getAudioTracks()[0];
  for (const local of [false, true]) {
    res['local=' + local] = await new Promise(resolve => {
      const r = new SpeechRecognition(); r.lang = 'en-US'; if (local) r.processLocally = true;
      const ev = []; const done = x => resolve({ events: ev, ...x });
      r.onstart = () => ev.push('start'); r.onaudiostart = () => ev.push('audiostart'); r.onerror = e => done({ error: e.error, message: e.message }); r.onend = () => done({ end: true });
      try { r.start(track); } catch (e) { done({ threw: String(e) }); }
      setTimeout(() => { try { r.stop(); } catch {} ; setTimeout(() => done({ timeout: true }), 500); }, 3000);
    });
  }
  return res;
})));
await b.close();
