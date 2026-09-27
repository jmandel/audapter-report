#!/bin/bash
# Reproduce every live-path result. Usage: ./run.sh [step ...]   (default: all steps)
# Steps: build inputs equiv noasio mismatch startfail ramp tsan crash uaf burst resetcheck timing startstop
# Outputs: results/<step>.txt (+ png/wav); raw run data in work/ (large, disposable).
cd "$(dirname "$0")"
STEPS=${@:-build inputs equiv noasio mismatch startfail ramp tsan crash uaf burst resetcheck timing startstop}
mkdir -p results work/out work/tsan work/asan
D=build/asio/live_driver; IN=work/in
F1="trace=$IN/trace_f1up.txt ost=$IN/onset.ost pcf=$IN/f1up_s2.pcf"
say() { echo; echo "######## $*"; }

for S in $STEPS; do case $S in
build) say build; ./build.sh ;;
inputs) say inputs; ./mkinputs.sh ;;

equiv)  # LIVE-9: live == offline (after alignment + input quantisation), fake ASIO (Int32) and JACK
  say "equiv -> results/equiv.txt"
  ./dock.sh "
  for c in base f1up pvoc2st td1st; do
    X=''; [ \$c = f1up ] && X='ost=$IN/onset.ost pcf=$IN/f1up_s2.pcf'; [ \$c = pvoc2st ] && X='ost=$IN/onset.ost pcf=$IN/pitch_s2.pcf'
    N=96; [ \$c = td1st ] && N=192
    echo \"=== \$c (fake ASIO, Int32LSB, buffer \$N)\"
    $D live trace=$IN/trace_\$c.txt in=$IN/vowel_a.wav \$X out=work/out/eq_live_\$c >/dev/null
    $D offline trace=$IN/trace_\$c.txt in=$IN/vowel_a.wav \$X out=work/out/eq_off_\$c lead=\$N quant=int32 >/dev/null
    (cd analysis && python3 compare_live_offline.py ../work/out/eq_live_\$c ../work/out/eq_off_\$c)
  done
  echo '=== base (JACK dummy driver, period 96, float32 ports)'
  ./jackrun.sh 96 build/jack/live_driver live trace=$IN/trace_base.txt in=$IN/vowel_a.wav out=/live/work/out/eq_jack >/dev/null 2>&1
  rm -f work/out/eq_off_jack_k*; analysis/find_lead.sh $D /live/work/out/eq_jack /live/work/out/eq_off_jack float32 $IN/trace_base.txt $IN/vowel_a.wav | tail -1
  K=\$(ls work/out/eq_off_jack_k*_sig.npy | tail -1 | grep -o 'k[0-9]*')
  (cd analysis && python3 compare_live_offline.py ../work/out/eq_jack ../work/out/eq_off_jack_\$K)
  " 2>&1 | tee results/equiv.txt ;;

noasio)  # LIVE-5
  say "noasio -> results/noasio.txt"
  FAKEASIO_DRIVERS="" ASAN_OPTIONS=detect_leaks=0 ./dock.sh "build/asio-asan/live_driver offline trace=$IN/trace_base.txt in=$IN/vowel_a.wav out=work/out/noasio" 2>&1 \
    | grep -E "RtAudio:|ERROR|#[0-3] " | tee results/noasio.txt ;;

mismatch)  # LIVE-6 (= I-11 live)
  say "mismatch -> results/mismatch.txt"
  { FAKEASIO_BUF="64,2048,128,-1" ./dock.sh "$D live trace=$IN/trace_base.txt in=$IN/vowel_a.wav out=work/out/mis128 && cd analysis && python3 heard_mismatch.py ../work/out/mis128 ../work/in/vowel_a.wav 2>/dev/null"
    echo "--- JACK server period 128:"; ./dock.sh "./jackrun.sh 128 build/jack/live_driver live trace=$IN/trace_base.txt in=$IN/vowel_a.wav out=/live/work/out/jack_mis128 2>&1 | grep -v 'lock down'"; } 2>&1 | tee results/mismatch.txt ;;

