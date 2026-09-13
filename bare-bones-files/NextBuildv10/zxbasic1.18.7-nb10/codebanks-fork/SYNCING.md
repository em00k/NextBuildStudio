# Syncing this fork with upstream zxbasic

This tree is a fork of [boriel-basic/zxbasic](https://github.com/boriel-basic/zxbasic)
carrying two sets of local changes:

- **CODEBANK** — ZX Next banked code, plus bank-local variables and arrays.
  See `INTERNALS.md` and `README.md` next to this file.
- **ZX Next runtime fixes** — heap correctness fixes and ROM/sysvar paging
  wrappers in `src/lib/arch/zxnext/runtime/`.

Upstream is **fetch-only**. Nothing here is ever pushed, and the push URL is
deliberately set to a non-existent remote so it cannot happen by accident:

```
origin  https://github.com/boriel-basic/zxbasic  (fetch)
origin  DISABLED_no_push_to_upstream             (push)
```

## Current state

| | |
|---|---|
| Fork version | **1.18.7-nb10** (see `CHANGELOG.md`) |
| Upstream merged to | **v1.18.7**, plus 10 bug fixes cherry-picked from v1.19.0 |
| Fork base commit | `e4d7f4ae` (2025-11-23, between v1.18.3 and v1.18.4) |
| Our change set | 41 files, +1818 / −87 |
| Working branch | `codebank` |

The original tree was a pruned source drop reporting `v1.18.4-beta4`, with no
git history, so the base was identified empirically: for every upstream commit
around that version, count how many files present in both trees differ. The
minimum — 31 modified files — lands on `e4d7f4ae`, and that is what the `fork`
branch is built on. Any other choice silently misattributes upstream's changes
to us, so redo that measurement rather than guessing if the base is ever lost.

## Branches

| Branch | What it is |
|---|---|
| `fork` | our 41-file change set on top of the base commit — the thing to rebase/merge, never delete |
| `codebank` | `fork` merged with upstream v1.18.7. The branch NextBuild builds against |
| `wip-v1.19.0` | abandoned v1.19.0 merge, kept for reference — see below |

## How to sync to a new upstream release

```bash
cd zxbasic1.18.7            # or wherever this tree lives
git fetch origin --tags
git checkout codebank
git merge vX.Y.Z
# resolve, then:
rm -f src/parsetab/tabs.dbm*        # REQUIRED - see below
```

Then run everything before switching `ZXBASIC=` in `Scripts/nextbuild.config`:

```bash
./codebanks-fork/run-tests.sh
```

That is the upstream unit and functional suites plus this fork's own guards —
the CODEBANK examples and the far-call emulator — in about a minute. The first
run builds a virtualenv in `venv/` (already gitignored) and installs pytest into
it; upstream's own `poetry run poe test` needs poetry and a lockfile install,
this needs neither.

**After a merge, expect the functional sweep to report changes** against
`codebanks-fork/known-failures.txt`. All 26 entries are caused by this fork
deliberately — the goldens embed both the runtime library source and the exact
code we generate — and that file explains each group. It exists so that a new
failure cannot hide behind an old one. Read every difference before refreshing
it: delete the file and re-run `--func` to re-record.

Then bump the fork version: `src/zxbc/version.py`, `src/zxbasm/version.py` and
`.bumpversion.cfg` all carry `1.18.7-nb1`, and upstream bumps those files every
release, so expect a one-line conflict on each merge. Take ours and rebase the
number onto the new base (`1.18.8-nb1`, and so on). Record what changed in
`CHANGELOG.md`.

### Two things that will bite you

**1. Delete the parser tables after every merge.** Upstream checks in
`src/parsetab/tabs.dbm.{bak,dat,dir}` — a cache of the PLY grammar, built
without `CODEBANK`. Inheriting it makes *every* `CODEBANK` statement a syntax
error, with no hint as to why. They rebuild on first run. This fork gitignores
them and does not ship them.

Related: which dbm backend `shelve` picks depends on the interpreter (the
bundled `python/` is 3.12, the system one may be 3.14), so a cache written by
one is unreadable by the other. `_open_shelve()` in `src/api/utils.py` treats an
unreadable cache as a miss instead of a hard failure. Keep that.

**2. Upstream is dissolving the zxnext runtime.** From v1.18.7 onward, files
under `src/lib/arch/zxnext/runtime/` are being replaced one by one with
one-line stubs:

```asm
#include once [arch:zx48k] <mem/alloc.asm>
```

24 files were stubs at v1.18.7. Six of them are files we have modified, and for
those **we keep our full implementation and reject the stub** — resolve with
`git checkout --ours`. They are:

| File | Our change |
|---|---|
| `mem/alloc.asm` | heap-wrap fix: 16-bit overflow when splitting a block |
| `mem/free.asm` | overflow guards when joining adjacent free blocks |
| `mem/calloc.asm` | zero-length request guard |
| `mem/realloc.asm` | real realloc with copy, instead of free-then-alloc |
| `str.asm` | `__zxnbackup_sysvar_bank` wrapper around the ROM call |
| `array/array.asm` | `LBOUND_PTR` uses a local buffer, not MEMBOT (23698) |

The cost is that these six no longer inherit upstream fixes to the zx48k
versions. On each sync, diff `src/lib/arch/zx48k/runtime/` for the same files
and port anything worth having by hand.

There is no duplicate-label clash from mixing our full files with upstream's
stubs — verified by building every example — but re-check it after each merge,
because a stub pulling in `[arch:zx48k] <mem/alloc.asm>` alongside our zxnext
`alloc.asm` would define `__MEM_ALLOC` twice.

## Upstream behaviour changes that bite

Upstream sometimes changes what valid BASIC *means*, not just how it compiles.
Those do not show up as merge conflicts and the test suites do not catch them —
the goldens get updated on upstream's side, so both sides look green. They are
found by a program going wrong. Record each one here when it costs a debugging
session.

### `@array` is the descriptor, not the data — since v1.18.3

Commit **`4b8832a1`** *"Fixes @array label emission"* removed

```python
if node.token == "VARARRAY":
    return node.data_label
```

from `traverse_const`, folding `VARARRAY` into the `ID … has_address` branch that
returns `node.mangled`. So:

| | 1.18.2 and earlier | 1.18.3 onwards |
|---|---|---|
| `@arr` | `_arr.__DATA__` — first element | `_arr` — the **descriptor** |
| `@arr(0)` | `_arr.__DATA__` | `_arr.__DATA__` |

The descriptor is a pointer to the dimension table, then the data pointer, then
the two bound pointers. Code that walks `@arr` with `PEEK` reads that header
instead of the data — silently. It cost a session: a 128-sprite demo drew one
sprite 128 times.

**We follow upstream on this** rather than reverting, so that source stays
portable. `[W920]` was added to make it loud; see `errmsg.warning_addressof_array`
and `zxbparser.p_addr_of_id`. Do not revert the upstream behaviour on a future
merge — keep the warning instead.

## PLY table rebuilds are quiet by default

Rebuilding the parser tables printed two dozen `Token 'NEXTREG' defined, but not
used` lines and wrote a 2.6 MB `parser.out`. Harmless, but it appeared in front
of whoever was compiling a program, and it got commoner once the table cache
learned to notice a changed grammar — every compiler update now triggers it.

`utils.ply_yacc_kwargs()` turns `debug` off and installs `_QuietPlyLogger`, which
drops **only** the unused-token/unused-rule hygiene lines. Shift/reduce and
reduce/reduce conflicts still print, and errors are untouched — a broken grammar
still fails loudly.

When working on a grammar, put it all back:

```
ZXB_PARSER_DEBUG=1 python3 zxbc.py …
```

That restores every PLY message and writes `parser.out`, which is now gitignored
rather than tracked: it is generated, it is 2.6 MB, and it was being committed as
churn on every grammar change.

## Fork warning codes live at 900+

Upstream numbers its warnings from 100 and has reached 300. Anything this fork
registers in the 3xx range is standing where upstream's next warning will land —
which is what happened to `W310`/`W320`, renumbered to `W900`/`W910` in nb8.

**Never register a fork warning below 900.** `register_warning` takes any string
and `is_valid_warning_code` only checks membership, so the block costs nothing to
maintain, and upstream would need sixty more warnings to reach it.

## Our own fixes to upstream code

Bugs found and fixed here that upstream does not have a fix for yet. On a sync,
check whether upstream fixed each one differently before resolving conflicts.
If they did, prefer their fix, but keep our regression tests.

| Since | File | Fixes |
|---|---|---|
| nb10 | `src/arch/z80/optimizer/flow_graph.py` (`_compute_calls`, `_find_exits`) | `-O4` lost the return edge of any SUB that branches, and deleted register loads after `IF … THEN Sub()`. Tests: `test_call_ret_*` in `test_basicblock.py`, `test_label_after_call_keeps_registers`, and functional `opt4_call_merge`. Draft upstream report: `upstream-report-O4-call-return.md` |

## v1.19.0 is a port, not a merge

v1.19.0 is **not** reachable by merging. Two hard blockers:

1. **The parsers were rewritten in Lark.** `src/zxbc/zxbparser.py` went from 233
   PLY rules to 0, and `src/zxbasm/asmparse.py` from 58 to 0. Both are now
   driven by generated standalone parsers (`zxbparser_standalone.py`,
   `asmparse_standalone.py`, `asmparse_zxnext_standalone.py`). **The `.lark`
   grammar source is not in the repository** — only the generated output — so
   adding the `CODEBANK` rules means either obtaining the grammar upstream or
   reconstructing it.
2. **Python 3.14+ is required.** The bundled interpreter is 3.12.11, so
   NextBuild could not run it as-is.

Everything else merges: the trial merge produced only 11 conflicts, of which 9
were resolved easily. The branch `wip-v1.19.0` has that work, with
`asmparse.py` and `zxbparser.py` left conflicted — those two are the port.

### Bug fixes already cherry-picked from v1.19.0

Rather than port, the v1.19.0 *bug fixes* were back-ported individually. All ten
live in the backend, optimizer and symbol table — none in the rewritten parser —
so they graft onto this PLY-based tree. Each is a separate commit carrying
`(cherry picked from commit ...)`, so a future sync can see what is already here:

| Upstream | Fixes |
|---|---|
| `c67bb853` | detect static expressions better |
| `6335d08d` | `bxor16` with `$FFFF` wrongly optimized |
| `f89b7948` | dummy `ld hl, 0` inserted in fastcall String functions |
| `5ecc454b` | LBOUND/UBOUND not initialised for local arrays under `--debug-array` |
| `743ae865` | zxbasm option handling |
| `aabe8407` | array element access by reference broken |
| `bbe6a4be` | missing assembler parse rule (`pexpr : LP pexpr RP`) |
| `19c29091` | crash on undeclared substring assignment |
| `be7ac844` | wrong sigil allowed |
| `8d1240fe` | type conversion bug |

Three needed hand-resolution, none of it interesting: `pyproject.toml` and
`poetry.lock` version bumps (took ours), the checked-in parser tables (kept
deleted), and `src/api/utils.py` — there the upstream hunk changed
`shelve.open(path)` to `shelve.open(path, protocol=5, flag="c")`, which was
folded *inside* our `_open_shelve()` wrapper rather than replacing it.
`src/api/check.py` conflicted only through context drift from a later
type-annotation pass; the incoming version was taken whole.

`5ecc454b` is the one to re-check if it is ever reapplied: it edits the same
block in `function_translator.py` that CODEBANK routes through
`_deferred_bound_tables`. The two are orthogonal — it decides *which* bound
tables exist, ours decides *where* they are emitted — and this was verified by
compiling a banked local array with `--debug-array` and confirming
`_Work.t.__LBOUND__` lands resident (`$92E7`), not in the bank.

### Remaining v1.19.0 grammar work, if ever attempted

Our CODEBANK grammar to re-express is small:

- `preproc_line : CODEBANK NUMBER | CODEBANK INTEGER` and
  `preproc_line : END CODEBANK` (`src/zxbc/zxbparser.py`)
- `asm : CODEBANK expr | CODEBANK pexpr` (`src/zxbasm/zxnext.py`)
- the `ORG`-inside-a-bank guard (`src/zxbasm/asmparse.py`)

Everything else in the fork is ordinary Python and ports unchanged.

## Rolling back

`Scripts/nextbuild.config` selects the toolchain:

```
ZXBASIC=zxbasic1.18.7
```

Point it back at `zxbasic1.18.4` to return to the pre-sync compiler. That tree
is untouched by this sync.
