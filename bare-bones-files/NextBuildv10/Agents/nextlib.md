# nextlib — writing NextBuild programs

Companion to [AGENTS.md](AGENTS.md), which covers the repository layout, the
Python tooling and the commit conventions. **Read that one first.** This file is
about the ZX Basic side: what the libraries give you, what the compiler does
that will surprise you, and what the hardware does that will surprise you more.

Everything here has been checked against the tree at `zxbasic1.18.7` (version
`1.18.7-nb3`). Where a claim was verified by compiling something or by running
it on an emulator, it says so — treat the rest as "believed true, worth
re-checking if it matters".

---

## 1. Build and run

```bash
# from the repository root
python/bin/python Scripts/nextbuild.py -b Sources/MyGame/MyGame.bas
```

`python/bin/python` is the project's own virtualenv — use it rather than the
system Python, it has the packages the scripts expect. A good build ends with
`NEX created OK! All done.` and a size report. Errors also land in
`<project>/Compile.txt`, and a label map in `<project>/build/<name>.bas.map`.

Useful flags: `--sync-hdf` (sync artifacts to the HDF image without building),
`--nex-only` (repack the NEX from an existing `.bin`), `-D NAME` (set a global
`#define`), `-q` (no splash). `python/bin/python Scripts/nextbuild.py -h` for
the rest.

To run it:

```bash
python/bin/python Scripts/launch_cspect.py --nex Sources/MyGame/MyGame.nex --echo
```

That needs a display. For anything that can be checked without one, see
§9 — Layer 2 addressing in particular is far better tested under emulation than
by looking at a screen.

### Project layout

One folder per project under `Sources/`, with the `.bas` and its assets
together, and `build/` for intermediates. Note `.gitignore` ignores `*` and
un-ignores selectively, so **new files are untracked by default** — check with
`git check-ignore -v <path>` before assuming something is under version
control, and never delete an untracked file on the assumption git has a copy.

---

## 2. The smallest useful program

```basic
' Project: MyGame
'!org=$c000                  ' where the resident program is assembled
'!codebank=30                ' CODEBANK 1 -> 8K page 30, 2 -> 31, ...

#define NEX                  ' pack assets into the NEX instead of loading from SD
#define IM2                  ' IM 2 interrupts, handler in upper RAM

#include <nextlib.bas>

InitLayer2(MODE320X256)
ShowLayer2(1)
ClearLayer2(0)

DO
    WaitRetrace(1)
LOOP
```

`'!` directives must appear near the top of the file. The ones `nextbuild.py`
reads: `org`, `pc`, `sp`, `nosp`, `opt` / `optimize`, `heap`, `codebank`,
`codebankpages`, `codebankdepth`, `codewindow`. The same settings exist as
`#pragma` and as `zxbc` flags.

Feature `#define`s that nextlib itself tests: `NEX`, `IM2`, `LAYER2`, `AYFX`,
`CTC`, `DEBUG`, `DEV`, `NOBREAK`, `NODARK`, `NOINTCHECK`, `NOSP`.

`IM2` matters more than it looks. Several library routines page Layer 2 over
`$0000-$3FFF`, which is where an IM 1 handler lives, so they guard themselves
with `di`/`ei` — **unless `IM2` is defined**, in which case the handler is up in
resident RAM and the guard is skipped. Define it unless you have a reason not
to; without it, long fills run with interrupts off.

### Where includes come from

`#include <name>` searches the NextBuild `Scripts/` directory **and** the
compiler's own stdlib at `zxbasic1.18.7/src/lib/arch/zxnext/stdlib/`. So
`<nextlib.bas>` is NextBuild's, `<keys.bas>` is Boriel's. `ls` that stdlib
directory before writing something yourself — `alloc`, `zx0`, `random`, `sinclair`,
`print42`, `screen` and a couple of dozen others are already there.

---

## 3. Library map

