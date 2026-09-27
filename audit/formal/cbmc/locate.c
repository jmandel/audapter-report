/* CBMC harness: Audapter::locateF1 (Audapter.cpp:2675-2701; locateF2 2703-2728 is the same code
 * on pertF2).  The body is included verbatim.  Grid values and f1 are arbitrary doubles
 * (including NaN/Inf); the caller does locint = (int)floor(loc) (Audapter.cpp:1833-1835) and
 * indexes pertAmp2D[locint][..] / pertAmp[locint], pertAmp[locint+1] (1845-1851). */
#include <assert.h>
#include <math.h>
typedef double dtype;
#define pfNPoints 257
#define pfNBit 8
#define BND(x) (!__CPROVER_isnand(x) && (x) >= -1e6 && (x) <= 1e6)   /* |value| <= 1e6 (Hz or mel) */
struct { dtype pertF1[pfNPoints]; } p;
double nondet_double(void);

dtype locateF1(dtype f1) {
#include "extracted/locateF1.inc"

int main(void) {
    for (int i = 0; i < pfNPoints; i++) p.pertF1[i] = nondet_double();
    dtype f1 = nondet_double();
    dtype loc = locateF1(f1);
#ifdef PROP_NAN_EXACT
    /* The result is NaN, or else it lies in [0, 256); so floor(loc) is a valid row 0..255
       for EVERY grid, sorted or not.  NaN is the only failure. */
    assert(__CPROVER_isnand(loc) || (loc >= 0 && loc < 256));
    if (!__CPROVER_isnand(loc)) { int li = (int)floor(loc); assert(0 <= li && li <= 255); }
#endif
#ifdef PROP_NAN_WHEN
    /* For grid and f1 values of magnitude <= 1e6 (anything larger can overflow f1-g[k] to inf
       and give inf/inf; irrelevant for Hz/mel), NaN happens only as 0/0: f1 equals two equal neighbours. */
    int finite = BND(f1);
    for (int i = 0; i < pfNPoints; i++) finite = finite && BND(p.pertF1[i]);
    if (finite && __CPROVER_isnand(loc)) {
        int found = 0;
        for (int k = 0; k < 256; k++) found = found || (p.pertF1[k] == f1 && p.pertF1[k+1] == f1);
        assert(found);
    }
#endif
#ifdef PROP_SORTED
    /* Strictly increasing grid, values of magnitude <= 1e6: result is finite and in [0, 256); the lower
       bracketing index is exact when f1 is inside the grid. */
    for (int i = 0; i < pfNPoints; i++) __CPROVER_assume(BND(p.pertF1[i]));
    for (int i = 0; i + 1 < pfNPoints; i++) __CPROVER_assume(p.pertF1[i] < p.pertF1[i+1]);
    __CPROVER_assume(BND(f1));
    assert(!__CPROVER_isnand(loc) && loc >= 0 && loc < 256);
#endif
    return 0;
}
