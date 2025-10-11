
' -----------------------------------------------
' Interrupt Routines 
' -----------------------------------------------
' Required for 
' 
' InitSFX() 
' InitMusic()
' SetUpIM()
'

#define INTS 

asm    	
	; 64 bytes buffers 
	; we set this the location of these interrupt system addresses so they are available
	; from all modules. 
	; 
    afxChDesc       	EQU     $fd02			; fixed address of afxChDesc
    sfxenablednl    	EQU     $fd40			; fixed address of sfxenablednl
	currentmusicbanknl	EQU 	$fd44			; current music banks 2 bytes 
	currentsfxbank		EQU 	$fd48			; current sfx bank 2 byte 
    bankbuffersplayernl EQU     $fd50			; fixed address of bankbufferplayernl
	ayfxtoplay		EQU 	$fd58 			; 1 byte for sample to play in FF no sample 
	ayfxbankinplaycode	EQU 	$fd3e
	ctc_sample_toplay	EQU 	$fd3f
end asm

sub fastcall StopMusic()
	asm 
		ld 		a,2
		ld 		(sfxenablednl+1),a
	end asm 
end sub 

sub fastcall PlayMusic()
	asm 
		ld 		a,1
		ld 		(sfxenablednl+1),a
	end asm 
end sub 

sub fastcall NewMusic(byval musicbank as ubyte)
	asm 
		di 
		ld 		(bankbuffersplayernl+1),a 
		inc 	a 
		ld 		(bankbuffersplayernl+2),a 
		ld 		a,3 
		ld 		(sfxenablednl+1),a 
		ei 
	end asm 
end sub 


'// MARK: - PlaySFXSys
sub fastcall PlaySFX(byval sfxtoplay as ubyte)
	' Sets the sfx to play 
	' fast call, sfxtoplay in a 
	' PlaySFX(sfxtoplay)
	asm 
		ld (ayfxtoplay),a 
	end asm 

end sub 

Sub fastcall InitMusic(playerbank as byte, musicbank as ubyte, musicaddoffset as uinteger)
	' InitMusic playerbank, musicbank, address offset in music bank
    ' written by em00k part of nextbuild 
		asm 
			; BREAK 
			
			exx                                     ; common save ret address 
			pop     hl 
			exx 
			call    _checkints                      ; were ints on so we know if we need to turn them back on after 
			di 										; ensure interrupts are disbled 

			ld      (aybank1+1),a 					; a = player bank 
			pop     af 
			ld      (ayseta+1),a 					; tune bank 
			pop     de								
			ld      (aysetde+1),de 					; tune offset in bank  0 = 16383
			
			getreg($52)
			ld 		(exitplayerinit+3),a  			; get and store the banks for on exit 
			ld 		(exitplayernl+3),a
			getreg($50)
			ld		(exitplayerinit+7),a 
			ld		(exitplayernl+7),a
			getreg($51)
			ld 		(exitplayerinit+11),a 
			ld 		(exitplayernl+11),a

	aybank1:
			ld      a,0
			nextreg $52,a 						    ; put player in place 
			ld      (bankbuffersplayernl),a 		; store bank 
	ayseta:         
			ld      a, 0 
			ld      (bankbuffersplayernl+1),a 		; store bank 
			nextreg $50,a
			inc     a
			nextreg $51,a
	aysetde:
			ld      de,00000                        ; smc from above 
			ld      hl,$0000                        ; point to start of tune in user bank 
			add     hl,de 
			push    ix 
			call    $4003							; call the player init 
			pop     ix 

	exitplayerinit:
			nextreg $52,$0a                         ; these will be smc'd from above 
			nextreg $50,$00
			nextreg $51,$01

	ayrepairestack:
			; ld      sp,00000                        ; smc from above 
			

			exx : push hl : exx 
			

			ReenableInts                            ; If ints were enable before the routine restart them 
			ret 

	ayplayerstack:
			ds      128,0

	playmusicnl:
			; DB $c5,$DD,$01,$0,$0,$c1

			getreg($52)                             ; get slot 2 bank 
			ld      (exitplayernl+3),a              ; save the bank below 

			ld      hl,bankbuffersplayernl			; get the player bank 
			ld      a,(hl)
			nextreg $52,a							; put in close 2 
			inc     hl 
			ld      a,(hl)				
			nextreg $50,a
			inc     a
			nextreg $51,a

			ld      a,(sfxenablednl+1)
			cp      2
			jr      z,mustplayernl

			ld      a,(sfxenablednl+1)
			cp      3
			jr      z,re_init_music 


			push    ix 
			call    $4005					; play frame of music 
			pop ix 
			; push    ix 

	exitplayernl:
			nextreg $52,$0a
			nextreg $50,$00
			nextreg $51,$01

	ayrepairestack2:

			ret 

	re_init_music:
			ld		a, 1
			ld      (sfxenablednl+1),a 
			ld		hl,0000							; where pt3 tune starts 
			call	$4003							; re-init the player 
			jp      exitplayernl

	mustplayernl:
			xor     a
			ld      (sfxenablednl+1),a 
			call    $4008					; mute player 
			jp      exitplayernl

		end asm 

