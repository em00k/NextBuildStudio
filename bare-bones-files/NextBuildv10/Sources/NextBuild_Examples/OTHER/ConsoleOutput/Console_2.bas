' NextBuildStudio CSpect Console 
' demonstrates sending messages to CSpect STDOUT ie. the console

'!org=$8000                 ' start at $8000
#define NEX                 ' lets make a NEX file
#include <nextlib.bas>      ' include the nextlib
#include <print42.bas>      ' lets do 42 char prints

' Variables go here
dim     x   as ubyte = 0
dim     y   as ubyte = 0
dim     cy  as ubyte = 0


' Initialise here
MainInit()                  ' run MainInit() sub routine

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
    Console("Any ASCII messages can be sent to the console"+chr $0d)

    PressKey() 
    printat42(cy,x) : cy = cy + 1
    print42("Good for debugging")

    for x = 0 to 10
        printat42(5+x, 0)
        print42(str x)
        Console(str(x))
        WaitRetrace(100)
    next x  
    
    printat42(x+7,0) 
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

    ' set border, paper, ink
    border 1 : paper 0 : ink 6 : cls

    ' print text
    print42("Welcome to NextBuildStudio!")

end sub

