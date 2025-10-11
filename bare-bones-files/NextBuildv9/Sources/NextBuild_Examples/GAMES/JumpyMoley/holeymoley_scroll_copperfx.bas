'!ORG=28000
'!HEAP=2048

' Press F6 Then Pick Run In CSpect
'
' Jumpey Moley 
' Small demo for NextBuild that uses the Copper to play PCM FX
' Along with pt3 & AYFX 

' This is the gfx2next line for generating the tiles. 
' 
'#! "assets\gfx2next.exe -tile-repeat -tile-size=8x8 -colors-4bit -block-size=4x4 assets\basicshapes.bmp data\basicsh"


#define IM2
#define NEX
#define CUSTOMISR
#include <nextlib.bas>
#include <nextlib_ints.bas>
#include <keys.bas>

PAPER 0 : BORDER 0 : ink 0 : CLS 

asm 
    nextreg SPRITE_CONTROL_NR_15,%001_010_11          ; ULA/TM / Sprites / L2
    ; nextreg GLOBAL_TRANSPARENCY_NR_14,0             ; Set global transparency to BLACK
    nextreg TURBO_CONTROL_NR_07,3                   ; 28mhz 
    nextreg PERIPHERAL_3_NR_08,254                  ; contention off
    nextreg ULA_CONTROL_NR_68,%10101000				; Tilemap Control on & on top of ULA,  80x32 
    nextreg LAYER2_CONTROL_NR_70,%00010000			; L2 320x256
	nextreg LAYER2_RAM_BANK_NR_12,12


	di                                              ; disable ints as we dont want IM1 running as we're using the area that sysvars would live in
end asm 

' -- Load Block 

LoadSDBank("classic.pt3",0,0,0,56) 					' load music.pt3 into bank 
LoadSDBank("[]ts4000.bin",0,0,0,37) 				' load the music replayer into bank 
LoadSDBank("[]soundfx.afb",0,0,0,38) 				' load music.pt3 into bank 

LoadSDBank("./level1/leveltest.nxm",0,0,0,40)		' Where we load our levels to 
LoadSDBank("./level1/leveltest.nxt",0,0,0,41)       ' load the tiles to bank 20
LoadSDBank("[]font1.spr",0,0,0,42)                  ' load font 
LoadSDBank("bonky.spr",0,0,0,43)					' sprites bank 32 
LoadSDBank("loading.raw",0,0,0,24)

LoadSDBank("output.dat",0,0,0,57)               	' load the sample pack, table located at end 

' -- Init display and sprites
InitLayer2(MODE320X256)
InitSprites2(64,$0000,43)							' init all sprites 

' -- Copper playback 
InitCopperAudio()
PlayCopperSample(4)		
SetCopperAudio()

' -- Init Music and interrupts 
InitSFX(38)							            	' init the SFX engine, sfx are in bank 38
InitMusic(37,56,0000)				            	' init the music engine 37 has the player, 56 the pt3, 0000 the offset in bank 56
SetUpIM()							            	' init the IM2 code 

' -- vars and consts
const spleft as ubyte = %1000						' constants required for sprite mirror + flipping 
const spright as ubyte = %0000
const spup  as ubyte = %0000
const spdown   as ubyte = %0100

const walltile as ubyte = 25 

dim plx,startx as uinteger 
dim ply,starty as ubyte 
dim pldx as ubyte 
dim pldy as ubyte 
dim plld as ubyte 
dim plch as ubyte 
Dim potx,poty as ubyte
dim playersprite as ubyte = 0
dim oldpx as uinteger 
dim oldpy as ubyte
dim attr3 as ubyte
dim nojump as ubyte
dim diamonds as ubyte
dim globalframe,globalframetimer as ubyte
dim level as ubyte = 0
dim maxlevel as ubyte = 4
dim cc as ubyte 
dim plvel as fixed = 1
dim velocity as fixed 
dim mapoffset as uinteger 
dim jumptrigger,jumpposition as ubyte
dim playerframe as ubyte 
dim hudtimer as ubyte
dim mapbuffer as uinteger
dim int_done as ubyte 
dim lineno as ubyte 
dim scrolly as ubyte 
dim scrolltrigger as ubyte 
dim scrollcount as ubyte 
dim hvel as fixed 
dim pleft as ubyte 
dim pright as ubyte
dim keypressed, jumpvalue as ubyte 
dim playeranim as ubyte  
dim lastframe as ubyte  
dim floor as ubyte  
dim kemp as ubyte  
dim sword as ubyte = 0 
dim ssize as ubyte = 14
dim swordframe as ubyte = 0 
dim swordkeypressed as ubyte  
dim swordtimer  as ubyte  
dim throw as ubyte 
const MLEFT  as ubyte = 0 
const MRIGHT as ubyte = 1 
const MUP	as ubyte = 2 
const MDOWN	as ubyte = 3 
const MSTILL	as ubyte = 4
dim ospraddress as uinteger
dim dead as ubyte 
dim t as ubyte 
dim fx_ow as ubyte 

' set up some sprites 					ID  X   Y  Img Dir spe
dim aSprites(63,7) AS uByte 			' 32 sprites with 5 attributes 
dim bThrows(3,4) as ubyte 

ospraddress = @aSprites

' -- Disable
DisableMusic
EnableMusic
DisableSFX
EnableSFX

' -- 
'ShowIntroScreen()

ClipLayer2(0,255,0,255) 
ClipSprite(0,255,0,255)

' copy the loading screen 
CopyToBanks(24,25,9)
CopyToBanks(24,54,1)


' --- TEST AREA 

SetupTileHW($40,$60)                 ' map address $xx00, tile addresss $xx00
'UpdateTilemap(xx as ubyte, yy as ubyte, vv as ubyte)

asm 
    ; Turns on the tilemap 
    nextreg TILEMAP_CONTROL_NR_6B,%10100001				;' Tilemap Control on & on top of ULA,  80x32 
end asm 

Restart:

int_done	= 0 	: dead 	= 0 
level = cast(ubyte,mapoffset)
GetLevel(level)									' use mapoffset when its set to 0 to prevent 
plx = 4<<3 : ply = 8<<3							' it being discard by optimisation 

EnableSFX							            ' Enables the AYFX, use DisableSFX to top
' EnableMusic 						            ' Enables Music, use DisableMusic to stop 

asm 
	; set SUL sprites on and on top of border (bug Cspect when sprites on border is disabled?)
	nextreg SPRITE_CONTROL_NR_15, %000_010_11
end asm 

'// MARK: -Main Loop 

do 
	if int_done = 1                             ' triggered via the copper interrupt vblank
        ReadKeys()
        CheckCollision()

        if dead = 0 
                
            UpdatePlayer()

        elseif dead = 1  

            playeranim	= 0 
            playersprite  = 4		' ; hit frame 
            dead = 0 

        elseif dead = 2 
            
            t = t + 1
            
            if t = 255 
                dead = 0 
                playersprite = lastframe
            endif 
        elseif dead = 3

            wait = 255 
            dead = 4
        elseif dead = 4
            wait = wait - 1
            if wait = 0 
                dead = 0 
                goto Restart 
            endif 
        endif 
        
        UpdateSprites()
        processthrows()

        int_done = 0 

    endif 