end sub 


Sub fastcall SetUpIM()
	' this routine will set up the IM vector and set up the relevan jp 
	' note I store the jp in the middle of the vector as in reality 
	' xxFF is all that is needed, you can change this to something else
	' if you wish 
	'#ifdef IM2 
	asm 

		exx : pop hl : exx 

		di 

		ld      hl,$fe00                    ; start of interrupt vector 
		ld      de,$fe01
		ld      bc,257
		ld      a,h                         ; fill with $fe 
		ld      i,a 
		ld      (hl),a 
		ldir 

		ld      h,a
        ld      l, a
        ld      a,$c3                       ; jp 
        ld      (hl),a
        inc     hl
		ld      de,._ISR                    ; this is the address of the routine call on interrtup 
        ld      (hl),e
        inc     hl
        ld      (hl),d 	

		nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000110          ; set rasterline on for line 192 
		nextreg VIDEO_INTERUPT_VALUE_NR_23,190
		
        im      2                           ; enabled the interrupts 

		exx                                 ; restore the ret address 
        push    hl
        exx 
		ei  
	
	end asm 
	'#endif 
end sub 

sub fastcall DisableIM()
    ' simple routine to disable the current interrupts
    asm 

        xor     a
        ld      (sfxenablednl),a 
        ld      (sfxenablednl+1),a
		nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000100
        di 
    end asm 
end sub 

'// MARK: - ISR
Sub fastcall ISR()
	' fast call as we will habdle the stack / regs etc 
	asm 

		; save all registers on stack 
		; 
		ld 		(out_isr_sp+1), sp 										; save the stack 
		ld 		sp, temp_isr_sp 										; use temp stack 
		push af : push bc : push hl : push de : push ix : push iy 		
		;ex af,af'
		;push af
        ; exx : push bc : push hl : push de :	exx
		ld 		bc,TBBLUE_REGISTER_SELECT_P_243B
		in 		a,(c)
		ld 		(skipmusicplayer+1), a
	end asm 
	
	' you *CAN* call a sub from here, but you will need to be careful that it doesnt use ROM calls that 
	' can cause a crash, 

	#ifdef CUSTOMISR 
		
		MyCustomISR()
		
	#endif 
	
    ' #ifndef NOAYFX 
	asm 
		ld		a,(ctc_sample_toplay)
		or		a 
		jr 		z,no_sample_to_play
        call    play_sample                         ; call the ctc sample player

		; check if a sample has been placed into ayfxtoplay 

no_sample_to_play:		

		ld 		a,(ayfxtoplay)
		cp		$ff 								; is the buffer set to 255?
		jr 		z,no_sfx_to_play					; then nothing to play and jump
		 
		call 	PlaySFX							; set fx to play

	no_sfx_to_play:

		ld      a,(sfxenablednl)					;' are the fx enabled?
		or      a : jr z,skipfxplayernl

		call    _CallbackSFX						;' if so call the SFX callback 

	skipfxplayernl:		
		ld      a,(sfxenablednl+1) 							;' is music enabled?
		or      a : jr z,skipmusicplayer
		ld 		bc,65533	: ld a,255:out (c),a	                ; second AY chip 
		call    playmusicnl						;' if so player frame of music 

	end asm 
	' #endif 

	asm 
	
    skipmusicplayer:		
		ld 		a,0									; smc from above 
		ld		bc, TBBLUE_REGISTER_SELECT_P_243B
		out 	(c), a								; restore port 243b
			
		; pop registers fromt the stack 

		;exx 
        ;pop de : pop hl : pop bc
		;exx 

        ;pop af : ex af,af'
		pop iy : pop ix : pop de : pop hl : pop bc : pop af 
	out_isr_sp:
		ld 		sp, 0000 
		ei
		reti 									;' standard reg pops ei and reti
	end asm 
	asm 
	ds 64, 0 
