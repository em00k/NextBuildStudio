
' -----------------------------------------------
' Interrupt Routines CTC2 For modules. Fixed Addressed 
' Data table (64 bytes from $fd02)
' -----------------------------------------------
' Required for 
' 
' InitSFX() 
' InitMusic()
' SetUpIM()
' SetUpCTC()
'

#define INTS 

asm    	
	; when interrupts are enable, slot 7, e000 - ffff is assigned 
	; as the interrupt slot and must not be paged out unless you
	; disable interrupts. 
	; $fc00 - $fd01 	= CTC interrupt vector table
	; $fd02 - 
	vector_table	    equ	    $fc00	        ; 257 BYTES Interrupt vector table	
    afxChDesc       	EQU     $fd02			; fixed address of afxChDesc
    sfxenablednl    	EQU     $fd40			; fixed address of sfxenablednl
	currentmusicbanknl	EQU 	$fd44			; current music banks 2 bytes 
	currentsfxbank		EQU 	$fd48			; current sfx bank 2 byte 
    bankbuffersplayernl EQU     $fd50			; fixed address of bankbufferplayernl
	ayfxtoplay			EQU 	$fd58 			; 1 byte for sample to play in FF no sample 
	ayfxbankinplaycode	EQU 	$fd3e
	ctc_sample_toplay	EQU 	$fd3f
	ctc_sample_chan		EQU 	$fd5a 			; requested channel (0/1) for next sample
	ctc_sample_vol		EQU 	$fd5b 			; requested volume (0..15, 255 = table default)
	second_mod_address	EQU 	$fd60 			; address of 2nd mod if TS
;	ctc_sample_table	EQU 	$fd60			; sample of samples ot play
    irq_vector	        equ	    $fdfe		    ; 2 BYTES Interrupt vector
    stack		        equ	    $fdfd		    ; 252 BYTES System stack
	CTC0				equ	    $183B      	    ; CTC channel 0 port
	CTC1				equ	    $193B           ; CTC channel 1 port
	CTC2				equ	    $1A3B           ; CTC channel 2 port
	CTC3				equ	    $1B3B	        ; CTC channel 3 port
	CTCBASE             equ     $c0		        ; MSB Base address of buffer
	CTCSIZE             equ     $02 	        ; MSB buffer length
	CTCEND              equ     CTCBASE+(CTCSIZE*2)
	CTC_VOLBASE			equ		$40				; volume tables live in a bank paged
												; at $4000 (slot 2) - page = $40+volume

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

sub fastcall NewMusic(byval musicbank as ubyte, secondmodule as uinteger=0)
	asm 
		di  
		; BREAK 
		ld 		(bankbuffersplayernl+1),a 
		inc 	a 
		ld 		(bankbuffersplayernl+2),a 
		ld 		a,3 
		ld 		(sfxenablednl+1),a 
		ld 		de, $fd60 
		ex		de, hl 
		ld 		(hl), e 
		inc 	hl 
		ld 		(hl), d 
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