| Include | Gives you |
|---|---|
| `<nextlib.bas>` | Everything below except where noted. Pulls in `nb_LAYER2.bas`, `nb_constants.bas`, `nbs_constants.asm`, `zxnext_utils.asm` |
| `<nextlib_primitives.bas>` | Layer 2 drawing primitives — plot, line, box, circle, triangle, polygon. Separate include, designed to live in a code bank |
| `<nextlib_rnd.bas>` | `RndSeed`, `RndByte`, `RndWord`, `RndBelow`/`RndRange` (uByte) and `RndBelowW`/`RndRangeW` (16-bit, for screen coordinates). Keep it resident — it holds state and is the sort of thing an ISR reaches for |
| `<nextlib_fmt.bas>` | `FmtU8`/`U16`/`U32`/`I16`, `FmtHex8`/`Hex16`, `FmtFx` into a buffer you own — no heap, so free per frame; plus `FmtStr`/`RJust`/`ZeroPad`, the String forms for `PRINT` and `FL2Text`. Code bank friendly |
| `<nextlib_ints.bas>` / `<nextlib_ints_ctc.bas>` | Interrupt and audio drivers, pulled in automatically by `#define AYFX` / `#define CTC` |
| `<keys.bas>` (Boriel stdlib) | `GetKey()`, `MultiKeys(scancode)`, `GetKeyScanCode()` and the `KEYA`…`KEY0` constants |

### nextlib, by area

Signatures are as declared; `fastcall` is noted because it changes the ASM
calling convention (§6).

**Layer 2 setup** — `InitLayer2(mode)` *fastcall*, `ShowLayer2(on)` *fastcall*,
`ClearLayer2(colour)` *fastcall*, `ClipLayer2(x1,x2,y1,y2)`,
`ScrollLayer(x,y)` *fastcall*, `EnableShadow()` / `DisableShadow()` / `FlipBuffer()` *fastcall*.

Modes are `MODE256X192`, `MODE320X256`, `MODE640X256` (also spelled with a
lowercase `x`). `InitLayer2` stores the mode in the global asm byte
`_screen_mode`, which is what every mode-aware routine reads.
`ClearLayer2` clears whole banks with `LDIR` — much faster than filling.

**Layer 2 drawing (older, mode-specific)** — `PlotL2(x,y,c)` and `PointL2(x,y)`
are 256x192 only, 8-bit coordinates. `FPlotL2(y,x,c)`, `FPlotLineV(y,x,h,c)`,
`FPlotLineW(y,x,w,c)` are 320x256. `CIRCLEL2(x,y,r,c)`. `DrawImage(x,y,data,frame)`.
Prefer `nextlib_primitives.bas` (§4) for new work — it is mode-aware and clips.

**Text on Layer 2** — `L2Text(x,y,m$,fontbank,colourmask)`,
`FL2Text(x,y,m$,fontbank)`. Fonts come from `Scripts/system_data/*.fnt`, loaded
into a bank with `LoadSDBank`. **`FL2Text` leaves a bank offset latched in port
`$123B`** — see §8, it has bitten real code.

**Palette** — `SetRGB(index,r,g,b)`, `SetPalette(pal,index,value)` *fastcall*,
`GetPalette(pal,index)` *fastcall*, `SelectPalette(p)` *fastcall*,
`InitPalette(...)` *fastcall*, `PalUpload(addr,colours,offset,bank)`.

**Sprites** — `InitSprites(total,addr,bank)`, `InitSprites2(...)` *fastcall*,
`ShowSprites(flag)` *fastcall*, `UpdateSprite(x,y,id,pattern,mflip,anchor)`,
`RemoveSprite(id,visible)`, `ClipSprite(x1,x2,y1,y2)`.

**Tiles** — `DoTile8`, `DoTileBank8`, `DoTileBank16`, `FDoTile8`/`FDoTile16`
*fastcall*, `TileMap(addr,blkoff,ntiles,x,y,width,mapwidth)`, `ClipTile(...)`.

**Banks and memory** — `LoadSDBank(file$,addr,len,offset,bank)`,
`LoadSD(...)`, `SaveSD(...)`, `ReserveBank()`, `FreeBank(bank)`,
`BankPeek`/`BankPoke`/`BankPeekUint`/`BankPokeUint` *fastcall*,
`CopyToBanks`, `CopyFromBank`, `BankToRam`, `ClearBanks`, `MMU8`,
`MMU8new`/`MMU16`/`GetMMU` *fastcall*, `swapbank(bank)` *fastcall*,
`zx7Unpack(src,dst)`.

A filename of `"[]name.ext"` means "from the NextBuild system data directory",
so `LoadSDBank("[]font5.fnt",0,0,0,32)` loads a stock font into 8K page 32.

