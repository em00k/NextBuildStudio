' - Global Includes 
' Must be included in all modules and master source files. 

' - Defines --------------------------------------------------------------------
' extend this to add aditional modules. 
#define ModuleSample1 1
#define ModuleSample2 2
#define ModuleSample3 3
#define ModuleSample4 4

' VarAddress located at $4000 (look for ".__LABEL__VarStartAddress" in sample.map)
#define VarAddress $4000

' - Module manager vars --------------------------------------------------------
DIM VarLoadModule AS Ubyte AT VarAddress								' Module to load
dim VarLoadModuleParameter1 as Ubyte AT VarAddress + 1	' Parameter 1 for the module to load
DIM VarLoadModuleParameter2 AS Ubyte AT VarAddress + 2	' Parameter 2 for the module to load


' - Game vars ------------------------------------------------------------------
DIM VarLifes AS UBYTE AT VarAddress + 3
DIM VarPoints AS UINTEGER AT VarAddress + 4		' Two bytes
DIM VarPosX AS UBYTE AT VarAddress + 6
Dim VarPosY AS UBYTE AT VarAddress + 7
DIM VarBytesArray(100) AS UBYTE AT VarAddress + 8	' 100 bytes
DIM VarLevel AS UBYTE AT VarAddress + 108

DIM common$ as string = "0"

' - End vars -------------------------------------------------------------------
#define VarsLength 109	' Sets the last address to save

' - Common var tools -----------------------------------------------------------

' Set the Next module to load
sub SetLoadModule(byval idModule as ubyte, byval par1 as ubyte, byval par2 as ubyte)
	VarLoadModule=idModule
	VarLoadModuleParameter1=par1
	VarLoadModuleParameter2=par2
end sub


' Save vars to disk
Sub SaveConfig()
	SaveSD("Game.cfg",VarAddress,VarsLength)
END sub


' Load vars from disk
SUB LoadConfig()
	LoadSD("Game.cfg",VarAddress,VarsLength,0)
END SUB


' - Non ROM keyboard routine 

function fastcall GetKey2() as ubyte 
	asm 
	; used for inkeys replacement 
	; doesnt require ROM 
	; from L BREAK INTO PROGRAM 
	PROC 
	LOCAL Read_Keyboard, Read_Keyboard_0, Read_Keyboard_1, Read_Keyboard_2, Keyboard_Map

	Read_Keyboard:          
		LD 		HL,Keyboard_Map              		; Point HL at the keyboard list
		LD 		D,8                                 ; This is the number of ports (rows) to check
		LD 		C,$FE                            	; C is always FEh for reading keyboard ports
	Read_Keyboard_0:        
		LD 		B,(HL)                              ; Get the keyboard port address from table
		INC 	HL                                  ; Increment to list of keys
		IN 		A,(C)                               ; Read the row of keys in
		AND 	$1F                                 ; We are only interested in the first five bits
		LD 		E,5                                 ; This is the number of keys in the row
	Read_Keyboard_1:        
		SRL 	A                                   ; Shift A right; bit 0 sets carry bit
		JR 		NC,Read_Keyboard_2   				; If the bit is 0, we've found our key
		INC 	HL                                  ; Go to next table address
		DEC 	E                                   ; Decrement key loop counter
		JR 		NZ,Read_Keyboard_1   				; Loop around until this row finished
		DEC 	D                                   ; Decrement row loop counter
		JR 		NZ,Read_Keyboard_0   				; Loop around until we are done
		AND 	A                                   ; Clear A (no key found)
		RET
	Read_Keyboard_2:        
		 
		LD 		A,(HL)                              ; We've found a key at this point; fetch the character code!
		
		RET

	Keyboard_Map:           
		DB 		$FE,"#","Z","X","C","V"
		DB 		$FD,"A","S","D","F","G"
		DB 		$FB,"Q","W","E","R","T"
		DB 		$F7,"1","2","3","4","5"
		DB 		$EF,"0","9","8","7","6"
		DB 		$DF,"P","O","I","U","Y"
		DB 		$BF,"#","L","K","J","H"
		DB 		$7F," ","#","M","N","B"
	ENDP 

	end asm 

end function 


' get key number value
function GetKey(max as ubyte) as ubyte 
	dim a 	as ubyte 
	' Wait to release key
	do 		
		while GetKey2()<>0
			a = 0 
		wend
		while a=0
			a = GetKey2() band %00001111
		wend
		' Wait to press key

		' return numeric value of pressed key
		if a>0 and a<=max
			return a 
		endif 
	loop 
end function


function fastcall NStr(ins as ubyte) as string 

	asm 
	; alternate non-rom version of str(ubyte)
	; converts 8 bit decimal into ascii text 000 format 
	; then assigns to common$ and is returned 
	; 
	PROC 
	LOCAL Na1, Na2, skpinc, nst_finished

		ld 		hl,.LABEL._filename			; our fave location
		ld		d, 0 
		push 	hl 							; save start of string
		call 	CharToAsc					; do conversion 
		ld 		(hl), d						; ensure we zero terminate
		pop 	hl 							; jump back start of string

		ld		a,  3						; add length 
		ld 		(hl), a 
		inc 	hl 
		ld 		(hl), d
		dec 	hl  

		ld		de, _common					; point to string we want to set
		ex 		de, hl 						; swap hl & de - hl = string, de = source 
		call    .core.__STORE_STR 			; do call as we need to return to complete
		jp 		nst_finished				; the common$ assignment 

	CharToAsc:		

		; hl still pointing to pointer of memory 
		ld 		hl,.LABEL._filename+2			
		ld		c, -100
		call	Na1
		ld		c, -10
		call	Na1
		ld		c, -1

	Na1:

		ld		b, '0'-1

	Na2:

		inc		b
		add		a, c
		jr		c, Na2
		sub		c					; works as add 100/10/1
		push 	af					; safer than ld c,a
		ld		a, b				; char is in b

		ld 		(hl), a				; save char in memory 
		inc 	hl 					; move along one byte 

	skpinc:

		pop 	af					

		ret

	#include once <storestr.asm>

	nst_finished: 

	ENDP 

	end asm 

	return common$

end function 

sub fastcall PeekMemLen(address as uinteger,length as uinteger,byref outstring as string)
    ' assign a string from a memory block with a set length 
    asm 

        ex      de, hl 
        pop     hl 
        pop     bc
        ex      (sp),hl         
        ;' de string ram 
        ;' hl source data 
        ;' now copy to string temp
        
        push    hl 
        ex      de, hl 
        ld      (stringtemp),bc 
        ld      de,stringtemp+2
        ldir 

        pop     hl 
        ld      de,stringtemp
        ; de = string data 
        ; hl = string 
        jp      .core.__STORE_STR

    end asm 

end sub 

sub fastcall PeekString2(address as uinteger,byref outstring as string)
    asm  
		; peeks a formatted string from address => string 
		; format : 2 bytes for size, string eg : 03 00 D A V E 
        ex      de, hl 
        pop     hl 
        ex      (sp), hl
        jp      .core.__STORE_STR 
    end asm 
end sub

