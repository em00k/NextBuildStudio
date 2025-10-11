'!ORIGIN=Sources\GRAPHICS\Plot2.bas

' LAYER 2 Routines - largely unfinished but WIP
' emk 2025-04-25

#ifndef __LIBRARY_LAYER2__

#define __LIBRARY_LAYER2__

#pragma push(case_insensitive)
#pragma case_insensitive = TRUE
#pragma zxnext = TRUE
 
#define MODE256X192 $0 
#define MODE320X256 $1 
#define MODE640X256 $2
#define MODE256x192 $0 
#define MODE320x256 $1 
#define MODE640x256 $2

#DEFINE L2_INIT InitLayer2

#ifndef  __SHOWLAYER2
    #DEFINE __SHOWLAYER2
#endif 

sub fastcall InitLayer2(byval mode as ubyte)
    ' sets up layer 2 to the correct mode 
    ' mode = 0 for 256x192 bits 5-4 = %00 ' 256x192x8bpp 
    ' mode = 1 for 320x256 bits 5-4 = %01 ' 320x256x8bpp
    ' mode = 2 for 640x256 bits 5-4 = %10 ' 640x256x4bpp
    ' this will always clear the colour to 0 // normally black 
    ' Now prepare some base registers 

    asm 
        PROC 
        LOCAL mode0, mode1, mode2
        ;BREAK 
        ; first set registers to defaults 
        nextreg DISPLAY_CONTROL_NR_69,  %00000000       ; Disable display 
        ; nextreg ULA_CONTROL_NR_68,      %10000000       ; Disable ULA 
        nextreg SPRITE_CONTROL_NR_15,   %000_001_00     ; sprites OFF under border, SUL Order
        nextreg GLOBAL_TRANSPARENCY_NR_14,0             ; // 0 = trans black 
        nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0       ; // 0 = trans black 
        nextreg PALETTE_CONTROL_NR_43,  %00000001       ; // bit 0 ULANext Mode, Selects L2 Palette 0  
        nextreg PALETTE_VALUE_NR_41,    0               ; // 0 = trans black ?? Might not want this 
        nextreg TURBO_CONTROL_NR_07,    3               ; // 3 = 28mhz // why any other mode? 
        ; set clip registers 
        nextreg CLIP_LAYER2_NR_18,      %00000000       ; // 0      = no clip X1
        nextreg CLIP_LAYER2_NR_18,      %11111111       ; // 255    = no clip X2
        nextreg CLIP_LAYER2_NR_18,      %00000000       ; // 0      = no clip Y1
        nextreg CLIP_LAYER2_NR_18,      %11111111       ; // 255    = no clip Y2

        ; now set the mode 
        ld      c, a 
        and     %11                     ; mask off the top 2 bits  xxxxxx00   
        swapnib                         ; swap nibbles xxxxxx00 > xx00xxxx
        ; now set the mode                              
        nextreg LAYER2_CONTROL_NR_70,a                              
        ; prepare colour                                
        ld      a, c                                
        ld      (._screen_mode),a       ; store the mode 
        ld      c,0                     ; black 
        ; now set the mode 
    _pick_screenmode:
        
        and     %11                     ; only 2 bits are used 
        or      a 
        jr      z,mode0                 ; 00 = 256x192 
        dec     a 
        jr      z,mode1                 ; 01 = 320x256 
        dec     a 
        jr      z,mode2                 ; 10 = 640x256 
        ret 
        
    mode0:

        ld      b, 6                    ; 6 x 8kb banks (256x192 x 8bpp = 49152)
        jr      mode_common
    mode1:

        ld      b, 10                   ; 10 x 8kb banks (320x256 x 8bpp = 81920 bytes)
        jr      mode_common
    mode2: 

        ld      b, 10                   ; 10 x 8kb banks (640x256 x 4bpp = 81920 bytes)
        ; as we are using 4bpp, we need to duplicate the colour into the high nibble 
        ld      a, c                    ; get colour 0-15 
        swapnib                         ; swap nibbles 00001234 > 00001234 
        or      c                       ; or in the low nibble 12341234 
        ld      c, a                    ; store the result 
;        jr      mode_common
    mode_common:
        push    bc                      ; push bc to stack containing colour and bank count 
        getreg($12)                     ; Get base L2 bank setting, flattens BC ! 
        add     a, a                    ; 16kb bank returned by NR$12, a now correct start bank 

        jp      .__clear_banks

        ENDP 
    end asm 
    
    _clear_banks()                      ' clear the banks 

end sub     

#ifndef __SHOWLAYER2
sub fastcall ShowLayer2(byval switch as ubyte)
    ' 0 to disable layer 2 
    ' 1 to enable layer 2 
    asm 
        PROC 
        LOCAL disable 
        ld      (_nb_layer2_enabled_), a
        or      a
        jr      z,disable
        nextreg DISPLAY_CONTROL_NR_69,%10000000
        ret
    disable:
        nextreg DISPLAY_CONTROL_NR_69,0
        ld      (_nb_layer2_enabled_), a
        ENDP 
    end asm 
    
