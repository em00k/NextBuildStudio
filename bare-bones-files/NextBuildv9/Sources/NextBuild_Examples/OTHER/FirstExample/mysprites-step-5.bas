'!org=24576
'!heap=4096
#define NEX
#define IM2


#include <nextlib.bas>
#include <keys.bas>

asm
    nextreg GLOBAL_TRANSPARENCY_NR_14,$0 
    nextreg TURBO_CONTROL_NR_07,%11
    nextreg SPRITE_CONTROL_NR_15,%00000011
    nextreg LAYER2_CONTROL_NR_70,%00010000
    nextreg CLIP_LAYER2_NR_18,0
    nextreg CLIP_LAYER2_NR_18,158
    nextreg CLIP_LAYER2_NR_18,0
    nextreg CLIP_LAYER2_NR_18,255
end asm

' -- Load block 
LoadSDBank("vt24000.bin",0,0,0,38) 				' load the music replayer 
LoadSDBank("monty.pt3",0,0,0,39) 				' load music.pt3 into
LoadSDBank("game.afb",0,0,0,41) 				' load sfx 

LoadSDBank("mysprites.spr",0,0,0,32)                ' this is our tiles file 
LoadSDBank("tiles.nxt",0,0,0,34)                ' this is our tiles file 
' LoadSDBank("level.nxm",0,0,0,43)
LoadSDBank("font4.spr",0,0,0,36)
LoadSDBank("font5.spr",0,0,0,37)
LoadSDBank("enemies1.nxt",0,0,0,45)

InitSprites2(64,$000,32,0)                     ' 64 nr of sprites to upload 

' -- Defines 

const MLEFT         as ubyte = 0 
const MRIGHT        as ubyte = 1 
const MUP	        as ubyte = 2 
const MDOWN	        as ubyte = 3 
const MSTILL	    as ubyte = 4
const BLOCKSTART	as ubyte = 19
const JUMPMAX	    as ubyte = 32
const TILEWALL      as ubyte = 0
const spleft        as ubyte = %1000					' thare constants required for sprite mirror + flipping 
const spright       as ubyte = %0000
const spup          as ubyte = %0000
const spdown        as ubyte = %0100

dim keydown         as ubyte = 0 

Dim px,bx           as UINTEGER
dim by,py,pframe,dir,bframe,bdir,playerframe,spritecount,sfxtimer as ubyte 
Dim hitplayer,gravity,bmove as ubyte  
dim objectcount     as ubyte 
dim plld            as ubyte 
dim attr3           as ubyte
dim velocity        as fixed 
dim plvel           as fixed = 1

dim oldpx           as uinteger
dim oldpy           as ubyte 
dim pldx            as ubyte 
dim pldy            as ubyte 
dim playersprite    as ubyte 
dim touchbase       as ubyte 
dim kemp            as ubyte 
dim keypressed      as ubyte 
dim jump            as ubyte 
dim jump_pos        as ubyte 
dim pl_block        as ubyte 

dim block_c         as ubyte 

declare function CanGo(direction as ubyte, xpos as uinteger, ypos as uinteger ) as ubyte 

' -- 

InitSFX(41)							            ' init the SFX engine, sfx are in bank 36
InitMusic(38,39,0000)				            ' init the music engine 33 has the player, 34 the pt3, 0000 the offset in bank 34
SetUpIM()							            ' init the IM2 code 
EnableSFX							            ' Enables the AYFX, use DisableSFX to top
EnableMusic 						            ' Enables Music, use DisableMusic to stop 
DisableMusic



CLS320(0)

FL2Text(0,0,"OUR DEMO",36) 
FL2Text(0,1,"SCORE:",36) 
FL2Text(0,2,"WASD TO MOVE",36) 

px = 64 : hitplayer = 0 
py = 96 : gravity = 1 : bmove = 1 

'Init

DrawLevel()

