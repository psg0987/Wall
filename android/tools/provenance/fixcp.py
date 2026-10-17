# Rewrite Methodref -> InterfaceMethodref when the owner class is an interface (enjarify output -> Java 8 class files)
import zipfile,struct,sys
def parse(d):
    n=struct.unpack('>H',d[8:10])[0];i=10;k=1;ents={}
    while k<n:
        t=d[i];ents[k]=(t,i)
        if t==1:L=struct.unpack('>H',d[i+1:i+3])[0];i+=3+L
        elif t in(3,4,9,10,11,12,17,18):i+=5
        elif t in(5,6):i+=9;k+=1
        elif t in(7,8,16,19,20):i+=3
        elif t==15:i+=4
        else:raise ValueError('tag %d'%t)
        k+=1
    return ents,i
def utf8(d,ents,k):t,i=ents[k];L=struct.unpack('>H',d[i+1:i+3])[0];return d[i+3:i+3+L].decode('utf-8','replace')
zi=zipfile.ZipFile(sys.argv[1]);names=[x for x in zi.namelist() if x.endswith('.class')];data={x:zi.read(x) for x in names}
ifaces=set()
for x,d in data.items():
    ents,end=parse(d);acc=struct.unpack('>H',d[end:end+2])[0]
    if acc&0x0200:ifaces.add(x[:-6])
ifaces|=set(open('extif.txt').read().split());fixed=0;zo=zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED)
for inf in zi.infolist():
    d=zi.read(inf.filename)
    if inf.filename in data:
        d=bytearray(d);ents,end=parse(bytes(d))
        for k,(t,i) in ents.items():
            if t==10:
                ci=struct.unpack('>H',d[i+1:i+3])[0];ct,cpos=ents[ci];nm=utf8(bytes(d),ents,struct.unpack('>H',d[cpos+1:cpos+3])[0])
                if nm in ifaces:d[i]=11;fixed+=1
        d=bytes(d)
    zo.writestr(inf,d)
zo.close();print('interfaces',len(ifaces),'fixed refs',fixed)
