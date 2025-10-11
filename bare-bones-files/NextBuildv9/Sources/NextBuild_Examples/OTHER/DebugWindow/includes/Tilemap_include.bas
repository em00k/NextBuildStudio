'!origin=Next_UART_FB_V12.bas
#include once <nextlib.bas>

sub InitTilemap()
    ' initialises the hw tilemap 
    ' gfx data $4000 mapdata $4400
    asm 
         
        TILE_GFXBASE 		equ 	$40 
        TILE_MAPBASE 		equ 	$44

        nextreg CLIP_TILEMAP_NR_1B,0                        ; Tilemap clipping 
        nextreg CLIP_TILEMAP_NR_1B,159
        nextreg CLIP_TILEMAP_NR_1B,0
        nextreg CLIP_TILEMAP_NR_1B,255
        
        nextreg SPRITE_CONTROL_NR_15,%00000011  ; %000    S L U, %11 sprites on over border

        NextReg TILEMAP_DEFAULT_ATTR_NR_6C,%00000000        ; tilemap on & on top of ULA,  80x32 
        NextReg TILEMAP_CONTROL_NR_6B,%11001001				; tilemap on & on top of ULA,  80x32 
        NextReg TILEMAP_BASE_ADR_NR_6E,$44				    ; tilemap data $6000
        NextReg TILEMAP_GFX_ADR_NR_6F,$40				    ; tilemap blocks 4 bit tiles $4000
        NextReg PALETTE_CONTROL_NR_43,%00110000
        
    end asm 

    NextReg($50,30)													' page bank 20 to $e000, slot 7 
    PalUpload($400,0,0)											    ' upload the palette 
    CopyToBanks(30,10,1,1024)										' copy bank 20 > 2 with 1 bank of length 1024 bytes 
    NextReg($50,$ff)
    ClearTilemap() 

end sub 

sub RollIn()
    dim y as ubyte

    for y = 0 to 127 step 2
        NextReg(CLIP_TILEMAP_NR_1B,0)
        
        NextReg(CLIP_TILEMAP_NR_1B,255)
        NextRegA(CLIP_TILEMAP_NR_1B,127-y)
        NextRegA(CLIP_TILEMAP_NR_1B,127+y)
        
        
        NextReg(CLIP_LAYER2_NR_18,0)
        NextReg(CLIP_LAYER2_NR_18,255)
        NextRegA(CLIP_LAYER2_NR_18,127-y)
        NextRegA(CLIP_LAYER2_NR_18,127+y)
        WaitRetrace2(100)
    next y 

end sub 

sub RollOut()
    NextReg(CLIP_TILEMAP_NR_1B,0)
    NextRegA(CLIP_TILEMAP_NR_1B,0)
    NextReg(CLIP_TILEMAP_NR_1B,0)
    NextRegA(CLIP_TILEMAP_NR_1B,0)
    NextReg(CLIP_LAYER2_NR_18,0)
    NextRegA(CLIP_LAYER2_NR_18,0)
    NextReg(CLIP_LAYER2_NR_18,0)
    NextRegA(CLIP_LAYER2_NR_18,0)
end sub 

sub ClearTilemap()
	asm 
		ld 		hl,TILE_MAPBASE*256
		ld 		de,1+TILE_MAPBASE*256
		ld 		bc,2560*2
		ld 		(hl),0
		ldir 
	end asm 
end sub 


sub fastcall UpdateMap(ux as ubyte, uy as ubyte, uv as ubyte, ucol as ubyte)
	asm 
		 
		exx : pop hl : exx 
		ld 		hl,TILE_MAPBASE*256
		add 	a,a
		add		hl,a							; add x * 2 because map is (char,attrib) x 80 
		; hl = $6000+x
		pop 	de
		ld 		a,e
		ld 		e,160
		mul 	d,e		; mul 160 because map is 2 x 80 
		add 	hl,de
		pop 	af						; get char to print 
		ld 		(hl),a
		inc 	hl
		pop 	af			; get colour 
		; SWAPNIB 
		and 	%01111111
		rlca; : and %11111110
		ld 		(hl),a
outme:
		exx : push hl : exx 
		end asm 	
end sub   


