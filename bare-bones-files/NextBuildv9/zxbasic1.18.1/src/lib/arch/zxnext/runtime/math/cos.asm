#include once <stackf.asm>
#include once <zxnext_utils.asm>
    push namespace core

COS: ; Computes COS using ROM FP-CALC
    call        __zxnbackup_sysvar_bank
    call __FPSTACK_PUSH

    rst 28h	; ROM CALC
    defb 20h ; COS
    defb 38h ; END CALC

    call __FPSTACK_POP
    call __zxnbackup_sysvar_bank_restore
    ret 
    
    pop namespace

