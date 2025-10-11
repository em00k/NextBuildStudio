' Rotate, Mirror, Scaling, Big Sprites example
' NextBuild (ZXB/CSpect)
' emk2021 / David Saphier

#include <nextlib.bas>                      ' include the nextlib 

paper 0: border 0 : bright 0: ink 7 : cls   ' paint it black 


' for this example we will just include the sprite in a data block call Sprite. 
' We can then use InitSprite(number of sprites to upload to sprite ram,address)
' using @Sprites will return the addres of the Sprites: asm block below. 
CONST sprX2 as ubyte =%01000                 ' constants for attrib 4 of base sprite 
CONST sprX4 as ubyte =%10000  
CONST sprX8 as ubyte =%11000
CONST sprY2 as ubyte =%00010
CONST sprY4 as ubyte =%00100
CONST sprY8 as ubyte =%00110

asm  
    NextReg TURBO_CONTROL_NR_07,3 					; 28mhz  
    NextReg SPRITE_CONTROL_NR_15,%00001011                       ; ' SPRITE_CONTROL_NR_15 - Enable sprite visibility & Sprite ULA L2 order 
end asm 
InitSprites(3,@Sprites)                 ' upload 3 sprites     


ShowLayer2(1)                           ' Turn on Layer 2 

' cls : print "Sprite scaling, mirror & rotate" : print "composite and big sprite example"
' print "Press any key to start"

' WaitKey() : WaitRetrace2(100) : cls 
dim a, r,bb as ubyte
dim x,y as uinteger
x=140
y=128 
bb = 0
UpdateSprite(x,cast(ubyte,y),0,0,0,0)

do
    WaitRetrace2(1)
    
    border 2
    for ang = 0 to 240 step 6
    
    position(cast(ubyte,ang)+a ,bb,120,120)
    UpdateSprite(x,cast(ubyte,y),ang,2,0,sprX2 + sprY2)

    'position(240-cast(ubyte,a)+ang ,ang,120,120)
    'UpdateSprite(x,cast(ubyte,y),ang+64,1,0,sprX2 + sprY2)
    next 
    border 0 
    a=a+1
    bb=bb+1
loop  


sub position(angle as ubyte, radius as ubyte, x as uinteger, y as uinteger) 
    asm
        ;  ----------------------------------------------------------------------
        ;  position on the edge of a circle
        ;  original code Patricia Curtis, modified to work with ZXBC
        ;  input    a,angle
        ;  input    h,radius
        ;  input    bc y center of the circle
        ;  input    de x center of the circle
        ;  output    bc x position on the circle
        ;  output    de y position on the circle
        ; 
        ;  dirty everything
        ; ----------------------------------------------------------------------
        ; a = angle 
        ;BREAK 

        ld h,a 
        ld a,(ix+7)         ; radius 
        ld (radius),a 
        ld a,h

        ld b,(ix+11)
        ld c,(ix+10)         ; x 
        ld d,(ix+9)
        ld e,(ix+8)        ; y 

        call posOnCircle
        ;ld a,c 
        ld (._x),bc
        ;ld a,e  
        ld (._y),de 
        jp posOnCircleEnd

        posOnCircle:  
            cp  64              ;  ae we less than 64
            jp  m,jumpparta        ;  yes but for some reason its not right so we will need another check
            cp  128             ;  are we between 64 and 128
            jp  m,jumppartb      ;  yup
            cp  192             ;  are we between 128 and 192
            jp  m,jumppartc     ;  yarp so do that code
            ret
        jumppartd:  
            push  bc            ;  save the x center
            sub  192            ;  take off 192 making it 0-64
            ld  b,a             ;  now reverse the angle 
            ld  a,64            ;  making it
            sub  b              ;  64-0
            push  de            ;  save the y center  
            call  getSinCos     ;  get the cos and sin for this angle
            pop  hl             ;  get the y center  
            ; sub  hl,bc          ;  take y center from the cos result  
            or a : sbc hl,bc
            ; ld  bc,hl           ;  and stick it in y return pos
            ld b,h : ld c,l
            pop  hl             ;  now get the x center
            add  hl,de          ;  add the sin result 
           ; ld  de,hl           ;  stick it in the x return pos
            ld d,h : ld e,l 
            ret                 ;  and return
        jumppartc:  
            sub  128  
            push  bc    
            push  de        
            call  getSinCos      ;  get the cos and sin for this angle
            pop  hl             ;  get the y center
            ; sub  hl,bc          ;  take y center from the cos result  
            or a : sbc hl,bc
            ; ld  bc,hl           ;  and stick it in y return pos
            ld b,h : ld c,l
            pop  hl             ;  now get the x center
            ; sub  hl,de          ;  take off the sin result 
            or a : sbc hl,de
            ; ld  de,hl           ;  stick it in the x return pos
            ld d,h : ld e,l 
            ret  
        jumppartb:    
            push  bc
            sub  64
            ld  b,a
            ld  a,64
            sub  b  
            push  de        
            call  getSinCos     ;  get the cos and sin for this angle
            pop  hl             ;  get the y center  
            add  hl,bc          ;  add y center to the cos result  
            ; ld  bc,hl           ;  and stick it in y return pos
            ld b,h : ld c,l
            pop  hl             ;  now get the x center
            ; sub  hl,de          ;  take off the sin result  
            or a : sbc hl,de
            ; ld  de,hl           ;  stick it in the x return pos
            ld d,h : ld e,l 
            ret  
        jumpparta:    
            bit  7,a            ;  test to see if its negative by bit testing bit 7
            jp  nz,jumppartd  
            push  bc    
            push  de        
            call  getSinCos     ;  get the cos and sin for this angle
            pop  hl             ;  get the y center    
            add  hl,bc          ;  add y center to the cos result
            ; ld  bc,hl           ;  and stick it in y return pos
            ld b,h : ld c,l
            pop  hl             ;  now get the x center
            add  hl,de          ;  add the sin result   
            ; ld  de,hl           ;  stick it in the x return pos
            ld d,h : ld e,l 
            ret
        ; ----------------------------------------------------------------------
        ;  calculate the x y pos
        ; ----------------------------------------------------------------------
        getSinCos:  
            call  sinp           ;  get the sin(angle) in e
            ld  hl,radius    
            ld  d,(hl)          ;   radius
            mul  d,e            ;  multiply sin by the radius    
            ld  b,6             ;  2.6 fixed point 
            bsrf  de,b          ;  do down shift the result
            push  de            ;  save x pos
            call  cosp           ;  get the cos(angle) in e
            ld  hl,radius    
            ld  d,(hl)          ;  radius
            mul  d,e            ;  multiply sin by the radius    
            ld  b,6             ;  2.6 fixed point 
            bsrf  de,b          ;   do down shift the result
            pop  bc             ;  get the x pos
            ret  
    
    radius:    db  3

    posOnCircleEnd:
    end asm
