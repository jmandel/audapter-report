#include <cstdio>
#include <cmath>
const int pfNPoints=257, pfNBit=8;
double g[pfNPoints];
double locate(double f){ double loc; int k=1<<(pfNBit-1),n;
 for(n=0;n<pfNBit-1;n++){ if(f>=g[k]) k+=(1<<(pfNBit-n-2)); else k-=(1<<(pfNBit-n-2)); }
 if(f<g[k]) k--; loc=k; loc+=(f-g[k])/(g[k+1]-g[k]);
 if(loc>=pfNPoints-1) loc=pfNPoints-1-0.000000000001; if(loc<0) loc=0; return loc;}
int main(){ int bad=0;
 for(int i=0;i<pfNPoints;i++) g[i]=200+i*5.0; // 200..1480
 for(double f=150; f<1600; f+=0.37){ double l=locate(f); double exp=(f-200)/5.0; if(exp<0)exp=0; if(exp>256)exp=256; if(fabs(l-exp)>1e-6) {bad++; if(bad<5) printf("mismatch f=%g loc=%g exp=%g\n",f,l,exp);} }
 printf("bad=%d\n",bad);
 printf("f=1480 loc=%.15g int=%d\n", locate(1480), (int)floor(locate(1480)));
 for(int i=0;i<pfNPoints;i++) g[i]=0; printf("zeros grid f=500: %g ; f=0: %g int=%d\n", locate(500), locate(0), (int)floor(locate(0)));
 for(int i=0;i<pfNPoints;i++) g[i]= i<100?0:1000; printf("dup grid f=0: %g f=1000: %g\n", locate(0), locate(1000));
}
