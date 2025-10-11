

; ZX Spectrum Next Layer 2 Graphics Library
; Complete pixel plotting and graphics primitives
; Supports all three Layer 2 modes: 256x192, 320x256, 640x256

;==============================================================================
; PIXEL PLOTTING ROUTINES
;==============================================================================

;==============================================================================
; Plot pixel in 256x192 mode (8bpp, 256 colors)
; Entry: DE = X coordinate, H = Y coordinate, L = Pixel color
;==============================================================================
plot_256x192:
    push af
    push bc
    
    ; Check bounds
    ld a,d              ; Check X high byte (must be 0 for 256x192)
    or a
    jr nz,.exit4
    ld a,h              ; Check Y coordinate
    cp 192
    jr nc,.exit4
    
    ; Set up Layer 2 access port
    ld bc,$123B         ; Layer 2 Access Port
    in c, (c)
    ; Select bank based on Y coordinate (Y/64)
    ld a,h              ; Get Y coordinate
    and 192             ; Keep bits 7-6 (bank selection: 00, 01, 10)
    or 1                ; Set bit 0 to enable write access
    or c 
    ld c, $3b
    out (c),a           ; Select bank and enable Layer 2 write
    
    ; Calculate address within the selected bank
    ld a,h              ; Get Y coordinate again
    and 63              ; Y mod 64 (offset within bank)
    ld d,a              ; D = Y offset
    ; E already contains X coordinate
    
    ; Plot the pixel
    ld a,l              ; Get pixel color
    ld (de),a           ; Write pixel to Layer 2 memory
    ld a, 2 
    out (c), a 
.exit4:
    ; Disable Layer 2 write access
    
    pop bc
    pop af
    ret

;==============================================================================
; Plot pixel in 320x256 mode (8bpp, 256 colors)
; Entry: DE = X coordinate, H = Y coordinate, L = Pixel color
; Memory layout: Column-major! 5 banks of 64 columns each
;==============================================================================
plot_320x256:
    push af
    push bc
    push hl
    
    ; Check bounds - X must be 0-319, Y must be 0-255
    ld a,d              ; Check X high byte
    or a
    jr z,.bounds_ok     ; X < 256, OK
    cp 1
    jr nz,.exit3         ; X >= 512, out of bounds
    ld a,e              ; X is 256-511
    cp 64               ; Check if X < 320 (E < 64)
    jr nc,.exit3
.bounds_ok:

    ; Enable Layer 2 writes initially
    ld bc,$123B         ; Layer 2 Access Port
    ld a,3              ; Enable writes (bit 0) and show layer (bit 1)
    out (c),a
    
    ; Calculate bank: Bank = X / 64
    ld a,d              ; Check if X >= 256
    or a
    jr z,.calc_low_bank ; X < 256
    
    ; X >= 256, bank = 4 (since X < 320)
    ld a,4
    jr .got_bank
    
.calc_low_bank:
    ; X < 256, bank = X / 64
    ld a,e              ; Get X coordinate
    rrca                ; Shift right 6 times to divide by 64
    rrca
    rrca
    rrca
    rrca
    rrca
    and 3               ; Keep bottom 2 bits (banks 0-3)
    
.got_bank:
    ; Set extended banking mode with calculated bank
    or $10              ; Set bit 4 for extended L2 writes
    out (c),a           ; Set bank offset
    
    ; Calculate address within bank: Y + (X_within_bank * 256)
    ld a,e              ; Get X coordinate
    and 63              ; X mod 64 = X within bank
    ld d,a              ; D = X within bank
    ld e,h              ; E = Y coordinate
    ; Address is now DE = X_within_bank * 256 + Y
    
    ; Plot the pixel
    ld a,l              ; Get pixel color
    ld (de),a           ; Write pixel to Layer 2 memory
    
.exit3:
    ; Reset bank offset and disable writes
    ld bc,$123B
    ld a,$10            ; Reset bank offset to 0
    out (c),a
    ld a,2              ; Show layer, disable writes
    out (c),a
    
    pop hl
    pop bc
    pop af
    ret

;==============================================================================
; Plot pixel in 640x256 mode (4bpp, 16 colors)
; Entry: DE = X coordinate, H = Y coordinate, L = Pixel color (0-15)
;==============================================================================
plot_640x256:
    BREAK 
    push bc
    push hl
    
    ; Check bounds - X must be 0-639, Y must be 0-255
    ld a,d
    cp 3
    jr nc,.exit2         ; X >= 768, out of bounds
    cp 2
    jr c,.bounds_ok1     ; X < 512, OK
    ld a,e
    cp 128              ; If X >= 512, check X < 640 (E < 128)
    jr nc,.exit2
