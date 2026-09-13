' ============================================================================
'  nextlib_ints_classic_v2.bas
'
'  IM2 raster interrupt + PT3 music player + ayFX sound effects, ZX Spectrum
'  Next.  Rewrite of nextlib_ints_classic.bas.
'
'  ayFX replayer by Shiru, adapted by em00k.
'
'  ---------------------------------------------------------------------------
'  WHAT IS NEW IN V2
'  ---------------------------------------------------------------------------
'  * Multi-channel effects.  PlaySFXA(group, width) plays width consecutive
'    effects on width AY channels at once:
'
'        PlaySFX(5)      one channel, effect 5      (= PlaySFXA(5,1))
'        PlaySFXA(0,2)   two channels, effects 0,1
'        PlaySFXA(1,2)   two channels, effects 2,3
'        PlaySFXA(0,3)   three channels, effects 0,1,2
'        PlaySFXA(1,3)   three channels, effects 3,4,5
'
'    effect index = group * width + channel.  The .afb data format is
'    unchanged - a 3-channel effect is simply three ordinary effects authored
'    to play together.
'
'  * SFXChip(n) gives the effects their own AY.  Optional: by default effects
'    stay on AY0 with the music, exactly as v1 behaved.
'
'  * Fixed from v1:
'      - InitMusic wrote the TurboSound second-module address to the label but
'        read it back from the literal $fd60 (a fossil of the older EQU memory
'        map).  That read hit uninitialised RAM, so a non-zero value flagged an
'        ordinary tune as a 2-module TS song and the player init went chasing a
'        module that was not there.  This was the random start-up crash.
'      - The ISR jumped over call CallbackSFX on every frame that had no new
'        effect to start, so effects never advanced.  (SFX stuck.)
'      - NewMusic wrote the tune bank to bankbuffers+1 AND +2, but the player
'        only ever reads +0 and +1, so the +2 write was landing on a neighbour.
'      - afxChDesc was declared ds 8*3 (24 bytes) for a 3 x 4 byte table.
'
'  ---------------------------------------------------------------------------
'  !! INCLUDE THIS FILE LAST !!
'  ---------------------------------------------------------------------------
'  The variable block below is inline data in the code stream.  If execution
'  ever reaches it the CPU runs the data as instructions - and a $FF byte is
'  RST $38, which with the ROM paged out is an instant crash.  The block is
'  jumped over so it is safe wherever it lands, but including this file last
'  keeps it off the execution path entirely.
'
'  ---------------------------------------------------------------------------
'  MEMORY MAP WHILE THE PLAYER RUNS
'  ---------------------------------------------------------------------------
'    MMU0/MMU1  $0000-$3FFF   tune banks   (ROM is paged OUT)
'    MMU2       $4000-$5FFF   PT3 player
'    MMU1/MMU2  $2000-$5FFF   SFX bank, briefly, inside the FX engine only
'
'  The FX engine borrows MMU1/MMU2 and restores them before returning, so it
'  overlaps the music banks only for the duration of its own call.  Both run
'  from the ISR, one after the other, never nested.
'
'  ---------------------------------------------------------------------------
'  FUTURE CODE-BANKING
'  ---------------------------------------------------------------------------
'  Sections are ordered so the one-shot init code (SECTION 6) could move into a
'  CODEBANK later.  The per-frame path (SECTIONS 4 and 5) must stay resident:
'  it runs from the ISR, and a banked routine is reached through __FAR_CALL,
'  which uses a shadow stack and assumes its bank is paged in - neither is safe
'  from an interrupt that preempts arbitrary code.
' ============================================================================

#define INTS

' ============================================================================
'  '// MARK: SECTION 1 - VARIABLES
' ============================================================================
'  Kept deliberately small; this is all resident RAM.
'
'  sfxenablednl MUST keep its name and layout - the EnableSFX / DisableSFX /
'  EnableMusic / DisableMusic macros in nextlib.bas poke it by name:
'      +0  effects enabled   0 = off, 1 = on
'      +1  music state       0 = off, 1 = play, 2 = mute request, 3 = re-init
' ============================================================================

