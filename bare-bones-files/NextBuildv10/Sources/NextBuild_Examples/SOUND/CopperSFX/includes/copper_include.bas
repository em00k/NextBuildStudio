' CopperSFX include for NextBuild / ZX Spectrum Next.
' BASIC wrapper by em00k, based on KevB / 9bitColor's COPAUDIO player.
'
' Public use:
'   1. Include this file after nextlib.bas so the Next registers are defined.
'   2. Define an asm label named copper_sample_table in your program.
'   3. Call InitCopperAudio() once.
'   4. Optional: call CopperAudioSetDac(dac_register) to choose output:
'        DAC_B_MIRROR_NR_2C         left DAC
'        SOUNDDRIVE_DF_MIRROR_NR_2D legacy SpecDrum/SoundDrive mirror
'        DAC_C_MIRROR_NR_2E         right DAC
'   5. Call PlayCopperSample(sample_index) to start a sample.
'   6. In your IM2/custom ISR call PlayCopperAudio(), then SetCopperAudio().
'      CopperAudioUpdate() is a shorthand for those two ISR calls.
'
' copper_sample_table entries are 6 bytes each:
'   dw bank_and_loop, start_offset, sample_length
'
' bank_and_loop:
'   high byte = first 8K RAM bank to map at $0000
'   low byte  = loop count, where 0 loops forever and 1 plays once
'
' start_offset is 0..16383 inside the two mapped 8K banks. Keep each sample
' inside bank/bank+1, or split larger samples into separate table entries.
'
' Example table:
'   asm
'   copper_sample_table:
'       dw $3901, 0, 3915
'       dw $3A01, 0, 3916
'   end asm

CopperSample()

sub fastcall InitCopperAudio()
    asm
        ld      bc,TBBLUE_REGISTER_SELECT_P_243B
        ld      a,VIDEO_TIMING_NR_11
        out     (c),a
        inc     b
        in      a,(c)
        and     7                           ; 0..6 VGA / 7 HDMI
        ld      (.CopperSample.video_timing),a

        nextreg COPPER_CONTROL_LO_NR_61,$00
        nextreg COPPER_CONTROL_HI_NR_62,$00
        nextreg COPPER_DATA_NR_60,$FF
        nextreg COPPER_DATA_NR_60,$FF

        ld      a,SOUNDDRIVE_DF_MIRROR_NR_2D
        ld      (.CopperSample.sample_dac_on),a
        ld      (.CopperSample.sample_dac),a
    end asm
end sub

sub fastcall PlayCopperSample(sample as ubyte)
    asm
        ld      hl,copper_sample_table
        ld      e,a
        ld      d,6
        mul     d,e
        add     hl,de

        ld      (.playerstack+1),sp
        ld      sp,hl

        pop     hl
        ld      (.CopperSample.sample_loop),hl

        pop     hl
        ld      (.CopperSample.sample_ptr),hl

        pop     hl
        ld      (.CopperSample.sample_len),hl

        ld      hl,0
        ld      (.CopperSample.sample_pos),hl

        ld      a,(.CopperSample.sample_dac_on)
        ld      (.CopperSample.sample_dac),a

    playerstack:
        ld      sp,0
    end asm
end sub

sub fastcall CopperAudioSetDac(dac_register as ubyte)
    asm
        ld      (.CopperSample.sample_dac_on),a
        ld      (.CopperSample.sample_dac),a
    end asm
end sub

sub fastcall StopCopperSample()
    asm
        xor     a
        ld      (.CopperSample.sample_dac),a
    end asm
end sub

sub fastcall ResumeCopperSample()
    asm
        ld      a,(.CopperSample.sample_dac_on)
        ld      (.CopperSample.sample_dac),a
    end asm
end sub

sub fastcall SetCopperAudio()
    asm
        call    CopperSample.set_copper_audio
    end asm
end sub

sub fastcall PlayCopperAudio()
    asm
        call    CopperSample.play_copper_audio
    end asm
end sub

sub fastcall CopperWaitLine()
    asm
        ld      bc,TBBLUE_REGISTER_SELECT_P_243B
        ld      de,($1E*256)+$1F

        out     (c),d                       ; MSB
        inc     b

    .msb:
        in      d,(c)
        bit     0,d                         ; 256..312/311/262/261 ?
        jp      nz,.msb

        dec     b
        out     (c),e                       ; LSB
        inc     b

    .lsb:
        in      e,(c)
        cp      e
        jp      nz,.lsb
    end asm
end sub

' Alternative names for new code. The original names above are kept so old
' projects continue to build.
sub fastcall CopperAudioInit()
    InitCopperAudio()
end sub

sub fastcall CopperAudioPlaySample(sample as ubyte)
    PlayCopperSample(sample)
end sub

sub fastcall CopperAudioUseSpecDrumDac()
    asm
        ld      a,SOUNDDRIVE_DF_MIRROR_NR_2D
        ld      (.CopperSample.sample_dac_on),a
        ld      (.CopperSample.sample_dac),a
    end asm
end sub

