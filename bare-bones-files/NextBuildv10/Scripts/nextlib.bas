' vim:ts=4:et:
' ---------------------------------------------------------
' NextLib v10 - David Saphier / em00k 2026
' Help and thanks Boriel, Flash, Baggers, Britlion, Shiru, Mike Daily 
' ---------------------------------------------------------

#ifndef __NEXTLIB__
#define __NEXTLIB__

#pragma push(case_insensitive)
#pragma case_insensitive = TRUE
#pragma zxnext = TRUE

#DEFINE         TRUE 1
#DEFINE         FALSE -1


asm 

    #include "nbs_constants.asm"
    di ; absolutely no interrupts 

end asm 

' Macros

#define NextReg(REG,VAL) \
    ASM\
    nextreg REG, VAL\
    END ASM 
    
#define OUTINB \
    Dw $90ED

#ifndef NOBREAK
        ' DB $c5,$DD,$01,$0,$0,$c1
#define BREAK \
        DB $FD,$00
    
'db $fd, $00      ' New Break in 3.1.5   
        
#define BBREAK \
        ASM\
        BREAK\
        END ASM 
#else 

#define BREAK \
        db 0 

#define BBREAK \
        REM     
        
#endif 

#define QUITEMU \
    ASM \
    DB $DD,00 \
    END ASM 
    
#define MUL_DE \
    DB $ED,$30\

#define SWAPNIB \
    DB $ED,$23

#define ADD_HL_A \
        DB $ED,$31\

#define PIXELADD \
        DB $ED,$94\

#define SETAE \
        DB $ED,$95\

#define PIXELDN \
        DB $ED,$93\

#define out_dma(value ) \
        db $ed, $71 ,value

#define TEST val \
        DB $ED,$27\
        DB val

#define ADDBC value \
        DB $ED,$36\
        DW value

#define ADDHLA \
        DB $ED,$31\

#define ADDDEA \
        DB $ED,$32\

#define ADDBCA \
        DB $ED,$33\

#define PUSHD value \
        DB $ED,$8A\
        DW value 
        
#define DIHALT \
        ASM\
        di\
        halt\
        end asm 

#define nnextreg reg,value\
        ASM\
        dw $92ed\
        db reg\
        db value\
        end asm\

#define nextregna reg \
        dw $92ed \
        db reg 

#define ESXDOS \
        rst 8   


#define getreg(REG) \
    db $3e,REG,$01,$3b,$24,$ed,$79,$04,$ed,$78  

#define ReenableInts \
    ld a,(.interrupt_enabled_flag) : or a : jr z,$+3 : ei       


#define EnableSFX \
    asm : ld a,1 : ld (sfxenablednl),a : end asm 


#define DisableSFX \
    asm : xor a : ld (sfxenablednl),a : end asm 

#define EnableMusic \
    asm : ld a,1 : ld (sfxenablednl+1),a : end asm 

#define DisableMusic \
    asm : ld a,0: ld (sfxenablednl+1),a : end asm 

#define NMI \
    asm : nextreg 2, 8 : end asm 

#define DNMI \
    nextreg 2, 8

#DEFINE PAGE_0000(A) \
    asm \
    nextreg $50,A \
    end asm 


#DEFINE PAGE_2000(A) \
    asm \
    nextreg $51,A \
    end asm 


#DEFINE PAGE_4000(A) \
    asm \
    nextreg $52,A \
    end asm 


#DEFINE PAGE_6000(A) \
    asm \
    nextreg $53,A \
    end asm 

#DEFINE PAGE_8000(A) \
    asm \
    nextreg $54,A \
    end asm 

#DEFINE PAGE_A000(A) \
    asm \
    nextreg $55,A \
    end asm 

#DEFINE PAGE_C000(A) \
    asm \
    nextreg $56,A \
    end asm 

#DEFINE PAGE_E000(A) \
    asm \
    nextreg $57,A \
    end asm 


' whether we start off dark with black, default 
#ifndef NODARK
    ' border 0 : paper 0: ink 7 : cls 
#endif 

'-----------------------------------------------------------------------------
' Functions 
'-----------------------------------------------------------------------------

#ifdef __NSTR
function fastcall NStr(ins as ulong) as string

    #DEFINE NSTR

    asm
    ; converts ulong (0-4294967295) to ASCII string, no leading zeros
    ; fastcall: value arrives in DE:HL (DE=high word, HL=low word)
    ; returns HL = pointer to heap string [len_lo][len_hi][chars...]

    PROC
    LOCAL Num1, Num2, storedigit, nst_finished

        push    de
        push    hl                  ; save 32-bit value on stack

        ld      bc, 14              ; alloc: 2 header + up to 10 digits + spare
        call    core.__MEM_ALLOC
        ld      a, h
        or      l
        pop     de                  ; DE = low word of number
        pop     bc                  ; BC = high word of number
        ret     z                   ; out of memory

        push    hl                  ; save alloc base for return
        inc     hl
        inc     hl                  ; skip past length header
        ld      (nstr_buf), hl      ; init write pointer

        ; store 32-bit value in memory
        ld      (nstr_val), de      ; low word
        ld      (nstr_val+2), bc    ; high word

        xor     a
        ld      (nstr_flag), a      ; clear leading-zero flag

        ; -1,000,000,000 ($C4653600)
        ld      de, $C465
        ld      bc, $3600
        call    Num1
        ; -100,000,000 ($FA0A1F00)
        ld      de, $FA0A
        ld      bc, $1F00
        call    Num1
        ; -10,000,000 ($FF676980)
        ld      de, $FF67
        ld      bc, $6980
        call    Num1
        ; -1,000,000 ($FFF0BDC0)
        ld      de, $FFF0
        ld      bc, $BDC0
        call    Num1
        ; -100,000 ($FFFE7960)
        ld      de, $FFFE
        ld      bc, $7960
        call    Num1
        ; -10,000 ($FFFFD8F0)
        ld      de, $FFFF
        ld      bc, $D8F0
        call    Num1
        ; -1,000 ($FFFFFC18)
        ld      de, $FFFF
        ld      bc, $FC18
        call    Num1
        ; -100 ($FFFFFF9C)
        ld      de, $FFFF
        ld      bc, $FF9C
        call    Num1
        ; -10 ($FFFFFFF6)
        ld      de, $FFFF
        ld      bc, $FFF6
        call    Num1

        ; ones digit - always store
        ld      hl, (nstr_val)
        ld      a, l
        add     a, '0'
        ld      de, (nstr_buf)
        ld      (de), a
        inc     de                  ; DE = one past last digit

        ; set string length header
        pop     hl                  ; HL = alloc base
        push    hl                  ; re-save for return
        inc     hl
        inc     hl                  ; HL = data area start
        ex      de, hl              ; HL = past-end, DE = data start
        or      a                   ; clear carry
        sbc     hl, de              ; HL = string length
        ex      de, hl              ; DE = length, HL = data start
        dec     hl
        dec     hl                  ; HL = alloc base
        ld      (hl), e             ; length lo
        inc     hl
        ld      (hl), d             ; length hi

        pop     hl                  ; HL = alloc base (return value)
        jp      nst_finished

    Num1:
        ld      a, '0' - 1
    Num2:
        inc     a
        ; 32-bit add: nstr_val += DE:BC (negative divisor)
        ld      hl, (nstr_val)
        add     hl, bc
        ld      (nstr_val), hl
        ld      hl, (nstr_val+2)
        adc     hl, de
        ld      (nstr_val+2), hl
        jr      c, Num2             ; carry = still positive, loop

        ; undo last subtraction: nstr_val -= DE:BC
        ld      hl, (nstr_val)
        or      a                   ; clear carry (A preserved)
        sbc     hl, bc
        ld      (nstr_val), hl
        ld      hl, (nstr_val+2)
        sbc     hl, de
        ld      (nstr_val+2), hl

        cp      '0'
        jr      nz, storedigit      ; non-zero digit: always store
        push    hl
        ld      hl, nstr_flag
        bit     0, (hl)
        pop     hl
        ret     z                   ; leading zero: skip
    storedigit:
        push    hl
        ld      hl, nstr_flag
        set     0, (hl)             ; mark started
        ld      hl, (nstr_buf)
        ld      (hl), a             ; store digit
        inc     hl
        ld      (nstr_buf), hl      ; advance write pointer
        pop     hl
        ret

    nstr_val:   dw 0, 0             ; 32-bit value (lo word, hi word)
    nstr_buf:   dw 0
    nstr_flag:  db 0

    #include once "mem/alloc.asm"

    nst_finished:
        ret
    ENDP

    end asm

end function

#ifdef __NSTR
    dim common$ as string = " "
#endif 
#endif 

function FASTCALL BinToString(num as ubyte) as String
    asm
        PROC
            push namespace core
            LOCAL END_CHAR
            LOCAL DIGIT
            LOCAL charloop
            LOCAL bitisset
            LOCAL nobitset
            push    af   ; save ubyte 
            ld      bc,10
            call    __MEM_ALLOC
            ld      a, h
            or      l
            pop     bc 
            ld      c,b 
            ret     z	; NO MEMORY

            push    hl	; Saves String ptr
            ld      (hl), 8
            inc     hl
            ld      (hl), 0
            inc     hl  ; 8 chars string length

            ; c holds out entry 8 bit value, b number of bits 

            ld      b,8
        charloop:
            call    DIGIT
            djnz    charloop 
            pop     hl	; Recovers string ptr
            ret

        DIGIT:
            ld      a,c
            bit     7,a
            jr      nz,bitisset 
            ld      a,'0'
            jr      nobitset
        bitisset:
            ld a,'1'
        nobitset:	

        END_CHAR:
            ld      (hl), a
            inc     hl
            ld      a,c 
            sla     c 
            ret
        ENDP
        pop namespace
    end asm 
end function


sub fastcall BankPoke(bank as ubyte, offset as uinteger, value as ubyte)
    ' bank poke with wrapping 0000-1fff
    asm 
            ex          (sp), hl
            pop         de 
            pop         de 
            ex          af, af'
            getreg($50)
            ex          af, af'
            nextreg     MMU0_0000_NR_50, a          ; set bank  
            ld          a, $3f                      ; wrap offset 0000-1fff  
            and         d 
            ld          d, a                        ; 
            pop         af 
            ld          (de), a                     ; write value 
            push        hl                          ; ret address 
            ex          af, af'
            nextreg     MMU0_0000_NR_50, a
            ex          af, af'
    end asm 
end sub 


function fastcall BankPeek(bank as ubyte, offset as uinteger) as ubyte
    ' bank poke with wrapping 0000-1fff
    asm 
            ex          (sp), hl
            pop         de 
            pop         de 
            ex          af, af'
            getreg($50)
            ex          af, af'
            nextreg     MMU0_0000_NR_50, a          ; set bank  
            ld          a, $3f                      ; wrap offset 0000-1fff  
            and         d 
            ld          d, a                        ; 
            ld          a, (de)                     ; read value 
            push        hl                          ; ret address 
            ex          af, af'
            nextreg     MMU0_0000_NR_50, a
            ex          af, af'
    end asm 
end function

sub fastcall BankPokeUint(bank as ubyte, offset as uinteger, value as uinteger)
    ' pokes uinteger to a bank with offset 0000 - 1ffff
    asm 
              
            ex          (sp), hl                    ; swap top of stack (ret) with hl 
            pop         de                          ; pop off the offset 
            pop         de                          ; discard 
            ex          af, af'
            getreg($50)
            ex          af, af'
            nextreg     MMU0_0000_NR_50, a          ; set bank  
            ld          a, $3f                      ; wrap offset 0000-1fff  
            and         d                           
            ld          d, a
            pop         bc
            ex          de,hl
            ld          (hl), c
            inc         hl
            ld          (hl), b
            push        de 
            ex          af, af'
            nextreg     MMU0_0000_NR_50, a
            ex          af, af'
    end asm 
end sub 


function fastcall BankPeekUint(bank as ubyte, offset as uinteger) as uinteger
    ' bank poke with wrapping 0000-1fff
    asm     

            ex          (sp), hl                    ; ret in hl
            pop         de                          ; offset 
            push        hl                          ; ret on stack
            ex          af, af'
            getreg($50)
            ex          af, af'
            nextreg     MMU0_0000_NR_50, a          ; set bank  
            ld          a, $3f                      ; wrap offset 0000-1fff  
            and         d 
            ld          d, a                        ; 
            ld          a, (de)                     ; read value 
            inc         de
            ld          l, a 
            ld          a, (de) 
            ld          h, a

            ex          af, af'
            nextreg     MMU0_0000_NR_50, a
            ex          af, af'
    end asm 
end function

sub fastcall RunAT(speed as ubyte)
    ' sets the CPU Speed 3.5,7,14,28Mhz
    asm 
        and     %00000011
        nextreg TURBO_CONTROL_NR_07,a
    end asm 
end sub 

Sub fastcall CopyToBanks(startb as ubyte, destb as ubyte, nrbanks as ubyte, copylen as uinteger=$2000, copystart as uinteger=$0, copydest as uinteger=$2000 )
 	asm
		exx : pop hl : exx 
		; a = start bank 			

        #ifndef IM2 
            call _check_interrupts
            di 
        #endif 

		ld 		c,a 					; store start bank in c 
		pop 	de 						; dest bank in e 
		ld 		e,c 					; d = source e = dest 

		pop 	af                      ; get nrbanks 
		ld 		b,a 					; number of loops 

		pop 	hl						; get copy length
		ld 		(copysize+1),hl 	    ; SMC for LDIR copy length 

        pop     hl                      ; source start 
        ld      (copy_start_addr+1),hl   ; store for later 
        
        pop     hl                      ; source start 
        ld      (copy_dest_addr+1),hl   ; store for later 

copy_bank_loop:	
		push 	bc
		push 	de 
        
		ld 		a,e
		nextreg $50,a
		ld 		a,d
		nextreg $51,a 

copy_dest_addr:
		ld 		de,$2000                ; dest address (smc from copydest, default $2000 = slot 1)

copy_start_addr:
		ld 		hl,$0000            ; address to srart copy from         
copysize:		
		ld 		bc,$2000
		ldir 
		pop 	de
		pop	 	bc
		inc 	d
		inc 	e
		djnz 	copy_bank_loop
		
		nextreg $50,$ff : nextreg $51,$ff
        #ifndef IM2 
            ReenableInts
        #endif 
		exx : push hl : exx : ret 

 	end asm  
end sub  
 

sub fastcall BankToRam(start_bank as ubyte, dest_mem as uinteger, dest_len as uinteger)
    asm 
        ; copies up to 16KB from a start bank
        nextreg MMU0_0000_NR_50, a          ; set bank
        inc     a 
        nextreg MMU1_2000_NR_51, a          ; set bank
        ex      (sp), hl                    ; ret in hl 
        pop     de 
        pop     de 
        pop     bc 
        push    hl 
        ld      hl,0
        ldir    
        nextreg $50,$ff : nextreg $51,$ff

    end asm 
end sub 

sub fastcall ClearBanks(startb as ubyte, number_of_banks as ubyte=1)
    asm 
        ;BREAK 
        ; clears 1 or more banks
        ex      (sp), hl                    ; ret in hl
        pop     de : pop bc
        push    hl  
        nextreg MMU0_0000_NR_50, a          ; set bank
    clear_bank_loop:
        push    bc 
        ld      bc, $1fff
        ld      hl, 0000
        ld      de, 0001
        ld      (hl), l
        ldir 
        pop     bc 
        dec     b 
        inc     a 
        nextreg MMU0_0000_NR_50, a          ; next bank
        djnz    clear_bank_loop
        nextreg MMU0_0000_NR_50, $ff        ; set bank
    end asm 
end sub 