loop 

Sub MyCustomISR()
	asm 
	;	nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,255
	end asm 
	PlayCopperAudio()
	SetCopperAudio()	
	int_done = 1 	
	asm 
	;	nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0
	end asm 
end sub 

CopperSample()

sub CheckPots()

	dim t as ubyte 

	if diamonds=0
		
		do
			FL2Text(13,9,"               ",42)	
			WaitRetrace(100)
			FL2Text(13,9,"LEVEL COMPLETE!",42)
			t=t+1 
			WaitRetrace(50)
		loop until t = 15

		FL2Text(13,10,"PRESS ANY KEY !!",42)
		WaitKey()
		CopyToBanks(24,25,9)
		level = level + 1 : if level = maxlevel : level = 0 : endif 
		GetLevel(level) 		
		
	endif 
		
end sub

sub ShowIntroScreen() 
	dim p,y,a as ubyte 
	dim message$ as string
	do 
		ClipLayer2(0,0,0,0) 
		CopyToBanks(45,24,10)
		FL2Text(0,30,"PRESS ANY KEY TO PLAY-PART OF NEXTBUILD EXAMPLES!!",42)
		ShowLayer2(1)
		ClipLayer2(0,159,0,255) 
		while p<200 and GetKeyScanCode()=0
			WaitRetrace2(50)
			p=p+1 
		wend 
		'ShowMessages()
		ClipLayer2(0,0,0,0) 	
		ClearBank()
		CopyToBanks(24,25,9)
		restore Messages

		read y,message$
		while message$<>"*"
			a=20-(len(message$)>>1)
			FL2Text(a,y,message$,42)
			read y,message$
		wend 
		ClipLayer2(0,159,0,255) 
		p=0 
		while p<200 and GetKeyScanCode()=0
			WaitRetrace2(25)
			p=p+1 
		wend 
		p=0
		ClipLayer2(0,0,0,0) 
	loop until GetKeyScanCode()<>0
	ClearBank()
	CopyToBanks(24,25,9)	
	ClipLayer2(0,159,0,255) 
	ClearLayer2(0)
	
end sub

Messages:
	Data 1,"ABCDEFG"
	Data 5,"HOLEY MOLEY DEMO"
	Data 6,"WRITTEN BY DAVID SAPHIER"
	Data 8,"GRAPHICS SOURCED FROM THE INTERNET"
	Data 9,"AND OR MODIFIED BY ME"
	Data 11,"WRITTEN USING NEXTBUILD AND BORIELS"
	Data 12,"ZX BASIC COMPILER"
	Data 14,"CONTROL HOLEY TO GRAB THE HONEYBUTTIES"
	Data 15,"TO GET TO THE NEXT LEVEL"
	Data 16,"WATCH OUT FOR THE BADDIES!!"
	Data 18,"USE WASD TO MOVE, SPACE TO JUMP"
	Data 22,"PRESS FIRE TO PLAY"

	Data 0,"*"

sub ClearBank()
	asm
	;	di 
		nextreg MMU0_0000_NR_50,24
		ld hl,$4000 
		ld de,$4001 
		ld (hl),0
		ld bc,$2000
		ldir 
		nextreg MMU0_0000_NR_50,$ff
	;	ei 
	end asm
end sub 

sub GetLevel(level as ubyte)
' // MARK: GetLevel()
	' get next level from bank and copycopy to $4000
	ClipTile(0,0,0,0)	
	mapoffset = level * 1280 
	asm 
		nextreg MMU0_0000_NR_50,40			; where we have our levels
		ld de,(._mapoffset)
		ld hl,$000 
		add hl,de 
		ld de,$4000 
		ld bc,1280
		ldir 
		nextreg MMU0_0000_NR_50,$ff			; put back 
;		ld hl,map 
;		ld de,$4000
;		ld bc,1280
;		ldir 
	end asm 
	SetUpNPC()
	plx = startx: ply = starty
	ClipTile(0,255,8,220)	
	ClipSprite(0,159,8,220)	
end sub

sub ScrollLevel(lines as ubyte)
	'//MARK: -ScrollLevel()
	' get next level from bank and copy to $4000

	if lines<64
	mapoffset = (level * 1280 ) + cast(uinteger,lines)*40 
	asm 
		nextreg MMU0_0000_NR_50,40			; where we have our levels
		ld de,(._mapoffset)
		ld hl,$000 
		add hl,de 
		ld de,$4000
		ld bc,1280
		ldir 
		ld a,0 
		nextreg MMU0_0000_NR_50,$ff			; put back 

	end asm 
	endif 
end sub

