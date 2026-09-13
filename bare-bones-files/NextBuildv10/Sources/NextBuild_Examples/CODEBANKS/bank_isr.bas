' ---------------------------------------------------------------
' bank_isr - banked code alongside an interrupt handler
'
' This is the one rule the compiler cannot check for you:
'
'   *** an interrupt handler must stay resident, must never make
'   *** a far call, and must never touch the code window's MMU slot
'
' An interrupt can fire at any instruction, including part-way
' through a far call while a different bank is paged in. If the
' handler then far-called something itself, it would push onto the
' shadow stack mid-unwind and page the interrupted caller's bank
' out from under it.
'
' The fix is not complicated: keep the handler tiny and resident,
' have it only touch counters and flags, and do the real per-frame
' work from the main loop - which may call into banks as much as it
' likes, with interrupts left enabled throughout.
'
' The handler here is hand-written asm rather than nextlib's
' SetUpIM()/CUSTOMISR, purely to keep it obviously resident and
' self-contained in one file.
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40

#include <nextlib.bas>

DIM ticks as uByte          ' bumped by the interrupt handler
DIM secs as uByte           ' bumped by the interrupt handler
DIM frames as uInteger      ' bumped by the main loop
DIM last as uByte

' ---- bank 1: the per-frame drawing ---------------------------
' Called from the main loop, never from the handler. Interrupts
' stay enabled while these run: the handler is resident, so it does
' not care which bank happens to be paged in when it fires.
CODEBANK 1

    SUB DrawStatus()
        PRINT AT 3,2;"SECONDS ";secs;"  "
        PRINT AT 4,2;"TICKS   ";ticks;"  "
        PRINT AT 5,2;"FRAMES  ";frames;"  "
    END SUB

    SUB DrawBar(n as uByte)
        DIM x as uByte
        FOR x = 0 TO 29
            IF x < n THEN
                PRINT AT 8,x + 1;"#"
            ELSE
                PRINT AT 8,x + 1;" "
            END IF
        NEXT x
    END SUB

END CODEBANK

' ---- bank 2: static text -------------------------------------
CODEBANK 2

    SUB Title()
        PRINT AT 0,2;"HANDLER RESIDENT, WORK BANKED"
        PRINT AT 1,2;"INTERRUPTS STAY ENABLED"
    END SUB

END CODEBANK

' ---- resident: install the interrupt handler -----------------
SUB SetupISR()
    asm
        PROC
        LOCAL isr_done, handler, store

        di

        ; IM2 wants a 257 byte table of identical bytes. Table at
        ; $F800 (I = $F8) filled with $F7 points every interrupt at
        ; $F7F7, so that is where the jump to the handler goes.
        ld   hl, $F800
        ld   de, $F801
        ld   bc, 256
        ld   (hl), $F7
        ldir

        ld   a, $C3                 ; JP nn
        ld   ($F7F7), a
        ld   hl, handler
        ld   ($F7F8), hl

        ld   a, $F8
        ld   i, a
        im   2
        ei
        jp   isr_done             ; skip over the handler body

        ; --- the handler ---------------------------------------
        ; Resident, and it only touches two BASIC globals. No CALLs
        ; at all, so it can never reach a trampoline. It also never
        ; writes NextReg $53, so the code window is left alone.
    handler:
        push af
        ld   a, (._ticks)
        inc  a
        cp   50
        jr   c, store
        ld   a, (._secs)
        inc  a
        ld   (._secs), a
        xor  a
    store:
        ld   (._ticks), a
        pop  af
        ei
        reti

    isr_done:
        ENDP
    end asm
END SUB

' ---- resident: main loop -------------------------------------
BORDER 0 : PAPER 0 : INK 7 : CLS

SetupISR()
Title()                     ' bank 2

DO
    frames = frames + 1
    DrawStatus()            ' bank 1, with interrupts live

    ' Only redraw the bar when the handler says a second passed.
    IF secs <> last THEN
        last = secs
        DrawBar(secs MOD 30)    ' bank 1 again
    END IF
LOOP
