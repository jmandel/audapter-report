import sys,struct,subprocess
for u in sys.argv[1:]:
    b=subprocess.run(['curl','-sL','-r','0-255',u],capture_output=True).stdout
    if b[:4]!=b'RIFF': print(u,'not RIFF',b[:12]);continue
    i=12;out='?'
    while i<len(b)-8:
        cid=b[i:i+4];sz=struct.unpack('<I',b[i+4:i+8])[0]
        if cid==b'fmt ':
            fmt,ch,sr,br,ba,bits=struct.unpack('<HHIIHH',b[i+8:i+24]);out=f'fmt={fmt} ch={ch} sr={sr} bits={bits}'
        if cid==b'data': out+=f' dur={sz/ (ch*bits/8)/sr:.2f}s';break
        i+=8+sz
    print(u.split('githubusercontent.com/')[-1],out)
