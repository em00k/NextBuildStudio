'!ORG=24576
'!HEAP=512
'!exe=s2f /home/usb/Documents/NextBuildv9/Sources/NextBuild_Examples/GRAPHICS/L2TopDownExample/world_scroll_actors.nex
' over top game engine for NextBuild by em00k 
' Uses banked tiles, ayfx music interrupts
' v1 

const spleft as ubyte = %1010					' thare constants required for sprite mirror + flipping 
const spright as ubyte = %0010
const spup  as ubyte = %0000
const spdown   as ubyte = %0100

#define NEX										' we want to disable all LOADSD commands and include all data files in our NEX
#define IM2										' we're using out own IM routine for AY FX + MUSIC 
#include <nextlib.bas>							' inlcude the nextlibs 
#include <keys.bas>
#include <nextlib_ints.bas>                     ' for using interrupts 

PAPER 0 : BORDER 0 : ink 7 : CLS 				' paint it all black

asm 
	nextreg LAYER2_CONTROL_NR_70,%00010000			; 320x256, 256 colour mode
	nextreg SPRITE_CONTROL_NR_15,%00001001		; Sprites on, bits 4-2  %100 ULA on top of Sprites on top of Layer2
	nextreg GLOBAL_TRANSPARENCY_NR_14,0			; set global transparency to black 
	nextreg TURBO_CONTROL_NR_07,3				; turbo mode 28mhz 
	nextreg PERIPHERAL_3_NR_08,254				; disable contention 
	di 
end asm 


' -- Load block is where we load all out data files 
LoadSDBank("level1.nxm",0,0,0,31)				' map bank 31
LoadSDBank("level1.nxt",0,0,0,32)				' sprites bank 32
LoadSDBank("player.spr",0,0,0,34)				' sprites bank 32
LoadSDBank("[]soundfx.afb",0,0,0,36) 				' load game.afb into bank 36
LoadSDBank("[]vt24000.bin",0,0,0,38) 				' load the music replayer into bank 38
LoadSDBank("[]music3.pt3",0,0,0,39) 				' load music.pt3 into bank 39
LoadSDBank("[]font11.fnt",0,0,0,40)			    ' load font into bank 40
LoadSDBank("xeno.spr",0,0,0,41)
' -- 

InitLayer2(MODE320X256)
'asm : nextreg $50,34 : nextreg $51,35 : end asm 		
InitSprites2(16,0,34)									' init all sprites 
InitSprites2(16, 0, 41, 16)								' load in xenomorph sprites slot 16+
'asm : nextreg $50,$ff : nextreg $51,$ff : end asm   	' pop back default banks 

InitSFX(36)							            ' init the SFX engine, sfx are in bank 36
InitMusic(38,39,0000)				            ' init the music engine 38 has the player, 39 the pt3, 0000 the offset in bank 34
'SetUpIM()							            ' init the IM2 code 

' DEFINE variables
dim test as ubyte
dim plx as uinteger
dim ply as ubyte
dim pldx as uinteger
dim pldy as ubyte
dim plch as ubyte
dim playerframe as ubyte
dim playerattrib3 as ubyte = 2
dim oldpx as uinteger
dim oldpy as ubyte
dim attr3 as ubyte
Dim firepressed as ubyte
Dim firetimer as ubyte
dim playerframetimer as ubyte
dim playerframbase  as ubyte
dim mapaddr as uinteger
'dim keypressed as ubyte

' scroll variables
dim scrollX as uinteger = 0		' pixel scroll position X (0-192)
dim scrollY as uinteger = 0		' pixel scroll position Y (0-128)
dim tileX as ubyte = 0				' scrollX >> 4, map column at left edge
dim tileY as ubyte = 0				' scrollY >> 4, map row at top edge
dim prevTileX as ubyte = 0
dim prevTileY as ubyte = 0
dim bufStartX as ubyte = 0			' buffer column origin (0-19), tracks wrap
dim bufStartY as ubyte = 0			' buffer row origin (0-15), tracks wrap
dim scrollspeed as ubyte = 1		' pixels per frame scroll speed

