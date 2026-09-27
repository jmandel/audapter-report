// Minimal Win32/MSVC shim so Audapter's DSP core compiles on Linux (audit harness only).
#pragma once
#include <cstdio>
#include <cstring>
#include <cstdarg>
#include <cerrno>
#include <algorithm>
#define __stdcall
template <typename... A> inline int sprintf_s(char *b, size_t n, const char *f, A... a) { return snprintf(b, n, f, a...); }
template <size_t N, typename... A> inline int sprintf_s(char (&b)[N], const char *f, A... a) { return snprintf(b, N, f, a...); }
#define vsprintf_s(buf, sz, fmt, ap) vsnprintf((buf), (sz), (fmt), (ap))
inline int strcpy_s(char *d, size_t n, const char *s) { if (!d || !s || strlen(s) >= n) return EINVAL; strcpy(d, s); return 0; }
template <size_t N> inline int strcpy_s(char (&d)[N], const char *s) { return strcpy_s(d, N, s); }
inline int fopen_s(FILE **f, const char *fn, const char *mode) { *f = fopen(fn, mode); return *f ? 0 : errno; }
using std::min; using std::max;
