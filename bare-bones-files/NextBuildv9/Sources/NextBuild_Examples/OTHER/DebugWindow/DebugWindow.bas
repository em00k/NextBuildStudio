'!org=32768
'!heap=4096
'!opt=4                         ' for faster compilation (I'm impatient)

dim     ver$="2024.03.06.6"

' -------------------------------------------------------------------
' - Next Debug Client V1 by em00k
' -------------------------------------------------------------------
' Demonstrating text mode hw tilemap with a text window system 
' 

' backup sysvars if running on NextZXOS
backupsysvar()

#define NEX 
#define IM2
#define NOSP
#define CUSTOMISR
#DEFINE NOAYFX

' includes 
#include <nextlib.bas>
#include <keys.bas>
#include <hex.bas>
#include "includes/Tilemap_include.bas"
#include <inputtile.bas>
#include <nextlib_ints.bas>
#include <string.bas>


' macros 
#define NEXTROMS \
    nextreg $50,$ff \
    nextreg $51,$ff  \

#define BUFFBANK \
    nextreg $50,25 \
    nextreg $51,26  \

#define CON_ON \
    ld      hl, $57fd \
    ld      (hl), 148  \

#define CON_OFF \
    ld      hl, $57fd\
    ld      (hl), 164  \

asm 
	nextreg NEXT_RESET_NR_02, 0 
end asm 

' -------------------------------------------------------------------
' - VARIABLES ETC
' -------------------------------------------------------------------


    dim	key 		as uinteger
    dim keydown 	as ubyte = 0 
    dim	buffer 		as uinteger = 0
    dim a 			as ubyte 
    dim count		as ubyte 
    dim max			as ubyte 
    dim tsize		as ubyte 
    dim success 	as ubyte 
    dim tempbyte 	as ubyte 
    dim sz		as ulong 
    dim inbyte 	as ubyte 
    dim memloca	as uinteger
    dim control_flag as ubyte = 0 
    dim check_buffer_flag as ubyte = 0 
    dim cur_x, cur_y, cur_col   as ubyte  
    dim date        as string = "00:00:00"
    dim time        as string = "00:00:00"
    dim capture_esp as ubyte = 0            ' whether the interrup is capturing the uart output. 
    dim exit_code   as ubyte = 0 
    dim CRLF        as string =chr($0d)+chr($0a)
    dim last_data_len   as uinteger = 0 

    dim outstring   as string = ""
    dim timeupdate  as ubyte = 10 
    dim status_flag as ubyte = 0 
    dim process_buffer as ubyte = 0 
    dim cmd$        as string 
    dim ext$        as string 
    dim type$       as string
    dim opmode      as ubyte = 0 
    dim clk_timer   as ubyte 
    dim clk_update  as ubyte = 4
    dim address     as uinteger 
    dim address2    as uinteger    
    dim address_i   as uinteger 
    dim address2_i  as uinteger
    dim colour      as ubyte 
    dim curr_line_address as uinteger = 0 
    dim __string_2  as string = "    "
    dim keep_alive  as uinteger = 1200 
    dim size_toget  as uinteger

    dim timer_time  as ubyte = 0 
    dim direct_mode as ubyte = 0 
    dim msg_counter as ulong
    dim _in_string  as string = "" 

declare function PeekMem2(address as uinteger,delimeter as ubyte, bank as ubyte=24) as string

' declare function Read_SD_Entry as string 

const HOST          as ubyte = 18 
const REMOTE        as ubyte = 27
const INFO_C        as ubyte = 43
const ERROR_C       as ubyte = 106
const INFO_R       as ubyte = 64
const SUCCESS_C     as ubyte = 58


LoadSDBank("topan2.fnt",0,0,0,30)	            ' 1 bit font 
LoadSDBank("dos-jsync.pal",1024,0,0,30)         ' upload gpl to remys site, download as a pal 
LoadSDBank("plip.afb",0,0,0,28)

' -------------------------------------------------------------------
' - INIT APP
' -------------------------------------------------------------------

paper 0 : ink 0 : cls 
DisableSFX
DisableMusic 						            ' Enables Music, use DisableMusic to stop 
SetUpIM()							            ' init the IM2 code 
EnableSFX 

InitTilemap()

RollOut()

sub MyCustomISR()  

end sub 

' dim te as ubyte 
' for y = 0 to 24
' for x = 0 to 39 step 4
'     TextATLine(x,y,str(te)+" "+CRLF,te)
'     WaitKey()
'     te = te + 1 
' next 
' next 

' -------------------------------------------------------------------
' - SHOW BANNER 
' -------------------------------------------------------------------

TextLine("Debug Client v"+ver$+" emk/24"+CRLF,64)
ColourRow(64)
TextLine(CRLF,106 )
ColourRow(106)
GetDate()
ShowTime()

' -------------------------------------------------------------------
' - INIT ESP CLEAR BANKS 
' -------------------------------------------------------------------

DrawScreen()
RollIn()
HelpScreen()

control_flag = 0                    ' clear the control flag 

' -------------------------------------------------------------------
' - MAIN LOOP 
' -------------------------------------------------------------------

do 
    border 0 

    asm
        ei
        nextreg TURBO_CONTROL_NR_07,3
    end asm

	key  = GetKeyScanCode()
    ShowTime()
    ReadKeys()

    if status_flag = 1     
        'TextLine("OK Read"+CRLF)
        process_buffer = 1 

    elseif status_flag = 2
        'TextLine("ERROR"+CRLF, ERROR_C)
        process_buffer = 1 

    elseif status_flag = 4
        ' 
        TextLineWin("Status Flag 4"+CRLF,INFO_C,@windows_1)
    endif 
    
    WaitRetrace2(0)

    

loop 

' -------------------------------------------------------------------
' - SUB ROUTINES 
' -------------------------------------------------------------------


sub ReadKeys()
    
    if key and keydown = 0 

        t$=InputTile(78, "", 1, 30 )            ' max len 78
        asm 
            ; clears line 30
            ld      hl, .TILE_MAPBASE*256
            ld      e, 30
            ld      d, 160 
            mul     d, e 
            add     hl, de 
            inc     hl 
            inc     hl 
            ld      d, h
            ld      e, l 
            inc     de 
            ld      (hl), 0 
            ld      bc, 154
            ldir 
        end asm 
        if len t$ > 0 
            TextLineWin(t$+CRLF, 6, @windows_2)
            if t$(0)="/"
                tri$=t$(1 to 3)
                ending$=t$(5 to )    
                if tri$="con"
                    StartClient()
                elseif tri$="mod"
                '    DoSearch(ending$,0)
                elseif tri$="pt3" 
                '    DoSearch(ending$,1)
                endif 
            endif 
        endif   
            

 
        keydown = 1
    elseif keydown = 1 and key = 0
        keydown = 0 
    endif   

end sub 





sub HelpScreen()
    ' help screen text 
    TextLineWin(CRLF+"Debug Client  "+ver$+CRLF, 20,@windows_1)
    TextLineWin("Coded by em00k for the ZX Spectrum Next"+CRLF+CRLF,21,@windows_1)

   
end sub 

Sub StartClient()
    ' start client 
    Clear_Buffer()

end sub 

sub ShowTime()    
    ' show date and time 
    GetTime()
    TextATLine(0,1,time$+" "+date$,106)
end sub 


sub Clear_Buffer()
	asm 
        di 
        nextreg $50,40
    ;    nextreg $51,41
		ld		hl, 0
		ld 		de, 1
		ld		bc, 2048
		ld 		(hl), $00 
		ldir 
        nextreg $50, $ff 
    ;    nextreg $51, $ff 
    ;    ei
	end asm 
end sub 



function fastcall PeekMem2(address as uinteger,delimeter as ubyte, bank as ubyte=40) as string
   ' assign a string from a memory block until delimeter 
   asm 
       push namespace peekmem 
   main:        
        di 
        ; hl set on entry 
        exx 
        pop     de                      ; ret address
        exx 

    delim: ld       d, a                   ; delimiter 
       
        pop     af                      ; bank 
        pop     af                      ; bank 
        or      a 
        jr      z, nobank
        nextreg $50, a                  ; set bank 
    nobank:
        ld      a, d         
        ;' de destination
        ;' hl source data 
        ;' now copy to string temp

        ld      de,.LABEL._filename+2 
        ld      bc,0                    

    copyloop:

        cp      (hl)                    ; compare with a / delimeter 
        jr      z,endcopy               ; we matched 
        ldi 
        inc     bc                      ; adjust for ldi
        inc     c
        ex      af,af' 
        ld      a, c 
        cp      128 
        jr      z, endcopy
        ex      af,af' 
        jr      nz,copyloop             ; loop while c<>0
        dec     c 
        
    endcopy:    
        ld      (.LABEL._filename),bc 
        nextreg $50,$ff                 ; restore mmu 
        exx     
        push    de                      ; fix return stack 
        exx     
        ld      hl, .LABEL._filename
        ret 
        pop     namespace
   end asm 

end function 



' -------------------------------------------------------------------
' - GENERAL PURPOSE 
' -------------------------------------------------------------------


hltonumber()

sub hltonumber()
    asm 

    PROC 
    LOCAL .trim
    LOCAL .zero
    LOCAL .hltoNumber
    LOCAL .num1
    LOCAL .num2
    LOCAL .buffer

        HLtoNumber:
            ld      a, l
            or      h
            jr      z, .zero
            push    hl
            exx
            pop     hl

            ld      de, .buffer
            call    .hltoNumber

            exx
            ld      hl, .buffer
        .trim						                ; trim leading '0'
            ld      a, (hl)
            cp      '0'
            ret     nz
            inc     hl
            jr      .trim

        .zero
            ld      a, '0'
            ld      (hl), a
            ret

        .hltoNumber
            ld	    bc, -10000
            call    .num1
            ld	    bc, -1000
            call    .num1
            ld      bc, -100
            call    .num1
            ld      c, -10
            call    .num1
            ld      c, -1
        .num1:
            ld      a, '0'-1
        .num2:
            inc	    a
            add	    hl, bc
            jr      c, .num2
            sbc	    hl, bc
            ld      (de), a
            inc     de

            ret
        .buffer:

            DB      "00000"
            DB      0 
            ENDP 
    end asm 
end sub



sub NumbToAscii()
    asm 
    ;  entry  inputregister(s)  decimal value 0 to:
    ;   b2d8             a                    255  (3 digits)
    ;   b2d16           hl                  65535   5   "
 ;  ;   b2d24         e:hl               16777215   8   "
    ;   b2d32        de:hl             4294967295  10   "
    ;   b2d48     bc:de:hl        281474976710655  15   "
    ;   b2d64  ix:bc:de:hl   18446744073709551615  20   "
    ; the number is aligned to the right, and leading 0's are replaced with spaces.
    ; on exit hl points to the first digit, (b)c = number of decimals
    ; this way any re-alignment / postprocessing is made easy.

        b2d8:    	ld h,0
                    ld      l,a
        b2d16:   	ld      e,0
        b2d24:   	ld      d,0
        b2d32:   	ld      bc,0
        b2d48:   	ld      ix,0            ; zero all non-used bits
        b2d64:   	ld      (b2dinv),hl
                    ld      (b2dinv+2),de
                    ld      (b2dinv+4),bc
                    ld      (b2dinv+6),ix   ; place full 64-bit input value in buffer
                    ld      hl,b2dbuf
                    ld      de,b2dbuf+1
                    ld      (hl),' '
        ; b2dfilc: equ $-     1               ; address of fill-character
                    ld      bc,18
                    ldir                    ; fill 1st 19 bytes of buffer with spaces
                    ld      (b2dend-1),bc   ; set bcd value to "0" & place terminating 0
                    ld      e,1             ; no. of bytes in bcd value
                    ld      hl,b2dinv+8     ; (address msb input)+1
                    ld      bc,$0909
                    xor     a
        b2dskp0:	dec     b
                    jr      z,b2dsiz        ; all 0: continue with postprocessing
                    dec     hl
                    or      (hl)            ; find first byte <>0
                    jr      z,b2dskp0
        b2dfnd1:	dec     c
                    rla
                    jr      nc,b2dfnd1      ; determine no. of most significant 1-bit
                    rra
                    ld      d,a             ; byte from binary input value
        b2dlus2:	push    hl
                    push    bc
        b2dlus1: 	ld      hl,b2dend-1     ; address lsb of bcd value
                    ld      b,e             ; current length of bcd value in bytes
                    rl      d               ; highest bit from input value -> carry
        b2dlus0: 	ld      a,(hl)
                    adc     a,a
                    daa
                    ld      (hl),a          ; double 1 bcd byte from intermediate result
                    dec     hl
                    djnz    b2dlus0         ; and go on to double entire bcd value (+carry!)
                    jr      nc,b2dnxt
                    inc     e               ; carry at msb -> bcd value grew 1 byte larger
                    ld      (hl),1          ; initialize new msb of bcd value
        b2dnxt:  	dec     c
                    jr      nz,b2dlus1      ; repeat for remaining bits from 1 input byte
                    pop     bc              ; no. of remaining bytes in input value
                    ld      c,8             ; reset bit-counter
                    pop     hl              ; pointer to byte from input value
                    dec     hl
                    ld      d,(hl)          ; get next group of 8 bits
                    djnz    b2dlus2         ; and repeat until last byte from input value
        b2dsiz:  	ld      hl,b2dend       ; address of terminating 0
                    ld      c,e             ; size of bcd value in bytes
                    or      a
                    sbc     hl,bc           ; calculate address of msb bcd
                    ld      d,h
                    ld      e,l
                    sbc     hl,bc
                    ex      de,hl           ; hl=address bcd value, de=start of decimal value
                    ld      b,c             ; no. of bytes bcd
                    sla     c               ; no. of bytes decimal (possibly 1 too high)
                    ld      a,'0'
                    rld                     ; shift bits 4-7 of (hl) into bit 0-3 of a
                    cp      '0'             ; (hl) was > 9h?
                    jr      nz,b2dexph      ; if yes, start with recording high digit
                    dec     c               ; correct number of decimals
                    inc     de              ; correct start address
                    jr      b2dexpl         ; continue with converting low digit
        b2dexp:  	rld                     ; shift high digit (hl) into low digit of a
        b2dexph: 	ld      (de),a          ; record resulting ascii-code
                    inc     de
        b2dexpl: 	rld
                    ld      (de),a
                    inc     de
                    inc     hl              ; next bcd-byte
                    djnz    b2dexp          ; and go on to convert each bcd-byte into 2 ascii
                    sbc     hl,bc           ; return with hl pointing to 1st decimal
                    ret

        b2dinv:  	ds      8            ; space for 64-bit input value (lsb first)
        b2dbuf:  	ds      20           ; space for 20 decimal digits
        b2dend:  	ds      1            ; space for terminating 0
    end asm 
end sub 

sub GetDate()

    asm 

        ; ***************************************************************************
        ; * M_GETDATE ($8e) *
        ; ***************************************************************************
        ; Get the current date/time.
        ; Entry:
        ; -
        ; Exit:
        ; Fc=0 if RTC present and providing valid date/time, and:
        ; BC=date, in MS-DOS format
        ; DE=time, in MS-DOS format
        ; H=secs to 1-second precision
        ; (time in DE only provides 2-sec precision)
        ; L=100ths of second (or $ff if not supported by RTC module)
        ; Fc=1 if no RTC, or invalid date/time, and:
        ; BC=0
        ; DE=0
        ; HL undefined
        getreg($50) : ld (_gt_dat_+1), a 
        getreg($51) : ld (_gt_dat_1+1), a 
        nextreg     $50, $ff 
        nextreg     $51, $ff 
        rst     8 : db $8e 
        ld      (_date_buff), bc                ; save date 
    _gt_dat_:
        ld      a, 0 
        nextreg $50, a 
    _gt_dat_1:
        ld      a, 0 
        nextreg $51, a 

    end asm 

    dim day, month,a,b  as ubyte
    dim year            as uinteger
    '  byte[] bytes = new byte[] { 113, 66 };

    a = peek(@date_buff)
    b = peek(@date_buff+1)


    day = (a band %00011111)

    month = ((a band $7) << 1) bor (b >> 5)
    year = (b >> 1) + 1980

    date$=LSet(str(day))+"."+LSet(str(month))+"."+str(year)+" "

end sub 


sub GetTime()

    if clk_update = 0 
        clk_update = 5
        asm 

            ; ***************************************************************************
            ; * M_GETDATE ($8e) *
            ; ***************************************************************************
            ; Get the current date/time.
            ; Entry:
            ; -
            ; Exit:
            ; Fc=0 if RTC present and providing valid date/time, and:
            ; BC=date, in MS-DOS format
            ; DE=time, in MS-DOS format
            ; H=secs to 1-second precision
            ; (time in DE only provides 2-sec precision)
            ; L=100ths of second (or $ff if not supported by RTC module)
            ; Fc=1 if no RTC, or invalid date/time, and:
            ; BC=0
            ; DE=0
            ; HL undefined
            getreg($50) : ld (_gt_tim_+1), a 
            getreg($51) : ld (_gt_tim_1+1), a 
            nextreg     $50, $ff 
            nextreg     $51, $ff 
            rst     8 : db $8e 
            ld      (_date_buff+2), de                ; save time 
            ld      (_date_buff+4), hl                ; save time 
        _gt_tim_:
            ld      a, 0 
            nextreg $50, a 
        _gt_tim_1:
            ld      a, 0 
            nextreg $51, a 

        end asm 

        dim a,b             as ubyte
        dim sec, min, hour  as ubyte 
        dim c               as ubyte 

        a = peek(@date_buff+5)
        b = peek(@date_buff+3)

        sec = (a band %00111111)
        min = (a >> 5) bor (b band 7)<<3
        hour = (b >>3 ) band %00011111
        
        if clk_timer= 0 
            clk_timer = 10
        else 
            clk_timer = clk_timer - 1 
        endif 
        if clk_timer>4
            time$=LSet(str(hour))+":"+LSet(str(min))+":"+LSet(str(sec))
        else 
            time$=LSet(str(hour))+" "+LSet(str(min))+" "+LSet(str(sec))
        endif 
    else 
        clk_update = clk_update - 1 
    endif 

end sub 


sub fastcall PeekMem(address as uinteger,delimeter as ubyte,byref outstring as string, bank as ubyte=24)
    ' assign a string from a memory block until delimeter 
    asm 
        push namespace peekmem2
    main:        
        
        ; hl set on entry 
        di 
        exx 
        pop     de                      ; ret address
        exx 
delim:  pop     af                      ; delimeter 
        pop     de                      ; string destination  
        ex      af, af'
bbank:  pop     af                      ; bank 
        or      a 
        jr      z,_no_bank
        nextreg $50, a                  ; set bank 
_no_bank:        
        ex      af, af' 

        ;' de string ram 
        ;' hl source data 
        ;' now copy to string temp
 
        push    de                      ; save string destination 
        ; hl is set to source from entry 
        ld      de,.LABEL._filename+2 
        ld      bc,0                    

    copyloop:
        cp      (hl)                    ; compare with a / delimeter 
        jr      z,endcopy               ; we matched 
        ldi 
        inc     bc                      ; adjust for ldi
        inc     c
        jr      nz,copyloop             ; loop while c<>0
        dec     c 
    endcopy:
        ld      (.LABEL._filename),bc 
        pop     hl                      ; pop destination string 
        ld      de,.LABEL._filename     ; source string 
        ; de = string data 
        ; hl = string
        nextreg $50,$ff                 ; restore mmu 
        exx     
        push    de                      ; fix return stack 
        exx     
        jp      .core.__STORE_STR

        
        pop     namespace
    end asm 

end sub 

sub fastcall PeekString2(address as uinteger,byref outstring as string)
    asm  
        ex      de, hl 
        pop     hl 
        ex      (sp), hl
        jp      .core.__STORE_STR 
    end asm 
end sub

Sub fastcall SplitString(source as uinteger, needle as ubyte, poision as ubyte) 

    asm 
    start2:
            ; ; BREAK 
			PROC 
			LOCAL donelength
			LOCAL genlenthtloop
            exx : pop de : exx                          ; store return address 
            pop     af                                      ; a = neeedle off stack 
            ld      (needle),a                               ; store value at (needle)
            pop     af                                      ; position off stack 
            ld      (source),hl                              ; sotre hl into source 
            ld      de,needle                                ; point de to needle, hl = source, a position 
            push    ix : push bc 

            call    getstringsplit

            pop bc : pop ix 				
            exx : push de : exx                         ; restore ret address 

            ret                                         ; return 

	getstringsplit:
            ; hl = source 
            ; de = needle 
            ; a = index to get 
                    ; out hl = point to string or zero if not found
            
            ld      (source),hl									; save index 
			ld      hl,0
            ld      (stringtemp),hl
            call    countdelimters                             ; 
            ld      ix,currentindex                              ; point ix to index table 
            ld      hl,(source)                                    ; source string 
    
            ld      (indextoget),a                               ; save index to get 
            or      a : jr z,getfirstindex                       
    
    subloop:
            ld      de,needle                                    ; point to needle 
            ld      a,(de)                                       ; get needle
            ld      bc,0
            cpir 
            jr      z,foundneedle
            ret 
    
    foundneedle:
            ; hl = location
            push    hl                                         ; save hl on stack 
            ld      b,a                                          ; save needle in b 
            inc     (ix+0)                                      ; inc currentindex 
            ld      a,(indextoget)                               ; get the index we want to look for
            cp      (ix+0)                                       ; does it match what we're on?
            jr      z,wefoundourindex                            ; found our index 
            pop     hl                                          ; pop hl from stack
            jr      subloop                                      ; loop around 
    
    getfirstindex:
            ; used when index is 0 
            push    hl 
            ld      a,(needle) : ld b,a : ld c,$ff               ; max  size of string out = $ff
    
    wefoundourindex:
            ; hl = start of string slice 
            ld      de,stringtemp+2                                ; tempstring save two bytes for length of string

    wefoundourindexloop:
            ld      a,(hl)                                       ; 
            or      a : jr z,copyends                            ; is this next char zero? 
            cp      b : jr z,copyends                            ; or the needle?
            ldi                                             ; no then copy to tempstring
            jr      wefoundourindexloop                          ; and keep looping 
    
    copyends:
            ex      de,hl                                        ; swap de / hl 
            ld      (hl), 0                                      ; zero terminate temp string
            xor     a : ld (currentindex),a                     ; reset current index for next run 
            pop     hl                                          ; pop hl off stack 
            ld      hl,stringtemp+2                                ; point to start of tempstring 
            ld      bc,0                                          ; b as length 

    genlenthtloop:
            ld      a,(hl) : or a : jr z,donelength : inc c : ld a,c : or a : jr z,donelength : inc hl : jr genlenthtloop 

    donelength:
            ld      hl,stringtemp : ld a,c : ld (hl),a : inc hl : ld a,b : ld (hl),a 
            ret                                             ; done ret
    
    countdelimters
            ld      c,a                                          ; save index count 
            ld      hl,totalindex
            ld      (hl),0
            ld      de,(source)
            ld      hl,needle
            ld      b,(hl)                                       ; pop needle into b 
    
    countdelimtersloop: 
            ld a,(de) : or a : jp z,indexcountdone          ; retrun if zero found
            cp b : jr z,increasedelimetercount        
            inc de 
            jr countdelimtersloop
    
    indexcountdone: 
            ld      a,(totalindex)
            cp      c
            jr      c,strfailed 
            ld      a,c
            ret  
    
    strfailed:
            pop     hl
            ld      hl,0
            ld      (stringtemp),hl
            ret 
    
    increasedelimetercount:
            ld      hl,totalindex
            inc     (hl)
			inc     de 
            jr      countdelimtersloop
    
    totalindex:
            db      0 
    
    currentindex:
            db      0     
    
    indextoget:
            db      0 

    source:
            dw      0000
    needle:
            db      "^"
            db      0 
			ENDP 
    end asm 

end sub 


sub fastcall PeekMemLen(address as uinteger,length as uinteger, outstring as string)
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
        push    hl 
        call .core.__MEM_FREE
        pop     hl 

        ld      de,stringtemp
        ; de = string data 
        ; hl = string 
        jp      .core.__STORE_STR

    end asm 

end sub 

asm 
    ; DE = points to the base 10 number null terminated string.
    ; HL <- 16 bit value of DE
    ; Fc <- carry set on error
    ; Modifies: A, BC
    ;
    ;     HL is the 16-bit value of the number
    ;     DE points to the byte after the number
    ;     z flag reset (nz)
    StringToNumber16:
            ld hl, 0				; init HL to zero
    .convLoop:
            ld a, (de)
            and a
            ret z					; null character exit

            sub $30					; take DE and subtract $30 (48 starting point for numbers in ascii)
            ret c					; if we have a carry, then we're

            scf					; set the carry flag to test-
            cp 10					; if A >= 10 then we also have an error
            jr nc, .error

            inc de

            ld b, h					; copy HL to BC
            ld c, l

            add hl, hl				; (HL * 4 + HL) * 2 = HL * 10
            add hl, hl
            add hl, bc
            add hl, hl

            add a, l
            ld l, a
            jr nc, .convLoop
            inc h
            jr .convLoop

    .error
            scf
            ret


    Asciito32:
    ;===============================================================
    ;Input:
    ;     DE points to the base 10 number string in RAM.
    ;Outputs:
    ;     HLIX is the 32-bit value of the number
    ;     DE points to the byte after the number
    ;     BC points to the start of the number
    ;     z flag means it ended on a decimal point.
    ;Destroys:
    ;     A (actually, add 30h and you get the ending token)
    ;     BC
    ;===============================================================
            ld      hl,0
            ld      ix,0
            push    de   ;save the pointer
            jr      .atoui32_start
    .atoui32_loop:
            inc     de
            ld      b,ixh
            ld      c,ixl
            push    hl
            add     ix,ix
            adc     hl,hl
            add     ix,ix
            adc     hl,hl
            inc     ix
            dec     ix
            add     ix,bc
            pop     bc
            adc     hl,bc
            add     ix,ix
            adc     hl,hl
            add     a,ixl
            ld      ixl,a
            jr      nc,.atoui32_start
            inc     ixh
            jr      nz,.atoui32_start
            inc     hl
    .atoui32_start:
            ld      a,(de)
            sub     30h
            cp      10
            jr      c,.atoui32_loop
            pop     bc
            ret
            

end asm 



' -------------------------------------------------------------------
' - SD ROUTINES 
' -------------------------------------------------------------------

date_buff:
    asm 
    _date_buff:
            db 0,0
    _time_buff:
            db 0,0
            db 0,0
    end asm 


' -------------------------------------------------------------------
' - WINDOW ROUTINES 
' -------------------------------------------------------------------

sub DrawScreen()

'    DrawWindow(@windows_1)
'    DrawWindow(@windows_2)
    DrawWindow(@windows_1)
    DrawWindow(@windows_2)
'    DrawWindow(@windows_3)
    
    poke $57fc,0           ' connection notification char in the lower right
    
end sub 

sub fastcall DrawWindow(window_src as uinteger)

    asm 
        ; 192 bytes 

        push    hl 
        pop     ix                      ; ix now points to window struct
      
    ; draw top and bottom line 

    ; this gets the relative x/y of the window 

        ld      a, (ix+0)               ; x
        dec     a 
        ld      e, (ix+1)               ; y
        dec     e 
        ld      d, 160                  ; y*160+x 
        mul     d, e 
        add     a, a                    ; *2 for x because of attribs 
        add     de, a                   ; store in de 
        ld      hl, TILE_MAPBASE*256    ; get the start of the tilemap 
        add     hl, de                  ; add de to start of tilemap 
        ld      a, (ix+4)               ; window colour 
        call    _get_colour             ; convert into c 

        ld      (_realtive_xy), hl      ; save base relative 
        ;   now the position in the window 
        ld      b, (ix+2)               ; width 
        ld      (hl), 7                 ; top left corner 
        inc     hl                      ; go to attrib 
        ld      (hl), c                 ; write colour byte
        inc     hl                      ; move to next 

        call    _win_horizontal
        ld      (hl), 8                 ; top right corner 
        inc     hl 
        ld      (hl), c 
        inc     hl 

        ld      hl,(_realtive_xy)
        ld      a, (ix+3)               ; height 
        inc     a 
        ld      e, a 
        ld      d, 160
        mul     d, e 
        add     hl, de 
        ld      b, (ix+2)               ; width 
        ld      (hl), 10
        inc     hl 
        ld      (hl), c 
        inc     hl 
        call    _win_horizontal
        ld      (hl), 9 
        inc     hl
        ld      (hl), c 

        ; vertical 
        ld      hl, (_realtive_xy)      ; back to 0,0 window relative 
        add     hl, 160                 ; next down line 
        ld      b, (ix+3)               ; height 
        call    _win_vertical
        ld      hl, (_realtive_xy)      ; back to 0,0 window relative 
        add     hl, 160
        ld      a, (ix+2)               ; width
        inc     a
        add     a, a                    ; x 2 
        add     hl, a 

        ld      b, (ix+3)               ; height
        call    _win_vertical

        ld      a, 106; (ix+4)               ; get colour for text 
        ;add     a, 106                   ; add offset for inverse 
        call    _get_colour             ; convert colour 

        ld      de, (_realtive_xy)      ; set de to top left + 2 
        add     de, 2                   
        push    ix 
        pop     hl                      ; hl = start of window data
        add     hl, 9                   ; move to window title 
        ld      b, 0 
    1:   
        ld      a,(hl)                  ; check is it the EOL marker 
        cp      $ff 
        jr      z, 4F                   ; exit if so 
        ldi                             ; copy hl > de title to window 
        inc     c                       ; +1 for because of LDI
        ld      a, c                    ; colour 
        ld      (de), a                 ; save attribute 
        inc     de                      ; move to attrib
        jr      1B                      ; repear until $ff 
    4:  ret                             ; done 

    _win_vertical: 
    3:
        ld      (hl), 18 
        inc     hl 
        ld      (hl), c 
        add     hl, 159
        djnz    3B 
        ret 

    _win_horizontal:
        ; > HL address
        ; > b width 						
    2:
        ld      (hl), 17 
        inc     hl
        ld      (hl), c 
        inc     hl
        djnz    2B 
        ret 

    _get_colour:
        and 	%01111111				; and 6 bits 
        rlca 
        ld      c, a 
        ret 
        
    _realtive_xy:
        db      0 
    end asm 


end sub 

' windows_1:
' asm    ;     0    1     2      3      4    5  6  7  8       9      10 
'         ; x pos y pos width height colour cx cy  bkg wintype title ; 8 bytes
'         db   1,   3,     66,   21,    6,   0, 0, 0,  0,      "NextChat", $ff 
'         db $ff,$ff 
' end asm 

' windows_2:
' asm 
'         ; x pos y pos width height colour cx cy  wintype title ; 8 bytes
'         db   1, 26,    78,   5,    4,   0,0,   0,0,    "Console", $ff 
'         db $ff,$ff 
' end asm 

' windows_3:
' asm 
'         ; x pos y pos width height colour cx cy  wintype title ; 8 bytes
'         db   69, 3,    10,   21,    6,   0,0,   0,0,    "Users", $ff 
'         db $ff,$ff 
' end asm 

windows_1:
asm    ;     0    1     2      3      4    5  6  7  8       9      10 
       ; x pos y pos width height colour cx cy  bkg wintype title ; 8 bytes
       db   1,   3,     78,   21,    42,   0, 0, 0,  0,      "Debug", $ff 
       db $ff,$ff 
end asm 

windows_2:
asm 
       ; x pos y pos width height colour cx cy  wintype title ; 8 bytes
       db   1, 26,    78,   5,    43,     0,0,   0,0,    "Console", $ff 
       db $ff,$ff 
end asm 

'' windows_3:
'' asm 
''         ; x pos y pos width height colour cx cy  wintype title ; 8 bytes
''         db   69, 3,    10,   21,    6,   0,0,   0,0,    "Users", $ff 
''         db $ff,$ff 
'' end asm 
''AddText(file$ )



' -------------------------------------------------------------------
' - END OF APP
' -------------------------------------------------------------------


border last_data_len
PlaySFX(255)
InitSFX(36)							            ' init the SFX engine, sfx are in bank 36
InitMusic(40,34,0000)				            ' init the music engine 33 has the player, 34 the pt3, 0000 the offset in bank 34
EnableSFX							            ' Enables the AYFX, use DisableSFX to top
NumbToAscii()
border curr_line_address
Ending:

sub backupsysvar() 

	asm 
		di 
		nextreg MMU7_E000_NR_57,90
		ld hl,$5C00
		ld de,$e000 
		ld bc,256
		ldir 
		
	end asm 
	asm
		nextreg MMU7_E000_NR_57,1
	end asm

end sub 

sub restoresys()

	asm 
	di 
		nextreg MMU7_E000_NR_57,90
		ld de,$5C00
		ld hl,$e000 
		ld bc,256
		ldir 
		nextreg MMU7_E000_NR_57,1
	end asm 	

end sub

ExitToBasic:
    restoresys()
	asm 
        BREAK 
		di 
		nextreg GLOBAL_TRANSPARENCY_NR_14,0 
		nextreg DISPLAY_CONTROL_NR_69,0				; L2 off 
		nextreg MMU2_4000_NR_52,10					; replace banks	
		nextreg MMU3_6000_NR_53,11					; replace banks 
		
        ld      a, $9 
        ld      i, a 
        im      1 
		ld 		hl,(23730)
		ld 		de,15
		sbc 	hl, de 
		ld 		bc,($+8)
		ld 		sp, hl 
		pop 	hl 

		 jp		$+18
		 
	end asm 

end 32 