' Rotate, Mirror, Scaling, Big Sprites example
' NextBuild (ZXB/CSpect)
' emk2021 / David Sapbier

#include <nextlib.bas>                      ' include the nextlib 
#include <hex.bas>

paper 0: border 0 : bright 0: ink 7 : cls   ' paint it black 

dim frame,mx,my,y,count,f as ubyte          ' define some variables 
dim sx,sy as UINTEGER
dim x as uinteger                           ' x can be 0 - 319 so needs to be an integer 

' for this example we will just include the sprite in a data block call Sprite. 
' We can then use InitSprite(number of sprites to upload to sprite ram,address)
' using @Sprites will return the addres of the Sprites: asm block below. 


InitSprites(3,@Sprites)                 ' upload 3 sprites     

NextReg($15,%00001001)  	            ' SPRITE_CONTROL_NR_15 - Enable sprite visibility & Sprite ULA L2 order 

ShowLayer2(1)                           ' Turn on Layer 2 

cls : print "Sprite scaling, mirror & rotate" : print "composite and big sprite example"
print "Press any key to start"

WaitKey() : WaitRetrace2(100) : cls 

do 


    ' clear all sprites 
    for x = 0 to 63 : RemoveSprite(x,0) : next 

    UpdateSprite(90,90,0,0,0,0)		    ' x,y,sprite id, sprite image, attribute 3, attribute 4
                                            ' 128,128 is the top left corner, 0,0 is under the border 
                                            ' and requires bit 1 of NR_15 set to be placed on top. 

    DispM("Display with no scale/rot/mir"+chr($0d)+"x=90,y=90",1)

    ' -- Scaling / Rotate / Mirror 

    ' There are a few ways to set both scale and rotate / mirror. 
    ' Method 1 : Directly using the UpdateSprite command is setting
    ' attrib 3/4  

    CONST plane1 as ubyte = 0  
    CONST plane2 as ubyte = 1
    CONST plane3 as ubyte = 2

    CONST sprX2 as ubyte =%01000                 ' constants for attrib 4 of base sprite 
    CONST sprX4 as ubyte =%10000  
    CONST sprX8 as ubyte =%11000
    CONST sprY2 as ubyte =%00010
    CONST sprY4 as ubyte =%00100
    CONST sprY8 as ubyte =%00110
    CONST sprXmirror as ubyte = %1000					' these constants required for sprite mirror + rotate
    CONST sprYmirror as ubyte = %0100
    CONST sprRotate  as ubyte = %0010

    dim attrib3, baseframe, planea, planeb, scaletimer as ubyte 

    attrib3 = 0 : x = 90 : y = 90

    UpdateSprite(x,y,0,plane1,attrib3,sprX2)
    DispM("X2 attrib4 = %01000",0)
    UpdateSprite(x,y,0,plane1,attrib3,sprX4)
    DispM("X4 attrib4 = %10000",0)
    UpdateSprite(x,y,0,plane1,attrib3,sprX8)
    DispM("X8 attrib4 = %11000",1)

    DispM("These can also be combined.",0)

    UpdateSprite(x,y,0,plane1,attrib3,sprX2 BOR sprY2)
    DispM("X2 + Y2 sprX2 OR sprY2",0)

    UpdateSprite(x,y,0,plane1,attrib3,sprX2 BOR sprY4)
    DispM("X2 + Y4 sprX2 OR sprY4",0)
    
    UpdateSprite(x,y,0,plane1,attrib3,sprX4 BOR sprY4)
    DispM("X4 + Y4 sprX4 OR sprY4",0)
    
    UpdateSprite(x,y,0,plane1,attrib3,sprX4 BOR sprY8)
    DispM("X4 + Y8 sprX4 OR sprY8",1)
    
    UpdateSprite(x,y,0,plane1,attrib3,sprX8 BOR sprY8)
    DispM("X8 + Y8 sprX8 OR sprY8",1)

    '-- now mirror & rotate with scale 

    UpdateSprite(x,y,0,plane3,attrib3,sprX2 BOR sprY2)
    DispM("No x /y mirror, no rotate",0)

    UpdateSprite(x,y,0,plane3,sprRotate,sprX2 BOR sprY2)
    DispM("Rotate",0)
    
    UpdateSprite(x,y,0,plane3,sprXmirror BOR sprYmirror,sprX2 BOR sprY2)
    DispM("Mirror X  + Y mirror",0)

    UpdateSprite(x,y,0,plane3,sprXmirror BOR sprRotate,sprX2 BOR sprY2)
    DispM("Mirror X + Rotate",0)

    UpdateSprite(x,y,0,plane3,0,sprX2 BOR sprY2)
    DispM("back to no x/y/rotate",1)

    ' method 2 using NR $37-39 

    DispM("You can also use NR $37-39",0)
    
    UpdateSprite(x,y,0,plane3,0,sprX2 BOR sprY2)                        ' sprite 0 will now be selected 
    NextRegA($37,sprXmirror BOR sprRotate)
    DispM("NR37 Rotate + X mirror",0)

    NextRegA($34,0) : NextRegA($39,sprX4 BOR sprY4)                     ' select sprite id 0 and set attrib4 
    DispM("NR 39 X4 and Y4",1)

    ' -- ANCHOR attrib 3 

    CONST fourbit   as ubyte = %10000000
    CONST leftpatt  as ubyte = %10000000          
    CONST rightpatt as ubyte = %11000000
    CONST bigsprite as ubyte = %00100000     

    ' COMPOSITE sprites 

    CONST relative          as ubyte = %01000000
    CONST relativepattern   as ubyte = %1

    cls : print "Composite, unique scale" : print "non relative patterns"
    print "Update sprite id 0 to move all"
    UpdateSprite(x,y,0,plane3,0,sprX2 BOR sprY2)                            ' this is the base sprite 
    UpdateSprite(16,16,1,plane1,0,relative BOR sprX4 BOR sprY4)             ' this has relative co-ords to base sprite but has its own scaling

    For x = 50 to 200
        UpdateSprite(x,y,0,baseframe+plane2,0,0)                                      ' we can now move both sprites by moving the base
        WaitRetrace(1)
        baseframe = 1 - baseframe
    next 

    DispM(" ",1)
    cls : print "Relative patterns": print "unique scales" 
    print "Update sprite id 0 to move all"
    UpdateSprite(x,y,0,plane1,0,sprX2 BOR sprY2)                                        ' this is the base sprite 
    UpdateSprite(16,16,1,plane2,0,sprY4 BOR sprX4 BOR relative bor relativepattern)     ' this has relative co-ords to base sprite 
    UpdateSprite(-16,-16,2,plane2,0,relative bor relativepattern)                       ' this has relative co-ords to base sprite 

    For x = 50 to 200
        UpdateSprite(x,y,0,plane1+baseframe,0,sprX2 BOR sprY2)                          ' we can now move both sprites by moving the base
        WaitRetrace(5)
        baseframe = 1 - baseframe
    next 

    DispM("",1)

    ' -- BIG SPRITES

    x = 128 

    dim pcounter as uinteger 
    dim scale as ubyte
    dim attrib4 as ubyte = relative bor relativepattern
    dim base_attr4, base_attr3 as ubyte 
    dim screennr as ubyte 
    ' set base sprite 

    base_attr4 = bigsprite BOR sprX2 BOR sprY2
    base_attr3 = 0 

    UpdateSprite(x,y,0,plane1,base_attr3,base_attr4)                   'indicate big sprite x2 y2 

    ' a loop to iterate through various combinations 
    planea = plane2
    planeb = plane3
    scale = 0 

    do
        screennr = 0 
        while screennr < 4 
            sx=peek(@sintable+(pcounter band 63))                                   ' adds rotation around middle base 
            sy=peek(@sintable+(16 + pcounter band 63)) 
            NextReg($34,0) : NextRegA($36,sy+90)                                     ' select sprite 0 and set y position as we dont want to affect any other attributes
            UpdateSprite(cast(uinteger,sx),cast(ubyte,sy),1,planea,0,attrib4)        ' attrib4 = relative bor relativepattern
            UpdateSprite(cast(uinteger,sy),cast(ubyte,sx),2,planeb,0,attrib4)    
            pcounter=pcounter+1                                                     ' counter for rotation 

            if  scale =  0
                
                cls : Print at 0,0;"Big sprites examples"
                Print "no mirror or rotate scaled X4" : print "relative pattern offset"
                print "Press any key"
                attrib4 = relative bor relativepattern : planeb = plane2 
                base_attr4 = bigsprite BOR sprX4 BOR sprY4
                base_attr3 = 0 
                UpdateSprite(x,y,0,plane1,base_attr3,base_attr4)   
                DispAttributes()
                scale = scale + 1
            elseif scale = 64

                cls : Print at 0,0;"rotate and scaled X2" : print "relative pattern offset"
                print "Press any key"
                base_attr4 = bigsprite BOR sprX2 BOR sprY2
                base_attr3 = sprRotate
                UpdateSprite(x,y,0,plane2,base_attr3,base_attr4)  
                DispAttributes()
                scale = scale + 1

            elseif scale = 128

                cls : Print at 0,0;"Y mirror scaled X1": print "no relative pattern offset"
                print "Press any key"
                attrib4 = relative
                base_attr4 = bigsprite
                base_attr3 = sprYmirror
                UpdateSprite(x,y,0,plane1,base_attr3,base_attr4) : planea = plane3          
                DispAttributes()
                scale = scale + 1

            elseif scale = 192

                cls : Print at 0,0;"X mirror and rotate scaled X4" : print "no relative pattern"
                print "Press any key"
                base_attr4 = bigsprite BOR sprX4 BOR sprY4
                base_attr3 = sprXmirror BOR sprRotate
                UpdateSprite(x,y,0,plane1,base_attr3,base_attr4)   
                DispAttributes()
                planea = plane2 : planeb = plane3 
                scale = scale + 1

            endif 

        '    if  scaletimer =  0
        '        ' timer triggered 
        '        scale =  scale + 1 : scaletimer = 2
        '    else 
        '        scaletimer =  scaletimer - 1 
        '    endif 
            
            WaitRetrace2(1)        

             if inkey<>""
                 screennr = screennr + 1  
                 while inkey<>"" : pause 1 : wend 
                 scale = screennr * 64 
             endif 
             
         wend      
    loop until inkey=" "
    DispM(" ",1)


