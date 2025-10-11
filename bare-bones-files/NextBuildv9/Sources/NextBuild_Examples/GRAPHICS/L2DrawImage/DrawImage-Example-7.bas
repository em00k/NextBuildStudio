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

'LoadSDBank("rotate32x32.nxt",0,0,0,34)    ' load in 32x32 x 16 frames circle
LoadSDBank("band32x8.nxt",0,0,0,34)    ' load in 32x32 x 16 frames circle

dim n       as ubyte 
dim v       as ubyte 
dim m       as ubyte 
dim t       as ubyte 
dim t1      as ubyte 
dim count   as ubyte 
dim count2  as ubyte 
dim ca       as ubyte  = 1

dim cb       as ubyte  = 0
dim b       as ubyte
dim k       as string 
dim keydown as ubyte 

Cls256(0)

do 
    ' print at 0,0;ca
    ' print cb
    if t = 0 
        t = 2

        for y = 0 to 42
            DrawImage(100,y<<2,@image_band, v)
            m = peek(@sin_table + 64+cast(ubyte,count ) )>>1
            n = peek(@sin_table + cast(ubyte,count2) )
            v = ((m + n ) <<1) mod 31
            count = (count + ca ) 
            count2 = (count2 + cb)
        next y 
    else 
        t = t - 1
    endif 
    
    if t2 = 0  
        count = (count +ca)
        count2 = count2 + 1
        t2 = 0
    else 
        t2 = t2 - 1
    endif 

    k = inkey 
    
    if keydown = 0 
        if k = "p" 
            ca = ca + 1 
            keydown = 1
        elseif k = "o" 
            cb = cb + 1 
            keydown = 1
        endif 
    elseif k = "" 
        keydown = 0 
    endif 

    WaitRetrace2(192)
    
loop 


' DrawImage requires MUL16 lib, so we need to make Boriel include it!

dim bo   as uinteger = 0 
border 1563*bo

image_band:
    asm
        ; bank  spare  
        db  34, 32, 4
        ; offset in bank  
        dw 0
    end asm 


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

sin_table:
asm 

    db $0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$1,$1,$1,$1,$2
    db $2,$2,$2,$3,$3,$3,$4,$4,$4,$5,$5,$6,$6,$6,$7,$7
    db $8,$8,$8,$9,$9,$9,$A,$A,$B,$B,$B,$C,$C,$C,$D,$D
    db $D,$D,$E,$E,$E,$E,$F,$F,$F,$F,$F,$F,$F,$F,$F,$F
    db $F,$F,$F,$F,$F,$F,$F,$F,$F,$F,$F,$E,$E,$E,$E,$D
    db $D,$D,$C,$C,$C,$C,$B,$B,$A,$A,$A,$9,$9,$9,$8,$8
    db $7,$7,$7,$6,$6,$5,$5,$5,$4,$4,$4,$3,$3,$3,$2,$2
    db $2,$1,$1,$1,$1,$1,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0
    db $0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$1,$1,$1,$1,$1,$2
    db $2,$2,$3,$3,$3,$4,$4,$4,$5,$5,$5,$6,$6,$7,$7,$7
    db $8,$8,$9,$9,$9,$A,$A,$A,$B,$B,$B,$C,$C,$C,$D,$D
    db $D,$E,$E,$E,$E,$F,$F,$F,$F,$F,$F,$F,$F,$F,$F,$F
    db $F,$F,$F,$F,$F,$F,$F,$F,$F,$F,$E,$E,$E,$E,$D,$D
    db $D,$D,$C,$C,$C,$B,$B,$B,$A,$A,$9,$9,$9,$8,$8,$8
    db $7,$7,$6,$6,$6,$5,$5,$4,$4,$4,$3,$3,$3,$2,$2,$2
    db $2,$1,$1,$1,$1,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0
    db $0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$1,$1,$1,$1,$2
    db $2,$2,$2,$3,$3,$3,$4,$4,$4,$5,$5,$6,$6,$6,$7,$7
    db $8,$8,$8,$9,$9,$9,$A,$A,$B,$B,$B,$C,$C,$C,$D,$D
    db $D,$D,$E,$E,$E,$E,$F,$F,$F,$F,$F,$F,$F,$F,$F,$F
    db $F,$F,$F,$F,$F,$F,$F,$F,$F,$F,$F,$E,$E,$E,$E,$D
    db $D,$D,$C,$C,$C,$C,$B,$B,$A,$A,$A,$9,$9,$9,$8,$8
    db $7,$7,$7,$6,$6,$5,$5,$5,$4,$4,$4,$3,$3,$3,$2,$2
    db $2,$1,$1,$1,$1,$1,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0
    db $0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$1,$1,$1,$1,$1,$2
    db $2,$2,$3,$3,$3,$4,$4,$4,$5,$5,$5,$6,$6,$7,$7,$7
    db $8,$8,$9,$9,$9,$A,$A,$A,$B,$B,$B,$C,$C,$C,$D,$D
    db $D,$E,$E,$E,$E,$F,$F,$F,$F,$F,$F,$F,$F,$F,$F,$F
    db $F,$F,$F,$F,$F,$F,$F,$F,$F,$F,$E,$E,$E,$E,$D,$D
    db $D,$D,$C,$C,$C,$B,$B,$B,$A,$A,$9,$9,$9,$8,$8,$8
    db $7,$7,$6,$6,$6,$5,$5,$4,$4,$4,$3,$3,$3,$2,$2,$2
    db $2,$1,$1,$1,$1,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0,$0

end asm 

delay_table:
asm 

    db 0,1,2,3,4,5,6,7,7,6,5,4,3,2,1,0
    db 0,1,2,3,4,5,6,7,7,6,5,4,3,2,1,0

end asm 