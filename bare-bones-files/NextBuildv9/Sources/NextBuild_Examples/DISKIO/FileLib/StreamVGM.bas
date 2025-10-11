'!org=24576
'!opt=4
'!exe=curl -X POST -F "data=@C:\Users\usb-d\Documents\NextBuildv9\Sources\NextBuild_Examples\DISKIO\FileLib\StreamVGM.nex" http://192.168.4.1/upload
' NextBuild Studio
' VGM streaming player - modified from PSG player

#define NEX 
#define IM2 

#include <nextlib.bas>
#include "../FileLib/FileLib-inc.bas"

LoadSDBank("[]font24.spr",0,0,0,34)

'----------------------------------------------------------
' definitions 
'

const BUFSIZE as UINTEGER = 1024

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
dim is_vgm      as ubyte = 0                      ' Flag to indicate VGM format
dim vgm_data_offset as uinteger = 0               ' VGM data start offset
dim wait_samples as uinteger = 0                  ' Samples to wait

declare function get_byte() as ubyte 
declare sub updateVGM()
declare sub updatePSG()
declare function check_vgm_header() as ubyte

'----------------------------------------------------------
' Initialisation
'

for i = 0 to 15
        regstate(i) = 0 
        laststate(i) = $FF       ' force a write of regstate(i) on first frame
next i 

do 

InitLayer2(MODE256X192)

L2Text(0,0,"stream to vgm/psg demo",34,0)

fOpenDrive()                                    ' open the default drive
'r = fOpenFile("2019_MmcM_Conversions.psg")      ' open the psg file 
'file$ = "test2.vgm"
file$ = "test.vgm"
r = fOpenFile(file$)                   ' try VGM file first

write_pos   = 0
' if r = 0 then
'     r = fOpenFile("lemotree.psg")               ' fallback to PSG
' endif

if r then
    ' Check if it's a VGM file
    is_vgm = 1 ' check_vgm_header()
    
    if is_vgm then
        L2Text(0,1,"VGM file detected",34,0)
        fSetPos(r, vgm_data_offset)             ' skip to VGM data
    else
        L2Text(0,1,"PSG file detected",34,0)
        fClose(r)                       ' skip PSG header
    endif
else
    L2Text(0,3,"unable to open file : "+file$,34,0)
endif

'----------------------------------------------------------
' Main loop 
'
    if r 
        do
            if is_vgm then
                updateVGM()                         ' Call VGM update
            else
                updatePSG()                         ' Call PSG update
            endif
            WaitRaster(192)                         ' Wait for next frame
        loop until done
        fSetPos(r,0)
    else 
        L2Text(0,2,"unable to open file", 34, 0)
    endif 

    L2Text(0,4,"unable to open file", 34, 0)
    L2Text(0,5,"press any key to restart", 34, 0)


    WaitKey()
    
loop 

'----------------------------------------------------------
'  VGM header check routine

' function check_vgm_header() as ubyte
'     dim temp_offset as uinteger
    
'     ' Read first 4 bytes to check for "Vgm " signature
'     fSetPos(r, 0)
'     if fReadBytes(r, header_buf, 4)
'         if peek(header_buf) = 86 and peek(header_buf+1) = 103 and peek(header_buf+2) = 109 and peek(header_buf+3) = 32
'             ' Read VGM data offset (at position 0x34)
'             fSetPos(r, $34)
'             if fReadBytes(r, header_buf+4, 2) = 2 then
'                 if temp_offset = 0 then
'                     vgm_data_offset = $40           ' Default for older VGM files
'                 else
'                     vgm_data_offset = $34 + temp_offset
'                 endif
'             else
'                 vgm_data_offset = $40               ' Default fallback
'             endif
'             return 1
'         endif
'     endif
'     return 0


' end function

header_buf:
asm 
    ; head_buffer:
    defs 6,0
end asm 


'----------------------------------------------------------
'  VGM update routine 

