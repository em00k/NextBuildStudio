''!origin=Crimbo.bas

sub fastcall SetupTileHW(tilemap as ubyte, tiledata as ubyte)
	' note that input arguments are overridden in the actual code below.v
    
    asm     
        nextreg CLIP_TILEMAP_NR_1B,0
        nextreg CLIP_TILEMAP_NR_1B,1
        nextreg CLIP_TILEMAP_NR_1B,0
        nextreg CLIP_TILEMAP_NR_1B,1
        exx : pop hl : exx : push af 
        
        pop af 
        nextreg TILEMAP_BASE_ADR_NR_6E,a				    ; tilemap data
        pop af 
        nextreg TILEMAP_GFX_ADR_NR_6F,a			            ; tilemap images 4 bit 
        
        nextreg PALETTE_CONTROL_NR_43,%00110000             ; NextReg($43,%00110000)	' Tilemap first palette
                      ; page in palette bank 
        ; find offset in bank depending on level 

        ld hl,1000                                         ; upload palette for tilemap
        ld b,$20                                             ; upload 16 colours

        nextreg PALETTE_INDEX_NR_40,0

    _tmuploadloop:
            ld a,(hl) : nextreg PALETTE_VALUE_9BIT_NR_44,a
            inc hl 
            ld a,(hl) :
            inc hl 
            nextreg PALETTE_VALUE_9BIT_NR_44,a
        djnz _tmuploadloop

        ld      a, $f
        nextreg PALETTE_INDEX_NR_40,a 
        nextreg PALETTE_VALUE_9BIT_NR_44,$ff
        nextreg PALETTE_VALUE_9BIT_NR_44,$01                ; white 

        ; ' tilemap 40x32 no attribute 256 mode 
        nextreg TILEMAP_DEFAULT_ATTR_NR_6C,%00000000		; Default Tilemap Attribute on & on top of ULA,  80x32 

        nextreg ULA_CONTROL_NR_68,%1_01_00000				    ; ULA CONTROL REGISTER
        nextreg GLOBAL_TRANSPARENCY_NR_14,0  				; Global transparency bits 7-0 = Transparency color value (0xE3 after a reset)
        nextreg SPRITE_TRANSPARENCY_I_NR_4B,0
        ; hack to fix the palette of level 2 the freezer. 
        ; that needs reg 4c set to $f and not $0 like other levels. 
        ld      a, (._level)
        cp      2
        jr      nz, tpf1
        ld      a, $f
        jr      tpf2
    tpf1:
        ld      a, $0 
    tpf2:

    nextreg TILEMAP_TRANSPARENCY_I_NR_4C,a     		; Transparency index for the tilemap
		ld hl,1512                                          ; copy the tile image data from bank 30 into place
		ld de,$4000
		ld bc,2816 										    ; size of tiles
		ldir 
        
        ; +40 to skip top line 
		ld hl,40                                            ; copy map to tilemap data
		ld de,$4B00+40                                     
		ld bc,1000-40
        ldir 
        
        exx : push hl : exx 
    end asm 

    ClipTile(0,255,0,255)				

end sub 
