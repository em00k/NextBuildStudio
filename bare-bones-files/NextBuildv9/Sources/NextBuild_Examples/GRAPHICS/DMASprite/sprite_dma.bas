'!origin=main-3.bas

'''''''''''''''''''''''''''''''''''''''''''''''''''
' DMA Sprite Routines 
'''''''''''''''''''''''''''''''''''''''''''''''''''

CONST sprBigsprite      as ubyte = %00100000                ' Big Sprite 
CONST sprRelative       as ubyte = %01000000                ' Relative Sprite 
CONST sprXmirror        as ubyte = %1000					' Sprite X Mirror
CONST sprYmirror        as ubyte = %0100                    ' Sprite Y Mirror 
CONST sprRotate         as ubyte = %0010                    ' Sprite rotate 
CONST sprX2 	        as ubyte =%01000                    ' Sprite X * 2 
CONST sprX4 	        as ubyte =%10000                    ' Sprite X * 4 
CONST sprX8 	        as ubyte =%11000                    ' Sprite X * 8 
CONST sprY2 	        as ubyte =%00010                    ' Sprite Y * 2
CONST sprY4 	        as ubyte =%00100                    ' Sprite Y * 4
CONST sprY8 	        as ubyte =%00110                    ' Sprite Y * 8 

' dim attrib3			    as ubyte = 0
' dim attrib4			    as ubyte = bigsprite bor sprY2 ' bor sprX2 

' UpdateSprite(b1_x+32,b1_y+32,16,0,0,0)   
' MetaSprite(1,16,55,54,1)

' sub big_sprite()

'     ' before use we must initiate the sprite definitions, such as what is a big sprite
'     ' and the sprites co-ordinates relative to the base sprite 
'     ' this for example shows big sprite comprised of 2 16x16 sprites, the first has the property
'     ' of bigsprite, its co-ords and sprite id along with intial image, then the second that is
'     ' realtive to the first but 16 pixels below and the sprite id with relative properties. 
'     '             X     Y       ID    Image     Att3    Att4
' 	UpdateSprite( 32,   32,     0,    0,        0,      sprBigsprite )   ' *x*
' 	UpdateSprite( 0,    16,     1,    1,        0,      sprRelative )	

' end sub 

sub MetaSprite(byval msprite as ubyte, byval basessprite as ubyte, byval blockbank as ubyte, byval sprbank as ubyte, byval blksize as ubyte)

    ' Uploads the Sprite data to create a Meta Sprite 

    ' msprite = metasprite to show 
    ' basesprite = sprite id
    ' blockbank = bank containing block data of large sprite 
    ' sprbank = base bank containing sprite image date
    ' blksize = size of total sprite in 16x16 pixel blocks 

	dim offset		as uinteger
	dim	spr_count 	as ubyte = 0
	dim	spr_id  	as ubyte = 0
    dim sy          as ubyte 
	 
	NextRegA(MMU2_4000_NR_52,blockbank)

	offset = $4000+cast(uinteger, msprite) * cast(uinteger,blksize)

	for sy = 0 to blksize-1		
		spr_id		= peek(ubyte, (offset+spr_count))           ' reads sprite block to send 
		AddSprite(basessprite+spr_count, spr_id, sprbank )      ' sends sprite via dma 
		spr_count 	= spr_count + 1
        
	next 
	 
    NextRegA(MMU2_4000_NR_52,$0a)                               ' sets slot 2 back to bank 10 
    'Console(str(blksize))
    'WaitKey()
end sub 

