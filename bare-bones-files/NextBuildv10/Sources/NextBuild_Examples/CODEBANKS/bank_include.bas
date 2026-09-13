' ---------------------------------------------------------------
' bank_include - putting whole #include files into banks
'
' CODEBANK ... END CODEBANK is the block form. #pragma codebank is
' the switch form, and it is the one you want around an #include:
' every SUB/FUNCTION the included file defines lands in that bank,
' and the file itself needs no banking syntax at all.
'
' Remember to switch back to bank 0 afterwards, or everything that
' follows ends up banked too.
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40           ' bank 1 -> page 40, bank 2 -> page 41

#include <nextlib.bas>

' ---- two libraries, two banks --------------------------------
#pragma codebank = 1
#include "banklib/textlib.bas"

#pragma codebank = 2
#include "banklib/mathlib.bas"

#pragma codebank = 0    ' back to resident - do not forget this

' ---- resident ------------------------------------------------
DIM i as uByte

CLS

' Banner() is in bank 1 and calls Centre(), also in bank 1.
Banner(0, "TWO LIBRARIES, TWO BANKS")

' Zeros() is in bank 1, Gcd() and Scale() are in bank 2. Mixing
' them freely in one expression is fine; each call pages its own
' bank in and restores the previous one on the way out.
Centre(5, "GCD(84,36) = " + STR(Gcd(84, 36)))
Centre(6, "SCALE(30,60) = " + Zeros(Scale(30, 60), 3))
Centre(7, "CLAMP(999,0,100) = " + STR(Clamp(999, 0, 100)))

' Hammer the bank switch a bit: this alternates bank 1 and bank 2
' on every iteration, which is the slow path both ways.
FOR i = 1 TO 10
    Centre(10, "TICK " + Zeros(i, 2) + " GCD " + STR(Gcd(i * 6, 24)))
    WaitRetrace(100)
NEXT i

Centre(14, "DONE")

DO
LOOP
