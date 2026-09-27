// Minimal MATLAB MEX API emulation for driving mexFunction from a native C++ program
// (audit "live" harness). Only what Audapter uses. mexErrMsgTxt throws MexError, which is
// how MATLAB behaves from the caller's point of view (the MEX call aborts with an error).
#pragma once
#include <cstddef>
#include <cstdarg>
#include <string>
#include <vector>
#include <stdexcept>

typedef size_t mwSize;
typedef size_t mwIndex;
enum mxComplexity { mxREAL = 0, mxCOMPLEX = 1 };
enum mxClassID { mxDOUBLE_CLASS, mxCHAR_CLASS, mxSTRUCT_CLASS };

struct mxArray {
  mxClassID cls = mxDOUBLE_CLASS;
  mwSize dims[2] = {0, 0};
  std::vector<double> d;                 // double data (column major)
  std::string s;                         // char data
  std::vector<std::string> fieldNames;   // struct
  std::vector<mxArray*> fields;          // struct (1x1 only)
};

struct MexError : std::runtime_error { using std::runtime_error::runtime_error; };

void mexErrMsgTxt(const char *msg);
int mexPrintf(const char *fmt, ...);
double *mxGetPr(const mxArray *a);
const mwSize *mxGetDimensions(const mxArray *a);
mwSize mxGetNumberOfDimensions(const mxArray *a);
int mxGetString(const mxArray *a, char *buf, mwSize buflen);
char *mxArrayToString(const mxArray *a);
mxArray *mxCreateDoubleMatrix(mwSize m, mwSize n, mxComplexity c);
mxArray *mxCreateStructArray(mwSize ndim, const mwSize *dims, int nfields, const char **fieldnames);
void mxSetField(mxArray *a, mwIndex i, const char *fieldname, mxArray *value);
void mxDestroyArray(mxArray *a);

// helpers for the driver (not MATLAB API)
mxArray *mxStr(const std::string &s);
mxArray *mxScalar(double v);
mxArray *mxVec(const std::vector<double> &v, bool column = false);
extern int g_mexQuiet;   // 1: suppress mexPrintf output
