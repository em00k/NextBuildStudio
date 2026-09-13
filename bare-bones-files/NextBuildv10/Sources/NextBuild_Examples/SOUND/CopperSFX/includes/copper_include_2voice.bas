' ============================================================================
'  copper_include_2voice.bas  -  TWO-VOICE Copper PCM sample engine
'  By em00k, based on KevB / 9bitColor's COPAUDIO player and the proven
'  single-voice NextBuild port (copper_include_original.bas).
'
'  Plays two INDEPENDENT 8-bit PCM samples at once with near-zero playback CPU:
'     voice 0 -> DAC B (left,  NR $2C)
'     voice 1 -> DAC C (right, NR $2E)
'  Native ~15.6kHz (one sample/scanline), raw 8-bit, per-voice looping.
'
'  A cheap per-frame PRE-PASS interleaves the two voices into one buffer
'  (banking/looping handled there). The copper-list builder is the proven
'  single-voice player, emitting TWO MOVEs per line from that buffer.
'  Crucially it is driven from the FOREGROUND with the per-frame wait_line
'  sync (set -> wait_line -> di -> play) - the broken dual version drove it
'  from the ISR with no sync, which is what made it stutter.
'
'  IMPORTANT: run at 28MHz with memory CONTENTION OFF (NR $08 bit 6). With
'  contention on, the interleave copy runs ~2.3x slower (67 vs 29 scanlines).
'
'  USAGE (foreground, once per frame - NOT from an ISR):
'     InitCopperAudio()
'     CopperVoicePlay(0, sampleA)
'     CopperVoicePlay(1, sampleB)
'     do
'         ... game logic ...
'         CopperAudioUpdate()
'     loop
'
'  copper_sample_table entries are 6 bytes each:
'     dw  bank_and_loop, start_offset, sample_length
'       hi byte of word1 = first 8K bank ; lo byte = loop count (0=forever,1=once)
' ============================================================================

CopperSample()

' ---------------------------------------------------------------------------
'  Public API
' ---------------------------------------------------------------------------

sub fastcall InitCopperAudio()
    asm
        ld      bc,TBBLUE_REGISTER_SELECT_P_243B
        ld      a,VIDEO_TIMING_NR_11
        out     (c),a
        inc     b
        in      a,(c)
        and     7
        ld      (.CopperSample.video_timing),a

        nextreg COPPER_CONTROL_LO_NR_61,$00
        nextreg COPPER_CONTROL_HI_NR_62,$00
        nextreg COPPER_DATA_NR_60,$FF
        nextreg COPPER_DATA_NR_60,$FF

        ; the copper streams the interleave buffer (always-mapped, no loop)
        ld      hl,.CopperSample.ibuf
        ld      (.CopperSample.sample_ptr),hl
        ld      hl,0
        ld      (.CopperSample.sample_pos),hl
        ld      hl,512                          ; > max lines -> forces no-loop
        ld      (.CopperSample.sample_len),hl
    end asm
end sub

sub fastcall CopperVoicePlay(byval voice as ubyte, byval sample as ubyte)
    ' start <sample> (table index) on <voice> 0 or 1
    asm
        exx : pop hl : exx                      ; save ret address
        and     1
        ld      (.CopperSample.cvp_voice),a
        pop     af                              ; sample index
        ld      e,a : ld d,6 : mul d,e          ; entry = table + sample*6
        ld      hl,copper_sample_table          ; global table (resolved here)
        add     hl,de
        ld      (.CopperSample.vp_entry),hl
        di
        call    .CopperSample.voice_play
        ei
        exx : push hl : exx
    end asm
end sub

sub fastcall CopperVoiceStop(byval voice as ubyte)
    ' silence <voice> 0 or 1
    asm
        and     1
        ld      e,a
        ld      d,12                            ; VOICE_SZ
        mul     d,e
        ld      ix,.CopperSample.v0
        add     ix,de
        xor     a
        ld      (ix+0),a                        ; VOFF_ACTIVE
    end asm
end sub

