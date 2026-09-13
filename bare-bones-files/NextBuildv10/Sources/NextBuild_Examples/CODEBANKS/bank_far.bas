' ---------------------------------------------------------------
' bank_far - reading data out of a code bank
'
' A CODEBANK gets things out of the resident 64K. The catch has
' always been that only routines in the same bank can see what is in
' one, because nothing else is mapped while they run. So a bank was
' somewhere to put code and its private data - not somewhere to put
' the tiles, text and tables the rest of your program wants.
'
' FARPTR is the way across. Put the data in a bank, take a FARPTR to
' it, and hand that to one of the Far* routines:
'
'     FarPeek(fp)                 read a byte
'     FarPeekW(fp)                read a word, low byte first
'     FarPoke(fp, v)              write a byte
'     FarPokeW(fp, v)             write a word
'     FarCopy(fp, dest, count)    copy out of a bank
'     FarCopyTo(fp, src, count)   copy into a bank
'     FarStr(fp)                  read a String out of a bank
'
' Each one pages the bank in, does the work, and puts back whatever
' was there before - so you can call them from anywhere, including
' from inside a different bank, and not think about paging at all.
'
' The thing to notice while this runs: every message it prints lives
' in bank 1, so none of that text is in the resident 64K. It is
' still in the .nex - it has to be, or it could not be loaded - but
' it arrives in a bank page instead of in your program. Check it
' yourself: the characters are in bank_far.bank1.bin and in none of
' the other output files.
'
' A string literal is emitted resident wherever you write it, so
' writing these the ordinary way would have cost every byte of them
' out of the 64K you have to fit everything else in.
'
' Two rules the compiler cannot check for you:
'   - the resident side of a copy must not be inside the code window
'   - do not call these from an interrupt handler, which must never
'     remap the window
' ---------------------------------------------------------------
'!org=$6000
'!opt=4
'!heap=1024             ' FarStr allocates, so give it somewhere to do it

'!codebank=40           ' CODEBANK 1 -> page 40
'!codewindow=$e000      ' the window is slot 7, $E000-$FFFF

#include <nextlib.bas>
#include <farmem.bas>   ' the Far* routines


' ===============================================================
' The bank
' ===============================================================
' Anything here is bank-local: it costs nothing out of the resident
' 64K, and nothing outside bank 1 can name it without a FARPTR.
CODEBANK 1

    ' A String, stored the way FarStr wants it: a DEFW holding the
    ' length, then that many characters.
    greeting:
    asm
        defw 20
        defb "hello from CODEBANK1"
    end asm

    ' Eight bytes of graphics. This is the shape most banked data
    ' ends up in - tiles, sprites, tables, level maps.
    arrow:
    asm
        defb %00011000, %00111100, %01111110, %11111111
        defb %00011000, %00011000, %00011000, %00011000
    end asm

    ' A pool of messages, with an index in front of it so you can
    ' ask for one by number. The index holds *offsets* from the
    ' start of the pool rather than addresses, which is what lets a
    ' caller say `FARPTR msgpool + off` and never have to take a far
    ' pointer apart.
    '
    ' `pool` is the assembler's name for the address the BASIC label
    ' `msgpool` marks - a label attaches to the block after it, and
    ' `pool` is that block's first byte.
    msgpool:
    asm
    pool:
        defw m0 - pool
        defw m1 - pool
        defw m2 - pool
        defw m3 - pool
        defw m4 - pool
        defw m5 - pool
        defw m6 - pool

    m0: defw 13
        defb "PRESS ANY KEY"
    m1: defw 9
        defb "GAME OVER"
    m2: defw 10
        defb "HIGH SCORE"
    m3: defw 14
        defb "LEVEL COMPLETE"
    m4: defw 10
        defb "TRY AGAIN?"
    m5: defw 10
        defb "LOADING..."
    m6: defw 11
        defb "BANKED TEXT"
    end asm

    ' A FARPTR reaches an ordinary DIM just as well as an asm label.
    DIM highScore as uInteger = 1000

    ' Inside bank 1 all of the above is just... global variables.
    ' This is still the clearest way to touch bank data when there
    ' is a routine here that can do the job.
    SUB AddScore(n as uInteger)
        highScore = highScore + n
    END SUB
END CODEBANK


' ===============================================================
' Resident
' ===============================================================
DIM tile(7) as uByte
DIM msg$ as String
DIM i as uInteger
DIM off as uInteger

CLS
PRINT "BANKED DATA DEMO"
PRINT

' ---- 1. a String out of a bank --------------------------------
' The smallest useful thing FARPTR does. Everything below is a
' variation on it.
PRINT FarStr(FARPTR greeting)
PRINT

' ---- 2. bytes out of a bank -----------------------------------
' FarCopy pulls the eight bytes into an ordinary resident array,
' which you can then hand to a sprite routine, a UDG, anything.
FarCopy(FARPTR arrow, @tile(0), 8)

PRINT "arrow tile, copied out of bank 1:"
FOR i = 0 TO 7
    PRINT tile(i);" ";
NEXT i
PRINT

' A single byte needs no buffer at all. Add to a FARPTR to move
' along - the offset lands on the address, not the bank.
PRINT "row 3 read directly: "; FarPeek(FARPTR arrow + 3)
PRINT

' ---- 3. the message pool --------------------------------------
' Two far reads per message: the offset out of the index, then the
' String it points at.
PRINT "messages held in bank 1:"
FOR i = 0 TO 6
    off = FarPeekW(FARPTR msgpool + i * 2)
    msg$ = FarStr(FARPTR msgpool + off)
    PRINT " "; i; " "; msg$
NEXT i
PRINT

' ---- 4. writing back ------------------------------------------
' A bank page is real RAM, and it keeps its contents while it is
' paged out. Either way of updating it works:
AddScore(500)                           ' from inside the bank
FarPokeW(FARPTR highScore, 9999)        ' or from out here
PRINT "high score, in bank 1: "; FarPeekW(FARPTR highScore)

finished:
do: loop
