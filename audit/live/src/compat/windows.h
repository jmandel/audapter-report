// Win32/MSVC shim for the live harness (superset of harness/compat/windows.h).
// Adds just enough Win32 threading/COM surface for RtAudio's ASIO backend to compile on Linux.
// CRITICAL_SECTION is emulated with a *recursive* pthread mutex (Win32 critical sections are
// recursive), so lock semantics match Windows.
#pragma once
#include <cstdio>
#include <cstring>
#include <cstdarg>
#include <cerrno>
#include <cstdint>
#include <algorithm>
#include <pthread.h>
#define __stdcall
template <typename... A> inline int sprintf_s(char *b, size_t n, const char *f, A... a) { return snprintf(b, n, f, a...); }
template <size_t N, typename... A> inline int sprintf_s(char (&b)[N], const char *f, A... a) { return snprintf(b, N, f, a...); }
#define vsprintf_s(buf, sz, fmt, ap) vsnprintf((buf), (sz), (fmt), (ap))
inline int strcpy_s(char *d, size_t n, const char *s) { if (!d || !s || strlen(s) >= n) return EINVAL; strcpy(d, s); return 0; }
template <size_t N> inline int strcpy_s(char (&d)[N], const char *s) { return strcpy_s(d, N, s); }
inline int fopen_s(FILE **f, const char *fn, const char *mode) { *f = fopen(fn, mode); return *f ? 0 : errno; }
using std::min; using std::max;

typedef void *HANDLE; typedef void *HWND; typedef long HRESULT; typedef long LONG; typedef void VOID;
typedef int BOOL; typedef unsigned long DWORD;
#define TRUE 1
#define FALSE 0
#define INFINITE 0xFFFFFFFF
#define FAILED(hr) (((HRESULT)(hr)) < 0)
inline HRESULT CoInitialize(void *) { return 0; }
inline void CoUninitialize() {}
inline HWND GetForegroundWindow() { return nullptr; }

struct CRITICAL_SECTION { pthread_mutex_t m; };
inline void InitializeCriticalSection(CRITICAL_SECTION *c) {
  pthread_mutexattr_t a; pthread_mutexattr_init(&a);
  pthread_mutexattr_settype(&a, PTHREAD_MUTEX_RECURSIVE); pthread_mutex_init(&c->m, &a);
  pthread_mutexattr_destroy(&a);
}
inline void DeleteCriticalSection(CRITICAL_SECTION *c) { pthread_mutex_destroy(&c->m); }
inline void EnterCriticalSection(CRITICAL_SECTION *c) { pthread_mutex_lock(&c->m); }
inline void LeaveCriticalSection(CRITICAL_SECTION *c) { pthread_mutex_unlock(&c->m); }

// Events are only used by RtAudio's blocking (non-callback) mode, which Audapter does not use.
inline HANDLE CreateEvent(void *, BOOL, BOOL, const char *) { return (HANDLE)1; }
inline BOOL SetEvent(HANDLE) { return TRUE; }
inline BOOL ResetEvent(HANDLE) { return TRUE; }
inline BOOL CloseHandle(HANDLE) { return TRUE; }
inline DWORD WaitForMultipleObjects(DWORD, const HANDLE *, BOOL, DWORD) { return 0; }
