;; Far memory access for the ZX Spectrum Next 8K MMU.
;;
;; A CODEBANK moves code and data out of the resident 64K, but only routines in
;; the same bank can reach that data: nothing else is mapped when they run. These
;; routines are the sanctioned way across. Each one pages the wanted bank into
;; the code window, does its work, and restores whatever bank the caller was
;; running in -- so they are safe to call from resident code and from inside a
;; different bank alike.
;;
;; A *far pointer* is the uLong that `FARPTR x` yields: the logical bank in bits
;; 16-23, the address in bits 0-15. Bank 0 means resident, and works: mapping it
;; restores the boot page, and the address was never in the window to begin with.
;;
;; Requires (emitted by the compiler prologue whenever a CODEBANK exists):
;;     .core.__FAR_MMU_REG     EQU  NextReg of the code window's first MMU slot
;;     .core.__FAR_CUR_BANK         logical bank currently mapped
;;     .core.__CODE_BANK_TABLE      logical bank -> physical 8K page
;;
;; Constraints (cannot be checked at compile time, see docs):
;;   - The resident side of a copy must not point inside the code window.
;;   - Not usable from an interrupt handler, which must never remap the window.
;;   - Not re-entrant: the stdlib wrappers stage their arguments in globals.

#include once <mem/alloc.asm>

    push namespace core

; ---------------------------------------------------------------------------
; .core.__FAR_MAP -- page logical bank A into the code window.
; Preserves BC, DE, HL. Clobbers A and the flags.
; Deliberately does *not* touch __FAR_CUR_BANK: that records the bank the
; program is executing in, and this is a temporary window borrow, not a call.
; ---------------------------------------------------------------------------
__FAR_MAP:
        push hl
#ifdef __FAR_WINDOW_16K__
        add  a, a                   ; two bytes per row in a 16K window
#endif
        ld   hl, __CODE_BANK_TABLE
        add  a, l
        ld   l, a
        adc  a, h
        sub  l
        ld   h, a
        ld   a, (hl)                ; A = physical 8K page
        nextreg __FAR_MMU_REG, a
#ifdef __FAR_WINDOW_16K__
        inc  hl
        ld   a, (hl)                ; page for the window's upper half
        nextreg __FAR_MMU_REG2, a
#endif
        pop  hl
        ret


; ---------------------------------------------------------------------------
; .core.__FAR_UNMAP -- put back the bank the caller was executing in.
; Preserves every register, AF included.
; ---------------------------------------------------------------------------
__FAR_UNMAP:
        push af
        ld   a, (__FAR_CUR_BANK)
        call __FAR_MAP
        pop  af
        ret


; ---------------------------------------------------------------------------
; .core.__FAR_PEEK   A = bank, HL = address  ->  A = byte
; ---------------------------------------------------------------------------
__FAR_PEEK:
        call __FAR_MAP
        ld   a, (hl)
        jp   __FAR_UNMAP            ; preserves AF


; ---------------------------------------------------------------------------
; .core.__FAR_PEEK16  A = bank, HL = address  ->  HL = word
; ---------------------------------------------------------------------------
__FAR_PEEK16:
        call __FAR_MAP
        ld   a, (hl)
        inc  hl
        ld   h, (hl)
        ld   l, a
        jp   __FAR_UNMAP            ; preserves HL


; ---------------------------------------------------------------------------
; .core.__FAR_POKE   A = bank, HL = address, E = value
; ---------------------------------------------------------------------------
__FAR_POKE:
        call __FAR_MAP
        ld   (hl), e
        jp   __FAR_UNMAP


; ---------------------------------------------------------------------------
; .core.__FAR_POKE16  A = bank, HL = address, DE = value
; ---------------------------------------------------------------------------
__FAR_POKE16:
        call __FAR_MAP
        ld   (hl), e
        inc  hl
        ld   (hl), d
        jp   __FAR_UNMAP


; ---------------------------------------------------------------------------
; .core.__FAR_COPY   A = bank, HL = source, DE = destination, BC = count
;
; One routine covers both directions: whichever side is in the window, the
; bank is mapped for the whole LDIR. The caller must reject a zero count --
; LDIR would read it as 65536 -- which the stdlib wrappers do in BASIC.
; ---------------------------------------------------------------------------
__FAR_COPY:
        call __FAR_MAP
        ldir
        jp   __FAR_UNMAP


; ---------------------------------------------------------------------------
; .core.__FAR_STR   A = bank, HL = address of a length-prefixed string image
;                   ->  HL = a new resident String, or 0 if the heap is full
;
; This is what moves text out of the resident 64K: the characters live in the
; bank, and only the copy handed to BASIC is resident. __MEM_ALLOC runs with the
; bank still mapped, which is safe because the heap and the allocator are both
; resident -- the window holds nothing either of them touches.
; ---------------------------------------------------------------------------
__FAR_STR:
        PROC
        LOCAL done

        call __FAR_MAP
        ld   c, (hl)
        inc  hl
        ld   b, (hl)
        dec  hl                     ; BC = length, HL = source
        inc  bc
        inc  bc                     ; + the two length bytes
        push hl
        push bc
        call __MEM_ALLOC            ; BC = size -> HL = block, or 0
        pop  bc
        pop  de                     ; DE = source, BC = size
        ld   a, h
        or   l
        jr   z, done                ; out of memory: HL is already 0
        ex   de, hl                 ; HL = source (in the window), DE = target
        push de
        ldir
        pop  hl                     ; HL = the new string
done:
        jp   __FAR_UNMAP            ; preserves HL
        ENDP

    pop namespace
