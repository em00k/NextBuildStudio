' welcome to NextBuild Studio! 
' 
'!org=24576
#define NEX 
#include <nextlib.bas>

' NBS uses Boriel ZX Compiler which means it follows basic like syntax, but line
' numbers are not needed, eg : 

For x = 0 to 100
    Plot x,x
Next x 

WaitKey()

' You can use labels to jump to code, but it's preferred to use sub routines or functions

paper 1 : ink 6 : border 1 : cls 

x = 0 

ThisIsALabel:

    x = x + 1 
    Print at 2,0; str(x)
    if x < 100 then Goto ThisIsALabel
        
WaitKey()

' sub routines let your programs flow, 

sub updateX()
    cls 
    do 
        x = x + 1
        print at 2,0;str(x)
    loop until x = 100 
end sub 

Print "The routine will not run until called"
WaitKey()

updateX()
WaitKey()

' You can use F1 on a keyword to open the help files, put the cursor on the start of
' InitLayer2 and press F1, or pick an empty to open the help Index 

InitLayer2(MODE256X192)

' now go to 3-NextZXOS.bas



