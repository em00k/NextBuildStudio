' ============================================================================
'  copper_include_2voice_banked.bas  -  RESIDENT STUBS for the banked
'  two-voice Copper engine. The engine itself is copper_engine_2voice.bin
'  (assembled by sjasmplus at ORG $2000). These stubs page that bank into
'  slot 1 ($2000-$3FFF), call the engine's jump-table entry, and page it
'  back out - so only ~100 bytes of copper code stay resident.
'
'  SETUP
'    1. Assemble the engine:  sjasmplus --zxnext copper_engine_2voice.asm
'    2. Put copper_engine_2voice.bin where LoadSDBank finds it (data/).
'    3. Load it into a free 8K bank and pass that bank to InitCopperAudio:
'         LoadSDBank("copper_engine_2voice.bin",0,0,0, ENGINE_BANK)
'         InitCopperAudio(ENGINE_BANK)
'    4. Define an asm label  copper_sample_table  in your program (6-byte
'       entries: dw bank_and_loop, start_offset, length).
'    5. CopperVoicePlay(0, s) / CopperVoicePlay(1, s) ; then once per frame
'       either
'         CopperAudioUpdate()                  ' one call, engine does the wait
'       or, to keep the raster wait in your own hands:
'         dim syncline as ubyte = CopperAudioLine()   ' once, after Init
'         ...
'         CopperAudioFill()                    ' anywhere before the sync line
'         WaitRaster(syncline)                 ' your wait, not the engine's
'         CopperAudioStart()                   ' must be the very next thing
'       Run at 28MHz, contention OFF (NR $08 bit 6), interrupts OFF across all
'       of these calls.
'
'  NOTE: slot 1 is saved/restored around every call, so your game may use it.
' ============================================================================

sub fastcall InitCopperAudio(byval enginebank as ubyte)
    asm
        ld      (_cev_bank),a               ; remember the engine bank
        di
        getreg($51) : ld (icu_r+3),a         ; save caller's slot 1
        ld      a,(_cev_bank) : nextreg $51,a ; page engine in at $
        push    ix
        call    $2000                        ; engine_init
        pop     ix
    icu_r:
        nextreg $51,$ff                      ; restore caller's slot 1
        ret
    _cev_bank:  db 0
    _cev_tmp:   db 0
    end asm
end sub

sub fastcall CopperVoicePlay(byval voice as ubyte, byval sample as ubyte)
    ' start table entry <sample> on <voice> 0/1
    asm
        exx : pop hl : exx                   ; save ret address
        ;nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,255
        and     1
        ld      (_cev_tmp),a                 ; stash voice
        pop     af                           ; sample index
        ld      e,a : ld d,6 : mul d,e
        ld      hl,copper_sample_table       ; resident table (mapped)
        add     hl,de                        ; hl = 6-byte entry ptr
        di
        getreg($51) : ld (cvp_r+3),a
        ld      a,(_cev_bank) : nextreg $51,a
        ld      a,(_cev_tmp)                 ; a = voice, hl = entry
        push    ix
        call    $2003                        ; engine_voiceplay
        pop     ix
    cvp_r:
        nextreg $51,$ff
        ;nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,0
        exx : push hl : exx
        ret
    end asm
end sub

sub fastcall CopperVoiceStop(byval voice as ubyte)
    asm
        and     1
        ld      (_cev_tmp),a
        di
        getreg($51) : ld (cvs_r+3),a
        ld      a,(_cev_bank) : nextreg $51,a
        ld      a,(_cev_tmp)
        push    ix
        call    $2009                        ; engine_voicestop
        pop     ix  
    cvs_r:
        nextreg $51,$ff
        ret
    end asm
end sub

sub fastcall CopperAudioUpdate()
    ' LEGACY: fill + raster sync + play in one call (interrupts OFF).
    ' Blocks inside the engine until the sync line - use the Fill/Start pair
    ' below if you need the frame back for your own interrupt work.
    asm
        di
        ;nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,128
        push    ix
        getreg($51) : ld (cau_r+3),a
        ld      a,(_cev_bank) : nextreg $51,a
        call    $2006                        ; engine_update (build one frame)
    cau_r:
        nextreg $51,$ff
        pop     ix
        ;nextreg TRANSPARENCY_FALLBACK_COL_NR_4A,255
        ret
    end asm
end sub

sub fastcall CopperAudioFill()
    ' Build one frame of samples. Not beam critical - call it anywhere in the
    ' frame, as long as it lands before the sync line. Interrupts OFF (it
    ' pages sample banks into slot 0, over $0038).
    asm
        di
        push    ix
        getreg($51) : ld (caf_r+3),a
        ld      a,(_cev_bank) : nextreg $51,a
        call    $200C                        ; engine_fill
    caf_r:
        nextreg $51,$ff
        pop     ix
        ret
    end asm
end sub

sub fastcall CopperAudioStart()
    ' Arm the copper. Beam critical: call IMMEDIATELY after your own
    ' WaitRaster(CopperAudioLine()), interrupts OFF, nothing in between.
    asm
        di
        push    ix
        getreg($51) : ld (cas_r+3),a
        ld      a,(_cev_bank) : nextreg $51,a
        call    $200F                        ; engine_start
    cas_r:
        nextreg $51,$ff
        pop     ix
        ret
    end asm
end sub

function fastcall CopperAudioLine() as ubyte
    ' The raster line CopperAudioStart must be called on. Depends on the video
    ' mode (187 VGA50 / 191 VGA60 / 186 HDMI50 / 189 HDMI60) - it is NOT 192.
    ' Read it once after InitCopperAudio and cache it in a variable.
    asm
        di
        push    ix
        getreg($51) : ld (cal_r+3),a
        ld      a,(_cev_bank) : nextreg $51,a
        call    $2012                        ; engine_getline -> a
    cal_r:
        nextreg $51,$ff                      ; neither this nor pop ix touch a
        pop     ix
        ret
    end asm
end function
