' ----------------------------------------------------------------
' Far memory access for ZX Spectrum Next code banks.
'
' A CODEBANK gets bytes out of the resident 64K, but only routines in
' the same bank can reach what is in it. These are the way across from
' anywhere: each pages the bank into the code window, does its work,
' and puts back whatever bank the caller was running in. So they work
' the same called from resident code or from inside another bank.
'
' What they take is what FARPTR yields - a uLong holding the logical
' bank in bits 16-23 and the address in bits 0-15:
'
'     CODEBANK 1
'         tiles:
'         asm
'             defb 1, 2, 3, 4, 5, 6
'         end asm
'         msg:
'         asm
'             defw 16
'             defb "this is a string"
'         end asm
'     END CODEBANK
'
'     DIM buf(5) as uByte
'     FarCopy(FARPTR tiles, @buf(0), 6)
'     PRINT FarPeek(FARPTR tiles + 3)
'     PRINT FarStr(FARPTR msg)
'
' Rules, neither of which the compiler can check:
'   - the resident side of a copy must not be inside the code window
'   - do not call these from an interrupt handler, which must never
'     remap the window
' ----------------------------------------------------------------

#ifndef __LIBRARY_FARMEM__

REM Avoid recursive / multiple inclusion

#define __LIBRARY_FARMEM__

' The routines themselves, laid down once. The jump is what keeps them out of
' the instruction stream - a module-level asm block runs where it stands.
ASM
    jp __farmem_skip
#include once <farmem.asm>
__farmem_skip:
END ASM


' ----------------------------------------------------------------
' Reads one byte from a far pointer.
' ----------------------------------------------------------------
FUNCTION FASTCALL FarPeek(fp as uLong) as uByte
    ASM
        ld a, e                     ; DE:HL = the far pointer, so E = bank
        call .core.__FAR_PEEK
    END ASM
END FUNCTION


' ----------------------------------------------------------------
' Reads one 16-bit word from a far pointer, low byte first.
' ----------------------------------------------------------------
FUNCTION FASTCALL FarPeekW(fp as uLong) as uInteger
    ASM
        ld a, e
        call .core.__FAR_PEEK16
    END ASM
END FUNCTION


' ----------------------------------------------------------------
' Writes one byte through a far pointer.
' ----------------------------------------------------------------
SUB FarPoke(fp as uLong, v as uByte)
    ASM
        ; fp low word (ix+4..5), high word (ix+6..7), so the bank is (ix+6).
        ; v is a uByte, which sits in the high half of its own slot.
        ld a, (ix+6)
        ld l, (ix+4)
        ld h, (ix+5)
        ld e, (ix+9)
        call .core.__FAR_POKE
    END ASM
END SUB


' ----------------------------------------------------------------
' Writes one 16-bit word through a far pointer, low byte first.
' ----------------------------------------------------------------
SUB FarPokeW(fp as uLong, v as uInteger)
    ASM
        ld a, (ix+6)
        ld l, (ix+4)
        ld h, (ix+5)
        ld e, (ix+8)
        ld d, (ix+9)
        call .core.__FAR_POKE16
    END ASM
END SUB


' ----------------------------------------------------------------
' Copies count bytes out of a bank into resident memory.
' dest must not lie inside the code window.
' ----------------------------------------------------------------
SUB FarCopy(fp as uLong, dest as uInteger, count as uInteger)
    IF count = 0 THEN
        RETURN                      ' LDIR would read a zero count as 65536
    END IF

    ASM
        ld a, (ix+6)                ; bank
        ld l, (ix+4)                ; HL = source, in the bank
        ld h, (ix+5)
        ld e, (ix+8)                ; DE = destination, resident
        ld d, (ix+9)
        ld c, (ix+10)               ; BC = count
        ld b, (ix+11)
        call .core.__FAR_COPY
    END ASM
END SUB


' ----------------------------------------------------------------
' Copies count bytes from resident memory into a bank.
' src must not lie inside the code window.
' ----------------------------------------------------------------
SUB FarCopyTo(fp as uLong, src as uInteger, count as uInteger)
    IF count = 0 THEN
        RETURN
    END IF

    ASM
        ld a, (ix+6)                ; bank
        ld e, (ix+4)                ; DE = destination, in the bank
        ld d, (ix+5)
        ld l, (ix+8)                ; HL = source, resident
        ld h, (ix+9)
        ld c, (ix+10)
        ld b, (ix+11)
        call .core.__FAR_COPY
    END ASM
END SUB


' ----------------------------------------------------------------
' Builds a String from a length-prefixed image held in a bank: a
' DEFW length followed by that many characters. The characters stay
' in the bank; only the copy this returns is resident, so it is an
' ordinary String the caller eventually lets go of.
'
' Returns a null String if the heap is full, which the string runtime
' treats as empty - the same way every allocation failure propagates
' in Boriel.
' ----------------------------------------------------------------
FUNCTION FASTCALL FarStr(fp as uLong) as String
    ASM
        ld a, e
        call .core.__FAR_STR         ; HL = the new String, or 0
    END ASM
END FUNCTION

#endif
