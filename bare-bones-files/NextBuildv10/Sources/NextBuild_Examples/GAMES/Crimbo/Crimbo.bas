' Project: Crimbo v1.1 - release Jan 21 2026
' Code & Ported gfx : em00k 
' Graphics : Blackjet 
' music : kulor 2oo9

' A port of the ZX Spectrum game of the same 
' name by Little Shop of Pixels in less than 20KB

' 1.1   30/01/26
' -     added cayote jumps to be more sympathetic for the player 
' -     improved snow routies
' -     fixed stuck screen when completed on cspect
' -     extra life when + 5000 are earnt 
' -     fixed saved file issue on cspect (corrupt times on first play)
' 1.0   Inital release 

' this started off quite neat but the last 20% of tweaks 
' may have made it a little messy.

' I wrote this over the Xmas 2025 period, in which I was quite ill
' when I wasn't in hospital I tried to work on this. 
' 22-dec-25 - 21-jan-26 

' this command just copies the final NEX to my Next's FlashAir SD card 
' note you need to use absolute path for the source 

'#!exe=cp ~/Documents/NextBuildv9/Sources/Crimbo/Crimbo.nex /mnt/flashair/192.168.2.1/

'!heap=2048                                         ' 2kb heap for work
'!org=$7000                                         ' start program at $7000

#define NEX                                         ' self contained NEX file
#define IM2                                         ' we will be using IM2

#include <nextlib.bas>
#include <keys.bas>
#include "TileMap-Inc.bas"                          ' contains tilemap routines
#include <nextlib_ints.bas>                         ' default interrupt library

' ensure we're running 28mhz
NextReg(TURBO_CONTROL_NR_07,3)

' Load fonts from system into bank 32 / 33 
LoadSDBank("font20.fnt",0,0,0,31)                   ' note that the system fonts now have a fnt 
LoadSDBank("font18.fnt",0,0,0,32)                   ' extension so they load automatically into the 
LoadSDBank("font23.fnt",0,0,0,33)                   ' sprite viewer with the correct settings - these
LoadSDBank("font21.fnt",0,0,0,64)                   ' have been included locally

' Load game sprites 
LoadSDBank("santa.spr",0,0,0,34)
LoadSDBank("baddies.spr",0,0,0,36)
LoadSDBank("present.spr",0,0,0,37)

' Music & sfx 
LoadSDBank("[]ts4000.bin",0,0,0,40)                 ' music replayer
LoadSDBank("soundfx.afb",0,0,0,41)                  ' sound effects bank
LoadSDBank("Winter4f.pt3",0,0,0,42)                 ' awesome tunage

' other assets 

LoadSDBank("house-160x103.nxi",0,0,0,60)            ' 16480
LoadSDBank("logo_0014-160x80.nxi",0,0,0,44)         ' 12800
LoadSDBank("banner-256x16.nxi",0,0,0,46)            ' 4096
LoadSDBank("footer-256x36.nxi",0,0,0,47)            ' 9216
LoadSDBank("chimney_smoke-8x64.nxi",0,0,0,49)       ' 512

' Load level data 
' each level.dat is 3 files concatonated into one file 
'[ cat level_0000.nxm level_0000.nxp level_0000.nxt >> level_0.dat ]
'[ 1000               512            2048+]
LoadSDBank("level_0.dat",0,0,0,50)                  ' level 0 data 
LoadSDBank("level_1.dat",0,0,0,51)                  ' level 0 data 
LoadSDBank("level_2.dat",0,0,0,52)                  ' level 0 data 
LoadSDBank("level_3.dat",0,0,0,53)                  ' level 0 data 
LoadSDBank("level_4.dat",0,0,0,54)                  ' level 0 data 
LoadSDBank("level_5.dat",0,0,0,55)                  ' level 0 data 
LoadSDBank("level_6.dat",0,0,0,56)                  ' level 0 data 
LoadSDBank("level_7.dat",0,0,0,57)                  ' level 0 data 
LoadSDBank("level_8.dat",0,0,0,58)                  ' level 0 data 
LoadSDBank("level_9.dat",0,0,0,59)                  ' level 0 data 

LoadSDBank("layer2.pal",0,0,0,65)                   ' palette with extra grey
LoadSDBank("loading.pal",0,0,0,66)                   ' palette with extra grey
LoadSDBank("Crimbo-box-256x192.nxi",0,0,0,68)       ' loading screen 


' note last bank used is 60 ! for the house asset above
' snow uses bank 63 

#include "snow-inc.bas"                             ' snow routines

' declare functions used 

declare function IsBlock(x_pos as uinteger, y_pos as ubyte) as ubyte
declare function CheckBBoxCollision(x1 as uinteger, y1 as ubyte, w1 as ubyte, h1 as ubyte, x2 as uinteger, y2 as ubyte, w2 as ubyte, h2 as ubyte, soft as ubyte) as ubyte
declare function RSet(txt as string, chars as ubyte) as string
declare function StrToVal(in_string as string) as uinteger
declare function XorA(inbyte as ubyte, xorvalue as ubyte) as ubyte

' constants 

const player_start_frame as ubyte   = 0 
const player_anim_size  as ubyte    = 2
const spr_x_flip        as ubyte    = %00001000

const MLEFT             as ubyte = 0 
const MRIGHT            as ubyte = 1 
const MUP	            as ubyte = 2 
const MDOWN	            as ubyte = 3 
const MSTILL	        as ubyte = 4
const MAX_SPRITES       as ubyte = 16

const SCREEN_RIGHT_BOUNDARY as ubyte = 33
const SPRITE_ACTIVE     as ubyte = 1
const SPRITE_INACTIVE   as ubyte = 0

const map_address       as uinteger = $4b00 
const levelticker_time  as ubyte = 60           ' ticks for level timer 

const STATE_MENU        as ubyte = 0 
const STATE_GAMESTART   as ubyte = 1 
const STATE_PLAYERDIE   as ubyte = 2 
const STATE_GAMEOVER    as ubyte = 3 
const STATE_NEXTLEVEL   as ubyte = 4 

' variables & strings 

dim mleft, mright       as ubyte 
dim flip                as ubyte = 0 
dim player_x            as uinteger = 32 
dim player_y            as ubyte = 32 
dim timer               as ubyte = 0 
dim intro_timer         as ubyte = 30
dim current_frame       as ubyte = 3
dim global_frame        as ubyte = 0
dim global_tick         as ubyte = 0

dim jump                as ubyte = 0 
dim jump_help           as ubyte = 0 
dim jump_timer          as ubyte = 0 
dim jump_lenght         as ubyte = $1f
dim jump_pos            as ubyte = 0 
dim jump_grav_pos       as ubyte = 0 

dim address             as uinteger

dim pldx                as ubyte 
dim pldy                as ubyte 

dim jump_pressed        as ubyte = 0
dim is_grounded         as ubyte = 1

' game_state 
' 0 = menu, 1 = game started, 2 = player die, 3 = game over
' 4 = next level 

dim game_state          as ubyte = STATE_MENU
dim lives               as ubyte = 4 
dim level_time          as ubyte = 30 
dim level_ticker        as ubyte = 60
dim score               as ulong = 0000000
dim next_life_score     as uinteger = 5000
dim bonus_timer         as ubyte 
dim bonus_ticker        as ubyte = 6
dim level_skipped       as ubyte = 0 

dim level               as ubyte = 0
dim items               as ubyte = 4 

dim restart             as ubyte = 0    ' flag to indicate new lever or restart
dim showtile            as ubyte = 0 
dim music_enable        as ubyte = 1 
dim pause_state         as ubyte = 0 
dim key_down            as ubyte = 0 

' best times 
dim best$(10)           as string

    best$(0) = "30.00"
    best$(1) = "30.00"
    best$(2) = "30.00"
    best$(3) = "30.00"
    best$(4) = "30.00"
    best$(5) = "30.00"
    best$(6) = "30.00"
    best$(7) = "30.00"
    best$(8) = "30.00"
    best$(9) = "30.00"

dim hiscore             as ulong 
dim addr                as uinteger
dim st_add              as uinteger = addr
dim buff$               as string = "00.00"

' set up some sprites arrays					ID  X   Y  Img Dir spe
dim aSprites(16,8)      AS uByte 	    		' 16 sprites with 8 attributes 
dim aPresents(8,2)      as ubyte                ' up to 8 presents x.y

