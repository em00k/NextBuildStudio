# zxbc pipeline: how source becomes bytes

A map of the compiler as this fork finds it, written because the same ground
kept getting re-explored. `INTERNALS.md` explains what CODEBANK *does*; this
explains the machinery it hangs off, so the next change can start from a
diagram rather than from `grep`.

Line numbers are against **1.18.7-nb3** and will drift. The names will not.

---

## 1. The route from `.bas` to `.asm`

```
   source
     |
[ zxbpp ]                    preprocessor, BASIC mode
     |
[ zxblex ]                   PLY lexer          src/zxbc/zxblex.py
     |
[ zxbparser ]                PLY parser         src/zxbc/zxbparser.py
     |                       -> zxbparser.ast        (statements)
     |                       -> zxbparser.data_ast   (globals, built in p_start)
     |
[ AST passes ]               src/api/optimize.py, src/zxbc/codebank_asm.py
     |
[ Translator ]               AST -> quads       src/arch/z80/visitor/translator.py
     |                       appends to backend.MEMORY
[ FunctionTranslator ]       SUB/FUNCTION bodies, after the main body
     |
[ Backend.emit() ]           quads -> asm text  src/arch/z80/backend/
     |
[ peephole optimizer ]       src/arch/z80/optimizer/
     |
[ ASMS substitution ]        ##ASMn -> real inline asm text   zxbc.py
     |
[ zxbpp again ]              preprocessor, ASM mode
     |
[ splice ]                   prologue + vars + code + bank vars + epilogue
     |
[ zxbasm ]                   src/zxbasm/  -> .bin, .bank<N>.bin, .map
```

## 2. Lexer and parser

The lexer is ordinary PLY with one thing worth knowing: **`asm` is an exclusive
lexer state**. `t_asm` (`zxblex.py:411`) enters it, a set of accumulator rules
collect the block into one module-global string, and `t_asm_ASM` (`:422`) emits
a **single `ASM` token** whose value is the whole block and whose `lineno` is
the line of the *opening* `asm`, not the `end asm`.

Consequences that bite:

- `;` comments inside an asm block are **discarded by the lexer** (`t_asm_comment`,
  `:442`) and never reach the backend.
- `#line`/`#define` inside the block survive (`t_asm_PREPROCLINE`, `:446`) and
  resync `lexer.lineno`.
- Anything wanting to inspect asm text does so on one string with embedded
  newlines. There is no per-line token.

The parser builds an AST of `Symbol` nodes from `src/symbols/`. Two roots come
out of `p_start` (`zxbparser.py:505`):

| | |
|---|---|
| `zxbparser.ast` | the program's statements |
| `zxbparser.data_ast` | `VARDECL` / `ARRAYDECL` for every global, built at `:543-551` — **labels are not in it** |

**`SymbolBLOCK.append` flattens nested blocks** and drops `None`/`NOP`
(`src/symbols/block.py:46`). So the top level of `ast` is a *flat* statement
list in source order: labels, `ASM` nodes and `FUNCDECL`s are direct siblings.
`my_table:` on one line and `asm` on the next are indistinguishable from
`my_table: asm ... end asm` on one. This is what makes positional AST passes
practical.

### Things that produce no node at all

`preproc_line` rules reduce to `None` and vanish: `#pragma`, `#init`, `#require`,
and `CODEBANK n` / `END CODEBANK`. They are **parse-time side effects only**.
`CODEBANK` pushes/pops `OPTIONS["codebank"]` (`zxbparser.py:3253`, `:3272`), and
that flag is read in exactly three places:

- a SUB/FUNCTION header → `ref.bank` (`zxbparser.py:3035`)
- a global `DIM` → `ref.bank` (`symboltable.py:583`, `_bind_to_codebank`)
- `make_asm_sentence` → `SymbolASM.bank` (`zxbparser.py:297`)

Nothing else records lexical position, which is why `CODEBANK` is
**declaration-scoped, not lexically scoped**, and why ordinary statements
written inside the block still compile resident.

