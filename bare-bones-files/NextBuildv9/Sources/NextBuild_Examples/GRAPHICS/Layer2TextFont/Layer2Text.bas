'!ORG=24576
' NextBuild Studio Layer2Text 
' Sorry - there seems to be a bug when FL2Text is used that locks
' printing...

#DEFINE NEX 
#include <nextlib.bas>

LoadSDBank("[]font1.spr",0,0,0,35)              ' load font into bank 32 
LoadSDBank("[]font12.spr",0,0,0,33)             ' load fron into bank 33 

do 
    
    InitLayer2(MODE256X192)   	                    ' setup screen mode 
    L2Text(0,0,"HELLO FROM NEXTBUILDSTUDIO",35,0)   ' print L2Text, use bank 32
    L2Text(0,1,"256X192 LAYER2 GFX",35,0)           
    WaitKey()                                       ' wait for keypress 

    InitLayer2(MODE320X256)                         ' switch modes to 320x256  
    FL2Text(0,0,"HELLO FROM 320X256 SCREENMODE",33)
    WaitKey()                           

loop                                       ' loop forever so we dont crash!


