; ============================================================================
; nb_PLOT.asm - NextBuild Layer 2 drawing primitives, assembler core
; David Saphier / em00k
;
; The routines here work in all three Layer 2 modes and pick what to do from
; nextlib's `_screen_mode` byte, which InitLayer2() sets. Nothing in this file
; touches IX, IY or the shadow registers, so it is safe to call straight out of
; inline asm inside a Boriel SUB.
;
; It is meant to be included from nextlib_primitives.bas, which puts it in a
; code bank and wraps every entry point in a BASIC SUB. Including it by hand
; works too - it is plain zxbasm with no BASIC dependencies beyond
; `_screen_mode`.
;
; ---------------------------------------------------------------------------
; Layer 2 memory, for the arithmetic below
;
;   256x192  8bpp  row major     3 x 16K   addr = (Y AND 63)*256 + X
;                                          16K section = Y/64, port bits 7-6
;   320x256  8bpp  column major  5 x 16K   addr = (X AND 63)*256 + Y
;                                          16K bank = X/64, port bit 4 + 2-0
;   640x256  4bpp  column major  5 x 16K   two pixels per byte, byte = X/2
;                                          addr = ((X/2) AND 63)*256 + Y
;                                          16K bank = X/128
;
; Port $123B, written with bit 4 clear, is the control byte: bit 0 maps Layer 2
; over $0000 for writing, bit 1 is the legacy visible flag, bit 2 maps it for
; reading as well (needed for the 4bpp read-modify-write), bits 7-6 are the 16K
; section in 256x192. Written with bit 4 set it only updates the bank offset in
; bits 2-0 and leaves the control bits alone - that is the two-write sequence
; every routine here uses for the 320 and 640 modes.
; ============================================================================

NBP_PORT            equ $123B

; ============================================================================
; ADDRESSING
; ============================================================================

; ---------------------------------------------------------------------------
; nbp_addr_w  - map Layer 2 for writing and address the pixel at (DE,H)
; nbp_addr_rw - the same, but readable too, for read-modify-write
;
; Entry : DE = X (0-639), H = Y (0-255)
; Exit  : CF set   - off screen. Nothing is mapped, HL is rubbish
;         CF clear - HL addresses the byte and Layer 2 is mapped over $0000.
;                    In 640 mode nbp_nib says which nibble the pixel is in
; Uses  : AF, BC, DE, HL
;
; The caller must finish with nbp_off, or Layer 2 stays over the bottom 16K.
; ---------------------------------------------------------------------------
nbp_addr_rw:
        ld      a, %00000111                ; + bit 2, readable at $0000
        jr      nbp_addr_go
nbp_addr_w:
        ld      a, %00000011                ; write enable, layer visible
nbp_addr_go:
        ld      (nbp_ctl), a
        ld      a, (._screen_mode)
        and     3
        jr      z, nbp_addr0
        dec     a
        jr      z, nbp_addr1
        jr      nbp_addr2

; --- 256x192, 8bpp, row major ----------------------------------------------
nbp_addr0:
        ld      a, d
        or      a
        scf
        ret     nz                          ; X > 255
        ld      a, h
        cp      192
        ccf
        ret     c                           ; Y > 191

        ; The section in bits 7-6 and the bank offset in bits 2-0 are separate
        ; fields, and the offset only changes on a write with bit 4 set. This
        ; mode never wants an offset, but whatever ran before us may have left
        ; one - nextlib's Layer 2 text does - and it would shift every row by
        ; 64 per unit. So zero it first, then set the section.
        ld      bc, NBP_PORT
        ld      a, $10
        out     (c), a
        ld      a, h
        and     %11000000                   ; Y/64 is already in the port bits
        ld      l, a
        ld      a, (nbp_ctl)
        or      l
        out     (c), a
        xor     a
        ld      (nbp_bank), a               ; sections do not use bank offsets

        ld      a, h
        and     63
        ld      l, e                        ; L = X
        ld      h, a                        ; H = Y within the section
        or      a                           ; CF = 0
        ret

; --- 320x256, 8bpp, column major -------------------------------------------
nbp_addr1:
        ld      a, d
        or      a
        jr      z, nbp_a1_lo                ; X < 256
        dec     a
        scf
        ret     nz                          ; X > 511
        ld      a, e
        cp      64
        ccf
        ret     c                           ; X > 319
        ld      a, 4                        ; X 256-319 is the last bank
        jr      nbp_map
nbp_a1_lo:
        ld      a, e
        rlca                                ; X/64 for X < 256
        rlca
        and     3
        jr      nbp_map

; --- 640x256, 4bpp, column major, two pixels per byte ----------------------
nbp_addr2:
        ld      a, d
        cp      2
        jr      c, nbp_a2_ok                ; X < 512
        scf
        ret     nz                          ; X > 767
        ld      a, e
        cp      128
        ccf
        ret     c                           ; X > 639
nbp_a2_ok:
        ld      a, e
        and     1                           ; even X is the left/high nibble
        ld      (nbp_nib), a
        srl     d
        rr      e                           ; DE = X/2, the byte column
        ld      a, d
        or      a
        jr      z, nbp_a2_lo
        ld      a, 4                        ; byte columns 256-319
        jr      nbp_map
nbp_a2_lo:
        ld      a, e
        rlca
        rlca
        and     3
        ; falls through

; --- common tail for the two column major modes ----------------------------
; A = 16K bank 0-4, E = byte column, H = Y
nbp_map:
        push    hl
        push    de
        call    nbp_setbank
        pop     de
        pop     hl
        ld      a, e
        and     63
        ld      l, h                        ; L = Y
        ld      h, a                        ; H = column within the bank
        or      a                           ; CF = 0
        ret

; ---------------------------------------------------------------------------
; nbp_setbank  - point the Layer 2 window at 16K bank A
; nbp_bumpbank - move it on to the next one, keeping AF and HL
; ---------------------------------------------------------------------------
nbp_setbank:
        ld      (nbp_bank), a
        ld      l, a
        ld      bc, NBP_PORT
        ld      a, (nbp_ctl)
        out     (c), a                      ; control bits first
        ld      a, l
        or      $10                         ; then bits 2-0 as the bank offset
        out     (c), a
        ret