temp_isr_sp:
	db 0, 0 
	end asm 
end sub 

'// MARK: - PlaySFX
sub fastcall PlaySFXSys()				
	'#ifdef IM2 
	ASM 
	; ------------------------------------------------- -------------;
	; Launch the effect on a free channel. Without ;
	; free channels is selected the longest sounding. ;
	; Input: A = number of the effect 0..255;
	; ------------------------------------------------- -------------;
	PlaySFX:
	PROC 
		Local ayfxrestoreslot
		; exx 
		push 	ix 
		
		ld 		a,(ayfxtoplay)

		ld 		d,a                                              ; store a in d for the moment 

		ld 		a,$ff 											; now we set ayfxtoplay to ff 
		ld 		(ayfxtoplay),a 								; as we have read the sfx to play

		getreg($51) : ld (ayfxrestoreslot+3),a					; 
		getreg($52) : ld (ayfxrestoreslot+7),a

		ld 		a,(ayfxbankinplaycode)                                              ; this is set in InitSFX()
		nextreg $51,a                                            
		inc 	a 
		nextreg $52,a                                            

		ld 		a,d 											; put sfx number into a 

	AFXPLAY:

		ld 		de,0				; in DE, the longest time in the search
		ld 		h,e
		ld 		l,a
		add 	hl,hl				; now have sfx address 

	afxBnkAdr:
		
		ld 		bc,0				; the address of the offset table of effects
		add 	hl,bc
		ld 		c,(hl)
		inc 	hl
		ld 		b,(hl)
		add 	hl,bc				; the effect address is obtained in hl
		push 	hl					; save the effect address on the stack
			
		ld 		hl,afxChDesc		; search
		ld 		b,3

	afxPlay0:

		inc 	hl
		inc 	hl
		ld 		a,(hl)				; compare the channel time with the largest
		inc 	hl
		cp 		e
		jr 		c,afxPlay1
		ld 		c,a
		ld 		a,(hl)
		cp 		d
		jr 		c,afxPlay1
		ld 		e,c					; emember the longest time
		ld 		d,a
		push 	hl					; remember the channel address + 3 in IX
		pop 	ix

	afxPlay1:

		inc 	hl
		djnz 	afxPlay0

		pop 	de					; take the effect address from the stack
		ld 		(ix-3),e			; enter in the channel descriptor
		ld 		(ix-2),d
		ld 		(ix-1),b			; zero the playing time
		ld 		(ix-0),b

	ayfxrestoreslot:

		nextreg $51,$ff     
		nextreg $52,$ff    
		pop 	ix 
		; exx 

		ENDP
	
	end asm 
	'#endif 
end sub 

