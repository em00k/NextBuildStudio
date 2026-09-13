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
'       CopperAudioUpdate().  Run at 28MHz,
'       interrupts OFF (no music integration in this version).
'
'  NOTE: slot 1 is saved/restored around every call, so your game may use it.
' ============================================================================

sub fastcall InitCopperAudio(byval enginebank as ubyte)
    asm
        ld      (_cev_bank),a               ; remember the engine bank
        
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
        
        and     1
        ld      (_cev_tmp),a                 ; stash voice
        pop     af                           ; sample index
        ld      e,a : ld d,6 : mul d,e
        ld      hl,copper_sample_table       ; resident table (mapped)
        add     hl,de                        ; hl = 6-byte entry ptr
        
        getreg($51) : ld (cvp_r+3),a
        ld      a,(_cev_bank) : nextreg $51,a
        ld      a,(_cev_tmp)                 ; a = voice, hl = entry
        push    ix
        call    $2003                        ; engine_voiceplay
        pop     ix
    cvp_r:
        nextreg $51,$ff
        
        exx : push hl : exx
        ret
    end asm
end sub

sub fastcall CopperVoiceStop(byval voice as ubyte)
    asm
        and     1
        ld      (_cev_tmp),a
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
    ' call once per frame from the foreground (interrupts OFF)
    asm
        push    ix
        getreg($51) : ld (cau_r+3),a
        ld      a,(_cev_bank) : nextreg $51,a 
        call    $2006                        ; engine_update (build one frame)
    cau_r:
        nextreg $51,$ff
        pop     ix
        ret
    end asm
end sub