nbp_bumpbank:
        push    af
        push    hl
        ld      a, (nbp_bank)
        inc     a
        call    nbp_setbank
        pop     hl
        pop     af
        ret

; ---------------------------------------------------------------------------
; nbp_off - hand the bottom 16K back to the ROM
; ---------------------------------------------------------------------------
nbp_off:
        ld      bc, NBP_PORT
        ld      a, $10                      ; bank offset back to 0
        out     (c), a
        ld      a, %00000010                ; visible, nothing mapped
        out     (c), a
        ret

; ---------------------------------------------------------------------------
; nbp_begin / nbp_end - Layer 2 sits over $0038, so an IM 1 interrupt taken
; while it is mapped lands in pixels. Under IM2 the vector table and handler
; are up in the resident program, so the guard is not needed and would only
; cost the music its ticks.
; ---------------------------------------------------------------------------
nbp_begin:
    #ifndef IM2
        ld      a, i                        ; P/V = IFF2
        di
        ld      a, 0
        jp      po, nbp_bg_off
        inc     a
nbp_bg_off:
        ld      (nbp_iff), a
    #endif
        ret

nbp_end:
    #ifndef IM2
        ld      a, (nbp_iff)
        or      a
        ret     z
        ei
    #endif
        ret

; ---------------------------------------------------------------------------
; nbp_dims - screen extent of the current mode into nbp_maxx / nbp_maxy
; ---------------------------------------------------------------------------
nbp_dims:
        ld      a, (._screen_mode)
        and     3
        jr      z, nbp_dim0
        dec     a
        jr      z, nbp_dim1
        ld      hl, 639
        jr      nbp_dim_tall
nbp_dim1:
        ld      hl, 319
nbp_dim_tall:
        ld      (nbp_maxx), hl
        ld      a, 255
        ld      (nbp_maxy), a
        ret
nbp_dim0:
        ld      hl, 255
        ld      (nbp_maxx), hl
        ld      a, 191
        ld      (nbp_maxy), a
        ret

; ============================================================================
; PIXELS
; ============================================================================

; ---------------------------------------------------------------------------
; nbp_plot - plot one pixel in whatever mode is current
; Entry : DE = X, H = Y, L = colour (0-15 in 640 mode)
; ---------------------------------------------------------------------------
nbp_plot:
        ld      a, (._screen_mode)
        and     3
        cp      2
        jr      z, nbp_plot4
        ld      a, l
        ld      (nbp_tcol), a
        call    nbp_addr_w
        ret     c
        ld      a, (nbp_tcol)
        ld      (hl), a
        jp      nbp_off

nbp_plot4:
        ld      a, l
        and     15
        ld      (nbp_tcol), a
        call    nbp_addr_rw
        ret     c
        ld      a, (nbp_nib)
        or      a
        ld      a, (nbp_tcol)
        jr      nz, nbp_p4_right
        rlca                                ; even X -> high nibble
        rlca
        rlca
        rlca
        ld      e, a
        ld      a, (hl)
        and     $0F
        jr      nbp_p4_write
nbp_p4_right:
        ld      e, a
        ld      a, (hl)
        and     $F0
nbp_p4_write:
        or      e
        ld      (hl), a
        jp      nbp_off

; ---------------------------------------------------------------------------
; nbp_point - read the colour of the pixel at (DE,H)
; Exit : A = colour, 0 if the pixel is off screen
; ---------------------------------------------------------------------------
nbp_point:
        call    nbp_addr_rw
        jr      c, nbp_pt_off
        ld      a, (hl)
        ld      e, a
        ld      a, (._screen_mode)
        and     3
        cp      2
        ld      a, e
        jr      nz, nbp_pt_done
        ld      a, (nbp_nib)                ; 4bpp: pick the nibble
        or      a
        ld      a, e
        jr      nz, nbp_pt_low
        rrca
        rrca
        rrca
        rrca
nbp_pt_low:
        and     15
nbp_pt_done:
        ld      (nbp_tcol), a
        call    nbp_off
        ld      a, (nbp_tcol)
        ret
nbp_pt_off:
        xor     a
        ret

; ============================================================================
; SPANS
;
; Both take nbp_sx (X), nbp_sy (Y), nbp_sl (length) and nbp_col. X and Y are
; signed 16-bit so that a span hanging off the left or the top clips instead of
; wrapping - the circle filler relies on it. The inputs are left alone; the
; clipping happens on the working copies.
; ============================================================================

; ---------------------------------------------------------------------------
; nbp_hline - horizontal run of nbp_sl pixels starting at (nbp_sx, nbp_sy)
; ---------------------------------------------------------------------------
nbp_hline:
        call    nbp_dims
        ld      hl, (nbp_sl)
        ld      (nbp_wl), hl
        ld      hl, (nbp_sy)
        ld      (nbp_wy), hl
        ld      hl, (nbp_sx)
        ld      (nbp_wx), hl

        ld      hl, (nbp_wy)                ; a horizontal line is on one row,
        ld      a, h                        ; so the row is in or it is out
        or      a
        ret     nz
        ld      a, (nbp_maxy)
        cp      l
        ret     c

        ld      hl, (nbp_wx)                ; clip the left end
        bit     7, h
        jr      z, nbp_hl_left
        ld      de, (nbp_wl)
        add     hl, de                      ; length + (negative) X
        ld      a, h
        or      l
        ret     z
        bit     7, h
        ret     nz                          ; nothing of it is on screen
        ld      (nbp_wl), hl
        ld      hl, 0
        ld      (nbp_wx), hl
