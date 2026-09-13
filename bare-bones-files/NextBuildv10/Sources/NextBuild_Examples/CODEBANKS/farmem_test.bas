' ---------------------------------------------------------------
' farmem_test - FARPTR and the far-memory accessors.
'
' What it is really asserting is that the window always comes back:
' every accessor pages a bank in, does its work, and restores whatever
' bank the caller was running in. So the same calls are made from the
' resident program *and* from inside a bank, and after each one the
' caller reads its own data again to prove it is still mapped.
'
' Self-checking, the same way array_test is: each Ck() writes a
' pass/fail byte to RESULTS + n and bumps two counters, so run_far.py
' can name the source line of anything that failed.
'
'   python3 run_far.py <bin> <banks.json> <map> 32768 farmem_test.bas
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40
#include <nextlib.bas>
#include <farmem.bas>

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


' ===== the banks ================================================
CODEBANK 1
    ' Raw bytes, named by a module-level label. Both banks put their
    ' data at the same window addresses, so reading the wrong one is
    ' not a subtle failure.
    tiles:
    asm
        defb 10, 20, 30, 40, 50, 60, 70, 80
    end asm

    word1:
    asm
        defw 4660               ; $1234
    end asm

    msg1:
    asm
        defw 11
        defb "hello bank1"
    end asm

    scratch1:
    asm
        defb 0, 0, 0, 0
    end asm

    ' Bank-local storage declared in BASIC, to check FARPTR reaches a
    ' DIM as readily as an asm label.
    DIM lut1(3) as uByte => {1, 2, 3, 4}

    FUNCTION Own1() as uByte
        RETURN lut1(3)          ' 4, and only if bank 1 is mapped
    END FUNCTION
END CODEBANK

CODEBANK 2
    tiles2:
    asm
        defb 111, 112, 113, 114, 115, 116, 117, 118
    end asm

    msg2:
    asm
        defw 11
        defb "hello bank2"
    end asm

    DIM lut2(3) as uByte => {9, 8, 7, 6}

    FUNCTION Own2() as uByte
        RETURN lut2(0)          ' 9, and only if bank 2 is mapped
    END FUNCTION

    ' Reads bank 1 from inside bank 2. The window holds bank 2 on the
    ' way in; FarPeek replaces it with bank 1 and has to put it back,
    ' or the RETURN below reads the wrong page -- or is not even code.
    FUNCTION CrossRead() as uInteger
        DIM v as uByte
        v = FarPeek(FARPTR tiles + 2)   ' 30, out of bank 1
        RETURN v * 256 + lut2(0)        ' bank 2 must be mapped again
    END FUNCTION
END CODEBANK


' ===== resident state the tests read into =======================
DIM buf(7) as uByte
DIM src(3) as uByte => {201, 202, 203, 204}
DIM i as uByte
DIM v as uByte
DIM w as uInteger
DIM s as String

DIM residentTable(3) as uByte => {77, 78, 79, 80}


' ===== A: peeking =================================================
Ck(FarPeek(FARPTR tiles) = 10)
Ck(FarPeek(FARPTR tiles + 7) = 80)
Ck(FarPeek(FARPTR tiles2) = 111)         '  a different bank, same address
Ck(FarPeek(FARPTR tiles2 + 7) = 118)
Ck(FarPeekW(FARPTR word1) = 4660)

' FARPTR reaches a bank-local DIM, not just an asm label.
Ck(FarPeek(FARPTR lut1) = 1)
Ck(FarPeek(FARPTR lut1 + 3) = 4)
Ck(FarPeek(FARPTR lut1(2)) = 3)          '  constant subscript folds in
Ck(FarPeek(FARPTR lut2) = 9)

' Bank 0 is resident: mapping it restores the boot page, and the
' address was never in the window, so this is an ordinary read.
Ck(FarPeek(FARPTR residentTable) = 77)
Ck(FarPeek(FARPTR residentTable + 3) = 80)


' ===== B: the window comes back ===================================
' A banked routine still works after the resident program has borrowed
' the window for something in another bank.
Ck(Own1() = 4)
v = FarPeek(FARPTR tiles2)
Ck(Own1() = 4)                           '  bank 1 still reachable
Ck(Own2() = 9)
v = FarPeek(FARPTR tiles)
Ck(Own2() = 9)

' ...and the same from inside a bank: bank 2 reads bank 1 and carries on.
Ck(CrossRead() = 30 * 256 + 9)


' ===== C: copying out of a bank ===================================
FOR i = 0 TO 7
    buf(i) = 0
NEXT i
FarCopy(FARPTR tiles, @buf(0), 8)
Ck(buf(0) = 10)
Ck(buf(3) = 40)
Ck(buf(7) = 80)

' A short copy must not run past its count.
FOR i = 0 TO 7
    buf(i) = 0
NEXT i
FarCopy(FARPTR tiles + 2, @buf(0), 3)
Ck(buf(0) = 30)
Ck(buf(2) = 50)
Ck(buf(3) = 0)                           '  untouched

' A zero count copies nothing rather than 65536 bytes.
buf(0) = 171
FarCopy(FARPTR tiles, @buf(0), 0)
Ck(buf(0) = 171)

' The other bank, to prove the page really changes.
FarCopy(FARPTR tiles2, @buf(0), 8)
Ck(buf(0) = 111)
Ck(buf(7) = 118)


' ===== D: writing into a bank =====================================
FarPoke(FARPTR scratch1, 123)
Ck(FarPeek(FARPTR scratch1) = 123)

FarPokeW(FARPTR scratch1 + 2, 43981)     '  $ABCD
Ck(FarPeekW(FARPTR scratch1 + 2) = 43981)
Ck(FarPeek(FARPTR scratch1 + 2) = 205)   '  $CD, low byte first
Ck(FarPeek(FARPTR scratch1 + 3) = 171)   '  $AB

FarCopyTo(FARPTR scratch1, @src(0), 4)
Ck(FarPeek(FARPTR scratch1) = 201)
Ck(FarPeek(FARPTR scratch1 + 3) = 204)

' Writing into a bank must not have disturbed anything else in it.
Ck(FarPeek(FARPTR tiles) = 10)
Ck(Own1() = 4)


' ===== E: strings out of a bank ===================================
' The characters live in the bank; only the copy handed back is
' resident. The literals below are the resident half of the compare.
s = FarStr(FARPTR msg1)
Ck(LEN(s) = 11)
Ck(s = "hello bank1")

s = FarStr(FARPTR msg2)
Ck(s = "hello bank2")

' Round-trip: build a String twice and get the same thing, so the
' allocation is not leaving the window or the heap in a bad state.
s = FarStr(FARPTR msg1)
Ck(s = "hello bank1")
Ck(Own1() = 4)


' ===== summary ====================================================
CLS
PRINT AT 0,0;"FARMEM TEST"
PRINT AT 2,0;"CHECKS: ";t_run
PRINT AT 3,0;"FAILED: ";t_fail

DIM k as uInteger
FOR k = 0 TO t_run - 1
    IF PEEK(RESULTS + k) = 0 THEN
        PRINT "FAILED CHECK #";k
    END IF
NEXT k

' Park here so the summary stays on screen under CSpect. run_far.py
' stops at `finished`, so the same binary works headless.
finished:
do: loop