Sub CheckCollision()
	'// MARK: -CheckCollision()
	' a robust collision routine for our player against the tilemap
    ' nb. this routine got out of hand, too many checks and 
    ' unrelated tasks (scrolling in here?) - needs a rewrite! 
	
    const blocksize as ubyte = 3            ' how many shifts 
    const scalesize as ubyte = 14           ' x1 and x2 x1 = 14 x2 = 30

	dim plxc,sp,add as uinteger
	dim plyc,tilehit,lefttile,righttile, toptile,bottile,tile as ubyte 
	
	const mapbuffer as uinteger = $4000            			' point to the map 	

	if ply >= 140			 
			scrolltrigger = 1						' trigger a pixel scroll 
	endif 
	
	' //MARK: -ScrollDown
	' I have no idea if this is the optimal way but it works 
	if scrolltrigger =1
		if scrolly < 8 
			scrolly=(scrolly+1) +cast(ubyte,velocity)
		endif 
		NextRegA(TILEMAP_YOFFSET_NR_31,scrolly)
		if scrolly > 7 
			scrolltrigger=0
			lineno = lineno + 1
			ScrollLevel(lineno)
			scrolly = 0 
			ply = oldpy 
			NextRegA(TILEMAP_YOFFSET_NR_31,0)
		endif 
		ply = (oldpy )  - 1 -  cast(ubyte,velocity)
	endif 
	if ply <= 64 and lineno>0 
		scrolltrigger = 2
		'if lineno > 0 : lineno = lineno - 1 : endif 
		'ScrollLevel(lineno)
		'ply = oldpy + 7 
	endif 

	' //MARK: -Scrollup (come back to me and fix)
	if scrolltrigger =2
		if scrolly > -8 
			scrolly=(scrolly-1) + cast(ubyte,jumpvalue)
		endif 
		NextRegA(TILEMAP_YOFFSET_NR_31,scrolly)
		if scrolly < -7
			scrolltrigger=0
			if lineno > 0 : lineno = lineno - 1 : endif 
			ScrollLevel(lineno)
			scrolly = 0 
			ply = oldpy
			NextRegA(TILEMAP_YOFFSET_NR_31,0)
		endif 
		ply = (oldpy )  +1 '+cast(ubyte,velocity)
	endif 


	oldpx = plx                             ' store current player x and y 
	oldpy = ply

	if pldx = MLEFT                         ' is player x direction LEFT?
		plx = plx  -(cast(ubyte,hvel))                   ' then plx - 1
	elseif pldx = MRIGHT                    ' is player x direction RIGHT?
		plx = plx +(cast(ubyte,hvel))                        ' then plx + 1 
	endif 

    plxc = (plx)                            ' take a copy of plx ply 
    plyc = (ply)
    	
	lefttile = (plxc+4) >> blocksize                
	righttile = (plxc+12) >> blocksize              ' tighter collision box
	
	toptile = (plyc+12) >> blocksize
	bottile = (plyc+scalesize) >> blocksize
	
	if lefttile>40 : lefttile = 0 : endif 
	if righttile>40 : righttile = 40 : endif 
	if toptile>32 : toptile = 0 : endif 
	if bottile>32 : bottile = 32 : endif 
	
	tile = 0                                ' tile flag 

	if pldx = MLEFT                         ' were we moving left? 
		for yy= toptile to bottile
				tile = peek(mapbuffer+(cast(uinteger,yy)*40)+cast(uinteger,lefttile))
				if tile > walltile+2  'and tile<>$1c and tile<>$1b               ' we hit a tile that wasnt 0 
					plx = oldpx + 1         ' put plx back but not quite touching the wall
					hvel = 0 
                    exit for 
				endif 
		next	
	elseif pldx = MRIGHT                    ' repeat for right 
			for yy= toptile to bottile
				tile = peek(mapbuffer+(cast(uinteger,yy)*40)+cast(uinteger,righttile))
				if tile > walltile+2
					plx = oldpx - 1         ' put plx back but not quite touching the wall
					if hvel>0.2: hvel = hvel - 0.2 : endif 
                    exit for 
				endif 
		next	
	endif 

    ' same as above but for up and down 

	if pldy = MUP
		ply = ply - 1 - cast(ubyte,velocity)
	else' if pldy = MDOWN
		ply = ply + 1+ cast(ubyte,velocity)
	endif 

	plxc = (plx) : plyc = (ply +scrolly)
	
	lefttile = (plxc+4) >> blocksize                   ' 2 & 14 for soft edge blocks 
	righttile = (plxc+12) >> blocksize 
	
	toptile = (plyc+2) >> blocksize
	bottile = (plyc+scalesize) >> blocksize
	
	if lefttile>40 : lefttile = 0 : endif 
	if righttile>40 : righttile = 40 : endif 
	if toptile>32 : toptile = 0 : endif 
	if bottile>32 : bottile = 32 : endif 
	
	tile = 0 

	if pldy = MUP 

	' check the top of th sprite 
	' XXX
	' ...
	' ... 

		add = (mapbuffer+(cast(uinteger,toptile)*40))
        
		for xx= lefttile to righttile
				tile = peek(add +cast(uinteger,xx))
				if (tile > walltile+2 ) or ply < 4 
					' nothing blocking so we can move up
					if tile=$1c or tile=$1b
						ply=oldpy-8						
					else 
					' some thing blocked the passway
						ply=oldpy
						'pldy = MSTILL 
						jumpposition=16
						exit for 	
						
					endif 

				endif 
		next	
	'endif
	'if pldy = MSTILL
	else 
		add = (mapbuffer+(cast(uinteger,bottile)*40))
		for xx= lefttile to righttile
				tile = peek(add+cast(uinteger,xx))
				if tile > walltile
						floor = 1 
						ply=oldpy 
						'pldy=MSTILL
                        jumptrigger=0
					 	velocity=0
						 
					'	plvel=0
						exit for 
					else 
						floor = 0 
						'if hvel > 0.4 : hvel = hvel + 0.2 : endif 
				endif 
		next	

		if velocity < 2 
			velocity=velocity+0.2
		endif		     

	endif 

	

	asm 
	di 
	end asm 
	NextReg($50,54)
	add  = (CAST(uinteger,(lineno))*20+(cast(uinteger,oldpy>>3)*20+(cast(uinteger,oldpx+8)>>4)))
	' BBREAK 
	a = peek ($000+add)
	NextReg($50,$ff)
	asm 
	ei 
	end asm 

	if a = 8 			' diamond 
		diamonds=diamonds-1 
		PlayCopperSample(0)
		NextReg($50,54)
		poke ($000+add,0)
		NextReg($50,40)
		add  = (CAST(uinteger,(lineno))*40+(cast(uinteger,oldpy>>3)*40+((cast(uinteger,oldpx+8)>>4)<<1)))
		poke (uinteger,$000+add,0)
		poke (uinteger,$028+add,0)
		NextReg($50,$ff)
		ScrollLevel(lineno)
	'	ta$=str(add)
	'	FL2Text(5,30,ta$,42)
		if diamonds = 0 
			dead = 3  
		endif 
	endif 

	'BBREAK 
	' FL2Text(5,30,str(add),42)
	'BBREAK 

	oldpx = plx : oldpy = ply	
end sub 

sub AddThrowbaddy(x as uinteger,y as ubyte, id as ubyte)
		' //MARK: -AddThrowBaddy
	dim p,s as ubyte 

	addr = @ThrowData+cast(uinteger,p*6)

	while peek(addr) > 0 and p<3
		p = p+ 1
	wend 

	if p<3 
		poke addr,1 
		poke uinteger addr+1,x 
		poke addr+3,y 
		poke addr+4,s 
		poke addr+5,id+32 
	endif 

end sub 

sub processthrows()
	' // FIXME 
	dim y,s,id as ubyte 
	dim x,addr,thrdata as uinteger 

'	dim tmpadd as uinteger at @throwdata

	for b = 0 to 3 
		addr = @ThrowData+cast(uinteger,b*6)			' get address of Throwdata

		if peek(addr) 									' movement is enable
			thrdata = @ThrowPositions					' address of movement table 

			x=x+peek(uinteger,thrdata+1)					' x word
			y=y+peek(thrdata+3)							' y 			
			s=peek(thrdata+4)							' step 
			id=peek(thrdata+5)							' sprite id 
			s = s + 2 									' increase throwdata step by 2 
			if s > 32
				RemoveSprite(id-5,0)					' remove sprite 
				poke(addr+4,0)							' reset s position 
				poke(addr,0)							' disable throw sprite 
			else 
				poke(addr+1,x)							' write x position 
				poke(addr+3,y)							' write y position 
				poke(addr+4,3)							' write step position 

				UpdateSprite(cast(uinteger,x),y,id,8,0,0) 
			endif 
		endif 
	next 
end sub 

ThrowData:
asm 
ThrowData:
	; active , word x , byte y , id , spr used
	; $x , $xxxx , $x
	db 0,0,0,0,0,0
	db 0,0,0,0,0,0
	db 0,0,0,0,0,0
	db 0,0,0,0,0,0
end asm 