.bounds_ok1:

    ; Limit color to 4 bits
    ld a,l
    and $0F             ; Keep only lower 4 bits
    ld l,a
    
    ; Enable Layer 2 write access
    ld bc,$123B
    ld a, (._screen_mode)
    add a,a 
    or 1               ; Enable write to bank 0
    out (c),a
    
    ; Calculate bank for byte position (X/2)
    ; Bank = (X/2) / 64 = X / 128
    ld a,d              ; Check X range
    or a
    jr z,.byte_bank_low ; X < 256
    cp 1
    jr z,.byte_bank_mid ; X 256-511
    ; X 512-639, bank = 4
    ld a,4
    jr .apply_byte_offset
    
.byte_bank_mid:
    ; X 256-511, check which bank
    ld a,e
    cp 128              ; Check if X >= 384
    ld a,2              ; Bank 2 for 256-383  
    jr c,.apply_byte_offset
    ld a,3              ; Bank 3 for 384-511
    jr .apply_byte_offset
    
.byte_bank_low:
    ; X < 256, bank = X / 128
    ld a,e
    rlca                ; Check bit 7
    ld a,0              ; Bank 0 for 0-127
    jr nc,.apply_byte_offset
    ld a,1              ; Bank 1 for 128-255
    
.apply_byte_offset:
    ; Apply bank offset
    ; or $10              ; Set bit 4 for offset mode
    ld a,(_screen_mode)
    or $10
    out (c),a           ; Set bank offset
    
    ; Calculate byte address within bank
    ld a,e              ; Get X coordinate
    srl a               ; X/2 (byte position)
    and 63              ; (X/2) mod 64 (byte offset within bank)
    ld d,a              ; D = byte offset within bank
    ld e,h              ; E = Y coordinate
    
    ; Read current byte for read-modify-write
    ld a,(de)           ; Read current byte value
    ld h,a              ; Save current byte
    
    ; Check if left or right pixel (based on original X)
    ; We need to get back the original X coordinate
    pop af
    push af
    ld a,e              ; This was our original X in the parameter
    ; Actually, we need a different approach here
    ; Let's use the stack to get original parameters
    ld a,4              ; Offset to get original DE
    pop hl 
    add hl,a
    ld a,(hl)           ; Get original E (X coordinate)
    and 1               ; Check if X is odd
    jr nz,.right_pixel
    
.left_pixel:
    ; Modify upper nibble (left pixel)
    ld a,l              ; Get new color
    rlca                ; Shift to upper nibble
    rlca
    rlca
    rlca
    and $F0             ; Mask to upper nibble only
    ld c,a              ; Save shifted color
    ld a,h              ; Get current byte
    and $0F             ; Keep lower nibble (right pixel)
    or c                ; Combine with new upper nibble
    jr .write_byte
    
.right_pixel:
    ; Modify lower nibble (right pixel)
    ld a,h              ; Get current byte
    and $F0             ; Keep upper nibble (left pixel)
    or l                ; Combine with new lower nibble
    
.write_byte:
    ld (de),a           ; Write modified byte back

.exit2:
    ; Clean up
 ;   ld bc,$123B
 ;   ld a,$10            ; Reset bank offset to 0
 ;   out (c),a
    ld a, 2 
    out (c),a
    
    pop hl
    pop bc
    pop af
    ret

;==============================================================================
; GRAPHICS SYSTEM SETUP
;==============================================================================

; Current graphics mode (0=256x192, 1=320x256, 2=640x256)
; graphics_mode:  db 0
; _screen_mode: db 0     this is set in another code listing 

; Jump table for plot functions by mode
plot_jump_table:
    dw plot_256x192     ; Mode 0
    dw plot_320x256     ; Mode 1  
    dw plot_640x256     ; Mode 2

;==============================================================================
; Set graphics mode for primitives
; Entry: A = mode (0, 1, or 2)
;==============================================================================
set_graphics_mode:
    and 3               ; Ensure valid mode
    ld (_screen_mode),a
    ret