dim title$              as string  = " "        ' level title 

' Initialisation 

InitLayer2(MODE256X192)                         ' set up Layer2 256x192
ClipLayer2(0,255,0,190)                         ' clip bottom line of L2, hack to hide snow line!...

InitPalette(L2_PALETTE_P1,66,0,0,0)             ' loading screen palette 
NextReg(LAYER2_RAM_BANK_NR_12,68>>1)            ' set L2 RAM to point to loading scr RAM

ShowLayer2(1)                                   ' show the layer2 

WaitKey() : ClearLayer2(0)

NextReg(LAYER2_RAM_BANK_NR_12,9)                ' set L2 RAM to point to loading scr RAM
InitPalette(L2_PALETTE_P1,65,0,0,0)             ' upload palette from bank 65

InitSprites2(7,0,34)                            ' Upload 7 santa sprites from bank 34
InitSprites2(14,0,36,8)                         ' upload 14 baddie sprites from bank 36 to slot 8 
InitSprites2(6,0,37,22)                         ' upload 6 present sprites from bank 37 to slot 22

NextReg(SPRITE_CONTROL_NR_15,%000_000_01)       ' enable sprites under border
ClipSprite(0,255,0,192-24)                      ' clip sprite area 

load_scores()                                   ' load scores if they exist

' start music - 
InitSFX(41)                                     ' sfx in bank 41
InitMusic(40,42,0000)                           ' player routine bank and music bank
PlaySFX($ff)                                    ' play a dummy sound to stop unexpected startup sounds
SetUpIM()                                       ' init the interrupts
EnableSFX                                       ' enable sound fx
EnableMusic                                     ' enable music 
' StopMusic()
' music_enable = 0 

'----------------------------------------------------------
'// MARK: MainLoop
'



game_state = STATE_MENU                         ' start with title screen

' TESTING
' level = 1
' game_state = STATE_GAMESTART

do 

    if game_state = STATE_MENU                  ' main title screen

        ' display menu, wait for input 

        Intro()

        clear_sprites()

    elseif game_state = STATE_GAMESTART        ' game started

        ' level = 8 ' test level 

        ' fetch level and play 

        if level < 10 

            fetch_level(level)
            update_scores()
                        
            do 
                ' ensure we're running 28mhz
                NextReg(TURBO_CONTROL_NR_07,3)
                read_keys()
                UpdatePlayer()
                UpdateBaddies()
                CheckCollisionSimple()
                update_level_state()
                UpdateItems()
                timers()
                WaitRaster(190)
                if game_state > STATE_GAMESTART
                    exit do 
                endif 
            loop
        else 
            
            completed()                         ' if over leve 10 we completed the game
            game_state = STATE_GAMEOVER         '  game over state 

        endif 

    elseif game_state = STATE_PLAYERDIE

        ' lose a life 

        lives = lives - 1 
        
        if lives = 0 
            
            game_state = STATE_GAMEOVER         ' game over state 
            restart = 0                         ' reset restart flag

        else
            
            ' proces player hit action 

            death_moves()
            restart = 1

        endif 

    elseif game_state = STATE_GAMEOVER         ' game over state 

        ' game over 

        death_moves()

        show_game_over()
        
        game_state = STATE_MENU                ' game state title screen 
        lives = 4 
        level = 0
        score = 0 
        restart = 0 
        next_life_score = 5000                    ' reset bonus

        StopMusic()                             ' saving can cause corruption
                                                ' while music IM is playing, so we pause it
         asm 
             di 
        end asm
        
        save_scores()                           ' save scores here?
        
        asm
             ei
        end asm 
        
        if music_enable = 1 
            PlayMusic()
        endif 

        WaitRetrace(500)    
        
    elseif game_state = STATE_NEXTLEVEL

        ' next level 

        next_level()                            ' next level sub
        restart = 0 

    endif  

loop

'----------------------------------------------------------
' sub routines 
'

sub timers()
    '// MARK: Timers

    ' provides a global frame tick

    if global_frame = 0 
        global_frame = 6 
        global_tick = global_tick + 1 
    else
        global_frame = global_frame - 1 
    endif 

    ' adds bonus for time between pickup of presents
    if bonus_ticker = 0 
        if bonus_timer>100
            bonus_timer = bonus_timer - 1 
        endif 
        bonus_ticker = 6
    else
        bonus_ticker = bonus_ticker -1 
    endif 

end sub 

sub fetch_level(level as ubyte)
    
    '// MARK: FetchLevel

    ' fetches a new level data block
    ' pages data into RAM and copies to relevant 
    ' memory locations. 

    dim l_p as ubyte 

    NextRegA(MMU0_0000_NR_50,50+level)                  ' bring in level data to $0000-$1fff slot

    SetupTileHW($0B,$0)
    
    NextReg(MMU0_0000_NR_50,$ff)                        ' put back rom

    asm 
    ; Turns off the tilemap 
        nextreg TILEMAP_CONTROL_NR_6B,%00100001         ;' Tilemap Control off & on top of ULA,  40x32
        nextreg SPRITE_CONTROL_NR_15,0                  
    end asm
    
    read_level(level)                                   ' parse the level data 

    show_bonus_text()                                   ' process level scores

    ' show title 
    l_p = len(title$) /2

    L2Text(15-l_p,11,title$,32,0)                       ' show level title
    
    buff$ = "Best : "+best$(level) 

    L2Text(15-(len(buff$)>>1),13,buff$,33,0)            ' show level title

    WaitKey()
    
    'clear text 
    for x = 0 to 31
        DoTileBank8(x,11,0,32)
        DoTileBank8(x,13,0,32)
    next        

    asm 
    ; Turns on the tilemap 
        nextreg TILEMAP_CONTROL_NR_6B,%10100001				;' Tilemap Control on & on top of ULA,  40x32
        nextreg SPRITE_CONTROL_NR_15,%00000001
    end asm
    
    ' reset timers  
    level_ticker = 60
    level_time = 30 
    
    display_hud()                                           ' show hud
    
end sub

sub Intro()
    '// MARK: Intro

    ' intro program 

    dim kemp    as ubyte = in 31 
    dim msg_counter as ubyte = 0 
    dim long_trigger as ubyte = 25 
    dim key_down as ubyte = 0 

    while in 31 > 0 : wend
        
    init_snow()

   ' Draws intro logo and footer 
    DrawImage(50,20,@gloop_logo,0)
    DrawImage(0,192-36,@gloop_footer,0)

    L2Text(7,20,"PRESS FIRE TO PLAY",32,0)
    L2Text(11,1,"HI",32,0)
    L2Text(14,1,RSet(str(hiscore), 7),33,255)

    fetch_intro_msg(0,@Messages,15)                 ' fetch the first intro msg text

    do         
                
        update_snow()                               ' update the snow flakes

        WaitRetrace(1)                              ' wait 2 frames 

        if intro_timer = 0                          ' this is a slow timer for updating
            intro_timer = 10                        ' the intro messagaes 
            long_trigger = long_trigger - 1 
            ''-Console(str(long_trigger))
        else 
            intro_timer = intro_timer - 1
        endif 
            
        if long_trigger = 0                         ' long_trigger triggered! 
            if msg_counter < 7 
                msg_counter = msg_counter + 1 
                fetch_intro_msg(msg_counter,@Messages,15)        ' show new messages
            else 
                msg_counter = 0 
            endif 
            long_trigger = 25
        endif 

        if key_down = 0 
            if MultiKeys(KEYSPACE) or (in 31 band %11110000) > 0      ' key pressed 
                PlaySFX(2)
                exit do 
            endif 
        else 
            key_down = GetKeyScanCode() 
        endif 

        if MultiKeys(KEYS)                          ' level picker with key S+N
            if MultiKeys(KEY1)
                level = 0 
            elseif MultiKeys(KEY2)
                level = 1 
            elseif MultiKeys(KEY3)
                level = 2
            elseif MultiKeys(KEY4)
                level = 3            
            elseif MultiKeys(KEY5)
                level = 4
            elseif MultiKeys(KEY6)
                level = 5            
            elseif MultiKeys(KEY7)
                level = 6            
            elseif MultiKeys(KEY8)
                level = 7            
            elseif MultiKeys(KEY9)
                level = 8            
            elseif MultiKeys(KEY0)
                level = 9
            endif
        endif 

        if MultiKeys(KEYM) and key_down = 0         
            key_down = 1 
            music_control()
        endif

        if level > 0 
            restart = 1                             ' dont show bonus time info
            exit do
        endif 

    loop

    cls

    house_scene()

    game_state = STATE_GAMESTART                   ' trigger game start mode 

    

    ' dimentions of the logo bitmap used with DrawImage()