asm
		jr		nlv2_vars_end				; never execute the data

	afxChDesc:
		ds		4*3							; 3 channels x 4 bytes:
											;  +0 +1  current effect data address
											;  +2 +3  frame counter
											; an idle channel has address $0000
											; and time $FFFF, so it always wins
											; the longest playing search.
	sfxenablednl:
		db		0							; +0 effects on/off  (macro contract)
		db		0							; +1 music state     (macro contract)

	sfx_request:
		db		$ff							; effect / group index, $FF = idle
		db		1							; channels to use, 1..3

	sfx_bank:
		db		0							; first bank of the .afb data

	mus_playerbank:
		db		0							; PT3 player bank
	mus_tunebank:
		db		0							; first bank of the tune

	second_mod_address:
		dw		0							; 2nd module offset, 0 = not a TS tune

	sfx_chip:
		db		253							; $FFFD select byte for the FX chip.
											; 253 = AY2, so effects own a whole
											; chip and its mixer by default and
											; never fight the music for R8/R0-R5.
											; 255 = AY0 shares with the music,
											; which is what v1 always did - call
											; SFXChip(0) for that.
											; The chip field is INVERTED and the
											; byte also carries the L/R enables:
											; %111111cc, so the value is 255-chip.
	nlv2_vars_end:
end asm

' ============================================================================
'  '// MARK: - SECTION 2 - PUBLIC API, MUSIC
' ============================================================================

sub fastcall StopMusic()
	asm
		ld		a,2							; ask the ISR to mute on its next pass
		ld		(sfxenablednl+1),a
	end asm
end sub

sub fastcall PlayMusic()
	asm
		ld		a,1
		ld		(sfxenablednl+1),a
	end asm
end sub

sub fastcall NewMusic(byval musicbank as ubyte, byval secondmod as uinteger=0)
	' Switch tune without re-initialising the player here.  State 3 asks the
	' ISR to re-init against the new bank on its next pass, so this returns
	' immediately and the swap happens in sync with the frame.
	'
	' v1 read this second parameter from HL, which is not where it arrives -
	' that, plus writing it to the literal $fd60, was the start-up crash.
	asm
		exx
		pop		hl							; save the return address in HL'
		exx
		di

		ld		(mus_tunebank),a			; A = first tune bank.  The player
											; pages tunebank+1 itself, so v1's
											; extra write to bankbuffers+2 was
											; landing on a neighbouring variable.
		pop		de							; second module offset, 0 = not TS
		ld		(second_mod_address),de

		ld		a,3
		ld		(sfxenablednl+1),a
		ei

		exx
		push	hl							; put the return address back
		exx
		ret
	end asm
end sub

' ============================================================================
'  SECTION 3 - PUBLIC API, EFFECTS
' ============================================================================
'  PlaySFX / PlaySFXA only lodge a request; the ISR starts it on the next
'  frame.  The request is one word - index in the low byte, width in the high
'  byte - so multi-channel costs no extra RAM.
' ============================================================================

sub fastcall PlaySFX(byval sfxtoplay as ubyte)
	' One effect on one channel.  Identical to v1.
	asm
		ld		(sfx_request),a
		ld		a,1
		ld		(sfx_request+1),a
	end asm
end sub

sub fastcall PlaySFXA(byval group as ubyte, byval width as ubyte)
	' width consecutive effects on width channels, starting at
	' effect index group*width.  width is 1..3.
	'
	' Multi-parameter fastcall: parameter 1 arrives in A, the rest are pushed.
	' Lift the return address out of the way first, then pop them in order.
	' A uByte parameter lands in the HIGH half of its word, so `pop af` puts it
	' straight into A.  No IX frame, no prologue, no epilogue.
	asm
		exx
		pop		hl							; save the return address in HL'
		exx

		ld		(sfx_request),a				; A = group
		pop		af							; width
		ld		(sfx_request+1),a

		exx
		push	hl							; put the return address back
		exx
		ret
	end asm
end sub

sub fastcall SFXChip(byval chip as ubyte)
	' Give the effects their own AY (0..2).  Music stays on AY0, so SFXChip(1)
	' or SFXChip(2) hands the whole of that chip - all three channels and the
	' mixer - to the effects engine.
	'
	' The $FFFD chip field is INVERTED (%11 = AY0), and the same byte carries
	' the L/R enables, so the select byte is %111111cc = 255 - chip.
	asm
		and		3
		cpl									; 255 - chip  ->  $FF/$FE/$FD
		ld		e,a							; E = the new select byte

		getreg($08)							; TurboSound FIRST.  It is OFF after a
		or		%00000010					; reset, and while it is off the chip
		nextreg	$08,a						; field is frozen - every select is
											; ignored and all writes land on AY0.
											; Enabling it here is what makes the
											; selection actually land.

											; Silence the chip we are LEAVING.
											; Whatever volume an effect last wrote
											; stays latched on that chip for ever
											; otherwise - that is the stuck note
											; when the chip is switched while an
											; effect is still playing.
		ld		a,(sfx_chip)
		ld		bc,$fffd
		out		(c),a						; select the old chip
		ld		d,8							; R8, R9, R10 = the channel volumes
	sfxc_mute:
		ld		b,$ff
		out		(c),d						; select volume register
		ld		b,$bf
		xor		a
		out		(c),a						; volume 0
		inc		d
		ld		a,d
		cp		11
		jr		nz,sfxc_mute

		ld		a,e							; now commit the new chip
		ld		(sfx_chip),a
		ld		b,$ff
		out		(c),a						; and select it, so the very next
											; engine pass cannot land on the
											; old chip.
	end asm
