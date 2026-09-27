// Fake ASIO driver: implements the Steinberg ASIO host C API (ASIOInit, ASIOCreateBuffers,
// ASIOStart, ...) and the AsioDrivers registry against a virtual, software-clocked device.
// A single "driver thread" plays the role of the ASIO driver's callback thread: once per
// period it fills the input half-buffer from the mic signal, calls bufferSwitch(index), and
// then treats the output half-buffer as what the hardware plays in the next period.
// Overruns (callback not done before the next period boundary) are modelled like a real DMA
// device: the missed periods' input is lost, and the output repeats the stale buffer (or silence).
#include "asio/asiosys.h"
#include "asio/asio.h"
#include "asio/asiodrivers.h"
#include "fakeasio.h"
#include <cmath>
#include <cstring>
#include <cstdlib>
#include <cstdint>
#include <thread>
#include <time.h>
#include <pthread.h>
#include <sched.h>
#include <cstdio>

namespace fakeasio {
State &state() { static State s; return s; }   // function-local: safe during static initialisation
#define g (fakeasio::state())
void resetRecording() {
  std::lock_guard<std::mutex> l(g.m);
  g.outL.clear(); g.outR.clear(); g.cbStartNs.clear(); g.cbDurNs.clear(); g.cbPeriod.clear(); g.xrunPeriods.clear();
}
}  // namespace fakeasio
using namespace fakeasio;

static bool gLoaded = false, gInit = false, gRunning = false;
static std::atomic<bool> gStop{false};
static std::thread gThread;
static ASIOCallbacks *gCb = nullptr;
static std::vector<ASIOBufferInfo> gInfos;
static std::vector<std::vector<uint8_t>> gBufs;   // two halves per channel
static long gBufSize = 0;
static double gRate = 48000;

static int sampleBytes(long t) {
  switch (t) { case ASIOSTInt16LSB: return 2; case ASIOSTInt24LSB: return 3; case ASIOSTInt32LSB: return 4;
               case ASIOSTFloat32LSB: return 4; case ASIOSTFloat64LSB: return 8; default: return 4; }
}
static void putSample(uint8_t *p, long t, double v) {
  if (t == ASIOSTFloat32LSB) { float f = (float)v; memcpy(p, &f, 4); return; }
  if (t == ASIOSTFloat64LSB) { memcpy(p, &v, 8); return; }
  double c = std::max(-1.0, std::min(v, 1.0 - 1e-12));
  if (t == ASIOSTInt16LSB) { int16_t s = (int16_t)lrint(c * 32767.0); memcpy(p, &s, 2); return; }
  if (t == ASIOSTInt24LSB) { int32_t s = (int32_t)lrint(c * 8388607.0); memcpy(p, &s, 3); return; }
  int32_t s = (int32_t)llrint(c * 2147483647.0); memcpy(p, &s, 4);
}
static double getSample(const uint8_t *p, long t) {
  if (t == ASIOSTFloat32LSB) { float f; memcpy(&f, p, 4); return f; }
  if (t == ASIOSTFloat64LSB) { double d; memcpy(&d, p, 8); return d; }
  if (t == ASIOSTInt16LSB) { int16_t s; memcpy(&s, p, 2); return s / 32768.0; }
  if (t == ASIOSTInt24LSB) { int32_t s = 0; memcpy(&s, p, 3); s = (s << 8) >> 8; return s / 8388608.0; }
  int32_t s; memcpy(&s, p, 4); return s / 2147483648.0;
}

static double nowNs() { timespec ts; clock_gettime(CLOCK_MONOTONIC, &ts); return ts.tv_sec * 1e9 + ts.tv_nsec; }