Sub fastcall CopyToBanks(startb as ubyte, destb as ubyte, nrbanks as ubyte, copylen as uinteger)
 	asm 
		exx : pop hl : exx 
		; a = start bank 			

		call 	_checkints
		;di 
		ld 		c,a 					; store start bank in c 
		pop 	de 						; dest bank in e 
		ld 		e,c 					; d = source e = dest 
		pop 	af 
		ld 		b,a 					; number of loops 
		pop 	hl						; get copy length
		ld 		(copysize+1),hl 			; SMC for LDIR copy length 

		copybankloop:	
		push 	bc
		push 	de 
		ld 		a,e
		nextreg $50,a
		ld 		a,d
		nextreg $51,a 

		ld 		hl,$0000
		ld 		de,$2000
copysize:		
		ld 		bc,$2000
		ldir 
		pop 	de
		pop	 	bc
		inc 	d
		inc 	e
		djnz 	copybankloop
		
		nextreg $50,$ff : nextreg $51,$ff
		;ReenableInts
		exx : push hl : exx : ret 

 	end asm  
end sub  


sub fastcall TextLineMem(address as uinteger, length as uinteger)
    asm 
        ; hl = address 
        ; de = length 
        ; col = a 
        pop     de                  ; ret address
        pop     bc                  ; length 
        push    de                  ; put back ret address

        call   .TextLine.start_in
        ret         
        
    end asm 
end sub 

sub fastcall TextChar(char as ubyte)

    asm 
        push    namespace   TextChar
    main:
        push    af 
        push    bc 
        push    de 
        push    hl
        ld      c, a 
        ld      a, (._curposYX+1)                  ; a = x pos 

        call    .TextLine._getXYaddress                    ; e = y pos 
        call    .TextLine.lineloop                   ; e = y pos 

        call    .TextLine._inc_x_att

        ld      a, c
        ld      (de), a 
        pop     hl 
        pop     de 
        pop     bc 
        pop     af 
        ret 
        pop     namespace
    end asm 

end sub 

sub fastcall ScrollScreen()

    asm 

        call       .TextLine._scroll_screen 
        ret
    end asm 
end sub 

sub fastcall IncXpos()

    asm 

        call       .TextLine._inc_x_att
        ret 

    end asm 
end sub 

sub fastcall ClearWindow(window as uinteger, colour as ubyte)

    asm 
        push    namespace   ClearWindow
        
        ; hl will be window address 
        exx    
        pop     de 
        exx 

        pop     af 
        ld      (_colour_+1), a 

        push    hl 
        pop     ix                  ; ix in now window 

        ld      e, (ix+1)
        ld      d, 160
        mul     d, e 
        ld      hl, .TILE_MAPBASE*256
        add     hl, de 
        ld      a, (ix+0)
        add     a, a 
        add     hl, a         

        ld      b, (ix+3)           ; height 
        ld      d, h 
        ld      e, l 
        inc     de 

    _clear_loop:
        push    bc 
        push    hl 
        push    de 
    _colour_:
        ld      (hl), 0 
        ld      c, (ix+2)           ; width 
        
        sla     c                   ; *2
        dec     c 
        ld      b, 0 
        ldir 
        pop     de 
        pop     hl 
        add     hl, 160
        add     de, 160
        pop     bc 
        djnz    _clear_loop

        exx 
        push    de 
        exx 

        ret 
        pop     namespace 

    end asm 

end sub 

sub fastcall ClearLineWin(nline as ubyte, window as uinteger)
    asm 
    
        push    namespace   ClearLineWin
        exx 
        pop     de 
        exx 
        and 	31 								; line 32 is max line 
        ld      (_line_+1), a
        pop     ix                              ; ix points to window
        
        ld      e, (ix+1)
        ld 		hl,.TILE_MAPBASE*256			; point hl to start of textmap area 
        ld 		d,160							; text map is 160 bytes wide (tile + attribute * 80)
        mul 	d,e  							; multiply this with the ypos 
        add 	hl,de 							; add to start of textmap 
        ld      a, (ix+0)
        add     hl,a                            ; top right 

_line_:
        ld      e, 0
        ld 		d,160							; text map is 160 bytes wide (tile + attribute * 80)
        mul     d, e 
        add     hl, de   
        ld      a, (ix+8)
        ld      (hl), a 
        ld      b, 0 
        ld      c, (ix+2)                       ; width 
        sla     c                               ; * 2 
        dec     c                               ; - 1 
        ldir 
