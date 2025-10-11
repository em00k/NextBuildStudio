
' -----------------------------------------------
' Interrupt Routines Ints
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
	sampletoplay		EQU 	$fd58 			; 1 byte for sample to play in FF no sample 
	ayfxbankinplaycode	EQU 	$fd3e
	second_mod_address	EQU 	$fd60 			; address of 2nd mod if TS
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

sub fastcall NewMusic(byval musicbank as ubyte, second_mod_address as uinteger=0)
	asm 
		di 
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
		ld (sampletoplay),a 
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
			; call    _checkints                      ; were ints on so we know if we need to turn them back on after 
			di 										; ensure interrupts are disbled 

			ld      (aybank1+1),a 					; a = player bank 
			pop     af 
			ld      (ayseta+1),a 					; tune bank 
			pop     de								
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
			ld      a, 0 
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
			jr 		z, aysetde2					; yes its not a ts song 
			ld      a, %0001_0000  				; Else its a ts 
			jr 		aysetde1
	aysetde2:
			ld      a, %0000_0000  				; ACB
	aysetde1:			
			ld 		($4000+10), a 					; set bits for autodetect TS
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
			

			; ReenableInts                            ; If ints were enable before the routine restart them 
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
			pop		ix 
			; push    ix 

	exitplayernl:
			nextreg $52,$0a
			nextreg $50,$00
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
			jr 		z, re_init_music2						; yes its not a ts song 
			ld      a, %0001_0000  				; Else its a ts 
			jr 		re_init_music1
	re_init_music2:
			ld      a, %0000_0000  				; ACB
	re_init_music1:			
			ld 		($4000+10), a 				; set bits for autodetect TS
			ld      hl,0                        ; point to start of tune in user bank 

			ld		a, 1
			ld      (sfxenablednl+1),a 
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

		ld      hl,IM_vector                    ; start of interrupt vector 
		ld      de,IM_vector+1
		ld      bc,257
		ld      a,h                         ; fill with IM_vector/256
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
		nextreg VIDEO_INTERUPT_VALUE_NR_23,192
		
        im      2                           ; enabled the interrupts 
        jp      _exit_im_setup
    ALIGN 256
        IM_vector:
            defs 257,0
            db      0 
    _exit_im_setup:
		exx                                 ; restore the ret address 
        push    hl
        exx 
		ei  
	
	end asm 
	'#endif 
    ISR() 
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
		ex af,af'
		push af
		
		exx : push bc : push hl : push de :	exx
		ld 		bc,TBBLUE_REGISTER_SELECT_P_243B
		in 		a,(c)
		
		#ifndef NOAYFX
			ld 		(skipmusicplayer+1), a
			getreg($52)
			ld 		(exitplayernl+3),a
			getreg($50)
			ld		(exitplayernl+7),a
			getreg($51)
			ld 		(exitplayernl+11),a
		#endif 
		
	end asm 
	
	' you *CAN* call a sub from here, but you will need to be careful that it doesnt use ROM calls that 
	' can cause a crash, 

	#ifdef CUSTOMISR 
		
		MyCustomISR()
		
	#endif 
	
    #ifndef NOAYFX 
	asm 
		; check if a sample has been placed into sampletoplay 
		
		ld 		a,(sampletoplay)
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
	#endif 

	asm 
	
    skipmusicplayer:		
		ld 		a,0									; smc from above 
		ld		bc, TBBLUE_REGISTER_SELECT_P_243B
		out 	(c), a								; restore port 243b
			
		; pop registers fromt the stack 

		exx 
        pop de : pop hl : pop bc
		exx 

        pop af : ex af,af'
		pop iy : pop ix : pop de : pop hl : pop bc : pop af 
	out_isr_sp:
		ld 		sp, 0000 
		ei
		ret 									;' standard reg pops ei and reti
	end asm 
	asm 
	ds 128, 0 
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
		
		ld 		a,(sampletoplay)

		ld 		d,a                                              ; store a in d for the moment 

		ld 		a,$ff 											; now we set sampletoplay to ff 
		ld 		(sampletoplay),a 								; as we have read the sfx to play

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

	                    ; second AY chip 
	 	getreg($51) : ld (ayfxrestoreslot+3),a              	; set exit banks 
		getreg($52) : ld (ayfxrestoreslot+7),a

		ld 		a,(ayfxbankinplaycode)
		nextreg $51,a         									; page in our banks 
		inc 	a												; slots 0 & 1 0000- $3fff 
		nextreg $52,a                                         

		ld bc,65533	: ld a,253:out (c),a

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
	


	'#endif 

end sub 