sub fastcall CopperAudioUpdate()
    ' Foreground, once per frame: pick config, interleave, sync, build list.
    ' NOTE: interrupts are kept OFF (interleave pages sample banks into slot 0,
    ' so a stray IM1 interrupt would execute sample data at $0038). The music
    ' integration (ISR) version must page-protect / re-order instead.
    asm
        di
        call    .CopperSample.set_copper_audio  ; A = copper line to wait for
        ld      (.CopperSample.wait_line_a),a
        call    .CopperSample.interleave        ; fill ibuf for this frame

        ld      bc,TBBLUE_REGISTER_SELECT_P_243B
        ld      de,($1E*256)+$1F
        out     (c),d
        inc     b
    cau_msb:
        in      d,(c)
        bit     0,d
        jp      nz,cau_msb
        dec     b
        out     (c),e
        inc     b
        ld      a,(.CopperSample.wait_line_a)
    cau_lsb:
        in      e,(c)
        cp      e
        jp      nz,cau_lsb

        call    .CopperSample.play_copper_audio
    end asm
end sub

' ---------------------------------------------------------------------------
'  Engine
' ---------------------------------------------------------------------------

sub fastcall CopperSample()
    asm
    push namespace CopperSample

    PERIPHERAL_1_REGISTER           equ $05
    RASTER_LINE_LSB_REGISTER        equ 31
    COPPER_DATA                     equ $60
    COPPER_CONTROL_LO_BYTE_REGISTER equ $61
    COPPER_CONTROL_HI_BYTE_REGISTER equ $62
    CONFIG1                         equ $05
    COPHI                           equ $62
    COPLO                           equ $61
    SELECT                          equ $243b

    DAC_LEFT                        equ $2C     ; voice 0
    DAC_RIGHT                       equ $2E     ; voice 1

    ; per-voice block (12 bytes)
    ;  +0 active  +1 bank  +2 ptr(2)  +4 remain(2)  +6 loop  +7 sbank
    ;  +8 sptr(2) +10 slen(2)

    ; =====================================================================
    ;  set_copper_audio - verbatim from the proven single-voice port. Builds
    ;  the control list; with sample_len=512 / sample_pos=0 it always takes
    ;  the no-loop path. Returns the copper line to wait for in A.
    ; =====================================================================
    set_copper_audio:
        ld      (.stack+1),sp
        ld      ix,copper_loop
        ld      bc,SELECT
        ld      a,CONFIG1
        out     (c),a
        inc     b
        in      a,(c)
        ld      hl,hdmi_50_config
        ld      de,vga_50_config
        bit     2,a
        jr      z,.refresh
        ld      hl,hdmi_60_config
        ld      de,vga_60_config
    .refresh:
        ld      a,(video_timing)
        cp      7
        jr      z,.hdmi
        ex      de,hl
    .hdmi:
        ld      a,(hl)
        inc     hl
        ld      (.return+1),a
        ld      sp,hl
        ld      hl,(sample_len)
        ld      bc,(sample_pos)
        xor     a
        sbc     hl,bc
        ld      b,h
        ld      c,l
        pop     hl
        ld      (video_lines),hl
        ld      a,h
        cpl
        ld      h,a
        ld      a,l
        cpl
        ld      l,a
        inc     hl
        ld      a,20
        add     hl,bc
        jp      c,.no_loop
        ld      a,c
        and     %11110000
        or      b
        swapnib
    .no_loop:
        ld      b,a
        ld      a,c
        and     %00001111
        ld      c,a
        ld      hl,.zone+1
        pop     de
        ld      (hl),e
        ld      a,d
        pop     hl
        ld      (copper_audio_config+1),sp
        ld      sp,copper_audio_stack
        cp      b
        jr      nz,.skip
        ex      af,af'
        ld      e,c
        ld      d,9
        mul     d,e
        ld      a,144
        sub     e
        add     hl,de
        push    hl
        push    ix
        ld      de,copper_out16
        add     de,a
        push    de
        ex      af,af'
        jr      .next
    .skip:
        push    hl
    .next:
        ld      hl,copper_out16
        dec     a
    .zone:
        cp      7
        jp      nz,.no_split
        ld      de,copper_split
        push    de
    .no_split:
        cp      b
        jp      nz,.no_zone
        ex      af,af'
        ld      e,c
        ld      d,9
        mul     d,e
        ld      a,144
        sub     e
        add     de,copper_out16
        push    de
        push    ix
        ld      de,copper_out16
        add     de,a
        push    de
        ex      af,af'
        jr      .zone_next
    .no_zone:
        push    hl
    .zone_next
        dec     a
        jp      p,.zone
        ld      (copper_audio_control+1),sp
    .return
        ld      a,0
    .stack
        ld      sp,0
        ret

    ; =====================================================================
    ;  play_copper_audio - build one frame of copper list from ibuf. Two
    ;  MOVEs per line (left $2C, right $2E). No banking (ibuf is main RAM).
    ;  Enter with interrupts off, straight after wait_line.
    ; =====================================================================
    play_copper_audio:
        ld      (play_copper_stack+1),sp
    copper_audio_config:
        ld      sp,0                            ; **PATCH**
        pop     hl                              ; index + vblank
        pop     de                              ; zone-1 line + WAIT command
        ld      a,l
        nextreg COPLO,a
        ld      a,h
        nextreg COPHI,a

        ld      hl,ibuf                         ; stream the interleave buffer

        ld      bc,SELECT
        ld      a,COPPER_DATA
        out     (c),a
        inc     b

        ld      a,DAC_RIGHT
        ex      af,af'                          ; af' = right reg
        ld      a,DAC_LEFT                      ; af  = left  reg
    copper_audio_control:
        ld      sp,0                            ; **PATCH**
        ret                                     ; GO!!!

    ; one entry = 16 sample-pairs (fall-through chain, partial entry points)
    copper_out16:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out15:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out14:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out13:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out12:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out11:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out10:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out9:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out8:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out7:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out6:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out5:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out4:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out3:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out2:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out1:
        out (c),d : out (c),e : out (c),a : OUTINB : ex af,af' : out (c),a : OUTINB : inc de : ex af,af'
    copper_out0:
        ret

    copper_split:
        out     (c),d
        out     (c),e
        ld      de,32768+0
        nextreg COPPER_CONTROL_LO_BYTE_REGISTER,$00
        nextreg COPPER_CONTROL_HI_BYTE_REGISTER,$C0
        ret

    copper_loop:
        ret                                     ; no-loop path: never reached

    copper_done:
    play_copper_stack:
        ld      sp,0
        ret

    ; =====================================================================
    ;  interleave - fill ibuf with (video_lines) pairs. Not beam-critical.
    ; =====================================================================
    interleave:
        ld      ix,v0
        ld      hl,ibuf
        call    fill_voice
        ld      ix,v1
        ld      hl,ibuf+1
        call    fill_voice
        ret

    ; ix -> voice block, hl -> first dest slot. Writes video_lines bytes
    ; at stride 2; pages the voice bank into slot 0 as needed.
    fill_voice:
        ld      (fv_dest),hl                    ; remember dest slot
        ld      a,(ix+0)                        ; active?
        or      a
        jp      z,fv_silence_all
        getreg($50) : ld (fv_rest+3),a
        ld      a,(ix+1) : nextreg $50,a        ; page bank
        ld      e,(ix+2) : ld d,(ix+3)          ; de = src ptr
        ld      bc,(video_lines)                ; bc = count
        ; --- FAST PATH: does the whole frame fit before an 8K bank cross AND
        ;     before the sample end? then one tight stride-2 copy (~25/26 frames)
        ld      hl,$2000 : and a : sbc hl,de    ; hl = bytes to 8K boundary
        and     a : sbc hl,bc
        jp      c,fv_slow                       ; would cross boundary -> slow
        ld      l,(ix+4) : ld h,(ix+5)          ; hl = sample remain
        and     a : sbc hl,bc
        jp      c,fv_slow                       ; sample ends this frame -> slow
        ld      hl,(fv_dest)
    fv_fast:
        ld      a,(de) : inc de
        ld      (hl),a : inc hl : inc hl
        dec     bc : ld a,b : or c
        jr      nz,fv_fast
        ld      (ix+2),e : ld (ix+3),d          ; ptr += count
        ld      l,(ix+4) : ld h,(ix+5)
        ld      bc,(video_lines)
        and     a : sbc hl,bc                   ; remain -= count
        ld      (ix+4),l : ld (ix+5),h
        jp      fv_rest
    fv_slow:
        ld      hl,(fv_dest)                    ; reload dest (fast check used hl)
    fv_loop:
        ld      a,(ix+4) : or (ix+5)            ; remain == 0 ?
        jp      z,fv_ended
        ld      a,(de)
        ld      (hl),a
        inc     de
        bit     5,d                             ; crossed 8K ($2000) ?
        jr      z,fv_nowrap
        res     5,d
        inc     (ix+1)
        ld      a,(ix+1) : nextreg $50,a
    fv_nowrap:
        ld      a,(ix+4) : sub 1 : ld (ix+4),a  ; remain--
        jr      nc,fv_nb
        dec     (ix+5)
    fv_nb:
        inc     hl : inc hl                     ; dest += 2
        dec     bc
        ld      a,b : or c
        jr      nz,fv_loop
        ld      (ix+2),e : ld (ix+3),d          ; save ptr
    fv_rest:
        nextreg $50,$ff
        ret

    fv_ended:
        ld      a,(ix+6)                        ; loop count
        or      a
        jr      z,fv_reloop                     ; 0 = forever
        dec     a
        ld      (ix+6),a
        jr      nz,fv_reloop
        xor     a : ld (ix+0),a                 ; one-shot done -> inactive
        nextreg $50,$ff
        jr      fv_silence
    fv_reloop:
        ld      a,(ix+7)  : ld (ix+1),a : nextreg $50,a
        ld      e,(ix+8)  : ld d,(ix+9)
        ld      a,(ix+10) : ld (ix+4),a
        ld      a,(ix+11) : ld (ix+5),a
        jr      fv_loop

    fv_silence_all:
        ld      bc,(video_lines)
    fv_silence:
        ld      a,b : or c
        ret     z
        ld      (hl),$80
        inc     hl : inc hl
        dec     bc
        jr      fv_silence

    ; =====================================================================
    ;  voice_play - parse table entry cvp_sample, arm voice cvp_voice
    ; =====================================================================
    voice_play:
        ld      a,(cvp_voice)
        ld      e,a : ld d,12 : mul d,e
        ld      ix,v0
        add     ix,de
        ld      hl,(vp_entry)                   ; entry ptr (set by CopperVoicePlay)
        ld      a,(hl) : inc hl                 ; loop count (lo of word1)
        ld      (ix+6),a
        ld      a,(hl) : inc hl                 ; first bank (hi of word1)
        ld      c,a
        ld      (ix+1),a
        ld      (ix+7),a
        ld      e,(hl) : inc hl
        ld      d,(hl) : inc hl                 ; de = offset
    vp_norm:
        ld      a,d : cp $20 : jr c,vp_normd
        sub     $20 : ld d,a
        inc     c
    vp_normd:
        ld      a,c
        ld      (ix+1),a : ld (ix+7),a
        ld      (ix+2),e : ld (ix+3),d
        ld      (ix+8),e : ld (ix+9),d
        ld      e,(hl) : inc hl
        ld      d,(hl)                          ; de = length
        ld      (ix+4),e  : ld (ix+5),d
        ld      (ix+10),e : ld (ix+11),d
        ld      a,1
        ld      (ix+0),a                        ; arm
        ret

    ; --- per video mode config -------------------------------------------
    ;  index/vblank = copper start ADDRESS for zone 1 (where the copper list
    ;  splits). This is (zone-2 line count) * INSTR_PER_LINE * 2 bytes. The
    ;  single-voice port used 2 instr/line; this TWO-voice list is 3 instr/line
    ;  (WAIT + MOVE $2C + MOVE $2E), so the address is 1.5x the single value:
    ;    vga50  zone2=199 -> 199*3*2 = 1194 = $4AA -> COPLO $AA, COPHI $C4
    ;    hdmi50 zone2=200 -> 200*3*2 = 1200 = $4B0 -> COPLO $B0, COPHI $C4
    ;    vga60  zone2=200 -> 1200 = $4B0
    ;    hdmi60 zone2=198 -> 198*3*2 = 1188 = $4A4 -> COPLO $A4, COPHI $C4
    vga_50_config:
        db 187 : dw 311 : db 6 : db 7+12 : dw copper_out7 : db $AA : db $C4 : dw 32768+199
    vga_60_config:
        db 191 : dw 264 : db 3 : db 4+12 : dw copper_out8 : db $B0 : db $C4 : dw 32768+200
    hdmi_50_config:
        db 186 : dw 312 : db 6 : db 7+12 : dw copper_out8 : db $B0 : db $C4 : dw 32768+200
    hdmi_60_config:
        db 189 : dw 262 : db 3 : db 4+12 : dw copper_out6 : db $A4 : db $C4 : dw 32768+198

    ; --- variables -------------------------------------------------------
    cvp_voice:      db 0
    cvp_sample:     db 0
    vp_entry:       dw 0
    fv_dest:        dw 0
    wait_line_a:    db 0
    video_lines:    dw 312
    video_timing:   db 0
    sample_ptr:     dw 0
    sample_pos:     dw 0
    sample_len:     dw 512

    v0:             ds 12,0
    v1:             ds 12,0

        dw  0,0,0,0,0,0,0,0
        dw  0,0,0,0,0,0,0,0
        dw  0,0,0,0,0,0,0
    copper_audio_stack:
        dw  copper_done

    ibuf:           ds 640,128

    pop namespace
    end asm
end sub
