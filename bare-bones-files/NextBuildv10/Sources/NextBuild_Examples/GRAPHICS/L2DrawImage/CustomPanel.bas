'!org=24576
' NextBuild Layer2 Template 

#define NEX 
#define IM2 

#include <nextlib.bas>

asm 
    ; setting registers in an asm block means you can use the global equs for register names 
    ; 28mhz, black transparency,sprites on over border,320x256
    nextreg TURBO_CONTROL_NR_07,%11         ; 28 mhz 
    nextreg GLOBAL_TRANSPARENCY_NR_14,$0    ; black 
    nextreg SPRITE_CONTROL_NR_15,%00000011  ; %000    S L U, %11 sprites on over border
    nextreg LAYER2_CONTROL_NR_70,%00000000  ; 5-4 %01 = 320x256x8bpp
end asm 

LoadSDBank("original2-128x192.nxi",0,0,0,32)       ' load in pirate 1
LoadSDBank("grey.nxp",0,0,0,42)
InitPalette(L2_PALETTE_P1,42)

dim n       as ubyte 
dim x       as ubyte 
dim card    as ubyte 

Cls256(0)


BankPoke(32,$0000,128)

do 
    
    
    DrawImage(n,0,@image_one, 0 )
    WaitKey()
    n = n + 10
loop 

' DrawImage requires MUL16 lib, so we need to make Boriel include it!

dim bo   as uinteger = 0 
border 1563*bo

image_one:
    asm
        ; bank  spare  
        db  32, 128, 180
        ; offset in bank  
        dw 00
    end asm 
    
image_128:
    asm
        ; bank  spare  
        db  62, 136, 128
        ; offset in bank  
        dw 00
    end asm   

image_robo:
    asm
        ; bank  spare  
        db  36, 34, 56
        ; offset in bank  
        dw 00
    end asm 

image_smallflag:
    asm
        ; bank  spare  
        db  42, 16, 16
        ; offset in bank  
        dw 00
    end asm 

image_cards:
    asm
        ; bank  spare  
        db  44, 51, 75
        ; offset in bank  
        dw 00
    end asm 