const MAPW as ubyte = 32			' map width in tiles
const MAPH as ubyte = 24			' map height in tiles
const SCREENW as ubyte = 20		' visible tiles across (320/16)
const SCREENH as ubyte = 16		' visible tiles down (256/16)

const MLEFT  as ubyte = 0 
const MRIGHT as ubyte = 1 
const MUP	as ubyte = 2 
const MDOWN	as ubyte = 3 
const MSTILL	as ubyte = 4

declare function IsBlock(wx as uinteger, wy as uinteger) as byte 
declare function rand() as ubyte  

'----------------------------------------------------------
' //MARK: Main
'----------------------------------------------------------

' intro()											' show intro screen 

plx = 96 : ply = 96 : playerattrib3 = 0			' set some variables
playerframbase = 0
scrollX = 0 : scrollY = 0
tileX = 0 : tileY = 0
prevTileX = 0 : prevTileY = 0
bufStartX = 0 : bufStartY = 0

NextReg(LAYER2_XOFFSET_NR_16,0)
NextReg(LAYER2_XOFFSET_MSB_NR_71,0)
NextReg(LAYER2_YOFFSET_NR_17,0)
asm
nextreg SPRITE_CONTROL_NR_15,%00100011
end asm

drawmap()										' draw initial map

' main game loop

AddActor(48, 48)									' test actor in world coords
AddActor(160, 80)

do
    WaitRaster(242)
    ReadKeys()
	CheckCollision()
	ScrollMap()
    UpdatePlayer()
	UpdateActors()
loop


'----------------------------------------------------------
' //MARK: Actors 
'

' each actor has 32 bytes
dim Actors(32*32) as ubyte ' 32 actors with 32 bytes each

' actor byte offsets
const ACT_ENABLE	as uinteger = 0
const ACT_SPRITE	as uinteger = 1		' hardware sprite slot
const ACT_STATE		as uinteger = 2
const ACT_XLO		as uinteger = 3		' world X low byte
const ACT_XHI		as uinteger = 4		' world X high byte
const ACT_YLO		as uinteger = 5		' world Y low byte
const ACT_YHI		as uinteger = 6		' world Y high byte
const ACT_XSPEED	as uinteger = 7		' signed speed
const ACT_YSPEED	as uinteger = 8
const ACT_DIR		as uinteger = 9		' 0=left,1=right,2=up,3=down
const ACT_DIRTIMER	as uinteger = 10	' frames until direction change
const ACT_TYPE		as uinteger = 11
const ACT_STARTFR	as uinteger = 12	' first frame in sprite sheet
const ACT_FRAME	as uinteger = 13	' current frame
const ACT_FRTIMER	as uinteger = 14	' frame anim counter
const ACT_FRMAX	as uinteger = 15	' frame anim speed
const ACT_HEALTH	as uinteger = 16
const ACT_DAMAGE	as uinteger = 17
const ACT_ATTR3	as uinteger = 18	' sprite mirror/rotate attrib
const ACT_SIZE		as uinteger = 32	' bytes per actor

dim nextSpriteSlot as ubyte = 1		' sprite slot 0 = player

sub AddActor(wx as uinteger, wy as uinteger)
	' adds a new actor at world coordinates wx,wy
	dim base as uinteger
	dim i as ubyte

	' find first free actor slot
	for i = 0 to 31
		base = cast(uinteger, i) * ACT_SIZE
		if Actors(base) = 0 then
			Actors(base + ACT_ENABLE) = 1
			' world position (16-bit)
			Actors(base + ACT_XLO) = cast(ubyte, wx band 255)
			Actors(base + ACT_XHI) = cast(ubyte, wx >> 8)
			Actors(base + ACT_YLO) = cast(ubyte, wy band 255)
			Actors(base + ACT_YHI) = cast(ubyte, wy >> 8)
			' sprite slot
			Actors(base + ACT_SPRITE) = nextSpriteSlot
			nextSpriteSlot = nextSpriteSlot + 1
			' defaults
			Actors(base + ACT_STATE) = 1
			Actors(base + ACT_XSPEED) = 1
			Actors(base + ACT_YSPEED) = 1
			Actors(base + ACT_DIR) = MRIGHT
			Actors(base + ACT_DIRTIMER) = 40		' change dir every 60 frames
			Actors(base + ACT_TYPE) = 1				' xenomorph
			Actors(base + ACT_STARTFR) = 17
			Actors(base + ACT_FRAME) = 17
			Actors(base + ACT_FRTIMER) = 10
			Actors(base + ACT_FRMAX) = 2			' anim speed
			Actors(base + ACT_HEALTH) = 3
			Actors(base + ACT_ATTR3) = spright
			exit for
		end if
	next i

