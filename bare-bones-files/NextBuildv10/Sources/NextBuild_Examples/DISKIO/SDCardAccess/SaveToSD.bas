' Simple demo that creates a ULA screen and saves it to SD
' Then loads it back from SD
' See the FileLib for advanced SD card access

#include <nextlib.bas>

dim n as ubyte 

paper 7: ink 0: border 7: cls 

print ink 1;"Lets print some text.." : WaitKey() : cls 

for n = 0 to 22
	print "HELLO THERE WORLD ! ! ! ! ! !"
	ink rnd*7
next 

' SaveSD(filename,address,number of bytes)
' lets save the screen 

SaveSD("output.scr",16384,6912)

WaitRetrace(1000) : cls

print ink 1;"Screen saved to SD.."
print ink 1;"Lets load it back.."

WaitRetrace(1000)

' LoadSD(filename,address,number of bytes,offset)
LoadSD("output.scr",16384,6912,0)

border 1

do 

loop 
    