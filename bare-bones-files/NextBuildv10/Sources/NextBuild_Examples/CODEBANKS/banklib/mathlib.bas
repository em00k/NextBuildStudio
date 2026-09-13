' ---------------------------------------------------------------
' banklib/mathlib.bas - second library, second bank
' ---------------------------------------------------------------

FUNCTION Clamp(v as Integer, lo as Integer, hi as Integer) as Integer
    IF v < lo THEN RETURN lo
    IF v > hi THEN RETURN hi
    RETURN v
END FUNCTION

FUNCTION Gcd(a as uInteger, b as uInteger) as uInteger
    DIM t as uInteger
    DO WHILE b <> 0
        t = b
        b = a MOD b
        a = t
    LOOP
    RETURN a
END FUNCTION

' Cross-bank call: Clamp() is in this bank, but the caller of
' Scale() is likely somewhere else entirely. Neither end has to
' care - the trampoline sorts the paging out.
FUNCTION Scale(v as uByte, max as uByte) as uByte
    RETURN Clamp(v * 100 / max, 0, 100)
END FUNCTION