end sub

sub UpdateActors()
	' update all enabled actors: AI movement, collision, animation, rendering
	dim base as uinteger
	dim i as ubyte
	dim wx, wy as uinteger			' world position
	dim newx, newy as uinteger		' proposed position
	dim sx, sy as uinteger			' screen position
	dim spd as ubyte

	for i = 0 to 31
		base = cast(uinteger, i) * ACT_SIZE
		if Actors(base + ACT_ENABLE) = 0 then continue for

		' read world position (16-bit)
		wx = cast(uinteger, Actors(base + ACT_XLO)) + (cast(uinteger, Actors(base + ACT_XHI)) << 8)
		wy = cast(uinteger, Actors(base + ACT_YLO)) + (cast(uinteger, Actors(base + ACT_YHI)) << 8)

		' --- simple AI: walk in current direction, change when blocked or timer expires ---
		spd = Actors(base + ACT_XSPEED)
		newx = wx : newy = wy

		dim dir as ubyte = Actors(base + ACT_DIR)

		if dir = MRIGHT
			newx = wx + spd
			Actors(base + ACT_ATTR3) = spright
		elseif dir = MLEFT
			newx = wx - spd
			Actors(base + ACT_ATTR3) = spleft
		elseif dir = MDOWN
			newy = wy + spd
			Actors(base + ACT_ATTR3) = spdown
		elseif dir = MUP
			newy = wy - spd
			Actors(base + ACT_ATTR3) = spup
		endif

		' check collision at proposed position (test leading edge)
		dim blocked as ubyte = 0
		if dir = MRIGHT
			if IsBlock(newx + 14, wy + 2) or IsBlock(newx + 14, wy + 14) then blocked = 1
		elseif dir = MLEFT
			if IsBlock(newx + 2, wy + 2) or IsBlock(newx + 2, wy + 14) then blocked = 1
		elseif dir = MDOWN
			if IsBlock(wx + 2, newy + 14) or IsBlock(wx + 14, newy + 14) then blocked = 1
		elseif dir = MUP
			if IsBlock(wx + 2, newy + 2) or IsBlock(wx + 14, newy + 2) then blocked = 1
		endif

		' direction change timer
		if Actors(base + ACT_DIRTIMER) > 0
			Actors(base + ACT_DIRTIMER) = Actors(base + ACT_DIRTIMER) - 1
		endif

		if blocked = 1 or Actors(base + ACT_DIRTIMER) = 0
			' pick a new random direction
			dir = cast(ubyte, rand()) band 3		' pseudo-random 0-3 using frame counter
			Actors(base + ACT_DIR) = dir
			Actors(base + ACT_DIRTIMER) = 30 + (cast(ubyte, (rand()) >> 2) band 63)
			' don't move this frame
			newx = wx : newy = wy
		endif

		' clamp to map bounds (in pixels)
		if newx > cast(uinteger, MAPW) * 16 - 16 : newx = wx : endif
		if newy > cast(uinteger, MAPH) * 16 - 16 : newy = wy : endif

		' store new position
		Actors(base + ACT_XLO) = cast(ubyte, newx band 255)
		Actors(base + ACT_XHI) = cast(ubyte, newx >> 8)
		Actors(base + ACT_YLO) = cast(ubyte, newy band 255)
		Actors(base + ACT_YHI) = cast(ubyte, newy >> 8)

		' --- animation ---
		Actors(base + ACT_FRTIMER) = Actors(base + ACT_FRTIMER) + 1
		if Actors(base + ACT_FRTIMER) > Actors(base + ACT_FRMAX)
			Actors(base + ACT_FRTIMER) = 0
			Actors(base + ACT_FRAME) = Actors(base + ACT_FRAME) + 1
			if Actors(base + ACT_FRAME) > Actors(base + ACT_STARTFR) + 3
				Actors(base + ACT_FRAME) = Actors(base + ACT_STARTFR)
			endif
		endif

		' --- render: convert world coords to screen coords ---
		sx = newx - scrollX
		sy = newy - scrollY

		' only render if on screen (with sprite border offset)
		if sx < 320 and sy < 256
			UpdateSprite(sx, cast(ubyte, sy), Actors(base + ACT_SPRITE), Actors(base + ACT_FRAME), Actors(base + ACT_ATTR3), 0)
		else
			' off screen - hide sprite
			UpdateSprite(0, 255, Actors(base + ACT_SPRITE), 0, 0, 0)
		endif

	next i
