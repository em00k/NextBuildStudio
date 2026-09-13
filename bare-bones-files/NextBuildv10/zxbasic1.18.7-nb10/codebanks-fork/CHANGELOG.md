# Changelog — NextBuild fork of zxbasic

Changes made in this fork, on top of upstream
[boriel-basic/zxbasic](https://github.com/boriel-basic/zxbasic).
Upstream's own history is in `../CHANGELOG.md`.

## Versioning

```
1.18.7-nb1
└─┬──┘ └┬┘
  │     └─ fork revision, bumped whenever we change the compiler
  └─────── the upstream release this is based on
```

The base moves only when we deliberately merge a new upstream release; see
`SYNCING.md`. Individual upstream bug fixes are cherry-picked onto the current
base instead, which bumps the `nb` number only.

`VERSION` in `src/zxbc/version.py` and `src/zxbasm/version.py` is deliberately
forked, because NextBuild reads it directly to print the compiler version.
Upstream bumps those files every release, so expect a one-line conflict on each
merge — take ours and rebase the number onto the new base.

---

## 1.18.7-nb10

Base: unchanged, upstream **v1.18.7**.

### Fixed — `-O4` deleted register loads after `IF … THEN Sub()`

+ The `-O4` optimiser could remove a register load at a label straight after a
  call, whenever the called SUB branches. The program then ran with a stale
  value. The common casualty is a `UBYTE` array index, whose `ld l, a` /
  `ld h, 0` widening vanished:

  ```basic
  w = s
  IF g <> 0 THEN Other()      ' Other() branches and changes HL
  Take(a(s))                  ' -O4 read a(HL), not a(s)
  ```

  On an emulator this reads `a(4)` instead of `a(5)` on unpatched v1.18.7. `-O3`
  and lower were never affected. **This is an upstream bug.** `_compute_calls` is
  identical on upstream `main` as of 2026-09-11, and the fork's own change to
  that function was not involved.

+ **How we found it.** In Trafalgar, a one-deck ship being sunk was drawn up into
  the sky and sank over and over. The line was
  `SinkShip(..., p1guns(sel_pos), 0)`, directly after
  `if pl_win <> 0 then ExplodeBoats()`. `ExplodeBoats` left H non-zero, and the
  deleted `ld h, 0` turned the index into `H*256 + sel_pos`.

+ **Cause** (`src/arch/z80/optimizer/flow_graph.py`).
  - `_split_block` removes a call's fall-through edge. `_compute_calls` then
    walks the callee from its entry to each `ret` and links that `ret` back to
    the block after the call.
  - The walk stopped at the first `jp`/`jr`/`djnz` and at any unconditional
    nested `call`. So for nearly every real SUB, the block after the call never
    learned the callee returns there.
  - At `-O4`, `guesses_initial_state_from_origin_blocks()` then took the
    registers of the *other* predecessors (the jump that skipped the call) as
    fact. Liveness had the same hole: registers were judged dead at a `ret` with
    no successors.

+ **Fix.** A new `_find_exits()` follows every way execution continues inside
  the callee: jump targets, the next block after a conditional branch, and the
  return from a nested call. A jump it cannot follow (`jp (hl)`, an undefined
  label) counts as a possible exit. Exits are computed once per callee, not once
  per call site. Extra edges can only make the analyses more cautious, never
  less. The far-call trampoline lookup now falls back to the trampoline label if
  the banked body is not in the listing, instead of dropping the edge.

+ **Considered and rejected:** refusing to guess any register state after every
  call. That also fixes the bug, but it throws away correct optimisations the
  graph now supports. Upstream's golden `opt4_due0` depends on one of them.

### Verification

+ **New tests.** All four fail without the fix and pass with it:
  - `test_basicblock.py`: `test_call_ret_after_branch`,
    `test_call_ret_after_nested_call`, `test_call_ret_through_indirect_jump`
  - `test_optimizer.py`: `test_label_after_call_keeps_registers`
  - functional `opt4_call_merge.bas`: its golden also fails against the old
    compiler.

+ **`run-tests.sh`: all green.**
  - Unit: 354 passed (350 + 4).
  - Functional: 1426 passed (1425 + 1). The same 26 known failures, and **no
    existing golden changed**.
  - CODEBANK examples and far-call emulator: unchanged.

+ **Differential sweep.** Every NextBuild program under `Sources/` with an
  `'!org` was compiled at `-O4` with the old and new compiler: 299 built, 76 need
  NextBuild's preprocessing and were skipped. `PYTHONHASHSEED` was pinned (see
  the note below). **Four programs changed**, all at a return point:

  | Program | Change |
  |---|---|
  | `Trafalgar.bas` | `ld h, 0` restored in `p1guns(sel_pos)` and `p2guns(sel_pos)` after `ExplodeBoats()`. **Real bug**, the sinking ship |
  | `Trafalgar.bas` | `ld a, (_y)` became `ld hl, (_y) / ld a, l` after `WaitRetrace` at the end of `PickPair`. One byte, over-cautious but correct |
  | `CTC_techno.bas`, `CTC_techno_Copper.bas`, `CTCSample_stream-cycle.bas` | `ld l, a` restored after `StartTune(tune)`. **Real bug**: `if a = KEY1` compared an L left over from `ChangeTune` |