end sub 




Sprites:
asm 
Plane1:
	db  $E3, $E3, $E3, $E3, $E3, $00, $92, $B6, $B6, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $92, $92, $FF, $FF, $B6, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $92, $B6, $B6, $FF, $B6, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $00, $00, $00, $00, $92, $BB, $12, $BB, $B6, $00, $00, $00, $00, $E3, $E3;
	db  $00, $92, $92, $92, $92, $92, $12, $12, $12, $DA, $B6, $B6, $B6, $B6, $00, $E3;
	db  $92, $92, $B6, $B6, $6D, $92, $B6, $B6, $FF, $DA, $B6, $B6, $FF, $FF, $B6, $00;
	db  $92, $B6, $B6, $B6, $6D, $92, $B6, $B6, $FF, $DA, $B6, $B6, $B6, $B6, $92, $00;
	db  $00, $92, $B6, $B6, $6D, $92, $B6, $B6, $FF, $DA, $B6, $92, $92, $92, $00, $E3;
	db  $E3, $00, $00, $00, $92, $92, $B6, $B6, $B6, $92, $92, $00, $00, $00, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $6D, $92, $BB, $B6, $6D, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $00, $92, $B6, $B6, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $00, $00, $92, $00, $00, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $92, $B6, $6D, $B6, $B6, $B6, $B6, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $00, $92, $92, $B6, $6D, $B6, $B6, $B6, $B6, $B6, $00, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $00, $00, $92, $92, $B6, $00, $00, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $00, $92, $00, $E3, $E3, $E3, $E3, $E3, $E3, $E3;



Plane2:
	db  $E3, $E3, $E3, $E3, $E3, $00, $80, $A0, $A0, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $80, $80, $FF, $A0, $60, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $80, $B6, $B6, $FF, $60, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $00, $00, $00, $00, $80, $BB, $12, $BB, $60, $00, $00, $00, $00, $E3, $E3;
	db  $00, $80, $80, $80, $80, $80, $12, $12, $12, $80, $A0, $A0, $A0, $A0, $00, $E3;
	db  $80, $80, $A0, $A0, $60, $80, $A0, $A0, $C0, $80, $A0, $A0, $FF, $FF, $A0, $00;
	db  $80, $A0, $A0, $A0, $60, $80, $A0, $A0, $C0, $80, $A0, $A0, $A0, $A0, $80, $00;
	db  $00, $80, $A0, $A0, $60, $80, $A0, $A0, $C0, $80, $A0, $80, $80, $80, $00, $E3;
	db  $E3, $00, $00, $00, $80, $80, $A0, $A0, $A0, $80, $80, $00, $00, $00, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $60, $80, $BB, $A0, $60, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $00, $80, $A0, $A0, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $00, $00, $80, $00, $00, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $80, $A0, $60, $A0, $A0, $A0, $A0, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $00, $80, $80, $A0, $60, $A0, $A0, $A0, $A0, $A0, $00, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $00, $00, $80, $80, $A0, $00, $00, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $00, $80, $00, $E3, $E3, $E3, $E3, $E3, $E3, $E3;



