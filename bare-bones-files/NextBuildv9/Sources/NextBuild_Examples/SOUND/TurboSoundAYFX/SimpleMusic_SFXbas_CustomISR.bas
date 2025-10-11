'!ORG=32768
'!HEAP=2048
'#!copy=H:\Examples\SimpleTSMusic.nex

' SimpeMusic_SFX demo
' Plays a TS song with the AYFX bank installed. 
' Press F6 and pick "Run in CSpect"
'
' Please in CSpect there is corruption on the sprites
' that do not happen on real hardware!!

#define IM2
#define NEX
#define CUSTOMISR
#include <nextlib.bas>                          ' include the nextlib 
#include <nextlib_ints.bas>                     ' if we're using interrupts we need this library too
#include <keys.bas>


LoadSDBank("tesko.pt3",0,0,0,25) 				' this is a 6 channel TS song into bank 42
LoadSDBank("lyraii4.pt3",0,0,0,26) 				' load music.pt3 into bank 
LoadSDBank("ts4000.bin",0,0,0,37) 				' load the ts music replayer into bank 37
LoadSDBank("game.afb",0,0,0,38) 				' load the sound fx bank into 38
LoadSDBank("strip_1_17.nxt",0,0,0,40)           ' Load in a font into bank 40
LoadSDBank("vumeters.spr",0,0,0,42)             ' Load in a sprites 


InitLayer2(MODE256X192)

'upload the vumeter sprites from bank 42
InitSprites2(16,0,42,0)

'Below we initialis the interrupts with bank 38 for sfx, replayer 37 and music bank 42
InitInterrupts(38,37,25,3814)	                ' 3814 is the offset in tesko.pt3 of the second module

asm 
    nextreg     SPRITE_CONTROL_NR_15,%00000011
end asm 

L2Text(0,0,"TURBOSOUND INTERRUPT EXAMPLE",40,0) ' show some text 
L2Text(0,1,"KEYS 1 - 2 TO SWAP TUNES",40,0) ' show some text 
L2Text(0,3,"3 TO PLAY AY FX",40,0) ' show some text 

dim k               as string
dim basex, basey    as ubyte
dim kdown,n         as ubyte 

dim a1,b1,c1        as ubyte 
dim a2,b2,c2        as ubyte 

basex = 124 : basey = 132 
do 
    ' forever loop
    k = inkey$

    if kdown = 1 
        if k = "" 
            kdown = 0 
        endif 
    elseif k = "1" 
        NewMusic(26,3025)
        kdown = 1 
    elseif k  = "2" 
        NewMusic(25,3814)
        kdown = 1 
    elseif k  = "3" 
        L2Text(0,5,"AYFX "+str(n)+" ",40,255)
        PlaySFX(n)
        n=n+1 band 63
        kdown = 1         
    endif 
 
    WaitRetrace2(190)
loop 

sub MyCustomISR()
    
    NextReg($50,$ff)
    NextReg($51,$ff)
    border 2 
    UpdateVus()
    border 1

end sub 

sub UpdateVus()


    out 65533, 255
    out 65533, 8
    a1 = (in 65533) band 15

    out 65533, 9
    b1 = in 65533 band 15

    out 65533, 10
    c1 = in 65533 band 15

    out 65533, 254
    out 65533, 8
    a2 = in 65533 band 15

    out 65533, 9
    b2 = in 65533 band 15

    out 65533, 10
    c2 = in 65533 band 15

    'L2Text(0,10,str(a1),40,255)

    UpdateSprite(cast(uinteger,basex)   , basey, 0, a1, 0, 0)
    UpdateSprite(cast(uinteger,basex+8) , basey, 1, b1, 0, 0)
    UpdateSprite(cast(uinteger,basex+16), basey, 2, c1, 0, 0)

    UpdateSprite(cast(uinteger,basex)+32, basey, 3, a2, 0, 0)
    UpdateSprite(cast(uinteger,basex)+40, basey, 4, b2, 0, 0)
    UpdateSprite(cast(uinteger,basex)+48, basey, 5, c2, 0, 0)

end sub 

sub InitInterrupts(byval sfxbank as ubyte, byval plbank as ubyte, byval musicbank as ubyte, second_module as uinteger)
    	 
	InitSFX(sfxbank)						        ' init the SFX engine, sfx are in bank 36
	InitMusic(plbank,musicbank,second_module)		' init the music engine 33 has the player, 34 the pt3, 0000 the offset in bank 34
	SetUpIM()							            ' init the IM2 code 
	PlaySFX(255)                                    ' Play a blank SFX 255
	EnableMusic
	EnableSFX

end sub 