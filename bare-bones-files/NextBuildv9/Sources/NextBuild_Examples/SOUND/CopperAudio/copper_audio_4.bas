'!org=32768

' NextBuild Copper Audio v2 
' original CopperAudio by Lampros Potamianos used with permission
' optimized & adapted for nextbuild by em00k


#define NEX 
#define IM2 

#include <nextlib.bas>
#include <keys.bas>

backupsysvar() 

' register block
'
asm 
    ; setting registers in an asm block means you can use the global equs for register names 
    ; 28mhz, black transparency,sprites on over border,256x192
    nextreg PERIPHERAL_3_NR_08,%0_1_011010      ; contention off 
    nextreg TURBO_CONTROL_NR_07,%11             ; 28 mhz 
    nextreg GLOBAL_TRANSPARENCY_NR_14,0         ; black 
    nextreg SPRITE_CONTROL_NR_15,%000_000_11    ; %000    S L U, %11 sprites on over border
    nextreg LAYER2_CONTROL_NR_70,%00_00_0000    ; 5-4 %01 = 320x256x8bpp 00 = 256x192 
end asm 

InitLayer2(MODE256X192)
paper 0 : ink  6 : border 0 : cls

do 
    print "Copper Audio v2"    
    print "Playing Condom Corruption"    
    ' Browser("pick a wav buster","WAV")        ' this will only work from NextZXOS
    CopperAudio()
    print "Done - any key to restart"
    while GetKeyScanCode()>0 : WaitRetrace(1) : wend 
    WaitKey()
    while GetKeyScanCode()>0 : WaitRetrace(1) : wend 
    cls 
loop 

sub fastcall CopperAudio()
    asm 
        ; original code by Lampros Potamianos, used with permission
        ; optimized & adapted for nextbuild by em00k

        ; this is specific to nextbuild
        exx                             ; swap regs
        pop     hl                      ; save ret off stack into hl'
        exx                             ; pop back standard regs
        call    start_copper_audio      ; call Copper Audio
        call    reset_copper 
        exx                             ; swap to shadow regs
        push    hl                      ; push back ret address 
        exx                             ; 
        nextreg $52,10                  ; ensure bank 10 is back in MMUslot2
        ret                             ; ret out of fast call

        ; end of next build specifc 

        BankCopperData  equ 33          ; bank to use 
        SongSize        equ 5353816     ; song size
        BaseAddress     equ $4000       ; this is the MMU address that will be used 
        BaseMMU         equ MMU2_4000_NR_52

    start_copper_audio:

        call    PrepareCopperBank       ; prepare the copper for digital audio
        ld      a,BankCopperData
        call    SetBank

    ; initialize digital audio streaming
              

        call    SetDrive

    ; open file!
        ld      hl,FilenameStream
        push    hl
        pop     ix
        ld      a,(drive)
        ld      b, FA_READ              
        rst     $08                         
        db      F_OPEN                  ; open file
        ld      (FHandle),a             ; get handle

        call    SetBlocksToLoad         ; initializes the number of blocks we will load - depends on the music file

    MenuFlyback:     
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0

        ld      bc,$243b : ld a,$1f : out (c),a : inc b : in a,(c) : or a : jr nz,MenuFlyback      ; LSB Raster Line    our flyback is at line 0 - otherwise audio distorts
        ld      bc,$243b : ld a,$1e : out (c),a : inc b : in a,(c) : or a : jr nz,MenuFlyback      ; MSB Raster Line
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,255
        call    Read5060Hz              ; see if we have 50 or 60 Hz and accordingly set Total Lines for copper
        call    Process5060Hz           ; set half and double copper lines

        ; read a block from the SD using the F_READ while the file is open
        ld      a,BankCopperData
        nextreg BaseMMU,a 

        ld      a,%00000010
        ld      bc,$123b
        out     (c),a                   ; Disable L2 writes

    ReadSD:
        ; nextreg $50,255
        ; nextreg $51,255                 ; roms paged in 0000 so that we can read from SD

        ld      hl,BaseAddress+$500           ; load to
        push    hl                      ; copy it to IX too
        pop     ix
        ld      bc,(CopperTotalLines)   ; 312 or 262
        ld      a,(FHandle)
        rst     $08
        db      F_READ                       ; will stream from SD to buffer only if we need to (if there are less than 312/262 bytes in the buffer)

        or      a       
        ld      hl,(CopperTotalLines)       ; 11 
        ld      d,b                         ; 4
        ld      e,c                         ; 4 
        ex      de,hl       ; swap hl de    ; 4
        sbc     hl,de 
        jr      nc,1F       ; jump to 1 if  hl = de 
        ld      a,$ff       ; loaded less bytes set done flag 
        ld      (Allblocksdone),a 

