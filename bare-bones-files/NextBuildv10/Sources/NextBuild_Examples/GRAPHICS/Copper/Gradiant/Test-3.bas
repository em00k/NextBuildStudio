'!org=32768
'!exe=s2f Test-3.nex

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
CopperDMACopy(@CopperGradient,204)
ClearLayer2(0)

do

    WaitRetrace2(192)
    border 2
    UpdateBarPositions()
    UpdateCopperData()
    CopperDMACopy(@CopperGradient,204)
    border 0
loop

const BAR_EVENT_OFFSET as uinteger = 10
const BAR_EVENT_SIZE as ubyte = 6
const BAR_HEIGHT as ubyte = 9          ' bar spans N..N+8
const BAR_EVENTS as ubyte = 8
const BAR_COUNT as ubyte = 4
const SCREEN_TOP as integer = 0
const SCREEN_BOTTOM as integer = 247   ' 256 - BAR_HEIGHT
const COPPER_BARS_LENGTH as uinteger = 110

dim bar_line_ofs(7) as ubyte => {0, 1, 3, 4, 5, 6, 7, 8}
dim bar_pos(3) as integer => {0, 60, 130, 200}
dim bar_vel(3) as integer => {1, -1, 2, -2}

sub UpdateBarPositions()

    dim i as ubyte
    dim gap as integer
    dim push as integer
    dim tmp as integer

    ' move + bounce off top/bottom
    for i = 0 to BAR_COUNT - 1
        bar_pos(i) = bar_pos(i) + bar_vel(i)
        if bar_pos(i) <= SCREEN_TOP then
            bar_pos(i) = SCREEN_TOP
            bar_vel(i) = -bar_vel(i)
        end if
        if bar_pos(i) >= SCREEN_BOTTOM then
            bar_pos(i) = SCREEN_BOTTOM
            bar_vel(i) = -bar_vel(i)
        end if
    next i

    ' bar-bar elastic collisions (array stays sorted)
    for i = 0 to BAR_COUNT - 2
        gap = bar_pos(i + 1) - bar_pos(i)
        if gap < BAR_HEIGHT then
            tmp = bar_vel(i)
            bar_vel(i) = bar_vel(i + 1)
            bar_vel(i + 1) = tmp
            push = BAR_HEIGHT - gap
            bar_pos(i) = bar_pos(i) - push
            if bar_pos(i) < SCREEN_TOP then
                bar_pos(i + 1) = bar_pos(i + 1) + (SCREEN_TOP - bar_pos(i))
                bar_pos(i) = SCREEN_TOP
                if bar_pos(i + 1) > SCREEN_BOTTOM then bar_pos(i + 1) = SCREEN_BOTTOM
            end if
        end if
    next i

end sub



  sub UpdateCopperData()

      dim bar as ubyte
      dim part as ubyte
      dim line as uinteger
      dim eventIndex as uinteger
      dim waitAddress as uinteger

      for bar = 0 to BAR_COUNT - 1
          for part = 0 to BAR_EVENTS - 1

              line = cast(uinteger, bar_pos(bar)) + bar_line_ofs(part)
              line = line band 255

              eventIndex = cast(uinteger, bar * BAR_EVENTS) + part
              waitAddress = @CopperGradient + BAR_EVENT_OFFSET + cast(uinteger, eventIndex * BAR_EVENT_SIZE)

              poke waitAddress, $80
              poke waitAddress + 1, line

          next part
      next bar

  end sub


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


