	org 32768
.core.__START_PROGRAM:
	di
	push iy
	ld iy, 0x5C3A  ; ZX Spectrum ROM variables address
	ld (.core.__CALL_BACK__), sp
	ei
	jp .core.__MAIN_PROGRAM__
.core.__CALL_BACK__:
	DEFW 0
.core.ZXBASIC_USER_DATA:
	; Defines USER DATA Length in bytes
.core.ZXBASIC_USER_DATA_LEN EQU .core.ZXBASIC_USER_DATA_END - .core.ZXBASIC_USER_DATA
	.core.__LABEL__.ZXBASIC_USER_DATA_LEN EQU .core.ZXBASIC_USER_DATA_LEN
	.core.__LABEL__.ZXBASIC_USER_DATA EQU .core.ZXBASIC_USER_DATA
_n:
	DEFB 00
.core.ZXBASIC_USER_DATA_END:
.core.__MAIN_PROGRAM__:
	ld a, 128
	ld (_n), a
	ld a, 127
	ld hl, (_n - 1)
	call .core.__LTI8
	or a
	jp nz, .LABEL.__LABEL2
.LABEL.__LABEL3:
	ld a, 1
	ld (16384), a
.LABEL.__LABEL4:
	ld a, 126
	ld hl, (_n - 1)
	call .core.__LTI8
	or a
	jp nz, .LABEL.__LABEL2
	ld hl, _n
	inc (hl)
	jp .LABEL.__LABEL3
.LABEL.__LABEL2:
	ld hl, 0
	ld b, h
	ld c, l
.core.__END_PROGRAM:
	di
	ld hl, (.core.__CALL_BACK__)
	ld sp, hl
	pop iy
	ei
	ret
	;; --- end of user code ---
#line 1 "/zxbasic/src/lib/arch/zxnext/runtime/cmp/lti8.asm"
#line 1 "/zxbasic/src/lib/arch/zxnext/runtime/cmp/lei8.asm"
	    push namespace core
__LEI8: ; Signed <= comparison for 8bit int
	    ; A <= H (registers)
	    PROC
	    LOCAL checkParity
	    sub h
	    jr nz, __LTI
	    inc a
	    ret
__LTI8:  ; Test 8 bit values A < H
	    sub h
__LTI:   ; Generic signed comparison
	    jp po, checkParity
	    xor 0x80
checkParity:
	    ld a, 0     ; False
	    ret p
	    inc a       ; True
	    ret
	    ENDP
	    pop namespace
#line 2 "/zxbasic/src/lib/arch/zxnext/runtime/cmp/lti8.asm"
#line 33 "arch/zxnext/for_wrap_byte.bas"
	END
