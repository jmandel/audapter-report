// Thin C API over the real Audapter C++ core (blab TransShiftMex), replacing the MEX layer.
// Mirrors mexLibrary.cpp's offline path: setParam(name, double*, n) -> Audapter::setParam,
// 'ost'/'pcf' -> write text to a (MEM)FS file and call readOSTTab/readPertCfg,
// 'runFrame' -> audapterCallback(buf, frame_len*downFact) in PROC_AUDIO_INPUT_OFFLINE mode,
// 'getData' -> getSignal()/getData() with the same strides as mexLibrary.cpp case 4.
#include <cstdio>
#include <cstring>
#include <string>
#include <vector>
#include "mex.h"
#include "Audapter.h"

int g_mex_verbose = 0;
static Audapter *g_aud = nullptr;
static std::string g_err;
static std::vector<double> g_frame;  // scratch buffer: handleBuffer writes output over its input (H3)

#define GUARD(expr)                                                   \
  try { expr; return 0; }                                             \
  catch (const std::exception &e) { g_err = e.what(); return -1; }    \
  catch (...) { g_err = "unknown C++ exception"; return -1; }

extern "C" {

const char *aud_last_error() { return g_err.c_str(); }
void aud_set_verbose(int v) { g_mex_verbose = v; }
int aud_sizeof_audapter() { return (int)sizeof(Audapter); }

// (Re)create the Audapter object (the MEX uses a function-static instance; we heap-allocate so a
// fresh instance can be made. NOTE: handleBuffer has function-static locals which survive this.)
int aud_create() {
  GUARD({ delete g_aud; g_aud = nullptr; g_aud = new Audapter(); g_aud->actionMode = Audapter::PROC_AUDIO_INPUT_OFFLINE; })
}

int aud_reset() { GUARD(g_aud->reset()) }

int aud_set_param(const char *name, const double *vals, int n) {
  // Same as mexLibrary case 3: value pointer is the MATLAB double array, nPars = number of elements.
  GUARD(g_aud->setParam(name, (void *)vals, n, false))
}

// Returns number of values written (scalar / 1-D params only), or -1 on error.
int aud_get_param(const char *name, double *out, int maxn) {
  try {
    mxArray *a = nullptr;
    g_aud->queryParam(name, &a);
    int n = a ? (int)a->d.size() : 0;
    for (int i = 0; i < n && i < maxn; i++) out[i] = a->d[i];
    delete a;
    return n;
  } catch (const std::exception &e) { g_err = e.what(); return -1; }
}

static int load_cfg(const char *text, const char *path, bool ost) {
  if (!text || !*text) {  // empty -> same as passing '' from MATLAB: nullify
    if (ost) { g_aud->ostFN[0] = 0; g_aud->readOSTTab(0); }
    else { g_aud->pertCfgFN[0] = 0; g_aud->readPertCfg(0); }
    return 0;
  }
  FILE *f = fopen(path, "wb");
  if (!f) { g_err = std::string("cannot write ") + path; return -1; }
  fwrite(text, 1, strlen(text), f);
  fclose(f);
  if (ost) { strcpy_s(g_aud->ostFN, sizeof(g_aud->ostFN), path); g_aud->readOSTTab(0); }
  else { strcpy_s(g_aud->pertCfgFN, sizeof(g_aud->pertCfgFN), path); g_aud->readPertCfg(0); }
  return 0;
}
int aud_load_ost(const char *text) { try { return load_cfg(text, "/tmp/audapter.ost", true); } catch (const std::exception &e) { g_err = e.what(); return -1; } }
int aud_load_pcf(const char *text) { try { return load_cfg(text, "/tmp/audapter.pcf", false); } catch (const std::exception &e) { g_err = e.what(); return -1; } }

// Device-rate frame length (frameLen * downFact), e.g. 96 at 48 kHz.
int aud_frame_size() {
  return *((int *)g_aud->getParam("framelen")) * *((int *)g_aud->getParam("downfact"));
}

// One offline frame, exactly like Audapter('runFrame', x). in and out may alias.
int aud_process(const double *in, double *out, int n) {
  try {
    if ((int)g_frame.size() < n) g_frame.resize(n);
    memcpy(g_frame.data(), in, n * sizeof(double));
    g_aud->actionMode = Audapter::PROC_AUDIO_INPUT_OFFLINE;
    audapterCallback((char *)g_frame.data(), n, (void *)g_aud);
    memcpy(out, g_frame.data(), n * sizeof(double));
    return 0;
  } catch (const std::exception &e) { g_err = e.what(); return -1; }
}

// Many consecutive frames (nFrames * frame size samples) in one call; in and out may alias.
int aud_process_block(const double *in, double *out, int nFrames) {
  try {
    const int n = aud_frame_size();
    if ((int)g_frame.size() < n) g_frame.resize(n);
    g_aud->actionMode = Audapter::PROC_AUDIO_INPUT_OFFLINE;
    for (int k = 0; k < nFrames; k++) {
      memcpy(g_frame.data(), in + (size_t)k * n, n * sizeof(double));
      audapterCallback((char *)g_frame.data(), n, (void *)g_aud);
      memcpy(out + (size_t)k * n, g_frame.data(), n * sizeof(double));
    }
    return 0;
  } catch (const std::exception &e) { g_err = e.what(); return -1; }
}

#ifndef AUDAPTER_VARIANT
#define AUDAPTER_VARIANT "unknown"
#endif
#ifndef AUDAPTER_PATCHES
#define AUDAPTER_PATCHES ""
#endif
const char *aud_variant() { return AUDAPTER_VARIANT; }
const char *aud_patches() { return AUDAPTER_PATCHES; }   // comma-separated applied fix patches
int aud_max_rec_size() { return g_aud->getMaxRecSize(); }

// Float32 convenience for AudioWorklet: converts to/from double.
int aud_process_f32(const float *in, float *out, int n) {
  try {
    if ((int)g_frame.size() < n) g_frame.resize(n);
    for (int i = 0; i < n; i++) g_frame[i] = in[i];
    g_aud->actionMode = Audapter::PROC_AUDIO_INPUT_OFFLINE;
    audapterCallback((char *)g_frame.data(), n, (void *)g_aud);
    for (int i = 0; i < n; i++) out[i] = (float)g_frame[i];
    return 0;
  } catch (const std::exception &e) { g_err = e.what(); return -1; }
}

// Recorded signals (16 kHz internal rate). Returns length; *in/*out point into the recorder.
int aud_get_signal(const double **in, const double **out) {
  int size = 0;
  const double *s = g_aud->getSignal(size);
  *in = s; *out = s + g_aud->getMaxRecSize();
  return size;
}

// Data matrix: column j of row i is ptr[j*stride + i]; returns nrows. Same layout as mexLibrary case 4.
int aud_get_data(const double **ptr, int *vecsize, int *stride) {
  int size = 0, vs = 0;
  *ptr = g_aud->getData(size, vs);
  *vecsize = vs; *stride = g_aud->getMaxDataSize();
  return size;
}

// Copy the most recent data row (all columns) into out; returns vecsize (0 if no rows yet).
int aud_get_latest(double *out, int maxn) {
  int size = 0, vs = 0;
  const double *d = g_aud->getData(size, vs);
  if (size <= 0) return 0;
  for (int j = 0; j < vs && j < maxn; j++) out[j] = d[j * g_aud->getMaxDataSize() + size - 1];
  return vs;
}

}  // extern "C"