nbp_hl_left:
        ld      hl, (nbp_maxx)              ; clip the right end
        ld      de, (nbp_wx)
        or      a
        sbc     hl, de
        ret     c                           ; starts past the right edge
        inc     hl                          ; HL = pixels available
        ld      de, (nbp_wl)
        or      a
        sbc     hl, de
        jr      nc, nbp_hl_right
        add     hl, de
        ld      (nbp_wl), hl
nbp_hl_right:
        ld      hl, (nbp_wl)
        ld      a, h
        or      l
        ret     z

        ld      a, (._screen_mode)
        and     3
        jr      z, nbp_hl_m0
        dec     a
        jr      nz, nbp_hl_slow             ; 640 mode, one pixel at a time

; --- 320x256: X walks the high byte, and off the end of a bank every 64 -----
        ld      de, (nbp_wx)
        ld      a, (nbp_wy)
        ld      h, a
        call    nbp_addr_w
        ret     c
        ld      de, (nbp_wl)
        ld      a, (nbp_col)
nbp_hl_m1_lp:
        ld      (hl), a
        inc     h
        bit     6, h
        jr      z, nbp_hl_m1_cnt
        ld      h, 0                        ; next bank, back to column 0
        call    nbp_bumpbank
nbp_hl_m1_cnt:
        dec     de
        ld      b, a
        ld      a, d
        or      e
        ld      a, b
        jr      nz, nbp_hl_m1_lp
        jp      nbp_off

; --- 256x192: X is the low byte, so the run is consecutive bytes -----------
nbp_hl_m0:
        ld      a, (nbp_wl)                 ; a full 256 arrives as 0, which is
        ld      b, a                        ; exactly what djnz wants
        push    bc
        ld      de, (nbp_wx)
        ld      a, (nbp_wy)
        ld      h, a
        call    nbp_addr_w
        pop     bc
        ret     c
        ld      a, (nbp_col)
nbp_hl_m0_lp:
        ld      (hl), a
        inc     l
        djnz    nbp_hl_m0_lp
        jp      nbp_off

; --- anything else ---------------------------------------------------------
nbp_hl_slow:
        ld      de, (nbp_wx)
        ld      hl, (nbp_wl)
nbp_hl_sl_lp:
        push    de
        push    hl
        ld      a, (nbp_wy)
        ld      h, a
        ld      a, (nbp_col)
        ld      l, a
        call    nbp_plot
        pop     hl
        pop     de
        inc     de
        dec     hl
        ld      a, h
        or      l
        jr      nz, nbp_hl_sl_lp
        ret

; ---------------------------------------------------------------------------
; nbp_vline - vertical run of nbp_sl pixels starting at (nbp_sx, nbp_sy)
; ---------------------------------------------------------------------------
nbp_vline:
        call    nbp_dims
        ld      hl, (nbp_sl)
        ld      (nbp_wl), hl
        ld      hl, (nbp_sy)
        ld      (nbp_wy), hl
        ld      hl, (nbp_sx)
        ld      (nbp_wx), hl

        bit     7, h                        ; one column, so it is in or out
        ret     nz
        ld      de, (nbp_maxx)
        ex      de, hl
        or      a
        sbc     hl, de
        ret     c

        ld      hl, (nbp_wy)                ; clip the top
        bit     7, h
        jr      z, nbp_vl_top
        ld      de, (nbp_wl)
        add     hl, de
        ld      a, h
        or      l
        ret     z
        bit     7, h
        ret     nz
        ld      (nbp_wl), hl
        ld      hl, 0
        ld      (nbp_wy), hl
nbp_vl_top:
        ld      a, (nbp_maxy)               ; clip the bottom
        ld      l, a
        ld      h, 0
        ld      de, (nbp_wy)
        or      a
        sbc     hl, de
        ret     c
        inc     hl
        ld      de, (nbp_wl)
        or      a
        sbc     hl, de
        jr      nc, nbp_vl_bot
        add     hl, de
        ld      (nbp_wl), hl
nbp_vl_bot:
        ld      hl, (nbp_wl)
        ld      a, h
        or      l
        ret     z

        ld      a, (._screen_mode)
        and     3
        jr      z, nbp_vl_slow              ; 256x192 is row major, so this is
        dec     a                           ; the awkward direction
        jr      nz, nbp_vl_m2

; --- 320x256: one column is 256 consecutive bytes --------------------------
        ld      a, (nbp_wl)
        ld      b, a
        push    bc
        ld      de, (nbp_wx)
        ld      a, (nbp_wy)
        ld      h, a
        call    nbp_addr_w
        pop     bc
        ret     c
        ld      a, (nbp_col)
nbp_vl_m1_lp:
        ld      (hl), a
        inc     l
        djnz    nbp_vl_m1_lp
        jp      nbp_off

; --- 640x256: same column, so the nibble and mask are worked out once ------
nbp_vl_m2:
        ld      a, (nbp_wl)
        ld      b, a
        push    bc
        ld      de, (nbp_wx)
        ld      a, (nbp_wy)
        ld      h, a
        call    nbp_addr_rw
        pop     bc
        ret     c
        ld      a, (nbp_col)
        and     15
        ld      e, a
        ld      a, (nbp_nib)
        or      a
        ld      a, e
        jr      nz, nbp_vl_m2_right
        rlca
        rlca
        rlca
        rlca
        ld      d, a                        ; D = colour in place
        ld      e, $0F                      ; E = the nibble to keep
        jr      nbp_vl_m2_lp
nbp_vl_m2_right:
        ld      d, a
        ld      e, $F0
nbp_vl_m2_lp:
        ld      a, (hl)
        and     e
        or      d
        ld      (hl), a
        inc     l
        djnz    nbp_vl_m2_lp
        jp      nbp_off

; --- anything else ---------------------------------------------------------
nbp_vl_slow:
        ld      a, (nbp_wy)
        ld      (nbp_ty), a
        ld      hl, (nbp_wl)
