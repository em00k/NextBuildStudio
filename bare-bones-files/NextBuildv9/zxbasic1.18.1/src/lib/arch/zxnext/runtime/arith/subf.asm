#include once <stackf.asm>
#include once <zxnext_utils.asm>

; -------------------------------------------------------------
; Floating point library using the FP ROM Calculator (ZX 48K)

; All of them uses A EDCB registers as 1st paramter.
; For binary operators, the 2n operator must be pushed into the
; stack, in the order A DE BC.
;
; Uses CALLEE convention
; -------------------------------------------------------------


    push namespace core

__SUBF:	; Subtraction
    call __zxnbackup_sysvar_bank
    call __FPSTACK_PUSH2	; ENTERS B, A

    ; ------------- ROM SUB
    rst 28h
    defb 01h	; EXCHANGE
    defb 03h	; SUB
    defb 38h;   ; END CALC

    call __FPSTACK_POP
    jp __zxnbackup_sysvar_bank_restore

    pop namespace

