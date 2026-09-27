# Live-path simulation image: the audit's Octave image plus a JACK2 server (dummy backend)
# and JACK headers, so the real RtAudio JACK backend can be compiled and run in a container.
FROM audapter-octave
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    jackd2 libjack-jackd2-dev pkg-config procps python3-matplotlib util-linux \
 && rm -rf /var/lib/apt/lists/*
