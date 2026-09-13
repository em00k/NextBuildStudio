'!org=32768
'ClearRam.bas 

#define NEX 
#include <nextlib.bas>
asm 
    nextreg TURBO_CONTROL_NR_07, 3
end asm 

paper 7 : ink 0 : cls 

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
