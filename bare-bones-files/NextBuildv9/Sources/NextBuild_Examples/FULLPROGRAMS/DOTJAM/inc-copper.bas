'!origin=dotjam.bas


sub fastcall copper_wobble()

    asm:       
   ; push namespace CopperWobble 
    copper_wobble: 
        ld      a,2
        ; out     ($fe),a             ; red border 

        xor     a 
        ld      (._copper_line),a             ; l = 0     copper line 
        ld      a,(._copperb)             
        ld      (._coppere_ydelta),a             ; e = b     y delta 
        ld      (._coppere_xdelta),a             ; x = b     x delta 


        ; c = 1+(peek(add+cast(uinteger,d))>>2)

        ld      a, 2 
        ld      (._copperc),a                   ; save in copperc

        ld      b,64                             ; reset b to 0 

      cop_upload_copper_lineoopa:

        nextreg COPPER_DATA_NR_60,128           ; wait %1000 0000
        ld      a,(._copper_line)               ; set copper line position 0 
        nextreg COPPER_DATA_NR_60,a             ; line 

        ; i = peek(add+cast(uinteger,x))

        ld      hl,Scroller.sintable                      ; point to sine table 
        ld      a,(._coppere_xdelta)            ; get copper x delta 
        add     hl,a                            ; add to sine address 
        ld      a,(hl)                          ; get byte 
        ld      (._copperi),a                   ; store in copperi

        ; write x offset 
        nextreg COPPER_DATA_NR_60,TILEMAP_XOFFSET_LSB_NR_30
        ld      a,(._copperi) 
        nextreg COPPER_DATA_NR_60,a
        ; j = peek(add+cast(uinteger,e))

        ld      hl,sintable3                  ; point to sine table 
        ld      a,(._coppere_ydelta)        ; get the y delta 
        add     hl,a                        ; add to sine address
        ld      a,(hl)                      ; get the byte 
        ld      (._copperj),a               ; save in copper_j

        ; write y offset 
        nextreg COPPER_DATA_NR_60,ULA_YOFFSET_NR_27
        sll     a 
        srl     a 
        sub      210
      
        nextreg COPPER_DATA_NR_60,a

        nextreg COPPER_DATA_NR_60, PALETTE_CONTROL_NR_43
        nextreg COPPER_DATA_NR_60,%00110000

        nextreg COPPER_DATA_NR_60, PALETTE_INDEX_NR_40
        nextreg COPPER_DATA_NR_60,2

        nextreg COPPER_DATA_NR_60,PALETTE_VALUE_NR_41
        ld      hl,sintable3
        ld      a,(._coppere_ydelta) 
        add     hl, a 
        ld      a, (hl)
        sll     a 
        sll     a 
        and     %00011100
        nextreg COPPER_DATA_NR_60,a
        ; inc variables 

        ld      hl,._coppere_ydelta              ; e = e + 1     increase y delta 
        inc     (hl) 
        ld      hl,._copper_line              ; l = l + 1     increase coppper line
        inc     (hl) 
        ld      hl,._coppere_xdelta              ; x = x + 1     increase x delta 
        inc     (hl) 
        ; inc     (hl) 

        djnz    cop_upload_copper_lineoopa     ; repeat for all copper line s


        nextreg COPPER_DATA_NR_60, PALETTE_CONTROL_NR_43
        nextreg COPPER_DATA_NR_60,%00010000

        nextreg COPPER_DATA_NR_60, PALETTE_INDEX_NR_40
        nextreg COPPER_DATA_NR_60,1

        ld      b, 16
        ld      hl, cycle_palette              ; point to cycle table 
