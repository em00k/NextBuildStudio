' ---------------------------------------------------------------
' array_test - exercises every shape of DIM and checks the values.
'
' Self-checking: each Ck() writes a pass/fail byte to RESULTS + n and
' bumps two counters. run_far.py maps each result byte back to the
' Ck() that produced it, so a failure names its own source line, and
' the count says how far the program got if it died part way.
'
'   python3 run_far.py <bin> <banks.json> <map>
'
' Note on Float: Boriel's float *arithmetic* goes through the Spectrum
' ROM calculator, which the emulator does not have -- comparing two
' Floats runs off into unmapped memory and ends as "step limit
' exceeded". Float is therefore checked by its stored bytes,
' which is what an array test is actually about -- element size and
' stride. Every other type is compared normally.
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

DIM i as Integer
DIM j as Integer
DIM sum as Integer
DIM p as uInteger

' ===== A: global 1D arrays, every numeric type ===========
DIM ab(4) as uByte
DIM asb(4) as Byte
DIM aui(4) as uInteger
DIM ai(4) as Integer
DIM aul(3) as uLong
DIM al(3) as Long
DIM afx(3) as Fixed
DIM afl(3) as Float

Ck(ab(0) = 0)   '  zero-initialised
Ck(aui(4) = 0)
Ck(al(3) = 0)

ab(0) = 255 : ab(4) = 7
Ck(ab(0) = 255)   '  full range, both ends
Ck(ab(4) = 7)

asb(0) = -128 : asb(4) = 127
Ck(asb(0) = -128)
Ck(asb(4) = 127)

aui(0) = 65535 : aui(3) = 1234
Ck(aui(0) = 65535)
Ck(aui(3) = 1234)

ai(0) = -32768 : ai(3) = 32767
Ck(ai(0) = -32768)
Ck(ai(3) = 32767)

aul(0) = 4294967295 : aul(2) = 70000
Ck(aul(0) = 4294967295)
Ck(aul(2) = 70000)

al(0) = -2147483647 : al(2) = -70000
Ck(al(0) = -2147483647)
Ck(al(2) = -70000)

afx(0) = 1.5 : afx(2) = -2.25
Ck(afx(0) = 1.5)
Ck(afx(2) = -2.25)

' Float: same value at both ends, compared byte by byte (5 per element)
afl(0) = 1.5 : afl(3) = 1.5
p = @afl(0)
Ck(PEEK(p) = PEEK(p + 15))   ' stride is 5 bytes
Ck(PEEK(p + 1) = PEEK(p + 16))
Ck(PEEK(p + 5) = 0)   ' element 1 untouched

' subscript forms
FOR i = 0 TO 4
    ab(i) = i * 2
NEXT i
Ck(ab(0) = 0)   ' variable subscript
Ck(ab(3) = 6)
i = 1
Ck(ab(i + 2) = 6)   ' expression subscript
Ck(ab(2 * 2) = 8)   ' constant expression

sum = 0
FOR i = 0 TO 4
    sum = sum + ab(i)
NEXT i
Ck(sum = 20)   ' every element distinct

' ===== B: initialisers ==================================
DIM ini(4) as uByte => {10, 20, 30, 40, 50}
DIM iniw(3) as uInteger => {1000, 2000, 3000, 4000}

Ck(ini(0) = 10)
Ck(ini(4) = 50)
Ck(ini(2) = 30)
Ck(iniw(0) = 1000)
Ck(iniw(3) = 4000)
i = 3
Ck(iniw(i) = 4000)   ' variable subscript on init

' ===== C: multi-dimensional =============================
DIM g2(2, 3) as uByte
DIM g2i(1, 2) as uByte => {{1, 2, 3}, {4, 5, 6}}
DIM g3(1, 1, 1) as uInteger

g2(0, 0) = 1 : g2(2, 3) = 99 : g2(1, 2) = 42
Ck(g2(0, 0) = 1)
Ck(g2(2, 3) = 99)   ' last element of both dims
Ck(g2(1, 2) = 42)   ' interior element
Ck(g2(0, 1) = 0)   ' neighbour untouched

Ck(g2i(0, 0) = 1)   ' 2D initialiser
Ck(g2i(1, 2) = 6)

g3(0, 0, 0) = 111 : g3(1, 1, 1) = 999
Ck(g3(0, 0, 0) = 111)   ' three dimensions
Ck(g3(1, 1, 1) = 999)

' ===== D: explicit bounds ======================================
DIM one(1 TO 5) as uByte

one(1) = 11 : one(5) = 55
Ck(one(1) = 11)
Ck(one(5) = 55)
i = 5
Ck(one(i) = 55)   ' variable subscript


' ===== E: LBOUND / UBOUND ======================================
' Dimensions are 1-based, and dimension 0 asks how many there are.
Ck(LBound(ab, 1) = 0)
Ck(UBound(ab, 1) = 4)
Ck(LBound(one, 1) = 1)   ' explicit lower bound
Ck(UBound(one, 1) = 5)
Ck(UBound(g2, 1) = 2)   ' first dimension of a 2D array
Ck(UBound(g2, 2) = 3)   ' second
Ck(LBound(g2, 0) = 2)   ' dimension 0 = number of dimensions
Ck(UBound(g3, 0) = 3)

' A literal dimension is constant-folded, so these also go through the
' runtime with the index in a variable -- a different path, and the one
' that needs the LBOUND/UBOUND tables to have been emitted.
j = 1
Ck(UBound(ab, j) = 4)
Ck(LBound(one, j) = 1)
Ck(UBound(one, j) = 5)
j = 2
Ck(UBound(g2, j) = 3)