ThrowPositions:
 asm 
	db 1,-1
	db 1,-2
	db 1,-3
	db 1,0
	db 1,1
	db 1,2
	db 1,3
	db 1,6
	db 1,6
	db 1,6
	db 1,6
	db 1,6
	db 1,6
	db 1,6
	db 1,6


 end asm 

sub ReadKeys()
	'// MARK: -ReadKeys() & Process
	
	
	' pldx = MSTILL 
	pldy = MSTILL 

	kemp = in 31 

	if GetKeyScanCode()=KEYR 
		diamonds=0
	endif

	
	if MultiKeys(KEYD) or kemp BAND 1 = 1
		if pleft > 0
			pleft = pleft -1
		else
			if pright < 8
				pright = pright + 2
			endif 
		endif 
		pldx = MRIGHT
		attr3 = spright
		plld = pldx
		keypressed = 1 

	elseif MultiKeys(KEYA) or kemp BAND 2 = 2
		if pright > 0
			pright = pright -1
		else
			if pleft < 8
				pleft = pleft + 2
			endif
		endif
		
		pldx = MLEFT
		attr3 = spleft
		plld = pldx
		keypressed = 1 

	endif 
	' // MARK: -Player Left / Right 

	if pleft > 0 
		if hvel < 2 : hvel = hvel + 0.1 : endif 	
		pleft = pleft - 1
		playeranim = 1
		pldx = MLEFT
	endif 

	if pright > 0 
		if hvel < 2 : hvel = hvel + 0.1 : endif 	
		pright = pright - 1
		playeranim = 1 
		pldx = MRIGHT
	endif 

	if pright + pleft = 0 ' and floor = 1 
	if hvel > 0.4 : hvel = hvel - 0.2 : endif
		pldx = MSTILL
		playeranim = 0
	endif 
	
	if MultiKeys(KEYW) or kemp BAND 16 = 16
		if swordkeypressed bor sword = 0  
			swordframe = 0 
			swordkeypressed = 1 
			sword	= 2
			PlaySFX(10)
		endif 
	elseif sword = 1
		
		RemoveSprite(63,0)
	endif 

	if MultiKeys(KEYW)=0 and sword =1 
		if kemp BAND 16 = 0
		swordkeypressed = 0 
		sword = 0
		endif 
		RemoveSprite(63,0)
	endif 

	if MultiKeys(KEYS)
		WaitRetrace(50)
		asm 
		di 
		end asm 
		NextReg($50,54)
		add  = (CAST(uinteger,(lineno))*20+(cast(uinteger,ply>>3)*20+(cast(uinteger,plx)>>4)))
		' BBREAK 
		' poke ($e000+add,255)
		'NextReg($57,1)

		'NextReg($57,54)
		'SaveSD("mem.bin",$e000,2560)
		NextReg($50,$ff)
		asm 
		ei 
		end asm 
	endif 

	' // MARK: - JumpCode 

	if (MultiKeys(KEYSPACE) or kemp BAND 32 = 32) and jumptrigger=0 and nojump=0
		if floor 
			jumptrigger = 2
			nojump = 1 
			' PlaySFX(22)
			PlaySFX(5)
			' PlayCopperSample(0)	
			plvel=0
			'astframe = playersprite
		endif 
    elseif MultiKeys(KEYSPACE)=0 and kemp BAND 32 = 0  and nojump = 1 

        nojump=0
		jumpposition=0
		playersprite = 0 
	endif  
    if jumptrigger = 2 
        jumpposition=0 
        jumptrigger=1
		playersprite = 2 
    endif 

    if jumptrigger = 1 
		' jumpvalue=0
		if hvel < 2.2 : hvel = hvel + 0.2 : endif 
		playerframe = 2 : playeranim = 0 
		if MultiKeys(KEYSPACE) or kemp BAND 32 = 32						' is the user still pressing jump?
        	nojump = 1 
			jumpvalue=peek(@jumptable+cast(uinteger,jumpposition))
			pldy = MUP 
		else 
			'jumpposition = 16 
			'hvel = 2
			'playerframe = lastframe 
		endif 	


		ply=ply+(jumpvalue)
		jumpposition=jumpposition+1
		if jumpposition>15 : jumptrigger=3	
		
    endif 


    if playeranim>0 and playersprite < 2
		
	    if  playerframe =  5
            ' timer triggered 
            playerframe = 0			
            playersprite = 1 - playersprite 
        else 			
            playerframe =  playerframe + 1 
        endif 
    endif 

	if  globalframetimer =  8
		' timer triggered 
		 globalframetimer = 0
		 globalframe= 1 - globalframe
		 PalCycle()
	else 
		globalframetimer =  globalframetimer + 1
	endif 
	
	if sword = 2
		'if globalframetimer band 1 = 0
			swordframe = swordframe + 1
			if swordframe>3
				sword = 1
			endif 
		'endif 
	endif 

	
end sub 

jumptable:
asm 
    ; the data for when the player jumps 
	; //MARK: - JumpTable
    db -9,-7,-6,-5,-3,-2,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0
end asm 

sub UpdatePlayer()
	' //MARK: - UpdatePlayer()

	' %00001010  x 2 
	'UpdateSprite(cast(uinteger,plx),ply,63,playersprite,attr3,%00001010)
	UpdateSprite(cast(uinteger,plx),ply,62,playersprite,attr3,0)
	if sword > 0 
		if attr3 
			xadd = plx-8
		else 
			xadd = plx+8
		endif 
		UpdateSprite(cast(uinteger,xadd),ply,63,16+swordframe,attr3,0)
	endif 
end sub 

sub fastcall pokeBank(bank as ubyte, value as ubyte, addressoffset as uinteger)

	asm 
		; pokes a [value] to [bank] - address starts at $0000
        exx : pop hl  : exx 
        ; a = bank 
        ; hl address 
        nextreg $50,a 			; $50 is MMU0  0000 - $1FFF
        pop     af 
        ld      (hl),a
        nextreg $50,$ff			; Replaces ROM 
        exx : push hl : exx 
	end asm 

end sub 

