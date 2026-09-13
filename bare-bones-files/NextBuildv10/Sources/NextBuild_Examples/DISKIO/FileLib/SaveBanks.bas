'!org=24576
'!heap=512
'!opt=4
#define NEX 
#define IM2 

#include <nextlib.bas>
#include <print42.bas>
#include <nextlib_filelib.bas>

LoadSDBank("lemotree.psg",0,0,0,50)

dim r as ubyte = 0              ' result flag 

InitLayer2(MODE256X192)
print42("SaveBanks demo"+chr$(13))
print42("fSaveBanks("+chr(34)+"lemotree.out"+chr(34)+", 50, 40520)"+chr$(13))

dim file$ as string = "lorum_ipsum.txt"

dim a as ubyte 

a = fSaveBanks("lemotree.out", 50, 40520)  ' Save from bank 50 40520 bytes 

if a 
    print42("File saved OK"+chr$(13))
else 
    print42("error "+str(a)+chr$(13))
endif 

print42("end of demo")

do 
    WaitRaster(192) ' Wait for rasterline 
loop 