+ **Trafalgar.** Back to `'!opt=4`. The harness drove `check_winner` with junk
  `H = $8B` and `SinkStep` got sizes 1/2/3 over 5/7/9 steps. The CPU aim checks
  pass, and `run_ballistics.py` passes all 134.

### Note — `-O3`/`-O4` output is not reproducible between runs

+ Compiling the same file twice at `-O3` or `-O4` can give different code.
  `-O2` and below are stable. The jumps-over-jumps pass in `optimizer/main.py`
  iterates a `set` of label strings (`self.JUMP_LABELS`), and Python randomises
  string hashes per process. So how far a chain of jumps gets threaded depends on
  the order the labels come out:

  ```asm
  jp .LABEL.__LABEL6      ; one run: lands on `.LABEL.__LABEL6: jp .LABEL.__LABEL3`
  jp .LABEL.__LABEL3      ; another run: jumps straight there
  ```

  Both are correct and the same size. The difference is one extra `jp` executed.
  Seen directly:
  - `Crimbo.bas` at `-O4`: five compiles gave four different listings.
  - `Trafalgar.bas` built through NextBuild at `-O4`: the resident `.bin` and
    the `.nex` differed between `PYTHONHASHSEED=1` and `=2`, and were identical
    for `1` and `3`.

  This was already the case before this release and is not changed by it. When
  comparing listings, set `PYTHONHASHSEED=0`.

---

## 1.18.7-nb9

Base: unchanged, upstream **v1.18.7**.

### Fixed — PLY table rebuilds shouted at the user

+ Rebuilding the parser tables printed two dozen lines of

  ```
  WARNING: Token 'NEXTREG' defined, but not used
  WARNING: There are 21 unused tokens
  ```

  and wrote a 2.6 MB `parser.out`. The tokens really are unused *by that
  grammar* — the Next opcodes belong to the assembler's, not BASIC's — so it is
  correct, permanent, and of no interest to anyone compiling a program.

  It also got commoner: since nb7 taught the table cache to notice a changed
  grammar, every compiler update triggers a rebuild, so this appeared at
  apparently random moments.

+ `utils.ply_yacc_kwargs()` now supplies `debug=False` and `_QuietPlyLogger`,
  which drops **only** the unused-token and unused-rule lines. Shift/reduce and
  reduce/reduce conflict warnings still print, and errors are untouched — a
  duplicate rule still fails the build with `YaccError`, verified. All four
  parsers (BASIC, preprocessor, and the two assembler grammars) go through it.

+ `ZXB_PARSER_DEBUG=1` restores every PLY message and writes `parser.out`. Use it
  when working on a grammar.

+ `parser.out` is now **gitignored rather than tracked**. It is generated, it is
  2.6 MB, and it had been committed as churn twice (`nb1`, `nb6`) simply because
  a grammar change regenerated it.

---

## 1.18.7-nb8

Base: unchanged, upstream **v1.18.7**.

### Added — `[W920]` on a bare `@array`

+ Upstream **v1.18.3** (commit `4b8832a1`, *"Fixes @array label emission"*)
  changed `@arr` from the address of the first element to the address of the
  **descriptor**, and updated six of its own goldens to match:

  | | 1.18.2 and earlier | 1.18.3 onwards |
  |---|---|---|
  | `@arr` | `_arr.__DATA__` | `_arr` — the descriptor |
  | `@arr(0)` | `_arr.__DATA__` | `_arr.__DATA__` |

  The descriptor is a pointer to the dimension table, then the data pointer,
  then the two bound pointers, so code that walks `@arr` with `PEEK` reads that
  header instead of the data. Silently. It cost a debugging session: a
  128-sprite demo drew one sprite 128 times.

+ **We follow upstream** rather than reverting, so source stays portable — no
  change to code generation. Instead the compiler now says so:

  ```
  warning: [W920] '@sprites' is the address of the array descriptor, not its
  data. Since 1.18.3 write '@sprites(0,0)' for the address of the first element
  ```

  The message carries the array's real arity, since that is the part people get
  wrong — `@a(0)` for one dimension, `@a(0,0)` for two. `@arr(0)` and `@scalar`
  stay silent, as does a local array: upstream's change is guarded on
  `scope == SCOPE.global_`, so that is exactly where the warning fires.

+ Note `FARPTR arr` is unaffected and unwarned. It deliberately yields the
  **data** address (a far pointer to a descriptor would be useless), so since
  1.18.3 `FARPTR a` and `@a` disagree, and `@a(0)` agrees with `FARPTR a`.

### Changed — fork warnings moved to a reserved 900+ block

+ `W310` → **`W900`** (ByRef leaves its bank), `W320` → **`W910`** (bank with
  data but no routine).

  Upstream numbers its warnings from 100 and has reached 300, so the fork's
  310/320 were standing exactly where upstream's next warnings will land.
  Reserving 900+ makes a collision on a future merge impossible in practice —
  upstream would need sixty more warnings to reach it. The rule is written down
  in `SYNCING.md`: never register a fork warning below 900.

  Historical entries below keep their original codes: they record what those
  releases actually emitted.

### Added — a record of upstream behaviour changes

