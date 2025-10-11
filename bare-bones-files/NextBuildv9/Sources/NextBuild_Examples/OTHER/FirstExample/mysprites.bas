'!org=24576

#define NEX
#define IM2


#include <nextlib.bas>
#include <keys.bas>
#include <nextlib_ints_ctc2.bas>

asm
    nextreg GLOBAL_TRANSPARENCY_NR_14,$0 
    nextreg TURBO_CONTROL_NR_07,%11
    nextreg SPRITE_CONTROL_NR_15,%00000011
    nextreg LAYER2_CONTROL_NR_70,%00010000
end asm

' -- Load block 
LoadSDBank("vt24000.bin",0,0,0,38) 				' load the music replayer 
LoadSDBank("monty.pt3",0,0,0,39) 				' load music.pt3 into
LoadSDBank("game.afb",0,0,0,41) 				' load sfx 

LoadSDBank("mysprites.spr",0,0,0,34)
LoadSDBank("font4.spr",0,0,0,36)
LoadSDBank("font5.spr",0,0,0,37)
asm
    nextreg MMU6_C000_NR_56,34
    nextreg MMU7_E000_NR_57,35      ; should be +1 
end asm
InitSprites(63,$c000)       ' 63 nr of sprites to upload 
asm
    nextreg MMU6_C000_NR_56,0
    nextreg MMU7_E000_NR_57,1
end asm
' -- 



InitSFX(41)							            ' init the SFX engine, sfx are in bank 36
InitMusic(38,39,0000)				            ' init the music engine 33 has the player, 34 the pt3, 0000 the offset in bank 34
SetUpIM()							            ' init the IM2 code 
EnableSFX							            ' Enables the AYFX, use DisableSFX to top
EnableMusic 						            ' Enables Music, use DisableMusic to stop 


Dim px,bx as UINTEGER
dim by,py,pframe,dir,bframe,bdir,playerframe,spritecount,sfxtimer as ubyte 
Dim hitplayer,gravity,velocity,bmove as ubyte  

CLS320(0)

FL2Text(0,0,"OUR DEMO",36) 
FL2Text(0,1,"SCORE:",36) 
FL2Text(0,2,"WASD TO MOVE",36) 

bx = 40 : hitplayer = 0 
by = 40 : gravity = 1 : bmove = 1 

'Init

DrawLevel()

do
    ReadKeys()
    UpdatePlayer()
    UpdateBaddies()
    DoSFX()
    ShowDebug()
    WaitRetrace2(1)  
loop  

sub DoSFX()

    if hitplayer=1 
        PlaySFX(0)
        hitplayer=2
        sfxtimer=25
    endif 
    if  sfxtimer =  0
        ' timer triggered 
        hitplayer = 0 
    else 
         sfxtimer =  sfxtimer - 1 
    endif 
    

end sub

sub ReadKeys()

    if MultiKeys(KEYA)
        px=px-1 
    elseif MultiKeys(KEYD)  
        px=px+1
    endif         
    if MultiKeys(KEYW)
        py=py-1 
    elseif MultiKeys(KEYS)
        py=py+1
    endif         
    if MultiKeys(KEYB)
        bmove = 1 - bmove
    endif 


end sub

sub UpdatePlayer()
    ' this updates the player 
    if gravity=1 
     '   py = py + 1
    endif

    UpdateSprite(px,py,0,pframe,0,0) 
    
    if  playerframe =  2
        ' timer triggered 
         playerframe = 0
         pframe=1 - pframe
    else 
         playerframe =  playerframe + 1 
    endif 
    
end sub 

sub UpdateBaddies()
    ' this updates the baddie 

    ' update all baddies 
 
 
    for sp = 0 to spritecount-1
        spraddress = @spritetable+cast(uinteger,sp)*6
        tx=peek(uinteger,spraddress)
        ty=peek(spraddress+2)
        ti=peek(spraddress+3)
        td=peek(spraddress+4)

        ti = 1 - ti 
        if bmove = 1
        if td = 0 
            ' left 
            tx=tx-1 : if tx>360 : td = 1 : endif 
        elseif td = 1 
            ' right 
            tx=tx+1 : if tx>320 : td = 0 : endif
        elseif td = 2
            ' up 
            ty=ty-1 : if tx=0 : td = 3 : endif
        elseif td = 3 
            ' down 
            ty=ty+1 : if ty>254 : td = 2 : endif
        endif
        endif 
        poke Uinteger spraddress,tx 
        poke spraddress+2,ty 
        poke spraddress+3,ti
        poke spraddress+4,td 

        UpdateSprite(tx,ty,1+cast(ubyte,sp),ti+8,0,0)
        
        ' px/py player position, tx/ty position of current sprite 
        x1=px : x2 = tx : y1 = py : y2 = ty 
        size = 14   ' size of area to check from point x\y 
        if (x1+size<x2+2) BOR (x1+2>=x2+size) BOR (y1+size<y2+2) BOR (y1+2>=y2+size+2)=00
            border 2
            if hitplayer=0 : hitplayer=1 : endif 
        else    
            border 0 
        endif 
    next 

end sub 

sub AddBaddies()
    ' spritecount 
    '  [x],y,frame,direction, 

    offset = spritecount * 6 
    spraddress = @spritetable+cast(uinteger,offset)

    poke Uinteger spraddress,bx 
    poke spraddress+2,by 
    poke spraddress+3,0
    poke spraddress+4,bdir

end sub

sub DrawLevel()
    dim offset as UINTEGER 
    for yy=0 to 15
        for xx=0 to 19
            tile = peek(@mapdata+cast(uinteger,offset))
            if tile = $e 
                px =  cast(uinteger,xx*16) : py = cast(ubyte,yy*16)
            elseif tile = $f
                bx = xx*16 : by = yy * 16 : bdir = int(rnd*3)
                AddBaddies()
                spritecount = spritecount + 1                
            elseif tile>1
                FDoTile16(tile,xx,yy,34)    
            endif 
            offset=offset+1
        next xx
    next yy
end sub

sub ShowDebug()
    s$="X : "+str(px)+"   Y : "+str(py)+"  "
    FL2Text(13,1,s$,37) 
end sub 


spritetable:
asm
spritetable: 
    ;  [x],y,frame,direction,
    defs 6*6,0
end asm


mapdata:
asm
    ; 01 = empty, f = enemy, 1 = wall, e player 
    db 01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01
    db 01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01
    db 01,01,01,$e,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01
    db 01,01,01,01,01,01,01,01,01,01,$f,01,01,01,01,01,01,01,01,01
    db 01,01,16,16,16,16,16,16,16,01,01,01,$F,01,01,01,01,01,01,01
    db 01,01,16,01,01,01,01,01,01,01,01,01,01,01,01,$F,01,01,01,01
    db 01,01,16,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01
    db 01,01,16,01,01,01,01,01,01,$F,01,01,01,01,01,01,01,01,01,01
    db 01,01,16,01,01,01,01,01,01,01,01,01,$F,01,01,01,$F,01,01,01
    db 01,01,16,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01
    db 01,01,16,16,16,16,16,16,01,01,01,01,01,01,01,01,01,01,01,01
    db 01,01,01,01,01,$f,01,01,01,01,01,01,01,01,01,01,01,01,01,01
    db 01,01,01,01,01,01,01,01,01,01,$F,01,01,01,01,01,01,01,01,01
    db 01,01,01,$F,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01
    db 01,01,01,01,01,01,01,01,01,01,01,01,$f,$F,$F,01,01,01,01,01
    db 01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01,01
end asm

' Sprite info 
' Player 01 - 7
' Baddie 8 - 15  