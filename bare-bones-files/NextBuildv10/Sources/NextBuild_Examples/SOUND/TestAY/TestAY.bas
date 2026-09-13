' Project: TestAY
'
' A register-level AY / TurboSound tester for the ZX Spectrum Next.
'
' PlayMusic covers PT3 replay and AYFX, so this one stays down at the chip:
' a live view of all 14 registers, an editor for them, the Next-only
' TurboSound and stereo controls, and a handful of demo sounds that drive
' the registers in front of you so you can watch what each one does.
'
' The three things worth knowing, all of which this program exposes:
'
'   * The Next has THREE AY chips. NextReg $08 bit 1 enables them; the chip
'     is then selected by writing $FFFD with bit 7 set. That same byte holds
'     the left/right enables, so it doubles as a hard pan control.
'
'   * The chip number in that byte is INVERTED - %11 selects AY 0, %10 AY 1
'     and %01 AY 2. %00 is reserved. Easy to get backwards, and the symptom
'     is "chip 2 is silent and chip 0 answers to everything".
'
'   * Port $BFF5 reads back which chip and which register are live. That
'     readback is on screen, so you can prove the select byte did what you
'     think it did.

' Everything except the globals, the key handling and the main loop lives in
' code banks. The program is nowhere near the 32K ceiling, so this is about
' structure rather than space - but it is a good shape to copy, and it shows
' the one rule that actually bites: shared state has to stay RESIDENT.
' Bank-local data is only reachable from routines in the same bank, and
' aychip / uichip / ayshadow() and friends are read by all three banks.
'
'   CODEBANK 1  page 30   AY primitives and the note table
'   CODEBANK 2  page 31   string helpers and the screen
'   CODEBANK 3  page 32   the demo sounds
'
' The code window is $6000-$7FFF, so the program itself starts at $8000.

'!org=$8000
'!codebank=30                       ' CODEBANK 1 -> 8K page 30, 2 -> 31, 3 -> 32

#define NEX
#define IM2

#include <nextlib.bas>
#include <keys.bas>

' --- AY register numbers -------------------------------------------------
#define AY_A_FINE       0
#define AY_A_COARSE     1
#define AY_B_FINE       2
#define AY_B_COARSE     3
#define AY_C_FINE       4
#define AY_C_COARSE     5
#define AY_NOISE        6
#define AY_MIXER        7
#define AY_A_VOL        8
#define AY_B_VOL        9
#define AY_C_VOL        10
#define AY_ENV_FINE     11
#define AY_ENV_COARSE   12
#define AY_ENV_SHAPE    13

' Volume register bit 4: ignore the level, follow the envelope instead.
#define AY_VOL_ENVELOPE 16

' Envelope shapes (register 13). Only bits 3:0 matter.
#define ENV_DECAY       %0000       ' one fall, then silence
#define ENV_ATTACK      %0100       ' one rise, then silence
#define ENV_SAW_DOWN    %1000       ' repeating fall
#define ENV_TRIANGLE    %1010       ' repeating fall/rise
#define ENV_DECAY_HOLD  %1001       ' one fall, hold at zero
#define ENV_SAW_UP      %1100       ' repeating rise
#define ENV_ATTACK_HOLD %1111       ' one rise, hold at top

#define NUM_DEMOS       7

dim aychip      as ubyte            ' chip AYWrite() is currently aimed at
dim uichip      as ubyte            ' chip the screen is showing
dim ayts        as ubyte            ' TurboSound enabled?
dim ayacb       as ubyte            ' 0 = ABC stereo, 1 = ACB
dim panl(2)     as ubyte            ' per-chip left  channel enable
dim panr(2)     as ubyte            ' per-chip right channel enable
dim aymono(2)   as ubyte            ' per-chip mono flag
dim ayshadow(41) as ubyte           ' chip * 14 + reg, what we last wrote

dim cursor      as ubyte            ' selected register, 0-13
dim lastcursor  as ubyte
dim shownval(13) as ubyte           ' last value drawn, so we redraw one row
dim forcedraw   as ubyte
dim statdirty   as ubyte
dim lastbff5    as ubyte
dim lastread    as ubyte
dim lastreadcur as ubyte

dim demoid      as ubyte
dim demorun     as ubyte
dim demotick    as uinteger