Sub fastcall MMU8new(byval slot as ubyte, byval memorybank as ubyte)
    ' changes 8kb  slots valid slots 0-7 mapped as below 
    ' banks 16 - 223
    ' Area       16k 8k def 
    ' $0000-$1fff   1    0  ROM     ROM (255)               Normally ROM. Writes mappable by layer 2. IRQ and NMI routines here.
    ' $2000-$3fff        1              ROM (255)           Normally ROM. Writes mapped by Layer 2.
    ' $4000-$5fff   2    2  5           10                  Normally used for normal/shadow ULA screen.
    ' $6000-$7fff        3              11                  Timex ULA extended attribute/graphics area.
    ' $8000-$9fff   3    4  2           4                   Free RAM.
    ' $a000-$bfff        5              5                   Free RAM.
    ' $c000-$dfff   4    6  0           0                   Free RAM. Only this area is remappable by 128 memory management.
    ' $e000-$ffff        7  1                               Free RAM. Only this area is remappable by 128 memory management.
    '
    ' 16kb      8kb 
    ' 8-15      16-31       $060000-$07ffff 128K    Extra RAM
    ' 16-47     32-95       $080000-$0fffff 512K    1st extra IC RAM (available on unexpanded Next)
    ' 48-79     96-159  $100000-$17ffff 512K    2nd extra IC RAM (only available on expanded Next)
    ' 80-111    160-223 $180000-$1fffff 512K    3rd extra IC RAM (only available on expanded Next)'
    ' Fastcall a is first param, next on stack 
    asm     
        ;; break 
        PROC 
            LOCAL   NREG
            add     a,$50           ; A= 1st param so add $50 for MMU $50-$57
            ld      (NREG),a        ; store at NREG 
            pop     de              ; dont need this but need off the stack 
            pop     af              ; get second param in af, this will be the bank
            DW      $92ED           ; lets select correctly slot 
        NREG:       DB 0            ; 
            push    de              ; fix stack before leaving
        ENDP 
    end asm 
end sub 

'-----------------------------------------------------------------------------
' Sub Routines 
'-----------------------------------------------------------------------------

Sub MMU8(byval nn as ubyte, byval na as ubyte)
    asm     
        PROC 
            LOCAL NREG
            LD      a,(IX+5)        ; slot
            add     a,$50           ; NextREG $50 - $57 for slot 
            ld      (NREG),a        ; store at NREG 
            LD      a,(IX+7)        ; get memory bank selected
            DW      $92ED           ; lets select correctly slot 
            NREG:   DB 0            ; 
        ENDP 
    end asm 
end sub 

Sub fastcall MMU16(byval memorybank as ubyte)
    ' changes 16kb 128k style bank @ $c000, supports full ram
    ' now works slots 6 and 7 will be changed 
        ' asm 
        ' ; bank 16-31 32-95 96-159 169-223 
        ' ;; break  

        ' ld d,a                ; 4
        ' AND %00000111 ; 4
        ' ld bc,$7ffd       ; 10 
        ' out (c),a         ; 12 
        ' ;and 248
        ' ;ld (23388),a 
        ' ld a,d                ; 4 
        ' AND %11110000 ; 4
        ' SWAPNIB               ; 16
        ' ld b,$df          ; 7
        ' out (c),a         ; 12 = 73 t states                              
        
        ' end asm 
' old routine before optimization 
'       ; bank 16-31 32-95 96-159 169-223 
    asm 
        ld      a,(IX+5)            ; 19 ts
        AND     %00000111           ; 4
        ld      bc,$7ffd            ; 10 
        out     (c),a               ; 12 
        ld      a,(IX+5)            ; 19 
        AND     %11110000           ; 4
        srl     a                   ; 8 
        srl     a                   ; 8
        srl     a                   ; 8 
        srl     a                   ; 8 
        ld      bc,$dffd            ; 10 
        out     (c),a               ; 12 = 122
    end asm 

end sub  

Function fastcall GetMMU(byval slot as ubyte) as ubyte 
    asm 
        ld      bc,$243B            ; Register Select 
        add     a,$50               ; a = slot already so add $50 for slot regs 
        out     (c),a               ; 
        ld      bc,$253B            ; reg access 
        in      a,(c)
    end asm 
END function    

#DEFINE _checkints _check_interrupts

function fastcall check_interrupts() as ubyte 
asm 
    #ifndef NOINTCHECK
    PROC 
    LOCAL start, interrutps_disabled
    start:  
        ; Detect if interrupts were enabled 
        ; The value of IFF2 is copied to the P/V flag by LD A,I and LD A,R.
        ex      af,af'
        ld      a,i 
        ld      a,r 
        jp      po,interrutps_disabled 
        ld      a,1              ; ints on 
        ld      (.interrupt_enabled_flag),a
        ex      af,af'
        ret 
    interrutps_disabled:
        xor     a               ; ints off 
        ld      (.interrupt_enabled_flag),a    
        ex      af,af'
        ret 
    ENDP 
    #endif 
        ret 

    .interrupt_enabled_flag:
        db 1                    ; start with ints on

end asm 
end function

Function fastcall GetReg(byval slot as ubyte) as ubyte 
    asm     
        push    bc 
        ld      bc,$243B            ; Register Select 
        out     (c),a               ; 
        
        inc     b  
        in      a,(c)
        pop     bc 
    end asm 
END function  

#DEFINE ScrollerLayer2 ScrollLayer

Sub fastcall ScrollLayer(byval x as ubyte,byval y as ubyte)
    asm 
        PROC 
        pop     hl                  ; store ret address 
        nextreg $16,a               ; a has x 
        pop     af 
        nextreg $17,a               ; now a as y 
        push    hl 
        ENDP
    end asm
end sub 

SUB fastcall PlotL2(byVal X as ubyte, byval Y as ubyte, byval T as ubyte)

    asm 
        ; PlotL2 (c) 2020 David Saphier / em00k 
    PROC 
        plot_l2:
        LOCAL ._no_wrap
        ; call  _check_interrupts
        ; di
        ; BREAK      
        pop     hl      ; save return address off stack 
        ; pop   de 
        ld      e,a     ; put a into e
        ld      bc,LAYER2_ACCESS_PORT
        pop     af      ; pop stack into a = Y 
        ld      d,a     ; put into d
        and     $c0     ; yy00 0000
        cp      $c0
        jr      nz,._no_wrap
        xor     a
    ._no_wrap:
        ENDP 
    end asm 
LayerShadow:
    asm 
        or      3       ; yy00 0011
        out     (c),a   ; select 8k-bank    
        ld      a,d     ; yyyy yyyy
        and     63      ; 00yy yyyy 
        ld      d,a
        pop     af      ; get colour/map value off stack 
        ld      (de),a   ; set pixel value
    skip_wrap2: 
        ld      a,2     ; 0000 0010
        out     (c),a   ; Layer2 writes off 
        push    hl      ; restore return address
        ; ReenableInts
        ; ei
  END ASM 
end sub    

declare function PointL2(byVal X as ubyte, byval Y as ubyte) as ubyte

function fastcall PointL2(byVal X as ubyte, byval Y as ubyte) as ubyte

    asm 
        
        ; PointL2 (c) 2026 David Saphier / em00k
        point_l2:
        ; call  _check_interrupts
        ; di
        ; BREAK      
        pop     hl      ; save return address off stack 
        ; pop   de 
        ld      e,a     ; put a into e = x 
        ld      bc,LAYER2_ACCESS_PORT
        pop     af      ; pop stack into a = y
        ld      d,a     ; put into d = y 
        and     $c0     ; yy00 0000         ; first 48K of layer 2 in the bottom 48K
        or      %110    ; yy00 0101         ; L2 Visible & Enable Reads
        out     (c),a   ; select 8k-bank    
        ld      a,d     ; yyyy yyyy
        and     63      ; 00yy yyyy         ; wrap 64 lines
        ld      d,a     ; de now points to correct memory address
        ld      a,(de)  ; put colour value into a
        push    af      ; save af
        ld      a,2     ; 0000 0010
        out     (c),a   ; Layer2 writes off 
        pop     af 
        push    hl      ; restore return address
        ; ReenableInts
        ; ei
  END ASM 
end function

SUB fastcall PlotL2Shadow(byVal X as ubyte, byval Y as ubyte, byval T as ubyte)
    asm 
        ld      bc,LAYER2_ACCESS_PORT
        pop     hl      ; save return address 
        ld      e,a     ; put x into e
        pop     af      ; pop stack into a 
        ld      d,a     ; put y into d
        and     192     ; yy00 0000
        or      1       ; yy00 0011
        out     (c),a   ; select 8k-bank    
        ld      a,d     ; yyyy yyyy
        and     63      ; 00yy yyyy
        ld      d,a
        pop     af      ; get colour/map value 
        ld      (de),a  ; set pixel value
        ld      a,0     ; 0000 0010
        out     (c),a   ; writes off 
        push    hl      ; restore return address
    end asm 
end sub   

SUB fastcall CIRCLEL2(byval x as ubyte, byval y as ubyte, byval radius as ubyte, byval col as ubyte)

    ASM
        ;; break 
        PROC
        LOCAL __CIRCLEL2_LOOP
        LOCAL __CIRCLEL2_NEXT
        LOCAL __circle_col
        LOCAL circdone
        pop ix      ; return address off stack 
        ld e,a      ; x 
        pop af 
        ld d,a 
        pop af
        ld h,a
        pop af 
        ld (__circle_col+1),a
        
CIRCLEL2:
; __FASTCALL__ Entry: D, E = Y, X point of the center
; A = Radious
__CIRCLEL2:
        push de 
        ;ld h,a
        ld a, h
        exx
        pop de      ; D'E' = x0, y0
        ld h, a     ; H' = r

        ld c, e
        ld a, h
        add a, d
        ld b, a
        call __CIRCLEL2_PLOT    ; PLOT (x0, y0 + r)

        ld b, d
        ld a, h
        add a, e
        ld c, a
        call __CIRCLEL2_PLOT    ; PLOT (x0 + r, y0)

        ld c, e
        ld a, d
        sub h
        ld b, a
        call __CIRCLEL2_PLOT ; PLOT (x0, y0 - r)

        ld b, d
        ld a, e
        sub h
        ld c, a
        call __CIRCLEL2_PLOT ; PLOT (x0 - r, y0)

        exx
        ld b, 0     ; B = x = 0
        ld c, h     ; C = y = Radius
        ld hl, 1
        or a
        sbc hl, bc  ; HL = f = 1 - radius

        ex de, hl
        ld hl, 0
        or a
        sbc hl, bc  ; HL = -radius
        add hl, hl  ; HL = -2 * radius
        ex de, hl   ; DE = -2 * radius = ddF_y, HL = f

        xor a       ; A = ddF_x = 0
        ex af, af'  ; Saves it

__CIRCLEL2_LOOP:
        ld a, b
        cp c
        jp nc,circdone      ; Returns when x >= y

        bit 7, h    ; HL >= 0? : if (f >= 0)...
        jp nz, __CIRCLEL2_NEXT

        dec c       ; y--
        inc de
        inc de      ; ddF_y += 2

        add hl, de  ; f += ddF_y

__CIRCLEL2_NEXT:
        inc b       ; x++
        ex af, af'
        add a, 2    ; 1 Cycle faster than inc a, inc a

        inc hl      ; f++
        push af
        add a, l
        ld l, a
        ld a, h
        adc a, 0    ; f = f + ddF_x
        ld h, a
        pop af
        ex af, af'

        push bc 
        exx
        pop hl      ; H'L' = Y, X
        
        ld a, d
        add a, h
        ld b, a     ; B = y0 + y
        ld a, e
        add a, l
        ld c, a     ; C = x0 + x
        call __CIRCLEL2_PLOT ; plot(x0 + x, y0 + y)

        ld a, d
        add a, h
        ld b, a     ; B = y0 + y
        ld a, e
        sub l
        ld c, a     ; C = x0 - x
        call __CIRCLEL2_PLOT ; plot(x0 - x, y0 + y)

        ld a, d
        sub h
        ld b, a     ; B = y0 - y
        ld a, e
        add a, l
        ld c, a     ; C = x0 + x
        call __CIRCLEL2_PLOT ; plot(x0 + x, y0 - y)

        ld a, d
        sub h
        ld b, a     ; B = y0 - y
        ld a, e
        sub l
        ld c, a     ; C = x0 - x
        call __CIRCLEL2_PLOT ; plot(x0 - x, y0 - y)
        
        ld a, d
        add a, l
        ld b, a     ; B = y0 + x
        ld a, e 
        add a, h
        ld c, a     ; C = x0 + y
        call __CIRCLEL2_PLOT ; plot(x0 + y, y0 + x)
        
        ld a, d
        add a, l
        ld b, a     ; B = y0 + x
        ld a, e 
        sub h
        ld c, a     ; C = x0 - y
        call __CIRCLEL2_PLOT ; plot(x0 - y, y0 + x)

        ld a, d
        sub l
        ld b, a     ; B = y0 - x
        ld a, e 
        add a, h
        ld c, a     ; C = x0 + y
        call __CIRCLEL2_PLOT ; plot(x0 + y, y0 - x)

        ld a, d
        sub l
        ld b, a     ; B = y0 - x
        ld a, e 
        sub h
        ld c, a     ; C = x0 + y
        call __CIRCLEL2_PLOT ; plot(x0 - y, y0 - x)

        exx
        jp __CIRCLEL2_LOOP

__CIRCLEL2_PLOT:
        
        push de
        push af
        ld  e,c     ; put b into e x
        ld  d,b     ; put c into d y
        ld a,d
        ld  bc,$123B
        and 192     ; yy00 0000
        or  3       ; yy00 0011
        out (c),a   ; select 8k-bank    
        ld  a,d     ; yyyy yyyy
        and 63      ; 00yy yyyy
        ld  d,a
__circle_col:
        ld  a,255
        ld  (de),a   ; set pixel value
        ld  a,2     ; 0000 0010
        out (c),a   ; select ROM?
        
        pop af 
        pop de
        ret 
circdone:
        push ix 
    ;   ; break         
        ENDP
    END ASM 
end sub 

Sub fastcall NextRegA(reg as ubyte,value as ubyte)
    asm 
        PROC
        LOCAL   reg
        ld      (reg),a         ; 17 
        pop     hl              ; 10 
        pop     af              ; 10 
        DW $92ED                ; 20
    reg:    
        db      0   
        push    hl              ; 11        68 T (old 75t)
        ENDP 
    end asm
end sub 

sub fastcall swapbank(byVal bank as ubyte)
    asm
        ; classic 128k paging 
        di                  ; disable ints
        ld      e,a
        lD      a,(23388)
        AND     248
        OR      e           ; select bank e
        LD      BC,32765 
        LD      (23388),A
        OUT     (C),A
        EI
    END ASM 
end sub 

