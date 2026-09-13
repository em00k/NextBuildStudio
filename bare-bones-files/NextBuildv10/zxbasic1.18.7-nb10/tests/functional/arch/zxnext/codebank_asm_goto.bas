' A label naming ordinary statements inside a CODEBANK block must NOT move
' into the bank: the statements stay resident, so GOTO has to keep reaching it.
DIM n as uByte

CODEBANK 1
loop1:
    n = n + 1
    IF n < 3 THEN
        GOTO loop1
    END IF

    SUB InBank()
        n = 9
    END SUB
END CODEBANK

InBank()