'//MARK: - InitMusic()
Sub fastcall InitMusic(playerbank as byte, musicbank as ubyte, musicaddoffset as uinteger)
	' InitMusic playerbank, musicbank, address offset in music bank
    ' written by em00k part of nextbuild 
		asm 
			 
			
			exx                                     ; common save ret address 
			pop     hl 
			exx 
			; call    _checkints                      ; were ints on so we know if we need to turn them back on after 
			di 										; ensure interrupts are disbled 
			 
			ld      (aybank1+1),a 					; a = player bank 
			pop     af 
			ld      (ayseta+1),a 					; tune bank 
			pop     de			
			; BREAK					
			ld 		hl, $fd60
			ld 		(hl), e
			inc 	hl  
			ld 		(hl), d 
			
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
			ld      a,0
			ld      (bankbuffersplayernl+1),a 		; store bank 
			nextreg $50,a
			inc     a
			nextreg $51,a
	aysetde:	; smc from above dont more DE below
			ld 		hl, $fd60 
			ld 		e, (hl)
			inc 	hl 
			ld 		d, (hl)
			ld 		a, d 						; is de = 0 
			or 		e 				
			jr 		z, 2F					; yes its not a ts song
			ld      a, %0001_0000  				; Else its a ts
			jr 		1F
	2:
			ld      a, %0010_0000  				; single module (player default $20) -
												; %0000_0000 = autodetect, which derails
												; on single-module songs
	1:
			ld 		($4000+10), a 					; player setup byte
			ld      hl,0                        ; point to start of tune in user bank
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
			

			;ReenableInts                            ; If ints were enable before the routine restart them 
			ret 

	ayplayerstack:
			ds      128,0

	playmusicnl:
			; DB $c5,$DD,$01,$0,$0,$c1
			 
			getreg($52)                             ; get slot 2 bank 
			ld      (exitplayernl+3),a              ; save the bank below 
			getreg($50) : ld (exitplayernl+7),a              	; set exit banks 
			getreg($51) : ld (exitplayernl+11),a
			
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
			pop 	ix 
			; push    ix 

	exitplayernl:
			nextreg $52,$0a
			nextreg $50,$00					; patched frpm entry 
			nextreg $51,$01

	ayrepairestack2:

			ret 

	re_init_music:
			ld 		hl, $fd60 
			ld 		e, (hl)
			inc 	hl 
			ld 		d, (hl)
			ld 		a, d 						; is de = 0 
			or 		e 				
			jr 		z, 2F						; yes its not a ts song
			ld      a, %0001_0000  				; Else its a ts
			jr 		1F
		2:
			ld      a, %0010_0000  				; single module (player default $20)
		1:
			ld 		($4000+10), a 				; player setup byte
			ld      hl,0                        ; point to start of tune in user bank 
	
			ld		a, 1
			ld      (sfxenablednl+1),a 
			; ld      a, %0001_0100  				; ACB
			; ld 		($4000+10), a 					; set bits for autodetect TS
			push 	hl 
			push 	de 
			call 	$4008 
			pop 	de 
			pop 	hl
			call	$4003							; re-init the player 
			jp      exitplayernl

	mustplayernl:
			xor     a
			ld      (sfxenablednl+1),a 
			call    $4008							; mute player 
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

		nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000110          ; ULA off, Line on, MSB 0 
		nextreg VIDEO_INTERUPT_VALUE_NR_23,192					; LSB of Line interrupt 
		
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
		;ei 
		; BREAK 
		ld 		(out_isr_sp+1), sp 										; save the stack 
		ld 		sp, temp_isr_sp 										; use temp stack 
		push af : push bc : push hl : push de : push ix : push iy 		
		ex af,af'
		push af
        exx : push bc : push hl : push de :	exx
		; we need to preserve what port BC
		; was set to before the ISR
		ld 		bc,TBBLUE_REGISTER_SELECT_P_243B
		in 		a,(c)
		ld 		(isr_replace_port+1), a
		ld 		bc,LAYER2_ACCESS_P_123B
		in 		a, (c)
		push 	af 
		and 	2
		out 	(c),a 
	end asm 
	
	' you *CAN* call a sub from here, but you will need to be careful that it doesnt use ROM calls that 
	' can cause a crash, 

	#ifdef CUSTOMISR 
		
		MyCustomISR()
		
	#endif 
	
	
    ' #ifndef NOAYFX 
    asm 

    ; check if a sample has been placed into ayfxtoplay 

	no_sample_to_play:		

		ld 		a,(ayfxtoplay)
		cp		$ff 								; is the buffer set to 255?
		jr 		z,no_sfx_to_play					; then nothing to play and jump
		call 	PlaySFX								; set fx to play

	no_sfx_to_play:

		ld      a,(sfxenablednl)					;' are the fx enabled?
		or      a : jr z,skipfxplayernl

		call    _CallbackSFX						;' if so call the SFX callback 

	skipfxplayernl:		
		ld      a,(sfxenablednl+1) 							;' is music enabled?
		or      a : jr z,skipmusicplayer

		ld 		bc,65533	: ld a,255:out (c),a	                ; second AY chip 
		call    playmusicnl						;' if so player frame of music 

	skipmusicplayer:
		ld		a,(ctc_sample_toplay)
		or		a 
		jr 		z,isr_replace_port
		
		call    play_sample                         ; call the ctc sample player

	end asm 
	' #endif 

	asm 
	
    isr_replace_port:		
	; Restore Port 243B from before the ISR
		ld 		a,0									; smc from above 
		ld		bc, TBBLUE_REGISTER_SELECT_P_243B
		out 	(c), a								; restore port 243b
