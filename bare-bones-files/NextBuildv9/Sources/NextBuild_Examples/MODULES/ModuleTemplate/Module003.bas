' ------------------------------------------------------------------------------
' - BankManager Sample v.2.0 ---------------------------------------------------
' ------------------------------------------------------------------------------
' - Sample module 3 ------------------------------------------------------------
' ------------------------------------------------------------------------------

' ORG 24576 - $6000
' Fixed bank located at $6000 to $7fff
' Usable memory from $6000 to $dd00 minus Heap size 32kB yeah

'!org=24576
'!module 

Main()

#define NOSP 
#include <nextlib.bas>
#include "includes/globals.bas"


Sub Main()
	' Show parameters
	' What is NStr()? - a Non ROM reliant version of Str(ubyte)
	'
	CLS256(0)
	L2Text(0,0,"MODULE "+NStr(VarLoadModule),42,0)
	L2Text(0,1,"PARAM1 "+NStr(VarLoadModuleParameter1),42,0)
	L2Text(0,2,"PARAM2 "+NStr(VarLoadModuleParameter2),42,0)
	L2Text(0,3,"COUNTER "+NStr(VarPoints),42,0)
	
	L2Text(0,22,"THIS IS MODULE 3, PRESS A KEY ",42,0)
	
	SetLoadModule(ModuleSample1,VarLoadModuleParameter1+1,VarLoadModuleParameter2+1)
	
	WaitKey()
END SUB

 