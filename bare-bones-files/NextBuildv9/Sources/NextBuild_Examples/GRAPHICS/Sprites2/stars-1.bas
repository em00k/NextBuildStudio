'!org=32768 
' Extravangent Sprite Movement 
' NextBuild Studio 
' emook2018 - use keys 1 and 2 to mess with the sine wav (dirty!)

#include <nextlib.bas>

paper 0: border 0 : bright 0: ink 7 : cls 

dim mx,my,yy,xx,count,f,starx,stary,starsp,stars as ubyte 
dim offset,frame as ubyte 

dim     pcounter        as ubyte 
dim     pcounter2       as ubyte 
dim     position        as ubyte 
dim     sx              as ubyte 
dim     sy              as ubyte 
dim     dg              as ubyte  = 128
dim     dh              as ubyte  = 64
dim     delay           as ubyte 
dim     delay2           as ubyte 
dim     dhdelay         as ubyte  = 8
dim 	s 				as ubyte 
' Setup some 

'Initalize the sprite to sprite ram

InitSpritesCustom()

InitLayer2(MODE256X192)

ShowSprites(1)  	

dg = 32

' lets do a loop and move some stuff around 

print "press keys 1-2 to affect"

do

	draw_sprites()   

	WaitRaster(192)

	if inkey="2"
		dh = dh + 1 
		print at 2,0;"dh:";dh;"  "
		
	endif 
	if inkey="1"
		dg = dg + 1 
		print at 1,0;"dg:";dg;"  "
	endif 


loop

sub draw_sprites()              ' rotates and moves sprites

    dim x       as ubyte 
    dim dx      as ubyte 
    dim dy      as ubyte 
    dim max     as ubyte 

    pcounter    = 0 
    pcounter2   = 0
    max    		= 16

    for x = 0 to max-1

        sx=peek(@sinetable+(position + pcounter) )                    ' adds rotation around middle base 
        sy=peek(@sinetable+(position + 64 + pcounter) )

        dx=peek(@sinetable2+((x  +  pcounter2)))*4                   ' adds rotation around middle base 
        dy=peek(@sinetable2+((x  + 64 + pcounter2) ))*4

        pcounter = pcounter + dg 
        pcounter2 = dh + pcounter2+6 

        if delay = 0             
            position = (position + 1) 
            delay = 16 
        else 
            delay = delay -1 
        endif         

        if delay2 = 0             
            delay2 = 64
			dg = dg + 1         
        else 
            delay2 = delay2 -1 
        endif 

        s = s + 1
        
		if s > 3 : s = 0 : endif 								' we only have 3 sprite images 

        UpdateSprite(cast(uinteger,150+sx-dx),128+sy-dy,x,s,0,0 )

        
    next 
    
end sub 

starbuff:
asm
	defs 35*4,0
end asm 

sinetable:
	asm
db 16,15,15,14,14,14,13,13,12,12,12,11,11,10,10,10
db 9,9,9,8,8,8,7,7,7,6,6,6,5,5,5,4
db 4,4,4,3,3,3,3,2,2,2,2,2,1,1,1,1
db 1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0
db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
db 1,1,1,1,1,2,2,2,2,2,3,3,3,3,4,4
db 4,5,5,5,5,6,6,6,7,7,7,8,8,8,9,9
db 10,10,10,11,11,11,12,12,13,13,13,14,14,15,15,15
db 16,16,16,17,17,18,18,18,19,19,20,20,20,21,21,21
db 22,22,23,23,23,24,24,24,25,25,25,26,26,26,26,27
db 27,27,28,28,28,28,29,29,29,29,29,30,30,30,30,30
db 30,31,31,31,31,31,31,31,31,31,31,31,31,31,31,31
db 31,31,31,31,31,31,31,31,31,31,31,31,31,31,30,30
db 30,30,30,30,29,29,29,29,29,28,28,28,28,27,27,27
db 27,26,26,26,25,25,25,24,24,24,23,23,23,22,22,22
db 21,21,21,20,20,19,19,19,18,18,17,17,17,16,16,16


	end asm
	
sinetable2:
	asm
		db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
