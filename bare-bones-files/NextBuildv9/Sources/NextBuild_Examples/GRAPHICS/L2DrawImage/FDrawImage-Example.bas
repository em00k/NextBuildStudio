'!org=24576
' NextBuild Layer2 Template 
' Thre is currently a bug in this!

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
LoadSDBank("pirate-loss.raw",4096,0,0,32)   ' load in pirate 2
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
    ' xpos = 0 to 319 - width of image 
    ' ypos = 0 to 255 - height of image
    ' frame is offset from start image derived from w * h 
    ' img_data points to table such as 
    ' image_test:
    '    asm
    '        ; bank  spare  
    '        db  32, 00, 00
    '        ; offset in bank  
    '        dw 00
    '    end asm 
    ' 
    asm 

        push    namespace   ImagePlot
        push    ix 
    straight_plot:
        ; typewriter plots large tile
        ; de = yx, ix = source_data
        
        ld      e, (ix+4)                               ; x 
        ld      d, (ix+7)                               ; y 
        ld      (.add1+1), de                           ; save yx address 

        ld      l, (ix+8)                               ; source of image data 
        ld      h, (ix+9)

        ld      a, (ix+11)                              ; get frame to show 

        push    hl                                      ; save source data on stack 
        pop     ix                                      ; ix points to source data 

        ld      l, (ix+3)                               ; get width of image 
        ld      h, (ix+4)                               ; get height of image 

        ld      e, (ix+1)                               ; fetch width
        ld      d, (ix+2)                               ; fetch height
        mul     d, e                                    ; total size 
        ld      l, a 
        ld      h, 0 
        call    .core.__MUL16_FAST                      ; call MUL16 HLxDE=HL now start of data

        ld      a, h                                    ; h is MSB of source data
        and     %11100000                               ; AND with $E0
        swapnib                                         ; now A is 0000 1110
        srl     a                                       ; now 0000 0111
        ld      e, (ix+0)                               ; get the bank the source date is in from table
        add     a, e                                    ; add the offset
        nextreg $50, a                                  ; set slot 0
        inc     a                                       ; next bank 
        nextreg $51, a                                  ; set slot 1

        ld      a, h 
        and     $1f                                      ; wrap h around 8kb
        ld      h, a 

        ld      b, (ix+2)                               ; height
            
    .add1:
        ld      de, 0000                                ; will hold yx with self mod code
    .line1:  
            
        push    bc                                      ; save bc / height 
        call    get_xy_pos_fl2                          ; get position and l2 bank in place
        ld      b, 0                                    ; clear b 
        ld      a,(ix+1)                                ; width
        or      a                                       ; is width full width?
        jr      nz, _was_not_zero                       ; check to see if we have a width of 256
        ld      b, 1                                    ; yes, so set b to 1

    _was_not_zero:
        ld      c, a
        ldir                                            ; copy line 
        pop     bc                                      ; get back height
        ld      de, (.add1+1)                           ; get back yx 
        inc     d                                       ; inc y 
        ld      (.add1+1), de                           ; save yx again
        dec     b                                       ; decrease height 
        jr      nz, .line1                              ; was height 0? no then loop to line1
        ld      bc, .LAYER2_ACCESS_PORT                 ; turn off layer 2 writes
        ld      a, 2 
        out     (c), a 
        pop     ix 
        jp      image_plot_done


    get_xy_pos_fl2:

        ; input d = y, e = x
        ; uses de a bc 
        ; push    bc
        ld      bc,.LAYER2_ACCESS_PORT
        ld      a,d                                     ; put y into A 
        and     $c0                                     ; yy00 0000

        or      3                                       ; yy00 0011
        out     (c),a                                   ; select 8k-bank    
        ld      a,d                                     ; yyyy yyyy
        and     63                                      ; 00yy yyyy 
        ld      d,a
        ; pop     bc
        ret
    image_plot_done:
        nextreg $50,$ff
        nextreg $51,$ff
        
        pop     namespace

    end asm 

end sub 