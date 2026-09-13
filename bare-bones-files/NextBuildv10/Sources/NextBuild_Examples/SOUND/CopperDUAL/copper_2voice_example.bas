'!ORG=24576
'!HEAP=2048
' DUAL Copper Sample Playback - em00k 04/07/26
' Create the sample packs with https://zxnext.uk/SamplePacker/

#define NEX
#include <nextlib.bas>
#include <keys.bas>

LoadSDBank("copper_engine_2voice.bin",0,0,0,28)                 ' engine code -> bank 28
LoadSDBank("samples.bin",0,0,0,$1f)                             ' sample pack (37 samples)

InitCopperAudio(28)                                             ' page bank 28, run engine_init

dim sample as ubyte = 0
dim keydown as ubyte = 0
dim channel as ubyte = 0

paper 0 : ink 7 : border 0 : cls 

print at 0,0;"2-voice copper - BANKED engine"
print at 2,0;"engine code in bank $1c (paged)"
print at 3,0;"samples in bank $1f (paged)"
Print at 5,0;"Sample : ";sample 
Print at 6,0;"Channel : ";channel

do

    CopperAudioUpdate()                             ' page bank 28, build one frame

    if GetKeyScanCode()=KEYSPACE and keydown = 0 
        sample = sample + 1 
        if sample > 36 : sample = 0 : endif 
        Print at 5,0;"Sample : ";sample 
        Print at 6,0;"Channel : ";channel
        CopperVoicePlay(channel, sample)                               
        channel = 1 - channel 
        keydown = 1
    end if

    if GetKeyScanCode()=0
        keydown = 0
    end if

loop

#include "copper_include_2voice_banked.bas"         ' required include 

' --- sample table: dw bank_and_loop, start_offset, length -------------------
'   bank_and_loop hi = first 8K bank, lo = loop count (0 = forever)
asm
; NextBuild Copper Sample Table  (copper_include_2voice*.bas)
; dw bank+loop, offset, length   (loop lo-byte: 0=forever, 1=play once)
; 15625Hz 8-bit unsigned PCM
copper_sample_table:
    dw $1F01,0,7078   ; 0 0A.wav
    dw $1F01,7078,2705   ; 1 0B.wav
    dw $2001,1591,13070   ; 2 0C.wav
    dw $2101,6469,11431   ; 3 0D.wav
    dw $2301,1516,17260   ; 4 0E.wav
    dw $2501,2392,8866   ; 5 0F.wav
    dw $2601,3066,716   ; 6 01.wav
    dw $2601,3782,35482   ; 7 1A.wav
    dw $2A01,6496,13663   ; 8 1B.wav
    dw $2C01,3775,3317   ; 9 1C.wav
    dw $2C01,7092,8934   ; 10 1E.wav
    dw $2D01,7834,21708   ; 11 1F.wav
    dw $3001,4966,5449   ; 12 02.wav
    dw $3101,2223,46521   ; 13 2D_3F.wav
    dw $3601,7784,6465   ; 14 03.wav
    dw $3701,6057,29756   ; 15 3A.wav
    dw $3B01,3045,44188   ; 16 3B.wav
    dw $4001,6273,15928   ; 17 3C.wav
    dw $4201,5817,18285   ; 18 04.wav
    dw $4401,7718,8565   ; 19 05.wav
    dw $4501,8091,14435   ; 20 06.wav
    dw $4701,6142,6656   ; 21 07.wav
    dw $4801,4606,19879   ; 22 08.wav
    dw $4A01,8101,9250   ; 23 09_1D.wav
    dw $4C01,967,10267   ; 24 10.wav
    dw $4D01,3042,6007   ; 25 11.wav
    dw $4E01,857,4787   ; 26 12.wav
    dw $4E01,5644,22968   ; 27 13.wav
    dw $5101,4036,5347   ; 28 14.wav
    dw $5201,1191,39764   ; 29 15.wav
    dw $5601,8187,3493   ; 30 16.wav
    dw $5701,3488,8143   ; 31 17.wav
    dw $5801,3439,6616   ; 32 18.wav
    dw $5901,1863,4876   ; 33 19.wav
    dw $5901,6739,21310   ; 34 34.wav
    dw $5C01,3473,65535   ; 35 35.wav
    dw $6401,3472,31359   ; 36 39.wav
end asm
