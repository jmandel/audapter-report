"""I-11 live: what the participant hears when the device buffer != frameLen*downFact.
usage: heard_mismatch.py <live_prefix> <mic.wav>"""
import sys, numpy as np, wave, struct
from common import load, kv
lp, micfn = sys.argv[1], sys.argv[2]
hw = load(lp, 'hw'); B = int(kv(lp + '_hw.txt')['bufsize'])
import scipy.io.wavfile as wf
fs, mic = wf.read(micfn); mic = mic.astype(float)
if mic.ndim > 1: mic = mic[:, 0]
# model: hardware period k plays userBuffer from callback k-1, whose first B doubles hold the mic samples of
# period k-2 (input is copied into the user buffer after the callback), read as interleaved stereo
pred = np.zeros_like(hw)
for k in range(2, len(hw) // B):
    src = mic[(k - 2) * B:(k - 1) * B] if (k - 1) * B <= len(mic) else np.zeros(B)
    if len(src) < B: src = np.pad(src, (0, B - len(src)))
    ub = np.concatenate([src, np.zeros(B)])
    pred[k * B:(k + 1) * B, 0] = ub[0::2][:B]; pred[k * B:(k + 1) * B, 1] = ub[1::2][:B]
err = np.max(np.abs(hw - pred))
print(f"device buffer {B}, Audapter frame 96: heard output matches the 'raw input read as interleaved stereo' model to max|err| {err:.3g}")
seg = hw[:, 0]; nz = np.mean(np.abs(seg.reshape(-1, B)[:, B // 2:]) ).item()
print(f"  second half of every buffer: mean|x| = {nz:.3g} (silence);  first half = decimated-by-2 mic (x2 speed, +1 octave)")
v = (np.abs(mic) > 0.01)
print(f"  heard level vs mic during voicing: rms heard {np.sqrt(np.mean(hw[:len(mic),0][v]**2)):.3g}, rms mic {np.sqrt(np.mean(mic[v]**2)):.3g} (no Audapter gain/dScale applied)")
