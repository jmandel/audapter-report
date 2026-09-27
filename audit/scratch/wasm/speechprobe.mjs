import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const b = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.goto('data:text/html,<p>x</p>');
const r = await p.evaluate(async () => {
  const out = {};
  out.speechSynthesis = 'speechSynthesis' in window;
  out.voices = await new Promise(res => { let v = speechSynthesis.getVoices(); if (v.length) return res(v.length); speechSynthesis.onvoiceschanged = () => res(speechSynthesis.getVoices().length); setTimeout(() => res(speechSynthesis.getVoices().length), 3000); });
  out.SpeechRecognition = typeof window.SpeechRecognition, out.webkitSpeechRecognition = typeof window.webkitSpeechRecognition;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    out.srStatic = Object.getOwnPropertyNames(SR).filter(n => !['length', 'name', 'prototype'].includes(n));
    out.srProto = Object.getOwnPropertyNames(SR.prototype);
    out.startArity = SR.prototype.start.length;
    try { if (SR.available) out.availableOnDevice = await SR.available({ langs: ['en-US'], processLocally: true }); } catch (e) { out.availableErr = String(e); }
  }
  out.captureStreamOnAudioEl = typeof HTMLMediaElement.prototype.captureStream;
  out.utteranceProps = Object.getOwnPropertyNames(SpeechSynthesisUtterance.prototype);
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
