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
    nextreg SPRITE_CONTROL_NR_15,%00011111  ; %000    S L U, %11 sprites on over border
    nextreg LAYER2_CONTROL_NR_70,%00000000  ; 5-4 %01 = 256x192
    nextreg CLIP_LAYER2_NR_18,0
    nextreg CLIP_LAYER2_NR_18,255
    nextreg CLIP_LAYER2_NR_18,0
    nextreg CLIP_LAYER2_NR_18,255

end asm 

'--------------------
' load data banks

LoadSDBank("font.nxt",0,0,0,32)
LoadSDBank("player.spr",0,0,0,34)
LoadSDBank("map1.nxt",0,0,0,36)     ' L2 tile bitmap
LoadSDBank("map1.nxm",0,0,0,38)     ' Map for level 1 

InitSprites2(64,0,34)
asm 
di 
end asm 

CLS256(0)
L2Text(0,0,"HELLO",32,0)

dim plx      as UINTEGER 
dim ply      as ubyte 
dim pdir    as ubyte 
dim timer   as ubyte 
dim pframe  as ubyte 
dim ftimer  as ubyte 
dim worldoffset as ubyte 
dim tilehit as ubyte =0
dim oldplx as ubyte 
dim oldply as ubyte
dim attr3 as ubyte
dim pldx    as ubyte 
dim pldy    as ubyte 

const MLEFT  as ubyte = 0 
const MRIGHT as ubyte = 1 
const MUP	as ubyte = 2 
const MDOWN	as ubyte = 3 
const MSTILL	as ubyte = 4

const spleft as ubyte = %1000					' thare constants required for sprite mirror + flipping 
const spright as ubyte = %0000
const spup  as ubyte = %0000
const spdown   as ubyte = %0100

plx = 100 : ply = 115 

DrawLevel(0)

paper 0 : ink 7 : cls 

do 
    WaitRetrace2(193)
    UpdatePlayer()
    CheckCollision()


    ReadKeyboard()
loop 

sub ReadKeyboard()

    pldx = MSTILL
    pldy = MSTILL

    if MultiKeys(KEYP)    ' right 
        pldx = MRIGHT
        attr3 = spright
        ftimer = ftimer - 1
    endif 
    if MultiKeys(KEYO) ' left 
        pldx = MLEFT
        attr3 = spleft
        ftimer = ftimer - 1
    endif 
    if MultiKeys(KEYA)  ' down 
        pldy = MDOWN
        ftimer = ftimer - 1
    endif 
    if MultiKeys(KEYQ)  ' up
        pldy = MUP 
        ftimer = ftimer - 1
    endif 

end sub 

sub UpdatePlayer()

    if pldx = MSTILL
        pframe = 2
    endif 

    UpdateSprite(32+plx,36+ply,0,pframe,attr3,0)
    
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

dim x, y, tile   as ubyte 

Sub DrawLevel(level as ubyte = 0 )

    NextReg($50,38)         ' map 
    for c = 0 to 767 

        tile = peek (c)
        DoTileBank8(x,y,tile,36)
        x = x + 1 : if x = 32 : x = 0 : y = y + 1 : endif 
        
    next c 
    NextReg($50,$ff)
        
    L2Text(10,0,"LEVEL "+str(level+1),32,0)    

end sub 

worldmap:
    asm 

        db 0,0,0,0
        db 0,0,0,0
        db 0,0,0,0
        db 0,0,0,0

    end asm 

