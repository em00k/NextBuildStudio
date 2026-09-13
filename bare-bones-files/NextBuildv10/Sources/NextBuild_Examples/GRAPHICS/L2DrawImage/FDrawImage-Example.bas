'!org=24576
' NextBuild Layer2 Template 
' NOTE: FDrawImage needs COLUMN MAJOR image data, see the sub at the bottom

#define NEX 
#define IM2 

#include <nextlib.bas>

asm 
    ; setting registers in an asm block means you can use the global equs for register names 
    ; 28mhz, black transparency,sprites on over border,320x256
    nextreg TURBO_CONTROL_NR_07,%11         ; 28 mhz 
    nextreg GLOBAL_TRANSPARENCY_NR_14,$0    ; black 
    nextreg SPRITE_CONTROL_NR_15,%00000011  ; %000    S L U, %11 sprites on over border
    nextreg LAYER2_CONTROL_NR_70,%00010000  ; 5-4 %01 = 320x256x8bpp
    di
end asm 

LoadSDBank("pirate-win.raw",0,0,0,32)       ' load in pirate 1
LoadSDBank("pirate-loss-64x64.nxi",4096,0,0,32)   ' load in pirate 2
'LoadSDBank("pirate-loss.raw",0,0,0,33)
LoadSDBank("2frame_128x128.raw",0,0,0,62)
LoadSDBank("robo2.nxt",0,0,0,36)
LoadSDBank("flags16x16.raw",0,0,0,42)
LoadSDBank("sprite_sheet.nxt",0,0,0,44)

InitLayer2(MODE320X256)

do 

    FDrawImage(0,0,@image_128,0)             ' colour wheel 1
    WaitKey()
    FDrawImage(10,10,@image_128,1)           ' zx next test 
    WaitKey()
    FDrawImage(40,50,@image_128,2)           ' parrot
    WaitKey()
    FDrawImage(80,100,@image_128,3)         ' colour wheel 2, transparancy on colour 0
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

