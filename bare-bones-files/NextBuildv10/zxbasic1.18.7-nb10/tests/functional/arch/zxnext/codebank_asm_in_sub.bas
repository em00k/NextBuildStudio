' An asm block inside a banked SUB already reaches the bank through the
' routine body, and must not be moved a second time.
DIM r as uByte

CODEBANK 1
    SUB SetupIM2()
        asm
            ld a, 1
            ld (._r), a
        end asm
    END SUB
END CODEBANK

SetupIM2()
