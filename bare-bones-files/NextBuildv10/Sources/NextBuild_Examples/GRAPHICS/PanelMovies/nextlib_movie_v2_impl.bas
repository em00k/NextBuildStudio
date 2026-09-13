' NextBuildStudio v2 movie API -- implementation
'
' The bodies for nextlib_movie_v2.bas. Split from the header so the
' caller can place these functions in a code bank without also banking
' the public globals. See nextlib_movie_v2.bas for the API and the
' CODEBANK include pattern.
'
' This file assumes nextlib_movie_v2.bas has already been included so
' the declares and public globals exist. It pulls in nextlib_memplay.bas
' itself so DecodePreloadedFrame lands in the same scope as the wrapper
' -- resident when the impl is included resident, bank-local when the
' impl is included under #pragma codebank.

#ifndef __NEXTLIB_MOVIE_V2_IMPL__
#define __NEXTLIB_MOVIE_V2_IMPL__

#include once "nextlib_memplay.bas"

' Internal 10-byte memplay-compatible movie table. Layout mirrors what
' DecodePreloadedFrame reads:
'   +0 unused, +1 width, +2 height, +3-4 unused,
'   +5 src_bank, +6 unused, +7-8 cur_hl, +9 cur_bank
_v2_table:
    asm
        ds 10, 0
    end asm

' Streaming state
dim _v2_handle as ubyte = 0
dim _v2_ended  as ubyte = 0


' ---- PRELOADED PATH --------------------------------------------------

function InitPreloadedMovieV2(src_bank as ubyte) as ubyte
    dim ok  as ubyte    = 0
    dim tbl as uinteger
    tbl = @_v2_table
    dim w   as uinteger
    dim h   as uinteger

    NextRegA($56, src_bank)

    ' Magic 'NMV2' = 78,77,86,50
    if peek($C000) = 78 then
        if peek($C001) = 77 then
            if peek($C002) = 86 then
                if peek($C003) = 50 then
                    movie_l2_mode = peek($C005)
                    w = peek(uinteger, $C006)
                    h = peek(uinteger, $C008)
                    if w <= 255 then
                        if h <= 255 then
                            movie_width  = cast(ubyte, w)
                            movie_height = cast(ubyte, h)
                            movie_frames = peek(uinteger, $C00A)
                            poke tbl + 1, movie_width
                            poke tbl + 2, movie_height
                            poke tbl + 5, src_bank
                            poke tbl + 7, 16
                            poke tbl + 8, 0
                            poke tbl + 9, src_bank
                            ok = 1
                        endif
                    endif
                endif
            endif
        endif
    endif

    return ok
end function

sub PlayFrameV2(xpos as ubyte, ypos as ubyte)
    DecodePreloadedFrame(xpos, ypos, @_v2_table)
end sub

sub RewindV2()
    dim tbl as uinteger
    tbl = @_v2_table
    poke tbl + 7, 16
    poke tbl + 8, 0
    poke tbl + 9, peek(tbl + 5)
end sub


' ---- STREAMING PATH --------------------------------------------------

function InitStreamMovieV2(handle as ubyte, stream_bank as ubyte) as ubyte
    dim ok  as ubyte    = 0
    dim tbl as uinteger
    tbl = @_v2_table
    dim w   as uinteger
    dim h   as uinteger
    dim got as uinteger

    _v2_handle = handle
    _v2_ended = 0

    NextRegA($56, stream_bank)
    NextRegA($57, stream_bank + 1)

    got = fReadBytes(handle, $C000, 16)

    if got = 16 then
        ' Magic 'NMS2' = 78,77,83,50
        if peek($C000) = 78 then
            if peek($C001) = 77 then
                if peek($C002) = 83 then
                    if peek($C003) = 50 then
                        movie_l2_mode = peek($C005)
                        w = peek(uinteger, $C006)
                        h = peek(uinteger, $C008)
                        if w <= 255 then
                            if h <= 255 then
                                movie_width  = cast(ubyte, w)
                                movie_height = cast(ubyte, h)
                                movie_frames = peek(uinteger, $C00A)
                                poke tbl + 1, movie_width
                                poke tbl + 2, movie_height
                                poke tbl + 5, stream_bank
                                ok = 1
                            endif
                        endif
                    endif
                endif
            endif
        endif
    endif

    return ok
end function

sub StreamFrameV2(xpos as ubyte, ypos as ubyte)
    dim tbl       as uinteger = @_v2_table
    dim src_bank  as ubyte
    dim got       as uinteger
    dim remaining as uinteger
    dim chunk     as uinteger
    dim pair      as ubyte
    dim fsize     as uinteger

    src_bank = peek(tbl + 5)

    NextRegA($56, src_bank)
    NextRegA($57, src_bank + 1)

    got = fReadBytes(_v2_handle, $C000, 2)
    if got < 2 then
        _v2_ended = 1
        return
    endif
    fsize = peek(uinteger, $C000)
    if fsize = 0 then
        _v2_ended = 1
        return
    endif

    remaining = fsize
    pair = 0
    do while remaining > 0
        NextRegA($56, src_bank + (pair << 1))
        NextRegA($57, src_bank + (pair << 1) + 1)
        if remaining > 16384 then
            chunk = 16384
        else
            chunk = remaining
        endif
        got = fReadBytes(_v2_handle, $C000, chunk)
        if got < chunk then
            _v2_ended = 1
            return
        endif
        remaining = remaining - chunk
        pair = pair + 1
    loop

    poke tbl + 7, 0
    poke tbl + 8, 0
    poke tbl + 9, src_bank

    DecodePreloadedFrame(xpos, ypos, tbl)
end sub

function StreamMovieEnded() as ubyte
    return _v2_ended
end function

sub RewindStreamV2()
    fSetPos(_v2_handle, 16)
    _v2_ended = 0
end sub

#endif
