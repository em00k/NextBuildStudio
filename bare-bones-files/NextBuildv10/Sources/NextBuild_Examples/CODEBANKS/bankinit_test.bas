' ---------------------------------------------------------------
' bankinit_test - a bank-local DIM with a non-static initialiser.
'
' Only a compile-time constant becomes storage. Every String, and any
' expression that is not constant, is deferred into a LET that lands in
' the *resident* main body -- even between CODEBANK and END CODEBANK.
' For a bank-local variable that is resident code writing into a bank,
' which the assembler rejects.
'
' The fix runs each such initialisation inside its own bank, through a
' synthesised SUB and the ordinary trampoline. This asserts that the
' values actually arrive, and that they arrive in source order.
'
'   python3 run_far.py <bin> <banks.json> <map> 32768 bankinit_test.bas
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40
#include <nextlib.bas>

#define RESULTS 61440          ' $F000, clear of the program and the heap

DIM t_run as uInteger          ' checks executed
DIM t_fail as uInteger         ' of those, failed

SUB Ck(ok as uByte)
    POKE RESULTS + t_run, ok
    IF ok = 0 THEN
        t_fail = t_fail + 1
    END IF
    t_run = t_run + 1
END SUB

DIM seed as uInteger = 1       ' resident, static

FUNCTION Src() as uInteger
    RETURN 1234
END FUNCTION


' ===== bank 1: every shape of initialiser ========================
CODEBANK 1
    DIM sStatic as uByte = 85                    ' static: storage in the bank
    DIM aStatic(3) as uByte => {1, 2, 3, 4}      ' static: storage in the bank
    DIM s$ as String = "test"                    ' String: always deferred
    DIM nCall as uInteger = Src()                ' not constant: deferred
    DIM nVar as uInteger = seed                  ' not constant: deferred
    DIM first as uInteger = seed                 ' reads seed *before* it moves

    ' Everything bank-local has to be read from inside the bank.
    FUNCTION B1Static() as uByte
        RETURN sStatic
    END FUNCTION

    FUNCTION B1Arr() as uByte
        RETURN aStatic(3)
    END FUNCTION

    FUNCTION B1Str() as uByte
        RETURN (s$ = "test")
    END FUNCTION

    FUNCTION B1StrLen() as uByte
        RETURN LEN(s$)
    END FUNCTION

    FUNCTION B1Call() as uInteger
        RETURN nCall
    END FUNCTION

    FUNCTION B1Var() as uInteger
        RETURN nVar
    END FUNCTION

    FUNCTION B1First() as uInteger
        RETURN first
    END FUNCTION

    ' A *local* String default is on the stack, so it is resident whatever
    ' bank the routine is in. It must still work.
    FUNCTION B1Local() as uByte
        DIM loc$ as String = "loc"
        RETURN (loc$ = "loc")
    END FUNCTION
END CODEBANK


' A resident statement between the two blocks. The second bank's
' initialiser must see this, and the first must not.
seed = 2


' ===== bank 2: a different bank, and the order check ==============
CODEBANK 2
    DIM s2$ as String = "two"
    DIM second as uInteger = seed                ' reads seed *after* it moved

    FUNCTION B2Str() as uByte
        RETURN (s2$ = "two")
    END FUNCTION

    FUNCTION B2Second() as uInteger
        RETURN second
    END FUNCTION
END CODEBANK


' ===== resident, for comparison ==================================
DIM rs$ as String = "resident"
DIM rn as uInteger = Src()


' ===== checks =====================================================
' Static initialisers are unchanged: still storage, still in the bank.
Ck(B1Static() = 85)
Ck(B1Arr() = 4)

' Deferred initialisers now actually run.
Ck(B1Str() <> 0)
Ck(B1StrLen() = 4)
Ck(B1Call() = 1234)
Ck(B1Var() = 1)
Ck(B2Str() <> 0)

' Order: bank 1 read seed before the resident assignment, bank 2 after.
Ck(B1First() = 1)
Ck(B2Second() = 2)

' A local String default is on the stack and unaffected.
Ck(B1Local() <> 0)

' Resident initialisers are untouched by any of this.
Ck(rs$ = "resident")
Ck(rn = 1234)
Ck(seed = 2)

' Reading a banked String twice gives the same thing, so the deferred
' store left the heap in a sane state.
Ck(B1Str() <> 0)
Ck(B1StrLen() = 4)


' ===== summary ====================================================
CLS
PRINT AT 0,0;"BANKINIT TEST"
PRINT AT 2,0;"CHECKS: ";t_run
PRINT AT 3,0;"FAILED: ";t_fail

DIM k as uInteger
FOR k = 0 TO t_run - 1
    IF PEEK(RESULTS + k) = 0 THEN
        PRINT "FAILED CHECK #";k
    END IF
NEXT k

finished:
do: loop