;==============================================================================
; Generic plot routine that dispatches to correct mode
; Entry: DE = X, H = Y, L = color
;==============================================================================
plot_pixel:
        
    push hl
    push bc
    
    ld a,(._screen_mode)
    add a,a             ; Mode * 2 for word offset
    ld c,a
    ld b,0
    ld hl,plot_jump_table
    add hl,bc
    ld a,(hl)           ; Get low byte
    inc hl
    ld h,(hl)           ; Get high byte
    ld l,a              ; HL = plot function address
    
    pop bc
    ex (sp),hl          ; Put function address on stack
    ret                 ; Jump to plot function

; ZX Spectrum Next Layer 2 Line Drawing (Fixed)
; Proper 16-bit coordinate support for all Layer 2 modes
; Requires: layer2_primitives.asm

; include "layer2_primitives.asm"

;;==============================================================================
;; CORRECTED LINE DRAWING SYSTEM
;;==============================================================================
;
;;==============================================================================
;; Draw line using Bresenham's algorithm (16-bit coordinates)
;; Entry: BC = X1,Y1 (B=Y1, C=X1_low, with X1_high in line_x1_high)
;;        DE = X2,Y2 (D=Y2, E=X2_low, with X2_high in line_x2_high)  
;;        L = color
;; Note: For coordinates > 255, set line_x1_high and line_x2_high before calling
;;==============================================================================
;draw_line_16bit:
;    push af
;    push hl
;    push ix
;    
;    ; Save color
;    ld a,l
;    ld (line_color),a
;    
;    ; Store starting coordinates (16-bit)
;    ld a,c              ; X1 low byte
;    ld (line_x1_low),a
;    ld a,(line_x1_high)
;    ld (line_x1_high_copy),a
;    ld a,b              ; Y1
;    ld (line_y1),a
;    
;    ; Store ending coordinates (16-bit)
;    ld a,e              ; X2 low byte
;    ld (line_x2_low),a  
;    ld a,(line_x2_high)
;    ld (line_x2_high_copy),a
;    ld a,d              ; Y2
;    ld (line_y2),a
;    
;    ; Calculate 16-bit DX = X2 - X1
;    ; Load X1 into DE (low byte first)
;    ld a,(line_x1_low)
;    ld e,a
;    ld a,(line_x1_high_copy)
;    ld d,a              ; DE = X1
;    
;    ; Load X2 into HL (low byte first)
;    ld a,(line_x2_low)
;    ld l,a
;    ld a,(line_x2_high_copy)
;    ld h,a              ; HL = X2
;    
;    or a                ; Clear carry
;    sbc hl,de           ; HL = X2 - X1
;    jr nc,.dx_positive
;    
;    ; DX is negative - make positive and set flag
;    ld a,h
;    cpl
;    ld h,a
;    ld a,l
;    cpl
;    ld l,a
;    inc hl              ; Two's complement
;    ld a,1
;    ld (line_dx_neg),a
;    jr .dx_done
;    
;.dx_positive:
;    xor a
;    ld (line_dx_neg),a
;    
;.dx_done:
;    ld (line_dx),hl     ; Store abs(DX) as 16-bit
;    
;    ; Calculate 8-bit DY = Y2 - Y1
;    ld a,(line_y2)
;    ld b,a
;    ld a,(line_y1)
;    sub b
;    jr nc,.dy_positive
;    
;    ; DY is negative - make positive and set flag
;    neg
;    ld (line_dy_neg),a
;    jr .dy_done
;    
;.dy_positive:
;    xor a
;    ld (line_dy_neg),a
;    
;.dy_done:
;    ld (line_dy),a      ; Store abs(DY) as 8-bit
;    
;    ; Set up step directions
;    ld a,(line_dx_neg)
;    or a
;    jr z,.x_step_pos
;    ld hl,$FFFF         ; -1 as 16-bit
;    jr .x_step_set
;.x_step_pos:
;    ld hl,$0001         ; +1 as 16-bit
;.x_step_set:
;    ld (line_x_step),hl
;    
;    ld a,(line_dy_neg)
;    or a
;    jr z,.y_step_pos
;    ld a,-1
;    jr .y_step_set
;.y_step_pos:
;    ld a,1
;.y_step_set:
;    ld (line_y_step),a
;    
;    ; Initialize current position
;    ld a,(line_x1_low)
;    ld (line_x_current),a
;    ld a,(line_x1_high_copy)
;    ld (line_x_current+1),a
;    ld a,(line_y1)
;    ld (line_y_current),a
;    
;    ; Initialize error term (16-bit)
;    ; error = dx - dy
;    ld hl,(line_dx)     ; HL = dx
;    ld a,(line_dy)      ; A = dy
;    ld e,a
;    ld d,0              ; DE = dy (16-bit)
;    or a                ; Clear carry
;    sbc hl,de           ; HL = dx - dy
;    ld (line_error),hl
;    
;    ; Main line loop
;.line_loop:
;    ; Plot current point
;    ld a,(line_x_current)
;    ld e,a
;    ld a,(line_x_current+1)  
;    ld d,a                  ; DE = current X (16-bit)
;    ld a,(line_y_current)
;    ld h,a                  ; H = current Y
;    ld a,(line_color)
;    ld l,a                  ; L = color
;    call plot_pixel
;    
;    ; Check if we've reached the end point
;    ld a,(line_x_current)
;    ld l,a
;    ld a,(line_x_current+1)
;    ld h,a              ; HL = current X
;    
;    ld a,(line_x2_low)
;    ld e,a
;    ld a,(line_x2_high_copy)
;    ld d,a              ; DE = target X2
;    
;    or a
;    sbc hl,de
;    jr nz,.continue_line    ; X coordinates don't match
;    
;    ld a,(line_y_current)
;    ld b,a
;    ld a,(line_y2)
;    cp b
;    jr z,.line_done         ; Both coordinates match - done
;    
;.continue_line:
;    ; Update error and position using Bresenham algorithm
;    ld hl,(line_error)
;    add hl,hl               ; 2 * error
;    
;    ; Check if 2*error >= -dy (time to step in Y)
;    ld a,(line_dy)
;    neg                     ; A = -dy
;    ld e,a
;    ld a,h                  ; Get high byte of 2*error
;    bit 7,a                 ; Check sign
;    jr nz,.negative_2error
;    
;    ; 2*error is positive, compare with -dy
;    ld a,e                  ; A = -dy (negative)
;    ld d,$FF                ; DE = -dy (16-bit)
;    ex de,hl                ; HL = -dy, DE = 2*error
;    or a
;    sbc hl,de               ; Compare -dy with 2*error
;    jr nc,.no_y_step        ; -dy >= 2*error, don't step Y
;    jr .do_y_step
;    
;.negative_2error:
;    ; 2*error is negative, it's definitely >= -dy
;    jr .do_y_step
;    
;.do_y_step:
;    ; Step in Y direction: error += dx, y += y_step
;    ld hl,(line_error)
;    ld de,(line_dx)
;    add hl,de
;    ld (line_error),hl
;    
;    ld a,(line_y_current)
;    ld b,a
;    ld a,(line_y_step)
;    add a,b
;    ld (line_y_current),a
;    
;.no_y_step:
;    ; Check if 2*error <= dy (time to step in X)
;    ld hl,(line_error)
;    add hl,hl               ; 2 * error
;    ld a,(line_dy)
;    ld e,a
;    ld d,0                  ; DE = dy
;    or a
;    sbc hl,de               ; 2*error - dy
;    jr z,.do_x_step         ; Equal, do step
;    jp p,.no_x_step         ; Positive result, don't step
;    
;.do_x_step:
;    ; Step in X direction: error -= dy, x += x_step
;    ld hl,(line_error)
;    ld a,(line_dy)
;    ld e,a
;    ld d,0                  ; DE = dy
;    or a
;    sbc hl,de               ; error -= dy
;    ld (line_error),hl
;    
;    ; Add X step to current X position
;    ld a,(line_x_current)
;    ld l,a
;    ld a,(line_x_current+1)
;    ld h,a                  ; HL = current X
;    
;    ld a,(line_x_step)
;    ld e,a
;    ld a,(line_x_step+1)
;    ld d,a                  ; DE = X step
;    
;    add hl,de               ; HL = new X position
;    ld a,l
;    ld (line_x_current),a
;    ld a,h
;    ld (line_x_current+1),a
;    
;.no_x_step:
;    jp .line_loop
;    
;.line_done:
;    pop ix
;    pop hl
;    pop af
;    ret
;
;;==============================================================================
;; Convenience function for simple line drawing
;; Entry: BC = X1,Y1 (8-bit coordinates)  
;;        DE = X2,Y2 (8-bit coordinates)
;;        L = color
;;==============================================================================
;draw_line_8bit:
;    push af
;    
;    ; Clear high bytes for 16-bit version
;    xor a
;    ld (line_x1_high),a
;    ld (line_x2_high),a
;    
;    ; Call 16-bit version
;    call draw_line_16bit
;    
;    pop af
;    ret
;
;;==============================================================================
;; Draw line with 16-bit coordinates (full interface)
;; Entry: HL = X1 (16-bit), A = Y1
;;        DE = X2 (16-bit), B = Y2  
;;        C = color
;;==============================================================================
;draw_line_full:
;    BREAK 
;    push bc
;    push hl
;    
;    ; Store coordinates  
;    ld a,l
;    ld (line_x1_low),a      ; X1 low
;    ld a,h  
;    ld (line_x1_high),a     ; X1 high
;    ld (line_y1),a          ; Y1
;    ld a,e
;    ld (line_x2_low),a      ; X2 low  
;    ld a,d
;    ld (line_x2_high),a     ; X2 high
;    ld a,b
;    ld (line_y2),a          ; Y2
;    
;    ; Setup for 16-bit line drawing
;    ld b,a                  ; B = Y1
;    ld c,l                  ; C = X1 low
;    ld d,b                  ; D = Y2  
;    ld e,l                  ; E = X2 low
;    ld l,c                  ; L = color
;    
;    ; Set high bytes
;    ld a,h
;    ld (line_x1_high),a
;    ld a,d
;    ld (line_x2_high),a
;    
;    call draw_line_16bit
;    
;    pop hl
;    pop bc
;    ret
;
;;==============================================================================
;; Draw horizontal line (optimized)
;; Entry: BC = X1,Y (B=X1, C=Y)  DE = X2,Y (D=X2, E=Y - should match C)  L = color
;;==============================================================================
;draw_horizontal_line:
;    push af
;    push bc
;    push de
;    push hl
;    
;    ; Ensure X1 <= X2
;    ld a,b              ; X1
;    cp d                ; X2
;    jr c,.x_ordered
;    jr z,.single_pixel  ; Same X coordinate
;    
;    ; Swap X coordinates  
;    ld a,b
;    ld h,a
;    ld a,d
;    ld b,a
;    ld d,h
;    
;.x_ordered:
;    ; Draw line from X1 to X2 at same Y
;    ld a,b              ; Current X
;    ld (hline_x),a
;    
;.hline_loop:
;    ; Plot pixel
;    ld a,(hline_x)
;    ld e,a              ; X coordinate
;    ld d,0              ; X high byte = 0
;    ld h,c              ; Y coordinate (from C)
;    ; L already contains color
;    call plot_pixel
;    
;    ; Next X
;    ld a,(hline_x)
;    inc a
;    ld (hline_x),a
;    
;    ; Check if done
;    ld b,a
;    ld a,d              ; Original X2 (we may have swapped)
;    cp b
;    jr nc,.hline_loop
;    
;.single_pixel:
;    ; Draw single pixel
;    ld a,b              ; X coordinate
;    ld e,a
;    ld d,0
;    ld h,c              ; Y coordinate
;    call plot_pixel
;    
;    pop hl
;    pop de
;    pop bc
;    pop af
;    ret
;
;; Working variable for horizontal line
;hline_x: db 0
;
;;==============================================================================
;; Line drawing variables (16-bit support)
;;==============================================================================
;line_color:         db 0
;line_dx:            dw 0    ; 16-bit delta X  
;line_dy:            db 0    ; 8-bit delta Y (Y is always 8-bit)
;line_dx_neg:        db 0    ; DX negative flag
;line_dy_neg:        db 0    ; DY negative flag  
;line_error:         dw 0    ; 16-bit error term
;line_x_step:        dw 0    ; 16-bit X step (+1 or -1)
;line_y_step:        db 0    ; 8-bit Y step (+1 or -1)
;
;; Current position (16-bit X, 8-bit Y)
;line_x_current:     dw 0
;line_y_current:     db 0
;
;; Start/end coordinates
;line_x1_low:        db 0
;line_x1_high:       db 0
;line_x1_high_copy:  db 0
;line_x2_low:        db 0
;line_x2_high:       db 0  
;line_x2_high_copy:  db 0
;line_y1:            db 0
;line_y2:            db 0
;
;;==============================================================================
;; USAGE EXAMPLES
;;==============================================================================
;;
;; ; Simple 8-bit line (for coordinates 0-255)
;; ld bc,$3232         ; From (50,50) - B=X1=50, C=Y1=50
;; ld de,$C896         ; To (200,150) - D=X2=200, E=Y2=150
;; ld l,255            ; White color
;; call draw_line_8bit
;;
;; ; 16-bit line (for coordinates 0-319 in 320x256 mode)  
;; ld hl,100           ; X1 = 100
;; ld a,50             ; Y1 = 50
;; ld de,300           ; X2 = 300
;; ld b,200            ; Y2 = 200
;; ld c,255            ; White color
;; call draw_line_full
;;
;; ; Horizontal line (optimized) - CORRECTED USAGE:
;; ld bc,$3264         ; From X1=50, Y=100 (B=50, C=100)  
;; ld de,$FA64         ; To X2=250, Y=100 (D=250, E=100)
;; ld l,128            ; Gray color
;; call draw_horizontal_line
;;
;; IMPROVEMENTS:
;; - Full 16-bit X coordinate support (0-65535)
;; - Proper Bresenham algorithm implementation
;; - Correct end point detection
;; - Optimized horizontal line routine
;; - Multiple interface options for different needs
;; - Works with all Layer 2 modes (256x192, 320x256, 640x256)
;;
;; COORDINATE CONVENTIONS:
;; - 8-bit lines: BC = X1,Y1 (B=X1, C=Y1), DE = X2,Y2 (D=X2, E=Y2)
;; - Horizontal lines: BC = X1,Y (B=X1, C=Y), DE = X2,Y (D=X2, E=Y)
;; - 16-bit lines: Use draw_line_full with separate parameters
;;==============================================================================
;; RECTANGLE PRIMITIVES
;;==============================================================================
;
;;==============================================================================
;; Draw rectangle outline
;; Entry: BC = X1,Y1  DE = X2,Y2  L = color
;;==============================================================================
;draw_rectangle:
;    push af
;    push bc
;    push de
;    push hl
;    
;    ; Draw top line (X1,Y1) to (X2,Y1)
;    ld a,b              ; Y1
;    ld d,a              ; Y2 = Y1
;    call draw_line_8bit
;    
;    ; Draw bottom line (X1,Y2) to (X2,Y2)
;    pop hl              ; Restore original values
;    pop de
;    pop bc
;    push bc
;    push de
;    push hl
;    ld a,d              ; Y2
;    ld b,a              ; Y1 = Y2
;    call draw_line_8bit
;    
;    ; Draw left line (X1,Y1) to (X1,Y2)
;    pop hl              ; Restore original values
;    pop de
;    pop bc
;    push bc
;    push de
;    push hl
;    ld a,c              ; X1
;    ld e,a              ; X2 = X1
;    call draw_line_8bit
;    
;    ; Draw right line (X2,Y1) to (X2,Y2)
;    pop hl              ; Restore original values
;    pop de
;    pop bc
;    ld a,e              ; X2
;    ld c,a              ; X1 = X2
;    call draw_line_8bit
;    
;    pop af
;    ret

