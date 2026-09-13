' An array AT a fixed numeric address, declared inside a bank. The data is not
' in the bank, but the descriptor is -- it belongs to the declaration, and the
' access check has always treated such a declaration as bank-local.
DIM r as uByte

CODEBANK 1
    DIM scr(15) as uByte AT 16384

    FUNCTION FirstByte(i as uByte) as uByte
        RETURN scr(i)
    END FUNCTION
END CODEBANK

r = FirstByte(0)
