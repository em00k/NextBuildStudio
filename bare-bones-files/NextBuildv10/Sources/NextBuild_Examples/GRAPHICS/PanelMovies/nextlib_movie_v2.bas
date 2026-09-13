' NextBuildStudio v2 movie API -- public interface
'
' V2 .nmv / .nms files carry a 16-byte header with magic, width, height,
' frame_count and flags. This file exposes the surface API + resident
' globals; the function bodies live in nextlib_movie_v2_impl.bas and
' can be placed in a CODEBANK by the caller (see the CODEBANK section
' below).
'
' Six functions plus four resident globals:
'
'   PRELOADED (LoadSDBank the whole file, then decode from RAM):
'     if InitPreloadedMovieV2(bank) = 0 then ... : endif
'     ...loop:
'       if frame > movie_frames then frame = 0 : RewindV2()
'       else PlayFrameV2(x, y)
'
'   STREAMING (fOpenFile, then decode one frame per disk read):
'     if InitStreamMovieV2(handle, stream_bank) = 0 then ... : endif
'     ...loop:
'       if frame > movie_frames then frame = 0 : RewindStreamV2()
'       else StreamFrameV2(x, y)
'       if StreamMovieEnded() = 1 then frame = 0 : RewindStreamV2()
'
' Globals populated by either Init:
'   movie_frames    -- total frame count
'   movie_width     -- pixel width
'   movie_height    -- pixel height
'   movie_l2_mode   -- 0 = 256x192, 1 = 320x256 (future, not supported yet)
'
' ---- CODEBANK: banking the function bodies ----
'
' Placing the bodies in a code bank keeps ~5 KB of decoder + FileLib +
' memplay code out of the resident $8000-$FFFF budget. The public
' globals above stay resident (banked code can read/write them), but the
' impl file needs to be included INSIDE a #pragma codebank block, which
' means telling this header not to include it for us:
'
'   #define _V2_IMPL_EXTERNAL
'   #include "nextlib_movie_v2.bas"       ' declares + resident globals
'   #pragma codebank = 1
'   #include "nextlib_movie_v2_impl.bas"  ' bodies land in the bank
'   #pragma codebank = 0
'
' Without _V2_IMPL_EXTERNAL, the impl is pulled in below and everything
' compiles resident, exactly as it did before CODEBANK support was added.
'
' If a large preloaded movie freezes partway through, LoadSDBank has run
' out of user banks -- convert as .nms and use the streaming path instead.

#ifndef __NEXTLIB_MOVIE_V2__
#define __NEXTLIB_MOVIE_V2__

#include once <nextlib.bas>
#include once <FileLib-inc.bas>

' Public declares
declare function InitPreloadedMovieV2(src_bank as ubyte) as ubyte
declare sub      PlayFrameV2(xpos as ubyte, ypos as ubyte)
declare sub      RewindV2()

declare function InitStreamMovieV2(handle as ubyte, stream_bank as ubyte) as ubyte
declare sub      StreamFrameV2(xpos as ubyte, ypos as ubyte)
declare function StreamMovieEnded() as ubyte
declare sub      RewindStreamV2()

' Public resident globals -- banked code can read/write these freely
dim movie_frames  as uinteger = 0
dim movie_width   as ubyte    = 0
dim movie_height  as ubyte    = 0
dim movie_l2_mode as ubyte    = 0


#ifndef _V2_IMPL_EXTERNAL
#include "nextlib_movie_v2_impl.bas"
#endif

#endif
