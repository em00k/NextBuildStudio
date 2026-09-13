'!org=32768     
'!exe=s2f Test-1.nex

#define NEX 
#include <nextlib.bas>

asm 
    nextreg SPRITE_CONTROL_NR_15, %00000011
    nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0
    nextreg GLOBAL_TRANSPARENCY_NR_14,0
end asm 


InitLayer2(MODE320X256)
ShowLayer2(TRUE)
InitCopper()
CopperDMACopy(@CopperGradient,1542)
ClearLayer2(0)

do

    WaitRetrace2(192)

loop


'dim copper_data_offset as ubyte

' sub UpdateCopperData()

'     for yx = 0 to 4
'         poke @CopperGradient+3+cast(uinteger,yx*4), copper_data_offset*yx
'     next yx 

'     copper_data_offset = copper_data_offset + 1

' end sub 

sub InitCopper()
    asm 
    Nextreg VIDEO_LINE_OFFSET_NR_64,33
    Nextreg COPPER_DATA_NR_60, %10000000
    Nextreg COPPER_DATA_NR_60, 0
    Nextreg COPPER_CONTROL_LO_NR_61, 0
    Nextreg COPPER_CONTROL_HI_NR_62, %11000000
    end asm 
end sub 

sub fastcall CopperDMACopy(byval dma_source_address as uinteger, byval dma_length as uinteger)

    asm 
        ;------------------------------------------------------------------------------
        ; CopperDMACopy
        ; This routine will upload list of bytes to the Nextreg port $253B
        ; we preselect the Nextreg $60 and then send the list of bytes to the port
        ; hl = source address we want to copy from
        ; bc = length of the data we want to copy
        ;------------------------------------------------------------------------------
        ld 		(DMA_CopperSource),hl           ; hl = source address
        pop 	hl                              ; get the return address off the stack into hl
        ex 		(sp), hl                        ; swap the top of the stack with hl

        exx                                     ; Swap the alternate registers
        pop 	hl                              ; get the length off the stack into hl
        exx                                     ; Swap regs 
        ld      (DMA_CopperLength),hl           ; store hl = length

        call    send_copper_dma
        exx
        push    hl
        exx
        ret

    send_copper_dma:
        nextreg COPPER_CONTROL_HI_NR_62,%11000000
        nextreg COPPER_CONTROL_LO_NR_61,$00

        ld      bc,$243B                                    ; we will select nextreg $60
        ld      a,$60                                       ; copper data!
        out     (c),a
        ld      c,$6B                                       ; reg B - len, reg C - 11=MB02+ / 107=DATA-GEAR
        ld      hl,DMADATACOPPEROUT
        ; 19 DMA bytes
        outi : outi : outi : outi : outi : outi : outi
        outi : outi : outi : outi : outi : outi : outi
        outi : outi : outi : outi : outi
        ret


        DMADATACOPPEROUT:        
        db      $C3                     ; REG6 Reset
        ; temporarily declare PORT B as source in REG0 (bit2=0), (B=SOURCE, A=TARGET)
        db      $C7                     ; R6-RESET PORT A Timing
        db      $CB                     ; R6-RESET PORT B Timing
        db      %01111101               ; REG 0: DMA mode=transfer. Port A=Source, Port B=Target

        DMA_CopperSource:        dw      0000                    ;        Port A Address (Source address)
        DMA_CopperLength:        dw      0000                    ;        Length of transfer block

        db      %01010100               ; REG 1: PORT A=memory,incremented
        db      2
        db      %01101000               ; REG 2: PORT B=I/O, fixed adress
        db      2
        db      %10101101               ; REG 4: Write PORT B (Port starting address. Continuous transfer mode)
        dw      $253B                   ; Adress of PORT B (target adress) (nextreg port)
        db      $82                     ; R5-Stop on end of block, RDY active LOW
        db      $CF                     ; R6-Load
        db      $B3                     ; REG 6: force ready
        db      %10000111               ; REG 6: Enable DMA

        end asm 
end sub 


CopperGradient:
asm
CopperGradient:
    db $C8, $00, $43, $90, $40, $00, $44, $20, $44, $00, $C8, $1A, $44, $40, $44, $00
    db $C8, $3B, $44, $60, $44, $00, $C8, $5A, $44, $64, $44, $00, $C8, $5B, $44, $84
    db $44, $00, $C8, $76, $44, $A4, $44, $00, $C8, $86, $44, $A8, $44, $00, $C8, $93
    db $44, $C8, $44, $00, $C8, $AE, $44, $E8, $44, $00, $C8, $B3, $44, $EC, $44, $00
    db $C8, $C0, $44, $EC, $44, $01, $C8, $C8, $44, $F0, $44, $01, $C8, $D8, $44, $F1
    db $44, $00, $C8, $DD, $44, $F5, $44, $00, $C8, $F1, $44, $F5, $44, $01, $C8, $F2
    db $44, $F9, $44, $01, $FF, $FF
end asm 

' NOOP, MOVE, WAIT and HALT

' NOOP is used to fine tune timing 
' MOVE writes data to registers 
' WAIT waits for a specific pixel position on the display
' HALT Stops the Copper and waits for the new frame 

;            NAME   15     8 7      0           CLOCKS
;            -----------------------------------------
;            NOOP   00000000 00000000             1
;            MOVE   0RRRRRRR DDDDDDDD             2
;            WAIT   1HHHHHHV VVVVVVVV             1
;
;               H   6 bit horizontal dot clock compare
;               V   9 bit vertical line compare
;               R   7 bit Next register 0x00..0x7F
;               D   8 bit data