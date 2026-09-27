/* CBMC harness: ring-buffer and recorder index arithmetic of Audapter::handleBuffer.
 *
 * The code under test is #included from extracted/*.inc, which extract.py copies verbatim from
 * blab Audapter.cpp (hash-pinned).  This file only declares the buffers with their real sizes
 * (Audapter.h:151-186, 238-313), constrains the parameters, and states the properties.
 * One property group per -DPROP_xxx; see run.sh for which are expected to pass/fail.
 *
 * Buffers are separate C objects here (in the C++ class they are adjacent members, so an
 * overflow of one silently lands in the next; ASan cannot see that, CBMC here can).
 */
#include <assert.h>
typedef double dtype;
#define internalBufLen 1728000          /* maxFrameLen * downSampFact_default * maxDelayFrames */
#define maxRecSize     480000
#define maxDataSize    480000
#define maxNVoices     4
#define maxFrameLen    960
#define max_nFFT       4096
#define maxDelayFrames 600
#define SUMLEN (maxFrameLen * 3)        /* outFrameBufSum[maxFrameLen * downSampFact_default] */

int nondet_int(void);

struct { int frameLen, pvocFrameLen, pvocHop, nFB, nWin, bRecord;
         int delayFrames[maxNVoices]; int mute[maxNVoices]; double gain[maxNVoices]; } p;

dtype outFrameBuf[internalBufLen];
dtype outFrameBufPS[maxNVoices][internalBufLen];
dtype outFrameBufSum[SUMLEN];
dtype xBuf[max_nFFT];
dtype inFrameBuf[maxFrameLen * 3];
dtype signal_recorder[2][maxRecSize];
int outFrameBuf_circPtr, optr[maxNVoices], i0, ifb;
int frame_counter, data_counter; int frame_counter_nowarp;
struct PV { dtype *ftBuf2; } pv0;
struct PV *pVocs[maxNVoices];

/* ---- DSPF_dp_blk_move model: memcpy of nx doubles.  We copy one arbitrary element (so
 * --pointer-check checks every element's address) and record where the call pointed. ---- */
const void *bm_src_obj, *bm_dst_obj; int bm_src_off, bm_dst_off, bm_n, bm_j; int bm_calls;
void DSPF_dp_blk_move(const double *x, double *r, const int nx) {
    bm_calls++;
    bm_src_off = __CPROVER_POINTER_OFFSET(x) / (int)sizeof(double);
    bm_dst_off = __CPROVER_POINTER_OFFSET(r) / (int)sizeof(double);
    bm_n = nx;
    int j = nondet_int();
    bm_j = -1;
    if (0 <= j && j < nx) { bm_j = j; r[j] = x[j]; }
}

/* ---- index recorders used by the *.char.inc variants ---- */
double sink;
int ps_row, ps_idx; int ps_hits;  int sum_idx; int sum_hits;
int ps_bad_any;  /* some ACC_PS in this path was out of [0, internalBufLen) */
double *ACC_PS(int row, int idx) {
    ps_row = row; ps_idx = idx; ps_hits++;
    if (!(0 <= idx && idx < internalBufLen)) ps_bad_any = 1;
    if (0 <= row && row < maxNVoices && 0 <= idx && idx < internalBufLen) return &outFrameBufPS[row][idx];
    return &sink;
}
int sum_bad_any;
double *ACC_SUM(int idx) {
    sum_idx = idx; sum_hits++;
    if (!(0 <= idx && idx < SUMLEN)) sum_bad_any = 1;
    if (0 <= idx && idx < SUMLEN) return &outFrameBufSum[idx];
    return &sink;
}

static int divides(int a, int b) { return b % a == 0; }
static int pmod(int a, int m) { return ((a % m) + m) % m; }

