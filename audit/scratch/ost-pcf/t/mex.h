#pragma once
#include <cstdio>
#include <cstdarg>
#include <cstring>
#include <stdexcept>
inline int mexPrintf(const char* f, ...){va_list a;va_start(a,f);int r=vprintf(f,a);va_end(a);return r;}
inline void mexErrMsgTxt(const char* s){ throw std::runtime_error(s); }