dim regname(13) as string
dim demoname(6) as string
dim notebase(11) as uinteger
dim arpnote(2)  as ubyte

dim n           as ubyte


' =========================================================================
' AY primitives
' =========================================================================

CODEBANK 1

' Aim the following writes at a chip, without touching the hardware. The
' select byte only goes out when something is actually written.
sub AYUse(byval chip as ubyte)
    aychip = chip
end sub


' Emit the TurboSound select byte for the current chip: bit 7 set marks it
' as a control write rather than a register select, bits 6/5 are the left
' and right enables, and bits 1:0 are the chip - INVERTED, so 3 - chip.
'
' With TurboSound off this does nothing: NextReg $08 bit 1 = 0 freezes the
' selected chip, so writing a select byte would only confuse matters.
sub AYChipSelect()
    dim b as ubyte

    if ayts = 0
        return
    end if

    b = %10011100 bor (3 - (aychip band 3))
    if panl(aychip) <> 0
        b = b bor %01000000
    end if
    if panr(aychip) <> 0
        b = b bor %00100000
    end if
    out AY_REG_P_FFFD, b
end sub


' One register on the current chip. Register numbers are all below 32, so
' they land in the "bits 7:5 = 0" case of $FFFD and select rather than
' control. The shadow copy is what the screen draws from.
sub AYWrite(byval r as ubyte, byval v as ubyte)
    if r > 13
        return
    end if
    AYChipSelect()
    out AY_REG_P_FFFD, r
    out AY_DATA_P_BFFD, v
    ayshadow(aychip * 14 + r) = v
end sub


' $FFFD is readable on the Next, so a register can be read straight back.
function AYRead(byval r as ubyte) as ubyte
    AYChipSelect()
    out AY_REG_P_FFFD, r
    return in AY_REG_P_FFFD
end function


' Left/right enable for a chip. Takes effect immediately - the select byte
' carries the pan, so it has to go out again.
sub AYPan(byval chip as ubyte, byval l as ubyte, byval r as ubyte)
    dim prev as ubyte

    panl(chip) = l
    panr(chip) = r
    prev = aychip
    aychip = chip
    AYChipSelect()
    aychip = prev
end sub


' NextReg $08 bit 1. Off by default on a hard reset, so this has to be
' called before chips 1 and 2 exist at all.
sub AYTurboSound(byval enable as ubyte)
    dim v as ubyte

    v = GetReg(PERIPHERAL_3_NR_08)
    if enable <> 0
        v = v bor %00000010
    else
        v = v band %11111101
    end if
    NextRegA(PERIPHERAL_3_NR_08, v)
    ayts = enable
    statdirty = 1
end sub


' NextReg $08 bit 5: 0 = ABC stereo, 1 = ACB. Applies to all three chips.
sub AYStereoACB(byval acb as ubyte)
    dim v as ubyte

    v = GetReg(PERIPHERAL_3_NR_08)
    if acb <> 0
        v = v bor %00100000
    else
        v = v band %11011111
    end if
    NextRegA(PERIPHERAL_3_NR_08, v)
    ayacb = acb
    statdirty = 1
end sub


' NextReg $09 bits 5/6/7 collapse AY 0/1/2 to mono individually.
sub AYMono(byval chip as ubyte, byval onoff as ubyte)
    dim v as ubyte
    dim m as ubyte

    m = %00100000
    if chip = 1
        m = %01000000
    elseif chip = 2
        m = %10000000
    end if

    v = GetReg(PERIPHERAL_4_NR_09)
    if onoff <> 0
        v = v bor m
    else
        v = v band (m bxor 255)
    end if
    NextRegA(PERIPHERAL_4_NR_09, v)
    aymono(chip) = onoff
    statdirty = 1
end sub


' 12-bit tone period across the register pair for a channel. This is the
' one everybody gets wrong: register 2n is the LOW byte, 2n+1 the high
' nibble. Swap them and the pitch is nonsense.
sub AYTone(byval chan as ubyte, byval period as uinteger)
    AYWrite(chan * 2,     cast(ubyte, period band 255))
    AYWrite(chan * 2 + 1, cast(ubyte, (period >> 8) band 15))
end sub


' Level 0-15, or AY_VOL_ENVELOPE to hand the channel over to the envelope
' generator and ignore the level entirely.
sub AYVolume(byval chan as ubyte, byval vol as ubyte)
    AYWrite(AY_A_VOL + chan, vol band %00011111)
