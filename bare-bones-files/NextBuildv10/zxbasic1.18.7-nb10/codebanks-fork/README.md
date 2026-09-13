# Banked code (CODEBANK)

Compiles SUB/FUNCTIONs into ZX Next 8K memory banks instead of the flat
$6000-$FFFF window, so a program is no longer limited to 32K of code.

## Using it

```basic
'!org=32768
'!codebank=40           ' CODEBANK 1 -> 8K page 40, CODEBANK 2 -> 41, ...

CODEBANK 1
    SUB DrawLevel()
        ...
    END SUB
END CODEBANK

DrawLevel()             ' call it exactly as normal
```

Call sites need no special syntax. Each banked routine gets a 6-byte resident
trampoline under its ordinary label; the trampoline pages the bank into the
code window, runs the body, and pages the previous bank back on return.

`#pragma codebank = n` does the same thing without the block, which suits
putting a whole `#include`d file in one bank:

```basic
#pragma codebank = 2
#include "enemies.bas"
#pragma codebank = 0
```

## Build output

zxbc writes one `<name>.bank<N>.bin` per bank plus a `<name>.banks.json`
manifest. nextbuild.py reads the manifest and adds the `!MMU` lines to the
`.cfg`, so the banks are packed into the NEX automatically.

## Directives

| Directive | Meaning | Default |
|---|---|---|
| `'!codebank=N` | first physical 8K page backing CODEBANK 1; later banks follow on | 30 |
| `'!codewindow=$XXXX` | address of the code window | `$6000` |
| `'!codewindowsize=N` | size of the window: `8192` (one MMU slot) or `16384` (two) | 8192 |
| `'!codebankpages=a,b,c` | explicit first page per bank, overrides `'!codebank=` | — |
| `'!codebankdepth=N` | max cross-bank call nesting (3 bytes each) | 16 |

The same settings exist as `#pragma codebank`, `#pragma codewindow`, ... and as
zxbc flags `--code-bank-base`, `--code-window`, `--code-window-size`,
`--code-bank-pages`, `--code-bank-depth`.

### A 16K code window

`'!codewindowsize=16384` gives a bank the two MMU slots at the window address,
so a single CODEBANK can hold 16K of code. A bank then owns **two consecutive
8K pages**, and `'!codebankpages=` lists the *first* page of each:

```basic
'!org=$e000             ' the window now reaches $9FFF, so keep clear of it
'!codewindow=$6000      ' $6000-$9FFF
'!codewindowsize=16384
'!codebank=40           ' CODEBANK 1 -> pages 40,41; CODEBANK 2 -> 42,43
```

Only 8192 and 16384 are accepted; the window is paged by whole MMU slots, so
anything else is rejected, as is a window that is not 8K-aligned or that runs
past `$FFFF`.

Two things get sharper with a 16K window: the program `org` has to clear the
whole window, not just its first 8K, and an interrupt handler must not live
anywhere inside it.

## Bank-local data

A `DIM` written inside a `CODEBANK` block puts the variable or array in that
bank's page instead of the resident variable area, so a big lookup table costs
nothing out of the $8000-$FFFF budget:

```basic
CODEBANK 1
    DIM sine(31) as uByte => { 16, 19, 22, ... }
    DIM cursor as uByte

    FUNCTION NextSine() as uByte
        RETURN sine(cursor)         ' same bank, so it is just an array read
    END FUNCTION
END CODEBANK
```

Read/write both work, and the values persist across paging because the bank
page is real RAM. Only one bank is mapped at a time, though, so **bank-local
data is only reachable from routines in the same bank** — the compiler rejects
anything else, naming the variable and both banks. Keep anything two banks have
to agree on resident, or reach across with `FARPTR` (below).

Strings work too, but mind what actually moves: a bank-local `DIM s$` is a
2-byte descriptor in the bank, while the characters live on the resident heap,
and string *literals* are always emitted resident whatever bank uses them. To
get text itself out of the resident 32K, pack it into a bank and pull it back
with `FarStr` — `bank_strings.bas` shows the older by-hand version of both.

An initialiser works whether or not it is a compile-time constant. A constant
becomes storage in the bank; anything else — every `String`, and any expression
that is not constant — is deferred, and the compiler runs that deferred store
inside the bank rather than from the resident main body:

```basic
CODEBANK 1
    DIM k as uByte = 85             ' constant: storage in the bank
    DIM s$ as String = "test"       ' deferred, and run in bank 1
    DIM n as uInteger = Src()       ' deferred, and run in bank 1
END CODEBANK
```

