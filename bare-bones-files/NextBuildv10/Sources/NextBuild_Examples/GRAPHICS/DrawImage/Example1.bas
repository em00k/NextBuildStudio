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


' Initialise here
MainInit()

DrawImage(0,0,@flag2,0)


' Main loop
do

    ' Wait for raster line 192
    
    WaitKey()
    UpdateImage()

    'WaitRaster(192)
    dim timer1 as UBYTE
    
    if  timer1 =  0
        ' timer triggered 
         timer1 = 1
        tick = (tick + 1) band 3
    else 
         timer1 =  timer1 - 1 
    endif   
    
loop


'----------------------------------------------------------
' Subroutines go here

dim current_flag as uinteger 

sub UpdateImage()

    if tick = 0
        current_flag = @flag1
    elseif tick = 1
        current_flag = @flag2
    else
        current_flag = @flag3
    endif

    x = x + 16 
    y = y + 16

    DrawImage(x,y,current_flag,0)

    print at 0,0;tick 
    print at 1,0;x;"  ",y;"  "


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

flag1:
    asm
        db 34, 128, 96
        ds 2
    end asm 
flag2:
    asm
        db 36, 128, 96
        ds 2
    end asm 
flag3:
    asm
        db 38, 128, 96
        ds 2
    end asm 