end sub


' 5-bit noise period, shared by all three channels.
sub AYNoise(byval period as ubyte)
    AYWrite(AY_NOISE, period band %00011111)
end sub


' Register 7 is active LOW and mixes tone and noise separately, which is why
' it reads as gibberish in most listings. Here a 1 bit means audible:
' bit 0 = channel A, bit 1 = B, bit 2 = C.
sub AYMixer(byval tone as ubyte, byval noise as ubyte)
    AYWrite(AY_MIXER, ((tone band 7) bxor 7) bor ((((noise band 7) bxor 7)) << 3))
end sub


' 16-bit envelope period and shape. Writing register 13 RESTARTS the
' envelope, which is exactly what you want on a note attack and exactly
' what you do not want mid-sweep - see AYEnvPeriod().
sub AYEnvelope(byval period as uinteger, byval shape as ubyte)
    AYWrite(AY_ENV_FINE,   cast(ubyte, period band 255))
    AYWrite(AY_ENV_COARSE, cast(ubyte, (period >> 8) band 255))
    AYWrite(AY_ENV_SHAPE,  shape band 15)
end sub


' Period only, shape left alone - no retrigger. Sweeping with this glides;
' sweeping with AYEnvelope() re-attacks every step and buzzes instead.
sub AYEnvPeriod(byval period as uinteger)
    AYWrite(AY_ENV_FINE,   cast(ubyte, period band 255))
    AYWrite(AY_ENV_COARSE, cast(ubyte, (period >> 8) band 255))
end sub


' Silence the current chip and zero every register.
sub AYReset()
    dim r as ubyte

    for r = 0 to 13
        AYWrite(r, 0)
    next r
    AYWrite(AY_MIXER, %00111111)        ' every tone and noise gate closed
end sub


' All three chips. Needs TurboSound on to reach 1 and 2.
sub AYResetAll()
    dim c as ubyte
    dim prev as ubyte

    prev = aychip
    for c = 0 to 2
        AYUse(c)
        AYReset()
    next c
    aychip = prev
end sub


' =========================================================================
' Notes
' =========================================================================

' note = octave * 12 + semitone, semitone 0 = C. The table holds octave 4;
' every other octave is a halving or doubling of it. Periods are
' 1773447 / (16 * freq) for the Next's 1.7734475 MHz AY clock, so A4 = 252.
function AYPeriod(byval note as ubyte) as uinteger
    dim oct as ubyte
    dim sem as ubyte
    dim p as uinteger
    dim i as ubyte

    oct = note / 12
    sem = note - oct * 12
    p = notebase(sem)

    if oct < 4
        for i = oct to 3
            p = p * 2
        next i
    elseif oct > 4
        for i = 5 to oct
            p = p / 2
        next i
    end if

    if p > 4095                         ' the register pair is only 12 bits
        p = 4095
    end if
    return p
end function


sub AYNote(byval chan as ubyte, byval note as ubyte)
    AYTone(chan, AYPeriod(note))
end sub

END CODEBANK


' =========================================================================
' Small string helpers
' =========================================================================

CODEBANK 2

function Hex2(byval v as ubyte) as string
    dim d as string
    dim h as ubyte
    dim l as ubyte

    d = "0123456789ABCDEF"
    h = v >> 4
    l = v band 15
    return d(h TO h) + d(l TO l)
end function


function D2(byval v as ubyte) as string
    dim d as string
    dim t as ubyte
    dim u as ubyte

    d = "0123456789"
    t = v / 10
    u = v - t * 10
    return d(t TO t) + d(u TO u)
end function


function OnOff(byval v as ubyte) as string
    if v <> 0
        return "ON "
    end if
    return "OFF"
end function


' =========================================================================
' Screen
' =========================================================================

sub DrawRegRow(byval r as ubyte, byval v as ubyte)
    dim c as ubyte
    dim mark as string

    c = 7
    mark = " "
    if r = cursor
        c = 6                           ' yellow on the selected row
        mark = ">"
    end if
    print at 5 + r, 0; ink c; mark; regname(r); Hex2(v); " "; BinToString(v)
end sub


