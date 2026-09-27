#define private public
#include "time_domain_shifter.h"
#undef private
#include <cstdio>
#include <cmath>
#include <vector>
using namespace audapter;
static double F0of(int mode,int n,int sr){ if(mode==0) return n<sr/4?100:(n<sr/2?100+(n-sr/4)*(200.0/(sr/4)):300); if(mode==1) return 300; if(mode==2) return n<sr/4?300:(n<sr/2?300-(n-sr/4)*(200.0/(sr/4)):100); return 150+30*sin(2*M_PI*5*n/(double)sr);}
int main(){
  const int sr=16000, fl=32;
  for(int mode=0;mode<4;mode++) for(int alg=1;alg<=2;alg++){
  TimeDomainShifter::PitchShiftSchedule s; s.push_back({0.0,1.0}); TimeDomainShifter t((TimeDomainShifterAlgorithm)alg,sr,fl,s);
  int N=sr; std::vector<double> x(fl),f(fl),y(fl); double ph=0; int future=0, nonpos=0, frames=0, maxAhead=0;
  for(int c=0;c+fl<=N;c+=fl){
    for(int i=0;i<fl;i++){ int n=c+i; double F0=F0of(mode,n,sr); ph+=2*M_PI*F0/sr; double v=0; for(int k=1;k*F0<4000;k++) v+=sin(k*ph+0.3*k)/k; x[i]=0.1*v; f[i]=sin(ph);} 
    t.processFrame(f.data(),x.data(),y.data(),fl); frames++;
    int newest = t.totalLen-1;
    if(t.lastPeakAdjustedPitchCycleEnd-1 > newest){future++; maxAhead=std::max(maxAhead,t.lastPeakAdjustedPitchCycleEnd-1-newest);}
    if(t.lastPeakAdjustedPitchCycleEnd!=-1 && t.lastPeakAdjustedPitchCycleEnd<=t.lastPeakAdjustedPitchCycleBegin) nonpos++;
  }
  printf("mode=%d alg=%d: future-read frames %d/%d (max %d samples ahead); n0<=0 frames: %d\n",mode,alg,future,frames,maxAhead,nonpos);
  }
}