;
		pop 	af 
		ld 		bc, LAYER2_ACCESS_P_123B
		out 	(c), a 
		
		; pop registers fromt the stack 

		exx 
        pop de : pop hl : pop bc
		exx 

        pop af : ex af,af'
		pop iy : pop ix : pop de : pop hl : pop bc : pop af 
	out_isr_sp:
		ld 		sp, 0000 
		ret 									;' standard reg pops ei and reti
	end asm 
	asm 
	ds 128, 0 
temp_isr_sp:
	db 0, 0 
	end asm 
	PlayCTC()
end sub 

' Original AYFX Engine by Shiru 
'
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
		nextreg $52,$0a
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

	CallbackSFX()					' forces inclusion of this sub 
	PlaySFXSys()					' forces inclusion of this sub 
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


		; exx								
		; push ix 

		
	 	getreg($51) : ld (ayfxrestoreslot+3),a              	; set exit banks 
		getreg($52) : ld (ayfxrestoreslot+7),a

		ld 		a,(ayfxbankinplaycode)
		nextreg $51,a         									; page in our banks 
		inc 	a												; slots 0 & 1 0000- $3fff 
		nextreg $52,a                                         
		
		ld bc,65533	: ld a,253:out (c),a	                    ; second AY chip 

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
				
		sub 	b							;TBBLUE_REGISTER_SELECT_P_243B the volume register:
		ld 		d,b							;(11-3=8, 11-2=9, 11-1=10)

		ld 		b,$ff						;output the volume value
		out 	(c),a
		ld 		b,$bf
		ld 		a,e
		and 	$0f
		out 	(c),a
		
		bit 	5,e							;will the tone change?
		jr 		z,afxFrame1					;the tone does not change
		
		ld 		a,3							;TBBLUE_REGISTER_SELECT_P_243B the tone registers:
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
		; pop 	ix 
		; exx

	ayfxrestoreslot:		
        nextreg $51,$ff                  ; these banks are set with smc at the start of the routine.                        
        nextreg $52,$a                  ; 
      ;  nextreg $50,$ff                 ; 

		;ld 		bc,65533				; 
		;ld 		a,255
		;out 	(c),a  					; pop bank AY chip 1
		ret 
	
	ENDP 

	end asm 
	
	ISR() 

	'#endif 

end sub 