nbp_vl_sl_lp:
        push    hl
        ld      de, (nbp_wx)
        ld      a, (nbp_ty)
        ld      h, a
        ld      a, (nbp_col)
        ld      l, a
        call    nbp_plot
        ld      a, (nbp_ty)
        inc     a
        ld      (nbp_ty), a
        pop     hl
        dec     hl
        ld      a, h
        or      l
        jr      nz, nbp_vl_sl_lp
        ret

; ============================================================================
; LINES
; ============================================================================

; ---------------------------------------------------------------------------
; nbp_line - Bresenham from (nbp_x0,nbp_y0) to (nbp_x1,nbp_y1) in nbp_col
; All four coordinates are signed 16-bit; nbp_x0/nbp_y0 are walked to the end
; point, so they are rubbish afterwards
; ---------------------------------------------------------------------------
; Note the sign tests below use bit 7 of the difference, not the carry out of
; SBC. Carry is an *unsigned* borrow, so with a coordinate off the left or the
; top - which the polygon code passes routinely - 60 - (-40) borrows and looks
; negative, and the line walks off in the wrong direction.
nbp_line:
        ld      hl, (nbp_x1)                ; dx = abs(x1-x0), sx = sign
        ld      de, (nbp_x0)
        or      a
        sbc     hl, de
        ld      de, 1
        bit     7, h
        jr      z, nbp_ln_dx
        call    nbp_neghl
        ld      de, -1
nbp_ln_dx:
        ld      (nbp_dx), hl
        ld      (nbp_sxs), de

        ld      hl, (nbp_y1)                ; dy = abs(y1-y0), sy = sign
        ld      de, (nbp_y0)
        or      a
        sbc     hl, de
        ld      de, 1
        bit     7, h
        jr      z, nbp_ln_dy
        call    nbp_neghl
        ld      de, -1
nbp_ln_dy:
        ld      (nbp_dy), hl
        ld      (nbp_sys), de

        ld      hl, (nbp_dx)                ; err = dx - dy
        ld      de, (nbp_dy)
        or      a
        sbc     hl, de
        ld      (nbp_err), hl

nbp_ln_loop:
        ld      hl, (nbp_y0)
        ld      a, h
        or      a
        jr      nz, nbp_ln_skip             ; row off screen, step past it
        ld      de, (nbp_x0)
        ld      h, l
        ld      a, (nbp_col)
        ld      l, a
        call    nbp_plot
nbp_ln_skip:
        ld      hl, (nbp_x0)                ; reached the far end?
        ld      de, (nbp_x1)
        or      a
        sbc     hl, de
        jr      nz, nbp_ln_step
        ld      hl, (nbp_y0)
        ld      de, (nbp_y1)
        or      a
        sbc     hl, de
        ret     z

nbp_ln_step:
        ld      hl, (nbp_err)               ; e2 = err*2
        add     hl, hl
        ld      (nbp_e2), hl

        ld      de, (nbp_dy)                ; e2 > -dy  ->  step in X
        add     hl, de
        call    nbp_gt0
        jr      z, nbp_ln_ystep
        ld      hl, (nbp_err)
        ld      de, (nbp_dy)
        or      a
        sbc     hl, de
        ld      (nbp_err), hl
        ld      hl, (nbp_x0)
        ld      de, (nbp_sxs)
        add     hl, de
        ld      (nbp_x0), hl

nbp_ln_ystep:
        ld      hl, (nbp_dx)                ; e2 < dx  ->  step in Y
        ld      de, (nbp_e2)
        or      a
        sbc     hl, de
        call    nbp_gt0
        jp      z, nbp_ln_loop
        ld      hl, (nbp_err)
        ld      de, (nbp_dx)
        add     hl, de
        ld      (nbp_err), hl
        ld      hl, (nbp_y0)
        ld      de, (nbp_sys)
        add     hl, de
        ld      (nbp_y0), hl
        jp      nbp_ln_loop

; HL = -HL
nbp_neghl:
        ld      a, h
        cpl
        ld      h, a
        ld      a, l
        cpl
        ld      l, a
        inc     hl
        ret

; NZ if HL > 0 taken as signed, Z otherwise
nbp_gt0:
        bit     7, h
        jr      nz, nbp_gt0_no
        ld      a, h
        or      l
        ret
nbp_gt0_no:
        xor     a
        ret

; ============================================================================
; RECTANGLES
;
; nbp_x0,nbp_y0 - nbp_x1,nbp_y1 in nbp_col. The corners are sorted first, so
; either diagonal will do
; ============================================================================

nbp_rect:
        call    nbp_sort
        call    nbp_extent
        ld      hl, (nbp_x0)                ; top
        ld      (nbp_sx), hl
        ld      hl, (nbp_y0)
        ld      (nbp_sy), hl
        ld      hl, (nbp_w)
        ld      (nbp_sl), hl
        call    nbp_hline
        ld      hl, (nbp_y1)                ; bottom
        ld      (nbp_sy), hl
        ld      hl, (nbp_w)
        ld      (nbp_sl), hl
        call    nbp_hline
        ld      hl, (nbp_y0)                ; left
        ld      (nbp_sy), hl
        ld      hl, (nbp_h)
        ld      (nbp_sl), hl
        call    nbp_vline
        ld      hl, (nbp_x1)                ; right
        ld      (nbp_sx), hl
        ld      hl, (nbp_h)
        ld      (nbp_sl), hl
        jp      nbp_vline

nbp_fillrect:
        call    nbp_sort
        call    nbp_extent
        ld      hl, (nbp_x0)
        ld      (nbp_sx), hl
        ld      hl, (nbp_y0)
        ld      (nbp_sy), hl
        ld      a, (._screen_mode)
        and     3
        jr      z, nbp_fr_rows

        ld      hl, (nbp_w)                 ; column major: fill down columns,
        ld      (nbp_cnt), hl               ; which is the fast direction
nbp_fr_col:
        ld      hl, (nbp_h)
        ld      (nbp_sl), hl
        call    nbp_vline
        ld      hl, (nbp_sx)
        inc     hl
        ld      (nbp_sx), hl
        ld      hl, (nbp_cnt)
        dec     hl
        ld      (nbp_cnt), hl
        ld      a, h
        or      l
        jr      nz, nbp_fr_col
        ret