+ `codebanks-fork/SYNCING.md` gains **"Upstream behaviour changes that bite"**.
  These do not show up as merge conflicts and no suite catches them — upstream
  updates its goldens, so both sides look green, and the change is found by a
  program going wrong. The `@array` change is the first entry, with the
  instruction not to revert it on a future merge.

### Migration

+ `Sources/NextBuild_Examples/` in NextBuildv10-Gold was swept with the new
  warning: **zero sites**. The only one was `4bit-sprites.bas`, already fixed by
  hand. Three files could not be parsed (broken include paths, unrelated) and
  none of them uses `@` on an array.

  A text scan had suggested twenty sites; every one was a false positive, mostly
  `@Sprites` naming a label rather than an array. The compiler is the only
  reliable oracle here, which is the point of the warning.

---

## 1.18.7-nb7

Base: unchanged, upstream **v1.18.7**.

### Fixed — a bank-local DIM with a non-static initialiser

+ `DIM s$ as String = "test"` inside a `CODEBANK` failed to assemble:

  ```
  tes.bas:4273: error: 'LD HL,NN' in the resident program refers to '._st2',
  which lives in CODEBANK 4
  ```

  Only a *compile-time constant* initialiser becomes storage. Every `String`,
  and any expression that is not constant, is deferred by
  `p_var_decl` into a `LET` dropped into the enclosing statement list — which at
  module level is the resident main body, `CODEBANK` block or not. For a
  bank-local variable that is resident code writing into a bank, which the
  assembler rightly rejects.

  So it was never only about strings. All three of these were broken:

  ```basic
  CODEBANK 1
      DIM s$ as String = "test"       ' String: always deferred
      DIM n as uInteger = Src()       ' not constant: deferred
      DIM m as uInteger = seed        ' not constant: deferred
      DIM k as uByte = 85             ' constant: was fine, still is
  END CODEBANK
  ```

+ The fix puts the store where it belongs rather than letting resident code
  reach into a bank. Each deferred initialisation goes into a synthesised
  parameterless SUB bound to that bank, and a call to it takes the `LET`'s
  place — so it runs through the ordinary trampoline with the bank paged in, and
  every existing rule holds unchanged. No new runtime.

  One SUB per initialiser rather than one per bank, so the order of the
  initialisations is exactly the order they were written: a resident statement
  between two `CODEBANK` blocks is still seen by the second and not the first.

  Costs a 6-byte trampoline and a short body per deferred initialiser. A program
  with none is byte-identical.

### Fixed — a stale parser table silently accepted the wrong grammar

+ `utils.get_or_create` cached each built PLY parser under a fixed key with no
  grammar signature, so PLY's own signature check never ran — the point of the
  cache is to avoid calling `yacc.yacc()` at all. Change or add a rule and the
  stale table was reused, giving `Syntax Error. Unexpected token` for perfectly
  valid source until somebody deleted `src/parsetab/tabs.dbm*` by hand.

  It cost this fork two debugging detours during nb6, and produced a **false A/B
  result** — a baseline worktree reported that it could not build a program it
  builds fine. Anyone pulling a fork revision that adds a keyword would have hit
  it too.

  Cache entries now carry a digest of the sources the grammar is derived from
  (`zxbparser.py` + `zxblex.py` + `keywords.py`, and the equivalents for `zxbpp`
  and the two assembler parsers) and are discarded when it changes. An entry
  written by an older version simply misses.

### Added — a worked example for FARPTR

+ `codebanks-fork/examples/bank_far.bas` — an introduction rather than an
  assertion program. A greeting, a tile, and a seven-message text pool, all held
  in bank 1 and read back from the resident program by a numbered walkthrough:
  `FarStr` for a String, `FarCopy` for bulk bytes, `FarPeek` for one, an index
  of offsets read with `FarPeekW` to pick a message by number, and `FarPokeW`
  and a banked SUB as the two ways to update a bank-local variable.

  The text is the point: all seven messages and the greeting live in
  `bank1.bin` (168 bytes) and appear nowhere in the resident binary. They are
  still in the `.nex` — `nexbuild.py` packs every bank blob in with an `!MMU`
  line, or it could not be loaded — but they arrive in a bank page instead of
  in the program. `farmem_test.bas` remains the assertion program;
  the example is verified by instrumenting a copy of it, so the example itself
  stays free of scaffolding.

