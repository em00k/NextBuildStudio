' ============================================================================
'  nextlib_ctc_audio.bas
'  Clean CTC sample-audio + AY music/AYFX interrupt library for the ZX Next.
'  Part of NextBuild by em00k.
'
'  Architecture
'  ------------
'    CTC0  - 15625 Hz audio tick. ISR multiplexes up to 4 software voices,
'            each writing its own DAC port. (play_ctc_sample)
'    CTC1  - clock-locked 50 Hz music tick (4.4 fixed-point divider) -> _ISR
'            -> AY music player + AYFX + one queued PlaySample request.
'    LINE  - minimal frame counter for vsync (raster_line).
'
'  Voices and DAC routing (direct DAC ports, like KevB / 9bitcolor's engine):
'    voice 0 -> DAC A  port $3F  (left)
'    voice 1 -> DAC B  port $0F  (left)
'    voice 2 -> DAC C  port $4F  (right)
'    voice 3 -> DAC D  port $5F  (right)
'  Pan is chosen by which voice you play on.
'
'  Features: banked 16x256 volume tables, per-voice 8.8 fixed-point pitch,
'  bank auto-advance for samples larger than the 16K paging window, looping,
'  per-voice volume override.
'
'  Public API
'  ----------
'    SetUpCTC(volumebank)            - init interrupts + build volume tables
'    SetCTCSampleTable(addr)         - point the engine at a sample table
'    PlaySample(n, channel, volume)  - play table entry n on a voice
'    StopSample(channel)             - stop one voice (0-3) or all (>=4)
'    SetSampleVolume(channel, vol)   - change a playing voice's volume
'    InitMusic / InitSFX / PlaySFX / StopMusic / PlayMusic ...  (AY engine)
' ============================================================================

#define INTS

asm
	; --- fixed system addresses (slot 7, $e000-$ffff stays mapped under ints) ---
	vector_table	    equ	    $fc00	    ; 257 byte IM2 vector table
	afxChDesc       	equ     $fd02		; AYFX channel descriptors (3 x 4)
	ayfxbankinplaycode	equ 	$fd3e		; bank holding the AYFX data
	ctc_sample_toplay	equ 	$fd3f		; queued sample index (0 = none)
	sfxenablednl    	equ     $fd40		; +0 SFX on, +1 music state (1/2/3)
	bankbuffersplayernl equ     $fd50		; +0 player bank, +1/+2 tune banks
	ctc_sample_chan		equ 	$fd5a		; queued channel (0-3)
	ctc_sample_vol		equ 	$fd5b		; queued volume (0-15, 255 = table)
	frame_counter		equ 	$fd5c		; ++ every frame by the LINE interrupt (WaitFrame)
	ayfxtoplay			equ 	$fd58 		; queued AYFX id ($ff = none)
	second_mod_address	equ 	$fd60 		; 2nd module address (TS songs)
	irq_vector	        equ	    $fdfe		; IM2 trampoline (EI : RETI)
	stack		        equ	    $fdfd		; system stack top

	; --- CTC channel ports ---
	CTC0				equ	    $183B		; audio sample tick
	CTC1				equ	    $193B		; 50 Hz music divider
	CTC2				equ	    $1A3B
	CTC3				equ	    $1B3B

	; --- volume tables: 16 x 256 bytes in an 8K bank paged at $6000 (slot 3),
	;     away from visible ULA screen memory and below normal $8000+ code.
	CTC_VOLBASE			equ		$60
end asm

' ============================================================================
' MARK: - AY music player wrappers
' ============================================================================

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
		ld 		(bankbuffersplayernl+1),a
		inc 	a
		ld 		(bankbuffersplayernl+2),a
		ld 		a,3
		ld 		(sfxenablednl+1),a
		ld 		de, second_mod_address
		ex		de, hl
		ld 		(hl), e
		inc 	hl
		ld 		(hl), d
		ei
	end asm
end sub

sub fastcall PlaySFX(byval sfxtoplay as ubyte)
	' queue an AYFX effect; the 50Hz ISR launches it
	asm
		ld (ayfxtoplay),a
	end asm
end sub

