'!ORG=32768
' FDoTileBank16 & FL2Text example 
' em00k dec20

#define NEX 		
#include <nextlib.bas>
#include <keys.bas>

border 0 

' LoadSDBank ( filename$ , dest address, size, offset, 8k start bank )
' dest address always is 0 - 16384, this would be an offset into the banks 
' if you do not know the filesize set size to 0. If the file > 8192 the data
' is loaded into the next consecutive bank. Very handy 

LoadSDBank("testsp1.spr",0,0,0,34) ' file is 16kb, so load into banks 34/35
LoadSDBank("testsp2.spr",0,0,0,36) ' banks 36/37
LoadSDBank("testsp3.spr",0,0,0,38) ' banks 38/39
LoadSDBank("[]font1.spr",0,0,0,40) ' load the first font to bank 40 

InitLayer2(MODE320X256)

' FL2Text(0,0,"THIS EXAMPLE SHOWS THE FDOTILE16 COMMAND",40)
' FL2Text(0,1,"THE FOLLOWING IMAGE IS CREATED FROM ",40)
' FL2Text(0,2,"192 16X16 TILES LOADED CONSECUTIVELY IN",40)
' FL2Text(0,3,"RAM WITH LOADSDBANK",40)
' FL2Text(0,4,"PRESS SPACE TO START",40)

' WaitKey()
LoadSDBank("[]nextsid.bin",0,0,0,33)
LoadSDBank("RobocopSID.pt3",0,0,0,42)

asm 
	; NextSID set up! 
	nextsid_init EQU 0x0000E098

	nextsid_set_waveform_A 	EQU 0x0000E07A
	nextsid_set_waveform_B 	EQU 0x0000E081
	nextsid_set_waveform_C 	EQU 0x0000E088
	nextsid_set_detune_A 	EQU 0x0000E056
	nextsid_set_detune_B 	EQU 0x0000E05A
	nextsid_set_detune_C 	EQU 0x0000E05E
	nextsid_wavelen_A 		EQU 0x0000E341
	nextsid_wavelen_B 		EQU 0x0000E36C
	nextsid_wavelen_C 		EQU 0x0000E397
	nextsid_shift_C 		EQU 0x0000E24D
	nextsid_set_shift_C 	EQU 0x0000E076
	nextsid_shift_B 		EQU 0x0000E226
	nextsid_set_shift_B 	EQU 0x0000E072
	nextsid_shift_A 		EQU 0x0000E1FF
	nextsid_set_shift_A 	EQU 0x0000E06E

	nextsid_play 			EQU 0x0000E007
	nextsid_stop 			EQU 0x0000E011
	nextsid_mode 			EQU 0x0000E2D7
	nextsid_pause 			EQU 0x0000E000
	nextsid_reset 			EQU 0x0000E38C
	nextsid_set_pt3 		EQU 0x0000E025

	init 					EQU 0x0000E3F9
	nextsid_set_psg_clock 	EQU 0x0000E04E
	nextsid_vsync 			EQU 0x0000E08F

	nextreg 	$57,33					; put nextsid in place
	irq_vector	equ	65022				;     2 BYTES Interrupt vector
	stack		equ	65021				;   252 BYTES System stack
	vector_table	equ	64512			;   257 BYTES Interrupt vector table	
	startup:	di						; Set stack and interrupts
	ld			sp,stack				; System STACK

	nextreg		TURBO_CONTROL_NR_07,0b0000011	; 28Mhz / 27Mhz

	ld		hl,vector_table	            ; 252 (FCh)
	ld		a,h
	ld		i,a
	im		2

	inc		a		                    ; 253 (FDh)

	ld		b,l		                    ; Build 257 BYTE INT table
	.irq:	
	ld		(hl),a
	inc		hl
	djnz	.irq		            	; B = 0
	ld		(hl),a

	ld		a,$FB		                ; EI
	ld		hl,$4DED	                ; RETI
	ld		(irq_vector-1),a
	ld		(irq_vector),hl

	ld		bc,0xFFFD	                ; Turbosound PSG #1
	ld		a,%11111111
	out		(c),a

	nextreg VIDEO_INTERUPT_CONTROL_NR_22,%00000100
	nextreg VIDEO_INTERUPT_VALUE_NR_23,255
	ld		sp,stack	                ; System STACK
	ei

	; Init the NextSID sound engine, setup the variables and the timers.

	ld		de,0		                ; LINE (0 = use NextSID)
	ld		bc,192		                ; Vsync line
	call	nextsid_init				; Init sound engine

	; Setup a duty cycle and set a PT3.

	call	nextsid_stop				; Stop playback
	
	; channel b 
	ld		hl,test_waveform
	ld		a,16-1						; 16 BYTE waveform
	call	nextsid_set_waveform_B

	ld		hl,16						; Slight detune
	call	nextsid_set_detune_B

	; channel a 
	ld		hl,test_waveform
	ld		a,16-1						; 16 BYTE waveform
	call	nextsid_set_waveform_A

	ld		hl,3						; Slight detune
	call	nextsid_set_detune_A

	nextreg $50,42
	ld		hl,$0000 	            	; Init the PT3 player.
	ld		a,42		            	; Bank8k a 1st 8K
	ld		b,43		            	; Bank8k b 2nd 8K

	call	nextsid_set_pt3
	call	init						; VT1-MFX init as normal

	nextreg $50,$ff
	nextreg $51,$ff
	nextreg $57,33

	call	nextsid_play				; Start playback

end asm 

setpsgclock(1750000)

dim tx,ty,sx,sy, tile  as ubyte 

do 

	tile = 0 
	for ty = 0 to 11 
		for tx = 0 to 15
			FDoTile16(tile,sx+tx,sy+ty,34)
			tile=tile+1 
		next tx 
	next ty 

	if l = 0 	
		sx = 0 : sy = 0 : l=l+1 
	elseif l = 1 
		sx = 4 : sy = 0 : l=l+1 
	elseif l = 2
		sx = 4 : sy = 4 : l=l+1 
	elseif l = 3
		sx = 0 : sy = 4 : l=0 
	endif 

	FL2Text(0,0,"ANY KEY TO REDRAW",40)

	while GetKeyScanCode()=0
		asm 
			call	nextsid_vsync
		end asm 
	wend 

loop 


asm 
test_waveform

; db 128,000,125,000,128,004,128,000
; db 128,003,128,016,112,000,120,000

 db 128,000,128,000,128,000,128,000
 db 128,000,128,000,128,000,128,000
end asm 

sub fastcall setpsgclock(clock as ulong)

	asm  
		ex de,hl
		call nextsid_set_psg_clock
	end asm 

end sub 