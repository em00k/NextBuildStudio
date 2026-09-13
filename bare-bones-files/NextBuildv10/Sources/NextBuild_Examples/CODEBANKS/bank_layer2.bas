' ---------------------------------------------------------------
' bank_layer2 - banked code driving nextlib graphics
'
' Two things this shows:
'
'  1. Banked code can call the whole of nextlib normally. The
'     runtime library, globals and strings all stay resident, so a
'     banked SUB reaches them without any paging of its own.
'
'  2. Code banks and LoadSDBank data banks share the same 8K page
'     numbering, so they must not collide. Here the font is data in
'     page 30 and the code banks are given pages 44-46 explicitly
'     with '!codebankpages=. nextbuild.py will stop the build if a
'     page is ever claimed twice.
'
' Layer 2 is safe to drive from a bank because nextlib's Layer 2
' routines page through slots 0 and 2 ($0000 and $4000), never
' through slot 3 - which is where the code window lives.
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebankpages=44,45,46    ' CODEBANK 1 -> 44, 2 -> 45, 3 -> 46

#define NEX                 ' pack assets into the NEX, do not load from SD
#include <nextlib.bas>
asm 
    ei
end asm 

LoadSDBank("[]font1.fnt",0,0,0,30)      ' data bank 30 - no clash with 44-46

CONST FONT as uByte = 30

' ---- bank 1: colour bars -------------------------------------
CODEBANK 1

    SUB Bars()
        DIM x as uInteger
        DIM c as uByte
        ClearLayer2(0)
        FOR x = 0 TO 319
            c = x / 2
            FPlotLineV(0, x, 255, c)
        NEXT x
        Label("BANK 1 - COLOUR BARS")
    END SUB

END CODEBANK

' ---- bank 2: a grid ------------------------------------------
CODEBANK 2

    SUB Grid()
        DIM x as uInteger
        DIM y as uByte
        ClearLayer2(0)
        FOR x = 0 TO 319 STEP 16
            FPlotLineV(0, x, 255, 30)
        NEXT x
        FOR y = 0 TO 255 STEP 16
            FPlotLineW(y, 0, 320, 30)
        NEXT y
        Label("BANK 2 - GRID")
    END SUB

END CODEBANK

' ---- bank 3: the shared label routine ------------------------
' Called from bank 1 and bank 2,  so both of those are genuine
' cross-bank calls: bank 1 -> bank 3 -> back to bank 1.
CODEBANK 3

    SUB Label(m$ as String)
        FPlotLineW(0, 0, 320, 0)
        FPlotLineW(1, 0, 320, 0)
        FPlotLineW(2, 0, 320, 0)
        FPlotLineW(3, 0, 320, 0)
        FPlotLineW(4, 0, 320, 0)
        FPlotLineW(5, 0, 320, 0)
        FPlotLineW(6, 0, 320, 0)
        FPlotLineW(7, 0, 320, 0)
        FL2Text(0, 0, m$, FONT)
    END SUB

    SUB Wash(c as uByte)
        DIM y as uByte
         
        FOR y = 240 TO 254
            FPlotLineW(y, 0, 320, c)
        NEXT y
    END SUB

END CODEBANK

' ---- resident ------------------------------------------------
DIM i as uByte

BORDER 0
InitLayer2(MODE320X256)
ShowLayer2(1)

DO
    Bars()
    FOR i = 0 TO 7
        Wash(i * 32)                ' bank 3, straight from resident
        WaitRetrace(100)
    NEXT i
    WaitKey()

    Grid()
    
    FOR i = 0 TO 7
        Wash(224 - i * 32)
        WaitRetrace(100)
    NEXT i
    WaitKey()
LOOP
