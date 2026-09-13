' An asm block nested in control flow is executable code, not bank data. It
' stays resident and runs where it was written, even inside a CODEBANK block.
DIM n as uByte
n = 1

CODEBANK 1
    IF n = 1 THEN
        asm
            ld a, 7
            out (254), a
        end asm
    END IF

    SUB InBank()
        n = 2
    END SUB
END CODEBANK

InBank()
