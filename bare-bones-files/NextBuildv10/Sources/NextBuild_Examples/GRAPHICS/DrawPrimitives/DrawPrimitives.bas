' Project: DrawPrimitives
' Type: Layer 2
'
' Everything in nextlib_primitives.bas, drawn on a Layer 2 screen.
' The library lives in a code bank, so all it costs a resident program at
' $C000 is one small trampoline per routine.

'!org=$c000
'!codebank=30               ' CODEBANK 1 -> 8K page 30

#define NEX
#define IM2

#include <nextlib.bas>

' The whole primitives library into bank 1.

#pragma codebank = 1
#include <nextlib_primitives.bas>
#pragma codebank = 0

' i is a uInteger on purpose. Boriel compiles uByte * const to `mul d,e` and
' reads the result out of E alone, so on a uByte counter i * 10 wraps at
' i = 26 and the far side of the screen never gets drawn.
DIM i as uInteger
DIM x as uInteger
DIM y as uByte
DIM pgon(11) as uInteger    ' six points, x and y each, for L2Poly

' font5 from the system area into bank 32 - no clash with the code bank
LoadSDBank("[]font5.fnt", 0, 0, 0, 32)

InitLayer2(MODE320X256)     ' also tells the primitives which mode is up
ShowLayer2(1)

DO
    ' ---- single pixels ----------------------------------------------
    L2Cls(0)                ' the primitives' own flood fill
    FL2Text(0, 0, "L2PLOT - ONE PIXEL AT A TIME", 32)
    FOR x = 0 TO 319
        L2Plot(x, 40 + (x BAND 31), 16 + x / 8)
        L2Plot(x, 200 - (x BAND 63), 100 + x / 4)
    NEXT x
    WaitKey()

    ' ---- lines ------------------------------------------------------
    ClearLayer2(0)
    FL2Text(0, 0, "LINES - ANY ANGLE, CLIPPED", 32)
    FOR i = 0 TO 31
        L2Line(160, 128, i * 10, 24, 16 + i)
        L2Line(160, 128, i * 10, 255, 48 + i)
    NEXT i
    ' off the edges on purpose - these clip rather than wrap
    L2HLine(0, 200, 320, 255)
    L2VLine(300, 200, 100, 255)
    WaitKey()

    ' ---- boxes ------------------------------------------------------
    ClearLayer2(0)
    FL2Text(0, 0, "BOXES - OUTLINE AND SOLID", 32)
    FOR i = 0 TO 11
        L2Box(10 + i * 12, 30 + i * 8, 150 - i * 6, 130 - i * 4, 16 + i * 8)
    NEXT i
    FOR i = 0 TO 7
        L2FillBox(170 + i * 16, 40 + i * 12, 230 + i * 10, 90 + i * 14, 32 + i * 16)
    NEXT i
    WaitKey()

    ' ---- circles ----------------------------------------------------
    ClearLayer2(0)
    FL2Text(0, 0, "CIRCLES - OUTLINE AND SOLID", 32)
    FOR i = 1 TO 15
        L2Circle(90, 130, i * 8, 16 + i * 4)
    NEXT i
    ' biggest first, so each fill lands on top of the last
    FOR i = 1 TO 8
        L2FillCircle(230, 130, (9 - i) * 12, 100 + (9 - i) * 8)
    NEXT i
    ' clipped against the corners
    L2FillCircle(0, 0, 40, 200)
    L2FillCircle(319, 255, 40, 200)
    WaitKey()

    ' ---- triangles and polygons -------------------------------------
    ClearLayer2(0)
    FL2Text(0, 0, "TRIANGLES AND POLYGONS", 32)
    FOR i = 0 TO 7
        L2FillTriangle(14 + i * 38, 30, 46 + i * 38, 30, _
                       30 + i * 38, 96, 24 + i * 26)
    NEXT i
    ' clipped off two edges
    L2FillTriangle(0, 20, 60, 0, 0, 0, 200)
    L2FillTriangle(319, 40, 260, 0, 319, 0, 200)

    ' a hexagon as a point list: filled, then outlined over the top
    pgon(0)  = 160 : pgon(1)  = 120
    pgon(2)  = 235 : pgon(3)  = 158
    pgon(4)  = 235 : pgon(5)  = 216
    pgon(6)  = 160 : pgon(7)  = 254
    pgon(8)  = 85  : pgon(9)  = 216
    pgon(10) = 85  : pgon(11) = 158
    L2FillPoly(@pgon(0), 6, 36)
    L2Poly(@pgon(0), 6, 255)
    WaitKey()

    ' ---- spans, and reading pixels back -----------------------------
    ClearLayer2(0)
    FL2Text(0, 0, "SPANS, AND L2POINT READING BACK", 32)
    FOR x = 0 TO 319 STEP 2
        L2VLine(x, 24, 100, x / 2)
    NEXT x
    FOR y = 140 TO 240 STEP 4
        L2HLine(0, y, 320, y)
    NEXT y

    ' Read pixels back out of the top band and repaint them as blocks. A
    ' wrong L2Point shows up straight away as a block in the wrong colour.
    FOR i = 0 TO 9
        L2FillBox(20 + i * 30, 250, 40 + i * 30, 255, L2Point(i * 30, 50))
    NEXT i
    WaitKey()
LOOP