+ `run_far.py` takes the verdict buffer's address from a `DIM t_verdict(n) as
  uByte` when the program declares one, instead of always reading `$F000`. A
  program whose code window covers `$F000` — `bank_far.bas` puts it at `$E000`,
  and so does the instrumented copy used to verify it — could not otherwise
  self-check at all.

### Tests

+ `Sources/Tests/BankedCode/bankinit_test.bas` — 15 runtime assertions: every
  shape of initialiser in two banks, static and deferred; the order check (a
  resident assignment between the blocks, seen by the second bank and not the
  first); a local `String` default inside a banked routine, which is on the stack
  and must stay unaffected; and resident initialisers for comparison.
+ `Sources/Tests/BankedCode/tes.bas` builds again.
+ Every other program in `Sources/Tests/BankedCode/` is byte-identical to nb6.

---

## 1.18.7-nb6

Base: unchanged, upstream **v1.18.7**.

### Added — FARPTR and far memory access

+ **`FARPTR x`** yields a `uLong` far pointer: the logical bank in bits 16-23,
  the address in bits 0-15. It is the one sanctioned way to name a bank-local
  symbol from outside its bank, which is otherwise an error at the BASIC line
  and again at the assembler.

  ```basic
  CODEBANK 1
      tiles:
      asm
          defb 1, 2, 3, 4, 5, 6
      end asm
  END CODEBANK

  DIM buf(5) as uByte
  FarCopy(FARPTR tiles, @buf(0), 6)
  PRINT FarPeek(FARPTR tiles + 3)
  ```

  It takes the same forms `@` does — `FARPTR name` and `FARPTR arr(3)` with a
  constant subscript — with one deliberate difference: for an array it yields the
  **data** address, not the descriptor. A far pointer to a descriptor would be
  useless, because `__ARRAY` cannot run against a page that is not mapped.

  A resident symbol gives bank 0, and that works rather than merely being
  tolerated: mapping bank 0 restores the boot page, and the address was never in
  the window to begin with.

+ **`#include <farmem.bas>`** — `FarPeek`, `FarPeekW`, `FarPoke`, `FarPokeW`,
  `FarCopy`, `FarCopyTo` and `FarStr`. Each pages the bank into the code window,
  does its work, and restores whatever bank the *caller* was running in, so they
  behave the same called from resident code or from inside another bank.

+ **`FarStr`** is what moves text out of the resident 64K. Given a length-prefixed
  image held in a bank (`defw len` then the characters), it allocates on the
  resident heap and copies through the window, returning an ordinary `String`.
  The characters stay in the bank; only the copy handed to BASIC is resident.

  This is the answer to string literals being resident wherever they are used:
  packing text into a bank has always been possible, but nothing outside that
  bank could read it back.

### How the pointer survives the assembler

`Memory.check_cross_segment_refs` rejects any resident instruction naming a label
in a bank, and that check is the guarantee that makes bank-local data safe to
offer at all. Rather than weaken it, `FARPTR` names an **alias**:

+ `FAR_ADDR_SUFFIX` (`.__faraddr`) joins `FAR_BODY_SUFFIX` in the whitelist. The
  bank pass lays an alias label at the same address as the storage, and the
  pointer names that. So the whitelist stays keyed on compiler-generated suffixes
  that user code cannot produce, exactly as the trampoline's `DEFW _Foo.__far`
  already was.

+ Aliases are emitted only for symbols some `FARPTR` actually names
  (`SymbolRef.has_faraddress`). A label costs no bytes, but emitting them
  unconditionally would still move every existing `.map`.

+ The bank is resolved at **translate** time, not parse time: a module-level asm
  label is not bound to its bank until `bind_module_level_asm` has run. That is
  why `FARADDRESS` is a distinct unary operator rather than a flavour of
  `ADDRESS`.

### Added — checks

+ Error: `FARPTR` of a local or parameter, of a SUB/FUNCTION (call it through its
  trampoline — that is what its ordinary name already is), or of an array element
  with a variable subscript.

### Fixed — the far-call emulator harness

+ `run_far.py` dropped every resident label at `$B000-$BFFF`. It told bank labels
  from resident ones by a leading `"B"`, but `B518` is an ordinary address — so a
  program org'd at `$A000` lost its `finished` label and spun to the step limit
  instead of reporting. `farcall_test16` was affected.

+ `run_far.py` now also accepts a BASIC `finished:` label, which is emitted as
  `.LABEL._finished`; it previously recognised only the raw asm form.

### Tests

+ `Sources/Tests/BankedCode/farmem_test.bas` — 38 runtime assertions on the
  emulator: peek/poke/copy/`FarStr` against two banks holding data at the same
  window addresses, the same calls made from *inside* a bank, and the caller
  reading its own data again after each one to prove the window came back.
  Verified green under an 8K and a 16K window.
+ `tests/functional/arch/zxnext/codebank_farptr.bas` — the golden for all five
  forms, including the resident one that emits no alias.
+ Every program in `Sources/Tests/BankedCode/` and `codebanks-fork/examples/` is
  byte-identical to nb5 — `.bin`, `.map`, `.banks.json` and every bank blob.

---

## 1.18.7-nb5

Base: unchanged, upstream **v1.18.7**.

### Added — 16K code window

+ `codewindowsize` may be **16384**, giving the code window the two MMU slots at
  its address, so one CODEBANK can hold 16K of code. The far-call runtime now
  maps and restores both slots:

  ```asm
          ld   a, (hl)                ; A = physical 8K page
          nextreg __FAR_MMU_REG, a
          inc  hl
          ld   a, (hl)                ; A = page for the window's upper half
          nextreg __FAR_MMU_REG2, a
  ```

  It previously wrote one slot on the way in and one on the way out, so the
  upper half of a 16K window kept whatever was mapped before and code above
  `$7FFF` in a bank was unreachable. Nothing said so: `codewindowsize` had no
  validation at all, and 16384 was accepted in silence.

+ A bank now owns **two consecutive 8K pages** when the window is 16K —
  `physical_page()` strides by the slot count, so `CODEBANK 1` takes pages 40,41
  and `CODEBANK 2` takes 42,43. **Breaking for anyone already laying banks out by
  hand:** `'!codebankpages=` now lists the *first* page of each bank.

  The old stride-1 allocation gave bank 1 pages 40,41 and bank 2 pages 41,42 —
  overlapping. That stayed silent because `claim_range()` compares byte ranges,
  so it only fires once a bank actually exceeds 8K.

