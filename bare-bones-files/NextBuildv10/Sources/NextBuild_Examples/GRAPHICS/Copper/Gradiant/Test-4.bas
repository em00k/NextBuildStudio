'!org=32768
'!exe=s2f Test-4.nex

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
CopperDMACopy(@CopperGradient,420)
ClearLayer2(0)

do

    WaitRetrace2(192)
    
    UpdateBarPositions()
    UpdateCopperData()
    CopperDMACopy(@CopperGradient,420)
    
loop

const BAR_EVENT_OFFSET as uinteger = 10
const BAR_EVENT_SIZE as ubyte = 6
const BAR_HEIGHT as ubyte = 18          ' bar spans N..N+16
const BAR_EVENTS as ubyte = 17
const BAR_COUNT as ubyte = 4
const SCREEN_TOP as integer = 0
const SCREEN_BOTTOM as integer = 256 - BAR_HEIGHT   ' 256 - BAR_HEIGHT
const COPPER_BARS_LENGTH as uinteger = 110
const COPPER_H_OFFSET as ubyte = 36

dim bar_line_ofs(16) as ubyte => {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}
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
      dim line as ubyte
      dim eventIndex as uinteger
      dim waitAddress as uinteger

      for bar = 0 to BAR_COUNT - 1
          for part = 0 to BAR_EVENTS - 1

              line = cast(uinteger, bar_pos(bar)) + bar_line_ofs(part)
              line = line band 255

              eventIndex = cast(uinteger, bar * BAR_EVENTS) + part
              waitAddress = @CopperGradient + BAR_EVENT_OFFSET + cast(uinteger, eventIndex * BAR_EVENT_SIZE)

              poke waitAddress, $80 + 86
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
    db $C8, $00    ; WAIT h=36, line=0
    db $43, $90    ; disable palette step, select Layer 2 first palette
    db $40, $00    ; point to palette index 0
    db $44, $00    ; background MOVE $44, $00 RRRGGGBB
    db $44, $00    ; background MOVE $44, $00 B lsb
    db $C8, $00    ; WAIT h=36, line=0
    db $44, $25    ; bar 1 MOVE $44, $25 RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $C8, $01    ; WAIT h=36, line=1
    db $44, $45    ; bar 1 MOVE $44, $45 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $C8, $02    ; WAIT h=36, line=2
    db $44, $65    ; bar 1 MOVE $44, $65 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $C8, $03    ; WAIT h=36, line=3
    db $44, $89    ; bar 1 MOVE $44, $89 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $C8, $04    ; WAIT h=36, line=4
    db $44, $C9    ; bar 1 MOVE $44, $C9 RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $C8, $05    ; WAIT h=36, line=5
    db $44, $ED    ; bar 1 MOVE $44, $ED RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $C8, $06    ; WAIT h=36, line=6
    db $44, $F5    ; bar 1 MOVE $44, $F5 RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $C8, $07    ; WAIT h=36, line=7
    db $44, $F9    ; bar 1 MOVE $44, $F9 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $C8, $08    ; WAIT h=36, line=8
    db $44, $F9    ; bar 1 MOVE $44, $F9 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $C8, $09    ; WAIT h=36, line=9
    db $44, $F5    ; bar 1 MOVE $44, $F5 RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $C8, $0A    ; WAIT h=36, line=10
    db $44, $ED    ; bar 1 MOVE $44, $ED RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $C8, $0B    ; WAIT h=36, line=11
    db $44, $C9    ; bar 1 MOVE $44, $C9 RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $C8, $0C    ; WAIT h=36, line=12
    db $44, $89    ; bar 1 MOVE $44, $89 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $C8, $0D    ; WAIT h=36, line=13
    db $44, $65    ; bar 1 MOVE $44, $65 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $C8, $0E    ; WAIT h=36, line=14
    db $44, $45    ; bar 1 MOVE $44, $45 RRRGGGBB
    db $44, $01    ; bar 1 MOVE $44, $01 B lsb
    db $C8, $0F    ; WAIT h=36, line=15
    db $44, $25    ; bar 1 MOVE $44, $25 RRRGGGBB
    db $44, $00    ; bar 1 MOVE $44, $00 B lsb
    db $C8, $10    ; WAIT h=36, line=16
    db $44, $00    ; restore MOVE $44, $00 RRRGGGBB
    db $44, $00    ; restore MOVE $44, $00 B lsb
    db $C8, $20    ; WAIT h=36, line=32
    db $44, $25    ; bar 2 MOVE $44, $25 RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $C8, $21    ; WAIT h=36, line=33
    db $44, $45    ; bar 2 MOVE $44, $45 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $C8, $22    ; WAIT h=36, line=34
    db $44, $65    ; bar 2 MOVE $44, $65 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $C8, $23    ; WAIT h=36, line=35
    db $44, $89    ; bar 2 MOVE $44, $89 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $C8, $24    ; WAIT h=36, line=36
    db $44, $C9    ; bar 2 MOVE $44, $C9 RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $C8, $25    ; WAIT h=36, line=37
    db $44, $ED    ; bar 2 MOVE $44, $ED RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $C8, $26    ; WAIT h=36, line=38
    db $44, $F5    ; bar 2 MOVE $44, $F5 RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $C8, $27    ; WAIT h=36, line=39
    db $44, $F9    ; bar 2 MOVE $44, $F9 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $C8, $28    ; WAIT h=36, line=40
    db $44, $F9    ; bar 2 MOVE $44, $F9 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $C8, $29    ; WAIT h=36, line=41
    db $44, $F5    ; bar 2 MOVE $44, $F5 RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $C8, $2A    ; WAIT h=36, line=42
    db $44, $ED    ; bar 2 MOVE $44, $ED RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $C8, $2B    ; WAIT h=36, line=43
    db $44, $C9    ; bar 2 MOVE $44, $C9 RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $C8, $2C    ; WAIT h=36, line=44
    db $44, $89    ; bar 2 MOVE $44, $89 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $C8, $2D    ; WAIT h=36, line=45
    db $44, $65    ; bar 2 MOVE $44, $65 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $C8, $2E    ; WAIT h=36, line=46
    db $44, $45    ; bar 2 MOVE $44, $45 RRRGGGBB
    db $44, $01    ; bar 2 MOVE $44, $01 B lsb
    db $C8, $2F    ; WAIT h=36, line=47
    db $44, $25    ; bar 2 MOVE $44, $25 RRRGGGBB
    db $44, $00    ; bar 2 MOVE $44, $00 B lsb
    db $C8, $30    ; WAIT h=36, line=48
    db $44, $00    ; restore MOVE $44, $00 RRRGGGBB
    db $44, $00    ; restore MOVE $44, $00 B lsb
    db $C8, $40    ; WAIT h=36, line=64
    db $44, $25    ; bar 3 MOVE $44, $25 RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $C8, $41    ; WAIT h=36, line=65
    db $44, $45    ; bar 3 MOVE $44, $45 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $C8, $42    ; WAIT h=36, line=66
    db $44, $65    ; bar 3 MOVE $44, $65 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $C8, $43    ; WAIT h=36, line=67
    db $44, $89    ; bar 3 MOVE $44, $89 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $C8, $44    ; WAIT h=36, line=68
    db $44, $C9    ; bar 3 MOVE $44, $C9 RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $C8, $45    ; WAIT h=36, line=69
    db $44, $ED    ; bar 3 MOVE $44, $ED RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $C8, $46    ; WAIT h=36, line=70
    db $44, $F5    ; bar 3 MOVE $44, $F5 RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $C8, $47    ; WAIT h=36, line=71
    db $44, $F9    ; bar 3 MOVE $44, $F9 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $C8, $48    ; WAIT h=36, line=72
    db $44, $F9    ; bar 3 MOVE $44, $F9 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $C8, $49    ; WAIT h=36, line=73
    db $44, $F5    ; bar 3 MOVE $44, $F5 RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $C8, $4A    ; WAIT h=36, line=74
    db $44, $ED    ; bar 3 MOVE $44, $ED RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $C8, $4B    ; WAIT h=36, line=75
    db $44, $C9    ; bar 3 MOVE $44, $C9 RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $C8, $4C    ; WAIT h=36, line=76
    db $44, $89    ; bar 3 MOVE $44, $89 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $C8, $4D    ; WAIT h=36, line=77
    db $44, $65    ; bar 3 MOVE $44, $65 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $C8, $4E    ; WAIT h=36, line=78
    db $44, $45    ; bar 3 MOVE $44, $45 RRRGGGBB
    db $44, $01    ; bar 3 MOVE $44, $01 B lsb
    db $C8, $4F    ; WAIT h=36, line=79
    db $44, $25    ; bar 3 MOVE $44, $25 RRRGGGBB
    db $44, $00    ; bar 3 MOVE $44, $00 B lsb
    db $C8, $50    ; WAIT h=36, line=80
    db $44, $00    ; restore MOVE $44, $00 RRRGGGBB
    db $44, $00    ; restore MOVE $44, $00 B lsb
    db $C8, $60    ; WAIT h=36, line=96
    db $44, $25    ; bar 4 MOVE $44, $25 RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $C8, $61    ; WAIT h=36, line=97
    db $44, $45    ; bar 4 MOVE $44, $45 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $C8, $62    ; WAIT h=36, line=98
    db $44, $65    ; bar 4 MOVE $44, $65 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $C8, $63    ; WAIT h=36, line=99
    db $44, $89    ; bar 4 MOVE $44, $89 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $C8, $64    ; WAIT h=36, line=100
    db $44, $C9    ; bar 4 MOVE $44, $C9 RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $C8, $65    ; WAIT h=36, line=101
    db $44, $ED    ; bar 4 MOVE $44, $ED RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $C8, $66    ; WAIT h=36, line=102
    db $44, $F5    ; bar 4 MOVE $44, $F5 RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $C8, $67    ; WAIT h=36, line=103
    db $44, $F9    ; bar 4 MOVE $44, $F9 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $C8, $68    ; WAIT h=36, line=104
    db $44, $F9    ; bar 4 MOVE $44, $F9 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $C8, $69    ; WAIT h=36, line=105
    db $44, $F5    ; bar 4 MOVE $44, $F5 RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $C8, $6A    ; WAIT h=36, line=106
    db $44, $ED    ; bar 4 MOVE $44, $ED RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $C8, $6B    ; WAIT h=36, line=107
    db $44, $C9    ; bar 4 MOVE $44, $C9 RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $C8, $6C    ; WAIT h=36, line=108
    db $44, $89    ; bar 4 MOVE $44, $89 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $C8, $6D    ; WAIT h=36, line=109
    db $44, $65    ; bar 4 MOVE $44, $65 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $C8, $6E    ; WAIT h=36, line=110
    db $44, $45    ; bar 4 MOVE $44, $45 RRRGGGBB
    db $44, $01    ; bar 4 MOVE $44, $01 B lsb
    db $C8, $6F    ; WAIT h=36, line=111
    db $44, $25    ; bar 4 MOVE $44, $25 RRRGGGBB
    db $44, $00    ; bar 4 MOVE $44, $00 B lsb
    db $C8, $70    ; WAIT h=36, line=112
    db $44, $00    ; restore MOVE $44, $00 RRRGGGBB
    db $44, $00    ; restore MOVE $44, $00 B lsb
    db $FF, $FF    ; WAIT 63,511 stop
end asm 