'// MARK: - InitSFX
SUB fastcall InitSFX(byval bank as ubyte)
	'#ifdef IM2 
	ASM 

	; ------------------------------------------------- -------------;
	; Initialize the effects player. ;
	; Turns off all channels, sets variables. ;
	; Input: HL = bank address with effects;
	; ------------------------------------------------- -------------;
	; Only called if #define IM2 is called 
		
	PROC 
	LOCAL ayfxrestoreslot
		
		ld 		d,a                                             ; store a in d for the moment 
		call 	_checkints                                     	; were ints enable?
		di                                                  	; di 

		exx 						                        	; swap 
		pop 	hl 					
		exx				

		getreg($51) : ld (ayfxrestoreslot+3),a
		getreg($52) : ld (ayfxrestoreslot+7),a

		ld 		a,d										         ; get bank to page in from d 
		ld 		(ayfxbankinplaycode),a                         	 ; sets the bank in PlaySFX()
		nextreg $51,a
		inc 	a  
		nextreg $52,a 
		
		ld 		hl,$2000                                     	; addresss will always be $000 cos slot 0

	AFXINIT:
		inc 	hl
		ld 		(afxBnkAdr+1),hl								; save the address of the offset table
		
		ld 		hl,afxChDesc		            				; mark all channels as empty
		ld 		de,$00ff
		ld 		bc,$03fd

	afxInit0:
		ld 		(hl),d
		inc 	hl
		ld 		(hl),d
		inc 	hl
		ld 		(hl),e
		inc 	hl
		ld 		(hl),e
		inc 	hl
		djnz 	afxInit0

		ld 		hl,$ffbf										; initialize AY
		ld 		e,$15

	afxInit1:
		dec 	e
		ld 		b,h
		out 	(c),e
		ld 		b,l
		out 	(c),d
		jr 		nz,afxInit1
		ld 		(afxNseMix+1),de								; reset the player variables

	ayfxrestoreslot:		            						; these banks are set with self modifying code at the start 

		nextreg $51,$0                  						; of the routine 
		nextreg $52,$1
		; nextreg $50,$ff
		exx 
		push 	hl 
		exx 

	ret 
			
		ENDP 

	END ASM 	

	CallbackSFX()
	PlaySFXSys()
	'#endif 
END SUB 

'// MARK: - CallbackSFX
sub fastcall CallbackSFX()
	
	'#ifdef IM2 					'; only include if #define IM2 has been set before include "nextbuild"
	
	asm 
	
    PROC 

	LOCAL ayfxrestoreslot
    
	AFXFRAME:
		; Call every 50s to process any AY FX 
		; AYFX by Shiru
		; Adapted by em00k 


		exx								
		push ix 

		ld bc,65533	: ld a,254:out (c),a	                    ; second AY chip 
	 	getreg($51) : ld (ayfxrestoreslot+3),a              	; set exit banks 
		getreg($52) : ld (ayfxrestoreslot+7),a

		ld 		a,(ayfxbankinplaycode)
		nextreg $51,a         									; page in our banks 
		inc 	a												; slots 0 & 1 0000- $3fff 
		nextreg $52,a                                         

		ld 		bc,$03fd
		ld 		ix,afxChDesc

	afxFrame0:
		push 	bc
		
		ld 		a,11
		ld 		h,(ix+1)						;comparing the highest byte of the address to <11
		cp 		h
		jr 		nc,afxFrame7					;the channel does not play, we skip
		ld 		l,(ix+0)
		
		ld 		e,(hl)						;take the value of the information byte
		inc 	hl
				
		sub 	b							;select the volume register:
		ld 		d,b							;(11-3=8, 11-2=9, 11-1=10)

		ld 		b,$ff						;output the volume value
		out 	(c),a
		ld 		b,$bf
		ld 		a,e
		and 	$0f
		out 	(c),a
		
		bit 	5,e							;will the tone change?
		jr 		z,afxFrame1					;the tone does not change
		
		ld 		a,3							;select the tone registers:
		sub 	d							;3-3=0, 3-2=1, 3-1=2
		add 	a,a							;0*2=0, 1*2=2, 2*2=4
		
		ld 		b,$ff						; output the tone values
		out 	(c),a
		ld 		b,$bf
		ld 		d,(hl)
		inc 	hl
		out 	(c),d
		ld 		b,$ff
		inc 	a
		out 	(c),a
		ld 		b,$bf
		ld 		d,(hl)
		inc 	hl
		out 	(c),d
		
	afxFrame1:

		bit 	6,e							;is there a noise change?
		jr 		z,afxFrame3					;noise does not change
		
		ld 		a,(hl)						;read the value of noise
		sub 	$20
		jr 		c,afxFrame2					; less than # 20, play next
		ld 		h,a							; otherwise the end of the effect
		ld 		b,$ff
		ld 		b,c							;in BC we record the longest time
		jr 		afxFrame6
		
	afxFrame2:
		inc 	hl
		ld 		(afxNseMix+1),a	;keep the noise value
		
	afxFrame3:
		pop 	bc							;restore the value of the cycle in B
		push 	bc
		inc 	b							;the number of shifts for flags TN
		
		ld 		a,%01101111					;mask for flags TN
	afxFrame4:
		rrc 	e							;shift flags and mask
		rrca
		djnz 	afxFrame4
		ld d	,a
		
		ld 		bc,afxNseMix+2				;we store the values ??of the flags
		ld 		a,(bc)
		xor 	e
		and 	d
		xor 	e							;E is masked with D
		ld 		(bc),a
		
	afxFrame5:
		ld 		c,(ix+2)						; increase the time counter
		ld 		b,(ix+3)
		inc 	bc
		
	afxFrame6:
		ld 		(ix+2),c
		ld 		(ix+3),b
		
		ld 		(ix+0),l						; save the changed address
		ld 		(ix+1),h
		
	afxFrame7:
		ld 		bc,4							; go to the next channel
		add 	ix,bc
		pop 	bc
		djnz 	afxFrame0

		ld 		hl,$ffbf						; output the noise and mixer values

	afxNseMix:
		ld 		de,0							; +1(E)=noise, +2(D)=mixer
		ld 		a,6
		ld 		b,h
		out 	(c),a
		ld 		b,l
		out 	(c),e
		inc 	a
		ld 		b,h
		out 	(c),a
		ld 		b,l
		out 	(c),d
		pop 	ix 
		exx

	ayfxrestoreslot:		
        nextreg $51,$0                  ; these banks are set with smc at the start of the routine.                        
        nextreg $52,$1                  ; 
      ;  nextreg $50,$ff                 ; 

		ld 		bc,65533				; 
		ld 		a,255
		out 	(c),a  					; pop bank AY chip 1
		ret 
	
	ENDP 

	end asm 
	
	ISR() 

	'#endif 

