' ---------------------------------------------------------------
' bank_data_large - proving bank-local data is free of the 32K
'
' Six code banks, each holding 6144 bytes of arrays:
'
'     DIM test(4095) as uByte      4096 bytes
'     DIM lut(1023)  as uInteger   2048 bytes
'
' That is 36864 bytes - 36K - of live, writable array storage in a
' program whose resident binary is 4745 bytes. Declare the same
' arrays outside a CODEBANK block and the resident binary becomes
' 41734 bytes, which at ORG $8000 runs nearly 9K past the top of
' memory. In a bank it costs the resident program nothing at all.
'
' Each bank's arrays are assembled at the code-window address, so
' all six `test` arrays land within a few bytes of $6170 and are
' told apart purely by which 8K page is mapped. The .map file shows
' this: every one of these labels is prefixed B1: .. B6:, while the
' resident globals stay up at $84xx.
'
' Each bank fills its own arrays and sums them back. The lut in
' bank n is scaled by n, so the six checksums are visibly different
' - if paging were wrong, and one bank could see another's storage,
' they would not be.
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40           ' CODEBANK 1 -> page 40 ... CODEBANK 6 -> page 45

#include <nextlib.bas>

asm
    ei              ; enable for INKEY$
end asm

' ---- resident ------------------------------------------------
' All that lives out here is the totals and the loop below.
DIM grand as uLong
DIM udlen as uInteger
DIM row as uByte

CONST BANKED_BYTES as uLong = 36864     ' 6 banks x 6144

' ---- bank 1 ---------------------------------------------------
CODEBANK 1
    DIM test1(4095) as uByte            ' 4096 bytes, page 40
    DIM lut1(1023) as uInteger          ' 2048 bytes, same page

    SUB Fill1()
        DIM i as uInteger
        FOR i = 0 TO 4095 : test1(i) = (i + 1) BAND 255 : NEXT i
        FOR i = 0 TO 1023 : lut1(i) = i * 1 : NEXT i
    END SUB

    FUNCTION Sum1() as uLong
        DIM i as uInteger
        DIM t as uLong
        FOR i = 0 TO 4095 : t = t + test1(i) : NEXT i
        FOR i = 0 TO 1023 : t = t + lut1(i) : NEXT i
        RETURN t
    END FUNCTION
END CODEBANK

' ---- bank 2 ---------------------------------------------------
CODEBANK 2
    DIM test2(4095) as uByte
    DIM lut2(1023) as uInteger

    SUB Fill2()
        DIM i as uInteger
        FOR i = 0 TO 4095 : test2(i) = (i + 2) BAND 255 : NEXT i
        FOR i = 0 TO 1023 : lut2(i) = i * 2 : NEXT i
    END SUB

    FUNCTION Sum2() as uLong
        DIM i as uInteger
        DIM t as uLong
        FOR i = 0 TO 4095 : t = t + test2(i) : NEXT i
        FOR i = 0 TO 1023 : t = t + lut2(i) : NEXT i
        RETURN t
    END FUNCTION
END CODEBANK

' ---- bank 3 ---------------------------------------------------
CODEBANK 3
    DIM test3(4095) as uByte
    DIM lut3(1023) as uInteger

    SUB Fill3()
        DIM i as uInteger
        FOR i = 0 TO 4095 : test3(i) = (i + 3) BAND 255 : NEXT i
        FOR i = 0 TO 1023 : lut3(i) = i * 3 : NEXT i
    END SUB

    FUNCTION Sum3() as uLong
        DIM i as uInteger
        DIM t as uLong
        FOR i = 0 TO 4095 : t = t + test3(i) : NEXT i
        FOR i = 0 TO 1023 : t = t + lut3(i) : NEXT i
        RETURN t
    END FUNCTION
END CODEBANK

' ---- bank 4 ---------------------------------------------------
CODEBANK 4
    DIM test4(4095) as uByte
    DIM lut4(1023) as uInteger

    SUB Fill4()
        DIM i as uInteger
        FOR i = 0 TO 4095 : test4(i) = (i + 4) BAND 255 : NEXT i
        FOR i = 0 TO 1023 : lut4(i) = i * 4 : NEXT i
    END SUB

    FUNCTION Sum4() as uLong
        DIM i as uInteger
        DIM t as uLong
        FOR i = 0 TO 4095 : t = t + test4(i) : NEXT i
        FOR i = 0 TO 1023 : t = t + lut4(i) : NEXT i
        RETURN t
    END FUNCTION
END CODEBANK