end sub

'----------------------------------------------------------
' //MARK: collision 
'
function IsBlock(wx as uinteger, wy as uinteger) as byte 
	' detect if a tile at world coordinates wx,wy is a block

    dim mapX as ubyte = cast(ubyte, wx >> 4)
    dim mapY as ubyte = cast(ubyte, wy >> 4)

    if mapX >= MAPW : mapX = 0 : endif
    if mapY >= MAPH : mapY = 0 : endif

    dim mapaddr as uinteger = $4000 + (cast(uinteger,mapY) * MAPW) + mapX

    nextregA(MMU2_4000_NR_52,31)
    dim tile as ubyte = peek(mapaddr)
    nextregA(MMU2_4000_NR_52,0)

    if tile = 1 : return 1 : endif

    return 0

end function

Sub CheckCollision()

	' collision routine - uses screen-space player pos + scroll offset for map lookups
	dim mapX, mapY as uinteger
	dim plxc as uinteger
	dim plyc as ubyte

	const scale as ubyte = 4

	nextregA(MMU2_4000_NR_52,31)
	mapaddr = $4000 ' @map1

	oldpx = plx
	oldpy = ply

	if pldx = MLEFT
		plx = plx - 1
	elseif pldx = MRIGHT
		plx = plx + 1
	endif

	plxc = plx : plyc = ply

	' convert screen position to map tile coords using scroll offset
	dim lefttile  as ubyte = cast(ubyte, (plxc + scrollX + 2) >> scale)
	dim righttile as ubyte = cast(ubyte, (plxc + scrollX + 14) >> scale)
	dim toptile   as ubyte = cast(ubyte, (cast(uinteger,plyc) + scrollY + 2) >> scale)
	dim bottile   as ubyte = cast(ubyte, (cast(uinteger,plyc) + scrollY + 14) >> scale)

	' clamp to map bounds
	if lefttile >= MAPW : lefttile = 0 : endif
	if righttile >= MAPW : righttile = MAPW - 1 : endif
	if toptile >= MAPH : toptile = 0 : endif
	if bottile >= MAPH : bottile = MAPH - 1 : endif

	dim tile as ubyte

	tile = 0

	if pldx = MLEFT
		for yy = toptile to bottile
			tile = tile + peek(mapaddr + (cast(uinteger,yy) * MAPW) + cast(uinteger,lefttile))
			if tile > 0
				plx = oldpx
				pldx = MSTILL
			endif
		next
	elseif pldx = MRIGHT
		for yy = toptile to bottile
			tile = tile + peek(mapaddr + (cast(uinteger,yy) * MAPW) + cast(uinteger,righttile))
			if tile > 0
				plx = oldpx
				pldx = MSTILL
			endif
		next
	endif

	' vertical collision
	if pldy = MUP
		ply = ply - 1
	elseif pldy = MDOWN
		ply = ply + 1
	endif

	plxc = plx : plyc = ply

	lefttile = cast(ubyte, (plxc + scrollX + 2) >> scale)
	righttile = cast(ubyte, (plxc + scrollX + 14) >> scale)
	toptile = cast(ubyte, (cast(uinteger,plyc) + scrollY + 2) >> scale)
	bottile = cast(ubyte, (cast(uinteger,plyc) + scrollY + 14) >> scale)

	if lefttile >= MAPW : lefttile = 0 : endif
	if righttile >= MAPW : righttile = MAPW - 1 : endif
	if toptile >= MAPH : toptile = 0 : endif
	if bottile >= MAPH : bottile = MAPH - 1 : endif

	tile = 0

	if pldy = MUP
		for xx = lefttile to righttile
			tile = tile + peek(mapaddr + (cast(uinteger,toptile) * MAPW) + cast(uinteger,xx))
			if tile > 0
				ply = oldpy
				pldy = MSTILL
			endif
		next
	elseif pldy = MDOWN
		for xx = lefttile to righttile
			tile = tile + peek(mapaddr + (cast(uinteger,bottile) * MAPW) + cast(uinteger,xx))
			if tile > 0
				ply = oldpy
			endif
		next
	endif

	' clamp player to screen bounds
	'if plx > 240 and pldx = MLEFT : plx = 0 : endif
	'if plx > (cast(uinteger,SCREENW) * 16) - 16 : plx = (cast(uinteger,SCREENW) * 16) - 16 : endif
	'if ply > 240 and pldy = MUP : ply = 0 : endif
	'if ply > (cast(uinteger,SCREENH) * 16) - 16 : ply = (cast(uinteger,SCREENH) * 16) - 16 : endif

	oldpx = plx : oldpy = ply

	nextregA(MMU2_4000_NR_52,$a)

