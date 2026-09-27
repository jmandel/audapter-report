/* VERBATIM Audapter.cpp:2089-2092 (blab 169cadf) sha256=481b8907eedf53a3 */
        for (int __once_i0 = (i0 = nondet_int(), (0) <= i0 && i0 < (p.nFB)); __once_i0; __once_i0 = 0) {
            DSPF_dp_blk_move(outFrameBuf + outFrameBuf_circPtr,
                &(*ACC_PS(i0, outFrameBuf_circPtr)), p.frameLen);
        }
