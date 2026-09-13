
' NextBuildStudio v1.0
' Custom size preloaded DELTA-RLE playback -- L2-DIRECT variant
'
' Decodes delta chunks straight into Layer 2 memory. No RAM work buffer;
' no separate blit phase. Exploits the Next's dual-map trick: with L2
' write-enable set on port $123B, WRITES to $0000-$3FFF land in L2 RAM
' while READS from $0000-$3FFF still come from whatever banks we've
' paged into slots 0/1. So source lives in slots 0/1 (via $50/$51,
' replacing ROM) and L2 writes go to the same window without conflict.
'
' Compared to the RAM-work-buffer variant (BallKicker-192x128-Delta.bas):
'   - Saves 4 banks of RAM (32K work buffer eliminated)
'   - Frees slots 6/7 entirely -- 16K of address space at $C000-$FFFF
'     is available for larger program code and data
'   - "Prev frame" for delta comparisons IS the current L2 content --
'     skip = advance write pointer without writing = pixel preserved
'
' Cost: the decoder must walk (frame_x, frame_y) rather than a linear
' pointer, because L2 rows are 256 bytes wide even for narrower frames.
' Row wraps and L2 band changes are handled by re-computing DE and
' re-poking the $123B port bank bits.
'
declare sub DecodePreloadedFrame(xpos as ubyte, ypos as ubyte, table as uinteger)
declare sub ResetPreloadedMovie(table as uinteger)


' Reset source pointer to start of stream. L2 content itself is not
' cleared -- the encoder's forced raw-chunked frame 0 overwrites every
' pixel of the visible region on first play and on loop.
sub ResetPreloadedMovie(table as uinteger)
    poke table + 7, 0
    poke table + 8, 0
    poke table + 9, peek(table + 5)
end sub

