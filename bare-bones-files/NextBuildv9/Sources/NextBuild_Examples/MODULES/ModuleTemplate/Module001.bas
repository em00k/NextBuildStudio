' ------------------------------------------------------------------------------
' - BankManager Sample v.2.0 ---------------------------------------------------
' ------------------------------------------------------------------------------
' - Sample module 1 ------------------------------------------------------------
' ------------------------------------------------------------------------------

' ORG 24576 - $6000
' Fixed bank located at $6000 to $7fff
' Usable memory from $6000 to $dd00 minus Heap size 32kB yeah
'!master=Master.NEX		
'!org=24576
'!heap=1024
'!module 

Main()

#define NOSP 
#include <nextlib.bas>
#include "includes/globals.bas"


Sub Main()
	' Show parameters
	CLS256(0) 

	L2Text(0,0,"MODULE "+NStr(VarLoadModule),40,0)
	L2Text(0,1,"PARAM1 "+NStr(VarLoadModuleParameter1),40,0)
	L2Text(0,2,"PARAM2 "+NStr(VarLoadModuleParameter2),40,0)
	L2Text(0,3,"COUNTER "+NStr(VarPoints),40,0)
	VarPoints=VarPoints+1

	L2Text(0,22,"THIS IS MODULE 1  ",40,0)

	' Input for values
	L2Text(2,5,"SELECT MODULE 1-3: ",40,0) 
	VarLoadModule=GetKey(3)
	L2Text(22,5,NStr(VarLoadModule),40,0) 

	L2Text(2,6,"SELECT PARAMETER 1 0-9: ",40,0) 
	VarLoadModuleParameter1=GetKey(9)
	L2Text(26,6,NStr(VarLoadModuleParameter1),40,0) 
	
	L2Text(2,7,"SELECT PARARMETER 2 0-9: ",40,0) 
	VarLoadModuleParameter2=GetKey(9)
	L2Text(26,7,NStr(VarLoadModuleParameter2),40,0) 
	 
	WaitKey()
END SUB

 