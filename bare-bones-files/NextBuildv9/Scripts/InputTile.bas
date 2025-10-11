' ----------------------------------------------------------------
' This file is released under the MIT License
' 
' Copyleft (k) 2008
' by Jose Rodriguez-Rosa (a.k.a. Boriel) <http://www.boriel.com>
'
' Adjusted for the TileMap for the ZX Spectrum Next - Requires TileMap-Inc.bas
' 
' Removed the requirment on input.bas byt implementing Dean Belfield's 
' keyboard scan routines
' 
' Simple INPUT routine (not as powerful as Sinclair BASIC's), but
' 
' Usage: A$ = InputTile(MaxChars, Input String, X position, Y position)
' ----------------------------------------------------------------
#ifndef __LIBRARY_INPUTTILE__

REM Avoid recursive / multiple inclusion

#define __LIBRARY_INPUTTILE__

REM The input subroutine
REM DOES NOT act like ZX Spectrum INPUT command
REM Uses ZX SPECTRUM ROM

#pragma push(case_insensitive)
#pragma case_insensitive = True


declare function GETKEYPRESSED() as ubyte

dim     ttexty  as ubyte = 31 
dim     in_xpos    as ubyte = 0 
Dim     stxpos  as ubyte = 0 
dim     last_tx$ as string 

FUNCTION InputTile(MaxLen AS UINTEGER, INPUTSTR as STRING, xpos as ubyte, ypos as ubyte) AS STRING
	
    DIM     LastK   AS UBYTE 
	DIM     result$ AS STRING
	DIM     i       as UINTEGER

    dim     p       as ubyte = 0 

    DIM     input_time,input_on as ubyte 
    ttexty = ypos 
    stxpos = xpos 
	
    result$ = ""

    IF INPUTSTR$<>"" 
        result$ = INPUTSTR$
        TextATLine(stxpos,ttexty, result$,6)
        in_xpos = len(result$)
    else
        result$ = ""
        in_xpos = 0 
    ENDIF 

	DO
		PRIVATEInputShowCursorTile()

		DO              
        
            if input_time > 0                       ' process the cursor flash 
                input_time = input_time - 1 
            elseif input_time=0 
                input_on = 1 - input_on 
                input_time = 10 
            endif
          
            if input_on = 0 
                PRIVATEInputShowCursorTile()                
            else 
                PRIVATEInputHideCursorTile()
            endif 
            
            WaitRetrace(1)                          ' wait at least a frame

            LastK = GETKEYPRESSED()

        LOOP UNTIL LastK <> 0

        IF LastK = 127 THEN                              ' backspace 

            PRIVATEInputHideCursorTile()

            IF LEN(result$) THEN                        ' "Del" key code is 12
				IF LEN(result$) = 1 THEN                ' if string only has 1 char, then del will 
					LET result$ = ""                    ' make the string = ""
                    in_xpos = 0                            ' reset the in_xpos to position 0
                    intext$=" "
				ELSE
                    if in_xpos = LEN(result$)              ' is in_xpos is the same length as the string 
                        LET result$ = result$( TO LEN(result$) - 2)	    ' do a delete from the end of the string
                        in_xpos = in_xpos - 1                             ' decrease in_xpos
                    elseif in_xpos > 1                    ' if in_xpos is larger that 1   in_xpos > [-X------]
                        in_xpos = in_xpos - 1                 ' decrease in_xpos 
                        result$ = result$( TO (in_xpos-1)) + result$(in_xpos+1 TO ) 	
                        fsplt$=result$( TO (in_xpos+1)) 	
                        bsplt$=result$(in_xpos+1 TO )
                        p = 1
                    elseif in_xpos = 1  
                        in_xpos = in_xpos - 1
                        result$ = result$(in_xpos+1 TO )
                        p = 1
                    endif
                    intext$=result$+" "
				END IF
                TextATLine(stxpos,ttexty,intext$,6)  
			END IF
            'beep .001,12
            'PlaySFX(0)
		ELSEIF LastK >= CODE(" ") AND LEN(result$) < MaxLen THEN
            
            if in_xpos = LEN(result$)
                result$ = result$ + CHR$(LastK)
                TextATLine(stxpos,ttexty, result$,6)
                in_xpos = in_xpos + 1 
            elseif in_xpos>0
                result$ = result$( TO (in_xpos-1)) + CHR$(LastK) + result$(in_xpos TO ) 	
                fsplt$=result$( TO (in_xpos)) 	
                bsplt$=result$(in_xpos+1 TO ) 	
                intext$=fsplt$ + "_" + bsplt$
                TextATLine(stxpos,ttexty, intext$,6)
                in_xpos = in_xpos + 1 
            else 
                result$ = CHR$(LastK) +result$
                intext$="_" + result$
                TextATLine(stxpos,ttexty,intext$,6)
                p = 1
            endif 
            'TextATLine(8,ttexty,intext$,6)
            'beep .001,12
            'PlaySFX(0)
        ELSEIF LastK = 8               ' cursor left 

            if in_xpos > 0 : in_xpos = in_xpos - 1 : endif 
            p = 1 

        ELSEIF LastK = 9 AND in_xpos < LEN(result$)                 ' cursor right

            if in_xpos < len(result$) : in_xpos = in_xpos + 1 : endif 
            p =  1
        ELSEIF LastK = 11                                           ' cursor down 
            result$ = last_tx$
            in_xpos = len result$
            TextATLine(stxpos,ttexty, result$,6) 
            
            ' p = 1 
        ELSEIF LastK = 10                                           ' cursor down 
            result$ = ""
            in_xpos = len result$
            TextATLine(stxpos,ttexty, result$,6) 

            ' p = 1 
		END IF

        if p = 1 
            if in_xpos > 0 
                fsplt$=result$( TO (in_xpos - 1 )) 	
                bsplt$=result$(in_xpos TO ) 	
                result$ = fsplt$ + bsplt$	    
            endif 

            if in_xpos = LEN(result$) 

            elseif in_xpos >0 
                intext$=fsplt$ + "_" + bsplt$
            else
                intext$="_"+result$                
            endif
            TextATLine(stxpos,ttexty, intext$,6) 
            p = 0
            'beep .001,12
            'PlaySFX(0)
        endif 

	LOOP UNTIL LastK = 13 : REM "Enter" key code is 13
    
    'PlaySFX(0)

    'beep .001,12

    last_tx$ = result$
	
	RETURN result$