/* Parameter domain that the code itself admits (setParam clamps, checkParameters, pvoc config) */
int F, N, H, D;   /* frameLen, pvocFrameLen, pvocHop, delayFrames[voice] */
int k, c;        /* c = circPtr = k*F (reachable values, see PROP_CIRC_INV) */
void params(void) {
    F = nondet_int(); __CPROVER_assume(1 <= F && F <= maxFrameLen);
    p.frameLen = F;
    p.nFB = nondet_int(); __CPROVER_assume(1 <= p.nFB && p.nFB <= maxNVoices);
    for (int v = 0; v < maxNVoices; v++) {
        p.delayFrames[v] = nondet_int();
        __CPROVER_assume(0 <= p.delayFrames[v] && p.delayFrames[v] <= maxDelayFrames); /* setParam clamp 1313-1320 */
        p.mute[v] = nondet_int(); p.gain[v] = 1.0;
    }
    int e = nondet_int(); __CPROVER_assume(0 <= e && e <= 12);   /* pvocFrameLen: power of 2 (phase_vocoder.cpp:143) */
    N = 1 << e; p.pvocFrameLen = N;
    H = nondet_int(); __CPROVER_assume(1 <= H && H <= N); p.pvocHop = H;
    k = nondet_int(); __CPROVER_assume(0 <= k);
    c = k * F; __CPROVER_assume(c < internalBufLen);
    outFrameBuf_circPtr = (int)c;
    ifb = nondet_int(); __CPROVER_assume(0 <= ifb && ifb < p.nFB);
    D = p.delayFrames[ifb];
    for (int v = 0; v < maxNVoices; v++) pVocs[v] = &pv0;
}

