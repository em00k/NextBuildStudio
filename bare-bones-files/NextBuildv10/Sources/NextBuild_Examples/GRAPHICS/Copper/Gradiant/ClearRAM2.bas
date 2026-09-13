'!org=32768

#define NEX 
#include <nextlib.bas>
#include <keys.bas>
#include <hex.bas> 

declare function CheckCollision(obj1X as ubyte, obj1Y as ubyte, obj1Width as ubyte, obj1Height as ubyte, obj2X as ubyte, obj2Y as ubyte, obj2Width as ubyte, obj2Height as ubyte) as ubyte
declare function CheckCollision2(obj1X as ubyte, obj1Y as ubyte, obj1Width as ubyte, obj1Height as ubyte, obj2X as ubyte, obj2Y as ubyte, obj2Width as ubyte, obj2Height as ubyte) as ubyte
declare function GetTimer() as ulong
declare function Random() as ubyte
asm 
    nextreg TURBO_CONTROL_NR_07, 3
    nextreg SPRITE_CONTROL_NR_15,%00010000
    nextreg DISPLAY_CONTROL_NR_69,1<<7
    nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0
    nextreg GLOBAL_TRANSPARENCY_NR_14,0
    ei
end asm 

paper 0 : ink 7 : cls 

Cls256(0)
' main loop 
dim obj1X as ubyte
dim obj1Y as ubyte
dim obj2X as ubyte
dim obj2Y as ubyte
dim threshold as ubyte
dim collision_flag as ubyte
dim obj1Width as ubyte = 5
dim obj1Height as ubyte = 5
dim obj2Width as ubyte = 15  ' Different size for second object
dim obj2Height as ubyte = 15

dim start_time as ulong
dim end_time as ulong
dim t as uinteger
dim x as uinteger

obj1X = $DE
obj1Y = $AD
obj2X = $CA
obj2Y = $FE
threshold = $05
Print "TEST"

do 
    'WaitRetrace2(192)
    border 2
    POKE 23672,0
    POKE 23673,0 ' reset timer
    for x = 0 to 3
        print at 0,0;"Countdown: ";3-x
        WaitRetrace(500)
    next x
    for t = 0 to 10000
        PlotL2(Random(),Random() and 191,255)
        ' PlotL2(rnd*255,rnd*191,255)
    next t 
    border 0
    asm : di : end asm
    Cls256(0)
    WaitKey()
loop 

do 
    CheckKeys()
    WaitRetrace2(192)
loop 

sub UpdateBoxes()
    dim asm_result as ubyte
    dim basic_result as ubyte
    dim start_time as ulong
    dim asm_time, basic_time as ulong
    
    ' Clear the screen first
    Cls256(0)
    
    ' Draw the boxes with their respective sizes
    drawOutlineBox(obj1X, obj1Y, obj1Width, obj1Height, 255)
    drawOutlineBox(obj2X, obj2Y, obj2Width, obj2Height, 170)
    
    WaitRetrace2(32)

    ' Time the assembly version
    start_time = GetTimer()
    print at 10,0;Hex16(@asm_result)
    border 2
    for i = 1 to 64
         
        asm_result = CheckCollision(obj1X, obj1Y, obj1Width, obj1Height, obj2X, obj2Y, obj2Width, obj2Height)
        
    next i
    border 0
    asm_time = GetTimer() - start_time
    
    ' Time the BASIC version
    start_time = GetTimer()
    border 4    
    
    for i = 1 to 64
        basic_result = CheckCollision2(obj1X, obj1Y, obj1Width, obj1Height, obj2X, obj2Y, obj2Width, obj2Height)
    next i
    border 0
    basic_time = GetTimer() - start_time
    
    ' Display results
    print at 0,0;"ASM: ";asm_result;" Time: ";asm_time
    print at 1,0;"BAS: ";basic_result;" Time: ";basic_time
    
    ' Show the difference as a multiplier
    if asm_time > 0 then
        print at 2,0;"BASIC is ";basic_time/asm_time;" times slower"
    end if
    
    ' Show box positions and sizes
    print at 4,0;"Box1: ";obj1X;",";obj1Y;" Size: ";obj1Width;"x";obj1Height
    print at 5,0;"Box2: ";obj2X;",";obj2Y;" Size: ";obj2Width;"x";obj2Height
end sub

sub CheckKeys()
    dim update as ubyte
    if GetKeyScanCode()=KEYQ then obj1Y = obj1Y - 1 : update = 1 
    if GetKeyScanCode()=KEYA then obj1Y = obj1Y + 1 : update = 1 
    if GetKeyScanCode()=KEYO then obj1X = obj1X - 1 : update = 1 
    if GetKeyScanCode()=KEYP then obj1X = obj1X + 1 : update = 1 
    if update then UpdateBoxes()
end sub

sub drawOutlineBox(x as ubyte, y as ubyte, width as ubyte, height as ubyte, color as ubyte)
    dim i,j as ubyte 
    for i = x to x + width
        PlotL2(i,y,color)
        PlotL2(i,y+height,color)
    next i
    for j = y to y + height
        PlotL2(x,j,color)
        PlotL2(x+width,j,color)
    next j
end sub

do 
    WaitRetrace2(32)
    border 2
    ClearRam(16384,512)
    border 4
    ClearRam2(16384,512)
    border 0
loop

sub ClearRam(memory as uinteger, size as uinteger)
    ' Clear a block of memory
    dim i as uinteger
    for i = memory to memory + size - 1
        poke i, 0
    next i
end sub

function GetTimer() as ulong  
    return ((PEEK 23674)<<16) + ((PEEK 23673)<<8)+ PEEK 23672
end function

