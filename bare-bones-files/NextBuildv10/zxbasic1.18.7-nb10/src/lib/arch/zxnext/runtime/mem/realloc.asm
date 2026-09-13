; vim: ts=4:et:sw=4:
; Copyleft (K) by Jose M. Rodriguez de la Rosa
;  (a.k.a. Boriel)
;  http://www.boriel.com
;
; This ASM library is licensed under the BSD license
; you can use it for any purpose (even for commercial
; closed source programs).
;
; Please read the BSD license on the internet

; ----- IMPLEMENTATION NOTES ------
; The heap is implemented as a linked list of free blocks.

; Each free block contains this info:
;
; +----------------+ <-- HEAP START
; | Size (2 bytes) |
; |        0       | <-- Size = 0 => DUMMY HEADER BLOCK
; +----------------+
; | Next (2 bytes) |---+
; +----------------+ <-+
; | Size (2 bytes) |
; +----------------+
; | Next (2 bytes) |---+
; +----------------+   |
; | <free bytes...>|   | <-- If Size > 4, then this contains (size - 4) bytes
; | (0 if Size = 4)|   |
; +----------------+ <-+
; | Size (2 bytes) |
; +----------------+
; | Next (2 bytes) |---+
; +----------------+   |
; | <free bytes...>|   |
; | (0 if Size = 4)|   |
; +----------------+   |
;   <Allocated>        | <-- This zone is in use (Already allocated)
; +----------------+ <-+
; | Size (2 bytes) |
; +----------------+
; | Next (2 bytes) |---+
; +----------------+   |
; | <free bytes...>|   |
; | (0 if Size = 4)|   |
; +----------------+ <-+
; | Next (2 bytes) |--> NULL => END OF LIST
; |    0 = NULL    |
; +----------------+
; | <free bytes...>|
; | (0 if Size = 4)|
; +----------------+


; When a block is FREED, the previous and next pointers are examined to see
; if we can defragment the heap. If the block to be breed is just next to the
; previous, or to the next (or both) they will be converted into a single
; block (so defragmented).


;   MEMORY MANAGER
;
; This library must be initialized calling __MEM_INIT with
; HL = BLOCK Start & DE = Length.

; An init directive is useful for initialization routines.
; They will be added automatically if needed.


#include once <error.asm>
#include once <mem/alloc.asm>
#include once <mem/free.asm>


; ---------------------------------------------------------------------
; MEM_REALLOC
;  Reallocates a block of memory in the heap.
;
; Parameters
;  HL = Pointer to the original block
;  BC = New Length of requested memory block
;
; Returns:
;  HL = Pointer to the allocated block in memory. Returns 0 (NULL)
;       if the block could not be allocated (out of memory)
;
; Notes:
;  If BC = 0, the block is freed, otherwise
;  the content of the original block is copied to the new one, and
;  the new size is adjusted. If BC < original length, the content
;  will be truncated. Otherwise, extra block content might contain
;  memory garbage.
;
; ---------------------------------------------------------------------
    push namespace core

__REALLOC:    ; Reallocates block pointed by HL, with new length BC
    PROC

    LOCAL __REALLOC_ALLOC
    LOCAL __REALLOC_USE_OLD
    LOCAL __REALLOC_SET_REQ
    LOCAL __REALLOC_DO_COPY
    LOCAL __REALLOC_FREE_OLD
    LOCAL __REALLOC_OLDPTR
    LOCAL __REALLOC_OLDPTR2
    LOCAL __REALLOC_OLDPTR3
    LOCAL __REALLOC_REQLEN
    LOCAL __REALLOC_NEWPTR
    LOCAL __REALLOC_NEWPTR2

    ld a, h
    or l
    jp z, __MEM_ALLOC    ; If HL == NULL, just do a malloc

    ld a, b
    or c
    jr nz, __REALLOC_ALLOC
    call __MEM_FREE        ; If BC == 0, free old block and return NULL
    ld hl, 0
    ret

__REALLOC_ALLOC:
    ld (__REALLOC_OLDPTR + 1), hl
    ld (__REALLOC_OLDPTR2 + 1), hl
    ld (__REALLOC_OLDPTR3 + 1), hl
    ld (__REALLOC_REQLEN + 1), bc

    call __MEM_ALLOC       ; Allocate first, so old block survives on OOM
    ret z
    ld (__REALLOC_NEWPTR + 1), hl
    ld (__REALLOC_NEWPTR2 + 1), hl

    ; BC = old payload length (old total block size - 2 hidden bytes)
__REALLOC_OLDPTR:
    ld hl, 0
    dec hl
    dec hl
    ld c, (hl)
    inc hl
    ld b, (hl)
    dec bc
    dec bc

    ; Copy min(old_payload, requested_size)
__REALLOC_REQLEN:
    ld hl, 0
    ld a, b
    cp h
    jr c, __REALLOC_USE_OLD
    jr nz, __REALLOC_SET_REQ
    ld a, c
    cp l
    jr c, __REALLOC_USE_OLD

__REALLOC_SET_REQ:
    ld b, h
    ld c, l

__REALLOC_USE_OLD:
    ld a, b
    or c
    jr z, __REALLOC_FREE_OLD

__REALLOC_DO_COPY:
__REALLOC_OLDPTR2:
    ld hl, 0
__REALLOC_NEWPTR:
    ld de, 0
    ldir

__REALLOC_FREE_OLD:
__REALLOC_OLDPTR3:
    ld hl, 0
    call __MEM_FREE
__REALLOC_NEWPTR2:
    ld hl, 0
    ret

    ENDP

    pop namespace
