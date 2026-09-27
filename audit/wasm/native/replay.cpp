// Native replay driver (same C API as the WASM build) used to attribute WASM-vs-MEX differences.
// Usage: replay <cmds.txt> <in.f64> <outdir>   (cmds.txt produced by test/cmds2txt.mjs)
// Writes outdir/{out,sig,data}.f64 in the same layout as harness/oct/wasm_export.m.
#include <cstdio>
#include <cstdlib>
#include <string>
#include <vector>
#include <chrono>
#include <algorithm>
extern "C" {
int aud_create(); int aud_reset(); int aud_set_param(const char *, const double *, int);
int aud_load_ost(const char *); int aud_load_pcf(const char *); int aud_frame_size();
int aud_process(const double *, double *, int); int aud_get_signal(const double **, const double **);
int aud_get_data(const double **, int *, int *); const char *aud_last_error();
}
struct Cmd { int at; char op; std::string name, text; std::vector<double> v; };
static void chk(int rc, const char *w) { if (rc < 0) { fprintf(stderr, "%s: %s\n", w, aud_last_error()); exit(1); } }
int main(int argc, char **argv) {
  if (argc < 4) return 2;
  FILE *f = fopen(argv[1], "rb"); std::vector<Cmd> cmds;
  int at; char op[8];
  while (fscanf(f, "%d %7s", &at, op) == 2) {
    Cmd c; c.at = at; c.op = op[0];
    if (c.op == 'P') { char nm[256]; int n; fscanf(f, "%255s %d", nm, &n); c.name = nm; c.v.resize(n); for (auto &x : c.v) fscanf(f, "%la", &x); }
    else if (c.op == 'O' || c.op == 'C') { int n; fscanf(f, "%d", &n); fgetc(f); c.text.resize(n); if (n) fread(&c.text[0], 1, n, f); }
    cmds.push_back(c);
  }
  fclose(f);
  f = fopen(argv[2], "rb"); std::vector<double> in; double x; while (fread(&x, 8, 1, f) == 1) in.push_back(x); fclose(f);
  chk(aud_create(), "create");
  size_t ci = 0;
  auto run = [&](long k) { for (; ci < cmds.size() && cmds[ci].at <= k; ci++) { Cmd &c = cmds[ci];
    if (c.op == 'P') chk(aud_set_param(c.name.c_str(), c.v.data(), (int)c.v.size()), c.name.c_str());
    else if (c.op == 'O') chk(aud_load_ost(c.text.c_str()), "ost");
    else if (c.op == 'C') chk(aud_load_pcf(c.text.c_str()), "pcf");
    else if (c.op == 'R') chk(aud_reset(), "reset"); } };
  run(0);
  int N = aud_frame_size(); long nf = in.size() / N; std::vector<double> out(in.size());
  for (long k = 0; k < nf; k++) { run(k); chk(aud_process(&in[k * N], &out[k * N], N), "process"); }
  if (getenv("BENCH_SECONDS")) {  // timing mode: keep processing the input in a loop, report per-frame cost
    long total = (long)(atof(getenv("BENCH_SECONDS")) * (48000.0 / N));
    std::vector<double> t(total), y(N);
    for (long k = 0; k < total + 200; k++) {
      auto t0 = std::chrono::steady_clock::now(); aud_process(&in[(k % nf) * N], y.data(), N); auto t1 = std::chrono::steady_clock::now();
      if (k >= 200) t[k - 200] = std::chrono::duration<double, std::micro>(t1 - t0).count();
    }
    double m = 0; for (double v : t) m += v; m /= total; std::sort(t.begin(), t.end());
    printf("native N=%d: mean %.1f us p50 %.1f p99 %.1f max %.1f us\n", N, m, t[total / 2], t[(long)(total * 0.99)], t[total - 1]);
    return 0;
  }
  run(1L << 40);
  std::string od = argv[3];
  f = fopen((od + "/out.f64").c_str(), "wb"); fwrite(out.data(), 8, out.size(), f); fclose(f);
  const double *si, *so; int n = aud_get_signal(&si, &so);
  f = fopen((od + "/sig.f64").c_str(), "wb"); fwrite(si, 8, n, f); fwrite(so, 8, n, f); fclose(f);
  const double *d; int vs, stride; int rows = aud_get_data(&d, &vs, &stride);
  f = fopen((od + "/data.f64").c_str(), "wb"); for (int j = 0; j < vs; j++) fwrite(d + (size_t)j * stride, 8, rows, f); fclose(f);
  printf("replayed %ld frames of %d, data %dx%d\n", nf, N, rows, vs);
}
