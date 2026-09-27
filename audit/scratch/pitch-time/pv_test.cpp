// Standalone test of PhaseVocoder with Audapter-style OLA (mirrors Audapter.cpp ~1987-2082, 2108-2126)
#include <cstdio>
#include <cmath>
#include <vector>
#include "phase_vocoder.h"
int main(int argc,char**argv){
  const int sr=16000, frameLen=32, L=1024, hop=256;
  double freqs[]={200.0, 1000.0};
  double shifts[]={0.0, 1.0, -1.0, 2.0, -2.0, 12.0, -12.0};
  for(double f0: freqs) for(double st: shifts){
    PhaseVocoder pv; pv.config(PhaseVocoder::PITCH_SHIFT_ONLY,7,sr,frameLen,L,hop);
    int N=sr*2; std::vector<double> x(N), y(N+2*L,0.0);
    for(int n=0;n<N;n++) x[n]=0.1*sin(2*M_PI*f0*n/sr);
    // OLA: every hop samples, analyze x[c-L,c), accumulate at y[c..c+L)
    for(int c=L;c+L<=N;c+=hop){ pv.procFrame(&x[c-L], st); for(int i=0;i<L;i++) y[c+i]+=pv.ftBuf2[2*i]; }
    // steady-state RMS in [0.5s,1.5s]
    double si=0,so=0; int a=sr/2,b=3*sr/2; for(int n=a;n<b;n++){si+=x[n]*x[n];so+=y[n]*y[n];}
    // estimate output freq via zero crossings
    int zc=0; for(int n=a+1;n<b;n++) if(y[n-1]<0&&y[n]>=0) zc++;
    // correlation with input delayed by L (shift 0 only)
    double cxy=0,cyy=0,cxx=0; for(int n=a;n<b;n++){cxy+=y[n]*x[n-L];cyy+=y[n]*y[n];cxx+=x[n-L]*x[n-L];}
    printf("f0=%6.0f shift=%+5.1f st  gain=%.3f (%.2f dB)  outF=%.1f Hz (exp %.1f)  corr(y,x[n-L])=%.3f\n",
      f0,st,sqrt(so/si),10*log10(so/si), zc/1.0, f0*pow(2,st/12), cxy/sqrt(cxx*cyy));
  }
}
