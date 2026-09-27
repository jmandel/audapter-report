#include "mex.h"
#include <cstdio>
#include <cstring>
#include <cstdlib>

int g_mexQuiet = 1;

void mexErrMsgTxt(const char *msg) { throw MexError(msg ? msg : "(null)"); }
int mexPrintf(const char *fmt, ...) {
  if (g_mexQuiet) return 0;
  va_list ap; va_start(ap, fmt); int r = vfprintf(stderr, fmt, ap); va_end(ap); return r;
}
double *mxGetPr(const mxArray *a) {
  if (!a || a->cls != mxDOUBLE_CLASS) return nullptr;
  return a->d.empty() ? nullptr : const_cast<double *>(a->d.data());
}
const mwSize *mxGetDimensions(const mxArray *a) { return a->dims; }
mwSize mxGetNumberOfDimensions(const mxArray *) { return 2; }
int mxGetString(const mxArray *a, char *buf, mwSize buflen) {
  if (!a || a->cls != mxCHAR_CLASS || buflen == 0) return 1;
  size_t n = a->s.size() < buflen - 1 ? a->s.size() : buflen - 1;
  memcpy(buf, a->s.data(), n); buf[n] = 0;
  return a->s.size() + 1 > buflen ? 1 : 0;
}
char *mxArrayToString(const mxArray *a) {
  if (!a || a->cls != mxCHAR_CLASS) return nullptr;
  return strdup(a->s.c_str());   // MATLAB: mxMalloc'd, freed at MEX exit; leaked here
}
mxArray *mxCreateDoubleMatrix(mwSize m, mwSize n, mxComplexity) {
  mxArray *a = new mxArray; a->dims[0] = m; a->dims[1] = n; a->d.assign(m * n, 0.0); return a;
}
mxArray *mxCreateStructArray(mwSize, const mwSize *, int nf, const char **fn) {
  mxArray *a = new mxArray; a->cls = mxSTRUCT_CLASS; a->dims[0] = a->dims[1] = 1;
  for (int i = 0; i < nf; i++) { a->fieldNames.push_back(fn[i]); a->fields.push_back(nullptr); }
  return a;
}
void mxSetField(mxArray *a, mwIndex, const char *f, mxArray *v) {
  for (size_t i = 0; i < a->fieldNames.size(); i++)
    if (a->fieldNames[i] == f) { a->fields[i] = v; return; }
}
void mxDestroyArray(mxArray *a) {
  if (!a) return;
  for (auto *f : a->fields) mxDestroyArray(f);
  delete a;
}
mxArray *mxStr(const std::string &s) {
  mxArray *a = new mxArray; a->cls = mxCHAR_CLASS; a->s = s; a->dims[0] = 1; a->dims[1] = s.size(); return a;
}
mxArray *mxScalar(double v) { mxArray *a = mxCreateDoubleMatrix(1, 1, mxREAL); a->d[0] = v; return a; }
mxArray *mxVec(const std::vector<double> &v, bool column) {
  mxArray *a = mxCreateDoubleMatrix(column ? v.size() : 1, column ? 1 : v.size(), mxREAL); a->d = v; return a;
}
