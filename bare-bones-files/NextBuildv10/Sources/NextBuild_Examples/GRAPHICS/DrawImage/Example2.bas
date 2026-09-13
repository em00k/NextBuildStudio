' NextBuildStudio Application Template
' Generated on 03/11/2025
'!org=$8000

#define NEX
#include <nextlib.bas>
#include <print42.bas>

' load a system font
LoadSDBank("[]font5.fnt",0,0,0,32)
' Load Panel Data
LoadSDBank("rex-128x96.nxi",0,0,0,34)     ' 12288 ~ 2 banks
LoadSDBank("dw3-128x96.nxi",0,0,0,36)     ' 12288 ~ 2 banks
LoadSDBank("tuba-128x96.nxi",0,0,0,38)     ' 12288 ~ 2 banks
LoadSDBank("ssm-128x96.nxi",0,0,0,40)     ' 12288 ~ 2 banks


' Variables go here
dim     x           as ubyte = 0
dim     y           as ubyte = 0
dim     tick        as ubyte

dim     current_panel as uinteger 

' Initialise here
MainInit()

' Main loop
do

    UpdateImage()

    WaitKey()
        
loop


'----------------------------------------------------------
' Subroutines go here

sub UpdateImage()
    
    
    if tick > 3
        tick = 0
    endif

    if tick = 0
        current_panel = @shot1
    elseif tick = 1
        current_panel = @shot2
    elseif tick = 2
        current_panel = @shot3
    elseif tick = 3
        current_panel = @shot4
    endif

    x = x + 16 
    y = y + 16

    if y > 112
        y = 0
    endif 
    if x > 128
        x = 0 
    endif 

    DrawImage(x,y,current_panel,0)

    print at 0,0;tick 
    print at 1,0;x;"  ",y;"  "

    tick = tick + 1

end sub 

sub MainInit()

    ' Lets set up L2
    InitLayer2(MODE256X192)
    '
    ClearLayer2(2)
    '
    ShowLayer2(1)
    ' set USL order
    NextReg(SPRITE_CONTROL_NR_15,%000_100_00)

    ' set border, paper, ink
    border 1 : paper 0 : ink 6 : cls



    ' this is NextBuildStudio L2 Text
    ' L2Text(0,1,"POWERED BY BORIELS",32,0)
    ' L2Text(0,2,"ZX BASIC COMPILER",32,0)

end sub

shot1:
    asm
        db 34, 128, 96
        ds 2
    end asm 
shot2:
    asm
        db 36, 128, 96
        ds 2
    end asm 
shot3:
    asm
        db 38, 128, 96
        ds 2
    end asm 
shot4:
    asm
        db 40, 128, 96
        ds 2
    end asm 