' Only the rows whose value changed get repainted, so a demo driving one
' register at 50Hz costs one PRINT a frame rather than fourteen.
sub DrawRegs()
    dim r as ubyte
    dim v as ubyte

    for r = 0 to 13
        v = ayshadow(uichip * 14 + r)
        if forcedraw <> 0 or v <> shownval(r) or r = cursor or r = lastcursor
            DrawRegRow(r, v)
            shownval(r) = v
        end if
    next r
    lastcursor = cursor
    forcedraw = 0
end sub


sub DrawStatus()
    print at 2, 0; ink 5; "CHIP:"; D2(uichip); " TS:"; OnOff(ayts); _
                          " ACB:"; OnOff(ayacb); " MONO:"; OnOff(aymono(uichip))
    statdirty = 0
end sub


' Read the selected register straight back off the chip. If this disagrees
' with the shadow value on the cursor row, the write did not land where you
' thought - wrong chip selected, or TurboSound off and the chip frozen.
sub DrawReadback()
    dim v as ubyte
    dim prev as ubyte

    ' a demo may have aimed aychip at another chip mid-run, and this line is
    ' about the chip on screen
    prev = aychip
    aychip = uichip
    v = AYRead(cursor)
    aychip = prev
    if v <> lastread or cursor <> lastreadcur
        print at 21, 0; ink 6; "R"; D2(cursor); " READS BACK AS "; Hex2(v)
        lastread = v
        lastreadcur = cursor
    end if
end sub


' Port $BFF5: bits 7:6 are the active chip (inverted, same as the select
' byte) and bits 4:0 the selected register. Straight from the hardware, so
' it disagrees with the line above if a select byte went out wrong.
sub DrawInfo()
    dim v as ubyte
    dim pan as string

    v = in $BFF5
    lastbff5 = v

    pan = "--"
    if panl(uichip) <> 0 and panr(uichip) <> 0
        pan = "LR"
    elseif panl(uichip) <> 0
        pan = "L-"
    elseif panr(uichip) <> 0
        pan = "-R"
    end if

    print at 3, 0; ink 4; "BFF5:"; Hex2(v); " CHIP"; D2(3 - (v >> 6)); _
                          " REG"; D2(v band 31); " PAN "; pan
end sub


sub DrawDemo()
    print at 20, 0; ink 3; "DEMO: "; demoname(demoid)
end sub


sub DrawFrame()
    border 0 : paper 0 : ink 7 : cls
    print at 0, 0; ink 0; paper 5; "  NEXTBUILD AY / TURBOSOUND    "
    print at 19, 0; ink 5; "Q/A REG   O/P +-1   K/L +-16"
    print at 22, 0; ink 5; "1 2 3 CHIP  T TS  S ACB  N MONO"
    print at 23, 0; ink 5; "Z X PAN   C/V CLEAR   M/SP DEMO"
    forcedraw = 1
    statdirty = 1
end sub

END CODEBANK


' =========================================================================
' Demo sounds - one step per frame, so the register rows animate live
' =========================================================================

CODEBANK 3

sub DemoArpeggio()
    dim s as ubyte

    if demotick = 0
        AYUse(uichip) : AYReset()
        AYMixer(%001, %000)
        AYVolume(0, 13)
    end if
    if (demotick band 3) = 0
        s = (demotick / 4) MOD 3
        AYNote(0, 48 + arpnote(s))      ' C major triad around C4
    end if
    if demotick > 88
        AYVolume(0, 0)
        demorun = 0
    end if
end sub


' Envelope period close to the tone period is the classic AY buzz bass.
' The sweep uses AYEnvPeriod() so it glides instead of re-attacking.
sub DemoBuzzBass()
    dim p as uinteger

    if demotick = 0
        AYUse(uichip) : AYReset()
        AYMixer(%001, %000)
        AYVolume(0, AY_VOL_ENVELOPE)
        AYNote(0, 24)                   ' C2
        AYEnvelope(400, ENV_TRIANGLE)
    end if
    if (demotick band 1) = 0
        p = 400 - demotick * 3
        if p < 30
            p = 30
        end if
        AYEnvPeriod(p)
    end if
    if demotick > 118
        AYVolume(0, 0)
        demorun = 0
    end if
end sub


