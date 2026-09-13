' NextBuildStudio
' 192x128 preloaded DELTA-RLE playback -- L2-DIRECT variant
' 
' Animated video (no audio) playback using DELTA-RLE from RAM.
' This uses the 'shadow write' technique for L2 which means for 
' RAM $0000-$3FFF can READ from specified banks while WRITES go
' direct to L2.
'
' This has been superceded by NMSV2 (See PanelMovies)
' em00k 06.06.2026

'!org=$8000

#define NEX
#include <nextlib.bas>
#include <print42.bas>
#include "includes/nextlib_memplay.bas"


' Font
LoadSDBank("[]font5.fnt",0,0,0,32)

' Source data starts at bank 34 (no work banks needed in this variant)
LoadSDBank("juggler.nmv",0,0,0,34)

#define put print
#define proc sub
#define endproc end sub

dim tick as ubyte
dim frame as uinteger = 0
dim movie1 as uinteger = @shot1


asm 
    di
end asm 
MainInit()
ResetPreloadedMovie(movie1)

do
    UpdateImage()
    WaitRaster(192)
loop

'----------------------------------------------------------
sub UpdateImage()

    if tick > 1
        frame = frame + 1
        if frame > 24
            frame = 0
            ResetPreloadedMovie(movie1)
        else
            DecodePreloadedFrame(32, 32, movie1)
        endif
        tick = 0
    endif

    'print at 10,0;frame;"  "

    tick = tick + 1

end sub

sub MainInit()
    InitLayer2(MODE256X192)
    ClearLayer2(0)
    ShowLayer2(1)
    NextReg(SPRITE_CONTROL_NR_15,%000_100_00)
    border 0 : paper 0 : ink 6 : cls
end sub

' Movie table (10 bytes; work_bank/work_banks unused in L2-direct variant)
shot1:
    asm
        db 0, 192, 128, 0, 0, 34, 4
        ds 3
    end asm

shot2:
    asm
        db 34, 64, 64
        ds 2
    end asm
shot3:
    asm
        db 34, 128, 128
        ds 2
    end asm
shot4:
    asm
        db 40, 128, 96
        ds 2
    end asm