' ===== F: local arrays, on the IX frame =================
SUB Locals()
    DIM loc(4) as uInteger
    DIM loci(2) as uByte => {7, 8, 9}
    DIM k as uByte

    Ck(loc(0) = 0)   ' locals are zero-filled
    loc(0) = 4321 : loc(4) = 1
    Ck(loc(0) = 4321)
    Ck(loc(4) = 1)
    Ck(loci(1) = 8)   ' local initialiser
    k = 2
    Ck(loci(k) = 9)
END SUB
Locals()

' Called twice: a local array must be re-initialised on each entry, not
' left holding the previous call's values. The verdict is accumulated and
' checked once afterwards, so that every Ck() in this file runs exactly
' once -- which is what lets run_far.py map a result back to its line.
DIM fresh_ok as uByte
SUB LocalsAgain()
    DIM fresh(2) as uByte
    IF fresh(1) <> 0 THEN
        fresh_ok = 0
    END IF
    fresh(1) = 200
END SUB
fresh_ok = 1
LocalsAgain()
LocalsAgain()
Ck(fresh_ok = 1)

' ===== G: DIM ... AT a fixed address ====================
DIM atfx(3) as uByte AT 62000                    ' $F230, above RESULTS
atfx(0) = 11 : atfx(3) = 44
Ck(atfx(0) = 11)
Ck(atfx(3) = 44)
Ck(PEEK(62000) = 11)   ' really at that address
Ck(PEEK(62003) = 44)

' ===== H: DIM ... AT a label ============================
DIM atl(3) as uByte AT @blob
Ck(atl(0) = 1)   ' sees the blob's bytes
Ck(atl(3) = 4)
atl(1) = 200
Ck(PEEK(@blob + 1) = 200)   ' writes land in the blob

' ===== I: whole-array copy ==============================
DIM src(4) as uByte => {5, 6, 7, 8, 9}
DIM dst(4) as uByte
dst = src
Ck(dst(0) = 5)
Ck(dst(4) = 9)
dst(0) = 100
Ck(src(0) = 5)   ' copy, not an alias
Ck(dst(0) = 100)

DIM src2(1, 2) as uByte => {{1, 2, 3}, {4, 5, 6}}
DIM dst2(1, 2) as uByte
dst2 = src2
Ck(dst2(1, 2) = 6)   ' multi-dimensional copy

' ===== J: arrays as parameters ==========================
SUB Fill(a() as uByte, v as uByte)
    DIM n as uByte
    FOR n = 0 TO 4
        a(n) = v
    NEXT n
END SUB

FUNCTION SumOf(a() as uByte) as uInteger
    DIM n as uByte
    DIM s as uInteger
    s = 0
    FOR n = 0 TO 4
        s = s + a(n)
    NEXT n
    RETURN s
END FUNCTION

Fill(dst, 3)
Ck(dst(0) = 3)   ' callee wrote through
Ck(dst(4) = 3)
Ck(SumOf(dst) = 15)   ' read through
Ck(SumOf(src) = 35)

' ===== K: string arrays =================================
DIM sarr(3) as String
DIM joined as String

Ck(sarr(0) = "")   ' empty to start
sarr(0) = "hello"
sarr(3) = "world"
Ck(sarr(0) = "hello")
Ck(sarr(3) = "world")
Ck(sarr(1) = "")   ' neighbour untouched
i = 3
Ck(sarr(i) = "world")   ' variable subscript
joined = sarr(0) + " " + sarr(3)
Ck(joined = "hello world")   ' concatenation

' ===== L: arrays inside a CODEBANK ======================
CODEBANK 1
    DIM bank1(4) as uByte => {1, 2, 3, 4, 5}
    DIM bank1w(2) as uInteger

    ' AT a label in the same bank -- the descriptor has to live here too
    DIM bankat(3) as uByte AT @bankblob

    SUB BankChecks()
        DIM n as uByte
        Ck(bank1(0) = 1)   ' bank-local initialiser
        Ck(bank1(4) = 5)
        bank1w(0) = 4321
        Ck(bank1w(0) = 4321)   ' bank-local read/write
        n = 2
        Ck(bank1(n) = 3)   ' variable subscript in a bank
        Ck(bankat(0) = 9)   ' AT a bank-local label
        Ck(bankat(3) = 12)
    END SUB

    bankblob:
    asm
        defb 9, 10, 11, 12
    end asm
END CODEBANK

BankChecks()

' ===== summary =================================================
' Also printed, so the thing can be run on real hardware or CSpect
' without reading 88 bytes out of a memory dump. Boriel implements
' PRINT itself rather than calling the ROM, so this is still safe to
' run under run_far.py.
DIM n as uInteger

CLS
PRINT AT 0,0;"ARRAY TEST"
PRINT AT 2,0;"CHECKS: ";t_run
PRINT AT 3,0;"FAILED: ";t_fail
IF t_fail = 0 THEN
    PRINT AT 5,0;"ALL PASS"
ELSE
    PRINT AT 5,0;"FAILING CHECKS:"
    FOR n = 0 TO t_run - 1
        IF PEEK(RESULTS + n) = 0 THEN
            PRINT n;" ";
        END IF
    NEXT n
END IF

' Hold here so the summary stays on screen under CSpect. This also stops
' the data below being executed as instructions on the way past, which is
' what an END would otherwise be needed for.
'
' run_far.py stops at `finished` if the map has it, so the same binary
' works headless -- everything above has already run by then.
finished:
do: loop

' ===== resident data the tests above point at ===================
blob:
asm
    defb 1, 2, 3, 4
end asm