**Timing and input** — `WaitRetrace(n)`, `WaitRetrace2(n)` *fastcall*
(`WaitRaster` is a `#define` alias for `WaitRetrace2`), `WaitKey()` *fastcall*,
`RunAT(speed)` *fastcall* (0/1/2/3 = 3.5/7/14/28 MHz).
Kempston is `IN 31` read directly — bit 0 right, 1 left, 2 down, 3 up, 4 fire.
`Sources/NextBuild_Examples/INPUT/GamePad/GamePad.bas` is the worked example.

**Registers and misc** — `NextRegA(reg,value)` *fastcall*, `GetReg(reg)`
*fastcall*, `check_interrupts()` *fastcall*, `NStr(n)` *fastcall*,
`BinToString(n)` *fastcall*, `Console(s$)`, `Debug(...)`.

### Superseded — do not hand-roll these

An audit of every project found these written out by hand over and over, in
most cases because the existing routine was under a name nobody searched for.
Check this table before writing a helper.

| Hand-rolled as | Use instead | Notes |
|---|---|---|
| `SwapBuffers()` | `FlipBuffer()` | Identical logic (swap NextReg `$12`/`$13`). `SwapBuffers` is now a `#DEFINE` alias, so either name works |
| `L2_Pixel` / `L2_Line` / `L2_Clear` / `Triangle` / `LineXYXY` | `nextlib_primitives.bas` | Mode-aware and clipped; see §4 |
| `Clear256DMA` / `dma_clear` | *(no library routine yet)* | Every copy in the tree ignores its colour argument — do not copy one |
| `fSin` / `fCos` / `fTan` | `#include <fmath.bas>` | They are verbatim copies of Boriel's stdlib. Too slow for per-frame use, but nobody needs to paste them |
| hand-typed `sintable:` `DEFB` blocks | `Scripts/sinus_creator.py` | Generate the table, don't type it |
| `randnum()` / `Random()` | `<random.bas>` (Boriel stdlib) | `randInt`, `randomLimit`; note `randomLimit` is the unbiased one |
| `ScrollLayer(x,y)` for 320/640 modes | `L2ScrollTo(x,y)` | `ScrollLayer` takes `x` as a `uByte` and writes only NextReg `$16`, so it cannot pass 255 and cannot clear an X MSB left set by other code |

Not aliased on purpose, because the behaviour differs — read before switching:
`PlotL2` **wraps** at y≥192 where `L2Plot` **clips**, and the `FPlotL2` /
`FPlotLineV` / `FPlotLineW` family takes `(y, x, …)` where the `L2*` routines
take `(x, y, …)`.

---

## 4. nextlib_primitives.bas

Mode-aware Layer 2 drawing. Every routine reads `_screen_mode`, so the same
call does the right thing in all three modes, and everything clips rather than
wrapping.

```
L2Plot(x, y, c)                      L2Line(x1, y1, x2, y2, c)
L2Point(x, y) as uByte               L2Box / L2FillBox(x1, y1, x2, y2, c)
L2HLine(x, y, w, c)                  L2Circle / L2FillCircle(x, y, r, c)
L2VLine(x, y, ht, c)                 L2Triangle / L2FillTriangle(x1,y1,x2,y2,x3,y3,c)
L2Cls(c)                             L2Poly / L2FillPoly(@pts(0), n, c)
L2SetMode(mode)                      L2MaxX() / L2MaxY()
```

`L2MaxX()`/`L2MaxY()` return the mode's last on-screen column and row
(255/191, 319/255, 639/255) — use them instead of hard-coding, or your drawing
only looks right in one mode.

Point lists are a `uInteger` array of `x, y, x, y, …`, so a hexagon is
`DIM p(11) as uInteger` and `L2Poly(@p(0), 6, c)`. Two documented limits: the
polygon fill fills the **convex hull** (triangles, quads, rotated boxes and 3D
faces are exact; split concave shapes into triangles), and the fill and the
outline are different rasterisers so along a shallow edge the outline can sit
**one row** outside the fill — draw the fill first, then the outline over it.

The whole library is happiest in a code bank, which costs one small trampoline
per routine in the resident program:

```basic
'!codebank=30
#include <nextlib.bas>
#pragma codebank = 1
#include <nextlib_primitives.bas>
#pragma codebank = 0            ' do not forget to switch back
```

