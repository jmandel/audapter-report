"""Save a WAV + PNG excerpt around the largest output burst of a live run.
usage: burst_excerpt.py <live_prefix> <out_base>"""
import sys, numpy as np, scipy.io.wavfile as wf
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from common import load
x = load(sys.argv[1], 'hw')[:, 0]; ob = sys.argv[2]
i = int(np.argmax(np.abs(np.nan_to_num(x)))); a, b = max(0, i - 24000), min(len(x), i + 24000)
seg = x[a:b]
wf.write(ob + '.wav', 48000, np.clip(seg, -1, 1).astype(np.float32))   # what a DAC would play (clipped at full scale)
t = (np.arange(a, b) - i) / 48.0
fig, ax = plt.subplots(figsize=(8, 3.2))
ax.plot(t, np.clip(seg, -1, 1), color='#2a78d6', lw=1)
for s in (1, -1): ax.axhline(s, color='#8a8a85', lw=0.8, ls='--')
ax.text(t[0], 1.03, 'digital full scale', color='#5f5e5a', fontsize=8, va='bottom')
ax.set_xlabel('time relative to burst peak (ms)'); ax.set_ylabel('headphone signal (clipped at full scale)')
ax.set_title(f'Audapter output when reset() races the audio callback (true peak {np.abs(seg).max():.0f}x full scale)', fontsize=9, loc='left')
for s in ('top', 'right'): ax.spines[s].set_visible(False)
ax.set_xlim(-60, 60); fig.savefig(ob + '.png', dpi=110, bbox_inches='tight')
print(f"burst at {i/48000:.3f} s, true peak {np.abs(seg).max():.1f}, wrote {ob}.wav/.png")