startfail)  # LIVE-4
  say "startfail -> results/startfail.txt"
  { echo "--- ASIO driver without 48 kHz:"; FAKEASIO_RATES=44100 ./dock.sh "$D live trace=$IN/trace_base.txt in=$IN/vowel_a.wav out=work/out/rate44 verbose=1 2>&1 | grep -v '^\s*$' | tail -6"
    echo "--- ASIO driver with Int24 samples:"; FAKEASIO_FMT=int24 ./dock.sh "$D live trace=$IN/trace_base.txt in=$IN/vowel_a.wav out=work/out/fmt24 2>&1 | tail -2"
    echo "--- JACK server at 44.1 kHz:"; ./dock.sh "export HOME=/tmp JACK_NO_AUDIO_RESERVATION=1; jackd -r -d dummy -r 44100 -p 96 >/dev/null 2>&1 & sleep 1.5; build/jack/live_driver live trace=$IN/trace_base.txt in=$IN/vowel_a.wav out=/live/work/out/jack_rate verbose=1 2>&1 | grep -v 'lock down\|^\s*$' | tail -4"; } 2>&1 | tee results/startfail.txt ;;

ramp)  # LIVE-8
  say "ramp -> results/ramp.txt"
  ./dock.sh "$D live trace=$IN/trace_ramp.txt in=$IN/vowel_cont.wav out=work/out/live_ramp >/dev/null && $D offline trace=$IN/trace_ramp.txt in=$IN/vowel_cont.wav out=work/out/off_ramp lead=96 quant=int32 >/dev/null && $D offline trace=$IN/trace_noramp.txt in=$IN/vowel_cont.wav out=work/out/off_noramp lead=96 quant=int32 >/dev/null && cd analysis && python3 ramp.py ../work/out/live_ramp ../work/out/off_ramp ../results/live_ramp_gain.png" 2>&1 | tee results/ramp.txt ;;