end sub

' ============================================================================
'  SECTION 4 - MUSIC PLAYER GLUE  (per-frame, resident)
' ============================================================================

sub fastcall InitMusic(byval playerbank as ubyte, byval musicbank as ubyte, byval musicaddoffset as uinteger)
	' See PlaySFXA for the multi-parameter fastcall convention.
	asm
		exx
		pop		hl							; save the return address in HL'
		exx
		di

		ld		(mus_playerbank),a			; A = player bank
		pop		af							; first tune bank
		ld		(mus_tunebank),a
		pop		de							; second module offset, 0 = not TS
		ld		(second_mod_address),de

		getreg($52) : ld (exitplayerinit+3),a
		getreg($50) : ld (exitplayerinit+7),a
		getreg($51) : ld (exitplayerinit+11),a

		ld		a,(mus_playerbank)
		nextreg	$52,a						; player at $4000
		ld		a,(mus_tunebank)
		nextreg	$50,a						; tune at $0000
		inc		a
		nextreg	$51,a						; and $2000

		call	mus_set_ts_flag				; stamp the ACB / TS byte
		ld		hl,0						; start of the tune in the user bank
		push	ix
		call	$4003						; player init
		pop		ix

	exitplayerinit:
		nextreg	$52,$0a						; smc'd above
		nextreg	$50,$00
		nextreg	$51,$01

		exx
		push	hl							; put the return address back
		exx
		ret									; the two routines below are call
											; targets only - this ret is what
											; stops execution falling into them.

; ----------------------------------------------------------------------------
;  mus_set_ts_flag
;  Writes the player's autodetect byte at ($4000+10): bit 4 set means this is
;  a TurboSound tune with a second module.  Shared by InitMusic and the ISR's
;  re-init path so the two can never disagree - in v1 they read the flag from
;  two different addresses, which is what caused the random start-up crash.
; ----------------------------------------------------------------------------
	mus_set_ts_flag:
		ld		de,(second_mod_address)
		ld		a,d
		or		e
		ld		a,%0000_0000				; ACB, ordinary single-module tune
		jr		z,mstf_store
		ld		a,%0001_0000				; TurboSound, two modules
	mstf_store:
		ld		($4000+10),a
		ret

; ----------------------------------------------------------------------------
;  playmusicnl - one frame of music.  Called from the ISR only.
; ----------------------------------------------------------------------------
	playmusicnl:
		getreg($52) : ld (exitplayernl+3),a
		getreg($50) : ld (exitplayernl+7),a
		getreg($51) : ld (exitplayernl+11),a

		ld		a,(mus_playerbank)
		nextreg	$52,a
		ld		a,(mus_tunebank)
		nextreg	$50,a
		inc		a
		nextreg	$51,a

		ld		a,(sfxenablednl+1)
		cp		2
		jr		z,muteplayernl
		cp		3
		jr		z,re_init_music

		push	ix
		call	$4005						; play one frame
		pop		ix

	exitplayernl:
		nextreg	$52,$0a						; smc'd above
		nextreg	$50,$00
		nextreg	$51,$01
		ret

	re_init_music:
		call	mus_set_ts_flag
		ld		a,1							; back to normal play
		ld		(sfxenablednl+1),a
		call	$4008						; mute first
		ld		hl,0
		call	$4003						; re-init against the new tune
		jr		exitplayernl

	muteplayernl:
		xor		a
		ld		(sfxenablednl+1),a
		call	$4008
		jr		exitplayernl

	end asm
end sub

' ============================================================================
'  SECTION 5 - INTERRUPT
' ============================================================================

