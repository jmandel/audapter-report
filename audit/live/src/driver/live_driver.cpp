// Native "MATLAB stand-in" for the live-path audit: calls the real Audapter mexFunction (through
// the fake MEX API in ../fakemex) in the same order MATLAB scripts do, while the real audioIO +
// RtAudio code runs the audio callback on its own thread against a virtual device:
//   - build ASIO: RtAudio's ASIO backend + fake ASIO driver (../fakeasio), software clocked
//   - build JACK (-DLIVE_JACK): RtAudio's JACK backend + jackd dummy driver, with an in-process
//     JACK client "feeder" that plays the mic signal and records the headphone channels.
// Usage: live_driver <scenario> key=value ...   (see usage() below)
#include "mex.h"
#include "wavio.h"
#include <atomic>
#include <chrono>
#include <cmath>
#include <csignal>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fstream>
#include <functional>
#include <algorithm>
#include <map>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#include <unistd.h>
#include <vector>
#if defined(__SANITIZE_ADDRESS__) || defined(__SANITIZE_THREAD__)
#include <sanitizer/common_interface_defs.h>
#endif
#ifdef LIVE_JACK
#include <jack/jack.h>
#else
#include "fakeasio.h"
#endif

void mexFunction(int nlhs, mxArray *plhs[], int nrhs, const mxArray *prhs[]);

// ------------------------------------------------------------------ small utilities
static std::map<std::string, std::string> A;   // key=value arguments
static std::string arg(const std::string &k, const std::string &d = "") { auto i = A.find(k); return i == A.end() ? d : i->second; }
static double argd(const std::string &k, double d) { auto i = A.find(k); return i == A.end() ? d : atof(i->second.c_str()); }
static double nowS() { return std::chrono::duration<double>(std::chrono::steady_clock::now().time_since_epoch()).count(); }
static void sleepS(double s) { if (s > 0) std::this_thread::sleep_for(std::chrono::duration<double>(s)); }

static std::atomic<const char *> g_op{"startup"};
static std::atomic<long> g_iter{0};
static void deathNote() { fprintf(stderr, "\n*** LIVE-DRIVER: process dying during main-thread op '%s' (iteration %ld)\n", g_op.load(), g_iter.load()); }
static void segvHandler(int sig) {
  char b[256]; int n = snprintf(b, sizeof b, "\n*** LIVE-DRIVER: signal %d during main-thread op '%s' (iteration %ld)\n", sig, g_op.load(), g_iter.load());
  if (write(2, b, n) < 0) {}
  _exit(128 + sig);
}

// NumPy .npy writer (float64, Fortran order) so the Python analysis can load results directly.
static void npySave(const std::string &fn, const double *d, size_t rows, size_t cols) {
  std::ostringstream h; h << "{'descr': '<f8', 'fortran_order': True, 'shape': (" << rows << ", " << cols << "), }";
  std::string hs = h.str(); size_t tot = 10 + hs.size() + 1; size_t pad = (64 - tot % 64) % 64; hs += std::string(pad, ' ') + "\n";
  FILE *f = fopen(fn.c_str(), "wb"); if (!f) { perror(fn.c_str()); return; }
  fwrite("\x93NUMPY\x01\x00", 1, 8, f); uint16_t hl = hs.size(); fwrite(&hl, 2, 1, f); fwrite(hs.data(), 1, hs.size(), f);
  fwrite(d, sizeof(double), rows * cols, f); fclose(f);
}
static void npySave(const std::string &fn, const std::vector<double> &v) { npySave(fn, v.data(), v.size(), 1); }

