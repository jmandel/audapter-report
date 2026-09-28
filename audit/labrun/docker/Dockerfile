# labrun image: the audit's Octave MEX image plus
#  - a headless graphics toolkit (gnuplot; figures are never rendered) and Xvfb, so the lab's figure/text/uicontrol
#    code creates real, invisible graphics objects with a real screen size;
#  - Praat (wave_viewer's pitch tracker calls it; the lab's C:\Users\Public\Desktop\Praat.exe points to it);
#  - winpath.so, an LD_PRELOAD file-path translator for the lab's Windows paths (see winpath.c).
FROM audapter-octave
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends gnuplot-nox fonts-freefont-otf xvfb xauth praat \
 && rm -rf /var/lib/apt/lists/*
COPY winpath.c /usr/local/src/winpath.c
RUN gcc -O2 -Wall -shared -fPIC -o /usr/local/lib/labrun-winpath.so /usr/local/src/winpath.c -ldl