sub fastcall CopperAudioUseLeftDac()
    asm
        ld      a,DAC_B_MIRROR_NR_2C
        ld      (.CopperSample.sample_dac_on),a
        ld      (.CopperSample.sample_dac),a
    end asm
end sub

sub fastcall CopperAudioUseRightDac()
    asm
        ld      a,DAC_C_MIRROR_NR_2E
        ld      (.CopperSample.sample_dac_on),a
        ld      (.CopperSample.sample_dac),a
    end asm
end sub

sub fastcall CopperAudioStopSample()
    StopCopperSample()
end sub

sub fastcall CopperAudioResumeSample()
    ResumeCopperSample()
end sub

sub fastcall CopperAudioUpdate()
    asm
        call    CopperSample.play_copper_audio
        call    CopperSample.set_copper_audio
    end asm
end sub

sub fastcall CopperAudioWaitLine()
    CopperWaitLine()
end sub


sub fastcall CopperSample()
    asm
    push namespace CopperSample

    ; Banked NextBuild adaptation of the COPAUDIO copper sample player.
    ; This engine generates one mono PCM write per scanline. The target DAC
    ; register is configurable, but the copper list is still a single voice.

    COPPER_DATA                     equ $60
    COPPER_CONTROL_LO_BYTE_REGISTER equ $61
    COPPER_CONTROL_HI_BYTE_REGISTER equ $62
    CONFIG1                         equ $05
    COPHI                           equ $62
    COPLO                           equ $61
    SELECT                          equ $243b

    set_copper_audio:
        ld      (.stack+1),sp

        ld      ix,copper_loop              ; Auto detect timing

        ld      bc,SELECT
        ld      a,CONFIG1
        out     (c),a
        inc     b
        in      a,(c)                       ; Peripheral 1 register

        ld      hl,hdmi_50_config
        ld      de,vga_50_config
        bit     2,a
        jr      z,.refresh                  ; Refresh 50/60hz ?
        ld      hl,hdmi_60_config
        ld      de,vga_60_config
    .refresh:
        ld      a,(video_timing)
        cp      7                           ; HDMI ?
        jr      z,.hdmi
        ex      de,hl                       ; Swap to VGA
    .hdmi:
        ld      a,(hl)                      ; Copper line
        inc     hl
        ld      (.return+1),a               ; Store return value

        ld      sp,hl

        ld      hl,(sample_len)             ; Calc buffer loop offset
        ld      bc,(sample_pos)
        xor     a                           ; Clear CF
        sbc     hl,bc

        ld      b,h
        ld      c,l                         ; BC = loop offset (0..311)

        pop     hl                          ;  Samples per frame (312)
        ld      (video_lines),hl

        ld      a,h                         ; 16 bit negate
        cpl
        ld      h,a
        ld      a,l
        cpl
        ld      l,a
        inc     hl                          ; Samples per frame (-312)

        ld      a,20                        ; No loop (Out of range)

        add     hl,bc
        jp      c,.no_loop

        ld      a,c                         ; Loop offset / 16
        and     %11110000
        or      b
        swapnib
    .no_loop:
        ld      b,a                         ; B = 0..19 (20 no loop)

        ld      a,c
        and     %00001111
        ld      c,a
        ld      hl,.zone+1                  ; Build control table
        pop     de
        ld      (hl),e                      ; Split
        ld      a,d                         ; Count

        pop     hl                          ; 0..15 samples routine

        ld      (copper_audio_config+1),sp  ; **PATCH**

        ld      sp,copper_audio_stack

        cp      b
        jr      nz,.skip                    ; Loop 0..15 samples ?

        ex      af,af'

        ld      e,c                         ; 0..7
        ld      d,9
        mul     d,e                         ; 0..144
        ld      a,144                       ; 144..0
        sub     e

        add     hl,de
        push    hl
        push    ix                          ; Output loop
        ld      de,copper_out16
        add     de,a
        push    de

        ex      af,af'

        jr      .next

    .skip:
        push    hl                          ; Output normal

    .next:
        ld      hl,copper_out16             ; 16 samples routine
        dec     a

    .zone:
        cp      7
        jp      nz,.no_split

        ld      de,copper_split
        push    de                          ; Output Split
    .no_split:
        cp      b
        jp      nz,.no_zone                 ; Loop 16 samples ?

        ex      af,af'

        ld      e,c                         ; 0..15
        ld      d,9
        mul     d,e                         ; 0..144
        ld      a,144                       ; 144..0
        sub     e

        add     de,copper_out16
        push    de
        push    ix                          ; Output loop
        ld      de,copper_out16
        add     de,a
        push    de

        ex      af,af'

        jr      .zone_next

    .no_zone:
        push    hl                          ; Output normal

    .zone_next
        dec     a
        jp      p,.zone

        ld      (copper_audio_control+1),sp ; **PATCH**

    .return
        ld      a,0                         ; Copper line to wait for

    .stack
        ld      sp,0

        ret


    ; **MUST CALL EACH FRAME AFTER WAITING FOR LINE A FROM SET_COPPER_AUDIO**
    ; Build copper list to output one frame of sample data to DAC.

    play_copper_audio:

        getreg($50) : ld (playbankout+3),a
        getreg($51) : ld (playbankout+7),a

        ld          a,(sample_bank)         ; set sample banks
        nextreg     $50,a
        inc         a
        nextreg     $51,a

        call        play_copper_audio2      ; set copper

    playbankout:
        nextreg     $50,$ff                 ; return roms
        nextreg     $51,$ff

        ret

    play_copper_audio2:

        ld          (play_copper_stack+1),sp

    copper_audio_config:

        ld      sp,0            ; **PATCH**

        pop     hl                          ; Index + VBLANK
        pop     de                          ; Line 180 + command WAIT

        ld      a,l
        nextreg COPLO,a
        ld      a,h
        nextreg COPHI,a

        ld      hl,(sample_ptr)             ; Calc playback position
        ld      bc,(sample_pos)
        add     hl,bc

        ld      bc,SELECT                   ; Port
        ld      a,COPPER_DATA
        out     (c),a
        inc     b

        ld      a,(sample_dac)              ; Register to set (DAC)

    copper_audio_control:
        ld      sp,0                        ; **PATCH**

        ret                                 ; GO!!!

    copper_out16:
        out     (c),d       ;   0 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out15:
        out     (c),d       ;   9 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out14:
        out     (c),d       ;  18 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out13:
        out     (c),d       ;  27 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out12:
        out     (c),d       ;  36 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out11:
        out     (c),d       ;  45 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc de
    copper_out10:
        out     (c),d       ;  54 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out9:
        out     (c),d       ;  63 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out8:
        out     (c),d       ;  72 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out7:
        out     (c),d       ;  81 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out6:
        out     (c),d       ;  90 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out5:
        out     (c),d       ;  99 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out4:
        out     (c),d       ; 108 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out3:
        out     (c),d       ; 117 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc de
    copper_out2:
        out     (c),d       ; 126 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out1:
        out     (c),d       ; 135 BYTES
        out     (c),e
        out     (c),a
        OUTINB
        inc     de
    copper_out0:

        ret         ; 144 BYTES

    copper_split:
        out     (c),d                       ; Terminate
        out     (c),e
        ld      de,32768+0                  ; Line 0 + command WAIT
        nextreg COPPER_CONTROL_LO_BYTE_REGISTER,$00 ; Index
        nextreg COPPER_CONTROL_HI_BYTE_REGISTER,$C0 ; Vblank
        ret         ; GO!!!

    copper_loop:
        ld      hl,sample_dac
        ld      a,(sample_loop)
        and     a
        jr      z,.forever
        dec     a
        jr      nz,.loop
        ld      (hl),0                      ; Copper NOP (mute sound)

    .loop:
        ld      (sample_loop),a

    .forever:
        ld      a,(hl)                      ; Read DAC mute state
        ld      hl,(sample_ptr)
        ret                                 ; GO!!!

    copper_done:
        ld      de,(sample_ptr)
        xor     a
        sbc     hl,de
        ld      (sample_pos),hl             ; Update playback position

    play_copper_stack:
        ld      sp,0
    ;    ei
        ret


    vga_50_config:
        db      187                     ; Copper line 187 (50hz)
        dw      311                     ; Samples per frame
        db      6                       ; Split
        db      7+12                    ; Count
        dw      copper_out7             ; Routine (311-304)
        db      $1C                     ; Index + VBLANK
        db      $C3
        dw      32768+199               ; Line 199 + command WAIT

    vga_60_config:
        db      191                     ; Copper line 191 (60hz)
        dw      264                     ; Samples per frame
        db      3                       ; Split
        db      4+12                    ; Count
        dw      copper_out8             ; Routine (261-256)
        db      $20                     ; Index + VBLANK
        db      $C3
        dw      32768+200               ; Line 197 + command WAIT

    hdmi_50_config:
        db      186                     ; Copper line 186 (50hz)
        dw      312                     ; Samples per frame
        db      6                       ; Split
        db      7+12                    ; Count
        dw      copper_out8             ; Routine (312-304)
        db      $20                     ; Index + VBLANK
        db      $C3
        dw      32768+200               ; Line 200 + command WAIT

    hdmi_60_config:
        db      189                     ; Copper line 189 (60hz)
        dw      262                     ; Samples per frame
        db      3                       ; Split
        db      4+12                    ; Count
        dw      copper_out6             ; Routine (262-256)
        db      $18                     ; Index + VBLANK
        db      $C3
        dw      32768+198               ; Line 198 + command WAIT

    ; Variables.

    sample_ptr:     dw  0           ; 32768
    sample_pos:     dw  0
    sample_len:     dw  0           ; 10181
    sample_dac_on:  db  $2D
    sample_dac:     db  0           ; DAC register, 0 = copper NOP/mute

    sample_loop:    db  0       ; 0..255
    sample_bank:    db  0       ; 0..255

    video_lines:    dw  0       ; 312/311/262/261
    video_timing:   db  0       ; 0..7

        dw  0,0,0,0,0,0,0,0     ;
        dw  0,0,0,0,0,0,0,0     ; Define 23 WORDS
        dw  0,0,0,0,0,0,0       ;

    copper_audio_stack:
        dw  copper_done
    pop namespace

    end asm
end sub