### Scoping quirks worth remembering

- **Labels are always global** (`symboltable.py:667`), even one written inside a
  SUB. `to_label()` resets the namespace.
- A function body is a **child of its FUNCTION `SymbolID`**: `FuncRef.__init__`
  sets `parent.children = [PARAMLIST, BLOCK]` (`funcref.py:29`). An unguarded
  recursive walk therefore descends into every routine, repeatedly, once per
  `FUNCCALL` naming it. Stop at `token in ("FUNCDECL", "FUNCTION")`.
- Symbol refs use `__slots__`. `SymbolID.__getattr__` proxies reads to `.ref`
  but there is **no `__setattr__` proxy**, so a new field must be added to the
  ref class's `__slots__` or the assignment raises `AttributeError`. A field
  every kind of symbol needs goes on the base `SymbolRef` (that is where
  `has_faraddress` lives); one only variables and arrays need goes on `VarRef`,
  which `ArrayRef` inherits (`bank`).
- **A bank is not known at parse time for a label.** Variables and arrays are
  bound at their `DIM` (`symboltable.py:_bind_to_codebank`), but a module-level
  asm label is bound by `bind_module_level_asm`, after parsing. Anything that
  needs a label's bank must therefore run in the backend, not in a grammar rule
  — which is why `FARPTR` produces a `FARADDRESS` node that survives that far.

## 3. AST passes

Run from `zxbc.py main()` between parsing and translation, in this order:

| Pass | File | Note |
|---|---|---|
| `UnreachableCodeVisitor` | `src/api/optimize.py` | also strips the `CHKBREAK` that `--enable-break` wedges after a `LABEL` |
| `codebank_asm.bind_module_level_asm` | `src/zxbc/codebank_asm.py` | fork-local; decides which module-level asm goes in a bank |
| `codebank_asm.check_label_bank_access` | " | fork-local; cross-bank label references |
| `FunctionGraphVisitor` | `src/api/optimize.py` | call graph |
| `OptimizerVisitor` | `src/api/optimize.py` | may delete statements |

Anything positional must run **before** the optimizer. Anything needing
`CHKBREAK` gone must run **after** unreachable-code removal.

## 4. Translation to quads

`Translator` (`src/arch/z80/visitor/translator.py`) walks the AST and appends
`Quad`s to a single flat `backend.MEMORY` list, via `emit()`
(`translator_inst_visitor.py:21`). Order in `MEMORY` is order in the output.

`visit_FUNCDECL` does **not** translate the body — it appends the entry to
`gl.FUNCTIONS` (`translator.py:201`). `zxbc.py` then runs `FunctionTranslator`,
so every routine body lands *after* the whole main body.

Inline asm: `visit_ASM` emits three `inline` quads — `#line`, the block, `#line`
again — through `emit_asm_node`.

## 5. Backend: quads to text, and the `##ASMn` trick

`_inline` (`src/arch/z80/backend/generic.py:552`) does **not** put asm text in
the output stream. It tabulates the lines, parks them in
`common.ASMS["##ASM<n>"]`, and emits that single opaque token as one line.

That token is what makes inline asm safe:

- the peephole optimizer treats a line in `ASMS` as clobbering **all**
  registers (`optimizer/memcell.py:131`, `:187`)
- and as a **basic-block boundary** (`optimizer/basicblock.py:173`)

The real text is spliced back in `zxbc.py` after the optimizer, then the whole
file is run through the preprocessor again in ASM mode, which is what consumes
the `#line` directives.

## 6. Deferral mechanisms

The compiler has ten separate "emit this somewhere other than here" hooks. Reuse
one rather than inventing an eleventh.