nbp_fr_rows:
        ld      hl, (nbp_h)                 ; row major: fill along rows
        ld      (nbp_cnt), hl
nbp_fr_row:
        ld      hl, (nbp_w)
        ld      (nbp_sl), hl
        call    nbp_hline
        ld      hl, (nbp_sy)
        inc     hl
        ld      (nbp_sy), hl
        ld      hl, (nbp_cnt)
        dec     hl
        ld      (nbp_cnt), hl
        ld      a, h
        or      l
        jr      nz, nbp_fr_row
        ret

; put the corners in order, signed so a corner off the left or the top sorts
; where it belongs rather than as a huge positive number
nbp_sort:
        ld      hl, (nbp_x1)
        ld      de, (nbp_x0)
        call    nbp_cmp
        jr      nc, nbp_srt_y
        ld      hl, (nbp_x0)
        ld      de, (nbp_x1)
        ld      (nbp_x1), hl
        ld      (nbp_x0), de
nbp_srt_y:
        ld      hl, (nbp_y1)
        ld      de, (nbp_y0)
        call    nbp_cmp
        ret     nc
        ld      hl, (nbp_y0)
        ld      de, (nbp_y1)
        ld      (nbp_y1), hl
        ld      (nbp_y0), de
        ret

; nbp_w / nbp_h from the sorted corners
nbp_extent:
        ld      hl, (nbp_x1)
        ld      de, (nbp_x0)
        or      a
        sbc     hl, de
        inc     hl
        ld      (nbp_w), hl
        ld      hl, (nbp_y1)
        ld      de, (nbp_y0)
        or      a
        sbc     hl, de
        inc     hl
        ld      (nbp_h), hl
        ret

; ---------------------------------------------------------------------------
; nbp_cls - flood the whole screen, whatever the mode, in nbp_col
; ClearLayer2() is far quicker; this is here so the primitives are complete
; ---------------------------------------------------------------------------
nbp_cls:
        call    nbp_dims
        ld      hl, 0
        ld      (nbp_x0), hl
        ld      (nbp_y0), hl
        ld      hl, (nbp_maxx)
        ld      (nbp_x1), hl
        ld      a, (nbp_maxy)
        ld      l, a
        ld      h, 0
        ld      (nbp_y1), hl
        jp      nbp_fillrect

; ============================================================================
; CIRCLES
;
; Midpoint circle, centre (nbp_x0,nbp_y0), radius nbp_r, colour nbp_col.
; Everything is worked out in signed 16-bit, so a circle running off any edge
; clips rather than wrapping round the screen
; ============================================================================

nbp_circle:
        ld      hl, nbp_cpoints
        ld      (nbp_cvec), hl
        jr      nbp_circle_go

nbp_fillcircle:
        ld      hl, nbp_cspans
        ld      (nbp_cvec), hl

nbp_circle_go:
        ld      a, (nbp_r)
        or      a
        jr      z, nbp_ci_dot
        ld      hl, 0
        ld      (nbp_cx), hl                ; x = 0
        ld      a, (nbp_r)
        ld      l, a
        ld      h, 0
        ld      (nbp_cy), hl                ; y = r
        ex      de, hl                      ; DE = r
        ld      hl, 1
        or      a
        sbc     hl, de
        ld      (nbp_cd), hl                ; d = 1 - r

nbp_ci_loop:
        ld      hl, (nbp_cy)                ; while x <= y
        ld      de, (nbp_cx)
        or      a
        sbc     hl, de
        ret     c
        call    nbp_cstep

        ld      hl, (nbp_cd)
        bit     7, h
        jr      z, nbp_ci_dpos
        ld      hl, (nbp_cx)                ; d < 0: d += 2x + 3
        add     hl, hl
        ld      de, 3
        add     hl, de
        ex      de, hl
        ld      hl, (nbp_cd)
        add     hl, de
        ld      (nbp_cd), hl
        jr      nbp_ci_incx
nbp_ci_dpos:
        ld      hl, (nbp_cx)                ; d >= 0: d += 2(x-y) + 5, y -= 1
        ld      de, (nbp_cy)
        or      a
        sbc     hl, de
        add     hl, hl
        ld      de, 5
        add     hl, de
        ex      de, hl
        ld      hl, (nbp_cd)
        add     hl, de
        ld      (nbp_cd), hl
        ld      hl, (nbp_cy)
        dec     hl
        ld      (nbp_cy), hl
nbp_ci_incx:
        ld      hl, (nbp_cx)
        inc     hl
        ld      (nbp_cx), hl
        jp      nbp_ci_loop

nbp_cstep:
        ld      hl, (nbp_cvec)
        jp      (hl)

; radius 0 is just the centre pixel
nbp_ci_dot:
        ld      hl, (nbp_y0)
        ld      a, h
        or      a
        ret     nz
        ld      de, (nbp_x0)
        ld      h, l
        ld      a, (nbp_col)
        ld      l, a
        jp      nbp_plot

; ---------------------------------------------------------------------------
; The eight octants. Working the four sums out once and pairing them up is
; both smaller and clearer than building each point from scratch
; ---------------------------------------------------------------------------
nbp_cpoints:
        call    nbp_csums
        ld      de, (nbp_xpx)
        ld      hl, (nbp_ypy)
        call    nbp_cplot
        ld      de, (nbp_xmx)
        ld      hl, (nbp_ypy)
        call    nbp_cplot
        ld      de, (nbp_xpx)
        ld      hl, (nbp_ymy)
        call    nbp_cplot
        ld      de, (nbp_xmx)
        ld      hl, (nbp_ymy)
        call    nbp_cplot
        ld      de, (nbp_xpy)
        ld      hl, (nbp_ypx)
        call    nbp_cplot
        ld      de, (nbp_xmy)
        ld      hl, (nbp_ypx)
        call    nbp_cplot
        ld      de, (nbp_xpy)
        ld      hl, (nbp_ymx)
        call    nbp_cplot
        ld      de, (nbp_xmy)
        ld      hl, (nbp_ymx)
        jp      nbp_cplot