sub SetUpNPC()
'	// MARK: - Setup NPCs 
 	diamonds=0 ' reset pot counter 
	
 	dim ccount as uinteger
 	dim parama, paramb,a as ubyte 
	
 	for sp = 0 to 63 
 		aSprites(sp,0)=0						' reset all sprites
 		RemoveSprite(sp,0)						' remove all sprites
 	next sp
	'NextRegA($50,40)
 	for yy = 0 to 63
 		for xx=0 to 39
		 NextRegA($50,40)                       ' level data into slot 0 
 			a=peek($000+cast(uinteger,ccount))
 			parama = 0 
 			paramb = 0 
				
 				if a = 16			
 					a = 8			' snek 
					poke ($000+cast(uinteger,ccount)),0
					paramb = 2      ' health
 				elseif a = 15	
 					a = 10			' floor spike 

				elseif a = 1 		' diamond 
						pokeBank(54,8,cast(uinteger,yy)*20+(cast(uinteger,xx)>>1))
						diamonds = diamonds + 1 
						a = 0 
				elseif a = 19		' cant remember 
						poke ($000+cast(uinteger,ccount)),0
					   a = 16
 				elseif a = $60 		' player start 
 					startx=xx<<3 : starty = yy<<3
				else 
					a = 0 
 				endif 
 				' (x as byte,y as byte,spriteimage as ubyte,spritetype as ubyte, parama as ubyte, paramb as ubyte)
				 if a > 0 
					poke ($000+cast(uinteger,ccount)),0
					if a <$60
						AddNewSprite(cast(uinteger,xx)<<3,cast(ubyte,yy),a,a,parama,paramb)
					endif 
				endif 	
 			'endif 
 			ccount=ccount+1
 		next xx
 	next yy 
	NextRegA($50,$ff)
	diamonds = diamonds - 1 
 end sub

 SUB fastcall PalCycle()
 ' sends palette to registersm address @label, num of cols 0 = 256, offset default 0
 asm 
		;BREAK
		CCOUNT EQU 3
		PROC 
		local loadpal, palloop 
		pop hl : exx 
	loadpal:
		ld de,palbuffdiamond
	; palloop:
		ld a,(de)
		push af 						; save the value 
		ld hl,palbuffdiamond+1
		ld de,palbuffdiamond
		ld bc,CCOUNT-1
		ldir 
		pop af 
		ld (de),a 

		ld hl,palbuffdiamond
		; pop bc 
		ld b,CCOUNT
		ld a,1
	palloop:
		
		nextreg PALETTE_INDEX_NR_40,a					; NextReg $40,0
		ld d,a 
		ld a,(hl)						; load first value, send to NextReg
		nextreg $41,a 
		; nextreg $44,0 
		inc hl 							; incy dinky doo hl
		; inc hl 							; incy dinky doo h
		ld a,d 
		inc a 
		djnz palloop	
		exx : push hl 
		ENDP 				
	end asm 		
end sub 


	asm 
		palbuffdiamond
		defs 32,0
	end asm 

sub UpdateSprites()
	'// MARK: -UpdateSprites
	dim y,p,d,img,sy,s,pma,pmb,spattr3,tile,type,ty,y1,size,y2,y3,enable as ubyte 
	dim x,sx,add,lt,rt,x1,x2,spraddress as uinteger
	border 7
	Border 2 
	tile = 0  : p = 0 
	while p<31

		spraddress = ospraddress +cast(uinteger,p<<3)
		enable = peek(spraddress)
		if enable band 1 = 1			' is sprite set on 
			spattr3=0 : tile=0
			sx = peek(spraddress+1)

			if enable =3
				sx = sx + 255
			endif 
			y = peek(spraddress+2)
			if y < lineno+28 and y >= lineno +1
				y1 = -((lineno-32)<<3) -scrolly
				sy = y<<3
				img = peek(spraddress+4)
				type = peek(spraddress+5)
				d = peek(spraddress+6)				' direction 
				s = peek(spraddress+7)				' speed 

				if type = 10 					' spike 
					' s = stage of movement 
					if s = 0 

						if plx>=sx-16 AND plx<=sx+16  
								if ply>=y1+sy-64 and ply<=y1+sy+6
								's = 2
								poke(spraddress+7,2)
							endif 
						endif 
						
					elseif s>1
						s=s+1 
						if s>8
							img = img + 1 
							s = 2
							if img > 15
								img = 10
								s = 0 
							elseif img = 11
								PlaySFX(9)
							endif 
							poke(spraddress+4,img)

						endif
						poke(spraddress+7,s)
					endif 
					
					
				endif 

				if type = 8								' snek 
					pma = peek(spraddress+6)
					pmb = peek(spraddress+7)
					
					if pma = 0							' left 
						sx=sx-1
						lt = ((sx + 8) >> 3)+40 : ty = ((y1+sy)>>3)+1
						add = $4000+(cast(uinteger,ty)*40)+lt					
						tile = peeK(add+40)		
						'poke(add,0)	
						if tile < walltile or peeK(add-41)>walltile		
							sx=sx+1 
							pma = 1
						endif 
						spattr3 = spright
					elseif pma = 1						' right 
						sx=sx+1
						rt =((sx + 16) >> 3)+40 : ty = ((y1+sy)>>3)+1
						add = $4000+(cast(uinteger,ty)*40)+rt
						tile = peek(add+39)
						'poke(add+40,0)	
						spattr3 = spleft
						if tile < walltile  or peeK(add-41)>walltile		
							pma = 0
							sx=sx-1 
						endif 
					elseif pma = 2
						' // FIXME 
						'pma = 0
						pma = 3 
						RemoveSprite(p,0)	

						AddThrowbaddy(cast(uinteger,sx),sy+y1,p)
						poke(spraddress,0)
						

					endif 
					img = img + globalframe
					poke(spraddress+6,pma)
					
					if sx>=255 
						poke(spraddress,3)
						poke(spraddress+1,sx -255)
					else
						poke(spraddress,1)
						poke(spraddress+1,cast(ubyte,sx))
					endif 

				endif 

				if dead = 0 
				if type = 8 or type=10 ' 3 or type = 5					' honey pot 

				' ' px/py player position, tx/ty position of current sprite 
					if sword = 2 
						ssize = 18 
						x1=plx+1 : x2 = sx : y3 = ply : y2 = y1+sy+1
					else 
						ssize = 14
						x1=plx+1 : x2 = sx : y3 = ply : y2 = y1+sy+1
					endif 
				 	
				 	'const ssize as ubyte = 14   ' size of area to check from point x\y 

				 	if (x1+ssize<x2) BOR (x1>=x2+ssize) BOR (y3+ssize<y2) BOR (y3>=y2+ssize)=00
				 		border 2
						 ' push player 
						 if type = 8 
							if sword = 0 
								if plx >= sx 
									pright = 6
									pleft = 0 
									' hvel = 2
								elseif plx-8 <= sx
									pleft = 6
									pright = 0 
									'hvel = 2
								endif 
								' BBREAK 								dead 	= 1
									if fx_ow=0
									PlayCopperSample(3)
									fx_ow=5
								else
									fx_ow=fx_ow-1 
								endif
								
							elseif sword > 0  						' word is active and swiping
								if plx+2 >= sx 						' check out box coliision 
									sx = sx - 12
								elseif plx<= sx 
									sx = sx + 8
								endif 
								if sx>=255 							' find out where X is and 
									poke(spraddress,3)				' adjust x is a word 
									poke(spraddress+1,sx -255)
								else
									poke(spraddress,1)
									poke(spraddress+1,cast(ubyte,sx))
								endif 

								if pmb > 0							' life left 
									pmb = pmb - 1					'  
									PlaySFX(11)
									poke (spraddress+7,pmb)
								elseif pmb = 0  						
									PlaySFX(12)
									RemoveSprite(p,0)
									poke (spraddress,0)
									poke (spraddress+7,0)

								endif 
								if pma = 2 						
									PlaySFX(12)
									pma = 0 
									AddThrowbaddy(sx,sy,p)
							
									
								endif 								
								
								
							endif 
						elseif type = 10
							if img >10 and img<13
								dead 	= 1
								pldy=MUP 
								jumptrigger=2
								if fx_ow=0
									PlayCopperSample(3)

									fx_ow=5
								else
									fx_ow=fx_ow-1 
								endif 
								
							endif 
						endif 

					endif 

					border 0 

				endif  
				endif 

				if peek (spraddress)>0
					UpdateSprite(cast(uinteger,sx),y1+sy,p,img,spattr3,0)
				endif 
				' endif
			else 
				RemoveSprite(p,0)	
			endif 
		endif 
		p=p+1
	wend

