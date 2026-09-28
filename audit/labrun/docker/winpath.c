/* labrun winpath: LD_PRELOAD path translation so the lab's Windows paths name real files on Linux.
 *   "C:\Users\Public\x"  (or "C:/Users/...")  ->  $LR_WINROOT/C/Users/Public/x
 *   "\\server\share\x"   (or "//server/...")   ->  $LR_WINROOT/unc/server/share/x
 *   any other path containing '\'                 ->  the same path with '\' replaced by '/'
 * Paths without a backslash or drive prefix are passed through unchanged. Only file-system entry points are
 * wrapped (open/stat/mkdir/opendir/rename/unlink/glob/realpath/...), in Octave and in the processes it starts.
 * Build: gcc -O2 -shared -fPIC -o winpath.so winpath.c -ldl */
#define _GNU_SOURCE
#include <dlfcn.h>
#include <fcntl.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/time.h>
#include <unistd.h>
#include <dirent.h>
#include <glob.h>

static __thread char buf[4][8192];
static __thread int bi;

static int isdrive(const char *p) { return ((p[0] | 32) >= 'a' && (p[0] | 32) <= 'z' && p[1] == ':' && (p[2] == '\\' || p[2] == '/')); }
static const char *tr(const char *p) {
  if (!p) return p;
  /* a Windows absolute path may arrive behind a Linux cwd prefix (make_absolute_filename): "/cwd/C:\x" */
  for (const char *q = p; *q; q++) if (q > p && q[-1] == '/' && (isdrive(q) || (q[0] == '\\' && q[1] == '\\'))) { p = q; break; }
  int drive = ((p[0] | 32) >= 'a' && (p[0] | 32) <= 'z' && p[1] == ':' && (p[2] == '\\' || p[2] == '/'));
  int unc = (p[0] == '\\' && p[1] == '\\');
  if (!drive && !unc && !strchr(p, '\\')) return p;
  const char *root = getenv("LR_WINROOT"); if (!root) root = "/w/win";
  char *o = buf[bi++ & 3]; size_t n = 0, cap = sizeof(buf[0]) - 1;
  if (drive) { n = snprintf(o, cap, "%s/%c", root, p[0] & ~32); p += 2; }
  else if (unc) { n = snprintf(o, cap, "%s/unc", root); p += 1; }
  for (; *p && n < cap; p++) {
    char c = (*p == '\\') ? '/' : *p;
    if (c == '/' && n > 0 && o[n - 1] == '/') continue;   /* collapse "\/" and "//" */
    o[n++] = c;
  }
  while (n > 1 && o[n - 1] == '/') n--;   /* "dir\" names the directory */
  o[n] = 0;
  return o;
}

#define REAL(name) static __typeof__(name) *real_##name; if (!real_##name) real_##name = dlsym(RTLD_NEXT, #name)