tsan)  # LIVE-1/2/3 race inventory
  say "tsan -> results/tsan.txt"
  rm -f work/tsan/*
  TO="suppress_equal_addresses=0 history_size=4"
  TSAN_OPTIONS="log_path=/live/work/tsan/alwayson $TO" ./dock.sh "build/asio-tsan/live_driver alwayson $F1 in=$IN/vowel_a.wav trials=6 triallen=0.6" >/dev/null 2>&1
  for op in reset init pcf ost pertamp getdata; do
    TSAN_OPTIONS="log_path=/live/work/tsan/hammer_$op $TO" ./dock.sh "build/asio-tsan/live_driver hammer $F1 in=$IN/vowel_a.wav op=$op secs=3 gap=0.002" >/dev/null 2>&1; done
  TSAN_OPTIONS="log_path=/live/work/tsan/hammer_tdratio $TO" ./dock.sh "build/asio-tsan/live_driver hammer trace=$IN/trace_td1st.txt in=$IN/vowel_a.wav op=tdratio secs=3 gap=0.002" >/dev/null 2>&1
  TSAN_OPTIONS="log_path=/live/work/tsan/startstop $TO" ./dock.sh "build/asio-tsan/live_driver startstop trace=$IN/trace_base.txt in=$IN/vowel_a.wav n=300 run=0.003" >/dev/null 2>&1
  { for f in work/tsan/*; do echo "=== $f"; ./dock.sh "python3 analysis/tsan_summary.py $f" | sed '/^[0-9]* reports/q'; grep -h "SUMMARY: ThreadSanitizer: SEGV\|heap-use-after-free" $f | sort -u; done
    echo "=== all logs combined"; ./dock.sh "python3 analysis/tsan_summary.py work/tsan/*"; } 2>&1 | tee results/tsan.txt ;;

crash)  # LIVE-1 crash rate (plain -O2 build); slow: ~8 min
  say "crash -> results/crash.txt"
  { for op in pcf ost; do echo "--- $op reload while running, 20 ms apart"; ./dock.sh "analysis/crash_rate.sh $op 4 60 0.02"
      echo "--- $op reload while running, 250 ms apart"; ./dock.sh "analysis/crash_rate.sh $op 3 150 0.25"; done
    ASAN_OPTIONS=detect_leaks=0 ./dock.sh "build/asio-asan/live_driver hammer $F1 in=$IN/vowel_a.wav op=pcf secs=60" 2>&1 | grep -E "ERROR: Addr|#[0-2] |LIVE-DRIVER" | head -5; } 2>&1 | tee results/crash.txt ;;

uaf)  # LIVE-2
  say "uaf -> results/uaf.txt"
  { for t in tdratio:trace_td1st toggle:fn1:675:676:trace_f1up toggle:pvocframelen:256:512:trace_pvoc2st; do op=${t%:*}; tr=${t##*:}
      echo "--- setParam $op while running (ASan)"
      ASAN_OPTIONS=detect_leaks=0 ./dock.sh "build/asio-asan/live_driver hammer trace=$IN/$tr.txt in=$IN/vowel_a.wav op=$op secs=30 gap=0.005" 2>&1 | grep -E "ERROR: Addr|SUMMARY: Addr|LIVE-DRIVER" | grep -v 2124 | head -3
      echo "--- same, plain -O2 build"; ./dock.sh "$D hammer trace=$IN/$tr.txt in=$IN/vowel_a.wav op=$op secs=20 gap=0.01" 2>&1 | grep -E "LIVE-DRIVER|hammer op|Segmentation" | head -2; done; } 2>&1 | tee results/uaf.txt ;;

burst)  # LIVE-3: audible consequence of reset() racing the callback
  say "burst -> results/burst.txt"
  FAKEASIO_FMT=float64 ./dock.sh "
    $D hammer $F1 in=$IN/vowel_a.wav op=idle secs=10 out=work/out/burst_refp >/dev/null
    $D hammer $F1 in=$IN/vowel_a.wav op=reset secs=120 gap=0.05 out=work/out/burst_resetp | tee /tmp/h.txt
    cd analysis; python3 bursts.py ../work/out/burst_resetp ../work/out/burst_refp \$(grep -o '[0-9]* iterations' /tmp/h.txt | cut -d' ' -f1)
    python3 burst_excerpt.py ../work/out/burst_resetp ../results/reset_race_burst
    cd ..; $D offline $F1 in=$IN/vowel_a_x5.wav out=work/out/off_reset25 resetevery=25 >/dev/null
    python3 -c \"import numpy as np; x=np.load('work/out/off_reset25_runframe_out.npy').ravel(); print('control, race-free reset every 25 frames (offline): max|out| %.3f' % abs(x).max())\"
  " 2>&1 | tee results/burst.txt ;;

resetcheck)  # LIVE-3: logged frame clock after an always-on reset
  say "resetcheck -> results/resetcheck.txt"
  ./dock.sh "$D resetcheck $F1 in=$IN/vowel_a.wav n=1000" 2>&1 | tee results/resetcheck.txt ;;

timing)  # LIVE-7 + cost table
  say "timing -> results/timing.txt"
  { ./dock.sh "for c in base f1up pvoc2st td1st; do X=''; [ \$c = f1up ] && X='ost=$IN/onset.ost pcf=$IN/f1up_s2.pcf'; $D live trace=$IN/trace_\$c.txt in=$IN/vowel_a_x5.wav \$X out=work/out/cost_\$c >/dev/null; done
      for o in reset getdata init; do $D hammer $F1 in=$IN/vowel_a.wav op=\$o secs=10 gap=0.05 out=work/out/ham_\$o; done
      cd analysis; python3 cb_stats.py ../work/out/cost_base ../work/out/cost_f1up ../work/out/cost_pvoc2st ../work/out/cost_td1st ../work/out/ham_reset ../work/out/ham_getdata ../work/out/ham_init"
    echo "--- 1 CPU shared with 3 busy processes, driver thread at normal priority:"
    DOCK_EXTRA="--cpuset-cpus=3" ./dock.sh "analysis/with_hogs.sh 3 $D live $F1 in=$IN/vowel_a_x5.wav out=work/out/xrun_hog3 >/dev/null; cd analysis; python3 xrun.py ../work/out/xrun_hog3"
    echo "--- same, driver thread SCHED_FIFO 80 (like an ASIO driver thread):"
    FAKEASIO_RTPRIO=80 DOCK_EXTRA="--cpuset-cpus=3 --cap-add SYS_NICE --ulimit rtprio=99" ./dock.sh "analysis/with_hogs.sh 3 $D live $F1 in=$IN/vowel_a_x5.wav out=work/out/xrun_hog3_rt >/dev/null; cd analysis; python3 xrun.py ../work/out/xrun_hog3_rt"
    echo "--- JACK dummy server under the same load (server clock stretches instead of dropping audio):"
    DOCK_EXTRA="--cpuset-cpus=3" ./dock.sh "analysis/with_hogs.sh 3 ./jackrun.sh 96 build/jack/live_driver live $F1 in=$IN/vowel_a_x5.wav out=work/out/jack_hog3 2>&1 | grep -v 'lock down\|overrun/underrun\|^\s*$'; grep xruns work/out/jack_hog3_hw.txt"; } 2>&1 | tee results/timing.txt ;;

startstop)  # LIVE-10
  say "startstop -> results/startstop.txt"
  timeout 600 ./dock.sh "$D startstop trace=$IN/trace_base.txt in=$IN/vowel_a.wav n=3000 run=0.003" 2>&1 | tee results/startstop.txt ;;
*) echo "unknown step $S"; exit 1 ;;
esac; done