' Noise through a one-shot decay envelope, with the noise period opening up
' as it falls - a boom rather than a click.
' The decay here is done in BASIC, one volume level per few frames, rather
' than by handing channel A to the envelope generator with AY_VOL_ENVELOPE.
'
' That is deliberate. A channel with bit 4 set in its volume register ignores
' its own level completely and follows the envelope, so if the envelope is not
' running - because the retrigger did not take, or R11/R12 were still zero
' when R13 was written - the channel is stuck at whatever level the envelope
' stopped on. Everything reads correctly on screen and you hear almost
' nothing. Driving R8 directly cannot fail that way, and you can watch the
' volume fall on the register display, which the hardware envelope never
' shows you. Buzz Bass is the demo that exercises the envelope generator.
sub DemoExplosion()
    dim v as ubyte

    if demotick = 0
        AYUse(uichip) : AYReset()
        AYMixer(%000, %001)             ' noise only on channel A -> R7 = $37
        AYNoise(1)                      ' bright hiss to start
        AYVolume(0, 15)
    end if

    v = 15 - cast(ubyte, demotick / 3)  ' full to silent over 45 frames
    if v > 15                           ' ubyte wrap guard
        v = 0
    end if
    AYVolume(0, v)

    if (demotick band 3) = 0
        AYNoise(1 + cast(ubyte, demotick / 4))      ' hiss opens out to a rumble
    end if

    if demotick > 46
        AYVolume(0, 0)
        demorun = 0
    end if
end sub


sub DemoLaser()
    if demotick = 0
        AYUse(uichip) : AYReset()
        AYMixer(%001, %000)
        AYVolume(0, 14)
    end if
    AYTone(0, 50 + demotick * 30)       ' period up = pitch down
    if demotick > 28
        AYVolume(0, 0)
        demorun = 0
    end if
end sub


sub DemoVibrato()
    dim s as ubyte
    dim off as ubyte

    if demotick = 0
        AYUse(uichip) : AYReset()
        AYMixer(%001, %000)
        AYVolume(0, 13)
    end if

    s = demotick MOD 20                 ' triangle LFO over 20 frames
    if s < 10
        off = s
    else
        off = 20 - s
    end if
    AYTone(0, AYPeriod(48) - 5 + off)

    if demotick > 118
        AYVolume(0, 0)
        demorun = 0
    end if
end sub


' All nine channels at once, which is the whole point of TurboSound.
sub DemoChord9()
    dim c as ubyte
    dim v as ubyte

    if demotick = 0
        if ayts = 0
            AYTurboSound(1)
        end if
        for c = 0 to 2
            AYUse(c)
            AYReset()
            AYMixer(%111, %000)
        next c

        AYUse(0)
        AYNote(0, 36) : AYNote(1, 40) : AYNote(2, 43)   ' C3  E3  G3
        AYVolume(0, 11) : AYVolume(1, 11) : AYVolume(2, 11)
        AYUse(1)
        AYNote(0, 47) : AYNote(1, 50) : AYNote(2, 55)   ' B3  D4  G4
        AYVolume(0, 10) : AYVolume(1, 10) : AYVolume(2, 10)
        AYUse(2)
        AYNote(0, 60) : AYNote(1, 64) : AYNote(2, 67)   ' C5  E5  G5
        AYVolume(0, 8) : AYVolume(1, 8) : AYVolume(2, 8)
    end if

    if demotick > 100 and (demotick MOD 5) = 0
        v = 10 - cast(ubyte, (demotick - 100) / 5)
        if v > 10
            v = 0
        end if
        for c = 0 to 2
            AYUse(c)
            AYVolume(0, v) : AYVolume(1, v) : AYVolume(2, v)
        next c
    end if

    if demotick > 148
        AYResetAll()
        AYUse(uichip)
        demorun = 0
    end if
end sub


' The select byte carries the left/right enables, so panning is free -
' no mixer, no volume tricks, just re-select the chip.
sub DemoPanSweep()
    dim c as ubyte
    dim p as ubyte
    dim ph as ubyte

    if demotick = 0
        if ayts = 0
            AYTurboSound(1)
        end if
        for c = 0 to 2
            AYUse(c)
            AYReset()
            AYMixer(%001, %000)
            AYVolume(0, 12)
            AYNote(0, 48 + c * 4)
        next c
    end if

    if (demotick MOD 12) = 0
        ph = cast(ubyte, (demotick / 12) MOD 3)
        for c = 0 to 2
            p = (c + ph) MOD 3
            if p = 0
                AYPan(c, 1, 0)          ' hard left
            elseif p = 1
                AYPan(c, 1, 1)          ' centre
            else
                AYPan(c, 0, 1)          ' hard right
            end if
        next c
    end if

    if demotick > 143
        for c = 0 to 2
            AYPan(c, 1, 1)              ' put the pans back
        next c
        AYResetAll()
        AYUse(uichip)
        demorun = 0
    end if
