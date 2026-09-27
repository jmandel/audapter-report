import fs from 'node:fs';
import { AudapterWasm } from '/home/jmandel/hobby/audapter/audit/wasm/web/audapter-api.mjs';
const factory = (await import('/home/jmandel/hobby/audapter/audit/wasm/dist/audapter-full.mjs')).default;
const a = await AudapterWasm.create(factory, { print: console.log, printErr: console.error });
a.fn.aud_set_verbose(1);
a.loadOst(fs.readFileSync('/home/jmandel/hobby/audapter/audit/harness/oct/cfg/one.ost', 'utf8'));
a.loadPcf(fs.readFileSync('/home/jmandel/hobby/audapter/audit/harness/oct/cfg/f1up.pcf', 'utf8'));
