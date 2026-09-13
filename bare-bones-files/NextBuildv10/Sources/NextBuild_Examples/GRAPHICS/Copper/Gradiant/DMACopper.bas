'!org=32768

#define NEX 
#include <nextlib.bas>
LoadSDBank("background.bmp",0,0,1078,18)

dim copper_data_offset as ubyte

NextReg(SPRITE_CONTROL_NR_15,%00000000)
NextReg(LAYER2_RAM_BANK_NR_12,9)

'ShowLayer2(1)                           ' show layer 2       
InitCopper()                            ' initialize copper
CopperDMACopy(@CopperData,24)           ' do the first DMA copy

do
   UpdateCopperData()                  ' update copper data
   DMAReload(@CopperData)              ' retrigger DMA to copy new data
   WaitRetrace2(192)                   ' wait for retrace 
loop


sub UpdateCopperData()
    ' routine to update the x offset of the COPPER data
    for yx = 0 to 4                     ' 4 sections of copper data
        poke @CopperData+3+cast(uinteger,yx*4), copper_data_offset*yx
    next yx 

    copper_data_offset = copper_data_offset + 1

end sub 

' ------------------------------------------------------------------------------------------------
' Copper routines
' ------------------------------------------------------------------------------------------------  


sub InitCopper()
    asm     
        ;------------------------------------------------------------------------------
        ; InitCopper
        ; This routine will initialize the COPPER engine
        ;------------------------------------------------------------------------------
        Nextreg COPPER_DATA_NR_60, %10000001         ; 
        Nextreg COPPER_DATA_NR_60, 242               ; 
        Nextreg COPPER_CONTROL_LO_NR_61, 0           ; 
        Nextreg COPPER_CONTROL_HI_NR_62, %11000000   ; enable COPPER
    end asm 
end sub 


sub fastcall CopperDMACopy(byval dma_source_address as uinteger, byval dma_length as uinteger)

    asm 
        ;------------------------------------------------------------------------------
        ; CopperDMACopy
        ; This routine will upload list of bytes to the Nextreg port $253B
        ; we preselect the Nextreg $60 and which will upload to the COPPER. 
        ; hl = source address of the COPPER data
        ; bc = length of the COPPER data
        ;------------------------------------------------------------------------------
        ld 		(DMA_CopperSource),hl           ; hl = source address
        pop 	hl                              ; get the return address off the stack into hl
        ex 		(sp), hl                        ; swap the top of the stack with hl

        exx                                     ; Swap the alternate registers
        pop 	hl                              ; get the length off the stack into hl
        exx                                     ; Swap regs 

        ld      (DMA_CopperLength),hl           ; store hl = length
        call    send_copper_dma

        exx
        push    hl
        exx

        ret                                     ; leave routine

    send_copper_dma:
        nextreg VIDEO_LINE_OFFSET_NR_64,46
        nextreg COPPER_CONTROL_HI_NR_62,%11000000  ; ensure the COPPER PC is reset 
        nextreg COPPER_CONTROL_LO_NR_61,$00

        ld      bc,$243B                        ; Select COPPER register $60
        ld      a,$60                           ; on port $243B
        out     (c),a
        ld      c,$6B                           ; DMA Port 
        ld      hl,dma_control
        ; 19 DMA bytes
        outi : outi : outi : outi : outi : outi : outi
        outi : outi : outi : outi : outi : outi : outi
        outi : outi : outi : outi : outi
        ret
    dma_control:
        db      $C3                     ; WR6: Reset
        db      $C7                     ; WR6: RESET PORT A Timing
        db      $CB                     ; WR6: RESET PORT B Timing
        db      %01111101               ; WR0: DMA mode=transfer. Port A=Source, Port B=Target

        DMA_CopperSource:       
                dw      0000            ; Port A Address (Source address)
        DMA_CopperLength:        
                dw      0000            ; Length of transfer block

        db      %01010100               ; WR1: PORT A=memory,incremented
        db      2
        db      %01101000               ; WR2: PORT B 
        db      2
        db      %10101101               ; WR4: Write PORT B (Port starting address. Continuous transfer mode)
        dw      $253B                   ; Adress of PORT B (target adress) (nextreg port)
        db      $82                     ; WR5: Stop on end of block
        db      $CF                     ; WR6: Load
        db      $B3                     ; WR6: force ready
        db      %10000111               ; WR6: Enable DMA
        end asm 
end sub 


SUB fastcall DMAReload(byval dma_source_address as uinteger)
    asm 	
        ;------------------------------------------------------------------------------
        ; DMAReload
        ; This routine will retrigger the DMA engine
        ; we preselect the Nextreg $60 and point to the copper data
        ;------------------------------------------------------------------------------
        nextreg COPPER_CONTROL_HI_NR_62,%11000000               ; ensure the COPPER PC is reset 
        nextreg COPPER_CONTROL_LO_NR_61,$00        
        ld      bc,$243B                                        ; Select COPPER register $60
        ld      a,$60                                           ; on port $243B
        out     (c),a
        ld 		bc,(%01010100<<8)|Z80_DMA_PORT_DATAGEAR			; 7 R0-Transfer mode, A -> B, write adress ; 7 DMAPORT									
        out 	(c),b							                ;  
        out 	(c),l							                ;  start address in hl 
        out 	(c),h							                ;  
        ld 		hl,(DMA_ENABLE<<8)|DMA_LOAD		                ; 
        out 	(c),l 							                ;  
        out		(c),h 							                ;   
    end asm 	
end sub 


' ------------------------------------------------------------------------------------------------
' Copper data
' ------------------------------------------------------------------------------------------------

CopperData:
asm

        ; top section of copper list
        db      128           ; wait %1000 0000
        db      0                               ; copper line 0
        db      LAYER2_XOFFSET_NR_16
        db      0                               ; x offset 0

        ; 1st section of copper list
        db      128                             ; wait %1000 0000
        db      48                              ; raster line 48
        db      LAYER2_XOFFSET_NR_16
        db      1                               ; x offset 0

        ; 2nd section of copper list
        db      128                             ; wait %1000 0000
        db      96                              ; raster line 94
        db      LAYER2_XOFFSET_NR_16
        db      2                               ; x offset 0    

        ; 3rd section of copper list
        db      128                             ; wait %1000 0000
        db      142                             ; raster line 145
        db      LAYER2_XOFFSET_NR_16
        db      3                               ; x offset 0

        ; 3rd section of copper list, do first 
        db      128                           ; wait %1000 0000
        db      190                             ; raster line 200
        db      LAYER2_XOFFSET_NR_16
        db      3                               ; x offset 0

        db      255                             ; end of copper list
        db      255                             ; write 255 to mark end of copper list
        db      255 
        db      255 
end asm 