loop 

sub DispM(text$ as string,flag as ubyte) 
    print text$
    
    if flag=1
        print at 21,0;"Press any key"
        WaitKey()
        'while inkey<>"" : pause 1 : wend 
        cls 
    else 
        'pause 0 
        'while inkey<>"" : pause 1 : wend 
        WaitKey()
    endif 
end sub

sub DispAttributes()

    print at 17,0;"base_attrib3 ";BinToString(base_attr3)
    print "base_attrib4 ";BinToString(base_attr4)
    print "attrib3 ";BinToString(attrib3)
    print "attrib4 ";BinToString(attrib4)

end sub 

Sprites:
asm 
Plane1:
	db  $E3, $E3, $E3, $E3, $E3, $00, $92, $B6, $B6, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $92, $92, $FF, $FF, $B6, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $92, $B6, $B6, $FF, $B6, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $00, $00, $00, $00, $92, $BB, $12, $BB, $B6, $00, $00, $00, $00, $E3, $E3;
	db  $00, $92, $92, $92, $92, $92, $12, $12, $12, $DA, $B6, $B6, $B6, $B6, $00, $E3;
	db  $92, $92, $B6, $B6, $6D, $92, $B6, $B6, $FF, $DA, $B6, $B6, $FF, $FF, $B6, $00;
	db  $92, $B6, $B6, $B6, $6D, $92, $B6, $B6, $FF, $DA, $B6, $B6, $B6, $B6, $92, $00;
	db  $00, $92, $B6, $B6, $6D, $92, $B6, $B6, $FF, $DA, $B6, $92, $92, $92, $00, $E3;
	db  $E3, $00, $00, $00, $92, $92, $B6, $B6, $B6, $92, $92, $00, $00, $00, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $6D, $92, $BB, $B6, $6D, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $00, $92, $B6, $B6, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $00, $00, $92, $00, $00, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $92, $B6, $6D, $B6, $B6, $B6, $B6, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $00, $92, $92, $B6, $6D, $B6, $B6, $B6, $B6, $B6, $00, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $00, $00, $92, $92, $B6, $00, $00, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $00, $92, $00, $E3, $E3, $E3, $E3, $E3, $E3, $E3;