end sub
' ' 
sub ShowHud()
	if  hudtimer =  0
		' timer triggered 
		 hudtimer = 50
		 FL2Text(4,30,"LEVEL : "+str(level),42)
		 FL2Text(20,30,"POTS : "+str(diamonds),42)
	else 
		 hudtimer =  hudtimer - 1 
	endif 
	
end sub

sub PlayerHit()
	dim t as ubyte
	do
		RemoveSprite(63,0)
		WaitRetrace(50)
		UpdateSprite(cast(uinteger,plx),ply,63,4,attr3,%00101010)
		WaitRetrace(50)
		t=t+1
	loop until t = 25 
	
end sub

Sub AddNewSprite(x as uinteger,y as ubyte,spriteimage as ubyte,spritetype as ubyte, parama as ubyte, paramb as ubyte)
	
	'//MARK: -AddNewSprite

	dim p,a as ubyte 

	while aSprites(p,0) band 1 = 1 and p<32
		p=p+1
	WEND 
	
	if p<32
		 
		if x>255 
			a = %00000011 
			else 
			a = 1
		endif 
		' a = a bor (cast(ubyte,y ))
		
		aSprites(p,0)=a 					'  sprite on 
		aSprites(p,1)=cast(ubyte,x)			'  x 
		aSprites(p,2)=y						'  y 
		aSprites(p,3)=p						'  id 
		aSprites(p,4)=spriteimage			'  spriteimage 
		aSprites(p,5)=spritetype			'  type 
		aSprites(p,6)=parama				'  param A 
		aSprites(p,7)=paramb				'  param B 
	endif 
end sub

sub DrawMap()

    ' draws with 16x16 on L2
	dim sp as uinteger
	dim p as ubyte 
	
	mapbuffer = @map

	for y = 0 to 11 
		for x = 0 to 15
			p = peek(mapbuffer+sp)
			FDoTile16(p,y,x,32)
			sp = sp + 1 
		next x 
	next y
	
end sub 


sub fastcall SetupTileHW(tileaddr as ubyte, tiledata as ubyte)
	    
    asm     
    
        exx : pop hl : exx : push af 
         
        nextreg PALETTE_CONTROL_NR_43,%00110001             ; NextReg($43,%00110000)	' Tilemap first palette
                                                            ; writing to NR$43 resets NR$40
        ld hl,palbuff                                       ; upload palette for tilemap
        ld b,16*2
	_tmuploadloop:
        ld a,(hl) : nextreg PALETTE_VALUE_9BIT_NR_44,a
        inc hl 
        djnz _tmuploadloop

		ld 		hl,palbuff+2
		ld 		de,palbuffdiamond
		ld		bc,32
		ldir 

		; ' tilemap 40x32 no attribute 256 mode 
        nextreg TILEMAP_DEFAULT_ATTR_NR_6C,%00000000		; Default Tilemap Attribute on & on top of ULA,  80x32 
        
        pop af 
        nextreg TILEMAP_BASE_ADR_NR_6E,a				    ; tilemap data
        pop af 
        nextreg TILEMAP_GFX_ADR_NR_6F,a				        ; tilemap images 4 bit 
        
        nextreg ULA_CONTROL_NR_68,%10100000				    ; ULA CONTROL REGISTER
        nextreg GLOBAL_TRANSPARENCY_NR_14,0  				; Global transparency bits 7-0 = Transparency color value (0xE3 after a reset)
        nextreg TILEMAP_TRANSPARENCY_I_NR_4C,$0				; Transparency index for the tilemap
        pop af 
            
		nextreg MMU2_4000_NR_52,41
		ld hl,$4000                                     ; copy the tile image data from bank 30 into place
		ld de,$6000
		ld bc,3104										; size of tiles
		ldir 
        
        nextreg MMU2_4000_NR_52,$0a                     ; pop bank orginal bank $0a 
		ld hl,map                                       ; copy map to tilemap data
		ld de,$4000                                     
		ld bc,80*40
        ldir 
        
        exx : push hl : exx 
    end asm 
    ClipTile(0,255,0,255)				
end sub 


sub fastcall UpdateTilemap(xx as ubyte, yy as ubyte, vv as ubyte)
    ' this routine will place tile vv at xx,yy
    asm 
		pop hl : exx                ; save ret address 
		ld hl,$4000                 ; start of tilemap data
		add hl,a	                ; add x 
		pop de                      ; get y
		ld e,40                     ; mul y * 40 = or tilewidth 
		mul d,e                           
		add hl,de                   ; now add to hl
		pop af                      ; get the value vv 
		ld (hl),a                   ; place tile 
		exx 
		push hl                     ; return aaddress on stack 
	end asm 
end sub


Sub fastcall CopyToBanks(startb as ubyte, destb as ubyte, nrbanks as ubyte)
 	asm 
		exx : pop hl : exx 
		; a = start bank 			

		; call _checkints
		; di 
		ld c,a 						; store start bank in c 
		pop de 						; dest bank in e 
		ld e,c 						; d = source e = dest 
		pop af 
		ld b,a 						; number of loops 

		copybankloop:	
		push bc : push de 
		ld a,e : nextreg $50,a : ld a,d : nextreg $51,a 
		; ld hl,$0000
		; ld de,$0001 
		; ld hl,0
		; ld bc,$2000 
		; ldir 
		ld hl,$0000
		ld de,$2000
		ld bc,$1fff
		ldir 
		pop de : pop bc
		inc d : inc e
		djnz copybankloop
		
		nextreg $50,$ff : nextreg $51,$ff
		;ReenableInts
		exx : push hl : exx

 	end asm  
end sub  

map:
asm
map:
	; 40 x 32 map 
	; >=63 empty space 
	; 
	; 2 pl start 
    defs 1280,0
	
end asm 

' palbuff:
' asm 
' palbuff:
'     incbin "./data/tiles.nxp"
' end asm 

palbuff:
asm 
palbuff:
	;defs 512,0
	; //MARK: -TilePalette 
	; palette for tilemap 
	incbin "./data/level1/leveltest.nxp"
end asm   



