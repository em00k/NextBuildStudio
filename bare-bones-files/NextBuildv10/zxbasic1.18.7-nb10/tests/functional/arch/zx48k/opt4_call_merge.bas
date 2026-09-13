REM The label after a call is also reached by the jump that skips it.
REM Other() changes HL, so a(s) must still widen s into HL: -O4 used to
REM assume HL was left over from `w = s` and read a(w) instead.

DIM a(11) AS UBYTE
DIM s AS UBYTE
DIM g AS UBYTE
DIM w AS UINTEGER

SUB Other()
    IF g = 3 THEN
        w = w + 12345
    ELSE
        w = w - 1
    END IF
    POKE 30000, g
END SUB

SUB Take(v AS UBYTE)
    POKE 30001, v
END SUB

SUB Test()
    w = s
    IF g <> 0 THEN
        Other()
    END IF
    Take(a(s))
END SUB

Test()
