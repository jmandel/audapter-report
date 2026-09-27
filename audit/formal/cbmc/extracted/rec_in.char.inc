/* VERBATIM Audapter.cpp:1683-1687 (blab 169cadf) sha256=76af73a2d6cfb3d4 */
	if (p.bRecord) {	// Record the downsampled original signal
		DSPF_dp_blk_move(inFrameBuf,
                         &signal_recorder[0][frame_counter * p.frameLen],
                         p.frameLen);
	}