'// MARK: - CTC Code
Sub fastcall SetUpCTC(byval volumebank as ubyte)
	' sets up the CTC, interrupt vectors and builds the sample volume
	' tables in 8K bank <volumebank> (4K used, paged at $4000 when needed)
	asm

		startup:

		di					                            ; Set stack and interrupts

		ld		(ctc_vol_bank),a				        ; bank for the volume tables
		; ld	    sp,stack					            ; System STACK

		nextreg	TURBO_CONTROL_NR_07,%00000011	        ; 28Mhz / 27Mhz

		; music/sfx use the second AY via $FFFD chip selects and samples use
		; the $2D DAC - make sure TurboSound (bit1) and the DACs (bit3) are
		; actually enabled or all AY writes land on a disabled chip = silence
		getreg($08)
		or 		%00001010				                ; bit3 = DACs, bit1 = TurboSound
		nextreg PERIPHERAL_3_NR_08,a

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
		nextreg VIDEO_INTERUPT_VALUE_NR_23,192

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

		ld		bc,TBBLUE_REGISTER_SELECT_P_243B	 		; Read timing register
		ld		a,INTERRUPT_CONTROL_NR_C0
		out		(c),a
		inc		b
		in		a,(c)
		and		%00001000	 								; Preserve stackless mode
		or		%00000001	 								; Vector 0x00, IM2 ON
		out		(c),a										; we will keep a now for the correct timing required 
		dec		b

		nextreg $c0,%00001001 
		nextreg $c4,%00000010                            ; Interrupt enable LINE
		nextreg $c5,%00000001                            ; CTC channel 0 zc/to
		nextreg $c6,%00000000                            ; Interrupters
		nextreg $c8,%11111111                            ; 
		nextreg $c9,%11111111                            ; Set status bits to clear
		nextreg $ca,%11111111                            ; 
		nextreg $cc,%00000010                            ; 
		nextreg $cd,%00000000                            ; No DMA - %11 routes CTC0/1 to DMA and blocks their CPU IRQs (CSpect)
		nextreg $ce,%00000000                            ; 

		;ei


	; ' Set up the CTCs 

	set_ctc:

		di 
		; // ld		d,114 										; 
		;ld		a,(sampletiming)
		ld 		d,112
		xor		a    										; timing table index 0 (28MHz row) - A was garbage here
		ld		hl,.timing_tab
		add		a,a
		add		hl,a

		; CTC Channel 0 smaple 

		ld		bc,CTC0					; Channel 0 port
										; IMPETCRV	; Bits 7-0
		ld		a,%10000101				; / 16
		out		(c),a					; Control word
		out		(c),d					; Time constant

		; CTC Channel 1 ISR 

		ld		bc,CTC1						; Channel 1 port
		;                                    IMPETCRV	; Bits 7-0
		ld		a,%10100101					; / 256
		out		(c),a						; Control word
		ld 		a,(hl)
        outinb								; Time constant (outinb also does inc hl)

		; out		(c),a					;<<< was this

        ld		a,(hl)						; hl already advanced by outinb
        ld		(ctc1_50hz_count),a
        ld		(ctc1_50hz_reset),a

		call	ctc_vol_init				; build the 16 x 256 volume tables

		ei
		ret

	.timing_tab:
		; 		fixed 4.4       . -1.25 -2.50 -3.75 -100
		db		250, %10001100 			; 0 28000000 50Hz =  8.75
		db		186, %11000000 			; 1 28571429 50Hz = 12.0  ?
		db		192, %11000000 			; 2 29464286 50Hz = 12.0  ?
		db		250, %10010110 			; 3 30000000 50Hz =  9.375
		db		250, %10011011 			; 4 31000000 50Hz =  9.6875
		db		250, %10100000 			; 5 32000000 50Hz = 10.0
		db		250, %10100101 			; 6 33000000 50Hz = 10.03125
		db		250, %10000111 			; 7 27000000 50Hz =  8.4375
	
	; end of KevB's routines

	; line interrupt

    raster_line:
		; re-entrancy guard: if a previous raster ISR is still running
		; (long music frame), drop this one instead of corrupting the
		; shared temp ISR stack. ei stays early so CTC0 audio keeps
		; ticking during the music frame.
		push    af
		ld      a,(isr_busy)
		or      a
		jr      z,raster_run
		pop     af
		ei
		reti
	raster_run:
		inc     a
		ld      (isr_busy),a
		;ei
		;call    _ISR
		xor     a
		ld      (isr_busy),a
		pop     af	
        ei
        reti
	isr_busy:
		db      0
    ;// MARK: - CTC0 sample frame

    ctc0:
		;di 
		ld 		(out_isr_sp1+1), sp 										; save the stack 
		ld 		sp, temp_isr_sp2	

        push	af
        push	bc
        push	de
        push	hl
		ld 		bc,TBBLUE_REGISTER_SELECT_P_243B
		in 		a, (c)
		ld 		(outc+1), a 
        call 	play_ctc_sample

	outc:
		ld 		a, 0 
		ld 		bc, TBBLUE_REGISTER_SELECT_P_243B
		out 	(c),a 
        pop		hl
        pop		de
        pop		bc
        pop		af

	out_isr_sp1:
        ld      sp,0
        ei 
        reti 

        ds  64,0
    temp_isr_sp2:
        db  0,0

    ;// MARK: - CTC1
    ctc1:
        ; BREAK
        ld 		(out_isr_sp3+1), sp 										; save the stack
        ld 		sp, temp_isr_sp3
		ei 																	; ei only after SP is safe
        push    af
        db		62		; LD A,N
        ctc1_50hz_count:	db	%10001100	; 4.4 fixed point counter
        sub		16		; Subtract 1.0
        ld		(ctc1_50hz_count),a
        jr		z,call_isr
        jr      nc,no_call_isr

    call_isr:   
		call    _ISR
        db	198         	; ADD A,N
        ctc1_50hz_reset:	db	%10001100
		ld		(ctc1_50hz_count),a
		; BREAK
        ; call    _ISR
		; BREAK 
    no_call_isr:
        pop     af 
    out_isr_sp3:
        ld      sp,0
		; BREAK 
        ei 
        reti

        ds  64,0
    temp_isr_sp3:
        db  0,0

    raster_frame:
    	db  0

	end asm 

    PlayCTC()
