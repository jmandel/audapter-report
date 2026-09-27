import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright-core');
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const p = await b.newPage(); await p.goto('data:text/html,x');
console.log(JSON.stringify(await p.evaluate(async () => {
  const out = [];
  for (const sr of [48000, 44100]) for (const h of ['interactive', 'balanced', 'playback', 0, 0.001]) {
    const c = new AudioContext({ sampleRate: sr, latencyHint: h }); await c.resume(); await new Promise(r => setTimeout(r, 200));
    out.push({ sr, hint: h, base_ms: +(c.baseLatency * 1000).toFixed(2), out_ms: +(c.outputLatency * 1000).toFixed(2) }); await c.close();
  }
  return out;
})));
await b.close();