'// MARK: - InitMusic
Sub fastcall InitMusic(playerbank as byte, musicbank as ubyte, musicaddoffset as uinteger)
	' InitMusic playerbank, musicbank, offset-in-music-bank
	' Player is UniPlayer/ts4000; banks it at $4000 (slot 2), tune at $0000.
	asm
		exx                                     ; save ret address
		pop     hl
		exx
		di

		ld      (aybank1+1),a 					; a = player bank
		pop     af
		ld      (ayseta+1),a 					; tune bank
		pop     de
		ld 		hl, second_mod_address
		ld 		(hl), e
		inc 	hl
		ld 		(hl), d

		getreg($52)
		ld 		(exitplayerinit+3),a  			; remember caller banks for exit
		ld 		(exitplayernl+3),a
		getreg($50)
		ld		(exitplayerinit+7),a
		ld		(exitplayernl+7),a
		getreg($51)
		ld 		(exitplayerinit+11),a
		ld 		(exitplayernl+11),a

	aybank1:
		ld      a,0
		nextreg $52,a 						    ; page player in at $4000
		ld      (bankbuffersplayernl),a
	ayseta:
		ld      a,0
		ld      (bankbuffersplayernl+1),a
		nextreg $50,a
		inc     a
		nextreg $51,a
	aysetde:
		ld 		hl, second_mod_address
		ld 		e, (hl)
		inc 	hl
		ld 		d, (hl)
		ld 		a, d 						    ; second module present?
		or 		e
		jr 		z, 2F
		ld      a, %0001_0000  				    ; TS song
		jr 		1F
	2:
		ld      a, %0010_0000  				    ; single module (player default $20);
											    ; %0000_0000 = autodetect, which derails
											    ; on single-module songs
	1:
		ld 		($4000+10), a 					; player setup byte
		ld      hl,0                             ; tune start in user bank
		push    ix
		call    $4003							    ; player init
		pop     ix

	exitplayerinit:
		nextreg $52,$0a                          ; smc'd from entry
		nextreg $50,$00
		nextreg $51,$01

		exx : push hl : exx
		ret

	ayplayerstack:
		ds      128,0

	; --- called from the 50Hz ISR to play one music frame ---
	playmusicnl:
		getreg($52)
		ld      (exitplayernl+3),a
		getreg($50) : ld (exitplayernl+7),a
		getreg($51) : ld (exitplayernl+11),a

		ld      hl,bankbuffersplayernl			; page player + tune
		ld      a,(hl)
		nextreg $52,a
		inc     hl
		ld      a,(hl)
		nextreg $50,a
		inc     a
		nextreg $51,a

		ld      a,(sfxenablednl+1)
		cp      2
		jr      z,mustplayernl					; 2 = mute
		ld      a,(sfxenablednl+1)
		cp      3
		jr      z,re_init_music 				; 3 = reinit

		push    ix
		call    $4005					        ; play a frame
		pop 	ix

	exitplayernl:
		nextreg $52,$0a                          ; smc'd from entry
		nextreg $50,$00
		nextreg $51,$01
		ret

	re_init_music:
		ld 		hl, second_mod_address
		ld 		e, (hl)
		inc 	hl
		ld 		d, (hl)
		ld 		a, d
		or 		e
		jr 		z, 2F
		ld      a, %0001_0000  				    ; TS song
		jr 		1F
	2:
		ld      a, %0010_0000  				    ; single module
	1:
		ld 		($4000+10), a 				    ; player setup byte
		ld      hl,0
		ld		a, 1
		ld      (sfxenablednl+1),a
		push 	hl
		push 	de
		call 	$4008 						    ; reset
		pop 	de
		pop 	hl
		call	$4003							    ; re-init
		jp      exitplayernl

	mustplayernl:
		xor     a
		ld      (sfxenablednl+1),a
		call    $4008						        ; mute
		jp      exitplayernl
	end asm
end sub

' ============================================================================
' MARK: - IM2 helpers (alternate line-interrupt setup; kept for compatibility)
' ============================================================================

Sub fastcall SetUpIM()
	asm
		exx : pop hl : exx
		di
		ld      hl,$fe00
		ld      de,$fe01
		ld      bc,257
		ld      a,h
		ld      i,a
		ld      (hl),a
		ldir
		ld      h,a
        ld      l, a
        ld      a,$c3                       ; jp ._ISR
        ld      (hl),a
        inc     hl
		ld      de,._ISR
        ld      (hl),e
        inc     hl
        ld      (hl),d
		nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000110
		nextreg VIDEO_INTERUPT_VALUE_NR_23,192
        im      2
		exx
        push    hl
        exx
		ei
	end asm
end sub

sub fastcall DisableIM()
    asm
        xor     a
        ld      (sfxenablednl),a
        ld      (sfxenablednl+1),a
		nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000100
        di
    end asm
end sub

' ============================================================================
' MARK: - _ISR (50Hz frame: AYFX + music + sample trigger)
' ============================================================================

Sub fastcall ISR()
	asm
		; switch to a private stack and save everything
		ld 		(out_isr_sp+1), sp
		ld 		sp, temp_isr_sp
		push af : push bc : push hl : push de : push ix : push iy
		ex af,af'
		push af
        exx : push bc : push hl : push de :	exx
		; preserve the TBBlue register selector + layer-2 port across the frame
		ld 		bc,TBBLUE_REGISTER_SELECT_P_243B
		in 		a,(c)
		ld 		(isr_replace_port+1), a
		ld 		bc,LAYER2_ACCESS_P_123B
		in 		a, (c)
		push 	af
		and 	2
		out 	(c),a
	end asm

	#ifdef CUSTOMISR
		MyCustomISR()
	#endif

    asm
	no_sample_to_play:
		ld 		a,(ayfxtoplay)
		cp		$ff 								; queued AYFX?
		jr 		z,no_sfx_to_play
		call 	PlaySFX							    ; launch it

	no_sfx_to_play:
		ld      a,(sfxenablednl)					; SFX enabled?
		or      a : jr z,skipfxplayernl
		call    _CallbackSFX						; AYFX frame

	skipfxplayernl:
		ld      a,(sfxenablednl+1) 					; music enabled?
		or      a : jr z,skipmusicplayer
		ld 		bc,65533 : ld a,255 : out (c),a	    ; select 2nd AY
		call    playmusicnl						    ; music frame

	skipmusicplayer:
		ld		a,(ctc_sample_toplay)				; queued sample?
		or		a
		jr 		z,isr_replace_port
		call    play_sample						    ; arm it on its voice
	end asm

	asm
    isr_replace_port:
		ld 		a,0									; smc: restore $243B selector
		ld		bc, TBBLUE_REGISTER_SELECT_P_243B
		out 	(c), a
		pop 	af
		ld 		bc, LAYER2_ACCESS_P_123B
		out 	(c), a
		; restore registers
		exx
        pop de : pop hl : pop bc
		exx
        pop af : ex af,af'
		pop iy : pop ix : pop de : pop hl : pop bc : pop af
	out_isr_sp:
		ld 		sp, 0000
		ret
	end asm
	asm
		ds 128, 0
	temp_isr_sp:
		db 0, 0
	end asm
	PlayCTC()
