
'#!org=32767             'Set the start address      


#define NEX                                 ' Include data in NEX
#include <nextlib.bas>

InitLayer2(MODE256X192)
ClearLayer2(0)
LoadSDBank("[]font3.spr",0,0,0,34)
L2Text(0,0,"HELLO THERE",34,0)  
ShowLayer2(1)   

do
    WaitRaster(192)
loop  
