' ------------------------------------------------------------------------------
' - BankManager Sample v.2.0 ---------------------------------------------------
' ------------------------------------------------------------------------------
' - Sample module 2 ------------------------------------------------------------
' ------------------------------------------------------------------------------


' ORG 24576 - $6000
' Fixed bank located at $6000 to $7fff
' Usable memory from $6000 to $dd00 minus Heap size 32kB yeah
'!master=Master.NEX
'!org=24576
'!module 

Main()

#define NOSP 
#include <nextlib.bas>
#include "includes/globals.bas"


Sub Main()
	' Show parameters
	CLS256(0)
	L2Text(0,0,"MODULE "+NStr(VarLoadModule),41,0)
	L2Text(0,1,"PARAM1 "+NStr(VarLoadModuleParameter1),41,0)
	L2Text(0,2,"PARAM2 "+NStr(VarLoadModuleParameter2),41,0)
	L2Text(0,3,"COUNTER "+NStr(VarPoints),41,0)
	
	L2Text(0,22,"THIS IS MODULE 2, PRESS A KEY ",41,0)
	
	For x = 0 to 6 
		DoTileBank16(x,2,x,43)
	next 

	SetLoadModule(ModuleSample1,VarLoadModuleParameter1+1,VarLoadModuleParameter2+1)
	
	WaitKey()
END SUB

 