+ The bank table carries **two bytes per logical bank** for a 16K window. Banked
  pairs are consecutive, so the second page could have been an `inc a` — but the
  boot row cannot: the stock mapping is `(.., 10, 11, 4, 5, ..)`, so a window at
  `$6000` boots with pages 11 and **4**. `__FAR_INIT` reads both back rather than
  assuming.

+ `codewindowsize` is now reachable as `'!codewindowsize=` and
  `--code-window-size`, matching the other four CODEBANK options. It was
  `#pragma`-only, which is why the 16K path had never been exercised.

### Added — checks

+ Error: a `codewindowsize` that is not 8192 or 16384, a code window that is not
  8K-aligned, or a window running past `$FFFF`.

### Fixed — 13 upstream unit tests the fork had broken

+ `_bind_to_codebank` read `OPTIONS.codebank`, which only exists once
  `Backend.init()` has registered it. Anything exercising the symbol table on
  its own — every test in `tests/api/test_symbolTable.py` and
  `tests/symbols/test_symbolARRAYACCESS.py` — died with
  `UndefinedOptionError: Undefined option 'codebank'`.

  `current_codebank()` now tolerates the options being absent. This went
  unnoticed because the suite was never runnable here: it is pytest-driven and
  pytest was not installed.

### Added — one command to run the tests

+ `codebanks-fork/run-tests.sh` runs the upstream unit and functional suites
  plus this fork's own guards — the CODEBANK examples and the far-call
  emulator — in about a minute. It builds its own virtualenv on first use, so
  it needs neither poetry nor a lockfile install.

  The example builds read `'!org=`, `'!codewindow=`, `'!codewindowsize=` and
  `'!codebank=` out of each source and turn them into flags, the way
  `nextbuild.py` does, rather than hard-coding a layout that goes stale.

+ `codebanks-fork/known-failures.txt` records the 26 functional tests that fail
  on this fork, with the reason for each group, so the sweep reports *changes*
  rather than a count and a new failure cannot hide behind an old one. All 26
  are caused by the fork, deliberately — the goldens embed both the runtime
  library source and the exact code we generate:

  + **19** under `arch/zxnext` — our ZX Next runtime keeps its own
    implementations where upstream stubs out to zx48k, so e.g. `array.asm`
    using a local buffer for `LBOUND_PTR` instead of MEMBOT shows up verbatim
  + **5** under `arch/zx48k` (`dim_at0`, `dimconst2*`) — back-port `f181dc88`
    "detect static expressions better". `DIM x AS Uinteger = @label` in a SUB
    now compiles to a direct store rather than an `LDIR` from a 2-byte blob.
    Ours is the smaller code; upstream v1.19.0's golden still shows the `LDIR`
  + **2** under `cmdline` — back-port `f7849bd6` "fixes wrong sigil allowed"
    emits a diagnostic the expected output predates

### Added — tests

+ `array_test.bas`: 88 runtime assertions over every shape of `DIM` —
  all eight numeric types plus String, 1D/2D/3D, initialisers (including
  nested), explicit bounds, `LBOUND`/`UBOUND` with both literal and variable
  dimensions, locals on the IX frame, `AT` a fixed address and `AT` a label,
  whole-array copy, arrays as parameters, and bank-local arrays including one
  `AT` a bank-local label. It checks itself and leaves a pass/fail byte per
  check, so `run_far.py` reports the source line of anything that failed and
  how far the program got if it died part way.

  Verified by mutation: adding 1 to the element size in the array descriptor
  makes every variable-subscript check fail, while constant-subscript checks
  keep passing — which is right, since those never consult the stride table.

  Float is checked by its stored bytes rather than by comparison: Boriel's
  float arithmetic goes through the Spectrum ROM calculator, which the
  emulator does not have, so a comparison runs off into unmapped memory and
  ends as "step limit exceeded".

  It also prints its own summary, so it can be run on hardware or in CSpect
  without reading 88 bytes out of a memory dump. Boriel implements PRINT
  itself rather than calling the ROM, so that stays runnable under the
  emulator too.

+ `farcall_test16.bas`: a 16K-window program whose routines are deliberately
  pushed past `$7FFF` by a padding blob, so they only execute if the second slot
  is mapped. `run_far.py` now derives the window's slots from the manifest,
  splits a 16K bank across its two pages as the loader does, and asserts that
  **every** window slot is restored to its boot page — which is what catches a
  runtime that restored only the first, or derived the second with `inc a`.

An 8K window is untouched throughout: `window_slots()` is 1, the table stays one
byte per bank, and the second `nextreg` is behind `#ifdef __FAR_WINDOW_16K__`.
The whole `Sources/Tests/BankedCode/` corpus is byte-identical against nb4.

---

## 1.18.7-nb4

Base: unchanged, upstream **v1.18.7**.

### Fixed — `DIM ... AT` inside a CODEBANK

