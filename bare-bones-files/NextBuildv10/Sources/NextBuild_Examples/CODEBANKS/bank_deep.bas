' ---------------------------------------------------------------
' bank_deep - deep cross-bank nesting, and what it costs
'
' Every cross-bank call pushes a 3 byte frame on the far-call
' shadow stack recording which bank to page back in. Same-bank
' calls do not - they take the fast path and cost nothing.
'
' '!codebankdepth= sizes that shadow stack. The default 16 is
' plenty for normal code; mutual recursion across banks is the one
' thing that will eat it, so this example raises it to 24 and then
' recurses 20 deep on purpose.
'
' It also checks that arguments and return values survive the trip:
' stdcall frames, uByte/uInteger/uLong returns and strings all come
' back the same as they went in.
' ---------------------------------------------------------------
'!org=32768
'!opt=4
'!codebank=40
'!codebankdepth=24          ' 24 * 3 = 72 bytes of shadow stack

#include <nextlib.bas>

' Results are gathered first and printed afterwards, so the whole
' cross-bank workout happens before anything touches the screen.
DIM r1, r2, r3 as uInteger
DIM r4 as uLong
DIM r5 as uByte
DIM pass as uByte

' Ping (bank 1) calls Pong (bank 2) before Pong has been defined,
' so Pong needs a forward declaration like any other. Where you put
' the DECLARE does not matter: the CODEBANK in force at the actual
' definition is the one that counts.
DECLARE FUNCTION Pong(n as uByte) as uInteger

' ---- bank 1 --------------------------------------------------
CODEBANK 1

    ' Ping and Pong call each other, so every single step is a
    ' cross-bank call and a shadow stack frame. Ping(20) nests 20
    ' bank switches deep before any of them unwind.
    FUNCTION Ping(n as uByte) as uInteger
        IF n = 0 THEN RETURN 0
        RETURN Pong(n - 1) + n
    END FUNCTION

    ' Same-bank neighbour of Ping. Calling this from Ping is the
    ' fast path: no paging, no frame.
    FUNCTION Local1(n as uByte) as uInteger
        RETURN n + 1
    END FUNCTION

END CODEBANK

' ---- bank 2 --------------------------------------------------
CODEBANK 2

    FUNCTION Pong(n as uByte) as uInteger
        IF n = 0 THEN RETURN 0
        RETURN Ping(n - 1) + n
    END FUNCTION

    ' Six arguments, so the last of them sits well up the stdcall
    ' frame. The far-call runtime replaces the caller's return
    ' address rather than pushing anything, which is what keeps
    ' these at their usual (ix+4), (ix+6), ... offsets.
    FUNCTION Six(a as uByte, b as uByte, c as uByte, d as uByte, e as uByte, f as uByte) as uInteger
        RETURN a + b * 2 + c * 3 + d * 4 + e * 5 + f * 6
    END FUNCTION

END CODEBANK

' ---- bank 3 --------------------------------------------------
CODEBANK 3

    ' Strings are allocated on the resident heap, so a banked
    ' function returning one is no different from a resident one.
    FUNCTION Shout(m$ as String, times as uByte) as String
        DIM i as uByte
        DIM s as String
        s = ""
        FOR i = 1 TO times
            s = s + m$
        NEXT i
        RETURN s
    END FUNCTION

    ' 32 bit return, so DE:HL rather than HL.
    FUNCTION Big(n as uInteger) as uLong
        RETURN n * 1000
    END FUNCTION

END CODEBANK

' ---- resident: run the checks --------------------------------
r1 = Ping(20)                       ' 20+19+...+1, 20 banks deep
r2 = Local1(41)                     ' same-bank fast path
r3 = Six(1, 2, 3, 4, 5, 6)          ' 1+4+9+16+25+36
r4 = Big(60)                        ' 32 bit return out of a bank
r5 = 0
IF Shout("AB", 3) = "ABABAB" THEN r5 = 1    ' string return out of a bank

pass = 1
IF r1 <> 210 THEN pass = 0
IF r2 <> 42 THEN pass = 0
IF r3 <> 91 THEN pass = 0
IF r4 <> 60000 THEN pass = 0
IF r5 <> 1 THEN pass = 0

' ---- report --------------------------------------------------
CLS
PRINT AT 0,1;"CROSS-BANK CALL CHECKS"
PRINT AT 2,1;"PING 20  ";r1;" WANT 210"
PRINT AT 3,1;"LOCAL1   ";r2;" WANT 42"
PRINT AT 4,1;"SIX ARGS ";r3;" WANT 91"
PRINT AT 5,1;"BIG      ";r4;" WANT 60000"
PRINT AT 6,1;"SHOUT    ";r5;" WANT 1"

PRINT AT 8,1;
IF pass = 1 THEN
    PRINT "ALL PASS"
ELSE
    PRINT "FAILURES ABOVE"
END IF

DO
LOOP
