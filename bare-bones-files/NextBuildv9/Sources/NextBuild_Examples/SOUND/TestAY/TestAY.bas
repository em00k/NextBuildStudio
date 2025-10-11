 '!org=24576
' NextBuild Layer2 Template 

#define NEX 
#define IM2 

#include <nextlib.bas>

asm 
    ; setting registers in an asm block means you can use the global equs for register names 
    ; 28mhz, black transparency,sprites on over border,256x192/320x256
    nextreg TURBO_CONTROL_NR_07,%11         ; 28 mhz 
    nextreg GLOBAL_TRANSPARENCY_NR_14,$0    ; black 
    nextreg SPRITE_CONTROL_NR_15,%00000011  ; %000    S L U, %11 sprites on over border
    nextreg LAYER2_CONTROL_NR_70,%00000000  ; 5-4 %00 = 256x192x8bpp, 5-4 %01 320x256x8bpp
end asm 

dim _period as UINTEGER

_plinktone(100, 32)
_plinktone(120, 62)
_plinktone(130, 92)
_plinktone(140, 102)
for x = 0 to 100
    _plinktone(x,4)
next 

do 
    PRINT "Setting tone"
    ' set trianlge
    _ay(14, %00000001)
    ' set tone 
    _ay(0, 34)
    _ay(1, 34)
    ' set volume 
    _ay(8, 15)
    _ay(11, 15)
    ' set mixer 
    _ay(7, %00111110) ' enable channel 0 no noise 
    ' 
    WaitKey()
    Print "RESET tone."
    '
    ' _ay(8, %10000)
    ' _ay(11, 14)
    ' _ay(12, 0)
    ' _ay(13, %1010)
 
    '
    WaitKey()
    _ay(7, %00110110) ' enable channel 0 no noise 
    for x = 1 to 100 
        _ay(6, 100-x)
        _ay(0, x)
        _ay(1, x/50 )
        WaitRaster(100)
    next x 
loop 

sub _ay(__a as ubyte,__b as ubyte)
    out $fffd, __a 
    out $bffd, __b 
end sub 

sub _plinktone(_period as UINTEGER, _len as ubyte)
    ' enable chan A only, no noise
    _ay(7, %00111110)
    ' split the 12-bit period:
    Dim hi as Byte = cast(ubyte,(_period & $ff))
    Dim lo as Byte = cast(ubyte,((_period >> 8) & $ff))
    _ay(0, lo)
    _ay(1, hi)
     Dim vol As Byte
    for s = 0 to _len 
        vol = cast(ubyte,(cast(UINTEGER,(s * 15)) / _len))
        _ay(8, 15-vol) 
        WaitRaster(1)
    next s 
    _ay(8, 0)
end sub