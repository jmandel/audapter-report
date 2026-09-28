# labrun image: the audit's Octave MEX image plus a headless graphics toolkit (gnuplot) so the lab's
# figure/text/uicontrol code creates real (invisible) graphics objects.
FROM audapter-octave
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends gnuplot-nox fonts-freefont-otf \
 && rm -rf /var/lib/apt/lists/*