1:        
        ld      a,BankCopperData
        nextreg BaseMMU,a 

    ; Update Area 2
        ld      hl,$500+BaseAddress           ; where the Area 1 samples are read
        ld      de,(CopperDoubleLines)
        add     de,3+BaseAddress
        ld      a,(CopperHalveLines)
        ld      b,a
        ld      a,3 
    CopperArea2Injection2:
        ldi
        ; add     de,3                    ; every 4 bytes, one was incremented with the LDI, 3 more here
        add     de,a 
        ; inc de : inc de : inc de          ; add de,3 or inc de * 3 - which is quicker at 28mhz?!
        inc     c                       ; it was decreased with the ldi
        djnz    CopperArea2Injection2
    
        ; now we will upload these to the copper using the DMA
        ld      hl,(CopperDoubleLines)   ; was double
        ld      a,l
        nextreg $61,a
        ld      a,h : or $c0
        nextreg $62,a
        ld      hl,(CopperDoubleLines) ; : add hl,BaseAddress
        ld      (DMA_CopperLength),hl 
        ; ld      b,h     ; 4
        ; ld      c,l     ; 4
        ld      de,BaseAddress : add hl,de 
        ld      (DMA_CopperSource),hl
    
        call    SEND_COPPER_DMA
        
    ; HERE WE HAVE AT LEAST 100 SCANLINES TO WRITE MENU CODE

        ; simple code to exit if key pressed
        ; BREAK
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0
        xor     a
        in      a,($fe)
        cpl
        and     15
        jr      nz,2F
        jr      Flyback184