+ An array declared at a bank-local address could not be compiled at all:

  ```basic
  CODEBANK 4
      dim mybuffer(256) as ubyte AT @my_bank_buffer2
      ...
      my_bank_buffer2:
          asm
              defs 256,0
          end asm
  END CODEBANK
  ```

  ```
  error: 'DEFW' in the resident program refers to '.LABEL._my_bank_buffer2',
  which lives in CODEBANK 4
  ```

  `bank_of_var()` returned 0 for anything with `entry.addr` set, on the
  assumption that `DIM x AT addr` emits a bare `EQU`. That holds for a scalar,
  but an array `AT` still emits the descriptor `__ARRAY` indexes through —
  including a word holding the address itself — and that landed in the resident
  variable area pointing into the bank.

  The descriptor now follows the declaration's bank. A scalar `AT` still emits
  no storage and stays resident.

  This also settles an inconsistency: `_bind_to_codebank` never had an `addr`
  guard, so `_check_codebank_access` has always treated an `AT` declaration
  inside a bank as bank-local at the point of use, while its storage was emitted
  resident. The two now agree.

  A constant subscript hid the breakage: `mybuffer(0)` compiles to
  `ld (_mybuffer.__DATA__ + 0), a` off the `EQU` and never touches the
  descriptor. Only a variable subscript goes through `__ARRAY`.

+ Error: a declaration and its `AT` address in different banks — including the
  reverse case, an array declared resident at a banked address. Reported against
  the BASIC line by a new post-parse pass, which is the only place it can live:
  `p_arr_decl` discards the declaration node, so the address expression never
  reaches the program AST and exists only as `entry.addr` in `data_ast`.

### Fixed — line numbers on generated variable storage

+ A diagnostic raised against compiler-generated variable storage reported the
  assembler's own line count against the `.bas` filename — the case above came
  out as line 33 of a 63-line file whose declaration was on line 42. The
  variable passes now emit `#line` markers, so such a diagnostic names the
  declaration it belongs to.

  Only when banking is active, so an ordinary compilation is byte for byte as
  it was. `#line` sets the *current* line, so the marker names the line before
  the declaration, exactly as `visit_ASM` passes the `asm` keyword's own line.

  The variable passes now also expand parked inline-asm text, which is how they
  carry these markers; previously only the main code stream was expanded.

---

## 1.18.7-nb3

Base: unchanged, upstream **v1.18.7**.

### Changed — breaking

+ **A module-level `asm` block written inside a `CODEBANK n` block is now
  compiled into bank n, and no longer runs inline.** It used to be emitted into
  the resident main body and executed as part of the linear program, which is
  never what writing one inside a bank suggests, and which happened silently:

  ```basic
  CODEBANK 1
      my_table:
      asm
          db "h", "i"
      end asm

      SUB Show()
          PRINT PEEK @my_table    ' compiled clean, read a *resident* copy
      END SUB
  END CODEBANK
  ```

  Nothing warned, because a reference from a bank to the resident program is
  always legal. The label and the bytes simply were not in the bank.

  A block that has to execute is migrated by moving it **above** the `CODEBANK`
  block. There is deliberately no warning for this: it would fire on every
  correct use of the feature, and the old behaviour was never useful enough to
  be worth that noise. Check the `.map` if in doubt — a banked label carries a
  `B<n>:` prefix.

  Unaffected, and verified byte-identical:

  + an `asm` block inside a banked SUB or FUNCTION — it already reached the bank
    through the routine body
  + an `asm` block nested in control flow (`IF`, `FOR`, `WHILE`) inside a
    `CODEBANK` block — that is executable code in a control-flow position, so it
    stays resident and runs where it stands
  + an `asm` block outside any `CODEBANK` block

### Added — bank-scope asm and labels

+ A BASIC label naming a diverted block moves into the bank with it, so
  `@my_table` resolves to the bank address and can be read from any routine in
  the same bank. A label is only moved when the next statement is a diverted
  block, so `loop1:` naming ordinary statements stays resident and `GOTO loop1`
  keeps working
+ A bank may now hold nothing but a diverted asm block. It gets its own binary
  and a `__CODE_BANK_TABLE` entry, but does not drag in the far-call runtime,
  and raises `[W320]` because nothing will ever page it in
+ Documented the assembler's own `CODEBANK` pseudo-op as a supported escape
  hatch. It already worked, and places a blob in a bank from resident scope:

  ```basic
  asm
      CODEBANK 1
  my_table:
      db "h", "i"
      CODEBANK 0
  end asm
  ```

### Added — checks and diagnostics

+ Error: a reference to a bank-local label from outside its own bank, reported
  against the BASIC line. The assembler's cross-segment check already caught
  this, but only against a generated assembler line, so it pointed nowhere
  useful
+ Error: an `asm` block whose own `CODEBANK` directives leave the assembler in a
  different segment than it started in. Net balance, not presence, so the escape
  hatch above still passes. This also closes the same hole for an `asm` block
  inside a banked SUB, where it was possible before

### Fixed — in this fork

+ `FunctionTranslator.start()` iterated `sorted(banked)`, a snapshot taken
  before the loop that can add a bank to it. A bank first discovered through a
  nested `FUNCDECL` was silently dropped. Only reachable via `#pragma codebank`
  inside a SUB body, since `CODEBANK` itself is rejected there
+ `[W320]` could be raised twice for a bank holding both data kinds

