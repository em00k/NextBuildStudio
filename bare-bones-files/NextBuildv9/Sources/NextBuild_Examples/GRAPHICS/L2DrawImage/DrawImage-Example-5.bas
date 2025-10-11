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

LoadSDBank("box-32x32.nxt",0,0,0,32)       ' load in 32x32 x 16 frames box
LoadSDBank("circle-16x16.nxt",0,0,0,34)    ' load in 32x32 x 16 frames circle

dim n       as ubyte 
dim n1      as ubyte 
dim t       as ubyte 
dim t1      as ubyte 
dim t2      as ubyte 
dim y       as ubyte 
dim xoff    as ubyte = 64
dim card    as ubyte 

Cls256(0)

do 
    if t = 0 
        t = 3
        
        x = peek(@sin_table+cast(ubyte,t1)+xoff)<<1
        y = peek(@sin_table+cast(ubyte,t1))<<1
        
        DrawImage(48+x,24+y,@image_circle, n,0)
        
        DrawImage(0,0,@image_box, n1)        
        DrawImage(0,160,@image_box, n1)        
        DrawImage(224,160,@image_box, n1)        
        DrawImage(224,0,@image_box, n1)

        n1 = (n1 + 1) mod 15 

    else 
        t = t - 1
    endif 
    if t2 = 0 
        t2 = 9 
        xoff =( xoff + 1)
        n = (n + 1) mod 15 
    else 
        t2 = t2 - 1
    endif 
    t1 = t1 + 1 
    WaitRetrace2(192)
    
loop 


' DrawImage requires MUL16 lib, so we need to make Boriel include it!

dim bo   as uinteger = 0 
border 1563*bo

image_box:
    asm
        ; bank  spare  
        db  32, 32, 32
        ; offset in bank  
        dw 0
    end asm 
    
image_circle:
    asm
        ; bank  spare  
        db  34, 32, 32
        ; offset in bank  
        dw 00
    end asm   

sin_table:
asm 
    db $20,$1F,$1E,$1D,$1C,$1C,$1B,$1A,$19,$18,$18,$17,$16,$15,$15,$14
    db $13,$12,$12,$11,$10,$10,$F,$E,$E,$D,$C,$C,$B,$B,$A,$9
    db $9,$8,$8,$7,$7,$6,$6,$5,$5,$4,$4,$4,$3,$3,$3,$2
    db $2,$2,$1,$1,$1,$1,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0
    db $0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$1,$1,$1,$1,$1,$2
    db $2,$2,$3,$3,$3,$4,$4,$5,$5,$5,$6,$6,$7,$7,$8,$9
    db $9,$A,$A,$B,$B,$C,$D,$D,$E,$F,$F,$10,$11,$11,$12,$13
    db $14,$14,$15,$16,$17,$17,$18,$19,$1A,$1A,$1B,$1C,$1D,$1E,$1E,$1F
    db $20,$21,$21,$22,$23,$24,$25,$25,$26,$27,$28,$28,$29,$2A,$2B,$2B
    db $2C,$2D,$2E,$2E,$2F,$30,$30,$31,$32,$32,$33,$34,$34,$35,$35,$36
    db $36,$37,$38,$38,$39,$39,$3A,$3A,$3A,$3B,$3B,$3C,$3C,$3C,$3D,$3D
    db $3D,$3E,$3E,$3E,$3E,$3E,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F
    db $3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3E,$3E,$3E,$3E,$3D,$3D
    db $3D,$3C,$3C,$3C,$3B,$3B,$3B,$3A,$3A,$39,$39,$38,$38,$37,$37,$36
    db $36,$35,$34,$34,$33,$33,$32,$31,$31,$30,$2F,$2F,$2E,$2D,$2D,$2C
    db $2B,$2A,$2A,$29,$28,$27,$27,$26,$25,$24,$23,$23,$22,$21,$20,$20
    db $20,$1F,$1E,$1D,$1C,$1C,$1B,$1A,$19,$18,$18,$17,$16,$15,$15,$14
    db $13,$12,$12,$11,$10,$10,$F,$E,$E,$D,$C,$C,$B,$B,$A,$9
    db $9,$8,$8,$7,$7,$6,$6,$5,$5,$4,$4,$4,$3,$3,$3,$2
    db $2,$2,$1,$1,$1,$1,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0
    db $0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$1,$1,$1,$1,$1,$2
    db $2,$2,$3,$3,$3,$4,$4,$5,$5,$5,$6,$6,$7,$7,$8,$9
    db $9,$A,$A,$B,$B,$C,$D,$D,$E,$F,$F,$10,$11,$11,$12,$13
    db $14,$14,$15,$16,$17,$17,$18,$19,$1A,$1A,$1B,$1C,$1D,$1E,$1E,$1F
    db $20,$21,$21,$22,$23,$24,$25,$25,$26,$27,$28,$28,$29,$2A,$2B,$2B
    db $2C,$2D,$2E,$2E,$2F,$30,$30,$31,$32,$32,$33,$34,$34,$35,$35,$36
    db $36,$37,$38,$38,$39,$39,$3A,$3A,$3A,$3B,$3B,$3C,$3C,$3C,$3D,$3D
    db $3D,$3E,$3E,$3E,$3E,$3E,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F
    db $3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3F,$3E,$3E,$3E,$3E,$3D,$3D
    db $3D,$3C,$3C,$3C,$3B,$3B,$3B,$3A,$3A,$39,$39,$38,$38,$37,$37,$36
    db $36,$35,$34,$34,$33,$33,$32,$31,$31,$30,$2F,$2F,$2E,$2D,$2D,$2C
    db $2B,$2A,$2A,$29,$28,$27,$27,$26,$25,$24,$23,$23,$22,$21,$20,$20

end asm 