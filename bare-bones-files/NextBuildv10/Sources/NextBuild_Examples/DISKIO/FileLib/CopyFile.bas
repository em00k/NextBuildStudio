'!org=24576
'!heap=512
'!opt=4
#define NEX
#define IM2

#include <nextlib.bas>
#include <print42.bas>
#include <nextlib_filelib.bas>

' Chunked file copy: reads srcname in 512-byte blocks and writes them to
' dstname until fReadBytes returns short. Prints progress + final byte count.

dim srcname$ as string = "lorum_ipsum.txt"
dim dstname$ as string = "lorum.copy"
dim srch     as ubyte
dim dsth     as ubyte
dim buf(511) as ubyte
dim got      as uinteger
dim wrote    as uinteger
dim total    as ulong = 0
dim chunks   as uinteger = 0

InitLayer2(MODE256X192)

printat42(0, 0)
print42("CopyFile: " + srcname$ + " -> " + dstname$)

fOpenDrive()

srch = fOpenFile(srcname$)
if srch = 0
    printat42(1, 0)
    print42("cannot open " + srcname$)
    do
        WaitRaster(192)
    loop
endif

dsth = fCreate(dstname$)
if dsth = 0
    fClose(srch)
    printat42(1, 0)
    print42("cannot create " + dstname$)
    do
        WaitRaster(192)
    loop
endif

do
    got = fReadBytes(srch, @buf(0), 512)
    if got = 0
        exit do
    endif
    wrote = fWriteBytes(dsth, @buf(0), got)
    if wrote <> got
        printat42(2, 0)
        print42("short write at chunk " + str(chunks))
        exit do
    endif
    total = total + got
    chunks = chunks + 1
    if got < 512
        exit do
    endif
loop

fClose(srch)
fClose(dsth)

printat42(2, 0)
print42("copied " + str(total) + " bytes in " + str(chunks) + " chunks")

do
    WaitRaster(192)
loop
