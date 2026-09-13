' vim:ts=4:et:
' ---------------------------------------------------------
' NextLib v9.2 - movie playback - David Saphier / em00k 2022
' ---------------------------------------------------------
' Delta-RLE (NMV) and raw frame movie playback for layer 2.
' Split out of nextlib.bas.
'
' Include this after nextlib.bas:
'   #include <nextlib.bas>
'   #include <nextlib_movie.bas>
'
' Provides:
'   PlayMovie(xpos, ypos, img_data, frame)  - blit one raw frame from a bank chain
'   ResetMovieDelta(table)                  - rewind an NMV stream, clear the work buffer
'   NextMovieFrame(xpos, ypos, table)       - decode and blit the next NMV frame
' ---------------------------------------------------------

#ifndef __NEXTLIB_MOVIE__
#define __NEXTLIB_MOVIE__

#include once <nextlib.bas>

sub PlayMovie(xpos as uinteger, ypos as ubyte, img_data as uinteger, frame as ubyte = 0 )
    
    ' plots image on L2 256x192 mode
    ' xpos = 0 to 255 - width of image 
    ' ypos = 0 to 192 - height of image
    ' frame is offset from start image derived from w * h 
    ' img_data points to table such as 
    ' image_test:
    '    asm
    '        ; bank  spare  
    '        db  32, 00, 00
    '        ; offset in bank  
    '        dw 00
    '    end asm 
    ' 

    asm 
    
    
        push    namespace   playmovie
        ; jp      image_plot_done

        push    ix
    straight_plot:
        ; Plots one frame from a contiguous movie buffer.
        ; Movie data layout: frames written back-to-back, each frame = width*height bytes.
        ; Total byte offset for frame N = N * (w*h) — needs 24-bit math once it exceeds 65535.

        ld      e, (ix+4)                               ; x
        ld      d, (ix+7)                               ; y
        ld      (add1+1), de                            ; save yx address

        ld      l, (ix+8)                               ; img_data table ptr
        ld      h, (ix+9)

        ld      a, (ix+11)                              ; frame index

        push    hl
        pop     ix                                      ; IX -> img_data table {bank, w, h, ...}

        ld      (__frame_save), a                       ; save frame
        ld      e, (ix+1)                               ; width
        ld      d, (ix+2)                               ; height
        mul     d, e                                    ; DE = w*h (frame size, 16-bit)
        ld      (__size_save), de                       ; save size

        ; --- 24-bit product: frame * size -> A:H:L (A=hi, H=mid, L=lo) ---
        ld      a, (__frame_save)
        ld      d, a                                    ; D = frame
        ld      a, (__size_save)                        ; A = size_lo
        ld      e, a
        mul     d, e                                    ; DE = frame * size_lo
        ld      l, e                                    ; L = byte 0
        ld      h, d                                    ; H = byte 1 (partial)

        ld      a, (__frame_save)
        ld      d, a
        ld      a, (__size_save+1)                      ; size_hi
        ld      e, a
        mul     d, e                                    ; DE = frame * size_hi

        ld      a, h
        add     a, e
        ld      h, a                                    ; H = byte 1 (final)
        ld      a, d
        adc     a, 0                                    ; A = byte 2 (final)
        ; A:H:L now holds 24-bit byte offset.

        ; bank_offset = (A << 3) | (H >> 5)
        ; within_8k   = ((H & $1F) << 8) | L
        ld      b, a                                    ; B = byte 2
        ld      c, h                                    ; C = byte 1
        sla     b
        sla     b
        sla     b                                       ; B = byte_2 << 3
        ld      a, c
        srl     a
        srl     a
        srl     a
        srl     a
        srl     a                                       ; A = byte_1 >> 5
        or      b                                       ; A = bank_offset

        ld      e, (ix+0)                               ; base bank from table
        add     a, e                                    ; absolute bank
        nextreg $50, a                                  ; map slot 0
        inc     a
        nextreg $51, a                                  ; map slot 1 (next 8k for LDIR cross)
        ld      (__source_bank_save), a                 ; save last bank

        ld      a, c                                    ; A = byte 1
        and     $1F                                     ; mask to 13-bit address
        ld      h, a                                    ; HL = within_8k address
        ; L already holds byte 0 (low byte of offset)

        ld      b, (ix+2)                               ; height
            
    add1:
        ld      de, 0000                                ; will hold yx with self mod code
    line1:
         
        ; Check for bottom clipping
        ld      de, (add1+1)                            ; get yx
        ld      a, d                                    ; get y
        cp      192                                     ; compare with bottom of screen
        jr      nc, __clip_exit                         ; if y >= 192, exit (clipped)

        push    bc                                      ; save bc / height

        call    get_xy_pos_l2                           ; get position and l2 bank in place
        ld      b, 0                                    ; clear b
        ld      a,(ix+1)                                ; width
        or      a                                       ; is width full width?
        jr      nz, __was_not_zero                       ; check to see if we have a width of 256
        ld      b, 1                                    ; yes, so set b to 1

    __was_not_zero:
        ld      c, a
        ldir                                            ; copy line
        pop     bc                                      ; get back height
        ld      de, (add1+1)                            ; get back yx
        inc     d                                       ; inc y 

        ld      a, 192                                  ; line 192
        cp      d 

        jr      z, __fix_banks

        

    __fix_return:
        ld      (add1+1), de                            ; save yx again
        dec     b                                       ; decrease height
        jr      nz, line1                               ; was height 0? no then loop to line1

    __clip_exit:
                                 ; clean up stack (restore bc that was pushed)
        ld      bc, .LAYER2_ACCESS_PORT                 ; turn off layer 2 writes
        ld      a, 2
        out     (c), a
         
        jp      image_plot_done