It is about 4.1K in the bank with everything referenced. Call sites are
identical whether it is banked or resident.

The assembler core is `Scripts/nb_PLOT.asm`, which documents the Layer 2
addressing for all three modes at the top and is worth reading before writing
any Layer 2 code of your own.

---

## 5. Boriel ZX BASIC traps

These are the ones that compile silently and produce plausible wrong answers.

- **`uByte * const` truncates to 8 bits.** The compiler emits `mul d,e` and
  reads only `E`. On a `uByte` counter, `i * 10` wraps at `i = 26`
  (260 → 4). Verified from the generated asm. Use a `uInteger` for anything
  whose product can reach 256. This is upstream behaviour, identical in banked
  and resident code.
- **`AND` / `OR` / `NOT` are logical, not bitwise.** `300 AND 255` is **1**.
  Use `BAND` / `BOR` / `BXOR` / `BNOT`.
- **Intermediate results keep the operand type.** `170 + i * 16` with a `uByte`
  `i` is computed as a `uByte` and wraps at 256 *before* being widened for a
  `uInteger` parameter.
- **No `SELECT CASE`** — the parser reads `select` as a float variable. Use
  `IF` / `ELSEIF` chains.
- **Strings are 0-indexed.** `s$(0 TO 0)` is the first character; the whole
  string is `s$(0 TO LEN(s$) - 1)`. Guard `LEN(s$) = 0` before
  `FOR i = 0 TO LEN(s$) - 1`, since on a `uByte` counter the `-1` wraps to 255.
- **`LEN` and `TAB` are reserved**, so `DIM len as uByte` is a syntax error
  reported against the *next* line.
- **String FUNCTIONs must be defined before their caller.** Plain SUBs forward
  reference fine; a `function ... as string` does not.
- **`poke <type>, <addr>, <val>` crashes the compiler** with a bare Python
  `IndexError`. Drop the comma: `poke uByte addr, val`. Asymmetrically,
  `peek(uByte, addr)` *does* take its comma.
- **Unused things are dead-stripped.** An array whose only remaining subscript
  use is a write disappears, taking any inline-asm or pointer access with it —
  `@arr(0)` counts as a use and fixes it. Unreferenced SUBs are dropped too,
  which matters when writing a test harness that calls routines externally.
- **Arrays are expensive.** Every subscript is a `__ARRAY` runtime call, and
  every sub zero-fills its locals on entry. For hot loops take `@arr(0)` once
  and `peek`/`poke` from there.

---

## 6. Inline assembly contract

Verified this session by compiling probes and reading the output.

**Stack frame.** A `SUB` or `FUNCTION` opens with `push ix / ld ix,0 / add ix,sp`.
Arguments are pushed **right to left**, so the first argument is nearest the
top of the stack, and each occupies a 2-byte slot:

```
(ix+0,1)  saved IX          slot n starts at ix+4+2n
(ix+2,3)  return address    uInteger: lo at ix+4+2n, hi at ix+5+2n
(ix+4…)   arguments         uByte:    value at ix+5+2n  (pushed via PUSH AF)
```

So for `SUB S(x as uInteger, y as uByte, c as uByte)`: `x` at `(ix+4)`/`(ix+5)`,
`y` at `(ix+7)`, `c` at `(ix+9)`.

**A FUNCTION frame is identical to a SUB frame** — there is no hidden
return-value pointer and no `+2` shift, confirmed for `uByte`, `uInteger` and
`String` returns. Results come back in `A`, `HL` and `DE:HL`; a `String` return
is `HL` and the caller frees it with `__MEM_FREE`. A function whose body is
inline asm can simply leave the value in the right register and fall through to
the epilogue.

**`fastcall` is different.** The *first* argument arrives in a register — `A`
for a `uByte`, `HL` for a `uInteger` or string — and there is no IX frame for
it. Later arguments are on the stack and must be popped by hand; the existing
`fastcall` routines in nextlib show the idiom (`pop hl` to save the return
address first, `push hl` before returning).

**Do not touch IX.** It is the frame pointer. If you need it, save and restore
it. The epilogue is `ld sp,ix / pop ix / exx / …/ exx / ret`, so push/pop must
balance, and **the shadow registers are used across a call boundary** — don't
expect `HL'`/`BC'` to survive.

