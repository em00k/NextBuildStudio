' ---------------------------------------------------------------
' nextlib_primitives.bas - Layer 2 drawing primitives
' David Saphier / em00k
'
' Plot, line, box and circle for Layer 2, working in all three modes.
' Every routine reads nextlib's _screen_mode, which InitLayer2() sets, so
' the same call draws the right thing in 256x192, 320x256 or 640x256.
' Coordinates are always screen pixels: X is 0-255, 0-319 or 0-639 by mode,
' Y is 0-191 or 0-255. Anything off the edge is clipped, not wrapped.
'
'   L2Plot(x, y, c)                 one pixel
'   L2Point(x, y)                   read one pixel back
'   L2HLine(x, y, w, c)             horizontal run, w pixels
'   L2VLine(x, y, ht, c)            vertical run, ht pixels
'   L2Line(x1, y1, x2, y2, c)       any angle, Bresenham
'   L2Box(x1, y1, x2, y2, c)        outline
'   L2FillBox(x1, y1, x2, y2, c)    solid
'   L2Circle(x, y, r, c)            outline, centre and radius
'   L2FillCircle(x, y, r, c)        solid
'   L2Triangle / L2FillTriangle     three points
'   L2Poly / L2FillPoly             a point list, see below
'   L2Cls(c)                        flood the screen
'   L2SetMode(mode)                 tell the primitives which mode is up
'   L2MaxX() / L2MaxY()             last on-screen column and row of the mode
'   L2ScrollTo(x, y)                hardware scroll, full width in every mode
'
' In 640x256 the colour is 0-15 and two pixels share a byte; the routines
' do the read-modify-write, so a plot never disturbs its neighbour.
'
' L2Poly and L2FillPoly take the address of a uInteger array holding x, y,
' x, y, ... so a hexagon is DIM p(11) as uInteger, drawn with L2Poly(@p(0), 6, c).
'
' Two things to know about the polygon fill. It fills the CONVEX HULL, so
' triangles, quads, rotated boxes and 3D faces are exact but a concave outline
' gets filled across its dents - split those into triangles. And the fill and
' the outline are different rasterisers, so along a shallow edge the outline
' can sit one row outside the fill; drawing the fill first and the outline over
' it gives the result you want.
'
' Needs nextlib.bas included first - that is where _screen_mode lives.
'
' The whole thing is happiest in a code bank, which is what it was written
' for. Wrap the include and it costs nothing out of the resident 32K:
'
'   '!codebank=30                       ' CODEBANK 1 -> 8K page 30
'   #include <nextlib.bas>
'
'   #pragma codebank = 1
'   #include <nextlib_primitives.bas>
'   #pragma codebank = 0                ' do not forget to switch back
'
' Call sites are identical either way. Without the pragmas it compiles
' resident and still works.
'
' ClearLayer2() is a much faster way to blank the screen than L2Cls() -
' it clears whole banks with LDIR instead of going through the primitives.
' ---------------------------------------------------------------

#ifndef __NEXTLIB_PRIMITIVES__
#define __NEXTLIB_PRIMITIVES__

' _screen_mode and the Layer 2 setup live in nextlib, so it has to come first.
' This is deliberately an #error and not an #include: inside a `#pragma
' codebank` an include here would compile the whole of nextlib into the 8K
' bank, and you would get an overflow rather than a reason.
#ifndef __NEXTLIB__
#error "nextlib_primitives.bas needs #include <nextlib.bas> before it"
#endif

#pragma push(case_insensitive)
#pragma case_insensitive = TRUE
#pragma zxnext = TRUE

' The assembler core. Inside a CODEBANK this block is compiled into the bank
' and never runs inline; outside one it sits in the main body, hence the jump
' over it.
nb_primitives_core:
asm
        jp      nbp_lib_end
        #include once <nb_PLOT.asm>
nbp_lib_end:
end asm


' Point the primitives at a Layer 2 mode. InitLayer2() already does this, so
' this is only for code that sets Layer 2 up by hand.
'   mode = MODE256X192, MODE320X256 or MODE640X256
sub fastcall L2SetMode(byval mode as ubyte)
    asm
        and     3
        ld      (._screen_mode), a
    end asm
end sub


