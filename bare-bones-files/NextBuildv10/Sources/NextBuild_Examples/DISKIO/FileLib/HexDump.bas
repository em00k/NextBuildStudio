'!org=24576
'!heap=512
'!opt=4
#define NEX
#define IM2

#include <nextlib.bas>
#include <print42.bas>
#include <nextlib_filelib.bas>

' Hex + ASCII dump of the first 128 bytes of a file. 8 bytes per line
' so both columns fit inside 42 col mode.

declare function nib$(n as ubyte) as string

dim file$    as string = "lorum_ipsum.txt"
dim handle   as ubyte
dim buf(127) as ubyte
dim got      as uinteger
dim fsize    as ulong
dim i        as uinteger
dim col      as ubyte
dim b        as ubyte
dim hex$     as string
dim ascii$   as string
dim row      as ubyte

InitLayer2(MODE256X192)

printat42(0, 0)
print42("HexDump demo")

fOpenDrive()
handle = fOpenFile(file$)
if handle = 0
    printat42(1, 0)
    print42("cannot open " + file$)
    do
        WaitRaster(192)
    loop
endif

fsize = fGetFilesize(handle)
printat42(1, 0)
print42(file$ + " = " + str(fsize) + " bytes")

got = fReadBytes(handle, @buf(0), 128)
fClose(handle)

row = 3
for i = 0 to got - 1 step 8
    hex$ = ""
    ascii$ = ""
    for col = 0 to 7
        if i + col < got
            b = buf(i + col)
            hex$ = hex$ + nib$(b >> 4) + nib$(b band 15) + " "
            if b >= 32 and b < 127
                ascii$ = ascii$ + chr$(b)
            else
                ascii$ = ascii$ + "."
            endif
        else
            hex$ = hex$ + "   "
        endif
    next col
    printat42(row, 0)
    print42(hex$ + " " + ascii$)
    row = row + 1
next i

printat42(row + 1, 0)
print42("end")

do
    WaitRaster(192)
loop

function nib$(n as ubyte) as string
    if n < 10
        return chr$(48 + n)
    endif
    return chr$(55 + n)
end function