2:      
        ld      a,1
        ld      (Allblocksdone),a
        jr      EndOfData

    ; Here we continue with the second part of the update for copper music
    Flyback184: 
        
        ld bc,$243b : ld a,$1f : out (c),a : inc b : in a,(c) : cp 184: jr nz,Flyback184
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,128
        ld      a,BankCopperData
        nextreg BaseMMU,a 

        ; Update Area 1
        
        ld      a,(CopperHalveLines)
        ld      hl,BaseAddress+$500 : add hl,a 
        ld      de,3+BaseAddress              ; we will inject bytes beggining there
        ld      b,a                    ; 4t 
        ld      a,3 
    CopperArea1Injection2:
        ldi
        ; add     de,3                    ; every 4 bytes, one was incremented with the LDI, 3 more here
        ; inc de : inc de : inc de 
        add de, a 
        inc     c                       ; it was decreased with the ldi
        djnz    CopperArea1Injection2

        
        ; now we will upload these to the copper using the DMA
        nextreg COPPER_CONTROL_LO_NR_61,0
        nextreg COPPER_CONTROL_HI_NR_62,192                ; set line 0 for copper data and let the copper run

        ld      hl,BaseAddress                ; This is where the copper data is
        ld      (DMA_CopperSource),hl
        ld      hl,(CopperDoubleLines)  ; we will send 312/2 lines, 4 bytes each line
        ld      (DMA_CopperLength),hl       ; swapped to hl instead of bc 
        call    SEND_COPPER_DMA

        ; else update the number of blocks left to load and check if we reached the end of the song
        ; ld      hl,(BlocksToLoad)
        ; dec     hl
        ; ld      (BlocksToLoad),hl
        ; ld      a,h
        ; and     a
        ; jp      nz,MenuFlyback
        ; or      l
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0
        ld      a,(Allblocksdone)
        cp      $ff 
        jp      nz,MenuFlyback
        ; if we reached the end of the song, we will close the file and re-open it to get a new handle
        ; for some reason when I tried to FSEEK instead of closing and reopening it did not work right
        xor      a                           ; reset done flag 
        ld      (Allblocksdone),a 
    
    EndOfData: 

        ld      a,(FHandle)                  ; 
        rst     $08                          ; close file
        db      F_CLOSE                      ; 
        
        ; this ret jumps out of the CopperAudio sub 
         
        ld      a,(Allblocksdone)
        cp      1 
        ret     z                            ; remove to loop 

        call    SetDrive
        
        ; open file!

        ld      hl,FilenameStream
        push    hl
        pop     ix
        ld      a,(drive)
        ld      b, FA_READ                   
        rst     $08                         
        db      F_OPEN                       ; open file
        ld      (FHandle),a                  ; get handle

        call    SetBlocksToLoad
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,12
        jp      MenuFlyback
        
    reset_copper:
        nextreg COPPER_CONTROL_LO_NR_61,0
        nextreg COPPER_CONTROL_HI_NR_62,0                   ; stop the copper and reset the line index to 0
        nextreg COPPER_DATA_16B_NR_63,$FF                   ; stop the copper and reset the line index to 0
        nextreg COPPER_DATA_16B_NR_63,$FF                   ; stop the copper and reset the line index to 0
        ret 

    SetBlocksToLoad:      
        call    Read5060Hz              ; see if we have 50 or 60 Hz and accordingly set Total Lines for copper
        ld      a,(CopperTotalLines)
        cp      56                      ; do we have 312 lines - 50 Hz?
        jr      z,Choice50
        ld      hl,SongSize/262        ; This number is file size/262 lines
        ld      (BlocksToLoad),hl
        ret
    Choice50:
        ld      hl,SongSize/312        ; This number is file size/312 lines
        ld      (BlocksToLoad),hl
        ret


    ; ************************************************************************************************************************************************************************************


    ; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ;                       Determine if we run at 50 or 60 Hz
    ; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    Read5060Hz: 
    
        ld      bc,$243b
        ld      a,5
        out     (c),a
        inc     b
        in      a,(c)                   ; read register 5
        and     %00000100               ; test for 50/60Hz
        jr      z,WeHave50Hz
        ld      hl,262                  ; 60 Hz has 262 lines
        jr      StoreTotalLines
        
        ; code below for 50Hz
    WeHave50Hz: 
        ld      hl,312                  ; 50 Hz have 312 lines
    StoreTotalLines: 
        ld      (CopperTotalLines),hl
        ld      a,l                     ; get copper lines LSB
        cp      56                      ; for 312 lines (50Hz)
        jr      nz,No312
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,2                   ; was 220
        jr      Lines312
    No312:      nextreg $4a,4
    Lines312:    ret

    ; ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    Process5060Hz: 
        ld      hl,(CopperTotalLines)
        srl     h : rr l
        ld      a,l
        ld      (CopperHalveLines),a
        ld      hl,(CopperTotalLines)
        sla     l : rl h
        ld      (CopperDoubleLines),hl
        ret

    BlocksToLoad:            dw      0
    ; ************************************************************************************************************************************************************************************


    PrepareCopperBank: 

        ld      a,BankCopperData
        nextreg BaseMMU,a 
        ; call    SetBank
        ld      hl,BaseAddress
        ; move 312 bytes (262 for 60Hz)
        ld      de,0                    ; begin at line 0
        ld      bc,$2d80

    CopperInjection: 
        ld      a,d
        or      $80                     ; WAIT COMMAND + MSBs of line number
        ld      (hl),a
        inc     hl
        ld      (hl),e                  ; LSB of line number
        inc     hl
        ld      (hl),b ; 45                 ; SpecDrum port 0xDF / DAC A+C mirror
        inc     hl
        ld      (hl),c ; $80                ; just reset the DAC to volume zero
        inc     hl
        inc     de                      ; next line
        ld      a,d
        cp      1                       ; are we going over 256?
        jr      nz,CopperInjection
        ld      a,e
        cp      312-256                 ; are we finished? 50 Hz version
        jr      nz,CopperInjection

        ld      (hl),$FF                ; (hl),$ff = 10t
        inc     hl
        ld      (hl),$FF                ; IMPOSSIBLE COMMAND TO STOP COPPER

        ; now we need to move all these bytes to the copper using DMA
        nextreg COPPER_CONTROL_LO_NR_61,0
        nextreg COPPER_CONTROL_HI_NR_62,0                   ; stop the copper and reset the line index to 0
        
        ld      de,312*4+6              ; bytes to move
        ld      hl,BaseAddress                ; source data

    CopperRegisterLoop:
        ld      a,(hl)
        nextreg $60,a
        inc     hl
        dec     de
        ld      a,d
        and     a
        jr      nz,CopperRegisterLoop
        ld      a,e
        and     a
        jr      nz,CopperRegisterLoop

        nextreg COPPER_CONTROL_LO_NR_61,0
        nextreg COPPER_CONTROL_HI_NR_62,192                 ; start the copper
        nextreg BaseMMU,10                                  ; place back correct bank for MMU2
        
        ret

    SampleToPlay:            db      0                       ; either 0 or 1 to flag for sample playing
    SampleCurrentBank:       db      0                       ; the bank where the current sample resides
    SampleCurrentAddress:    dw      0                       ; Source Address (working)
    SampleCurrentLength:     dw      0                       ; Length (working)
    CopperTotalLines:        dw      0
    CopperHalveLines:        db      0
    CopperDoubleLines:       dw      0


    Hz5060:                  db      0                       ; contents of reg 5


    SEND_COPPER_DMA:

        ld      bc,$243B                                    ; we will select nextreg $60
        ld      a,$60                                       ; copper data!
        out     (c),a
        ld      c,$6B                                       ; reg B - len, reg C - 11=MB02+ / 107=DATA-GEAR
        ld      hl,DMADATACOPPEROUT
        outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi : outi
        ret


    DMADATACOPPEROUT:        
        db      $C3                     ; REG6 Reset
        ; temporarily declare PORT B as source in REG0 (bit2=0), (B=SOURCE, A=TARGET)
        db      $C7                     ; R6-RESET PORT A Timing
        db      $cb                     ; R6-RESET PORT B Timing
        db      %01111101               ; REG 0: DMA mode=transfer. Port A=Source, Port B=Target
        
    DMA_CopperSource:        dw      0000                    ;        Port A Address (Source address)
    DMA_CopperLength:        dw      0000                    ;        Length of transfer block

        db      %01010100               ; REG 1: PORT A=memory,incremented
        db      2
        db      %01101000               ; REG 2: PORT B=I/O, fixed adress
        db      2
        db      %10101101               ; REG 4: Write PORT B (Port starting address. Continuous transfer mode)
        dw      $253B                   ; Adress of PORT B (target adress) (nextreg port)
        db      $82                     ; R5-Stop on end of block, RDY active LOW
        db      $CF                     ; R6-Load
        db      $B3                     ; REG 6: force ready
        db      %10000111               ; REG 6: Enable DMA



    SetDrive:
        xor     a                       ; 
        rst     $08                     ; 
        db      M_GETSETDRV             ; get drive
        ld      (drive),a               ; 
        ret


    SetBank:                 
        ld (CurrentBank),a
        nextreg $52,a
        ret

    FilenameStream  equ filebuffer
        ; db "MOD815k.wav"
        ; db 0 

    drive:          db 0 
    CurrentBank :   db 0 
    FHandle:        db 0 
    Allblocksdone:  db 0 
    end asm 
