; ============================================================================
; nb_FMT.asm - fixed width number formatting, assembler core
;
; Writes ASCII into a buffer the caller owns. No heap, no allocation, so it is
; safe from an interrupt handler and costs nothing per frame - which is the
; whole point, because the alternative people write is a chain of
; `if score < 100 ... if score < 1000 ...` magnitude tests.
;
; One conversion path for every width: the value is widened into a 32-bit
; accumulator and divided down by a table of powers of ten by repeated
; subtraction. The caller picks where in the table to start, so an 8-bit
; value does three digits of work rather than ten.
;
; Nothing here touches IX, IY or the shadow registers.
; ============================================================================

; ---------------------------------------------------------------------------
; nbf_conv - nbf_num to decimal digits
; Entry : A = index into nbf_pow10, 0 = ten digits, 5 = five, 7 = three
; Exit  : nbf_start -> first significant digit, nbf_len = how many
; ---------------------------------------------------------------------------
nbf_conv:
        ld      l, a
        ld      h, 0
        ld      (nbf_first), hl         ; remember where we started
        add     hl, hl                  ; four bytes per power
        add     hl, hl
        ld      de, nbf_pow10
        add     hl, de
        ex      de, hl                  ; DE -> the first power to try

        ld      hl, nbf_tmp
        ld      (nbf_wp), hl
nbf_conv_digit:
        ld      a, '0'
        ld      (nbf_dig), a
nbf_conv_sub:
        call    nbf_sub32               ; nbf_num -= power, CF on borrow
        jr      c, nbf_conv_done
        ld      a, (nbf_dig)
        inc     a
        ld      (nbf_dig), a
        jr      nbf_conv_sub
nbf_conv_done:
        call    nbf_add32               ; put back the subtraction that failed
        ld      hl, (nbf_wp)
        ld      a, (nbf_dig)
        ld      (hl), a
        inc     hl
        ld      (nbf_wp), hl
        ld      hl, nbf_pow10 + 40      ; past the last power?
        or      a
        sbc     hl, de
        jr      nz, nbf_conv_digit

        ; --- strip leading zeros, but always leave one digit ---
        ld      hl, nbf_tmp
        ld      a, 10
        ld      bc, (nbf_first)
        sub     c
        ld      b, a                    ; B = digits emitted
        dec     b                       ; never strip the last one
        jr      z, nbf_conv_len
nbf_conv_strip:
        ld      a, (hl)
        cp      '0'
        jr      nz, nbf_conv_len
        inc     hl
        djnz    nbf_conv_strip
nbf_conv_len:
        ld      (nbf_start), hl
        ex      de, hl
        ld      hl, (nbf_wp)
        or      a
        sbc     hl, de                  ; length = write pointer - start
        ld      a, l
        ld      (nbf_len), a
        ret

; nbf_num -= (DE), 32-bit, CF set on borrow. DE is left on the same power.
nbf_sub32:
        push    de
        ld      hl, (nbf_num)
        ld      a, (de)
        ld      c, a
        inc     de
        ld      a, (de)
        ld      b, a
        inc     de
        or      a
        sbc     hl, bc
        ld      (nbf_num), hl
        ld      hl, (nbf_num + 2)
        ld      a, (de)
        ld      c, a
        inc     de
        ld      a, (de)
        ld      b, a
        sbc     hl, bc
        ld      (nbf_num + 2), hl
        pop     de
        ret

; undo one nbf_sub32
nbf_add32:
        push    de
        ld      hl, (nbf_num)
        ld      a, (de)
        ld      c, a
        inc     de
        ld      a, (de)
        ld      b, a
        inc     de
        add     hl, bc
        ld      (nbf_num), hl
        ld      hl, (nbf_num + 2)
        ld      a, (de)
        ld      c, a
        inc     de
        ld      a, (de)
        ld      b, a
        adc     hl, bc
        ld      (nbf_num + 2), hl
        pop     de
        inc     de                      ; step on to the next power
        inc     de
        inc     de
        inc     de
        ret