gloop_logo:
asm 
    ;intro logo: bank,width,height
    db 44,160,80
    ds 2        ; padding 
end asm 

gloop_footer:
asm 
    ;intro logo: bank,width,height
    db 47,256,36
    ds 2        ; padding 
end asm 

end sub

sub house_scene()
    
    '// MARK: CabinScene

    ' displays the cabin with text printer 

    clearlayer2(0)

    dim smoke_timer     as ubyte = 60
    dim smoke_frame     as ubyte = 6
    dim text_printer    as ubyte = 6 
    dim msg_pos         as ubyte = 0
    dim kemp            as ubyte = in 31 
    dim key_down        as ubyte = 0 
    dim cx, cy          as ubyte
    dim char            as ubyte = $ff

    cx = 0 : cy = 16

    while in 31 > 0 : wend

    DrawImage(6*8,8,@gloop_house,0)
    
    key_down = GetKeyScanCode() 

    do 

        WaitRaster(0)             

        ' animate smoke 
        if smoke_timer = 0 
            smoke_frame = smoke_frame+1 
            if smoke_frame > 3 : smoke_frame = 0 : endif 
            DrawImage(17*8,16,@gloop_smoke,smoke_frame)
            smoke_timer = 20
        else 
            smoke_timer = smoke_timer - 1
        endif 

        ' animate text printer 
        if text_printer = 0 
            char = peek(@cabin_text+cast(uinteger,msg_pos))
            if char < $ff 
                L2Text(cx,cy,chr$ char,32,0)
                cx = cx + 1 : if cx >31 : cx = 0 : cy = cy + 1 : end if 
                msg_pos = msg_pos + 1 
                text_printer = 3
            else 
                text_printer = 255
            endif 
        elseif text_printer < 255 
            text_printer = text_printer - 1 
        endif 

        if key_down = 0 
            if MultiKeys(KEYSPACE) or (in 31 band %11110000) > 0      ' key pressed 
                exit do 
            endif 
        else
            key_down = GetKeyScanCode() 
        endif 
        
    loop 

    clearlayer2(0)

    return 

gloop_house:
asm
    ; bank, x, y, 0 0 
    db 60,160,103,0,0
end asm 

gloop_smoke:
asm 
    db 49,8,16,0,0
end asm 

cabin_text:
asm 
    ;  [                                ]
    db "On no! It's christmas eve and   "
    db "santa's helpers have gone on    "
    db "strike and have hidden all the  "
    db "presents around the house. Help "
    db "santa save christmas!           "
    db $ff 
end asm 

end sub 

sub completed()
    
    '// MARK: GameComplete

    ' update the scores then show the completed game text

    dim run_timer       as ubyte = 3
    dim kemp            as ubyte = in 31 

    init_snow()

    asm 
    ; Turns off the tilemap 
        nextreg TILEMAP_CONTROL_NR_6B,%00100001				;' Tilemap Control on & on top of ULA,  40x32
        nextreg SPRITE_CONTROL_NR_15,1                  
    end asm
    
    ClearLayer2(0)

    display_hud()

    update_scores()
    
    show_bonus_text()
    
    fetch_intro_msg(0,@completed_text, 12, 64) 
    
    key_down = GetKeyScanCode() + kemp

    do 

        WaitRetrace(2)     

        update_snow()                               ' update the snow flakes

        if run_timer = 0 
            run_timer = 3
            mright = 1 : jump = 0 
            player_x = 152 : player_y = 96
            UpdatePlayer()
        else 
            run_timer = run_timer - 1 
        endif 
        
        kemp = in 31

        if key_down = 0 
            if MultiKeys(KEYSPACE) or (in 31 band %11110000) > 0      ' key pressed 
                 exit do 
            endif 
        else                
           key_down = GetKeyScanCode() + kemp 
        endif 

    loop 

    asm 
        nextreg TILEMAP_CONTROL_NR_6B,%00100001				;' Tilemap Control on & on top of ULA,  40x32
        nextreg SPRITE_CONTROL_NR_15,0                  
    end asm

    ShowLayer2(0)
    clearlayer2(0)
    WaitRetrace(500)

end sub 

sub show_bonus_text()

    '//MARK: showbonus

    ' when a level is complete show the time and bonus score 

    if level > 0 and restart = 0 
        
        if level_skipped = 0                ' dont process score if level has been skipped

            dim time    as string
            dim bonus   as string
            dim best_col    as ubyte = 33

            L2Text(7,07,"Room "+str(level)+" Complete",32,0)                           ' show level title 

            PlaySFX(6)

            ' we need to construct a final best string, and because
            ' best$(n) also is a string we will use our own StrToVal()
            ' as VAL(STR$) can cause a crash! 

            ' ss.cs
            time=str(30-level_time)+"."+str(60-level_ticker)
 
            ' check that the best$() is valid 
            if StrToVal(best$(level-1)) = 0
                best$(level-1)="30.00"
            endif 

            if StrToVal(time) < StrToVal(best$(level-1))
                ' new best time detected, print in green
                ' store the new best time
                best$(level-1) = time
                best_col = 64
            endif 

            ' bonus for finishing the level
            bonus=str(((cast(ulong,level_time))+(cast(ulong,level_ticker)))*10)
            
            ' update scores 
            score = score + ((cast(ulong,level_time) + cast(ulong,level_ticker))*10)

            if score >= next_life_score
                lives = lives + 1
                next_life_score = next_life_score + 5000
            endif 

            update_scores()

            WaitRetrace(100)
            L2Text(9,9,"Time : "+time,33,255) : PlaySFX(2)
            WaitRetrace(100)
            L2Text(9,11,"Best : "+best$(level-1),best_col,255) : PlaySFX(2)
            WaitRetrace(100)
            L2Text(9,13,"Bonus : "+bonus,33,255) : PlaySFX(2)
            WaitRetrace(100)
            WaitKey()
            
            ' clear text 
            for x = 0 to 31
                DoTileBank8(x,07,0,32)
                DoTileBank8(x,9,0,32)
                DoTileBank8(x,11,0,32)
                DoTileBank8(x,13,0,32)
            next 

        endif 
    endif 

    level_skipped = 0 

end sub 

sub fetch_intro_msg(message as ubyte, address as uinteger, y_pos as ubyte, fnt as ubyte=33)
    
    '// MARK: FetchIntroMsgs

    ' fetches a message and prints it using L2Text.

    dim level_data_str      as uinteger
    dim b_type              as ubyte 
    dim msg_len             as ubyte
    'dim y_pos               as ubyte = 15
    level_data_str = peek(uinteger, address+cast(uinteger,message<<1))            ' points to jumptable
    title$=""

    for x = 0 to 31                             ' clears the text area
        DoTileBank8(x,15,0,33)                  
        DoTileBank8(x,16,0,33)
        DoTileBank8(x,17,0,33)
        DoTileBank8(x,18,0,33)
    next 
    do 
        b_type = peek(level_data_str)           ' fetch the byte 
        if b_type = $13                         ' its a linefeed so print current title$
            msg_len = len(title$)
            L2Text((32/2)-(msg_len/2),y_pos,title$,fnt,255)
            y_pos = y_pos + 1                   ' move y pos down 1
            title$=""                           ' resets title$
        elseif b_type <> $ff  
            title$=title$+chr(b_type)           ' add char to title$
        else 
            msg_len = len(title$)
            L2Text((32/2)-(msg_len/2),y_pos,title$,fnt,255)      ' final message
            exit do 
        endif 
        level_data_str = level_data_str + 1 

    loop 

end sub 

sub update_level_state()
    
    '// MARK: LevelState

    ' update the level time tickers and check level state

    dim t$      as string 
   
    if global_frame = 0 
        if level_time < 10 
            t$="0"+str(level_time)
        else 
            t$=str(level_time)
        endif
        L2Text(18,21,t$,33,255)
    endif

    ' level timing 
    if level_ticker = 0 
            
        level_time = level_time - 1 
        
        level_ticker = 60

    else 
        level_ticker = level_ticker - 1 
    endif 
    
    if level_time = 0 
        ' force lose a life 
        game_state = STATE_PLAYERDIE

    endif

    if items = 0 
        items = 4 
        level = level + 1 
        game_state = STATE_NEXTLEVEL
        PlaySFX(1)
    endif 

