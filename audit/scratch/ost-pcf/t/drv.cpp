#include <cstdio>
#include <cstdlib>
#include <string>
#include <fstream>
#include "ost.h"
using namespace std;
static void w(const char*fn,const char*s){ofstream o(fn);o<<s;}
const double fd=0.002;
// simple loop driving osTrack with rms sequence
int run(OST_TAB&t,const double*rms,int N,int *statlog, double ratio=1.0, double slp=0){
  static double rec[100000]; int stat=0;
  for(int i=0;i<N;i++){ stat=t.osTrack(stat,i,i,rms[i],slp,ratio,rec,fd); rec[i]=rms[i]; if(statlog)statlog[i]=stat;}
  return stat;
}
int main(int argc,char**argv){
  string which=argv[1];
  if(which=="maxioi_onset"){
    // rise_hold then elapsed_time 0.1s; maxIOI 0 -> 2 after 0.2 s
    w("a.ost","rmsSlopeWin = 0.03\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.05 {}\n2 ELAPSED_TIME 0.1 NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n");
    OST_TAB t; t.readFromFile("a.ost",0); t.reset();
    double rms[2000]; for(int i=0;i<2000;i++) rms[i]=0.001; // never speaks -> maxIOI jump
    int log[2000]; run(t,rms,2000,log);
    int j2=-1,j3=-1; for(int i=0;i<2000;i++){ if(j2<0&&log[i]==2) j2=i; if(j3<0&&log[i]==3) j3=i; }
    printf("enter2 frame %d, enter3 frame %d => ELAPSED_TIME measured %.3f s (expected 0.1)\n",j2,j3,(j3-j2)*fd);
    printf("statOnsetIndices[0..3] = %d %d %d %d\n",t.statOnsetIndices[0],t.statOnsetIndices[1],t.statOnsetIndices[2],t.statOnsetIndices[3]);
  } else if(which=="maxioi_trials"){
    w("a.ost","rmsSlopeWin = 0.03\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.05 {}\n2 ELAPSED_TIME 0.1 NaN {}\n3 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n");
    OST_TAB t; t.readFromFile("a.ost",0); t.reset();
    for(int tr=0;tr<3;tr++){ double rms[2000]; for(int i=0;i<2000;i++) rms[i]=0.001; int log[2000]; run(t,rms,2000,log);
      int j2=-1; for(int i=0;i<2000;i++) if(j2<0&&log[i]==2) j2=i; printf("trial %d: maxIOI timeout (0.2s => expect frame ~101) fired at frame %d; statOnsetIndices[0]=%d\n",tr,j2,t.statOnsetIndices[0]); }
  } else if(which=="maxioi_stale"){
    w("a.ost","rmsSlopeWin = 0.03\nn = 2\n0 INTENSITY_RISE_HOLD 0.02 0.05 {}\n2 OST_END NaN NaN {}\n\nn = 1\n0 0.2 2\n");
    w("b.ost","rmsSlopeWin = 0.03\nn = 2\n0 INTENSITY_RISE_HOLD 0.02 0.05 {}\n2 OST_END NaN NaN {}\n");
    OST_TAB t; t.readFromFile("a.ost",0); t.readFromFile("b.ost",0);
    printf("maxIOICfg.n=%d stat0ptr=%p\n",t.maxIOICfg.n,(void*)t.maxIOICfg.stat0); fflush(stdout);
    double rms[10]={0}; run(t,rms,10,0); printf("no crash\n");
  } else if(which=="sparse"){
    w("c.ost","rmsSlopeWin = 0.03\nn = 2\n0 INTENSITY_RISE_HOLD 0.02 0.01 {}\n12 OST_END NaN NaN {}\n");
    OST_TAB t; t.readFromFile("c.ost",0); t.reset();
    double rms[100]; for(int i=0;i<100;i++) rms[i]=0.1; int log[100]; run(t,rms,100,log);
    printf("final stat %d\n",log[99]);
  } else if(which=="lastnotend"){
    w("d.ost","rmsSlopeWin = 0.03\nn = 1\n0 INTENSITY_RISE_HOLD 0.02 0.01 {}\n");
    OST_TAB t; t.readFromFile("d.ost",0); t.reset();
    double rms[100]; for(int i=0;i<100;i++) rms[i]=0.1; int log[100]; run(t,rms,100,log);
    printf("final stat %d\n",log[99]);
  } else if(which=="trunc"){
    w("e.ost","rmsSlopeWin = 0.03\nn = 3\n0 INTENSITY_RISE_HOLD 0.02 0.01 {}\n");
    OST_TAB t; try{ t.readFromFile("e.ost",0);}catch(...){printf("threw\n");} printf("returned\n");
  } else if(which=="hold"){
    // count frames for RISE_HOLD 0.05 and ratio-floor 0.05 hold
    for(int m=0;m<7;m++){
      const char* modes[]={"INTENSITY_RATIO_RISE 1.5 0.05 {}","INTENSITY_BELOW_THRESH_NEG_SLOPE 1.0 0.05 {}","INTENSITY_SLOPE_BELOW_THRESH 0 0.05 {}","INTENSITY_RISE_HOLD 0.02 0.05 {}","INTENSITY_RATIO_ABOVE_THRESH_WITH_RMS_FLOOR 1.5 0.05 {}","INTENSITY_AND_RATIO_ABOVE_THRESH 0.02 1.5 0.05","INTENSITY_AND_RATIO_ABOVE_THRESH 0.02 1.5 {}"};
      char buf[512]; snprintf(buf,512,"rmsSlopeWin = 0.03\nn = 2\n0 %s\n2 OST_END NaN NaN {}\n",modes[m]); w("f.ost",buf);
      OST_TAB t; t.readFromFile("f.ost",0); t.reset();
      double rms[400]; for(int i=0;i<400;i++) rms[i]= i>=100?0.1:0.0001; double rat[400]; for(int i=0;i<400;i++) rat[i]= i>=100?0.5:2.0; int log[400]; { static double rec[1000]; int stat=0; for(int i=0;i<400;i++){ stat=t.osTrack(stat,i,i,rms[i],-1.0,rat[i],rec,fd); log[i]=stat;} }
      int a=-1,b=-1; for(int i=0;i<400;i++){ if(a<0&&log[i]==1)a=i; if(b<0&&log[i]==2)b=i;}
      printf("%-55s cond-true from 100; enter1 %d enter2 %d -> %d frames = %.3f s\n",modes[m],a,b,b-100,(b-100)*fd);
    }
  } else if(which=="fall_leak"){
    // trial1: fall detected late; trial2 (no Audapter reset of ost) fall earlier blocked
    w("g.ost","rmsSlopeWin = 0.03\nn = 3\n0 ELAPSED_TIME 0.1 NaN {}\n1 INTENSITY_FALL 0.01 0.02 {}\n2 OST_END NaN NaN {}\n");
    OST_TAB t; t.readFromFile("g.ost",0); t.reset();
    for(int trial=0;trial<2;trial++){
      int fall = trial==0? 800:200; double rms[1500]; for(int i=0;i<1500;i++) rms[i]= (i>=20&&i<fall)?0.1:0.001;
      int log[1500]; run(t,rms,1500,log); int b=-1; for(int i=0;i<1500;i++) if(b<0&&log[i]==2) b=i;
      printf("trial %d: speech offset at %d, INTENSITY_FALL fired at frame %d\n",trial,fall,b);
    }
  }
  return 0;
}
