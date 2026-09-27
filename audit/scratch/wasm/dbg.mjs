import fs from 'node:fs';
import { AudapterWasm } from '../../wasm/web/audapter-api.mjs';
const factory = (await import('../../wasm/dist/audapter-full.mjs')).default;
const a = await AudapterWasm.create(factory, { print: console.log, printErr: console.error });
a.fn.aud_set_verbose(1);
a.loadOst(fs.readFileSync(new URL('../../harness/oct/cfg/one.ost', import.meta.url), 'utf8'));
a.loadPcf(fs.readFileSync(new URL('../../harness/oct/cfg/f1up.pcf', import.meta.url), 'utf8'));
