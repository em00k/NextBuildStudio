' welcome to NextBuild Studio! 
' 
' A valid .bas file should start with the START address where you want your
' program to start in memory, here we pick 24576 = $6000

'!org=24576

' now we need to tell NBS to make a NEX file and include all asset
' this MUST be done before the library include 

#define NEX 

' now the library include : 

#include <nextlib.bas>

' now we can begin our program, we will define some variables : 

dim x as UBYTE
dim y as UBYTE

x = 0 : y = 10

print at x, y;"HELLO WORLD!"

' do a forever loop so the program doesnt end and crash 

do : loop 

' click on the "Compile and Run" button at the bottom of the screen or 
' press F5 - this will compile the program and launch the NEX with CSpect

' The NEX file will be produced in the same folder as the .bas file

' Now go to 2-TheBasics.bas 