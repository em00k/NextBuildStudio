# CODEBANK: how banked code works under the hood

Reference for how `CODEBANK` is implemented in the NextBuild fork of zxbc.
For how to *use* it, see `README.md`.

---

## 1. The problem

ZX BASIC was written for the 48K Spectrum and has exactly one flat `ORG`.
Every byte of runnable code has to sit in one contiguous block, which on the
Next in practice means `$6000-$FFFF` — about 40K once you subtract the screen,
the heap and the stack. The Next has up to 2MB of RAM behind an 8-slot MMU, and
none of it was reachable as *code*.

The old workaround (`Sources/NextBuild_Examples/MODULES/`) compiled each module
as a standalone program at `$6000` and had a `$E000` orchestrator load them off
SD and `call 24576`. There was no linker, no symbol exchange, no size checking
and no type checking across the boundary; addresses were hard-coded and the
build order mattered.

The goal was to make a banked routine indistinguishable from a resident one at
the call site.

---

## 2. Design decisions

**One 8K window, configurable.** Banked code is assembled to run at a fixed
window address (default `$6000-$7FFF`, MMU slot 3, NextReg `$53`) with the
resident program above it at `$8000`. One window keeps the runtime tiny and
means only one MMU register is ever touched.

**Trampolines under the real label, not rewritten call sites.** The compiler
does not know or care whether a callee is banked. This was the single most
important choice — see §5.

**Return-address replacement, not a pushed frame.** The far-call runtime never
adds anything to the Z80 stack, so stdcall arguments stay at their usual
`(ix+4)`, `(ix+6)`, ... offsets. See §6.

**`CODEBANK`, not `BANK`.** `bank` is a parameter name in 14 nextlib
subroutines, an asm label at `nextlib.bas:1601`, and appears 93 times across
`Sources/`. `CODEBANK` collides with nothing.

**Bank-private data, not far data.** A `DIM` inside a `CODEBANK` block goes into
that bank's page, but it is reachable only from routines in the same bank. That
is the version of banked data that costs nothing: no pointer has to carry a bank
tag, because the only code that can name the variable is code that runs with the
bank already mapped. General far data — any pointer knowing which bank it points
into — was rejected on that basis. Bulk assets still use `LoadSDBank` / `!MMU`.
See §10.

---

## 3. Pipeline overview

```
  .bas
   │
   ├─ zxbpp preprocessor ......... #pragma codebank = n
   │
   ├─ parser (zxbparser.py) ...... CODEBANK n ... END CODEBANK
   │                              binds each SUB/FUNCTION to a logical bank
   │                              → FuncRef.bank
   │
   ├─ IR / backend ............... function_translator partitions functions by
   │                              bank, emits resident trampolines, fences each
   │                              group with `CODEBANK n` inline directives
   │
   ├─ optimizer .................. flow graph follows trampoline → real body
   │
   ├─ assembler (zxbasm) ......... one output *segment* per bank, all sharing
   │                              one label namespace; cross-bank branch check
   │
   └─ output ..................... <name>.bin        resident program
                                   <name>.bankN.bin  one per bank
                                   <name>.banks.json manifest
                                        │
                                        └─ nextbuild.py → !MMU lines → .nex
```

---

## 4. Front end: binding routines to banks

### Options

`src/api/codebank_options.py` defines six options. It lives in `api` rather than
in the backend so that the *standalone* assembler can read them without pulling
in architecture code:

| Option | Default | Meaning |
|---|---|---|
| `codebank` | 0 | logical bank currently in effect while parsing |
| `codewindow` | `$6000` | address the banked code is assembled to run at |
| `codewindowsize` | 8192 | size of that window |
| `codebankbase` | 30 | physical 8K page backing logical bank 1 |
| `codebankpages` | — | explicit page list, overrides `codebankbase` |
| `codebankdepth` | 16 | maximum cross-bank call nesting |

Two derived helpers:

```python
def window_mmu_reg() -> int:
    return 0x50 + (OPTIONS.codewindow >> 13)     # $6000 → slot 3 → NextReg $53

def physical_page(logical_bank: int) -> int:
    # explicit list wins; otherwise banks run on consecutively from codebankbase
```

The distinction between **logical bank** (1, 2, 3 … as written in the source)
and **physical 8K page** (30, 31, 40, 44 …) runs through the whole design. Only
the resident bank table maps one to the other, so the physical layout can be
changed with a build flag without recompiling anything else.

### Syntax

`CODEBANK` is a keyword (`src/zxbc/keywords.py`) and the block form is two
grammar rules in `zxbparser.py`, both reducing as `preproc_line`:

```python
def p_codebank_begin(p):
    """preproc_line : CODEBANK NUMBER
                    | CODEBANK INTEGER"""
    OPTIONS["codebank"].push(int(bank))

def p_codebank_end(p):
    """preproc_line : END CODEBANK"""
    OPTIONS["codebank"].pop()
```

Both `NUMBER` and `INTEGER` are accepted because the BASIC lexer produces
`NUMBER` (a float) for a bare numeric literal; `INTEGER` only appears in
preprocessor context. The value is validated as a whole number ≥ 0.

Because it is implemented as an option *stack*, `#pragma codebank = n` works
through the ordinary pragma machinery for free, and nesting is well-defined.
`END CODEBANK` without a match raises `OptionStackUnderflowError` and is
reported as an error rather than crashing.

### Binding

The bank is recorded on the function symbol in `p_function_header`:

```python
if entry.class_ in (CLASS.function, CLASS.sub):
    FUNCTION_LEVEL[-1].ref.convention = convention
    FUNCTION_LEVEL[-1].ref.bank = int(OPTIONS.codebank or 0)
```

Three things about this rule matter:

- It reduces on the SUB/FUNCTION **header**, before the body is parsed. A
  `#pragma codebank` *inside* a routine therefore cannot move it.
- A forward `DECLARE` and the definition share one `FuncRef`, and the
  definition is parsed later, so **the definition's bank wins**. That is what
  makes mutual recursion across banks work (`bank_deep.bas`).