SUB zx7Unpack(source as uinteger, dest AS uinteger)
    ' dzx7 by einar saukas et al '
    ' source address, destination address 
    ASM 
    ;   push hl
    ;   push ix
    ;   LD L, (IX+4)
    ;   LD H, (IX+5)
        LD E, (IX+6)
        LD D, (IX+7)    
        call dzx7_turbo

        jp zx7end
                
        dzx7_turbo:
        ld      a, $80
        dzx7s_copy_byte_loop:
        ldi                             ; copy literal byte
        dzx7s_main_loop:
        call    dzx7s_next_bit
        jr      nc, dzx7s_copy_byte_loop ; next bit indicates either literal or sequence

        ; determine number of bits used for length (Elias gamma coding)
        push    de
        ld      bc, 0
        ld      d, b
        dzx7s_len_size_loop:
        inc     d
        call    dzx7s_next_bit
        jr      nc, dzx7s_len_size_loop

        ; determine length
        dzx7s_len_value_loop:
        call    nc, dzx7s_next_bit
        rl      c
        rl      b
        jr      c, dzx7s_exit           ; check end marker
        dec     d
        jr      nz, dzx7s_len_value_loop
        inc     bc                      ; adjust length

        ; determine offset
        ld      e, (hl)                 ; load offset flag (1 bit) + offset value (7 bits)
        inc     hl
        defb    $cb, $33                ; opcode for undocumented instruction "SLL E" aka "SLS E"
        jr      nc, dzx7s_offset_end    ; if offset flag is set, load 4 extra bits
        ld      d, $10                  ; bit marker to load 4 bits
        dzx7s_rld_next_bit:
        call    dzx7s_next_bit
        rl      d                       ; insert next bit into D
        jr      nc, dzx7s_rld_next_bit  ; repeat 4 times, until bit marker is out
        inc     d                       ; add 128 to DE
        srl d           ; retrieve fourth bit from D
        dzx7s_offset_end:
        rr      e                       ; insert fourth bit into E

        ; copy previous sequence
        ex      (sp), hl                ; store source, restore destination
        push    hl                      ; store destination
        sbc     hl, de                  ; HL = destination - offset - 1
        pop     de                      ; DE = destination
        ldir
        dzx7s_exit:
        pop     hl                      ; restore source address (compressed data)
        jr      nc, dzx7s_main_loop
        dzx7s_next_bit:
        add     a, a                    ; check next bit
        ret     nz                      ; no more bits left?
        ld      a, (hl)                 ; load another group of 8 bits
        inc     hl
        rla
        ret
        zx7end:
    ;   pop ix
    ;   pop hl
    END ASM 
    
end sub

Sub InitSprites(byVal Total as ubyte, spraddress as uinteger, bank as uinteger=0)
    ' uploads sprites from memory location to sprite memory 
    ' Total = number of sprites, spraddess memory address 
    ' works for both 8 and 4 bit sprites 
    asm  

        ld      d,(IX+5)                                                    ; d = Total sprites to upload
        
        xor     a                                                           ; clear a to 0 and point to 
        ld      bc, SPRITE_STATUS_SLOT_SELECT_P_303B                        ; first sprite 
        out     (c), a

        ; let check if a bank was set ? 
        

        ld      b,d                                                         ; how many sprites to send 

        ld      l, (IX+6)                                                   ; hl = spraddress 
        ld      h, (IX+7)

    sploop:

        push    bc
        ld      bc,$005b                    
        otir
        pop     bc 
        djnz    sploop

    end asm 

end sub 

Sub fastcall InitSprites2(byVal Total as ubyte, spraddress as uinteger,bank as ubyte, sprite as ubyte=0)
    ' uploads sprites from memory location to sprite memory 
    ' Total = number of sprites, spraddess memory address, optinal bank parameter to page into slot 0/1 
    ' works for both 8 and 4 bit sprites 

    asm  
        PROC
        LOCAL spr_nobank, spr_address, sploop, sp_out
       ; BREAK
         
        ld      (spr_address+1), hl                                         ; save spr_address  16 T    3bytes 
        exx     
        pop     hl
        exx                                                                 ; save ret address  18 T  3bytes , 36 T with exx : push hl : exx   

        ld      d, a                                                        ; save Total sprites from a to d 

        ; let check if a bank was set ? 
        pop     hl                                                          ; address off stack 
        pop     af 
        nextreg $50,a                                                       ; setting slot 0 to a bank  
        inc     a 
        nextreg $51,a                                                       ; setting slot 1 to a bank + 1 

        pop     af                                                          ; clear a to 0 and point to 
        ld      bc, SPRITE_STATUS_SLOT_SELECT_P_303B                        ; first sprite 
        out     (c), a

    spr_nobank:

        ld      b,d                                                         ; how many sprites to send 

    spr_address: 
        ld      hl,0                                                        ; smc from above 

    sploop:                                                                 ; sprite upload loop 

        push    bc
        ld      bc,$005b                    
        otir
        pop     bc 
        djnz    sploop

        nextreg $50, $FF                                                    ; restore rom 
        nextreg $51, $FF                                                    ; restore rom 

    sp_out:
        exx    
        push    hl 
        exx 
        
        ENDP 

    end asm 

end sub

sub fastcall ShowSprites(flag as ubyte)
    asm 
        ; Show or hides sprites 
        ; mask out the top 6 bits 
        and     1
        ld      e, a              ; save flag into e 
        getreg($15)              ; a = current sprite control 
        and     %1111_1110
        or      e                 ; xor the flag with the current sprite control 
        nextreg SPRITE_CONTROL_NR_15,a
    end asm 
end sub 

sub RemoveSprite(spriteid AS UBYTE, visible as ubyte)
    
    asm 

        push    bc 
        ld      a,(IX+5)                ; get ID spriteid
        ld      bc, $303b               ; selct sprite  
        out     (c), a
        ld      bc, $57                 ; sprite port  

        ; REM now send 4 bytes 

        xor     a                       ; get x and send byte 1
        out     (c), a                  ;   X POS 
        out     (c), a                  ;   X POS
        out     (c), a 
        ld      a,(IX+7)                ; Sprite visible and show pattern #0 byte 4
        out     (c), a
        pop     bc 

    end asm 

end sub           

sub UpdateSprite(ByVal x AS uinteger,ByVal y AS UBYTE,ByVal spriteid AS UBYTE,ByVal pattern AS UBYTE,ByVal mflip as ubyte=0,ByVal anchor as ubyte=0)
    '                  5                    7              9                     11                   13                   15                       17          
    '  http://devnext.referata.com/wiki/Sprite_Attribute_Upload
    '  Uploads attributes of the sprite slot selected by Sprite Status/Slot Select ($303B). 
    ' Attributes are in 4 byte blocks sent in the following order; after sending 4 bytes the address auto-increments to the next sprite. 
    ' This auto-increment is independent of other sprite ports. The 4 bytes are as follows:

    ' Byte 1 is the low bits of the X position. Legal X positions are 0-319 if sprites are allowed over the border or 32-287 if not. The MSB is in byte 3.
    ' Byte 2 is the Y position. Legal Y positions are 0-255 if sprites are allowed over the border or 32-223 if not.
    ' Byte 3 is bitmapped:

    ' Bit   Description
    ' 4-7   Palette offset, added to each palette index from pattern before drawing
    ' 3 Enable X mirror
    ' 2 Enable Y mirror
    ' 1 Enable rotation
    ' 0 MSB of X coordinate
    ' Byte 4 is also bitmapped:
    ' 
    ' Bit   Description
    ' 7 Enable visibility
    ' 6 Reserved
    ' 5-0   Pattern index ("Name")

    ASM 
        ;               
        ;               X   Y ID  Pa 
        ;              45   7  9  11 13 15
        ;               0   1  0  3  2  4
        ; UpdateSprite(32 ,32 ,1 ,1 ,0 ,6<<1)
        ld a,(IX+9)         ;19                     ; get ID spriteid
        ld bc, $303b        ;10                     ; selct sprite slot 
        ; sprite 
        out (c), a          ;12
        
        ld bc, $57          ;10                     ; sprite control port 
        ld a,(IX+4)         ;19                     ; attr 0 = x  (msb in byte 3)
        out (c), a          ;12         
        
        ld a,(IX+7)         ;19                     ; attr 1 = y  (msb in optional byte 5)
        out (c), a          ;12
        
        ld d,(IX+13)        ;19                     ; attr 2 = now palette offset and no rotate and mirrors flags send  byte 3 and the MSB of X 
        ;or (IX+5)          ;19 
        
        ld a,(IX+5)         ;19                     ; msb of x 
        and 1               ;7
        or d                ;4
        out (c), a          ;12                 ; attr 3 
        
        
        ld a,(IX+11)        ;19                     ; attr 4 = Sprite visible and show pattern
        or 192              ;7                      ; bit 7 for visibility bit 6 for 4 bit  

        out (c), a          ;12
        ld a,(IX+15)        ;19                     ; attr 5 the sub-pattern displayed is selected by "N6" bit in 5th sprite-attribute byte.
        out (c), a          ;12                     ; att 
        ; 243 T     
    END ASM 
end sub

' sub LoadBMPOld(byval fname as STRING)

'         dim pos as ulong
        
'         pos = 1024+54+16384*2

'         asm 
'                 ld a,1
'                 ld (loadbank),a
'                 DW $91ed,$2456
'                 DW $91ed,$2557
'         keeploading:

'         end asm 
'         '
        
'         LoadSD(fname, $c000, $4000, pos)                 'dump its contents to the screen
'         pos=pos-16384
    
'         asm 
                
'                 ld bc, $123b
'                 ld a,(loadbank)
'                 or %00000001
'                 out (c),a
'                 ld  bc,$4000        ;we need to copy it backwards
'                 ld  hl,$FFFF        ;start at $ffff
'                 ld c,64             ; 64 lines per third 
'                 ld de,255           ; start top right 
'         ownlddr:
'                 ld b,0              ; b=256 loops 
'         innderlddr:
                
'                 ld a,(hl)           
'                 ld (de),a           ; put a in (de)
'                 ;and %00000101      ; for border effect 
'                 ;out ($fe),a
                
'                 dec hl              ; dec hl and de 
'                 dec de                  
'                 djnz innderlddr     ; has b=0 again?
'                 inc d               ; else inc d 256*2
'                 inc d           
'                 dec bc              ; dec bc b=0 if we're here 
'                 ld a,b              ; a into b 
'                 or c                ; or outer loop c with a
'                 jp nz,ownlddr       ; both a and c are not zero 

'                 ld a, 0             ; enable write  
'                 ld bc, $123b        ; set port for writing  
'                 out (c), a
                
'                 ld a,(loadbank)
'                 add a,$40
'                 ld (loadbank),a
'                 cp $c1
'                 jp nz,keeploading
                
'                 jp endingn
'         loadbank:
'                 db 0
'         endingn:
'                 ld a,0
'                 ld (loadbank),a 
'                 Dw $91ed,$0056
'                 Dw $91ed,$0157
'         end asm
        
' end sub 

sub LoadBMP(byval fname as STRING)

    'dim pos as ulong
    
    'pos = 1024+54+16384*2

    asm 
        PROC 
        LOCAL outstack, eosadd, outbank, tstack, loadbmploop, flip_layer2lines, copyloop, decd
        LOCAL startoffset, L2offsetpos, thandle, offset, loadbmpend
            call _check_interrupts
            di 
            ;ld (outstack+1),sp
            ;ld sp,tstack
            push ix  
            getreg($52)                     ; a = current $4000 bank 
            ld (outbank+3),a                    ; 
            ld a,(IX+7)
            ld (flip),a 
            ;
            ; hl address 
            ld a,(hl)
            add hl,2 
            push hl     
            add hl,a 
            ld (eosadd+1),hl
            ld a,(hl)
            ld (eosadd+4),a  
            ld (hl),0 
            pop ix 

            ;xor a      
            ;rst $08
            ;db $89                 ; M_GETSETDRV equ $89
            ld a, '*'                       ; use current drive

            ld b, FA_READ                   ; set mode
            ESXDOS : db F_OPEN  
            ; a = handle    
            ld (thandle),a  
            getreg($12)                         ; get L2 start 
            add a,a     
            ld (startbank),a                    ; start bank of L2 
            ld b,7                          ; loops 8 times 
            ld c,a 
        
loadbmploop:
            ld a,c                          ; get the bank in c and put in a 
            nextreg $52,a                   ; set mmu slot 2 to bank L2bank ($4000-5fff)
            inc c   
            push bc 
            
            ; now seek 
            ld a,(thandle)
            ld ixl,0 
            ld l,0 
            ld bc,0
            ld de,(L2offsetpos)
            ESXDOS : db F_SEEK
            
            ; now read 
            ld a,(thandle)
            ld ix,$4000
            ld bc,$2000
            ESXDOS : db F_READ 
            
            ;ld a,(flip)
            ;or a 
            call flip_layer2lines
            
            ld hl,(L2offsetpos)
            ld de,$2000 
            sbc hl,de
            ld (L2offsetpos),hl
            
            pop bc 
            djnz loadbmploop 
            
            ld a,(thandle)
            ESXDOS : db F_CLOSE
            
            ld hl,startoffset
            ld (L2offsetpos),hl 
            
outbank:
            nextreg $52,0
eosadd:
            ld hl,000
            ld (hl),0 
            pop ix 
outstack: 
            ;ld sp,0
            ReenableInts
            jp loadbmpend

flip_layer2lines:
    
            ; $4000 - $5fff Layer2 BMP data loaded 
            ; the data is upside down so we need to flip line 0 - 32
            ; hl = top line first left pixel, de = bottom line, first left pixel 
            ld hl,$4000 : ld de,$5f00 : ld bc,$1000
    
copyloop:   
            ld a,(hl)                       ; hl is the top lines, get the value into a
            ex af,af'                       ; swap to shadow a reg 
            ld a,(de)                       ; de is bottom lines, get value in a 
            ld (hl),a                       ; put this value into hl 
            ex af,af'                       ; swap back shadow reg 
            ld (de),a                       ; put the value into de 
            inc hl                          ; inc hl to next byte 
            inc e                           ; only inc e as we have to go left to right then up with d 
            call z,decd                 ; it did do we need to dec d 
            dec bc                          ; dec bc for our loop 
            ld a,b                          ; has bc = 0 ?
            or c
            jr nz,copyloop                  ; no carry on until it does 
            
            ret 
decd:
            dec d                           ; this decreases d to move a line up 
            ret                 

startoffset equ 1078+16384+16384+8192       
        
L2offsetpos:
            dw startoffset
    
startbank:
            db 32
            ds 8
tstack: 
            db 0 
flip:       db 0 
            
thandle:
            db 0 
offset: 
            dw 0 
loadbmpend:
        ENDP 
    end asm 
            
end sub 

Function ReserveBank() as ubyte 
    ' This routine requests a free memory bank from NextZXOS APU
    ' If NextZXOS is not running it will send back 223
    asm 
        reservebank:
            ld      hl,$0001    ; H=banktype (ZX=0, 1=MMC); L=reason (1=allocate)
            exx
            ld      c,7             ; RAM 7 required for most IDEDOS calls
            ld      de,$01bd    ; IDE_BANK
            rst     $8:defb $94 ; M_P3DOS
            jp      nc,failed
            ld      a,e 
            jr      notfailed
        bank:
            db      223
        failed:             ; added this for when working in CSpect in
            ld      a,255

        notfailed:                  
    end asm                 
end function                
                

sub FreeBank(bank as ubyte)
    ' marks a memory bank as freed that was reserved with ReserveBank()
    asm         
freebank:   
            ld      hl,$0003    ; H=banktype (ZX=0, 1=MMC); L=reason (3=release)
            ld      e,a
            exx
            ld      c,7         ; RAM 7 required for most IDEDOS calls
            ld      de,$01bd    ; IDE_BANK
            rst $8  
            defb    $94         ; M_P3DOS
            ; jr notfailed
    end asm 
end sub  

#ifndef NEX
Sub LoadSDBank(byval filen as String,ByVal address as uinteger,ByVal length as uinteger,ByVal offset as ulong, bank as ubyte)
    'filen = "myfile.bin"
    'address = address to load to must be $0  
    'length to load, set to 0 to autodetect 
    'offset into file 
    'bank
    '; current slots 2 is stored 
    '; bank is paged into slot 2
    '; will continue to loop and increase bank every 8kb 
    '; uses string in ram passed so doesnt need to copy the fname 

        
        asm         ;en00k 2020 / David Saphier 
        PROC
        LOCAL initdrive, filehandle, error, mloop, fileseek
        LOCAL loadsdout, filesize, printrst, failed, slot6
        LOCAL fixstring, offset

        call _check_interrupts
        di
        
        ld d,(IX+5) : ld e,(IX+4) : ex de,hl        ; this gets the string sent
        ld a,(hl) : ld b,a : add hl,2 
        ld (nameaddress),hl 
        
        push hl                                     ; start of dtring in memory 

        add hl,a : ld a,(hl) : ld (hl),0            ; ensures end is zero 
        ld (fixstring+1),hl : ld (fixstring+4),a 
        pop hl 
        push ix 
        push hl 
        ;; break
        ;ld (endofloadsdbank+1),sp              ; move stack to temp
        ;ld sp,endfilename-2                        ; because we're paging $4000-$5fff
        
        ; get current regs from $52
        ld a,$52                                ; mmu slot 6 
        ld bc,$243B                             ; Register Select 
        out(c),a                                    ; read reg 
        inc b       
        in a,(c)        
        ld (slot6+1),a                          ; store bank
         
        ; store the address, len, offset values in ram with smc 
        