end sub

' ============================================================================
' MARK: - AYFX engine (by Shiru, adapted by em00k) - ported verbatim
' ============================================================================

sub fastcall PlaySFXSys()
	ASM
		; launch the effect on a free (or longest-sounding) channel. A = effect
	PlaySFX:
	PROC
		Local ayfxrestoreslot
		push 	ix
		ld 		a,(ayfxtoplay)
		ld 		d,a
		ld 		a,$ff
		ld 		(ayfxtoplay),a

		getreg($51) : ld (ayfxrestoreslot+3),a
		getreg($52) : ld (ayfxrestoreslot+7),a

		ld 		a,(ayfxbankinplaycode)
		nextreg $51,a
		inc 	a
		nextreg $52,a

		ld 		a,d
	AFXPLAY:
		ld 		de,0
		ld 		h,e
		ld 		l,a
		add 	hl,hl
	afxBnkAdr:
		ld 		bc,0
		add 	hl,bc
		ld 		c,(hl)
		inc 	hl
		ld 		b,(hl)
		add 	hl,bc
		push 	hl
		ld 		hl,afxChDesc
		ld 		b,3
	afxPlay0:
		inc 	hl
		inc 	hl
		ld 		a,(hl)
		inc 	hl
		cp 		e
		jr 		c,afxPlay1
		ld 		c,a
		ld 		a,(hl)
		cp 		d
		jr 		c,afxPlay1
		ld 		e,c
		ld 		d,a
		push 	hl
		pop 	ix
	afxPlay1:
		inc 	hl
		djnz 	afxPlay0
		pop 	de
		ld 		(ix-3),e
		ld 		(ix-2),d
		ld 		(ix-1),b
		ld 		(ix-0),b
	ayfxrestoreslot:
		nextreg $51,$ff
		nextreg $52,$0a
		pop 	ix
		ENDP
	end asm
end sub

'// MARK: - InitSFX
SUB fastcall InitSFX(byval bank as ubyte)
	ASM
	PROC
	LOCAL ayfxrestoreslot
		ld 		d,a
		call 	_checkints
		di
		exx
		pop 	hl
		exx
		getreg($51) : ld (ayfxrestoreslot+3),a
		getreg($52) : ld (ayfxrestoreslot+7),a
		ld 		a,d
		ld 		(ayfxbankinplaycode),a
		nextreg $51,a
		inc 	a
		nextreg $52,a
		ld 		hl,$2000
	AFXINIT:
		inc 	hl
		ld 		(afxBnkAdr+1),hl
		ld 		hl,afxChDesc
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
		ld 		hl,$ffbf
		ld 		e,$15
	afxInit1:
		dec 	e
		ld 		b,h
		out 	(c),e
		ld 		b,l
		out 	(c),d
		jr 		nz,afxInit1
		ld 		(afxNseMix+1),de
	ayfxrestoreslot:
		nextreg $51,$0
		nextreg $52,$1
		exx
		push 	hl
		exx
	ret
		ENDP
	END ASM
	CallbackSFX()					' force inclusion
	PlaySFXSys()					' force inclusion
END SUB

'// MARK: - CallbackSFX
sub fastcall CallbackSFX()
	asm
	PROC
	LOCAL ayfxrestoreslot
	AFXFRAME:
	 	getreg($51) : ld (ayfxrestoreslot+3),a
		getreg($52) : ld (ayfxrestoreslot+7),a
		ld 		a,(ayfxbankinplaycode)
		nextreg $51,a
		inc 	a
		nextreg $52,a
		ld bc,65533	: ld a,253:out (c),a
		ld 		bc,$03fd
		ld 		ix,afxChDesc
	afxFrame0:
		push 	bc
		ld 		a,11
		ld 		h,(ix+1)
		cp 		h
		jr 		nc,afxFrame7
		ld 		l,(ix+0)
		ld 		e,(hl)
		inc 	hl
		sub 	b
		ld 		d,b
		ld 		b,$ff
		out 	(c),a
		ld 		b,$bf
		ld 		a,e
		and 	$0f
		out 	(c),a
		bit 	5,e
		jr 		z,afxFrame1
		ld 		a,3
		sub 	d
		add 	a,a
		ld 		b,$ff
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
		bit 	6,e
		jr 		z,afxFrame3
		ld 		a,(hl)
		sub 	$20
		jr 		c,afxFrame2
		ld 		h,a
		ld 		b,$ff
		ld 		b,c
		jr 		afxFrame6
	afxFrame2:
		inc 	hl
		ld 		(afxNseMix+1),a
	afxFrame3:
		pop 	bc
		push 	bc
		inc 	b
		ld 		a,%01101111
	afxFrame4:
		rrc 	e
		rrca
		djnz 	afxFrame4
		ld d	,a
		ld 		bc,afxNseMix+2
		ld 		a,(bc)
		xor 	e
		and 	d
		xor 	e
		ld 		(bc),a
	afxFrame5:
		ld 		c,(ix+2)
		ld 		b,(ix+3)
		inc 	bc
	afxFrame6:
		ld 		(ix+2),c
		ld 		(ix+3),b
		ld 		(ix+0),l
		ld 		(ix+1),h
	afxFrame7:
		ld 		bc,4
		add 	ix,bc
		pop 	bc
		djnz 	afxFrame0
		ld 		hl,$ffbf
	afxNseMix:
		ld 		de,0
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
	ayfxrestoreslot:
        nextreg $51,$ff
        nextreg $52,$a
		ret
	ENDP
	end asm
	ISR()
end sub

' ============================================================================
' MARK: - SetUpCTC (interrupts + CTC timers + volume tables)
' ============================================================================

