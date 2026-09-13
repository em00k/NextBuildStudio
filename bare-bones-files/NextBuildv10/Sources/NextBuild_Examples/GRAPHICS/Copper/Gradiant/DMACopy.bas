'!org=32768

#define NEX 
#include <nextlib.bas>
#include <keys.bas>

asm 
    nextreg SPRITE_CONTROL_NR_15, %00000011
end asm 

dim x       as uinteger
dim y       as ubyte

LoadSDBank("myfirstsprite.spr",0,0,0,20)
InitSprites2(64,0,20)

LoadBMP("background.bmp")
ShowLayer2(1)
InitCopper()

do

    ReadKeys()
    UpdatePlayer()    
    UpdateCopperData()
    CopperDMACopy(@CopperData,24)
    WaitRetrace2(192)

loop

sub UpdatePlayer()

    UpdateSprite(x,y,0,0,0,0)
    x = x + 1 

end sub 

dim copper_data_offset as ubyte

sub UpdateCopperData()

    for yx = 0 to 4
        poke @CopperData+3+cast(uinteger,yx*4), copper_data_offset*yx
    next yx 

    copper_data_offset = copper_data_offset + 1

end sub 

CopperData:
asm


    ; top section of copper list
    db      128           ; wait %1000 0000
    db      0                               ; copper line 0
    db      LAYER2_XOFFSET_NR_16
    db      0                               ; x offset 0

    ; 1st section of copper list
    db      128           ; wait %1000 0000
    db      48                              ; copper line 16
    db      LAYER2_XOFFSET_NR_16
    db      1                               ; x offset 0


    ; 2nd section of copper list
    db      128           ; wait %1000 0000
    db      94                              ; copper line 32
    db      LAYER2_XOFFSET_NR_16
    db      2                               ; x offset 0    


    ; 3rd section of copper list
    db      128           ; wait %1000 0000
    db      145                              ; copper line 48
    db      LAYER2_XOFFSET_NR_16
    db      3                               ; x offset 0

    ; 3rd section of copper list, do first 
    db      128+1           ; wait %1000 0000
    db      200                              ; copper line 48
    db      LAYER2_XOFFSET_NR_16
    db      3                               ; x offset 0

    db      255 
    db      255 
    db      255 
    db      255 
end asm 

sub InitCopper()
    asm 
    Nextreg COPPER_DATA_NR_60, %10000001
    Nextreg COPPER_DATA_NR_60, 242
    Nextreg COPPER_CONTROL_LO_NR_61, 0
    Nextreg COPPER_CONTROL_HI_NR_62, %11000000
    end asm 
end sub 

sub ReadKeys()

    if MultiKeys(KEYP)
        x = x + 1 
    elseif MultiKeys(KEYO)
        x = x - 1 
    endif 

    if MultiKeys(KEYQ)
        y = y - 1 
    elseif MultiKeys(KEYA)
        y = y + 1 
    endif 

end sub 


sub fastcall CopperDMACopy(byval dma_source_address as uinteger, byval dma_length as uinteger)

    asm 
        ;------------------------------------------------------------------------------
        ; CopperDMACopy
        ; This routine will upload list of bytes to the Nextreg port $253B
        ; we preselect the Nextreg $60 and then send the list of bytes to the port
        ; hl = source address we want to copy from
        ; bc = length of the data we want to copy
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
        ret

    send_copper_dma:
        nextreg COPPER_CONTROL_HI_NR_62,%11000000
        nextreg COPPER_CONTROL_LO_NR_61,$00

        ld      bc,$243B                                    ; we will select nextreg $60
        ld      a,$60                                       ; copper data!
        out     (c),a
        ld      c,$6B                                       ; reg B - len, reg C - 11=MB02+ / 107=DATA-GEAR
        ld      hl,DMADATACOPPEROUT
        ; 19 DMA bytes
        outi : outi : outi : outi : outi : outi : outi
        outi : outi : outi : outi : outi : outi : outi
        outi : outi : outi : outi : outi
        ret


        DMADATACOPPEROUT:        
        db      $C3                     ; REG6 Reset
        ; temporarily declare PORT B as source in REG0 (bit2=0), (B=SOURCE, A=TARGET)
        db      $C7                     ; R6-RESET PORT A Timing
        db      $CB                     ; R6-RESET PORT B Timing
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

        end asm 
end sub 
