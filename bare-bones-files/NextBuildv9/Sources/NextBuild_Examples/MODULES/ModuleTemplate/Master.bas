' ------------------------------------------------------------------------------
' - NextBuild Studio
' ------------------------------------------------------------------------------
' - Main module ----------------------------------------------------------------
' ------------------------------------------------------------------------------
'
'  This is the "orchestrator" or Master.NEX part of the module system. This is 
'  the main NEX that will be excuted and control which modules load and run. 
'  It *must* be call Master.bas for NBS to detect module compilation is required
'  It is best to place any interrupt routines within the Master.NEX if you are 
'  using them. Load all your assets into the NEX file by using LoadSDBank() -  

'!org=57344				
'!opt=4
'!heap=1024

' ORG 57344 - $E000 
' Usable memory from $e000 to $ffff minus heap size

' 1024 bytes reserved for variables @ $4000 bank 24
' VarAddress located at $4000

' ULA is paged out and banks 24/25 live in slots 2&3 on start of modules
' For tilemap functions the relevants pages are put back 

' - Includes -------------------------------------------------------------------
#define NOSP 					' do not use the default SP location 
#define DEBUG  					' enable debug routines 
#define NEX 					' we are creating a NEX 
#include <nextlib.bas>
#include "includes/globals.bas"

' - Populate RAM banks for generating a NEX ------------------------------------
LoadSDBank("font8.spr",0,0,0,40)	' font 8 into bank 40
LoadSDBank("font10.spr",0,0,0,41)	' font 10 into bank 41 
LoadSDBank("font4.spr",0,0,0,42)	' font 4 into bank 42
LoadSDBank("bonky.spr",0,0,0,43)	' sprites into bank 43 

' - Main Entry -----------------------------------------------------------------

Main()

Sub Main()

	' Initialization here...
	' Prepare empty RAM 

	asm 
		; ensure interrupts are disabled 
		di 
		nextreg MMU2_4000_NR_52,24					; page in alternate banks for $6000-$DFFF
		nextreg MMU3_6000_NR_53,25					; we will use pages 24 & 25 
		; wipe ram 
		ld 		hl,$4000 							; lets make sure they're empty
		ld 		de,$4001 
		ld 		hl,(0)
		ld 		bc,$7d00 
		ldir 	
	end asm 

	' Start with module 1 
	SetLoadModule(ModuleSample2,0,0)				' set the current module to module 2
	
	' Now control will be handed over to the modules 

	do 
		ExecModule(VarLoadModule)
	loop 

END sub

' Execute module id
Sub ExecModule(id as ubyte)

	' This subroutine loads the correct module from SD
	' stores the stack and then jumps to $6000. when the 
	' module has finished, execution should return and the
	' stack restored. 

	dim file$ as string 

	' we will use NStr() instead of Str(). NStr() does not rely on ROM routine
	' and is much smaller than the full string library 
	common$=NStr(VarLoadModule)					

	file$="module"+common$+".bin"				' aseemble the complete filename to load

	LoadSD(file,24576,$7d00,0)					' load from SD to $6000

	asm 
		; call the routine
		ld 		(execmodule_end+1),sp 			; write the current stack to the label below
		call 	24576							; call the module 
	execmodule_end:
		ld		sp,0000							; smc from above 
	end asm 

end sub
