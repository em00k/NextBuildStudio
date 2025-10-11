

dim	mouse_oldmox,mouse_mbutt as ubyte 
dim mouse_mox, mouse_moy, mouse_oldmoy, mouse_spry as ubyte 
dim mouse_sprx as uinteger


sub fastcall ProcessMouse()
	asm 
	; Jim Bagley mouse routines, clamps mouse and dampens x & y 
		ld		de,(nmousex)
		ld 		(omousex),de
		ld		a,(mouseb)
		ld 		(omouseb),a
		
		call 	getmouse
		ld 		(mouseb),a
		ld 		(nmousex),hl

		ld 		a,l
		sub 	e
		ld 		e,a
		ld 		a,h
		sub 	d
		ld 		d,a
		ld 		(dmousex),de	; delta mouse
		
		ld 		d,0
		bit 	7,e
		jr 		z,bl
		dec 	d
	bl: 
		ld 		hl,(rmousex)
		add 	hl,de
		ld 		bc,4*256
		call 	rangehl
		ld 		(rmousex),hl
		sra  	h
		rr 		l
		sra 	h
		rr 		l
		ld 		a,l
		ld 		(mousex),a
		ld 		de,(dmousey)
		ld 		d,0
		bit 	7,e
		jr 		z,bd
		dec	 	d
	bd: 
		ld 		hl,(rmousey)
		add 	hl,de
		ld 		bc,4*192+64
		call 	rangehl
		ld 		(rmousey),hl
		sra  	h
		rr 		l
		sra 	h
		rr 		l
		ld 		a,l
		ld 		(mousey),a

		ld 		a,(mouseb)
		ld 		(Mouse),a
		ld 		a,(mousex)
		ld 		(Mouse+1),a
		ld 		a,(mousey)
		ld 		(Mouse+2),a

		ret 	; exit routine 
		
	getmouse:
		ld		bc,64479
		in 		a,(c)
		ld 		l,a
		ld		bc,65503
		in 		a,(c)
		cpl
		ld 		h,a
		ld 		(nmousex),hl
		ld		bc,64223
		in 		a,(c)
		ld 		(mouseb),a
		ret

	rangehl:

		bit 	7,h
		jr 		nz,mi
		or 		a
		push 	hl
		sbc	 	hl,bc
		pop 	hl
		ret 	c
		ld		h,b
		ld 		l,c
		dec 	hl
		ret

	mi:
		ld 		hl,0
		ret

	mousex:
		db	0
	mousey:
		db	0
	omousex:
		db	0
	omousey:
		db	0
	nmousex:
		db	0
	nmousey:
		db	0
	mouseb:
		db	0
	omouseb:
		db	0
	rmousex:
		dw	0
	rmousey:
		dw	0
	dmousex:
		db	0
	dmousey:
		db	0

	mouseend:

	
	end asm 
end sub 


sub UpdatePointer(byval spr_icon as ubyte = 3 )

    mouse_oldmox=mouse_mox : mouse_oldmoy=mouse_moy
    mouse_mox=peek(@Mouse+1) :  mouse_moy=peek(@Mouse+2) :  mouse_mbutt=peek(@Mouse)
    mouse_sprx=(32+cast(uinteger,mouse_mox)) : mouse_spry=(32+mouse_moy)
	UpdateSprite(mouse_sprx,mouse_spry,0,spr_icon,0,0)

end sub 