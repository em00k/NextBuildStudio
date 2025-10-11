'!ORG=24576
' demo for changing from 2 screen modes 

#DEFINE NEX 
#include <nextlib.bas>

LoadSDBank("test.nxp",0,0,0,32)
LoadSDBank("safire1.bin",0,0,0,37)
LoadSDBank("mushroom.sl2",0,0,0,48)
LoadSDBank("sanity_1_exported_256.nxi",0,0,0,38)

do
	' show the 256x192 image
	NextReg(LAYER2_RAM_BANK_NR_12,12)			' InitLayer will clear the current L2 Ram - we dont want to clear our loaded images
	InitLayer2(MODE256X192)   	 				' enable L2 
	NextReg(LAYER2_RAM_BANK_NR_12,38>>1)		' set L2 ram to first image
	ShowLayer2(TRUE)       						' ensure L2 enable 
	WaitKey()

	' show the 640x256 image 
	NextReg(LAYER2_RAM_BANK_NR_12,12)
	InitLayer2(MODE640X256)						' change to 640x256
	InitPalette(L2_PALETTE_P1,48+10,0,16,0)		' enasure the image palette is loaded
	NextReg(LAYER2_RAM_BANK_NR_12,48>>1)		' point L2 Ram to 2nd image
	ShowLayer2(TRUE)							' ensure L2 is enable
	WaitKey()

loop 
