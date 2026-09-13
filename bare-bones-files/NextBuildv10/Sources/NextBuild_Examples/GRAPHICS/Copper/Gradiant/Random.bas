'!org=32768
' demo of the improved PRNG with a function

#define NEX 
#include <nextlib.bas>

' we need to declare the Random() function before we use it
declare function Random() as ubyte

asm 
    nextreg TURBO_CONTROL_NR_07, 3          ; enable turbo mode
    nextreg SPRITE_CONTROL_NR_15,%00010000  ; USL ordering 
    nextreg DISPLAY_CONTROL_NR_69,1<<7      ; enable Layer 2 256x192
    nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0 ; set transparent color to black
    nextreg GLOBAL_TRANSPARENCY_NR_14,0     ; set global transparency to black
end asm 

paper 0 : ink 2 : cls 

Cls256(0)

dim t as uinteger
dim x as uinteger
dim s$ as string = "Press any key to continue"

' main loop 

do 

    Print paper 6;"original ROM RND 10000 pixels"
    Print paper 6;s$
    WaitKey() : cls 

    ' original ROM RND Plot
    for t = 0 to 10000
        PlotL2(rnd*255,rnd*191,rnd*255)
    next t 

    Print paper 6;s$

    WaitKey() : cls : Cls256(0)

    Print paper 6;"improved PRNG 10000 pixels" 
    Print paper 6;s$

    WaitKey() : cls 
    
    ' improved PRNG Plot function 
    for t = 0 to 10000
        PlotL2(Random(),(Random() and 191),Random())
    next t 

    Print paper 6;s$

    WaitKey() : cls : Cls256(0)
loop 

function fastcall Random() as ubyte
    asm  
        ; orignal PRNG by Patrik Rak
        ; no need for input parameters
        ; returns a random number between 0 and 255

        call    prnd        
        ld      c,a
        ld      b,0
        ret

prnd:   ld      hl,0xA280   ; yw -> zt
        ld      de,0xC0DE   ; xz -> yw
        ld      (prnd+4),hl ; x = y, z = w
        ld      a,l         ; w = w ^ ( w << 3 )
        add     a,a
        add     a,a
        add     a,a
        xor     l
        ld      l,a
        ld      a,d         ; t = x ^ (x << 1)
        add     a,a
        xor     d
        ld      h,a
        rra                 ; t = t ^ (t >> 1) ^ w
        xor     h
        xor     l
        ld      h,e         ; y = z
        ld      l,a         ; w = t
        ld      (prnd+1),hl
        ret 
    end asm 
end function