1:
        inc     hl                              
        inc     hl                              ; over atrribute 
        ld      (hl), 0 
        djnz    1B
        exx     
        push    de 
        exx 
        ret 
        pop     namespace
    end asm 
end sub 

sub TextLineWin(helptextin as string,col as ubyte, window as uinteger)

    ' pushes a string text message to window. autowraps and scrolls
    
	asm 
         
		; cant be fast call due to bug in freeing string 
		push 	namespace TextLine_win 
        ; di 
        ; uses a, hl, de, bc 
         
        push    ix 
        getreg($52) : ld (_tx_outreg+1), a 
        nextreg $52, $0a 
        
        call    _getwindow
        call    start 
        
    _tx_outreg:
        ld      a, 0 
        nextreg $52, a 
        
    clear_string_:
        pop     ix 
        jp      ._TextLineWin__leave

    _getwindow:
        ; gets the window attributes and loads into place 
        ld      l, (ix+8)
        ld      h, (ix+9)                       ; points to window address 

        push    hl                              ; save on stack 

        ld 		a,(ix+7) 						; get colour
        ld 		(set_col+1),a 					; save with smc 
        ld		h,(ix+5)						; get string address off ix 
		ld 		l,(ix+4)
        ld      (start+1), hl                   ; store string address

        pop     ix                              ; point ix to window!

        ret 

		
    start:   
        
        ; work string   
        ld      hl, 0                           ; string address, smc from above 
        
		ld 		b,(hl)							; save string len in b
    start_in:
        ld      a, b                            ; check len is >0
        or      a 
        jp      z, done

		inc hl : inc hl                         ; jump over string len 
        
        ld      a, (ix+5)                       ; a = cx pos 
        call    _getXYaddress                   ; e = cy pos 
        
        ; b = loop counter 
	lineloop:
         
		ld      a,(hl)                          ; fetch char 
        ; process char 
		or      a 
        ret     z 
        
    _not_zero:
        cp      $0a                             ; y line + 1 linefeed 
        jr      nz, _not_lf

        ; increase y pos 
        inc      (ix+6)                         ; fetch line pos
                                                ; add + 1 
    _win_height:                               
        
        ld      a, (ix+6)
        cp      (ix+3)                          ; have we reach bottom line?
        jr      nz,_not_line32
        call    _scroll_screen 
        dec     (ix+6)
        
    _not_line32:

        ld      a,(ix+5)                        ; x 
        call    _getXYaddress
        inc     hl                              ; move to next char of string 
        jr      _skip_proc

    _not_lf:
        cp      $0d                             ; carriage return (x=0)
        jr      nz,_not_cr                      ; no its not a cr so jump to _not_cr
        
        call    _resetXpos

        inc     hl                              ; inc the string counter 
        jr      _skip_proc

    _not_cr:

        ld      a,(hl)                          ; fetch char 
        ld      (de),a 
        inc     de                              ; move to attrib 
    set_col:
		ld 		a,0								; colour set with smc 
		and 	%01111111						; and 6 bits 
		rlca									; rotate left 
		ld 		(de),a 							; save in attribute location 
		inc 	de 								; inc de
        inc     hl 
        
        call    _inc_x_att                      ; inc xpos 

    _skip_proc:
		djnz 	lineloop 						; repeat while b<>0

        ret                                     ; ret back to call instead of 

    _scroll_screen:
        exx     
        ld      a, (ix+1)                           ; get the y pos 
        ld      d, a 
        ld      e, 160                              ; y * 160 
        mul     d, e 
        ld      a, (ix+0)                           ; get x 
        add     a, a 
        ld      hl, .TILE_MAPBASE*256
        add     hl, de 
        add     hl, a                               ; hl = Y*160+X
         
        ld      d, h 
        ld      e, l 

        add     hl, 160                             ; next line down
        
        ld      a, (ix+3)                           ; a = height 
        ld      b, a 
        dec     b 