;==============================================================================
; Fill rectangle
; Entry: BC = X1,Y1  DE = X2,Y2  L = color
;==============================================================================
fill_rectangle:
    push af
    push bc
    push de
    push hl
    push ix
    
    ; Ensure X1 <= X2 and Y1 <= Y2
    ld a,c              ; X1
    cp e                ; Compare with X2
    jr c,.x_ok
    ld a,c              ; Swap X coordinates
    ld h,a
    ld a,e
    ld c,a
    ld e,h
.x_ok:
    ld a,b              ; Y1
    cp d                ; Compare with Y2
    jr c,.y_ok
    ld a,b              ; Swap Y coordinates
    ld h,a
    ld a,d
    ld b,a
    ld d,h
.y_ok:
    
    ; Store parameters
    ld (fill_x1),bc
    ld (fill_x2),de
    ld a,l
    ld (fill_color),a
    
    ; Loop through Y coordinates
    ld a,b              ; Start Y
    ld (fill_y),a
    
.fill_y_loop:
    ; Loop through X coordinates for current Y
    ld a,c              ; Start X
    ld (fill_x),a
    
.fill_x_loop:
    ; Plot pixel at (fill_x, fill_y)
    ld a,(fill_x)
    ld e,a              ; X coordinate
    ld d,0
    ld a,(fill_y)
    ld h,a              ; Y coordinate
    ld a,(fill_color)
    ld l,a              ; Color
    call plot_pixel
    
    ; Increment X
    ld a,(fill_x)
    inc a
    ld (fill_x),a
    
    ; Check if X <= X2
    ld hl,(fill_x2)
    cp l                ; Compare with X2
    jr c,.fill_x_loop
    jr z,.fill_x_loop
    
    ; Increment Y
    ld a,(fill_y)
    inc a
    ld (fill_y),a
    
    ; Check if Y <= Y2
    ld hl,(fill_x2)
    cp h                ; Compare with Y2
    jr c,.fill_y_loop
    jr z,.fill_y_loop
    
    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

