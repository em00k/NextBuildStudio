'!org=24576

' NextBuild Layer2 Template 

'#!exe=bash -c "~/scripts/upload.sh Sources/NextBuild_Examples/DISKIO/LoadBank/LoadBank.nex /LoadBank.nex"

#define NEX 
#define IM2 

#include once <nextlib.bas>
#include "../FileLib/FileLib-inc.bas"

dim r as ubyte = 0              ' result flag 
dim test$ as string  = "test" 

InitLayer2(MODE256X192)
print "Load bank demo"
print test$

fOpenDrive()

r = fOpenFile("lorum_ipsum.txt")  ' load file to bank 32 

if r 
    print "file opened" 
    line$ = fReadLine(r, $400)

else 
    print "error"
endif 

print "end of demo" 

do 
    WaitRaster(192) ' Wait for rasterline 
loop 
