'!org=24576

' NextBuild Layer2 Template 

'#!exe=curl -X POST -F "data=@Sources/NextBuild_Examples/DISKIO/Filelib/ChangeDir.nex" http://192.168.4.1/upload

#define NEX 
#define IM2 

#include once <nextlib.bas>
#include "../FileLib/FileLib-inc.bas"
LoadSDBank("[]font24.spr",0,0,0,34)

dim r       as ubyte = 0              ' result flag 
dim test$   as string  = "test" 
dim texty   as ubyte 

InitLayer2(MODE256X192)

Log("Load bank demo")

fOpenDrive()

r = fChandeDir("test")                  ' on real hw 127 will be returned for success

if r 
    Log("dir opened")
    r = fReadBanks("test.txt",36)       ' load file from test/test.txt
    if r 
        Log("Read file to bank 36")
    endif 
else 
    Log("error "+ str r)
endif 

Log("end of demo")

do 
    WaitRaster(192) ' Wait for rasterline 
loop 


sub Log(msg$ as string)
    ' routine to handle printing to screen with L2Text
    L2Text(0,texty,msg$,34,0)
    texty = texty + 1 
    if texty > 23 
        ClearLayer2(0)
        texty = 0 
    endif 
end sub 