sub updateVGM()
    dim reg_num as ubyte
    dim reg_val as ubyte
    dim wait_lo as ubyte
    dim wait_hi as ubyte
    
    if done then return                         ' Exit if playback is finished
    border 2
    
    ' Handle any pending wait
    if wait_samples > 0 then
        if wait_samples >= 535 then             ' More than one frame (735 samples = 1/60 sec at 44.1kHz)
            wait_samples = wait_samples - 535
            border 1
            return                              ' Wait one more frame
        else
            wait_samples = 0                    ' Small waits, just skip
        endif
    endif
    
    ' Fill buffer if needed
    border 3
    fill_buffer()
    border 0
    ' Process VGM commands
    while used > 0 and wait_samples = 0
        cmd = get_byte()
        
        if cmd = $66 then                       ' End of sound data
            done = 1
            exit while
        elseif cmd = $A0 then                   ' AY8910 register write
            if used >= 2 then
                reg_num = get_byte()
                reg_val = get_byte()
                if reg_num <= 15 then
                    regstate(reg_num) = reg_val
                endif
            else
                exit while                      ' Not enough data
            endif
        elseif cmd = $61 then                   ' Wait n samples
            if used >= 2 then
                wait_lo = get_byte()
                wait_hi = get_byte()<<8
                wait_samples = wait_lo + (wait_hi )
            else
                exit while                      ' Not enough data
            endif
        elseif cmd = $62 then                   ' Wait 735 samples (1/60 sec)
            wait_samples = 535
        elseif cmd = $63 then                   ' Wait 882 samples (1/50 sec)  
            wait_samples = 582
        elseif (cmd >= $70) and (cmd <= $7F) then ' Wait n+1 samples
            wait_samples = (cmd - $70) + 1
        else
            ' Skip unknown commands
            ' Commands 0x30-0x4E have 1 operand
            if cmd >= $30 and cmd <= $4E then
                if used > 0 then get_byte()
            ' Commands 0x55-0x5F and 0xA0-0xBF have 2 operands  
            elseif (cmd >= $55 and cmd <= $5F) or (cmd >= $A1 and cmd <= $BF) then
                if used >= 2 then
                    get_byte()
                    get_byte()
                endif
            ' Commands 0xC0-0xDF have 3 operands
            elseif cmd >= $C0 and cmd <= $DF then
                if used >= 3 then
                    get_byte()
                    get_byte() 
                    get_byte()
                endif
            ' Commands 0xE1-0xFF have 4 operands
            elseif cmd >= $E1 and cmd <= $FF then
                if used >= 4 then
                    get_byte()
                    get_byte()
                    get_byte()
                    get_byte()
                endif
            endif
        endif
    wend
    
    ' Update all changed registers
    for i = 0 to 15
        if regstate(i) <> laststate(i)
            _ay(i, regstate(i))
            laststate(i) = regstate(i)
        endif
    next i
    
    border 0
    
    ' If we've run out of data and haven't hit end marker, we're done
    if used = 0 and done = 0 then
        done = 1
    endif
    
end sub

'----------------------------------------------------------
'  Original PSG update routine 

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

' function get_byte() as ubyte

'     dim v as ubyte 
'     border 6
'     if used = 0 then return $FF                                 ' if used is empty return $FF

'     v = peek(@buffer + read_pos)                                ' read a byte from the buffer 

'     ' print at 3,0;read_pos

'     read_pos = (read_pos + 1) mod BUFSIZE                       
'     used = used - 1
'     border 0 
'     return v                                                    ' return the byte 

' end function

function fastcall get_byte() as ubyte
    asm 
        ; Z80 optimized get_byte function
        ; Returns byte in A register (BASIC ubyte return value)
        
        ; Check if used = 0

        ld      hl,(_used)           ; Load 'used' counter
        ld      a,h                 ; Check high byte first
        or      l                   ; OR with low byte
        jr      nz,buffer_has_data  ; Jump if used > 0
        
        ; Buffer empty, return $FF
        ld      a,$FF
        ret
        
    buffer_has_data:
        ; Debug border
        ld      a,6
        out     ($FE),a             ; Set border to cyan
        
        ; Get byte from buffer[read_pos]
        ld      hl,(read_pos)       ; Load read position
        ld      bc,buffer           ; Load buffer base address
        add     hl,bc               ; HL = buffer + read_pos
        ld      a,(hl)              ; Load byte from buffer
        push    af                  ; Save the byte we're returning
        
        ; Increment read_pos (mod BUFSIZE=1024)
        ld      hl,(read_pos)       ; Load read_pos again
        inc     hl                  ; Increment
        ld      a,h                 ; Get high byte
        and     $03                 ; Mask to keep only bits 0-1 (1024 = $400, so mask with $3FF)
        ld      h,a                 ; Store back masked high byte
        ld      (read_pos),hl       ; Store new read_pos (now mod 1024)
        
        ; Decrement used
        ld      hl,(._used)           ; Load used counter
        dec     hl                  ; Decrement
        ld      (_used),hl           ; Store back
        
        ; Reset border
        xor     a                   ; A = 0
        out     ($FE),a             ; Reset border
        
        ; Return the byte
        pop     af                  ; Restore return value
        ret
read_pos:
    defs 4,0

    end asm
end function


sub _ay(__a as ubyte,__b as ubyte) 
    out $fffd, __a 
    out $bffd, __b 
end sub 

buffer: 
asm 
    buffer:
     defs 1024
end asm