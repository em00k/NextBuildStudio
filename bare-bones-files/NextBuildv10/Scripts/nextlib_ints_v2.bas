
' -----------------------------------------------
' Interrupt Routines CTC2 For modules. Fixed Addressed 
' Data table (64 bytes from $fd02)
' -----------------------------------------------

' Memory
' $0000-$1fff	1	0	    FF	
' $2000-$3fff		1	    FF	
' $4000-$5fff	2	2	5	10	ULA - Swap Bank
' $6000-$7fff		3		11	
' $8000-$9fff	3	3	2	4	
' $a000-$bfff		5		5	
' $c000-$dfff	4	4	0	0	
' $e000-$ffff		7		1	NextBuild Module

' when using this module, 

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
	ayfxtoplay			EQU 	$fd58 			; 1 byte for sample to play in FF no sample 
	ayfxbankinplaycode	EQU 	$fd3e
	ctc_sample_toplay	EQU 	$fd3f
	second_mod_address	EQU 	$fd60 			; address of 2nd mod if TS
;	ctc_sample_table	EQU 	$fd60			; sample of samples ot play
    irq_vector	        equ	    $fdfe		    ; 2 BYTES Interrupt vector
    stack		        equ	    $fdfd		    ; 252 BYTES System stack
	vector_table	    equ	    $fc00	        ; 257 BYTES Interrupt vector table	
	CTC0				equ	    $183B      	    ; CTC channel 0 port
	CTC1				equ	    $193B           ; CTC channel 1 port
	CTC2				equ	    $1A3B           ; CTC channel 2 port
	CTC3				equ	    $1B3B	        ; CTC channel 3 port
	CTCBASE             equ     $c0		        ; MSB Base address of buffer 
	CTCSIZE             equ     $02 	        ; MSB buffer length 
	CTCEND              equ     CTCBASE+(CTCSIZE*2)	
end asm