end sub 

'// MARK: - CTC Code 
Sub fastcall SetUpCTC()
	' sets up the CTC, interrupt vectors 
	asm 
	; /*  Equates 
	; This was originally written by KevB for NextSID, minor changes  
	
	INTCTL				equ	0C0h	; Interrupt control
	NMILSB				equ	0C2h	; NMI Return Address LSB
	NMIMSB				equ	0C3h	; NMI Return Address MSB
	INTEN0				equ	0C4h	; INT EN 0
	INTEN1				equ	0C5h	; INT EN 1
	INTEN2				equ	0C6h	; INT EN 2
	INTST0				equ	0C8h	; INT status 0
	INTST1				equ	0C9h	; INT status 1
	INTST2				equ	0CAh	; INT status 2
	INTDM0				equ	0CCh	; INT DMA EN 0
	INTDM1				equ	0CDh	; INT DMA EN 1
	INTDM2				equ	0CEh	; INT DMA EN 2
	CTC0				equ	183Bh	; CTC channel 0 port
	CTC1				equ	193Bh	; CTC channel 1 port
	CTC2				equ	1A3Bh	; CTC channel 2 port
	CTC3				equ	1B3Bh	; CTC channel 3 port
	CTC4				equ	1C3Bh	; CTC channel 4 port
	CTC5				equ	1D3Bh	; CTC channel 5 port
	CTC6				equ	1E3Bh	; CTC channel 6 port
	CTC7				equ	1F3Bh	; CTC channel 7 port
	CTCBASE             equ $c0		; MSB Base address of buffer 
	CTCSIZE             equ $02 	; MSB buffer length 
	CTCEND              equ CTCBASE+(CTCSIZE*2)	

	; */
		
		irq_vector	    equ	65022	;fdfe		            ; 2 BYTES Interrupt vector
		stack		    equ	65021	;fdfd		            ; 252 BYTES System stack
		vector_table	equ	64512	;fc00	                ; 257 BYTES Interrupt vector table	
		
		startup:	

		di					                            ; Set stack and interrupts
		; ld	    sp,stack					            ; System STACK

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

		nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000100
		nextreg VIDEO_INTERUPT_VALUE_NR_23,255

		; ld	    sp,stack					            ; System STACK

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

		ei


	; ' Set up the CTCs 

	set_ctc:

		di 
		; // ld		d,114 										; 
		ld		a,(sampletiming)
		ld 		d,112 
		ld		a,0    										; manually set timing 
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
        ld      a,0
        out     (c),a 
		;ld		a,(hl)
		;outinb							; Time constant		

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
	
	; end if KevBs routeins 
	; 

	sampletiming:
		db 		112						; 1750000 / 15625 = 112 
		; db 		57						; 1750000 / 31250 = 56 

	tunemamebuffer:
		dw 		0000 				

	; line interrupt 

    raster_line:
        ; ei 
        jp    _ISR
        ei 
        reti

    ctc0:

        push	af
        push	bc
        push	de
        push	hl
        call 	play_ctc_sample
        pop	hl
        pop	de
        pop	bc
        pop	af

        ei 
        reti

		ds 		64,0
	temp_isr_sp3:
		ds 		2,0
    ctc1:
        ;push    af
        ;ld      a,7 
        ;out     ($fe),a 
        ;pop     af 
        ei 
        reti 

    raster_frame:
    	db  0

	end asm 

    PlayCTC()