end sub 

sub read_keys()
    '// MARK: ReadKeys

    dim kemp    as ubyte = in 31 

    ' read keys from player input

    pldx = MSTILL 
    pldy = MSTILL 

    if MultiKeys(KEYR) and MultiKeys(KEYI)
        ' skips level
        level = level + 1 
        game_state = STATE_NEXTLEVEL
        restart = 1             ' stops player collecting bonus if level skipped
        level_skipped = 1       ' do not count score on skip
    endif

    ' reads keyboard input 

    mleft = 0 : mright = 0 

    if MultiKeys(KEYD) or kemp band %1 > 0 
        mright = 1 
        pldx = MRIGHT 
    elseif MultiKeys(KEYA) or kemp band %10 > 0 
        mleft = 1
        pldx = MLEFT
    endif 

    if (kemp band %11110000 or MultiKeys(KEYSPACE)) and jump = 0 and jump_pressed = 0 and is_grounded = 1
        jump = 1
        jump_timer = 0
        pldy = MUP
        jump_pressed = 1
        PlaySFX(3)
    endif 
    if MultiKeys(KEYSPACE) = 0 and kemp band %11110000 = 0 
        jump_pressed = 0 
    endif 

    if MultiKeys(KEYM) and key_down = 0         
        key_down = 1 
        music_control()
    endif 

    if MultiKeys(KEYQ)
        game_state = STATE_GAMEOVER
    endif

    if GetKeyScanCode()=0
        key_down = 0 
    endif 

end sub 

sub music_control()
    ' enable or disable music 
    music_enable = 1 - music_enable
    if music_enable = 0
        StopMusic()
    else 
        PlayMusic()
    endif 
end sub 

sub ProcessJump()
    
    '// MARK: ProcessJump
    ' standard jump arc routine, makes the player jump
    ' while fire is being pressed 
    ' santa has to jump just the right amount

    if jump_timer < $16 and jump_pressed =1             ' when timer <$17 and jump is pressed 
        
        current_frame = 0                               ' jumping frame 
        ' move player y according to jump_arc table
        player_y = player_y - (peek(@jump_arc+cast(uinteger,jump_pos)))
        pldy = MUP                                      ' indicate we want to go up
        jump_timer = jump_timer + 1                     ' increase timere   

        if jump_pos<$14 : jump_pos = jump_pos + 1 : endif 

    elseif jump_timer < $24 and jump_pressed =1         ' hover time    

        current_frame = 1
        pldy = MUP
        jump_timer = jump_timer + 1 

    elseif jump_timer < $16 ' and jump_pressed =1         ' hover time    
        current_frame = 0
        jump_timer = jump_timer + 1 
        'pldy = MSTILL
        
    else                                                ' descent

        ' jump timer finished or button unpressed  
        current_frame = 1 
        jump = 0 
        jump_timer = 0 
        jump_pos = 0 
        pldy = MSTILL
    endif 

    return 

jump_arc: 
    asm 
        ; 21/$15 values       $a        $10        
        db 1,2,3,3,4,5,4,3,1,1,1,1,1,1,1,1,1,1,1,1,1      ; floaty
        ;db 1,2,3,3,3,3,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1      ; floaty
        ds 8, 0
    end asm 

end sub 

sub UpdatePlayer()
    '// MARK: UpdatePlayer
    ' update frame timer 

    ' only animate the walking if we are on the ground 
    if jump = 0 and is_grounded = 1
        if mright + mleft > 0 
            if timer = 0 
                current_frame = current_frame + 1 
                if current_frame = 6 : current_frame = 3 : endif 
                timer = 3 
            else 
                timer = timer - 1
            endif 
        else 
            current_frame = 3
        endif
    else 
        current_frame = 1                              ' show the falling sprite
    endif 

    ' which direction are we facing, flip the sprite
    if mright = 1 
    '    player_x = player_x + 1 
        flip = 0
    elseif mleft = 1 
    '    player_x = player_x - 1 
        flip = spr_x_flip
    endif 

    ' this puts player sprite on the screen 
    UpdateSprite(player_x,player_y-1,63,player_start_frame+current_frame,flip,0)

end sub 

'----------------------------------------------------------
' detection routines 
'

function IsBlock(x_pos as uinteger, y_pos as ubyte) as ubyte
    '// MARK: IsBlock
    ' Examine the tile at x_pos,y_pos and return the result
    dim address     as uinteger

    address = (map_address+(cast(uinteger,y_pos)*40)+cast(uinteger,x_pos))
    return peek(address)

end function

function CheckBBoxCollision(x1 as uinteger, y1 as ubyte, w1 as ubyte, h1 as ubyte, x2 as uinteger, y2 as ubyte, w2 as ubyte, h2 as ubyte, soft as ubyte) as ubyte
    ' Simple bounding box collision detection
    ' x1,y1,w1,h1 = first box (position and size)
    ' x2,y2,w2,h2 = second box (position and size)
    ' soft = number of pixels to soften edges (0 = no softening)
    ' Returns 1 if collision, 0 if no collision

    dim left1, right1, top1, bottom1 as uinteger
    dim left2, right2, top2, bottom2 as uinteger

    ' Calculate bounds for box 1 with edge softening
    left1 = x1 + soft
    right1 = x1 + w1 - soft
    top1 = y1 + soft
    bottom1 = y1 + h1 - soft

    ' Calculate bounds for box 2 with edge softening
    left2 = x2 + soft
    right2 = x2 + w2 - soft
    top2 = y2 + soft
    bottom2 = y2 + h2 - soft

    ' Check for collision (AABB algorithm)
    if left1 < right2 and right1 > left2 and top1 < bottom2 and bottom1 > top2 
        return 1    ' Collision detected
    else
        return 0    ' No collision
    endif
end function