- `FuncRef` uses `__slots__`, so `bank` had to be added to the slot list in
  `src/symbols/id_/ref/funcref.py` — assigning an undeclared attribute would
  otherwise raise.

`CODEBANK` inside a SUB or FUNCTION is rejected outright.

---

## 5. The trampoline

This is the heart of the design. A banked routine's body is emitted under a
*different* label, and its ordinary mangled label is taken over by a 6-byte
resident stub:

```asm
_Foo:   call .core.__FAR_CALL       ; CD xx xx
        DEFB  2                     ; logical bank
        DEFW  _Foo.__far            ; real body, inside the bank
```

The consequence is that **`visit_CALL` and `visit_FUNCCALL` were never
touched**. Every existing way of reaching a routine keeps working unchanged:
direct calls, calls through the optimizer's rewritten forms, everything. The
only code that knows banking exists is the stub and the runtime.

`function_translator.py:start()` does the partitioning:

```python
banked: dict[int, list] = defaultdict(list)
# resident functions are translated immediately; banked ones queue by bank
drain(self.functions)
if not banked:
    return
self._prepare_far_calls(banked)

for bank in sorted(banked):
    self.ic_inline("CODEBANK %i" % bank)
    ...translate every function for this bank...
self.ic_inline("CODEBANK 0")
```

`ic_inline("CODEBANK n")` injects an assembler directive into the instruction
stream, so the *assembler* is what actually separates the output — the backend
just fences groups of functions. Closing with `CODEBANK 0` matters: everything
the compiler emits afterwards (DATA blocks, strings, the runtime library,
deferred bound tables) must land back in the resident program.

Nested `FUNCDECL`s discovered while translating are re-sorted into the right
queue, or deferred to after the banks close if they turn out to be resident.

### Two hazards handled here

**`__EXIT_FUNCTION`.** Boriel emits this shared epilogue *inline inside the
first function* whose parameter block exceeds 11 bytes, and every later function
jumps to it. If that first function happened to be banked, the shared label
would end up inside a bank and every resident caller would jump into whatever
was paged in. `_prepare_far_calls` forces it into the resident epilogue
(`common.AT_END`) up front whenever banking is active.

**`#init` routines.** A banked `#init` would run before `__FAR_INIT` had set the
bank table up, so it is an error.

**Local array bound tables** are emitted after `ic_leave`, which would place
them inside the bank. They are collected and re-emitted after `CODEBANK 0`.

---

### A 16K window

`codewindowsize` may be 16384, giving the window two adjacent MMU slots. Three
things change, all gated so an 8K program's output is byte-identical.

**Page allocation.** `physical_page()` strides by `window_slots()`, so a bank
owns its page and the next one, and `codebankpages` lists first pages. Before
this, a 16K window handed bank 1 pages 30,31 and bank 2 pages 31,32 — silently,
because `claim_range()` compares byte ranges and only notices once a bank really
exceeds 8K.

**The bank table becomes two bytes per row**, rather than one byte plus an
`inc a` for the second page. Banked pairs are consecutive, so `inc a` would work
for them — but the *boot* row is not. `_DEFAULT_SLOT_PAGE` is
`(0xFF, 0xFF, 10, 11, 4, 5, 0, 1)`, so a window at `$6000` boots with pages 11
and 4. Restoring to the resident program is the common return path, so both have
to be stored, and `__FAR_INIT` reads both back rather than assuming.

**The runtime maps both slots.** `__FAR_CALL_SWITCH` and `__FAR_RETURN` gain an
`add a, a` before the table lookup and a second `nextreg` after it, against a
separate `__FAR_MMU_REG2` EQU emitted by the prologue. The shadow-stack frame
stores a *logical* bank, so it does not grow, and the same-bank fast path is a
logical-bank compare, so it is untouched.

The gate is `#ifdef __FAR_WINDOW_16K__`, set in `set_option_defines()`.
It has to be the preprocessor: **zxbasm has no `IF`/`ENDIF`**. The precedent is
`__CHECK_ARRAY_BOUNDARY__`, which reaches `runtime/array/array.asm` the same way.
`set_option_defines()` is the right hook because it runs after parsing — so a
`#pragma codewindowsize` has had its say — and immediately before the assembly
is preprocessed.

## 6. The far-call runtime

`src/lib/arch/zxnext/runtime/farcall.asm`. It preserves `AF BC DE HL IX IY AF'
BC' DE' HL' I R` and the interrupt state. The only machine state it changes is
the one MMU register covering the code window.

Resident state:

```asm
__FAR_CUR_BANK:  DEFB 0                 ; logical bank currently mapped
__FAR_SP:        DEFW __FAR_STACK       ; shadow stack pointer
__FAR_STACK:     DEFS __FAR_STACK_SIZE  ; 3 bytes per nesting level
```

### Stack on entry

The caller did `call _Foo`, pushing its own return address. The trampoline then
did `call __FAR_CALL`, pushing the address of the byte *after* the call — which
is the payload. So:

```
  SP+0 : payload ptr   → DEFB bank / DEFW target
  SP+2 : caller's return address
  SP+4 : arguments (stdcall)
```

### Fast path — the bank is already mapped

Compare the wanted bank against `__FAR_CUR_BANK`. If equal there is nothing to
page and nothing to unwind, so the runtime simply **overwrites the payload
pointer slot with the target address** and executes `ret`:

```
  SP+0 : target          ← ret jumps here
  SP+2 : caller's return address
  SP+4 : arguments
```