// ------------------------------------------------------------------ MEX call helpers
static long g_plhsOverflow = 0;
// Calls mexFunction like MATLAB would: plhs has max(nlhs,1) slots. Extra guard slots detect writes past it.
static std::vector<mxArray *> mex(int nlhs, std::vector<mxArray *> args) {
  const int nslots = std::max(nlhs, 1); const int guard = 4;
  std::vector<mxArray *> plhs(nslots + guard, nullptr);
  mxArray *sentinel = reinterpret_cast<mxArray *>(0x5e5e5e5e);
  for (int i = nslots; i < nslots + guard; i++) plhs[i] = sentinel;
  std::string err;
  try { mexFunction(nlhs, plhs.data(), (int)args.size(), (const mxArray **)args.data()); }
  catch (MexError &e) { err = e.what(); }
  for (auto *a : args) mxDestroyArray(a);
  for (int i = nslots; i < nslots + guard; i++)
    if (plhs[i] != sentinel) { g_plhsOverflow++; fprintf(stderr, "[mex] WARNING: mexFunction wrote plhs[%d] with nlhs=%d (out of bounds in MATLAB)\n", i, nlhs); mxDestroyArray(plhs[i]); }
  plhs.resize(nslots);
  if (!err.empty()) throw MexError(err);
  return plhs;
}
static void mexNoOut(std::vector<mxArray *> args) { for (auto *a : mex(0, std::move(args))) mxDestroyArray(a); }
static mxArray *mxMat(size_t r, size_t c, const std::vector<double> &v) { mxArray *a = mxCreateDoubleMatrix(r, c, mxREAL); a->d = v; return a; }

struct TraceItem { std::string name; size_t r, c; std::vector<double> v; };
static std::vector<TraceItem> loadTrace(const std::string &fn) {
  std::vector<TraceItem> t; std::ifstream f(fn); std::string line;
  if (!f) { fprintf(stderr, "cannot read trace %s\n", fn.c_str()); exit(2); }
  while (std::getline(f, line)) {
    if (line.size() < 2 || line[0] != 'S') continue;
    std::istringstream is(line.substr(2)); TraceItem it; is >> it.name >> it.r >> it.c;
    double x; while (is >> x) it.v.push_back(x);
    t.push_back(it);
  }
  return t;
}
// AudapterIO('init', p) equivalent: Audapter(3, name, value, 0) for each recorded call.
static void replayInit(const std::vector<TraceItem> &t) {
  for (auto &it : t) {
    try { mexNoOut({mxScalar(3), mxStr(it.name), mxMat(it.r, it.c, it.v), mxScalar(0)}); }
    catch (MexError &e) {
      // AudapterIO wraps only the fb5 params in try/catch; everything else would abort init in MATLAB.
      if (it.name.rfind("fb5", 0) != 0) fprintf(stderr, "[init] setParam %s: %s\n", it.name.c_str(), e.what());
    }
  }
}
static void setParam(const std::string &n, const std::vector<double> &v) { mexNoOut({mxScalar(3), mxStr(n), mxVec(v), mxScalar(0)}); }
static void setParam(const std::string &n, double v) { setParam(n, std::vector<double>{v}); }
static double getParam(const std::string &n) { auto o = mex(1, {mxStr("getParam"), mxStr(n)}); double v = o[0] && mxGetPr(o[0]) ? mxGetPr(o[0])[0] : NAN; for (auto *a : o) mxDestroyArray(a); return v; }

struct Data { std::vector<double> sig, dat; size_t n = 0, sigCols = 2, datCols = 0; };
// AudapterIO('getData') -> [signalMat, dataMat] = Audapter(4)
static Data getData() {
  Data d; auto o = mex(2, {mxScalar(4)});
  if (o[0]) { d.n = o[0]->dims[0]; d.sig = o[0]->d; d.sigCols = o[0]->dims[1]; }
  if (o.size() > 1 && o[1]) { d.datCols = o[1]->dims[1]; d.dat = o[1]->d; }
  for (auto *a : o) mxDestroyArray(a);
  return d;
}
static void saveData(const std::string &pfx, const Data &d) {
  if (d.n) npySave(pfx + "_sig.npy", d.sig.data(), d.n, d.sigCols);
  if (d.n && d.datCols) npySave(pfx + "_data.npy", d.dat.data(), d.dat.size() / d.datCols, d.datCols);
}
static void loadOstPcf() {
  if (!arg("ost").empty()) mexNoOut({mxStr("ost"), mxStr(arg("ost")), mxScalar(0)});
  if (!arg("pcf").empty()) mexNoOut({mxStr("pcf"), mxStr(arg("pcf")), mxScalar(0)});
}
// Audapter('deviceName', name). Default: the virtual device of the current backend.
static void setDevice() {
#ifdef LIVE_JACK
  std::string d = arg("device", "feeder");
#else
  std::string d = arg("device", "Fake");
#endif
  if (d != "none") mexNoOut({mxStr("deviceName"), mxStr(d)});
}
static int frameSize() { return (int)lround(getParam("framelen") * getParam("downfact")); }

