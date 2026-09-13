'!org=24576
'!heap=512
'!opt=4
#define NEX 
#define IM2 

#include <nextlib.bas>
#include <print42.bas>
#include <nextlib_filelib.bas>

dim r as ubyte = 0              ' result flag 

InitLayer2(MODE256X192)
print42("Load bank demo")

dim file$ as string = "lorum_ipsum.txt"

r = fReadBanks(file$, 32)  ' load file to bank 32 

if r 
    print42("file loaded into banks OK "+str(r))
else 
    print42("error")
endif 

print42("end of demo")

do 
    WaitRaster(192) ' Wait for rasterline 
loop 