db 0,0,0,0,0,1,1,1,1,1,1,1,1,1,2,2
db 2,2,2,2,2,3,3,3,3,3,3,4,4,4,4,4
db 4,5,5,5,5,5,6,6,6,6,6,7,7,7,7,7
db 8,8,8,8,8,9,9,9,9,9,9,10,10,10,10,10
db 11,11,11,11,11,11,12,12,12,12,12,12,13,13,13,13
db 13,13,13,14,14,14,14,14,14,14,14,15,15,15,15,15
db 15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15
db 15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15
db 15,15,15,15,15,14,14,14,14,14,14,14,14,13,13,13
db 13,13,13,13,12,12,12,12,12,12,12,11,11,11,11,11
db 10,10,10,10,10,9,9,9,9,9,9,8,8,8,8,8
db 7,7,7,7,7,6,6,6,6,6,5,5,5,5,5,4
db 4,4,4,4,4,3,3,3,3,3,3,2,2,2,2,2
db 2,2,1,1,1,1,1,1,1,1,1,0,0,0,0,0
db 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0

	end asm

Sub InitSpritesCustom()
		' REM Mac ball sprite 16x16px * 16 frames
	ASM 

		;Select slot #0
		ld a, 0
		ld bc, $303b
		out (c), a

		ld b,16								; we set up a loop for 16 sprites 		
		ld hl,Ball1				  			; point to Ball1 data
sploop:
		push bc
		ld bc,$005b					
		otir
		pop bc 
		djnz sploop
		jp sprexit

	Ball1:
	db  $E3, $E3, $E3, $E3, $E3, $E3, $E3, $25, $25, $E3, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $25, $9D, $BD, $25, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $25, $9D, $BD, $25, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $25, $7D, $9D, $BD, $DD, $25, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $25, $25, $25, $25, $25, $7D, $7D, $BD, $DD, $25, $25, $25, $25, $25, $E3;
	db  $25, $7A, $7A, $7A, $7A, $7A, $7D, $7D, $BD, $FD, $F9, $F5, $F5, $F1, $F1, $25;
	db  $25, $7A, $7A, $7A, $7A, $7A, $25, $7D, $BD, $25, $F5, $F1, $F1, $ED, $ED, $25;
	db  $E3, $25, $7A, $7A, $7A, $7A, $00, $7A, $ED, $25, $ED, $ED, $ED, $ED, $25, $E3;
	db  $E3, $E3, $25, $76, $77, $77, $77, $6F, $8F, $CE, $CE, $EE, $ED, $25, $E3, $E3;
	db  $E3, $E3, $E3, $25, $77, $73, $25, $6F, $8F, $00, $CE, $CE, $25, $E3, $E3, $E3;
	db  $E3, $E3, $25, $73, $73, $6F, $6F, $25, $00, $AF, $CE, $CE, $CE, $25, $E3, $E3;
	db  $E3, $E3, $25, $73, $6F, $6F, $6F, $6F, $8F, $AF, $AE, $CE, $CE, $25, $E3, $E3;
	db  $E3, $25, $73, $6F, $6F, $6F, $6F, $25, $25, $AF, $AF, $AE, $CE, $CE, $25, $E3;
	db  $E3, $25, $6F, $6F, $6F, $25, $25, $E3, $E3, $25, $25, $AE, $CE, $CE, $25, $E3;
	db  $E3, $E3, $25, $25, $25, $E3, $E3, $E3, $E3, $E3, $E3, $25, $25, $25, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3;



Ball2:
	db  $E3, $E3, $E3, $E3, $E3, $E3, $E3, $25, $25, $E3, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $25, $ED, $ED, $25, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $25, $ED, $ED, $25, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $25, $F5, $F1, $ED, $ED, $25, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $25, $25, $25, $25, $25, $F5, $F1, $ED, $ED, $25, $25, $25, $25, $25, $E3;
	db  $25, $DD, $DD, $DD, $FD, $FD, $F9, $F5, $ED, $CE, $CE, $CE, $AE, $AF, $AF, $25;
	db  $25, $BD, $DD, $DD, $DD, $DD, $25, $F9, $ED, $25, $AE, $AF, $AF, $AF, $AF, $25;
	db  $E3, $25, $BD, $BD, $BD, $BD, $25, $BD, $8F, $25, $8F, $8F, $8F, $8F, $25, $E3;
	db  $E3, $E3, $25, $9D, $9D, $7D, $7D, $7D, $7A, $6F, $6F, $6F, $6F, $25, $E3, $E3;
	db  $E3, $E3, $E3, $25, $7D, $7D, $00, $7A, $7A, $00, $6F, $6F, $25, $E3, $E3, $E3;
	db  $E3, $E3, $25, $7D, $7D, $7D, $7A, $00, $00, $77, $73, $6F, $6F, $25, $E3, $E3;
	db  $E3, $E3, $25, $7D, $7D, $7A, $7A, $7A, $7A, $77, $77, $73, $6F, $25, $E3, $E3;
	db  $E3, $25, $7D, $7D, $7A, $7A, $7A, $25, $25, $77, $77, $73, $73, $6F, $25, $E3;
	db  $E3, $25, $7D, $7A, $7A, $25, $25, $E3, $E3, $25, $25, $77, $73, $73, $25, $E3;
	db  $E3, $E3, $25, $25, $25, $E3, $E3, $E3, $E3, $E3, $E3, $25, $25, $25, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3;