end sub


sub ReadKeys()

	pldx = MSTILL : pldy = MSTILL 

	if MultiKeys(KEYD)
        pldx = MRIGHT 
        attr3 = spright
        keypressed = 1 
	elseif MultiKeys(KEYA)
        pldx = MLEFT 
        attr3 = spleft
        keypressed = 1 
	endif 
	if MultiKeys(KEYW)
        pldy = MUP
        attr3 = spup
        keypressed = 1 
	elseif MultiKeys(KEYS)
        pldy = MDOWN
        attr3 = spdown
        keypressed = 1 
    endif 
    if MultiKeys(KEYSPACE) and firepressed = 0 
        PlaySFX(5)
        firepressed = 1 
        firetimer = 5
        playerframbase = 6 
    endif 
    if GetKeyScanCode()=KEYR
        LoadSDBank("level1.nxt",0,0,0,32)            ' so we can change the tiles on the fly and reload to test 
        drawmap()
        
    endif 

    if  firetimer > 1
        ' firetimer triggered 
         firetimer = firetimer - 1
    elseif firetimer = 1
         firetimer = 0 
         firepressed = 0
         playerframbase = 0 
    endif 
    
    
    if keypressed = 1   
        if  playerframetimer =  3
            ' timer triggered for updating player waddle
             playerframetimer = 0
             playerframe = (1 - playerframe) 
        else 
             playerframetimer =  playerframetimer + 1 
        endif 
    end if     

end sub 

sub UpdatePlayer()

    ' attr3 = x mirror, y mirror, rotate
    ' left  %1010	
    ' right %0010
    ' up    %0000
	' down  %0100

	UpdateSprite(cast(uinteger,plx),ply,0,playerframe+playerframbase,attr3,0)

end sub

'----------------------------------------------------------
' //MARK: ScrollRoutines
'

sub drawColumn(mapCol as ubyte, bufCol as ubyte)
	' draw a full vertical column of tiles (16 tiles)
	dim row, bufRow, p as ubyte
	NextRegA(MMU2_4000_NR_52,31)
	mapaddr = $4000 ' @map1
	for row = 0 to SCREENH - 1
		bufRow = (bufStartY + row) band 15
		p = peek(mapaddr + cast(uinteger, tileY + row) * MAPW + mapCol)
		FDoTile16(p, bufCol, bufRow, 32)
	next
	NextRegA(MMU2_4000_NR_52,$0a)
end sub