Sub fastcall AddSprite(byVal sprite as ubyte,byval spraddress as ubyte,bank as ubyte)

    ' Uploads a Sprite from bank to a set Sprite ID using the DMA 

	' Total = number of sprites, spraddess memory address, optinal bank parameter to page into slot 0/1 
	' works for both 8 and 4 bit sprites 

	asm  
		PROC
		LOCAL  sp_out
		
		pop 	hl 
		ex 		(sp), hl 
		ld      d, a                                                        ; save Total sprites from a to d 		 
		ld 		l, 0 
		
		exx     
		pop     hl
		exx                                                                 ; save ret address  18 T  3bytes , 36 T with exx : push hl : exx   

		
		ld 		bc, SPRITE_STATUS_SLOT_SELECT_P_303B						; first sprite 
		out 	(c), a

		; let check if a bank was set ? 
		; h still has the sprite offset 
		; 
		
		ld 		a, h 														; get sprite offset into a
		swapnib 															; / 16
		and 	15															; we only want the bottom 4 bits
		srl 	a															; / 2 
		srl 	a															; / 2  a now / 64
		add 	a,a															; double a because of banking
		ld		d, a  														; save a into d 

		pop     af  														; get bank off stack 
		
		add 	a, d                                                        ; bank in a  er 
		nextreg $50,a                                                       ; setting slot 0 to a bank  
		inc     a 
		nextreg $51,a                                                       ; setting slot 1 to a bank + 1 

		ld 		a, h 														; get back sprite offset 
		and 	63															; wrap around 63
		ld 		h, a 														

		call 	DMASprite

		nextreg $50, $FF                                                    ; restore rom 
		nextreg $51, $FF                                                    ; restore rom 

	sp_out:
		exx    
		push    hl 
		exx 
		
		ENDP 

	end asm 

end sub

sub fastcall SetupDma(byval dma_source_address as uinteger, byval dma_length as uinteger)
	asm 
	;
	;------------------------------------------------------------------------------
	; hl = source
	; bc = length
	;------------------------------------------------------------------------------
	TransferDMASprite:

		ld 		(DMASourceS),hl
		pop 	hl 
		ex 		(sp), hl 

		exx 
		pop 	hl 
		exx

		ld 		(DMALengthS),hl
		
		
		ld 		hl,DMACodeS
		ld 		b,DMACode_LenS
		ld 		c,Z80_DMA_PORT_DATAGEAR
		otir
		exx    
		push    hl 
		exx 
		ret

	DMACodeS:
		db 		DMA_DISABLE
		db 		%01111101                   	; R0-Transfer mode, A -> B, write adress 
												; + block length
	DMASourceS:
		dw 		0                        		; R0-Port A, Start address (source address)
	DMALengthS:
		dw 		$100                        	; R0-Block length (length in bytes)
		db 		%01010100                   	; R1-read A time byte, increment, to 
												; memory, bitmask
		db 		%00000010                   	; R1-Cycle length port A
		db 		%01101000                   	; R2-write B time byte, increment, to 
												; memory, bitmask
		db 		%00000010                   	; R2-Cycle length port B
		db 		%10101101                   	; R4-Continuous mode (use this for block
												; transfer), write dest adress
		dw 		SPRITE_PATTERN_P_5B          	; R4-Dest address (destination address)
		db 		%10000010                   	; R5-Restart on end of block, RDY active
												; LOW
		db 		DMA_LOAD                    	; R6-Load
		db 		DMA_ENABLE                  	; R6-Enable DMA

		DMACode_LenS		                   equ $-DMACodeS

	end asm 
end sub 

SUB fastcall DMASprite(byval dma_source_address as uinteger)

    asm 	

    DMASprite: 
        ; sprite select port should already be set 
        ; hl address of sprite data 
        ld 		bc,(%0001_1101<<8)|Z80_DMA_PORT_DATAGEAR			; 7 R0-Transfer mode, A -> B, write adress ; 7 DMAPORT									
        out 	(c),b							                    ; 12 
        out 	(c),l							                    ; 12 start address in hl 
        out 	(c),h							                    ; 12 
        ld 		hl,(DMA_ENABLE<<8)|DMA_LOAD		                    ; 17
        out 	(c),l 							                    ; 12 
        out		(c),h 							                    ; 12 
        ret 									                    ; 10 		87 T 

    end asm 	
end sub 

