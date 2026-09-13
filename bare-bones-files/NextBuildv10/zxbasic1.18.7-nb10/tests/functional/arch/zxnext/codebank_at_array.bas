' An array declared AT a bank-local label keeps its descriptor in that bank.
' The descriptor holds a word pointing at the data, so it has to be mapped
' together with what it points at.
DIM r as uByte

CODEBANK 1
    DIM buf(16) as uByte AT @blob

    FUNCTION Nth(i as uByte) as uByte
        RETURN buf(i)            ' variable subscript: goes through __ARRAY
    END FUNCTION

    blob:
    asm
        defb 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17
    end asm
END CODEBANK

r = Nth(2)
