#include <cstdio>
#include <fstream>
#include "pcf.h"
using namespace std;
static void w(const char*fn,const char*s){ofstream o(fn);o<<s;}
int main(int argc,char**argv){
  string which=argv[1];
  if(which=="oob"){
    w("p.pcf","0\n5\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n3, 0, 0, 0, 0\n4, 0, 0, 0.3, 0\n");
    PERT_CFG p; p.readFromFile("p.pcf",0);
    for(int s=5;s<9;s++) printf("stat %d: fmtPertAmp[stat]=%g (!=0 -> during_trans=%d) fmtPertPhi=%g\n",s,p.fmtPertAmp[s],p.fmtPertAmp[s]!=0,p.fmtPertPhi[s]);
  } else if(which=="partial"){
    w("p.pcf","0\n5\n0, 0, 0, 0, 0\n1, 0, 0, 0, 0\n2, 0, 0, 0, 0\n3, 0, 0, 0, 0\n4, 0, 0, 0.3, 0\n");
    w("q.pcf","1\n0.1, 0.5, 0.1\n3\n0, 0, 0, 0, 0\n");
    PERT_CFG p; p.readFromFile("p.pcf",0);
    try{ p.readFromFile("q.pcf",0);}catch(PERT_CFG::pcfFileSyntaxError&e){printf("syntax error: %s\n",e.errLine.c_str());}
    printf("after failed reload: n=%d pitchShift=%p intShift=%p fmtPertAmp=%p\n",p.n,(void*)p.pitchShift,(void*)p.intShift,(void*)p.fmtPertAmp);
  }
}