### Added — documentation

+ `PIPELINE.md` — how source becomes bytes: the lexer's exclusive `asm` state,
  what the parser does and does not put in the AST, the AST passes and their
  ordering constraints, the `##ASMn` inline-asm mechanism, all ten deferral
  hooks, the final splice order, and the assembler's segment model. Written
  because this ground kept being re-explored from scratch

---

## 1.18.7-nb2

Base: unchanged, upstream **v1.18.7**.

### Added — ZX Next runtime fixes

+ `chr.asm` — `CHR$` used the ROM's DEST system variable (23629) as scratch,
  via `TMP EQU 23629`. Writing to sysvars is not safe on the Next, where the
  ROM's expectations about paging and the sysvar area do not hold the way they
  do on a 48K. `TMP` is now a local two-byte buffer inside the routine, the
  same fix already applied to `LBOUND_PTR` in `array/array.asm` (which used
  MEMBOT, 23698)

### Fixed — in this fork

+ A `FOR` loop whose limit sits at the end of the iterator's range never
  terminated. `DIM n AS UBYTE : FOR n = 0 TO 255` compiled to an exit test
  evaluated *after* the increment, so the iterator wrapped `255 -> 0` before it
  could ever exceed the limit and `n > 255` could never be true:

  ```asm
  	inc (hl)          ; n = n + 1, wraps to 0
  	ld a, 255
  	cp h              ; 255 >= n : always true
  	jp nc, loop_body
  ```

  This hit every case where `limit + step` leaves the type's range, not just the
  exact end of it — `UBYTE 0 TO 255`, `BYTE -128 TO 127`, `UINTEGER 0 TO 65535`,
  `UBYTE 255 TO 0 STEP -1`, and partial overflows like `UBYTE 0 TO 250 STEP 10`
  (which terminated, but after 51 iterations of wrapped garbage rather than 26).

  `visit_FOR` now detects the condition when the limit and step are both
  constants, and emits the exit test *ahead* of the increment, against the
  constant-folded `limit - step`. `var <= limit` holds at that point and
  `limit <= TYPE_MAX`, so neither the test nor the increment can wrap. Where
  `limit - step` is not representable the loop can only ever run once, so the
  body falls straight through to the exit.

  Loops that cannot wrap keep the original codegen untouched — same
  instructions, same per-iteration cost, and no change to any existing test
  fixture. `EXIT FOR` and `CONTINUE FOR` targets are unchanged.

  A limit that is not a compile-time constant is still affected: `FOR n = 0 TO m`
  hangs when `m` holds 255 at runtime. Making that safe costs an extra jump on
  every `FOR` loop in the language, so it is deliberately left alone.

  + `TYPE.bounds()` in `src/api/constants.py` — `(min, max)` for an integral
    type, `None` for the rest
  + `_for_wraps_around()` / `_emit_wrap_safe_for()` in
    `src/arch/z80/visitor/translator.py`
  + Fixtures `tests/functional/arch/zxnext/for_wrap_*.bas`, one per shape above

---

## 1.18.7-nb1

Base: upstream **v1.18.7**, plus ten bug fixes cherry-picked from v1.19.0.

Previous state of this tree was an unversioned source drop reporting
`v1.18.4-beta4`, which corresponds to upstream commit `e4d7f4ae` (2025-11-23).

### Added — CODEBANK: banked code for the ZX Spectrum Next

Compiles SUB/FUNCTIONs into 8K banks paged into a code window, so a program is
no longer limited to the flat `$6000-$FFFF` region. Call sites are unchanged.

+ `CODEBANK n` / `END CODEBANK` blocks, and `#pragma codebank = n` for placing a
  whole `#include`d file in a bank
+ Resident 6-byte trampoline per banked routine, under its ordinary mangled
  label, so `visit_CALL` / `visit_FUNCCALL` needed no changes at all
+ Far-call runtime (`src/lib/arch/zxnext/runtime/farcall.asm`): replaces the
  caller's return address rather than pushing a frame, so stdcall arguments stay
  at their usual `(ix+4)`, `(ix+6)` offsets. Preserves every register and the
  interrupt state; only the code window's MMU slot changes
+ Same-bank calls take a fast path: no paging, no shadow-stack frame
+ Output segments in zxbasm — one per bank, sharing one label namespace, so
  banked code reaches resident routines and globals by name
+ `<name>.bank<N>.bin` per bank plus a `<name>.banks.json` manifest, which
  `nextbuild.py` turns into `!MMU` lines
+ Options `codebank`, `codewindow`, `codewindowsize`, `codebankbase`,
  `codebankpages`, `codebankdepth`, available as `'!` directives, `#pragma`, and
  the flags `--code-window`, `--code-bank-base`, `--code-bank-pages`,
  `--code-bank-depth`

### Added — bank-local variables and arrays

+ A `DIM` inside a `CODEBANK` block has its storage emitted into that bank's
  page rather than the resident variable area. Read/write, scalars and arrays,
  and it costs nothing out of the resident 32K
+ Only routines in the same bank may name it, enforced in two layers: a
  front-end check for a BASIC line number, and the assembler's cross-segment
  check as the guarantee — the latter catches `@address`, `ByRef`, whole-array
  copy and hand-written asm, because every access becomes one instruction
  naming the label