ldadd:  ld c,(ix+6) : ld b,(ix+7)               ; address 
        ld a,b : and 127 : or $40 : ld b,a : ld (address+2),bc
        
        ld c,(ix+8) : ld b,(ix+9)               ; size 
        ld (loadsize+1),bc                      ; if size is 0 then we will detect
        ld a,b : add a,c : ld (changesize+1),a 
        
        ld l,(ix+10) : ld h,(ix+11)         
        ld (offset+1),hl                            ; offset DE     

        ld l,(ix+12) : ld h,(ix+13)                     
        ld (offset+4),hl                            ; offset BE 

        ld l,(ix-4) : ld h,(ix-3)                   ; filespec 
        
        ld a,(ix+15)                                ; get our custom bank 
        ld (curbank),a 
        nextreg $52,a
        
        push hl : pop ix 
        ;ld ix,.LABEL._filename
        ld (nameaddressfname+2),hl 
        
initdrive:
        ld a, '*'   
        ld b, FA_READ
        ; ix = filespec 
        ESXDOS : db F_OPEN
        ld (filehandle),a           ; store file handle 
        ; this is where we should handle an error 
        jp c,error                  ; c flag had an error.  

fstat:  ld ix, fileinfobuffer
        ESXDOS : db F_STAT
        jp c,error                  ; c flag had an error.  
        
changesize:
        ld a,0 : or a : call z,filesize0
        
        ld a,(filehandle) 
fileseek:
        ld ixl,0                        ; start  
        ld l,0                      ; cspect bug?
offset:     ld de,0000                  ; filled in at start ldadd
        ld bc,0000
        ESXDOS : db F_SEEK          ; seek 
        jp c,error                  ; c flag had an error.  
address: 
        ld ix,0000      
loadsize:       
        ld bc,0000              ; length to load from BC in stack 
loadagain:
        
        ld a,(filehandle)           ; read to address 
        ESXDOS : db $9d

        jp c,error                  ; c flag had an error. 
        ld (filesize),bc            ; bc read bytes 
        
        ld a,$20 : cp b : jr nz,loadsdout
        ld a,(curbank) : inc a : ld (curbank),a  : nextreg $52,a 
        jr loadagain
        
filesize0:
        ld bc,(fileinfobuffer+7)
        ld a,b
        ld (filesize),a
        ld a,c
        ld (filesize+1),a
        ld bc,$2000 
        ld (loadsize+1),bc 
        ret 
        
fileinfobuffer:
        ds 11,0         ; this will contain the file info
filehandle:
        db 0 
curbank:
        db 0 
end asm 
filesize2:
    asm 
filesize:
        dw 00,00,$FF
nameaddress: 
        dw 0000 
    error:
        nextreg $69,0                   ; turn off layer 2 
        ld a,(slot6+1) : nextreg $52,a  ; bring back slot 2 
        ld b,60
        ld ix,failed : call printrst
nameaddressfname:       
        ld ix,.LABEL._filename : call printrst
    mloop:
        ld a,0 : out (254),a : ld a,2 : out (254),a  : djnz mloop : jp mloop
printrst:
        ld a,(ix+0) : or a : ret z : rst 16 : inc ix : jp printrst
failed: 
        db 16,2,17,6
        db "Failed to open : ",13,0     
        
loadsdout:
        ld a,(filehandle)
        ESXDOS : db F_CLOSE     ; done, close file 
    
slot6:  ld a,0 : nextreg $52,a
fixstring:
        ld hl,0000              ; smc from above 
        ld (hl),0   
endofloadsdbank:
        ;ld sp,0000
        pop hl                  ; restore hl 
        pop ix                  ; restore ix 
        ReenableInts
        ENDP
    end asm 
end sub 
#else
    #define LoadSDBank(arga,argb,argc,argd,arge) \
        
#endif

Sub LoadSD(byval filen as String,ByVal address as uinteger,ByVal length as uinteger,ByVal offset as ulong)

        asm             
        PROC
        LOCAL initdrive, filehandle,error, fileopen, divfix, fileseek, fileread, loadsdout
        LOCAL fnloop
        ; call _check_interrupts
        ; di
        nextreg $50, $ff
        nextreg $51, $ff
        ld h,(IX+5) : ld l,(IX+4)
        ld de,.LABEL._filename
        ld a,(hl) : ld b,a : add hl,2 
 fnloop:        
         ldi :  djnz fnloop : ldi : 
         xor a: ld (de),a
         ld     (file_result), a 
carryon:         
        
        push ix 
        push hl

        ld e,(ix+6)             ; address 
        ld d,(ix+7)
        ld c,(ix+8)             ; size 
        ld b,(ix+9)
        ld l,(ix+10)
        ld h,(ix+11)            ; offset 
        push bc                 ; store size 
        push de                 ; srote address 
        push hl                 ; offset 32bit 1111xxxx
        ld l,(ix+12)
        ld h,(ix+13)            ; offset xxxx1111
        push hl                 ; offset        
        
    initdrive:
        xor a       
        ESXDOS
        db M_GETSETDRV          ; M_GETSETDRV equ $89
        ld (filehandle),a

        ld ix,.LABEL._filename 
        call fileopen
        ld a,(filehandle) 
        ; or a
        ; bug in divmmc requries us to read a byte first 
        ; at thie point stack = offset 
        ; stack +2 = address 
        ; stack +4 = length to load 
        
        ld a,(filehandle) 
divfix: 
        ld bc,1                 ; FMODE_READ = #01
        ld ix,0                 
        ESXDOS                  ; read a byte 
        db F_READ               ; read bytes 
    
        ld a,(filehandle) 

fileseek:
        ld ixl,0
        ld l,0                  ; start  
        pop bc 
        pop de                  ; offset into de 
        ESXDOS          
        db F_SEEK               ; seek 
        pop ix                  ; address to load from DE in stack 
        pop bc                  ; length to load from BC in stack 
    
    fileread:                           
        jp c,error 
        ld a,(filehandle) 
        ESXDOS
        db F_READ               ; read bytes 
        ; bc read bytes 
        ld (filesize),bc 
        jp loadsdout

    filehandle:
        db 0        
    end asm 

filesize:
    asm 
    filesize:
        dw 0000
    end asm
file_result:
    asm:
    file_result:
        db 0 

    error:
        ld  a, 255 
        ld  (file_result), a            ; write error flag <> 0 
        xor a 
        ld (filesize),a                 ; clear filesize 
        ld (filesize+1),a 
    #ifdef DEBUG
        LOCAL mloop, printrst, failed 
        nextreg $69,0
        ld b,60
        ld ix,failed
        call printrst
        ld ix,.LABEL._filename
        call printrst
    mloop:
        ld a,0
        out (254),a
        ld a,2
        out (254),a 
        ;halt 
        djnz mloop
        jp mloop
    printrst:
        ld a,(ix+0) : or a : ret z : rst 16 : inc ix : jp printrst
    failed: 
        db 16,2,17,6
        db "Failed to open : ",13,0     
    #else 
        jp loadsdout
    #endif  
fileopen:       
        ld b,$01                ; mode 1 read 
        push ix
        pop hl
        ESXDOS
        db F_OPEN
        ld (filehandle),a
        ret
    
    loadsdout:
        ld a,(filehandle)
        or a
        ESXDOS
        db F_CLOSE          ; done, close file 
    loadsdout2: 
        pop hl
        pop ix              ; restore stack n stuff
        ENDP
        ; ReenableInts
    end asm 

end sub 

Sub SaveSD(byval filen as String,ByVal address as uinteger,ByVal length as uinteger)
    #DEFINE FILEOPS
    ' 
    ' saves to SD filen=filename address=start address to save lenght=number of bytes to save  
    '
    dim tlen as uinteger
    filen = filen + chr(0)
    tlen=len(filen)+1
    'dim cco as ubyte=0
    for nbx=0 to tlen
        'if code(filen(cco))>32
        poke @filename+nbx,code (filen(nbx))
        'cco=cco+1
        'endif 
    next 
    poke @filename+nbx+1,0

    asm 
        PROC
        ; ; break 
        LOCAL initdrive
        LOCAL filehandle
        LOCAL error
        LOCAL fileopen
        LOCAL mloop

        push ix                     ; both needed for returning nicely 
        push hl
        ld e,(ix+6)                 ; address in to de 
        ld d,(ix+7)
        ld c,(ix+8)                 ; size in to bc 
        ld b,(ix+9)
        ;ld l,(ix+10)               ; for offset but not used here
        ;ld h,(ix+11)               ; offset 
        push bc                     ; store size 
        push de                     ; srote address 
    ;   push hl                     ; offset 
        
    initdrive:
        xor a       
        rst $08
        db $89                      ; M_GETSETDRV = $89
        ld (filehandle),a           ; store filehandle from a to filehandle buffer 

        ld ix,.LABEL._filename  ; load ix with filename buffer address 
        call fileopen               ; open 
        ld a,(filehandle)           ; make sure a had filehandle again 
        ;or a
        
        ; not needed here but may add back in to save on an offset ....
        ; bug in divmmc requries us to read a byte first 
        ; at thie point stack = offset 
        ; stack +2 = address 
        ; stack +4 = length to SAVE 
        
        ;divfix:    
        ;   ld bc,1
        ;   ld ix,0                 
        ;   rst $08                 ; read a byte 
        ;   db $9d                  ; read bytes 

        ;ld a,(filehandle) 
        
    ;fileseek:
    
        ;ld l,0                     ; start  
        ;ld bc,0                    ; highword
        
        ;pop de                     ; offset into de 

        ;rst $08                
        ;db $9f                     ; seek 
        pop ix                      ; address to Save from DE in stack 
        pop bc                      ; length to SAVE from BC in stack 
        call filewrite
        jp savesdout
        
    filewrite:

        db 62                       ; read 
        
    filehandle:
        db 0                        
        or a                        
        jp z,error
        rst $08
        db $9e                      ; write bytes 
        ret 
        
        jp savesdout

    error:
        ld b,5
    mloop:
        ld a,2
        out (254),a
        ld a,7
        out (254),a
        djnz mloop
        jp savesdout

    fileopen:       
        
        ld b,$e                 ; mode write
        ;db 33                      ; open 
        ;ld b,$0c
        push ix
        pop hl
    ;   ld a,42
        rst $08
        db $9a                      ; F_OPEN 
        ld (filehandle),a
        ret
    
    savesdout:
        
        ld a,(filehandle)
        or a
        rst $08
        db $9b                  ; done, close file 
        
        pop hl
        pop ix                  ; restore stack n stuff
    ENDP 
    
    end asm 

end sub 

SUB DoTileBank16(byVal X as ubyte, byval Y as ubyte, byval T as ubyte, byval B as ubyte)
    ' X 0 -15 Y 0 -11 T tile 0 - 255 B = bank tiles are loaded in  
    ASM 
        ;PUSH IX 
        ; Grab xyt  
        PROC 
        LOCAL tbanks    
        #ifndef IM2 
            call _check_interrupts
            di 
        #endif 
        ld a,$52 : ld bc,$243B : out(c),a : inc b : in a,(c)    
        ld (tbanks+3),a 

        ld h,(IX+11)            ; bank 
        ld a,(IX+9)             ; tile 
        ; 0010 0000
        swapnib 
        ; 0000 0010
        rrca : and %111 
        add a,h 

        nextreg $52,a 
        ld a,(IX+9)     ; tile 
        ;and 63
        ld b,(IX+7)     ; y 
        ld c,(IX+5)     ; x 
    ; tile data @ $4000
        ;----------------
        ; Original code by Michael Ware adjusted to work with ZXB
        ; Plot tile to layer 2
        ; in - bc = y/x tile coordinate (0-11, 0-15)
        ; in - a = number of tile to display
        ;---------------- 
    PlotTile16:
         
        ex af,af'
        ld a,b          ; put y into a 
        SWAPNIB         ; * 16 
        ld d,a          ; put new y into d 
        ld a,c          ; get x into a 
        SWAPNIB         ; * 16
        ld e,a          ; now put new x into e 
        ld a,d          ; bring bank d 
        and 192         ; we start at $4000
        or 3            ; enable  l2 
        ld hl,shadowlayerbit
        or (hl)
        ld bc,LAYER2_ACCESS_PORT
        out (c),a               ; select bank
        ex af, af'
        and 31                  
        or $40                  ; tiles start from $4000
        
        ld h,a 
        ld l,0                  ; put tile number * 256 into hl.
        ld a,d 
        and 63 
        ld d,a
        ld a,16
        ld b,0
    plotTilesLoop:
        ld c, 16                    ; t 7
        push de
        ldir
        ;DB $ED,$B4
        pop de                  
        inc d
        dec a
        jr nz,plotTilesLoop
tbanks:     
        nextreg $52,0
;outstack:
        ;ld sp,00 
        ld a,%00000010
        
        ld bc,LAYER2_ACCESS_PORT
        out (c),a               ; select bank
    #ifndef IM2 
        ReenableInts
    #endif
        ;ret
        ;POP IX 
        ENDP
    END ASM 
end sub

SUB DoTile8(byVal X as ubyte, byval Y as ubyte, byval T as ubyte)

    ASM 
        ;; break 
        PUSH de 
        push hl
        ; Grab xyt
        ld l,(IX+5)
        
        ld h,(IX+7)

        ld a,(IX+9)

        ;----------------
        ; Original code by Michael Ware adjustd to work with ZXB
        ; Plot tile to layer 2 (needs to accept > 256 tiles)
        ; in - hl = y/x tile coordinate (0-17, 0-31)
        ; in - a = number of tile to display
        ;----------------
PlotTile8:
        ld d,64
        ld e,a                  ; 11
        MUL_DE                  ; ?

        ld a,%11000000
        or d                        ; 8
        ex de,hl                    ; 4         ; cannot avoid an ex (de now = yx)
        ld h,a                  ; 4
        ld a,e
        rlca
        rlca
        rlca
        ld e,a                  ; 4+4+4+4+4 = 20    ; mul x,8
        ld a,d
        rlca
        rlca
        rlca
        ld d,a                  ; 4+4+4+4+4 = 20    ; mul y,8
        and 192
        or 3                        ; or 3 to keep layer on             ; 8
        ld bc,LAYER2_ACCESS_PORT
        out (c),a               ; 21            ; select bank

        ld a,d
        and 63
        ld d,a                  ; clear top bits of y (dest) (4+4+4 = 12)
        ; T96 here
        ld a,8                  ; 7
plotTilesLoop2:
        push de                 ; 11
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi     ; 8 * 16 = 128
        
        pop de                  ; 11
        inc d                   ; 4 add 256 for next line down
        dec a                   ; 4
        jr nz,plotTilesLoop2            ; 12/7
        ;ret  
        ld a,2
        ld bc,LAYER2_ACCESS_PORT
        out (c),a      ; 21         ; select bank
    END ASM 
end sub

