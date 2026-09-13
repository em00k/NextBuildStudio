; ============================================================================
; nb_RND.asm - pseudo random numbers, assembler core
;
; A 32-bit xorshift held in two words. The kernel is the one from BallKicker26,
; which is fast and has a full period, but its state lived in the instruction
; stream as two `ld rr,nn` operands that it rewrote as it went. That made it
; unseedable, and unsafe both in an interrupt handler and in a code bank -
; self-modifying code in a bank is rewriting a page that may be swapped out
; from under it. Here the state is ordinary data.
;
; Nothing in this file touches IX, IY or the shadow registers.
; ============================================================================

; ---------------------------------------------------------------------------
; nbr_byte - next pseudo random byte
; Exit  : A = 0-255
; Uses  : AF, DE, HL
; ---------------------------------------------------------------------------
nbr_byte:
        ld      hl, (nbr_s1)
        ld      de, (nbr_s0)
        ld      (nbr_s0), hl            ; x = y, z = w
        ld      a, l                    ; w = w XOR (w << 3)
        add     a, a
        add     a, a
        add     a, a
        xor     l
        ld      l, a
        ld      a, d                    ; t = x XOR (x << 1)
        add     a, a
        xor     d
        ld      h, a
        rra                             ; XOR cleared carry, so this is a
                                        ; logical shift: t = t XOR (t>>1) XOR w
        xor     h
        xor     l
        ld      h, e                    ; y = z
        ld      l, a                    ; w = t
        ld      (nbr_s1), hl
        ret

; ---------------------------------------------------------------------------
; nbr_word - next pseudo random word
; Exit  : HL = 0-65535
; ---------------------------------------------------------------------------
nbr_word:
        call    nbr_byte
        ld      c, a
        call    nbr_byte
        ld      h, a
        ld      l, c
        ret

; ---------------------------------------------------------------------------
; nbr_seed - restart the sequence
; Entry : HL = seed, or 0 to derive one from the raster position
;
; The two words are never both zero whatever the seed, because s1 is s0 with a
; non-zero constant flipped into it - and an all-zero state is the one thing
; that would wedge an xorshift at zero forever.
; ---------------------------------------------------------------------------
nbr_seed:
        ld      a, h
        or      l
        jr      nz, nbr_seed_set
        ld      bc, $243B               ; no seed given, so read the raster
        ld      a, $1F                  ; line counter - written out longhand
        out     (c), a                  ; rather than using nextlib's getreg
        inc     b                       ; macro, so this file still assembles
        in      a, (c)                  ; standalone for the tests
        ld      l, a
        ld      bc, $243B
        ld      a, $1E
        out     (c), a
        inc     b
        in      a, (c)
        ld      h, a
nbr_seed_set:
        ld      (nbr_s0), hl
        ld      a, h
        xor     $A2
        ld      h, a
        ld      a, l
        xor     $80
        ld      l, a
        ld      (nbr_s1), hl
        ret

; ---------------------------------------------------------------------------
; nbr_below - a number below n, with no modulo bias
; Entry : A = n
; Exit  : A = 0 to n-1  (0 if n is 0 or 1)
;
; Masking to the next power of two and rejecting anything too big keeps every
; value equally likely. Taking the remainder instead would favour the low end,
; which shows up as loaded dice the moment n is not a power of two.
; ---------------------------------------------------------------------------
nbr_below:
        or      a
        ret     z                       ; n = 0
        dec     a
        ret     z                       ; n = 1, only 0 is possible
        ld      b, a                    ; B = highest value wanted

        ld      c, a                    ; smear the bits down to build a mask
        srl     c
        or      c
        ld      c, a
        srl     c
        srl     c
        or      c
        ld      c, a
        srl     c
        srl     c
        srl     c
        srl     c
        or      c
        ld      c, a                    ; C = mask

nbr_below_try:
        push    bc
        call    nbr_byte
        pop     bc
        and     c
        cp      b
        ret     z
        jr      nc, nbr_below_try       ; over the top, draw again
        ret

; ---------------------------------------------------------------------------
; nbr_beloww - the 16-bit form, for screen coordinates
; Entry : HL = n
; Exit  : HL = 0 to n-1  (0 if n is 0 or 1)
;
; The byte version cannot express a 320 or 640 pixel wide screen, which is
; most of what a Next program wants a random number for.
; ---------------------------------------------------------------------------
nbr_beloww:
        ld      a, h
        or      l
        ret     z                       ; n = 0
        dec     hl
        ld      a, h
        or      l
        ret     z                       ; n = 1, HL is already 0
        ld      (nbr_max), hl

        ld      b, 15                   ; smear the top bit down into a mask
nbr_bw_smear:
        ld      d, h
        ld      e, l
        srl     d
        rr      e
        ld      a, h
        or      d
        ld      h, a
        ld      a, l
        or      e
        ld      l, a
        djnz    nbr_bw_smear
        ld      (nbr_mask), hl

nbr_bw_try:
        call    nbr_word
        ld      de, (nbr_mask)
        ld      a, h
        and     d
        ld      h, a
        ld      a, l
        and     e
        ld      l, a
        ld      de, (nbr_max)
        push    hl
        or      a
        sbc     hl, de
        pop     hl                      ; POP does not disturb the flags
        ret     c                       ; below the top, keep it
        ret     z                       ; exactly the top, keep it
        jr      nbr_bw_try              ; over the top, draw again

; ============================================================================
; STATE - reached only by name
; ============================================================================
nbr_s0:         dw      $C0DE
nbr_s1:         dw      $A280
nbr_max:        dw      0
nbr_mask:       dw      0
