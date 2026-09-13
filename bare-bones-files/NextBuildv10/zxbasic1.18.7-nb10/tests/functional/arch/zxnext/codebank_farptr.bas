' FARPTR names a bank-local symbol from outside its bank, which is otherwise
' an error. The pointer it yields is (logical bank << 16) | address, and the
' label it names is the .__faraddr alias emitted beside the storage -- never
' the real label, so the assembler's cross-segment check still holds.
DIM fp as uLong
DIM near as uByte

CODEBANK 1
    DIM lut(3) as uByte => {1,2,3,4}

    tbl:
    asm
        defb 9, 8, 7, 6
    end asm

    FUNCTION Own() as uByte
        RETURN lut(0)
    END FUNCTION
END CODEBANK

fp = FARPTR tbl              ' asm label in a bank
fp = FARPTR tbl + 2          ' ...with an offset, folded into the constant
fp = FARPTR lut              ' bank-local array: the data, not the descriptor
fp = FARPTR lut(3)           ' constant subscript folds in too
fp = FARPTR near             ' resident: bank 0, and no alias needed

near = Own()
