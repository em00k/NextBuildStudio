
        push namespace core

        PROC 
__zxnbackup_sysvar_bank:
        push    af 
        push    bc
        ld	bc,$243B                        					; 10 
        ld	a, $52 												; 7 
        out 	(c), a 												; 12 register select 
        inc 	b 													; 4 bc = TBBLUE_REGISTER_ACCESS_P_253B
        in	a, (c)												; 12 get bank value 
        ld 	(__zxnbackup_sysvar_bank_restore+3),a 									; 13
        pop     bc 
        pop     af 
        nextreg     $52, $0a 
	ret 

__zxnbackup_sysvar_bank_restore:
        nextreg $52, $0a 
        ret
        ENDP

        pop namespace