_scr_loop:
        
        push    bc                                  ; save loop counter 
        push    de                                  ; save hl and de 
        push    hl 

        ld      a, (ix+2)                           ; get win width
        add     a, a  
        ld      c, a                                ; save in c 
        ld      b, 0                                ; ensure b = 0 
        ldir       

        pop     hl                                  ; bring back for another loop 
        pop     de 

        add     de, 160
        add     hl, 160

        pop     bc 
        djnz    _scr_loop

        add     hl, -160
        ld      d, h 
        ld      e, l 

        ld      a, (ix+8)
        ld      (hl), a                             ; clear the last line 
        inc     de 
        ld      a, (ix+2)                           ; get win width 
        add     a, a 
        dec     a 
        ld      c, a                                ; save in c 
        ld      b, 0                                ; ensure b = 0 
        ldir       
        exx 
        ret

    _inc_x_att: 
        
        ;exx     ; swap all regs 
        push    hl 
        inc     (ix+5)                              ; increase x pos 

    _win_width:        
        ld      a, (ix+5)                           ; get the cx

        cp      (ix+2)                              ; has it reached width
        jr      nz, _not_80                         ; no then jump _not_chr80
                                                    ; yes we hit width 
        inc     (ix+6)                              ; increase y
        call    _resetXpos
    _check_32:
        ld      a, (ix+3)                           ; get current height 
        cp      (ix+6)                              ; is it height?
        jr      nz, _not_80                         ; no then jump to chr80
        call    _scroll_screen                      ; yes it is scroll screen
        dec     (ix+6)                              ; dec y 
        call    _resetXpos
    _not_80:

        ;exx 
        pop     hl 
        ret 

    _resetXpos:
        ld      a, (ix+0)
        ld      (ix+5), 0
        

    _getXYaddress:          
        push    hl                              ; save hl           
        ld      e, (ix+6)                       ; fetch y line 
		ld 		d,160							; text map is 160 bytes wide (tile + attribute * 80)
		mul 	d,e  							; multiply this with the ypos 

        ; this now has to be caluculate for windows 


        ld 		hl,.TILE_MAPBASE*256			; point hl to start of textmap area 
		add 	hl,de
        ld      a,(ix+0) 						; add to start of textmap 
        add     hl, a 
        ld      a, (ix+5)
        add     hl, a 
        ; we now need to add window offset 
        ex      de, hl                          ; place answe in de 
        push    de 

    _map_calc_y:
        ld      e,(ix+1)
        ld      d, 160
        mul     d, e 
    _map_calc_x:
        ld      a,(ix+0)
        add     de, a 
        ex      de, hl
        pop     de 
        add     hl, de 
        ex      de, hl                          ; de now start location  
        
        pop     hl 
        ret 

	done: 
        ret 
		pop 	namespace
	
	end asm 

end sub 

