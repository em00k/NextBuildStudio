'!org=32768

#DEFINE IM2
#DEFINE NEX 
'#DEFINE CUSTOMISR

#include <nextlib.bas>
#include <nextlib_ints.bas>
#include <keys.bas>                             ' we will need to read keys 

'-- 
dim sfx     as ubyte 

' -- Load block 

LoadSDBank("[]ts4000.bin",0,0,0,33) 				' load the music replayer into bank 33
LoadSDBank("[]music2.pt3",0,0,0,34) 				' load music.pt3 into bank 34
LoadSDBank("[]soundfx.afb",0,0,0,36)                 ' load the sound effect banks into 36
' -- 

InitSFX(36)							            ' init the SFX engine, sfx are in bank 36
InitMusic(33,34,0000)				            ' init the music engine 33 has the player, 34 the pt3, 0000 the offset in bank 34
SetUpIM()							            ' init the IM2 code 
EnableSFX							            ' Enables the AYFX, use DisableSFX to top
EnableMusic 						            ' Enables Music, use DisableMusic to stop 

' main loop 

print "Press space to hear sfx" 

do 

    
    if GetKeyScanCode()=KEYSPACE
        PlaySFX(sfx)
        sfx = ( sfx + 1 ) band 63
    endif 

    WaitRaster(0)

loop 