+ Strings work unchanged. A bank-local `DIM s$` is a 2-byte descriptor in the
  bank; the characters stay on the resident heap, and literals are always
  resident
+ `INCBIN` into a bank works with no special support — inline asm inside a
  banked SUB is assembled into that bank, and `INCBIN` is a `DEFB` of the file

### Added — checks and diagnostics

+ Error: reference from outside a bank to a label inside it, naming the
  variable and both banks
+ Error: branch from one bank into a different bank
+ Error: bank larger than the code window, listing the largest routines and
  data blocks in it
+ Error: `ORG` inside a bank; code window overlapping the resident program;
  `CODEBANK` inside a SUB/FUNCTION; unmatched `END CODEBANK`; a banked SUB used
  as an `#init` routine
+ `[W310]` bank-local variable passed `ByRef` to a routine in another bank — the
  callee gets an address that is stale once the bank is paged out. The one hole
  neither static check can see
+ `[W320]` a bank holding data but no routine, so nothing pages it in

### Added — ZX Next runtime fixes

Kept as full implementations in `src/lib/arch/zxnext/runtime/`, deliberately
rejecting upstream's move to `#include once [arch:zx48k]` stubs.

+ `mem/alloc.asm` — heap-wrap fix: detect 16-bit address overflow when splitting
  a block and recover the original block instead of corrupting the free list
+ `mem/free.asm` — overflow guards when joining adjacent free blocks
+ `mem/calloc.asm` — zero-length request guard
+ `mem/realloc.asm` — a real realloc that copies, instead of free-then-alloc
+ `str.asm` — `__zxnbackup_sysvar_bank` wrapper so ROM calls run with the right
  bank paged into the slot the ROM expects
+ `array/array.asm` — `LBOUND_PTR` uses a local buffer instead of MEMBOT (23698)

### Fixed — in this fork

+ zxbasm discarded pending temporary label references at a `CODEBANK` switch.
  `1:` / `jr 1f` are resolved only at end of assembly, so references already
  satisfied by earlier code were orphaned and surfaced much later as a bogus
  `Undefined label '1'` out of `dump()`. `set_segment` now flushes them:
  resolves what it can, errors on what it cannot
+ The parser-table cache (`src/parsetab/tabs.dbm*`) is no longer shipped. It is
  a cache of the PLY grammar built without `CODEBANK`, so inheriting upstream's
  copy made every `CODEBANK` statement a syntax error with no clue why
+ `_open_shelve()` in `src/api/utils.py` treats an unreadable parser-table cache
  as a miss rather than a hard failure — which `shelve` backend is chosen
  depends on the interpreter, and this tree is run under both the bundled
  Python 3.12 and the system 3.14

### Fixed — cherry-picked from upstream v1.19.0

v1.19.0 ported both parsers to Lark and requires Python 3.14+, so it is not
reachable by merging. These ten fixes are all in the backend, optimizer and
symbol table, and graft onto this PLY-based tree unchanged:

+ ! Do not insert a dummy `ld hl, 0` in fastcall String functions (`f89b7948`)
+ ! Correctly initialise LBOUND/UBOUND pointers for local arrays under
  `--debug-array` (`5ecc454b`)
+ ! Fix access to array elements by reference (`aabe8407`)
+ ! Fix `bxor16` with `$FFFF` being wrongly optimized (`6335d08d`)
+ ! Fix a bug in type conversion (`8d1240fe`)
+ ! Fix wrong sigil allowed (`be7ac844`)
+ ! Fix crash on undeclared substring assignment (`19c29091`)
+ ! Add a missing assembler parse rule, `pexpr : LP pexpr RP` (`bbe6a4be`)
+ ! Fix zxbasm option handling (`743ae865`)
+ ! Detect static expressions better (`c67bb853`)

### Upstream releases absorbed

From v1.18.4 through v1.18.7:

+ ! Critical fix which prevented using the zxnext arch backend at all (v1.18.6)
+ ! Fix a regression with arrays passed ByRef (v1.18.5)
+ ! Fix `mul` for Long and ULong in the zx48k arch (v1.18.5)
+ ! Fix Fixed-point conversion to Long; consolidate casting of decimals to -INF
  (v1.18.7)
+ ! Fix a bug with arrays and strings (v1.18.4)
+ Add Scroll-Aligned (column-aligned) functions (v1.18.4)
+ Refactor some zxnext runtime libraries to use the zx48k versions (v1.18.5) —
  partially rejected here, see above

### Companion changes outside the compiler

These live in `Scripts/nextbuild.py`, not in this tree, and are noted here only
because they are part of the same work:

+ Read the `<name>.banks.json` manifest and emit the `!MMU` lines for each code
  bank, with a per-bank size summary
+ `'!codewindow=`, `'!codebank=`, `'!codebankpages=`, `'!codebankdepth=`
+ Page-overlap detection rewritten to track byte ranges rather than whole pages.
  `LoadSDBank` takes an in-page offset, so several blobs may legitimately share
  a page; only a real byte overlap is reported. Overlap involving a code bank is
  fatal, data on data is a warning
+ `'!heap=` was parsed into `state.heap` and then ignored — every compile passed
  the config default instead. Now honoured, and the effective value is printed