end sub


sub DemoTick()
    if demorun = 0
        return
    end if

    if demoid = 0
        DemoArpeggio()
    elseif demoid = 1
        DemoBuzzBass()
    elseif demoid = 2
        DemoExplosion()
    elseif demoid = 3
        DemoLaser()
    elseif demoid = 4
        DemoVibrato()
    elseif demoid = 5
        DemoChord9()
    else
        DemoPanSweep()
    end if

    demotick = demotick + 1
end sub

END CODEBANK


' =========================================================================
' Input - resident. Called for 18 keys every frame from the resident main
' loop, so a far call each would be pure overhead for two tiny routines.
' =========================================================================

dim latch(17) as ubyte
dim rpt(17)   as ubyte

' Frames to hold a key before it starts repeating, then frames between
' repeats. Without this a held key fires 50 times a second and a register
' is impossible to land on a particular value.
#define KEY_DELAY       14
#define RATE_FINE       3           ' O/P, +-1
#define RATE_CURSOR     6           ' Q/A, moving the cursor


' One shot on the press. For toggles, where a repeat makes no sense.
function KeyEdge(byval id as ubyte, byval key as uinteger) as ubyte
    dim now as ubyte
    dim r as ubyte

    now = 0
    if MultiKeys(key) <> 0
        now = 1
    end if

    r = 0
    if now <> 0 and latch(id) = 0
        r = 1
    end if
    latch(id) = now
    return r
end function


' Fires once on the press, then nothing until the key has been held for
' `delay` frames, after which it fires every `rate` frames. A tap moves
' exactly one step; holding sweeps.
function KeyRepeat(byval id as ubyte, byval key as uinteger, _
                   byval delay as ubyte, byval rate as ubyte) as ubyte
    if MultiKeys(key) = 0
        latch(id) = 0
        rpt(id) = 0
        return 0
    end if

    if latch(id) = 0                    ' first frame down
        latch(id) = 1
        rpt(id) = delay
        return 1
    end if

    if rpt(id) > 0
        rpt(id) = rpt(id) - 1
        return 0
    end if

    rpt(id) = rate
    return 1
end function


' =========================================================================
' Setup
' =========================================================================

asm
    nextreg TURBO_CONTROL_NR_07, %11        ; 28 MHz
end asm

regname(0)  = "R0  A FINE      "
regname(1)  = "R1  A COARSE    "
regname(2)  = "R2  B FINE      "
regname(3)  = "R3  B COARSE    "
regname(4)  = "R4  C FINE      "
regname(5)  = "R5  C COARSE    "
regname(6)  = "R6  NOISE PERIOD"
regname(7)  = "R7  MIXER       "
regname(8)  = "R8  A VOLUME    "
regname(9)  = "R9  B VOLUME    "
regname(10) = "R10 C VOLUME    "
regname(11) = "R11 ENV FINE    "
regname(12) = "R12 ENV COARSE  "
regname(13) = "R13 ENV SHAPE   "

demoname(0) = "ARPEGGIO      "
demoname(1) = "BUZZ BASS     "
demoname(2) = "EXPLOSION     "
demoname(3) = "LASER         "
demoname(4) = "VIBRATO       "
demoname(5) = "9-CH CHORD    "
demoname(6) = "PAN SWEEP     "

' Octave 4, C through B. 1773447 / (16 * freq).
notebase(0)  = 424 : notebase(1)  = 400 : notebase(2)  = 377
notebase(3)  = 356 : notebase(4)  = 336 : notebase(5)  = 317
notebase(6)  = 300 : notebase(7)  = 283 : notebase(8)  = 267
notebase(9)  = 252 : notebase(10) = 238 : notebase(11) = 224

arpnote(0) = 0 : arpnote(1) = 4 : arpnote(2) = 7