static void deviceThread() {
  if (const char *e = getenv("FAKEASIO_RTPRIO")) {   // emulate the ASIO driver's time-critical thread
    sched_param sp{}; sp.sched_priority = atoi(e);
    if (pthread_setschedparam(pthread_self(), SCHED_FIFO, &sp)) fprintf(stderr, "fakeasio: cannot set SCHED_FIFO %d (need --cap-add SYS_NICE)\n", sp.sched_priority);
  }
  const long N = gBufSize; const long T = g.cfg.sampleType; const int B = sampleBytes(T);
  const double P = 1e9 * N / gRate;       // period in ns
  const double t0 = nowNs();
  long k = 0; double vt = 0;               // hardware period index; virtual time for non-realtime mode
  std::vector<double> lastL(N, 0.0), lastR(N, 0.0);
  auto emit = [&](long per, const std::vector<double> &L, const std::vector<double> &R) {
    std::lock_guard<std::mutex> l(g.m);
    size_t need = (per + 1) * N; if (g.outL.size() < need) { g.outL.resize(need, 0.0); g.outR.resize(need, 0.0); }
    for (long i = 0; i < N; i++) { g.outL[per * N + i] = L[i]; g.outR[per * N + i] = R[i]; }
  };
  while (!gStop.load()) {
    if (g.cfg.realtime) {
      double dl = t0 + k * P; timespec ts; ts.tv_sec = (time_t)(dl / 1e9); ts.tv_nsec = (long)fmod(dl, 1e9);
      clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &ts, nullptr);
      if (gStop.load()) break;
    }
    g.period.store(k);
    long idx = k & 1;
    for (auto &bi : gInfos) if (bi.isInput) {
      uint8_t *b = (uint8_t *)bi.buffers[idx];
      for (long i = 0; i < N; i++) {
        size_t s = k * N + i; double v = 0;
        if (bi.channelNum == 0 && !g.mic.empty()) { if (g.cfg.loopInput) s %= g.mic.size(); if (s < g.mic.size()) v = g.mic[s]; }
        putSample(b + i * B, T, v);
      }
    }
    if (g.prePeriodHook) g.prePeriodHook(k);
    double ts0 = nowNs();
    gCb->bufferSwitch(idx, ASIOTrue);
    double ts1 = nowNs();
    g.callbacks++;
    std::vector<double> L(N, 0.0), R(N, 0.0);
    for (auto &bi : gInfos) if (!bi.isInput && bi.channelNum < 2) {
      uint8_t *b = (uint8_t *)bi.buffers[idx];
      for (long i = 0; i < N; i++) (bi.channelNum == 0 ? L : R)[i] = getSample(b + i * B, T);
    }
    {
      std::lock_guard<std::mutex> l(g.m);
      g.cbStartNs.push_back(ts0 - t0); g.cbDurNs.push_back(ts1 - ts0); g.cbPeriod.push_back(k);
    }
    emit(k + 1, L, R);                     // output written in period k is heard in period k+1
    long next = k + 1;
    if (g.cfg.realtime) {
      long kn = (long)floor((nowNs() - t0) / P) + 1;   // first period boundary not yet passed
      for (long m = next + 1; m < kn + 1 && m <= next + 100000; m++) {   // periods whose output was not ready
        std::lock_guard<std::mutex> l(g.m); g.xrunPeriods.push_back(m);
      }
      for (long m = next + 1; m <= kn; m++) emit(m, g.cfg.xrunPolicy == 0 ? L : std::vector<double>(N, 0.0), g.cfg.xrunPolicy == 0 ? R : std::vector<double>(N, 0.0));
      if (kn > next) next = kn;            // input of the missed periods is never delivered
    }
    k = next; (void)vt;
  }
}

// ---------------------------------------------------------------- AsioDrivers registry
// Configuration from the environment (read once, when RtAudio.cpp's global AsioDrivers is constructed):
//  FAKEASIO_DRIVERS="name1;name2"  FAKEASIO_BUF="min,max,pref,gran"  FAKEASIO_FMT=int32|int16|int24|float32|float64
//  FAKEASIO_RT=1|0 (real-time clock)  FAKEASIO_XRUN=repeat|zero  FAKEASIO_STOPJOIN=1|0  FAKEASIO_RATES="44100,48000"
static void configFromEnv() {
  Config &c = g.cfg;
  if (const char *e = getenv("FAKEASIO_DRIVERS")) {
    c.drivers.clear(); std::string s(e); size_t a = 0;
    while (a <= s.size()) { size_t b = s.find(';', a); if (b == std::string::npos) b = s.size(); if (b > a) c.drivers.push_back(s.substr(a, b - a)); a = b + 1; }
  }
  if (const char *e = getenv("FAKEASIO_BUF")) sscanf(e, "%ld,%ld,%ld,%ld", &c.minSize, &c.maxSize, &c.prefSize, &c.granularity);
  if (const char *e = getenv("FAKEASIO_FMT")) {
    std::string f(e);
    c.sampleType = f == "int16" ? ASIOSTInt16LSB : f == "int24" ? ASIOSTInt24LSB : f == "float32" ? ASIOSTFloat32LSB : f == "float64" ? ASIOSTFloat64LSB : ASIOSTInt32LSB;
  }
  if (const char *e = getenv("FAKEASIO_RT")) c.realtime = atoi(e) != 0;
  if (const char *e = getenv("FAKEASIO_XRUN")) c.xrunPolicy = std::string(e) == "zero" ? 1 : 0;
  if (const char *e = getenv("FAKEASIO_STOPJOIN")) c.stopJoins = atoi(e) != 0;
  if (const char *e = getenv("FAKEASIO_RATES")) {
    c.rates.clear(); std::string s(e); size_t a = 0;
    while (a < s.size()) { size_t b = s.find(',', a); if (b == std::string::npos) b = s.size(); c.rates.push_back(atof(s.substr(a, b - a).c_str())); a = b + 1; }
  }
}
AsioDrivers::AsioDrivers() : connID(0), curIndex(-1) { configFromEnv(); }
AsioDrivers::~AsioDrivers() {}
long AsioDrivers::asioGetNumDev() { return (long)g.cfg.drivers.size(); }
long AsioDrivers::asioGetDriverName(int i, char *name, int n) {
  if (i < 0 || i >= (int)g.cfg.drivers.size()) return -1;
  snprintf(name, n, "%s", g.cfg.drivers[i].c_str()); return 0;
}
bool AsioDrivers::getCurrentDriverName(char *name) { if (curIndex < 0) return false; strcpy(name, g.cfg.drivers[curIndex].c_str()); return true; }
long AsioDrivers::getDriverNames(char **names, long maxDrivers) {
  long n = std::min<long>(maxDrivers, g.cfg.drivers.size());
  for (long i = 0; i < n; i++) strcpy(names[i], g.cfg.drivers[i].c_str());
  return n;
}
bool AsioDrivers::loadDriver(char *name) {
  for (size_t i = 0; i < g.cfg.drivers.size(); i++) if (g.cfg.drivers[i] == name) { curIndex = i; gLoaded = true; return true; }
  return false;
}
void AsioDrivers::removeCurrentDriver() { if (gRunning) ASIOStop(); ASIODisposeBuffers(); gLoaded = false; gInit = false; curIndex = -1; }