do
    
    ReadKeys()
    CheckCollision()
    UpdatePlayer()
    
    UpdateBaddies()
    DoSFX()
    ' ShowDebug()
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

    pldx = MSTILL 
    pldy = MSTILL 

    kemp = in 31 
    
    keypressed = 0 
    
    if plvel>0 : plvel=plvel-0.1 : endif 

    if MultiKeys(KEYD) or kemp BAND 1 = 1
        pldx = MRIGHT : keypressed = 1 
        attr3 = spright
        plld = pldx
        
    elseif MultiKeys(KEYA) or kemp BAND 2 = 2
        pldx = MLEFT : keypressed = 1 
        attr3 = spleft
        plld = pldx
    else 
        playersprite = 0 
    endif         

	if MultiKeys(KEYW) and keydown = 0 AND jump=0
        ShowObects()
        if block_c = 0 
            if CanGo(MRIGHT,px+2,py) = 2 
                block_c = 1                         ' carrying block 
                RemoveSprite(16,0)   '               
                poke(@mapdata+(20+cast(uinteger,py>>4)*20)+cast(uinteger,px>>4)+2,$0)
            '    CLS320(0)
            '    DrawLevel()
            elseif CanGo(MLEFT,px-4,py) =2 
                block_c = 1                         ' carrying block 
                RemoveSprite(16,0)   '               
                poke(@mapdata+(20+cast(uinteger,py>>4)*20)+cast(uinteger,px>>4)-1,$0)
            '    CLS320(0)
            '    DrawLevel()
            endif 
        else 
            if CanGo(MRIGHT,px+2,py) = 0
                block_c = 0                         ' carrying block             
                poke(@mapdata+(20+cast(uinteger,py>>4)*20)+cast(uinteger,px>>4),$22)
                AddObject((px/16)<<4,(py))
            '    CLS320(0)
            '    DrawLevel()
            elseif CanGo(MLEFT,px-2,py) =0
                block_c = 0                        ' carrying block 
                AddObject((px/16)<<4,(py))
                poke(@mapdata+(20+cast(uinteger,py>>4)*20)+cast(uinteger,px>>4),$22)
            '    CLS320(0)
            '    DrawLevel()
            endif             
        endif 
        keydown = 1 
        
	elseif MultiKeys(KEYS)
		pldy = MDOWN
    elseif MultiKeys(KEYW) = 0 
        keydown = 0 
	endif      
    if MultiKeys(KEYB)
        bmove = 1 - bmove
    endif 
    if MultiKeys(KEYSPACE) and jump = 0 
        jump = 1 
        playersprite = 1
    '    Jump()
    endif 

    Jump()

    if keypressed and jump = 0 
        if  playerframe =  3
            ' timer triggered 
            playerframe = 0
            playersprite = 1 - playersprite 
        else 
            playerframe =  playerframe + 1 
        endif 
    endif 
end sub

sub ShowObects()

    dim max_obejct as ubyte 

    if block_c = 0 
        FDoTile16(16,0,2,32)
    else 
        FDoTile16(0,0,2,34)
    endif 

end sub 

sub Jump()

    dim delta        as ubyte = 0 

    if jump = 1 
        jump = 2 
        touchbase = 0 
    elseif jump = 2 
        pldy = MUP 
        if jump_pos < 12 
            delta = peek (@jump_table+cast(uinteger,jump_pos))
            py = py + delta 
            jump_pos = jump_pos + 1
        else 
            jump = 3 
            jump_pos=0
        endif 
    elseif jump = 3
        if MultiKeys(KEYSPACE)
            jump = 3
        else 
            if touchbase = 1
                jump = 0 

            endif 
        endif 
    endif 


end sub 

sub UpdatePlayer()
    ' this updates the player 

    UpdateSprite(px,py+2,63,playersprite,attr3,0) 
    
end sub 

sub UpdateBaddies()
    ' this updates the baddie 

    ' update all baddies 
    dim spraddress      as uinteger
    dim ty, ti, td      as ubyte 
    dim tx              as uinteger 
    dim x1, x2          as uinteger
    dim y1, y2          as ubyte 
    dim size            as ubyte 
    dim offset          as uinteger

    for sp = 0 to spritecount-1
        offset = sp * 6 
        spraddress = @spritetable+cast(uinteger,offset)
        tx=peek(uinteger,spraddress)
        ty=peek(spraddress+2)
        ti=peek(spraddress+3)
        td=peek(spraddress+4)

        ti = 1 - ti 
        
        if bmove = 1
            if td = 0                           ' left 
                
                tx=tx-1 : if tx>360 : td = 2 : endif 
                if CanGo(MLEFT,tx,ty)> 0
                    td = 2 
                    tx = tx +1
                endif

            elseif td = 1                       ' right 
                
                tx=tx+1 : if tx>320 : td = 3 : endif
                if CanGo(MRIGHT,tx,ty)> 0 
                    td = 3
                    tx = tx -1
                endif 

            elseif td = 2                       ' up 

                ty=ty-1 : if ty=0 : td = 3 : endif
                if CanGo(MUP,tx,ty)> 0
                    ty=ty+1
                    td = 1 
                endif

            elseif td = 3                       ' down aa

                ty=ty+1 : if ty>254 : td = 0 : endif
                if CanGo(MDOWN,tx,ty)> 0
                    ty=ty-1
                    td = 0
                endif

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
            if hitplayer=0 : hitplayer=1 : endif 
        endif 
    next 