static std::vector<double> loadMic(const std::string &fn) {
  Wav w = wavRead(fn); std::vector<double> x(w.frames());
  for (size_t i = 0; i < x.size(); i++) x[i] = w.x[i * w.ch];
  if (w.fs != 48000) fprintf(stderr, "warning: %s is %d Hz (device runs at 48000)\n", fn.c_str(), w.fs);
  return x;
}

// ------------------------------------------------------------------ backends
#ifdef LIVE_JACK
// In-process JACK client that is the "sound card" Audapter connects to (device name "feeder:").
struct Feeder {
  jack_client_t *c = nullptr; jack_port_t *mic = nullptr, *earL = nullptr, *earR = nullptr;
  std::vector<double> x;                  // mic signal
  std::vector<float> recL, recR;          // what Audapter sent to the headphones, in JACK frame time
  std::atomic<long> pos{-1};              // mic read position; -1 = not playing
  bool loop = false;
  std::atomic<long> cycles{0}, xruns{0};
  jack_nframes_t startFrame = 0; std::atomic<bool> armed{false};
  size_t cap = 0; std::atomic<size_t> recN{0};
  static int process(jack_nframes_t n, void *arg) {
    Feeder *f = (Feeder *)arg;
    float *m = (float *)jack_port_get_buffer(f->mic, n);
    float *l = (float *)jack_port_get_buffer(f->earL, n), *r = (float *)jack_port_get_buffer(f->earR, n);
    // Start the mic in the first cycle in which Audapter's input port is connected to feeder:mic,
    // so the mic start is aligned to a period boundary relative to Audapter's stream.
    if (f->armed.load() && jack_port_connected(f->mic) > 0) { f->armed = false; f->pos = 0; f->startFrame = jack_last_frame_time(f->c); f->recN = 0; }
    long p = f->pos.load();
    const long X = (long)f->x.size();
    for (jack_nframes_t i = 0; i < n; i++) m[i] = (p < 0 || X == 0) ? 0.f : f->loop ? (float)f->x[(p + i) % X] : (p + (long)i < X) ? (float)f->x[p + i] : 0.f;
    if (p >= 0) {
      f->pos = p + n;
      size_t k = f->recN.load();
      for (jack_nframes_t i = 0; i < n && k < f->cap; i++, k++) { f->recL[k] = l[i]; f->recR[k] = r[i]; }
      f->recN = k;
    }
    f->cycles++;
    return 0;
  }
  static int xrun(void *arg) { ((Feeder *)arg)->xruns++; return 0; }
  void open() {
    jack_status_t st; c = jack_client_open("feeder", JackNoStartServer, &st);
    if (!c) { fprintf(stderr, "cannot connect to jackd (status 0x%x)\n", st); exit(3); }
    mic = jack_port_register(c, "mic", JACK_DEFAULT_AUDIO_TYPE, JackPortIsOutput, 0);
    earL = jack_port_register(c, "earL", JACK_DEFAULT_AUDIO_TYPE, JackPortIsInput, 0);
    earR = jack_port_register(c, "earR", JACK_DEFAULT_AUDIO_TYPE, JackPortIsInput, 0);
    jack_set_process_callback(c, process, this); jack_set_xrun_callback(c, xrun, this);
    cap = 48000 * 120; recL.assign(cap, 0.f); recR.assign(cap, 0.f);
    jack_activate(c);
  }
} feeder;
static void backendInit() { feeder.open(); }
static void backendLoop() { feeder.loop = true; }
static void backendClose() { if (feeder.c) { jack_deactivate(feeder.c); jack_client_close(feeder.c); feeder.c = nullptr; } }
static void backendArm(const std::vector<double> &x) { feeder.x = x; feeder.armed = true; }
static bool backendDone(double tail) { return feeder.pos.load() >= (long)(feeder.x.size() + tail * 48000); }
static void backendSave(const std::string &pfx) {
  size_t n = feeder.recN.load(); std::vector<double> lr(2 * n);
  for (size_t i = 0; i < n; i++) { lr[i] = feeder.recL[i]; lr[n + i] = feeder.recR[i]; }
  npySave(pfx + "_hw.npy", lr.data(), n, 2);
  FILE *f = fopen((pfx + "_hw.txt").c_str(), "w");
  fprintf(f, "backend jack\nbufsize %u\nxruns %ld\ncycles %ld\n", jack_get_buffer_size(feeder.c), feeder.xruns.load(), feeder.cycles.load()); fclose(f);
}
static long backendCallbacks() { return feeder.cycles.load(); }
static void backendHook(std::function<void(long)>) {}
#else
static void backendInit() {}
static void backendClose() {}
static void backendLoop() { fakeasio::state().cfg.loopInput = true; }
static void backendArm(const std::vector<double> &x) { auto &s = fakeasio::state(); s.mic = x; }
static bool backendDone(double tail) { auto &s = fakeasio::state(); return s.bufferSize > 0 && (double)s.period.load() * s.bufferSize >= s.mic.size() + tail * 48000; }
static void backendSave(const std::string &pfx) {
  auto &s = fakeasio::state(); std::lock_guard<std::mutex> l(s.m);
  size_t n = s.outL.size(); std::vector<double> lr(2 * n);
  for (size_t i = 0; i < n; i++) { lr[i] = s.outL[i]; lr[n + i] = s.outR[i]; }
  npySave(pfx + "_hw.npy", lr.data(), n, 2);
  size_t m = s.cbStartNs.size(); std::vector<double> cb(3 * m);
  for (size_t i = 0; i < m; i++) { cb[i] = s.cbPeriod[i]; cb[m + i] = s.cbStartNs[i]; cb[2 * m + i] = s.cbDurNs[i]; }
  npySave(pfx + "_cb.npy", cb.data(), m, 3);
  FILE *f = fopen((pfx + "_hw.txt").c_str(), "w");
  fprintf(f, "backend fakeasio\nbufsize %ld\nxruns %zu\ncallbacks %ld\nrealtime %d\n", s.bufferSize, s.xrunPeriods.size(), s.callbacks.load(), (int)s.cfg.realtime);
  fclose(f);
}
static long backendCallbacks() { return fakeasio::state().callbacks.load(); }
static void backendHook(std::function<void(long)> h) { fakeasio::state().prePeriodHook = h; }
#endif