; ---------------------------------------------------------------------------
; nbf_emit - the converted digits into the caller's buffer, right aligned
;
; nbf_digits is a MINIMUM width, as printf's is: a number too big for the
; field overruns it rather than being silently truncated into something that
; reads as a different, smaller number. A pad character of 0 means no padding.
; nbf_buf is left pointing just past what was written, so callers can chain.
; ---------------------------------------------------------------------------
nbf_emit:
        ld      a, (nbf_pad)
        or      a
        jr      z, nbf_emit_copy
        ld      a, (nbf_digits)
        ld      b, a
        ld      a, (nbf_len)
        cp      b
        jr      nc, nbf_emit_copy       ; already at or over the width
        ld      c, a
        ld      a, b
        sub     c
        ld      b, a                    ; B = pad characters wanted
        ld      hl, (nbf_buf)
        ld      a, (nbf_pad)
nbf_emit_pad:
        ld      (hl), a
        inc     hl
        djnz    nbf_emit_pad
        ld      (nbf_buf), hl
nbf_emit_copy:
        ld      a, (nbf_len)
        or      a
        ret     z
        ld      b, a
        ld      hl, (nbf_start)
        ld      de, (nbf_buf)
nbf_emit_cp:
        ld      a, (hl)
        ld      (de), a
        inc     hl
        inc     de
        djnz    nbf_emit_cp
        ex      de, hl
        ld      (nbf_buf), hl
        ret

; ---------------------------------------------------------------------------
; Unsigned entry points. nbf_num, nbf_digits, nbf_pad and nbf_buf are set by
; the BASIC wrapper first.
; ---------------------------------------------------------------------------
nbf_u8:
        ld      a, 7                    ; start at 100
        jr      nbf_go
nbf_u16:
        ld      a, 5                    ; start at 10000
        jr      nbf_go
nbf_u32:
        xor     a                       ; start at 1000000000
nbf_go:
        call    nbf_conv
        jp      nbf_emit

; ---------------------------------------------------------------------------
; nbf_i16 - signed, with the minus sign inside the padded field
; ---------------------------------------------------------------------------
nbf_i16:
        ld      hl, (nbf_num)
        bit     7, h
        jr      z, nbf_i16_pos
        ; negate, and shorten the field by one so the sign fits inside it
        ld      a, h
        cpl
        ld      h, a
        ld      a, l
        cpl
        ld      l, a
        inc     hl
        ld      (nbf_num), hl
        ld      hl, 0
        ld      (nbf_num + 2), hl
        ld      a, (nbf_digits)
        or      a
        jr      z, nbf_i16_neg
        dec     a
        ld      (nbf_digits), a
nbf_i16_neg:
        ld      a, 5
        call    nbf_conv
        call    nbf_emit_sign
        jp      nbf_emit
nbf_i16_pos:
        ld      hl, 0
        ld      (nbf_num + 2), hl
        jp      nbf_u16

; the sign goes after the padding, so "  -12" not "-  12"
nbf_emit_sign:
        ld      a, (nbf_pad)
        or      a
        jr      z, nbf_sign_now
        ld      a, (nbf_digits)
        ld      b, a
        ld      a, (nbf_len)
        cp      b
        jr      nc, nbf_sign_now
        ld      c, a
        ld      a, b
        sub     c
        ld      b, a
        ld      hl, (nbf_buf)
        ld      a, (nbf_pad)
nbf_sign_pad:
        ld      (hl), a
        inc     hl
        djnz    nbf_sign_pad
        ld      (nbf_buf), hl
        xor     a
        ld      (nbf_pad), a            ; padding is spent
nbf_sign_now:
        ld      hl, (nbf_buf)
        ld      (hl), '-'
        inc     hl
        ld      (nbf_buf), hl
        ret

