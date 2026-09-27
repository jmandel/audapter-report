// Minimal WAV reader (PCM16/PCM32/float32/float64, any channel count) and float32 writer.
#pragma once
#include <cstdio>
#include <cstdint>
#include <cstring>
#include <string>
#include <vector>
#include <stdexcept>

struct Wav { int fs = 48000; int ch = 1; std::vector<double> x; /* interleaved */ size_t frames() const { return ch ? x.size() / ch : 0; } };

inline Wav wavRead(const std::string &fn) {
  FILE *f = fopen(fn.c_str(), "rb"); if (!f) throw std::runtime_error("cannot open " + fn);
  char id[4]; uint32_t sz; Wav w; int fmt = 1, bits = 16; bool gotData = false;
  if (fread(id, 1, 4, f) != 4 || memcmp(id, "RIFF", 4)) throw std::runtime_error("not RIFF " + fn);
  fread(&sz, 4, 1, f); fread(id, 1, 4, f);
  while (fread(id, 1, 4, f) == 4 && fread(&sz, 4, 1, f) == 1) {
    if (!memcmp(id, "fmt ", 4)) {
      std::vector<uint8_t> b(sz); fread(b.data(), 1, sz, f);
      uint16_t af, nc, bps; uint32_t sr; memcpy(&af, &b[0], 2); memcpy(&nc, &b[2], 2); memcpy(&sr, &b[4], 4); memcpy(&bps, &b[14], 2);
      if (af == 0xFFFE && sz >= 26) memcpy(&af, &b[24], 2);
      fmt = af; w.ch = nc; w.fs = sr; bits = bps;
    } else if (!memcmp(id, "data", 4)) {
      size_t n = sz / (bits / 8); w.x.resize(n);
      std::vector<uint8_t> b(sz); fread(b.data(), 1, sz, f);
      for (size_t i = 0; i < n; i++) {
        if (fmt == 3 && bits == 32) { float v; memcpy(&v, &b[i * 4], 4); w.x[i] = v; }
        else if (fmt == 3 && bits == 64) { double v; memcpy(&v, &b[i * 8], 8); w.x[i] = v; }
        else if (fmt == 1 && bits == 16) { int16_t v; memcpy(&v, &b[i * 2], 2); w.x[i] = v / 32768.0; }
        else if (fmt == 1 && bits == 32) { int32_t v; memcpy(&v, &b[i * 4], 4); w.x[i] = v / 2147483648.0; }
        else throw std::runtime_error("unsupported wav format in " + fn);
      }
      gotData = true; break;
    } else fseek(f, sz + (sz & 1), SEEK_CUR);
  }
  fclose(f); if (!gotData) throw std::runtime_error("no data chunk in " + fn);
  return w;
}

inline void wavWrite(const std::string &fn, const Wav &w) {
  FILE *f = fopen(fn.c_str(), "wb"); if (!f) throw std::runtime_error("cannot write " + fn);
  uint32_t n = w.x.size(), dsz = n * 4, riff = 36 + dsz, fsz = 16, sr = w.fs, br = w.fs * w.ch * 4;
  uint16_t af = 3, nc = w.ch, ba = w.ch * 4, bps = 32;
  fwrite("RIFF", 1, 4, f); fwrite(&riff, 4, 1, f); fwrite("WAVEfmt ", 1, 8, f); fwrite(&fsz, 4, 1, f);
  fwrite(&af, 2, 1, f); fwrite(&nc, 2, 1, f); fwrite(&sr, 4, 1, f); fwrite(&br, 4, 1, f); fwrite(&ba, 2, 1, f); fwrite(&bps, 2, 1, f);
  fwrite("data", 1, 4, f); fwrite(&dsz, 4, 1, f);
  for (double v : w.x) { float s = (float)v; fwrite(&s, 4, 1, f); }
  fclose(f);
}