;    __clip_exit_start:
;        pop     bc                                      ; pop bc off stack from LDIR
;        jr      __clip_exit:

    __fix_banks:
        ; need to check if source HL crossed into next bank
        ; when HL was incremented by LDIR
        ld      a, h
        and     $e0                                      ; check if h crossed into next 8kb
        jr      z, __no_source_bank_cross                ; if h < $2000, no bank cross

        ; source crossed into next bank, update slots $50 and $51
        ld      a, (__source_bank_save)                  ; get last bank
        inc     a                                        ; next bank
        nextreg $50, a
        inc     a
        nextreg $51, a
        ld      (__source_bank_save), a                  ; save new last bank
        ld      a, h
        and     $1f                                      ; wrap h around 8kb
        ld      h, a
        jp      __fix_return

    __no_source_bank_cross:
        ; source didn't cross, just restore the current banks
        ld      a, (__source_bank_save)                  ; get last bank
        dec     a                                        ; previous bank (current slot 0)
        nextreg $50, a
        inc     a
        nextreg $51, a
        jp      __fix_return

    __source_bank_save:
        db      0                                        ; storage for current source bank
    __frame_save:
        db      0                                        ; storage for frame index (24-bit mul)
    __size_save:
        dw      0                                        ; storage for w*h frame size (24-bit mul)

    get_xy_pos_l2:

        ; input d = y, e = x
        ; uses de a bc 
        ;push    bc
        ld      bc,.LAYER2_ACCESS_PORT
        ld      a,d                                     ; put y into A 
        and     $c0                                     ; yy00 0000

        or      3                                       ; yy00 0011
        out     (c),a                                   ; select 8k-bank    
        ld      a,d                                     ; yyyy yyyy
        and     63                                      ; 00yy yyyy 
        ld      d,a
        ;pop     bc
        ret        

    image_plot_done:
        nextreg $50,$ff
        nextreg $51,$ff

        pop     ix
        pop     namespace

    end asm

end sub

