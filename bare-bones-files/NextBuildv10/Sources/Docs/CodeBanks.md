# 🏦 <span style="color:#4ec9b0;">Code Banks</span>

ZX Basic has one flat `ORG`, so everything that runs has to fit between your
program's start address and `$FFFF` — about 32K if you start at `$8000`. Sooner
or later a game runs out of room.

`CODEBANK` puts SUBs and FUNCTIONs into ZX Next 8K memory banks instead. Each
banked routine gets a tiny stub in the resident program that pages its bank in,
runs the real body, and pages the previous bank back afterwards.

**Call sites do not change.** You do not have to think about paging at all.

---

## 🚀 **The Short Version**

```basic
'!org=32768
'!codebank=30           ' CODEBANK 1 -> 8K page 30, CODEBANK 2 -> 31, ...

CODEBANK 1
    SUB DrawLevel()
        ' ... as much code as you like, up to 8K per bank
    END SUB
END CODEBANK

DrawLevel()             ' call it exactly as normal
```

That is the whole feature. The routine now costs your resident program six
bytes instead of however big it is.

---

## 📚 **Putting a Whole Library in a Bank**

`#pragma codebank` does the same job without a block, which is what you want
around an `#include`:

```basic
#include <nextlib.bas>

#pragma codebank = 1
#include <nextlib_primitives.bas>
#pragma codebank = 0        ' switch back, or everything after this is banked too
```

<div class="note">
⚠️ <strong>Do not forget the <code>#pragma codebank = 0</code>.</strong>
Everything after a <code>#pragma codebank</code> keeps going into that bank
until you switch back.
</div>

---

## ⚙️ **Directives**

| Directive | Meaning | Default |
|---|---|---|
| `'!codebank=N` | first 8K page backing CODEBANK 1; later banks follow on | 30 |
| `'!codebankpages=a,b,c` | an explicit page per bank, instead of `'!codebank=` | — |
| `'!codewindow=$XXXX` | where the code window lives | `$6000` |
| `'!codewindowsize=N` | `8192` (one MMU slot) or `16384` (two, for 16K banks) | 8192 |
| `'!codebankdepth=N` | how deep cross-bank calls may nest | 16 |

---

## 🗺️ **The Memory Map**

```
$0000-$3FFF  ROM
$4000-$5FFF  screen / sysvars
$6000-$7FFF  << code window >>   one bank paged in at a time
$8000-$FFFF  your resident program
```

The runtime library, strings, `DATA` blocks, the heap and any globals declared
outside a `CODEBANK` all stay resident, so banked code can reach them freely.

---

## 📦 **What Actually Goes in the Bank**

| Goes in | Stays resident |
|---|---|
| `SUB` and `FUNCTION` bodies | Ordinary statements — `PRINT`, assignments, loops |
| `DIM` declarations (bank-local data) | `DIM x AT addr` — it names a fixed address |
| Module-level `asm` blocks, and the label naming them | An `asm` block inside a SUB, or inside an `IF`/`FOR` |

A `DIM` inside a `CODEBANK` block is **bank-local** — a big lookup table costs
nothing out of your resident 32K. The catch is that only one bank is mapped at
a time, so bank-local data is reachable only from routines in the *same* bank.
Anything two banks must agree on has to stay resident.

<div class="note">
💡 An ordinary statement written between <code>CODEBANK n</code> and
<code>END CODEBANK</code> still compiles into the resident main body. Only
declarations move.
</div>

---

## 📏 **Rules**

The compiler enforces these and tells you which routine or variable is at fault:

- A bank must fit the window — **8192 bytes**, or 16384 with `'!codewindowsize=16384`
- No `GOTO`, `GOSUB`, `jp` or `call` straight from one bank into a *different*
  bank. Calls to resident code, and calls through a stub, are fine
- Nothing outside a bank may reference a variable, array or asm label inside it
- A banked SUB cannot be an `#init` routine
- No `ORG` inside a bank, and the window must not overlap your program

Not checkable by the compiler, so **watch these yourself**:

- Interrupt handlers must not make banked calls, must not live in the window,
  and must not touch bank-local data
- `SP` must never point inside the code window

---

## ⚠️ **Page Numbers Are Shared**

Code banks and `LoadSDBank` data banks draw on the same 8K page numbering. If a
code bank and a graphics bank land on the same page, one will eat the other.
NextBuild fails the build on a real collision, but it is far easier to plan the
map up front:

```basic
'!codebankpages=44,45,46         ' CODEBANK 1 -> 44, 2 -> 45, 3 -> 46

LoadSDBank("[]font1.fnt",0,0,0,30)   ' data bank 30 - well clear of 44-46
```

---

## 🧪 **Worked Examples**

A full set lives in [`Sources/Tests/BankedCode/`](/NextBuild_Examples/CODEBANKS/), with a [`README.md`]((/NextBuild_Examples/CODEBANKS/README.md) covering
each one:

| File | Shows |
|---|---|
| [`BankedCode.bas`](../NextBuild_Examples/CODEBANKS/BankedCode.bas) | the smallest thing that works |
| [`bank_screens.bas`](../NextBuild_Examples/CODEBANKS/bank_screens.bas) | one screen per bank with a resident dispatcher |
| [`bank_include.bas`](../NextBuild_Examples/CODEBANKS/bank_include.bas) | a whole `#include`d library in one bank |
| [`bank_layer2.bas`](../NextBuild_Examples/CODEBANKS/bank_layer2.bas) | banked code driving nextlib's Layer 2 routines |
| [`bank_data.bas`](../NextBuild_Examples/CODEBANKS/bank_data.bas) | bank-local variables and arrays |
| [`bank_strings.bas`](../NextBuild_Examples/CODEBANKS/bank_strings.bas) | Strings in and out of banks |
| [`bank_isr.bas`](../NextBuild_Examples/CODEBANKS/bank_isr.bas) | the interrupt rule, done properly |

---

## Links

* [Settings](Settings.md)
* [The `!nb` Sync Directive](nextbuild_sync.md)
* [Templates](Templates.md)
