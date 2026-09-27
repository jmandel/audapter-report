/* VERBATIM Audapter.cpp:2225-2228 (blab 169cadf) sha256=98bdab6e25da8f08 */
	outFrameBuf_circPtr += p.frameLen;
	if (outFrameBuf_circPtr >= internalBufLen){
		outFrameBuf_circPtr = 0;
	}