Plane3:
	db  $E3, $E3, $E3, $E3, $E3, $00, $90, $0C, $10, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $90, $90, $FF, $10, $10, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $90, $B6, $B6, $FF, $10, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $00, $00, $00, $00, $90, $BB, $12, $BB, $10, $00, $00, $00, $00, $E3, $E3;
	db  $00, $90, $90, $90, $90, $90, $12, $12, $12, $08, $18, $18, $18, $18, $00, $E3;
	db  $90, $C2, $C2, $D8, $90, $90, $D8, $10, $1C, $08, $18, $18, $E0, $E0, $10, $00;
	db  $90, $61, $61, $D8, $90, $90, $D8, $1C, $1C, $08, $18, $18, $80, $80, $08, $00;
	db  $00, $48, $D8, $D8, $90, $90, $D8, $10, $1C, $08, $18, $08, $08, $08, $00, $E3;
	db  $E3, $00, $00, $00, $90, $90, $D8, $1C, $18, $08, $08, $00, $00, $00, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $90, $90, $BB, $18, $10, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $00, $90, $18, $18, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $00, $00, $48, $00, $00, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $90, $D8, $90, $D8, $18, $18, $18, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $00, $90, $90, $D8, $90, $D8, $18, $18, $18, $18, $00, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $00, $00, $48, $48, $18, $00, $00, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $00, $0C, $00, $E3, $E3, $E3, $E3, $E3, $E3, $E3;
end asm 

asm 
ALIGN 256
    sinTable:  
        db  $00,$02,$03,$05,$06,$08,$09,$0b,$0c,$0e
        db  $10,$11,$13,$14,$16,$17,$18,$1a,$1b,$1d
        db  $1e,$20,$21,$22,$24,$25,$26,$27,$29,$2a
        db  $2b,$2c,$2d,$2e,$2f,$30,$31,$32,$33,$34
        db  $35,$36,$37,$38,$38,$39,$3a,$3b,$3b,$3c
        db  $3c,$3d,$3d,$3e,$3e,$3e,$3f,$3f,$3f,$40
        db  $40,$40,$40,$40,$40
    cosTable:   
        db  $40,$40,$40,$40,$40,$40,$3f,$3f,$3f,$3e
        db  $3e,$3e,$3d,$3d,$3c,$3c,$3b,$3b,$3a,$39
        db  $38,$38,$37,$36,$35,$34,$33,$32,$31,$30
        db  $2f,$2e,$2d,$2c,$2b,$2a,$29,$27,$26,$25
        db  $24,$22,$21,$20,$1e,$1d,$1b,$1a,$18,$17
        db  $16,$14,$13,$11,$10,$0e,$0c,$0b,$09,$08
        db  $06,$05,$03,$02,$02
    ; ----------------------------------------------------------------------
    ;  sin  function
    ; 
    ;  in  a   degrees
    ; 
    ;  out  e   contains the sine 2.6 format
    ; 
    ;  dirty  hl,de
    ; ----------------------------------------------------------------------
    sinp:    
       ; ld  h,0      ;  ;  clear the high part of hl
       ; ld  l,a      ;  ;  move the angle into the low part of hl
        ld      hl,sinTable    ;  ;  get the base of the sin table
       ; add  hl,de      ;  ;  add the angle to the base to get the index into the sin Table
        add     hl, a 
        ld      e,(hl)      ;  ;  get the SIN
        ret           ; ;  e contains the sine in 2.6 format
    ; ----------------------------------------------------------------------
    ;  cosine function
    ;  in  a  degrees
    ; 
    ;  out  e   contains the cosine 2.6 format
    ; 
    ;  dirty  hl,de
    ; ----------------------------------------------------------------------
    cosp:    
        ; ld  h,0       ; ;  clear the high part of hl
        ; ld  l,a        ; ;  move the angle into the low part of hl
        ld      hl, cosTable      ; ;  get the base of the cos table
        add     hl, a 
        ld      e,(hl)       ; ;  get the COS
        ret          ; ;  e contains the sine in 2.6 format
end asm 