They run in the order they are written, so a resident statement between two
`CODEBANK` blocks is seen by the second and not by the first.

`#pragma codebank = n` binds declarations the same way, so an `#include`d
library's own globals follow its routines into the bank.

See `bank_data.bas`.

### Reaching into a bank: FARPTR

`FARPTR x` is the one sanctioned way to name a bank-local symbol from outside
its bank. It yields a `uLong` holding the logical bank in bits 16-23 and the
address in bits 0-15, and `#include <farmem.bas>` gives you the routines that
take one:

```basic
#include <farmem.bas>

CODEBANK 1
    tiles:
    asm
        defb 1, 2, 3, 4, 5, 6
    end asm
    msg:
    asm
        defw 16
        defb "this is a string"
    end asm
END CODEBANK

DIM buf(5) as uByte
FarCopy(FARPTR tiles, @buf(0), 6)       ' bank -> resident
PRINT FarPeek(FARPTR tiles + 3)         ' 4
PRINT FarStr(FARPTR msg)                ' characters stay in the bank
```

| Routine | What |
|---|---|
| `FarPeek(fp)` | one byte |
| `FarPeekW(fp)` | one 16-bit word, low byte first |
| `FarPoke(fp, v)` / `FarPokeW(fp, v)` | write into a bank |
| `FarCopy(fp, dest, count)` | bank → resident |
| `FarCopyTo(fp, src, count)` | resident → bank |
| `FarStr(fp)` | a `String` from a `defw len` + characters image |

Each one pages the bank in, does its work, and restores whatever bank the
*caller* was running in — so they work the same from resident code and from
inside a different bank.

`FARPTR` takes the forms `@` does, with one deliberate difference: for an array
it gives the **data** address, not the descriptor. A far pointer to a descriptor
would be useless, because `__ARRAY` cannot run against a page that is not
mapped. Note this is the opposite of what bare `@array` has meant since upstream
1.18.3 — `FARPTR a` is the data, `@a` is the descriptor, and `@a(0)` is the data
again. `FARPTR` is not warned about; `@a` is (`[W920]`).

```basic
FARPTR name          ' scalar, array, or an asm label in a bank
FARPTR arr(3)        ' constant subscript only - the address must be static
FARPTR residentVar   ' bank 0, which reads as an ordinary address
```

Not allowed, and each says so: `FARPTR` of a local or parameter, of a
SUB/FUNCTION (call it through its trampoline, which is what its ordinary name
already is), or of an array element with a variable subscript.

Two rules the compiler cannot check:

- the resident side of a copy must not lie inside the code window;
- none of these may be called from an interrupt handler, which must never remap
  the window.

`bank_far.bas` is the worked example — a tile table and a message pool held in
a bank and read back from the resident program, with the text nowhere in the
resident binary. `farmem_test.bas` is the assertion program behind it.

### Bank-scope asm blocks

An `asm` block written inside a `CODEBANK` block but outside any SUB/FUNCTION is
compiled into that bank, and a label naming it goes with it. That is how you put
a raw table, or a helper the bank's own routines `call`, next to the code that
uses it:

```basic
CODEBANK 1
    my_table:
    asm
        db "h", "i"
    end asm

    SUB Show()
        PRINT PEEK @my_table        ' same bank, so it is mapped
    END SUB

    SUB Also()
        PRINT PEEK (@my_table + 1)  ' any routine in bank 1 can reach it
    END SUB
END CODEBANK
```

**The block does not execute.** It is data, or something reached by `call`. A
setup block that has to run goes *above* the `CODEBANK` block, not inside it.

Three things are deliberately left alone, because they are not bank data:

- an `asm` block **inside** a banked SUB or FUNCTION — it already lands in the
  bank through the routine body, and is the right place for setup code
- an `asm` block nested in an `IF`, `FOR` or `WHILE` — executable code in a
  control-flow position, so it stays resident and runs where it stands
- a label naming ordinary statements, like `loop1:` before a `PRINT`. Only a
  label whose next statement is a diverted block moves, so `GOTO loop1` from
  resident code keeps working

Naming a bank-scope label from outside its bank is a compile error, reported
against the BASIC line.

#### Naming a bank-scope blob as an array

`DIM ... AT` over a bank-scope label gives the blob a BASIC name and ordinary
subscripts, which is usually nicer than `PEEK`ing an address:

```basic
CODEBANK 1
    DIM buf(16) as uByte AT @blob

    FUNCTION Nth(i as uByte) as uByte
        RETURN buf(i)              ' indexes the blob directly
    END FUNCTION

    blob:
    asm
        defb 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17
    end asm
END CODEBANK
```

