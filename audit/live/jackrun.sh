#!/bin/bash
# Inside the container: start jackd with the dummy (software-clocked) backend, run a command, stop jackd.
# Usage: jackrun.sh <period> <command...>     (JACK_RT=1 to run the server with real-time scheduling)
P=$1; shift
export JACK_NO_AUDIO_RESERVATION=1 HOME=/tmp
RT=-r; [ "$JACK_RT" = 1 ] && RT=-R
jackd $RT -d dummy -r 48000 -p $P -C 2 -P 2 > /tmp/jackd.log 2>&1 &
JP=$!
for i in $(seq 50); do jack_wait -c >/dev/null 2>&1 && break; sleep 0.1; done 2>/dev/null
sleep 0.5
"$@"; RC=$?
kill $JP; wait $JP 2>/dev/null
echo "[jackd] $(grep -c XRun /tmp/jackd.log) server-side XRun messages (timer lateness of the dummy driver)"
exit $RC
