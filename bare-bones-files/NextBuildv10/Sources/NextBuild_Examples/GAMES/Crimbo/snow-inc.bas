''!origin=Crimbo.bas
' NextBuildStudio Application Template
' Generated on 01/01/2026
' '!org=$8000

' #define IM2

'  #define NEX
#include <nextlib.bas>
' ' #include <print42.bas>

' ' load a system font
' LoadSDBank("[]font5.fnt",0,0,0,32)


' Variables go here
dim     snow_x as ubyte = 0
dim     snow_y as ubyte = 0
dim     snow_s as ubyte = 0
dim     snow_v as ubyte = 0
dim     snowtick as ubyte = 4
dim     drift   as ubyte = 7
dim     flake_colour as ubyte = 255
' dim flakes(3,64) as ubyte 

const snowaddress     as uinteger = $e000
const SNOW_BANK       as ubyte = 63 
declare function rand() as ubyte  

' ' Initialise here
' MainInit()

' init_snow()

' ' ' Main loop
' do

' '     ' Wait for raster line 192
'      WaitRaster(01)
'      border 2
'      update_snow()
'      border 0
' loop

' '----------------------------------------------------------
' ' Subroutines go here

' sub MainInit()

'     asm 
'         di 
'     end asm 
'     ' Lets set up L2
'     InitLayer2(MODE256X192)
'     '
'     ClearLayer2(0)
'     '
'     ShowLayer2(1)
'     ' set USL order
'     NextReg(SPRITE_CONTROL_NR_15,%000_100_00)

'     L2Text(10,10,"HELLO",32,255)
' end sub

sub init_snow()

    dim c as ubyte 

    ' use bank 31 for star array 
    NextRegA(MMU7_E000_NR_57,SNOW_BANK)

    for c = 0 to 191 step 4

        ' snow_x 
        poke snowaddress+cast(uinteger,c), rand()
        ' snow_y
        poke snowaddress+cast(uinteger,c+1), rand()
        ' speed 
        poke snowaddress+cast(uinteger,c+2), 1+ rand() mod 3' int (rnd*2)
        ' visible
        poke snowaddress+cast(uinteger,c+3), 0

    next c 

    NextReg(MMU7_E000_NR_57,01)        ' restore ROM 

end sub 

sub update_snow()

    dim c as ubyte
    dim old_x as ubyte  ' Store old position before drift


    if snowtick = 0

        ' use bank 31 for star array

        NextRegA(MMU7_E000_NR_57,SNOW_BANK)

        for c = 0 to 191 step 4

            ' speed
            snow_s = peek(snowaddress+cast(uinteger,c+2))

            snow_v = peek(snowaddress+cast(uinteger,c+3))

            snow_x = peek(snowaddress+cast(uinteger,c))
            old_x = snow_x  ' Save original position

            ' snow_y
            snow_y = peek(snowaddress+cast(uinteger,c+1))

            ' undraw old snow flake at OLD position before drift
            if snow_y < 191 and snow_v = 1 
                PlotL2(snow_x,snow_y,0)
            endif

            if (c band 7) < drift  ' This gives varying drift based on position
                snow_x = snow_x + ((snow_s) >> 1 )
            endif

            ' if drift > 3
            '     snow_x = snow_x + 1
            ' elseif drift < 3
            '     snow_x = snow_x - 1
            ' endif

            poke snowaddress+cast(uinteger,c), snow_x


            snow_y = snow_y + snow_s

            if snow_y > 191
                poke snowaddress+cast(uinteger,c), rand()
                snow_y = 0
            endif

            if snow_y >0
                if PointL2(snow_x,snow_y)=0
                '    Plot snow_x,snow_y
                    PlotL2(snow_x,snow_y,flake_colour)                   ' do a flake
                    poke snowaddress+cast(uinteger,c+3), 1      ' visible flag 
                                            
                    if flake_colour < 255
                        flake_colour = flake_colour + 1
                    else 
                        flake_colour = 253
                    endif 

                elseif snow_y<191
                   'snow_y = 192         ' force end of flake
                   poke snowaddress+cast(uinteger,c+3), 0       ' make snowflake invisible
                else 
                    snow_y = 0        ' endflake 
                endif
            endif 

            poke snowaddress+cast(uinteger,c+1), snow_y

        next c 

       NextReg(MMU7_E000_NR_57,$01)        ' restore ROM 

        snowtick = 4

        if drift = 0 
            drift = 7 
        else 
            drift = drift - 1 
        endif 

    else 
        snowtick = snowtick - 1
    endif 

end sub 


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