// Control surface of the fake ASIO driver (a software-clocked virtual sound card that the real
// RtAudio ASIO backend talks to through the Steinberg ASIO C API).
#pragma once
#include <atomic>
#include <string>
#include <vector>
#include <functional>
#include <mutex>

namespace fakeasio {

struct Config {
  std::vector<std::string> drivers{"Fake ASIO Device"};  // names returned by the driver registry
  long minSize = 32, maxSize = 2048, prefSize = 96, granularity = 1;  // ASIOGetBufferSize
  long inChannels = 2, outChannels = 2;
  long sampleType = 18;              // ASIOSTInt32LSB (18); 19 = Float32LSB, 16 = Int16LSB, 17 = Int24LSB
  std::vector<double> rates{44100, 48000, 96000};
  bool realtime = true;              // true: periods are clocked by CLOCK_MONOTONIC; false: run as fast as possible
  bool stopJoins = true;             // ASIOStop waits for the driver thread (synchronous stop, like most drivers)
  int xrunPolicy = 0;                // what the "hardware" plays in a missed period: 0 repeat last buffer, 1 silence
  bool loopInput = false;            // loop mic signal; otherwise zeros after its end
};

// Everything below is shared between the device thread and the controlling (driver) thread.
struct State {
  Config cfg;
  std::vector<double> mic;           // mono input at device rate (hardware time 0 = ASIOStart)
  std::vector<double> outL, outR;    // what the "hardware" played, indexed by hardware sample time
  std::vector<double> cbStartNs, cbDurNs;  // per callback: start (ns since ASIOStart) and duration
  std::vector<long> cbPeriod;        // hardware period index served by each callback
  std::vector<long> xrunPeriods;     // hardware periods for which no fresh output was ready
  std::atomic<long> period{0};       // hardware periods elapsed since ASIOStart
  std::atomic<long> callbacks{0};
  long bufferSize = 0;               // negotiated by ASIOCreateBuffers
  double rate = 0;
  std::function<void(long)> prePeriodHook;   // runs on the device thread before each bufferSwitch
  std::mutex m;                      // protects the recorded vectors when the driver reads them
};

State &state();
void resetRecording();               // clear out/cb/xrun records (call while stopped)

}  // namespace fakeasio
