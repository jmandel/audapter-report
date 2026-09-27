#!/bin/bash
# Build the live-path simulation binaries (inside the audapter-live docker image).
#   build/asio/live_driver       real audioIO + RtAudio ASIO backend + fake ASIO driver, -O2
#   build/asio-tsan/live_driver  same, ThreadSanitizer
#   build/asio-asan/live_driver  same, AddressSanitizer + UBSan
#   build/jack/live_driver       real audioIO + RtAudio JACK backend (needs a running jackd), -O2
# Sources are copied, never modified. Only portability shims are added (src/compat, src/fakemex,
# src/fakeasio/asio/{asiosys.h,asiodrivers.h}).
# Usage: ./build.sh [variant ...]    (default: all)
set -e
cd "$(dirname "$0")"
LIVE=$PWD; AUD=$(cd ../..; pwd)            # repo root
VARIANTS=${@:-asio asio-tsan asio-asan jack}
docker image inspect audapter-live >/dev/null 2>&1 || docker build -t audapter-live docker

# 1. Audapter core: same copy + portability patches as the offline harness (harness/prep-src.sh)
../harness/prep-src.sh blab/audapter_mex "$LIVE/build/src" >/dev/null
# 2. real audio I/O layer, unmodified
rm -rf build/src-io; mkdir -p build/src-io/asio
cp $AUD/blab/audapter_mex/audioIO/audioIO.cpp $AUD/blab/audapter_mex/audioIO/audioIO.h build/src-io/
cp $AUD/blab/audapter_mex/rtaudio/RtAudio.cpp $AUD/blab/audapter_mex/rtaudio/RtAudio.h $AUD/blab/audapter_mex/rtaudio/RtError.h build/src-io/
cp $AUD/blab/audapter_mex/rtaudio/asio/asio.h build/src-io/asio/            # real Steinberg header
cp src/fakeasio/asio/asiosys.h src/fakeasio/asio/asiodrivers.h build/src-io/asio/   # replacements

for V in $VARIANTS; do
  case $V in
    asio)      FL="-O2 -g"; API=-D__WINDOWS_ASIO__; EXTRA=src/fakeasio/fakeasio.cpp; LIBS="" ;;
    asio-tsan) FL="-O1 -g -fsanitize=thread"; API=-D__WINDOWS_ASIO__; EXTRA=src/fakeasio/fakeasio.cpp; LIBS="" ;;
    asio-asan) FL="-O1 -g -fno-omit-frame-pointer -fsanitize=address,undefined -fno-sanitize=vptr"; API=-D__WINDOWS_ASIO__; EXTRA=src/fakeasio/fakeasio.cpp; LIBS="" ;;
    jack)      FL="-O2 -g"; API="-D__LINUX_JACK__ -DLIVE_JACK"; EXTRA=""; LIBS="-ljack" ;;
    *) echo "unknown variant $V"; exit 1 ;;
  esac
  mkdir -p build/$V
  echo "== building $V"
  docker run --rm -u $(id -u):$(id -g) -v $LIVE:/live -w /live audapter-live bash -c "
    set -e
    INC='-Ibuild/src-io -Isrc/compat -Isrc/fakemex -Isrc/fakeasio -Ibuild/src'
    PRE='-include cmath -include cstring -include cstdlib -include cstdio -include limits -include stdexcept'
    g++ -std=gnu++14 -fpermissive -w -pthread $FL $API \$INC \$PRE \
      build/src/Audapter.cpp build/src/mexLibrary.cpp build/src/ost.cpp build/src/pcf.cpp build/src/utils.cpp \
      build/src/lpc_formant.cpp build/src/DSPF.cpp build/src/phase_vocoder.cpp build/src/time_domain_shifter.cpp \
      build/src/version.cpp build/src-io/audioIO.cpp build/src-io/RtAudio.cpp \
      src/fakemex/fakemex.cpp src/driver/live_driver.cpp $EXTRA \
      -o build/$V/live_driver $LIBS 2>&1 | grep -E 'error|undefined reference' | head -30
    ls -la build/$V/live_driver"
done
