'!org=32768
' NextBuild Layer2 Template 

#define NEX 
#define IM2 

#include <nextlib.bas>
#include  "sprite_dma.bas"

asm 
    ; setting registers in an asm block means you can use the global equs for register names 
    ; 28mhz, black transparency,sprites on over border,320x256
    nextreg TURBO_CONTROL_NR_07,%11         ; 28 mhz 
    nextreg GLOBAL_TRANSPARENCY_NR_14,$0    ; black 
    nextreg SPRITE_TRANSPARENCY_I_NR_4B,14
    nextreg SPRITE_CONTROL_NR_15,%00000011  ; %000    S L U, %11 sprites on over border
    nextreg LAYER2_CONTROL_NR_70,%00000000  ;  
end asm 

' load data into NEX 

LoadSDBank("frames.nxb",0,0,0,40)           ' block information 
LoadSDBank("frames.nxp",0,0,0,41)           ' load the palette
LoadSDBank("frames.nxt",0,0,0,42)           ' 42-44

' set sprite palette 

NextReg(PALETTE_CONTROL_NR_43, %00100000)
PalUpload(0,0,0,41)                         ' upload palette 

' init
big_sprite()
SetupDma($dead,256)
DMASprite(5)

' 
dim     timer1      as ubyte 
dim     frame       as ubyte = 4
dim     frame1      as ubyte = 3
dim     frame2      as ubyte = 4
dim     frame3      as ubyte = 7
dim     frame4      as ubyte = 10
dim     xpos        as uinteger

do 

    WaitRaster(192)
    border 0
    if timer1 = 0 
        timer1 = 8
        frame = ( frame + 1 ) band 15 
        frame1 = ( frame1 + 1 ) band 15 
        frame2 = ( frame2 + 1 ) band 15 
        frame3 = ( frame3 + 1 ) band 15 
        frame4 = ( frame4 + 1 ) band 15 

        MetaSprite(frame,   0   ,40,42,12)
        'Console("MetaSprite0") :         WaitKey()  
        MetaSprite(frame1,  12  ,40,42,12)
        'Console("MetaSprite1") :         WaitKey()  
        MetaSprite(frame2,  24  ,40,42,12)
        'Console("MetaSprite2") :         WaitKey()  
        MetaSprite(frame3,  36  ,40,42,12)
        'Console("MetaSprite3") :         WaitKey()  
        MetaSprite(frame4,  48  ,40,42,12)
        'Console("MetaSprite4") :         WaitKey()  

        xpos = xpos + 2 
        if xpos = 512
            xpos = 0
        endif 
        ' print at 0,0;frame  
        ' print at 1,0;frame1  
        ' print at 2,0;frame2  
        ' print at 3,0;frame3
      
        UpdateSprite(xpos       ,32 ,0  ,0,0,sprBigsprite)  
        'Console("Sprite 0") :         WaitKey()  
        UpdateSprite(500+xpos   ,64 ,12 ,12,0,sprBigsprite)    
        'Console("Sprite 1") :         WaitKey()  
        UpdateSprite(32+xpos    ,96 ,24 ,24,0,sprBigsprite)    
        'Console("Sprite 2") :         WaitKey()  
        UpdateSprite(128+xpos   ,102,36 ,36,0,sprBigsprite)    
        'Console("Sprite 3") :         WaitKey()  
        UpdateSprite(16+xpos    ,128,48 ,48,0,sprBigsprite)    
        'Console("Sprite 4") :         WaitKey()  
        
        
    else 
        timer1 = timer1 - 1 
    endif 
    border 0 
    
loop 


sub big_sprite()

    ' before use we must initiate the sprite definitions, such as what is a big sprite
    ' and the sprites co-ordinates relative to the base sprite 
    ' this for example shows big sprite comprised of 2 16x16 sprites, the first has the property
    ' of bigsprite, its co-ords and sprite id along with intial image, then the second that is
    ' realtive to the first but 16 pixels below and the sprite id with relative properties. 
    '             X     Y       ID    Image     Att3    Att4

    for b = 0 to 12*4 step 12  

        UpdateSprite( 32,   32,     b+0,    b+0,        0,      sprBigsprite )   ' *x*
        UpdateSprite( 16,   0,      b+1,    b+1,        0,      sprRelative )   
        UpdateSprite( 0,    16,     b+2,    b+2,        0,      sprRelative )   
        UpdateSprite( 16,   16,     b+3,    b+3,        0,      sprRelative )   
        UpdateSprite( 0,    32,     b+4,    b+4,        0,      sprRelative )   
        UpdateSprite( 16,   32,     b+5,    b+5,        0,      sprRelative )   
        UpdateSprite( 0,    48,     b+6,    b+6,        0,      sprRelative )   
        UpdateSprite( 16,   48,     b+7,    b+7,        0,      sprRelative )   
        UpdateSprite( 0,    64,     b+8,    b+8,        0,      sprRelative )   
        UpdateSprite( 16,   64,     b+9,    b+9,        0,      sprRelative )   
        UpdateSprite( 0,    80,     b+10,   b+10,        0,      sprRelative )  
        UpdateSprite( 16,   80,     b+11,   b+11,        0,      sprRelative )  
    
    next 

end sub 



