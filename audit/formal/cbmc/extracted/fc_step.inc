/* VERBATIM Audapter.cpp:2304-2307 (blab 169cadf) sha256=edc06c7a9aec4899 */
	frame_counter++;
	frame_counter_nowarp++;

	if (((frame_counter)*p.frameLen>=maxRecSize) || ((data_counter+p.nWin)>=maxDataSize)) //avoid segmentation violation
