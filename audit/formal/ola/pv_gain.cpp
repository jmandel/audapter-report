// Empirical cross-check of ola_exact.py with the REAL phase_vocoder.cpp (blab), Audapter-style OLA
// (Audapter.cpp:2066-2076: accumulate ftBuf2 real parts every hop samples).
#include <cstdio>
#include <cmath>
#include <vector>
#include "phase_vocoder.h"
int main() {
  const int sr = 16000, frameLen = 32, L = 256;
  for (int R : {2, 4, 8}) {
    int hop = L / R;
    for (int sig = 0; sig < 3; sig++) {           // 0: 200 Hz tone, 1: DC, 2: 200+400+600 Hz complex
      PhaseVocoder pv; pv.config(PhaseVocoder::PITCH_SHIFT_ONLY, 5, sr, frameLen, L, hop);
      int N = sr; std::vector<double> x(N), y(N + 2 * L, 0.0);
      for (int n = 0; n < N; n++)
        x[n] = sig == 1 ? 0.1 : sig == 0 ? 0.1 * sin(2 * M_PI * 200 * n / sr)
             : 0.05 * (sin(2 * M_PI * 200 * n / sr) + sin(2 * M_PI * 400 * n / sr + 1) + sin(2 * M_PI * 600 * n / sr + 2));
      for (int c = L; c + L <= N; c += hop) { pv.procFrame(&x[c - L], 0.0); for (int i = 0; i < L; i++) y[c + i] += pv.ftBuf2[2 * i]; }
      // steady state: y[n] should equal g * x[n - L]; report min/max of the instantaneous ratio
      // using the envelope over one hop, and the RMS gain
      double si = 0, so = 0; int a = sr / 4, b = 3 * sr / 4;
      for (int n = a; n < b; n++) { si += x[n - L] * x[n - L]; so += y[n] * y[n]; }
      double gmin = 1e9, gmax = -1e9;
      if (sig == 1) for (int n = a; n < b; n++) { double g = y[n] / x[n - L]; gmin = fmin(gmin, g); gmax = fmax(gmax, g); }
      printf("R=%d %-8s rms gain %.4f (%.2f dB)", R, sig == 0 ? "200Hz" : sig == 1 ? "DC" : "complex", sqrt(so / si), 10 * log10(so / si));
      if (sig == 1) printf("  inst gain range [%.4f, %.4f]", gmin, gmax);
      printf("\n");
    }
  }
}
