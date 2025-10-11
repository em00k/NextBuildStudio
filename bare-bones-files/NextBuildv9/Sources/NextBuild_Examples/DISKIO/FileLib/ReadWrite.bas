'!org=24576
' NextBuild Layer2 Template 
'#!exe=bash -c "~/scripts/upload.sh Sources/NextBuild_Examples/DISKIO/LoadBank/LoadBank.nex /LoadBank.nex"

#define NEX 
#define IM2 

#include <nextlib.bas>
#include "../FileLib/FileLib-inc.bas"

dim r as ubyte = 0                      ' result flag 
dim b as UINTEGER

InitLayer2(MODE256X192)
print "Load bytes demo"

fOpenDrive()                            ' open the default drive

r = fOpenFile("NB_Logo.scr")                ' load file to bank 32 
r2 = fOpenFile("NB_Logo2.scr")

if r 
    print "file opened OK" 
    BBREAK 
    dim position as UINTEGER
    position = 0
    do 
        fSetPos(r, position )                   ' ensure we're at the start 
        b = fReadBytes(r, $4000, $800)
        ' if b 
        '     print "loaded bytes to RAM"
        '     print "loaded "; b 
        ' else 
        '     print "load error"
        ' endif 
        if position > 1  
            position = position -1
        else 
            position = 256*16
        endif 
        WaitRaster(192) ' Wait for rasterline 
        fSetPos(r2, 0 )
        fReadBytes(r2, $4000+position, 6144-position)         
    loop 
else 
    print "error"
endif 

print "end of demo" 

do 
    WaitRaster(192) ' Wait for rasterline 
loop 
