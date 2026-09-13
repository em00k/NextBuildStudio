' ---------------------------------------------------------------
' nextlib_ay.bas - AY sound effects for the ZX Spectrum Next
' David Saphier / em00k
'
' Fire-and-forget sound effects, plus direct access to the AY if you want it.
' The short version is three calls:
'
'   AYInit()                    once, at startup
'   AYPlaySFX(SFX_LASER)        whenever you want a noise
'   AYUpdate()                  once per frame, forever
'
' AYUpdate() steps whatever effect is running by one frame and returns
' immediately if there is nothing to do, so it is safe to call every frame
' from your main loop. Nothing here blocks or waits.
'
' Effects play on channel C, so channels A and B are left alone for music.
'
' The effects themselves are seven parallel arrays, one row per effect - see
' AYInitSFX() at the bottom. Adding your own is a matter of bumping AY_NUM_SFX
' and filling in a row; no new code.
'
' nextlib.bas included first.
'
' Happy in a code bank:
'
'   #pragma codebank = 1
'   #include <nextlib_ay.bas>
'   #pragma codebank = 0
'
' ---------------------------------------------------------------

#ifndef __LIBRARY_AY__
#define __LIBRARY_AY__

#pragma push(case_insensitive)
#pragma case_insensitive = TRUE
#pragma zxnext = TRUE

' --- AY register numbers ---
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

' Envelope shapes for AYEnvelope(). Writing the shape register RESTARTS the
' envelope, which is what you want on a note attack.
#define ENV_DECAY       %0000       ' one fall, then silence
#define ENV_ATTACK      %0100       ' one rise, then silence
#define ENV_SAW_DOWN    %1000       ' repeating fall
#define ENV_DECAY_HOLD  %1001       ' one fall, hold at zero
#define ENV_TRIANGLE    %1010       ' repeating fall/rise
#define ENV_SAW_UP      %1100       ' repeating rise
#define ENV_ATTACK_HOLD %1111       ' one rise, hold at top

' Channels, for AYNote() / AYVolume() / AYMixerChan().
#define AY_CHAN_A       0
#define AY_CHAN_B       1
#define AY_CHAN_C       2

' The channel effects play on. A and B are left for your music.
#define AY_SFX_CHAN     2

' --- the built-in effects ---
#define SFX_LASER       0
#define SFX_EXPLOSION   1
#define SFX_COIN        2
#define SFX_JUMP        3
#define SFX_ZAP         4
#define SFX_HURT        5
#define SFX_POWERUP     6
#define AY_NUM_SFX      7

' Effect row flags.
#define SFX_USE_TONE    1
#define SFX_USE_NOISE   2

dim ay_mix      as ubyte            ' shadow of R7, so one channel can change
dim ay_playing  as ubyte            ' 0 = idle
dim ay_id       as ubyte            ' effect running
dim ay_t        as ubyte            ' frames elapsed
dim ay_tone     as uinteger         ' running tone period
dim ay_nacc     as uinteger         ' running noise period, in 1/16ths

dim sfxlen(AY_NUM_SFX)   as ubyte       ' frames
dim sfxflags(AY_NUM_SFX) as ubyte       ' SFX_USE_TONE / SFX_USE_NOISE
dim sfxtone(AY_NUM_SFX)  as uinteger    ' start tone period
dim sfxtoned(AY_NUM_SFX) as integer     ' tone period change per frame
dim sfxnoise(AY_NUM_SFX) as ubyte       ' start noise period
dim sfxnoised(AY_NUM_SFX) as integer    ' noise change per frame, in 1/16ths
dim sfxvol(AY_NUM_SFX)   as ubyte       ' start volume, fades to 0 over the effect

dim aynotes(11) as uinteger


' =========================================================================
' Direct AY access
' =========================================================================

' One AY register. Everything else in this file goes through here.
sub AYWrite(byval r as ubyte, byval v as ubyte)
    out $FFFD, r                    ' register select
    out $BFFD, v                    ' data
end sub


' 12-bit tone period for a channel. Register 2n is the LOW byte and 2n+1 the
' high nibble - the single most common AY mistake is swapping them.
sub AYTone(byval chan as ubyte, byval period as uinteger)
    AYWrite(chan * 2,     cast(ubyte, period band 255))
    AYWrite(chan * 2 + 1, cast(ubyte, (period >> 8) band 15))
end sub


' Volume 0-15 for a channel.
sub AYVolume(byval chan as ubyte, byval vol as ubyte)
    AYWrite(AY_A_VOL + chan, vol band 15)
end sub