; DE = X, HL = Y, both signed. A row outside 0-255 has nothing on screen;
; a column outside is left to nbp_plot, whose bounds check already rejects it
nbp_cplot:
        ld      a, h
        or      a
        ret     nz
        ld      h, l
        ld      a, (nbp_col)
        ld      l, a
        jp      nbp_plot

; the four spans of a filled circle
nbp_cspans:
        call    nbp_csums
        ld      hl, (nbp_cx)                ; rows cy +/- y, 2x+1 wide
        add     hl, hl
        inc     hl
        ld      (nbp_sw), hl
        ld      hl, (nbp_xmx)
        ld      (nbp_sx0), hl
        ld      hl, (nbp_ypy)
        call    nbp_span
        ld      hl, (nbp_ymy)
        call    nbp_span
        ld      hl, (nbp_cy)                ; rows cy +/- x, 2y+1 wide
        add     hl, hl
        inc     hl
        ld      (nbp_sw), hl
        ld      hl, (nbp_xmy)
        ld      (nbp_sx0), hl
        ld      hl, (nbp_ypx)
        call    nbp_span
        ld      hl, (nbp_ymx)
        jp      nbp_span

; HL = row; nbp_sx0 and nbp_sw are the span
nbp_span:
        ld      (nbp_sy), hl
        ld      hl, (nbp_sx0)
        ld      (nbp_sx), hl
        ld      hl, (nbp_sw)
        ld      (nbp_sl), hl
        jp      nbp_hline

; centre +/- the two offsets, in both axes
nbp_csums:
        ld      hl, (nbp_x0)
        ld      de, (nbp_cx)
        add     hl, de
        ld      (nbp_xpx), hl
        ld      hl, (nbp_x0)
        ld      de, (nbp_cx)
        or      a
        sbc     hl, de
        ld      (nbp_xmx), hl
        ld      hl, (nbp_x0)
        ld      de, (nbp_cy)
        add     hl, de
        ld      (nbp_xpy), hl
        ld      hl, (nbp_x0)
        ld      de, (nbp_cy)
        or      a
        sbc     hl, de
        ld      (nbp_xmy), hl

        ld      hl, (nbp_y0)
        ld      de, (nbp_cx)
        add     hl, de
        ld      (nbp_ypx), hl
        ld      hl, (nbp_y0)
        ld      de, (nbp_cx)
        or      a
        sbc     hl, de
        ld      (nbp_ymx), hl
        ld      hl, (nbp_y0)
        ld      de, (nbp_cy)
        add     hl, de
        ld      (nbp_ypy), hl
        ld      hl, (nbp_y0)
        ld      de, (nbp_cy)
        or      a
        sbc     hl, de
        ld      (nbp_ymy), hl
        ret

; ============================================================================
; POLYGONS
;
; nbp_pts points at a list of nbp_np points, four bytes each: X as a word then
; Y as a word, which is what a Boriel `DIM p(n) as uInteger` array holds when
; you write x, y, x, y and hand over @p(0).
;
; The fill builds a left and a right edge for every row - walk each edge once
; with Bresenham, keeping the lowest and highest X it touches on each row, then
; draw one nbp_hline per row between them. That is O(perimeter) with no
; division anywhere, which matters a lot more on a Z80 than the alternative.
;
; The price is that it fills the CONVEX HULL. Triangles, quads, rotated boxes
; and 3D faces are all convex so they come out exact; a concave outline gets
; filled across its dents. Split those into triangles.
; ============================================================================

; ---------------------------------------------------------------------------
; nbp_cmp - signed 16-bit compare of HL against DE
; Exit : CF set if HL < DE. HL and DE are preserved, A is not
; ---------------------------------------------------------------------------
nbp_cmp:
        push    hl
        ld      a, h
        xor     d
        jp      m, nbp_cmp_split        ; signs differ
        or      a
        sbc     hl, de                  ; same sign, so unsigned order matches
        pop     hl
        ret
nbp_cmp_split:
        ld      a, h                    ; whichever is negative is the smaller
        rla                             ; CF = sign of HL
        pop     hl
        ret

; ---------------------------------------------------------------------------
; nbp_getpt - point A of the list
; Exit : HL = X, DE = Y
; ---------------------------------------------------------------------------
nbp_getpt:
        ld      l, a
        ld      h, 0
        add     hl, hl
        add     hl, hl                  ; four bytes per point
        ld      de, (nbp_pts)
        add     hl, de
        ld      e, (hl)
        inc     hl
        ld      d, (hl)
        inc     hl
        ex      de, hl                  ; HL = X, DE -> the Y field
        push    hl
        ex      de, hl
        ld      e, (hl)
        inc     hl
        ld      d, (hl)                 ; DE = Y
        pop     hl
        ret

; the point after A, wrapping round to close the shape
nbp_nextpt:
        inc     a
        ld      hl, nbp_np
        cp      (hl)
        jr      c, nbp_getpt
        xor     a
        jr      nbp_getpt

; ---------------------------------------------------------------------------
; nbp_polyline - the outline, closed
; ---------------------------------------------------------------------------
nbp_polyline:
        ld      a, (nbp_np)
        cp      2
        ret     c
        xor     a
        ld      (nbp_pi), a
nbp_pl_edge:
        ld      a, (nbp_pi)
        call    nbp_getpt
        ld      (nbp_x0), hl
        ld      (nbp_y0), de
        ld      a, (nbp_pi)
        call    nbp_nextpt
        ld      (nbp_x1), hl
        ld      (nbp_y1), de
        call    nbp_line
        ld      a, (nbp_pi)
        inc     a
        ld      (nbp_pi), a
        ld      hl, nbp_np
        cp      (hl)
        jr      c, nbp_pl_edge
        ret