end sub 

sub fastcall PlaySample(byval sample as ubyte, byval channel as ubyte=0, byval volume as ubyte=255)
	' request sample playback: sample = 1-based table index,
	' channel = 0 (left DAC) or 1 (right DAC),
	' volume = 0..15 override, 255 = use the table's volume byte
	asm
		exx : pop hl : exx 						; save ret address
		ld		e,a 							; sample number
		pop		af 								; channel
		and		1
		ld		(ctc_sample_chan),a
		pop		af 								; volume
		ld		(ctc_sample_vol),a
		ld		a,e
		ld		(ctc_sample_toplay),a 			; trigger last - picked up by the ISR
		exx : push hl : exx
		ret
	end asm
end sub

sub fastcall SetCTCSampleTable(byval ctc_address as uinteger)
	' point the player at a sample table:
	'   db count
	'   per entry (8 bytes): db bank : dw offset : dw length : db rate, volume, flags
	'   rate  = playback rate, 112 = 1.0x (15625Hz), 224 = 0.5x, 56 = 2.0x, 0 = 1.0x
	'   volume= 0..15 (15 = full)
	'   flags = bit0 set -> loop until StopSample()/next PlaySample() on that channel
	asm
		ld 		(ctc_sample_table_ptr),hl
		ret
	end asm
end sub

sub fastcall StopSample(byval channel as ubyte=2)
	' stop sample playback and centre the DAC.
	' channel 0 or 1 stops that channel, anything else stops both.
	asm
		di
		cp		1
		jr		z,stops_ch1
		jr		c,stops_ch0
		; stop both
		xor		a
		ld		(ch0_active),a
		ld		(ch1_active),a
		ld		(ctc_sample_toplay),a
		ld		a,$80
		nextreg	$2c,a
		nextreg	$2e,a
		ei
		ret
	stops_ch0:
		xor		a
		ld		(ch0_active),a
		ld		a,$80
		nextreg	$2c,a
		ei
		ret
	stops_ch1:
		xor		a
		ld		(ch1_active),a
		ld		a,$80
		nextreg	$2e,a
		ei
		ret
	end asm
end sub

sub fastcall SetSampleVolume(byval channel as ubyte, byval vol as ubyte)
	' override a playing channel's volume (0..15) immediately
	asm
		exx : pop hl : exx
		and		1
		ld		c,a 							; channel
		pop		af 								; volume
		and		$0f
		add		a,CTC_VOLBASE 					; a = volume table page
		dec		c
		jr		z,ssv_ch1
		ld		(ch0_volpage+1),a
		jr		ssv_out
	ssv_ch1:
		ld		(ch1_volpage+1),a
	ssv_out:
		exx : push hl : exx
		ret
	end asm
end sub

