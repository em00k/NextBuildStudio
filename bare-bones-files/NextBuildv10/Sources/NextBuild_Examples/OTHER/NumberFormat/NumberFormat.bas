' Project: NumberFormat
' Type: Layer 2
'
' nextlib_fmt.bas - fixed width numbers for a HUD.
'
' The problem it solves is on the left of the screen: an unpadded number
' changes width as it grows, so the whole field jumps about. Everything in
' the right hand column is padded to a fixed width and sits still.
'
' There are two ways in, and they are for different jobs:
'
'   Fmt*(buf, ...)  writes ASCII into a buffer you own. No heap, no
'                   allocation, safe from an interrupt handler - this is the
'                   one for a HUD you redraw every frame, or for poking
'                   characters straight into a tilemap.
'   RJust/ZeroPad   return a String, which is what PRINT and FL2Text want.
'                   They allocate, so use them where the value changes now
'                   and then rather than sixty times a second.
'
' FmtStr() bridges the two: it turns n bytes of a buffer into a String.
'
' em00k

'!org=$c000
'!codebank=30               ' CODEBANK 1 -> 8K page 30

#define NEX
#define IM2

#include <nextlib.bas>

#pragma codebank = 1
#include <nextlib_fmt.bas>
#pragma codebank = 0

CONST FONT as uByte = 32

DIM buf(15) as uByte        ' the scratch the Fmt* routines write into
DIM score as uLong
DIM lives as uByte
DIM secs as uInteger
DIM speed as Integer        ' 8.8 fixed point
DIM drift as Integer
DIM frame as uInteger

LoadSDBank("[]font5.fnt", 0, 0, 0, 32)
InitLayer2(MODE320X256)
ShowLayer2(1)
ClearLayer2(0)

FL2Text(0, 0, "NEXTLIB_FMT - A DEMO HUD", FONT)
FL2Text(0, 2, "RAW", FONT)
FL2Text(20, 2, "FORMATTED", FONT)

score = 0
lives = 3
secs = 0
speed = 256                 ' 1.00
drift = -1280               ' -5.00

DO
    frame = frame + 1
    score = score + frame   ' grows fast, so the width keeps changing
    IF score > 99999999 THEN
        score = 0           ' 8 digits is the field width we asked for
    END IF
    secs = frame / 50
    speed = speed + 3
    IF speed > 8000 THEN
        speed = 256
    END IF
    drift = drift + 7
    IF drift > 1280 THEN
        drift = -1280       ' sweep through zero so the sign column moves
    END IF

    ' ---- the raw versions, left column ------------------------------
    ' STR() gives no padding, so these shuffle left and right as digits
    ' come and go. Blank the line first or the old tail stays on screen.
    FL2Text(0, 6, "                    ", FONT)
    FL2Text(0, 6, "SCORE " + STR(score), FONT)
    FL2Text(0, 7, "                    ", FONT)
    FL2Text(0, 9, "TIME  " + STR(secs), FONT)
    FL2Text(0, 12, "                    ", FONT)
    FL2Text(0, 12, "DRIFT " + STR(drift), FONT)

    ' ---- the buffer form, right column ------------------------------
    ' FmtU32 writes ASCII straight into buf() with no allocation at all.
    ' FmtStr then hands it to FL2Text, which needs a String. In a real
    ' game the buffer would usually go into a tilemap instead, and the
    ' String step would not exist.
    FmtU32(@buf(0), score, 8, 48)               ' 48 is "0"
    FL2Text(20, 6, "SCORE " + FmtStr(@buf(0), 8), FONT)

    ' A clock, built from two fields side by side with the separator
    ' poked in between. Each call takes the address it writes to.
    FmtU16(@buf(0), secs / 60, 2, 48)
    buf(2) = 58                                 ' ":"
    FmtU16(@buf(3), secs MOD 60, 2, 48)
    FL2Text(20, 9, "TIME  " + FmtStr(@buf(0), 5), FONT)

    ' FmtI16 puts the sign inside the padded field, so a column of mixed
    ' positive and negative numbers still lines up on the right.
    FmtI16(@buf(0), drift, 6, 32)               ' 32 is " "
    FL2Text(20, 12, "DRIFT " + FmtStr(@buf(0), 6), FONT)

    ' ---- the rest of the API ---------------------------------------
    FmtFx(@buf(0), speed, 2)                    ' 8.8 fixed point
    FL2Text(20, 15, "SPEED " + FmtStr(@buf(0), 6) + "  ", FONT)

    FmtHex16(@buf(0), frame)
    FL2Text(20, 18, "FRAME $" + FmtStr(@buf(0), 4), FONT)

    FmtU8(@buf(0), lives, 2, 48)
    FL2Text(20, 21, "LIVES " + FmtStr(@buf(0), 2), FONT)

    ' ---- the String shortcuts --------------------------------------
    ' Where the value only changes occasionally, these are simpler than
    ' going through a buffer. They allocate, so they are the wrong tool
    ' for the lines above.
    FL2Text(0, 25, "ZEROPAD  " + ZeroPad(secs, 5), FONT)
    FL2Text(0, 28, "RJUST    -" + RJust(STR(lives), 5) + "-", FONT)

    IF frame MOD 200 = 0 THEN
        lives = lives + 1
        IF lives > 9 THEN
            lives = 0
        END IF
    END IF

    WaitRaster(192)
LOOP
