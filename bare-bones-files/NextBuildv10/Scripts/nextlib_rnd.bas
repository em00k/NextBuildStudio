' ---------------------------------------------------------------
' nextlib_rnd.bas - pseudo random numbers
' David Saphier / em00k
'
'   RndSeed(s)          restart the sequence; 0 seeds from the raster position
'   RndByte()           0-255
'   RndWord()           0-65535
'   RndBelow(n)         0 to n-1, with no modulo bias
'   RndRange(lo, hi)    lo to hi inclusive
'   RndBelowW(n)        0 to n-1, 16-bit - for 320 and 640 wide screens
'   RndRangeW(lo, hi)   lo to hi inclusive, 16-bit
'
' A 32-bit xorshift: fast, full period, and identical from a given seed on
' every run - which is what makes it testable and what makes a replay or a
' procedurally generated level reproducible. Seed it from RndSeed(0) at the
' point the player first presses a key if you want it to differ per game.
'
' Deliberately NOT a code bank module. It keeps state, it is small, and it is
' the sort of thing an interrupt handler reaches for - and a banked routine
' called from an ISR reads whatever page happens to be in the code window.
'
' Needs nextlib.bas included first.
' ---------------------------------------------------------------

#ifndef __NEXTLIB_RND__
#define __NEXTLIB_RND__

#ifndef __NEXTLIB__
#error "nextlib_rnd.bas needs #include <nextlib.bas> before it"
#endif

#pragma push(case_insensitive)
#pragma case_insensitive = TRUE
#pragma zxnext = TRUE

nb_rnd_core:
asm
        jp      nbr_lib_end
        #include once <nb_RND.asm>
nbr_lib_end:
end asm


' Restart the sequence. The same seed always gives the same numbers.
' RndSeed(0) takes a seed from the raster position instead, which is as good
' as unpredictable if you call it after waiting for a keypress.
sub fastcall RndSeed(byval s as uinteger)
    asm
        call    nbr_seed
    end asm
end sub


' A random byte, 0-255.
function fastcall RndByte() as ubyte
    asm
        call    nbr_byte
    end asm
end function


' A random word, 0-65535.
function fastcall RndWord() as uinteger
    asm
        call    nbr_word
    end asm
end function


' A random number from 0 to n-1. Every value is equally likely - this is not
' a remainder, which would quietly favour the low end whenever n is not a
' power of two. Returns 0 for n = 0 or n = 1.
function fastcall RndBelow(byval n as ubyte) as ubyte
    asm
        call    nbr_below
    end asm
end function


' A random number from 0 to n-1, for ranges a byte cannot hold - screen
' coordinates on a 320 or 640 pixel wide Layer 2, mostly.
function fastcall RndBelowW(byval n as uinteger) as uinteger
    asm
        call    nbr_beloww
    end asm
end function


' A random number from lo to hi, both included, over the full 16-bit range.
function RndRangeW(byval lo as uinteger, byval hi as uinteger) as uinteger
    if hi <= lo then
        return lo
    end if
    return lo + RndBelowW(hi - lo + 1)
end function


' A random number from lo to hi, both included. Returns lo if hi is below it.
function RndRange(byval lo as ubyte, byval hi as ubyte) as ubyte
    if hi <= lo then
        return lo
    end if
    if lo = 0 and hi = 255 then
        return RndByte()            ' the span is 256, which will not fit a uByte
    end if
    return lo + RndBelow(hi - lo + 1)
end function

#pragma pop(case_insensitive)

#endif
