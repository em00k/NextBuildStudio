'!ORG=24576
'!HEAP=2048
'#! "assets\gfx2next.exe -tile-repeat -tile-size=8x8 -colors-4bit -block-size=4x4 assets\basicshapes.bmp data\basicsh"

' note : with the new ints library copytobanks needs to disable interrupts - this needs fixing...
'
#define IM2
#define NEX
#define CUSTOMISR
#include <nextlib.bas>
#include <nextlib_ints.bas>
#include <keys.bas>


PAPER 0 : BORDER 0 : ink 0 : CLS 

asm 
    nextreg SPRITE_CONTROL_NR_15,%000_001_11          ; ULA/TM / Sprites / L2
    nextreg GLOBAL_TRANSPARENCY_NR_14,0             ; Set global transparency to BLACK
    nextreg TURBO_CONTROL_NR_07,3                   ; 28mhz 
    nextreg PERIPHERAL_3_NR_08,254                  ; contention off
    ;nextreg ULA_CONTROL_NR_68,%10101000             ; Tilemap Control on & on top of ULA,  80x32 
    di                                              ; disable ints as we dont want IM1 running as we're using the area that sysvars would live in
end asm 


' -- Load Block 

LoadSDBank("Sound97.pt3",0,0,0,56)                 ' load music.pt3 into bank 
LoadSDBank("[]vt24000.bin",0,0,0,37)              ' load the music replayer into bank 
LoadSDBank("[]soundfx.afb",0,0,0,38)                 ' load music.pt3 into bank 

' 3,915 S1_A7.pcm
' 3,916 S1_B1.pcm
' 8,556 S1_B4.pcm
' 9,336 S1_CE.pcm
' 13977 S1_A3.pcm

LoadSDBank("S1_A7.pcm",0,0,0,57)
LoadSDBank("S1_B1.pcm",0,0,0,58)
LoadSDBank("S1_B4.pcm",0,0,0,59)
LoadSDBank("S1_CE.pcm",0,0,0,61)
LoadSDBank("S1_A3.pcm",0,0,0,63)

'////////////////////////////////////////////////////
'// variables 
'////////////////////////////////////////////////////

dim     key_down    as ubyte = 0 
dim     sample      as ubyte = 0 
dim     flx, fly    as ubyte 
dim     dix         as ubyte = 1 
dim     diy         as ubyte = 1

' -- 
InitCopperAudio()
PlayCopperSample(4)     
SetCopperAudio()
' -- 
InitSFX(38)                                     ' init the SFX engine, sfx are in bank 36
InitMusic(37,56,0000)                           ' init the music engine 33 has the player, 34 the pt3, 0000 the offset in bank 34
SetUpIM()                                       ' init the IM2 code 

EnableSFX                                       ' Enables the AYFX, use DisableSFX to top
PlaySFX(0)                                      ' Plays SFX 
'DisableMusic                                    ' Enables Music, use DisableMusic to stop 
'StopMusic()
PlayCopperSample(6)
paper 0 : ink 7 : border 0 : cls 

print at 0,0;sample    
print at 2,0;"Copper Samples and AY music "

' set keys to 1 to wait for space or 0 to see a bopper

keys = 0

do 
    WaitRetrace2(250)

    if keys = 1
        CheckKeys()        
    else 
        Bopper()
        WaitRetrace(50)
    endif 

loop 

sub Bopper()

    print at fly, flx;" "

    flx = flx + dix 

    if flx >= 31
        dix = 255
        UpdateSample()
    elseif flx = 0
        dix = 1 
        UpdateSample()
    endif 
    fly = fly + diy 
    if fly >= 23
        diy = 255
        UpdateSample()
    elseif fly = 0
        diy = 1 
        UpdateSample()
    endif 

    print at fly, flx;"#"

end sub 

'
sub CheckKeys()

    dim a   as uinteger

    a = GetKeyScanCode()

    if key_down = 0 
        if a = KEYSPACE
            UpdateSample()
            key_down = 1 
        endif 
    elseif a = 0 
        key_down = 0 
    endif

end sub 
    
sub UpdateSample()
    
    PlayCopperSample(sample)
    print at 0,0;sample         
    sample = sample + 1 
    if sample > 4
        sample = 0 
    endif 

end sub 

Sub MyCustomISR()
    
    ' CopperWaitLine()

    PlayCopperAudio()
    SetCopperAudio()        

end sub 

#include "copper_include.bas"

' copper_sample_table:
asm 
    copper_sample_table: 
    ; bank+loop , sample start, sample len
    ; eg bank 56,loop 0 = $3800 
    ; sample table sample * 6 

    ;   3,915 S1_A7.pcm 1 bank
    ;   3,916 S1_B1.pcm 1 bank
    ;   8,556 S1_B4.pcm 2 banks
    ;   9,336 S1_CE.pcm 2 banks 

    ; dx57 = $39

    dw $3901, 0, 3915   ; 3,915 S1_A7.pcm 1 bank
    dw $3a01, 0, 3916   ; 3,916 S1_B1.pcm 1 bank
    dw $3b01, 0, 8556  ; 8,556 S1_B4.pcm 2 banks
    dw $3d01, 0, 9336   ; 9,336 S1_CE.pcm 2 banks 
    dw $3f01, 0, 13977   ; 13977 S1_A3.pcm 2 banks 
    dw $3901, 0, 0 

    
end asm 