; ---------------------------------------------------------------------------
; Hex. Always fixed width, so no padding logic is needed.
; ---------------------------------------------------------------------------
nbf_hex16:
        ld      a, (nbf_num + 1)
        call    nbf_hexbyte
        ld      a, (nbf_num)
        jr      nbf_hexbyte
nbf_hex8:
        ld      a, (nbf_num)
nbf_hexbyte:
        push    af
        rrca
        rrca
        rrca
        rrca
        call    nbf_hexnib
        pop     af
nbf_hexnib:
        and     15
        add     a, '0'
        cp      '9' + 1
        jr      c, nbf_hexput
        add     a, 7                    ; 'A' - '9' - 1
nbf_hexput:
        ld      hl, (nbf_buf)
        ld      (hl), a
        inc     hl
        ld      (nbf_buf), hl
        ret

; ---------------------------------------------------------------------------
; nbf_fx - 8.8 fixed point as "-1.50"
; Entry : nbf_num = the 8.8 value, nbf_digits = decimal places (1-3)
; ---------------------------------------------------------------------------
nbf_fx:
        ld      a, (nbf_digits)
        ld      (nbf_dp), a
        ld      hl, (nbf_num)
        bit     7, h
        jr      z, nbf_fx_pos
        ld      a, h
        cpl
        ld      h, a
        ld      a, l
        cpl
        ld      l, a
        inc     hl
        ld      (nbf_num), hl
        ld      hl, (nbf_buf)
        ld      (hl), '-'
        inc     hl
        ld      (nbf_buf), hl
nbf_fx_pos:
        ld      hl, (nbf_num)
        ld      a, l                    ; keep the 1/256ths before HL is reused
        ld      (nbf_fxlo), a
        ld      a, h                    ; whole part
        ld      l, a
        ld      h, 0
        ld      (nbf_num), hl
        ld      hl, 0
        ld      (nbf_num + 2), hl
        xor     a
        ld      (nbf_pad), a            ; no padding on the whole part
        ld      a, 7
        call    nbf_conv
        call    nbf_emit
        ld      hl, (nbf_buf)
        ld      (hl), '.'
        inc     hl
        ld      (nbf_buf), hl

        ; fraction: repeatedly multiply the 1/256ths by ten
        ld      a, (nbf_fxlo)
        ld      l, a
        ld      h, 0
        ld      a, (nbf_dp)
        ld      b, a
nbf_fx_frac:
        push    bc
        add     hl, hl                  ; x10
        ld      d, h
        ld      e, l
        add     hl, hl
        add     hl, hl
        add     hl, de
        ld      a, h                    ; the digit that carried out
        add     a, '0'
        ld      de, (nbf_buf)
        ld      (de), a
        inc     de
        ld      (nbf_buf), de
        ld      h, 0                    ; keep only the fraction
        pop     bc
        djnz    nbf_fx_frac
        ret

; ============================================================================
; STATE - reached only by name
; ============================================================================
nbf_buf:        dw      0               ; --- caller sets these ---
nbf_num:        dw      0, 0
nbf_digits:     db      0
nbf_pad:        db      0

nbf_tmp:        ds      12, 0           ; --- working ---
nbf_wp:         dw      0
nbf_start:      dw      0
nbf_first:      dw      0
nbf_len:        db      0
nbf_dig:        db      0
nbf_dp:         db      0
nbf_fxlo:       db      0

nbf_pow10:
        dw      $CA00, $3B9A            ; 1000000000
        dw      $E100, $05F5            ; 100000000
        dw      $9680, $0098            ; 10000000
        dw      $4240, $000F            ; 1000000
        dw      $86A0, $0001            ; 100000
        dw      $2710, $0000            ; 10000
        dw      $03E8, $0000            ; 1000
        dw      $0064, $0000            ; 100
        dw      $000A, $0000            ; 10
        dw      $0001, $0000            ; 1
