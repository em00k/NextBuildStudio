'!org=24576
' NextBuild Layer2 Template 

#define NEX 
#define IM2 

#include <nextlib.bas>
#include <keys.bas>

asm 
    ; setting registers in an asm block means you can use the global equs for register names 
    ; 28mhz, black transparency,sprites on over border,320x256
    nextreg TURBO_CONTROL_NR_07,%11         ; 28 mhz 
    nextreg GLOBAL_TRANSPARENCY_NR_14,$0    ; black 
    nextreg SPRITE_CONTROL_NR_15,%00000011  ; %000    S L U, %11 sprites on over border
    nextreg LAYER2_CONTROL_NR_70,%00000000  ; 5-4 %01 = 256x192

end asm 

'--------------------
' load data banks

LoadSDBank("font.nxt",0,0,0,32)
LoadSDBank("player.spr",0,0,0,34)
LoadSDBank("map1.nxt",0,0,0,36)
LoadSDBank("map1.nxm",0,0,0,38)

InitSprites2(64,0,34)


CLS256(0)


dim px      as UINTEGER 
dim py      as ubyte 
dim pdir    as ubyte 
dim timer   as ubyte 
dim pframe  as ubyte 
dim ftimer  as ubyte 

px = 100 : py = 15 

DrawLevel(0)

do 
    WaitRetrace(1)
    UpdatePlayer()
    ReadKeyboard()
loop 

sub ReadKeyboard()

    if GetKeyScanCode()=KEYP    ' right 
        px = px + 1 
        pdir = 0 
        ftimer = ftimer - 1
    elseif GetKeyScanCode()=KEYO ' left 
        px = px - 1 
        pdir = 1 
        ftimer = ftimer - 1
    elseif GetKeyScanCode()=KEYA  ' down 
        py = py + 1 
        pdir = 3 
        ftimer = ftimer - 1
    elseif GetKeyScanCode()=KEYQ  ' up
        py = py - 1 
        pdir = 2 
        ftimer = ftimer - 1
    endif 

end sub 

sub UpdatePlayer()
    
    UpdateSprite(px,py,0,pframe,(pdir band %1)<<3,0)
    
    if ftimer = 0 
        ftimer = 5
        pframe = pframe + 1 
        if pframe = 4 
            pframe = 0 
        endif 
    endif 

    if timer = 0 
        timer = 20 
        
    else 
        timer = timer - 1 
    endif 

end sub 

sub DrawLevel(level as ubyte)

    dim x, y, tile      as ubyte 

    NextReg($50,38)             ' bring in our map to $0000

    for c = 0 to 767 
        tile = peek (c)
        DoTileBank8(x,y,tile,36)
        x = x + 1 : if x = 32 : x = 0 : y = y + 1 : end if 
    next 
    NextReg($50,$ff)            ' replace ROM

    L2Text(10,0,"LEVEL "+str(level+1),32,0)

end sub 


worldmap:
    asm 

        db 0,0,0,0
        db 0,0,0,0
        db 0,0,0,0
        db 0,0,0,0

    end asm 