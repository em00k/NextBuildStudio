' A scalar declared AT an address is a bare EQU with no storage of its own,
' so there is nothing to place in a bank and it stays in the resident pass.
DIM r as uByte

CODEBANK 1
    DIM slot as uByte AT @blob

    FUNCTION Peek1() as uByte
        RETURN slot
    END FUNCTION

    blob:
    asm
        defb 42
    end asm
END CODEBANK

r = Peek1()
