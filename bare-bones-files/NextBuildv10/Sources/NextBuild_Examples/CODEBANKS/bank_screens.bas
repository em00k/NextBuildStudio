' ---------------------------------------------------------------
' bank_screens - one screen per bank, resident dispatcher
'
' This is the CODEBANK answer to the old MODULES system. Instead of
' separate .NEX modules loaded off SD into a fixed $6000 window,
' each screen is just a SUB that happens to live in its own 8K
' bank. Globals, strings and the runtime all stay resident, so the
' screens share state with no plumbing whatsoever.
'
' Add a fourth screen by writing a fourth SUB in CODEBANK 4 - no
' loader, no addresses, no rebuild order to remember.
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40           ' CODEBANK 1 -> page 40, 2 -> 41, 3 -> 42

#include <nextlib.bas>

asm 
    ei              ; enable for INKEY$
end asm 

' ---- shared state, resident ----------------------------------
' Banked code reads and writes these exactly like any other code.
DIM state as uByte
DIM score as uInteger
DIM lives as uByte

CONST ST_TITLE    as uByte = 0
CONST ST_GAME     as uByte = 1
CONST ST_OVER     as uByte = 2
CONST ST_QUIT     as uByte = 3

' ---- bank 1: the title screen --------------------------------
CODEBANK 1

    SUB TitleScreen()
        DIM k as String
        CLS
        PRINT AT 2,8;"C O D E B A N K"
        PRINT AT 4,4;"THREE SCREENS, THREE BANKS"
        PRINT AT 6,4;"THIS ONE IS IN BANK 1"

        Frame(8)                    ' same bank -> far-call fast path

        PRINT AT 10,8;"1 - PLAY"
        PRINT AT 11,8;"2 - QUIT"
        DO
            k = INKEY$
        LOOP UNTIL k = "1" OR k = "2"

        IF k = "1" THEN
            score = 0
            lives = 3
            state = ST_GAME
        ELSE
            state = ST_QUIT
        END IF
    END SUB

    ' A helper used by every screen. It sits in bank 1, so calls to
    ' it from bank 2 and 3 are real cross-bank calls: the trampoline
    ' pages bank 1 in, runs this, and pages the caller's bank back.
    SUB Frame(y as uByte)
        DIM x as uByte
        FOR x = 2 TO 29
            PRINT AT y,x;"-"
        NEXT x
    END SUB

END CODEBANK

' ---- bank 2: the game ----------------------------------------
CODEBANK 2

    SUB GameScreen()
        DIM k as String
        CLS
        PRINT AT 0,4;"BANK 2 - PLAYING"
        Frame(1)                    ' bank 2 -> bank 1 -> back to bank 2
        PRINT AT 12,2;"SPACE = SCORE   Q = LOSE A LIFE"

        DO
            PRINT AT 4,4;"SCORE ";score;"    "
            PRINT AT 5,4;"LIVES ";lives;"    "
            k = INKEY$
            IF k = " " THEN
                score = score + 10
                PAUSE 5
            END IF
            IF k = "q" OR k = "Q" THEN
                lives = lives - 1
                PAUSE 5
            END IF
        LOOP UNTIL lives = 0

        state = ST_OVER
    END SUB

END CODEBANK

' ---- bank 3: game over ---------------------------------------
CODEBANK 3

    SUB GameOverScreen()
        CLS
        PRINT AT 8,10;"GAME OVER"
        Frame(9)                    ' bank 3 -> bank 1 -> back to bank 3
        PRINT AT 10,7;"YOU SCORED ";score
        PRINT AT 14,6;"PRESS ANY KEY"
        WaitKey()
        state = ST_TITLE
    END SUB

END CODEBANK

' ---- resident: the dispatcher --------------------------------
' Small, always paged in, and the only code that knows the state
' machine. Everything expensive lives in a bank.
state = ST_TITLE

DO
    IF state = ST_TITLE THEN
        TitleScreen()
    ELSEIF state = ST_GAME THEN
        GameScreen()
    ELSEIF state = ST_OVER THEN
        GameOverScreen()
    END IF
LOOP UNTIL state = ST_QUIT

CLS
PRINT AT 10,8;"BYE - SCORE WAS ";score

DO
LOOP