sub TextLine(helptextin as string,col as ubyte=4)


	asm 
         
		; cant be fast call due to bug in freeing string 
		push 	namespace TextLine 
        ; di 
        ; uses a, hl, de, bc 
    
        getreg($52) : ld (_tx_outreg+1), a 
        nextreg $52, $0a 


        call    start 

    _tx_outreg:
        ld      a, 0 
        nextreg $52, a 
        
    clear_string_:

    
        jp      ._TextLine__leave
		
    start:   

		ld 		a,(ix+7) 						; get colour
		ld 		(set_col+1),a 					; save with smc 

        ; work string 
        ld		h,(ix+5)						; get string address off ix 
		ld 		l,(ix+4)
		ld 		b,(hl)							; save string len in b
    start_in:
        ld      a, b                            ; check len is >0
        or      a 
        jp      z, done

		add 	hl,2                            ; jump over string len 
        
        ld      a, (._curposYX+1)                  ; a = x pos 
        call    _getXYaddress                    ; e = y pos 
        
        ; b = loop counter 
	lineloop:
         
		ld      a,(hl)                          ; fetch char 
        ; process char 
		or      a 
        ret     z 
        
    _not_zero:
        cp      $0a                             ; y line + 1 linefeed 
        jr      nz, _not_lf

        ; increase y pos 
        ld      a, (._curposYX)                  ; fetch line pos
        inc     a                               ; add + 1 
        cp      32                              ; have we reach bottom line?
        jr      nz,_not_line32
        call    _scroll_screen 
        dec     a
    _not_line32:
        ld      (._curposYX), a                  ; save 

        ld      a,(._curposYX+1)
        call    _getXYaddress
        inc     hl                              ; move to next char of string 
        jr      _skip_proc

    _not_lf:
        cp      $0d                             ; carriage return (x=0)
        jr      nz,_not_cr                      ; no its not a cr so jump to _not_cr
        
        call    _resetXpos

        inc     hl                              ; inc the string counter 
        jr      _skip_proc

    _not_cr:

        ld      a,(hl)                          ; fetch char 
        ld      (de),a 
        inc     de                              ; move to attrib 
    set_col:
		ld 		a,0								; colour set with smc 
		and 	%01111111						; and 6 bits 
		rlca									; rotate left 
		ld 		(de),a 							; save in attribute location 
		inc 	de 								; inc de
        inc     hl 
        
        call    _inc_x_att                      ; inc xpos 

    _skip_proc:
		djnz 	lineloop 						; repeat while b<>0

        ret                                     ; ret back to call instead of 
        ; jp    done 

    _scroll_screen:
        exx     
        ld      hl, 480 + .TILE_MAPBASE*256
        ld      de, 320 + .TILE_MAPBASE*256 
        ld      bc, 5120 - 480
        ldir 

        ld      h, d                ; clear a line
        ld      l, e 
        ld      (hl), 0 
        inc     de 
        ld      bc, 160 
        ldir   
        exx 
        ret

    _inc_x_att: 
        ;exx     ; swap all regs 
        push    hl 
        ld      a,(._curposYX+1)                   ; increase x pos 
        inc     a                                   
        cp      80                                  ; has it reached 80?
        ld      h, a 
        jr      nz, _not_chr80                      ; no then jump _not_chr80
        ld      h, 0
        ld      a, (._curposYX)                      ; else get y 
        inc     a                                   ; add 1

    _check_32:
        cp      32                                 ; is it 32?
        jr      nz, _not_80                          ; no then jump to chr80
        call    _scroll_screen                      ; yes it is scroll screen
        dec     a 
    _not_80
        ld      (._curposYX), a
        
    _not_chr80:
        ld      a, h 
        ld      a,(._curposYX+1)                   ; increase x pos 
        ;exx 
        pop     hl 
        ret 


    _resetXpos:
        xor     a 
        ld      (._curposYX+1), a 
        

    _getXYaddress:          
        push    hl 
        add     a, a             
        ld      de, (._curposYX)                ; fetch y line 
		ld 		d,160							; text map is 160 bytes wide (tile + attribute * 80)
		mul 	d,e  							; multiply this with the ypos 

        ld 		hl,.TILE_MAPBASE*256			; point hl to start of textmap area 
		add 	hl,de 							; add to start of textmap 
        add     hl, a 
        ex      de, hl 
        pop     hl 
        ret 

	done: 
		pop 	namespace
	
	end asm 

end sub 

_cursorYX:
asm 
_curposYX:
    db      0,0
end asm 


sub fastcall ReadString2(pointer as uinteger,byref destsr as string) 
    asm 
        push        namespace   ReadString
       
        di 
         
        exx 
        pop         de                      ; ret address
        
        nextreg     $50, 40 
        pop         hl 
        ld          (outhl+1), hl 
        exx 
    string_address:
        ; ld          hl, 0                 set on entry 

    _not_zero:
        ld          b, 0 
        call        FoundStart

        nextreg     $50, $ff 

        exx     
        push    de                      ; fix return stack 
        exx  

    outhl:
        ld      hl, 0
        jp          .core.__STORE_STR
        
    FoundStart:
        ld      bc, 256            ; Clear B (used for future loops if necessary)
        ld      de, .LABEL._filename +2
    CopyString:
        ld      a,(hl)
        cp      $0d             ; Check if it's CR
        jr      nz, NotCRLF  ; If CR, might be end of string
        ;ld      a, (hl)         ; Load character at HL into A
        cp      $00             ; Check if it's CR
        jr      z, ResetEndOfString  ; If CR, might be end of string
        inc     hl 
        inc     hl 
        jp      EndOfString

    NotCRLF:
        ld      (de), a         ; Copy character from HL to DE
        inc     hl              ; Increment HL
        inc     de              ; Increment DE
        dec     bc 
        ld      a, b 
        or      c 
        jr      z, EndOfString
        jr      CopyString      ; Loop back to copy next character
    ResetEndOfString:
        ld      hl, 1
        ; ld      (string_address+1), hl 
        ld      (._curr_line_address), hl 
        ld      de, empty_str
        ret     
    EndOfString:
        ; inc     hl 
        ; ld      (string_address+1), hl 
        ld      (._curr_line_address), hl 
        xor     a               ; Load null (or any terminator)
        ld      (de), a         ; Terminate string in buffer
        ld      hl, .LABEL._filename+2
        
        ld      bc, 0 
    brb:  ld      a, (hl)
        cp      0 
        jr      z, twt
        inc     bc 
        inc     hl 
        jr      brb 
    twt:  ld      (.LABEL._filename), bc 
        ld      hl, .LABEL._filename
        ex      de, hl 
        ret 
