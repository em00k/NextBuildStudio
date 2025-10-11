'!org=32768
' NextBuild Layer2 Template 
'!exe=curl -X POST -F "data=@Sources/NextBuild_Examples/DISKIO/LoadBank/LoadBank.nex" http://192.168.4.1/upload

' This example uses the FileLib-inc.bas which is an advanced library 
' for loading files from SD card. 
'  
'!noemu
#define NEX                                 ' produces a self contained NEX 
#define IM2 

#include <nextlib.bas>
#include "../FileLib/FileLib-inc.bas"       ' Load the NB_Filelib.bas 

LoadSDBank("[]font20.spr",0,0,0,34)         ' Load a font from system assets

InitLayer2(MODE256X192)                     ' Set up Layer2

dim h, n    as ubyte 
dim b       as UINTEGER
dim a       as ubyte 
dim offset  as UINTEGER
dim msg$    as string 
dim texty   as ubyte 

Log("Attempting to load into banks")                ' print message with our font in bank 34 

a = fReadBanks("LoadBank.nex", 40)                  ' try loaded the NEX file into banks from 40 onwards

if a 
    msg$="Loaded into banks OK!"
else 
    msg$="Faile to load file!" 
endif 

Log(msg$)                                           ' show the message 

fClose(a)                                           ' closed the file 

Log("Loading screen")

' now lets load part of a file to screen 
Log("Open drive : "+str fOpenDrive())

' open the file and get a file handle in h
h = fOpenFile("NB_logo.scr") 

for n = 0 to 23
    if fReadBytes(h,$4000 + offset, $100)
       offset = offset + $100 
    else 
       'fClose(h)
       exit for 
    endif
    Pause(500)                              ' Delay for dramatic effect 
next n

Log("file done. ")

' Now lets load the file from position 2048, save this out 
' it will be the middle of the logo 
cls 

if h
    Log("file opened handle : "+ str h)
    
    if fSetPos(h, 2048 )                        ' set the position in the file 

        if fReadBytes( h, $4000, $800)>0        ' load file to screenmem
            n = fCreate("test.bin")             ' create a new file 
            if n 
                b = fWriteBytes(n, $4000, $800) ' save the screenmem to new file 
                if b
                    Log("saved bytes "+str b )  
                    fClose(n)
                     
                    n = fOpenFile("test.bin")
                    if n 
                        Log("Opened test.bin")
                        cls
                        b = fReadBytes(n, $4000,$800)   ' new saved file 
                        if b 
                            Log(str b+" bytes read")
                            fClose(n)
                        endif 
                    endif 
                    
                else 
                    Log("could not save bytes")
                endif 
            endif 
            
            'fClose(h)                              ' clean up and close file 
            Log("Loading file to banks")
            h = fReadBanks("test3.vgm", 36)         ' load a big file to rambanks 32++
            if h
                Log("file loaded to banks 36")
                if fDelete("test.bin") = 0          ' 
                    Log("file deleted")             
                endif 

            endif 
        else 
            Log("loading failed")
        endif 
    else 
        Log("could not set position in file")
    endif 
else 
    Log("did not open file")
    
endif 

Log("end.")

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