sub fastcall SetUpIM()
	' Build the IM2 vector table and enable the raster interrupt on line 192.
	' The jp is stored in the middle of the table - in practice only xxFF is
	' needed, but a full 257-byte table is the safe form.
	asm
		exx
		pop		hl
		exx
		di

		ld		hl,IM_vector
		ld		de,IM_vector+1
		ld		bc,257
		ld		a,h
		ld		i,a
		ld		(hl),a
		ldir

		ld		h,a
		ld		l,a
		ld		a,$c3						; jp
		ld		(hl),a
		inc		hl
		ld		de,._ISR
		ld		(hl),e
		inc		hl
		ld		(hl),d

		nextreg	VIDEO_INTERUPT_CONTROL_NR_22,%00000110
		nextreg	VIDEO_INTERUPT_VALUE_NR_23,192

		im		2
		jp		_exit_im_setup
	ALIGN 256
	IM_vector:
		defs	257,0
		db		0
	_exit_im_setup:
		exx
		push	hl
		exx
		ei
	end asm
	ISR()									' keeps ._ISR from being dead-stripped
end sub

sub fastcall DisableIM()
	asm
		xor		a
		ld		(sfxenablednl),a
		ld		(sfxenablednl+1),a
		nextreg	VIDEO_INTERUPT_CONTROL_NR_22,%00000100
		di
	end asm
end sub

'// MARK: - ISR
sub fastcall ISR()
	asm
		ld		(out_isr_sp+1),sp			; swap to our own stack
		ld		sp,temp_isr_sp
		push	af : push bc : push hl : push de : push ix : push iy
		ex		af,af'
		push	af
		exx : push bc : push hl : push de : exx

		ld		bc,TBBLUE_REGISTER_SELECT_P_243B
		in		a,(c)						; save whichever nextreg the
		ld		(skipmusicplayer+1),a		; foreground had selected
	end asm

	#ifdef CUSTOMISR
		MyCustomISR()
	#endif

	#ifndef NOAYFX
	asm
		; ------------------------------------------------------------------
		;  Effects.  Start any pending request, then advance what is playing.
		;  v1 jumped straight past the callback when there was no new request,
		;  so running effects never advanced - that was the SFX stuck bug.
		; ------------------------------------------------------------------
		ld		a,(sfx_request)
		cp		$ff
		jr		z,no_sfx_to_play
		call	afx_start					; consumes the request

	no_sfx_to_play:
		ld		a,(sfxenablednl)
		or		a
		jr		z,skipfxplayernl
		call	._CallbackSFX

	skipfxplayernl:
		ld		a,(sfxenablednl+1)
		or		a
		jr		z,skipmusicplayer
		ld		bc,65533					; music always plays on AY0
		ld		a,255
		out		(c),a
		call	playmusicnl
	end asm
	#endif

	asm
	skipmusicplayer:
		ld		a,0							; smc'd on entry
		ld		bc,TBBLUE_REGISTER_SELECT_P_243B
		out		(c),a						; restore the nextreg select

		exx : pop de : pop hl : pop bc : exx
		pop		af : ex af,af'
		pop		iy : pop ix : pop de : pop hl : pop bc : pop af
	out_isr_sp:
		ld		sp,0000						; smc'd on entry
		ei
		ret
	end asm

	asm
		ds		128,0						; ISR-private stack, grows down
	temp_isr_sp:
		db		0,0
	end asm
end sub

' ============================================================================
'  SECTION 6 - EFFECTS ENGINE
' ============================================================================

'// MARK: - afx_start
sub fastcall PlaySFXSys()
	' Container only.  The ret is load-bearing: InitSFX calls this sub purely
	' so the labels below survive dead-stripping, and without the ret it would
	' fall straight into the engine and fire whatever sfx_request held.
	asm
		ret

