'!org=24576
'!opt=4
' NextBuild Studio
' An impractical example of streaming....

#define NEX 
#define IM2 

#include <nextlib.bas>
#include "../FileLib/FileLib-inc.bas"

LoadSDBank("[]font24.spr",0,0,0,34)


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
dim frame_ready as ubyte = 0                      ' Flag to indicate frame is ready to play

declare function get_byte() as ubyte 
declare sub updatePSG()

'----------------------------------------------------------
' Initialisation
'

for i = 0 to 15
        regstate(i) = 0 
        laststate(i) = $FF       ' force a write of regstate(i) on first frame
next i 
InitLayer2(MODE256X192)

L2Text(0,0,"stream to psg demo",34,0)

fOpenDrive()                                    ' open the default drive
'r = fOpenFile("2019_MmcM_Conversions.psg")      ' open the psg file 
r = fOpenFile("lemotree.psg")      ' open the psg file 
fSetPos(r, 16)                                  ' skip header

'----------------------------------------------------------
' Main loop 
'
if r 
    do
        updatePSG()                             ' Call once per frame
        WaitRaster(192)                         ' Wait for next frame
    loop until done
    fClose(r)
else 
    print "unable to open psg"
endif 

print "end of demo" 

do 
    WaitRaster(192) ' Wait for rasterline 
loop 

'----------------------------------------------------------
'  routines 

sub updatePSG()
    ' Process PSG data for one frame
    
    if done then return                         ' Exit if playback is finished
    border 2
    ' Fill buffer if needed
    fill_buffer()
    
    ' Process commands until we hit a frame marker ($FF) or run out of data
    while used > 0 and frame_ready = 0
        cmd = get_byte()            
        
        if cmd = $FD then
            done = 1
            exit while
        elseif cmd = $FE then
            done = 1
            exit while
        elseif cmd = $FF then
            ' Frame marker - update all changed registers and exit
            for i = 0 to 15
                if regstate(i) <> laststate(i)
                    _ay(i, regstate(i))
                    laststate(i) = regstate(i)
                endif
            next i
            frame_ready = 1                     ' Mark frame as ready
            exit while
        else
            vala = get_byte()
            if (cmd band $F) = 11 or (cmd band $F) = 12 then
                vala = vala << 1        ' Double the period to lower envelope by one octave                        
            endif
            regstate(cmd band $F) = vala
        endif
    wend
    border 0
    ' Reset frame ready flag for next call
    frame_ready = 0
    
    ' If we've run out of data and haven't hit a frame marker, we're done
    if used = 0 and frame_ready = 0 then
        done = 1
    endif
    
end sub

print 

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

    read_pos = (read_pos + 1) mod BUFSIZE                       
    used = used - 1

    return v                                                    ' return the byte 

end function

print get_byte()

sub _ay(__a as ubyte,__b as ubyte) 
    out $fffd, __a 
    out $bffd, __b 
end sub 

buffer: 
asm 
     defs 256
end asm