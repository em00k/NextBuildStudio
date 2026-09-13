' ============================================================================
'  copper_include_2voice_CODEBANK.bas  -  two-voice Copper engine as a zxbc
'  CODEBANK. The engine binary (copper_engine_2voice-CODEBANK.asm, ORG $6000
'  = the code window) is INCBIN'd straight into the bank, so the compiler's
'  far-call trampolines do ALL the paging. No nextreg $51 in these stubs, no
'  LoadSDBank for the engine, no bank number to keep track of.
'
'  SETUP
'    1. Assemble the engine:
'         sjasmplus --zxnext copper_engine_2voice-CODEBANK.asm
'       -> data/copper_engine_codebank.bin
'    2. Wrap the include in a codebank - the engine follows whichever bank you
'       name, nothing in here is hard-coded to a bank number:
'         #pragma codebank = 1
'         #include "copper_include_2voice_CODEBANK.bas"
'         #pragma codebank = 0
'    3. Your program's '!org must clear the $6000-$7FFF code window - use
'       '!org=32768 or higher. ($6000/24576 overlaps it and is rejected.)
'    4. Define an asm label  copper_sample_table  in your program (6-byte
'       entries: dw bank_and_loop, start_offset, length). It stays RESIDENT;
'       banked code reads resident labels freely.
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
'  IM2 RULES (these are far calls now, so the CODEBANK rules apply)
'    - Do NOT call any of these from inside your ISR. Interrupt handlers must
'      not make far calls or remap the code window.
'    - Your ISR must not live in $6000-$7FFF, and must not touch slot 0
'      ($0000-$1FFF) - CopperAudioFill pages sample banks over it.
'    - The engine parks SP inside the code window while it streams the copper
'      list. That breaks the "SP must never point inside the code window" rule
'      on paper; it is safe only because interrupts are off and no far call
'      happens in that window. Keep it that way.
' ============================================================================

' ---------------------------------------------------------------------------
'  The engine blob. This is a module-level asm block, so it is diverted whole
'  into the bank named by the #pragma codebank in force - and because it is
'  the FIRST thing this file emits into that bank, it lands at offset 0, i.e.
'  exactly $6000.
'
'  That is not cosmetic. The blob is a raw sjasmplus binary assembled at
'  ORG $6000 and is full of absolute addresses; put anything in front of it
'  and every internal jp/call lands short by that many bytes. Do not add code
'  above this block, and do not let another bank-1 file be included first.
' ---------------------------------------------------------------------------
asm
copper_engine:                               ; == $6000, +0 = engine_init
    incbin  "includes/copper_engine_codebank.bin"
end asm

sub fastcall InitCopperAudio()
    asm
        di
        push    ix
        call    copper_engine                ; engine_init
        pop     ix
        ret
    _cev_tmp:   db 0
    end asm
end sub

sub fastcall CopperVoicePlay(byval voice as ubyte, byval sample as ubyte)
    ' start table entry <sample> on <voice> 0/1
    asm
        exx : pop hl : exx                   ; save ret address (__FAR_RETURN)
        and     1
        ld      (_cev_tmp),a                 ; stash voice
        pop     af                           ; sample index
        ld      e,a : ld d,6 : mul d,e
        ld      hl,copper_sample_table       ; resident table
        add     hl,de                        ; hl = 6-byte entry ptr
        di
        ld      a,(_cev_tmp)                 ; a = voice, hl = entry
        push    ix
        call    copper_engine+3              ; engine_voiceplay
        pop     ix
        exx : push hl : exx
        ret
    end asm
end sub

sub fastcall CopperVoiceStop(byval voice as ubyte)
    asm
        and     1
        di
        push    ix
        call    copper_engine+9              ; engine_voicestop
        pop     ix
        ret
    end asm
end sub

sub fastcall CopperAudioUpdate()
    ' LEGACY: fill + raster sync + play in one call (interrupts OFF).
    ' Blocks inside the engine until the sync line - use the Fill/Start pair
    ' below if you need the frame back for your own interrupt work.
    asm
        di
        push    ix
        call    copper_engine+6              ; engine_update
        pop     ix
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
        call    copper_engine+12             ; engine_fill
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
        call    copper_engine+15             ; engine_start
        pop     ix
        ret
    end asm
end sub

function fastcall CopperAudioLine() as ubyte
    ' The raster line CopperAudioStart must be called on. Depends on the video
    ' mode (187 VGA50 / 191 VGA60 / 186 HDMI50 / 189 HDMI60) - it is NOT 192.
    ' Read it once after InitCopperAudio and cache it in a variable.
    ' __FAR_RETURN preserves every register, so the result survives the unpage.
    asm
        di
        push    ix
        call    copper_engine+18             ; engine_getline -> a
        pop     ix
        ret
    end asm
end function
