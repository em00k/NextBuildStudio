'!org=24576
'!heap=512
'!opt=4
'!exe=cp /home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/DISKIO/FileLib/ReadDirectory.nex /mnt/flashair/192.168.2.1/

#define NEX 
#define IM2 
#define __NSTR

#include <nextlib.bas>
#include <print42.bas>
#include <nextlib_filelib.bas>

#define p print42

declare function PeekMem2(address as uinteger,delimeter as ubyte, bank as ubyte) as string

dim r as ubyte = 0              ' result flag 

InitLayer2(MODE256X192)
print42("Read directory demo"+chr(13))

'BBREAK
dim path$ as string = "c:"
dim fname$ as string

'fOpenDrive()                        ' open the drive 
'fChangeDir(path$)
r = fOpenDir(path$)                 ' open the desired path


if r 
    print42("path changed to: "+path$+chr(13))
    p(Nstr(fRewindDir(r))+chr(13))   ' rewind the dir
    do 
        fname$=fGetNextDir(r)       ' get the entry name 
        printat42(n,0)
        p(fname$)                   ' print th ename 
        printat42(n,20)
        p(Nstr(fGetDirSize(r))+chr$(13)) ' get the entry size 
        WaitKey()
        
        if fname$="!END"            ' end of results 
            n = 0 
            cls
            r = fOpenDir(path$)     ' reset and open again
            
        endif
        
        n = n + 1 : if n > 23 : cls : n = 0 : endif 
    loop 
else 
    print42("error")
endif 

print42("end of demo")

WaitKey()
