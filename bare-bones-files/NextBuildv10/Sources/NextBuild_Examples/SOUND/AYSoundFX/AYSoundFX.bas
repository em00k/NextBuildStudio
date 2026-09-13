' Project: AYSoundFX
'
' The whole point of nextlib_ay.bas in one screen: three calls give you
' sound effects in a game.
'
'   AYInit()                once, at startup
'   AYPlaySFX(SFX_LASER)    whenever something happens
'   AYUpdate()              once per frame, forever
'
' AYUpdate() steps the running effect by one frame and returns straight away
' if nothing is playing, so it never blocks and never costs you a frame.
'
' Press 1-7. TestAY is the other end of the scale - every register, all three
' TurboSound chips - if you want to see what is going on underneath.

'!org=24576

#define NEX
#define IM2

#include <nextlib.bas>
#include <nextlib_ay.bas>
#include <keys.bas>

dim sfx as ubyte
dim held as ubyte

AYInit()                                ' <-- 1. set the chip up

border 0 : paper 0 : ink 7 : cls
print at 1, 5; ink 5; "AY SOUND EFFECTS"
print at 3, 1; ink 7; "1 LASER"
print at 4, 1; "2 EXPLOSION"
print at 5, 1; "3 COIN"
print at 6, 1; "4 JUMP"
print at 7, 1; "5 ZAP"
print at 8, 1; "6 HURT"
print at 9, 1; "7 POWERUP"
print at 12, 1; ink 6; "AYPlaySFX(SFX_LASER)"
print at 13, 1; ink 6; "AYUpdate() every frame"

do
    sfx = 255                           ' 255 = no key down this frame

    if MultiKeys(KEY1) <> 0
        sfx = SFX_LASER
    elseif MultiKeys(KEY2) <> 0
        sfx = SFX_EXPLOSION
    elseif MultiKeys(KEY3) <> 0
        sfx = SFX_COIN
    elseif MultiKeys(KEY4) <> 0
        sfx = SFX_JUMP
    elseif MultiKeys(KEY5) <> 0
        sfx = SFX_ZAP
    elseif MultiKeys(KEY6) <> 0
        sfx = SFX_HURT
    elseif MultiKeys(KEY7) <> 0
        sfx = SFX_POWERUP
    end if

    if sfx = 255                        ' edge detect, so holding a key does
        held = 0                        ' not restart the effect every frame
    else
        if held = 0
            held = 1
            AYPlaySFX(sfx)              ' <-- 2. fire and forget
            print at 15, 1; ink 4; "PLAYING SFX "; sfx; "  "
        end if
    end if

    AYUpdate()                          ' <-- 3. once per frame

    WaitRaster(192)
loop
