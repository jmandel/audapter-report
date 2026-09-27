/* VERBATIM Audapter.cpp:2211-2213 (blab 169cadf) sha256=a690abdf476b3ab9 */
		DSPF_dp_blk_move(outFrameBufSum + p.pvocFrameLen - p.frameLen, 
						 &signal_recorder[1][frame_counter * p.frameLen], 
						 p.frameLen);
