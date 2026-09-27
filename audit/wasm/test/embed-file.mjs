// Open examples/embed.html from file:// in headless Chromium and check the buggy/patched results.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const W = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(path.join(W, '..', 'scratch', 'wasm', 'package.json'))('playwright-core');
const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/chromium', headless: true });
const p = await b.newPage();
const t0 = Date.now();
await p.goto(pathToFileURL(path.join(W, 'examples', 'embed.html')).href);
await p.waitForFunction(() => window.embedResults, null, { timeout: 120000 });
const r = await p.evaluate(() => window.embedResults);
console.log(JSON.stringify(r, null, 1), `\n(${Date.now() - t0} ms incl. page load)`);
const ok = !r.error && Object.values(r)[0].patched === '0.202 / 0.202 / 0.202 s' && Object.values(r)[0].lite !== Object.values(r)[0].patched
  && Number(Object.values(r)[1].patched) > 0.02 && Number(Object.values(r)[1].lite) < 0.01;
console.log(ok ? 'PASS embed example from file://' : 'FAIL embed example');
await b.close();
process.exitCode = ok ? 0 : 1;
