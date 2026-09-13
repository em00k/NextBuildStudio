	org 32768
.core.__START_PROGRAM:
	di
	push iy
	ld iy, 0x5C3A  ; ZX Spectrum ROM variables address
	ld (.core.__CALL_BACK__), sp
	ei
	call .core.__FAR_INIT
	jp .core.__MAIN_PROGRAM__
.core.__CALL_BACK__:
	DEFW 0
	; --- ZX Next banked code (CODEBANK) ---
	.core.__FAR_MMU_REG EQU 83
	.core.__FAR_STACK_SIZE EQU 48
.core.__CODE_BANK_TABLE:
	DEFB 11, 30
.core.ZXBASIC_USER_DATA:
	; Defines USER DATA Length in bytes
.core.ZXBASIC_USER_DATA_LEN EQU .core.ZXBASIC_USER_DATA_END - .core.ZXBASIC_USER_DATA
	.core.__LABEL__.ZXBASIC_USER_DATA_LEN EQU .core.ZXBASIC_USER_DATA_LEN
	.core.__LABEL__.ZXBASIC_USER_DATA EQU .core.ZXBASIC_USER_DATA
#line 2 "arch/zxnext/codebank_at_scalar.bas"
_r:
	DEFB 00
#line 5 "arch/zxnext/codebank_at_scalar.bas"
	_slot EQU .LABEL._blob
.core.ZXBASIC_USER_DATA_END:
.core.__MAIN_PROGRAM__:
	call _Peek1
	ld (_r), a
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
_Peek1:
		call .core.__FAR_CALL
		DEFB 1
		DEFW _Peek1.__far
		CODEBANK 1
.LABEL._blob:
#line 13 "arch/zxnext/codebank_at_scalar.bas"
		defb 42
#line 16 "arch/zxnext/codebank_at_scalar.bas"
_Peek1.__far:
	push ix
	ld ix, 0
	add ix, sp
	ld a, (_slot)
_Peek1__leave:
	ld sp, ix
	pop ix
	ret
		CODEBANK 0
	;; --- end of user code ---
#line 1 "/zxbasic/src/lib/arch/zxnext/runtime/farcall.asm"
	;; Banked (far) call support for the ZX Spectrum Next 8K MMU.
	;;
	;; A SUB/FUNCTION assigned to a CODEBANK has its body assembled into a separate
	;; binary that is paged into the code window at run time. Call sites are left
;; completely untouched: the routine's ordinary mangled label instead holds a
	;; 6-byte resident trampoline emitted by the compiler,
	;;
;;     _Foo:   call .core.__FAR_CALL
	;;             DEFB  <logical bank>
	;;             DEFW  _Foo.__far
	;;
	;; so `call _Foo` keeps working from anywhere.
	;;
	;; __FAR_CALL replaces the caller's return address with __FAR_RETURN rather than
	;; pushing a frame of its own, which is what keeps stdcall arguments at their
	;; usual (ix+4), (ix+5)... offsets.
	;;
	;; Preserves AF BC DE HL IX IY AF' BC' DE' HL' I R and the interrupt state.
	;; The only thing it changes is the MMU slot covering the code window.
	;;
;; Requires (emitted by the compiler prologue):
	;;     .core.__FAR_MMU_REG     EQU  NextReg of the code window's MMU slot
	;;     .core.__FAR_STACK_SIZE  EQU  3 * maximum cross-bank nesting depth
	;;     .core.__CODE_BANK_TABLE      logical bank -> physical 8K page
	;;
;; Constraints (cannot be checked at compile time, see docs):
	;;   - SP must never point inside the code window.
	;;   - Interrupt handlers must not make far calls, must not remap the code
	;;     window, must not live inside it, and must not touch bank-local data.
	;;   - A bank-local variable must not be passed ByRef out of its own bank. The
	;;     callee gets a plain address that is stale once the bank is paged out.
	;;     Warned about (W310) but not rejected.
	;;   - Cross-bank call nesting must not exceed codebankdepth. To debug an
	;;     overflow, compare __FAR_SP against __FAR_STACK + __FAR_STACK_SIZE in
	;;     __FAR_CALL_SWITCH and jump to .core.__ERROR.
	    push namespace core
__FAR_CUR_BANK:     DEFB 0                  ; logical bank currently mapped (0 = resident)
__FAR_SP:           DEFW __FAR_STACK        ; shadow stack pointer
__FAR_STACK:        DEFS __FAR_STACK_SIZE   ; frames of [prev_bank][ret_lo][ret_hi]
	; ---------------------------------------------------------------------------
	; .core.__FAR_CALL
	;   on entry the stack is  (S+0) = payload ptr, (S+2) = caller ret, (S+4) = args
	;   on exit   PC = target and the stack is  [caller ret | __FAR_RETURN][args]
	; ---------------------------------------------------------------------------