Sub fastcall SetUpCTC(byval volumebank as ubyte)
	' volumebank = a free 8K bank for the 16x256 volume tables (4K used)
	asm
		di
		ld		(ctc_vol_bank),a				; remember the volume bank
		xor		a
		ld		(ctc_sample_toplay),a
		ld		(ctc_sample_chan),a
		ld		(sfxenablednl),a
		ld		(sfxenablednl+1),a
		ld		(ch0_active),a : ld (ch1_active),a
		ld		(ch2_active),a : ld (ch3_active),a
		ld		a,$ff
		ld		(ayfxtoplay),a
		ld		(ctc_sample_vol),a

		nextreg	TURBO_CONTROL_NR_07,%00000011	; 28 MHz

		; samples use the 8-bit DACs and music uses the 2nd AY: make sure both
		; are enabled or every write lands on disabled hardware = silence
		getreg($08)
		or 		%00001010				        ; bit3 DACs, bit1 TurboSound
		nextreg PERIPHERAL_3_NR_08,a

		; --- build the IM2 vector table at $fc00 (filled with $fd) ---
		ld	    hl,vector_table
		ld	    a,h
		ld	    i,a
		im	    2
		inc	    a
		ld	    b,l
	.fillvec:
		ld	    (hl),a
		inc	    hl
		djnz	.fillvec
		ld	    (hl),a
		ld	    a,$FB						    ; EI  at irq_vector-1
		ld	    hl,$4DED					    ; RETI
		ld	    (irq_vector-1),a
		ld	    (irq_vector),hl

		; --- patch the three vectors we use: line, CTC0, CTC1 ---
		xor     a
		ld		bc,192							    ; line interrupt on line 192
		ld      de,raster_line
		ld      (raster_frame),a
		ld 		a,i
		ld		h,a
		ld		l,0
		ld		(hl),e					        ; line vector  (offset 0)
		inc		l
		ld		(hl),d
		ld		l,6							        ; CTC0 vector  (offset 6)
		ld		de,ctc0
		ld		(hl),e
		inc		l
		ld		(hl),d
		inc		l							        ; CTC1 vector  (offset 8)
		ld		de,ctc1
		ld		(hl),e
		inc		l
		ld		(hl),d

		ld		a,b
		and		%00000001
		or		%00000110				        ; ULA off, line interrupt on
		nextreg	VIDEO_INTERUPT_CONTROL_NR_22,a
		ld		a,c
		nextreg	VIDEO_INTERUPT_VALUE_NR_23,a	; IM2 on line BC

		; preserve the stackless-mode bit, force vector 0 / IM2 on
		ld		bc,TBBLUE_REGISTER_SELECT_P_243B
		ld		a,$c0
		out		(c),a
		inc		b
		in		a,(c)
		and		%00001000
		or		%00000001
		out		(c),a
		dec		b

		nextreg $c0,%00001001
		nextreg $c4,%00000010				    ; LINE interrupt enable
		nextreg $c5,%00000001				    ; CTC channel 0 zc/to
		nextreg $c6,%00000000
		nextreg $c8,%11111111
		nextreg $c9,%11111111				    ; clear status bits
		nextreg $ca,%11111111
		nextreg $cc,%00000010
		nextreg $cd,%00000000				    ; DMA off (%11 routes CTC to DMA
									            ; and blocks its CPU IRQs)
		nextreg $ce,%00000000

		; --- program the CTC timers ---
		di
		ld		bc,CTC0						    ; CTC0: /16, TC=112 -> 15625 Hz
		ld		a,%10000101
		out		(c),a
		ld		a,112
		out		(c),a

		ld		bc,CTC1						    ; CTC1: /256, TC=250 ...
		ld		a,%10100101
		out		(c),a
		ld		a,250
		out		(c),a
		ld		a,%10001100					    ; ... then /8.75 (4.4 fp) -> 50 Hz
		ld		(ctc1_50hz_count),a
		ld		(ctc1_50hz_reset),a

		call	ctc_vol_init				    ; build the volume tables
		ei
		ret

	; ------------------------------------------------------------------------
	; LINE interrupt - frame counter only (no _ISR call, no re-entrancy risk)
	; ------------------------------------------------------------------------
	raster_line:
		push	af
		ld		a,(frame_counter)				; overshoot-proof tick for WaitFrame()
		inc		a
		ld		(frame_counter),a
		ld		a,(raster_frame)
		inc		a
		ld		(raster_frame),a
		jr 		z,raster_line_done
		pop		af
		ei
		reti
		
	raster_line_done:
		ld		a,1
		ld 		(raster_ready),a
		pop		af
		ei
		reti

	raster_frame:
		db		0
	raster_ready:
		db		0

	; ------------------------------------------------------------------------
	; CTC0 - the 15625 Hz audio tick. Runs under DI; uses a private stack and
	; preserves the $243B selector that play_ctc_sample's getreg/nextreg use.
	; ------------------------------------------------------------------------
	ctc0:
		ld 		(ctc0_sp+1), sp
		ld 		sp, ctc0_stack
		push	af
		push	bc
		push	de
		push	hl
		ld 		bc,TBBLUE_REGISTER_SELECT_P_243B
		in 		a, (c)
		ld 		(ctc0_port+1), a
		call 	play_ctc_sample
	ctc0_port:
		ld		a, 0
		ld		bc, TBBLUE_REGISTER_SELECT_P_243B
		out		(c),a
		pop		hl
		pop		de
		pop		bc
		pop		af
	ctc0_sp:
		ld      sp,0
		ei
		reti
		ds  64,0
	ctc0_stack:
		db  0,0

	; ------------------------------------------------------------------------
	; CTC1 - clock-locked 50 Hz divider that drives _ISR (music + AYFX).
	; ------------------------------------------------------------------------
	ctc1:
		push	af
		ld		a,(ctc1_busy)
		or		a
		jr		z,ctc1_enter
		pop		af
		ei
		reti
	ctc1_enter:
		ld		a,1
		ld		(ctc1_busy),a
		pop		af
		ld 		(ctc1_sp+1), sp
		ld 		sp, ctc1_stack
		ei									        ; ei only after SP is safe
		push    af
		db		62		                        ; LD A,n
	ctc1_50hz_count:
		db		%10001100	                    ; 4.4 fixed-point counter
		sub		16			                    ; subtract 1.0
		ld		(ctc1_50hz_count),a
		jr		z,ctc1_fire
		jr      nc,ctc1_done
	ctc1_fire:
		call    ._ISR
		db	    198         	                ; ADD A,n
	ctc1_50hz_reset:
		db	    %10001100
		ld		(ctc1_50hz_count),a
	ctc1_done:
		pop     af
		push	af
		xor		a
		ld		(ctc1_busy),a
		pop		af
	ctc1_sp:
		ld      sp,0
		ei
		reti
		ds  64,0
	ctc1_stack:
		db  0,0
	ctc1_busy:
		db  0
	end asm

    PlayCTC()
