' A 16K code window spans two MMU slots, so the far-call runtime maps and
' restores both, and __CODE_BANK_TABLE carries two bytes per logical bank.
' The boot row is read back by __FAR_INIT rather than assumed consecutive:
' the stock mapping puts pages 11 and 4 at slots 3 and 4.
#pragma codewindowsize = 16384

DIM r as uInteger

CODEBANK 1
    FUNCTION One() as uInteger
        RETURN 111
    END FUNCTION
END CODEBANK

CODEBANK 2
    FUNCTION Two() as uInteger
        RETURN One() + 222        ' bank 2 -> bank 1 -> back to bank 2
    END FUNCTION
END CODEBANK

r = Two()