Sub CheckCollision()

    '// MARK: CheckColl
	' a robust collision routine for our player against the tilemap

    const blocksize as ubyte = 3                ' how many shifts 
    const scalesize as ubyte = 14               ' x1 and x2 x1 = 14 x2 = 30

	dim plxc,sp,add as uinteger
	dim plyc,tilehit,lefttile,righttile, toptile,bottile,tile as ubyte 
	
    dim plvel       as ubyte = 0
    dim mapbuffer   as uinteger = $4b00         ' point to the map 	

	dim oldpx       as uinteger = player_x      ' store current player x and y 
	dim oldpy       as ubyte = player_y

    ' stop player moving into the forbidden zones! 
    if player_y < 192
        if pldx = MLEFT                             ' is player x direction LEFT?
            player_x = player_x -  1
        elseif pldx = MRIGHT                        ' is player x direction RIGHT?
            player_x = player_x +  1                ' then plx + 1 
        endif 
    endif

    if jump = 1                                     ' if jump is active 
        ProcessJump()
    endif 

	if pldy = MUP

        if player_y<1 : player_y=1 : endif

	else   'if pldy = MDOWN
        ' add gravity 

        player_y = player_y + (peek(@jump_gravity+cast(uinteger,jump_grav_pos)))
        if jump_grav_pos < 4 : jump_grav_pos = jump_grav_pos + 1 : endif 

        if player_y > 192+8                         ' wrap player around screen
            player_y = 16
        endif 

	endif 

    dim offsets as ubyte =2

    lefttile = (player_x+offsets) >> 3                   ' 2 & 14 for soft edge blocks 
	righttile = (player_x+scalesize) >> 3 
	
	toptile = (2+player_y-offsets) >> 3
	bottile = (player_y+scalesize) >> 3
	
	' if lefttile>40 : lefttile = 0 : endif 
	' if righttile>40 : righttile = 40 : endif 
	' if toptile>32 : toptile = 0 : endif 
	' if bottile>32 : bottile = 32 : endif 
	
	tile = 0
	is_grounded = 0                             ' assume player is in air

	if pldy = MUP
		add = (mapbuffer+(cast(uinteger,toptile)*40))
		for xx= lefttile to righttile
				tile = peek(add +cast(uinteger,xx))
				if tile > 0 or player_y < 4
						player_y=oldpy
						'pldy = MSTILL
                        exit for
				endif
		next
	else  ' if pldy = MDOWN
		add = (mapbuffer+(cast(uinteger,bottile)*40))
		for xx= lefttile to righttile
				tile = peek(add+cast(uinteger,xx))
				if tile > 0
                        if tile < 3
                            game_state = STATE_PLAYERDIE    ' player hit spike
                            return
                        endif                         
                        player_y=oldpy
                        is_grounded = 1                     ' player is on ground
                        jump = 0 : jump_pos = 0 
                        exit for
                        
				endif
		next
	endif 

    offsets = 2

	lefttile = (player_x-2+offsets) >> 3                '    / 16 to get current map co-ords
	righttile = ((2+player_x)+scalesize) >> 3               ' +2 & +14 for soft edges 
	
	toptile = (player_y+offsets+2) >> 3
	bottile = (player_y+scalesize) >> 3
	
	' if lefttile>40 : lefttile = 0 : endif 
	' if righttile>40 : righttile = 40 : endif 
	' if toptile>32 : toptile = 0 : endif 
	' if bottile>32 : bottile = 32 : endif 
         
    tile = 0

    ' check for left 
    if pldx = MLEFT 
        for yy = toptile to bottile
            tile = peek(mapbuffer+(cast(uinteger,yy)*40)+cast(uinteger,lefttile))
            if tile > 0 
                if jump = 1 and yy = toptile
                    pldy = MUP
                    player_x = oldpx
                    exit for
                elseif yy = bottile and is_grounded = 0 and tile > 2 
                    ' Corner nudge: if within 3 pixels of tile top, snap up
                    if (player_y band 7) < 3
                        player_y = (bottile << 3) - scalesize -2
                        'is_grounded = 1
                        'jump = 0 : jump_pos = 0
                    else
                        player_x = oldpx
                    endif
                else
                    pldx = MSTILL
                    player_x = oldpx
                    exit for
                endif
            endif
        next
    elseif pldx = MRIGHT 
        for yy = toptile to bottile
            tile = peek(mapbuffer+(cast(uinteger,yy)*40)+cast(uinteger,righttile))
            if tile > 0 
                if jump = 1 and yy = toptile
                    pldy = MUP
                    player_x = oldpx
                    exit for
                elseif yy = bottile and is_grounded = 0 and tile > 2
                    ' Corner nudge
                    if (player_y band 7) < 3
                        player_y = (bottile << 3) - scalesize-2
                        'is_grounded = 1
                        'jump = 0 : jump_pos = 0
                    else
                        player_x = oldpx
                    endif
                else
                    pldx = MSTILL
                    player_x = oldpx
                    exit for
                endif
            endif
        next
    endif



end sub

Sub CheckCollisionSimple()
    '// MARK: CheckCollSimple
    '// Simplified collision - checks 2 points per axis

    const PLAYER_W as ubyte = 14          ' player collision width
    const PLAYER_H as ubyte = 14          ' player collision height
    const NUDGE_PIXELS as ubyte = 3       ' forgiveness for corner correction

    dim mapbuffer as uinteger = $4b00
    dim oldpx as uinteger = player_x
    dim oldpy as ubyte = player_y
    dim tile as ubyte
    dim tx, ty as ubyte                   ' tile coordinates

    ' Horizontal movement
    if pldx = MLEFT 
        player_x = player_x - 1
    elseif pldx = MRIGHT 
        player_x = player_x + 1
    endif

    ' Vertical movement (jump or gravity)
    if jump = 1 
        ProcessJump()
    endif

    if pldy = MUP 
        if player_y < 1 then player_y = 1
    else
        ' Apply gravity
        player_y = player_y + peek(@jump_gravity + cast(uinteger, jump_grav_pos))
        if jump_grav_pos < 4 then jump_grav_pos = jump_grav_pos + 1
        if player_y > 200 then player_y = 16
    endif


    is_grounded = 0

    if pldy = MUP
        ' Check TOP edge - 2 points (left-top and right-top corners)
        ty = player_y >> 3

        ' Left-top corner
        tx = (player_x + 2) >> 3
        tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
        if tile > 0 or player_y < 4 
            player_y = oldpy
        else
            ' Right-top corner
            tx = (player_x + PLAYER_W) >> 3
            tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
            if tile > 0 
                player_y = oldpy
            endif
        endif
    else
        ' Check BOTTOM edge - 3 points (left, center, right)
        ty = (player_y + PLAYER_H) >> 3
        dim landed as ubyte = 0

        ' Left-bottom corner
        tx = (player_x + 2) >> 3
        tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
        if tile > 0 
            if tile < 3 
                game_state = STATE_PLAYERDIE  ' spike hit
                return
            endif
            landed = 1
        endif

        ' Center-bottom (catches single tiles in middle)
        tx = (player_x + 8) >> 3
        tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
        if tile > 0 
            if tile < 3 
                game_state = STATE_PLAYERDIE
                return
            endif
            landed = 1
        endif

        ' Right-bottom corner
        tx = (player_x + PLAYER_W) >> 3
        tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
        if tile > 0 
            if tile < 3 
                game_state = STATE_PLAYERDIE
                return
            endif
            landed = 1
        endif

        if landed = 1 
            player_y = oldpy
            is_grounded = 1
            jump = 0 : jump_pos = 0
        endif
    endif

    ' horizontal checks 

    if pldx = MLEFT 
        ' Check LEFT edge - 2 points (top-left and bottom-left)
        tx = player_x >> 3

        ' Top-left
        ty = (player_y + 2) >> 3
        tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
        if tile > 0 
            player_x = oldpx
        else
            ' Bottom-left - with corner nudge check
            ty = (player_y + PLAYER_H) >> 3
            tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
            if tile > 0 
                if is_grounded = 0 and tile > 2 and (player_y band 7) < NUDGE_PIXELS 
                    ' Corner nudge - snap player up onto platform
                    player_y = (ty << 3) - PLAYER_H - 2
                else
                    player_x = oldpx
                endif
            endif
        endif

    elseif pldx = MRIGHT 
        ' Check RIGHT edge - 2 points (top-right and bottom-right)
        tx = (player_x + PLAYER_W + 2) >> 3

        ' Top-right
        ty = (player_y + 2) >> 3
        tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
        if tile > 0 
            player_x = oldpx
        else
            ' Bottom-right - with corner nudge check
            ty = (player_y + PLAYER_H) >> 3
            tile = peek(mapbuffer + (cast(uinteger, ty) * 40) + cast(uinteger,tx))
            if tile > 0 
                if is_grounded = 0 and tile > 2 and (player_y band 7) < NUDGE_PIXELS 
                    ' Corner nudge - snap player up onto platform
                    player_y = (ty << 3) - PLAYER_H - 2
                else
                    player_x = oldpx
                endif
            endif
        endif
    endif

end sub