sub drawRow(mapRow as ubyte, bufRow as ubyte)
	' draw a full horizontal row of tiles (20 tiles)
	dim col, bufCol, p as ubyte
	NextRegA(MMU2_4000_NR_52,31)
	mapaddr = $4000 ' @map1
	for col = 0 to SCREENW - 1
		bufCol = bufStartX + col
		if bufCol >= SCREENW : bufCol = bufCol - SCREENW : endif
		p = peek(mapaddr + cast(uinteger, mapRow) * MAPW + tileX + col)
		FDoTile16(p, bufCol, bufRow, 32)
	next
	NextRegA(MMU2_4000_NR_52,$0a)
end sub

sub ScrollMap()
	' handle pixel scrolling and edge column/row updates
	dim newTileX, newTileY as ubyte
	dim lx as uinteger
	dim offsetX, offsetY as ubyte

	dim maxScrollX as uinteger = cast(uinteger, MAPW - SCREENW) * 16	' 192
	dim maxScrollY as uinteger = cast(uinteger, MAPH - SCREENH) * 16	' 128
	dim scrollEdgeR as uinteger = cast(uinteger, SCREENW - 6) * 16		' 224
	dim scrollEdgeL as uinteger = 80									' 5 tiles from left
	dim scrollEdgeD as uinteger = cast(uinteger, SCREENH - 5) * 16		' 176
	dim scrollEdgeU as uinteger = 80									' 5 tiles from top
	dim oldScrollX as uinteger = scrollX
	dim oldScrollY as uinteger = scrollY

	' edge-triggered scroll: check player proximity to screen edges
	' scroll right
	if plx > scrollEdgeR and scrollX < maxScrollX
		scrollX = scrollX + scrollspeed
		if scrollX > maxScrollX : scrollX = maxScrollX : endif
		plx = plx - (scrollX - oldScrollX)				' push player back by scroll delta
	endif
	' scroll left
	if plx < scrollEdgeL and scrollX > 0
		oldScrollX = scrollX
		if scrollX >= scrollspeed
			scrollX = scrollX - scrollspeed
		else
			scrollX = 0
		endif
		plx = plx + (oldScrollX - scrollX)				' push player forward by scroll delta
	endif
	' scroll down
	if cast(uinteger,ply) > scrollEdgeD and scrollY < maxScrollY
		oldScrollY = scrollY
		scrollY = scrollY + scrollspeed
		if scrollY > maxScrollY : scrollY = maxScrollY : endif
		ply = ply - cast(ubyte, scrollY - oldScrollY)	' push player back
	endif
	' scroll up
	if ply < cast(ubyte, scrollEdgeU) and scrollY > 0
		oldScrollY = scrollY
		if scrollY >= scrollspeed
			scrollY = scrollY - scrollspeed
		else
			scrollY = 0
		endif
		ply = ply + cast(ubyte, oldScrollY - scrollY)	' push player forward
	endif

	' compute tile positions
	newTileX = cast(ubyte, scrollX >> 4)
	newTileY = cast(ubyte, scrollY >> 4)

	' check for horizontal tile boundary crossing
	if newTileX > prevTileX
		' scrolled right - draw new right edge column
		bufStartX = bufStartX + 1
		if bufStartX >= SCREENW : bufStartX = bufStartX - SCREENW : endif
		tileX = newTileX
		dim rcol as ubyte
		rcol = bufStartX - 1
		if rcol = 255 : rcol = SCREENW - 1 : endif
		drawColumn(tileX + SCREENW - 1, rcol)
	elseif newTileX < prevTileX
		' scrolled left - draw new left edge column
		if bufStartX = 0
			bufStartX = SCREENW - 1
		else
			bufStartX = bufStartX - 1
		endif
		tileX = newTileX
		drawColumn(tileX, bufStartX)
	endif

	' check for vertical tile boundary crossing
	if newTileY > prevTileY
		' scrolled down - draw new bottom edge row
		bufStartY = (bufStartY + 1) band 15
		tileY = newTileY
		dim brow as ubyte
		brow = (bufStartY - 1) band 15
		drawRow(tileY + SCREENH - 1, brow)
	elseif newTileY < prevTileY
		' scrolled up - draw new top edge row
		bufStartY = (bufStartY - 1) band 15
		tileY = newTileY
		drawRow(tileY, bufStartY)
	endif

	prevTileX = newTileX
	prevTileY = newTileY

	' update L2 hardware scroll offsets
	offsetX = cast(ubyte, scrollX band 15)
	offsetY = cast(ubyte, scrollY band 15)
	lx = cast(uinteger, bufStartX) * 16 + offsetX
	NextRegA(LAYER2_XOFFSET_NR_16, cast(ubyte, lx band 255))
	NextRegA(LAYER2_XOFFSET_MSB_NR_71, cast(ubyte, lx >> 8))
	NextRegA(LAYER2_YOFFSET_NR_17, cast(ubyte, bufStartY * 16 + offsetY))