SUB DoTileBank8(byVal X as ubyte, byval Y as ubyte, byval T as ubyte, byval b as ubyte)

    ASM 
        ; Draws a tile from bank b. Total tile size can be 16kb
        ; required bank is auto paged into $4000-$5FFF
        ; 256x192 L2 8x8 256 colour tile

        ;PUSH de 
        ;push hl
        PROC
        LOCAL tbanks,noinc,PlotTile8,plotTilesLoop2
        #ifndef IM2 
            call _check_interrupts
            di 
        #endif 
        ld a,$52 : ld bc,$243B : out(c),a : inc b : in a,(c)    
        ld (tbanks+3),a 
        
        ld a,(IX+11)        ; bank 
        ld h,(IX+9)         ; tile

    ;   swapnib             ; 8                     ; tile / 32 
    ;   rrca                ; 4     12              ; rotate right 
    ;   rrca                ; 4     16              ; rotate right 
    ;   rrca                ; 4     20              ; rotate right 
    ;   and %1              ; 7     27              ; and with %1
    ;   add a,h             ; 4     31t
        
        bit 7,h         ; 8 t       
        jr z,noinc      ; 12 / 7t   20
        inc a           ; 4         24
        noinc: 

        nextreg $52,a       ; set correct bank 

        ; Grab xyt
        ld l,(IX+5)         ; x
        ld h,(IX+7)         ; y
        ld a,(IX+9)         ; tile
        and 127

        ;----------------
        ; Original code by Michael Ware adjustd to work with ZXB
        ; Plot tile to layer 2 (needs to accept > 256 tiles)
        ; in - hl = y/x tile coordinate (0-17, 0-31)
        ; in - a = number of tile to display
        ;----------------
PlotTile8:
        ld d,64
        ld e,a                  ; 11
        mul d,e 

        ld a,%01000000          ; tiles at $4000
        or d                        ; 8
        ex de,hl                    ; 4         ; cannot avoid an ex (de now = yx)
        ld h,a                  ; 4
        ld a,e
        rlca
        rlca
        rlca
        ld e,a                  ; 4+4+4+4+4 = 20    ; mul x,8
        ld a,d
        rlca
        rlca
        rlca
        ld d,a                  ; 4+4+4+4+4 = 20    ; mul y,8
        and 192
        or 3                        ; or 3 to keep layer on             ; 8
        ld bc,LAYER2_ACCESS_PORT
        out (c),a               ; 21            ; select bank

        ld a,d
        and 63
        ld d,a                  ; clear top bits of y (dest) (4+4+4 = 12)
        ; T96 here
        ld a,8                  ; 7
plotTilesLoop2:
        push de                 ; 11
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi     ; 8 * 16 = 128
        
        pop de                  ; 11
        inc d                   ; 4 add 256 for next line down
        dec a                   ; 4
        jr nz,plotTilesLoop2            ; 12/7

tbanks:     
        nextreg $52,0           
        ld a,2
        ld bc,LAYER2_ACCESS_PORT
        out (c),a      ; 21         ; select bank
        #ifndef IM2 
            ReenableInts
        #endif
        ENDP
    END ASM 
end sub

SUB DoTileBank8Test(byVal X as ubyte, byval Y as ubyte, byval T as ubyte, byval b as ubyte, byval c as ubyte)

    ASM 
        ; Draws a tile from bank b. Total tile size can be 16kb
        ; required bank is auto paged into $4000-$5FFF
        ; 256x192 L2 8x8 256 colour tile

        PUSH de 
        push hl
        PROC
        LOCAL tbanks,noinc,PlotTile8,plotTilesLoop2
        #ifndef IM2 
            call _check_interrupts
            di 
        #endif 
        ld a,$52 : ld bc,$243B : out(c),a : inc b : in a,(c)    
        ld (tbanks+3),a 
        
        ld a,(IX+11)        ; bank 
        ld h,(IX+9)         ; tile
        
        bit 7,h         ; 8 t       
        jr z,noinc      ; 12 / 7t   20
        inc a           ; 4         24
        noinc: 

        nextreg $52,a       ; set correct bank 

        ; Grab xyt
        ld l,(IX+5)         ; x
        ld h,(IX+7)         ; y
        ld a,(IX+9)         ; tile
        and 127

        ;----------------
        ; Original code by Michael Ware adjustd to work with ZXB
        ; Plot tile to layer 2 (needs to accept > 256 tiles)
        ; in - hl = y/x tile coordinate (0-17, 0-31)
        ; in - a = number of tile to display
        ;----------------
PlotTile8:
        ld d,64
        ld e,a                  ; 11
        mul d,e 

        ld a,%01000000          ; tiles at $4000
        or d                        ; 8
        ex de,hl                    ; 4         ; cannot avoid an ex (de now = yx)
        ld h,a                  ; 4
        ld a,e
        rlca
        rlca
        rlca
        ld e,a                  ; 4+4+4+4+4 = 20    ; mul x,8
        ld a,d
        rlca
        rlca
        rlca
        ld d,a                  ; 4+4+4+4+4 = 20    ; mul y,8
        and 192
        or 3                        ; or 3 to keep layer on             ; 8
        ld bc,LAYER2_ACCESS_PORT
        out (c),a               ; 21            ; select bank

        ld a,d
        and 63
        ld d,a                  ; clear top bits of y (dest) (4+4+4 = 12)
        ; T96 here
        ; ld a,8                    ; 7
        ld a,(IX+13)
        ld bc,$800 
plotTilesLoop2:
        
        push bc
        ld bc,8
        push de     
        ldirx
        pop de 
        inc d 
        pop bc 
        djnz plotTilesLoop2

tbanks:     
        nextreg $52,0           
        ld a,2
        ld bc,LAYER2_ACCESS_PORT
        out (c),a      ; 21         ; select bank
        #ifndef IM2 
            ReenableInts
        #endif
        ENDP
    END ASM 
end sub

sub fastcall FDoTile16(tile as ubyte, x as ubyte ,y as ubyte, bank as ubyte)
    ' y 0  to 15
    ' x 0  to 19
    ' 
    ' draws tile on layer 2 320x240, fast call so optimized 
    asm 
    ; draw 16x16 tile on Layer2 @ 320x256
    ; bank is start bank, bank will automatically increase depending on tile number 
    ; stack is moved due to $4000 - $5FFF being used. All input values are pushed to the 
    ; stack on entry, so we must pop them off, YY00 0X00 Ti00 bk00  
    ; en00k 2020 / David Saphier
    PROC 
    LOCAL notbank67,bigtiles, tbanks, smctilnum, outstack, l2320on, l2on
        #ifndef IM2 
            call _check_interrupts
            di 
        #endif 
        exx                         ;4              ; swap regs 
        pop hl                      ;10             ; save ret address
        exx                         ;4              ; back to data  

        pop de                      ;10             ; get d<-y off stack yy00
        pop hl                      ;10             ; get h<-x off stack xx00 
        ld l,d                      ;4              ; now make hl x/y 
        
        ; we can use de here 
        pop de                                      ; start bank in de 
;       ld (outstack+1),sp                          ; save stack 
;       ld sp,nbtempstackstart-2                    ; set stack to nb temp stack 
        ld (smctilnum+1),a                          ; store tile for below 
        swapnib                                     ; tile / 32 
        rrca                                        ; rotate right 
        and %0111                                   ; and with %111
        add a,d                                     ; add to start bank 
        ld d,a                                      ; save a into d
        
        ld a,$52 : ld bc,$243B : out(c),a : inc b : in a,(c)    

        ld (tbanks+3),a                                 ; store current slot 2 bank
        ld a,d                                      ; get bank to page in from d 
        nextreg $52,a 
        ld bc,LAYER2_ACCESS_PORT
        
smctilnum:      
        ld a,0                  ;7                  ; set from above 
        and 31                  ; 
        ld d,a                  ; get offset into tiles from 0000 
        ld e,0

        ld a,%01000000          ;7                  ; this is $4000
        or d                    ;4                  ; 

        ; de tile offset / hl = y/x 
        ex de,hl                ;4                  ; swap de / hl  
                                                    ; and get x/y
        ld h,a                  ;4                  ; now put $cx00 with a into h 
                                                    ; hl is source 
        push hl                 ;11
        ; de y/x            
        ; y first 
        ld a,d                  ;4                  ;  y * 16

        ;rlca                   ;4
        ;rlca                   ;4
        ;rlca                   ;4
        ;rlca                   ;4 
        swapnib                 ;8 
        ld d,a                  ;4                  ; save back in d 
    
        ; x 
        ld l,e                  ;4                  ; treat x as word 
        ld h,0                  ;7                  ; to catch bit 0 
        add hl, hl              ;11                 ; of h 
        add hl, hl              ;11
        add hl, hl              ;11                 ; 
        add hl, hl              ;11                 ; if h bit 0 then banks 6-7
        push hl                     ;11             ; store hl for the mo 
        bit 0,h : jr z,notbank67  ;7 + 12/22
        ld h,4                  ;7                  ; bit 3 for bank mask 
notbank67:
        ld a,l                  ;4                  ; now get msb of xx 
        swapnib                 ;8                  ; swap the nibbles 
        rrca                    ;4                  ; right 2 times 
        rrca                    ;4
        and 3                   ;7                  ; now bits 7/8 in position 1/0
        or h                    ;4                  ; was hl>65535, then or bit 2
        ; bank bitmask 
        ld h,a                  ;4                  ; save in h, h has the banks    
l2on:
        ld a,%00000011          ;7                  ; l2 enable, writes enable 
        out (c),a               ;12                 ; out to port 
        ld a,h                  ;4                  ; get back bit 4 mode banks from h 
        add a,%00010000         ;7                  ; set bit 4 
l2320on:    
        out (c),a               ;12                 ; out to port 
        pop hl                  ;10                 ; get hl of stack 
        
        ld a,l                  ;4                  ; store l in a 
        ld l,d                  ;4                  ; d/y into l 
        and 63                  ;7                  ; and 63 to a 
        ld h,a                  ;4                  ; put in h/x 
    
        ex de,hl                ;4
        pop hl                      ;11             ; source address 

        ld a,16                     ;7
        ; uses ldws which is 
        ; ld a,(hl)
        ; ld (de),a 
        ; inc hl : inc d 
        ;
        ; 314 T so far 
bigtiles:
        push de                     ;11
        ldws                        ;14
        ldws                        ;14 
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14 
        ldws                        ;14
        ldws                        ;14 
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14 
        
        pop de                      ;10
        inc de                      ;6
        dec a                       ;4
        jr nz,bigtiles              ;12/22
        ; 142 T *2
tbanks:     
        nextreg $52,0   
outstack:
;       ld sp,0 
        exx                         ;4
        push hl                     ;11
        exx                         ;4 
        #ifndef IM2
            ReenableInts 
        #endif  
    ENDP 
    end asm 

end sub 

    
sub fastcall FDoTile8(tile as ubyte, x as ubyte ,y as ubyte, bank as ubyte)
    ' y 0  to 31
    ' x 0  to 39
    ' bank as start bank 
    ' draws tile on layer 2 320x240. tile data at $c000 
    asm 
    ; a = y 
    ; on entry stack YY00 0Xxx cc00 
    ; en00k 2020 / David Saphier
    PROC 
    LOCAL notbank67,drawtiles, smctilnum, outstack,tbanks, l2on, l2320on 
        #ifndef IM2 
            call _check_interrupts
            di 
        #endif 
        exx                         ;4                  ; swap regs 
        pop hl                  ;10                 ; save ret address
        exx                     ;4                  ; back to data  
        

        pop de                  ;10                     ; get d<-y off stack yy00
        pop hl                  ;10                 ; get h<-x off stack xx00 
        ld l,d                  ;4                  ; now make hl x/y 
        
        ; we can use de here 
        ; move stack and set up banks 
        pop de                                      ; start bank in de  
        ld (smctilnum+1),a                          ; store tile for below 
        swapnib                                     ; tile / 32 
        rrca                                            ; rotate right 
        rrca                                            ; rotate right 
        rrca                                            ; rotate right 
        and %1                                      ; and with %1
        add a,d                                         ; add to start bank 
        ld d,a                                      ; save a into d
        
        ld a,$52 : ld bc,$243B : out(c),a : inc b : in a,(c)    
        
        ld (tbanks+3),a                                 ; store current slot 2 bank
        ld a,d                                      ; get bank to page in from d 
        nextreg $52,a 

smctilnum: 
        ld a,0 
        and $7f                                     ; this is so we wrap around out 8kb bank 
        ld d,64                 ;7                  ; each 8x8 tile is 64 bytes 
        ld e,a                  ;4                  ; tile x bytes 
        mul d,e                     ;8                  ; get offset into tiles from 0000 
                            
        ld a,%01000000          ;7                  ; add $4000 to the offset 
        or d                    ;4                  ; 
                                                    ; a = lsb in an offset from $c0xx

        ; de tile offset / hl = y/x 
        ex de,hl                ;4                  ; swap de / hl  
                                                    ; and get x/y
        ld h,a                  ;4                  ; now put $cx00 with a into h 
                                                    ; hl is source 
        push hl                     ;11
        ; de y/x            
        ; y first 
        ld a,d                  ;4                  ;  y * 8
        rlca                    ;4
        rlca                    ;4
        rlca                    ;4 
        ld d,a                  ;4                  ; save back in d 
    
        ; x 
        ld l,e                  ;4                  ; treat x as word 
        ld h,0                  ;7                  ; to catch bit 0 
        add hl, hl              ;11                 ; of h 
        add hl, hl              ;11
        add hl, hl              ;11                 ; if h bit 0 then banks 6-7
        push hl                     ;11                 ; store hl for the mo 
        bit 0,h : jr z,notbank67  ;7 + 12/22
        ld h,4                  ;7                  ; bit 3 for bank mask 
        
notbank67:
        ld a,l                  ;4                  ; now get msb of xx 
        swapnib                     ;8                  ; swap the nibbles 
        rrca                        ;4                  ; right 2 times 
        rrca                        ;4
        and 3                   ;7                  ; now bits 7/8 in position 1/0
        or h                    ;4                  ; was de>65535, then or bit 2
        ; bank bitmask 
        ld h,a                  ;4                  ; save in h, h has the banks 
        ld bc,LAYER2_ACCESS_PORT    ;7                  ;
l2on:
        ld a,%00000011          ;7                  ; l2 enable, writes enable 
        out (c),a               ;12                 ; out to port 
        ld a,h                  ;4                  ; get back bit 4 mode banks from h 
        add a,%00010000         ;7                  ; set bit 4 
l2320on:    
        out (c),a               ;12                 ; out to port 
        pop hl                  ;10                 ; get hl of stack 
        
        ld a,l                  ;4                  ; store l in a 
        ld l,d                  ;4                  ; d/y into l 
        and 63                  ;7                  ; and 63 to a 
        ld h,a                  ;4                  ; put in h/x 
    
        ex de,hl                ;4
        pop hl                  ;11                 ; source address 

        ld a,8                  ;7
        ; uses ldws which is 
        ; ld a,(hl)
        ; ld (de),a 
        ; inc hl : inc d 
        ;
        ; 314 T so far 
drawtiles:
        push de                     ;11
        ldws                    ;14
        ldws                        ;14 
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14
        ldws                        ;14
        ldws                    ;14
        ldws                    ;14 
        pop de                  ;10
        inc de                  ;6
        dec a                   ;4
        jr nz,drawtiles         ;12/22
        ; 142 T
tbanks:     
        nextreg $52,0   
outstack:
        exx                         ;4
        push hl                     ;11
        exx                         ;4 
        
        #ifndef IM2
            ReenableInts 
        #endif      
    ENDP 
    end asm 

end sub 

