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

LoadSDBank("pirate-win.raw",0,0,0,32)       ' load in pirate 1
LoadSDBank("pirate-loss.raw",4096,0,0,32)   ' load in pirate 2
'LoadSDBank("pirate-loss.raw",0,0,0,33)
LoadSDBank("2frame_128x128.raw",0,0,0,62)
LoadSDBank("robo2.nxt",0,0,0,36)
LoadSDBank("flags16x16.raw",0,0,0,42)
LoadSDBank("sprite_sheet.nxt",0,0,0,44)

Cls256(0)

do 

    DrawImage(0,0,@image_pirate,0)          ' frame 0 pirate 1
    WaitKey()
    DrawImage(0,0,@image_pirate,1)          ' frame 1 pirate 2
    WaitKey()

loop 


' DrawImage requires MUL16 lib, so we need to make Boriel include it!

dim bo   as uinteger = 0 
border 1563*bo

image_pirate:
    asm
        ; bank  spare  
        db  32, 64, 64
        ; offset in bank  
        dw 2
    end asm 
    
image_128:
    asm
        ; bank  spare  
        db  62, 128, 128
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