Plane2:
	db  $E3, $E3, $E3, $E3, $E3, $00, $80, $A0, $A0, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $80, $80, $FF, $A0, $60, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $80, $B6, $B6, $FF, $60, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $00, $00, $00, $00, $80, $BB, $12, $BB, $60, $00, $00, $00, $00, $E3, $E3;
	db  $00, $80, $80, $80, $80, $80, $12, $12, $12, $80, $A0, $A0, $A0, $A0, $00, $E3;
	db  $80, $80, $A0, $A0, $60, $80, $A0, $A0, $C0, $80, $A0, $A0, $FF, $FF, $A0, $00;
	db  $80, $A0, $A0, $A0, $60, $80, $A0, $A0, $C0, $80, $A0, $A0, $A0, $A0, $80, $00;
	db  $00, $80, $A0, $A0, $60, $80, $A0, $A0, $C0, $80, $A0, $80, $80, $80, $00, $E3;
	db  $E3, $00, $00, $00, $80, $80, $A0, $A0, $A0, $80, $80, $00, $00, $00, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $60, $80, $BB, $A0, $60, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $00, $80, $A0, $A0, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $00, $00, $80, $00, $00, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $80, $A0, $60, $A0, $A0, $A0, $A0, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $00, $80, $80, $A0, $60, $A0, $A0, $A0, $A0, $A0, $00, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $00, $00, $80, $80, $A0, $00, $00, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $00, $80, $00, $E3, $E3, $E3, $E3, $E3, $E3, $E3;