end sub 

sub backupsysvar() 

	asm 
		di 
		nextreg MMU7_E000_NR_57,90
		ld hl,$5C00
		ld de,$e000 
		ld bc,256
		ldir 
		
	end asm 
'	SaveSD("sysvar.bin",$e000,256)
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


sub fastcall PeekString2(address as uinteger,byref outstring as string)
    asm  
        ex      de, hl 
        pop     hl 
        ex      (sp), hl
        jp      .core.__STORE_STR 
    end asm 
end sub

sub Browser(temp$ as string,ext$ as string)
	'BBREAK
	'ShowLayer2(0)
	'NextReg($8,$fa)
	for p=0 to 2 : poke @extname+p, code(ext$(p)) : next 
	for p=0 to len(temp$)-1 : poke @testtext+cast(uinteger,p), code(temp$(p)) : next 
	poke @testtext+cast(uinteger,p),255
		
	asm 	
			di 
			im      1
			IDEBROWSER	            equ	$01ba 
			LAYER		            equ $9c
			IDEBASIC 	            equ $1c0
			; Next Registers
			nextregselect           equ     $243b
			nextregaccess           equ     $253b
			nxrturbo                equ     $07
			turbomax                equ     2
			nxrmmu6                 equ     $56
			nxrmmu7                 equ     $57
			tstack	                equ 	$bf00
			ld      (stackstore),sp 
			ld      sp,tstack
			ei
