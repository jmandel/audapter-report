#include <cstdio>
#include <cmath>
#include <vector>
#include "time_domain_shifter.h"
using namespace audapter;
int main(){
  const int sr=16000, fl=32;
  // 1) latency at ratio 1: xcorr lag between x and y (harmonic complex 151 Hz with slow AM so lag is unambiguous)
  { TimeDomainShifter::PitchShiftSchedule s; s.push_back({0.0,1.0}); TimeDomainShifter t(PP_NONE,sr,fl,s);
    int N=sr; std::vector<double> x(N),f(N),y(N,0);
    for(int n=0;n<N;n++){double tt=(double)n/sr; double env=1+0.8*sin(2*M_PI*3*tt); double v=0; for(int k=1;k*151<4000;k++) v+=sin(2*M_PI*k*151*tt+0.3*k)/k; x[n]=0.1*env*v; f[n]=sin(2*M_PI*151*tt+0.3);}
    for(int c=0;c+fl<=N;c+=fl) t.processFrame(&f[c],&x[c],&y[c],fl);
    // envelope xcorr
    auto env=[&](std::vector<double>&v){std::vector<double> e(N,0); double a=0; for(int n=0;n<N;n++){a=0.995*a+0.005*fabs(v[n]); e[n]=a;} return e;};
    auto ex=env(x), ey=env(y); int best=0; double bc=-1e9; for(int l=0;l<1600;l++){double c=0; for(int n=4000;n<N-1600;n++) c+=ex[n]*ey[n+l]; if(c>bc){bc=c;best=l;}}
    printf("TDS ratio=1 envelope lag = %d samples (%.1f ms)\n",best,1000.0*best/sr);
  }
  // 2) resume after a below-threshold gap: 150 Hz segment, gap (frames not passed), 250 Hz segment
  { TimeDomainShifter::PitchShiftSchedule s; s.push_back({0.0,1.0}); TimeDomainShifter t(PP_NONE,sr,fl,s);
    int N1=sr/2; std::vector<double> y(fl);
    std::vector<double> x(fl),f(fl); long n=0;
    for(int c=0;c<N1;c+=fl){ for(int i=0;i<fl;i++,n++){double tt=(double)n/sr; x[i]=0.1*sin(2*M_PI*150*tt); f[i]=x[i];} t.processFrame(f.data(),x.data(),y.data(),fl);}    
    printf("after resume with 250 Hz input (x = 0.2*sin 250Hz), first output frames:\n");
    for(int k=0;k<6;k++){ double e=0; for(int i=0;i<fl;i++,n++){double tt=(double)n/sr; x[i]=0.2*sin(2*M_PI*250*tt); f[i]=x[i];} t.processFrame(f.data(),x.data(),y.data(),fl);
      for(int i=0;i<fl;i++) e+=y[i]*y[i]; printf("  frame %d rms=%.3f (input rms 0.141; old segment rms 0.071)\n",k,sqrt(e/fl)); }
  }
}