' ---- bank 5 ---------------------------------------------------
CODEBANK 5
    DIM test5(4095) as uByte
    DIM lut5(1023) as uInteger

    SUB Fill5()
        DIM i as uInteger
        FOR i = 0 TO 4095 : test5(i) = (i + 5) BAND 255 : NEXT i
        FOR i = 0 TO 1023 : lut5(i) = i * 5 : NEXT i
    END SUB

    FUNCTION Sum5() as uLong
        DIM i as uInteger
        DIM t as uLong
        FOR i = 0 TO 4095 : t = t + test5(i) : NEXT i
        FOR i = 0 TO 1023 : t = t + lut5(i) : NEXT i
        RETURN t
    END FUNCTION
END CODEBANK

' ---- bank 6 ---------------------------------------------------
CODEBANK 6
    DIM test6(4095) as uByte
    DIM lut6(1023) as uInteger

    SUB Fill6()
        DIM i as uInteger
        FOR i = 0 TO 4095 : test6(i) = (i + 6) BAND 255 : NEXT i
        FOR i = 0 TO 1023 : lut6(i) = i * 6 : NEXT i
    END SUB

    FUNCTION Sum6() as uLong
        DIM i as uInteger
        DIM t as uLong
        FOR i = 0 TO 4095 : t = t + test6(i) : NEXT i
        FOR i = 0 TO 1023 : t = t + lut6(i) : NEXT i
        RETURN t
    END FUNCTION
END CODEBANK

' ---- resident: drive them all ---------------------------------
BORDER 0 : PAPER 0 : INK 7 : CLS

PRINT AT 0,2;"36K OF ARRAYS IN 6 BANKS"

' Every one of these pages a bank in, works on 6K of its own
' storage, and pages the previous one back on the way out.
PRINT AT 1,2;"FILLING..."
Fill1() : Fill2() : Fill3()
Fill4() : Fill5() : Fill6()

' Six different checksums, because each bank saw only its own data.
PRINT AT 1,2;"BANK CHECKSUMS    "

row = 3
PRINT AT row,2;"1 ";Sum1();"    " : row = row + 1
PRINT AT row,2;"2 ";Sum2();"    " : row = row + 1
PRINT AT row,2;"3 ";Sum3();"    " : row = row + 1
PRINT AT row,2;"4 ";Sum4();"    " : row = row + 1
PRINT AT row,2;"5 ";Sum5();"    " : row = row + 1
PRINT AT row,2;"6 ";Sum6();"    " : row = row + 1

grand = Sum1() + Sum2() + Sum3() + Sum4() + Sum5() + Sum6()
PRINT AT 10,2;"GRAND TOTAL ";grand;"    "

' What all of that cost the resident program: the variable area is
' the heap plus every global declared *outside* a CODEBANK block.
' The 36K above is not in it.
asm
    ld hl, .core.ZXBASIC_USER_DATA_LEN
    ld (._udlen), hl
end asm

PRINT AT 12,2;"BANKED ARRAYS  ";BANKED_BYTES;" BYTES"
PRINT AT 13,2;"RESIDENT VARS  ";udlen;" BYTES (INCL HEAP)"

PRINT AT 15,2;"PRESS A KEY"
DIM k as String
DO
    k = INKEY$
LOOP UNTIL k <> ""

' ---- expected output ------------------------------------------
'
'   1  1046016      4  2617344
'   2  1569792      5  3141120
'   3  2093568      6  3664896
'   GRAND TOTAL 14132736
'
' Every bank's uByte array sums to the same 522240 (4096 bytes of
' a 256-cycle); the difference between the six is entirely its lut.
'
' Note BAND, not AND: in Boriel `AND` is *logical*, so `x AND 255`
' is 1 for any non-zero x. Bitwise wants BAND / BOR / BXOR / BNOT.
'
' ---- where to look --------------------------------------------
'
'   <name>.map         every array label prefixed B1: .. B6:, the six
'                      `test` arrays all around $6170, resident at $84xx
'   <name>.banks.json  six entries of 6515..6530 bytes, 39153 total
'   <name>.bin         4745 bytes, and it does not grow by one byte
'                      when you add a seventh bank
'
' To see the contrast, move one array out of its bank - delete the
' CODEBANK/END CODEBANK around it - and the resident binary goes
' from 4745 to 8852 bytes: 4096 for the data plus 11 for the array
' header and dimension table. Move all twelve out and it becomes
' 41734 bytes. Note that nothing complains about that; zxbc does
' not check ORG + length against the top of memory, so it is on you
' to keep an eye on the resident size.
