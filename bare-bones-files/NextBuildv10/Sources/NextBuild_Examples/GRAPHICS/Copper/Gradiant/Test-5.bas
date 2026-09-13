'!org=32768
'!exe=s2f Test-5.nex

#define NEX
#include <nextlib.bas>

asm
    nextreg SPRITE_CONTROL_NR_15, %00000011
    nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0
    nextreg GLOBAL_TRANSPARENCY_NR_14,0
end asm


' --- copper-list layout -----------------------------------------------------
const BAR_COUNT as ubyte = 4
const BAR_EVENTS as ubyte = 16              ' gradient height in lines (no trailing restore)
const BAR_FIRST_LINE as ubyte = 0           ' first scanline the bar zone covers
const BAR_RANGE as uinteger = 192           ' total scanlines covered by the bar zone
const ROW_SIZE as ubyte = 6                 ' bytes per scanline row (WAIT + 2 MOVEs)
const HEADER_SIZE as ubyte = 10             ' bytes for the copper preamble
const TERM_SIZE as ubyte = 2                ' bytes for the WAIT terminator
const COPPER_BUF_LEN as uinteger = HEADER_SIZE + BAR_RANGE * ROW_SIZE + TERM_SIZE

' --- motion -----------------------------------------------------------------
const BAR_CENTER as integer = 88            ' centre of vertical rotation in the bar zone
const BAR_AMP as ubyte = 75                 ' max sine deflection from centre
const ANGLE_SPEED as ubyte = 2              ' angle units per frame (0..255 = full circle)

' 16-line bar gradient pre-extracted from the original CopperGradient
dim bar_grad_hi(15) as ubyte => {$25,$45,$65,$89,$C9,$ED,$F5,$F9,$F9,$F5,$ED,$C9,$89,$65,$45,$25}
dim bar_grad_lo(15) as ubyte => {$00,$01,$01,$01,$00,$00,$00,$01,$01,$00,$00,$00,$01,$01,$01,$00}

dim copper_buf(COPPER_BUF_LEN - 1) as ubyte
dim bar_pos(3) as integer => {0,0,0,0}
dim bar_phase(3) as ubyte => {0,64,128,192}   ' 90 degree offsets, bars sweep on opposed sines
dim sin_tab(255) as byte
dim angle as ubyte


InitLayer2(MODE320X256)
ShowLayer2(TRUE)

ClearLayer2(0)
InitCopperBuf()
BuildSinTable()

InitCopper()
CopperDMACopy(@copper_buf(0), COPPER_BUF_LEN)

do

    WaitRetrace2(192)
    UpdateBarPositions()

    UpdateCopperData()
    CopperDMACopy(@copper_buf(0), COPPER_BUF_LEN)

loop


sub BuildSinTable()
    ' one full cycle of sin scaled by BAR_AMP into a signed byte table
    dim i as ubyte
    dim a as float
    for i = 0 to 254
        a = cast(float, i) * 0.0245436926     ' i * 2*PI / 256
        sin_tab(i) = cast(byte, sin(a) * cast(float, BAR_AMP))
    next i
end sub

sub InitCopperBuf()
    ' header: palette control + index 0 (every MOVE $44 below writes to palette 0)
    copper_buf(0) = $80 : copper_buf(1) = $00            ' WAIT line=0
    copper_buf(2) = $43 : copper_buf(3) = $90            ' palette control: no autostep, layer2 first palette
    copper_buf(4) = $40 : copper_buf(5) = $00            ' palette index = 0
    copper_buf(6) = $44 : copper_buf(7) = $00   8         ' initial palette value high
    copper_buf(8) = $44 : copperhj_buf(9) = $00            ' initial palette value low

    ' one WAIT + two palette-value MOVEs per scanline in the bar zone.
    ' The WAIT lines are static and monotonically increasing; only the
    ' two value bytes per row will be overwritten each frame.
    dim i as uinteger
    dim ofs as uinteger
    for i = 0 to BAR_RANGE - 1
        ofs = HEADER_SIZE + i * ROW_SIZE
        copper_buf(ofs)     = $80 +72                               ' WAIT h=0
        copper_buf(ofs + 1) = cast(ubyte, BAR_FIRST_LINE + i)    ' V = line number
        copper_buf(ofs + 2) = $44 : copper_buf(ofs + 3) = $00    ' MOVE palette val high
        copper_buf(ofs + 4) = $44 : copper_buf(ofs + 5) = $00    ' MOVE palette val low
    next i

    copper_buf(COPPER_BUF_LEN - 2) = $FF
    copper_buf(COPPER_BUF_LEN - 1) = $FF
end sub

sub UpdateBarPositions()
    ' free sine motion. Bars are allowed to overlap because every line
    ' has its own WAIT in the static list -- the copper sees a strictly
    ' increasing WAIT sequence regardless of bar order.
    dim i as ubyte
    dim ph as ubyte
    for i = 0 to BAR_COUNT - 1
        ph = angle + bar_phase(i)
        bar_pos(i) = BAR_CENTER + cast(integer, sin_tab(ph))
    next i
    angle = angle + ANGLE_SPEED
end sub

sub UpdateCopperData()
    dim i as uinteger
    dim b as ubyte
    dim p as ubyte
    dim line as integer
    dim ofs as uinteger
    dim limit as integer

    ' reset every scanline back to black
    'border 1
    for i = 0 to BAR_RANGE - 1
         ofs = HEADER_SIZE + i * ROW_SIZE
         copper_buf(ofs + 3) = $00
         copper_buf(ofs + 5) = $00
    next i
    'border 6
    ' stamp each bar's gradient into the rows starting at bar_pos(b).
    ' When bars overlap, the later-stamped bar wins -- it visually appears
    ' to pass in front of the earlier one.
    limit = cast(integer, BAR_FIRST_LINE) + cast(integer, BAR_RANGE)
    for b = 0 to BAR_COUNT - 1
        for p = 0 to BAR_EVENTS - 1
            line = bar_pos(b) + cast(integer, p)
            if line >= cast(integer, BAR_FIRST_LINE) and line < limit then
                ofs = HEADER_SIZE + (cast(uinteger, line) - cast(uinteger, BAR_FIRST_LINE)) * ROW_SIZE
                copper_buf(ofs + 3) = bar_grad_hi(p)
                copper_buf(ofs + 5) = bar_grad_lo(p)
            end if
        next p
    next b
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
