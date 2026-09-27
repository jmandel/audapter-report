/* VERBATIM Audapter.cpp:2065-2081 (blab 169cadf) sha256=d8cb2b2fe8de3ea4 */
				// --- Accumulate to buffer ---
				for (int __once_i0 = (i0 = nondet_int(), (0) <= i0 && i0 < (p.pvocFrameLen)); __once_i0; __once_i0 = 0){
					/* Using pVoc results */
					(*ACC_PS(ifb, (outFrameBuf_circPtr + i0) % (internalBufLen))) = 
						(*ACC_PS(ifb, (outFrameBuf_circPtr + i0) % (internalBufLen))) + 
						pVocs[ifb]->ftBuf2[2 * i0];
				}			

				// Front zeroing
				for (int __once_i0 = (i0 = nondet_int(), (0) <= i0 && i0 < (p.pvocHop)); __once_i0; __once_i0 = 0) {
					(*ACC_PS(ifb, (outFrameBuf_circPtr + p.pvocFrameLen + i0) % (internalBufLen))) = 0.;
				}

				// Back Zeroing
				for (int __once_i0 = (i0 = nondet_int(), (1) <= i0 && i0 < (p.pvocHop) + 1); __once_i0; __once_i0 = 0){ // Ad hoc alert!
					(*ACC_PS(ifb, ((outFrameBuf_circPtr - p.delayFrames[ifb] * p.frameLen - i0) % (internalBufLen) + (internalBufLen)) % (internalBufLen))) = 0.;						
				}			