int main(void) {
    params();

#ifdef PROP_CIRC_INV
    /* Invariant of the ring pointer: 0 <= c < L and F | c (inductive; holds after reset: c = 0, 547). */
    int F_div_L = divides(F, internalBufLen);
    int before = c;
#include "extracted/circ_step.inc"
    assert(0 <= outFrameBuf_circPtr && outFrameBuf_circPtr < internalBufLen);
    assert(outFrameBuf_circPtr % F == 0);
    /* The ring advances consistently (c' = (c+F) mod L) iff F divides L. */
    if (F_div_L) assert(outFrameBuf_circPtr == (before + F) % internalBufLen);
#endif
#ifdef PROP_CIRC_INCONSISTENT     /* expected FAIL: finds F not dividing L where the wrap loses samples */
    int before = c;
#include "extracted/circ_step.inc"
    assert(outFrameBuf_circPtr == (before + F) % internalBufLen);
#endif

#ifdef PROP_CURFRAME_CHECK        /* expected FAIL without F|L */
#include "extracted/curframe.inc"
#endif
#ifdef PROP_CURFRAME_CHECK_FDIVL  /* expected PASS */
    __CPROVER_assume(divides(F, internalBufLen));
#include "extracted/curframe.inc"
#endif
#ifdef PROP_CURFRAME_EXACT
    /* Exact: the write of the current frame overflows the ring iff c + F > L, and such a c is
       reachable (c = kF < L) iff F does not divide L. */
#include "extracted/curframe.inc"
    assert((bm_dst_off + bm_n > internalBufLen) == (c + F > internalBufLen));
    if (c + F > internalBufLen) assert(!divides(F, internalBufLen));
    {   int kk = (internalBufLen - 1) / F;   /* last frame of a lap */
        if (!divides(F, internalBufLen)) assert(kk * F < internalBufLen && kk * F + F > internalBufLen); }
#endif

#ifdef PROP_NOPVOC_CHECK_FDIVL    /* expected PASS */
    __CPROVER_assume(divides(F, internalBufLen));
#include "extracted/nopvoc_copy.inc"
    assert(bm_dst_off % internalBufLen + bm_n <= internalBufLen);   /* stays inside row i0 */
#endif
#ifdef PROP_NOPVOC_EXACT
#include "extracted/nopvoc_copy.inc"
    assert((bm_dst_off % internalBufLen + bm_n > internalBufLen) == (c + F > internalBufLen));
#endif

#ifdef PROP_PVOC_IN
    /* pvoc analysis copy (2002-2009) is in bounds for every ring position whenever N <= 4096,
       and copies exactly the N samples preceding the current frame, modulo the ring. */
#include "extracted/pvoc_in.inc"
    if (bm_j >= 0) assert(pmod(bm_src_off - (c - N), internalBufLen) == bm_dst_off);
#endif

#ifdef PROP_OLA_CHECK             /* expected FAIL (back zeroing) */
#include "extracted/pvoc_ola.inc"
#endif
#ifdef PROP_OLA_FIXED_CHECK       /* expected PASS: positive modulo in back zeroing */
#include "extracted/pvoc_ola.fixed.inc"
#endif
#ifdef PROP_OLA_EXACT
    /* accumulate and front zeroing are always in [0, L); back zeroing index is negative exactly
       when c - D*F - i0 < 0; over all i0 in [1, H] that is exactly c < D*F + H. */
#include "extracted/pvoc_ola.char.inc"
    assert(ps_hits == 0 || ps_row == ifb);
    /* ps_* now hold the back-zeroing access if it ran (it is last); check per-iteration exactness */
    if (i0 >= 1 && i0 <= H && ps_hits > 0) {
        assert((ps_idx < 0) == (c - (int)D * F - i0 < 0));
        assert(ps_idx < internalBufLen);
        if (i0 == H) assert((ps_idx < 0) == (c < (int)D * F + H));
    }
#endif
#ifdef PROP_OLA_ACCFRONT
    /* accumulate + front zeroing only: comment-out-free check by recording: every recorded
       access before back zeroing is in range.  We run the char variant and assert on ps_bad_any
       under the assumption that back zeroing is not the one that failed (c >= D*F + H). */
    __CPROVER_assume(c >= (int)D * F + H);
#include "extracted/pvoc_ola.char.inc"
    assert(!ps_bad_any);
#endif
#ifdef PROP_OLA_FIXED_SAME
    /* The fix changes nothing where the original index was already valid. */
#include "extracted/pvoc_ola.fixed.char.inc"
    if (i0 >= 1 && i0 <= H && ps_hits > 0) {
        int orig = (c - (int)D * F - i0) % internalBufLen;
        if (orig >= 0) assert(ps_idx == orig);
        assert(ps_idx == pmod(c - (int)D * F - i0, internalBufLen));
    }
#endif

#ifdef PROP_OPTR_CHECK            /* expected FAIL */
#include "extracted/optr_sum.inc"
#endif
#ifdef PROP_OPTR_EXACT
    /* Exact characterisation of the DAF read (2110-2127) with the original `> 0`:
       some sample of voice m is read out of bounds  iff  c == d*F  or  (c > d*F and c - d*F + F > L).
       Since c = kF this is k == d (every lap), or the F-does-not-divide-L tail case. */
    __CPROVER_assume(N >= F && N <= SUMLEN);       /* keep the outFrameBufSum index valid here */
#include "extracted/optr_sum.char.inc"
    for (int m = 0; m < p.nFB; m++) {
        int dF = (int)p.delayFrames[m] * F;
        int pred = (c == dF) || (c > dF && c - dF + F > internalBufLen);
        assert((optr[m] + F > internalBufLen) == pred);   /* last sample n0 = F-1 is OOB iff pred */
        assert(optr[m] >= 0);
        if (c == dF) assert(optr[m] == internalBufLen);   /* reads row m+1 (or past the array) */
    }
    if (ps_hits > 0) assert(ps_bad_any == (ps_idx >= internalBufLen));
#endif
#ifdef PROP_OPTR_FIXED_CHECK_FDIVL   /* expected PASS: `>= 0` + F | L + F <= N <= 2880 */
    __CPROVER_assume(divides(F, internalBufLen));
    __CPROVER_assume(N >= F && N <= SUMLEN);
#include "extracted/optr_sum.fixed.inc"
    for (int m = 0; m < p.nFB; m++) {
        assert(0 <= optr[m] && optr[m] + F <= internalBufLen);
        assert(optr[m] == pmod(c - (int)p.delayFrames[m] * F, internalBufLen)); /* reads the frame written d frames ago */
    }
#endif
#ifdef PROP_OPTR_FIXED_CHECK_ANY    /* expected FAIL: `>= 0` alone is not enough when F does not divide L */
    __CPROVER_assume(N >= F && N <= SUMLEN);
#include "extracted/optr_sum.fixed.inc"
#endif
#ifdef PROP_SUM_EXACT
    /* outFrameBufSum index n0 + N - F (2121/2124, used on EVERY frame, pitch shift or not):
       some index is out of [0, 2880) iff N < F or N > 2880. */
#include "extracted/optr_sum.char.inc"
    if (sum_hits > 0) {
        extern int nondet_int(void);
        /* the recorded index belongs to the arbitrary n0 chosen; exactness at the extremes: */
        assert(sum_bad_any == (sum_idx < 0 || sum_idx >= SUMLEN));
        if (sum_idx == (int)N - F) assert(sum_bad_any == (N < F));            /* n0 = 0 */
        if (sum_idx == (int)N - 1) assert(sum_bad_any == (N > SUMLEN));        /* n0 = F-1 */
        assert(!sum_bad_any || N < F || N > SUMLEN);
    }
#endif

#ifdef PROP_REC_INV
    /* Recorder counter invariant: frame_counter*F < maxRecSize at every write, and data_counter ==
       frame_counter (both are reset together at 610-611 / 2309-2310 and incremented once per frame). */
    frame_counter = nondet_int(); __CPROVER_assume(frame_counter >= 0 && (int)frame_counter * F < maxRecSize);
    data_counter = frame_counter;
    p.nWin = nondet_int(); __CPROVER_assume(1 <= p.nWin && p.nWin <= F);
    data_counter++;          /* 2181 */
#include "extracted/fc_step.inc"
    { frame_counter = 0; data_counter = 0; }
    assert(frame_counter >= 0 && (int)frame_counter * F < maxRecSize);
    assert(data_counter == frame_counter);
#endif
#ifdef PROP_REC_EXACT
    /* The input and output recorder writes overflow their row iff (fc+1)*F > maxRecSize, which is
       reachable (fc*F < maxRecSize) iff F does not divide maxRecSize. */
    frame_counter = nondet_int(); __CPROVER_assume(frame_counter >= 0 && (int)frame_counter * F < maxRecSize);
    __CPROVER_assume(N >= F && N <= SUMLEN);
    p.bRecord = 1;
#include "extracted/rec_in.inc"
    assert((bm_dst_off + bm_n > maxRecSize) == ((int)frame_counter * F + F > maxRecSize));
#include "extracted/rec_out.inc"
    assert((bm_dst_off - maxRecSize + bm_n > maxRecSize) == ((int)frame_counter * F + F > maxRecSize));
    if ((int)frame_counter * F + F > maxRecSize) assert(!divides(F, maxRecSize));
    {   int kk = (maxRecSize - 1) / F;
        if (!divides(F, maxRecSize)) assert(kk * F < maxRecSize && kk * F + F > maxRecSize); }
#endif
#ifdef PROP_REC_CHECK_FDIVR       /* expected PASS */
    frame_counter = nondet_int(); __CPROVER_assume(frame_counter >= 0 && (int)frame_counter * F < maxRecSize);
    __CPROVER_assume(divides(F, maxRecSize));
    __CPROVER_assume(N >= F && N <= SUMLEN);
    p.bRecord = 1;
#include "extracted/rec_in.inc"
    assert(bm_dst_off + bm_n <= maxRecSize);
#include "extracted/rec_out.inc"
#endif
    return 0;
}
