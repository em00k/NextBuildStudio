'!org=24576
'!heap=512
'!opt=4
#define NEX
#define IM2

#include <nextlib.bas>
#include <print42.bas>
#include <nextlib_filelib.bas>

' Print the first few lines of a text file. fReadLine writes into a
' caller buffer, returns bytes read (0 = EOF), and consumes CR / LF / CRLF
' terminators.

dim file$    as string = "lorum_ipsum.txt"
dim handle   as ubyte
dim buf(127) as ubyte
dim got      as uinteger
dim line$    as string
dim i        as uinteger
dim row      as ubyte

printat42(0, 0)
print42("ReadLine demo: " + file$)

fOpenDrive()
handle = fOpenFile(file$)

if handle = 0
    printat42(1, 0)
    print42("cannot open " + file$)
    do
        WaitRaster(192)
    loop
endif

row = 2
do
    got = fReadLine(handle, @buf(0), 127)
    if got = 0
        exit do
    endif
    buf(got) = 0                     ' null terminator so we can build a string
    line$ = ""
    for i = 0 to got - 1
        line$ = line$ + chr$(buf(i))
    next i
    printat42(row, 0)
    print42(line$)
    row = row + 1
    if row > 20
        exit do
    endif
loop

fClose(handle)

printat42(row + 1, 0)
print42("done")

do
    WaitRaster(192)
loop
