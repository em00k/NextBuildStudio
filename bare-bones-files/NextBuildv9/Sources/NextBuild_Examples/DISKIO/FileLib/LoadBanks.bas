'!org=24576

#define NEX 
#define IM2 

#include <nextlib.bas>
#include "../FileLib/FileLib-inc.bas"

dim r as ubyte = 0              ' result flag 

InitLayer2(MODE256X192)
print "Load bank demo"

dim file$ as string = "lorum_ipsum.txt"

r = fReadBanks(file$, 32)  ' load file to bank 32 

if r 
    print "file loaded into banks OK" 
else 
    print "error"
endif 

print "end of demo" 

do 
    WaitRaster(192) ' Wait for rasterline 
loop 