empty_str:
        db 01,00," ",$00
    controlcode:
;        BREAK 
;        inc     hl 
;        ld      a, (hl)
;        cp      'i'
;        jr      nz,not_ink 
;        inc     hl 
;        ld      a, (hl)
;        sub     $30
;        ld 		(.TextLine_win.set_col+1),a
        inc     hl 
    not_ink:
        jp      CopyString 



        pop         namespace
    end asm 
end sub 

sub TextATLineWin(byval txx as ubyte,byval tyy as ubyte,helptextin as string,byval col as ubyte,window as uinteger)
                '           4 5             6   7               8   9           10  11          12  13
	asm 
		; cant be fast call due to bug in freeing string 
		push 	namespace TextATLineWin
        getreg($52) : ld (_tx_outreg+1), a 
        nextreg $52, $0a 		
         
        push    ix 
        call    _getwindow
        call    .TextLine_win.start

    _tx_outreg:
        ld      a, 0 
        nextreg $52, a 

    clear_string_:
        pop     ix 
        jp      ._TextATLineWin__leave

    _getwindow:
        ; gets the window attributes and loads into place 
        ld      l, (ix+12)
        ld      h, (ix+13)                       ; points to window address 

        push    hl                              ; save on stack 

        ld 		a,(ix+11) 						; get colour
        ld 		(.TextLine_win.set_col+1),a 	; save with smc 
        ld		l,(ix+8)						; get string address off ix 
		ld 		h,(ix+9)
        ld      (.TextLine_win.start+1), hl     ; store string address
        ld      d, (ix+5)                       ; x 
        ld      e, (ix+7)                       ; y 
        pop     ix                              ; point ix to window!
        ld      a,(ix+2)                        ; width 
        cp      d                               ; compare to new x 
        jr      c, bigger_expire
        jr      z, bigger_expire                ; exit if = or > 
        ld      a,(ix+3)                        ; height
        cp      e                               ; compare with new y
        jr      c, bigger_expire
        jr      z, bigger_expire
        ld      (ix+5),d                        ; x y 
        ld      (ix+6),e
        ret 
    bigger_expire:
        pop     hl                              ; pop ret off stack 
        jp      _tx_outreg                      ; jp to ending 
	done: 
		pop 	namespace
	
    end asm 
end sub 

sub TextATLine(byval txx as ubyte,byval tyy as ubyte,helptextin as string,byval col as ubyte)

	asm 
		; cant be fast call due to bug in freeing string 
		push 	namespace TextATLine 
		 
		add 	a,a
		ld 		(xpos+1),a 						; save the xpos 
		ld 		a,(ix+7)
		and 	31 								; line 32 is max line 
		ld 		e,a 							; save in e 
		ld 		hl,.TILE_MAPBASE*256			; point hl to start of textmap area 
		ld 		d,160							; text map is 160 bytes wide (tile + attribute * 80)
		mul 	d,e  							; multiply this with the ypos 
		add 	hl,de 							; add to start of textmap 

        

	xpos:
		ld 		a,0								; xpos set with smc 
		add 	hl,a 							; add to hl 
		ex 		de,hl 							; swap hl into de 
		ld		h,(ix+9)						; get string address off ix 
		ld 		l,(ix+8)
		ld 		b,(hl)							; save string len in b
		add 	hl,2 
		ld 		a,(ix+11) 						; get colour
		ld 		(col+1),a 						; save with smc 
	lineloop:
		push 	bc 								; save loop size 
		; ld      a,(hl)
		
		ldi 									; copy hl to de then inc both  
        
        ; sub     93
        ; ld      (de),a 
        ; inc     hl 
        ; inc     de
	col:
        ld 		a,0								; colour set with smc 
        and 	%01111111						; and 6 bits 
        rlca										; rotate left 
		ld 		(de),a 							; save in attribute location 
		inc 	de 								; inc de
		pop 	bc								; get back string len 
		djnz 	lineloop 						; repeat while b<>0
	done: 
		pop 	namespace
	
	end asm 