The callee now sees exactly the stack it would have seen from a direct
`call _Foo.__far`. No shadow stack frame is consumed, and the return goes
straight back to the caller with no interception at all. Same-bank calls are
therefore nearly free — which is why grouping related routines into one bank
pays off (`textlib.bas`'s `Banner` → `Centre`).

### Slow path — a different bank

Same payload-slot overwrite, plus:

1. The caller's return address is read out and **replaced in place** with
   `__FAR_RETURN`.
2. `{previous bank, real caller return}` is pushed onto the shadow stack (3
   bytes), `__FAR_SP` advanced.
3. `__FAR_CUR_BANK` updated, the physical page looked up in
   `__CODE_BANK_TABLE`, and written with `nextreg __FAR_MMU_REG, a`.
4. Registers restored, `ret` → the target.

**Why replacement rather than pushing a frame.** Pushing anything would shift
every stdcall argument by two bytes, and the callee's prologue (`push ix / ld
ix,0 / add ix,sp`) hard-codes `(ix+4)` for the first argument. By replacing the
return address the frame is bit-for-bit what a direct call produces, so the
existing code generator needed no changes whatsoever.

### `__FAR_RETURN`

Reached by the callee's own `ret`, after `_leave` has already unwound the
arguments. It must preserve **every** register, because the return value is
sitting in one of them (`A`, `HL`, `DE:HL`, or `A/DE/BC` for floats). Hence the
double push:

```asm
__FAR_RETURN:
        push hl        ; reserved slot for the real return address
        push hl        ; the actual save of HL
        push af
        push de
        push bc
        ...pop the shadow stack frame, restore the previous bank...
        ld   hl, 8
        add  hl, sp    ; → the reserved slot
        ld   (hl), c
        inc  hl
        ld   (hl), b   ; fill it with the real caller return address
        pop  bc
        pop  de
        pop  af
        pop  hl
        ret
```

### `__FAR_INIT`

Registered as an `#init` (`backend.INITS.add(RuntimeLabel.FAR_INIT)`). It reads
the window's MMU register back through ports `$243B`/`$253B` and stores it as
`__CODE_BANK_TABLE[0]`, so that "return to logical bank 0" restores whatever the
NEX loader actually had mapped rather than a guessed constant.

### Resident data emitted by the compiler

`codebank.emit_prologue_data()` (called from `Backend.emit_prologue()` in both
the z80 and zxnext backends) emits:

```asm
.core.__FAR_MMU_REG     EQU 83          ; $53 for a $6000 window
.core.__FAR_STACK_SIZE  EQU 48          ; 3 * codebankdepth
.core.__CODE_BANK_TABLE:
DEFB 11, 40, 41, 42                     ; [0] = boot page, then one per bank
```

Entry 0 is a static default (`_DEFAULT_SLOT_PAGE`) that `__FAR_INIT` overwrites
at startup.

---

## 7. The assembler: output segments

zxbasm originally had one `Memory` object with one `ORG`. It now holds a
dictionary of `_Segment` objects:

```python
class _Segment:
    __slots__ = ("ORG", "base", "id", "index", "max_size", "memory_bytes", "orgs")
```

`Memory` keeps `self.segments: dict[int, _Segment]` and `self._cur`, and exposes
`memory_bytes` / `orgs` / `index` / `ORG` as **proxy properties** onto the
current segment. That is why `zxbasm.py` and the four call sites in
`asmparse.py` needed no changes at all.

A `CODEBANK n` pseudo-op (`asmlex.py`, `zxnext.py`) switches segments, and is
only recognised when `OPTIONS.zxnext` is set. Segment 0 is the resident program;
segment *n* has `base = codewindow` and `max_size = codewindowsize`. Segments
are re-enterable — switching back resumes where it left off.

**Labels are global across segments.** There is one namespace, so banked code
calls resident routines and reads resident variables by name with no
indirection. `declare_label` additionally records which segment a label was
defined in, and `memory_map()` prefixes banked labels with `B<n>:`.

That recorded segment is what powers the safety check:

```python
def check_cross_segment_refs(self):
    """Reports any reference from outside a code bank to a label inside it."""
    # scans every instruction's label_refs, in every segment
```

Two banks are never mapped at once, so an address in bank 1 means nothing to
code in bank 2, and the resident program sees whatever bank happens to be paged
in. That applies to data exactly as much as to control transfer: `LD HL, _table`
reaching into another bank is as broken as a `CALL` into one. References *to*
segment 0 are always fine because the resident program is permanently mapped —
and calls that go *through a trampoline* are calls into segment 0 by
construction, which is why the check does not have to special-case them.

Two supporting details make this work:

- `Asm.__init__` collects `label_refs` for `DEFB`/`DEFW`/`DEFS` as well, so a
  table of addresses is inspected like any other operand.
- One reference is exempt: the resident trampoline's `DEFW _Foo.__far`. It is
  the single legitimate pointer from segment 0 into a bank, because
  `__FAR_CALL` pages the bank in before using it. Recognised by the
  `FAR_BODY_SUFFIX` (`.__far`) that `codebank.banked_label()` appends, shared
  via `src/api/codebank_options.py` so zxbasm need not import the z80 backend.

`ORG` inside a bank is rejected (`p_org`), since a bank's origin is the window.

**Temporary labels are flushed at a segment switch.** `1:` and `jr 1f` are
positional, so they must not resolve across a bank boundary — but they are
otherwise only resolved at the very end of assembly. Simply forgetting them at a
`CODEBANK` directive orphaned references that earlier code had already
satisfied, and they surfaced much later as a bogus `Undefined label '1'` out of
`dump()`. `set_segment` now calls `flush_temporary_labels()`, which resolves
what it can and errors on what it cannot.

---

## 8. Optimizer interaction

One line, and it was not optional. In `flow_graph.py:_compute_calls`:

```python
op = bb[-1].branch_arg
op = FAR_TRAMPOLINES.get(op, op)   # trampoline label → real body label
if op in labels:
    labels[op].basic_block.called_by.add(bb)
```

Without it, a call to `_Foo` reaches the 6-byte trampoline, whose basic block
ends in `call` + data rather than in a `ret`, so the real body's `ret` block is
left with **zero** `goes_to` edges. Liveness analysis at `-O3`/`-O4` then
concludes the return value is dead and deletes the instructions that compute it.
Verified empirically: 0 edges before the fix, exactly 1 after.

---

## 9. Output and packing

`generate_code_banks()` in `asmparse.py` runs after `generate_binary()` has
dumped segment 0. For each non-empty bank it writes `<name>.bank<N>.bin` and
adds a manifest entry, then writes `<name>.banks.json`:

```json
{
  "window": 24576,
  "window_size": 8192,
  "banks": [
    { "bank": 1, "file": "prog.bank1.bin", "org": 24576, "size": 289, "page": 40 }
  ]
}
```

Two errors are raised here:

- a bank larger than the window — the message lists the largest routines in that
  bank, sorted by size and capped at 12, so it names the thing to move;
- a code window that overlaps the resident program.

`nextbuild.py` reads the manifest, prints a per-bank size summary, and emits the
`!MMU<file>,<page>,<offset>` lines into the `.cfg` for `nextcreator.py`.

It also tracks what each blob occupies, so a code bank cannot be silently
clobbered. `claim_range()` records byte intervals rather than whole pages, in a
flat space where `address = page * 0x2000 + offset`. That mirrors `add_file()`
in `nextcreator.py`, which works in 16K banks and places 8K page *p* at
`(p >> 1) * 0x4000 + (p & 1) * 0x2000` — so a blob running past the end of its
page spills into the next one exactly as modelled.

Ranges matter because `LoadSDBank` takes an in-page offset: packing several
blobs into one page is a legitimate technique, and claiming whole pages
false-positives on it. Overlap involving a code bank is fatal; data on data is
a warning, because the tail of an over-long asset landing on the next blob is
usually padding and is the author's call.

---

## 10. Bank-local data

Code was banked first; variables came second, and they take a different route
through the compiler because globals are emitted by a **separate pass**.

### Why it needed a new path

`zxbc.main()` emits code and data in two disjoint `backend.emit()` calls. The
`VarTranslator` pass runs over `zxbparser.data_ast` — a flat BLOCK of
VARDECL/ARRAYDECL built from the symbol table — and its output is concatenated
*in front of* `__MAIN_PROGRAM__`:

```python
asm_output = (
    backend.emit_prologue()
    + tmp                                   # every global, resident
    + [DATA_END_LABEL:, MAIN_LABEL:]
    + asm_output                            # code, incl. the CODEBANK fences
    + backend.emit_epilogue()
)
```

The `CODEBANK n` fences only ever exist inside `asm_output`, so nothing that
pass emits could land in a bank.

### Binding

`SymbolTable._bind_to_codebank()` stamps `entry.ref.bank` from `OPTIONS.codebank`
in `declare_variable` and `declare_array`, mirroring what `p_function_header`
does for routines. `VarRef` gained a `bank` slot; `ArrayRef` extends `VarRef`, so
arrays came for free. Three things are deliberately never bound:

- **locals and parameters** — they live on the IX frame, so only declarations
  landing in `global_scope` are stamped;
- **`CONST`** — never gets storage (`ConstRef` has no `bank` field either);
- **a scalar `DIM x AT addr`** — emits a bare `EQU` and no storage at all, so
  there is nothing to place and `codebank.bank_of_var()` returns 0 for it.

Note that `_bind_to_codebank` has **no `addr` guard**: an `AT` declaration is
stamped with its bank like any other, and `_check_codebank_access` reads
`ref.bank` directly, so such a declaration has always been treated as bank-local
at the point of *use*. Only `bank_of_var()` masks the bank, and only for the
scalar case where there is no storage for the mask to matter to.

An **array** `AT` is not storage-free. `visit_ARRAYDECL` skips the data but still
emits the descriptor that `__ARRAY` indexes through — the dim-sizes pointer, a
word holding the address itself, and the two bound pointers:

```asm
	_buf.__DATA__ EQU .LABEL._blob
_buf:
	DEFW .LABEL.__LABEL0          ; dim sizes
_buf.__DATA__.__PTR__:
	DEFW .LABEL._blob             ; the address, as real storage
	DEFW 0                        ; lbound
	DEFW 0                        ; ubound
```

That word is only meaningful while the page it points into is mapped, so the
descriptor follows the declaration's bank. Emitting it resident — which is what
happened before — produced a `DEFW` in segment 0 naming a label in segment *n*,
which the assembler's cross-segment check rejects outright. A constant subscript
hid the problem, because `buf(0)` compiles to `ld (_buf.__DATA__ + 0), a` off the
`EQU` and never touches the descriptor; only a variable subscript goes through
`__ARRAY`.

`codebank_asm.check_at_address_banks()` then requires a declaration and its `AT`
address to agree on a bank. It has to be a post-parse pass over `data_ast`:
`p_arr_decl` discards the declaration node, so the address expression never
reaches the program AST and lives only on `entry.addr`.

### Emission

`VarTranslator` gained a `bank` parameter and emits only the declarations
belonging to that bank. `zxbc.emit_banked_vars()` then runs one extra pass per
bank that holds data and fences each block:

```
CODEBANK 1
_cursor:      DEFB 00
_sine:        DEFW .LABEL.__LABEL0
_sine.__DATA__.__PTR__: DEFW _sine.__DATA__
              DEFW 0
              DEFW 0
_sine.__DATA__: DEFB 10h, 13h, ...
CODEBANK 0
```

The blocks are spliced **between `asm_output` and `emit_epilogue()`** — after
the code, because `Memory.set_segment` resumes a segment's cursor and simply
lays the data down after that bank's routines, and before the epilogue, because
`AT_END` (local array initialiser templates, `__EXIT_FUNCTION`) has to stay
resident. Forward references from bank code to bank data resolve in `dump()`'s
pending pass, exactly as the trampolines already reference `_Foo.__far`.

A program with no banked data gets `[]` back, which is what keeps ordinary
compilation byte-for-byte identical.

The bank filter is checked *before* anything else in `visit_VARDECL` /
`visit_ARRAYDECL`, so a pass neither warns twice about the same unused variable
nor burns a temporary label on an array it will not emit. `BANKS_WITH_DATA` is
recorded only once something survives the unused check, so a bank whose only
variable was dropped does not reserve a page.

### What stays resident, and why

The heap (`__MEM_ALLOC` needs one global free list), string literals, `DATA`
blocks (`__DATA_ADDR` holds a raw cursor across statements and far calls), jump
tables, and local array bound tables — the last of these was already deferred
out of banks, because `LBOUND`/`UBOUND` on a `ByRef` array parameter
dereferences the caller's table.

That makes a bank-local `String` a split object: the 2-byte descriptor is in the
bank, the characters are on the resident heap. It works with no special handling
— concatenation, slicing, string arrays, and returning a `String` out of a bank
all behave normally, because the value crossing the boundary is a heap pointer
and `__FAR_RETURN` preserves every register. What it does *not* do is move text
out of the resident 32K; a literal is resident wherever it is used. Packing text
into a bank and pulling it back with `FarStr` (10c) is what actually does that;
`bank_strings.bas` demonstrates the older by-hand version of both halves.

### Enforcement

Two layers, and the important one is the assembler:

- **`Memory.check_cross_segment_refs`** is the guarantee. Every access to a
  global eventually becomes one machine instruction naming the label — `@var`,
  `ByRef`, `ARRAYCOPY`, the four pointers `__ARRAY` chases per access,
  constant-folded subscripts, hand-written asm — so widening the check from
  branches to all label references catches every route with one mechanism.
- **`SymbolTable._check_codebank_access`** exists only to report a BASIC line
  number for the common cases. It hangs off `access_id`, not `access_var` /
  `access_array`: those two delegate to it, but a bare identifier in an
  expression reaches `access_id` directly from `p_id_expr`, so anchoring the
  check any higher misses `PRINT bankvar` and `x = bankvar` entirely. It is
  restricted to `CLASS.var` / `CLASS.array`, since a banked SUB carries a bank
  on its ref too and calling one from anywhere is the whole point.

  Its notion of "the bank in scope" is the enclosing routine's bank, or
  `OPTIONS.codebank` at module level — the latter so that a `DIM` inside a
  `CODEBANK` block does not report itself. The cost is that a module-level
  *statement* physically inside the block slips past this layer; the assembler
  still catches it.

### Deferred initialisers

`p_var_decl` keeps an initialiser as storage only when it is a compile-time
constant (`defval = value if is_static(expr) and value.type_ != TYPE.string`).
Everything else — every `String`, because it is a heap object, and any
non-constant expression — becomes a `LET` appended to the enclosing statement
list. At module level that list is the resident main body, `CODEBANK` block or
not, so a bank-local variable's initialiser was resident code storing into a
bank: caught by the assembler, with a line number pointing wherever the last
`#line` happened to be.

`zxbparser._delayed_init` puts the store where it belongs instead. The `LET` goes
into a synthesised parameterless SUB bound to that bank, and a call to it takes
the `LET`'s place in the statement list — so it runs through the ordinary
trampoline, with the bank paged in, and nothing about the bank-local model has to
change. The pattern is the one `p_data` already uses to synthesise a FUNCTION for
a non-static DATA value.

One SUB per initialiser rather than one per bank. Grouping would save a few bytes
and lose the ordering: the calls sit exactly where the declarations were, so a
resident statement between two `CODEBANK` blocks is seen by the second and not by
the first.

### The one hole

Aside from `FARPTR`, which is a deliberate door and is covered in 10c below:
a pointer taken in-bank and dereferenced after the bank is paged out:

```basic
CODEBANK 1
    DIM buf(255) as uByte
    SUB Go() : ResidentHelper(buf()) : END SUB
END CODEBANK
```

The `ld hl, #_buf` is emitted *from bank 1*, referencing a bank-1 label, so both
checks pass; the resident callee then dereferences it after `__FAR_RETURN` has
restored the previous page. `Translator._check_byref_codebank`, called from
`visit_CALL`/`visit_FUNCCALL` where both the callee's bank and the argument list
are in hand, warns `[W900]` when the two differ — and stays quiet on same-bank
`ByRef`, which is fine.

---

## 10b. Bank-scope asm blocks

A module-level `asm` block inside a `CODEBANK` block is compiled into that bank
rather than run inline. The mechanics differ from bank-local variables in one
important way: **`CODEBANK` is declaration-scoped, and an asm block is not a
declaration**, so there is nothing to hang the binding off. It has to be
reconstructed positionally, after parsing.

### Why a post-parse pass

`CODEBANK n` produces no AST node. `make_asm_sentence` can therefore record the
bank in effect (`SymbolASM.bank`), because it runs while `OPTIONS.codebank` is
still live, and it gates on `FUNCTION_LEVEL` so a block inside a banked SUB is
never marked — that one already reaches the bank through the routine body.

What it cannot decide is whether a *label* belongs to the block. `my_table:` and
the `asm` on the next line reduce as two separate program lines, so the grammar
never sees them together. That is settled in `src/zxbc/codebank_asm.py`, walking
the flat top-level statement list in source order:

| node | action |
|---|---|
| `LABEL`, a line number | flush pending — a numeric label is a `GOTO` target |
| `LABEL` | add to the pending run |
| `CHKBREAK` | skip; compiler-inserted by `--enable-break` |
| `ASM` with a bank | bind every pending label to it, clear the run |
| anything else | flush pending as resident |

The flush is the whole point. Without it, `loop1:` before a `PRINT` inside a
`CODEBANK` block would move into the bank while the `PRINT` stayed resident, and
`GOTO loop1` would become a hard cross-segment error — working code broken by a
feature it never asked for.

A second walk then **zeroes the bank on every marked block that is not at the
top level**. The parser marks by `OPTIONS.codebank` alone, so a block inside
`IF x THEN ... END IF` is marked too; left marked, the translator would lift it
out of the control flow it belongs to. Clearing restores exactly the behaviour
it has always had. Both walks stop at `FUNCDECL`/`FUNCTION`, because `FuncRef`
puts a routine's body in `parent.children[1]` and an unguarded walk descends
into every routine, once per `FUNCCALL` naming it.

### Emission

`visit_ASM` and `visit_LABEL` call `codebank.collect_if_diverted(node)`, which
parks the node in `DIVERTED[bank]` and returns True to mean "do not emit here".
`FunctionTranslator.start()` replays them inside that bank's `CODEBANK n` fence,
ahead of the routines.

That point is chosen because it is after the main body has been walked (so the
set is complete) and before `Backend.emit()` (so the replayed text still goes
through the ordinary `_inline` → `ASMS` path and stays opaque to the optimizer).
It is also the only place that already opens and closes the fences.

A bank may hold nothing but a diverted block. `start()` no longer returns early
on `not banked`, and skips `_prepare_far_calls` when there are no routines, so
such a bank gets a binary and a `__CODE_BANK_TABLE` entry without dragging in
the far-call runtime — and `[W910]` says nothing will ever page it in.

### Labels and the cross-bank check

`LabelRef` gained a `bank` slot (it uses `__slots__`, so this is required, not
optional — `SymbolID` proxies attribute *reads* to the ref but not writes).

The check lives in `codebank_asm.check_label_bank_access`, not in
`SymbolTable._check_codebank_access`, and cannot move there: label banks are
assigned by the pass above, long after every `access_label()` call has run, so a
check in the symbol table would silently never fire. It walks with the enclosing
routine's bank in scope, treating a `LABEL` whose parent is not a `BLOCK` as a
reference rather than a definition.

As with variables, the assembler's `check_cross_segment_refs` is the actual
guarantee. The front-end check exists only to report a BASIC line number, since
`#line` is emitted only for user asm and the assembler's own line counter has
drifted arbitrarily by the time it reaches a generated `ld hl`.

### The assembler's own CODEBANK directive

`asm : CODEBANK n` has always worked and remains supported: it places a blob in
a bank from any scope, at the cost of the label being invisible to BASIC. What
is new is that an asm block must leave the assembler in the segment it started
in. The check is textual and net-balance, so the escape hatch
(`CODEBANK 1 ... CODEBANK 0`) passes while a block that switches and forgets to
switch back is rejected — that one silently misplaces everything emitted after
it. It is blind to a directive behind `#if` or produced by a macro.

---

## 10c. FARPTR and far memory access

Everything above is about keeping the resident program *away* from bank-local
data. `FARPTR` is the one door through, and the interesting part is how it opens
without weakening the checks that make the rest safe.

### The value

`FARPTR x` yields a `uLong`: the logical bank in bits 16-23, the address in bits
0-15. One value carries everything the runtime needs, and `FARPTR tiles + 3`
parses correctly for free — the rule binds to `singleid`, exactly as `ADDRESSOF`
does, so the addition lands on the result rather than the operand.

It is emitted as an assembler expression, which the 32-bit backend already knows
how to split:

```asm
    ld hl, ((.LABEL._tiles.__faraddr) + 65536) & 0xFFFF
    ld de, ((.LABEL._tiles.__faraddr) + 65536) >> 16
```

`Bits32.get_oper` reaches this shape for any symbolic immediate that does not
begin with `_`, and `zxbasm` evaluates expressions with Python ints, so the
`* 65536` does not truncate on the way through.

### Why a separate operator

`FARADDRESS` is a distinct unary operator rather than a flavour of `ADDRESS`
because **the bank is not known at parse time**. A module-level asm label is not
bound to its bank until `bind_module_level_asm` runs, long after the grammar rule
has reduced. So the node survives into the backend, and
`TranslatorVisitor.traverse_far_address` reads the settled bank from
`codebank.bank_of_var()`.

Reading it through `bank_of_var()` rather than `entry.ref.bank` is deliberate: it
is the same function the emission pass uses, so the two cannot drift. The case
that would drift is a scalar `DIM x AT addr` inside a bank — it carries a bank,
but is emitted as a resident `EQU` with no storage, so there is nothing to alias
and nothing that needs one.

### The alias

`Memory.check_cross_segment_refs` still sees a resident instruction naming a
label in a bank. Rather than teach the assembler about a new kind of
instruction — which it cannot recognise, because by then it is just `LD HL,NN` —
`FARPTR` names an **alias**:

- `FAR_ADDR_SUFFIX` (`.__faraddr`) joins `FAR_BODY_SUFFIX` in the whitelist,
  which is keyed on the *referenced label's name*.
- `VarTranslator._far_alias` lays the alias down at the same address as the
  storage, in the bank pass. `FunctionTranslator.start` does the same for a
  diverted module-level label.
- For a `DIM ... AT`, the alias is an `ic_deflabel` beside the real one rather
  than an `ic_label` before it: there is no storage to precede.

So the whitelist stays keyed on compiler-generated suffixes that user code cannot
produce, exactly as the trampoline's `DEFW _Foo.__far` already was. What has
changed is the nature of the guarantee: it was "the only pointer into a bank is
one __FAR_CALL creates", and it is now "the only pointers into a bank are ones
the compiler emits, and the runtime pages the bank in before dereferencing
either". Narrow, but no longer structural.

Aliases are emitted only for symbols some `FARPTR` actually names
(`SymbolRef.has_faraddress`, set in `_make_faraddress`). A label costs no bytes,
but emitting them unconditionally would still move every existing `.map`, and
byte-identical output for programs that do not use the feature is what makes the
A/B check worth running.

### Suspending the BASIC-level check

`SymbolTable._check_codebank_access` would reject the access before any of this.
The grammar rule brackets it with `SYMBOL_TABLE.far_access()`, a context manager,
because the access funnels down through `make_array_access` → `access_array` →
`access_id` — several layers below the rule, and threading a flag through all of
them would touch code that has nothing to do with banking.
`codebank_asm.check_label_bank_access` skips a `FARADDRESS` subtree for the same
reason.

### The runtime

`lib/arch/zxnext/runtime/farmem.asm`. Two primitives and five users:

- `__FAR_MAP` (A = logical bank) writes the window's MMU slot, or both slots
  under `__FAR_WINDOW_16K__`, from `__CODE_BANK_TABLE`. It deliberately does
  *not* touch `__FAR_CUR_BANK`: that records the bank the program is *executing*
  in, and this is a temporary window borrow, not a call.
- `__FAR_UNMAP` puts back `__FAR_CUR_BANK`'s window. Every accessor ends with it,
  which is what makes them safe to call from inside a bank — the caller's own
  code is in the window and has to be there again before the `ret`.

`__FAR_STR` is the one with a subtlety: it calls `__MEM_ALLOC` with the bank
still mapped. That is safe because the heap and the allocator are both resident,
so the window holds nothing either of them touches, and it saves a second
map/unmap pair.

The stdlib wrappers (`stdlib/farmem.bas`) are thin. The single-argument ones are
`FASTCALL`, where a `uLong` arrives in DE:HL — so `E` is already the bank and
`HL` already the address. The three-argument ones read the IX frame directly
(`fp` at `(ix+4..7)`, so the bank byte is `(ix+6)`), which is the same idiom the
shipped `clearBox` uses.

---

## 11. What is checked, and what is not

Enforced by the compiler, naming the offending routine or variable:

- a bank must fit the window;
- no `GOTO`/`GOSUB`/`jp`/`call` from one bank directly into a different bank;
- no reference from outside a bank to a label inside it, data included, unless
  it is made with `FARPTR`;
- `FARPTR` of a local or parameter, of a SUB/FUNCTION, or of an array element
  with a variable subscript;
- a banked SUB cannot be an `#init` routine;
- no `ORG` inside a bank; the window must not overlap the program;
- `CODEBANK` inside a SUB/FUNCTION, or `END CODEBANK` without a match;
- an `asm` block whose own `CODEBANK` directives leave the assembler in a
  different segment than it started in;
- (nextbuild.py) an 8K page claimed twice.

Warned about, not rejected:

- `[W900]` a bank-local variable passed `ByRef` out of its bank;
- `[W910]` a bank holding data but no routine, so nothing pages it in;
- `[W920]` a bare `@array`, which upstream 1.18.3 redefined as the descriptor.

Not statically checkable — observe by hand:

- **Interrupt handlers must not far-call, must not remap the code window, and
  must not live inside it.** An interrupt can fire mid-far-call while the wrong
  bank is mapped; a handler that far-called would corrupt the shadow stack.
  See `bank_isr.bas`.
- **`SP` must never point inside the code window.** With `#include
  <nextlib.bas>` this is already handled — nextlib relocates `SP` into its own
  resident buffer at startup unless `#define NOSP` is set.
- **Cross-bank nesting must stay within `codebankdepth`.** To debug an overflow,
  compare `__FAR_SP` against `__FAR_STACK + __FAR_STACK_SIZE` in
  `__FAR_CALL_SWITCH` and jump to `.core.__ERROR`.
- **The resident side of a `FarCopy` must not lie inside the code window**, and
  none of the far-memory accessors may be called from an interrupt handler —
  they remap the window, which is the one thing a handler must never do.

---

## 12. Files changed

**New**

| File | Purpose |
|---|---|
| `src/api/codebank_options.py` | options shared by compiler and standalone assembler |
| `src/arch/z80/backend/codebank.py` | trampoline registry, bank table, prologue data |
| `src/lib/arch/zxnext/runtime/farcall.asm` | the far-call runtime |
| `src/lib/arch/zxnext/runtime/farmem.asm` | the far-memory runtime (`__FAR_MAP`, `__FAR_COPY`, `__FAR_STR`, ...) |
| `src/lib/arch/zxnext/stdlib/farmem.bas` | the BASIC surface: `FarPeek`, `FarCopy`, `FarStr`, ... |
| `src/zxbc/codebank_asm.py` | post-parse passes: bank-scope asm, label access, `AT` addresses |

**Modified**

| File | Change |
|---|---|
| `src/zxbc/keywords.py` | `CODEBANK` and `FARPTR` keywords |
| `src/zxbc/zxbparser.py` | block grammar; bank binding in `p_function_header`; `FARPTR` rules |
| `src/symbols/id_/ref/symbolref.py` | `has_faraddress` added to `__slots__` |
| `src/symbols/id_/ref/funcref.py` | `bank` added to `__slots__` |
| `src/symbols/id_/ref/varref.py` | `bank` added to `__slots__` (`ArrayRef` inherits it) |
| `src/api/symboltable/symboltable.py` | `_bind_to_codebank` on declaration; `_check_codebank_access` from `access_var`/`access_array` |
| `src/arch/z80/visitor/var_translator.py` | per-bank filter, `_should_emit` |
| `src/zxbc/zxbc.py` | `emit_banked_vars()` — one fenced pass per bank, spliced before the epilogue |
| `src/arch/z80/visitor/translator.py` | `_check_byref_codebank` warning from `visit_CALL`/`visit_FUNCCALL` |
| `src/api/errmsg.py` | fork warnings, all in the reserved 900+ block: `W900` (ByRef leaves bank), `W910` (bank with no routines), `W920` (bare `@array`) |
| `src/arch/z80/visitor/function_translator.py` | partition by bank, trampolines, `__EXIT_FUNCTION` and bound-table deferral |
| `src/arch/z80/optimizer/flow_graph.py` | follow trampoline → body in the call graph |
| `src/arch/z80/backend/main.py`, `src/arch/zxnext/backend/main.py` | init options, emit prologue data |
| `src/arch/z80/backend/runtime/core.py` | `FAR_CALL`/`FAR_INIT`/`FAR_RETURN` labels → `farcall.asm` |
| `src/arch/z80/backend/common.py` | `codebank.reset()` per compilation |
| `src/zxbasm/memory.py` | output segments, cross-segment checks (all label refs), `flush_temporary_labels`, per-segment dump |
| `src/zxbasm/asm.py`, `label.py`, `asmlex.py`, `zxnext.py`, `asmparse.py` | `CODEBANK` pseudo-op, label segments, `label_refs` on `DEF*`, bank output + manifest |
| `src/zxbc/args_parser.py`, `args_config.py` | `--code-window`, `--code-bank-base`, `--code-bank-pages`, `--code-bank-depth` |
| `src/api/utils.py` | self-healing parser-table cache (unrelated; two Python versions share this checkout) |
| `Scripts/nextbuild.py` | `'!codewindow=` etc., manifest → `!MMU`, page-collision detection |

---

## 13. Verification performed

- **A/B regression**: 147 example programs compiled with and without the change
  produced **byte-identical** output; 42 non-building in both cases
  (pre-existing); 189 logs with identical errors. Baseline was a pristine
  `pip download zxbasic==1.18.4`, since `zxbasic1.18.4/` is gitignored.
- **Far-call ABI** (`farcall_test.bas` + `run_far.py`, a Z80 emulator with a
  minimal Next MMU): fast path, cross-bank, nested `resident → bank2 → bank1 →
  bank2`; return values in `A`/`HL`/`DE:HL`; `BC`/`DE`/`IX`/`IY` preserved;
  shadow stack fully unwound; final logical bank 0. Passes at `-O2` and `-O4`.
- **BASIC-level** (`bank_deep.bas`, headless variant): 20-deep mutual recursion
  across banks, six-argument stdcall frames, 16/32-bit and string returns —
  all correct, 51 MMU page swaps, shadow stack unwound.
- **Real hardware emulation**: CSpect, `BankedCode.bas`.
- **Negative tests**: cross-bank branch, bank overflow, `ORG` in a bank,
  window/resident overlap, `CODEBANK` inside a PROC, `END CODEBANK` underflow,
  `CODEBANK` inside a SUB, banked `#init` — all fire with actionable messages.

### Bank-local data (added later)

- **Regression**: all six banked examples rebuilt **byte-identical** —
  binaries, bank blobs, manifests and warning logs — proving the widened
  cross-segment check does not trip on the trampolines and that programs with
  no banked data are unaffected.
- **Smoke**: 188 ordinary programs under `Sources/NextBuild_Examples/` compiled
  with no Python traceback; the 42 failures are all pre-existing (missing
  assets, missing includes, the known nextlib label problems) and none mention
  CODEBANK, bank-local data or temporary labels.
- **Functional** (`farcall_test.bas` + `run_far.py`): bank 1 holds an array and
  a counter, bank 2 its own array and counter, both at overlapping window
  addresses (`B1:60A7…` vs `B2:6070…`). Reads, writes and a
  `bank2 → bank1 → bank2` round trip all correct; each bank's data intact after
  the other bank has run. This also exposed a fidelity bug in the harness —
  `_page_in` never wrote a page's changes back, so bank-local writes vanished on
  page-out; fixed.
- **Negative**: resident code reading a bank-1 array, a bank-2 routine reading
  it, and hand-written `ld hl, ._lut.__DATA__` from resident asm — the first two
  reported at the BASIC line by the front end, the third by the assembler.
- **Overflow**: a 9000-byte array in one bank reports
  `CODEBANK 1 is 9042 bytes, 850 over the 8192 byte code window` and names
  `_big.__DATA__` first.
- **Edge cases**: an unused banked variable is dropped and reserves no page; a
  bank with data but no routines warns `[W910]`; a same-bank `ByRef` stays
  silent while a cross-bank one warns `[W900]`.
- **Strings** (`bank_strings.bas`, headless variant on the emulator): a
  bank-local `String` and string array, concatenation and 0-based slicing inside
  a bank, splitting into a bank-local array, a bank-2 routine calling bank 1
  mid-string-work, `String` returns out of banks, and text decoded from a
  bank-local `uByte` array — twelve checks, all exact. This is also what
  exposed the `access_id` anchoring above: `line$ = title$` was reaching only
  the assembler, which reported it against `nextlib.bas:52`.

### FARPTR and far memory (nb6)

- **A/B regression**: all 15 programs in `Sources/Tests/BankedCode/` that the
  nb5 baseline can build came out **byte-identical** — `.bin`, `.map`,
  `.banks.json` and every bank blob. The alias labels are emitted only for
  symbols a `FARPTR` names, which is what keeps the `.map` identical too.
- **Functional sweep**: 1424 pass / 26 known failures, unchanged against
  `known-failures.txt`. The goldens embed the whole runtime library, so this is
  also the check that `farmem.asm` is not being pulled into programs that do not
  ask for it.
- **Runtime** (`farmem_test.bas` + `run_far.py`): 38 assertions, green under both
  an 8K and a 16K window. Two banks hold data at the same window addresses, so
  reading the wrong one is never a subtle failure. Covers peek/pokeW/copy in both
  directions, a zero-length copy, `FarStr` against literals, `FARPTR` of an asm
  label, of a bank-local `DIM`, of a constant array subscript and of a resident
  symbol, and the same calls made from *inside* bank 2 — with the caller reading
  its own bank-local data again afterwards to prove the window came back.
- **Mutation**: making `__FAR_UNMAP` return without restoring turns 0 failures
  into 2985 and leaves the window on page 40 instead of 11, so the test is
  genuinely exercising the restore path rather than passing by luck.
- **Negative**: `FARPTR` of a local, of a banked SUB, of an array element with a
  variable subscript, and of an undeclared array — all four report at the BASIC
  line with an actionable message.
- **Harness bug found and fixed**: `run_far.py` told bank labels from resident
  ones by a leading `"B"` in the address column, which also discarded every
  resident label in `$B000-$BFFF`. A program org'd at `$A000` therefore lost its
  `finished` label and ran to the step limit; `farcall_test16` was affected.

### Bank-local DIM initialisers and the parser cache (nb7)

- **A/B regression**: all 15 programs in `Sources/Tests/BankedCode/` that the nb6
  baseline can build came out byte-identical. `_delayed_init` returns the
  sentence untouched for anything resident, so a program with no bank-local
  initialiser is unaffected.
- **Runtime** (`bankinit_test.bas` + `run_far.py`): 15 assertions. Static
  initialisers still become storage in the bank; deferred ones (a `String`
  literal, a function call, another variable) now arrive; the order check has a
  resident assignment between two `CODEBANK` blocks and asserts the second bank
  sees it and the first does not; a local `String` default inside a banked
  routine is on the stack and unaffected; resident initialisers unchanged.
- **The user's case**: `tes.bas`, which has `dim st2$ as string = "test"` in
  `CODEBANK 4`, builds and its bank blob is 340 bytes.
- **Parser cache**: verified by adding a keyword *without* clearing
  `src/parsetab/tabs.dbm*` and confirming the new token is recognised. Before the
  fix the stale table treated it as an ordinary identifier. This bug produced a
  false A/B result during nb6 — a baseline worktree reported it could not build
  `farmem_test.bas`, which it builds fine.
