'!org=32768
'#!asm
'#!autostart
'!noemu 

#define NEX
#include <nextlib.bas>
#include <keys.bas>

asm 
    nextreg TURBO_CONTROL_NR_07,3
    nextreg GLOBAL_TRANSPARENCY_NR_14,0

end asm 

LoadSDBank("stereo.pcm",0,0,0,32)

asm 
; /*  Equates for NextSID - probably dont need them but not removing just yet


	nextsid_init EQU 0x0000E098

	nextsid_set_waveform_A  EQU 0x0000E07A
	nextsid_set_waveform_B  EQU 0x0000E081
	nextsid_set_waveform_C  EQU 0x0000E088
	nextsid_set_detune_A    EQU 0x0000E056
	nextsid_set_detune_B    EQU 0x0000E05A
	nextsid_set_detune_C    EQU 0x0000E05E
	nextsid_wavelen_A       EQU 0x0000E341
	nextsid_wavelen_B       EQU 0x0000E36C
	nextsid_wavelen_C       EQU 0x0000E397
	nextsid_shift_C         EQU 0x0000E24D
	nextsid_set_shift_C     EQU 0x0000E076
	nextsid_shift_B         EQU 0x0000E226
	nextsid_set_shift_B     EQU 0x0000E072
	nextsid_shift_A         EQU 0x0000E1FF
	nextsid_set_shift_A     EQU 0x0000E06E

	nextsid_play            EQU 0x0000E007
	nextsid_stop            EQU 0x0000E011
	nextsid_mode            EQU 0x0000E2D7
	nextsid_pause           EQU 0x0000E000
	nextsid_reset           EQU 0x0000E38C
	nextsid_set_pt3         EQU 0x0000E025

	init                    EQU 0x0000E3F9
	nextsid_set_psg_clock   EQU 0x0000E04E
	nextsid_vsync           EQU 0x0000E08F

	
	INTCTL					equ	0C0h	; Interrupt control
	NMILSB					equ	0C2h	; NMI Return Address LSB
	NMIMSB					equ	0C3h	; NMI Return Address MSB
	INTEN0					equ	0C4h	; INT EN 0
	INTEN1					equ	0C5h	; INT EN 1
	INTEN2					equ	0C6h	; INT EN 2
	INTST0					equ	0C8h	; INT status 0
	INTST1					equ	0C9h	; INT status 1
	INTST2					equ	0CAh	; INT status 2
	INTDM0					equ	0CCh	; INT DMA EN 0
	INTDM1					equ	0CDh	; INT DMA EN 1
	INTDM2					equ	0CEh	; INT DMA EN 2

	CTC0					equ	183Bh	; CTC channel 0 port
	CTC1					equ	193Bh	; CTC channel 1 port
	CTC2					equ	1A3Bh	; CTC channel 2 port
	CTC3					equ	1B3Bh	; CTC channel 3 port
	CTC4					equ	1C3Bh	; CTC channel 4 port
	CTC5					equ	1D3Bh	; CTC channel 5 port
	CTC6					equ	1E3Bh	; CTC channel 6 port
	CTC7					equ	1F3Bh	; CTC channel 7 port

; */
	
	; nextreg 	    $57,33				            ; put nextsid in place
	irq_vector	    equ	65022			            ; 2 BYTES Interrupt vector
	stack		    equ	65021			            ; 252 BYTES System stack
	vector_table	equ	64512		                ; 257 BYTES Interrupt vector table	
	
	startup:	

	di					                            ; Set stack and interrupts
	ld	    sp,stack					            ; System STACK

	nextreg	TURBO_CONTROL_NR_07,%00000011	        ; 28Mhz / 27Mhz

	ld	    hl,vector_table	                        ; 252 (FCh)
	ld	    a,h
	ld	    i,a
	im	    2

	inc	    a							            ; 253 (FDh)

	ld	    b,l							            ; Build 257 BYTE INT table
	.irq:	
	ld	    (hl),a
	inc	    hl
	djnz	.irq					                ; B = 0
	ld	    (hl),a

	ld	    a,$FB						            ; EI
	ld	    hl,$4DED					            ; RETI
	ld	    (irq_vector-1),a
	ld	    (irq_vector),hl

	ld	    bc,0xFFFD					            ; Turbosound PSG #1
	ld	    a,%11111111
	out	    (c),a


	nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000100
	nextreg VIDEO_INTERUPT_VALUE_NR_23,255

	ld	    sp,stack					            ; System STACK

	call	patch_interrupt

	ei

end asm 

dim key as ubyte 