| Mechanism | Where it lands | Producer → consumer |
|---|---|---|
| `gl.FUNCTIONS` | after the main body | `visit_FUNCDECL` → `FunctionTranslator.start()` |
| `common.AT_END` | very end of file, raw asm lines | `_lvarx`/`_lvard`/`_larrd`, `_prepare_far_calls` → `emit_epilogue()` |
| `_deferred_bound_tables` | after all bank fences close | `FunctionTranslator` → same, at end of `start()` |
| `_deferred_resident` | after all bank fences close | rerouted nested `FUNCDECL`s |
| `gl.DATAS` | after functions | `p_data` → `emit_data_blocks()` |
| `STRING_LABELS` | after DATA | `add_string_label()` → `emit_strings()` |
| `JUMP_TABLES` | after strings | `visit_ON_GOTO` → `emit_jump_tables()` |
| `ASMS` | in place, but opaque | `_inline` → `zxbc.py` substitution |
| `REQUIRES` / `INITS` | tail / prologue | `#require`, `#init` |
| `codebank.DIVERTED` | inside a bank's fence | `visit_ASM`/`visit_LABEL` → `FunctionTranslator.start()` |

`emit_data_blocks()` must run before `emit_strings()`: it can mark new strings
as required.

## 7. The final splice

`zxbc.py` builds the file in this exact order:

```python
asm_output = (
    backend.emit_prologue()      # runtime setup, __CODE_BANK_TABLE
    + tmp                        # resident globals (VarTranslator, bank 0)
    + [DATA_END_LABEL, MAIN_LABEL]
    + asm_output                 # main body, then routines, then data/strings/tables
    + bank_vars                  # bank-local globals, fenced CODEBANK n .. CODEBANK 0
    + backend.emit_epilogue()    # AT_END, then END
)
```

Two ordering facts that are load-bearing:

- `emit_banked_vars()` is called **before** this expression is evaluated, so
  `BANKS_WITH_DATA` is complete by the time `emit_prologue()` sizes
  `__CODE_BANK_TABLE`.
- `bank_vars` sits before `emit_epilogue()`, because `AT_END` must stay resident.

Globals are produced by a **second translation pass**: `MEMORY` is cleared, a
fresh `VarTranslator` walks `data_ast`, and the lines are captured. CODEBANK
runs one such pass per bank (`emit_banked_vars`, `zxbc.py:73`).

## 8. The assembler

`zxbasm` assembles into **output segments** (`src/zxbasm/memory.py`). Segment 0
is the resident program; segments 1..n are code banks, each assembled at the
code-window address and written out separately.

- `CODEBANK n` is an assembler pseudo-op, `zxnext` only (`asmlex.py:195`,
  `zxnext.py:27`), and calls `Memory.set_segment`, which **resumes** a segment's
  cursor rather than restarting it.
- Labels share one namespace across all segments, but an *address* label records
  which segment it was declared in (`memory.py:412`, `Label.segment`).
- `check_cross_segment_refs` (`memory.py:279`) rejects any reference from one
  segment into a different non-zero one. References *to* segment 0 are always
  fine — that is what lets banked code call the runtime and read globals.
- `flush_temporary_labels` runs at every segment switch: temporary labels
  (`1:`, `jr 1f`) are positional and must not resolve across a boundary.
- The `.map` prefixes a banked label with `B<n>:`, because its 16-bit address is
  shared between banks. **That prefix is the reliable signal that something is
  really in a bank.**

## 9. Debugging recipes

| Question | How |
|---|---|
| Where did this label end up? | `grep 'B[0-9]*:.*_name' out.map` — a `B<n>:` prefix means bank n |
| Is this byte resident or banked? | compare `out.bin` against `out.bank<n>.bin` |
| What did the optimizer do? | `-O0` vs `-O4` on the `.asm` |
| What quads were emitted? | `--asm`/`-A` intermediate dump, or read `backend.MEMORY` |
| Why is my asm block not where I put it? | it is `##ASMn` until the substitution in `zxbc.py`; look at the `.asm`, not the quads |
| Did a bank overflow? | `asmparse.py:1025` lists the largest routines in it |
