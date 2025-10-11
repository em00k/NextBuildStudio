; The PAUSE statement (Calling the ROM)
; Replaced by Nextbuild v9 
; 
#include once <zxnext_utils.asm>

    push namespace core

__PAUSE:
    ; call        __zxnbackup_sysvar_bank
    ; ld b, h
    ; ld c, l
    ; call 1F3Dh  ; PAUSE_1
    ; jp __zxnbackup_sysvar_bank_restore

    PROC 
    LOCAL __pause_loop
            ld      h, l
    __pause_loop:
			ld 		a,$1f       ; VIDEO_LINE_LSB_NR_1F
			ld 		bc,$243b    ; TBBLUE_REGISTER_SELECT_P_243B
			out 	(c),a
			inc 	b
			in 		a,(c)
			or      a				; line to wait for 
			jr 		nz,__pause_loop
			dec 	h
            
			jr 		nz,__pause_loop 
            ret 
    ENDP 

    pop namespace
