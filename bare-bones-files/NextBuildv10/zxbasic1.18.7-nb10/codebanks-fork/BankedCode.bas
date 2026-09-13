' ---------------------------------------------------------------
' BankedCode - demonstrates ZX Next banked code (CODEBANK)
'
' Every SUB/FUNCTION inside a CODEBANK block is compiled into its
' own 8K binary that gets paged into $6000-$7FFF on demand. Calls
' are written exactly as normal - the compiler emits a resident
' trampoline that pages the bank in and out for you.
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40           ' CODEBANK 1 -> 8K page 40, CODEBANK 2 -> 41

#include <nextlib.bas>

' ---- bank 1 --------------------------------------------------
CODEBANK 1

    SUB Hello()
        PRINT AT 2,2;"HELLO FROM BANK 1"
    END SUB

    FUNCTION Helper(n as uByte) as uInteger
        RETURN n * 100
    END FUNCTION

    FUNCTION AddU(a as uInteger, b as uInteger) as uInteger
        ' Helper() is in this same bank, so this call takes the
        ' far-call fast path - no paging, no shadow stack frame.
        RETURN a + b + Helper(1)
    END FUNCTION

END CODEBANK

' ---- bank 2 --------------------------------------------------
CODEBANK 2

    SUB Bye(msg as uByte)
    
        Hello()                     ' bank 2 -> bank 1 -> back to bank 2
        PRINT AT 8,2;"BYE ";msg
    END SUB

END CODEBANK

' ---- resident ------------------------------------------------
SUB Resident()
    PRINT AT 0,2;"RESIDENT"
END SUB

Resident()
BBREAK 
Hello()

PRINT AT 4,2;"SUM=";AddU(40,2)      ' expect 142
PRINT AT 6,2;"HLP=";Helper(2)       ' expect 200
                           
Bye(7)

DO
LOOP
