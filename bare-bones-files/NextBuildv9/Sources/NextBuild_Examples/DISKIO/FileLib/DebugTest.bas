'!org=32767 

#include <nextlib.bas>


'!org=24576
' NextBuild Layer2 Template 

'#!exe=bash -c "~/scripts/upload.sh Sources/NextBuild_Examples/DISKIO/LoadBank/LoadBank.nex /LoadBank.nex"

#define NEX 
#define IM2 

#include <nextlib.bas>

dim c as ubyte = 0 

print "testing debug out" 

do 
   
    Console("Did you see what I did there  "+str(c) )                    ' print test message 
    
    Console("This message will ened up on the console")                 ' print test message 

    print at 1,0;"Message "+str(c)+"  "

    Pause(2000) ' Wait for rasterline 
     
    c = c + 1 
loop 