end sub 

sub AddBaddies()
    ' spritecount 
    '  [x],y,frame,direction, 
    dim offset      as uinteger
    dim spraddress  as uinteger

    offset = spritecount * 6 
    spraddress = @spritetable+cast(uinteger,offset)

    poke Uinteger spraddress,bx 
    poke spraddress+2,by 
    poke spraddress+3,0
    poke spraddress+4,bdir

end sub



sub DrawLevel()
    dim offset  as UINTEGER 
    dim tile    as ubyte 
    for yy=3 to 15
        for xx=0 to 19
            tile = peek(@mapdata+cast(uinteger,offset)+60)
            FDoTile16(0,xx,yy,34)                                       ' blue back ground 
            if tile = $20 
                px =  cast(uinteger,xx*16) : py = cast(ubyte,yy*16)
                'FDoTile16(tile,xx,yy,34)    
                poke(@mapdata+cast(uinteger,offset)+60,0)
            elseif tile = $21
                bx = 32+(cast(uinteger,xx)*16) : by = (yy* 16) : bdir = int(rnd*3)
                AddBaddies()
                spritecount = spritecount + 1       
                'FDoTile16(tile,xx,yy,34)             
                poke(@mapdata+cast(uinteger,offset)+60,0)
            elseif tile = $22               ' block
                AddObject(cast(uinteger,xx)*16, cast(ubyte,yy*16)) 
               ' poke(@mapdata+cast(uinteger,offset)+60,0)
                
            elseif tile>1

                FDoTile16(tile,xx,yy,34)    
            endif 
            offset=offset+1
        next xx
    next yy
end sub

sub AddObject(ox as uinteger, oy as ubyte)

    dim offset      as uinteger
    dim objaddress  as uinteger

    offset = (16+objectcount) * 6 
    objaddress = @objecttable+cast(uinteger,offset)
    UpdateSprite(ox, oy+2, 16+ objectcount,16,0,0)

    poke Uinteger objaddress, ox 
    poke objaddress+2, oy 
    poke objaddress+3, offset 
    
   ' objectcount = objectcount + 1 

   ' ShowDebug(ox,oy+2)
   ' WaitKey()
end sub 

sub ShowDebug(ox as uinteger, oy as ubyte)
    s$="X : "+str(ox)+"   Y : "+str(oy)+"  "
    FL2Text(13,1,s$,37) 
end sub 