end sub 

function fastcall LSet(instring as string) as string 
    asm
         
        push    namespace lset 
        push    hl
        ; hl is string addresss 

        ; it will be only two in length 
        ld      c, (hl)                         ; get size 
        ld      a, c    
        cp      2 
        jr      nc, no_padding_require_a        ; no padding required
        cp      1 
        jr      z, padding_required
    no_padding_require_a:

        ld      de, .LABEL._filename
        ldi 
        ldi 
        ldi 
        ldi 
        jr      no_padding_require

    padding_required:
        inc     hl 
        inc     hl                              ; start of string
        ex      de, hl 
        ld      hl, .LABEL._filename
        ld      (hl), 2 
        inc     hl 
        ld      (hl), 0 
        inc     hl 
        ld      a, '0'
        ld      (hl), a 
        inc     hl 
        ex      de, hl 
        ldi 
        
    no_padding_require:
        pop     hl 
        push    hl 
        call    .core.__MEM_FREE
        pop     hl 
        
        ld      hl, .LABEL._filename
        
        ret 
        pop     namespace

    end asm 
end function

sub fastcall TextNumber(value as ubyte)
    asm 
        ;   a 
        ;   y 
        ;  value on stack 
        PROC 
        LOCAL Na1, Na2, skpinc, number_buffer

        push    af 
        ld      a, (.TextLine._curposYX+1)                  ; a = x pos 
        call    .TextLine._getXYaddress                    ; e = y pos 

        push    hl                              ; save screen address 

        ld      hl, number_buffer               ; text buffer 
        call    CharToAsc                       ; convert the chars 
        
        ld      hl, number_buffer
        pop     de                              ; screen address 

        ldi                                     ; copy to screen 
        inc     de                              ; skip attrib 
        ldi     
        inc     de 
        ldi          

        ret                                     ; rountine complete 

    CharToAsc:		

		; hl still pointing to pointer of memory 
		ld 		hl, number_buffer
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
    number_buffer:
        db      0,0,0,32
    _textnum_end:

        ret 
        ENDP
    end asm 


end sub 

sub ColourRow(colour as ubyte)
	
	asm 
	
		push af 
		ld 		hl, TILE_MAPBASE*256
		;ld 		a,(._pat_p)
		ld 		a, (_curposYX)
        dec     a 
		ld 		d,a
		ld 		e,160
		mul 	d, e
		add 	hl,de			; start of row
		pop 	af 				; get colour
		and 	%01111111						; and 6 bits 
		rlca									; rotate left 
		ld 		b,80
	rowloop:		
		inc 	hl               
		ld 		(hl),a 
		inc 	hl 
		djnz rowloop
		end asm 	

end sub



' function FASTCALL BinToString(num as ubyte) as String
' 	asm
' 	PROC
' 	push namespace core
' 	LOCAL END_CHAR
' 	LOCAL DIGIT
' 	LOCAL charloop
' 	LOCAL bitisset
' 	LOCAL nobitset


' 	    push    af                  ; saving the number num
' 	    ld      bc,10               ; request 10 bytes?
' 	    call    __MEM_ALLOC    
' 	    ld a, h
' 	    or l
' 	    pop bc 
' 	    ld c,b 
' 	    ret z	                    ; NO MEMORY
    
' 	    push hl	; Saves String ptr
' 	    ld (hl), 8
' 	    inc hl
' 	    ld (hl), 0
' 	    inc hl  ; 8 chars string length

' 	    ; c holds out entry 8 bit value, b number of bits 

' 	    ld b,8
' charloop:
' 	call DIGIT
' 	djnz charloop 
' 	pop hl	; Recovers string ptr
' 	ret
	
' DIGIT:
' 	ld a,c
' 	bit 7,a
' 	jr nz,bitisset 
' 	ld a,'0'
' 	jr nobitset
' bitisset:
' 	ld a,'1'
' nobitset:	
	
' END_CHAR:
' 	ld (hl), a
' 	inc hl
' 	ld a,c 
' 	sla c 
' 	ret
' 	ENDP
' 	pop namespace
' 	end asm
' end function
