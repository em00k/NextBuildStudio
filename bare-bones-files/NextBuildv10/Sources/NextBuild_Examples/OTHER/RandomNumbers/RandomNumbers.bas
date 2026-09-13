' Project: RandomNumbers
' Type: Layer 2
'
' nextlib_rnd.bas - RndSeed, RndByte, RndWord, RndBelow, RndRange.
'
' The first screen is the reason RndBelow exists. It draws two histograms of
' 12800 numbers in the range 0-99: the top one from RndBelow(100), the bottom
' from the obvious `RndByte() MOD 100`. The modulo version has a visible step
' at bucket 56, because 256 does not divide by 100 - values 0-55 can be
' reached three ways out of every 256 draws and values 56-99 only two. That is
' a 50% bias, and it is completely invisible if you just look at the numbers.
'
' em00k

'!org=$c000
'!codebank=30               ' CODEBANK 1 -> 8K page 30

#define NEX
#define IM2

#include <nextlib.bas>
#include <nextlib_rnd.bas>

' The drawing goes in a bank; the generator does not. nextlib_rnd holds state
' and is small, so it is left resident where an interrupt handler can reach
' it. Banking it is fine too, as long as nothing in an ISR calls it - a banked
' routine called from an ISR reads whatever page happens to be mapped.
#pragma codebank = 1
#include <nextlib_primitives.bas>
#pragma codebank = 0

CONST FONT as uByte = 32
CONST SAMPLES as uInteger = 12800   ' 128 per bucket on average

DIM i as uInteger
DIM v as uInteger
DIM fair(99) as uInteger            ' counts from RndBelow(100)
DIM naive(99) as uInteger           ' counts from RndByte() MOD 100

LoadSDBank("[]font5.fnt", 0, 0, 0, 32)   ' nextbuild.py wants a literal bank here
InitLayer2(MODE320X256)
ShowLayer2(1)

' ---- screen 1: the distributions -----------------------------------
ClearLayer2(0)
FL2Text(0, 0, "RNDBELOW(100) - FLAT", FONT)
FL2Text(0, 1, "RNDBYTE() MOD 100 - BIASED", FONT)

' Gather first, draw after. 12800 samples of each takes about a second,
' most of which is the array indexing - every subscript in Boriel is a
' runtime call, so a tight sampling loop is not free.
FOR i = 0 TO SAMPLES
    v = RndBelow(100)
    fair(v) = fair(v) + 1
    v = RndByte() MOD 100
    naive(v) = naive(v) + 1
NEXT i

' Three pixels per bucket, so 100 buckets fill 300 of the 320 columns.
FOR i = 0 TO 99
    v = fair(i) / 2                         ' about 64 pixels tall when flat
    IF v > 100 THEN
        v = 100
    END IF
    L2FillBox(10 + i * 3, 118 - v, 12 + i * 3, 118, 40)

    v = naive(i) / 2
    IF v > 100 THEN
        v = 100
    END IF
    ' colour the two halves differently so the step is unmissable
    IF i < 56 THEN
        L2FillBox(10 + i * 3, 246 - v, 12 + i * 3, 246, 224)
    ELSE
        L2FillBox(10 + i * 3, 246 - v, 12 + i * 3, 246, 28)
    END IF
NEXT i

FL2Text(0, 16, "BUCKETS 0-55 GET 50% MORE", FONT)
WaitKey()

' ---- screen 2: the same seed replays -------------------------------
ClearLayer2(0)
FL2Text(0, 0, "SAME SEED, SAME PICTURE", FONT)

' Both rows are drawn from seed 1234, so they are identical. That is what
' makes a replay, or a procedurally generated level, reproducible - and it
' is why the tests can pin the sequence to a golden vector.
FOR v = 0 TO 1
    RndSeed(1234)
    FOR i = 0 TO 299
        L2Plot(10 + i, 40 + v * 60 + RndBelow(48), 16 + RndBelow(200))
    NEXT i
NEXT v

FL2Text(0, 1, "RNDSEED(0) - DIFFERENT EVERY RUN", FONT)

' Seeding with 0 takes the seed from the raster position instead, which is
' as good as unpredictable once a human has pressed a key.
RndSeed(0)
FOR i = 0 TO 299
    L2Plot(10 + i, 200 + RndBelow(48), 16 + RndBelow(200))
NEXT i
WaitKey()

' ---- screen 3: the everyday calls ----------------------------------
ClearLayer2(0)
FL2Text(0, 0, "RNDRANGE AND RNDWORD", FONT)

' RndRange(lo, hi) is inclusive at both ends, and copes with 0-255 even
' though hi - lo + 1 is 256, which will not fit in a uByte.
DO
    FOR i = 0 TO 199
        ' RndRange is uByte, so it cannot reach across a 320 pixel screen -
        ' RndRangeW is the 16-bit form and is what X coordinates want.
        L2FillCircle(RndRangeW(20, 300), RndRange(30, 230), _
                     RndRange(2, 10), RndRange(16, 230))
    NEXT i
    WaitRetrace(25)
    ClearLayer2(0)
    FL2Text(0, 0, "RNDRANGE AND RNDWORD", FONT)
LOOP