// ------------------------------------------------------------------ scenarios
static void writeMeta(const std::string &pfx, const std::string &extra) {
  FILE *f = fopen((pfx + "_meta.txt").c_str(), "w"); if (!f) return;
  fprintf(f, "framesize %d\nplhs_overflow %ld\n%s", frameSize(), g_plhsOverflow, extra.c_str()); fclose(f);
}

// Offline reference: AudapterIO('init') + ost/pcf + reset + runFrame loop + getData.
// lead=N prepends N zero samples; quant=float32|int32 rounds the input like the device path would.
static int scOffline() {
  auto tr = loadTrace(arg("trace")); replayInit(tr); loadOstPcf(); mexNoOut({mxStr("reset")});
  std::vector<double> x = loadMic(arg("in"));
  x.insert(x.begin(), (size_t)argd("lead", 0), 0.0);
  std::string q = arg("quant");
  for (double &v : x) {
    if (q == "float32") v = (float)v;
    else if (q == "int32") { double c = std::max(-1.0, std::min(v, 1.0 - 1e-12)); v = (double)(int32_t)llrint(c * 2147483647.0) / 2147483648.0; }
  }
  const int N = frameSize(); x.resize(x.size() + (N - x.size() % N) % N, 0.0);
  std::vector<double> out(x.size());
  const long resetEvery = (long)argd("resetevery", 0);   // race-free control: reset between frames
  for (size_t k = 0; k < x.size() / N; k++) {
    if (resetEvery > 0 && k > 0 && k % resetEvery == 0) mexNoOut({mxStr("reset")});
    std::vector<double> fr(x.begin() + k * N, x.begin() + (k + 1) * N);
    // Fresh array per frame (MATLAB scripts pass sigInCell{n}); runFrame writes the output into it (H3).
    mxArray *a[2] = {mxStr("runFrame"), mxVec(fr, true)}; mxArray *plhs[1] = {nullptr};
    mexFunction(0, plhs, 2, (const mxArray **)a);
    std::copy(a[1]->d.begin(), a[1]->d.end(), out.begin() + k * N);
    mxDestroyArray(a[0]); mxDestroyArray(a[1]);
  }
  std::string pfx = arg("out"); Data d = getData(); saveData(pfx, d);
  npySave(pfx + "_runframe_out.npy", out);
  writeMeta(pfx, "mode offline\n");
  printf("offline: %zu frames of %d samples, getData rows %zu\n", x.size() / N, N, d.n);
  return 0;
}