sub fastcall InitCopperAudio()

	asm
		
		ld		bc,TBBLUE_REGISTER_SELECT_P_243B
		ld		a,VIDEO_TIMING_NR_11
		out		(c),a
		inc		b
		in		a,(c)				; Display timing
		and		7					; 0..6 VGA / 7 HDMI
		ld		(.CopperSample.video_timing),a	; Store timing mode
		
		nextreg	COPPER_CONTROL_LO_NR_61,$00
		nextreg	COPPER_CONTROL_HI_NR_62,$00
		nextreg	COPPER_DATA_NR_60,$FF
		nextreg	COPPER_DATA_NR_60,$FF

		ld		a,SOUNDDRIVE_DF_MIRROR_NR_2D
		ld		(.CopperSample.sample_dac),a	; Sound on

	end asm

end sub 

sub fastcall PlayCopperSample(sample as ubyte)
	asm
		; BREAK  
		; get sample data 
        ; call    ._checkints
        ; di
		ld 		hl,copper_sample_table								; point to start of sample table 
		ld 		e,a 
		ld 		d,6 
		mul 	d,e 
		add 	hl,de 												; hl now points to start of sample data 
		ld		(.playerstack+1),sp 
		ld 		sp,hl 											

		pop 	hl 
		ld		(.CopperSample.sample_loop),hl 						; saves bank + loop 
		
		pop 	hl  
		ld		(.CopperSample.sample_ptr),hl

		pop 	hl 
		ld		(.CopperSample.sample_len),hl
		
		ld		hl,0
		ld		(.CopperSample.sample_pos),hl

		ld		a,SOUNDDRIVE_DF_MIRROR_NR_2D
		ld		(.CopperSample.sample_dac),a	; Sound on		

	playerstack:
		ld 		sp,0
        ; ReenableInts

	end asm
end sub 

sub fastcall SetCopperAudio()

	asm 
        ; BREAK 
    ;    call    ._checkints
    ;    di 
	;	push ix 
		call CopperSample.set_copper_audio
    ;    pop ix 
    ;    ReenableInts
	end asm 

end sub 

sub fastcall PlayCopperAudio()

	asm

        ; BREAK 
		; exx : pop hl : exx 
	;	call    ._checkints
     ;   di 
	;	push ix 
		call CopperSample.play_copper_audio
	;	pop ix 
     ;   ReenableInts
		; exx : push hl : exx
	end asm

end sub 

sub fastcall CopperWaitLine()
	asm
	wait_line:	 
		ld		bc,TBBLUE_REGISTER_SELECT_P_243B
		ld		de,($1E*256)+$1F

		out		(c),d						; MSB
		inc		b

	.msb:
		in		d,(c)
		bit		0,d							; 256..312/311/262/261 ?
		jp		nz,.msb

		dec		b
		out		(c),e						; LSB
		inc		b

	.lsb:
		in		e,(c)
		cp		e							; 0..255 ?
		jp		nz,.lsb

	end asm

end sub 