end sub


sub drawmap()

	dim p as ubyte
	dim row, col as ubyte

	NextRegA(MMU2_4000_NR_52,31)					' page in map bank at $4000
	mapaddr = $4000 ' @map1									' point to map data

    ClipLayer2(0,0,0,0)							' hide while drawing
    ClipSprite(0,0,0,0)

	tileX = cast(ubyte, scrollX >> 4)
	tileY = cast(ubyte, scrollY >> 4)
	bufStartX = 0 : bufStartY = 0

	' draw 20x16 visible tiles from map (32 bytes per row)
	for row = 0 to SCREENH - 1
		for col = 0 to SCREENW - 1
			p = peek(mapaddr + cast(uinteger, tileY + row) * MAPW + tileX + col)
			FDoTile16(p, col, row, 32)
		next
    next

	' reset L2 scroll offsets
	NextReg(LAYER2_XOFFSET_NR_16,0)
	NextReg(LAYER2_XOFFSET_MSB_NR_71,0)
	NextReg(LAYER2_YOFFSET_NR_17,0)

    ClipLayer2(4,128+24,16,255-16)							' unclip Sprites and Layer 2
    ClipSprite(0,255,0,255)

	prevTileX = tileX : prevTileY = tileY

	NextRegA(MMU2_4000_NR_52,$0a)

end sub

'----------------------------------------------------------
' //MARK: routines
'


sub intro()
    'WaitKey()       
    EnableSFX							            ' Enables the AYFX, use DisableSFX to top
    EnableMusic 						            ' Enables Music, use DisableMusic to stop 
    PlaySFX(0)                                      ' Plays SFX 
    CLS256(0)   
    FL2Text(0,0,"THIS IS A QUICK DEMO WRITTEN",40)
    FL2Text(0,1,"USING NEXTBUILD AND BORIELS ",40)
    FL2Text(0,2,"ZXBASIC COMPILER",40)
    FL2Text(0,3,"USE WASD TO MOVE, SPACE FIRE",40)
    FL2Text(0,5,"ANY KEY TO CONTINUE",40)
    WaitRetrace2(10)
    WaitKey()  
end sub

'----------------------------------------------------------
' //MARK: Functions
function fastcall rand() as ubyte  

    asm 
            ; returns random 0-255 byte 
    rnd:
        ld  hl,0xA280   ; yw -> zt
        ld  de,0xC0DE   ; xz -> yw
        ld  (rnd+4),hl  ; snow_x = snow_y, z = w
        ld  a,l         ; w = w ^ ( w << 3 )
        add a,a
        add a,a
        add a,a
        xor l
        ld  l,a
        ld  a,d         ; t = snow_x ^ (snow_x << 1)
        add a,a
        xor d
        ld  h,a
        rra             ; t = t ^ (t >> 1) ^ w
        xor h
        xor l
        ld  h,e         ; snow_y = z
        ld  l,a         ; w = t
        ld  (rnd+1),hl
        ; ld  (rand_num), a
    end asm 

end function
'


map1:
asm
	; 32 x 24 map - 0=empty, 1=wall block
map1:
	; row 0-3: top border with rooms
	db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
	db 1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1
	; row 4-7
	db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1
	db 1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1
	db 1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	; row 8-11
	db 1,0,0,0,1,0,0,0,1,1,1,0,0,0,0,1,1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1
	db 1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,1
	; row 12-15
	db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1
	db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1
	db 1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,1,0,0,0,1
	db 1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1
	; row 16-19
	db 1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,1
	db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1
	; row 20-23: bottom area
	db 1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1
	db 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1
	db 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
end asm