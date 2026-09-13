'!org=32768

#define NEX 
#include <nextlib.bas>

dim copper_data_offset as ubyte

LoadSDBank("background.bmp",0,0,1078,18)' Load background into slot 18
NextReg(SPRITE_CONTROL_NR_15,%00000000) ' Ensure correct layer order 
NextReg(LAYER2_RAM_BANK_NR_12,9)        ' Set layer 2 bank ram (9*2 = 18)
NextReg(TURBO_CONTROL_NR_07,%00000011)  ' Enable 28Mhz

ShowLayer2(1)                           ' Enable layer 2       
InitCopper()                            ' Reset the COPPER
CopperDMAStart(@CopperData,24)          ' Set up the DMA 

' Main loop 
do
    UpdateCopperData()                  ' Update copper data
    DMAReload()                         ' Retrigger DMA to upload COPPER data
    WaitRetrace2(0)                     ' Wait for retrace 
loop

' ------------------------------------------------------------------------------------------------
' Copper routines
' ------------------------------------------------------------------------------------------------

sub UpdateCopperData()
    ' routine to update the x offset of the COPPER data
    ' store @CopperData
    dim yx as ubyte
    for yx = 0 to 4                               ' 4 sections of copper data
        poke @CopperData+3+cast(uinteger,yx*4), copper_data_offset*yx
    next yx 
    copper_data_offset = copper_data_offset + 1
end sub 

sub InitCopper()
    ' Initialize the COPPER
    NextReg(COPPER_DATA_NR_60, %10000001)          
    NextReg(COPPER_CONTROL_LO_NR_61, 0)            
    NextReg(COPPER_CONTROL_HI_NR_62, %11000000)     ' enable COPPER
end sub 

sub CopperDMAStart(byval dma_source_address as uinteger, byval dma_length as uinteger)
    ' Initialize the DMA to upload the COPPER data
    NextReg(VIDEO_LINE_OFFSET_NR_64,46)             ' COPPER Y offset 
    NextReg(COPPER_CONTROL_HI_NR_62,%11000000)      ' ensure the COPPER PC is reset 
    NextReg(COPPER_CONTROL_LO_NR_61,$00)            ' COPPER PC reset
    OUT TBBLUE_REGISTER_SELECT_P_243B, COPPER_DATA_NR_60
    OUT Z80_DMA_PORT_DATAGEAR, $C3                  ' WR6 : Reset
    OUT Z80_DMA_PORT_DATAGEAR, $C7                  ' WR6 : RESET PORT A Timing
    OUT Z80_DMA_PORT_DATAGEAR, $CB                  ' WR6 : RESET PORT B Timing
    OUT Z80_DMA_PORT_DATAGEAR, %01111101            ' WR0 : DMA mode=transfer. Port A=Source, Port B=Target
    OUT Z80_DMA_PORT_DATAGEAR, dma_source_address&255
    OUT Z80_DMA_PORT_DATAGEAR, dma_source_address>>8
    OUT Z80_DMA_PORT_DATAGEAR, dma_length&255       
    OUT Z80_DMA_PORT_DATAGEAR, dma_length>>8
    OUT Z80_DMA_PORT_DATAGEAR, %01010100              ' WR1 : PORT A=memory,incremented
    OUT Z80_DMA_PORT_DATAGEAR, 2
    OUT Z80_DMA_PORT_DATAGEAR, %01101000              ' WR2 : PORT B 
    OUT Z80_DMA_PORT_DATAGEAR, 2
    OUT Z80_DMA_PORT_DATAGEAR, %10101101
    OUT Z80_DMA_PORT_DATAGEAR, TBBLUE_REGISTER_ACCESS_P_253B&255    
    OUT Z80_DMA_PORT_DATAGEAR, TBBLUE_REGISTER_ACCESS_P_253B>>8
    OUT Z80_DMA_PORT_DATAGEAR, $82                     ' WR5 : Stop on end of block
    OUT Z80_DMA_PORT_DATAGEAR, $CF                     ' WR6 : Load
    OUT Z80_DMA_PORT_DATAGEAR, $B3                     ' WR6 : Load
    OUT Z80_DMA_PORT_DATAGEAR, %10000111               ' WR6 : Enable DMA
end sub 

SUB fastcall DMAReload()
    ' retrigger the DMA to upload the COPPER data
    NextReg(COPPER_CONTROL_HI_NR_62, %11000000)
    NextReg(COPPER_CONTROL_LO_NR_61, $00)
    OUT TBBLUE_REGISTER_SELECT_P_243B, COPPER_DATA_NR_60
    OUT Z80_DMA_PORT_DATAGEAR, DMA_ENABLE
    OUT Z80_DMA_PORT_DATAGEAR, DMA_LOAD
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
        db      96                              ; raster line 96
        db      LAYER2_XOFFSET_NR_16
        db      2                               ; x offset 0    

        ; 3rd section of copper list
        db      128                             ; wait %1000 0000
        db      142                             ; raster line 142
        db      LAYER2_XOFFSET_NR_16
        db      3                               ; x offset 0

        ; 4rd section of copper list, do first 
        db      128                             ; wait %1000 0000
        db      190                             ; raster line 190
        db      LAYER2_XOFFSET_NR_16
        db      3                               ; x offset 0

        db      255                             ; end of copper list
        db      255                             ; write 255 to mark end of copper list
        db      255 
        db      255 
end asm 

