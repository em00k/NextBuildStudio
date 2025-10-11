'!org=25088
'asm
' NextBuild Layer2 Template 

#define NEX 
#define IM2 

#include <nextlib.bas>

asm 
    ; setting registers in an asm block means you can use the global equs for register names 
    ; 28mhz, black transparency,sprites on over border,320x256
    nextreg TURBO_CONTROL_NR_07,%11         ; 28 mhz 
    nextreg GLOBAL_TRANSPARENCY_NR_14,$0    ; black 
    nextreg CLIP_TILEMAP_NR_1B,0                        ; Tilemap clipping 
    nextreg CLIP_TILEMAP_NR_1B,159
    nextreg CLIP_TILEMAP_NR_1B,0
    nextreg CLIP_TILEMAP_NR_1B,255
    NextReg TILEMAP_DEFAULT_ATTR_NR_6C,%00000000        ; tilemap on & on top of ULA,  80x32 
    NextReg TILEMAP_CONTROL_NR_6B,%11001001				; tilemap on & on top of ULA,  80x32 
    NextReg TILEMAP_BASE_ADR_NR_6E,$44				    ; tilemap data $6000
    NextReg TILEMAP_GFX_ADR_NR_6F,$40				    ; tilemap blocks 4 bit tiles $4000
    NextReg PALETTE_CONTROL_NR_43,%00110000
end asm 

zx7Unpack(@palettezx7,$4000)                                    ' 'LoadSD("out.pal",$7000,512,0)
for x = 0 to 511 step 2
	NextRegA($40,x/2)                                           ' reset pal index
	v=peek(ubyte, $4000+x)
	NextRegA($44,v)			                                    ' read first pal byte
	v=peek(ubyte, $4000+x+1)
	NextRegA($44,v)		
next 

zx7Unpack(@fontzx7,$4000)                                       ' 'LoadSD("font.bin",$4000,4096,0) '; font 
ClearTilemap() 

for y = 0 to 23 
    TextBlock(0,y,"TEST",y)
next 


do 
    pause 0 
loop 


sub TextBlock(txx as ubyte, tyy as ubyte,helptextin$,col as ubyte)
	xx=txx : yy= tyy 
	if len helptextin$>0
	for x=0 to (len helptextin$)-1
		char=code helptextin$(x)	
		UpdateMap(xx,yy,char,col)
		xx=xx+1 : if xx = 80 : yy = yy + 1 : xx = 0 : endif 
	next 
	endif 
end sub 

sub ClearTilemap()
	asm 
		ld hl,$4400
		ld de,$4401
		ld bc,2560*2
		ld (hl),0
		ldir 
	end asm 
end sub 

sub fastcall UpdateMap(ux as ubyte, uy as ubyte, uv as ubyte, ucol as ubyte)
	asm 
		 
		exx : pop hl : exx 

		ld      hl,$4400                ; tm start address 
        add     a,a                     ; add x * 2 because map is (char,attrib) x 80 
        add     hl, a	
		pop     de                      ; get the X in e 
        ld      a,e
        ld      e,160
        mul     d,e 		            ; mul 160 because map is 2 x 80 

		add     hl,de 
        pop     af						; get char to print 
		
        ld      (hl),a 
        inc     hl                      ; move along 
        pop     af			            ; get colour 
		
        and     %01111111
		rlca
		ld      (hl),a                  ; write the attrib 

outme:
		exx : push hl : exx 
		end asm 	
end sub   

fontzx7:
asm 
	incbin ".\data\topan.fnt.zx7"
	defs 6,0
end asm 

palettezx7:
asm 
	incbin ".\data\mm.pal.zx7"
	defs 6,0
end asm   