__FAR_CALL:
	        push af                     ; SP = S-2
	        push hl                     ; SP = S-4
	        ld   hl, 4
	        add  hl, sp                 ; HL = S
	        push de                     ; SP = S-6
	        ld   e, (hl)
	        inc  hl
	        ld   d, (hl)                ; DE = payload ptr
	        dec  hl                     ; HL = S
	        ex   de, hl                 ; HL = payload ptr, DE = S
	        ld   a, (hl)                ; A = wanted logical bank
	        inc  hl                     ; HL = &target
	        push hl
	        ld   hl, __FAR_CUR_BANK
	        cp   (hl)
	        pop  hl                     ; (POP does not disturb the flags)
	        jr   nz, __FAR_CALL_SWITCH
; ---- fast path: the bank is already mapped ---------------------------------
	; Nothing to unwind afterwards, so the caller's return address is left alone
	; and no shadow stack frame is consumed.
	        ld   a, (hl)
	        inc  hl
	        ld   h, (hl)
	        ld   l, a                   ; HL = target
	        ex   de, hl                 ; DE = target, HL = S
	        ld   (hl), e
	        inc  hl
	        ld   (hl), d                ; overwrite the payload ptr with the target
	        pop  de
	        pop  hl
	        pop  af
	        ret                         ; -> target, caller ret now on top
; ---- slow path: page the bank in and hook the return -----------------------
__FAR_CALL_SWITCH:
	        push bc                     ; SP = S-8
	        ld   c, a                   ; C = wanted logical bank
	        ld   a, (hl)
	        inc  hl
	        ld   h, (hl)
	        ld   l, a                   ; HL = target
	        ex   de, hl                 ; DE = target, HL = S
	        ld   (hl), e
	        inc  hl
	        ld   (hl), d                ; overwrite the payload ptr with the target
	        inc  hl                     ; HL = &caller ret
	        ld   e, (hl)
	        inc  hl
	        ld   d, (hl)                ; DE = caller ret
	        push de
	        ld   de, __FAR_RETURN
	        ld   (hl), d
	        dec  hl
        ld   (hl), e                ; caller ret := __FAR_RETURN
	        pop  de                     ; DE = caller ret
	        ld   hl, (__FAR_SP)         ; push {previous bank, caller ret}
	        ld   a, (__FAR_CUR_BANK)
	        ld   (hl), a
	        inc  hl
	        ld   (hl), e
	        inc  hl
	        ld   (hl), d
	        inc  hl
	        ld   (__FAR_SP), hl
	        ld   a, c
	        ld   (__FAR_CUR_BANK), a
	        ld   hl, __CODE_BANK_TABLE
	        add  a, l
	        ld   l, a
	        adc  a, h
	        sub  l
	        ld   h, a
	        ld   a, (hl)                ; A = physical 8K page
	        nextreg __FAR_MMU_REG, a
	        pop  bc
	        pop  de
	        pop  hl
	        pop  af
	        ret                         ; -> target
	; ---------------------------------------------------------------------------
	; .core.__FAR_RETURN
	; Reached by the callee's RET, after _leave has already unwound its arguments.
	; Restores the previous bank and resumes the real caller. Every register is
	; preserved because the callee's return value is in one of them.
	; ---------------------------------------------------------------------------
__FAR_RETURN:
	        push hl                     ; SP = R-2, reserved for the real return address
	        push hl                     ; SP = R-4, the actual save of HL
	        push af
	        push de
	        push bc                     ; SP = R-10
	        ld   hl, (__FAR_SP)         ; pop {previous bank, caller ret}
	        dec  hl
	        ld   b, (hl)
	        dec  hl
	        ld   c, (hl)                ; BC = caller ret
	        dec  hl
	        ld   a, (hl)                ; A = previous logical bank
	        ld   (__FAR_SP), hl
	        ld   (__FAR_CUR_BANK), a
	        ld   hl, __CODE_BANK_TABLE
	        add  a, l
	        ld   l, a
	        adc  a, h
	        sub  l
	        ld   h, a
	        ld   a, (hl)
	        nextreg __FAR_MMU_REG, a
	        ld   hl, 8
	        add  hl, sp                 ; HL = R-2
	        ld   (hl), c
	        inc  hl
	        ld   (hl), b                ; fill in the reserved slot
	        pop  bc
	        pop  de
	        pop  af
	        pop  hl
	        ret                         ; -> the real caller, SP = R
	; ---------------------------------------------------------------------------
	; .core.__FAR_INIT -- registered as an #init.
	; Records whatever page the loader had mapped into the code window, so that
	; returning to logical bank 0 restores it exactly.
	; ---------------------------------------------------------------------------
__FAR_INIT:
	        ld   bc, 0x243B             ; TBBlue register select
	        ld   a, __FAR_MMU_REG
	        out  (c), a
	        inc  b                      ; BC = 0x253B, register access
	        in   a, (c)
	        ld   (__CODE_BANK_TABLE), a ; table[0] = the boot page for this window
	        xor  a
	        ld   (__FAR_CUR_BANK), a
	        ld   hl, __FAR_STACK
	        ld   (__FAR_SP), hl
	        ret
	    pop namespace
#line 29 "arch/zxnext/codebank_at_scalar.bas"
__EXIT_FUNCTION:
	ld sp, ix
	pop ix
	pop de
	add hl, sp
	ld sp, hl
	push de
	exx
	ret
	END
