'!ORG=32768
' quick example for parallax scrolling using the copper 
' emk20

border 0 	

#define CUSTOMISR					' needed so we can run an interrupt routine 
#define IM2							' turn on interrupt mode 2 
#define NOAYFX						' we DO NOT want any of the AYFX / Music 
#include <nextlib.bas>			
#include <nextlib_ints.bas>			' interrupt include file for NON CTC ints

dim a,b as ubyte 
dim add as uinteger 

InitLayer2(MODE256X192)    			' Set up Layer2 
paper 0 : ink 7 : flash 0 : border 0 : cls 

ShowLayer2(1)						' Show layer 2
LoadBMP("para.bmp")					' Load a BMP

a = 0
b = 0

SetUpIM()                           ' Call the interrupt setup, which will call MyCustomISR()
ISR()                               ' Call the ISR once 

SetCopper()								' ini copper 

do 
	WaitRetrace(1000)

loop 

sub MyCustomISR()
	' interrupt routine will run every frame 
    b=16							
    add=@firstindex+1						' point to the bit in the copper data we want to adjust 
    for l = 0 to 10
        poke (add),a*(12-l>>1)				' this sets the scroll offset 
        poke (add+2),(b+(l<<3))				' for this particular line 
        add=add+4
    next l 
    b=9
    for l = 11 to 22						' then for the bottom 
        poke (add),a*(251+(l>>1))			' scroll offset 
        poke (add+2),(b+(l<<3))				' on line 
        add=add+4							' size of the copper data blobs 
    next l 
    SetCopper()								' rerun the copper 
    a=a+1  									' general x offset 
end sub

sub SetCopper()

' WAIT	 %1hhhhhhv %vvvvvvvv	Wait for raster line v (0-311) and horizontal position h*8 (h is 0-55)
' MOVE	 %0rrrrrrr %vvvvvvvv	Write value v to Next register r
' https://wiki.specnext.dev/Copper

	NextReg($61,0)	' set index 0
	NextReg($62,0)	' set index 0

	asm 
		
		ld hl,copperdata					; ' coppper data address 
		ld b,endcopperdata-copperdata 		;' length of data to upload

	copperupload:
		ld a,(hl)							; put first byte of copper buffer in to a 
		dw $92ED							; nextreg a, sends a to 
	rval:	
		DB $60								; this register, $60 = copper data 
		inc hl								; and loop 
		djnz copperupload

	end asm							
		
	NextReg($62,%11000000)

end sub 
 
asm: 	
copperdata:
	; ' T+V h  v  r  pal val 
	; ' h = horizontal line, v vertical , r = reg , pal = 
	;%1hhhhhhv 
	
	; WAIT 0,0 
	index equ 0
	regcop equ LAYER2_XOFFSET_NR_16
	
	db %10000000,0						; 1HHHHHHV VVVVVVVV
	db 0,0
	
	db %11001000,0

end asm 
firstindex: 
asm 
	; copper list 
	db regcop,129
	db %11001000,16
	db regcop,65
	db %11001000,32
	db regcop,33
	db %11001000,48
	db regcop,1
	db %11001000,64
	db regcop,1
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,140
	db regcop,0
	db %11001000,254
	db regcop,161
	db $ff,$ff

endcopperdata:	
end asm 