' Table layout (10 bytes; work_bank/work_banks unused in L2-direct):
'   +0  db unused
'   +1  db width           ; assumes xpos + width <= 256 (frame within one L2 column)
'   +2  db height
'   +3  db unused          ; was work_bank in RAM-buffer variant
'   +4  db unused          ; was work_banks
'   +5  db src_bank        ; first bank of preloaded NMV data
'   +6  db src_banks       ; informational
'   +7  dw cur_src_hl      ; decoder state -- running HL across the file
'   +9  db cur_src_bank    ; decoder state
sub DecodePreloadedFrame(xpos as ubyte, ypos as ubyte, table as uinteger)

    asm
        push    namespace   dpf
        push    ix

        ld      a, (ix+5)
        ld      (.dpf_xpos), a
        ld      a, (ix+7)
        ld      (.dpf_ypos), a

        ld      l, (ix+8)
        ld      h, (ix+9)
        push    hl
        pop     ix                              ; IX -> table

        ld      a, (ix+1)
        ld      (.dpf_width), a
        ld      a, (ix+2)
        ld      (.dpf_height), a

        ; bytes_left = width * height
        ld      e, (ix+1)
        ld      d, (ix+2)
        mul     d, e
        ld      (.dpf_bytes_left), de

        ; Frame position resets each call: (fx, fy) = (0, 0)
        xor     a
        ld      (.dpf_fx), a
        ld      (.dpf_fy), a

        ; Page source pair into slots 0,1 (replaces ROM). L2 write-enable
        ; below makes writes to $0000-$3FFF land in L2 while reads still
        ; come from source banks.
        ld      a, (ix+9)
        ld      (.dpf_cur_stream), a
        nextreg $50, a
        inc     a
        nextreg $51, a

        ld      l, (ix+7)
        ld      h, (ix+8)                       ; HL = resumed src ptr

        ; Compute initial DE (L2 addr for fx=0, fy=0) and enable L2 write
        call    .dpf_setup_l2_de

    .dpf_decode_loop:
        ; --- skip count ---
        ld      a, (hl)
        inc     hl
        call    .dpf_src_check
        ld      b, a                            ; save skip in B

        or      a
        jr      z, .dpf_skip_zero
        push    bc                              ; preserve B=skip across helper
        call    .dpf_advance_skip
        pop     bc
    .dpf_skip_zero:

        ; --- copy count ---
        ld      a, (hl)
        inc     hl
        call    .dpf_src_check
        ld      c, a                            ; save copy in C
        or      a
        jr      z, .dpf_no_copy

        push    bc
        ld      c, a
        ld      b, 0
        call    .dpf_copy_bc
        call    .dpf_src_check
        pop     bc
    .dpf_no_copy:

        ; bytes_left -= (B + C)
        ld      a, b
        add     a, c
        ld      (.dpf_adv_lo), a
        ld      a, 0
        adc     a, 0
        ld      (.dpf_adv_hi), a

        push    hl
        push    de
        ld      hl, (.dpf_bytes_left)
        ld      bc, (.dpf_adv_lo)
        or      a
        sbc     hl, bc
        ld      (.dpf_bytes_left), hl
        pop     de
        pop     hl

        ld      a, (.dpf_bytes_left)
        or      a
        jp      nz, .dpf_decode_loop
        ld      a, (.dpf_bytes_left+1)
        or      a
        jp      nz, .dpf_decode_loop

        ; Save persistent state
        ld      (ix+7), l
        ld      (ix+8), h
        ld      a, (.dpf_cur_stream)
        ld      (ix+9), a

        ; Disable L2 writes (visible bit still set = 2)
        ld      bc, .LAYER2_ACCESS_PORT
        ld      a, 2
        out     (c), a

        ; Restore ROM into slots 0,1
        nextreg $50, $ff
        nextreg $51, $ff

        pop     ix
        pop     namespace
        jp      .dpf_end

    ; ------------------------------------------------------------
    ; Set DE = L2 write address for current (fx, fy), and pulse
    ; port $123B so writes land in the correct L2 band.
    ; ------------------------------------------------------------
    .dpf_setup_l2_de:
        push    bc

        ; A = screen_y = ypos + fy
        ld      a, (.dpf_ypos)
        ld      b, a
        ld      a, (.dpf_fy)
        add     a, b

        ; port bits = (screen_y & $c0) | 3  (band select | write-enable)
        push    af
        and     $c0
        or      3
        ld      bc, .LAYER2_ACCESS_PORT
        out     (c), a
        pop     af

        ; D = y_within_band = screen_y & $3f
        and     $3f
        ld      d, a

        ; E = screen_x = xpos + fx  (assumes xpos + width <= 256)
        ld      a, (.dpf_xpos)
        ld      b, a
        ld      a, (.dpf_fx)
        add     a, b
        ld      e, a

        pop     bc
        ret

    ; ------------------------------------------------------------
    ; Advance (fx, fy) and DE by A bytes without writing (skip case).
    ; Splits at row boundaries so DE gets re-computed via setup_l2_de.
    ; ------------------------------------------------------------
    .dpf_advance_skip:
    .dpf_skip_loop:
        or      a
        ret     z

        ; C = avail_in_row = width - fx  (1..width)
        ld      b, a                            ; save remaining
        ld      a, (.dpf_width)
        ld      c, a
        ld      a, (.dpf_fx)
        neg
        add     a, c
        ld      c, a                            ; C = avail

        ld      a, b                            ; A = remaining
        cp      c
        jr      c, .dpf_skip_within             ; remaining < avail

        ; remaining >= avail: fill row, wrap
        sub     c
        push    af                              ; save new remaining
        xor     a
        ld      (.dpf_fx), a
        ld      a, (.dpf_fy)
        inc     a
        ld      (.dpf_fy), a
        call    .dpf_setup_l2_de
        pop     af
        jr      .dpf_skip_loop

    .dpf_skip_within:
        ; A < C: just advance fx and E by A
        ld      c, a
        add     a, e
        ld      e, a
        ld      a, (.dpf_fx)
        add     a, c
        ld      (.dpf_fx), a
        ret

    ; ------------------------------------------------------------
    ; LDIR BC bytes from HL to DE, splitting at row boundaries.
    ; Each row-wrap re-runs setup_l2_de.
    ; ------------------------------------------------------------
    .dpf_copy_bc:
        ld      (.dpf_cpy_rem), bc

    .dpf_copy_loop:
        ld      a, (.dpf_cpy_rem)
        ld      b, a
        ld      a, (.dpf_cpy_rem+1)
        or      b
        ret     z                               ; remaining == 0

        ; avail = width - fx
        ld      a, (.dpf_width)
        ld      b, a
        ld      a, (.dpf_fx)
        neg
        add     a, b                            ; A = avail (< 256)
        ld      b, a                            ; B = avail

        ; chunk = min(remaining, avail)
        ld      a, (.dpf_cpy_rem+1)
        or      a
        jr      nz, .dpf_cpy_use_avail          ; remaining > 255 -> avail
        ld      a, (.dpf_cpy_rem)
        cp      b
        jr      c, .dpf_cpy_use_rem             ; remaining < avail
    .dpf_cpy_use_avail:
        ld      a, b
    .dpf_cpy_use_rem:
        ; A = chunk (1..255)
        ld      (.dpf_cpy_chunk), a
        ld      c, a
        ld      b, 0
        ldir                                    ; HL->DE, C bytes

        ; remaining -= chunk
        push    hl
        push    de
        ld      hl, (.dpf_cpy_rem)
        ld      a, (.dpf_cpy_chunk)
        ld      c, a
        ld      b, 0
        or      a
        sbc     hl, bc
        ld      (.dpf_cpy_rem), hl
        pop     de
        pop     hl

        ; fx += chunk; wrap if fx == width
        ld      a, (.dpf_cpy_chunk)
        ld      b, a
        ld      a, (.dpf_fx)
        add     a, b
        ld      (.dpf_fx), a
        ld      b, a
        ld      a, (.dpf_width)
        cp      b
        jp      nz, .dpf_copy_loop

        xor     a
        ld      (.dpf_fx), a
        ld      a, (.dpf_fy)
        inc     a
        ld      (.dpf_fy), a
        call    .dpf_setup_l2_de
        jp      .dpf_copy_loop

    ; ------------------------------------------------------------
    ; Source-side bank-cross helper (slots 0/1). Sliding window,
    ; advance one bank per $2000-cross.
    ; ------------------------------------------------------------
    .dpf_src_check:
        push    af
        ld      a, h
        cp      $20
        jr      c, .dpf_src_done
        ld      a, (.dpf_cur_stream)
        inc     a
        ld      (.dpf_cur_stream), a
        nextreg $50, a
        inc     a
        nextreg $51, a
        ld      a, h
        sub     $20
        ld      h, a
    .dpf_src_done:
        pop     af
        ret

    .dpf_xpos:          db 0
    .dpf_ypos:          db 0
    .dpf_width:         db 0
    .dpf_height:        db 0
    .dpf_cur_stream:    db 0
    .dpf_fx:            db 0
    .dpf_fy:            db 0
    .dpf_bytes_left:    dw 0
    .dpf_adv_lo:        db 0
    .dpf_adv_hi:        db 0
    .dpf_cpy_rem:       dw 0
    .dpf_cpy_chunk:     db 0

    .dpf_end:
    end asm

end sub
