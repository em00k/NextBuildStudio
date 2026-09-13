' NextBuildStudio
' Stream a DELTA-RLE encoded image stream to Layer 2 -- V2 header only,
' L2-DIRECT variant
'
' Reads NMS2 frames from SD card into a small run of stream banks, then
' decodes each frame directly to Layer 2 via the shadow-write trick.
' No RAM work buffer, no separate blit phase. See nextlib_movie_v2.bas
' for the API contract.
'
' Slot usage:
'   * Slots 0/1: transiently displaced during decode (source paged in,
'     replacing ROM; ROM restored before StreamFrameV2 returns).
'   * Slots 6/7: transiently used inside StreamFrameV2 for the disk
'     read only. Free at all other times, so user code/data at
'     $C000-$FFFF is only disturbed for the ~microseconds of fReadBytes.
'
' em00k 06.06.2026

'!org=$8000
'!exe=s2f {file} test.nex
#define NEX
#include <nextlib.bas>
#pragma codebank = 1
#include <FileLib-inc.bas>
#pragma codebank = 0
#include "nextlib_movie_v2.bas"

dim tick          as ubyte
dim frame         as uinteger = 0
dim stream_handle as ubyte    = 0
dim max_tick      as ubyte    = 1

MainInit()

fOpenDrive()
'stream_handle = fOpenFile("v2-test.nms")

print "Pick a video : 1-BA 2-Aworld"

do
    k = inkey$

    if k = "1" then
        stream_handle = fOpenFile("ba-192x128.nms")
        max_tick = 1
        exit do
    endif

    if k = "2" then
        stream_handle = fOpenFile("aworld-2.nms")
        max_tick = 9
        exit do
    endif

    WaitRaster(192)
loop

if stream_handle = 0 then
    print at 0,0;"could not open movie file"
    do
        WaitRaster(192)
    loop
endif

' Stream banks: 4 contiguous banks starting at 34 (32 KB) is plenty
' for any single raw-chunked 192x128 keyframe.
if InitStreamMovieV2(stream_handle, 34) = 0 then
    print at 0,0;"not a v2 .nms file"
    do
        WaitRaster(192)
    loop
endif

print ink 4;"Streaming .nms example"

do
    UpdateImage()
    WaitRaster(192)
loop

'----------------------------------------------------------
sub UpdateImage()
    if tick > max_tick
        frame = frame + 1
        if frame > movie_frames then
            frame = 0
            RewindStreamV2()
        else
            StreamFrameV2(32, 32)
            if StreamMovieEnded() = 1 then
                frame = 0
                RewindStreamV2()
            endif
        endif
        tick = 0
    endif
    tick = tick + 1
end sub

sub MainInit()
    InitLayer2(MODE256X192)
    ClearLayer2(0)
    ShowLayer2(1)
    NextReg(SPRITE_CONTROL_NR_15,%000_100_00)
    'border 0 : paper 0 : ink 6 : cls
end sub