Plane3:
	db  $E3, $E3, $E3, $E3, $E3, $00, $90, $0C, $10, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $90, $90, $FF, $10, $10, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $90, $B6, $B6, $FF, $10, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $00, $00, $00, $00, $90, $BB, $12, $BB, $10, $00, $00, $00, $00, $E3, $E3;
	db  $00, $90, $90, $90, $90, $90, $12, $12, $12, $08, $18, $18, $18, $18, $00, $E3;
	db  $90, $C2, $C2, $D8, $90, $90, $D8, $10, $1C, $08, $18, $18, $E0, $E0, $10, $00;
	db  $90, $61, $61, $D8, $90, $90, $D8, $1C, $1C, $08, $18, $18, $80, $80, $08, $00;
	db  $00, $48, $D8, $D8, $90, $90, $D8, $10, $1C, $08, $18, $08, $08, $08, $00, $E3;
	db  $E3, $00, $00, $00, $90, $90, $D8, $1C, $18, $08, $08, $00, $00, $00, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $90, $90, $BB, $18, $10, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $00, $90, $18, $18, $00, $E3, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $00, $00, $00, $48, $00, $00, $00, $E3, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $90, $D8, $90, $D8, $18, $18, $18, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $00, $90, $90, $D8, $90, $D8, $18, $18, $18, $18, $00, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $00, $00, $00, $48, $48, $18, $00, $00, $00, $E3, $E3, $E3, $E3;
	db  $E3, $E3, $E3, $E3, $E3, $E3, $00, $0C, $00, $E3, $E3, $E3, $E3, $E3, $E3, $E3;
end asm 

sintable:
asm 
    db 0,-1,-3,-4,-6,-7,-9,-10,-11,-12,-13,-14,-14,-15,-15,-15
    db -15,-15,-15,-15,-14,-13,-12,-11,-10,-9,-8,-6,-5,-3,-2,0
    db 0,2,3,5,6,8,9,10,11,12,13,14,15,15,15,15
    db 15,15,15,14,14,13,12,11,10,9,7,6,4,3,1,0
    db 0,-1,-3,-4,-6,-7,-9,-10,-11,-12,-13,-14,-14,-15,-15,-15
    db -15,-15,-15,-15,-14,-13,-12,-11,-10,-9,-8,-6,-5,-3,-2,0
    db 0,2,3,5,6,8,9,10,11,12,13,14,15,15,15,15
    db 15,15,15,14,14,13,12,11,10,9,7,6,4,3,1,0
end asm 
