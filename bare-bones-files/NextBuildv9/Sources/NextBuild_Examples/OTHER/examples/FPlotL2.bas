'!ORG=24576
' FPlotL2 Example 
' em00k dec20

asm 
	  di 					;' I recommend ALWAYS disabling interrupts 
end asm 
#define NEX 				' This tells nextbuild we are making a final NEX and do not Load from SD 
							' with out you would need eachfile that is used with LoadSDBank
							' and must be before include <nextlib.bas>
#include <nextlib.bas>

border 0 
InitLayer2(MODE320X256)

LoadSDBank("[]font1.spr",0,0,0,40) 	' load the first font to bank 40 

FL2Text(0,0,"THIS EXAMPLE SHOWS THE FL2TEXT COMMAND",40)
FL2Text(0,1,"THAT DRAWS TEXT WITH A FONT ON 320X256",40)
FL2Text(0,5,"PRESS SPACE TO SEE A PLOT EXAMPLE",40)

WaitKey()

dim px as uinteger 
dim py, pcol, c as ubyte 

do 
	for py = 0 to 254 step 1
		for px = 0 to 319 step 1 
			FPlotL2(py,px, c+px+py band 255) 
		next px 
	next py 
	c = c + 16 
loop 