**Labels.** In zxbasm a leading dot means the **root namespace**, not a local
label. `.exit` under `plot_pixel` is a global label called `exit`, not
`plot_pixel.exit` — write two of them in one file and you get a redefinition,
which is why hand-written NextBuild asm tends to have `exit1`, `exit2`,
`exit3`. For real scoping use `PROC` / `LOCAL` / `ENDP`, or
`push namespace name` / `pop namespace`, or just prefix every label
(`nbp_…`), which is what `nb_PLOT.asm` does.

Reference a BASIC global or another module's label with the dot form:
`ld a,(._screen_mode)`, `ld hl,(._myvar)`.

**Calling a BASIC SUB from asm: use `call ._Name`, not `call _Name`.** The
no-dot form can silently resolve to a garbage address with no build error, and
it is layout-dependent, so a sibling call working proves nothing. Raw asm
labels are fine without the dot.

**`#include` inside an `asm` block works** and searches the library path —
`#include once <zxnext_utils.asm>`. But the directive is `#include`, not
`include`; and **standalone `zxbasm` has no preprocessor at all**, so a file
full of `#include`/`#ifndef` only assembles when driven through `zxbc`.

---

## 7. CODEBANK — code in 8K banks

ZX Basic has one flat ORG, so without this everything must fit
`$6000-$FFFF`. `CODEBANK` compiles SUBs and FUNCTIONs into ZX Next 8K pages at
a window (`$6000-$7FFF`, NextReg `$53`), with a 6-byte resident trampoline per
routine. **Call sites do not change.**

```basic
'!codebank=30                   ' CODEBANK 1 -> page 30, 2 -> 31, ...
CODEBANK 1
    SUB DrawLevel()
        ...
    END SUB
END CODEBANK
```

`#pragma codebank = n` does the same without a block and is the form to use
around an `#include`. **Remember `#pragma codebank = 0` afterwards** or
everything that follows is banked too.

Rules the compiler enforces: a bank must fit **8192 bytes**; no jump or call
from one bank directly into another (calls to resident code and calls through a
trampoline are fine); no reference from outside a bank to a variable, array or
asm label inside it; no `ORG` inside a bank. Rules it cannot check, so watch
them yourself: interrupt handlers must not make far calls, remap the window,
live inside it, or touch bank-local data, and `SP` must never point into the
window.

A `DIM` inside a `CODEBANK` block is **bank-local** — good for big tables. An
ordinary statement written there is *not*; it still compiles resident. A
module-level `asm` block inside the block **is** compiled into the bank, along
with a label naming it, and it does not execute — that is how you put a raw
table or an asm helper next to the code that calls it. An `asm` block inside a
SUB, or nested in an `IF`/`FOR`, is deliberately left alone.

**Code bank pages and `LoadSDBank` data pages share one numbering.**
`nextbuild.py` fails the build on a real collision, but plan the map up front;
`'!codebankpages=44,45,46` assigns pages explicitly.

Full documentation and nine worked examples are in
`Sources/Tests/BankedCode/` (`README.md`, `INTERNALS.md`). The compiler-side
pipeline is documented in `zxbasic1.18.7/codebanks-fork/PIPELINE.md` — read that
before trying to re-derive how the compiler works.

---

## 8. Layer 2 hardware facts

The three modes have genuinely different memory layouts, and getting this wrong
is the single most common source of "the pixel went somewhere else" bugs.

| Mode | bpp | Layout | Address of (x,y) | 16K bank |
|---|---|---|---|---|
| 256x192 | 8 | row major | `(y AND 63)*256 + x` | section `y/64`, port bits 7-6 |
| 320x256 | 8 | **column major** | `(x AND 63)*256 + y` | offset `x/64`, port bit 4 + bits 2-0 |
| 640x256 | 4 | column major, 2px/byte | `((x/2) AND 63)*256 + y` | offset `x/128` |

320x256 and 640x256 are **column major** — consecutive addresses step down a
column, not along a row. That makes vertical runs the fast direction in those
modes and horizontal runs the fast direction in 256x192, and it is why a
sensible fill picks its orientation from the mode. In 640x256 the even x is the
high nibble.

### Port $123B has two separately latched fields

This one cost real debugging time and is worth internalising:

