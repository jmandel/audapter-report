#include <cstdio>
#include <cmath>
#include <vector>
#include "phase_vocoder.h"
int main(){
  const int sr=16000, L=1024, hop=256;
  for(double f0: {110.0, 220.0}) for(double st: {0.0,0.5,-0.5,1.0,-1.0,2.0,-2.0,3.0,-3.0}){
    PhaseVocoder pv; pv.config(PhaseVocoder::PITCH_SHIFT_ONLY,7,sr,32,L,hop);
    int N=sr*3; std::vector<double> x(N), y(N+2*L,0.0);
    // harmonic complex 1/k amplitude, random-ish phases, up to 4 kHz
    for(int n=0;n<N;n++){double s=0; for(int k=1;k*f0<4000;k++) s+=sin(2*M_PI*k*f0*n/sr+0.7*k*k)/k; x[n]=0.05*s;}
    for(int c=L;c+L<=N;c+=hop){ pv.procFrame(&x[c-L], st); for(int i=0;i<L;i++) y[c+i]+=pv.ftBuf2[2*i]; }
    double si=0,so=0; int a=sr/2,b=5*sr/2; for(int n=a;n<b;n++){si+=x[n]*x[n];so+=y[n]*y[n];}
    // RMS fluctuation over 20ms blocks
    double mn=1e9,mx=0; for(int s=a;s+320<=b;s+=320){double e=0;for(int n=s;n<s+320;n++)e+=y[n]*y[n]; e=sqrt(e/320); mn=std::min(mn,e); mx=std::max(mx,e);}
    printf("f0=%4.0f shift=%+4.1f st  gain=%+.2f dB  20ms-RMS range %.2f dB\n",f0,st,10*log10(so/si),20*log10(mx/mn));
  }
}