' Noise pitch, 0-31. Low is a bright hiss, high is a rumble. One noise
' generator is shared by all three channels.
sub AYNoise(byval period as ubyte)
    AYWrite(AY_NOISE, period band 31)
end sub


' Turn tone and/or noise on for ONE channel, leaving the other two alone.
'
' Register 7 is active low and is shared by all six gates, which is why it
' looks like nonsense in most listings. Here 1 means audible and the library
' keeps the shadow, so switching channel C cannot silence your music on A.
sub AYMixerChan(byval chan as ubyte, byval tone as ubyte, byval noise as ubyte)
    dim tbit as ubyte
    dim nbit as ubyte

    tbit = 1 << chan                ' tone gates are bits 0-2
    nbit = 8 << chan                ' noise gates are bits 3-5

    ay_mix = ay_mix bor tbit bor nbit           ' both off (active low)
    if tone <> 0
        ay_mix = ay_mix band (tbit bxor 255)
    end if
    if noise <> 0
        ay_mix = ay_mix band (nbit bxor 255)
    end if
    AYWrite(AY_MIXER, ay_mix)
end sub


' Envelope period and shape. Only worth it for sustained sounds - the SFX
' engine below ramps the volume itself, which is easier to control.
sub AYEnvelope(byval period as uinteger, byval shape as ubyte)
    AYWrite(AY_ENV_FINE,   cast(ubyte, period band 255))
    AYWrite(AY_ENV_COARSE, cast(ubyte, (period >> 8) band 255))
    AYWrite(AY_ENV_SHAPE,  shape band 15)       ' this write restarts it
end sub


' Everything off.
sub AYSilence()
    dim r as ubyte

    for r = 0 to 13
        AYWrite(r, 0)
    next r
    ay_mix = %00111111                          ' all six gates closed
    AYWrite(AY_MIXER, ay_mix)
end sub


' =========================================================================
' Notes
' =========================================================================

' note = octave * 12 + semitone, semitone 0 = C. Octave 4 is middle, so
' AYNote(AY_CHAN_A, 48) is C4 and 57 is A4 (440Hz).
function AYPeriod(byval note as ubyte) as uinteger
    dim oct as ubyte
    dim p as uinteger
    dim i as ubyte

    oct = note / 12
    p = aynotes(note - oct * 12)

    if oct < 4
        for i = oct to 3
            p = p * 2
        next i
    elseif oct > 4
        for i = 5 to oct
            p = p / 2
        next i
    end if

    if p > 4095                     ' the register pair is only 12 bits
        p = 4095
    end if
    return p
end function


sub AYNote(byval chan as ubyte, byval note as ubyte)
    AYTone(chan, AYPeriod(note))
end sub


' =========================================================================
' Sound effects
' =========================================================================

' Start an effect. Anything already playing is replaced.
sub AYPlaySFX(byval id as ubyte)
    if id >= AY_NUM_SFX
        return
    end if

    ay_id = id
    ay_t = 0
    ay_playing = 1
    ay_tone = sfxtone(id)
    ay_nacc = cast(uinteger, sfxnoise(id)) * 16

    AYMixerChan(AY_SFX_CHAN, sfxflags(id) band SFX_USE_TONE, _
                             sfxflags(id) band SFX_USE_NOISE)
end sub


' 1 while an effect is still running. Handy if you want to avoid cutting one
' off with the next.
function AYSFXBusy() as ubyte
    return ay_playing
end function


' Call once per frame. Returns immediately when nothing is playing.
sub AYUpdate()
    dim id as ubyte
    dim dur as ubyte
    dim v as uinteger
    dim acc as integer

    if ay_playing = 0
        return
    end if

    id = ay_id
    dur = sfxlen(id)

    if ay_t >= dur                               ' finished
        AYVolume(AY_SFX_CHAN, 0)
        AYMixerChan(AY_SFX_CHAN, 0, 0)
        ay_playing = 0
        return
    end if

    ' volume fades linearly from the row's start value to silence. 16-bit on
    ' purpose: 15 * 45 overflows a uByte long before the divide.
    v = cast(uinteger, sfxvol(id)) * cast(uinteger, dur - ay_t)
    AYVolume(AY_SFX_CHAN, cast(ubyte, v / dur))

    ' Both sweeps clamp in SIGNED arithmetic before going back into the
    ' unsigned running value. Clamping after the cast would be wrong: a
    ' rising effect that undershoots zero wraps to ~65000 and would pin to
    ' the BOTTOM of the range instead of the top.
    if (sfxflags(id) band SFX_USE_TONE) <> 0
        AYTone(AY_SFX_CHAN, ay_tone)
        acc = cast(integer, ay_tone) + sfxtoned(id)
        if acc < 1
            acc = 1
        elseif acc > 4095                       ' 12-bit register pair
            acc = 4095
        end if
        ay_tone = cast(uinteger, acc)
    end if

    if (sfxflags(id) band SFX_USE_NOISE) <> 0
        AYNoise(cast(ubyte, ay_nacc / 16))
        ' the accumulator is in 1/16ths so a slow sweep is possible at all:
        ' the noise register is only 5 bits, so a whole-number step per
        ' frame would cross the entire range in half a second
        acc = cast(integer, ay_nacc) + sfxnoised(id)
        if acc < 0
            acc = 0
        elseif acc > 496                        ' 31 * 16
            acc = 496
        end if
        ay_nacc = cast(uinteger, acc)
    end if

    ay_t = ay_t + 1
