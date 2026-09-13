
' NextBuildStudio Application Template
' Generated on 17/09/2025
'!org=$8000
#define NEX
#include <nextlib.bas>
#include <print42.bas>

' Variables go here
dim     x as ubyte = 0
dim     y as ubyte = 0
dim cy    as ubyte = 0


' Initialise here
MainInit()

' Main loop
do
    x = 0 : y = 0 : cy = y 
    printat42(cy,x) :cy = cy + 1
    print42("CSpect can send text to the debugger"+chr $0d)

    PressKey() 
    printat42(cy,x) : cy = cy + 1
    print42("Check the console output"+chr $0d)

    printat42(cy,x) : cy = cy + 1
    Console("Hello from the console")
    Console("Press a key in CSpect")

    PressKey() 
    printat42(cy,x) : cy = cy + 1
    Console("You can print anything that you can on a normal screen"+chr $0d)

    PressKey() 
    printat42(cy,x) : cy = cy + 1
    Console("Good for debugging")

    for x = 0 to 10
        printat42(x, 5)
        print42(str x)
        Console(str(x))
        pause 100
    next x  
    
    printat42(cy,x) : cy = cy + 1
    print42("end of demo"+chr $0d)

    WaitKey()
    
    ' Wait for raster line 192
    WaitRaster(192)
    cls 
    
loop

'----------------------------------------------------------
' Subroutines go here

sub PressKey()
    ' simple wait for keypress
    dim i as ubyte 
    
    for i = 0 to 50 
        WaitRetrace(2)        
    next i 
    printat42(21,0) : print42("Press any key")
    WaitKey() 
    printat42(21,0) : print42("             ")
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

    ' print text
    print42("Welcome to NextBuildStudio!")


end sub

