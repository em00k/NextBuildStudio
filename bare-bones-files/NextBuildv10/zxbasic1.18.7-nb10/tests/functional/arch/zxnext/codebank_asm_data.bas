' Module-level asm inside a CODEBANK block is compiled into that bank, and a
' label naming it moves with it. Reachable from routines in the same bank.
DIM r as uByte

CODEBANK 1
    my_table:
    asm
        db 104, 105
    end asm

    FUNCTION First() as uByte
        RETURN PEEK @my_table
    END FUNCTION
END CODEBANK

r = First()
