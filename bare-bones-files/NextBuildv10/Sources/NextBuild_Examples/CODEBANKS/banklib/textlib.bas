' ---------------------------------------------------------------
' banklib/textlib.bas - a library that lives entirely in one bank
'
' Nothing in this file mentions banking. The caller decides where
' it lands, by wrapping the #include in a #pragma codebank. That
' means the same library can be resident in one program and banked
' in another, unchanged.
' ---------------------------------------------------------------

' Pad a number out to a fixed width with leading zeros.
FUNCTION Zeros(n as uInteger, width as uByte) as String
    DIM s as String
    s = STR(n)
    DO WHILE LEN(s) < width
        s = "0" + s
    LOOP
    RETURN s
END FUNCTION

' Print centred on a 32 column screen.
SUB Centre(y as uByte, m$ as String)
    DIM x as uByte
    x = 0
    IF LEN(m$) < 32 THEN
        x = (32 - LEN(m$)) / 2
    END IF
    PRINT AT y,x;m$
END SUB

' A boxed banner. Calls Centre(), which is in this same bank, so it
' takes the far-call fast path - no paging and no shadow stack use.
SUB Banner(y as uByte, m$ as String)
    DIM x as uByte
    FOR x = 0 TO 31
        PRINT AT y,x;"="
        PRINT AT y + 2,x;"="
    NEXT x
    Centre(y + 1, m$)
END SUB