END FUNCTION

#pragma pop(case_insensitive)

' Routine adapted from Dean Belfield's keyboard scanning routines.
' returns keypressed if any 

function fastcall GETKEYPRESSED() as ubyte 

    asm 
        push    namespace   GETKEYPRESSED 

    Read_Keyboard:		
        CALL	Keyscan			; Scan the keyboard
         
        LD	    HL, (KEY_SCAN)		; Are we stil pressing the same key combo
        XOR	    A 
        SBC	    HL, DE 	
        LD	    A, (KEY_DELAY)		; Initial key repeat value
        JR	    NZ, AA			; No, so move onto next check
        LD	    A,(KEY_COUNT)		; Simple key repeat
        DEC	    A 
        LD	    (KEY_COUNT), A
        LD	    A,(KEY_REPEAT)		; Subsequent key repeat value
        JR	    Z, AA
        XOR	    A 
        RET

AA:		
        LD	    (KEY_COUNT), A
        LD	    (KEY_SCAN), DE 		; Store the new keyscan
        LD	    A, E			; Get the keycode
        INC	    A			    ; Check for 0xFF
        RET	    Z			    ; Then no key has been pressed
        DEC	    A
        LD	    HL, KeyTable_Main	; Lookup the key value
        ADD     HL, A

        LD      A, (HL)			; Fetch the key value

        CP      'A'			    ; Is it a letter?
        JR	    C, CC			; No, so skip

        BIT	    1, D 			; Has symbol shift been pressed?
        JR	    NZ, BB			; Yes, so get the shifted value
        LD	    E, A			; Store the keycode
        LD	    A, (FLAGS)		; Get caps lock flag
        AND	    %00100000
        XOR	    E   
        BIT	    0, D			; Has caps shift been pressed
        RET	    Z			    ; No, so just return the letter
        XOR	    %00100000		; Switch case
        RET
;
; It's a symbol shifted letter at this point
;
BB:			
        SUB	    'A'
        LD	    HL, KeyTable_SS_Alpha	; Get the key value
        ADD	    HL, A 
        LD	    A, (HL)			; Get the character code
        RET
;
; It's not a letter at this point, but could be space or enter
;
CC:		BIT	    0, D 			; Check for caps
        JR	    NZ, DD			; If pressed, we'll check for special cases
        BIT	    1, D			; Has symbol shift been pressed
        RET	    Z			    ; No, so just return the number
        SUB	    '0'			    ; Index from ASCII '0'
        LD	    HL, KeyTable_SS_Numeric
        ADD	    HL, A
        LD	    A, (HL)
        RET
;
; Special cases, like escape, etc. Caps shift is pressed here
;
DD:		CP	    ' '             ; Caps Shift + Space
        JR	    NZ, EE 
        LD	    A, 0x1B			; Return ESC
        RET 
EE:		CP	    '0'             ; Caps Shift + 0
        JR	    NZ, FF
        LD	    A, 0x7F			; Return DEL
        RET 
FF:		CP	    '5'             ; Caps Shift + 5
        JR	    NZ, GG
        LD	    A, 0x08			; Return BS
        RET
GG:		CP	    '8'             ; Caps Shift + 8
        JR	    NZ, HH
        LD	    A, 0x09			; Return HT
        RET 