; ----------------------------------------------------------------------------
;  afx_start - act on a pending request.  ISR only.
;    (sfx_request+0) = group index, (sfx_request+1) = width 1..3
;  Pages the effect bank in over MMU1/MMU2, installs 1..3 effects, pages back.
; ----------------------------------------------------------------------------
	afx_start:
	PROC
	LOCAL afxrestoreslot

		ld		a,(sfx_request)
		ld		e,a							; E = group
		ld		a,$ff						; consume the request
		ld		(sfx_request),a

		getreg($51) : ld (afxrestoreslot+3),a
		getreg($52) : ld (afxrestoreslot+7),a

		ld		a,(sfx_bank)
		nextreg	$51,a						; effect data at $2000
		inc		a
		nextreg	$52,a						; and $4000

		ld		a,(sfx_request+1)
		and		3
		jr		z,afxrestoreslot			; width 0, nothing to do
		ld		b,a							; B = channel count

		ld		d,e							; D = group
		ld		e,b							; E = width
		mul		d,e							; DE = group * width
		ld		a,e							; A = base effect index
											; (product is always < 256, so the
											;  low byte is the whole answer)
		dec		b
		jr		z,afx_start_one

		; ---- multi-channel: channels 0..width-1 take consecutive effects
		inc		b							; restore the count
		ld		ix,afxChDesc
	afx_start_loop:
		push	bc
		call	afx_install
		ld		bc,4
		add		ix,bc
		pop		bc
		inc		a
		djnz	afx_start_loop
		jr		afxrestoreslot

		; ---- single channel: steal the one that has been playing longest.
		; Idle channels carry time $FFFF so they are picked first.
	afx_start_one:
		ld		hl,afxChDesc
		ld		de,0						; DE = longest time seen so far
		ld		b,3
	afx_scan:
		inc		hl							; -> +2, time low
		inc		hl
		ld		c,(hl)
		inc		hl							; -> +3, time high
		ld		a,c
		cp		e
		jr		c,afx_scan_next
		ld		a,(hl)
		cp		d
		jr		c,afx_scan_next
		ld		e,c							; remember it as the longest
		ld		d,a
		push	hl							; IX = this channel + 3
		pop		ix
	afx_scan_next:
		inc		hl							; -> next channel
		djnz	afx_scan

		ld		bc,-3						; normalise IX to the channel base
		add		ix,bc
		call	afx_install

	afxrestoreslot:
		nextreg	$51,$0						; smc'd above
		nextreg	$52,$1
		ret

; ----------------------------------------------------------------------------
;  afx_install - point one channel at one effect.
;    A  = effect index      IX = channel descriptor base
;  Preserves A.  Clobbers HL, BC.
;  The .afb layout is: [count] [word offset per effect...] [effect data...],
;  and each offset is relative to its own slot in the table.
; ----------------------------------------------------------------------------
	afx_install:
		ld		h,0
		ld		l,a
		add		hl,hl						; index * 2
	afxBnkAdr:
		ld		bc,0						; smc: base of the offset table
		add		hl,bc
		ld		c,(hl)
		inc		hl
		ld		b,(hl)
		add		hl,bc						; HL = effect data
		ld		(ix+0),l
		ld		(ix+1),h
		ld		(ix+2),0					; time = 0, start of the effect
		ld		(ix+3),0
		ret

	ENDP
	end asm
end sub

'// MARK: - InitSFX
sub fastcall InitSFX(byval bank as ubyte)
	' Point the engine at a bank of .afb data and silence the AY.
	asm
	PROC
	LOCAL afxrestoreslot

		ld		d,a							; A = bank
		di

		exx
		pop		hl
		exx

		getreg($51) : ld (afxrestoreslot+3),a
		getreg($52) : ld (afxrestoreslot+7),a

		ld		a,d
		ld		(sfx_bank),a
		nextreg	$51,a
		inc		a
		nextreg	$52,a

		ld		hl,$2000					; byte 0 of the bank is the effect
		inc		hl							; count; the offset table follows
		ld		(afxBnkAdr+1),hl

		ld		hl,afxChDesc				; mark all three channels idle:
		ld		de,$00ff					; address $0000, time $FFFF
		ld		bc,$03fd
	afxInit0:
		ld		(hl),d
		inc		hl
		ld		(hl),d
		inc		hl
		ld		(hl),e
		inc		hl
		ld		(hl),e
		inc		hl
		djnz	afxInit0

		getreg($08)						; TurboSound on.  While it is off the
		or		%00000010				; chip field is frozen and every select
		nextreg	$08,a					; is ignored, so this is what makes the
										; FX chip reachable at all.
		ld		bc,$fffd
		ld		a,(sfx_chip)
		out		(c),a					; select the FX chip, so the silence
										; below clears THAT chip.  C stays $FD
										; for the loop.

		ld		hl,$ffbf					; silence all 14 AY registers
		ld		e,$15
	afxInit1:
		dec		e
		ld		b,h
		out		(c),e
		ld		b,l
		out		(c),d
		jr		nz,afxInit1
		ld		(afxNseMix+1),de			; clear the noise / mixer accumulator

	afxrestoreslot:
		nextreg	$51,$0						; smc'd above
		nextreg	$52,$1

		exx
		push	hl
		exx
		ret

	ENDP
	end asm

	CallbackSFX()							' never actually run - both subs
	PlaySFXSys()							' start with ret.  The calls keep
