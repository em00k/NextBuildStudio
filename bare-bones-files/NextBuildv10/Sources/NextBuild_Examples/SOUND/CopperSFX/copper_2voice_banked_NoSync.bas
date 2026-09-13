'!ORG=24576
'!HEAP=2048
'!exe=s2f copper_2voice_banked_test-2.nex

#define NEX
#include <nextlib.bas>
#include <keys.bas>

' This version of the DUAL-COPPER Audio does NOT hold up waiting for
' the correct scanline, so this must be done by the caller.
' Wrap the WaitRaster with the Copper calls immediatley before and after
' to keep everything in sync, then this will place nice with Interrupts IM2
'
' CopperAudioFill()
' WaitRaster(syncline) 
' CopperAudioStart()
'
' Look at the CODEBANK version for a suitable example

#include "includes/copper_include_2voice_banked.bas"

asm
    di
    nextreg TURBO_CONTROL_NR_07,3                   ; 28MHz
    nextreg GLOBAL_TRANSPARENCY_NR_14,0
    getreg(8) : or %01001010 : nextreg PERIPHERAL_3_NR_08,a   ; contention OFF (b6) + DAC (b3) + turbosound (b1)
end asm

PAPER 0 : BORDER 0 : ink 7 : CLS
print at 0,0;"2-voice copper - BANKED engine"
print at 2,0;"engine code in bank 40 (paged)"
print ink 6;at 10,0;"SPACE to play next sample"


LoadSDBank("copper_engine_2voice.bin",0,0,0,28)     ' engine code -> bank 40
LoadSDBank("samples.bin",0,0,0,$1f)                    ' voice 0 sample


InitCopperAudio(28)                                 ' page bank 40, run engine_init
CopperVoicePlay(0, 0)                               ' table entry 0 -> voice 0
CopperVoicePlay(1, 1)                               ' table entry 1 -> voice 1

dim f as ubyte = 0
dim sample as ubyte = 0
dim keydown as ubyte = 0
dim channel as ubyte = 0
dim syncline as ubyte = CopperAudioLine()           ' 187/191/186/189 by mode

print ink 3;at 6,0;"Sample    Channel"
print ink 5; at 7,0;sample
print ink 5; at 7,10;channel

do
    ' --- detached sync: the wait is OURS, not the engine's ------------------
    border 2
    CopperAudioFill()                               ' page bank 40, build one frame
    border 0
    WaitRaster(syncline)                            ' nothing between this...
    border 3
    CopperAudioStart()                              ' ...and this
    border 0

    if GetKeyScanCode()=KEYSPACE and keydown = 0 
        'CopperVoicePlay(1, 0)                               ' table entry 0 -> voice 0
        sample = sample + 1
        if sample > 37 : sample = 0 : endif  
        CopperVoicePlay(channel, sample)                               ' table entry 1 -> voice 1
        channel = 1 - channel 
        keydown = 1
        print ink 5; at 7,0;sample;" "
        print ink 4; at 7,10;channel;" "   
    end if

    if GetKeyScanCode()=0
        keydown = 0
    end if

loop

' --- sample table: dw bank_and_loop, start_offset, length -------------------
'   bank_and_loop hi = first 8K bank, lo = loop count (0 = forever)
asm
; ZX Next Copper Sample Table  (copper_include_2voice*.bas)
; dw bank+loop, offset, length   (loop lo-byte: 0=forever, 1=play once)
; 15625Hz 8-bit unsigned PCM
copper_sample_table:
    dw $1F01,0,15928   ; 0 3C.wav
    dw $2001,7736,7078   ; 1 0A.wav
    dw $2101,6622,2705   ; 2 0B.wav
    dw $2201,1135,13070   ; 3 0C.wav
    dw $2301,6013,11431   ; 4 0D.wav
    dw $2501,1060,16384   ; 5 0E.wav
    dw $2701,1060,8866   ; 6 0F.wav
    dw $2801,1734,716   ; 7 01.wav
    dw $2801,2450,16384   ; 8 1A.wav
    dw $2A01,2450,13663   ; 9 1B.wav
    dw $2B01,7921,3317   ; 10 1C.wav
    dw $2C01,3046,8934   ; 11 1E.wav
    dw $2D01,3788,16384   ; 12 1F.wav
    dw $2F01,3788,5449   ; 13 02.wav
    dw $3001,1045,16384   ; 14 2D_3F.wav
    dw $3201,1045,6465   ; 15 03.wav
    dw $3201,7510,16384   ; 16 3A.wav
    dw $3401,7510,16384   ; 17 3B.wav
    dw $3601,7510,15928   ; 18 3C.wav
    dw $3801,7054,16384   ; 19 04.wav
    dw $3A01,7054,8565   ; 20 05.wav
    dw $3B01,7427,14435   ; 21 06.wav
    dw $3D01,5478,6656   ; 22 07.wav
    dw $3E01,3942,16384   ; 23 08.wav
    dw $4001,3942,9250   ; 24 09_1D.wav
    dw $4101,5000,10267   ; 25 10.wav
    dw $4201,7075,6007   ; 26 11.wav
    dw $4301,4890,4787   ; 27 12.wav
    dw $4401,1485,16384   ; 28 13.wav
    dw $4601,1485,5347   ; 29 14.wav
    dw $4601,6832,16384   ; 30 15.wav
    dw $4801,6832,3493   ; 31 16.wav
    dw $4901,2133,8143   ; 32 17.wav
    dw $4A01,2084,6616   ; 33 18.wav
    dw $4B01,508,4876   ; 34 19.wav
    dw $4B01,5384,16384   ; 35 34.wav
    dw $4D01,5384,16384   ; 36 35.wav
    dw $4F01,5384,16384   ; 37 39.wav

end asm