Sub L2Text(byval x as ubyte,byval y as ubyte ,m$ as string, fntbnk as ubyte, colormask as ubyte)
    
    asm 
        PROC
        ; ; break 
        LOCAL plotTilesLoop2, printloop, inloop, addspace, addspace2 
        ; x and y is char blocks, fntbnk is a bank which contains 8x8L2 font 
        ; need to get m$ address, x , y and maybe fnt bank?
        ; pages into $4000 and back to $0a when done
        #ifndef IM2 
        ;   call _check_interrupts
        ;   di 
        #endif 
        getreg($52) 
        ld (textfontdone+1),a 

        ld e,(IX+5) : ld d,(IX+7)   
        ld l,(IX+8) : ld h,(IX+9)
        ld a,(hl) : ld b,a 
        inc hl : inc hl 
        ld a,(IX+11) : nextreg $52,a 
     
printloop:
        push bc 
        ld a,(hl)
        cp 32 : jp z,addspace
        ; cp 33 : jp z,addspace2
    #IFNDEF OLDFONT
        sub 32  
    #ELSE
        sub 34  
    #ENDIF
inloop: 
        push hl : push de 
        ex de,hl 
        call PlotTextTile
        pop de : pop hl 
        inc hl  
        inc e   
        pop bc
        djnz printloop
        jp textfontdone
addspace:
        inc hl  
        inc e   
        pop bc
        djnz printloop
addspace2:
        ld a,0
        jp textfontdone

PlotTextTile:
        ; break 
        
        ld d,64 : ld e,a            
        MUL_DE                  
        ld a,$40  : or d        ; $4000  // % 11 = C000
        ex de,hl     : ld h,a : ld a,e
        rlca : rlca : rlca
        ld e,a : ld a,d
        rlca : rlca : rlca
        ld d,a : and 192 : or 3
        ld bc,LAYER2_ACCESS_PORT
        out (c),a : ld a,d : and 63
        ld d,a : ld bc,$800 
        push de 
        ld a,(IX+13)
        ;ld a,8
plotTilesLoop2:
        
        push bc
        ld bc,8
        push de     
        ldirx
        pop de 
        inc d 
        pop bc 
        djnz plotTilesLoop2

        ;ldi : ldi : ldi : ldi : ldi : ldi : ldi : ldi
        ;pop de 
        ;inc d 
        ;dec a 
        ;jr nz,plotTilesLoop2
        pop de 
        ret 
textfontdone:
        ld a,$0a : nextreg $52,a
endofl2text:
        ld a,2 : ld bc,LAYER2_ACCESS_PORT
        out (c),a
        #ifndef IM2 
        ;   ReenableInts
        ;ei
        #endif 
    ENDP 

    end asm 
    
end sub 


Sub FL2Text(byval x as ubyte,byval y as ubyte ,byval m$ as string, fntbnk as ubyte)
    
    asm 
     
    PROC
    LOCAL plotTilesLoop2, printloop, inloop, addspace, addspace2,outstack,slot2out,PlotTextTile,textfontdone 
    ; x and y is char blocks, fntbnk is a bank which contains 8x8L2 font 
    ; need to get m$ address, x , y and maybe fnt bank?
    ; pages into $4000 and back to $0a when done 
        #ifndef IM2 
        ;    call _check_interrupts
        ;    di 
        #endif 
;       ld      (outstack+1),sp                             ; save stack 
;       ld      sp,nbtempstackstart-2                       ; set stack to nb temp stack 
        getreg($52)
        ld      (slot2out+3),a 
        ld      d,(IX+7)                                    ; get y 
        ld      e,(IX+5)                                    ; get x 
        ld      l,(IX+8)                                    ; string address, read it from the 
        ld      h,(IX+9)                                    ; frame, hl is not ours on entry 
        ld      a,(hl)                                      ; string length
        ld      b,a                                         ; string size 
        inc     hl                                          ; skip to start of string
        inc     hl  
        ld      a,(IX+11)                                   ; font bank 
        nextreg $52,a 
     
printloop:
        push    bc                                          ; save string length 
        ld      a,(hl)                                      ; fetch first char 
        cp      32 : jp z,addspace                          ; is it space?

      ; conditional to support the old font data (missing a char)
    #IFNDEF OLDFONT
        sub 32 
    #ELSE
        sub 34
    #ENDIF
inloop: 
        ; hl string de yx 
        ex      de,hl                                       ; put string address into de, xy into hl
        ; de string hl yx 
        push    hl : push de                                ; save str add and xy to stack 
        ; hl = y/x de string adderess 
        call    PlotTextTile                                ; plot the tile 
        pop     hl : pop de                                 ; get back xy & str addr
        inc     hl                                          ; string address+1
        inc     e                                           ; inc x 
        pop     bc                                          ; get back length
        djnz    printloop                                   ; repeat until end of str
        jp      textfontdone
    
addspace:
        inc     hl                                          ; string address+1
        inc     e                                           ; inc x 
        pop     bc                                          ; get back length
        djnz    printloop     
addspace2:
        jp      textfontdone 

PlotTextTile:
        ld d,64 : ld e,a                 ; d = 64 : a = tile 
        MUL_DE                      ; 64 * A = TILE DATA OFFSET 
        ld a,%01000000 : or d           ; make sure its in $4000 range
        
        
        ex de,hl     : ld h,a                                           ; hl is source 
        push hl                     ;11
        ; de y/x            
        ; y first 
        ld a,d                  ;4                  ;  y * 8
        rlca                    ;4
        rlca                    ;4
        rlca                    ;4 
        ld d,a                  ;4                  ; save back in d 
    
        ; x 
        ld l,e                  ;4                  ; treat x as word 
        ld h,0                  ;7                  ; to catch bit 0 
        add hl, hl              ;11                 ; of h 
        add hl, hl              ;11
        add hl, hl              ;11                 ; if h bit 0 then banks 6-7
        push hl                     ;11                 ; store hl for the mo 
        bit 0,h : jr z,notbank67  ;7 + 12/22
        ld h,4                  ;7                  ; bit 3 for bank mask 
        
notbank67:
        ld a,l                  ;4                  ; now get msb of xx 
        swapnib                     ;8                  ; swap the nibbles 
        ;rrca                       ;4                  ; right 2 times 
        ;rrca                       ;4
        srl a 
        srl a 
        and 3                   ;7                  ; now bits 7/8 in position 1/0
        or h                    ;4                  ; was de>65535, then or bit 2
        ; bank bitmask 
        ld h,a                  ;4                  ; save in h, h has the banks 
        ld bc,LAYER2_ACCESS_PORT    ;7                  ;
l2on:
        ld a,%00000011          ;7                  ; l2 enable, writes enable 
        out (c),a               ;12                 ; out to port 
        ld a,h                  ;4                  ; get back bit 4 mode banks from h 
        add a,%00010000         ;7                  ; set bit 4 
l2320on:    
        out (c),a               ;12                 ; out to port 
        pop hl                  ;10                 ; get hl of stack 
        
        ld a,l                  ;4                  ; store l in a 
        ld l,d                  ;4                  ; d/y into l 
        and 63                  ;7                  ; and 63 to a 
        ld h,a                  ;4                  ; put in h/x 
    
        ex de,hl                ;4
        pop hl                  ;11                 ; source address 

        ld a,8                  ;7
plotTilesLoop2:
        push de 
        push af 
        ldws 
        ldws
        ldws 
        ldws 
        ldws 
        ldws 
        ldws 
        ldws
        pop af 
        pop de              
        inc de
        dec a
        jr nz,plotTilesLoop2
        ret 
textfontdone:
        ;ld a,$0a : nextreg $52,a 
        ld bc,LAYER2_ACCESS_PORT        
        ld a, 2
        out (c),a : 
slot2out:
        nextreg $52,0
outstack:
        #ifndef IM2 
        ;    ReenableInts
        #endif 
    ENDP 
 
    end asm 
    
end sub 


sub fastcall FPlotL2(y as uinteger,x as uinteger, c as ubyte)

asm 
                exx : pop hl : exx 
                pop 	de 
                ; ex de,hl 
                LD		A, E			; Get the X coordinate
                AND		0x3F			; Offset in bank
                LD		H, A			; Store in high byte
                LD		B, 6 
                BSRA 	DE, B 			
                LD		A, E			; Get the X coordinate
                OR		%00010000
                LD		E, A
                ld 		bc,$123b 
                out 	(c),a
;                Z80PRTA	0x123B
                ld 		a,%00000111
                out 	(c),a 
;                Z80PORT	0x123B, %00000111	; Enable memory read/write
				pop 	af 
                ;LD		A, (._color)
                LD		E, A 
                LD		D, 0
                LD		A, (HL)
                AND		D
                OR		E
                LD		(HL), A
;                Z80PORT	0x123B, %00000010	; Disable memory writes
                ld 		a,%00000010
                out 	(c),a 
                exx : push hl : exx                 
    end asm 
end sub 


'sub fastcall FPlotL2(y as ubyte ,x as uinteger ,c as ubyte)
'    
'    asm 
'    ; a = y 
'    ; on entry stack YY00 0Xxx cc00 
'    ;en00k 2020 / David Saphier 
'        #ifndef IM2 
'            call _check_interrupts
'            di 
'        #endif 
'        exx                         ;4                  ; swap regs 
'        pop hl                      ;10                 ; save ret address
'        exx                         ;4                  ; back to data  
'        
'        ld bc,LAYER2_ACCESS_PORT    ;7                  ; set bc to l2 port 
'         
'        push af                     ;11                 ; save y to stack 
'        ex de,hl                    ;4                  ; de = xx hl = c / colour 
'        
'        bit 0, d                    ; 7                 ; is bit 0 of de set ?
'        jr z,nobanks6and7           ; 12/7              ; no de value <256 so banks 0 - 5
'        ld d,%100                   ; 7                 ; de >255 high bank %100 so banks 6-7
'                            
'    nobanks6and7:                   
'        ld a,e                      ;4                  ; now get msb of xx from e into a 
'        and 63 
'        swapnib                     ;8                  ; swap the nibbles 0000xxxx
'        srl a                       ;8                  ; right 2 times 
'        srl a                       ;8                  ; x/32 
'
'        and 3                       ;7                  ; first two bits 
'        or d                        ;4                  ; or with highbank d 
'        ld e,a                      ;4                  ; save in e 
'                        
'        ld a,%00000011              ;7                  ; intial write to l2 port 
'        out (c),a                   ;12                 ; enable writes and showlayer 
'                            
'        ld a,e                      ;4                  ; retrieve e containing banks 
'                            
'        or %00010000                ;7                  ; bit 4 extended L2 writes enable 
'        out (c),a                   ;12                 ; out to port 
'                
'        pop af                      ;10                 ; get back y 
'        pop hl                      ;10                 ; get back x
'        ld h,l                      ;4                  ; put l into h 
'        ld l,a                      ;4                  ; now put y into l 
'        ld a,h                      ;4                  ; x into a 
'        and 63                      ;7                  ; columns wrap at 64 bytes
'        ld h,a                      ;4                  ; put back into h, hl now complete 
'
'        pop af                  ;10                 ; get the colour specified 
'        
'        ld (hl),a               ;7                  ; make the write 
'        
'        
'        exx                         ;4
'        push hl                     ;11
'        exx                         ;4 
'        ld a,%00000010          ;7                  ; intial write to l2 port 
'        out (c),a               ;12                 ; writes off  
'        #ifndef IM2 
'            ReenableInts
'        #endif 
'    end asm 
'
'end sub

sub fastcall ShowLayer2(enable as ubyte)
    asm 
        ; a = 0 off 1 on 
        ; only bit 7 of nextreg $69 is ours, bit 6 is the ula shadow screen 
        ; select and bits 5-0 are the timex mode, so read modify write 
        push    bc                          ; getreg uses bc 
        ld      e, a                        ; save the flag 
        getreg($69)                         ; a = current display control 1 
        and     %01111111                   ; clear the layer 2 enable bit 
        ld      d, a                        ; keep everything else 
        ld      a, e 
        or      a 
        jr      z, disable_ 
        ld      a, d 
        or      %10000000                   ; layer 2 on 
        nextreg DISPLAY_CONTROL_NR_69, a 
        pop     bc 
        ret 
    disable_: 
        ld      a, d                        ; layer 2 off, rest of the reg kept 
        nextreg DISPLAY_CONTROL_NR_69, a 
        pop     bc 
    end asm 
    #DEFINE __SHOWLAYER2
end sub 

sub fastcall FPlotLineV(y as ubyte ,x as uinteger ,h as ubyte, c as ubyte)
    
    asm 
    ; a = y 
    ; does a vertical line on 320x256 
    ; on entry stack YY00 0Xxx cc00 
    PROC 
    LOCAL nobanks6and7, lineloop
    ;en00k 2020 / David Saphier 
        #ifndef IM2 
            call _check_interrupts
            di 
        #endif 
        exx                     ;4                  ; swap regs 
        pop hl                  ;10                 ; save ret address
        exx                     ;4                  ; back to data  
        
        ld bc,LAYER2_ACCESS_PORT    ;7              ; check if bit 0 of h is set if so >255
        
        push af                     ;11             ; save y to stack 
        ex de,hl                    ;4                  ; de = xx hl = 00 
        
        bit 0, d                ; 7                 ; is bit 0 of de set ?
        jr z,nobanks6and7       ; 12/7              ; no de value <256 so banks 0 - 5
        ld d,%100                   ; 7                 ; de >255 high bank %100 so banks 6-7
                            
    nobanks6and7:                   
        ld a,e                  ;4                  ; now get msb of xx from e into a 
        swapnib                 ;8                  ; swap the nibbles 0000xxxx
        srl a                   ;8                  ; right 2 times 
        srl a                   ;8
        and 3                   ;7                  ; first two bits 
        or d                    ;4                  ; or with highbank d 
        ld e,a                  ;4                  ; save in e 
                        
        ld a,%00000011          ;7                  ; intial write to l2 port 
        out (c),a               ;12                 ; enable writes and showlayer 
                            
        ld a,e                  ;4                  ; retrieve e containing banks 
                            
        add a,%00010000         ;7                  ; bit 4 extended L2 writes enable 
        out (c),a               ;12                 ; out to port 
                            
        pop af                  ;10                 ; get back y 
        pop hl                  ;10                 ; get back hl for l 
        ld h,l                  ;4                  ; put l into h 
        ld l,a                  ;4                  ; now put y into l 
        ld a,h                  ;4                  ; x into a 
        and 63                  ;7                  ; columns wrap at 64 bytes
        ld h,a                      ;4                  ; put back into h, hl now complete 


        pop     bc              ; get the length 

        pop     af                  ;10                 ; get the colour specified 
    
    lineloop: 

        ld      (hl),a              ;7                  ; make the write 
        inc     l 
        djnz    lineloop 
        
        exx                         ;4
        push    hl                  ;11
        exx                         ;4 
        ld      bc, LAYER2_ACCESS_PORT
        ld      a,%00000010         ;7                  ; intial write to l2 port 
        out     (c),a               ;12                 ; writes off  
        #ifndef IM2 
            ReenableInts
        #endif 
        ENDP 
    end asm 

end sub