; ---------------------------------------------------------------------------
; nbp_polyfill - solid, convex
; ---------------------------------------------------------------------------
nbp_polyfill:
        ld      a, (nbp_np)
        cp      3
        ret     c                       ; fewer than three points is a line
        call    nbp_dims

        ; --- the row range the shape covers ---
        xor     a
        call    nbp_getpt
        ld      (nbp_pymin), de
        ld      (nbp_pymax), de
        ld      a, 1
nbp_pf_scan:
        push    af
        call    nbp_getpt
        ex      de, hl                  ; HL = Y
        ld      de, (nbp_pymin)
        call    nbp_cmp
        jr      nc, nbp_pf_notmin
        ld      (nbp_pymin), hl
nbp_pf_notmin:
        ld      de, (nbp_pymax)
        call    nbp_cmp
        jr      c, nbp_pf_notmax
        ld      (nbp_pymax), hl
nbp_pf_notmax:
        pop     af
        inc     a
        ld      hl, nbp_np
        cp      (hl)
        jr      c, nbp_pf_scan

        ; --- clip it to the screen ---
        ld      hl, (nbp_pymin)
        bit     7, h
        jr      z, nbp_pf_minok
        ld      hl, 0
        ld      (nbp_pymin), hl
nbp_pf_minok:
        ld      a, (nbp_maxy)
        ld      l, a
        ld      h, 0
        ld      de, (nbp_pymax)
        call    nbp_cmp
        jr      nc, nbp_pf_maxok
        ld      (nbp_pymax), hl
nbp_pf_maxok:
        ld      hl, (nbp_pymax)
        ld      de, (nbp_pymin)
        call    nbp_cmp
        ret     c                       ; entirely above or below the screen

        ; --- empty every row we are about to use ---
        ld      hl, (nbp_pymin)
        ld      (nbp_ry), hl
nbp_pf_clear:
        ld      hl, (nbp_ry)
        add     hl, hl
        ld      de, nbp_xmin
        add     hl, de
        ld      (hl), $FF
        inc     hl
        ld      (hl), $7F               ; xmin = 32767
        ld      hl, (nbp_ry)
        add     hl, hl
        ld      de, nbp_xmax
        add     hl, de
        ld      (hl), $00
        inc     hl
        ld      (hl), $80               ; xmax = -32768
        ld      hl, (nbp_ry)
        ld      de, (nbp_pymax)
        call    nbp_cmp
        jr      nc, nbp_pf_edges
        inc     hl
        ld      (nbp_ry), hl
        jr      nbp_pf_clear

        ; --- walk every edge into those rows ---
nbp_pf_edges:
        xor     a
        ld      (nbp_pi), a
nbp_pf_edge:
        ld      a, (nbp_pi)
        call    nbp_getpt
        ld      (nbp_ex), hl
        ld      (nbp_ey), de
        ld      a, (nbp_pi)
        call    nbp_nextpt
        ld      (nbp_e2x), hl
        ld      (nbp_e2y), de
        call    nbp_walkedge
        ld      a, (nbp_pi)
        inc     a
        ld      (nbp_pi), a
        ld      hl, nbp_np
        cp      (hl)
        jr      c, nbp_pf_edge

        ; --- one span per row ---
        ld      hl, (nbp_pymin)
        ld      (nbp_ry), hl
nbp_pf_row:
        ld      hl, (nbp_ry)
        add     hl, hl
        ld      (nbp_recofs), hl
        ld      de, nbp_xmin
        add     hl, de
        ld      e, (hl)
        inc     hl
        ld      d, (hl)
        ld      (nbp_rx0), de
        ld      hl, (nbp_recofs)
        ld      de, nbp_xmax
        add     hl, de
        ld      e, (hl)
        inc     hl
        ld      d, (hl)
        ld      (nbp_rx1), de

        ld      hl, (nbp_rx1)
        ld      de, (nbp_rx0)
        call    nbp_cmp
        jr      c, nbp_pf_next          ; nothing landed on this row
        or      a
        sbc     hl, de                  ; xmax - xmin
        inc     hl
        ld      (nbp_sl), hl
        ld      hl, (nbp_rx0)
        ld      (nbp_sx), hl            ; nbp_hline does the left/right clip
        ld      hl, (nbp_ry)
        ld      (nbp_sy), hl
        call    nbp_hline
nbp_pf_next:
        ld      hl, (nbp_ry)
        ld      de, (nbp_pymax)
        call    nbp_cmp
        ret     nc
        inc     hl
        ld      (nbp_ry), hl
        jr      nbp_pf_row

; ---------------------------------------------------------------------------
; nbp_walkedge - (nbp_ex,nbp_ey) to (nbp_e2x,nbp_e2y), recording the X range
; the edge covers on each row. Both ends of the run are recorded, so a nearly
; horizontal edge leaves no gaps in the envelope
; ---------------------------------------------------------------------------
nbp_walkedge:
        ld      hl, (nbp_e2y)
        ld      de, (nbp_ey)
        or      a
        sbc     hl, de
        ld      de, 1
        bit     7, h                    ; the sign of the result, not the carry
        jr      z, nbp_we_dyp
        call    nbp_neghl
        ld      de, -1
nbp_we_dyp:
        ld      (nbp_edy), hl
        ld      (nbp_esy), de
        ld      a, h
        or      l
        jr      nz, nbp_we_slope
        ld      hl, (nbp_ex)            ; horizontal edge, one row, both ends
        call    nbp_rec
        ld      hl, (nbp_e2x)
        jp      nbp_rec

nbp_we_slope:
        ld      hl, (nbp_e2x)
        ld      de, (nbp_ex)
        or      a
        sbc     hl, de
        ld      de, 1
        bit     7, h
        jr      z, nbp_we_dxp
        call    nbp_neghl
        ld      de, -1