sub read_level(level as ubyte=0)
    ' iterate through the map data and sniff out the control blocks.
    ' this was rewritten for a cleaner implementation. 
    ' the original code relied on a stream of bytes for each item
    ' it was much easier to integrate positioning into the level
    ' layout. 

    ''-Console("Loading level "+str(level))

    dim tile        as ubyte = 0 
    dim p_c         as ubyte = 0        ' present count 
    dim p_s         as ubyte = 0        ' sprite count
    dim r           as ubyte = 0        ' remove tile flag
    dim xx, yy      as ubyte  
    dim d           as ubyte = 0 

    items = 0 

    for yy = 1 to 24                            ' skip first line 
    for xx = 0 to 39

        tile = peek(map_address+(cast(uinteger,yy)*40)+cast(uinteger,xx))
        ''-Console(Str(b00+(cast(uinteger,yy)*40)+cast(uinteger,xx)))
          
        if tile = 3                             ' player start 
            '-Console("Adding Player Start "+str(xx)+","+str(yy))
            player_x = xx * 8
            player_y = yy * 8
            r = 1 
        elseif tile = 4                         ' present 
            '-Console("Adding Present "+str(xx)+","+str(yy))
            aPresents(p_c,0) = xx * 8 
            aPresents(p_c,1) = yy * 8 
            p_c = p_c + 1 
            items = items + 1 
            r = 1                               ' trigger tile removal 
        elseif tile = 5 or tile = 6             ' robin 
            '-Console("Adding Robin "+str(xx)+","+str(yy))
            aSprites(p_s,0) = xx * 8 
            aSprites(p_s,1) = yy * 8 
            aSprites(p_s,2) = 8                 ' robin sprite 
            if tile = 5 
                aSprites(p_s,4) = 1             ' robin sprite facing right 
            else  
                aSprites(p_s,4) = 0             ' robin sprite facing left 
            endif 
            aSprites(p_s,3) = 1                 ' baddie type 
            p_s = p_s + 1 
            r = 1                               ' trigger tile removal 
        elseif tile = 7         ' up / down tree 
            '-Console("Adding Tree "+str(xx)+","+str(yy))
            aSprites(p_s,0) = xx * 8 
            aSprites(p_s,1) = yy * 8 
            aSprites(p_s,2) = 10               ' tree sprite
            aSprites(p_s,4) = 0                 ' direction 
            aSprites(p_s,3) = 2                 ' enemy type (2=tree)
            p_s = p_s + 1 
            r = 1                               ' trigger tile removal 
        elseif tile = 8 
            '-Console("Adding Cube "+str(xx)+","+str(yy))
            aSprites(p_s,0) = xx * 8 
            aSprites(p_s,1) = yy * 8 
            aSprites(p_s,2) = 16               ' cube sprite
            aSprites(p_s,4) = 0                 ' direction
            aSprites(p_s,6) = d                 ' direction 
            aSprites(p_s,3) = 3                 ' enemy type (3=cube)
            d = 1 - d                           ' flip flop d 0/1 
            p_s = p_s + 1 
            r = 1                               ' trigger tile removal 
        elseif tile = 9 
            '-Console("Adding Snowman "+str(xx)+","+str(yy))
            aSprites(p_s,0) = xx * 8 
            aSprites(p_s,1) = yy * 8 
            aSprites(p_s,2) = 14               ' snowman sprite
            aSprites(p_s,4) = d                 ' direction  
            aSprites(p_s,3) = 4                 ' enemy typ (4=snowman)
            d = 1 - d                           ' flip flop d 0/1 
            p_s = p_s + 1 
            r = 1 
        endif 
        
        if r = 1                                ' remove tile 
            poke (map_address+(cast(uinteger,yy)*40)+cast(uinteger,xx)),0
            r = 0 
        endif 

    next xx 
    next yy


    ' fetch the level title from the @LevelData at the end of the program

    dim level_data_str  as uinteger
    dim b_type          as ubyte 

    ' point to correct level string in RAM
    level_data_str = peek(uinteger, @LevelData+cast(uinteger,level<<1))            ' points to jumptable
    title$=""
    
    ' peek into titel$
    do 
        b_type = peek(level_data_str)
        if b_type <> $ff  
            title$=title$+chr(b_type)
        else 
            exit do 
        endif 
        level_data_str = level_data_str + 1 
    loop 


end sub 

sub next_level()

        ' next level, shows snowman across screen to clear tilemap

        dim frame_          as ubyte = 0 
        dim frame_timer     as ubyte = 3
        dim clipx           as ubyte = 0         

        ' WaitKey()

        game_state = STATE_GAMESTART

        clear_sprites()

        NextReg(SPRITE_TRANSPARENCY_I_NR_4B,0)

        ' show the giant snowman

        for x = 386 to 810 step 4 

            WaitRetrace(10)

            UpdateSprite(x,48,0,13+(frame_),0,%00011110)             
            
            ClipTile(clipx,255,0,255)

            if clipx < 255 : clipx = clipx + 2 : endif 

            if frame_timer = 0 
                if frame_ < 2 : frame_ = frame_ + 1 : else : frame_ = 0 : end if 
                frame_timer = 4
            else
                frame_timer = frame_timer - 1
            endif 

        next x 

        NextReg(SPRITE_TRANSPARENCY_I_NR_4B,0)

end sub  

sub clear_sprites()

        ' remove all sprite arrays
        ' setting x = 0 will disable 

        for c = 0 to 15 
            aSprites(c,0) = 0           ' clear all baddies       
            aPresents(c>>1,0)=0         ' remove all presents
        next c
        for c = 0 to 63
            RemoveSprite(c,1)           ' remove all sprites
        next c

end sub 


sub death_moves()
    
    ' shake player up and down 

    PlaySFX(1)
    current_frame = 3

    ' create a small up/down motion when hit 
    dim ny as ubyte 
    for y = 0 to 16 
        ny=peek(@jump_table+cast(uinteger,y))
        UpdateSprite(player_x,player_y-cast(ubyte,ny),63,player_start_frame+current_frame,flip,0)
        WaitRetrace(10)
    next       

    ' now slide player down screen 
    ny = 0

    while player_y<191
        if y < 2 : y = y + 1 :endif 
        ny= ny + 1 + y mod 2
        player_y=player_y+cast(ubyte,ny)
        ' flies down screen
        UpdateSprite(player_x,player_y,63,player_start_frame+current_frame,flip,0)
        WaitRetrace(15)
    wend 

    game_state = STATE_GAMESTART' restart level
    current_frame = 0           ' ensure player frame is reset

    WaitRetrace(500)            ' let it sink in
        
end sub 

sub show_game_over()
    asm 
        ; Turns off the tilemap 
        nextreg TILEMAP_CONTROL_NR_6B,%00100001				;' Tilemap Control off & on top of ULA,  40x32
        nextreg SPRITE_CONTROL_NR_15,0                  
    end asm

    dim text$ = "Score : "+str(score)

    PlaySFX(7)
        
    ClearLayer2(0)

    L2Text(16-4,11,"GAME OVER",32,0) 
    L2Text(16-(len(text$)>>1),13,text$,33,0) 

    WaitKey()

    ClearLayer2(0)

end sub 

LoadSDBank("logo_0014-160x80.nxi",0,0,0,44)         ' 12800

sub display_hud()
    
    DrawImage(0,192-24,@banner_img,0)

    L2Text(2,21,"HI",32,0)
    L2Text(4,21,RSet(str(hiscore), 7),33,255)

    L2Text(12,21,"L-",32,0)
    L2Text(14,21,str(lives),33,0)

    'L2Text(16,21,"T-",32,0)

    L2Text(18,21,str(level_time),33,0)

    L2Text(21,21,"SC",32,0)
    L2Text(23,21,RSet(str(score), 7),33,0)

    Return

banner_img:
    asm ;  bnk  w    h
        db 46, 256, 16 
        ds 2, 0 
    end asm 
end sub 

sub update_scores()

    ' updates the scores and detects new hiscore 
    if score >= hiscore 
        hiscore = score 
        L2Text(4,21,RSet(str(hiscore), 7),33,255)
        best$(10) = RSet(str(hiscore), 7)
    endif 

    L2Text(23,21,RSet(str(score), 7),33,255)

end sub 

function RSet(txt as string, chars as ubyte) as string
    ' Pads the text with 0s to the left
    ' eg score = 100, chars = 7  -> "0000100"

    dim result as string
    dim txt_len as ubyte
    dim padding as ubyte
    dim i       as ubyte 

    txt_len = len(txt)

    ' If text is already longer than desired length, return as-is
    if txt_len >= chars 
        return txt
    endif

    ' Calculate how many zeros we need
    padding = chars - txt_len

    ' Build the padded string
    result = ""
    for i = 1 to padding
        result = result + "0"
    next i
    result = result + txt

    return result
end function 

sub UpdateItems()
    
    '//MARK: Check presents and update when collected 
    
    dim x , y as uinteger
    for c = 0 to 4
        x = cast(uinteger,aPresents(c,0))
        y = cast(uinteger,aPresents(c,1))
        if x - 32 > 0 
            if CheckBBoxCollision(cast(uinteger,x), y, 16, 16, player_x, player_y, 16, 16, 2) = 1 
                ' Collision detected! Handle hit here
                '-Console("Present "+str(c))
                aPresents(c,0) = 0                      ' x  0 do not display
                items = items - 1 
                RemoveSprite(32+c,1)
                score = score + 200 + (cast(ulong,bonus_timer)*10)   ' 
                update_scores()
                PlaySFX(2)
                bonus_timer = 100
            else 
                UpdateSprite(x,y,32+c,22+(global_tick mod 5),0,0)
            endif
            
        endif 
    next 
end sub 

