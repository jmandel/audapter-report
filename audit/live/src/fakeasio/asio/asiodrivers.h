// Replacement for Steinberg's AsioDrivers (which enumerates COM drivers from the registry).
// Backed by the fake ASIO driver registry in fakeasio.cpp (configured with FAKEASIO_* env vars).
#ifndef __AsioDrivers__
#define __AsioDrivers__
class AsioDrivers {
public:
  AsioDrivers();
  ~AsioDrivers();
  bool getCurrentDriverName(char *name);
  long getDriverNames(char **names, long maxDrivers);
  bool loadDriver(char *name);
  void removeCurrentDriver();
  long getCurrentDriverIndex() { return curIndex; }
  long asioGetNumDev(void);
  long asioGetDriverName(int, char *, int);
protected:
  unsigned long connID;
  long curIndex;
};
#endif
