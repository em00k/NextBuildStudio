; The PAUSE statement (Calling the ROM)

    push namespace core

__PAUSE:
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