sub fastcall FPlotLineW(y as ubyte ,x as uinteger ,w as uinteger, c as ubyte)
    
    asm 
    ; a = y 
    ; does a horizontal line on 320x256 
    ; on entry stack YY00 0Xxx cc00 
     
    PROC 
    LOCAL nobanks6and7, lineloop
    ;en00k 2020 / David Saphier 
        #ifndef IM2 
            call _check_interrupts
            di 
        #endif 
        exx                     ;4                  ; swap regs 
        pop hl                  ;10                 ; save ret address
        exx                     ;4                  ; back to data  
        
        ld bc,LAYER2_ACCESS_PORT    ;7              ; check if bit 0 of h is set if so >255
        
        push af                     ;11             ; save y to stack 
        ex de,hl                    ;4                  ; de = xx hl = 00 
        
        bit 0, d                ; 7                 ; is bit 0 of de set ?
        jr z,nobanks6and7       ; 12/7              ; no de value <256 so banks 0 - 5
        ld d,%100                   ; 7                 ; de >255 high bank %100 so banks 6-7
                            
    nobanks6and7:                   
        ld a,e                  ;4                  ; now get lsb of xx from e into a 
        swapnib                 ;8                  ; swap the nibbles 0000xxxx 
        srl a                   ;8                  ; right 2 times, a = x / 64 
        srl a                   ;8
        and 3                   ;7                  ; low two bits of the bank 
        or d                    ;4                  ; or with highbank d 
        ld e,a                  ;4                  ; save in e 
                        
        ld a,%00000011          ;7                  ; bit 1 = enable writes, bit 0 = enable layer 2 
        out (c),a               ;12                 ; enable writes and showlayer 
                            
        ld a,e                  ;4                  ; retrieve e containing banks 
                            
        add a,%00010000         ;7                  ; bit 4 extended L2 writes enable 
        out (c),a               ;12                 ; out to port 
        
        pop af                  ;10                 ; get back y 
        pop hl                  ;10                 ; get back hl for l 

        ld h,l                  ;4                  ; put l into h 
        ld l,a                  ;4                  ; now put y into l 
        ld a,h                  ;4                  ; x into a 
        and 63                  ;7                  ; columns wrap at 64 bytes
        ld h,a                  ;4                  ; put back into h, hl now complete 


        pop     bc              ; get the length 

        pop     af                  ;10                 ; get the colour specified 
        ld      (lineloop+2),a

    lineloop: 
        push    bc                  ; save bc
        ld      (hl), 255            ; plot pixel
        inc     h                   ; increment X
        
        ; Check for 64-column bank boundary
        ld      a, h
        and     63                  ; check if we hit bank boundary
        jp      nz, no_bank_switch
        
        ; Switch to next bank
        
        inc     e                   ; contains the bank mapping %00000111
        ld      a,e 
        and     7 
        ld      e,a 
        ld      bc,LAYER2_ACCESS_PORT
        ld      a,%00010011          ; ensure L2 enabled and writes enabled
        out     (c), a              ; set new bank
        ld      a,e 
        or      %00010000 
        ld      h, 0                ; reset X to 0 for new bank
        out     (c), a              ; set new bank 

    no_bank_switch:
        pop     bc                  ; bring back length 
        dec     bc                  ; decrease length counter
        ld      a, b 
        or      c  
        jp      nz, lineloop

        
        exx                         ;4
        push    hl                  ;11
        exx                         ;4 
        ld      bc, LAYER2_ACCESS_PORT
        ld      a,%00000010         ;7                  ; intial write to l2 port 
        out     (c),a               ;12                 ; writes off  
        #ifndef IM2 
            ReenableInts
        #endif 
        ENDP 
    end asm 

end sub


sub DrawImage(xpos as uinteger, ypos as ubyte, img_data as uinteger, frame as ubyte = 0 )
    
    ' plots image on L2 256x192 mode
    ' xpos = 0 to 255 - width of image 
    ' ypos = 0 to 192 - height of image
    ' frame is offset from start image derived from w * h 
    ' img_data points to table such as 
    ' image_test:
    '    asm
    '        ; bank  spare  
    '        db  32, 00, 00
    '        ; offset in bank  
    '        dw 00
    '    end asm 
    ' 

    asm 
    
    
        push    namespace   ip
        ; jp      image_plot_done
        
        push    ix 
    straight_plot:
        ; typewriter plots large tile
        ; de = yx, ix = source_data
        
        ld      e, (ix+4)                               ; x 
        ld      d, (ix+7)                               ; y 
        ld      (add1+1), de                            ; save yx address 

        ld      l, (ix+8)                               ; source 
        ld      h, (ix+9)

        ld      a, (ix+11)                              ; get frame

        push    hl                                      ; save xy
        pop     ix                                      ; xy into ix
        ld      l, (ix+3)                               ; source 
        ld      h, (ix+4)

        ld      e, (ix+1)                               ; fetch width
        ld      d, (ix+2)                               ; fetch height
        mul     d, e                                    ; de total size 
        ld      l, a                                    ; frame 
        ld      h, 0 
        call    .core.__MUL16_FAST                      ; call MUL16 HLxDE=HL now start of data
                                                        ; 
        ld      a, h                                    ; h is MSB of source data
        and     %11100000                               ; AND with $E0
        swapnib                                         ; now A is 0000 1110
        srl     a                                       ; now 0000 0111
        ld      e, (ix+0)                               ; get the bank the source date is in from table
        add     a, e                                    ; add the offset
        nextreg $50, a                                  ; set slot 0
        inc     a                                       ; next bank
        nextreg $51, a                                  ; set slot 1
        ld      (__source_bank_save), a                 ; save last bank 

        ld      a, h 
        and     $1f                                      ; wrap h around 8kb
        ld      h, a 

        ld      b, (ix+2)                               ; height
            
    add1:
        ld      de, 0000                                ; will hold yx with self mod code
    line1:
         
        ; Check for bottom clipping
        ld      de, (add1+1)                            ; get yx
        ld      a, d                                    ; get y
        cp      192                                     ; compare with bottom of screen
        jr      nc, __clip_exit                         ; if y >= 192, exit (clipped)

        push    bc                                      ; save bc / height

        call    get_xy_pos_l2                           ; get position and l2 bank in place
        ld      b, 0                                    ; clear b
        ld      a,(ix+1)                                ; width
        or      a                                       ; is width full width?
        jr      nz, __was_not_zero                       ; check to see if we have a width of 256
        ld      b, 1                                    ; yes, so set b to 1

    __was_not_zero:
        ld      c, a
        ldir                                            ; copy line
        pop     bc                                      ; get back height
        ld      de, (add1+1)                            ; get back yx
        inc     d                                       ; inc y 

        ld      a, 192                                  ; line 192
        cp      d 

        jr      z, __fix_banks

        

    __fix_return:
        ld      (add1+1), de                            ; save yx again
        dec     b                                       ; decrease height
        jr      nz, line1                               ; was height 0? no then loop to line1

    __clip_exit:
                                 ; clean up stack (restore bc that was pushed)
        ld      bc, .LAYER2_ACCESS_PORT                 ; turn off layer 2 writes
        ld      a, 2
        out     (c), a
         
        jp      image_plot_done
;    __clip_exit_start:
;        pop     bc                                      ; pop bc off stack from LDIR
;        jr      __clip_exit:

    __fix_banks:
        ; need to check if source HL crossed into next bank
        ; when HL was incremented by LDIR
        ld      a, h
        and     $e0                                      ; check if h crossed into next 8kb
        jr      z, __no_source_bank_cross                ; if h < $2000, no bank cross

        ; source crossed into next bank, update slots $50 and $51
        ld      a, (__source_bank_save)                  ; get last bank
        inc     a                                        ; next bank
        nextreg $50, a
        inc     a
        nextreg $51, a
        ld      (__source_bank_save), a                  ; save new last bank
        ld      a, h
        and     $1f                                      ; wrap h around 8kb
        ld      h, a
        jp      __fix_return

    __no_source_bank_cross:
        ; source didn't cross, just restore the current banks
        ld      a, (__source_bank_save)                  ; get last bank
        dec     a                                        ; previous bank (current slot 0)
        nextreg $50, a
        inc     a
        nextreg $51, a
        jp      __fix_return

    __source_bank_save:
        db      0                                        ; storage for current source bank
    __frame_save:
        db      0                                        ; storage for frame index (24-bit mul)
    __size_save:
        dw      0                                        ; storage for w*h frame size (24-bit mul)

    get_xy_pos_l2:

        ; input d = y, e = x
        ; uses de a bc 
        ;push    bc
        ld      bc,.LAYER2_ACCESS_PORT
        ld      a,d                                     ; put y into A 
        and     $c0                                     ; yy00 0000

        or      3                                       ; yy00 0011
        out     (c),a                                   ; select 8k-bank    
        ld      a,d                                     ; yyyy yyyy
        and     63                                      ; 00yy yyyy 
        ld      d,a
        ;pop     bc
        ret        

    image_plot_done:
        nextreg $50,$ff
        nextreg $51,$ff
        
        pop     ix
        pop     namespace

    end asm 

end sub 

sub fastcall InitPalette(pallete_sel as ubyte, bank as ubyte=0, start as uinteger=0, colcount as ubyte=0,offset as ubyte=0)
    asm
        ; register usage    
        ; a = bank 
        ; hl = start address
        ; bc = offset 
        ; de = return address 
        pop     de                          ; de = return address fixes IX bug! 
        nextreg $43,a 
        pop     af                          ; bank 
        or      a   
        jr      z,__no_set_bank
        nextreg $50,a                       ; set bank 
    __no_set_bank:
        pop     hl                          ; start address
        pop     bc                          ; offset 
        pop     af                          ; colcount 
    __load_palette:
        
        nextreg $40,a                       ; select first palette index 

    __palette_upload:
        ld      a,(hl)                      ; load first value, send to NextReg
        nextreg $44, a                      ; send firt palette entry 

        inc     hl                          ; next byte 
        ld      a,(hl)                      ; read into a
        nextreg $44, a  
        inc     hl                          ; incy dinky doo hl
         
        djnz    __palette_upload             ; repeat for remaining bytes / colours 

        nextreg     $50, $ff            ; replace slot 0 
    __no_colcount:
        push    de 
        
    end asm
end sub 

' is this a layer2 command? not really 

SUB PalUpload(ByVal address as uinteger, byval colours as ubyte,byval offset as ubyte, bank as ubyte=0)
    ' sends palette to registers address @label, num of cols 0 = 256, offset default 0
    ' now supports a bank 
    asm 
        ;; break
    PROC 
    LOCAL loadpal, palloop

        ld      l,(IX+4)    ; 
        ld      h,(IX+5)    ;                  ; address of palette 
        ld      b,(IX+7)    ;                  ; number of colours
        ld      e,(IX+9)    ;                  ; offset into palette
        
        ld      a, (ix+11)                   ; get bank
        or      a                            ; is it zero?
        jr      z, loadpal                   ; yes skip paging 
        nextreg $50, a                       ; bank > 0 so set mmu 0

    loadpal:

        ld      a, e                        ; offset MUST be loaded on both paths,
        nextreg $40,a                       ; select first palette index
    palloop:
        ld      a,(hl)                      ; load first value, send to NextReg
        nextreg $44, a                      ; send firt palette entry 

        inc     hl                          ; next byte 
        ld      a,(hl)                      ; read into a
        nextreg $44, a  
        inc     hl                          ; incy dinky doo hl
         
        djnz    palloop                     ; repeat for remaining bytes / colours 

        nextreg     $50, $ff            ; replace slot 0 
    


        ENDP
    end asm         
end sub 

sub fastcall SelectPalette(p as ubyte)
    ' selects the palette 
    ' %0xxx0000
	' %000	ULA first palette
	' %100	ULA second palette
	' %001	Layer2 first palette
	' %101	Layer2 second palette
	' %010	Sprites first palette
	' %110	Sprites second palette
	' %011	Tilemap first palette
	' %111	Tilemap second palette
	asm 
		nextreg PALETTE_CONTROL_NR_43, a
	end asm 
end sub 

sub fastcall SetPalette(_palette as ubyte,  index as ubyte, value as uinteger)
    ' sets a palette colour 
    asm
        ;BREAK 
        ex      (sp), hl
        ; a = palette 
        nextreg PALETTE_CONTROL_NR_43,a 
        pop     de
        pop     af 
        nextreg PALETTE_INDEX_NR_40,a 
        ld      a, e 
        nextreg PALETTE_VALUE_9BIT_NR_44,a
        ld      a, d 
        nextreg PALETTE_VALUE_9BIT_NR_44,a
        pop     de
        push    hl
        
    end asm 
end sub 

function fastcall GetPalette(_palette as ubyte, index as ubyte) as uinteger
    ' returns colour as uinteger 
    asm
        ex      (sp), hl
        nextreg PALETTE_CONTROL_NR_43, a
        pop     af 
        POP     af
        nextreg PALETTE_INDEX_NR_40, a 
        push    hl 
        getreg(PALETTE_VALUE_NR_41)
        ld      l, a 
        getreg(PALETTE_VALUE_9BIT_NR_44)
        ld      h, a 
    end asm
end function

Sub ClipLayer2( byval x1 as ubyte, byval x2 as ubyte, byval y1 as ubyte, byval y2 as ubyte ) 

    '; clips the layer2 defaults are : x1=0,x2=255,y1=0,y1=191
    '; $92ED = NextReg A, Clipping Register is 24
    
    asm 
        ld a,(IX+5)    
        DW $92ED : DB 24            
        ld a,(IX+7)   
        DW $92ED : DB 24
        ld a,(IX+9)      
        DW $92ED : DB 24 
        ld a,(IX+11)    
        DW $92ED : DB 24          
    end asm 
end sub 

Sub ClipULA( byval x1 as ubyte, byval x2 as ubyte, byval y1 as ubyte, byval y2 as ubyte ) 

    '; clips the ULA defaults are : x1=0,x2=255,y1=0,y1=191
    '; $92ED = NextReg A, ULA Clipping Register is 26
    asm 
        ld a,(IX+5)    
        DW $92ED : DB 26            
        ld a,(IX+7)   
        DW $92ED : DB 26
        ld a,(IX+9)      
        DW $92ED : DB 26 
        ld a,(IX+11)    
        DW $92ED : DB 26          
    end asm 
end sub

Sub ClipTile( byval x1 as ubyte, byval x2 as ubyte, byval y1 as ubyte, byval y2 as ubyte ) 

    '; clips the ULA defaults are : x1=0,x2=255,y1=0,y1=191
    '; $92ED = NextReg A, ULA Clipping Register is 26
    asm 
        ld a,(IX+5)    
        DW $92ED : DB 27            
        ld a,(IX+7)   
        DW $92ED : DB 27
        ld a,(IX+9)      
        DW $92ED : DB 27 
        ld a,(IX+11)    
        DW $92ED : DB 27          
    end asm 
end sub

Sub ClipSprite( byval x1 as ubyte, byval x2 as ubyte, byval y1 as ubyte, byval y2 as ubyte ) 

    '; clips the ULA defaults are : x1=0,x2=255,y1=0,y1=191
    '; $92ED = NextReg A, ULA Clipping Register is 26
    asm 
        ld a,(IX+5)    
        DW $92ED : DB $19           
        ld a,(IX+7)   
        DW $92ED : DB $19
        ld a,(IX+9)      
        DW $92ED : DB $19
        ld a,(IX+11)    
        DW $92ED : DB $19         
    end asm 
end sub

