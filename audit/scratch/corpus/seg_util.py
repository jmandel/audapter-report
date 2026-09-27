import numpy as np, parselmouth
def voiced_segments(x, fs, fmin=60, fmax=900, mindur=1.0, gap=0.08):
    snd=parselmouth.Sound(x, fs)
    p=snd.to_pitch_ac(time_step=0.01, pitch_floor=fmin, pitch_ceiling=fmax)
    f=p.selected_array['frequency']; t=p.xs()
    v=f>0; segs=[]; i=0; n=len(v)
    while i<n:
        if v[i]:
            j=i
            while j<n and (v[j] or (j+int(gap/0.01)<n and v[j:j+int(gap/0.01)].any())): j+=1
            if t[min(j,n-1)]-t[i]>=mindur: segs.append((t[i],t[min(j,n-1)]))
            i=j
        else: i+=1
    return segs, (t,f)
def praat_formants(x, fs, t0, t1, maxf=5500, n=5):
    snd=parselmouth.Sound(x, fs).extract_part(t0,t1)
    fm=snd.to_formant_burg(time_step=0.01, max_number_of_formants=n, maximum_formant=maxf)
    ts=fm.xs(); F=np.array([[fm.get_value_at_time(k,tt) for k in (1,2,3)] for tt in ts])
    return ts+t0, F