panl(0) = 1 : panr(0) = 1
panl(1) = 1 : panr(1) = 1
panl(2) = 1 : panr(2) = 1

AYTurboSound(1)                     ' off after a hard reset, so ask for it
AYStereoACB(0)
AYResetAll()
AYUse(0)
uichip = 0
lastreadcur = 255                   ' force the first readback draw

DrawFrame()
DrawStatus()
DrawInfo()
DrawDemo()
DrawRegs()


' =========================================================================
' Main loop
' =========================================================================

do
    ' --- register cursor ---
    if KeyRepeat(0, KEYQ, KEY_DELAY, RATE_CURSOR) <> 0 and cursor > 0
        cursor = cursor - 1
    end if
    if KeyRepeat(1, KEYA, KEY_DELAY, RATE_CURSOR) <> 0 and cursor < 13
        cursor = cursor + 1
    end if

    ' read the value AFTER the cursor may have moved, so a move and an edit
    ' in the same frame do not write the old row's value into the new row
    n = ayshadow(uichip * 14 + cursor)

    ' --- value: tap for one step, hold to sweep ---
    ' Two separate IFs, not IF/ELSEIF: KeyRepeat() clears its own latch when
    ' the key is up, so it has to be called every frame for both keys or a
    ' held key can leave the other one stuck down.
    if KeyRepeat(16, KEYP, KEY_DELAY, RATE_FINE) <> 0
        AYUse(uichip) : AYWrite(cursor, n + 1)
    end if
    if KeyRepeat(17, KEYO, KEY_DELAY, RATE_FINE) <> 0
        AYUse(uichip) : AYWrite(cursor, n - 1)
    end if

    ' --- value: K/L in steps of 16, edge only ---
    if KeyEdge(2, KEYL) <> 0
        AYUse(uichip) : AYWrite(cursor, n + 16)
    end if
    if KeyEdge(3, KEYK) <> 0
        AYUse(uichip) : AYWrite(cursor, n - 16)
    end if

    ' --- chip select ---
    if KeyEdge(4, KEY1) <> 0
        uichip = 0 : forcedraw = 1 : statdirty = 1
    end if
    if KeyEdge(5, KEY2) <> 0
        uichip = 1 : forcedraw = 1 : statdirty = 1
    end if
    if KeyEdge(6, KEY3) <> 0
        uichip = 2 : forcedraw = 1 : statdirty = 1
    end if

    ' --- Next audio controls ---
    if KeyEdge(7, KEYT) <> 0
        if ayts <> 0
            AYTurboSound(0)
        else
            AYTurboSound(1)
        end if
    end if
    if KeyEdge(8, KEYS) <> 0
        if ayacb <> 0
            AYStereoACB(0)
        else
            AYStereoACB(1)
        end if
    end if
    if KeyEdge(9, KEYN) <> 0
        if aymono(uichip) <> 0
            AYMono(uichip, 0)
        else
            AYMono(uichip, 1)
        end if
    end if

    ' --- pan for the shown chip ---
    if KeyEdge(10, KEYZ) <> 0
        AYPan(uichip, panl(uichip) bxor 1, panr(uichip))
        forcedraw = 1
    end if
    if KeyEdge(11, KEYX) <> 0
        AYPan(uichip, panl(uichip), panr(uichip) bxor 1)
        forcedraw = 1
    end if

    ' --- silence ---
    if KeyEdge(12, KEYC) <> 0
        AYUse(uichip) : AYReset()
        demorun = 0
    end if
    if KeyEdge(13, KEYV) <> 0
        AYResetAll() : AYUse(uichip)
        demorun = 0
    end if

    ' --- demos ---
    if KeyEdge(14, KEYM) <> 0
        demoid = (demoid + 1) MOD NUM_DEMOS
        DrawDemo()
    end if
    if KeyEdge(15, KEYSPACE) <> 0
        demotick = 0
        demorun = 1
    end if

    DemoTick()

    if statdirty <> 0
        DrawStatus()
    end if
    ' the readback selects a register on the chip, so it has to happen
    ' before $BFF5 is sampled or the two lines disagree by a frame
    DrawReadback()
    if in $BFF5 <> lastbff5 or forcedraw <> 0
        DrawInfo()
    end if
    DrawRegs()

    WaitRaster(192)
loop