sub TileMap(byval address as uinteger, byval blkoff as ubyte, byval numberoftiles as uinteger,byval x as ubyte,byval y as ubyte, byval width as ubyte, byval mapwidth as uinteger)
        ' this point to a memory location containing a map width is viewable screen 
        ' mapwidth is the length of the whole map eg fro scrolling 
        ' this is a L2 command and not L3 TileMap HW 
        
        asm 
        
        ld      bc,$123b                ; L2 port 
        in      a,(c)                   ; read value 
        push    af                      ; store it
        ;xor a 
        ;out (c),a
        
        ld      a,(IX+7)
        ld      (offset),a
        ;ld a,(IX+15)               ; width 
        ;ld (width_tm),a

        ; do tile map @ address 
        ;; break
        ;;ld l,(IX+4)                   ; put address into hl 
        ;;ld h,(IX+5)

        
        ; inner x loop 

        ld      c,(IX+8)                    ;   loop number of loops from numberoftiles
        ld      b,(IX+9)                    ; 
        
        ld      d,(IX+11)                   ;   x
        ld      e,(IX+13)                   ;   y
        
        ;ld de,0                        ; x 
        ;ld e,0                     ; y 
        ld      a,(IX+15)               ; if x>0 we need to add it to our width value 
        add     a,d                     ; 
        ld      (IX+15),a               ; store back in IX+15
        
    forx:   
    ;; break 
        push    bc                  ; save loop counter 
        push    de                  ; save de (xy)
        push    hl                  ; save the address (hl)
        
        ld      b,(hl)                  ; get tile number from map address 
        ld      a,(offset)
        add     a,b
        ;ld     ,b
        ;ld     ,(hl)
        ld      l,d                     ; put x into c
        ld      h,e                     ; put y into b 

        call PlotTile82             ; draw the tile 

        pop     hl                      ; bring back til map address     
        
        ;ld de,32
        ld      e,(IX+16)                   ;   x
        ld      d,(IX+17)                   ;   y
        
        add     hl,de 
        
        pop     de                      ; bring back de (xy)
        inc     d                       ; increase x so , d+1
                                ; increase x so , d+1
        ld      a,d                         ; a=d 
        ;cp 32                      ; compare to 31?
        
        cp      (IX+15)
        call    z,resetx                ; if d=32 then resetx 
        
        pop     bc 
        dec     bc 
        ld      a,b
        or      c 
        jr      nz,forx 
        
        jp      tileend                 ; we're done jump to end 
    
    resetx:
        inc     e                       ; lets to y first, so y+1
        ld      a,e                     ; a=e  a=y
        cp      24                      ; if a=24  y=24?
        jp      z,timetoexit                ; jp tileened           ; yes we reached the bottom line so exit 
        ;ld d,0                     ; else let x=0
        ld      d,(IX+11)               ; else let x = startx 
        ret                         ; jump back to forx loop 

    timetoexit:
        pop     bc                      ; dump bc off stack                         
        jp      tileend                 ; we're done jump to end  

    PlotTile82:
        ld      d,64
        
        ld      e,a                     ; 11
        mul     d,e                     ; ?
        ;; break 
        ld      a,%11000000
        ;ld a,%00000000
        or      d                       ; 8
        ex      de,hl                   ; 4         ; cannot avoid an ex (de now = yx)
        ld      h,a                     ; 4
        ld      a,e
        rlca
        rlca
        rlca
        ld      e,a                     ; 4+4+4+4+4 = 20    ; mul x,8
        ld      a,d
        rlca
        rlca
        rlca
        ld      d,a                     ; 4+4+4+4+4 = 20    ; mul y,8
        and     192
        or      1                       ; 8
        
        ld bc,LAYER2_ACCESS_PORT
        out     (c),a                   ; 21            ; select bank

        ld      a,d
        and     63
        ld      d,a                     ; clear top 2 bits of y (dest) (4+4+4 = 12)
        ; T96 here
        ld      a,8                     ; 7
    plotTilesLoopA:
        push    de                      ; 11
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi
        ldi                             ; 8 * 16 = 128
        
        pop     de                      ; 11
        inc     d                       ; 4 add 256 for next line down
        dec     a                       ; 4
        jr      nz,plotTilesLoopA       ; 12/7
        ret  
    offset:
        db      0
    width_tm:
        db      31
    tileend:
        ld  bc, LAYER2_ACCESS_PORT  ; switch off background (should probably do an IN to get the original value)
        pop     af                  ; restore layer2 on or off 
        ld      a,2
        out     (c),a     
        
    end asm 
    '   NextReg($50,$ff)
END SUB 



' Swaps the Layer 2 bank with the shadow bank (NextReg $12 / $13). Projects
' keep reimplementing this longhand under the name SwapBuffers, so that name
' is aliased below rather than left to be rewritten a nineteenth time.
#DEFINE SwapBuffers FlipBuffer

sub fastcall FlipBuffer()
    asm
        exx 
        getreg($12) : ld d,a
        getreg($13)
        nextreg $12,a 
        ld a,d 
        nextreg $13,a       
        exx 
    end asm 
end sub 

sub fastcall EnableShadow()
    asm
        ; swap to shadow
        ld a, %00001010
        ld bc, LAYER2_ACCESS_P_123B
        out (c),a
    end asm
end sub 

sub fastcall DisableShadow()
    asm
        ; swap to shadow
        ld a, %00000010
        ld bc, LAYER2_ACCESS_P_123B
        out (c),a
    end asm
end sub 

sub WaitRetrace(byval repeats as uinteger)
    asm 
    PROC 
    LOCAL readline
            ld      l,(ix+4)       ; fixed assuming HL was always our compare value! 
            ld      h,(ix+5)
        readline:   
            ld      a,VIDEO_LINE_LSB_NR_1F
            ld      bc,TBBLUE_REGISTER_SELECT_P_243B
            out     (c),a
            inc     b
            in      a,(c)
            cp      250             ; line to wait for 
            jr      nz,readline
            dec     hl 
            ld      a,h
            or      l 
            jr      nz,readline 
    ENDP        
    end asm 
end sub

#DEFINE WaitRaster WaitRetrace2

sub fastcall WaitRetrace2(byval repeats as ubyte)
    asm 
	PROC 
		
		LOCAL readline
		pop hl : exx 
		ld d,0
		ld e,a 
		readline:
			ld bc,$243b
			ld a,$1e
			out (c),a
			inc b
			in a,(c)
			ld h,a
			dec b
			ld a,$1f
			out (c),a
			inc b
			in a,(c)
			ld  l,a
			and a
			sbc hl,de
			add hl,de
			jr nz,readline
		exx : push hl 
	ENDP 
    end asm 

end sub 

sub fastcall WaitKey()
    asm
    ; waits for any keypress or kemp 1/2 or md pad abc/start
    PROC
        ;   ; break 
    LOCAL WaitAnyKey,.NoKey,.NoKempston,.AnyKeyOrKempston,.check_key
    LOCAL raster_line_wait
            ; push  bc
    WaitAnyKey:
        .NoKey:
            xor     a                                   ; flush a & flags to 0 
            in      a, ($FE)                            ; key keyboard port
            cpl                                         ; invert the result
            and     31                                  ; mask off 31
            jr      nz, .NoKey                          ; if the result is not 0 jim ot NoKey
        .NoKempston:
            ld      e,2                                 ; 2 frames for raster_line_wait
            call    raster_line_wait                    ; call raster_line_wait
            in      a, (31)                             ; read the kempston port into a
            inc     a                                   ; add + 1 
            jr      z, .AnyKeyOrKempston                ; is a now 0 then jump to AnyKeyOrKempston
            dec     a                                   ; subtract 1 from a 
            jr      nz, .NoKempston                     ; if a is not 0 then jump to .NoKempston
        .AnyKeyOrKempston:          
            ld      e,2                                 ; 2 frames 
            call    raster_line_wait                    ; call raster_line_wait 
            in      a, (31)                             ; read kempston port
            inc     a                                   ; add + 1 to a 
            jr      z,.check_key                        ; if its 0 jump to check_key
            dec     a                                   ; subtract 1 from a 
            ret     nz                                  ; if the resul is non z return 
        .check_key:             
            in      a, ($FE)
            cpl
            and     31
            jr      z, .AnyKeyOrKempston
            jr      exit_wait_key 

    raster_line_wait:

            ld d,0
            ;ld e,a 
    wk_readline:
			ld bc,$243b
			ld a,$1e
			out (c),a
			inc b
			in a,(c)
			ld h,a
			dec b
			ld a,$1f
			out (c),a
			inc b
			in a,(c)
			ld  l,a
			and a
			sbc hl,de
			add hl,de
			jr nz,wk_readline
 

;            ld      bc,TBBLUE_REGISTER_SELECT_P_243B
;            ld      a,VIDEO_LINE_LSB_NR_1F
;            out     (c),a                                   ; select NR $1E
;            inc     b
;    rloop:
;            in      a,(c)                                   ; A = raster line MSB
;            ; cp        165
;            xor     e
;            rra
;            jr      nc,rloop                                ; loop until MSB.1 != E.1
;            dec     e                                       ; decrement counter
;            jr      nz,rloop                                ; loop until counter == 0
;            ret             
;
    exit_wait_key: 
            ; pop   bc 
            ret     
        ENDP
        end asm 
end sub 


sub Console(db_string as string)

    ' prints a string to CSpect Console

    db_string=db_string+chr 0 

    asm  
        nextreg MMU0_0000_NR_50,$ff
        nextreg MMU1_2000_NR_51,$ff
        nextreg MMU2_4000_NR_52,$0a
        
        ld      h, (ix+5)
        ld      l, (ix+4)           ; string address into hl 
        add     hl, 2               ; skip over length 
        rst     $18                 ; send message 

    end asm 

end sub 

sub fastcall CopyBank(startb as ubyte, destb as ubyte, nrbanks as ubyte)
    asm 
        PROC 
        LOCAL copybankloop                          ; private label
            exx    
            pop     hl                              ; get the return address of the stack
            exx 
            ld      c,a 						    ; store start bank in c 
            pop     de 						        ; dest bank in e 
            ld      e,c 						    ; d = source e = dest 
            pop     af 
            ld      b,a 						    ; number of loops 

        copybankloop:	
            push    bc
            push    de 
            ld      a,e
            nextreg MMU0_0000_NR_50,a               ; page in source bank
            ld      a,d
            nextreg MMU1_2000_NR_51,a               ; page in destination 
            ld      hl,$0000
            ld      de,$2000
            ld      bc,$1fff                        ; copy 8KB worth
            ldir 
            pop     de
            pop     bc
            inc     d
            inc     e
            djnz    copybankloop
            
            nextreg MMU0_0000_NR_50,$ff
            nextreg MMU1_2000_NR_51,$ff
            
            exx
            push    hl
            exx
            ret 
        ENDP
    end asm  
end sub  

sub fastcall CopyFromBank(cfb_sourceb as ubyte, cfb_dest_address as UINTEGER, cfb_lenght as UINTEGER)
    ' will copy from bank paged in at slot 0, $0000-$1fff
    asm 
        PROC 
        LOCAL _copy_bank_bc_ok, copy_bank_exit, copy_bank_loop_start
            ; copies from a bank to RAM - needs saftey checks 
            exx    
            pop     hl                              ; get the return address of the stack
            exx 
            ; a = cfb_sourceb
            ld      h, a                            ; save a cfb_sourceb
            pop     de 						        ; de = cfb_dest_address
            pop     bc                              ; bc = length to copy

            ; Check if bc > $2000
            ld      a, b
            cp      $20                             ; compare high byte with $20
            jr      c, _copy_bank_bc_ok             ; if b < $20, then bc < $2000, so continue
            jr      nz, copy_bank_exit              ; if b > $20, then bc > $20xx, so exit
            ; if we get here, b = $20, so check low byte
            ld      a, c
            cp      $01                             ; compare with $01
            jr      c, _copy_bank_bc_ok             ; if c < $01 (i.e. c = $00), then bc = $2000, which is OK
            jr      copy_bank_exit                  ; if c >= $01, then bc > $2000, so exit
    
        _copy_bank_bc_ok:
            xor     a 
            sub     c 
            jr      nz, copy_bank_loop_start
            ld      a, b 
            or      a                               ; check if b is zero
            jr      z, copy_bank_exit               ; if bc = 0, exit

        copy_bank_loop_start:
            ld      a, h 
            nextreg MMU0_0000_NR_50, a 
            ld      hl, 0 
            ldir    
        copy_bank_exit:
            nextreg MMU0_0000_NR_50, $ff  
            exx 
            push    hl 
            exx 
        ENDP 
    end asm 
end sub 
'////////////////////////////////////////////////////
'// INCLUDES 
'////////////////////////////////////////////////////

' Routines here will only be included with #DEFINE DEV
' used before inlcude nextlib.bas 

#define LAYER2

#ifdef LAYER2
    #include <nb_LAYER2.bas>
    '#include <nb_LAYER_PRINT.bas>
#endif  

'////////////////////////////////////////////////////
'// Development Area
'////////////////////////////////////////////////////

' Routines here will only be included with #DEFINE DEV
' used before inlcude nextlib.bas 

#ifdef      DEV 

sub dbMemory(db_address as uinteger, db_len as uinteger)

    asm 
            
            show_console_regs
            BREAK 
            ld      h, (ix+5)       ; address of text 
            ld      l, (ix+4)

            ld      c, (ix+6)       ; length of memory dump 
            ld      b, (ix+7)
            ld      de, teststring+3

            ld      bc, 15
        dr_loop:
            push    bc              ; save length
            ld      a, (hl)         ; get the byte to print 
            
            ld      (de), a 
            rst     $18
            db      $ff 
            dw      teststring
            inc     hl 
            inc     de 
            pop     bc 
            dec     bc 
            ld      a, b 
            or      c
            jr      nz, dr_loop 
            
    end asm 

end sub 

asm 
teststring:
    db      "%x %x %x %x %x %x %x %x %x %x %x %x %x %x %x %x",0
    db      $21,$43,$65,$87
end asm 

sub Debug(BYVAL x as UBYTE,byval y as ubyte, s as string)
    ' fast print, doesnt need the print library '
    asm 
    PROC 
        ;; break 
        ld      l,(IX+8)                        ; address string start containing string size  
        ld      h,(IX+9)
        push    hl                              ; save this 
        ld      b,0                             ; flatten b 
        ld      c,(hl)                          ; first byte is length of string
        push    bc                              ; save it 
        CHAN_OPEN       EQU 5633
        ld      a,2                             ; upper screen
        call    CHAN_OPEN                       ; get the channel sorted
        ld      a,22                            ; AT 
        rst     16                              ; print 
        ld      a,(IX+5)                        ; x
        rst     16
        ld      a,(IX+7)                        ; y 
        rst     16
        pop     bc                              ; pop back length 
        pop     de                              ; pop back start 
        inc     de 
        inc     de 
        call    8252                            ; use rom print 

    ENDP 
    end asm 
end sub  

#endif

'////////////////////////////////////////////////////
'// End of subroutines
'////////////////////////////////////////////////////

    
    asm  
        ; adding in a manual break point here 
        ;db  $dd,$01             ; opcode to trigger a breakpoint in the emulator

        ld iy,$5c3a 
        ; 11/10/24 found that the jp nextbuild_file_end was breaking the file
        ; so have removed it. but some programs may need it.... 
        ; fixed 11/10/24 by adding the jump to endfilename
        jp endfilename
        ; 
    end asm 
    
    ' check if interrupts are enabled to a known state
    check_interrupts()

    ' define space for filenames + stack.
    ' max filename is 254 chars, so 320-254 = 66
    ' so 66 bytes for stack, in reality filenames are much shorter
filename:
    asm         
    filename:
        DEFS 512,0
    endfilename:    
    end asm 
    ' sets the stack to be within the filename space, hence the NEX
INTERNAL_STACK_TOP:
    #ifndef NOSP 
        asm 
        nbtempstackstart:
        ld sp,nbtempstackstart-2

        end asm 
    #endif 

    asm 
        ; 11/10/24 found that the jp nextbuild_file_end was breaking the file
        ; this jump now goes to the end of the file as it was jumping into the sysvar routine
        ; and causing a crash. 

        jp nextbuild_file_end

        ;   sfxenablednl:
        ;   db 0,0 
        shadowlayerbit:
        db 0
    end asm 

asm 

#include once <zxnext_utils.asm>     
#include once <arith/mul16.asm>         

end asm     

#include <nb_constants.bas>

#ifdef AYFX
    #DEFINE AYFX_ENABLED
    #include once <nextlib_ints.bas>
#endif
#ifdef CTC
    #DEFINE AYFX_ENABLED
    #include once <nextlib_ints_ctc.bas>
#endif

#ifndef __SAMPLE_TABLE
    ' ctc_sample_table:
    ' asm 
    ' ctc_sample_table:
    '     #DEFINE __SAMPLE_TABLE

    '     dw $0000,0,0000 ; 0jump.pcm
    '     ds 16,0 ; padding
    ' end asm 
#endif
asm 
    nextbuild_file_end:
        ; end marker 
end asm 

#pragma pop(case_insensitive)

#endif

