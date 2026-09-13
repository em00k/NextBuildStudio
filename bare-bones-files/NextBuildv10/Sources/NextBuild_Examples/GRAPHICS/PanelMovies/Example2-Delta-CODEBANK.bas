' NextBuildStudio
' 192x128 preloaded DELTA-RLE playback -- V2 header, CODEBANK build
'
' Same as BallKicker-192x128-Delta.bas but with the v2 movie player's
' function bodies (memplay decoder, v2 wrappers, FileLib is left
' resident) placed in code bank 1 instead of the resident $8000-$FFFF
' window. Saves roughly 5 KB of resident code.
'
' Include pattern:
'   1. Include nextlib_movie_v2.bas normally so its declares + public
'      globals (movie_frames, movie_width, ...) land in resident memory
'      where the main loop can read them.
'   2. Define _V2_IMPL_EXTERNAL BEFORE that include so the header knows
'      not to also pull the impl in itself.
'   3. Include nextlib_movie_v2_impl.bas inside a #pragma codebank
'      block -- that's where the function bodies (and the memplay
'      decoder they call) end up.
'
' Physical page for CODEBANK 1 defaults to page 30. The movie lives at
' bank 38 and up, and the font at bank 32, so page 30 doesn't collide.
'
' em00k 06.06.2026

'!org=$8000
'!codebank=30

#define NEX
#include <nextlib.bas>

' Resident API: declares + public globals only.
#define _V2_IMPL_EXTERNAL
#include "nextlib_movie_v2.bas"

' Banked impl: memplay decoder + v2 wrappers land in code bank 1.
#pragma codebank = 1
#include "nextlib_movie_v2_impl.bas"
#pragma codebank = 0

' Font in bank 32; movie starts at bank 38 and extends contiguously.
LoadSDBank("[]font5.fnt", 0, 0, 0, 32)
LoadSDBank("NextBuild.nmv", 0, 0, 0, 38)
LoadSDBank("NextBuild-2.nmv", 0, 0, 0, 46)

dim tick  as ubyte
dim frame as uinteger = 0
dim video as ubyte
MainInit()

if InitPreloadedMovieV2(38) = 0 then
    print at 0,0;"not a v2 .nmv file"
    do
        WaitRaster(192)
    loop
endif

print ink 5;"Banked playback CODEBANK"
print ink 4;"NextBuild.nmv 44KB"
print ink 4;"NextBuild-2.nmv 36KB"

do
    UpdateImage()
    WaitRaster(192)
loop

'----------------------------------------------------------
sub UpdateImage()
    if tick > 0
        frame = frame + 1
        if frame > movie_frames then
            frame = 0
            RewindV2()
            if video = 0 
                InitPreloadedMovieV2(46)
                video = 1 
            else 
                InitPreloadedMovieV2(38)
                video = 0 
            endif 
        else
            PlayFrameV2(32, 32)
        endif
        tick = 0
    endif

    print at 10,0;frame;"  "

    tick = tick + 1
end sub

sub MainInit()
    InitLayer2(MODE256X192)
    ClearLayer2(0)
    ShowLayer2(1)
    NextReg(SPRITE_CONTROL_NR_15,%000_100_00)
    'border 0 : paper 0 : ink 6 : cls
end sub
