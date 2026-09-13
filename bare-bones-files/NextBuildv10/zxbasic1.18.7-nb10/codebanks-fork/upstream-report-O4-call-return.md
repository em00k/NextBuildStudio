# Draft bug report: `-O4` loses registers at a label straight after a call

> **Status: draft. Not sent.** This is written for
> [boriel-basic/zxbasic](https://github.com/boriel-basic/zxbasic/issues) in case
> we decide to report it. It contains nothing specific to this fork: the
> reproducer, the analysis and the patch all apply to upstream **v1.18.7** as
> released, and `_compute_calls` in `src/arch/z80/optimizer/flow_graph.py` is
> unchanged on `main` as of 2026-09-11. Fixed here in `1.18.7-nb10`, see
> `CHANGELOG.md`.

---

## Summary

At `-O4` the optimiser can delete a register load that sits after a label placed
straight after a `CALL`. It happens when the called SUB contains a branch, so
the resulting program reads the wrong data. `-O3` and lower are correct.

The usual shape is `IF cond THEN Sub()` followed by an array access. The `ld l, a`
and `ld h, 0` that widen a `UBYTE` index are removed, so `a(s)` reads the element
at whatever HL the SUB left behind.

## Reproducer

```basic
DIM a(11) AS UBYTE => {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11}
DIM s AS UBYTE
DIM g AS UBYTE
DIM w AS UINTEGER

SUB Other()
    IF g = 3 THEN
        w = w + 12345
    ELSE
        w = w - 1
    END IF
    POKE 30000, g
END SUB

SUB Take(v AS UBYTE)
    POKE 30001, v
END SUB

SUB Test()
    w = s
    IF g <> 0 THEN
        Other()
    END IF
    Take(a(s))
END SUB

s = 5
g = 1
Test()
```

Build it with `zxbc test.bas -O4 -S 32768 -o test.bin`, run it, and read address
30001. It should hold `a(5)` = **5**.

| | `-O3` | `-O4` |
|---|---|---|
| v1.18.7 | 5 | **4** |
| v1.18.7 + patch below | 5 | 5 |

(These results come from running the binary on a Z80 emulator, the `z80` PyPI
package: load at 32768, run to a return breakpoint.)

### Generated code for `Test`

`-O3`, correct:

```asm
_Test:
	ld a, (_s)
	ld l, a
	ld h, 0
	ld (_w), hl
	ld a, (_g)
	or a
	jp z, .LABEL.__LABEL3
	call _Other
.LABEL.__LABEL3:
	ld a, (_s)
	ld l, a
	ld h, 0
	push hl
	ld hl, _a
	call .core.__ARRAY
```

`-O4`, wrong:

```asm
.LABEL.__LABEL3:
	ld a, (_s)
	push hl              ; <- `ld l, a` and `ld h, 0` deleted
	ld hl, _a
	call .core.__ARRAY
```

On the path that skips the call, HL does still hold `s`, zero-extended by
`w = s`. On the path through `Other()`, HL holds `w - 1` (so 4) or `w + 12345`,
and `a()` is indexed with that.

## Cause

`zxbc -O4 -d` shows the flow graph:

```
BASIC BLOCK 6            (Other's last block)
    .LABEL.__LABEL1:
    ld a, (_g)
    ld (30000), a
    _Other__leave:
    ret
Goes to: []              <- should include block 10

BASIC BLOCK 10
    .LABEL.__LABEL3:
    ...
Comes from: [8]          <- only the `jp z`; block 9 (`call _Other`) is missing
```

- **Where the return edge should come from.** `_split_block()` removes a call's
  fall-through edge. `_compute_calls()` is then supposed to add it back, by
  walking from the callee's entry to each `ret` and linking that `ret` block to
  `caller.next`.
- **Why the edge is missing.** The walk only continues through blocks that do not
  branch, conditional `ret`s and conditional `call`s. It stops at any `jp`, `jr`
  or `djnz`, and at an unconditional nested `call`:

  ```python
  if bb[-1].inst in {"call", "rst"}:  # A call from this block
      if bb[-1].condition_flag:
          pending.add((caller, bb.next))
  # jp / jr / djnz: nothing is queued
  ```

  So the `ret` of any SUB that branches before returning is never linked (almost
  every SUB branches). `Take` has no branches, so its `ret` is linked.
- **How `-O4` then goes wrong.** In `BasicBlock.optimize()`,
  `guesses_initial_state_from_origin_blocks()` intersects the final CPU states of
  `comes_from`. With the call path missing, block 10 takes block 8's state as
  fact, so the peephole patterns delete "redundant" reloads of HL.
- **Second effect: liveness.** `is_used()` falls through to `goes_requires()` on
  the `ret` block. That block has no `goes_to`, so a register the caller reads
  after the call can be judged dead inside the callee.

It only produces wrong code when a label follows the call and the other
predecessors agree on a register value. That is why it is rare and hard to spot.

## Patch

Walk every way execution can continue inside the callee, not just the fall-through:

- follow `jp`/`jr`/`djnz` targets;
- follow the next block after a conditional branch and after any nested call;
- treat a jump that cannot be followed, such as `jp (hl)` or an undefined label, as a
  possible exit.

Exits are computed once per callee rather than once per call site. Extra edges
only make the register intersection and the liveness checks more cautious.

```diff
--- a/src/arch/z80/optimizer/flow_graph.py
+++ b/src/arch/z80/optimizer/flow_graph.py
@@ -73,33 +73,72 @@
             labels[op].basic_block.called_by.add(bb)
             calling_blocks[bb] = labels[op].basic_block
 
-    # For the annotated blocks, trace their goes_to, and their goes_to from
-    # their goes_to and so on, until ret (unconditional or not) is found, and
-    # save that block in a set for later
-    visited: set[tuple[BasicBlock, BasicBlock]] = set()
-    pending: set[tuple[BasicBlock, BasicBlock]] = set(calling_blocks.items())
+    # Link every `ret` a callee can reach back to the instruction after each of
+    # its calls. _split_block removed the call's fall-through edge, so this is
+    # the only way the block after a call learns it is entered from the callee.
+    # A missed `ret` leaves that block believing it is reached only from its
+    # other predecessors: at -O4 it then inherits their register values (a
+    # label straight after `if ... then Sub()` got HL from the path that skipped
+    # the call, and array indices lost their `ld l, a` / `ld h, 0`), and values
+    # the callee returns look dead. So every way execution can continue is
+    # followed: jumps, fall-through after a conditional branch, and the return
+    # from a nested call. Extra edges only make both analyses more cautious.
+    exits: dict[BasicBlock, set[BasicBlock]] = {}
+    for caller, entry in calling_blocks.items():
+        if entry not in exits:
+            exits[entry] = _find_exits(entry, labels)
+
+        for bb in exits[entry]:
+            bb.add_goes_to(caller.next)
+
+
+def _find_exits(entry: BasicBlock, labels: LabelsDict) -> set[BasicBlock]:
+    """Returns the blocks that can leave the routine starting at `entry`: those
+    ending in a ret, plus any jump target that cannot be followed (e.g. `jp (hl)`
+    or an undefined label, both of which resolve to a DummyBasicBlock whose
+    code is a bare `ret`).
+    """
+    result: set[BasicBlock] = set()
+    visited: set[BasicBlock] = set()
+    pending: list[BasicBlock] = [entry]
 
     while pending:
-        caller, bb = pending.pop()
-        if (caller, bb) in visited:
+        bb = pending.pop()
+        if bb is None or bb in visited:
             continue
 
-        visited.add((caller, bb))
+        visited.add(bb)
 
-        if not bb[-1].is_ender:  # if it does not branch, search in the next block
-            pending.add((caller, bb.next))
+        if not len(bb):
+            pending.append(bb.next)
             continue
 
-        if bb[-1].inst in {"ret", "reti", "retn"}:
-            if bb[-1].condition_flag:
-                pending.add((caller, bb.next))
+        last = bb[-1]
+        if not last.is_ender:  # it does not branch: execution runs into the next block
+            pending.append(bb.next)
+            continue
 
-            bb.add_goes_to(caller.next)
+        if last.inst in {"ret", "reti", "retn"}:
+            result.add(bb)
+            if last.condition_flag:
+                pending.append(bb.next)
+            continue
+
+        if last.inst in {"call", "rst"}:  # a nested call returns to the next block
+            pending.append(bb.next)
             continue
 
-        if bb[-1].inst in {"call", "rst"}:  # A call from this block
-            if bb[-1].condition_flag:  # if it has conditions, it can return from the next block
-                pending.add((caller, bb.next))
+        # jp, jr, djnz
+        if last.condition_flag or last.inst == "djnz":
+            pending.append(bb.next)
+
+        target = last.branch_arg
+        if target in labels:
+            pending.append(labels[target].basic_block)
+        else:
+            result.add(bb)
+
+    return result
 
 
 def _get_jump_labels(main_basic_block: BasicBlock, labels: LabelsDict) -> set[str]:
```

## Tests

All four new tests fail without the patch and pass with it.

`tests/arch/zx48k/optimizer/test_basicblock.py`:

- `test_call_ret_after_branch`: a callee with `jp nz` before `ret`. Its `ret`
  block must appear in `comes_from` of the block after the call.
- `test_call_ret_after_nested_call`: a callee doing `call __UNKNOWN` before `ret`.
- `test_call_ret_through_indirect_jump`: a callee leaving by `pop hl / jp (hl)`.
  The block after the call must not end up with an empty `comes_from`.

`tests/arch/zx48k/optimizer/test_optimizer.py`:

- `test_label_after_call_keeps_registers`: the asm above at level 4. Checks that
  `ld l, a` / `ld h, 0` survive after the label.

`tests/functional/arch/zx48k/opt4_call_merge.bas` (+ `.asm`): the reproducer
without the `POKE` check.

Results with the patch:

- Unit suites: 354 passed (350 before, plus the 4 above).
- Functional sweep: **no existing golden changed**. The only addition is the new
  `opt4_call_merge` test.

## Impact seen in real programs

We compiled 299 real ZX Next programs at `-O4` with and without the patch, with
`PYTHONHASHSEED=0`. Four programs changed.

- In three of the four, the patch **restored a deleted register load** at a label
  after `IF … THEN Sub()`. In each case the original was a miscompile: a game
  drew a sinking ship with a random hull size, and a music player compared a
  keypress against a stale L.
- The only other change is one byte in one program: `ld a, (_y)` became
  `ld hl, (_y) / ld a, l` before a SUB's `ret`. The newly linked return edge
  makes HL look live. That is over-cautious, but correct.

## Aside: `-O3`/`-O4` output depends on the hash seed

Compiling the same file twice at `-O3` or `-O4` can give different code. `-O2`
and below are stable.

The jumps-over-jumps loop in `optimizer/main.py` iterates
`for label in self.JUMP_LABELS`, which is a `set` of strings. How far a chain of
jumps gets threaded therefore depends on `PYTHONHASHSEED`: in one run
`jp .LABEL.__LABEL6` still lands on `.LABEL.__LABEL6: jp .LABEL.__LABEL3`, and
in another run it becomes `jp .LABEL.__LABEL3`.

Both are correct and the same size, but the binaries differ from build to build,
which breaks reproducible builds and makes listings hard to diff. In one real
program, five `-O4` compiles gave four different listings.

Iterating in a fixed order, for example `sorted(self.JUMP_LABELS)`, is the likely
fix, but we have not tried it. This probably belongs in a separate issue.