sub ClearRam2(memory as uinteger, size as uinteger)
    ' Clear a block of memory in assembly
    ' on entry IX+n will point to the memory address and size
    asm 
        ld      h, (ix+5)       ; IX+4, IX+5 = memory address   
        ld      l, (ix+4)
        ld      b, (ix+7)       ; IX+6, IX+7 = size
        ld      c, (ix+6)
        dec     bc              ; decrement BC to size - 1
        push    hl              ; save memory address on stack
        pop     de              ; pop into DE
        inc     de              ; increment DE
        ld      (hl), 0         ; clear memory
        ldir                    ; loop until BC = 0
    end asm
end sub

function fastcall CheckCollision(obj1X as ubyte, obj1Y as ubyte, obj1Width as ubyte, obj1Height as ubyte, obj2X as ubyte, obj2Y as ubyte, obj2Width as ubyte, obj2Height as ubyte) as ubyte
    asm 
        ; Inputs from STACK+n, but we'll load them all at once for efficiency
                 ; push ix
        BREAK 
        ; Pop all parameters from stack into registers
        ; Stack layout (top to bottom):
        ; Return address (2 bytes)
        ; obj2Height
        ; obj2Width
        ; obj2Y
        ; obj2X
        ; obj1Height
        ; obj1Width
        ; obj1Y
        ; obj1X
        ld (ix_out+2), ix   ; store ix in ix_out+2
        pop ix              ; Get return address into IX
        
        ; Now pop all parameters
        pop bc          ; B = obj2Height
        pop de          ; D = obj2Width
        pop hl          ; H = obj2Y
        exx             ; Switch to alternate register set
        pop bc          ; B' = obj2X
        pop de          ; D' = obj1Height
        pop hl          ; H' = obj1Width
        exx             ; Switch back to main register set
        pop bc          ; B = obj1Y
        pop de          ; D = obj1X
        
        ; Now we have:
        ; D = obj1X
        ; B = obj1Y
        ; H' = obj1Width
        ; D' = obj1Height
        ; B' = obj2X
        ; H = obj2Y
        ; D = obj2Width
        ; B = obj2Height
        
        ; Check X-axis: if (obj1X + obj1Width <= obj2X) or (obj2X + obj2Width <= obj1X) then no collision
        
        ; First check: obj1X + obj1Width <= obj2X
        ld a, d         ; A = obj1X
        exx
        add a, h        ; A = obj1X + obj1Width
        cp b            ; Compare with obj2X
        exx
        jr c, .no_collision ; If obj1X + obj1Width < obj2X, no collision
        
        ; Second check: obj2X + obj2Width <= obj1X
        exx
        ld a, b         ; A = obj2X
        add a, d        ; A = obj2X + obj2Width
        exx
        cp d            ; Compare with obj1X
        jr c, .no_collision ; If obj2X + obj2Width < obj1X, no collision
        
        ; Check Y-axis: if (obj1Y + obj1Height <= obj2Y) or (obj2Y + obj2Height <= obj1Y) then no collision
        
        ; First check: obj1Y + obj1Height <= obj2Y
        ld a, b         ; A = obj1Y
        exx
        add a, d        ; A = obj1Y + obj1Height
        exx
        cp h            ; Compare with obj2Y
        jr c, .no_collision ; If obj1Y + obj1Height < obj2Y, no collision
        
        ; Second check: obj2Y + obj2Height <= obj1Y
        ld a, h         ; A = obj2Y
        add a, b        ; A = obj2Y + obj2Height
        cp b            ; Compare with obj1Y
        jr c, .no_collision ; If obj2Y + obj2Height < obj1Y, no collision
        
        ; Collision detected
        ld a, $ff       ; Set collision flag to $FF
        jr .collision_end
        
    .no_collision:
        xor a           ; Set A to 0 (no collision)
        
    .collision_end:
        ; Restore IX and push return address back
        push ix
        push ix
        ;pop hl          ; Return address now in HL
        ;pop ix          ; Restore original IX
        ;push hl         ; Put return address back on stack
        
        ld (._collision_flag), a
    ix_out:
        ld ix, 0
    end asm 
    return collision_flag
end function

function CheckCollision2(obj1X as ubyte, obj1Y as ubyte, obj1Width as ubyte, obj1Height as ubyte, obj2X as ubyte, obj2Y as ubyte, obj2Width as ubyte, obj2Height as ubyte) as ubyte
    ' High-level BASIC implementation of collision detection for different sized objects
    
    ' Check if there is NO collision using AABB method
    ' No collision if:
    ' - obj1's right edge is to the left of obj2's left edge, OR
    ' - obj1's left edge is to the right of obj2's right edge, OR
    ' - obj1's bottom edge is above obj2's top edge, OR
    ' - obj1's top edge is below obj2's bottom edge
    if (obj1X + obj1Width < obj2X) or (obj1X > obj2X + obj2Width) or _
       (obj1Y + obj1Height < obj2Y) or (obj1Y > obj2Y + obj2Height) then
        return 0    ' No collision
    else
        return 255  ' Collision detected ($FF)
    end if
end function

function fastcall Random() as ubyte
    asm  
        call rnd        ; BASIC driver
        ld   c,a
        ld   b,0
        ret

rnd:    ld  hl,0xA280   ; yw -> zt
        ld  de,0xC0DE   ; xz -> yw
        ld  (rnd+4),hl  ; x = y, z = w
        ld  a,l         ; w = w ^ ( w << 3 )
        add a,a
        add a,a
        add a,a
        xor l
        ld  l,a
        ld  a,d         ; t = x ^ (x << 1)
        add a,a
        xor d
        ld  h,a
        rra             ; t = t ^ (t >> 1) ^ w
        xor h
        xor l
        ld  h,e         ; y = z
        ld  l,a         ; w = t
        ld  (rnd+1),hl
        ret 
    end asm 
end function