Ball3:
	db  $E3, $E3, $E3, $E3, $E3, $E3, $E3, $25, $25, $E3, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $25, $AF, $8F, $25, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $25, $AF, $8F, $25, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $25, $AE, $AF, $8F, $6F, $25, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $25, $25, $25, $25, $25, $CE, $AF, $8F, $6F, $25, $25, $25, $25, $25, $E3;
	db  $25, $ED, $EE, $EE, $CE, $CE, $CE, $AE, $8F, $6F, $6F, $73, $77, $77, $77, $25;
	db  $25, $ED, $ED, $ED, $ED, $EE, $00, $CE, $8F, $25, $77, $77, $77, $76, $76, $25;
	db  $E3, $25, $ED, $ED, $ED, $ED, $25, $ED, $7A, $25, $7A, $7A, $7A, $7A, $25, $E3;
	db  $E3, $E3, $25, $ED, $F1, $F1, $F5, $F9, $BD, $7D, $7A, $7A, $7A, $25, $E3, $E3;
	db  $E3, $E3, $E3, $25, $F5, $F5, $25, $FD, $BD, $25, $7D, $7A, $25, $E3, $E3, $E3;
	db  $E3, $E3, $25, $F5, $F9, $F9, $FD, $25, $25, $7D, $7D, $7D, $7E, $25, $E3, $E3;
	db  $E3, $E3, $25, $F9, $F9, $FD, $FD, $DD, $BD, $9D, $7D, $7D, $7D, $25, $E3, $E3;
	db  $E3, $25, $F9, $F9, $FD, $FD, $DD, $25, $25, $9D, $7D, $7D, $7D, $7D, $25, $E3;
	db  $E3, $25, $F9, $FD, $FD, $25, $25, $E3, $E3, $25, $25, $7D, $7D, $7D, $25, $E3;
	db  $E3, $E3, $25, $25, $25, $E3, $E3, $E3, $E3, $E3, $E3, $25, $25, $25, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3;



Ball4:
	db  $E3, $E3, $E3, $E3, $E3, $E3, $E3, $25, $25, $E3, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $25, $76, $7A, $25, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $25, $76, $7A, $25, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $25, $77, $77, $7A, $7A, $25, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $25, $25, $25, $25, $25, $73, $77, $7A, $7A, $25, $25, $25, $25, $25, $E3;
	db  $25, $6F, $6F, $6F, $6F, $6F, $6F, $77, $7A, $7A, $7D, $7D, $7D, $7D, $7D, $25;
	db  $25, $8F, $6F, $6F, $6F, $6F, $25, $6F, $7A, $00, $7D, $7D, $9D, $9D, $9D, $25;
	db  $E3, $25, $8F, $8F, $8F, $8F, $00, $8F, $BD, $25, $BD, $BD, $BD, $BD, $25, $E3;
	db  $E3, $E3, $25, $AF, $AF, $AF, $AE, $CE, $ED, $F9, $FD, $DD, $DD, $25, $E3, $E3;
	db  $E3, $E3, $E3, $25, $AE, $CE, $00, $CE, $ED, $25, $F9, $FD, $25, $E3, $E3, $E3;
	db  $E3, $E3, $25, $AE, $CE, $CE, $CE, $00, $25, $F1, $F5, $F9, $FD, $25, $E3, $E3;
	db  $E3, $E3, $25, $CE, $CE, $CE, $CE, $ED, $ED, $F1, $F5, $F9, $F9, $25, $E3, $E3;
	db  $E3, $25, $CE, $CE, $CE, $CE, $EE, $25, $25, $F1, $F1, $F5, $F9, $F9, $25, $E3;
	db  $E3, $25, $CE, $CE, $CE, $25, $25, $E3, $E3, $25, $25, $F5, $F9, $F9, $25, $E3;
	db  $E3, $E3, $25, $25, $25, $E3, $E3, $E3, $E3, $E3, $E3, $25, $25, $25, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3, $E3;

			
	sprexit:

		
	end asm 
		
end sub