sub UpdateBaddies()
    
    ' handles moving each sprite type 

    dim p,d,img,y,pma,pmb,spattr3,tile,type,ty,y1,size,y2,mo as ubyte 
    dim s,t as ubyte 
	dim x,add,lt,rt as uinteger

    ' p is sprite element

    while p < MAX_SPRITES-1             
        
        if aSprites(p,0) > 0         ' is it endable 
            x = aSprites(p,0)
           	' 		if (aSprites(p,0) band 2) = 2
			' 	x = x + 255
			' endif 
			y = aSprites(p,1)               ' y position
			img = aSprites(p,2)             ' sprite image 
			type = aSprites(p,3)            ' baddie type 
			d = aSprites(p,4)				' pma direction 
			s = aSprites(p,5)				' pmb active (will move) 
            t = aSprites(p,6)               ' pmc travel
            ' mo = aSprites(p,7)              ' pmd travel

            spattr3 = d << 3

            ' bounding box collision with player_x, player_y
            ' Assuming sprites are 16x16, soft=2 for softer edges, or 0 for precise collision
            if CheckBBoxCollision(cast(uinteger,x), y, 16, 16, player_x, player_y, 16, 16, 2) = 1 
                
                ' Collision detected! set game_state to hit

                game_state = STATE_PLAYERDIE' player has been hit

            endif

            ' process the enemy type

            if type = 1                     ' robin - horizontal wall bouncingg
                if s = SPRITE_ACTIVE
                    if d = 0
                        ' '-Console("Processed")

                        if IsBlock((x+16)>>3,(y)>>3)=0 and ((x+12)>>3)<>SCREEN_RIGHT_BOUNDARY
                            x = x + 1       ' mover right 
                        else                            
                            aSprites(p,4 ) = 1 
                            x = x - 1 
                        endif 
                    else                        
                        if IsBlock((x)>>3,y>>3)=0
                            x = x - 1 
                        else 
                            aSprites(p,4 ) = 0
                            x = x + 1 
                        endif 
                    endif 
                    aSprites(p,0 ) = x 
                    aSprites(p,5 ) = SPRITE_INACTIVE

                else 
                    aSprites(p,5) = SPRITE_ACTIVE
                endif 

                mo = 2

            elseif type = 2 ' tree - vertical bouncing 
                if s = SPRITE_ACTIVE
                    if d = 0
            '            if IsBlock((x+16)>>3,(y)>>3)=0 or x = 255
                        if IsBlock((x)>>3,(y+16)>>3)=0 ' and ((cast(uinteger,x))>>3)<SCREEN_RIGHT_BOUNDARY
                            y = y + 1       ' mover up 
                        else                            
                            t = aSprites(p,7)
                            aSprites(p,4 ) = 1 
                            y = y - 1 
                        endif 
                    else                        
                        if IsBlock((x)>>3,(y-8)>>3)=0
                            y = y - 1 
                        else 
                            aSprites(p,4 ) = 0
                            y = y + 1 
                        endif 
                    endif 
                    aSprites(p,1 ) = y
                    aSprites(p,5 ) = SPRITE_INACTIVE
                else 
                    aSprites(p,5) = SPRITE_ACTIVE
                endif 

                mo = 3
            elseif type = 3 ' cube - diagonal bouncing
                if s = SPRITE_ACTIVE
                    ' I hate this movement as its inperfect
                    ' diagonal movement with independent X and Y bouncing
                    ' d = vertical direction (0=up, 1=down) stored in aSprites(p,4)
                    ' t = horizontal direction (0=left, 1=right) stored in aSprites(p,6)

                    ' Handle vertical movement
                    if d = 0
                        ' moving up - check collision above
                        if IsBlock((x+4)>>3,(y)>>3)=0
                            y = y - 1       ' move up
                        else
                            aSprites(p,4 ) = 1  ' bounce - change to down
                            y = y + 1
                        endif
                    else
                        ' moving down - check collision below (sprite is 16px tall)
                        if IsBlock((x+4)>>3,(y+16)>>3)=0
                            y = y + 1       ' move down
                        else
                            aSprites(p,4 ) = 0  ' bounce - change to up
                            y = y - 1
                            
                        endif
                    endif

                    ' Handle horizontal movement
                    if t = 0
                        ' moving left - check collision on left
                        if IsBlock((x)>>3,(y+4)>>3)=0 
                            x = x - 1       ' move left
                        else
                            aSprites(p,6 ) = 1  ' bounce - change to right
                            x = x + 1
                        endif
                    else
                        ' moving right - check collision on right (sprite is 16px wide)
                        if IsBlock((x+16)>>3,(y+4)>>3)=0 and ((cast(uinteger,x)+10)>>3)<>SCREEN_RIGHT_BOUNDARY
                            x = x + 1       ' move right
                        else
                            aSprites(p,6 ) = 0  ' bounce - change to left
                            x = x - 1
                        endif
                    endif
                    aSprites(p,1 ) = y
                    aSprites(p,0 ) = x
                    aSprites(p,5 ) = SPRITE_INACTIVE
                else
                    aSprites(p,5) = SPRITE_ACTIVE
                endif 
                mo = 5
            elseif type = 4 ' snowman - left right along floor
                if s = SPRITE_ACTIVE
                    if d = 1
                        ' moving left - check collision on left side and floor ahead
                        if IsBlock((x)>>3,(y+4)>>3)=0 and IsBlock((x)>>3,(y+16)>>3)>0
                            x = x - 1       ' move left
                        else
                            aSprites(p,4 ) = 0  ' bounce - change to right
                            x = x + 1
                        endif
                    else
                        ' moving right - check collision on right side and floor ahead
                        if IsBlock((x+16)>>3,(y+4)>>3)=0 and ((x+16)>>3)<>SCREEN_RIGHT_BOUNDARY and IsBlock((x+16)>>3,(y+16)>>3)>0
                            x = x + 1       ' move right
                        else
                            aSprites(p,4 ) = 1  ' bounce - change to left
                            x = x - 1
                        endif
                    endif
                    aSprites(p,1 ) = y
                    aSprites(p,0 ) = x
                    aSprites(p,5 ) = SPRITE_INACTIVE   ' s
                else
                    aSprites(p,5) = SPRITE_ACTIVE
                endif
                mo = 2
            endif 
            UpdateSprite(cast(uinteger,x),y,p,img+(global_tick mod mo),d<<3,0)
        endif 
        
        p=p+1

    wend 
end sub

sub save_scores()
    ' save the scores array
    ''-Console("Saving scores... "+str(peek(uinteger,@save_times)))

    ' The only reliable way I could find is to copy the best$() array
    ' entries to a save buffer 
    ' each entry is "SS.CS" eg "10.25"

    addr  = @save_times                             ' point addr to the buffer 
    st_add = addr                                   ' take a copy of the address

    dim x,i   as ubyte 

    for x = 0 to 10                                 ' 10 best$() times 
        buff$=best$(x)                              ' get best$() into buff$
        
        for i = 0 to 4                              ' poke 5 chars into the buffer
            ' 0 1 2 3 4
            poke(addr,XorA(code buff$(i),255-x))    ' use XorA to obfustcate data 
            'poke(addr,code buff$(i))    
            addr = addr + 1                         ' move along the buffer
        next i 
    next x 

    ' and the hiscore 
    poke ulong addr,hiscore                         ' save the 32bit hiscore 4 bytes

    addr = addr + 4

    ' save the blob of data
    SaveSD("Crimbo.dat",st_add,addr-st_add)                 ' save the buffer to sd card

end sub 


sub load_scores()
    ' loads back in the best$() array and hiscore from 
    ' the memory buffer @ save_times (at end of the program)

    addr  = @save_times                         ' point addr to buffer in ram
    ' st_add = addr                               ' take a copy of address for s
    
    ''-Console("Loading scores... "+str(addr))
     
    LoadSD("Crimbo.dat",addr,200,0)           
    
    if peek(ubyte,@file_result)<255               ' check the file exists
        Console("save file found "+str(peek(ubyte,@file_result)))                                        ' @filesize will be populated when LoadSD succeeds
        dim x,i   as ubyte 
        dim c     as ubyte 

        for x = 0 to 10                         ' there are 10 best$()
            for i = 0 to 4                      ' each 5 chars in lenght
                c=XorA(peek(addr),255-x)        ' deobfuscate byte 
                'c=peek(addr)
                if c>0 
                    buff$(i)=chr(c)             ' construct buff$(n)
                endif 
                addr = addr + 1                 ' move along buffer address
            next i 
            best$(x)=buff$                      ' set best$(n) to the buffer
        next x 
        if peek (ulong, addr) >10000
            hiscore = peek (ulong, addr)            ' set hiscore from buffer 
        endif 
    else 
        Console("No save file")
    endif