int open(const char *p, int f, ...) { REAL(open); mode_t m = 0; if (f & (O_CREAT | O_TMPFILE)) { va_list a; va_start(a, f); m = va_arg(a, int); va_end(a); } return real_open(tr(p), f, m); }
int open64(const char *p, int f, ...) { REAL(open64); mode_t m = 0; if (f & (O_CREAT | O_TMPFILE)) { va_list a; va_start(a, f); m = va_arg(a, int); va_end(a); } return real_open64(tr(p), f, m); }
int openat(int d, const char *p, int f, ...) { REAL(openat); mode_t m = 0; if (f & (O_CREAT | O_TMPFILE)) { va_list a; va_start(a, f); m = va_arg(a, int); va_end(a); } return real_openat(d, tr(p), f, m); }
int openat64(int d, const char *p, int f, ...) { REAL(openat64); mode_t m = 0; if (f & (O_CREAT | O_TMPFILE)) { va_list a; va_start(a, f); m = va_arg(a, int); va_end(a); } return real_openat64(d, tr(p), f, m); }
int creat(const char *p, mode_t m) { REAL(creat); return real_creat(tr(p), m); }
FILE *fopen(const char *p, const char *m) { REAL(fopen); return real_fopen(tr(p), m); }
FILE *fopen64(const char *p, const char *m) { REAL(fopen64); return real_fopen64(tr(p), m); }
FILE *freopen(const char *p, const char *m, FILE *s) { REAL(freopen); return real_freopen(tr(p), m, s); }
int stat(const char *p, struct stat *s) { REAL(stat); return real_stat(tr(p), s); }
int lstat(const char *p, struct stat *s) { REAL(lstat); return real_lstat(tr(p), s); }
int stat64(const char *p, struct stat64 *s) { REAL(stat64); return real_stat64(tr(p), s); }
int lstat64(const char *p, struct stat64 *s) { REAL(lstat64); return real_lstat64(tr(p), s); }
int fstatat(int d, const char *p, struct stat *s, int f) { REAL(fstatat); return real_fstatat(d, tr(p), s, f); }
int fstatat64(int d, const char *p, struct stat64 *s, int f) { REAL(fstatat64); return real_fstatat64(d, tr(p), s, f); }
int statx(int d, const char *p, int f, unsigned int m, struct statx *s) { REAL(statx); return real_statx(d, tr(p), f, m, s); }
int access(const char *p, int m) { REAL(access); return real_access(tr(p), m); }
int faccessat(int d, const char *p, int m, int f) { REAL(faccessat); return real_faccessat(d, tr(p), m, f); }
/* MATLAB's mkdir creates intermediate folders; for translated (Windows) paths the parents are made too */
int mkdir(const char *p, mode_t m) {
  REAL(mkdir); const char *t = tr(p);
  if (t != p) { char q[8192]; strncpy(q, t, sizeof(q) - 1); q[sizeof(q) - 1] = 0;
    for (char *c = q + 1; *c; c++) if (*c == '/') { *c = 0; real_mkdir(q, 0777); *c = '/'; } }
  return real_mkdir(t, m);
}
int mkdirat(int d, const char *p, mode_t m) { REAL(mkdirat); return real_mkdirat(d, tr(p), m); }
int rmdir(const char *p) { REAL(rmdir); return real_rmdir(tr(p)); }
int unlink(const char *p) { REAL(unlink); return real_unlink(tr(p)); }
int unlinkat(int d, const char *p, int f) { REAL(unlinkat); return real_unlinkat(d, tr(p), f); }
int remove(const char *p) { REAL(remove); return real_remove(tr(p)); }
int rename(const char *a, const char *b) { REAL(rename); const char *x = tr(a); return real_rename(x, tr(b)); }
int renameat(int d1, const char *a, int d2, const char *b) { REAL(renameat); const char *x = tr(a); return real_renameat(d1, x, d2, tr(b)); }
int renameat2(int d1, const char *a, int d2, const char *b, unsigned int f) { REAL(renameat2); const char *x = tr(a); return real_renameat2(d1, x, d2, tr(b), f); }
DIR *opendir(const char *p) { REAL(opendir); return real_opendir(tr(p)); }
int chdir(const char *p) { REAL(chdir); return real_chdir(tr(p)); }
char *realpath(const char *p, char *r) { REAL(realpath); return real_realpath(tr(p), r); }
char *canonicalize_file_name(const char *p) { REAL(canonicalize_file_name); return real_canonicalize_file_name(tr(p)); }
ssize_t readlink(const char *p, char *b, size_t n) { REAL(readlink); return real_readlink(tr(p), b, n); }
int symlink(const char *t, const char *l) { REAL(symlink); const char *x = tr(t); return real_symlink(x, tr(l)); }
int link(const char *a, const char *b) { REAL(link); const char *x = tr(a); return real_link(x, tr(b)); }
int chmod(const char *p, mode_t m) { REAL(chmod); return real_chmod(tr(p), m); }
int truncate(const char *p, off_t l) { REAL(truncate); return real_truncate(tr(p), l); }
int utimensat(int d, const char *p, const struct timespec t[2], int f) { REAL(utimensat); return real_utimensat(d, tr(p), t, f); }
int utimes(const char *p, const struct timeval t[2]) { REAL(utimes); return real_utimes(tr(p), t); }
int glob(const char *p, int f, int (*e)(const char *, int), glob_t *g) { REAL(glob); return real_glob(tr(p), f, e, g); }
int glob64(const char *p, int f, int (*e)(const char *, int), glob64_t *g) { REAL(glob64); return real_glob64(tr(p), f, e, g); }
/* programs named by a Windows path (e.g. C:\Users\Public\Desktop\Praat.exe run through system()) */
int execve(const char *p, char *const a[], char *const e[]) { REAL(execve); return real_execve(tr(p), a, e); }
