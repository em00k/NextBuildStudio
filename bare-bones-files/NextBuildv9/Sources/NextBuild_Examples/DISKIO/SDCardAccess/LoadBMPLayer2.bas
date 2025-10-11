
' Load a BMP and scroll with HW 

#include <nextlib.bas>
InitLayer2(MODE256X192)

do 
	LoadBMP("2.bmp")
	ShowLayer2(1)			' ON 
	
	WaitRetrace(1000)

	dim x as ubyte = 0 
	' lets scroll layer2
	pause 0 

	for y=0 to 192
		WaitRaster(192)
		ScrollLayer(0,y)
	next y 

	pause 50

	LoadBMP("1.bmp")
	ShowLayer2(1)			' ON 

	WaitRetrace(1000)

	for x=0 to 254
		WaitRaster(192)
		ScrollLayer(x+2,0)
	next x 



loop 
           