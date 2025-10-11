; Directory$ = GetHomeDirectory() ; Lists all files and folder in the home directory
Directory$ = "C:\NextBuildv7\Sources\JumpyMoley\data\" ; Lists all files and folder in the home directory

Structure fileinfo
  name$
  size.i 
EndStructure

NewList files.fileinfo()
  


If ExamineDirectory(0, Directory$, "*.pcm")  
  While NextDirectoryEntry(0)
    If DirectoryEntryType(0) = #PB_DirectoryEntry_File
      Type$ = "[File] "
      Size$ = " (Size: " + DirectoryEntrySize(0) + ")"

      AddElement(files())
      files()\name$=DirectoryEntryName(0)
      files()\size=DirectoryEntrySize(0)
    Else
      Type$ = "[Directory] "
      Size$ = "" ; A directory doesn't have a size
    EndIf
    
  ;  Debug Type$ + DirectoryEntryName(0) + Size$
  Wend
  FinishDirectory(0)
EndIf

offset = 0 : bank = 32 : loop = 0 
ForEach files()
  fi$=files()\name$
  siz=files()\size
  
  p$+fi$+"+"
  
  line$+"$"+Hex(bank)+"00,"+Str(offset)+","+Str(siz)+" ; "+fi$+#CRLF$
  offset+siz
  If offset>16384
    offset = Mod (offset,16384)
    bank + 2
  EndIf 
Next 

Debug p$
cmd$="cmd.exe"
param$="/c copy /b "+Left(p$,Len(p$)-1)+" output.dat"

copypcms = RunProgram(cmd$,param$,Directory$, #PB_Program_Open | #PB_Program_Read)

If copypcms
    While ProgramRunning(copypcms)
      If AvailableProgramOutput(copypcms)
        Output$ + ReadProgramString(copypcms) + Chr(13)
      EndIf
    Wend
    Output$ + Chr(13) + Chr(13)
    Output$ + "Exitcode: " + Str(ProgramExitCode(copypcms))
    
    CloseProgram(copypcms) ; Close the connection to the program
  EndIf


Debug line$
; IDE Options = PureBasic 5.73 LTS (Windows - x86)
; CursorPosition = 12
; EnableXP