end sub 
#endif 

' These DEFINES replace the old CLS256, CLS320, CLS640 routines 
' They are faster and more efficient, and use the new ClearLayer2 routine   

#DEFINE CLS256 ClearLayer2
#DEFINE Cls256 ClearLayer2
#DEFINE cls256 ClearLayer2
#DEFINE CLS320 ClearLayer2
#DEFINE CLS640 ClearLayer2

sub fastcall ClearLayer2( byval colour as ubyte )
    ' Clears layer 2 to colour
    asm 
        ; on entry a = colour 
        ; b will be set in _pick_screenmode
        ; Destroys : bc, de, hl  
        ld      c, a                        ; colour 
        ld      a, (_screen_mode)           ; fetch the screen mode 
        jp      _pick_screenmode
    end asm 
    InitLayer2(MODE256X192)
end sub 

Sub fastcall _clear_banks()
    ' common routine to clear banks 
    ASM 
        ; a = start bank
        ; bc on stack contains colour and bank count 
        ; OUT : a = end bank
        ; Destroys : bc, de, hl 
        #ifndef IM2 
            call _checkints         ; check if interrupts are enabled 
            di                      ; were doing a big RAM clear at 0
        #endif 
        
        nextreg $50, a              ; set slot 0000 to bank a 
        inc     a                   ; bank + 1
        pop     bc                  ; colour, b = number of banks to clear                                     
    .bank:
        push    bc 
        ld      hl, 0 
        ld      de, 1 
        ld      (hl), c 
        ld      bc, 8191
        ldir 

        nextreg $50, a 
        inc     a 

        pop     bc 
        djnz    .bank 

        nextreg $50,$ff             ; restore slot 0
        
        #ifndef IM2 
            ReenableInts
        #endif 
        ret 

    end asm 

end sub 


sub SetRGB(byval index_c as ubyte, byval red_c as ubyte, byval green_c as ubyte,byval blue_c as ubyte)

    asm 
        ;  A: Colour to change (0 - 255)
        ;  B: R colour (3 bits)
        ;  C: G colour (3 bits)
        ;  D: B colour (3 bits)
        ;  Original code by Dean Bellfield - https://github.com/breakintoprogram/next-bbc-basic/blob/348302430032b08e65c1014d7eb17bad6361c6b8/next_graphics.z80#L375
        
    set_palette_rgb:    
        ld  a, (ix + 5)                     ; 19 t
        ld  b, (ix + 7)                     ; 19 t
        ld  c, (ix + 9)                     ; 19 t
        ld  d, (ix + 11)                    ; 19 t

        nextreg PALETTE_INDEX_NR_40, a      ; select the colour to change


        ld  a, b                            ; get red component
        and %00000111                       ; %00000rrr
        swapnib                             ; %0rrr0000
        add a, a                            ; %rrr00000
        ld  b, a                            ; store in b
        ld  a, c                            ; get green component
        and %00000111                       ; %00000ggg
        add a, a                            ; %0000ggg0
        add a, a                            ; %000ggg00
        or  b                               ; %rrrggg00
        ld  b, a                            ; store in b
        ld  a, d                            ; get blue component
        and %00000110                       ; %00000bb0
        rra                                 ; %000000bb
        or  b                               ; %rrrgggbb
        ld  b, a
        nextreg PALETTE_VALUE_9BIT_NR_44,a  ; write out first 8 bits
        ld  a, d                            ; get blue component
        and %00000001                       ; get 9th bit
        ld  c, a
        nextreg PALETTE_VALUE_9BIT_NR_44,a  ; write out final bit 
    end asm  

end sub 

' sub QPlot(X as UINTEGER, Y as ubyte, C as ubyte)
'     asm 
'         ; IX+4 is first two bytes XX
'         ; IX+6 is next two ..
'         ld      d, (ix+5)
'         ld      e, (ix+4)   ; XX 
'         ld      h, (ix+7)   ; Y 
'         ld      l, (ix+9)   ; colour
'         call    plot_pixel
        
'     end asm 

' end sub 

asm 


    #ifdef __NEW_PLOT__
    layer2_plot:

        ld      a, (_screen_mode)           ; fetch the screen mode 
        and     %11                         ; only 2 bits are used
        add     a, a                        ; multiply by 2 for word offset
        ld      hl, jump_table             ; load jump table address
        add     hl, a 
        ld      a,(hl)                      ; Get low byte
        inc     hl
        ld      h,(hl)                      ; Get high byte
        ld      l,a                         ; HL = plot function address
    #endif 

    jp  __NEW_PLOT_END_

    ; #include <nb_PLOT.asm>
    ; #include <nb_LINE2.asm>

    __NEW_PLOT_END_:        
end asm 



' Layer 2 Properties
asm 
_nb_layer2_enabled_:
    db      0 
end asm 
asm 
_screen_mode:
        db      0
end asm 

#pragma pop(case_insensitive)

#endif 