do 
	
	' MAIN LOOP 

	WaitRetrace(1)
    if GetKeyScanCode()=KEYSPACE  and key = 0
        ResetSample() : key = 1 
    elseif GetKeyScanCode()=0
        key = 0 
    endif 

loop 

sub ResetSample()
    asm
         
        ld      hl,0     
        ld      (sample_offset),hl 
    end asm
end sub 

asm 
	patch_interrupt:

		di 
		xor     a 
		ld		bc,192
		ld      de,raster_line
		ld      (raster_frame),a
		
		ld 		a,i 
		ld		h,a
		ld		l,0
		ld		(hl),e					                    ; Set LINE interrupt
		inc		l
		ld		(hl),d
		ld		l,6
		ld		de,ctc0					                    ; Set CTC0 interrupt
		ld		(hl),e
		inc		l
		ld		(hl),d
		inc		l
		ld		de,ctc1					                    ; Set CTC1 interrupt
		ld		(hl),e
		inc		l
		ld		(hl),d

		ld		a,b
		and		%00000001
		or		%00000110				                    ; ULA off / LINE interrupt ON

		nextreg	VIDEO_INTERUPT_CONTROL_NR_22,a
		ld		a,c
		nextreg	VIDEO_INTERUPT_VALUE_NR_23,a				; IM2 on line BC	

		nextreg INTCTL,%00001001                            ; Vector 0x00, stackless, IM2

		nextreg INTEN0,%00000010                            ; Interrupt enable LINE
		nextreg INTEN1,%00000001                            ; CTC channel 0 zc/to
		nextreg INTEN2,%00000000                            ; Interrupters
		nextreg INTST0,%11111111                            ; 
		nextreg INTST1,%11111111                            ; Set status bits to clear
		nextreg INTST2,%11111111                            ; 
		nextreg INTDM0,%00000000                            ; 
		nextreg INTDM1,%00000000                            ; No DMA
		nextreg INTDM2,%00000000                            ; 

		call	set_ctc


end asm 

asm 
	; interrupt routines 

	raster_line:	
		push	af 
	raster_frame equ $+1	
		ld      a,0 
		inc	    a
		ld	    (raster_frame),a
		pop	    af
		ei
		reti

	ctc0:
		push 	af 
        push    bc 
        push    hl 
        push    de 
		; ld 		a,(raster_frame) 
		; and 	7
		; out 	($fe),a 
        ; BREAK 
        nextreg $50,32              ; page in sample 
        nextreg $51,33              ; page in sample 

        ld      hl,(sample_length)
        ld      de,(sample_offset)    ; point to sample position 
        xor     a 
        sbc     hl,de 
        jr      c,done_playing

        ld      a,(de)              ; grab sample 
        
        nextreg DAC_C_MIRROR_NR_2E, a
        inc     de 
        ld      a,(de)              ; grab sample 
        nextreg DAC_B_MIRROR_NR_2C,a
        ; out     (c),a 
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,67
        
        inc     de 
        ld      hl,sample_offset
        ld      (hl),e 
        inc     hl 
        ld      (hl),d 

        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0

    done_playing:
        pop     de 
        pop     hl 
        pop     bc 
		pop 	af 
		ei 
		reti

	ctc1: 
        ; nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,200
		ei 
		reti 

	set_ctc:

		di 
		ld		d,112  ; vga 50 scanline timing 
		ld		a,0    ; manually set timing 
		ld		hl,.timing_tab
		add		a,a
		add		hl,a

		; CTC Channel 0 

		ld		bc,CTC0					; Channel 0 port
										; IMPETCRV	; Bits 7-0
		ld		a,%10000101				; / 16
		out		(c),a					; Control word
		out		(c),d					; Time constant

		; CTC Channel 1

		ld		bc,CTC1					; Channel 1 port
		;                                    IMPETCRV	; Bits 7-0
		ld		a,%10100101				; / 256
		out		(c),a					; Control word
		ld		a,(hl)
		outinb							; Time constant		

		ei 
		ret 

	.timing_tab:
		db		250, %10001100 			; 0 28000000 50Hz =  8.75
		db		186, %11000000 			; 1 28571429 50Hz = 12.0  ?
		db		192, %11000000 			; 2 29464286 50Hz = 12.0  ?
		db		250, %10010110 			; 3 30000000 50Hz =  9.375
		db		250, %10011011 			; 4 31000000 50Hz =  9.6875
		db		250, %10100000 			; 5 32000000 50Hz = 10.0
		db		250, %10100101 			; 6 33000000 50Hz = 10.03125
		db		250, %10000111 			; 7 27000000 50Hz =  8.4375
		

end asm 

asm 
sample_offset: 
    dw      0 

sample_length:
    dw      16329
end asm 