nbp_we_dxp:
        ld      (nbp_edx), hl
        ld      (nbp_esx), de
        ld      hl, (nbp_edy)
        srl     h
        rr      l
        ld      (nbp_eerr), hl          ; start at dy/2 so rows round to
                                        ; nearest, which is what nbp_line's
                                        ; Bresenham does - otherwise the fill
                                        ; sits half a pixel off its own outline
        ld      hl, (nbp_edy)
        inc     hl
        ld      (nbp_erows), hl         ; dy + 1 rows to cover

nbp_we_row:
        ld      hl, (nbp_ex)
        call    nbp_rec                 ; first X of this row
        ld      hl, (nbp_erows)
        dec     hl
        ld      (nbp_erows), hl
        ld      a, h
        or      l
        ret     z

        ld      hl, (nbp_eerr)          ; err += dx
        ld      de, (nbp_edx)
        add     hl, de
        ld      (nbp_eerr), hl
        ld      b, 0                    ; did X move on this row?
nbp_we_carry:
        ld      hl, (nbp_eerr)
        ld      de, (nbp_edy)
        or      a
        sbc     hl, de
        jr      c, nbp_we_carried
        ld      (nbp_eerr), hl
        ld      hl, (nbp_ex)
        ld      de, (nbp_esx)
        add     hl, de
        ld      (nbp_ex), hl
        ld      b, 1
        jr      nbp_we_carry
nbp_we_carried:
        ld      a, b
        or      a
        jr      z, nbp_we_nextrow
        ld      hl, (nbp_ex)            ; last X that was still on this row
        ld      de, (nbp_esx)
        or      a
        sbc     hl, de
        call    nbp_rec
nbp_we_nextrow:
        ld      hl, (nbp_ey)
        ld      de, (nbp_esy)
        add     hl, de
        ld      (nbp_ey), hl
        jr      nbp_we_row

; ---------------------------------------------------------------------------
; nbp_rec - widen row nbp_ey to include X in HL. Rows off the screen are
; dropped here, which is also what keeps the table indices in range
; ---------------------------------------------------------------------------
nbp_rec:
        ld      (nbp_recx), hl
        ld      hl, (nbp_ey)
        ld      a, h
        or      a
        ret     nz                      ; row outside 0-255
        ld      a, (nbp_maxy)
        cp      l
        ret     c                       ; row past the bottom
        add     hl, hl
        ld      (nbp_recofs), hl

        ld      de, nbp_xmin
        add     hl, de
        ld      e, (hl)
        inc     hl
        ld      d, (hl)
        ld      hl, (nbp_recx)
        call    nbp_cmp
        jr      nc, nbp_rec_max
        ld      hl, (nbp_recofs)
        ld      de, nbp_xmin
        add     hl, de
        ld      de, (nbp_recx)
        ld      (hl), e
        inc     hl
        ld      (hl), d
nbp_rec_max:
        ld      hl, (nbp_recofs)
        ld      de, nbp_xmax
        add     hl, de
        ld      e, (hl)
        inc     hl
        ld      d, (hl)
        ld      hl, (nbp_recx)
        call    nbp_cmp
        ret     c
        ld      hl, (nbp_recofs)
        ld      de, nbp_xmax
        add     hl, de
        ld      de, (nbp_recx)
        ld      (hl), e
        inc     hl
        ld      (hl), d
        ret

; ============================================================================
; STATE
; Reached only by name - nothing above falls through into it
; ============================================================================

nbp_ctl:        db      %00000011           ; port control bits while mapped
nbp_bank:       db      0                   ; 16K bank currently in the window
nbp_nib:        db      0                   ; 640 mode: 0 = left, 1 = right
nbp_tcol:       db      0                   ; colour parked across a call
nbp_iff:        db      0                   ; interrupts on when we came in?
nbp_ty:         db      0                   ; row counter for the slow vline
nbp_maxx:       dw      0                   ; extent of the current mode
nbp_maxy:       db      0

nbp_col:        db      0                   ; --- caller sets these ---
nbp_r:          db      0
nbp_x0:         dw      0
nbp_y0:         dw      0
nbp_x1:         dw      0
nbp_y1:         dw      0
nbp_sx:         dw      0                   ; span start / length
nbp_sy:         dw      0
nbp_sl:         dw      0

nbp_wx:         dw      0                   ; --- working copies ---
nbp_wy:         dw      0
nbp_wl:         dw      0
nbp_w:          dw      0
nbp_h:          dw      0
nbp_cnt:        dw      0

nbp_dx:         dw      0                   ; --- line ---
nbp_dy:         dw      0
nbp_sxs:        dw      0
nbp_sys:        dw      0
nbp_err:        dw      0
nbp_e2:         dw      0

nbp_cvec:       dw      0                   ; --- circle ---
nbp_cx:         dw      0
nbp_cy:         dw      0
nbp_cd:         dw      0
nbp_sx0:        dw      0
nbp_sw:         dw      0
nbp_xpx:        dw      0
nbp_xmx:        dw      0
nbp_xpy:        dw      0
nbp_xmy:        dw      0
nbp_ypx:        dw      0
nbp_ymx:        dw      0
nbp_ypy:        dw      0
nbp_ymy:        dw      0

nbp_pts:        dw      0               ; --- polygon ---
nbp_np:         db      0
nbp_pi:         db      0
nbp_pymin:      dw      0
nbp_pymax:      dw      0
nbp_ry:         dw      0
nbp_rx0:        dw      0
nbp_rx1:        dw      0
nbp_recx:       dw      0
nbp_recofs:     dw      0
nbp_ex:         dw      0
nbp_ey:         dw      0
nbp_e2x:        dw      0
nbp_e2y:        dw      0
nbp_edx:        dw      0
nbp_edy:        dw      0
nbp_esx:        dw      0
nbp_esy:        dw      0
nbp_eerr:       dw      0
nbp_erows:      dw      0

; a triangle is a three point polygon, built here rather than in the caller
nbp_tribuf:     ds      12, 0

; left and right edge of every row, filled in by nbp_walkedge
nbp_xmin:       ds      512, 0
nbp_xmax:       ds      512, 0
