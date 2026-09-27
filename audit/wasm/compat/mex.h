// Minimal MEX API stub for the WASM build of Audapter (no MATLAB/Octave).
// mexErrMsgTxt throws AudapterError, which the C API (audapter_c.cpp) catches and turns into an error code.
#pragma once
#include <cstdio>
#include <cstdarg>
#include <cstdlib>
#include <cstring>
#include <stdexcept>
#include <string>
#include <vector>

typedef size_t mwSize;
typedef enum { mxREAL = 0, mxCOMPLEX = 1 } mxComplexity;
struct mxArray { std::vector<double> d; size_t m = 0, n = 0; };
struct AudapterError : std::runtime_error { using std::runtime_error::runtime_error; };

extern int g_mex_verbose;
inline void mexPrintf(const char *fmt, ...) {
  if (!g_mex_verbose) return;
  va_list ap; va_start(ap, fmt); vprintf(fmt, ap); va_end(ap);
}
[[noreturn]] inline void mexErrMsgTxt(const char *msg) { throw AudapterError(msg); }
inline mxArray *mxCreateDoubleMatrix(mwSize m, mwSize n, mxComplexity) {
  mxArray *a = new mxArray; a->m = m; a->n = n; a->d.assign(m * n, 0.0); return a;
}
inline double *mxGetPr(const mxArray *a) { return const_cast<double *>(a->d.data()); }
inline mxArray *mxCreateStructArray(mwSize, const mwSize *, int, const char **) { return new mxArray; }
inline void mxSetField(mxArray *, int, const char *, mxArray *v) { delete v; }
