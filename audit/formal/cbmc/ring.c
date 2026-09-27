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
#ifdef FCONST
    F = FCONST;                     /* run.sh enumerates every F in [1, 960] */
#else
    F = nondet_int(); __CPROVER_assume(1 <= F && F <= maxFrameLen);
#endif
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
    k = nondet_int(); __CPROVER_assume(0 <= k && k <= internalBufLen);
    c = k * F; __CPROVER_assume(c < internalBufLen);
    outFrameBuf_circPtr = (int)c;
    ifb = nondet_int(); __CPROVER_assume(0 <= ifb && ifb < p.nFB);
    D = p.delayFrames[ifb];
    for (int v = 0; v < maxNVoices; v++) pVocs[v] = &pv0;
}


/* Each property block is guarded by `if (...)`, not assume, so that one run can check several
 * properties without one block's preconditions vacuously discharging another's. */
int main(void) {
    params();
    int F_div_L = divides(F, internalBufLen), F_div_R = divides(F, maxRecSize);
    int sumOK = (N >= F && N <= SUMLEN);
    int sel = nondet_int();        /* which block runs on this path (all are explored) */

#ifdef GROUP_PASS   /* run with --bounds-check --pointer-check: everything below must be memory safe */
    if (sel == 1 && F_div_L) {                         /* current frame into ring (1962; 1948/1952 same ptr/len) */
#include "extracted/curframe.inc"
    }
    if (sel == 2 && F_div_L) {                         /* no-pitch-shift copy into every voice ring */
#include "extracted/nopvoc_copy.inc"
        assert(bm_dst_off % internalBufLen + bm_n <= internalBufLen);   /* stays inside row i0 */
    }
    if (sel == 3) {                                    /* pvoc analysis copy: safe for every c, N <= 4096 */
#include "extracted/pvoc_in.inc"
        if (bm_j >= 0) assert(pmod(bm_src_off - (c - N), internalBufLen) == bm_dst_off);
    }
    if (sel == 4) {                                    /* OLA with positive-modulo back zeroing: always safe */
#include "extracted/pvoc_ola.fixed.inc"
    }
    if (sel == 5 && F_div_L && sumOK) {                /* DAF read with `>= 0` */
#include "extracted/optr_sum.fixed.inc"
        for (int m = 0; m < p.nFB; m++) {
            assert(0 <= optr[m] && optr[m] + F <= internalBufLen);
            assert(optr[m] == pmod(c - p.delayFrames[m] * F, internalBufLen)); /* = frame written d frames ago */
        }
    }
    if (sel == 6 && F_div_R && sumOK) {                /* recorder writes */
        frame_counter = nondet_int(); __CPROVER_assume(frame_counter >= 0 && frame_counter * F < maxRecSize);
        p.bRecord = 1;
#include "extracted/rec_in.inc"
        assert(bm_dst_off + bm_n <= maxRecSize);       /* row 0 must not spill into row 1 */
#include "extracted/rec_out.inc"
    }
    if (sel == 7) {                                    /* ring pointer invariant (inductive step) */
        int before = c;
#include "extracted/circ_step.inc"
        assert(0 <= outFrameBuf_circPtr && outFrameBuf_circPtr < internalBufLen);
        assert(outFrameBuf_circPtr % F == 0);
        if (F_div_L) assert(outFrameBuf_circPtr == (before + F) % internalBufLen);
    }
    if (sel == 8) {                                    /* recorder counter invariant (inductive step) */
        frame_counter = nondet_int(); __CPROVER_assume(frame_counter >= 0 && frame_counter * F < maxRecSize);
        data_counter = frame_counter;
        p.nWin = nondet_int(); __CPROVER_assume(1 <= p.nWin && p.nWin <= F);
        data_counter++;                                /* 2181 */
#include "extracted/fc_step.inc"
        { frame_counter = 0; data_counter = 0; }       /* 2309-2310 */
        assert(frame_counter >= 0 && frame_counter * F < maxRecSize);
        assert(data_counter == frame_counter);
    }
#endif

#ifdef GROUP_EXACT  /* exact characterisation of every out-of-bounds access in the ORIGINAL code */
    if (sel == 1) {   /* current-frame write overflows iff c + F > L; reachable iff F does not divide L */
#include "extracted/curframe.inc"
        assert((bm_dst_off + bm_n > internalBufLen) == (c + F > internalBufLen));
        if (c + F > internalBufLen) assert(!F_div_L);
        { int kk = (internalBufLen - 1) / F;
          if (!F_div_L) assert(kk * F < internalBufLen && kk * F + F > internalBufLen); }
    }
    if (sel == 2) {
#include "extracted/nopvoc_copy.inc"
        assert((bm_dst_off % internalBufLen + bm_n > internalBufLen) == (c + F > internalBufLen));
    }
    if (sel == 3) {   /* back zeroing: per iteration negative iff c - dF - i0 < 0; at i0 = H iff c < dF + H */
#include "extracted/pvoc_ola.char.inc"
        assert(ps_hits == 0 || ps_row == ifb);
        if (i0 >= 1 && i0 <= H && ps_hits > 0) {
            assert((ps_idx < 0) == (c - D * F - i0 < 0));
            assert(ps_idx < internalBufLen);
            if (i0 == H) assert((ps_idx < 0) == (c < D * F + H));
        }
    }
    if (sel == 4 && c >= D * F + H) {   /* accumulate + front zeroing never go out of range */
#include "extracted/pvoc_ola.char.inc"
        assert(!ps_bad_any);
    }
    if (sel == 5) {   /* the fix changes nothing where the original index was valid */
#include "extracted/pvoc_ola.fixed.char.inc"
        if (i0 >= 1 && i0 <= H && ps_hits > 0) {
            int orig = (c - D * F - i0) % internalBufLen;
            if (orig >= 0) assert(ps_idx == orig);
            assert(ps_idx == pmod(c - D * F - i0, internalBufLen));
        }
    }
    if (sel == 6 && sumOK) {   /* DAF read with the original `> 0` */
#include "extracted/optr_sum.char.inc"
        for (int m = 0; m < p.nFB; m++) {
            int dF = p.delayFrames[m] * F;
            int pred = (c == dF) || (c > dF && c - dF + F > internalBufLen);
            assert((optr[m] + F > internalBufLen) == pred);   /* last sample n0 = F-1 OOB iff pred */
            assert(optr[m] >= 0);
            if (c == dF) assert(optr[m] == internalBufLen);   /* whole frame read from row m+1 */
            if (F_div_L) assert(pred == (c == dF));           /* F | L: only the k == d frame */
        }
        if (ps_hits > 0) assert(ps_bad_any == (ps_idx >= internalBufLen));
    }
    if (sel == 7) {   /* outFrameBufSum index n0 + N - F, used on EVERY frame */
#include "extracted/optr_sum.char.inc"
        if (sum_hits > 0) {
            assert(!sum_bad_any || N < F || N > SUMLEN);
            if (sum_idx == N - F) assert(sum_bad_any == (N < F));        /* n0 = 0 */
            if (sum_idx == N - 1) assert(sum_bad_any == (N > SUMLEN));   /* n0 = F-1 */
        }
    }
    if (sel == 8 && sumOK) {   /* recorder: overflow iff (fc+1)F > R; reachable iff F does not divide R */
        frame_counter = nondet_int(); __CPROVER_assume(frame_counter >= 0 && frame_counter * F < maxRecSize);
        p.bRecord = 1;
#include "extracted/rec_in.inc"
        assert((bm_dst_off + bm_n > maxRecSize) == (frame_counter * F + F > maxRecSize));
#include "extracted/rec_out.inc"
        assert((bm_dst_off - maxRecSize + bm_n > maxRecSize) == (frame_counter * F + F > maxRecSize));
        if (frame_counter * F + F > maxRecSize) assert(!F_div_R);
        { int kk = (maxRecSize - 1) / F;
          if (!F_div_R) assert(kk * F < maxRecSize && kk * F + F > maxRecSize); }
    }
    if (sel == 9) {   /* ring step is consistent iff F | L */
        int before = c;
#include "extracted/circ_step.inc"
        if (!F_div_L && before == ((internalBufLen - 1) / F) * F)
            assert(outFrameBuf_circPtr != (before + F) % internalBufLen);   /* wrap drops L mod F samples */
    }
#endif

#ifdef DEMO_FAIL    /* expected FAIL: original code, full parameter domain, with bounds checks on */
    if (sel == 1) {
#include "extracted/pvoc_ola.inc"
    }
    if (sel == 2 && sumOK) {
#include "extracted/optr_sum.inc"
    }
#endif
    return 0;
}
