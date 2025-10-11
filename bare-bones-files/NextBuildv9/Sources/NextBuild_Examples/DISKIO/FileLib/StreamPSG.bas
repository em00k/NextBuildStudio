'!org=24576
' NextBuild Studio - Impractical example of streaming
' This example shows the ability to stream from SD card
' and if you wanted to stream the PSG an ASM routine would be better
' 
'#!exe=bash -c "~/scripts/upload.sh Sources/NextBuild_Examples/DISKIO/FileLib/StreamPSG.nex /StreamPSG.nex"
'#!exe=bash -c "~/scripts/upload.sh Sources/NextBuild_Examples/DISKIO/FileLib/data/2019_MmcM_Conversions.psg /LoadBank.nex"

#define NEX 
#define IM2 

#include <nextlib.bas>
#include "../FileLib/FileLib-inc.bas"

'----------------------------------------------------------
' definitions 
'

const BUFSIZE as ubyte = 255
dim r           as ubyte = 0                      ' result flag 
dim b           as UINTEGER
dim position    as UINTEGER = 0 
dim address     as UINTEGER = @buffer 
dim pos         as UINTEGER
dim regstate(15) as ubyte 
dim size        as UINTEGER
dim vala        as ubyte 
dim read_pos    as uinteger = 0
dim write_pos   as uinteger = 0
dim used        as uinteger = 0
dim done        as ubyte = 0
dim cmd         as ubyte = 0 
dim laststate(15) as ubyte
declare function get_byte() as ubyte 

'----------------------------------------------------------
' Initialisation
'

for i = 0 to 15
        regstate(i) = 0 
        laststate(i) = $FF       ' force a write of regstate(i) on first frame
next i 
InitLayer2(MODE256X192)

print "stream SD > psg demo"

fOpenDrive()                                    ' open the default drive
'r = fOpenFile("2019_MmcM_Conversions.psg")      ' open the psg file 
'r = fOpenFile("lemotree.psg")      ' open the psg file 
r = fOpenFile("test.vgm")      ' open the psg file 
fSetPos(r, 16)                                  ' skip header

'----------------------------------------------------------
' Main loop 
'
if r 
    do
        fill_buffer()

        while used > 0
            cmd = get_byte()            
            if cmd = $FD then
                done = 1
                exit while
            elseif cmd = $FE then
                done = 1
                exit while
            elseif cmd = $FF then
                for i = 0 to 15
                     if regstate(i) <> laststate(i)
                        _ay(i, regstate(i))
                        laststate(i) = regstate(i)
                    endif
                next i
                WaitRaster(192)
            else
                while used = 0
                    fill_buffer()
                wend
                vala = get_byte()
                    if (cmd band $F) = 11 or (cmd band $F) = 12 then
                        vala = vala << 1        ' Double the period to lower envelop by one octave                        
                    endif
                regstate(cmd band $F) = vala
            endif
        wend
        
    loop until done
else 
    print "unable to open psg"
endif 


print "end of demo" 

do 
    WaitRaster(192) ' Wait for rasterline 
loop 

'----------------------------------------------------------
'  routines 

sub fill_buffer()
    ' fills a buffer is psg data 
    dim actual as uinteger
    dim free as uinteger = BUFSIZE - used
    dim max_chunk as uinteger

    if free = 0 then return
    
    if write_pos + free > BUFSIZE
        max_chunk = BUFSIZE - write_pos
    else
        max_chunk = free
    endif

    actual = fReadBytes(r, @buffer + write_pos, max_chunk)      ' read a chunk of bytes to the buffer
    write_pos = (write_pos + actual) mod BUFSIZE
    used = used + actual

end sub

function get_byte() as ubyte

    dim v as ubyte 

    if used = 0 then return $FF                                 ' if used is empty return $FF

    v = peek(@buffer + read_pos)                                ' read a byte from the buffer 

    print at 3,0;read_pos

    read_pos = (read_pos + 1) mod BUFSIZE                       
    used = used - 1

    return v                                                    ' return the byte 

end function

sub _ay(__a as ubyte,__b as ubyte) 
    out $fffd, __a 
    out $bffd, __b 
end sub 

buffer: 
asm 
     defs 256
end asm 