end sub 

sub fastcall PlaySample(byval sample as ubyte)
	asm 
		ld		(ctc_sample_toplay),a 
	end asm 
end sub 

'// MARK: - PlayCTCSample 
'-- Handles taking ctc_sample_toplay and setting the ctc to play on next cycle
sub fastcall PlayCTC()

    asm 

    play_sample:

		ld		(sample),a											; save the sample to play 

	process_sample:

        dec     a 													; dec sample index 
        ld 		hl,ctc_sample_table									; point to start of sample table 
        ld 		e,a 												; table is 6 bytes per item 
        ld 		d,6 												; so 6*index 
        mul 	d,e 												
        add 	hl,de                                               ; add to sample start to get new sample start add 

        ; next two bytes are start bank then loop 
        ld      a,(hl)												; hl is LSBMSB, so get the loop setting 
        ld      (sample_loop),a 									; save it 
        inc     hl 													; move hl pointer 
        ld      a,(hl)												; get bank 
        ld      (sample_bank),a 									; save it 
        inc     hl              ; now sample start 					; move to sample start address 
        
		; BREAK
        ; ld      (sampread+2),hl 									; save this 
		ld		d,h 
		ld		e,l 
		ld		a,(hl)												; ld hl,(hl)
		inc		hl
		ld		h,(hl)
		ld		l,a 
		

    sampread:
        ; ld      de,(00)           									; patched from above       
        ; ex      de,hl 
        ld      (sample_start),hl 
        ld 		(sample_offset),hl
        inc     de 
        inc     de
        ex      de,hl 
        ld      (sampread2+2),hl 
    sampread2:
        ld      de,(00)
        ex      de,hl 
        ld      (sample_length),hl 

        xor     a                                       ; make sure we clear sample to play
        ld		(ctc_sample_toplay),a 
        ret 

    sample:
        db 		0 

    sample_bank:
        db      0 
        
    sample_loop:
        db      0

    sample_start:
        dw      0000

    sample_length:
        dw      0

    sample_offset:
        dw      0

    play_ctc_sample:

		ld		bc,TBBLUE_REGISTER_SELECT_P_243B
		in		a,(c)
		ld 		(ctc0a_port+1),a 

        ld      hl,(sample_start)	
        ld      de,(sample_length)    ; point to sample position 
		add 	hl,de 				; add both to get memory location of end of sample 
		
		; ld		(forward+1),hl 	 

		ld 		de,(sample_offset)
        xor     a 
        sbc     hl,de 				; sample end - offset 
		
        jr      nc,playing			; is sample_offset < sample_end? Then jr to playing  
		jr		c,done_playing
		ld 		hl,(sample_start)	; reset offset 
		ld		(sample_offset), hl 
		dec		hl 	
		ex		de,hl 
		
    playing:

		getreg($50) : ld (playbankout+3),a 
		getreg($51) : ld (playbankout+7),a 

		ld 		a,(sample_bank)			; set sample banks 
		nextreg $50,a 
		inc 	a
		nextreg $51,a 
		
		ld      a,(de)              ; grab sample 
		inc     de 					; move offset 	

		nextreg $2d,a 

        ld      hl,sample_offset 	; 10 
        ld      (hl),e   			; 7 
        inc     hl 		 			; 4 
        ld      (hl),d 	 			; 7 		; 28 t

	playbankout:
        
		nextreg $50,$ff              ; page in sample 
		nextreg $51,$ff              ; page in sample 

    done_playing:

    ctc0a_port:
		ld		a,0 
		ld		bc,TBBLUE_REGISTER_SELECT_P_243B
		out		(c),a 

        ret 

    end asm 
end sub 