end sub 

function StrToVal(in_string as string) as uinteger
    ' Converts string "SS.CC" to centiseconds (uinteger)
    ' An aletnative to using ZXBASICS Val routine that uses 
    ' the ROM calculator - which can cause CSpect to crash!
    ' e.g., "10.25" -> 1025, "5.5" -> 550, "123" -> 12300
    ' Max value: 655.35 seconds (65535 centiseconds)
    asm
        ; BREAK
        ld      l,(ix+4)
        ld      h,(ix+5)            ; HL points to string descriptor

        ; Get string length into BC
        ld      c,(hl)
        inc     hl
        ld      b,(hl)
        inc     hl                  ; HL now points to first character

        ; Initialize
        ld      de,0                ; DE = result accumulator
        xor     a
        ld      (.stv_dec_count),a  ; decimal digit counter (0 = before decimal)

        ; Check for empty string
        ld      a,b
        or      c
        jr      z,.stv_finalize

.stv_parse_loop:
        ; Check if we've processed all characters
        ld      a,b
        or      c
        jr      z,.stv_finalize

        ; Get next character
        ld      a,(hl)
        inc     hl
        dec     bc

        ; Check for decimal point
        cp      '.'
        jr      nz,.stv_not_decimal

        ; Found decimal point - set counter to 1
        ld      a,1
        ld      (.stv_dec_count),a
        jr      .stv_parse_loop

.stv_not_decimal:
        ; Check if it's a digit (0-9)
        cp      '0'
        jr      c,.stv_finalize     ; < '0', end parsing
        cp      '9'+1
        jr      nc,.stv_finalize    ; > '9', end parsing

        ; Check if we've already got 2 decimal digits
        push    af
        ld      a,(.stv_dec_count)
        cp      3                   ; already have 2 decimal digits?
        jr      nc,.stv_skip_digit  ; yes, ignore further digits

        ; Update decimal counter if we're past the decimal point
        or      a
        jr      z,.stv_no_inc_dec
        inc     a
        ld      (.stv_dec_count),a
.stv_no_inc_dec:
        pop     af

        ; Convert ASCII to value
        sub     '0'                 ; A = digit value 0-9

        ; DE = DE * 10 + digit
        push    hl
        push    bc
        push    af                  ; save digit

        ; DE * 10 = DE * 8 + DE * 2
        ld      h,d
        ld      l,e                 ; HL = DE
        add     hl,hl               ; HL = DE * 2
        push    hl                  ; save DE * 2
        add     hl,hl               ; HL = DE * 4
        add     hl,hl               ; HL = DE * 8
        pop     de                  ; DE = DE * 2
        add     hl,de               ; HL = DE * 10

        ; Add digit
        pop     af                  ; restore digit
        ld      e,a
        ld      d,0
        add     hl,de
        ex      de,hl               ; DE = new value

        pop     bc
        pop     hl
        jr      .stv_parse_loop

.stv_skip_digit:
        pop     af                  ; discard saved digit
        jr      .stv_parse_loop

.stv_finalize:
        ; Pad with zeros if needed to make centiseconds
        ; dec_count: 0=no decimal, 1=decimal seen, 2=one digit, 3=two digits
        ld      a,(.stv_dec_count)

        ; If no decimal (0), multiply by 100
        or      a
        jr      z,.stv_mult100

.stv_check_one:
        ; If decimal seen but no digits after (1), multiply by 100
        cp      1
        jr      z,.stv_mult100

        ; If one decimal digit (2), multiply by 10
        cp      2
        jr      nz,.stv_done

        ; Multiply DE by 10
        ld      h,d
        ld      l,e
        add     hl,hl               ; *2
        push    hl
        add     hl,hl               ; *4
        add     hl,hl               ; *8
        pop     de
        add     hl,de               ; *10
        ex      de,hl
        jr      .stv_done

.stv_mult100:
        ; Multiply DE by 100 = 64 + 32 + 4
        ld      h,d
        ld      l,e                 ; HL = DE (*1)
        add     hl,hl               ; *2
        add     hl,hl               ; *4
        push    hl                  ; save *4
        add     hl,hl               ; *8
        add     hl,hl               ; *16
        add     hl,hl               ; *32
        push    hl                  ; save *32
        add     hl,hl               ; *64
        pop     de                  ; DE = *32
        add     hl,de               ; HL = *96
        pop     de                  ; DE = *4
        add     hl,de               ; HL = *100
        ex      de,hl
        jr      .stv_done

.stv_done:
        ; Return result in HL (ZX BASIC uinteger return)
        ex      de,hl
        jp      .stv_return

        ; Local variable
.stv_dec_count: defb 0

.stv_return:
    end asm
end function

function fastcall XorA(inbyte as ubyte, xorvalue as ubyte) as ubyte
    asm 
        ; Does a BITWISE XOR on the inbyte with a seed xorvalue
        ;
        ex      (sp),hl
        pop     bc
        pop     bc 
        xor     b
        push    hl 
    end asm 
end function 

' text in normal strings can end up taking up lots of space
' so I manually handle strings. fetch_intro_msg() uses this

' level names 
LevelData:
asm 
    dw LEVEL1
    dw LEVEL2
    dw LEVEL3
    dw LEVEL4
    dw LEVEL5
    dw LEVEL6
    dw LEVEL7
    dw LEVEL8
    dw LEVEL9
    dw LEVEL10

    LEVEL1:
        db "The Candy Shop"
        db $ff 
    LEVEL2:
        db "Santas Outhouse"
        db $ff 
    LEVEL3:
        db "The Freezer"
        db $ff 
    LEVEL4:
        db "Rockin Robins Nest"
        db $ff 
    LEVEL5:
        db "The Elf Dormitory"
        db $ff 
    LEVEL6:
        db "The Frozen Furnace"
        db $ff 
    LEVEL7:
        db "Rudolfphs Bedroom"
        db $ff 
    LEVEL8:
        db "Candy Cane Chimney"
        db $ff 
    LEVEL9:
        db "The Living Room"
        db $ff 
    LEVEL10:
        db "The Games Room"
        db $ff 
end asm 

' intro text 
Messages:
asm 

        dw  message01
        dw  message02
        dw  message03
        dw  message04
        dw  message05
        dw  message06
        dw  message07
        dw  message08
        dw  message09
        
    message01:
        db "An unnoffical port of the",$13,"ZX Spectrum "
        db "game by",$13," Little Shop Of Pixels",$ff
    message02:
        db "ZX Spectrum Next Port by em00k",$13
        db "Music by kulor 2oo9",$ff
    message03:
        db "Graphics ported and Levels",$13
        db "ported from Blackjet DOS port",$ff
    message04:
        db "Controls WASD and Space",$13
        db "or Kempston/MD1",$13
        db "M toggle music, P pause",$ff
    message05:
        db "Written using NextBuild Studio",$13
        db "Zxnext.uk/nextbuildstudio",$ff
    message06:
        db "Powered by Boriels ZX Basic",$13
        db "https://zxbasic.readthedocs.io/",$ff
    message07:
        db "Original Authors : Simon Franco",$13
        db "Andrew Oakley & AJH",$ff
    message08:
        db "Released 18 Jan 2026 v1.1",$13
        db "Started 22-12-2025",$ff
    message09:
        db "Written over XMAS period",$13
        db "but, I missed the deadline",$ff

end asm         

    
completed_text:
asm 
        dw  c_message01

c_message01:
        ;  [                                ]
        db "Well done on finding all of the",$13
        db "presents those cheeky helpers",$13
        db "hid! All the children eventually",$13
        db "got their ZX Spectrum Nexts for",$13
        db "Christmas 2026!",$ff
end asm 

' used for death movement 
jump_table:
    asm 
        db 0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6,  5, 4, 3, 2, 1, 255
    end asm 

jump_gravity:
    asm 
        db 0,1,2,1,2,2,2,2
    end asm 
' a contiguous buffer for saving data
save_times:
    asm 
        incbin "data/Crimbo_def.dat",0
        ds 100,$00
    end asm 
save_times_end:

' that's the end of it....