Sub CheckCollision()
	
	' a robust collision routine for our player against the tilemap
    border 0 
    NextReg($52,38)

    const blocksize as ubyte = 3            ' how many shifts 
    const scalesize as ubyte = 16           ' x1 and x2 x1 = 14 x2 = 30

	dim plxc,sp,add as uinteger
	dim plyc,tilehit,lefttile,righttile, toptile,bottile,tile as ubyte 
    dim mapbuffer as uinteger 

	mapbuffer = $4000            			' point to the map 	

	oldplx = plx                             ' store current player x and y 
	oldply = ply

	if pldx = MLEFT                         ' is player x direction LEFT?
		plx = plx - 1                       ' then plx - 1
	elseif pldx = MRIGHT                    ' is player x direction RIGHT?
		plx = plx + 1                       ' then plx + 1 
	endif 

    plxc = (plx)                            ' take a coply of plx ply 
    plyc = (ply)
    	
	lefttile = (plxc+2) >> blocksize                ' / 16 to get current map co-ords
	righttile = (plxc+scalesize) >> blocksize              ' +2 & +14 for soft edges 
	
	toptile = (plyc+2) >> blocksize
	bottile = (plyc+scalesize) >> blocksize
	
	if lefttile>32 : lefttile = 0 : endif 
	if righttile>32 : righttile = 40 : endif 
	if toptile>24 : toptile = 0 : endif 
	if bottile>24 : bottile = 24 : endif 
	
	tile = 0                                ' tile flag 

	if pldx = MLEFT                         ' were we moving left? 

		for yy= toptile to bottile
                
				tile = peek(mapbuffer+(cast(uinteger,yy)*32)+cast(uinteger,lefttile))
				if tile > 0                ' we hit a tile that wasnt 0 
					plx = oldplx             ' put plx back 
					pldx = MSTILL           ' change plx direction to STILL 
                    border 1
                    exit for 
				endif 
               
		next	
        
	elseif pldx = MRIGHT                    ' repeat for right 
			for yy= toptile to bottile
				tile = peek(mapbuffer+(cast(uinteger,yy)*32)+cast(uinteger,righttile))
				if tile > 0
					plx = oldplx
					pldx = MSTILL
					border 1
                    exit for 
				endif 
		next	
	endif 

    ' same as above but for up and down 

	if pldy = MUP
		ply = ply - 1 
	elseif pldy = MDOWN
		ply = ply + 1
	endif 

	plxc = (plx) : plyc = (ply)
	
	lefttile = (plxc+2) >> blocksize                   ' 2 & 14 for soft edge blocks 
	righttile = (plxc+scalesize) >> blocksize 
	
	toptile = (plyc+2) >> blocksize
	bottile = (plyc+scalesize) >> blocksize
	
	if lefttile>32 : lefttile = 0 : endif 
	if righttile>32 : righttile = 32 : endif 
	if toptile>32 : toptile = 0 : endif 
	if bottile>32 : bottile = 32 : endif 
	
	tile = 0 

	if pldy = MUP 
         
		add = (mapbuffer+(cast(uinteger,toptile)*32))
        
		for xx= lefttile to righttile
				tile = peek(add +cast(uinteger,xx))
				if tile > 0 or ply < 4 
						ply=oldply
						pldy = MDOWN
						jumptrigger=3
						border 2
                        exit for 
				endif 

		next	
	elseif pldy = MDOWN
		add = (mapbuffer+(cast(uinteger,bottile)*32))
		for xx= lefttile to righttile
				tile = peek(add+cast(uinteger,xx))
				if tile > 0
						ply=oldply
                        jumptrigger=0 
						'velocity=0
                        border 2
						exit for 
				endif 
				'velocity=velocity+0.04
		next	
	endif 
    
    NextReg($50,$ff)
    ' detects if we hit left right top of bottom edges to draw a new map
    ' 
    ' if plx = 255-14
    '     worldpoint=worldpoint+1 : plx = 2 : drawmap()
    ' elseif plx = 0 
    '     worldpoint=worldpoint-1 : plx = 254-14 : drawmap()
    ' elseif ply>192
    '     worldpoint=worldpoint+8 : ply = 2 : drawmap()
    ' elseif ply=0
    '     worldpoint=worldpoint-8 : ply = 191 : drawmap()
    ' endif 

	oldplx = plx : oldply = ply	

end sub 


