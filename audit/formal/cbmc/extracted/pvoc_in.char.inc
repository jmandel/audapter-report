/* VERBATIM Audapter.cpp:2002-2009 (blab 169cadf) sha256=576968c9c98ee7a7 */
			if (outFrameBuf_circPtr - p.pvocFrameLen >= 0)
				DSPF_dp_blk_move(&outFrameBuf[outFrameBuf_circPtr - p.pvocFrameLen], xBuf, p.pvocFrameLen);
			else{ // Take care of wrapping-around
				DSPF_dp_blk_move(&outFrameBuf[0], &xBuf[p.pvocFrameLen - outFrameBuf_circPtr], outFrameBuf_circPtr);
				DSPF_dp_blk_move(&outFrameBuf[internalBufLen - p.pvocFrameLen + outFrameBuf_circPtr], 
								    &xBuf[0], 
									p.pvocFrameLen - outFrameBuf_circPtr);
			}