Sub CheckCollision()
	
	' a robust collision routine for our player against the tilemap

    const blocksize as ubyte = 4            ' how many shifts 
    const scalesize as ubyte = 16           ' x1 and x2 x1 = 14 x2 = 30

	dim plxc,sp,add as uinteger
	dim plyc,tilehit,lefttile,righttile, toptile,bottile,tile as ubyte 
	dim mapbuffer       as uinteger

	mapbuffer = @mapdata           			' point to the map 	
    touchbase = 0                           ' are we touching ground

	oldpx = px                              ' store current player x and y 
	oldpy = py

	if pldx = MLEFT                         ' is player x direction LEFT?
		px =( px -  2-cast(ubyte,plvel))                    ' then px - 1
        if px > 320 : px = 306: endif 
        if px > 320 : px = 16: endif 
	elseif pldx = MRIGHT                    ' is player x direction RIGHT?
        px =( px +  2+cast(ubyte,plvel))                ' then px + 1 
        if px > 320 : px = 306: endif 
	endif 
    	
	lefttile = (px) >> blocksize                ' / 16 to get current map co-ords
	righttile = (px+scalesize) >> blocksize              ' +2 & +14 for soft edges 
	
	toptile = (py) >> blocksize
	bottile = (py+scalesize) >> blocksize
	
	if lefttile>20 : lefttile = 0 : endif 
	if righttile>20 : righttile = 20 : endif 
	if toptile>16 : toptile = 0 : endif 
	if bottile>16 : bottile = 16 : endif 
	
	tile = 0                                ' tile flag 

	if pldx = MLEFT                         ' were we moving left? 
		for yy= toptile to bottile
				tile = peek(mapbuffer+(cast(uinteger,yy)*20)+cast(uinteger,lefttile))
                tile = peek(@tile_lookup+(cast(uinteger,tile)))
				if tile > TILEWALL                ' we hit a tile that wasnt 0 
					px = oldpx             ' put px back 
					pldx = MSTILL           ' change px direction to STILL 
					plvel = 0 
                    exit for 
				endif 
		next	
	elseif pldx = MRIGHT                    ' repeat for right 
			for yy= toptile to bottile
				tile = peek(mapbuffer+(cast(uinteger,yy)*20)+cast(uinteger,righttile))
                tile = peek(@tile_lookup+(cast(uinteger,tile)))
				if tile > TILEWALL
					px = oldpx
					pldx = MSTILL
					plvel = 0 
                    exit for 
				endif 
		next	
	endif 

    ' same as above but for up and down 

	if pldy = MUP
		'py = py - 1 
	else   'if pldy = MDOWN
		py = py + cast(ubyte,velocity) + 1
        
	endif 

	lefttile = (px+2) >> blocksize                   ' 2 & 14 for soft edge blocks 
	righttile = (px+scalesize) >> blocksize 
	
	toptile = (py+2) >> blocksize
	bottile = (py+scalesize) >> blocksize
	
	if lefttile>20 : lefttile = 0 : endif 
	if righttile>20 : righttile = 20 : endif 
	if toptile>16 : toptile = 0 : endif 
	if bottile>16 : bottile = 16 : endif 
	
	tile = 0 

	if pldy = MUP 
		add = (mapbuffer+(cast(uinteger,toptile)*20))
        
		for xx= lefttile to righttile
				tile = peek(add +cast(uinteger,xx))
                tile = peek(@tile_lookup+(cast(uinteger,tile)))
				if tile > TILEWALL or py < 4 
						py=oldpy
						pldy = MDOWN
'						jumptrigger=3
						PlaySFX(5)
                        exit for 
				endif 
		next	
	else  ' if pldy = MDOWN
		add = (mapbuffer+(cast(uinteger,bottile)*20))
		for xx= lefttile to righttile
				tile = peek(add+cast(uinteger,xx))
                tile = peek(@tile_lookup+(cast(uinteger,tile)))
				if tile > TILEWALL						
                        py = oldpy
                        touchbase = 1 
						velocity=0
						plvel=0
						exit for 
                else 
                    if velocity < 3 : velocity = velocity + 1 : endif 
				endif 
		next	
	endif 

	oldpx = px : oldpy = py	
    border 4
    if plvel > 0 : plvel = plvel - 1 : endif 

    if CanGo(MDOWN,px,py)=2 
        py = py - 1
    endif 
    if CanGo(MLEFT,px,py)=2 
        px = px - 1
    endif
    if CanGo(MRIGHT,px,py)=2 
        px = px + 1
    endif
    border 0
end sub 

function CanGo(direction as ubyte, xpos as uinteger, ypos as uinteger ) as ubyte 
	
    ' DIR = 0 1 2 3 
    ' 0 RIGHT
    ' 1 LEFT
    ' 2 UP
    ' 3 DOWN 

	' a robust collision routine for our player against the tilemap

    const blocksize as ubyte = 4            ' how many shifts 2 4 8 16 32 
    const scalesize as ubyte = 16           ' x1 and x2 x1 = 14 x2 = 30

	dim plxc,sp,add as uinteger
	dim plyc,tilehit,lefttile,righttile, toptile,bottile,tile as ubyte 
	dim mapbuffer   as uinteger
    dim offset      as uinteger

	mapbuffer = @mapdata           			' point to the map 	

    if direction = 0 or direction =1

