'!ORG=32768
'!HEAP=2048 
'#!copy=H:\Examples\SimpleTSMusic.nex

' SimpeMusic_SFX demo
' Plays a TS song with the AYFX bank installed. 
' Press F6 and pick "Run in CSpect"
'

#define IM2
#define NEX
#include <nextlib.bas>                          ' include the nextlib 
#include <nextlib_ints.bas>                     ' if we're using interrupts we need this library too
#include <keys.bas>


LoadSDBank("tesko.pt3",0,0,0,25) 				' this is a 6 channel TS song into bank 42
LoadSDBank("lyraii4.pt3",0,0,0,28) 				' load music.pt3 into bank 
LoadSDBank("ts4000.bin",0,0,0,37) 				' load the ts music replayer into bank 37
LoadSDBank("game.afb",0,0,0,38) 				' load the sound fx bank into 38
LoadSDBank("strip_1_17.nxt",0,0,0,40)           ' Load in a font into bank 40

InitLayer2(MODE256X192)                         ' set up Layer2 and clear to black 

'Below we initialis the interrupts with bank 38 for sfx, replayer 37 and music bank 42
InitInterrupts(38,37,25,3814)	                ' 3814 is the offset in tesko.pt3 of the second module

L2Text(0,0,"TURBOSOUND INTERRUPT EXAMPLE",40,0) ' show some text 
L2Text(0,1,"KEYS 1 - 2 TO SWAP TUNES",40,0) ' show some text 
L2Text(0,3,"3 TO PLAY AY FX",40,0) ' show some text 

dim k           as string
dim kdown,n     as ubyte 
do 
    ' forever loop
    k = inkey$


    if kdown = 1 
        if k = "" 
            kdown = 0 
        endif 
    elseif k = "1" 
        NewMusic(28,3025)
        kdown = 1 
        Console("Playing music 1")
    elseif k  = "2" 
        NewMusic(25,3814)
        kdown = 1 
        Console("Playing music 2")
    elseif k  = "3" 
        L2Text(0,5,"AYFX "+str(n)+" ",40,255)
        PlaySFX(n)
        n=n+1 band 63
        kdown = 1         
        Console("Playing sfx "+str(n))
    endif 
    
loop 

sub InitInterrupts(byval sfxbank as ubyte, byval plbank as ubyte, byval musicbank as ubyte, second_module as uinteger)
    	 
	InitSFX(sfxbank)						        ' init the SFX engine, sfx are in bank 36
	InitMusic(plbank,musicbank,second_module)		' init the music engine 33 has the player, 34 the pt3, 0000 the offset in bank 34
	SetUpIM()							            ' init the IM2 code 
	PlaySFX(255)                                    ' Play a blank SFX 255
	EnableMusic
	EnableSFX

end sub 