sub FDrawImage(xpos as uinteger, ypos as ubyte, img_data as uinteger, frame as ubyte = 0 )

    ' plots image on L2 320x256 mode
    ' xpos = 0 to 319, clipped at the right hand edge
    ' ypos = 0 to 255, each column is clipped at the bottom of the screen
    ' frame is offset from start image derived from w * h
    ' img_data points to table such as
    ' image_test:
    '    asm
    '        ; bank, width (columns), height (bytes down each column)
    '        db  32, 00, 00
    '        ; offset in bank
    '        dw 00
    '    end asm
    '
    ' NOTE: layer 2 320x256 is COLUMN MAJOR, so ldir walks down the screen and
    ' not across it. The image data has to be stored column major to match, ie
    ' all `height` bytes of column 0, then all of column 1, and so on. A normal
    ' row major raw will come out transposed.
    '
    asm

        push    namespace   FImagePlot
        push    ix

        ld      l, (ix+4)                               ; xpos, all 9 bits of it
        ld      h, (ix+5)
        ld      (curx), hl
        ld      a, (ix+7)                               ; ypos
        ld      (cury), a

        ld      l, (ix+8)                               ; source of image data
        ld      h, (ix+9)

        ld      a, (ix+11)                              ; get frame to show

        push    hl                                      ; save source data on stack
        pop     ix                                      ; ix points to source data

        ; work out how many bytes we can copy down each column before falling
        ; off the bottom of the screen and wrapping into the next one, this is
        ; min(height, 256 - y)
        push    af                                      ; frame number is in a
        ld      l, (ix+2)                               ; height
        ld      h, 0
        ld      a, l
        or      a
        jr      nz, have_height
        inc     h                                       ; a height of 0 means 256
    have_height:
        ld      a, (cury)
        neg                                             ; a = 256 - y
        ld      e, a
        ld      d, 0
        jr      nz, have_space
        inc     d                                       ; y was 0, so a full 256
    have_space:
        or      a                                       ; clear carry for the sbc
        sbc     hl, de
        add     hl, de                                  ; put hl back to the height
        jr      c, rows_set                             ; height fits, use it
        ex      de, hl                                  ; else clip to what is left
    rows_set:
        ld      a, l                                    ; a 0 here means a full 256
        ld      (rows), a
        pop     af

        ld      e, (ix+3)                               ; offset of the image in the bank
        ld      d, (ix+4)
        push    de

        ld      e, (ix+1)                               ; fetch width
        ld      d, (ix+2)                               ; fetch height
        mul     d, e                                    ; size of one frame
        ld      l, a
        ld      h, 0
        call    .core.__MUL16_FAST                      ; call MUL16 HLxDE=HL now start of data
        pop     de
        add     hl, de                                  ; add the offset from the table

        ld      a, h                                    ; h is MSB of source data
        and     %11100000                               ; AND with $E0
        swapnib                                         ; now A is 0000 1110
        srl     a                                       ; now 0000 0111
        add     a, (ix+0)                               ; add the bank from the table
        ld      (srcbank), a                            ; remember what is in slot 0
        nextreg $50, a                                  ; set slot 0
        inc     a                                       ; next bank
        nextreg $51, a                                  ; set slot 1

        ld      a, h
        and     $1f                                     ; wrap h around 8kb
        ld      h, a

        ld      b, (ix+1)                               ; columns to draw, 0 gives 256

    colloop:

        push    bc                                      ; save the column counter

        ; only 16k of the source is paged in at slots 0 and 1, so step the banks
        ; on as hl walks through the image instead of reading off the end
        ld      a, h
        and     %11100000
        jr      z, source_ok                            ; still inside slot 0
        swapnib
        srl     a                                       ; 8k banks to move on by
        ld      c, a
        ld      a, (srcbank)
        add     a, c
        ld      (srcbank), a
        nextreg $50, a
        inc     a
        nextreg $51, a
        ld      a, h
        and     $1f
        ld      h, a
    source_ok:

        ld      de, (curx)                              ; column we are drawing
        ld      a, d
        or      a
        jr      z, xpos_ok                              ; x is under 256
        ld      a, e
        cp      64                                      ; 256 + 64 = 320
        jp      nc, clipped                             ; off the right hand edge, stop

    xpos_ok:
        ld      a, (cury)
        call    get_xy_pos_f320                         ; de = screen address, bank paged in

        ld      a, (rows)
        ld      c, a
        ld      b, 0                                    ; clear b
        or      a                                       ; is it a full column?
        jr      nz, was_not_zero                        ; check to see if we have 256 rows
        inc     b                                       ; yes, so set b to 1

    was_not_zero:
        ldir                                            ; copy one column down the screen
        pop     bc                                      ; get back the column counter
        ld      de, (curx)
        inc     de                                      ; next column to the right
        ld      (curx), de
        djnz    colloop                                 ; b of 0 on entry gives us 256
        jp      image_plot_done

    clipped:
        pop     bc                                      ; drop the saved column counter
        jp      image_plot_done

    curx:
        dw      0                                       ; column being drawn, 0 to 319
    cury:
        db      0                                       ; row the image starts on
    rows:
        db      0                                       ; bytes per column, 0 means 256
    srcbank:
        db      0                                       ; bank currently in slot 0

    get_xy_pos_f320:

        ; input de = x (0 to 319), a = y
        ; output de = address in $0000-$3fff with the right 16k bank paged in
        ; uses a de bc, hl is left alone
        ld      bc,.LAYER2_ACCESS_PORT
        push    af                                      ; save y
        ld      a,%00000011                             ; layer 2 visible, writes enabled
        out     (c),a
        ld      a,d                                     ; bit 8 of x
        add     a,a
        add     a,a                                     ; up into bit 2, ie bank 4
        ld      d,a
        ld      a,e                                     ; low byte of x
        rlca
        rlca
        and     3                                       ; (x & 255) / 64
        or      d                                       ; bank 0 to 4
        or      %00010000                               ; bit 4 = extended bank select
        out     (c),a                                   ; select 16k-bank
        ld      a,e
        and     63                                      ; column within this bank
        ld      d,a                                     ; high byte of the address
        pop     af                                      ; get y back
        ld      e,a                                     ; y is the low byte
        ret

    image_plot_done:
        ld      bc, .LAYER2_ACCESS_PORT                 ; turn off layer 2 writes
        ld      a, 2
        out     (c), a
        nextreg $50,$ff                                 ; put the rom back
        nextreg $51,$ff
        pop     ix

        pop     namespace

    end asm

end sub