The declaration and its address must be in the **same** bank. An array `AT`
emits a small descriptor holding the address, and that descriptor is only
mapped when its bank is — so declaring the array outside the bank, or in a
different one, is a compile error naming both.

#### Placing a blob by hand

The assembler has its own `CODEBANK` directive, usable inside any `asm` block,
including from resident scope. This is the escape hatch when you want bytes in a
bank without a `CODEBANK` block around them:

```basic
asm
    CODEBANK 1
my_table:
    db "h", "i"
    CODEBANK 0          ; switch back, or everything after this is misplaced
end asm
```

`my_table` is then an assembler label only — BASIC cannot name it, so there is
no `@my_table`. Forgetting the `CODEBANK 0` is a compile error.

### INCBIN into a bank

Inline asm inside a banked SUB is assembled into that bank, and `INCBIN` is just
a `DEFB` of the file's bytes, so a binary asset can go straight into the page
next to the code that uses it. Nothing special is needed — but the bytes land
mid-body, so jump around them:

```basic
CODEBANK 1
    DIM tilesAddr as uInteger

    SUB InitTiles()
        asm
            jp inc_skip             ; the data is in the instruction stream
        inc_data:
            incbin "tiles.bin"
        inc_skip:
            ld hl, inc_data
            ld (._tilesAddr), hl    ; hand the address to BASIC
        end asm
    END SUB

    FUNCTION Tile(i as uInteger) as uByte
        RETURN PEEK(tilesAddr + i)  ' same bank, so it is mapped
    END FUNCTION
END CODEBANK
```

The usual rule still applies, and is enforced: `inc_data` is a bank-1 label, so
resident code naming it is a compile error. Overflowing the bank is reported
with the blob named as the largest item.

Which to use: `INCBIN` for an asset you want beside its code, `LoadSDBank` for
one that wants a whole page of its own.

## Layout

```
$0000-$3FFF  ROM
$4000-$5FFF  screen / sysvars
$6000-$7FFF  << code window >>   paged via NextReg $53
$8000-$FFFF  resident program
```

The runtime library, string literals, DATA blocks, the heap and array bound
tables all stay resident, as do globals declared outside a `CODEBANK` block, so
banked code can call and read them freely. To get *bulk* data out of the
resident 64K, put it in a bank and reach it with `FARPTR` — see above.

## Rules

The compiler enforces these and names the offending routine or variable:

- A bank must fit the window (8192 bytes). Overflow lists the largest routines
  and data blocks.
- No `GOTO`/`GOSUB`/`jp`/`call` from one bank directly into a *different* bank.
  Calls to resident code, and calls through a trampoline, are fine.
- No reference from outside a bank to a variable, array or asm label inside it.
  Caught at the BASIC line for ordinary code, and by the assembler for anything
  else (`@address`, whole-array copy, hand-written asm). `FARPTR` is the
  exception, and the only one — it names an alias the assembler knows is safe,
  and nothing dereferences one without paging the bank in first.
- A banked SUB cannot be an `#init` routine.
- No `ORG` inside a bank, and the window must not overlap the program.
- An `asm` block must leave the assembler in the segment it started in. Using
  the assembler's own `CODEBANK` directive inside one is fine; forgetting to
  switch back is an error, because everything emitted afterwards is misplaced.
- nextbuild.py rejects a code bank whose bytes overlap a `LoadSDBank` blob.
  Data blobs may share a page — `LoadSDBank` takes an in-page offset — so only
  a real byte overlap is reported, and two data blobs overlapping is a warning,
  not an error.

Warned about, not rejected:

- `[W900]` passing a bank-local variable `ByRef` to a routine in a different
  bank. The callee gets a plain address that is stale by the time it runs —
  pass a copy instead.
- `[W910]` a bank holding data but no routine, which nothing will ever page in.
- `[W920]` a bare `@array`. Upstream 1.18.3 changed that from the address of the
  first element to the address of the *descriptor*, silently; write `@a(0)` (or
  `@a(0,0)` for two dimensions) for the data. Nothing to do with CODEBANK — it
  bites plain programs too, which is why the compiler now says so.

Not statically checkable, so **observe these by hand**:

- Interrupt handlers must not make far calls, must not remap the code window,
  must not live inside it, and must not touch bank-local data.
- `SP` must never point inside the code window.
- Cross-bank call nesting must stay within `'!codebankdepth`.

## Examples

Build any of these with NextBuild and run the `.nex` in CSpect.