' Last on-screen column: 255, 319 or 639 by mode. Drawing that scales itself
' to whatever mode is up wants these rather than hard-coded numbers.
function L2MaxX() as uinteger
    asm
        call    nbp_dims
        ld      hl, (nbp_maxx)
    end asm
end function


' Last on-screen row: 191 in 256x192, 255 in the other two.
function L2MaxY() as ubyte
    asm
        call    nbp_dims
        ld      a, (nbp_maxy)
    end asm
end function


' Scroll Layer 2 to pixel offset x,y.
'
' Use this rather than nextlib's ScrollLayer(), which takes x as a uByte and
' writes only NextReg $16 - so it cannot reach past x=255, and cannot clear an
' X MSB left set by something else. This one always writes $71, even when it is
' zero, so it can never strand the layer 256 pixels over.
'
' $16 plus bit 0 of $71 is a NINE bit field, so x runs 0-511. That covers
' 320x256 completely; in 640x256 anything above 511 wraps, because the register
' pair has no more bits. y is 0-255, or 0-191 in 256x192.
' Needs core 3.0.6 or later.
sub L2ScrollTo(byval x as uinteger, byval y as ubyte)
    asm
        ld      a, (ix+4)
        nextreg $16, a                  ; X offset, low 8 bits
        ld      a, (ix+5)
        and     1
        nextreg $71, a                  ; X offset, bit 8
        ld      a, (ix+7)
        nextreg $17, a                  ; Y offset
    end asm
end sub


' One pixel at x,y in colour c.
sub L2Plot(byval x as uinteger, byval y as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        ld      e, (ix+4)
        ld      d, (ix+5)
        ld      h, (ix+7)
        ld      l, (ix+9)
        call    nbp_plot
        call    nbp_end
    end asm
end sub


' The colour of the pixel at x,y. Off screen reads as 0.
function L2Point(byval x as uinteger, byval y as ubyte) as ubyte
    asm
        call    nbp_begin
        ld      e, (ix+4)
        ld      d, (ix+5)
        ld      h, (ix+7)
        call    nbp_point
        ld      (nbp_tcol), a
        call    nbp_end
        ld      a, (nbp_tcol)
    end asm
end function


' Horizontal run of w pixels starting at x,y.
sub L2HLine(byval x as uinteger, byval y as ubyte, byval w as uinteger, byval c as ubyte)
    asm
        call    nbp_begin
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbp_sx), hl
        ld      l, (ix+7)
        ld      h, 0
        ld      (nbp_sy), hl
        ld      l, (ix+8)
        ld      h, (ix+9)
        ld      (nbp_sl), hl
        ld      a, (ix+11)
        ld      (nbp_col), a
        call    nbp_hline
        call    nbp_end
    end asm
end sub


' Vertical run of ht pixels starting at x,y.
sub L2VLine(byval x as uinteger, byval y as ubyte, byval ht as uinteger, byval c as ubyte)
    asm
        call    nbp_begin
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbp_sx), hl
        ld      l, (ix+7)
        ld      h, 0
        ld      (nbp_sy), hl
        ld      l, (ix+8)
        ld      h, (ix+9)
        ld      (nbp_sl), hl
        ld      a, (ix+11)
        ld      (nbp_col), a
        call    nbp_vline
        call    nbp_end
    end asm
end sub


' Line from x1,y1 to x2,y2.
sub L2Line(byval x1 as uinteger, byval y1 as ubyte, byval x2 as uinteger, byval y2 as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbp_x0), hl
        ld      l, (ix+7)
        ld      h, 0
        ld      (nbp_y0), hl
        ld      l, (ix+8)
        ld      h, (ix+9)
        ld      (nbp_x1), hl
        ld      l, (ix+11)
        ld      h, 0
        ld      (nbp_y1), hl
        ld      a, (ix+13)
        ld      (nbp_col), a
        call    nbp_line
        call    nbp_end
    end asm
end sub