// One live trial like audapterDemo_online.m / UIRecorder (bAlwaysOn=0):
// init -> ost/pcf -> reset -> start -> pause -> stop -> getData.
static int scLive() {
  auto tr = loadTrace(arg("trace")); replayInit(tr); loadOstPcf();
  setDevice();
  std::vector<double> x = loadMic(arg("in"));
  mexNoOut({mxStr("reset")});
#ifdef LIVE_JACK
  backendArm(x);               // JACK: the mic plays continuously; alignment is recovered by the analysis
#else
  backendArm(x);               // fake ASIO: mic sample 0 is delivered in hardware period 0 (= ASIOStart)
#endif
  double t0 = nowS();
  g_op = "start"; mexNoOut({mxStr("start")});
  double tail = argd("tail", 0.3), tmax = x.size() / 48000.0 + tail + 5;
  g_op = "wait";
  while (!backendDone(tail) && nowS() - t0 < tmax) sleepS(0.005);
  if (argd("getdata_running", 0)) { Data dr = getData(); saveData(arg("out") + "_running", dr); }
  g_op = "stop"; mexNoOut({mxStr("stop")});
  double t1 = nowS();
  g_op = "getData"; Data d = getData(); saveData(arg("out"), d); backendSave(arg("out"));
  char ex[256]; snprintf(ex, sizeof ex, "mode live\nwall_s %.3f\ncallbacks %ld\n", t1 - t0, backendCallbacks());
  writeMeta(arg("out"), ex);
  printf("live: wall %.2f s, callbacks %ld, getData rows %zu, plhs overflow %ld\n", t1 - t0, backendCallbacks(), d.n, g_plhsOverflow);
  return 0;
}

// MATLAB-like "always on" session (runExperiment.m + UIRecorder.m with ALWAYS_ON 1): audio runs
// continuously; per trial the main thread does init (all setParams), ost, pcf, bdetect/bshift, reset,
// waits the trial length, then getData while audio keeps running. ops= selects the per-trial steps.
static int scAlwaysOn() {
  auto tr = loadTrace(arg("trace")); std::string ops = arg("ops", "init,ost,pcf,setp,reset,getdata");
  auto has = [&](const char *o) { return ops.find(o) != std::string::npos; };
  replayInit(tr); loadOstPcf();
  setDevice();
  std::vector<double> x = loadMic(arg("in"));
  backendLoop();
  backendArm(x);
  mexNoOut({mxStr("reset")}); g_op = "start"; mexNoOut({mxStr("start")});
  int trials = (int)argd("trials", 10); double tlen = argd("triallen", 0.5);
  for (int k = 0; k < trials; k++) {
    g_iter = k;
    if (has("init")) { g_op = "init"; replayInit(tr); }
    if (has("ost")) { g_op = "ost"; loadOstPcf(); }
    if (has("setp")) { g_op = "setParam"; setParam("bdetect", 1); setParam("bshift", 1); }
    if (has("reset")) { g_op = "reset"; mexNoOut({mxStr("reset")}); }
    g_op = "trial"; sleepS(tlen);
    if (has("getdata")) { g_op = "getData"; Data d = getData(); if (!arg("out").empty() && k == trials - 1) saveData(arg("out") + "_lasttrial", d); }
  }
  g_op = "stop"; mexNoOut({mxStr("stop")});
  printf("alwayson: %d trials done, callbacks %ld\n", trials, backendCallbacks());
  if (!arg("out").empty()) backendSave(arg("out"));
  return 0;
}

