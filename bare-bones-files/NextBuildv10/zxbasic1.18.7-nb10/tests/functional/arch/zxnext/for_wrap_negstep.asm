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
	ld a, 255
	ld (_n), a
	xor a
	jp nz, .LABEL.__LABEL2
.LABEL.__LABEL3:
	ld a, (_n)
	ld (16384), a
.LABEL.__LABEL4:
	ld a, (_n)
	cp 1
	jp c, .LABEL.__LABEL2
	ld hl, _n
	dec (hl)
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
	END