' Option 1 animation: rebuild this list with a new bar offset, then CopperDMACopy(@CopperBars, 204).
' Current bars: 4, thickness: 8 lines, spacing: 32, offset: 0.
asm
CopperBars:
    db $80, $00    ; WAIT h=0, line=0
    db $43, $90    ; disable palette step, select Layer 2 first palette
    db $40, $00    ; point to palette index 0
    db $44, $00    ; background MOVE $44, $00 RRRGGGBB
    db $44, $00    ; background MOVE $44, $00 B lsb
    db $80, $00    ; WAIT h=0, line=0
    db $44, $05    ; bar 1 MOVE $44, $05 RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $80, $01    ; WAIT h=0, line=1
    db $44, $09    ; bar 1 MOVE $44, $09 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $80, $03    ; WAIT h=0, line=3
    db $44, $0E    ; bar 1 MOVE $44, $0E RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $80, $04    ; WAIT h=0, line=4
    db $44, $12    ; bar 1 MOVE $44, $12 RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $80, $05    ; WAIT h=0, line=5
    db $44, $32    ; bar 1 MOVE $44, $32 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $80, $06    ; WAIT h=0, line=6
    db $44, $56    ; bar 1 MOVE $44, $56 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $80, $07    ; WAIT h=0, line=7
    db $44, $9B    ; bar 1 MOVE $44, $9B RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $80, $08    ; WAIT h=0, line=8
    db $44, $00    ; restore MOVE $44, $00 RRRGGGBB
    db $44, $00    ; restore MOVE $44, $00 B lsb
    db $80, $20    ; WAIT h=0, line=32
    db $44, $05    ; bar 2 MOVE $44, $05 RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $80, $21    ; WAIT h=0, line=33
    db $44, $09    ; bar 2 MOVE $44, $09 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $80, $23    ; WAIT h=0, line=35
    db $44, $0E    ; bar 2 MOVE $44, $0E RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $80, $24    ; WAIT h=0, line=36
    db $44, $12    ; bar 2 MOVE $44, $12 RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $80, $25    ; WAIT h=0, line=37
    db $44, $32    ; bar 2 MOVE $44, $32 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $80, $26    ; WAIT h=0, line=38
    db $44, $56    ; bar 2 MOVE $44, $56 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $80, $27    ; WAIT h=0, line=39
    db $44, $9B    ; bar 2 MOVE $44, $9B RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $80, $28    ; WAIT h=0, line=40
    db $44, $00    ; restore MOVE $44, $00 RRRGGGBB
    db $44, $00    ; restore MOVE $44, $00 B lsb
    db $80, $40    ; WAIT h=0, line=64
    db $44, $05    ; bar 3 MOVE $44, $05 RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $80, $41    ; WAIT h=0, line=65
    db $44, $09    ; bar 3 MOVE $44, $09 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $80, $43    ; WAIT h=0, line=67
    db $44, $0E    ; bar 3 MOVE $44, $0E RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $80, $44    ; WAIT h=0, line=68
    db $44, $12    ; bar 3 MOVE $44, $12 RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $80, $45    ; WAIT h=0, line=69
    db $44, $32    ; bar 3 MOVE $44, $32 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $80, $46    ; WAIT h=0, line=70
    db $44, $56    ; bar 3 MOVE $44, $56 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $80, $47    ; WAIT h=0, line=71
    db $44, $9B    ; bar 3 MOVE $44, $9B RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $80, $48    ; WAIT h=0, line=72
    db $44, $00    ; restore MOVE $44, $00 RRRGGGBB
    db $44, $00    ; restore MOVE $44, $00 B lsb
    db $80, $60    ; WAIT h=0, line=96
    db $44, $05    ; bar 4 MOVE $44, $05 RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $80, $61    ; WAIT h=0, line=97
    db $44, $09    ; bar 4 MOVE $44, $09 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $80, $63    ; WAIT h=0, line=99
    db $44, $0E    ; bar 4 MOVE $44, $0E RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $80, $64    ; WAIT h=0, line=100
    db $44, $12    ; bar 4 MOVE $44, $12 RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $80, $65    ; WAIT h=0, line=101
    db $44, $32    ; bar 4 MOVE $44, $32 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $80, $66    ; WAIT h=0, line=102
    db $44, $56    ; bar 4 MOVE $44, $56 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $80, $67    ; WAIT h=0, line=103
    db $44, $9B    ; bar 4 MOVE $44, $9B RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $80, $68    ; WAIT h=0, line=104
    db $44, $00    ; restore MOVE $44, $00 RRRGGGBB
    db $44, $00    ; restore MOVE $44, $00 B lsb
    db $FF, $FF    ; WAIT 63,511 stop
end asm 