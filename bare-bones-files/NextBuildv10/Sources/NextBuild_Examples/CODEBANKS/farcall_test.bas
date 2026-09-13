#pragma zxnext = TRUE
DIM r1 as uByte     AT $9000
DIM r2 as uInteger  AT $9002
DIM r3 as uLong     AT $9004
DIM r4 as uInteger  AT $9008
DIM r5 as uByte     AT $900A
DIM guard as uInteger AT $900C
DIM regs as uInteger AT $900E
DIM r6 as uInteger  AT $9010
DIM r7 as uByte     AT $9012
DIM r8 as uInteger  AT $9014
DIM r9 as uInteger  AT $9016

CODEBANK 1
    ' Bank-local data. Emitted into bank 1's page, so it sits at roughly the
    ' same window addresses as bank 2's below -- the whole point of the test is
    ' that each bank still sees its own.
    DIM lut(7) as uByte => { 3, 1, 4, 1, 5, 9, 2, 6 }
    DIM hits as uByte

    FUNCTION Helper(n as uByte) as uInteger
        RETURN n * 100
    END FUNCTION
    FUNCTION AddU(a as uInteger, b as uInteger) as uInteger
        RETURN a + b + Helper(1)          ' same-bank call: fast path
    END FUNCTION
    FUNCTION Byte1() as uByte
        RETURN 42
    END FUNCTION
    FUNCTION Long1() as uLong
        RETURN 305419896                  ' $12345678
    END FUNCTION

    FUNCTION SumLut() as uInteger
        DIM i as uByte
        DIM t as uInteger
        hits = hits + 1
        FOR i = 0 TO 7
            t = t + lut(i)
        NEXT i
        RETURN t
    END FUNCTION

    FUNCTION Hits() as uByte
        RETURN hits
    END FUNCTION
END CODEBANK

CODEBANK 2
    ' Bank 2's own private data, at the same window addresses as bank 1's
    DIM tally as uInteger
    DIM seed(3) as uInteger => { 1000, 2000, 3000, 4000 }

    FUNCTION Nested(x as uInteger) as uInteger
        ' bank 2 -> bank 1 -> back into bank 2
        RETURN AddU(x, 1) + Helper(2)
    END FUNCTION

    FUNCTION Bump(i as uByte) as uInteger
        ' Reads bank 2's data, far-calls into bank 1 (which touches bank 1's
        ' data), then reads bank 2's data again. Both must be intact.
        tally = tally + seed(i)
        tally = tally + SumLut()
        RETURN tally + seed(i)
    END FUNCTION
END CODEBANK

SUB Resident()
    guard = guard + 7
END SUB

Resident()
r1 = Byte1()          ' expect 42
r2 = AddU(40, 2)      ' 40+2+100 = 142
r3 = Long1()          ' 305419896
r4 = Nested(10)       ' (10+1+100) + 200 = 311
r5 = Byte1()          ' 42 again, after the bank has changed

' --- bank-local data ---------------------------------------------------
r6 = SumLut()         ' 3+1+4+1+5+9+2+6 = 31, read out of bank 1
r8 = Bump(1)          ' tally = 2000 + 31 = 2031, + seed(1) = 4031
r9 = SumLut()         ' still 31: bank 2's activity did not disturb bank 1
r7 = Hits()           ' 3 calls to SumLut(), counted in bank-local storage

' register-preservation check: BC/DE/IX/IY must survive a far call
asm
    ld   bc, $1234
    ld   de, $5678
    ld   ix, $9ABC
    ld   iy, $DEF0
    push bc : push de : push ix : push iy
end asm
r2 = AddU(40, 2)
asm
    pop  iy : pop  ix : pop  de : pop  bc
    ld   hl, 0
    ld   a, b : cp $12 : jr nz, badregs
    ld   a, c : cp $34 : jr nz, badregs
    ld   a, d : cp $56 : jr nz, badregs
    ld   a, e : cp $78 : jr nz, badregs
    push ix : pop de
    ld   a, d : cp $9A : jr nz, badregs
    ld   a, e : cp $BC : jr nz, badregs
    push iy : pop de
    ld   a, d : cp $DE : jr nz, badregs
    ld   a, e : cp $F0 : jr nz, badregs
    ld   hl, $A5A5              ; all registers survived
badregs:
    ld   ($900E), hl
end asm