end sub

' ============================================================================
' MARK: - Public sample API
' ============================================================================

sub fastcall PlaySample(byval sample as ubyte, byval channel as ubyte=0, byval volume as ubyte=255)
	' sample  = 1-based table index
	' channel = voice 0-3 (0,1 left / 2,3 right by default DAC routing)
	' volume  = 0-15 override, 255 = use the table entry's volume byte
	asm
		;di
		exx : pop hl : exx						; save ret address
		ld		e,a 							; sample number
		pop		af : and 3 : ld (ctc_sample_chan),a
		pop		af : ld (ctc_sample_vol),a
		ld		a,e
		call	play_sample						; arm immediately, not from the 50Hz ISR
		exx : push hl : exx
		;ei
		ret
	end asm
end sub

sub fastcall SetCTCSampleTable(byval ctc_address as uinteger)
	' point the engine at a table:
	'   db count
	'   per entry (8 bytes): db bank : dw offset : dw length : db rate, volume, flags
	'   rate:   112 = 1.0x (15625Hz), 224 = 0.5x, 56 = 2.0x, 0 = 1.0x
	'   volume: 0-15 ; flags: bit0 = loop
	asm
		ld 		(ctc_sample_table_ptr),hl
		ret
	end asm
end sub

sub fastcall StopSample(byval channel as ubyte=4)
	' channel 0-3 stops that voice; anything >=4 stops them all
	asm
		di
		cp		4
		jp		nc,stops_all
		ld		c,a								; keep channel
		ld		e,a : ld d,15 : mul d,e			; de = channel*15
		ld		ix,ch0_vars
		add		ix,de
		xor		a
		ld		(ix+0),a						; this voice idle
		ld		b,0
		ld		hl,stops_dactab
		add		hl,bc
		ld		c,(hl)							; its DAC port low byte
		ld		a,$80
		out		(c),a							; centre that DAC (B=0)
		call	set_vol_mode
		ei
		ret
	stops_all:
		xor		a
		ld		(ch0_active),a : ld (ch1_active),a
		ld		(ch2_active),a : ld (ch3_active),a
		ld		(ctc_sample_toplay),a
		ld		a,$80
		out		($3f),a : out ($0f),a : out ($4f),a : out ($5f),a
		call	set_vol_mode
		ei
		ret
	stops_dactab:
		db		$3f,$0f,$4f,$5f
	end asm
end sub

sub fastcall SetSampleVolume(byval channel as ubyte, byval vol as ubyte)
	' change a (playing) voice's volume 0-15 immediately
	asm
		di
		exx : pop hl : exx
		and		3
		add		a,a								; channel*2
		ld		c,a : ld b,0
		ld		hl,ssv_volpagetab
		add		hl,bc
		ld		e,(hl) : inc hl : ld d,(hl)		; de = chN_volpage+1
		pop		af								; vol
		and		$0f
		add		a,CTC_VOLBASE
		ld		(de),a							; patch the voice's volume page
		call	set_vol_mode					; may flip the full-vol fast-path gate
		exx : push hl : exx
		ei
		ret
	ssv_volpagetab:
		dw		ch0_volpage+1, ch1_volpage+1, ch2_volpage+1, ch3_volpage+1
	end asm
end sub