// ---------------------------------------------------------------- ASIO C API
ASIOError ASIOInit(ASIODriverInfo *info) {
  if (!gLoaded) return ASE_NotPresent;
  gInit = true; if (info) { info->driverVersion = 1; snprintf(info->name, 32, "fakeasio"); info->errorMessage[0] = 0; }
  return ASE_OK;
}
ASIOError ASIOExit(void) { gInit = false; return ASE_OK; }
ASIOError ASIOGetChannels(long *ni, long *no) { if (!gInit) return ASE_NotPresent; *ni = g.cfg.inChannels; *no = g.cfg.outChannels; return ASE_OK; }
ASIOError ASIOGetLatencies(long *il, long *ol) { *il = gBufSize; *ol = gBufSize; return ASE_OK; }
ASIOError ASIOGetBufferSize(long *mn, long *mx, long *pr, long *gr) {
  if (!gInit) return ASE_NotPresent; *mn = g.cfg.minSize; *mx = g.cfg.maxSize; *pr = g.cfg.prefSize; *gr = g.cfg.granularity; return ASE_OK;
}
ASIOError ASIOCanSampleRate(ASIOSampleRate r) { for (double x : g.cfg.rates) if (x == r) return ASE_OK; return ASE_NoClock; }
ASIOError ASIOGetSampleRate(ASIOSampleRate *r) { *r = gRate; return ASE_OK; }
ASIOError ASIOSetSampleRate(ASIOSampleRate r) { if (ASIOCanSampleRate(r) != ASE_OK) return ASE_NoClock; gRate = r; g.rate = r; return ASE_OK; }
ASIOError ASIOGetClockSources(ASIOClockSource *, long *n) { *n = 0; return ASE_OK; }
ASIOError ASIOSetClockSource(long) { return ASE_OK; }
ASIOError ASIOGetSamplePosition(ASIOSamples *, ASIOTimeStamp *) { return ASE_NotPresent; }
ASIOError ASIOGetChannelInfo(ASIOChannelInfo *ci) {
  if (!gInit) return ASE_NotPresent;
  ci->type = g.cfg.sampleType; ci->isActive = ASIOFalse; ci->channelGroup = 0;
  snprintf(ci->name, 32, "%s %ld", ci->isInput ? "In" : "Out", ci->channel + 1); return ASE_OK;
}
ASIOError ASIOCreateBuffers(ASIOBufferInfo *bi, long n, long size, ASIOCallbacks *cb) {
  if (!gInit) return ASE_NotPresent;
  if (size < g.cfg.minSize || size > g.cfg.maxSize) return ASE_InvalidMode;
  gInfos.assign(bi, bi + n); gBufs.assign(2 * n, std::vector<uint8_t>(size * sampleBytes(g.cfg.sampleType), 0));
  for (long i = 0; i < n; i++) { bi[i].buffers[0] = gBufs[2 * i].data(); bi[i].buffers[1] = gBufs[2 * i + 1].data(); gInfos[i] = bi[i]; }
  gCb = cb; gBufSize = size; g.bufferSize = size; return ASE_OK;
}
ASIOError ASIODisposeBuffers(void) { if (gRunning) ASIOStop(); gInfos.clear(); gBufs.clear(); gCb = nullptr; return ASE_OK; }
ASIOError ASIOControlPanel(void) { return ASE_OK; }
ASIOError ASIOFuture(long, void *) { return ASE_InvalidParameter; }
ASIOError ASIOOutputReady(void) { return ASE_OK; }
ASIOError ASIOStart(void) {
  if (!gCb || gRunning) return ASE_InvalidMode;
  gStop = false; g.period = 0; gRunning = true;
  gThread = std::thread(deviceThread);
  return ASE_OK;
}
ASIOError ASIOStop(void) {
  if (!gRunning) return ASE_OK;
  gStop = true; gRunning = false;
  if (g.cfg.stopJoins) { if (gThread.joinable()) gThread.join(); }
  else gThread.detach();
  return ASE_OK;
}
