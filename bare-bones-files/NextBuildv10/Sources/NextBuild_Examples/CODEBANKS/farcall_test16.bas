' ---------------------------------------------------------------
' farcall_test16 - asserts the far-call runtime with a 16K code window.
'
' A 16K window covers two MMU slots ($6000-$9FFF), so a bank can hold
' more than 8K of code. Each routine here is deliberately pushed past
' $7FFF by a padding blob, so it can only execute if the runtime maps
' the window's *second* slot as well as the first.
'
' ---------------------------------------------------------------
'!org=$A000
'!opt=4
'!codewindow=$6000
'!codewindowsize=16384      ' extend codebank window to 16KB
'!codebank=40               ' CODEBANK 1 -> pages 40,41; 2 -> 42,43
#include <nextlib.bas>

#define NOSP
'!sp=$FE00

' Also as a pragma, so the file builds the same way when zxbc is invoked
' directly (by run_far.py's workflow) as it does through NextBuild.
#pragma codewindowsize = 16384

CODEBANK 1
    ' Pushes everything after it past $7FFF, into the window's upper slot.
    pad1:
    asm
        defs 8300, $ff
    end asm

    FUNCTION High1() as uInteger
        RETURN 4242
    END FUNCTION
END CODEBANK

CODEBANK 2
    pad2:
    asm
        defs 8300, 0
    end asm

    FUNCTION High2() as uInteger
        ' bank 2 -> bank 1 -> back to bank 2, both bodies above $7FFF
        RETURN High1() + 1111
    END FUNCTION
END CODEBANK

SUB Resident()
    POKE uInteger $F004, 7
    PRINT "Resident() called"

    dim r1 as uInteger : r1 = peek(uinteger, $F000)
    dim r2 as uInteger : r2 = peek(uinteger, $F002)
    dim rg as uInteger : rg = peek(uinteger, $F004)

    PRINT "High1()  = "; r1;
    if r1 = 4242 then
        PRINT "  PASS"
    else
        PRINT "  FAIL (expect 4242)"
    endif

    PRINT "High2()  = "; r2;
    if r2 = 5353 then
        PRINT "  PASS"
    else
        PRINT "  FAIL (expect 5353)"
    endif

    PRINT "guard    = "; rg;
    if rg = 7 then
        PRINT "  PASS"
    else
        PRINT "  FAIL (expect 7)"
    endif
END SUB


POKE uInteger $F000, High1()      ' expect 4242
POKE uInteger $F002, High2()      ' expect 5353
Resident()                        ' expect 7, proving we came back cleanly

do : loop