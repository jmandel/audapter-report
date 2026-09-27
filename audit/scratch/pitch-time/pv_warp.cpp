#include <cstdio>
#include <cmath>
#include <vector>
#include "phase_vocoder.h"
int main(){
  const int sr=16000, L=256, hop=64;
  PhaseVocoder pv; pv.config(PhaseVocoder::TIME_WARP_ONLY,5,sr,32,L,hop);
  int N=sr*2; std::vector<double> x(N), y(N+2*L,0.0);
  srand(1); for(int n=0;n<N;n++){ double tt=(double)n/sr; x[n]=0.05*(sin(2*M_PI*200*tt)+0.5*sin(2*M_PI*530*tt+1)+0.3*sin(2*M_PI*1270*tt+2))*(1+0.5*sin(2*M_PI*4*tt)); }
  for(int c=L;c+L<=N;c+=hop){ pv.procFrame(&x[c-L], 0.0); for(int i=0;i<L;i++) y[c+i]+=pv.ftBuf2[2*i]; }
  int a=sr/2,b=3*sr/2; double si=0,so=0; for(int n=a;n<b;n++){si+=x[n]*x[n];so+=y[n]*y[n];}
  int best=0; double bc=-1e9; for(int l=0;l<2*L;l++){double c=0,e1=0,e2=0; for(int n=a;n<b;n++){c+=y[n]*x[n-l];e1+=y[n]*y[n];e2+=x[n-l]*x[n-l];} c/=sqrt(e1*e2); if(c>bc){bc=c;best=l;}}
  printf("TIME_WARP_ONLY, warp=0: gain %.3f (%.2f dB); best lag %d (L=%d) corr %.3f\n",sqrt(so/si),10*log10(so/si),best,L,bc);
}