; Fill rectangle variables
fill_x1:        dw 0
fill_x2:        dw 0
fill_x:         db 0
fill_y:         db 0
fill_color:     db 0

;==============================================================================
; CIRCLE PRIMITIVES
;==============================================================================

;==============================================================================
; Draw circle using midpoint algorithm
; Entry: DE = center X,Y  B = radius  L = color
;==============================================================================
draw_circle:
    push af
    push bc
    push de
    push hl
    push ix
    
    ; Store parameters
    ld (circle_cx),de   ; Center coordinates
    ld a,b
    ld (circle_r),a     ; Radius
    ld a,l
    ld (circle_color),a ; Color
    
    ; Initialize algorithm variables
    xor a
    ld (circle_x),a     ; X = 0
    ld a,(circle_r)
    ld (circle_y),a     ; Y = radius
    
    ld a,1
    ld h,a
    ld a,(circle_r)
    sub h               ; 1 - radius
    ld (circle_d),a     ; Decision parameter
    
.circle_loop:
    ; Plot 8 symmetrical points
    call plot_circle_points
    
    ; Check if X >= Y
    ld a,(circle_x)
    ld h,a
    ld a,(circle_y)
    cp h
    jr c,.circle_done   ; X >= Y, we're done
    
    ; Update decision parameter and coordinates
    ld a,(circle_d)
    bit 7,a             ; Check if negative
    jr z,.d_positive
    
    ; D < 0: D = D + 2*X + 3
    ld a,(circle_x)
    add a,a             ; 2*X
    add a,3             ; 2*X + 3
    ld h,a
    ld a,(circle_d)
    add a,h             ; D += 2*X + 3
    ld (circle_d),a
    jr .increment_x
    
