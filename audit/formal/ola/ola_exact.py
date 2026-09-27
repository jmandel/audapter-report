#!/usr/bin/env python3
"""Exact overlap-add sums for the phase vocoder's window (phase_vocoder.cpp:11-13),
   w(i) = 0.5 - 0.5 cos(2 pi i / N)   (periodic Hann; used for analysis AND synthesis),
with hop = N/R (R = osamp = pvocFrameLen/pvocHop, phase_vocoder.cpp:44).

Proof method (exact, all R at once): write z = exp(i*theta), theta = 2 pi n / N.  Then
   w   = 1/2 - z/4 - z^-1/4
   w^2 = 3/8 - (z + z^-1)/4 + (z^2 + z^-2)/16            (Laurent polynomial, rational coeffs)
Summing over the R frames that overlap a sample replaces z^m by z^m * sum_k exp(2 pi i k m / R),
which is R*z^m if R divides m and 0 otherwise.  So for R >= 3 only the constant term survives:
   sum_k w^2 = 3R/8,  sum_k w = R/2       (R >= 3; for R = 2 the z^2 terms survive)
The synthesis scaling (phase_vocoder.cpp:467) is  y = 2*ifft*w/(osamp/2) = (4/R)*w*ifft,  so the
0-semitone gain is (4/R)*(3R/8) = 3/2 exactly (+3.52 dB) for every R >= 3.
This script carries out that computation mechanically with exact fractions for R = 1..64."""
from fractions import Fraction as Fr

def mul(a, b):
    out = {}
    for m, x in a.items():
        for n, y in b.items():
            out[m + n] = out.get(m + n, 0) + x * y
    return {k: v for k, v in out.items() if v != 0}

def ola(poly, R):
    """sum over k=0..R-1 of poly(z * exp(2 pi i k/R)): keep terms with R | m, times R"""
    return {m: R * c for m, c in poly.items() if m % R == 0}

def fmt(p):
    terms = []
    for m in sorted(p):
        c = p[m]
        if m == 0: terms.append(str(c))
        elif m > 0 and p.get(-m) == c: terms.append(f"{2*c}*cos({m}θ)")
    return " + ".join(terms)

w = {0: Fr(1, 2), 1: Fr(-1, 4), -1: Fr(-1, 4)}
w2 = mul(w, w)
assert w2 == {0: Fr(3, 8), 1: Fr(-1, 4), -1: Fr(-1, 4), 2: Fr(1, 16), -2: Fr(1, 16)}
print("w^2 =", w2)
ok = True
for R in range(1, 65):
    s2, s1 = ola(w2, R), ola(w, R)
    gain = {m: Fr(4, R) * c for m, c in s2.items()}                       # 0-st gain
    dc = {m: Fr(4, R) * (s2.get(m, 0) + s1.get(m, 0) / 2) for m in set(s2) | set(s1)}  # DC gain
    if R <= 8 or R in (16, 32, 64):
        print(f"R={R:2d}  sum w^2 = {fmt(s2):22s} gain = {fmt(gain):26s} DC gain = {fmt(dc)}")
    if R >= 3:
        ok &= gain == {0: Fr(3, 2)} and dc == {0: Fr(5, 2)} and s2 == {0: Fr(3 * R, 8)}
print("R >= 3 (R = 3..64): gain == 3/2 exactly and DC gain == 5/2:", "VERIFIED" if ok else "FALSE")
print("R = 2: gain = 3/2 + cos(2θ)/2, i.e. it swings between 1 and 2 (0 to +6 dB) with period = hop")
print("Unity: multiply line 467 by 2/3, i.e. y = w*ifft * 8/(3R)  (= 2/3 for osamp 4)")
