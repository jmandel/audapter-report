FROM debian:trixie
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    octave octave-dev g++ make python3 python3-numpy python3-scipy octave-signal ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /work