.d_positive:
    ; D >= 0: D = D + 2*(X-Y) + 5
    ld a,(circle_x)
    ld h,a
    ld a,(circle_y)
    sub h               ; Y - X
    neg                 ; X - Y
    add a,a             ; 2*(X - Y)
    add a,5             ; 2*(X - Y) + 5
    ld h,a
    ld a,(circle_d)
    add a,h             ; D += 2*(X - Y) + 5
    ld (circle_d),a
    
    ; Decrement Y
    ld a,(circle_y)
    dec a
    ld (circle_y),a
    
.increment_x:
    ; Increment X
    ld a,(circle_x)
    inc a
    ld (circle_x),a
    
    jr .circle_loop
    
.circle_done:
    pop ix
    pop hl
    pop de
    pop bc
    pop af
    ret

; Plot 8 symmetrical points for circle
plot_circle_points:
    push af
    push bc
    push de
    push hl
    
    ; Get center and offset values
    ld hl,(circle_cx)   ; H = center Y, L = center X
    ld a,(circle_x)
    ld c,a              ; C = X offset
    ld a,(circle_y)
    ld b,a              ; B = Y offset
    ld a,(circle_color)
    ld (plot_color_temp),a
    
    ; Plot (+X, +Y)
    ld a,l              ; Center X
    add a,c             ; + X offset
    ld e,a              ; X coordinate
    ld d,0
    ld a,h              ; Center Y
    add a,b             ; + Y offset
    ld h,a              ; Y coordinate
    ld a,(plot_color_temp)
    ld l,a
    call plot_pixel
    
    ; Plot (-X, +Y)
    ld hl,(circle_cx)
    ld a,l              ; Center X
    sub c               ; - X offset
    ld e,a
    ld d,0
    ld a,h              ; Center Y
    add a,b             ; + Y offset
    ld h,a
    ld a,(plot_color_temp)
    ld l,a
    call plot_pixel
    
    ; Plot (+X, -Y)
    ld hl,(circle_cx)
    ld a,l              ; Center X
    add a,c             ; + X offset
    ld e,a
    ld d,0
    ld a,h              ; Center Y
    sub b               ; - Y offset
    ld h,a
    ld a,(plot_color_temp)
    ld l,a
    call plot_pixel
    
    ; Plot (-X, -Y)
    ld hl,(circle_cx)
    ld a,l              ; Center X
    sub c               ; - X offset
    ld e,a
    ld d,0
    ld a,h              ; Center Y
    sub b               ; - Y offset
    ld h,a
    ld a,(plot_color_temp)
    ld l,a
    call plot_pixel
    
    ; Plot (+Y, +X)
    ld hl,(circle_cx)
    ld a,l              ; Center X
    add a,b             ; + Y offset (swapped)
    ld e,a
    ld d,0
    ld a,h              ; Center Y
    add a,c             ; + X offset (swapped)
    ld h,a
    ld a,(plot_color_temp)
    ld l,a
    call plot_pixel
    
    ; Plot (-Y, +X)
    ld hl,(circle_cx)
    ld a,l              ; Center X
    sub b               ; - Y offset (swapped)
    ld e,a
    ld d,0
    ld a,h              ; Center Y
    add a,c             ; + X offset (swapped)
    ld h,a
    ld a,(plot_color_temp)
    ld l,a
    call plot_pixel
    
    ; Plot (+Y, -X)
    ld hl,(circle_cx)
    ld a,l              ; Center X
    add a,b             ; + Y offset (swapped)
    ld e,a
    ld d,0
    ld a,h              ; Center Y
    sub c               ; - X offset (swapped)
    ld h,a
    ld a,(plot_color_temp)
    ld l,a
    call plot_pixel
    
    ; Plot (-Y, -X)
    ld hl,(circle_cx)
    ld a,l              ; Center X
    sub b               ; - Y offset (swapped)
    ld e,a
    ld d,0
    ld a,h              ; Center Y
    sub c               ; - X offset (swapped)
    ld h,a
    ld a,(plot_color_temp)
    ld l,a
    call plot_pixel
    
    pop hl
    pop de
    pop bc
    pop af
    ret

