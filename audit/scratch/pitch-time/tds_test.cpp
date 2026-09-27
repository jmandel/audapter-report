#include <cstdio>
#include <cmath>
#include <vector>
#include <algorithm>
#include "time_domain_shifter.h"
using namespace audapter;
static double estF0(const std::vector<double>& y,int a,int b,int sr){ // autocorr peak 60..600 Hz
  int lo=sr/600,hi=sr/50; std::vector<double> C(hi+2,0); double mx=-1;
  for(int l=lo;l<=hi+1;l++){double c=0,e1=0,e2=0; for(int n=a;n<b-hi-1;n++){c+=y[n]*y[n+l];e1+=y[n]*y[n];e2+=y[n+l]*y[n+l];} C[l]=c/sqrt(e1*e2+1e-30); if(l<=hi) mx=std::max(mx,C[l]);}
  for(int l=lo+1;l<=hi;l++) if(C[l]>=0.9*mx && C[l]>=C[l-1] && C[l]>=C[l+1]){ double d=0.5*(C[l-1]-C[l+1])/(C[l-1]-2*C[l]+C[l+1]); return sr/(l+d);} return 0;
}
static void run(TimeDomainShifterAlgorithm alg,double F0,double ratio,int silenceMs,bool print=true){
  const int sr=16000, fl=32; int N=sr*1+silenceMs*sr/1000;
  TimeDomainShifter::PitchShiftSchedule s; s.push_back({0.0,ratio});
  TimeDomainShifter t(alg,sr,fl,s);
  std::vector<double> x(N,0.0),f(N,0.0),y(N,0.0);
  int n0=silenceMs*sr/1000;
  for(int n=n0;n<N;n++){double tt=(double)(n-n0)/sr; double v=0; for(int k=1;k*F0<4000;k++) v+=sin(2*M_PI*k*F0*tt+0.3*k)/k; x[n]=0.1*v; f[n]=sin(2*M_PI*F0*tt+0.3);}
  for(int c=0;c+fl<=N;c+=fl) t.processFrame(&f[c],&x[c],&y[c],fl);
  int a=n0+sr/4,b=N-sr/10;
  double si=0,so=0; for(int n=a;n<b;n++){si+=x[n]*x[n];so+=y[n]*y[n];}
  double pk=0; int pkn=0; for(int n=0;n<N;n++) if(fabs(y[n])>pk){pk=fabs(y[n]);pkn=n;}
  double xpk=0; for(int n=0;n<N;n++) xpk=std::max(xpk,fabs(x[n]));
  if(print) printf("alg=%d F0=%5.0f ratio=%.3f sil=%4dms  outF0=%6.1f (exp %6.1f, err %+6.1f cents)  gain=%+.2f dB  peak out/in=%.2f at t=%.3fs  logged=%.1f\n",
    alg,F0,ratio,silenceMs,estF0(y,a,b,sr),F0*ratio,1200*log2(estF0(y,a,b,sr)/(F0*ratio)),10*log10(so/si),pk/xpk,(double)pkn/sr,t.getLatestShiftedPitchHz());
}
int main(){
  for(int alg=0;alg<3;alg++) for(double F0: {97.0,151.0,223.0,317.0,410.0}) for(double r: {1.0,1.0595,0.9439}) run((TimeDomainShifterAlgorithm)alg,F0,r,0);
  printf("--- silence (digital zero) then onset\n");
  for(int sil: {0,20,50,100,500,1000}) run(PP_NONE,150,1.0,sil);
  for(int sil: {500}) run(PP_NONE,150,0.7,sil);
}
