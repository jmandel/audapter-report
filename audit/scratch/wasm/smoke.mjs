import createAudapter from '../../wasm/dist/audapter-full.mjs';
import { AudapterWasm } from '../../wasm/web/audapter-api.mjs';
const t0 = performance.now();
const a = await AudapterWasm.create(createAudapter);
console.log('create ms', performance.now() - t0, 'sizeof', a.sizeofAudapter(), 'mem', a.memoryBytes());
console.log('framesize', a.frameSize(), 'srate', a.getParam('srate'), 'nlpc', a.getParam('nlpc'));
const N = a.frameSize(); let out;
for (let k = 0; k < 100; k++) { const x = new Float64Array(N).map((_, i) => 0.1 * Math.sin(2 * Math.PI * 200 * (k * N + i) / 48000)); out = a.process(x); }
console.log(out.slice(0, 5), a.getSignal().signalOut.length, a.getData().cols);
try { a.setParam('nosuch', 1); } catch (e) { console.log('err ok:', e.message); }
