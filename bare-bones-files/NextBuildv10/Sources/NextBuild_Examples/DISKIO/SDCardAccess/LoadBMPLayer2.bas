'
' Load a BMP and scroll using the ScrollLayer() command 
' Check out the DrawPrimitives for advanced L2 Scrolling
' See the FileLib for advanced SD card access

#include <nextlib.bas>

InitLayer2(MODE256X192)		' sets up Layer2

do 
	LoadBMP("2.bmp")		' BMP is loaded to L2 RAM 
	
	WaitRetrace(1000)

	dim x as ubyte = 0 

	WaitRetrace(100)		' Use WaitRetrace instead of PAUSE! 

	for y=0 to 192
		WaitRaster(192)
		ScrollLayer(0,y)	' Scroll Vertical
	next y 

	WaitRetrace(1000)

	LoadBMP("1.bmp")		' Load next image 

	WaitRetrace(1000)

	for x=0 to 254
		WaitRaster(192)
		ScrollLayer(x+2,0)	' scroll horizontally
	next x 

	WaitRetrace(1000)

loop 
           