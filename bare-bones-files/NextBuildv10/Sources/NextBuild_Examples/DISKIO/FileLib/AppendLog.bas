'!org=24576
'!heap=512
'!opt=4
#define NEX
#define IM2

#include <nextlib.bas>
#include <print42.bas>
#include <nextlib_filelib.bas>

' Append one line to a log file. Opens the file if it exists (seeks to
' end and appends), or creates it fresh. Shows fGetFilesize + fSetPos.

dim logname$ as string = "run.log"
dim msg$     as string = "hello from NextBuild"
dim handle   as ubyte
dim size     as ulong
dim wrote    as uinteger
dim line$    as string
dim line_len as uinteger

InitLayer2(MODE256X192)
print42("AppendLog demo")

fOpenDrive()

' Try to open existing; if not there, create it.
handle = fOpenFile(logname$)
if handle = 0
    handle = fCreate(logname$)
    if handle = 0
        printat42(1,0) : ink 2
        print42("cannot create " + logname$)
        do
            WaitRaster(192)
        loop
    endif
    size = 0
    printat42(1,0)
    print42("created " + logname$)
else
    size = fGetFilesize(handle)
    fSetPos(handle, size)   ' seek to end for append
    printat42(2,0)
    print42("opened " + logname$ + " (" + str(size) + " bytes)")
endif

line$ = msg$ + chr$(13) + chr$(10)
line_len = len(line$)

' Boriel string layout: [len_lo][len_hi][chars...]; PEEK(uinteger, @s)
' gives the heap-block address, +2 gets past the length header to the
' actual character bytes.
dim char_ptr as uinteger
char_ptr = peek(uinteger, @line$) + 2

wrote = fWriteBytes(handle, char_ptr, line_len)
fClose(handle)

if wrote = line_len
    printat42(3,0)
    print42("appended " + str(wrote) + " bytes")
else
    printat42(3,0)
    print42("short write: " + str(wrote) + "/" + str(line_len))
endif

do
    WaitRaster(192)
loop