; Circle drawing variables
circle_cx:      dw 0    ; Center X,Y
circle_r:       db 0    ; Radius
circle_x:       db 0    ; Current X
circle_y:       db 0    ; Current Y
circle_d:       db 0    ; Decision parameter
circle_color:   db 0    ; Color
plot_color_temp: db 0   ; Temporary color storage

;==============================================================================
; UTILITY FUNCTIONS
;==============================================================================

;==============================================================================
; Clear screen with specified color
; Entry: L = color
;==============================================================================
clear_screen:
    push af
    push bc
    push de
    push hl
    
    ; Get screen dimensions based on mode
    ld a,(_screen_mode)
    or a
    jr z,.mode_256x192
    cp 1
    jr z,.mode_320x256
    ; Mode 640x256
    ld de,639           ; Max X
    ld a,255            ; Max Y
    ld d,a
    jr .got_dimensions
    
.mode_320x256:
    ld de,319           ; Max X
    ld a,255            ; Max Y
    ld d,a
    jr .got_dimensions
    
.mode_256x192:
    ld de,255           ; Max X
    ld a,191            ; Max Y
    ld d,a
    
.got_dimensions:
    ; Fill entire screen
    ld bc,0             ; Top-left corner (0,0)
    ; DE already has bottom-right coordinates
    ; L already has color
    call fill_rectangle
    
    pop hl
    pop de
    pop bc
    pop af
    ret