browser2:

			ld      a,$3f			    ; 	all capabilities
			ld      hl,ftbuff		    ; 	hl = filetypes 
			ld      de,testtext 		; 	de info at bottom of screen +$FF 
			exx
pressesq:
			ld      c,7 				; 	RAM 7 required for most IDEDOS calls
			ld      de,$01ba 		    ; 	IDEBROWSER 
			rst     $8
			defb    $94 	            ; MP3DOS
			jp      z,FILEOK
			; jp    nz,browser2
			jp      nz,FILERROR
			jp      c,FILERROR
			
FILEOK:
			ld      de,filebuffer
			jp      copyRAM7tode
			ret 
	
FILERROR:
			jp      endout
			; on ya own mate
			ret 

copyRAM7tode:
            push    hl                      ; save source address
            ld      bc,nextregselect
            ld      a,nxrmmu6
            out     (c),a
            inc     b
            in      l,(c)                   ; L=current MMU6 binding
            ld      a,7*2+0
            out     (c),a                   ; rebind to RAM 7 low
            dec     b
            ld      a,nxrmmu7
            out     (c),a
            inc     b
            in      h,(c)                   ; H=current MMU7 binding
            ld      a,7*2+1
            out     (c),a                   ; rebind to RAM 7 high
            ex      (sp),hl                 ; save MMU6/7 bindings, refetch source
            ld      bc,$ffff                ; string len, -1 to exclude terminator
cr7tomainloop:
            ld      a,(hl)                  ; copy a byte
            inc     hl
            ld      (de),a
            inc     de
            inc     bc                      ; increment string length
            inc     a
            jr      nz,cr7tomainloop        ; back unless $ff-terminator copied
            pop     hl
            ld      a,l
            defb    $ed,$92,nxrmmu6         ; restore MMU6 binding
            ld      a,h
            defb    $ed,$92,nxrmmu7         ; restore MMU7 binding
            ld      hl,filebuffer
            add     hl,bc 
            ld      a,$ff
            ld      (hl),a
            jp      endout
ftbuff:   	
			defb	4
end asm 
extname:
asm 
            defb	"TAP:"
            defb	$ff	; all files 
end asm 
testtext:
asm 
testtext:
            Defs    64,32
            DB      255
stackstore:		

            dw      0,0
endout:
			di
			ld      bc,32765       ;I/O address of horizontal ROM/RAM switch
			ld      a,(23388)      ;get current switch state
			set     4,a            ;move left to right (ROM 2 to ROM 3)
			and     $F8           ;also want RAM page 0
			; or 0
			; ld a,$10
			ld      (23388),a      ;update the system variable (very important)
			out     (c),a          ;make the switch
			rst     $20
			ld      sp,(stackstore)
			ei 
			

end asm 
	NextReg($4A,0)		
end sub 

messagebyte:
asm
messagebyte:
	        db      0,0
end asm 

filebuffer:
asm 
filebuffer:
            db      "MOD815k.wav"
            db      0
end asm 