'// MARK: - PlayCTCSample 
'-- Handles taking ctc_sample_toplay and setting the ctc to play on next cycle
sub fastcall PlayCTC()

    asm

	; ------------------------------------------------------------------
	; play_sample - called from _ISR (50Hz context) with A = 1-based
	; sample index requested via PlaySample(). Parses the table entry,
	; normalises bank/offset, converts rate to an 8.8 step, applies
	; volume and arms the requested channel (0 = left, 1 = right).
	; ------------------------------------------------------------------
    play_sample:

		ld		hl,(ctc_sample_table_ptr)
		ld		e,a 												; keep requested index
		ld		a,h
		or		l
		jp		z,ps_bad											; no table set
		ld		a,e
		or		a
		jp		z,ps_bad											; index 0 = none
		cp		(hl)												; compare with count byte
		jr		z,ps_ok
		jp		nc,ps_bad											; index > count -> ignore
	ps_ok:
		ld		a,(ctc_sample_chan)									; select channel block
		and		1
		ld		ix,ch0_vars
		ld		bc,ch0_volpage+1
		jr		z,ps_chsel
		ld		ix,ch1_vars
		ld		bc,ch1_volpage+1
	ps_chsel:
		ld		(ps_voltgt+1),bc
		xor		a													; gate this channel's tick off
		ld		(ix+0),a											; while we touch its variables
		inc		hl													; first table entry
		dec		e													; 0-based index
		ld		d,8													; 8 bytes per entry
		mul		d,e
		add		hl,de

		ld		c,(hl)												; bank
		inc		hl
		ld		e,(hl)												; offset LSB
		inc		hl
		ld		d,(hl)												; offset MSB
		inc		hl
	ps_norm:
		ld		a,d													; normalise: offset < $2000,
		cp		$20													; advancing the start bank
		jr		c,ps_normdone
		sub		$20
		ld		d,a
		inc		c
		jr		ps_norm
	ps_normdone:
		ld		a,c
		ld		(ix+1),a											; bank (pristine, loop restart)
		ld		(ix+2),a											; playing bank
		ld		(ix+4),e											; start offset
		ld		(ix+5),d
		ld		(ix+10),e											; current pointer
		ld		(ix+11),d
		ld		e,(hl)												; length
		inc		hl
		ld		d,(hl)
		inc		hl
		ld		(ix+6),e											; length (pristine)
		ld		(ix+7),d
		ld		(ix+8),e											; remaining bytes
		ld		(ix+9),d

		ld		a,(hl)												; rate byte -> 8.8 step:
		or		a													; step = 112*256 / rate
		jr		nz,ps_rate											; (112 = 1.0x, 224 = 0.5x,
		ld		a,112												;  56 = 2.0x, 0 = default)
	ps_rate:
		ld		c,a
		push	hl
		ld		de,$7000											; 112 * 256
		xor		a
		ld		b,16
	ps_div:
		sla		e
		rl		d
		rla
		cp		c
		jr		c,ps_div_skip
		sub		c
		inc		e
	ps_div_skip:
		djnz	ps_div
		ld		(ix+13),e											; step lo (fraction)
		ld		(ix+14),d											; step hi (whole bytes)
		xor		a
		ld		(ix+12),a											; fraction accumulator = 0
		pop		hl
		inc		hl													; -> volume byte

		ld		a,(ctc_sample_vol)									; volume override?
		cp		255
		jr		nz,ps_havevol
		ld		a,(hl)												; 255 = use table volume
	ps_havevol:
		and		$0f
		add		a,CTC_VOLBASE										; volume table page at $4000+
	ps_voltgt:
		ld		(0),a												; smc: chN_volpage+1

		inc		hl
		ld		a,(hl)												; flags (bit0 = loop)
		ld		(ix+3),a

		ld		a,1
		ld		(ix+0),a											; arm playback last (atomic gate)
	ps_bad:
        xor     a                                       			; clear the request
        ld		(ctc_sample_toplay),a
        ret

	; per-channel state - both blocks must keep this exact layout
	;   +0 active, +1 bank, +2 playing bank, +3 flags,
	;   +4 start, +6 length, +8 remain, +10 pointer,
	;   +12 fraction, +13 step (8.8)
    ch0_vars:
    ch0_active:	db 0
    ch0_bank:	db 0
    ch0_pbank:	db 0
    ch0_flags:	db 0
    ch0_start:	dw 0
    ch0_length:	dw 0
    ch0_remain:	dw 0
    ch0_ptr:	dw 0
    ch0_frac:	db 0
    ch0_step:	dw 0

    ch1_vars:
    ch1_active:	db 0
    ch1_bank:	db 0
    ch1_pbank:	db 0
    ch1_flags:	db 0
    ch1_start:	dw 0
    ch1_length:	dw 0
    ch1_remain:	dw 0
    ch1_ptr:	dw 0
    ch1_frac:	db 0
    ch1_step:	dw 0

    ctc_sample_table_ptr:
        dw      0
    ctc_vol_bank:
        db      0

	; ------------------------------------------------------------------
	; play_ctc_sample - the CTC0 tick (15625Hz). Runs under DI from the
	; ctc0 ISR, which already saves AF/BC/DE/HL and port $243B.
	; Channel 0 -> left DAC (NR $2C), channel 1 -> right DAC (NR $2E).
	; Each channel advances by its own 8.8 step for per-sample pitch.
	; ------------------------------------------------------------------
    play_ctc_sample:

		ld		a,(ch0_active)
		ld		b,a
		ld		a,(ch1_active)
		or		b
		ret		z													; both idle: cheapest path

		getreg($50) : ld (pcs_bankout+3),a							; save caller's window once
		getreg($51) : ld (pcs_bankout+7),a
		getreg($52) : ld (pcs_bankout+11),a

		ld		a,(ctc_vol_bank)									; page the volume tables
		nextreg	$52,a												; in at $4000-$4FFF

	; ---------------- channel 0 -> left DAC $2C
		ld		a,(ch0_active)
		or		a
		jr		z,tick_ch1

		ld 		a,(ch0_pbank)										; page this channel's window
		nextreg $50,a
		inc 	a
		nextreg $51,a

		ld		hl,(ch0_ptr)
		ld		a,(hl)												; current sample byte
	ch0_volpage:
		ld		h,0													; smc: volume table page
		ld		l,a
		ld		a,(hl)
		nextreg $2c,a												; left DAC

		ld		hl,(ch0_step)										; l = frac step, h = whole step
		ld		a,(ch0_frac)
		add		a,l
		ld		(ch0_frac),a
		ld		c,h
		ld		b,0
		jr		nc,ch0_adv
		inc		c													; carry from the fraction
	ch0_adv:
		ld		a,c
		or		a
		jr		z,tick_ch1											; no whole-byte advance this tick

		ld		hl,(ch0_remain)
		sbc		hl,bc												; carry clear (or a above)
		jr		z,ch0_ended
		jr		c,ch0_ended
		ld		(ch0_remain),hl

		ld		hl,(ch0_ptr)
		add		hl,bc
		bit		6,h													; crossed $4000?
		jr		z,ch0_nowrap
		res		6,h													; wrap into upper 8K and
		set		5,h
		ld		a,(ch0_pbank)										; advance the window one bank
		inc		a
		ld		(ch0_pbank),a
	ch0_nowrap:
		ld		(ch0_ptr),hl
		jr		tick_ch1

	ch0_ended:
		ld		a,(ch0_flags)
		rrca														; bit0 = loop
		jr		c,ch0_loop
		xor		a
		ld		(ch0_active),a
		ld		a,$80												; centre the DAC - no click/DC
		nextreg	$2c,a
		jr		tick_ch1
	ch0_loop:
		ld		hl,(ch0_length)										; rewind from pristine copies
		ld		(ch0_remain),hl
		ld		hl,(ch0_start)
		ld		(ch0_ptr),hl
		ld		a,(ch0_bank)
		ld		(ch0_pbank),a

	; ---------------- channel 1 -> right DAC $2E
	tick_ch1:
		ld		a,(ch1_active)
		or		a
		jr		z,pcs_bankout

		ld 		a,(ch1_pbank)
		nextreg $50,a
		inc 	a
		nextreg $51,a

		ld		hl,(ch1_ptr)
		ld		a,(hl)
	ch1_volpage:
		ld		h,0													; smc: volume table page
		ld		l,a
		ld		a,(hl)
		nextreg $2e,a												; right DAC

		ld		hl,(ch1_step)
		ld		a,(ch1_frac)
		add		a,l
		ld		(ch1_frac),a
		ld		c,h
		ld		b,0
		jr		nc,ch1_adv
		inc		c
	ch1_adv:
		ld		a,c
		or		a
		jr		z,pcs_bankout

		ld		hl,(ch1_remain)
		sbc		hl,bc
		jr		z,ch1_ended
		jr		c,ch1_ended
		ld		(ch1_remain),hl

		ld		hl,(ch1_ptr)
		add		hl,bc
		bit		6,h
		jr		z,ch1_nowrap
		res		6,h
		set		5,h
		ld		a,(ch1_pbank)
		inc		a
		ld		(ch1_pbank),a
	ch1_nowrap:
		ld		(ch1_ptr),hl
		jr		pcs_bankout

	ch1_ended:
		ld		a,(ch1_flags)
		rrca
		jr		c,ch1_loop
		xor		a
		ld		(ch1_active),a
		ld		a,$80
		nextreg	$2e,a
		jr		pcs_bankout
	ch1_loop:
		ld		hl,(ch1_length)
		ld		(ch1_remain),hl
		ld		hl,(ch1_start)
		ld		(ch1_ptr),hl
		ld		a,(ch1_bank)
		ld		(ch1_pbank),a

	pcs_bankout:
		nextreg $50,$ff              								; smc: restore caller banks
		nextreg $51,$ff
		nextreg $52,$ff
        ret

	; ------------------------------------------------------------------
	; ctc_vol_init - builds 16 x 256-byte volume tables in the volume
	; bank (4K from the bank start), value = $80 + (s-$80)*(v+1)/16.
	; Called once from SetUpCTC under DI. Pages slot 2 ($4000) and
	; restores it afterwards.
	; ------------------------------------------------------------------
	ctc_vol_init:
		getreg($52)
		ld		(cvol_bankout+3),a									; save caller's slot 2
		ld		a,(ctc_vol_bank)
		nextreg	$52,a												; tables build at $4000+

		ld		c,0													; c = volume level 0..15
	cvol_level:
		ld		a,CTC_VOLBASE
		add		a,c
		ld		h,a
		ld		l,0													; l = sample value 0..255
	cvol_sample:
		ld		a,l
		sub		$80													; signed offset from centre
		jr		nc,cvol_pos
		neg															; magnitude for s < $80
		ld		d,a
		ld		a,c
		inc		a
		ld		e,a
		mul		d,e													; magnitude * (v+1)
		srl		d : rr e : srl d : rr e : srl d : rr e : srl d : rr e
		ld		a,$80
		sub		e
		jr		cvol_store
	cvol_pos:
		ld		d,a
		ld		a,c
		inc		a
		ld		e,a
		mul		d,e
		srl		d : rr e : srl d : rr e : srl d : rr e : srl d : rr e
		ld		a,$80
		add		a,e
	cvol_store:
		ld		(hl),a
		inc		l
		jr		nz,cvol_sample
		inc		c
		ld		a,c
		cp		16
		jr		nz,cvol_level

		ld		a,CTC_VOLBASE+15									; default volume = full
		ld		(ch0_volpage+1),a									; on both channels
		ld		(ch1_volpage+1),a
		ld		a,$80												; centre both DACs
		nextreg	$2c,a
		nextreg	$2d,a
		nextreg	$2e,a
	cvol_bankout:
		nextreg	$52,$ff												; smc: restore slot 2
		ret

    end asm
end sub