// Race amplifier: while audio runs, repeat one main-thread operation as fast as possible for secs.
// op = pcf | ost | init | reset | pertamp | getdata | tdratio
static int scHammer() {
  auto tr = loadTrace(arg("trace")); replayInit(tr); loadOstPcf(); setDevice();
  std::vector<double> x = loadMic(arg("in"));
  backendLoop();
  backendArm(x);
  mexNoOut({mxStr("reset")}); mexNoOut({mxStr("start")});
  std::string op = arg("op"); double secs = argd("secs", 5); double gap = argd("gap", 0);
  std::vector<double> a0(257, 0.0), a1(257, 0.3);
  double t0 = nowS(); long it = 0; std::vector<double> opDur;
  static std::string opname; opname = op; g_op = opname.c_str();
  while (nowS() - t0 < secs) {
    g_iter = it;
    double ts = nowS();
    try {
      if (op == "pcf") mexNoOut({mxStr("pcf"), mxStr(arg("pcf")), mxScalar(0)});
      else if (op == "ost") mexNoOut({mxStr("ost"), mxStr(arg("ost")), mxScalar(0)});
      else if (op == "ostpcf") loadOstPcf();
      else if (op == "init") replayInit(tr);
      else if (op == "reset") mexNoOut({mxStr("reset")});
      else if (op == "pertamp") setParam("pertamp", (it & 1) ? a1 : a0);
      else if (op == "getdata") getData();
      else if (op == "tdratio") setParam("pitchshiftratio", 1.0 + 0.01 * (it & 1));
      else if (op == "tdsame") setParam("pitchshiftratio", 1.0);   // what AudapterIO('init') does every trial
      else if (op == "idle") sleepS(0.001);
      else if (op.rfind("toggle:", 0) == 0) {   // toggle:<param>:<v1>:<v2>  e.g. toggle:fn1:675:676
        char pn[64]; double v1, v2;
        if (sscanf(op.c_str(), "toggle:%63[^:]:%lf:%lf", pn, &v1, &v2) != 3) { fprintf(stderr, "bad toggle op\n"); return 2; }
        setParam(pn, (it & 1) ? v2 : v1);
      }
      else { fprintf(stderr, "unknown op %s\n", op.c_str()); return 2; }
    } catch (MexError &e) { fprintf(stderr, "[hammer] %s: %s\n", op.c_str(), e.what()); }
    opDur.push_back(nowS() - ts);
    it++; sleepS(gap);
  }
  g_op = "stop"; mexNoOut({mxStr("stop")});
  std::sort(opDur.begin(), opDur.end());
  printf("hammer op=%s: %ld iterations in %.1f s without crashing; callbacks %ld; op duration median %.2f ms max %.2f ms\n", op.c_str(), it, secs, backendCallbacks(),
         opDur.empty() ? 0 : 1e3 * opDur[opDur.size() / 2], opDur.empty() ? 0 : 1e3 * opDur.back());
  if (!arg("out").empty()) backendSave(arg("out"));
  return 0;
}

// Always-on trial starts: reset while audio runs, let the "trial" run, getData while running, and
// check that the logged frame clock (data.intervals) starts at the first frame and is contiguous.
static int scResetCheck() {
  auto tr = loadTrace(arg("trace")); replayInit(tr); loadOstPcf(); setDevice();
  std::vector<double> x = loadMic(arg("in")); backendLoop(); backendArm(x);
  mexNoOut({mxStr("reset")}); mexNoOut({mxStr("start")});
  const int fl = (int)getParam("framelen"); int n = (int)argd("n", 200); srand(1);
  long bad0 = 0, badGap = 0, badRows = 0; std::map<long, long> firstVals;
  for (int k = 0; k < n; k++) {
    g_iter = k; g_op = "reset"; mexNoOut({mxStr("reset")});
    sleepS(argd("tmin", 0.03) + (argd("tmax", 0.08) - argd("tmin", 0.03)) * (rand() / (double)RAND_MAX));
    g_op = "getData"; Data d = getData();
    size_t rows = d.datCols ? d.dat.size() / d.datCols : 0;
    if (rows < 2) { badRows++; continue; }
    long first = lround(d.dat[0]); firstVals[first]++;
    if (first != 1) bad0++;
    for (size_t r = 1; r < rows; r++) if (lround(d.dat[r] - d.dat[r - 1]) != fl) { badGap++; break; }
    if (rows * fl != d.n && rows * fl != d.n + fl && rows * fl + fl != d.n) badRows++;
  }
  g_op = "stop"; mexNoOut({mxStr("stop")});
  printf("resetcheck: %d resets while running: first logged frame != 1 in %ld; non-contiguous frame clock in %ld; data/signal length mismatch >1 frame in %ld\n", n, bad0, badGap, badRows);
  for (auto &kv : firstVals) printf("  data.intervals(1) = %ld : %ld trials\n", kv.first, kv.second);
  return 0;
}

