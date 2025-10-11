'!org=38000
'#!asm
'!copy=h:\ctc_test.nex
'#!autostart
'#!noemu 

#define NEX
#include <nextlib.bas>
#include <keys.bas>

asm 
    nextreg TURBO_CONTROL_NR_07,3
    nextreg GLOBAL_TRANSPARENCY_NR_14,0
    nextreg NEXT_RESET_NR_02,128 
end asm 
paper 0 : ink 7 : cls 
' LoadSDBank("stereo.pcm",0,0,0,32)



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

OpenFile()
ReadChunk()

' do 
'     ReadChunk()
'     WaitRetrace(100)
' loop 


do 
    ' int at 0,0;peek(uinteger,@sample_offset)
	' MAIN LOOP 

	WaitRetrace(1)
    if GetKeyScanCode()=KEYSPACE  and key = 0
        ResetSample() : key = 1 
        ReadChunk()
    elseif GetKeyScanCode()=0
        key = 0 
    endif 
    
loop 

sub ResetSample()
    asm
         
        ld      hl,$4000    
        ld      (sample_offset),hl 
    end asm
end sub 

sub OpenFile()
    asm
        call    open_file 
    end asm
end sub 

sub ReadChunk()
    asm
    ;    nextreg $52,30
    ;    nextreg $53,31
        call    read_data_a
        call    read_data_b
    ;   nextreg $52,10
    ;    nextreg $53,11
    end asm

end sub 

asm 
    read_data_a:

        ; ld      a, 2
        ; out     ($fe),a
        ld      ix,$d000
        ld      bc,$1000
        ld      a,(filehandle2)
        ESXDOS
        db      F_READ
        xor     a 
        ld      (chunkloadflag), a 
        ret 

    read_data_b:

        ; ld      a, 1
        ; out     ($fe),a
        ld      ix,$e000
        ld      bc,$1000
        ld      a,(filehandle2)
        ESXDOS
        db      F_READ
        xor     a 
        ld      (chunkloadflag), a 
        ret 

  
    getnextchunk:
        push    de 
        ld      a,d 
        or      a
        jr      nz,read_data_b
        jr      read_data_a
        ret 


    ; open a file and set file handle 
    ; 
    open_file:
        ld      ix,stream_file_name
        ld      a,'*'
        ld      b,FA_READ
        ESXDOS 
        db      F_OPEN
        ld      (filehandle2),a 
        ret     nc 
        ld      a,2
    openerror:
        out     ($fe),a
        inc     a 
        and     7
        jp openerror 

    filehandle2: 
        db      0 

    stream_file_name:
        db      "./posit.pcm"
        db      0 


end asm 

asm             ; ' patches the interrupts 
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
	;	inc		l
	;	ld		de,ctc1					                    ; Set CTC1 interrupt
	;	ld		(hl),e
	;	inc		l
	;	ld		(hl),d

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
        ;ei 
		push	af 
        push    de 
        push    hl  
        push    ix   
        push    bc 

        ld      a,(chunkloadflag)               ; get the load flag 
        or      a                               ; was it zero 
        jr      z,skipload2                     ; yes skip 
;
         ld      a,(chunkloadflag)               ; get the load flag  
         cp      1                               ; is flag set to 1 
         call    z, read_data_a                  ; then load data b ($5000)
;
        ld      a,(chunkloadflag) 
        cp      2 
        call    z, read_data_b                  ; load data a 
;
    skipload1:

    skipload2:
        
    raster_frame equ $+1	
		ld      a,0 
		inc	    a
		ld	    (raster_frame),a

        pop     bc 
        pop     ix 
        pop     hl  
        pop     de 
		pop	    af
		ei 
		reti

	ctc0:
        ;ei 
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,67
		push 	af 
        push    bc 
        push    hl 
        push    de 
        push    ix 
    
        ld      de,(sample_offset)
        ld      a,e                             ; put e into a 
        or      a                               ; was it zero 
        jr      nz,skipload                     ; no skip loading 

        ld      a,d                             ; get d 
        cp      $e0                             ; compare to $50
        jr      nz, skiploada                   ; <>50 then skip 
        ld      a,1                             ; else set load flag to 1 
        ld      (chunkloadflag),a 
        
skiploada:        

        ld      a,d                             ; get d 
        cp      $d0                             ; compare to $40
        jr      nz, skipload                    ; <> $40  skip 
        ld      a,2                             ; else set load flag to 2 
        ld      (chunkloadflag),a 

skipload:

        ld      de,(sample_offset)
        ld      a,(de)                          ; grab sample 
        nextreg DAC_C_MIRROR_NR_2E, a           ; send to left channel 
        inc     de      

        ld      a,(de)                          ; grab sample 
        nextreg DAC_B_MIRROR_NR_2C, a           ; send to right channel 
        inc     de      

        ld      a,d                             ; get d into a 
        cp      $f0                             ; cp $60 max is $6000
        jr      nz,final                        ; if not $60 then jump to final 
        ld      de,$d000                        ; else reset de to $4000
final: 
        ld      hl,sample_offset
        ld      (hl),e
        inc     hl 
        ld      (hl),d

        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0

        pop     ix 
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
		
    chunkloadflag:
        db      0 
end asm 

sample_offset:
asm 
sample_offset: 
    dw      $6000 

sample_start:
    dw      $4000
end asm 