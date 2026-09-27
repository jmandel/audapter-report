// Stub audio device for headless testing: no real device is present.
#pragma once
#include <string>
#include <vector>
typedef struct { int num, chans, fs, set; } DeviceParams;
struct AudioDeviceInfo { std::string name; int outputChannels = 0, inputChannels = 0; };
class audioIO {
public:
  std::vector<AudioDeviceInfo> devices;
  bool params_set = false, started = false;
  int setcallbackparams(int, void*, void*) { return 0; }
  int setdevparams(DeviceParams*, int) { return 0; }
  int startdev() { return 0; }
  int stopdev(int = 0) { return 0; }
  void listdevices(void*) {}
};