// Start/stop cycling (per-trial start/stop pattern), with a watchdog to detect hangs.
static int scStartStop() {
  auto tr = loadTrace(arg("trace")); replayInit(tr); setDevice();
  std::vector<double> x = loadMic(arg("in"));
  backendLoop();
  backendArm(x);
  int n = (int)argd("n", 200); double run = argd("run", 0.01);
  std::atomic<long> progress{0};
  std::thread wd([&] { long last = -1; double t = nowS(); while (progress.load() < n) { sleepS(0.2); long p = progress.load();
    if (p != last) { last = p; t = nowS(); } else if (nowS() - t > 10) { fprintf(stderr, "*** WATCHDOG: no progress for 10 s at cycle %ld (op %s) -> hang\n", p, g_op.load()); _exit(99); } } });
  for (int k = 0; k < n; k++) {
    g_iter = k; g_op = "start"; mexNoOut({mxStr("start")}); sleepS(run);
    g_op = "stop"; mexNoOut({mxStr("stop")}); progress = k + 1;
  }
  wd.join();
  printf("startstop: %d cycles ok, callbacks %ld\n", n, backendCallbacks());
  return 0;
}

// Devices as seen by Audapter('info') and the first-call behaviour.
static int scInfo() {
  g_mexQuiet = 0; g_op = "info"; mexNoOut({mxStr("info")});
  if (!arg("device").empty()) { mexNoOut({mxStr("deviceName"), mxStr(arg("device"))}); mexNoOut({mxStr("info")}); }
  return 0;
}

static void usage() {
  fprintf(stderr,
    "live_driver <scenario> key=value...\n"
    "  offline   trace= in= [ost= pcf=] out= [lead=N] [quant=float32|int32]\n"
    "  live      trace= in= [ost= pcf= device=] out= [tail=s] [getdata_running=1]\n"
    "  alwayson  trace= in= [ost= pcf=] trials= triallen= [ops=init,ost,pcf,setp,reset,getdata] [out=]\n"
    "  hammer    trace= in= [ost= pcf=] op=pcf|ost|ostpcf|init|reset|pertamp|getdata|tdratio secs= [gap=]\n"
    "  startstop trace= in= n= run=\n"
    "  resetcheck trace= in= [ost= pcf=] n= [tmin= tmax=]\n"
    "  info      [device=]\n");
}

int main(int argc, char **argv) {
  if (argc < 2) { usage(); return 2; }
  for (int i = 2; i < argc; i++) { std::string s(argv[i]); size_t e = s.find('='); if (e != std::string::npos) A[s.substr(0, e)] = s.substr(e + 1); }
  if (arg("verbose") == "1") g_mexQuiet = 0;
#if defined(__SANITIZE_ADDRESS__) || defined(__SANITIZE_THREAD__)
  __sanitizer_set_death_callback(deathNote);
#else
  signal(SIGSEGV, segvHandler); signal(SIGBUS, segvHandler); signal(SIGABRT, segvHandler);
#endif
  setvbuf(stdout, nullptr, _IOLBF, 0);
  backendInit();
  std::string sc = argv[1]; int rc = 2;
  try {
    if (sc == "offline") rc = scOffline();
    else if (sc == "live") rc = scLive();
    else if (sc == "alwayson") rc = scAlwaysOn();
    else if (sc == "hammer") rc = scHammer();
    else if (sc == "startstop") rc = scStartStop();
    else if (sc == "resetcheck") rc = scResetCheck();
    else if (sc == "info") rc = scInfo();
    else usage();
  } catch (MexError &e) { fprintf(stderr, "MEX error (op %s): %s\n", g_op.load(), e.what()); rc = 1; }
  g_op = "exit"; backendClose();
  return rc;
}