end sub


' =========================================================================
' Setup
' =========================================================================

' One row per effect. Tone period and PITCH move opposite ways: a negative
' tone delta is a RISING sound.
sub AYInitSFX()
    '                    len  flags                        tone  tone/f  noise  noise/f  vol
    sfxlen(SFX_LASER)     = 18 : sfxflags(SFX_LASER)     = SFX_USE_TONE
    sfxtone(SFX_LASER)    = 60 : sfxtoned(SFX_LASER)     = 45
    sfxnoise(SFX_LASER)   = 0  : sfxnoised(SFX_LASER)    = 0
    sfxvol(SFX_LASER)     = 14

    sfxlen(SFX_EXPLOSION) = 45 : sfxflags(SFX_EXPLOSION) = SFX_USE_NOISE
    sfxtone(SFX_EXPLOSION) = 0 : sfxtoned(SFX_EXPLOSION) = 0
    sfxnoise(SFX_EXPLOSION) = 1 : sfxnoised(SFX_EXPLOSION) = 7
    sfxvol(SFX_EXPLOSION) = 15

    sfxlen(SFX_COIN)      = 14 : sfxflags(SFX_COIN)      = SFX_USE_TONE
    sfxtone(SFX_COIN)     = 300 : sfxtoned(SFX_COIN)     = -12
    sfxnoise(SFX_COIN)    = 0  : sfxnoised(SFX_COIN)     = 0
    sfxvol(SFX_COIN)      = 13

    sfxlen(SFX_JUMP)      = 16 : sfxflags(SFX_JUMP)      = SFX_USE_TONE
    sfxtone(SFX_JUMP)     = 500 : sfxtoned(SFX_JUMP)     = -22
    sfxnoise(SFX_JUMP)    = 0  : sfxnoised(SFX_JUMP)     = 0
    sfxvol(SFX_JUMP)      = 12

    sfxlen(SFX_ZAP)       = 12 : sfxflags(SFX_ZAP)       = SFX_USE_TONE bor SFX_USE_NOISE
    sfxtone(SFX_ZAP)      = 100 : sfxtoned(SFX_ZAP)      = 20
    sfxnoise(SFX_ZAP)     = 2  : sfxnoised(SFX_ZAP)      = 10
    sfxvol(SFX_ZAP)       = 14

    sfxlen(SFX_HURT)      = 22 : sfxflags(SFX_HURT)      = SFX_USE_TONE bor SFX_USE_NOISE
    sfxtone(SFX_HURT)     = 700 : sfxtoned(SFX_HURT)     = 40
    sfxnoise(SFX_HURT)    = 8  : sfxnoised(SFX_HURT)     = 4
    sfxvol(SFX_HURT)      = 13

    sfxlen(SFX_POWERUP)   = 30 : sfxflags(SFX_POWERUP)   = SFX_USE_TONE
    sfxtone(SFX_POWERUP)  = 600 : sfxtoned(SFX_POWERUP)  = -16
    sfxnoise(SFX_POWERUP) = 0  : sfxnoised(SFX_POWERUP)  = 0
    sfxvol(SFX_POWERUP)   = 12
end sub


' Call once at startup, before anything else here.
sub AYInit()
    ' Octave 4, C to B. Period is 1773447 / (16 * freq) for the Next's
    ' 1.7734475 MHz AY clock, so A4 lands on 252.
    aynotes(0)  = 424 : aynotes(1)  = 400 : aynotes(2)  = 377
    aynotes(3)  = 356 : aynotes(4)  = 336 : aynotes(5)  = 317
    aynotes(6)  = 300 : aynotes(7)  = 283 : aynotes(8)  = 267
    aynotes(9)  = 252 : aynotes(10) = 238 : aynotes(11) = 224

    AYInitSFX()
    AYSilence()
    ay_playing = 0
end sub

#pragma pop(case_insensitive)

#endif