HH:		CP	    '6'		        ; Caps Shift + 6
        ; JR	    NZ, JJ
        ; LD	    A, 0x0A			; Return LF
        ld      a, 32 
        RET 
JJ:		CP	    '7'		        ; Caps Shift + 7
        JR	    NZ, KK
        LD	    A, 0x0B			; Return VT
        RET 
KK:		CP	    '2'			; Caps Shift + 2
        LD	    B, %00100000
        JR	    Z, Toggle_Flags
        CP	    '1'
        LD	    B, %00010000
        RET	    NZ
Toggle_Flags:	
        LD	    A, (FLAGS)		; Toggle Caps Lock bit in flags
        XOR	    B
        LD	    (FLAGS), A
        XOR	    A			; Clear the keycode
        RET

Keyscan:		
        LD	    L,  0x2F		; The initial key value for each line
        LD	    DE, 0xFFFF		; Initialise DE to no-key
        LD	    BC, 0xFEFE		; C = port address, B = counter
AAA:    IN	    A, (C)			; Read bits from keyboard port
        CPL 
        AND	    $1F
        JR	    z, Keyscan_Done
        LD	    H,A 			; Key bits go to the H register
        LD	    A,L 			; Fetch initial key value
Keyscan_Multiple:	
        INC	    D			; If three keys pressed, D will no longer contain FF
        RET	    NZ			; So return at that point
BBB:	SUB	    8			; Loop until we find a key
        SRL	    H 
        JR	    NC, BBB
        LD	    D, E			; Copy any earlier key found to D
        LD	    E, A			; And store the new key value in E
        JR	    NZ, Keyscan_Multiple	; Loop if there are more keys
Keyscan_Done:		
        DEC	    L			; Line has been scanned, so reduce initial key value for next pass
        RLC	    B 			; Shift the counter
        JR	    C, AAA			; And loop if there are still lines to be scanned
        INC	    D			; If D = 0xFF, then single key pressed
        RET	    Z
        DEC	    D
        LD	    A, E			; Symbol shift could be in E as code 0x18
        CP	    0x18			
        JR 	    NZ, CCC
        LD	    E, D			; If it is, fetch the keycode from D
        LD	    D, 0x18			; And set D to symbol shift code
CCC:	LD	    A, D			; Get shift key value in D
        LD	    D, 0			; Reset shift flags
        CP	    0x27			; Check for caps shift
        JR	    NZ, DDD			; Skip if not pressed
        SET	    0, D 			; Set caps shift flag
DDD:		
        CP	    0x18			; Check for symbol shift
        RET	    NZ              ; Skip if not pressed
        SET	    1, D 			; Set symbol shift flag
        RET 

KeyTable_Main:		
        DB	"B", "H", "Y", "6", "5", "T", "G", "V"
        DB	"N", "J", "U", "7", "4", "R", "F", "C"
        DB	"M", "K", "I", "8", "3", "E", "D", "X"
        DB	$00, "L", "O", "9", "2", "W", "S", "Z"
        DB	$20, $0D, "P", "0", "1", "Q", "A", $00

KeyTable_SS_Numeric:	
        DB 	"_", "!", 34, "#", "$", "%", "&", "'", "(", ")"
KeyTable_SS_Alpha:	
        DB	"~", "*", "?", $5C 
        DB	$00, "{", "}", "^"
        DB	$00, "-", "+", "="
        DB	".", ",", ";", "'"; $22
        DB	"@", "<", "|", ">"  ; Q W E R
        DB	"]", "/", $00, $60
        DB	"[", ":"
FLAGS:			db	%00100000		; Flags: B7=ESC PRESSED, B6=ESC DISABLED, B5=CAPS LOCK, B4=COPY PRESSED, B3=SHOW CURSOR
KEY_SCAN:		DEFS	2		; Results of last keyscan
KEY_COUNT:		DEFS	1		; Key repeat counter
KEY_CODE:		DEFS	1		; Keycode updated by keyscan
KEY_DELAY:		db      20,1		; Initial key delay
KEY_REPEAT:		db      10		; Key repeat

        pop     namespace

    end asm 

end function 

' ------------------------------------------------------------------
' Function 'PRIVATE' to this module.
' Shows a flashing cursor
' ------------------------------------------------------------------
SUB PRIVATEInputShowCursorTile
	REM Print a Flashing cursor at current print position
    intext$=chr 24
    TextATLine(stxpos+in_xpos,ttexty,intext$,6)             ' 6 is the palette colour 
END SUB


' ------------------------------------------------------------------
' Function 'PRIVATE' to this module.
' Hides the flashing cursor
' ------------------------------------------------------------------
SUB  PRIVATEInputHideCursorTile
	REM Print a Flashing cursor at current print position
	intext$=" "
    TextATLine(stxpos+in_xpos,ttexty,intext$,6)
END SUB

#endif