sub fastcall WaitFrame()
	' Wait for the next 50Hz frame. Overshoot-proof: it waits for the LINE
	' interrupt's frame_counter to change, so heavy CTC audio (which delays
	' but never cancels the LINE interrupt) can't make it skip/miss a frame.
	' Use this instead of WaitRaster() to keep game timing smooth under audio.
	asm
		ld		a,(frame_counter)
		ld		e,a
	wf_loop:
		ld		a,(frame_counter)
		cp		e
		jr		z,wf_loop
	end asm
end sub

' ============================================================================
' MARK: - Sample engine internals (parser, tick, volume tables)
' ============================================================================

sub fastcall PlayCTC()
    asm

	; ------------------------------------------------------------------------
	; play_sample - called from _ISR (50 Hz) with A = queued sample index.
	; Parses the entry, normalises bank/offset, converts the rate byte to an
	; 8.8 step, picks the voice block by channel, sets its volume page, arms.
	; ------------------------------------------------------------------------
	play_sample:
		di
		push 	ix 
		ld		(ps_index),a
		ld		hl,(ctc_sample_table_ptr)
		ld		a,h : or l : jp z,ps_done		; no table set
		ld		a,(ps_index)
		or		a : jp z,ps_done				; index 0
		cp		(hl) : jr z,ps_ok
		jp		nc,ps_done						; index > count
	ps_ok:
		; --- pick voice block (channel*15) and its volume-page SMC slot ---
		ld		a,(ctc_sample_chan) : and 3
		ld		(ps_chan),a
		ld		e,a : ld d,15 : mul d,e
		ld		ix,ch0_vars
		add		ix,de
		ld		a,(ps_chan) : add a,a			; channel*2
		ld		e,a : ld d,0
		ld		hl,ps_volpagetab
		add		hl,de
		ld		e,(hl) : inc hl : ld d,(hl)
		ld		(ps_voltgt+1),de
		xor		a : ld (ix+0),a					; gate this voice off

		; --- point at the entry: table + 1 + (index-1)*8 ---
		ld		hl,(ctc_sample_table_ptr)
		inc		hl
		ld		a,(ps_index) : dec a
		ld		e,a : ld d,8 : mul d,e
		add		hl,de

		ld		c,(hl) : inc hl					; bank
		ld		e,(hl) : inc hl
		ld		d,(hl) : inc hl					; de = offset
	ps_norm:
		ld		a,d : cp $20 : jr c,ps_normdone	; keep offset < $2000,
		sub		$20 : ld d,a : inc c			; advancing the start bank
		jr		ps_norm
	ps_normdone:
		ld		a,c
		ld		(ix+1),a						; bank  (pristine, for loop)
		ld		(ix+2),a						; pbank (current)
		ld		(ix+4),e : ld (ix+5),d			; start
		ld		(ix+10),e : ld (ix+11),d		; ptr
		ld		e,(hl) : inc hl
		ld		d,(hl) : inc hl					; de = length
		ld		(ix+6),e : ld (ix+7),d			; length (pristine)
		ld		(ix+8),e : ld (ix+9),d			; remain

		; --- rate byte -> 8.8 step : step = 112*256 / rate ---
		ld		a,(hl) : inc hl
		or		a : jr nz,ps_rate
		ld		a,112
	ps_rate:
		ld		c,a
		push	hl
		ld		de,$7000						; 112*256
		xor		a
		ld		b,16
	ps_div:
		sla		e : rl d : rla
		cp		c : jr c,ps_div_skip
		sub		c : inc e
	ps_div_skip:
		djnz	ps_div
		ld		(ix+13),e						; step lo (fraction)
		ld		(ix+14),d						; step hi (whole bytes)
		xor		a : ld (ix+12),a				; fraction accumulator
		pop		hl								; -> volume byte

		; --- volume (override or table) ---
		ld		a,(ctc_sample_vol)
		cp		255 : jr nz,ps_havevol
		ld		a,(hl)
	ps_havevol:
		and		$0f
		add		a,CTC_VOLBASE
	ps_voltgt:
		ld		(0),a							; smc -> chN_volpage+1
		inc		hl

		ld		a,(hl)							; flags (bit0 = loop)
		ld		(ix+3),a

		ld		a,1
		ld		(ix+0),a						; arm last (atomic gate)
	ps_done:
		xor		a
		ld		(ctc_sample_toplay),a
		call	set_vol_mode					; refresh full-vol fast-path gate
		pop 	ix
		ei
		ret

	ps_index:	db 0
	ps_chan:	db 0
	ps_volpagetab:
		dw		ch0_volpage+1, ch1_volpage+1, ch2_volpage+1, ch3_volpage+1

	ctc_sample_table_ptr:	dw 0
	ctc_vol_bank:			db 0
	vol_active:				db 0	; nonzero iff an active voice is attenuated
									; (gates volume-bank paging + table lookups)

	; --- per-voice state, 15 bytes each, must stay contiguous (channel*15) ---
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
	ch2_vars:
	ch2_active:	db 0
	ch2_bank:	db 0
	ch2_pbank:	db 0
	ch2_flags:	db 0
	ch2_start:	dw 0
	ch2_length:	dw 0
	ch2_remain:	dw 0
	ch2_ptr:	dw 0
	ch2_frac:	db 0
	ch2_step:	dw 0
	ch3_vars:
	ch3_active:	db 0
	ch3_bank:	db 0
	ch3_pbank:	db 0
	ch3_flags:	db 0
	ch3_start:	dw 0
	ch3_length:	dw 0
	ch3_remain:	dw 0
	ch3_ptr:	dw 0
	ch3_frac:	db 0
	ch3_step:	dw 0

	; ------------------------------------------------------------------------
	; play_ctc_sample - the CTC0 tick. Saves the paging slots once, pages the
	; volume bank at $6000, then runs four near-identical voice blocks. Each:
	; skip-if-idle / page its bank / read byte / volume lookup / DAC out /
	; advance by 8.8 step / wrap at $4000 (+bank) / loop or end.
	; ------------------------------------------------------------------------
	play_ctc_sample:
		ld		a,(ch0_active) : ld b,a
		ld		a,(ch1_active) : or b : ld b,a
		ld		a,(ch2_active) : or b : ld b,a
		ld		a,(ch3_active) : or b
		ret		z								; all idle

		getreg($50) : ld (pcs_bankout+3),a		; save slot 0 (8K sample window)
		ld		a,(vol_active) : or a : jr z,pcs_voldone	; any attenuated voice?
		getreg($53) : ld (pcs_volrest+3),a		; only then save + page the volume bank
		ld		a,(ctc_vol_bank) : nextreg $53,a	; volume tables at $6000
	pcs_voldone:

	; ===== voice 0 -> DAC A ($3f, left) =====
		ld		a,(ch0_active) : or a : jp z,pcs_v1
		ld		a,(ch0_pbank) : nextreg $50,a		; 8K window: slot 0 only
		ld		hl,(ch0_ptr) : ld a,(hl)			; raw sample byte
		ld		d,a									; keep raw byte
		ld		a,(vol_active) : or a				; any attenuated voice playing?
		ld		a,d									; A = raw (flags preserved)
		jr		z,ch0_dac							; full volume -> write raw, no lookup
	ch0_volpage:
		ld		h,CTC_VOLBASE+15 : ld l,d : ld a,(hl)	; smc page; table lookup
	ch0_dac:
		out		($3f),a
		ld		hl,(ch0_step)
		ld		a,(ch0_frac) : add a,l : ld (ch0_frac),a
		ld		c,h : ld b,0
		jr		nc,ch0_whole : inc c
	ch0_whole:
		ld		a,c : or a : jp z,pcs_v1
		ld		hl,(ch0_remain) : sbc hl,bc
		jr		z,ch0_end : jr c,ch0_end
		ld		(ch0_remain),hl
		ld		hl,(ch0_ptr) : add hl,bc
		bit		5,h : jr z,ch0_nowrap				; 8K wrap at $2000
		res		5,h
		ld		a,(ch0_pbank) : inc a : ld (ch0_pbank),a
	ch0_nowrap:
		ld		(ch0_ptr),hl
		jp		pcs_v1
	ch0_end:
		ld		a,(ch0_flags) : rrca : jr c,ch0_loop
		xor		a : ld (ch0_active),a
		ld		a,$80 : out ($3f),a
		jp		pcs_v1
	ch0_loop:
		ld		hl,(ch0_length) : ld (ch0_remain),hl
		ld		hl,(ch0_start) : ld (ch0_ptr),hl
		ld		a,(ch0_bank) : ld (ch0_pbank),a

	; ===== voice 1 -> DAC B ($0f, left) =====
	pcs_v1:
		ld		a,(ch1_active) : or a : jp z,pcs_v2
		ld		a,(ch1_pbank) : nextreg $50,a		; 8K window: slot 0 only
		ld		hl,(ch1_ptr) : ld a,(hl)			; raw sample byte
		ld		d,a									; keep raw byte
		ld		a,(vol_active) : or a				; any attenuated voice playing?
		ld		a,d									; A = raw (flags preserved)
		jr		z,ch1_dac							; full volume -> write raw, no lookup
	ch1_volpage:
		ld		h,CTC_VOLBASE+15 : ld l,d : ld a,(hl)
	ch1_dac:
		out		($0f),a
		ld		hl,(ch1_step)
		ld		a,(ch1_frac) : add a,l : ld (ch1_frac),a
		ld		c,h : ld b,0
		jr		nc,ch1_whole : inc c
	ch1_whole:
		ld		a,c : or a : jp z,pcs_v2
		ld		hl,(ch1_remain) : sbc hl,bc
		jr		z,ch1_end : jr c,ch1_end
		ld		(ch1_remain),hl
		ld		hl,(ch1_ptr) : add hl,bc
		bit		5,h : jr z,ch1_nowrap				; 8K wrap at $2000
		res		5,h
		ld		a,(ch1_pbank) : inc a : ld (ch1_pbank),a
	ch1_nowrap:
		ld		(ch1_ptr),hl
		jp		pcs_v2
	ch1_end:
		ld		a,(ch1_flags) : rrca : jr c,ch1_loop
		xor		a : ld (ch1_active),a
		ld		a,$80 : out ($0f),a
		jp		pcs_v2
	ch1_loop:
		ld		hl,(ch1_length) : ld (ch1_remain),hl
		ld		hl,(ch1_start) : ld (ch1_ptr),hl
		ld		a,(ch1_bank) : ld (ch1_pbank),a

	; ===== voice 2 -> DAC C ($4f, right) =====
	pcs_v2:
		ld		a,(ch2_active) : or a : jp z,pcs_v3
		ld		a,(ch2_pbank) : nextreg $50,a		; 8K window: slot 0 only
		ld		hl,(ch2_ptr) : ld a,(hl)			; raw sample byte
		ld		d,a									; keep raw byte
		ld		a,(vol_active) : or a				; any attenuated voice playing?
		ld		a,d									; A = raw (flags preserved)
		jr		z,ch2_dac							; full volume -> write raw, no lookup
	ch2_volpage:
		ld		h,CTC_VOLBASE+15 : ld l,d : ld a,(hl)
	ch2_dac:
		out		($4f),a
		ld		hl,(ch2_step)
		ld		a,(ch2_frac) : add a,l : ld (ch2_frac),a
		ld		c,h : ld b,0
		jr		nc,ch2_whole : inc c
	ch2_whole:
		ld		a,c : or a : jp z,pcs_v3
		ld		hl,(ch2_remain) : sbc hl,bc
		jr		z,ch2_end : jr c,ch2_end
		ld		(ch2_remain),hl
		ld		hl,(ch2_ptr) : add hl,bc
		bit		5,h : jr z,ch2_nowrap				; 8K wrap at $2000
		res		5,h
		ld		a,(ch2_pbank) : inc a : ld (ch2_pbank),a
	ch2_nowrap:
		ld		(ch2_ptr),hl
		jp		pcs_v3
	ch2_end:
		ld		a,(ch2_flags) : rrca : jr c,ch2_loop
		xor		a : ld (ch2_active),a
		ld		a,$80 : out ($4f),a
		jp		pcs_v3
	ch2_loop:
		ld		hl,(ch2_length) : ld (ch2_remain),hl
		ld		hl,(ch2_start) : ld (ch2_ptr),hl
		ld		a,(ch2_bank) : ld (ch2_pbank),a

	; ===== voice 3 -> DAC D ($5f, right) =====
	pcs_v3:
		ld		a,(ch3_active) : or a : jp z,pcs_bankout
		ld		a,(ch3_pbank) : nextreg $50,a		; 8K window: slot 0 only
		ld		hl,(ch3_ptr) : ld a,(hl)			; raw sample byte
		ld		d,a									; keep raw byte
		ld		a,(vol_active) : or a				; any attenuated voice playing?
		ld		a,d									; A = raw (flags preserved)
		jr		z,ch3_dac							; full volume -> write raw, no lookup
	ch3_volpage:
		ld		h,CTC_VOLBASE+15 : ld l,d : ld a,(hl)
	ch3_dac:
		out		($5f),a
		ld		hl,(ch3_step)
		ld		a,(ch3_frac) : add a,l : ld (ch3_frac),a
		ld		c,h : ld b,0
		jr		nc,ch3_whole : inc c
	ch3_whole:
		ld		a,c : or a : jp z,pcs_bankout
		ld		hl,(ch3_remain) : sbc hl,bc
		jr		z,ch3_end : jr c,ch3_end
		ld		(ch3_remain),hl
		ld		hl,(ch3_ptr) : add hl,bc
		bit		5,h : jr z,ch3_nowrap				; 8K wrap at $2000
		res		5,h
		ld		a,(ch3_pbank) : inc a : ld (ch3_pbank),a
	ch3_nowrap:
		ld		(ch3_ptr),hl
		jp		pcs_bankout
	ch3_end:
		ld		a,(ch3_flags) : rrca : jr c,ch3_loop
		xor		a : ld (ch3_active),a
		ld		a,$80 : out ($5f),a
		jp		pcs_bankout
	ch3_loop:
		ld		hl,(ch3_length) : ld (ch3_remain),hl
		ld		hl,(ch3_start) : ld (ch3_ptr),hl
		ld		a,(ch3_bank) : ld (ch3_pbank),a

	pcs_bankout:
		nextreg $50,$ff							; smc: restore caller's slot 0
		ld		a,(vol_active) : or a : ret z	; volume bank only paged if attenuated
	pcs_volrest:
		nextreg $53,$ff							; smc: restore caller's slot 3
		ret

	; ------------------------------------------------------------------------
	; ctc_vol_init - build 16 x 256 volume tables in the volume bank ($6000,
	; slot 3). value = $80 + (s-$80)*(v+1)/16. Seeds all voices to full volume
	; and centres the four DACs. Called once from SetUpCTC under DI.
	; ------------------------------------------------------------------------
	ctc_vol_init:
		ld		(cvol_sp+1),sp
		ld		sp,cvol_stack
		getreg($53) : ld (cvol_bankout+3),a
		ld		a,(ctc_vol_bank) : nextreg $53,a
		ld		c,0								; volume level 0..15
	cvol_level:
		ld		a,CTC_VOLBASE : add a,c
		ld		h,a
		ld		l,0								; sample value 0..255
	cvol_sample:
		ld		a,l : sub $80
		jr		nc,cvol_pos
		neg
		ld		d,a : ld a,c : inc a : ld e,a
		mul		d,e
		srl		d : rr e : srl d : rr e : srl d : rr e : srl d : rr e
		ld		a,$80 : sub e
		jr		cvol_store
	cvol_pos:
		ld		d,a : ld a,c : inc a : ld e,a
		mul		d,e
		srl		d : rr e : srl d : rr e : srl d : rr e : srl d : rr e
		ld		a,$80 : add a,e
	cvol_store:
		ld		(hl),a
		inc		l : jr nz,cvol_sample
		inc		c : ld a,c : cp 16 : jr nz,cvol_level

		ld		a,CTC_VOLBASE+15				; default voices to full volume
		ld		(ch0_volpage+1),a : ld (ch1_volpage+1),a
		ld		(ch2_volpage+1),a : ld (ch3_volpage+1),a
		ld		a,$80							; centre all four DACs
		out		($3f),a : out ($0f),a : out ($4f),a : out ($5f),a
	cvol_bankout:
		nextreg $53,$ff
	cvol_sp:
		ld		sp,0
		ret
		ds		32,0
	cvol_stack:
		db		0,0

	; ------------------------------------------------------------------------
	; set_vol_mode - recompute vol_active: 1 iff some active voice is attenuated
	; (volume page != full). Called from the 50Hz API subs (not the tick) so the
	; tick can skip volume-bank paging + table lookups when everything is full.
	; ------------------------------------------------------------------------
	set_vol_mode:
		xor		a : ld (vol_active),a
		ld		a,(ch0_active) : or a : jr z,svm1
		ld		a,(ch0_volpage+1) : cp CTC_VOLBASE+15 : jr nz,svm_set
	svm1:
		ld		a,(ch1_active) : or a : jr z,svm2
		ld		a,(ch1_volpage+1) : cp CTC_VOLBASE+15 : jr nz,svm_set
	svm2:
		ld		a,(ch2_active) : or a : jr z,svm3
		ld		a,(ch2_volpage+1) : cp CTC_VOLBASE+15 : jr nz,svm_set
	svm3:
		ld		a,(ch3_active) : or a : ret z
		ld		a,(ch3_volpage+1) : cp CTC_VOLBASE+15 : ret z
	svm_set:
		ld		a,1 : ld (vol_active),a
		ret

	end asm
end sub