| File | What it shows |
|---|---|
| `BankedCode.bas` | the smallest thing that works - two banks, three routines |
| `bank_screens.bas` | one screen per bank with a resident dispatcher; the CODEBANK replacement for the old MODULES system |
| `bank_include.bas` | `#pragma codebank` around an `#include`, so a whole library file lands in a bank (`banklib/textlib.bas`, `banklib/mathlib.bas`) |
| `bank_layer2.bas` | banked code driving nextlib's Layer 2 routines, and code banks coexisting with a `LoadSDBank` data bank via `'!codebankpages=` |
| `bank_deep.bas` | mutual recursion 20 banks deep, six-argument stdcall frames, and 16/32 bit and string return values out of banks - prints PASS/FAIL |
| `bank_isr.bas` | the interrupt rule: a resident handler that only counts, with all the per-frame work in banks |
| `bank_data.bas` | bank-local variables and arrays: two banks with private data at the same window addresses, and the accesses that are rejected |
| `bank_data_large.bas` | scale: six banks holding 36K of arrays, with the resident binary at 4745 bytes. Shows what the same arrays cost if you hoist them out |
| `bank_strings.bas` | strings: a bank-local `String` and string array, concatenating and splitting inside a bank, returning Strings out of one, and packing text into a bank so the characters are not resident |
| `bank_far.bas` | the introduction to `FARPTR` and the far-memory accessors: a greeting, a tile and a seven-message text pool held in bank 1 and read back from the resident program, none of it in the resident 64K |

### Things they demonstrate that are easy to get wrong

- **Forward references across banks.** `bank_deep.bas` needs
  `DECLARE FUNCTION Pong(...)` because bank 1 calls into bank 2 before bank 2
  is defined. Where the `DECLARE` sits does not matter; the `CODEBANK` in
  force at the *definition* is the one that binds.
- **Remember `#pragma codebank = 0`.** Everything after a `#pragma codebank`
  keeps going into that bank until you switch back.
- **Page numbers are shared.** Code banks and `LoadSDBank` data banks draw on
  the same 8K page numbering. nextbuild.py fails the build on a collision, but
  it is easier to plan the map up front - see `bank_layer2.bas`.
- **The stack must not sit in the code window.** With `#include <nextlib.bas>`
  this is already handled: nextlib moves `SP` into its own resident buffer at
  startup. If you build with `#define NOSP`, set `'!sp=` to an address above
  the resident program yourself.
- **A `DIM` inside `CODEBANK` is bank-local, but an ordinary *statement* there
  is not.** `PRINT`, assignments and loops written between `CODEBANK n` and
  `END CODEBANK` still compile into the resident main body, so they cannot touch
  that bank's data. What goes into the bank is: SUB and FUNCTION bodies, `DIM`
  declarations, and module-level `asm` blocks with the labels naming them.
- **A scalar `DIM x AT addr` emits nothing, but an array `AT` does.** A scalar
  is a bare `EQU`, so there is no storage to place anywhere. An array still
  emits the descriptor that indexing goes through, including a word holding the
  address itself — so that descriptor follows the declaration into its bank. A
  declaration and its `AT` address must therefore be in the same bank, and the
  compiler says so if they are not.

## Test files

| File | What |
|---|---|
| `farcall_test.bas` | assertion program for the far-call runtime |
| `farcall_test16.bas` | the same, with a 16K window, every routine deliberately past `$7FFF` |
| `array_test.bas` | 88 assertions over every shape of `DIM`, resident and bank-local |
| `farmem_test.bas` | 38 assertions on `FARPTR` and the far-memory accessors, called from resident code and from inside a bank |
| `bankinit_test.bas` | 15 assertions on bank-local `DIM` initialisers, static and deferred, including the order they run in |
| `run_far.py` | runs any of them on a Z80 emulator with a minimal Next MMU and checks the results |

```
python3 ../../../zxbasic1.18.7/zxbc.py farcall_test.bas --arch=zxnext -S 32768 -O4 -o /tmp/ft.bin -M /tmp/ft.map
python3 run_far.py /tmp/ft.bin /tmp/ft.banks.json /tmp/ft.map
```

Or all of them at once, alongside the unit and functional suites:

```
./codebanks-fork/run-tests.sh --codebank
```

It checks the same-bank fast path, cross-bank and nested cross-bank calls,
stdcall argument offsets, return values in A / HL / DE:HL, that BC/DE/IX/IY
survive a far call, and that the shadow stack fully unwinds. Needs `pip install z80`.

## Note

`uByte * const` returning `uInteger` truncates to 8 bits: Boriel emits
`mul d,e` and then reads only `E`. That is upstream behaviour and is identical
for resident and banked code — it is not a CODEBANK issue.