sub fastcall ResetMovieDelta(table as uinteger)

    ' Resets a delta-RLE movie. Clears the 16KB work buffer (banks at
    ' table+3 and table+4, mapped to slots 0,1) and rewinds the source
    ' pointer to the start of the movie at table+0.
    ' Call once before the first NextMovieFrame, or any time you want
    ' to restart playback from frame 0.
    '
    ' table layout (NMV movies, 5 bytes):
    '   db src_base_bank, width, height, work_bank, 0
    '   (work_bank uses work_bank and work_bank+1 as a contiguous pair)

    asm
        push    namespace   nmv
        push    ix                              ; fastcall gets no ix frame, so save
        push    hl                              ; the caller's ix and point ix at the
        pop     ix                              ; table address passed in hl

        ; map work buffer (table+3, table+3+1) to slots 0 1
        ld      a, (ix+3)
        nextreg $50, a
        inc     a
        nextreg $50, a

        ; clear 16KB at $C000-$FFFF
        ld      hl, $0000
        ld      de, $0001
        ld      bc, $3FFF
        ld      (hl), 0
        ldir

        nextreg $50, $ff
        nextreg $51, $ff

        ; reset shared source state (defined in NextMovieFrame's asm)
        ld      a, (ix+0)
        ld      (.nmv_src_bank), a
        xor     a
        ld      (.nmv_src_offs), a
        ld      (.nmv_src_offs+1), a

        pop     ix
        pop     namespace
    end asm

end sub

sub NextMovieFrame(xpos as ubyte, ypos as ubyte, table as uinteger)

    ' Decodes the next delta-RLE frame from a movie stream into a work
    ' buffer (16KB at $C000-$FFFF) and then blits the work buffer to L2
    ' at (xpos, ypos). The source pointer is preserved between calls so
    ' frames stream continuously — call ResetMovieDelta(table) once
    ' before the first frame (and again to loop).
    '
    ' Movie stream format (NMV):
    '   repeated [skip:1][copy:1][copy_bytes:copy] until width*height
    '   pixels have been emitted per frame. No per-frame header.
    '
    ' table layout (5 bytes):
    '   db src_base_bank, width, height, work_bank, 0
    '
    ' Limits: width*height must fit in 16KB (e.g. 128x96 = 12288 bytes ok).

    asm
        push    namespace   nmv
        push    ix

        ld      a, (ix+5)                       ; xpos
        ld      (.nmv_xpos), a
        ld      a, (ix+7)                       ; ypos
        ld      (.nmv_ypos), a

        ld      l, (ix+8)
        ld      h, (ix+9)                       ; HL = table
        push    hl
        pop     ix                              ; IX -> table

        ld      a, (ix+1)                       ; cache width
        ld      (.nmv_width), a
        ld      a, (ix+2)                       ; cache height
        ld      (.nmv_height), a

        ; end_addr = $C000 + (width * height)
        ld      e, (ix+1)
        ld      d, (ix+2)
        mul     d, e
        ld      hl, $C000
        add     hl, de
        ld      (.nmv_end_addr), hl

        ; map work buffer to slots 6, 7
        ld      a, (ix+3)
        nextreg $56, a
        inc     a
        nextreg $57, a

        ; map source banks to slots 0, 1
        ld      a, (.nmv_src_bank)
        nextreg $50, a
        inc     a
        nextreg $51, a

        ld      hl, (.nmv_src_offs)             ; src ptr (0..$1FFF after last shift)
        ld      de, $C000                       ; dst ptr (work buffer)

    .nmv_decode_loop:
        ; --- read skip count ---
        ld      a, (hl)
        inc     hl
        call    .nmv_hl_check
        add     a, e
        ld      e, a
        jr      nc, .nmv_skip_nc
        inc     d
    .nmv_skip_nc:

        ; --- read copy count ---
        ld      a, (hl)
        inc     hl
        call    .nmv_hl_check
        or      a
        jr      z, .nmv_no_copy

        ld      c, a
        ld      b, 0
        ldir                                    ; HL src -> DE dst
        call    .nmv_hl_check

    .nmv_no_copy:
        ; if DE < end_addr -> continue
        push    hl
        ld      h, d
        ld      l, e
        ld      bc, (.nmv_end_addr)
        xor     a
        sbc     hl, bc
        pop     hl
        jr      c, .nmv_decode_loop

        ; frame done — save src ptr for next call
        ld      (.nmv_src_offs), hl

        nextreg $50, $ff
        nextreg $51, $ff

        ; ===== blit work buffer to L2 =====
        ld      a, (.nmv_xpos)
        ld      e, a                            ; E = xpos
        ld      a, (.nmv_ypos)
        ld      d, a                            ; D = y (running)
        ld      a, (.nmv_height)
        ld      b, a                            ; B = lines remaining
        ld      hl, $C000                       ; HL = work buffer src

    .nmv_blit_loop:
        ld      a, d
        cp      192
        jr      nc, .nmv_blit_done

        push    bc                              ; save line counter
        push    de                              ; save (D=y, E=x)

        ld      bc, .LAYER2_ACCESS_PORT
        ld      a, d
        and     $c0
        or      3
        out     (c), a                          ; select L2 8K bank
        ld      a, d
        and     63
        ld      d, a                            ; D = y within bank
        ; E already = xpos

        ld      a, (.nmv_width)
        or      a
        ld      bc, 0
        jr      nz, .nmv_blit_w_set
        inc     b                               ; width=0 means 256 -> BC=256
        jr      .nmv_blit_do
    .nmv_blit_w_set:
        ld      c, a
    .nmv_blit_do:
        ldir                                    ; HL (work) -> DE (L2)

        pop     de                              ; restore (D=y, E=x)
        ; HL auto-advanced by LDIR by exactly width bytes
        inc     d                               ; next y
        pop     bc                              ; restore line counter
        djnz    .nmv_blit_loop

    .nmv_blit_done:
        ld      bc, .LAYER2_ACCESS_PORT
        ld      a, 2
        out     (c), a                          ; L2 writes off

        nextreg $56, $00                        ; $ff only means rom on slots 0 and 1,
        nextreg $57, $01                        ; so put the default banks back by hand

        pop     ix
        pop     namespace
        jp      .nmv_end

    .nmv_hl_check:
        ; if HL >= $2000, advance src bank pair by 1 and HL -= $2000.
        ; preserves A and F so the caller can keep using the byte it
        ; just read.
        push    af
        ld      a, h
        cp      $20
        jr      c, .nmv_hc_done
        ld      a, (.nmv_src_bank)
        inc     a
        ld      (.nmv_src_bank), a
        nextreg $50, a
        inc     a
        nextreg $51, a
        ld      a, h
        sub     $20
        ld      h, a
    .nmv_hc_done:
        pop     af
        ret



    .nmv_end:
    end asm

end sub
asm 
    ; shared movie state, this sits in the main code path so jump over it 
    jp      nmv_data_end 
    .nmv_xpos:      db 0
    .nmv_ypos:      db 0
    .nmv_width:     db 0
    .nmv_height:    db 0
    .nmv_end_addr:  dw 0
    .nmv_src_bank:  db 0
    .nmv_src_offs:  dw 0
nmv_data_end: 
end asm 

#endif