'        oldpx = xpos                              ' store current player x and y 
'        oldpy = ypos

        lefttile    = (xpos+2)          >> blocksize                ' / 16 to get current map co-ords
        righttile   = (xpos+scalesize)  >> blocksize              ' +2 & +14 for soft edges 
        
        toptile = (ypos+2)              >> blocksize
        bottile = (ypos+scalesize)      >> blocksize
        
        if lefttile>20  : lefttile = 0      : endif 
        if righttile>20 : righttile = 20    : endif 
        if toptile>16   : toptile = 0       : endif 
        if bottile>16   : bottile = 16      : endif 
        
        tile = 0                                        ' tile if we collide 

        if direction = MLEFT                            ' we want to check left
            add = mapbuffer+(cast(uinteger,toptile)*20)+cast(uinteger,lefttile)
            offset = 0 
            for yy= toptile to bottile
                    tile = peek(add+offset)
                    tile = peek(@tile_lookup+(cast(uinteger,tile)))
                    if tile > TILEWALL                  ' we hit a tile that wasnt 0 
                        exit for 
                    endif 
                    offset = offset + 20 
            next	
        elseif direction = MRIGHT                       ' repeat for right 
            add = mapbuffer+(cast(uinteger,toptile)*20)+cast(uinteger,righttile)
            offset = 0 
                for yy= toptile to bottile
                    tile = peek(add+offset)
                    tile = peek(@tile_lookup+(cast(uinteger,tile)))
                    if tile > TILEWALL
                        exit for 
                    endif 
                    offset = offset + 20 
            next	
        endif 
    endif 
    ' same as above but for up and down 

    if  direction = 2 or direction = 3

            lefttile    = (xpos)            >> blocksize                   ' 2 & 14 for soft edge blocks 
            righttile   = (xpos+scalesize)  >> blocksize 
            
            toptile     = (ypos)            >> blocksize
            bottile     = (ypos+scalesize)  >> blocksize
            
            if lefttile>20  : lefttile = 0      : endif 
            if righttile>20 : righttile = 20    : endif 
            if toptile>16   : toptile = 0       : endif 
            if bottile>16   : bottile = 16      : endif 
            
            tile = 0 

            if direction = MUP 
                add = (mapbuffer+(cast(uinteger,toptile)*20))
                for xx= lefttile to righttile
                        tile = peek(add +cast(uinteger,xx))
                        tile = peek(@tile_lookup+(cast(uinteger,tile)))
                        if tile > TILEWALL 
                                exit for 
                        endif 
                next	
            else  ' if pldy = MDOWN
                add = (mapbuffer+(cast(uinteger,bottile)*20))
                for xx= lefttile to righttile
                        tile = peek(add+cast(uinteger,xx))
                        tile = peek(@tile_lookup+(cast(uinteger,tile)))
                        if tile > TILEWALL
                                exit for 
                        endif 

                next	
            endif 
    endif 
    
    return tile 

end function 

spritetable:
asm
spritetable: 
    ;  [x],y,frame,direction,
    defs 6*6,0
end asm


objecttable:
asm
objecttable: 
    ;  [x],y,frame,direction,
    defs 6*6,0
end asm

mapdata:
asm
; C:\NextBuildv7\Sources\FirstExample\assets\tiles.nxm (27/02/2024 05:11:34)
    incbin "tiles.nxm"

end asm

jump_table:
asm 
    db -7, -6, -6, -5, -5, -4, -3, -2, -1, -0, 0, 0, 0, 0, 0, 0 
end asm 

tile_lookup
asm 
    db      0 ;0
    db      0 ;1
    db      0 ;2
    db      0 ;3
    db      0 ;4
    db      0 ;5
    db      0 ;6
    db      0 ;7
    db      0 ;8
    db      0 ;9
    db      0 ;10
    db      0 ;11
    db      0 ;12
    db      0 ;13
    db      0 ;14
    db      0 ;15
    db      0 ;16
    db      0 ;17
    db      0 ;18
    db      1 ;19
    db      1 ;20
    db      1 ;21
    db      0 ;22
    db      0 ;23
    db      0 ;24
    db      0 ;25
    db      0 ;26
    db      0 ;27
    db      0 ;28
    db      1 ;29
    db      1 ;30
    db      0 ;31
    db      0 ;32
    db      0 ;33
    db      2 ;34
    db      0 ;35
    db      0 ;36
    db      0 ;37
    db      0 ;38
    db      0 ;39
    db      0 ;40
    db      0 ;41
    db      0 ;42
    db      0 ;43
    db      0 ;44
    db      0 ;45
    db      0 ;46
    db      0 ;47
    db      0 ;48
    db      0 ;49
    db      0 ;50
    db      0 ;51
    db      0 ;52
    db      0 ;53
    db      0 ;54
    db      0 ;55
    db      0 ;56
    db      0 ;57
    db      0 ;58
    db      0 ;59
    db      0 ;60
    db      0 ;61
    db      0 ;62
    db      0 ;63
    db      0 ;64
end asm 

' Sprite info 
' Player 00 - 7
' Baddie 8 - 15  