sub fastcall CopperSample()
    asm 
	push namespace CopperSample 
	;    ?Updated:     em00k, adding banking                               ?
	;    ?Programmer:  kevbrady@ymail.com                                  ?
	;    ?Modified:    14th July 2018                                      ?
	;    ?Description: Copper sample player (BIS version)                  ?
	;    ?                                                                 ?


	; Hardware registers.
		
	; TBBLUE_REGISTER_SELECT			equ	$243B	; TBBlue register select

	PERIPHERAL_1_REGISTER			equ	$05	; Peripheral 1 setting
	TURBO_CONTROL_REGISTER			equ	$07	; Turbo control
	; DISPLAY_TIMING_REGISTER			equ	$11	; Video timing mode (0..7)
	RASTER_LINE_MSB_REGISTER		equ	$1E	; Current line drawn MSB
	RASTER_LINE_LSB_REGISTER		equ	31	; Current line drawn LSB
	SOUNDDRIVE_MIRROR_REGISTER		equ	$2D	; SpecDrum 8 bit DAC (mirror)
	COPPER_DATA						equ	$60	; Copper list
	COPPER_CONTROL_LO_BYTE_REGISTER	equ	$61
	COPPER_CONTROL_HI_BYTE_REGISTER	equ	$62
	CONFIG1 						equ $05
	COPHI							equ $62
	COPLO							equ $61
	SELECT							equ $243b
	SAMPLEBANK						equ 32 				; sample bank to use 


	set_copper_audio:
		; di 
	
		ld		(.stack+1),sp

		ld		ix,copper_loop				; Auto detect timing

		ld		bc,SELECT
		ld		a,CONFIG1
		out		(c),a
		inc		b
		in		a,(c)						; Peripheral 1 register

		ld		hl,hdmi_50_config
		ld		de,vga_50_config
		bit		2,a
		jr		z,.refresh					; Refresh 50/60hz ?
		ld		hl,hdmi_60_config
		ld		de,vga_60_config
	.refresh:
		ld		a,(video_timing)
		cp		7							; HDMI ?
		jr		z,.hdmi
		ex		de,hl						; Swap to VGA
	.hdmi:
		ld		a,(hl)						; Copper line
		inc		hl
		ld		(.return+1),a				; Store ruturn value

		ld		sp,hl

	;	------------
	;	------------
	;	------------

		ld		hl,(sample_len)				; Calc buffer loop offset
		ld		bc,(sample_pos)
		xor		a							; Clear CF
		sbc		hl,bc

		ld		b,h
		ld		c,l							; BC = loop offset (0..311)

		pop		hl							;  Samples per frame (312)
		ld		(video_lines),hl

		ld		a,h							; 16 bit negate
		cpl
		ld		h,a
		ld		a,l
		cpl
		ld		l,a
		inc		hl							; Samples per frame (-312)

		ld		a,20						; No loop (Out of range)

		add		hl,bc
		jp		c,.no_loop

	;	----D---- ----E----
	;	0000 0008 7654 3210
	;	0000 0000 0008 7654	

		ld		a,c							; Loop offset / 16
		and		%11110000
		or		b
		swapnib
	.no_loop:
		ld		b,a							; B = 0..19 (20 no loop)

		ld		a,c
		and		%00001111
		ld		c,a

	;	------------

		ld		hl,.zone+1					; Build control table
		pop		de
		ld		(hl),e						; Split
		ld		a,d							; Count

		pop		hl							; 0..15 samples routine

		ld		(copper_audio_config+1),sp 	; **PATCH**

		ld		sp,copper_audio_stack
		
		cp		b
		jr		nz,.skip					; Loop 0..15 samples ?

		ex		af,af'

		ld		e,c							; 0..7
		ld		d,9
		mul		d,e							; 0..144
		ld		a,144						; 144..0
		sub		e

		add		hl,de
		push	hl
		push	ix							; Output loop
		ld		de,copper_out16
		add		de,a
		push	de

		ex		af,af'

		jr		.next

	;	------------

	.skip:	
		push	hl							; Output normal

	;	------------

	.next:	
		ld		hl,copper_out16				; 16 samples routine
		dec		a

	.zone:	
		cp		7
		jp		nz,.no_split

		ld		de,copper_split
		push	de							; Output Split
	.no_split:
		cp		b
		jp		nz,.no_zone					; Loop 16 samples ?

		ex		af,af'

		ld		e,c							; 0..15
		ld		d,9
		mul		d,e							; 0..144
		ld		a,144						; 144..0
		sub		e

		add		de,copper_out16
		push	de
		push	ix							; Output loop
		ld		de,copper_out16
		add		de,a
		push	de

		ex		af,af'

		jr		.zone_next

	.no_zone:
		push	hl							; Output normal

	.zone_next	
		dec		a
		jp		p,.zone

		ld		(copper_audio_control+1),sp ; **PATCH**

	.return	
		ld		a,0							; Copper line to wait for

	.stack	
		ld		sp,0

		ret


	; --------------------------------------------------------------------------
	; --------------------------------------------------------------------------
	; --------------------------------------------------------------------------


	; **MUST CALL EACH FRAME AFTER WAITING FOR LINE A FROM SET_COPPER_AUDIO**


	; Build copper list to output one frame of sample data to DAC.

	play_copper_audio: 
		
		getreg($50) : ld (playbankout+3),a 
		getreg($51) : ld (playbankout+7),a 

		ld 			a,(sample_bank)			; set sample banks 
		nextreg 	$50,a 
		inc 		a
		nextreg 	$51,a 
		
		call 		play_copper_audio2		; set copper 
		
	playbankout:		
		nextreg 	$50,$ff					; return roms 
		nextreg 	$51,$ff 
		
		ret 

	play_copper_audio2:
		
		ld			(play_copper_stack+1),sp

	copper_audio_config:
		
		ld		sp,0			; **PATCH**

		pop		hl							; Index + VBLANK
		pop		de							; Line 180 + command WAIT

		ld		a,l
		nextreg	COPLO,a
		ld		a,h
		nextreg	COPHI,a

		ld		hl,(sample_ptr)				; Calc playback position
		ld		bc,(sample_pos)	
		add		hl,bc

		ld		bc,SELECT					; Port
		ld		a,COPPER_DATA
		out		(c),a
		inc		b

		ld		a,(sample_dac)				; Register to set (DAC)

	copper_audio_control:
		ld		sp,0						; **PATCH**
		
		ret									; GO!!!

	;	------------

	copper_out16:	
		out		(c),d		;   0 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out15:	
		out		(c),d		;   9 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out14:	
		out		(c),d		;  18 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out13:	
		out		(c),d		;  27 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out12:	
		out		(c),d		;  36 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out11:	
		out		(c),d		;  45 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc	de
	copper_out10:	
		out		(c),d		;  54 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out9:
		out		(c),d		;  63 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out8:	
		out		(c),d		;  72 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out7:	
		out		(c),d		;  81 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out6:	
		out		(c),d		;  90 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out5:	
		out		(c),d		;  99 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out4:	
		out		(c),d		; 108 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out3:	
		out		(c),d		; 117 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc	de
	copper_out2:	
		out		(c),d		; 126 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out1:	
		out		(c),d		; 135 BYTES
		out		(c),e
		out		(c),a
		OUTINB
		inc		de
	copper_out0:	

		ret			; 144 BYTES

	;	------------

	copper_split:
		out		(c),d						; Terminate
		out		(c),e
		ld		de,32768+0					; Line 0 + command WAIT
		nextreg	COPPER_CONTROL_LO_BYTE_REGISTER,$00 ; Index
		nextreg	COPPER_CONTROL_HI_BYTE_REGISTER,$C0 ; Vblank
		ret			; GO!!!


	copper_loop:	
		ld		hl,sample_dac
		ld		a,(sample_loop)
		and		a
		jr		z,.forever
		dec		a
		jr		nz,.loop	
		ld		(hl),0						; Copper NOP (mute sound)

	.loop:		
		ld		(sample_loop),a

	.forever:
		ld		a,(hl)						; Read DAC mute state
		ld		hl,(sample_ptr)
		ret									; GO!!!

	;	------------

	copper_done:
		ld		de,(sample_ptr)
		xor		a
		sbc		hl,de
		ld		(sample_pos),hl				; Update playback position

	play_copper_stack:
		ld		sp,0
    ;    ei 
		ret


	; --------------------------------------------------------------------------


	vga_50_config:
		db		187						; Copper line 187 (50hz)
		dw		311						; Samples per frame
		db		6						; Split
		db		7+12					; Count
		dw		copper_out7				; Routine (311-304)
		db		$1C						; Index + VBLANK
		db		$C3
		dw		32768+199				; Line 199 + command WAIT

	vga_60_config:	
		db		191						; Copper line 191 (60hz)
		dw		264						; Samples per frame
		db		3						; Split
		db		4+12					; Count
		dw		copper_out8				; Routine (261-256)
		db		$20						; Index + VBLANK
		db		$C3
		dw		32768+200				; Line 197 + command WAIT

	hdmi_50_config:	
		db		186						; Copper line 186 (50hz)
		dw		312						; Samples per frame
		db		6						; Split
		db		7+12					; Count
		dw		copper_out8				; Routine (312-304)
		db		$20						; Index + VBLANK
		db		$C3
		dw		32768+200				; Line 200 + command WAIT

	hdmi_60_config:
		db		189						; Copper line 189 (60hz)
		dw		262						; Samples per frame
		db		3						; Split
		db		4+12					; Count
		dw		copper_out6				; Routine (262-256)
		db		$18						; Index + VBLANK
		db		$C3
		dw		32768+198				; Line 198 + command WAIT


	; --------------------------------------------------------------------------


	; Variables.


	sample_ptr:		dw	0			; 32768
	sample_pos:		dw	0
	sample_len:		dw	0			; 10181
	sample_dac:		db	0			; DAC register

	sample_loop:    db	0		; 0..255
	sample_bank:    db 	0 		; 0..255 

	video_lines:	dw	0		; 312/311/262/261
	video_timing:	db	0		; 0..7

		dw	0,0,0,0,0,0,0,0		;
		dw	0,0,0,0,0,0,0,0		; Define 23 WORDS
		dw	0,0,0,0,0,0,0		;

	copper_audio_stack:
		dw	copper_done
	pop namespace

    end asm 
end sub 

copper_sample_table:
asm 
	copper_sample_table: 
    ; 
	; bank+loop , sample start, sample len
	; eg bank 56,loop 0 = $3800 
	; sample table sample * 6 
    ; 8,611 dead.pcm
    ; 4,417 jump.pcm
    ; 7,516 pickup.pcm
    ; 7,086 punch.pcm
	; dw $3801,0000,7516						; 7,516 pickup.pcm		1
	; dw $3801,0,0
    dw $3901,0,4417 ; 0jump.pcm
    dw $3901,4417,7516 ; 1pickup.pcm
    dw $3a01,11933-8192,7086 ; 3punch.pcm
    dw $3b01,2635,3238 ; 4dead.pcm
	dw $3b01,5873,11000 ; complete.pcm


end asm 
