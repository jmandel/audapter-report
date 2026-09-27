/* VERBATIM Audapter.cpp:2676-2701 (blab 169cadf) sha256=bed3c6d93f3c0ca4 */
	//SC Locate the value of f2 in the pertF1 table, through a binary search.
	//SC Used for subsequent interpolation.
	dtype loc;
	int k = 1 << (pfNBit - 1), n;

	for (n = 0; n < pfNBit - 1; n++) {
		if (f1 >= p.pertF1[k])
			k = k + (1 << (pfNBit - n - 2));
		else
			k = k - (1 << (pfNBit - n - 2));
	}
	if (f1 < p.pertF1[k])
		k--;

	loc = (dtype)(k);

	loc += (f1 - p.pertF1[k]) / (p.pertF1[k + 1] - p.pertF1[k]);

	if (loc >= pfNPoints - 1) {	//pfNPoints=257, so locint not be greater than 255 (pfNPoints-2)
		loc = pfNPoints - 1 - 0.000000000001;
	}
	if (loc < 0) {
		loc = 0;
	}
	return loc;
}