- **bits 7-6** — the 16K **section**, which is how 256x192 picks its third of
  the screen
- **bits 2-0** — the 16K **bank offset**, updated *only* by a write with
  **bit 4 set**
- bit 0 maps Layer 2 over `$0000` for writing, bit 1 is the legacy visible
  flag, bit 2 also maps it for reading (needed for any read-modify-write, such
  as a 4bpp plot, and for reading a pixel back)

A write with bit 4 clear updates the control bits and the section but **leaves
the offset alone**. A write with bit 4 set updates only the offset and leaves
the control bits alone. The two fields combine.

The consequence: a 256x192 routine that sets the section must also **zero the
offset**, or a value left behind by whatever ran before it — `FL2Text` leaves
one — shifts the row 64 lines per unit. It then looks intermittent, because the
next write with bit 4 set clears it, so only the *first* drawing operation
after the offending call is wrong. The symptom was one row of a triangle
landing 128 lines low.

Modelling the two as a single number in an emulator hides this class of bug
completely.

Always hand the bottom 16K back when finished (`out $10` then `out 2`), or the
ROM stays covered.

### Interrupts

Layer 2 mapped over `$0000` covers `$0038`. Under IM 1 an interrupt taken while
it is mapped lands in pixels, so guard with `di`/`ei`. Under IM 2 the vector
table and handler are in resident RAM and no guard is needed — which is why
library routines wrap their guard in `#ifndef IM2`.

---

## 9. Testing without hardware

`Sources/Tests/Primitives/` has a working pattern for this, with a README.
`python/bin/pip install z80` is already done in the project venv.

The emulator's `set_read_callback` / `set_write_callback` **replace** the
default memory access, so the whole 64K can be modelled in Python — including
a Layer 2 window over `$0000` backed by an 80K buffer. Every write is then
attributable to a real Layer 2 offset and checkable against the layouts above.
Two levels are worth having:

- **core only** (`run_plot.py`) — bolt an `org` + `dw` header onto the `.asm`,
  assemble with `zxbasm -N`, read the label addresses out of the header, call
  the routines directly. Strip `#`-prefixed lines first, since standalone
  zxbasm has no preprocessor.
- **end to end** (`run_e2e.py`) — build the real project, load the `.bin` at
  its ORG and the `.bankN.bin` files as pages, parse `build/<name>.bas.map` for
  `_SubName`, and call the compiled BASIC SUBs. This is what proves arguments
  survive a CODEBANK far call.

Two traps that will waste an afternoon each:

- **The emulator is a plain Z80.** ZX Next opcodes — `nextreg` (`ED 92`/`ED 91`),
  `mul d,e` (`ED 30`), `swapnib` (`ED 23`) — must be trapped with breakpoints
  and executed in Python, rescanning the `$6000` window after every page-in.
  Miss this and the bank is never paged in, the far call runs into stale
  memory, and *everything* fails silently rather than crashing.
- **`sub fastcall` takes its first argument in `A`, not on the stack.**

`Sources/Tests/BankedCode/run_far.py` is the reference implementation of the
Next MMU parts.

---

## 10. Where to look next

| For | Read |
|---|---|
| Repo layout, tooling, commits | [AGENTS.md](AGENTS.md) |
| Banked code, in depth | `Sources/Tests/BankedCode/README.md`, `INTERNALS.md` |
| Compiler internals | `zxbasic1.18.7/codebanks-fork/PIPELINE.md` |
| Layer 2 addressing, commented | `Scripts/nb_PLOT.asm` (header) |
| Primitives API and caveats | `Scripts/nextlib_primitives.bas` (header) |
| Off-hardware testing | `Sources/Tests/Primitives/README.md`; shared harness `Sources/Tests/_next.py`; run everything with `Sources/Tests/run_all.py` |
| Worked examples | `Sources/NextBuild_Examples/` — `GRAPHICS/DrawPrimitives`, `OTHER/RandomNumbers`, `OTHER/NumberFormat`, `GRAPHICS/SpriteEngine`, `INPUT/GamePad` |
| User-facing docs | `Sources/Docs/` |
| Build script details | `nextbuild.md`, `launch_cspect.md` (repo root) |

When adding to this file, prefer facts that cost someone time to discover.
Anything derivable by reading the source in thirty seconds belongs in a comment
next to that source instead.