end sub										' their labels out of the stripper.

'// MARK: - CallbackSFX

sub fastcall CallbackSFX()
	' One frame for every playing channel.  ISR only.
	'
	' This walks all three channels regardless of how they were started, which
	' is why 2- and 3-channel effects need no code here at all: a wide effect
	' is just several channels that happen to have begun on the same frame.
	asm
	PROC
	LOCAL afxrestoreslot

		; NOTE: unlike PlaySFXSys there is deliberately NO leading ret here.
		; This sub's body IS the engine the ISR calls every frame.  InitSFX
		; also calls it once, which is harmless: every channel is idle at that
		; point so the walk does nothing but rewrite a silent mixer.
		exx
		push	ix

		getreg($51) : ld (afxrestoreslot+3),a
		getreg($52) : ld (afxrestoreslot+7),a

		ld		a,(sfx_bank)
		nextreg	$51,a
		inc		a
		nextreg	$52,a

		ld		bc,65533					; select the FX chip.  Default 255
		ld		a,(sfx_chip)				; (AY0, shared with the music);
		out		(c),a						; SFXChip(n) moves it to its own AY.

		ld		bc,$03fd					; B = 3 channels, C = $FD
		ld		ix,afxChDesc

	afxFrame0:
		push	bc

		ld		a,11
		ld		h,(ix+1)					; address high < 11 means idle
		cp		h
		jr		nc,afxFrame7
		ld		l,(ix+0)

		ld		e,(hl)						; info byte
		inc		hl

		sub		b							; volume register: 11-3=8, 11-2=9,
		ld		d,b							; 11-1=10  ->  R8 / R9 / R10

		ld		b,$ff
		out		(c),a
		ld		b,$bf
		ld		a,e
		and		$0f
		out		(c),a

		bit		5,e							; tone change?
		jr		z,afxFrame1

		ld		a,3							; tone registers: 3-3=0, 3-2=1,
		sub		d							; 3-1=2, doubled -> R0 / R2 / R4
		add		a,a

		ld		b,$ff
		out		(c),a
		ld		b,$bf
		ld		d,(hl)
		inc		hl
		out		(c),d
		ld		b,$ff
		inc		a
		out		(c),a
		ld		b,$bf
		ld		d,(hl)
		inc		hl
		out		(c),d

	afxFrame1:
		bit		6,e							; noise change?
		jr		z,afxFrame3

		ld		a,(hl)
		sub		$20
		jr		c,afxFrame2					; < $20 is a noise value
		ld		h,a							; >= $20 marks the end of the effect
		ld		b,$ff
		ld		b,c
		jr		afxFrame6

	afxFrame2:
		inc		hl
		ld		(afxNseMix+1),a				; keep the noise value

	afxFrame3:
		pop		bc							; B back to the channel number
		push	bc
		inc		b

		ld		a,%01101111					; rotate the tone/noise mask into
	afxFrame4:								; this channel's position
		rrc		e
		rrca
		djnz	afxFrame4
		ld		d,a

		ld		bc,afxNseMix+2				; merge into the shared mixer byte
		ld		a,(bc)
		xor		e
		and		d
		xor		e
		ld		(bc),a

	afxFrame5:
		ld		c,(ix+2)					; advance the frame counter
		ld		b,(ix+3)
		inc		bc

	afxFrame6:
		ld		(ix+2),c
		ld		(ix+3),b
		ld		(ix+0),l					; save the advanced data pointer
		ld		(ix+1),h

	afxFrame7:
		ld		bc,4						; next channel
		add		ix,bc
		pop		bc
		djnz	afxFrame0

		ld		hl,$ffbf					; write the merged noise and mixer
	afxNseMix:
		ld		de,0						; smc: +1 = noise, +2 = mixer
		ld		a,6
		ld		b,h
		out		(c),a
		ld		b,l
		out		(c),e
		inc		a
		ld		b,h
		out		(c),a
		ld		b,l
		out		(c),d

		pop		ix
		exx

	afxrestoreslot:
		nextreg	$51,$0						; smc'd above
		nextreg	$52,$1

		ld		bc,65533					; hand the AY back to the music
		ld		a,255
		out		(c),a
		ret

	ENDP
	end asm
end sub
