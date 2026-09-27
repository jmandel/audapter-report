# Model-checking image for the Audapter formal audit: CBMC (bounded model checker for C)
FROM ubuntu:24.04
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends cbmc gcc libc6-dev python3 python3-sympy && rm -rf /var/lib/apt/lists/*
