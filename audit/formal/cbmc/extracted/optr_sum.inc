/* VERBATIM Audapter.cpp:2110-2128 (blab 169cadf) sha256=906aa48956b2d3fc */
	for (int h0 = 0; h0 < p.nFB; h0++) {
		if (outFrameBuf_circPtr - p.delayFrames[h0] * p.frameLen > 0) {
			optr[h0] = outFrameBuf_circPtr - p.delayFrames[h0] * p.frameLen;
		}
		else {
			optr[h0] = outFrameBuf_circPtr - p.delayFrames[h0] * p.frameLen + internalBufLen;
		}
	}

	// Sum to cumulative buffer (p.nFB)
	for (int n0 = nondet_int(), __once_n0 = (0) <= n0 && n0 < (p.frameLen); __once_n0; __once_n0 = 0) {
		outFrameBufSum[n0 + p.pvocFrameLen - p.frameLen] = 0;
		for (int m0 = nondet_int(), __once_m0 = (0) <= m0 && m0 < (p.nFB); __once_m0; __once_m0 = 0) {
            if (!p.mute[m0]) {
                outFrameBufSum[n0 + p.pvocFrameLen - p.frameLen] += outFrameBufPS[m0][optr[m0] + n0] * p.gain[m0];
            }
		}
	}