1:        
        
        ld      a, (hl)
        nextreg COPPER_DATA_NR_60, PALETTE_VALUE_NR_41
        ;add     a,a
        add     a,a
        ld      e, a  
        mirror 
        xor e 
        ; bsrl de,b
        and %11100100
        ;and e 
        nextreg COPPER_DATA_NR_60,a 
        inc     hl
        djnz    1B



        ; bottome half of screen
        ld      b,64                          ; 64 lines 
        ld      a,192
        ld      (._copper_line),a        

    cop_upload_copper_lineoopb:

        nextreg COPPER_DATA_NR_60,128           ; wait %1000 0000
        ld      a,(._copper_line)               ; set copper line position 0 
        nextreg COPPER_DATA_NR_60,a             ; line 

        ; i = peek(add+cast(uinteger,x))

        ld      hl,Scroller.sintable                      ; point to sine table 
        ld      a,(._coppere_xdelta)            ; get copper x delta 
        add     hl,a                            ; add to sine address 
        ld      a,(hl)                          ; get byte 
        ld      (._copperi),a                   ; store in copperi

        ; write x offset 
        nextreg COPPER_DATA_NR_60,TILEMAP_XOFFSET_LSB_NR_30
        ld      a,(._copperi) 
        nextreg COPPER_DATA_NR_60,a
        ; j = peek(add+cast(uinteger,e))

        ld      hl,sintable3                  ; point to sine table 
        ld      a,(._coppere_ydelta)        ; get the y delta 
        add     hl,a                        ; add to sine address
        ld      a,(hl)                      ; get the byte 
        ld      (._copperj),a               ; save in copper_j

        nextreg COPPER_DATA_NR_60, PALETTE_CONTROL_NR_43
        nextreg COPPER_DATA_NR_60,%00110000

        nextreg COPPER_DATA_NR_60, PALETTE_INDEX_NR_40
        nextreg COPPER_DATA_NR_60,2

        nextreg COPPER_DATA_NR_60,PALETTE_VALUE_NR_41
        ld      hl,sintable3
        ld      a,(._coppere_ydelta) 
        add     hl, a 
        ld      a, (hl)
        sll     a 
        sll     a 
        and     %00011100
        nextreg COPPER_DATA_NR_60,a
        ; inc variables 

        ld      hl,._coppere_ydelta              ; e = e + 1     increase y delta 
        inc     (hl) 
        ld      hl,._copper_line              ; l = l + 1     increase coppper line
        inc     (hl) 
        ld      hl,._coppere_xdelta              ; x = x + 1     increase x delta 
        inc     (hl) 
        ; inc     (hl) 

        djnz    cop_upload_copper_lineoopb     ; repeat for all copper line s


        nextreg COPPER_DATA_NR_60,%10000001                ; 96, 98    01 100010 cc 000iii
        nextreg COPPER_DATA_NR_60,242               ; 96, 64    01 000000 
        nextreg COPPER_CONTROL_LO_NR_61,0
        nextreg COPPER_CONTROL_HI_NR_62,%11000000

        ld      hl,._coppere_ydelta              ; e = e + 1     increase y delta 
        inc     (hl) 

        ld      hl,._copperd              ; d = d + 1    
        ; inc     (hl) 

        ld      hl,._copperc              ; b = b + c
        ld      a,(._copperb)
        add     a,(hl)
        ld      (._copperb),a 

        ;xor     a                   ; border 0 
        ;out     ($fe),a 

        ;call    wait_raster_copper_lineine 

        ;jp      copper_wobble       ; repeat 


       wait_raster_copper_lineine:

     ;  ld      a,VIDEO_LINE_LSB_NR_1F
     ;  ld      bc,TBBLUE_REGISTER_SELECT_P_243B
     ;  out     (c),a 
     ;  inc     b   
     ;  in      a,(c)
     ;  cp      192                 ; wait for line 250
     ;  jr      z,wait_raster_copper_lineine
     ;  ret 
      ; pop namespace
    end asm 
end sub 

sintable3:
     asm 
     sintable3:
     ; 
     db 1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3
     db 3,4,4,4,4,5,5,5,6,6,6,6,7,7,7,8
     db 8,8,9,9,9,9,10,10,10,11,11,12,12,12,13,13
     db 13,14,14,14,15,15,15,16,16,16,17,17,17,18,18,18
     db 19,19,20,20,20,21,21,21,21,22,22,22,23,23,23,24
     db 24,24,24,25,25,25,26,26,26,26,27,27,27,27,27,28
     db 28,28,28,28,29,29,29,29,29,29,29,30,30,30,30,30
     db 30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30
     db 30,30,30,30,30,30,30,30,30,30,30,29,29,29,29,29
     db 29,28,28,28,28,28,27,27,27,27,27,26,26,26,26,25
     db 25,25,25,24,24,24,23,23,23,23,22,22,22,21,21,21
     db 20,20,20,19,19,19,18,18,18,17,17,16,16,16,15,15
     db 15,14,14,14,13,13,13,12,12,12,11,11,11,10,10,10
     db 9,9,9,8,8,8,7,7,7,6,6,6,6,5,5,5
     db 5,4,4,4,4,3,3,3,3,2,2,2,2,2,1,1
     db 1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0
     db 1,1,1,1,1,1,1,2,2,2,2,2,3,3,3,3
     db 3,4,4,4,4,5,5,5,6,6,6,6,7,7,7,8
     db 8,8,9,9,9,9,10,10,10,11,11,12,12,12,13,13
     db 13,14,14,14,15,15,15,16,16,16,17,17,17,18,18,18
     db 19,19,20,20,20,21,21,21,21,22,22,22,23,23,23,24
     db 24,24,24,25,25,25,26,26,26,26,27,27,27,27,27,28
     db 28,28,28,28,29,29,29,29,29,29,29,30,30,30,30,30
     db 30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30
     db 30,30,30,30,30,30,30,30,30,30,30,29,29,29,29,29
     db 29,28,28,28,28,28,27,27,27,27,27,26,26,26,26,25
     db 25,25,25,24,24,24,23,23,23,23,22,22,22,21,21,21
     db 20,20,20,19,19,19,18,18,18,17,17,16,16,16,15,15
     db 15,14,14,14,13,13,13,12,12,12,11,11,11,10,10,10
     db 9,9,9,8,8,8,7,7,7,6,6,6,6,5,5,5
     db 5,4,4,4,4,3,3,3,3,2,2,2,2,2,1,1
     db 1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0

end asm 

asm 
cycle_palette: 
    db 224,192,160,128,96,64,32,129
    db 32, 64, 96, 128, 160, 192, 224, 224
end asm 

copper_wobble()

dim     coppere_xdelta,copperi,copperb,copper_line,copperc,copperd,coppere_ydelta,copperj as ubyte 

border  coppere_xdelta+copperi+copperb+copper_line+copperc+copperd+coppere_ydelta+copperj