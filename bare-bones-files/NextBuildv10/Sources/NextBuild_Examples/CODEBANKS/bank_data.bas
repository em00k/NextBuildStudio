' ---------------------------------------------------------------
' bank_data - variables and arrays that live inside the bank
'
' A DIM written between CODEBANK n and END CODEBANK has its storage
' emitted into that bank's 8K page, next to the routines that use
' it, instead of into the resident variable area. A 4K lookup table
' then costs nothing at all out of the $8000-$FFFF budget.
'
' The catch is the same one the code obeys: only one bank is paged
' into the window at a time, so bank-local data is only addressable
' from routines in the same bank. The compiler enforces that - the
' commented-out lines at the bottom are all hard errors.
'
' Rule of thumb: bank-local for what one subsystem owns, resident
' for anything two subsystems have to agree on.
' ---------------------------------------------------------------
'!org=$e000
'!opt=4
'!codebank=40           ' CODEBANK 1 -> page 40, 2 -> 41

#pragma codewindowsize = 16384
#include <nextlib.bas>

asm
    ei              ; enable for INKEY$
end asm

' ---- resident: what the two subsystems share ------------------
' Anything more than one bank touches has to stay out here.
DIM frame as uInteger
DIM total as uInteger

' ---- bank 1: the sine subsystem -------------------------------
' Table and cursor are private to this bank. Nothing outside it can
' name them, which is exactly what makes it safe to put them here.
CODEBANK 1

    DIM sine(31) as uByte => { _
        16, 19, 22, 25, 27, 29, 30, 31, 31, 31, 30, 29, 27, 25, 22, 19, _
        16, 12, 09, 06, 04, 02, 01, 00, 00, 00, 01, 02, 04, 06, 09, 12 }

    DIM cursor as uByte
    DIM wraps as uInteger

    ' Reads and writes bank-local data. Ordinary code - the bank is
    ' already paged in, because this routine is in it.
    FUNCTION NextSine() as uByte
        DIM v as uByte
        v = sine(cursor)
        cursor = cursor + 1
        IF cursor = 32 THEN
            cursor = 0
            wraps = wraps + 1
        END IF
        RETURN v
    END FUNCTION

    FUNCTION Wraps() as uInteger
        RETURN wraps
    END FUNCTION

    ' A same-bank call: no paging, no shadow stack frame, and the
    ' bank-local data stays mapped throughout.
    FUNCTION SineAt(i as uByte) as uByte
        RETURN sine(i BAND 31)
    END FUNCTION

END CODEBANK

' ---- bank 2: the name table -----------------------------------
' Its own private storage, which the map file shows sitting at the
' same window addresses as bank 1's. Each bank still sees its own.
CODEBANK 2

    DIM widths(5) as uByte => { 3, 5, 4, 6, 4, 5 }
    DIM picked as uByte
    
    FUNCTION PickWidth(n as uByte) as uByte
        picked = picked + 1
        RETURN widths(n MOD 6)
    END FUNCTION

    ' Bank 2 -> bank 1. The far call pages bank 1 in, NextSine()
    ' works on bank 1's data, and on return bank 2 is paged back
    ' with `picked` and `widths` exactly as they were.
    FUNCTION Mixed(n as uByte) as uInteger
        DIM w as uByte
        w = PickWidth(n)
        RETURN w * 100 + NextSine()
    END FUNCTION

    sub testme()
        print
    end sub 
END CODEBANK

' ---- resident: the main loop ----------------------------------
BORDER 0 : PAPER 0 : INK 7 : CLS

BBREAK 
testme()

PRINT AT 0,2;"BANK-LOCAL DATA"
PRINT AT 1,2;"TABLES LIVE IN THE BANK"

DIM i as uByte
FOR i = 0 TO 31
    total = total + SineAt(i)       ' bank 1
NEXT i
PRINT AT 3,2;"SINE TABLE TOTAL ";total;"  "

FOR i = 0 TO 40
    frame = frame + Mixed(i)        ' bank 2, which calls into bank 1
NEXT i

PRINT AT 4,2;"MIXED TOTAL      ";frame;"  "
PRINT AT 5,2;"SINE WRAPS       ";Wraps();"  "

PRINT AT 7,2;"PRESS A KEY"
DIM k as String
DO
    k = INKEY$
LOOP UNTIL k <> ""

' ---- what you cannot do ---------------------------------------
' Every one of these is a compile error, naming the variable and
' both banks. Uncomment one to see it.
'
'   total = sine(0)         ' resident code reaching into bank 1
'   PRINT cursor            ' likewise
'
' and inside CODEBANK 2, referring to bank 1's data:
'
'   RETURN widths(0) + sine(0)
'
' The error is reported at the BASIC line. Hand-written asm that
' names a bank label from the wrong place is caught too, by the
' assembler, which reports the label and the bank it lives in.
'
' One case the compiler can only warn about [W310]: passing a
' bank-local variable ByRef to a routine that is not in the same
' bank. The callee gets a plain address, and by the time it runs
' the bank has already been paged out. Copy the value instead.
