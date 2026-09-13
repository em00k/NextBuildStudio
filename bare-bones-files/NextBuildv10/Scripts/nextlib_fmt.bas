' ---------------------------------------------------------------
' nextlib_fmt.bas - fixed width number formatting
' David Saphier / em00k
'
'   FmtU8(buf, v, digits, pad)      0-255
'   FmtU16(buf, v, digits, pad)     0-65535
'   FmtU32(buf, v, digits, pad)     0-4294967295
'   FmtI16(buf, v, digits, pad)     -32768 to 32767, sign inside the field
'   FmtHex8(buf, v)                 two hex digits
'   FmtHex16(buf, v)                four hex digits
'   FmtFx(buf, v, dp)               8.8 fixed point, e.g. "-1.50"
'   FmtStr(buf, n)                  n bytes of a buffer as a String
'   RJust(s$, w) / ZeroPad(n, w)    the String forms, for PRINT and FL2Text
'
' `buf` is the address of a buffer you own - typically a uByte array passed as
' @b(0). Nothing is allocated, so these are safe to call from an interrupt
' handler and cost nothing per frame. That is the difference from NStr(),
' which builds a String on the heap: use NStr for PRINT, use these for a HUD
' you redraw every frame.
'
' `digits` is a MINIMUM width, as printf's is. A number too wide overruns the
' field rather than being truncated - a truncated score reads as a different,
' smaller number, which is worse than a HUD one column out. `pad` is the
' character to pad with, usually " " or "0"; pass 0 for no padding at all.
'
' Every call takes the address it writes to, so laying two fields side by side
' is FmtU16(@b(0), ...) then FmtU16(@b(3), ...). The core does advance its own
' pointer past each field, but that is internal - the BASIC wrappers set it
' from their argument every time, so it is only useful from asm.
'
' Needs nextlib.bas included first. Happy in a code bank.
' ---------------------------------------------------------------

#ifndef __NEXTLIB_FMT__
#define __NEXTLIB_FMT__

#ifndef __NEXTLIB__
#error "nextlib_fmt.bas needs #include <nextlib.bas> before it"
#endif

#pragma push(case_insensitive)
#pragma case_insensitive = TRUE
#pragma zxnext = TRUE

nb_fmt_core:
asm
        jp      nbf_lib_end
        #include once <nb_FMT.asm>
nbf_lib_end:
end asm


' 0-255, right aligned in `digits` columns.
sub FmtU8(byval buf as uinteger, byval v as ubyte, byval digits as ubyte, byval pad as ubyte)
    asm
        call    nbf_args8
        call    nbf_u8
    end asm
end sub


' 0-65535.
sub FmtU16(byval buf as uinteger, byval v as uinteger, byval digits as ubyte, byval pad as ubyte)
    asm
        call    nbf_args16
        call    nbf_u16
    end asm
end sub


' 0-4294967295.
sub FmtU32(byval buf as uinteger, byval v as ulong, byval digits as ubyte, byval pad as ubyte)
    asm
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbf_buf), hl
        ld      l, (ix+6)
        ld      h, (ix+7)
        ld      (nbf_num), hl
        ld      l, (ix+8)
        ld      h, (ix+9)
        ld      (nbf_num+2), hl
        ld      a, (ix+11)
        ld      (nbf_digits), a
        ld      a, (ix+13)
        ld      (nbf_pad), a
        call    nbf_u32
    end asm
end sub


' -32768 to 32767. The minus sign sits inside the padded field, so a column
' of numbers stays aligned: "   -12" rather than "-   12".
sub FmtI16(byval buf as uinteger, byval v as integer, byval digits as ubyte, byval pad as ubyte)
    asm
        call    nbf_args16
        call    nbf_i16
    end asm
end sub


' Two hex digits, always.
sub FmtHex8(byval buf as uinteger, byval v as ubyte)
    asm
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbf_buf), hl
        ld      a, (ix+7)
        ld      (nbf_num), a
        call    nbf_hex8
    end asm
end sub


' Four hex digits, always.
sub FmtHex16(byval buf as uinteger, byval v as uinteger)
    asm
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbf_buf), hl
        ld      l, (ix+6)
        ld      h, (ix+7)
        ld      (nbf_num), hl
        call    nbf_hex16
    end asm
end sub


' An 8.8 fixed point value with `dp` decimal places, e.g. FmtFx(b, 384, 2)
' gives "1.50". The fraction is truncated, not rounded.
sub FmtFx(byval buf as uinteger, byval v as integer, byval dp as ubyte)
    asm
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbf_buf), hl
        ld      l, (ix+6)
        ld      h, (ix+7)
        ld      (nbf_num), hl
        ld      a, (ix+9)
        ld      (nbf_digits), a
        call    nbf_fx
    end asm
end sub


' --- the String forms, for PRINT and FL2Text ---------------------------
' These allocate on the heap, which the Fmt* routines above deliberately do
' not. Use them where the value only changes now and then; use the buffer
' form for anything you redraw every frame, or to poke characters straight
' into a tilemap.

' `n` bytes of a buffer as a String, so something Fmt* wrote can be printed.
function FmtStr(byval buf as uinteger, byval n as ubyte) as string
    dim s as string
    dim i as ubyte
    s = ""
    if n = 0 then
        return s
    end if
    for i = 0 to n - 1
        s = s + CHR(peek(buf + i))
    next i
    return s
end function


' Right align in w columns, padded with spaces.
function RJust(byval s as string, byval w as ubyte) as string
    dim r as string
    r = s
    do while LEN(r) < w
        r = " " + r
    loop
    return r
end function


' Right align in w columns, padded with zeros.
function ZeroPad(byval n as ulong, byval w as ubyte) as string
    dim s as string
    s = STR(n)
    do while LEN(s) < w
        s = "0" + s
    loop
    return s
end function


' Argument shapes shared by the wrappers above. Both read the caller's frame,
' so they only work called straight from one of them.
asm
        jp      nbf_args_end

nbf_args8:
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbf_buf), hl
        ld      a, (ix+7)
        ld      l, a
        ld      h, 0
        ld      (nbf_num), hl
        ld      hl, 0
        ld      (nbf_num+2), hl
        ld      a, (ix+9)
        ld      (nbf_digits), a
        ld      a, (ix+11)
        ld      (nbf_pad), a
        ret

nbf_args16:
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbf_buf), hl
        ld      l, (ix+6)
        ld      h, (ix+7)
        ld      (nbf_num), hl
        ld      hl, 0
        ld      (nbf_num+2), hl
        ld      a, (ix+9)
        ld      (nbf_digits), a
        ld      a, (ix+11)
        ld      (nbf_pad), a
        ret

nbf_args_end:
end asm

#pragma pop(case_insensitive)

#endif