;==============================================================================
; USAGE EXAMPLES
;==============================================================================
; 
; ; Initialize graphics system
; ld a,1              ; Set 320x256 mode
; call set_graphics_mode
; 
; ; Clear screen with blue
; ld l,4              ; Blue color
; call clear_screen
; 
; ; Draw a line
; ld bc,$3232         ; From (50,50)
; ld de,$C896         ; To (200,150)
; ld l,255            ; White color
; call draw_line
; 
; ; Draw a rectangle outline
; ld bc,$1414         ; From (20,20)
; ld de,$6450         ; To (100,80)
; ld l,128            ; Gray color
; call draw_rectangle
; 
; ; Fill a rectangle
; ld bc,$7878         ; From (120,120)
; ld de,$B4B4         ; To (180,180)
; ld l,255            ; White color
; call fill_rectangle
; 
; ; Draw a circle
; ld de,$A080         ; Center at (160,128)
; ld b,40             ; Radius 40
; ld l,255            ; White color
; call draw_circle
; 
; NOTES:
; - All coordinates are in pixels
; - Colors depend on current palette and mode:
;   * 256x192 and 320x256: 0-255 (8-bit)
;   * 640x256: 0-15 (4-bit)
; - Routines include bounds checking
; - Banking is handled automatically
; - Compatible with all Layer 2 modes

; ZX Spectrum Next Layer 2 Text Rendering
; Uses NextReg method for efficient character rendering
; Requires: layer2_primitives.asm