' Box outline. Either pair of opposite corners will do.
sub L2Box(byval x1 as uinteger, byval y1 as ubyte, byval x2 as uinteger, byval y2 as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        call    nbp_boxargs
        call    nbp_rect
        call    nbp_end
    end asm
end sub


' Solid box.
sub L2FillBox(byval x1 as uinteger, byval y1 as ubyte, byval x2 as uinteger, byval y2 as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        call    nbp_boxargs
        call    nbp_fillrect
        call    nbp_end
    end asm
end sub


' Circle outline, centre x,y and radius r.
sub L2Circle(byval x as uinteger, byval y as ubyte, byval r as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        call    nbp_circargs
        call    nbp_circle
        call    nbp_end
    end asm
end sub


' Solid circle.
sub L2FillCircle(byval x as uinteger, byval y as ubyte, byval r as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        call    nbp_circargs
        call    nbp_fillcircle
        call    nbp_end
    end asm
end sub


' Triangle outline through the three points.
sub L2Triangle(byval x1 as uinteger, byval y1 as ubyte, byval x2 as uinteger, byval y2 as ubyte, byval x3 as uinteger, byval y3 as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        call    nbp_triargs
        call    nbp_polyline
        call    nbp_end
    end asm
end sub


' Solid triangle. Three points are always convex, so this is always exact.
sub L2FillTriangle(byval x1 as uinteger, byval y1 as ubyte, byval x2 as uinteger, byval y2 as ubyte, byval x3 as uinteger, byval y3 as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        call    nbp_triargs
        call    nbp_polyfill
        call    nbp_end
    end asm
end sub


' Closed outline through n points.
'
' pts is the address of a uInteger array holding x, y, x, y, ... so a five
' sided shape wants DIM p(9) as uInteger and is drawn with L2Poly(@p(0), 5, c).
sub L2Poly(byval pts as uinteger, byval n as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        call    nbp_polyargs
        call    nbp_polyline
        call    nbp_end
    end asm
end sub


' Solid version of L2Poly. Convex shapes come out exact; a concave outline is
' filled across its dents, so split those into triangles.
sub L2FillPoly(byval pts as uinteger, byval n as ubyte, byval c as ubyte)
    asm
        call    nbp_begin
        call    nbp_polyargs
        call    nbp_polyfill
        call    nbp_end
    end asm
end sub


' Flood the whole screen with c. ClearLayer2() is far quicker.
sub fastcall L2Cls(byval c as ubyte)
    asm
        ld      (nbp_col), a
        call    nbp_begin
        call    nbp_cls
        call    nbp_end
    end asm
end sub


' The two argument shapes the four routines above share. Both read the
' caller's frame, so they only work called straight from one of them.
asm
        jp      nbp_args_end

nbp_boxargs:
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbp_x0), hl
        ld      l, (ix+7)
        ld      h, 0
        ld      (nbp_y0), hl
        ld      l, (ix+8)
        ld      h, (ix+9)
        ld      (nbp_x1), hl
        ld      l, (ix+11)
        ld      h, 0
        ld      (nbp_y1), hl
        ld      a, (ix+13)
        ld      (nbp_col), a
        ret

nbp_circargs:
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbp_x0), hl
        ld      l, (ix+7)
        ld      h, 0
        ld      (nbp_y0), hl
        ld      a, (ix+9)
        ld      (nbp_r), a
        ld      a, (ix+11)
        ld      (nbp_col), a
        ret

nbp_polyargs:
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbp_pts), hl
        ld      a, (ix+7)
        ld      (nbp_np), a
        ld      a, (ix+9)
        ld      (nbp_col), a
        ret

; Three explicit points copied into the library's own three point list, so the
; triangle routines are just the polygon ones with n = 3.
nbp_triargs:
        ld      hl, nbp_tribuf
        ld      (nbp_pts), hl
        ld      a, 3
        ld      (nbp_np), a
        ld      l, (ix+4)
        ld      h, (ix+5)
        ld      (nbp_tribuf), hl
        ld      l, (ix+7)
        ld      h, 0
        ld      (nbp_tribuf+2), hl
        ld      l, (ix+8)
        ld      h, (ix+9)
        ld      (nbp_tribuf+4), hl
        ld      l, (ix+11)
        ld      h, 0
        ld      (nbp_tribuf+6), hl
        ld      l, (ix+12)
        ld      h, (ix+13)
        ld      (nbp_tribuf+8), hl
        ld      l, (ix+15)
        ld      h, 0
        ld      (nbp_tribuf+10), hl
        ld      a, (ix+17)
        ld      (nbp_col), a
        ret

nbp_args_end:
end asm

#pragma pop(case_insensitive)

#endif
